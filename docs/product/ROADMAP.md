# The War Room — Product Roadmap

This is the canonical forward-looking roadmap under Speed Workflow V2.1. Historical WR task/control-plane state remains preserved under `.history/workflow-v3-5/` for traceability and is not active governance.

## Product north star

When Ryan is on the clock, The War Room should surface the strongest available decision, explain the opportunity cost of waiting, and make that reasoning understandable in under five seconds.

The roadmap is therefore organized around draft-day product value rather than around individual integration experiments.

## Current baseline

The mature draft-day foundation already includes:

- a FantasyPros-authoritative 717-player board and tiers;
- roster tracking and recommendation logic;
- next-turn market timing using ESPN rank/ADP signals;
- browser-local draft sessions and persistence/recovery;
- responsive/mobile layouts;
- post-draft reporting;
- a read-only ESPN Companion.

WR-P01 is CLOSED. Exact-current owner-operated evidence established the visible Board/Pick History fallback for one disposable 10-team × 16-round Full-PPR snake mock at slot 5 through all 160 numbered picks, correct Mine ownership, authoritative completion, and same-session reload without ledger drift.

That fallback path is the supported ESPN synchronization path for now within the tested WR-P01 envelope. Structured Direct remains unverified and is not on the critical-path roadmap.

## Phase sequence

| Phase | Capability | Expected risk | Status |
| --- | --- | --- | --- |
| WR-P01 | ESPN Board-Fallback Reliability Gate | HIGH | CLOSED |
| WR-P02 | Draft-Day UX & Command Center | MEDIUM | PLANNED NEXT |
| WR-P03 | Recommendation Engine V2 | MEDIUM | FUTURE |
| WR-P04 | League & Roster Personalization | MEDIUM | FUTURE |
| WR-P05 | Pre-Draft Strategy & Planning | MEDIUM | FUTURE |
| WR-P06 | Data Freshness & Season Readiness | MEDIUM | FUTURE |
| WR-P07 | Draft Simulator & Regression Lab | MEDIUM | FUTURE |
| WR-P08 | Production Season Release | HIGH | FUTURE |

Expected risk is planning guidance only; the exact risk tier is set when each phase is activated.

## WR-P01 — ESPN Board-Fallback Reliability Gate

**Status: CLOSED**

Accepted result:

- Board/Pick History fallback is reliable enough within the observed WR-P01 envelope to serve as the supported ESPN synchronization path for now.
- Companion terminal state reached 160 captured / 160 applied / 160 acknowledged / 0 unmatched.
- War Room ownership, completion, and same-session persistence were correct.
- No bounded product defect requiring remediation was established.
- Structured Direct was not validated.
- A LOW diagnostics-clarity item remains backlogged: `unresolvedPlayerIds` is structured-observation telemetry but is presented close enough to accepted-ledger counts to be misread.

WR-P01 does not establish broader ESPN-format coverage, Structured Direct support, production recovery readiness, ESPN write authority, or production deployment.

## WR-P02 — Draft-Day UX & Command Center

**Status: PLANNED NEXT**

Make the supported draft-day experience exceptionally fast and understandable under a live pick clock.

Candidate scope:

- reorganize the primary decision surface around who to take, why, what happens if the pick waits, and what the roster still needs;
- make the top actionable choices and tier pressure immediately visible;
- clarify ESPN connection, Board/Pick History fallback, progress, stale-session, and recovery status;
- resolve the WR-P01 LOW diagnostic-label ambiguity around structured observations;
- make Mine/Taken correction workflows fast and obvious;
- improve keyboard and low-friction draft-day interactions where useful;
- tighten phone and laptop command-center layouts;
- improve truthful error and degraded-state UX;
- harden refresh/reopen behavior that directly affects the on-the-clock experience.

Non-goals:

- no new ranking authority;
- no Structured Direct validation;
- no ESPN write permissions;
- no recommendation-policy retuning unless required by a demonstrated UX correctness defect.

**Decision after phase:** is the on-the-clock experience clear and fast enough that Ryan can understand the current recommendation and its tradeoffs in under five seconds?

## WR-P03 — Recommendation Engine V2

**Status: FUTURE**

Improve the quality and explanation of draft decisions while preserving the separation between player value and market timing.

Candidate scope:

- tier-cliff awareness;
- replacement value and opportunity cost;
- positional scarcity;
- roster construction and starter-versus-bench context;
- FLEX-aware value;
- draft-stage context;
- next-turn survival as a timing input rather than player-value authority;
- explicit value of picking now versus waiting;
- clearer comparison among the top candidate choices;
- deterministic explanation of the factors that actually drove the recommendation.

FantasyPros ECR remains player-value authority. ESPN market signals may change timing but do not rewrite player rankings. Do not fabricate calibrated confidence or survival probabilities.

**Decision after phase:** does the engine materially improve real draft decisions without becoming opaque, overfit, or source-confused?

## WR-P04 — League & Roster Personalization

**Status: FUTURE**

Make recommendations respond to the league that is actually being drafted rather than only to a generic PPR shape.

Candidate scope:

- configurable starter slots;
- RB/WR/TE/FLEX composition;
- bench depth;
- league size and round count interactions;
- supported PPR scoring variants where source data and logic are valid;
- roster-construction logic driven from the same canonical league configuration;
- validation that recommendations and completion logic remain consistent across supported configurations.

Standard redraft remains the target. Auction, dynasty, keeper, and exotic formats are outside the phase unless explicitly added during activation. Superflex/2QB should be treated as a separate deliberate expansion, not silently inferred.

**Decision after phase:** is the recommendation engine sufficiently personalized for the supported range of normal redraft leagues?

## WR-P05 — Pre-Draft Strategy & Planning

**Status: FUTURE**

Make The War Room useful before the ESPN draft room opens.

Candidate scope:

- slot-specific draft plans;
- expected decision zones around each own turn;
- position and tier targets;
- tier-cliff warnings;
- positions that can reasonably be deferred;
- contingency branches when target players disappear;
- a short owner-curated target/fade/watch list where useful;
- handoff from pre-draft plan into the live recommendation experience.

Plans must be presented as strategy and market heuristics, not guaranteed forecasts.

**Decision after phase:** does Ryan enter a draft with a useful plan that the live engine can adapt rather than replace?

## WR-P06 — Data Freshness & Season Readiness

**Status: FUTURE**

Make the quality and freshness of draft-day inputs obvious and fail closed when the source state is not trustworthy.

Candidate scope:

- visible FantasyPros and ESPN data freshness;
- validated ranking-import workflow;
- stale or incomplete source warnings;
- player identity/position reconciliation;
- point-in-time provenance for admitted datasets;
- season-rollover readiness;
- injury/status integration only if a lawful, reliable source is separately approved;
- a clear draft-readiness health check.

Do not silently add ranking providers, fabricate missing ECR, or change the ECR/market authority split.

**Decision after phase:** can Ryan tell at a glance whether the War Room's inputs are current and safe to use on draft day?

## WR-P07 — Draft Simulator & Regression Lab

**Status: FUTURE**

Create a reusable synthetic environment for testing recommendation behavior and draft-state reliability at scale without consuming live ESPN mocks.

Candidate scope:

- large batches of synthetic snake drafts across draft slots;
- supported league-configuration matrices;
- recommendation behavior by draft stage;
- roster-balance and positional-allocation diagnostics;
- tier-cliff and market-timing scenarios;
- reconnect/reorder/duplicate/stale-state regression;
- deterministic scenario fixtures for recommendation changes;
- comparison of engine revisions before acceptance.

The simulator is an evaluation and regression tool, not an autonomous weight-tuning system. Recommendation-policy changes still require explicit review.

**Decision after phase:** do we have enough synthetic coverage to change recommendation logic with high confidence and minimal reliance on live mocks?

## WR-P08 — Production Season Release

**Status: FUTURE**

Create and freeze a trustworthy draft-season baseline.

Candidate scope:

- supported-envelope definition;
- full desktop/phone draft-day regression;
- service-worker/cache/offline validation;
- extension/version compatibility;
- current-season data readiness;
- known-limitations review;
- final documentation;
- exact release candidate FULL CI;
- fresh risk-based audit;
- production-release checklist.

Completing WR-P08 may establish a production-ready candidate, but actual production deployment remains a separate explicit Product Owner authorization.

**Decision after phase:** is this the baseline to freeze for real draft-season use?

## Backlog — not roadmap commitments

### Structured Direct ESPN mode

Structured Direct remains unverified. It is not assigned a phase number and is not required for the supported Board/Pick History fallback path.

Reconsider it only if a concrete user benefit justifies the added integration complexity and HIGH-risk live-validation burden.

### Season-long fantasy features

Waivers, trades, lineup management, matchup advice, and other season-long workflows are intentionally outside the current roadmap. Revisit only after the draft product reaches a stable season baseline.

### AI-assisted explanations

Do not add an AI layer merely to make the product appear more intelligent. If used later, it must solve a specific user problem while the deterministic recommendation engine and canonical ranking sources remain authoritative.

### Unsupported draft formats

Auction, dynasty, keeper, and other materially different formats are outside the current roadmap. Superflex/2QB may become a future deliberate expansion after the standard-redraft personalization model is proven.

## Sequencing rule

The intended sequence is:

**Reliable sync ✅ → Draft-Day UX → Recommendation Engine V2 → League Personalization → Pre-Draft Planning → Data Freshness → Simulator/Regression Lab → Production Season Release**

Do not activate multiple product phases in parallel by default. Each phase must define its exact contract from the then-current baseline before BUILDING.

## Persistent boundaries

- FantasyPros ECR remains player-value authority; ESPN signals remain market timing.
- ESPN integration remains read-only.
- Missing/ambiguous identities and live-source conflicts fail closed.
- Private owner data never enters GitHub/CI/shared evidence.
- Structured Direct remains optional and unverified unless separately authorized.
- Production deployment is a separate explicit Product Owner decision.
