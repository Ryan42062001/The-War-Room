# The War Room — Speed Workflow V2.1 Roadmap

This is the canonical forward-looking phase roadmap. Historical WR task/control-plane state is preserved under `.history/workflow-v3-5/` for traceability but is no longer active governance.

## Current baseline

The core draft-day product is mature and includes the FantasyPros-authoritative 717-player board, recommendation logic, persistence/recovery, responsive/mobile UX, final reports, and read-only ESPN companion synchronization. WR-P01 now has accepted exact-current owner-operated evidence for the Board/Pick History fallback path; structured Direct mode remains unverified.

## Phases

| Phase | Capability | Risk | Status |
| --- | --- | --- | --- |
| WR-P01 | ESPN Board-Fallback Reliability Gate | HIGH | FREEZE_READY |
| WR-P02 | Structured Direct Mode Validation | HIGH | CONDITIONAL BACKLOG |
| WR-P03 | Draft-Day Reliability & UX Hardening | MEDIUM | FUTURE |

### WR-P01 — ESPN Board-Fallback Reliability Gate

The owner-only exact-current field check is complete and whole-phase preview is approved. Accepted evidence shows the Board/Pick History fallback can carry one disposable 10×16 Full-PPR snake mock at slot 5 through 160 numbered picks, correct Mine ownership, authoritative completion, and same-session reload without ledger drift.

No bounded product defect requiring remediation was established. A LOW nonblocking diagnostics-clarity finding remains: structured-observation `unresolvedPlayerIds` telemetry is presented beside accepted ledger counts and can be misread as unresolved fallback picks. Preserve the finding for independent audit / future UX hardening.

WR-P01 is now awaiting exact-head FULL PHASE CI, immutable freeze, and one fresh HIGH-risk independent phase audit.

Passing WR-P01 establishes the exact-current Board/Pick History fallback claim only. It does not establish structured Direct mode, production recovery readiness, or ESPN write authority.

**Decision after phase:** determine whether Board/Pick History fallback is reliable enough to be the supported ESPN synchronization path and whether Structured Direct would add enough value to justify WR-P02.

### WR-P02 — Structured Direct Mode Validation

Conditional. Start only if the WR-P01 closeout determines that Structured Direct would provide meaningful value beyond a reliable Board/Pick History fallback.

If activated, separately validate structured Direct acquisition in a disposable mock without weakening fallback behavior or expanding extension permissions. Direct validation is not a prerequisite for the fallback claim.

**Decision after phase:** determine whether Structured Direct becomes a supported enhancement or remains unsupported/deferred.

### WR-P03 — Draft-Day Reliability & UX Hardening

Future product-hardening phase focused on the reliability and usability of the supported draft-day experience after ESPN synchronization strategy is settled. Candidate scope includes refresh/reopen recovery, stale-session detection, service-worker/offline behavior, connection/fallback status clarity, mobile draft-day usability, error-state UX, and a focused pre-season regression pass.

WR-P03 does not reopen unrelated recovery/release claims or expand provider permissions. Its exact scope must be defined from the then-current product state when activated.

**Decision after phase:** determine whether the supported draft-day product is sufficiently hardened to serve as the next production-season baseline.

## Sequencing rule

WR-P01 is current. WR-P02 is optional rather than automatic. If WR-P01 shows that Direct mode does not justify its added complexity, WR-P02 may be skipped and WR-P03 may become the next phase.

## Persistent boundaries

- FantasyPros ECR remains player-value authority; ESPN signals remain market timing.
- ESPN integration remains read-only.
- Missing/ambiguous identities and live-source conflicts fail closed.
- Private owner data never enters GitHub/CI/shared evidence.
- Production deployment is a separate explicit Product Owner decision.
