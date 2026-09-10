# WR-034 Availability / Expected-Games Research Protocol

Status: FROZEN PRE-SCORING LOCK — EXPERIMENTAL / NON-PRODUCTION
Task: WR-034
Frozen before candidate scoring: 2026-09-10
Assignment/base SHA: `f079220e8ed07280d08f13c5db006661728d7f35`

## Safety boundary

This research is historical-only and does not change production rankings, WR-D001, or the frozen WR-033 expected-PPR/game specification. It must not request, inspect, download, score, summarize, or use 2026 regular-season outcomes. The frozen WR-021 2026 snapshot, WR-023 protocol, and WR-023 manifest are read-only integrity sentinels.

The target is **recorded regular-season games**, not medical injury. Missed games may reflect injury, suspension, role loss, benching, transactions, retirement, or other causes.

## Cohort and targets

Reuse the WR-025/WR-033 returning-player boundary: QB/RB/WR/TE players with a valid prior-season regular-season row. Rookies remain separate.

Historical statistical seasons loaded: 2012–2025 only. Target seasons constructed: 2014–2025. Primary scored folds: 2018–2025, rolling-origin by position.

Primary target: `target_games`, including zero-game returners when no target-season player-summary row exists. Valid upper bound is the scheduled NFL regular-season length for the target season: 16 games through 2020 and 17 games from 2021 onward.

Predeclared availability events:
- `LOW_AVAILABILITY`: target games <= 8, matching WR-027;
- `HIGH_AVAILABILITY`: target games >= 14, a descriptive near-full-season event.

## Development and confirmation split

All fits are rolling-origin: a target season may use only earlier target seasons for fitted parameters.

- development decision folds: 2018–2021;
- within-task confirmation folds: 2022–2025.

Candidate selection is frozen from development evidence only. Confirmation folds may confirm or reject a development-selected candidate but may not rescue a candidate that failed development.

## Preseason feature cutoff

Predictors for target season Y are limited to completed Y-1/Y-2 regular-season information and immutable metadata already admitted by WR-025/WR-029. No target-Y Week 1+ predictor is permitted. Historical research cutoff remains September 1 12:00 UTC of target season.

## Rights-clean source set

No new medical, injury, roster, transaction, suspension, depth-chart, staff, ESPN rank/ADP, PFR, PFF, NGS/NFL Pro, or mutable current-status source is admitted.

Reuse only:
- nflverse Player Summary Stats historical assets already locked by WR-025;
- nflverse Players stable/immutable identity metadata already locked by WR-025;
- nflverse Draft Picks immutable/draft-time metadata already locked by WR-025.

Every downloaded asset must reproduce the exact SHA-256 recorded in `.ai/research/generated/HISTORICAL_RANKING_ASSET_MANIFEST.json`; mismatch fails closed.

## Transparent baselines

Primary deterministic baseline:
`PREV_RATE = prev1_games / prior_season_max_games * target_season_max_games`, clipped to [0, target_season_max_games].

Secondary deterministic baseline:
`PREV_GAMES = prev1_games`, clipped to the target-season bound.

Training-only position baseline:
mean target games among earlier target seasons for the same position, clipped to the target-season bound.

No baseline is chosen post hoc from confirmation outcomes.

## Frozen feature sets

### MINIMAL_AVAILABILITY
- prev1_games
- prev2_games
- games_delta
- has_prev2
- age_sep1
- age_missing
- experience_years
- log_draft_pick
- draft_round
- drafted

### FULL_WR025
The exact frozen WR-025 returner feature matrix, unchanged. These are all completed prior-season/prior-two-season or immutable inputs. This task does not change the WR-033 expected-PPR/game model; it only tests whether the same historical information predicts recorded games.

## Frozen expected-games candidates

All models fit separately by position on earlier seasons only.

1. `RIDGE_MINIMAL`: `StandardScaler -> Ridge(alpha=100.0)` on MINIMAL_AVAILABILITY; prediction clipped to valid target-season games.
2. `RIDGE_FULL`: `StandardScaler -> Ridge(alpha=100.0)` on FULL_WR025; prediction clipped.
3. `POISSON_MINIMAL`: `StandardScaler -> PoissonRegressor(alpha=1.0, max_iter=2000)` on MINIMAL_AVAILABILITY; prediction clipped.
4. `MULTINOMIAL_HURDLE`: `StandardScaler -> LogisticRegression(C=0.25, solver='lbfgs', max_iter=2000, random_state=34034)` predicting LOW (0–8), MID (9–13), HIGH (14+). Expected games equals class probability weighted by training-only class mean games for the same position. If a class is absent in training, candidate fails closed for that fold.

No hyperparameter search is permitted.

## Frozen event-probability candidates

For both LOW_AVAILABILITY and HIGH_AVAILABILITY, compare:
- training-position prevalence probability;
- `LOGIT_MINIMAL`: `StandardScaler -> LogisticRegression(C=0.25, solver='liblinear', max_iter=2000, random_state=34034)` on MINIMAL_AVAILABILITY;
- `LOGIT_FULL`: same model on FULL_WR025.

No class weighting is used because probability calibration is a primary objective. Probabilities are clipped only numerically to [1e-6, 1-1e-6] for log loss.

## Predictive interval candidate

For each direct expected-games candidate, construct an 80% residual interval using the 10th and 90th percentiles of **training-only** residuals for that position/candidate. Add residual quantiles to the point prediction and clip to the target-season game bound. Report empirical coverage and mean width. This is an empirical predictive interval, not a medical risk interval.

## Metrics

Expected games, pooled and by position/season where estimable:
- MAE;
- RMSE;
- mean bias (`prediction - actual`);
- Spearman as secondary diagnostic;
- calibration by predicted-game bins `[0,8]`, `(8,11]`, `(11,14]`, `(14,max]`.

Availability events:
- prevalence;
- Brier score and Brier skill versus training-position prevalence;
- ROC AUC;
- PR AUC;
- log loss;
- reliability bins by probability quintile where sample permits;
- event rate in probability quartiles.

Uncertainty:
- 80% interval empirical coverage;
- mean interval width;
- by-position coverage.

Robustness:
- 5,000 repeated-player cluster bootstrap replicates, seed 34035, for candidate-minus-PREV_RATE MAE;
- season-to-season MAE delta stability;
- source/feature coverage and missingness;
- selected-model optional-input omission and +/-0.5 training-SD numeric perturbation sensitivity if a learned model is selected;
- deterministic fallback test.

## Missing-data rules

The WR-025 feature builder's existing explicit history and age-missing indicators remain authoritative. Numeric missing values in that frozen matrix retain the WR-025 construction behavior. No missing availability-specific context is silently converted into an observed injury/status value because no such source is admitted.

A learned candidate requires >=25 active training rows for fitting. Event logistic candidates additionally require both event classes. Candidate failure on a fold falls back to PREV_RATE and is recorded.

## Adoption gates

A learned expected-games candidate is development-selected only if all are true on 2018–2021 pooled development folds:
1. MAE improves versus PREV_RATE by at least 1.0%;
2. RMSE does not worsen by more than 1.0%;
3. no position with >=30 scored rows has MAE regression >5.0%;
4. mean season-level MAE delta is <=0;
5. 95% repeated-player cluster-bootstrap CI upper bound for candidate-minus-PREV_RATE MAE is <0;
6. no integrity/source/coverage failure occurred.

If multiple candidates pass, choose lowest pooled development MAE; ties within 0.01 games prefer simpler order: RIDGE_MINIMAL, POISSON_MINIMAL, RIDGE_FULL, MULTINOMIAL_HURDLE.

A development-selected candidate is `EXPECTED-GAMES MODEL SUPPORTED` only if on 2022–2025 confirmation it also:
1. improves pooled MAE versus PREV_RATE by >=0.5%;
2. has candidate-minus-PREV_RATE cluster-bootstrap CI upper bound <=0;
3. has no position with >=30 rows regressing MAE >5%;
4. preserves 80% interval coverage between 72% and 88% if an interval is proposed.

Otherwise primary disposition is `BASELINE / WARNING-ONLY RETAINED` if PREV_RATE plus an event model provides defensible calibrated warning information, or `INSUFFICIENT EVIDENCE` if even that evidence is unstable. Rights/PIT/source failure yields `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE`.

An event model may be recommended as warning output only if confirmation Brier skill is positive pooled, no position with >=30 rows has Brier skill below -5%, and reliability does not show gross inversion. It does not alter player ordering.

## Fallback

Expected-games fallback is always deterministic `PREV_RATE`, requiring only the admitted prior-season games field and schedule-length constant. If that prior-season field is unavailable, fallback is the training-only position mean and must be flagged.

Warning-probability fallback is training-position prevalence and must be flagged.

## Downstream boundary

A Phase-5 interface diagnostic may multiply a selected expected-games estimate by the frozen WR-033 expected-PPR/game output, but downstream season-total performance cannot select or tune WR-034. No WR-033 feature, weight, model, or ordering may change.

## Reproducibility

Fixed seeds:
- model seed: 34034;
- bootstrap seed: 34035.

Pinned research runtime must record Python and dependency versions. Guarded execution must hash WR-021/WR-023 frozen artifacts before and after scoring, verify historical source hashes, and explicitly record `max_stats_season_loaded <= 2025` and `outcomes_2026_inspected = false`.

Protocol changes after candidate results are visible are forbidden except a documented fail-closed correction made before affected scoring and shown not to be result-driven.
