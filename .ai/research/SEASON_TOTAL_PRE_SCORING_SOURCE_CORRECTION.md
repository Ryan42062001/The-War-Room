# WR-035 Pre-Scoring Source Correction

Status: `FROZEN_BEFORE_AFFECTED_SCORING`

The initial fail-closed replay detected that nflverse had replaced the WR-025-locked `players.csv` release asset after its 2026-09-09 capture. The locked asset ID `552739287` now returns HTTP 404, so its exact bytes cannot be reacquired. The separately locked `draft_picks.csv` asset remains available. No candidate was scored before this condition was detected.

The correction is limited to metadata acquisition. WR-035 may use the current `players.csv` from the same nflverse `players` release tag only if all of the following hold before composition scoring:

1. the replacement asset SHA-256, asset ID, and update time are recorded as a substitution;
2. the frozen WR-033 2018-2025 active-row replay cohort is exactly 1,881 rows;
3. replayed Ridge MAE, RMSE, and Spearman match the committed WR-025 results within `1e-10`;
4. the WR-034 scored-row replay still matches every key, fallback flag, and expected-games prediction within `1e-10`.

If any condition fails, execution stops and WR-035 returns insufficient evidence. This correction does not authorize feature changes, model retuning, 2026 outcomes, or target-season information.

