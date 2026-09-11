# WR-035 Dependence Analysis

The predeclared paired-residual challenger is not supported. It failed the development gate in all four positions. On locked confirmation (2022-2025), its season-total MAE was 34.815 versus 32.513 for the independence product, a 7.08% worsening. The repeated-player cluster bootstrap estimated paired-minus-independent MAE at +2.301 points (95% CI +1.806 to +2.680; 921 player clusters; 5,000 replicates).

The challenger slightly reduced RMSE (52.487 versus 53.176) and shifted bias from -1.979 to +2.645, but those benefits did not offset the MAE failure. Per the frozen simplicity rule, `INDEPENDENT_PRODUCT = WR033 expected active-game PPR × WR034 expected games` is retained. This is evidence that the tested empirical residual dependence correction does not earn adoption, not proof that performance and availability are statistically independent.

