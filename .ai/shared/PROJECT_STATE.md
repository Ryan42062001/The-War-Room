# War Room Project State

Status: MAINTENANCE / STABLE — BOUNDED DISCOVERY ACTIVE
Last verified: 2026-09-08
Owner: Manager / Architect

## Canonical repository
Repository: `Ryan42062001/The-War-Room`
Branch: `main`

Latest production merge remains:
- WR-003 / PR #108: `c5648122710d0720a59d8a8a79944b7ddf5b1d5a`

No production behavior has changed during PW-001 or WR-014 queueing.

## Project mode
### MAINTENANCE / STABLE — ACTIVE

No production milestone is active and no production implementation is currently authorized.

Two legitimate maintenance-trigger opportunities are being handled without speculative production work:
1. active layout-efficiency discovery (PW-001)
2. queued advanced-metrics ranking-model R&D (WR-014)

## PW-001 — Layout Efficiency Discovery
Status: ACTIVE
Starting SHA: `8df161ba8c5413b0cc3c11f87041c4ad80046dc0`
Production implementation authorized: NO

### WR-012 — Layout Efficiency & Information Architecture R&D
Role: R&D
Status: ACTIVE
Task: `.ai/manager/WR-012.md`
Expected evidence: `.ai/research/LAYOUT_EFFICIENCY_DISCOVERY.md`

### WR-013 — Current Layout Efficiency & Usability Baseline Audit
Role: Independent Auditor / QA
Status: COMPLETE
Task: `.ai/manager/WR-013.md`
Evidence: `.ai/auditor/LAYOUT_AUDIT.md`
Independent first-pass artifact commit: `40a6b7c5a4b67bdcb506234cc09d7e11fe9534e7`
Final Auditor handoff checkpoint: `692ccf52aebb67ea48e06b4105725a6c621ff2e3`

Auditor result:
- no CRITICAL/HIGH layout defect proven
- MEDIUM concerns: frequent sub-30px controls, desktop/tablet sticky vertical budget, low-frequency/destructive controls competing with live draft controls, and the 769–900px responsive band
- current strengths to preserve include Position Tiers default, one-action board switching, mobile containment, command-bar urgency states, and broad responsive overflow coverage

Manager UI synthesis remains blocked on WR-012 completion. Builder remains IDLE.

## WR-014 — Advanced Metrics Ranking Model Feasibility
Role: R&D
Status: QUEUED — NOT ACTIVE
Task: `.ai/manager/WR-014.md`
Queue-time main: `692ccf52aebb67ea48e06b4105725a6c621ff2e3`
Production implementation authorized: NO

Trigger:
The user proposed building a War Room-owned ranking model from underlying football statistics/advanced metrics instead of relying solely on FantasyPros expert consensus.

Manager preliminary classification:
- materially valuable differentiated-product opportunity
- much larger ranking-authority change than WR-010
- suitable for R&D only until data rights, predictive value, validation design, and integration risk are established

Manager preliminary external evidence:
- PFF's current terms restrict PFF data and derived data to personal/non-public use and expressly prohibit use of PFF data/derived data to train or develop statistical/predictive models; PFF is therefore not an acceptable assumed production model input without separate explicit rights
- nflverse publishes openly accessible play-by-play/player-stat data and related analytics tooling, with core data repositories using CC BY 4.0
- nflverse/ffverse expose player stats, snap counts, advanced stats, Next Gen Stats mirrors, fantasy player IDs, expected-fantasy-points/opportunity tooling, and other potentially useful feature families
- NFL Next Gen Stats/NFL Pro makes extensive advanced performance metrics publicly viewable to subscribers, but machine-readable production-use rights must be separately verified before assuming ingestion

WR-014 product/technical dependency on PW-001: INDEPENDENT.
WR-014 resource dependency on WR-012: HARD because the project currently has one R&D role. WR-014 must not preempt or silently expand WR-012.

## Ranking authority baseline
Current production ranking/value authority remains unchanged:
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR controlled fallback
- ESPN rank/ADP market timing only
- 717-player canonical universe remains the validated baseline
- WR-D001 remains ACTIVE

WR-010/WR-011 remain complete; FantasyPros API automation is still gated on provider compatibility, live completeness, and material-value evidence.

## Task state
- WR-001 — COMPLETE
- WR-002 — COMPLETE / PASS
- WR-003 — COMPLETE / PASS / MERGED
- WR-004 — COMPLETE
- WR-005 — COMPLETE
- WR-006 — COMPLETE
- WR-007 — COMPLETE
- WR-008 — COMPLETE
- WR-009 — COMPLETE
- WR-010 — COMPLETE / R&D ONLY-MORE EVIDENCE NEEDED
- WR-011 — COMPLETE
- WR-012 — ACTIVE / R&D
- WR-013 — COMPLETE / Auditor
- WR-014 — QUEUED / R&D, NOT ACTIVE

## Open non-blocking findings
1. Legacy `AGENTS.md` process wording remains non-blocking; canonical `.ai/shared/*` wins.
2. Diagnostics can over-emphasize network capture when Pick History DOM is actual ledger-eligible authority.
3. Synthetic-navigation actor identity remains unknown at the WR-002 evidence ceiling.
4. Ranking automation remains technically promising but gated.
5. An internal advanced-metrics ranking model is promising enough for R&D, but no source/model/architecture is approved and PFF should not be assumed usable.

## Current workload / parallelism
Active specialist task:
- R&D — WR-012

Completed specialist task awaiting synthesis:
- Auditor — WR-013

Queued specialist task:
- R&D — WR-014 after WR-012

Idle:
- Builder — IDLE
- Auditor — IDLE after WR-013 completion

Dependency classification:
- WR-012 vs WR-013 evidence: originally INDEPENDENT; WR-013 is complete
- Manager PW-001 synthesis: HARD dependency on WR-012 completion
- WR-014 vs PW-001: INDEPENDENT product/technical scope, HARD R&D-resource dependency on WR-012

Parallel Work Wave PW-001 remains active only for layout discovery. Do not create Builder production work from WR-014 until separate Manager review after R&D evidence.