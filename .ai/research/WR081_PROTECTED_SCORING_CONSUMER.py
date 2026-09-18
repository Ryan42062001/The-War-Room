#!/usr/bin/env python3
"""WR-081 protected historical scoring consumer.

Stage-A prepared consumer for the audited WR-083 bridge.  The program is intentionally
silent: success and failure are communicated only by exit code and bridge/output files.

Protected execution modes:
  predict       - prior seasons only; fit frozen rolling per-position models and lock predictions.
  target-ingest - target season only; bind an immutable prediction lock before reading targets.
  stage-gate    - no retained inputs; compute the frozen WR-072 stage gates from state.

No provider credentials, repository paths, network calls, or retained-source retrieval live here.
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

TASK_ID = "WR-081"
SCHEMA = "wr081-protected-scoring-consumer-v1"
BRIDGE_SCHEMA = "wr083-consumer-result-v1"

SOURCE_SNAPSHOT_ID = "wr-returning-player-v2-source-snapshot/1.2.0-wr059"
SOURCE_SNAPSHOT_SHA256 = "6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea"
COHORT_ID = "returning-player-v2-cohort/1.2.0-wr059"
COHORT_SHA256 = "f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4"
PROTOCOL_ID = "returning-player-v2-model-protocol/1.2.0-wr072"
PROTOCOL_SHA256 = "aed044e6b7df9684153181a7a97a47a86c50ce9049db063ecdd8a973b1a832b6"
GATES_ID = "returning-player-v2-result-gates/1.2.0-wr072"
FEATURE_SCHEMA_ID = "returning-player-v2-feature-schema/1.0.0-wr072"
PREP_ID = "returning-player-v2-preprocessing/1.0.0-wr072"
CANDIDATE_ID = "returning-player-v2-ridge-stats-only-a100/1.0.0-wr072"
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
    "development": (2018, 2019),
    "validation": (2020, 2021),
    "confirmation": (2022, 2023, 2024, 2025),
}
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
        "--wr083-mode", "--wr083-context", "--wr083-state-dir",
        "--wr083-lock-dir", "--wr083-output-dir",
    }
    if len(argv) != 10:
        raise ContractError("exact WR-083 CLI required")
    out: dict[str, str] = {}
    for i in range(0, len(argv), 2):
        flag, value = argv[i], argv[i + 1]
        if flag not in expected or flag in out or not value:
            raise ContractError("invalid WR-083 CLI")
        out[flag] = value
    if set(out) != expected or out["--wr083-mode"] not in {"predict", "target-ingest", "stage-gate"}:
        raise ContractError("invalid WR-083 mode")
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
        "stage_a_synthetic_fixture": synthetic,
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
        raise ContractError("accepted WR-059/WR-072 bindings mismatch")

def _validate_context(mode: str, context_path: Path) -> dict[str, Any]:
    context = read_json(context_path)
    if not isinstance(context, dict) or context.get("task_id") != TASK_ID or context.get("mode") != mode:
        raise ContractError("context identity mismatch")
    _validate_bindings(context.get("bindings"))
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

