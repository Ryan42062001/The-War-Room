# WR-018 — Open-Data Shadow Ranking Model Experiment

Status: COMPLETE — MANAGER REVIEW REQUIRED  
Role: Research & Development (R&D)  
Classification: EXPERIMENTAL / NON-PRODUCTION  
Starting main SHA: `8931b30d4f4f387504b17ac07d837aa87a166948`  
Research branch: `wr-018-open-data-shadow-ranking`

## Primary result

**MORE EVIDENCE NEEDED**

The first leakage-safe open-data experiment did **not** demonstrate a reliable held-out improvement over a strong previous-season Full-PPR-per-game baseline. There are position- and metric-specific signs that richer historical features can help, but they are inconsistent and the paired bootstrap uncertainty intervals include zero. This is enough signal to justify a narrowly improved validation experiment, but not enough to claim model superiority, alter WR-D001, or promote any model into production.

## What was tested

Scope was QB/RB/WR/TE only. K/DST were excluded.

The experiment used only nflverse Player Summary Stats from the official `nflverse/nflverse-data` `stats_player` release family, with license/provenance documented before model execution in `SHADOW_RANKING_SOURCE_MANIFEST.md`.

Historical source seasons: 2012–2025.  
Rolling held-out target seasons: 2022, 2023, 2024, 2025.  
Held-out player-season predictions: 663.

For target season Y, features were built only from completed regular seasons Y-1 and Y-2. No target-season Week 1+ data, target-season final depth charts, reconstructed injuries, or target-season outcomes entered the features.

The cohort is deliberately limited to returning players with at least four recorded regular-season games in both Y-1 and target Y and the same listed position across Y-1/Y. Rookies and players without usable prior NFL history are excluded rather than assigned fabricated context.

## Models

1. **Naive baseline** — previous-season Full-PPR points per recorded game.
2. **Regularized model** — position-specific `StandardScaler + Ridge(alpha=10.0)`.
3. **Higher-capacity challenger** — position-specific `GradientBoostingRegressor` with 150 estimators, learning rate 0.05, max depth 2, and minimum leaf size 8.

Ridge and gradient-boosting hyperparameters were fixed before scoring the four held-out seasons. Model complexity was evaluated only on rolling held-out performance.

## Feature families

All features are prior-season or two-season derivatives from the admitted nflverse source:

- prior Full-PPR production and games;
- attempts, carries, targets, receptions;
- passing/rushing/receiving yards and touchdowns;
- interceptions;
- passing/rushing/receiving EPA where present;
- target share, air-yards share, and WOPR where present;
- prior-two-season PPR level, delta, and recency-weighted PPR.

No PFF, NFL Next Gen Stats/NFL Pro, FantasyPros historical API/rankings, paid/private data, or hindsight role/injury features were used.

## Held-out performance

### Pooled — all positions

| Model | N | MAE | RMSE | Spearman |
| --- | ---: | ---: | ---: | ---: |
| Naive | 663 | 2.636 | 3.558 | 0.742 |
| Ridge | 663 | 2.638 | 3.372 | 0.746 |
| Gradient boost | 663 | 2.674 | 3.437 | 0.731 |

Pooled MAE change versus naive:
- Ridge: **-0.075% lift** (slightly worse MAE).
- Gradient boost: **-1.45% lift** (worse MAE).

Paired bootstrap absolute-error delta, where negative favors the challenger:
- Ridge minus naive: mean `+0.002`, 95% CI `[-0.127, +0.126]`.
- Boost minus naive: mean `+0.039`, 95% CI `[-0.101, +0.183]`.

**Strong evidence:** neither challenger has a statistically persuasive pooled MAE advantage over the naive baseline in this experiment.

### By position

| Position | Model | N | MAE | RMSE | Spearman | Rank MAE | Top-N overlap |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| QB | Naive | 84 | 4.060 | 5.423 | 0.500 | 4.810 | 64.6% |
| QB | Ridge | 84 | 3.944 | 4.966 | 0.445 | 5.071 | 68.8% |
| QB | Boost | 84 | 4.223 | 5.426 | 0.383 | 5.524 | 68.8% |
| RB | Naive | 162 | 2.598 | 3.473 | 0.783 | 5.568 | 85.4% |
| RB | Ridge | 162 | 2.716 | 3.331 | 0.793 | 5.605 | 86.5% |
| RB | Boost | 162 | 2.624 | 3.328 | 0.799 | 5.654 | 83.3% |
| WR | Naive | 256 | 2.683 | 3.413 | 0.767 | 10.055 | 79.9% |
| WR | Ridge | 256 | 2.608 | 3.191 | 0.762 | 10.047 | 81.3% |
| WR | Boost | 256 | 2.685 | 3.220 | 0.760 | 10.063 | 79.9% |
| TE | Naive | 161 | 1.856 | 2.478 | 0.687 | 7.379 | 72.9% |
| TE | Ridge | 161 | 1.925 | 2.570 | 0.671 | 7.453 | 75.0% |
| TE | Boost | 161 | 1.898 | 2.379 | 0.691 | 7.255 | 72.9% |

Top-N uses QB12, RB24, WR36, and TE12 within each held-out returning-player cohort.

### Position interpretation

**QB — mixed evidence.** Ridge improves MAE by about 0.12 points/game and materially lowers RMSE, but worsens Spearman and rank MAE. Its bootstrap MAE-delta CI crosses zero (`[-0.623, +0.382]`).

**RB — mixed/negative on primary error.** Both challengers lower RMSE and improve Spearman slightly, but both worsen MAE versus naive. Rank/top-N changes are small. Bootstrap intervals cross zero.

**WR — most encouraging sub-result, still inconclusive.** Ridge improves MAE from 2.683 to 2.608 and RMSE from 3.413 to 3.191, with slightly better rank MAE and top-36 overlap. Spearman is slightly worse, and the ridge-vs-naive bootstrap MAE-delta CI still crosses zero (`[-0.267, +0.109]`).

**TE — mixed evidence.** Boost improves RMSE, Spearman, and rank MAE slightly, but worsens MAE. Ridge is worse on most continuous/rank metrics except a small top-12 overlap increase. Bootstrap intervals cross zero.

## Leakage controls

VERIFIED FACTS from the runner/config:

- Target Y features use completed Y-1/Y-2 regular-season records only.
- Test season rows are never included in the training set for that holdout.
- Rolling training expands only through seasons strictly earlier than each holdout.
- 2022/2023/2024/2025 were each scored as held-out target seasons.
- No 2026 result data are used in the frozen 2026 snapshot.
- No reconstructed point-in-time injury/depth data were introduced.

Training/test sample counts expand as expected across the rolling origin. The smallest held-out cell is QB 2025 with 19 players; the largest is WR 2025 with 68.

## Availability, season totals, replacement value, calibration

Availability was **not modeled** because WR-018 did not establish a rights-cleared, point-in-time preseason injury/availability source with defensible historical coverage. Consequently:

- season-total forecasting was not claimed;
- replacement-adjusted value error was not computed;
- no fabricated injury or games-played model was added;
- predictive intervals/calibration were not modeled in this first experiment.

Uncertainty is limited to paired bootstrap intervals for held-out MAE differences.

## FantasyPros comparator

No historical FantasyPros API/ECR training or benchmarking data were used. WR-018 therefore makes **no claim** that these models outperform FantasyPros or the production ranking authority.

WR-D001 remains unchanged: production ranking authority stays FantasyPros 2026 PPR ECR, with ESPN rank/ADP used for market timing only.

## 2026 prospectively frozen shadow snapshot

A clean 2026 research snapshot was successfully created before the first 2026 regular-season kickoff.

Persisted snapshot metadata:
- source release: nflverse `stats_player`, release ID `236670328`;
- release updated at `2026-08-26T07:35:58Z`;
- generation timestamp: `2026-09-09T14:53:48.967586+00:00` (10:53:48 AM ET);
- first-kickoff deadline: `2026-09-10T00:20:00+00:00` (8:20 PM ET);
- rows: 343 returning QB/RB/WR/TE players;
- prediction columns: naive previous-season PPR/game, ridge shadow PPR/game, gradient-boost shadow PPR/game;
- exact artifact: `.ai/research/generated/SHADOW_RANKING_2026_SNAPSHOT.csv`.

Limitations are intentionally preserved: no 2026 rookies without 2025 NFL stats, no point-in-time injury model, no preseason depth/role model, and no 2026 outcome data.

This snapshot is research-only and is not consumed by any production file.

## Reproducibility evidence

Runner: `.ai/research/wr018_shadow_experiment.py`  
Pinned dependencies: `.ai/research/wr018_requirements.txt`

Successful deterministic experiment evidence:
- GitHub Actions WR-018 experiment run `34366202246`: SUCCESS.
- Persist/freeze rerun `34366601009`: experiment and generated-output freeze steps SUCCESS.
- Artifact from first run: `wr018-shadow-results`, artifact ID `10109963499`, ZIP SHA-256 `0654cfe40e88ca73119a7d5698321c56d3a47d2765f4e747d1ca321f577c6b87`.
- Official source assets are recorded with GitHub asset IDs, update times, provided digests, and independently computed matching SHA-256 values in `.ai/research/generated/SHADOW_RANKING_ASSET_MANIFEST.json`.

A temporary branch-scoped Actions workflow was used only to execute the internet-dependent research run and persist the frozen outputs. Exact-head PR CI then correctly exposed the repository invariant that only `.github/workflows/ci.yml` may be tracked. The temporary WR-018 workflow was removed from the final diff before Manager review; the reproducible Python runner/config and frozen result artifacts remain.

No large raw nflverse datasets are committed.

## Conclusion

### Classification

**MORE EVIDENCE NEEDED**

The experiment establishes that an open-data War Room-owned model is technically reproducible and has some position-specific predictive signal beyond a one-number historical input, but the tested richer models do not reliably beat the transparent naive baseline on the primary held-out MAE target. The higher-capacity challenger does not justify its added complexity on current evidence.

A successor validation should be approved only if it can add genuinely point-in-time, rights-cleared information that addresses the obvious missing dimensions—especially age/experience, draft capital/rookie priors, team changes, preseason role context, and availability—without introducing leakage. It should preserve the same rolling-origin tests and compare improvements against this exact baseline. The frozen 2026 snapshot should be evaluated prospectively after sufficient 2026 outcomes exist.

Do not promote this experiment to production. Do not change WR-D001 on this evidence.
