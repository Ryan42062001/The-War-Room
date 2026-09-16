# War Room Roadmap

Status: ACTIVE DEVELOPMENT
Last updated: 2026-09-16
Owner: Manager / Architect

## Workflow foundation

- V3.2 — CANONICAL / ACCEPTED.
- WR-054 — CLOSED. Workflow V3.2 implementation accepted and merged; canonical-main canary `34872984380` PASS.
- WR-055 — CLOSED. Independent V3.2 audit `PASS`, no findings.

## Phase 5B — Returning-Player v2 evidence reset — ACTIVE

- WR-042 — CLOSED / historical exact 15-source custody authority preserved.
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
- WR-072 — REWORK_REQUIRED / second bounded pre-score remediation after WR-076 findings.
- WR-073 — CLOSED / historical `FAIL — REMEDIATION REQUIRED`, one HIGH finding `WR-073-AUD-01`.
- WR-076 — CLOSED / `FAIL — REMEDIATION REQUIRED`, HIGH `WR-076-AUD-01`, MEDIUM `WR-076-AUD-02`, no CRITICAL/LOW findings.
- WR-077 — BLOCKED / fresh independent audit of the next Manager-frozen WR-072 remediation.

### Accepted source-snapshot + cohort checkpoint

- source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`;
- cohort `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`;
- 5,176 unique historical keys / zero duplicates;
- admitted stats 14 / admitted metadata 0 / failed-closed metadata 1;
- `draft_picks.csv` excluded.

### WR-072 failed protocol history

1. `returning-player-v2-model-protocol/1.0.0-wr072` / head `d75e5805...` / lock `d2fb3268...` — failed WR-073 because relative-gate/bootstrap execution semantics were insufficiently deterministic.
2. `returning-player-v2-model-protocol/1.1.0-wr072` / head `95b1fdfb...` / lock `831aed6e...` — fixed most deterministic execution details but failed WR-076 because function operand roles remain ambiguous and the claimed synthetic conformance vector lacks a frozen reproducible input fixture.

WR-076 audit PR #214 / head `dcf75157b18f9b2fba3effa2bb0a705e9ad79749` returned FAIL. Audit-head CI `35094551843` SUCCESS; evidence merged at `7db935e5c0053ea96e162f26f6de77e5ffe4da33`; canonical canary `35094846833` SUCCESS.

### Current critical path

`WR-072 bounded operand-signature + conformance-fixture remediation -> Manager exact freeze of new version/hash/head/fixture -> WR-077 fresh independent re-audit -> PASS-family only: Manager disposition/integration -> separately assigned scoring/evaluation task -> independent model-result audit -> season-total composition -> independent composition audit -> Phase 6 eligibility decision`

No fitting, prediction, target join, scoring, evaluation, or outcome inspection is authorized during this remediation/audit sequence.

## Infrastructure roadmap — ACTIVE PARALLEL PILOT

### WR-074 — Self-hosted heavy-CI runner pilot + hardening — IN_PROGRESS

Work Helper owns the bounded self-hosted heavy-CI pilot. Public-repository security controls, dedicated runner labels, least privilege, clean workspace, no custody/provider secrets, repeat-run evidence, benchmark parity, and GitHub-hosted fallback/reference remain mandatory. Exact release-validator path authorization is limited to recognition of the approved WR-074 workflow.

### WR-075 — Independent self-hosted runner audit — BLOCKED

Manager activates WR-075 only after freezing one immutable WR-074 target with exact workflow/security/run evidence.

Sequence:

`WR-074 hardened pilot -> Manager exact freeze -> WR-075 fresh independent audit -> PASS-family only: Manager adoption decision / canonical CI routing`

This infrastructure lane remains independent of WR-072/077.

## Future phases

- Phase 3 rookie engine v1 — PLANNED.
- Phase 6 replacement/cross-position draft value — BLOCKED until accepted v2 season-total path.
- Phase 7 complete historical replay — PLANNED.
- Phase 8 2026 custom development board — PLANNED.
- Phase 9 shadow production integration — PLANNED.
- Phase 10 independent engine QA — PLANNED.
- Phase 11 prospective validation — FROZEN / EVENT-DRIVEN.
- Phase 12 production-ranking promotion decision — FUTURE / CONDITIONAL.
