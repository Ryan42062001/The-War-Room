# WR-021 — Context Shadow Source Manifest and Predeclared Design

Task: WR-021 — Context-Enriched Preseason Shadow Model Validation  
Role: Research & Development (R&D)  
Classification: EXPERIMENTAL / NON-PRODUCTION  
Assignment-start main SHA: `4dbc0bf22d27296c3cd9b45fd90de637488ff001`  
Initial manifest/design frozen before model execution: 2026-09-09

## Rights rule
Only data with documented permission for this research use and defensible preseason semantics may enter the experiment. Technical accessibility is not permission. Ambiguous historical as-of sources are excluded rather than reconstructed.

## Provenance correction before final validation
The first WR-021 execution (`34375488508`) exposed a source-semantics defect during R&D review: drafted-rookie cohort position was taken from the current nflverse Players `position` field. That field is current NFL-listed position and is not guaranteed to be the player's draft/preseason position for historical seasons.

**Disposition:** that first execution is diagnostic only and is invalid for final WR-021 classification or the final 2026 freeze. It is retained in Git history for transparency.

The correction is source-boundary-only: drafted-rookie position and draft selection now come from the nflverse `draft_picks` release, whose documented fields include draft season, overall pick and **position as recorded by Pro Football Reference at the draft**. No model family, feature family, development window, confirmatory window, alpha candidates, challenger parameters, uncertainty method, or evidence gate changed after observing the first run. Because 2022–2025 were already explicitly confirmatory/non-pristine before WR-021 began, this provenance correction does not create a claim that those seasons are untouched.

The final 2026 prospective snapshot must be regenerated from the corrected source boundary before kickoff.

## Admitted source family A — nflverse Player Summary Stats
- Repository: `nflverse/nflverse-data`
- Release tag/family: `stats_player` / Player Summary Stats
- License: nflverse data family documented CC BY 4.0.
- Use: completed prior-season QB/RB/WR/TE production/opportunity features and target-season fantasy/game outcomes for historical evaluation.
- Historical feature rule: target Y uses completed Y-1 and earlier statistics only.
- No target Y Week 1+ result enters target Y features or cohort membership.

This is the same rights-cleared source family accepted in WR-018.

## Admitted source family B — nflverse Players
- Repository/data release: `nflverse/nflverse-data`, tag `players`.
- Producer: `nflverse/nflverse-players`.
- Release purpose: player-level IDs and mostly immutable information; nflreadr documentation explicitly describes birthdate and draft information as in scope.
- License: nflverse data family documented CC BY 4.0.
- Permitted columns for WR-021 after provenance correction: `gsis_id`, player name, `birth_date`, `rookie_season`, and draft metadata only as a consistency cross-check.
- **Not used for historical rookie cohort position:** current `position` / `position_group`.
- Explicitly ignored: PFF fields/IDs/status, NGS-derived fields, latest-team/current-status fields, or any mutable field whose historical as-of meaning is not established.

Current release metadata observed before execution:
- release ID: `69785162`
- tag: `players`
- `players.csv` asset ID: `552739287`
- asset SHA-256: `a33998d3981bda4f49f40390c5c0fa30036112ee1ea5de19ed4609e2ad3be3e2`
- asset updated: `2026-09-09T12:41:39Z`

## Admitted source family C — nflverse Draft Picks
- Repository/data release: `nflverse/nflverse-data`, tag `draft_picks`.
- Provenance: release states draft picks dating to 1980 are courtesy of Pro Football Reference.
- nflreadr dictionary documents `season` (draft year), `round`, `pick` (overall), `team`, `gsis_id`, player name, and `position` **as recorded by PFR**.
- License: nflverse data family documented CC BY 4.0.
- Use: historical and 2026 drafted-rookie cohort definition, preseason position, overall draft number, round and draft team. Career-result columns in the same file (`to`, All-Pro, AV, awards, etc.) are explicitly prohibited and ignored.

Current release metadata observed before corrected execution:
- release ID: `66254658`
- tag: `draft_picks`
- `draft_picks.csv` asset ID: `552425724`
- asset SHA-256: `6ec4a9b69ab16c6da5219554b8954f114b59e47bafb1cb6c476f672a5f25d02a`
- asset updated: `2026-09-09T09:22:54Z`

The runner independently SHA-256 verifies all downloaded admitted assets and fails closed if expected identifiers/schema are unavailable.

## Sources intentionally excluded
WR-021 does not use:
- PFF data, grades, APIs, exports, screenshots, or PFF-derived fields;
- NFL Next Gen Stats / NFL Pro systematic inputs;
- FantasyPros historical/API rankings for training or historical benchmarking;
- paid/private/scraped unclear-rights data;
- season-final reconstructed depth charts, injuries, roles, or roster survival;
- current/latest team as a proxy for historical preseason team;
- current Players position as historical rookie-position evidence;
- nflverse historical roster status/depth context in this execution because sufficiently strong historical preseason as-of semantics were not established before the freeze;
- any career-result columns from the draft-picks dataset.

## Preseason-defined historical cohort — frozen before scoring and unchanged by provenance correction
For target season Y, cohort membership is determined without target-season outcomes:

1. **Returning cohort:** every QB/RB/WR/TE with a valid Y-1 regular-season Player Summary Stats row. No target-Y game requirement is applied. Players who retire, are cut, miss the season, or record zero target-Y games remain in the preseason cohort and count in availability evaluation.
2. **Rookie cohort:** drafted QB/RB/WR/TE from `draft_picks` where `season == Y`, draft-time PFR `position` maps directly to QB/RB/WR/TE, overall `pick` is valid, and a `gsis_id` is available for deterministic nflverse joining. Drafted rookies remain included even if they record zero target-Y games.
3. **Undrafted/no-prior-history players:** excluded from the primary historical cohort because no rights-cleared historical preseason roster snapshot was established. This limitation is reported as cohort coverage, not repaired with hindsight.

Historical target statistics are joined *after* cohort construction. Missing target-season stats are converted to zero games/zero season PPR for availability/season-total evaluation; they are not silently dropped. Per-recorded-game performance metrics are calculated only where a target-season recorded game exists, consistent with the task target definition.

## Preseason context features — frozen
Only preseason-known/immutable context plus prior completed seasons:
- previous-season PPR per recorded game;
- previous-season games and opportunity/production fields used in WR-018 where available;
- two-season prior PPR level/trend when available;
- age on September 1 of target season from immutable birth date;
- years since `rookie_season` at target preseason;
- rookie indicator;
- draft overall number and transformed/log draft capital;
- draft round / drafted indicator;
- missing-prior-history indicator.

No target-season roster survival, games, fantasy points, injuries, depth role, current position, or latest-team information is a feature.

## Historical windows and model-selection discipline
- Development/model-selection target seasons: **2018–2021**.
- Confirmatory target seasons: **2022–2025**.
- 2022–2025 are explicitly not pristine project-level holdouts because WR-018 outcomes were already observed by the project.
- Confirmatory model specification is locked after development-window selection; confirmatory outcomes may not change features, alpha, or challenger parameters.

### Baseline — frozen
- Returning player: previous-season Full-PPR points per recorded game.
- Drafted rookie: transparent position + draft-overall bucket prior learned only from seasons before the scored target. Frozen draft buckets: picks 1–50, 51–100, 101–175, 176+; fallback is position rookie mean.
- Availability baseline: previous-season games for returning players; analogous position + draft bucket historical mean games for drafted rookies.

### Regularized model search — development only
Position-specific standardized Ridge model using the frozen context feature matrix.
Candidate alphas allowed during 2018–2021 development only: `[1, 10, 100]`.
Select one global alpha by lowest pooled development **returning-player performance MAE** on rolling-origin predictions. Ties favor the larger alpha/simpler shrinkage. Lock before 2022–2025 scoring.

### Higher-capacity challenger — single fixed family
At most one challenger: position-specific `GradientBoostingRegressor` with fixed predeclared parameters inherited from WR-018 discipline: 150 estimators, learning rate 0.05, max depth 2, min samples leaf 8, deterministic seed. No confirmatory tuning.

## Outcomes / metrics
Performance target: Full-PPR points per recorded game for cohort players who record at least one target-season game.

Availability target: target-season recorded games, with absent target rows treated as zero.

Season-total target: target-season Full-PPR points, with absent target rows treated as zero. Season-total predictions may be reported only as the product of separately estimated PPR/game and games predictions and clearly labeled experimental.

Report:
- performance MAE/RMSE/Spearman/rank MAE/top-N overlap;
- returning-player metrics separately from rookie and combined cohorts;
- availability games MAE and season-total PPR MAE if the availability regression executes successfully;
- per-season and position-level deltas;
- cohort size, rookie count, zero-game count, and coverage limitations.

## Repeated-player-aware uncertainty — frozen
For confirmatory 2022–2025 returning-player performance, bootstrap unique `gsis_id` clusters with replacement and retain all confirmatory seasons belonging to each sampled player. Report 2,000 deterministic bootstrap replicates for enriched-vs-naive MAE delta, pooled and by position where sample size permits. This replaces WR-018 row-wise independence.

## Predeclared evidence gate — frozen before initial execution and unchanged
The **regularized Ridge model is the primary enriched candidate**. The higher-capacity challenger is diagnostic and cannot by itself upgrade the final classification to `PROMISING` if the primary transparent model fails the gate.

`PROMISING — CONTINUE VALIDATION` is permitted only if all primary returning-player conditions are met on confirmatory 2022–2025:
1. at least **2% pooled MAE improvement** versus previous-season PPR/game naive baseline;
2. player-clustered 95% interval for `Ridge absolute error - naive absolute error` has an **upper bound < 0.0**, so it excludes zero/worse performance;
3. pooled Ridge Spearman is not worse than naive by more than **0.01**;
4. no major position has a **>2% MAE regression in at least 3 of the 4 confirmatory seasons**. This is the predeclared operational definition of a persistent material position regression.

Rookie/availability gains may support continued validation but cannot override material degradation in returning-player performance. If the gate fails, classification must be `MORE EVIDENCE NEEDED` or `DO NOT PURSUE`.

## 2026 prospective snapshot rule
A context-enriched 2026 research snapshot may be created only before the first 2026 regular-season kickoff and only from completed-through-2025 statistics plus immutable/preseason-known context. It must record exact UTC freeze time, source hashes, cohort coverage, returning and drafted-rookie predictions, missing-context limitations, and the contemporaneous War Room production-ranking repository commit reference. No post-kickoff reconstruction is allowed.

## Production safety
No WR-021 artifact is production authority. WR-D001 remains unchanged. WR-021 must not modify rankings, scoring, recommendations, tiers, VORP, board order, UI, ESPN sync, persistence, or `.ai/shared/*`.
