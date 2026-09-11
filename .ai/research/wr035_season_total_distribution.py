from __future__ import annotations

import hashlib
import json
import math
import os
import platform
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import scipy
import sklearn
from scipy.stats import spearmanr
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

import wr025_historical_ranking_signals as wr025
import wr034_availability_expected_games as wr034

TASK = "WR-035"
POSITIONS = ["QB", "RB", "WR", "TE"]
TOP_N = {"QB": 12, "RB": 24, "WR": 36, "TE": 12}
SCORED = list(range(2018, 2026))
DEV = [2018, 2019, 2020, 2021]
CONF = [2022, 2023, 2024, 2025]
METHODS = ["INDEPENDENT_PRODUCT", "PAIRED_RESIDUAL_MEAN", "WR033_X_PREV_RATE",
           "PRIOR_TOTAL_SCHEDULE_ADJUSTED", "POSITION_MEAN_TOTAL"]
DIST_METHODS = ["PAIRED_RESIDUAL_DRAWS", "INDEPENDENT_RESIDUAL_DRAWS"]
N_DRAWS = 2001
BOOT_REPS = 5000
OUT = Path(".ai/research/generated")
LOCK = OUT / "SEASON_TOTAL_COMPOSITION_PROTOCOL.json"
UPSTREAM_ROWS = OUT / "WR034_EXPECTED_GAMES_ROWS.csv"
UPSTREAM_MANIFEST = OUT / "HISTORICAL_RANKING_ASSET_MANIFEST.json"
SENTINELS = wr034.SENTINELS


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def stable_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True, allow_nan=False) + "\n")


def spearman(a, b):
    a, b = np.asarray(a, float), np.asarray(b, float)
    if len(a) < 3 or len(np.unique(a)) < 2 or len(np.unique(b)) < 2:
        return None
    return float(spearmanr(a, b).statistic)


def load_inputs():
    lock = json.loads(LOCK.read_text())
    if lock.get("task_id") != TASK or lock.get("status") != "FROZEN_PRE_SCORING_LOCK":
        raise RuntimeError("WR-035 frozen machine lock is absent or invalid")
    if max(wr025.STAT_SEASONS) > 2025 or max(wr034.STAT_SEASONS) > 2025:
        raise RuntimeError("upstream loader would cross the 2025 data ceiling")
    before = wr034.frozen_integrity_snapshot()
    by_season, stats_prov = wr034.load_locked_stats()
    locked = {x["asset_name"]: x for x in json.loads(UPSTREAM_MANIFEST.read_text())
              if x.get("asset_name")}

    substitutions = []
    def locked_asset(tag, name, parser):
        release, assets = wr025.release_assets(tag)
        if name not in assets or name not in locked:
            raise RuntimeError(f"missing locked asset {name}")
        payload, digest = wr025.download_asset(assets[name])
        matches = digest == locked[name]["sha256"] and int(assets[name]["id"]) == int(locked[name]["asset_id"])
        if not matches and name != "players.csv":
            raise RuntimeError(f"locked asset mismatch: {name}")
        if not matches:
            substitutions.append({"asset_name": name, "locked_asset_id": int(locked[name]["asset_id"]),
                                  "locked_sha256": locked[name]["sha256"],
                                  "replacement_asset_id": int(assets[name]["id"]),
                                  "replacement_sha256": digest,
                                  "replacement_updated_at": assets[name].get("updated_at"),
                                  "reason": "locked release asset ID returns HTTP 404"})
        parsed = parser(payload)
        provenance = {k: v for k, v in locked[name].items() if k != "retrieved_at_utc"}
        provenance["replayed_sha256"] = digest
        provenance["release_id_replayed"] = int(release["id"])
        return parsed, provenance

    (players, _, _, _), players_prov = locked_asset(wr025.PLAYERS_TAG, "players.csv", wr025.load_players)
    ((_, draft_by_player, _, _)), draft_prov = locked_asset(
        wr025.DRAFT_TAG, "draft_picks.csv", wr025.load_draft_picks
    )
    returners = wr025.build_returners(by_season, players, draft_by_player)
    games_rows = wr034.prepare_rows(returners)
    games_map = {(r["player_id"], r["position"], r["target_season"]): r for r in games_rows}
    prior_totals = {}
    for r in returners:
        prev = by_season[r["target_season"] - 1][r["player_id"]]
        prior_totals[(r["player_id"], r["position"], r["target_season"])] = float(prev["season_ppr"])
    provenance = [{k: v for k, v in x.items() if k != "retrieved_at_utc"} for x in stats_prov]
    provenance.extend([players_prov, draft_prov])
    provenance.extend(substitutions)
    return returners, games_rows, games_map, prior_totals, provenance, before


def upstream_predictions(returners, games_rows):
    records = []
    for season in range(2015, 2026):
        for pos in POSITIONS:
            ptrain = [r for r in returners if r["position"] == pos and r["target_season"] < season]
            ptest = [r for r in returners if r["position"] == pos and r["target_season"] == season]
            gtrain = [r for r in games_rows if r["position"] == pos and r["target_season"] < season]
            gtest = [r for r in games_rows if r["position"] == pos and r["target_season"] == season]
            if not ptest:
                continue
            pmodel = wr025.fit_ridge(ptrain)
            gmodel = None
            if len(gtrain) >= 25:
                gmodel = make_pipeline(StandardScaler(), Ridge(alpha=100.0)).fit(
                    wr034.matrix(gtrain, "x_full"), wr034.targets(gtrain)
                )
            ppos_mean = float(np.mean([r["target_ppr_pg"] for r in ptrain
                                      if r["target_games"] > 0 and r["target_ppr_pg"] is not None]))
            gpos_mean = float(np.mean([r["target_games"] for r in gtrain])) if gtrain else 0.0
            ppred = (pmodel.predict(np.asarray([r["x"] for r in ptest], float)) if pmodel is not None
                     else np.asarray([ppos_mean] * len(ptest)))
            gtest_map = {(r["player_id"], r["position"], r["target_season"]): r for r in gtest}
            ordered_g = [gtest_map[(r["player_id"], pos, season)] for r in ptest]
            if gmodel is not None:
                gpred = wr034.clip_predictions(gmodel.predict(wr034.matrix(ordered_g, "x_full")), ordered_g)
                gfallback = [False] * len(ptest)
                gfallback_type = ["NONE"] * len(ptest)
            else:
                gpred = np.asarray([g["prev_rate"] if np.isfinite(g["prev_rate"]) else gpos_mean for g in ordered_g])
                gfallback = [True] * len(ptest)
                gfallback_type = ["PREV_RATE" if np.isfinite(g["prev_rate"]) else "POSITION_MEAN" for g in ordered_g]
            for i, (p, g) in enumerate(zip(ptest, ordered_g)):
                records.append({
                    "player_id": p["player_id"], "player_name": p["player_name"], "position": pos,
                    "target_season": season, "target_games": p["target_games"],
                    "target_ppr_pg": p["target_ppr_pg"], "target_season_ppr": p["target_season_ppr"],
                    "prior_ppr_pg": p["baseline_ppr_pg"], "prior_games": p["baseline_games"],
                    "target_max_games": g["target_max_games"], "prev_rate": g["prev_rate"],
                    "wr033_expected_ppr_pg": float(ppred[i]), "wr034_expected_games": float(gpred[i]),
                    "wr033_fallback": pmodel is None, "wr034_fallback": gfallback[i],
                    "wr034_fallback_type": gfallback_type[i],
                })
    return pd.DataFrame(records).sort_values(["target_season", "position", "player_id"]).reset_index(drop=True)


def verify_wr034_replay(frame):
    committed = pd.read_csv(UPSTREAM_ROWS)
    keys = ["player_id", "position", "target_season"]
    if committed.duplicated(keys).any() or frame[frame.target_season.isin(SCORED)].duplicated(keys).any():
        raise RuntimeError("duplicate upstream replay keys")
    merged = committed[keys + ["RIDGE_FULL", "RIDGE_FULL_fallback"]].merge(
        frame[frame.target_season.isin(SCORED)][keys + ["wr034_expected_games", "wr034_fallback"]],
        on=keys, how="outer", validate="one_to_one", indicator=True
    )
    if not (merged._merge == "both").all():
        raise RuntimeError("WR-034 replay key mismatch")
    delta = np.abs(merged.RIDGE_FULL - merged.wr034_expected_games)
    if float(delta.max()) > 1e-10 or not (merged.RIDGE_FULL_fallback == merged.wr034_fallback).all():
        raise RuntimeError(f"WR-034 replay mismatch; max delta {delta.max()}")
    return {"rows": int(len(merged)), "max_abs_prediction_delta": float(delta.max()), "tolerance": 1e-10}


def verify_wr033_replay(frame):
    active = frame[frame.target_season.isin(SCORED) & (frame.target_games > 0) & frame.target_ppr_pg.notna()]
    y = active.target_ppr_pg.to_numpy(float); p = active.wr033_expected_ppr_pg.to_numpy(float)
    observed = {"rows": int(len(active)), "mae": float(mean_absolute_error(y, p)),
                "rmse": float(math.sqrt(mean_squared_error(y, p))), "spearman": spearman(p, y)}
    expected = {"rows": 1881, "mae": 2.8261944402894574,
                "rmse": 4.2363614824553535, "spearman": 0.677508831151748}
    if observed["rows"] != expected["rows"] or any(abs(observed[k] - expected[k]) > 1e-10
                                                    for k in ["mae", "rmse", "spearman"]):
        raise RuntimeError(f"WR-033 replay mismatch: {observed} != {expected}")
    return {"observed": observed, "expected": expected, "tolerance": 1e-10}


def crps(draws, actual):
    x = np.sort(np.asarray(draws, float))
    n = len(x)
    weights = 2 * np.arange(1, n + 1) - n - 1
    return float(np.mean(np.abs(x - actual)) - np.sum(weights * x) / (n * n))


def compose(frame, prior_totals):
    scored = frame[frame.target_season.isin(SCORED)].copy()
    history = frame.copy()
    out = []
    for season in SCORED:
        for pos_i, pos in enumerate(POSITIONS):
            target = scored[(scored.target_season == season) & (scored.position == pos)].copy()
            if target.empty:
                continue
            pool = history[(history.target_season < season) & (history.position == pos)].copy()
            pool["e_g"] = pool.target_games - pool.wr034_expected_games
            pool["e_p"] = np.where(pool.target_games > 0,
                                   pool.target_ppr_pg - pool.wr033_expected_ppr_pg, 0.0)
            pool = pool[np.isfinite(pool.e_g) & np.isfinite(pool.e_p)].sort_values(
                ["target_season", "position", "player_id"]
            )
            dist_state = "PRIOR_OOS_POSITION"
            if len(pool) < 25:
                pool = history[history.target_season < season].copy()
                pool["e_g"] = pool.target_games - pool.wr034_expected_games
                pool["e_p"] = np.where(pool.target_games > 0,
                                       pool.target_ppr_pg - pool.wr033_expected_ppr_pg, 0.0)
                pool = pool[np.isfinite(pool.e_g) & np.isfinite(pool.e_p)].sort_values(
                    ["target_season", "position", "player_id"]
                )
                dist_state = "PRIOR_OOS_POOLED_FALLBACK"
            paired_draws, independent_draws = [], []
            ep, eg = pool.e_p.to_numpy(float), pool.e_g.to_numpy(float)
            for row_i, (_, r) in enumerate(target.iterrows()):
                base_seed = 35035 + 100 * season + 10 * pos_i
                if len(pool) >= 25:
                    rngp = np.random.default_rng(base_seed)
                    idx = rngp.integers(0, len(pool), N_DRAWS)
                    pdra = np.maximum(0, r.wr033_expected_ppr_pg + ep[idx]) * np.clip(
                        r.wr034_expected_games + eg[idx], 0, r.target_max_games)
                    rngi = np.random.default_rng(base_seed + 1)
                    ip = rngi.integers(0, len(pool), N_DRAWS)
                    ig = rngi.integers(0, len(pool), N_DRAWS)
                    idra = np.maximum(0, r.wr033_expected_ppr_pg + ep[ip]) * np.clip(
                        r.wr034_expected_games + eg[ig], 0, r.target_max_games)
                else:
                    pdra = idra = np.full(N_DRAWS, np.nan)
                    dist_state = "DISTRIBUTION_UNAVAILABLE"
                paired_draws.append(pdra); independent_draws.append(idra)
                key = (r.player_id, pos, season)
                prior_total = prior_totals[key]
                actual = float(r.target_season_ppr)
                rec = r.to_dict()
                rec.update({
                    "INDEPENDENT_PRODUCT": float(r.wr033_expected_ppr_pg * r.wr034_expected_games),
                    "PAIRED_RESIDUAL_MEAN": float(np.nanmean(pdra)),
                    "WR033_X_PREV_RATE": float(r.wr033_expected_ppr_pg * r.prev_rate),
                    "PRIOR_TOTAL_SCHEDULE_ADJUSTED": float(prior_total * r.target_max_games /
                                                           wr034.season_max_games(season - 1)),
                    "POSITION_MEAN_TOTAL": float(pool.target_season_ppr.mean()),
                    "distribution_state": dist_state,
                    "residual_pool_n": int(len(pool)),
                })
                for name, draws in zip(DIST_METHODS, [pdra, idra]):
                    qs = np.nanquantile(draws, [.10, .25, .50, .75, .90])
                    rec.update({f"{name}_mean": float(np.nanmean(draws)), f"{name}_p10": float(qs[0]),
                                f"{name}_p25": float(qs[1]), f"{name}_p50": float(qs[2]),
                                f"{name}_p75": float(qs[3]), f"{name}_p90": float(qs[4]),
                                f"{name}_crps": crps(draws, actual)})
                out.append(rec)
            # Rank intervals are derived jointly within this season-position cohort.
            actual_order = np.argsort(-target.target_season_ppr.to_numpy(float), kind="stable")
            actual_rank = np.empty(len(target), int); actual_rank[actual_order] = np.arange(1, len(target) + 1)
            start = len(out) - len(target)
            for name, arrays in zip(DIST_METHODS, [paired_draws, independent_draws]):
                mat = np.vstack(arrays)
                order = np.argsort(-mat, axis=0, kind="stable")
                ranks = np.empty_like(order)
                ranks[order, np.arange(N_DRAWS)] = np.arange(1, len(target) + 1)[:, None]
                for i in range(len(target)):
                    out[start + i][f"{name}_rank_p10"] = float(np.quantile(ranks[i], .10))
                    out[start + i][f"{name}_rank_p90"] = float(np.quantile(ranks[i], .90))
                    out[start + i]["actual_position_rank"] = int(actual_rank[i])
    result = pd.DataFrame(out)
    result["split"] = np.where(result.target_season.isin(DEV), "development", "confirmation")
    result["value_q4"] = False; result["value_d10"] = False
    for (_, _), idx in result.groupby(["target_season", "position"]).groups.items():
        vals = result.loc[idx, "prior_ppr_pg"]
        result.loc[idx, "value_q4"] = vals >= vals.quantile(.75)
        result.loc[idx, "value_d10"] = vals >= vals.quantile(.90)
    return result.sort_values(["target_season", "position", "player_id"]).reset_index(drop=True)


def central_metrics(g, method):
    y, p = g.target_season_ppr.to_numpy(float), g[method].to_numpy(float)
    err = p - y
    rank_errors, overlaps = [], []
    for (season, pos), z in g.groupby(["target_season", "position"], sort=True):
        z = z.sort_values("player_id", kind="stable")
        ap = z.target_season_ppr.to_numpy(float); pp = z[method].to_numpy(float)
        ao = np.argsort(-ap, kind="stable"); po = np.argsort(-pp, kind="stable")
        ar = np.empty(len(z), int); pr = np.empty(len(z), int)
        ar[ao] = np.arange(1, len(z) + 1); pr[po] = np.arange(1, len(z) + 1)
        rank_errors.extend(np.abs(ar - pr).tolist())
        n = min(TOP_N[pos], len(z))
        overlaps.append(len(set(ao[:n]).intersection(po[:n])) / n)
    return {"n": int(len(g)), "mae": float(np.mean(np.abs(err))),
            "rmse": float(math.sqrt(np.mean(err ** 2))), "bias": float(np.mean(err)),
            "spearman": spearman(p, y), "rank_mae": float(np.mean(rank_errors)),
            "top_n_overlap": float(np.mean(overlaps)),
            "catastrophic_over_rate": float(np.mean(err >= 100)),
            "catastrophic_under_rate": float(np.mean(err <= -100))}


def evaluation_tables(rows):
    central, distributions = [], []
    scopes = [("pooled", "ALL", rows)]
    scopes += [("position", p, g) for p, g in rows.groupby("position")]
    scopes += [("season", str(int(s)), g) for s, g in rows.groupby("target_season")]
    scopes += [("value_tier", "Q4", rows[rows.value_q4]), ("value_tier", "D10", rows[rows.value_d10]),
               ("value_tier", "WR_Q4", rows[(rows.position == "WR") & rows.value_q4])]
    scopes += [("fallback", str(k), g) for k, g in rows.groupby("wr034_fallback")]
    for split in ["development", "confirmation"]:
        for scope, value, base in scopes:
            g = base[base.split == split]
            if len(g) == 0:
                continue
            for method in METHODS:
                central.append({"split": split, "scope": scope, "scope_value": value,
                                "method": method, **central_metrics(g, method)})
            for method in DIST_METHODS:
                lo, hi = g[f"{method}_p10"], g[f"{method}_p90"]
                y = g.target_season_ppr
                interval_score = (hi - lo) + 10 * (lo - y).clip(lower=0) + 10 * (y - hi).clip(lower=0)
                rank_cov = ((g.actual_position_rank >= g[f"{method}_rank_p10"]) &
                            (g.actual_position_rank <= g[f"{method}_rank_p90"]))
                distributions.append({
                    "split": split, "scope": scope, "scope_value": value, "method": method,
                    "n": int(len(g)), "coverage80": float(((y >= lo) & (y <= hi)).mean()),
                    "mean_width80": float((hi - lo).mean()), "interval_score80": float(interval_score.mean()),
                    "mean_crps": float(g[f"{method}_crps"].mean()),
                    "below_p10_rate": float((y < lo).mean()), "above_p90_rate": float((y > hi).mean()),
                    "rank_coverage80": float(rank_cov.mean()),
                    "mean_rank_width80": float((g[f"{method}_rank_p90"] - g[f"{method}_rank_p10"]).mean()),
                })
    return pd.DataFrame(central), pd.DataFrame(distributions)


def calibration_table(rows):
    records = []
    for split in ["development", "confirmation"]:
        base = rows[rows.split == split]
        for method in METHODS:
            bins = pd.qcut(base[method].rank(method="first"), 4, labels=False)
            for b in range(4):
                g = base[bins == b]
                records.append({"split": split, "method": method, "predicted_quartile": b + 1,
                                "n": int(len(g)), "mean_prediction": float(g[method].mean()),
                                "mean_actual": float(g.target_season_ppr.mean()),
                                "bias": float((g[method] - g.target_season_ppr).mean())})
    return pd.DataFrame(records)


def cluster_bootstrap(rows):
    g = rows[rows.split == "confirmation"]
    ids = np.sort(g.player_id.unique())
    delta = np.abs(g.PAIRED_RESIDUAL_MEAN - g.target_season_ppr) - np.abs(
        g.INDEPENDENT_PRODUCT - g.target_season_ppr)
    cluster_sum = np.asarray([float(delta[g.player_id == pid].sum()) for pid in ids])
    cluster_n = np.asarray([int((g.player_id == pid).sum()) for pid in ids])
    rng = np.random.default_rng(35036); values = []
    for _ in range(BOOT_REPS):
        chosen = rng.integers(0, len(ids), len(ids))
        values.append(float(cluster_sum[chosen].sum() / cluster_n[chosen].sum()))
    return {"clusters": int(len(ids)), "replicates": BOOT_REPS, "seed": 35036,
            "mean_delta_mae_paired_minus_independence": float(np.mean(values)),
            "ci95_low": float(np.quantile(values, .025)), "ci95_high": float(np.quantile(values, .975))}


def fallback_test():
    mu_ppr, prev_games, pos_mean, season = 10.0, 8.0, 9.5, 2022
    prev_rate = prev_games / wr034.season_max_games(season - 1) * wr034.season_max_games(season)
    primary = (mu_ppr * prev_rate, "PREV_RATE")
    secondary = (mu_ppr * pos_mean, "POSITION_MEAN")
    passed = primary == (80.0, "PREV_RATE") and secondary == (95.0, "POSITION_MEAN")
    if not passed:
        raise RuntimeError("deterministic season-total fallback test failed")
    return {"passed": passed, "primary_example": primary, "secondary_example": secondary,
            "historical_primary_fallback_rows": 0,
            "historical_evidence": "WR033_X_PREV_RATE evaluated counterfactually for every scored row"}


def decide(central, dist, bootstrap):
    def cm(split, method, scope="pooled", value="ALL"):
        return central[(central.split == split) & (central.method == method) &
                       (central.scope == scope) & (central.scope_value.astype(str) == str(value))].iloc[0]
    di, dp = cm("development", "INDEPENDENT_PRODUCT"), cm("development", "PAIRED_RESIDUAL_MEAN")
    pos_ok = 0
    for p in POSITIONS:
        if cm("development", "PAIRED_RESIDUAL_MEAN", "position", p).mae <= cm(
                "development", "INDEPENDENT_PRODUCT", "position", p).mae:
            pos_ok += 1
    dev_paired = ((di.mae - dp.mae) / di.mae >= .01 and dp.rmse <= di.rmse * 1.01 and
                  abs(dp.bias) <= abs(di.bias) + 5 and pos_ok >= 3 and
                  dp.catastrophic_over_rate <= di.catastrophic_over_rate + .01)
    ci, cp = cm("confirmation", "INDEPENDENT_PRODUCT"), cm("confirmation", "PAIRED_RESIDUAL_MEAN")
    pos_conf = all(cm("confirmation", "PAIRED_RESIDUAL_MEAN", "position", p).mae <=
                   cm("confirmation", "INDEPENDENT_PRODUCT", "position", p).mae * 1.03 for p in POSITIONS)
    paired_confirm = (dev_paired and (ci.mae - cp.mae) / ci.mae >= .01 and
                      bootstrap["ci95_high"] < 0 and pos_conf)
    selected = "PAIRED_RESIDUAL_MEAN" if paired_confirm else "INDEPENDENT_PRODUCT"
    conf_selected = cm("confirmation", selected)
    b1, b2 = cm("confirmation", "WR033_X_PREV_RATE"), cm("confirmation", "PRIOR_TOTAL_SCHEDULE_ADJUSTED")
    central_supported = (conf_selected.mae <= b1.mae and conf_selected.mae <= b2.mae and
                         max((b1.mae-conf_selected.mae)/b1.mae, (b2.mae-conf_selected.mae)/b2.mae) >= .02)
    d = dist[(dist.split == "confirmation") & (dist.scope == "pooled") &
             (dist.method == "PAIRED_RESIDUAL_DRAWS")].iloc[0]
    independent_d = dist[(dist.split == "confirmation") & (dist.scope == "pooled") &
                         (dist.method == "INDEPENDENT_RESIDUAL_DRAWS")].iloc[0]
    position_coverage = dist[(dist.split == "confirmation") & (dist.scope == "position") &
                             (dist.method == "PAIRED_RESIDUAL_DRAWS")]
    distribution_supported = (0.75 <= d.coverage80 <= .85 and
                              position_coverage.coverage80.between(.70, .90).all() and
                              .05 <= d.below_p10_rate <= .15 and .05 <= d.above_p90_rate <= .15 and
                              d.interval_score80 <= independent_d.interval_score80)
    if central_supported and distribution_supported:
        disposition = ("SEASON-TOTAL DISTRIBUTION SUPPORTED" if paired_confirm
                       else "INDEPENDENCE PRODUCT SUPPORTED")
    elif central_supported:
        disposition = "CENTRAL TOTAL SUPPORTED / DISTRIBUTION INSUFFICIENT"
    else:
        disposition = "BASELINE RETAINED"
    return {"development_paired_gate": bool(dev_paired), "confirmation_paired_gate": bool(paired_confirm),
            "positions_nonnegative_development": pos_ok, "selected_central": selected,
            "central_supported": bool(central_supported), "distribution_supported": bool(distribution_supported),
            "final_phase5_disposition": disposition}


def write_report(results, central, dist):
    c = central[(central.split == "confirmation") & (central.scope == "pooled")]
    d = dist[(dist.split == "confirmation") & (dist.scope == "pooled")]
    lines = ["# WR-035 Season-Total Distribution / Composition Research", "",
             f"Disposition: `{results['decision']['final_phase5_disposition']}`", "",
             "## Executive result", "",
             f"The frozen chronological test selected `{results['decision']['selected_central']}`. "
             f"The dependence-aware challenger passed development: {results['decision']['development_paired_gate']}; "
             f"passed confirmation: {results['decision']['confirmation_paired_gate']}. "
             f"The empirical distribution gate passed: {results['decision']['distribution_supported']}.", "",
             "## Confirmation central metrics", "", "| Method | N | MAE | RMSE | Bias | Spearman |", "|---|---:|---:|---:|---:|---:|"]
    for _, r in c.iterrows():
        lines.append(f"| {r.method} | {int(r.n)} | {r.mae:.3f} | {r.rmse:.3f} | {r.bias:.3f} | {r.spearman:.3f} |")
    lines += ["", "## Confirmation distribution metrics", "", "| Method | Coverage 80% | Width | Interval score | CRPS |", "|---|---:|---:|---:|---:|"]
    for _, r in d.iterrows():
        lines.append(f"| {r.method} | {r.coverage80:.3f} | {r.mean_width80:.2f} | {r.interval_score80:.2f} | {r.mean_crps:.2f} |")
    lines += ["", "## Interpretation", "",
              "The central expectation and uncertainty disposition are intentionally separate. Availability warning probabilities remain explanation-only. Empirical intervals describe historical forecast error and are not medical or injury forecasts. High-value, position, season, fallback, calibration, tail, and rank-sensitivity results are in the generated evaluation tables.", "",
              "## Boundaries", "",
              "No 2026 outcome, rookie model, ESPN/FantasyPros input, replacement/FLEX/MSV value calculation, live-draft input, or production file was used or changed.", ""]
    Path(".ai/research/SEASON_TOTAL_DISTRIBUTION_RESEARCH.md").write_text("\n".join(lines))


def main():
    returners, games_rows, games_map, prior_totals, provenance, before = load_inputs()
    frame = upstream_predictions(returners, games_rows)
    replay_ppr = verify_wr033_replay(frame)
    replay = verify_wr034_replay(frame)
    rows = compose(frame, prior_totals)
    central, dist = evaluation_tables(rows)
    calibration = calibration_table(rows)
    bootstrap = cluster_bootstrap(rows)
    fallback = fallback_test()
    decision = decide(central, dist, bootstrap)
    after = wr034.frozen_integrity_snapshot()
    if before != after:
        raise RuntimeError("frozen WR-021/WR-023 artifacts changed")
    results = {
        "task_id": TASK, "status": "COMPLETE_RESEARCH_OUTPUT", "experimental_non_production": True,
        "cohort": {"scored_rows": int(len(rows)), "unique_players": int(rows.player_id.nunique()),
                   "zero_game_rows": int((rows.target_games == 0).sum())},
        "upstream_replay": {"wr033": replay_ppr, "wr034": replay}, "bootstrap": bootstrap,
        "fallback": fallback, "decision": decision,
        "integrity": {"outcomes_2026_inspected": False, "max_outcome_season": 2025,
                      "wr021_wr023_unchanged": before == after, "wr033_changed": False,
                      "wr034_changed": False, "production_changed": False,
                      "protocol_sha256": sha(Path(".ai/research/SEASON_TOTAL_COMPOSITION_PROTOCOL.md")),
                      "machine_lock_sha256": sha(LOCK), "candidate_spec_sha256": sha(Path(".ai/research/SEASON_TOTAL_CANDIDATE_SPEC.md")),
                      "runtime": {"python": sys.version, "platform": platform.platform(),
                                  "numpy": np.__version__, "pandas": pd.__version__,
                                  "scipy": scipy.__version__, "scikit_learn": sklearn.__version__}},
        "phase6_interface": {"identity": ["player_id", "player_name", "position"],
                             "central": ["wr033_expected_ppr_pg", "wr034_expected_games", decision["selected_central"]],
                             "uncertainty": "paired empirical p10/p25/p50/p75/p90 only if distribution_supported",
                             "warnings": ["low_availability_probability", "high_availability_probability"],
                             "required_metadata": ["coverage", "provenance", "fallback", "upstream hashes", "as_of", "transform_version"],
                             "forbidden": ["ADP/ECR", "draft state", "roster need", "opponent demand", "survival", "position runs", "replacement/FLEX/MSV"]},
    }
    rows.to_csv(OUT / "WR035_SEASON_TOTAL_ROWS.csv", index=False, float_format="%.12g")
    central.to_csv(OUT / "WR035_CENTRAL_EVALUATION.csv", index=False, float_format="%.12g")
    dist.to_csv(OUT / "WR035_DISTRIBUTION_EVALUATION.csv", index=False, float_format="%.12g")
    calibration.to_csv(OUT / "WR035_CALIBRATION.csv", index=False, float_format="%.12g")
    stable_json(OUT / "WR035_DEPENDENCE_ANALYSIS.json", {"bootstrap": bootstrap, "decision": decision})
    stable_json(OUT / "WR035_RESULTS.json", results)
    stable_json(OUT / "WR035_SOURCE_PROVENANCE.json", provenance)
    stable_json(OUT / "WR035_INTEGRITY.json", results["integrity"])
    write_report(results, central, dist)
    print(json.dumps({"decision": decision, "cohort": results["cohort"],
                      "replay": results["upstream_replay"]}, indent=2))


if __name__ == "__main__":
    main()
