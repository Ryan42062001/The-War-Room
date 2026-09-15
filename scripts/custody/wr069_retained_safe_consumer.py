#!/usr/bin/env python3
"""WR-069 read-only retained-evidence bridge and deterministic safe consumer."""
from __future__ import annotations

import argparse
import base64
import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping, Sequence

CONTRACT_ID = "wr-returning-player-v2-csv-schema-inference-addendum"
CONTRACT_VERSION = "1.0.0"
CONTRACT_SHA256 = "48d4ace7375a59ab28ad79b2777bd7de4a9c4871cea49e83447371131f60dddb"
CORPUS_SHA256 = "1f70d5e31ed5a62e00e5b02e06f6271e9c30b36951389d9607c50fdf5f71ffe1"
WR042_MANIFEST_COMMIT = "cc9005ae4bd9065cf80f1c184f31974904165c54"
WR042_MANIFEST_PATH = ".ai/research/generated/WR042_SOURCE_CUSTODY_MANIFEST.json"
WR042_MANIFEST_SHA256 = "d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26"

STATS_APPROVED_COLUMNS = (
    "player_id", "player_name", "player_display_name", "position", "season", "season_type",
    "games", "fantasy_points_ppr", "attempts", "carries", "targets", "receptions",
    "passing_yards", "passing_tds", "passing_interceptions", "rushing_yards", "rushing_tds",
    "receiving_yards", "receiving_tds", "passing_epa", "rushing_epa", "receiving_epa",
    "target_share", "air_yards_share", "wopr",
)
# WR-039 permits a minimal Players-metadata view. Stable external IDs such as mfl_id
# are not required-presence columns; historical lineage explicitly treats them as
# optional when present. Raw-schema evidence still covers every retained column.
PLAYERS_REQUIRED_APPROVED_COLUMNS = ("gsis_id", "birth_date", "rookie_season")
PLAYERS_OPTIONAL_APPROVED_COLUMNS = ("display_name",)
PLAYERS_APPROVED_COLUMN_ORDER = (
    "gsis_id", "display_name", "birth_date", "rookie_season",
)
APPROVED_VIEW_COUNTS = {
    2012: 417, 2013: 410, 2014: 412, 2015: 423, 2016: 423, 2017: 419,
    2018: 444, 2019: 437, 2020: 435, 2021: 475, 2022: 446, 2023: 421,
    2024: 431, 2025: 444,
}
HISTORICAL_INVENTORY_TARGETS = {2013: 2014, 2014: 2015, 2015: 2016, 2016: 2017}
EXPECTED_SOURCES = (
    ("nflverse-player-summary-2012", "NFLVERSE_PLAYER_SUMMARY_STATS", 512980777, "stats_player_regpost_2012.csv", 2012, "18d0d3ccbac3ba5489098629b74d58074b5297c8cf2c5de4ec06f809f2dffafc", 801261),
    ("nflverse-player-summary-2013", "NFLVERSE_PLAYER_SUMMARY_STATS", 512983282, "stats_player_regpost_2013.csv", 2013, "dbc7804c32c8dbf46120bfe4e724cdd926537509caa8a1bb96cd3b6e159b21f8", 792070),
    ("nflverse-player-summary-2014", "NFLVERSE_PLAYER_SUMMARY_STATS", 512985320, "stats_player_regpost_2014.csv", 2014, "7046a0fd69b979d0649feb679a42f82f6e8e175d19587857d3e9371f09427cd6", 816553),
    ("nflverse-player-summary-2015", "NFLVERSE_PLAYER_SUMMARY_STATS", 512984105, "stats_player_regpost_2015.csv", 2015, "b977be5bc8cad6b02dfb755e78974b4486a505fa272f683add499b968878e3eb", 815021),
    ("nflverse-player-summary-2016", "NFLVERSE_PLAYER_SUMMARY_STATS", 512985505, "stats_player_regpost_2016.csv", 2016, "041473e5860ca6cfcba7a29e98b2ddfc3f01db0df2469d5b44e44135603e2424", 819194),
    ("nflverse-player-summary-2017", "NFLVERSE_PLAYER_SUMMARY_STATS", 513235924, "stats_player_regpost_2017.csv", 2017, "88b85ba1a722f9a1cdc25612bdc96a82c8d81b8f2762713f253db4e787a2811b", 824571),
    ("nflverse-player-summary-2018", "NFLVERSE_PLAYER_SUMMARY_STATS", 513236180, "stats_player_regpost_2018.csv", 2018, "85b55c0455d2afbd09fe7c8bcab31bc16ba2866fff45abec4fadc6b22c15fc4c", 833179),
    ("nflverse-player-summary-2019", "NFLVERSE_PLAYER_SUMMARY_STATS", 513237022, "stats_player_regpost_2019.csv", 2019, "a5b50ae01b39c4233533a4934e6d0185c256eaa5e2154eab26fa6da3b71f94f6", 833756),
    ("nflverse-player-summary-2020", "NFLVERSE_PLAYER_SUMMARY_STATS", 530454674, "stats_player_regpost_2020.csv", 2020, "512eaf469550988ed77077e8a1cc4bd0f612bca6c3a62e2f8c945f556862633a", 878088),
    ("nflverse-player-summary-2021", "NFLVERSE_PLAYER_SUMMARY_STATS", 513240014, "stats_player_regpost_2021.csv", 2021, "22aa2fb78a3a0e977bbf1dd3613163a69c4298b1daf113ecf3e30cfd319f1eff", 917490),
    ("nflverse-player-summary-2022", "NFLVERSE_PLAYER_SUMMARY_STATS", 513240325, "stats_player_regpost_2022.csv", 2022, "6f56613e8d3b8531ddf3d00963442c6a0577428b53bcc7688f63b5492beef5eb", 882918),
    ("nflverse-player-summary-2023", "NFLVERSE_PLAYER_SUMMARY_STATS", 513240669, "stats_player_regpost_2023.csv", 2023, "b55110bdda4b1cb9c4f115991f5c5838824826cd76cfe4c60721af42ed4db766", 855110),
    ("nflverse-player-summary-2024", "NFLVERSE_PLAYER_SUMMARY_STATS", 513241318, "stats_player_regpost_2024.csv", 2024, "e12c0dd3877e70bd18460f7b03afe83ae0e60aa6aba0c141e6fff9699de7ccb3", 877377),
    ("nflverse-player-summary-2025", "NFLVERSE_PLAYER_SUMMARY_STATS", 513244170, "stats_player_regpost_2025.csv", 2025, "a4cd28b5209608d87967c4e0db9720fc617c3f9aafe0a3a097461586ea90fd6d", 888037),
    ("nflverse-players-metadata-20260914", "NFLVERSE_PLAYERS_METADATA_MINIMAL", 563580371, "players.csv", None, "03a823a0e2344aff9a4ef67bdd62005d3e1d7ab62a98c790ce19a8a557d1c221", 7260242),
)
PROVIDER_AWS_ENV = frozenset({
    "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "AWS_SECURITY_TOKEN",
    "AWS_ENDPOINT_URL", "AWS_ENDPOINT_URL_S3", "AWS_PROFILE", "AWS_SHARED_CREDENTIALS_FILE",
})


class ContractError(RuntimeError):
    pass


class CsvFatal(ContractError):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


@dataclass(frozen=True)
class Field:
    text: str
    quoted: bool


@dataclass(frozen=True)
class SchemaResult:
    physical_row_count: int
    ordered_schema: list[list[object]]
    schema_sha256: str
    headers: list[str]
    rows: list[list[Field]]


def expected_source_dicts() -> list[dict]:
    return [
        {"source_id": source_id, "source_class": source_class, "asset_id": asset_id,
         "filename": filename, "season": season, "expected_sha256": sha256,
         "expected_size_bytes": size, "custody_key": f"custody/sha256/{sha256}/raw"}
        for source_id, source_class, asset_id, filename, season, sha256, size in EXPECTED_SOURCES
    ]


def validate_static_allowlist(sources: Sequence[Mapping[str, object]]) -> None:
    expected = expected_source_dicts()
    normalized = [{key: source.get(key) for key in expected[0]} for source in sources]
    if normalized != expected:
        raise ContractError("source request does not exactly equal the 15 executed WR-042 identities")
    if len(normalized) != 15 or len({x["expected_sha256"] for x in normalized}) != 15:
        raise ContractError("WR-069 requires exactly 15 unique retained identities")
    if any(x["filename"] == "draft_picks.csv" for x in normalized):
        raise ContractError("draft_picks.csv is excluded")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> tuple[str, int]:
    digest = hashlib.sha256(); size = 0
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk); size += len(chunk)
    return digest.hexdigest(), size


def require_child_of_runner_temp(path: Path, env: Mapping[str, str] = os.environ) -> Path:
    raw = env.get("RUNNER_TEMP")
    if not raw:
        raise ContractError("RUNNER_TEMP is required")
    root = Path(raw).resolve(); target = path.resolve()
    if target == root or root not in target.parents:
        raise ContractError("path must be a child of RUNNER_TEMP")
    return target


def write_canonical_json(path: Path, value: object) -> str:
    data = (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")
    path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(data)
    return sha256_bytes(data)


def write_sidecar(path: Path, digest: str, target_name: str) -> None:
    path.write_text(f"{digest}  {target_name}\n", encoding="utf-8")


def verify_sidecar(path: Path, target: Path) -> str:
    digest, _ = sha256_file(target)
    if path.read_text(encoding="utf-8") != f"{digest}  {target.name}\n":
        raise ContractError("local manifest sidecar mismatch")
    return digest


def load_historical_manifest(repo_root: Path) -> list[dict]:
    result = subprocess.run(
        ["git", "show", f"{WR042_MANIFEST_COMMIT}:{WR042_MANIFEST_PATH}"], cwd=repo_root,
        stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=False,
    )
    if result.returncode:
        raise ContractError("exact historical WR-042 manifest Git object is unavailable")
    if sha256_bytes(result.stdout) != WR042_MANIFEST_SHA256:
        raise ContractError("historical WR-042 manifest digest mismatch")
    try:
        payload = json.loads(result.stdout.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ContractError("historical WR-042 manifest is invalid") from exc
    sources = payload.get("sources")
    if not isinstance(sources, list):
        raise ContractError("historical WR-042 manifest lacks sources")
    canonical = [{
        "source_id": item.get("source_id"), "source_class": item.get("source_class"),
        "asset_id": item.get("asset_id"), "filename": item.get("filename"), "season": item.get("season"),
        "expected_sha256": item.get("expected_sha256"), "expected_size_bytes": item.get("expected_size_bytes"),
        "custody_key": f"custody/sha256/{item.get('expected_sha256')}/raw",
    } for item in sources]
    validate_static_allowlist(canonical)
    return canonical


def json_string_exact(text: str) -> str:
    pieces = ['"']
    for ch in text:
        code = ord(ch)
        if ch == '"': pieces.append('\\"')
        elif ch == "\\": pieces.append("\\\\")
        elif code <= 0x1F: pieces.append(f"\\u{code:04x}")
        else: pieces.append(ch)
    pieces.append('"')
    return "".join(pieces)


def canonical_schema_bytes(schema: Sequence[Sequence[object]]) -> bytes:
    cols = [
        "[" + json_string_exact(str(column)) + "," + json_string_exact(str(type_label)) + "," + ("true" if nullable else "false") + "]"
        for column, type_label, nullable in schema
    ]
    return (
        '{"schema_contract_id":"' + CONTRACT_ID + '","schema_contract_version":"' + CONTRACT_VERSION + '","columns":['
        + ",".join(cols) + "]}"
    ).encode("utf-8")


def _terminator(text: str, index: int) -> tuple[bool, int]:
    ch = text[index]
    if ch == "\n": return True, 1
    if ch == "\r":
        if index + 1 < len(text) and text[index + 1] == "\n": return True, 2
        raise CsvFatal("CSV_INVALID_LINE_ENDING")
    return False, 0


def tokenize_csv(data: bytes) -> list[list[Field]]:
    if data.startswith(b"\xef\xbb\xbf"):
        data = data[3:]
    elif any(data.startswith(prefix) for prefix in (b"\xff\xfe", b"\xfe\xff", b"\x00\x00\xfe\xff", b"\xff\xfe\x00\x00")):
        raise CsvFatal("CSV_UNSUPPORTED_BOM")
    try:
        text = data.decode("utf-8", errors="strict")
    except UnicodeDecodeError as exc:
        raise CsvFatal("CSV_INVALID_UTF8") from exc
    records: list[list[Field]] = []; row: list[Field] = []; buf: list[str] = []
    state = "FIELD_START"; i = 0; just_delimiter = False

    def emit_field(quoted: bool) -> None:
        nonlocal buf
        row.append(Field("".join(buf), quoted)); buf = []

    def emit_record() -> None:
        nonlocal row
        records.append(row); row = []

    while i < len(text):
        ch = text[i]
        if state == "QUOTED":
            if ch == '"':
                if i + 1 < len(text) and text[i + 1] == '"':
                    buf.append('"'); i += 2; continue
                state = "AFTER_QUOTE"; i += 1; continue
            buf.append(ch); i += 1; continue
        is_term, term_len = _terminator(text, i)
        if state == "FIELD_START":
            if is_term:
                row.append(Field("", False)); emit_record(); i += term_len; just_delimiter = False; continue
            if ch == ',':
                row.append(Field("", False)); i += 1; just_delimiter = True; continue
            if ch == '"':
                state = "QUOTED"; buf = []; i += 1; just_delimiter = False; continue
            buf = [ch]; state = "UNQUOTED"; i += 1; just_delimiter = False; continue
        if state == "UNQUOTED":
            if is_term:
                emit_field(False); emit_record(); state = "FIELD_START"; i += term_len; just_delimiter = False; continue
            if ch == ',':
                emit_field(False); state = "FIELD_START"; i += 1; just_delimiter = True; continue
            if ch == '"': raise CsvFatal("CSV_MALFORMED_QUOTING")
            buf.append(ch); i += 1; continue
        if state == "AFTER_QUOTE":
            if is_term:
                emit_field(True); emit_record(); state = "FIELD_START"; i += term_len; just_delimiter = False; continue
            if ch == ',':
                emit_field(True); state = "FIELD_START"; i += 1; just_delimiter = True; continue
            raise CsvFatal("CSV_MALFORMED_QUOTING")
        raise ContractError("unknown CSV state")
    if state == "QUOTED": raise CsvFatal("CSV_MALFORMED_QUOTING")
    if state == "UNQUOTED": emit_field(False); emit_record()
    elif state == "AFTER_QUOTE": emit_field(True); emit_record()
    elif state == "FIELD_START" and just_delimiter:
        row.append(Field("", False)); emit_record()
    elif state == "FIELD_START" and row:
        raise ContractError("unexpected unterminated row state")
    return records


INT_RE = re.compile(r"^-?(?:0|[1-9][0-9]*)$")
DEC_RE = re.compile(r"^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$")
INT64_MIN = -(2**63); INT64_MAX = 2**63 - 1


def classify_non_null(text: str) -> str:
    if text in ("true", "false"): return "boolean"
    if INT_RE.fullmatch(text):
        value = int(text)
        return "int64" if INT64_MIN <= value <= INT64_MAX else "decimal"
    if DEC_RE.fullmatch(text) and ("." in text or "e" in text or "E" in text): return "decimal"
    return "utf8"


def promote(current: str | None, observed: str) -> str:
    if current is None or current == observed: return observed
    if "utf8" in (current, observed): return "utf8"
    if {current, observed} == {"int64", "decimal"}: return "decimal"
    return "utf8"


def derive_schema(data: bytes) -> SchemaResult:
    records = tokenize_csv(data)
    if not records: raise CsvFatal("CSV_MISSING_HEADER")
    headers = [field.text for field in records[0]]
    if any(name == "" for name in headers): raise CsvFatal("CSV_BLANK_HEADER")
    if len(set(headers)) != len(headers): raise CsvFatal("CSV_DUPLICATE_HEADER")
    rows = records[1:]; width = len(headers)
    if any(len(row) != width for row in rows): raise CsvFatal("CSV_ROW_WIDTH_MISMATCH")
    types: list[str | None] = [None] * width; nullable = [False] * width
    for row in rows:
        for index, field in enumerate(row):
            if not field.quoted and field.text == "":
                nullable[index] = True; continue
            types[index] = promote(types[index], classify_non_null(field.text))
    schema = [[name, types[i] or "utf8", nullable[i]] for i, name in enumerate(headers)]
    return SchemaResult(len(rows), schema, sha256_bytes(canonical_schema_bytes(schema)), headers, rows)


def verify_contract_and_corpus(contract_path: Path, corpus_path: Path) -> dict:
    contract_bytes = contract_path.read_bytes(); corpus_bytes = corpus_path.read_bytes()
    if sha256_bytes(contract_bytes) != CONTRACT_SHA256: raise ContractError("accepted WR-067 machine-lock digest mismatch")
    if sha256_bytes(corpus_bytes) != CORPUS_SHA256: raise ContractError("accepted WR-067 conformance-corpus digest mismatch")
    try:
        contract = json.loads(contract_bytes); corpus = json.loads(corpus_bytes)
    except json.JSONDecodeError as exc: raise ContractError("accepted WR-067 JSON is invalid") from exc
    if contract.get("contract_id") != CONTRACT_ID or contract.get("contract_version") != CONTRACT_VERSION:
        raise ContractError("accepted WR-067 contract identity mismatch")
    if corpus.get("contract_id") != CONTRACT_ID or corpus.get("contract_version") != CONTRACT_VERSION:
        raise ContractError("accepted WR-067 corpus identity mismatch")
    if (corpus.get("case_count"), corpus.get("pass_case_count"), corpus.get("fatal_case_count")) != (49, 33, 16):
        raise ContractError("accepted WR-067 corpus counts mismatch")
    return corpus


def run_conformance(contract_path: Path, corpus_path: Path) -> dict:
    corpus = verify_contract_and_corpus(contract_path, corpus_path); mismatches = []; passed = fatal = 0
    for case in corpus["cases"]:
        case_id, encoded, outcome, *expected = case; raw = base64.b64decode(encoded, validate=True)
        try:
            result = derive_schema(raw); actual = [result.physical_row_count, result.ordered_schema, result.schema_sha256]
            if outcome != "PASS" or actual != expected: mismatches.append(case_id)
            else: passed += 1
        except CsvFatal as exc:
            if outcome != "FATAL" or expected != [exc.code]: mismatches.append(case_id)
            else: fatal += 1
    if mismatches: raise ContractError("WR-067 conformance mismatch: " + ",".join(mismatches))
    if (passed, fatal) != (33, 16): raise ContractError("WR-067 conformance totals mismatch")
    return {"status": "PASS", "case_count": 49, "pass_cases": 33, "fatal_cases": 16, "mismatches": 0}


def provider_env_present(env: Mapping[str, str]) -> list[str]:
    return sorted(name for name in env if name.startswith("WR_CUSTODY_") or name in PROVIDER_AWS_ENV)


def assert_consumer_isolation(env: Mapping[str, str] = os.environ) -> None:
    present = provider_env_present(env)
    if present: raise ContractError("provider authority present in consumer environment: " + ",".join(present))


def load_read_module(repo_root: Path):
    path = repo_root / "scripts/custody/read_retained_versions.py"
    spec = importlib.util.spec_from_file_location("wr063_read_only", path)
    if not spec or not spec.loader: raise ContractError("accepted WR-063 read-only implementation unavailable")
    module = importlib.util.module_from_spec(spec); sys.modules[spec.name] = module; spec.loader.exec_module(module)
    return module


def candidate_upload_versions(versions: Sequence[Mapping[str, object]], source: Mapping[str, object]) -> list[Mapping[str, object]]:
    """Return exact-key immutable upload candidates compatible with authority metadata.

    The accepted WR-063 exact-key lister already rejects non-exact names. Provider
    metadata digests, when present, are rejection gates only; downloaded bytes are
    always independently hashed before a version is admitted.
    """
    expected_size = int(source["expected_size_bytes"])
    expected_sha = str(source["expected_sha256"])
    ordered = sorted(versions, key=lambda value: int(value.get("uploadTimestamp", -1)), reverse=True)
    candidates: list[Mapping[str, object]] = []
    for value in ordered:
        if value.get("action") != "upload" or not value.get("fileId"):
            continue
        size = value.get("contentLength", value.get("size"))
        if int(size or -1) != expected_size:
            continue
        info = value.get("fileInfo") or {}
        metadata_digest = info.get("wr-sha256") or info.get("sha256")
        if metadata_digest not in (None, expected_sha):
            continue
        candidates.append(value)
    return candidates


def retrieve_authoritative_b2(read, auth: Mapping[str, str], source: Mapping[str, object], destination: Path,
                              versions: Sequence[Mapping[str, object]]) -> dict:
    candidates = candidate_upload_versions(versions, source)
    if not candidates:
        raise ContractError(f"B2 has no size/metadata-compatible immutable upload for {source['source_id']}")
    attempted = 0
    for candidate in candidates:
        attempted += 1
        destination.unlink(missing_ok=True)
        read.download_b2_version(auth, str(candidate["fileId"]), destination)
        if sha256_file(destination) == (source["expected_sha256"], source["expected_size_bytes"]):
            return {"selected": candidate, "candidate_count": len(candidates), "attempted_candidate_count": attempted}
        destination.unlink(missing_ok=True)
    raise ContractError(f"B2 authoritative retained upload absent for {source['source_id']}")


def provider_phase(repo_root: Path, output_dir: Path, manifest_path: Path, manifest_sidecar: Path, report_path: Path) -> None:
    output_dir = require_child_of_runner_temp(output_dir); manifest_path = require_child_of_runner_temp(manifest_path)
    manifest_sidecar = require_child_of_runner_temp(manifest_sidecar); report_path = require_child_of_runner_temp(report_path)
    sources = load_historical_manifest(repo_root); read = load_read_module(repo_root)
    config = read.require_environment(os.environ); auth = read.authorize_b2(config)
    output_dir.mkdir(parents=True, exist_ok=False); manifest_sources = []; report_objects = []
    try:
        for source in sources:
            local = output_dir / f"{source['expected_sha256']}.raw"; r2_tmp = output_dir / f"{source['expected_sha256']}.r2.raw"
            item = read.RetainedObject(source["season"], source["asset_id"], source["expected_sha256"], source["expected_size_bytes"], source["custody_key"])
            versions = read.list_exact_versions(auth, item)
            selection = retrieve_authoritative_b2(read, auth, source, local, versions)
            selected = selection["selected"]
            read.r2_read(config, item, r2_tmp)
            if sha256_file(r2_tmp) != (source["expected_sha256"], source["expected_size_bytes"]):
                r2_tmp.unlink(missing_ok=True); local.unlink(missing_ok=True); raise ContractError(f"R2 authoritative identity mismatch for {source['source_id']}")
            equal = local.read_bytes() == r2_tmp.read_bytes(); r2_tmp.unlink(missing_ok=True)
            if not equal:
                local.unlink(missing_ok=True); raise ContractError(f"B2/R2 byte inequality for {source['source_id']}")
            ordered = sorted(versions, key=lambda value: int(value.get("uploadTimestamp", -1)), reverse=True)
            manifest_sources.append({**source, "local_path": str(local)})
            report_objects.append({
                "source_id": source["source_id"], "sha256": source["expected_sha256"], "byte_size": source["expected_size_bytes"],
                "b2_digest_size": "PASS", "r2_digest_size": "PASS", "b2_r2_equal": True,
                "b2_exact_version_count": len(versions), "b2_compatible_upload_count": selection["candidate_count"],
                "b2_attempted_upload_count": selection["attempted_candidate_count"], "b2_selected_action": "upload",
                "b2_selected_file_id_sha256": sha256_bytes(str(selected["fileId"]).encode()),
                "b2_latest_action": ordered[0].get("action") if ordered else None,
            })
        local_manifest = {
            "schema_version": "wr069-verified-local-input-manifest-v1", "task_id": "WR-069",
            "authority": {"wr042_manifest_commit": WR042_MANIFEST_COMMIT, "wr042_manifest_sha256": WR042_MANIFEST_SHA256},
            "input_count": 15, "sources": manifest_sources,
        }
        digest = write_canonical_json(manifest_path, local_manifest); write_sidecar(manifest_sidecar, digest, manifest_path.name)
        write_canonical_json(report_path, {
            "task_id": "WR-069", "result": "PASS", "expected_input_count": 15, "verified_input_count": 15,
            "b2_boundary": auth["boundary"], "objects": report_objects, "provider_mutation_operations": 0,
            "upstream_source_access": False, "draft_picks_csv": False, "provider_access_complete": True,
            "local_manifest_sha256": digest, "raw_actions_artifacts": 0,
        })
    except Exception:
        shutil.rmtree(output_dir, ignore_errors=True); manifest_path.unlink(missing_ok=True)
        manifest_sidecar.unlink(missing_ok=True); report_path.unlink(missing_ok=True); raise


def load_verified_local_manifest(path: Path, sidecar: Path) -> list[dict]:
    require_child_of_runner_temp(path); require_child_of_runner_temp(sidecar); verify_sidecar(sidecar, path)
    try: payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc: raise ContractError("verified local manifest JSON invalid") from exc
    if payload.get("schema_version") != "wr069-verified-local-input-manifest-v1" or payload.get("input_count") != 15:
        raise ContractError("verified local manifest shape mismatch")
    if (payload.get("authority") or {}) != {"wr042_manifest_commit": WR042_MANIFEST_COMMIT, "wr042_manifest_sha256": WR042_MANIFEST_SHA256}:
        raise ContractError("verified local manifest authority mismatch")
    sources = payload.get("sources")
    if not isinstance(sources, list): raise ContractError("verified local manifest lacks sources")
    validate_static_allowlist(sources)
    for source in sources:
        local = require_child_of_runner_temp(Path(str(source.get("local_path") or "")))
        if local.name != f"{source['expected_sha256']}.raw": raise ContractError("unexpected runner-local source path")
    return sources


def verify_local_source_files(sources: Sequence[Mapping[str, object]]) -> None:
    for source in sources:
        local = Path(str(source["local_path"])); actual = sha256_file(local)
        expected = (source["expected_sha256"], source["expected_size_bytes"])
        if actual != expected:
            local.unlink(missing_ok=True); raise ContractError(f"consumer re-hash/re-size mismatch for {source['source_id']}")


def row_mapping(headers: Sequence[str], row: Sequence[Field]) -> dict[str, Field]:
    return dict(zip(headers, row))


def derive_stats_evidence(source: Mapping[str, object], parsed: SchemaResult) -> tuple[dict, dict | None]:
    missing = [name for name in STATS_APPROVED_COLUMNS if name not in parsed.headers]
    if missing: raise ContractError(f"approved stats columns missing for {source['source_id']}: {','.join(missing)}")
    selected = []
    for row in parsed.rows:
        values = row_mapping(parsed.headers, row)
        if values["season_type"].text == "REG" and values["position"].text in {"QB", "RB", "WR", "TE"}:
            selected.append(values)
    season = int(source["season"]); expected_count = APPROVED_VIEW_COUNTS[season]
    if len(selected) != expected_count: raise ContractError(f"approved-view count mismatch for retained season {season}")
    inventory = None
    if season in HISTORICAL_INVENTORY_TARGETS:
        entries: list[list[str]] = []; seen: set[tuple[str, str]] = set()
        for values in selected:
            player_id = values["player_id"].text; position = values["position"].text
            if (not values["player_id"].quoted and player_id == "") or not player_id:
                raise ContractError(f"historical inventory has missing player_id for {season}")
            if values["season"].text != str(season): raise ContractError(f"historical inventory source-season mismatch for {season}")
            key = (player_id, position)
            if key in seen: raise ContractError(f"duplicate historical player/position key for {season}")
            seen.add(key); entries.append([player_id, position])
        entries.sort(key=lambda x: (x[1], x[0])); target = HISTORICAL_INVENTORY_TARGETS[season]
        inventory = {
            "source_season": season, "target_season": target, "player_id_namespace": "gsis_id",
            "source_instance_id": f"src-sha256-{source['expected_sha256']}", "count": len(entries),
            "ordered_player_id_position": entries,
            "inventory_sha256": sha256_bytes(json.dumps(entries, ensure_ascii=False, separators=(",", ":")).encode("utf-8")),
            "ordering": "position,player_id exact Unicode code-point order",
        }
    return ({"approved_view_count": len(selected), "approved_view_expected_count": expected_count,
             "approved_view_count_match": True, "approved_columns_present": list(STATS_APPROVED_COLUMNS)}, inventory)


def derive_players_evidence(parsed: SchemaResult) -> dict:
    missing = [name for name in PLAYERS_REQUIRED_APPROVED_COLUMNS if name not in parsed.headers]
    if missing:
        raise ContractError("required approved players metadata columns missing: " + ",".join(missing))
    present = [name for name in PLAYERS_APPROVED_COLUMN_ORDER if name in parsed.headers]
    return {
        "approved_columns_present": present,
        "required_approved_columns_present": list(PLAYERS_REQUIRED_APPROVED_COLUMNS),
        "optional_approved_columns_present": [name for name in PLAYERS_OPTIONAL_APPROVED_COLUMNS if name in parsed.headers],
        "historical_membership_use": False,
    }


def consumer_phase(manifest_path: Path, manifest_sidecar: Path, contract_path: Path, corpus_path: Path,
                   derived_path: Path, derived_sidecar: Path, report_path: Path, implementation_sha: str) -> None:
    assert_consumer_isolation(os.environ)
    for path in (manifest_path, manifest_sidecar, contract_path, corpus_path, derived_path, derived_sidecar, report_path):
        require_child_of_runner_temp(path)
    conformance = run_conformance(contract_path, corpus_path); sources = load_verified_local_manifest(manifest_path, manifest_sidecar)
    verify_local_source_files(sources)
    source_evidence = []; inventories = []; summary_rows = []
    for source in sources:
        parsed = derive_schema(Path(source["local_path"]).read_bytes())
        base = {
            "source_id": source["source_id"], "source_class": source["source_class"], "filename": source["filename"],
            "season": source["season"], "asset_id": source["asset_id"], "source_instance_id": f"src-sha256-{source['expected_sha256']}",
            "sha256": source["expected_sha256"], "byte_size": source["expected_size_bytes"],
            "physical_row_count": parsed.physical_row_count, "ordered_raw_columns": parsed.headers,
            "ordered_schema": parsed.ordered_schema, "schema_sha256": parsed.schema_sha256,
        }
        if source["source_class"] == "NFLVERSE_PLAYER_SUMMARY_STATS":
            extra, inventory = derive_stats_evidence(source, parsed); base.update(extra)
            if inventory is not None: inventories.append(inventory)
        elif source["source_class"] == "NFLVERSE_PLAYERS_METADATA_MINIMAL":
            base.update(derive_players_evidence(parsed))
        else:
            raise ContractError("unapproved retained source class")
        source_evidence.append(base)
        summary_rows.append({"source_id": source["source_id"], "physical_row_count": parsed.physical_row_count,
                             "schema_sha256": parsed.schema_sha256, "approved_view_count": base.get("approved_view_count")})
        del parsed
    if [x["target_season"] for x in inventories] != [2014, 2015, 2016, 2017]: raise ContractError("historical inventory target set mismatch")
    expected_counts = {2014: 410, 2015: 412, 2016: 423, 2017: 423}
    if any(x["count"] != expected_counts[x["target_season"]] for x in inventories): raise ContractError("historical inventory count mismatch")
    derived = {
        "schema_version": "wr069-retained-derived-evidence-v1", "task_id": "WR-069",
        "contract": {"id": CONTRACT_ID, "version": CONTRACT_VERSION, "machine_lock_sha256": CONTRACT_SHA256,
                     "conformance_corpus_sha256": CORPUS_SHA256, "conformance": conformance},
        "custody_authority": {"wr042_manifest_commit": WR042_MANIFEST_COMMIT, "wr042_manifest_sha256": WR042_MANIFEST_SHA256, "exact_source_count": 15},
        "sources": source_evidence, "historical_player_id_position_inventories": inventories,
        "summary": {"source_count": 15, "stats_source_count": 14, "players_metadata_source_count": 1,
                    "consumer_rehash_resize_pass_count": 15, "historical_inventory_target_seasons": [2014, 2015, 2016, 2017],
                    "historical_inventory_total_count": sum(x["count"] for x in inventories)},
        "boundaries": {"provider_credentials_present": False, "provider_mutation_operations": 0, "upstream_source_access": False,
                       "draft_picks_csv_used": False, "players_metadata_used_for_historical_membership": False,
                       "regular_season_2026_outcome_table_used": False, "target_join": False,
                       "model_fit_score_tune_compare_evaluate_predict": False, "ranking_or_production_change": False, "phase6_work": False},
    }
    digest = write_canonical_json(derived_path, derived); write_sidecar(derived_sidecar, digest, derived_path.name)
    write_canonical_json(report_path, {
        "task_id": "WR-069", "result": "PASS", "implementation_sha": implementation_sha, "verified_input_count": 15,
        "consumer_provider_credential_presence": False, "consumer_rehash_resize_pass_count": 15, "conformance": conformance,
        "parser_derivation": "PASS", "derived_evidence_sha256": digest, "source_summaries": summary_rows,
        "historical_inventory_counts": {str(x["target_season"]): x["count"] for x in inventories},
        "historical_inventory_total_count": sum(x["count"] for x in inventories), "provider_mutation_operations": 0, "raw_actions_artifacts": 0,
    })


def main() -> int:
    parser = argparse.ArgumentParser(); sub = parser.add_subparsers(dest="command", required=True)
    authority = sub.add_parser("authority"); authority.add_argument("--repo-root", type=Path, default=Path("."))
    conf = sub.add_parser("conformance"); conf.add_argument("--contract", type=Path, required=True); conf.add_argument("--corpus", type=Path, required=True)
    provider = sub.add_parser("provider"); provider.add_argument("--repo-root", type=Path, default=Path(".")); provider.add_argument("--output-dir", type=Path, required=True)
    provider.add_argument("--manifest", type=Path, required=True); provider.add_argument("--manifest-sidecar", type=Path, required=True); provider.add_argument("--report", type=Path, required=True)
    consumer = sub.add_parser("consumer"); consumer.add_argument("--manifest", type=Path, required=True); consumer.add_argument("--manifest-sidecar", type=Path, required=True)
    consumer.add_argument("--contract", type=Path, required=True); consumer.add_argument("--corpus", type=Path, required=True)
    consumer.add_argument("--derived", type=Path, required=True); consumer.add_argument("--derived-sidecar", type=Path, required=True)
    consumer.add_argument("--report", type=Path, required=True); consumer.add_argument("--implementation-sha", required=True)
    args = parser.parse_args()
    try:
        if args.command == "authority":
            sources = load_historical_manifest(args.repo_root.resolve()); print(json.dumps({"status":"PASS","source_count":len(sources),"manifest_sha256":WR042_MANIFEST_SHA256}, sort_keys=True))
        elif args.command == "conformance": print(json.dumps(run_conformance(args.contract, args.corpus), sort_keys=True))
        elif args.command == "provider": provider_phase(args.repo_root.resolve(), args.output_dir, args.manifest, args.manifest_sidecar, args.report)
        elif args.command == "consumer": consumer_phase(args.manifest, args.manifest_sidecar, args.contract, args.corpus, args.derived, args.derived_sidecar, args.report, args.implementation_sha)
        return 0
    except (ContractError, CsvFatal, OSError, ValueError) as exc:
        print(f"WR-069 FAIL CLOSED: {exc}", file=sys.stderr); return 2


if __name__ == "__main__":
    raise SystemExit(main())
