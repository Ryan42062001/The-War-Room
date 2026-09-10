# War Room Project State

Status: ACTIVE DEVELOPMENT — PHONE UX AUDIT + AVAILABILITY RESEARCH
Last verified: 2026-09-10
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

## Frozen prospective contract
WR-021 and WR-023 remain accepted/frozen. No post-kickoff development may inspect 2026 regular-season outcomes or modify/substitute the frozen snapshot/protocol.

## Workflow V3
WR-032 is COMPLETE / ACCEPTED / MERGED via PR #122 at `3a64cf33c635c04efc3a97e29ca939338385aeb1`.

Current operating model:
- ROLE = DURABLE;
- CHAT = DISPOSABLE;
- TASK = UNIT OF WORK;
- REPOSITORY = MEMORY;
- Manager routes the smallest legitimate team;
- Work mode is optional acceleration and never a substitute for a normal-chat fallback when one exists.

## Custom-ranking architecture
WR-029 is COMPLETE / ACCEPTED / MERGED via PR #121 at `f079220e8ed07280d08f13c5db006661728d7f35`.

Manager disposition:
- no WR-029 enrichment family is promoted into the returning-player model;
- WR-029 source/version/provenance/cutoff/coverage/missing-data/fallback governance is accepted as architecture evidence;
- the deterministic source-failure fallback remains `LOCKED_RIDGE`.

WR-033 is COMPLETE / CLOSED — Returning-Player v1 Specification Freeze.
Frozen research/development architecture:
- returning QB/RB/WR/TE ordering uses the exact WR-025 feature matrix and position-specific `StandardScaler -> Ridge(alpha=100)`;
- WR-027 calibrated risk remains warning/explanation-only by position;
- no direct risk rank modifier is authorized;
- Huber is not adopted;
- no WR-029 enrichment family is admitted;
- historical research/evaluation uses the fixed September 1 12:00 UTC target-season cutoff and explicit point-in-time/provenance/coverage/fallback rules;
- rookies remain separate;
- WR-D001 production ranking authority is unchanged.

WR-034 is ASSIGNED to R&D for Availability / Expected-Games Model Research. It is research-only and independent of the phone audit lane.

## Phone UX
WR-026 Builder implementation remains COMPLETE / AUDIT_READY on PR #120.
Candidate head: `ca7126a76df29ec1fa85020fe15acdca9c8c6c5b`.

Builder final exact-head and PR-integration CI were successful before later repository advances. Subsequent target advancement through WR-032, WR-029, and this Manager reconciliation is control-plane/research-only relative to WR-026's phone production surface. WR-031 must refresh the current PR/base tuple before its final verdict.

Physical-phone Level-4 validation remains NOT VERIFIED by Builder.

WR-031 remains ASSIGNED to Independent Auditor / QA for PR #120.

## Current roles
- Manager: IDLE after this reconciliation
- Builder: IDLE — WR-026 complete; awaiting WR-031 disposition
- Draft Strategy: IDLE
- R&D: ACTIVE — WR-034
- Auditor: ACTIVE — WR-031
- Temporary Troubleshooting: NOT INSTANTIATED

## Next gates
- WR-031 Auditor verdict -> Manager merge/rework decision for WR-026 / PR #120.
- WR-034 R&D handoff -> Manager Phase-4 disposition -> Phase-5 season-total task.
- Phase 3 Rookie Engine remains planned and unactivated; it may be scheduled independently when doing so is useful rather than for utilization.

No custom-ranking production-authority change is authorized.
