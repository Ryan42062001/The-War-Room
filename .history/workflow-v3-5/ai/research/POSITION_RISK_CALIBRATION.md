# WR-027 — Position-Specific Risk Calibration Study

Status: COMPLETE — MANAGER REVIEW REQUIRED  
Role: Research & Development (R&D)  
Production authorization: NONE

> The design section below was frozen before WR-027 model scoring. The results section was appended after deterministic execution; the rules were not retuned to the observed results.

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

### Benchmark reproduction

The WR-025 mean benchmark reproduced exactly before WR-027 conclusions were accepted:
- active rows: 1,881;
- unique returners: 886;
- baseline pooled MAE: `3.0261717096` — exact WR-025 match;
- Ridge pooled MAE: `2.8261944403` — exact WR-025 match;
- Ridge pooled Spearman: `0.6775088312` — exact WR-025 match.

This confirms WR-027 evaluated risk use against the same mean architecture rather than a silently shifted benchmark.

### Position-specific calibration

Pooled 2018–2025 OOS results:

| Position | Label | Prevalence | ROC AUC | PR AUC | Brier skill | ECE | Informative? |
|---|---|---:|---:|---:|---:|---:|---|
| QB | breakout | .239 | .772 | .521 | .159 | .047 | YES |
| QB | downside | .320 | .747 | .603 | .176 | .061 | YES |
| QB | low availability | .812 | .783 | .936 | .135 | .050 | NO under frozen tier-lift rule |
| RB | breakout | .167 | .637 | .251 | .016 | .029 | NO |
| RB | downside | .261 | .800 | .500 | .167 | .078 | YES |
| RB | low availability | .719 | .725 | .856 | .099 | .046 | YES |
| WR | breakout | .150 | .664 | .271 | .036 | .029 | YES |
| WR | downside | .219 | .782 | .435 | .123 | .062 | YES |
| WR | low availability | .705 | .734 | .852 | .131 | .033 | YES |
| TE | breakout | .116 | .454 | .113 | -.025 | .006 | NO |
| TE | downside | .116 | .835 | .471 | .196 | .011 | YES |
| TE | low availability | .707 | .730 | .856 | .119 | .039 | YES |

The strongest recurring result is downside discrimination. TE downside is especially strong; RB and WR are also useful. Breakout is substantially less transferable: QB is useful, WR is modest, RB fails the frozen rule, and TE breakout is not useful.

QB low-availability probability has strong discrimination/calibration metrics, but with prevalence above .80 the frozen `VERY HIGH >= 1.25x prevalence` rule is mathematically very demanding; it therefore does not qualify as `WARNING-INFORMATIVE`. QB still has qualifying downside evidence, so this does not alter the position policy.

### Warning tiers

The pooled warning tiers show operational separation for the primary downside signals:
- QB downside: NORMAL event rate 17.8% vs VERY HIGH 90.0% (VERY HIGH N=10);
- RB downside: NORMAL 10.3% vs VERY HIGH 53.8% (N=26);
- WR downside: NORMAL 8.5% vs VERY HIGH 62.1% (N=29);
- TE downside: NORMAL 2.1% vs VERY HIGH 58.8% (N=17).

Low-availability tiers also separate strongly at RB/WR/TE:
- RB: NORMAL 55.9% vs VERY HIGH 91.0%;
- WR: NORMAL 53.7% vs VERY HIGH 90.2%;
- TE: NORMAL 54.7% vs VERY HIGH 94.8%.

These are historical predictive-warning strata, not medical/injury probabilities and not causal effects.

### Ranking-use result

The prior-only candidate grid produced **zero eligible rank-modifier candidates in every position for every final scored season 2018–2025**.

Accordingly, the deterministic selector correctly chose `U=D=A=0` for all 32 season-position decisions. The final risk-modifier ranking therefore remained identical to the Ridge mean ranking rather than forcing a penalty unsupported by prior evidence.

This is a strong negative result for direct rank penalties: even when the warning probabilities contain useful information, no candidate consistently cleared the combined prior rank-MAE, projection-MAE, Spearman and severe-regression guard.

### Position-level policy decision

Under the frozen decision vocabulary:

| Position | Decision | Primary reason |
|---|---|---|
| QB | **WARNING-ONLY SUPPORTED** | downside warning qualifies; no rank modifier cleared prior guard |
| RB | **WARNING-ONLY SUPPORTED** | downside + low-availability warnings qualify; no rank modifier cleared prior guard |
| WR | **WARNING-ONLY SUPPORTED** | downside + low-availability warnings qualify; no rank modifier cleared prior guard |
| TE | **WARNING-ONLY SUPPORTED** | downside + low-availability warnings qualify; no rank modifier cleared prior guard |

**No position supports a direct risk-based rank modifier in WR-027.**

Recommended architecture implication for Manager consideration: retain expected-performance rank as the ordering signal and expose position-specific downside/availability warnings separately as explanations/decision context. This is research guidance only and is not a production authorization.

### Robust regression result

Huber did not establish a general replacement for Ridge.

| Position | Ridge MAE | Huber MAE | Ridge RMSE | Huber RMSE | Ridge rank MAE | Huber rank MAE | MAE bootstrap Huber-Ridge 95% CI |
|---|---:|---:|---:|---:|---:|---:|---|
| QB | 4.263 | 4.504 | 5.327 | 5.676 | 7.771 | 8.020 | `[+0.072,+0.424]` |
| RB | 2.785 | 2.798 | 3.645 | 3.828 | 10.456 | 10.758 | `[-0.071,+0.112]` |
| WR | 2.761 | 2.809 | 4.765 | 6.225 | 14.564 | 14.881 | `[-0.066,+0.225]` |
| TE | 1.954 | 1.909 | 2.783 | 2.571 | 9.702 | 9.692 | `[-0.129,+0.032]` |

QB Huber is clearly worse with clustered uncertainty entirely unfavorable. RB and WR do not improve. TE shows a modest central MAE/RMSE improvement, but its interval crosses zero, Spearman is slightly lower (`.6595` vs `.6615`), and p95 absolute error worsens (`5.366` vs `5.088`).

Disposition: **retain Ridge as the WR-025/WR-027 mean benchmark; do not replace it with Huber.**

### Rookie boundary

Unchanged. No rookie model was fit in WR-027. The WR-025 transparent position + draft-capital prior remains the accepted research baseline, and the richer rookie Ridge remains unvalidated.

### Prospective isolation / source integrity

- maximum statistical outcome season loaded: **2025**;
- 2026 regular-season outcomes inspected: **NO**;
- every nflverse historical asset was checked against the exact WR-025 recorded SHA-256 digest;
- WR-021 snapshot hash passed before and after execution;
- WR-023 protocol hash passed before and after execution;
- frozen WR-021 snapshot changed: **NO**;
- WR-023 protocol/manifest changed: **NO**.

### Reproducibility

Execution workflow run: `34426951155` — SUCCESS.

Artifact:
- ID: `10133084430`
- SHA-256: `67df16e013395d9c6d1336cdec621544c4e0b4015788950769dbe09dabb2f699`

Generated evidence:
- `.ai/research/generated/POSITION_RISK_RESULTS.json`
- `.ai/research/generated/POSITION_RISK_ASSET_VERIFICATION.json`
- `.ai/research/generated/POSITION_RISK_RELIABILITY.csv`
- `.ai/research/generated/POSITION_RISK_WARNING_TIERS.csv`
- `.ai/research/generated/POSITION_RISK_CALIBRATION_BY_SEASON.csv`
- `.ai/research/generated/POSITION_RISK_WEIGHT_SELECTION.csv`
- `.ai/research/generated/POSITION_RISK_RANK_ROLLING.csv`
- `.ai/research/generated/POSITION_RISK_ROBUST_ROLLING.csv`

The temporary execution workflow was removed after the successful evidence freeze and must not appear in the final research PR diff.

## WR-027 conclusion

The main projection signal survives intact, but risk belongs in a **separate warning/explanation layer**, not as a direct rank penalty under the tested evidence gate.

Position decisions:
- QB — `WARNING-ONLY SUPPORTED`
- RB — `WARNING-ONLY SUPPORTED`
- WR — `WARNING-ONLY SUPPORTED`
- TE — `WARNING-ONLY SUPPORTED`

Robust regression: Huber **not supported** as a Ridge replacement.

Production ranking changes authorized: **NONE**.