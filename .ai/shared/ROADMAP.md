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

### ESPN Live Sync reliability work — MOSTLY COMPLETE, CLOSEOUT IN PROGRESS

Merged historical work includes:

- observability and forensic timeline
- off-board ESPN pick correctness
- trust-focused user-facing sync states
- popup intrinsic-width regression fix
- synthetic navigation provenance V1–V3
- responsive tablet document-overflow fix

## Active milestone: ESPN Live Sync reliability / live-validation closeout

### WR-001 — Repository Operating Contract Bootstrap

Status: IN PROGRESS
Owner: Manager / Architect
Goal: establish canonical `.ai/` state/workflow and remove conflicting legacy process guidance.
Completion gate:
- canonical shared files exist
- Manager handoff exists
- `AGENTS.md` defers to canonical `.ai/` project-management files
- current open/pending work has Task IDs

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

Status: IMPLEMENTATION PR OPEN / AUDIT REQUIRED
Implementation PR: #108
Next role after Manager normalization: Independent Auditor / QA
Goal: ensure a complete authoritative numbered-pick ledger remains terminal completion authority after Rescan / false UI heartbeat scenarios.
Required validation:
- Level 1 diff review
- Level 2 automated regression
- Level 3 deterministic state scenario
- Level 4 only if Auditor determines browser/live behavior remains materially uncertain
Merge gate:
- branch freshness verified
- scope matches WR-003
- independent audit returns PASS or PASS WITH NON-BLOCKING FINDINGS

## Next milestone after live-sync closeout

Do not start a broad new feature wave until WR-002 and WR-003 are closed and the Manager records ESPN Live Sync milestone completion.

Candidate future work should be created as new WR tasks only after prioritization against draft-day reliability.
