from __future__ import annotations

import hashlib, io, json, math
from datetime import datetime, timezone
from pathlib import Path
from collections import defaultdict

import numpy as np
import pandas as pd
import requests
from scipy.stats import spearmanr
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

OWNER='nflverse'; REPO='nflverse-data'
STATS_TAG='stats_player'; PLAYERS_TAG='players'
SEASONS=list(range(2014,2026)); COHORT_TARGETS=list(range(2016,2026))
DEV=[2018,2019,2020,2021]; CONF=[2022,2023,2024,2025]
POSITIONS=['QB','RB','WR','TE']; TOP_N={'QB':12,'RB':24,'WR':36,'TE':12}
ALPHAS=[1.0,10.0,100.0]
FREEZE_DEADLINE=datetime.fromisoformat('2026-09-10T00:20:00+00:00')
STARTING_MAIN='4dbc0bf22d27296c3cd9b45fd90de637488ff001'
EXPECTED_PLAYERS_SHA='a33998d3981bda4f49f40390c5c0fa30036112ee1ea5de19ed4609e2ad3be3e2'
OUT=Path('.ai/research/generated'); OUT.mkdir(parents=True,exist_ok=True)
SESSION=requests.Session(); SESSION.headers.update({'User-Agent':'war-room-wr021-research','Accept':'application/vnd.github+json'})

SUMCOLS=['fantasy_points_ppr','attempts','carries','targets','receptions','passing_yards','passing_tds','passing_interceptions','rushing_yards','rushing_tds','receiving_yards','receiving_tds','passing_epa','rushing_epa','receiving_epa']
AVGCOLS=['target_share','air_yards_share','wopr']
FEATURES=['prev1_ppr_pg','prev1_games','prev1_attempts_pg','prev1_carries_pg','prev1_targets_pg','prev1_receptions_pg','prev1_pass_yards_pg','prev1_pass_tds_pg','prev1_int_pg','prev1_rush_yards_pg','prev1_rush_tds_pg','prev1_rec_yards_pg','prev1_rec_tds_pg','prev1_pass_epa_pg','prev1_rush_epa_pg','prev1_rec_epa_pg','prev1_target_share','prev1_air_yards_share','prev1_wopr','prev2_ppr_pg','prev2_games','ppr_delta','weighted_ppr_pg','has_prev2','age_sep1','age_missing','experience_years','rookie','draft_pick','log_draft_pick','draft_round','drafted','missing_prior']


def get_json(url):
    r=SESSION.get(url,timeout=60); r.raise_for_status(); return r.json()

def release_assets(tag):
    rel=get_json(f'https://api.github.com/repos/{OWNER}/{REPO}/releases/tags/{tag}')
    assets=[]; page=1
    while True:
        batch=get_json(f"{rel['assets_url']}?per_page=100&page={page}"); assets.extend(batch)
        if len(batch)<100: break
        page+=1
    return rel,{a['name']:a for a in assets}

def download(asset):
    r=SESSION.get(asset['browser_download_url'],timeout=180); r.raise_for_status(); b=r.content
    sha=hashlib.sha256(b).hexdigest(); gd=asset.get('digest')
    if gd and gd.startswith('sha256:'): assert gd[7:]==sha,(asset['name'],gd,sha)
    return b,sha

def aggregate_stats(season,payload):
    df=pd.read_csv(io.BytesIO(payload),low_memory=False)
    required=['season_type','player_id','position','games','fantasy_points_ppr']
    missing=[c for c in required if c not in df.columns]; assert not missing,(season,missing)
    df=df[(df.season_type.astype(str).str.upper()=='REG') & (df.position.astype(str).str.upper().isin(POSITIONS))].copy()
    for c in SUMCOLS+AVGCOLS:
        if c not in df: df[c]=np.nan
    rows={}
    for pid,g in df.groupby('player_id',dropna=True):
        gv=pd.to_numeric(g['games'],errors='coerce').dropna(); games=int(gv.max()) if len(gv) else 0
        if games<=0: continue
        sums={c:pd.to_numeric(g[c],errors='coerce').fillna(0).sum()/games for c in SUMCOLS}
        avgs={c:pd.to_numeric(g[c],errors='coerce').mean() for c in AVGCOLS}
        nmcol='player_display_name' if 'player_display_name' in g else ('player_name' if 'player_name' in g else None)
        name=str(pid) if nmcol is None or g[nmcol].dropna().empty else str(g[nmcol].dropna().iloc[-1])
        pos=str(g.position.dropna().iloc[-1]).upper()
        rows[str(pid)]={'season':season,'player_id':str(pid),'player_name':name,'position':pos,'games':games,'season_ppr':sums['fantasy_points_ppr']*games,'ppr_pg':sums['fantasy_points_ppr'],
            'attempts_pg':sums['attempts'],'carries_pg':sums['carries'],'targets_pg':sums['targets'],'receptions_pg':sums['receptions'],'pass_yards_pg':sums['passing_yards'],'pass_tds_pg':sums['passing_tds'],'int_pg':sums['passing_interceptions'],'rush_yards_pg':sums['rushing_yards'],'rush_tds_pg':sums['rushing_tds'],'rec_yards_pg':sums['receiving_yards'],'rec_tds_pg':sums['receiving_tds'],'pass_epa_pg':sums['passing_epa'],'rush_epa_pg':sums['rushing_epa'],'rec_epa_pg':sums['receiving_epa'],'target_share':0.0 if pd.isna(avgs['target_share']) else float(avgs['target_share']),'air_yards_share':0.0 if pd.isna(avgs['air_yards_share']) else float(avgs['air_yards_share']),'wopr':0.0 if pd.isna(avgs['wopr']) else float(avgs['wopr'])}
    return rows,list(df.columns),len(df)

def load_players(payload):
    df=pd.read_csv(io.BytesIO(payload),low_memory=False)
    required=['gsis_id','birth_date','rookie_season','draft_round','draft_pick','position']; missing=[c for c in required if c not in df.columns]; assert not missing,missing
    namecol='display_name' if 'display_name' in df.columns else 'football_name'
    keep=['gsis_id',namecol,'birth_date','rookie_season','draft_year','draft_round','draft_pick','draft_team','position']
    for c in keep:
        if c not in df: df[c]=np.nan
    out={}
    for _,r in df[keep].dropna(subset=['gsis_id']).iterrows():
        pid=str(r.gsis_id); pos=str(r.position).upper() if pd.notna(r.position) else ''
        out[pid]={'player_id':pid,'player_name':str(r[namecol]) if pd.notna(r[namecol]) else pid,'position':pos,'birth_date':None if pd.isna(r.birth_date) else str(r.birth_date),'rookie_season':None if pd.isna(r.rookie_season) else int(float(r.rookie_season)),'draft_year':None if pd.isna(r.draft_year) else int(float(r.draft_year)),'draft_round':None if pd.isna(r.draft_round) else float(r.draft_round),'draft_pick':None if pd.isna(r.draft_pick) else float(r.draft_pick),'draft_team':None if pd.isna(r.draft_team) else str(r.draft_team)}
    return out,list(df.columns),len(df)

def age_at(meta,season):
    if not meta or not meta.get('birth_date'): return (0.0,1.0)
    dt=pd.to_datetime(meta['birth_date'],errors='coerce')
    if pd.isna(dt): return (0.0,1.0)
    cutoff=pd.Timestamp(year=season,month=9,day=1); return ((cutoff-dt).days/365.2425,0.0)

def draft_bucket(pick):
    if pick is None or not np.isfinite(pick) or pick<=0: return 'undrafted'
    if pick<=50:return '1-50'
    if pick<=100:return '51-100'
    if pick<=175:return '101-175'
    return '176+'

def make_x(season,pid,pos,rookie,by_season,meta):
    prev=by_season.get(season-1,{}).get(pid); prev2=by_season.get(season-2,{}).get(pid)
    has2=1.0 if prev2 else 0.0
    def g(key,default=0.0): return float(prev.get(key,default)) if prev else default
    ppr1=g('ppr_pg'); ppr2=float(prev2['ppr_pg']) if prev2 else ppr1
    age,age_missing=age_at(meta,season); rs=meta.get('rookie_season') if meta else None
    exp=max(0.0,float(season-rs)) if rs is not None else 0.0
    dp=meta.get('draft_pick') if meta else None; dr=meta.get('draft_round') if meta else None
    dpv=float(dp) if dp is not None and np.isfinite(dp) else 300.0; drv=float(dr) if dr is not None and np.isfinite(dr) else 8.0
    vals=[ppr1,g('games'),g('attempts_pg'),g('carries_pg'),g('targets_pg'),g('receptions_pg'),g('pass_yards_pg'),g('pass_tds_pg'),g('int_pg'),g('rush_yards_pg'),g('rush_tds_pg'),g('rec_yards_pg'),g('rec_tds_pg'),g('pass_epa_pg'),g('rush_epa_pg'),g('rec_epa_pg'),g('target_share'),g('air_yards_share'),g('wopr'),ppr2,float(prev2['games']) if prev2 else 0.0,ppr1-ppr2,0.7*ppr1+0.3*ppr2,has2,age,age_missing,exp,1.0 if rookie else 0.0,dpv,math.log1p(dpv),drv,1.0 if dp is not None else 0.0,0.0 if prev else 1.0]
    assert len(vals)==len(FEATURES); return vals

def build_cohort(season,by_season,players):
    cohort={}
    for pid,prev in by_season.get(season-1,{}).items():
        if prev['position'] in POSITIONS: cohort[pid]={'player_id':pid,'player_name':prev['player_name'],'position':prev['position'],'rookie':False}
    for pid,m in players.items():
        if m.get('rookie_season')==season and m.get('draft_pick') is not None and m.get('draft_pick')>0 and m.get('position') in POSITIONS:
            cohort[pid]={'player_id':pid,'player_name':m['player_name'],'position':m['position'],'rookie':True}
    rows=[]
    for pid,c in cohort.items():
        target=by_season.get(season,{}).get(pid)
        tgames=int(target['games']) if target else 0; tppr=float(target['ppr_pg']) if target else None; tseason=float(target['season_ppr']) if target else 0.0
        meta=players.get(pid,{})
        rows.append({**c,'targetSeason':season,'x':make_x(season,pid,c['position'],c['rookie'],by_season,meta),'target_games':tgames,'y':tppr,'target_season_ppr':tseason,'draft_pick':meta.get('draft_pick'),'draft_round':meta.get('draft_round'),'age_sep1':age_at(meta,season)[0],'experience_years':max(0,season-meta['rookie_season']) if meta.get('rookie_season') is not None else None,'prev1_ppr_pg':by_season.get(season-1,{}).get(pid,{}).get('ppr_pg'),'prev1_games':by_season.get(season-1,{}).get(pid,{}).get('games')})
    return rows

def rookie_prior(history,row,target_key):
    candidates=[r for r in history if r['rookie'] and r['position']==row['position']]
    if target_key=='y': candidates=[r for r in candidates if r['target_games']>0 and r['y'] is not None]
    if not candidates: return 0.0
    bucket=draft_bucket(row.get('draft_pick')); b=[r for r in candidates if draft_bucket(r.get('draft_pick'))==bucket]; use=b if len(b)>=5 else candidates
    return float(np.mean([float(r[target_key]) for r in use]))

def add_baselines(rows,all_rows):
    for row in rows:
        hist=[r for r in all_rows if r['targetSeason']<row['targetSeason']]
        if row['rookie']:
            row['baseline_ppr_pg']=rookie_prior(hist,row,'y'); row['baseline_games']=rookie_prior(hist,row,'target_games')
        else:
            row['baseline_ppr_pg']=float(row['prev1_ppr_pg'] or 0.0); row['baseline_games']=float(row['prev1_games'] or 0.0)
        row['baseline_season_ppr']=max(0,row['baseline_ppr_pg'])*max(0,min(17,row['baseline_games']))

def fit_position(train,alpha):
    perf=[r for r in train if r['target_games']>0 and r['y'] is not None]
    if len(perf)<25 or len(train)<25:return None
    Xp=np.array([r['x'] for r in perf],float); yp=np.array([r['y'] for r in perf],float); Xa=np.array([r['x'] for r in train],float); ya=np.array([r['target_games'] for r in train],float)
    ridge_p=make_pipeline(StandardScaler(),Ridge(alpha=alpha)).fit(Xp,yp); ridge_a=make_pipeline(StandardScaler(),Ridge(alpha=alpha)).fit(Xa,ya)
    boost_p=GradientBoostingRegressor(n_estimators=150,learning_rate=.05,max_depth=2,min_samples_leaf=8,random_state=21021).fit(Xp,yp)
    boost_a=GradientBoostingRegressor(n_estimators=150,learning_rate=.05,max_depth=2,min_samples_leaf=8,random_state=21022).fit(Xa,ya)
    return ridge_p,ridge_a,boost_p,boost_a

def score_targets(targets,all_rows,alpha):
    scored=[]
    for season in targets:
        for pos in POSITIONS:
            train=[r for r in all_rows if r['targetSeason']<season and r['position']==pos]; test=[dict(r) for r in all_rows if r['targetSeason']==season and r['position']==pos]
            models=fit_position(train,alpha)
            if not models or not test: continue
            rp,ra,bp,ba=models; X=np.array([r['x'] for r in test],float)
            for r,a,b,c,d in zip(test,rp.predict(X),ra.predict(X),bp.predict(X),ba.predict(X)):
                r['ridge_ppr_pg']=max(0.0,float(a)); r['ridge_games']=max(0.0,min(17.0,float(b))); r['boost_ppr_pg']=max(0.0,float(c)); r['boost_games']=max(0.0,min(17.0,float(d)))
                r['ridge_season_ppr']=r['ridge_ppr_pg']*r['ridge_games']; r['boost_season_ppr']=r['boost_ppr_pg']*r['boost_games']; scored.append(r)
    return scored

def reg_metrics(rows,key,actual='y'):
    rr=[r for r in rows if r[actual] is not None]; y=np.array([r[actual] for r in rr],float); p=np.array([r[key] for r in rr],float)
    rho=float(spearmanr(y,p).statistic) if len(rr)>2 else None
    return {'n':len(rr),'mae':float(mean_absolute_error(y,p)) if len(rr) else None,'rmse':float(math.sqrt(mean_squared_error(y,p))) if len(rr) else None,'spearman':rho}

def mae_metric(rows,key,actual):
    y=np.array([r[actual] for r in rows],float); p=np.array([r[key] for r in rows],float); return {'n':len(rows),'mae':float(mean_absolute_error(y,p))}

def rank_metrics(rows,key,pos):
    errors=[]; hits=tot=0; seasons=[]
    for season in CONF:
        s=[r for r in rows if r['targetSeason']==season and r['position']==pos and r['target_games']>0 and r['y'] is not None]
        if not s: continue
        ao=sorted(s,key=lambda r:r['y'],reverse=True); po=sorted(s,key=lambda r:r[key],reverse=True); ar={r['player_id']:i+1 for i,r in enumerate(ao)}; pr={r['player_id']:i+1 for i,r in enumerate(po)}
        errors += [abs(ar[r['player_id']]-pr[r['player_id']]) for r in s]; n=min(TOP_N[pos],len(s)); truth={r['player_id'] for r in ao[:n]}; h=sum(r['player_id'] in truth for r in po[:n]); hits+=h;tot+=n
        seasons.append({'season':season,'n':len(s),'top_n':n,'hits':h,'overlap':h/n if n else None})
    return {'rank_mae':float(np.mean(errors)) if errors else None,'top_n_overlap':hits/tot if tot else None,'perSeason':seasons}

def cluster_bootstrap(rows,key,samples=2000,seed=21021):
    groups=defaultdict(list)
    for r in rows:
        if r['target_games']>0 and r['y'] is not None: groups[r['player_id']].append(abs(r['y']-r[key])-abs(r['y']-r['baseline_ppr_pg']))
    ids=list(groups); rng=np.random.default_rng(seed); draws=[]
    for _ in range(samples):
        vals=[]
        for pid in rng.choice(ids,size=len(ids),replace=True): vals.extend(groups[pid])
        draws.append(float(np.mean(vals)))
    return {'clusters':len(ids),'mean_delta_mae_vs_baseline':float(np.mean(draws)),'ci95_low':float(np.quantile(draws,.025)),'ci95_high':float(np.quantile(draws,.975))}

def dev_select(all_rows):
    results={}
    for a in ALPHAS:
        scored=score_targets(DEV,all_rows,a); ret=[r for r in scored if not r['rookie'] and r['target_games']>0]; results[str(a)]=reg_metrics(ret,'ridge_ppr_pg')
    best=min(ALPHAS,key=lambda a:(results[str(a)]['mae'],-a)); return best,results

def main():
    generated=datetime.now(timezone.utc); stats_rel,stats_assets=release_assets(STATS_TAG); players_rel,players_assets=release_assets(PLAYERS_TAG)
    pa=players_assets.get('players.csv'); assert pa,'players.csv missing'; pbytes,psha=download(pa); assert psha==EXPECTED_PLAYERS_SHA,(psha,EXPECTED_PLAYERS_SHA)
    players,pcols,pn=load_players(pbytes); by={}; manifest=[]
    for season in SEASONS:
        name=f'stats_player_regpost_{season}.csv'; a=stats_assets.get(name); assert a,name; print('download',name,flush=True); b,sha=download(a); rows,cols,n=aggregate_stats(season,b); by[season]=rows
        manifest.append({'family':'stats_player','season':season,'asset_id':a['id'],'name':name,'updated_at':a['updated_at'],'github_digest':a.get('digest'),'verified_sha256':sha,'regular_rows':n,'players':len(rows)})
    manifest.append({'family':'players','asset_id':pa['id'],'name':'players.csv','updated_at':pa['updated_at'],'github_digest':pa.get('digest'),'verified_sha256':psha,'rows':pn,'used_columns':['gsis_id','display_name','birth_date','rookie_season','draft_year','draft_round','draft_pick','draft_team','position'],'explicitly_ignored_column_families':['pff_*','ngs_*','latest_team','status']})
    all_rows=[]
    for season in COHORT_TARGETS: all_rows.extend(build_cohort(season,by,players))
    add_baselines(all_rows,all_rows); alpha,dev_results=dev_select(all_rows); print('LOCKED_ALPHA',alpha,flush=True); conf=score_targets(CONF,all_rows,alpha)
    ret=[r for r in conf if not r['rookie'] and r['target_games']>0 and r['y'] is not None]; active=[r for r in conf if r['target_games']>0 and r['y'] is not None]; rook_active=[r for r in conf if r['rookie'] and r['target_games']>0 and r['y'] is not None]; allco=conf
    metrics={'development_alpha_search':dev_results,'locked_alpha':alpha,'confirmatory':{'returning_performance':{},'all_active_performance':{},'rookie_active_performance':{},'availability':{},'season_total':{},'by_position':{},'per_season_returning':{},'clustered_bootstrap':{}}}
    for label,key in [('baseline','baseline_ppr_pg'),('ridge','ridge_ppr_pg'),('boost','boost_ppr_pg')]:
        metrics['confirmatory']['returning_performance'][label]=reg_metrics(ret,key); metrics['confirmatory']['all_active_performance'][label]=reg_metrics(active,key); metrics['confirmatory']['rookie_active_performance'][label]=reg_metrics(rook_active,key)
    for label,key in [('baseline','baseline_games'),('ridge','ridge_games'),('boost','boost_games')]: metrics['confirmatory']['availability'][label]=mae_metric(allco,key,'target_games')
    for label,key in [('baseline','baseline_season_ppr'),('ridge','ridge_season_ppr'),('boost','boost_season_ppr')]: metrics['confirmatory']['season_total'][label]=mae_metric(allco,key,'target_season_ppr')
    for pos in POSITIONS:
        rr=[r for r in ret if r['position']==pos]; metrics['confirmatory']['by_position'][pos]={}
        for label,key in [('baseline','baseline_ppr_pg'),('ridge','ridge_ppr_pg'),('boost','boost_ppr_pg')]:
            m=reg_metrics(rr,key); m.update(rank_metrics(ret,key,pos)); metrics['confirmatory']['by_position'][pos][label]=m
        metrics['confirmatory']['clustered_bootstrap'][pos]={'ridge':cluster_bootstrap(rr,'ridge_ppr_pg',seed=21021+POSITIONS.index(pos)),'boost':cluster_bootstrap(rr,'boost_ppr_pg',seed=22021+POSITIONS.index(pos))}
    metrics['confirmatory']['clustered_bootstrap']['pooled']={'ridge':cluster_bootstrap(ret,'ridge_ppr_pg'),'boost':cluster_bootstrap(ret,'boost_ppr_pg',seed=22021)}
    for season in CONF:
        ss=[r for r in ret if r['targetSeason']==season]; metrics['confirmatory']['per_season_returning'][str(season)]={k:reg_metrics(ss,v) for k,v in [('baseline','baseline_ppr_pg'),('ridge','ridge_ppr_pg'),('boost','boost_ppr_pg')]}
    cohort_summary=[]
    for season in CONF:
        s=[r for r in allco if r['targetSeason']==season]; cohort_summary.append({'season':season,'cohort_n':len(s),'returners':sum(not r['rookie'] for r in s),'drafted_rookies':sum(r['rookie'] for r in s),'zero_game':sum(r['target_games']==0 for r in s),'active':sum(r['target_games']>0 for r in s)})
    base=metrics['confirmatory']['returning_performance']['baseline']; ridge=metrics['confirmatory']['returning_performance']['ridge']; boot=metrics['confirmatory']['clustered_bootstrap']['pooled']['ridge']; lift=(base['mae']-ridge['mae'])/base['mae'] if base['mae'] else None
    persistent=[]
    for pos in POSITIONS:
        bad=0
        for season in CONF:
            ss=[r for r in ret if r['targetSeason']==season and r['position']==pos]
            if ss:
                b=reg_metrics(ss,'baseline_ppr_pg')['mae']; m=reg_metrics(ss,'ridge_ppr_pg')['mae']; bad += int(bool(b and (m-b)/b>0.02))
        if bad>=3:persistent.append(pos)
    gate={'ridge_pooled_mae_lift':lift,'mae_lift_ge_2pct':bool(lift is not None and lift>=.02),'cluster_ci_upper_lt_zero':bool(boot['ci95_high']<0),'spearman_not_worse_by_gt_0_01':bool(ridge['spearman']>=base['spearman']-.01),'persistent_material_position_regressions':persistent}; gate['passes_all']=all([gate['mae_lift_ge_2pct'],gate['cluster_ci_upper_lt_zero'],gate['spearman_not_worse_by_gt_0_01'],not persistent])
    snapshot_meta={'created':False}; snapshot=[]
    if generated<FREEZE_DEADLINE:
        rows26=build_cohort(2026,by,players); add_baselines(rows26,all_rows+rows26)
        for pos in POSITIONS:
            train=[r for r in all_rows if r['position']==pos]; test=[r for r in rows26 if r['position']==pos]; models=fit_position(train,alpha)
            if not models: continue
            rp,ra,bp,ba=models; X=np.array([r['x'] for r in test],float)
            for r,a,b,c,d in zip(test,rp.predict(X),ra.predict(X),bp.predict(X),ba.predict(X)):
                snapshot.append({'player_id':r['player_id'],'player_name':r['player_name'],'position':r['position'],'rookie':r['rookie'],'draft_pick':r['draft_pick'],'age_sep1':round(r['age_sep1'],3),'experience_years':r['experience_years'],'baseline_ppr_pg':round(float(r['baseline_ppr_pg']),4),'ridge_ppr_pg':round(max(0,float(a)),4),'boost_ppr_pg':round(max(0,float(c)),4),'baseline_games':round(float(r['baseline_games']),3),'ridge_games':round(max(0,min(17,float(b))),3),'boost_games':round(max(0,min(17,float(d))),3)})
        snapshot_meta={'created':True,'freeze_timestamp_utc':generated.isoformat(),'deadline_utc':FREEZE_DEADLINE.isoformat(),'rows':len(snapshot),'returners':sum(not r['rookie'] for r in snapshot),'drafted_rookies':sum(r['rookie'] for r in snapshot),'production_repo_commit_reference':STARTING_MAIN,'cutoff':'completed-through-2025 stats + immutable/preseason-known Players metadata only','limitations':['drafted rookies only; UDFA/no-prior-history excluded without defensible historical preseason roster source','no historical as-of depth/injury/roster-status context','no current/latest-team field used','research only; no 2026 outcomes used']}
        pd.DataFrame(snapshot).sort_values(['position','ridge_ppr_pg'],ascending=[True,False]).to_csv(OUT/'CONTEXT_SHADOW_2026_SNAPSHOT.csv',index=False)
    result={'task_id':'WR-021','classification':'EXPERIMENTAL / NON-PRODUCTION','generated_at_utc':generated.isoformat(),'starting_main':STARTING_MAIN,'source':{'stats_release_id':stats_rel['id'],'stats_release_updated_at':stats_rel['updated_at'],'players_release_id':players_rel['id'],'players_release_updated_at':players_rel['updated_at'],'players_sha256':psha},'cohort_rule':'returning = every Y-1 stats player; rookie = drafted rookie metadata; target outcomes joined only after inclusion','features':FEATURES,'development_targets':DEV,'confirmatory_targets':CONF,'metrics':metrics,'cohort_summary':cohort_summary,'evidence_gate':gate,'snapshot':snapshot_meta,'availability_definition':'recorded games; missing target stats = 0','undrafted_handling':'excluded from primary cohort due missing defensible historical preseason roster as-of source','confirmatory_limitation':'2022-2025 outcomes observed previously by project; confirmatory not pristine'}
    (OUT/'CONTEXT_SHADOW_RESULTS.json').write_text(json.dumps(result,indent=2)); (OUT/'CONTEXT_SHADOW_ASSET_MANIFEST.json').write_text(json.dumps(manifest,indent=2)); print('WR021_RESULT_JSON_START'); print(json.dumps(result,indent=2)); print('WR021_RESULT_JSON_END')

if __name__=='__main__': main()
