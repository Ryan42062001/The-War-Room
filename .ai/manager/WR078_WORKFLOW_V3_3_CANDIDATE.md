# Workflow V3.3 Candidate — Audit Readiness + Manager Transition Efficiency

Status: CANDIDATE — NOT CANONICAL
Owner: Manager / Architect
Task: WR-078
Canonical workflow until acceptance: V3.2

## Objective

Reduce avoidable worker → Manager → Auditor → remediation loops while preserving the safety properties that V3.2 already enforces. V3.3 accelerates preparation and routing; it does not reduce independent audit, exact-head pinning, Manager merge authority, fail-closed semantics, custody controls, or post-merge canaries.

## 1. Audit-readiness preflight

Audit-required runnable task branches receive a mechanical pre-audit check before Manager freeze. Governance CI automatically invokes `scripts/workflow-audit-readiness.mjs --auto` when the current branch is claimed by an active audit-required task.

The helper produces a deterministic audit-readiness packet containing the task/head/target/branch, changed-file list, SHA-256 of changed files present in the checkout, scope violations, mechanical checks, blockers, and a boolean `ready_for_manager_freeze`.

Generic checks include:

- assigned-branch identity;
- changed-file allowlist/forbidden-surface enforcement;
- exact `.sha256` sidecar verification for changed sidecars;
- deterministic changed-file SHA-256 inventory.

Manager may bind an optional task-specific contract through `audit_readiness_contract` in `ACTIVE_TASKS.json`. Contract schema v1 supports:

- `file_exists`;
- `sha256_sidecar`;
- `json_pointer_exists`;
- `json_pointer_equals`;
- `json_pointer_file_sha256`;
- `version_bump`.

This allows task specifications to convert known audit invariants into machine checks before a fresh Auditor spends a review cycle. The contract is Manager-owned and must not encode or inspect result/outcome values that are forbidden by the task.

Audit readiness is never an audit verdict. A green packet means only that the candidate is mechanically ready for Manager exact-head verification and, if required, fresh independent audit.

## 2. Machine-readable audit packet

`workflow-audit-readiness.mjs --json` is the canonical V3.3 machine-readable readiness packet. Workers/Manager may preserve that JSON as evidence or pipe it to a task-authorized file. The packet never substitutes for exact-head CI evidence or Auditor reproduction of critical claims.

## 3. Manager transition engine

`scripts/workflow-manager-transition.mjs` is a Manager-only state-preparation helper. It is dry-run by default.

A schema-v1 plan may:

- update active task fields;
- add fully specified active task entries whose task specs already exist;
- remove tasks from the active-only registry.

For every resulting active task, the helper synchronizes only the machine headers in the referenced task spec:

- `TASK ID`;
- `STATUS`;
- `DEPENDENCY`;
- `EXECUTION MODE`;
- `TARGET BRANCH`.

`--write` updates the registry and affected task-spec headers, then executes the canonical static state checker. Any write/state-check failure restores the original files and fails closed.

The transition engine does not commit, push, merge, edit specialist evidence, decide findings, or rewrite narrative `PROJECT_STATE`/`ROADMAP`/handoff material. Manager still reviews the complete diff, performs live GitHub verification where required, updates narrative canonical state, and creates one atomic Git transaction.

## 4. Bounded Remediation Refresh

V3.3 introduces **Bounded Remediation Refresh** for a same-task remediation after a published audit finding when the Manager has explicitly bounded the rework.

Minimum refresh surface:

- current canonical main;
- `ACTIVE_TASKS.json`;
- the assigned task spec;
- the latest failed audit report/handoff;
- current task branch/PR/head;
- affected artifacts/files;
- only the upstream authority necessary to preserve accepted semantics.

A Full Refresh remains mandatory for new task creation/activation, workflow/architecture changes, milestone acceptance, material merge/disposition, contradiction resolution, materially stale state, or when the bounded refresh reveals scope uncertainty.

Bounded Remediation Refresh may not be used to hide target movement, skip authoritative evidence, broaden scope, or bypass independent audit.

## 5. Independent audit remains unchanged

Audit-required work still requires:

1. worker publication of one immutable target;
2. Manager exact-head/live-state verification and freeze;
3. fresh independent Auditor review of that exact target;
4. Auditor-only report/handoff/PR/exact-head CI;
5. PASS or PASS WITH NON-BLOCKING FINDINGS before Manager integration;
6. post-merge canary where V3.2 requires one.

No helper may emit an Auditor verdict or auto-merge an audited target.

## 6. Parallelism and collision safety

V3.3 keeps V3.2 dependency/write-collision rules. Efficiency comes from narrow scopes and independent lanes, not bypasses.

WR-074's workflow authority is narrowed to its exact pilot file `.github/workflows/wr074-self-hosted-heavy-ci-pilot.yml`; this removes an unnecessary broad `.github/workflows/` collision and allows WR-078 to own `.github/workflows/ci.yml` independently.

## 7. Adoption gate

V3.3 is not canonical until all of the following occur:

`WR-078 implementation -> Manager exact freeze -> WR-079 fresh independent audit -> PASS-family only: WR-078 integration -> mandatory canonical-main full CI/canary -> Manager declares V3.3 canonical`

Until that final Manager disposition, `.ai/shared/WORKFLOW.md` V3.2 remains authoritative.
