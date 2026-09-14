#!/usr/bin/env python3
"""GET-only retrieval of the four WR-061 retained custody objects.

This module deliberately has no runtime object-selection input. Provider credentials
are read only while executing the fixed B2/R2 GetObject sequence. Raw bytes remain
under RUNNER_TEMP for a later no-credentials consumer step and are never printed.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Mapping, Sequence


class ContractError(RuntimeError):
    """Fail-closed contract violation."""


@dataclass(frozen=True)
class RetainedObject:
    season: int
    asset_id: int
    sha256: str
    byte_size: int
    custody_key: str


ALLOWLIST: tuple[RetainedObject, ...] = (
    RetainedObject(2013, 512983282, "dbc7804c32c8dbf46120bfe4e724cdd926537509caa8a1bb96cd3b6e159b21f8", 792070, "custody/sha256/dbc7804c32c8dbf46120bfe4e724cdd926537509caa8a1bb96cd3b6e159b21f8/raw"),
    RetainedObject(2014, 512985320, "7046a0b75b845b3f70317a2c612eeaa3dad558895677525e64023cf49f867cd6", 816553, "custody/sha256/7046a0b75b845b3f70317a2c612eeaa3dad558895677525e64023cf49f867cd6/raw"),
    RetainedObject(2015, 512984105, "b977be3ec44102f766503b430fe1e158fed437e89c2d1857554aa85b0128e3eb", 815021, "custody/sha256/b977be3ec44102f766503b430fe1e158fed437e89c2d1857554aa85b0128e3eb/raw"),
    RetainedObject(2016, 512985505, "041473c2435ed408c4afab0661037dfcc9d2b830e922bd8fdb46fb3460c72424", 819194, "custody/sha256/041473c2435ed408c4afab0661037dfcc9d2b830e922bd8fdb46fb3460c72424/raw"),
)

EXPECTED_B2_BUCKET = "War-Room-Custody-Primary"
EXPECTED_R2_BUCKET = "war-room-custody-backup"
B2_ENDPOINT_RE = re.compile(r"^https://s3\.([a-z0-9-]+)\.backblazeb2\.com/?$")
R2_ENDPOINT_RE = re.compile(r"^https://[0-9a-f]{32}\.r2\.cloudflarestorage\.com/?$")
B2_DOWNLOAD_RE = re.compile(r"^https://f[0-9]+\.backblazeb2\.com/?$")
B2_AUTHORIZE_URL = "https://api.backblazeb2.com/b2api/v4/b2_authorize_account"
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
SECRET_NAMES = (
    "WR_CUSTODY_B2_KEY_ID",
    "WR_CUSTODY_B2_APPLICATION_KEY",
    "WR_CUSTODY_R2_ACCESS_KEY_ID",
    "WR_CUSTODY_R2_SECRET_ACCESS_KEY",
)
CONFIG_NAMES = (
    "WR_CUSTODY_B2_BUCKET",
    "WR_CUSTODY_B2_ENDPOINT",
    "WR_CUSTODY_R2_BUCKET",
    "WR_CUSTODY_R2_ENDPOINT",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    return parser.parse_args()


def canonical_allowlist(objects: Sequence[RetainedObject] = ALLOWLIST) -> list[dict]:
    return [asdict(item) for item in sorted(objects, key=lambda value: value.season)]


def validate_allowlist(objects: Sequence[RetainedObject] = ALLOWLIST) -> None:
    if canonical_allowlist(objects) != canonical_allowlist(ALLOWLIST):
        raise ContractError("retained-object request does not exactly equal the WR-061 allowlist")
    if len(objects) != 4 or len({item.season for item in objects}) != 4:
        raise ContractError("WR-061 allowlist must contain exactly four unique seasons")
    if len({item.custody_key for item in objects}) != 4:
        raise ContractError("WR-061 allowlist contains a duplicate provider-object identity")
    for item in objects:
        if not SHA256_RE.fullmatch(item.sha256) or item.byte_size <= 0:
            raise ContractError("WR-061 allowlist contains malformed digest or size")
        expected_key = f"custody/sha256/{item.sha256}/raw"
        if item.custody_key != expected_key:
            raise ContractError("WR-061 allowlist contains malformed content-addressed identity")


def require_environment(environment: Mapping[str, str] = os.environ) -> dict[str, str]:
    missing = [name for name in (*SECRET_NAMES, *CONFIG_NAMES) if not environment.get(name)]
    if missing:
        raise ContractError("missing required environment names: " + ", ".join(sorted(missing)))
    config = {name: environment[name] for name in (*SECRET_NAMES, *CONFIG_NAMES)}
    if config["WR_CUSTODY_B2_BUCKET"] != EXPECTED_B2_BUCKET:
        raise ContractError("unexpected B2 bucket")
    if config["WR_CUSTODY_R2_BUCKET"] != EXPECTED_R2_BUCKET:
        raise ContractError("unexpected R2 bucket")
    if not B2_ENDPOINT_RE.fullmatch(config["WR_CUSTODY_B2_ENDPOINT"]):
        raise ContractError("unexpected B2 endpoint")
    if not R2_ENDPOINT_RE.fullmatch(config["WR_CUSTODY_R2_ENDPOINT"]):
        raise ContractError("unexpected R2 endpoint")
    return config


def require_runner_temp(path: Path, environment: Mapping[str, str] = os.environ) -> Path:
    runner_temp_value = environment.get("RUNNER_TEMP")
    if not runner_temp_value:
        raise ContractError("RUNNER_TEMP is required")
    runner_temp = Path(runner_temp_value).resolve()
    resolved = path.resolve()
    if resolved == runner_temp or runner_temp not in resolved.parents:
        raise ContractError("raw/report path must be a child of RUNNER_TEMP")
    return resolved


def sha256_and_size(path: Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    size = 0
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
            size += len(chunk)
    return digest.hexdigest(), size


def verify_file(path: Path, item: RetainedObject, provider: str) -> dict:
    actual_sha, actual_size = sha256_and_size(path)
    if actual_sha != item.sha256 or actual_size != item.byte_size:
        raise ContractError(
            f"{provider} season {item.season} identity mismatch: "
            f"sha256={actual_sha} bytes={actual_size}"
        )
    return {"status": "PASS", "sha256": actual_sha, "byte_size": actual_size}


def aws_get_environment(access_key: str, secret_key: str, region: str) -> dict[str, str]:
    return {
        "PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
        "HOME": os.environ.get("RUNNER_TEMP", "/tmp"),
        "AWS_ACCESS_KEY_ID": access_key,
        "AWS_SECRET_ACCESS_KEY": secret_key,
        "AWS_DEFAULT_REGION": region,
        "AWS_REGION": region,
        "AWS_EC2_METADATA_DISABLED": "true",
        "AWS_PAGER": "",
    }


def get_object(*, provider: str, endpoint: str, region: str, bucket: str,
               key: str, destination: Path, access_key: str, secret_key: str) -> None:
    command = [
        "aws", "s3api", "get-object",
        "--bucket", bucket,
        "--key", key,
        str(destination),
        "--endpoint-url", endpoint.rstrip("/"),
        "--region", region,
        "--output", "json",
        "--no-cli-pager",
    ]
    result = subprocess.run(
        command,
        env=aws_get_environment(access_key, secret_key, region),
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        destination.unlink(missing_ok=True)
        # Provider output is intentionally not relayed: it can contain request IDs
        # or configuration details unnecessary for the privacy-safe evidence.
        raise ContractError(f"{provider} GetObject failed with exit code {result.returncode}")


def b2_authorize_and_download(*, config: Mapping[str, str], item: RetainedObject,
                              destination: Path) -> None:
    basic = base64.b64encode(
        f"{config['WR_CUSTODY_B2_KEY_ID']}:{config['WR_CUSTODY_B2_APPLICATION_KEY']}".encode()
    ).decode("ascii")
    authorize_request = urllib.request.Request(
        B2_AUTHORIZE_URL,
        headers={"Authorization": f"Basic {basic}", "Accept": "application/json"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(authorize_request, timeout=60) as response:
            payload = json.loads(response.read())
    except urllib.error.HTTPError as exc:
        raise ContractError(f"B2 authorization failed with HTTP {exc.code}") from exc
    except (urllib.error.URLError, json.JSONDecodeError) as exc:
        raise ContractError("B2 authorization failed closed") from exc
    storage = ((payload.get("apiInfo") or {}).get("storageApi") or {})
    allowed = storage.get("allowed") or {}
    buckets = allowed.get("buckets") or []
    bucket_names = [value.get("name") for value in buckets if isinstance(value, dict)]
    capabilities = set(allowed.get("capabilities") or [])
    if bucket_names != [EXPECTED_B2_BUCKET] or allowed.get("namePrefix") != "custody/":
        raise ContractError("B2 authorization is outside the exact bucket/prefix boundary")
    if "readFiles" not in capabilities:
        raise ContractError("B2 authorization lacks readFiles")
    download_url = str(storage.get("downloadUrl") or "").rstrip("/")
    token = str(payload.get("authorizationToken") or "")
    if not B2_DOWNLOAD_RE.fullmatch(download_url) or not token:
        raise ContractError("B2 authorization returned an invalid download boundary")
    url = (
        f"{download_url}/file/{urllib.parse.quote(EXPECTED_B2_BUCKET, safe='')}"
        f"/{urllib.parse.quote(item.custody_key, safe='/')}"
    )
    request = urllib.request.Request(
        url,
        headers={"Authorization": token, "Accept": "application/octet-stream"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response, destination.open("wb") as output:
            shutil.copyfileobj(response, output, length=1024 * 1024)
    except urllib.error.HTTPError as exc:
        destination.unlink(missing_ok=True)
        raise ContractError(f"B2 download failed with HTTP {exc.code}") from exc
    except (urllib.error.URLError, OSError) as exc:
        destination.unlink(missing_ok=True)
        raise ContractError("B2 download failed closed") from exc


def execute(output_dir: Path, report_path: Path) -> dict:
    validate_allowlist()
    config = require_environment()
    output_dir = require_runner_temp(output_dir)
    report_path = require_runner_temp(report_path)
    if output_dir == report_path or output_dir in report_path.parents:
        raise ContractError("report must be outside the raw-byte directory")
    shutil.rmtree(output_dir, ignore_errors=True)
    report_path.unlink(missing_ok=True)
    output_dir.mkdir(parents=True, mode=0o700)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    results: list[dict] = []
    try:
        for item in ALLOWLIST:
            row = {
                "season": item.season,
                "asset_id": item.asset_id,
                "custody_key": item.custody_key,
                "expected_sha256": item.sha256,
                "expected_byte_size": item.byte_size,
            }
            b2_path = output_dir / f"{item.season}.b2.raw"
            r2_path = output_dir / f"{item.season}.r2.raw"
            b2_authorize_and_download(config=config, item=item, destination=b2_path)
            row["b2"] = verify_file(b2_path, item, "B2")
            get_object(
                provider="R2", endpoint=config["WR_CUSTODY_R2_ENDPOINT"],
                region="auto", bucket=config["WR_CUSTODY_R2_BUCKET"],
                key=item.custody_key, destination=r2_path,
                access_key=config["WR_CUSTODY_R2_ACCESS_KEY_ID"],
                secret_key=config["WR_CUSTODY_R2_SECRET_ACCESS_KEY"],
            )
            row["r2"] = verify_file(r2_path, item, "R2")
            row["b2_r2_equal"] = b2_path.read_bytes() == r2_path.read_bytes()
            if not row["b2_r2_equal"]:
                raise ContractError(f"B2/R2 bytes differ for season {item.season}")
            results.append(row)
        report = {
            "schema_version": 1,
            "task_id": "WR-061",
            "result": "PASS",
            "objects": results,
            "provider_operations": {
                "B2": ["b2_authorize_account", "b2_download_file_by_name"],
                "R2": ["GetObject"],
            },
            "provider_mutation_operations": 0,
            "raw_storage": "runner-temporary-only",
            "raw_actions_artifacts": 0,
            "consumer_credentials_present": False,
        }
        report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        return report
    except BaseException:
        shutil.rmtree(output_dir, ignore_errors=True)
        report_path.unlink(missing_ok=True)
        raise


def main() -> int:
    args = parse_args()
    try:
        execute(args.output_dir, args.report)
    except (ContractError, OSError) as exc:
        print(f"WR-061 retained-object read failed closed: {exc}", file=__import__("sys").stderr)
        return 2
    print("WR-061 retained-object GET-only verification: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
