#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "scripts/custody/wr097_v21_protected_scoring.py"
spec = importlib.util.spec_from_file_location("wr097_bridge", MODULE_PATH)
assert spec and spec.loader
b = importlib.util.module_from_spec(spec); sys.modules[spec.name] = b; spec.loader.exec_module(b)

def must_fail(fn, phrase: str | None = None):
    try:
        fn()
    except b.ContractError as exc:
        if phrase is not None:
            assert phrase in str(exc), (phrase, str(exc))
        return
    raise AssertionError("expected ContractError")

def test_authority_exact_14_and_v21_protocol():
    sources, bindings = b.load_authority(ROOT)
    assert len(sources) == 14
    assert [x["season"] for x in sources] == list(range(2012, 2026))
    assert bindings["protocol"] == {
        "id": "returning-player-v2.1-model-protocol-candidate/1.0.0-wr095",
        "sha256": "5c86dacac044538422ca24fbeb13eaee3161050f917acc40f0dbdc1ca6547a39",
        "gates_id": "returning-player-v2.1-result-gates-candidate/1.0.0-wr095",
    }
    assert bindings["source_snapshot"]["sha256"] == "6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea"
    assert bindings["cohort"]["sha256"] == "f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4"
    assert bindings["players_metadata_admitted_count"] == 0
    assert bindings["draft_picks_csv_used"] is False

def test_consumer_provider_isolation():
    b.assert_consumer_isolation({})
    must_fail(lambda: b.assert_consumer_isolation({"WR_CUSTODY_R2_SECRET_ACCESS_KEY":"x"}),"provider authority")

def init_execution_repo(root: pathlib.Path):
    subprocess.run(["git","init"],cwd=root,check=True,stdout=subprocess.DEVNULL)
    subprocess.run(["git","config","user.email","wr097@example.invalid"],cwd=root,check=True)
    subprocess.run(["git","config","user.name","WR097 Test"],cwd=root,check=True)
    path=root/b.V21_CONSUMER_PATH; path.parent.mkdir(parents=True); path.write_text("print('synthetic reviewed consumer')\n")
    subprocess.run(["git","add","."],cwd=root,check=True)
    subprocess.run(["git","commit","-m","authorized"],cwd=root,check=True,stdout=subprocess.DEVNULL)
    head=subprocess.check_output(["git","rev-parse","HEAD"],cwd=root,text=True).strip()
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    return head,digest

def write_manager_authority(control: pathlib.Path, branch: str, head: str, digest: str, *,
                            consumed: bool = False, second_authority: bool = False):
    authority={"branch":branch,"head_sha":head,"consumer_path":b.V21_CONSUMER_PATH,"consumer_sha256":digest}
    identity=b.sha256_bytes(b.canonical_json_bytes(authority))
    tasks=[{
        "task_id":"WR-199","branch":branch,"status":"IN_PROGRESS","blocker_type":"NONE","blocked_on_tasks":[],
        b.MANAGER_EXECUTION_AUTHORITY_KEY:authority,
    }]
    if second_authority:
        tasks.append({
            "task_id":"WR-200","branch":"wr-200-other","status":"IN_PROGRESS","blocker_type":"NONE","blocked_on_tasks":[],
            b.MANAGER_EXECUTION_AUTHORITY_KEY:{**authority,"branch":"wr-200-other"},
        })
    payload={"schema_version":3,"canonical_branch":"main","manager_owned":True,
             "authority_consumption_history":[identity] if consumed else [],"tasks":tasks}
    p=control/".ai/shared"; p.mkdir(parents=True,exist_ok=True)
    (p/"ACTIVE_TASKS.json").write_text(json.dumps(payload)+"\n")
    return authority,identity

def test_v35_manager_authority_identity_race_and_replay():
    with tempfile.TemporaryDirectory() as td:
        root=pathlib.Path(td); repo=root/"repo"; repo.mkdir()
        head,digest=init_execution_repo(repo)
        authority,identity=write_manager_authority(root,"wr-199-v21-scoring",head,digest)
        loaded=b.load_future_authorization(root)
        assert loaded["task_id"]=="WR-199" and loaded["authority_sha256"]==identity
        assert b.validate_future_consumer(repo,loaded).is_file()
        b.validate_live_remote_head(loaded,head)
        must_fail(lambda: b.validate_live_remote_head(loaded,"0"*40),"live authorized")
        # Branch advancement after authority issuance is rejected.
        subprocess.run(["git","checkout","-b","wr-199-v21-scoring"],cwd=repo,check=True,stdout=subprocess.DEVNULL)
        (repo/"advance.txt").write_text("advance\n"); subprocess.run(["git","add","."],cwd=repo,check=True)
        subprocess.run(["git","commit","-m","advance"],cwd=repo,check=True,stdout=subprocess.DEVNULL)
        must_fail(lambda: b.validate_future_consumer(repo,loaded),"checked-out head")
        # Machine-owned replay history makes the same authority permanently unusable.
        write_manager_authority(root,"wr-199-v21-scoring",head,digest,consumed=True)
        must_fail(lambda: b.load_future_authorization(root),"already been consumed")

def test_v35_requires_exactly_one_canonical_authority():
    with tempfile.TemporaryDirectory() as td:
        root=pathlib.Path(td); repo=root/"repo"; repo.mkdir(); head,digest=init_execution_repo(repo)
        write_manager_authority(root,"wr-199-v21-scoring",head,digest,second_authority=True)
        must_fail(lambda: b.load_future_authorization(root),"exactly one")
        payload=json.loads((root/".ai/shared/ACTIVE_TASKS.json").read_text())
        payload["tasks"][1]["future_execution_authority"]["consumer_path"]=".ai/research/OTHER.py"
        (root/".ai/shared/ACTIVE_TASKS.json").write_text(json.dumps(payload)+"\n")
        assert b.load_future_authorization(root)["task_id"]=="WR-199"

def synthetic_retained(root: pathlib.Path):
    rawdir=root/"raw"; rawdir.mkdir()
    sources=[]
    for season in range(2012,2026):
        data=f"synthetic-retained-{season}\n".encode(); path=rawdir/f"{season}.raw"; path.write_bytes(data)
        sources.append({"season":season,"source_id":f"nflverse-player-summary-{season}",
                        "local_path":str(path),"expected_sha256":hashlib.sha256(data).hexdigest(),
                        "expected_size_bytes":len(data)})
    return {"sources":sources},sources[0]["local_path"]

def write_publication(root: pathlib.Path, rel: str, data: bytes):
    out=root/"out"; f=out/"files"/rel; f.parent.mkdir(parents=True,exist_ok=True); f.write_bytes(data)
    digest=hashlib.sha256(data).hexdigest()
    (out/"publication-manifest.json").write_text(json.dumps({"files":[{"path":rel,"sha256":digest,"byte_size":len(data)}]})+"\n")
    return out

def test_publication_allowlist_raw_and_credentials_fail_closed():
    with tempfile.TemporaryDirectory() as td:
        old=os.environ.get("RUNNER_TEMP"); os.environ["RUNNER_TEMP"]=td
        try:
            root=pathlib.Path(td); retained,first=synthetic_retained(root)
            out=write_publication(root,".ai/research/generated/RETURNING_PLAYER_V21_RESULT_MANIFEST.json",b'{"status":"synthetic"}\n')
            checked=b.publication_entries(out,retained); assert checked[0]["family"]=="RETURNING_PLAYER_V21_RESULT_MANIFEST"
            out=write_publication(root,".ai/research/generated/ARBITRARY.json",b'{}\n')
            must_fail(lambda: b.publication_entries(out,retained),"not authorized")
            raw=pathlib.Path(first).read_bytes()
            out=write_publication(root,".ai/research/generated/RETURNING_PLAYER_V21_RESULT_MANIFEST_RAW.json",raw)
            must_fail(lambda: b.publication_entries(out,retained),"retained raw source")
            out=write_publication(root,".ai/research/generated/RETURNING_PLAYER_V21_RESULT_MANIFEST_SECRET.json",
                                  b'{"api_token":"synthetic-do-not-publish"}\n')
            must_fail(lambda: b.publication_entries(out,retained),"credential-bearing")
        finally:
            if old is None: os.environ.pop("RUNNER_TEMP",None)
            else: os.environ["RUNNER_TEMP"]=old

def test_validation_confirmation_chronology_and_determinism():
    result=b.synthetic_conformance()
    assert result["completed_stages"]==["validation","confirmation"]
    assert result["validation_years"]==[2022,2023]
    assert result["confirmation_years"]==[2024,2025]
    assert result["confirmation_requires_complete_validation"] is True
    plan=b.future_execution_plan()
    assert [f["target_season"] for f in plan["folds"]]==[2022,2023,2024,2025]
    assert plan["stages"]=={"validation":[2022,2023],"confirmation":[2024,2025]}
    one=b.sha256_bytes(b.canonical_json_bytes(plan)); two=b.sha256_bytes(b.canonical_json_bytes(json.loads(json.dumps(plan))))
    assert one==two

def test_terminal_receipt_and_one_publication_parent():
    with tempfile.TemporaryDirectory() as td:
        root=pathlib.Path(td); repo=root/"repo"; repo.mkdir(); head,digest=init_execution_repo(repo)
        authority,_=write_manager_authority(root,"wr-199-v21-scoring",head,digest)
        loaded=b.load_future_authorization(root)
        summary=b.build_terminal_result_summary(loaded,digest,"VALIDATION_FAILED","BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE",2,1)
        receipt=b.build_authority_consumption_receipt(loaded,summary,"f"*64,"123456")
        assert receipt["schema_version"]=="wr081-authority-consumption-receipt-v1"
        subprocess.run(["git","checkout","-b",authority["branch"]],cwd=repo,check=True,stdout=subprocess.DEVNULL)
        rp=repo/".ai/research/generated/RETURNING_PLAYER_V21_AUTHORITY_CONSUMPTION_RECEIPT.json"; rp.parent.mkdir(parents=True,exist_ok=True)
        rp.write_bytes(b.canonical_json_bytes(receipt))
        subprocess.run(["git","add","."],cwd=repo,check=True); subprocess.run(["git","commit","-m","one publication"],cwd=repo,check=True,stdout=subprocess.DEVNULL)
        publication=subprocess.check_output(["git","rev-parse","HEAD"],cwd=repo,text=True).strip()
        checked=b.validate_authority_consumption(root,repo,publication)
        assert checked["publication_parent_verified"] is True
        (repo/"second.txt").write_text("x"); subprocess.run(["git","add","."],cwd=repo,check=True)
        subprocess.run(["git","commit","-m","second"],cwd=repo,check=True,stdout=subprocess.DEVNULL)
        second=subprocess.check_output(["git","rev-parse","HEAD"],cwd=repo,text=True).strip()
        must_fail(lambda: b.validate_authority_consumption(root,repo,second),"exactly one commit")

def test_real_consumer_synthetic_target_ingest_under_immutable_sandbox_lock():
    """No provider access: fabricated local CSV, prediction state and bridge lock."""
    # The direct consumer suite exercises this same fixture without bubblewrap.
    # This test additionally exercises the actual provider-free bwrap/lock wrapper.
    if not shutil.which("bwrap"):
        raise AssertionError("bubblewrap required for WR-103 sandbox happy-path proof")
    consumer_tests_path=ROOT/".ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER_TEST.py"
    spec=importlib.util.spec_from_file_location("wr103_consumer_fixture",consumer_tests_path)
    assert spec and spec.loader
    fixture_module=importlib.util.module_from_spec(spec)
    sys.modules[spec.name]=fixture_module
    spec.loader.exec_module(fixture_module)
    with tempfile.TemporaryDirectory() as td:
        old=os.environ.get("RUNNER_TEMP")
        os.environ["RUNNER_TEMP"]=td
        try:
            root=pathlib.Path(td)
            fixture_root=root/"synthetic-fixture"; fixture_root.mkdir()
            context,context_path,state,locks,_out,expected_lock=(
                fixture_module.synthetic_locked_target_fixture(fixture_root)
            )
            raw_source=pathlib.Path(context["visible_sources"][0]["path"])
            source_meta=context["visible_sources"][0]
            retained={
                "sources":[{
                    "season":2022,"source_id":"nflverse-player-summary-2022",
                    "local_path":str(raw_source),
                    "expected_sha256":source_meta["sha256"],
                    "expected_size_bytes":source_meta["byte_size"],
                }],
            }
            # Replace the test's synthetic copy with the actual bridge-created,
            # read-only prediction lock and require the same canonical digest.
            shutil.rmtree(locks/"prediction-2022")
            bridge_lock=b.lock_phase_output(
                fixture_root/"prediction-output",locks,"prediction-2022",retained
            )
            assert bridge_lock==expected_lock
            visible=root/"sandbox-visible"
            sandbox_sources=b.copy_visible_sources(retained,(2022,),visible)
            context["visible_sources"]=sandbox_sources
            consumer_copy=root/"consumer.py"
            shutil.copyfile(ROOT/b.V21_CONSUMER_PATH,consumer_copy)
            output=root/"sandbox-output"
            b.assert_consumer_isolation({"PATH":os.environ.get("PATH","")})
            result=b.run_sandboxed_consumer(
                consumer_copy,"target-ingest",context,visible,state,locks,output,retained
            )
            assert result["status"]=="PASS" and result["mode"]=="target-ingest"
            assert result["accepted_prediction_lock_sha256"]==bridge_lock
            assert result["target_values_accessed"] is True
            assert (state/"evaluation-2022.json").is_file()
            assert len(b.publication_entries(output,retained))==1
            # Tampering with the immutable lock must still fail closed inside
            # the same actual sandbox, without publishing a second result.
            locked=locks/"prediction-2022"/"files"/".ai/research/generated"/"RETURNING_PLAYER_V21_PREDICTIONS_PRE_OUTCOME_2022.json"
            locked.chmod(0o644)
            locked.write_text('{"synthetic_tamper":true}\n',encoding="utf-8")
            must_fail(lambda:b.run_sandboxed_consumer(
                consumer_copy,"target-ingest",context,visible,state,locks,output,retained
            ),"sandboxed consumer failed closed in target-ingest")
            assert not (output/"publication-manifest.json").exists()
            b.cleanup_paths([visible,state,locks,output,consumer_copy])
            assert all(not p.exists() for p in (visible,state,locks,output,consumer_copy))
        finally:
            if old is None:
                os.environ.pop("RUNNER_TEMP",None)
            else:
                os.environ["RUNNER_TEMP"]=old


def test_real_consumer_synthetic_stage_gate_status_contract():
    """Actual provider-free wrapper sandbox reaches corrected stage-gate bridge contract."""
    if not shutil.which("bwrap"):
        raise AssertionError("bubblewrap required for WR-106 stage-gate sandbox proof")
    consumer_tests_path=ROOT/".ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER_TEST.py"
    spec=importlib.util.spec_from_file_location("wr106_consumer_fixture",consumer_tests_path)
    assert spec and spec.loader
    fixture_module=importlib.util.module_from_spec(spec)
    sys.modules[spec.name]=fixture_module
    spec.loader.exec_module(fixture_module)
    with tempfile.TemporaryDirectory() as td:
        old=os.environ.get("RUNNER_TEMP")
        os.environ["RUNNER_TEMP"]=td
        try:
            root=pathlib.Path(td)
            fixture_root=root/"synthetic-stage-gate"; fixture_root.mkdir()
            context,_context_path,state,locks,_out,lock_set=(
                fixture_module.synthetic_stage_gate_fixture(fixture_root,fallback_count=0)
            )
            visible=root/"sandbox-visible"; visible.mkdir()
            retained_raw=root/"synthetic-retained-identity.raw"
            retained_raw.write_bytes(b"wr106-synthetic-retained-identity-only\n")
            digest,size=b.sha256_file(retained_raw)
            retained={"sources":[{
                "season":2012,"source_id":"wr106-synthetic-retained-identity-only",
                "local_path":str(retained_raw),"expected_sha256":digest,
                "expected_size_bytes":size,
            }]}
            consumer_copy=root/"consumer.py"
            shutil.copyfile(ROOT/b.V21_CONSUMER_PATH,consumer_copy)
            output=root/"sandbox-output"
            bridge=b.run_sandboxed_consumer(
                consumer_copy,"stage-gate",context,visible,state,locks,output,retained
            )
            artifact=json.loads((
                output/"files/.ai/research/generated/RETURNING_PLAYER_V21_STAGE_GATES_VALIDATION.json"
            ).read_text(encoding="utf-8"))
            assert bridge["stage"]=="validation"
            assert bridge["gate_pass"] is True
            assert bridge["prediction_lock_set_sha256"]==lock_set
            assert bridge["status_label"]=="STAGE_PASS"
            assert bridge["status_label"]==artifact["status_label"]

            # Mirror the accepted wrapper's unchanged stage-gate checks so the
            # synthetic returned bridge is proven acceptable while missing,
            # empty and tampered contract evidence remains fail-closed.
            source=MODULE_PATH.read_text(encoding="utf-8")
            assert 'decision_status=str(bridge.get("status_label") or "")' in source
            assert 'raise ContractError("stage gate decision status missing")' in source
            def accepted_stage_gate(candidate):
                if (candidate.get("stage")!="validation"
                        or not isinstance(candidate.get("gate_pass"),bool)
                        or candidate.get("prediction_lock_set_sha256")!=lock_set):
                    raise b.ContractError("stage gate result contract mismatch")
                decision_status=str(candidate.get("status_label") or "")
                if not decision_status:
                    raise b.ContractError("stage gate decision status missing")
                return decision_status
            assert accepted_stage_gate(bridge)==artifact["status_label"]
            missing=dict(bridge); missing.pop("status_label")
            must_fail(lambda:accepted_stage_gate(missing),"stage gate decision status missing")
            empty=dict(bridge); empty["status_label"]=""
            must_fail(lambda:accepted_stage_gate(empty),"stage gate decision status missing")
            tampered=dict(bridge); tampered["prediction_lock_set_sha256"]="0"*64
            must_fail(lambda:accepted_stage_gate(tampered),"stage gate result contract mismatch")
            b.cleanup_paths([visible,state,locks,output,consumer_copy,retained_raw])
        finally:
            if old is None:
                os.environ.pop("RUNNER_TEMP",None)
            else:
                os.environ["RUNNER_TEMP"]=old


def test_cleanup_success_and_deliberate_failure_paths():
    with tempfile.TemporaryDirectory() as td:
        root=pathlib.Path(td); a=root/"raw"; a.mkdir(); (a/"x").write_text("synthetic")
        b.cleanup_paths([a]); assert not a.exists()
        c=root/"failure"; c.mkdir(); (c/"x").write_text("synthetic")
        try:
            raise RuntimeError("deliberate synthetic failure")
        except RuntimeError:
            b.cleanup_paths([c])
        assert not c.exists()
        frozen=root/"immutable-lock"; nested=frozen/"files"/"synthetic"; nested.mkdir(parents=True)
        (nested/"evidence.json").write_text('{"synthetic":true}\n',encoding="utf-8")
        (nested/"evidence.json").chmod(0o444)
        nested.chmod(0o555)
        (frozen/"files").chmod(0o555)
        frozen.chmod(0o555)
        b.cleanup_paths([frozen])
        assert not frozen.exists(), "immutable runner-temp phase lock must be fully removed"

def test_workflow_static_security_and_release_guard():
    workflow=ROOT/".github/workflows/wr097-v21-protected-scoring-bridge.yml"
    release=ROOT/"scripts/validate-release-candidate.mjs"
    if not workflow.exists():
        return
    text=workflow.read_text(); guard=release.read_text(); script=MODULE_PATH.read_text()
    assert "pull_request_target" not in text
    assert "permissions:\n  contents: read" in text
    assert "persist-credentials: false" in text
    assert "runs-on: ubuntu-24.04" in text
    dispatch=text.split("workflow_dispatch:",1)[1].split("permissions:",1)[0]
    assert "execution_branch:" not in dispatch and "expected_head_sha:" not in dispatch
    assert "consumer_path:" not in dispatch and "consumer_sha256:" not in dispatch
    assert "future-authority" in text and "future_execution_authority" in script
    assert "authority-consumption-check" in text
    assert "actions/upload-artifact" not in text
    assert "refs/heads/main" in text
    assert "github.event.pull_request.head.repo.fork" not in text  # no fork exception granting credentials
    assert ".github/workflows/wr097-v21-protected-scoring-bridge.yml" in guard
    assert "assert.deepEqual" in guard

def main():
    test_authority_exact_14_and_v21_protocol()
    test_consumer_provider_isolation()
    test_v35_manager_authority_identity_race_and_replay()
    test_v35_requires_exactly_one_canonical_authority()
    test_publication_allowlist_raw_and_credentials_fail_closed()
    test_validation_confirmation_chronology_and_determinism()
    test_terminal_receipt_and_one_publication_parent()
    test_real_consumer_synthetic_target_ingest_under_immutable_sandbox_lock()
    test_real_consumer_synthetic_stage_gate_status_contract()
    test_cleanup_success_and_deliberate_failure_paths()
    test_workflow_static_security_and_release_guard()
    print("WR-097 protected v2.1 bridge regressions: PASS")

if __name__=="__main__":
    main()
