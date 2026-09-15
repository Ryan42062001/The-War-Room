# War Room Roadmap

Status: ACTIVE DEVELOPMENT
Last updated: 2026-09-15
Owner: Manager / Architect

## Workflow foundation

- V3.2 — CANONICAL / ACCEPTED.
- WR-054 — CLOSED. Workflow V3.2 implementation accepted and merged; canonical-main canary `34872984380` PASS.
- WR-055 — CLOSED. Independent V3.2 audit `PASS`, no findings.

## Phase 5B — Returning-Player v2 evidence reset — ACTIVE

- WR-042 — BLOCKED / exact 15-source raw custody evidence remains preserved and must not be reacquired.
- WR-043 — CLOSED / `FAIL — REMEDIATION REQUIRED`; its two HIGH findings remain the reason WR-059 exists.
- WR-056 — CLOSED / trusted custody runtime bridge accepted and merged.
- WR-057 — CLOSED / `RAW_CUSTODY_NOT_ESTABLISHED — EXCLUDE_SOURCE` for PFR-derived nflverse `draft_picks.csv`.
- WR-058 — CLOSED / independent custody-bridge audit PASS.
- WR-059 — REWORK_REQUIRED / PR #196 remains open and unmerged. WR-060 independently passed the cohort/custody work but found one HIGH replacement-`players.csv` provenance defect.
- WR-060 — CLOSED / audit PR #198, immutable head `5ae432ca8e7c32dad56701a9792cb55d59150611`, verdict `FAIL — REMEDIATION REQUIRED`, one HIGH finding `WR-060-AUD-01`, no CRITICAL/MEDIUM/LOW findings; audit evidence merged at `acf599e31ad8638f8e1ba399ea2e4328e5ff7bd0`.
- WR-061 — CLOSED / immutable fail-closed historical checkpoint, PR #176 unmerged.
- WR-062 — CLOSED / never activated.
- WR-063 — CLOSED / accepted retained-version read recovery.
- WR-064 — CLOSED / independent audit PASS, no findings.
- WR-065 — CLOSED / fail-closed parser checkpoint.
- WR-066 — CLOSED / never activated.
- WR-067 — CLOSED / deterministic CSV schema-inference clarification accepted and integrated.
- WR-068 — CLOSED / independent audit PASS, no findings.
- WR-069 — CLOSED / accepted retained safe-consumer parser evidence.
- WR-070 — CLOSED / independent audit PASS, no findings.
- WR-071 — BLOCKED / fresh independent re-audit of the next Manager-frozen remediated WR-059 target.

### WR-060 result preserved

Independently reproduced positive evidence:

- source snapshot hash `f6ee530c7733b1aa9d984a3e874015ca9a3dd7cebda5ffc558df4cb159c591b9`;
- cohort hash `d6927509968ac3a371591a69fd665861e9546a0868f1e7b1c5db6c31cc887354`;
- 15/15 historical custody identities;
- 5,176/5,176 ordered unique cohort keys;
- 1,668 keys for 2014–2017 and 3,508 for 2018–2025;
- zero duplicates and exact prior-season source lineage;
- `draft_picks.csv` exclusion and all no-reacquisition/no-model boundaries.

Blocking defect:

`WR-060-AUD-01 — HIGH` — replacement `players.csv` lacks independently reproducible exact release ID and full provider-update timestamp required for an admitted WR-039 source instance.

Current sequence:

`WR-059 bounded metadata-provenance remediation on PR #196 -> Manager freezes new immutable head + new canonical artifact identities/hashes -> WR-071 fresh independent audit -> Manager disposition -> later versioned contract/feature-schema governance gate before model work`

No model fitting, scoring, tuning, evaluation, target joins, 2026 regular-season outcome use, ranking/production change, provider mutation, source reacquisition, or Phase-6 work is authorized.

## Infrastructure roadmap — FUTURE / NON-BLOCKING

### Self-hosted heavy-CI runner lane — PLANNED CANDIDATE

Purpose: use the user-operated GitHub Actions self-hosted runner for expensive repeatable CI while preserving independent and security-sensitive validation boundaries.

Activation gate:

- do not activate or implement this lane while WR-059 / WR-071 evidence remediation and re-audit are in flight;
- create a separate Manager-approved infrastructure task after the current Returning-Player v2 audit gate reaches a stable disposition.

Initial target scope:

- migrate only the heavyweight browser/test workload from `ubuntu-latest` to a dedicated self-hosted runner lane;
- keep lightweight CI classification and Governance on GitHub-hosted runners initially so canonical policy validation remains independently reproducible;
- keep custody, retained-source, protected-proof, or other credential-bearing workflows on GitHub-hosted runners unless a later separately reviewed security task explicitly authorizes otherwise.

Required design controls before activation:

- dedicated labels, e.g. `[self-hosted, linux, x64, war-room]`, rather than generic `self-hosted` targeting;
- explicit runner health/preflight checks and deterministic Node/Python/browser dependency validation;
- repository/workspace cleanup between jobs and protection against stale state affecting later runs;
- no B2/R2 custody credentials, retained raw source bytes, or protected evidence authority available to the heavy-CI runner by default;
- no production or provider-mutation credentials available to the runner by default;
- GitHub-hosted fallback path if the local runner is offline, unhealthy, or fails preflight;
- benchmark current GitHub-hosted versus self-hosted full-CI runtime before permanent migration;
- preserve exact-head CI traceability and auditability after routing changes;
- perform a fresh independent audit of the runner-routing change before treating it as canonical infrastructure.

Success criterion: heavy browser/test CI can execute reliably on the self-hosted runner without weakening Governance independence, custody boundaries, secret isolation, exact-head traceability, or GitHub-hosted fallback capability.

## Future phases

- Phase 3 rookie engine v1 — PLANNED.
- Phase 6 replacement/cross-position draft value — BLOCKED until accepted v2 season-total path.
- Phase 7 complete historical replay — PLANNED.
- Phase 8 2026 custom development board — PLANNED.
- Phase 9 shadow production integration — PLANNED.
- Phase 10 independent engine QA — PLANNED.
- Phase 11 prospective validation — FROZEN / EVENT-DRIVEN.
- Phase 12 production-ranking promotion decision — FUTURE / CONDITIONAL.
