# War Room AI Team Workspace

Start here for coordinated project work.

## Fast Refresh
For routine status/continue checks, start with:
1. current `main` SHA;
2. `.ai/shared/ACTIVE_TASKS.json`;
3. open PRs;
4. the relevant task spec and role handoff.

Use the Full Refresh defined in `.ai/shared/WORKFLOW.md` for new tasks, architecture/roadmap decisions, research dispositions that change the plan, merges/releases, conflicts, and materially stale checkpoints.

## Canonical sources

- `.ai/shared/ACTIVE_TASKS.json` — Manager-owned machine-readable current task index
- `.ai/shared/PROJECT_STATE.md` — concise current project state
- `.ai/shared/ROADMAP.md` — milestone/phase plan and material dispositions
- `.ai/shared/DECISIONS.md` — durable architectural/product decisions
- `.ai/shared/WORKFLOW.md` — canonical team/workflow rules
- `.ai/manager/HANDOFF.md` — current Manager checkpoint and next action
- latest relevant role handoff
- active `.ai/manager/WR-###.md` task spec

Role folders:
- `.ai/manager/` — Manager / Architect
- `.ai/builder/` — Implementation Engineer / Builder
- `.ai/research/` — Research & Development (R&D)
- `.ai/auditor/` — Independent Auditor / QA

The R&D role intentionally continues to use `.ai/research/` for compatibility.

`AGENTS.md` remains useful technical/history context, but it is not the canonical roadmap, project state, workflow, or task ledger. If older process language conflicts with `.ai/shared/*`, the shared workflow/control-plane files win.

Do not start meaningful work without an assigned WR Task ID.

Workflow helpers:
- `node scripts/workflow-preflight.mjs --task WR-###`
- `node scripts/workflow-finish-check.mjs --task WR-###`
