# War Room Roadmap

Status: MAINTENANCE / STABLE — BOUNDED DISCOVERY ACTIVE
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
- Roadmap Discovery — COMPLETE; project placed into MAINTENANCE / STABLE
- Ranking Accuracy & Automated Ingestion Feasibility — R&D COMPLETE; current Top-20 FantasyPros PPR baseline retained

## Current project mode
### MAINTENANCE / STABLE

No active production milestone is assigned. Legitimate maintenance triggers may activate bounded R&D/audit without automatically reopening production development.

## Active maintenance discovery
### PW-001 — Layout Efficiency Discovery — IN PROGRESS
Production implementation authorization: **NONE**

#### WR-012 — Layout Efficiency & Information Architecture R&D
Assigned role: R&D
Status: ACTIVE
Starting SHA: `8df161ba8c5413b0cc3c11f87041c4ad80046dc0`
Task: `.ai/manager/WR-012.md`
Purpose: research evidence-backed layout/information hierarchy improvements for live draft use.

#### WR-013 — Current Layout Efficiency & Usability Baseline Audit
Assigned role: Independent Auditor / QA
Status: COMPLETE
Task: `.ai/manager/WR-013.md`
Evidence: `.ai/auditor/LAYOUT_AUDIT.md`

Auditor summary:
- no CRITICAL/HIGH layout defect proven
- strongest MEDIUM concerns: touch-target size, desktop/tablet sticky vertical budget, low-frequency/destructive control competition, and 769–900px responsive stress
- several current layout strengths should be preserved

Manager layout decision has a HARD DEPENDENCY on WR-012 completion plus the already-complete WR-013 evidence.

## Queued maintenance discovery
### WR-014 — Advanced Metrics Ranking Model Feasibility — QUEUED / NOT ACTIVE
Assigned role: R&D
Task: `.ai/manager/WR-014.md`
Production implementation authorization: **NONE**

Trigger:
The user proposed building a War Room-owned ranking model from underlying football statistics/advanced metrics rather than relying solely on expert consensus.

Research direction when activated:
- assess open/licensable data sources and restricted sources separately
- define position-specific predictive features and modeling targets
- compare open-data-only, hybrid, and full-replacement ranking architectures
- design leakage-safe historical validation against the current Top-20 PPR ECR baseline
- require material predictive lift before changing ranking authority
- preserve explainability, seasonal refresh safety, and fail-closed behavior

Preliminary source constraint:
- do not assume PFF can be used to train or derive a production ranking model; current PFF terms materially restrict model development/derived-data use without separate rights
- open/licensable sources such as nflverse/ffverse are the preferred starting point for feasibility research

Dependency status:
- WR-014 is INDEPENDENT of the layout topic
- WR-014 has a HARD resource dependency on WR-012 because the project currently has one R&D role
- WR-014 should activate only after WR-012 completes and Manager confirms priority

## Ranking authority remains unchanged
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP market timing only
- WR-D001 remains ACTIVE

No advanced-metrics model, source, weighting, algorithm, or production architecture is approved yet.

## Deferred trigger-driven opportunities
- ESPN Configuration Preflight / Settings Validation
- Recommendation Calibration Program
- Opponent-Aware Next-Turn Intelligence
- League-Aware Draft Profiles
- FantasyPros ranking automation after its evidence gates
- WR-014 advanced-metrics ranking model research after WR-012

## Existing maintenance observations
Non-blocking:
- legacy `AGENTS.md` process wording
- diagnostics capture-source wording
- unresolved synthetic-navigation actor identity at WR-002 evidence ceiling

## Parallelism status
PARALLEL WORK WAVE: **PW-001** remains active for layout evidence only.

Current roles:
- Manager: ACTIVE for trigger evaluation/canonical reconciliation, then IDLE
- Builder: IDLE
- R&D: ACTIVE — WR-012
- Auditor: IDLE — WR-013 complete

WR-014 is QUEUED, not an additional active parallel assignment. Do not assign Builder work from either layout or ranking-model discovery without a separate Manager production decision.