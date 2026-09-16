# War Room Project State

Status: ACTIVE DEVELOPMENT — WORKFLOW V3.2 CANONICAL / WR-076 FRESH PROTOCOL RE-AUDIT ACTIVE + WR-074 SELF-HOSTED CI PILOT IN PROGRESS
Last verified: 2026-09-16
Owner: Manager / Architect
Workflow: V3.2 CANONICAL

## Accepted Returning-Player v2 baseline

Source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea` and cohort `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4` remain accepted. Historical cohort is 5,176 unique keys with zero duplicates. Accepted source semantics remain 14 stats sources, zero admitted Players metadata sources, one failed-closed metadata source, and excluded `draft_picks.csv`.

Preserved authority:
- WR-042 custody manifest `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`;
- WR-069 evidence `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`;
- WR-071 PASS/no-findings audit and WR-059 accepted integration remain canonical.

## Returning-Player v2 protocol gate

### WR-072 — AUDIT_READY / MANAGER-FROZEN

Exact remediated target:
- PR #207;
- branch `wr-072-v2-model-protocol-feature-schema`;
- head `95b1fdfb36ffc7b865597bf7131fa1dd9f45ae73`;
- protocol `returning-player-v2-model-protocol/1.1.0-wr072`;
- result gates `returning-player-v2-result-gates/1.1.0-wr072`;
- machine-lock SHA-256 `831aed6e8cad2d760a58a3c9f5bc298891e0ed11707ecc545c9254b29110c61d`;
- exact-head CI `35091913065` classify/Governance SUCCESS, product test skipped.

The remediation is exactly one commit ahead of historical failed head `d75e58052dd555cd5b3f952fc2b3556287d75f9a`, zero behind, and changes only the same four `.ai/research/**` protocol/handoff files. It freezes deterministic relative-gate math, aggregation semantics, and the full PCG64 player-cluster bootstrap implementation before any results are exposed.

Historical failed protocol `returning-player-v2-model-protocol/1.0.0-wr072` / `d2fb326875c954446b23e2761df0feaad4b814aa49dd0465277979a3c9d9bd73` remains immutable failed-audit evidence from WR-073.

R&D must not move or merge PR #207 during WR-076.

### WR-076 — ASSIGNED

Fresh independent re-audit of exact WR-072 head `95b1fdfb36ffc7b865597bf7131fa1dd9f45ae73`. Audit must independently establish whether WR-073-AUD-01 is fully resolved without weakening any previously positive source/feature/target/chronology/preprocessing/candidate/outcome-isolation evidence.

No scoring/evaluation is authorized unless WR-076 returns PASS-family and Manager completes disposition/integration.

## Parallel infrastructure lane

### WR-074 — IN_PROGRESS

Work Helper self-hosted heavy-CI pilot remains independent. The exact `scripts/validate-release-candidate.mjs` path is authorized solely to recognize the approved pilot workflow while retaining fail-closed release validation. Dedicated `[self-hosted, war-room-heavy-ci]` routing, repeat runs, clean workspace, no custody/provider secrets, and hosted fallback remain mandatory.

### WR-075 — BLOCKED

Fresh independent audit of one future Manager-frozen WR-074 pilot target.

## Boundaries

No Returning-Player v2 fitting, scoring, tuning, candidate result comparison, predictions, outcome evaluation/join or inspection, 2026 regular-season outcome inspection, production-ranking change, season-total composition, or Phase-6 work is authorized.

WR-D001 production ranking authority remains unchanged. WR-074/075 remains independent infrastructure work and may not weaken or rewrite the WR-072/076 pre-score chronology.
