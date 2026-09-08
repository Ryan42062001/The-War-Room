# War Room Roadmap

Status: ACTIVE
Last updated: 2026-09-08
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
- Manager / Builder / R&D / Auditor handoff locations established
- active work mapped to WR Task IDs
- WR-004 added safe parallel orchestration and activation-plan rules
- WR-006 expanded Research / Investigation into Research & Development (R&D) while retaining `.ai/research/` as the role directory

### ESPN Live Sync reliability / live-validation closeout — COMPLETE

Completed work includes:

- observability and forensic timeline
- layered source handling and live-proven Pick History DOM fallback
- authoritative off-board ESPN pick correctness
- trust-focused user-facing sync states
- popup intrinsic-width regression fix
- synthetic navigation provenance V1–V3
- responsive tablet document-overflow fix
- WR-003 completion-state consistency
- WR-002 required Level-4 synthetic-navigation attribution validation

Closeout evidence:
- WR-003: COMPLETE / Auditor PASS / merged as `c5648122710d0720a59d8a8a79944b7ddf5b1d5a`
- WR-002: COMPLETE / Level 4 VERIFIED / PASS / no blocking findings
- WR-002 live sync checkpoint: Captured/Applied/Unmatched `5/5/0`, ACK lag `0`, no missing picks, no conflicts
- strongest defensible navigation attribution: `other-programmatic / caller=unknown / hash=174uabd`
- actor identity is not attributed beyond the available sanitized evidence

The ESPN Live Sync reliability / live-validation closeout milestone is now **COMPLETE**.

## Current milestone

**None assigned.**

No open roadmap milestone remains after the ESPN Live Sync closeout.

## Next milestone

**Not assigned.**

The roadmap does not currently contain a legitimate successor milestone. The Manager must not invent feature work merely to keep employees active.

Before activating Builder, R&D, or Auditor again, the Manager/user should identify a real project need and define a new WR Task ID or milestone with objective, scope, acceptance criteria, and evidence requirements.

R&D may support Roadmap Discovery through an explicit Manager-assigned task when evidence-backed exploration would help identify the next legitimate milestone. The expanded R&D capability does not itself create an assignment.

Existing non-blocking observations such as legacy `AGENTS.md` wording, diagnostics capture-source wording, and unresolved synthetic-navigation actor identity do not automatically become the next milestone.

## Parallelism status

No Parallel Work Wave is active.

There are currently no approved independent specialist tasks to run concurrently. All specialist roles may remain IDLE until a legitimate next milestone/task is selected.
