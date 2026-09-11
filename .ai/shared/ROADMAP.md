# War Room Roadmap

Status: ACTIVE DEVELOPMENT — RETURNING-PLAYER V2 EVIDENCE RESET
Last updated: 2026-09-11
Owner: Manager / Architect

## Production baseline
FantasyPros remains production ranking authority under WR-D001. ESPN rank/ADP remains downstream market timing only. WR-021 / WR-023 prospective artifacts remain frozen and untouched.

## Workflow governance
WR-041 establishes **Work Helper / Super Troubleshooter / Cross-Functional Operator** as a permanent privileged troubleshooting role.

This is workflow/control-plane architecture only. It does not change football-model policy, production ranking authority, or research milestone requirements.

Work Helper remains IDLE unless Manager assigns a real bounded troubleshooting task. Its no-fixed-attempt-limit exemption applies only to evidence-driven troubleshooting under Manager-defined scope; independent audit and Manager merge/governance gates remain intact.

## Ranking R&D history
- WR-018 — COMPLETE / MORE EVIDENCE NEEDED
- WR-021 — COMPLETE / PROMISING — CONTINUE VALIDATION / research only
- WR-023 — COMPLETE / prospective protocol frozen
- WR-025 — COMPLETE / ACCEPTED / returning-player Ridge mean projection promising
- WR-027 — COMPLETE / ACCEPTED / risk warning-only; Huber rejected
- WR-029 — COMPLETE / ACCEPTED / no advanced enrichment family promoted
- WR-033 — COMPLETE / CLOSED / Returning-Player v1 Specification Freeze
- WR-034 — COMPLETE / ACCEPTED / expected-games model supported
- WR-035 — CLOSED / INSUFFICIENT EVIDENCE FOR PHASE-5 ACCEPTANCE
- WR-036 — COMPLETE / FAIL — REMEDIATION REQUIRED
- WR-037 — CLOSED / REMEDIATION BLOCKED — UPSTREAM IDENTITY NOT PROVABLE
- WR-038 — CLOSED / NOT ACTIVATED / SUPERSEDED
- WR-039 — ASSIGNED / Returning-Player v2 prospective evidence-contract freeze
- WR-040 — BLOCKED / independent evidence-contract audit
- WR-041 — COMPLETE / permanent Work Helper super-troubleshooter workflow role

## Historical returning-player architecture
- cohort: returning QB/RB/WR/TE; rookies separate;
- historical v1 expected performance: exact WR-025 position-specific `StandardScaler -> Ridge(alpha=100)` under WR-D005;
- risk: WR-027 position-specific warning/explanation-only;
- Huber: NOT ADOPTED;
- WR-029 enrichment: NONE PROMOTED;
- historical v1 availability/continuation: WR-034 stats-only position-specific `RIDGE_FULL` under WR-D006;
- production authority: UNCHANGED under WR-D001.

The v1 architecture remains historically documented. WR-D007 does not rewrite it and does not claim that newly sourced metadata can reproduce the deleted frozen WR-033 upstream asset.

## Roadmap phases
### Phase 0 — Evidence foundation — COMPLETE
WR-018 / WR-021 / WR-023 / WR-025.

### Phase 1 — Position-specific risk calibration — COMPLETE
WR-027 accepted.

### Phase 1.5 — Advanced context enrichment — COMPLETE
WR-029 accepted. No enrichment family promoted.

### Phase 2 — Returning-player v1 specification freeze — COMPLETE / HISTORICAL
WR-033 / WR-D005.

Its specification remains a valid historical research decision, but later Phase-5 exact-composition certification is blocked by unavailable upstream evidence for the complete scored cohort.

### Phase 3 — Rookie engine v1 — PLANNED
Transparent position + draft-capital prior remains benchmark unless a lawful chronological challenger wins. May run independently when useful.

### Phase 4 — Availability / expected-games model — COMPLETE
WR-034 accepted / merged via PR #123. `RIDGE_FULL` remains accepted as a separate historical availability/continuation expectation with broad uncertainty and warning-only logit outputs.

### Phase 5A — v1 season-total composition — CLOSED / INSUFFICIENT EVIDENCE
WR-035 / PR #124 proposed `INDEPENDENCE PRODUCT SUPPORTED`, but WR-036 returned `FAIL — REMEDIATION REQUIRED`.

WR-037 could not satisfy the mandatory exact full-cohort frozen-WR-033 identity gate because the original nflverse Players asset is deleted and no retained artifact contains trustworthy keyed features/predictions for all 3,508 scored rows, especially 1,627 zero-game rows.

Final blocker head: `701bd4924a8595f2e17d946b39b1189ac2ef7eea`.
Exact-head CI run `34587084283`: SUCCESS.

Per WR-D007:
- do not weaken replay equivalence;
- do not merge PR #124 as an accepted Phase-5 result;
- preserve the substituted-input experiment only as informative historical research;
- close the v1 path as insufficiently provable.

WR-038 is therefore closed without activation.

### Phase 5B — Returning-Player v2 evidence reset — ACTIVE
WR-D007 authorizes a new explicitly versioned research path beginning with evidence custody, not model scoring.

#### WR-039 — Prospective evidence contract — ASSIGNED
Freeze BEFORE scoring:
- exact source/version/cutoff inventory;
- rights/license/redistribution classification;
- durable project-controlled retention where lawful;
- audit-safe derived evidence when raw bytes cannot lawfully be retained;
- complete keyed features/preprocessing/predictions for every future scored row;
- deterministic environment/code/source/model lock surface;
- fail-closed behavior;
- explicit v1/v2 non-equivalence.

WR-039 is forbidden from scoring or evaluating the new model.

#### WR-040 — Independent contract audit — BLOCKED
Audit the immutable WR-039 contract before any new v2 scoring task may exist.

PASS-family WR-040 -> Manager may authorize a new Returning-Player v2 scoring/evaluation task under the exact audited contract.

The later v2 model task must itself preserve development/confirmation chronology and cannot inspect 2026 outcomes. A later season-total composition and independent audit will still be required before downstream value work.

### Phase 6 — Replacement / cross-position draft value — BLOCKED ON ACCEPTED V2 SEASON-TOTAL PATH
Leading advisory candidate remains deterministic eligibility-constrained starter assignment / marginal starter value (MSV). FLEX/Superflex, bench policy, scoring scope, eligibility versioning, solver determinism, below-frontier ordering, and tier gates remain explicit Phase-6 questions.

Do not activate or freeze Phase-6 work until the v2 evidence contract is audited, the subsequent v2 expected-performance/season-total research is independently accepted, and Manager explicitly opens the gate.

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
- Manager: IDLE after WR-041 integration
- Builder: IDLE
- Draft Strategy: IDLE
- R&D: ACTIVE/ASSIGNED — WR-039
- Auditor: IDLE — WR-040 blocked
- Work Helper: IDLE — permanent role, no active troubleshooting task
