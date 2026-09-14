# War Room Roadmap

Status: ACTIVE DEVELOPMENT
Last updated: 2026-09-14
Owner: Manager / Architect

## Workflow foundation

- V3.2 — CANONICAL / ACCEPTED.
- WR-054 — CLOSED. Workflow V3.2 implementation accepted and merged; canonical-main canary `34872984380` PASS.
- WR-055 — CLOSED. Independent V3.2 audit `PASS`, no findings.

## Phase 5B — Returning-Player v2 evidence reset — ACTIVE

- WR-042 — BLOCKED / historical PR #168 closed unmerged after WR-043 audit failure. Exact 15-source raw custody evidence remains preserved.
- WR-043 — CLOSED / `FAIL — REMEDIATION REQUIRED`; two HIGH evidence-contract findings remain the reason for WR-059.
- WR-056 — CLOSED / trusted custody runtime bridge accepted and merged.
- WR-057 — CLOSED / `RAW_CUSTODY_NOT_ESTABLISHED — EXCLUDE_SOURCE` for PFR-derived nflverse `draft_picks.csv`.
- WR-058 — CLOSED / independent custody-bridge audit PASS.
- WR-059 — BLOCKED / R&D evidence remediation cannot safely continue until an independently accepted non-mutating retained-object read path exists.
- WR-061 — ASSIGNED / Work Helper establishes a reviewed GET-only protected read path for exactly four pinned 2013–2016 B2/R2 custody objects, with secret isolation, exact digest/size verification, ephemeral cleanup, no upstream refresh, and no provider mutation capability.
- WR-062 — BLOCKED on WR-061 / independent audit of the GET-only implementation and protected four-object live proof. PASS-family permits only exact integration plus mandatory canonical-main canary.
- WR-060 — BLOCKED on WR-059 / fresh independent audit of the eventual complete source-snapshot/cohort remediation target.

Sequence: `WR-061 implementation/live proof -> WR-062 independent audit -> exact WR-061 integration + main canary -> resume WR-059 -> WR-060 independent evidence re-audit`.

`draft_picks.csv` remains excluded and no silent replacement provider is authorized. A later versioned contract/feature-schema governance gate remains mandatory before any model path could proceed without draft-capital semantics.

No model protocol, fitting, scoring, tuning, comparison, evaluation, target join, 2026 regular-season outcome use, production ranking change, or Phase-6 work is authorized by these tasks.

## Future phases

- Phase 3 rookie engine v1 — PLANNED.
- Phase 6 replacement/cross-position draft value — BLOCKED until accepted v2 season-total path.
- Phase 7 complete historical replay — PLANNED.
- Phase 8 2026 custom development board — PLANNED.
- Phase 9 shadow production integration — PLANNED.
- Phase 10 independent engine QA — PLANNED.
- Phase 11 prospective validation — FROZEN / EVENT-DRIVEN.
- Phase 12 production-ranking promotion decision — FUTURE / CONDITIONAL.
