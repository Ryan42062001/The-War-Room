# War Room Roadmap

Status: ACTIVE DEVELOPMENT — PHASE 5 SEASON-TOTAL DISTRIBUTION
Last updated: 2026-09-10
Owner: Manager / Architect
Workflow: V3

## Production baseline
FantasyPros remains production ranking authority under WR-D001. ESPN rank/ADP remains downstream market timing only. WR-021 / WR-023 prospective artifacts remain frozen and untouched.

## Ranking R&D history
- WR-018 — COMPLETE / MORE EVIDENCE NEEDED
- WR-021 — COMPLETE / PROMISING — CONTINUE VALIDATION / research only
- WR-023 — COMPLETE / prospective protocol frozen
- WR-025 — COMPLETE / ACCEPTED / returning-player Ridge mean projection promising
- WR-027 — COMPLETE / ACCEPTED / risk warning-only; Huber rejected
- WR-029 — COMPLETE / ACCEPTED / no advanced enrichment family promoted
- WR-033 — COMPLETE / CLOSED / Returning-Player v1 Specification Freeze
- WR-034 — COMPLETE / ACCEPTED / expected-games model supported

## Frozen returning-player architecture
- cohort: returning QB/RB/WR/TE; rookies separate;
- expected performance: exact WR-025 position-specific `StandardScaler -> Ridge(alpha=100)`;
- risk: WR-027 position-specific calibrated warning/explanation outputs only;
- direct risk rank modifier: NONE;
- Huber: NOT ADOPTED;
- WR-029 enrichment: NONE PROMOTED;
- availability/continuation: WR-034 stats-only position-specific `RIDGE_FULL` with broad empirical uncertainty;
- <=8 and >=14 recorded-game `LOGIT_FULL` outputs: warning/explanation-only;
- fallback: expected-performance `LOCKED_RIDGE`; expected-games PREV_RATE then training-position mean with explicit fallback flag;
- production authority: UNCHANGED under WR-D001.

## Roadmap phases
### Phase 0 — Evidence foundation — COMPLETE
WR-018 / WR-021 / WR-023 / WR-025.

### Phase 1 — Position-specific risk calibration — COMPLETE
WR-027 accepted.

### Phase 1.5 — Advanced context enrichment — COMPLETE
WR-029 accepted. No enrichment family promoted.

### Phase 2 — Returning-player v1 specification freeze — COMPLETE
WR-033 / WR-D005.

### Phase 3 — Rookie engine v1 — PLANNED
Transparent position + draft-capital prior remains benchmark unless a lawful chronological challenger wins. May run independently when useful.

### Phase 4 — Availability / expected-games model — COMPLETE
WR-034 accepted / merged via PR #123. `RIDGE_FULL` supported as a separate availability/continuation expectation; broad uncertainty required; warning models remain non-ranking.

### Phase 5 — Season-total distribution — ACTIVE
WR-035 assigned to R&D. Compose frozen WR-033 expected PPR/game with accepted WR-034 expected games without retuning either upstream layer. Explicitly test the simple independence product against predeclared dependence-aware alternatives and produce calibrated season-total uncertainty suitable for downstream value work.

### Phase 6 — Replacement / cross-position draft value — PLANNED
Leading advisory candidate remains deterministic eligibility-constrained starter assignment / marginal starter value (MSV). Do not freeze until Phase 5 supplies an accepted season-total contract. FLEX/Superflex, bench policy, scoring scope, eligibility versioning, solver determinism, and tier gates remain explicit Phase-6 questions.

### Phase 7 — Complete historical replay — PLANNED
Evaluate whole board/rank/tier/value/warning behavior across prior fake preseasons.

### Phase 8 — 2026 custom development board — PLANNED
Use frozen/preseason inputs only; post-kickoff development board, not a pristine prospective test.

### Phase 9 — Shadow production integration — PLANNED
Builder + Auditor; FantasyPros remains authoritative.

### Phase 10 — Independent engine QA — PLANNED
Rights/PIT/reproducibility/value/tier/fallback/rollback/authority audit.

### Phase 11 — WR-023 2026 prospective validation — FROZEN / EVENT-DRIVEN
Optional Week 4/8/13 descriptive checkpoints; completed Week 18 regular season decisive.

### Phase 12 — Production-ranking promotion decision — FUTURE / CONDITIONAL
Requires engine/audit gates, final WR-023 gate, and separate durable Manager decision.

## Phone UX lane
WR-026 / PR #120 — COMPLETE / MERGED. WR-031 re-audit — PASS. No unresolved findings. Physical-phone Level-4 remains unverified.

## Current roles
- Manager: IDLE after reconciliation
- Builder: IDLE
- Draft Strategy: IDLE
- R&D: ACTIVE — WR-035
- Auditor: IDLE
- Temporary Troubleshooting: NOT INSTANTIATED
