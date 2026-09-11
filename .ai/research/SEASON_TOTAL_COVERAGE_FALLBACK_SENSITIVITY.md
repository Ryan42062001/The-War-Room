# WR-035 Coverage, Fallback, and Sensitivity

- Cohort: 3,508 returning-player seasons, 1,399 unique players, including 1,627 zero-game rows.
- WR-033 replay: exact committed active-row cohort (1,881) and exact MAE/RMSE/Spearman.
- WR-034 replay: all 3,508 row keys and fallback flags matched; maximum expected-games delta was `2.19e-13` at tolerance `1e-10`.
- Primary WR-034 fitted-model fallbacks observed in scored folds: 0. The fallback was therefore evaluated counterfactually across every row as `WR033 × PREV_RATE`, not estimated from a naturally failing-source subgroup.
- Deterministic fallback unit contract passed: PREV_RATE first, then training-position mean, with explicit state.
- Confirmation independence MAE by position: QB 45.819, RB 31.897, WR 32.299, TE 24.596. No position-specific override is authorized.
- Confirmation paired-distribution 80% coverage: pooled 82.7%; QB 77.9%; RB 83.6%; WR 84.3%; TE 81.8%. Mean pooled width was 90.51 points.
- Rank uncertainty remains broad: pooled empirical 80% rank coverage was only 38.5%, so draw-derived rank intervals are descriptive and are not promoted as calibrated rank guarantees.
- A replaced nflverse `players.csv` asset required the frozen pre-scoring source correction. The substitute was accepted only because the exact WR-033 aggregate replay passed. This remains a provenance/archival risk.

