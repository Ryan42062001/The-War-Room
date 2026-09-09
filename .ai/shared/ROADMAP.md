# War Room Roadmap

Status: MAINTENANCE / STABLE — BOUNDED WR-021 R&D ACTIVE
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

Evidence:
- richer prior-season summary-only models did not reliably beat the transparent previous-season PPR/game baseline
- no production ranking-model promotion is justified
- WR-D001 remains ACTIVE
- a clean research-only 2026 snapshot exists for later prospective evaluation

### WR-020 — Manager Disposition
Status: COMPLETE
Decision:
- accept WR-018 evidence
- preserve FantasyPros production authority
- authorize one final bounded successor validation focused on genuinely preseason context rather than additional summary-stat tuning

## Active bounded R&D
### WR-021 — Context-Enriched Preseason Shadow Model Validation
Assigned role: Research & Development (R&D)
Status: ACTIVE
Production implementation authorization: NONE
Task: `.ai/manager/WR-021.md`

Objective:
Test whether rights-cleared preseason context (age/experience, draft capital, rookie priors, team movement, point-in-time roster context, and availability where defensible) can materially improve the shadow model.

Required methodological upgrades:
- cohort defined from preseason information only
- rookies handled explicitly
- zero/low target-season participation reported as availability rather than silently excluded
- earlier seasons used for model/feature selection
- 2022–2025 treated as confirmatory, not pristine project-level holdouts
- repeated-player-aware uncertainty
- predeclared material-lift gate
- 2026 enriched freeze only if still created before kickoff without outcome contamination

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

WR-021 is standalone R&D; no new PW is required.

## Current roles
- Manager: IDLE
- Builder: IDLE
- R&D: ACTIVE — WR-021
- Auditor: IDLE
