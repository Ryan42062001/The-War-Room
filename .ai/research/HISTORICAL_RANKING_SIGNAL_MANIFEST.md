# WR-025 — Historical Ranking Signal Source Manifest and Predeclared Design

Task: WR-025 — Historical Ranking Signal / Breakout-Bust Research  
Role: Research & Development (R&D)  
Classification: RESEARCH ONLY / NON-PRODUCTION  
Starting canonical main: `69689edadab5c8f270bc483b6acc461274ec7f87`  
Manifest/design status: **FROZEN BEFORE MODEL EXECUTION OR HISTORICAL OUTCOME SCORING**

## Prospective-test isolation

WR-025 is retrospective historical research only.

This task will not inspect, download, score, summarize, or use any 2026 regular-season outcome. It will not modify or regenerate:
- `.ai/research/generated/CONTEXT_SHADOW_2026_SNAPSHOT.csv`;
- `.ai/research/WR023_2026_PROSPECTIVE_EVALUATION_PROTOCOL.md`;
- `.ai/research/generated/WR023_PROTOCOL_MANIFEST.json`.

Authoritative frozen identities carried forward only as integrity references:
- WR-021 2026 snapshot SHA-256: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`;
- WR-023 protocol SHA-256: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`.

No WR-025 result may rewrite the prospective gate or production ranking authority.

## Rights rule

A source may enter WR-025 only when both are defensible:
1. rights permit the intended research use; and
2. fields used as predictors were knowable before the target regular season.

Technical accessibility, an open-source scraper, or a public endpoint is not by itself permission to reuse the upstream data. Ambiguous-rights data are excluded.

## Admitted source A — nflverse Player Summary Stats

- Repository: `nflverse/nflverse-data`.
- Release tag/family: `stats_player` / Player Summary Stats.
- License: CC BY 4.0 for the nflverse data repository.
- Intended seasons: completed historical seasons 2012–2025 only.
- Use: completed prior-season production/opportunity/efficiency features and historical target outcomes.
- Target-season features: prohibited.
- Regular-season rows only (`season_type == REG`).
- The runner records exact release/asset identifiers and independently calculated SHA-256 hashes.

This is the same rights-cleared source family previously admitted in WR-018/WR-021.

## Admitted source B — nflverse Players immutable identity metadata

- Repository/release: `nflverse/nflverse-data`, tag `players`.
- License: CC BY 4.0.
- Permitted fields: `gsis_id`, player display/name, `birth_date`, `rookie_season`, and stable external IDs used only for deterministic crosswalks (for example `mfl_id` when present).
- Use: age on September 1 of target year, experience, and deterministic ID matching.
- Explicitly prohibited as historical predictors: current team, current roster status, current position, PFF fields/IDs/status, or any mutable field lacking historical as-of semantics.

## Admitted source C — nflverse Draft Picks

- Repository/release: `nflverse/nflverse-data`, tag `draft_picks`.
- License: CC BY 4.0.
- Provenance: draft picks and draft-time position are sourced from Pro Football Reference in the nflverse release.
- Permitted fields: draft season, overall pick, round, draft team, GSIS ID, player name, draft-time position.
- Use: immutable draft capital, drafted indicator, rookie cohort definition, and rookie diagnostics.
- Explicitly prohibited: career-result/hindsight columns from the same file (for example later awards, career AV, career endpoint).

## Conditionally admitted source D — dynastyprocess Public MFL League Data / SafeLeagues draft records

- Repository: `dynastyprocess/data-mfl_public`.
- Repository tree pinned for this investigation at commit/tree identity observed before execution: `9b8f37152036b44b1a5baeb35f70482b1d3369f8`.
- License: **CC0 1.0 Universal** in the repository `LICENSE`; the repository explicitly describes the included MFL league/draft data as public league data.
- Candidate files: `safeleagues/league/year=2019..2021/*.parquet` and `safeleagues/draft/year=2019..2021/*.parquet`.
- Use: a **separate limited historical draft-cost sensitivity analysis only**.
- It is not a training feature for the primary historical ranking prototype.

### SafeLeagues admission gate

The draft-cost analysis executes only if all of the following can be established from the CC0 files without heuristic reconstruction:
- league season is 2019, 2020, or 2021;
- league is identifiable as redraft (not dynasty/keeper) from repository fields/name;
- league is 1QB and not best ball;
- reception scoring can be identified as PPR from an explicit scoring/scoring-flags field;
- league size is known; primary market slice prefers 12-team leagues;
- draft pick number and player MFL ID are explicit;
- MFL player ID joins deterministically to an nflverse Players `mfl_id` / GSIS ID crosswalk;
- at least 100 distinct eligible league drafts and 100 matched QB/RB/WR/TE players are available across the admitted years.

If any required semantic field is absent or ambiguous, the benchmark is excluded and WR-025 will explicitly report that no sufficiently defensible historical draft-cost benchmark was established.

The SafeLeagues archive is not represented as consensus ADP or a universal fantasy market. If admitted, it is described only as **observed average draft cost in the eligible SafeLeagues public redraft subset**.

## Sources investigated but excluded

WR-025 will not use:
- PFF or PFF-derived data;
- NFL Next Gen Stats / NFL Pro systematic data without explicit modeling rights;
- FantasyPros historical rankings/API data;
- `ffsimulator` historical ranking datasets because its documentation identifies the included historical rankings as FantasyPros-derived;
- open-source packages or projects that merely scrape Fantasy Football Calculator, NFL.com, MFL, ESPN, Yahoo, Sleeper, FantasyPros, or other upstream services when the upstream data reuse rights are not independently established;
- Kaggle/user-uploaded historical ADP datasets without source-level rights provenance;
- paid/private/scraped unclear-rights data;
- reconstructed target-season depth/injury/role information;
- target-season games, points, position, team, usage, or outcomes as predictor features.

## Historical cohort

Positions: QB, RB, WR, TE.

### Returning-player primary cohort

For target season Y:
- include every QB/RB/WR/TE with a valid completed Y-1 regular-season Player Summary Stats row;
- cohort membership is fixed before joining target-Y outcomes;
- frozen historical position is the Y-1 summary-stats position;
- players with no target-Y stats remain in the cohort with 0 target games and 0 season PPR for availability/season-total analysis;
- per-game performance analysis requires >=1 target-Y recorded game because PPR/game is undefined at zero games.

### Drafted-rookie diagnostic cohort

For target season Y:
- include drafted QB/RB/WR/TE from nflverse Draft Picks where draft-time position is one of QB/RB/WR/TE, overall pick is valid, and GSIS ID is available;
- no target-Y performance requirement defines membership;
- missing target row = 0 games / 0 season PPR;
- rookies are reported separately from the primary returning-player prototype.

Undrafted/no-history rookies remain outside the rookie cohort because WR-025 does not admit a defensible historical preseason roster-as-of source.

## Historical windows and chronological evaluation

Data preparation seasons: 2012–2025.

Returning-player target seasons: 2014–2025.

Primary rolling-origin scored seasons: **2018–2025**.
For each scored target season Y, models are trained only on target seasons `< Y` (beginning with 2014 where available). No future target season contributes to Y's fitted parameters.

2022–2025 remain valid chronological retrospective test seasons but are explicitly **not pristine project-level holdouts**, because their outcomes have been observed by prior War Room research.

No 2026 season is loaded by the WR-025 runner.

## Preseason-known feature matrix

Returning-player features use only Y-1/Y-2 completed stats plus immutable metadata:
- `prev1_ppr_pg`;
- `prev1_games`;
- pass attempts/game, carries/game, targets/game, receptions/game;
- passing/rushing/receiving yards per game;
- passing/rushing/receiving TDs per game;
- interceptions/game;
- passing/rushing/receiving EPA per game when available in the admitted summary source;
- target share, air-yards share, WOPR when available;
- yards/attempt, yards/carry, yards/target efficiency ratios with safe zero handling;
- previous-two-season PPR/game and games;
- one-year PPR/game trend (`prev1 - prev2`);
- recency-weighted PPR/game (`0.70*prev1 + 0.30*prev2`);
- multi-year availability trend (`prev1_games - prev2_games`);
- age on September 1 of target season;
- experience years;
- draft overall pick transformed as `log1p(pick)` with an explicit undrafted/missing indicator;
- draft round / drafted indicator;
- missing-Y-2 indicator.

Closely related usage variables are intentionally retained for predictive research but coefficient interpretation must include a multicollinearity warning. No single coefficient is treated as causal.

## Transparent preseason expectation baseline

### Returning players

Primary expectation:
`baseline_ppr_pg = previous-season Full-PPR points / recorded game`.

Availability baseline:
`baseline_games = previous-season recorded games`.

Season-total baseline:
`baseline_season_ppr = max(0, baseline_ppr_pg) * clamp(baseline_games, 0, 17)`.

### Drafted rookies

Transparent expectation is a rolling prior learned only from earlier target seasons by position + draft-pick bucket:
- picks 1–50;
- 51–100;
- 101–175;
- 176+;
- fallback to prior position rookie mean when a bucket has fewer than 5 eligible historical cases.

Rookie priors are diagnostic and do not define the returning-player ranking prototype.

## Predeclared breakout / downside definitions

These are expectation-relative labels, **not draft-cost bust claims**.

For active returning players (`target_games >= 1`):
- residual = `target_ppr_pg - baseline_ppr_pg`;
- **breakout/upside** = residual `>= +3.0` Full-PPR points/game;
- **performance downside / under-expectation** = residual `<= -3.0` Full-PPR points/game.

The symmetric 3.0 PPR/game threshold is frozen before historical scoring and is not chosen from observed WR-025 results.

Separate availability warning label on the full returning cohort:
- **low availability** = target recorded games `<= 8`, including zero-game players.

Availability is not a medical injury label and must not be described as one.

If the SafeLeagues benchmark passes its admission gate, a separate **draft-cost-relative** analysis may use observed draft pick/ADP and end-season performance. It must not redefine the primary breakout/downside labels above.

## Interpretable signal models

All models are position-specific and fitted in rolling-origin fashion.

### Expected-performance model

Standardized Ridge regression:
- target: active-player next-season PPR/game;
- alpha: **100** fixed before WR-025 scoring;
- feature standardization within the historical training fold.

### Breakout model

Standardized L2 logistic regression:
- target: breakout label among active returning players;
- `C = 0.25` fixed;
- `class_weight = balanced`;
- deterministic solver/seed.

### Performance-downside model

Same fixed logistic specification on the active returning-player downside label.

### Low-availability warning model

Same fixed logistic specification on the full returning cohort, target games <=8.

## Stable-signal rule

For every feature and position, collect the standardized coefficient from each rolling target-season model in 2018–2025 where the model is estimable.

A coefficient family is directionally stable when:
- at least 6 scored seasons are estimable; and
- the same non-zero direction occurs in **>=75%** of estimable seasons.

To avoid ranking tiny numerical effects as meaningful, the reported strongest stable lists additionally require median absolute standardized coefficient `>=0.05`.

Positive ranking signals are ordered by:
1. direction consistency fraction;
2. median positive expected-performance coefficient;
3. median positive breakout-logit coefficient as supporting context.

Warning/downside signals are ordered by:
1. direction consistency fraction;
2. median negative expected-performance coefficient and/or positive downside-logit coefficient;
3. positive low-availability coefficient as separate supporting context.

A feature may be reported as mixed/ambiguous when models disagree. Null and unstable signals are retained in generated tables rather than hidden.

## Diagnostic nonlinear challenger

One fixed Gradient Boosting Regressor for next-season PPR/game only:
- estimators: 150;
- learning rate: 0.05;
- max depth: 2;
- min samples leaf: 8;
- deterministic seed: 25025.

No hyperparameter tuning on scored seasons.

Permutation importance is computed on each target-season test fold using increase in MAE from deterministic feature permutation; it is descriptive and does not alter the primary prototype.

## Research-only ranking prototype — formula frozen before scoring

Primary prototype applies to returning players only.

For each player at target-season preseason:
- `mu = Ridge predicted PPR/game`;
- `p_up = logistic predicted probability of breakout`;
- `p_down = logistic predicted probability of >=3 PPR/game under-expectation`;
- `p_lowavail = logistic predicted probability of <=8 recorded games`.

Fixed risk-adjusted ranking score:

`prototype_score = mu + 1.5*(p_up - p_down) - 0.75*p_lowavail`

Weights are fixed before scoring and are not optimized on 2018–2025 outcomes. They are interpretable PPR/game-scale nudges, not claimed utility-optimal weights.

Prototype rank is descending `prototype_score`, evaluated within position and pooled only where meaningful. The transparent baseline rank is descending `baseline_ppr_pg`.

## Evaluation metrics

### Performance / ranking

For active returning players, report by pooled/position and per target season:
- MAE;
- RMSE;
- Spearman;
- rank MAE within position;
- top-N overlap using QB12 / RB24 / WR36 / TE12.

Report baseline, Ridge mean projection, risk-adjusted prototype, and the one diagnostic nonlinear challenger where applicable.

### Breakout/downside/availability classification

For each estimable model report:
- Brier score;
- ROC AUC when both classes are present;
- observed event prevalence;
- precision and recall in the highest predicted-risk/probability quintile;
- event rate in highest quintile vs overall prevalence.

These diagnostics do not override ranking metrics.

### Uncertainty

For pooled returning-player prototype-vs-baseline MAE on scored 2018–2025 active rows, use a repeated-player-aware bootstrap:
- bootstrap unit: unique GSIS player ID;
- retain all scored seasons belonging to sampled players;
- 2,000 replicates;
- deterministic seed 25026;
- statistic: mean absolute-error difference (`prototype expected PPR component mu - baseline`) for projection MAE, plus a separate paired rank-error delta where defensible.

The risk-adjusted score itself is a ranking score, so PPR/game MAE is evaluated on `mu`; ranking metrics evaluate the full prototype score.

## Historical draft-cost sensitivity analysis

If SafeLeagues passes its admission gate:
- derive observed player draft cost as mean overall pick across eligible leagues by player-season;
- require at least 10 eligible drafts for a player-season to report player-level ADP;
- use only 2019–2021;
- deterministic join via MFL ID crosswalk;
- report sample sizes and league filters;
- evaluate association between observed draft cost and season PPR/game/season-total outcomes;
- separately identify players with large negative performance relative to players drafted at similar cost using within-position-season cost buckets/quantiles fixed from the eligible sample;
- label all such findings `SAFELEAGUES DRAFT-COST SENSITIVITY`, not universal ADP truth.

No SafeLeagues result is permitted to alter the primary model, feature selection, label thresholds, or final classification by itself.

## Final classification rule

Return exactly one:
- `PROMISING — HISTORICAL RANKING SIGNALS ESTABLISHED`
- `MORE EVIDENCE NEEDED`
- `DO NOT PURSUE`

`PROMISING` requires all of:
1. at least one stable positive signal and one stable warning/downside signal for at least 3 of 4 positions under the frozen stability rule;
2. the primary interpretable Ridge mean projection improves pooled rolling-origin MAE versus previous-season PPR/game baseline by at least **2%** over 2018–2025;
3. the repeated-player bootstrap 95% interval for Ridge-minus-baseline MAE difference has upper bound `< 0`;
4. the risk-adjusted prototype improves or preserves pooled Spearman and improves average position-level rank MAE versus baseline without any position showing >5% pooled rank-MAE regression;
5. no source-rights, leakage, frozen-artifact, or 2026-outcome contamination violation.

If stable signals exist but these aggregate gates do not all pass, classify `MORE EVIDENCE NEEDED`.

If signals are broadly unstable and the prototype materially degrades the baseline, classify `DO NOT PURSUE`.

The SafeLeagues draft-cost sensitivity is informative but not required for `PROMISING`.

## Production safety

WR-025 is research-only. It must not modify rankings, scoring, recommendations, tiers, VORP, board order, UI, ESPN sync, persistence, or `.ai/shared/*`.

FantasyPros remains production ranking authority under WR-D001.