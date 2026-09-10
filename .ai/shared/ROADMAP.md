# War Room Roadmap

Status: ACTIVE DEVELOPMENT — PHONE UX AUDIT + CUSTOM-ENGINE AVAILABILITY RESEARCH
Last updated: 2026-09-10
Owner: Manager / Architect
Workflow: V3

## Production baseline
FantasyPros remains production ranking authority under WR-D001. ESPN rank/ADP remains downstream market timing only. WR-021 / WR-023 prospective artifacts remain frozen and untouched.

## Ranking R&D history
- WR-018 — COMPLETE / MORE EVIDENCE NEEDED
- WR-021 — COMPLETE / PROMISING — CONTINUE VALIDATION / research only
- WR-023 — COMPLETE / prospective protocol frozen
- WR-025 — COMPLETE / ACCEPTED / returning-player Ridge mean projection promising; universal risk penalty rejected
- WR-027 — COMPLETE / ACCEPTED / MERGED; Ridge retained, risk warning-only, Huber rejected
- WR-029 — COMPLETE / ACCEPTED / MERGED via PR #121 at `f079220e8ed07280d08f13c5db006661728d7f35`; no advanced enrichment family earned promotion
- WR-033 — COMPLETE / CLOSED / Returning-Player v1 Specification Freeze

## Returning-player v1 frozen architecture
- cohort: returning QB/RB/WR/TE; rookies separate;
- expected-performance ordering: exact WR-025 feature matrix with position-specific `StandardScaler -> Ridge(alpha=100)`;
- risk: WR-027 position-specific calibrated warning/explanation outputs only;
- direct risk rank modifier: NONE;
- Huber replacement: NOT ADOPTED;
- WR-029 enrichment families: NONE PROMOTED;
- historical research/evaluation cutoff: September 1 12:00 UTC of target season;
- governance: immutable source/version/provenance/schema identities, point-in-time joins, explicit missingness/coverage/confidence, training-only imputation, fail-closed handling, and deterministic `LOCKED_RIDGE` fallback;
- production authority: UNCHANGED under WR-D001.

## Cross-cutting engine contracts
WR-028 remains the architecture plan. Before `ENGINE-COMPLETE` / `SHADOW-READY`, resolve and preserve:
- point-in-time feature store/cutoff semantics;
- immutable source/schema/manifests/hashes;
- missing-data and fallback policy;
- per-player/family coverage and confidence;
- calibrated uncertainty and ranking sensitivity;
- uncertainty-aware deterministic tiers;
- league replacement/FLEX/value contract;
- K/DST separate policy;
- late entrants and position-change/eligibility policy;
- data/model/value/board versioning;
- Champion/Challenger governance;
- Last-Known-Good rollback;
- preseason refresh cadence;
- source-failure and drift handling;
- explainability/version/as-of output;
- FantasyPros external-benchmark boundary;
- strict separation of intrinsic custom value from ESPN/live-draft strategy;
- deterministic reproducibility and independent leakage/provenance audit.

## Roadmap phases
### Phase 0 — Evidence foundation — COMPLETE
WR-018 / WR-021 / WR-023 / WR-025.

### Phase 1 — Position-specific risk calibration — COMPLETE
WR-027 accepted.

### Phase 1.5 — Advanced context enrichment — COMPLETE
WR-029 accepted. Negative adoption result: no enrichment family promoted; governance evidence retained.

### Phase 2 — Returning-player v1 specification freeze — COMPLETE
WR-033. Fixed returner architecture recorded under WR-D005.

### Phase 3 — Rookie engine v1 — PLANNED
Transparent position + draft-capital prior remains benchmark unless a lawful chronological challenger wins. May run independently of Phase 4 when useful.

### Phase 4 — Availability / expected-games model — ACTIVE
WR-034 assigned to R&D. Model availability separately from expected PPR/game. Do not claim medical/injury prediction without admitted medical/injury evidence.

### Phase 5 — Season-total distribution — PLANNED / HARD BLOCKED ON WR-034
Combine frozen expected performance with accepted expected-games architecture and calibrated uncertainty.

### Phase 6 — Replacement / cross-position draft value — PLANNED
League-specific VORP/FLEX/scarcity; market timing remains separate.

### Phase 7 — Complete historical replay — PLANNED
Evaluate whole board/rank/tier/value/warning behavior across prior fake preseasons.

### Phase 8 — 2026 custom development board — PLANNED
Use only frozen/preseason inputs; label DEVELOPMENT / post-kickoff architecture, not a new pristine prospective test.

### Phase 9 — Shadow production integration — PLANNED
Builder + Auditor; FantasyPros stays authoritative.

### Phase 10 — Independent engine QA — PLANNED
Rights/PIT/reproducibility/value/tier/fallback/rollback/authority audit.

### Phase 11 — WR-023 2026 prospective validation — FROZEN / EVENT-DRIVEN
Optional Week 4/8/13 descriptive checkpoints; completed Week 18 regular season decisive.

### Phase 12 — Production-ranking promotion decision — FUTURE / CONDITIONAL
Requires engine/audit gates, final WR-023 gate and a separate durable Manager decision.

## Phone UX lane
### WR-026 — Phone-Only Decision View Optimization
Role: Builder
Status: AUDIT_READY
PR: #120

### WR-031 — Independent Audit of WR-026
Role: Auditor
Status: ASSIGNED

## PW-004 — ACTIVE
Two independent lanes are valid in parallel:
- WR-031 — Auditor — phone release gate for PR #120;
- WR-034 — R&D — expected-games/availability research.

Dependency: `INDEPENDENT` across lanes. Builder and Draft Strategy remain idle because no current task requires them.

## Current roles
- Manager: IDLE after reconciliation
- Builder: IDLE
- Draft Strategy: IDLE
- R&D: ACTIVE — WR-034
- Auditor: ACTIVE — WR-031
- Temporary Troubleshooting: NOT INSTANTIATED
