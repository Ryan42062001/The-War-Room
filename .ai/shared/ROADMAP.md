# War Room Roadmap

Status: ACTIVE DEVELOPMENT
Last updated: 2026-09-12
Owner: Manager / Architect

## Production baseline
WR-D001 remains unchanged: FantasyPros Top-20 Experts 2026 PPR ECR primary; broader FantasyPros PPR ECR fallback; ESPN rank/ADP market timing only. No custom ranking/model is production-authorized.

## Workflow foundation
- WR-041 — permanent Work Helper role — COMPLETE.
- WR-044 / WR-045 — browser-CI determinism remediation/audit — CLOSED.
- WR-048 / WR-049 — post-integration persistence residual remediation/audit — CLOSED / ACCEPTED / MERGED.
- WR-051 — Workflow V3.1.1 efficiency, state-integrity & safety refresh — AUDIT_READY after state reconciliation.
- WR-052 — independent V3.1.1 final re-audit — ASSIGNED on `wr-052-workflow-v311-final-reaudit`.

V3.1 introduced same-role task concurrency, blocker typing, Auditor self-publication, path-aware CI, state-integrity checks, active-only task indexing, external-authority evidence requirements, post-merge canaries, and stronger atomic reconciliation.

V3.1.1 adds static active-task collision detection, machine-readable Auditor target metadata with exact live SHA pinning, a read-only GitHub live-state Manager gate, and a generated user-action view. These do not alter football product/model authority.

Audit history is intentionally preserved:
- PR #149 historical WR-052 FAIL found HIGH `WR-052-AUD-01` in the HARD collision exemption and LOW `WR-052-AUD-02` browser-focus residual.
- `WR-052-AUD-01` was remediated with relationship-aware pairwise HARD serialization plus regression coverage.
- PR #150 re-audit FAIL found HIGH `WR-052-REAUD-AUD-01`: the active registry still named the historical audit lane instead of the actual fresh re-audit lane.
- Current reconciliation points machine state to `.ai/manager/WR-052_REAUDIT_2.md`, branch `wr-052-workflow-v311-final-reaudit`, worker slot `auditor-workflow-v311-final-reaudit`.

Historical audit PRs/branches remain evidence and are not reused. Exact-head Governance + Full CI and a fresh live-state pin are required before the final re-audit. PASS-family then permits merge of only that exact audited WR-051 head, followed by mandatory canonical-main Full CI/canary before closure.

## Returning-player research history
WR-018 / 021 / 023 / 025 / 027 / 029 completed historical research gates. WR-033/WR-D005 and WR-034/WR-D006 remain historical v1 components. WR-D007 closed the unprovable v1 composition path. WR-039/040 established and independently accepted the prospective v2 evidence contract under WR-D008.

## Phase 5B — Returning-Player v2 evidence reset — ACTIVE
- WR-042: ASSIGNED / fresh bounded exact source-custody retry after accepted capability recovery.
- WR-043: BLOCKED / wait for actual admitted immutable no-scoring custody target.
- WR-046: CLOSED / exact custody capability accepted and integrated after WR-053 PASS.
- WR-047: CLOSED / historical FAIL preserved.
- WR-050: CLOSED / historical FAIL preserved; later exact-target WR-053 PASS did not rewrite it.
- WR-053: CLOSED / PASS with no findings; current-credential live custody proof accepted.

Historical blocker PR #133 / head `1c3c6d768d58aa636194226f16b9822eebc8c19f` remains immutable fail-closed evidence with 0 sources admitted. The fresh WR-042 retry uses a new branch/target.

Accepted custody capability lineage:
- WR-046 exact audited final head `0be4a508d68009c89ef318738acb286233a3a850`;
- WR-053 audit evidence merged via PR #146 at `6916c17c40724a7605a0a3f1fbea85373806f07e`;
- Manager integration PR #147 merged at canonical `2e13dcaa85c5daa15f570f23ca7df184c45ec634` after green exact-head CI;
- no additional live-provider proof during integration.

Next research gate: WR-042 fresh no-scoring source custody -> WR-043 independent audit. Model fitting/scoring/tuning/comparison, 2026 outcome use, and production ranking changes remain forbidden until later explicit authorization.

## Future phases
- Phase 3 rookie engine v1 — PLANNED.
- Phase 6 replacement/cross-position draft value — BLOCKED until accepted v2 season-total path.
- Phase 7 complete historical replay — PLANNED.
- Phase 8 2026 custom development board — PLANNED.
- Phase 9 shadow production integration — PLANNED.
- Phase 10 independent engine QA — PLANNED.
- Phase 11 WR-023 2026 prospective validation — FROZEN / EVENT-DRIVEN.
- Phase 12 production-ranking promotion decision — FUTURE / CONDITIONAL.
