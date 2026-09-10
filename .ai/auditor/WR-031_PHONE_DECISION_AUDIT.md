# WR-031 — Independent Audit of WR-026 Phone Decision View

Task ID: WR-031  
Role: Independent Auditor / QA  
Audited PR: #120  
Audited head: `ca7126a76df29ec1fa85020fe15acdca9c8c6c5b`  
Audit-start/current-main checkpoint: `7071209d9de06e398d153c7590957669399e25b8`  
Verdict: **FAIL — REMEDIATION REQUIRED**

## Scope and evidence

PR #120 changes exactly 10 files: Builder handoff, CI workflow, phone/layout presentation JavaScript and CSS, package/test scripts, and service-worker cache registration. No ranking dataset, scoring logic, recommendation authority, draft-state engine, persistence schema, or ESPN-sync implementation file is changed.

Current `main` advanced after Builder finalization, but the advancement since `b89919121cfcc00fc9a02be5d82c1a892036e70b` is confined to `.ai/**` workflow/control-plane and research material. No WR-026 runtime file overlaps. Existing runtime evidence therefore remains usable under Workflow V3 `CONTROL_PLANE_ONLY` handling; Manager must still refresh mergeability/current-main integration state at the final merge gate.

Independent evidence verified:
- PR #120 remains open and unmerged at audited head `ca7126a76df29ec1fa85020fe15acdca9c8c6c5b`.
- Integration War Room CI run `34430059740`, job `102723486494`, completed SUCCESS on the audited candidate/merge ref.
- CI independently shows successful dedicated WR-026 phone regression, artifact upload, full `npm test`, resilience syntax validation, and backup/offline reload validation.
- CI artifact `10134135808` is tied to the audited head and contains phone/desktop screenshots plus deterministic report data.
- Phone report: 320x700, 375x812, 390x844, 430x932 each expose one WR primary context by default, 8 compact cards, >=1 intersecting actionable card in the opening viewport, zero horizontal document overflow, no detected actionable-card occlusion, and visible recommendation/pressure/My Draft controls.
- Desktop/tablet report: 768x1024, 820x900, 900x900, 1280x800, 1440x900 each show WR/RB/QB/TE, no phone compact-hidden state, no active phone presentation class, hidden phone navigator, and zero horizontal overflow.
- Manual review of the retained Chromium screenshots confirms the phone composition is materially decision-first relative to the prior stacked multi-position flow and confirms no phone navigator is exposed in the retained 768x1024 desktop/tablet screenshot.

A local independent rerun could not be obtained because the audit runner could not resolve GitHub DNS for repository checkout. Per Workflow V3 anti-loop, that path was not repeatedly retried. The audit therefore relies on independently inspected repository code, exact CI/job evidence, retained CI artifacts/report, and manual screenshot review.

Physical-phone / Level-4 device validation: **NOT VERIFIED**. No physical-device evidence is claimed.

## Findings

### WR-031-AUD-01 — HIGH — Phone navigator and legacy position filter can desynchronize

**Requirement**  
WR-026 requires coherent phone access to existing position filters and a one-tap WR/RB/QB/TE phone navigator. WR-031 explicitly requires verification of the one-position-at-a-time phone flow and preserved filters.

**Evidence**  
The existing filter path sets global `currentPosFilter` and applies position-board filtering. `applyPositionBoardFilters()` sets each `.position-column.hidden` from the active legacy filter. The WR-026 phone module listens to legacy filter clicks and updates its own `activePosition`, but its phone-nav `setActiveContext()` only changes `activePosition` / phone classes and never clears or updates `currentPosFilter` or the column `hidden` state.

Deterministic sequence:
1. At <=600px, tap the existing `QB` toolbar filter. Legacy filtering marks non-QB position columns hidden; WR-026 synchronizes its active phone context to QB.
2. Tap the new phone `RB` tab.
3. WR-026 changes its active context to RB, but the legacy filter remains QB and RB remains hidden by the existing board-filter state.
4. The primary one-tap phone navigator is now contradictory to the underlying filter and can expose no usable RB decision column until the user separately resets/changes the legacy filter.

The dedicated WR-026 regression tests only the forward direction (legacy QB filter -> phone context QB). It does not test phone-tab switching after a legacy filter is active, so CI can pass while this defect remains.

**Failure**  
Two simultaneously exposed phone navigation systems can enter incompatible state, breaking the required one-tap position-switch workflow.

**Impact**  
This is a common-path phone defect because the legacy position-filter controls remain exposed on phone. A user who uses one of them can subsequently see the new phone tabs fail to produce the selected position content. That undermines the core WR-026 decision-view interaction rather than a cosmetic edge case.

**Remediation**  
Make phone-context selection and the existing position filter one coherent source of visible-position state. A phone tab must either synchronize/clear the legacy filter through the existing supported filter path or the legacy filter must be made inert/appropriately hidden on phone while preserving its required functionality through the new navigator. Do not introduce new ranking/recommendation semantics.

**Validation needed**  
Add deterministic <=600px coverage for at least: `QB legacy filter -> RB phone tab`, `WR legacy filter -> TE phone tab`, a pressure-button position jump after a legacy filter, and search after such transitions. Assert selected phone context, legacy filter state, exactly one intended visible primary column outside search, and full search behavior.

**Confidence**  
HIGH. The conflicting state paths are explicit in the audited code and the missing transition is absent from the dedicated test.

### WR-031-AUD-02 — MEDIUM — Phone Draft Setup loses open intent after a setting-triggered command-bar re-render

**Requirement**  
WR-031 requires dynamic Draft Setup open/close/Escape verification. WR-026 requires Draft Setup to remain reachable on phone and preserve reasonable interaction state.

**Evidence**  
On phone before draft progress, `ensureSetupDisclosure()` treats a newly created disclosure without `data-phone-defaulted` as a fresh default and unconditionally resets `setupEditing = false` and closes it. Changing Teams/Pick/Rounds through the command setup calls `applyDraftSettings()`, which calls `refreshDraftCommandBar()`. The command bar rebuilds itself with `bar.innerHTML = ...`, destroying the current disclosure; observers then create a new setup/disclosure. The new disclosure therefore re-enters the fresh-default branch and loses the user's prior open intent.

The dedicated phone regression verifies collapsed default and a simple open/close click sequence, but it does not change a setting while the disclosure is open. The updated layout-efficiency test verifies Escape/focus behavior but does not cover this no-progress phone re-render sequence.

**Failure**  
While configuring a fresh draft on phone, changing one setup field can collapse Draft Setup as the command bar re-renders, forcing the user to reopen it before editing another field.

**Impact**  
The setup remains recoverable and no draft-setting value is shown to be lost, so this is not a data/state-authority failure. It is nevertheless a deterministic regression in the explicitly required dynamic phone setup interaction.

**Remediation**  
Preserve explicit phone setup-open intent across command-bar reconstruction. Fresh initial phone defaulting should be distinguishable from a same-session replacement of a disclosure the user intentionally opened.

**Validation needed**  
At <=600px with no draft progress: open Draft Setup, change Teams, assert replacement disclosure remains open and focused controls remain usable; repeat for Pick/Rounds as appropriate; then verify Escape closes and restores focus. Also verify >600px behavior remains unchanged.

**Confidence**  
HIGH for the code-path defect; MEDIUM severity because recovery is immediate and authoritative settings are not shown to be lost.

## Non-findings / preserved boundaries

- No evidence of ranking/scoring/recommendation-authority modification in the PR scope.
- No evidence of draft-state, persistence-schema, or ESPN-sync authority modification in the PR scope.
- Phone decision-first layout, compact Show All/Top behavior, Endgame access, search expansion from the default all-filter state, Mine marking, target stars, My Draft, Manage, Overall reachability, Waiting/Near/On-the-Clock states, target sizing, overflow, and the required desktop/tablet guard viewports are covered by the inspected successful CI test and retained artifact report.
- Exact current PR mergeability is not treated as a product finding: GitHub's raw PR state was recalculating/unknown after target advancement. Current target advancement is non-overlapping `.ai/**`; Manager must refresh the final tuple before any merge.

## Release decision

The HIGH phone navigation/filter-state finding violates the required primary phone flow and blocks release readiness. PR #120 should return to Builder for bounded remediation on the same task/PR, followed by independent re-audit of the exact remediated head.

Final verdict: **FAIL — REMEDIATION REQUIRED**
