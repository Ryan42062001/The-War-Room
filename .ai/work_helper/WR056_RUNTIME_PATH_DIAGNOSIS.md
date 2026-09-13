# WR-056 — WR-042 Runtime Path Diagnosis

Task: `WR-056 — WR-042 Runtime Path Remediation`  
Assignment mode: workflow / protected-runtime troubleshooting  
Canonical base and assigned branch start: `5b3545a84365c336fb58fc706a1c89897efd4d77`  
Branch: `wr-056-runtime-path-remediation`  
Historical WR-042 retry: PR #153, closed unmerged at `98e32ed106350906a3bad3352099549d1c7f140f`

## Disposition

`REMEDIATION SURFACE EXPANSION REQUIRED`

The blocker cannot be solved inside `.ai/work_helper/**`. The accepted B2/R2 capability remains valid, but the repository has no trusted, parameterized automation path that can consume a future WR-042 exact-source manifest and execute exact-byte acquisition plus custody with protected credentials.

This report requests the minimum workflow/script expansion. It does not admit a source, execute source custody, or change WR039 / WR-D008.

## Authoritative-path discrepancies resolved

Three requested startup paths do not exist on canonical main:

- `.ai/shared/WORK_HELPER_OVERLAY.md`;
- `.ai/roles/work-helper.md`;
- `.ai/work_helper/PLAYBOOK.md`.

The authoritative role charter is `.ai/roles/WORK_HELPER.md`. Canonical `.ai/shared/WORKFLOW.md`, the role charter, WR-056, and the existing Work Helper handoff provide the governing procedure. The WR-042 retry reports are not on main because PR #153 was correctly closed unmerged; they were read from immutable head `98e32ed...`.

## Exact root cause

The failure has four necessary parts.

1. **The only credential-bearing custody workflow is WR-046-specific.**  
   `.github/workflows/wr046-custody-fixture.yml` accepts no source manifest, triggers live work only for `wr-046-custody-capability-recovery` or unparameterized manual dispatch, and hardcodes the public jq fixture.

2. **The accepted proof implementation is fixture-specific rather than source-parameterized.**  
   `scripts/custody/prove_b2_r2_custody.py` hardcodes the jq SHA-256, byte size, asset ID/name, `WR-046` task ID, and report semantics.  
   `scripts/custody/ensure_b2_custody_object.py` is explicitly the WR-046 fixture seed helper.  
   `acquire_github_release_asset.py` is already generic enough for immutable asset-ID acquisition and exact downloaded-byte hash/size verification, but there is no trusted orchestrator connecting manifest rows to the two-provider proof.

3. **The R&D/local runtime correctly has no custody secrets.**  
   A read-only environment check found no `WR_CUSTODY_*` variables. The connected GitHub tool surface exposes workflow/run reads and reruns but no workflow-dispatch operation or secrets API. This matches PR #153's fail-closed account.

4. **WR-042 was forbidden to change the missing infrastructure.**  
   The closed retry could identify all 16 provider objects, but its write scope was `.ai/research/**`. It therefore could neither parameterize the accepted workflow nor add a protected execution bridge.

No individual part is a transient CI failure. Together they make actual task-specific custody impossible.

## Reproduction / validation

Static repository reproduction:

- Workflow inventory contains only general CI and the WR-046 fixture workflow.
- The WR-046 workflow branch predicate cannot execute a live job from a future WR-042 branch.
- Its acquisition step is fixed to asset `453012755`, SHA-256 `01e961...00eed`, size `14380`.
- Its proof script rejects any other digest/size before provider operations.
- The historical WR-042 manifest contains 16 different asset IDs, digests, and sizes.
- No local protected credential variables exist.
- No connected workflow-dispatch capability exists.

Historical evidence corroboration:

- PR #153 reported required 16, admitted 0, rejected 1, unavailable 15.
- Every otherwise rights-eligible source has downloaded-byte, B2, R2, retrieval, and equality evidence unset.
- `draft_picks.csv` is independently blocked by rights and is not a runtime-path symptom.

## Competing approaches ruled out

### Reuse the WR-046 workflow unchanged

Rejected. It can only prove the jq fixture and cannot produce truthful task-specific source evidence.

### Substitute provider metadata for downloaded-byte proof

Rejected by WR039 / WR-D008. Provider digest/size remains external identity evidence; the runner must hash the bytes it actually receives.

### Put custody secrets in the worker/local runtime

Rejected. It expands secret exposure and bypasses the accepted protected Actions boundary.

### Let a WR-042 branch execute secret-bearing branch code on push

Rejected as unsafe. A branch author could alter the workflow/helper to print or transmit protected credentials. The accepted WR-046 branch marker was a bounded capability proof, not a safe general-purpose research execution interface.

### Use an Actions artifact as custody

Rejected. Actions is transport/execution only; B2 primary and R2 independent locked backup remain authoritative.

### Repair or advance PR #153

Rejected. It is immutable fail-closed historical evidence and must remain closed unmerged.

## Minimum remediation architecture

Create a **default-branch-controlled, manual-dispatch custody bridge**. The protected job must execute only code checked out from the accepted default-branch implementation SHA. A future WR-042 candidate manifest is input data, never executable code.

### Required expansion

| Exact path | Change | Purpose |
|---|---|---|
| `.github/workflows/wr042-source-custody.yml` | New | Manual `workflow_dispatch` entry point with immutable manifest commit SHA/path inputs; read-only repository permission; custody secrets/variables only in the protected job; trusted default-branch checkout; fail-closed summary and cleanup. |
| `scripts/custody/run_source_manifest_custody.py` | New | Validate the versioned manifest, acquire each approved GitHub release asset by immutable asset ID, compute downloaded-byte identity, invoke two-provider custody, aggregate privacy-safe machine evidence, and delete runner-local raw bytes/reports. |
| `scripts/custody/prove_b2_r2_custody.py` | Narrow refactor | Parameterize expected SHA-256, size, source identity, and task/report metadata while retaining the existing WR-046 fixture defaults and self-test behavior. |
| `scripts/custody/ensure_b2_custody_object.py` | Narrow refactor | Accept the caller's preverified expected SHA-256/size instead of the WR-046 constants; retain exact-key, COMPLIANCE, Legal-Hold, and fail-closed behavior. |
| `scripts/custody/test_source_manifest_custody.py` | New test-only | Deterministic manifest/security/orchestration regressions without provider writes. |
| `.github/workflows/ci.yml` | Add test invocation | Make the new fail-closed regression suite a normal merge gate. |

No production source or football behavior is required.

### Protected execution invariant

The workflow must:

1. run the trusted workflow and custody scripts from the audited default-branch implementation, not the WR-042 branch;
2. fetch the candidate manifest at an exact 40-character commit SHA as inert UTF-8 JSON;
3. verify a caller-supplied manifest SHA-256 before parsing;
4. reject duplicate asset IDs, duplicate source keys, missing fields, extra executable/path/URL fields, invalid hashes/sizes, unsupported repository/source classes, and any season beyond 2025;
5. accept only Manager-dispositioned rights states; `RESTRICTED_RAW_CUSTODY_PENDING_RIGHTS_REVIEW` fails closed;
6. permit only the approved provider repository and immutable GitHub release-asset ID acquisition;
7. hash actual downloaded bytes and require exact digest/size equality before any placement;
8. use the existing content-addressed `custody/sha256/<digest>/raw` key;
9. verify B2 COMPLIANCE retention, Legal Hold, R2 Indefinite Bucket Lock coverage, direct retrieval from both providers, and three-way digest/size equality;
10. emit current privacy-safe credential anchors so the run binds to the accepted WR-053 credential lineage;
11. emit no source bytes, source content, reusable credential, or unrestricted error body;
12. remove every runner-local source/report in `if: always()`;
13. upload no raw-source Actions artifact and make no admission claim. The later R&D task owns admission after reviewing immutable custody evidence.

Manual dispatch is appropriate because the current connector cannot dispatch workflows and because a human/Manager-controlled invocation prevents a research branch from automatically obtaining secrets. The dispatch UI must require exact manifest ref/path/hash and an explicit confirmation string.

## Regression plan

Deterministic offline tests must cover:

- valid one-row and multi-row manifests;
- canonical ordering and deterministic output;
- duplicate source key and duplicate asset ID;
- missing/unknown fields;
- invalid SHA-256, negative/zero size, invalid asset ID;
- mutable URL or caller-supplied command/path injection;
- repository/source-class allowlist;
- 2026 or later source rejection;
- rights-pending/rejected row rejection;
- acquired digest mismatch and byte-size mismatch before provider calls;
- partial provider failure produces no admission and a per-source fail-closed result;
- B2/R2 key derives only from downloaded SHA-256;
- cleanup on success and every forced failure;
- privacy-safe error/report allowlist;
- current credential-anchor presence and secret absence;
- WR-046 fixture self-test and accepted behavior unchanged.

## Controlled live validation

A controlled live validation is required before WR-058 can meaningfully audit capability.

Use exactly one lawful, non-sensitive jq fixture manifest through the new bridge. It must verify:

- immutable asset-ID acquisition and downloaded-byte identity;
- current accepted credential anchors;
- B2 COMPLIANCE and Legal Hold;
- R2 Indefinite Bucket Lock;
- direct retrieval and three-way equality;
- cleanup and secret masking.

Do not use any Returning-Player source in WR-056 validation. After the controlled proof, freeze the workflow run/job IDs and exact implementation head under `.ai/work_helper/**`, then route WR-058.

## Additional blocker

The only additional blocker found is already separately recorded: `draft_picks.csv` remains rights-pending and is assigned to WR-057. Runtime remediation must not treat it as eligible until Manager disposition. No other blocker is established from current evidence.

## Prior accepted behavior

WR-046 / WR-053 remains valid and is not reopened. The proposed parameterization must preserve its exact fixture defaults, content-addressed key convention, provider retention/lock verification, privacy-safe credential anchors, and no-Actions-artifact rule. WR039 / WR-D008 requires no semantic change.

## Security and privacy

No secret value was accessed, printed, or persisted during WR-056 diagnosis. No provider write or source download occurred. The proposed path reduces risk relative to branch-trigger execution by keeping executable code under the audited default-branch workflow and treating task-branch input strictly as hashed, schema-validated data.
