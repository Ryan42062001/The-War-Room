# War Room Project State

Status: ACTIVE DEVELOPMENT — WORKFLOW V3.2 CANONICAL / WR-072 SECOND BOUNDED PROTOCOL REMEDIATION + WR-074 SELF-HOSTED CI PILOT IN PROGRESS
Last verified: 2026-09-16
Owner: Manager / Architect
Workflow: V3.2 CANONICAL

## Accepted Returning-Player v2 baseline

Source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea` and cohort `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4` remain accepted. Historical cohort is 5,176 unique keys with zero duplicates. Accepted source semantics remain 14 stats sources, zero admitted Players metadata sources, one failed-closed metadata source, and excluded `draft_picks.csv`.

Preserved authority includes WR-042 custody manifest `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`, WR-069 evidence `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`, and WR-059/071 acceptance.

## Returning-Player v2 protocol gate

### WR-072 — REWORK_REQUIRED

Historical failed-audit targets now include:

- 1.0.0 head `d75e58052dd555cd5b3f952fc2b3556287d75f9a` / lock `d2fb326875c954446b23e2761df0feaad4b814aa49dd0465277979a3c9d9bd73` — WR-073 FAIL;
- 1.1.0 head `95b1fdfb36ffc7b865597bf7131fa1dd9f45ae73` / lock `831aed6e8cad2d760a58a3c9f5bc298891e0ed11707ecc545c9254b29110c61d` — WR-076 FAIL.

WR-076 findings:

- HIGH `WR-076-AUD-01`: generic improve/regress formulas and derived call argument order are not normatively reconciled, leaving candidate/baseline operand-role ambiguity that can reverse sign/pass-fail;
- MEDIUM `WR-076-AUD-02`: expected synthetic bootstrap digest/endpoints/gate are published without an exact frozen input fixture/reference implementation, preventing independent reproduction.

Audit authority: PR #214 / head `dcf75157b18f9b2fba3effa2bb0a705e9ad79749` / CI `35094551843` SUCCESS / evidence merge `7db935e5c0053ea96e162f26f6de77e5ffe4da33` / post-merge CI `35094846833` SUCCESS.

R&D is authorized for one further bounded prospective remediation on existing WR-072 branch/PR #207 only. It must explicitly bind named candidate/baseline function signatures and freeze/hash the exact privacy-safe synthetic bootstrap input fixture or equivalent deterministic reference implementation. Changed bytes require new versioned identities/hashes. No results may be inspected.

### WR-076 — CLOSED

Historical failed re-audit above. Removed from active-only registry after evidence merge and Manager disposition.

### WR-077 — BLOCKED

Fresh independent re-audit of one future Manager-frozen newly versioned WR-072 target resolving WR-076-AUD-01/02.

## Parallel infrastructure lane

### WR-074 — IN_PROGRESS

Work Helper self-hosted heavy-CI pilot remains independent. Dedicated `[self-hosted, war-room-heavy-ci]` routing, clean workspace, repeated-run evidence, hosted fallback, least privilege, no custody/provider secrets, and bounded release-validator authorization remain mandatory.

### WR-075 — BLOCKED

Fresh independent audit of one future Manager-frozen WR-074 pilot target.

## Boundaries

No Returning-Player v2 fitting, scoring, tuning, candidate result comparison, predictions, outcome evaluation/join or inspection, development/validation/confirmation result inspection, 2026 regular-season outcome use, production-ranking change, season-total composition, or Phase-6 work is authorized.

WR-D001 production ranking authority remains unchanged. WR-074/075 remains independent infrastructure work and may not weaken or rewrite the WR-072/077 pre-score chronology.
