# War Room Roadmap

Status: ACTIVE DEVELOPMENT — PW-003 PHONE UX + POSITION-SPECIFIC RISK R&D
Last updated: 2026-09-09
Owner: Manager / Architect

## Completed production milestone
### Draft-Day Layout Efficiency — COMPLETE
- WR-016 COMPLETE / MERGED via PR #114
- WR-019 independent audit: PASS WITH NON-BLOCKING FINDINGS
- merge commit: `dfe5476883d700b9281fb57f1c710daa7758492a`

## Ranking R&D history
### WR-018 — Open-Data Shadow Ranking Model Experiment
Status: COMPLETE / ACCEPTED / MERGED
Manager classification: `MORE EVIDENCE NEEDED`

### WR-021 — Context-Enriched Preseason Shadow Model Validation
Status: COMPLETE / ACCEPTED / MERGED
Manager classification: `PROMISING — CONTINUE VALIDATION` / RESEARCH ONLY

### WR-023 — 2026 Prospective Shadow Evaluation Protocol Freeze
Status: COMPLETE / ACCEPTED / MERGED
Authoritative protocol SHA-256: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`
Authoritative WR-021 snapshot SHA-256: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`

The frozen 2026 protocol remains untouched. Final Week 18 prospective validation is still required before any production ranking-model milestone may be considered.

### WR-025 — Historical Ranking Signal / Breakout-Bust Research
Status: COMPLETE / ACCEPTED / MERGED
Research PR: #118
Merge commit: `93da7e5de10ca2130d40142450cab9840c755ab4`
Manager classification: `MORE EVIDENCE NEEDED`

Key findings:
- returning Ridge mean projection improved pooled historical MAE by 6.61% with favorable player-clustered uncertainty;
- stable positive and downside-warning signal families were found in all four positions;
- downside classifiers were especially informative at RB/WR/TE;
- universal risk adjustment was not safe: WR rank MAE worsened 5.51%, TE 6.20%;
- rookie richer model remained unvalidated;
- no sufficiently broad lawful comparable historical ADP benchmark was admitted;
- no 2026 outcomes were inspected.

Manager decision:
Preserve the mean projection and continue only with position-specific risk calibration. Do not promote a universal risk penalty.

### WR-028 — Custom Ranking Engine Roadmap / Architecture Plan
Status: COMPLETE
Task: `.ai/manager/WR-028.md`

Manager established a staged path for completing a War Room-owned ranking engine before season end while keeping production promotion gated.

Engine architecture is separated into:
1. returning-player expected performance;
2. opportunity / role;
3. position-specific risk and uncertainty;
4. rookie handling;
5. availability / expected games;
6. season-total projection;
7. positional replacement value;
8. cross-position draft value / overall rank;
9. tiers / explanations / warnings;
10. ESPN market timing as a separate signal.

Planned evidence-gated phases after WR-027:
- freeze returning-player projection specification;
- validate rookie engine v1;
- validate availability model;
- build season-total distribution;
- define replacement-level and cross-position custom draft value;
- replay historical preseasons with the complete ranking engine;
- generate a clearly labeled 2026 custom development board from frozen/preseason inputs;
- integrate custom rankings as a non-authoritative shadow production path;
- independent engine QA;
- retain WR-023 final Week 18 prospective validation as a hard gate on production-authority consideration;
- only then consider a separate production-ranking milestone.

Definition:
- `ENGINE-COMPLETE` may be achieved before the 2026 season ends.
- `PRODUCTION-AUTHORITATIVE` may not be considered until the frozen WR-023 prospective gate and a separate Manager production decision are satisfied.

No future phase is automatically activated merely because it appears on this roadmap. Each phase requires the preceding evidence gate and a dedicated WR task when activated.

## Active Parallel Work Wave
### PW-003 — Phone UX + Custom-Ranking Development
Status: ACTIVE
Task: `.ai/manager/PW-003.md`

### WR-027 — Position-Specific Risk Calibration Study
Role: R&D
Status: ACTIVE
Production authorization: NONE
Task: `.ai/manager/WR-027.md`

Goal:
- calibrate downside/breakout/availability risk separately for QB/RB/WR/TE;
- determine whether each position supports rank modification or warning-only presentation;
- preserve WR-025 mean projection as benchmark;
- test transparent robust regression for tail errors/outliers;
- keep rookies separate;
- preserve WR-021/WR-023 prospective artifacts and avoid all 2026 outcome inspection.

Position-level decision vocabulary:
- `RANK MODIFIER SUPPORTED`
- `WARNING-ONLY SUPPORTED`
- `INSUFFICIENT EVIDENCE`

### WR-026 — Phone-Only Decision View Optimization
Role: Builder
Status: ACTIVE
Production authorization: YES — phone UI/layout only
Task: `.ai/manager/WR-026.md`
Independent audit required: YES

Goal:
- replace the phone experience's one-big-list feeling with a decision-first mobile board;
- show one primary position context at a time with quick switching;
- preserve full-list access and existing draft actions;
- leave desktop/tablet >600px visually and behaviorally unchanged.

Required validation:
- phone: 320x700, 375x812, 390x844, 430x932;
- regression: 768x1024, 820x900, 900x900, 1280x800, 1440x900;
- full CI;
- independent Auditor review before merge.

## Ranking authority remains unchanged
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP timing only
- WR-D001 remains ACTIVE

WR-027 and future custom-engine historical development do not supersede the frozen WR-023 prospective contract.

## Integration path
- WR-027 research result -> Manager review/disposition -> next custom-engine roadmap phase only if justified.
- WR-026 Builder PR -> reconcile with current main -> green CI -> Independent Auditor -> Manager merge decision.
- These paths remain independent.

## Current roles
- Manager: IDLE after WR-028 roadmap planning
- Builder: ACTIVE — WR-026
- R&D: ACTIVE — WR-027
- Auditor: IDLE / waiting for WR-026 final PR
