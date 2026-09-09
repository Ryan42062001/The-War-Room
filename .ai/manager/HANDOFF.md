# Manager / Architect Handoff

HANDOFF

Task ID: PW-003 / WR-025 / WR-026
Role: Manager / Architect
Status: PW-003 ACTIVE / WR-025 ACTIVE / WR-026 ACTIVE

## Verified starting state
- canonical `main` before new assignment commits: `9cc60b590b6d6cfe17c19a1cb78e06956d7b7944`
- open PRs at assignment time: NONE
- project was MAINTENANCE / STABLE — prospective validation frozen
- WR-021 and WR-023 were COMPLETE / ACCEPTED / MERGED
- production ranking authority remained FantasyPros under WR-D001
- all workers were idle before the new user requirements

## New user triggers
Two explicit requirements reactivated bounded work:

1. Historical ranking research:
   - use previous seasons to determine which statistics/context identify stronger future fantasy players;
   - identify warning signals associated with underperformance/bust risk;
   - get a research-only custom historical ranking prototype working.

2. Phone usability:
   - current phone view feels like one big list and is not useful enough;
   - desktop view is liked and must NOT be changed;
   - optimize only the phone experience for faster draft decisions.

## Parallelism decision
Created PW-003 because the two tasks are INDEPENDENT.

### WR-025 — Historical Ranking Signal / Breakout-Bust Research
Assigned role: Research & Development (R&D)
Status: ACTIVE
Task: `.ai/manager/WR-025.md`
Production authorization: NONE

Key requirements:
- historical rights-clean sources only;
- identify stable positive/upside and negative/downside signals by position;
- build a research-only ranking prototype;
- define bust/downside relative to a preseason baseline unless a lawful historical draft-cost source is found;
- no causal overclaiming;
- no 2026 outcome inspection;
- do not modify the frozen WR-021 2026 snapshot, WR-023 protocol, protocol manifest, or gate;
- no production ranking changes;
- leave research PR open for Manager review.

### WR-026 — Phone-Only Decision View Optimization
Assigned role: Implementation Engineer / Builder
Status: ACTIVE
Task: `.ai/manager/WR-026.md`
Production authorization: YES — phone UI/layout only
Independent audit required: YES

User requirement boundary:
- phone only, preferably <=600px;
- desktop/tablet >600px must remain visually and behaviorally unchanged.

Target experience:
- decision-first opening state;
- recommendation/urgency and actionable players visible quickly;
- one primary position context at a time instead of all full position lists stacked vertically;
- one-tap position switcher;
- bounded top relevant tier/player set with explicit Show more/full-list access;
- preserve Position/Overall, My Draft, search, Taken/Mine, target stars, Manage, ESPN health, targets/change feed, K/DST;
- no ranking/scoring/recommendation/state/persistence/ESPN semantic change.

Required phone baselines/tests:
- 320x700
- 375x812
- 390x844
- 430x932

Required desktop/tablet regression guard:
- 768x1024
- 820x900
- 900x900
- 1280x800
- 1440x900

Builder must not merge. Final mergeable green WR-026 PR goes to Independent Auditor before Manager release decision.

## Frozen prospective ranking contract
UNCHANGED.

WR-023 protocol SHA-256:
`f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`

WR-021 snapshot SHA-256:
`9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`

WR-025 is separate retrospective research. It may not alter or contaminate the frozen 2026 prospective evaluation.

## Ranking authority
UNCHANGED:
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP timing only
- WR-D001 ACTIVE

## Current role state
- Manager: IDLE after assignment/reconciliation
- Builder: ACTIVE — WR-026
- R&D: ACTIVE — WR-025
- Auditor: IDLE / waiting for WR-026

## Recommended next actions
1. Builder creates a dedicated WR-026 branch from refreshed canonical main, measures current phone behavior before edits, implements phone-only decision view, runs phone + desktop regression tests/full CI, opens PR, and stops for audit.
2. R&D creates a dedicated WR-025 branch from refreshed canonical main, performs rights-clean historical signal/ranking research only, opens research PR if appropriate, and stops for Manager review.
3. Do not activate Auditor until WR-026 is final, mergeable, and green.
4. Manager reviews WR-025 independently when complete and activates Auditor for WR-026 when its release gate is ready.

## Blocking issues
None at assignment time.

## Checkpoint / SHA
Verify current canonical `main` after this Manager reconciliation; assignment commits advanced main beyond `9cc60b590b6d6cfe17c19a1cb78e06956d7b7944`.
