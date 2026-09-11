# WR-035 Season-Total Composition / Distribution Protocol

Status: `FROZEN_PRE_SCORING_LOCK`

This protocol is frozen before any WR-035 season-total candidate is scored. It is research-only and cannot change production, WR-033, WR-034, WR-021, WR-023, or WR-D001.

## Cohort, target, and chronology

- Population: returning QB/RB/WR/TE rows constructible from target-season Y-1 information by the frozen WR-025/WR-033 feature builder. Rookies are excluded.
- Target: realized NFL regular-season full-PPR points in target season Y, using nflverse `fantasy_points_ppr`. A player present in Y-1 but absent from Y receives 0 games and 0 season points. Active-game PPR is undefined for that row.
- Data ceiling: 2025. No 2026 regular-season file, outcome, summary, or derived artifact may be requested or read.
- Rolling folds: target seasons 2018-2021 are development; 2022-2025 are locked confirmation. Every fitted quantity for Y uses rows with target season `< Y` only.
- Maximum scheduled games: 16 through 2020 and 17 from 2021. Prior-season schedule adjustment scales prior games or total by `target_max_games / prior_max_games`.
- Target-season Week 1+ predictors are prohibited.

## Frozen upstream replay

- WR-033: position-specific `StandardScaler -> Ridge(alpha=100)` on the exact WR-025 returning-player feature vector and active target rows, trained only on seasons before Y. It predicts active-game PPR for every Y returner; prediction is clipped at zero only inside draw composition, not for the central raw product.
- WR-034: accepted position-specific `RIDGE_FULL`, with its exact stats-only feature vector, scaling, alpha, rolling training, and `[0, target_max_games]` clipping. If unavailable, use schedule-adjusted `PREV_RATE`; if that is unavailable, the training-position mean, always with an explicit fallback flag.
- Neither upstream model, feature, preprocessing rule, training row rule, or hyperparameter may be retuned.
- Replayed scored-row keys and WR-034 predictions must match committed WR-034 rows within `1e-10`; frozen constants/features are asserted in code.

## Central candidates and baselines

For player i:

1. `INDEPENDENT_PRODUCT`: `mu_ppr_i * mu_games_i`.
2. `PAIRED_RESIDUAL_MEAN`: mean of the deterministic paired-residual draws defined below. This is the sole dependence-aware challenger.
3. `WR033_X_PREV_RATE`: `mu_ppr_i * schedule_adjusted_prior_games_i`.
4. `PRIOR_TOTAL_SCHEDULE_ADJUSTED`: prior-season PPR total multiplied by the schedule ratio.
5. `POSITION_MEAN_TOTAL`: mean realized season total among earlier rows at the same position.

No candidate may use ADP/ECR, league scarcity, replacement value, FLEX, draft state, or recommendation signals.

## Residual distributions

For each earlier rolling prediction j at the same position:

- games residual `e_gj = actual_games_j - mu_games_j`;
- performance residual `e_pj = actual_active_ppr_j - mu_ppr_j` when games > 0;
- for a zero-game observation, `e_pj = 0` and its games residual remains in the paired library. The performance residual is operationally irrelevant whenever a composed games draw clips to zero; the zero assignment is a conservative, explicit latent-performance convention.

For target i and residual index j:

`draw_ij = max(0, mu_ppr_i + e_pj) * clip(mu_games_i + e_gj, 0, target_max_games_i)`.

- `PAIRED_RESIDUAL_DRAWS` samples the same historical row index for both residuals and preserves empirical dependence.
- `INDEPENDENT_RESIDUAL_DRAWS` independently permutes performance and games residual indices and represents the independence distribution comparator.
- Libraries contain only prior rolling-origin out-of-sample residuals from seasons before Y. If fewer than 25 position residual pairs exist, use same-position in-sample training residuals and flag `TRAINING_RESIDUAL_FALLBACK`; if that also has fewer than 25 rows, use pooled-position prior OOS residuals; otherwise emit central only and flag `DISTRIBUTION_UNAVAILABLE`.
- Draw count: 2,001 per player per method. Seed: `35035 + 100*target_season + 10*position_index + method_index`, with positions QB/RB/WR/TE indexed 0-3 and paired/independent indexed 0/1. Sampling is with replacement and stable input sorting by `(target_season, position, player_id)`.
- Report draw mean, p10, p25, p50, p75, p90, and the central 80% interval. Draws are an empirical predictive approximation, not a medical or injury model.

## Metrics and frozen diagnostics

Central metrics: MAE, RMSE, signed prediction-minus-actual bias, Spearman, within-position rank MAE, top-N overlap (QB12/RB24/WR36/TE12, capped at cohort size), calibration by prediction quartile, and catastrophic over/under rates at fixed 100-point absolute directional error.

Distribution metrics: 80% coverage, mean interval width, interval score at 80%, sample CRPS, p10 lower-tail exceedance, p90 upper-tail exceedance, and within-position actual-rank coverage by draw-derived 80% rank interval. Report pooled, position, season, fallback state, and value tier when sample size is at least 20; otherwise mark descriptive-only.

Repeated-player-aware comparison: 5,000 deterministic cluster-bootstrap replicates, resampling stable player IDs with replacement and retaining all their seasons. Seed `35036`. Primary contrast is challenger minus independence for MAE, RMSE, and interval score.

High-value applicability is predeclared using preseason-known prior active-game PPR. Within each target-season/position cohort, Q4 is at or above the training-free cohort 75th percentile and D10 is at or above its 90th percentile. Report Q4 and D10 central/distribution metrics, plus WR Q4 separately. These diagnostics cannot override the pooled selection gates.

## Selection gates

Development selects the paired challenger only if all are true versus `INDEPENDENT_PRODUCT`:

- pooled MAE improves by at least 1%;
- pooled RMSE does not worsen by more than 1%;
- absolute bias does not worsen by more than 5 points;
- at least three of four positions have non-negative MAE improvement;
- catastrophic over-prediction does not worsen by more than 1 percentage point.

Confirmation supports the selected paired challenger only if its MAE improvement is at least 1%, its player-cluster-bootstrap 95% CI for MAE difference has upper bound below zero, and no position with at least 100 rows worsens MAE by more than 3%. Otherwise prefer the simpler independence product.

Independence central support requires confirmation MAE no worse than both `WR033_X_PREV_RATE` and `PRIOR_TOTAL_SCHEDULE_ADJUSTED`, and improvement over at least one by 2% or more. If not, retain the best transparent baseline.

A distribution is promoted separately only if confirmation 80% coverage is 0.75-0.85 pooled, every position with at least 100 rows is 0.70-0.90, p10 and p90 tail rates are each 0.05-0.15, and interval score beats or equals the independent residual distribution. A failed distribution gate cannot invalidate an otherwise supported central estimate; disposition becomes `CENTRAL TOTAL SUPPORTED / DISTRIBUTION INSUFFICIENT`.

## Integrity and reproducibility

- Inputs are the locked nflverse historical assets and committed WR-034 historical rows/provenance; every input is hashed.
- Missing keys, duplicate row keys, upstream replay mismatch, protocol/hash mismatch, or any detected 2026 outcome input fails closed before scoring.
- Generated output timestamps are excluded from equality checks. A second run must reproduce every substantive CSV/JSON byte-for-byte.
- Frozen WR-021/WR-023 artifact hashes are captured before and after execution and must match.

