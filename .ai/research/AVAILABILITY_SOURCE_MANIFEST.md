# WR-034 Availability Source / Rights / PIT Manifest

Status: FROZEN PRE-SCORING SOURCE CONTRACT — EXPERIMENTAL / NON-PRODUCTION
Task: WR-034
Protocol Git blob: `4ed74ba431110c7e9742dccab2dfb63ef50592ae`

## Admitted sources

| Source | Use in WR-034 | Rights basis | PIT treatment | Immutable/provenance requirement | Status |
|---|---|---|---|---|---|
| nflverse Player Summary Stats | historical target games; prior Y-1/Y-2 production/games/features | previously admitted by WR-025 under CC BY 4.0 | only seasons <=2025; target-Y fields used only as outcomes, never predictors | exact release asset and SHA-256 must match `.ai/research/generated/HISTORICAL_RANKING_ASSET_MANIFEST.json` | ADMITTED |
| nflverse Players | stable identity, birth date, rookie season / experience | previously admitted by WR-025 under CC BY 4.0 | immutable/stable metadata only | exact locked asset SHA-256 must match WR-025 manifest | ADMITTED |
| nflverse Draft Picks | immutable draft pick/round metadata | previously admitted by WR-025 under CC BY 4.0 | draft-time immutable metadata only | exact locked asset SHA-256 must match WR-025 manifest | ADMITTED |

No new source family is admitted for WR-034 scoring.

## Explicitly excluded / held sources

| Source/family | Disposition | Reason |
|---|---|---|
| 2026 regular-season stats/PBP/outcomes | EXCLUDED — FROZEN TEST CONTAMINATION | WR-021/WR-023 prospective boundary; not requested or inspected |
| ESPN ADP/rank | EXCLUDED FROM EXPECTED-GAMES MODEL | downstream market timing only under WR-D001; not intrinsic availability |
| current roster/status/injury designation | EXCLUDED — POINT-IN-TIME | mutable current fields do not reconstruct historical target-preseason state |
| historical injury/medical feeds not already admitted | EXCLUDED — RIGHTS / PIT / COVERAGE | no separately verified lawful, complete, maintainable as-of corpus under WR-034 |
| depth charts / weekly rosters | EXCLUDED — POINT-IN-TIME / COVERAGE | WR-029 did not establish a uniform historical preseason-as-of contract |
| transactions/suspensions/retirements reconstructed from current state | EXCLUDED — POINT-IN-TIME | hindsight reconstruction risk |
| PFR snap/advanced/combine | HOLD / EXCLUDE RIGHTS | existing WR-029 rights hold remains |
| PFF / proprietary grades or derived inputs | EXCLUDED — RIGHTS | no admitted license basis |
| systematic NFL NGS / NFL Pro features | EXCLUDED — RIGHTS | no admitted rights basis |
| current nflverse injury feed as core dependency | EXCLUDED — COVERAGE / MAINTAINABILITY | WR-029 maintainability finding remains |
| FantasyPros historical/API data for competing-model training | EXCLUDED | not admitted for competing model training |

## Target semantics

`target_games` is the recorded regular-season games field in the admitted historical Player Summary Stats asset for target season Y. If a returner has a prior-season qualifying row but no target-season qualifying row, WR-025 cohort construction records target games as zero. This is an availability/participation outcome, not a medical injury label.

`LOW_AVAILABILITY` is `target_games <= 8`, matching WR-027. `HIGH_AVAILABILITY` is `target_games >= 14` and is descriptive only.

## Cutoff contract

For target season Y:
- predictors may use completed Y-1/Y-2 regular-season information and admitted immutable metadata;
- target Y Player Summary Stats may be used only to define the historical outcome after the prediction is formed;
- no target-Y Week 1+ field may enter features, preprocessing, imputation, model selection, probability calibration, or interval construction;
- no 2026 statistical outcome may be downloaded or requested.

Historical research cutoff remains September 1 12:00 UTC of target season.

## Raw asset verification

The guarded runner must:
1. read `.ai/research/generated/HISTORICAL_RANKING_ASSET_MANIFEST.json` from the committed repository;
2. download only the exact `stats_player_regpost_2012.csv` through `stats_player_regpost_2025.csv`, `players.csv`, and `draft_picks.csv` assets required by the WR-025 cohort builder;
3. calculate SHA-256 from downloaded bytes;
4. compare each digest to the WR-025 locked digest;
5. fail closed on missing asset, schema mismatch, or digest mismatch;
6. emit a WR-034 provenance manifest containing release IDs, asset IDs, retrieval timestamp, calculated digest, locked digest, row counts, and schema hash/columns.

No 2026 stats asset may be referenced by the runner.

## Frozen artifact integrity

The runner must hash before and after scoring:
- `.ai/research/generated/CONTEXT_SHADOW_2026_SNAPSHOT.csv`;
- `.ai/research/WR023_2026_PROSPECTIVE_EVALUATION_PROTOCOL.md`;
- `.ai/research/generated/WR023_PROTOCOL_MANIFEST.json`.

The before/after digests must be identical. The WR-021 snapshot and WR-023 protocol known accepted identities must also remain consistent with prior accepted research where recorded.

## Coverage and missingness

Because WR-034 reuses the WR-025 returner builder, core source coverage is the cohort itself. Missing Y-2 history and age use the existing explicit `has_prev2` / `age_missing` indicators. No unavailable injury/status/depth field is imputed because those families are excluded, not optional inputs.

A source-integrity failure invalidates candidate scoring and yields fail-closed research status rather than a best-effort model result.
