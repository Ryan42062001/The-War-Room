# Implementation Engineer / Builder — WR-118 handoff

STATUS: BUILDER VALIDATION / MANAGER AUDIT-READINESS GATE (not an Auditor verdict)
TASK: WR-118 — Synthetic ESPN Replay + Reconnect Regression
ROLE: Implementation Engineer / Builder
WORKFLOW: V3.5; EXECUTION: STANDARD_CHAT_HIGH; REFRESH: FAST_REFRESH
BRANCH: wr-118-synthetic-espn-replay-reconnect-regression
BASE: 5dc8906d5285d1c51b51ef0068bd0a98753610ba (initial canonical main and branch independently verified)
HEAD / PR: Obtain live exact head and one four-file Builder PR from GitHub after the final write; this file cannot contain its own eventual commit SHA.

DONE: Added one fixed-seed, app-side/browser regression exercising numbered 1..12, duplicate/reordered/stale/partial packets, accepted full-snapshot correction at #5, isolated A/B saved drafts, A20 reload and synthetic replay, 159/160 provisional vs 160/160 authoritative terminal completion and terminal reload. The test compares final A/B/source hashes across two fresh browser contexts. A new named package script performs node --check plus test execution and is registered in npm test. No new strategy winner/threshold or manual-vs-ESPN precedence rule.
CHANGED: Exactly scripts/test-wr-118-espn-replay-reconnect.mjs, package.json test registration, .ai/builder/WR118_SYNTHETIC_REPLAY_RECONNECT_EVIDENCE.md, and this handoff. No production, Companion, UI, dataset, model, ranking, runner or workflow writes.
TESTS: Check actual observed named/full/related suite results from exact-head Actions runs and final PR evidence before Manager freeze. Presence of assertions and passing Governance alone do not prove product behavior. The named script itself executes its deterministic scenario twice and checks digest equality. Distinguish any jobs not completed from PASS.
CI: Exact-head FULL War Room CI is required for the final PR target; recheck live job/run status and record exact IDs and conclusions before audit readiness.
BOUNDARY: App-side injected synthetic snapshots only; no real ESPN, no Companion transport/extension-to-app E2E certification, no independently verified structured Direct, no physical device. No provider contact or source/data acquisition.
DECISIONS CONSUMED: WR-D001 ECR value/ESPN market timing; WR-D018 fallback-first and LIVE_DIRECT_UNVERIFIED; WR-D027/028 Track A test-only scope; WR-117 remains closed.
BLOCKERS: A reproducible failing mechanical assertion is a STOP / Manager remediation decision, not Builder production patch authority. If CI is incomplete, remain VALIDATION PENDING instead of claiming AUDIT_READY.
NEXT ACTION: Manager verifies exact branch/PR/head, four-file scope, actual relevant suite and full CI outcomes, then freezes a passing candidate and separately activates fresh Independent Auditor/QA. Builder neither audits nor merges. Exact canonical-main full CI canary required after any later Manager integration.
FILES / ARTIFACTS: .ai/builder/WR118_SYNTHETIC_REPLAY_RECONNECT_EVIDENCE.md; scripts/test-wr-118-espn-replay-reconnect.mjs; package.json; live PR Actions run logs.
DO NOT REPEAT: WR-117 inventory or live/provider/source/model investigations; no new employee activation by Builder.
