# War Room Roadmap

Status: ACTIVE DEVELOPMENT — LAYOUT PR RECONCILIATION + PARALLEL SHADOW-MODEL R&D
Last updated: 2026-09-09
Owner: Manager / Architect

## Current production milestone
### Draft-Day Layout Efficiency — FINAL RECONCILIATION BEFORE AUDIT

#### WR-016 — Draft-Day Layout Efficiency Implementation
Assigned role: Implementation Engineer
Status: ACTIVE — FINAL PR RECONCILIATION
PR: #114 — `WR-016 Improve draft-day layout efficiency`
Prior head: `1ac362be96909bc638b06a49702b31167e2e2a09`
Prior CI: War Room run #811 SUCCESS against prior main checkpoint.

Manager status reconciliation advanced canonical main after that successful run. A fresh GitHub check subsequently reported PR #114 as not mergeable. Builder must reconcile latest main into the PR branch, obtain a new final head, and rerun final integration CI before audit.

#### WR-019 — Independent Release Audit
Assigned role: Independent Auditor / QA
Status: BLOCKED — WAITING WR-016 FINAL PR SYNC
Task: `.ai/manager/WR-019.md`

Audit begins only after PR #114 is mergeable against current main with green final CI.

## Active parallel R&D
### WR-018 — Open-Data Shadow Ranking Model Experiment
Assigned role: Research & Development (R&D)
Status: ACTIVE — EXECUTION NEEDS REACTIVATION
Task: `.ai/manager/WR-018.md`
Production implementation authorization: NONE

Latest Manager status check found no WR-018 branch or PR yet. R&D should resume the assigned non-production experiment.

## Parallel Work Wave
### PW-002 — ACTIVE

Current roles:
- Builder: ACTIVE — WR-016 final reconciliation
- R&D: ACTIVE — WR-018
- Auditor: BLOCKED — WR-019
- Manager: IDLE after reconciliation

Dependencies:
- WR-016 final reconciliation -> WR-019: HARD
- WR-019 -> Manager merge decision: HARD
- WR-018 -> any ranking-model successor: HARD on Manager review
- WR-018 remains independent of the layout lane

## Ranking authority remains unchanged
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP timing only
- WR-D001 remains ACTIVE
