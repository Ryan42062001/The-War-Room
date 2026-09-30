# The War Room — Speed Workflow V2.1 Roadmap

This is the canonical forward-looking phase roadmap. Historical WR task/control-plane state is preserved under `.history/workflow-v3-5/` for traceability but is no longer active governance.

## Current baseline

The core draft-day product is mature and includes the FantasyPros-authoritative 717-player board, recommendation logic, persistence/recovery, responsive/mobile UX, final reports, and read-only ESPN companion synchronization.

WR-P01 is CLOSED. Exact-current owner-operated evidence established the Board/Pick History fallback path for one disposable 10-team × 16-round Full-PPR snake mock at slot 5 through 160 numbered picks, correct Mine ownership, authoritative completion, and same-session reload without ledger drift.

Structured Direct remains unverified.

## Phases

| Phase | Capability | Risk | Status |
| --- | --- | --- | --- |
| WR-P01 | ESPN Board-Fallback Reliability Gate | HIGH | CLOSED |
| WR-P02 | Structured Direct Mode Validation | HIGH | CONDITIONAL BACKLOG / DEFERRED |
| WR-P03 | Draft-Day Reliability & UX Hardening | MEDIUM | PLANNED |

### WR-P01 — ESPN Board-Fallback Reliability Gate

CLOSED.

Accepted outcome:
- Board/Pick History fallback is reliable enough within the observed WR-P01 envelope to serve as the supported ESPN synchronization path for now.
- No bounded product defect requiring remediation was established.
- Structured Direct was not validated.
- One LOW diagnostics-clarity finding remains backlogged: `unresolvedPlayerIds` is structured-observation telemetry but is presented near accepted-ledger counts in a way that can be misread.

Passing WR-P01 does not establish Structured Direct mode, broader ESPN format coverage, production recovery readiness, ESPN write authority, or production deployment readiness.

**Decision after phase:** fallback is accepted as the supported path for now; WR-P02 is deferred unless Direct later demonstrates material incremental value.

### WR-P02 — Structured Direct Mode Validation

Conditional and deferred.

Do not activate WR-P02 merely because Structured Direct exists. Start only if Ryan later determines that Direct would provide meaningful value beyond the proven Board/Pick History fallback.

If activated, separately validate structured Direct acquisition in a disposable mock without weakening fallback behavior or expanding extension permissions. Direct validation is not a prerequisite for the supported fallback claim.

**Decision after phase:** determine whether Structured Direct becomes a supported enhancement or remains unsupported/deferred.

### WR-P03 — Draft-Day Reliability & UX Hardening

PLANNED next phase.

Focus the next phase on reliability and usability of the supported draft-day experience now that the ESPN fallback strategy is settled. Candidate scope includes:

- refresh/reopen recovery;
- stale-session detection;
- service-worker/offline behavior;
- connection/fallback status clarity;
- clearer diagnostics, including the WR-P01 LOW structured-observation wording finding;
- mobile draft-day usability;
- error-state UX;
- a focused pre-season regression pass.

WR-P03 must define its exact scope from the then-current product state at activation and must not reopen unrelated recovery/release claims or expand provider permissions.

**Decision after phase:** determine whether the supported draft-day product is sufficiently hardened to serve as the next production-season baseline.

## Sequencing rule

WR-P03 is the next planned phase.

WR-P02 remains available as a conditional branch of the roadmap, not an automatic prerequisite. It may be activated later only if the Product Owner determines Structured Direct offers enough incremental value to justify its complexity and HIGH-risk validation cost.

## Persistent boundaries

- FantasyPros ECR remains player-value authority; ESPN signals remain market timing.
- ESPN integration remains read-only.
- Missing/ambiguous identities and live-source conflicts fail closed.
- Private owner data never enters GitHub/CI/shared evidence.
- Production deployment is a separate explicit Product Owner decision.
