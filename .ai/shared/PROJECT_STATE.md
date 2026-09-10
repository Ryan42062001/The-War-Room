# War Room Project State

Status: ACTIVE DEVELOPMENT — WORKFLOW V2 / PW-003 PHONE UX + CUSTOM-RANKING R&D
Last verified: 2026-09-09
Owner: Manager / Architect

## Canonical repository
Repository: `Ryan42062001/The-War-Room`
Branch: `main`

## Current control plane
Workflow: **V2 ACTIVE** via WR-030.

Fast current-task index:
`.ai/shared/ACTIVE_TASKS.json`

Current task states:
- WR-026 — Builder — `IN_PROGRESS` — phone-only decision view — independent audit required.
- WR-027 — R&D — `IN_PROGRESS` — position-specific risk calibration — Manager review next.
- WR-029 — R&D — `BLOCKED` — waits for WR-027 Manager disposition.

Detailed task requirements remain in `.ai/manager/WR-026.md`, `.ai/manager/WR-027.md`, and `.ai/manager/WR-029.md`.

## Production baseline
Draft-Day Layout Efficiency is complete and audited.

Ranking authority remains unchanged:
- FantasyPros Top-20 Experts 2026 PPR ECR primary;
- broader FantasyPros PPR ECR fallback;
- ESPN rank/ADP is market timing only;
- WR-D001 ACTIVE.

## Frozen prospective ranking contract
WR-021 and WR-023 remain accepted/frozen.

Authoritative identities:
- WR-023 protocol SHA-256: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`
- WR-021 snapshot SHA-256: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`

No current historical custom-ranking development may inspect 2026 regular-season outcomes or rewrite these artifacts.

## Custom-ranking path
WR-028 defines the custom ranking engine roadmap.

Current hard dependency:
WR-027 Manager disposition -> WR-029 advanced context enrichment -> returning-player v1 specification freeze.

Production custom-ranking authority remains unauthorized.

## Phone lane
WR-026 remains independent of ranking R&D.

User boundary remains:
- optimize phone only;
- preserve desktop/tablet >600px;
- preserve ranking/scoring/recommendation/state/ESPN semantics.

Workflow V2 target-advance rules mean Manager/control-plane-only changes do not, by themselves, invalidate WR-026's expensive phone evidence. Actual overlap still requires reconciliation/revalidation.

## Workflow V2 summary
WR-030 added:
- machine-readable active-task registry;
- Fast Refresh vs Full Refresh;
- explicit lifecycle states;
- target-advance classification;
- workflow preflight/finish helper scripts;
- atomic Manager reconciliation;
- concise canonical-document responsibilities.

Role separation, merge authority and independent-audit gates remain intact.

## Current workload
- Manager — IDLE after WR-030 completion.
- Builder — ACTIVE / WR-026.
- R&D — ACTIVE / WR-027.
- Auditor — IDLE / waiting for WR-026 audit-ready handoff.
