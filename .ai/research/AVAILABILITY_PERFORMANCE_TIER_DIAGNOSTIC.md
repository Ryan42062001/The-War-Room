# WR-034 Post-Selection Performance-Tier Diagnostic

Status: DESCRIPTIVE ONLY — CANNOT ALTER FROZEN MODEL SELECTION
Task: WR-034

## Why this diagnostic is being added
The completed preregistered WR-034 scoring includes all stats-defined returners, including zero-game target outcomes. This is correct for availability modeling, but the production use case is a fantasy draft assistant. A descriptive check is therefore useful to determine whether the selected model's lift is concentrated only among fringe prior-season players.

This diagnostic was defined **after** the primary WR-034 result and therefore may not be used to select a different candidate, retune any model, alter an adoption threshold, or rescue/reject the frozen primary decision. It is applicability evidence only.

## Frozen diagnostic
For each target season and position, use the cutoff-safe `prev1_ppr_pg` value from completed target-Y-1 Player Summary Stats. Rank returners within that target-season/position and assign four equal-count prior-performance tiers using rank(method='first') then qcut:
- Q1 = lowest prior-season PPR/game quartile;
- Q2;
- Q3;
- Q4 = highest prior-season PPR/game quartile.

Evaluate the already-generated predictions without refitting:
- PREV_RATE;
- POSITION_MEAN;
- selected RIDGE_FULL.

Report, separately for 2018–2021 development and 2022–2025 confirmation:
- rows;
- zero-game fraction;
- MAE for each comparator;
- RIDGE_FULL MAE lift vs PREV_RATE;
- RIDGE_FULL MAE lift vs POSITION_MEAN;
- mean target games.

Also report confirmation Q4 by position when sample permits.

## Interpretation
If RIDGE_FULL remains materially better in Q4, the overall finding is not solely a fringe-player exit classifier. If Q4 lift collapses or reverses, the final research report must flag that applicability limit even though the preregistered primary gate remains passed.

## Safety
This diagnostic uses only the same exact locked 2012–2025 Player Summary Stats source contract. It requests no new source family and no 2026 outcome. It changes no WR-033 expected-PPR/game model and no production behavior.
