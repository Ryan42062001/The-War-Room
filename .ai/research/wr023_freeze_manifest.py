from __future__ import annotations

import csv
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path

TASK_ID = "WR-023"
STARTING_MAIN = "8e51bc08c0ac70370f49943ac78fda481d7e77e7"
PROTOCOL_FREEZE_COMMIT = "28903ef5dc7073b36cb400330104e8f9e3ee0e05"
PROTOCOL_FREEZE_TIMESTAMP_UTC = "2026-09-09T17:22:11Z"

FILES = {
    "protocol": {
        "path": ".ai/research/WR023_2026_PROSPECTIVE_EVALUATION_PROTOCOL.md",
        "expected_git_blob_sha1": "2fc33ed684cfa539d2cc5684b52b7ba17adc47e1",
    },
    "snapshot": {
        "path": ".ai/research/generated/CONTEXT_SHADOW_2026_SNAPSHOT.csv",
        "expected_git_blob_sha1": "d97280847779a945f1b7901e90bd1b3ee649e4f4",
    },
    "wr021_source_manifest": {
        "path": ".ai/research/CONTEXT_SHADOW_SOURCE_MANIFEST.md",
        "expected_git_blob_sha1": "5e814449ea2fb3ee16f8cb5b16f67580c34369c7",
    },
    "wr021_asset_manifest": {
        "path": ".ai/research/generated/CONTEXT_SHADOW_ASSET_MANIFEST.json",
        "expected_git_blob_sha1": "07fc229791c4dcbf3234b506499c1eea186617d3",
    },
    "wr021_experiment_report": {
        "path": ".ai/research/CONTEXT_SHADOW_EXPERIMENT.md",
        "expected_git_blob_sha1": "760a2895f153d7826741ed624d3082ad4a0b1fbb",
    },
}

EXPECTED_SNAPSHOT = {
    "rows": 523,
    "returners": 444,
    "drafted_rookies": 79,
    "positions": ["QB", "RB", "WR", "TE"],
}

REQUIRED_SNAPSHOT_COLUMNS = [
    "player_id",
    "player_name",
    "position",
    "rookie",
    "baseline_ppr_pg",
    "ridge_ppr_pg",
    "boost_ppr_pg",
    "baseline_games",
    "ridge_games",
    "boost_games",
]


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def git_blob_sha1(payload: bytes) -> str:
    header = f"blob {len(payload)}\0".encode("ascii")
    return hashlib.sha1(header + payload).hexdigest()


def read_and_verify_files() -> dict:
    result = {}
    for key, spec in FILES.items():
        path = Path(spec["path"])
        payload = path.read_bytes()
        actual_blob = git_blob_sha1(payload)
        expected_blob = spec["expected_git_blob_sha1"]
        if actual_blob != expected_blob:
            raise SystemExit(
                f"FAIL-CLOSED: {key} Git blob changed: expected {expected_blob}, got {actual_blob}"
            )
        result[key] = {
            "path": spec["path"],
            "bytes": len(payload),
            "git_blob_sha1": actual_blob,
            "sha256": sha256_bytes(payload),
        }
    return result


def verify_snapshot() -> dict:
    payload = Path(FILES["snapshot"]["path"]).read_bytes()
    text = payload.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    fields = reader.fieldnames or []
    missing = [column for column in REQUIRED_SNAPSHOT_COLUMNS if column not in fields]
    if missing:
        raise SystemExit(f"FAIL-CLOSED: snapshot missing columns {missing}")

    rows = list(reader)
    returners = [row for row in rows if str(row["rookie"]).strip().lower() == "false"]
    rookies = [row for row in rows if str(row["rookie"]).strip().lower() == "true"]
    invalid_rookie = [
        row["player_id"]
        for row in rows
        if str(row["rookie"]).strip().lower() not in {"true", "false"}
    ]
    positions = sorted({str(row["position"]).strip().upper() for row in rows})
    duplicate_ids = []
    seen = set()
    for row in rows:
        pid = str(row["player_id"])
        if pid in seen:
            duplicate_ids.append(pid)
        seen.add(pid)

    checks = {
        "rows": len(rows),
        "returners": len(returners),
        "drafted_rookies": len(rookies),
        "positions": positions,
        "unique_player_ids": len(seen),
        "duplicate_player_ids": duplicate_ids,
        "invalid_rookie_values": invalid_rookie,
    }

    if checks["rows"] != EXPECTED_SNAPSHOT["rows"]:
        raise SystemExit(f"FAIL-CLOSED: expected 523 snapshot rows, got {checks['rows']}")
    if checks["returners"] != EXPECTED_SNAPSHOT["returners"]:
        raise SystemExit(
            f"FAIL-CLOSED: expected 444 returners, got {checks['returners']}"
        )
    if checks["drafted_rookies"] != EXPECTED_SNAPSHOT["drafted_rookies"]:
        raise SystemExit(
            f"FAIL-CLOSED: expected 79 rookies, got {checks['drafted_rookies']}"
        )
    if positions != sorted(EXPECTED_SNAPSHOT["positions"]):
        raise SystemExit(f"FAIL-CLOSED: unexpected positions {positions}")
    if len(seen) != EXPECTED_SNAPSHOT["rows"] or duplicate_ids:
        raise SystemExit(f"FAIL-CLOSED: duplicate player IDs {duplicate_ids[:10]}")
    if invalid_rookie:
        raise SystemExit(f"FAIL-CLOSED: invalid rookie flags {invalid_rookie[:10]}")

    return checks


def main() -> None:
    files = read_and_verify_files()
    snapshot = verify_snapshot()

    manifest = {
        "task_id": TASK_ID,
        "classification": "RESEARCH ONLY / PRE-REGISTERED PROSPECTIVE VALIDATION",
        "manifest_generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "starting_canonical_main": STARTING_MAIN,
        "protocol_freeze": {
            "commit_sha": PROTOCOL_FREEZE_COMMIT,
            "commit_timestamp_utc": PROTOCOL_FREEZE_TIMESTAMP_UTC,
            "outcomes_inspected_before_freeze": False,
            "outcomes_scored_before_freeze": False,
        },
        "immutable_files": files,
        "snapshot_checks": snapshot,
        "outcome_source": {
            "repository": "nflverse/nflverse-data",
            "release_tag": "stats_player",
            "asset_name": "stats_player_regpost_2026.csv",
            "regular_season_filter": "season_type case-insensitive == REG",
            "join_key": "snapshot player_id == outcome player_id (GSIS), exact only",
            "required_fields": [
                "player_id",
                "season_type",
                "games",
                "fantasy_points_ppr",
            ],
            "season_field_rule": "if present, scored rows must have season == 2026",
            "queried_before_protocol_freeze": False,
        },
        "checkpoint_policy": {
            "interim": [
                "after regular-season Week 4 — descriptive only",
                "after regular-season Week 8 — descriptive only",
                "after regular-season Week 13 — descriptive only",
            ],
            "final": "after completed regular-season Week 18 — only decisive checkpoint",
            "missed_interim_backfill": False,
        },
        "primary_hypothesis": "returning-player frozen Ridge PPR/game vs frozen previous-season PPR/game baseline",
        "rookies": "separate diagnostic only; transparent rookie baseline remains primary rookie comparator",
        "paired_player_bootstrap": {
            "replicates": 10000,
            "seed": 23023,
            "statistic": "mean(abs(ridge-actual) - abs(baseline-actual))",
            "interval": "ordinary percentile 95% [2.5%, 97.5%]",
        },
        "final_evidence_gate": {
            "returner_ppr_pg_mae_improvement_min_fraction": 0.03,
            "paired_bootstrap_mae_delta_ci95_upper_strictly_lt": 0.0,
            "ridge_minus_baseline_spearman_min": -0.01,
            "positions_non_worse_min_count": 3,
            "position_max_relative_mae_regression": 0.05,
            "integrity_required": True,
        },
        "production_authorization": "NONE",
        "production_ranking_authority_changed": False,
    }

    output = Path(".ai/research/generated/WR023_PROTOCOL_MANIFEST.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "protocol_sha256": files["protocol"]["sha256"],
        "snapshot_sha256": files["snapshot"]["sha256"],
        "snapshot_rows": snapshot["rows"],
        "returners": snapshot["returners"],
        "rookies": snapshot["drafted_rookies"],
    }, indent=2))


if __name__ == "__main__":
    main()
