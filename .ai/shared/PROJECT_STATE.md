# War Room Project State

Status: ACTIVE DEVELOPMENT — BOUNDED LAYOUT MILESTONE + PARALLEL SHADOW-MODEL R&D
Last verified: 2026-09-08
Owner: Manager / Architect

## Canonical repository
Repository: `Ryan42062001/The-War-Room`
Branch: `main`

Latest production merge remains:
- WR-003 / PR #108: `c5648122710d0720a59d8a8a79944b7ddf5b1d5a`

Latest research evidence merges:
- WR-012 / PR #112: `e46ae94bc592d73560eb88258046acce19d3c0c6`
- WR-014 / PR #113: `c976deeca8619f30ca38db4fdb01bb7c02bd83b3`

Neither research merge changed production UI/rankings/scoring/recommendations.

## Project mode
Active production development is open only for the bounded Draft-Day Layout Efficiency milestone under WR-016.

Parallel R&D is active under WR-018 as an experimental/non-production shadow ranking-model task. Production ranking authority remains unchanged.

## Completed layout discovery
PW-001 — Layout Efficiency Discovery: COMPLETE

- WR-012 — Layout Efficiency & Information Architecture R&D: COMPLETE / PR #112 merged
- WR-013 — Current Layout Efficiency & Usability Baseline Audit: COMPLETE
- WR-015 — Manager synthesis: COMPLETE

Manager outcome:
- broad redesign rejected
- bounded Draft-Day Layout Efficiency milestone approved
- preserve Position Tiers, Overall, command urgency states, My Draft, mobile containment, and recommendation/state semantics

## Active production milestone
### Draft-Day Layout Efficiency — IN PROGRESS

### WR-016 — Draft-Day Layout Efficiency Implementation
Role: Implementation Engineer
Status: ACTIVE
Task: `.ai/manager/WR-016.md`
Parallel wave: PW-002
Production implementation authorization: YES, WR-016 scope only

Latest Manager observation:
- Builder branch exists: `wr-016-draft-day-layout-efficiency`
- observed head: `2060f89a2c900349eded5e77ee8dca8448feeabe`
- Builder handoff still reports ACTIVE
- no WR-016 production PR was open at the Manager refresh checkpoint

Merge gate:
- Builder must return the required production PR/evidence
- Independent Auditor / QA must validate it before Manager merge

## Advanced-metrics ranking R&D

### WR-014 — Advanced Metrics Ranking Model Feasibility
Role: R&D
Status: COMPLETE — R&D ONLY / MORE EVIDENCE NEEDED
Evidence: `.ai/research/ADVANCED_METRICS_RANKING_DISCOVERY.md`
PR: #113
Final head: `84615936573f3ff10165ac0f884019a255c53fbf`
Exact-head War Room CI #768 / run `34301913499`: SUCCESS
Merge: `c976deeca8619f30ca38db4fdb01bb7c02bd83b3`

Accepted findings:
- a rights-clean open-data shadow model is feasible enough for a bounded experiment
- initial target should forecast per-game Full-PPR production / opportunity / availability separately, then derive season and replacement-adjusted value downstream
- first model should be position-specific QB/RB/WR/TE with transparent baseline + stronger challenger
- PFF is excluded under current terms
- NFL Next Gen Stats is excluded from the initial rights-conservative experiment absent explicit rights
- nflverse injury data has a post-2024 gap
- historical contemporaneous ECR benchmarking rights/completeness remain unresolved
- no production ranking-authority change is justified yet

### WR-017 — WR-014 Feasibility Disposition / Shadow Experiment Authorization
Role: Manager / Architect
Status: COMPLETE

Manager disposition:
- accepted WR-014 evidence
- merged PR #113
- preserved WR-D001
- authorized a separate experimental/non-production shadow-model task
- did not authorize production ranking/model changes

### WR-018 — Open-Data Shadow Ranking Model Experiment
Role: Research & Development (R&D)
Status: ASSIGNED / ACTIVE
Task: `.ai/manager/WR-018.md`
Parallel wave: PW-002
Production implementation authorization: NO

Objective:
Run a rights-conservative, leakage-safe shadow experiment for QB/RB/WR/TE using clearly permitted/open data, compare transparent and higher-capacity models, and freeze a 2026 research-only shadow snapshot if prospectively clean.

Required guardrails:
- no PFF
- no systematic NFL Next Gen Stats without explicit rights
- no FantasyPros historical/API benchmark unless rights for that exact use are established
- no production ranking/scoring/recommendation/data changes
- no target-season leakage
- source/license manifest required
- WR-D001 remains ACTIVE

## PW-002 — ACTIVE
Active parallel tasks:
- Builder — WR-016
- R&D — WR-018

Completed/dispositioned R&D predecessor:
- WR-014 — COMPLETE / accepted by WR-017

Dependency classification:
- WR-016 vs WR-018: INDEPENDENT
- WR-016 -> Independent Auditor: HARD DEPENDENCY before production merge
- WR-018 -> Manager review: HARD DEPENDENCY before any further ranking-model work

Auditor is currently IDLE until WR-016 production evidence is ready.

## Ranking authority baseline
Unchanged:
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR controlled fallback
- ESPN rank/ADP market timing only
- canonical 717-player universe remains validated baseline
- WR-D001 remains ACTIVE

No shadow-model output is production authority.

## Task state
- WR-001 — COMPLETE
- WR-002 — COMPLETE / PASS
- WR-003 — COMPLETE / PASS / MERGED
- WR-004 — COMPLETE
- WR-005 — COMPLETE
- WR-006 — COMPLETE
- WR-007 — COMPLETE
- WR-008 — COMPLETE
- WR-009 — COMPLETE
- WR-010 — COMPLETE / R&D ONLY-MORE EVIDENCE NEEDED
- WR-011 — COMPLETE
- WR-012 — COMPLETE / PR #112 MERGED
- WR-013 — COMPLETE
- WR-014 — COMPLETE / PR #113 MERGED / MORE EVIDENCE NEEDED
- WR-015 — COMPLETE
- WR-016 — ACTIVE / Builder
- WR-017 — COMPLETE / Manager disposition
- WR-018 — ACTIVE / R&D experimental shadow model

## Open non-blocking findings
1. Legacy `AGENTS.md` process wording remains non-blocking; canonical `.ai/shared/*` wins.
2. Diagnostics can over-emphasize network capture when Pick History DOM is actual ledger-eligible authority.
3. Synthetic-navigation actor identity remains unknown at the WR-002 evidence ceiling.
4. FantasyPros ranking automation remains gated on provider compatibility/completeness/material lift.
5. Advanced-metrics production ranking authority remains unproven; current evidence supports only WR-018 shadow experimentation.
6. Current open injury/availability coverage and lawful historical ECR benchmarking remain incomplete.

## Current workload / parallelism
PARALLEL WORK WAVE: PW-002

Active:
- Builder — WR-016
- R&D — WR-018

Idle:
- Auditor — IDLE until WR-016 audit gate

Workers must not independently update `.ai/shared/*`. Manager owns canonical reconciliation and final integration decisions.