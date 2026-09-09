# WR-025 — Historical Ranking Signal / Breakout-Bust Analysis

Task: WR-025  
Role: Research & Development (R&D)  
Classification: **MORE EVIDENCE NEEDED**  
Production authorization: NONE

## Executive result

WR-025 finds a **real and historically stable mean-projection signal for returning players**, plus useful position-specific downside warnings, but the predeclared universal risk-adjusted ranking overlay is not robust enough to recommend even research promotion as a finished ranking method.

On chronological rolling-origin target seasons 2018–2025, the position-specific standardized Ridge mean projection improves pooled returning-player next-season Full-PPR points/game MAE from **3.0262 to 2.8262**, a **6.61% improvement**. Pooled Spearman improves from **0.6359 to 0.6775**. A repeated-player-aware paired bootstrap across 886 unique returners gives Ridge-minus-baseline MAE delta mean **-0.1993 PPR/game** with 95% interval **[-0.3235, -0.0616]**, fully favorable.

The fixed risk overlay:

`prototype_score = ridge_mu + 1.5*(p_breakout - p_downside) - 0.75*p_lowavail`

improves ranking error for QB and RB, but worsens WR mean rank MAE by **5.51%** and TE by **6.20%** versus the transparent previous-season PPR/game baseline. Average position rank MAE is also slightly worse overall (10.9808 vs 10.9309). Under the predeclared gate, this prevents a `PROMISING` classification.

The most practical finding is therefore not “use one universal breakout/bust adjustment.” It is:

1. **use multi-year prior production, usage, age/experience and draft capital to improve expected performance estimates;**
2. **treat downside signals as position-specific warning context rather than automatically applying one global rank penalty;**
3. **keep rookie handling separate;** and
4. **do not call expectation-relative misses true draft-cost busts without a sufficiently broad lawful market benchmark.**

## Integrity and prospective isolation

WR-025 loaded historical Player Summary Stats only through **2025**. It did not inspect or score 2026 regular-season outcomes.

The execution workflow verified both frozen prospective artifact hashes before and after the historical experiment:

- WR-021 2026 snapshot SHA-256: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`
- WR-023 protocol SHA-256: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`

Both checks passed before and after model execution. Neither frozen artifact was modified.

## Rights-clean sources

### Core historical study

Admitted:

1. **nflverse Player Summary Stats** — CC BY 4.0; historical regular-season production/opportunity/outcomes through 2025.
2. **nflverse Players** — CC BY 4.0; only immutable/stable identity metadata such as GSIS ID, birth date, rookie season, and deterministic external-ID crosswalks.
3. **nflverse Draft Picks** — CC BY 4.0; draft-time position, round, overall selection, and GSIS identity. Career-result fields are ignored.

Exact release/asset IDs, update timestamps and independently calculated SHA-256 values are recorded in `.ai/research/generated/HISTORICAL_RANKING_ASSET_MANIFEST.json`.

### Historical draft-cost investigation

A lawful source was identified: **`dynastyprocess/data-mfl_public`**, whose repository license is CC0 1.0 and which contains actual public MyFantasyLeague/SafeLeagues draft records.

The source was **not admitted as a benchmark** because the predeclared comparable-market gate failed. After requiring:

- redraft league naming;
- 1QB;
- non-best-ball;
- exactly 12 franchises;
- scoring flags explicitly indicating PPR but not half-PPR;
- explicit draft player ID and pick data;

only **6 eligible league drafts** remained across 2019–2021, far below the frozen minimum of 100.

Therefore WR-025 makes **no claim of true historical ADP/ECR/draft-cost bust performance**. “Downside” below means performance under the transparent preseason expectation, not failure versus fantasy acquisition cost.

### Excluded

No PFF/PFF-derived data, NFL Pro/NGS systematic data, FantasyPros historical/API rankings, ambiguous-rights scraped ADP, or target-season hindsight context entered the study.

## Cohort and chronology

Returning-player cohort for target season Y is defined from the completed Y-1 regular season before target outcomes are joined.

- Total historical returner player-seasons assembled: **5,176**
- Active returning player-season rows scored in 2018–2025: **1,881**
- Unique scored returners: **886**
- Drafted-rookie historical player-seasons: **949**

For every scored target year 2018–2025, the model is trained only on earlier target seasons. 2022–2025 are chronologically out-of-sample for each fold but are explicitly not called pristine project-level holdouts because prior War Room research had already observed those seasons.

## Expectation-relative outcome definitions

Returning-player baseline:

`previous-season Full-PPR points per recorded game`

For an active target-season returner:

`residual = actual next-season PPR/game - baseline PPR/game`

Frozen labels:

- **breakout/upside:** residual >= **+3.0 PPR/game**
- **performance downside / under-expectation:** residual <= **-3.0 PPR/game**
- **low availability:** target recorded games <= **8**, including zero-game cohort members

The low-availability target is a recorded-games outcome proxy, not an injury diagnosis.

## Mean projection result

| Model | N | MAE | RMSE | Spearman |
|---|---:|---:|---:|---:|
| Previous-season PPR/game baseline | 1,881 | 3.0262 | 4.2460 | 0.6359 |
| **Interpretable Ridge** | 1,881 | **2.8262** | **4.2364** | **0.6775** |
| Fixed Gradient Boosting diagnostic | 1,881 | 2.8100 | **3.6764** | 0.6703 |

Ridge MAE lift versus baseline: **6.61%**.

The higher-capacity challenger achieves slightly lower MAE and materially lower RMSE, but its Spearman is below Ridge and it is intentionally diagnostic. The primary interpretable result remains the Ridge model.

### Important stability caution

The pooled Ridge MAE result is favorable, but its RMSE improvement is small because some season-position folds produce large misses. A notable example is 2021 WR, where Ridge MAE is 3.633 versus baseline 2.856 and Ridge RMSE rises to roughly 10.07. This indicates occasional linear extrapolation instability despite favorable pooled MAE and is one reason not to treat the historical prototype as production-ready.

## Repeated-player-aware uncertainty

Bootstrap unit: unique GSIS player ID, retaining every scored season belonging to the sampled player.

- clusters: **886**
- replicates: **2,000**
- deterministic seed: **25026**
- statistic: Ridge absolute error minus baseline absolute error
- mean delta: **-0.1993 PPR/game**
- 95% percentile interval: **[-0.3235, -0.0616]**

The interval excludes zero/worse and supports the conclusion that the pooled mean-projection lift is not explained only by treating repeated player-seasons as independent.

# Position-specific stable signals

These are predictive associations from standardized regularized models, not causal effects. Closely related production/usage fields are multicollinear, so the exact coefficient magnitude should not be interpreted as an isolated causal contribution.

A feature is listed as stable only when its coefficient direction is consistent in at least 75% of at least six estimable rolling seasons and median absolute standardized coefficient is at least 0.05.

A feature can legitimately appear both as a positive absolute-performance signal and as a downside-vs-expectation warning. Example: very high prior volume predicts a stronger absolute player but can also raise regression risk relative to an already-high baseline.

## QB

### Strongest positive ranking indicators

1. **Prior games / two-year availability continuity** — `prev1_games` and `prev2_games` are the strongest stable positive expected-performance coefficients. More established playing continuity is associated with stronger next-season PPR/game.
2. **Two-year PPR level** — `prev2_ppr_pg` and recency-weighted PPR remain strongly positive, supporting multi-season smoothing rather than one-year-only ranking.
3. **Prior passing EPA/game** — stable positive expected-performance and breakout association.
4. **Passing TDs/game** — stable positive expected-performance signal.
5. **Carries/game** — stable positive expected performance and breakout association; QB rushing opportunity remains valuable.
6. **Drafted status / draft capital** — draft pedigree retains a measurable signal even for returners.

### Strongest warning/downside indicators

1. **Large positive one-year PPR jump (`ppr_delta`)** — stable negative expected-performance coefficient and positive downside coefficient, consistent with mean-reversion risk after a surge.
2. **High prior passing yards/attempts/PPR relative to the baseline expectation** — several high-volume prior fields become downside-positive even while related production fields support absolute value. This is expectation regression, not a reason to rank productive QBs low.
3. **Later NFL draft capital (`log_draft_pick`)** — stable negative expected-performance / positive downside association.
4. **Some efficiency-only fields, especially prior Y/A, are unstable/mixed when conditioned on broader production** — warning against treating one efficiency ratio as a standalone ranking boost.

### Diagnostic quality

- breakout AUC: **0.776**
- downside AUC: **0.757**
- top predicted breakout quintile event rate: **55.0%** vs overall 23.9%
- top predicted downside quintile event rate: **56.7%** vs overall 32.0%

QB is the strongest breakout-discrimination position in this first pass.

## RB

### Strongest positive ranking indicators

1. **Rushing yards/game** — strongest stable absolute-performance signal.
2. **Target share** — strong positive expected-performance and breakout association; receiving role materially separates RB value.
3. **WOPR / receiving opportunity proxy** — positive expected-performance and breakout signal even at RB.
4. **Prior and recency-weighted PPR/game** — stable absolute-value signal.
5. **Prior games** — positive continuity signal.
6. **Rushing efficiency (`rush_ypc`)** — smaller but stable positive association after regularization.
7. **Carries/game** — positive expected-performance signal.

### Strongest warning/downside indicators

1. **Very high prior carries/game** — strongly downside-positive relative to the player's already-elevated expectation. This does not mean carries are bad; it means extreme workload is associated with greater probability of falling materially below its own prior PPR/game baseline.
2. **High prior receptions/game** — similarly raises expectation-relative downside probability when the baseline is already strong.
3. **Age** — stable negative expected-performance and positive downside association for RBs.
4. **Later draft capital / later round** — stable warning signal.
5. **Receiving yards per target** — mixed as an absolute signal and downside-positive, suggesting efficiency spikes should not be trusted like durable opportunity.

### Diagnostic quality

- breakout AUC: **0.643**
- downside AUC: **0.802**
- top predicted breakout quintile event rate: **28.4%** vs overall 16.7%
- top predicted downside quintile event rate: **50.5%** vs overall 26.1%

The downside model is substantially more useful than the breakout model at RB.

## WR

### Strongest positive ranking indicators

1. **Receiving yards/game** — strongest stable expected-performance signal.
2. **Two-year PPR/game level** — very strong signal; prior history beyond one season adds value.
3. **Recency-weighted PPR/game** — stable positive.
4. **Receiving EPA/game** — stable positive expected-performance and breakout support.
5. **Receptions/game and targets/game** — durable opportunity signals for absolute next-season performance.
6. **Receiving TDs/game** — positive expected performance, although high TD rate also appears as a downside regression warning.
7. **Air-yards share** — smaller but stable positive breakout/expected-performance signal.

### Strongest warning/downside indicators

1. **Age** — one of the clearest WR warnings: stable negative expected-performance coefficient and positive downside association.
2. **Later draft capital / later draft round** — consistent negative value/downside signal.
3. **Large prior target volume** — positive for absolute quality but strongly downside-positive versus the prior baseline, again reflecting regression risk after an elevated opportunity season.
4. **Prior receiving TD rate** — downside-positive, consistent with TD-rate regression risk.
5. **Receiving yards/target** — downside-positive and only weakly useful for expected performance after accounting for volume.
6. **Large positive PPR trend** — stable downside warning / negative conditional expected-performance association.

### Diagnostic quality

- breakout AUC: **0.669**
- downside AUC: **0.787**
- top breakout quintile event rate: **27.1%** vs overall 15.0%
- top downside quintile event rate: **45.7%** vs overall 21.9%

Again, downside discrimination is stronger than breakout discrimination.

## TE

### Strongest positive ranking indicators

1. **Receiving yards/game** — the clearest TE signal; strong positive expected-performance and breakout coefficients.
2. **Target share** — stable positive expected-performance and breakout association.
3. **Air-yards share and WOPR** — stable positive opportunity-quality signals.
4. **Multi-year / weighted PPR level** — stable positive.
5. **Receptions/game** — positive absolute-performance signal.
6. **Receiving EPA/game** — smaller positive support.

### Strongest warning/downside indicators

1. **High prior receptions/targets** — very strong downside-vs-own-expectation indicators despite being positive for absolute value.
2. **High prior receiving TD rate** — strong downside warning, consistent with regression.
3. **Large positive one-year PPR trend** — stable downside warning.
4. **High prior PPR/game / weighted PPR** — can predict absolute quality while simultaneously increasing risk of a >=3 PPR/game decline from that high baseline.
5. **Later draft capital** — stable negative/downside signal.
6. **Experience** — downside/low-availability warning in the conditioned model.

### Diagnostic quality

- breakout AUC: **0.600**
- downside AUC: **0.841**
- top breakout quintile event rate: **16.9%** vs overall 11.6%
- top downside quintile event rate: **32.5%** vs overall 11.6%

TE is the clearest example of the overall WR-025 finding: **warning/downside prediction is much stronger than breakout prediction**.

# Cross-position findings

## Signals with the clearest general support

### Positive / rank-up context

- **multi-year PPR level beats relying only on last season**;
- **durable opportunity volume matters**: carries for RB/QB and targets/receptions/receiving yards for WR/TE;
- **share-based receiving opportunity** (target share/WOPR/air-yards share) is especially useful for RB/WR/TE;
- **NFL draft capital remains informative**, including beyond the rookie year;
- **QB rushing opportunity and passing EPA** provide useful context beyond raw passing yardage;
- **recent games played / continuity** is particularly useful at QB and contributes elsewhere.

### Warning / rank-risk context

- **large positive one-year performance jumps** often carry mean-reversion risk;
- **age is a particularly strong RB/WR downside warning**;
- **later NFL draft capital** is a consistent negative signal;
- **efficiency spikes without durable opportunity** are less trustworthy than volume/share signals;
- **high TD rates and extreme prior volume** can be downside-vs-own-baseline warnings even when the player remains strong in absolute terms.

## Important interpretation rule

“Positive signal” and “warning signal” answer different questions:

- expected-performance coefficients ask, “who should project better in absolute terms?”
- downside coefficients ask, “who is more likely to fall >=3 PPR/game below the expectation created by last year's performance?”

A high-volume player can correctly score highly on both. That means **good player, elevated regression risk**, not contradictory evidence.

# Breakout vs downside modeling

The first-pass breakout classifiers are only moderately useful outside QB. Downside classifiers are more consistently discriminative:

| Position | Breakout AUC | Downside AUC |
|---|---:|---:|
| QB | 0.776 | 0.757 |
| RB | 0.643 | **0.802** |
| WR | 0.669 | **0.787** |
| TE | 0.600 | **0.841** |

This supports a product-research direction where downside flags are shown as **risk/warning context** rather than mechanically subtracting the same score amount at every position.

# Research-only ranking prototype

## Frozen formula

`prototype_score = ridge_mu + 1.5*(p_breakout - p_downside) - 0.75*p_lowavail`

No weights were tuned after seeing 2018–2025 outcomes.

## Ranking results by position

| Position | Baseline rank MAE | Ridge rank MAE | Risk prototype rank MAE | Prototype delta vs baseline | Baseline top-N | Prototype top-N |
|---|---:|---:|---:|---:|---:|---:|
| QB | 8.611 | 7.771 | **7.755** | **-9.95%** | 0.615 | 0.625 |
| RB | 10.962 | **10.456** | 10.621 | **-3.11%** | 0.688 | **0.729** |
| WR | **14.441** | 14.564 | 15.236 | **+5.51% worse** | **0.760** | 0.747 |
| TE | 9.709 | **9.702** | 10.312 | **+6.20% worse** | **0.646** | 0.615 |

Pooled Spearman:
- baseline: **0.6359**
- Ridge mean projection: **0.6775**
- risk-adjusted ranking score: **0.6643**

The overlay helps QB/RB but loses information at WR/TE. The predeclared gate requires no position >5% worse, so this fails decisively rather than being hidden by pooled results.

## Why not simply tune the weights now?

That would convert the same already-observed 2018–2025 seasons into a tuning target after seeing the failure and would undermine the value of the preregistration. WR-025 therefore preserves the failed fixed overlay. A successor research task could predeclare position-specific calibration on earlier development years and reserve later years for a new comparison.

# Rookie findings

Rookies remain materially different from returners.

Active drafted-rookie pooled performance:

| Model | N | MAE | Spearman |
|---|---:|---:|---:|
| Transparent position + draft-bucket prior | 387 | **2.9379** | **0.4980** |
| Rookie Ridge (age + draft capital) | 387 | 3.1438 | 0.4926 |

The Ridge model is worse on pooled rookie MAE, consistent with WR-021's negative rookie finding.

Draft capital itself is nevertheless extremely stable directionally: later overall selection and later round have negative coefficients in every scored season for QB/RB/WR/TE rookie models. Age also trends negatively in every position's rookie coefficient history. Those are useful **signals**, but this feature set does not beat the simple rolling position+draft-bucket prior.

Conclusion: do not merge returning-player and rookie ranking logic merely because both use draft capital.

# Historical draft-cost / ADP status

**Lawful source found; benchmark not established.**

The CC0 SafeLeagues archive is useful evidence that a rights-clean market-cost study may be possible, but this first strict PPR-redraft slice is too small. Only 6 league drafts survived the predeclared comparable-market filters.

Therefore:
- no true ADP comparison is reported;
- no player is labeled a fantasy-draft-cost “bust” from WR-025;
- all “downside” terminology remains expectation-relative;
- a future market-cost task would need a broader rights-clean archive or a separately predeclared, defensible relaxation of league-format filters before outcomes are analyzed under that new design.

# Null, mixed, and cautionary findings

1. **Universal risk penalties do not transfer cleanly across positions.** The fixed overlay fails WR/TE rank stability despite helping QB/RB.
2. **Breakout prediction is much weaker than downside prediction at TE and RB.** Do not oversell breakout probabilities.
3. **Efficiency-only features are often less stable than opportunity/share.** Examples include yards per target and QB yards per attempt after conditioning on richer context.
4. **Multi-collinearity is substantial.** PPR, yards, targets, receptions, EPA and share measures overlap. Coefficient direction stability is more reliable than interpreting a coefficient as an isolated effect.
5. **Ridge can produce severe fold-specific extrapolation.** The pooled mean result is favorable, but robustification/calibration deserves separate research.
6. **Rookie enrichment remains unsolved.** Draft capital is informative, yet the simple rookie prior still wins pooled MAE.
7. **No lawful broad historical ADP benchmark was established.** That limits direct fantasy-draft-cost conclusions.

# Predeclared evidence gate

| Gate | Result |
|---|---|
| Stable positive + warning signals in >=3/4 positions | **PASS — all 4** |
| Ridge pooled MAE improvement >=2% | **PASS — 6.61%** |
| Repeated-player bootstrap 95% upper bound <0 | **PASS — upper -0.0616** |
| Risk prototype pooled Spearman non-worse | **PASS — 0.6643 vs 0.6359** |
| Average position rank MAE improves | **FAIL — slightly worse overall** |
| No position rank-MAE regression >5% | **FAIL — WR +5.51%, TE +6.20%** |
| Rights/leakage/frozen-artifact integrity | **PASS** |

Because all conditions were required, the final gate fails.

# Final classification

**MORE EVIDENCE NEEDED**

This is not a null result. WR-025 establishes useful stable historical ranking and downside indicators, and the interpretable mean projection materially beats the transparent historical baseline. What is not established is a single risk-adjusted ranking formula that safely improves all positions.

## Best next research direction

If Manager authorizes a successor, the most defensible next step is a **position-specific risk-calibration study** rather than adding more model complexity:

- preserve the current expected-performance Ridge signal as the benchmark;
- separate “projection” from “warning badges/risk context”;
- use earlier seasons to predeclare/calibrate position-specific downside adjustments;
- hold later historical seasons out from that new calibration where possible;
- consider robust/Huber-style expected-performance regression to reduce severe Ridge extrapolation;
- keep rookies separate;
- continue searching only for clearly licensed market-cost data if true draft-cost bust research remains desired.

Even a successful successor remains research-only until Manager explicitly creates a production milestone and WR-023's pristine 2026 prospective gate is eventually evaluated.

# Reproducibility

Research run: `34400961071` — SUCCESS.

Artifact:
- ID: `10123492844`
- SHA-256: `2e945ae17850f9c4aac2731f5bf6901a9e4f10385fe0cbf496e379dd47be1187`

Generated evidence:
- `.ai/research/generated/HISTORICAL_RANKING_RESULTS.json`
- `.ai/research/generated/HISTORICAL_RANKING_ASSET_MANIFEST.json`
- `.ai/research/generated/HISTORICAL_RANKING_SIGNAL_TABLE.csv`
- `.ai/research/generated/HISTORICAL_RANKING_ROLLING_METRICS.csv`
- `.ai/research/generated/HISTORICAL_RANKING_PERMUTATION_IMPORTANCE.csv`

No large raw historical dataset is committed.

# Production safety

Production rankings changed: **NO**  
Production files changed: **NO**  
Canonical `.ai/shared/*` changed: **NO**  
WR-021 frozen snapshot changed: **NO**  
WR-023 frozen protocol/manifest changed: **NO**  
2026 regular-season outcomes inspected: **NO**
