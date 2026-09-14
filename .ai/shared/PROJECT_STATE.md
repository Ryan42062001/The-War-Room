# War Room Project State

Status: ACTIVE DEVELOPMENT — WORKFLOW V3.2 CANONICAL / WR-063 BLOCKED ON DEDICATED B2 READ CREDENTIAL
Last verified: 2026-09-14
Owner: Manager / Architect
Workflow: V3.2 CANONICAL

## Current accepted baseline

Repository: `Ryan42062001/The-War-Room`
Workflow V3.2 remains canonical. Atomic Manager reconciliation is mandatory.

Historical WR-042 PR #168 remains CLOSED UNMERGED after WR-043 `FAIL — REMEDIATION REQUIRED`. Positive custody evidence for the exact 15 retained byte identities remains preserved. `draft_picks.csv` remains excluded under WR-057.

WR-061 is CLOSED as a fail-closed historical checkpoint. WR-062 was never activated and is CLOSED without a verdict.

## WR-063 credential blocker

WR-063 PR #178 implemented the corrected authoritative identity/version-aware read path. Protected run `34901593729` / job `104168617065` authenticated to B2 and then stopped before listing because the existing shared custody credential lacks `listFiles`. Cleanup passed; zero raw artifacts and zero provider mutations occurred.

The existing shared B2 custody credential is already mutation-capable (`writeFiles`, retention/legal-hold write capabilities). Manager will not add `listFiles` to that credential merely to unblock reconstruction.

WR-063 is BLOCKED on user creation of a separate B2 read-only application key restricted to bucket `War-Room-Custody-Primary` and prefix `custody/sha256/`, with `listFiles` + `readFiles` and no mutation capabilities. Store it only in `WR_CUSTODY_B2_READ_KEY_ID` / `WR_CUSTODY_B2_READ_APPLICATION_KEY` GitHub Actions repository secrets.

## Active gates

- WR-063 — BLOCKED / USER_ACTION_REQUIRED for dedicated B2 read-only credential provisioning.
- WR-064 — BLOCKED until WR-063 produces a successful immutable four-object protected proof.
- WR-059 — BLOCKED until WR-064 PASS-family + exact WR-063 integration + canonical-main canary.
- WR-060 — BLOCKED on the eventual WR-059 evidence package.
- WR-042 — BLOCKED on WR-059 remediation.

## Next gate

User provisions the dedicated read-only B2 key and the two repository secrets without exposing their values in chat or source control. Manager then reactivates WR-063 for Work Helper to bind the dedicated secrets, verify the provider-issued capability/bucket/prefix boundary, and rerun the protected four-object proof.

Do not activate WR-064 yet.

No 2026 regular-season outcome inspection, target joins, model fitting/scoring/tuning/comparison/evaluation, rankings, production changes, or Phase-6 work is authorized.
