# War Room AI Team Workspace

This repository is **The War Room**, the live fantasy-football draft assistant.

Project identity boundary:
- The War Room = draft assistant
- The Chip Winner = in-season fantasy helper
- Family Finance Hub = finance website/application
- ECOG website = church website

## Operating model

The repository is the durable memory. Roles are durable. Individual ChatGPT conversations are disposable task sessions.

**ROLE = DURABLE · CHAT = DISPOSABLE · TASK = UNIT OF WORK · REPOSITORY = MEMORY**

The permanent War Room role set is intentionally small:
- Manager / Architect
- Implementation Engineer / Builder
- Draft Strategy & Decision Intelligence Analyst
- Research & Development (R&D)
- Independent Auditor / QA

Temporary specialists, including Troubleshooting & Root Cause Engineer, are instantiated only when a real task requires them.

## Fast Refresh
For routine status/continue checks and fresh task-scoped worker startup, begin with:
1. current `main` SHA;
2. `.ai/shared/ACTIVE_TASKS.json`;
3. applicable `.ai/roles/<ROLE>.md` charter;
4. current task spec;
5. relevant role handoff;
6. open PR/current branch when relevant.

Load broader roadmap/history only when Fast Refresh cannot establish authoritative state. `FAST_REFRESH` is the default even for new tasks and most merges. `FULL_REFRESH` requires a recorded reason such as genuine control-plane ambiguity/contradiction, major workflow/control-plane reconciliation, milestone/integration risk, or an audit whose evidence cannot be established narrowly.

## Canonical sources
- `.ai/shared/ACTIVE_TASKS.json` — current task/dependency/status index
- `.ai/shared/PROJECT_STATE.md` — concise current project state
- `.ai/shared/ROADMAP.md` — milestone/phase plan
- `.ai/shared/DECISIONS.md` — durable decisions
- `.ai/shared/WORKFLOW.md` — canonical workflow rules
- `.ai/manager/HANDOFF.md` — current Manager checkpoint
- `.ai/roles/` — permanent role charters
- active `.ai/manager/WR-###.md` task spec
- latest relevant role handoff

Role workspaces:
- `.ai/manager/` — Manager / Architect
- `.ai/builder/` — Implementation Engineer / Builder
- `.ai/strategy/` — Draft Strategy & Decision Intelligence
- `.ai/research/` — Research & Development
- `.ai/auditor/` — Independent Auditor / QA

R&D intentionally keeps `.ai/research/` for compatibility.

## Chat reuse
Do not require a fresh chat merely because the task ID changed. Reuse a current same-role chat for closely related sequential work when context remains useful and no independence requirement applies. Fresh chats remain mandatory for independent audits and appropriate when role separation, bias risk, or stale/confused context makes reuse unsafe.

## Execution mode
There are exactly two task modes: `STANDARD_CHAT_HIGH` (default) and `WORK_MODE` (execution-heavy accelerator). Work mode requires material autonomous-execution benefit. If unavailable, continue the established task in Standard Chat High when feasible rather than restarting.

## Anti-loop escalation
After roughly three materially different failed hypotheses without new evidence or progress, stop speculative iteration and return a `STALLED / ESCALATION REQUIRED` handoff. Manager may instantiate the temporary Troubleshooting & Root Cause Engineer with a fresh evidence packet.

`AGENTS.md` remains useful technical/history context, but `.ai/shared/*` and `.ai/roles/*` are authoritative for current coordination.

Do not start meaningful work without an assigned WR Task ID.

Workflow helpers:
- `node scripts/workflow-preflight.mjs --task WR-###`
- `node scripts/workflow-finish-check.mjs --task WR-###`
