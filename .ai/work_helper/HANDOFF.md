# Work Helper / Super Troubleshooter Handoff

HANDOFF

Task ID: WR-056  
Role: Work Helper / Super Troubleshooter  
Assignment mode: WORKFLOW / PROTECTED-RUNTIME TROUBLESHOOTING  
Status: DIAGNOSIS COMPLETE — REMEDIATION SURFACE EXPANSION REQUIRED  
Canonical base: `5b3545a84365c336fb58fc706a1c89897efd4d77`  
Branch: `wr-056-runtime-path-remediation`

## Root cause

WR-042 did not fail because accepted B2/R2 custody was unavailable. It failed because the repository exposes only a WR-046 branch-locked, jq-fixture-hardcoded secret-bearing workflow and fixture-hardcoded proof helpers. No trusted manifest-driven bridge exists; the R&D/local runtime correctly has no custody secrets; the connected GitHub tool surface cannot dispatch a protected workflow; and WR-042 lacked workflow/script write authority.

Historical PR #153 correctly failed closed and remains closed unmerged.

## Required expansion

Manager should authorize exactly:

- `.github/workflows/wr042-source-custody.yml`;
- `scripts/custody/run_source_manifest_custody.py`;
- narrow parameterization of:
  - `scripts/custody/prove_b2_r2_custody.py`;
  - `scripts/custody/ensure_b2_custody_object.py`;
- `scripts/custody/test_source_manifest_custody.py`;
- only the test-registration change in `.github/workflows/ci.yml`.

Purpose: a default-branch-controlled, manually dispatched, hashed-manifest-as-data bridge using protected credentials and the unchanged accepted custody semantics.

Detailed diagnosis: `.ai/work_helper/WR056_RUNTIME_PATH_DIAGNOSIS.md`.

## Required validation

- deterministic offline manifest/security/failure/cleanup tests;
- WR-046 fixture regression unchanged;
- exactly one controlled live validation with the lawful jq fixture through the new bridge;
- no Returning-Player source in WR-056;
- independent WR-058 audit of the immutable implementation/live-evidence head.

## Boundaries and blockers

Accepted WR-046 / WR-053 behavior remains valid: **YES**  
WR039 / WR-D008 change required: **NO**  
Source admitted/downloaded/parsed: **NO**  
2026 outcomes inspected: **NO**  
Model/scoring/ranking/production work: **NO**  
Secrets accessed/exposed: **NO**

Separate blocker: `draft_picks.csv` rights disposition remains WR-057. WR-043 remains blocked.

## Next action

Manager / Architect should approve the exact surface expansion above and return WR-056 to Work Helper for implementation. After implementation and one controlled non-source live validation, activate Independent Auditor / QA for WR-058. Do not activate WR-043.
