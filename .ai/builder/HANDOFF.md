# Implementation Engineer / Builder — WR-118 repaired candidate handoff

TASK ID: WR-118 — Synthetic ESPN Replay + Reconnect Regression; WR-D030 test-only repair of WR-119-F01/F02
ROLE: Implementation Engineer / Builder
WORKFLOW: V3.5; EXECUTION: STANDARD_CHAT_HIGH; REFRESH: FAST_REFRESH
STATUS: REPAIRED BUILDER CANDIDATE SELF-VALIDATED — MANAGER EXACT-HEAD / FRESH AUDIT GATE
REPOSITORY: Ryan42062001/The-War-Room
EXISTING BRANCH: wr-118-synthetic-espn-replay-reconnect-regression
EXISTING BUILDER PR: #338 — OPEN / UNMERGED
HISTORICAL BUILDER CREATION BASE: 5dc8906d5285d1c51b51ef0068bd0a98753610ba
HISTORICAL FAILED BUILDER HEAD: 39491e672b6177834aa029b7a716c612c7cc892d — WR-119 FAIL historical and unchanged.
CURRENT CANONICAL MAIN AT REMEDIATION FAST REFRESH: 4188657af731fe7f2e32c8bbdbb0f348b7b5e053
EXACT NEW FINAL BUILDER HEAD: Live PR #338 metadata after this file write. Do not substitute an earlier code-checkpoint or self-reference this file's own eventual commit SHA.

## DONE / FILES
Amended the pre-existing synthetic app-side test in place: independent accepted-ledger snake next user pick/on-clock/picks-to-turn at active A/B, stale/partial, corrected, save/reload/reconnect, provisional 159 and authoritative 160 checkpoints; non-vacuous actual app scored candidate count and first-12 row availability/roster eligibility plus top-decision agreement at genuinely active stages; four bounded ephemeral negative controls per iteration; actual/expected independent ledger hashes, first mismatch, safe session/stage/pick/numbered input order on app result/counter failure, with explicit observation-failure fallback. Historical ledger/source/owner/session/provisional/full assertions retained; no new player winner or policy rule.

New remediation writes only: scripts/test-wr-118-espn-replay-reconnect.mjs, .ai/builder/WR118_SYNTHETIC_REPLAY_RECONNECT_EVIDENCE.md, and this .ai/builder/HANDOFF.md. package.json registration is UNCHANGED in remediation. The original PR cumulatively contains exactly its four already-approved paths (including unchanged prior package.json registration). No app/Companion, source/dataset/ECR/ADP, scoring/ranking weights, UI, workflow/runner or deployment changes.

## TESTS ACTUALLY RUN / RESULTS
Observed repaired **code-bearing checkpoint** 70d02c8d4bc2eb2916d0ff5d4fbe86a54174d4de, War Room [CI #35490745814](https://github.com/Ryan42062001/The-War-Room/actions/runs/35490745814): COMPLETED SUCCESS classify 106025118227, Governance 106025136191, full test 106025156084; bootstrap-reuse SKIPPED. Actual full npm test log confirms extension, off-board, draft-invariants, persistence-recovery, recovery-failures and syntax-checked named WR-118 test. Two deterministic fresh-context runs had equal source/A/B hashes, zero browser page errors and all **8/8 negative controls actually rejected**: empty active candidate list, incorrect nonterminal next pick, incorrect on-clock and mismatched counters in each iteration. F02 control reported real A session, pick #12, input order 1..12, distinct expected 11/actual 12 hashes and first #12 mismatch, with observationError null. Detailed digests/fixtures and actual job links: .ai/builder/WR118_SYNTHETIC_REPLAY_RECONNECT_EVIDENCE.md.

Earlier intermediary CI failure #35490108994 was a test-harness browser-reference error (Node-only ROUNDS inside page.evaluate); later intermediary CI #35490407352 failed due display-name/canonical-row index mapping in the new test despite actual candidateCount=520/inspected=12/invalid=0/available decision. Both corrected test-only; later CI #35490745814 actually passed the stronger repaired fixture. These are not asserted to be production defects. No local terminal command execution claimed; validation was performed on GitHub-hosted CI. This handoff/evidence change advances Builder head: verify final-head FULL PR CI separately, and DO NOT treat prior code-checkpoint run as immutable final-head proof.

## REMAINING BOUNDARY / NEXT MANAGER DECISION
Synthetic app snapshot ingestion and controlled local reload/replay ONLY, not real ESPN network reconnect, Companion-to-app transport, structured Direct, physical device or draft-ready release. The old independent WR-119 FAIL does not become PASS and does not transfer to the new head. The Manager must verify the final immutable PR #338 SHA, cumulative exact four-file diff, actual **new-head full CI**, freeze the repaired Builder candidate and separately commission **fresh WR-120 Independent Auditor/QA** on its own branch/PR. Builder must not self-audit, self-merge or activate an employee. After eventual Manager integration, exact canonical-main full CI canary is mandatory; no deployment/provider contact/source intake/custom model authorized.
