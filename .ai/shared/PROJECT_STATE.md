# War Room Project State

Status: MAINTENANCE / STABLE — BOUNDED WR-021 R&D ACTIVE
Last verified: 2026-09-09
Owner: Manager / Architect

## Canonical repository
Repository: `Ryan42062001/The-War-Room`
Branch: `main`

## Production baseline
No active production milestone.

### Draft-Day Layout Efficiency — COMPLETE
- WR-016 COMPLETE / MERGED
- PR #114 merge: `dfe5476883d700b9281fb57f1c710daa7758492a`
- Independent WR-019 audit: PASS WITH NON-BLOCKING FINDINGS
- Post-merge War Room CI #862 / `34370139838`: SUCCESS
- GitHub Pages #665 / `34370138865`: SUCCESS
- No ranking/scoring/recommendation/draft-state/persistence/ESPN authority changes from the layout milestone.

## Advanced-metrics ranking R&D

### WR-018 — Open-Data Shadow Ranking Model Experiment
Role: Research & Development (R&D)
Status: COMPLETE / ACCEPTED / MERGED
Research PR: #115
Research head: `0c2f7e9e307ff30293ff96ab66fb0b1a72c8b051`
Exact-head War Room CI #858 / `34367526671`: SUCCESS
Merge commit: `9c7aa3b8b7b2600c50dac0f050f6da97b4aed08b`
Manager disposition: `MORE EVIDENCE NEEDED`
Production behavior changed: NO

Key evidence:
- 663 rolling-origin held-out returning-player predictions across 2022–2025
- naive previous-season PPR/game MAE 2.636
- Ridge MAE 2.638; Gradient Boosting MAE 2.674
- neither challenger established persuasive pooled MAE lift
- clean research-only 2026 snapshot frozen for 343 returning QB/RB/WR/TE players

Manager review also recorded two methodological limits relevant to future work:
- WR-018 historical cohort conditioned on at least four target-season games, so it does not represent complete preseason draft value / availability risk
- row-wise bootstrap did not cluster repeated players across seasons

### WR-020 — WR-018 Manager Disposition
Role: Manager / Architect
Status: COMPLETE
Task: `.ai/manager/WR-020.md`
Decision:
- accept WR-018 as `MORE EVIDENCE NEEDED`
- do not change WR-D001
- do not promote a production model
- authorize one bounded successor research validation focused on genuinely preseason context

### WR-021 — Context-Enriched Preseason Shadow Model Validation
Role: Research & Development (R&D)
Status: ASSIGNED / ACTIVE
Task: `.ai/manager/WR-021.md`
Production implementation authorization: NONE

Required successor focus:
- preseason-defined historical cohort; no target-season outcome used to decide inclusion
- explicit rookies/no-prior-history handling
- rights-cleared age/experience/draft-capital/team-movement/roster context where point-in-time semantics are defensible
- availability handled explicitly rather than silently excluding zero/low-participation players
- earlier-season model selection; 2022–2025 treated as confirmatory because their outcomes have already been observed by the project
- repeated-player-aware uncertainty
- predeclared material-lift gate before any `PROMISING` classification
- freeze a context-enriched 2026 research snapshot before kickoff only if still prospectively clean

## Ranking authority baseline
UNCHANGED:
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP market timing only
- WR-D001 remains ACTIVE

No shadow-model output is production authority.

## PW-002
Status: COMPLETE
- WR-016 Builder lane COMPLETE / MERGED
- WR-019 Auditor lane COMPLETE / PASS WITH NON-BLOCKING FINDINGS
- WR-018 R&D lane COMPLETE / ACCEPTED / MERGED

WR-021 is a new standalone R&D task and is not part of PW-002.

## Current workload
- Manager — IDLE after WR-020/WR-021 assignment
- Builder — IDLE
- R&D — ACTIVE / WR-021
- Auditor — IDLE

Workers must not independently update `.ai/shared/*`.
