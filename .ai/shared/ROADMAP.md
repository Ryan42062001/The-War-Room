# War Room Roadmap

Status: ACTIVE DEVELOPMENT
Last updated: 2026-09-17
Owner: Manager / Architect

## Workflow foundation

- V3.3 — CANONICAL / ACCEPTED.
- Exact-head, independent-audit, custody, fail-closed, post-merge-canary, and collision-safety rules remain mandatory.

## Workflow efficiency — V3.4 CANDIDATE

WR-085 candidate implementation standardizes two execution modes, explicit refresh modes, execution packets, decision consumption, compact handoffs, audit-readiness self-validation, chat reuse, worker-spawn cost checks, and Work escalation/de-escalation. V3.3 remains canonical until WR-086 PASS-family + exact integration + canary.

- WR-085 — ASSIGNED / bounded ChatGPT-usage and Work-mode efficiency upgrade.
- WR-086 — BLOCKED / fresh independent audit after Manager exact freeze.
- V3.3 remains canonical until PASS-family audit, exact integration, and required canonical-main canary.

Sequence: `WR-085 implementation/self-validation -> Manager exact freeze -> WR-086 fresh independent audit -> PASS-family only: exact integration + full canonical-main canary -> V3.4 canonical disposition`

## Phase 5B — Returning-Player v2 evidence reset — ACTIVE

- WR-072 — CLOSED / accepted pre-score protocol 1.2.
- WR-077 — CLOSED / PASS, no findings.
- WR-081 — BLOCKED / fail-closed before scoring at PR #227 head `3f7ee6cc9294d8ae40921a5d4b50f2d0182f98ca`; exact retained-row scoring path unavailable.
- WR-083 — ASSIGNED / protected historical-scoring execution bridge; no real scoring before audit.
- WR-084 — BLOCKED / independent bridge audit after Manager exact freeze.
- WR-082 — BLOCKED / independent model-result audit only after WR-081 later produces a complete result target.

Critical path:

`WR-083 protected bridge -> Manager freeze -> WR-084 independent audit -> PASS-family only: bridge integration + protected canonical-main canary -> fresh WR-081 historical scoring execution -> Manager freeze -> WR-082 model-result audit -> PASS-family only: season-total composition -> independent composition audit -> Phase 6 eligibility`

No 2026 regular-season outcome use, source reacquisition/substitution, provider mutation, feature/model/gate redesign, production ranking changes, season-total composition, or Phase 6 is authorized.

## Infrastructure roadmap

- WR-074 — BLOCKED TEMPORARILY / preserved at `7b4641499c50541abf523267eb4c0255813e8b6d` while WR-083/084 owns potentially colliding Work Helper/release-guard surfaces.
- WR-075 — BLOCKED behind WR-074.

After WR-084 disposition, Manager may reactivate WR-074 and continue the self-hosted heavy-CI pilot.

## Future phases

- Phase 3 rookie engine v1 — PLANNED.
- Phase 6 replacement/cross-position draft value — BLOCKED until accepted v2 season-total path.
- Phase 7 complete historical replay — PLANNED.
- Phase 8 2026 custom development board — PLANNED.
- Phase 9 shadow production integration — PLANNED.
- Phase 10 independent engine QA — PLANNED.
- Phase 11 prospective validation — FROZEN / EVENT-DRIVEN.
- Phase 12 production-ranking promotion decision — FUTURE / CONDITIONAL.
