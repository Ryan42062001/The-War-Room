# Manager / Architect Handoff

HANDOFF

Task ID: WR-017 / PW-002 / WR-016 / WR-018
Role: Manager / Architect
Status: WR-017 COMPLETE / PW-002 ACTIVE

## Verified repository state
- Repository: `Ryan42062001/The-War-Room`
- Canonical `main` at session refresh: `041c40bc6250a2ba1cc1c6d3582c5a08254b3017`
- Project mode at refresh: active bounded layout milestone + parallel R&D
- WR-016 Builder branch existed at `2060f89a2c900349eded5e77ee8dca8448feeabe`; Builder handoff still ACTIVE and no WR-016 production PR was open at the refresh checkpoint
- WR-014 research PR #113 was open, mergeable, and changed only `.ai/research/ADVANCED_METRICS_RANKING_DISCOVERY.md` and `.ai/research/HANDOFF.md`
- WR-014 final head: `84615936573f3ff10165ac0f884019a255c53fbf`
- exact-head War Room CI #768 / run `34301913499`: SUCCESS

## WR-014 disposition
Outcome: `R&D ONLY / MORE EVIDENCE NEEDED`

Manager independently reviewed the evidence and verified the decision-critical external constraints:
- PFF current terms prohibit using PFF/API/Derived Data to develop statistical/predictive models under ordinary access
- nflverse documents a post-2024 injury-data gap
- enough broadly licensed/open nflverse/ffverse/FTN-style data exists to justify a bounded research experiment
- NFL.com terms support excluding systematic NGS retrieval absent consent

Manager disposition in WR-017:
- ACCEPT WR-014 evidence
- MERGE research-only PR #113
- KEEP WR-D001 unchanged
- DO NOT authorize production ranking/model changes
- AUTHORIZE a separate experimental/non-production open-data shadow-model task

PR #113 merge SHA: `c976deeca8619f30ca38db4fdb01bb7c02bd83b3`.

## Current production milestone
### Draft-Day Layout Efficiency — IN PROGRESS

### WR-016 — Draft-Day Layout Efficiency Implementation
Assigned role: Implementation Engineer
Status: ACTIVE
Task: `.ai/manager/WR-016.md`
Production implementation authorized: YES, WR-016 scope only

Builder branch observed during Manager refresh:
- `wr-016-draft-day-layout-efficiency`
- head: `2060f89a2c900349eded5e77ee8dca8448feeabe`

No completed Builder handoff/production PR was available yet.

Builder requirements remain:
- finish the bounded UI work and required geometry evidence
- preserve ranking/scoring/recommendation/state/persistence/ESPN semantics
- assess/reconcile main advancement before final handoff
- return production PR + tests + pre/post measurements
- do not merge own PR
- recommended next role: Independent Auditor / QA

WR-016 -> Auditor remains a HARD dependency before production merge.

## Current parallel R&D
### WR-018 — Open-Data Shadow Ranking Model Experiment
Assigned role: Research & Development (R&D)
Status: ACTIVE
Task: `.ai/manager/WR-018.md`
Production implementation authorized: NO

Objective:
Empirically determine whether a rights-conservative War Room-owned QB/RB/WR/TE projection/value model has enough leakage-safe predictive signal to justify continued validation.

Required direction:
- source/license manifest first
- open/licensable inputs only
- no PFF
- no systematic NFL Next Gen Stats without explicit rights
- no FantasyPros historical/API benchmark unless rights for that exact use are established
- point-in-time rolling-origin historical corpus
- transparent baseline + regularized position-specific model + higher-capacity challenger if justified
- Full-PPR per-game/rank/top-N metrics and uncertainty where feasible
- 2026 frozen research-only shadow snapshot if prospectively clean
- no production ranking/scoring/recommendation/data changes
- WR-D001 remains ACTIVE

Required result:
- `PROMISING — CONTINUE VALIDATION`
- `MORE EVIDENCE NEEDED`
- or `DO NOT PURSUE`

Even a promising result does not authorize production ranking changes.

## PW-002 — ACTIVE
Current active lanes:
- Builder — WR-016
- R&D — WR-018

Completed/dispositioned predecessor:
- R&D — WR-014 COMPLETE / PR #113 merged / accepted by WR-017

Dependency classification:
- WR-016 vs WR-018: INDEPENDENT
- WR-016 -> Auditor: HARD before merge
- WR-018 -> Manager review: HARD before any further ranking-model task

Auditor remains IDLE until WR-016 production evidence is ready.

## Current ranking authority
Unchanged:
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP market timing only
- WR-D001 remains ACTIVE

No experimental prediction is production authority.

## Decisions file
`.ai/shared/DECISIONS.md` remains unchanged. WR-014/WR-018 have not produced evidence sufficient to revisit WR-D001, and no new durable production architecture decision has been accepted.

## Work completed by Manager
- refreshed current canonical state and both active specialist branches/handoffs
- discovered completed WR-014 PR #113 while Builder WR-016 remained in progress
- verified PR #113 exact scope/head/CI
- independently checked the strongest external source-rights/data-availability claims
- accepted WR-014 evidence
- merged PR #113
- created `.ai/manager/WR-017.md`
- created `.ai/manager/WR-018.md`
- marked WR-014 complete
- advanced PW-002 R&D lane from WR-014 feasibility to WR-018 experiment
- updated canonical PROJECT_STATE and ROADMAP
- assigned R&D WR-018
- kept Builder WR-016 active and Auditor idle

## Blocking issues
None for WR-016 implementation or WR-018 research.

Production layout merge is blocked on future independent Auditor validation.
Production advanced-metrics ranking work is blocked on WR-018 evidence plus separate Manager review.

## Recommended next roles
Implementation Engineer and R&D continue concurrently.

## Exact next action
1. Builder continues WR-016 and returns a production PR with required evidence; do not merge before audit.
2. R&D executes WR-018 and returns the rights-clean shadow-model experiment; do not modify production rankings.
3. Auditor remains idle until WR-016 is ready for independent verification.

## Checkpoint / SHA
Verify current `main` after these Manager reconciliation/assignment commits for the exact canonical SHA.