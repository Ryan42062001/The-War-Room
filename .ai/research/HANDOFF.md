# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-014
Role: Research & Development (R&D)
Status: ASSIGNED — ACTIVE
Parallel Work Wave: PW-002

## Previous task closure
WR-012 — Layout Efficiency & Information Architecture R&D is COMPLETE.
- research PR #112 merged as `e46ae94bc592d73560eb88258046acce19d3c0c6`
- Manager WR-015 synthesized WR-012 with WR-013 and closed PW-001
- R&D's former resource block is cleared

## Current assignment
Task: Advanced Metrics Ranking Model Feasibility
Manager task spec: `.ai/manager/WR-014.md`
Production implementation authorization: NONE

Refresh canonical state/current `main` before branching and record the actual starting SHA.

## Objective
Determine whether an open/licensable War Room-owned preseason projection/value model built from underlying football statistics can materially outperform or complement the current FantasyPros Top-20 PPR ECR baseline.

Required work includes:
- source/licensing matrix
- position-specific predictive feature families
- appropriate Full-PPR target definition
- injury/role/rookie/team-context strategy
- transparent vs higher-complexity modeling alternatives
- open-data-only vs hybrid vs full-replacement architecture
- leakage-safe rolling/held-out validation
- direct comparison standard against current ECR when lawful historical inputs permit
- seasonal refresh/fail-closed design
- explainability/downstream recommendation risk

## Source rule
Treat PFF as restricted unless separate explicit rights are established. Do not scrape, transcribe, reconstruct, train on, or derive a model from PFF data under ordinary access.

Prefer open/licensable data sources and independently verify their current terms, completeness, provenance, and refresh behavior.

## Parallel independence
Builder is executing WR-016 layout efficiency in parallel.

WR-014 vs WR-016: INDEPENDENT.
Do not inspect or modify Builder production UI work unless needed only to understand an established integration boundary. Do not change production rankings/UI/state.

## Required output
Produce:
- `.ai/research/ADVANCED_METRICS_RANKING_DISCOVERY.md`
- updated `.ai/research/HANDOFF.md`
- optional isolated/disposable `.ai/research/` experiment only when it materially reduces uncertainty

Outcome must be one of:
- READY FOR MANAGER MILESTONE CONSIDERATION
- R&D ONLY / MORE EVIDENCE NEEDED
- DO NOT PURSUE

Do not implement a production ranking model.
