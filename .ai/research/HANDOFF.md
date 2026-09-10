# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-025  
Role: Research & Development (R&D)  
Status: COMPLETE — MANAGER REVIEW REQUIRED

## Verified starting state

- refreshed canonical `main`: `69689edadab5c8f270bc483b6acc461274ec7f87`
- active wave: PW-003
- WR-025 production authorization: NONE
- WR-021 snapshot / WR-023 protocol already accepted and frozen
- production ranking authority: FantasyPros under WR-D001
- no existing WR-025 branch or PR at start

## Branch

`wr-025-historical-ranking-signals`

## Starting SHA

`69689edadab5c8f270bc483b6acc461274ec7f87`

## Objective completed

Used rights-clean historical football data to identify stable preseason-known positive ranking signals and warning/downside signals by position and built a research-only rolling-origin historical ranking prototype.

A lawful historical draft-cost source was investigated separately. The source rights were acceptable, but the predeclared comparable-market sample-size gate failed, so no historical ADP/draft-cost benchmark was admitted.

## Prospective isolation / frozen artifacts

WR-025 inspected **no 2026 regular-season outcome**.

The experiment runner hard-caps historical Player Summary Stats at 2025.

Execution verified these frozen identities both before and after historical scoring:

- WR-021 snapshot SHA-256: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`
- WR-023 protocol SHA-256: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`

Both integrity checks passed.

WR-021 snapshot changed: **NO**  
WR-023 protocol/manifest changed: **NO**  
2026 outcomes inspected: **NO**

## Sources used

### nflverse Player Summary Stats

- repository: `nflverse/nflverse-data`
- release tag: `stats_player`
- license: CC BY 4.0
- loaded assets: historical `stats_player_regpost_2012.csv` through `stats_player_regpost_2025.csv` only
- target-season predictor leakage: prohibited

Release ID during execution: `236670328`.

### nflverse Players

- release tag: `players`
- license: CC BY 4.0
- permitted use: GSIS identity, player name, birth date, rookie season, deterministic MFL-ID crosswalk only
- current team/status/position and PFF fields: not used as historical predictors

Execution asset:
- release ID `69785162`
- asset ID `552739287`
- SHA-256 `a33998d3981bda4f49f40390c5c0fa30036112ee1ea5de19ed4609e2ad3be3e2`

### nflverse Draft Picks

- release tag: `draft_picks`
- license: CC BY 4.0
- permitted use: draft-time position, pick/round/team, deterministic GSIS identity
- hindsight career-result fields: ignored

Execution asset:
- release ID `66254658`
- asset ID `552425724`
- SHA-256 `6ec4a9b69ab16c6da5219554b8954f114b59e47bafb1cb6c476f672a5f25d02a`

### SafeLeagues / public MFL archive — rights-cleared investigation, benchmark NOT admitted

Repository: `dynastyprocess/data-mfl_public`  
Pinned identity investigated: `9b8f37152036b44b1a5baeb35f70482b1d3369f8`  
License: CC0 1.0 Universal

Candidate public draft/league records for 2019–2021 had explicit league and draft schema. The frozen comparable-market filter required:
- redraft naming;
- 1QB;
- not best ball;
- 12 teams;
- explicit PPR scoring flags and not half-PPR;
- deterministic player/pick data.

Only **6** eligible league drafts survived versus the predeclared minimum of 100.

Disposition: **NOT ADMITTED** as historical ADP/draft-cost benchmark.

Therefore WR-025 does not make true draft-cost “bust” claims.

## Rights evidence

- nflverse repository data family: CC BY 4.0, same family already accepted by prior War Room research.
- `dynastyprocess/data-mfl_public`: repository `LICENSE` explicitly CC0 1.0 Universal.
- open-source software that merely scrapes upstream FantasyPros/FFC/MFL/etc. was not treated as conferring rights to upstream data.
- FantasyPros historical/API, PFF/PFF-derived, NFL Pro/NGS systematic, paid/private, ambiguous scraped data: excluded.

Exact downloaded historical asset provenance and SHA-256 values are in:
`.ai/research/generated/HISTORICAL_RANKING_ASSET_MANIFEST.json`.

## Historical cohort definition

### Returning players — primary

For target Y:
- every QB/RB/WR/TE with a completed Y-1 regular-season summary row enters before target outcomes are joined;
- target missing row remains 0 games / 0 season PPR for availability/total analysis;
- PPR/game scoring requires >=1 target recorded game because PPR/game is undefined at zero.

Historical target seasons assembled: 2014–2025.  
Rolling scored seasons: **2018–2025**.  
Every scored season uses only earlier target seasons for training.

Returner cohort:
- 5,176 historical player-seasons assembled
- 1,881 active scored rows in 2018–2025
- 886 unique scored returners

### Drafted rookies — diagnostic

Drafted QB/RB/WR/TE from draft-time nflverse records with valid overall pick + GSIS ID. Target participation does not define membership.

Rookie historical cohort: 949 player-seasons.

## Expectation / baseline definition

Returning primary baseline:
`previous-season Full-PPR points per recorded game`.

Rookie baseline:
rolling historical position + draft-pick-bucket prior learned only from earlier seasons.

Availability baseline:
previous-season recorded games for returners.

## Breakout definition

For active returners:

`target PPR/game - previous-season PPR/game >= +3.0`

This is expectation-relative upside, not a draft-cost breakout definition.

## Bust / downside definition

For active returners:

`target PPR/game - previous-season PPR/game <= -3.0`

Terminology used in the report: **performance downside / under-expectation**.

It is not called a true fantasy-draft-cost bust because no sufficiently broad lawful historical market-cost benchmark was admitted.

Separate availability warning:
`target recorded games <= 8`, including zero-game cohort members.

This is not a medical injury model.

## Interpretable models

All position-specific and chronological:

- expected performance: standardized Ridge, alpha 100
- breakout: standardized L2 logistic, C 0.25, balanced classes
- downside: same fixed logistic specification
- low availability: same fixed logistic specification
- diagnostic nonlinear challenger: fixed Gradient Boosting, no scored-season tuning

Stable signal criterion was frozen before scoring:
- >=6 estimable scored seasons;
- same coefficient direction >=75%;
- median absolute standardized coefficient >=0.05 for strongest-list reporting.

## Strongest positive signals

### QB

- prior games / two-year playing continuity
- two-year and recency-weighted PPR level
- prior passing EPA/game
- prior passing TD/game
- QB carries/game / rushing opportunity
- NFL draft pedigree

### RB

- prior rushing yards/game
- target share
- WOPR / receiving opportunity
- prior/weighted PPR level
- prior games
- rushing efficiency as a smaller supporting signal
- carries/game for absolute expected performance

### WR

- prior receiving yards/game
- two-year PPR level
- recency-weighted PPR
- receiving EPA/game
- receptions/game and targets/game
- receiving TD/game
- air-yards share as breakout/expected-performance support

### TE

- receiving yards/game
- target share
- air-yards share / WOPR
- multi-year PPR level
- receptions/game
- receiving EPA/game

## Strongest warning / downside signals

Warnings are conditional expectation-risk signals, not automatic rank-down instructions.

### QB

- large positive one-year PPR jump / mean-reversion risk
- later NFL draft capital
- some high prior volume/production measures predict downside versus an already-high baseline
- isolated passing-efficiency ratios are mixed after richer context

### RB

- age
- later draft capital / later round
- extremely high prior carries/receptions can increase downside versus their own elevated baseline
- receiving yards/target is less trustworthy than durable share/volume

### WR

- age — one of the clearest stable WR warnings
- later draft capital / round
- elevated prior target volume can increase under-expectation risk relative to an already-high baseline
- high receiving TD rate / efficiency spikes show regression risk
- large positive one-year PPR jump

### TE

- high prior receptions/targets relative to baseline
- high receiving TD rate
- large positive one-year PPR jump
- later draft capital
- experience as downside/low-availability context

## Important interpretation

The same feature can be:
- positive for **absolute expected performance**, and
- positive for **downside versus last year's already-high expectation**.

Example: high carries/targets can identify a good player while also identifying greater regression risk relative to that strong baseline. WR-025 does not present that as a contradiction or causal finding.

## Breakout/downside diagnostic quality

ROC AUC by position:

| Position | Breakout | Downside |
|---|---:|---:|
| QB | 0.776 | 0.757 |
| RB | 0.643 | 0.802 |
| WR | 0.669 | 0.787 |
| TE | 0.600 | 0.841 |

Primary interpretation:
- downside discrimination is materially stronger than breakout discrimination at RB/WR/TE;
- TE breakout model is weak;
- QB breakout discrimination is the strongest first-pass breakout result.

This supports treating downside models as warning/context research rather than applying a universal rank penalty.

## Ranking prototype

Frozen before scoring:

`prototype_score = ridge_mu + 1.5*(p_breakout - p_downside) - 0.75*p_lowavail`

The weights were not tuned after observing results.

### Pooled mean projection

Baseline:
- MAE 3.0262
- RMSE 4.2460
- Spearman 0.6359

Ridge:
- MAE **2.8262**
- RMSE 4.2364
- Spearman **0.6775**

Ridge MAE improvement: **6.61%**.

Repeated-player bootstrap:
- 886 player clusters
- 2,000 reps / seed 25026
- Ridge-minus-baseline MAE delta mean `-0.1993`
- 95% interval **[-0.3235, -0.0616]**

### Risk-adjusted ranking result

Mean position rank MAE:
- QB: baseline 8.611 -> prototype **7.755** (9.95% improvement)
- RB: baseline 10.962 -> prototype **10.621** (3.11% improvement)
- WR: baseline 14.441 -> prototype **15.236** (**5.51% worse**)
- TE: baseline 9.709 -> prototype **10.312** (**6.20% worse**)

Pooled Spearman:
- baseline 0.6359
- Ridge mean projection 0.6775
- risk prototype 0.6643

Average position rank MAE is slightly worse overall for the risk prototype (10.9808 vs 10.9309 baseline).

The predeclared universal overlay therefore fails the final ranking-stability gate.

## Nonlinear challenger

Fixed Gradient Boosting pooled:
- MAE 2.8100
- RMSE 3.6764
- Spearman 0.6703

It improves RMSE substantially but does not displace Ridge as the primary interpretable research model. Permutation-importance evidence is retained separately and does not change the classification.

## Rookie findings

Transparent rookie prior:
- N 387 active drafted-rookie rows
- MAE **2.9379**
- Spearman 0.4980

Rookie Ridge using age + draft capital:
- MAE **3.1438** — worse
- Spearman 0.4926

By MAE, Ridge is worse at QB/RB/WR and slightly better at TE.

Draft capital remains extremely directionally stable: later overall pick / later round coefficients are negative in all scored seasons for all four rookie positions. Age coefficients are also negative in all four positions. These are useful historical indicators, but the enriched rookie model does not beat the transparent prior.

Rookie model validated: **NO**.

## Historical ADP / draft-cost benchmark status

**Lawful source exists, but benchmark NOT established.**

CC0 SafeLeagues source passed rights review and schema inspection but failed the predeclared comparable-market sample gate: 6 eligible PPR redraft league drafts vs required 100.

True draft-cost bust claims: **NO**.

## Negative/null findings

- one universal risk overlay does not transfer safely to every position;
- breakout probability is much less useful than downside probability at RB/WR/TE;
- TE breakout discrimination is weak;
- isolated efficiency spikes are less stable than opportunity/share signals;
- multicollinearity means coefficients are predictive associations, not causal isolated effects;
- Ridge pooled MAE is favorable but has occasional severe fold-specific extrapolation (notably 2021 WR RMSE), so robustification deserves separate validation;
- rookie enrichment remains unresolved;
- broad lawful ADP benchmark remains unresolved.

## Predeclared evidence gate

PASS:
- stable positive + warning signals in >=3/4 positions — all four positions qualify
- Ridge pooled MAE lift >=2% — 6.61%
- player-clustered bootstrap interval upper <0 — upper `-0.0616`
- risk-prototype pooled Spearman non-worse
- rights/leakage/frozen-artifact integrity

FAIL:
- average position rank MAE improved — NO
- no position rank-MAE regression >5% — NO; WR +5.51%, TE +6.20%

## Primary result

**MORE EVIDENCE NEEDED**

This is a useful positive-but-incomplete result:
- historical mean projection signal is established strongly enough to merit continued research;
- stable position-specific positive and downside indicators exist;
- the universal risk-adjusted ranking formula is not established;
- no production promotion is authorized.

## Reproducibility

Experiment workflow run: `34400961071` — SUCCESS.

Frozen research artifact:
- ID `10123492844`
- SHA-256 `2e945ae17850f9c4aac2731f5bf6901a9e4f10385fe0cbf496e379dd47be1187`

Generated files:
- `.ai/research/generated/HISTORICAL_RANKING_RESULTS.json`
- `.ai/research/generated/HISTORICAL_RANKING_ASSET_MANIFEST.json`
- `.ai/research/generated/HISTORICAL_RANKING_SIGNAL_TABLE.csv`
- `.ai/research/generated/HISTORICAL_RANKING_ROLLING_METRICS.csv`
- `.ai/research/generated/HISTORICAL_RANKING_PERMUTATION_IMPORTANCE.csv`

Temporary experiment workflow was removed after the successful evidence freeze and must not appear in the final research PR diff.

## Files intended in final WR-025 research diff

- `.ai/research/HISTORICAL_RANKING_SIGNAL_MANIFEST.md`
- `.ai/research/HISTORICAL_RANKING_SIGNAL_ANALYSIS.md`
- `.ai/research/wr025_historical_ranking_signals.py`
- `.ai/research/wr025_requirements.txt`
- generated compact WR-025 evidence files listed above
- `.ai/research/HANDOFF.md`

Production files changed: **NO**  
Canonical `.ai/shared/*` changed: **NO**  
Production rankings changed: **NO**

## Known limitations

- historical study is observational and cannot establish causation;
- 2022–2025 are chronological retrospective folds but not pristine project-level holdouts;
- no sufficiently broad lawful historical ADP benchmark;
- no historical preseason depth/injury/roster-as-of source was admitted;
- zero-game players cannot have defined PPR/game but remain in availability/season-total cohort;
- universal risk overlay failed WR/TE stability;
- rookie model remains unvalidated;
- no 2026 outcome evidence is part of WR-025 by design.

## Blocking issues

None for completion of WR-025 historical research.

Any production ranking-model milestone remains separately blocked on Manager authorization and the frozen WR-023 prospective process. WR-025 does not supersede WR-023.

## Recommended next role

Manager / Architect

## Exact next action

Review the open WR-025 research PR and accept/reject the `MORE EVIDENCE NEEDED` disposition. If further historical R&D is justified, authorize a separate position-specific risk-calibration task that preserves the current mean-projection benchmark, predeclares calibration on earlier seasons, treats warnings separately from value projection, keeps rookies separate, and does not touch the frozen WR-021/WR-023 prospective artifacts.

## Checkpoint / SHA

Final branch head must be verified after this handoff commit and exact-head CI. R&D must leave the research PR open for Manager review.
