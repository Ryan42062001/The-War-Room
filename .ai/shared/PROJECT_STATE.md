# War Room Project State

Status: ACTIVE DEVELOPMENT — RETURNING-PLAYER V2 SOURCE CUSTODY
Last verified: 2026-09-11
Owner: Manager / Architect
Workflow: V3

## Canonical repository
Repository: `Ryan42062001/The-War-Room`
Branch: `main`
Fast-path task index: `.ai/shared/ACTIVE_TASKS.json`

## Production ranking authority
UNCHANGED under WR-D001:
- FantasyPros Top-20 Experts 2026 PPR ECR primary;
- broader FantasyPros PPR ECR fallback;
- ESPN rank/ADP timing only.

No custom ranking is production-authorized.

## Frozen boundaries
WR-021 / WR-023 remain accepted and frozen. No development work may inspect or substitute 2026 regular-season outcomes into the frozen prospective research chain.

WR-033 remains historical Returning-Player v1 under WR-D005. WR-034 remains accepted historical expected-games research under WR-D006. WR-D007 closed the v1 Phase-5 path as insufficiently provable and authorized the versioned v2 reset.

## WR-D008 — v2 evidence contract ACCEPTED
The prospective Returning-Player v2 evidence/provenance/rights/retention/reproducibility contract is accepted at exact audited WR-039 head:

`00a9e787e716d6697e6cd0d9252982a672abbbe0`

Machine-lock SHA-256:
`3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`

WR-040 independently returned:
`PASS WITH NON-BLOCKING FINDINGS`.

Audit head: `c68ef98b27f81e8e1fb26a36a1d2f8d5739b8824`.
Audit PR #130 merged at `24c375775d58a0d8a4c178576efde5df64a3eedd`.
Research PR #127 was then merged without rewriting the audited commit at `a0f090e5c8bbbf513e34c24a3fead7df2c094d44`; exact audited head `00a9e787...` is a direct parent of that merge.

No CRITICAL/HIGH/MEDIUM contract findings remain. LOW `WR-040-AUD-01` records repository browser-CI nondeterminism outside the audited research surface.

The accepted contract does NOT authorize model scoring.

## WR-042 — ACTIVE / ASSIGNED TO R&D
`Returning-Player v2 Exact Source-Custody Freeze`

R&D must now acquire, hash, rights-classify, retain, and freeze exact source instances under the accepted contract without fitting/scoring/evaluation or outcome joins.

Only contract-v1.0.0 source classes are admitted:
- `NFLVERSE_PLAYER_SUMMARY_STATS`
- `NFLVERSE_PLAYERS_METADATA_MINIMAL`
- `NFLVERSE_DRAFT_CAPITAL_MINIMAL`

Required evidence includes exact source/release/asset identity, byte SHA-256, schema/hash, row count, approved fields, cutoff semantics, per-instance rights disposition, project-controlled immutable custody, independently retrievable second copy, source-snapshot manifest/hash, and deterministic no-outcome cohort/source-eligibility evidence.

If exact lawful independently auditable custody cannot be established, WR-042 must fail closed rather than substitute or infer evidence.

No model protocol/scoring task may start from WR-042 alone.

## WR-043 — BLOCKED / INDEPENDENT SOURCE-CUSTODY AUDIT
WR-043 may activate only after WR-042 publishes one immutable no-scoring source-custody PR/head.

A PASS-family WR-043 verdict may authorize Manager to create a later **model-protocol freeze** task only. It still does not authorize scoring by itself.

## Parallel repository-reliability lane
### WR-044 — ACTIVE / ASSIGNED TO WORK HELPER
LOW finding `WR-040-AUD-01` is now a bounded Work Helper / Super Troubleshooter assignment.

WR-044 investigates recurring browser-CI nondeterminism/state-isolation failures seen on research/audit-only changes, including command-bar detach/hidden interaction and unexpected persisted browser state.

Work Helper has no fixed attempt ceiling. It may modify authorized CI/test-harness surfaces only and must not weaken assertions, mask failures with blanket retries, or change production/user-facing behavior. If production scope is required, it must stop with `ROOT CAUSE REQUIRES PRODUCTION SCOPE EXPANSION`.

### WR-045 — BLOCKED / INDEPENDENT CI REMEDIATION AUDIT
Any WR-044 remediation must pass independent audit before Manager acceptance.

## Phase 6
Phase 6 replacement/cross-position draft value remains BLOCKED until a later v2 model + season-total path is independently accepted and Manager explicitly opens the gate.

## Current roles
- Manager: IDLE after next-wave reconciliation
- Builder: IDLE
- Draft Strategy: IDLE
- R&D: ACTIVE / ASSIGNED — WR-042
- Auditor: IDLE / BLOCKED — WR-043 and WR-045
- Work Helper: ACTIVE / ASSIGNED — WR-044

## Next gates
1. WR-042 immutable no-scoring source-custody checkpoint -> WR-043 independent audit.
2. WR-043 PASS-family -> Manager may create a model-protocol freeze task; scoring remains separately gated.
3. In parallel, WR-044 CI/test-harness remediation -> WR-045 independent audit -> Manager acceptance.
4. Production ranking authority remains WR-D001 throughout.
