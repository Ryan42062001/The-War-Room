# War Room Roadmap

Status: ACTIVE DEVELOPMENT
Last updated: 2026-09-13
Owner: Manager / Architect

## Workflow foundation

- V3.1.1 — CANONICAL / ACCEPTED.
- WR-054 — Workflow V3.2 lane-identity enforcement — AUDIT_READY on PR #166 exact head `a6fac435d7b4c791635a654a9971ba7a9fc6460d`; exact-head Full CI `34775840832` PASS.
- WR-055 — independent V3.2 lane-identity audit — ASSIGNED to the frozen WR-054 target.

WR-054 is a narrow safety upgrade: preflight/finish must fail on wrong execution branch, static state validation binds registry truth to task-spec TARGET BRANCH / EXECUTION MODE / dependency class, descriptive dependency suffixes remain compatible, and accepted WR-056 trusted-custody CI behavior is preserved.

V3.1.1 remains canonical until WR-055 returns PASS-family, Manager integrates the exact audited WR-054 head, and the canonical-main post-merge canary passes.

## Phase 5B — Returning-Player v2 evidence reset — ACTIVE

- WR-042 — ASSIGNED / fresh no-scoring custody retry on a new branch using the accepted WR-056 runtime bridge.
- WR-043 — BLOCKED pending one admitted immutable no-scoring WR-042 target.
- WR-056 — CLOSED / trusted custody runtime bridge accepted and merged; canonical-main canary `34769306210` PASS.
- WR-057 — CLOSED / accepted `RAW_CUSTODY_NOT_ESTABLISHED — EXCLUDE_SOURCE` for PFR-derived nflverse `draft_picks.csv`; PR #165 merged as `bc23851f64158d27c6faf7e93719bbd869b516e1`.
- WR-058 — CLOSED / independent audit PASS, no findings.
- WR-046 / WR-053 — CLOSED / accepted custody capability.
- WR-047 / WR-050 — historical FAIL evidence preserved.

Historical WR-042 PR #153 remains immutable fail-closed evidence and must not be reused.

The fresh WR-042 retry must exclude `draft_picks.csv`, must not silently substitute another draft-data provider, and may custody only source instances whose current rights/retention evidence supports the full independent-audit chain. If the v2 path later proceeds without draft capital, a versioned contract/feature-schema governance gate is required before any model scoring.

WR-042 and WR-055 may run in parallel because their authorized write surfaces are disjoint (`.ai/research/**` vs `.ai/auditor/**`).

## Future phases

- Phase 3 rookie engine v1 — PLANNED.
- Phase 6 replacement/cross-position draft value — BLOCKED until accepted v2 season-total path.
- Phase 7 complete historical replay — PLANNED.
- Phase 8 2026 custom development board — PLANNED.
- Phase 9 shadow production integration — PLANNED.
- Phase 10 independent engine QA — PLANNED.
- Phase 11 prospective validation — FROZEN / EVENT-DRIVEN.
- Phase 12 production-ranking promotion decision — FUTURE / CONDITIONAL.
