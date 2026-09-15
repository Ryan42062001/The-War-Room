# WR-059 Returning-Player v2 Cohort / Source-Eligibility Evidence

Status: `COMPLETE — MANAGER FREEZE / WR-060 AUDIT REQUIRED`

Cohort version: `returning-player-v2-cohort/1.1.0-wr059`  
Canonical SHA-256: `d6927509968ac3a371591a69fd665861e9546a0868f1e7b1c5db6c31cc887354`  
Bound source snapshot: `wr-returning-player-v2-source-snapshot/1.1.0-wr059` / `f6ee530c7733b1aa9d984a3e874015ca9a3dd7cebda5ffc558df4cb159c591b9`

## Scope

This checkpoint remediates `WR-043-AUD-02` only. It freezes the complete deterministic no-scoring historical returning-player cohort for target seasons **2014–2025**.

Membership rule is unchanged:

> For target season Y, include every QB/RB/WR/TE with a valid completed Y-1 regular-season Player Summary Stats row; freeze position from Y-1; target-Y participation does not determine membership.

Neither `players.csv` nor `draft_picks.csv` defines historical membership.

## Complete ordered key inventory

Stable key:

`(target_season, player_id_namespace, player_id, position, cohort_version)`

with `player_id_namespace = gsis_id`.

The machine artifact freezes a deterministic ordered-segment expansion that is the complete inventory. Global order is target season ascending, then position and player ID in exact Unicode code-point order.

### 2014–2017 TRAIN_ONLY closure

Accepted WR-069 derived evidence closes the exact 1,668-key gap:

| Target | Count | Accepted inventory SHA-256 |
|---|---:|---|
| 2014 | 410 | `370dcbf39901dd825c2dff9c9436e7b28eb3037c0dc86e159eb1573b5bfff23c` |
| 2015 | 412 | `c03d8c59e48ca53073a948fe39b49475bc8aee6cb88ae7cde14a9d8fdb92a231` |
| 2016 | 423 | `507ef19969222b1f332bcdf22293883bc274df327b2081e450ecafd1bc0f0dd0` |
| 2017 | 423 | `e73bab983c6d5d5b11861c56acc9dea4b9d314db4b2fe3660a063debdd9520b0` |

Each segment resolves to the exact accepted `ordered_player_id_position` array inside `.ai/work_helper/WR069_RETAINED_DERIVED_EVIDENCE.json` SHA-256 `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`, then deterministically injects target season, `gsis_id`, and this cohort version.

### 2018–2025 historical keys

The remaining **3,508** identities are frozen from `.ai/research/generated/WR034_EVENT_ROWS.csv` at Git blob `c1e013a2f9054eee1a36a70aaee80dedd46b9957`. WR-059 consumes only `target_season`, `player_id`, and `position`; no prediction, target, evaluation, or outcome fields are consumed.

Per-target counts:

- 2018: 419
- 2019: 444
- 2020: 437
- 2021: 435
- 2022: 475
- 2023: 446
- 2024: 421
- 2025: 431

The prior exact deterministic identity transform established **3,508 unique keys / 0 duplicates**. The new artifact retains that exact key set and injects the new cohort version deterministically.

## Coverage and duplicate proof

- expected keys: **5,176**
- actual keys represented by exact deterministic expansion: **5,176**
- 2014–2017: **1,668**
- 2018–2025: **3,508**
- duplicate count: **0**
- full declared key coverage: **true**

Duplicates are fatal. WR-069 inventories are unique within their target seasons; the WR034 historical inventory was previously verified unique; and keys from different target seasons cannot collide because `target_season` is the first stable-key field.

Every target-season segment binds to the exact admitted Y-1 stats `source_instance_id`.

## Source eligibility

Included rows are `ELIGIBLE_RETURNER` because an exact prior-season regular-season QB/RB/WR/TE source row exists. Exclusion is source-derived only; target-season participation is never required.

`players.csv` is available only for later separately governed metadata features and is not used for historical membership. `draft_picks.csv` remains excluded by WR-057.

## Boundaries

This is a no-scoring evidence checkpoint. No 2026 regular-season outcome table, target/outcome join, model fitting, scoring, tuning, comparison, evaluation, prediction, ranking, production, provider mutation, upstream reacquisition, or Phase-6 work occurred.
