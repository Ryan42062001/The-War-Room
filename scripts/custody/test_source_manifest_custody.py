#!/usr/bin/env python3
"""Offline deterministic regressions for the WR-056 custody execution bridge."""

from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory

MODULE_PATH = Path(__file__).with_name("run_source_manifest_custody.py")
SPEC = importlib.util.spec_from_file_location("source_custody", MODULE_PATH)
assert SPEC and SPEC.loader
custody = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(custody)
PROOF_PATH = Path(__file__).with_name("prove_b2_r2_custody.py")
PROOF_SPEC = importlib.util.spec_from_file_location("custody_proof", PROOF_PATH)
assert PROOF_SPEC and PROOF_SPEC.loader
proof = importlib.util.module_from_spec(PROOF_SPEC)
PROOF_SPEC.loader.exec_module(proof)

PAYLOADS = {
    "fixture-a": b"lawful non-sensitive fixture A\n",
    "fixture-b": b"lawful non-sensitive fixture B\n",
}


def source(source_id: str, asset_id: int, payload: bytes) -> dict:
    return {
        "source_id": source_id,
        "source_class": "LAWFUL_NON_SENSITIVE_FIXTURE",
        "rights_state": "RAW_CUSTODY_ALLOWED",
        "provider": "github_release_asset",
        "repository": "jqlang/jq",
        "asset_id": asset_id,
        "filename": f"{source_id}.bin",
        "season": None,
        "expected_sha256": hashlib.sha256(payload).hexdigest(),
        "expected_size_bytes": len(payload),
        "content_type": "application/octet-stream",
    }


def manifest(*sources: dict) -> dict:
    return {
        "schema_version": custody.SCHEMA_VERSION,
        "task_id": "WR-056",
        "manifest_id": "wr056-offline-regression",
        "sources": copy.deepcopy(list(sources)),
    }


class FakeRunner:
    def __init__(self, payload_by_asset: dict[int, bytes], fail_on: str | None = None):
        self.payload_by_asset = payload_by_asset
        self.fail_on = fail_on
        self.commands: list[list[str]] = []

    def __call__(self, command: list[str]) -> None:
        self.commands.append(command)
        program = Path(command[1]).name
        if self.fail_on == program:
            raise RuntimeError("synthetic provider failure SECRET_SENTINEL")
        if program == "acquire_github_release_asset.py":
            asset = int(command[command.index("--asset-id") + 1])
            output = Path(command[command.index("--output") + 1])
            output.write_bytes(self.payload_by_asset[asset])
        elif program == "prove_b2_r2_custody.py":
            expected_sha = command[command.index("--expected-sha256") + 1]
            expected_size = int(command[command.index("--expected-size") + 1])
            source_id = command[command.index("--source-id") + 1]
            report = Path(command[command.index("--report") + 1])
            report.write_text(
                __import__("json").dumps({
                    "content_addressed_object_key": f"custody/sha256/{expected_sha}/raw",
                    "all_three_sha256_equal": True,
                    "all_three_byte_sizes_equal": True,
                    "primary": {"retention_mode": "COMPLIANCE", "legal_hold": "ON"},
                    "independent_backup": {"lock_rule_condition": "Indefinite"},
                    "fixture": {"source_id": source_id, "byte_size": expected_size},
                }),
                encoding="utf-8",
            )


def expect_rejected(value: dict, phrase: str) -> None:
    try:
        custody.validate_manifest(value)
    except custody.ContractError as exc:
        assert phrase in str(exc), (phrase, str(exc))
    else:
        raise AssertionError(f"expected rejection containing {phrase!r}")


def test_validation() -> None:
    a = source("fixture-a", 101, PAYLOADS["fixture-a"])
    b = source("fixture-b", 102, PAYLOADS["fixture-b"])
    one = custody.validate_manifest(manifest(a))
    assert [item["source_id"] for item in one["sources"]] == ["fixture-a"]
    two = custody.validate_manifest(manifest(b, a))
    assert [item["source_id"] for item in two["sources"]] == ["fixture-a", "fixture-b"]

    duplicate_id = manifest(a, {**b, "source_id": "fixture-a"})
    expect_rejected(duplicate_id, "duplicate source identity")
    duplicate_object = manifest(a, {**b, "asset_id": 101})
    expect_rejected(duplicate_object, "duplicate provider-object identity")
    missing = manifest(a)
    del missing["sources"][0]["filename"]
    expect_rejected(missing, "fields invalid")
    unknown = manifest(a)
    unknown["sources"][0]["surprise"] = True
    expect_rejected(unknown, "fields invalid")
    missing_top = manifest(a)
    del missing_top["manifest_id"]
    expect_rejected(missing_top, "fields invalid")
    unknown_top = manifest(a)
    unknown_top["extra"] = "no"
    expect_rejected(unknown_top, "fields invalid")

    cases = [
        ("expected_sha256", "z" * 64, "expected_sha256"),
        ("expected_size_bytes", 0, "expected_size_bytes"),
        ("asset_id", 0, "asset_id"),
        ("filename", "../escape", "filename"),
    ]
    for field, value, phrase in cases:
        bad = manifest({**a, field: value})
        expect_rejected(bad, phrase)

    expect_rejected(manifest({**a, "repository": "example/unsupported"}), "repository")
    expect_rejected(manifest({**a, "provider": "mutable_url"}), "provider")
    expect_rejected(manifest({**a, "source_class": "UNKNOWN"}), "source class")
    expect_rejected(manifest({**a, "season": 2026}), "no later than 2025")
    expect_rejected(
        manifest({**a, "rights_state": "RESTRICTED_RAW_CUSTODY_PENDING_RIGHTS_REVIEW"}),
        "rights state",
    )


def run_once(sources: list[dict], payloads: dict[int, bytes], fail_on: str | None = None):
    normalized = custody.validate_manifest(manifest(*sources))
    with TemporaryDirectory(prefix="wr056-test-") as name:
        root = Path(name)
        report = root / "report.json"
        runner = FakeRunner(payloads, fail_on)
        try:
            result = custody.execute_manifest(normalized, root, report, runner)
        except Exception:
            assert list(root.iterdir()) == [], "temporary files survived failure"
            raise
        leftovers = list(root.iterdir())
        assert leftovers == [report], leftovers
        return report.read_bytes(), result, runner.commands


def test_execution_and_determinism() -> None:
    a = source("fixture-a", 101, PAYLOADS["fixture-a"])
    b = source("fixture-b", 102, PAYLOADS["fixture-b"])
    payloads = {101: PAYLOADS["fixture-a"], 102: PAYLOADS["fixture-b"]}
    first, result, commands = run_once([b, a], payloads)
    second, _, _ = run_once([a, b], payloads)
    assert first == second
    assert [item["source_id"] for item in result["sources"]] == ["fixture-a", "fixture-b"]
    assert result["privacy"]["secrets_logged"] is False
    assert result["research_source_admission"] is False
    assert all(
        item["content_addressed_object_key"]
        == f"custody/sha256/{item['sha256']}/raw"
        for item in result["sources"]
    )
    assert len(commands) == 6


def test_download_mismatches_precede_provider_handling() -> None:
    a = source("fixture-a", 101, PAYLOADS["fixture-a"])
    for payload, phrase in [
        (b"different bytes but same size!"[: len(PAYLOADS["fixture-a"])], "digest mismatch"),
        (PAYLOADS["fixture-a"] + b"x", "digest mismatch"),
    ]:
        normalized = custody.validate_manifest(manifest(a))
        with TemporaryDirectory(prefix="wr056-mismatch-") as name:
            root = Path(name)
            runner = FakeRunner({101: payload})
            try:
                custody.execute_manifest(normalized, root, root / "report.json", runner)
            except custody.ContractError as exc:
                assert phrase in str(exc)
                assert len(runner.commands) == 1, "provider handling ran after bad download"
                assert list(root.iterdir()) == []
            else:
                raise AssertionError("mismatched download was accepted")

    wrong_size = {**a, "expected_size_bytes": len(PAYLOADS["fixture-a"]) + 1}
    normalized = custody.validate_manifest(manifest(wrong_size))
    with TemporaryDirectory(prefix="wr056-size-") as name:
        root = Path(name)
        runner = FakeRunner({101: PAYLOADS["fixture-a"]})
        try:
            custody.execute_manifest(normalized, root, root / "report.json", runner)
        except custody.ContractError as exc:
            assert "size mismatch" in str(exc)
            assert len(runner.commands) == 1
            assert list(root.iterdir()) == []
        else:
            raise AssertionError("size mismatch was accepted")


def test_partial_provider_failure_and_redaction() -> None:
    a = source("fixture-a", 101, PAYLOADS["fixture-a"])
    normalized = custody.validate_manifest(manifest(a))
    with TemporaryDirectory(prefix="wr056-provider-") as name:
        root = Path(name)
        try:
            custody.execute_manifest(
                normalized, root, root / "report.json",
                FakeRunner({101: PAYLOADS["fixture-a"]}, "prove_b2_r2_custody.py"),
            )
        except RuntimeError:
            assert list(root.iterdir()) == []
        else:
            raise AssertionError("partial provider failure did not fail closed")
    old = __import__("os").environ.get("WR_CUSTODY_B2_APPLICATION_KEY")
    __import__("os").environ["WR_CUSTODY_B2_APPLICATION_KEY"] = "SECRET_SENTINEL"
    try:
        assert "SECRET_SENTINEL" not in custody.sanitize("error SECRET_SENTINEL")
    finally:
        if old is None:
            del __import__("os").environ["WR_CUSTODY_B2_APPLICATION_KEY"]
        else:
            __import__("os").environ["WR_CUSTODY_B2_APPLICATION_KEY"] = old


def test_wr046_default_report_identity_is_preserved() -> None:
    assert proof.report_fixture_identity(
        "WR-046", "jqlang-jq-attestation",
        proof.EXPECTED_FIXTURE_SHA256, proof.EXPECTED_FIXTURE_SIZE,
    ) == {
        "name": "jqlang/jq jq-attestation.json",
        "asset_id": 453012755,
        "sha256": proof.EXPECTED_FIXTURE_SHA256,
        "byte_size": proof.EXPECTED_FIXTURE_SIZE,
    }


def main() -> int:
    test_validation()
    test_execution_and_determinism()
    test_download_mismatches_precede_provider_handling()
    test_partial_provider_failure_and_redaction()
    test_wr046_default_report_identity_is_preserved()
    print("WR-056 source-manifest custody regressions: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
