# War Room Roadmap

Status: ACTIVE DEVELOPMENT — WR-018 MANAGER REVIEW PENDING
Last updated: 2026-09-09
Owner: Manager / Architect

## Completed production milestone
### Draft-Day Layout Efficiency — COMPLETE

#### WR-016 — Draft-Day Layout Efficiency Implementation
Assigned role: Implementation Engineer
Status: COMPLETE / MERGED
PR: #114 — `WR-016 Improve draft-day layout efficiency`
Audited final head: `5636bd75aa4be34bdbdfc5e459df44283c8f2483`
Independent audit: WR-019 PASS WITH NON-BLOCKING FINDINGS
Merge commit: `dfe5476883d700b9281fb57f1c710daa7758492a`
Post-merge War Room CI #862 / `34370139838`: SUCCESS
GitHub Pages deployment #665 / `34370138865`: SUCCESS

Outcome:
- bounded layout-efficiency improvements shipped
- persistent chrome competition reduced
- Manage progressive disclosure added for low-frequency/destructive actions
- Draft Setup progressively disclosed after meaningful progress
- stressed tablet/desktop geometry improved
- zero required-matrix horizontal overflow/actionable occlusion/focus obstruction in automated validation
- ranking/scoring/recommendation/state/persistence/ESPN authority unchanged

#### WR-019 — Independent Release Audit
Assigned role: Independent Auditor / QA
Status: COMPLETE
Disposition: PASS WITH NON-BLOCKING FINDINGS
Blocking findings: NONE
Evidence: `.ai/auditor/WR-019_LAYOUT_RELEASE_AUDIT.md`

## Active Manager review
### WR-018 — Open-Data Shadow Ranking Model Experiment
Assigned role: Research & Development (R&D)
Status: COMPLETE — MANAGER DISPOSITION PENDING
Research PR: #115
Exact research head: `0c2f7e9e307ff30293ff96ab66fb0b1a72c8b051`
Exact-head War Room CI #858 / `34367526671`: SUCCESS
Primary result: `MORE EVIDENCE NEEDED`
Production implementation authorization: NONE

Current evidence does not justify replacing FantasyPros or promoting the shadow model into production. The strongest possible successor hypothesis is a narrower research validation adding rights-cleared point-in-time rookie/age/draft-capital/team-role/availability context while preserving rolling-origin holdouts and the naive comparator.

Manager must decide whether that successor research is worth the cost or whether WR-018 should close without further immediate work.

## Parallel Work Wave
### PW-002 — ACTIVE / CLOSEOUT PENDING

Completed:
- Builder: WR-016 COMPLETE / MERGED
- Auditor: WR-019 COMPLETE / PASS WITH NON-BLOCKING FINDINGS

Pending Manager action:
- WR-018 evidence disposition / PR #115 integration

Current roles:
- Manager: ACTIVE — WR-018 review
- Builder: IDLE
- R&D: IDLE
- Auditor: IDLE

## Ranking authority remains unchanged
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP timing only
- WR-D001 remains ACTIVE
