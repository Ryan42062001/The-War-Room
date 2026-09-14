#!/usr/bin/env python3
"""WR-063 exact-key, version-aware, non-mutating retained-object proof."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
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
    RetainedObject(2014, 512985320, "7046a0fd69b979d0649feb679a42f82f6e8e175d19587857d3e9371f09427cd6", 816553, "custody/sha256/7046a0fd69b979d0649feb679a42f82f6e8e175d19587857d3e9371f09427cd6/raw"),
    RetainedObject(2015, 512984105, "b977be5bc8cad6b02dfb755e78974b4486a505fa272f683add499b968878e3eb", 815021, "custody/sha256/b977be5bc8cad6b02dfb755e78974b4486a505fa272f683add499b968878e3eb/raw"),
    RetainedObject(2016, 512985505, "041473e5860ca6cfcba7a29e98b2ddfc3f01db0df2469d5b44e44135603e2424", 819194, "custody/sha256/041473e5860ca6cfcba7a29e98b2ddfc3f01db0df2469d5b44e44135603e2424/raw"),
)

REJECTED_WR061_DIGESTS = frozenset({
    "7046a0b75b845b3f70317a2c612eeaa3dad558895677525e64023cf49f867cd6",
    "b977be3ec44102f766503b430fe1e158fed437e89c2d1857554aa85b0128e3eb",
    "041473c2435ed408c4afab0661037dfcc9d2b830e922bd8fdb46fb3460c72424",
})
EXPECTED_B2_BUCKET = "War-Room-Custody-Primary"
EXPECTED_R2_BUCKET = "war-room-custody-backup"
B2_AUTHORIZE_URL = "https://api.backblazeb2.com/b2api/v4/b2_authorize_account"
B2_ENDPOINT_RE = re.compile(r"^https://s3\.[a-z0-9-]+\.backblazeb2\.com/?$")
R2_ENDPOINT_RE = re.compile(r"^https://[0-9a-f]{32}\.r2\.cloudflarestorage\.com/?$")
B2_DOWNLOAD_RE = re.compile(r"^https://f[0-9]+\.backblazeb2\.com/?$")
B2_API_RE = re.compile(r"^https://api[0-9]*\.backblazeb2\.com/?$")
SECRET_NAMES = (
    "WR_CUSTODY_B2_KEY_ID", "WR_CUSTODY_B2_APPLICATION_KEY",
    "WR_CUSTODY_R2_ACCESS_KEY_ID", "WR_CUSTODY_R2_SECRET_ACCESS_KEY",
)
CONFIG_NAMES = (
    "WR_CUSTODY_B2_BUCKET", "WR_CUSTODY_B2_ENDPOINT",
    "WR_CUSTODY_R2_BUCKET", "WR_CUSTODY_R2_ENDPOINT",
)


def canonical_allowlist(objects: Sequence[RetainedObject] = ALLOWLIST) -> list[dict]:
    return [asdict(value) for value in sorted(objects, key=lambda value: value.season)]


def validate_allowlist(objects: Sequence[RetainedObject] = ALLOWLIST) -> None:
    if canonical_allowlist(objects) != canonical_allowlist(ALLOWLIST):
        raise ContractError("request does not exactly equal the authoritative WR-063 allowlist")
    if len(objects) != 4 or len({item.season for item in objects}) != 4:
        raise ContractError("allowlist must contain exactly four unique seasons")
    if any(item.sha256 in REJECTED_WR061_DIGESTS for item in objects):
        raise ContractError("non-authoritative WR-061 identity rejected")
    if len({item.custody_key for item in objects}) != 4:
        raise ContractError("duplicate provider-object identity")
    for item in objects:
        if not re.fullmatch(r"[0-9a-f]{64}", item.sha256) or item.byte_size <= 0:
            raise ContractError("malformed digest or size")
        if item.custody_key != f"custody/sha256/{item.sha256}/raw":
            raise ContractError("malformed content-addressed identity")


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


def child_of_runner_temp(path: Path, environment: Mapping[str, str] = os.environ) -> Path:
    runner = Path(environment.get("RUNNER_TEMP", "")).resolve()
    resolved = path.resolve()
    if not environment.get("RUNNER_TEMP") or resolved == runner or runner not in resolved.parents:
        raise ContractError("output path must be a child of RUNNER_TEMP")
    return resolved


def request_json(url: str, *, token: str, payload: dict | None = None) -> dict:
    body = None if payload is None else json.dumps(payload, separators=(",", ":")).encode()
    headers = {"Authorization": token, "Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=body, headers=headers,
                                     method="GET" if body is None else "POST")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as exc:
        raise ContractError(f"B2 read-only metadata request failed with HTTP {exc.code}") from exc
    except (urllib.error.URLError, json.JSONDecodeError) as exc:
        raise ContractError("B2 read-only metadata request failed closed") from exc


def authorize_b2(config: Mapping[str, str]) -> dict:
    basic = base64.b64encode(
        f"{config['WR_CUSTODY_B2_KEY_ID']}:{config['WR_CUSTODY_B2_APPLICATION_KEY']}".encode()
    ).decode()
    payload = request_json(B2_AUTHORIZE_URL, token=f"Basic {basic}")
    storage = ((payload.get("apiInfo") or {}).get("storageApi") or {})
    allowed = storage.get("allowed") or {}
    buckets = allowed.get("buckets") or []
    if [value.get("name") for value in buckets if isinstance(value, dict)] != [EXPECTED_B2_BUCKET]:
        raise ContractError("B2 authorization is outside the exact bucket boundary")
    if allowed.get("namePrefix") != "custody/":
        raise ContractError("B2 authorization is outside the custody prefix")
    capabilities = set(allowed.get("capabilities") or [])
    if not {"listFiles", "readFiles"}.issubset(capabilities):
        raise ContractError("B2 authorization lacks required read-only capability")
    api_url = str(storage.get("apiUrl") or "").rstrip("/")
    download_url = str(storage.get("downloadUrl") or "").rstrip("/")
    token = str(payload.get("authorizationToken") or "")
    if not B2_API_RE.fullmatch(api_url) or not B2_DOWNLOAD_RE.fullmatch(download_url) or not token:
        raise ContractError("B2 authorization returned an invalid API boundary")
    bucket = buckets[0]
    bucket_id = str(bucket.get("id") or bucket.get("bucketId") or "")
    if not bucket_id:
        raise ContractError("B2 authorization did not bind the allowed bucket ID")
    return {"api_url": api_url, "download_url": download_url, "token": token,
            "bucket_id": bucket_id}


def list_exact_versions(auth: Mapping[str, str], item: RetainedObject) -> list[dict]:
    payload = request_json(
        f"{auth['api_url']}/b2api/v3/b2_list_file_versions",
        token=auth["token"],
        payload={"bucketId": auth["bucket_id"], "prefix": item.custody_key,
                 "startFileName": item.custody_key, "maxFileCount": 100},
    )
    if payload.get("nextFileName") == item.custody_key:
        raise ContractError(f"B2 exact-key version set exceeds bounded response for {item.season}")
    files = payload.get("files")
    if not isinstance(files, list):
        raise ContractError("B2 version response lacks files")
    exact = [value for value in files if value.get("fileName") == item.custody_key]
    if len(exact) != len(files):
        raise ContractError(f"B2 exact-key boundary returned a non-exact name for {item.season}")
    if not exact:
        raise ContractError(f"B2 retained version absent for {item.season}")
    return exact


def choose_upload_version(versions: Sequence[dict], item: RetainedObject) -> tuple[dict, dict]:
    ordered = sorted(versions, key=lambda value: int(value.get("uploadTimestamp", -1)), reverse=True)
    latest = ordered[0]
    candidates = []
    for value in ordered:
        if value.get("action") != "upload":
            continue
        info = value.get("fileInfo") or {}
        metadata_digest = info.get("wr-sha256") or info.get("sha256")
        size = value.get("contentLength", value.get("size"))
        if int(size or -1) == item.byte_size and metadata_digest in (None, item.sha256):
            candidates.append(value)
    if not candidates:
        raise ContractError(f"B2 has no candidate upload version for {item.season}")
    selected = candidates[0]
    if not selected.get("fileId"):
        raise ContractError("B2 candidate lacks immutable file ID")
    visibility = {
        "latest_action": latest.get("action"),
        "latest_file_id": latest.get("fileId"),
        "latest_upload_timestamp": latest.get("uploadTimestamp"),
        "by_name_expected": "HTTP_404" if latest.get("action") == "hide" else "DOWNLOAD_LATEST_UPLOAD",
        "exact_version_count": len(ordered),
        "matching_upload_count": len(candidates),
    }
    return selected, visibility


def download_b2_version(auth: Mapping[str, str], file_id: str, destination: Path) -> None:
    url = f"{auth['download_url']}/b2api/v4/b2_download_file_by_id?" + urllib.parse.urlencode({"fileId": file_id})
    request = urllib.request.Request(url, headers={"Authorization": auth["token"]}, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=120) as response, destination.open("wb") as output:
            shutil.copyfileobj(response, output, length=1024 * 1024)
    except urllib.error.HTTPError as exc:
        destination.unlink(missing_ok=True)
        raise ContractError(f"B2 immutable-version download failed with HTTP {exc.code}") from exc
    except (urllib.error.URLError, OSError) as exc:
        destination.unlink(missing_ok=True)
        raise ContractError("B2 immutable-version download failed closed") from exc


def aws_environment(config: Mapping[str, str]) -> dict[str, str]:
    return {"PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
            "HOME": os.environ.get("RUNNER_TEMP", "/tmp"),
            "AWS_ACCESS_KEY_ID": config["WR_CUSTODY_R2_ACCESS_KEY_ID"],
            "AWS_SECRET_ACCESS_KEY": config["WR_CUSTODY_R2_SECRET_ACCESS_KEY"],
            "AWS_DEFAULT_REGION": "auto", "AWS_REGION": "auto",
            "AWS_EC2_METADATA_DISABLED": "true", "AWS_PAGER": ""}


def r2_read(config: Mapping[str, str], item: RetainedObject, destination: Path) -> None:
    common = ["--bucket", EXPECTED_R2_BUCKET, "--key", item.custody_key,
              "--endpoint-url", config["WR_CUSTODY_R2_ENDPOINT"].rstrip("/"),
              "--region", "auto", "--output", "json", "--no-cli-pager"]
    env = aws_environment(config)
    for operation, extra in (("head-object", []), ("get-object", [str(destination)])):
        result = subprocess.run(["aws", "s3api", operation, *common, *extra], env=env,
                                stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                                stderr=subprocess.DEVNULL, check=False)
        if result.returncode:
            destination.unlink(missing_ok=True)
            raise ContractError(f"R2 {operation} failed with exit code {result.returncode}")


def verify(path: Path, item: RetainedObject, provider: str) -> dict:
    digest = hashlib.sha256()
    size = 0
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk); size += len(chunk)
    actual = digest.hexdigest()
    if actual != item.sha256 or size != item.byte_size:
        path.unlink(missing_ok=True)
        raise ContractError(f"{provider} identity mismatch for {item.season}")
    return {"status": "PASS", "sha256": actual, "byte_size": size}


def execute(output_dir: Path, report_path: Path) -> dict:
    validate_allowlist()
    config = require_environment()
    output_dir = child_of_runner_temp(output_dir)
    report_path = child_of_runner_temp(report_path)
    if output_dir == report_path or output_dir in report_path.parents:
        raise ContractError("report must be outside raw-byte directory")
    shutil.rmtree(output_dir, ignore_errors=True); report_path.unlink(missing_ok=True)
    output_dir.mkdir(parents=True, mode=0o700); report_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        auth = authorize_b2(config)
        results = []
        for item in ALLOWLIST:
            versions = list_exact_versions(auth, item)
            selected, visibility = choose_upload_version(versions, item)
            b2_path = output_dir / f"{item.season}.b2.raw"
            r2_path = output_dir / f"{item.season}.r2.raw"
            download_b2_version(auth, str(selected["fileId"]), b2_path)
            b2 = verify(b2_path, item, "B2")
            r2_read(config, item, r2_path)
            r2 = verify(r2_path, item, "R2")
            if b2_path.read_bytes() != r2_path.read_bytes():
                raise ContractError(f"B2/R2 byte inequality for {item.season}")
            results.append({"season": item.season, "asset_id": item.asset_id,
                            "custody_key": item.custody_key, "expected_sha256": item.sha256,
                            "expected_byte_size": item.byte_size,
                            "b2_version": {"selected_file_id": selected["fileId"],
                                           "selected_upload_timestamp": selected.get("uploadTimestamp"),
                                           "selected_action": selected.get("action"), **visibility},
                            "b2": b2, "r2": r2, "b2_r2_equal": True})
        if results[0]["b2_version"]["latest_action"] != "hide":
            raise ContractError("2013 prior by-name 404 is not reconciled by current provider version state")
        report = {"schema_version": 1, "task_id": "WR-063", "result": "PASS",
                  "objects": results,
                  "provider_operations": {"B2": ["b2_authorize_account", "b2_list_file_versions", "b2_download_file_by_id"],
                                          "R2": ["HeadObject", "GetObject"]},
                  "provider_mutation_operations": 0, "consumer_credentials_present": False,
                  "raw_storage": "runner-temporary-only", "raw_actions_artifacts": 0,
                  "2013_by_name_404_reconciliation": "latest exact-name B2 version is provider-reported hide action"}
        report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        return report
    except BaseException:
        shutil.rmtree(output_dir, ignore_errors=True); report_path.unlink(missing_ok=True)
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()
    try:
        execute(args.output_dir, args.report)
    except (ContractError, OSError) as exc:
        print(f"WR-063 retained-version read failed closed: {exc}", file=sys.stderr)
        return 2
    print("WR-063 version-aware retained-object verification: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
