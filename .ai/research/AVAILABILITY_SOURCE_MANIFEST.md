# WR-034 Availability Source / Rights / PIT Manifest

Status: FROZEN PRE-SCORING SOURCE CONTRACT — EXPERIMENTAL / NON-PRODUCTION
Task: WR-034
Protocol Git blob: `163d1085dc71f9ceed36a467a8983c40e2d3db7f`
Correction record: `.ai/research/AVAILABILITY_PRE_SCORING_SOURCE_CORRECTION.md`

## Admitted scoring source

| Source | Use | Rights basis | PIT rule | Immutable requirement | Status |
|---|---|---|---|---|---|
| nflverse Player Summary Stats | historical target games and completed Y-1/Y-2 statistical/usage features | previously admitted by WR-025 under CC BY 4.0 | target-Y fields are outcomes only; predictors use completed earlier seasons | exact WR-025 asset ID and SHA-256 for each 2012–2025 file must reproduce | ADMITTED |

No new source family is admitted.

## Removed after fail-closed pre-scoring verification

The first guarded run (`34537885926`) verified the requested 2012–2025 Player Summary Stats assets and then stopped before scoring because current nflverse `players.csv` had SHA-256 `c2402e02d39c7ca1adbd9ca5c894bb11f693ab01da0721bff44db2a8bd1ea53d`, not the WR-025 locked `a33998d3981bda4f49f40390c5c0fa30036112ee1ea5de19ed4609e2ad3be3e2`.

The exact historical asset bytes were not recovered through the available release-asset endpoint. WR-034 therefore excludes both Players metadata and Draft Picks metadata from its candidate inputs rather than substitute revised mutable bytes. This is a pre-scoring source correction; no candidate result existed.

## Explicitly excluded / held

| Source/family | Disposition | Reason |
|---|---|---|
| 2026 regular-season stats/PBP/outcomes | EXCLUDED — FROZEN TEST CONTAMINATION | WR-021/WR-023 boundary |
| nflverse Players current/revised asset | EXCLUDED FROM WR-034 EXECUTION | exact locked historical raw bytes not reproduced |
| nflverse Draft Picks | EXCLUDED FROM WR-034 EXECUTION | metadata family removed conservatively with failed immutable-metadata path; not needed for cohort |
| ESPN ADP/rank | EXCLUDED FROM EXPECTED-GAMES MODEL | downstream market timing only under WR-D001 |
| current roster/status/injury designation | EXCLUDED — POINT-IN-TIME | mutable current state cannot reconstruct historical preseason state |
| historical injury/medical feeds not separately admitted | EXCLUDED — RIGHTS / PIT / COVERAGE | no verified lawful complete historical as-of corpus under WR-034 |
| depth charts / weekly rosters | EXCLUDED — POINT-IN-TIME / COVERAGE | WR-029 did not establish a uniform historical preseason-as-of contract |
| hindsight transactions/suspensions/retirements | EXCLUDED — POINT-IN-TIME | hindsight reconstruction risk |
| PFR snap/advanced/combine | HOLD / EXCLUDE RIGHTS | WR-029 rights hold |
| PFF / proprietary grades | EXCLUDED — RIGHTS | no admitted license basis |
| systematic NFL NGS / NFL Pro | EXCLUDED — RIGHTS | no admitted rights basis |
| current nflverse injury feed as core dependency | EXCLUDED — COVERAGE / MAINTAINABILITY | WR-029 maintainability finding |
| FantasyPros historical/API competing-model input | EXCLUDED | not admitted for competing training |

## Target semantics
`target_games` is the recorded regular-season games field in the admitted Player Summary Stats target-season asset. A stats-defined returner without a qualifying target-season row receives zero target games under the reused WR-025 cohort construction. This is participation/availability, not a medical injury label.

`LOW_AVAILABILITY = target_games <= 8`; `HIGH_AVAILABILITY = target_games >= 14`.

## Cutoff / join contract
For target Y, features use only completed Y-1/Y-2 Player Summary Stats. Target-Y Player Summary Stats define outcomes only after prediction. No target-Y Week 1+ information may enter features, preprocessing, model selection, calibration, interval construction, or fallback parameters. No 2026 asset may be requested.

Historical research cutoff remains September 1 12:00 UTC of target Y.

## Raw-asset verification
The guarded runner must read `.ai/research/generated/HISTORICAL_RANKING_ASSET_MANIFEST.json`, request only `stats_player_regpost_2012.csv` through `stats_player_regpost_2025.csv`, calculate SHA-256, verify exact locked asset IDs/digests, fail closed on mismatch/schema failure, and emit retrieval timestamp, release/asset ID, calculated/locked digest, row count, columns, and schema hash.

## Frozen prospective sentinels
Before and after scoring hash:
- `.ai/research/generated/CONTEXT_SHADOW_2026_SNAPSHOT.csv`;
- `.ai/research/WR023_2026_PROSPECTIVE_EVALUATION_PROTOCOL.md`;
- `.ai/research/generated/WR023_PROTOCOL_MANIFEST.json`.

Before/after values must match exactly. The accepted WR-021 snapshot and WR-023 protocol identities remain immutable.

## Coverage / missingness
WR-034's admitted candidate features come from prior-season/prior-two-season Player Summary Stats plus the explicit `has_prev2` history indicator. No unavailable medical/status/metadata field is imputed. Y-2 absence follows the reused WR-025 history construction and is explicitly flagged by `has_prev2`.

Any historical stats asset integrity failure invalidates scoring rather than degrading silently.
