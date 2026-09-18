# WR-089 — Exact Frozen Re-Audit Target

Status: AUTHORITATIVE MANAGER FREEZE
Date: 2026-09-18
Canonical workflow: V3.4
Audit task: WR-089
Target task: WR-083
Target PR: #234
Target branch: `wr-083-protected-historical-scoring-bridge`
Exact target SHA: `c9b13959f598b3633a78e2ff78d0862881982dd2`
Freeze baseline main: `ca7fda518386fc23f44344e78fc3b4169602c254`

## Integrability and scope

Canonical V3.4 main is the exact merge base of the frozen target.

Compare:
- status: ahead;
- ahead: 35;
- behind: 0;
- exactly seven authorized WR-083 paths;
- PR #234 OPEN, unmerged, ready for review and mergeable at freeze preparation.

Changed paths:
- `.ai/work_helper/HANDOFF.md`
- `.ai/work_helper/WR083_PROTECTED_HISTORICAL_SCORING_BRIDGE.md`
- `.ai/work_helper/WR083_PROTECTED_PROOF_SUMMARY.json`
- `.github/workflows/wr083-protected-historical-scoring-bridge.yml`
- `scripts/custody/test_wr083_protected_historical_scoring.py`
- `scripts/custody/wr083_protected_historical_scoring.py`
- `scripts/validate-release-candidate.mjs`

## Failed-audit history

WR-084 audited predecessor target `4ac5fa2c6148960094fde81b217bd3af080e4213` and returned `FAIL — REMEDIATION REQUIRED` with HIGH findings:
- `WR-084-AUD-01` — missing pre-exposure Manager binding of future WR-081 branch/head/consumer identity;
- `WR-084-AUD-02` — publication path could pass retained raw source bytes into Git history.

WR-084 evidence:
- PR #243;
- Auditor head `69b491dfff87c08413ae335448c2b9ec2a2515f0`;
- audit-head CI `35307131616` — SUCCESS;
- evidence merge `9f6eba965b11e3ee8c30be71cd9b7aac387a79e2`.

WR-089 must independently determine whether those findings are closed.

## Remediation evidence to verify, not assume

WR-084-AUD-01 claimed remediation:
- Manager-controlled authority binds exact WR-081 branch, head, consumer path and reviewed digest;
- live branch head is verified before retained retrieval;
- checked-out HEAD and reviewed consumer identity are verified before retained retrieval;
- live branch head is rechecked before consumer exposure;
- pre-push race checks remain;
- negative tests cover unrelated/stale SHA, unreviewed path/digest, missing/blocked authority and branch advancement.

WR-084-AUD-02 claimed remediation:
- publication validation is bound to the retained-input manifest;
- retained raw digest+size and exact-byte passthrough are rejected;
- allowed evidence paths/types are narrow;
- passthrough is rejected at validation and final staging.

## Exact-head validation

Full War Room CI `35309111018`: SUCCESS
- classify `105487272881`: SUCCESS
- governance `105487309809`: SUCCESS
- full test `105487359262`: SUCCESS

Final-head protected/custody regressions:
- WR-083 `35309111079`: SUCCESS
- WR-046 `35309111050`: SUCCESS
- WR-063 `35309111093`: SUCCESS
- WR-069 `35309111021`: SUCCESS

## Credentialed NO-SCORING proof binding

Remediated implementation/proof SHA:
`648ae9372bf2eb49e0fcebcf921d7bafd7d26d1b`

Protected run `35308823649`: SUCCESS
- preflight `105486418552`: SUCCESS
- trust gate `105486504930`: SUCCESS
- protected no-scoring proof `105486527602`: SUCCESS
- future authorized WR-081 scoring `105486528622`: SKIPPED

Actions artifact endpoint: zero artifacts.

The final frozen target preserves the proof-reviewed implementation blobs exactly:
- bridge script Git blob `19dc3bfb83b75e6ced9db111ca05bf446f67839e`;
- regression test Git blob `620fad20e0a3110b5e40b442f87fd6078b6aa5df`;
- protected workflow Git blob `00c3384d51a4717f993b93ef08f61d1963dba592`.

Reviewed SHA-256:
- bridge script `b111a5566f64a3e334b946780c9bf6fb5579a995917615c33ce1d95e98733498`;
- tests `a581a9a98b15af75e9eeacdade3fb66364dbb9900dec153aa91c0c89dd61ca34`;
- workflow `cf83c12c213772012fcd4a2c5b430e8bff321f0ef229007ca3fa85eccc6cae38`.

From proof SHA to final target, only three Work Helper evidence files changed.

## Boundary

`real_scoring=false`
`historical_targets_exposed=false`

No real WR-081 target join, fit, prediction inspection, baseline comparison, gate evaluation or historical model-result inspection is authorized during WR-089.

Auditor writes only `.ai/auditor/**`.

WR-089 audits exactly `c9b13959f598b3633a78e2ff78d0862881982dd2`. Do not follow later movement of PR #234 or its branch.
