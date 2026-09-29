# WR-095 — Returning-Player v2.1 Prospective Protocol Proposal

Status: **R&D PROTOCOL CANDIDATE — READY FOR MANAGER FREEZE IF INDEPENDENTLY VERIFIED**

Protocol disposition:

`PROTOCOL_READY_FOR_MANAGER_FREEZE`

Source/custody disposition:

`EXISTING_ACCEPTED_SOURCE_SUFFICIENT`

Machine candidate:

`returning-player-v2.1-model-protocol-candidate/1.0.0-wr095`

Machine candidate path:

`.ai/research/generated/WR095_RETURNING_PLAYER_V21_PROTOCOL_CANDIDATE.json`

Machine candidate SHA-256:

`5c86dacac044538422ca24fbeb13eaee3161050f917acc40f0dbdc1ca6547a39`

This proposal is prospective. No model was fit or scored in WR-095.

## 1. Design principles

The v2.1 candidate preserves the parts of WR-072 that remained technically defensible and changes only the surfaces implicated by the now-design-exposed WR-081 failure evidence.

Preserved:
- accepted WR-059 source snapshot and cohort authority;
- same target: expected regular-season full-PPR points per recorded game;
- same QB/RB/WR/TE separate-by-position structure;
- same 28 stats-only feature formulas and named missingness rules;
- same primary and secondary baselines;
- same Ridge alpha=100 regularization;
- same binary64 / canonical-hash evidence discipline;
- same prediction-lock-before-target-exposure principle;
- same validation and confirmation performance thresholds;
- same confirmation bootstrap mechanics;
- zero metadata/draft-capital predictors;
- zero new external sources.

Changed:
- model predicts a correction to the persistence baseline instead of directly predicting level;
- standardized features are deterministically bounded before fit/predict;
- the residual correction is deterministically bounded using training-only robust residual dispersion;
- 2018–2021 are explicitly design-exposed, never future validation;
- future untouched chronology is 2022–2023 validation then 2024–2025 confirmation.

## 2. Model family

Model family:

`PER_POSITION_BOUNDED_RESIDUAL_RIDGE`

For each target season Y and each position P:

1. Build the WR-072 28-feature vector from completed Y-1/Y-2 Player Summary Stats only.
2. Primary baseline:
   `b = prev1_ppr_pg`.
3. Training target:
   `r = target_ppr_pg - b`.
4. Fit one same-position Ridge model to residual target r.
5. Convert its raw residual prediction into a bounded residual adjustment.
6. Final prediction:
   `candidate = b + bounded_adjustment`.

Rationale: the persistence baseline is already a strong level forecast. The model is asked only to make a bounded correction rather than extrapolate the whole PPR/game level.

## 3. Per-position behavior

Architecture remains separate by:
- QB
- RB
- WR
- TE

No position gets a special WR-095-only exception.

The same transformation, clipping, residual-bound, fallback, and gate logic applies to all four positions.

No feature is deleted only because of the known WR-081 catastrophic row.

## 4. Feature schema

Feature schema identity:

`returning-player-v2.1-feature-schema/1.0.0-wr095`

Exactly 28 ordered features are retained:

1. prev1_ppr_pg
2. prev1_games
3. prev1_attempts_pg
4. prev1_carries_pg
5. prev1_targets_pg
6. prev1_receptions_pg
7. prev1_pass_yards_pg
8. prev1_pass_tds_pg
9. prev1_int_pg
10. prev1_rush_yards_pg
11. prev1_rush_tds_pg
12. prev1_rec_yards_pg
13. prev1_rec_tds_pg
14. prev1_pass_epa_pg
15. prev1_rush_epa_pg
16. prev1_rec_epa_pg
17. prev1_target_share
18. prev1_air_yards_share
19. prev1_wopr
20. prev1_pass_ypa
21. prev1_rush_ypc
22. prev1_rec_ypt
23. prev2_ppr_pg
24. prev2_games
25. ppr_delta
26. weighted_ppr_pg
27. games_delta
28. has_prev2

Feature formulas, source lineage, aggregation, serialization types, and named missingness profiles are inherited from WR-072 unchanged.

## 5. New deterministic feature transformation

Fit per-position StandardScaler on training rows exactly as in WR-072.

For every standardized feature value:

`z_raw = (x - mean_) / scale_`

Model input is:

`z_model = min(6.0, max(-6.0, z_raw))`

The same operation is applied to training and prediction matrices.

Why 6:
- it is a generic feature-space extrapolation guard, not a player-specific rule;
- the WR-081 failure showed hundreds-of-sigma values can arise from sparse within-position features;
- 6 standard deviations is far outside ordinary standardized support while still preserving wide normal variation;
- the threshold is fixed now and is not selected by search over 2018–2021 outcomes.

Required evidence:
- raw standardized value;
- clipped model value;
- per-feature clip flag;
- per-row clip count;
- per-fold/position clip count.

Failure to apply the transform identically in training and prediction is fatal.

## 6. Preprocessing

Per position:
- dtype: float64;
- StandardScaler(copy=True, with_mean=True, with_std=True);
- ordered feature list fixed;
- fit only on same-position OBSERVED training rows;
- no generic imputation;
- WR-072 named null/missing/denominator handling retained;
- nonfinite feature/scaler/model input is fatal.

## 7. Objective and regularization

Candidate model:

`returning-player-v2.1-bounded-residual-ridge-a100/1.0.0-wr095`

Ridge parameters:

- alpha = 100.0
- fit_intercept = true
- copy_X = true
- max_iter = null
- tol = 0.0001
- solver = svd
- positive = false
- random_state = null

Objective remains squared-error Ridge, but on residual target rather than level target.

Why Ridge remains:
- WR-081 bulk error and rank behavior were not broadly poor;
- the principal failure was extreme feature extrapolation;
- changing model family and regularization simultaneously would add avoidable post-hoc degrees of freedom;
- retaining alpha=100 avoids a new hyperparameter search.

## 8. Residual tail-risk bound

For each fold/position, training residual target is:

`r_i = observed_target_i - primary_baseline_i`

Compute using training rows only:

- `center = median(r_i)`
- `MAD = median(abs(r_i - center))`
- `robust_sigma = 1.4826 * MAD`

Require finite `robust_sigma > 0`.

Bound:

- lower = `center - 3.0 * robust_sigma`
- upper = `center + 3.0 * robust_sigma`

Raw Ridge residual prediction `r_hat_raw` becomes:

`r_hat = min(upper, max(lower, r_hat_raw))`

Final candidate:

`prediction = primary_baseline + r_hat`

The multiplier 3.0 is fixed before future outcome exposure and is not selected by replay search.

If robust_sigma is zero or nonfinite, fail closed for that fold rather than inventing a cap.

This bound is a model-integrity invariant, not an outcome gate.

## 9. Missing data and fallback

WR-072 named missing-data rules remain unchanged.

Minimum training support per position:
`25` OBSERVED rows.

Fallback:
`PREV1_PPR_PG`

Fallback status must be explicit.

Fallback triggers include:
- training rows <25;
- invalid residual scale;
- nonfinite required feature/preprocessing/model/prediction state;
- unknown lineage/schema state.

Any fallback in future validation or confirmation blocks support.

## 10. Design/training window

All 2018–2021 outcomes are design-exposed.

Historical training targets available before the first future validation prediction:
- 2014
- 2015
- 2016
- 2017
- 2018
- 2019
- 2020
- 2021

For target season Y:
- train same-position OBSERVED rows from 2014 through Y-1 only;
- never use Y or a later target before Y prediction is immutable.

## 11. Design replay / resampling

There is exactly one v2.1 candidate and no hyperparameter search.

2018–2021 may later be replayed only as:

`DESIGN_EXPOSED_CONFORMANCE_ONLY`

Required rolling-origin folds:
- 2018
- 2019
- 2020
- 2021

Purpose:
- implementation conformance;
- feature-clipping diagnostics;
- residual-bound activation diagnostics;
- stability reporting;
- reproducibility evidence.

These folds may not create prospective promotion evidence and may not be relabeled validation or confirmation.

No parameter may be changed after Manager freeze based on design replay results without creating a new protocol version and restarting protocol audit.

## 12. Future untouched chronology

Chosen **before** inspecting any 2022–2025 outcome.

### Validation stage

Seasons:
- 2022
- 2023

Chronology:
1. fit 2022 from prior OBSERVED training only;
2. lock 2022 prediction/model/preprocessing state;
3. expose 2022 target;
4. only after the 2022 lock may 2022 outcome enter training for 2023;
5. fit and lock 2023;
6. expose 2023 target;
7. compute validation gate.

If validation fails:

`VALIDATION_FAILED`

Stop immediately. Do not expose 2024 or 2025 outcomes.

### Confirmation stage

Seasons:
- 2024
- 2025

Allowed only after validation PASS.

Chronology:
1. fit and lock 2024 prediction;
2. expose 2024 target;
3. 2024 may enter 2025 training only after the 2024 prediction lock;
4. fit and lock 2025 prediction;
5. expose 2025 target;
6. compute confirmation gate and bootstrap.

At least this entire stage remains genuinely untouched when validation begins.

## 13. Baselines

Primary:
`prev1_ppr_pg`

Secondary:
- `weighted_ppr_pg`
- same-position earlier-OBSERVED target mean

All candidate/primary/secondary comparisons use identical finite row universes.

No baseline is changed to make WR-081 pass.

## 14. Metrics

Primary:
- MAE

Secondary:
- RMSE

Ordering:
- weighted Spearman by eligible season-position cell;
- weighted rank MAE by eligible season-position cell.

Mandatory tail diagnostics:
- P90 absolute error;
- P95 absolute error;
- P99 absolute error;
- maximum absolute error;
- top-1% SSE share;
- top-5% SSE share.

These diagnostics are mandatory evidence but are not separate promotion gates. RMSE remains the predeclared tail-sensitive performance gate.

Relative formulas remain:

`improvement = (baseline - candidate) / baseline`

`regression = (candidate - baseline) / baseline`

Named baseline is always denominator.

## 15. Validation result gates

2022–2023 must satisfy all:

- MAE lift >= 0.005
- RMSE regression <= 0.01
- weighted Spearman delta >= -0.01
- weighted rank-MAE regression <= 0.02
- max eligible position MAE regression <= 0.05
- max season MAE regression <= 0.05
- fallbacks = 0
- lineage failures = 0

These are numerically unchanged from WR-072 validation.

They were not relaxed in response to the known WR-081 failure.

## 16. Confirmation result gates

2024–2025 requires validation PASS and must satisfy all:

- MAE lift >= 0.005
- bootstrap 95% upper CI of candidate-minus-primary MAE delta <= 0
- max eligible position MAE regression <= 0.05
- positions non-worse on MAE >= 3
- mean season MAE delta <= 0
- max season MAE regression <= 0.05
- weighted Spearman delta >= -0.01
- weighted rank-MAE regression <= 0.02
- minimum evaluable rows each position >= 30
- fallbacks = 0
- lineage failures = 0
- MAE regression versus each secondary baseline <= 0.01

These thresholds are numerically unchanged from WR-072 confirmation.

Only the prospective stage years change.

## 17. Bootstrap / uncertainty

Confirmation only.

- 5000 replicates;
- NumPy Generator(PCG64(72073));
- construct once, never reseed;
- cluster key = (player_id_namespace, player_id);
- unique clusters sorted deterministically;
- sample K clusters with replacement for K unique clusters;
- multiplicity weights every row in selected cluster;
- statistic = candidate weighted MAE - primary weighted MAE;
- quantiles = 0.025 and 0.975;
- NumPy quantile method = linear;
- gate = Q0.975 <= 0.0;
- all replicate evidence serialized losslessly with canonical hashes.

The accepted WR-072 bootstrap semantics are preserved.

## 18. Evidence requirements

Before target exposure, every scored row must bind:

- stable key;
- exact feature lineage;
- ordered raw feature values;
- named missing/denominator flags;
- z_raw values;
- z_model values;
- clip flags;
- feature digest;
- preprocessing digest;
- model digest;
- primary and secondary baseline predictions;
- raw residual prediction;
- residual center/MAD/robust_sigma;
- residual lower/upper bound;
- bounded residual adjustment;
- final candidate prediction;
- prediction row digest.

Fold state must bind:
- exact ordered training keys and digest;
- scaler state;
- residual-target definition;
- residual distribution state;
- Ridge coefficients/intercept/hyperparameters;
- code/environment/state digests.

Target evaluation may occur only after immutable prediction lock.

Every stage publishes exact gate inputs, gate booleans, tail diagnostics, fallbacks, lineage failures, and stage lock.

## 19. Environment lock

- CPython 3.12.7
- Ubuntu 24.04 LTS
- x86_64
- UTC
- C.UTF-8
- numpy 2.1.3
- pandas 2.2.3
- scikit-learn 1.5.2
- scipy 1.14.1
- PYTHONHASHSEED=72072
- OMP_NUM_THREADS=1
- MKL_NUM_THREADS=1
- OPENBLAS_NUM_THREADS=1
- NUMEXPR_NUM_THREADS=1

Ridge is deterministic under the frozen SVD solver.

Bootstrap seed remains 72073.

## 20. Fail-closed rules

Fatal:
- missing/extra/duplicate cohort key;
- source/cohort/protocol identity mismatch;
- required source field absent;
- feature schema/order/type mismatch;
- nonfinite feature or state;
- excluded metadata/draft-capital/substituted-source lineage;
- current/future season in training;
- target exposure before immutable prediction lock;
- inconsistent z clipping;
- final residual adjustment outside frozen bound;
- unknown fallback/inclusion reason;
- environment/code/state digest mismatch;
- later-stage access after a failed prerequisite gate.

No silent repair or source substitution is allowed.

## 21. Publication contract

Logical future publication root:

`.ai/research/generated/`

Required evidence families:

- RETURNING_PLAYER_V21_KEY_MANIFEST
- RETURNING_PLAYER_V21_FEATURE_SURFACE
- RETURNING_PLAYER_V21_PREPROCESSING_STATES
- RETURNING_PLAYER_V21_MODEL_STATES
- RETURNING_PLAYER_V21_PREDICTIONS_PRE_OUTCOME
- RETURNING_PLAYER_V21_EVALUATIONS
- RETURNING_PLAYER_V21_STAGE_GATES
- RETURNING_PLAYER_V21_ENVIRONMENT_LOCK
- RETURNING_PLAYER_V21_EXECUTION_CHRONOLOGY
- RETURNING_PLAYER_V21_RESULT_MANIFEST

The current protected bridge publication allowlist is WR-081-specific, so any future bridge/consumer publication update must be independently reviewed and audited before new scoring authority exists.

Raw retained source bytes may never be published.

## 22. Source/custody disposition

`EXISTING_ACCEPTED_SOURCE_SUFFICIENT`

No new source admission is needed.

Reason:
- the protocol uses the exact accepted Player Summary Stats class;
- it retains the same 28 source-derived features;
- all new mechanics are deterministic transformations/model semantics;
- no age, draft capital, mutable player metadata, external projections, or new provider field is required.

## 23. Post-hoc control

The proposal openly uses 2018–2021 as design evidence.

It does not claim those years are untouched.

No known failed row is excluded.

No performance gate threshold is weakened.

Alpha is unchanged.

No blend weight, clipping threshold, residual-cap multiplier, feature subset, or alternative model family was searched over in WR-095.

Any future change to those frozen choices after Manager freeze requires:
1. new protocol version;
2. explicit contamination accounting;
3. new independent protocol audit;
4. no use of unopened future outcomes in choosing the replacement.

## 24. Minimum safe execution sequence

1. Manager verifies and freezes exact WR-095 R&D target.
2. Fresh Independent Auditor audits the exact protocol target.
3. If audit passes, implement the v2.1 protected consumer and any bridge allowlist/publication changes.
4. Independently audit any material protected-execution update before scoring.
5. Manager records one-time exact execution authority.
6. Score 2022 then 2023 under prediction-lock chronology.
7. Evaluate the validation gate.
8. Only if validation passes, score 2024 then 2025.
9. Evaluate confirmation gate and bootstrap.
10. Fresh independent result audit.
11. Only after accepted model result, perform season-total composition.
12. Independent composition audit.
13. Phase 6 remains blocked until composition acceptance.

## 25. Unresolved risks

- The proposed protocol has not been fit or scored.
- z=6 and 3-MAD-sigma controls are prospectively fixed engineering/statistical choices, not proven optimal settings.
- Retaining all 28 features preserves sparse cross-role information; clipping is expected to bound rather than remove that risk.
- Residual Ridge may still underperform untouched future years.
- The 2022–2023 validation stage may fail; that failure must remain terminal.
- The current protected bridge is WR-081 publication-specific and will likely need a bounded audited update before v2.1 scoring.

These risks are why fresh protocol audit and genuinely untouched future validation remain mandatory.

## WR-095 attestation

No model fitting, scoring, hyperparameter search, retained raw access, source reacquisition/substitution, 2022–2025 outcome exposure, 2026 outcome inspection, season-total composition, production/ranking change, or Phase-6 work occurred in WR-095.
