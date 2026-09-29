# WR-014 — Advanced Metrics Ranking Model Feasibility

Status: COMPLETE — R&D ONLY / MORE EVIDENCE NEEDED
Role: Research & Development (R&D)
Parallel Work Wave: PW-002
Starting SHA: `041c40bc6250a2ba1cc1c6d3582c5a08254b3017`
Production implementation authorized: NO

## Executive conclusion

A War Room-owned preseason projection/value model is **technically feasible enough to justify a bounded shadow-model experiment**, but it is **not ready to replace or modify the current FantasyPros Top-20 PPR ECR ranking authority**.

The strongest architecture is not “rank players directly from advanced stats” and not “replace ECR with PFF grades.” It is a staged, position-specific forecasting system:

1. estimate a player’s **per-game Full-PPR production distribution** from prior opportunity, usage, efficiency, age/experience and team context;
2. estimate **availability / expected games active separately**;
3. combine those into a season-level PPR distribution;
4. convert that projection into **league-specific replacement-adjusted draft value** downstream;
5. keep the result as a **shadow value source beside ECR** until leakage-safe held-out and prospective evidence demonstrates material lift.

This decomposition matters because the current War Room deeply treats ECR/rank as authoritative value input: it establishes board order, tier/value attributes, eligible replacement pools, VORP/scarcity calculations, same-position recommendation order and recommendation explanations. A future model therefore cannot be silently added as another strategy nudge without changing the ranking-authority contract.

The cleanest source foundation is public/open football data from nflverse plus explicitly licensed ffverse/FTN derivatives. PFF is **excluded** under ordinary access: its current Terms explicitly define rankings/projections/models created from PFF data as Derived Data and prohibit using PFF/API/Derived Data to train, evaluate, benchmark or develop statistical/predictive models. NFL Next Gen Stats is technically accessible through nflverse tooling, but NFL.com’s published terms restrict systematic retrieval and non-personal use, so NGS should also be excluded from the initial “production-safe” feature set unless separate rights are established.

The decisive gaps are empirical and operational:

- no leakage-safe historical shadow model has been trained/backtested under WR-014;
- no lawful, complete historical contemporaneous FantasyPros PPR ECR corpus has been established for direct retrospective baseline comparison;
- nflverse’s injury feed currently stops after 2024 because its source died, leaving a major current availability-context gap;
- rookie forecasting remains underpowered without a separately vetted college-production source;
- source-specific rights for some convenient nflverse mirrors (for example NGS/PFR-derived families) must not be inferred solely from technical availability;
- production replacement would have a large blast radius because ECR is an explicit correctness boundary in the current recommendation engine.

**Outcome: R&D ONLY / MORE EVIDENCE NEEDED.**

Recommended next step is a separate Manager-approved **EXPERIMENTAL / NON-PRODUCTION shadow-model task** using only clearly permitted/open inputs, with no changes to production rankings. Full replacement should not be considered until that experiment proves material lift across rolling held-out seasons and at least one prospective frozen preseason.

---

## Evidence classification

- **VERIFIED FACT** — established from current repository code/decisions or current authoritative source documentation.
- **STRONG EVIDENCE** — supported by relevant source capabilities or architecture constraints, but not direct proof of prediction lift.
- **INFERENCE** — R&D design conclusion derived from verified evidence.
- **HYPOTHESIS** — feature/model relationship that must be tested in held-out data.
- **UNKNOWN** — material uncertainty not resolved by WR-014.

---

## 1. Current War Room ranking/value integration boundary

### VERIFIED FACT — WR-D001 remains authoritative

`.ai/shared/DECISIONS.md` states that FantasyPros 2026 PPR ECR is the player-value/ranking authority and ESPN rank/ADP is market timing only. WR-014 does not change that decision.

### VERIFIED FACT — generated data pipeline

`scripts/build-fantasypros-2026.mjs` builds the canonical dataset from:

- FantasyPros Top-20 PPR ECR;
- broader FantasyPros PPR ECR fallback;
- FantasyPros ADP for market/depth coverage.

Established population:

- Top-20 ECR: 380 players;
- broader ECR fallback: 140;
- ECR-ranked total: 520;
- ADP-only depth: 197;
- total: 717 players;
- duplicate canonical names rejected;
- board ranks asserted contiguous.

The builder writes `ecr`, `rank`, `boardRank`, positional rank and FantasyPros tier semantics onto canonical player objects.

### VERIFIED FACT — ECR is not a cosmetic field

Current production modules use authoritative rank/ECR to:

- decide whether a player is recommendation/VORP eligible;
- sort available position pools;
- establish replacement levels;
- calculate VORP/scarcity/tier opportunity;
- populate `data-ecr` and authoritative row order;
- calculate the displayed “ECR value” recommendation factor;
- enforce that a worse-ECR player at the same position cannot dominate a better-ECR option solely because of derived strategy nudges.

The canonical recommendation layer separately handles “take now” priority and future survival; ESPN timing does not replace raw player value.

### INFERENCE — future integration boundary

A model that genuinely changes player value should enter **before** VORP/replacement/tier/recommendation calculations through an explicit ranking/value-authority adapter, not as an opaque downstream score adjustment.

Before that authority is ever granted, an experimental projection should remain separate, for example:

`open data -> shadow projection -> shadow replacement-adjusted value -> evaluation`

while production remains:

`FantasyPros ECR -> canonical ranking/value -> current scoring/recommendations`.

This preserves WR-D001 and makes disagreement measurable.

---

## 2. What should the internal model predict?

### Recommendation

Do **not** make overall draft rank the primary statistical target.

Draft rank mixes football performance, availability, position scarcity, league roster settings and strategic preference. Training directly on final rank would blur the distinction between forecasting player performance and applying league-specific draft economics.

### Proposed target stack

#### Stage A — per-game Full-PPR production

For QB/RB/WR/TE, estimate expected Full-PPR points per active game and a distribution/uncertainty interval.

The actual PPR scoring target can be recomputed from public stat totals using the War Room’s intended scoring rules instead of importing a proprietary fantasy projection.

#### Stage B — opportunity / role

Model or engineer expected opportunity separately where practical:

- QB dropbacks/attempts and rushing opportunity;
- RB carries, targets, goal-line/red-zone opportunity and participation;
- WR/TE targets, air-yard/target share and participation/routes when source rights permit.

`ffopportunity` provides an explicitly open expected-fantasy-points concept that quantifies how much fantasy production an average player would be expected to create from the opportunities he received. It is a strong candidate feature/benchmark, not automatically the final War Room model.

#### Stage C — availability

Estimate expected games active / probability of missing time separately from per-game performance.

This lets evaluation answer two different questions:

- Was the football performance forecast wrong?
- Or was the season-total miss mainly availability/injury?

#### Stage D — season distribution

Combine per-game production and availability into:

- expected season Full-PPR points;
- median / upper / lower projection;
- expected games active;
- per-game projection.

#### Stage E — league-specific value

Convert the projection distribution to replacement-adjusted value using the league’s roster/demand settings.

This should remain downstream of the statistical model so a 10-team PPR league and a different roster format can value the same football projection differently.

### Why this target is preferable

- directly matches the War Room’s PPR use case;
- separates availability from performance error;
- supports uncertainty rather than false point estimates;
- maps cleanly into existing VORP/replacement concepts;
- is explainable per player;
- avoids encoding current fantasy-market rankings as the outcome being predicted.

---

## 3. Source and licensing matrix

| Source family | Useful data | Current evidence | R&D disposition |
| --- | --- | --- | --- |
| nflverse play-by-play / computed player & team stats | attempts, carries, targets, receptions, yards, TDs, EPA-derived context, air yards, shares, team volume | `nflverse/nflverse-pbp` is public and repository metadata identifies CC BY 4.0; nflverse updates PBP/player stats nightly after game days | **PRIMARY CANDIDATE**; record attribution/version per snapshot |
| ffverse `ffopportunity` | expected fantasy points/opportunity outputs; situation-adjusted opportunity features | code GPL v3; README states included models/expected-points data are CC BY-SA 4.0; trained from public nflverse PBP | **PRIMARY/CHALLENGER FEATURE CANDIDATE**; lifecycle is experimental, so independently validate |
| nflverse FTN charting subset | motion, play action, RPO, QB location, box/backfield, catchable/contested indicators and other charted context | nflreadr explicitly states 2022+ subset is CC BY-SA 4.0 with FTN attribution; updated within FTN publication cadence | **ENRICHMENT CANDIDATE**; short history means ablation/challenger rather than core dependency |
| nflverse players / rosters / depth charts / IDs | age, experience, current team, draft info, current depth position, GSIS/ESPN IDs | technically available; depth charts now date-stamped from 2025 and updated daily | **OPERATIONALLY IMPORTANT, RIGHTS REVIEW PER UPSTREAM FAMILY**; do not assume every field has same license as PBP |
| historical injury reports via nflverse | injury type/status/practice status through available seasons | official nflverse schedule says source died after 2024; no 2025 data and no ETA | **HISTORICAL AVAILABILITY FEATURE ONLY**; inadequate as current preseason injury source |
| NFL Next Gen Stats direct or nflverse mirror | CPOE, expected YAC, rush yards over expected and tracking-derived metrics | nflreadr exposes NGS, but NFL.com terms restrict use to individual non-commercial informational purposes and prohibit systematic retrieval absent consent | **EXCLUDE FROM INITIAL PRODUCTION-SAFE MODEL** unless explicit rights are established |
| PFF | grades, charting and proprietary metrics | PFF Terms updated 2026-09-04 prohibit scraping/extraction and prohibit API/Derived Data use to train/evaluate/benchmark/develop statistical or predictive models; Derived Data expressly includes rankings/projections/models | **PROHIBITED UNDER ORDINARY ACCESS FOR WR-014 MODELING** |
| FantasyPros ECR/API | current production baseline and possible historical comparator | current War Room already uses approved repository snapshot; FantasyPros API terms include a non-compete restriction against developing/providing a competing product using API Materials/Data | **BASELINE AUTHORITY ONLY; DO NOT ASSUME HISTORICAL TRAINING/BENCHMARK RIGHTS** without clarification |

### Key authoritative sources

- PFF Terms of Use, last updated 2026-09-04: https://www.pff.com/terms
- NFL.com Terms: https://www.nfl.com/legal/terms/
- nflverse data schedule: https://nflreadr.nflverse.com/articles/nflverse_data_schedule.html
- nflreadr player stats: https://nflreadr.nflverse.com/reference/load_player_stats
- nflreadr depth charts: https://nflreadr.nflverse.com/reference/load_depth_charts.html
- nflreadr players: https://nflreadr.nflverse.com/reference/load_players.html
- nflreadr FTN charting: https://nflreadr.nflverse.com/reference/load_ftn_charting.html
- nflreadr Next Gen Stats: https://nflreadr.nflverse.com/reference/load_nextgen_stats.html
- ffopportunity: https://ffopportunity.ffverse.com/
- ffopportunity repository: https://github.com/ffverse/ffopportunity
- nflverse PBP repository: https://github.com/nflverse/nflverse-pbp
- FantasyPros API/Data terms: https://api.fantasypros.com/public/v2/terms-of-use
- FantasyPros draft accuracy methodology: https://www.fantasypros.com/about/faq/football-draft-accuracy-methodology/

### Licensing conclusion

There is enough clearly open/licensable material to perform a legitimate **open-data shadow experiment without PFF**.

There is **not** yet enough evidence to treat every convenient advanced-data mirror as production-safe. The initial experiment should use the narrowest set whose rights/provenance are explicit, and attach a source/license manifest to every feature family.

---

## 4. Position-specific feature hypotheses

These are **HYPOTHESES**, not validated production weights.

### Shared feature principles

Prefer multi-season, recency-weighted and opportunity-normalized features over raw previous-season totals.

Use shrinkage toward position/age/team priors for small samples. Raw touchdown rate, yards-per-carry, catch rate and similar efficiency measures are noisy and should not be allowed to dominate from a small workload.

Candidate shared families:

- age / NFL experience;
- prior games active;
- prior 1/2/3-season recency-weighted PPR production;
- opportunity volume and share;
- team offensive plays/volume;
- team EPA/play and scoring environment from public PBP;
- current team / team-change flag;
- preseason point-in-time depth-chart position;
- draft round/pick and combine profile for young/rookie players;
- current roster status where legally sourced;
- previous-season usage trend / late-season role trend, computed only from information available before the target draft date.

### QB

Candidate signals:

- dropbacks / attempts per game;
- completion percentage over expected where using an allowed computation/source;
- EPA/dropback and success rate;
- air yards / average depth of target;
- scramble and designed-rush volume;
- red-zone/goal-line rushing;
- sack rate / pressure consequence proxies available in open PBP;
- team pass volume and scoring environment;
- age/experience and team/offensive-context changes.

Model output should preserve passing and rushing contribution separately enough to explain dual-threat value.

### RB

Candidate signals:

- rush attempts/share;
- targets/target share and receptions;
- expected fantasy points / opportunity;
- red-zone and goal-line rushing opportunity;
- snap/participation share when rights-cleared;
- receiving-role stability;
- team rush volume and scoring environment;
- age/experience;
- current depth position / team-change flag;
- draft capital for early-career players.

Efficiency per carry should be heavily regularized relative to volume/opportunity.

### WR

Candidate signals:

- target share;
- air-yard share;
- WOPR or an equivalent combination of target + air-yard share computed from public data;
- targets / receptions / receiving yards per route or per opportunity when source permits;
- average depth of target;
- expected fantasy points;
- red-zone/end-zone opportunity where reproducibly available;
- team pass volume, QB/team environment;
- age/experience;
- depth-chart role and team change;
- draft capital for early-career players.

### TE

Use WR-like receiving features but with stronger shrinkage because samples and routes/targets can be smaller:

- target/air-yard share;
- expected fantasy points;
- participation/routes when rights-cleared;
- red-zone/end-zone usage;
- team pass environment;
- age/experience;
- depth-chart role and team change;
- draft capital.

### K / DST

Do **not** include K/DST in the first internal-model authority experiment.

They require different forecasting inputs and FantasyPros itself excludes K/DST from its overall draft-accuracy score partly because scoring formats vary and performance is less stable. Production can retain current ranking authority while QB/RB/WR/TE are investigated.

---

## 5. Role changes, injuries, rookies and context

### Role / depth-chart changes

Point-in-time depth charts are essential because previous-year volume alone cannot see a player becoming a starter or losing a role.

From 2025 onward nflverse depth charts include ISO8601 load timestamps, which are useful for strict “known by draft date” feature construction.

Recommended features:

- current depth rank;
- prior-season depth/usage versus current depth role;
- team-change indicator;
- teammate departures/additions summarized from roster changes;
- incumbent opportunity vacated by departed players using public prior-year usage.

### Injuries / availability

Availability should be a separate model.

Historical nflverse injury reports can support study through 2024, but the nflverse schedule explicitly states that its injury source died after 2024 and no 2025 data is available. That means an open-data-only production model currently lacks a verified current injury-report input.

Possible partial signals:

- prior games active/missed;
- historical injury-report frequency/severity categories through 2024;
- age/position;
- current roster/PUP/IR status if sourced from a separately verified legal feed.

A current-season injury/news source must be independently licensed before production. Do not fill the gap with PFF or FantasyPros API data under terms that do not permit the intended product use.

### Rookies

Open NFL draft/combine data provides useful priors:

- draft round/pick;
- age;
- position;
- combine measurements;
- team/depth context.

However, a strong rookie model normally also benefits from college production/market-share information. WR-014 did not establish an approved, complete college-production source. Therefore rookies should either:

- use a conservative draft-capital/combine/depth prior with wider uncertainty; or
- remain partially anchored to the current ECR baseline until a lawful college-data source is separately researched.

Do not let a sparse rookie model create false confidence.

### Coaching / team environment

Public play-by-play can derive prior team pace/play volume, EPA/play and pass/run tendencies. Those are reproducible.

A clean point-in-time coaching/staff-change dataset was not verified by WR-014. Until one exists, treat coaching regime change as an uncertainty flag rather than manually transcribing proprietary analysis.

---

## 6. Model architecture alternatives

### A. Transparent position-specific statistical model

Example family:

- regularized linear / elastic-net / GAM-like model for per-game production;
- separate logistic/count/survival-style availability model;
- engineered recency-weighted opportunity and efficiency features.

**Pros**
- explainable;
- easier to diagnose leakage;
- stable with moderate sample sizes;
- simple to reproduce and audit.

**Cons**
- may miss nonlinear age/usage/team interactions.

**R&D disposition:** REQUIRED BASELINE / preferred first model.

### B. Position-specific gradient-boosted challenger

Train QB/RB/WR/TE models on the same point-in-time feature set.

**Pros**
- nonlinear interactions;
- can handle thresholds and complex feature combinations;
- proven practical tooling.

**Cons**
- easier to overfit;
- more difficult to explain;
- needs careful calibration and feature-attribution checks.

**R&D disposition:** CHALLENGER only. It must beat the transparent baseline out of sample; ML complexity is not a success criterion.

### C. One global player model

A single model across positions would require heavy position interactions because QB opportunity and WR/TE/RB opportunity have fundamentally different semantics.

**R&D disposition:** NOT FIRST CHOICE. Position-specific models are safer and more interpretable.

### D. Open-data model + expert/market prior

A hybrid could treat expert consensus as a prior and let the internal projection provide an independent correction/uncertainty signal.

This may be practically strong because expert consensus can encode injuries, rookies and role news that historical stats miss.

But:

- direct FantasyPros API use has product-use/non-compete constraints;
- using ECR as a training feature reduces independence and makes “War Room-owned” lift harder to interpret;
- a hybrid can hide model weakness behind the expert prior.

**R&D disposition:** potentially valuable later, but only after the open model is independently measured and source rights permit the prior’s intended use.

### E. Full internal replacement

**R&D disposition:** NOT JUSTIFIED NOW.

Full replacement should require materially stronger evidence than “model looks competitive.” It would change the value authority behind tiers, replacement levels, VORP, same-position ordering and recommendation explanations.

---

## 7. Leakage-safe historical validation plan

### Point-in-time rule

For historical target season `Y`, every feature must have an `as_of` timestamp no later than the historical draft cutoff.

Recommended canonical cutoff for experimentation:

- one fixed date/time before the first regular-season game of year `Y`, or
- a documented late-August date applied consistently to every season.

No target-season Week 1+ performance may enter features.

Depth charts, rosters and status data must use the last record **known at or before** the cutoff, not reconstructed season-final state.

### Rolling-origin evaluation

Example structure:

- train on seasons up through `Y-1`;
- validate on season `Y`;
- roll forward one season;
- refit without using future seasons.

Use multiple later held-out seasons, not one random train/test split.

A core open-data model can use the longest consistent subset of PBP/player/team stats, roster/ID and point-in-time context. Short-history enrichments such as FTN 2022+ should be tested as **incremental ablations**, not made mandatory for the entire historical baseline.

### Target calculation

Recompute actual Full-PPR fantasy points from public actual player stats under a documented scoring formula.

Evaluate both:

- active-game/per-game performance;
- season total including availability.

Then derive actual league-specific replacement-adjusted value from the same scoring/roster assumptions used by the War Room experiment.

### Baselines

At minimum compare against:

1. simple prior-season / recency-weighted statistical baseline;
2. transparent position-specific model;
3. boosted challenger;
4. current FantasyPros Top-20 PPR ECR **only where historical/current use rights and point-in-time data are established**.

Do not assume historical FantasyPros API data is available for this experiment: its current terms prohibit using API Materials/Data to develop/provide a competing product. Manager/provider clarification may be necessary before direct historical ECR benchmarking.

A practical prospective benchmark already exists conceptually: freeze the current 2026 ECR snapshot and a future experimental open-model snapshot before the season, then evaluate both after the season without hindsight.

### Required metrics

#### Projection accuracy

- Full-PPR season-point MAE and RMSE;
- Full-PPR points-per-active-game MAE;
- position-specific Spearman rank correlation;
- median absolute rank error in draft-relevant ranges.

#### Replacement-adjusted draft value

- MAE/error of actual replacement-adjusted value;
- rank correlation of projected vs actual replacement-adjusted value;
- top-N hit/false-positive behavior for draft-relevant pools.

FantasyPros’ published accuracy methodology is a useful conceptual reference: it converts rank slots to expected point values and weights draft-relevant players more heavily. The War Room should use its own documented Full-PPR/replacement-value metric rather than copying FantasyPros data or proprietary outputs.

#### Availability

- Brier score / log loss for game-availability probabilities;
- calibration plots/bins;
- expected vs actual games active error.

#### Uncertainty

- prediction-interval coverage (for example, whether nominal 80% intervals contain outcomes about 80% of the time);
- interval width by position/experience group.

#### Downstream draft utility

Secondary only after projection quality passes:

- realized roster replacement-adjusted value/regret in deterministic historical draft simulations;
- behavior across draft slots;
- sensitivity to market timing assumptions.

Do not let a complicated draft simulation hide a weak underlying projection.

---

## 8. Proposed material-lift gates

These are **R&D PROPOSED GATES**, not an approved Manager decision.

### Shadow-model experiment success

A candidate should:

- beat the transparent naive/prior-season baseline in a majority of rolling held-out seasons;
- improve pooled draft-relevant replacement-value error by roughly **5% or more** with bootstrap/paired uncertainty excluding zero improvement;
- avoid material degradation at any core position;
- show stable rank calibration/top-N behavior rather than winning only through a few injury outliers;
- show reproducible results under a frozen feature schema and point-in-time data audit.

### Hybrid consideration

A hybrid should beat **both** the open-only model and the lawful ECR comparator, not merely interpolate between them.

### Full ECR replacement consideration

Full replacement should require:

- repeated held-out wins across multiple seasons;
- no major core-position regression;
- availability/uncertainty calibration that is at least operationally trustworthy;
- at least one prospective preseason snapshot evaluated without hindsight;
- complete source/licensing clearance;
- an explicit Manager decision to revisit WR-D001;
- independent audit of the new ranking/value and downstream recommendation contract.

A single retrospective season is not enough.

---

## 9. Production refresh and fail-closed architecture proposal

This is architecture research, not authorized implementation.

### Maintain an offline/maintainer-side model pipeline

Do not train or refresh the model inside the static browser application.

Recommended future stages:

`immutable source snapshots`
`-> point-in-time feature build`
`-> model training/evaluation`
`-> versioned shadow candidate`
`-> validation/promotion gate`
`-> production ranking adapter only after separate approval`

### Snapshot provenance

Every raw/derived source snapshot should record:

- source URL/repository;
- source family;
- license/permission status;
- retrieved/generated timestamp;
- target season;
- hash;
- code/version producing derived features;
- earliest/latest observation timestamp included.

### Model artifact provenance

Record:

- model family/version;
- position;
- training seasons;
- feature schema hash;
- training code SHA;
- as-of cutoff policy;
- validation results;
- calibration version;
- expected source versions.

### Candidate preflight

Fail the candidate if any of these occur:

- required source stale/missing;
- future-dated observation relative to cutoff;
- duplicate player IDs;
- implausible player/position coverage;
- excessive null rates;
- out-of-range expected games/points;
- malformed uncertainty intervals;
- missing license/provenance record;
- unexpected feature schema drift;
- unresolved canonical-player identity mismatch above a strict threshold.

### Fail closed

If shadow data/model refresh fails:

- keep the current production FantasyPros ECR untouched;
- do not partially promote model values;
- surface the model candidate as unavailable/stale only in R&D diagnostics;
- never fabricate a projection for an unmatched player.

If a future production authority transition is approved, keep a last-known-good version and explicit rollback path similar in spirit to the current ranking baseline protections.

---

## 10. Explainability and recommendation trust

A future model should expose enough information to audit why it differs from ECR.

Per player, a shadow projection should be able to show:

- expected PPR points/game;
- expected games active;
- expected season PPR points;
- uncertainty interval;
- projected replacement-adjusted value;
- principal driver families, such as opportunity, receiving/rushing role, efficiency, team environment, age/experience and depth context;
- source/model version and as-of date.

For a transparent model, coefficients/additive contributions are preferable.

For a boosted model, SHAP/permutation-style explanations may help diagnostics, but a user-facing explanation should still use stable football concepts rather than raw model internals.

Do not rename the existing “ECR value” factor to an internal-model factor unless Manager explicitly changes ranking authority. During shadow testing, show disagreement separately.

---

## 11. Risks and unresolved questions

### HIGH — current injury/availability input gap

nflverse reports no injury data after 2024 from its current source. A preseason model that ignores current major injuries is not production-ready.

### HIGH — source-rights drift

Technical accessibility does not equal permission. NGS and PFF are clear examples. Every future source family needs an explicit rights/provenance classification.

### HIGH — benchmark rights/completeness

A direct historical comparison to contemporaneous FantasyPros PPR ECR is desirable but the current API/Data terms prohibit competing-product use. Historical comparator access must be lawfully established or replaced with an independent benchmark.

### HIGH — ranking-authority blast radius

Changing value authority alters VORP, tiers, same-position ordering and recommendations, not just a displayed rank.

### MEDIUM/HIGH — rookie uncertainty

Draft/combine/depth signals alone may be insufficient without lawful college production/context.

### MEDIUM — role/coaching transitions

Historical stats systematically lag new roles, new teams and scheme changes. Point-in-time depth/roster context helps but does not solve all information gaps.

### MEDIUM — source drift

nflverse itself documents source transitions (for example depth charts after 2024 and injury-source failure). Schema/source drift must be treated as a validation event.

### MEDIUM — sample size and overfitting

Advanced features such as FTN charting have short histories. Higher-complexity models can produce impressive in-sample results without stable preseason lift.

### UNKNOWN — material lift over current Top-20 ECR

This is the central unanswered question. WR-014 proves feasibility of a disciplined experiment, not superiority.

---

## 12. Why no model was trained in WR-014

A disposable toy model would not resolve the decision-critical uncertainty because:

- the point-in-time historical feature corpus has not been assembled/audited;
- current injury-source coverage is incomplete;
- lawful contemporaneous ECR comparison data is unresolved;
- a naive retrospective dataset would invite target leakage;
- training on convenient restricted sources is explicitly prohibited.

Therefore WR-014 did **not** train an experimental predictive model and did not use PFF data. The responsible next experiment must begin with a versioned, rights-audited, point-in-time dataset.

---

## 13. Recommended bounded follow-up experiment

If Manager wants to continue, authorize a new R&D task such as:

**“Open-Data Preseason Shadow Model — Leakage-Safe Backtest”**

### Scope

- QB/RB/WR/TE only;
- no production ranking writes;
- no PFF;
- no NFL NGS unless separate rights are confirmed;
- start from clearly permitted nflverse PBP/player/team stats + explicitly licensed ffopportunity/FTN where appropriate;
- build transparent position-specific baseline first;
- boosted challenger second;
- availability model separate;
- rolling-origin held-out evaluation;
- immutable source/license manifest;
- freeze a prospective 2026 shadow snapshot if timing permits.

### Exit conditions

Return to Manager with:

- exact source/license manifest;
- point-in-time feature audit;
- per-position/overall held-out metrics;
- calibration and uncertainty;
- simple-vs-boosted comparison;
- lawful ECR comparison if available;
- ablation results showing whether advanced features actually add value;
- explicit recommendation to stop, continue shadowing, consider hybrid, or consider a future authority change.

No Builder production task should be created merely because the experiment runs successfully.

---

## 14. R&D proposal summary

**PROPOSAL ID / TASK ID:** WR-014

**OPPORTUNITY:** Build a differentiated War Room-owned preseason projection/value capability from objective football data.

**CURRENT LIMITATION:** Production value authority is expert-consensus ECR. The War Room has no independently validated projection model and cannot currently quantify where its own statistical view agrees/disagrees with ECR.

**PROPOSED CAPABILITY:** A shadow, position-specific Full-PPR projection + availability model producing season distributions and replacement-adjusted value, initially independent of production ECR.

**WHY IT MATTERS:** If validated, it could create a differentiated player-value signal, improve explainability/uncertainty handling, and eventually complement consensus rather than merely consuming it.

**USER VALUE:** Potentially better preseason player valuation, clearer upside/downside/availability ranges, and an independent check on expert consensus.

**EVIDENCE:** Open/licensable PBP/player stats, ffopportunity expected-points data/models and FTN charting exist; current War Room architecture has an explicit ranking-value boundary; restricted PFF/NGS/FantasyPros-use constraints are known.

**TECHNICAL APPROACH:** Separate per-game production, opportunity and availability; position-specific transparent baseline + boosted challenger; derive replacement-adjusted value; point-in-time rolling validation; shadow only until promotion gates pass.

**ALTERNATIVES:** Keep ECR only; use a single proprietary grade/source; global ML model; ECR-hybrid prior; immediate full replacement. Immediate full replacement and restricted-source dependence are rejected.

**PROTOTYPE / EXPERIMENT RESULTS:** No predictive model trained under WR-014. Source feasibility and architecture were investigated; material predictive lift remains unproven.

**RISKS:** Source rights, current injury gap, rookie/context information gaps, target leakage, overfitting, short advanced-feature histories, identity/source drift, large downstream authority blast radius.

**ESTIMATED RELATIVE EFFORT:** Shadow experiment — MEDIUM. Production-quality independent model + ranking-authority integration — LARGE.

**CONFIDENCE:** HIGH that a lawful open-data shadow experiment is feasible; LOW/MEDIUM that it would materially beat the current ECR until tested.

**RECOMMENDED NEXT STEP:** Manager may authorize the bounded shadow-model R&D experiment above; do not authorize production ranking changes yet.

**PRODUCTION READINESS:** NEEDS MORE RESEARCH.

---

## Final R&D outcome

**R&D ONLY / MORE EVIDENCE NEEDED**

WR-014 establishes that a War Room-owned open-data projection system is a legitimate, technically credible R&D direction. It does **not** establish superiority to current ECR and does **not** justify changing WR-D001.

The next valid gate is a rights-audited, point-in-time, leakage-safe shadow backtest — not production implementation.
