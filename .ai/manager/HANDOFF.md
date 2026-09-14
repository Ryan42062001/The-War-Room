# Manager / Architect Handoff

HANDOFF

Workflow: V3.2 CANONICAL

## Accepted upstream state

Historical WR-042 PR #168 remains closed unmerged after WR-043 `FAIL — REMEDIATION REQUIRED`. Positive custody evidence for the exact 15 retained byte identities remains valid. `draft_picks.csv` remains excluded under WR-057.

WR-061 is a closed immutable fail-closed checkpoint; WR-062 was never activated.

## WR-063 prior fail-closed credential result

WR-063 PR #178 remains open. Pre-reactivation checkpoint head: `4a54161beeca5faed8bf267c977ac6dd3e4c13d7`.

Protected execution head `15a35b3626929090b374eff5fdf4da4d0dfd32ce`, run/job `34901593729` / `104168617065`, authenticated successfully to Backblaze B2 and then failed closed because provider-issued capabilities omitted `listFiles`. No version query or B2/R2 object download occurred. Provider mutations: 0. Cleanup: PASS. Raw Actions artifacts: 0.

The existing shared B2 custody credential includes mutation authority, so Manager rejected adding `listFiles` to it.

## Dedicated read-only credential reactivation

The user has confirmed that a separate B2 read-only application key was created and stored in GitHub Actions repository secrets:

- `WR_CUSTODY_B2_READ_KEY_ID`
- `WR_CUSTODY_B2_READ_APPLICATION_KEY`

The existing shared custody secrets remain unchanged and must not be used by WR-063 B2 retrieval after reactivation.

User confirmation clears the provisioning blocker but does not prove provider scope. Work Helper must verify the provider-issued authorization response before any version listing/download and fail closed unless it proves:

- bucket exactly `War-Room-Custody-Primary`;
- prefix exactly `custody/sha256/` or a strictly narrower Manager-compatible boundary covering all four authoritative keys;
- `listFiles` and `readFiles` present;
- no mutation-capable capability present.

## Active lanes

- WR-042 — BLOCKED on WR-059.
- WR-059 — BLOCKED on WR-064 acceptance/integration/canary.
- WR-060 — BLOCKED on eventual WR-059 immutable evidence target.
- WR-063 — ASSIGNED / reactivated to Work Helper in `WORK_MODE_HIGH_VALUE` on branch `wr-063-retained-object-version-read-recovery`, continuing PR #178.
- WR-064 — BLOCKED; do not activate until WR-063 produces a successful immutable four-object proof.

## Resume sequence

1. Work Helper refreshes canonical main and the updated WR-063 task spec.
2. Update only WR-063-authorized workflow/script surfaces to consume the dedicated B2 read secrets instead of the shared B2 custody secrets.
3. Protected run proves the actual dedicated-key bucket/prefix/capability boundary before any list/download.
4. Complete exact-key version discovery, immutable-version B2 reads, exact-key R2 reads, authoritative digest/size checks, B2/R2 equality, 2013 by-name-404 reconciliation, secret isolation, cleanup, and zero raw artifacts for all four objects.
5. Successful WR-063 target is frozen by Manager and routed to WR-064 independent audit.
6. PASS-family permits exact WR-063 integration plus mandatory canonical-main canary.
7. Only after accepted canary does Manager resume WR-059.
8. Completed WR-059 still requires WR-060 independent re-audit.

## Boundaries

No upstream reacquisition, provider mutation, credential-value disclosure, 2026 regular-season outcomes, target joins, model fitting/scoring/tuning/comparison/evaluation, rankings, production changes, or Phase-6 work.

## Manager transaction rule

Coordinated control-plane transitions use one atomic Git tree/commit whenever supported.
