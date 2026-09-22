# WR-136 — Terminal Next-Turn Production State Repair: Builder Evidence

**STATUS:** Builder candidate code validated in actual GitHub FULL War Room CI; final documentary-head FULL CI and independent WR-137 audit are distinct pending gates. Do not treat this document as an Auditor PASS, release or WR-135 resumption.
**TASK / DECISION:** WR-136 / WR-D053; Workflow V3.5; STANDARD_CHAT_HIGH; FAST_REFRESH.
**BASE:** canonical main and initially identical repair branch `0a713d25d05520f2c0b9843cd0a8781bb5e19dbf` (0 ahead, 0 behind).
**BRANCH:** `wr-136-terminal-next-turn-production-remediation`.
**ONE PR:** [#381](https://github.com/Ryan42062001/The-War-Room/pull/381) — OPEN / UNMERGED; preserve exact target after documentary publication.
**FIRST SUCCESSFUL SOURCE+TEST CANDIDATE:** `ea407f5d7cdd7a3b889571ed349bcf4828d5a0a3` (first source commit `04fcf8c12eae0f9fa404330fa6f63b073d930629`).
**FINAL BUILDER HEAD:** resolve the commit containing this evidence and the separate WR-136 handoff from the live PR; do not confuse the successful pre-documentation candidate with final immutable head. Actual final-head FULL CI must be verified and reported in Manager-facing handoff.

## Historical failure (never relabeled)

Frozen blocked WR-135 PR #379 at `62fe08807f5db0105f078f7ccb80fd3bdb7ad59a` is READ-ONLY and not included in this branch. Its first test candidate `69b3e6d9e568292dc1f005f9639323bea3c28b09` failed genuine FULL War Room CI #35675133071, product job #106579993743; documentary-head FULL CI #35675575501 also FAILED. In an actual local browser draft, 2 teams × 5 rounds × slot 2, completed 10/10 and identical expected/actual numbered ledger digest `adcc692a890218e8c77a17d688f1b868943469b62c7667f99737ecb297bb4ddb`, authoritative completion true and own roster 5, the unchanged `getDraftAssistantState().myNextPick` returned already consumed #10 instead of null. The 20×30 full boundary and terminal reload were not executed in WR-135. No WR-135 oracle/test or branch was modified in WR-136.

## Exact production repair / compatibility constraints

Only `js/war-room-draft-state.js:getDraftAssistantState()` changes: retain the original `currentPick = Math.min(completedPicks + 1, totalPicks)`, the same rounds/teams/slot parsing, exact snake `myPicks` sequence, fields and ordinary next-own-pick search. Wrap that unchanged search in `if (completedPicks < totalPicks)` so full numbered completion cannot reselect the capped and already-used final own pick. Derivative existing expressions yield `myNextPick:null`, `picksUntilMyTurn:null`, `onClock:false`. No persistent completion flag, changed data layout, new draft simulator, production command-bar modification or altered nonterminal decision policy.

`scripts/test-browser.mjs` extends the EXISTING real-app Playwright regression, with two fresh isolated browser contexts, real `WarRoomCommandBarFixes.applySettings`, committed 717-row board and distinct first-ten player identities, real `setDraftMarkMode`/`toggleDraft`, real `getDraftAssistantState`/`getDraftCompletionStatus`, actual DOM numbered row/team-slot/Mine-Taken observations, actual `#draft-command-bar` presentation, `saveState()`/full reload and undo through the real toggle. The test does NOT paste or reimplement the production state function; the tiny independent 2-team snake math is only the row-ownership expectation. Non-local browser requests are aborted/recorded; no live ESPN or other provider fetch is part of this scenario.

## Actual validation receipts — first successful code candidate

Genuine PR-head [War Room CI #35676911990](https://github.com/Ryan42062001/The-War-Room/actions/runs/35676911990) for exact code candidate `ea407f5d7cdd7a3b889571ed349bcf4828d5a0a3`, status **COMPLETED SUCCESS**:
- classify job **#106585239729 SUCCESS**; Governance **#106585265541 SUCCESS**; bootstrap-reuse **#106585266813 SKIPPED** as expected; actual FULL product job **#106585311627 SUCCESS**.
- Product job executed `npm run test:browser` in the browser-stress step and as the named existing aggregate, with actual `WR136_TERMINAL_TURN_CHECKPOINT` and `WR136_TERMINAL_TURN_REPAIR_PASS` logs. Existing browser script also actually executes literal `node --check scripts/test-browser.mjs` and logs PASS. Actual `npm test` `test:syntax` executes literal `node --check js/war-room-draft-state.js` within its published chain and succeeded. These are **CI-executed commands**; no distinct local shell run is claimed.
- Actual `npm test` succeeded, including accepted draft-invariants baseline `Draft invariant torture harness passed.`, Companion 167/167, WR-118 two-iteration `WR118_APP_SIDE_SYNTHETIC_PASS`, unchanged WR-133 named `WR133_COMPANION_WAR_ROOM_E2E_PASS` (3 negative controls, no external requests/browser errors/Companion fetches). All remaining product-step browser stress, WR-026 phone view, resilience syntax and backup/offline reload steps SUCCESS. This candidate CI is not final-head CI because subsequent documentary commits move the PR SHA.

| Real 2×5 browser checkpoint | Slot 2: user owns pick #10 | Slot 1: other team owns pick #10 |
|---|---|---|
| Initial 0/10 | current 1, next 2, WAITING | current 1, next 1, ON THE CLOCK |
| 1/10 | current 2, next 2, ON THE CLOCK | current 2, next 4, WAITING |
| 8/10 | current 9, next 10, WAITING | current 9, next 9, ON THE CLOCK |
| 9/10 preterminal | current 10, next 10, ON THE CLOCK; authoritative false; own roster 4 | current 10, no remaining own pick; authoritative false; own roster 5 (preexisting exhausted-own-picks semantics preserved) |
| 10/10 complete | current 10 **still capped**, next null, countdown null, onClock false, authoritative true, own roster 5, command bar `DRAFT COMPLETE` | same completed-state fields and command mode; own roster 5 |
| Real save/reload at 10/10 | exact state/ledger/config preserved; command bar complete | exact state/ledger/config preserved; command bar complete |
| Undo pick #10 | 9/10, authoritative false, valid next 10 and ON THE CLOCK restored | 9/10, authoritative false, no remaining own pick (normal semantics) |
| Mark #10 again | terminal null-next/complete restored | terminal null-next/complete restored |

Per focused scenario: exactly 10 distinct numbered real app rows; two scenarios × eight checkpoints, no unexpected browser external requests, zero browser console/page errors, no provider interaction; `WR136_TERMINAL_TURN_REPAIR_PASS` recorded both. Browser test compares all observed real numbered picks, identities, team-slot metadata and Mine/Taken against independent expectations; no existing browser assertion weakened. The focused 2×5 test is **not** the frozen WR-135 strict supported-envelope test or a new 20×30 full-draft claim.

## Custody, boundary and remaining gates

Exactly these FOUR cumulative authorized paths in the final Builder PR: `js/war-room-draft-state.js`, `scripts/test-browser.mjs`, this evidence document, `.ai/builder/WR136_TERMINAL_TURN_REPAIR_HANDOFF.md`. The frozen `.ai/builder/HANDOFF.md` and WR-135 PR #379 remain untouched. No `package.json`, `scripts/test-draft-invariants.mjs`, WR-133, other production, Companion, ranking/source, workflow/runner, permissions, credentials or deployment edits.

**NEXT:** Independently verify final documentary PR head and cumulative four-file diff, inspect actual exact-final-head FULL War Room CI/job logs and source/browser assertions; Manager freezes that exact unchanged head and assigns FRESH WR-137 Independent Auditor/QA (separate task/PR). Only accepted audit PASS-family permits separately guarded Manager integration and real canonical-main FULL CI. WR-135 remains BLOCKED/HARD until the distinct later Manager resumption decision. This production terminal-state repair does not prove full supported-envelope draft 20×30, Companion/app extremes, live ESPN fallback, structured Direct, device support, ranking freshness/A4, deployment/rollback or draft readiness.
