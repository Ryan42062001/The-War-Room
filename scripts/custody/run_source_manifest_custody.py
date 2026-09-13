#!/usr/bin/env python3
"""Validate an immutable source manifest and execute the accepted B2/R2 custody path.

The manifest is inert data.  This program must itself come from the trusted
workflow SHA.  It performs no parsing, admission, or model work.
"""

from __future__ import annotations

import argparse
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
from typing import Any, Callable

SCHEMA_VERSION = "wr-custody-source-manifest-v1"
MANIFEST_FIELDS = {"schema_version", "task_id", "manifest_id", "sources"}
SOURCE_FIELDS = {
    "source_id", "source_class", "rights_state", "provider", "repository",
    "asset_id", "filename", "season", "expected_sha256",
    "expected_size_bytes", "content_type",
}
RIGHTS_BY_CLASS = {
    "LAWFUL_NON_SENSITIVE_FIXTURE": {"RAW_CUSTODY_ALLOWED"},
    "NFLVERSE_PLAYER_SUMMARY_STATS": {"RAW_CUSTODY_ALLOWED_WITH_ATTRIBUTION"},
    "NFLVERSE_PLAYERS_METADATA_MINIMAL": {
        "RAW_CUSTODY_ALLOWED_WITH_ATTRIBUTION_AND_MINIMIZATION"
    },
}
REPOSITORIES_BY_CLASS = {
    "LAWFUL_NON_SENSITIVE_FIXTURE": {"jqlang/jq"},
    "NFLVERSE_PLAYER_SUMMARY_STATS": {"nflverse/nflverse-data"},
    "NFLVERSE_PLAYERS_METADATA_MINIMAL": {"nflverse/nflverse-data"},
}
SAFE_ID_RE = re.compile(r"^[A-Za-z0-9._:-]{1,200}$")
SAFE_FILENAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
COMMIT_RE = re.compile(r"^[0-9a-f]{40}$")
SECRET_ENV_NAMES = (
    "GITHUB_TOKEN",
    "WR_CUSTODY_B2_KEY_ID", "WR_CUSTODY_B2_APPLICATION_KEY",
    "WR_CUSTODY_R2_ACCESS_KEY_ID", "WR_CUSTODY_R2_SECRET_ACCESS_KEY",
    "WR_CUSTODY_R2_CONFIG_READ_TOKEN",
)


class ContractError(RuntimeError):
    pass


def sha256_and_size(path: Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    size = 0
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
            size += len(chunk)
    return digest.hexdigest(), size


def sanitize(text: str) -> str:
    clean = text
    for name in SECRET_ENV_NAMES:
        value = os.environ.get(name)
        if value:
            clean = clean.replace(value, "***")
    return clean


def exact_fields(value: dict[str, Any], expected: set[str], label: str) -> None:
    missing = sorted(expected - value.keys())
    unknown = sorted(value.keys() - expected)
    if missing or unknown:
        raise ContractError(f"{label} fields invalid: missing={missing} unknown={unknown}")


def validate_source(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ContractError("source entry must be an object")
    exact_fields(raw, SOURCE_FIELDS, "source")
    source = dict(raw)
    if not isinstance(source["source_id"], str) or not SAFE_ID_RE.fullmatch(source["source_id"]):
        raise ContractError("source_id is malformed")
    if not isinstance(source["filename"], str) or not SAFE_FILENAME_RE.fullmatch(source["filename"]):
        raise ContractError("filename is malformed")
    if source["provider"] != "github_release_asset":
        raise ContractError("unsupported provider")
    source_class = source["source_class"]
    if source_class not in RIGHTS_BY_CLASS:
        raise ContractError("unsupported source class")
    if source["repository"] not in REPOSITORIES_BY_CLASS[source_class]:
        raise ContractError("unsupported source/repository combination")
    if source["rights_state"] not in RIGHTS_BY_CLASS[source_class]:
        raise ContractError("source rights state is not custody-eligible")
    if type(source["asset_id"]) is not int or source["asset_id"] <= 0:
        raise ContractError("asset_id must be a positive integer")
    if type(source["expected_size_bytes"]) is not int or source["expected_size_bytes"] <= 0:
        raise ContractError("expected_size_bytes must be a positive integer")
    if not isinstance(source["expected_sha256"], str):
        raise ContractError("expected_sha256 must be a string")
    source["expected_sha256"] = source["expected_sha256"].lower()
    if not SHA256_RE.fullmatch(source["expected_sha256"]):
        raise ContractError("expected_sha256 is malformed")
    season = source["season"]
    if season is not None and (type(season) is not int or season < 1900 or season > 2025):
        raise ContractError("season must be null or no later than 2025")
    if re.search(r"(?<!\d)2026(?!\d)", source["filename"]):
        raise ContractError("post-2025 filename is prohibited")
    if source_class == "NFLVERSE_PLAYER_SUMMARY_STATS":
        if type(season) is not int or not 2012 <= season <= 2025:
            raise ContractError("player-summary season must be 2012 through 2025")
        if source["filename"] != f"stats_player_regpost_{season}.csv":
            raise ContractError("player-summary filename does not match season")
    elif source_class == "NFLVERSE_PLAYERS_METADATA_MINIMAL":
        if season is not None or source["filename"] != "players.csv":
            raise ContractError("players metadata identity is malformed")
    elif season is not None:
        raise ContractError("fixture season must be null")
    if not isinstance(source["content_type"], str) or not re.fullmatch(
        r"[a-z0-9][a-z0-9.+-]*/[a-z0-9][a-z0-9.+-]*", source["content_type"]
    ):
        raise ContractError("content_type is malformed")
    return source


def validate_manifest(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ContractError("manifest must be an object")
    exact_fields(raw, MANIFEST_FIELDS, "manifest")
    if raw["schema_version"] != SCHEMA_VERSION:
        raise ContractError("unsupported manifest schema_version")
    if raw["task_id"] not in {"WR-042", "WR-056"}:
        raise ContractError("task_id is not approved for this bridge")
    if not isinstance(raw["manifest_id"], str) or not SAFE_ID_RE.fullmatch(raw["manifest_id"]):
        raise ContractError("manifest_id is malformed")
    if not isinstance(raw["sources"], list) or not raw["sources"] or len(raw["sources"]) > 64:
        raise ContractError("sources must be a non-empty array")
    sources = [validate_source(value) for value in raw["sources"]]
    source_ids = [source["source_id"] for source in sources]
    provider_ids = [(source["repository"], source["asset_id"]) for source in sources]
    if len(source_ids) != len(set(source_ids)):
        raise ContractError("duplicate source identity")
    if len(provider_ids) != len(set(provider_ids)):
        raise ContractError("duplicate provider-object identity")
    return {
        "schema_version": SCHEMA_VERSION,
        "task_id": raw["task_id"],
        "manifest_id": raw["manifest_id"],
        "sources": sorted(sources, key=lambda source: source["source_id"]),
    }


def fetch_manifest(repository: str, commit: str, path: str, output: Path) -> None:
    if repository != "Ryan42062001/The-War-Room":
        raise ContractError("manifest repository is not approved")
    if not COMMIT_RE.fullmatch(commit):
        raise ContractError("manifest commit must be an exact 40-character SHA")
    if not (
        path.startswith(".ai/research/generated/")
        or path.startswith(".ai/work_helper/")
    ) or ".." in path or not path.endswith(".json"):
        raise ContractError("manifest path is not approved")
    quoted_path = urllib.parse.quote(path, safe="/")
    url = f"https://api.github.com/repos/{repository}/contents/{quoted_path}?ref={commit}"
    headers = {
        "Accept": "application/vnd.github.raw+json",
        "User-Agent": "the-war-room-source-custody/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=90) as response:
            output.write_bytes(response.read())
    except urllib.error.HTTPError as exc:
        raise ContractError(f"manifest acquisition failed: HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise ContractError(f"manifest acquisition failed: {exc.reason}") from exc


def run_checked(command: list[str]) -> None:
    result = subprocess.run(command, text=True, capture_output=True, check=False)
    if result.returncode != 0:
        detail = sanitize((result.stderr or result.stdout or "").strip())
        raise RuntimeError(f"custody subprocess failed ({result.returncode}): {detail[:1000]}")


def _execute_manifest(
    manifest: dict[str, Any],
    workdir: Path,
    report_path: Path,
    command_runner: Callable[[list[str]], None] = run_checked,
) -> dict[str, Any]:
    script_dir = Path(__file__).resolve().parent
    results: list[dict[str, Any]] = []
    for source in manifest["sources"]:
        local_path = workdir / source["filename"]
        provider_report = workdir / f"{source['source_id']}.custody.json"
        command_runner([
            sys.executable, str(script_dir / "acquire_github_release_asset.py"),
            "--repository", source["repository"],
            "--asset-id", str(source["asset_id"]),
            "--expected-sha256", source["expected_sha256"],
            "--expected-size", str(source["expected_size_bytes"]),
            "--output", str(local_path),
        ])
        digest, size = sha256_and_size(local_path)
        if digest != source["expected_sha256"]:
            raise ContractError("downloaded digest mismatch before downstream handling")
        if size != source["expected_size_bytes"]:
            raise ContractError("downloaded size mismatch before downstream handling")
        common = [
            "--fixture", str(local_path),
            "--expected-sha256", source["expected_sha256"],
            "--expected-size", str(source["expected_size_bytes"]),
            "--content-type", source["content_type"],
        ]
        command_runner([
            sys.executable, str(script_dir / "ensure_b2_custody_object.py"), *common,
        ])
        command_runner([
            sys.executable, str(script_dir / "prove_b2_r2_custody.py"), *common,
            "--task-id", manifest["task_id"],
            "--source-id", source["source_id"],
            "--report", str(provider_report),
        ])
        proof = json.loads(provider_report.read_text(encoding="utf-8"))
        expected_key = f"custody/sha256/{digest}/raw"
        if proof.get("content_addressed_object_key") != expected_key:
            raise ContractError("provider proof returned wrong content-addressed identity")
        if not proof.get("all_three_sha256_equal") or not proof.get("all_three_byte_sizes_equal"):
            raise ContractError("provider proof did not establish three-copy equality")
        results.append({
            "source_id": source["source_id"],
            "source_class": source["source_class"],
            "repository": source["repository"],
            "asset_id": source["asset_id"],
            "sha256": digest,
            "byte_size": size,
            "content_addressed_object_key": expected_key,
            "b2_retention_mode": proof["primary"]["retention_mode"],
            "b2_legal_hold": proof["primary"]["legal_hold"],
            "r2_lock_condition": proof["independent_backup"]["lock_rule_condition"],
            "three_copy_sha256_equal": True,
            "three_copy_byte_sizes_equal": True,
        })
        local_path.unlink(missing_ok=True)
        provider_report.unlink(missing_ok=True)
    report = {
        "schema_version": 1,
        "task_id": manifest["task_id"],
        "manifest_id": manifest["manifest_id"],
        "result": "PASS",
        "source_count": len(results),
        "sources": results,
        "privacy": {"secrets_logged": False, "source_bytes_persisted_on_runner": False},
        "research_source_admission": False,
        "model_or_ranking_work": False,
    }
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return report


def execute_manifest(
    manifest: dict[str, Any],
    workdir: Path,
    report_path: Path,
    command_runner: Callable[[list[str]], None] = run_checked,
) -> dict[str, Any]:
    """Execute with fail-closed cleanup even when acquisition or a provider fails."""
    try:
        return _execute_manifest(manifest, workdir, report_path, command_runner)
    finally:
        for path in workdir.iterdir():
            if path != report_path and path.is_file():
                path.unlink(missing_ok=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--manifest", type=Path)
    source.add_argument("--manifest-commit")
    parser.add_argument("--manifest-repository", default="Ryan42062001/The-War-Room")
    parser.add_argument("--manifest-path")
    parser.add_argument("--manifest-sha256", required=True)
    parser.add_argument("--report", required=True, type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    expected_manifest_sha = args.manifest_sha256.lower()
    if not SHA256_RE.fullmatch(expected_manifest_sha):
        raise ContractError("manifest SHA-256 is malformed")
    with tempfile.TemporaryDirectory(prefix="wr056-custody-") as temp_name:
        tempdir = Path(temp_name)
        manifest_path = args.manifest
        if args.manifest_commit:
            if not args.manifest_path:
                raise ContractError("--manifest-path is required with --manifest-commit")
            manifest_path = tempdir / "manifest.json"
            fetch_manifest(
                args.manifest_repository, args.manifest_commit,
                args.manifest_path, manifest_path,
            )
        assert manifest_path is not None
        actual_sha, _ = sha256_and_size(manifest_path)
        if actual_sha != expected_manifest_sha:
            raise ContractError("manifest SHA-256 mismatch")
        try:
            raw = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ContractError("manifest is not valid UTF-8 JSON") from exc
        manifest = validate_manifest(raw)
        report = execute_manifest(manifest, tempdir, args.report)
    print(json.dumps({
        "result": report["result"], "manifest_id": report["manifest_id"],
        "source_count": report["source_count"], "secrets_logged": False,
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"source custody failed closed: {sanitize(str(exc))}", file=sys.stderr)
        raise SystemExit(2)
