#!/usr/bin/env python3
"""Fail-closed regression suite for WR-063 retained-version reads."""

from __future__ import annotations

import ast
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

MODULE = Path(__file__).with_name("read_retained_versions.py")
SPEC = importlib.util.spec_from_file_location("wr063_read", MODULE)
assert SPEC and SPEC.loader
read = importlib.util.module_from_spec(SPEC); sys.modules[SPEC.name] = read; SPEC.loader.exec_module(read)
ROOT = MODULE.parents[2]
WORKFLOW = ROOT / ".github/workflows/wr063-retained-version-read.yml"


def rejects(call, phrase: str) -> None:
    try: call()
    except read.ContractError as exc: assert phrase in str(exc), str(exc)
    else: raise AssertionError(f"expected rejection containing {phrase}")


def test_authoritative_identity_set() -> None:
    read.validate_allowlist()
    assert [(x.season, x.asset_id, x.sha256, x.byte_size) for x in read.ALLOWLIST] == [
        (2013, 512983282, "dbc7804c32c8dbf46120bfe4e724cdd926537509caa8a1bb96cd3b6e159b21f8", 792070),
        (2014, 512985320, "7046a0fd69b979d0649feb679a42f82f6e8e175d19587857d3e9371f09427cd6", 816553),
        (2015, 512984105, "b977be5bc8cad6b02dfb755e78974b4486a505fa272f683add499b968878e3eb", 815021),
        (2016, 512985505, "041473e5860ca6cfcba7a29e98b2ddfc3f01db0df2469d5b44e44135603e2424", 819194),
    ]
    for bad in read.REJECTED_WR061_DIGESTS:
        original = read.ALLOWLIST[1]
        changed = list(read.ALLOWLIST)
        changed[1] = read.RetainedObject(original.season, original.asset_id, bad,
                                         original.byte_size, f"custody/sha256/{bad}/raw")
        rejects(lambda changed=changed: read.validate_allowlist(changed), "authoritative")


def test_exact_version_boundary_and_selection() -> None:
    item = read.ALLOWLIST[0]
    captured = {}
    with patch.object(read, "request_json", side_effect=lambda url, **kwargs: captured.update(kwargs) or {
        "files": [{"fileName": item.custody_key, "fileId": "upload-id", "action": "upload",
                   "contentLength": item.byte_size, "uploadTimestamp": 1,
                   "fileInfo": {"wr-sha256": item.sha256}}]
    }):
        versions = read.list_exact_versions({"api_url": "https://api001.backblazeb2.com",
                                             "token": "token", "bucket_id": "bucket"}, item)
    assert captured["payload"]["prefix"] == item.custody_key
    assert captured["payload"]["startFileName"] == item.custody_key
    selected, visibility = read.choose_upload_version([
        {"fileName": item.custody_key, "fileId": "hide-id", "action": "hide", "uploadTimestamp": 2},
        versions[0],
    ], item)
    assert selected["fileId"] == "upload-id"
    assert visibility["latest_action"] == "hide" and visibility["by_name_expected"] == "HTTP_404"
    rejects(lambda: read.choose_upload_version([{"action": "hide", "fileId": "x", "uploadTimestamp": 1}], item), "no candidate")
    with patch.object(read, "request_json", return_value={"files": [{"fileName": item.custody_key + "x"}]}):
        rejects(lambda: read.list_exact_versions({"api_url": "https://api001.backblazeb2.com",
                                                  "token": "t", "bucket_id": "b"}, item), "non-exact")


def test_verify_deletes_mismatch() -> None:
    payload = b"good"
    item = read.RetainedObject(2000, 1, hashlib.sha256(payload).hexdigest(), len(payload),
                               f"custody/sha256/{hashlib.sha256(payload).hexdigest()}/raw")
    with tempfile.TemporaryDirectory() as temp:
        path = Path(temp) / "raw"; path.write_bytes(payload + b"bad")
        rejects(lambda: read.verify(path, item, "provider"), "identity mismatch")
        assert not path.exists()


def test_r2_only_head_get() -> None:
    commands = []
    def fake_run(command, **kwargs):
        commands.append(command); return subprocess.CompletedProcess(command, 0)
    config = {"WR_CUSTODY_R2_ACCESS_KEY_ID": "id", "WR_CUSTODY_R2_SECRET_ACCESS_KEY": "secret",
              "WR_CUSTODY_R2_ENDPOINT": "https://" + "a" * 32 + ".r2.cloudflarestorage.com"}
    with patch.object(read.subprocess, "run", fake_run):
        read.r2_read(config, read.ALLOWLIST[0], Path("/tmp/wr063-test"))
    assert [x[2] for x in commands] == ["head-object", "get-object"]
    assert all(read.ALLOWLIST[0].custody_key in x for x in commands)


def test_static_nonmutation_and_workflow() -> None:
    source = MODULE.read_text()
    lowered = source.lower()
    for forbidden in ("put-object", "upload-part", "copy-object", "delete-object",
                      "put-object-retention", "put-object-legal-hold", "put-bucket"):
        assert forbidden not in lowered
    for helper in ("prove_b2_r2_custody", "ensure_b2_custody_object", "run_source_manifest_custody"):
        assert helper not in source
    tree = ast.parse(source)
    methods = {node.value.value for node in ast.walk(tree) if isinstance(node, ast.keyword)
               and node.arg == "method" and isinstance(node.value, ast.Constant)}
    assert methods <= {"GET", "POST"}  # POST is solely B2 read-only list metadata.
    workflow = WORKFLOW.read_text()
    assert "actions/upload-artifact" not in workflow
    assert "read_retained_versions.py" in workflow
    assert "Provider-secret isolation proof" in workflow
    assert "if: always()" in workflow
    for helper in ("prove_b2_r2_custody", "ensure_b2_custody_object", "run_source_manifest_custody"):
        assert helper not in workflow
    consumer = workflow[workflow.index("Provider-secret isolation proof"):]
    assert "${{ secrets." not in consumer


def test_cleanup_on_failure() -> None:
    environment = {"RUNNER_TEMP": "", "WR_CUSTODY_B2_KEY_ID": "id",
        "WR_CUSTODY_B2_APPLICATION_KEY": "secret", "WR_CUSTODY_R2_ACCESS_KEY_ID": "rid",
        "WR_CUSTODY_R2_SECRET_ACCESS_KEY": "rsecret", "WR_CUSTODY_B2_BUCKET": read.EXPECTED_B2_BUCKET,
        "WR_CUSTODY_B2_ENDPOINT": "https://s3.us-east-005.backblazeb2.com",
        "WR_CUSTODY_R2_BUCKET": read.EXPECTED_R2_BUCKET,
        "WR_CUSTODY_R2_ENDPOINT": "https://" + "a" * 32 + ".r2.cloudflarestorage.com"}
    with tempfile.TemporaryDirectory() as temp:
        environment["RUNNER_TEMP"] = temp; raw = Path(temp) / "raw"; report = Path(temp) / "report.json"
        with patch.dict(os.environ, environment, clear=True), patch.object(read, "authorize_b2", side_effect=read.ContractError("synthetic")):
            rejects(lambda: read.execute(raw, report), "synthetic")
        assert not raw.exists() and not report.exists()


def main() -> int:
    test_authoritative_identity_set(); test_exact_version_boundary_and_selection()
    test_verify_deletes_mismatch(); test_r2_only_head_get(); test_static_nonmutation_and_workflow()
    test_cleanup_on_failure()
    print("WR-063 retained-version fail-closed regressions: PASS")
    return 0


if __name__ == "__main__": raise SystemExit(main())
