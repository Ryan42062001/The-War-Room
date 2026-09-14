# Manager / Architect Handoff

HANDOFF

Workflow: V3.2 CANONICAL

## Accepted upstream state

WR-043 is CLOSED with `FAIL — REMEDIATION REQUIRED`; historical WR-042 PR #168 remains closed unmerged. Positive custody evidence for the exact 15 retained byte identities remains valid. `draft_picks.csv` remains excluded under WR-057.

Canonical main before this routing transaction: `f77af0040c9c0c5413f6d88cb58872fb587c6a52`.

## New execution-path blocker

R&D returned:

`EXISTING_PROTECTED_EXECUTION_PATH_HAS_NO_NON-MUTATING_RETAINED-OBJECT_READ_MODE`

The existing WR-042/WR-046 protected jobs route through custody routines capable of PUT/retention/Legal-Hold mutation. R&D correctly stopped rather than widening WR-059.

## Active lanes

- WR-042 — BLOCKED on WR-059 remediation.
- WR-059 — BLOCKED pending independently accepted GET-only retained-object path.
- WR-061 — ASSIGNED to Work Helper on `wr-061-retained-object-read-path`.
- WR-062 — BLOCKED on WR-061; future audit branch `wr-062-retained-object-read-path-audit`.
- WR-060 — BLOCKED on the eventual immutable WR-059 source-snapshot/cohort target.

## WR-061 authorization

Work Helper may create only the narrowly scoped GET-only path defined in `.ai/manager/WR-061.md`. It must be limited to the four exact 2013–2016 retained custody identities already pinned by asset ID, SHA-256, byte size, and custody key; use the existing secret set; isolate secrets to trusted retrieval code; forbid provider mutation operations; verify exact B2/R2 bytes; clean raw runner-local bytes; publish no raw-byte artifacts; and provide a safe no-secrets consumer boundary for later WR-059 reconstruction.

Existing mutation-capable custody workflows/scripts are frozen and must not be modified by WR-061.

## Routing sequence

1. Work Helper publishes immutable WR-061 implementation + tests + protected four-object live proof.
2. Manager freezes exact WR-061 PR/head/run evidence and activates WR-062.
3. WR-062 independently audits. PASS-family only.
4. Manager merges only the exact audited WR-061 head and requires canonical-main post-merge canary because workflows/custody infrastructure are affected.
5. Only after accepted canary does Manager resume WR-059.
6. Completed WR-059 still requires WR-060 independent re-audit before any later model/contract decision.

## Boundaries

No 2026 regular-season outcomes, target joins, model fitting/scoring/tuning/comparison/evaluation, rankings, production changes, or Phase-6 work.

## Manager transaction rule

Coordinated control-plane transitions must use one atomic Git tree/commit whenever supported.
