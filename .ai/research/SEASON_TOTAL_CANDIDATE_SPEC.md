# WR-035 Candidate Specification

Status: `FROZEN_PRE_SCORING_LOCK`

| Name | Type | Formula / construction | Selection role |
|---|---|---|---|
| `INDEPENDENT_PRODUCT` | central | WR-033 expected active-game PPR × WR-034 `RIDGE_FULL` expected games | primary simple candidate |
| `PAIRED_RESIDUAL_MEAN` | central | mean of 2,001 joint, same-row empirical residual draws | sole dependence-aware challenger |
| `WR033_X_PREV_RATE` | central baseline | WR-033 expected active-game PPR × schedule-adjusted prior games | upstream-composition baseline |
| `PRIOR_TOTAL_SCHEDULE_ADJUSTED` | central baseline | prior realized PPR total × schedule ratio | naive total baseline |
| `POSITION_MEAN_TOTAL` | central baseline | earlier-fold position mean realized total | sanity baseline |
| `PAIRED_RESIDUAL_DRAWS` | distribution | same residual-row index for performance and games | dependence-preserving candidate |
| `INDEPENDENT_RESIDUAL_DRAWS` | distribution | independently sampled performance and games residuals | independence distribution comparator |

All clipping, sample sizes, fallback order, seeds, folds, metrics, and gates are defined exclusively in `SEASON_TOTAL_COMPOSITION_PROTOCOL.md` and its machine lock. There is no hyperparameter search.

