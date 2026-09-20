# Implementation Engineer / Builder — WR-118 bounded remediation handoff

TASK: WR-118 — Synthetic ESPN Replay + Reconnect Regression; WR-D030 remediation of WR-119-F01/F02
ROLE: Builder; WORKFLOW: V3.5; EXECUTION: STANDARD_CHAT_HIGH; REFRESH: FAST_REFRESH
STATUS: IN-PLACE TEST-ONLY REMEDIATION; exact NEW-head full CI / Manager audit-readiness gate pending
REPOSITORY: Ryan42062001/The-War-Room
EXISTING BRANCH: wr-118-synthetic-espn-replay-reconnect-regression
EXISTING PR: #338 OPEN / UNMERGED
HISTORICAL FAILED HEAD: 39491e672b6177834aa029b7a716c612c7cc892d — WR-119 FAIL remains historical evidence, not an audit of the new head.
HISTORICAL CREATION BASE: 5dc8906d5285d1c51b51ef0068bd0a98753610ba
CURRENT MAIN AT FAST REFRESH: 4188657af731fe7f2e32c8bbdbb0f348b7b5e053
NEW CANDIDATE SHA: Verify actual final PR head after all evidence/handoff writes; this file cannot contain its own eventual commit SHA.

DONE / CHANGED: Existing WR-118 synthetic app-side fixture now independently asserts user next lawful snake pick/on-clock/picks-until-turn at all A/B active/replay/reload/provisional/terminal checkpoints, derives when the active candidate obligation applies without trusting the actual completion flag, and requires a strictly nonempty genuinely available/roster-eligible app scored candidate set plus available top candidate and actual decision-path agreement. Bounded ephemeral negative controls reject zero active candidates, wrong nonterminal next-pick and wrong on-clock. F02 app-result/counter failure reads the real synthetic session/authoritative app ledger when available, reports separately computed expected/actual digest, first mismatch, stage/pick/numbered input order and safe metadata or an explicit observation failure; the counter-failure negative control tests this path. All changes are in the existing test + task-owned evidence/handoff. package.json registration remains unchanged; cumulative PR paths stay exactly the original four.

TESTS / FINDING: An early intermediary CI test job #106023515383 of run #35490108994 failed at newly added test inspection with `page.evaluate: ReferenceError: ROUNDS is not defined`: test-harness Node constant was mistakenly referenced inside the browser page. The existing off-board/draft-invariants/persistence/recovery tests in that run passed before this point. This is a fixture-context mistake, not demonstrated app malfunction; fixed by using the actual browser draft state's `state.rounds` in subsequent test-only commit. Do NOT report the early run as PASS. Reverify actual later code-head syntax/new test, negative controls, extension/off-board/draft-invariants/recovery suites and full npm test after this fix. Exact NEW final-head FULL PR War Room CI and fresh re-audit remain required; no local-terminal test run claimed.

AUTHORITY / BOUNDARY: WR-D001 FantasyPros ECR value and ESPN timing; WR-D018 Board/Pick History fallback-first, independent Direct remains unverified; WR-D027/028/029/030 scoped app-side tests only. No provider contact, source admission, live ESPN, Companion end-to-end proof, production app/dataset/weights/UI/workflow/runner/deployment changes. No new Strategy policy or preferred-player winner. If stronger assertions reveal real production defect, preserve smallest failing fixture and STOP; do not patch product under WR-118.

NEXT MANAGER ACTION: Only after actual exact-new-head full CI SUCCESS and evidence review, freeze repaired Builder SHA on existing PR #338 and separately activate a FRESH distinct WR-120 Independent Auditor/QA task/branch/PR. WR-119 FAIL at historical SHA remains unchanged. No Builder self-audit/merge/employee activation. After any eventual Manager integration, mandatory canonical-main full CI canary.
