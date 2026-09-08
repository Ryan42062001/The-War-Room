# War Room Team Workflow

Status: ACTIVE
Last updated: 2026-09-08
Owner: Manager / Architect

This file is the canonical repository workflow for the Fantasy Draft War Room. If older repository guidance conflicts with this file, this file wins unless the Manager explicitly records a newer approved change.

## Team roles

1. **Manager / Architect** — roadmap, requirements, architecture, priorities, task decomposition, acceptance criteria, integration decisions, merge authority, canonical shared state.
2. **Implementation Engineer** — production implementation, debugging, tests, technical execution, remediation.
3. **Research / Investigation Specialist** — external APIs, documentation, feasibility, technical uncertainty, difficult investigations.
4. **Independent Auditor / QA** — independent verification, regression analysis, real/mock draft validation, PASS/FAIL decisions.

## Canonical project files

Read these before relying on chat history:

- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/shared/DECISIONS.md`
- `.ai/shared/WORKFLOW.md`
- `.ai/manager/HANDOFF.md`
- the latest relevant role handoff

Repository state overrides stale conversational memory. Conflicts must be surfaced, not silently reconciled.

## Task IDs

Every meaningful work item uses a unique ID such as `WR-001`.

Each active task should define:

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

## Evidence hierarchy

Prefer evidence in this order:

1. actual repository contents
2. actual test/runtime output
3. verified branch/commit information
4. current authoritative external documentation
5. explicit approved project decisions
6. chat summaries
7. assumptions

Never present an assumption as verified fact.

## Session refresh

When resuming project work:

1. read canonical shared files
2. read Manager handoff
3. read the latest relevant role handoff
4. identify the active WR Task ID
5. verify branch/checkpoint when tools permit
6. identify contradictions between repository and conversation state

## Work routing

Use **Research** when external facts or undocumented system behavior materially block architecture or implementation.

Use **Implementation Engineer** only after objective, scope, architecture, dependencies, and acceptance criteria are sufficiently settled.

Use **Independent Auditor / QA** for changes affecting recommendation logic, draft state, live synchronization, persistence/restoration, ranking/dataset behavior, high-risk shared code, core workflows, or milestone completion.

Research findings do not automatically become architecture. The Manager decides architecture after evaluating evidence.

## Parallel task orchestration

Parallelism is encouraged when it increases useful throughput without creating unsafe dependencies or integration ambiguity. Do not unnecessarily serialize independent work, and do not create speculative work merely to keep workers busy.

Whenever the Manager determines what should happen next, explicitly evaluate whether multiple approved tasks can proceed simultaneously.

A task may run in parallel when all of the following are true:

- it does not depend on the unfinished result of another active task
- workers will not make conflicting changes to the same production area
- shared canonical state does not need to change independently in multiple branches
- each task has its own Task ID and acceptance criteria
- each worker can produce independently verifiable evidence
- integration order is manageable

Do not parallelize when any of the following apply:

- Builder needs Research findings before implementation can be designed
- Auditor needs Builder implementation before an audit can begin
- two tasks modify the same tightly coupled state or files and would create unsafe integration conflicts
- one task materially changes the architecture assumed by another
- completion of one task may make the other unnecessary
- a milestone decision must occur before downstream work is valid

### Dependency classification

For every group of candidate tasks, the Manager classifies dependencies as:

- **INDEPENDENT** — may run simultaneously
- **SOFT DEPENDENCY** — may run simultaneously, but one result may influence later integration
- **HARD DEPENDENCY** — must run sequentially

Prefer parallel execution for INDEPENDENT tasks.

### Parallel Work Waves

When two or more roles can work independently, the Manager creates a Parallel Work Wave using sequential IDs such as:

- `PW-001`
- `PW-002`
- `PW-003`

Each wave must record for every active assignment:

- Task ID
- assigned role
- objective
- dependency status
- branch / work area
- expected output
- merge / integration considerations

A Parallel Work Wave coordinates execution only; it does not replace the underlying WR Task IDs or acceptance criteria.

### Parallel PR safety

When several employees work simultaneously:

- give each production task its own branch
- minimize overlapping files
- track each task's starting SHA
- require workers to check target-branch advancement before completion
- merge in a deliberate order
- rerun affected tests after meaningful integration changes
- do not let parallel workers independently update canonical `.ai/shared/*` state

The Manager remains the normal authority for canonical shared-state reconciliation after integration.

### Workload priority

Optimize for maximum useful throughput, not maximum worker utilization.

Multiple workers doing genuinely independent useful work is desirable. Workers doing unnecessary speculative work merely because they are available is not. `IDLE` is a valid and desirable state when no useful independent work exists.

## Parallel activation plan

Every Manager response that determines or reports next work ends with an `ACTIVATE NOW` section covering all four roles:

- Manager: `ACTIVE` or `IDLE`
- Builder: `ACTIVE — WR-###` or `IDLE`
- Research: `ACTIVE — WR-###` or `IDLE`
- Auditor: `ACTIVE — WR-###` or `IDLE`

For every active specialist, include:

- `CHAT:` role name
- `TASK:` WR Task ID
- `ACTIVATION MESSAGE:` an exact short message the user can paste into that employee chat

Activation messages should normally be concise because each role must refresh from repository state before acting.

Do not activate a role solely to keep it busy. If a task is blocked on user evidence or another prerequisite, state that explicitly rather than assigning unrelated work.

## Validation levels

- **Level 1 — Static correctness:** code inspection and logic review.
- **Level 2 — Automated tests:** unit, regression, integration tests.
- **Level 3 — Simulated draft behavior:** controlled draft-state scenarios.
- **Level 4 — Real/mock draft validation:** actual or realistic draft environment.

A lower level does not prove a higher level. Live draft synchronization and dynamic recommendation behavior may require Level 4 before milestone completion.

## Pull request protocol

For PR-based work, require:

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

Prefer one dedicated branch per implementation task. Auditor remediation normally stays on the same task branch/PR.

## Merge gate

Before merging a production-code PR, the Manager must verify:

1. approved Task ID and target branch
2. current branch/checkpoint and staleness relative to target
3. scope matches the approved task
4. required tests actually ran
5. unresolved findings and conflicts
6. whether independent audit is required
7. CRITICAL/HIGH findings are resolved
8. required handoff/evidence is present

Production-code changes requiring audit need `PASS` or `PASS WITH NON-BLOCKING FINDINGS` before merge.

If the target branch advanced after the worker checkpoint, evaluate overlap and rerun affected validation after update/rebase/merge when necessary.

## After merge

After a successful merge, the Manager updates:

1. `.ai/shared/PROJECT_STATE.md`
2. `.ai/shared/ROADMAP.md` if milestone status changed
3. `.ai/shared/DECISIONS.md` only for durable decisions
4. `.ai/manager/HANDOFF.md`
5. task status and next role/action

A merged PR does not by itself prove milestone completion.

## Scope control

Do not opportunistically add unrelated improvements. Record newly discovered issues, classify severity, decide whether they block the active task, and schedule non-blocking work separately.

## Handoff format

Every meaningful work session ends with:

- Task ID
- Role
- Status
- Verified starting state
- Current milestone
- Work completed
- Decisions made
- Files updated
- Open findings
- Blocking issues
- Recommended next role
- Exact next action
- Checkpoint / SHA

If no checkpoint was verified, state `Checkpoint / SHA: Not verified in this session`.
