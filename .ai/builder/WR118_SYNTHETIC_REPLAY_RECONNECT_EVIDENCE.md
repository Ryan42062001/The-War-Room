# WR-118 — Synthetic ESPN Replay + Reconnect Regression Evidence

TASK: WR-118
ROLE: Builder; WORKFLOW: V3.5; EXECUTION: STANDARD_CHAT_HIGH; REFRESH: FAST_REFRESH
BASE / VERIFIED INITIAL MAIN AND BRANCH: 5dc8906d5285d1c51b51ef0068bd0a98753610ba
BRANCH: wr-118-synthetic-espn-replay-reconnect-regression
STATUS: BUILDER CANDIDATE; independent audit and Manager freeze/merge remain required.
SOURCE OF EXECUTION TRUTH: exact-head CI run(s) and final PR #/SHA, not this document's unexecuted test expectations.

## 1. Scope and isolation

Exactly one new executable fixture, scripts/test-wr-118-espn-replay-reconnect.mjs, registered under test:wr118-espn-replay-reconnect and npm test in package.json. The named command executes an explicit node --check followed by the fixture. Production js/, Companion extensions/, UI, datasets, ECR, ADP, ranking/scoring/recommendation weights, workflows and runners are unchanged. This test runs in two independent, locally served Chromium contexts using a fixed 0x5420118 shuffle of the existing 717 local board rows. It never sends an ESPN request, reads a user ESPN session, calls provider endpoints, or fabricates a new source or ranking.

This is **app-side snapshot ingress** using window.WarRoomEspnSync.applySnapshot, the same preexisting interface used by scripts/test-draft-invariants.mjs, scripts/test-persistence-recovery.mjs and scripts/test-espn-offboard.mjs. It does **not** prove Companion parser, background ledger, transport, browser extension-to-page delivery, live ESPN Board/Pick History, structured Direct, or physical phone operation. Synthetic reconnect means controlled app reload, then replay of the full deterministic numbered fixture; it is not a real ESPN reconnection.

## 2. Deterministic scenario and pass/fail oracles

| Stage | Explicit synthetic input and expected state | Asserted invariant |
| --- | --- | --- |
| New draft A | 10 teams, 16 rounds, slot 7, 717 source rows | Zero numbered draft rows; local source-order/value hash pinned at initial state. |
| Numbered A opening | Picks 1..12; pick 5 initially points to fixture index 170 instead of the final correct index 4 | Precisely 12 consecutive unique numbered canonical picks; Mine/Taken by existing snake team-slot mapping; source=espn and stable fixture pick ID; no unavailable recommendation candidate. |
| Duplicate and reordered A | Repeat identical 12; then reverse 12 and append exact duplicate numbered pick 3 | Stable canonical numbered ledger digest and ownership; duplicate rejection counted only for the reordered input. |
| Stale A | Deliver only picks 1..9 after accepted 1..12 | Accepted 12-pick authoritative state and next-turn math must not regress. No newly invented pick. |
| Partial/unresolved A | Deliver 1..12 plus pick 13 with an unmappable synthetic placeholder; no Companion authority marker | Exactly one unresolved/unmatched #13; 12 canonical picks remain; no fabricated external owner/player; next pick remains #13. |
| Existing-authority correction | Full, corrected picks 1..13, with pick 5's correct canonical player and distinct fixture ID | Former wrong fixture index 170 is available, correct fixture index 4 owns pick 5, unique pick/player/slot; replay reversed full 13 plus duplicate #2 converges identically. Uses existing full-snapshot reconciliation; asserts no new manual override rule. |
| Two saved sessions | Save A13; create isolated B and apply five different canonical fixture picks; save B; switch to A | A13 is unchanged on return. B's 5-pick ledger is separately pinned and must not be affected by A's later replay/reload/terminal state. |
| Controlled app reload and synthetic replay | A advances to #20, saves, reloads, and receives reversed 1..20 snapshot | Same 20-number ledger, Mine/Taken, source and pick-ID metadata after reload/replay; original A session active; B still isolated. |
| Premature terminal signal | Full correct 1..159, draftComplete true and expectedCompleted=160; #160 belongs to team 1, while slot 7 already owns all 16 Mine picks | 159 numbered picks, no invented #160; completion is provisional, not authoritative, with 16 Mine picks. |
| Authoritative terminal and recovery | Full correct 1..160, draftComplete true; save/reload; switch to B and back to A | Precisely 160 unique canonical picks; authoritative completion, no provisional flag or remaining user turn; stable saved A and B ledger hashes after reload and switches. |
| Repeated independent execution | Two fresh browser contexts, identical fixture/seed, no shared cookies or session state | Exact same final A ledger hash, B ledger hash and baseline source hash; no page runtime errors. |

Ledger checks are mechanical: consecutive unique pick numbers; canonical player uniqueness; correct status/teamSlot/source/espnPlayerId; 717 unchanged canonical rows; identical baseline source hash of local row order/name/ECR/rank/ADP; no off-board player for an unattributed unresolved partial pick; current-pick arithmetic and candidate availability. **No fixed player winner, policy threshold, market scoring, projection or ranking change is asserted.**

Fixture failure logs only deterministic seed/stage/session/pick, expected/actual fixture-index ledger digests and first fixture-index mismatch, safe source/ownership metadata and bounded counts. It does not log user credentials, account URLs, cookies or player-source rows. Tests use current bundled canonical names internally solely to exercise the existing mapping interface; fixture-index digests avoid emitting source rows.

## 3. Validation log and evidence hierarchy

The new fixture has been committed with only package command registration; subsequent exact-head CI is required before any Manager audit freeze. Do not present GitHub classify/Governance success, earlier historical tests or the presence of scripted assertions as a current runtime PASS.

At initial implementation checkpoint, candidate code/package commits were published on the assigned branch. The observed exact-head push CI must be recorded once completed, with actual classify/Governance/test job conclusions and the named test output. A later evidence/handoff-only push may be Governance-scoped; the **PR-triggered exact final head full CI** is the applicable full-scope proof and must be checked separately. The final Builder reply or PR evidence comment must state each actual test result, skips and any unverified local execution. If the new fixture demonstrates a reproducible product defect, preserve its bounded failure and return to Manager; do not patch application code under WR-118.

Required validation: named test twice within its single invocation, explicit syntax check in named command, existing draft-invariants, persistence-recovery, recovery-failures, espn-offboard, extension and the full npm test chain. Local terminal execution is not established by a GitHub connector read; actual CI command execution is authoritative when observed in CI logs, with its own constraints. Existing suite CI stress/checkpoint runs are separately recorded in the workflow job.

### Observed execution checkpoint — code-bearing candidate

The exact code-and-registration checkpoint 2e1c30182604b0052db89f3051d4c4e183218c1f completed [War Room CI #35488356124](https://github.com/Ryan42062001/The-War-Room/actions/runs/35488356124) with **SUCCESS** for classify, Governance and the full test job (bootstrap-reuse skipped). Its full test-job log [job 106018847020](https://github.com/Ryan42062001/The-War-Room/actions/runs/35488356124/job/106018847020) explicitly shows npm test PASS, test:extension executed in the chain, test:espn-offboard PASS, test:draft-invariants PASS, test:persistence-recovery PASS, test:recovery-failures PASS, and test:wr118-espn-replay-reconnect completed two independent deterministic scenarios with zero page errors and equal hashes. The named command at that checkpoint ran Node itself; subsequent package registration added explicit node --check to the named command without changing test logic. Do not conflate this earlier successful code checkpoint with final-head CI.

Observed seed: 88211736 (0x5420118); scenario iterations: 1 and 2; opening count 12; correction #5; unresolved #13; replay count 20; provisional 159; authoritative terminal 160. Both iterations logged:
- baseline source SHA-256: ef335d5bc79b36d46c32a19e1372db8405ff92956307e15b209d65fba632b070
- final A ledger SHA-256: 8dcf7c772d03bdf1b2e91e614bdd8ce74cfcd19d9858e6d86cd9146de36d7340
- isolated B ledger SHA-256: 92c057e6a4f58d73deb26b559a32505262401bc5a4afdc6aaa5b79b0ceb7ef85
- browserErrors: 0.

The logged checkpoint proves the actual assertions executed at that code SHA: unique numbered/identity/source/ownership state through the enumerated stages, A/B isolation, stable ECR/source-row fingerprint, saved/reloaded pick IDs and terminal/provisional status. It does **not** prove live ESPN, Companion delivery or an unmodified future head. A local terminal test run was not performed in this Builder session; all asserted executions are GitHub Actions-hosted. Final PR #338 exact-head full CI, four-file scope and fresh independent audit must still be observed/reviewed before freeze/merge.

## 4. Authority and handoff

WR-D001 keeps FantasyPros ECR as player-value authority and ESPN board/ADP as market timing only. WR-D018 keeps Board/Pick History fallback-first reliability positioning and LIVE_DIRECT_UNVERIFIED; WR-D027/D028 allow this test-only app-side work, not Companion/live/production/source/model expansion. WR-117 inventory is accepted/closed, not reopened.

This new test is not a release or draft-ready certificate. WR-118 requires a fresh distinct Independent Auditor to challenge the exact test oracle, authority assumptions, reproducibility and failure diagnostics; Manager alone freezes and later merges a passing target, followed by a canonical-main full CI canary. Builder must leave the one four-file PR unmerged.
