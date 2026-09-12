#!/usr/bin/env python3
"""Emit privacy-safe provider-issued credential-scope evidence for WR-046.

The Backblaze credential can describe its own complete authorization envelope.
Cloudflare credentials cannot read their own policy bodies, so this script binds
the configured credentials to provider-issued identifiers/status. Their policy
screens are preserved separately as privacy-safe provider-console evidence.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any

B2_AUTHORIZE_URL = "https://api.backblazeb2.com/b2api/v4/b2_authorize_account"
CF_VERIFY_URL = "https://api.cloudflare.com/client/v4/user/tokens/verify"

REQUIRED_B2_CAPABILITIES = {
    "listAllBucketNames",
    "readFiles",
    "writeFiles",
    "readFileRetentions",
    "writeFileRetentions",
    "readFileLegalHolds",
    "writeFileLegalHolds",
}
FORBIDDEN_B2_CAPABILITIES = {
    "deleteFiles",
    "bypassGovernance",
    "listBuckets",
    "writeBuckets",
    "deleteBuckets",
    "writeBucketRetentions",
    "writeBucketEncryption",
    "writeKeys",
    "deleteKeys",
}


def required(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"missing required environment name: {name}")
    return value


def request_json(request: urllib.request.Request, label: str) -> dict[str, Any]:
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body = response.read()
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"{label} failed with HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"{label} failed: {exc.reason}") from exc
    try:
        payload = json.loads(body)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"{label} returned non-JSON") from exc
    if not isinstance(payload, dict):
        raise RuntimeError(f"{label} returned an invalid JSON shape")
    return payload


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def attest_b2() -> dict[str, Any]:
    key_id = required("WR_CUSTODY_B2_KEY_ID")
    application_key = required("WR_CUSTODY_B2_APPLICATION_KEY")
    expected_bucket = required("WR_CUSTODY_B2_BUCKET")
    authorization = base64.b64encode(f"{key_id}:{application_key}".encode()).decode()
    payload = request_json(
        urllib.request.Request(
            B2_AUTHORIZE_URL,
            headers={"Authorization": f"Basic {authorization}", "Accept": "application/json"},
            method="GET",
        ),
        "Backblaze authorization",
    )
    storage = ((payload.get("apiInfo") or {}).get("storageApi") or {})
    allowed = storage.get("allowed") or {}
    capabilities = set(allowed.get("capabilities") or [])
    # v4 moved bucket identity into allowed.buckets so multi-bucket keys can be
    # represented. Authentication success itself binds this response to the
    # configured application-key ID; v4 does not echo that ID in the response.
    buckets = allowed.get("buckets") or []
    if not isinstance(buckets, list):
        raise RuntimeError("Backblaze authorization returned invalid allowed.buckets")
    bucket_names = [item.get("name") for item in buckets if isinstance(item, dict)]
    prefix = allowed.get("namePrefix")

    checks = {
        "configured_key_authenticated": True,
        "one_bucket_only": len(buckets) == 1,
        "bucket_exact": bucket_names == [expected_bucket],
        "name_prefix_exact": prefix == "custody/",
        "required_capabilities_present": REQUIRED_B2_CAPABILITIES <= capabilities,
        "capabilities_exact": capabilities == REQUIRED_B2_CAPABILITIES,
        "forbidden_capabilities_absent": not bool(capabilities & FORBIDDEN_B2_CAPABILITIES),
    }
    if not all(checks.values()):
        raise RuntimeError("Backblaze credential authorization is broader, narrower, or different from the approved contract")
    return {
        "provider": "Backblaze B2",
        "authorization_endpoint": B2_AUTHORIZE_URL,
        "application_key_id_sha256": sha256_text(key_id),
        "buckets": [
            {"id": item.get("id"), "name": item.get("name")}
            for item in buckets
            if isinstance(item, dict)
        ],
        "name_prefix": prefix,
        "capabilities": sorted(capabilities),
        "checks": checks,
    }


def attest_cloudflare_config_token() -> dict[str, Any]:
    token = required("WR_CUSTODY_R2_CONFIG_READ_TOKEN")
    payload = request_json(
        urllib.request.Request(
            CF_VERIFY_URL,
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            method="GET",
        ),
        "Cloudflare token verification",
    )
    if payload.get("success") is not True:
        raise RuntimeError("Cloudflare token verification reported success=false")
    result = payload.get("result") or {}
    if result.get("status") != "active" or not result.get("id"):
        raise RuntimeError("Cloudflare configuration token is not active or has no provider ID")
    return {
        "provider": "Cloudflare",
        "verification_endpoint": CF_VERIFY_URL,
        "token_id": result["id"],
        "status": result["status"],
        "expires_on": result.get("expires_on"),
        "not_before": result.get("not_before"),
        "policy_evidence": "provider-console-attestation",
    }


def attest_r2_object_credential() -> dict[str, Any]:
    access_key_id = required("WR_CUSTODY_R2_ACCESS_KEY_ID")
    return {
        "provider": "Cloudflare R2",
        "access_key_id_sha256": sha256_text(access_key_id),
        "policy_evidence": "provider-console-attestation",
    }


def main() -> int:
    report = {
        "schema_version": 1,
        "task_id": "WR-046",
        "b2": attest_b2(),
        "r2_object_credential": attest_r2_object_credential(),
        "r2_config_token": attest_cloudflare_config_token(),
        "secret_values_present": False,
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"WR-046 credential-scope attestation failed: {exc}", file=sys.stderr)
        raise SystemExit(2)
