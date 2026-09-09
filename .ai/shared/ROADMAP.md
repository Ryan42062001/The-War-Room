# War Room Roadmap

Status: ACTIVE DEVELOPMENT — BOUNDED LAYOUT MILESTONE + PARALLEL SHADOW-MODEL R&D
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
- Roadmap Discovery — COMPLETE; maintenance maturity rules remain active
- Ranking Accuracy & Automated Ingestion Feasibility — R&D COMPLETE; current Top-20 FantasyPros PPR baseline retained
- PW-001 Layout Efficiency Discovery — COMPLETE

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

Latest Builder status observed by Manager:
- branch `wr-016-draft-day-layout-efficiency`
- observed head `2060f89a2c900349eded5e77ee8dca8448feeabe`
- no completed Builder handoff/production PR at refresh

## Advanced-metrics ranking research

### WR-014 — Advanced Metrics Ranking Model Feasibility — COMPLETE
Research PR #113 merged as `c976deeca8619f30ca38db4fdb01bb7c02bd83b3`.
Outcome: `R&D ONLY / MORE EVIDENCE NEEDED`.

Accepted findings:
- enough rights-clean open data exists to justify a non-production shadow experiment
- model should forecast football production before applying league-specific replacement value
- start with position-specific QB/RB/WR/TE models
- compare transparent baseline vs stronger challenger
- PFF excluded under current terms
- NFL Next Gen Stats excluded from initial rights-conservative experiment absent explicit rights
- current injury/availability coverage has a material post-2024 gap
- direct historical ECR benchmarking remains rights/completeness constrained

### WR-017 — Manager feasibility disposition — COMPLETE
Manager accepted WR-014, preserved WR-D001, and authorized only a bounded experimental shadow-model task.

No production ranking-model milestone was approved.

## Active parallel R&D
### WR-018 — Open-Data Shadow Ranking Model Experiment — IN PROGRESS
Assigned role: Research & Development (R&D)
Task: `.ai/manager/WR-018.md`
Parallel wave: PW-002
Production implementation authorization: NONE

Purpose:
Determine empirically whether a rights-conservative internal model has enough leakage-safe predictive signal to justify continued validation.

Required experimental direction:
- QB/RB/WR/TE only
- source/license manifest before conclusions
- point-in-time rolling-origin historical corpus
- no target-season Week 1+ leakage
- transparent naive/statistical baseline
- regularized position-specific model
- one higher-capacity challenger if justified
- evaluate PPR per-game error, rank quality, top-N behavior, availability/season error where defensible, and uncertainty/calibration
- freeze a compact 2026 preseason shadow snapshot if a prospectively clean freeze is still possible
- keep experiment completely disconnected from production ranking authority

Rights guardrails:
- no PFF
- no systematic NFL Next Gen Stats without explicit permission
- no FantasyPros historical/API benchmark unless rights for that exact use are established
- do not commit large/raw licensed datasets unnecessarily

Valid outcomes:
- `PROMISING — CONTINUE VALIDATION`
- `MORE EVIDENCE NEEDED`
- `DO NOT PURSUE`

Even a promising result does not authorize production ranking changes.

## Parallel Work Wave
### PW-002 — ACTIVE

TASK 1: WR-016 — Builder — production layout efficiency
Dependency status: INDEPENDENT from ranking R&D

TASK 2: WR-014 — R&D feasibility — COMPLETE / DISPOSITIONED

TASK 3: WR-018 — R&D shadow-model experiment — ACTIVE
Dependency status: INDEPENDENT from WR-016

Downstream:
- WR-016 -> Independent Auditor: HARD before production merge
- WR-018 -> Manager review: HARD before any further ranking-model milestone

## Ranking authority remains unchanged
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP market timing only
- WR-D001 remains ACTIVE

No internal shadow model, source weighting, or experimental prediction is production authority.

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
- injury/availability source gap for advanced-metrics modeling
- lawful contemporaneous historical ECR comparator remains unresolved

## Current roles
- Manager: IDLE after reconciliation / integration oversight
- Builder: ACTIVE — WR-016
- R&D: ACTIVE — WR-018
- Auditor: IDLE until WR-016 production PR is ready
