#!/usr/bin/env python3
"""WR-097 Returning-Player v2.1 protected execution bridge.

Pre-audit mode is strictly NO-SCORING: exact retained objects may be retrieved and
re-hashed, but 2022-2025 target outcomes are never exposed to the v2.1 consumer.
Future scoring is reachable only from canonical main with a one-time Manager
future_execution_authority after independent audit/integration.
"""
from __future__ import annotations

import argparse
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

TASK_ID = "WR-097"
SOURCE_SNAPSHOT_PATH = Path(".ai/research/generated/WR059_RETURNING_PLAYER_V2_SOURCE_SNAPSHOT.json")
COHORT_PATH = Path(".ai/research/generated/WR059_RETURNING_PLAYER_V2_COHORT_SOURCE_ELIGIBILITY.json")
PROTOCOL_PATH = Path(".ai/research/generated/WR095_RETURNING_PLAYER_V21_PROTOCOL_CANDIDATE.json")
SOURCE_SNAPSHOT_ID = "wr-returning-player-v2-source-snapshot/1.2.0-wr059"
SOURCE_SNAPSHOT_SHA256 = "6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea"
COHORT_ID = "returning-player-v2-cohort/1.2.0-wr059"
COHORT_SHA256 = "f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4"
PROTOCOL_ID = "returning-player-v2.1-model-protocol-candidate/1.0.0-wr095"
PROTOCOL_SHA256 = "5c86dacac044538422ca24fbeb13eaee3161050f917acc40f0dbdc1ca6547a39"
RESULT_GATES_ID = "returning-player-v2.1-result-gates-candidate/1.0.0-wr095"
EXPECTED_SOURCE_COUNT = 14
ACCEPTED_R2_ACCESS_KEY_ID_SHA256 = "17e95438e19777a414ee85d57c32d44466199a973c51e5b6f57e42a5384585bd"
R2_SCOPE_AUTHORITY = ".ai/auditor/WR-053_AUDIT.md"
R2_SCOPE_POLICY_AUTHORITY = ".ai/auditor/WR-050_AUDIT.md"
PROVIDER_SECRET_NAMES = (
    "WR_CUSTODY_B2_READ_KEY_ID", "WR_CUSTODY_B2_READ_APPLICATION_KEY",
    "WR_CUSTODY_R2_ACCESS_KEY_ID", "WR_CUSTODY_R2_SECRET_ACCESS_KEY",
)
PROVIDER_CONFIG_NAMES = (
    "WR_CUSTODY_B2_BUCKET", "WR_CUSTODY_B2_ENDPOINT",
    "WR_CUSTODY_R2_BUCKET", "WR_CUSTODY_R2_ENDPOINT",
)
PROVIDER_NAMES = PROVIDER_SECRET_NAMES + PROVIDER_CONFIG_NAMES
HEX40 = re.compile(r"^[0-9a-f]{40}$")
HEX64 = re.compile(r"^[0-9a-f]{64}$")
MANAGER_EXECUTION_AUTHORITY_KEY = "future_execution_authority"
V21_PUBLICATION_FAMILIES = (
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
V21_PUBLICATION_PATH = re.compile(
    r"^\.ai/research/generated/(RETURNING_PLAYER_V21_[A-Z0-9_]+)(?:_[A-Za-z0-9.-]+)?\.json$"
)
V21_CONSUMER_PATH = ".ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER.py"


class ContractError(RuntimeError):
    """Fail-closed WR-097 contract violation."""


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> tuple[str, int]:
    digest = hashlib.sha256(); size = 0
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk); size += len(chunk)
    return digest.hexdigest(), size


def canonical_json_bytes(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")


def write_json(path: Path, value: object) -> str:
    data = canonical_json_bytes(value)
    path.write_bytes(data)
    return sha256_bytes(data)


def require_runner_temp_child(path: Path, environment: Mapping[str, str] = os.environ) -> Path:
    raw = environment.get("RUNNER_TEMP", "")
    if not raw:
        raise ContractError("RUNNER_TEMP is required")
    runner = Path(raw).resolve(); resolved = path.resolve()
    if resolved == runner or runner not in resolved.parents:
        raise ContractError("path must be a child of RUNNER_TEMP")
    return resolved


def assert_consumer_isolation(environment: Mapping[str, str] = os.environ) -> None:
    found = sorted(name for name in PROVIDER_NAMES if environment.get(name))
    if found:
        raise ContractError("consumer provider authority present: " + ",".join(found))


def load_read_module(repo_root: Path):
    path = repo_root / "scripts/custody/read_retained_versions.py"
    spec = importlib.util.spec_from_file_location("wr097_wr063_read", path)
    if not spec or not spec.loader:
        raise ContractError("accepted WR-063 retained reader unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def verify_authority_file(repo_root: Path, relative: Path, expected_sha: str) -> dict:
    path = repo_root / relative
    actual, size = sha256_file(path)
    if actual != expected_sha:
        raise ContractError(f"authority digest mismatch: {relative}")
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ContractError(f"authority JSON invalid: {relative}") from exc
    return {"path": str(relative), "sha256": actual, "byte_size": size, "payload": payload}


def load_authority(repo_root: Path) -> tuple[list[dict], dict]:
    snapshot = verify_authority_file(repo_root, SOURCE_SNAPSHOT_PATH, SOURCE_SNAPSHOT_SHA256)
    cohort = verify_authority_file(repo_root, COHORT_PATH, COHORT_SHA256)
    protocol = verify_authority_file(repo_root, PROTOCOL_PATH, PROTOCOL_SHA256)
    s = snapshot["payload"]; c = cohort["payload"]; p = protocol["payload"]
    if s.get("source_snapshot_id") != SOURCE_SNAPSHOT_ID:
        raise ContractError("source snapshot identity mismatch")
    if c.get("cohort_version") != COHORT_ID:
        raise ContractError("cohort identity mismatch")
    if ((p.get("protocol") or {}).get("id")) != PROTOCOL_ID or ((p.get("gates") or {}).get("id")) != RESULT_GATES_ID:
        raise ContractError("WR-095 v2.1 protocol identity mismatch")
    stats = s.get("stats_contract") or {}
    if stats.get("status") != "ADMITTED" or (s.get("summary") or {}).get("admitted_source_count") != EXPECTED_SOURCE_COUNT:
        raise ContractError("source snapshot does not admit exactly 14 stats sources")
    if (s.get("summary") or {}).get("players_metadata_admitted_count") != 0:
        raise ContractError("Players metadata is unexpectedly admitted")
    exclusions = s.get("policy_exclusions") or []
    draft = [x for x in exclusions if x.get("asset_name") == "draft_picks.csv"]
    if len(draft) != 1 or any(draft[0].get(k) for k in ("acquired", "custodied", "parsed", "used")):
        raise ContractError("draft_picks.csv exclusion mismatch")
    fields = stats.get("record_fields") or []
    records = stats.get("records") or []
    if len(records) != EXPECTED_SOURCE_COUNT or len({row[0] for row in records}) != EXPECTED_SOURCE_COUNT:
        raise ContractError("stats record count/season uniqueness mismatch")
    sources = []
    for row in records:
        item = dict(zip(fields, row))
        sha = str(item.get("sha256") or "")
        season = int(item.get("season")); size = int(item.get("byte_size")); asset_id = int(item.get("asset_id"))
        if not HEX64.fullmatch(sha) or size <= 0 or season < 2012 or season > 2025:
            raise ContractError("malformed admitted stats identity")
        sources.append({
            "source_id": f"nflverse-player-summary-{season}", "season": season, "asset_id": asset_id,
            "asset_name": item.get("asset_name"), "expected_sha256": sha, "expected_size_bytes": size,
            "custody_key": f"custody/sha256/{sha}/raw", "source_instance_id": f"src-sha256-{sha}",
        })
    sources.sort(key=lambda x: x["season"])
    if [x["season"] for x in sources] != list(range(2012, 2026)):
        raise ContractError("admitted stats seasons must be exactly 2012..2025")
    identity_digest = sha256_bytes(canonical_json_bytes([
        [x["season"], x["asset_id"], x["expected_sha256"], x["expected_size_bytes"], x["custody_key"]]
        for x in sources
    ]))
    bindings = {
        "source_snapshot": {"id": SOURCE_SNAPSHOT_ID, "sha256": SOURCE_SNAPSHOT_SHA256},
        "cohort": {"id": COHORT_ID, "sha256": COHORT_SHA256},
        "protocol": {"id": PROTOCOL_ID, "sha256": PROTOCOL_SHA256, "gates_id": RESULT_GATES_ID},
        "admitted_stats_source_count": EXPECTED_SOURCE_COUNT,
        "players_metadata_admitted_count": 0,
        "draft_picks_csv_used": False,
        "source_identity_set_sha256": identity_digest,
    }
    return sources, bindings


def candidate_upload_versions(versions: Sequence[Mapping[str, object]], source: Mapping[str, object]) -> list[dict]:
    candidates = []
    for value in sorted(versions, key=lambda v: int(v.get("uploadTimestamp", -1)), reverse=True):
        if value.get("action") != "upload" or not value.get("fileId"):
            continue
        size = int(value.get("contentLength", value.get("size", -1)) or -1)
        if size != int(source["expected_size_bytes"]):
            continue
        info = value.get("fileInfo") or {}
        metadata_digest = info.get("wr-sha256") or info.get("sha256")
        if metadata_digest not in (None, source["expected_sha256"]):
            continue
        candidates.append(dict(value))
    return candidates


def retrieve_authoritative_b2(read, auth: Mapping[str, str], source: Mapping[str, object], destination: Path,
                              versions: Sequence[Mapping[str, object]]) -> dict:
    candidates = candidate_upload_versions(versions, source)
    if not candidates:
        raise ContractError(f"B2 has no candidate immutable upload for {source['source_id']}")
    attempted = 0
    for candidate in candidates:
        attempted += 1; destination.unlink(missing_ok=True)
        read.download_b2_version(auth, str(candidate["fileId"]), destination)
        if sha256_file(destination) == (source["expected_sha256"], source["expected_size_bytes"]):
            return {"selected": candidate, "candidate_count": len(candidates), "attempted_count": attempted}
        destination.unlink(missing_ok=True)
    raise ContractError(f"B2 authoritative retained upload absent for {source['source_id']}")


def cleanup_paths(paths: Sequence[Path]) -> None:
    for path in paths:
        try:
            if path.is_dir(): shutil.rmtree(path, ignore_errors=True)
            else: path.unlink(missing_ok=True)
        except OSError:
            pass


def files_equal(a: Path, b: Path) -> bool:
    if a.stat().st_size != b.stat().st_size: return False
    with a.open("rb") as left, b.open("rb") as right:
        while True:
            la = left.read(1024 * 1024); rb = right.read(1024 * 1024)
            if la != rb: return False
            if not la: return True


def provider_phase(repo_root: Path, raw_dir: Path, manifest_path: Path, report_path: Path) -> None:
    raw_dir = require_runner_temp_child(raw_dir); manifest_path = require_runner_temp_child(manifest_path)
    report_path = require_runner_temp_child(report_path)
    sources, bindings = load_authority(repo_root)
    read = load_read_module(repo_root)
    config = read.require_environment(os.environ)
    r2_access_key_id_sha256 = sha256_bytes(config["WR_CUSTODY_R2_ACCESS_KEY_ID"].strip().encode("utf-8"))
    if r2_access_key_id_sha256 != ACCEPTED_R2_ACCESS_KEY_ID_SHA256:
        raise ContractError("R2 credential identity is not the WR-053 accepted scope anchor")
    scope_authority = (repo_root / R2_SCOPE_AUTHORITY).read_text(encoding="utf-8")
    scope_policy_authority = (repo_root / R2_SCOPE_POLICY_AUTHORITY).read_text(encoding="utf-8")
    for required_continuity_evidence in (
        ACCEPTED_R2_ACCESS_KEY_ID_SHA256,
        "war-room-custody-backup",
        "Final verdict",
        "`PASS`",
        "Current credential-anchor binding verdict: PASS.",
    ):
        if required_continuity_evidence not in scope_authority:
            raise ContractError("accepted R2 credential-continuity authority mismatch")
    for required_policy_evidence in (
        ACCEPTED_R2_ACCESS_KEY_ID_SHA256,
        "bucket: `war-room-custody-backup` only;",
        "permission: `Object Read & Write`;",
        "no Admin Read & Write / bucket-configuration authority;",
    ):
        if required_policy_evidence not in scope_policy_authority:
            raise ContractError("accepted R2 scope-policy authority mismatch")
    auth = read.authorize_b2(config)
    cleanup_paths([raw_dir, manifest_path, report_path]); raw_dir.mkdir(parents=True, mode=0o700)
    manifest_sources = []; objects = []
    try:
        for source in sources:
            local = raw_dir / f"{source['season']}-{source['expected_sha256']}.raw"
            r2_tmp = raw_dir / f"{source['season']}-{source['expected_sha256']}.r2.raw"
            item = read.RetainedObject(source["season"], source["asset_id"], source["expected_sha256"], source["expected_size_bytes"], source["custody_key"])
            versions = read.list_exact_versions(auth, item)
            selection = retrieve_authoritative_b2(read, auth, source, local, versions)
            read.r2_read(config, item, r2_tmp)
            if sha256_file(r2_tmp) != (source["expected_sha256"], source["expected_size_bytes"]):
                raise ContractError(f"R2 authoritative identity mismatch for {source['source_id']}")
            if not files_equal(local, r2_tmp):
                raise ContractError(f"B2/R2 byte inequality for {source['source_id']}")
            r2_tmp.unlink(missing_ok=True)
            selected = selection["selected"]
            manifest_sources.append({**source, "local_path": str(local)})
            objects.append({
                "source_id": source["source_id"], "season": source["season"], "sha256": source["expected_sha256"],
                "byte_size": source["expected_size_bytes"], "b2_digest_size": "PASS", "r2_digest_size": "PASS",
                "b2_r2_equal": True, "b2_exact_version_count": len(versions),
                "b2_candidate_upload_count": selection["candidate_count"], "b2_attempted_upload_count": selection["attempted_count"],
                "b2_selected_file_id_sha256": sha256_bytes(str(selected["fileId"]).encode("utf-8")),
            })
        manifest = {"schema_version":"wr097-v21-verified-local-input-manifest-v1","task_id":TASK_ID,"bindings":bindings,
                    "input_count":EXPECTED_SOURCE_COUNT,"sources":manifest_sources}
        manifest_sha = write_json(manifest_path, manifest)
        write_json(report_path, {
            "schema_version":"wr097-v21-provider-proof-v1","task_id":TASK_ID,"result":"PASS","bindings":bindings,
            "verified_input_count":EXPECTED_SOURCE_COUNT,"b2_boundary":auth["boundary"],
            "r2_boundary":{"status":"PASS","bucket_name":config["WR_CUSTODY_R2_BUCKET"],
                "access_key_id_sha256":r2_access_key_id_sha256,"accepted_scope_authority":R2_SCOPE_AUTHORITY,"accepted_scope_policy_authority":R2_SCOPE_POLICY_AUTHORITY,
                "accepted_scope":"bucket-scoped Object Read & Write; no configuration/admin authority",
                "execution_operations":["HeadObject","GetObject"],"execution_mutation_operations":0,
                "accepted_scope_anchor_matches":True},"objects":objects,
            "provider_operations":{"B2":["b2_authorize_account","b2_list_file_versions","b2_download_file_by_id"],"R2":["HeadObject","GetObject"]},
            "provider_mutation_operations":0,"upstream_source_access":False,"draft_picks_csv":False,
            "players_metadata":False,"raw_storage":"RUNNER_TEMP-only","local_manifest_sha256":manifest_sha,
        })
    except BaseException:
        cleanup_paths([raw_dir, manifest_path, report_path]); raise


def load_verified_manifest(path: Path) -> dict:
    require_runner_temp_child(path)
    try: payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc: raise ContractError("verified local manifest JSON invalid") from exc
    if payload.get("schema_version") != "wr097-v21-verified-local-input-manifest-v1" or payload.get("input_count") != EXPECTED_SOURCE_COUNT:
        raise ContractError("verified local manifest shape mismatch")
    sources = payload.get("sources")
    if not isinstance(sources, list) or len(sources) != EXPECTED_SOURCE_COUNT:
        raise ContractError("verified local manifest source set mismatch")
    return payload


@dataclass
class ChronologyGuard:
    stages: tuple[str, ...] = ("validation", "confirmation")
    completed: tuple[str, ...] = ()
    current: str | None = None
    prediction_digest: str | None = None
    target_digest: str | None = None

    def begin(self, stage: str) -> None:
        expected = self.stages[len(self.completed)] if len(self.completed) < len(self.stages) else None
        if stage != expected or self.current is not None:
            raise ContractError("stage chronology violation")
        self.current = stage; self.prediction_digest = None; self.target_digest = None

    def lock_predictions(self, digest: str) -> None:
        if self.current is None or not HEX64.fullmatch(digest): raise ContractError("prediction lock invalid")
        if self.prediction_digest is not None or self.target_digest is not None: raise ContractError("prediction lock ordering violation")
        self.prediction_digest = digest

    def expose_targets(self, digest: str) -> None:
        if self.current is None or self.prediction_digest is None: raise ContractError("target access before prediction lock")
        if self.target_digest is not None or not HEX64.fullmatch(digest): raise ContractError("target exposure invalid")
        self.target_digest = digest

    def finish(self, gate_pass: bool) -> None:
        if self.current is None or self.prediction_digest is None or self.target_digest is None:
            raise ContractError("stage cannot finish before prediction+target evidence")
        if not gate_pass and self.current != "confirmation":
            raise ContractError("later stage is ineligible after failed gate")
        self.completed = (*self.completed, self.current); self.current = None

    def serialize(self) -> bytes:
        return canonical_json_bytes({"completed":list(self.completed),"current":self.current,
                                     "prediction_digest":self.prediction_digest,"target_digest":self.target_digest})


def synthetic_conformance() -> dict:
    guard = ChronologyGuard(); pred = sha256_bytes(b"synthetic-v21-predictions"); target = sha256_bytes(b"synthetic-v21-targets")
    fail_closed = 0
    try:
        guard.expose_targets(target)
    except ContractError:
        fail_closed += 1
    guard.begin("validation"); guard.lock_predictions(pred); guard.expose_targets(target); guard.finish(True)
    guard.begin("confirmation"); guard.lock_predictions(pred); guard.expose_targets(target); guard.finish(True)
    try:
        guard.begin("confirmation")
    except ContractError:
        fail_closed += 1
    serialized = guard.serialize()
    if tuple(guard.completed) != guard.stages or fail_closed != 2:
        raise ContractError("synthetic v2.1 chronology conformance mismatch")
    return {"status":"PASS","fail_closed_cases":fail_closed,"completed_stages":list(guard.completed),
            "validation_years":[2022,2023],"confirmation_years":[2024,2025],
            "confirmation_requires_complete_validation":True,
            "serialization_sha256":sha256_bytes(serialized)}

def git_head(repo_root: Path) -> str:
    try:
        return subprocess.check_output(["git","-C",str(repo_root),"rev-parse","HEAD"], text=True, stderr=subprocess.DEVNULL).strip()
    except subprocess.CalledProcessError as exc:
        raise ContractError("git head unavailable") from exc


def verify_reviewed_code(repo_root: Path, expected_commit: str, expected_script_sha: str,
                         expected_test_sha: str, expected_workflow_sha: str,
                         expected_consumer_sha: str, expected_consumer_test_sha: str) -> dict:
    if not HEX40.fullmatch(expected_commit) or git_head(repo_root) != expected_commit:
        raise ContractError("implementation commit binding mismatch")
    paths = {
        "script": repo_root / "scripts/custody/wr097_v21_protected_scoring.py",
        "test": repo_root / "scripts/custody/test_wr097_v21_protected_scoring.py",
        "workflow": repo_root / ".github/workflows/wr097-v21-protected-scoring-bridge.yml",
        "consumer": repo_root / V21_CONSUMER_PATH,
        "consumer_test": repo_root / ".ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER_TEST.py",
    }
    expected = {
        "script":expected_script_sha,"test":expected_test_sha,"workflow":expected_workflow_sha,
        "consumer":expected_consumer_sha,"consumer_test":expected_consumer_test_sha,
    }
    actual = {}
    for name, path in paths.items():
        digest, _ = sha256_file(path); actual[name] = digest
        if digest != expected[name]:
            raise ContractError(f"reviewed {name} digest mismatch")
    return {"implementation_commit":expected_commit,"file_sha256":actual}


def no_scoring_consumer(repo_root: Path, manifest_path: Path, report_path: Path, expected_commit: str,
                        script_sha: str, test_sha: str, workflow_sha: str,
                        consumer_sha: str, consumer_test_sha: str) -> None:
    assert_consumer_isolation(os.environ)
    manifest_path = require_runner_temp_child(manifest_path); report_path = require_runner_temp_child(report_path)
    manifest = load_verified_manifest(manifest_path)
    sources, bindings = load_authority(repo_root)
    expected_map = {x["source_id"]:x for x in sources}
    if manifest.get("bindings") != bindings:
        raise ContractError("local manifest authority binding mismatch")
    verified = 0
    for source in manifest["sources"]:
        sid = source.get("source_id"); authoritative = expected_map.get(sid)
        if authoritative is None or any(source.get(k) != authoritative.get(k) for k in ("season","asset_id","expected_sha256","expected_size_bytes","custody_key")):
            raise ContractError("consumer source identity mismatch")
        local = require_runner_temp_child(Path(str(source.get("local_path") or "")))
        if sha256_file(local) != (authoritative["expected_sha256"], authoritative["expected_size_bytes"]):
            raise ContractError(f"consumer re-hash mismatch for {sid}")
        verified += 1
    code = verify_reviewed_code(repo_root, expected_commit, script_sha, test_sha, workflow_sha, consumer_sha, consumer_test_sha)
    conformance = synthetic_conformance()
    write_json(report_path, {
        "schema_version":"wr097-v21-no-scoring-proof-v1","task_id":TASK_ID,"result":"PASS","bindings":bindings,
        "consumer_provider_credential_presence":False,"consumer_rehash_resize_pass_count":verified,"reviewed_code_binding":code,
        "synthetic_chronology_conformance":conformance,"real_retained_csv_parsed":False,"historical_features_constructed":False,
        "historical_targets_exposed":False,"model_fit":False,"predictions_emitted":False,"baselines_compared":False,
        "result_gates_calculated":False,"validation_2022_2023_outcomes_inspected":False,"confirmation_2024_2025_outcomes_inspected":False,
        "target_outcomes_2022_2025_exposed":False,"regular_season_2026_outcomes_inspected":False,
    })


def _normalized_authority(authority: object) -> dict | None:
    if not isinstance(authority, dict):
        return None
    value = {
        "branch": str(authority.get("branch") or ""),
        "head_sha": str(authority.get("head_sha") or ""),
        "consumer_path": str(authority.get("consumer_path") or ""),
        "consumer_sha256": str(authority.get("consumer_sha256") or ""),
    }
    rel = Path(value["consumer_path"])
    if (not value["branch"] or value["branch"] == "main" or not HEX40.fullmatch(value["head_sha"]) or
            value["consumer_path"] != V21_CONSUMER_PATH or rel.is_absolute() or ".." in rel.parts or
            not HEX64.fullmatch(value["consumer_sha256"])):
        return None
    return value

def _authority_digest(authority: Mapping[str, object]) -> str:
    normalized = _normalized_authority(dict(authority))
    if normalized is None:
        raise ContractError("future execution authority malformed")
    return sha256_bytes(canonical_json_bytes(normalized))

def load_future_authorization(control_repo: Path) -> dict:
    path = control_repo / ".ai/shared/ACTIVE_TASKS.json"
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ContractError("canonical active-task authorization unavailable") from exc
    if payload.get("manager_owned") is not True or payload.get("canonical_branch") != "main":
        raise ContractError("canonical Manager authority metadata mismatch")
    eligible = []
    for task in payload.get("tasks", []):
        authority = _normalized_authority(task.get(MANAGER_EXECUTION_AUTHORITY_KEY))
        if authority is None:
            continue
        if task.get("status") not in {"ASSIGNED", "IN_PROGRESS"} or task.get("blocker_type") != "NONE" or task.get("blocked_on_tasks"):
            continue
        if task.get("branch") != authority["branch"]:
            raise ContractError("Manager task branch contradicts future execution authority")
        eligible.append((task, authority))
    if len(eligible) != 1:
        raise ContractError("exactly one active Manager v2.1 future execution authority is required")
    task, authority = eligible[0]
    digest = _authority_digest(authority)
    consumed = set(str(x) for x in payload.get("authority_consumption_history", []) if isinstance(x, str))
    consumed.update(str(x) for x in task.get("consumed_authority_sha256s", []) if isinstance(x, str))
    prior_receipt = task.get("authority_consumption_receipt")
    if isinstance(prior_receipt, dict) and prior_receipt.get("authority_sha256"):
        consumed.add(str(prior_receipt["authority_sha256"]))
    if digest in consumed:
        raise ContractError("future execution authority has already been consumed")
    return {
        "status":"PASS","task_id":str(task.get("task_id") or ""),"task_status":task.get("status"),
        **authority,"authority_sha256":digest,
    }

def validate_future_authorization(control_repo: Path, execution_branch: str, expected_head: str,
                                  consumer_relpath: str, consumer_sha256: str) -> dict:
    manager = load_future_authorization(control_repo)
    requested = {"branch":execution_branch,"head_sha":expected_head,
                 "consumer_path":consumer_relpath,"consumer_sha256":consumer_sha256}
    if requested != {key:manager[key] for key in requested}:
        raise ContractError("execution identity is not canonical Manager authority")
    return manager

def validate_live_remote_head(authorization: Mapping[str, object], observed_head: str) -> None:
    expected = str(authorization.get("head_sha") or "")
    if not HEX40.fullmatch(observed_head) or observed_head != expected:
        raise ContractError("live authorized v2.1 branch head mismatch")

def validate_future_consumer(execution_repo: Path, authorization: Mapping[str, object]) -> Path:
    expected_head = str(authorization.get("head_sha") or "")
    consumer_relpath = str(authorization.get("consumer_path") or "")
    consumer_sha256 = str(authorization.get("consumer_sha256") or "")
    if not HEX40.fullmatch(expected_head) or git_head(execution_repo) != expected_head:
        raise ContractError("checked-out head is not the Manager-authorized branch head")
    if consumer_relpath != V21_CONSUMER_PATH:
        raise ContractError("Manager-authorized consumer path is not WR-097 v2.1 consumer")
    consumer = (execution_repo / consumer_relpath).resolve(); root = execution_repo.resolve()
    if root not in consumer.parents or not consumer.is_file():
        raise ContractError("Manager-authorized v2.1 consumer unavailable")
    if not HEX64.fullmatch(consumer_sha256) or sha256_file(consumer)[0] != consumer_sha256:
        raise ContractError("Manager-reviewed v2.1 consumer digest mismatch")
    return consumer


STAGE_YEARS = {
    "validation": (2022, 2023),
    "confirmation": (2024, 2025),
}


def stage_for_year(year: int) -> str:
    for stage, years in STAGE_YEARS.items():
        if year in years:
            return stage
    raise ContractError("target season is outside frozen scored chronology")


def prediction_visible_seasons(target_year: int) -> tuple[int, ...]:
    stage_for_year(target_year)
    return tuple(range(2012, target_year))


def evaluation_visible_seasons(target_year: int) -> tuple[int, ...]:
    stage_for_year(target_year)
    return (target_year,)


def _files_equal(left: Path, right: Path) -> bool:
    if left.stat().st_size != right.stat().st_size:
        return False
    with left.open("rb") as a, right.open("rb") as b:
        while True:
            x = a.read(1024 * 1024); y = b.read(1024 * 1024)
            if x != y:
                return False
            if not x:
                return True


def _retained_raw_sources(retained_manifest: Mapping[str, object]) -> list[dict]:
    sources = retained_manifest.get("sources")
    if not isinstance(sources, list) or not sources:
        raise ContractError("retained-input manifest is unavailable for publication validation")
    checked = []
    for source in sources:
        expected = str(source.get("expected_sha256") or "")
        size = int(source.get("expected_size_bytes") or -1)
        raw = require_runner_temp_child(Path(str(source.get("local_path") or "")))
        if not HEX64.fullmatch(expected) or size < 0 or sha256_file(raw) != (expected, size):
            raise ContractError("retained-input manifest identity mismatch during publication validation")
        checked.append({"sha256": expected, "byte_size": size, "path": raw})
    return checked


def _publication_family(rel: str) -> str:
    match = V21_PUBLICATION_PATH.fullmatch(rel)
    if not match or match.group(1) not in V21_PUBLICATION_FAMILIES:
        raise ContractError("publication path/family is not authorized")
    return match.group(1)

def _contains_credential_key(value: object) -> bool:
    if isinstance(value, dict):
        for key, nested in value.items():
            lowered = str(key).lower()
            if any(token in lowered for token in ("secret", "credential", "access_key", "application_key", "api_token")):
                return True
            if _contains_credential_key(nested):
                return True
    elif isinstance(value, list):
        return any(_contains_credential_key(item) for item in value)
    return False

def publication_entries(output_dir: Path, retained_manifest: Mapping[str, object]) -> list[dict]:
    manifest = output_dir / "publication-manifest.json"
    try:
        payload = json.loads(manifest.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ContractError("publication manifest missing/invalid") from exc
    files = payload.get("files")
    if not isinstance(files, list) or not files:
        raise ContractError("publication manifest has no files")
    retained = _retained_raw_sources(retained_manifest)
    checked=[]; seen=set()
    for entry in files:
        rel=str(entry.get("path") or ""); expected=str(entry.get("sha256") or ""); size=int(entry.get("byte_size") or -1)
        family=_publication_family(rel)
        if rel in seen or not HEX64.fullmatch(expected) or size < 0:
            raise ContractError("publication manifest duplicate/digest boundary violation")
        seen.add(rel)
        staged=output_dir/"files"/Path(rel)
        if sha256_file(staged)!=(expected,size):
            raise ContractError("publication file digest/size mismatch")
        if any((expected,size)==(raw["sha256"],raw["byte_size"]) for raw in retained):
            raise ContractError("publication exactly matches retained raw source identity")
        for raw in retained:
            if size==raw["byte_size"] and _files_equal(staged,raw["path"]):
                raise ContractError("publication exactly matches retained raw source bytes")
        try:
            decoded=json.loads(staged.read_text(encoding="utf-8"))
        except (UnicodeDecodeError,json.JSONDecodeError) as exc:
            raise ContractError("v2.1 publication must be JSON") from exc
        if _contains_credential_key(decoded):
            raise ContractError("credential-bearing publication rejected")
        checked.append({"path":rel,"sha256":expected,"byte_size":size,"family":family})
    return sorted(checked,key=lambda x:x["path"])


def publication_tree_sha256(output_dir: Path, retained_manifest: Mapping[str, object]) -> str:
    return sha256_bytes(canonical_json_bytes(publication_entries(output_dir, retained_manifest)))


def merge_publication(output_dir: Path, package_dir: Path, frozen: dict[str, tuple[str, int]],
                      retained_manifest: Mapping[str, object]) -> None:
    for entry in publication_entries(output_dir, retained_manifest):
        rel = entry["path"]; identity = (entry["sha256"], entry["byte_size"])
        prior = frozen.get(rel)
        if prior is not None and prior != identity:
            raise ContractError("consumer attempted to mutate previously frozen evidence path")
        dest = package_dir / "files" / Path(rel); dest.parent.mkdir(parents=True, exist_ok=True)
        if prior is None:
            shutil.copyfile(output_dir / "files" / Path(rel), dest)
        frozen[rel] = identity


def retained_publication_guard_sha256(retained_manifest: Mapping[str, object]) -> str:
    sources = retained_manifest.get("sources")
    if not isinstance(sources, list) or not sources:
        raise ContractError("retained-input manifest is unavailable for publication binding")
    identity = [{
        "source_id": str(x.get("source_id") or ""),
        "season": int(x.get("season") or 0),
        "sha256": str(x.get("expected_sha256") or ""),
        "byte_size": int(x.get("expected_size_bytes") or -1),
    } for x in sources]
    return sha256_bytes(canonical_json_bytes(sorted(identity, key=lambda x: (x["season"], x["source_id"]))))


def write_package_manifest(package_dir: Path, frozen: Mapping[str, tuple[str, int]],
                           retained_manifest: Mapping[str, object]) -> None:
    write_json(package_dir / "publication-manifest.json", {
        "schema_version": "wr097-v21-publication-package-v1",
        "retained_input_identity_set_sha256": retained_publication_guard_sha256(retained_manifest),
        "files": [{"path": path, "sha256": identity[0], "byte_size": identity[1]} for path, identity in sorted(frozen.items())],
    })


def copy_visible_sources(manifest: Mapping[str, object], seasons: Sequence[int], visible_dir: Path) -> list[dict]:
    shutil.rmtree(visible_dir, ignore_errors=True); visible_dir.mkdir(parents=True, mode=0o700)
    by_season = {int(x["season"]): x for x in manifest["sources"]}
    if any(year not in by_season for year in seasons):
        raise ContractError("visible-source season unavailable")
    visible = []
    for season in seasons:
        source = by_season[season]; src = require_runner_temp_child(Path(str(source["local_path"])))
        if sha256_file(src) != (source["expected_sha256"], source["expected_size_bytes"]):
            raise ContractError("visible-source identity mismatch")
        name = f"stats-{season}-{source['expected_sha256']}.raw"; dest = visible_dir / name; shutil.copyfile(src, dest)
        visible.append({"season": season, "source_id": source["source_id"], "sha256": source["expected_sha256"], "byte_size": source["expected_size_bytes"], "path": f"/input/{name}"})
    return visible


def bwrap_base() -> list[str]:
    binary = shutil.which("bwrap")
    if not binary:
        raise ContractError("bubblewrap sandbox runtime unavailable")
    command = [binary, "--die-with-parent", "--new-session", "--unshare-net", "--proc", "/proc", "--dev", "/dev", "--tmpfs", "/tmp", "--dir", "/work", "--dir", "/input", "--dir", "/state", "--dir", "/locks", "--dir", "/output"]
    for root in ("/usr", "/opt", "/lib", "/lib64", "/etc"):
        if Path(root).exists():
            command += ["--ro-bind", root, root]
    return command


def run_sandboxed_consumer(consumer_copy: Path, mode: str, context: Mapping[str, object], visible_dir: Path,
                           state_dir: Path, locks_dir: Path, output_dir: Path,
                           retained_manifest: Mapping[str, object]) -> dict:
    for p in (consumer_copy, visible_dir, state_dir, locks_dir, output_dir):
        require_runner_temp_child(p)
    shutil.rmtree(output_dir, ignore_errors=True); output_dir.mkdir(parents=True, mode=0o700)
    context_path = visible_dir / "context.json"; write_json(context_path, context)
    command = bwrap_base() + [
        "--ro-bind", str(consumer_copy), "/work/consumer.py",
        "--ro-bind", str(visible_dir), "/input",
        "--bind", str(state_dir), "/state",
        "--ro-bind", str(locks_dir), "/locks",
        "--bind", str(output_dir), "/output",
        "--chdir", "/work", "--clearenv",
        "--setenv", "PATH", os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
        "--setenv", "LANG", "C.UTF-8", "--setenv", "LC_ALL", "C.UTF-8", "--setenv", "TZ", "UTC",
        "--setenv", "PYTHONHASHSEED", "72072", "--setenv", "OMP_NUM_THREADS", "1", "--setenv", "MKL_NUM_THREADS", "1",
        "--setenv", "OPENBLAS_NUM_THREADS", "1", "--setenv", "NUMEXPR_NUM_THREADS", "1",
        sys.executable, "/work/consumer.py", "--wr097-mode", mode, "--wr097-context", "/input/context.json",
        "--wr097-state-dir", "/state", "--wr097-lock-dir", "/locks", "--wr097-output-dir", "/output",
    ]
    result = subprocess.run(command, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.returncode:
        raise ContractError(f"sandboxed consumer failed closed in {mode}")
    if result.stdout or result.stderr:
        raise ContractError("sandboxed consumer emitted prohibited operator-facing output")
    try:
        bridge = json.loads((output_dir / "bridge-result.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ContractError("consumer bridge result missing/invalid") from exc
    if bridge.get("schema_version") != "wr097-v21-consumer-result-v1" or bridge.get("mode") != mode or bridge.get("status") != "PASS":
        raise ContractError("consumer bridge result contract mismatch")
    publication_entries(output_dir, retained_manifest)
    return bridge


def lock_phase_output(output_dir: Path, locks_dir: Path, label: str, retained_manifest: Mapping[str, object]) -> str:
    digest = publication_tree_sha256(output_dir, retained_manifest); dest = locks_dir / label
    if dest.exists():
        raise ContractError("duplicate immutable phase lock")
    shutil.copytree(output_dir, dest)
    for root, dirs, files in os.walk(dest):
        for name in files:
            os.chmod(Path(root) / name, 0o444)
        for name in dirs:
            os.chmod(Path(root) / name, 0o555)
    os.chmod(dest, 0o555)
    return digest


def future_execution_plan() -> dict:
    plans = []
    for stage, years in STAGE_YEARS.items():
        for year in years:
            plans.append({"stage": stage, "target_season": year, "predict_visible_seasons": list(prediction_visible_seasons(year)), "target_visible_seasons": [year]})
    return {"stages": {k: list(v) for k, v in STAGE_YEARS.items()}, "folds": plans, "network": "UNSHARED", "consumer_repository_visibility": False, "master_raw_visibility": False}


def synthetic_sandbox_conformance() -> dict:
    raw_runner=os.environ.get("RUNNER_TEMP","")
    if not raw_runner:
        raise ContractError("RUNNER_TEMP required for sandbox conformance")
    root=require_runner_temp_child(Path(raw_runner)/"wr097-sandbox-conformance")
    shutil.rmtree(root,ignore_errors=True); root.mkdir()
    visible=root/"visible"; visible.mkdir(); (visible/"prior.raw").write_text("synthetic-prior-only\n",encoding="utf-8")
    digest,size=sha256_file(visible/"prior.raw")
    retained={"sources":[{"local_path":str(visible/"prior.raw"),"expected_sha256":digest,"expected_size_bytes":size}]}
    hidden=root/"master-raw"; hidden.mkdir(); (hidden/"target.raw").write_text("synthetic-sealed-target\n",encoding="utf-8")
    state=root/"state"; state.mkdir(); locks=root/"locks"; locks.mkdir(); output=root/"output"; consumer=root/"consumer.py"
    code=(
        "import argparse,json,pathlib,socket,hashlib\n"
        "p=argparse.ArgumentParser();p.add_argument('--wr097-mode');p.add_argument('--wr097-context');p.add_argument('--wr097-state-dir');p.add_argument('--wr097-lock-dir');p.add_argument('--wr097-output-dir');a=p.parse_args()\n"
        "assert pathlib.Path('/input/prior.raw').read_text()=='synthetic-prior-only\\n'\n"
        "assert not pathlib.Path('/master-raw/target.raw').exists()\n"
        "blocked=False\n"
        "try:\n s=socket.socket();s.settimeout(.2);s.connect(('1.1.1.1',80))\n"
        "except OSError: blocked=True\n"
        "assert blocked\n"
        "out=pathlib.Path(a.wr097_output_dir);f=out/'files/.ai/research/generated/RETURNING_PLAYER_V21_RESULT_MANIFEST_SYNTHETIC.json';f.parent.mkdir(parents=True);f.write_text('{}\\n');d=hashlib.sha256(f.read_bytes()).hexdigest();(out/'publication-manifest.json').write_text(json.dumps({'files':[{'path':'.ai/research/generated/RETURNING_PLAYER_V21_RESULT_MANIFEST_SYNTHETIC.json','sha256':d,'byte_size':f.stat().st_size}]})+'\\n');(out/'bridge-result.json').write_text(json.dumps({'schema_version':'wr097-v21-consumer-result-v1','mode':a.wr097_mode,'status':'PASS','network_blocked':blocked})+'\\n')\n"
    )
    consumer.write_text(code,encoding="utf-8")
    try:
        result=run_sandboxed_consumer(consumer,"synthetic",{"visible":"prior-only"},visible,state,locks,output,retained)
        if result.get("network_blocked") is not True:
            raise ContractError("synthetic sandbox network isolation failed")
        return {"status":"PASS","sealed_target_not_mounted":True,"network_unshared":True,"operator_output_empty":True}
    finally:
        shutil.rmtree(root,ignore_errors=True)


def _add_frozen_json(package_dir: Path, frozen: dict[str, tuple[str, int]], rel: str,
                     payload: Mapping[str, object], collision_label: str) -> tuple[str, int]:
    data = canonical_json_bytes(payload)
    dest = package_dir / "files" / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    identity = (sha256_bytes(data), len(data))
    prior = frozen.get(rel)
    if prior is not None and prior != identity:
        raise ContractError(f"{collision_label} publication collision")
    frozen[rel] = identity
    return identity


def build_terminal_result_summary(authorization: Mapping[str, object], consumer_sha256: str, terminal: str,
                                  decision_status: str, prediction_lock_count: int, gate_lock_count: int) -> dict:
    return {
        "schema_version": "wr081-terminal-result-summary-v1",
        "task_id": str(authorization["task_id"]),
        "execution_status": "SUCCESS",
        "result_terminal": terminal,
        "decision_status": decision_status,
        "authority_sha256": authorization["authority_sha256"],
        "authorized_head": authorization["head_sha"],
        "consumer_sha256": consumer_sha256,
        "prediction_lock_count": prediction_lock_count,
        "gate_lock_count": gate_lock_count,
    }


def build_authority_consumption_receipt(authorization: Mapping[str, object], terminal_summary: Mapping[str, object],
                                        publication_payload_sha256: str, workflow_run_id: str) -> dict:
    if not workflow_run_id:
        raise ContractError("workflow run identity is required for authority consumption receipt")
    return {
        "schema_version": "wr081-authority-consumption-receipt-v1",
        "task_id": str(authorization["task_id"]),
        "authority_sha256": authorization["authority_sha256"],
        "branch": authorization["branch"],
        "authorized_head": authorization["head_sha"],
        "consumer_path": authorization["consumer_path"],
        "consumer_sha256": authorization["consumer_sha256"],
        "workflow_run_id": workflow_run_id,
        "execution_status": terminal_summary["execution_status"],
        "result_terminal": terminal_summary["result_terminal"],
        "decision_status": terminal_summary["decision_status"],
        "publication_payload_sha256": publication_payload_sha256,
        "single_publication_commit_required": True,
    }


def validate_authority_consumption(control_repo: Path, execution_repo: Path, publication_head: str) -> dict:
    authorization = load_future_authorization(control_repo)
    if not HEX40.fullmatch(publication_head) or git_head(execution_repo) != publication_head:
        raise ContractError("publication head is not the checked-out execution head")
    try:
        parent = subprocess.check_output(
            ["git", "-C", str(execution_repo), "rev-parse", f"{publication_head}^"],
            text=True, stderr=subprocess.DEVNULL
        ).strip()
    except subprocess.SubprocessError as exc:
        raise ContractError("publication commit parent unavailable") from exc
    if parent != authorization["head_sha"]:
        raise ContractError("protected publication must advance the authorized head by exactly one commit")
    receipt_path = execution_repo / ".ai/research/generated/RETURNING_PLAYER_V21_AUTHORITY_CONSUMPTION_RECEIPT.json"
    try:
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ContractError("authority consumption receipt missing/invalid") from exc
    required = {
        "authority_sha256": authorization["authority_sha256"],
        "branch": authorization["branch"],
        "authorized_head": authorization["head_sha"],
        "consumer_path": authorization["consumer_path"],
        "consumer_sha256": authorization["consumer_sha256"],
    }
    if any(receipt.get(key) != value for key, value in required.items()) or receipt.get("single_publication_commit_required") is not True:
        raise ContractError("authority consumption receipt binding mismatch")
    return {
        **receipt,
        "publication_head": publication_head,
        "publication_parent_verified": True,
        "receipt_sha256": sha256_file(receipt_path)[0],
    }


def run_future_consumer(control_repo: Path, execution_repo: Path, execution_branch: str, expected_head: str,
                        consumer_relpath: str, consumer_sha256: str, manifest_path: Path, package_dir: Path) -> dict:
    assert_consumer_isolation(os.environ)
    authorization=validate_future_authorization(control_repo,execution_branch,expected_head,consumer_relpath,consumer_sha256)
    consumer=validate_future_consumer(execution_repo,authorization)
    manifest=load_verified_manifest(manifest_path); package_dir=require_runner_temp_child(package_dir)
    root=package_dir.parent/"wr097-v21-execution-sandbox"; cleanup_paths([package_dir,root]); package_dir.mkdir(parents=True); root.mkdir()
    consumer_copy=root/"consumer.py"; shutil.copyfile(consumer,consumer_copy)
    state=root/"state"; state.mkdir(); locks=root/"locks"; locks.mkdir(); visible=root/"visible"; output=root/"output"
    frozen:dict[str,tuple[str,int]]={}; prediction_locks:dict[str,str]={}; gate_locks:dict[str,str]={}
    terminal="COMPLETE"; decision_status="UNDECIDED"; chronology=[]
    try:
        for stage,years in STAGE_YEARS.items():
            for year in years:
                sources=copy_visible_sources(manifest,prediction_visible_seasons(year),visible)
                context={"task_id":TASK_ID,"mode":"predict","stage":stage,"target_season":year,"bindings":manifest["bindings"],
                         "visible_sources":sources,"prediction_locks":prediction_locks,"gate_locks":gate_locks}
                bridge=run_sandboxed_consumer(consumer_copy,"predict",context,visible,state,locks,output,manifest)
                if bridge.get("target_values_accessed") is not False:
                    raise ContractError("consumer reported target exposure during prediction")
                lock=lock_phase_output(output,locks,f"prediction-{year}",manifest)
                prediction_locks[str(year)]=lock; merge_publication(output,package_dir,frozen,manifest)
                chronology.append({"stage":stage,"target_season":year,"event":"PREDICTION_LOCKED","prediction_lock_sha256":lock})
                sources=copy_visible_sources(manifest,evaluation_visible_seasons(year),visible)
                context={"task_id":TASK_ID,"mode":"target-ingest","stage":stage,"target_season":year,"bindings":manifest["bindings"],
                         "visible_sources":sources,"prediction_lock_sha256":lock,"prediction_locks":prediction_locks,"gate_locks":gate_locks}
                bridge=run_sandboxed_consumer(consumer_copy,"target-ingest",context,visible,state,locks,output,manifest)
                if bridge.get("accepted_prediction_lock_sha256")!=lock or bridge.get("target_values_accessed") is not True:
                    raise ContractError("target ingest did not bind frozen prediction")
                target_lock=lock_phase_output(output,locks,f"target-{year}",manifest); merge_publication(output,package_dir,frozen,manifest)
                chronology.append({"stage":stage,"target_season":year,"event":"TARGET_EXPOSED_AFTER_LOCK",
                                   "prediction_lock_sha256":lock,"target_ingest_lock_sha256":target_lock})
            shutil.rmtree(visible,ignore_errors=True); visible.mkdir()
            lock_set=sha256_bytes(canonical_json_bytes({k:v for k,v in sorted(prediction_locks.items()) if int(k) in years}))
            prior_gate_locks={} if stage=="validation" else {"validation":gate_locks["validation"]}
            context={"task_id":TASK_ID,"mode":"stage-gate","stage":stage,"target_seasons":list(years),"bindings":manifest["bindings"],
                     "prediction_lock_set_sha256":lock_set,"prediction_locks":prediction_locks,"prior_gate_locks":prior_gate_locks}
            bridge=run_sandboxed_consumer(consumer_copy,"stage-gate",context,visible,state,locks,output,manifest)
            if bridge.get("stage")!=stage or not isinstance(bridge.get("gate_pass"),bool) or bridge.get("prediction_lock_set_sha256")!=lock_set:
                raise ContractError("stage gate result contract mismatch")
            decision_status=str(bridge.get("status_label") or "")
            if not decision_status:
                raise ContractError("stage gate decision status missing")
            gate_lock=lock_phase_output(output,locks,f"gate-{stage}",manifest); gate_locks[stage]=gate_lock
            merge_publication(output,package_dir,frozen,manifest)
            chronology.append({"stage":stage,"event":"STAGE_GATE","years":list(years),"gate_pass":bridge["gate_pass"],"gate_lock_sha256":gate_lock})
            if not bridge["gate_pass"]:
                terminal="VALIDATION_FAILED" if stage=="validation" else "CONFIRMATION_FAILED"
                break
        if terminal=="COMPLETE":
            terminal="CONFIRMATION_PASSED" if gate_locks.get("confirmation") else "VALIDATION_FAILED"
        chronology_artifact={"schema_version":"wr097-v21-protected-execution-chronology-v1","task_id":authorization["task_id"],
                             "authority_sha256":authorization["authority_sha256"],"consumer_sha256":consumer_sha256,
                             "bindings":manifest["bindings"],"prediction_locks":prediction_locks,"gate_locks":gate_locks,
                             "events":chronology,"terminal":terminal}
        _add_frozen_json(package_dir,frozen,".ai/research/generated/RETURNING_PLAYER_V21_EXECUTION_CHRONOLOGY.json",chronology_artifact,"chronology")
        result_manifest={"schema_version":"wr097-v21-result-manifest-v1","task_id":authorization["task_id"],
                         "protocol_id":PROTOCOL_ID,"protocol_sha256":PROTOCOL_SHA256,
                         "execution_status":"SUCCESS","result_terminal":terminal,"decision_status":decision_status,
                         "prediction_lock_count":len(prediction_locks),"gate_lock_count":len(gate_locks),
                         "authority_sha256":authorization["authority_sha256"],"consumer_sha256":consumer_sha256}
        _add_frozen_json(package_dir,frozen,".ai/research/generated/RETURNING_PLAYER_V21_RESULT_MANIFEST.json",result_manifest,"result manifest")
        terminal_summary=build_terminal_result_summary(authorization,consumer_sha256,terminal,decision_status,len(prediction_locks),len(gate_locks))
        _add_frozen_json(package_dir,frozen,".ai/research/generated/RETURNING_PLAYER_V21_TERMINAL_RESULT.json",terminal_summary,"terminal result")
        payload_entries=[{"path":rel,"sha256":identity[0],"byte_size":identity[1]} for rel,identity in sorted(frozen.items())]
        payload_sha256=sha256_bytes(canonical_json_bytes(payload_entries))
        receipt=build_authority_consumption_receipt(authorization,terminal_summary,payload_sha256,os.environ.get("GITHUB_RUN_ID",""))
        _add_frozen_json(package_dir,frozen,".ai/research/generated/RETURNING_PLAYER_V21_AUTHORITY_CONSUMPTION_RECEIPT.json",receipt,"authority receipt")
        write_package_manifest(package_dir,frozen,manifest)
        return {"status":"PASS","execution_status":"SUCCESS","terminal":terminal,"decision_status":decision_status,
                "authorization":authorization,"consumer_sha256":consumer_sha256,"publication_file_count":len(frozen),
                "prediction_lock_count":len(prediction_locks),"gate_lock_count":len(gate_locks),
                "authority_receipt_path":".ai/research/generated/RETURNING_PLAYER_V21_AUTHORITY_CONSUMPTION_RECEIPT.json"}
    except BaseException:
        cleanup_paths([package_dir,root]); raise
    finally:
        shutil.rmtree(root,ignore_errors=True)


def validate_publication_manifest(output_dir: Path, retained_manifest_path: Path) -> list[dict]:
    output_dir = require_runner_temp_child(output_dir)
    retained_manifest = load_verified_manifest(require_runner_temp_child(retained_manifest_path))
    return publication_entries(output_dir, retained_manifest)


def stage_publication(execution_repo: Path, output_dir: Path, retained_manifest_path: Path) -> list[str]:
    files = validate_publication_manifest(output_dir, retained_manifest_path); root = execution_repo.resolve(); staged = []
    for entry in files:
        rel = Path(entry["path"]); dest = (root / rel).resolve()
        if root not in dest.parents:
            raise ContractError("publication destination escaped execution repo")
        dest.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(output_dir / "files" / rel, dest); staged.append(str(rel))
    return staged


def main() -> int:
    parser=argparse.ArgumentParser(); sub=parser.add_subparsers(dest="command",required=True)
    p=sub.add_parser("authority"); p.add_argument("--repo-root",type=Path,default=Path("."))
    p=sub.add_parser("provider"); p.add_argument("--repo-root",type=Path,default=Path(".")); p.add_argument("--raw-dir",type=Path,required=True); p.add_argument("--manifest",type=Path,required=True); p.add_argument("--report",type=Path,required=True)
    p=sub.add_parser("no-scoring-consumer"); p.add_argument("--repo-root",type=Path,default=Path(".")); p.add_argument("--manifest",type=Path,required=True); p.add_argument("--report",type=Path,required=True); p.add_argument("--expected-commit",required=True); p.add_argument("--script-sha256",required=True); p.add_argument("--test-sha256",required=True); p.add_argument("--workflow-sha256",required=True); p.add_argument("--consumer-sha256",required=True); p.add_argument("--consumer-test-sha256",required=True)
    sub.add_parser("synthetic-conformance")
    sub.add_parser("sandbox-conformance")
    sub.add_parser("future-plan")
    p=sub.add_parser("future-authority"); p.add_argument("--repo-root",type=Path,default=Path("."))
    p=sub.add_parser("future-authorization"); p.add_argument("--repo-root",type=Path,default=Path(".")); p.add_argument("--execution-branch",required=True); p.add_argument("--expected-head",required=True); p.add_argument("--consumer-path",required=True); p.add_argument("--consumer-sha256",required=True)
    p=sub.add_parser("future-remote-head"); p.add_argument("--repo-root",type=Path,default=Path(".")); p.add_argument("--execution-branch",required=True); p.add_argument("--expected-head",required=True); p.add_argument("--consumer-path",required=True); p.add_argument("--consumer-sha256",required=True); p.add_argument("--observed-head",required=True)
    p=sub.add_parser("future-checkout"); p.add_argument("--repo-root",type=Path,default=Path(".")); p.add_argument("--execution-repo",type=Path,required=True); p.add_argument("--execution-branch",required=True); p.add_argument("--expected-head",required=True); p.add_argument("--consumer-path",required=True); p.add_argument("--consumer-sha256",required=True)
    p=sub.add_parser("future-execute"); p.add_argument("--repo-root",type=Path,default=Path(".")); p.add_argument("--execution-repo",type=Path,required=True); p.add_argument("--execution-branch",required=True); p.add_argument("--expected-head",required=True); p.add_argument("--consumer-path",required=True); p.add_argument("--consumer-sha256",required=True); p.add_argument("--manifest",type=Path,required=True); p.add_argument("--output-dir",type=Path,required=True)
    p=sub.add_parser("stage-publication"); p.add_argument("--execution-repo",type=Path,required=True); p.add_argument("--output-dir",type=Path,required=True); p.add_argument("--retained-manifest",type=Path,required=True)
    p=sub.add_parser("authority-consumption-check"); p.add_argument("--repo-root",type=Path,default=Path(".")); p.add_argument("--execution-repo",type=Path,required=True); p.add_argument("--publication-head",required=True)
    args=parser.parse_args()
    try:
        if args.command=="authority":
            sources,bindings=load_authority(args.repo_root.resolve()); print(json.dumps({"status":"PASS","source_count":len(sources),"bindings":bindings},sort_keys=True))
        elif args.command=="provider": provider_phase(args.repo_root.resolve(),args.raw_dir,args.manifest,args.report)
        elif args.command=="no-scoring-consumer": no_scoring_consumer(args.repo_root.resolve(),args.manifest,args.report,args.expected_commit,args.script_sha256,args.test_sha256,args.workflow_sha256,args.consumer_sha256,args.consumer_test_sha256)
        elif args.command=="synthetic-conformance": print(json.dumps(synthetic_conformance(),sort_keys=True))
        elif args.command=="sandbox-conformance": print(json.dumps(synthetic_sandbox_conformance(),sort_keys=True))
        elif args.command=="future-plan": print(json.dumps(future_execution_plan(),sort_keys=True))
        elif args.command=="future-authority": print(json.dumps(load_future_authorization(args.repo_root.resolve()),sort_keys=True))
        elif args.command=="future-authorization":
            print(json.dumps(validate_future_authorization(args.repo_root.resolve(),args.execution_branch,args.expected_head,args.consumer_path,args.consumer_sha256),sort_keys=True))
        elif args.command=="future-remote-head":
            authorization=validate_future_authorization(args.repo_root.resolve(),args.execution_branch,args.expected_head,args.consumer_path,args.consumer_sha256); validate_live_remote_head(authorization,args.observed_head); print(json.dumps({"status":"PASS","authority_sha256":authorization["authority_sha256"]},sort_keys=True))
        elif args.command=="future-checkout":
            authorization=validate_future_authorization(args.repo_root.resolve(),args.execution_branch,args.expected_head,args.consumer_path,args.consumer_sha256); consumer=validate_future_consumer(args.execution_repo.resolve(),authorization); print(json.dumps({"status":"PASS","authority_sha256":authorization["authority_sha256"],"consumer_sha256":sha256_file(consumer)[0]},sort_keys=True))
        elif args.command=="future-execute": print(json.dumps(run_future_consumer(args.repo_root.resolve(),args.execution_repo.resolve(),args.execution_branch,args.expected_head,args.consumer_path,args.consumer_sha256,args.manifest,args.output_dir),sort_keys=True))
        elif args.command=="stage-publication": print(json.dumps({"status":"PASS","files":stage_publication(args.execution_repo.resolve(),args.output_dir,args.retained_manifest)},sort_keys=True))
        elif args.command=="authority-consumption-check": print(json.dumps(validate_authority_consumption(args.repo_root.resolve(),args.execution_repo.resolve(),args.publication_head),sort_keys=True))
        return 0
    except (ContractError,OSError,ValueError,subprocess.SubprocessError) as exc:
        print(f"WR-097 FAIL CLOSED: {exc}",file=sys.stderr); return 2


if __name__=="__main__": raise SystemExit(main())
