# War Room Roadmap

Status: ACTIVE DEVELOPMENT
Last updated: 2026-09-17
Owner: Manager / Architect

## Workflow foundation

- V3.3 — CANONICAL / ACCEPTED.
- WR-078 / WR-080 — CLOSED / accepted Workflow V3.3 path.
- Historical WR-079 failed-audit evidence remains preserved.

## Phase 5B — Returning-Player v2 evidence reset — ACTIVE

Accepted Returning-Player v2 source/cohort baseline remains unchanged.

- WR-072 — CLOSED / accepted pre-score protocol `returning-player-v2-model-protocol/1.2.0-wr072` at exact audited head `a228d0002545a701aea8c7bead5de0bf36994764`; integrated through PR #207 as canonical-main merge `124ebddff321608935d94af51006846eada7a304`.
- WR-077 — CLOSED / fresh independent re-audit `PASS`, no findings; Auditor PR #225 / head `45ba066743d25ec43ede049d93c42d8d04dddbfa`; audit CI `35169095669` SUCCESS.
- WR-081 — ASSIGNED / execute the frozen historical model protocol and publish full-row keyed model-result evidence only.
- WR-082 — BLOCKED / fresh independent model-result audit after Manager exact freeze of WR-081.

Current critical path:

`WR-081 historical scoring/evaluation -> Manager exact freeze -> WR-082 independent model-result audit -> PASS-family only: season-total composition -> independent composition audit -> Phase 6 eligibility`

WR-081 authorization is historical-result-only. It does not authorize 2026 regular-season outcome use, source reacquisition/refresh/substitution, provider mutation, model/protocol/gate redesign, production ranking changes, season-total composition, or Phase 6.

## Infrastructure roadmap — ACTIVE PARALLEL PILOT

- WR-074 — IN_PROGRESS / self-hosted heavy-CI pilot; dedicated `[self-hosted, war-room-heavy-ci]`, clean workspace, no custody/provider secrets, hosted fallback and repeat-run evidence remain mandatory.
- WR-075 — BLOCKED / independent runner audit after Manager freeze.

Sequence:

`WR-074 hardened pilot -> audit-readiness preflight -> Manager exact freeze -> WR-075 fresh independent audit -> PASS-family only: adoption decision`

WR-074/075 remains independent of the Returning-Player model chronology.

## Future phases

- Phase 3 rookie engine v1 — PLANNED.
- Phase 6 replacement/cross-position draft value — BLOCKED until accepted v2 season-total path.
- Phase 7 complete historical replay — PLANNED.
- Phase 8 2026 custom development board — PLANNED.
- Phase 9 shadow production integration — PLANNED.
- Phase 10 independent engine QA — PLANNED.
- Phase 11 prospective validation — FROZEN / EVENT-DRIVEN.
- Phase 12 production-ranking promotion decision — FUTURE / CONDITIONAL.
