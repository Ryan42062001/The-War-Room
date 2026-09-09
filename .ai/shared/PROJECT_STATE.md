# War Room Project State

Status: ACTIVE DEVELOPMENT — PW-003 PHONE UX + HISTORICAL RANKING R&D
Last verified: 2026-09-09
Owner: Manager / Architect

## Canonical repository
Repository: `Ryan42062001/The-War-Room`
Branch: `main`

## Production baseline
### Draft-Day Layout Efficiency — COMPLETE
- WR-016 COMPLETE / MERGED
- PR #114 merge: `dfe5476883d700b9281fb57f1c710daa7758492a`
- WR-019 audit: PASS WITH NON-BLOCKING FINDINGS
- post-merge CI / Pages: SUCCESS

### Ranking authority — UNCHANGED
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP timing only
- WR-D001 remains ACTIVE

## Frozen prospective ranking research
### WR-021 — Context-Enriched Preseason Shadow Model Validation
Status: COMPLETE / ACCEPTED / MERGED
PR #116 merge: `f2e3e9b1c0a9a59452d679783a5236d4a5da9a09`
Manager disposition: `PROMISING — CONTINUE VALIDATION` / RESEARCH ONLY

Key result:
- returning-player Ridge MAE 2.680 vs baseline 2.910: 7.89% historical confirmatory improvement
- pooled Spearman 0.684 vs 0.638
- repeated-player-aware pooled uncertainty favorable
- rookie Ridge model did not validate
- corrected 2026 snapshot frozen prospectively for 523 players

### WR-023 — 2026 Prospective Shadow Evaluation Protocol Freeze
Status: COMPLETE / ACCEPTED / MERGED
PR #117 merge: `a1aa543f980f724977e0619d0610e046c719cbea`
Manager disposition: ACCEPTED

Immutable prospective identities:
- protocol SHA-256: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`
- WR-021 snapshot SHA-256: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`

Future decisive gate after completed Week 18 requires all:
- >=3% returner PPR/game MAE lift
- paired-player bootstrap interval favorable
- Spearman no worse by >0.01
- >=3/4 positions non-worse and none >5% worse
- no contamination or post-freeze changes

WR-025 must not inspect 2026 outcomes or alter these frozen artifacts.

## PW-003 — ACTIVE
Direct user feedback / explicit product requirement reactivated bounded work.

### WR-025 — Historical Ranking Signal / Breakout-Bust Research
Role: R&D
Status: ASSIGNED / ACTIVE
Task: `.ai/manager/WR-025.md`
Production authorization: NONE

Objective:
- use rights-clean historical data to identify stable positive ranking signals and warning/downside signals;
- define breakout/bust relative to a preseason expectation unless a lawful historical draft-cost benchmark is found;
- build and evaluate a research-only historical ranking prototype;
- keep WR-021 snapshot and WR-023 protocol unchanged;
- do not inspect 2026 outcomes.

### WR-026 — Phone-Only Decision View Optimization
Role: Builder
Status: ASSIGNED / ACTIVE
Task: `.ai/manager/WR-026.md`
Production authorization: YES — phone UI/layout only
Independent audit required: YES

User requirement:
- desktop view is liked and must remain unchanged;
- phone view should no longer feel like one giant stacked list;
- optimize phone for fast draft decisions.

Required direction:
- phone-only activation, preferably <=600px;
- decision-first opening state;
- one primary position context at a time with one-tap switching;
- compact actionable player set + explicit full-list access;
- preserve Position/Overall, My Draft, search, Taken/Mine, targets, Manage, ESPN health, K/DST;
- no ranking/scoring/recommendation/state/persistence/ESPN semantic change;
- desktop/tablet >600px preserved and regression-tested.

### Dependency
WR-025 vs WR-026: INDEPENDENT.
Parallel wave: `.ai/manager/PW-003.md`.

Auditor remains idle until Builder produces a final mergeable WR-026 PR with green CI.

## Current workload
- Manager — IDLE after PW-003 assignment/reconciliation
- Builder — ACTIVE / WR-026
- R&D — ACTIVE / WR-025
- Auditor — IDLE / waiting for WR-026

Workers must not independently update `.ai/shared/*`.
