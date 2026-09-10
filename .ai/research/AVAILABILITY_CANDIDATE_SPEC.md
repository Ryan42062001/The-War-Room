# WR-034 Exact Candidate / Feature Specification

Status: FROZEN PRE-SCORING — EXPERIMENTAL / NON-PRODUCTION
Task: WR-034
Correction record: `.ai/research/AVAILABILITY_PRE_SCORING_SOURCE_CORRECTION.md`

This file operationalizes the corrected frozen protocol. Model families, hyperparameters, folds, gates and seeds are unchanged from the original pre-scoring lock.

## Cohort implementation
Use `wr025_historical_ranking_signals.build_returners(by_season, {}, {})`. Cohort membership is defined from locked historical Player Summary Stats; empty metadata dictionaries only populate excluded metadata feature slots with defaults. Every returner row, including `target_games == 0`, is eligible for expected-games fitting. A learned candidate requires at least 25 earlier training rows for that position.

Schedule bounds: 16 games through 2020 and 17 games from 2021 onward.

## Feature extraction
`MINIMAL_AVAILABILITY`, preserving WR-025 vector order:
`prev1_games, prev2_games, games_delta, has_prev2`.

`FULL_STATS_AVAILABILITY` is exact `wr025_historical_ranking_signals.FEATURES` excluding metadata-dependent:
`age_sep1, age_missing, experience_years, log_draft_pick, draft_round, drafted`.

The remaining vector is derived from locked historical Player Summary Stats and prior-history construction only. No target-season predictor is added.

## Candidate fitting
Each target season/position fits only on rows with an earlier target season.

- RIDGE_MINIMAL: `make_pipeline(StandardScaler(), Ridge(alpha=100.0))` on MINIMAL_AVAILABILITY.
- RIDGE_FULL: same on FULL_STATS_AVAILABILITY.
- POISSON_MINIMAL: `make_pipeline(StandardScaler(), PoissonRegressor(alpha=1.0, max_iter=2000))` on MINIMAL_AVAILABILITY.
- MULTINOMIAL_HURDLE: classes LOW=0–8, MID=9–13, HIGH=14+; `make_pipeline(StandardScaler(), LogisticRegression(C=0.25, solver='lbfgs', max_iter=2000, random_state=34034))`. Expected games is class probability weighted by earlier-training arithmetic mean games in each class. All three classes are required.

All point predictions clip to `[0, target_season_max_games]`. No hyperparameter search occurs.

## Baselines
- PREV_RATE = prior recorded games / prior schedule length × target schedule length, clipped.
- PREV_GAMES = prior recorded games clipped to target maximum.
- POSITION_MEAN = earlier-target-season position arithmetic mean, clipped.

PREV_RATE is the primary comparator.

## Event models
For LOW_AVAILABILITY (`<=8`) and HIGH_AVAILABILITY (`>=14`):
- PREVALENCE = earlier-training event rate by position;
- LOGIT_MINIMAL uses MINIMAL_AVAILABILITY;
- LOGIT_FULL uses FULL_STATS_AVAILABILITY;
- learned event models use `StandardScaler -> LogisticRegression(C=0.25, solver='liblinear', max_iter=2000, random_state=34034)` with no class weighting.

Both classes are required. Probabilities are clipped only numerically to `[1e-6,1-1e-6]` for log loss.

## Predictive intervals
For each learned expected-games candidate, calculate in-sample residuals on that fold's earlier training rows; add 10th/90th residual quantiles to target predictions and clip endpoints to the target schedule range. These are empirical historical prediction intervals, not injury intervals.

## Reliability / gross inversion
Reliability bins use probability quintiles when possible. Gross inversion means pooled 2022–2025 observed event rate in the highest predicted-probability quartile is below the lowest predicted-probability quartile. Such inversion fails warning promotion.

## Bootstrap
Sample unique player IDs with replacement; each sampled player contributes all rows in the evaluated split. Calculate mean absolute-error difference `candidate - PREV_RATE`. Use 5,000 replicates, seed 34035, and report point estimate plus 2.5/97.5 percentiles.

## Selection
Apply frozen development gates to 2018–2021 only. If multiple pass, choose lowest development MAE; within 0.01 games prefer RIDGE_MINIMAL, POISSON_MINIMAL, RIDGE_FULL, MULTINOMIAL_HURDLE. Only that selected candidate receives final adoption evaluation on 2022–2025. Confirmation cannot rescue a development failure.

## Sensitivity
If a learned model is development-selected, run confirmation-only one-feature-at-a-time training-mean omission and +/-0.5 training-SD perturbations across its actual corrected feature matrix and summarize maximum MAE change. If none is selected, mark sensitivity `NOT_APPLICABLE`; fallback still must be tested.
