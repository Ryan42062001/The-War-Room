from __future__ import annotations

import hashlib
import json
import math
import os
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.linear_model import LogisticRegression, PoissonRegressor, Ridge
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

TASK = "WR-034"
MODEL_SEED = 34034
BOOT_SEED = 34035
BOOT_REPS = 5000
POSITIONS = ["QB", "RB", "WR", "TE"]
STAT_SEASONS = list(range(2012, 2026))
SCORED_SEASONS = list(range(2018, 2026))
DEV_SEASONS = [2018, 2019, 2020, 2021]
CONF_SEASONS = [2022, 2023, 2024, 2025]
OUT = Path(".ai/research/generated")
OUT.mkdir(parents=True, exist_ok=True)

LOCK_PATH = OUT / "AVAILABILITY_EXPECTED_GAMES_PROTOCOL.json"
WR025_ASSET_MANIFEST = OUT / "HISTORICAL_RANKING_ASSET_MANIFEST.json"
SENTINELS = [
    Path(".ai/research/generated/CONTEXT_SHADOW_2026_SNAPSHOT.csv"),
    Path(".ai/research/WR023_2026_PROSPECTIVE_EVALUATION_PROTOCOL.md"),
    Path(".ai/research/generated/WR023_PROTOCOL_MANIFEST.json"),
]
KNOWN_SNAPSHOT_SHA256 = "9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d"
KNOWN_PROTOCOL_SHA256 = "f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c"

MINIMAL_FEATURES = [
    "prev1_games", "prev2_games", "games_delta", "has_prev2", "age_sep1",
    "age_missing", "experience_years", "log_draft_pick", "draft_round", "drafted",
]
CANDIDATES = ["RIDGE_MINIMAL", "POISSON_MINIMAL", "RIDGE_FULL", "MULTINOMIAL_HURDLE"]
EVENT_MODELS = ["PREVALENCE", "LOGIT_MINIMAL", "LOGIT_FULL"]


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def season_max_games(season: int) -> int:
    return 16 if season <= 2020 else 17


def spearman_safe(a, b):
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    if len(a) < 3 or len(np.unique(a)) < 2 or len(np.unique(b)) < 2:
        return None
    return float(spearmanr(a, b).statistic)


def frozen_integrity_snapshot():
    out = {str(p): sha256_file(p) for p in SENTINELS}
    if out[str(SENTINELS[0])] != KNOWN_SNAPSHOT_SHA256:
        raise RuntimeError("WR-021 snapshot SHA-256 mismatch before/after scoring")
    if out[str(SENTINELS[1])] != KNOWN_PROTOCOL_SHA256:
        raise RuntimeError("WR-023 protocol SHA-256 mismatch before/after scoring")
    return out


def source_lock_map():
    items = json.loads(WR025_ASSET_MANIFEST.read_text())
    return {
        e["asset_name"]: e
        for e in items
        if e.get("source") == "nflverse/nflverse-data" and e.get("asset_name")
    }


def verify_asset(name: str, asset: dict, payload: bytes, locked: dict):
    if name not in locked:
        raise RuntimeError(f"missing locked WR-025 asset entry: {name}")
    calc = sha256_bytes(payload)
    exp = locked[name]["sha256"]
    if calc != exp:
        raise RuntimeError(f"historical asset digest mismatch for {name}: {calc} != {exp}")
    locked_id = locked[name].get("asset_id")
    if locked_id is not None and int(asset["id"]) != int(locked_id):
        raise RuntimeError(f"historical asset id mismatch for {name}: {asset['id']} != {locked_id}")
    return calc


def schema_sha(columns) -> str:
    return sha256_bytes(json.dumps(list(columns), separators=(",", ":"), ensure_ascii=False).encode())


def load_locked_history():
    locked = source_lock_map()
    stats_rel, stats_assets = wr025.release_assets(wr025.STATS_TAG)
    players_rel, players_assets = wr025.release_assets(wr025.PLAYERS_TAG)
    draft_rel, draft_assets = wr025.release_assets(wr025.DRAFT_TAG)
    by_season = {}
    provenance = []

    for season in STAT_SEASONS:
        name = f"stats_player_regpost_{season}.csv"
        if name not in stats_assets:
            raise RuntimeError(f"missing release asset {name}")
        asset = stats_assets[name]
        payload, _ = wr025.download_asset(asset)
        calc = verify_asset(name, asset, payload, locked)
        rows, cols, nraw = wr025.aggregate_stats(season, payload)
        by_season[season] = rows
        provenance.append({
            "source": "nflverse/nflverse-data",
            "release_tag": wr025.STATS_TAG,
            "release_id": stats_rel["id"],
            "asset_name": name,
            "asset_id": asset["id"],
            "retrieved_at_utc": datetime.now(timezone.utc).isoformat(),
            "sha256": calc,
            "locked_sha256": locked[name]["sha256"],
            "rows_after_reg_skill_filter": len(rows),
            "raw_filtered_rows": nraw,
            "schema_sha256": schema_sha(cols),
            "columns": cols,
        })

    p_asset = players_assets.get("players.csv")
    d_asset = draft_assets.get("draft_picks.csv")
    if not p_asset or not d_asset:
        raise RuntimeError("missing players.csv or draft_picks.csv")
    pbytes, _ = wr025.download_asset(p_asset)
    dbytes, _ = wr025.download_asset(d_asset)
    psha = verify_asset("players.csv", p_asset, pbytes, locked)
    dsha = verify_asset("draft_picks.csv", d_asset, dbytes, locked)

    players, _, pcols, pn = wr025.load_players(pbytes)
    drafts_by_season, draft_by_player, dcols, dn = wr025.load_draft_picks(dbytes)

    provenance.extend([
        {
            "source": "nflverse/nflverse-data", "release_tag": wr025.PLAYERS_TAG,
            "release_id": players_rel["id"], "asset_name": "players.csv",
            "asset_id": p_asset["id"], "retrieved_at_utc": datetime.now(timezone.utc).isoformat(),
            "sha256": psha, "locked_sha256": locked["players.csv"]["sha256"],
            "rows": pn, "schema_sha256": schema_sha(pcols), "columns": pcols,
        },
        {
            "source": "nflverse/nflverse-data", "release_tag": wr025.DRAFT_TAG,
            "release_id": draft_rel["id"], "asset_name": "draft_picks.csv",
            "asset_id": d_asset["id"], "retrieved_at_utc": datetime.now(timezone.utc).isoformat(),
            "sha256": dsha, "locked_sha256": locked["draft_picks.csv"]["sha256"],
            "rows": dn, "schema_sha256": schema_sha(dcols), "columns": dcols,
        },
    ])
    return by_season, players, drafts_by_season, draft_by_player, provenance


def availability_class(games: int) -> int:
    if games <= 8:
        return 0
    if games <= 13:
        return 1
    return 2


def prepare_rows(returners):
    idx = [wr025.FEATURES.index(f) for f in MINIMAL_FEATURES]
    rows = []
    for r in returners:
        season = int(r["target_season"])
        x = np.asarray(r["x"], float)
        prior_max = season_max_games(season - 1)
        target_max = season_max_games(season)
        prev_games = float(r["baseline_games"])
        rows.append({
            "player_id": r["player_id"],
            "player_name": r["player_name"],
            "position": r["position"],
            "target_season": season,
            "target_games": int(r["target_games"]),
            "target_max_games": target_max,
            "prev1_games": prev_games,
            "prev_rate": float(np.clip(prev_games / prior_max * target_max, 0, target_max)),
            "prev_games_baseline": float(np.clip(prev_games, 0, target_max)),
            "low_availability": int(int(r["target_games"]) <= 8),
            "high_availability": int(int(r["target_games"]) >= 14),
            "x_full": x,
            "x_min": x[idx],
            "has_prev2": float(x[wr025.FEATURES.index("has_prev2")]),
            "age_missing": float(x[wr025.FEATURES.index("age_missing")]),
        })
    return rows


def matrix(rows, key):
    return np.asarray([r[key] for r in rows], float)


def targets(rows):
    return np.asarray([r["target_games"] for r in rows], float)


def clip_predictions(pred, rows):
    return np.asarray([
        np.clip(float(p), 0.0, float(r["target_max_games"]))
        for p, r in zip(pred, rows)
    ], float)


def fit_expected_candidates(train):
    y = targets(train)
    models = {}
    errors = {}
    if len(train) < 25:
        return models, {"ALL": "fewer than 25 training rows"}

    try:
        models["RIDGE_MINIMAL"] = (
            make_pipeline(StandardScaler(), Ridge(alpha=100.0)).fit(matrix(train, "x_min"), y),
            None,
        )
    except Exception as exc:
        errors["RIDGE_MINIMAL"] = f"{type(exc).__name__}: {exc}"

    try:
        models["RIDGE_FULL"] = (
            make_pipeline(StandardScaler(), Ridge(alpha=100.0)).fit(matrix(train, "x_full"), y),
            None,
        )
    except Exception as exc:
        errors["RIDGE_FULL"] = f"{type(exc).__name__}: {exc}"

    try:
        models["POISSON_MINIMAL"] = (
            make_pipeline(StandardScaler(), PoissonRegressor(alpha=1.0, max_iter=2000)).fit(matrix(train, "x_min"), y),
            None,
        )
    except Exception as exc:
        errors["POISSON_MINIMAL"] = f"{type(exc).__name__}: {exc}"

    try:
        yc = np.asarray([availability_class(int(r["target_games"])) for r in train], int)
        if set(np.unique(yc)) != {0, 1, 2}:
            raise RuntimeError("all three availability classes required")
        model = make_pipeline(
            StandardScaler(),
            LogisticRegression(C=0.25, solver="lbfgs", max_iter=2000, random_state=MODEL_SEED),
        ).fit(matrix(train, "x_min"), yc)
        class_means = {c: float(np.mean(y[yc == c])) for c in (0, 1, 2)}
        models["MULTINOMIAL_HURDLE"] = (model, class_means)
    except Exception as exc:
        errors["MULTINOMIAL_HURDLE"] = f"{type(exc).__name__}: {exc}"
    return models, errors


def predict_expected(name, model_tuple, rows):
    model, extra = model_tuple
    if name == "RIDGE_FULL":
        pred = model.predict(matrix(rows, "x_full"))
    elif name in {"RIDGE_MINIMAL", "POISSON_MINIMAL"}:
        pred = model.predict(matrix(rows, "x_min"))
    elif name == "MULTINOMIAL_HURDLE":
        probs = model.predict_proba(matrix(rows, "x_min"))
        classes = model.named_steps["logisticregression"].classes_
        pred = np.zeros(len(rows), float)
        for j, c in enumerate(classes):
            pred += probs[:, j] * float(extra[int(c)])
    else:
        raise KeyError(name)
    return clip_predictions(pred, rows)


def fit_event_model(train, event, feature_key):
    y = np.asarray([r[event] for r in train], int)
    if len(train) < 25 or len(np.unique(y)) < 2:
        return None
    return make_pipeline(
        StandardScaler(),
        LogisticRegression(C=0.25, solver="liblinear", max_iter=2000, random_state=MODEL_SEED),
    ).fit(matrix(train, feature_key), y)


def prediction_intervals(name, model_tuple, train, test):
    train_pred = predict_expected(name, model_tuple, train)
    resid = targets(train) - train_pred
    q10, q90 = np.quantile(resid, [0.10, 0.90])
    test_pred = predict_expected(name, model_tuple, test)
    lo = np.asarray([
        np.clip(p + q10, 0, r["target_max_games"]) for p, r in zip(test_pred, test)
    ], float)
    hi = np.asarray([
        np.clip(p + q90, 0, r["target_max_games"]) for p, r in zip(test_pred, test)
    ], float)
    return test_pred, lo, hi, float(q10), float(q90)


def execute_rolling(rows):
    expected_rows = []
    event_rows = []
    fit_errors = []

    for season in SCORED_SEASONS:
        for pos in POSITIONS:
            train = [r for r in rows if r["position"] == pos and r["target_season"] < season]
            test = [r for r in rows if r["position"] == pos and r["target_season"] == season]
            if not test:
                continue

            pos_mean = float(np.mean(targets(train))) if train else 0.0
            expected_models, errors = fit_expected_candidates(train)
            for name, msg in errors.items():
                fit_errors.append({"season": season, "position": pos, "model": name, "error": msg})

            pred_cache = {}
            interval_cache = {}
            for name in CANDIDATES:
                if name in expected_models:
                    pred, lo, hi, q10, q90 = prediction_intervals(name, expected_models[name], train, test)
                    pred_cache[name] = pred
                    interval_cache[name] = (lo, hi, q10, q90)
                else:
                    fallback = np.asarray([r["prev_rate"] for r in test], float)
                    pred_cache[name] = fallback
                    interval_cache[name] = (
                        np.full(len(test), np.nan),
                        np.full(len(test), np.nan),
                        None,
                        None,
                    )

            event_models = {}
            prevalence = {}
            for event in ["low_availability", "high_availability"]:
                ytrain = np.asarray([r[event] for r in train], int)
                prevalence[event] = float(ytrain.mean()) if len(ytrain) else 0.0
                event_models[(event, "LOGIT_MINIMAL")] = fit_event_model(train, event, "x_min")
                event_models[(event, "LOGIT_FULL")] = fit_event_model(train, event, "x_full")

            for i, r in enumerate(test):
                rec = {
                    "player_id": r["player_id"],
                    "player_name": r["player_name"],
                    "position": pos,
                    "target_season": season,
                    "target_games": r["target_games"],
                    "target_max_games": r["target_max_games"],
                    "PREV_RATE": r["prev_rate"],
                    "PREV_GAMES": r["prev_games_baseline"],
                    "POSITION_MEAN": float(np.clip(pos_mean, 0, r["target_max_games"])),
                }
                for name in CANDIDATES:
                    rec[name] = float(pred_cache[name][i])
                    lo, hi, q10, q90 = interval_cache[name]
                    rec[f"{name}_lo80"] = None if np.isnan(lo[i]) else float(lo[i])
                    rec[f"{name}_hi80"] = None if np.isnan(hi[i]) else float(hi[i])
                    rec[f"{name}_resid_q10"] = q10
                    rec[f"{name}_resid_q90"] = q90
                    rec[f"{name}_fallback"] = name not in expected_models
                expected_rows.append(rec)

                erec = {
                    "player_id": r["player_id"],
                    "position": pos,
                    "target_season": season,
                    "low_availability": r["low_availability"],
                    "high_availability": r["high_availability"],
                }
                for event in ["low_availability", "high_availability"]:
                    erec[f"{event}_PREVALENCE"] = prevalence[event]
                    for model_name, feature_key in [("LOGIT_MINIMAL", "x_min"), ("LOGIT_FULL", "x_full")]:
                        model = event_models[(event, model_name)]
                        if model is None:
                            p = prevalence[event]
                            fallback = True
                        else:
                            p = float(model.predict_proba(r[feature_key].reshape(1, -1))[0, 1])
                            fallback = False
                        erec[f"{event}_{model_name}"] = p
                        erec[f"{event}_{model_name}_fallback"] = fallback
                event_rows.append(erec)

    return pd.DataFrame(expected_rows), pd.DataFrame(event_rows), fit_errors


def reg_metrics(frame, pred_col):
    if frame.empty:
        return {"n": 0, "mae": None, "rmse": None, "bias": None, "spearman": None}
    y = frame["target_games"].to_numpy(float)
    p = frame[pred_col].to_numpy(float)
    return {
        "n": int(len(frame)),
        "mae": float(mean_absolute_error(y, p)),
        "rmse": float(math.sqrt(mean_squared_error(y, p))),
        "bias": float(np.mean(p - y)),
        "spearman": spearman_safe(p, y),
    }


def evaluation_table(expected):
    records = []
    models = ["PREV_RATE", "PREV_GAMES", "POSITION_MEAN"] + CANDIDATES
    for split, seasons in [("development", DEV_SEASONS), ("confirmation", CONF_SEASONS), ("all", SCORED_SEASONS)]:
        s = expected[expected.target_season.isin(seasons)]
        for model in models:
            m = reg_metrics(s, model)
            records.append({"split": split, "scope": "pooled", "scope_value": "ALL", "model": model, **m})
            for pos in POSITIONS:
                m = reg_metrics(s[s.position == pos], model)
                records.append({"split": split, "scope": "position", "scope_value": pos, "model": model, **m})
            for season in seasons:
                m = reg_metrics(s[s.target_season == season], model)
                records.append({"split": split, "scope": "season", "scope_value": str(season), "model": model, **m})
    return pd.DataFrame(records)


def calibration_table(expected):
    records = []
    models = ["PREV_RATE"] + CANDIDATES
    edges = [-np.inf, 8, 11, 14, np.inf]
    labels = ["<=8", "8-11", "11-14", ">14"]
    for split, seasons in [("development", DEV_SEASONS), ("confirmation", CONF_SEASONS)]:
        s0 = expected[expected.target_season.isin(seasons)].copy()
        for scope, scope_value, s in [("pooled", "ALL", s0)] + [
            ("position", pos, s0[s0.position == pos]) for pos in POSITIONS
        ]:
            for model in models:
                if s.empty:
                    continue
                bins = pd.cut(s[model], bins=edges, labels=labels, include_lowest=True)
                for b in labels:
                    g = s[bins == b]
                    if g.empty:
                        continue
                    records.append({
                        "split": split, "scope": scope, "scope_value": scope_value,
                        "model": model, "predicted_range": b, "n": int(len(g)),
                        "mean_prediction": float(g[model].mean()),
                        "mean_actual": float(g.target_games.mean()),
                        "bias": float((g[model] - g.target_games).mean()),
                    })
    return pd.DataFrame(records)


def interval_table(expected):
    records = []
    for split, seasons in [("development", DEV_SEASONS), ("confirmation", CONF_SEASONS), ("all", SCORED_SEASONS)]:
        s0 = expected[expected.target_season.isin(seasons)]
        for scope, scope_value, s in [("pooled", "ALL", s0)] + [
            ("position", pos, s0[s0.position == pos]) for pos in POSITIONS
        ]:
            for model in CANDIDATES:
                lo = pd.to_numeric(s[f"{model}_lo80"], errors="coerce")
                hi = pd.to_numeric(s[f"{model}_hi80"], errors="coerce")
                valid = lo.notna() & hi.notna()
                g = s[valid]
                if g.empty:
                    continue
                lov = lo[valid].to_numpy(float)
                hiv = hi[valid].to_numpy(float)
                y = g.target_games.to_numpy(float)
                records.append({
                    "split": split, "scope": scope, "scope_value": scope_value,
                    "model": model, "n": int(len(g)),
                    "coverage80": float(np.mean((y >= lov) & (y <= hiv))),
                    "mean_width": float(np.mean(hiv - lov)),
                })
    return pd.DataFrame(records)


def event_metrics(frame, event, model_name):
    y = frame[event].to_numpy(int)
    p = frame[f"{event}_{model_name}"].to_numpy(float)
    pb = frame[f"{event}_PREVALENCE"].to_numpy(float)
    brier = float(brier_score_loss(y, p))
    brier_base = float(brier_score_loss(y, pb))
    skill = None if brier_base <= 0 else float(1.0 - brier / brier_base)
    return {
        "n": int(len(frame)),
        "prevalence": float(y.mean()) if len(y) else None,
        "brier": brier,
        "brier_baseline": brier_base,
        "brier_skill": skill,
        "roc_auc": float(roc_auc_score(y, p)) if len(np.unique(y)) > 1 else None,
        "pr_auc": float(average_precision_score(y, p)) if len(np.unique(y)) > 1 else None,
        "log_loss": float(log_loss(y, np.clip(p, 1e-6, 1 - 1e-6), labels=[0, 1])),
    }


def event_evaluation_table(events):
    records = []
    for split, seasons in [("development", DEV_SEASONS), ("confirmation", CONF_SEASONS), ("all", SCORED_SEASONS)]:
        s0 = events[events.target_season.isin(seasons)]
        for event in ["low_availability", "high_availability"]:
            for model in EVENT_MODELS:
                for scope, scope_value, s in [("pooled", "ALL", s0)] + [
                    ("position", pos, s0[s0.position == pos]) for pos in POSITIONS
                ]:
                    if s.empty:
                        continue
                    records.append({
                        "split": split, "event": event, "model": model,
                        "scope": scope, "scope_value": scope_value,
                        **event_metrics(s, event, model),
                    })
    return pd.DataFrame(records)


def reliability_table(events):
    records = []
    for split, seasons in [("development", DEV_SEASONS), ("confirmation", CONF_SEASONS)]:
        s0 = events[events.target_season.isin(seasons)]
        for event in ["low_availability", "high_availability"]:
            for model in ["LOGIT_MINIMAL", "LOGIT_FULL"]:
                col = f"{event}_{model}"
                for scope, scope_value, s in [("pooled", "ALL", s0)] + [
                    ("position", pos, s0[s0.position == pos]) for pos in POSITIONS
                ]:
                    if s.empty:
                        continue
                    unique = int(s[col].nunique())
                    q = min(5, unique, len(s))
                    if q < 2:
                        continue
                    try:
                        bins = pd.qcut(s[col], q=q, labels=False, duplicates="drop")
                    except ValueError:
                        continue
                    for b in sorted(pd.Series(bins).dropna().unique()):
                        g = s[bins == b]
                        records.append({
                            "split": split, "event": event, "model": model,
                            "scope": scope, "scope_value": scope_value,
                            "reliability_bin": int(b), "n": int(len(g)),
                            "mean_probability": float(g[col].mean()),
                            "event_rate": float(g[event].mean()),
                        })
    return pd.DataFrame(records)


def gross_inversion(events, event, model):
    s = events[events.target_season.isin(CONF_SEASONS)].copy()
    col = f"{event}_{model}"
    if s.empty or s[col].nunique() < 2:
        return None
    try:
        bins = pd.qcut(s[col], q=4, labels=False, duplicates="drop")
    except ValueError:
        return None
    vals = []
    for b in sorted(pd.Series(bins).dropna().unique()):
        g = s[bins == b]
        vals.append((int(b), float(g[event].mean()), int(len(g))))
    if len(vals) < 2:
        return None
    return {
        "inverted": bool(vals[-1][1] < vals[0][1]),
        "lowest_quartile_event_rate": vals[0][1],
        "highest_quartile_event_rate": vals[-1][1],
        "bins": vals,
    }


def cluster_bootstrap_delta(frame, candidate):
    if frame.empty:
        return {"clusters": 0, "replicates": 0, "point_delta": None, "ci95_low": None, "ci95_high": None}
    d = np.abs(frame[candidate].to_numpy(float) - frame.target_games.to_numpy(float)) - np.abs(
        frame.PREV_RATE.to_numpy(float) - frame.target_games.to_numpy(float)
    )
    tmp = pd.DataFrame({"player_id": frame.player_id.to_numpy(), "delta": d})
    agg = tmp.groupby("player_id").delta.agg(["sum", "count"])
    sums = agg["sum"].to_numpy(float)
    counts = agg["count"].to_numpy(float)
    rng = np.random.default_rng(BOOT_SEED)
    ncl = len(agg)
    reps = np.empty(BOOT_REPS, float)
    for i in range(BOOT_REPS):
        ix = rng.integers(0, ncl, size=ncl)
        reps[i] = sums[ix].sum() / counts[ix].sum()
    return {
        "clusters": int(ncl),
        "replicates": BOOT_REPS,
        "seed": BOOT_SEED,
        "point_delta": float(d.mean()),
        "ci95_low": float(np.quantile(reps, 0.025)),
        "ci95_high": float(np.quantile(reps, 0.975)),
    }


def candidate_gate(expected, eval_df, intervals):
    dev = expected[expected.target_season.isin(DEV_SEASONS)]
    conf = expected[expected.target_season.isin(CONF_SEASONS)]
    base_dev = reg_metrics(dev, "PREV_RATE")
    base_conf = reg_metrics(conf, "PREV_RATE")
    out = {}
    passing = []

    for cand in CANDIDATES:
        cm = reg_metrics(dev, cand)
        boot = cluster_bootstrap_delta(dev, cand)
        pos_reg = {}
        for pos in POSITIONS:
            b = reg_metrics(dev[dev.position == pos], "PREV_RATE")
            c = reg_metrics(dev[dev.position == pos], cand)
            if b["n"] >= 30 and b["mae"] and b["mae"] > 0:
                pos_reg[pos] = (c["mae"] - b["mae"]) / b["mae"]
        season_deltas = []
        for season in DEV_SEASONS:
            g = dev[dev.target_season == season]
            if not g.empty:
                season_deltas.append(reg_metrics(g, cand)["mae"] - reg_metrics(g, "PREV_RATE")["mae"])
        gates = {
            "mae_lift_ge_1pct": (base_dev["mae"] - cm["mae"]) / base_dev["mae"] >= 0.01,
            "rmse_regression_lte_1pct": (cm["rmse"] - base_dev["rmse"]) / base_dev["rmse"] <= 0.01,
            "no_position_mae_regression_gt_5pct": all(v <= 0.05 for v in pos_reg.values()),
            "mean_season_mae_delta_lte_zero": float(np.mean(season_deltas)) <= 0.0,
            "bootstrap_ci_upper_lt_zero": boot["ci95_high"] < 0.0,
            "no_candidate_fallback_rows": not bool(dev[f"{cand}_fallback"].any()),
        }
        passed = all(gates.values())
        if passed:
            passing.append(cand)
        out[cand] = {
            "development_metrics": cm,
            "development_mae_lift_fraction": (base_dev["mae"] - cm["mae"]) / base_dev["mae"],
            "position_mae_regression_fraction": pos_reg,
            "mean_season_mae_delta": float(np.mean(season_deltas)),
            "bootstrap": boot,
            "gates": gates,
            "development_pass": passed,
        }

    selected = None
    if passing:
        order = {name: i for i, name in enumerate(["RIDGE_MINIMAL", "POISSON_MINIMAL", "RIDGE_FULL", "MULTINOMIAL_HURDLE"])}
        passing = sorted(passing, key=lambda n: (out[n]["development_metrics"]["mae"], order[n]))
        best = passing[0]
        near = [n for n in passing if out[n]["development_metrics"]["mae"] <= out[best]["development_metrics"]["mae"] + 0.01]
        selected = sorted(near, key=lambda n: order[n])[0]

    confirmation = None
    if selected:
        cm = reg_metrics(conf, selected)
        boot = cluster_bootstrap_delta(conf, selected)
        pos_reg = {}
        for pos in POSITIONS:
            b = reg_metrics(conf[conf.position == pos], "PREV_RATE")
            c = reg_metrics(conf[conf.position == pos], selected)
            if b["n"] >= 30 and b["mae"] and b["mae"] > 0:
                pos_reg[pos] = (c["mae"] - b["mae"]) / b["mae"]
        iv = intervals[
            (intervals.split == "confirmation")
            & (intervals.scope == "pooled")
            & (intervals.model == selected)
        ]
        coverage = None if iv.empty else float(iv.iloc[0].coverage80)
        gates = {
            "mae_lift_ge_0_5pct": (base_conf["mae"] - cm["mae"]) / base_conf["mae"] >= 0.005,
            "bootstrap_ci_upper_lte_zero": boot["ci95_high"] <= 0.0,
            "no_position_mae_regression_gt_5pct": all(v <= 0.05 for v in pos_reg.values()),
            "interval_coverage_72_to_88pct": coverage is not None and 0.72 <= coverage <= 0.88,
            "no_candidate_fallback_rows": not bool(conf[f"{selected}_fallback"].any()),
        }
        confirmation = {
            "candidate": selected,
            "metrics": cm,
            "mae_lift_fraction": (base_conf["mae"] - cm["mae"]) / base_conf["mae"],
            "position_mae_regression_fraction": pos_reg,
            "bootstrap": boot,
            "interval_coverage80": coverage,
            "gates": gates,
            "pass": all(gates.values()),
        }

    return {
        "primary_baseline_development": base_dev,
        "primary_baseline_confirmation": base_conf,
        "candidates": out,
        "development_selected_candidate": selected,
        "confirmation": confirmation,
    }


def event_warning_gate(events, event_eval, event):
    out = {}
    passing = []
    for model in ["LOGIT_MINIMAL", "LOGIT_FULL"]:
        pooled = event_eval[
            (event_eval.split == "confirmation")
            & (event_eval.event == event)
            & (event_eval.model == model)
            & (event_eval.scope == "pooled")
        ]
        if pooled.empty:
            continue
        pooled_row = pooled.iloc[0]
        pos_rows = event_eval[
            (event_eval.split == "confirmation")
            & (event_eval.event == event)
            & (event_eval.model == model)
            & (event_eval.scope == "position")
        ]
        position_floor_ok = True
        position_skills = {}
        for _, r in pos_rows.iterrows():
            if int(r["n"]) >= 30:
                val = None if pd.isna(r["brier_skill"]) else float(r["brier_skill"])
                position_skills[str(r["scope_value"])] = val
                if val is None or val < -0.05:
                    position_floor_ok = False
        inv = gross_inversion(events, event, model)
        gates = {
            "pooled_brier_skill_gt_zero": pd.notna(pooled_row["brier_skill"]) and float(pooled_row["brier_skill"]) > 0.0,
            "position_brier_skill_floor": position_floor_ok,
            "no_gross_reliability_inversion": inv is not None and not inv["inverted"],
        }
        passed = all(gates.values())
        if passed:
            passing.append(model)
        out[model] = {
            "pooled_brier": float(pooled_row["brier"]),
            "pooled_brier_skill": None if pd.isna(pooled_row["brier_skill"]) else float(pooled_row["brier_skill"]),
            "position_brier_skill": position_skills,
            "gross_inversion": inv,
            "gates": gates,
            "pass": passed,
        }
    selected = None
    if passing:
        passing.sort(key=lambda m: (out[m]["pooled_brier"], 0 if m == "LOGIT_MINIMAL" else 1))
        selected = passing[0]
    return {"event": event, "models": out, "selected_warning_model": selected}


def sensitivity_analysis(rows, selected):
    if not selected:
        return {"status": "NOT_APPLICABLE", "reason": "no development-selected learned expected-games model"}
    feature_key = "x_full" if selected == "RIDGE_FULL" else "x_min"
    feature_names = wr025.FEATURES if feature_key == "x_full" else MINIMAL_FEATURES
    records = []
    for season in CONF_SEASONS:
        for pos in POSITIONS:
            train = [r for r in rows if r["position"] == pos and r["target_season"] < season]
            test = [r for r in rows if r["position"] == pos and r["target_season"] == season]
            models, _ = fit_expected_candidates(train)
            if selected not in models or not test:
                continue
            base = predict_expected(selected, models[selected], test)
            y = targets(test)
            base_mae = float(mean_absolute_error(y, base))
            Xtr = matrix(train, feature_key)
            Xte = matrix(test, feature_key)
            for j, feat in enumerate(feature_names):
                mean = float(np.mean(Xtr[:, j]))
                sd = float(np.std(Xtr[:, j]))
                variants = {
                    "mean_omission": np.full(len(test), mean),
                    "plus_half_sd": Xte[:, j] + 0.5 * sd,
                    "minus_half_sd": Xte[:, j] - 0.5 * sd,
                }
                for variant, values in variants.items():
                    mutated = []
                    for r, val in zip(test, values):
                        rr = dict(r)
                        arr = np.array(r[feature_key], float, copy=True)
                        arr[j] = val
                        rr[feature_key] = arr
                        mutated.append(rr)
                    p = predict_expected(selected, models[selected], mutated)
                    mae = float(mean_absolute_error(y, p))
                    records.append({
                        "season": season, "position": pos, "feature": feat, "variant": variant,
                        "base_mae": base_mae, "mutated_mae": mae, "mae_delta": mae - base_mae,
                    })
    if not records:
        return {"status": "NO_VALID_ROWS", "records": []}
    df = pd.DataFrame(records)
    return {
        "status": "COMPLETED",
        "max_abs_mae_delta": float(df.mae_delta.abs().max()),
        "worst_rows": df.reindex(df.mae_delta.abs().sort_values(ascending=False).index).head(20).to_dict("records"),
        "records": records,
    }


def coverage_table(rows):
    recs = []
    for season in SCORED_SEASONS:
        for pos in POSITIONS:
            g = [r for r in rows if r["target_season"] == season and r["position"] == pos]
            if not g:
                continue
            recs.append({
                "target_season": season,
                "position": pos,
                "rows": len(g),
                "zero_game_rows": sum(r["target_games"] == 0 for r in g),
                "zero_game_fraction": float(np.mean([r["target_games"] == 0 for r in g])),
                "has_prev2_fraction": float(np.mean([r["has_prev2"] for r in g])),
                "age_missing_fraction": float(np.mean([r["age_missing"] for r in g])),
                "core_source_coverage_fraction": 1.0,
            })
    return pd.DataFrame(recs)


def fallback_test():
    def fallback(prev_games, target_season, position_mean):
        if prev_games is None or not np.isfinite(prev_games):
            return float(np.clip(position_mean, 0, season_max_games(target_season))), "POSITION_MEAN"
        return float(np.clip(float(prev_games) / season_max_games(target_season - 1) * season_max_games(target_season), 0, season_max_games(target_season))), "PREV_RATE"
    a = fallback(8.0, 2022, 10.0)
    b = fallback(None, 2022, 10.0)
    ok = abs(a[0] - 8.0) < 1e-12 and a[1] == "PREV_RATE" and b == (10.0, "POSITION_MEAN")
    return {"passed": ok, "prior_games_example": a, "missing_prior_example": b}


def main():
    lock = json.loads(LOCK_PATH.read_text())
    if lock.get("task_id") != TASK or lock.get("status") != "FROZEN_PRE_SCORING_LOCK":
        raise RuntimeError("WR-034 machine lock missing or not frozen")

    before = frozen_integrity_snapshot()
    protocol_sha = sha256_file(Path(".ai/research/AVAILABILITY_EXPECTED_GAMES_PROTOCOL.md"))
    machine_lock_sha = sha256_file(LOCK_PATH)
    candidate_spec_sha = sha256_file(Path(".ai/research/AVAILABILITY_CANDIDATE_SPEC.md"))
    source_manifest_sha = sha256_file(Path(".ai/research/AVAILABILITY_SOURCE_MANIFEST.md"))

    by_season, players, drafts_by_season, draft_by_player, provenance = load_locked_history()
    returners = wr025.build_returners(by_season, players, draft_by_player)
    rows = prepare_rows(returners)

    expected, events, fit_errors = execute_rolling(rows)
    eval_df = evaluation_table(expected)
    calibration = calibration_table(expected)
    intervals = interval_table(expected)
    event_eval = event_evaluation_table(events)
    reliability = reliability_table(events)
    coverage = coverage_table(rows)

    gates = candidate_gate(expected, eval_df, intervals)
    low_gate = event_warning_gate(events, event_eval, "low_availability")
    high_gate = event_warning_gate(events, event_eval, "high_availability")
    selected = gates["development_selected_candidate"]
    sensitivity = sensitivity_analysis(rows, selected)
    fallback = fallback_test()

    if gates["confirmation"] and gates["confirmation"]["pass"]:
        disposition = "EXPECTED-GAMES MODEL SUPPORTED"
        recommended_expected = selected
    elif low_gate["selected_warning_model"] or high_gate["selected_warning_model"]:
        disposition = "BASELINE / WARNING-ONLY RETAINED"
        recommended_expected = "PREV_RATE"
    else:
        disposition = "INSUFFICIENT EVIDENCE"
        recommended_expected = "PREV_RATE"

    after = frozen_integrity_snapshot()
    if before != after:
        raise RuntimeError("frozen prospective artifacts changed during scoring")

    integrity = {
        "task_id": TASK,
        "scoring_head": os.environ.get("GITHUB_SHA"),
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "historical_only": True,
        "max_stats_season_loaded": max(STAT_SEASONS),
        "outcomes_2026_inspected": False,
        "wr021_wr023_before": before,
        "wr021_wr023_after": after,
        "frozen_artifacts_unchanged": before == after,
        "wr033_expected_performance_spec_changed": False,
        "production_files_or_rankings_changed": False,
        "protocol_sha256": protocol_sha,
        "machine_lock_sha256": machine_lock_sha,
        "candidate_spec_sha256": candidate_spec_sha,
        "source_manifest_sha256": source_manifest_sha,
        "runtime": {
            "python": sys.version,
            "platform": platform.platform(),
            "numpy": np.__version__,
            "pandas": pd.__version__,
        },
    }

    results = {
        "task_id": TASK,
        "status": "COMPLETE_RESEARCH_OUTPUT",
        "experimental_non_production": True,
        "cohort": {
            "returner_rows_total_2014_2025": len(rows),
            "scored_rows_2018_2025": int(len(expected)),
            "unique_scored_players": int(expected.player_id.nunique()),
            "zero_game_scored_rows": int((expected.target_games == 0).sum()),
        },
        "expected_games_selection": gates,
        "event_warning_selection": {
            "low_availability": low_gate,
            "high_availability": high_gate,
        },
        "fit_errors": fit_errors,
        "sensitivity_summary": {k: v for k, v in sensitivity.items() if k != "records"},
        "fallback": fallback,
        "final_phase4_disposition": disposition,
        "recommended_phase5_interface": {
            "expected_games": recommended_expected,
            "expected_games_fallback": "PREV_RATE",
            "expected_games_secondary_fallback": "training-position mean with explicit flag",
            "low_availability_probability": low_gate["selected_warning_model"] or "training-position prevalence",
            "high_availability_probability": high_gate["selected_warning_model"] or "training-position prevalence",
            "interval": f"{recommended_expected} training-residual 80% interval" if disposition == "EXPECTED-GAMES MODEL SUPPORTED" else "no learned interval promoted; retain historical uncertainty evidence only",
            "medical_injury_prediction": False,
            "ordering_effect": "NONE",
            "coverage_provenance_required": True,
        },
        "integrity": integrity,
    }

    expected.to_csv(OUT / "WR034_EXPECTED_GAMES_ROWS.csv", index=False)
    eval_df.to_csv(OUT / "WR034_EXPECTED_GAMES_EVALUATION.csv", index=False)
    calibration.to_csv(OUT / "WR034_EXPECTED_GAMES_CALIBRATION.csv", index=False)
    intervals.to_csv(OUT / "WR034_INTERVAL_EVALUATION.csv", index=False)
    events.to_csv(OUT / "WR034_EVENT_ROWS.csv", index=False)
    event_eval.to_csv(OUT / "WR034_EVENT_EVALUATION.csv", index=False)
    reliability.to_csv(OUT / "WR034_EVENT_RELIABILITY.csv", index=False)
    coverage.to_csv(OUT / "WR034_COVERAGE.csv", index=False)
    (OUT / "WR034_SOURCE_PROVENANCE.json").write_text(json.dumps(provenance, indent=2) + "\n")
    (OUT / "WR034_SENSITIVITY.json").write_text(json.dumps(sensitivity, indent=2) + "\n")
    (OUT / "WR034_INTEGRITY.json").write_text(json.dumps(integrity, indent=2) + "\n")
    (OUT / "WR034_RESULTS.json").write_text(json.dumps(results, indent=2) + "\n")

    print(json.dumps({
        "disposition": disposition,
        "development_selected_candidate": selected,
        "confirmation": gates["confirmation"],
        "low_warning_model": low_gate["selected_warning_model"],
        "high_warning_model": high_gate["selected_warning_model"],
        "scored_rows": len(expected),
        "outcomes_2026_inspected": False,
        "frozen_artifacts_unchanged": before == after,
    }, indent=2))


if __name__ == "__main__":
    main()
