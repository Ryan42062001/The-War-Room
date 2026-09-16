# War Room Roadmap

Status: ACTIVE DEVELOPMENT
Last updated: 2026-09-16
Owner: Manager / Architect

## Workflow foundation

- V3.2 — CANONICAL / ACCEPTED.
- WR-054 — CLOSED / V3.2 implementation accepted; canonical-main canary `34872984380` PASS.
- WR-055 — CLOSED / independent V3.2 audit PASS, no findings.
- WR-078 — ASSIGNED / Workflow V3.3 audit-readiness + Manager-transition efficiency candidate.
- WR-079 — BLOCKED / fresh independent audit of one Manager-frozen WR-078 target.

V3.3 candidate sequence:

`WR-078 implementation + full CI + readiness packet -> Manager exact freeze -> WR-079 fresh independent audit -> PASS-family only: WR-078 integration -> mandatory canonical-main full-CI canary -> Manager V3.3 canonical disposition`

V3.3 does not remove independent audit, exact-head/live-state gates, Manager merge authority, post-merge canaries, fail-closed behavior, or custody/provider controls. Its purpose is to catch mechanical audit defects earlier and reduce avoidable control-plane mismatch loops.

## Phase 5B — Returning-Player v2 evidence reset — ACTIVE

WR-042/043/056/057/058/059/060/061/062/063/064/065/066/067/068/069/070/071/073/076 are closed historical/accepted lanes as previously recorded.

- WR-072 — REWORK_REQUIRED / bounded pre-score remediation for WR-076-AUD-01/02 only.
- WR-077 — BLOCKED / fresh independent audit of the next Manager-frozen WR-072 remediation.

Current critical path:

`WR-072 operand-signature + conformance-fixture remediation -> Manager exact freeze -> WR-077 fresh re-audit -> PASS-family only: integration -> separately assigned scoring/evaluation -> independent model-result audit -> season-total composition -> independent composition audit -> Phase 6 eligibility`

No fitting, prediction, target join, scoring, evaluation, or outcome inspection is authorized before that gate.

## Infrastructure roadmap — ACTIVE PARALLEL PILOT

- WR-074 — IN_PROGRESS / self-hosted heavy-CI pilot; exact pilot workflow scope, dedicated `[self-hosted, war-room-heavy-ci]`, clean workspace, no custody/provider secrets, hosted fallback and repeat-run evidence remain mandatory.
- WR-075 — BLOCKED / independent runner audit after Manager freeze.

Sequence:

`WR-074 hardened pilot -> Manager exact freeze -> WR-075 fresh independent audit -> PASS-family only: adoption decision`

WR-074/075 and WR-078/079 are independent non-blocking infrastructure/workflow lanes and must not alter WR-072/077 model chronology.

## Future phases

- Phase 3 rookie engine v1 — PLANNED.
- Phase 6 replacement/cross-position draft value — BLOCKED until accepted v2 season-total path.
- Phase 7 complete historical replay — PLANNED.
- Phase 8 2026 custom development board — PLANNED.
- Phase 9 shadow production integration — PLANNED.
- Phase 10 independent engine QA — PLANNED.
- Phase 11 prospective validation — FROZEN / EVENT-DRIVEN.
- Phase 12 production-ranking promotion decision — FUTURE / CONDITIONAL.
