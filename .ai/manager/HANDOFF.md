# Manager / Architect Handoff

HANDOFF

STATUS: WR-084 FAIL evidence preserved; WR-083 bounded remediation ASSIGNED; WR-089 reserved BLOCKED
TASK: WR-083 — Protected Historical Scoring Execution Bridge — bounded remediation
ROLE: Manager / Architect -> Work Helper / Super Troubleshooter / Cross-Functional Operator
CANONICAL WORKFLOW: V3.4
CANONICAL ROUTING BASE: `9f6eba965b11e3ee8c30be71cd9b7aac387a79e2`
IMPLEMENTATION BRANCH: `wr-083-protected-historical-scoring-bridge`
EXISTING PR: #234
FAILED AUDITED TARGET TO PRESERVE: `4ac5fa2c6148960094fde81b217bd3af080e4213`
EXECUTION MODE: STANDARD_CHAT_HIGH
REFRESH MODE: FAST_REFRESH / bounded remediation

AUDIT RESULT:
- WR-084 PR #243 — merged;
- Auditor head `69b491dfff87c08413ae335448c2b9ec2a2515f0`;
- verdict `FAIL — REMEDIATION REQUIRED`;
- audit-head CI `35307131616` — SUCCESS;
- post-merge main CI `35307517063` — SUCCESS.

FIX ONLY:
1. `WR-084-AUD-01`: establish Manager-controlled branch/head/consumer-path/consumer-digest authority and verify exact authorized branch head + reviewed consumer identity before retained rows/targets become consumer-visible; retain the second pre-push race check and negative tests for stale/unrelated/raced identities.
2. `WR-084-AUD-02`: bind publication validation to retained-input identities and fail closed on any output matching retained raw source bytes/digest+size; add negative passthrough tests while preserving no-artifact/no-log/cleanup protections.

PRESERVE: all WR-084 independently PASSed custody/no-scoring behavior unless minimally required by one of the two fixes.

DO NOT:
- perform real WR-081 scoring;
- inspect historical model outcomes;
- merge PR #234;
- modify Manager/shared/Auditor/research/product surfaces;
- broaden source/predictor scope;
- reactivate WR-081 or WR-074;
- activate WR-089.

COMPLETION:
Publish one new immutable WR-083 target on PR #234 with exact changed files, implementation/test hashes, explicit finding-closure map, exact-head Full War Room CI, protected bridge/custody regressions, and `real_scoring=false` / `historical_targets_exposed=false`. Return to Manager for exact freeze. Manager then activates fresh WR-089.

FILES / ARTIFACTS THAT MATTER:
- `.ai/manager/WR-083.md`
- `.ai/manager/WR083_REMEDIATION_WR084.md`
- `.ai/auditor/WR-084_AUDIT.md`
- `.ai/work_helper/WR083_PROTECTED_HISTORICAL_SCORING_BRIDGE.md`
- `.github/workflows/wr083-protected-historical-scoring-bridge.yml`
- `scripts/custody/wr083_protected_historical_scoring.py`
- `scripts/custody/test_wr083_protected_historical_scoring.py`

WORK MODE: not initially justified. If remediation expands into substantial repeated CI/environment debugging, return `WORK_MODE_ESCALATION_RECOMMENDED` with exact remaining work instead of restarting.
