# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-018  
Role: Research & Development (R&D)  
Status: COMPLETE — MANAGER REVIEW REQUIRED  
Parallel Work Wave: PW-002

Verified starting state:  
- repository `Ryan42062001/The-War-Room` refreshed before execution;
- assignment-start `main` was `8931b30d4f4f387504b17ac07d837aa87a166948`;
- canonical state authorized WR-018 research only and left WR-D001 active;
- two older WR-018-named partial branches existed but were eight commits behind refreshed `main`, so a fresh branch was created from the verified assignment-start SHA;
- no production ranking/model implementation was authorized.

Branch: `wr-018-open-data-shadow-ranking`

Starting SHA: `8931b30d4f4f387504b17ac07d837aa87a166948`

Final SHA: use the exact PR head recorded in the Manager-facing external handoff. Latest research/documentation checkpoint before this handoff commit: `7c5a6cf9461d067a7f47ff2425dc337f4fc08963`.

## Objective
Build and evaluate a strictly non-production, rights-conservative, leakage-safe shadow projection experiment for QB/RB/WR/TE and determine whether a War Room-owned model has enough held-out predictive signal to justify further validation.

## Work completed
- Created the required source/license manifest before model execution.
- Restricted experiment input to documented CC BY 4.0 nflverse Player Summary Stats.
- Built a reproducible rolling-origin research runner using historical 2012–2025 source assets.
- Evaluated four untouched target seasons: 2022, 2023, 2024, 2025.
- Compared a previous-season PPR/game naive baseline, position-specific ridge regression, and position-specific gradient boosting.
- Reported MAE, RMSE, Spearman, rank MAE, fantasy-relevant top-N overlap, and paired bootstrap uncertainty.
- Explicitly did not model availability/season totals without defensible point-in-time inputs.
- Did not perform unauthorized historical FantasyPros benchmarking.
- Created and persisted a clean prospective 2026 shadow snapshot before the first 2026 regular-season kickoff.
- Used a temporary branch-scoped GitHub Actions workflow to execute the internet-dependent experiment and persist exact outputs; removed that workflow after exact-head CI exposed the repository single-workflow invariant.
- Documented results and interpretation in `.ai/research/SHADOW_RANKING_EXPERIMENT.md`.

## Sources used
Only:
- `nflverse/nflverse-data` Player Summary Stats release `stats_player`;
- official `stats_player_regpost_2012.csv` through `stats_player_regpost_2025.csv` assets;
- `nflverse/nflverse-pbp` / `nflverse-data` documentation and license evidence for provenance/rights verification.

Not used:
- PFF or PFF-derived data;
- NFL Next Gen Stats / NFL Pro systematic inputs;
- FantasyPros API or historical ranking data;
- paid/private sources with unclear rights;
- target-season hindsight injury/depth/role information.

## License / rights evidence
VERIFIED FACT:
- admitted nflverse repositories/data family are documented as CC BY 4.0;
- attribution requirements are recorded in `.ai/research/SHADOW_RANKING_SOURCE_MANIFEST.md`;
- official release ID used by the runner: `236670328`, release name `Player Summary Stats`, updated `2026-08-26T07:35:58Z`;
- each downloaded season asset had its GitHub digest checked against an independently computed SHA-256, with exact metadata frozen in `.ai/research/generated/SHADOW_RANKING_ASSET_MANIFEST.json`.

## Experiment design
Cohort: returning QB/RB/WR/TE with at least four recorded games in Y-1 and target Y and the same position across Y-1/Y. Rookies/no-prior-season NFL history were excluded rather than fabricated.

Features: prior completed-season PPR/game, games, attempts, carries, targets, receptions, passing/rushing/receiving yards and TDs, interceptions, EPA components, target share, air-yards share, WOPR, prior-two-season PPR level/delta/recency weighting.

Held-out targets: 2022, 2023, 2024, 2025. Total held-out predictions: 663.

## Leakage controls
VERIFIED FACT:
- target Y features use completed Y-1/Y-2 regular-season data only;
- target-season Week 1+ data never enter target-season features;
- each holdout is trained only on target seasons strictly earlier than that holdout;
- no target-season final depth chart/injury/role state is reconstructed as preseason input;
- 2026 frozen predictions use completed data through 2025 only;
- no 2026 result data entered the snapshot.

## Models evaluated
- Naive: previous-season Full-PPR points per recorded game.
- Regularized: position-specific StandardScaler + Ridge(alpha=10.0).
- Higher capacity: position-specific GradientBoostingRegressor(n_estimators=150, learning_rate=0.05, max_depth=2, min_samples_leaf=8, fixed random seed).

Hyperparameters were fixed before held-out scoring.

## Metrics by position

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

Pooled:
- Naive: MAE `2.636`, RMSE `3.558`, Spearman `0.742`.
- Ridge: MAE `2.638`, RMSE `3.372`, Spearman `0.746`.
- Boost: MAE `2.674`, RMSE `3.437`, Spearman `0.731`.

Pooled MAE lift versus naive:
- Ridge: `-0.075%` (slightly worse).
- Boost: `-1.45%` (worse).

Paired bootstrap MAE delta, negative favoring challenger:
- pooled ridge vs naive: mean `+0.002`, 95% CI `[-0.127, +0.126]`;
- pooled boost vs naive: mean `+0.039`, 95% CI `[-0.101, +0.183]`.

STRONG EVIDENCE: neither challenger demonstrated a persuasive pooled held-out MAE advantage.

INFERENCE: WR ridge is the clearest local positive result, but its bootstrap interval crosses zero and Spearman is slightly worse than naive, so it is insufficient for promotion.

## 2026 frozen snapshot status
CLEAN / PROSPECTIVELY VALID / RESEARCH ONLY.

Persisted generation timestamp: `2026-09-09T14:53:48.967586+00:00` (10:53:48 AM ET).  
First-kickoff deadline: `2026-09-10T00:20:00+00:00` (8:20 PM ET).  
Rows: 343 returning QB/RB/WR/TE players.  
Artifact: `.ai/research/generated/SHADOW_RANKING_2026_SNAPSHOT.csv`.

Known snapshot limitations:
- returning veterans only;
- no rookies without 2025 NFL stats;
- no point-in-time preseason injury model;
- no point-in-time depth/role model;
- no 2026 outcome data.

## Primary result
**MORE EVIDENCE NEEDED**

Reason: richer historical models did not reliably beat the transparent naive baseline on the primary held-out MAE objective. Some position/metric improvements are real enough to justify a narrower successor validation if stronger rights-cleared point-in-time context can be added, but current evidence does not justify production use or added model complexity.

## Reproducibility / test evidence
- WR-018 GitHub Actions experiment run `34366202246`: SUCCESS.
- WR-018 persist/freeze run `34366601009`: experiment and generated-output freeze steps SUCCESS.
- First run artifact `wr018-shadow-results`: artifact ID `10109963499`, ZIP SHA-256 `0654cfe40e88ca73119a7d5698321c56d3a47d2765f4e747d1ca321f577c6b87`.
- Exact generated results, source-asset provenance, and 2026 snapshot are committed under `.ai/research/generated/`.
- Initial PR exact-head CI run `34367196615` FAILED at `test:release` because the temporary WR-018 workflow was still tracked and `validate-release-candidate.mjs` requires `.github/workflows/ci.yml` to be the only workflow.
- Remediation: temporary `.github/workflows/wr018-experiment.yml` deleted from the final branch diff. This was a research infrastructure cleanup only; no production behavior was changed.
- Manager should require the post-remediation exact-head CI run to be green before merge.

## Files changed in final diff
Research-only:
- `.ai/research/SHADOW_RANKING_SOURCE_MANIFEST.md`
- `.ai/research/SHADOW_RANKING_EXPERIMENT.md`
- `.ai/research/wr018_shadow_experiment.py`
- `.ai/research/wr018_requirements.txt`
- `.ai/research/generated/SHADOW_RANKING_RESULTS.json`
- `.ai/research/generated/SHADOW_RANKING_ASSET_MANIFEST.json`
- `.ai/research/generated/SHADOW_RANKING_2026_SNAPSHOT.csv`
- `.ai/research/HANDOFF.md`

Temporary execution-only file removed before final handoff:
- `.github/workflows/wr018-experiment.yml`

Production files changed: NO

Canonical shared state changed: NO

## Known limitations
- Returning-veteran cohort omits rookies and players without prior-season NFL history.
- No age/experience/draft-capital features in this first execution.
- No point-in-time historical preseason roster/depth/team-change model.
- No defensible injury/availability model; season-total error is therefore not reported.
- No replacement-adjusted value error because availability/season totals remain incomplete.
- No predictive-interval calibration beyond bootstrap uncertainty on paired MAE differences.
- No lawful contemporaneous FantasyPros historical comparator was used; no FantasyPros superiority claim is made.

## Open findings
STRONG EVIDENCE: simple prior-season PPR/game is a hard baseline to beat with these historical summary-only features.

STRONG EVIDENCE: higher capacity did not earn its complexity; gradient boosting did not improve pooled MAE and was inconsistent by position.

INFERENCE: the next value of R&D is more likely to come from genuinely preseason/point-in-time context (rookie priors, age, draft capital, team/role movement, availability) than from further tuning the same summary-only feature matrix.

UNKNOWN: whether a rights-cleared model with those missing context families can produce a stable, material held-out lift.

## Blocking issues
No block on completing WR-018. There is a block on any production-model recommendation: current held-out evidence is insufficient. Merge readiness also requires green post-remediation exact-head CI.

## Recommended next role
Manager / Architect

## Exact next action
Manager should review PR #115 and WR-018 evidence after exact-head CI is green, then either close the milestone at `MORE EVIDENCE NEEDED` or authorize a narrowly scoped successor validation whose evidence gate is: add rights-cleared point-in-time rookie/age/draft-capital/team-role context, preserve the same rolling-origin holdouts and naive comparator, and later score the frozen 2026 shadow snapshot prospectively. Do not authorize production ranking changes from WR-018 alone.

## Checkpoint / SHA
Latest research/documentation checkpoint before this handoff commit: `7c5a6cf9461d067a7f47ff2425dc337f4fc08963`.  
For merge/review, use the exact current head of `wr-018-open-data-shadow-ranking` / PR #115; the external Manager handoff should record that final immutable SHA.
