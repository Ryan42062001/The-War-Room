# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-018
Role: Research & Development (R&D)
Status: ASSIGNED — ACTIVE
Parallel Work Wave: PW-002

## Previous task closure
WR-014 — Advanced Metrics Ranking Model Feasibility is COMPLETE.

- outcome: `R&D ONLY / MORE EVIDENCE NEEDED`
- evidence: `.ai/research/ADVANCED_METRICS_RANKING_DISCOVERY.md`
- research PR #113 final head: `84615936573f3ff10165ac0f884019a255c53fbf`
- exact-head War Room CI #768 / run `34301913499`: SUCCESS
- PR #113 merged as `c976deeca8619f30ca38db4fdb01bb7c02bd83b3`
- Manager WR-017 accepted the evidence
- WR-D001 remains ACTIVE and unchanged

## Current assignment
Task: Open-Data Shadow Ranking Model Experiment
Manager task spec: `.ai/manager/WR-018.md`
Production ranking/model implementation authorization: NONE

Refresh current canonical `main` before branching and record the exact assignment-start SHA.

## Objective
Empirically test whether a rights-conservative War Room-owned projection/value model has enough leakage-safe predictive signal to justify continued validation, while remaining completely disconnected from production rankings.

## Required experiment
- QB/RB/WR/TE only
- build source/license manifest before conclusions
- use only clearly permitted/open inputs
- construct point-in-time rolling-origin historical features
- no target-season Week 1+ leakage
- compare transparent naive/statistical baseline, regularized position-specific model, and a higher-capacity challenger if justified
- evaluate Full-PPR per-game error, rank quality, top-N behavior, season/availability error where defensible, and uncertainty/calibration
- freeze a compact 2026 preseason shadow prediction snapshot if a prospectively clean freeze is still possible
- preserve missing injury/rookie/context limitations honestly rather than reconstructing them with hindsight

## Source guardrails
Do NOT use:
- PFF data, grades, Derived Data, screenshots, transcription, exports, or API data
- systematic NFL Next Gen Stats / NFL Pro input without explicit rights
- FantasyPros API/historical benchmark data unless rights for that exact benchmarking use are established
- any paid/private source with unclear terms

Technical accessibility is not permission.

## Required outputs
Produce:
- `.ai/research/SHADOW_RANKING_EXPERIMENT.md`
- `.ai/research/SHADOW_RANKING_SOURCE_MANIFEST.md`
- reproducible research-only experiment code/config as appropriate
- compact metrics/results
- frozen 2026 shadow snapshot if cleanly feasible
- updated `.ai/research/HANDOFF.md`

Do not commit large raw datasets when versioned/reproducible references are sufficient or redistribution rights are unclear.

## Required result classification
Return one:
- `PROMISING — CONTINUE VALIDATION`
- `MORE EVIDENCE NEEDED`
- `DO NOT PURSUE`

A promising result still does NOT authorize production ranking changes.

## Parallel independence
Builder continues WR-016 layout implementation under PW-002.

WR-018 vs WR-016: INDEPENDENT.
Do not inspect or modify Builder production UI work.
Do not modify canonical `.ai/shared/*`.

## Exact next action
Execute WR-018 exactly as specified in `.ai/manager/WR-018.md`. Build the rights-clean point-in-time experiment and return empirical evidence to Manager. Do not promote any model into production.