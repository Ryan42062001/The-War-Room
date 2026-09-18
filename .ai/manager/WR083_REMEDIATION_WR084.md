# WR-083 bounded remediation route from WR-084

Status: MANAGER-AUTHORIZED
Date: 2026-09-18
Canonical workflow: V3.4
Canonical routing base: `9f6eba965b11e3ee8c30be71cd9b7aac387a79e2`
Implementation task: WR-083
Implementation branch: `wr-083-protected-historical-scoring-bridge`
Existing PR: #234
Failed audited target preserved: `4ac5fa2c6148960094fde81b217bd3af080e4213`
Failed audit: WR-084 / PR #243 / Auditor head `69b491dfff87c08413ae335448c2b9ec2a2515f0`
Next fresh audit: WR-089

## Authorized remediation

Only close:
1. `WR-084-AUD-01` — bind authorized WR-081 branch/head/consumer path/digest in Manager-controlled authority and verify it before retained target exposure while retaining the pre-push race check.
2. `WR-084-AUD-02` — mechanically reject retained raw-source passthrough in future `.ai/research/**` publication, with manifest binding and negative tests.

Preserve all independently PASSed custody/no-scoring behavior unless a minimal dependency change is required to close one of those findings.

## Execution

- execution mode: `STANDARD_CHAT_HIGH`;
- refresh: bounded remediation / `FAST_REFRESH`;
- reuse the existing Work Helper chat if still coherent;
- reuse WR-083 branch and PR #234;
- do not perform real WR-081 scoring;
- do not merge PR #234;
- do not activate WR-089.

## Completion gate

Return one new immutable WR-083 target with exact-head Full CI plus protected/custody regressions and a precise finding-closure map. Manager then freezes that target and activates a fresh independent WR-089 audit.
