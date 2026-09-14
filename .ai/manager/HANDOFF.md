# Manager / Architect Handoff

HANDOFF

Workflow: V3.2 CANONICAL

## Accepted upstream state

WR-043 is CLOSED with `FAIL — REMEDIATION REQUIRED`; historical WR-042 PR #168 remains closed unmerged. Positive custody evidence for the exact 15 retained byte identities remains valid. `draft_picks.csv` remains excluded under WR-057.

Canonical main before this routing transaction: `1ddf15b7e5f97e1857926bd9016a626e7fb3a702`.

## WR-061 fail-closed checkpoint

WR-061 PR #176 is CLOSED UNMERGED at exact head:

`5aff59928c4090730959d3f45bbae1483d34fde6`

Disposition:

`FAIL CLOSED — SAFE PRE-AUDIT LIVE PROOF BLOCKED`

The architecture/tests were useful, but no successful four-object protected proof exists. Three protected B2 attempts failed closed; cleanup passed and zero raw artifacts were produced. WR-062 was never activated and is CLOSED without an audit verdict.

The decisive contradiction was a Manager pinning error: WR-061's 2014–2016 hashes/keys did not match the executed WR-042 manifest/result. The authoritative values are now corrected in WR-059 and WR-063.

The authoritative 2013 key did match, but a native B2 by-name download returned HTTP 404. Historical WR-042 had previously proven successful B2 custody for that exact byte identity, so the provider's retained historical version state must be investigated rather than silently reacquired or replaced.

## Active lanes

- WR-042 — BLOCKED on WR-059.
- WR-059 — BLOCKED on WR-064 acceptance/integration/canary.
- WR-060 — BLOCKED on the eventual immutable WR-059 evidence target.
- WR-063 — ASSIGNED to Work Helper, `WORK_MODE_HIGH_VALUE`, branch `wr-063-retained-object-version-read-recovery`.
- WR-064 — BLOCKED on one immutable successful WR-063 target.

## WR-063 authorization

Work Helper may use the existing provider secret set in the protected environment to perform only non-mutating provider operations.

For B2, exact-full-key bounded retained-version discovery is authorized, including read-only file-version metadata and version/file-ID-addressed download of exact candidate retained upload versions. Broad bucket/prefix enumeration is not authorized. Exact file-name equality, authoritative digest/size verification, privacy-safe provider-state evidence, secret isolation, cleanup, and zero raw artifacts are mandatory.

For R2, only exact-key read/HEAD operations and existing lock/config reads when necessary are authorized.

No provider mutation, upstream reacquisition, secret-scope change, source substitution, or model/research semantic work is authorized.

Historical WR-061 PR #176 may be inspected and selectively reimplemented but must remain closed unmerged.

## Routing sequence

1. Work Helper executes WR-063 in Work mode/high-value mode.
2. Successful WR-063 publishes one immutable implementation/live-proof PR/head.
3. Manager freezes exact target/run evidence and activates WR-064.
4. WR-064 independently audits. PASS-family only.
5. Manager integrates only the exact audited WR-063 head and requires canonical-main post-merge canary.
6. Only after accepted canary does Manager resume WR-059.
7. Completed WR-059 still requires WR-060 independent re-audit.

## Boundaries

No 2026 regular-season outcomes, target joins, model fitting/scoring/tuning/comparison/evaluation, rankings, production changes, or Phase-6 work.

## Manager transaction rule

Coordinated control-plane transitions must use one atomic Git tree/commit whenever supported.
