# War Room Roadmap

Status: ACTIVE DEVELOPMENT — PHONE RE-AUDIT + CUSTOM-ENGINE AVAILABILITY FINALIZATION
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
- WR-029 — COMPLETE / ACCEPTED / MERGED via PR #121; no advanced enrichment family earned promotion
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
WR-028 remains the architecture plan. Before `ENGINE-COMPLETE` / `SHADOW-READY`, resolve and preserve point-in-time/provenance, missing-data/fallback, calibrated uncertainty, ranking sensitivity, deterministic tiers, league replacement/FLEX value, K/DST policy, player-universe/eligibility, versioning, rollback, refresh/source-failure/drift handling, explainability, market separation, and independent reproducibility/audit.

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
Transparent position + draft-capital prior remains benchmark unless a lawful chronological challenger wins. May run independently when useful.

### Phase 4 — Availability / expected-games model — FINALIZATION IN PROGRESS
WR-034 research execution has produced a completed research report and generated evidence on branch `wr-034-availability-expected-games` at checkpoint `a0b39354398629da0822cc54357cde8932b926c2`. Manager disposition is not yet available because the required R&D handoff and research PR are not finalized. R&D remains active only to complete that deliverable.

### Phase 5 — Season-total distribution — PLANNED / HARD BLOCKED ON WR-034 MANAGER DISPOSITION
Combine frozen expected performance with the accepted expected-games architecture and calibrated uncertainty after Manager accepts/rejects WR-034.

### Phase 6 — Replacement / cross-position draft value — PLANNED
Leading advisory candidate remains deterministic eligibility-constrained league-wide starter assignment with marginal starter value, FLEX/Superflex eligibility allocation, bench outside the primary starter baseline, risk warning-only, K/DST separate, and no double-counting with overlapping intrinsic VORP/scarcity. This is not frozen; upstream Phase-4/5 contracts still govern sequencing.

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
Current remediated head: `0640967d5793e8828c5acf5b16f5bc6f2fc251f5`
Builder remediation for `WR-031-AUD-01` and `WR-031-AUD-02` is complete with focused regression coverage and green exact-head PR-triggered CI. Builder is idle pending independent re-audit.

### WR-031 — Independent Audit of WR-026
Role: Auditor
Status: ASSIGNED — RE-AUDIT
Audit cycle 1 verdict was `FAIL — REMEDIATION REQUIRED`. The blocking dependency is cleared. Re-audit exact head `0640967d5793e8828c5acf5b16f5bc6f2fc251f5`, both prior findings, regression scope, CI, and preserved boundaries. Do not merge.

## PW-004 — ACTIVE
Two independent lanes are valid now:
- WR-031 — Auditor — re-audit remediated PR #120;
- WR-034 — R&D — finalize required handoff and Manager-review-ready research PR.

Builder and Draft Strategy are idle because no current task requires further work from them.

## Current roles
- Manager: IDLE after reconciliation
- Builder: IDLE — WR-026 AUDIT_READY
- Draft Strategy: IDLE
- R&D: ACTIVE — WR-034 finalization only
- Auditor: ACTIVE — WR-031 re-audit
- Temporary Troubleshooting: NOT INSTANTIATED
