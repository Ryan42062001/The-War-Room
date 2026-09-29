# WR-081 — Reactivation and Future Execution Authority Plan

Status: MANAGER-AUTHORIZED — STAGE A ONLY
Date: 2026-09-18
Canonical workflow: V3.4
Fresh branch: `wr-081-v2-historical-model-scoring-execution`
Canonical reactivation base: `11f1014ba73a70563c29a8c6d4b11f8303298cdf`

## Accepted prerequisite

WR-090 canonical-main protected NO-SCORING canary run `35366265783` completed SUCCESS at canonical head `11f1014ba73a70563c29a8c6d4b11f8303298cdf`.

Verified:
- 14 retained inputs;
- provider mutations 0;
- consumer provider credentials absent;
- consumer re-hash/re-size 14/14;
- cleanup PASS;
- Actions artifacts 0;
- `real_scoring=false`;
- `historical_targets_exposed=false`.

## Why Stage A exists

The audited bridge refuses real WR-081 execution unless canonical Manager authority binds an exact execution branch, exact current branch head, exact consumer path, and exact reviewed consumer SHA-256.

No WR-081 protected scoring consumer exists yet. Manager therefore cannot lawfully populate `future_execution_authority` until R&D first prepares and freezes that consumer.

## Stage A — R&D consumer preparation

Authorized writes: `.ai/research/**` only.

Recommended consumer:
`.ai/research/WR081_PROTECTED_SCORING_CONSUMER.py`

Use only synthetic/local fixtures. Do not dispatch protected scoring and do not retrieve retained provider bytes.

Return exact branch head, consumer path, consumer SHA-256, changed files, tests and no-scoring attestation.

## Stage B — Manager authority

Manager reviews the Stage-A immutable head and consumer. If accepted, canonical `.ai/shared/ACTIVE_TASKS.json` receives:

`future_execution_authority = { branch, head_sha, consumer_path, consumer_sha256 }`

Only then may `WR-083 Protected Historical Scoring Bridge` be dispatched in `authorized-wr081-scoring` mode using exactly those four values.

R&D does not self-authorize or continue automatically from Stage A to Stage B.
