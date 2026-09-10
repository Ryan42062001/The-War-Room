# Manager / Architect Handoff

HANDOFF

Task ID: PW-003 / WR-025 / WR-026 / WR-027 / WR-028 / WR-029
Role: Manager / Architect
Status: WR-025 COMPLETE / WR-028 COMPLETE / WR-026 ACTIVE / WR-027 ACTIVE / WR-029 PLANNED-BLOCKED

## Verified starting state for context-enrichment planning
- canonical main before WR-029 planning: `1213b130d48c4afa3729fb2f5d5dd71096cece4d`
- WR-025 PR #118: MERGED as `93da7e5de10ca2130d40142450cab9840c755ab4`
- WR-026 phone lane: ACTIVE
- WR-027 position-specific risk calibration: ACTIVE
- open PRs at WR-029 planning check: NONE
- production ranking authority remains FantasyPros under WR-D001
- WR-021 / WR-023 frozen prospective artifacts remain unchanged

## WR-025 evidence retained
Returning-player mean projection:
- previous-season PPR/game MAE: 3.0262
- Ridge MAE: 2.8262
- Ridge improvement: 6.61%
- Ridge Spearman: 0.6775 vs baseline 0.6359
- player-clustered paired MAE 95% interval: `[-0.3235, -0.0616]`

Universal risk-overlay position rank MAE:
- QB improved 9.95%
- RB improved 3.11%
- WR worsened 5.51%
- TE worsened 6.20%

Interpretation:
- preserve successful mean projection;
- do not use a universal risk penalty;
- calibrate risk by position;
- richer player/team/context features must earn inclusion out of sample.

## WR-027 — ACTIVE
Task: `.ai/manager/WR-027.md`
Role: R&D
Production authorization: NONE

Objective:
- fix per-position risk policy;
- test transparent robust regression;
- preserve WR-025 mean benchmark;
- no 2026 outcomes or frozen-artifact changes.

Position-level decision vocabulary:
- `RANK MODIFIER SUPPORTED`
- `WARNING-ONLY SUPPORTED`
- `INSUFFICIENT EVIDENCE`

## WR-028 — Custom Ranking Engine Roadmap
Status: COMPLETE
Task: `.ai/manager/WR-028.md`

The roadmap now explicitly includes WR-029 as Phase 1.5 before the returning-player v1 projection specification is frozen.

## WR-029 — Advanced Context Feature Enrichment / Source Feasibility
Status: PLANNED / BLOCKED ON WR-027 MANAGER DISPOSITION
Task: `.ai/manager/WR-029.md`
Role when activated: R&D
Production authorization: NONE

User-driven enrichment areas:
- offensive snap percentage / participation;
- route/pass-play participation and true YPRR only where exact route denominators are defensible;
- targets per route, carries per snap, red-zone/goal-line role;
- advanced receiving/rushing/QB efficiency;
- offensive-line environment using non-proprietary reproducible proxies;
- team pace, play volume, pass/run tendency and offensive efficiency;
- head coach / OC / play-caller continuity and scheme tendencies where rights/coverage permit;
- depth-chart / teammate competition / vacated opportunity using point-in-time data;
- age, experience, physical and maintainable availability context;
- schedule/opponent context only as secondary evidence.

Important source findings informing WR-029 planning:
- nflverse exposes historical snap-count data including offensive snaps and offense percentage;
- nflverse provides team/player stats and play-by-play suitable for many derived team/efficiency features;
- depth-chart data is available historically, with timestamped updates from 2025 onward;
- participation/FTN/NGS-derived sources have different provenance/license/coverage and require explicit rights review before admission;
- historical coordinator data is not a clean universal source and must be treated as a coverage/rights risk rather than assumed available;
- exact routes-run/YPRR must not be fabricated from mere on-field/pass-play participation.

WR-029 gate:
Every candidate family must be classified:
- `CORE MODEL SUPPORTED`
- `WARNING / EXPLANATION ONLY`
- `INSUFFICIENT EVIDENCE`
- `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE`

Dependency:
WR-027 Manager disposition -> WR-029 -> returning-player Phase-2 specification freeze.

## WR-026 phone lane
Builder remains ACTIVE.

Builder must reconcile final WR-026 work with current main before independent audit. Desktop/tablet >600px preservation remains a hard requirement.

## Frozen prospective ranking contract
UNCHANGED.

WR-023 protocol SHA-256:
`f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`

WR-021 snapshot SHA-256:
`9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`

No WR-027/WR-029 or later post-kickoff development may rewrite or substitute into that prospective test.

## Ranking authority
UNCHANGED:
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP timing only
- WR-D001 ACTIVE

## Current role state
- Manager: IDLE after WR-029 planning
- Builder: ACTIVE — WR-026
- R&D: ACTIVE — WR-027
- Auditor: IDLE / waiting for WR-026

## Recommended next actions
1. R&D completes WR-027 and returns evidence for Manager review.
2. If WR-027 is accepted, activate WR-029 before freezing the returning-player v1 model.
3. Builder continues WR-026 and reconciles with then-current main before final audit-ready handoff.
4. Activate Auditor only when WR-026 is final, mergeable, and green.

## Blocking issues
- WR-029 is blocked on WR-027 disposition;
- production custom-ranking authority remains unauthorized;
- rookie ranking remains unresolved beyond transparent prior;
- 2026 prospective proof remains frozen and event-driven.

## Checkpoint / SHA
Verify current canonical main after WR-029 planning reconciliation for the exact final SHA.
