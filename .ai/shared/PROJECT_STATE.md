# War Room Project State

Status: ACTIVE DEVELOPMENT — WORKFLOW V3.2 CANONICAL / WR-073 PROTOCOL AUDIT + WR-074 SELF-HOSTED CI PILOT ACTIVE
Last verified: 2026-09-15
Owner: Manager / Architect
Workflow: V3.2 CANONICAL

## Accepted Returning-Player v2 baseline

Source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea` and cohort `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4` remain accepted. Historical cohort is 5,176 unique keys with zero duplicates. Accepted source semantics remain 14 stats sources, zero admitted Players metadata sources, one failed-closed metadata source, and excluded `draft_picks.csv`.

Preserved authority:

- WR-042 custody manifest `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`
- WR-069 evidence `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`
- WR-071 PASS/no-findings audit and WR-059 accepted integration remain canonical.

## Returning-Player v2 active gates

### WR-072 — AUDIT_READY

R&D published PR #207 at exact head `d75e58052dd555cd5b3f952fc2b3556287d75f9a`. Manager verified/froze the exact four-file `.ai/research/**` candidate.

Frozen identities:

- model protocol `returning-player-v2-model-protocol/1.0.0-wr072`
- feature schema `returning-player-v2-feature-schema/1.0.0-wr072`
- preprocessing `returning-player-v2-preprocessing/1.0.0-wr072`
- serializer `returning-player-v2-evidence-serializer/1.0.0-wr072`
- target `returning-player-v2-expected-ppr-pg-target/1.0.0-wr072`
- candidate `returning-player-v2-ridge-stats-only-a100/1.0.0-wr072`
- machine-lock SHA-256 `d2fb326875c954446b23e2761df0feaad4b814aa49dd0465277979a3c9d9bd73`
- exact-head War Room CI `35013128300` SUCCESS.

The frozen protocol has exactly 28 predictors, all from admitted Y-1/Y-2 `NFLVERSE_PLAYER_SUMMARY_STATS` REG semantics; zero metadata-derived and zero draft-capital predictors. No v2 model result exists yet.

### WR-073 — ASSIGNED

Fresh independent audit of exact WR-072 PR #207 head `d75e58052dd555cd5b3f952fc2b3556287d75f9a`. Auditor writes only `.ai/auditor/**` and must independently reproduce the machine lock, identities, source/cohort bindings, feature lineage, chronology, target/preprocessing/candidate/gates, full-row evidence, outcome isolation, and no-result-work boundary.

No scoring/evaluation may be authorized unless WR-073 returns PASS-family and Manager accepts the disposition.

## Parallel infrastructure lane

### WR-074 — ASSIGNED

Self-hosted heavy-CI runner pilot owned by Work Helper. It remains independent of WR-072/073. Public-repository security boundaries, dedicated runner labels, least privilege, clean workspace, no custody/provider secrets, repeat-run evidence, hosted fallback/reference, and WR-075 audit remain mandatory.

### WR-075 — BLOCKED

Fresh independent audit of one future Manager-frozen WR-074 pilot target.

## Boundaries

No Returning-Player v2 fitting, scoring, tuning, candidate result comparison, predictions, outcome evaluation/join, 2026 regular-season outcome inspection, production-ranking change, season-total composition, or Phase-6 work is authorized.

WR-D001 production ranking authority remains unchanged. WR-074/075 remains independent infrastructure work and may not weaken or rewrite the WR-072/073 evidence chronology.
