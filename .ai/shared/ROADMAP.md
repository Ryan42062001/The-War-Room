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

## Current milestone

### Roadmap Discovery — Next Milestone Selection — IN PROGRESS

Purpose:
Determine the strongest legitimate next War Room milestone before authorizing another production implementation wave.

Active task:
- **WR-007 — Roadmap Discovery: Next Milestone Candidate Evaluation**
- assigned role: Research & Development (R&D)
- starting SHA: `3e5cffb86c3ab6c55803d4f0f6a8a07218b81e0f`
- task spec: `.ai/manager/WR-007.md`

Required discovery output:
- 3–5 serious milestone candidates grounded in repository/product evidence
- explicit ranking criteria covering user value, reliability/correctness impact, evidence strength, feasibility, complexity, dependency/integration risk, and validation burden
- one recommended milestone and at least one credible runner-up
- a bounded Manager-ready outline for the recommended milestone, including likely task decomposition, role routing, validation levels, non-goals, and potential safe parallelism
- rejected/deferred ideas with reasons

Production implementation authorization: **NONE** during WR-007.

R&D may inspect the repository, use external research where useful, and run isolated/disposable non-production experiments if they materially reduce uncertainty. R&D may not modify production code, canonical `.ai/shared/*` state, select the final roadmap, or begin implementation of a candidate.

Completion gate:
1. R&D completes WR-007 and writes its role-owned evidence/handoff.
2. Manager independently reviews the strongest claims and candidate ranking.
3. Manager selects, rejects, or requests refinement of the proposed next milestone.
4. Only after Manager selection may production implementation or audit tasks be assigned.

## Next production milestone

**Not yet selected.**

The next production milestone will be chosen after WR-007 Roadmap Discovery completes. Existing non-blocking observations such as legacy `AGENTS.md` wording, diagnostics capture-source wording, and unresolved synthetic-navigation actor identity are inputs, not automatic priorities.

## Parallelism status

No Parallel Work Wave is active.

Dependency classification:
- WR-007 vs Builder work: INDEPENDENT in principle, but no approved Builder task exists
- WR-007 vs Auditor work: INDEPENDENT in principle, but no approved Auditor task exists

Only one legitimate specialist assignment exists, so Builder and Auditor remain IDLE. Do not invent parallel work merely to populate a wave.
