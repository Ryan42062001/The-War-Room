# The War Room — Speed Workflow V2.1 Roadmap

This is the canonical forward-looking phase roadmap. Historical WR task/control-plane state is preserved under `.history/workflow-v3-5/` for traceability but is no longer active governance.

## Current baseline

The core draft-day product is mature and includes the FantasyPros-authoritative 717-player board, recommendation logic, persistence/recovery, responsive/mobile UX, final reports, and read-only ESPN companion synchronization. Historical live evidence established a successful Board/Pick History fallback on prior builds, while structured Direct mode remains unverified.

## Phases

| Phase | Capability | Risk | Status |
| --- | --- | --- | --- |
| WR-P01 | ESPN Board-Fallback Reliability Gate | HIGH | PLANNED |
| WR-P02 | Structured Direct Mode Validation | HIGH | BACKLOG |

### WR-P01 — ESPN Board-Fallback Reliability Gate

Translate useful WR-153/154 intent into one coherent phase: exact-current runtime/companion identity, one privacy-safe owner-operated disposable 10×16 Full-PPR snake mock at slot 5, numbered fallback parity, bounded repairs if required, full CI, and one fresh independent phase audit.

Passing WR-P01 establishes the exact-current Board/Pick History fallback claim only. It does not establish structured Direct mode, production recovery readiness, or ESPN write authority.

### WR-P02 — Structured Direct Mode Validation

Deferred. If still valuable after WR-P01, separately validate structured Direct acquisition in a disposable mock without weakening fallback behavior or expanding extension permissions. Direct validation is not a prerequisite for the fallback claim.

## Persistent boundaries

- FantasyPros ECR remains player-value authority; ESPN signals remain market timing.
- ESPN integration remains read-only.
- Missing/ambiguous identities and live-source conflicts fail closed.
- Private owner data never enters GitHub/CI/shared evidence.
- Production deployment is a separate explicit Product Owner decision.
