# Work Helper / Super Troubleshooter Handoff

STATUS: COMPLETE — MANAGER FREEZE / FRESH WR-104 AUDIT REQUIRED  
TASK: WR-103 — v2.1 Protected target-ingest Failure Analysis + Bounded Remediation  
ROLE: Work Helper / Super Troubleshooter / Cross-Functional Operator  
WORKFLOW: V3.5  
BRANCH: `wr-103-v21-target-ingest-failure-remediation`  
PR: #289 (unmerged, draft until Manager freeze)  
BASE: `d9886095f77ae0e03699309670ddc670762d6a74`  
REMEDIATED IMPLEMENTATION SHA: `b81be550a45e12032814a67dea6a8b146597250a`

ROOT CAUSE: The bridge hashed each immutable prediction-publication entry with `path,sha256,byte_size,family`; the consumer reconstructed `path,sha256,byte_size` only. The resulting prediction-lock digest mismatch occurs at the first `target-ingest` before target source read. Pre-fix local synthetic hashes and commits are recorded in `.ai/work_helper/WR103_TARGET_INGEST_REPRODUCTION.md`.

REMEDIATION: The consumer now reconstructs the exact four-field lock digest and validates the expected publication family/path while retaining immutable file digest/size checks. Synthetic consumer tests cover full locked target-ingest success and tamper rejection. The bridge tests exercise the actual provider-free sandbox with a synthetic CSV, bridge-created immutable lock, fail-closed tamper, and cleanup.

SECONDARY CLEANUP FINDING: The synthetic sandbox test exposed silent incomplete deletion of 0555 immutable lock directories. Runner-temporary cleanup now restores directory write permission only during deletion, rejects incomplete cleanup, and is used by the future-execution finalizer. This is a cleanup-preservation fix, not protocol or scoring scope expansion.

TESTS: 15/15 direct consumer tests PASS; bridge/V3.5 security regressions PASS; WR-063/069/083 regressions PASS; release guard PASS. Implementation-head PR preflight `35425202543` / job `105849874095` SUCCESS; credentialed and scoring jobs SKIPPED. Implementation-head Full War Room CI `35425202540` SUCCESS (classify `105849822616`, governance `105849839230`, test `105849858385`). WR-046 `35425202537`, WR-063 `35425202539`, WR-069 `35425202535` SUCCESS.

BOUNDARIES: No protected scoring workflow dispatch by WR-103, no real scoring, no provider access, no real 2022–2025 target inspection, no 2026 outcomes, and no new or consumed authority. PR creation automatically triggers noncredentialed preflight only. WR-101 remains BLOCKED with authority revoked; WR-102 remains reserved. No workflow YAML, canonical authority, model/protocol/source/cohort, or production files changed.

FILES THAT MATTER:
- `.ai/work_helper/WR103_TARGET_INGEST_REPRODUCTION.md`
- `.ai/work_helper/WR103_REMEDIATION_REPORT.md`
- `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER.py`
- `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER_TEST.py`
- `scripts/custody/wr097_v21_protected_scoring.py`
- `scripts/custody/test_wr097_v21_protected_scoring.py`

NEXT ACTION: Manager verifies/freezes exact final PR #289 head, activates fresh WR-104 independent audit only after audit readiness, and does not create a new scoring authority before accepted remediation integration. Work Helper does not merge, audit itself, dispatch scoring, or activate WR-104.

DO NOT REPEAT: No retained-data reproduction, no scoring rerun, no use of the revoked authority, no WR-074 work.
