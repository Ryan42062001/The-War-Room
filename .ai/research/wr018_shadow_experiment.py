from __future__ import annotations
import hashlib, io, json, math
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import pandas as pd
import requests
from scipy.stats import spearmanr
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

OWNER='nflverse'; REPO='nflverse-data'; TAG='stats_player'
SEASONS=list(range(2012,2026)); HOLDS=[2022,2023,2024,2025]; POS=['QB','RB','WR','TE']; MIN_GAMES=4
FREEZE=datetime.fromisoformat('2026-09-10T00:20:00+00:00')
OUT=Path('.ai/research/generated'); OUT.mkdir(parents=True,exist_ok=True)
REQ=['season','season_type','player_id','position','fantasy_points_ppr','attempts','carries','targets','receptions','passing_yards','passing_tds','passing_interceptions','rushing_yards','rushing_tds','receiving_yards','receiving_tds']
SUMS=['fantasy_points_ppr','attempts','carries','targets','receptions','passing_yards','passing_tds','passing_interceptions','rushing_yards','rushing_tds','receiving_yards','receiving_tds','passing_epa','rushing_epa','receiving_epa']
AVGS=['target_share','air_yards_share','wopr']
FEATURES=['prev1_ppr_pg','prev1_games','prev1_attempts_pg','prev1_carries_pg','prev1_targets_pg','prev1_receptions_pg','prev1_pass_yards_pg','prev1_pass_tds_pg','prev1_int_pg','prev1_rush_yards_pg','prev1_rush_tds_pg','prev1_rec_yards_pg','prev1_rec_tds_pg','prev1_pass_epa_pg','prev1_rush_epa_pg','prev1_rec_epa_pg','prev1_target_share','prev1_air_yards_share','prev1_wopr','prev2_ppr_pg','prev2_games','ppr_delta','weighted_ppr_pg','has_prev2']
TOPN={'QB':12,'RB':24,'WR':36,'TE':12}

S=requests.Session(); S.headers.update({'User-Agent':'war-room-wr018-research','Accept':'application/vnd.github+json'})
def getj(url):
    r=S.get(url,timeout=60); r.raise_for_status(); return r.json()

def resolve_assets():
    rel=getj(f'https://api.github.com/repos/{OWNER}/{REPO}/releases/tags/{TAG}')
    assets=[]; page=1
    while True:
        a=getj(f"{rel['assets_url']}?per_page=100&page={page}"); assets+=a
        if len(a)<100: break
        page+=1
    by={a['name']:a for a in assets}; out={}
    for y in SEASONS:
        name=f'stats_player_regpost_{y}.csv'; a=by.get(name)
        assert a, f'missing official asset {name}'
        assert a['browser_download_url'].startswith(f'https://github.com/{OWNER}/{REPO}/releases/download/{TAG}/')
        out[y]=a
    return out

def download(a):
    r=S.get(a['browser_download_url'],timeout=120); r.raise_for_status(); b=r.content
    sha=hashlib.sha256(b).hexdigest(); gd=a.get('digest')
    if gd and gd.startswith('sha256:'): assert gd[7:]==sha, f"digest mismatch {a['name']}"
    return b,sha

def aggregate(y,b):
    df=pd.read_csv(io.BytesIO(b),low_memory=False)
    miss=[c for c in REQ if c not in df.columns]; assert not miss, f'{y} missing {miss}'
    df=df[(df.season_type.astype(str).str.upper()=='REG') & df.position.astype(str).str.upper().isin(POS)].copy()
    for c in SUMS+AVGS:
        if c not in df: df[c]=np.nan
    rows={}
    for pid,g in df.groupby('player_id',dropna=True):
        if 'week' in g.columns:
            games=g.week.dropna().astype(str).nunique()
        elif 'games' in g.columns:
            gv=pd.to_numeric(g['games'],errors='coerce').dropna(); games=int(gv.max()) if len(gv) else 0
        else:
            raise AssertionError(f'{y} missing both week and games denominator')
        if not games: continue
        sm={c:pd.to_numeric(g[c],errors='coerce').fillna(0).sum()/games for c in SUMS}
        av={c:pd.to_numeric(g[c],errors='coerce').mean() for c in AVGS}
        name=(g.get('player_display_name',g.get('player_name')).dropna().astype(str).iloc[-1] if ('player_display_name' in g or 'player_name' in g) else str(pid))
        p=str(g.position.dropna().astype(str).iloc[-1]).upper()
        rows[str(pid)]={'season':y,'player_id':str(pid),'player_name':name,'position':p,'games':int(games),'ppr_pg':sm['fantasy_points_ppr'],'attempts_pg':sm['attempts'],'carries_pg':sm['carries'],'targets_pg':sm['targets'],'receptions_pg':sm['receptions'],'pass_yards_pg':sm['passing_yards'],'pass_tds_pg':sm['passing_tds'],'int_pg':sm['passing_interceptions'],'rush_yards_pg':sm['rushing_yards'],'rush_tds_pg':sm['rushing_tds'],'rec_yards_pg':sm['receiving_yards'],'rec_tds_pg':sm['receiving_tds'],'pass_epa_pg':sm['passing_epa'],'rush_epa_pg':sm['rushing_epa'],'rec_epa_pg':sm['receiving_epa'],'target_share':0 if pd.isna(av['target_share']) else float(av['target_share']),'air_yards_share':0 if pd.isna(av['air_yards_share']) else float(av['air_yards_share']),'wopr':0 if pd.isna(av['wopr']) else float(av['wopr'])}
    return rows,list(df.columns),len(df)

def feat(y,pid,by):
    p1=by.get(y-1,{}).get(pid)
    if not p1 or p1['games']<MIN_GAMES: return None
    p2=by.get(y-2,{}).get(pid); h=bool(p2 and p2['games']>=MIN_GAMES); p2pg=p2['ppr_pg'] if h else p1['ppr_pg']
    return [p1['ppr_pg'],p1['games'],p1['attempts_pg'],p1['carries_pg'],p1['targets_pg'],p1['receptions_pg'],p1['pass_yards_pg'],p1['pass_tds_pg'],p1['int_pg'],p1['rush_yards_pg'],p1['rush_tds_pg'],p1['rec_yards_pg'],p1['rec_tds_pg'],p1['pass_epa_pg'],p1['rush_epa_pg'],p1['rec_epa_pg'],p1['target_share'],p1['air_yards_share'],p1['wopr'],p2pg,p2['games'] if h else 0,p1['ppr_pg']-p2pg,.7*p1['ppr_pg']+.3*p2pg,1 if h else 0]

def examples(by):
    out=[]
    for y in range(2014,2026):
        for pid,t in by.get(y,{}).items():
            if t['position'] not in POS or t['games']<MIN_GAMES: continue
            x=feat(y,pid,by); prev=by.get(y-1,{}).get(pid)
            if x is None or not prev or prev['position']!=t['position']: continue
            out.append({'targetSeason':y,'player_id':pid,'player_name':t['player_name'],'position':t['position'],'x':x,'y':t['ppr_pg'],'naive':prev['ppr_pg']})
    return out

def models(train):
    X=np.array([e['x'] for e in train],float); y=np.array([e['y'] for e in train],float)
    ridge=make_pipeline(StandardScaler(),Ridge(alpha=10.0)).fit(X,y)
    boost=GradientBoostingRegressor(n_estimators=150,learning_rate=.05,max_depth=2,min_samples_leaf=8,random_state=18018,loss='squared_error').fit(X,y)
    return ridge,boost

def metrics(rows,key):
    y=np.array([r['y'] for r in rows]); p=np.array([r[key] for r in rows]); rho=float(spearmanr(y,p).statistic) if len(rows)>2 else 0
    return {'n':len(rows),'mae':float(mean_absolute_error(y,p)),'rmse':float(math.sqrt(mean_squared_error(y,p))),'spearman':rho}

def rank_top(rows,key,pos):
    rankerr=[]; hits=tot=0; per=[]
    for y in HOLDS:
        rs=[r for r in rows if r['position']==pos and r['targetSeason']==y]
        if not rs: continue
        act=sorted(rs,key=lambda r:r['y'],reverse=True); pred=sorted(rs,key=lambda r:r[key],reverse=True)
        ar={r['player_id']:i+1 for i,r in enumerate(act)}; pr={r['player_id']:i+1 for i,r in enumerate(pred)}
        rankerr += [abs(ar[r['player_id']]-pr[r['player_id']]) for r in rs]
        n=min(TOPN[pos],len(rs)); true={r['player_id'] for r in act[:n]}; h=sum(r['player_id'] in true for r in pred[:n]); hits+=h; tot+=n
        per.append({'season':y,'cohort_n':len(rs),'top_n':n,'hits':h,'precision_recall':h/n if n else 0})
    return {'rank_mae':float(np.mean(rankerr)) if rankerr else None,'top_n_overlap':hits/tot if tot else None,'perSeason':per}

def boot(rows,key,n=1000):
    rng=np.random.default_rng(18018+len(key)); d=np.array([abs(r['y']-r[key])-abs(r['y']-r['naive']) for r in rows]); vals=[]
    for _ in range(n): vals.append(float(np.mean(rng.choice(d,size=len(d),replace=True))))
    return {'mean_delta_mae_vs_naive':float(np.mean(vals)),'ci95_low':float(np.quantile(vals,.025)),'ci95_high':float(np.quantile(vals,.975))}

def run():
    now=datetime.now(timezone.utc); assets=resolve_assets(); by={}; aman=[]
    for y in SEASONS:
        a=assets[y]; print('download',a['name'],flush=True); b,sha=download(a); rows,cols,n=aggregate(y,b); by[y]=rows
        aman.append({'season':y,'asset_id':a['id'],'name':a['name'],'size':a['size'],'updated_at':a['updated_at'],'browser_download_url':a['browser_download_url'],'github_digest':a.get('digest'),'verified_sha256':sha,'regular_rows':n,'modeled_players':len(rows),'columns':cols})
    ex=examples(by); preds=[]; train_summary=[]
    for hy in HOLDS:
        for p in POS:
            tr=[e for e in ex if e['position']==p and e['targetSeason']<hy]; te=[e for e in ex if e['position']==p and e['targetSeason']==hy]
            assert len(tr)>=60 and len(te)>=10,(hy,p,len(tr),len(te)); ridge,boost=models(tr); X=np.array([e['x'] for e in te],float)
            rp=np.maximum(0,ridge.predict(X)); bp=np.maximum(0,boost.predict(X)); train_summary.append({'targetSeason':hy,'position':p,'train_n':len(tr),'test_n':len(te)})
            for e,r,b in zip(te,rp,bp): preds.append({**e,'ridge':float(r),'boost':float(b)})
    outm={'pooled':{},'by_position':{},'rank_topn':{},'bootstrap':{}}
    for k in ['naive','ridge','boost']: outm['pooled'][k]=metrics(preds,k)
    for p in POS:
        pr=[r for r in preds if r['position']==p]; outm['by_position'][p]={k:metrics(pr,k) for k in ['naive','ridge','boost']}; outm['rank_topn'][p]={k:rank_top(preds,k,p) for k in ['naive','ridge','boost']}
    outm['bootstrap']['ridge_vs_naive']=boot(preds,'ridge'); outm['bootstrap']['boost_vs_naive']=boot(preds,'boost')
    base=outm['pooled']['naive']['mae']; lifts={k:(base-outm['pooled'][k]['mae'])/base for k in ['ridge','boost']}
    best=max(lifts,key=lifts.get); ci=outm['bootstrap'][f'{best}_vs_naive']; lift=lifts[best]
    result='PROMISING — CONTINUE VALIDATION' if lift>=.05 and ci['ci95_high']<0 else ('MORE EVIDENCE NEEDED' if lift>0 or ci['ci95_low']<0 else 'DO NOT PURSUE')
    snap=[]; clean=now<FREEZE
    if clean:
        for p in POS:
            tr=[e for e in ex if e['position']==p and e['targetSeason']<=2025]; ridge,boost=models(tr)
            eligible=[]
            for pid,prev in by[2025].items():
                if prev['position']!=p or prev['games']<MIN_GAMES: continue
                x=feat(2026,pid,by)
                if x is not None: eligible.append((pid,prev,x))
            if eligible:
                X=np.array([x for _,_,x in eligible],float); rp=np.maximum(0,ridge.predict(X)); bp=np.maximum(0,boost.predict(X))
                for (pid,prev,_),r,b in zip(eligible,rp,bp): snap.append({'player_id':pid,'player_name':prev['player_name'],'position':p,'prior_2025_games_observed':prev['games'],'naive_prev_ppr_pg':prev['ppr_pg'],'ridge_shadow_ppr_pg':float(r),'boost_shadow_ppr_pg':float(b),'rookie_or_no_2025_history':False})
    results={'task_id':'WR-018','classification':'EXPERIMENTAL / NON-PRODUCTION','generated_at_utc':now.isoformat(),'source':{'owner':OWNER,'repo':REPO,'release_tag':TAG,'license':'CC BY 4.0 via nflverse/nflverse-pbp','seasons':SEASONS},'cutoff_rule':'Target season Y features use completed regular-season player statistics from Y-1 and Y-2 only; no target-season Week 1+ or reconstructed target-season injury/depth hindsight.','cohort_rule':f'Returning QB/RB/WR/TE with >={MIN_GAMES} observed stat rows in Y-1 and target Y; same position across Y-1/Y; rookies/no-prior-season history excluded.','holdout_seasons':HOLDS,'feature_names':FEATURES,'models':{'naive':'previous-season PPR per observed stat-row game','ridge':'position-specific StandardScaler + Ridge(alpha=10), fixed before holdout','boost':'position-specific GradientBoostingRegressor(n_estimators=150, learning_rate=.05, max_depth=2, min_samples_leaf=8), fixed before holdout'},'training_summary':train_summary,'heldout_prediction_count':len(preds),'metrics':outm,'pooled_lift_vs_naive':lifts,'availability_stage':'NOT MODELED — player-stat row presence is not a defensible active-game/injury label','replacement_value_stage':'NOT COMPUTED — remains downstream','direct_ecr_comparison':'NOT PERFORMED — no lawful contemporaneous FantasyPros historical benchmark used','frozen_2026_snapshot':{'clean':clean,'deadline_utc':FREEZE.isoformat(),'rows':len(snap),'limitations':['returning veterans only','no rookies without 2025 NFL stats','no preseason injury/depth context','no 2026 outcome data used']},'result_classification':result}
    (OUT/'SHADOW_RANKING_RESULTS.json').write_text(json.dumps(results,indent=2)+'\n'); (OUT/'SHADOW_RANKING_ASSET_MANIFEST.json').write_text(json.dumps(aman,indent=2)+'\n')
    if clean: pd.DataFrame(snap).sort_values(['position','boost_shadow_ppr_pg'],ascending=[True,False]).to_csv(OUT/'SHADOW_RANKING_2026_SNAPSHOT.csv',index=False,float_format='%.4f')
    print('WR018_RESULT_JSON_START'); print(json.dumps(results,indent=2)); print('WR018_RESULT_JSON_END')
if __name__=='__main__': run()
