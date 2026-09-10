# War Room Project State

Status: ACTIVE DEVELOPMENT — PHONE UX + ADVANCED CUSTOM-RANKING ENRICHMENT
Last verified: 2026-09-09
Owner: Manager / Architect

## Canonical repository
Repository: `Ryan42062001/The-War-Room`
Branch: `main`
Workflow: V2
Fast-path task index: `.ai/shared/ACTIVE_TASKS.json`

## Production baseline
Ranking authority remains unchanged under WR-D001:
- FantasyPros Top-20 Experts 2026 PPR ECR primary
- broader FantasyPros PPR ECR fallback
- ESPN rank/ADP timing only

No custom-ranking research currently changes production rankings, scoring or recommendations.

## Frozen prospective ranking contract
### WR-021 — COMPLETE / ACCEPTED / MERGED
Context-enriched 2026 preseason shadow snapshot frozen.

### WR-023 — COMPLETE / ACCEPTED / MERGED
Prospective evaluation protocol frozen.

Immutable identities:
- protocol SHA-256: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`
- WR-021 snapshot SHA-256: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`

No post-kickoff historical-development task may inspect 2026 regular-season outcomes or modify/substitute these artifacts.

## Historical custom-ranking R&D
### WR-025 — COMPLETE / ACCEPTED / MERGED
Returning-player Ridge mean projection improved pooled historical MAE by 6.61% with favorable repeated-player-aware uncertainty. Universal risk overlay was not safe. Rookie richer model remained unvalidated.

### WR-027 — COMPLETE / ACCEPTED / MERGED
Research PR #119 merged as `316160dee856d2445731fbb92fe63d7fd9cbdb7e`.

Accepted architecture result:
- Ridge remains mean expected-performance ordering benchmark;
- QB risk: WARNING-ONLY SUPPORTED;
- RB risk: WARNING-ONLY SUPPORTED;
- WR risk: WARNING-ONLY SUPPORTED;
- TE risk: WARNING-ONLY SUPPORTED;
- no direct risk rank modifier passed the predeclared prior-only guard;
- Huber robust-regression challenger not supported as Ridge replacement;
- rookies remain separate.

Exact-head War Room CI for WR-027: SUCCESS.
Production changed: NO.
Frozen WR-021/WR-023 changed: NO.
2026 outcomes inspected: NO.

### Work-mode technical gap analysis — MANAGER ACCEPTED AS ADVISORY EVIDENCE
Manager accepted the report's recommended WR-029/WR-028 expansions, while preserving Manager/R&D authority boundaries. Source-rights and coverage classifications remain provisional until WR-029 independently verifies them.

Key accepted additions:
- benchmark lock before enrichment scoring;
- cutoff-aware feature/data contract;
- immutable source/schema manifests and hashes;
- explicit missingness, coverage and confidence handling;
- position/family ablations and ranking sensitivity;
- source-failure / LKG / versioning / Champion-Challenger governance;
- league replacement, late-entry, position-change and K/DST contracts;
- strict separation of intrinsic player value from ESPN/live-draft strategy.

### WR-028 — COMPLETE / AMENDED
Custom Ranking Engine Roadmap now includes the above cross-cutting engine contracts.

### WR-029 — ASSIGNED / ACTIVE
Advanced Context Feature Enrichment / Source Feasibility.

Fixed benchmark entering WR-029:
- Ridge mean ordering;
- risk warning-only for QB/RB/WR/TE;
- no Huber replacement;
- rookies separate.

WR-029 will test long-history PBP opportunity/role, efficiency/regression, QB/team context, PBP-derived OL proxies, age/draft interactions, then PIT-sensitive depth/staff/scheme challengers under strict rights/coverage gates.

Important current holds:
- no fabricated routes/YPRR denominator;
- no proprietary PFF inputs;
- no systematic NGS/NFL Pro dependency absent accepted rights basis;
- PFR-linked snap/advanced/combine sources are not core dependencies unless rights are independently cleared;
- current injury feed is not a maintainable core source;
- ESPN ADP remains excluded from intrinsic custom value.

## Phone UX lane
### WR-026 — IN PROGRESS
Builder PR #120 is open/draft.
Current green implementation candidate: `6b0821a03608f170903a46f015976028d9991275`.
Desktop/tablet >600px preservation remains a hard requirement.
Independent audit required before merge.

## Current dependency map
- WR-026 vs WR-029: INDEPENDENT.
- WR-029 -> returning-player Phase 2 specification freeze: HARD.
- WR-023 final Week-18 prospective evaluation remains a HARD gate on any future production-authority consideration.

## Current workload
- Manager: IDLE after WR-027 disposition / WR-029 activation
- Builder: ACTIVE — WR-026
- R&D: ACTIVE — WR-029
- Auditor: IDLE — waiting for WR-026 AUDIT_READY
