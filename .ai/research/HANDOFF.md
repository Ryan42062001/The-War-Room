# Research & Development (R&D) Handoff

Status: ASSIGNED — WR-007 / NOT YET COMPLETED

The former Research / Investigation role is now **Research & Development (R&D)**. Existing evidence, repository-ownership, research, and handoff rules remain in force.

## Current assignment

Task ID: WR-007
Task: Roadmap Discovery — Next Milestone Candidate Evaluation
Manager task spec: `.ai/manager/WR-007.md`
Starting SHA: `3e5cffb86c3ab6c55803d4f0f6a8a07218b81e0f`
Current discovery milestone: Roadmap Discovery — Next Milestone Selection

Objective:
Identify and rank the strongest legitimate next War Room milestone candidates using repository evidence, external research where useful, and bounded non-production R&D. Explicitly determine whether any candidate is strong enough to justify active development.

Valid discovery outcomes:
1. Recommend a bounded successor production milestone, with at least one credible runner-up; or
2. Recommend **MAINTENANCE / STABLE** mode if no candidate clears the active-development threshold.

If recommending maintenance/stable mode, identify the strongest/closest candidates, explain why they are not worth active development now, and state the concrete evidence or trigger that would justify revisiting them.

Canonical maintenance reactivation triggers include:
- verified defects
- real-world user feedback
- changed external dependencies
- new product requirements
- materially valuable opportunities
- seasonal/data updates
- previously unresolved risks becoming actionable

Expected role-owned outputs:
- `.ai/research/ROADMAP_DISCOVERY.md`
- updated `.ai/research/HANDOFF.md`

Production implementation authorization: NONE.

R&D may use isolated/disposable experiments only if they materially reduce uncertainty and remain outside production paths. Do not modify production code or canonical `.ai/shared/*` state.

Final roadmap selection or maintenance/stable decision remains Manager authority.

## Authorized R&D work

Manager-assigned R&D may include:
- external APIs, documentation, data sources, feasibility, and difficult technical uncertainty
- forward-looking product and technical R&D
- evaluating algorithms, integrations, and future architectures
- isolated/disposable experiments and proofs of concept
- identifying meaningful product/reliability gaps
- supporting Roadmap Discovery
- preparing evidence-backed future milestone proposals
- dependency-safe parallel R&D alongside current milestone work

## Authority limits

- R&D does not select the final roadmap
- R&D does not modify production code without an approved implementation assignment
- R&D does not modify canonical `.ai/shared/*` state
- R&D does not merge production work
- R&D does not audit its own production implementation

## Directory compatibility

- `.ai/research/` remains the R&D role-owned directory
- do not create `.ai/rnd/` unless a future Manager decision explicitly requires it

## Exact next action

Refresh canonical repository state and execute the revised WR-007 exactly as specified in `.ai/manager/WR-007.md`. Produce the evidence-backed candidate ranking and return one of the two valid outcomes: a justified successor milestone or a justified MAINTENANCE / STABLE recommendation. Do not begin production implementation of any candidate.
