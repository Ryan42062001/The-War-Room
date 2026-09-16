# Workflow V3.3 — Audit Readiness + Manager Transition Efficiency

Status: ACCEPTED — CANONICAL
Owner: Manager / Architect
Task: WR-078
Canonical workflow: V3.3

## Acceptance record

WR-078 implemented the Workflow V3.3 efficiency upgrade. Historical WR-079 independently found two MEDIUM defects in the initial candidate. WR-078 remediated both, and WR-080 independently re-audited exact remediation head `d952099946b51c5d4d8a88929ca83d1d4dce3521` and returned `PASS` with no findings.

Accepted evidence:

- WR-080 Auditor PR #222;
- Auditor head `7f770c8398202be2e28729e2028445647c50f5ad`;
- audit-head CI `35142111164` SUCCESS;
- exact audited WR-078 integration through PR #217 at canonical-main merge `534f79a4f560d03c1ddf6309f9c416e3373e48b5`;
- mandatory canonical-main Full War Room CI `35143657933` SUCCESS.

## 1. Audit-readiness preflight

Audit-required runnable task branches receive a mechanical pre-audit check before Manager freeze. Governance CI may automatically invoke `scripts/workflow-audit-readiness.mjs --auto` when the current lane is safely attributable to an active audit-required task.

The helper produces deterministic readiness evidence including task/head/branch identity, changed-file scope, SHA-256 inventory, mechanical checks, blockers, and `ready_for_manager_freeze`.

Pull-request auto attribution must match canonical repository identity and, when the active task records a positive PR number, exact PR identity. Same-branch public-fork PRs are not attributed to the task.

Manager may bind optional task-specific readiness contracts through `audit_readiness_contract` in `ACTIVE_TASKS.json`. Supported contract primitives include file existence, SHA-256 sidecar verification, JSON pointer checks, file-hash binding, and version-bump checks. Invalid/unresolved comparison refs fail closed; valid refs with absent artifact paths remain a distinct new-artifact case.

Audit readiness is never an audit verdict. It is mechanical evidence only.

## 2. Machine-readable readiness packet

`workflow-audit-readiness.mjs --json` provides the canonical V3.3 machine-readable readiness packet. Workers/Manager may preserve it as evidence when authorized. It does not substitute for exact-head CI, Manager live verification, or independent Auditor reproduction of critical claims.

## 3. Manager transition engine

`scripts/workflow-manager-transition.mjs` is a Manager-only state-preparation helper and is dry-run by default.

A schema-v1 plan may update active task fields, add fully specified active entries whose task specs exist, or remove tasks from the active-only registry. It synchronizes only machine headers in affected active task specs.

`--write` updates planned registry/task-spec state, executes the canonical static state checker, and restores original files if the write or validation fails.

The helper cannot commit, push, merge, issue Auditor verdicts, edit specialist evidence, or replace Manager review. Manager still verifies live state, reviews the complete diff, updates narrative canonical state, and creates the atomic Git transaction.

## 4. Bounded Remediation Refresh

V3.3 introduces **Bounded Remediation Refresh** for same-task remediation after a published audit finding when Manager has explicitly bounded the rework.

Minimum refresh surface:

- current canonical main;
- `ACTIVE_TASKS.json`;
- assigned task spec;
- latest failed audit report/handoff;
- current task branch/PR/head;
- affected artifacts/files;
- only upstream authority necessary to preserve accepted semantics.

Full Refresh remains mandatory for new task creation/activation, workflow/architecture changes, milestone acceptance, material merge/disposition, contradiction resolution, materially stale state, or whenever bounded scope/authority is uncertain.

Bounded Remediation Refresh may not hide target movement, skip authoritative evidence, broaden scope, or bypass independent audit.

## 5. Independent audit remains mandatory

Audit-required work still requires:

1. one immutable worker target;
2. Manager exact-head/live-state verification and freeze;
3. fresh independent Auditor review of that exact target;
4. Auditor-only report/handoff/PR/exact-head CI;
5. PASS or PASS WITH NON-BLOCKING FINDINGS before Manager integration;
6. required post-merge canary before closure.

No helper may emit an Auditor verdict or auto-merge an audited target.

## 6. Parallelism and collision safety

V3.3 inherits V3.2 dependency and write-collision rules. Efficiency comes from narrow scopes and independent lanes, not bypasses.

WR-074's workflow authority remains narrowed to its exact pilot workflow `.github/workflows/wr074-self-hosted-heavy-ci-pilot.yml`, avoiding unnecessary overlap with canonical CI work.

## 7. Completed adoption gate

Completed sequence:

`WR-078 implementation -> Manager exact freeze -> WR-079 failed audit -> bounded remediation -> Manager exact freeze -> WR-080 fresh PASS audit -> exact audited WR-078 integration -> mandatory canonical-main Full CI/canary -> Manager V3.3 canonical disposition`

All required gates completed successfully. `.ai/shared/WORKFLOW.md` V3.3 is authoritative.
