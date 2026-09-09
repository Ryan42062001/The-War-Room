# Manager / Architect Handoff

HANDOFF

Task ID: PW-001 / WR-012 / WR-013 / WR-014
Role: Manager / Architect
Status: PW-001 ACTIVE / WR-013 COMPLETE / WR-014 QUEUED

## Verified repository state
- Repository: `Ryan42062001/The-War-Room`
- Latest verified main before this Manager trigger processing: `692ccf52aebb67ea48e06b4105725a6c621ff2e3`
- Project mode: MAINTENANCE / STABLE — bounded discovery active
- Latest production merge remains WR-003 / PR #108
- No production UI/ranking/scoring/recommendation behavior changed by PW-001 or WR-014 queueing

## PW-001 layout discovery

### WR-012 — R&D
Status: ACTIVE
Task: `.ai/manager/WR-012.md`
Expected evidence: `.ai/research/LAYOUT_EFFICIENCY_DISCOVERY.md`
Production implementation: NOT AUTHORIZED

### WR-013 — Independent Auditor / QA
Status: COMPLETE
Evidence: `.ai/auditor/LAYOUT_AUDIT.md`
Independent first-pass artifact: `40a6b7c5a4b67bdcb506234cc09d7e11fe9534e7`
Final Auditor handoff checkpoint on main: `692ccf52aebb67ea48e06b4105725a6c621ff2e3`

Auditor findings:
- no CRITICAL/HIGH layout defect proven
- MEDIUM: frequent sub-30px controls
- MEDIUM: meaningful desktop/tablet persistent vertical budget
- MEDIUM: low-frequency/destructive controls compete with live-draft controls
- MEDIUM: 769–900px is the structurally stressed responsive band
- preserve Position Tiers default, mobile containment, command urgency hierarchy, one-action board switching, and strong overflow regression coverage

Manager layout synthesis remains blocked on WR-012 completion. Builder remains idle.

## New maintenance trigger — advanced-metrics ranking model

The user proposed replacing or supplementing FantasyPros expert-consensus rankings with a War Room-owned ranking model built from underlying football statistics and advanced metrics.

Manager classification:
- materially valuable differentiated-product opportunity
- legitimate R&D subject
- potentially much higher architectural/ranking-authority risk than WR-010
- production work not justified without source-rights and predictive-validation evidence

### WR-014 — Advanced Metrics Ranking Model Feasibility
Role: Research & Development (R&D)
Status: QUEUED — NOT ACTIVE
Task: `.ai/manager/WR-014.md`
Queue-time main: `692ccf52aebb67ea48e06b4105725a6c621ff2e3`
Production implementation authorized: NO

Why queued:
- WR-014 is product/technically independent from PW-001
- the same R&D role is currently executing WR-012
- therefore there is a HARD resource dependency and WR-014 should not preempt/silently expand WR-012

## Manager preliminary technical view

The idea is viable enough to research, but the best initial architecture is likely **not** "replace FantasyPros with PFF grades." A serious model would need position-specific forecasting of future opportunity + efficiency + availability, and historical stats alone will miss injuries, depth-chart changes, rookies, coaching changes, and role shifts.

The strongest initial research question is whether an open/licensable War Room-owned model can materially outperform or complement the current Top-20 PPR ECR baseline.

Candidate architecture families for R&D:
1. open-data-only projection/value model
2. open-data model plus expert/market prior hybrid
3. full internal replacement only if held-out evidence clearly beats the existing baseline

## Manager preliminary source evidence

### PFF
Current PFF Terms (reviewed 2026-09-08) materially constrain this idea:
- PFF Data/API Data/Derived Data are restricted to personal, non-commercial, non-public use under consumer access
- automated/manual extraction restrictions are broad
- Derived Data explicitly includes rankings/models created from PFF data
- terms expressly prohibit using PFF API/Derived Data to train, evaluate, benchmark, or develop statistical/predictive models
- public distribution/competing-product restrictions also apply

Manager conclusion: do not assume PFF can be a production training/input source. Use only if separate explicit rights are later established.

### Open/licensable direction
Current public evidence supports deeper R&D around nflverse/ffverse:
- nflverse exposes play-by-play and player stats through public data releases/tooling
- core nflverse PBP/player-stat repositories use CC BY 4.0
- available families include snap counts, advanced pass/rush/receiving stats, Next Gen Stats mirrors, fantasy player IDs, and expected-fantasy-points/opportunity tooling
- nflverse also exposes an openly published FTN charting subset

NFL Next Gen Stats/NFL Pro has extensive advanced metrics, but machine-readable production rights and ingestion feasibility must be separately verified before assuming it is a model input.

## Required WR-014 evidence when activated
R&D must determine:
- prediction target appropriate for PPR draft value
- position-specific feature families
- source/licensing matrix
- injury/role/rookie/team-context strategy
- transparent vs higher-complexity model alternatives
- full replacement vs hybrid architecture
- leakage-safe rolling/held-out historical validation
- direct comparison to contemporaneous Top-20 PPR ECR baseline
- seasonality/refresh/fail-closed design
- explainability and downstream recommendation risks

No production model should be considered merely because it fits historical data well.

## Canonical decisions
WR-D001 remains ACTIVE: FantasyPros PPR ECR is current ranking/value authority; ESPN rank/ADP is market timing only.
No DECISIONS.md update is warranted yet because WR-014 is only queued research.

## Dependency / parallelism analysis
- WR-012 vs completed WR-013: evidence streams independent; Manager synthesis waits for WR-012
- WR-014 vs layout subject: INDEPENDENT
- WR-014 vs WR-012 resource: HARD DEPENDENCY — same R&D worker
- Builder implementation from either discovery stream: HARD DEPENDENCY on Manager decision/new production task

PW-001 remains the only active Parallel Work Wave. WR-014 is not active and is not added to PW-001.

## Files updated by Manager
- `.ai/manager/WR-014.md`
- `.ai/manager/PW-001.md`
- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/manager/HANDOFF.md`

## Files reviewed but intentionally unchanged
- `.ai/shared/DECISIONS.md`
- production UI files
- production ranking/scoring/recommendation files
- `.ai/research/HANDOFF.md` while WR-012 is actively owned by R&D

## Blocking issues
None for WR-012 or WR-014 planning.

WR-014 activation is intentionally deferred until WR-012 completes. Production ranking-authority work is blocked on future R&D evidence and Manager approval.

## Recommended next role
Research & Development continues WR-012. Auditor is idle after WR-013 completion. Builder remains idle.

## Exact next action
Finish WR-012 first. When R&D returns its layout handoff, Manager should synthesize PW-001. After that synthesis, if no higher-priority issue supersedes it, activate WR-014 for advanced-metrics ranking-model feasibility research. Do not implement a ranking model yet.

## Checkpoint / SHA
Verify current `main` after these Manager-owned reconciliation/queue commits for the exact canonical SHA.