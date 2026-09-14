# War Room Project State

Status: ACTIVE DEVELOPMENT — WORKFLOW V3.2 CANONICAL / WR-063 REACTIVATED ON DEDICATED B2 READ CREDENTIAL
Last verified: 2026-09-14
Owner: Manager / Architect
Workflow: V3.2 CANONICAL

## Current accepted baseline

Repository: `Ryan42062001/The-War-Room`
Workflow V3.2 remains canonical. Atomic Manager reconciliation is mandatory.

Historical WR-042 PR #168 remains CLOSED UNMERGED after WR-043 `FAIL — REMEDIATION REQUIRED`. Positive custody evidence for the exact 15 retained byte identities remains preserved. `draft_picks.csv` remains excluded under WR-057.

WR-061 is CLOSED as a fail-closed historical checkpoint. WR-062 was never activated and is CLOSED without a verdict.

## WR-063 reactivation

WR-063 PR #178 implemented the corrected authoritative-identity/version-aware read path. Prior protected run `34901593729` / job `104168617065` authenticated to B2 and failed closed before version listing because the existing shared custody credential lacked `listFiles`.

Manager rejected widening that shared mutation-capable credential and instead required a dedicated bucket/prefix-restricted B2 read-only key. The user has confirmed that the dedicated key was created and stored in GitHub Actions as:

- `WR_CUSTODY_B2_READ_KEY_ID`
- `WR_CUSTODY_B2_READ_APPLICATION_KEY`

That confirmation clears the USER_ACTION blocker. It is not provider-scope proof.

WR-063 is reactivated. Before any version listing or download, Work Helper must prove from the provider-issued authorization response that the dedicated key is restricted to bucket `War-Room-Custody-Primary`, prefix `custody/sha256/` (or a strictly narrower compatible prefix), includes `listFiles` + `readFiles`, and contains no mutation capability. Any mismatch fails closed.

The existing shared custody secrets remain unchanged and must not be used by the WR-063 B2 read path.

## Active gates

- WR-063 — ASSIGNED / Work Helper resumes in `WORK_MODE_HIGH_VALUE` on PR #178 using the dedicated B2 read secrets.
- WR-064 — BLOCKED until WR-063 produces a successful immutable four-object protected proof.
- WR-059 — BLOCKED until WR-064 PASS-family + exact WR-063 integration + canonical-main canary.
- WR-060 — BLOCKED on the eventual WR-059 evidence package.
- WR-042 — BLOCKED on WR-059 remediation.

## Next gate

Work Helper updates only WR-063-authorized surfaces to consume the dedicated read secrets, verifies the actual provider boundary, and reruns the protected four-object proof. Do not activate WR-064 until the proof succeeds and Manager freezes the exact target.

No upstream reacquisition, provider mutation, credential-value disclosure, 2026 regular-season outcome inspection, target joins, model fitting/scoring/tuning/comparison/evaluation, rankings, production changes, or Phase-6 work is authorized.
