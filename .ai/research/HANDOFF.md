# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-034  
Role: Research & Development (R&D)  
Status: COMPLETE — MANAGER REVIEW REQUIRED

## Verified starting state

- assignment/base SHA: `f079220e8ed07280d08f13c5db006661728d7f35`;
- WR-033 returning-player expected-PPR/game specification remained frozen and separate;
- WR-027 risk remained warning/explanation-only;
- WR-D001 FantasyPros production authority remained unchanged;
- WR-021 snapshot and WR-023 protocol/manifest remained frozen.

## Branch / PR / target advancement

- branch: `wr-034-availability-expected-games`;
- PR: #123 — `WR-034: Availability / expected-games model research`;
- latest refreshed `main` during packaging: `7f0bd8d1febe578583996cfb4e8400e244a74bbf`;
- target advancement from assignment base: `CONTROL_PLANE_ONLY`; latest advancement is confined to Manager/shared workflow state and does not overlap WR-034 research or production surfaces;
- exact final PR head is recorded in PR #123 after this handoff commit.

## Execution mode used

Normal-chat fallback + GitHub Actions guarded research execution. Work mode was not required for completion.

## Frozen protocol / source contract

Detailed artifacts:
- `.ai/research/AVAILABILITY_EXPECTED_GAMES_PROTOCOL.md`;
- `.ai/research/generated/AVAILABILITY_EXPECTED_GAMES_PROTOCOL.json`;
- `.ai/research/AVAILABILITY_SOURCE_MANIFEST.md`;
- `.ai/research/AVAILABILITY_CANDIDATE_SPEC.md`;
- `.ai/research/AVAILABILITY_PRE_SCORING_SOURCE_CORRECTION.md`.

Guarded execution recorded:
- human protocol SHA-256: `e460e0284cfb9d17cdbd89b624bc07e5b4aa9e9509bf52ec0bfd1cbc226172a0`;
- machine lock SHA-256: `5270d7269fab385f70d0ba326e8b167630a06f6ce3cd8e190d1522e0dcd007be`;
- candidate spec SHA-256: `1e51c3a6b81a726c4bee8cc39057c0ff78a7075e6a37bd508c931bd9bfaa7fe7`;
- source manifest SHA-256: `cdf9a2ae0e0da74250f81f0e92af039b1faa5a305e9d2f6ce755a42b17d9b53e`;
- source-correction SHA-256: `1c14a6a878c8e830a8c30c184f1c49880284377295733c83ac94c9a519caf3ac`.

## Sources / rights / PIT reviewed

Final admitted scoring source: exact WR-025-locked nflverse Player Summary Stats assets for 2012–2025 only. No new medical/injury, roster, depth, transaction, suspension, ESPN ADP/rank, PFR/PFF, NGS/NFL Pro, or mutable current-status source was admitted.

A first guarded run failed closed **before any candidate scoring** because current nflverse `players.csv` no longer reproduced the WR-025 checksum. WR-034 then froze a pre-scoring correction that excluded Players/Draft metadata rather than silently refreshing them. The successful model therefore uses only locked prior-season/prior-two-season statistical inputs.

## Baselines / candidates tested

Baselines: schedule-adjusted prior games (`PREV_RATE`), prior games, and training-only position mean.

Expected-games candidates: RIDGE_MINIMAL, POISSON_MINIMAL, RIDGE_FULL, MULTINOMIAL_HURDLE. Development selection used 2018–2021 only; confirmation was 2022–2025 and could not rescue a development failure.

Warning candidates for <=8 and >=14 recorded games: training-position prevalence, LOGIT_MINIMAL, LOGIT_FULL.

## Primary expected-games results

Development selected `RIDGE_FULL` on the corrected stats-only feature matrix.

2022–2025 confirmation:
- n: 1,773;
- RIDGE_FULL MAE: `4.4794897026`;
- PREV_RATE MAE: `5.4940778342` — RIDGE_FULL improvement `18.47%`;
- position-mean MAE: `5.2083646297` — RIDGE_FULL improvement ~`14.0%`;
- RIDGE_FULL RMSE: `5.3656012263`;
- mean bias: `-0.0275527388`;
- repeated-player cluster bootstrap candidate-minus-PREV_RATE MAE delta: `-1.0145881316`, 95% CI `[-1.2142142332,-0.8037856235]`;
- all QB/RB/WR/TE position MAEs improved versus PREV_RATE;
- no candidate fallback rows in confirmation.

## Calibration / uncertainty

The empirical 80% residual interval achieved `80.0338%` pooled confirmation coverage with mean width ~`12.39` games. This is calibrated but broad and must be presented as uncertainty, not precise injury forecasting.

## Warning results

`LOGIT_FULL` passed the separate warning-only gate for both events:
- <=8 games: confirmation Brier skill `+16.86%`, ROC AUC `0.7657`, PR AUC `0.8859`;
- >=14 games: confirmation Brier skill `+13.50%`, ROC AUC `0.7891`, PR AUC `0.3632`.

Every position had positive confirmation Brier skill for both events and neither model showed gross reliability inversion. These probabilities are warning/explanation outputs only and do not alter expected-performance ordering.

## Coverage / robustness / applicability

Scored 2018–2025 cohort: 3,508 rows, 1,399 unique players, including 1,627 zero-game outcomes. Core admitted stats-source coverage was 100% by scored position/season.

Post-selection descriptive prior-PPR/game quartile diagnostic did **not** change selection. In confirmation Q4, RIDGE_FULL remained ~`9.31%` better than position mean and `6.62%` better than PREV_RATE overall. Q4 improvement versus PREV_RATE was strong for QB, modest for RB/TE, and essentially flat for WR; this limits claims of precision among high-value players.

Sensitivity found prior games to be an important input; worst single-feature training-mean omission increased a season-position MAE by ~`0.4993` games. No optional external source family was selected. Deterministic fallback remains PREV_RATE, then training-position mean with explicit fallback flag when prior games are unavailable.

## Final Phase-4 disposition

`EXPECTED-GAMES MODEL SUPPORTED`

For Manager consideration only: use stats-only `RIDGE_FULL` as a separate returning-player availability/continuation expectation, with broad uncertainty; retain `LOGIT_FULL` <=8 and >=14 probabilities as warning-only outputs. Do **not** label this as medical injury prediction and do not use it to alter WR-033 expected-PPR/game ordering.

Detailed result: `.ai/research/AVAILABILITY_EXPECTED_GAMES.md`.

## Recommended Phase-5 interface

Expose, separately from frozen WR-033 expected PPR/game:
- expected games: stats-only RIDGE_FULL, bounded to target-season schedule length;
- uncertainty: empirical 80% interval with explicit width/coverage semantics;
- low-availability probability: LOGIT_FULL <=8 games;
- high-availability probability: LOGIT_FULL >=14 games;
- provenance/coverage and fallback flags;
- fallback: PREV_RATE, then training-position mean.

Phase-5 may compose expected games with frozen WR-033 expected PPR/game only after Manager disposition; WR-034 does not authorize season-total production implementation.

## Reproducibility / CI

- first fail-closed run: `34537885926` — source digest mismatch before scoring;
- successful guarded experiment: `34538563779` — SUCCESS;
- scoring head: `297021185585bcf122ed6efc7ddd525473044a18`;
- generated-result commit: `5578843495bce4d174d530a4f1433906a6b9130e`;
- artifact ID: `10176373712`, SHA-256 `512ac5b4c4c2d86f6e3f96142d9671c5112a4ee41b8d1c9c4e8d7452face25d1`;
- post-selection diagnostic run: `34538944127` — SUCCESS;
- diagnostic artifact ID: `10176509984`, SHA-256 `b0a6c9876448b1f272fc1bece0146e371e8c308a63a1273cf7cc331b5211f8c5`;
- temporary WR-034 execution workflows removed before final PR diff;
- final exact-head repository CI is recorded/verified on PR #123 after this handoff commit.

## Integrity statements

2026 outcomes inspected: **NO**  
WR-021 snapshot changed: **NO**  
WR-023 protocol/manifest changed: **NO**  
WR-033 expected-performance spec changed: **NO**  
Production files/rankings changed: **NO**  
Canonical `.ai/shared/*` changed by R&D: **NO**

## Blocking issues

None for R&D research completion. Manager review/disposition is required before any downstream Phase-5 specification or production action.

## Recommended next role

Manager / Architect

## Exact next action

Review PR #123 and accept/reject the `EXPECTED-GAMES MODEL SUPPORTED` Phase-4 disposition, including the broad-uncertainty and high-value-player applicability caveats. If accepted, freeze the Phase-4 availability interface before creating the separate Phase-5 season-total composition task.
