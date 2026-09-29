# WR-021 — Context-Enriched Preseason Shadow Model Validation

Status: COMPLETE — MANAGER REVIEW REQUIRED  
Role: Research & Development (R&D)  
Classification: EXPERIMENTAL / NON-PRODUCTION  
Starting main SHA: `4dbc0bf22d27296c3cd9b45fd90de637488ff001`  
Research branch: `wr-021-context-enriched-shadow`

## Primary result

**PROMISING — CONTINUE VALIDATION**

The corrected context-enriched Ridge model passes the predeclared WR-021 returning-player evidence gate on confirmatory 2022–2025 data. It improves pooled Full-PPR points per recorded game MAE by **7.89%**, improves pooled Spearman, and the repeated-player-clustered 95% interval for paired MAE difference is entirely favorable.

This is a research finding only. It does **not** authorize a production ranking change, does not establish superiority to FantasyPros, and does not change WR-D001.

The result remains materially limited by two facts:
1. 2022–2025 are confirmatory rather than pristine project-level holdouts because their outcomes were already observed during WR-018.
2. the regularized rookie PPR/game model is worse than the transparent rookie baseline, so rookie performance modeling is not validated by this experiment.

## Source/provenance correction

The first WR-021 execution, GitHub Actions run `34375488508`, completed successfully but was invalidated for final classification during R&D review. It used the nflverse Players table's current `position` field to define historical drafted-rookie position. That is not strong enough historical preseason provenance.

The final execution replaces only that boundary with nflverse `draft_picks`, where position is recorded at the draft by Pro Football Reference. Draft year, overall pick, round, draft team and draft-time position come from that source. The following remained unchanged after the first run:
- feature families;
- development seasons;
- confirmatory seasons;
- Ridge alpha candidates;
- Gradient Boosting parameters;
- repeated-player bootstrap design;
- evidence gate and its thresholds.

The final corrected execution is GitHub Actions run `34376257125` and is the sole basis for the metrics and classification below.

## Rights-cleared inputs

### nflverse Player Summary Stats
Official `nflverse/nflverse-data` release family `stats_player`, CC BY 4.0. Historical source seasons used: 2014–2025. Only completed regular-season data are used as prior-season features; target-season rows are joined only after cohort definition for evaluation.

### nflverse Players
Official `players` release, CC BY 4.0. Used only for deterministic GSIS identity, name, birth date, and rookie-season metadata. Current Players `position`, `latest_team`, status, NGS fields and PFF fields are excluded from the final experiment.

Final verified Players asset:
- release ID `69785162`;
- `players.csv` asset ID `552739287`;
- SHA-256 `a33998d3981bda4f49f40390c5c0fa30036112ee1ea5de19ed4609e2ad3be3e2`.

### nflverse Draft Picks
Official `draft_picks` release, CC BY 4.0; release provenance states draft picks are courtesy of Pro Football Reference. Used only for draft season, draft-time position, overall pick, round, draft team, GSIS ID and player name. Career outcome/value/award columns from this source are explicitly ignored.

Final verified Draft Picks asset:
- release ID `66254658`;
- `draft_picks.csv` asset ID `552425724`;
- SHA-256 `6ec4a9b69ab16c6da5219554b8954f114b59e47bafb1cb6c476f672a5f25d02a`.

No PFF data or PFF-derived fields, NFL Next Gen Stats/NFL Pro systematic inputs, FantasyPros historical/API rankings, paid/private unclear-rights sources, current roster/depth status, or hindsight injury/role reconstruction are used.

## Preseason-only cohort

For target season Y, membership is defined before target-season outcomes are joined.

### Returning players
Every QB/RB/WR/TE with a Y-1 regular-season Player Summary Stats row enters the Y preseason cohort. There is no target-Y minimum-games requirement. A returner who retires, is cut, is unavailable, or records no target-season stats remains in the preseason cohort for availability/season-total evaluation.

### Drafted rookies
Every draft-picks row for season Y whose draft-time PFR position is directly QB/RB/WR/TE, whose overall draft pick is valid, and whose GSIS ID permits deterministic joining enters the rookie cohort. Target-year participation does not determine inclusion.

Across confirmatory seasons, draft-time QB/RB/WR/TE GSIS coverage was:
- 2022: 79 / 79;
- 2023: 80 / 80;
- 2024: 77 / 77;
- 2025: 85 / 86.

The one 2025 drafted skill-position player without a GSIS ID is excluded rather than name-matched heuristically.

### Undrafted rookies / other no-history players
Excluded from the primary cohort because WR-021 did not establish a rights-cleared historical preseason roster source with sufficiently defensible as-of semantics. This is a coverage limitation, not silently repaired using target-season participation.

## Outcomes

### Performance
Full-PPR points per recorded game. Performance metrics include preseason-cohort members only when the target stats source records at least one target-season game.

### Availability
Defined explicitly as target-season **recorded games** in the admitted player-stat source. Cohort members with no target-season row are assigned zero recorded games. This is not claimed to be a medical injury model or perfect NFL active-game count.

### Season total
Full-PPR season points. Missing target rows are zero. Experimental season-total predictions multiply independently modeled PPR/game and recorded-games estimates; interpretation therefore inherits availability-model limitations.

## Context features

The final feature matrix contains only prior completed-season or immutable/preseason-known information:
- prior PPR/game and recorded games;
- prior attempts, carries, targets and receptions;
- prior passing/rushing/receiving yards and touchdowns;
- prior interceptions and EPA components;
- prior target share, air-yards share and WOPR;
- two-season PPR level/trend and recency weighting;
- age on September 1 from birth date;
- years since rookie season;
- rookie indicator;
- draft overall pick, log draft pick, draft round and drafted indicator;
- missing-prior-history indicator.

No target-season outcome, target-season games, final depth chart, current team/status or reconstructed injury/role information enters a feature.

## Model-selection discipline

Development/model-selection seasons: **2018–2021**.  
Confirmatory seasons: **2022–2025**.

The regularized candidate is position-specific `StandardScaler + Ridge`. Only Ridge alpha was selected during the development window:

| Alpha | Development N | MAE | RMSE | Spearman |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 927 | 3.070 | 4.351 | 0.628 |
| 10 | 927 | 2.946 | 3.989 | 0.646 |
| 100 | 927 | **2.910** | **3.832** | **0.658** |

Locked confirmatory alpha: **100**.

The single higher-capacity diagnostic challenger is a position-specific `GradientBoostingRegressor` with 150 estimators, learning rate 0.05, max depth 2, minimum leaf size 8, and deterministic seeds. It was not confirmatory-tuned.

## Confirmatory returning-player performance

| Model | N | MAE | RMSE | Spearman |
| --- | ---: | ---: | ---: | ---: |
| Previous-season PPR/game baseline | 954 | 2.910 | 4.172 | 0.638 |
| Context Ridge | 954 | **2.680** | **3.494** | **0.684** |
| Context Gradient Boosting | 954 | 2.724 | 3.540 | 0.671 |

Ridge improvement versus the same transparent previous-season-PPR/game baseline method:
- MAE improvement: **7.89%**;
- RMSE improvement: **16.24%**;
- Spearman change: **+0.046**.

The absolute baseline MAE differs from WR-018's 2.636 because WR-021 correctly uses the wider preseason-defined returning cohort instead of WR-018's target-season-participation-conditioned cohort. The baseline *method* remains previous-season PPR/game.

## Returning performance by position

| Position | Baseline MAE | Ridge MAE | Baseline RMSE | Ridge RMSE | Baseline Spearman | Ridge Spearman | Baseline rank MAE | Ridge rank MAE | Baseline Top-N | Ridge Top-N |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| QB | 5.188 | **4.362** | 7.118 | **5.393** | 0.349 | **0.506** | 10.037 | **9.104** | **58.3%** | 56.3% |
| RB | 2.718 | **2.634** | 3.612 | **3.353** | 0.700 | **0.710** | 10.009 | **9.966** | 71.9% | **74.0%** |
| WR | 2.646 | **2.479** | 3.432 | **3.012** | 0.728 | **0.741** | 14.273 | **13.913** | 76.4% | 76.4% |
| TE | 1.812 | **1.778** | 2.426 | **2.340** | 0.663 | **0.692** | 9.907 | **9.656** | **72.9%** | 70.8% |

Pooled MAE improves at every position. Top-N overlap is mixed, particularly QB/TE, so the result is not a claim that every ranking-quality measure improved.

## Per-season returning performance

| Season | Baseline MAE | Ridge MAE | Improvement |
| ---: | ---: | ---: | ---: |
| 2022 | 2.834 | 2.499 | 11.8% |
| 2023 | 2.856 | 2.789 | 2.4% |
| 2024 | 3.076 | 2.877 | 6.5% |
| 2025 | 2.879 | 2.574 | 10.6% |

The predeclared persistent-regression check counted >2% Ridge MAE regressions by position-season as QB 0, RB 2, WR 1, TE 1. None reaches the predeclared persistence threshold of three of four confirmatory seasons.

## Repeated-player-aware uncertainty

WR-021 bootstraps unique GSIS player IDs and carries every confirmatory season belonging to the sampled player, rather than treating player-season rows as independent.

Pooled returning-player clusters: **559**.  
2,000 deterministic bootstrap replicates.

Paired MAE difference is `Ridge absolute error - baseline absolute error`; negative favors Ridge.

- pooled mean delta: `-0.232` PPR/game;
- 95% interval: **`[-0.360, -0.106]`**.

By position:
- QB: `[-1.294, -0.346]` — entirely favorable;
- RB: `[-0.306, +0.152]` — inconclusive individually;
- WR: `[-0.369, +0.027]` — inconclusive individually;
- TE: `[-0.221, +0.163]` — inconclusive individually.

The pooled repeated-player-aware interval satisfies the predeclared gate; individual RB/WR/TE intervals should not be described as independently established wins.

## Rookie results

Drafted-rookie active performance is a negative result for the primary Ridge model:

| Model | N | MAE | RMSE | Spearman |
| --- | ---: | ---: | ---: | ---: |
| Transparent rookie baseline | 200 | **2.977** | **3.826** | 0.449 |
| Context Ridge | 200 | 3.236 | 4.002 | 0.431 |
| Gradient Boosting | 200 | 2.982 | **3.763** | **0.497** |

Ridge rookie MAE is **8.7% worse** than the transparent rookie baseline. The boosted model is nearly flat on MAE while improving RMSE/Spearman, but it is diagnostic only and does not validate a production rookie model.

This is a central limitation of WR-021. The returning-player gate passes despite—not because of—the rookie result.

## Availability and season-total results

Full preseason cohort across 2022–2025: **2,094 player-seasons**, including zero-recorded-game players.

### Recorded-games MAE
- baseline: `5.455` games;
- Ridge: `4.617` games;
- Boost: `4.624` games.

Ridge improves recorded-games MAE by **15.36%**.

### Season-total Full-PPR MAE
- baseline: `41.990` points;
- Ridge: `33.524` points;
- Boost: `33.647` points.

Ridge improves experimental season-total MAE by **20.16%**. This metric depends on the simple recorded-games regression and should not be treated as a validated injury/availability model.

## Confirmatory cohort composition

| Season | Cohort | Returners | Drafted rookies | Zero recorded games | Recorded-game players |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 2022 | 554 | 475 | 79 | 241 | 313 |
| 2023 | 526 | 446 | 80 | 247 | 279 |
| 2024 | 498 | 421 | 77 | 213 | 285 |
| 2025 | 516 | 431 | 85 | 239 | 277 |

This is intentionally much broader than a cohort conditioned on target-season participation.

## Predeclared evidence gate

Primary candidate: Context Ridge, returning-player confirmatory performance.

| Gate condition | Result |
| --- | --- |
| >=2% pooled MAE improvement | **PASS — 7.89%** |
| Player-clustered 95% MAE-delta interval upper bound < 0 | **PASS — upper bound -0.106** |
| Spearman not worse by >0.01 | **PASS — improves from 0.638 to 0.684** |
| No persistent >2% position MAE regression in >=3/4 seasons | **PASS — none** |

**Gate disposition: PASS.**

Per the design frozen before scoring, this permits the classification **PROMISING — CONTINUE VALIDATION**. It does not permit production promotion.

## 2026 context-enriched prospective snapshot

A corrected, rights-clean context-enriched 2026 snapshot was frozen before kickoff.

Final freeze timestamp: **`2026-09-09T16:22:20.858306+00:00` (12:22:20 PM ET)**.  
First-kickoff deadline: `2026-09-10T00:20:00+00:00` (8:20 PM ET).  
Production repository reference at freeze: `4dbc0bf22d27296c3cd9b45fd90de637488ff001`.

Snapshot coverage:
- 523 QB/RB/WR/TE players;
- 444 returners;
- 79 drafted rookies;
- 80 total drafted 2026 QB/RB/WR/TE selections in the draft-picks source;
- 79 with GSIS IDs and therefore deterministic snapshot inclusion.

Snapshot file: `.ai/research/generated/CONTEXT_SHADOW_2026_SNAPSHOT.csv`.

The snapshot contains no 2026 outcome data. It uses completed-through-2025 stats, immutable Players birth/rookie metadata, and draft-time PFR position/capital from nflverse draft-picks.

Known omissions remain deliberate:
- UDFAs/no-prior-history players lacking the admitted deterministic cohort path;
- injury/availability news;
- depth chart/role projections;
- current/latest-team information.

The snapshot is research-only and is not consumed by production code.

## Reproducibility evidence

Final corrected experiment GitHub Actions run: **`34376257125` — SUCCESS**.  
Final run artifact: `wr021-context-shadow-results`, artifact ID `10114016668`, ZIP SHA-256 `fe37dd83bf6f8fd690fa0620c8f0e52f34189a87da1e152c6303f486284d0cbb`.

Exact generated results, source hashes and snapshot are committed under `.ai/research/generated/`.

A temporary branch-only GitHub Actions workflow was used because the chat execution environment cannot retrieve external release assets. It is execution infrastructure only and must be removed from the final PR diff before Manager review, preserving the repository's single permanent CI-workflow invariant.

## Interpretation

### VERIFIED FACT
The context-enriched transparent Ridge candidate passes every WR-021 predeclared returning-player gate on the corrected preseason-defined cohort.

### STRONG EVIDENCE
Age/experience/draft-capital context plus prior-season production contains useful predictive information for returning-player PPR/game beyond simply carrying forward previous-season PPR/game in this confirmatory dataset.

### STRONG EVIDENCE
Availability treatment matters: preserving zero-recorded-game preseason-cohort members produces materially different evaluation conditions from WR-018 and supports useful recorded-games/season-total signal.

### NEGATIVE RESULT
The primary Ridge rookie PPR/game model is worse than the transparent drafted-rookie baseline. Rookie performance requires separate follow-up rather than assuming the returning-player formulation generalizes.

### LIMITATION
2022–2025 are not pristine holdouts at the project level. A prospective 2026 evaluation is therefore especially important before any architecture or production decision.

### UNKNOWN
Whether the 2026 frozen snapshot will retain the historical returning-player lift prospectively, and whether a separately designed rookie model can outperform the transparent rookie baseline without adding unclear-rights or hindsight inputs.

## Final classification

**PROMISING — CONTINUE VALIDATION**

Recommended meaning: continue research validation, especially prospective 2026 scoring and a separately bounded rookie-model investigation if Manager chooses. Do not integrate this model into production rankings from WR-021 alone.
