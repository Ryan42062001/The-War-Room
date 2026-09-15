#!/usr/bin/env python3
"""WR-069 read-only provider phase with authoritative immutable-version selection."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import shutil
import sys
from pathlib import Path
from typing import Mapping, Sequence

MODULE = Path(__file__).with_name("wr069_retained_safe_consumer.py")
SPEC = importlib.util.spec_from_file_location("wr069_consumer_contract", MODULE)
if not SPEC or not SPEC.loader:
    raise RuntimeError("WR-069 safe-consumer implementation unavailable")
wr = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = wr
SPEC.loader.exec_module(wr)


def candidate_upload_versions(versions: Sequence[Mapping[str, object]], source: Mapping[str, object]) -> list[Mapping[str, object]]:
    """Return bounded exact-key upload candidates that can still match authority.

    Provider metadata SHA, when present, is a rejection gate, never a substitute for
    hashing downloaded bytes. Missing provider SHA does not make a version authoritative.
    """
    expected_size = int(source["expected_size_bytes"])
    expected_sha = str(source["expected_sha256"])
    ordered = sorted(versions, key=lambda value: int(value.get("uploadTimestamp", -1)), reverse=True)
    candidates: list[Mapping[str, object]] = []
    for value in ordered:
        if value.get("action") != "upload" or not value.get("fileId"):
            continue
        size = value.get("contentLength", value.get("size"))
        if int(size or -1) != expected_size:
            continue
        info = value.get("fileInfo") or {}
        metadata_digest = info.get("wr-sha256") or info.get("sha256")
        if metadata_digest not in (None, expected_sha):
            continue
        candidates.append(value)
    return candidates


def retrieve_authoritative_b2(read, auth: Mapping[str, str], source: Mapping[str, object], destination: Path,
                              versions: Sequence[Mapping[str, object]]) -> dict:
    """Retrieve the first immutable exact-key upload whose actual bytes match authority."""
    candidates = candidate_upload_versions(versions, source)
    if not candidates:
        raise wr.ContractError(f"B2 has no size/metadata-compatible immutable upload for {source['source_id']}")
    attempted = 0
    for candidate in candidates:
        attempted += 1
        destination.unlink(missing_ok=True)
        read.download_b2_version(auth, str(candidate["fileId"]), destination)
        digest, size = wr.sha256_file(destination)
        if (digest, size) == (source["expected_sha256"], source["expected_size_bytes"]):
            return {
                "selected": candidate,
                "candidate_count": len(candidates),
                "attempted_candidate_count": attempted,
            }
        destination.unlink(missing_ok=True)
    raise wr.ContractError(f"B2 authoritative retained upload absent for {source['source_id']}")


def provider_phase(repo_root: Path, output_dir: Path, manifest_path: Path, manifest_sidecar: Path, report_path: Path) -> None:
    output_dir = wr.require_child_of_runner_temp(output_dir)
    manifest_path = wr.require_child_of_runner_temp(manifest_path)
    manifest_sidecar = wr.require_child_of_runner_temp(manifest_sidecar)
    report_path = wr.require_child_of_runner_temp(report_path)
    sources = wr.load_historical_manifest(repo_root)
    read = wr.load_read_module(repo_root)
    config = read.require_environment()
    auth = read.authorize_b2(config)
    output_dir.mkdir(parents=True, exist_ok=False)
    manifest_sources: list[dict] = []
    report_objects: list[dict] = []
    try:
        for source in sources:
            local = output_dir / f"{source['expected_sha256']}.raw"
            r2_tmp = output_dir / f"{source['expected_sha256']}.r2.raw"
            item = read.RetainedObject(
                source["season"], source["asset_id"], source["expected_sha256"],
                source["expected_size_bytes"], source["custody_key"],
            )
            versions = read.list_exact_versions(auth, item)
            selection = retrieve_authoritative_b2(read, auth, source, local, versions)
            selected = selection["selected"]
            read.r2_read(config, item, r2_tmp)
            if wr.sha256_file(r2_tmp) != (source["expected_sha256"], source["expected_size_bytes"]):
                r2_tmp.unlink(missing_ok=True)
                local.unlink(missing_ok=True)
                raise wr.ContractError(f"R2 authoritative identity mismatch for {source['source_id']}")
            equal = local.read_bytes() == r2_tmp.read_bytes()
            r2_tmp.unlink(missing_ok=True)
            if not equal:
                local.unlink(missing_ok=True)
                raise wr.ContractError(f"B2/R2 byte inequality for {source['source_id']}")
            ordered = sorted(versions, key=lambda value: int(value.get("uploadTimestamp", -1)), reverse=True)
            manifest_sources.append({**source, "local_path": str(local)})
            report_objects.append({
                "source_id": source["source_id"],
                "sha256": source["expected_sha256"],
                "byte_size": source["expected_size_bytes"],
                "b2_digest_size": "PASS",
                "r2_digest_size": "PASS",
                "b2_r2_equal": True,
                "b2_exact_version_count": len(versions),
                "b2_compatible_upload_count": selection["candidate_count"],
                "b2_attempted_upload_count": selection["attempted_candidate_count"],
                "b2_selected_action": "upload",
                "b2_selected_file_id_sha256": hashlib.sha256(str(selected["fileId"]).encode()).hexdigest(),
                "b2_latest_action": ordered[0].get("action") if ordered else None,
            })
        local_manifest = {
            "schema_version": "wr069-verified-local-input-manifest-v1",
            "task_id": "WR-069",
            "authority": {
                "wr042_manifest_commit": wr.WR042_MANIFEST_COMMIT,
                "wr042_manifest_sha256": wr.WR042_MANIFEST_SHA256,
            },
            "input_count": 15,
            "sources": manifest_sources,
        }
        digest = wr.write_canonical_json(manifest_path, local_manifest)
        wr.write_sidecar(manifest_sidecar, digest, manifest_path.name)
        wr.write_canonical_json(report_path, {
            "task_id": "WR-069",
            "result": "PASS",
            "expected_input_count": 15,
            "verified_input_count": 15,
            "b2_boundary": auth["boundary"],
            "objects": report_objects,
            "provider_mutation_operations": 0,
            "upstream_source_access": False,
            "draft_picks_csv": False,
            "provider_access_complete": True,
            "local_manifest_sha256": digest,
            "raw_actions_artifacts": 0,
        })
    except Exception:
        shutil.rmtree(output_dir, ignore_errors=True)
        manifest_path.unlink(missing_ok=True)
        manifest_sidecar.unlink(missing_ok=True)
        report_path.unlink(missing_ok=True)
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path("."))
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--manifest-sidecar", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    try:
        provider_phase(args.repo_root.resolve(), args.output_dir, args.manifest, args.manifest_sidecar, args.report)
        return 0
    except (wr.ContractError, OSError, ValueError) as exc:
        print(f"WR-069 PROVIDER FAIL CLOSED: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
