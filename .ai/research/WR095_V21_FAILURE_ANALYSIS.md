# WR-095 — Returning-Player v2.1 Failure Analysis

Status: R&D ANALYSIS COMPLETE — PROSPECTIVE DESIGN ONLY

Task: `WR-095 — Returning-Player v2.1 Failure Analysis + Prospective Model-Protocol Design`

Historical authority:
- WR-081 frozen target: `b5fc0974e0766c24974034557a62044b4752716a`
- WR-082 independent verdict: `PASS`
- WR-081 terminal: `VALIDATION_FAILED`
- WR-081 status: `BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE`

Contamination rule:
- 2018–2021 are **DESIGN-EXPOSED** for v2.1.
- 2022–2025 remain unopened during WR-095.
- No 2018–2021 season is described here as untouched validation or confirmation evidence.

## Executive conclusion

**VERIFIED FACT:** WR-081 did not fail because ordinary validation error was broadly worse. Candidate validation MAE improved from `3.0584650236799114` to `2.9931343393335581`, weighted Spearman delta passed, weighted rank-MAE regression passed, and 264 of 485 evaluable validation rows had lower absolute error than the primary baseline.

**VERIFIED FACT:** The RMSE failure was overwhelmingly tail-concentrated. One 2021 WR row (`player_id=00-0035864`) produced:
- target `3.5036363636363634`;
- candidate `-105.44209159462447`;
- primary baseline `-2.78`;
- candidate absolute error `108.94572795826083`;
- baseline absolute error `6.283636363636363`;
- candidate squared error `11869.171640355376`.

That one row is:
- `65.26948081688898%` of all validation candidate SSE;
- `85.22012734440817%` of WR validation candidate SSE;
- an excess-SSE contribution of `11829.687554404964`, which is **126.5%** of the entire candidate-minus-baseline validation SSE gap.

**VERIFIED FACT:** All other validation rows combined have lower SSE than the baseline:
- candidate SSE excluding the catastrophic row: `6315.7005109244565`;
- baseline SSE on those same rows: `8794.247526786618`;
- difference: `-2478.547015862161`.

**VERIFIED FACT:** The same is true inside WR:
- WR candidate SSE excluding the catastrophic row: `2058.4907678306263`;
- WR baseline SSE on those same rows: `2651.1211853629975`;
- difference: `-592.6304175323712`.

**STRONG EVIDENCE:** The failed RMSE and WR gates are therefore principally a feature-space extrapolation/tail-control failure rather than broad ranking failure or broad WR underperformance.

## 1. Ordinary-error versus tail-error behavior

Validation rows: 485.

| Statistic | Candidate | Primary baseline |
| --- | ---: | ---: |
| MAE | 2.9931 | 3.0585 |
| RMSE | 6.1233 | 4.2678 |
| Median absolute error | 2.2037 | 2.1000 |
| P75 absolute error | 3.7945 | 4.3133 |
| P90 absolute error | 5.6820 | 6.7814 |
| P95 absolute error | 7.3610 | 9.1024 |
| P99 absolute error | 11.3383 | 12.5176 |
| Candidate-better rows | 264 | — |
| Baseline-better rows | — | 221 |

**VERIFIED FACT:** Candidate median absolute error was slightly worse, but the candidate had better P75/P90/P95/P99 absolute-error quantiles.

**STRONG EVIDENCE:** The model improved much of the upper ordinary-error distribution while simultaneously creating one catastrophic residual large enough to dominate squared-error risk.

### Validation SSE concentration

Top candidate-error rows, sorted by candidate squared error:

- top 1 row: `65.27%` of candidate SSE;
- top 3 rows: `67.23%`;
- top 5 rows: `68.71%`;
- top 10 rows: `71.67%`;
- top 25 rows: `77.64%`;
- top 10% of rows (49 rows): `83.13%`.

For comparison, the baseline's own top 25 error rows account for about `41.57%` of baseline SSE and its top 49 for about `57.96%`.

**VERIFIED FACT:** Candidate squared-error concentration is materially more extreme than baseline concentration.

Rows with candidate absolute error >= 10 PPR/game:
- candidate: 8 rows, contributing `70.63%` of candidate SSE;
- baseline: 16 rows, contributing `32.35%` of baseline SSE.

**INFERENCE:** The issue is not simply "more large errors." Candidate has fewer >=10-error rows than baseline, but one candidate error is extraordinarily larger than the rest. Tail *severity*, not tail *frequency*, is the dominant problem.

## 2. Season concentration

| Season | Candidate MAE | Baseline MAE | Candidate RMSE | Baseline RMSE | Candidate better rows |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2018 | 2.8812 | 2.9871 | 3.8162 | 4.0321 | 116 / 222 |
| 2019 | 3.3501 | 3.4984 | 4.4215 | 4.7032 | 121 / 220 |
| 2020 | 2.9007 | 3.1375 | 3.7237 | 4.1936 | 138 / 241 |
| 2021 | 3.0844 | 2.9804 | 7.7995 | 4.3398 | 126 / 244 |

**VERIFIED FACT:** Development 2018–2019 improved both MAE and RMSE.

**VERIFIED FACT:** Validation 2020 also improved both MAE and RMSE.

**VERIFIED FACT:** The RMSE failure emerges in 2021, where candidate RMSE jumps to `7.7995` versus baseline `4.3398`.

**STRONG EVIDENCE:** Development-to-validation drift is not a smooth degradation. The evidence shows a mostly stable/improving pattern through 2020 followed by a specific 2021 tail event.

## 3. Position concentration

Validation:

| Position | n | Candidate MAE | Baseline MAE | Candidate RMSE | Baseline RMSE |
| --- | ---: | ---: | ---: | ---: | ---: |
| QB | 74 | 4.0131 | 4.5608 | 5.0348 | 6.2149 |
| RB | 127 | 2.8903 | 3.4668 | 3.6799 | 4.4687 |
| WR | 185 | 3.2044 | 2.7311 | 8.6767 | 3.8136 |
| TE | 99 | 1.9678 | 2.0234 | 2.5851 | 2.7502 |

**VERIFIED FACT:** QB, RB, and TE improve on both MAE and RMSE across pooled validation.

**VERIFIED FACT:** WR alone carries the failed position-MAE gate.

WR by season:
- 2020 WR: candidate MAE `2.5129` vs baseline `2.6102`; candidate RMSE `3.1750` vs baseline `3.5410`.
- 2021 WR: candidate MAE `3.9187` vs baseline `2.8560`; candidate RMSE `11.9431` vs baseline `4.0761`.

Diagnostic-only removal of the single catastrophic row:
- pooled WR candidate MAE becomes `2.6297` vs baseline `2.7118`;
- pooled WR candidate RMSE becomes `3.3448` vs baseline `3.7958`;
- 2021 WR candidate MAE becomes `2.7517` vs baseline `2.8179`;
- 2021 WR candidate RMSE becomes `3.5133` vs baseline `4.0448`.

This removal is **not** a proposed scoring rule. It is used only to diagnose concentration.

**STRONG EVIDENCE:** WR degradation is tail-concentrated, not broad across the position.

## 4. Exact catastrophic-row mechanism

The catastrophic row is WR-classified and has unusual prior-season passing activity.

Frozen 2021 WR preprocessing/model state reconstructs the candidate prediction exactly.

Largest standardized feature excursions:

| Feature | Raw value | WR train mean | WR train scale | Standardized z |
| --- | ---: | ---: | ---: | ---: |
| prev1_int_pg | 2.0 | 0.0001776 | 0.0042108 | +474.93 |
| prev1_attempts_pg | 9.0 | 0.0050449 | 0.0300538 | +299.29 |
| prev1_pass_epa_pg | -11.9305 | 0.0028698 | 0.0503644 | -236.94 |
| prev1_pass_yards_pg | 13.0 | 0.0681169 | 0.5637912 | +22.94 |

Corresponding largest linear contributions:

- attempts/game: `-40.9164`;
- passing EPA/game: `-38.8333`;
- interceptions/game: `-27.3240`;
- passing yards/game: `-1.4595`.

The top three contributions alone sum to about `-107.07`. Model intercept is `6.6124`; the reconstructed final prediction is exactly `-105.4420915946245`.

Feature-distribution context for 2021 WR candidates:
- interceptions/game: P99 = 0, max = 2;
- attempts/game: P99 ~= 0.266, max = 9;
- passing EPA/game: P99 ~= 0.379, min = -11.931;
- passing yards/game: P99 ~= 4.656, max = 13.

**VERIFIED FACT:** Sparse passing features have very small WR training scales and can produce hundreds-of-standard-deviations extrapolation when a rare WR-classified row contains material passing usage.

**VERIFIED FACT:** The direct linear level model has no output bound, so those standardized excursions propagate linearly into an extreme expected-PPR/game prediction.

**STRONG EVIDENCE:** The universal 28-feature schema combined with per-position standardization exposes rare cross-role features to unstable extrapolation within positions where those features are almost always zero.

**INFERENCE:** This is a model-specification / preprocessing robustness problem more than a ranking-order problem.

## 5. Feature instability and regime sensitivity

Maximum absolute standardized WR candidate feature by target year:

- 2018: `18.49σ`;
- 2019: `52.91σ`;
- 2020: `19.66σ`;
- 2021: `474.93σ`.

WR passing-feature nonzero rates are low:
- attempts/game nonzero: roughly 2.6%–10.5% across 2018–2021;
- interceptions/game nonzero: 0%–0.64%;
- passing yards/game nonzero: roughly 1.3%–7.4%.

**STRONG EVIDENCE:** Sparse cross-role features were a latent extrapolation risk even before the terminal 2021 event.

**INFERENCE:** Small per-position scale estimates on structurally sparse features make ordinary z-score standardization fragile to future regime shifts.

**UNKNOWN:** Whether the same mechanism would recur in unopened 2022–2025 outcomes. WR-095 does not inspect those outcomes.

## 6. Ranking versus magnitude accuracy

WR-081 validation:
- weighted Spearman delta: `+0.015385257730562873` — PASS;
- weighted rank-MAE regression: `0.0054274084124830207` — PASS;
- pooled MAE lift: `0.02136061188881869` — PASS;
- pooled RMSE regression: `0.43477243995981046` — FAIL.

**VERIFIED FACT:** Relative ordering was acceptable under the frozen gates while magnitude risk was not.

**STRONG EVIDENCE:** A model can preserve or improve many ordinal relationships while still be unusable as a calibrated expected-PPR/game level forecast if a small number of values extrapolate catastrophically.

## 7. Candidate mechanism assessment

### Robust-loss regression

**Rationale:** A Huber-style objective reduces training influence from large residuals.

**Assessment:** Not selected as the primary change.

**Reason:** The verified failure is dominated by extreme *feature-space extrapolation* on a future row, not by evidence that a training target outlier pulled the fit. Huber loss alone does not bound predictions for a 200–475σ covariate.

**Overfitting risk:** Moderate if introduced solely because RMSE failed.

**Source impact:** None.

### Direct deterministic prediction clipping

**Rationale:** A fixed output bound would stop `-105`-scale predictions.

**Assessment:** Better than no guard, but a global PPR/game floor/ceiling would be difficult to defend without outcome-chasing and could truncate legitimate elite values.

**Overfitting risk:** High if the bound is chosen from the known 2021 failure.

### Fixed candidate/baseline blending

**Rationale:** Shrinking toward persistence could reduce model variance.

**Assessment:** Helpful conceptually, but a fixed blend does not itself prevent catastrophic extrapolation. Even a 50/50 blend of `-105.44` and `-2.78` remains extreme.

**Overfitting risk:** High if blend weight is selected from 2020–2021 metrics.

### Position-specific feature deletion

**Rationale:** Removing passing features from WR/RB/TE would remove the verified sparse cross-role mechanism.

**Assessment:** Plausible but not preferred. Hard semantic deletion after observing the 2021 WR row is more post-hoc than a generic extrapolation guard and could discard legitimate gadget-role signal.

**Overfitting risk:** Moderate-to-high.

### Alternative nonlinear model family

**Rationale:** Trees or other bounded local models can reduce linear extrapolation.

**Assessment:** Not selected. This is a materially larger family change without design evidence demonstrating the need; it also adds more tuning/complexity.

**Overfitting risk:** High.

### Feature clipping + bounded baseline-residual Ridge

**Rationale:** Directly addresses the verified mechanism while keeping the accepted source surface, per-position architecture, Ridge regularization, and primary persistence baseline.

**Assessment:** **Recommended.**

Generic controls:
1. after per-position StandardScaler, clamp every standardized feature to `[-6,+6]`;
2. fit Ridge(alpha=100) to residual target `target - prev1_ppr_pg`;
3. bound the predicted residual to training residual median +/- `3 * 1.4826 * MAD`;
4. final forecast = primary baseline + bounded residual adjustment.

The controls are row-generic and position-generic; they do not special-case the known WR row.

## 8. Post-hoc overfitting control

The following would be post-hoc if selected solely because they repair the known 2020–2021 result:

- excluding `00-0035864` or any named player;
- deleting WR passing features solely because that row used passing features;
- choosing a PPR/game floor or ceiling from the `-105.44` value;
- selecting a blend weight by minimizing 2020–2021 error;
- selecting z-clip threshold by searching 2020–2021;
- selecting residual-cap multiplier by searching 2020–2021;
- changing alpha from 100 after looking at exposed outcomes;
- replacing Ridge with Huber/tree/boosting because one candidate would have passed known validation;
- weakening RMSE or WR position thresholds so WR-081 would pass;
- calling 2020–2021 "validation" for v2.1 after using it for this design.

WR-095 avoids those practices:
- there is one fixed proposed candidate;
- alpha remains 100;
- no hyperparameter search was run;
- no exposed row is excluded;
- all WR-072 outcome gates remain numerically unchanged for future validation/confirmation;
- 2018–2021 are explicitly design-exposed.

## 9. Evidence classification summary

### VERIFIED FACT
- WR-081 validation improved pooled MAE but failed RMSE and WR position MAE.
- One 2021 WR row contributes 65.3% of total candidate validation SSE.
- That row contributes 85.2% of WR candidate SSE.
- All remaining validation rows collectively have lower SSE than baseline.
- All remaining WR rows collectively have lower SSE than baseline.
- The extreme prediction is reconstructed from hundreds-of-sigma sparse passing features in the WR scaler/model.
- 2020 WR improved versus baseline; 2021 WR degradation is driven by the catastrophic row.
- Ranking gates passed.
- Fallbacks and lineage failures were zero.

### STRONG EVIDENCE
- The primary WR-081 failure mechanism is uncontrolled covariate extrapolation / tail severity rather than broad ordinary-error degradation.
- Per-position z-score preprocessing is fragile for structurally sparse cross-role fields.
- A baseline-centered, bounded-adjustment architecture is better aligned with the failure than a broad model-family replacement.

### INFERENCE
- The residual formulation should reduce unnecessary level extrapolation because the strong persistence baseline becomes the forecast anchor.
- Generic z clipping plus residual bounding should reduce catastrophic magnitude risk without requiring a new source.
- Preserving Ridge alpha=100 lowers post-hoc model-selection risk.

### SPECULATION
- A different robust-loss family might outperform the proposed bounded-residual Ridge prospectively.
- Position-specific feature deletion might outperform generic clipping.

### UNKNOWN
- Performance on unopened 2022–2025 outcomes.
- Whether the catastrophic mechanism recurs in future seasons.
- Whether the proposed v2.1 candidate clears untouched validation/confirmation gates.

## Source / custody disposition

`EXISTING_ACCEPTED_SOURCE_SUFFICIENT`

The recommended protocol uses the same accepted WR-059 Player Summary Stats source surface and the same 28 derived feature formulas. New behavior is deterministic transformation/modeling of already-admitted fields. No new external data source is required.

## WR-095 boundary attestation

No model was fit or scored in WR-095. No hyperparameter search was run. No retained raw source was retrieved. No 2022–2025 outcome was exposed, joined, inferred, or scored. No 2026 regular-season outcome was inspected. No source was reacquired/substituted. No production/ranking/composition/Phase-6 work occurred.
