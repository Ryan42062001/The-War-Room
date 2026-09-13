#!/usr/bin/env python3
"""Prove custody against Backblaze B2 primary and Cloudflare R2 backup.

This script retains the lawful WR-046 defaults and accepts a preverified object
identity from the trusted WR-056 manifest bridge. It never admits research
sources. It uploads by a content-addressed SHA-256
key, verifies storage-layer immutability controls, retrieves both copies
independently, and emits a privacy-safe JSON report.

Credentials are consumed only from environment variables and are never written to
the report or intentionally printed.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

EXPECTED_FIXTURE_SHA256 = "01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed"
EXPECTED_FIXTURE_SIZE = 14380
OBJECT_PREFIX = "custody/sha256"
B2_RETENTION_DAYS = 3000
MIN_COMPLIANCE_DAYS = 7 * 365
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
B2_ENDPOINT_RE = re.compile(r"^https://s3\.([a-z0-9-]+)\.backblazeb2\.com/?$")

SECRET_ENV_NAMES = (
    "WR_CUSTODY_B2_KEY_ID",
    "WR_CUSTODY_B2_APPLICATION_KEY",
    "WR_CUSTODY_R2_ACCESS_KEY_ID",
    "WR_CUSTODY_R2_SECRET_ACCESS_KEY",
    "WR_CUSTODY_R2_CONFIG_READ_TOKEN",
)
VARIABLE_ENV_NAMES = (
    "WR_CUSTODY_B2_BUCKET",
    "WR_CUSTODY_B2_ENDPOINT",
    "WR_CUSTODY_R2_BUCKET",
    "WR_CUSTODY_R2_ENDPOINT",
    "WR_CUSTODY_R2_ACCOUNT_ID",
    "WR_CUSTODY_R2_JURISDICTION",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture", type=Path)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--expected-sha256", default=EXPECTED_FIXTURE_SHA256)
    parser.add_argument("--expected-size", type=int, default=EXPECTED_FIXTURE_SIZE)
    parser.add_argument("--task-id", default="WR-046")
    parser.add_argument("--source-id", default="jqlang-jq-attestation")
    parser.add_argument("--content-type", default="application/json")
    parser.add_argument("--self-test", action="store_true")
    return parser.parse_args()


def sha256_and_size(path: Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    size = 0
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
            size += len(chunk)
    return digest.hexdigest(), size


def sanitize(text: str) -> str:
    cleaned = text
    for name in SECRET_ENV_NAMES:
        value = os.environ.get(name)
        if value:
            cleaned = cleaned.replace(value, "***")
    return cleaned


def require_environment() -> dict[str, str]:
    missing = [name for name in (*SECRET_ENV_NAMES, *VARIABLE_ENV_NAMES) if not os.environ.get(name)]
    if missing:
        raise RuntimeError("missing required environment names: " + ", ".join(sorted(missing)))
    return {name: os.environ[name] for name in (*SECRET_ENV_NAMES, *VARIABLE_ENV_NAMES)}


def parse_b2_region(endpoint: str) -> str:
    match = B2_ENDPOINT_RE.fullmatch(endpoint)
    if not match:
        raise ValueError(
            "WR_CUSTODY_B2_ENDPOINT must match https://s3.<region>.backblazeb2.com"
        )
    return match.group(1)


def aws_env(access_key: str, secret_key: str, region: str) -> dict[str, str]:
    env = os.environ.copy()
    env.update(
        {
            "AWS_ACCESS_KEY_ID": access_key,
            "AWS_SECRET_ACCESS_KEY": secret_key,
            "AWS_DEFAULT_REGION": region,
            "AWS_REGION": region,
            "AWS_EC2_METADATA_DISABLED": "true",
            "AWS_PAGER": "",
        }
    )
    return env


def run_aws(
    args: list[str],
    *,
    endpoint: str,
    region: str,
    access_key: str,
    secret_key: str,
    allow_not_found: bool = False,
) -> dict[str, Any] | None:
    command = [
        "aws",
        "s3api",
        *args,
        "--endpoint-url",
        endpoint,
        "--region",
        region,
        "--output",
        "json",
        "--no-cli-pager",
    ]
    result = subprocess.run(
        command,
        env=aws_env(access_key, secret_key, region),
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        stderr = sanitize(result.stderr or "")
        if allow_not_found and any(
            marker in stderr
            for marker in ("404", "Not Found", "NoSuchKey", "NoSuchObject", "NoSuchVersion")
        ):
            return None
        raise RuntimeError(f"storage command failed ({result.returncode}): {stderr.strip()}")
    stdout = (result.stdout or "").strip()
    if not stdout:
        return {}
    try:
        return json.loads(stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("storage command returned non-JSON output") from exc


def object_args(bucket: str, key: str, version_id: str | None) -> list[str]:
    args = ["--bucket", bucket, "--key", key]
    if version_id:
        args += ["--version-id", version_id]
    return args


def retention_datetime(days: int) -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=days)


def iso_z(value: dt.datetime) -> str:
    return value.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_timestamp(value: str) -> dt.datetime:
    parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return parsed.astimezone(dt.timezone.utc)


def metadata_sha(head: dict[str, Any]) -> str | None:
    metadata = head.get("Metadata") or {}
    for key, value in metadata.items():
        if key.lower() == "wr-sha256":
            return str(value).lower()
    return None


def ensure_digest(path: Path, expected_sha: str, expected_size: int, label: str) -> dict[str, Any]:
    actual_sha, actual_size = sha256_and_size(path)
    if actual_sha != expected_sha or actual_size != expected_size:
        raise RuntimeError(
            f"{label} identity mismatch: sha256={actual_sha} bytes={actual_size}"
        )
    return {"sha256": actual_sha, "byte_size": actual_size}


def r2_lock_rules(account_id: str, bucket: str, jurisdiction: str, token: str) -> list[dict[str, Any]]:
    encoded_bucket = urllib.parse.quote(bucket, safe="")
    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{urllib.parse.quote(account_id, safe='')}/r2/buckets/{encoded_bucket}/lock"
    )
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "User-Agent": "the-war-room-wr046-custody-proof/1.0",
    }
    if jurisdiction and jurisdiction != "default":
        headers["cf-r2-jurisdiction"] = jurisdiction
    request = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body = response.read()
    except urllib.error.HTTPError as exc:
        detail = ""
        try:
            detail = exc.read().decode("utf-8", "replace")
        except Exception:
            pass
        raise RuntimeError(
            f"Cloudflare lock-rule verification failed: HTTP {exc.code} {sanitize(detail)[:500]}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Cloudflare lock-rule verification failed: {exc.reason}") from exc

    try:
        payload = json.loads(body)
    except json.JSONDecodeError as exc:
        raise RuntimeError("Cloudflare lock-rule response was not valid JSON") from exc
    if not payload.get("success"):
        raise RuntimeError("Cloudflare lock-rule response reported success=false")
    result = payload.get("result") or {}
    rules = result.get("rules") or []
    if not isinstance(rules, list):
        raise RuntimeError("Cloudflare lock-rule response had invalid rules")
    return [rule for rule in rules if isinstance(rule, dict)]


def prefix_covers(prefix: str | None, object_key: str) -> bool:
    return not prefix or object_key.startswith(prefix)


def find_indefinite_rule(rules: list[dict[str, Any]], object_key: str) -> dict[str, Any] | None:
    for rule in rules:
        condition = rule.get("condition") or {}
        if (
            rule.get("enabled") is True
            and condition.get("type") == "Indefinite"
            and prefix_covers(rule.get("prefix"), object_key)
        ):
            return rule
    return None


def verify_fixture(fixture: Path, expected_sha: str, expected_size: int) -> None:
    ensure_digest(fixture, expected_sha, expected_size, "fixture")


def report_fixture_identity(
    task_id: str, source_id: str, expected_sha: str, expected_size: int
) -> dict[str, Any]:
    if (
        task_id == "WR-046"
        and source_id == "jqlang-jq-attestation"
        and expected_sha == EXPECTED_FIXTURE_SHA256
        and expected_size == EXPECTED_FIXTURE_SIZE
    ):
        return {
            "name": "jqlang/jq jq-attestation.json",
            "asset_id": 453012755,
            "sha256": expected_sha,
            "byte_size": expected_size,
        }
    return {
        "source_id": source_id,
        "sha256": expected_sha,
        "byte_size": expected_size,
    }


def prove_b2(fixture: Path, key: str, cfg: dict[str, str], tempdir: Path, expected_sha: str, expected_size: int, content_type: str) -> dict[str, Any]:
    bucket = cfg["WR_CUSTODY_B2_BUCKET"]
    endpoint = cfg["WR_CUSTODY_B2_ENDPOINT"].rstrip("/")
    region = parse_b2_region(endpoint)
    access_key = cfg["WR_CUSTODY_B2_KEY_ID"]
    secret_key = cfg["WR_CUSTODY_B2_APPLICATION_KEY"]

    head = run_aws(
        ["head-object", "--bucket", bucket, "--key", key],
        endpoint=endpoint,
        region=region,
        access_key=access_key,
        secret_key=secret_key,
        allow_not_found=True,
    )

    if head is not None:
        version_id = head.get("VersionId")
        if metadata_sha(head) != expected_sha:
            raise RuntimeError("B2 existing object metadata SHA-256 does not match content-addressed key")
        precheck = tempdir / "b2-existing-prelock.bin"
        run_aws(
            ["get-object", *object_args(bucket, key, version_id), str(precheck)],
            endpoint=endpoint,
            region=region,
            access_key=access_key,
            secret_key=secret_key,
        )
        ensure_digest(precheck, expected_sha, expected_size, "B2 existing object")
        precheck.unlink(missing_ok=True)
    else:
        retain_until = iso_z(retention_datetime(B2_RETENTION_DAYS))
        run_aws(
            [
                "put-object",
                "--bucket",
                bucket,
                "--key",
                key,
                "--body",
                str(fixture),
                "--content-type",
                content_type,
                "--metadata",
                f"wr-sha256={expected_sha}",
                "--object-lock-mode",
                "COMPLIANCE",
                "--object-lock-retain-until-date",
                retain_until,
                "--object-lock-legal-hold-status",
                "ON",
            ],
            endpoint=endpoint,
            region=region,
            access_key=access_key,
            secret_key=secret_key,
        )
        head = run_aws(
            ["head-object", "--bucket", bucket, "--key", key],
            endpoint=endpoint,
            region=region,
            access_key=access_key,
            secret_key=secret_key,
        )
        version_id = head.get("VersionId") if head else None

    if head is None:
        raise RuntimeError("B2 head-object unexpectedly missing after upload")
    version_id = head.get("VersionId")
    if metadata_sha(head) != expected_sha:
        raise RuntimeError("B2 object metadata SHA-256 missing or incorrect after upload")

    target_until = retention_datetime(B2_RETENTION_DAYS)
    retention_args = object_args(bucket, key, version_id)
    current_retention = run_aws(
        ["get-object-retention", *retention_args],
        endpoint=endpoint,
        region=region,
        access_key=access_key,
        secret_key=secret_key,
    ) or {}
    current = current_retention.get("Retention") or {}
    current_mode = current.get("Mode")
    current_until_raw = current.get("RetainUntilDate")
    current_until = parse_timestamp(current_until_raw) if current_until_raw else None

    if current_mode not in (None, "COMPLIANCE"):
        raise RuntimeError(f"B2 object retention mode must be COMPLIANCE, got {current_mode!r}")
    if current_until is None or current_until < target_until - dt.timedelta(minutes=5):
        run_aws(
            [
                "put-object-retention",
                *retention_args,
                "--retention",
                f"Mode=COMPLIANCE,RetainUntilDate={iso_z(target_until)}",
            ],
            endpoint=endpoint,
            region=region,
            access_key=access_key,
            secret_key=secret_key,
        )

    run_aws(
        [
            "put-object-legal-hold",
            *retention_args,
            "--legal-hold",
            "Status=ON",
        ],
        endpoint=endpoint,
        region=region,
        access_key=access_key,
        secret_key=secret_key,
    )

    verified_retention = run_aws(
        ["get-object-retention", *retention_args],
        endpoint=endpoint,
        region=region,
        access_key=access_key,
        secret_key=secret_key,
    ) or {}
    verified_hold = run_aws(
        ["get-object-legal-hold", *retention_args],
        endpoint=endpoint,
        region=region,
        access_key=access_key,
        secret_key=secret_key,
    ) or {}
    retention = verified_retention.get("Retention") or {}
    hold = verified_hold.get("LegalHold") or {}

    if retention.get("Mode") != "COMPLIANCE":
        raise RuntimeError("B2 retained object is not in COMPLIANCE mode")
    retain_until_raw = retention.get("RetainUntilDate")
    if not retain_until_raw:
        raise RuntimeError("B2 retained object has no retention expiration")
    retain_until = parse_timestamp(retain_until_raw)
    minimum_until = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=MIN_COMPLIANCE_DAYS)
    if retain_until < minimum_until:
        raise RuntimeError("B2 COMPLIANCE retention is shorter than seven years")
    if hold.get("Status") != "ON":
        raise RuntimeError("B2 Legal Hold is not ON")

    retrieved = tempdir / "b2-retrieved.bin"
    run_aws(
        ["get-object", *object_args(bucket, key, version_id), str(retrieved)],
        endpoint=endpoint,
        region=region,
        access_key=access_key,
        secret_key=secret_key,
    )
    identity = ensure_digest(
        retrieved, expected_sha, expected_size, "B2 retrieved copy"
    )
    retrieved.unlink(missing_ok=True)

    return {
        "provider": "Backblaze B2",
        "bucket": bucket,
        "endpoint": endpoint,
        "region": region,
        "object_key": key,
        "version_id": version_id,
        "retention_mode": retention.get("Mode"),
        "retain_until": iso_z(retain_until),
        "legal_hold": hold.get("Status"),
        "retrieved_sha256": identity["sha256"],
        "retrieved_byte_size": identity["byte_size"],
    }


def prove_r2(fixture: Path, key: str, cfg: dict[str, str], tempdir: Path, expected_sha: str, expected_size: int, content_type: str) -> dict[str, Any]:
    bucket = cfg["WR_CUSTODY_R2_BUCKET"]
    endpoint = cfg["WR_CUSTODY_R2_ENDPOINT"].rstrip("/")
    account_id = cfg["WR_CUSTODY_R2_ACCOUNT_ID"]
    jurisdiction = cfg["WR_CUSTODY_R2_JURISDICTION"]
    access_key = cfg["WR_CUSTODY_R2_ACCESS_KEY_ID"]
    secret_key = cfg["WR_CUSTODY_R2_SECRET_ACCESS_KEY"]
    read_token = cfg["WR_CUSTODY_R2_CONFIG_READ_TOKEN"]

    rules_before = r2_lock_rules(account_id, bucket, jurisdiction, read_token)
    matching_rule = find_indefinite_rule(rules_before, key)
    if matching_rule is None:
        raise RuntimeError("R2 has no enabled indefinite Bucket Lock rule covering custody object key")

    head = run_aws(
        ["head-object", "--bucket", bucket, "--key", key],
        endpoint=endpoint,
        region="auto",
        access_key=access_key,
        secret_key=secret_key,
        allow_not_found=True,
    )
    if head is not None:
        if metadata_sha(head) != expected_sha:
            raise RuntimeError("R2 existing object metadata SHA-256 does not match content-addressed key")
        existing = tempdir / "r2-existing-prewrite.bin"
        run_aws(
            ["get-object", "--bucket", bucket, "--key", key, str(existing)],
            endpoint=endpoint,
            region="auto",
            access_key=access_key,
            secret_key=secret_key,
        )
        ensure_digest(existing, expected_sha, expected_size, "R2 existing object")
        existing.unlink(missing_ok=True)
    else:
        run_aws(
            [
                "put-object",
                "--bucket",
                bucket,
                "--key",
                key,
                "--body",
                str(fixture),
                "--content-type",
                content_type,
                "--metadata",
                f"wr-sha256={expected_sha}",
            ],
            endpoint=endpoint,
            region="auto",
            access_key=access_key,
            secret_key=secret_key,
        )

    head_after = run_aws(
        ["head-object", "--bucket", bucket, "--key", key],
        endpoint=endpoint,
        region="auto",
        access_key=access_key,
        secret_key=secret_key,
    )
    if head_after is None or metadata_sha(head_after) != expected_sha:
        raise RuntimeError("R2 object metadata SHA-256 missing or incorrect after upload")

    retrieved = tempdir / "r2-retrieved.bin"
    run_aws(
        ["get-object", "--bucket", bucket, "--key", key, str(retrieved)],
        endpoint=endpoint,
        region="auto",
        access_key=access_key,
        secret_key=secret_key,
    )
    identity = ensure_digest(
        retrieved, expected_sha, expected_size, "R2 retrieved copy"
    )
    retrieved.unlink(missing_ok=True)

    rules_after = r2_lock_rules(account_id, bucket, jurisdiction, read_token)
    matching_rule_after = find_indefinite_rule(rules_after, key)
    if matching_rule_after is None:
        raise RuntimeError("R2 indefinite Bucket Lock no longer covers custody object after upload")

    return {
        "provider": "Cloudflare R2",
        "bucket": bucket,
        "endpoint": endpoint,
        "jurisdiction": jurisdiction,
        "object_key": key,
        "lock_rule_id": matching_rule_after.get("id"),
        "lock_rule_prefix": matching_rule_after.get("prefix") or "",
        "lock_rule_condition": "Indefinite",
        "retrieved_sha256": identity["sha256"],
        "retrieved_byte_size": identity["byte_size"],
    }


def self_test() -> int:
    key = f"{OBJECT_PREFIX}/{EXPECTED_FIXTURE_SHA256}/raw"
    rules = [
        {
            "id": "wrong",
            "enabled": True,
            "prefix": "other/",
            "condition": {"type": "Indefinite"},
        },
        {
            "id": "right",
            "enabled": True,
            "prefix": "custody/",
            "condition": {"type": "Indefinite"},
        },
    ]
    assert find_indefinite_rule(rules, key)["id"] == "right"
    assert find_indefinite_rule(
        [{"id": "all", "enabled": True, "condition": {"type": "Indefinite"}}], key
    )["id"] == "all"
    assert find_indefinite_rule(
        [{"id": "age", "enabled": True, "prefix": "custody/", "condition": {"type": "Age"}}],
        key,
    ) is None
    assert parse_b2_region("https://s3.us-west-004.backblazeb2.com") == "us-west-004"
    assert SHA256_RE.fullmatch(EXPECTED_FIXTURE_SHA256)
    print(
        json.dumps(
            {
                "self_test": "PASS",
                "secret_environment_names": list(SECRET_ENV_NAMES),
                "variable_environment_names": list(VARIABLE_ENV_NAMES),
            },
            sort_keys=True,
        )
    )
    return 0


def main() -> int:
    args = parse_args()
    if args.self_test:
        return self_test()
    if args.fixture is None or args.report is None:
        raise SystemExit("--fixture and --report are required unless --self-test is used")

    expected_sha = args.expected_sha256.lower()
    if not SHA256_RE.fullmatch(expected_sha) or args.expected_size < 0:
        raise RuntimeError("invalid expected object identity")
    if not re.fullmatch(r"[A-Za-z0-9._:-]{1,128}", args.task_id):
        raise RuntimeError("invalid task ID")
    if not re.fullmatch(r"[A-Za-z0-9._:-]{1,200}", args.source_id):
        raise RuntimeError("invalid source ID")
    cfg = require_environment()
    verify_fixture(args.fixture, expected_sha, args.expected_size)
    key = f"{OBJECT_PREFIX}/{expected_sha}/raw"

    with tempfile.TemporaryDirectory(prefix="wr046-custody-") as tmp:
        tempdir = Path(tmp)
        b2 = prove_b2(args.fixture, key, cfg, tempdir, expected_sha, args.expected_size, args.content_type)
        r2 = prove_r2(args.fixture, key, cfg, tempdir, expected_sha, args.expected_size, args.content_type)

    if (
        b2["retrieved_sha256"] != expected_sha
        or r2["retrieved_sha256"] != expected_sha
        or b2["retrieved_byte_size"] != args.expected_size
        or r2["retrieved_byte_size"] != args.expected_size
    ):
        raise RuntimeError("final two-provider identity equality check failed")

    fixture_identity = report_fixture_identity(
        args.task_id, args.source_id, expected_sha, args.expected_size
    )

    report = {
        "schema_version": 1,
        "task_id": args.task_id,
        "fixture": fixture_identity,
        "content_addressed_object_key": key,
        "primary": b2,
        "independent_backup": r2,
        "all_three_sha256_equal": True,
        "all_three_byte_sizes_equal": True,
        "secrets_in_report": False,
        "returning_player_v2_source_used": False,
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "task_id": args.task_id,
                "result": "PASS",
                "content_addressed_object_key": key,
                "sha256": expected_sha,
                "byte_size": args.expected_size,
                "b2_retention_mode": b2["retention_mode"],
                "b2_legal_hold": b2["legal_hold"],
                "r2_lock_condition": r2["lock_rule_condition"],
                "secrets_logged": False,
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"WR-046 custody proof failed: {sanitize(str(exc))}", file=sys.stderr)
        raise SystemExit(2)
