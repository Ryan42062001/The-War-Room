# WR-143 — Command-bar completion truth evidence

## Scope and source

Base: `c180c1cf91ce39cf6616ad1f921ec38e38683760` on `main` and the assigned Builder branch, verified identical before edits. The command bar previously equated `myNextPick === null` with complete. Canonical `getDraftCompletionStatus(state).complete` in `js/war-room-ui.js` determines authoritative numbered completion and accepted provisional external completion.

The command bar now calls that loaded authority and selects `complete` only for literal `true`. Missing authority or an exception leaves the ordinary on-clock/waiting presentation. No completion algorithm or draft-state code was added.

The existing WR-136 actual-browser case now requires slot 1 at 9/10 and after undo to render `waiting`/`WAITING`, checks canonical completion false, and rejects complete-only copy. It retains slot 2 on-clock, both terminal 10/10 and reload/recompletion checks, real row toggles, local-request guard and browser-error checks.

## Validation in this workspace

- `node --check js/war-room-command-bar.js`: PASS.
- `node --check scripts/test-browser.mjs`: PASS.
- `npm run test:browser`: BLOCKED before app execution: Playwright Chromium executable missing at `/root/.cache/ms-playwright/chromium_headless_shell-1234/...`.
- `npm ci --offline`: PASS; restored repository Playwright package without tracked file changes.
- `npm test`: first run failed in extension tests because local `node_modules/playwright` was absent. After offline install, extension click-provenance browser cases failed with missing executable; run was interrupted after no further progress. No whole-suite PASS claim.
- `npx playwright install chromium`: attempted, but external browser download returned truncated/non-ZIP content in this network; interrupted. No local actual-browser behavior claim.

## Exact-head CI and observed browser results

Pending genuine FULL War Room CI on immutable final Builder head. CI logs must be inspected for browser checkpoints and entire `npm test` result before Manager audit routing. Slot 1 9/10, slot 2 9/10, both 10/10, undo and recompletion remain **locally unverified** pending that run.
