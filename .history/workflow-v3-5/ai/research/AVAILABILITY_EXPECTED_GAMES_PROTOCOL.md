# WR-034 Availability / Expected-Games Research Protocol

Status: FROZEN PRE-SCORING LOCK — EXPERIMENTAL / NON-PRODUCTION
Task: WR-034
Assignment/base SHA: `f079220e8ed07280d08f13c5db006661728d7f35`
Pre-scoring source correction: `.ai/research/AVAILABILITY_PRE_SCORING_SOURCE_CORRECTION.md`

## Safety boundary
This research estimates **recorded regular-season games**, not medical injury. Missed games may reflect injury, suspension, role loss, benching, transactions, retirement, or other causes.

No 2026 regular-season outcome may be requested, inspected, downloaded, scored, summarized, or used. WR-021/WR-023 frozen artifacts, WR-033 expected-PPR/game, WR-D001, production rankings/code, `.ai/shared/*`, and `.ai/manager/*` are immutable to this task.

## Cohort / targets
Reuse the WR-025/WR-033 stats-defined returning QB/RB/WR/TE boundary. Rookies remain separate. Historical stats seasons: 2012–2025. Target seasons: 2014–2025. Scored rolling-origin folds: 2018–2025.

Primary target: `target_games`, including zero-game returners. Valid maximum: 16 through 2020; 17 from 2021 onward.

Predeclared events:
- `LOW_AVAILABILITY`: games <= 8 (WR-027-compatible);
- `HIGH_AVAILABILITY`: games >= 14 (descriptive near-full-season event).

Development folds: 2018–2021. Confirmation folds: 2022–2025. Candidate selection uses development only; confirmation cannot rescue a development failure.

## Cutoff / admitted source
Predictors for target Y use completed Y-1/Y-2 regular-season information only. Target-Y Week 1+ predictors are forbidden. Historical research cutoff remains September 1 12:00 UTC of target Y.

After the documented pre-scoring failure of revised `players.csv`, WR-034 scoring admits **only** nflverse Player Summary Stats assets `stats_player_regpost_2012.csv` through `stats_player_regpost_2025.csv`, each requiring exact WR-025 release asset ID and SHA-256 agreement with `.ai/research/generated/HISTORICAL_RANKING_ASSET_MANIFEST.json`.

No revised Players metadata, Draft Picks metadata, medical/injury/status, roster/depth, transaction, ESPN ADP/rank, PFR, PFF, NGS/NFL Pro, FantasyPros historical training, or 2026 outcome source is admitted.

## Baselines
Primary: `PREV_RATE = prev1_games / prior_season_max_games * target_season_max_games`, clipped to the valid target range.

Secondary: `PREV_GAMES`, prior games clipped to target maximum.

Training-only fallback/reference: earlier-target-season position mean games.

## Frozen feature sets after source correction
`MINIMAL_AVAILABILITY`:
- prev1_games
- prev2_games
- games_delta
- has_prev2

`FULL_STATS_AVAILABILITY`: the exact WR-025 feature vector values derived from Player Summary Stats / prior-history construction, excluding metadata-dependent `age_sep1`, `age_missing`, `experience_years`, `log_draft_pick`, `draft_round`, and `drafted`.

No target-season feature enters either matrix.

## Frozen expected-games candidates
Fit separately by position using only earlier target seasons; >=25 training rows including zero-game outcomes required.

1. `RIDGE_MINIMAL`: `StandardScaler -> Ridge(alpha=100.0)` on MINIMAL_AVAILABILITY.
2. `RIDGE_FULL`: same on FULL_STATS_AVAILABILITY.
3. `POISSON_MINIMAL`: `StandardScaler -> PoissonRegressor(alpha=1.0, max_iter=2000)` on MINIMAL_AVAILABILITY.
4. `MULTINOMIAL_HURDLE`: LOW/MID/HIGH classes (0–8 / 9–13 / 14+), `StandardScaler -> LogisticRegression(C=0.25, solver='lbfgs', max_iter=2000, random_state=34034)`; expectation is probability-weighted earlier-training class mean games. All three classes are required or the fold fails closed to PREV_RATE.

All point predictions are clipped to the valid target-season range. No hyperparameter search is permitted.

## Event-probability candidates
For LOW_AVAILABILITY and HIGH_AVAILABILITY compare training-position prevalence with:
- `LOGIT_MINIMAL`: StandardScaler -> LogisticRegression(C=0.25, solver='liblinear', max_iter=2000, random_state=34034), MINIMAL_AVAILABILITY;
- `LOGIT_FULL`: same, FULL_STATS_AVAILABILITY.

No class weighting. Both classes are required. Probabilities are clipped only numerically to [1e-6, 1-1e-6] for log loss.

## Predictive interval
For every learned expected-games candidate, use training-only per-position residual 10th/90th percentiles to form an empirical 80% interval, clipped to the valid games range. This is not a medical risk interval.

## Required metrics
Expected games: MAE, RMSE, mean bias, Spearman (secondary), predicted-range calibration. Events: prevalence, Brier/Brier skill, ROC AUC, PR AUC, log loss, reliability bins, event rates by probability tier. Intervals: empirical 80% coverage and mean width, pooled/by position. Robustness: season stability, 5,000 repeated-player cluster bootstrap replicates (seed 34035), coverage/missingness, selected-model perturbation/omission sensitivity where applicable, deterministic fallback test.

## Adoption gate — unchanged by source correction
Development selection requires all:
1. >=1.0% MAE improvement vs PREV_RATE;
2. RMSE regression <=1.0%;
3. no position with >=30 rows regresses MAE >5.0%;
4. mean season-level MAE delta <=0;
5. repeated-player bootstrap 95% CI upper bound for candidate-minus-PREV_RATE MAE <0;
6. no source/integrity/fallback failure.

If multiple pass, choose lowest development MAE; within 0.01 games prefer RIDGE_MINIMAL, POISSON_MINIMAL, RIDGE_FULL, MULTINOMIAL_HURDLE.

Final `EXPECTED-GAMES MODEL SUPPORTED` additionally requires confirmation:
1. >=0.5% pooled MAE improvement;
2. candidate-minus-PREV_RATE bootstrap CI upper <=0;
3. no position >=30 rows with >5% MAE regression;
4. promoted interval coverage between 72% and 88%;
5. no candidate fallback rows.

Otherwise use `BASELINE / WARNING-ONLY RETAINED` if PREV_RATE plus at least one event model earns its warning gate, else `INSUFFICIENT EVIDENCE`. Source-contract failure yields `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE`.

Event warning promotion requires confirmation pooled Brier skill >0, no >=30-row position with Brier skill below -5%, and no gross reliability inversion (highest predicted-probability quartile event rate below lowest quartile). Warning output never changes ordering.

## Fallback
Expected games: PREV_RATE. If prior-games source is unavailable, training-only position mean with explicit fallback flag. Warning probability: training-position prevalence with flag.

## Downstream boundary
A Phase-5 diagnostic may multiply the selected expected-games output by frozen WR-033 expected PPR/game, but downstream season totals cannot select or retune WR-034 or WR-033.

## Reproducibility
Model seed 34034; bootstrap seed 34035. Pinned dependencies are in `.ai/research/wr034_requirements.txt`. Guarded execution must verify historical asset IDs/hashes, hash WR-021/WR-023 sentinels before and after scoring, record runtime/dependency metadata, and assert `max_stats_season_loaded <= 2025` and `outcomes_2026_inspected = false`.

No further protocol retuning after candidate results are visible is permitted except a documented fail-closed correction made before affected scoring.
