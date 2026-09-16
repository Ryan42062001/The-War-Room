# War Room Project State

Status: ACTIVE DEVELOPMENT — WORKFLOW V3.2 CANONICAL / V3.3 CANDIDATE AUDIT ACTIVE / WR-072 REMEDIATION + WR-074 RUNNER PILOT IN PARALLEL
Last verified: 2026-09-16
Owner: Manager / Architect
Workflow: V3.2 CANONICAL; V3.3 CANDIDATE ONLY

## Returning-Player v2

Accepted source/cohort authority remains unchanged: source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`; cohort `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`; 5,176 unique keys / zero duplicates; 14 admitted stats sources / zero admitted Players metadata / one failed-closed metadata source; `draft_picks.csv` excluded.

WR-072 remains `REWORK_REQUIRED` after WR-076, bounded to named candidate/baseline operand signatures and an exact hash-bound synthetic conformance fixture. No model fitting/scoring/outcome inspection is authorized. WR-077 remains BLOCKED pending one new Manager-frozen WR-072 target.

## Self-hosted CI lane

WR-074 remains `IN_PROGRESS` and independent at observed checkpoint `7b4641499c50541abf523267eb4c0255813e8b6d`. WR-075 remains BLOCKED pending a Manager-frozen WR-074 target.

## Workflow V3.3 efficiency candidate

WR-078 is now `AUDIT_READY` at exact PR #217 head `0b25767ce56c44505e9364adc9c536d57c46a1e5`.

Frozen evidence:

- scope exactly five files: `.github/workflows/ci.yml` plus four workflow helper/regression scripts;
- exact-head War Room CI `35100255711` SUCCESS;
- classify `104807577031`, governance `104807636859`, full test `104807695995` all SUCCESS;
- exact-head readiness packet reports zero blockers, no forbidden/outside-allowlist files, all contract checks PASS, and `ready_for_manager_freeze: true`;
- readiness packet correctly binds immutable PR head rather than GitHub synthetic merge SHA.

WR-079 is `ASSIGNED` to fresh Independent Auditor / QA against only exact WR-078 head `0b25767ce56c44505e9364adc9c536d57c46a1e5`.

V3.2 remains canonical. Do not merge WR-078 before PASS-family WR-079. Even after accepted integration, V3.3 becomes canonical only after mandatory canonical-main full-CI canary and final Manager disposition.

## Hard boundaries

No workflow automation may issue an Auditor verdict, merge audited work, weaken live/exact-head verification, bypass Manager authority, reduce custody/provider controls, or alter Returning-Player model/ranking semantics. WR-078/079 remains independent of WR-072/077 and WR-074/075.
