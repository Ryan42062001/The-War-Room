# Architecture

The War Room is a static browser application deployed to GitHub Pages.

## Product boundaries

- `index.html`, root CSS/JS, and `js/` form the production draft-day application.
- `data/`, `fantasypros-2026-data.js`, and `espn-2026-board-data.js` provide validated ranking/market inputs.
- FantasyPros ECR is authoritative for player value; ESPN market rank/ADP affects timing/survival only.
- `extensions/espn-companion/` is a least-privilege read-only bridge for private ESPN draft rooms.
- Draft state and saved sessions remain browser-local.
- Service-worker/offline behavior must not make stale or mixed runtime identity look current.
- Missing or ambiguous identities, malformed pick numbers, unresolved conflicts, and unsupported live evidence fail closed rather than inventing draft state.

## Workflow/release boundaries

- Speed Workflow V2.1 is repository governance.
- Historical V3/V3.5 material lives under `.history/workflow-v3-5/`.
- FAST CI runs on branch pushes; deliberate FULL PHASE CI validates exact candidate heads.
- Production Pages publication is a separate explicit action once repository Pages is configured to use GitHub Actions.
- Owner-operated ESPN checks are explicit phase-contract items; the owner operates ESPN and shares only privacy-safe results.
