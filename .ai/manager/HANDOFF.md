# Manager / Architect Handoff

HANDOFF

Task ID: WR-010
Role: Manager / Architect
Status: ASSIGNED TO R&D / AWAITING EVIDENCE

## Verified starting state

- Repository: `Ryan42062001/The-War-Room`
- Canonical `main` before WR-010 assignment: `2cab85f981e06f5f19bd4a7631a28adf2f7ff351`
- Project mode before assignment: MAINTENANCE / STABLE
- No active production milestone
- Current ranking/value authority: FantasyPros 2026 PPR ECR
- ESPN rank/ADP remains timing/market information
- Builder: IDLE
- R&D: IDLE before WR-010
- Auditor: IDLE

## Maintenance trigger

The user asked whether the War Room can identify the most accurate publicly available rankings and automatically pull them into the War Room.

Manager classification:
- materially valuable opportunity
- possible seasonal/data-refresh improvement

This is sufficient to activate bounded R&D under maintenance governance, but not sufficient to authorize production implementation.

## Active task

**WR-010 — Ranking Accuracy & Automated Ingestion Feasibility**

Assigned role:
Research & Development (R&D)

Task spec:
`.ai/manager/WR-010.md`

Starting SHA:
`2cab85f981e06f5f19bd4a7631a28adf2f7ff351`

Production implementation authorization:
**NONE**

## Manager preliminary research

Current public evidence indicates:
- FantasyPros publishes an objective preseason Draft Accuracy competition and multi-year leaderboard.
- Current 2023–2025 multi-year public results list Jody Smith first, Sean Koerner second, and Joey Wright third.
- The 2025 single-season draft-accuracy leader was Seth Miller.
- FantasyPros' Draft Accuracy methodology uses Half-PPR, while the War Room's production value authority is PPR. Therefore the leaderboard cannot be treated as direct proof of one best PPR expert without qualification.
- FantasyPros now advertises an official API that supports PPR consensus rankings, per-expert rankings, expert filtering, expert metadata, tiers/spread, and player metadata.
- The API offers free prototyping and paid/premium personal production access, but published terms/access restrictions must be reviewed for compatibility with the intended War Room use case before any production recommendation.

Manager preliminary architecture hypothesis:
The strongest eventual design may be a multi-year-accuracy-selected PPR expert cohort (rather than one expert), refreshed through a supported API and protected by strict completeness/freshness/provenance/last-known-good gates. This is only a hypothesis for R&D to test.

## Required R&D determination

R&D must decide:
1. what "most accurate" should mean for a PPR redraft War Room
2. whether a single expert, top-N accurate-expert consensus, recency-weighted cohort, accuracy-weighted cohort, or current broad ECR is strongest
3. whether the improvement over the current baseline is material
4. whether a supported automatic ingestion route exists
5. whether access/license evidence supports the intended use or requires provider clarification
6. how a production importer would fail closed and preserve ranking authority

Required recommendation outcome:
- READY FOR MANAGER MILESTONE CONSIDERATION
- R&D ONLY / MORE EVIDENCE NEEDED
- DO NOT PURSUE

## Work completed by Manager

- refreshed current maintenance-state repository checkpoint
- performed preliminary current web research on FantasyPros accuracy methodology, multi-year leaders, official API capabilities, pricing/access, and usage terms
- identified the Half-PPR-vs-PPR methodological caveat
- created `.ai/manager/WR-010.md`
- activated WR-010 as a maintenance-trigger R&D task
- updated PROJECT_STATE and ROADMAP without reopening a production milestone
- seeded `.ai/research/HANDOFF.md`
- explicitly prohibited production implementation and secret/API-key commits
- evaluated parallelism

## Dependency / parallelism analysis

WR-010: **INDEPENDENT**

No Builder result is required.
No Auditor result is required for the research phase.
No second legitimate approved specialist task exists.

Parallel Work Wave: none.

## Decisions made

- the user's ranking-refresh idea is a legitimate maintenance trigger worth evidence-backed R&D
- current MAINTENANCE / STABLE project mode remains in force
- no production ranking authority change is approved
- no automatic API integration is approved
- R&D should prefer supported machine-readable sources over brittle scraping when feasible
- historical accuracy must be judged over multiple seasons and must explicitly account for scoring-format mismatch
- a single year's #1 expert is not enough evidence to replace consensus authority

## Files updated

- `.ai/manager/WR-010.md`
- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/research/HANDOFF.md`
- `.ai/manager/HANDOFF.md`

## Files intentionally unchanged

- `.ai/shared/DECISIONS.md`
- production ranking/scoring/data files

## Blocking issues

None for R&D investigation.

Production implementation remains blocked until Manager reviews completed WR-010 evidence and creates a separate approved production task if warranted.

## Recommended next role

Research & Development (R&D)

## Exact next action

R&D refreshes canonical state and executes WR-010. It should independently research historical ranking accuracy and PPR relevance, inspect the current ranking import pipeline, evaluate the FantasyPros API and alternative supported sources, assess access/license constraints, and return a production-safe ingestion recommendation without changing production code.

## Checkpoint / SHA

WR-010 starting checkpoint: `2cab85f981e06f5f19bd4a7631a28adf2f7ff351`.
Verify current `main` after these Manager-owned assignment commits for the exact canonical SHA.
