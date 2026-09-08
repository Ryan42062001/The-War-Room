# War Room Roadmap

Status: MAINTENANCE / STABLE
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

### Ranking / dataset authority — COMPLETE baseline
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
- WR-001 established canonical `.ai/shared/*` state/workflow
- WR-004 added safe parallel orchestration
- WR-006 expanded Research into Research & Development (R&D)
- WR-008 established project maturity / MAINTENANCE-STABLE governance

### ESPN Live Sync reliability / live-validation closeout — COMPLETE
- observability and forensic timeline
- layered source handling and live-proven Pick History DOM fallback
- authoritative off-board ESPN pick correctness
- trust-focused user-facing sync states
- popup intrinsic-width regression fix
- synthetic navigation provenance V1–V3
- responsive tablet overflow fix
- WR-003 completion-state consistency
- WR-002 required Level-4 validation

### Roadmap Discovery — Next Milestone Selection — COMPLETE
- WR-007 evaluated serious successor candidates
- R&D recommended MAINTENANCE / STABLE
- Manager WR-009 accepted maintenance/stable
- no speculative successor production milestone was created

## Current project mode

### MAINTENANCE / STABLE

No active production milestone is assigned.

A legitimate maintenance trigger may activate bounded investigation without reopening production development automatically.

## Active maintenance-trigger investigation

### WR-010 — Ranking Accuracy & Automated Ingestion Feasibility — IN PROGRESS

Assigned role: Research & Development (R&D)
Starting SHA: `2cab85f981e06f5f19bd4a7631a28adf2f7ff351`
Task spec: `.ai/manager/WR-010.md`
Production implementation authorization: **NONE**

Trigger:
The user asked whether the War Room can identify the most accurate publicly available rankings and automatically pull them into the app. This is a materially valuable opportunity and possible seasonal/data-refresh improvement.

Research objectives:
- identify the strongest historical preseason ranking source/cohort for the War Room's PPR use case
- compare single expert vs top-N accurate-expert consensus vs weighted approaches vs current broad PPR ECR
- account explicitly for the fact that FantasyPros Draft Accuracy is measured in Half-PPR while the War Room uses PPR
- evaluate the official FantasyPros API and any other supported machine-readable routes
- separate technical feasibility from access/license permission
- design a fail-closed ingestion/validation/rollback approach without implementing it
- determine whether any proposed change is materially better than the current ranking baseline

Expected outcomes:
- READY FOR MANAGER MILESTONE CONSIDERATION
- R&D ONLY / MORE EVIDENCE NEEDED
- DO NOT PURSUE

Only Manager may promote WR-010 into a production milestone after evidence review.

## Maintenance reactivation triggers

Active development may be reconsidered when one or more of the following becomes real and sufficiently important:
- verified defects
- real-world user feedback
- changed external dependencies
- new product requirements
- materially valuable opportunities
- seasonal/data updates
- previously unresolved risks becoming actionable

Triggers do not automatically authorize implementation.

## Closest future milestone candidates retained from WR-007

These remain proposals, not active roadmap commitments:
1. ESPN Configuration Preflight / Settings Validation
2. Recommendation Calibration Program
3. Opponent-Aware Next-Turn Intelligence
4. League-Aware Draft Profiles

WR-010 is a new trigger-driven ranking/data investigation and does not promote any of those proposals.

## Existing maintenance observations

Non-blocking:
- legacy `AGENTS.md` process wording
- diagnostics capture-source wording when DOM is the actual ledger-eligible source
- unresolved synthetic-navigation actor identity at the WR-002 evidence ceiling

## Parallelism status

No Parallel Work Wave is active.

Current roles:
- Manager: IDLE after assignment / awaiting evidence
- Builder: IDLE
- R&D: ACTIVE — WR-010
- Auditor: IDLE

Dependency classification:
- WR-010 is INDEPENDENT
- no second legitimate approved specialist task exists

Do not create parallel work until at least two legitimate independently executable approved tasks exist.
