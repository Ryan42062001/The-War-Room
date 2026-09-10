from __future__ import annotations

import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.linear_model import HuberRegressor, LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    log_loss,
    mean_absolute_error,
    mean_squared_error,
    roc_auc_score,
)
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

import wr025_historical_ranking_signals as wr025

TASK_ID = "WR-027"
STARTING_MAIN = "9bb1f39013e4069dc59f14644fd383b5a4385ca8"
POSITIONS = wr025.POSITIONS
STAT_SEASONS = list(range(2012, 2026))
OOS_SEASONS = list(range(2016, 2026))
FINAL_SEASONS = list(range(2018, 2026))
OUT = Path(".ai/research/generated")
OUT.mkdir(parents=True, exist_ok=True)

WR025_ASSET_MANIFEST = OUT / "HISTORICAL_RANKING_ASSET_MANIFEST.json"
WR025_RESULTS = OUT / "HISTORICAL_RANKING_RESULTS.json"
SNAPSHOT_PATH = Path(".ai/research/generated/CONTEXT_SHADOW_2026_SNAPSHOT.csv")
PROTOCOL_PATH = Path(".ai/research/WR023_2026_PROSPECTIVE_EVALUATION_PROTOCOL.md")
SNAPSHOT_SHA256 = "9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d"
PROTOCOL_SHA256 = "f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c"

PLATT_MIN_N = 50
GRID_U = [0.0, 0.5, 1.0, 1.5]
GRID_D = [0.0, 0.5, 1.0, 1.5]
GRID_A = [0.0, 0.5, 1.0]
BOOT_REPS = 2000
BOOT_SEED_BASE = 27027

RISK_LABELS = {
    "breakout": {"raw": "raw_breakout", "prob": "p_breakout", "tier": "tier_breakout"},
    "downside": {"raw": "raw_downside", "prob": "p_downside", "tier": "tier_downside"},
    "low_availability": {"raw": "raw_lowavail", "prob": "p_lowavail", "tier": "tier_lowavail"},
}


def sha256_path(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_frozen() -> dict:
    got_snapshot = sha256_path(SNAPSHOT_PATH)
    got_protocol = sha256_path(PROTOCOL_PATH)
    if got_snapshot != SNAPSHOT_SHA256:
        raise RuntimeError(("WR-021 snapshot hash mismatch", got_snapshot, SNAPSHOT_SHA256))
    if got_protocol != PROTOCOL_SHA256:
        raise RuntimeError(("WR-023 protocol hash mismatch", got_protocol, PROTOCOL_SHA256))
    return {"snapshot_sha256": got_snapshot, "protocol_sha256": got_protocol}


def load_expected_assets() -> dict:
    rows = json.loads(WR025_ASSET_MANIFEST.read_text())
    out = {}
    for r in rows:
        if r.get("source") != "nflverse/nflverse-data":
            continue
        tag = r.get("release_tag")
        name = r.get("asset_name")
        if tag and name:
            out[(tag, name)] = r
    return out


def verify_download(asset: dict, expected: dict) -> tuple[bytes, str]:
    payload, sha = wr025.download_asset(asset)
    if sha != expected["sha256"]:
        raise RuntimeError(("WR-025 historical asset changed", expected.get("asset_name"), sha, expected["sha256"]))
    return payload, sha


def load_historical_data():
    expected = load_expected_assets()
    verified_assets = []
    stats_rel, stats_assets = wr025.release_assets(wr025.STATS_TAG)
    players_rel, players_assets = wr025.release_assets(wr025.PLAYERS_TAG)
    draft_rel, draft_assets = wr025.release_assets(wr025.DRAFT_TAG)

    by_season = {}
    for season in STAT_SEASONS:
        name = f"stats_player_regpost_{season}.csv"
        exp = expected.get((wr025.STATS_TAG, name))
        if exp is None or name not in stats_assets:
            raise RuntimeError(("missing expected WR-025 stats asset", season))
        payload, sha = verify_download(stats_assets[name], exp)
        rows, _, nraw = wr025.aggregate_stats(season, payload)
        by_season[season] = rows
        verified_assets.append({
            "release_tag": wr025.STATS_TAG,
            "asset_name": name,
            "wr025_sha256": exp["sha256"],
            "verified_sha256": sha,
            "rows_after_reg_skill_filter": len(rows),
            "raw_filtered_rows": nraw,
        })

    p_name = "players.csv"
    d_name = "draft_picks.csv"
    p_exp = expected.get((wr025.PLAYERS_TAG, p_name))
    d_exp = expected.get((wr025.DRAFT_TAG, d_name))
    if p_exp is None or d_exp is None:
        raise RuntimeError("WR-025 players/draft provenance missing")
    if p_name not in players_assets or d_name not in draft_assets:
        raise RuntimeError("current release missing WR-025 players/draft asset")
    ppayload, psha = verify_download(players_assets[p_name], p_exp)
    dpayload, dsha = verify_download(draft_assets[d_name], d_exp)
    players, _, _, players_n = wr025.load_players(ppayload)
    _, draft_by_player, _, draft_n = wr025.load_draft_picks(dpayload)
    verified_assets.extend([
        {"release_tag": wr025.PLAYERS_TAG, "asset_name": p_name, "wr025_sha256": p_exp["sha256"], "verified_sha256": psha, "rows": players_n},
        {"release_tag": wr025.DRAFT_TAG, "asset_name": d_name, "wr025_sha256": d_exp["sha256"], "verified_sha256": dsha, "rows": draft_n},
    ])
    return by_season, players, draft_by_player, verified_assets


def fit_huber(train_rows):
    active = [r for r in train_rows if r["target_games"] > 0 and r["target_ppr_pg"] is not None]
    if len(active) < 25:
        return None
    X = np.asarray([r["x"] for r in active], dtype=float)
    y = np.asarray([r["target_ppr_pg"] for r in active], dtype=float)
    return make_pipeline(
        StandardScaler(),
        HuberRegressor(epsilon=1.35, alpha=0.0001, max_iter=2000),
    ).fit(X, y)


def logit_values(p):
    p = np.clip(np.asarray(p, dtype=float), 1e-6, 1 - 1e-6)
    return np.log(p / (1 - p)).reshape(-1, 1)


def fit_platt(history: list[dict], label: str, raw_col: str):
    eligible = [r for r in history if r.get(label) is not None and r.get(raw_col) is not None]
    if len(eligible) < PLATT_MIN_N:
        return None
    y = np.asarray([int(r[label]) for r in eligible], dtype=int)
    if len(np.unique(y)) < 2:
        return None
    raw = np.asarray([float(r[raw_col]) for r in eligible], dtype=float)
    return LogisticRegression(C=1e6, solver="lbfgs", max_iter=2000).fit(logit_values(raw), y)


def apply_platt(model, raw):
    raw = np.asarray(raw, dtype=float)
    if model is None:
        return raw
    return model.predict_proba(logit_values(raw))[:, 1]


def prior_tier_thresholds(history: list[dict], prob_col: str):
    vals = np.asarray([float(r[prob_col]) for r in history if r.get(prob_col) is not None], dtype=float)
    if len(vals) >= PLATT_MIN_N:
        q50, q75, q90 = np.quantile(vals, [0.50, 0.75, 0.90])
        return (float(q50), float(q75), float(q90)), "prior_oos_quantiles"
    return (0.25, 0.50, 0.75), "fixed_fallback"


def tier_name(p: float, thresholds):
    q50, q75, q90 = thresholds
    if p < q50:
        return "NORMAL"
    if p < q75:
        return "ELEVATED"
    if p < q90:
        return "HIGH"
    return "VERY HIGH"


def raw_prob(model, X, fallback):
    if model is None:
        return np.full(len(X), float(fallback), dtype=float)
    return model.predict_proba(X)[:, 1]


def build_oos(returners):
    records: list[dict] = []
    model_meta: list[dict] = []
    for season in OOS_SEASONS:
        for pos in POSITIONS:
            train = [r for r in returners if r["target_season"] < season and r["position"] == pos]
            test = [r for r in returners if r["target_season"] == season and r["position"] == pos]
            if not test:
                continue
            active_idx = [i for i, r in enumerate(test) if r["target_games"] > 0 and r["target_ppr_pg"] is not None]
            active_test = [test[i] for i in active_idx]
            ridge = wr025.fit_ridge(train)
            huber = fit_huber(train)
            breakout_model = wr025.fit_logit(train, "breakout")
            downside_model = wr025.fit_logit(train, "downside")
            lowavail_model = wr025.fit_logit(train, "low_availability")
            if ridge is None or not active_test:
                continue

            X_active = np.asarray([r["x"] for r in active_test], dtype=float)
            X_all = np.asarray([r["x"] for r in test], dtype=float)
            ridge_pred = ridge.predict(X_active)
            huber_pred = huber.predict(X_active) if huber is not None else np.full(len(active_test), np.nan)
            raw_breakout = raw_prob(breakout_model, X_active, wr025.prevalence(train, "breakout"))
            raw_downside = raw_prob(downside_model, X_active, wr025.prevalence(train, "downside"))
            raw_low_all = raw_prob(lowavail_model, X_all, wr025.prevalence(train, "low_availability"))

            prior_pos = [r for r in records if r["position"] == pos and r["target_season"] < season]
            calibration_meta = {}
            calibrated = {}
            tier_meta = {}
            for label, spec in RISK_LABELS.items():
                raw_col = spec["raw"]
                prob_col = spec["prob"]
                label_history = [r for r in prior_pos if r.get(label) is not None and r.get(raw_col) is not None]
                platt = fit_platt(label_history, label, raw_col)
                calibration_meta[label] = {
                    "prior_oos_n": len(label_history),
                    "platt_used": platt is not None,
                }
                if label == "breakout":
                    vals = apply_platt(platt, raw_breakout)
                elif label == "downside":
                    vals = apply_platt(platt, raw_downside)
                else:
                    vals = apply_platt(platt, raw_low_all)
                calibrated[label] = vals
                thresholds, source = prior_tier_thresholds(label_history, prob_col)
                tier_meta[label] = {"thresholds": thresholds, "source": source}

            active_map = {idx: j for j, idx in enumerate(active_idx)}
            for i, r in enumerate(test):
                j = active_map.get(i)
                rec = {
                    "player_id": r["player_id"],
                    "player_name": r["player_name"],
                    "position": pos,
                    "target_season": season,
                    "target_games": int(r["target_games"]),
                    "target_ppr_pg": None if j is None else float(r["target_ppr_pg"]),
                    "baseline_ppr_pg": float(r["baseline_ppr_pg"]),
                    "ridge_mu": None if j is None else float(ridge_pred[j]),
                    "huber_mu": None if j is None or huber is None else float(huber_pred[j]),
                    "breakout": None if j is None else int(r["breakout"]),
                    "downside": None if j is None else int(r["downside"]),
                    "low_availability": int(r["low_availability"]),
                    "raw_breakout": None if j is None else float(raw_breakout[j]),
                    "raw_downside": None if j is None else float(raw_downside[j]),
                    "raw_lowavail": float(raw_low_all[i]),
                    "p_breakout": None if j is None else float(calibrated["breakout"][j]),
                    "p_downside": None if j is None else float(calibrated["downside"][j]),
                    "p_lowavail": float(calibrated["low_availability"][i]),
                }
                rec["tier_breakout"] = None if j is None else tier_name(rec["p_breakout"], tier_meta["breakout"]["thresholds"])
                rec["tier_downside"] = None if j is None else tier_name(rec["p_downside"], tier_meta["downside"]["thresholds"])
                rec["tier_lowavail"] = tier_name(rec["p_lowavail"], tier_meta["low_availability"]["thresholds"])
                records.append(rec)
            model_meta.append({
                "season": season,
                "position": pos,
                "train_rows": len(train),
                "test_rows": len(test),
                "active_test_rows": len(active_test),
                "huber_available": huber is not None,
                "calibration": calibration_meta,
                "tiering": {
                    k: {"thresholds": list(v["thresholds"]), "source": v["source"]}
                    for k, v in tier_meta.items()
                },
            })
    return records, model_meta


def spearman_safe(a, b):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    if len(a) < 3 or len(np.unique(a)) < 2 or len(np.unique(b)) < 2:
        return None
    return float(spearmanr(a, b).statistic)


def projection_metrics(df: pd.DataFrame, pred_col: str):
    use = df.dropna(subset=["target_ppr_pg", pred_col])
    if use.empty:
        return {"n": 0, "mae": None, "rmse": None, "spearman": None, "abs_error_p90": None, "abs_error_p95": None}
    y = use["target_ppr_pg"].to_numpy(float)
    p = use[pred_col].to_numpy(float)
    ae = np.abs(p - y)
    return {
        "n": int(len(use)),
        "mae": float(mean_absolute_error(y, p)),
        "rmse": float(math.sqrt(mean_squared_error(y, p))),
        "spearman": spearman_safe(p, y),
        "abs_error_p90": float(np.quantile(ae, 0.90)),
        "abs_error_p95": float(np.quantile(ae, 0.95)),
    }


def rank_mae(df: pd.DataFrame, pred_col: str):
    use = df.dropna(subset=["target_ppr_pg", pred_col]).copy()
    if use.empty:
        return None
    actual = use.sort_values(["target_ppr_pg", "player_id"], ascending=[False, True])["player_id"].tolist()
    pred = use.sort_values([pred_col, "player_id"], ascending=[False, True])["player_id"].tolist()
    ar = {pid: i + 1 for i, pid in enumerate(actual)}
    pr = {pid: i + 1 for i, pid in enumerate(pred)}
    return float(np.mean([abs(pr[pid] - ar[pid]) for pid in actual]))


def candidate_score(df: pd.DataFrame, u: float, d: float, a: float):
    return df["ridge_mu"] + u * df["p_breakout"] - d * df["p_downside"] - a * df["p_lowavail"]


def candidate_history_metrics(prior: pd.DataFrame, u: float, d: float, a: float):
    g = prior.copy()
    g["candidate"] = candidate_score(g, u, d, a)
    season_rows = []
    for season, s in g.groupby("target_season"):
        rr = rank_mae(s, "ridge_mu")
        cr = rank_mae(s, "candidate")
        if rr is None or cr is None or rr == 0:
            continue
        season_rows.append({"season": int(season), "ridge_rank_mae": rr, "candidate_rank_mae": cr, "regression_fraction": (cr - rr) / rr})
    if len(season_rows) < 2 or len(g) < 50:
        return None
    ridge_mean_rank = float(np.mean([x["ridge_rank_mae"] for x in season_rows]))
    cand_mean_rank = float(np.mean([x["candidate_rank_mae"] for x in season_rows]))
    ridge_proj = projection_metrics(g, "ridge_mu")
    cand_proj = projection_metrics(g, "candidate")
    improvement = (ridge_mean_rank - cand_mean_rank) / ridge_mean_rank if ridge_mean_rank else 0.0
    severe10 = sum(x["regression_fraction"] > 0.10 for x in season_rows)
    severe20 = sum(x["regression_fraction"] > 0.20 for x in season_rows)
    eligible = (
        improvement >= 0.02
        and cand_proj["mae"] <= ridge_proj["mae"] * 1.02
        and cand_proj["spearman"] is not None
        and ridge_proj["spearman"] is not None
        and cand_proj["spearman"] >= ridge_proj["spearman"] - 0.01
        and severe10 <= 1
        and severe20 == 0
    )
    return {
        "eligible": bool(eligible),
        "history_seasons": len(season_rows),
        "history_rows": int(len(g)),
        "mean_rank_mae_improvement": improvement,
        "ridge_mean_rank_mae": ridge_mean_rank,
        "candidate_mean_rank_mae": cand_mean_rank,
        "candidate_mae": cand_proj["mae"],
        "ridge_mae": ridge_proj["mae"],
        "candidate_spearman": cand_proj["spearman"],
        "ridge_spearman": ridge_proj["spearman"],
        "severe10_count": severe10,
        "severe20_count": severe20,
    }


def select_weights(history: pd.DataFrame):
    if history["target_season"].nunique() < 2 or len(history) < 50:
        return (0.0, 0.0, 0.0), {"reason": "insufficient_prior_oos_history", "eligible_candidates": 0}
    eligible = []
    for u in GRID_U:
        for d in GRID_D:
            for a in GRID_A:
                m = candidate_history_metrics(history, u, d, a)
                if m and m["eligible"]:
                    eligible.append((u, d, a, m))
    if not eligible:
        return (0.0, 0.0, 0.0), {"reason": "no_candidate_passed_prior_guard", "eligible_candidates": 0}
    eligible.sort(key=lambda x: (-x[3]["mean_rank_mae_improvement"], x[0] + x[1] + x[2], x[0], x[1], x[2]))
    u, d, a, m = eligible[0]
    return (float(u), float(d), float(a)), {"reason": "selected_best_prior_guarded_candidate", "eligible_candidates": len(eligible), **m}


def apply_final_modifiers(records: list[dict]):
    df = pd.DataFrame(records)
    active = df[df["target_ppr_pg"].notna() & df["ridge_mu"].notna()].copy()
    selections = []
    final_rows = []
    for season in FINAL_SEASONS:
        for pos in POSITIONS:
            prior = active[(active["position"] == pos) & (active["target_season"] < season)].copy()
            target = active[(active["position"] == pos) & (active["target_season"] == season)].copy()
            if target.empty:
                continue
            (u, d, a), meta = select_weights(prior)
            target["risk_u"] = u
            target["risk_d"] = d
            target["risk_a"] = a
            target["risk_score"] = candidate_score(target, u, d, a)
            final_rows.extend(target.to_dict("records"))
            selections.append({"season": season, "position": pos, "U": u, "D": d, "A": a, **meta})
    return pd.DataFrame(final_rows), pd.DataFrame(selections)


def fixed_reliability(df: pd.DataFrame, label: str, prob_col: str):
    bins = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0000001]
    rows = []
    for lo, hi in zip(bins[:-1], bins[1:]):
        g = df[(df[prob_col] >= lo) & (df[prob_col] < hi)]
        if g.empty:
            rows.append({"bin_low": lo, "bin_high": min(1.0, hi), "n": 0, "mean_pred": None, "event_rate": None})
        else:
            rows.append({
                "bin_low": lo,
                "bin_high": min(1.0, hi),
                "n": int(len(g)),
                "mean_pred": float(g[prob_col].mean()),
                "event_rate": float(g[label].mean()),
            })
    return rows


def calibration_metrics(df: pd.DataFrame, label: str, prob_col: str, tier_col: str):
    use = df.dropna(subset=[label, prob_col]).copy()
    if use.empty:
        return {"n": 0}, [], []
    y = use[label].astype(int).to_numpy()
    p = np.clip(use[prob_col].to_numpy(float), 1e-8, 1 - 1e-8)
    prevalence = float(y.mean())
    brier = float(brier_score_loss(y, p))
    climatology = float(prevalence * (1 - prevalence))
    brier_skill = None if climatology <= 0 else float(1 - brier / climatology)
    roc = float(roc_auc_score(y, p)) if len(np.unique(y)) > 1 else None
    ap = float(average_precision_score(y, p)) if len(np.unique(y)) > 1 else None
    ll = float(log_loss(y, p, labels=[0, 1]))
    reliability = fixed_reliability(use, label, prob_col)
    ece = 0.0
    for r in reliability:
        if r["n"]:
            ece += (r["n"] / len(use)) * abs(r["mean_pred"] - r["event_rate"])
    tier_rows = []
    for tier in ["NORMAL", "ELEVATED", "HIGH", "VERY HIGH"]:
        g = use[use[tier_col] == tier]
        tier_rows.append({
            "tier": tier,
            "n": int(len(g)),
            "mean_pred": None if g.empty else float(g[prob_col].mean()),
            "event_rate": None if g.empty else float(g[label].mean()),
        })
    very_high = next((r for r in tier_rows if r["tier"] == "VERY HIGH"), None)
    vh_rate = None if very_high is None else very_high["event_rate"]
    informative = bool(
        roc is not None and roc >= 0.65
        and ap is not None and ap >= prevalence + 0.05
        and brier_skill is not None and brier_skill > 0
        and vh_rate is not None and (prevalence == 0 or vh_rate >= 1.25 * prevalence)
    )
    metrics = {
        "n": int(len(use)),
        "prevalence": prevalence,
        "roc_auc": roc,
        "average_precision": ap,
        "brier": brier,
        "climatology_brier": climatology,
        "brier_skill": brier_skill,
        "log_loss": ll,
        "ece_fixed_bins": float(ece),
        "warning_informative": informative,
    }
    return metrics, reliability, tier_rows


def calibration_results(records: list[dict]):
    df = pd.DataFrame(records)
    df = df[df["target_season"].isin(FINAL_SEASONS)].copy()
    pooled = {}
    reliability_rows = []
    tier_rows = []
    season_rows = []
    for pos in POSITIONS:
        pooled[pos] = {}
        for label, spec in RISK_LABELS.items():
            if label == "low_availability":
                use = df[df["position"] == pos].copy()
            else:
                use = df[(df["position"] == pos) & df["target_ppr_pg"].notna()].copy()
            metrics, rel, tiers = calibration_metrics(use, label, spec["prob"], spec["tier"])
            pooled[pos][label] = metrics
            for r in rel:
                reliability_rows.append({"position": pos, "label": label, **r})
            for r in tiers:
                tier_rows.append({"position": pos, "label": label, **r})
            for season, g in use.groupby("target_season"):
                m, _, _ = calibration_metrics(g, label, spec["prob"], spec["tier"])
                season_rows.append({"season": int(season), "position": pos, "label": label, **m})
    return pooled, pd.DataFrame(reliability_rows), pd.DataFrame(tier_rows), pd.DataFrame(season_rows)


def rank_summary(final: pd.DataFrame):
    out = {}
    rolling = []
    for pos in POSITIONS:
        g = final[final["position"] == pos].copy()
        out[pos] = {}
        for col, label in [("ridge_mu", "mean_only"), ("risk_score", "risk_modifier")]:
            pm = projection_metrics(g, col)
            season_rank = []
            season_spearman = []
            for season, s in g.groupby("target_season"):
                rm = rank_mae(s, col)
                sp = spearman_safe(s[col], s["target_ppr_pg"])
                season_rank.append(rm)
                if sp is not None:
                    season_spearman.append(sp)
                rolling.append({
                    "season": int(season), "position": pos, "model": label,
                    "rank_mae": rm, "spearman": sp,
                    "mae": float(mean_absolute_error(s["target_ppr_pg"], s[col])),
                    "rmse": float(math.sqrt(mean_squared_error(s["target_ppr_pg"], s[col]))),
                })
            out[pos][label] = {
                **pm,
                "mean_season_rank_mae": float(np.mean(season_rank)),
                "mean_season_spearman": float(np.mean(season_spearman)) if season_spearman else None,
            }
        ridge_rank = out[pos]["mean_only"]["mean_season_rank_mae"]
        risk_rank = out[pos]["risk_modifier"]["mean_season_rank_mae"]
        out[pos]["rank_mae_improvement_fraction"] = (ridge_rank - risk_rank) / ridge_rank
        rg = pd.DataFrame([r for r in rolling if r["position"] == pos])
        severe10 = 0
        severe20 = 0
        for season in FINAL_SEASONS:
            a = rg[(rg.season == season) & (rg.model == "mean_only")]
            b = rg[(rg.season == season) & (rg.model == "risk_modifier")]
            if a.empty or b.empty or float(a.iloc[0].rank_mae) == 0:
                continue
            frac = (float(b.iloc[0].rank_mae) - float(a.iloc[0].rank_mae)) / float(a.iloc[0].rank_mae)
            severe10 += int(frac > 0.10)
            severe20 += int(frac > 0.20)
        out[pos]["severe_rank_regression_gt10_count"] = severe10
        out[pos]["severe_rank_regression_gt20_count"] = severe20
    return out, pd.DataFrame(rolling)


def player_cluster_bootstrap(df: pd.DataFrame, pred_a: str, pred_b: str, seed: int):
    use = df.dropna(subset=["target_ppr_pg", pred_a, pred_b]).copy()
    players = sorted(use["player_id"].unique().tolist())
    groups = {pid: use[use.player_id == pid] for pid in players}
    if not players:
        return {"clusters": 0}
    rng = np.random.default_rng(seed)
    deltas = []
    for _ in range(BOOT_REPS):
        sampled = rng.choice(players, size=len(players), replace=True)
        chunks = [groups[pid] for pid in sampled]
        boot = pd.concat(chunks, ignore_index=True)
        y = boot["target_ppr_pg"].to_numpy(float)
        a = boot[pred_a].to_numpy(float)
        b = boot[pred_b].to_numpy(float)
        deltas.append(float(mean_absolute_error(y, a) - mean_absolute_error(y, b)))
    arr = np.asarray(deltas, dtype=float)
    return {
        "clusters": len(players), "replicates": BOOT_REPS, "seed": seed,
        "mean_delta_mae_first_minus_second": float(arr.mean()),
        "ci95_low": float(np.quantile(arr, 0.025)),
        "ci95_high": float(np.quantile(arr, 0.975)),
    }


def robust_results(records: list[dict]):
    df = pd.DataFrame(records)
    active = df[df["target_season"].isin(FINAL_SEASONS) & df["target_ppr_pg"].notna() & df["ridge_mu"].notna()].copy()
    out = {}
    rolling = []
    for i, pos in enumerate(POSITIONS):
        g = active[active["position"] == pos].dropna(subset=["huber_mu"]).copy()
        ridge = projection_metrics(g, "ridge_mu")
        huber = projection_metrics(g, "huber_mu")
        rr = []
        hr = []
        for season, s in g.groupby("target_season"):
            rrm = rank_mae(s, "ridge_mu"); hrm = rank_mae(s, "huber_mu")
            rr.append(rrm); hr.append(hrm)
            rolling.append({"season": int(season), "position": pos, "model": "ridge", "rank_mae": rrm, **projection_metrics(s, "ridge_mu")})
            rolling.append({"season": int(season), "position": pos, "model": "huber", "rank_mae": hrm, **projection_metrics(s, "huber_mu")})
        out[pos] = {
            "ridge": {**ridge, "mean_season_rank_mae": float(np.mean(rr)) if rr else None},
            "huber": {**huber, "mean_season_rank_mae": float(np.mean(hr)) if hr else None},
            "clustered_bootstrap_huber_minus_ridge_mae": player_cluster_bootstrap(g, "huber_mu", "ridge_mu", BOOT_SEED_BASE + i),
        }
    return out, pd.DataFrame(rolling)


def decide_positions(calibration: dict, ranks: dict):
    decisions = {}
    for pos in POSITIONS:
        mean = ranks[pos]["mean_only"]
        risk = ranks[pos]["risk_modifier"]
        rank_pass = (
            ranks[pos]["rank_mae_improvement_fraction"] >= 0.02
            and risk["mae"] <= mean["mae"] * 1.02
            and risk["spearman"] is not None and mean["spearman"] is not None
            and risk["spearman"] >= mean["spearman"] - 0.01
            and ranks[pos]["severe_rank_regression_gt10_count"] <= 1
            and ranks[pos]["severe_rank_regression_gt20_count"] == 0
        )
        warning = bool(
            calibration[pos]["downside"].get("warning_informative")
            or calibration[pos]["low_availability"].get("warning_informative")
        )
        if rank_pass:
            decision = "RANK MODIFIER SUPPORTED"
        elif warning:
            decision = "WARNING-ONLY SUPPORTED"
        else:
            decision = "INSUFFICIENT EVIDENCE"
        decisions[pos] = {
            "decision": decision,
            "rank_guard_pass": bool(rank_pass),
            "warning_evidence_pass": warning,
            "downside_warning_informative": bool(calibration[pos]["downside"].get("warning_informative")),
            "low_availability_warning_informative": bool(calibration[pos]["low_availability"].get("warning_informative")),
            "breakout_warning_informative": bool(calibration[pos]["breakout"].get("warning_informative")),
        }
    return decisions


def verify_wr025_benchmark(records: list[dict]):
    expected = json.loads(WR025_RESULTS.read_text())
    df = pd.DataFrame(records)
    active = df[df["target_season"].isin(FINAL_SEASONS) & df["target_ppr_pg"].notna() & df["ridge_mu"].notna()].copy()
    pooled_baseline = projection_metrics(active, "baseline_ppr_pg")
    pooled_ridge = projection_metrics(active, "ridge_mu")
    exp_base = expected["pooled"]["baseline"]
    exp_ridge = expected["pooled"]["ridge"]
    checks = {
        "n": (pooled_ridge["n"], exp_ridge["n"]),
        "baseline_mae": (pooled_baseline["mae"], exp_base["mae"]),
        "ridge_mae": (pooled_ridge["mae"], exp_ridge["mae"]),
        "ridge_spearman": (pooled_ridge["spearman"], exp_ridge["spearman"]),
    }
    for key, (got, want) in checks.items():
        if key == "n":
            if int(got) != int(want):
                raise RuntimeError(("WR-025 benchmark mismatch", key, got, want))
        elif not math.isclose(float(got), float(want), rel_tol=0, abs_tol=1e-10):
            raise RuntimeError(("WR-025 benchmark mismatch", key, got, want))
    return {"verified": True, "checks": checks, "active_rows": int(len(active)), "unique_players": int(active.player_id.nunique())}


def main():
    frozen_before = verify_frozen()
    by_season, players, draft_by_player, verified_assets = load_historical_data()
    returners = wr025.build_returners(by_season, players, draft_by_player)
    records, model_meta = build_oos(returners)
    benchmark = verify_wr025_benchmark(records)
    final, selections = apply_final_modifiers(records)
    calibration, reliability, tiers, calibration_by_season = calibration_results(records)
    ranks, rank_rolling = rank_summary(final)
    robust, robust_rolling = robust_results(records)
    decisions = decide_positions(calibration, ranks)
    frozen_after = verify_frozen()

    result = {
        "task_id": TASK_ID,
        "starting_main": STARTING_MAIN,
        "historical_only": True,
        "max_stats_season_loaded": 2025,
        "outcomes_2026_inspected": False,
        "wr021_snapshot_modified": False,
        "wr023_protocol_modified": False,
        "source_reuse": "WR-025 exact historical nflverse asset digests",
        "final_scored_seasons": FINAL_SEASONS,
        "oos_support_seasons": OOS_SEASONS,
        "mean_benchmark": benchmark,
        "calibration": calibration,
        "rank_results": ranks,
        "position_decisions": decisions,
        "robust_regression": robust,
        "weight_selection": selections.to_dict("records"),
        "model_meta": model_meta,
        "frozen_integrity_before": frozen_before,
        "frozen_integrity_after": frozen_after,
        "rookie_boundary": "separate; no rookie model fitted in WR-027",
    }

    (OUT / "POSITION_RISK_RESULTS.json").write_text(json.dumps(result, indent=2, sort_keys=False))
    pd.DataFrame(verified_assets).to_json(OUT / "POSITION_RISK_ASSET_VERIFICATION.json", orient="records", indent=2)
    reliability.to_csv(OUT / "POSITION_RISK_RELIABILITY.csv", index=False)
    tiers.to_csv(OUT / "POSITION_RISK_WARNING_TIERS.csv", index=False)
    calibration_by_season.to_csv(OUT / "POSITION_RISK_CALIBRATION_BY_SEASON.csv", index=False)
    selections.to_csv(OUT / "POSITION_RISK_WEIGHT_SELECTION.csv", index=False)
    rank_rolling.to_csv(OUT / "POSITION_RISK_RANK_ROLLING.csv", index=False)
    robust_rolling.to_csv(OUT / "POSITION_RISK_ROBUST_ROLLING.csv", index=False)

    print(json.dumps({
        "task_id": TASK_ID,
        "benchmark": benchmark,
        "position_decisions": decisions,
        "rank_results": ranks,
        "robust_regression": robust,
        "frozen_integrity_before": frozen_before,
        "frozen_integrity_after": frozen_after,
    }, indent=2))


if __name__ == "__main__":
    main()
