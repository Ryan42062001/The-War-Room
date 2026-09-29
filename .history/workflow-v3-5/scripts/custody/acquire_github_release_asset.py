#!/usr/bin/env python3
"""Acquire one public GitHub release asset by immutable asset ID and verify exact bytes.

WR-046 transport helper. This script performs acquisition and local SHA-256/size
verification only. It does not admit research sources or provide durable custody.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository", required=True, help="owner/repo")
    parser.add_argument("--asset-id", required=True, type=int)
    parser.add_argument("--expected-sha256", required=True)
    parser.add_argument("--expected-size", required=True, type=int)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    expected_sha256 = args.expected_sha256.lower()
    if not SHA256_RE.fullmatch(expected_sha256):
        raise SystemExit("expected SHA-256 must be exactly 64 lowercase/uppercase hex characters")
    if args.expected_size < 0:
        raise SystemExit("expected size must be non-negative")
    if args.asset_id <= 0:
        raise SystemExit("asset ID must be positive")
    if args.repository.count("/") != 1:
        raise SystemExit("repository must be owner/repo")

    url = f"https://api.github.com/repos/{args.repository}/releases/assets/{args.asset_id}"
    headers = {
        "Accept": "application/octet-stream",
        "User-Agent": "the-war-room-wr046-custody-acquirer/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = urllib.request.Request(url, headers=headers)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256()
    byte_size = 0

    try:
        with urllib.request.urlopen(request, timeout=90) as response, args.output.open("wb") as target:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                target.write(chunk)
                digest.update(chunk)
                byte_size += len(chunk)
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"GitHub release-asset download failed: HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"GitHub release-asset download failed: {exc.reason}") from exc

    actual_sha256 = digest.hexdigest()
    errors: list[str] = []
    if actual_sha256 != expected_sha256:
        errors.append(f"sha256 mismatch expected={expected_sha256} actual={actual_sha256}")
    if byte_size != args.expected_size:
        errors.append(f"byte-size mismatch expected={args.expected_size} actual={byte_size}")

    summary = {
        "asset_id": args.asset_id,
        "byte_size": byte_size,
        "repository": args.repository,
        "sha256": actual_sha256,
        "verified": not errors,
    }
    print(json.dumps(summary, sort_keys=True))

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        try:
            args.output.unlink()
        except FileNotFoundError:
            pass
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
