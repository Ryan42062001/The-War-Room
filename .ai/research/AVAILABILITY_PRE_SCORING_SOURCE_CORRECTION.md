# WR-034 Pre-Scoring Source Correction

Status: FROZEN BEFORE ANY CANDIDATE SCORING — EXPERIMENTAL / NON-PRODUCTION
Task: WR-034
Date: 2026-09-10

## Trigger

The first guarded WR-034 execution reached historical-source verification and failed **before candidate fitting or scoring**. All requested `stats_player_regpost_2012.csv` through `stats_player_regpost_2025.csv` assets passed their WR-025 locked SHA-256 checks. The next required source, current nflverse `players.csv`, did not.

Observed current `players.csv` SHA-256:
`c2402e02d39c7ca1adbd9ca5c894bb11f693ab01da0721bff44db2a8bd1ea53d`

WR-025 locked `players.csv` SHA-256:
`a33998d3981bda4f49f40390c5c0fa30036112ee1ea5de19ed4609e2ad3be3e2`

Guarded workflow run: `34537885926`.

The exact previously locked release asset ID `552739287` was not retrievable through the available GitHub release-asset endpoint during this session. The accepted WR-029 benchmark lock records the identity/hash but does not contain the original raw bytes.

## Why this is a source correction rather than a result-driven retune

No expected-games model fit, probability fit, metric, fold result, bootstrap, calibration result, or adoption decision existed when this correction was made. The failure occurred in `load_locked_history()` at source digest verification.

The protocol's adoption thresholds, folds, target definitions, models, hyperparameters, seeds, metrics, interval construction, warning gates, and fallback rules remain unchanged.

## Fail-closed disposition

WR-034 will **not** replace the locked historical player metadata with the revised mutable `players.csv`. Instead, WR-034 removes Player-metadata and Draft-Pick metadata from candidate inputs and executes only on the already-locked historical Player Summary Stats assets whose exact WR-025 digests reproduced in the failed run.

This is deliberately more conservative than accepting a revised metadata snapshot.

## Cohort effect

NONE.

The WR-025 returner cohort boundary is defined from prior-season Player Summary Stats rows. `players.csv` and `draft_picks.csv` affect metadata features, not whether a prior-season player-summary returner row exists. WR-034 continues to reuse the same stats-based returner construction, including zero-game target outcomes.

## Corrected feature sets

### MINIMAL_AVAILABILITY
- `prev1_games`
- `prev2_games`
- `games_delta`
- `has_prev2`

### FULL_STATS_AVAILABILITY
Reuse the exact WR-025 vector values derived from locked Player Summary Stats and prior-history construction, excluding metadata-dependent fields:
- exclude `age_sep1`
- exclude `age_missing`
- exclude `experience_years`
- exclude `log_draft_pick`
- exclude `draft_round`
- exclude `drafted`

All remaining WR-025 prior-season/prior-two-season statistical, opportunity, efficiency, recency and history-indicator fields remain eligible.

Candidate names `RIDGE_FULL` and `LOGIT_FULL` are retained for continuity, but `FULL` now means `FULL_STATS_AVAILABILITY`, not the original metadata-inclusive matrix.

## Corrected source contract

Scoring source admitted for WR-034 candidates:
- nflverse Player Summary Stats, exact WR-025 locked assets for 2012–2025 only.

Removed from WR-034 execution after fail-closed verification failure:
- nflverse Players metadata;
- nflverse Draft Picks metadata.

These sources remain historically admitted in prior War Room research, but WR-034 does not rely on a revised or unrecoverable raw version.

## Safety

2026 regular-season outcomes were not requested or inspected.
WR-021 / WR-023 frozen artifacts were not modified.
WR-033 expected-PPR/game specification was not modified.
Production code/rankings were not modified.

This correction must be reflected in the human protocol, source manifest, candidate spec, machine lock and runner **before** the next scoring attempt.
