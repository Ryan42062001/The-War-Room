from __future__ import annotations

import hashlib
import importlib.metadata
import importlib.util
import io
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow.parquet as pq
import requests
from scipy.stats import spearmanr

ROOT = Path(__file__).resolve().parents[2]
RESEARCH = ROOT / ".ai" / "research"
OUT = RESEARCH / "generated"
OUT.mkdir(parents=True, exist_ok=True)

STARTING_MAIN = "b89919121cfcc00fc9a02be5d82c1a892036e70b"
MAX_OUTCOME_SEASON = 2025
PBP_SEASONS = list(range(2012, 2026))
FTN_SEASONS = list(range(2022, 2026))
EXPECTED = {
    "active_rows": 1881,
    "unique_players": 886,
    "baseline_mae": 3.0261717095879073,
    "ridge_mae": 2.8261944402894574,
    "ridge_rmse": 4.2363614824553535,
    "ridge_spearman": 0.677508831151748,
}
FROZEN = {
    RESEARCH / "generated" / "CONTEXT_SHADOW_2026_SNAPSHOT.csv": "9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d",
    RESEARCH / "WR023_2026_PROSPECTIVE_EVALUATION_PROTOCOL.md": "f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c",
}
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "war-room-wr029-lock", "Accept": "application/vnd.github+json"})


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_wr025():
    path = RESEARCH / "wr025_historical_ranking_signals.py"
    spec = importlib.util.spec_from_file_location("wr025", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load WR-025 module")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def get_json(url: str):
    r = SESSION.get(url, timeout=90)
    r.raise_for_status()
    return r.json()


def release_assets(tag: str):
    rel = get_json(f"https://api.github.com/repos/nflverse/nflverse-data/releases/tags/{tag}")
    assets = []
    page = 1
    while True:
        batch = get_json(f"{rel['assets_url']}?per_page=100&page={page}")
        assets.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return rel, {a["name"]: a for a in assets}


def download(asset: dict) -> tuple[bytes, str]:
    if "2026" in asset["name"] and ("play_by_play" in asset["name"] or "stats_player" in asset["name"]):
        raise RuntimeError(f"forbidden 2026 outcome asset: {asset['name']}")
    r = SESSION.get(asset["browser_download_url"], timeout=240)
    r.raise_for_status()
    payload = r.content
    sha = sha256_bytes(payload)
    digest = asset.get("digest")
    if digest and digest.startswith("sha256:") and digest[7:] != sha:
        raise RuntimeError(f"GitHub digest mismatch for {asset['name']}")
    return payload, sha


def schema_record(payload: bytes) -> dict:
    pf = pq.ParquetFile(io.BytesIO(payload))
    schema = pf.schema_arrow
    signature = [(f.name, str(f.type), bool(f.nullable)) for f in schema]
    encoded = json.dumps(signature, separators=(",", ":"), ensure_ascii=True).encode()
    return {
        "rows": int(pf.metadata.num_rows),
        "row_groups": int(pf.metadata.num_row_groups),
        "columns": [x[0] for x in signature],
        "schema_sha256": sha256_bytes(encoded),
    }


def verify_frozen() -> dict:
    out = {}
    for path, expected in FROZEN.items():
        actual = sha256_file(path)
        if actual != expected:
            raise RuntimeError((str(path), actual, expected))
        out[str(path.relative_to(ROOT))] = actual
    return out


def verify_wr025_assets(wr025):
    committed = json.loads((RESEARCH / "generated" / "HISTORICAL_RANKING_ASSET_MANIFEST.json").read_text())
    expected_by_name = {r.get("asset_name"): r for r in committed if r.get("asset_name")}

    stats_rel, stats_assets = wr025.release_assets(wr025.STATS_TAG)
    players_rel, players_assets = wr025.release_assets(wr025.PLAYERS_TAG)
    draft_rel, draft_assets = wr025.release_assets(wr025.DRAFT_TAG)

    by_season = {}
    verification = []
    for season in wr025.STAT_SEASONS:
        if season > MAX_OUTCOME_SEASON:
            raise RuntimeError("WR-029 attempted outcome season >2025")
        name = f"stats_player_regpost_{season}.csv"
        asset = stats_assets[name]
        payload, sha = wr025.download_asset(asset)
        expected = expected_by_name[name]["sha256"]
        if sha != expected:
            raise RuntimeError(f"WR-025 source drift {name}: {sha} != {expected}")
        rows, schema, nraw = wr025.aggregate_stats(season, payload)
        by_season[season] = rows
        verification.append({
            "release_tag": wr025.STATS_TAG,
            "release_id": stats_rel["id"],
            "asset_name": name,
            "asset_id": asset["id"],
            "sha256": sha,
            "updated_at": asset.get("updated_at"),
            "rows_after_filter": len(rows),
            "schema_sha256": sha256_bytes(json.dumps(schema, separators=(",", ":")).encode()),
        })

    p_asset = players_assets["players.csv"]
    p_payload, p_sha = wr025.download_asset(p_asset)
    d_asset = draft_assets["draft_picks.csv"]
    d_payload, d_sha = wr025.download_asset(d_asset)
    for name, sha in [("players.csv", p_sha), ("draft_picks.csv", d_sha)]:
        expected = expected_by_name[name]["sha256"]
        if sha != expected:
            raise RuntimeError(f"WR-025 source drift {name}: {sha} != {expected}")

    players, _, player_schema, player_n = wr025.load_players(p_payload)
    drafts_by_season, draft_by_player, draft_schema, draft_n = wr025.load_draft_picks(d_payload)
    verification.extend([
        {
            "release_tag": wr025.PLAYERS_TAG,
            "release_id": players_rel["id"],
            "asset_name": "players.csv",
            "asset_id": p_asset["id"],
            "sha256": p_sha,
            "updated_at": p_asset.get("updated_at"),
            "rows": player_n,
            "schema_sha256": sha256_bytes(json.dumps(player_schema, separators=(",", ":")).encode()),
        },
        {
            "release_tag": wr025.DRAFT_TAG,
            "release_id": draft_rel["id"],
            "asset_name": "draft_picks.csv",
            "asset_id": d_asset["id"],
            "sha256": d_sha,
            "updated_at": d_asset.get("updated_at"),
            "rows": draft_n,
            "schema_sha256": sha256_bytes(json.dumps(draft_schema, separators=(",", ":")).encode()),
        },
    ])
    return by_season, players, drafts_by_season, draft_by_player, verification


def reproduce_benchmark(wr025, by_season, players, draft_by_player):
    returners = wr025.build_returners(by_season, players, draft_by_player)
    scored = []
    for season in wr025.SCORED_SEASONS:
        if season > MAX_OUTCOME_SEASON:
            raise RuntimeError("forbidden scored season")
        for pos in wr025.POSITIONS:
            train = [r for r in returners if r["target_season"] < season and r["position"] == pos]
            test = [r for r in returners if r["target_season"] == season and r["position"] == pos and r["target_games"] > 0 and r["target_ppr_pg"] is not None]
            model = wr025.fit_ridge(train)
            if model is None or not test:
                continue
            X = np.asarray([r["x"] for r in test], float)
            pred = model.predict(X)
            for r, p in zip(test, pred):
                scored.append({
                    "player_id": r["player_id"],
                    "position": pos,
                    "season": season,
                    "y": float(r["target_ppr_pg"]),
                    "baseline": float(r["baseline_ppr_pg"]),
                    "ridge": float(p),
                    "x": r["x"],
                })
    df = pd.DataFrame(scored)
    y = df["y"].to_numpy(float)
    ridge = df["ridge"].to_numpy(float)
    base = df["baseline"].to_numpy(float)
    actual = {
        "active_rows": int(len(df)),
        "unique_players": int(df.player_id.nunique()),
        "baseline_mae": float(np.mean(np.abs(y - base))),
        "ridge_mae": float(np.mean(np.abs(y - ridge))),
        "ridge_rmse": float(math.sqrt(np.mean((y - ridge) ** 2))),
        "ridge_spearman": float(spearmanr(ridge, y).statistic),
    }
    for key, expected in EXPECTED.items():
        value = actual[key]
        if isinstance(expected, int):
            if value != expected:
                raise RuntimeError(f"benchmark mismatch {key}: {value} != {expected}")
        elif abs(float(value) - float(expected)) > 1e-10:
            raise RuntimeError(f"benchmark mismatch {key}: {value} != {expected}")

    X = np.asarray(df["x"].tolist(), float)
    if X.shape[1] != len(wr025.FEATURES):
        raise RuntimeError("feature-width mismatch")
    missingness = {
        "post_preprocessing_numeric_na_rate": float(np.isnan(X).mean()),
        "has_prev2_missing_history_rate": float(1.0 - X[:, wr025.FEATURES.index("has_prev2")].mean()),
        "age_missing_rate": float(X[:, wr025.FEATURES.index("age_missing")].mean()),
        "undrafted_or_no_draft_record_rate": float(1.0 - X[:, wr025.FEATURES.index("drafted")].mean()),
        "note": "WR-025 converts nonfinite numeric values to zero; raw-field missingness is not recoverable from the post-preprocessing matrix except via explicit indicators.",
    }
    by_pos = {}
    for pos, g in df.groupby("position"):
        gx = np.asarray(g["x"].tolist(), float)
        by_pos[pos] = {
            "n": int(len(g)),
            "has_prev2_missing_history_rate": float(1.0 - gx[:, wr025.FEATURES.index("has_prev2")].mean()),
            "age_missing_rate": float(gx[:, wr025.FEATURES.index("age_missing")].mean()),
            "undrafted_or_no_draft_record_rate": float(1.0 - gx[:, wr025.FEATURES.index("drafted")].mean()),
        }
    return actual, missingness, by_pos


def lock_release(tag: str, seasons: list[int], template: str) -> dict:
    rel, assets = release_assets(tag)
    records = []
    common_schema = None
    for season in seasons:
        if season > MAX_OUTCOME_SEASON:
            raise RuntimeError("forbidden source season >2025")
        name = template.format(season=season)
        if name not in assets:
            raise RuntimeError(f"missing source asset {name}")
        asset = assets[name]
        payload, sha = download(asset)
        schema = schema_record(payload)
        if common_schema is None:
            common_schema = schema["schema_sha256"]
        records.append({
            "season": season,
            "asset_name": name,
            "asset_id": asset["id"],
            "size": asset["size"],
            "created_at": asset.get("created_at"),
            "updated_at": asset.get("updated_at"),
            "github_digest": asset.get("digest"),
            "sha256": sha,
            "browser_download_url": asset["browser_download_url"],
            **schema,
        })
    return {
        "release_tag": tag,
        "release_id": rel["id"],
        "release_created_at": rel.get("created_at"),
        "release_published_at": rel.get("published_at"),
        "release_updated_at": rel.get("updated_at"),
        "assets": records,
        "schema_hashes_unique": sorted(set(r["schema_sha256"] for r in records)),
    }


def dependency_versions():
    names = ["numpy", "pandas", "requests", "scikit-learn", "scipy", "pyarrow"]
    return {name: importlib.metadata.version(name) for name in names}


def main():
    frozen = verify_frozen()
    wr025 = load_wr025()
    by_season, players, drafts_by_season, draft_by_player, benchmark_sources = verify_wr025_assets(wr025)
    benchmark, missingness, missingness_by_pos = reproduce_benchmark(wr025, by_season, players, draft_by_player)

    # Source schema/hash preflight only. No enriched model is fit here.
    pbp = lock_release("pbp", PBP_SEASONS, "play_by_play_{season}.parquet")
    ftn = lock_release("ftn_charting", FTN_SEASONS, "ftn_charting_{season}.parquet")

    result = {
        "task_id": "WR-029",
        "lock_kind": "PRE-ENRICHMENT BENCHMARK / SOURCE LOCK",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "starting_main": STARTING_MAIN,
        "historical_only": True,
        "max_outcome_season": MAX_OUTCOME_SEASON,
        "outcomes_2026_inspected": False,
        "benchmark_reference": {
            "wr025_script_git_blob": "f8ab124c81ec9d90b9626f29a73e959e65918fd7",
            "wr025_results_git_blob": "a52471ec4562accc2a7c81c37398a728310bfbf0",
            "model": "StandardScaler -> Ridge(alpha=100.0), position-specific, rolling-origin",
            "features": list(wr025.FEATURES),
            "feature_count": len(wr025.FEATURES),
            "scored_seasons": list(wr025.SCORED_SEASONS),
            "development_folds_wr029": [2018, 2019, 2020, 2021],
            "confirmation_folds_wr029": [2022, 2023, 2024, 2025],
            "reproduced": benchmark,
            "expected": EXPECTED,
            "verified_exact": True,
        },
        "baseline_missingness": missingness,
        "baseline_missingness_by_position": missingness_by_pos,
        "frozen_prospective_hashes": frozen,
        "benchmark_source_verification": benchmark_sources,
        "new_source_locks": {
            "pbp": pbp,
            "ftn_charting": ftn,
        },
        "cutoff_contract": {
            "target_cutoff": "September 1 12:00:00 UTC of target season",
            "lagged_completed_season_rule": "Only Y-1 completed REG events for PBP/FTN families; immutable/draft metadata may predate cutoff.",
            "target_week1_plus_forbidden": True,
            "mixed_snapshot_target_context_forbidden": True,
        },
        "family_order": [
            "OPPORTUNITY_ROLE",
            "EFFICIENCY_REGRESSION",
            "QB_TEAM_ENVIRONMENT",
            "OL_ENVIRONMENT",
            "AGE_DRAFT_INTERACTIONS",
            "PIT_DEPTH_ROSTER",
            "SHORT_HISTORY_SCHEME",
            "STAFF_CONTINUITY",
            "COMBINED_CONFIRMATION",
        ],
        "dependencies": dependency_versions(),
        "deterministic_seeds": {"bootstrap": 29029, "warning_models": 29030},
        "routes_yprr_guard": {
            "true_routes_admitted": False,
            "yprr_calculated": False,
            "participation_is_not_routes": True,
        },
    }
    out_path = OUT / "ADV_CONTEXT_BENCHMARK_LOCK.json"
    out_path.write_text(json.dumps(result, indent=2, sort_keys=False) + "\n")
    print(json.dumps({
        "benchmark": benchmark,
        "pbp_release_id": pbp["release_id"],
        "pbp_assets": len(pbp["assets"]),
        "ftn_release_id": ftn["release_id"],
        "ftn_assets": len(ftn["assets"]),
        "out": str(out_path),
    }, indent=2))


if __name__ == "__main__":
    main()
