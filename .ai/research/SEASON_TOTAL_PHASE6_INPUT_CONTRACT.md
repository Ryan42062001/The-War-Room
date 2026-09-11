# Recommended Phase-6 Season-Total Input Contract

Version: proposed `season_total_transform_v1`

This is a research recommendation, not production authorization.

| Field | Exact semantics |
|---|---|
| `player_id` | Stable GSIS identity; required and unique with target season/position. |
| `player_name` | Display-only name; never an identity join key. |
| `position` | Preseason QB/RB/WR/TE position used by the frozen upstream models. |
| `target_season` | Intended projection season. |
| `as_of` | Cutoff timestamp; must precede target-season Week 1. |
| `wr033_expected_active_ppr` | Frozen WR-033 conditional expected full-PPR points per recorded active game. |
| `wr034_expected_games` | Accepted WR-034 expected recorded games, clipped to the scheduled maximum. |
| `expected_season_ppr` | Exact product of the preceding two fields; no risk penalty or dependence correction. |
| `season_ppr_p10/p25/p50/p75/p90` | Deterministic paired empirical residual quantiles when distribution coverage is supported; nullable otherwise. High-value cohorts require an explicit calibration warning. |
| `low/high_availability_probability` | WR-034 warning/explanation fields only; never an additional rank penalty. |
| `distribution_state` | `PRIOR_OOS_POSITION`, declared fallback, or `DISTRIBUTION_UNAVAILABLE`. |
| `performance_fallback`, `games_fallback` | Boolean plus exact fallback method. |
| `coverage_flags` | Source, feature, high-value calibration, and rank-sensitivity limitations. |
| `wr033_model_hash`, `wr034_model_hash` | Immutable upstream specification/version identifiers. |
| `source_manifest_hash` | Immutable admitted-input provenance identifier. |
| `transform_version` | Exact season-total composition implementation version. |

The interface must not contain ESPN/FantasyPros rank or ADP, drafted state, roster need, opponent demand, survival-to-next-pick, position-run pressure, replacement level, FLEX allocation, MSV, or any live-draft recommendation score.

