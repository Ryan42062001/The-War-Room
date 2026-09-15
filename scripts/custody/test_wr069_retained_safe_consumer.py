#!/usr/bin/env python3
"""Focused fail-closed regressions for WR-069."""
from __future__ import annotations

import ast
import base64
import importlib.util
import sys
import tempfile
from pathlib import Path

MODULE = Path(__file__).with_name("wr069_retained_safe_consumer.py")
SPEC = importlib.util.spec_from_file_location("wr069", MODULE)
assert SPEC and SPEC.loader
wr = importlib.util.module_from_spec(SPEC); sys.modules[SPEC.name] = wr; SPEC.loader.exec_module(wr)
ROOT = MODULE.parents[2]
CONTRACT = ROOT / ".ai/research/generated/RETURNING_PLAYER_V2_CSV_SCHEMA_INFERENCE_CONTRACT.json"
CORPUS = ROOT / ".ai/research/generated/RETURNING_PLAYER_V2_CSV_SCHEMA_INFERENCE_CONFORMANCE.json"
WORKFLOW = ROOT / ".github/workflows/wr069-retained-safe-consumer-parser.yml"


def rejects(call, phrase: str = "") -> None:
    try:
        call()
    except (wr.ContractError, wr.CsvFatal) as exc:
        assert not phrase or phrase in str(exc), (phrase, str(exc))
    else:
        raise AssertionError("expected fail-closed rejection")


def test_allowlist() -> None:
    expected = wr.expected_source_dicts(); wr.validate_static_allowlist(expected)
    assert len(expected) == 15
    rejects(lambda: wr.validate_static_allowlist(expected + [dict(expected[0])]), "exactly equal")
    bad = [dict(x) for x in expected]; bad[0]["filename"] = "draft_picks.csv"
    rejects(lambda: wr.validate_static_allowlist(bad), "exactly equal")
    assert all(x["filename"] != "draft_picks.csv" for x in expected)


def test_contract_and_all_49_vectors() -> None:
    corpus = wr.verify_contract_and_corpus(CONTRACT, CORPUS)
    assert corpus["case_count"] == 49
    assert wr.run_conformance(CONTRACT, CORPUS) == {"status":"PASS","case_count":49,"pass_cases":33,"fatal_cases":16,"mismatches":0}
    for case in corpus["cases"]:
        if case[2] != "FATAL": continue
        raw = base64.b64decode(case[1], validate=True)
        try: wr.derive_schema(raw)
        except wr.CsvFatal as exc: assert exc.code == case[3]
        else: raise AssertionError(f"fatal vector emitted a partial result: {case[0]}")


def test_consumer_secret_rejection() -> None:
    wr.assert_consumer_isolation({"PATH":"/usr/bin","RUNNER_TEMP":"/tmp"})
    rejects(lambda: wr.assert_consumer_isolation({"WR_CUSTODY_R2_ENDPOINT":"injected"}), "provider authority")
    rejects(lambda: wr.assert_consumer_isolation({"AWS_ACCESS_KEY_ID":"injected"}), "provider authority")


def test_local_rehash_mismatch_deletes() -> None:
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "x.raw"; path.write_bytes(b"actual")
        source = {"source_id":"synthetic","local_path":str(path),"expected_sha256":"0"*64,"expected_size_bytes":6}
        rejects(lambda: wr.verify_local_source_files([source]), "re-hash/re-size")
        assert not path.exists()


def test_wr063_exact_version_fail_closed() -> None:
    read_path = ROOT / "scripts/custody/read_retained_versions.py"
    spec = importlib.util.spec_from_file_location("wr063_read_for_wr069_test", read_path)
    assert spec and spec.loader
    read = importlib.util.module_from_spec(spec); sys.modules[spec.name] = read; spec.loader.exec_module(read)
    item = read.RetainedObject(2013, 1, "a"*64, 3, "custody/sha256/" + "a"*64 + "/raw")
    original = read.request_json
    try:
        read.request_json = lambda *args, **kwargs: {"files":[{"fileName":item.custody_key + "-extra"}]}
        try:
            read.list_exact_versions({"api_url":"https://api.backblazeb2.com","token":"x","bucket_id":"b"}, item)
        except read.ContractError as exc:
            assert "non-exact" in str(exc)
        else:
            raise AssertionError("non-exact B2 version was accepted")
    finally:
        read.request_json = original
    try:
        read.choose_upload_version([{"fileName":item.custody_key,"action":"hide","uploadTimestamp":1}], item)
    except read.ContractError as exc:
        assert "no candidate upload" in str(exc)
    else:
        raise AssertionError("non-upload B2 version was accepted")


def test_no_mutation_helpers_or_operations() -> None:
    text = MODULE.read_text(encoding="utf-8"); tree = ast.parse(text); imported = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import): imported.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom): imported.append(node.module or "")
    forbidden_helpers = ("ensure_b2_custody_object","prove_b2_r2_custody","run_source_manifest_custody")
    assert not any(any(name in module for name in forbidden_helpers) for module in imported)
    lowered = text.lower()
    for operation in ("put-object","delete-object","copy-object","create-multipart-upload","put-object-tagging","put-object-retention","put-object-legal-hold"):
        assert operation not in lowered


def test_workflow_boundary() -> None:
    assert WORKFLOW.exists(); text = WORKFLOW.read_text(encoding="utf-8")
    assert "actions/upload-artifact" not in text
    assert "Resolve and verify all 15 retained objects" in text
    assert "Safe consumer with empty provider environment" in text
    assert "env -i" in text
    assert "Remove runner-temporary retained bytes" in text
    assert "WR_CUSTODY_B2_READ_KEY_ID" in text
    assert "WR_CUSTODY_B2_KEY_ID" not in text
    assert "[wr069-live-proof]" in text


def test_inventory_ordering_synthetic() -> None:
    headers = ["player_id","position","season","season_type"]
    rows = [
        [wr.Field("b",False),wr.Field("QB",False),wr.Field("2013",False),wr.Field("REG",False)],
        [wr.Field("a",False),wr.Field("QB",False),wr.Field("2013",False),wr.Field("REG",False)],
        [wr.Field("z",False),wr.Field("WR",False),wr.Field("2013",False),wr.Field("REG",False)],
    ]
    entries = [[wr.row_mapping(headers,r)["player_id"].text,wr.row_mapping(headers,r)["position"].text] for r in rows]
    entries.sort(key=lambda x:(x[1],x[0]))
    assert entries == [["a","QB"],["b","QB"],["z","WR"]]


def main() -> None:
    test_allowlist(); test_contract_and_all_49_vectors(); test_consumer_secret_rejection()
    test_local_rehash_mismatch_deletes(); test_wr063_exact_version_fail_closed()
    test_no_mutation_helpers_or_operations(); test_workflow_boundary(); test_inventory_ordering_synthetic()
    print("WR-069 safe-consumer fail-closed regressions: PASS")

if __name__ == "__main__": main()
