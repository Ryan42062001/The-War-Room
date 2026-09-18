#!/usr/bin/env python3
"""WR-083 protected retained-row execution bridge.

Pre-audit mode is intentionally NO-SCORING: exact retained bytes are verified but
never parsed into historical features or targets. Future scoring mode is a
separately gated transport/execution wrapper for a Manager-authorized WR-081
consumer after WR-084 acceptance and canonical-main integration.
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

TASK_ID = "WR-083"
SOURCE_SNAPSHOT_PATH = Path(".ai/research/generated/WR059_RETURNING_PLAYER_V2_SOURCE_SNAPSHOT.json")
COHORT_PATH = Path(".ai/research/generated/WR059_RETURNING_PLAYER_V2_COHORT_SOURCE_ELIGIBILITY.json")
PROTOCOL_PATH = Path(".ai/research/generated/WR072_RETURNING_PLAYER_V2_MODEL_PROTOCOL.json")
SOURCE_SNAPSHOT_ID = "wr-returning-player-v2-source-snapshot/1.2.0-wr059"
SOURCE_SNAPSHOT_SHA256 = "6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea"
COHORT_ID = "returning-player-v2-cohort/1.2.0-wr059"
COHORT_SHA256 = "f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4"
PROTOCOL_ID = "returning-player-v2-model-protocol/1.2.0-wr072"
PROTOCOL_SHA256 = "aed044e6b7df9684153181a7a97a47a86c50ce9049db063ecdd8a973b1a832b6"
RESULT_GATES_ID = "returning-player-v2-result-gates/1.2.0-wr072"
EXPECTED_SOURCE_COUNT = 14
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


class ContractError(RuntimeError):
    """Fail-closed WR-083 contract violation."""


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
    spec = importlib.util.spec_from_file_location("wr083_wr063_read", path)
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
    if ((p.get("ids") or {}).get("protocol")) != PROTOCOL_ID or ((p.get("ids") or {}).get("gates")) != RESULT_GATES_ID:
        raise ContractError("WR-072 protocol identity mismatch")
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
        manifest = {"schema_version":"wr083-verified-local-input-manifest-v1","task_id":TASK_ID,"bindings":bindings,
                    "input_count":EXPECTED_SOURCE_COUNT,"sources":manifest_sources}
        manifest_sha = write_json(manifest_path, manifest)
        write_json(report_path, {
            "schema_version":"wr083-provider-proof-v1","task_id":TASK_ID,"result":"PASS","bindings":bindings,
            "verified_input_count":EXPECTED_SOURCE_COUNT,"b2_boundary":auth["boundary"],"objects":objects,
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
    if payload.get("schema_version") != "wr083-verified-local-input-manifest-v1" or payload.get("input_count") != EXPECTED_SOURCE_COUNT:
        raise ContractError("verified local manifest shape mismatch")
    sources = payload.get("sources")
    if not isinstance(sources, list) or len(sources) != EXPECTED_SOURCE_COUNT:
        raise ContractError("verified local manifest source set mismatch")
    return payload


@dataclass
class ChronologyGuard:
    stages: tuple[str, ...] = ("development", "validation", "confirmation")
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
    guard = ChronologyGuard(); pred = sha256_bytes(b"synthetic-predictions"); target = sha256_bytes(b"synthetic-targets")
    fail_closed = 0
    try: guard.expose_targets(target)
    except ContractError: fail_closed += 1
    guard.begin("development"); guard.lock_predictions(pred); guard.expose_targets(target); guard.finish(True)
    try: guard.begin("confirmation")
    except ContractError: fail_closed += 1
    guard.begin("validation"); guard.lock_predictions(pred); guard.expose_targets(target); guard.finish(True)
    guard.begin("confirmation"); guard.lock_predictions(pred); guard.expose_targets(target); guard.finish(True)
    serialized = guard.serialize()
    if tuple(guard.completed) != guard.stages or fail_closed != 2:
        raise ContractError("synthetic chronology conformance mismatch")
    return {"status":"PASS","fail_closed_cases":fail_closed,"completed_stages":list(guard.completed),
            "serialization_sha256":sha256_bytes(serialized)}


def git_head(repo_root: Path) -> str:
    try:
        return subprocess.check_output(["git","-C",str(repo_root),"rev-parse","HEAD"], text=True, stderr=subprocess.DEVNULL).strip()
    except subprocess.CalledProcessError as exc:
        raise ContractError("git head unavailable") from exc


def verify_reviewed_code(repo_root: Path, expected_commit: str, expected_script_sha: str,
                         expected_test_sha: str, expected_workflow_sha: str) -> dict:
    if not HEX40.fullmatch(expected_commit) or git_head(repo_root) != expected_commit:
        raise ContractError("implementation commit binding mismatch")
    paths = {
        "script": repo_root / "scripts/custody/wr083_protected_historical_scoring.py",
        "test": repo_root / "scripts/custody/test_wr083_protected_historical_scoring.py",
        "workflow": repo_root / ".github/workflows/wr083-protected-historical-scoring-bridge.yml",
    }
    expected = {"script":expected_script_sha,"test":expected_test_sha,"workflow":expected_workflow_sha}
    actual = {}
    for name, path in paths.items():
        digest, _ = sha256_file(path); actual[name] = digest
        if digest != expected[name]: raise ContractError(f"reviewed {name} digest mismatch")
    return {"implementation_commit":expected_commit,"file_sha256":actual}


def no_scoring_consumer(repo_root: Path, manifest_path: Path, report_path: Path, expected_commit: str,
                        script_sha: str, test_sha: str, workflow_sha: str) -> None:
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
    code = verify_reviewed_code(repo_root, expected_commit, script_sha, test_sha, workflow_sha)
    conformance = synthetic_conformance()
    write_json(report_path, {
        "schema_version":"wr083-no-scoring-consumer-proof-v1","task_id":TASK_ID,"result":"PASS","bindings":bindings,
        "consumer_provider_credential_presence":False,"consumer_rehash_resize_pass_count":verified,"reviewed_code_binding":code,
        "synthetic_chronology_conformance":conformance,"real_retained_csv_parsed":False,"historical_features_constructed":False,
        "historical_targets_exposed":False,"model_fit":False,"predictions_emitted":False,"baselines_compared":False,
        "result_gates_calculated":False,"development_outcomes_inspected":False,"validation_outcomes_inspected":False,
        "confirmation_outcomes_inspected":False,"regular_season_2026_outcomes_inspected":False,
    })


def validate_future_consumer(execution_repo: Path, execution_branch: str, expected_head: str,
                             consumer_relpath: str, consumer_sha256: str, output_dir: Path) -> Path:
    if execution_branch == "main" or not execution_branch.startswith("wr-081-"):
        raise ContractError("future execution branch must be an explicit WR-081 branch, never main")
    if not HEX40.fullmatch(expected_head) or git_head(execution_repo) != expected_head:
        raise ContractError("WR-081 expected-head race gate failed")
    rel = Path(consumer_relpath)
    if rel.is_absolute() or not str(rel).startswith(".ai/research/") or ".." in rel.parts:
        raise ContractError("future scoring consumer must be under .ai/research/**")
    consumer = (execution_repo / rel).resolve(); root = execution_repo.resolve()
    if root not in consumer.parents or not consumer.is_file(): raise ContractError("future scoring consumer unavailable")
    if not HEX64.fullmatch(consumer_sha256) or sha256_file(consumer)[0] != consumer_sha256:
        raise ContractError("future scoring consumer digest mismatch")
    require_runner_temp_child(output_dir)
    return consumer


def validate_publication_manifest(output_dir: Path) -> list[dict]:
    output_dir = require_runner_temp_child(output_dir)
    manifest = output_dir / "publication-manifest.json"
    try: payload = json.loads(manifest.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc: raise ContractError("publication manifest missing/invalid") from exc
    files = payload.get("files")
    if not isinstance(files, list) or not files: raise ContractError("publication manifest has no files")
    checked=[]
    for entry in files:
        rel = str(entry.get("path") or ""); expected = str(entry.get("sha256") or ""); size=int(entry.get("byte_size") or -1)
        path = Path(rel)
        if path.is_absolute() or not rel.startswith(".ai/research/") or ".." in path.parts or not HEX64.fullmatch(expected) or size < 0:
            raise ContractError("publication manifest path/digest boundary violation")
        staged = output_dir / "files" / path
        if sha256_file(staged) != (expected,size): raise ContractError("publication file digest/size mismatch")
        checked.append({"path":rel,"sha256":expected,"byte_size":size})
    return checked


def run_future_consumer(repo_root: Path, execution_repo: Path, execution_branch: str, expected_head: str,
                        consumer_relpath: str, consumer_sha256: str, manifest_path: Path, output_dir: Path) -> dict:
    assert_consumer_isolation(os.environ)
    consumer = validate_future_consumer(execution_repo, execution_branch, expected_head, consumer_relpath, consumer_sha256, output_dir)
    load_verified_manifest(manifest_path)
    cleanup_paths([output_dir]); output_dir.mkdir(parents=True,mode=0o700)
    env={"PATH":os.environ.get("PATH","/usr/local/bin:/usr/bin:/bin"),"RUNNER_TEMP":os.environ["RUNNER_TEMP"],"LANG":"C.UTF-8","LC_ALL":"C.UTF-8"}
    args=[sys.executable,str(consumer),"--wr083-input-manifest",str(manifest_path),"--wr083-output-dir",str(output_dir),
          "--wr083-source-snapshot",str(repo_root/SOURCE_SNAPSHOT_PATH),"--wr083-cohort",str(repo_root/COHORT_PATH),
          "--wr083-protocol",str(repo_root/PROTOCOL_PATH)]
    result=subprocess.run(args,cwd=execution_repo,env=env,stdin=subprocess.DEVNULL,check=False)
    if result.returncode: cleanup_paths([output_dir]); raise ContractError(f"future WR-081 consumer exited {result.returncode}")
    files=validate_publication_manifest(output_dir)
    return {"status":"PASS","execution_branch":execution_branch,"expected_head":expected_head,
            "consumer_sha256":consumer_sha256,"publication_file_count":len(files),"publication_files":files}


def stage_publication(execution_repo: Path, output_dir: Path) -> list[str]:
    files=validate_publication_manifest(output_dir); root=execution_repo.resolve(); staged=[]
    for entry in files:
        rel=Path(entry["path"]); dest=(root/rel).resolve()
        if root not in dest.parents: raise ContractError("publication destination escaped execution repo")
        dest.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(output_dir/"files"/rel,dest); staged.append(str(rel))
    return staged


def main() -> int:
    parser=argparse.ArgumentParser(); sub=parser.add_subparsers(dest="command",required=True)
    p=sub.add_parser("authority"); p.add_argument("--repo-root",type=Path,default=Path("."))
    p=sub.add_parser("provider"); p.add_argument("--repo-root",type=Path,default=Path(".")); p.add_argument("--raw-dir",type=Path,required=True); p.add_argument("--manifest",type=Path,required=True); p.add_argument("--report",type=Path,required=True)
    p=sub.add_parser("no-scoring-consumer"); p.add_argument("--repo-root",type=Path,default=Path(".")); p.add_argument("--manifest",type=Path,required=True); p.add_argument("--report",type=Path,required=True); p.add_argument("--expected-commit",required=True); p.add_argument("--script-sha256",required=True); p.add_argument("--test-sha256",required=True); p.add_argument("--workflow-sha256",required=True)
    sub.add_parser("synthetic-conformance")
    p=sub.add_parser("future-execute"); p.add_argument("--repo-root",type=Path,default=Path(".")); p.add_argument("--execution-repo",type=Path,required=True); p.add_argument("--execution-branch",required=True); p.add_argument("--expected-head",required=True); p.add_argument("--consumer-path",required=True); p.add_argument("--consumer-sha256",required=True); p.add_argument("--manifest",type=Path,required=True); p.add_argument("--output-dir",type=Path,required=True)
    p=sub.add_parser("stage-publication"); p.add_argument("--execution-repo",type=Path,required=True); p.add_argument("--output-dir",type=Path,required=True)
    args=parser.parse_args()
    try:
        if args.command=="authority":
            sources,bindings=load_authority(args.repo_root.resolve()); print(json.dumps({"status":"PASS","source_count":len(sources),"bindings":bindings},sort_keys=True))
        elif args.command=="provider": provider_phase(args.repo_root.resolve(),args.raw_dir,args.manifest,args.report)
        elif args.command=="no-scoring-consumer": no_scoring_consumer(args.repo_root.resolve(),args.manifest,args.report,args.expected_commit,args.script_sha256,args.test_sha256,args.workflow_sha256)
        elif args.command=="synthetic-conformance": print(json.dumps(synthetic_conformance(),sort_keys=True))
        elif args.command=="future-execute": print(json.dumps(run_future_consumer(args.repo_root.resolve(),args.execution_repo.resolve(),args.execution_branch,args.expected_head,args.consumer_path,args.consumer_sha256,args.manifest,args.output_dir),sort_keys=True))
        elif args.command=="stage-publication": print(json.dumps({"status":"PASS","files":stage_publication(args.execution_repo.resolve(),args.output_dir)},sort_keys=True))
        return 0
    except (ContractError,OSError,ValueError,subprocess.SubprocessError) as exc:
        print(f"WR-083 FAIL CLOSED: {exc}",file=sys.stderr); return 2


if __name__=="__main__": raise SystemExit(main())
