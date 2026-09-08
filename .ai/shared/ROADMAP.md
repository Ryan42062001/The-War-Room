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
- Top-20 Experts PPR ECR is primary, broader ECR is controlled fallback
- ESPN rank/ADP used for timing/market pressure
- 717-player canonical universe established
- zero canonical duplicates in validation baseline
- authoritative board rebuild before saved-state restoration
- SHA-256 source/runtime baseline validation requires explicit acceptance for ranking-source changes

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

### Ranking Accuracy & Automated Ingestion Feasibility — R&D COMPLETE

WR-010 evidence:
- PR #111 merged as `ce2ab0b75fd88549fb8def0509de4b801faa0e1c`
- R&D outcome: **R&D ONLY / MORE EVIDENCE NEEDED**
- strongest future source hypothesis: rolling three-year Top-10 FantasyPros Draft Accuracy cohort using the selected experts' current PPR consensus
- current production decision: retain the existing validated Top-20 FantasyPros PPR ECR baseline
- official FantasyPros API: technically capable of filtered PPR consensus ingestion
- direct browser-side API integration: rejected due credential exposure
- preferred future technical direction: maintainer/local staged fetch with fail-closed validation, explicit promotion, and last-known-good fallback
- provider compatibility for this draft-assistant use: NOT VERIFIED
- material accuracy lift over current Top-20 baseline: UNPROVEN

Manager WR-011 disposition:
- accepted R&D evidence
- did not promote a production milestone
- did not change ranking authority
- did not authorize API integration
- returned the project to normal MAINTENANCE / STABLE with explicit evidence gates

## Current project mode

### MAINTENANCE / STABLE

No active production milestone or specialist task is assigned.

The ranking-automation opportunity remains a trigger-driven future path, not an active roadmap commitment.

## Ranking-automation reactivation gates

A future ranking-ingestion task may be reconsidered when there is new evidence satisfying one or more of these gates:

1. **Provider compatibility** — written/provider-supported clarification that the intended private/personal War Room draft-assistant use and storage/display model is permitted.
2. **Live API completeness** — credential-safe non-production test demonstrates complete fresh PPR data for the intended expert cohort under the intended access tier.
3. **Material ranking lift** — lawful independent/held-out evidence shows rolling Top-5/Top-10 or another strategy materially improves on the current Top-20 PPR baseline, or the user explicitly values freshness automation enough to retain the current cohort policy while automating refresh.
4. **Production promotion** — if gates justify implementation, Manager creates a separate production WR task; independent Auditor validation is required because ranking authority affects scoring/recommendations.

These gates are not active assignments. No API key should be pasted into chat or committed to the repository.

## General maintenance reactivation triggers

Active development may also be reconsidered when one or more of the canonical triggers becomes real and sufficiently important:
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

## Existing maintenance observations

Non-blocking:
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