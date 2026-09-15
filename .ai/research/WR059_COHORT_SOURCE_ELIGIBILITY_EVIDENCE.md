# WR-059 Returning-Player v2 Cohort / Source-Eligibility Evidence

Status: `REMEDIATED — MANAGER EXACT-TARGET FREEZE REQUIRED`

Cohort version: `returning-player-v2-cohort/1.2.0-wr059`  
Canonical SHA-256: `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`  
Bound source snapshot: `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`

## Scope

This bounded WR-060 remediation does **not** change historical cohort membership. It only re-versions the cohort artifact because its required source-snapshot binding changed after Path B failed closed the metadata source.

Membership rule remains:

> For target season Y, include every QB/RB/WR/TE with a valid completed Y-1 regular-season Player Summary Stats row; freeze position from Y-1; target-Y participation does not determine membership.

Neither `players.csv` nor `draft_picks.csv` defines historical membership.

## Membership preservation

Historical player-season-position membership is unchanged:

- target seasons: **2014–2025**
- expected membership rows: **5,176**
- represented membership rows: **5,176**
- unique membership rows: **5,176**
- duplicates: **0**
- 2014–2017 TRAIN_ONLY: **1,668**
- 2018–2025 historical: **3,508**
- changed membership rows: **0**
- ordering changed: **no**
- prior-season source lineage changed: **no**

The stable-key contract includes `cohort_version`, so the version field is intentionally re-versioned from `1.1.0-wr059` to `1.2.0-wr059`. This does not alter the underlying `(target_season, gsis_id, player_id, position)` historical membership.

## 2014–2017 TRAIN_ONLY closure

Accepted WR-069 evidence remains unchanged:

| Target | Count | Accepted inventory SHA-256 |
|---|---:|---|
| 2014 | 410 | `370dcbf39901dd825c2dff9c9436e7b28eb3037c0dc86e159eb1573b5bfff23c` |
| 2015 | 412 | `c03d8c59e48ca53073a948fe39b49475bc8aee6cb88ae7cde14a9d8fdb92a231` |
| 2016 | 423 | `507ef19969222b1f332bcdf22293883bc274df327b2081e450ecafd1bc0f0dd0` |
| 2017 | 423 | `e73bab983c6d5d5b11861c56acc9dea4b9d314db4b2fe3660a063debdd9520b0` |

Authority artifact remains `.ai/work_helper/WR069_RETAINED_DERIVED_EVIDENCE.json` SHA-256 `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`.

## 2018–2025 historical membership

The existing **3,508** identities remain frozen from `.ai/research/generated/WR034_EVENT_ROWS.csv` Git blob `c1e013a2f9054eee1a36a70aaee80dedd46b9957`, using only target season, player ID, and position.

Per-target counts remain exactly:

- 2018: 419
- 2019: 444
- 2020: 437
- 2021: 435
- 2022: 475
- 2023: 446
- 2024: 421
- 2025: 431

Accepted prior identity digest remains `9d45c1d9b14bc2df5948f19949d784194b68a3608d95b83c0455fd9e569d8e0e`.

## Source eligibility after Path B

Every target season 2014–2025 still binds to the exact admitted Y-1 `NFLVERSE_PLAYER_SUMMARY_STATS` source instance. Those 14 stats sources remain admitted.

Historical asset `563580371` (`players.csv`) is now `FAILED_CLOSED_UNAVAILABLE` because its required release provenance is not independently reproducible. It is **not required for membership**, was not used to rewrite membership, and is unavailable for later metadata-feature use under this checkpoint.

`draft_picks.csv` remains excluded by WR-057.

## Canonical artifact

Machine path:

`.ai/research/generated/WR059_RETURNING_PLAYER_V2_COHORT_SOURCE_ELIGIBILITY.json`

The cohort binds exactly to the new `wr-returning-player-v2-source-snapshot/1.2.0-wr059` source snapshot and SHA-256 `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`. Canonicalization is sorted-key compact UTF-8 JSON with one final LF; the sidecar hashes those exact bytes.

## Boundaries

No retained raw-byte access, source reacquisition/refresh/substitution, provider mutation, 2026 regular-season outcome table, target/outcome join, model fitting, scoring, tuning, comparison, evaluation, prediction, ranking, production, `draft_picks.csv`, or Phase-6 work occurred.
