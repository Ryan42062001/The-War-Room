# WR-056 — Runtime Path Implementation Evidence

Task: `WR-056 — WR-042 Runtime Path Remediation`  
Implementation base: `791a5c817e8f11aaee24b66ac8b52f7681a8d136`  
Branch: `wr-056-runtime-path-remediation-impl`  
Accepted diagnosis: PR #156 / `f1d4ece46dd89f4f1395d24b57af1b042757ecbd`

## Disposition

**IMPLEMENTED — CONTROLLED LIVE VALIDATION REQUIRED**

The approved runtime bridge is implemented without changing WR039 / WR-D008 evidence semantics or the accepted WR-046 / WR-053 provider controls. No Returning-Player source is included in this task.

## Architecture

`.github/workflows/wr042-source-custody.yml` is a manually dispatched protected job. It:

1. requires an exact manifest commit SHA, approved repository path, manifest SHA-256, and explicit safety confirmation;
2. checks out the immutable workflow implementation SHA;
3. fetches the manifest as inert data through the GitHub Contents API;
4. verifies manifest bytes before parsing;
5. validates an exact allowlisted schema and deterministic row order;
6. acquires each object by immutable GitHub release asset ID;
7. independently rechecks downloaded digest and size before provider handling;
8. invokes the existing B2/R2 proof with parameterized object identity;
9. emits only privacy-safe credential anchors and custody evidence;
10. deletes local source and evidence files in an always-run cleanup step and publishes no artifact.

The bridge never claims research admission. A later R&D task owns admission after independent review of custody evidence.

## Fail-closed policy

The runner rejects:

- missing or unknown manifest/source fields;
- non-exact commit, manifest digest, or approved manifest path;
- duplicate source IDs or duplicate repository/asset identities;
- unsupported providers, repositories, source classes, or rights states;
- malformed identifiers, filenames, content types, digests, sizes, or asset IDs;
- summary seasons outside 2012–2025 or filename/season disagreement;
- any explicit 2026 filename;
- rights-pending draft-capital input;
- downloaded-byte digest or size mismatch before provider calls;
- incomplete provider proof or incorrect content-addressed key;
- any partial provider failure.

Current eligible source classes remain exactly:

- lawful non-sensitive jq validation fixture;
- nflverse player summary statistics under the accepted attribution state;
- minimized nflverse player metadata under the accepted attribution/minimization state.

The rights-pending draft-capital class is intentionally absent.

## Existing behavior preservation

The provider proof and B2 seed helpers retain the WR-046 jq hash, size, task ID, content type, key, and fixture report metadata as defaults. New flags only parameterize a preverified identity supplied by the trusted runner. B2 COMPLIANCE retention, Legal Hold, R2 Indefinite Bucket Lock, direct retrieval, and three-copy equality requirements are unchanged.

The existing WR-046 workflow was not modified.

## Deterministic offline evidence

Commands:

```text
python3 -m py_compile scripts/custody/*.py
python3 scripts/custody/test_source_manifest_custody.py
python3 scripts/custody/prove_b2_r2_custody.py --self-test
```

Local result: PASS on three consecutive source-manifest regression executions and PASS for the existing proof self-test.

Covered cases:

- valid single-row and multi-row manifests;
- canonical ordering and byte-identical output;
- duplicate source and provider-object rejection;
- missing/unknown top-level and source fields;
- malformed digest, size, asset ID, filename, provider, source class, and repository;
- post-2025 and ineligible-rights rejection;
- digest and size mismatch before provider handling;
- partial provider failure;
- deterministic SHA-256 content-addressed identity;
- cleanup after success and failure;
- credential-value redaction and privacy-safe reporting;
- preserved WR-046 default fixture report identity.

Both changed workflows also parse successfully as YAML.

## Controlled live fixture

Manifest: `.ai/work_helper/WR056_LIVE_FIXTURE_MANIFEST.json`  
Manifest SHA-256: `8e69050cefb9df413b589133aaadcd1a8f952e1fc0cf94502020dee8b69f8547`  
Source: lawful public `jqlang/jq` release asset `453012755`  
Expected object SHA-256: `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`  
Expected bytes: `14380`

The live run must be dispatched exactly once from the frozen implementation head. It must demonstrate current credential binding, B2 COMPLIANCE + Legal Hold, R2 Indefinite Bucket Lock, direct retrieval, three-way equality, and cleanup. No Returning-Player source is authorized for WR-056.

## Security and boundaries

Reusable credentials are read only from protected Actions secrets. No secret value was accessed locally or stored in repository content. Reports contain allowlisted identities and provider-control results, not source bytes or credentials.

Returning-Player source admitted: **NO**  
Returning-Player source downloaded or parsed: **NO**  
2026 outcomes inspected: **NO**  
Model/scoring/ranking/production work: **NO**  
Phase-6 work: **NO**  
Research/Auditor/shared/Manager files modified: **NO**

## Remaining gate

Exact-head CI must pass, followed by the single controlled live fixture dispatch. Manager should bind a fresh independent audit lane only after those results are frozen. WR-042 and WR-043 remain blocked.

