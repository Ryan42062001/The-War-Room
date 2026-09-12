#!/usr/bin/env python3
"""Ensure the lawful WR-046 fixture exists in Backblaze B2 with immutable controls.

This helper exists because S3-compatible HEAD requests against a not-yet-existing
object can be reported as forbidden under tightly scoped credentials. It keeps the
credential least-privileged: probe first, and on 403/404 attempt the exact
content-addressed PutObject. The main proof script then independently verifies the
stored object, retention, legal hold, retrieval, digest, and size.
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
from pathlib import Path

EXPECTED_SHA256 = "01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed"
EXPECTED_SIZE = 14380
OBJECT_KEY = f"custody/sha256/{EXPECTED_SHA256}/raw"
RETENTION_DAYS = 3000
B2_ENDPOINT_RE = re.compile(r"^https://s3\.([a-z0-9-]+)\.backblazeb2\.com/?$")
SECRET_NAMES = ("WR_CUSTODY_B2_KEY_ID", "WR_CUSTODY_B2_APPLICATION_KEY")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture", required=True, type=Path)
    return parser.parse_args()


def sanitize(text: str) -> str:
    cleaned = text
    for name in SECRET_NAMES:
        value = os.environ.get(name)
        if value:
            cleaned = cleaned.replace(value, "***")
    return cleaned


def require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"missing required environment name: {name}")
    return value


def sha256_and_size(path: Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    size = 0
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
            size += len(chunk)
    return digest.hexdigest(), size


def aws_env(key_id: str, app_key: str, region: str) -> dict[str, str]:
    env = os.environ.copy()
    env.update(
        {
            "AWS_ACCESS_KEY_ID": key_id,
            "AWS_SECRET_ACCESS_KEY": app_key,
            "AWS_DEFAULT_REGION": region,
            "AWS_REGION": region,
            "AWS_EC2_METADATA_DISABLED": "true",
            "AWS_PAGER": "",
        }
    )
    return env


def run_aws(args: list[str], *, endpoint: str, region: str, key_id: str, app_key: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
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
        ],
        env=aws_env(key_id, app_key, region),
        text=True,
        capture_output=True,
        check=False,
    )


def iso_z(value: dt.datetime) -> str:
    return value.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def main() -> int:
    args = parse_args()
    digest, size = sha256_and_size(args.fixture)
    if digest != EXPECTED_SHA256 or size != EXPECTED_SIZE:
        raise RuntimeError(f"fixture identity mismatch: sha256={digest} bytes={size}")

    bucket = require("WR_CUSTODY_B2_BUCKET")
    endpoint = require("WR_CUSTODY_B2_ENDPOINT").rstrip("/")
    key_id = require("WR_CUSTODY_B2_KEY_ID")
    app_key = require("WR_CUSTODY_B2_APPLICATION_KEY")
    match = B2_ENDPOINT_RE.fullmatch(endpoint)
    if not match:
        raise RuntimeError("WR_CUSTODY_B2_ENDPOINT must match https://s3.<region>.backblazeb2.com")
    region = match.group(1)

    probe = run_aws(
        ["head-object", "--bucket", bucket, "--key", OBJECT_KEY],
        endpoint=endpoint,
        region=region,
        key_id=key_id,
        app_key=app_key,
    )
    if probe.returncode == 0:
        print(json.dumps({"b2_seed": "existing-object", "object_key": OBJECT_KEY}, sort_keys=True))
        return 0

    detail = sanitize(probe.stderr or "")
    if not any(marker in detail for marker in ("403", "404", "Forbidden", "Not Found", "NoSuchKey")):
        raise RuntimeError(f"B2 initial object probe failed ({probe.returncode}): {detail.strip()}")

    retain_until = iso_z(dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=RETENTION_DAYS))
    upload = run_aws(
        [
            "put-object",
            "--bucket",
            bucket,
            "--key",
            OBJECT_KEY,
            "--body",
            str(args.fixture),
            "--content-type",
            "application/json",
            "--metadata",
            f"wr-sha256={EXPECTED_SHA256}",
            "--object-lock-mode",
            "COMPLIANCE",
            "--object-lock-retain-until-date",
            retain_until,
            "--object-lock-legal-hold-status",
            "ON",
        ],
        endpoint=endpoint,
        region=region,
        key_id=key_id,
        app_key=app_key,
    )
    if upload.returncode != 0:
        raise RuntimeError(
            f"B2 content-addressed upload failed ({upload.returncode}): {sanitize(upload.stderr or '').strip()}"
        )

    print(
        json.dumps(
            {
                "b2_seed": "uploaded",
                "object_key": OBJECT_KEY,
                "sha256": EXPECTED_SHA256,
                "byte_size": EXPECTED_SIZE,
                "retention_mode": "COMPLIANCE",
                "legal_hold_requested": "ON",
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
        print(f"WR-046 B2 ensure failed: {sanitize(str(exc))}", file=sys.stderr)
        raise SystemExit(2)
