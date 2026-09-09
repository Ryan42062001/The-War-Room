# War Room Roadmap

Status: ACTIVE DEVELOPMENT — LAYOUT RELEASE AUDIT + PARALLEL SHADOW-MODEL R&D
Last updated: 2026-09-09
Owner: Manager / Architect

## Project priority
Draft-day reliability, trustworthy recommendations, and decision efficiency over feature count.

## Current production milestone
### Draft-Day Layout Efficiency — RELEASE AUDIT IN PROGRESS

#### WR-016 — Draft-Day Layout Efficiency Implementation
Assigned role: Implementation Engineer
Status: IMPLEMENTATION COMPLETE / PR #114 OPEN
PR: #114 — `WR-016 Improve draft-day layout efficiency`
Head: `1ac362be96909bc638b06a49702b31167e2e2a09`
Current base at Manager refresh: `76357a80b0dfc4752438cfdf8eb74012ec342236`
War Room CI run #811 / `34346917355`: SUCCESS

Builder reports the bounded layout milestone is complete with the required pre/post geometry evidence, responsive coverage, focus/target checks, and regression suite. Builder has not merged the PR.

#### WR-019 — Independent Release Audit
Assigned role: Independent Auditor / QA
Status: ACTIVE
Task: `.ai/manager/WR-019.md`
Audit target: PR #114

Release rule:
- Manager merge is blocked until WR-019 returns PASS or PASS WITH NON-BLOCKING FINDINGS
- HIGH/CRITICAL findings block merge
- production remediation, if required, must be separately Manager-authorized

## Active parallel R&D
### WR-018 — Open-Data Shadow Ranking Model Experiment
Assigned role: Research & Development (R&D)
Status: ACTIVE — EXECUTION NEEDS REACTIVATION
Task: `.ai/manager/WR-018.md`
Production implementation authorization: NONE

At the latest Manager status refresh, no WR-018 branch or PR existed yet. The assignment remains valid and should resume immediately.

Purpose:
Empirically test whether a rights-conservative internal QB/RB/WR/TE projection/value model has enough leakage-safe predictive signal to justify continued validation.

Guardrails remain:
- no PFF
- no unauthorized NFL Next Gen Stats
- no unauthorized FantasyPros historical/API benchmark use
- no target-season leakage
- no production ranking/scoring/recommendation/data changes
- WR-D001 remains ACTIVE

## Parallel Work Wave
### PW-002 — ACTIVE

Current lanes:
- WR-016 Builder — IMPLEMENTATION COMPLETE / awaiting audit
- WR-019 Auditor — ACTIVE
- WR-018 R&D — ACTIVE / repository execution not yet observed

WR-019 and WR-018 are INDEPENDENT.

Downstream:
- WR-019 -> Manager release decision for PR #114: HARD DEPENDENCY
- WR-018 -> Manager evidence review before any ranking-model successor: HARD DEPENDENCY

## Ranking authority remains unchanged
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP market timing only
- WR-D001 remains ACTIVE

No internal shadow model or experimental prediction is production authority.

## Current roles
- Manager: IDLE after reconciliation
- Builder: IDLE — implementation handoff complete
- R&D: ACTIVE — WR-018
- Auditor: ACTIVE — WR-019
