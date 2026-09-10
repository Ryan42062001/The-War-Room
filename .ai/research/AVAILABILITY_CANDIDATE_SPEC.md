# WR-034 Exact Candidate / Feature Specification

Status: FROZEN PRE-SCORING — EXPERIMENTAL / NON-PRODUCTION
Task: WR-034

This file operationalizes the already-frozen protocol without changing its gates.

## Cohort implementation

Use `wr025_historical_ranking_signals.build_returners` unchanged. Every returned row is eligible for expected-games fitting, including rows with `target_games == 0`. A fitted expected-games candidate requires at least 25 earlier training rows for that position.

Schedule bounds are constants: 16 for seasons <=2020 and 17 for seasons >=2021.

## Feature extraction

`FULL_WR025` is exactly `wr025_historical_ranking_signals.FEATURES` in its committed order.

`MINIMAL_AVAILABILITY` selects these names from that exact vector, preserving order:
`prev1_games, prev2_games, games_delta, has_prev2, age_sep1, age_missing, experience_years, log_draft_pick, draft_round, drafted`.

No extra feature is derived from target-season data.

## Candidate fitting

Each target season and position is fit only on rows with an earlier target season.

- RIDGE_MINIMAL: `make_pipeline(StandardScaler(), Ridge(alpha=100.0))`.
- RIDGE_FULL: `make_pipeline(StandardScaler(), Ridge(alpha=100.0))`.
- POISSON_MINIMAL: `make_pipeline(StandardScaler(), PoissonRegressor(alpha=1.0, max_iter=2000))`.
- MULTINOMIAL_HURDLE: classes LOW=0–8, MID=9–13, HIGH=14+; `make_pipeline(StandardScaler(), LogisticRegression(C=0.25, solver='lbfgs', max_iter=2000, random_state=34034))`. Expected games is the sum of class probability times the earlier-training-row arithmetic mean games within that class for the same position.

All point predictions are clipped to `[0, target_season_max_games]`. No hyperparameter selection occurs.

## Baselines

- PREV_RATE uses the prior season's recorded games divided by prior-season schedule length and multiplied by target-season schedule length, then clipped.
- PREV_GAMES is prior-season recorded games clipped to target maximum.
- POSITION_MEAN is the arithmetic mean target games from earlier target seasons for the same position, clipped.

PREV_RATE is the primary comparator.

## Event models

For each of LOW_AVAILABILITY (`<=8`) and HIGH_AVAILABILITY (`>=14`):
- PREVALENCE is the earlier-training-row event rate for the position;
- LOGIT_MINIMAL uses MINIMAL_AVAILABILITY;
- LOGIT_FULL uses FULL_WR025;
- both learned event models use `make_pipeline(StandardScaler(), LogisticRegression(C=0.25, solver='liblinear', max_iter=2000, random_state=34034))` with no class weighting.

A learned event model requires both classes in training. Log-loss probabilities are numerically clipped to `[1e-6, 1-1e-6]` only for evaluation.

## Interval implementation

For each expected-games candidate, calculate in-sample residuals on the earlier training set using that fold's fitted model. The 10th and 90th residual quantiles for that position/candidate are added to each target prediction, then endpoints are clipped to the target-season schedule range. Report empirical coverage and width. These are empirical historical prediction intervals, not injury intervals.

## Reliability / inversion rule

Reliability bins use probability quintiles when at least five distinct probability values exist; otherwise use unique probability ordering as available.

For the warning adoption gate, **gross reliability inversion** means the observed event rate in the highest predicted-probability quartile is lower than the observed event rate in the lowest predicted-probability quartile on pooled 2022–2025 confirmation rows. Such inversion fails the warning gate.

## Bootstrap

Repeated-player bootstrap samples unique player IDs with replacement. Every sampled player contributes all of that player's rows within the evaluated split. For each replicate calculate mean absolute-error difference `candidate - PREV_RATE`. Use 5,000 replicates and seed 34035. Report point estimate and 2.5/97.5 percentiles.

## Candidate selection order

Apply the protocol's development gates to 2018–2021 only. If multiple pass, choose the lowest development pooled MAE; if MAEs are within 0.01 games, prefer in order RIDGE_MINIMAL, POISSON_MINIMAL, RIDGE_FULL, MULTINOMIAL_HURDLE.

Only the development-selected candidate may be evaluated for final adoption on the frozen 2022–2025 confirmation gates. Confirmation cannot rescue a development failure.

## Sensitivity

If a learned expected-games model is selected on development, run confirmation-only sensitivity by replacing each selected optional numeric input family with its training-position mean and by adding/subtracting 0.5 training-position standard deviations one feature at a time; summarize maximum MAE change. If no learned model is development-selected, this sensitivity is explicitly `NOT_APPLICABLE` and fallback behavior is still tested.
