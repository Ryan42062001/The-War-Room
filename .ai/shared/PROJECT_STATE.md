# War Room Project State

Status: ACTIVE DEVELOPMENT — PW-003 PHONE UX + POSITION-SPECIFIC RISK R&D
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

### WR-023 — 2026 Prospective Shadow Evaluation Protocol Freeze
Status: COMPLETE / ACCEPTED / MERGED
PR #117 merge: `a1aa543f980f724977e0619d0610e046c719cbea`
Manager disposition: ACCEPTED

Immutable prospective identities:
- protocol SHA-256: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`
- WR-021 snapshot SHA-256: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`

WR-027 and all later historical engine development must not inspect 2026 outcomes or alter these frozen artifacts.

## Historical ranking R&D
### WR-025 — Historical Ranking Signal / Breakout-Bust Research
Role: R&D
Status: COMPLETE / ACCEPTED / MERGED
Research PR: #118
Final research head: `22c5678c876081c012000c28f2082668116c4b8b`
Exact-head War Room CI #934 / run `34401904213`: SUCCESS
Merge commit: `93da7e5de10ca2130d40142450cab9840c755ab4`
Manager disposition: `MORE EVIDENCE NEEDED`
Production behavior changed: NO

Key evidence:
- returning-player Ridge mean projection improved pooled MAE 3.0262 -> 2.8262 (6.61%);
- player-clustered paired MAE interval `[-0.3235, -0.0616]`;
- downside AUC was useful by position, especially RB/WR/TE;
- universal risk overlay improved QB/RB rank MAE but worsened WR +5.51% and TE +6.20%;
- rookie Ridge remained worse than transparent rookie prior;
- lawful MFL public archive was investigated but comparable PPR redraft sample was too small to admit as historical ADP benchmark;
- no 2026 outcomes inspected and frozen WR-021/WR-023 artifacts remained unchanged.

### WR-027 — Position-Specific Risk Calibration Study
Role: R&D
Status: ASSIGNED / ACTIVE
Task: `.ai/manager/WR-027.md`
Production authorization: NONE

Objective:
- preserve WR-025 successful mean-projection model as benchmark;
- calibrate downside/breakout/availability warnings separately by QB/RB/WR/TE;
- determine per position whether risk should modify rank or remain warning-only;
- test a transparent robust-regression challenger for occasional Ridge outliers;
- keep rookies separate;
- preserve frozen WR-021/WR-023 prospective test unchanged.

## Custom ranking engine roadmap
### WR-028 — Custom Ranking Engine Roadmap / Architecture Plan
Role: Manager / Architect
Status: COMPLETE
Task: `.ai/manager/WR-028.md`

Manager has established an evidence-gated plan to make the custom ranking engine technically complete before season end without prematurely changing production ranking authority.

Planned layers:
- returning-player expected performance;
- position-specific risk / warnings;
- rookie engine;
- availability / expected games;
- season-total production and uncertainty;
- positional replacement value;
- cross-position custom draft value / overall rank;
- tiers / explanations / warnings;
- ESPN market timing kept separate;
- shadow production integration;
- independent engine QA;
- final WR-023 prospective promotion gate.

Definitions:
- `ENGINE-COMPLETE`: reproducible QB/RB/WR/TE projections, risk outputs, availability, season totals, replacement-adjusted values, overall/position ranks, tiers and explanations.
- `SHADOW-READY`: integrated non-authoritatively with deterministic versioning/QA while FantasyPros remains authority.
- `PRODUCTION-AUTHORITATIVE`: not currently authorized; requires final WR-023 prospective evidence plus separate Manager/Builder/Auditor milestone and WR-D001 change.

Current hard dependency:
WR-027 must finish before the returning-player v1 projection/risk specification is frozen and the next roadmap phase is activated.

## PW-003 — ACTIVE
### WR-026 — Phone-Only Decision View Optimization
Role: Builder
Status: ACTIVE
Task: `.ai/manager/WR-026.md`
Production authorization: YES — phone UI/layout only
Independent audit required: YES

User requirement:
- desktop/tablet >600px must remain unchanged;
- phone should be decision-first rather than one giant stacked list.

### Dependency
WR-027 vs WR-026: INDEPENDENT.

Builder must reconcile its final WR-026 PR with current main before audit because Manager/R&D integration has advanced main since its assignment base.

Auditor remains idle until Builder produces a final mergeable WR-026 PR with green CI.

## Current workload
- Manager — IDLE after WR-028 roadmap planning
- Builder — ACTIVE / WR-026
- R&D — ACTIVE / WR-027
- Auditor — IDLE / waiting for WR-026

Workers must not independently update `.ai/shared/*`.
