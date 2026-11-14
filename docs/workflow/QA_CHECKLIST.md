# War Room — independent mock browser QA

Use only owner-approved **synthetic/mock** Preview with a verified SHA. No ESPN authentication, private league, live draft clicks or owner-session access.

| Check | Action on mock/replay data | Expected |
| --- | --- | --- |
| WR-Q01 | Load app with 10-team / PPR / 16-round synthetic draft | Board, league settings and phase-specific features load without broken UI |
| WR-Q02 | Simulate early and late picks from a supplied fixture | Board/pick history records correct numbered picks and roster attribution |
| WR-Q03 | Reload mid-draft | Persistence and accepted pick ledger consistent; no duplicate or missing pick |
| WR-Q04 | Compare visible board/survival/projection labels | FantasyPros/ESPN signal provenance explicitly separated; absent data shown as unavailable |
| WR-Q05 | Test fallback vs structured-data incomplete conditions | UI never claims an unsupported accepted pick or reconciled draft state |
| WR-Q06 | Inspect recommendations / VORP / roster constraints | No impossible roster slot, made-up player data, or unverified claim; verify against supplied fixture only |
| WR-Q07 | Complete synthetic full snake mock if provided | Correct pick count, Mine ownership, terminal completion and reload behavior |
| WR-Q08 | Test desktop, tablet and narrow viewport | Board, buttons and draft command UI remain usable without clipping |
| WR-Q09 | Keyboard focus and representative error states | Focus visible; errors safe and actionable, no private debug data |
| WR-Q10 | Inspect for live provider/login/write behavior | No ESPN write action executed or requested; if observed, STOP and notify Ryan |

Each applicable check must be PASS / FAIL / NOT RUN with evidence. Live ESPN field tests, private data and localhost-only scenarios are NOT RUN in this Work plan.
