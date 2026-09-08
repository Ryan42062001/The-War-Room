# War Room Roadmap

Status: MAINTENANCE / STABLE — BOUNDED DISCOVERY ACTIVE
Last updated: 2026-09-08
Owner: Manager / Architect

## Project priority

Draft-day reliability and decision efficiency over feature count:
- recommendations remain trustworthy
- drafted players never reappear available
- state is not silently lost or corrupted
- ESPN failures recover safely
- persistence is robust
- the app remains fast and mobile-friendly
- the user can identify the next correct draft action quickly
- regressions are caught before release
- `main` remains deployable

## Completed foundations

### Ranking / dataset authority — COMPLETE baseline
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR controlled fallback
- ESPN rank/ADP timing/market only
- 717-player canonical universe with zero canonical duplicates in baseline
- SHA-256 fail-closed baseline acceptance

### Draft-state / persistence hardening — COMPLETE
- deterministic draft invariants
- corruption/backup/restore/quota handling
- offline/reconnect resilience
- stale ESPN snapshot monotonicity protections

### Recommendation / scoring correctness — COMPLETE baseline
- canonical scoring/recommendation modules
- known corrections in required production path
- fail-closed bootstrap

### Repository operating contract — COMPLETE
- canonical `.ai/shared/*`
- safe parallel orchestration
- R&D role expansion
- MAINTENANCE / STABLE maturity governance

### ESPN Live Sync reliability / live-validation closeout — COMPLETE
- layered sync/recovery
- observability/forensics
- off-board pick correctness
- trust UX
- completion consistency
- required Level-4 validation

### Roadmap Discovery — COMPLETE
- WR-007 found no justified successor production milestone
- WR-009 placed project into MAINTENANCE / STABLE

### Ranking Accuracy & Automated Ingestion Feasibility — R&D COMPLETE
- WR-010 / PR #111 evidence accepted by Manager in WR-011
- current Top-20 PPR ranking authority retained
- automatic API integration not production-ready
- ranking automation remains gated on provider compatibility, live completeness, and material-value evidence

## Current project mode

### MAINTENANCE / STABLE

No active production milestone is assigned.

A legitimate maintenance trigger may activate bounded research/audit without automatically reopening production development.

## Active maintenance discovery

### PW-001 — Layout Efficiency Discovery — IN PROGRESS

Trigger:
The user asked whether the War Room website can be researched for the most efficient possible layout and whether there are evidence-backed improvements worth making.

Production implementation authorization: **NONE**

#### WR-012 — Layout Efficiency & Information Architecture R&D
Assigned role: Research & Development (R&D)
Starting SHA: `8df161ba8c5413b0cc3c11f87041c4ad80046dc0`
Task spec: `.ai/manager/WR-012.md`

Purpose:
- research evidence-backed high-density real-time dashboard / draft-assistant layout principles
- inspect current War Room information architecture and responsive composition
- measure/estimate scan efficiency and persistent-chrome cost where runtime evidence permits
- compare desktop/tablet/mobile needs
- identify and prioritize concrete improvement candidates
- explicitly allow a `no material change justified` outcome

#### WR-013 — Current Layout Efficiency & Usability Baseline Audit
Assigned role: Independent Auditor / QA
Starting SHA: `8df161ba8c5413b0cc3c11f87041c4ad80046dc0`
Task spec: `.ai/manager/WR-013.md`

Purpose:
- independently measure actual current-layout efficiency across representative viewports
- evaluate core draft flows, sticky viewport consumption, interaction counts, target ergonomics, overflow/crowding, and accessibility behavior
- identify areas already efficient and findings that materially slow or risk draft-day use
- avoid anchoring on WR-012's recommendations during first-pass evidence gathering

### PW-001 dependency model

WR-012 vs WR-013: **INDEPENDENT** — run simultaneously.

Manager synthesis: **HARD DEPENDENCY** on both completed evidence streams.

Builder implementation: **HARD DEPENDENCY** on Manager synthesis and a separate approved production WR task.

No UI change is authorized merely because either specialist proposes one.

## Current layout evidence already verified by Manager

- `index.html` contains a dense single-page draft command surface: header, search/filter toolbar, status/session/marking controls, tier navigation, command/recommendation/pressure information, Position Tiers/Overall boards, and My Draft.
- `style-base.css` currently stacks several sticky layers.
- `style.css` already includes an explicit Position Tiers density pass and a 1320px Position-view main surface.
- `command-bar-fixes.css` adapts command composition across desktop/tablet/mobile and wraps the status bar <=900px.
- `scripts/test-responsive-overflow.mjs` tests 13 widths from 320–1280 across both Position and Overall views for zero document horizontal overflow.

These facts justify measured optimization research; they do not themselves prove that the current layout is inefficient.

## General maintenance reactivation triggers

Active production development may be reconsidered when one or more becomes real and sufficiently important:
- verified defects
- real-world user feedback
- changed external dependencies
- new product requirements
- materially valuable opportunities
- seasonal/data updates
- previously unresolved risks becoming actionable

Triggers do not automatically authorize implementation.

## Deferred trigger-driven opportunities retained

- ESPN Configuration Preflight / Settings Validation
- Recommendation Calibration Program
- Opponent-Aware Next-Turn Intelligence
- League-Aware Draft Profiles
- Ranking automation after its evidence gates are satisfied

## Existing maintenance observations

Non-blocking:
- legacy `AGENTS.md` process wording
- diagnostics capture-source wording
- unresolved synthetic-navigation actor identity at WR-002 evidence ceiling

## Parallelism status

PARALLEL WORK WAVE: **PW-001**

Current roles:
- Manager: IDLE after assignment / awaiting evidence
- Builder: IDLE
- R&D: ACTIVE — WR-012
- Auditor: ACTIVE — WR-013

Do not assign Builder work until Manager synthesizes both discovery streams and explicitly determines that a bounded implementation is justified.
