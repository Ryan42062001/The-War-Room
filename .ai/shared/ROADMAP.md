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

Closeout evidence:
- WR-003: COMPLETE / Auditor PASS / merged `c5648122710d0720a59d8a8a79944b7ddf5b1d5a`
- WR-002: COMPLETE / Level 4 VERIFIED / PASS / no blocking findings

### Roadmap Discovery — Next Milestone Selection — COMPLETE

WR-007 R&D evidence:
- PR #110 merged as `276daacdfa506bf62ccab26deabf3a36af21ba0e`
- four serious candidates evaluated against user value, reliability leverage, demonstrated need, feasibility, architecture fit, boundedness, delivery safety, and validation tractability
- R&D recommendation: MAINTENANCE / STABLE

Manager WR-009 disposition:
- independently reviewed the R&D evidence and spot-checked the repository claims driving the recommendation
- accepted MAINTENANCE / STABLE
- no successor production milestone selected
- no production implementation authorized

## Current project mode

### MAINTENANCE / STABLE

No active production milestone is assigned.

The project should remain stable rather than create features merely to maintain development activity. Builder, R&D, and Auditor may remain idle until a legitimate trigger justifies new work.

## Reactivation triggers

Active development may be reconsidered when one or more of the following becomes real and sufficiently important:
- verified defects
- real-world user feedback
- changed external dependencies
- new product requirements
- materially valuable opportunities
- seasonal/data updates
- previously unresolved risks becoming actionable

Triggers do not automatically authorize implementation. Manager must define the scope, Task ID, evidence requirements, dependencies, architecture, validation levels, and parallelism plan first.

## Closest future milestone candidates

These are preserved proposals, not active roadmap commitments:

1. **ESPN Configuration Preflight / Settings Validation**
   - Revisit on a real configuration mismatch or a live-proven stable independent ESPN settings source.
2. **Recommendation Calibration Program**
   - Revisit when enough independent completed-draft outcomes exist or a repeatable recommendation defect is observed.
3. **Opponent-Aware Next-Turn Intelligence**
   - Revisit on user-reported wait/draft errors or a suitable real/mock held-out calibration corpus.
4. **League-Aware Draft Profiles**
   - Revisit on an explicit Standard / Half-PPR / Superflex / keeper / salary-cap / alternate-format requirement.

## Existing maintenance observations

The following remain non-blocking and do not themselves justify active development:
- legacy `AGENTS.md` process wording
- diagnostics capture-source wording when DOM is the actual ledger-eligible source
- unresolved synthetic-navigation actor identity at the WR-002 evidence ceiling

## Parallelism status

No Parallel Work Wave is active.

Current roles:
- Manager: IDLE except for trigger evaluation / canonical reconciliation when needed
- Builder: IDLE
- R&D: IDLE
- Auditor: IDLE

Do not create parallel work until at least two legitimate independently executable approved tasks exist.
