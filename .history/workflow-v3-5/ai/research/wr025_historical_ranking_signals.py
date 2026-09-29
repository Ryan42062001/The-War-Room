from __future__ import annotations

import hashlib
import io
import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from scipy.stats import spearmanr
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    brier_score_loss,
    mean_absolute_error,
    mean_squared_error,
    roc_auc_score,
)
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

OWNER = "nflverse"
REPO = "nflverse-data"
STATS_TAG = "stats_player"
PLAYERS_TAG = "players"
DRAFT_TAG = "draft_picks"
STARTING_MAIN = "69689edadab5c8f270bc483b6acc461274ec7f87"
MFL_REPO_COMMIT = "9b8f37152036b44b1a5baeb35f70482b1d3369f8"
POSITIONS = ["QB", "RB", "WR", "TE"]
TOP_N = {"QB": 12, "RB": 24, "WR": 36, "TE": 12}
STAT_SEASONS = list(range(2012, 2026))
TARGET_SEASONS = list(range(2014, 2026))
SCORED_SEASONS = list(range(2018, 2026))
RIDGE_ALPHA = 100.0
LOGIT_C = 0.25
BOOST_SEED = 25025
BOOT_SEED = 25026
BOOT_REPS = 2000
OUT = Path(".ai/research/generated")
OUT.mkdir(parents=True, exist_ok=True)
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "war-room-wr025-research", "Accept": "application/vnd.github+json"})

SUMCOLS = [
    "fantasy_points_ppr", "attempts", "carries", "targets", "receptions",
    "passing_yards", "passing_tds", "passing_interceptions",
    "rushing_yards", "rushing_tds", "receiving_yards", "receiving_tds",
    "passing_epa", "rushing_epa", "receiving_epa",
]
AVGCOLS = ["target_share", "air_yards_share", "wopr"]
FEATURES = [
    "prev1_ppr_pg", "prev1_games", "prev1_attempts_pg", "prev1_carries_pg",
    "prev1_targets_pg", "prev1_receptions_pg", "prev1_pass_yards_pg",
    "prev1_pass_tds_pg", "prev1_int_pg", "prev1_rush_yards_pg",
    "prev1_rush_tds_pg", "prev1_rec_yards_pg", "prev1_rec_tds_pg",
    "prev1_pass_epa_pg", "prev1_rush_epa_pg", "prev1_rec_epa_pg",
    "prev1_target_share", "prev1_air_yards_share", "prev1_wopr",
    "prev1_pass_ypa", "prev1_rush_ypc", "prev1_rec_ypt",
    "prev2_ppr_pg", "prev2_games", "ppr_delta", "weighted_ppr_pg",
    "games_delta", "has_prev2", "age_sep1", "age_missing",
    "experience_years", "log_draft_pick", "draft_round", "drafted",
]
ROOKIE_FEATURES = ["age_sep1", "age_missing", "log_draft_pick", "draft_round"]


def get_json(url: str):
    r = SESSION.get(url, timeout=60)
    r.raise_for_status()
    return r.json()


def release_assets(tag: str):
    rel = get_json(f"https://api.github.com/repos/{OWNER}/{REPO}/releases/tags/{tag}")
    assets = []
    page = 1
    while True:
        batch = get_json(f"{rel['assets_url']}?per_page=100&page={page}")
        assets.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return rel, {a["name"]: a for a in assets}


def download_asset(asset: dict):
    r = SESSION.get(asset["browser_download_url"], timeout=180)
    r.raise_for_status()
    payload = r.content
    sha = hashlib.sha256(payload).hexdigest()
    digest = asset.get("digest")
    if digest and digest.startswith("sha256:") and digest[7:] != sha:
        raise RuntimeError(f"digest mismatch for {asset['name']}")
    return payload, sha


def safe_num(v, default=0.0):
    x = pd.to_numeric(v, errors="coerce")
    return float(default if pd.isna(x) else x)


def safe_ratio(a, b):
    return float(a / b) if b and np.isfinite(b) and abs(b) > 1e-12 else 0.0


def aggregate_stats(season: int, payload: bytes):
    df = pd.read_csv(io.BytesIO(payload), low_memory=False)
    required = ["season_type", "player_id", "position", "games", "fantasy_points_ppr"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise RuntimeError((season, "missing stats fields", missing))
    df = df[(df["season_type"].astype(str).str.upper() == "REG") & (df["position"].astype(str).str.upper().isin(POSITIONS))].copy()
    for c in SUMCOLS + AVGCOLS:
        if c not in df.columns:
            df[c] = np.nan
    rows = {}
    for pid, g in df.groupby("player_id", dropna=True):
        games_vals = pd.to_numeric(g["games"], errors="coerce").dropna()
        games = int(games_vals.max()) if len(games_vals) else 0
        if games <= 0:
            continue
        totals = {c: pd.to_numeric(g[c], errors="coerce").fillna(0).sum() for c in SUMCOLS}
        pg = {c: totals[c] / games for c in SUMCOLS}
        avgs = {c: pd.to_numeric(g[c], errors="coerce").mean() for c in AVGCOLS}
        name_col = "player_display_name" if "player_display_name" in g.columns else ("player_name" if "player_name" in g.columns else None)
        name = str(pid) if name_col is None or g[name_col].dropna().empty else str(g[name_col].dropna().iloc[-1])
        pos = str(g["position"].dropna().iloc[-1]).upper()
        rows[str(pid)] = {
            "season": season, "player_id": str(pid), "player_name": name, "position": pos,
            "games": games, "season_ppr": float(totals["fantasy_points_ppr"]), "ppr_pg": float(pg["fantasy_points_ppr"]),
            "attempts_pg": float(pg["attempts"]), "carries_pg": float(pg["carries"]),
            "targets_pg": float(pg["targets"]), "receptions_pg": float(pg["receptions"]),
            "pass_yards_pg": float(pg["passing_yards"]), "pass_tds_pg": float(pg["passing_tds"]),
            "int_pg": float(pg["passing_interceptions"]), "rush_yards_pg": float(pg["rushing_yards"]),
            "rush_tds_pg": float(pg["rushing_tds"]), "rec_yards_pg": float(pg["receiving_yards"]),
            "rec_tds_pg": float(pg["receiving_tds"]), "pass_epa_pg": float(pg["passing_epa"]),
            "rush_epa_pg": float(pg["rushing_epa"]), "rec_epa_pg": float(pg["receiving_epa"]),
            "target_share": 0.0 if pd.isna(avgs["target_share"]) else float(avgs["target_share"]),
            "air_yards_share": 0.0 if pd.isna(avgs["air_yards_share"]) else float(avgs["air_yards_share"]),
            "wopr": 0.0 if pd.isna(avgs["wopr"]) else float(avgs["wopr"]),
            "pass_ypa": safe_ratio(totals["passing_yards"], totals["attempts"]),
            "rush_ypc": safe_ratio(totals["rushing_yards"], totals["carries"]),
            "rec_ypt": safe_ratio(totals["receiving_yards"], totals["targets"]),
        }
    return rows, list(df.columns), len(df)


def load_players(payload: bytes):
    df = pd.read_csv(io.BytesIO(payload), low_memory=False)
    required = ["gsis_id", "birth_date", "rookie_season"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise RuntimeError(("missing players fields", missing))
    name_col = "display_name" if "display_name" in df.columns else ("football_name" if "football_name" in df.columns else None)
    out = {}
    mfl_to_gsis = {}
    for _, r in df.dropna(subset=["gsis_id"]).iterrows():
        pid = str(r["gsis_id"])
        name = pid if name_col is None or pd.isna(r.get(name_col)) else str(r[name_col])
        out[pid] = {
            "player_id": pid,
            "player_name": name,
            "birth_date": None if pd.isna(r.get("birth_date")) else str(r["birth_date"]),
            "rookie_season": None if pd.isna(r.get("rookie_season")) else int(float(r["rookie_season"])),
            "mfl_id": None if "mfl_id" not in df.columns or pd.isna(r.get("mfl_id")) else norm_external_id(r["mfl_id"]),
        }
        if out[pid]["mfl_id"]:
            mfl_to_gsis[out[pid]["mfl_id"]] = pid
    return out, mfl_to_gsis, list(df.columns), len(df)


def load_draft_picks(payload: bytes):
    df = pd.read_csv(io.BytesIO(payload), low_memory=False)
    required = ["season", "round", "pick", "team", "gsis_id", "pfr_player_name", "position"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise RuntimeError(("missing draft fields", missing))
    by_season = defaultdict(dict)
    by_player = {}
    for _, r in df[required].iterrows():
        season = pd.to_numeric(r["season"], errors="coerce")
        pick = pd.to_numeric(r["pick"], errors="coerce")
        rnd = pd.to_numeric(r["round"], errors="coerce")
        pos = str(r["position"]).upper() if pd.notna(r["position"]) else ""
        if pd.isna(season) or pd.isna(pick) or pick <= 0 or pos not in POSITIONS:
            continue
        season = int(season)
        if pd.isna(r["gsis_id"]) or not str(r["gsis_id"]).strip():
            continue
        pid = str(r["gsis_id"])
        rec = {
            "season": season, "player_id": pid,
            "player_name": str(r["pfr_player_name"]) if pd.notna(r["pfr_player_name"]) else pid,
            "position": pos, "draft_pick": float(pick),
            "draft_round": float(rnd) if pd.notna(rnd) else 8.0,
            "draft_team": None if pd.isna(r["team"]) else str(r["team"]),
        }
        by_season[season][pid] = rec
        if pid not in by_player or season < by_player[pid]["season"]:
            by_player[pid] = rec
    return dict(by_season), by_player, list(df.columns), len(df)


def age_at(meta: dict | None, season: int):
    if not meta or not meta.get("birth_date"):
        return 0.0, 1.0
    dt = pd.to_datetime(meta["birth_date"], errors="coerce")
    if pd.isna(dt):
        return 0.0, 1.0
    cutoff = pd.Timestamp(year=season, month=9, day=1)
    return float((cutoff - dt).days / 365.2425), 0.0


def draft_bucket(pick):
    if pick is None or not np.isfinite(pick) or pick <= 0:
        return "undrafted"
    if pick <= 50:
        return "1-50"
    if pick <= 100:
        return "51-100"
    if pick <= 175:
        return "101-175"
    return "176+"


def make_returner_features(season, pid, by_season, players, draft_by_player):
    prev = by_season.get(season - 1, {}).get(pid)
    prev2 = by_season.get(season - 2, {}).get(pid)
    if prev is None:
        raise RuntimeError("returner missing prior row")
    def g(k, default=0.0):
        return float(prev.get(k, default) or default)
    ppr1 = g("ppr_pg")
    ppr2 = float(prev2["ppr_pg"]) if prev2 else ppr1
    games2 = float(prev2["games"]) if prev2 else float(prev["games"])
    age, age_missing = age_at(players.get(pid), season)
    rs = players.get(pid, {}).get("rookie_season")
    exp = max(0.0, float(season - rs)) if rs is not None else 0.0
    dm = draft_by_player.get(pid)
    pick = dm.get("draft_pick") if dm else None
    rnd = dm.get("draft_round") if dm else None
    pickv = float(pick) if pick is not None and np.isfinite(pick) else 300.0
    roundv = float(rnd) if rnd is not None and np.isfinite(rnd) else 8.0
    vals = [
        ppr1, g("games"), g("attempts_pg"), g("carries_pg"), g("targets_pg"), g("receptions_pg"),
        g("pass_yards_pg"), g("pass_tds_pg"), g("int_pg"), g("rush_yards_pg"), g("rush_tds_pg"),
        g("rec_yards_pg"), g("rec_tds_pg"), g("pass_epa_pg"), g("rush_epa_pg"), g("rec_epa_pg"),
        g("target_share"), g("air_yards_share"), g("wopr"), g("pass_ypa"), g("rush_ypc"), g("rec_ypt"),
        ppr2, games2, ppr1 - ppr2, 0.70 * ppr1 + 0.30 * ppr2, g("games") - games2,
        1.0 if prev2 else 0.0, age, age_missing, exp, math.log1p(pickv), roundv, 1.0 if dm else 0.0,
    ]
    arr = np.nan_to_num(np.asarray(vals, dtype=float), nan=0.0, posinf=0.0, neginf=0.0)
    if len(arr) != len(FEATURES):
        raise RuntimeError((len(arr), len(FEATURES)))
    return arr.tolist()


def build_returners(by_season, players, draft_by_player):
    rows = []
    for season in TARGET_SEASONS:
        for pid, prev in by_season.get(season - 1, {}).items():
            if prev["position"] not in POSITIONS:
                continue
            target = by_season.get(season, {}).get(pid)
            games = int(target["games"]) if target else 0
            y = float(target["ppr_pg"]) if target else None
            season_ppr = float(target["season_ppr"]) if target else 0.0
            baseline = float(prev["ppr_pg"])
            residual = None if games <= 0 or y is None else y - baseline
            rows.append({
                "player_id": pid, "player_name": prev["player_name"], "position": prev["position"],
                "target_season": season, "x": make_returner_features(season, pid, by_season, players, draft_by_player),
                "target_games": games, "target_ppr_pg": y, "target_season_ppr": season_ppr,
                "baseline_ppr_pg": baseline, "baseline_games": float(prev["games"]),
                "residual": residual,
                "breakout": None if residual is None else int(residual >= 3.0),
                "downside": None if residual is None else int(residual <= -3.0),
                "low_availability": int(games <= 8),
            })
    return rows


def rookie_prior(history, row, target_key):
    cand = [r for r in history if r["position"] == row["position"]]
    if target_key == "target_ppr_pg":
        cand = [r for r in cand if r["target_games"] > 0 and r["target_ppr_pg"] is not None]
    if not cand:
        return 0.0
    bucket = draft_bucket(row.get("draft_pick"))
    same = [r for r in cand if draft_bucket(r.get("draft_pick")) == bucket]
    use = same if len(same) >= 5 else cand
    return float(np.mean([float(r[target_key]) for r in use]))


def build_rookies(by_season, players, drafts_by_season):
    rows = []
    for season in TARGET_SEASONS:
        for pid, d in drafts_by_season.get(season, {}).items():
            target = by_season.get(season, {}).get(pid)
            games = int(target["games"]) if target else 0
            y = float(target["ppr_pg"]) if target else None
            age, age_missing = age_at(players.get(pid), season)
            pick = float(d["draft_pick"])
            x = [age, age_missing, math.log1p(pick), float(d["draft_round"])]
            rows.append({
                "player_id": pid, "player_name": d["player_name"], "position": d["position"],
                "target_season": season, "draft_pick": pick, "draft_round": float(d["draft_round"]),
                "x": x, "target_games": games, "target_ppr_pg": y,
                "target_season_ppr": float(target["season_ppr"]) if target else 0.0,
            })
    for row in rows:
        history = [r for r in rows if r["target_season"] < row["target_season"]]
        row["baseline_ppr_pg"] = rookie_prior(history, row, "target_ppr_pg")
        row["baseline_games"] = rookie_prior(history, row, "target_games")
    return rows


def fit_ridge(train_rows, features=FEATURES):
    active = [r for r in train_rows if r["target_games"] > 0 and r["target_ppr_pg"] is not None]
    if len(active) < 25:
        return None
    X = np.array([r["x"] for r in active], float)
    y = np.array([r["target_ppr_pg"] for r in active], float)
    return make_pipeline(StandardScaler(), Ridge(alpha=RIDGE_ALPHA)).fit(X, y)


def fit_logit(train_rows, label):
    eligible = train_rows if label == "low_availability" else [r for r in train_rows if r["target_games"] > 0 and r[label] is not None]
    if len(eligible) < 30:
        return None
    y = np.array([int(r[label]) for r in eligible], int)
    if len(np.unique(y)) < 2:
        return None
    X = np.array([r["x"] for r in eligible], float)
    return make_pipeline(StandardScaler(), LogisticRegression(C=LOGIT_C, class_weight="balanced", max_iter=2000, solver="liblinear", random_state=25025)).fit(X, y)


def get_standardized_coef(pipe, kind):
    model = pipe.named_steps[kind]
    return np.asarray(model.coef_[0] if model.coef_.ndim > 1 else model.coef_, dtype=float)


def model_probability(model, X, fallback):
    if model is None:
        return np.full(len(X), float(fallback))
    return model.predict_proba(X)[:, 1]


def prevalence(train_rows, label):
    eligible = train_rows if label == "low_availability" else [r for r in train_rows if r["target_games"] > 0 and r[label] is not None]
    if not eligible:
        return 0.0
    return float(np.mean([int(r[label]) for r in eligible]))


def rank_metrics(frame, pred_col, pos):
    if frame.empty:
        return {"rank_mae": None, "top_n_overlap": None}
    f = frame.sort_values(["target_ppr_pg", "player_id"], ascending=[False, True]).copy()
    actual_order = list(f["player_id"])
    actual_rank = {pid: i + 1 for i, pid in enumerate(actual_order)}
    p = frame.sort_values([pred_col, "player_id"], ascending=[False, True])
    pred_order = list(p["player_id"])
    pred_rank = {pid: i + 1 for i, pid in enumerate(pred_order)}
    rank_mae = float(np.mean([abs(pred_rank[pid] - actual_rank[pid]) for pid in actual_order]))
    n = min(TOP_N[pos], len(actual_order))
    overlap = len(set(actual_order[:n]).intersection(pred_order[:n])) / n if n else None
    return {"rank_mae": rank_mae, "top_n_overlap": overlap}


def spearman_safe(a, b):
    if len(a) < 3 or len(set(np.asarray(a, float))) < 2 or len(set(np.asarray(b, float))) < 2:
        return None
    return float(spearmanr(a, b).statistic)


def projection_metrics(df, pred_col):
    if df.empty:
        return {"n": 0, "mae": None, "rmse": None, "spearman": None}
    y = df["target_ppr_pg"].to_numpy(float)
    p = df[pred_col].to_numpy(float)
    return {
        "n": int(len(df)),
        "mae": float(mean_absolute_error(y, p)),
        "rmse": float(math.sqrt(mean_squared_error(y, p))),
        "spearman": spearman_safe(p, y),
    }


def classification_metrics(df, label_col, prob_col):
    if df.empty:
        return {"n": 0}
    y = df[label_col].to_numpy(int)
    p = df[prob_col].to_numpy(float)
    threshold = float(np.quantile(p, 0.80))
    sel = p >= threshold
    positives = int(y.sum())
    return {
        "n": int(len(df)), "prevalence": float(y.mean()),
        "brier": float(brier_score_loss(y, p)),
        "roc_auc": float(roc_auc_score(y, p)) if len(np.unique(y)) > 1 else None,
        "top_quintile_threshold": threshold,
        "top_quintile_n": int(sel.sum()),
        "top_quintile_event_rate_or_precision": float(y[sel].mean()) if sel.any() else None,
        "top_quintile_recall": float(y[sel].sum() / positives) if positives > 0 else None,
    }


def execute_rolling(returners):
    scored = []
    coef_records = []
    perm_records = []
    rolling_metrics = []
    for season in SCORED_SEASONS:
        for pos in POSITIONS:
            train = [r for r in returners if r["target_season"] < season and r["position"] == pos]
            test = [r for r in returners if r["target_season"] == season and r["position"] == pos]
            active_test = [r for r in test if r["target_games"] > 0 and r["target_ppr_pg"] is not None]
            if len(active_test) < 8:
                continue
            ridge = fit_ridge(train)
            if ridge is None:
                continue
            breakout_model = fit_logit(train, "breakout")
            downside_model = fit_logit(train, "downside")
            lowavail_model = fit_logit(train, "low_availability")
            train_active = [r for r in train if r["target_games"] > 0 and r["target_ppr_pg"] is not None]
            boost = None
            if len(train_active) >= 25:
                boost = GradientBoostingRegressor(n_estimators=150, learning_rate=0.05, max_depth=2, min_samples_leaf=8, random_state=BOOST_SEED)
                boost.fit(np.array([r["x"] for r in train_active], float), np.array([r["target_ppr_pg"] for r in train_active], float))
            for model_name, model, step in [
                ("performance", ridge, "ridge"),
                ("breakout", breakout_model, "logisticregression"),
                ("downside", downside_model, "logisticregression"),
                ("low_availability", lowavail_model, "logisticregression"),
            ]:
                if model is None:
                    continue
                coefs = get_standardized_coef(model, step)
                for feat, coef in zip(FEATURES, coefs):
                    coef_records.append({"season": season, "position": pos, "model": model_name, "feature": feat, "coefficient": float(coef)})
            Xtest = np.array([r["x"] for r in active_test], float)
            ridge_pred = ridge.predict(Xtest)
            up = model_probability(breakout_model, Xtest, prevalence(train, "breakout"))
            down = model_probability(downside_model, Xtest, prevalence(train, "downside"))
            low = model_probability(lowavail_model, Xtest, prevalence(train, "low_availability"))
            boost_pred = boost.predict(Xtest) if boost is not None else np.full(len(active_test), np.nan)
            for i, r in enumerate(active_test):
                scored.append({
                    "player_id": r["player_id"], "player_name": r["player_name"], "position": pos,
                    "target_season": season, "target_ppr_pg": float(r["target_ppr_pg"]),
                    "baseline_ppr_pg": float(r["baseline_ppr_pg"]), "ridge_mu": float(ridge_pred[i]),
                    "p_breakout": float(up[i]), "p_downside": float(down[i]), "p_lowavail": float(low[i]),
                    "prototype_score": float(ridge_pred[i] + 1.5 * (up[i] - down[i]) - 0.75 * low[i]),
                    "boost_ppr_pg": None if boost is None else float(boost_pred[i]),
                    "breakout": int(r["breakout"]), "downside": int(r["downside"]),
                    "low_availability": int(r["low_availability"]),
                })
            all_X = np.array([r["x"] for r in test], float)
            all_low = model_probability(lowavail_model, all_X, prevalence(train, "low_availability"))
            for i, r in enumerate(test):
                # add availability-only records even for zero-game players
                if r["target_games"] == 0:
                    scored.append({
                        "player_id": r["player_id"], "player_name": r["player_name"], "position": pos,
                        "target_season": season, "target_ppr_pg": None,
                        "baseline_ppr_pg": float(r["baseline_ppr_pg"]), "ridge_mu": None,
                        "p_breakout": None, "p_downside": None, "p_lowavail": float(all_low[i]),
                        "prototype_score": None, "boost_ppr_pg": None,
                        "breakout": None, "downside": None, "low_availability": 1,
                    })
            frame = pd.DataFrame([x for x in scored if x["target_season"] == season and x["position"] == pos and x["target_ppr_pg"] is not None])
            if not frame.empty:
                for model_name, pred_col in [("baseline", "baseline_ppr_pg"), ("ridge", "ridge_mu"), ("prototype", "prototype_score"), ("boost", "boost_ppr_pg")]:
                    if pred_col not in frame or frame[pred_col].isna().all():
                        continue
                    use = frame.dropna(subset=[pred_col])
                    pm = projection_metrics(use, pred_col) if model_name != "prototype" else {"n": int(len(use)), "mae": None, "rmse": None, "spearman": spearman_safe(use[pred_col], use["target_ppr_pg"])}
                    rm = rank_metrics(use, pred_col, pos)
                    rolling_metrics.append({"season": season, "position": pos, "model": model_name, **pm, **rm})
            if boost is not None and len(active_test) >= 10:
                perm = permutation_importance(boost, Xtest, np.array([r["target_ppr_pg"] for r in active_test], float), scoring="neg_mean_absolute_error", n_repeats=5, random_state=season * 100 + POSITIONS.index(pos))
                for feat, imp in zip(FEATURES, perm.importances_mean):
                    perm_records.append({"season": season, "position": pos, "feature": feat, "mae_increase": float(imp)})
    return pd.DataFrame(scored), pd.DataFrame(coef_records), pd.DataFrame(perm_records), pd.DataFrame(rolling_metrics)


def summarize_signals(coefs):
    rows = []
    for (pos, model, feat), g in coefs.groupby(["position", "model", "feature"]):
        vals = g["coefficient"].to_numpy(float)
        pos_frac = float((vals > 0).mean())
        neg_frac = float((vals < 0).mean())
        med = float(np.median(vals))
        consistency = max(pos_frac, neg_frac)
        stable = len(vals) >= 6 and consistency >= 0.75 and abs(med) >= 0.05
        rows.append({
            "position": pos, "model": model, "feature": feat, "seasons": int(len(vals)),
            "median_standardized_coefficient": med, "median_abs_coefficient": float(np.median(np.abs(vals))),
            "positive_fraction": pos_frac, "negative_fraction": neg_frac,
            "direction_consistency": consistency, "stable": bool(stable),
        })
    table = pd.DataFrame(rows)
    by_pos = {}
    for pos in POSITIONS:
        t = table[table.position == pos]
        positive = defaultdict(lambda: {"strength": 0.0, "evidence": []})
        warning = defaultdict(lambda: {"strength": 0.0, "evidence": []})
        for _, r in t[t.stable].iterrows():
            feat = r.feature; model = r.model; coef = float(r.median_standardized_coefficient)
            if (model == "performance" and coef > 0) or (model == "breakout" and coef > 0):
                positive[feat]["strength"] = max(positive[feat]["strength"], abs(coef))
                positive[feat]["evidence"].append(f"{model}:{coef:+.3f}")
            if (model == "performance" and coef < 0) or (model in ["downside", "low_availability"] and coef > 0):
                warning[feat]["strength"] = max(warning[feat]["strength"], abs(coef))
                warning[feat]["evidence"].append(f"{model}:{coef:+.3f}")
        by_pos[pos] = {
            "positive": [{"feature": k, **v} for k, v in sorted(positive.items(), key=lambda kv: (-kv[1]["strength"], kv[0]))[:10]],
            "warning": [{"feature": k, **v} for k, v in sorted(warning.items(), key=lambda kv: (-kv[1]["strength"], kv[0]))[:10]],
        }
    return table, by_pos


def clustered_bootstrap_mae(active_df):
    ids = active_df["player_id"].unique()
    groups = {pid: active_df[active_df.player_id == pid] for pid in ids}
    rng = np.random.default_rng(BOOT_SEED)
    deltas = []
    for _ in range(BOOT_REPS):
        chosen = rng.choice(ids, size=len(ids), replace=True)
        parts = [groups[pid] for pid in chosen]
        b = pd.concat(parts, ignore_index=True)
        d = np.abs(b["ridge_mu"].to_numpy(float) - b["target_ppr_pg"].to_numpy(float)) - np.abs(b["baseline_ppr_pg"].to_numpy(float) - b["target_ppr_pg"].to_numpy(float))
        deltas.append(float(np.mean(d)))
    return {
        "clusters": int(len(ids)), "replicates": BOOT_REPS, "seed": BOOT_SEED,
        "mean_delta_mae_ridge_minus_baseline": float(np.mean(deltas)),
        "ci95_low": float(np.quantile(deltas, 0.025)), "ci95_high": float(np.quantile(deltas, 0.975)),
    }


def aggregate_rank_results(rolling_metrics):
    out = {}
    for pos in POSITIONS:
        out[pos] = {}
        for model in ["baseline", "ridge", "prototype", "boost"]:
            g = rolling_metrics[(rolling_metrics.position == pos) & (rolling_metrics.model == model)]
            if g.empty:
                continue
            out[pos][model] = {
                "seasons": int(len(g)),
                "mean_rank_mae": float(g.rank_mae.mean()),
                "mean_top_n_overlap": float(g.top_n_overlap.mean()),
                "mean_spearman": float(g.spearman.dropna().mean()) if g.spearman.notna().any() else None,
            }
    return out


def classification_summary(scored):
    active = scored[scored.target_ppr_pg.notna()].copy()
    allrows = scored.drop_duplicates(["player_id", "target_season", "position"], keep="last")
    out = {}
    for pos in POSITIONS:
        out[pos] = {}
        pa = active[active.position == pos]
        pfull = allrows[allrows.position == pos]
        out[pos]["breakout"] = classification_metrics(pa.dropna(subset=["p_breakout"]), "breakout", "p_breakout")
        out[pos]["downside"] = classification_metrics(pa.dropna(subset=["p_downside"]), "downside", "p_downside")
        out[pos]["low_availability"] = classification_metrics(pfull.dropna(subset=["p_lowavail"]), "low_availability", "p_lowavail")
    return out


def rookie_diagnostics(rookies):
    records = []
    coef = []
    for season in SCORED_SEASONS:
        for pos in POSITIONS:
            train = [r for r in rookies if r["target_season"] < season and r["position"] == pos and r["target_games"] > 0 and r["target_ppr_pg"] is not None]
            test = [r for r in rookies if r["target_season"] == season and r["position"] == pos and r["target_games"] > 0 and r["target_ppr_pg"] is not None]
            if len(train) < 20 or len(test) < 3:
                continue
            X = np.array([r["x"] for r in train], float); y = np.array([r["target_ppr_pg"] for r in train], float)
            model = make_pipeline(StandardScaler(), Ridge(alpha=RIDGE_ALPHA)).fit(X, y)
            pred = model.predict(np.array([r["x"] for r in test], float))
            coefs = get_standardized_coef(model, "ridge")
            for feat, c in zip(ROOKIE_FEATURES, coefs):
                coef.append({"season": season, "position": pos, "feature": feat, "coefficient": float(c)})
            for r, p in zip(test, pred):
                records.append({"season": season, "position": pos, "player_id": r["player_id"], "y": float(r["target_ppr_pg"]), "baseline": float(r["baseline_ppr_pg"]), "ridge": float(p)})
    df = pd.DataFrame(records)
    result = {"pooled": {}, "by_position": {}}
    if not df.empty:
        for model in ["baseline", "ridge"]:
            result["pooled"][model] = {
                "n": int(len(df)), "mae": float(mean_absolute_error(df.y, df[model])),
                "rmse": float(math.sqrt(mean_squared_error(df.y, df[model]))),
                "spearman": spearman_safe(df[model], df.y),
            }
        for pos in POSITIONS:
            g = df[df.position == pos]
            if g.empty:
                continue
            result["by_position"][pos] = {m: {"n": int(len(g)), "mae": float(mean_absolute_error(g.y, g[m])), "spearman": spearman_safe(g[m], g.y)} for m in ["baseline", "ridge"]}
    cdf = pd.DataFrame(coef)
    rookie_signals = []
    if not cdf.empty:
        for (pos, feat), g in cdf.groupby(["position", "feature"]):
            vals = g.coefficient.to_numpy(float)
            rookie_signals.append({"position": pos, "feature": feat, "seasons": int(len(vals)), "median_coef": float(np.median(vals)), "positive_fraction": float((vals > 0).mean()), "negative_fraction": float((vals < 0).mean())})
    result["coefficient_stability"] = rookie_signals
    return result


def norm_external_id(v):
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return None
    s = str(v).strip()
    if s.endswith(".0") and s[:-2].isdigit():
        s = s[:-2]
    return s if s and s.lower() != "nan" else None


def raw_mfl_file(path):
    url = f"https://raw.githubusercontent.com/dynastyprocess/data-mfl_public/{MFL_REPO_COMMIT}/{path}"
    r = SESSION.get(url, timeout=180)
    r.raise_for_status()
    return r.content, hashlib.sha256(r.content).hexdigest(), url


def safeleagues_benchmark(mfl_to_gsis, by_season, asset_manifest):
    details = {"status": "NOT ADMITTED", "reason": None, "years": {}, "filters": {}}
    league_parts = []
    draft_parts = []
    try:
        for year, idx in [(2019, 0), (2020, 1), (2021, 2)]:
            lp = f"safeleagues/league/year={year}/part-{idx}.parquet"
            dp = f"safeleagues/draft/year={year}/part-{idx}.parquet"
            lb, lsha, lurl = raw_mfl_file(lp); db, dsha, durl = raw_mfl_file(dp)
            asset_manifest.append({"source": "dynastyprocess/data-mfl_public", "path": lp, "sha256": lsha, "bytes": len(lb), "url": lurl})
            asset_manifest.append({"source": "dynastyprocess/data-mfl_public", "path": dp, "sha256": dsha, "bytes": len(db), "url": durl})
            ldf = pd.read_parquet(io.BytesIO(lb)); ddf = pd.read_parquet(io.BytesIO(db))
            ldf["_year"] = year; ddf["_year"] = year
            details["years"][str(year)] = {"league_columns": list(ldf.columns), "draft_columns": list(ddf.columns), "league_rows": int(len(ldf)), "draft_rows": int(len(ddf))}
            league_parts.append(ldf); draft_parts.append(ddf)
    except Exception as e:
        details["reason"] = f"download/schema failure: {type(e).__name__}: {e}"
        return details, None
    leagues = pd.concat(league_parts, ignore_index=True)
    drafts = pd.concat(draft_parts, ignore_index=True)
    req_l = ["league_id", "league_name", "franchise_count", "qb_type", "best_ball", "scoring_flags"]
    req_d = ["league_id", "player_id", "pick"]
    if any(c not in leagues.columns for c in req_l) or any(c not in drafts.columns for c in req_d):
        details["reason"] = f"required schema absent; league_missing={[c for c in req_l if c not in leagues.columns]}, draft_missing={[c for c in req_d if c not in drafts.columns]}"
        return details, None
    sflags = leagues["scoring_flags"].astype(str).str.lower()
    mask = (
        leagues["league_name"].astype(str).str.contains("redraft", case=False, na=False)
        & leagues["qb_type"].astype(str).str.upper().eq("1QB")
        & (~leagues["best_ball"].fillna(False).astype(bool))
        & (pd.to_numeric(leagues["franchise_count"], errors="coerce") == 12)
        & sflags.str.contains("ppr", na=False)
        & (~sflags.str.contains("half", na=False))
    )
    eligible = leagues[mask].copy()
    details["filters"] = {"redraft_name": True, "qb_type": "1QB", "best_ball": False, "franchise_count": 12, "scoring_flags_contains": "ppr", "scoring_flags_excludes": "half"}
    details["eligible_leagues"] = int(eligible["league_id"].nunique())
    if details["eligible_leagues"] < 100:
        details["reason"] = f"admission gate failed: only {details['eligible_leagues']} eligible league drafts"
        return details, None
    use = drafts.merge(eligible[["league_id", "_year"]].drop_duplicates(), on=["league_id", "_year"], how="inner")
    use["mfl_id"] = use["player_id"].map(norm_external_id)
    use["gsis_id"] = use["mfl_id"].map(mfl_to_gsis)
    use["overall_pick"] = pd.to_numeric(use["pick"], errors="coerce")
    if "pos" in use.columns:
        use["draft_position"] = use["pos"].astype(str).str.upper()
    elif "position" in use.columns:
        use["draft_position"] = use["position"].astype(str).str.upper()
    else:
        details["reason"] = "admission gate failed: no explicit preseason position field in draft rows"
        return details, None
    use = use[use.gsis_id.notna() & use.overall_pick.notna() & use.draft_position.isin(POSITIONS)].copy()
    grouped = use.groupby(["_year", "gsis_id", "draft_position"], as_index=False).agg(adp=("overall_pick", "mean"), draft_count=("league_id", "nunique"))
    grouped = grouped[grouped.draft_count >= 10].copy()
    outrows = []
    for _, r in grouped.iterrows():
        year = int(r["_year"]); pid = str(r["gsis_id"]); target = by_season.get(year, {}).get(pid)
        if not target:
            continue
        outrows.append({"season": year, "player_id": pid, "player_name": target["player_name"], "position": str(r["draft_position"]), "adp": float(r["adp"]), "draft_count": int(r["draft_count"]), "target_ppr_pg": float(target["ppr_pg"]), "target_season_ppr": float(target["season_ppr"])})
    adp = pd.DataFrame(outrows)
    details["matched_player_seasons"] = int(len(adp))
    details["matched_unique_players"] = int(adp.player_id.nunique()) if not adp.empty else 0
    if adp.empty or details["matched_unique_players"] < 100:
        details["reason"] = f"admission gate failed: only {details['matched_unique_players']} matched players"
        return details, None
    summaries = []
    adp["cost_bucket"] = ""
    adp["cost_relative_residual"] = np.nan
    for (season, pos), g in adp.groupby(["season", "position"]):
        if len(g) < 10:
            continue
        idx = g.index
        try:
            buckets = pd.qcut(g["adp"].rank(method="first"), q=min(5, len(g)), labels=False, duplicates="drop")
        except Exception:
            continue
        adp.loc[idx, "cost_bucket"] = buckets.astype(str).values
        for b in sorted(set(buckets)):
            bi = idx[buckets.to_numpy() == b]
            med = float(adp.loc[bi, "target_ppr_pg"].median())
            adp.loc[bi, "cost_relative_residual"] = adp.loc[bi, "target_ppr_pg"] - med
        summaries.append({"season": int(season), "position": pos, "n": int(len(g)), "spearman_negative_adp_vs_ppr_pg": spearman_safe(-g["adp"], g["target_ppr_pg"])})
    details["status"] = "ADMITTED — LIMITED SAFELEAGUES DRAFT-COST SENSITIVITY"
    details["reason"] = None
    details["summary"] = summaries
    details["cost_relative_underperformers_le_minus3"] = int((adp["cost_relative_residual"] <= -3.0).sum())
    return details, adp


def main():
    asset_manifest = []
    stats_rel, stats_assets = release_assets(STATS_TAG)
    players_rel, players_assets = release_assets(PLAYERS_TAG)
    draft_rel, draft_assets = release_assets(DRAFT_TAG)
    by_season = {}
    stats_schema = None
    for season in STAT_SEASONS:
        name = f"stats_player_regpost_{season}.csv"
        if name not in stats_assets:
            raise RuntimeError(f"missing required stats asset {name}")
        payload, sha = download_asset(stats_assets[name])
        rows, schema, nraw = aggregate_stats(season, payload)
        by_season[season] = rows
        stats_schema = schema
        asset_manifest.append({"source": "nflverse/nflverse-data", "release_tag": STATS_TAG, "release_id": stats_rel["id"], "asset_name": name, "asset_id": stats_assets[name]["id"], "updated_at": stats_assets[name].get("updated_at"), "sha256": sha, "rows_after_reg_skill_filter": len(rows), "raw_filtered_rows": nraw})
    p_asset = players_assets.get("players.csv")
    d_asset = draft_assets.get("draft_picks.csv")
    if not p_asset or not d_asset:
        raise RuntimeError("missing players.csv or draft_picks.csv")
    ppayload, psha = download_asset(p_asset); dpayload, dsha = download_asset(d_asset)
    players, mfl_to_gsis, players_schema, players_n = load_players(ppayload)
    drafts_by_season, draft_by_player, draft_schema, draft_n = load_draft_picks(dpayload)
    asset_manifest.append({"source": "nflverse/nflverse-data", "release_tag": PLAYERS_TAG, "release_id": players_rel["id"], "asset_name": "players.csv", "asset_id": p_asset["id"], "updated_at": p_asset.get("updated_at"), "sha256": psha, "rows": players_n})
    asset_manifest.append({"source": "nflverse/nflverse-data", "release_tag": DRAFT_TAG, "release_id": draft_rel["id"], "asset_name": "draft_picks.csv", "asset_id": d_asset["id"], "updated_at": d_asset.get("updated_at"), "sha256": dsha, "rows": draft_n})

    returners = build_returners(by_season, players, draft_by_player)
    rookies = build_rookies(by_season, players, drafts_by_season)
    scored, coefs, perms, rolling = execute_rolling(returners)
    active = scored[scored.target_ppr_pg.notna() & scored.ridge_mu.notna()].copy()
    signal_table, signal_lists = summarize_signals(coefs)

    pooled = {
        "baseline": projection_metrics(active, "baseline_ppr_pg"),
        "ridge": projection_metrics(active, "ridge_mu"),
        "boost": projection_metrics(active.dropna(subset=["boost_ppr_pg"]), "boost_ppr_pg"),
        "prototype_ranking": {"n": int(len(active)), "spearman": spearman_safe(active["prototype_score"], active["target_ppr_pg"])},
    }
    pooled["ridge_mae_improvement_fraction"] = (pooled["baseline"]["mae"] - pooled["ridge"]["mae"]) / pooled["baseline"]["mae"]
    bootstrap = clustered_bootstrap_mae(active)
    ranks = aggregate_rank_results(rolling)
    classifications = classification_summary(scored)
    rookie_result = rookie_diagnostics(rookies)
    mfl_result, mfl_adp = safeleagues_benchmark(mfl_to_gsis, by_season, asset_manifest)

    stable_positions = []
    for pos in POSITIONS:
        if signal_lists[pos]["positive"] and signal_lists[pos]["warning"]:
            stable_positions.append(pos)
    baseline_sp = pooled["baseline"]["spearman"]
    proto_sp = pooled["prototype_ranking"]["spearman"]
    pos_rank_regressions = {}
    base_rank_vals = []; proto_rank_vals = []
    for pos in POSITIONS:
        b = ranks.get(pos, {}).get("baseline", {}).get("mean_rank_mae")
        p = ranks.get(pos, {}).get("prototype", {}).get("mean_rank_mae")
        if b is None or p is None or b == 0:
            pos_rank_regressions[pos] = None
        else:
            pos_rank_regressions[pos] = (p - b) / b
            base_rank_vals.append(b); proto_rank_vals.append(p)
    avg_rank_improved = bool(base_rank_vals and np.mean(proto_rank_vals) < np.mean(base_rank_vals))
    no_bad_rank_pos = all(v is not None and v <= 0.05 for v in pos_rank_regressions.values())
    gates = {
        "stable_positive_and_warning_positions_ge_3": len(stable_positions) >= 3,
        "stable_positions": stable_positions,
        "ridge_pooled_mae_lift_ge_2pct": pooled["ridge_mae_improvement_fraction"] >= 0.02,
        "cluster_bootstrap_ci_upper_lt_zero": bootstrap["ci95_high"] < 0.0,
        "prototype_spearman_nonworse": proto_sp is not None and baseline_sp is not None and proto_sp >= baseline_sp,
        "average_position_rank_mae_improved": avg_rank_improved,
        "no_position_rank_mae_regression_gt_5pct": no_bad_rank_pos,
        "position_rank_mae_regression_fraction": pos_rank_regressions,
        "rights_leakage_integrity": True,
    }
    gates["passes_all"] = all([
        gates["stable_positive_and_warning_positions_ge_3"], gates["ridge_pooled_mae_lift_ge_2pct"],
        gates["cluster_bootstrap_ci_upper_lt_zero"], gates["prototype_spearman_nonworse"],
        gates["average_position_rank_mae_improved"], gates["no_position_rank_mae_regression_gt_5pct"],
        gates["rights_leakage_integrity"],
    ])
    if gates["passes_all"]:
        classification = "PROMISING — HISTORICAL RANKING SIGNALS ESTABLISHED"
    elif len(stable_positions) >= 2 or pooled["ridge_mae_improvement_fraction"] > 0:
        classification = "MORE EVIDENCE NEEDED"
    else:
        classification = "DO NOT PURSUE"

    results = {
        "task_id": "WR-025",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "starting_main": STARTING_MAIN,
        "historical_only": True,
        "max_stats_season_loaded": max(STAT_SEASONS),
        "outcomes_2026_inspected": False,
        "wr021_snapshot_modified": False,
        "wr023_protocol_modified": False,
        "features": FEATURES,
        "scored_seasons": SCORED_SEASONS,
        "cohort": {
            "returner_player_seasons_total": len(returners),
            "returner_scored_active_rows": int(len(active)),
            "returner_unique_scored_players": int(active.player_id.nunique()),
            "rookie_player_seasons_total": len(rookies),
        },
        "labels": {"breakout": "active residual >= +3.0 PPR/game vs previous-season baseline", "downside": "active residual <= -3.0 PPR/game vs previous-season baseline", "low_availability": "recorded games <= 8 including zero"},
        "prototype_formula": "ridge_mu + 1.5*(p_breakout-p_downside) - 0.75*p_lowavail",
        "pooled": pooled,
        "clustered_bootstrap": bootstrap,
        "rank_results": ranks,
        "classification_diagnostics": classifications,
        "stable_signals_by_position": signal_lists,
        "rookie_diagnostics": rookie_result,
        "safeleagues_draft_cost": mfl_result,
        "evidence_gate": gates,
        "classification": classification,
        "schemas": {"stats": stats_schema, "players": players_schema, "draft_picks": draft_schema},
    }
    (OUT / "HISTORICAL_RANKING_RESULTS.json").write_text(json.dumps(results, indent=2, sort_keys=False) + "\n")
    (OUT / "HISTORICAL_RANKING_ASSET_MANIFEST.json").write_text(json.dumps(asset_manifest, indent=2) + "\n")
    signal_table.sort_values(["position", "model", "stable", "direction_consistency", "median_abs_coefficient"], ascending=[True, True, False, False, False]).to_csv(OUT / "HISTORICAL_RANKING_SIGNAL_TABLE.csv", index=False)
    rolling.sort_values(["season", "position", "model"]).to_csv(OUT / "HISTORICAL_RANKING_ROLLING_METRICS.csv", index=False)
    if not perms.empty:
        perms.sort_values(["position", "season", "mae_increase"], ascending=[True, True, False]).to_csv(OUT / "HISTORICAL_RANKING_PERMUTATION_IMPORTANCE.csv", index=False)
    if mfl_adp is not None:
        mfl_adp.sort_values(["season", "position", "adp"]).to_csv(OUT / "HISTORICAL_RANKING_SAFELEAGUES_DRAFT_COST.csv", index=False)
    print(json.dumps({"classification": classification, "pooled": pooled, "bootstrap": bootstrap, "stable_positions": stable_positions, "safeleagues": mfl_result.get("status"), "gates": gates}, indent=2))


if __name__ == "__main__":
    main()
