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


def test_future_branch_head_and_consumer_digest_gates() -> None:
    with tempfile.TemporaryDirectory() as td, tempfile.TemporaryDirectory() as runner:
        repo=pathlib.Path(td); head,digest=git_init_with_consumer(repo)
        old=os.environ.get("RUNNER_TEMP"); os.environ["RUNNER_TEMP"]=runner
        try:
            must_fail(lambda: wr083.validate_future_consumer(repo,"main",head,".ai/research/synthetic_consumer.py",digest),"never main")
            must_fail(lambda: wr083.validate_future_consumer(repo,"wr-081-execution","0"*40,".ai/research/synthetic_consumer.py",digest),"race gate")
            must_fail(lambda: wr083.validate_future_consumer(repo,"wr-081-execution",head,"scripts/no.py",digest),".ai/research")
            must_fail(lambda: wr083.validate_future_consumer(repo,"wr-081-execution",head,".ai/research/synthetic_consumer.py","0"*64),"digest")
            assert wr083.validate_future_consumer(repo,"wr-081-execution",head,".ai/research/synthetic_consumer.py",digest).is_file()
        finally:
            if old is None: os.environ.pop("RUNNER_TEMP",None)
            else: os.environ["RUNNER_TEMP"]=old


def test_manager_authorization_and_fold_visibility() -> None:
    with tempfile.TemporaryDirectory() as td:
        root=pathlib.Path(td); control=root/".ai/shared"; control.mkdir(parents=True)
        active={"tasks":[{"task_id":"WR-081","branch":"wr-081-execution","status":"IN_PROGRESS","blocker_type":"NONE","blocked_on_tasks":[]}]}
        (control/"ACTIVE_TASKS.json").write_text(json.dumps(active)+"\n")
        assert wr083.validate_future_authorization(root,"wr-081-execution")["status"]=="PASS"
        active["tasks"][0]["blocker_type"]="AUDIT"; (control/"ACTIVE_TASKS.json").write_text(json.dumps(active)+"\n")
        must_fail(lambda: wr083.validate_future_authorization(root,"wr-081-execution"),"blocker")
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
            package=pathlib.Path(runner)/"package"; package.mkdir(); frozen={}
            def make_out(value:str):
                out=pathlib.Path(runner)/"out"; import shutil; shutil.rmtree(out,ignore_errors=True)
                f=out/"files/.ai/research/generated/FOLD.json"; f.parent.mkdir(parents=True); f.write_text(value)
                d=hashlib.sha256(f.read_bytes()).hexdigest(); (out/"publication-manifest.json").write_text(json.dumps({"files":[{"path":".ai/research/generated/FOLD.json","sha256":d,"byte_size":f.stat().st_size}]})+"\n")
                return out
            wr083.merge_publication(make_out("one\n"),package,frozen)
            must_fail(lambda: wr083.merge_publication(make_out("two\n"),package,frozen),"mutate")
        finally:
            if old is None: os.environ.pop("RUNNER_TEMP",None)
            else: os.environ["RUNNER_TEMP"]=old


def test_publication_manifest_restricts_research_paths() -> None:
    with tempfile.TemporaryDirectory() as runner, tempfile.TemporaryDirectory() as repo_td:
        old=os.environ.get("RUNNER_TEMP"); os.environ["RUNNER_TEMP"]=runner
        try:
            out=pathlib.Path(runner)/"out"; file=out/"files/.ai/research/generated/result.json"; file.parent.mkdir(parents=True); file.write_text("{}\n")
            digest=hashlib.sha256(file.read_bytes()).hexdigest(); size=file.stat().st_size
            (out/"publication-manifest.json").write_text(json.dumps({"files":[{"path":".ai/research/generated/result.json","sha256":digest,"byte_size":size}]})+"\n")
            checked=wr083.validate_publication_manifest(out); assert len(checked)==1
            staged=wr083.stage_publication(pathlib.Path(repo_td),out); assert staged==[".ai/research/generated/result.json"]
            bad=out/"publication-manifest.json"; bad.write_text(json.dumps({"files":[{"path":"../escape","sha256":digest,"byte_size":size}]})+"\n")
            must_fail(lambda: wr083.validate_publication_manifest(out),"boundary")
        finally:
            if old is None: os.environ.pop("RUNNER_TEMP",None)
            else: os.environ["RUNNER_TEMP"]=old


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
    assert "future-authorization" in text and "ACTIVE_TASKS.json" in (ROOT / "scripts/custody/wr083_protected_historical_scoring.py").read_text()
    assert "sandbox-conformance" in text and "--unshare-net" in (ROOT / "scripts/custody/wr083_protected_historical_scoring.py").read_text()
    assert "actions/upload-artifact" not in text
    assert ".github/workflows/wr083-protected-historical-scoring-bridge.yml" in guard
    assert "tracked.filter(file => file.startsWith('.github/workflows/')).sort()" in guard
    assert "assert.deepEqual" in guard


def main() -> int:
    test_authority_exact_14(); test_consumer_isolation(); test_chronology_fail_closed_and_serialization()
    test_future_branch_head_and_consumer_digest_gates(); test_manager_authorization_and_fold_visibility()
    test_frozen_publication_paths_cannot_mutate(); test_publication_manifest_restricts_research_paths()
    test_cleanup_helper(); test_workflow_static_security_and_release_guard()
    print("WR-083 protected historical scoring bridge regressions: PASS")
    return 0


if __name__ == "__main__": raise SystemExit(main())
