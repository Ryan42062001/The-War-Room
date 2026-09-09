# WR-023 — 2026 Prospective Shadow Evaluation Protocol

Task: WR-023 — 2026 Prospective Shadow Evaluation Protocol Freeze  
Role: Research & Development (R&D)  
Classification: RESEARCH ONLY / PRE-REGISTERED PROSPECTIVE VALIDATION  
Starting canonical main: `8e51bc08c0ac70370f49943ac78fda481d7e77e7`  
Production authorization: NONE

## Freeze boundary

This file is the prospective pre-registration. Its first committed version on branch `wr-023-prospective-protocol-freeze` is the protocol freeze boundary. The commit timestamp, commit SHA, Git blob SHA and SHA-256 of this exact file are recorded in `.ai/research/generated/WR023_PROTOCOL_MANIFEST.json` after the freeze.

**No 2026 regular-season outcome source may be queried, inspected, downloaded, scored, summarized, or used to revise this protocol before this file is committed and hashed.**

After this freeze, later evaluators may append outcome evidence in new files, but they may not rewrite this protocol, alter the WR-021 frozen snapshot, change prediction values, change the cohort, change the primary metrics, change thresholds, or reinterpret the decisive gate after seeing results. Any unavoidable protocol correction requires a new Manager-authorized task and must be treated as a new protocol version rather than silently replacing this one.

## Immutable WR-021 evaluation artifact

Authoritative frozen prediction file:

`.ai/research/generated/CONTEXT_SHADOW_2026_SNAPSHOT.csv`

WR-021 freeze time:
`2026-09-09T16:22:20.858306+00:00`

Expected frozen coverage:
- 523 total QB/RB/WR/TE rows
- 444 returning players
- 79 drafted rookies
- one 2026 drafted QB/RB/WR/TE without a deterministic GSIS join remained outside the frozen snapshot
- UDFAs/no-prior-history players were outside the WR-021 frozen universe because no defensible historical preseason roster-as-of source was admitted

The exact snapshot SHA-256 and Git blob SHA are recorded in `WR023_PROTOCOL_MANIFEST.json` after this protocol commit.

### Immutable columns used by WR-023

The snapshot must contain and WR-023 must use the frozen values of:
- `player_id`
- `player_name`
- `position`
- `rookie`
- `baseline_ppr_pg`
- `ridge_ppr_pg`
- `boost_ppr_pg`
- `baseline_games`
- `ridge_games`
- `boost_games`

Draft/age/context columns may be retained for provenance but are not recalculated or used to alter the prospective predictions.

### Universe invariants

1. No player may be added because of 2026 performance, emergence, roster status, injury, waiver activity, or fantasy relevance.
2. No frozen player may be removed because of retirement, cut, suspension, injury, zero games, low usage, position change, or poor performance.
3. `rookie` and `position` come from the frozen snapshot and are not replaced by 2026 roster/status/position data.
4. Player matching to outcomes is deterministic on frozen `player_id` / GSIS ID only. No name-based rescue matching is permitted in the primary evaluation.
5. A frozen player with no 2026 outcome row remains in the universe with 0 recorded games and 0 season PPR for availability/season-total metrics.
6. A frozen player with 0 recorded games is not eligible for PPR/game performance metrics because the target is undefined, but this does not remove the player from the frozen cohort.

## Primary prospective hypothesis

The primary hypothesis applies to **RETURNING PLAYERS ONLY**:

> On final 2026 regular-season outcomes, the frozen WR-021 Ridge PPR/game prediction (`ridge_ppr_pg`) outperforms the frozen previous-season PPR/game baseline (`baseline_ppr_pg`) for returning players who record at least one 2026 regular-season game.

The frozen Ridge model is the sole primary challenger. Gradient Boosting is secondary/diagnostic and cannot satisfy the primary gate if Ridge fails.

### Rookie hypothesis status

Rookies are **not** part of the primary prospective hypothesis because WR-021 historically found Ridge rookie PPR/game MAE worse than the transparent rookie baseline.

Rookie results must be reported separately as diagnostics:
- transparent frozen rookie `baseline_ppr_pg` is the primary rookie comparator;
- frozen `ridge_ppr_pg` and `boost_ppr_pg` may be reported;
- rookie results cannot rescue a failed returning-player gate and cannot by themselves justify production consideration.

## Rights-clean 2026 outcome source — predeclared before scoring

Primary and only planned outcome source family:
- repository: `nflverse/nflverse-data`
- release tag/family: `stats_player` / Player Summary Stats
- intended asset: `stats_player_regpost_2026.csv`
- license basis: the same nflverse data family / CC BY 4.0 source admitted and accepted in WR-021

WR-023 does not query the 2026 asset before this protocol freeze. At each later scoring checkpoint, the evaluator must record the GitHub release ID, asset ID, asset `updated_at`, download URL and independently calculated SHA-256 **before** calculating metrics.

### Required outcome fields and semantics

The later evaluator must require these fields from the admitted 2026 Player Summary Stats asset:
- `player_id` — GSIS player ID used for deterministic join to frozen `player_id`
- `season_type` — must identify regular-season rows as `REG`
- `games` — recorded games denominator
- `fantasy_points_ppr` — Full-PPR fantasy points
- `season` if present — must equal 2026 for scored rows

The source `position`, team, roster status, injury information, depth role and any other mutable 2026 context are **not** permitted to redefine cohort membership, frozen position, predictions or eligibility beyond the recorded-games rule below.

### Deterministic outcome aggregation

For a later checkpoint:

1. Load the exact hashed `stats_player_regpost_2026.csv` asset.
2. If `season` is present, require `season == 2026` for scored rows.
3. Filter to `season_type` case-insensitively equal to `REG`. Postseason rows are excluded.
4. Normalize `player_id` to string and join only by exact GSIS ID to the 523-row frozen snapshot.
5. For each GSIS ID, aggregate regular-season rows as:
   - `actual_games = max(non-null games)`;
   - `actual_season_ppr = sum(fantasy_points_ppr)` over the retained regular-season rows;
   - if `actual_games >= 1`, `actual_ppr_pg = actual_season_ppr / actual_games`.
6. If a frozen GSIS ID has no retained source row, set `actual_games = 0` and `actual_season_ppr = 0`; `actual_ppr_pg` is undefined and excluded from per-game performance metrics.
7. Fail closed rather than score if the source lacks a required field, regular-season filtering cannot be established, a non-null games value is negative, or the source produces an internally contradictory state such as positive fantasy points with zero recorded games.

No later injury/depth/roster information may be substituted into the frozen predictions.

## Metric populations

### Primary returning-player performance population

Frozen rows where:
- `rookie == False`; and
- `actual_games >= 1` at the checkpoint.

This recorded-game eligibility is an outcome-definition rule fixed before scoring, not a post-hoc cohort selection rule.

### Rookie diagnostic performance population

Frozen rows where:
- `rookie == True`; and
- `actual_games >= 1`.

### Availability and season-total population

All 523 frozen rows, including zero-game players. Results must also be broken out into returners and rookies separately.

## Primary metrics — exact definitions

For each primary returning player `i`:
- actual: `y_i = actual_ppr_pg`
- baseline prediction: `b_i = baseline_ppr_pg`
- Ridge prediction: `r_i = ridge_ppr_pg`
- paired MAE difference contribution: `d_i = |r_i - y_i| - |b_i - y_i|`

### Pooled MAE

`baseline_MAE = mean(|b_i - y_i|)`  
`ridge_MAE = mean(|r_i - y_i|)`

Primary MAE improvement percentage:

`100 * (baseline_MAE - ridge_MAE) / baseline_MAE`

No weighting by games, position, draft capital, fantasy rank, team or player importance is permitted.

### RMSE

Reported as a secondary companion metric using the same primary population:

`sqrt(mean((prediction_i - y_i)^2))`

### Spearman

Compute ordinary pooled Spearman rank correlation between predictions and actual PPR/game on the primary returning-player performance population. Standard average-rank handling for ties is permitted. Report baseline and Ridge values and the Ridge-minus-baseline difference.

If Spearman is undefined because a vector is constant or the population is otherwise insufficient, the primary gate cannot pass and the final classification must be `MORE EVIDENCE NEEDED`.

## Paired player bootstrap — predeclared exactly

Because 2026 has one final outcome row per frozen player after aggregation, the prospective uncertainty unit is the player.

For the final primary returning-player performance population:
- bootstrap unit: unique frozen `player_id`;
- sampling: sample `N` players with replacement from the `N` eligible returning players;
- retain the paired actual, frozen baseline and frozen Ridge values for each sampled player;
- statistic per replicate: mean of `d_i = |r_i-y_i| - |b_i-y_i|`;
- replicates: **10,000**;
- deterministic RNG seed: **23023**;
- interval: ordinary percentile 95% interval using the 2.5th and 97.5th percentiles of the 10,000 replicate means.

The decisive uncertainty condition uses the **upper** 97.5th-percentile bound and requires it to be strictly `< 0.0`.

No alternate bootstrap seed, bootstrap unit, confidence level, one-sided interval, BCa interval, trimming, winsorization or outlier exclusion may replace this predeclared primary uncertainty result after outcomes are seen. Sensitivity analyses may be added only as clearly secondary evidence.

## Position-level primary stability

Use frozen snapshot `position` values only: QB, RB, WR, TE.

For each position among active returning players:
- calculate baseline MAE and Ridge MAE with the same unweighted definition;
- `non_worse = ridge_MAE <= baseline_MAE`;
- relative regression = `(ridge_MAE - baseline_MAE) / baseline_MAE`.

The final gate requires:
- at least 3 of the 4 positions to be non-worse; and
- every position relative regression to be `<= 0.05`.

If any of the four positions has no eligible returning player at final evaluation or has an undefined baseline MAE, the position gate cannot be established and the final classification is `MORE EVIDENCE NEEDED` rather than treating the missing position as a pass.

## Rank metrics — secondary only

Rank metrics use active players with defined PPR/game outcomes and preserve frozen positions.

For deterministic ordering:
- sort descending by actual or predicted PPR/game as appropriate;
- break exact value ties by `player_id` ascending.

### Rank MAE

Within each position, assign 1-based actual and predicted ranks to every eligible player and report mean absolute rank difference. Report returners separately from rookies.

### Fantasy-relevant top-N overlap

Frozen position thresholds inherited from WR-021:
- QB: 12
- RB: 24
- WR: 36
- TE: 12

For a population smaller than N, use `min(N, eligible_count)`. Compare predicted top-N player IDs with actual top-N player IDs and report overlap count and fraction.

These rank metrics cannot override the primary final evidence gate.

## Availability metric — secondary

Actual availability target for every frozen player:
- `actual_games` from the admitted outcome aggregation;
- no outcome row = 0 games.

Frozen predictions:
- baseline: `baseline_games`
- Ridge: `ridge_games`
- Boost: `boost_games`

Report unweighted games MAE for:
- all 523 frozen players;
- returners only;
- rookies only.

This is a recorded-games prediction, **not** a medical injury model and must not be described as one.

## Season-total PPR metric — secondary / experimental

Actual target:
- `actual_season_ppr` from admitted outcome aggregation;
- no outcome row = 0.

Frozen season-total predictions are derived without refitting:
- baseline = `baseline_ppr_pg * baseline_games`
- Ridge = `ridge_ppr_pg * ridge_games`
- Boost = `boost_ppr_pg * boost_games`

Use the frozen values as stored; do not re-estimate, re-clip or substitute actual games into predictions.

Report unweighted season-total PPR MAE for all players, returners and rookies separately. This remains secondary and cannot override the primary gate.

## Checkpoint policy

### Interim checkpoints — descriptive / non-decisive

Three interim checkpoint opportunities are predeclared:
1. after 2026 regular-season Week 4 is complete;
2. after Week 8 is complete;
3. after Week 13 is complete.

Each interim checkpoint, if executed, must:
- use the then-current admitted cumulative `stats_player_regpost_2026.csv` asset;
- record the exact asset metadata and SHA-256 before scoring;
- use this unchanged protocol and frozen snapshot;
- report the same primary/secondary metrics labeled `INTERIM — DESCRIPTIVE ONLY`;
- make **no** confirm/not-confirm classification;
- trigger **no** model refit, feature change, cohort change, threshold change, prediction change, early stopping or production proposal.

If an interim checkpoint is missed, it must be recorded as missed. A later cumulative asset may not be back-labeled as the missed historical checkpoint.

Interim evidence is not combined with the final result for the decisive bootstrap or gate.

### Final checkpoint — decisive

The only decisive prospective evaluation is after the **entire 2026 NFL regular season, through Week 18, is complete**.

Final scoring must use an admitted cumulative 2026 Player Summary Stats asset fetched only after the final regular-season game has completed and the nflverse asset has subsequently updated. Record source metadata and SHA-256 before metric calculation.

If the outcome source is incomplete, materially corrected while evaluation is in progress, or cannot be verified as covering the completed regular season, do not force a result; classify `MORE EVIDENCE NEEDED` and preserve the raw provenance for Manager review.

No postseason outcome is part of WR-023.

## Decisive final evidence gate — immutable

The final classification may be:

`PROSPECTIVE SIGNAL CONFIRMED — PRODUCTION MILESTONE MAY BE CONSIDERED`

**only if all five conditions below hold simultaneously at the final checkpoint:**

1. **MAE materiality:** pooled returning-player Ridge PPR/game MAE improves by at least **3.00%** versus the frozen `baseline_ppr_pg` baseline.
2. **Paired uncertainty:** the predeclared 10,000-replicate paired player-bootstrap 95% interval for `Ridge absolute error - baseline absolute error` has upper bound **strictly < 0.0**.
3. **Rank correlation:** pooled returning-player Ridge Spearman is not worse than baseline by more than **0.01**, i.e. `ridge_spearman - baseline_spearman >= -0.01`.
4. **Position stability:** at least **3 of 4** positions have Ridge MAE `<=` baseline MAE, and **no** position has Ridge MAE more than **5% worse** than its baseline.
5. **Integrity:** there is no snapshot/data contamination and no post-freeze model, prediction, cohort, protocol or gate change.

Secondary metrics, rookies, Gradient Boosting, availability, season totals, rank MAE or top-N overlap may explain the result but **cannot override any failed primary condition**.

### Final classification mapping

- If all five primary conditions are validly measurable and all pass: `PROSPECTIVE SIGNAL CONFIRMED — PRODUCTION MILESTONE MAY BE CONSIDERED`.
- If the final evaluation is valid and one or more measurable primary conditions fail: `PROSPECTIVE SIGNAL NOT CONFIRMED`.
- If final outcome completeness, identity joins, source integrity, protocol integrity or another material issue prevents a defensible final test: `MORE EVIDENCE NEEDED`.

Passing the gate does **not** authorize production. It authorizes only Manager consideration of a separate production milestone and its own architecture, implementation, QA and merge requirements.

## FantasyPros comparison boundary

No WR-023 prospective classification depends on FantasyPros.

Do not scrape, reconstruct, or manufacture historical/contemporaneous FantasyPros data for WR-023. Do not claim shadow-model superiority to FantasyPros unless the Manager separately authorizes a lawful, methodologically valid comparison.

Preserved production ranking reference remains the WR-021 freeze reference:
`4dbc0bf22d27296c3cd9b45fd90de637488ff001`.

WR-D001 remains active; FantasyPros production ranking authority is unchanged.

## Integrity manifest and later scoring provenance

`WR023_PROTOCOL_MANIFEST.json` must record SHA-256 plus Git blob identity for, at minimum:
- this protocol file;
- `.ai/research/generated/CONTEXT_SHADOW_2026_SNAPSHOT.csv`;
- `.ai/research/CONTEXT_SHADOW_SOURCE_MANIFEST.md`;
- `.ai/research/generated/CONTEXT_SHADOW_ASSET_MANIFEST.json`;
- `.ai/research/CONTEXT_SHADOW_EXPERIMENT.md`.

It must also record:
- protocol-freeze commit SHA and timestamp;
- starting canonical main SHA;
- expected 523/444/79 cohort counts;
- primary outcome source family and intended 2026 asset name;
- bootstrap configuration;
- final evidence-gate thresholds.

At every later scoring checkpoint, create a new append-only outcome provenance/result artifact containing the exact outcome asset hash and this frozen protocol hash. Do not update this manifest to hide or replace prior identities.

## Fail-closed integrity checks before later scoring

Before calculating any 2026 metric, a later evaluator must verify:
1. protocol SHA-256 equals the frozen manifest;
2. snapshot SHA-256 equals the frozen manifest;
3. WR-021 source/asset provenance hashes equal the frozen manifest;
4. snapshot row count is exactly 523;
5. snapshot returner count is exactly 444 and drafted-rookie count exactly 79;
6. frozen prediction columns contain no changes relative to the hashed snapshot;
7. outcome source metadata/hash is recorded before scoring.

Any mismatch must stop primary scoring and be reported to Manager. Do not repair the frozen snapshot in place.

## Production safety

WR-023 is research-only. It must not modify:
- production rankings or datasets;
- scoring or recommendations;
- tiers, VORP or board order;
- UI;
- ESPN sync;
- draft state or persistence;
- `.ai/shared/*`.

No WR-023 result is production authority.