# WR-035 Season-Total Distribution / Composition Research

Disposition: `INDEPENDENCE PRODUCT SUPPORTED`

## Executive result

The frozen chronological test selected `INDEPENDENT_PRODUCT`. The dependence-aware challenger passed development: False; passed confirmation: False. The empirical distribution gate passed: True.

## Confirmation central metrics

| Method | N | MAE | RMSE | Bias | Spearman |
|---|---:|---:|---:|---:|---:|
| INDEPENDENT_PRODUCT | 1773 | 32.513 | 53.176 | -1.979 | 0.438 |
| PAIRED_RESIDUAL_MEAN | 1773 | 34.815 | 52.487 | 2.645 | 0.428 |
| WR033_X_PREV_RATE | 1773 | 41.408 | 64.410 | 23.029 | 0.430 |
| PRIOR_TOTAL_SCHEDULE_ADJUSTED | 1773 | 42.709 | 70.693 | 25.935 | 0.423 |
| POSITION_MEAN_TOTAL | 1773 | 46.100 | 63.078 | 4.251 | 0.011 |

## Confirmation distribution metrics

| Method | Coverage 80% | Width | Interval score | CRPS |
|---|---:|---:|---:|---:|
| PAIRED_RESIDUAL_DRAWS | 0.827 | 90.51 | 138.88 | 21.82 |
| INDEPENDENT_RESIDUAL_DRAWS | 0.779 | 72.39 | 140.47 | 21.94 |

## Interpretation

The central expectation and uncertainty disposition are intentionally separate. Availability warning probabilities remain explanation-only. Empirical intervals describe historical forecast error and are not medical or injury forecasts. High-value, position, season, fallback, calibration, tail, and rank-sensitivity results are in the generated evaluation tables.

## Boundaries

No 2026 outcome, rookie model, ESPN/FantasyPros input, replacement/FLEX/MSV value calculation, live-draft input, or production file was used or changed.
