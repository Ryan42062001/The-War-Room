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

Load broader roadmap/history only when needed. Use Full Refresh from `.ai/shared/WORKFLOW.md` for new tasks, architecture/roadmap decisions, research/strategy dispositions that change the plan, merges/releases, conflicts, and materially stale checkpoints.

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

## Chat rollover
Prefer a fresh worker chat per meaningful task. Manager chats may span a milestone but should roll over at milestone boundaries or sooner when long context causes slowdown, stale-state confusion, or loops. Replacement chats recover from repository state rather than copied chat history.

## Work mode
Manager classifies new tasks as `STANDARD_CHAT`, `WORK_MODE_PREFERRED`, or `WORK_MODE_HIGH_VALUE`. Work mode is an accelerator, not a default dependency. Any Work-preferred task must include a normal-chat fallback when the needed capability exists outside Work mode.

## Anti-loop escalation
After roughly three materially different failed hypotheses without new evidence or progress, stop speculative iteration and return a `STALLED / ESCALATION REQUIRED` handoff. Manager may instantiate the temporary Troubleshooting & Root Cause Engineer with a fresh evidence packet.

`AGENTS.md` remains useful technical/history context, but `.ai/shared/*` and `.ai/roles/*` are authoritative for current coordination.

Do not start meaningful work without an assigned WR Task ID.

Workflow helpers:
- `node scripts/workflow-preflight.mjs --task WR-###`
- `node scripts/workflow-finish-check.mjs --task WR-###`
