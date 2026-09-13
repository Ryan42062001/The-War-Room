# WR-056 — Runtime Path Implementation Evidence

Task: `WR-056 — WR-042 Runtime Path Remediation`  
Implementation base: `791a5c817e8f11aaee24b66ac8b52f7681a8d136`  
Branch: `wr-056-runtime-path-remediation-impl`  
Accepted diagnosis: PR #156 / `f1d4ece46dd89f4f1395d24b57af1b042757ecbd`

## Disposition

**IMPLEMENTATION CI GREEN — CONTROLLED LIVE VALIDATION BLOCKED BY WORKFLOW-DISPATCH BOOTSTRAP**

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

## Exact-head CI discovery

Candidate head `dd37c7a716fd5195d78f5340a3770832d8907d41` produced:

- WR-046 Custody Fixture Proof run `34736597963`: **PASS**;
- War Room CI run `34736597965` governance job `103669034154`: **PASS**, including the new custody regressions;
- War Room CI test job `103669054609`: **FAIL** at `npm run test:release`.

The release validator failed before unrelated application tests because `scripts/validate-release-candidate.mjs` contains an exact two-workflow allowlist. It expected only `ci.yml` and `wr046-custody-fixture.yml`, and correctly detected the newly authorized `wr042-source-custody.yml` as an unapproved third workflow from its current perspective.

That validator is outside the active WR-056 write authority. Retrying cannot change this deterministic result.

## Additional minimum expansion required

Authorize exactly:

- `scripts/validate-release-candidate.mjs`

Purpose: add `.github/workflows/wr042-source-custody.yml` to the permanent workflow allowlist. No other validator behavior should change.

Required regression: `npm run test:release` must pass with exactly the three approved workflow paths and must still fail for any fourth/unapproved workflow. Full exact-head CI must then pass before the one controlled live jq dispatch.

## Authorized validator remediation and exact-head evidence

Manager authorization PR #159 was reconciled through merge commit
`38e332be05e93413a9adc8a9f3a0dec52b058a6c`. The only newly authorized
implementation edit added `.github/workflows/wr042-source-custody.yml` to the
strict permanent-workflow allowlist in `scripts/validate-release-candidate.mjs`.
The existing exact `assert.deepEqual` comparison remains intact.

Focused release regression:

- `npm run test:release` with exactly the three approved workflows: **PASS**;
- the same regression with staged `.github/workflows/unapproved-fourth.yml`:
  **EXPECTED FAIL**, naming the unapproved path in the strict equality error.

Candidate implementation head: `8cf417f543e8e2e6f30793b68a53037cbbc09265`.

- War Room CI run `34737295736`: **PASS**;
- classify job `103670840316`: **PASS**;
- governance job `103671710464`: **PASS**, including `Test trusted source-custody bridge`;
- full test job `103671727942`: **PASS**, including browser stress and `npm test`;
- WR-046 Custody Fixture Proof run `34737295735`, preflight job
  `103670840315`: **PASS**; live jobs correctly skipped for a pull-request event.

## Controlled-live bootstrap finding

The one authorized live jq validation has **not** been dispatched. GitHub only
registers and exposes a `workflow_dispatch` workflow when its workflow file is
present on the repository default branch. The trusted workflow exists at the
candidate PR head but `.github/workflows/wr042-source-custody.yml` is absent from
canonical `main` `a9d126abaa4f30d381aa1f5aa4478ac884bfed5f` (provider API returns 404).
Consequently there is no valid Actions `Run workflow` entry point yet.

Adding a push or pull-request live trigger would weaken the approved manual,
explicit-confirmation design. Merging PR #158 merely to bootstrap its own
pre-merge validation would bypass the required independent audit. Neither action
was taken. No provider call and no live-validation attempt was consumed.

Manager disposition is required to establish the workflow on the default branch
through an independently reviewed bootstrap/control-plane change, or to approve
another narrowly bounded invocation mechanism. Once the workflow is registered,
the single live run must use the frozen jq manifest and candidate implementation
identity recorded above. WR-042 and WR-043 remain blocked.
