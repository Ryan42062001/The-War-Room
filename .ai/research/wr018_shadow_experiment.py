from __future__ import annotations

import hashlib
import io
import json
import math
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

OWNER = "nflverse"
REPO = "nflverse-data"
TAG = "stats_player"
SEASONS = list(range(2012, 2026))
HOLDOUTS = [2022, 2023, 2024, 2025]
POSITIONS = ["QB", "RB", "WR", "TE"]
MIN_GAMES = 4
FREEZE_DEADLINE_UTC = datetime.fromisoformat("2026-09-10T00:20:00+00:00")
OUT = Path(".ai/research/generated")
OUT.mkdir(parents=True, exist_ok=True)

REQUIRED = [
    "season",
    "season_type",
    "player_id",
    "position",
    "fantasy_points_ppr",
    "attempts",
    "carries",
    "targets",
    "receptions",
    "passing_yards",
    "passing_tds",
    "passing_interceptions",
    "rushing_yards",
    "rushing_tds",
    "receiving_yards",
    "receiving_tds",
]
SUM_COLUMNS = [
    "fantasy_points_ppr",
    "attempts",
    "carries",
    "targets",
    "receptions",
    "passing_yards",
    "passing_tds",
    "passing_interceptions",
    "rushing_yards",
    "rushing_tds",
    "receiving_yards",
    "receiving_tds",
    "passing_epa",
    "rushing_epa",
    "receiving_epa",
]
AVG_COLUMNS = ["target_share", "air_yards_share", "wopr"]
FEATURES = [
    "prev1_ppr_pg",
    "prev1_games",
    "prev1_attempts_pg",
    "prev1_carries_pg",
    "prev1_targets_pg",
    "prev1_receptions_pg",
    "prev1_pass_yards_pg",
    "prev1_pass_tds_pg",
    "prev1_int_pg",
    "prev1_rush_yards_pg",
    "prev1_rush_tds_pg",
    "prev1_rec_yards_pg",
    "prev1_rec_tds_pg",
    "prev1_pass_epa_pg",
    "prev1_rush_epa_pg",
    "prev1_rec_epa_pg",
    "prev1_target_share",
    "prev1_air_yards_share",
    "prev1_wopr",
    "prev2_ppr_pg",
    "prev2_games",
    "ppr_delta",
    "weighted_ppr_pg",
    "has_prev2",
]
TOP_N = {"QB": 12, "RB": 24, "WR": 36, "TE": 12}

SESSION = requests.Session()
SESSION.headers.update(
    {"User-Agent": "war-room-wr018-research", "Accept": "application/vnd.github+json"}
)


def get_json(url: str):
    response = SESSION.get(url, timeout=60)
    response.raise_for_status()
    return response.json()


def resolve_assets():
    release = get_json(
        f"https://api.github.com/repos/{OWNER}/{REPO}/releases/tags/{TAG}"
    )
    assets = []
    page = 1
    while True:
        batch = get_json(f"{release['assets_url']}?per_page=100&page={page}")
        assets.extend(batch)
        if len(batch) < 100:
            break
        page += 1

    by_name = {asset["name"]: asset for asset in assets}
    resolved = {}
    for season in SEASONS:
        name = f"stats_player_regpost_{season}.csv"
        asset = by_name.get(name)
        assert asset, f"missing official asset {name}"
        expected_prefix = (
            f"https://github.com/{OWNER}/{REPO}/releases/download/{TAG}/"
        )
        assert asset["browser_download_url"].startswith(expected_prefix)
        resolved[season] = asset
    return release, resolved


def download_asset(asset):
    response = SESSION.get(asset["browser_download_url"], timeout=120)
    response.raise_for_status()
    payload = response.content
    sha256 = hashlib.sha256(payload).hexdigest()
    github_digest = asset.get("digest")
    if github_digest and github_digest.startswith("sha256:"):
        assert github_digest[7:] == sha256, f"digest mismatch {asset['name']}"
    return payload, sha256


def aggregate_season(season: int, payload: bytes):
    frame = pd.read_csv(io.BytesIO(payload), low_memory=False)
    missing = [column for column in REQUIRED if column not in frame.columns]
    assert not missing, f"{season} missing required columns {missing}"

    frame = frame[
        (frame.season_type.astype(str).str.upper() == "REG")
        & frame.position.astype(str).str.upper().isin(POSITIONS)
    ].copy()

    for column in SUM_COLUMNS + AVG_COLUMNS:
        if column not in frame:
            frame[column] = np.nan

    rows = {}
    for player_id, group in frame.groupby("player_id", dropna=True):
        if "games" not in group.columns:
            raise AssertionError(f"{season} missing games denominator")
        games_values = pd.to_numeric(group["games"], errors="coerce").dropna()
        games = int(games_values.max()) if len(games_values) else 0
        if not games:
            continue

        summed = {
            column: pd.to_numeric(group[column], errors="coerce").fillna(0).sum()
            / games
            for column in SUM_COLUMNS
        }
        averaged = {
            column: pd.to_numeric(group[column], errors="coerce").mean()
            for column in AVG_COLUMNS
        }

        name_series = None
        if "player_display_name" in group:
            name_series = group["player_display_name"]
        elif "player_name" in group:
            name_series = group["player_name"]
        player_name = (
            name_series.dropna().astype(str).iloc[-1]
            if name_series is not None and len(name_series.dropna())
            else str(player_id)
        )
        position = str(group.position.dropna().astype(str).iloc[-1]).upper()

        rows[str(player_id)] = {
            "season": season,
            "player_id": str(player_id),
            "player_name": player_name,
            "position": position,
            "games": games,
            "ppr_pg": summed["fantasy_points_ppr"],
            "attempts_pg": summed["attempts"],
            "carries_pg": summed["carries"],
            "targets_pg": summed["targets"],
            "receptions_pg": summed["receptions"],
            "pass_yards_pg": summed["passing_yards"],
            "pass_tds_pg": summed["passing_tds"],
            "int_pg": summed["passing_interceptions"],
            "rush_yards_pg": summed["rushing_yards"],
            "rush_tds_pg": summed["rushing_tds"],
            "rec_yards_pg": summed["receiving_yards"],
            "rec_tds_pg": summed["receiving_tds"],
            "pass_epa_pg": summed["passing_epa"],
            "rush_epa_pg": summed["rushing_epa"],
            "rec_epa_pg": summed["receiving_epa"],
            "target_share": 0.0
            if pd.isna(averaged["target_share"])
            else float(averaged["target_share"]),
            "air_yards_share": 0.0
            if pd.isna(averaged["air_yards_share"])
            else float(averaged["air_yards_share"]),
            "wopr": 0.0 if pd.isna(averaged["wopr"]) else float(averaged["wopr"]),
        }

    return rows, list(frame.columns), len(frame)


def feature_vector(target_season: int, player_id: str, by_season):
    previous = by_season.get(target_season - 1, {}).get(player_id)
    if not previous or previous["games"] < MIN_GAMES:
        return None

    previous2 = by_season.get(target_season - 2, {}).get(player_id)
    has_previous2 = bool(previous2 and previous2["games"] >= MIN_GAMES)
    previous2_ppr = previous2["ppr_pg"] if has_previous2 else previous["ppr_pg"]

    return [
        previous["ppr_pg"],
        previous["games"],
        previous["attempts_pg"],
        previous["carries_pg"],
        previous["targets_pg"],
        previous["receptions_pg"],
        previous["pass_yards_pg"],
        previous["pass_tds_pg"],
        previous["int_pg"],
        previous["rush_yards_pg"],
        previous["rush_tds_pg"],
        previous["rec_yards_pg"],
        previous["rec_tds_pg"],
        previous["pass_epa_pg"],
        previous["rush_epa_pg"],
        previous["rec_epa_pg"],
        previous["target_share"],
        previous["air_yards_share"],
        previous["wopr"],
        previous2_ppr,
        previous2["games"] if has_previous2 else 0,
        previous["ppr_pg"] - previous2_ppr,
        0.7 * previous["ppr_pg"] + 0.3 * previous2_ppr,
        1 if has_previous2 else 0,
    ]


def build_examples(by_season):
    examples = []
    for target_season in range(2014, 2026):
        for player_id, target in by_season.get(target_season, {}).items():
            if target["position"] not in POSITIONS or target["games"] < MIN_GAMES:
                continue
            features = feature_vector(target_season, player_id, by_season)
            previous = by_season.get(target_season - 1, {}).get(player_id)
            if (
                features is None
                or not previous
                or previous["position"] != target["position"]
            ):
                continue
            examples.append(
                {
                    "targetSeason": target_season,
                    "player_id": player_id,
                    "player_name": target["player_name"],
                    "position": target["position"],
                    "x": features,
                    "y": target["ppr_pg"],
                    "naive": previous["ppr_pg"],
                }
            )
    return examples


def fit_models(train_rows):
    x = np.array([row["x"] for row in train_rows], dtype=float)
    y = np.array([row["y"] for row in train_rows], dtype=float)
    ridge = make_pipeline(StandardScaler(), Ridge(alpha=10.0)).fit(x, y)
    boost = GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=2,
        min_samples_leaf=8,
        random_state=18018,
        loss="squared_error",
    ).fit(x, y)
    return ridge, boost


def regression_metrics(rows, key):
    actual = np.array([row["y"] for row in rows])
    predicted = np.array([row[key] for row in rows])
    rho = float(spearmanr(actual, predicted).statistic) if len(rows) > 2 else 0.0
    return {
        "n": len(rows),
        "mae": float(mean_absolute_error(actual, predicted)),
        "rmse": float(math.sqrt(mean_squared_error(actual, predicted))),
        "spearman": rho,
    }


def rank_top_metrics(rows, key, position):
    rank_errors = []
    hits = 0
    total = 0
    per_season = []
    for season in HOLDOUTS:
        subset = [
            row
            for row in rows
            if row["position"] == position and row["targetSeason"] == season
        ]
        if not subset:
            continue
        actual_order = sorted(subset, key=lambda row: row["y"], reverse=True)
        predicted_order = sorted(subset, key=lambda row: row[key], reverse=True)
        actual_rank = {
            row["player_id"]: index + 1 for index, row in enumerate(actual_order)
        }
        predicted_rank = {
            row["player_id"]: index + 1 for index, row in enumerate(predicted_order)
        }
        rank_errors.extend(
            abs(actual_rank[row["player_id"]] - predicted_rank[row["player_id"]])
            for row in subset
        )
        n = min(TOP_N[position], len(subset))
        true_top = {row["player_id"] for row in actual_order[:n]}
        season_hits = sum(row["player_id"] in true_top for row in predicted_order[:n])
        hits += season_hits
        total += n
        per_season.append(
            {
                "season": season,
                "cohort_n": len(subset),
                "top_n": n,
                "hits": season_hits,
                "overlap": season_hits / n if n else 0.0,
            }
        )
    return {
        "rank_mae": float(np.mean(rank_errors)) if rank_errors else None,
        "top_n_overlap": hits / total if total else None,
        "perSeason": per_season,
    }


def bootstrap_delta(rows, key, samples=2000, seed=18018):
    rng = np.random.default_rng(seed)
    paired = np.array(
        [
            abs(row["y"] - row[key]) - abs(row["y"] - row["naive"])
            for row in rows
        ]
    )
    draws = []
    for _ in range(samples):
        draws.append(float(np.mean(rng.choice(paired, size=len(paired), replace=True))))
    return {
        "mean_delta_mae_vs_naive": float(np.mean(draws)),
        "ci95_low": float(np.quantile(draws, 0.025)),
        "ci95_high": float(np.quantile(draws, 0.975)),
    }


def run():
    generated_at = datetime.now(timezone.utc)
    release, assets = resolve_assets()
    by_season = {}
    asset_manifest = []

    for season in SEASONS:
        asset = assets[season]
        print(f"download {asset['name']}", flush=True)
        payload, sha256 = download_asset(asset)
        rows, columns, raw_rows = aggregate_season(season, payload)
        by_season[season] = rows
        asset_manifest.append(
            {
                "season": season,
                "asset_id": asset["id"],
                "name": asset["name"],
                "size": asset["size"],
                "updated_at": asset["updated_at"],
                "browser_download_url": asset["browser_download_url"],
                "github_digest": asset.get("digest"),
                "verified_sha256": sha256,
                "regular_rows": raw_rows,
                "modeled_players": len(rows),
                "columns": columns,
            }
        )

    examples = build_examples(by_season)
    predictions = []
    training_summary = []

    for holdout in HOLDOUTS:
        for position in POSITIONS:
            train = [
                row
                for row in examples
                if row["position"] == position and row["targetSeason"] < holdout
            ]
            test = [
                row
                for row in examples
                if row["position"] == position and row["targetSeason"] == holdout
            ]
            assert len(train) >= 60 and len(test) >= 10, (
                holdout,
                position,
                len(train),
                len(test),
            )
            ridge, boost = fit_models(train)
            x_test = np.array([row["x"] for row in test], dtype=float)
            ridge_pred = np.maximum(0, ridge.predict(x_test))
            boost_pred = np.maximum(0, boost.predict(x_test))
            training_summary.append(
                {
                    "targetSeason": holdout,
                    "position": position,
                    "train_n": len(train),
                    "test_n": len(test),
                }
            )
            for row, ridge_value, boost_value in zip(test, ridge_pred, boost_pred):
                predictions.append(
                    {
                        **row,
                        "ridge": float(ridge_value),
                        "boost": float(boost_value),
                    }
                )

    metrics = {"pooled": {}, "by_position": {}, "rank_topn": {}, "bootstrap": {}}
    for model in ["naive", "ridge", "boost"]:
        metrics["pooled"][model] = regression_metrics(predictions, model)

    for position in POSITIONS:
        position_rows = [row for row in predictions if row["position"] == position]
        metrics["by_position"][position] = {
            model: regression_metrics(position_rows, model)
            for model in ["naive", "ridge", "boost"]
        }
        metrics["rank_topn"][position] = {
            model: rank_top_metrics(predictions, model, position)
            for model in ["naive", "ridge", "boost"]
        }
        metrics["bootstrap"][position] = {
            "ridge_vs_naive": bootstrap_delta(
                position_rows, "ridge", seed=18018 + len(position)
            ),
            "boost_vs_naive": bootstrap_delta(
                position_rows, "boost", seed=28018 + len(position)
            ),
        }

    metrics["bootstrap"]["pooled"] = {
        "ridge_vs_naive": bootstrap_delta(predictions, "ridge", seed=38018),
        "boost_vs_naive": bootstrap_delta(predictions, "boost", seed=48018),
    }

    naive_mae = metrics["pooled"]["naive"]["mae"]
    pooled_lift = {
        model: (naive_mae - metrics["pooled"][model]["mae"]) / naive_mae
        for model in ["ridge", "boost"]
    }

    snapshot = []
    clean_snapshot = generated_at < FREEZE_DEADLINE_UTC
    if clean_snapshot:
        for position in POSITIONS:
            train = [
                row
                for row in examples
                if row["position"] == position and row["targetSeason"] <= 2025
            ]
            ridge, boost = fit_models(train)
            eligible = []
            for player_id, previous in by_season[2025].items():
                if previous["position"] != position or previous["games"] < MIN_GAMES:
                    continue
                features = feature_vector(2026, player_id, by_season)
                if features is not None:
                    eligible.append((player_id, previous, features))
            if not eligible:
                continue
            x_2026 = np.array([features for _, _, features in eligible], dtype=float)
            ridge_pred = np.maximum(0, ridge.predict(x_2026))
            boost_pred = np.maximum(0, boost.predict(x_2026))
            for (player_id, previous, _), ridge_value, boost_value in zip(
                eligible, ridge_pred, boost_pred
            ):
                snapshot.append(
                    {
                        "player_id": player_id,
                        "player_name": previous["player_name"],
                        "position": position,
                        "prior_2025_games": previous["games"],
                        "naive_prev_ppr_pg": previous["ppr_pg"],
                        "ridge_shadow_ppr_pg": float(ridge_value),
                        "boost_shadow_ppr_pg": float(boost_value),
                        "rookie_or_no_2025_history": False,
                    }
                )

    results = {
        "task_id": "WR-018",
        "classification": "EXPERIMENTAL / NON-PRODUCTION",
        "generated_at_utc": generated_at.isoformat(),
        "source": {
            "owner": OWNER,
            "repo": REPO,
            "release_tag": TAG,
            "release_id": release["id"],
            "release_name": release["name"],
            "release_updated_at": release["updated_at"],
            "license": "CC BY 4.0",
            "seasons": SEASONS,
        },
        "cutoff_rule": (
            "Target season Y features use completed regular-season player statistics "
            "from Y-1 and Y-2 only; no target-season Week 1+ data or reconstructed "
            "target-season injury/depth hindsight."
        ),
        "cohort_rule": (
            f"Returning QB/RB/WR/TE with >= {MIN_GAMES} recorded regular-season games "
            "in Y-1 and target Y and the same position across Y-1/Y. Rookies and "
            "players without usable prior-season NFL history are excluded."
        ),
        "holdout_seasons": HOLDOUTS,
        "feature_names": FEATURES,
        "models": {
            "naive": "previous-season PPR per recorded game",
            "ridge": (
                "position-specific StandardScaler + Ridge(alpha=10.0); "
                "hyperparameter fixed before held-out evaluation"
            ),
            "boost": (
                "position-specific GradientBoostingRegressor(n_estimators=150, "
                "learning_rate=0.05, max_depth=2, min_samples_leaf=8); "
                "hyperparameters fixed before held-out evaluation"
            ),
        },
        "training_summary": training_summary,
        "heldout_prediction_count": len(predictions),
        "metrics": metrics,
        "pooled_lift_vs_naive": pooled_lift,
        "availability_stage": (
            "NOT MODELED — no separate rights-cleared point-in-time preseason injury/"
            "availability model was established"
        ),
        "season_total_stage": "NOT MODELED — requires defensible availability forecast",
        "replacement_value_stage": "NOT COMPUTED — remains downstream",
        "uncertainty_stage": (
            "Paired bootstrap uncertainty reported for MAE deltas; predictive intervals "
            "not modeled"
        ),
        "direct_ecr_comparison": (
            "NOT PERFORMED — no lawful contemporaneous FantasyPros historical benchmark used"
        ),
        "frozen_2026_snapshot": {
            "clean": clean_snapshot,
            "deadline_utc": FREEZE_DEADLINE_UTC.isoformat(),
            "rows": len(snapshot),
            "limitations": [
                "returning veterans only",
                "no rookies without 2025 NFL stats",
                "no preseason injury/depth context",
                "no 2026 outcome data used",
            ],
        },
    }

    (OUT / "SHADOW_RANKING_RESULTS.json").write_text(
        json.dumps(results, indent=2) + "\n"
    )
    (OUT / "SHADOW_RANKING_ASSET_MANIFEST.json").write_text(
        json.dumps(asset_manifest, indent=2) + "\n"
    )
    if clean_snapshot:
        pd.DataFrame(snapshot).sort_values(
            ["position", "boost_shadow_ppr_pg"], ascending=[True, False]
        ).to_csv(
            OUT / "SHADOW_RANKING_2026_SNAPSHOT.csv",
            index=False,
            float_format="%.4f",
        )

    print("WR018_RESULT_JSON_START")
    print(json.dumps(results, indent=2))
    print("WR018_RESULT_JSON_END")
    if clean_snapshot:
        print("WR018_SNAPSHOT_CSV_START")
        print((OUT / "SHADOW_RANKING_2026_SNAPSHOT.csv").read_text())
        print("WR018_SNAPSHOT_CSV_END")


if __name__ == "__main__":
    run()
