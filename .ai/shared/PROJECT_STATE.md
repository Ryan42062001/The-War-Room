# War Room Project State

Status: ACTIVE DEVELOPMENT — WORKFLOW V3.2 CANONICAL / WR-072 BOUNDED PROTOCOL REMEDIATION + WR-074 SELF-HOSTED CI PILOT ACTIVE
Last verified: 2026-09-15
Owner: Manager / Architect
Workflow: V3.2 CANONICAL

## Accepted Returning-Player v2 baseline

Source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea` and cohort `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4` remain accepted. Historical cohort is 5,176 unique keys with zero duplicates. Accepted source semantics remain 14 stats sources, zero admitted Players metadata sources, one failed-closed metadata source, and excluded `draft_picks.csv`.

Preserved authority:

- WR-042 custody manifest `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`
- WR-069 evidence `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`
- WR-071 PASS/no-findings audit and WR-059 accepted integration remain canonical.

## Returning-Player v2 protocol gate

### WR-072 — REWORK_REQUIRED

Historical failed-audit target:

- PR #207 / head `d75e58052dd555cd5b3f952fc2b3556287d75f9a`;
- model protocol `returning-player-v2-model-protocol/1.0.0-wr072`;
- machine-lock SHA-256 `d2fb326875c954446b23e2761df0feaad4b814aa49dd0465277979a3c9d9bd73`;
- exact-head CI `35013128300` SUCCESS.

WR-073 returned `FAIL — REMEDIATION REQUIRED` with one HIGH finding, `WR-073-AUD-01`, and no other findings. The protocol freezes threshold values but does not fully freeze exact relative-statistic formulas or deterministic player-cluster bootstrap execution semantics. Two compliant implementations could therefore make different promotion decisions near a threshold.

Audit evidence:

- audit PR #210;
- Auditor head `1188d0eb8b37fe067e693d16b88ab73e0193c8b0`;
- audit-head CI `35022367158` SUCCESS;
- audit evidence merge `a58b31b9d3ab499469d8ea47df6d957f35aa3edd`;
- post-merge CI `35050720809` classify/Governance SUCCESS.

R&D is authorized for bounded remediation on the existing WR-072 branch/PR only. It must freeze exact machine-readable gate formulas and the complete deterministic bootstrap algorithm, publish a NEW protocol version/hash for changed bytes, and preserve all previously positive feature/source/target/chronology/preprocessing/candidate/outcome-isolation evidence. No result inspection is allowed.

### WR-073 — CLOSED

Historical failed audit above. Removed from active-only registry after evidence merge and Manager disposition.

### WR-076 — BLOCKED

Fresh independent re-audit of one future Manager-frozen remediated WR-072 target. It remains blocked until R&D publishes and Manager freezes the new exact protocol identity/hash/head/CI.

## Parallel infrastructure lane

### WR-074 — ASSIGNED

Self-hosted heavy-CI runner pilot owned by Work Helper. It remains independent of WR-072/076. Public-repository security boundaries, dedicated runner labels, least privilege, clean workspace, no custody/provider secrets, repeat-run evidence, hosted fallback/reference, and WR-075 audit remain mandatory.

### WR-075 — BLOCKED

Fresh independent audit of one future Manager-frozen WR-074 pilot target.

## Boundaries

No Returning-Player v2 fitting, scoring, tuning, candidate result comparison, predictions, outcome evaluation/join or inspection, 2026 regular-season outcome inspection, production-ranking change, season-total composition, or Phase-6 work is authorized.

WR-D001 production ranking authority remains unchanged. WR-074/075 remains independent infrastructure work and may not weaken or rewrite the WR-072/076 pre-score chronology.
