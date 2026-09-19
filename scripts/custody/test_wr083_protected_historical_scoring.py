#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2] if "scripts" in pathlib.Path(__file__).parts else pathlib.Path.cwd()
MODULE_PATH = ROOT / "scripts/custody/wr083_protected_historical_scoring.py"
if not MODULE_PATH.exists():
    MODULE_PATH = pathlib.Path(__file__).with_name("wr083_protected_historical_scoring.py")
spec = importlib.util.spec_from_file_location("wr083", MODULE_PATH)
assert spec and spec.loader
wr083 = importlib.util.module_from_spec(spec); sys.modules[spec.name] = wr083; spec.loader.exec_module(wr083)


def must_fail(fn, phrase: str | None = None):
    try:
        fn()
    except wr083.ContractError as exc:
        if phrase is not None:
            assert phrase in str(exc), (phrase, str(exc))
        return
    raise AssertionError("expected ContractError")


def test_authority_exact_14() -> None:
    if not (ROOT / wr083.SOURCE_SNAPSHOT_PATH).exists():
        return
    sources, bindings = wr083.load_authority(ROOT)
    assert len(sources) == 14
    assert [s["season"] for s in sources] == list(range(2012, 2026))
    assert len({s["custody_key"] for s in sources}) == 14
    assert bindings["players_metadata_admitted_count"] == 0
    assert bindings["draft_picks_csv_used"] is False
    assert bindings["source_snapshot"]["sha256"] == wr083.SOURCE_SNAPSHOT_SHA256
    assert bindings["cohort"]["sha256"] == wr083.COHORT_SHA256
    assert bindings["protocol"]["sha256"] == wr083.PROTOCOL_SHA256
    assert wr083.ACCEPTED_R2_ACCESS_KEY_ID_SHA256 == "17e95438e19777a414ee85d57c32d44466199a973c51e5b6f57e42a5384585bd"
    assert wr083.R2_SCOPE_AUTHORITY == ".ai/auditor/WR-053_AUDIT.md"
    assert wr083.R2_SCOPE_POLICY_AUTHORITY == ".ai/auditor/WR-050_AUDIT.md"


def test_consumer_isolation() -> None:
    clean = {"PATH": os.environ.get("PATH", "")}
    wr083.assert_consumer_isolation(clean)
    dirty = dict(clean); dirty["WR_CUSTODY_R2_ENDPOINT"] = "injected"
    must_fail(lambda: wr083.assert_consumer_isolation(dirty), "provider authority")


def test_chronology_fail_closed_and_serialization() -> None:
    c = wr083.ChronologyGuard(); p = hashlib.sha256(b"p").hexdigest(); t = hashlib.sha256(b"t").hexdigest()
    must_fail(lambda: c.expose_targets(t), "before prediction lock")
    c.begin("development"); must_fail(lambda: c.expose_targets(t), "before prediction lock")
    c.lock_predictions(p); c.expose_targets(t); c.finish(True)
    must_fail(lambda: c.begin("confirmation"), "chronology")
    c.begin("validation"); c.lock_predictions(p); c.expose_targets(t); c.finish(True)
    c.begin("confirmation"); c.lock_predictions(p); c.expose_targets(t); c.finish(True)
    one = c.serialize(); two = c.serialize(); assert one == two
    result = wr083.synthetic_conformance()
    assert result["status"] == "PASS" and result["fail_closed_cases"] == 2


def git_init_with_consumer(root: pathlib.Path) -> tuple[str, str]:
    subprocess.run(["git","init"],cwd=root,check=True,stdout=subprocess.DEVNULL)
    subprocess.run(["git","config","user.email","wr083@example.invalid"],cwd=root,check=True)
    subprocess.run(["git","config","user.name","WR083 Test"],cwd=root,check=True)
    rel = pathlib.Path(".ai/research/synthetic_consumer.py"); path = root / rel; path.parent.mkdir(parents=True)
    path.write_text("print('synthetic')\n", encoding="utf-8")
    subprocess.run(["git","add","."],cwd=root,check=True); subprocess.run(["git","commit","-m","synthetic"],cwd=root,check=True,stdout=subprocess.DEVNULL)
    head=subprocess.check_output(["git","rev-parse","HEAD"],cwd=root,text=True).strip()
    digest=hashlib.sha256(path.read_bytes()).hexdigest(); return head,digest


def manager_authority(root: pathlib.Path, head: str, digest: str,
                      branch: str = "wr-081-execution",
                      consumer_path: str = ".ai/research/synthetic_consumer.py") -> dict:
    control=root/".ai/shared"; control.mkdir(parents=True, exist_ok=True)
    authority={"branch":branch,"head_sha":head,"consumer_path":consumer_path,"consumer_sha256":digest}
    active={
        "schema_version":3,"canonical_branch":"main","manager_owned":True,
        "tasks":[{
            "task_id":"WR-081","branch":branch,"status":"IN_PROGRESS","blocker_type":"NONE","blocked_on_tasks":[],
            wr083.MANAGER_EXECUTION_AUTHORITY_KEY:authority,
        }],
    }
    (control/"ACTIVE_TASKS.json").write_text(json.dumps(active)+"\n")
    return authority


def synthetic_retained_manifest(runner: pathlib.Path) -> tuple[dict, pathlib.Path, bytes]:
    raw_dir=runner/"retained"; raw_dir.mkdir(parents=True, exist_ok=True)
    sources=[]; first=b"retained-raw-00\n"
    for season in range(2012,2026):
        data=(first if season==2012 else f"retained-raw-{season}\n".encode())
        raw=raw_dir/f"{season}.raw"; raw.write_bytes(data); digest=hashlib.sha256(data).hexdigest()
        sources.append({"season":season,"source_id":f"synthetic-{season}","local_path":str(raw),
                        "expected_sha256":digest,"expected_size_bytes":len(data)})
    manifest={"schema_version":"wr083-verified-local-input-manifest-v1","task_id":"WR-083","bindings":{},
              "input_count":14,"sources":sources}
    path=runner/"verified-manifest.json"; path.write_text(json.dumps(manifest)+"\n")
    return manifest,path,first


def test_future_manager_bound_identity_gates() -> None:
    with tempfile.TemporaryDirectory() as td:
        repo=pathlib.Path(td); head,digest=git_init_with_consumer(repo)
        authority=manager_authority(repo,head,digest)
        loaded=wr083.load_future_authorization(repo)
        assert loaded["branch"] == authority["branch"] and loaded["head_sha"] == head
        approved=wr083.validate_future_authorization(repo,authority["branch"],head,authority["consumer_path"],digest)
        assert approved["authority_sha256"] == hashlib.sha256(
            wr083.canonical_json_bytes(authority)
        ).hexdigest()
        assert wr083.validate_future_consumer(repo,approved).is_file()
        wr083.validate_live_remote_head(approved,head)

        # Unreviewed workflow-dispatch identity must never substitute for Manager authority.
        must_fail(lambda: wr083.validate_future_authorization(
            repo,authority["branch"],"0"*40,authority["consumer_path"],digest
        ),"not Manager-authorized")
        must_fail(lambda: wr083.validate_future_authorization(
            repo,authority["branch"],head,".ai/research/unreviewed_consumer.py",digest
        ),"not Manager-authorized")
        must_fail(lambda: wr083.validate_future_authorization(
            repo,authority["branch"],head,authority["consumer_path"],"0"*64
        ),"not Manager-authorized")

        # Stale authorized-branch SHA and branch advancement both fail before consumer exposure.
        subprocess.run(["git","checkout","-b",authority["branch"]],cwd=repo,check=True,stdout=subprocess.DEVNULL)
        (repo/"advance.txt").write_text("advance\n")
        subprocess.run(["git","add","advance.txt"],cwd=repo,check=True)
        subprocess.run(["git","commit","-m","advance"],cwd=repo,check=True,stdout=subprocess.DEVNULL)
        advanced=subprocess.check_output(["git","rev-parse","HEAD"],cwd=repo,text=True).strip()
        must_fail(lambda: wr083.validate_live_remote_head(approved,advanced),"live authorized")
        must_fail(lambda: wr083.validate_future_consumer(repo,approved),"checked-out head")

        # Explicitly model branch advancement between initial authorization and execution.
        subprocess.run(["git","checkout",head],cwd=repo,check=True,stdout=subprocess.DEVNULL)
        wr083.validate_live_remote_head(approved,head)
        must_fail(lambda: wr083.validate_live_remote_head(approved,advanced),"live authorized")


def test_manager_authorization_and_fold_visibility() -> None:
    with tempfile.TemporaryDirectory() as td:
        root=pathlib.Path(td); repo=root/"repo"; repo.mkdir(); head,digest=git_init_with_consumer(repo)
        authority=manager_authority(root,head,digest)
        assert wr083.validate_future_authorization(root,authority["branch"],head,authority["consumer_path"],digest)["status"]=="PASS"
        payload=json.loads((root/".ai/shared/ACTIVE_TASKS.json").read_text())
        payload["tasks"][0]["blocker_type"]="AUDIT"; (root/".ai/shared/ACTIVE_TASKS.json").write_text(json.dumps(payload)+"\n")
        must_fail(lambda: wr083.validate_future_authorization(root,authority["branch"],head,authority["consumer_path"],digest),"blocker")
        payload["tasks"][0]["blocker_type"]="NONE"; payload["tasks"][0].pop(wr083.MANAGER_EXECUTION_AUTHORITY_KEY)
        (root/".ai/shared/ACTIVE_TASKS.json").write_text(json.dumps(payload)+"\n")
        must_fail(lambda: wr083.validate_future_authorization(root,authority["branch"],head,authority["consumer_path"],digest),"authority is absent")
    plan=wr083.future_execution_plan(); assert len(plan["folds"])==8
    for fold in plan["folds"]:
        y=fold["target_season"]; assert y not in fold["predict_visible_seasons"]
        assert fold["target_visible_seasons"]==[y]
        assert max(fold["predict_visible_seasons"])==y-1
    assert plan["network"]=="UNSHARED" and plan["master_raw_visibility"] is False


def test_frozen_publication_paths_cannot_mutate() -> None:
    with tempfile.TemporaryDirectory() as runner:
        old=os.environ.get("RUNNER_TEMP"); os.environ["RUNNER_TEMP"]=runner
        try:
            root=pathlib.Path(runner); retained,_,_=synthetic_retained_manifest(root)
            package=root/"package"; package.mkdir(); frozen={}
            def make_out(value:str):
                out=root/"out"; import shutil; shutil.rmtree(out,ignore_errors=True)
                f=out/"files/.ai/research/generated/WR081_FOLD.json"; f.parent.mkdir(parents=True); f.write_text(value)
                d=hashlib.sha256(f.read_bytes()).hexdigest(); (out/"publication-manifest.json").write_text(json.dumps({"files":[{"path":".ai/research/generated/WR081_FOLD.json","sha256":d,"byte_size":f.stat().st_size}]})+"\n")
                return out
            wr083.merge_publication(make_out("one\n"),package,frozen,retained)
            must_fail(lambda: wr083.merge_publication(make_out("two\n"),package,frozen,retained),"mutate")
        finally:
            if old is None: os.environ.pop("RUNNER_TEMP",None)
            else: os.environ["RUNNER_TEMP"]=old


def test_publication_manifest_restricts_paths_and_raw_passthrough() -> None:
    with tempfile.TemporaryDirectory() as runner, tempfile.TemporaryDirectory() as repo_td:
        old=os.environ.get("RUNNER_TEMP"); os.environ["RUNNER_TEMP"]=runner
        try:
            root=pathlib.Path(runner); retained,retained_path,raw_bytes=synthetic_retained_manifest(root)
            out=root/"out"; file=out/"files/.ai/research/generated/WR081_RESULT.json"; file.parent.mkdir(parents=True); file.write_text("{}\n")
            digest=hashlib.sha256(file.read_bytes()).hexdigest(); size=file.stat().st_size
            (out/"publication-manifest.json").write_text(json.dumps({"files":[{"path":".ai/research/generated/WR081_RESULT.json","sha256":digest,"byte_size":size}]})+"\n")
            checked=wr083.validate_publication_manifest(out,retained_path); assert len(checked)==1
            staged=wr083.stage_publication(pathlib.Path(repo_td),out,retained_path); assert staged==[".ai/research/generated/WR081_RESULT.json"]

            # Path/type allowlist is narrower than arbitrary .ai/research/**.
            bad=out/"publication-manifest.json"; bad.write_text(json.dumps({"files":[{"path":".ai/research/generated/result.json","sha256":digest,"byte_size":size}]})+"\n")
            must_fail(lambda: wr083.validate_publication_manifest(out,retained_path),"path/type")

            # Exact retained bytes remain rejected even under an otherwise allowed WR-081 evidence path.
            raw=out/"files/.ai/research/generated/WR081_RAW_COPY.json"; raw.write_bytes(raw_bytes)
            raw_digest=hashlib.sha256(raw_bytes).hexdigest()
            bad.write_text(json.dumps({"files":[{"path":".ai/research/generated/WR081_RAW_COPY.json","sha256":raw_digest,"byte_size":len(raw_bytes)}]})+"\n")
            must_fail(lambda: wr083.validate_publication_manifest(out,retained_path),"retained raw source")
            must_fail(lambda: wr083.stage_publication(pathlib.Path(repo_td),out,retained_path),"retained raw source")
        finally:
            if old is None: os.environ.pop("RUNNER_TEMP",None)
            else: os.environ["RUNNER_TEMP"]=old


def test_terminal_summary_and_authority_consumption_receipt() -> None:
    with tempfile.TemporaryDirectory() as td:
        repo=pathlib.Path(td); head,digest=git_init_with_consumer(repo)
        authority=manager_authority(repo,head,digest)
        loaded=wr083.load_future_authorization(repo)
        summary=wr083.build_terminal_result_summary(loaded,digest,"VALIDATION_FAILED","BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE",4,2)
        assert summary["execution_status"]=="SUCCESS"
        assert summary["result_terminal"]=="VALIDATION_FAILED"
        receipt=wr083.build_authority_consumption_receipt(loaded,summary,"f"*64,"12345")
        subprocess.run(["git","checkout","-b",authority["branch"]],cwd=repo,check=True,stdout=subprocess.DEVNULL)
        path=repo/".ai/research/generated/WR081_AUTHORITY_CONSUMPTION_RECEIPT.json"; path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(wr083.canonical_json_bytes(receipt))
        subprocess.run(["git","add",str(path.relative_to(repo))],cwd=repo,check=True)
        subprocess.run(["git","commit","-m","protected publication"],cwd=repo,check=True,stdout=subprocess.DEVNULL)
        publication=subprocess.check_output(["git","rev-parse","HEAD"],cwd=repo,text=True).strip()
        checked=wr083.validate_authority_consumption(repo,repo,publication)
        assert checked["authorized_head"]==head and checked["publication_head"]==publication
        assert checked["publication_parent_verified"] is True
        (repo/"second.txt").write_text("second\n"); subprocess.run(["git","add","second.txt"],cwd=repo,check=True)
        subprocess.run(["git","commit","-m","second"],cwd=repo,check=True,stdout=subprocess.DEVNULL)
        second=subprocess.check_output(["git","rev-parse","HEAD"],cwd=repo,text=True).strip()
        must_fail(lambda: wr083.validate_authority_consumption(repo,repo,second),"exactly one commit")


def test_cleanup_helper() -> None:
    with tempfile.TemporaryDirectory() as td:
        root=pathlib.Path(td); raw=root/"raw"; raw.mkdir(); (raw/"source.raw").write_bytes(b"synthetic-not-retained")
        manifest=root/"manifest.json"; manifest.write_text("{}")
        wr083.cleanup_paths([raw,manifest]); assert not raw.exists() and not manifest.exists()


def test_workflow_static_security_and_release_guard() -> None:
    workflow = ROOT / ".github/workflows/wr083-protected-historical-scoring-bridge.yml"
    release = ROOT / "scripts/validate-release-candidate.mjs"
    if not workflow.exists() or not release.exists():
        return
    text=workflow.read_text(); guard=release.read_text()
    assert "pull_request_target" not in text
    assert "runs-on: ubuntu-24.04" in text
    assert "permissions:\n  contents: read" in text
    assert "persist-credentials: false" in text
    assert "[wr083-no-scoring-proof]" in text
    assert "refs/heads/main" in text and "authorized-wr081-scoring" in text
    script=(ROOT / "scripts/custody/wr083_protected_historical_scoring.py").read_text()
    dispatch=text.split("workflow_dispatch:",1)[1].split("permissions:",1)[0]
    assert "execution_branch:" not in dispatch and "expected_head_sha:" not in dispatch and "consumer_path:" not in dispatch and "consumer_sha256:" not in dispatch
    assert "future-authority" in text and "future-authorization" in text and "ACTIVE_TASKS.json" in script
    assert "authority-consumption-check" in text and "WR081_AUTHORITY_CONSUMPTION_RECEIPT.json" in script
    assert "WR081_TERMINAL_RESULT.json" in script
    assert "future-remote-head" in text and "future-checkout" in text
    assert "future_execution_authority" in script and "live authorized WR-081 branch head mismatch" in script
    assert "--retained-manifest" in text and "publication exactly matches retained raw source" in script
    assert "sandbox-conformance" in text and "--unshare-net" in script
    assert "actions/upload-artifact" not in text
    assert ".github/workflows/wr083-protected-historical-scoring-bridge.yml" in guard
    assert "tracked.filter(file => file.startsWith('.github/workflows/')).sort()" in guard
    assert "assert.deepEqual" in guard


def main() -> int:
    test_authority_exact_14(); test_consumer_isolation(); test_chronology_fail_closed_and_serialization()
    test_future_manager_bound_identity_gates(); test_manager_authorization_and_fold_visibility()
    test_frozen_publication_paths_cannot_mutate(); test_publication_manifest_restricts_paths_and_raw_passthrough()
    test_terminal_summary_and_authority_consumption_receipt()
    test_cleanup_helper(); test_workflow_static_security_and_release_guard()
    print("WR-083 protected historical scoring bridge regressions: PASS")
    return 0


if __name__ == "__main__": raise SystemExit(main())
