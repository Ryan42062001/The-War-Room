# WR-027 — Position-Specific Risk Calibration Study

Status: PRE-EXECUTION DESIGN FROZEN; RESULTS PENDING  
Role: Research & Development (R&D)  
Production authorization: NONE

> This design section is frozen before WR-027 model scoring. Results will be appended later without changing the rules below.

## Research question

WR-025 established a useful position-specific Ridge mean projection but showed that one universal risk overlay is unsafe. WR-027 asks, separately for QB/RB/WR/TE:

1. Are downside, breakout and low-availability probabilities useful and reasonably calibrated as warnings?
2. Does a rank modifier learned strictly from earlier chronological evidence improve ranking quality enough to justify changing rank?
3. Can a transparent robust linear mean model reduce Ridge tail errors without sacrificing its central projection/rank signal?

The study is retrospective/non-pristine at the project level. It is not a substitute for WR-023 prospective validation.

## Frozen data / cohort

Reuse WR-025 exactly for returning players:
- features: WR-025 `FEATURES` unchanged;
- mean benchmark: WR-025 standardized Ridge with alpha `100.0`;
- target seasons assembled: 2014–2025;
- final reported rolling-origin seasons: 2018–2025;
- target Y predictors: Y-1/Y-2 completed data plus immutable/preseason-known context only;
- active PPR/game scoring: target games >=1;
- zero-game returners remain in low-availability analysis;
- rookies excluded from returner calibration and retained only as a boundary/diagnostic reference.

No 2026 regular-season outcome may be requested or inspected.

## Frozen labels

Same WR-025 definitions:
- breakout/upside: active-returner residual `target_ppr_pg - baseline_ppr_pg >= +3.0`;
- downside/under-expectation: active-returner residual `<= -3.0`;
- low availability: target recorded games `<= 8`, including zero-game returners.

These are predictive/expectation-relative labels, not causal injury labels and not draft-cost bust labels.

## Mean projection benchmark

Primary mean benchmark is unchanged WR-025 Ridge:

`StandardScaler -> Ridge(alpha=100.0)`

fitted separately by position using only prior target seasons with >=1 target game.

## Position-specific risk models

For each position and each risk label:

`StandardScaler -> LogisticRegression(C=0.25, class_weight='balanced', solver='liblinear', max_iter=2000)`

Training is chronological. Breakout/downside fit only active rows; low availability includes all cohort rows.

### Chronological probability recalibration

Raw risk probabilities are recalibrated separately by position and label using only earlier out-of-sample historical predictions:

1. Generate raw rolling-origin probabilities for historical season S from a model trained only on seasons `< S`.
2. Before scoring later season Y, collect raw out-of-sample predictions from seasons `< Y`.
3. If at least 50 eligible prior OOS observations with both classes exist, fit a one-dimensional Platt recalibrator (`LogisticRegression(C=1e6, solver='lbfgs')`) to `logit(raw_probability)` versus the observed label.
4. Apply that prior-only recalibrator to Y's raw probabilities.
5. If the minimum calibration history is unavailable, use the raw position-specific probability and record that fallback.

No target-season outcome enters its own recalibration.

### Reliability metrics

Report by position and label where estimable:
- ROC AUC;
- average precision / PR AUC;
- prevalence;
- Brier score;
- climatology Brier score `p*(1-p)`;
- Brier skill `1 - Brier / climatology_Brier` when defined;
- log loss;
- expected calibration error (ECE) using fixed probability bins `[0,.2), [.2,.4), [.4,.6), [.6,.8), [.8,1]`;
- fixed-bin observed vs predicted reliability table.

### Position-specific warning tiers

For each target season/position/label, warning tiers are based on the distribution of *earlier OOS calibrated probabilities for that same position and label*:
- NORMAL: below prior median;
- ELEVATED: prior median through <75th percentile;
- HIGH: 75th through <90th percentile;
- VERY HIGH: >= prior 90th percentile.

If fewer than 50 prior OOS probabilities exist, fixed fallback cutoffs `.25/.50/.75` are used and flagged.

Report observed event rate by tier pooled across final 2018–2025 scoring folds.

### Warning-use evidence rule

A label is `WARNING-INFORMATIVE` for a position only if pooled 2018–2025 OOS evidence satisfies all:
- ROC AUC >= 0.65;
- average precision >= prevalence + 0.05;
- Brier skill > 0;
- VERY HIGH tier observed event rate >= 1.25x pooled prevalence.

Downside and low-availability warnings are the primary warning-use evidence. Breakout remains separately reported and may qualify but is not required for `WARNING-ONLY SUPPORTED`.

## Ranking alternatives

### A. Mean projection only
Rank by WR-025 Ridge expected PPR/game (`ridge_mu`).

### B. Mean projection + warnings separate
Ranking remains exactly `ridge_mu`. Risk probabilities/tiers are displayed analytically but have **no rank penalty**. This is the control for `WARNING-ONLY SUPPORTED`.

### C. Position-specific learned risk modifier

Candidate score family:

`risk_score = ridge_mu + U*p_breakout - D*p_downside - A*p_low_availability`

Frozen candidate grid:
- `U in {0.0, 0.5, 1.0, 1.5}`
- `D in {0.0, 0.5, 1.0, 1.5}`
- `A in {0.0, 0.5, 1.0}`

The grid is not changed after scoring.

For target season Y and position P, choose weights **only from earlier OOS seasons** for P. Prior candidate evidence must use at least two historical OOS seasons and at least 50 active player-season rows. A candidate is eligible only if, on the prior-only OOS history:
- mean season rank MAE improves >=2% versus Ridge mean-only;
- pooled PPR/game MAE of `risk_score` is no more than 2% worse than Ridge;
- pooled Spearman is no worse than Ridge by >0.01;
- at most one prior season has rank MAE >10% worse than Ridge;
- no prior season has rank MAE >20% worse than Ridge.

Among eligible candidates, select the one with the largest prior mean-rank-MAE improvement. Ties within `1e-6` are broken by smaller `U+D+A`, then lexicographic `(U,D,A)`.

If no candidate qualifies, set `U=D=A=0` for that target season/position. There is no target-season retuning.

## Final position-level rank-modifier guard

After final 2018–2025 OOS scoring, classify a position `RANK MODIFIER SUPPORTED` only if the learned modifier itself satisfies all:
- mean season rank MAE improves >=2% versus Ridge mean-only;
- pooled PPR/game MAE is no more than 2% worse than Ridge;
- pooled Spearman is no worse by >0.01;
- at most one scored season has rank MAE >10% worse than Ridge;
- no scored season has rank MAE >20% worse than Ridge.

If this rank guard fails but downside **or** low-availability is `WARNING-INFORMATIVE`, classify the position:

`WARNING-ONLY SUPPORTED`

Otherwise:

`INSUFFICIENT EVIDENCE`

No other decision vocabulary is allowed for WR-027 position policy.

## Robust mean-projection challenger

Fixed transparent challenger:

`StandardScaler -> HuberRegressor(epsilon=1.35, alpha=0.0001, max_iter=2000)`

No scored-season hyperparameter tuning.

Compare Huber vs Ridge by position on 2018–2025 OOS rows using:
- MAE;
- RMSE;
- Spearman;
- mean season rank MAE;
- absolute-error p90 and p95;
- player-clustered paired MAE bootstrap, 2,000 replicates, deterministic position-specific seeds beginning at `27027`.

Huber is not promoted merely for lower RMSE/tail error if central MAE or rank quality materially worsens.

## Rookie boundary

Rookies remain separate. WR-025's transparent draft-capital prior remains the only accepted rookie benchmark in this lane. WR-027 does not fit rookies into returner calibration and does not claim a validated rookie model.

## Integrity gates

Before and after execution, verify byte-identical:
- WR-021 snapshot SHA-256 `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`;
- WR-023 protocol SHA-256 `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`.

WR-027 must not modify production files or `.ai/shared/*`.

## Results

Pending execution under the frozen design above.