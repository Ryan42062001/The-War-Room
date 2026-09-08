# War Room Roadmap

Status: ACTIVE
Last updated: 2026-09-07
Owner: Manager / Architect

## Project priority

Draft-day reliability over feature count:

- recommendations remain trustworthy
- drafted players never reappear available
- state is not silently lost or corrupted
- ESPN failures recover safely
- persistence is robust
- app remains fast and mobile-friendly
- regressions are caught before release
- `main` remains deployable

## Completed foundations

### Ranking / dataset authority — COMPLETE

- FantasyPros 2026 PPR ECR established as value/ranking authority
- ESPN rank/ADP used for timing/market pressure
- 717-player canonical universe established
- zero canonical duplicates in validation baseline
- authoritative board rebuild before saved-state restoration

### Draft-state / persistence hardening — COMPLETE

- state invariants and deterministic draft simulations
- corruption recovery / backup restore / quota and failure handling
- offline and reconnect resilience
- stale ESPN snapshot monotonicity protections

### Recommendation / scoring correctness — COMPLETE baseline

- canonical scoring/recommendation modules
- known scoring corrections integrated into required production path
- fail-closed bootstrap when canonical implementations are absent

### Repository operating contract — COMPLETE

- WR-001 merged through PR #109
- canonical `.ai/shared/*` state, roadmap, decisions, and workflow established
- Manager / Builder / Research / Auditor handoff locations established
- active work mapped to WR Task IDs
- legacy `AGENTS.md` retained as technical/history context, with `.ai/shared/*` explicitly canonical for project management

### ESPN Live Sync reliability work — CLOSEOUT IN PROGRESS

Merged historical work includes:

- observability and forensic timeline
- off-board ESPN pick correctness
- trust-focused user-facing sync states
- popup intrinsic-width regression fix
- synthetic navigation provenance V1–V3
- responsive tablet document-overflow fix
- WR-003 completion-state consistency

## Active milestone: ESPN Live Sync reliability / live-validation closeout

Milestone status: IN PROGRESS

### WR-002 — ESPN Synthetic Navigation Attribution Level 4

Status: PENDING LIVE VALIDATION
Next role: Independent Auditor / QA
Goal: reproduce one automatic Players → Pick History → Players transition on merged provenance V3 and capture the strongest defensible sanitized caller class.
Required validation: Level 4
Completion gate:
- current main/extension loaded
- one automatic transition captured without manual Pick History activation
- diagnostics record caller class/script/function/hash when available
- result documented without overclaiming attribution

### WR-003 — ESPN Completion-State Consistency

Status: COMPLETE
Implementation PR: #108
Audit verdict: PASS
Merge SHA: `c5648122710d0720a59d8a8a79944b7ddf5b1d5a`
Result:
- complete unique configured numbered-pick ledger is terminal completion authority
- false post-completion UI heartbeat cannot demote completion
- completion counters remain terminal
- reset/session and incomplete-draft semantics remain preserved
- no permission expansion or unrelated production change
Validation:
- Level 1 PASS
- Level 2 PASS
- Level 3 PASS
- Level 4 not required for WR-003 by independent audit

## Milestone completion rule

The ESPN Live Sync reliability / live-validation closeout milestone is **not yet complete** because WR-002 remains open at required Level 4 validation.

Do not start a broad new feature wave merely to keep the workflow active. Close WR-002 first, then the Manager should decide whether this milestone is complete based on the resulting evidence.

## Next milestone

Not assigned. No new feature milestone should be invented until the active closeout milestone is resolved and the Manager records the outcome.
