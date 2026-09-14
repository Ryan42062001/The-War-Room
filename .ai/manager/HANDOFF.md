# Manager / Architect Handoff

HANDOFF

Workflow: V3.2 CANONICAL

## Accepted upstream state

Historical WR-042 PR #168 remains closed unmerged after WR-043 `FAIL — REMEDIATION REQUIRED`. Positive custody evidence for the exact 15 retained byte identities remains valid. `draft_picks.csv` remains excluded under WR-057.

WR-061 is a closed immutable fail-closed checkpoint; WR-062 was never activated.

## WR-063 fail-closed credential result

WR-063 PR #178 is open. Current checkpoint head: `4a54161beeca5faed8bf267c977ac6dd3e4c13d7`.

Protected execution head `15a35b3626929090b374eff5fdf4da4d0dfd32ce`, run/job `34901593729` / `104168617065`, authenticated successfully to Backblaze B2 and then failed closed because provider-issued capabilities omit `listFiles`. No version query or B2/R2 object download occurred. Provider mutations: 0. Cleanup: PASS. Raw Actions artifacts: 0.

The existing shared B2 custody credential includes mutation authority (`writeFiles`, `writeFileRetentions`, `writeFileLegalHolds`). Manager rejects adding `listFiles` to that credential.

## Dedicated read-only credential decision

User action is required: create a separate Backblaze B2 application key restricted to bucket `War-Room-Custody-Primary` and file prefix `custody/sha256/`, with `listFiles` + `readFiles` and no mutation capabilities. Read-only retention/legal-hold capabilities are acceptable if included/needed; no write/delete/key-management/governance-bypass capability is authorized.

Store only in GitHub Actions repository secrets:

- `WR_CUSTODY_B2_READ_KEY_ID`
- `WR_CUSTODY_B2_READ_APPLICATION_KEY`

Do not replace the existing `WR_CUSTODY_B2_KEY_ID` / `WR_CUSTODY_B2_APPLICATION_KEY` secrets, because accepted custody workflows still require their mutation-capable contract.

## Active lanes

- WR-042 — BLOCKED on WR-059.
- WR-059 — BLOCKED on WR-064 acceptance/integration/canary.
- WR-060 — BLOCKED on eventual WR-059 immutable evidence target.
- WR-063 — BLOCKED / USER_ACTION_REQUIRED on dedicated B2 read credential provisioning.
- WR-064 — BLOCKED; do not activate until WR-063 produces a successful immutable four-object proof.

## Resume sequence

1. User creates the dedicated B2 read-only key and adds the two GitHub Actions secrets.
2. Manager verifies user action is complete and reactivates WR-063.
3. Work Helper updates only WR-063 authorized surfaces to consume the dedicated read secrets, verifies provider-issued bucket/prefix/capability scope, and reruns the protected four-object proof.
4. Successful WR-063 target is frozen and routed to WR-064 independent audit.
5. PASS-family permits exact WR-063 integration plus mandatory canonical-main canary.
6. Only after accepted canary does Manager resume WR-059.
7. Completed WR-059 still requires WR-060 independent re-audit.

## Boundaries

No upstream reacquisition, provider mutation, credential-value disclosure, 2026 regular-season outcomes, target joins, model fitting/scoring/tuning/comparison/evaluation, rankings, production changes, or Phase-6 work.

## Manager transaction rule

Coordinated control-plane transitions use one atomic Git tree/commit whenever supported.
