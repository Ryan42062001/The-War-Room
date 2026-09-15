# WR-072 — Returning-Player v2 Model Protocol + Feature Schema Freeze

Status: `FROZEN PRE-SCORE SPECIFICATION — MANAGER FREEZE / WR-073 AUDIT REQUIRED`

Task: `WR-072`  
Lineage: `returning_player_v2`  
Starting canonical main: `408a10cf14d71d88d43193df3bdd830633c2cf6f`

## New v2 identities

- model protocol: `returning-player-v2-model-protocol/1.0.0-wr072`
- feature schema: `returning-player-v2-feature-schema/1.0.0-wr072`
- preprocessing: `returning-player-v2-preprocessing/1.0.0-wr072`
- serializer: `returning-player-v2-evidence-serializer/1.0.0-wr072`
- target: `returning-player-v2-expected-ppr-pg-target/1.0.0-wr072`
- primary challenger: `returning-player-v2-ridge-stats-only-a100/1.0.0-wr072`
- machine-lock SHA-256: `d2fb326875c954446b23e2761df0feaad4b814aa49dd0465277979a3c9d9bd73`

These are new v2 identities. WR-025, WR-027, WR-029, WR-033/WR-D005, and WR-034/WR-D006 are `HISTORICAL DESIGN EVIDENCE` only. No WR-033 inputs, fitted state, predictions, or replay identity is inherited.

## Exact accepted authority

- evidence contract `wr-returning-player-v2-evidence-contract/1.0.0` / `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`
- source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`
- cohort `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`
- WR-042 custody manifest `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`
- WR-069 privacy-safe evidence `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`
- accepted cohort: 5,176 keys / 5,176 unique / 0 duplicates, target seasons 2014–2025.

The accepted source snapshot has 14 admitted `NFLVERSE_PLAYER_SUMMARY_STATS` sources, zero admitted Players metadata sources, one failed-closed Players metadata source, and excluded draft capital. Therefore this protocol has **zero metadata-derived predictors and zero draft-capital predictors**.

## Ordered feature schema

Every predictor below has exact source class `NFLVERSE_PLAYER_SUMMARY_STATS`. All use only completed Y-1/Y-2 REG facts; target-Y Week-1+ information is prohibited. Float values serialize as finite IEEE-754 binary64 `.17g` strings with negative zero normalized to `0`; `has_prev2` serializes as base-10 int8. All predictors are non-null after their named fail-closed/fallback rule.

| # | Predictor | Type | Lineage | Exact source fields | Calculation / missing behavior |
|---:|---|---|---|---|---|
| 1 | `prev1_ppr_pg` | float64 | Y-1 | fantasy_points_ppr,games | sum PPR / games after REG filter; additive null cell→0 with missingness evidence; games must be finite >0 |
| 2 | `prev1_games` | float64 | Y-1 | games | max finite games; invalid/nonpositive games fail closed |
| 3 | `prev1_attempts_pg` | float64 | Y-1 | attempts,games | sum attempts / prev1_games; additive null→0 + missingness evidence |
| 4 | `prev1_carries_pg` | float64 | Y-1 | carries,games | sum carries / prev1_games; additive null→0 + missingness evidence |
| 5 | `prev1_targets_pg` | float64 | Y-1 | targets,games | sum targets / prev1_games; additive null→0 + missingness evidence |
| 6 | `prev1_receptions_pg` | float64 | Y-1 | receptions,games | sum receptions / prev1_games; additive null→0 + missingness evidence |
| 7 | `prev1_pass_yards_pg` | float64 | Y-1 | passing_yards,games | sum passing_yards / prev1_games; additive null→0 + missingness evidence |
| 8 | `prev1_pass_tds_pg` | float64 | Y-1 | passing_tds,games | sum passing_tds / prev1_games; additive null→0 + missingness evidence |
| 9 | `prev1_int_pg` | float64 | Y-1 | passing_interceptions,games | sum interceptions / prev1_games; additive null→0 + missingness evidence |
| 10 | `prev1_rush_yards_pg` | float64 | Y-1 | rushing_yards,games | sum rushing_yards / prev1_games; additive null→0 + missingness evidence |
| 11 | `prev1_rush_tds_pg` | float64 | Y-1 | rushing_tds,games | sum rushing_tds / prev1_games; additive null→0 + missingness evidence |
| 12 | `prev1_rec_yards_pg` | float64 | Y-1 | receiving_yards,games | sum receiving_yards / prev1_games; additive null→0 + missingness evidence |
| 13 | `prev1_rec_tds_pg` | float64 | Y-1 | receiving_tds,games | sum receiving_tds / prev1_games; additive null→0 + missingness evidence |
| 14 | `prev1_pass_epa_pg` | float64 | Y-1 | passing_epa,games | sum passing_epa / prev1_games; additive null→0 + missingness evidence |
| 15 | `prev1_rush_epa_pg` | float64 | Y-1 | rushing_epa,games | sum rushing_epa / prev1_games; additive null→0 + missingness evidence |
| 16 | `prev1_rec_epa_pg` | float64 | Y-1 | receiving_epa,games | sum receiving_epa / prev1_games; additive null→0 + missingness evidence |
| 17 | `prev1_target_share` | float64 | Y-1 | target_share | mean finite REG values; if none, 0 with source_missingness=true; schema absence fatal |
| 18 | `prev1_air_yards_share` | float64 | Y-1 | air_yards_share | mean finite REG values; if none, 0 with source_missingness=true; schema absence fatal |
| 19 | `prev1_wopr` | float64 | Y-1 | wopr | mean finite REG values; if none, 0 with source_missingness=true; schema absence fatal |
| 20 | `prev1_pass_ypa` | float64 | Y-1 | passing_yards,attempts | sum yards / sum attempts if attempts>0; else structural 0 + denominator_zero=true |
| 21 | `prev1_rush_ypc` | float64 | Y-1 | rushing_yards,carries | sum yards / sum carries if carries>0; else structural 0 + denominator_zero=true |
| 22 | `prev1_rec_ypt` | float64 | Y-1 | receiving_yards,targets | sum yards / sum targets if targets>0; else structural 0 + denominator_zero=true |
| 23 | `prev2_ppr_pg` | float64 | Y-2 | fantasy_points_ppr,games | same aggregation at Y-2; if no valid Y-2 row copy prev1_ppr_pg and flag prior2_missing |
| 24 | `prev2_games` | float64 | Y-2 | games | same aggregation at Y-2; if no valid Y-2 row copy prev1_games and flag prior2_missing |
| 25 | `ppr_delta` | float64 | Y-1,Y-2 | fantasy_points_ppr,games | prev1_ppr_pg-prev2_ppr_pg; 0 under missing-Y-2 fallback |
| 26 | `weighted_ppr_pg` | float64 | Y-1,Y-2 | fantasy_points_ppr,games | 0.70*prev1_ppr_pg+0.30*prev2_ppr_pg; equals prev1 under missing-Y-2 fallback |
| 27 | `games_delta` | float64 | Y-1,Y-2 | games | prev1_games-prev2_games; 0 under missing-Y-2 fallback |
| 28 | `has_prev2` | int8 | Y-2 | player_id,season,season_type,position,games | 1 iff valid same-player completed Y-2 REG QB/RB/WR/TE row with games>0, otherwise 0 |

Aggregation is fail-closed on missing required schema fields. There is no generic `nan_to_num` or generic model-matrix imputation. Y-2 absence is a declared structural fallback, not silent imputation.

Explicitly prohibited without a new source-contract/custody/audit version: age, birth date, rookie season, experience, current team/status, draft year/round/pick/capital, or a proxy designed to recreate those unavailable semantics.

## Target definition

Target ID: `returning-player-v2-expected-ppr-pg-target/1.0.0-wr072`.

For a cohort row in target season Y, the target is **Full-PPR points per recorded regular-season game**: a valid target-Y REG row with games>0 gives `sum(fantasy_points_ppr)/max(games)`. If games=0 or no valid target-Y REG row exists, status is `TARGET_UNAVAILABLE`; PPR/game is never imputed as zero.

Membership remains Y-1 stats-defined. Zero-game/target-unavailable rows remain in full-row evidence and, in scored folds, still require pre-outcome prediction evidence. Only `OBSERVED` held-out targets enter accuracy/ranking metrics or later-fold training. Canonical target record is `[stable_key,target_status,target_games,target_ppr_pg]`, with integer/null games and finite `.17g`/null PPR/game.

## Chronology and leakage protection

Historical cutoff: September 1 12:00 UTC of target Y. Predictors use Y-1 or earlier only.

- warmup training target seasons: 2014–2017
- development: 2018–2019
- validation: 2020–2021
- confirmation: 2022–2025
- rolling fold Y / position P: train only on same-position `OBSERVED` targets from accepted cohort seasons 2014..Y-1
- minimum training support: 25 rows per position/fold
- repeated players are allowed; uncertainty bootstrap clusters by player_id
- result-driven split changes require a new protocol version and fresh independent audit.

Held-out Y targets stay sealed until Y feature/preprocessing/model/prediction evidence is immutable. A prior held-out season may become later-fold training only after its prediction digest is frozen and with unchanged protocol/code/hyperparameters.

## Preprocessing specification

Architecture: separate QB/RB/WR/TE. Numeric dtype: float64. Exact input order is predictor order 1..28. No generic imputation; only the named schema rules above are valid. Non-finite values are fatal before scaling.

Scaler: `sklearn.preprocessing.StandardScaler(copy=True, with_mean=True, with_std=True)`, fit only on same-position `OBSERVED` training rows. Future evidence exports `mean_`, `var_`, `scale_`, `n_samples_seen_`, ordered features, and exact state digest. Zero-variance behavior is the frozen scikit-learn 1.5.2 behavior (`scale_=1`).

If a position/fold cannot fit, fallback is `PREV1_PPR_PG` with explicit `FALLBACK` status/reason; **any fallback prediction in 2018–2025 blocks candidate support**.

## Candidate model and hyperparameters

One primary learned challenger, with no hyperparameter search:

`StandardScaler -> Ridge(alpha=100.0, fit_intercept=True, copy_X=True, max_iter=None, tol=0.0001, solver='svd', positive=False, random_state=None)`

Fit separately by position. Prediction unit is Full-PPR points/game. This reuses a historical mathematical form as design evidence only; it is a new v2 candidate and inherits no v1 fitted state or prediction identity.

## Baselines, metrics, and frozen gates

Primary baseline: `prev1_ppr_pg`. Secondary guards: `weighted_ppr_pg` and same-position mean of earlier `OBSERVED` training targets. Any decision tie goes to baseline/non-promotion.

Primary metric: MAE PPR/game. Secondary: RMSE PPR/game. Ordering metrics: within-position/season Spearman and rank MAE with player_id ascending tie break, aggregated by evaluable-row weight. Ordering cells require >=8 evaluable rows; position stage gates use >=30. Repeated-player paired cluster bootstrap: 5,000 replicates, seed 72073, statistic candidate MAE minus primary-baseline MAE, percentile 95% CI.

**Development 2018–2019 requires all:** MAE improvement >=1.0%; RMSE regression <=1.0%; no >=30-row position MAE regression >5%; mean season candidate-minus-baseline MAE <=0; zero fallbacks; zero source/schema/digest/lineage failures. Failure is terminal.

**Validation 2020–2021 requires all:** development PASS; MAE improvement >=0.5%; RMSE regression <=1.0%; weighted Spearman delta >=-0.01; weighted rank-MAE regression <=2%; no >=30-row position MAE regression >5%; no single-season MAE regression >5%; zero fallbacks. Failure is terminal; confirmation cannot rescue.

**Confirmation 2022–2025 requires all:** development+validation PASS; pooled MAE improvement >=0.5%; bootstrap 95% CI upper bound for candidate-minus-baseline MAE <=0; no >=30-row position MAE regression >5%; at least 3/4 positions non-worse on MAE; mean season MAE delta <=0; no single-season MAE regression >5%; weighted Spearman delta >=-0.01; weighted rank-MAE regression <=2%; >=30 evaluable rows in every position; zero fallbacks; zero lineage failures; and <=1% MAE regression versus each secondary baseline.

All stages pass => `EXPECTED_PERFORMANCE_MODEL_SUPPORTED_FOR_INDEPENDENT_RESULT_AUDIT_ONLY`. Any stage failure => baseline-only / insufficient evidence. Production authorization is NONE. These gates are immutable after this freeze.

## Full-row keyed evidence

All 5,176 accepted cohort keys persist. 2014–2017 are `TRAIN_ONLY` evidence rows; every 2018–2025 key receives a primary or explicit fallback prediction before held-out target join, even if its eventual target is unavailable.

Feature evidence must preserve stable key, pre-score status/reason, exact ordered pre-transform values, source missingness and denominator flags, source-instance/source-field lineage, feature-schema/serializer IDs, transform-code SHA, and canonical feature SHA-256. Preprocessing evidence preserves fold/position, complete ordered training keys+digest, preprocessing ID, scaler state+digest. Model evidence preserves candidate/fold/position, exact hyperparameters, target ID, coefficients/intercept/state digest, and prediction-code SHA. Prediction evidence preserves stable key, fold/position/candidate, lossless prediction, status/fallback, feature/preprocessing/model digests, row digest, and reason.

## Hard outcome isolation

The outcome/evaluation table is separate and access-controlled. Manager may authorize a held-out join only after the complete pre-score evidence/prediction manifest is frozen and exact-target verified. Target values/interim held-out metrics are prohibited from operator-facing pre-score logs.

After target exposure, features, preprocessing, candidate set, hyperparameters, split logic, and gates cannot change. Any such change creates a new protocol version and requires fresh independent audit; the old results cannot be relabeled as the same experiment.

## Fail-closed rules

Future execution rejects: missing/extra/duplicate cohort keys; contractual key-order mismatch; source snapshot/cohort/WR-042/WR-069 digest mismatch; feature schema/order/type mismatch; absent required source fields; lineage to failed-closed metadata or excluded draft capital; unexpected nulls; NaN/+Inf/-Inf feature or prediction values; current/future-fold training keys; held-out target exposure before prediction lock; preprocessing/model/environment/code digest mismatch; unknown inclusion/exclusion/fallback reason; prediction missing feature/preprocessing/model lineage; or evaluation without immutable pre-score prediction.

## Environment / reproducibility lock

Future scoring must use CPython 3.12.7 on Ubuntu 24.04 LTS x86_64, UTC, `C.UTF-8`; numpy 2.1.3, pandas 2.2.3, scikit-learn 1.5.2, scipy 1.14.1. Set `PYTHONHASHSEED=72072`, `OMP_NUM_THREADS=1`, `MKL_NUM_THREADS=1`, `OPENBLAS_NUM_THREADS=1`, and `NUMEXPR_NUM_THREADS=1`. Bootstrap seed is 72073.

The future scoring lock must bind repository SHA and clean-tree assertion, scoring-script blob/SHA-256, exact dependency lock and installed versions, Python/OS/kernel/architecture and BLAS/LAPACK config, locale/timezone/deterministic settings, exact commands and output paths, input authority hashes, and every output hash.

## Future scoring publication contract

Before any outcome evaluation, publish under `.ai/research/generated/` with adjacent SHA-256 sidecars:

- `RETURNING_PLAYER_V2_KEY_MANIFEST_V1.json`
- `RETURNING_PLAYER_V2_FEATURE_SURFACE_V1.jsonl`
- `RETURNING_PLAYER_V2_PREPROCESSING_STATES_V1.json`
- `RETURNING_PLAYER_V2_MODEL_STATES_V1.json`
- `RETURNING_PLAYER_V2_PREDICTIONS_PRE_OUTCOME_V1.jsonl`
- `RETURNING_PLAYER_V2_ENVIRONMENT_LOCK_V1.json`
- `RETURNING_PLAYER_V2_PRE_SCORE_MANIFEST_V1.json`

The pre-score manifest binds this protocol ID+machine-lock hash; schema/preprocessing/serializer IDs; source snapshot/cohort IDs+hashes; WR-042/WR-069 hashes; all feature/state/prediction artifacts and hashes; code SHA+clean tree; environment; exact command/run identity; and an assertion that no held-out target values are present in pre-score artifacts.

## WR-072 execution attestation

No model fitting, scoring, tuning, candidate-outcome comparison, prediction, outcome-table inspection, target/outcome join, source reacquisition/refresh/substitution, failed-closed metadata use, draft-capital use, provider mutation, production/ranking change, 2026 regular-season outcome inspection, or Phase-6 work occurred.

Next role: **Manager / Architect** for exact-target verification/freeze. R&D does not activate WR-073 and does not merge its own PR.
