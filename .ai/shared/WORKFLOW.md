# War Room Team Workflow

Status: ACTIVE — WORKFLOW V3
Last updated: 2026-09-11
Owner: Manager / Architect

This file is the canonical repository workflow for **The War Room**, the live fantasy-football **draft assistant**. If older repository guidance conflicts with this file, this file wins unless the Manager records a newer approved change.

## Project identity boundary

Do not confuse this repository with the user's other projects:
- **The War Room** = live fantasy draft assistant.
- **The Chip Winner** = in-season fantasy helper.
- **Family Finance Hub** = personal-finance website/application.
- **ECOG website** = church website.

Work, strategy, research, and roadmap decisions in this repository must stay scoped to the draft-assistant product unless an explicit cross-project task says otherwise.

## Core operating model

The repository is durable memory. Roles are durable. Individual ChatGPT conversations are disposable execution sessions.

**ROLE = DURABLE**  
**CHAT = DISPOSABLE**  
**TASK = UNIT OF WORK**  
**REPOSITORY = MEMORY**  
**MANAGER = ROUTER / INTEGRATOR**

The permanent role set is intentionally small:

1. **Manager / Architect** — roadmap, requirements, architecture, priorities, task decomposition, acceptance criteria, execution-mode recommendation, integration decisions, merge authority, canonical shared state.
2. **Implementation Engineer / Builder** — production implementation, normal debugging, tests, technical execution, remediation.
3. **Draft Strategy & Decision Intelligence Analyst** — draft-decision policy: value vs need, positional scarcity, tiers, survival-to-next-pick, turn dynamics, roster construction, QB/TE timing, FLEX implications, league/slot effects, and whether recommendations make strategic fantasy-football sense.
4. **Research & Development (R&D)** — external APIs/docs/data, source rights, projection/model research, technical uncertainty, isolated experiments/proofs of concept, future architecture evaluation, and evidence-backed milestone proposals.
5. **Independent Auditor / QA** — independent verification, regression analysis, recommendation-behavior review, real/mock draft validation, PASS/FAIL decisions.
6. **Work Helper / Super Troubleshooter / Cross-Functional Operator** — privileged cross-role diagnosis and Manager-scoped remediation for difficult blockers that cross normal employee boundaries or resist routine debugging/research.

The previous temporary **Troubleshooting & Root Cause Engineer** is superseded. `.ai/roles/TROUBLESHOOTING.md` remains only as a compatibility redirect; new troubleshooting work routes to Work Helper.

Permanent role charters live under `.ai/roles/`. R&D continues to use `.ai/research/` for compatibility. Draft Strategy uses `.ai/strategy/`. Work Helper uses `.ai/work_helper/`.

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
- applicable role charter under `.ai/roles/`
- `.ai/work_helper/HANDOFF.md` and relevant `.ai/work_helper/WR-###_DIAGNOSIS.md` when Work Helper is involved.

Repository state overrides stale chat memory. Conflicts must be surfaced, not silently reconciled.

`ACTIVE_TASKS.json` does not replace task specs or evidence reports. It is the current control-plane index. Only the Manager updates `.ai/shared/*` unless a Manager-approved workflow task explicitly says otherwise.

## Context budget and refresh modes

Workers should load the **minimum sufficient context** first and expand only when the task requires it. Do not reread the entire repository history on every `continue`.

### Fast Refresh
Use for routine status checks, ordinary `continue`, task-scoped worker startup, low-risk task resumption, and checking whether a worker finished.

Read/verify first:
1. actual `main` SHA;
2. `.ai/shared/ACTIVE_TASKS.json`;
3. your role charter;
4. your active task spec;
5. latest relevant role handoff;
6. open PR/current branch state when relevant;
7. contradictions or unexpected target advancement.

Only fetch additional roadmap/decision/research history if the current task actually needs it.

### Full Refresh
Required before:
- creating/activating a new meaningful task;
- architecture or roadmap decisions;
- durable product decisions;
- Manager disposition of research/strategy that changes the next milestone;
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
10. applicable role charter(s);
11. branch/checkpoint and target advancement.

## Chat lifecycle and context hygiene

Worker chats should normally be **task-scoped**.

Preferred lifecycle:
1. Manager assigns WR task.
2. User opens a fresh chat for the required role when practical.
3. Fresh chat reads the role charter + minimum sufficient repository context.
4. Worker executes the task and persists a concise handoff/evidence.
5. Chat may be retired after task completion.

The same worker chat may continue for small remediation on the exact same task/PR when it remains fast and focused. A new chat is preferred if the prior chat becomes slow, confused, repetitive, or burdened by unrelated history.

Manager chats may span a milestone, but should normally roll over at milestone/phase boundaries or earlier when context size begins affecting speed or state accuracy.

### Rollover triggers
A chat should be replaced when any of these become material:
- noticeable response/UI slowdown associated with conversation size;
- repeated confusion between old and current tasks;
- stale-state mistakes despite repository refresh;
- excessive old logs/diffs dominating context;
- repeated restatement without new evidence;
- troubleshooting loops;
- milestone boundary with a complete repository handoff.

Replacement chats must not require the user to copy old conversation history. They bootstrap from the repository.

## Task IDs and lifecycle

Every meaningful work item uses a unique `WR-###` Task ID. Parallel coordination uses `PW-###` and does not replace underlying WR IDs.

Task specs should define, as relevant:
- TASK ID
- OWNER / ROLE
- OBJECTIVE
- WHY IT IS NEEDED
- VERIFIED STARTING STATE
- DEPENDENCY CLASSIFICATION
- EXECUTION MODE RECOMMENDATION
- REQUIRED BEHAVIOR
- LIKELY FILES / COMPONENTS
- NON-GOALS
- EDGE CASES
- TEST REQUIREMENTS
- VALIDATION LEVEL
- ACCEPTANCE CRITERIA
- EXPECTED HANDOFF

Do not mix unrelated work under one Task ID.

### Workflow V3 lifecycle states

Current task state is indexed in `ACTIVE_TASKS.json` using:
- `PLANNED` — approved future work, not yet assignable;
- `BLOCKED` — approved but waiting on an explicit dependency/gate;
- `ASSIGNED` — activated by Manager, worker not yet confirmed in progress;
- `IN_PROGRESS` — worker is executing;
- `MANAGER_REVIEW_READY` — research/strategy/architecture evidence is complete for Manager disposition;
- `AUDIT_READY` — production work is complete enough for independent Auditor;
- `MERGE_READY` — required audit/review gates have passed and Manager may merge;
- `REWORK_REQUIRED` — a blocking finding or integration issue must be remediated;
- `MERGED` — PR/integration merged, final reconciliation not necessarily complete;
- `CLOSED` — Manager has reconciled canonical state and the task is complete.

Workers report readiness in their role handoff/PR. They do not independently change the Manager-owned registry state.

Backward compatibility: existing task documents may use older labels. Manager maps them to this lifecycle during reconciliation.

## Work Mode / execution-mode acceleration

For every newly created meaningful task, the Manager should assess whether **ChatGPT Work mode** would materially accelerate execution.

The purpose is speed and convenience, not dependency on credits.

Use one of these classifications:

### `STANDARD_CHAT`
Normal chat/repository tools are sufficient. Work mode is unlikely to materially improve throughput.

Typical examples:
- strategy analysis;
- focused code review;
- policy/architecture reasoning;
- narrow research;
- small isolated patches.

### `WORK_MODE_PREFERRED`
Work mode is likely to save meaningful time because the task benefits from sustained multi-step execution, extensive repository navigation, repeated file edits, browser interaction, artifact gathering, or coordinated validation.

Typical examples:
- broad multi-file implementation;
- substantial refactors with repeated test/debug cycles;
- large repository inspections;
- browser-heavy integration investigation;
- gathering and organizing many artifacts/evidence items;
- multi-step CI/PR validation;
- deep Work Helper reconstruction spanning multiple layers.

### `WORK_MODE_HIGH_VALUE`
Work mode is expected to provide a major acceleration because the task is long-running, highly interactive, or requires many sequential tool/browser steps.

This classification is a recommendation, **not a blocker**.

### Fallback rule
Every `WORK_MODE_PREFERRED` or `WORK_MODE_HIGH_VALUE` task must remain executable without Work mode whenever the underlying capabilities exist in normal chat.

The task spec or activation message must include a fallback path such as:
- exact repository files to inspect/change;
- expected patches or commands;
- tests to run;
- evidence to return;
- smaller sequential substeps if needed.

If Work credits are exhausted or Work mode is unavailable:
- do not mark the whole project blocked merely because the preferred accelerator is unavailable;
- switch to normal Chat Implementation / reasoning / research mode;
- continue with exact patches, commands, or user-returned outputs;
- only block the specific step if it truly requires a capability unavailable outside Work mode.

Manager should surface the recommendation in `ACTIVATE NOW` as:

`EXECUTION MODE: STANDARD_CHAT | WORK_MODE_PREFERRED | WORK_MODE_HIGH_VALUE`

and, when Work mode is preferred, also include:

`FALLBACK: <concise non-Work execution path>`

## Evidence hierarchy

Prefer evidence in this order:
1. actual repository contents;
2. actual test/runtime output;
3. verified branch/commit information;
4. current authoritative external documentation/data/licensing;
5. explicit approved project decisions;
6. specialist handoffs/reports;
7. chat summaries;
8. assumptions.

Never present an assumption as verified fact.

## Work routing and authority

Use **Draft Strategy** when the unresolved question is what the draft assistant SHOULD recommend or how draft-state context should affect decisions, including:
- value versus need;
- VORP/replacement-value interpretation;
- positional scarcity/tier cliffs;
- survival-to-next-pick;
- turn dynamics;
- roster construction/FLEX implications;
- QB/TE timing;
- league size/scoring/slot effects;
- opponent positional runs;
- recommendation-policy coherence.

Use **R&D** when external facts/data/source rights, feasibility, projection/model research, algorithms, APIs, unknown behavior, or bounded experimentation materially reduces uncertainty.

Use **Builder** after objective, scope, architecture/dependencies, and acceptance criteria are sufficiently settled; Builder also owns routine production debugging.

Use **Independent Auditor** for production changes affecting recommendation logic, draft state, live sync, persistence/restoration, ranking/datasets, high-risk shared code, core workflows, or milestone completion.

Use **Work Helper** when:
- a worker has stalled after multiple materially different attempts;
- root cause crosses normal role boundaries;
- repository/task/branch/PR/CI evidence conflicts;
- a hidden dependency is suspected;
- repeated remediation is not converging;
- routine Builder/R&D diagnosis cannot isolate the problem;
- the Manager needs an independent cross-functional technical reconstruction;
- a workflow/infrastructure/repository-state problem would be inefficient to bounce among several narrow roles.

Manager may activate Work Helper earlier when the problem is already clearly cross-layer or unusually complex; the three-attempt threshold is an escalation guardrail for normal workers, not a prerequisite for every Work Helper assignment.

Draft Strategy and R&D are advisory. Their findings do not automatically become product requirements or production authority. Manager approves final architecture/roadmap/strategy changes.

R&D may not:
- select the final roadmap;
- modify production without an approved implementation assignment;
- modify `.ai/shared/*`;
- merge production work;
- audit its own production implementation.

Draft Strategy may not:
- write production code under a strategy-only task;
- change canonical ranking authority on its own;
- modify `.ai/shared/*`;
- merge production work;
- self-certify production correctness.

## Work Helper privilege and governance contract

Work Helper is a privileged technical operator, not a second Manager.

### Broad inspection authority
When assigned, Work Helper may read/inspect essentially the entire repository and relevant project evidence, including production code/tests, CI/workflows, branches/commits/PRs, specialist work, Manager tasks/state, generated evidence, integrations, research tooling, and relevant external technical evidence.

Role-folder boundaries are not read barriers for legitimate Work Helper troubleshooting.

### Default write authority
Work Helper may freely write:
- `.ai/work_helper/**`;
- Manager-approved diagnostic/test branches and temporary diagnostic artifacts.

Any write elsewhere requires the **current Manager-approved Work Helper task** to explicitly authorize the path/category. Authorized scope may include production code, tests, workflows/CI, research tooling, integrations, or recovery/remediation changes when needed.

### Governance boundaries
Work Helper may not independently:
- change roadmap or durable product/model decisions;
- create/reassign tasks as final authority;
- change production ranking authority;
- rewrite Manager-owned canonical state without explicit authorization;
- bypass frozen research/provenance/outcome-contamination restrictions;
- weaken prospective evidence standards;
- redefine Draft Strategy policy;
- approve its own production implementation;
- issue an Independent Auditor PASS on work it materially changed;
- merge production/milestone work unless Manager explicitly delegates the action under the canonical merge gate.

If Work Helper materially changes an audit-required target, a separate Independent Auditor must verify the resulting target.

### Assignment modes
Every Work Helper task should identify one mode:
- `DIAGNOSIS ONLY`;
- `DIAGNOSIS + REMEDIATION`;
- `CROSS-ROLE RECOVERY`;
- `WORKFLOW / CI TROUBLESHOOTING`;
- another explicitly bounded super-troubleshooter mode.

### Required activation contract
Manager must provide:
- TASK;
- ASSIGNMENT MODE;
- PROBLEM / BLOCKER;
- TARGET repo/branch/PR/SHA when applicable;
- AUTHORIZED READ SCOPE;
- AUTHORIZED WRITE SCOPE;
- EXECUTION MODE;
- REQUIRED EVIDENCE;
- GOVERNANCE BOUNDARIES;
- EXPECTED HANDOFF.

## Anti-loop rule

Normal roles must stop unproductive loops.

If approximately **three materially different approaches/hypotheses** fail without meaningful progress or new evidence:
1. STOP speculative iteration.
2. Do not repeat the same conclusion with different wording.
3. Persist a concise `STALLED / ESCALATION REQUIRED` handoff.
4. State what is known, what was tried, results, what evidence is missing, and who should act next.
5. Recommend Work Helper when the blocker is suitable for privileged cross-functional troubleshooting.

For Engineering/debugging, create or update a troubleshooting evidence packet containing:
- Task ID;
- exact symptom;
- expected behavior;
- observed behavior;
- reproduction steps;
- relevant logs/errors;
- current branch/SHA;
- hypotheses tested;
- changes attempted;
- observed result of each attempt;
- suspected components/layers;
- unresolved questions.

Manager may then activate a **fresh Work Helper / Super Troubleshooter** task with explicit read/write scope and assignment mode.

### Work Helper exemption — NO FIXED ATTEMPT LIMIT
Work Helper is explicitly exempt from the approximately-three-attempt threshold.

There is **no fixed numerical ceiling** on Work Helper diagnostic/remediation attempts.

Work Helper may continue while:
- each attempt is evidence-driven or materially advances understanding;
- the same failed action is not mindlessly repeated;
- task/write scope and repository safety are respected;
- meaningful findings/failed paths are recorded;
- destructive or irreversible actions remain governed by normal approval rules.

If many approaches fail, Work Helper should progressively widen the investigation and document what has been ruled out rather than terminating because an arbitrary count was reached.

This exemption does not authorize endless repetition, scope-free experiments, destructive guessing, frozen-evidence violations, or governance bypass.

## Persistent Work Helper memory

`.ai/work_helper/HANDOFF.md` is the current operational checkpoint.

`.ai/work_helper/TROUBLESHOOTING_LOG.md` stores only high-value durable knowledge such as root-cause patterns, approaches worth avoiding, CI/infrastructure quirks, cross-role dependency failures, evidence/provenance pitfalls, and reusable diagnostic techniques.

Do not turn the log into a transcript of every command.

Substantial investigations may create `.ai/work_helper/WR-###_DIAGNOSIS.md` or equivalent task-specific reports.

## Maintenance / stable mode

No worker must be kept busy merely for utilization. `IDLE` is valid, including Work Helper.

Development may reactivate for verified defects, real-world feedback, changed dependencies, explicit product requirements, materially valuable opportunities, seasonal/data updates, or previously unresolved risks becoming actionable. A trigger does not by itself authorize implementation.

## Parallel work

Parallelism is preferred when tasks are genuinely independent and integration remains clear.

Dependency classes:
- `INDEPENDENT` — may run simultaneously;
- `SOFT DEPENDENCY` — may run simultaneously but one result can influence later integration;
- `HARD DEPENDENCY` — must run sequentially.

When two or more roles run independently, Manager may create a `PW-###` wave recording task, role, objective, dependency, work area, expected output, execution-mode recommendation, and integration considerations.

Parallel workers must:
- use dedicated task branches for production work;
- minimize overlapping files;
- preserve starting/checkpoint information;
- avoid independent `.ai/shared/*` edits;
- check target advancement before readiness/merge.

Do not force every task through every role. Manager chooses the shortest valid path.

Examples:
- CSS/layout defect: Manager -> Builder -> Auditor when needed.
- New ranking philosophy: Manager -> Draft Strategy + R&D -> Manager synthesis -> Builder -> Auditor.
- Research-only question: Manager -> R&D -> Manager.
- Strategy-only question: Manager -> Draft Strategy -> Manager.
- persistent cross-layer defect: Manager -> Work Helper -> appropriate owner/remediation -> Auditor when required.

## Target-branch advancement classification

Do not treat every `main` advance as equally risky.

### `CURRENT`
Target did not advance materially from the relevant checkpoint.

### `CONTROL_PLANE_ONLY`
Target changes are confined to `.ai/**` and workflow-control scripts such as `scripts/workflow-*.mjs`, with no task-surface overlap.

Effect:
- do not force expensive product revalidation solely because of these changes;
- existing runtime/visual evidence remains usable if task code is unchanged;
- normal final CI/Manager merge checks still apply.

### `NON_OVERLAPPING`
Target includes product/tooling changes outside the control plane, but no changed file or tightly coupled surface overlaps the task.

Effect:
- reconcile before final release when practical;
- rerun affected integration/smoke checks and final CI;
- Manager may decide full expensive revalidation is unnecessary when evidence shows no coupling.

### `OVERLAPPING_RISK`
Target changed the same files or a tightly coupled behavior/architecture used by the task.

Effect:
- reconcile before audit/merge;
- rerun materially affected validation levels;
- unresolved overlap blocks release readiness.

File-level overlap is a first-pass heuristic, not proof of independence.

## Workflow helper scripts

Two read-only helpers reduce repeated manual checking:
- `node scripts/workflow-preflight.mjs --task WR-###`
- `node scripts/workflow-finish-check.mjs --task WR-###`

Optional flags:
- `--target <ref>` to override the default `origin/main`/`main` target;
- `--json` for machine-readable output;
- finish check: `--pr-body <path>` to validate required PR metadata headings.

These scripts may check registry status, branch/target diff, target-advance classification, frozen/forbidden paths, allowlisted research scope, handoff presence, and PR-template structure. They do **not** prove tests or CI ran and do not replace Manager/Auditor judgment.

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

Prefer one dedicated branch per implementation task. Auditor remediation normally stays on the same branch/PR unless context-hygiene rollover justifies a fresh chat continuing the same branch/task.

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

Work Helper remediation does not waive the merge gate or audit requirement.

## Atomic Manager reconciliation

Manager should minimize control-plane churn.

For one decision/transition, prepare required canonical updates and commit them as **one reconciliation transaction** whenever tooling permits. Avoid separate canonical commits for task spec, project state, registry, roadmap and handoff when they are one logical decision. Task-branch work may contain multiple preparation commits when the final integration is squash/atomic.

After a merge or major disposition, update only what actually changed:
- `ACTIVE_TASKS.json` for lifecycle/dependency/next-gate changes;
- `PROJECT_STATE.md` for current state;
- `ROADMAP.md` only when roadmap/milestone status changed;
- `DECISIONS.md` only for durable architectural/product decisions;
- Manager handoff for the current checkpoint/next action;
- relevant task status.

Workflow mechanics belong in `WORKFLOW.md` and role charters; do not create a product/model decision merely to document workflow mechanics.

A merged PR does not by itself prove milestone completion.

## Canonical-document scope

Keep control-plane files concise:
- `PROJECT_STATE.md` = current baseline, active tasks, blockers, next gates;
- `ROADMAP.md` = milestones/phase plan and material dispositions, not every metric;
- `DECISIONS.md` = durable product/architecture decisions only;
- task/research/strategy/audit/work-helper reports = detailed evidence and diagnostics;
- `ACTIVE_TASKS.json` = machine-readable current task index.

Do not duplicate full evidence tables into several canonical files.

## Handoffs: concise pointers, not encyclopedias

Every meaningful worker session ends with enough information for the next role to act without rediscovering the task:
- Task ID
- Role
- Status/readiness state
- Verified starting state
- concise work/result summary
- files/artifacts updated
- tests/evidence actually produced
- open findings
- blocking issues
- recommended next role
- exact next action
- checkpoint/SHA

Detailed evidence belongs in the task report, research report, strategy analysis, audit report, Work Helper diagnosis, PR description, or test artifact. The handoff should point to that evidence rather than copy it wholesale.

If no checkpoint was verified, state `Checkpoint / SHA: Not verified in this session`.

## Manager activation output

Whenever Manager determines or reports next work, end with `ACTIVATE NOW` covering:
- Manager: `ACTIVE` or `IDLE`;
- Builder: `ACTIVE — WR-###` or `IDLE`;
- Draft Strategy: `ACTIVE — WR-###` or `IDLE`;
- R&D: `ACTIVE — WR-###` or `IDLE`;
- Auditor: `ACTIVE — WR-###` or `IDLE/BLOCKED`;
- Work Helper: `ACTIVE — WR-###` or `IDLE`.

For every newly activated specialist, provide:
- `CHAT:` role name;
- `TASK:` WR ID;
- `EXECUTION MODE:` `STANDARD_CHAT`, `WORK_MODE_PREFERRED`, or `WORK_MODE_HIGH_VALUE`;
- `ACTIVATION MESSAGE:` short paste-ready instruction;
- `FALLBACK:` when Work mode is preferred/high-value, a concise normal-chat path if Work credits are unavailable.

For newly activated Work Helper also provide:
- `ASSIGNMENT MODE:`;
- `PROBLEM / BLOCKER:`;
- `TARGET / CHECKPOINT:`;
- `AUTHORIZED READ SCOPE:`;
- `AUTHORIZED WRITE SCOPE:`;
- `REQUIRED EVIDENCE:`;
- `GOVERNANCE BOUNDARIES:`;
- `EXPECTED HANDOFF:`.

Do not re-emit activation prompts for workers already executing the same task unless the user needs them again.

## Worker bootstrap pattern

Fresh chats should not receive giant duplicated workflow prompts. Give them a short identity/bootstrap message that points them at the repository role charter.

Typical pattern:

`You are the <role> for The War Room. Repository: Ryan42062001/The-War-Room. Treat the repository as authoritative. Read .ai/shared/WORKFLOW.md, your .ai/roles/<ROLE>.md charter, .ai/shared/ACTIVE_TASKS.json, your current task spec, and the relevant role handoff. Execute only the assigned task; if none exists, remain IDLE.`

For Work Helper, `<ROLE>` is `WORK_HELPER` and the relevant role handoff is `.ai/work_helper/HANDOFF.md`.

## Workflow principle

Use the smallest permanent team that preserves meaningful separation of responsibilities. Work Helper is the permanent privileged troubleshooting role but should remain IDLE unless a real blocker merits cross-functional intervention. Prefer fresh task-scoped chats over indefinitely growing conversations. Preserve independent audit and Manager integration authority. Use Work mode when it materially accelerates execution, but never make ordinary progress depend on available Work credits when a normal-chat fallback exists.
