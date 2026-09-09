# War Room Roadmap

Status: ACTIVE DEVELOPMENT — BOUNDED LAYOUT MILESTONE + PARALLEL R&D
Last updated: 2026-09-08
Owner: Manager / Architect

## Project priority
Draft-day reliability, trustworthy recommendations, and decision efficiency over feature count.

## Completed foundations
- Ranking / dataset authority baseline — COMPLETE
- Draft-state / persistence hardening — COMPLETE
- Recommendation / scoring correctness — COMPLETE baseline
- Repository operating contract — COMPLETE
- ESPN Live Sync reliability / live-validation closeout — COMPLETE
- Roadmap Discovery — COMPLETE; project placed into MAINTENANCE / STABLE until justified triggers
- Ranking Accuracy & Automated Ingestion Feasibility — R&D COMPLETE; current Top-20 FantasyPros PPR baseline retained
- PW-001 Layout Efficiency Discovery — COMPLETE

## PW-001 evidence outcome
### WR-012 — Layout Efficiency & Information Architecture R&D — COMPLETE
Research PR #112 merged as `e46ae94bc592d73560eb88258046acce19d3c0c6`.

R&D found:
- broad redesign not justified
- preserve Position Tiers and command-state model
- highest-value opportunities: coordinated persistent decision surface, progressive disclosure of maintenance/destructive controls, Draft Setup collapse after initialization/progress
- runtime geometry/focus measurements required before implementation

### WR-013 — Current Layout Efficiency & Usability Baseline Audit — COMPLETE
Independent audit found no CRITICAL/HIGH layout defect, but MEDIUM concerns around:
- frequent compact interaction targets
- persistent desktop/tablet vertical budget
- low-frequency/destructive controls competing with live-draft controls
- 769–900px responsive stress

### WR-015 — Manager synthesis — COMPLETE
Manager accepted the convergence and approved a bounded production milestone while rejecting a broad redesign.

## Current production milestone
### Draft-Day Layout Efficiency — IN PROGRESS

#### WR-016 — Draft-Day Layout Efficiency Implementation
Assigned role: Implementation Engineer
Status: ACTIVE
Task: `.ai/manager/WR-016.md`
Parallel wave: PW-002

Approved scope:
- deterministic pre-change geometry/focus baseline
- coordinated persistent live-draft hierarchy
- progressive disclosure for low-frequency maintenance/destructive controls
- Draft Setup summary + Edit after valid initialization/meaningful progress
- target ergonomics hardening
- explicit 769–900px plus representative mobile/desktop validation

Preserve:
- Position Tiers default
- Overall view
- Waiting/Near/On-the-Clock semantics
- recommendations/scoring/ranking authority
- Taken/Mine semantics
- My Draft behavior
- session/persistence semantics
- ESPN sync/recovery behavior
- current zero-horizontal-overflow protections

Release gate:
Independent Auditor / QA must validate the WR-016 production PR before Manager merge.

## Active parallel R&D
### WR-014 — Advanced Metrics Ranking Model Feasibility — IN PROGRESS
Assigned role: R&D
Task: `.ai/manager/WR-014.md`
Parallel wave: PW-002
Production implementation authorization: NONE

Purpose:
Investigate whether a War Room-owned projection/value model using open/licensable underlying football data can materially outperform or complement current FantasyPros Top-20 PPR ECR.

Required research direction:
- source/licensing matrix
- position-specific predictive inputs
- Full-PPR target definition
- role/injury/rookie/team-context strategy
- transparent vs complex models
- open-data-only vs hybrid vs replacement architecture
- leakage-safe held-out validation against current ECR
- seasonal refresh/fail-closed architecture
- explainability and downstream recommendation risk

Guardrails:
- PFF must not be assumed usable for model training/derivation without separate explicit rights
- WR-D001 remains ACTIVE
- no production ranking/model change under WR-014

## Parallel Work Wave
### PW-002 — ACTIVE

TASK 1: WR-016 — Builder — production layout efficiency
Dependency status: INDEPENDENT from WR-014

TASK 2: WR-014 — R&D — advanced-metrics ranking feasibility
Dependency status: INDEPENDENT from WR-016

Downstream:
- WR-016 -> independent Auditor: HARD before production merge
- WR-014 -> Manager review: HARD before any ranking-model production milestone

## Ranking authority remains unchanged
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP market timing only
- WR-D001 remains ACTIVE

No internal advanced-metrics model, source weighting, or production architecture is approved yet.

## Deferred trigger-driven opportunities
- ESPN Configuration Preflight / Settings Validation
- Recommendation Calibration Program
- Opponent-Aware Next-Turn Intelligence
- League-Aware Draft Profiles
- FantasyPros ranking automation after its evidence gates

## Existing maintenance observations
Non-blocking:
- legacy `AGENTS.md` process wording
- diagnostics capture-source wording
- unresolved synthetic-navigation actor identity at WR-002 evidence ceiling

## Current roles
- Manager: IDLE after assignment / integration oversight
- Builder: ACTIVE — WR-016
- R&D: ACTIVE — WR-014
- Auditor: IDLE until WR-016 production PR is ready
