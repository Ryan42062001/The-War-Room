# War Room Project State

Status: ACTIVE
Last verified: 2026-09-07
Owner: Manager / Architect

## Canonical repository checkpoint

Repository: `Ryan42062001/The-War-Room`
Branch: `main`
Verified main SHA: `a6506d5815e6ec9027f71da759fbe607a40b5020`
Latest merged PR at this checkpoint: #107 — Fix War Room tablet overflow

Validation on this exact main SHA:

- War Room CI #634: completed / success
- GitHub Pages #558: completed / success

## Current milestone

**ESPN Live Sync reliability / live-validation closeout**

The ranking system, draft-state hardening, persistence/recovery hardening, off-board ESPN pick handling, Companion trust UX, popup sizing regression, synthetic-click provenance V1–V3, and tablet document-overflow fix are already merged.

The milestone is **not complete** because remaining live-sync work still requires new-contract task identification and appropriate validation/audit.

## Verified product baseline

- Canonical player universe: 717 players, zero canonical duplicates in the established validation baseline.
- FantasyPros 2026 PPR ECR is the ranking/value authority; ESPN rank/ADP is timing/market information.
- Companion manifest version on current main: `0.9.14`.
- Current Companion permissions remain `storage` and `scripting` with narrow ESPN / War Room host permissions.
- Live disposable ESPN mocks have shown Pick History DOM to be the practical usable numbered-pick source when structured feeds are behind or empty.
- Authoritative ESPN off-board numbered picks are preserved as external picks and count toward draft progress without being inserted into the canonical recommendation pool.

## Active / pending work under the new operating contract

### WR-001 — Repository Operating Contract Bootstrap

Role: Manager / Architect
Status: IN PROGRESS
Objective: establish canonical `.ai/` workflow/state files, remove repository workflow ambiguity, and map current work to Task IDs before further production integration.
Starting SHA: `a6506d5815e6ec9027f71da759fbe607a40b5020`

### WR-002 — ESPN Synthetic Navigation Attribution Level 4

Role: Independent Auditor / QA for live validation
Status: PENDING LIVE VALIDATION
Objective: run one short disposable ESPN mock on the merged provenance V3 implementation and determine whether automatic Players → Pick History → Players transitions can be attributed to a sanitized ESPN, extension, page-bundle, other-web, or genuinely unknown caller.
Current code state: provenance V3 is already merged through PR #106 and included in current main.
Required validation level: Level 4.
Blocking milestone completion: YES for final attribution closure; NO for already-proven pick synchronization correctness.

### WR-003 — ESPN Completion-State Consistency

Role: Implementation Engineer, then Independent Auditor / QA
Status: IMPLEMENTATION PR OPEN / NOT AUDITED
Objective: prevent a complete authoritative numbered-pick ledger from being contradicted by a later false UI-derived `draftComplete` heartbeat after Rescan.
PR: #108 — Keep ESPN completion consistent with complete pick ledger
Current PR base: `main` at `a6506d5815e6ec9027f71da759fbe607a40b5020`
Current PR head: `d9b537ddac665207ab61aed7527d7da986cc4815`
PR state: open, mergeable, not merged
Audit requirement: REQUIRED because this changes live synchronization state behavior.
Merge status under new workflow: BLOCKED pending Manager task package normalization and independent Auditor verdict.

## Recently completed integration history

The following work was completed before adoption of the WR Task-ID operating contract and is retained as historical context rather than retroactively renumbered:

- #101 synthetic click attribution V1
- #102 authoritative ESPN off-board pick correctness
- #103 ESPN Live Sync trust UX
- #104 Companion action-popup intrinsic width regression fix
- #105 synthetic click attribution V2
- #106 synthetic click attribution V3
- #107 War Room tablet responsive overflow fix

## Open findings

1. **Synthetic ESPN view flicker caller not yet live-attributed.** V3 is merged; one short Level-4 run remains.
2. **Completion-state consistency PR #108 needs independent audit before merge.**
3. **Legacy `AGENTS.md` still contains historical roadmap/workflow language.** It must defer to `.ai/shared/*` so there is one canonical project-management source of truth.
4. **Diagnostics wording remains imperfect:** `Capture method: network` and recurring fetch candidate-shaped counts can be misleading when DOM is the actual usable numbered-pick authority. This is non-blocking and not currently assigned to an implementation task.

## Merge discipline from this checkpoint

Do not merge new production behavior solely from worker completion summaries. Apply Task ID, stale-branch, evidence, validation-level, and independent-audit rules from `.ai/shared/WORKFLOW.md`.
