# War Room Roadmap

Status: ACTIVE DEVELOPMENT
Last updated: 2026-09-15
Owner: Manager / Architect

## Workflow foundation

- V3.2 — CANONICAL / ACCEPTED.
- WR-054 — CLOSED. Workflow V3.2 implementation accepted and merged; canonical-main canary `34872984380` PASS.
- WR-055 — CLOSED. Independent V3.2 audit `PASS`, no findings.

## Phase 5B — Returning-Player v2 evidence reset — ACTIVE

- WR-042 — BLOCKED / exact 15-source historical custody evidence remains preserved and must not be reacquired.
- WR-043 — CLOSED / `FAIL — REMEDIATION REQUIRED`.
- WR-056 — CLOSED / trusted custody runtime bridge accepted.
- WR-057 — CLOSED / `draft_picks.csv` excluded because raw custody was not established.
- WR-058 — CLOSED / independent custody-bridge audit PASS.
- WR-059 — AUDIT_READY / PR #196 remains open and unmerged at exact frozen remediation head `db8b21a65f2decf900902481f110758cc33f0aa6`.
- WR-060 — CLOSED / `FAIL — REMEDIATION REQUIRED`; one HIGH finding `WR-060-AUD-01` preserved as historical audit evidence.
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
- WR-071 — ASSIGNED / fresh independent audit of exact WR-059 PR #196/head `db8b21a65f2decf900902481f110758cc33f0aa6`. Execution mode: `STANDARD_CHAT`.

### Frozen WR-059 remediation target

- remediation path: `B_FAIL_CLOSED`;
- source snapshot: `wr-returning-player-v2-source-snapshot/1.2.0-wr059`;
- source snapshot SHA-256: `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`;
- retained identities: 15;
- admitted sources: 14;
- failed closed: 1 (`players.csv` asset `563580371`);
- admitted metadata sources: 0;
- cohort: `returning-player-v2-cohort/1.2.0-wr059`;
- cohort SHA-256: `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`;
- historical cohort: 5,176 unique keys, zero duplicates, membership unchanged;
- exact-head War Room CI `34998074580` SUCCESS.

Current sequence:

`WR-071 fresh independent audit -> Manager disposition -> PASS-family only: exact audited WR-059 integration + canonical-main canary -> later versioned contract/feature-schema governance gate before model work`

No model fitting, scoring, tuning, evaluation, target joins, 2026 regular-season outcome use, ranking/production change, provider mutation, source reacquisition, or Phase-6 work is authorized.

## Infrastructure roadmap — FUTURE / NON-BLOCKING

### Self-hosted heavy-CI runner lane — PLANNED CANDIDATE

After the WR-071 gate reaches a stable disposition, create a separate Manager-approved infrastructure task to evaluate the user-operated self-hosted runner for heavyweight browser/test CI. Keep Governance and sensitive custody/protected-proof lanes independently isolated at first; require dedicated runner labels, health checks, clean-workspace guarantees, fallback capability, benchmarking, exact-head traceability, and a fresh independent audit before canonical adoption.

## Future phases

- Phase 3 rookie engine v1 — PLANNED.
- Phase 6 replacement/cross-position draft value — BLOCKED until accepted v2 season-total path.
- Phase 7 complete historical replay — PLANNED.
- Phase 8 2026 custom development board — PLANNED.
- Phase 9 shadow production integration — PLANNED.
- Phase 10 independent engine QA — PLANNED.
- Phase 11 prospective validation — FROZEN / EVENT-DRIVEN.
- Phase 12 production-ranking promotion decision — FUTURE / CONDITIONAL.
