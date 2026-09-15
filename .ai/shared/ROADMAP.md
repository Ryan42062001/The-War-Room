# War Room Roadmap

Status: ACTIVE DEVELOPMENT
Last updated: 2026-09-15
Owner: Manager / Architect

## Workflow foundation

- V3.2 — CANONICAL / ACCEPTED.
- WR-054 — CLOSED. Workflow V3.2 implementation accepted and merged; canonical-main canary `34872984380` PASS.
- WR-055 — CLOSED. Independent V3.2 audit `PASS`, no findings.

## Phase 5B — Returning-Player v2 evidence reset — ACTIVE

- WR-042 — CLOSED / historical exact 15-source custody authority preserved; PR #168 remains closed unmerged and immutable.
- WR-043 — CLOSED / historical `FAIL — REMEDIATION REQUIRED` that motivated the reset.
- WR-056 — CLOSED / trusted custody runtime bridge accepted.
- WR-057 — CLOSED / `draft_picks.csv` excluded because raw custody was not established.
- WR-058 — CLOSED / independent custody-bridge audit PASS.
- WR-059 — CLOSED / accepted source-snapshot + cohort remediation, audited and merged.
- WR-060 — CLOSED / historical failed audit with one HIGH provenance finding.
- WR-061 — CLOSED / historical fail-closed checkpoint.
- WR-062 — CLOSED / never activated.
- WR-063 — CLOSED / accepted retained-version read recovery.
- WR-064 — CLOSED / independent audit PASS.
- WR-065 — CLOSED / fail-closed parser checkpoint.
- WR-066 — CLOSED / never activated.
- WR-067 — CLOSED / deterministic CSV schema-inference clarification accepted.
- WR-068 — CLOSED / independent audit PASS.
- WR-069 — CLOSED / accepted retained safe-consumer parser evidence.
- WR-070 — CLOSED / independent audit PASS.
- WR-071 — CLOSED / independent audit `PASS`, no findings.
- WR-072 — ASSIGNED / Returning-Player v2 pre-score model-protocol + ordered feature-schema freeze.
- WR-073 — BLOCKED / fresh independent audit of the exact future Manager-frozen WR-072 target.

### Accepted source-snapshot + cohort checkpoint

- WR-059 accepted head `db8b21a65f2decf900902481f110758cc33f0aa6`;
- WR-071 audit head `96a712ba2cf6a016ddbfdc0ea14cabba282bee04` / PASS, no findings;
- audit evidence merge `0eb20f940fcfe455da3129a54525a73e39c966c6`;
- WR-059 integration merge `2777ec44ca5b5f2fef77c07d17e4fa75b6013262`;
- post-integration CI `35009576671` classify/Governance SUCCESS.

Accepted source snapshot:

- `wr-returning-player-v2-source-snapshot/1.2.0-wr059`;
- SHA-256 `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`;
- retained identities 15;
- admitted stats 14;
- failed-closed metadata 1;
- admitted metadata 0;
- `draft_picks.csv` excluded.

Accepted cohort:

- `returning-player-v2-cohort/1.2.0-wr059`;
- SHA-256 `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`;
- 5,176 unique historical keys;
- zero duplicates;
- membership, ordering, and prior-season stats lineage unchanged.

### Current critical path

`WR-072 pre-score model-protocol + feature-schema freeze -> Manager exact target freeze -> WR-073 fresh independent audit -> PASS-family only: later separately assigned scoring/evaluation task -> independent model-result audit -> later season-total composition -> independent composition audit -> Phase 6 eligibility decision`

WR-072 is specification/evidence only. It may reuse v1 ideas only through new v2 identities and may use only admitted source semantics. Failed-closed metadata and excluded draft capital cannot enter the feature schema without a future separately versioned source-contract/custody/audit gate.

No fitting, scoring, tuning, prediction, evaluation, target join, 2026 regular-season outcome use, ranking/production change, source reacquisition/mutation, season-total composition, or Phase-6 work is authorized.

## Infrastructure roadmap — FUTURE / NON-BLOCKING

### Self-hosted heavy-CI runner lane — PLANNED CANDIDATE

The WR-059/071 gate is now stable, so a separate future Manager-approved infrastructure task may evaluate the user-operated self-hosted runner for heavyweight browser/test CI. Keep Governance and sensitive custody/protected-proof lanes independently isolated at first; require dedicated labels, health checks, clean-workspace guarantees, fallback capability, benchmarking, exact-head traceability, and fresh independent audit before canonical adoption.

This candidate is not on the Returning-Player v2 critical path and must not weaken WR-072/073 chronology.

## Future phases

- Phase 3 rookie engine v1 — PLANNED.
- Phase 6 replacement/cross-position draft value — BLOCKED until accepted v2 season-total path.
- Phase 7 complete historical replay — PLANNED.
- Phase 8 2026 custom development board — PLANNED.
- Phase 9 shadow production integration — PLANNED.
- Phase 10 independent engine QA — PLANNED.
- Phase 11 prospective validation — FROZEN / EVENT-DRIVEN.
- Phase 12 production-ranking promotion decision — FUTURE / CONDITIONAL.
