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
- WR-059 — BLOCKED / evidence remediation waits for an independently accepted retained-version read path.
- WR-061 — CLOSED / immutable fail-closed historical checkpoint, PR #176 unmerged.
- WR-062 — CLOSED / never activated because WR-061 never produced a successful live proof.
- WR-063 — BLOCKED / Work Helper version-aware implementation reached protected B2 authorization but the existing custody credential lacks `listFiles`. Manager chose a dedicated bucket/prefix-restricted read-only B2 credential rather than widening the mutation-capable shared custody credential.
- WR-064 — BLOCKED on successful WR-063 four-object protected proof / fresh independent audit gate.
- WR-060 — BLOCKED on WR-059 / fresh independent audit of the eventual complete source-snapshot/cohort remediation target.

Sequence: `user provisions dedicated B2 read-only key -> resume WR-063 Work-mode protected proof -> WR-064 independent audit -> exact WR-063 integration + main canary -> resume WR-059 -> WR-060 independent evidence re-audit`.

The dedicated B2 read credential must be restricted to `War-Room-Custody-Primary` + `custody/sha256/`, include `listFiles`/`readFiles`, and contain no provider-mutation authority. Existing shared custody credentials remain unchanged.

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
