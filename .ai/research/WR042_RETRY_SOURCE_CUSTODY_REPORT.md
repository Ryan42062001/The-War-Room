# WR-042 Returning-Player v2 Exact Source-Custody Retry

Task: `WR-042`  
Branch: `wr-042-v2-source-custody-retry`  
Canonical retry base: `e24df6ab7c76be16b00e590ecab0bf71b0f05f28`  
Governing contract: WR-D008 / audited WR-039 head `00a9e787e716d6697e6cd0d9252982a672abbbe0`

## Disposition

**FAIL CLOSED — no required source instance is admitted.**

The exact 16 required nflverse release objects were identified from provider-issued GitHub Releases metadata. Provider asset IDs, SHA-256 values, byte sizes, and update timestamps are frozen in the machine snapshot. Those provider values are external-authority identity evidence only; they are not substituted for the contract-required digest/size computed from bytes actually acquired by WR-042.

The accepted WR-046 / WR-053 B2/R2 custody capability remains valid and unchanged. WR-042 could not bind exact release-byte acquisition to the accepted stored credentials in the available execution path: the credential-bearing GitHub Actions workflow is fixture-specific, the connected GitHub action set exposes no workflow-dispatch operation for a WR-042 source run, the task forbids modifying workflow/custody-script surfaces, and local execution has no `WR_CUSTODY_*` secret environment. Therefore no source reached task-specific B2 or R2 custody and no source was parsed.

A second independent blocker applies to `draft_picks.csv`: the accepted WR-039 rights matrix still says `RESTRICTED_RAW_CUSTODY_PENDING_RIGHTS_REVIEW`, and no canonical Manager raw-retention acceptance was found.

## Counts and custody evidence

- Required: **16**
- Admitted: **0**
- Rejected: **1** — `draft_picks.csv` for unresolved raw-retention rights acceptance
- Unavailable: **15** — exact object identified but exact bytes + accepted-credential custody execution unavailable
- Task-specific B2 primary placements/retrievals: **0**
- Task-specific B2 COMPLIANCE / Legal-Hold attestations: **0**
- Task-specific R2 backup placements/retrievals: **0**
- Original/B2/R2 digest equality proofs: **0**
- Original/B2/R2 byte-size equality proofs: **0**

The accepted capability evidence remains WR-053 PASS over WR-046 live proof run `34723578709`: B2 `War-Room-Custody-Primary` / `us-east-005` / `custody/` with COMPLIANCE + Legal Hold ON, and R2 `war-room-custody-backup` under indefinite bucket-wide lock rule `my-rule`. Only privacy-safe credential identity hashes/IDs from that accepted evidence are retained in the machine snapshot; no reusable secret was read or committed.

## Machine evidence

- Snapshot ID: `wr042-v2-source-custody-retry-fail-closed-20260913`
- Snapshot: `.ai/research/generated/WR042_RETRY_SOURCE_SNAPSHOT_MANIFEST.json`
- Snapshot SHA-256: `22ea0b4c3837eaed2fffe51ea0b8a0ed0414f6da7c1121d6dd0a39f69c5eb492`
- Cohort/source-eligibility manifest: `.ai/research/generated/WR042_RETRY_COHORT_SOURCE_ELIGIBILITY_MANIFEST.json`
- Cohort/source-eligibility SHA-256: `bc6ef0945d7ae17ac73a64400773d14836c1f6fa9f0c858cca6ab3e8b9a3b256`
- Rights/custody matrix: `.ai/research/WR042_RETRY_SOURCE_RIGHTS_CUSTODY_MATRIX.md`

The cohort manifest is intentionally `NOT_CONSTRUCTED_FAIL_CLOSED`, with zero rows. Schema, row count, duplicate/missing-key checks, and source-derived inclusion/exclusion reasons were not fabricated because the contract forbids parsing/use before custody admission.

## Boundaries

2026 regular-season outcome bytes/rows/content inspected: **NO**. Any 2026 source asset downloaded or parsed: **NO**. Any required source parsed before admission: **NO**. Model fit/score/tune/compare/evaluate: **NO**. Outcome join: **NO**. Rankings/recommendations/production changes: **NO**. Phase-6 work: **NO**. WR-021/WR-023 changes: **NO**. WR-033/WR-034 history rewrite: **NO**.

## Next gate

**Do not activate WR-043.** No admitted immutable no-scoring source-custody target exists.

Manager / Architect must provide an authorized execution path that combines exact provider-byte acquisition with the already accepted credential-bearing custody context and resolve the `draft_picks.csv` rights condition. If remediation changes source classes/semantic fields or weakens custody/rights requirements, use `SOURCE CONTRACT VERSION BUMP REQUIRED`.
