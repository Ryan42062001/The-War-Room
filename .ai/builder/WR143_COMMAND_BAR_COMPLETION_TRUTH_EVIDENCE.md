# WR-143 — Command-bar completion truth evidence

## Scope and source

Base: `c180c1cf91ce39cf6616ad1f921ec38e38683760` on `main` and the assigned Builder branch, verified identical before edits. The command bar previously equated `myNextPick === null` with complete. Canonical `getDraftCompletionStatus(state).complete` in `js/war-room-ui.js` determines authoritative numbered completion and accepted provisional external completion.

The command bar now calls that loaded authority and selects `complete` only for literal `true`. Missing authority or an exception leaves the ordinary on-clock/waiting presentation. No completion algorithm or draft-state code was added.

The first exact-head FULL CI candidate `521802306b85221bfa0db49058527d22ea4e23ea`, War Room CI `35880594349`, failed product job `107247921726`. Its real browser checkpoints passed slot 1 9/10 waiting, both 10/10 terminal states, and slot 2 undo/recompletion. At slot 1 undo, command mode/label returned to WAITING but the command bar mirrored stale `DRAFT COMPLETE` recommendation copy from the still-rendering app panel. The browser assertion caught it. The command bar now replaces that terminal recommendation with neutral tracking copy while its canonical mode is incomplete. The failed run remains historical evidence, not a PASS.

Second candidate `79ea5cd0215532a0acd99732b2d8ad7a0de4fc62`, CI `35880998233`, product job `107249280611` also FAILED the same undo assertion. The stale completion words were in the recommendation container's fallback `reason` text while `player` read `Building recommendation…`; checking only player was insufficient. The revised guard checks all recommendation text fields before mirroring them. Both failed runs remain historical failures.

The existing WR-136 actual-browser case now requires slot 1 at 9/10 and after undo to render `waiting`/`WAITING`, checks canonical completion false, and rejects complete-only copy. It retains slot 2 on-clock, both terminal 10/10 and reload/recompletion checks, real row toggles, local-request guard and browser-error checks.

## Validation in this workspace

- `node --check js/war-room-command-bar.js`: PASS.
- `node --check scripts/test-browser.mjs`: PASS.
- `npm run test:browser`: BLOCKED before app execution: Playwright Chromium executable missing at `/root/.cache/ms-playwright/chromium_headless_shell-1234/...`.
- `npm ci --offline`: PASS; restored repository Playwright package without tracked file changes.
- `npm test`: first run failed in extension tests because local `node_modules/playwright` was absent. After offline install, extension click-provenance browser cases failed with missing executable; run was interrupted after no further progress. No whole-suite PASS claim.
- `npx playwright install chromium`: attempted, but external browser download returned truncated/non-ZIP content in this network; interrupted. No local actual-browser behavior claim.

## Exact-head CI and observed browser results

Pending genuine FULL War Room CI on revised immutable final Builder head. CI logs must be inspected for browser checkpoints and entire `npm test` result before Manager audit routing. Local actual-browser execution remains unavailable; the first CI candidate demonstrated the boundary and exposed the stale copy after undo.
