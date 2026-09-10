# WR-034 Availability / Expected-Games Research

Status: COMPLETE — MANAGER REVIEW REQUIRED  
Role: Research & Development (R&D)  
Classification: EXPERIMENTAL / NON-PRODUCTION

## Executive disposition

**VERIFIED FACT — `EXPECTED-GAMES MODEL SUPPORTED` under the WR-034 preregistered research gate.**

The selected candidate is `RIDGE_FULL`: position-specific `StandardScaler -> Ridge(alpha=100)` using only completed Y-1/Y-2 Player Summary Stats-derived features. It does **not** use medical/injury data, current player status, depth charts, ESPN rank/ADP, revised mutable player metadata, target-season Week 1+ information, or 2026 outcomes.

This result does **not** authorize production changes. WR-D001 and the frozen WR-033 expected-PPR/game specification remain unchanged. Manager disposition is required before any Phase-5 integration work.

## Research question

WR-033 froze expected active-game PPR/game separately from availability. WR-034 asked whether next-season recorded games contain enough lawful preseason-known signal to deserve a separate expected-games component, calibrated probability warnings, uncertainty, and deterministic fallback.

Target: recorded regular-season games, including zero-game returners. This is an availability/continuation outcome, **not a medical injury label**.

## Frozen design

- historical Player Summary Stats: 2012–2025 only;
- target returner seasons: 2014–2025;
- rolling-origin scored folds: 2018–2025;
- development selection: 2018–2021;
- within-task confirmation: 2022–2025;
- QB/RB/WR/TE fit separately;
- no confirmation result could rescue a development failure;
- 5,000 repeated-player bootstrap replicates, seed 34035;
- model seed 34034;
- no hyperparameter search.

Primary expected-games baseline: schedule-adjusted prior-season game rate (`PREV_RATE`). Secondary baselines: raw prior games and training-only position mean.

Detailed frozen protocol: `.ai/research/AVAILABILITY_EXPECTED_GAMES_PROTOCOL.md`.  
Exact candidate spec: `.ai/research/AVAILABILITY_CANDIDATE_SPEC.md`.  
Machine lock: `.ai/research/generated/AVAILABILITY_EXPECTED_GAMES_PROTOCOL.json`.

## Source / rights / PIT result

### VERIFIED FACT

The first guarded attempt (`34537885926`) failed closed **before any model scoring** because current nflverse `players.csv` no longer matched the exact WR-025 locked digest:

- current observed SHA-256: `c2402e02d39c7ca1adbd9ca5c894bb11f693ab01da0721bff44db2a8bd1ea53d`;
- WR-025 locked SHA-256: `a33998d3981bda4f49f40390c5c0fa30036112ee1ea5de19ed4609e2ad3be3e2`.

The old locked raw asset was not recoverable through the available release-asset endpoint. Rather than admit revised mutable metadata, WR-034 removed Players and Draft Picks metadata from candidate inputs before any scoring result existed. The model/fold/gate/hyperparameter/seed definitions were not loosened.

Correction record: `.ai/research/AVAILABILITY_PRE_SCORING_SOURCE_CORRECTION.md`.

### Final admitted scoring source

Only exact WR-025-locked nflverse Player Summary Stats assets for 2012–2025. Every asset ID and SHA-256 had to match the existing historical manifest or scoring failed closed.

Excluded from WR-034 execution: revised Players metadata, Draft Picks metadata, medical/injury/status feeds, current roster/depth, transaction hindsight, ESPN ADP/rank, PFR/PFF/NGS/NFL Pro features, FantasyPros historical competing-model inputs, and all 2026 outcomes.

Source manifest: `.ai/research/AVAILABILITY_SOURCE_MANIFEST.md`.  
Generated provenance: `.ai/research/generated/WR034_SOURCE_PROVENANCE.json`.

## Cohort / coverage

Scored 2018–2025:
- 3,508 returner player-seasons;
- 1,399 unique players;
- 1,627 zero-game rows (46.4%);
- admitted historical-stats source coverage: 100% for every scored position-season.

The high zero-game share is important: this target captures continuation/participation as well as missed games among established players. It must not be described as injury probability.

Generated coverage: `.ai/research/generated/WR034_COVERAGE.csv`.

## Expected-games candidate results

All four frozen candidates passed the 2018–2021 development gate. `RIDGE_FULL` was selected because it had the lowest preregistered development MAE.

### Development

| Model | MAE | RMSE | MAE lift vs PREV_RATE |
|---|---:|---:|---:|
| PREV_RATE | 5.805 | 7.435 | — |
| Position mean | 5.131 | 5.764 | — |
| RIDGE_MINIMAL | 4.661 | 5.423 | 19.71% |
| POISSON_MINIMAL | 4.673 | 5.432 | 19.50% |
| **RIDGE_FULL** | **4.633** | 5.479 | **20.18%** |
| MULTINOMIAL_HURDLE | 4.675 | 5.441 | 19.46% |

RIDGE_FULL development player-cluster candidate-minus-PREV_RATE MAE delta: `-1.172` games; 95% CI `[-1.364, -0.976]`.

### Frozen 2022–2025 confirmation

| Model | MAE | RMSE | Bias | Spearman |
|---|---:|---:|---:|---:|
| PREV_RATE | 5.494 | 7.278 | +3.777 | .358 |
| Position mean | 5.208 | 5.947 | +0.084 | -.027 |
| RIDGE_MINIMAL | 4.579 | 5.421 | +0.055 | .363 |
| **RIDGE_FULL** | **4.479** | **5.366** | **-0.028** | **.378** |

RIDGE_FULL confirmation:
- MAE lift vs PREV_RATE: **18.47%**;
- MAE lift vs training-only position mean: **13.99%**;
- player-cluster candidate-minus-PREV_RATE MAE delta: `-1.015` games;
- 95% CI: `[-1.214, -0.804]`;
- no candidate fallback rows;
- all frozen confirmation gates passed.

### Confirmation by position vs PREV_RATE

- QB: 24.35% lower MAE;
- RB: 20.01% lower MAE;
- WR: 20.89% lower MAE;
- TE: 7.50% lower MAE.

RIDGE_FULL also beat the position-mean baseline in every position: about 11.9% QB, 15.3% RB, 13.7% WR, and 14.0% TE.

Generated evaluation: `.ai/research/generated/WR034_EXPECTED_GAMES_EVALUATION.csv`.

## Calibration and practical resolution

### STRONG EVIDENCE

The learned model removes the severe upward bias of simply carrying prior games forward. PREV_RATE confirmation bias was +3.78 games; RIDGE_FULL bias was -0.03.

However, the expected-games point estimate is deliberately compressed. On confirmation, 1,590 of 1,773 RIDGE_FULL predictions fell in the `<=8` predicted-games range, 179 in `(8,11]`, and only four above 11. This is consistent with the cohort's large zero-game component and means the point estimate should **not** be marketed as precise schedule forecasting.

Generated range calibration: `.ai/research/generated/WR034_EXPECTED_GAMES_CALIBRATION.csv`.

## Predictive uncertainty

RIDGE_FULL empirical 80% residual interval on confirmation:
- pooled coverage: **80.03%**;
- mean width: **12.39 games**.

By position:
- QB coverage 82.17%;
- RB 81.86%;
- WR 80.38%;
- TE 75.79%.

### INFERENCE

The coverage is well aligned with the nominal 80% target, but the width is large. The uncertainty interval is useful as an honesty/confidence surface, not a tight forecast. A Phase-5 UI should avoid implying that a point estimate such as `7.2 expected games` is known with narrow precision.

Generated interval evidence: `.ai/research/generated/WR034_INTERVAL_EVALUATION.csv`.

## Probability-warning results

Separate calibrated warning models were evaluated for:
- LOW_AVAILABILITY: games <=8;
- HIGH_AVAILABILITY: games >=14.

`LOGIT_FULL` passed the frozen warning gate for both events on 2022–2025 confirmation.

### LOW_AVAILABILITY — LOGIT_FULL
- prevalence: 72.53%;
- Brier: `0.16515` vs prevalence baseline `0.19866`;
- Brier skill: **+16.86%**;
- ROC AUC: `.766`;
- PR AUC: `.886`;
- all four position Brier skills positive;
- lowest predicted-probability quartile observed event rate: 45.50%;
- highest quartile: 93.23%;
- no gross reliability inversion.

### HIGH_AVAILABILITY — LOGIT_FULL
- prevalence: 14.50%;
- Brier: `0.10702` vs prevalence baseline `0.12372`;
- Brier skill: **+13.50%**;
- ROC AUC: `.789`;
- PR AUC: `.363`;
- all four position Brier skills positive;
- lowest predicted-probability quartile observed event rate: 2.03%;
- highest quartile: 35.44%;
- no gross reliability inversion.

### VERIFIED FACT

These are historical participation/availability probabilities. They are **not medical injury probabilities**, diagnoses, or causal injury-risk estimates, and they have **no ordering effect** under WR-034.

Generated event evidence:
- `.ai/research/generated/WR034_EVENT_EVALUATION.csv`;
- `.ai/research/generated/WR034_EVENT_RELIABILITY.csv`.

## Fantasy-value applicability diagnostic

Because the full cohort includes many fringe returners, a post-selection descriptive diagnostic stratified the already-generated predictions by cutoff-safe prior-season PPR/game quartile within target-season/position. This diagnostic was explicitly barred from changing candidate selection or adoption gates.

On 2022–2025 confirmation, highest prior-PPR quartile (`Q4`):
- n = 448;
- zero-game fraction = 34.4%;
- RIDGE_FULL MAE = 6.109;
- PREV_RATE MAE = 6.542 — RIDGE_FULL 6.62% better;
- position-mean MAE = 6.736 — RIDGE_FULL 9.31% better.

Q4 RIDGE_FULL remained better than the position-mean baseline in every position. Against PREV_RATE, improvement was 26.7% QB, 7.9% RB, ~0.1% WR, and 2.4% TE.

### STRONG EVIDENCE

The overall finding is not solely a fringe-player exit classifier. But direct expected-games incremental value over simple prior-game rate is much smaller for high-prior-production WR/TE cohorts. Phase-5 should retain uncertainty and probability warnings rather than treat the point estimate as a dominant ranking signal.

Diagnostic spec: `.ai/research/AVAILABILITY_PERFORMANCE_TIER_DIAGNOSTIC.md`.  
Generated result: `.ai/research/generated/WR034_PERFORMANCE_TIER_DIAGNOSTIC.json`.

## Sensitivity / fallback

Selected RIDGE_FULL confirmation sensitivity completed across its actual stats-only feature matrix.

- no optional source family was selected, so optional-source omission is `NOT_APPLICABLE`;
- largest one-feature perturbation/mean-omission MAE change was `+0.499` games, from replacing prior-season games with its training mean for 2024 TE;
- prior games and two-year game history are the most consequential availability inputs among the largest observed sensitivity cases;
- deterministic PREV_RATE fallback passed;
- missing prior-games fallback to training-only position mean passed.

Generated sensitivity: `.ai/research/generated/WR034_SENSITIVITY.json`.

## Recommended Phase-5 interface contract — advisory only

Manager consideration only; no production authorization is implied.

For a returning player with valid admitted inputs, expose:
- `expected_games`: RIDGE_FULL point estimate, preferably rounded for display rather than false precision;
- `expected_games_interval80`: empirical 80% interval, visibly labeled as broad uncertainty;
- `low_availability_probability`: LOGIT_FULL probability of <=8 recorded games;
- `high_availability_probability`: LOGIT_FULL probability of >=14 recorded games;
- `availability_provenance`: historical stats-only / no medical source;
- `availability_confidence`: should reflect source coverage plus broad interval width;
- `fallback_used`: boolean/source reason;
- `medical_injury_prediction`: always false.

Fallback order:
1. expected games: PREV_RATE;
2. if prior games unavailable: training-only position mean + explicit fallback flag;
3. warning probabilities: training-position prevalence + explicit fallback flag.

The availability layer must remain separate from frozen WR-033 expected PPR/game. A future season-total diagnostic may evaluate `expected_ppr_per_game × expected_games`, but that downstream metric may not retroactively tune WR-033 or WR-034.

## Reproducibility

Primary guarded run:
- workflow run `34538563779` — SUCCESS;
- scoring head `297021185585bcf122ed6efc7ddd525473044a18`;
- generated-output commit `5578843c111b0ff49c99b0101015088f75809492`;
- artifact ID `10176373712`;
- artifact SHA-256 `512ac5b4c4c2d86f6e3f96142d9671c5112a4ee41b8d1c9c4e8d7452face25d1`.

Post-selection applicability diagnostic:
- workflow run `34538944127` — SUCCESS;
- artifact ID `10176509984`;
- artifact SHA-256 `b0a6c9876448b1f272fc1bece0146e371e8c308a63a1273cf7cc331b5211f8c5`.

Runtime:
- Python 3.12.14;
- numpy 2.1.3;
- pandas 2.2.3;
- scipy 1.14.1;
- scikit-learn 1.5.2.

Integrity evidence: `.ai/research/generated/WR034_INTEGRITY.json`.

## Prospective / production safety

### VERIFIED FACT
- maximum statistical season loaded: 2025;
- 2026 outcomes inspected: **NO**;
- WR-021 snapshot before/after SHA-256 identical: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`;
- WR-023 protocol before/after SHA-256 identical: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`;
- WR-023 manifest before/after identical;
- WR-033 expected-performance spec changed: **NO**;
- production files/rankings changed: **NO**.

## Limitations / unknowns

- `target_games` is participation, not injury; cause of missed games is not modeled.
- The cohort includes many fringe returners and therefore measures continuation risk as well as established-player missed games.
- 2022–2025 are within-task confirmation folds, not a pristine new project-level holdout.
- Expected-games rank resolution is moderate (confirmation Spearman `.378`) and intervals are broad.
- Q4 high-prior-production WR/TE improvement over PREV_RATE is small; this should constrain product claims.
- Revised current nflverse Players metadata was explicitly rejected after checksum mismatch; no current-age/draft metadata enters the selected WR-034 model.
- No lawful historical medical/injury corpus was admitted, so medical-cause attribution remains UNKNOWN and out of scope.

## Final R&D recommendation

`EXPECTED-GAMES MODEL SUPPORTED` for Manager consideration as a **separate availability/continuation layer**, using stats-only RIDGE_FULL plus broad uncertainty. `LOGIT_FULL` is additionally supported as warning-only probability output for <=8 and >=14 recorded-game events. Neither result changes WR-033 expected-PPR/game ordering, WR-D001, or production behavior on its own.
