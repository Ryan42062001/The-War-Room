# WR-029 Advanced Context Enrichment — Benchmark / Protocol Lock

Status: FROZEN BEFORE ENRICHMENT SCORING  
Task: WR-029  
Role: Research & Development (R&D)  
Starting canonical main: `b89919121cfcc00fc9a02be5d82c1a892036e70b`

This document is the pre-scoring contract for WR-029. No feature-family scoring may occur before this file is committed. Results may be appended to separate reports but the benchmark, family order, cutoff rules, or gates below must not be retuned after enrichment outcomes are seen.

## Accepted architecture entering WR-029

- Returning-player ordering model: exact WR-025 position-specific `StandardScaler -> Ridge(alpha=100.0)` mean PPR/game architecture.
- Risk: WR-027 warning/explanation-only for QB/RB/WR/TE. No direct risk rank penalty.
- Huber: not adopted.
- Rookies: separate; no rookie enrichment is part of WR-029.
- Production ranking authority: unchanged FantasyPros under WR-D001.

Reference implementation Git blob:
- `.ai/research/wr025_historical_ranking_signals.py`: `f8ab124c81ec9d90b9626f29a73e959e65918fd7`

Reference WR-025 result Git blob:
- `.ai/research/generated/HISTORICAL_RANKING_RESULTS.json`: `a52471ec4562accc2a7c81c37398a728310bfbf0`

Expected exact benchmark reproduction:
- active scored returner rows: `1881`
- unique scored returners: `886`
- previous-season PPR/game MAE: `3.0261717095879073`
- Ridge MAE: `2.8261944402894574`
- Ridge RMSE: `4.2363614824553535`
- Ridge Spearman: `0.677508831151748`

If these values do not reproduce within `1e-10`, WR-029 scoring must fail closed.

## Baseline feature schema

Exact WR-025 ordered feature list (34 features):

`prev1_ppr_pg, prev1_games, prev1_attempts_pg, prev1_carries_pg, prev1_targets_pg, prev1_receptions_pg, prev1_pass_yards_pg, prev1_pass_tds_pg, prev1_int_pg, prev1_rush_yards_pg, prev1_rush_tds_pg, prev1_rec_yards_pg, prev1_rec_tds_pg, prev1_pass_epa_pg, prev1_rush_epa_pg, prev1_rec_epa_pg, prev1_target_share, prev1_air_yards_share, prev1_wopr, prev1_pass_ypa, prev1_rush_ypc, prev1_rec_ypt, prev2_ppr_pg, prev2_games, ppr_delta, weighted_ppr_pg, games_delta, has_prev2, age_sep1, age_missing, experience_years, log_draft_pick, draft_round, drafted`

Baseline preprocessing is preserved exactly. WR-025 converts nonfinite numeric inputs to zero and uses explicit indicators for age missingness, second-year-history availability, and draft status. The generated benchmark lock must report structural missingness through those indicators and note that post-preprocessing numeric NA rate is zero by construction.

## Cohort / target lock

- Statistical source seasons: 2012–2025 only.
- Target seasons assembled: 2014–2025.
- Final historical OOS seasons available: 2018–2025.
- Returner membership: player has a completed Y-1 regular-season QB/RB/WR/TE summary row; target participation does not define membership.
- Active PPR/game evaluation: target season has >=1 recorded game.
- Primary target: Full-PPR points per recorded game.
- Position groups: QB/RB/WR/TE.
- Rookies excluded from the returning-player enrichment study.

## Cutoff / point-in-time contract

For target season `Y`, every predictive enrichment value must be derived only from information with event time no later than the completion of regular season `Y-1` (or immutable player/draft metadata known before the target preseason) and must be available by the fixed target preseason cutoff:

`September 1, 12:00:00 UTC of target season Y`.

This fixed date is a conservative reproducible research cutoff, not a claim about final roster/depth information. Any source requiring a later target-season snapshot is not admissible to the core model in WR-029.

Rules:
- Target-season Week 1+ events are always forbidden.
- Completed Y-1 PBP may be used for target Y because event time precedes the cutoff; later source corrections are tracked through immutable asset hashes and do not create target-outcome leakage.
- Mutable current player/team/position/status fields may not be used to reconstruct historical target-preseason context.
- A dataset lacking a defensible target-preseason `available_at`/snapshot semantics may be used only for lagged completed-season events if event time is sufficient, or otherwise is excluded from PIT-sensitive families.
- Mixed-snapshot target-season context is forbidden.

## Source/hash lock procedure

Before family scoring:
1. verify WR-025 stats/players/draft assets against the committed WR-025 SHA-256 manifest;
2. resolve the exact nflverse `pbp` release asset IDs for `play_by_play_2012.parquet` through `play_by_play_2025.parquet` and record release/asset metadata and GitHub digests where supplied;
3. resolve FTN charting assets only for the short-history scheme audit;
4. generate a committed machine-readable benchmark/source lock containing retrieval timestamp, release IDs, asset IDs, source digests, schema hashes and baseline missingness diagnostics;
5. compute the lock file SHA-256 and require every scoring run to verify it unchanged.

## Chronological experiment split

WR-029 uses a within-task development/confirmation split to reduce post-hoc family selection:

- family screening/development folds: 2018–2021;
- untouched-within-WR-029 confirmation folds: 2022–2025.

The confirmation seasons are not pristine project-level holdouts because earlier War Room research observed their outcomes. They are nevertheless not used to select WR-029 enrichment families or weights.

Every target-season model is still rolling-origin: training rows always come only from earlier target seasons.

## Family test order — frozen

1. benchmark/source/PIT lock;
2. `OPPORTUNITY_ROLE`: long-history PBP opportunity, red-zone/goal-line and concentration;
3. `EFFICIENCY_REGRESSION`: long-history efficiency/regression with denominator/sample controls;
4. `QB_TEAM_ENVIRONMENT`: QB decomposition plus team pace/pass tendency/efficiency;
5. `OL_ENVIRONMENT`: PBP-derived team offensive-line/environment proxies only;
6. `AGE_DRAFT_INTERACTIONS`: nonlinear age/experience/draft-capital and multi-year trend interactions;
7. `PIT_DEPTH_ROSTER`: audit first; score only if rights + historical target-preseason PIT + coverage pass;
8. `SHORT_HISTORY_SCHEME`: FTN charting challenger only if license/schema/coverage pass; never infer routes from participation;
9. `STAFF_CONTINUITY`: audit first; score only if a rights-clean dated team-season corpus passes coverage/PIT;
10. selected combined model from independently supported families, then confirmation on 2022–2025.

No family may be skipped in reporting even when excluded before scoring.

## Direct mean/rank family gate

On development folds, a family becomes a candidate for confirmation only if all hold:
- pooled active-row MAE improves by at least `1.0%` vs locked Ridge;
- pooled Spearman is no worse by more than `0.01`;
- mean position rank MAE across available positions is not worse;
- no position pooled MAE worsens by more than `2.0%`;
- at most one development season has >5% MAE regression vs Ridge;
- source rights, cutoff/PIT, maintainability and coverage gates pass.

Final `CORE MODEL SUPPORTED` requires confirmation 2022–2025 to satisfy all:
- pooled MAE improves by at least `1.0%`;
- player-clustered paired MAE bootstrap (5,000 replicates; seed `29029`) has upper 95% bound `< 0` for enriched-minus-Ridge MAE;
- pooled Spearman no worse by >`0.01`;
- mean position rank MAE non-worse;
- no position MAE worsens by >`2.0%`;
- no recurring severe season regression (>5% MAE worse in 2+ confirmation seasons);
- required family coverage >=`90%` of active rows in every evaluated position/season unless missingness is intrinsic and explicitly modeled without converting unknown to zero.

## Warning/explanation gate

A family that fails direct mean/rank inclusion may be `WARNING / EXPLANATION ONLY` if rights/PIT/coverage pass and, on confirmation folds, adding the family to the frozen WR-027 downside model produces one of:
- Brier score improvement >=`2%` relative; or
- ROC AUC improvement >=`0.02`;

in at least two positions with no >5% Brier degradation in any position. This does not authorize rank modification.

Otherwise the family is `INSUFFICIENT EVIDENCE` unless excluded for rights/PIT/coverage.

## Coverage / missing-data gate

- Required/core family: >=90% active-row coverage by position-season.
- Optional family may be scored below 90% only with explicit missing indicator + training-only median imputation; missing is never silently zero unless zero is the true semantic value.
- If a family's PIT-valid coverage is <70% in any two evaluated position-seasons, it cannot be core.
- Source omission sensitivity must compare the selected model against deterministic fallback to the locked Ridge benchmark.

## Metrics

By position and pooled where meaningful:
- PPR/game MAE and RMSE;
- Spearman;
- position rank MAE;
- top-N overlap (`QB12/RB24/WR36/TE12`);
- absolute-error p90/p95;
- catastrophic over-rank rate: predicted position rank at least 12 slots better than actual for QB/TE or 24 slots better for RB/WR;
- player-clustered paired MAE bootstrap;
- season-to-season metric deltas;
- warning Brier/ROC where explanation-only evidence is evaluated;
- family coverage/missingness;
- source omission and ±0.5 SD numeric perturbation ranking sensitivity for the selected combined model.

## Model lock

Every direct family test uses the exact same model family/hyperparameter as benchmark:

`StandardScaler -> Ridge(alpha=100.0)`

The enriched model appends only that family's predeclared features to the baseline feature matrix. No family-specific alpha tuning is allowed.

## Disposition vocabulary

Exactly one per family:
- `CORE MODEL SUPPORTED`
- `WARNING / EXPLANATION ONLY`
- `INSUFFICIENT EVIDENCE`
- `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE`

## Integrity / frozen prospective contract

Before and after every execution workflow verify byte-identical:
- WR-021 snapshot SHA-256 `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`;
- WR-023 protocol SHA-256 `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`.

2026 regular-season outcome assets must never be requested by WR-029 code.

## Deterministic seeds / dependencies

- confirmation player bootstrap: `29029`, 5,000 replicates;
- family warning/logistic models: `29030` where a solver seed is relevant;
- sensitivity sampling: deterministic sort/no random subsampling unless explicitly recorded;
- package versions are pinned in `.ai/research/wr029_requirements.txt`.

## Production boundary

WR-029 is research-only. No result changes production ranking authority, player dataset, scoring, recommendations, UI, ESPN behavior, or WR-D001.
