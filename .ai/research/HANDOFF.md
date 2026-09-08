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
Identify, compare, rank, and recommend the strongest legitimate next War Room milestone candidates using repository evidence, external research where useful, and bounded non-production R&D.

Expected role-owned outputs:
- `.ai/research/ROADMAP_DISCOVERY.md`
- updated `.ai/research/HANDOFF.md`

Production implementation authorization: NONE.

R&D may use isolated/disposable experiments only if they materially reduce uncertainty and remain outside production paths. Do not modify production code or canonical `.ai/shared/*` state.

Final roadmap selection remains Manager authority.

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

Refresh canonical repository state and execute WR-007 exactly as specified in `.ai/manager/WR-007.md`. Produce the evidence-backed candidate ranking and return the task to Manager / Architect for roadmap selection. Do not begin production implementation of any candidate.
