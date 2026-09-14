#!/usr/bin/env python3
"""Deterministic fail-closed regressions for the WR-061 GET-only path."""

from __future__ import annotations

import ast
import copy
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

MODULE_PATH = Path(__file__).with_name("read_retained_objects.py")
SPEC = importlib.util.spec_from_file_location("wr061_read", MODULE_PATH)
assert SPEC and SPEC.loader
read = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = read
SPEC.loader.exec_module(read)
ROOT = MODULE_PATH.parents[2]
WORKFLOW = ROOT / ".github/workflows/wr061-retained-read.yml"


def expect_contract(callable_value, phrase: str) -> None:
    try:
        callable_value()
    except read.ContractError as exc:
        assert phrase in str(exc), (phrase, str(exc))
    else:
        raise AssertionError(f"expected ContractError containing {phrase!r}")


def test_exact_allowlist() -> None:
    read.validate_allowlist()
    for index, replacement in enumerate((
        {"custody_key": "custody/not-allowed"},
        {"sha256": "0" * 64},
        {"byte_size": 1},
        {"asset_id": 1},
    )):
        objects = list(read.ALLOWLIST)
        values = read.asdict(objects[index])
        values.update(replacement)
        objects[index] = read.RetainedObject(**values)
        expect_contract(lambda objects=objects: read.validate_allowlist(objects), "exactly equal")

    duplicate = list(read.ALLOWLIST)
    duplicate[1] = duplicate[0]
    expect_contract(lambda: read.validate_allowlist(duplicate), "exactly equal")


def test_verifier() -> None:
    payload = b"retained object regression bytes\n"
    item = read.RetainedObject(
        2000, 1, hashlib.sha256(payload).hexdigest(), len(payload),
        f"custody/sha256/{hashlib.sha256(payload).hexdigest()}/raw",
    )
    with tempfile.TemporaryDirectory(prefix="wr061-verify-") as temp:
        path = Path(temp) / "object"
        path.write_bytes(payload)
        assert read.verify_file(path, item, "test")["status"] == "PASS"
        path.write_bytes(payload + b"x")
        expect_contract(lambda: read.verify_file(path, item, "test"), "identity mismatch")


def test_get_command_is_exactly_read_only() -> None:
    destination = Path("/tmp/wr061-test-output")
    captured: list[list[str]] = []

    def fake_run(command, **kwargs):
        captured.append(command)
        return subprocess.CompletedProcess(command, 0, "", "")

    with patch.object(read.subprocess, "run", fake_run):
        read.get_object(
            provider="test", endpoint="https://example.invalid", region="auto",
            bucket="bucket", key="custody/key", destination=destination,
            access_key="ACCESS_SENTINEL", secret_key="SECRET_SENTINEL",
        )
    assert len(captured) == 1
    assert captured[0][0:3] == ["aws", "s3api", "get-object"]
    assert "ACCESS_SENTINEL" not in captured[0]
    assert "SECRET_SENTINEL" not in captured[0]


def test_b2_transport_is_get_only() -> None:
    tree = ast.parse(MODULE_PATH.read_text(encoding="utf-8"))
    request_methods = [
        node.value.value for node in ast.walk(tree)
        if isinstance(node, ast.keyword) and node.arg == "method"
        and isinstance(node.value, ast.Constant)
    ]
    assert request_methods and set(request_methods) == {"GET"}


def test_backblaze_v4_response_binding() -> None:
    payload = b"retained-v4-fixture"
    digest = hashlib.sha256(payload).hexdigest()
    item = read.RetainedObject(
        2001, 2, digest, len(payload), f"custody/sha256/{digest}/raw"
    )
    config = {
        "WR_CUSTODY_B2_KEY_ID": "id",
        "WR_CUSTODY_B2_APPLICATION_KEY": "secret",
    }

    class Response:
        def __init__(self, body):
            self.body = body
            self.sent = False

        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

        def read(self, *_):
            if self.sent:
                return b""
            self.sent = True
            return self.body

    authorize = json.dumps({
        "authorizationToken": "provider-token",
        "apiInfo": {"storageApi": {
            "downloadUrl": "https://f005.backblazeb2.com",
            "allowed": {
                "buckets": [{"name": read.EXPECTED_B2_BUCKET}],
                "namePrefix": "custody/",
                "capabilities": ["readFiles"],
            },
        }},
    }).encode()
    responses = iter((Response(authorize), Response(payload)))
    with tempfile.TemporaryDirectory(prefix="wr061-v4-") as temp, patch.object(
        read.urllib.request, "urlopen", side_effect=lambda *_a, **_k: next(responses)
    ):
        destination = Path(temp) / "raw"
        read.b2_authorize_and_download(config=config, item=item, destination=destination)
        assert destination.read_bytes() == payload


def test_static_provider_boundary() -> None:
    source = MODULE_PATH.read_text(encoding="utf-8")
    tree = ast.parse(source)
    imported_modules = {
        alias.name for node in ast.walk(tree) if isinstance(node, (ast.Import, ast.ImportFrom))
        for alias in node.names
    }
    forbidden_helpers = {
        "prove_b2_r2_custody", "ensure_b2_custody_object",
        "run_source_manifest_custody", "run_normalized_custody_proof",
    }
    assert not imported_modules.intersection(forbidden_helpers)
    forbidden_calls = (
        "put-object", "upload", "copy-object", "multipart", "delete-object",
        "put-object-retention", "put-object-legal-hold", "put-bucket",
    )
    lowered = source.lower()
    for operation in forbidden_calls:
        assert operation not in lowered, operation


def test_cleanup_on_provider_failure() -> None:
    environment = {
        "RUNNER_TEMP": "",
        "WR_CUSTODY_B2_KEY_ID": "b2-key",
        "WR_CUSTODY_B2_APPLICATION_KEY": "b2-secret",
        "WR_CUSTODY_R2_ACCESS_KEY_ID": "r2-key",
        "WR_CUSTODY_R2_SECRET_ACCESS_KEY": "r2-secret",
        "WR_CUSTODY_B2_BUCKET": read.EXPECTED_B2_BUCKET,
        "WR_CUSTODY_B2_ENDPOINT": "https://s3.us-east-005.backblazeb2.com",
        "WR_CUSTODY_R2_BUCKET": read.EXPECTED_R2_BUCKET,
        "WR_CUSTODY_R2_ENDPOINT": "https://" + "a" * 32 + ".r2.cloudflarestorage.com",
    }
    with tempfile.TemporaryDirectory(prefix="wr061-cleanup-") as temp:
        environment["RUNNER_TEMP"] = temp
        raw = Path(temp) / "raw"
        report = Path(temp) / "report.json"
        with patch.dict(os.environ, environment, clear=True), patch.object(
            read, "b2_authorize_and_download", side_effect=read.ContractError("synthetic GET failure")
        ):
            expect_contract(lambda: read.execute(raw, report), "synthetic GET failure")
        assert not raw.exists()
        assert not report.exists()


def test_workflow_security_contract() -> None:
    workflow = WORKFLOW.read_text(encoding="utf-8")
    assert "actions/upload-artifact" not in workflow
    assert "WR_CUSTODY_B2_APPLICATION_KEY" in workflow
    assert "WR_CUSTODY_R2_SECRET_ACCESS_KEY" in workflow
    assert "Provider-secret isolation proof" in workflow
    assert "if: always()" in workflow
    assert "scripts/custody/read_retained_objects.py" in workflow
    for forbidden in (
        "prove_b2_r2_custody.py", "ensure_b2_custody_object.py",
        "run_source_manifest_custody.py", "run_normalized_custody_proof.py",
    ):
        assert forbidden not in workflow
    # Secrets are forbidden at workflow/job scope; the first occurrence must be
    # nested beneath the trusted retrieval step's env block.
    trusted_step = workflow.index("Retrieve and verify exact retained objects")
    secret_position = workflow.index("WR_CUSTODY_B2_APPLICATION_KEY")
    consumer_step = workflow.index("Provider-secret isolation proof")
    assert trusted_step < secret_position < consumer_step
    consumer_text = workflow[consumer_step:]
    assert "${{ secrets." not in consumer_text


def main() -> int:
    test_exact_allowlist()
    test_verifier()
    test_get_command_is_exactly_read_only()
    test_b2_transport_is_get_only()
    test_backblaze_v4_response_binding()
    test_static_provider_boundary()
    test_cleanup_on_provider_failure()
    test_workflow_security_contract()
    print("WR-061 GET-only retained-object regressions: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
