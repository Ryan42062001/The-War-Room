# Manager / Architect Handoff

HANDOFF

Task ID: PW-003 / WR-025 / WR-026 / WR-027 / WR-028
Role: Manager / Architect
Status: WR-025 COMPLETE / WR-028 COMPLETE / WR-026 ACTIVE / WR-027 ACTIVE

## Verified starting state for roadmap planning
- canonical main before WR-028 planning commits: `dc412db43b52dc0fd6c195478f7e873344228fb7`
- WR-025 PR #118: MERGED as `93da7e5de10ca2130d40142450cab9840c755ab4`
- WR-025 classification accepted: `MORE EVIDENCE NEEDED`
- WR-026 phone lane: ACTIVE
- WR-027 position-specific risk calibration: ACTIVE
- open PRs at roadmap planning check: NONE
- production ranking authority remained FantasyPros under WR-D001
- WR-021 / WR-023 frozen prospective artifacts remained unchanged

## WR-025 key evidence
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
- preserve the successful mean projection;
- do not use one universal risk penalty;
- downside probabilities appear useful enough to calibrate separately by position;
- warning presentation may be more appropriate than rank modification for some positions;
- rookies remain a separate unresolved model family.

## WR-027 assignment
Task: `.ai/manager/WR-027.md`
Role: Research & Development (R&D)
Status: ASSIGNED / ACTIVE
Production authorization: NONE

Objective:
- preserve WR-025 Ridge mean projection as benchmark;
- calibrate downside/breakout/low-availability warnings separately for QB/RB/WR/TE;
- decide by position whether risk belongs in ranking or warning-only presentation;
- test transparent robust regression for Ridge tail/outlier errors;
- keep rookies separate;
- do not inspect 2026 outcomes or change WR-021/WR-023 frozen artifacts.

Position-level final decision vocabulary:
- `RANK MODIFIER SUPPORTED`
- `WARNING-ONLY SUPPORTED`
- `INSUFFICIENT EVIDENCE`

## WR-028 — Custom Ranking Engine Roadmap
Status: COMPLETE
Task: `.ai/manager/WR-028.md`

Manager created a formal evidence-gated custom-ranking roadmap so the engine can become technically complete before the end of the 2026 season without prematurely changing production authority.

### Engine architecture
Separate layers:
1. returning-player expected performance;
2. opportunity / role;
3. position-specific risk / uncertainty;
4. rookie handling;
5. availability / expected games;
6. season-total production;
7. positional replacement value;
8. cross-position draft value / overall rank;
9. tiers / explanations / warnings;
10. ESPN market timing kept separate from intrinsic value.

### Planned phases after WR-027
1. returning-player v1 projection specification freeze;
2. rookie engine v1;
3. availability / games model;
4. season-total distribution;
5. replacement-level + cross-position draft value architecture;
6. complete historical ranking replay;
7. generate a 2026 custom development board from frozen/preseason inputs, clearly labeled non-pristine because architecture is being developed post-kickoff;
8. shadow production integration with FantasyPros still authoritative;
9. independent engine QA;
10. final WR-023 prospective evaluation after completed Week 18;
11. separate Manager production-ranking promotion decision only if all required gates are satisfied.

### Completion definitions
`ENGINE-COMPLETE`:
reproducible QB/RB/WR/TE projections, risk outputs, availability, season totals, replacement-adjusted values, overall/position ranks, tiers and explanations.

`SHADOW-READY`:
engine integrated as a non-authoritative, deterministic, versioned and audited path while FantasyPros remains production authority.

`PRODUCTION-AUTHORITATIVE`:
not authorized. Requires final WR-023 prospective validation plus a separate Manager architecture decision, Builder implementation, Independent Auditor release gate and WR-D001 replacement/amendment.

### Dependency
WR-027 -> next custom-ranking roadmap phase: HARD.
Do not activate the returning-player specification-freeze phase until Manager reviews WR-027.

## WR-026 phone lane
Builder remains ACTIVE on WR-026.

Important integration note:
Manager roadmap commits advanced main after WR-026 assignment. Builder must reconcile its final WR-026 PR with refreshed current main before independent audit.

Desktop/tablet >600px preservation remains a hard requirement.
Independent Auditor required before production merge.

## Frozen prospective ranking contract
UNCHANGED.

WR-023 protocol SHA-256:
`f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`

WR-021 snapshot SHA-256:
`9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`

No WR-027 or later post-kickoff historical-development result may rewrite or substitute into that prospective test.

## Ranking authority
UNCHANGED:
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP timing only
- WR-D001 ACTIVE

## Current role state
- Manager: IDLE after WR-028 roadmap planning
- Builder: ACTIVE — WR-026
- R&D: ACTIVE — WR-027
- Auditor: IDLE / waiting for WR-026

## Recommended next actions
1. R&D completes WR-027 and returns evidence for Manager review.
2. Manager uses WR-027 disposition to activate the next custom-ranking roadmap phase rather than ad hoc new experiments.
3. Builder continues WR-026 and reconciles with then-current main before declaring final audit-ready head.
4. Activate Auditor only when WR-026 is final, mergeable, and green.

## Blocking issues
- production custom-ranking authority remains unauthorized;
- rookie ranking remains unvalidated beyond the transparent prior;
- 2026 prospective proof remains frozen and pending future checkpoints;
- next custom-ranking phase is hard-blocked on WR-027 disposition.

## Checkpoint / SHA
Verify current canonical main after WR-028 roadmap reconciliation for the exact final SHA.
