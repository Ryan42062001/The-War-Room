# ESPN Companion Live Validation

Run these checks in disposable ESPN mock drafts. Do not use a real league draft for initial validation.

ESPN's mock clock is 30 seconds. Make the user-slot pick before it expires. A timeout both selects a player and leaves the team in Autopick mode; manually disable Autopick immediately before continuing any ownership or recommendation validation.

## Structured live-capture full mock

1. Reload extension version 0.9.14 and refresh ESPN plus The War Room before entering the draft room. Loading before the draft starts is important because WebSocket observation begins at document start.
2. Start a mock with the same teams, slot, and rounds configured in the popup.
3. Confirm the popup says `Draft detected · Live capture` after the first completed pick and that either Structured page state or Network observation is active.
4. At picks 1, 10, the first turn, midpoint, your final pick, and draft end, record copied diagnostics.
5. Confirm Captured equals completed ESPN picks, Applied equals Captured, Unmatched is zero, conflicts are zero, and Mine follows ESPN's exact team ownership.
6. At draft end, confirm the War Room says `Draft complete`, the full roster is Mine, and the final report opens.

## Board-fallback full mock

1. In a new disposable mock, open ESPN's Board or Pick History view.
2. Temporarily use the popup only when the structured connection reports unavailable or a reproducible test setup forces Screen mode; do not alter ESPN credentials or extension permissions.
3. Confirm the popup says `Draft detected · Board fallback` and does not claim structured live capture.
4. Rescan at the same checkpoints used above and save copied diagnostics.
5. Confirm numbered picks remain sequential, Taken/Mine ownership follows snake position, and Captured/Applied remain equal with zero unmatched names.
6. Confirm the terminal Board slot produces `Draft complete` and the War Room final report.

## Live-person public mock comparison

1. Join a disposable public snake PPR mock that contains at least one other live manager; do not use a real league draft.
2. Keep Companion 0.9.14, ESPN, and The War Room open with matching teams, slot, and rounds.
3. Copy diagnostics before pick one, after the first completed pick, near pick 10, and after the draft. Make each user pick before ESPN's 30-second timeout.
4. Record the `Capture method`, structured/network/fallback source status, confirmed/conflict/unresolved-ID counts, plus REST resolved/raw/unresolved and HTTP/transport.
5. Confirm the acknowledged snapshot size catches up to Captured. A smaller late acknowledgment must never lower Applied, and one forced resend should close a trailing acknowledgment.
6. Compare these results with the all-Auto practice behavior without assuming that public and league-specific ESPN feeds use the same backend timing.

## Pass record

Record the date, ESPN mock URL identifiers (league and season only), teams/slot/rounds, extension version, mode, final counts, unmatched names, and copied diagnostics. Remove any personal league or team names before sharing a report.

### 2026-08-24 — Board/Pick History fallback passed

- ESPN mock: league `819737502`, season `2026`
- Settings: 12 teams, slot 5, 16 rounds
- Installed companion: 0.8.7
- Connection observed by the website: DOM/Pick History fallback for every synchronized row; structured Direct never became authoritative
- Early state: one temporary unmatched player was recovered by accumulated rescans
- Midpoint: 140/140 applied, zero unmatched
- Final state: 192/192 numbered picks synchronized, 16 Mine, zero unmatched
- Completion: `Draft complete · 192 picks` rendered and the final report opened

Result: Board/Pick History fallback is live-validated. Structured live capture remains open and must not be reported as passed.


## 2026-09-06 14-team v0.9.13 completion finding

A 14-team, slot-11, 16-round ESPN mock reached all 224 numbered picks with no missing pick numbers. The Companion delivered a complete 224-pick ledger, but the War Room applied 223 because a noisy DOM observation had assigned Jerry Jeudy to pick 183 before his real selection at pick 199. The earlier pick also held a same-confidence conflict challenger. Version 0.9.14 adds deterministic duplicate-player repair: when a duplicated player blocks a later real pick, an earlier conflicted assignment may be replaced only by its recorded same-or-higher-confidence challenger, and only when that challenger does not collide with any other ledger player. The structured ESPN draft-detail feed remained empty throughout the live mock and returned 404 after the room closed, so visible Pick History remains the proven live authority for this mock format.

## 2026-09-07 — Wave 3 18-team forensic mock

A disposable 18-team, 16-round ESPN mock completed all 288 picks under the Wave 3 forensic procedure.

- Draft size: 18 × 16 = 288 picks.
- Visible Pick History / DOM authority reached 288/288 numbered picks.
- Structured WebSocket candidate count remained 0 during the observed run.
- Worker and SharedWorker candidate/message evidence relevant to pick recovery remained 0.
- REST `mDraftDetail` remained empty during the draft and became HTTP 404 / unavailable after completion.
- The controlled screen recording repeatedly showed `Players → Pick History → Players` while the browser URL/route stayed unchanged.
- The forensic timeline repeatedly classified the Pick History navigation click as `untrusted`, followed by `mounted-hidden → mounted-visible`, `players → pick-history`, and a synthetic return toward Players. The user's mouse and keyboard were not responsible during the controlled interval.
- `event.isTrusted === false` establishes that the navigation click was script-generated; this run did **not** identify whether the caller was Companion code, ESPN page code, an ESPN/library component, or another injected script.
- The transitions were repeated during automatic synchronization rather than appearing as a single rare recovery action. The 2026-09-07 evidence does not by itself prove a fixed timer, ledger-lag threshold, or specific source-lag trigger.
- Kene Nwangwu at pick #280 was identified as an off-board War Room application case even though Pick History/DOM reached the complete draft. A manual **Rescan ESPN** did not heal that application mismatch.

Result: visible Pick History remains the proven live source for this 18-team mock format. The synthetic navigation behavior is real and repeated, but caller attribution remains open until caller-provenance instrumentation is exercised in another disposable live run.
