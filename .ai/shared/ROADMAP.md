# War Room Roadmap

Status: MAINTENANCE / STABLE — BOUNDED WR-023 R&D ACTIVE
Last updated: 2026-09-09
Owner: Manager / Architect

## Completed production milestone
### Draft-Day Layout Efficiency — COMPLETE
- WR-016 COMPLETE / MERGED via PR #114
- WR-019 independent audit: PASS WITH NON-BLOCKING FINDINGS
- merge commit: `dfe5476883d700b9281fb57f1c710daa7758492a`
- post-merge War Room CI #862: SUCCESS
- GitHub Pages #665: SUCCESS

No active production milestone remains.

## Completed ranking R&D
### WR-018 — Open-Data Shadow Ranking Model Experiment
Status: COMPLETE / ACCEPTED / MERGED
Research PR: #115
Merge commit: `9c7aa3b8b7b2600c50dac0f050f6da97b4aed08b`
Manager classification: `MORE EVIDENCE NEEDED`

### WR-021 — Context-Enriched Preseason Shadow Model Validation
Status: COMPLETE / ACCEPTED / MERGED
Research PR: #116
Final head: `6e510d2223289f570e9f078ae0c61eff92a8374e`
Exact-head War Room CI #888 / `34376884781`: SUCCESS
Merge commit: `f2e3e9b1c0a9a59452d679783a5236d4a5da9a09`
Manager classification: `PROMISING — CONTINUE VALIDATION` / RESEARCH ONLY

Key result:
- context-enriched returning-player Ridge model improved confirmatory MAE by 7.89%
- repeated-player-aware pooled 95% interval was fully favorable
- pooled Spearman improved
- all predeclared WR-021 research gates passed
- rookie Ridge model failed versus transparent rookie baseline
- 2022–2025 are not pristine project-level holdouts
- a corrected 2026 prospective snapshot is frozen for 523 QB/RB/WR/TE players

### WR-022 — WR-021 Manager Disposition
Status: COMPLETE
Decision:
- accept WR-021 as promising research only
- preserve FantasyPros production authority and WR-D001
- require pristine 2026 prospective validation before any production-milestone consideration

## Active bounded R&D
### WR-023 — 2026 Prospective Shadow Evaluation Protocol Freeze
Assigned role: Research & Development (R&D)
Status: ACTIVE
Production implementation authorization: NONE
Task: `.ai/manager/WR-023.md`

Objective:
Pre-register and hash the exact 2026 prospective evaluation protocol before any 2026 outcome scoring.

Required protocol properties:
- immutable WR-021 frozen snapshot universe
- returners as primary hypothesis; rookies separate/diagnostic
- rights-clean predeclared 2026 outcome source and field semantics
- interim checkpoints descriptive only
- final regular season is decisive
- >=3% returning-player PPR/game MAE lift
- paired player-bootstrap 95% interval upper bound < 0
- Spearman no worse by >0.01
- >=3/4 positions non-worse on MAE and no position worse by >5%
- no post-freeze model/snapshot modification

Passing the future prospective gate would authorize only Manager consideration of a separate production milestone; it would not directly change rankings.

## Ranking authority remains unchanged
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP timing only
- WR-D001 remains ACTIVE

## Parallel Work Wave
### PW-002 — COMPLETE
- WR-016 COMPLETE / MERGED
- WR-019 COMPLETE / PASS WITH NON-BLOCKING FINDINGS
- WR-018 COMPLETE / ACCEPTED / MERGED

WR-023 is standalone R&D. No new Parallel Work Wave is justified.

## Current roles
- Manager: IDLE
- Builder: IDLE
- R&D: ACTIVE — WR-023
- Auditor: IDLE
