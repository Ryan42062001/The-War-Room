#!/usr/bin/env python3
"""WR-097 Returning-Player v2.1 protected scoring consumer.

This consumer implements the exact WR-095 audited v2.1 protocol and is intentionally
silent: success/failure is communicated only by exit code and bridge/output files.

Protected execution modes:
  readiness     - protocol/credential-isolation self-check; no retained rows.
  predict       - prior seasons only; fit frozen rolling per-position bounded-residual models.
  target-ingest - target season only; bind immutable prediction evidence before reading targets.
  stage-gate    - no retained inputs; compute the frozen validation/confirmation gates from state.

WR-097 itself does not authorize real scoring. The consumer is exercised on synthetic
fixtures only until a separately audited/integrated bridge receives one-time Manager authority.
"""
from __future__ import annotations

import csv
import hashlib
import importlib.metadata
import json
import math
import os
import platform
import sys
import warnings
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence

import numpy as np
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler

TASK_ID = "WR-097"
SCHEMA = "wr097-v21-protected-scoring-consumer-v1"
BRIDGE_SCHEMA = "wr097-v21-consumer-result-v1"

SOURCE_SNAPSHOT_ID = "wr-returning-player-v2-source-snapshot/1.2.0-wr059"
SOURCE_SNAPSHOT_SHA256 = "6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea"
COHORT_ID = "returning-player-v2-cohort/1.2.0-wr059"
COHORT_SHA256 = "f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4"
PROTOCOL_ID = "returning-player-v2.1-model-protocol-candidate/1.0.0-wr095"
PROTOCOL_SHA256 = "5c86dacac044538422ca24fbeb13eaee3161050f917acc40f0dbdc1ca6547a39"
GATES_ID = "returning-player-v2.1-result-gates-candidate/1.0.0-wr095"
FEATURE_SCHEMA_ID = "returning-player-v2.1-feature-schema/1.0.0-wr095"
PREP_ID = "returning-player-v2.1-preprocessing/1.0.0-wr095"
CANDIDATE_ID = "returning-player-v2.1-bounded-residual-ridge-a100/1.0.0-wr095"
TARGET_ID = "returning-player-v2-expected-ppr-pg-target/1.0.0-wr072"
SERIALIZER_ID = "returning-player-v2-evidence-serializer/1.0.0-wr072"
SOURCE_IDENTITY_SET_SHA256 = "8cbe874b3ceea141cbb9fedb2198ffa940ee218fe4556feace7afd8bbfb89351"

EXPECTED_BINDINGS = {
    "source_snapshot": {"id": SOURCE_SNAPSHOT_ID, "sha256": SOURCE_SNAPSHOT_SHA256},
    "cohort": {"id": COHORT_ID, "sha256": COHORT_SHA256},
    "protocol": {"id": PROTOCOL_ID, "sha256": PROTOCOL_SHA256, "gates_id": GATES_ID},
    "admitted_stats_source_count": 14,
    "players_metadata_admitted_count": 0,
    "draft_picks_csv_used": False,
    "source_identity_set_sha256": SOURCE_IDENTITY_SET_SHA256,
}

POSITIONS = ("QB", "RB", "WR", "TE")
POSITION_ORDER = {p: i for i, p in enumerate(POSITIONS)}
STAGE_YEARS = {
    "validation": (2022, 2023),
    "confirmation": (2024, 2025),
}
FUTURE_YEARS = (2022, 2023, 2024, 2025)
Z_CLIP_ABS = 6.0
ROBUST_SIGMA_FACTOR = 1.4826
RESIDUAL_BOUND_MULTIPLIER = 3.0
RIDGE_CONFIG = {
    "alpha": 100.0, "copy_X": True, "fit_intercept": True,
    "max_iter": None, "positive": False, "random_state": None,
    "solver": "svd", "tol": 0.0001,
}
PROVIDER_AUTHORITY_NAMES = (
    "WR_CUSTODY_B2_READ_KEY_ID", "WR_CUSTODY_B2_READ_APPLICATION_KEY",
    "WR_CUSTODY_R2_ACCESS_KEY_ID", "WR_CUSTODY_R2_SECRET_ACCESS_KEY",
    "WR_CUSTODY_B2_BUCKET", "WR_CUSTODY_B2_ENDPOINT",
    "WR_CUSTODY_R2_BUCKET", "WR_CUSTODY_R2_ENDPOINT",
)
PUBLICATION_FAMILIES = (
    "RETURNING_PLAYER_V21_KEY_MANIFEST",
    "RETURNING_PLAYER_V21_FEATURE_SURFACE",
    "RETURNING_PLAYER_V21_PREPROCESSING_STATES",
    "RETURNING_PLAYER_V21_MODEL_STATES",
    "RETURNING_PLAYER_V21_PREDICTIONS_PRE_OUTCOME",
    "RETURNING_PLAYER_V21_EVALUATIONS",
    "RETURNING_PLAYER_V21_STAGE_GATES",
    "RETURNING_PLAYER_V21_ENVIRONMENT_LOCK",
    "RETURNING_PLAYER_V21_EXECUTION_CHRONOLOGY",
    "RETURNING_PLAYER_V21_RESULT_MANIFEST",
    "RETURNING_PLAYER_V21_TERMINAL_RESULT",
    "RETURNING_PLAYER_V21_AUTHORITY_CONSUMPTION_RECEIPT",
)
YEAR_STAGE = {y: s for s, years in STAGE_YEARS.items() for y in years}
EXPECTED_COHORT_COUNTS = {
    2014: 410, 2015: 412, 2016: 423, 2017: 423,
    2018: 419, 2019: 444, 2020: 437, 2021: 435,
    2022: 475, 2023: 446, 2024: 421, 2025: 431,
}

FEATURE_NAMES = (
    "prev1_ppr_pg", "prev1_games", "prev1_attempts_pg", "prev1_carries_pg",
    "prev1_targets_pg", "prev1_receptions_pg", "prev1_pass_yards_pg",
    "prev1_pass_tds_pg", "prev1_int_pg", "prev1_rush_yards_pg",
    "prev1_rush_tds_pg", "prev1_rec_yards_pg", "prev1_rec_tds_pg",
    "prev1_pass_epa_pg", "prev1_rush_epa_pg", "prev1_rec_epa_pg",
    "prev1_target_share", "prev1_air_yards_share", "prev1_wopr",
    "prev1_pass_ypa", "prev1_rush_ypc", "prev1_rec_ypt", "prev2_ppr_pg",
    "prev2_games", "ppr_delta", "weighted_ppr_pg", "games_delta", "has_prev2",
)
FEATURE_TYPES = tuple(["f64"] * 27 + ["i8"])

ADD_FIELDS = (
    "fantasy_points_ppr", "attempts", "carries", "targets", "receptions",
    "passing_yards", "passing_tds", "passing_interceptions", "rushing_yards",
    "rushing_tds", "receiving_yards", "receiving_tds", "passing_epa",
    "rushing_epa", "receiving_epa",
)
MEAN_FIELDS = ("target_share", "air_yards_share", "wopr")
REQUIRED_COLUMNS = {
    "player_id", "position", "season", "season_type", "games",
    *ADD_FIELDS, *MEAN_FIELDS,
}

RUNTIME_PACKAGES = {
    "numpy": "2.1.3",
    "pandas": "2.2.3",
    "scikit-learn": "1.5.2",
    "scipy": "1.14.1",
}
RUNTIME_ENV = {
    "PYTHONHASHSEED": "72072",
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1",
    "OPENBLAS_NUM_THREADS": "1",
    "NUMEXPR_NUM_THREADS": "1",
    "TZ": "UTC",
}

class ContractError(RuntimeError):
    pass

def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def sha256_file(path: Path) -> tuple[str, int]:
    h = hashlib.sha256()
    size = 0
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
            size += len(chunk)
    return h.hexdigest(), size

def write_json(path: Path, payload: Any) -> tuple[str, int]:
    data = canonical_bytes(payload)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return sha256_bytes(data), len(data)

def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ContractError(f"invalid JSON: {path.name}") from exc

def fstr(value: float) -> str:
    x = float(value)
    if not math.isfinite(x):
        raise ContractError("nonfinite numeric evidence")
    if x == 0.0:
        x = 0.0
    return format(x, ".17g")

def finite_float(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if text == "":
        return None
    try:
        x = float(text)
    except (TypeError, ValueError):
        return None
    return x if math.isfinite(x) else None

def parse_cli(argv: Sequence[str]) -> dict[str, str]:
    expected = {
        "--wr097-mode", "--wr097-context", "--wr097-state-dir",
        "--wr097-lock-dir", "--wr097-output-dir",
    }
    if len(argv) != 10:
        raise ContractError("exact WR-097 CLI required")
    out: dict[str, str] = {}
    for i in range(0, len(argv), 2):
        flag, value = argv[i], argv[i + 1]
        if flag not in expected or flag in out or not value:
            raise ContractError("invalid WR-097 CLI")
        out[flag] = value
    if set(out) != expected or out["--wr097-mode"] not in {"readiness", "predict", "target-ingest", "stage-gate"}:
        raise ContractError("invalid WR-097 mode")
    return out

def stage_for_year(year: int) -> str:
    stage = YEAR_STAGE.get(year)
    if stage is None:
        raise ContractError("target season outside frozen chronology")
    return stage

def stable_key(target_year: int, player_id: str, position: str) -> list[Any]:
    return [target_year, "gsis_id", player_id, position, COHORT_ID]

def stable_key_sort(row: Mapping[str, Any]) -> tuple[Any, ...]:
    return (
        int(row["target_season"]),
        POSITION_ORDER[str(row["position"])],
        str(row["player_id"]).encode("utf-8"),
    )

def _runtime_evidence(synthetic: bool) -> dict[str, Any]:
    package_versions = {}
    for name in RUNTIME_PACKAGES:
        try:
            package_versions[name] = importlib.metadata.version(name)
        except importlib.metadata.PackageNotFoundError as exc:
            raise ContractError(f"missing runtime package: {name}") from exc
    evidence = {
        "python": platform.python_version(),
        "system": platform.system(),
        "machine": platform.machine(),
        "package_versions": package_versions,
        "environment": {k: os.environ.get(k) for k in RUNTIME_ENV},
        "lang": os.environ.get("LANG"),
        "lc_all": os.environ.get("LC_ALL"),
        "synthetic_fixture": synthetic,
    }
    if synthetic:
        return evidence
    if platform.python_version() != "3.12.7" or platform.system() != "Linux" or platform.machine() != "x86_64":
        raise ContractError("frozen runtime mismatch")
    for name, expected in RUNTIME_PACKAGES.items():
        if package_versions.get(name) != expected:
            raise ContractError("frozen package version mismatch")
    for name, expected in RUNTIME_ENV.items():
        if os.environ.get(name) != expected:
            raise ContractError("frozen runtime environment mismatch")
    if os.environ.get("LANG") != "C.UTF-8" or os.environ.get("LC_ALL") != "C.UTF-8":
        raise ContractError("frozen locale mismatch")
    os_release = Path("/etc/os-release")
    if not os_release.is_file() or 'VERSION_ID="24.04"' not in os_release.read_text(encoding="utf-8"):
        raise ContractError("frozen Ubuntu version mismatch")
    return evidence

def _validate_bindings(value: Any) -> None:
    if value != EXPECTED_BINDINGS:
        raise ContractError("accepted WR-059/WR-095 bindings mismatch")

def assert_no_provider_authority(environment: Mapping[str, str] = os.environ) -> None:
    present = sorted(name for name in PROVIDER_AUTHORITY_NAMES if environment.get(name))
    if present:
        raise ContractError("provider authority present in consumer")

def _validate_context(mode: str, context_path: Path) -> dict[str, Any]:
    context = read_json(context_path)
    if not isinstance(context, dict) or context.get("task_id") != TASK_ID or context.get("mode") != mode:
        raise ContractError("context identity mismatch")
    _validate_bindings(context.get("bindings"))
    if mode == "readiness":
        if context.get("synthetic_fixture") is not True or context.get("visible_sources") not in (None, []):
            raise ContractError("readiness must be synthetic and source-free")
        return context
    if mode in {"predict", "target-ingest"}:
        year = int(context.get("target_season", -1))
        stage = str(context.get("stage", ""))
        if stage_for_year(year) != stage:
            raise ContractError("stage/year mismatch")
    else:
        stage = str(context.get("stage", ""))
        if stage not in STAGE_YEARS or context.get("target_seasons") != list(STAGE_YEARS[stage]):
            raise ContractError("stage-gate chronology mismatch")
    return context

def _verify_visible_sources(context: Mapping[str, Any], context_path: Path, mode: str) -> dict[int, dict[str, Any]]:
    sources = context.get("visible_sources", [])
    if mode == "stage-gate":
        if sources not in (None, []):
            raise ContractError("stage-gate must not expose retained sources")
        return {}
    if not isinstance(sources, list):
        raise ContractError("visible source list missing")
    year = int(context["target_season"])
    expected_seasons = list(range(2012, year)) if mode == "predict" else [year]
    if [int(x.get("season", -1)) for x in sources] != expected_seasons:
        raise ContractError("visible-season boundary violation")
    parent = context_path.resolve().parent
    result: dict[int, dict[str, Any]] = {}
    for item in sources:
        season = int(item.get("season", -1))
        source_id = str(item.get("source_id", ""))
        digest = str(item.get("sha256", ""))
        size = int(item.get("byte_size", -1))
        path = Path(str(item.get("path", "")))
        if source_id != f"nflverse-player-summary-{season}" or len(digest) != 64 or size <= 0:
            raise ContractError("visible source identity malformed")
        resolved = path.resolve()
        if resolved.parent != parent or resolved.name != f"stats-{season}-{digest}.raw":
            raise ContractError("visible source path mismatch")
        if sha256_file(resolved) != (digest, size):
            raise ContractError("visible source digest mismatch")
        result[season] = {"path": resolved, **dict(item)}
    return result

def _aggregate_source(path: Path, expected_season: int) -> dict[tuple[str, str], dict[str, Any]]:
    groups: dict[tuple[str, str], dict[str, Any]] = {}
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None or not REQUIRED_COLUMNS.issubset(set(reader.fieldnames)):
            raise ContractError("required source field absent")
        for row in reader:
            try:
                season = int(str(row.get("season", "")).strip())
            except ValueError as exc:
                raise ContractError("invalid source season") from exc
            if season != expected_season:
                raise ContractError("source row season mismatch")
            if str(row.get("season_type", "")).strip() != "REG":
                continue
            position = str(row.get("position", "")).strip()
            if position not in POSITIONS:
                continue
            player_id = str(row.get("player_id", "")).strip()
            if not player_id:
                raise ContractError("missing player_id")
            games = finite_float(row.get("games"))
            if games is None or games < 0 or int(games) != games:
                raise ContractError("invalid games")
            key = (player_id, position)
            g = groups.setdefault(key, {
                "player_id": player_id, "position": position, "games_values": [],
                "add": {name: 0.0 for name in ADD_FIELDS},
                "add_missing": {name: False for name in ADD_FIELDS},
                "mean_values": {name: [] for name in MEAN_FIELDS},
                "row_count": 0,
            })
            g["games_values"].append(float(games))
            g["row_count"] += 1
            for name in ADD_FIELDS:
                value = finite_float(row.get(name))
                if value is None:
                    g["add_missing"][name] = True
                    value = 0.0
                g["add"][name] += float(value)
            for name in MEAN_FIELDS:
                value = finite_float(row.get(name))
                if value is not None:
                    g["mean_values"][name].append(float(value))
    out = {}
    for key, g in groups.items():
        games = max(g["games_values"]) if g["games_values"] else 0.0
        means = {}
        mean_missing = {}
        for name in MEAN_FIELDS:
            values = g["mean_values"][name]
            means[name] = math.fsum(values) / len(values) if values else 0.0
            mean_missing[name] = not bool(values)
        out[key] = {
            "player_id": g["player_id"],
            "position": g["position"],
            "games": games,
            "add": g["add"],
            "add_missing": g["add_missing"],
            "mean": means,
            "mean_missing": mean_missing,
            "row_count": g["row_count"],
        }
    return out

def _load_aggregates(visible: Mapping[int, Mapping[str, Any]]) -> dict[int, dict[tuple[str, str], dict[str, Any]]]:
    return {year: _aggregate_source(Path(str(meta["path"])), year) for year, meta in visible.items()}

def _same_player(groups: Mapping[tuple[str, str], dict[str, Any]], player_id: str, preferred_position: str) -> dict[str, Any] | None:
    exact = groups.get((player_id, preferred_position))
    if exact is not None:
        return exact
    matches = [v for (pid, _), v in groups.items() if pid == player_id and v["position"] in POSITIONS]
    if len(matches) > 1:
        raise ContractError("ambiguous same-player historical row")
    return matches[0] if matches else None

def _require_valid_feature_row(row: dict[str, Any] | None) -> dict[str, Any]:
    if row is None or not math.isfinite(float(row["games"])) or float(row["games"]) <= 0:
        raise ContractError("GAMES_FATAL")
    return row

def _pg(row: Mapping[str, Any], field: str) -> float:
    games = float(row["games"])
    if games <= 0:
        raise ContractError("GAMES_FATAL")
    return float(row["add"][field]) / games

def _serialize_feature(values: Sequence[float]) -> tuple[list[list[Any]], str]:
    if len(values) != 28:
        raise ContractError("feature count mismatch")
    encoded = []
    for name, typ, value in zip(FEATURE_NAMES, FEATURE_TYPES, values):
        if typ == "i8":
            iv = int(value)
            if iv not in (0, 1) or float(iv) != float(value):
                raise ContractError("invalid indicator")
            val = str(iv)
        else:
            val = fstr(float(value))
        encoded.append([name, typ, False, val])
    digest = sha256_bytes(json.dumps(encoded, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))
    return encoded, digest

def _feature_for(
    target_year: int,
    player_id: str,
    position: str,
    aggregates: Mapping[int, Mapping[tuple[str, str], dict[str, Any]]],
    visible: Mapping[int, Mapping[str, Any]],
) -> dict[str, Any]:
    prev1 = _require_valid_feature_row(aggregates.get(target_year - 1, {}).get((player_id, position)))
    raw_prev2 = _same_player(aggregates.get(target_year - 2, {}), player_id, position)
    prev2 = raw_prev2 if raw_prev2 is not None and float(raw_prev2["games"]) > 0 else None

    ppr1 = _pg(prev1, "fantasy_points_ppr")
    attempts = float(prev1["add"]["attempts"])
    carries = float(prev1["add"]["carries"])
    targets = float(prev1["add"]["targets"])
    values = [
        ppr1, float(prev1["games"]), _pg(prev1, "attempts"), _pg(prev1, "carries"),
        _pg(prev1, "targets"), _pg(prev1, "receptions"), _pg(prev1, "passing_yards"),
        _pg(prev1, "passing_tds"), _pg(prev1, "passing_interceptions"),
        _pg(prev1, "rushing_yards"), _pg(prev1, "rushing_tds"),
        _pg(prev1, "receiving_yards"), _pg(prev1, "receiving_tds"),
        _pg(prev1, "passing_epa"), _pg(prev1, "rushing_epa"), _pg(prev1, "receiving_epa"),
        float(prev1["mean"]["target_share"]), float(prev1["mean"]["air_yards_share"]),
        float(prev1["mean"]["wopr"]),
        float(prev1["add"]["passing_yards"]) / attempts if attempts > 0 else 0.0,
        float(prev1["add"]["rushing_yards"]) / carries if carries > 0 else 0.0,
        float(prev1["add"]["receiving_yards"]) / targets if targets > 0 else 0.0,
    ]
    if prev2 is not None:
        ppr2, games2 = _pg(prev2, "fantasy_points_ppr"), float(prev2["games"])
        has_prev2 = 1.0
    else:
        ppr2, games2, has_prev2 = ppr1, float(prev1["games"]), 0.0
    values.extend([
        ppr2, games2, ppr1 - ppr2, 0.70 * ppr1 + 0.30 * ppr2,
        float(prev1["games"]) - games2, has_prev2,
    ])
    if any(not math.isfinite(float(x)) for x in values):
        raise ContractError("nonfinite feature")
    encoded, feature_sha = _serialize_feature(values)
    flags = {
        "prev1_add_missing": {k: bool(v) for k, v in prev1["add_missing"].items()},
        "prev1_mean_missing": {k: bool(v) for k, v in prev1["mean_missing"].items()},
        "prev1_denom_zero": {"attempts": attempts <= 0, "carries": carries <= 0, "targets": targets <= 0},
        "prior2_missing": prev2 is None,
    }
    if prev2 is not None:
        flags["prev2_add_missing"] = {k: bool(v) for k, v in prev2["add_missing"].items()}
        flags["prev2_mean_missing"] = {k: bool(v) for k, v in prev2["mean_missing"].items()}
    lineage = {
        "prev1": {"season": target_year - 1, "source_sha256": str(visible[target_year - 1]["sha256"])},
        "prev2": None if prev2 is None else {"season": target_year - 2, "source_sha256": str(visible[target_year - 2]["sha256"])},
        "source_fields": sorted(REQUIRED_COLUMNS),
        "failed_closed_metadata_used": False,
        "draft_capital_used": False,
    }
    return {
        "target_season": target_year,
        "player_id_namespace": "gsis_id",
        "player_id": player_id,
        "position": position,
        "stable_key": stable_key(target_year, player_id, position),
        "feature_schema_id": FEATURE_SCHEMA_ID,
        "ordered_values": encoded,
        "feature_sha256": feature_sha,
        "values": [float(x) for x in values],
        "flags": flags,
        "lineage": lineage,
    }

def _cohort_for(
    target_year: int,
    aggregates: Mapping[int, Mapping[tuple[str, str], dict[str, Any]]],
    *,
    enforce_expected_count: bool = False,
) -> list[tuple[str, str]]:
    source = aggregates.get(target_year - 1)
    if source is None:
        raise ContractError("cohort source missing")
    members = []
    for (player_id, position), row in source.items():
        if position in POSITIONS and float(row["games"]) > 0:
            members.append((player_id, position))
    members.sort(key=lambda x: (POSITION_ORDER[x[1]], x[0]))
    if len(members) != len(set(members)):
        raise ContractError("duplicate cohort key")
    if enforce_expected_count and EXPECTED_COHORT_COUNTS.get(target_year) != len(members):
        raise ContractError("accepted WR-059 cohort count mismatch")
    return members

def _target_from_groups(groups: Mapping[tuple[str, str], dict[str, Any]], player_id: str, frozen_position: str) -> tuple[str, float | None, int | None]:
    row = _same_player(groups, player_id, frozen_position)
    if row is None or float(row["games"]) <= 0:
        return "TARGET_UNAVAILABLE", None, None
    games = float(row["games"])
    if int(games) != games:
        raise ContractError("target games invalid")
    value = float(row["add"]["fantasy_points_ppr"]) / games
    if not math.isfinite(value):
        raise ContractError("target nonfinite")
    return "OBSERVED", value, int(games)

def _build_training_rows(
    target_year: int,
    position: str,
    aggregates: Mapping[int, Mapping[tuple[str, str], dict[str, Any]]],
    visible: Mapping[int, Mapping[str, Any]],
    *,
    enforce_expected_count: bool = False,
) -> list[dict[str, Any]]:
    rows = []
    for season in range(2014, target_year):
        for player_id, pos in _cohort_for(season, aggregates, enforce_expected_count=enforce_expected_count):
            if pos != position:
                continue
            feature = _feature_for(season, player_id, pos, aggregates, visible)
            status, target, games = _target_from_groups(aggregates.get(season, {}), player_id, pos)
            if status != "OBSERVED":
                continue
            rows.append({
                "target_season": season, "player_id": player_id, "position": pos,
                "feature": feature, "target": float(target), "target_games": games,
            })
    rows.sort(key=stable_key_sort)
    return rows

def _digest_key_list(rows: Sequence[Mapping[str, Any]]) -> str:
    keys = [stable_key(int(x["target_season"]), str(x["player_id"]), str(x["position"])) for x in rows]
    return sha256_bytes(canonical_bytes(keys))

def _clip_matrix(z_raw: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    if not np.isfinite(z_raw).all():
        raise ContractError("nonfinite standardized feature")
    z_model = np.clip(z_raw, -Z_CLIP_ABS, Z_CLIP_ABS)
    flags = z_model != z_raw
    return z_model, flags

def _fit_v21_fold(
    X_train: np.ndarray,
    observed_targets: np.ndarray,
    train_baselines: np.ndarray,
    X_pred: np.ndarray,
    pred_baselines: np.ndarray,
) -> dict[str, Any]:
    X_train = np.asarray(X_train, dtype=np.float64)
    observed_targets = np.asarray(observed_targets, dtype=np.float64)
    train_baselines = np.asarray(train_baselines, dtype=np.float64)
    X_pred = np.asarray(X_pred, dtype=np.float64)
    pred_baselines = np.asarray(pred_baselines, dtype=np.float64)
    if X_train.ndim != 2 or X_train.shape[1] != 28 or X_pred.ndim != 2 or X_pred.shape[1] != 28:
        raise ContractError("feature matrix shape mismatch")
    if len(X_train) != len(observed_targets) or len(X_train) != len(train_baselines) or len(X_pred) != len(pred_baselines):
        raise ContractError("fold vector length mismatch")
    if not all(np.isfinite(x).all() for x in (X_train, observed_targets, train_baselines, X_pred, pred_baselines)):
        raise ContractError("nonfinite fold input")
    residual_target = observed_targets - train_baselines
    if not np.isfinite(residual_target).all():
        raise ContractError("nonfinite residual target")
    center = float(np.median(residual_target))
    mad = float(np.median(np.abs(residual_target - center)))
    robust_sigma = ROBUST_SIGMA_FACTOR * mad
    if not all(math.isfinite(x) for x in (center, mad, robust_sigma)) or robust_sigma <= 0.0:
        return {
            "fallback": True, "fallback_reason": "INVALID_RESIDUAL_SCALE",
            "residual_center": center if math.isfinite(center) else None,
            "residual_mad": mad if math.isfinite(mad) else None,
            "robust_sigma": robust_sigma if math.isfinite(robust_sigma) else None,
        }
    lower = center - RESIDUAL_BOUND_MULTIPLIER * robust_sigma
    upper = center + RESIDUAL_BOUND_MULTIPLIER * robust_sigma
    if not math.isfinite(lower) or not math.isfinite(upper) or lower > upper:
        raise ContractError("invalid residual bounds")
    scaler = StandardScaler(copy=True, with_mean=True, with_std=True)
    z_raw_train = scaler.fit_transform(X_train)
    z_model_train, train_clip_flags = _clip_matrix(z_raw_train)
    model = Ridge(**RIDGE_CONFIG)
    model.fit(z_model_train, residual_target)
    z_raw_pred = scaler.transform(X_pred)
    z_model_pred, pred_clip_flags = _clip_matrix(z_raw_pred)
    raw_adjustment = np.asarray(model.predict(z_model_pred), dtype=np.float64)
    if not np.isfinite(raw_adjustment).all():
        raise ContractError("nonfinite residual prediction")
    bounded_adjustment = np.clip(raw_adjustment, lower, upper)
    final_prediction = pred_baselines + bounded_adjustment
    if not np.isfinite(final_prediction).all():
        raise ContractError("nonfinite final prediction")
    if np.any(bounded_adjustment < lower) or np.any(bounded_adjustment > upper):
        raise ContractError("bounded adjustment escaped residual bound")
    return {
        "fallback": False, "scaler": scaler, "model": model,
        "residual_target": residual_target, "residual_center": center,
        "residual_mad": mad, "robust_sigma": robust_sigma,
        "lower": lower, "upper": upper,
        "z_raw_train": z_raw_train, "z_model_train": z_model_train,
        "train_clip_flags": train_clip_flags,
        "z_raw_pred": z_raw_pred, "z_model_pred": z_model_pred,
        "pred_clip_flags": pred_clip_flags,
        "raw_adjustment": raw_adjustment,
        "bounded_adjustment": bounded_adjustment,
        "final_prediction": final_prediction,
    }

def _scaler_state(scaler: StandardScaler, train_rows: Sequence[Mapping[str, Any]], position: str, target_year: int,
                  z_raw_train: np.ndarray, train_clip_flags: np.ndarray) -> dict[str, Any]:
    state = {
        "id": PREP_ID, "target_season": target_year, "position": position,
        "ordered_features": list(FEATURE_NAMES),
        "ordered_train_key_sha256": _digest_key_list(train_rows),
        "ordered_train_key_count": len(train_rows),
        "mean_": [fstr(float(x)) for x in scaler.mean_],
        "var_": [fstr(float(x)) for x in scaler.var_],
        "scale_": [fstr(float(x)) for x in scaler.scale_],
        "n_samples_seen_": int(scaler.n_samples_seen_), "dtype": "float64",
        "transform_order": ["StandardScaler", "clip[-6,+6]"],
        "z_clip_absolute": Z_CLIP_ABS,
        "training_clip_count": int(np.count_nonzero(train_clip_flags)),
        "training_max_abs_z_raw": fstr(float(np.max(np.abs(z_raw_train)))) if z_raw_train.size else "0",
    }
    state["digest"] = sha256_bytes(canonical_bytes(state))
    return state

def _model_state(model: Ridge, prep_digest: str, position: str, target_year: int, fold: Mapping[str, Any]) -> dict[str, Any]:
    state = {
        "candidate_id": CANDIDATE_ID, "target_definition_id": TARGET_ID,
        "model_target": "target_ppr_pg - prev1_ppr_pg",
        "target_season": target_year, "position": position,
        "hyperparameters": dict(RIDGE_CONFIG), "preprocessing_digest": prep_digest,
        "residual_center": fstr(float(fold["residual_center"])),
        "residual_mad": fstr(float(fold["residual_mad"])),
        "robust_sigma": fstr(float(fold["robust_sigma"])),
        "robust_sigma_factor": fstr(ROBUST_SIGMA_FACTOR),
        "residual_bound_multiplier": fstr(RESIDUAL_BOUND_MULTIPLIER),
        "residual_lower": fstr(float(fold["lower"])),
        "residual_upper": fstr(float(fold["upper"])),
        "coef_": [fstr(float(x)) for x in np.asarray(model.coef_, dtype=np.float64).tolist()],
        "intercept_": fstr(float(model.intercept_)),
        "n_features_in_": int(model.n_features_in_),
    }
    state["digest"] = sha256_bytes(canonical_bytes(state))
    return state

def _consumer_sha() -> str:
    return sha256_file(Path(__file__).resolve())[0]

def _publication(output_dir: Path, family: str, payload: Any, suffix: str | None = None) -> dict[str, Any]:
    if family not in PUBLICATION_FAMILIES:
        raise ContractError("publication family not allowed")
    tail = "" if suffix is None else "_" + suffix
    relpath = f".ai/research/generated/{family}{tail}.json"
    dest = output_dir / "files" / relpath
    digest, size = write_json(dest, payload)
    return {"path": relpath, "sha256": digest, "byte_size": size, "family": family}

def _finish(output_dir: Path, mode: str, bridge: Mapping[str, Any], publications: Sequence[dict[str, Any]]) -> None:
    write_json(output_dir / "publication-manifest.json", {
        "schema_version": "wr097-v21-consumer-publication-manifest-v1",
        "files": list(publications),
    })
    result = {"schema_version": BRIDGE_SCHEMA, "mode": mode, "status": "PASS", **dict(bridge)}
    write_json(output_dir / "bridge-result.json", result)

def _prediction_state_path(state_dir: Path, year: int) -> Path:
    return state_dir / f"prediction-{year}.json"

def _evaluation_state_path(state_dir: Path, year: int) -> Path:
    return state_dir / f"evaluation-{year}.json"

def _gate_state_path(state_dir: Path, stage: str) -> Path:
    return state_dir / f"gate-{stage}.json"

def _lock_publication_tree(lock_dir: Path) -> str:
    manifest = read_json(lock_dir / "publication-manifest.json")
    files = manifest.get("files")
    if not isinstance(files, list) or not files:
        raise ContractError("immutable lock publication manifest invalid")
    checked = []
    for entry in files:
        rel = str(entry.get("path", ""))
        digest = str(entry.get("sha256", ""))
        size = int(entry.get("byte_size", -1))
        file_path = lock_dir / "files" / rel
        if sha256_file(file_path) != (digest, size):
            raise ContractError("immutable lock publication mismatch")
        checked.append({"path": rel, "sha256": digest, "byte_size": size})
    checked.sort(key=lambda x: x["path"])
    return sha256_bytes(canonical_bytes(checked))

def _verify_prediction_lock(locks_dir: Path, year: int, expected: str) -> None:
    if len(expected) != 64:
        raise ContractError("prediction lock malformed")
    actual = _lock_publication_tree(locks_dir / f"prediction-{year}")
    if actual != expected:
        raise ContractError("prediction lock mismatch")

def _verify_gate_lock(locks_dir: Path, stage: str, expected: str) -> dict[str, Any]:
    lock_path = locks_dir / f"gate-{stage}"
    if _lock_publication_tree(lock_path) != expected:
        raise ContractError("prior gate lock mismatch")
    bridge = read_json(lock_path / "bridge-result.json")
    if bridge.get("schema_version") != BRIDGE_SCHEMA or bridge.get("mode") != "stage-gate" or bridge.get("stage") != stage:
        raise ContractError("prior gate bridge mismatch")
    return bridge

def _require_prior_future_outcomes(state_dir: Path, target_year: int) -> None:
    for prior_year in [y for y in FUTURE_YEARS if y < target_year]:
        path = _evaluation_state_path(state_dir, prior_year)
        if not path.is_file():
            raise ContractError("prior future-season outcome unavailable before lawful lock/exposure")
        state = read_json(path)
        evaluation = state.get("evaluation")
        if not isinstance(evaluation, dict) or int(evaluation.get("target_season", -1)) != prior_year:
            raise ContractError("prior future-season evaluation state mismatch")
        if state.get("evaluation_sha256") != sha256_bytes(canonical_bytes(evaluation)):
            raise ContractError("prior future-season evaluation digest mismatch")

def _fallback_prediction(feature: Mapping[str, Any], year: int, position: str, reason: str) -> dict[str, Any]:
    prev1 = float(feature["values"][0])
    row = {
        "target_season": year, "player_id_namespace": "gsis_id",
        "player_id": feature["player_id"], "position": position,
        "stable_key": feature["stable_key"], "status": "FALLBACK",
        "fallback_reason": reason, "candidate_prediction": fstr(prev1),
        "primary_baseline_prediction": fstr(prev1),
        "weighted_baseline_prediction": fstr(float(feature["values"][25])),
        "same_position_mean_baseline_prediction": None,
        "feature_sha256": feature["feature_sha256"],
        "preprocessing_digest": None, "model_digest": None,
        "raw_residual_prediction": None, "residual_center": None,
        "residual_robust_sigma": None, "residual_lower": None,
        "residual_upper": None, "bounded_residual_adjustment": None,
        "z_raw": None, "z_model": None, "feature_clip_flags": None, "feature_clip_count": None,
    }
    row["row_digest"] = sha256_bytes(canonical_bytes(row))
    return row

def _predict(context: Mapping[str, Any], context_path: Path, state_dir: Path, locks_dir: Path, output_dir: Path) -> None:
    year = int(context["target_season"])
    stage = str(context["stage"])
    synthetic = bool(context.get("synthetic_fixture", False))
    runtime = _runtime_evidence(synthetic)
    visible = _verify_visible_sources(context, context_path, "predict")
    aggregates = _load_aggregates(visible)

    prediction_locks = context.get("prediction_locks", {})
    if not isinstance(prediction_locks, dict):
        raise ContractError("prediction lock map malformed")
    prior_future = [y for y in FUTURE_YEARS if y < year]
    if set(prediction_locks) != {str(y) for y in prior_future}:
        raise ContractError("prediction lock history mismatch")
    for prior in prior_future:
        _verify_prediction_lock(locks_dir, prior, str(prediction_locks[str(prior)]))
    if str(year) in prediction_locks:
        raise ContractError("current target already has prediction lock")

    gate_locks = context.get("gate_locks", {})
    if not isinstance(gate_locks, dict):
        raise ContractError("gate lock map malformed")
    expected_gate_locks = [] if stage == "validation" else ["validation"]
    if set(gate_locks) != set(expected_gate_locks):
        raise ContractError("gate lock history mismatch")
    for prior_stage in expected_gate_locks:
        if _verify_gate_lock(locks_dir, prior_stage, str(gate_locks[prior_stage])).get("gate_pass") is not True:
            raise ContractError("prior stage not eligible")
    _require_prior_future_outcomes(state_dir, year)

    members = _cohort_for(year, aggregates, enforce_expected_count=not synthetic)
    features = [_feature_for(year, pid, pos, aggregates, visible) for pid, pos in members]
    predictions: list[dict[str, Any]] = []
    prep_states: list[dict[str, Any]] = []
    model_states: list[dict[str, Any]] = []
    fallback_count = 0
    by_pos = {p: [] for p in POSITIONS}
    for feature in features:
        by_pos[feature["position"]].append(feature)

    for position in POSITIONS:
        train = _build_training_rows(year, position, aggregates, visible, enforce_expected_count=not synthetic)
        candidates = by_pos[position]
        if len(train) < 25:
            fallback_count += len(candidates)
            predictions.extend(_fallback_prediction(feature, year, position, "TRAINING_ROWS_LT_25") for feature in candidates)
            continue

        X_train = np.asarray([x["feature"]["values"] for x in train], dtype=np.float64)
        y_train = np.asarray([x["target"] for x in train], dtype=np.float64)
        train_baseline = np.asarray([x["feature"]["values"][0] for x in train], dtype=np.float64)
        X_pred = np.asarray([x["values"] for x in candidates], dtype=np.float64) if candidates else np.empty((0, 28), dtype=np.float64)
        pred_baseline = np.asarray([x["values"][0] for x in candidates], dtype=np.float64)
        fold = _fit_v21_fold(X_train, y_train, train_baseline, X_pred, pred_baseline)
        earlier_mean = math.fsum(float(x["target"]) for x in train) / len(train)
        if not math.isfinite(earlier_mean):
            raise ContractError("nonfinite same-position mean")
        if fold["fallback"]:
            fallback_count += len(candidates)
            predictions.extend(_fallback_prediction(feature, year, position, str(fold["fallback_reason"])) for feature in candidates)
            continue

        prep = _scaler_state(fold["scaler"], train, position, year, fold["z_raw_train"], fold["train_clip_flags"])
        model_state = _model_state(fold["model"], prep["digest"], position, year, fold)
        prep_states.append(prep); model_states.append(model_state)
        for idx, feature in enumerate(candidates):
            raw_adj = float(fold["raw_adjustment"][idx])
            bounded = float(fold["bounded_adjustment"][idx])
            candidate = float(fold["final_prediction"][idx])
            z_raw = [fstr(float(x)) for x in fold["z_raw_pred"][idx].tolist()]
            z_model = [fstr(float(x)) for x in fold["z_model_pred"][idx].tolist()]
            clip_flags = [bool(x) for x in fold["pred_clip_flags"][idx].tolist()]
            row = {
                "target_season": year, "player_id_namespace": "gsis_id",
                "player_id": feature["player_id"], "position": position,
                "stable_key": feature["stable_key"], "status": "SCORED", "fallback_reason": None,
                "candidate_prediction": fstr(candidate),
                "primary_baseline_prediction": fstr(float(feature["values"][0])),
                "weighted_baseline_prediction": fstr(float(feature["values"][25])),
                "same_position_mean_baseline_prediction": fstr(earlier_mean),
                "feature_sha256": feature["feature_sha256"],
                "preprocessing_digest": prep["digest"], "model_digest": model_state["digest"],
                "raw_residual_prediction": fstr(raw_adj),
                "residual_center": fstr(float(fold["residual_center"])),
                "residual_robust_sigma": fstr(float(fold["robust_sigma"])),
                "residual_lower": fstr(float(fold["lower"])),
                "residual_upper": fstr(float(fold["upper"])),
                "bounded_residual_adjustment": fstr(bounded),
                "z_raw": z_raw, "z_model": z_model, "feature_clip_flags": clip_flags,
                "feature_clip_count": sum(1 for flag in clip_flags if flag),
            }
            if not (float(row["residual_lower"]) <= bounded <= float(row["residual_upper"])):
                raise ContractError("final adjustment violates residual bound")
            row["row_digest"] = sha256_bytes(canonical_bytes(row))
            predictions.append(row)

    predictions.sort(key=stable_key_sort); features.sort(key=stable_key_sort)
    keys = [stable_key(year, pid, pos) for pid, pos in members]
    artifact = {
        "schema_version": "wr097-v21-prediction-evidence-v1",
        "task_id": TASK_ID, "mode": "predict", "stage": stage, "target_season": year,
        "bindings": EXPECTED_BINDINGS,
        "ids": {"feature_schema": FEATURE_SCHEMA_ID, "preprocessing": PREP_ID,
                "candidate": CANDIDATE_ID, "target": TARGET_ID, "serializer": SERIALIZER_ID},
        "consumer_sha256": _consumer_sha(), "runtime": runtime,
        "target_values_accessed": False,
        "cohort_key_count": len(members), "cohort_key_sha256": sha256_bytes(canonical_bytes(keys)),
        "feature_rows": features, "preprocessing_states": prep_states, "model_states": model_states,
        "predictions": predictions, "fallback_count": fallback_count, "lineage_failures": 0,
    }
    state_payload = {"schema_version": "wr097-v21-prediction-state-v1", "artifact": artifact,
                     "artifact_sha256": sha256_bytes(canonical_bytes(artifact))}
    write_json(_prediction_state_path(state_dir, year), state_payload)
    suffix = str(year)
    publications = [
        _publication(output_dir, "RETURNING_PLAYER_V21_KEY_MANIFEST", {
            "schema_version":"wr097-v21-key-manifest-v1","target_season":year,"keys":keys,
            "key_count":len(keys),"key_sha256":sha256_bytes(canonical_bytes(keys))}, suffix),
        _publication(output_dir, "RETURNING_PLAYER_V21_FEATURE_SURFACE", {
            "schema_version":"wr097-v21-feature-surface-v1","target_season":year,
            "ordered_features":list(FEATURE_NAMES),"rows":features}, suffix),
        _publication(output_dir, "RETURNING_PLAYER_V21_PREPROCESSING_STATES", {
            "schema_version":"wr097-v21-preprocessing-states-v1","target_season":year,"states":prep_states}, suffix),
        _publication(output_dir, "RETURNING_PLAYER_V21_MODEL_STATES", {
            "schema_version":"wr097-v21-model-states-v1","target_season":year,"states":model_states}, suffix),
        _publication(output_dir, "RETURNING_PLAYER_V21_PREDICTIONS_PRE_OUTCOME", artifact, suffix),
        _publication(output_dir, "RETURNING_PLAYER_V21_ENVIRONMENT_LOCK", {
            "schema_version":"wr097-v21-environment-lock-v1","target_season":year,"runtime":runtime}, suffix),
    ]
    _finish(output_dir, "predict", {"stage":stage,"target_season":year,"target_values_accessed":False}, publications)

def _target_ingest(context: Mapping[str, Any], context_path: Path, state_dir: Path, locks_dir: Path, output_dir: Path) -> None:
    year = int(context["target_season"])
    stage = str(context["stage"])
    synthetic = bool(context.get("synthetic_fixture", False))
    _runtime_evidence(synthetic)
    expected_lock = str(context.get("prediction_lock_sha256", ""))
    _verify_prediction_lock(locks_dir, year, expected_lock)

    lock_map = context.get("prediction_locks", {})
    if not isinstance(lock_map, dict) or lock_map.get(str(year)) != expected_lock:
        raise ContractError("target-ingest lock map mismatch")
    for prior, digest in lock_map.items():
        _verify_prediction_lock(locks_dir, int(prior), str(digest))

    pred_state = read_json(_prediction_state_path(state_dir, year))
    artifact = pred_state.get("artifact")
    if not isinstance(artifact, dict) or artifact.get("target_season") != year or artifact.get("target_values_accessed") is not False:
        raise ContractError("prediction state mismatch")
    if pred_state.get("artifact_sha256") != sha256_bytes(canonical_bytes(artifact)):
        raise ContractError("prediction state digest mismatch")

    locked_prediction = read_json(locks_dir / f"prediction-{year}" / "files" / f".ai/research/generated/RETURNING_PLAYER_V21_PREDICTIONS_PRE_OUTCOME_{year}.json")
    if sha256_bytes(canonical_bytes(locked_prediction)) != pred_state.get("artifact_sha256"):
        raise ContractError("state/prediction-lock evidence mismatch")

    visible = _verify_visible_sources(context, context_path, "target-ingest")
    aggregates = _load_aggregates(visible)
    target_groups = aggregates.get(year, {})
    rows = []
    for prediction in artifact.get("predictions", []):
        player_id = str(prediction["player_id"])
        position = str(prediction["position"])
        status, target, games = _target_from_groups(target_groups, player_id, position)
        row = {
            "target_season": year, "player_id_namespace": "gsis_id", "player_id": player_id,
            "position": position, "stable_key": prediction["stable_key"],
            "prediction_status": prediction["status"], "target_status": status,
            "target_games": games, "target_ppr_pg": None if target is None else fstr(target),
            "candidate_prediction": prediction["candidate_prediction"],
            "primary_baseline_prediction": prediction["primary_baseline_prediction"],
            "weighted_baseline_prediction": prediction["weighted_baseline_prediction"],
            "same_position_mean_baseline_prediction": prediction["same_position_mean_baseline_prediction"],
            "prediction_row_digest": prediction.get("row_digest"),
            "prediction_lock_sha256": expected_lock,
        }
        if status == "OBSERVED":
            t = float(target)
            for name in ("candidate_prediction", "primary_baseline_prediction", "weighted_baseline_prediction", "same_position_mean_baseline_prediction"):
                if row[name] is None:
                    continue
                pred = float(row[name])
                row[name.replace("_prediction", "_abs_error")] = fstr(abs(pred - t))
        rows.append(row)
    rows.sort(key=stable_key_sort)
    evaluation = {
        "schema_version": "wr097-v21-target-evaluation-v1",
        "task_id": TASK_ID, "mode": "target-ingest", "stage": stage, "target_season": year,
        "bindings": EXPECTED_BINDINGS, "consumer_sha256": _consumer_sha(),
        "accepted_prediction_lock_sha256": expected_lock,
        "target_source_sha256": str(visible[year]["sha256"]),
        "rows": rows,
        "observed_count": sum(1 for x in rows if x["target_status"] == "OBSERVED"),
        "target_unavailable_count": sum(1 for x in rows if x["target_status"] != "OBSERVED"),
        "fallback_count": int(artifact.get("fallback_count", 0)),
        "lineage_failures": int(artifact.get("lineage_failures", 0)),
    }
    write_json(_evaluation_state_path(state_dir, year), {
        "schema_version": "wr097-v21-evaluation-state-v1",
        "evaluation": evaluation,
        "evaluation_sha256": sha256_bytes(canonical_bytes(evaluation)),
    })
    pub = _publication(output_dir, "RETURNING_PLAYER_V21_EVALUATIONS", evaluation, str(year))
    _finish(output_dir, "target-ingest", {
        "stage": stage, "target_season": year,
        "accepted_prediction_lock_sha256": expected_lock,
        "target_values_accessed": True,
    }, [pub])

def _observed_rows(state_dir: Path, years: Sequence[int]) -> list[dict[str, Any]]:
    rows = []
    for year in years:
        state = read_json(_evaluation_state_path(state_dir, year))
        ev = state.get("evaluation")
        if not isinstance(ev, dict) or state.get("evaluation_sha256") != sha256_bytes(canonical_bytes(ev)):
            raise ContractError("evaluation state digest mismatch")
        if int(ev.get("target_season", -1)) != year:
            raise ContractError("evaluation season mismatch")
        for row in ev.get("rows", []):
            if row.get("target_status") == "OBSERVED":
                values = [
                    row.get("target_ppr_pg"), row.get("candidate_prediction"),
                    row.get("primary_baseline_prediction"), row.get("weighted_baseline_prediction"),
                    row.get("same_position_mean_baseline_prediction"),
                ]
                if any(v is None or not math.isfinite(float(v)) for v in values):
                    raise ContractError("evaluable gate row incomplete")
                rows.append(dict(row))
    rows.sort(key=stable_key_sort)
    return rows

def _mae(rows: Sequence[Mapping[str, Any]], pred_field: str) -> float:
    if not rows:
        raise ContractError("zero evaluable rows")
    return math.fsum(abs(float(r[pred_field]) - float(r["target_ppr_pg"])) for r in rows) / len(rows)

def _rmse(rows: Sequence[Mapping[str, Any]], pred_field: str) -> float:
    if not rows:
        raise ContractError("zero evaluable rows")
    return math.sqrt(math.fsum((float(r[pred_field]) - float(r["target_ppr_pg"])) ** 2 for r in rows) / len(rows))

def _relative_improvement(candidate: float, baseline: float) -> float:
    if not math.isfinite(candidate) or not math.isfinite(baseline) or candidate < 0 or baseline < 0:
        raise ContractError("invalid relative gate input")
    if baseline == 0:
        if candidate == 0:
            return 0.0
        raise ContractError("zero baseline gate input")
    return (baseline - candidate) / baseline

def _relative_regression(candidate: float, baseline: float) -> float:
    if not math.isfinite(candidate) or not math.isfinite(baseline) or candidate < 0 or baseline < 0:
        raise ContractError("invalid relative gate input")
    if baseline == 0:
        if candidate == 0:
            return 0.0
        raise ContractError("zero baseline gate input")
    return (candidate - baseline) / baseline

def _average_ranks(values: Sequence[float]) -> list[float]:
    indexed = sorted(enumerate(values), key=lambda x: x[1])
    ranks = [0.0] * len(values)
    i = 0
    while i < len(indexed):
        j = i + 1
        while j < len(indexed) and indexed[j][1] == indexed[i][1]:
            j += 1
        rank = (i + 1 + j) / 2.0
        for k in range(i, j):
            ranks[indexed[k][0]] = rank
        i = j
    return ranks

def _spearman(rows: Sequence[Mapping[str, Any]], pred_field: str) -> float:
    if len(rows) < 2:
        raise ContractError("Spearman cell too small")
    x = [float(r[pred_field]) for r in rows]
    y = [float(r["target_ppr_pg"]) for r in rows]
    rx, ry = _average_ranks(x), _average_ranks(y)
    mx, my = math.fsum(rx) / len(rx), math.fsum(ry) / len(ry)
    num = math.fsum((a - mx) * (b - my) for a, b in zip(rx, ry))
    sx = math.fsum((a - mx) ** 2 for a in rx)
    sy = math.fsum((b - my) ** 2 for b in ry)
    den = math.sqrt(sx * sy)
    if den == 0 or not math.isfinite(den):
        raise ContractError("undefined Spearman")
    return num / den

def _descending_integer_ranks(rows: Sequence[Mapping[str, Any]], field: str) -> dict[tuple[str, str], int]:
    ordered = sorted(rows, key=lambda r: (-float(r[field]), str(r["player_id_namespace"]).encode("utf-8"), str(r["player_id"]).encode("utf-8")))
    return {(str(r["player_id_namespace"]), str(r["player_id"])): i + 1 for i, r in enumerate(ordered)}

def _rank_mae(rows: Sequence[Mapping[str, Any]], pred_field: str) -> float:
    pred = _descending_integer_ranks(rows, pred_field)
    target = _descending_integer_ranks(rows, "target_ppr_pg")
    return math.fsum(abs(pred[k] - target[k]) for k in pred) / len(rows)

def _weighted_ordering(rows: Sequence[Mapping[str, Any]], years: Sequence[int]) -> dict[str, float]:
    cells = []
    for year in years:
        for pos in POSITIONS:
            cell = [r for r in rows if int(r["target_season"]) == year and r["position"] == pos]
            if len(cell) < 8:
                continue
            cells.append((year, pos, len(cell), _spearman(cell, "candidate_prediction"),
                          _spearman(cell, "primary_baseline_prediction"),
                          _rank_mae(cell, "candidate_prediction"),
                          _rank_mae(cell, "primary_baseline_prediction")))
    if not cells:
        raise ContractError("no eligible ordering cells")
    total = math.fsum(c[2] for c in cells)
    return {
        "candidate_weighted_spearman": math.fsum(c[2] * c[3] for c in cells) / total,
        "primary_weighted_spearman": math.fsum(c[2] * c[4] for c in cells) / total,
        "candidate_weighted_rank_mae": math.fsum(c[2] * c[5] for c in cells) / total,
        "primary_weighted_rank_mae": math.fsum(c[2] * c[6] for c in cells) / total,
        "eligible_cell_count": len(cells),
    }

def _bootstrap_confirmation(rows: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    keys = sorted({(str(r["player_id_namespace"]), str(r["player_id"])) for r in rows},
                  key=lambda x: json.dumps([x[0], x[1]], separators=(",", ":"), ensure_ascii=False).encode("utf-8"))
    if len(keys) < 2:
        raise ContractError("bootstrap requires >=2 clusters")
    cluster_index = {k: i for i, k in enumerate(keys)}
    cluster_rows = [[] for _ in keys]
    for row in rows:
        cluster_rows[cluster_index[(str(row["player_id_namespace"]), str(row["player_id"]))]].append(row)
    cluster_serial = [[k[0], k[1]] for k in keys]
    cluster_sha = sha256_bytes(canonical_bytes(cluster_serial))
    rng = np.random.Generator(np.random.PCG64(72073))
    deltas = []
    K = len(keys)
    for _ in range(5000):
        draws = rng.integers(0, K, size=K, dtype=np.int64, endpoint=False)
        counts = np.bincount(draws, minlength=K)
        total_weight = 0
        cand_terms = []
        base_terms = []
        for idx, m in enumerate(counts.tolist()):
            if not m:
                continue
            for row in cluster_rows[idx]:
                total_weight += m
                cand_terms.append(m * abs(float(row["candidate_prediction"]) - float(row["target_ppr_pg"])))
                base_terms.append(m * abs(float(row["primary_baseline_prediction"]) - float(row["target_ppr_pg"])))
        if total_weight <= 0:
            raise ContractError("bootstrap zero rows")
        delta = math.fsum(cand_terms) / total_weight - math.fsum(base_terms) / total_weight
        if not math.isfinite(delta):
            raise ContractError("bootstrap nonfinite")
        deltas.append(float(delta))
    array = np.asarray(deltas, dtype=np.float64)
    q025, q975 = np.quantile(array, [0.025, 0.975], method="linear").tolist()
    encoded = [fstr(x) for x in deltas]
    replicate_sha = sha256_bytes(canonical_bytes(encoded))
    state_sha = sha256_bytes(canonical_bytes(rng.bit_generator.state))
    return {
        "replicates": 5000, "seed": 72073, "cluster_count": K,
        "cluster_sha256": cluster_sha, "replicate_sha256": replicate_sha,
        "rng_state_sha256": state_sha, "q025": fstr(float(q025)), "q975": fstr(float(q975)),
        "gate_pass": float(q975) <= 0.0,
    }

def _tail_diagnostics(rows: Sequence[Mapping[str, Any]], pred_field: str) -> dict[str, str]:
    errors = np.asarray([abs(float(r[pred_field]) - float(r["target_ppr_pg"])) for r in rows], dtype=np.float64)
    if errors.size == 0 or not np.isfinite(errors).all():
        raise ContractError("tail diagnostics unavailable")
    squared = errors ** 2
    total = float(np.sum(squared))
    ordered = np.sort(squared)[::-1]
    def share(frac: float) -> float:
        if total == 0.0:
            return 0.0
        count = max(1, int(math.ceil(len(ordered) * frac)))
        return float(np.sum(ordered[:count]) / total)
    return {
        "absolute_error_p90": fstr(float(np.quantile(errors, 0.90, method="linear"))),
        "absolute_error_p95": fstr(float(np.quantile(errors, 0.95, method="linear"))),
        "absolute_error_p99": fstr(float(np.quantile(errors, 0.99, method="linear"))),
        "maximum_absolute_error": fstr(float(np.max(errors))),
        "top_1pct_sse_share": fstr(share(0.01)),
        "top_5pct_sse_share": fstr(share(0.05)),
    }

def _gate_metrics(state_dir: Path, stage: str) -> tuple[dict[str, Any], bool]:
    years = STAGE_YEARS[stage]
    rows = _observed_rows(state_dir, years)
    pooled_candidate_mae = _mae(rows, "candidate_prediction")
    pooled_primary_mae = _mae(rows, "primary_baseline_prediction")
    pooled_candidate_rmse = _rmse(rows, "candidate_prediction")
    pooled_primary_rmse = _rmse(rows, "primary_baseline_prediction")
    mae_lift = _relative_improvement(pooled_candidate_mae, pooled_primary_mae)
    rmse_reg = _relative_regression(pooled_candidate_rmse, pooled_primary_rmse)

    pos_metrics = {}
    eligible_pos_regs = []
    nonworse = 0
    min_rows = None
    for pos in POSITIONS:
        group = [r for r in rows if r["position"] == pos]
        n = len(group)
        min_rows = n if min_rows is None else min(min_rows, n)
        if n >= 30:
            c, b = _mae(group, "candidate_prediction"), _mae(group, "primary_baseline_prediction")
            reg = _relative_regression(c, b)
            eligible_pos_regs.append(reg)
            if c <= b:
                nonworse += 1
            pos_metrics[pos] = {"n": n, "candidate_mae": fstr(c), "primary_mae": fstr(b), "regression": fstr(reg)}
        else:
            pos_metrics[pos] = {"n": n, "excluded_lt30": True}
    if not eligible_pos_regs:
        raise ContractError("no position eligible for regression gate")
    max_pos_reg = max(eligible_pos_regs)

    season_deltas = []
    season_regs = []
    season_metrics = {}
    for year in years:
        group = [r for r in rows if int(r["target_season"]) == year]
        if not group:
            raise ContractError("declared season has zero evaluable rows")
        c, b = _mae(group, "candidate_prediction"), _mae(group, "primary_baseline_prediction")
        delta, reg = c - b, _relative_regression(c, b)
        season_deltas.append(delta)
        season_regs.append(reg)
        season_metrics[str(year)] = {"n": len(group), "candidate_mae": fstr(c), "primary_mae": fstr(b), "delta": fstr(delta), "regression": fstr(reg)}
    mean_season_delta = math.fsum(season_deltas) / len(season_deltas)
    max_season_reg = max(season_regs)

    fallback_count = 0
    lineage_failures = 0
    for year in years:
        state = read_json(_evaluation_state_path(state_dir, year))["evaluation"]
        fallback_count += int(state.get("fallback_count", 0))
        lineage_failures += int(state.get("lineage_failures", 0))

    metrics = {
        "row_count": len(rows),
        "pooled": {
            "candidate_mae": fstr(pooled_candidate_mae), "primary_mae": fstr(pooled_primary_mae),
            "candidate_rmse": fstr(pooled_candidate_rmse), "primary_rmse": fstr(pooled_primary_rmse),
            "mae_lift": fstr(mae_lift), "rmse_regression": fstr(rmse_reg),
        },
        "position": pos_metrics, "position_mae_regression_ge30": fstr(max_pos_reg),
        "positions_nonworse_mae": nonworse, "min_rows_each_position": int(min_rows or 0),
        "season": season_metrics, "mean_season_mae_delta": fstr(mean_season_delta),
        "max_season_mae_regression": fstr(max_season_reg),
        "fallbacks": fallback_count, "lineage_failures": lineage_failures,
    }

    metrics["tail_diagnostics"] = {
        "candidate": _tail_diagnostics(rows, "candidate_prediction"),
        "primary_baseline": _tail_diagnostics(rows, "primary_baseline_prediction"),
    }
    ordering = _weighted_ordering(rows, years)
    spearman_delta = ordering["candidate_weighted_spearman"] - ordering["primary_weighted_spearman"]
    rank_reg = _relative_regression(ordering["candidate_weighted_rank_mae"], ordering["primary_weighted_rank_mae"])
    metrics["ordering"] = {**{k: fstr(v) if isinstance(v, float) else v for k, v in ordering.items()},
                           "weighted_spearman_delta": fstr(spearman_delta),
                           "weighted_rank_mae_regression": fstr(rank_reg)}
    if stage == "validation":
        gate = (
            mae_lift >= 0.005 and rmse_reg <= 0.01 and spearman_delta >= -0.01
            and rank_reg <= 0.02 and max_pos_reg <= 0.05 and max_season_reg <= 0.05
            and fallback_count == 0 and lineage_failures == 0
        )
    else:
        same_rows = rows
        secondary = {}
        for field, name in (
            ("weighted_baseline_prediction", "weighted_ppr_pg"),
            ("same_position_mean_baseline_prediction", "same_position_earlier_observed_target_mean"),
        ):
            c = _mae(same_rows, "candidate_prediction")
            b = _mae(same_rows, field)
            secondary[name] = {
                "candidate_mae": fstr(c), "baseline_mae": fstr(b),
                "regression": fstr(_relative_regression(c, b)),
            }
        max_secondary = max(float(v["regression"]) for v in secondary.values())
        bootstrap = _bootstrap_confirmation(rows)
        metrics["secondary"] = secondary
        metrics["bootstrap"] = bootstrap
        gate = (
            mae_lift >= 0.005 and bootstrap["gate_pass"] is True and max_pos_reg <= 0.05
            and nonworse >= 3 and mean_season_delta <= 0 and max_season_reg <= 0.05
            and spearman_delta >= -0.01 and rank_reg <= 0.02 and int(min_rows or 0) >= 30
            and fallback_count == 0 and lineage_failures == 0 and max_secondary <= 0.01
        )
    return metrics, bool(gate)

def _stage_gate(context: Mapping[str, Any], context_path: Path, state_dir: Path, locks_dir: Path, output_dir: Path) -> None:
    stage = str(context["stage"])
    synthetic = bool(context.get("synthetic_fixture", False))
    _runtime_evidence(synthetic)
    _verify_visible_sources(context, context_path, "stage-gate")
    years = STAGE_YEARS[stage]

    prediction_locks = context.get("prediction_locks", {})
    if not isinstance(prediction_locks, dict):
        raise ContractError("prediction lock map malformed")
    stage_locks = {}
    for year in years:
        expected = prediction_locks.get(str(year))
        if not isinstance(expected, str):
            raise ContractError("stage prediction lock missing")
        _verify_prediction_lock(locks_dir, year, expected)
        stage_locks[str(year)] = expected
    lock_set = sha256_bytes(canonical_bytes({k: v for k, v in sorted(stage_locks.items())}))
    if context.get("prediction_lock_set_sha256") != lock_set:
        raise ContractError("prediction lock set mismatch")

    prior_gate_locks = context.get("prior_gate_locks", {})
    if not isinstance(prior_gate_locks, dict):
        raise ContractError("prior gate locks malformed")
    expected_prior = [] if stage == "validation" else ["validation"]
    if set(prior_gate_locks) != set(expected_prior):
        raise ContractError("prior gate lock set mismatch")
    for prior in expected_prior:
        bridge = _verify_gate_lock(locks_dir, prior, str(prior_gate_locks[prior]))
        if bridge.get("gate_pass") is not True:
            raise ContractError("prior stage gate failed")

    metrics, gate_pass = _gate_metrics(state_dir, stage)
    status_label = (
        "EXPECTED_PERFORMANCE_MODEL_SUPPORTED_FOR_INDEPENDENT_RESULT_AUDIT_ONLY"
        if stage == "confirmation" and gate_pass
        else ("BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE" if not gate_pass else "STAGE_PASS")
    )
    artifact = {
        "schema_version": "wr097-v21-stage-gate-evidence-v1",
        "task_id": TASK_ID, "mode": "stage-gate", "stage": stage,
        "target_seasons": list(years), "bindings": EXPECTED_BINDINGS,
        "consumer_sha256": _consumer_sha(), "prediction_lock_set_sha256": lock_set,
        "prior_gate_locks": dict(prior_gate_locks), "metrics": metrics,
        "gate_pass": gate_pass, "status_label": status_label,
    }
    write_json(_gate_state_path(state_dir, stage), {
        "schema_version": "wr097-v21-gate-state-v1",
        "artifact": artifact, "artifact_sha256": sha256_bytes(canonical_bytes(artifact)),
    })
    pub = _publication(output_dir, "RETURNING_PLAYER_V21_STAGE_GATES", artifact, stage.upper())
    _finish(output_dir, "stage-gate", {
        "stage": stage, "gate_pass": gate_pass, "prediction_lock_set_sha256": lock_set,
    }, [pub])

def _readiness(context: Mapping[str, Any], output_dir: Path) -> None:
    assert_no_provider_authority(os.environ)
    payload = {
        "schema_version":"wr097-v21-readiness-v1","task_id":TASK_ID,
        "protocol_id":PROTOCOL_ID,"protocol_sha256":PROTOCOL_SHA256,
        "ordered_feature_count":len(FEATURE_NAMES),"ordered_features":list(FEATURE_NAMES),
        "provider_credentials_present":False,"retained_rows_parsed":False,
        "historical_targets_exposed":False,"model_fit":False,"predictions_emitted":False,
    }
    _finish(output_dir,"readiness",payload,[])

def run(argv: Sequence[str]) -> int:
    try:
        warnings.filterwarnings("error")
        assert_no_provider_authority(os.environ)
        args = parse_cli(argv)
        mode = args["--wr097-mode"]
        context_path = Path(args["--wr097-context"]).resolve()
        state_dir = Path(args["--wr097-state-dir"]).resolve()
        locks_dir = Path(args["--wr097-lock-dir"]).resolve()
        output_dir = Path(args["--wr097-output-dir"]).resolve()
        for directory in (state_dir, locks_dir, output_dir):
            if not directory.is_dir():
                raise ContractError("required WR-097 directory absent")
        context = _validate_context(mode, context_path)
        if mode == "readiness":
            _readiness(context, output_dir)
        elif mode == "predict":
            _predict(context, context_path, state_dir, locks_dir, output_dir)
        elif mode == "target-ingest":
            _target_ingest(context, context_path, state_dir, locks_dir, output_dir)
        else:
            _stage_gate(context, context_path, state_dir, locks_dir, output_dir)
        return 0
    except BaseException:
        return 2

if __name__ == "__main__":
    raise SystemExit(run(sys.argv[1:]))
