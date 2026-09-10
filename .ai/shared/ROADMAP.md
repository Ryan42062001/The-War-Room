# War Room Roadmap

Status: ACTIVE DEVELOPMENT — PW-003 PHONE UX + CUSTOM-RANKING ENRICHMENT
Last updated: 2026-09-09
Owner: Manager / Architect

## Production baseline
Draft-Day Layout Efficiency is complete. FantasyPros remains ranking authority under WR-D001; ESPN rank/ADP remains market timing only.

## Ranking R&D history
- WR-018 — COMPLETE / MORE EVIDENCE NEEDED
- WR-021 — COMPLETE / PROMISING — CONTINUE VALIDATION / research only
- WR-023 — COMPLETE / prospective protocol frozen
- WR-025 — COMPLETE / ACCEPTED / returning-player Ridge mean projection promising; universal risk penalty rejected
- WR-027 — COMPLETE / ACCEPTED / MERGED via PR #119 at `316160dee856d2445731fbb92fe63d7fd9cbdb7e`

## WR-027 accepted architecture
Entering the next phase:
- Ridge remains expected-performance ordering benchmark;
- QB/RB/WR/TE risk is warning/explanation-only;
- no direct risk rank modifier is supported;
- Huber is not adopted;
- rookies remain separate.

## WR-028 — Custom Ranking Engine Roadmap / Architecture Plan
Status: COMPLETE / AMENDED
Task: `.ai/manager/WR-028.md`

The roadmap targets `ENGINE-COMPLETE` and `SHADOW-READY` before season end while keeping production promotion gated on frozen WR-023 evidence.

Cross-cutting contracts now explicitly required:
- point-in-time feature store/cutoff semantics;
- immutable source/schema/manifests/hashes;
- missing-data and fallback policy;
- per-player/family coverage and confidence;
- calibrated uncertainty and ranking sensitivity;
- uncertainty-aware deterministic tiers;
- league replacement/FLEX/value contract;
- K/DST separate policy;
- late entrant and position-change/eligibility policy;
- data/model/value/board versioning;
- Champion/Challenger governance;
- Last-Known-Good rollback;
- preseason refresh cadence;
- source-failure and drift handling;
- explainability/version/as-of output;
- FantasyPros external-benchmark boundary;
- strict separation of intrinsic custom value from ESPN/live-draft strategy;
- deterministic reproducibility and independent leakage/provenance audit.

## Work-mode gap analysis disposition
Manager accepted the external Technical Research & Architecture Support report as advisory evidence.

Accepted direction:
- strengthen WR-029 rather than create a new task ID;
- lock the post-WR-027 benchmark before scoring enrichment;
- test long-history rights-clean PBP families first;
- require explicit rights/PIT/coverage exclusions;
- do not fabricate true routes/YPRR;
- treat source classifications as provisional until R&D independently verifies them.

## WR-029 — Advanced Context Feature Enrichment / Source Feasibility
Role: R&D
Status: ACTIVE
Task: `.ai/manager/WR-029.md`
Production authorization: NONE

Test order:
1. benchmark lock + cutoff/provenance contract;
2. long-history opportunity/red-zone/concentration;
3. long-history efficiency/regression;
4. QB decomposition + team pace/pass tendency/efficiency;
5. PBP-derived OL environment;
6. age/experience/draft-capital interactions;
7. PIT-audited depth/roster/vacated-opportunity context;
8. short-history scheme challenger;
9. staff continuity only after predeclared coverage/PIT threshold;
10. selected combined model and confirmation.

Every feature family must end as:
- `CORE MODEL SUPPORTED`
- `WARNING / EXPLANATION ONLY`
- `INSUFFICIENT EVIDENCE`
- `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE`

WR-029 must not inspect 2026 outcomes or modify WR-021/WR-023.

## Subsequent custom-engine phases
### Phase 2 — Returning-player v1 specification freeze — PLANNED / HARD BLOCKED ON WR-029
Freeze final features, preprocessing, model, cutoff/provenance, uncertainty and warning outputs.

### Phase 3 — Rookie engine v1 — PLANNED
Transparent draft-capital/position prior remains benchmark unless a lawful chronological challenger wins.

### Phase 4 — Availability / expected-games model — PLANNED
Separate availability from PPR/game; do not claim medical injury prediction without admitted evidence.

### Phase 5 — Season-total distribution — PLANNED
Expected PPR/game + expected games + calibrated uncertainty.

### Phase 6 — Replacement / cross-position draft value — PLANNED
League-specific VORP/FLEX/scarcity; market timing kept separate.

### Phase 7 — Complete historical replay — PLANNED
Evaluate whole board/rank/tier/value/warning behavior across prior fake preseasons.

### Phase 8 — 2026 custom development board — PLANNED
Use only frozen/preseason inputs; label as development/post-kickoff architecture, not a new pristine prospective test.

### Phase 9 — Shadow production integration — PLANNED
Builder + Auditor; FantasyPros stays authoritative.

### Phase 10 — Independent engine QA — PLANNED
Rights/PIT/reproducibility/value/tier/fallback/rollback/authority audit.

### Phase 11 — WR-023 2026 prospective validation — FROZEN / EVENT-DRIVEN
Optional Week 4/8/13 descriptive checkpoints; completed Week 18 regular season decisive.

### Phase 12 — Production-ranking promotion decision — FUTURE / CONDITIONAL
Requires engine/audit gates, final WR-023 gate and a separate durable Manager decision.

## PW-003 — ACTIVE
### WR-026 — Phone-Only Decision View Optimization
Role: Builder
Status: IN PROGRESS
PR: #120 draft
Independent audit required.

### WR-029 — Advanced Context Feature Enrichment
Role: R&D
Status: ACTIVE

Dependency: WR-026 vs WR-029 = INDEPENDENT.

## Current roles
- Manager: IDLE after WR-027 disposition / WR-029 activation
- Builder: ACTIVE — WR-026
- R&D: ACTIVE — WR-029
- Auditor: IDLE / waiting for WR-026 AUDIT_READY
