# Manager / Architect Handoff

HANDOFF

Canonical workflow: V3.1.1
Canonical head at WR-054 assignment: `e24df6ab7c76be16b00e590ecab0bf71b0f05f28`

## Active work

### WR-042 — Returning-Player v2 exact source custody retry
Owner: R&D
Status: ASSIGNED
Branch: `wr-042-v2-source-custody-retry`

This research lane is independent of the workflow hardening below. Do not interrupt or rewrite it for WR-054.

Historical blocker PR #133 is CLOSED UNMERGED and remains immutable fail-closed evidence.

WR-043 remains BLOCKED until WR-042 publishes one admitted immutable no-scoring source-custody target.

### WR-054 — Workflow V3.2 lane-identity enforcement
Owner: Manager
Status: ASSIGNED
Branch: `manager/wr-054-workflow-v32-lane-identity`
Execution mode: STANDARD_CHAT
Audit required: WR-055

Observed gaps:
1. `workflow-preflight.mjs` and `workflow-finish-check.mjs` expose current branch identity but do not fail if it differs from the task registry branch.
2. `workflow-state-check.mjs` validates task-spec TASK ID and STATUS but does not bind TARGET BRANCH, EXECUTION MODE, or dependency class back to registry truth.

Required outcome:
- wrong branch / detached HEAD fails task-local preflight and finish checks when a branch is assigned;
- static task-spec contract drift fails Governance;
- focused regression coverage;
- no research/product/custody semantic change;
- exact-head Full CI.

### WR-055 — independent V3.2 audit
Owner: Auditor
Status: BLOCKED
Branch: `wr-055-workflow-v32-lane-identity-audit`

Activate only after WR-054 publishes one immutable exact-head target and Full CI passes. Auditor writes only `.ai/auditor/**`.

## Boundaries

No model fitting, scoring, tuning, comparison, 2026 regular-season outcome use, production ranking change, Phase-6 work, custody configuration change, or weakening of WR039 / WR-D008 is authorized.

## Next routing

1. Continue WR-042 independently.
2. Implement WR-054 on its dedicated branch.
3. Exact-head Full CI.
4. Manager pins exact WR-054 target and activates WR-055.
5. PASS-family -> merge exact audited WR-054 head -> canonical-main canary -> close WR-054/055 and promote V3.2.
