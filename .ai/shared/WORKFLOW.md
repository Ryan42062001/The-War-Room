# War Room Team Workflow

Status: ACTIVE — WORKFLOW V3.1
Last updated: 2026-09-12
Owner: Manager / Architect

This is the canonical workflow for **The War Room**, the live fantasy-football **DRAFT** assistant. Repository state overrides stale chat memory. If older workflow guidance conflicts with this file, this file wins unless Manager records a newer approved workflow change.

## Project identity boundary
- **The War Room** = live fantasy-football draft assistant.
- **The Chip Winner** = separate in-season fantasy helper.
- **Family Finance Hub** = separate personal-finance application.
- **ECOG** = separate church website.

Do not mix repositories, roadmaps, decisions, tasks, evidence, or employee roles across these projects unless an explicit cross-project task authorizes it.

## Core operating model
**ROLE = DURABLE**  
**CHAT = DISPOSABLE EXECUTION SESSION**  
**TASK = UNIT OF WORK**  
**REPOSITORY = DURABLE MEMORY**  
**MANAGER = ROUTER / INTEGRATOR / CANONICAL-STATE AUTHORITY**

Permanent roles remain intentionally small:
1. Manager / Architect
2. Implementation Engineer / Builder
3. Draft Strategy & Decision Intelligence Analyst
4. Research & Development (R&D)
5. Independent Auditor / QA
6. Work Helper / Super Troubleshooter / Cross-Functional Operator

No new permanent role is required merely to increase parallelism.

## Canonical sources
### Fast path
`.ai/shared/ACTIVE_TASKS.json` is the Manager-owned **active-only** machine-readable control-plane index.

It contains only current `PLANNED`, `BLOCKED`, `ASSIGNED`, `IN_PROGRESS`, `MANAGER_REVIEW_READY`, `AUDIT_READY`, `MERGE_READY`, `REWORK_REQUIRED`, or transient `MERGED` work. Once Manager reconciles a task to `CLOSED`, remove it from `ACTIVE_TASKS.json`. Historical truth remains in task specs, PRs, commits, reports, handoffs, decisions, and Git history.

### Human-readable canonical sources
- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/shared/DECISIONS.md`
- `.ai/shared/WORKFLOW.md`
- `.ai/manager/HANDOFF.md`
- active `.ai/manager/WR-###.md` task spec
- applicable `.ai/roles/*.md` role charter
- latest relevant role handoff/report

Only Manager updates `.ai/shared/*` unless an explicit Manager workflow task authorizes otherwise.

## Refresh modes
### Fast Refresh
Use for routine status, ordinary `continue`, worker startup/resumption, and completion checks. Verify:
1. actual `main` SHA;
2. `ACTIVE_TASKS.json`;
3. role charter;
4. assigned task spec;
5. relevant handoff;
6. branch/PR/current target when relevant;
7. contradictions or unexpected target advancement.

### Full Refresh
Required before new meaningful task creation/activation, workflow/architecture/roadmap changes, durable decisions, meaningful merge/release gates, milestone dispositions, contradiction resolution, or materially stale checkpoints. Also read `PROJECT_STATE`, `ROADMAP`, `DECISIONS`, Manager handoff, relevant evidence, and target advancement.

## Task lifecycle
Every meaningful unit uses a unique `WR-###`. `PW-###` may coordinate parallel waves but never replaces the underlying task IDs.

Lifecycle values:
- `PLANNED`
- `BLOCKED`
- `ASSIGNED`
- `IN_PROGRESS`
- `MANAGER_REVIEW_READY`
- `AUDIT_READY`
- `MERGE_READY`
- `REWORK_REQUIRED`
- `MERGED`
- `CLOSED`

Workers report readiness; Manager owns registry transitions. `CLOSED` tasks are removed from the active-only registry after reconciliation.

## Blocker typing — V3.1
Every active task includes:
- `blocker_type`: `NONE | USER_ACTION | UPSTREAM_TASK | EXTERNAL_SERVICE | TECHNICAL | AUDIT`;
- `user_action_required`: boolean;
- `blocked_on_tasks`: machine-readable WR dependencies where applicable;
- `blocked_on`: concise human-readable blocker text.

Rules:
- `BLOCKED` and `REWORK_REQUIRED` require a non-`NONE` blocker type.
- `user_action_required: true` means the next progress step genuinely requires the user; it must not be used merely because a worker has not tried the available technical path.
- When user action becomes satisfied, Manager clears the flag at the next reconciliation.
- External account/setup steps may use `EXTERNAL_SERVICE`; credential/console clicks requiring the user use `USER_ACTION` when that is the immediate gate.

## Role concurrency — V3.1
A durable role is **not** a single-worker lock.

Manager may run multiple task-scoped chats for the same role simultaneously when all are true:
- tasks are `INDEPENDENT` or safely `SOFT DEPENDENCY`;
- branches are dedicated;
- write surfaces do not materially overlap, or integration order is explicitly controlled;
- no worker audits its own materially changed target;
- no two chats independently mutate Manager-owned canonical state.

Examples: two independent Work Helper tasks may run in parallel; two Auditors may audit unrelated immutable targets; R&D may run multiple bounded research tasks. Use `worker_slot`/lane metadata when it improves clarity. Do not serialize independent work simply because the durable role name is the same.

## Chat lifecycle and context hygiene
Worker chats should normally be task-scoped. Fresh chats bootstrap from repository state rather than copied transcript history. Reuse the same chat for a narrow same-task remediation when it remains focused; roll over when context size causes slowdown, stale-state errors, repeated confusion, or milestone transition.

## Work mode
Manager classifies every new meaningful task:
- `STANDARD_CHAT`
- `WORK_MODE_PREFERRED`
- `WORK_MODE_HIGH_VALUE`

Work mode is an accelerator, not a project dependency. Preferred/high-value tasks must include a normal-chat fallback whenever underlying capabilities exist outside Work mode.

## Routing authority
- **Draft Strategy**: what the draft assistant should recommend and why.
- **R&D**: external data/APIs/source rights, models/algorithms, experiments, feasibility, technical uncertainty.
- **Builder**: approved production implementation and routine production debugging.
- **Auditor**: independent validation and PASS/FAIL gates.
- **Work Helper**: cross-layer blockers, contradictory repo/PR/CI evidence, workflow/infrastructure problems, hidden dependencies, or difficult remediation.

Strategy/R&D findings are advisory until Manager accepts them. Builder/Work Helper may not self-audit materially changed audit-required work. Auditor does not merge the target under review. Manager owns roadmap, task routing, canonical state, durable decisions, acceptance, and merges.

## Work Helper contract
Work Helper is a privileged technical operator, not a second Manager.

Manager activation must define task, assignment mode, blocker, target/checkpoint, read scope, write scope, execution mode, required evidence, governance boundaries, and expected handoff.

Default writes are `.ai/work_helper/**` plus explicitly authorized diagnostic/test surfaces. Broader writes require task authorization. Work Helper has no fixed numerical attempt ceiling while attempts are materially distinct/evidence-driven and scope/safety are respected.

## Anti-loop rule
Normal roles stop speculative iteration after roughly three materially different failed approaches without meaningful new evidence. Persist what is known/tried/missing, then route appropriately—often to Work Helper for cross-layer reconstruction.

## Evidence hierarchy
Prefer:
1. repository contents;
2. runtime/test output;
3. verified branch/commit/PR state;
4. current authoritative external documentation/provider metadata;
5. approved decisions;
6. specialist reports/handoffs;
7. chat summaries;
8. assumptions.

Never present assumption as verified fact.

## External authority evidence — V3.1
Tasks involving external providers, credentials, APIs, source custody, access controls, retention/security configuration, or third-party policy must set `external_authority_evidence_required: true` when provider-side state materially affects acceptance.

Before implementation/audit readiness, the task/PR must define and preserve privacy-safe evidence for, as applicable:
- provider resource identity;
- actual current permission/token/key scope;
- account/bucket/project restriction;
- retention/lock/security configuration;
- provider-issued machine-readable or otherwise authoritative metadata;
- binding between the evidence and the exact configured credential/resource;
- secret-redaction requirements;
- what must be re-proved if credentials/policy change.

A statement that a credential was intended to be least privilege is not proof of its actual provider-side scope. Secret values must never be committed or pasted into public evidence.

## Parallel work
Dependency classes:
- `INDEPENDENT`: may run simultaneously;
- `SOFT DEPENDENCY`: may run simultaneously with controlled integration;
- `HARD DEPENDENCY`: sequential gate.

Parallel workers use dedicated branches, minimize overlap, preserve starting/checkpoint state, do not independently edit `.ai/shared/*`, and check target advancement before readiness/merge.

## Target advancement
Classify target movement as:
- `CURRENT`
- `CONTROL_PLANE_ONLY`: `.ai/**` and non-behavioral workflow-control metadata only;
- `NON_OVERLAPPING`: changed outside control plane but no meaningful task-surface coupling;
- `OVERLAPPING_RISK`: same/tightly coupled behavior or files changed.

Control-plane-only advancement does not force expensive product revalidation. Non-overlapping advancement gets bounded integration/smoke validation. Overlapping risk must reconcile before audit/merge and rerun materially affected evidence.

## Workflow helper scripts — V3.1
Read-only helpers:
- `node scripts/workflow-state-check.mjs`
- `node scripts/workflow-preflight.mjs --task WR-###`
- `node scripts/workflow-finish-check.mjs --task WR-###`

`workflow-state-check` validates active-registry schema, unique task IDs, lifecycle/task-spec consistency, blocker metadata, dependency references, SHA formats, and active-only discipline. CI treats failure as a governance failure.

`workflow-preflight` and `workflow-finish-check` remain task-scoped helpers; they do not prove CI/test execution.

## Path-aware CI — V3.1
Every push/PR runs **Governance CI**:
- checkout;
- Node setup;
- syntax-check workflow helper scripts;
- `workflow-state-check`.

The expensive **Full War Room CI** runs when any changed path is outside `.ai/**`, including production, datasets, extensions, `scripts/**`, `.github/workflows/**`, package files, or test harnesses. A PR labeled `force-full-ci` also forces the full matrix.

Therefore `.ai/**`-only task/audit/Manager evidence PRs do not automatically install Playwright and run the full browser/product matrix. Manager/Auditor may still force it when risk warrants.

This optimization never permits a product/tooling/workflow change to skip the full matrix.

## Validation levels
- Level 1: static correctness
- Level 2: automated tests/integration/CI
- Level 3: simulated draft behavior
- Level 4: real/mock draft validation

A lower level does not prove a higher one.

## Auditor publication contract — V3.1
An audit is not `COMPLETE` merely because the Auditor reached a verdict in chat or committed locally.

Before reporting `COMPLETE`, Auditor must publish:
1. task-specific audit report under `.ai/auditor/**`;
2. concise `.ai/auditor/HANDOFF.md`;
3. one immutable audit branch/head;
4. an audit PR containing only Auditor-authorized evidence surfaces (unless the task explicitly permits more).

The PR body must identify audited target PR/head, audit branch/head, verdict, findings, and exact Manager action authorized.

If the environment cannot create the audit PR, report `BLOCKED — AUDIT PUBLICATION REQUIRED`, provide the exact branch/head and missing publication capability, and do not claim `COMPLETE`.

Auditor never modifies or merges the target under review.

## Pull request protocol
PR-based worker work records:
- TASK ID
- ROLE
- OBJECTIVE
- STARTING SHA
- FINAL SHA
- FILES CHANGED
- REQUIREMENTS IMPLEMENTED
- TESTS ACTUALLY RUN
- RESULTS
- UNVERIFIED ITEMS
- KNOWN RISKS
- DEPENDENCIES
- RECOMMENDED NEXT ROLE

When `external_authority_evidence_required` is true, also include **EXTERNAL AUTHORITY EVIDENCE** describing privacy-safe provider-issued proof and remaining gaps.

Prefer one dedicated branch per task. Remediation normally continues the same implementation task/PR when historical audit evidence remains immutable and the task explicitly calls for bounded rework.

## Merge gate
Before merging an audit/production/workflow target, Manager verifies approved task/target, exact head, target advancement, scope, required tests/CI, unresolved findings, audit requirement, handoffs/evidence, and integration implications. No unresolved CRITICAL/HIGH finding may be ignored.

Audit-required targets need `PASS` or `PASS WITH NON-BLOCKING FINDINGS` from an independent Auditor before Manager acceptance/merge.

## Post-merge canary — V3.1
For audited changes to CI, browser/test harnesses, persistence/shared infrastructure, build/release tooling, or similarly cross-cutting infrastructure:
- the task enters transient `MERGED`, not immediately `CLOSED`;
- the merge/push to `main` must run the relevant full CI/canary on canonical `main`;
- Manager closes only after the main canary passes;
- if the canary fails, preserve the historical exact-head audit verdict and create/reroute a residual-remediation task rather than rewriting history or retrying until green.

The path-aware `push` workflow supplies this canary automatically when merged paths include non-`.ai/**` infrastructure/test changes.

## Atomic Manager reconciliation — V3.1
One logical Manager transition must be one logical repository transaction whenever tooling supports it.

When several canonical files change together, Manager should use one Git tree/commit (or one squash/merge transaction) rather than sequential direct-to-main file commits. A temporary preparation branch may contain work, but the canonical reconciliation must land atomically.

If tooling cannot make the transaction atomic, Manager must disclose the limitation, minimize the inconsistency window, and immediately reconcile before routing additional work.

After merge/disposition update only canonical files whose state actually changed. Workflow mechanics belong here/role charters, not in product/model decisions.

## Canonical-document scope
- `ACTIVE_TASKS.json`: active control-plane index only.
- `PROJECT_STATE.md`: current baseline/blockers/next gates.
- `ROADMAP.md`: milestones/material dispositions.
- `DECISIONS.md`: durable product/architecture decisions only.
- task/research/strategy/audit/work-helper reports: detailed evidence.
- handoffs: concise pointers and next action.

Do not duplicate full evidence tables across canonical files.

## Manager activation output
When next work is determined, end with `ACTIVATE NOW` covering Manager, Builder, Draft Strategy, R&D, Auditor, and Work Helper. Multiple entries for the same durable role are permitted when V3.1 concurrency rules are satisfied; identify each by task ID/lane.

For every newly activated specialist include CHAT, TASK, EXECUTION MODE, activation message, and fallback for Work-preferred/high-value work. Work Helper activations also include assignment mode, blocker, target/checkpoint, read/write scope, evidence, boundaries, and expected handoff.

Do not re-emit prompts for already-running tasks unless needed.

## Worker bootstrap
Fresh chats should receive a short repository-pointer bootstrap rather than giant duplicated workflow prompts:

`You are the <role> for The War Room. Repository: Ryan42062001/The-War-Room. Treat the repository as authoritative. Read .ai/shared/WORKFLOW.md, .ai/shared/ACTIVE_TASKS.json, your role charter, assigned task spec, and relevant role handoff. Execute only the assigned task; if none exists, remain IDLE.`

## Workflow principle
Use the smallest permanent team that preserves meaningful separation. Scale throughput with **task-scoped concurrent chats**, not extra permanent roles. Preserve independent audit and Manager integration authority. Spend expensive validation where changed surfaces justify it, while keeping governance checks always on.