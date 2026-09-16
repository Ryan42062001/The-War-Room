# War Room Project State

Status: ACTIVE DEVELOPMENT — WORKFLOW V3.2 CANONICAL / V3.3 EFFICIENCY CANDIDATE ASSIGNED / WR-072 REMEDIATION + WR-074 RUNNER PILOT IN PARALLEL
Last verified: 2026-09-16
Owner: Manager / Architect
Workflow: V3.2 CANONICAL; V3.3 CANDIDATE ONLY

## Returning-Player v2

Accepted source/cohort authority remains unchanged: source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`; cohort `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`; 5,176 unique keys / zero duplicates; 14 admitted stats sources / zero admitted Players metadata / one failed-closed metadata source; `draft_picks.csv` excluded.

WR-072 is `REWORK_REQUIRED` after WR-076. Historical failed locks remain immutable: 1.0.0 `d2fb3268...` and 1.1.0 `831aed6e...`. Current remediation is bounded to `WR-076-AUD-01` named candidate/baseline operand signatures and `WR-076-AUD-02` exact hash-bound synthetic conformance fixture. No model fitting/scoring/outcome inspection is authorized. WR-077 remains BLOCKED pending one new Manager-frozen WR-072 target.

## Self-hosted CI lane

WR-074 remains `IN_PROGRESS` and independent; live observed branch checkpoint is `7b4641499c50541abf523267eb4c0255813e8b6d`. Its workflow write authority is narrowed to exact `.github/workflows/wr074-self-hosted-heavy-ci-pilot.yml`, preserving `.ai/work_helper/**`, `scripts/ci/**`, and the exact release-validator authorization. WR-075 remains BLOCKED pending a Manager-frozen WR-074 target.

## Workflow V3.3 efficiency candidate

WR-078 is `ASSIGNED` on `manager/wr-078-workflow-v33-efficiency`, based on canonical main `28ba5218beee70a9228629aaaacd1c9b0539fe2d`.

Candidate features:

- automatic mechanical audit-readiness preflight for active audit-required branches;
- machine-readable readiness packet with exact changed-file SHA-256 inventory;
- optional Manager-owned task-specific readiness contracts for exact sidecar, JSON-pointer, fixture-hash and version-bump checks;
- dry-run-by-default Manager transition helper that synchronizes registry/task-spec machine headers and rolls back on static-state failure;
- Bounded Remediation Refresh for explicitly bounded same-task audit remediation.

V3.2 remains canonical. WR-079 is BLOCKED and will independently audit one exact Manager-frozen WR-078 target. V3.3 may become canonical only after PASS-family audit, integration, and mandatory canonical-main full-CI canary.

## Hard boundaries

No workflow automation may issue an Auditor verdict, merge audited work, weaken live/exact-head verification, bypass Manager authority, reduce custody/provider controls, or alter Returning-Player model/ranking semantics. WR-078/079 is independent of WR-072/077 and WR-074/075.
