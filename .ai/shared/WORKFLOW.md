# War Room Team Workflow

Status: ACTIVE — WORKFLOW V2
Last updated: 2026-09-09
Owner: Manager / Architect

This file is the canonical repository workflow for The War Room. If older repository guidance conflicts with this file, this file wins unless the Manager records a newer approved change.

## Team roles

1. **Manager / Architect** — roadmap, requirements, architecture, priorities, task decomposition, acceptance criteria, integration decisions, merge authority, canonical shared state.
2. **Implementation Engineer / Builder** — production implementation, debugging, tests, technical execution, remediation.
3. **Research & Development (R&D)** — external APIs/docs/data, feasibility, technical uncertainty, difficult investigations, forward-looking R&D, isolated experiments/proofs of concept, algorithms/model research, source-rights investigation, future architecture evaluation, and evidence-backed milestone proposals.
4. **Independent Auditor / QA** — independent verification, regression analysis, real/mock draft validation, PASS/FAIL decisions.

R&D continues to use `.ai/research/`. Do not create a separate `.ai/rnd/` tree unless a future Manager decision requires it.

## Canonical project sources

### Fast-path current-task index
- `.ai/shared/ACTIVE_TASKS.json` — Manager-owned machine-readable current task/dependency/status index.

### Human-readable canonical sources
- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/shared/DECISIONS.md`
- `.ai/shared/WORKFLOW.md`
- `.ai/manager/HANDOFF.md`
- latest relevant role handoff
- active task spec under `.ai/manager/WR-###.md`

Repository state overrides stale chat memory. Conflicts must be surfaced, not silently reconciled.

`ACTIVE_TASKS.json` does not replace task specs or evidence reports. It is the current-control-plane index. Only the Manager updates `.ai/shared/*`.

## Refresh modes

### Fast Refresh
Use for routine status checks, ordinary `continue`, checking whether a worker finished, and low-risk task resumption when no architecture/merge/release decision is being made.

Read/verify:
1. actual `main` SHA;
2. `.ai/shared/ACTIVE_TASKS.json`;
3. open PRs/current mergeability when relevant;
4. the active task spec and latest relevant role handoff if the task changed or a handoff is being evaluated;
5. contradictions or unexpected target advancement.

Do not reread the full historical roadmap/decision record merely to answer a simple current-status question.

### Full Refresh
Required before:
- creating/activating a new meaningful task;
- architecture or roadmap decisions;
- durable product decisions;
- Manager disposition of research that changes the next milestone;
- production merge/release decisions;
- audit/release-gate decisions with meaningful integration risk;
- resolving contradictions/conflicts;
- resuming after a materially stale checkpoint;
- any case where Fast Refresh exposes uncertainty that could affect correctness.

Read/verify:
1. current `main` and open PRs;
2. `ACTIVE_TASKS.json`;
3. `PROJECT_STATE.md`;
4. `ROADMAP.md`;
5. `DECISIONS.md`;
6. `WORKFLOW.md`;
7. Manager handoff;
8. relevant role handoff(s);
9. active task spec(s);
10. branch/checkpoint and target advancement.

## Task IDs and lifecycle

Every meaningful work item uses a unique `WR-###` Task ID. Parallel coordination uses `PW-###` and does not replace the underlying WR IDs.

Task specs should define:
- TASK ID
- OBJECTIVE
- WHY IT IS NEEDED
- VERIFIED STARTING STATE
- REQUIRED BEHAVIOR
- LIKELY FILES / COMPONENTS
- NON-GOALS
- EDGE CASES
- TEST REQUIREMENTS
- ACCEPTANCE CRITERIA
- EXPECTED HANDOFF

Do not mix unrelated work under one Task ID.

### Workflow V2 lifecycle states

Current task state is indexed in `ACTIVE_TASKS.json` using:
- `PLANNED` — approved future work, not yet assignable;
- `BLOCKED` — approved but waiting on an explicit dependency/gate;
- `ASSIGNED` — activated by Manager, worker not yet confirmed in progress;
- `IN_PROGRESS` — worker is executing;
- `MANAGER_REVIEW_READY` — research/architecture evidence is complete for Manager disposition;
- `AUDIT_READY` — production work is complete enough for independent Auditor;
- `MERGE_READY` — required audit/review gates have passed and Manager may merge;
- `REWORK_REQUIRED` — a blocking finding or integration issue must be remediated;
- `MERGED` — PR/integration merged, final reconciliation not necessarily complete;
- `CLOSED` — Manager has reconciled canonical state and the task is complete.

Workers report completion/readiness in their role handoff/PR. They do not independently change the Manager-owned registry state.

Backward compatibility: existing task documents may still use labels such as `ACTIVE`, `COMPLETE — MANAGER REVIEW REQUIRED`, or `PASS`. Manager maps those to the lifecycle above during reconciliation. Active WR-026/WR-027 work started under Workflow V1 remains valid.

## Evidence hierarchy

Prefer evidence in this order:
1. actual repository contents;
2. actual test/runtime output;
3. verified branch/commit information;
4. current authoritative external documentation/data/licensing;
5. explicit approved project decisions;
6. chat summaries;
7. assumptions.

Never present an assumption as verified fact.

## Work routing and authority

Use R&D when external facts/data/source rights, feasibility, algorithms/models, unknown behavior, or bounded experimentation materially reduces uncertainty.

Use Builder only after objective, scope, architecture/dependencies, and acceptance criteria are sufficiently settled.

Use Independent Auditor for production changes affecting recommendation logic, draft state, live sync, persistence/restoration, ranking/datasets, high-risk shared code, core workflows, or milestone completion.

R&D findings do not become roadmap/architecture commitments automatically. R&D may not:
- select the final roadmap;
- modify production without an approved implementation assignment;
- modify `.ai/shared/*`;
- merge production work;
- audit its own production implementation.

## Maintenance / stable mode

No worker must be kept busy merely for utilization. `IDLE` is valid.

Development may reactivate for verified defects, real-world feedback, changed dependencies, explicit product requirements, materially valuable opportunities, seasonal/data updates, or previously unresolved risks becoming actionable. A trigger does not by itself authorize implementation.

## Parallel work

Parallelism is preferred when tasks are genuinely independent and integration remains clear.

Dependency classes:
- `INDEPENDENT` — may run simultaneously;
- `SOFT DEPENDENCY` — may run simultaneously but one result can influence later integration;
- `HARD DEPENDENCY` — must run sequentially.

When two or more roles run independently, Manager may create a `PW-###` wave recording task, role, objective, dependency, work area, expected output, and integration considerations.

Parallel workers must:
- use dedicated task branches for production work;
- minimize overlapping files;
- preserve starting/checkpoint information;
- avoid independent `.ai/shared/*` edits;
- check target advancement before readiness/merge.

## Target-branch advancement classification

Do not treat every `main` advance as equally risky.

Classify target advancement relative to a task's assignment/reference checkpoint:

### `CURRENT`
Target did not advance materially from the relevant checkpoint.

### `CONTROL_PLANE_ONLY`
Target changes are confined to `.ai/**` and workflow-control scripts such as `scripts/workflow-*.mjs`, with no task-surface overlap.

Effect:
- do not force expensive product revalidation solely because of these changes;
- existing runtime/visual evidence remains usable if the task code itself is unchanged;
- normal final CI/Manager merge checks still apply.

### `NON_OVERLAPPING`
Target includes product/tooling changes outside the control plane, but no changed file or tightly coupled surface overlaps the task.

Effect:
- reconcile before final release when practical;
- rerun affected integration/smoke checks and final CI;
- Manager may decide a full expensive revalidation is unnecessary when evidence shows no coupling.

### `OVERLAPPING_RISK`
Target changed the same files or a tightly coupled behavior/architecture used by the task.

Effect:
- reconcile before audit/merge;
- rerun the materially affected validation levels;
- unresolved overlap blocks release readiness.

File-level overlap is a first-pass heuristic, not proof of independence. Manager/Auditor may escalate classification based on behavior coupling.

## Workflow helper scripts

Two read-only helpers reduce repeated manual checking:

- `node scripts/workflow-preflight.mjs --task WR-###`
- `node scripts/workflow-finish-check.mjs --task WR-###`

Optional flags:
- `--target <ref>` to override the default `origin/main`/`main` target;
- `--json` for machine-readable output;
- finish check: `--pr-body <path>` to validate required PR metadata headings.

These scripts may check registry status, branch/target diff, target-advance classification, frozen/forbidden paths, allowlisted research scope, handoff presence, and PR-template structure.

They **do not prove tests or CI ran** and do not replace Manager/Auditor judgment.

## Validation levels

- **Level 1 — Static correctness**: code/data/spec inspection.
- **Level 2 — Automated tests**: unit/regression/integration/CI.
- **Level 3 — Simulated draft behavior**: controlled draft-state scenarios.
- **Level 4 — Real/mock draft validation**: actual or realistic draft environment.

A lower level does not prove a higher level.

## Pull request protocol

For PR-based work require:
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

Prefer one dedicated branch per implementation task. Auditor remediation normally stays on the same branch/PR.

## Merge gate

Before merging production code, Manager verifies:
1. approved Task ID/target;
2. current branch/checkpoint and target-advance classification;
3. scope matches task;
4. required tests actually ran;
5. unresolved findings/conflicts;
6. audit requirement;
7. no unresolved CRITICAL/HIGH findings;
8. required handoff/evidence;
9. exact PR head and relevant CI;
10. integration implications of target advancement.

Production changes requiring audit need `PASS` or `PASS WITH NON-BLOCKING FINDINGS` before merge.

## Atomic Manager reconciliation

Manager should minimize control-plane churn.

For one decision/transition, prepare the required canonical updates and commit them as **one reconciliation transaction** whenever tooling permits. Avoid separate commits for task spec, project state, registry, roadmap and handoff when they are one logical decision.

After a merge or major disposition, update only what actually changed:
- `ACTIVE_TASKS.json` for lifecycle/dependency/next-gate changes;
- `PROJECT_STATE.md` for current state;
- `ROADMAP.md` only when roadmap/milestone status changed;
- `DECISIONS.md` only for durable architectural/product decisions;
- Manager handoff for the current checkpoint/next action;
- relevant task status.

A merged PR does not by itself prove milestone completion.

## Canonical-document scope

Keep control-plane files concise:
- `PROJECT_STATE.md` = current baseline, active tasks, blockers, next gates;
- `ROADMAP.md` = milestones/phase plan and material dispositions, not every metric;
- `DECISIONS.md` = durable decisions only;
- task/research/audit reports = detailed evidence and metrics;
- `ACTIVE_TASKS.json` = machine-readable current task index.

Do not duplicate full evidence tables into several canonical files.

## Scope control

Do not opportunistically add unrelated improvements. Record discovered issues, classify severity, decide whether they block the active task, and schedule non-blocking work separately.

## Handoffs

Every meaningful worker session ends with enough information for the next role to act without re-discovering the work:
- Task ID
- Role
- Status/readiness state
- Verified starting state
- Work completed
- Decisions made (if authorized)
- Files updated
- Tests/evidence actually produced
- Open findings
- Blocking issues
- Recommended next role
- Exact next action
- Checkpoint / SHA

If a detailed task/research/audit report already contains the evidence, the handoff should link/refer to it rather than duplicate the entire report.

If no checkpoint was verified, state `Checkpoint / SHA: Not verified in this session`.

## Manager activation output

Whenever Manager determines or reports next work, end with `ACTIVATE NOW` covering:
- Manager: `ACTIVE` or `IDLE`;
- Builder: `ACTIVE — WR-###` or `IDLE`;
- R&D: `ACTIVE — WR-###` or `IDLE`;
- Auditor: `ACTIVE — WR-###` or `IDLE/BLOCKED`.

For a newly activated specialist, provide:
- `CHAT:` role name;
- `TASK:` WR ID;
- `ACTIVATION MESSAGE:` short paste-ready instruction.

Do not re-emit activation prompts for workers already executing the same task unless the user needs them again.
