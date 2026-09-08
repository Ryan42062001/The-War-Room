# War Room Project State

Status: MAINTENANCE / STABLE — BOUNDED DISCOVERY ACTIVE
Last verified: 2026-09-08
Owner: Manager / Architect

## Canonical repository checkpoint

Repository: `Ryan42062001/The-War-Room`
Branch: `main`

PW-001 layout-discovery starting checkpoint:
- canonical `main`: `8df161ba8c5413b0cc3c11f87041c4ad80046dc0`
- latest production merge remains WR-003 / PR #108: `c5648122710d0720a59d8a8a79944b7ddf5b1d5a`
- latest R&D evidence merge before PW-001: WR-010 / PR #111 `ce2ab0b75fd88549fb8def0509de4b801faa0e1c`
- no production behavior changed by WR-011 or PW-001 assignment commits

## Project mode

### MAINTENANCE / STABLE — ACTIVE

The War Room remains in maintenance/stable mode. No production milestone is active and no production implementation is authorized.

A new legitimate maintenance trigger is active: the user asked whether the website layout can be researched for maximum draft-day efficiency and whether there are evidence-backed improvements worth making.

Manager classified this as a materially valuable usability opportunity and activated evidence-gathering only.

## Active maintenance discovery

### PW-001 — Layout Efficiency Discovery — ACTIVE

Two independent tasks run in parallel:

### WR-012 — Layout Efficiency & Information Architecture R&D
Role: Research & Development (R&D)
Status: ASSIGNED / ACTIVE
Task spec: `.ai/manager/WR-012.md`
Objective: research current evidence-backed high-efficiency layout/information-architecture patterns and identify prioritized War Room improvements without changing production.
Expected evidence: `.ai/research/LAYOUT_EFFICIENCY_DISCOVERY.md`
Production implementation authorized: NO

### WR-013 — Current Layout Efficiency & Usability Baseline Audit
Role: Independent Auditor / QA
Status: ASSIGNED / ACTIVE
Task spec: `.ai/manager/WR-013.md`
Objective: independently measure current War Room viewport use, interaction friction, responsive ergonomics, and core draft-flow efficiency across desktop/tablet/mobile.
Expected evidence: `.ai/auditor/LAYOUT_AUDIT.md`
Production implementation authorized: NO

Independence rule:
- WR-012 and WR-013 are INDEPENDENT during first-pass evidence gathering and may run simultaneously.
- Auditor should not anchor its first-pass findings on R&D's final recommendations.
- Manager synthesis has a HARD DEPENDENCY on both completed handoffs before any UI implementation decision.

## Verified current layout baseline

Repository evidence at PW-001 start:
- `index.html` places header, board/search/filter toolbar, status/session/marking controls, tier navigation, draft-position/recommendation/board-pressure surfaces, Position Tiers/Overall boards, and My Draft in the current page architecture.
- `style-base.css` makes header, toolbar, status bar, and tier navigation sticky at successive offsets.
- `style.css` contains an explicit Position Tiers density pass and expands Position-view main content to 1320px.
- `command-bar-fixes.css` adapts the command bar at desktop/tablet/mobile breakpoints and permits status-bar wrapping at <=900px.
- `scripts/test-responsive-overflow.mjs` checks 13 widths from 320 through 1280 across both Position and Overall views and asserts zero document horizontal overflow.

These establish intentional responsive/density work, but they do not prove the current information hierarchy is optimal. PW-001 is intended to measure that question rather than assume a redesign is needed.

## Existing production baseline

- Canonical player universe: 717 players, zero canonical duplicates in the established validation baseline.
- FantasyPros Top-20 Experts 2026 PPR ECR remains primary ranking/value authority; broader PPR ECR remains controlled fallback.
- ESPN rank/ADP remains market-timing information only.
- Current production league baseline is PPR / snake with established starter/bench structure.
- ESPN Live Sync reliability closeout remains complete with no blocking findings.
- Root `npm test` covers release, module, syntax, dataset, Companion, ESPN UX, browser, responsive, off-board, hardening, draft-awareness, scoring, invariant, persistence, recovery, and live-mock surfaces.

## Ranking automation disposition retained

WR-010 / WR-011 remain COMPLETE. Automatic FantasyPros ingestion is not active production work. Future production consideration still requires provider compatibility, live API completeness, and material-value evidence.

## Workflow baseline

- `.ai/shared/WORKFLOW.md` is canonical for team operation.
- WR-004 requires dependency classification, safe parallel execution, Parallel Work Waves, activation plans, and parallel PR safety.
- WR-006 defines Research & Development (R&D) and preserves `.ai/research/` as its role directory.
- WR-008 defines project maturity and MAINTENANCE / STABLE mode.
- Manager remains normal authority for `.ai/shared/*`, roadmap selection, architecture, integration, and production task authorization.
- `IDLE` is valid when no useful task exists.

## Task state

### WR-001 — Repository Operating Contract Bootstrap
Status: COMPLETE
PR: #109

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
Status: COMPLETE
PR: #111
Outcome: R&D ONLY / MORE EVIDENCE NEEDED

### WR-011 — WR-010 Research Disposition / Maintenance Return
Status: COMPLETE

### WR-012 — Layout Efficiency & Information Architecture R&D
Role: R&D
Status: ASSIGNED / ACTIVE
Parallel wave: PW-001
Production implementation authorized: NO

### WR-013 — Current Layout Efficiency & Usability Baseline Audit
Role: Independent Auditor / QA
Status: ASSIGNED / ACTIVE
Parallel wave: PW-001
Production implementation authorized: NO

## Open non-blocking findings

1. Legacy `AGENTS.md` process wording remains non-blocking; canonical `.ai/shared/*` wins.
2. Diagnostics can over-emphasize `Capture method: network` / candidate-shaped fetch counts when Pick History DOM is ledger-eligible authority.
3. Synthetic-navigation actor identity remains unknown at the verified WR-002 attribution ceiling.
4. Ranking automation remains technically promising but gated before production consideration.

These are unrelated to PW-001 unless evidence shows a direct layout impact.

## Current workload / parallelism state

PARALLEL WORK WAVE: PW-001

Active specialist tasks:
- R&D — WR-012
- Auditor — WR-013

Idle specialist roles:
- Builder — IDLE

Dependency classification:
- WR-012 vs WR-013: INDEPENDENT during evidence gathering
- Manager UI decision: HARD DEPENDENCY on both completed evidence streams
- any Builder implementation: HARD DEPENDENCY on Manager synthesis and a separate approved production task

Do not authorize production HTML/CSS/JS changes until Manager reviews both WR-012 and WR-013 and explicitly creates an implementation task if the evidence justifies one.
