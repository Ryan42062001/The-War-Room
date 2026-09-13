# WR-056 — Implementation Expansion

TASK ID: WR-056
ROLE: Work Helper
STATUS: ASSIGNED
DATE: 2026-09-13
DEPENDENCY: INDEPENDENT
EXECUTION MODE: STANDARD_CHAT
TARGET BRANCH: `wr-056-runtime-path-remediation-impl`
AUDIT REQUIRED: YES
POST-MERGE CANARY REQUIRED: YES

Accepted diagnosis: PR #156 / `f1d4ece46dd89f4f1395d24b57af1b042757ecbd`.
Current implementation checkpoint: PR #158 / `589ec9bdb77613600a7caddb6169999aab248276`.

Authorized writes:
- `.ai/work_helper/`
- `.github/workflows/wr042-source-custody.yml`
- `.github/workflows/ci.yml`
- `scripts/custody/run_source_manifest_custody.py`
- `scripts/custody/prove_b2_r2_custody.py`
- `scripts/custody/ensure_b2_custody_object.py`
- `scripts/custody/test_source_manifest_custody.py`
- `scripts/validate-release-candidate.mjs`

The final path is authorized only to recognize the new WR-042 custody workflow in the existing strict release-workflow inventory. Preserve all other release checks and continue rejecting any additional workflow.

After that update, rerun full exact-head CI. If green, perform exactly one controlled jq fixture validation, freeze the resulting evidence, and return to Manager for independent audit routing.

Do not modify research, Auditor, football, ranking, model, or production surfaces.
