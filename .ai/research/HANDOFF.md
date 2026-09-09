# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-023
Role: Research & Development (R&D)
Status: COMPLETE — PROTOCOL FROZEN / MANAGER REVIEW REQUIRED

## Verified starting state
- refreshed canonical `main`: `8e51bc08c0ac70370f49943ac78fda481d7e77e7`
- project state: MAINTENANCE / STABLE — bounded WR-023 R&D active
- WR-021: COMPLETE / ACCEPTED / MERGED
- WR-021 research PR #116 merge: `f2e3e9b1c0a9a59452d679783a5236d4a5da9a09`
- WR-021 final corrected 2026 snapshot remained committed at `.ai/research/generated/CONTEXT_SHADOW_2026_SNAPSHOT.csv`
- production ranking authority remained unchanged under WR-D001

## Branch
`wr-023-prospective-protocol-freeze`

## Starting SHA
`8e51bc08c0ac70370f49943ac78fda481d7e77e7`

## Objective completed
The exact 2026 prospective evaluation protocol for the frozen WR-021 shadow snapshot was pre-registered and committed **before any 2026 regular-season outcome source was queried, inspected, downloaded or scored in this WR-023 execution**.

WR-023 performed no 2026 outcome scoring.

## Protocol freeze boundary
Protocol file:
`.ai/research/WR023_2026_PROSPECTIVE_EVALUATION_PROTOCOL.md`

Freeze commit:
`28903ef5dc7073b36cb400330104e8f9e3ee0e05`

Freeze commit timestamp:
`2026-09-09T17:22:11Z`

Protocol Git blob SHA-1:
`2fc33ed684cfa539d2cc5684b52b7ba17adc47e1`

Protocol SHA-256:
`f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`

The protocol must not be rewritten after outcome inspection. Later outcome artifacts must reference this exact hash.

## Frozen WR-021 snapshot identity
Path:
`.ai/research/generated/CONTEXT_SHADOW_2026_SNAPSHOT.csv`

Git blob SHA-1:
`d97280847779a945f1b7901e90bd1b3ee649e4f4`

SHA-256:
`9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`

Independent manifest-generator checks:
- rows: 523
- unique player IDs: 523
- returners: 444
- drafted rookies: 79
- positions: QB/RB/WR/TE only
- duplicate IDs: none
- invalid rookie flags: none

No WR-021 prediction value was changed.

## Additional frozen provenance hashes
WR-021 source manifest:
- Git blob: `5e814449ea2fb3ee16f8cb5b16f67580c34369c7`
- SHA-256: `e1c8347ba5db9ee7d8b8d09ef3b28f814b737fb9fc436cb2c4de8a6d99f95120`

WR-021 asset manifest:
- Git blob: `07fc229791c4dcbf3234b506499c1eea186617d3`
- SHA-256: `ceb5b96e7152d16ebe7b637baad245b79893dc0e42b64545c756af4b6a221d4d`

WR-021 experiment report:
- Git blob: `760a2895f153d7826741ed624d3082ad4a0b1fbb`
- SHA-256: `fc19ec45ea22be20a290c79350b6f1c3d26d1f6090f35ad03e3be3006cf8d42c`

## Outcome source definition — frozen before outcome inspection
Predeclared source family:
- `nflverse/nflverse-data`
- release tag: `stats_player`
- intended asset: `stats_player_regpost_2026.csv`
- rights basis: same accepted nflverse CC BY 4.0 Player Summary Stats family used in WR-021

Required later fields:
- `player_id`
- `season_type`
- `games`
- `fantasy_points_ppr`
- if `season` exists, scored rows must equal 2026

Regular-season rule:
- case-insensitive `season_type == REG`
- postseason excluded

Join rule:
- exact frozen `player_id` / GSIS ID only
- no name-based rescue matching in the primary evaluation

Outcome aggregation:
- `actual_games = max(non-null games)` per player
- `actual_season_ppr = sum(fantasy_points_ppr)` over retained regular-season rows
- if games >=1, `actual_ppr_pg = actual_season_ppr / actual_games`
- no retained outcome row = 0 games / 0 season PPR; per-game target undefined

Later evaluators must hash the exact outcome asset before calculating any metric.

## Primary prospective hypothesis
RETURNING PLAYERS ONLY:

Frozen WR-021 Ridge PPR/game (`ridge_ppr_pg`) versus frozen previous-season PPR/game baseline (`baseline_ppr_pg`) on returning players with >=1 recorded 2026 regular-season game.

Rookies remain separate / diagnostic because WR-021 did not validate the Ridge rookie model historically.

Gradient Boosting remains secondary / diagnostic and cannot satisfy the primary gate if Ridge fails.

## Interim checkpoint policy
Predeclared opportunities:
- after Week 4
- after Week 8
- after Week 13

All are `INTERIM — DESCRIPTIVE ONLY`.

Interim results may not:
- confirm or reject the final signal
- trigger refitting
- change features
- change cohort membership
- change prediction values
- change thresholds
- trigger early stopping
- authorize a production proposal

A missed interim checkpoint may not be reconstructed later from a newer cumulative outcome asset.

## Decisive final checkpoint
The only decisive checkpoint is after the complete 2026 NFL regular season through Week 18.

No postseason outcome is part of WR-023.

## Primary final evidence gate — frozen
`PROSPECTIVE SIGNAL CONFIRMED — PRODUCTION MILESTONE MAY BE CONSIDERED` is allowed only if all hold:

1. pooled returning-player Ridge PPR/game MAE improves by at least 3.00% versus frozen baseline;
2. 10,000-replicate paired player bootstrap with deterministic seed 23023 gives a 95% percentile interval for `|Ridge error| - |baseline error|` whose upper bound is strictly < 0.0;
3. pooled Ridge Spearman minus baseline Spearman is >= -0.01;
4. at least 3 of 4 frozen positions are non-worse on MAE and no position is >5% worse;
5. no snapshot/data contamination and no post-freeze model, prediction, cohort, protocol or gate change.

Classification mapping:
- all five validly measured and all pass -> `PROSPECTIVE SIGNAL CONFIRMED — PRODUCTION MILESTONE MAY BE CONSIDERED`
- valid final evaluation and any primary gate fails -> `PROSPECTIVE SIGNAL NOT CONFIRMED`
- material source/integrity/completeness issue prevents a defensible test -> `MORE EVIDENCE NEEDED`

Passing the future gate still does not authorize production. It only permits Manager consideration of a separate production milestone.

## Secondary metrics frozen
Report separately without overriding the primary gate:
- RMSE
- rank MAE
- position top-N overlap using QB12 / RB24 / WR36 / TE12
- availability recorded-games MAE
- experimental season-total PPR MAE
- position-level metrics
- rookie baseline/Ridge/Boost diagnostics
- Boost returning diagnostics

## FantasyPros boundary
No WR-023 classification depends on FantasyPros.

Do not claim superiority to FantasyPros without separate Manager authorization for a lawful and methodologically valid contemporaneous comparison.

Production ranking reference preserved from WR-021:
`4dbc0bf22d27296c3cd9b45fd90de637488ff001`

WR-D001 remains unchanged.

## Manifest generation evidence
Deterministic generator:
`.ai/research/wr023_freeze_manifest.py`

Generated manifest:
`.ai/research/generated/WR023_PROTOCOL_MANIFEST.json`

Temporary manifest-freeze workflow run:
`34382647524` — SUCCESS

The temporary workflow was removed after successful manifest creation so it does not remain in the final research diff.

## Files changed
Intended final research files:
- `.ai/research/WR023_2026_PROSPECTIVE_EVALUATION_PROTOCOL.md`
- `.ai/research/generated/WR023_PROTOCOL_MANIFEST.json`
- `.ai/research/wr023_freeze_manifest.py`
- `.ai/research/HANDOFF.md`

Production files changed: NO
Canonical `.ai/shared/*` changed: NO
Frozen WR-021 snapshot changed: NO
Production rankings changed: NO

## Known limitations
- no 2026 outcome has yet been scored; that is intentional for WR-023
- the future source asset can change over the season, so every checkpoint requires append-only source metadata/hash provenance
- frozen universe excludes UDFAs/no-history players and one drafted 2026 skill-position player without deterministic GSIS ID, exactly as WR-021 froze it
- rookie Ridge remains unvalidated and is diagnostic only
- a future lawful FantasyPros comparison is outside this protocol unless separately authorized

## Blocking issues
None for protocol freeze completion.

Any production milestone remains blocked on the final pristine 2026 prospective result and subsequent Manager review.

## Recommended next role
Manager / Architect

## Exact next action
Review the WR-023 protocol/hash manifest and research PR. If accepted, preserve the protocol and snapshot unchanged. Later R&D may score only the predeclared descriptive checkpoints or final Week 18 checkpoint under this exact protocol, with each 2026 outcome asset hashed before scoring.

## Checkpoint / SHA
Verify the final research branch head after this handoff commit and final exact-head CI.
