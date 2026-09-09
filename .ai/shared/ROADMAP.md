# War Room Roadmap

Status: ACTIVE DEVELOPMENT — PW-003 PHONE UX + HISTORICAL RANKING R&D
Last updated: 2026-09-09
Owner: Manager / Architect

## Completed production milestone
### Draft-Day Layout Efficiency — COMPLETE
- WR-016 COMPLETE / MERGED via PR #114
- WR-019 independent audit: PASS WITH NON-BLOCKING FINDINGS
- merge commit: `dfe5476883d700b9281fb57f1c710daa7758492a`

## Completed ranking R&D
### WR-018 — Open-Data Shadow Ranking Model Experiment
Status: COMPLETE / ACCEPTED / MERGED
Manager classification: `MORE EVIDENCE NEEDED`

### WR-021 — Context-Enriched Preseason Shadow Model Validation
Status: COMPLETE / ACCEPTED / MERGED
Manager classification: `PROMISING — CONTINUE VALIDATION` / RESEARCH ONLY

Key result:
- returning-player context Ridge improved historical confirmatory MAE by 7.89%
- pooled repeated-player-aware uncertainty favorable
- pooled Spearman improved
- rookie Ridge model did not validate
- 2022–2025 are not pristine project-level holdouts
- clean 2026 snapshot frozen for 523 players

### WR-023 — 2026 Prospective Shadow Evaluation Protocol Freeze
Status: COMPLETE / ACCEPTED / MERGED
Authoritative protocol SHA-256: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`
Authoritative WR-021 snapshot SHA-256: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`

The frozen 2026 protocol remains untouched. Final Week 18 prospective validation is still required before any production ranking-model milestone may be considered.

## Active Parallel Work Wave
### PW-003 — Phone UX + Historical Ranking Signal Research
Status: ACTIVE
Task: `.ai/manager/PW-003.md`

Two new user-driven requirements are independent and may proceed in parallel.

### WR-025 — Historical Ranking Signal / Breakout-Bust Research
Role: R&D
Status: ACTIVE
Production authorization: NONE
Task: `.ai/manager/WR-025.md`

Goal:
- determine which preseason-known historical statistics/context are stable positive ranking signals;
- determine which are stable warning/downside signals;
- build a research-only historical ranking prototype;
- distinguish performance-under-expectation from true draft-cost busts unless a lawful historical draft-cost benchmark is found.

Guardrails:
- rights-clean data only;
- chronological evaluation;
- no causal overclaiming;
- no 2026 outcome inspection;
- WR-021 snapshot / WR-023 protocol unchanged;
- no production ranking changes.

### WR-026 — Phone-Only Decision View Optimization
Role: Builder
Status: ACTIVE
Production authorization: YES — phone UI/layout only
Task: `.ai/manager/WR-026.md`
Independent audit required: YES

Goal:
- replace the phone experience's one-big-list feeling with a decision-first mobile board;
- show one primary position context at a time with quick switching;
- keep actionable choices near the top;
- preserve full-list access and all existing draft actions;
- leave desktop/tablet >600px visually and behaviorally unchanged.

Required validation:
- deterministic phone tests at 320x700, 375x812, 390x844, 430x932;
- breakpoint/desktop regression checks including 768x1024, 820x900, 900x900, 1280x800, 1440x900;
- full CI;
- independent Auditor review before merge.

## Ranking authority remains unchanged
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP timing only
- WR-D001 remains ACTIVE

WR-025 is historical research and does not supersede the frozen WR-023 prospective contract.

## Integration path
- WR-025 research result -> Manager review/disposition.
- WR-026 Builder PR -> final reconciliation/green CI -> Independent Auditor -> Manager merge decision.
- These paths are independent.

## Current roles
- Manager: IDLE after assignment
- Builder: ACTIVE — WR-026
- R&D: ACTIVE — WR-025
- Auditor: IDLE / waiting for WR-026 final PR
