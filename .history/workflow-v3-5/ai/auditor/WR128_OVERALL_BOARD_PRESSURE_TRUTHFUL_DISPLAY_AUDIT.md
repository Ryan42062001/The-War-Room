# WR-128 — Fresh Independent Audit of WR-127 Legacy Overall Board Pressure Truthful Market Display Repair

TASK: WR-128
ROLE: Independent Auditor / QA
WORKFLOW: V3.5 CANONICAL
EXECUTION MODE: STANDARD_CHAT_HIGH
REFRESH MODE: FAST_REFRESH
DATE: 2026-09-21
REPOSITORY: Ryan42062001/The-War-Room
AUDITOR BRANCH: wr-128-wr127-overall-board-pressure-independent-audit
INITIAL AUDITOR / CANONICAL MAIN SHA: a9a1a815300baf46eeaf1a3ce21d856623e4cacc
SOURCE TASK: WR-127
BUILDER PR: #360 — OPEN / UNMERGED
BUILDER BRANCH: wr-127-overall-board-pressure-truthful-market-display
VERIFIED BUILDER CREATION BASE: 907ed83b301fae0340c07f124a431952990918b9
IMMUTABLE AUDITED BUILDER SHA: 1198882b049087d4be82e01b40171d63756de42b

## Final verdict

PASS

No CRITICAL, HIGH, MEDIUM, or LOW findings were identified on the exact unchanged frozen WR-127 target.

## Independence and target immutability

This audit independently refreshed live GitHub state and did not adopt the Builder report, Manager WR-D042 freeze, green CI, or historical WR-126 conclusions as its verdict.

Immediately before publication:

- canonical main was still exactly a9a1a815300baf46eeaf1a3ce21d856623e4cacc;
- the fresh Auditor branch was still identical to that main before Auditor-only writes;
- PR #360 remained OPEN / UNMERGED;
- PR #360 head and the Builder branch both independently resolved exactly to 1198882b049087d4be82e01b40171d63756de42b;
- comparing the frozen SHA to the live Builder branch returned identical, 0 ahead / 0 behind;
- the Manager freeze comment 5761443525 remained consistent with the live target and separately records the WR-D042 activation gate. That comment was treated as control-plane evidence, not an audit conclusion.

No target advancement occurred.

## Independent scope verification

The cumulative comparison from original Builder creation base 907ed83b301fae0340c07f124a431952990918b9 to frozen target 1198882b049087d4be82e01b40171d63756de42b is 12 commits ahead / 0 behind and contains exactly four paths:

1. js/war-room-ui.js
2. scripts/test-browser.mjs
3. .ai/builder/WR127_OVERALL_BOARD_PRESSURE_TRUTHFUL_DISPLAY_EVIDENCE.md
4. .ai/builder/HANDOFF.md

No CSS, dataset, package, workflow, scoring engine, recommendation engine, rankings, draft-state, ESPN Companion/sync, or other production path is present in the cumulative diff.

The product change itself is localized to updateDraftDayDashboard in js/war-room-ui.js. The test change is localized to the existing mounted Chromium browser suite in scripts/test-browser.mjs. The other two changes are Builder evidence only.

## Unknown-market truthfulness

Static source inspection independently confirms that updateDraftDayDashboard now resolves market timing through the existing getMarketTimingDetails(best, context).marketRank authority. A finite positive rank is required before the display computes and exposes a survival/index number.

When timing is unknown:

- the display text is Market timing UNKNOWN — no survival estimate;
- calculateNextPickSurvival is not used to create the card's displayed value;
- the internal neutral 50 is not rendered as a percent, index, meter width, aria label, or other numeric accessibility value;
- the board-pressure meter is omitted entirely rather than visually hiding a 50-filled control;
- when no independent scarcity/tier warning applies, the card uses pressure-unknown rather than deriving urgency from the neutral sentinel;
- CRITICAL CLIFF remains pressure-scarce, while TIER CLOSING and HIGH SCARCITY remain pressure-limited from their independently supplied status before the unknown-market fallback is considered.

The unchanged scoring implementation was also inspected. calculateNextPickSurvival still returns 50 when getMarketTimingDetails cannot produce a finite market rank in a nonadjacent window. That return occurs before the known-market cache/model path, so withholding the unknown display value does not alter a scoring cache or known-market calculation.

Actual exact-head hosted browser logs independently show the mounted 390x844 and 1280x900 controls using the real application renderer and row-backed Isaac Guerendo fixture:

- resolver source Unknown market, market rank null;
- internal numeric survival still 50;
- visible detail Market timing UNKNOWN — no survival estimate · No immediate cliff;
- pressure-unknown;
- meter absent;
- no numeric aria-label evidence;
- widget and card actually rendered.

The independent-tier control at both viewports retained 1 before tier drop and pressure-limited with no meter. This runtime control exercises TIER CLOSING; source inspection separately confirms the parallel CRITICAL CLIFF and HIGH SCARCITY branches.

## Known-market truthfulness and engine preservation

For known timing, the modified renderer still invokes the same calculateNextPickSurvival(best, context) and rounds the result exactly as the prior display did. getMarketTimingDetails and calculateNextPickSurvival are unchanged.

The visible value is now labeled Timing index N/100. The UI no longer calls it N% next-pick survival, and the decorative meter wrapper is aria-hidden=true. This satisfies the WR-127 contract's heuristic/timing-index labeling requirement without presenting the value as measured or calibrated odds.

Exact-head browser logs show the known-market Jahmyr Gibbs control at both required viewports:

- source ESPN board;
- resolved market rank 1;
- numeric engine value 0;
- visible detail Timing index 0/100 · No immediate cliff;
- meter width 0%, exactly matching the unchanged numeric engine output;
- meter parent aria-hidden=true;
- no numeric aria-label evidence.

The numeric value and market input are therefore preserved while the presentation semantics are corrected.

## Recommendation, scoring, source, and state invariants

The exact cumulative scope mechanically excludes calculateNextPickSurvival's source file, ECR/ranking/tier implementation, recommendation scoring, market resolver, draft state, datasets, ESPN Companion/sync, CSS, package configuration, and workflows.

The mounted browser fixture additionally snapshots and compares before/after:

- recommendation player;
- recommendation action;
- market source;
- complete scored candidate order;
- every final score;
- original source-row market/ECR attributes and row class.

Exact-head logs report Jahmyr Gibbs / DRAFT / ESPN board, 520 scored candidates, with samePlayer, sameAction, sameSource, sameOrder, sameScores, and sameRowAttributes all true at both 390x844 and 1280x900. Position view still hides the legacy Board Pressure widget.

The existing WR-122 recommendation-card tests remain in the same browser suite, and js/war-room-rankings.js is absent from the WR-127 diff. No evidence of a WR-D038 regression was found.

## Actual exact-head CI and rendered evidence

The exact frozen Builder target has War Room CI run #35559439436. Final attempt 2 completed SUCCESS at exact head 1198882b049087d4be82e01b40171d63756de42b:

- test #106348285460 — SUCCESS;
- classify #106348285850 — SUCCESS;
- Governance #106348325746 — SUCCESS;
- bootstrap-reuse #106348286738 — SKIPPED.

The full test-job logs were inspected rather than accepting the PR description. They contain repeated WR127_RENDERED_BOARD_PRESSURE evidence at 390x844 and 1280x900 and WR127_RENDERED_OUTCOME with classification TRUTHFUL_DISPLAY_VERIFIED.

The same exact job also actually executed or reported:

- npm test with the repository's release/modules/syntax/dataset/extension/browser/responsive/layout/phone/scoring/draft/recovery/WR-118/live-mock chain;
- test:browser;
- test:responsive-overflow — 13 widths x 2 board views, zero horizontal document overflow;
- test:layout-efficiency — 9 viewports x 2 board views, no horizontal overflow, choice/focus occlusion, target-size regression, or pre-change visibility regression;
- test:layout-efficiency-behavior;
- test:phone-decision-view — 4 phone and 5 desktop/tablet guard viewports;
- test:scoring-corrections;
- WR118_APP_SIDE_SYNTHETIC_PASS with its explicit no-Companion/no-live-ESPN boundary;
- resilience syntax and three recovery/offline iterations, each including 7 mobile widths and a full 717-player offline reload.

The npm syntax chain explicitly executes node --check js/war-room-ui.js. The browser runner repeatedly executed and logged PASS for the literal node --check scripts/test-browser.mjs command.

Exact-head Governance detached to AUDIT_HEAD_SHA=1198882b049087d4be82e01b40171d63756de42b and reported forbidden_files=[], outside_allowlist_files=[], and ready_for_manager_freeze=true. These are mechanical evidence only and were not substituted for this audit judgment.

## Historical failures preserved and challenged

The prior WR-127 failures remain failures:

- CI #35558446453 at daad0491e4c333b1d85395aebca4704fe1868761: test job #106206630021 FAILED because the old WR-126 browser oracle still asserted that the unknown-market meter existed after the production display had begun omitting it.
- CI #35558486470 at 1b22ca3b7acf6b5061d10b1f49d088448bdc4de0: test job #106206826101 FAILED the preserved 375x812 Overall layout guard: before 1512.5px, after 1527.5px.
- CI #35559042883 at fd4577fd50ba1041a631eebd3c9428e9b39e2dd3: test job #106208271444 FAILED the preserved 900x900 Overall material-improvement guard: before 1019.6px, after 1012.6px, only 7px improvement where the unchanged guard required at least 10px.

No layout test, CSS, package file, or workflow was changed between the Builder base and the frozen target. The final compact Timing index N/100 presentation instead cleared the unchanged layout suite on the frozen target.

A prior test job on the same frozen target, #106209388469 in the earlier attempt of run #35559439436, failed the unrelated existing Draft Setup focus assertion Escape must close Draft Setup and return focus to Edit summary in test-layout-efficiency-behavior.mjs. The target itself was not changed; final attempt 2 passed that unchanged suite. This historical same-head failure is preserved here and is not relabeled as a pass. No WR-127 changed path touches that focus behavior or test.

## Security and accessibility review

No new untrusted-markup path was introduced.

- playerName continues through escapeSummaryHtml before insertion;
- cliffText continues through escapeSummaryHtml;
- the new known-state style width is derived only from the rounded numeric engine value;
- the new market-known branch uses the existing resolver output only as a finite-positive predicate;
- no URL, event-handler, dynamic script, network request, or provider-contact path was added.

Unknown state has no probability-like meter node or hidden numeric survival control. Known state leaves the visual meter decorative with aria-hidden=true while preserving a normal readable Timing index N/100 text line. Static source inspection found no newly added progressbar/aria-valuenow/probability semantics. The mounted browser assertions confirm the required absence/presence behavior and Position-hidden case.

## Preserved decisions and audit boundaries

WR-127 does not change the authorities or gates established by:

- WR-D001 — FantasyPros ECR remains player VALUE authority while ESPN/approved fallback market data remains timing authority;
- WR-D018 — fallback-first architecture and LIVE_DIRECT_UNVERIFIED boundary;
- WR-D027 — NO PROVIDER CONTACT;
- WR-D038 — accepted WR-122 recommendation-card repair;
- existing source-rights/custom-ranking/release gates and historical audit/CI evidence.

This audit performed no live ESPN provider contact, protected-source acquisition, deployment, release, or physical-device certification. Runtime evidence reviewed here is GitHub-hosted synthetic/real-app browser CI, not live ESPN or empirical probability calibration.

## Publication and next gate

This report and .ai/auditor/HANDOFF.md are the only authorized Auditor writes. The separate Auditor-only PR must remain OPEN / UNMERGED and target current canonical main. Publication metadata — immutable Auditor head and its applicable exact-head Governance CI — is recorded on the Auditor PR after GitHub creates those objects, without mutating the frozen Builder target.

Only Manager may separately consider integration of Builder PR #360, and only while its head remains exactly 1198882b049087d4be82e01b40171d63756de42b. Any later Builder integration still requires genuine canonical-main FULL War Room CI before WR-127 closure.
