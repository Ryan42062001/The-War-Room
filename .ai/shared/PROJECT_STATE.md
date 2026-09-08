# War Room Project State

Status: MAINTENANCE / STABLE
Last verified: 2026-09-08
Owner: Manager / Architect

## Canonical repository checkpoint

Repository: `Ryan42062001/The-War-Room`
Branch: `main`

Latest production merge remains:
- WR-003 / PR #108 merge SHA: `c5648122710d0720a59d8a8a79944b7ddf5b1d5a`

Latest completed discovery integration:
- WR-007 R&D PR #110 merge SHA: `276daacdfa506bf62ccab26deabf3a36af21ba0e`
- Roadmap Discovery concluded MAINTENANCE / STABLE and was accepted by Manager in WR-009

## Project mode

### MAINTENANCE / STABLE — ACTIVE

The War Room remains in maintenance/stable mode. No production milestone is active and no production implementation is currently authorized.

Maintenance/stable permits narrowly scoped trigger-driven investigation when a legitimate opportunity appears. The user has now raised a materially valuable ranking/data opportunity: determine which publicly available preseason rankings are most accurate and whether they can be ingested automatically.

## Active maintenance investigation

### WR-010 — Ranking Accuracy & Automated Ingestion Feasibility
Role: Research & Development (R&D)
Status: ASSIGNED / ACTIVE
Task spec: `.ai/manager/WR-010.md`
Starting SHA: `2cab85f981e06f5f19bd4a7631a28adf2f7ff351`
Production implementation authorized: NO

Objective:
- determine the strongest evidence-backed ranking source/cohort for the War Room's PPR redraft use case
- compare single-expert, top-N accurate-expert consensus, recency/accuracy-weighted approaches, and the current FantasyPros PPR ECR baseline
- evaluate supported automated ingestion routes, especially the official FantasyPros API
- review access/license constraints separately from technical feasibility
- propose a fail-closed importer design without modifying production

Manager preliminary evidence to be independently verified by R&D:
- FantasyPros publishes preseason Draft Accuracy and a 2023–2025 multi-year leaderboard
- public current results identify Jody Smith as the multi-year #1, while 2025 single-year #1 was Seth Miller
- FantasyPros Draft Accuracy is scored in Half-PPR, so it does not by itself prove a single best PPR expert
- FantasyPros now advertises an official API with PPR consensus/per-expert rankings, expert filtering, expert metadata, tiers, and player metadata
- API production/access terms must be checked before any production proposal

## Reactivation trigger classification

WR-010 trigger:
- materially valuable opportunity
- possible seasonal/data-refresh improvement

This trigger authorizes research only. It does not automatically reopen active production development.

## Verified product baseline

- Canonical player universe: 717 players, zero canonical duplicates in the established validation baseline.
- FantasyPros 2026 PPR ECR is the ranking/value authority; ESPN rank/ADP is timing/market information.
- Current production league baseline is PPR / snake with the established starter and bench structure.
- Ranking source refresh is controlled and current production data is not replaced casually.
- Companion manifest version remains `0.9.14`.
- Live ESPN sync/recovery closeout is complete with no blocking findings.
- Root `npm test` covers release, module, syntax, dataset, Companion, ESPN UX, browser, responsive, off-board, hardening, draft-awareness, scoring, invariant, persistence, recovery, and live-mock surfaces.

## Workflow baseline

- `.ai/shared/WORKFLOW.md` is canonical for team operation.
- WR-004 requires dependency classification, safe parallel execution, Parallel Work Waves, activation plans, and parallel PR safety.
- WR-006 defines Research & Development (R&D) and preserves `.ai/research/` as its role directory.
- WR-008 defines project maturity and MAINTENANCE / STABLE mode with explicit reactivation triggers.
- Manager remains the normal authority for `.ai/shared/*`, roadmap selection, architecture, integration, and production task authorization.
- `IDLE` is valid and desirable when no useful task exists.

## Task state

### WR-001 — Repository Operating Contract Bootstrap
Status: COMPLETE
PR: #109
Merge SHA: `2d9ccb2094776e25babb17c65b69390646853c37`

### WR-002 — ESPN Synthetic Navigation Attribution Level 4
Status: COMPLETE / PASS

### WR-003 — ESPN Completion-State Consistency
Status: COMPLETE / PASS / MERGED
PR: #108
Merge SHA: `c5648122710d0720a59d8a8a79944b7ddf5b1d5a`

### WR-004 — Parallel Task Orchestration Workflow Upgrade
Status: COMPLETE

### WR-005 — ESPN Live Sync Closeout Reconciliation
Status: COMPLETE

### WR-006 — Research & Development Role Expansion Workflow Update
Status: COMPLETE

### WR-007 — Roadmap Discovery: Next Milestone Candidate Evaluation
Status: COMPLETE
PR: #110
Outcome: MAINTENANCE / STABLE recommended

### WR-008 — Project Maturity / Maintenance Mode Rule
Status: COMPLETE

### WR-009 — Roadmap Discovery Decision / Maintenance-Stable Transition
Status: COMPLETE
Outcome: MAINTENANCE / STABLE accepted

### WR-010 — Ranking Accuracy & Automated Ingestion Feasibility
Role: Research & Development (R&D)
Status: ASSIGNED / ACTIVE
Production behavior changed: NO
Production implementation authorized: NO

## Open non-blocking findings

1. Legacy `AGENTS.md` process wording remains non-blocking; canonical `.ai/shared/*` wins.
2. Diagnostics can over-emphasize `Capture method: network` / candidate-shaped fetch counts when Pick History DOM is the ledger-eligible source.
3. Synthetic-navigation actor identity remains unknown at the verified WR-002 attribution ceiling.

These remain maintenance observations and are unrelated to WR-010 unless new evidence changes that assessment.

## Current workload / parallelism state

Active specialist tasks:
- R&D — WR-010

Idle specialist roles:
- Builder — IDLE
- Auditor — IDLE

Dependency analysis:
- WR-010 is INDEPENDENT of Builder and Auditor work
- no second legitimate approved task exists

Parallel Work Wave: none.

Do not authorize ranking-source changes, automatic ingestion, scoring changes, or production API integration until Manager reviews completed WR-010 evidence and creates an explicit production task if warranted.
