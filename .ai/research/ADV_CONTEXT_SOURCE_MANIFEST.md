# WR-029 Advanced Context — Source / Rights / PIT Manifest

Status: PRE-SCORING SOURCE REVIEW  
Task: WR-029  
Starting canonical main: `b89919121cfcc00fc9a02be5d82c1a892036e70b`

This manifest records the independent source-rights / point-in-time (PIT) review required before WR-029 enrichment scoring. A source being available through open-source code is not sufficient by itself; the upstream provider, declared license, temporal semantics and coverage must be defensible.

## Admission matrix

| Source family | Provider / upstream | Rights basis | Historical PIT basis | Coverage | WR-029 initial disposition |
|---|---|---|---|---|---|
| nflverse Player Summary Stats | nflverse / nflverse-pbp | nflverse-data repository `CC BY 4.0`; previously admitted WR-025 exact assets | completed Y-1 REG events only | 2012–2025 required | ADMITTED — locked benchmark only |
| nflverse Players immutable identity/birth/rookie fields | nflverse Players; mixed upstream fields exist but only approved fields used | nflverse-data `CC BY 4.0`; WR-025 exact asset | birth date / rookie season treated immutable/preseason-known; mutable current fields forbidden | broad | ADMITTED — approved subset only |
| nflverse Draft Picks | nflverse / PFR draft records | nflverse-data `CC BY 4.0`; WR-025 exact asset | draft event predates NFL target preseason | historical | ADMITTED — draft-time fields only |
| nflverse Play-by-Play (`pbp`) | nflverse/nflverse-pbp, distributed by nflverse-data | nflverse-data `CC BY 4.0`; nflverse-pbp repo also `CC-BY-4.0` | only completed Y-1 `REG` plays used; event season/week/game identify observation time; target Y Week 1+ never loaded | documented since 1999 | ADMITTED for long-history PBP families, subject to exact asset/schema lock |
| nflverse Participation | NFL NGS before 2023; FTN 2023+ via nflverse | nflreadr explicitly states participation release under `CC-BY-SA 4.0`, with attribution to NFL NextGenStats via nflverse for <=2022 and FTN Data via nflverse from 2023 | event/play keyed; 2023+ source is delivered only after postseason, therefore usable only as lagged Y-1 context | 2016+; provenance transition | AUDIT ONLY / NOT CORE IN WR-029 — transition + systematic NGS dependency; no routes/YPRR inferred |
| FTN charting | FTN Data via nflverse | nflreadr explicitly `CC-BY-SA 4.0`, attribution to FTN Data via nflverse | `season`, `week`, play IDs and `date_pulled`; used only as lagged Y-1 scheme context | 2022+ | ADMITTED only for short-history scheme challenger, never core without enough confirmation depth |
| nflverse Depth Charts <=2024 | NFL Data Exchange historical source via nflverse | nflverse-data distribution is CC-BY-4.0, but upstream intended-use basis is not documented here | week-level historical records do not preserve a publication timestamp that proves a target-preseason snapshot; Week 1 records are too late for fixed Sep-1 cutoff | back to 2001 | EXCLUDED — POINT-IN-TIME / SOURCE-PROVENANCE |
| nflverse Depth Charts >=2025 | ESPN via nflverse | nflverse distribution; upstream source changed to ESPN | explicit ISO8601 `dt` gives PIT semantics and includes preseason, but only 2025+ under this schema | 2025+ | EXCLUDED — COVERAGE for historical model validation; useful future operational candidate only |
| nflverse Weekly Rosters | nflverse / NFL.com plus other metadata sources | nflverse-data distribution CC-BY-4.0 | weekly snapshots do not provide a uniform historical publication timestamp / Sep-1 target-preseason snapshot contract; target Week 1 state is too late | 2002+ | EXCLUDED — POINT-IN-TIME for WR-029 depth/vacated-role model |
| nflverse Snap Counts | Pro Football Reference via nflverse | nflverse docs explicitly identify PFR upstream; no separate intended-use clearance established by WR-029 | completed Y-1 would be temporally safe, but rights gate fails | historical | EXCLUDED — RIGHTS |
| nflverse PFR Advanced Stats | Pro Football Reference via nflverse | upstream PFR; no intended-use clearance established | completed Y-1 temporally safe, rights gate fails | historical | EXCLUDED — RIGHTS |
| nflverse Next Gen Stats | NFL Next Gen Stats | systematic NGS dependency; no stronger accepted rights basis for player-level NGS family beyond participation-specific nflreadr statement | not needed because PBP alternatives exist | varies | EXCLUDED — RIGHTS for systematic NGS feature family |
| nflverse Injury feed | historical source no longer maintained after 2024 | not admitted | current source died; no maintainable 2025+ dependency | no 2025 current feed | EXCLUDED — COVERAGE / MAINTAINABILITY |
| FantasyPros historical/API | FantasyPros | no accepted lawful historical/API basis | not considered | n/a | EXCLUDED — RIGHTS / project policy |
| ESPN ADP/rank | ESPN | production-connected market signal | PIT may exist operationally but project decision WR-D001 reserves it for market timing | current | EXCLUDED from intrinsic custom value by WR-D001 |
| Staff/coach/play-caller corpus | no single admitted corpus found | no independently verified rights-clean dated corpus with full HC/OC/actual play-caller history | actual play caller cannot be inferred from OC name | insufficient | EXCLUDED — RIGHTS / PIT / COVERAGE |

## Authoritative evidence reviewed

### nflverse-data license

Repository: `https://github.com/nflverse/nflverse-data`  
License: `https://github.com/nflverse/nflverse-data/blob/main/LICENSE.md`  
Declared license: Creative Commons Attribution 4.0 International (CC BY 4.0).

The repository describes itself as the automated data-release store for nflverse projects and identifies the `pbp` release as play-by-play data.

### nflverse play-by-play

Loader documentation: `https://nflreadr.nflverse.com/reference/load_pbp.html`  
Dictionary: `https://nflreadr.nflverse.com/articles/dictionary_pbp.html`  
Build repository: `https://github.com/nflverse/nflverse-pbp`

`load_pbp()` documents that it loads the complete nflfastR play-by-play dataset from nflverse-data and supports all seasons since 1999. Direct release path is:

`https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_<season>.parquet`

Release tag: `pbp`; current release ID observed during source review: `58152862`.

WR-029 will only request seasons 2012–2025 and will filter `season_type == REG`. No 2026 PBP asset URL is constructed or requested.

### nflverse data update semantics

Schedule documentation: `https://nflreadr.nflverse.com/articles/nflverse_data_schedule.html`

PBP is updated during the season after game days. For WR-029 this live update cadence is irrelevant to leakage because every enrichment target Y uses only completed Y-1 event data. The exact retrieved revision is nevertheless frozen by raw SHA-256/schema manifest for reproducibility.

### Participation provenance

Loader: `https://github.com/nflverse/nflreadr/blob/main/R/load_participation.R`  
Dictionary: `https://nflreadr.nflverse.com/articles/dictionary_participation.html`

The loader explicitly states:
- data starts in 2016;
- participation prior to 2023 is NFL NGS;
- 2023 onward is FTN;
- the data is released under CC-BY-SA 4.0 with provider attribution;
- 2023+ data is provided after postseason completion.

The dictionary exposes `offense_players`, `players_on_play` and formation/personnel fields. Those indicate on-field participation only. They do **not** prove that a player ran a route. WR-029 will not calculate true routes, targets-per-route, route participation or YPRR from these fields.

Because the upstream provider changes and the older segment is systematic NGS, participation is not selected as a core dependency in WR-029 even though nflreadr publishes a license statement for this specific release.

### FTN charting

Loader: `https://nflreadr.nflverse.com/reference/load_ftn_charting.html`  
Dictionary: `https://nflreadr.nflverse.com/articles/dictionary_ftn_charting.html`

The loader explicitly states the data is manually charted by FTN Data, available from 2022 onward, and released under CC-BY-SA 4.0 with attribution to FTN Data via nflverse. The dictionary contains `date_pulled` plus charted fields including quarterback location, motion, play action, RPO and no-huddle.

WR-029 may test only team-level lagged scheme rates from these fields for target seasons 2023–2025. With only three target folds and no 2026 outcomes, this family is structurally short-history and cannot be declared core under the normal long-history confirmation contract.

### Depth charts

Loader: `https://nflreadr.nflverse.com/reference/load_depth_charts.html`  
Dictionary: `https://nflreadr.nflverse.com/articles/dictionary_depth_charts.html`  
Release-note evidence: nflreadr documents that after the 2024 season the source changed from NFL Data Exchange to ESPN.

For 2025 onward, the `dt` field is explicitly an ISO8601 timestamp and can assign records to a point in time, including preseason snapshots. The historical <=2024 schema is week-level and lacks an equivalent load timestamp. Under the fixed WR-029 Sep-1 cutoff, a Week 1 depth chart cannot be used because it is not proven available before kickoff. The source transition also breaks one stable historical schema.

Disposition: no depth-rank/vacated-role feature is scored in WR-029.

### Weekly rosters

Loader: `https://nflreadr.nflverse.com/reference/load_rosters_weekly.html`  
Dictionary: `https://nflreadr.nflverse.com/articles/dictionary_rosters.html`

Weekly roster availability back to 2002 is documented, but the historical files do not expose a stable per-record publication timestamp sufficient to prove a Sep-1 preseason snapshot across all WR-029 target seasons. Current mutable roster fields are explicitly forbidden as historical reconstruction.

Disposition: no target-season team-change/depth/vacated-opportunity feature is built from these records.

### PFR snap / advanced feeds

nflverse schedule/reference documentation explicitly labels these as PFR Snap Count Data / PFR Advanced Stats and the snap dictionary includes PFR game/player IDs. The nflverse repository license does not by itself prove that all intended downstream uses of the upstream PFR material are authorized. WR-029 found no separate intended-use clearance satisfying the Manager hold rule.

Disposition: excluded.

### Injuries

nflverse data schedule states the injury data source died after the 2024 season and no 2025 data was available at the documented point. This fails maintainability for a core ranking engine dependency.

Disposition: excluded as core.

## Route/YPRR guard

WR-029 contains no feature named `routes`, `routes_run`, `target_per_route`, `route_participation`, or `yprr` unless an exact player-by-player route denominator is admitted. No such denominator is admitted in this study.

- offensive snaps != routes;
- on-field offensive participation != routes;
- pass-play participation != route participation;
- target receiver route label != routes run for every eligible receiver.

True YPRR is therefore **not calculated**.

## Attribution requirements for any retained research artifact

- nflverse-data / nflverse-pbp: attribute nflverse; CC BY 4.0.
- FTN charting: attribute `FTN Data via nflverse`; CC-BY-SA 4.0.
- Participation, if referenced diagnostically: attribute the provider indicated by nflreadr (`NFL NextGenStats via nflverse` for <=2022; `FTN Data via nflverse` for 2023+), CC-BY-SA 4.0 per loader documentation.

## Outcome boundary

No source path, asset resolver or code in WR-029 may request a 2026 regular-season outcome asset. PBP/statistical season constants must hard-stop at 2025.
