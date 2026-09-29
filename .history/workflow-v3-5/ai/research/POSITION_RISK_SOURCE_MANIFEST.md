# WR-027 Position-Specific Risk Calibration — Source Manifest

Status: FROZEN BEFORE WR-027 SCORING  
Task: WR-027  
Role: Research & Development (R&D)  
Production authorization: NONE

## Purpose

WR-027 is a historical-only calibration study built on the already accepted WR-025 research dataset and feature architecture. No new outcome family is required. This manifest is intentionally narrow: it reuses the exact rights-clean WR-025 historical source families and rejects any source that could contaminate the frozen 2026 prospective test.

## Admitted source families

### nflverse Player Summary Stats
- Repository: `nflverse/nflverse-data`
- Release family/tag: `stats_player`
- Rights: CC BY 4.0 as already verified in WR-021 / WR-025
- WR-027 permitted seasons: 2012 through 2025 only
- Permitted use: completed historical regular-season QB/RB/WR/TE summaries used by the WR-025 returner cohort/features and historical labels
- Explicit prohibition: no 2026 regular-season asset may be requested, downloaded, inspected, summarized or scored

### nflverse Players
- Repository: `nflverse/nflverse-data`
- Release family/tag: `players`
- Rights: CC BY 4.0 as already verified in WR-021 / WR-025
- Permitted fields: stable identity, birth date, rookie season, deterministic crosswalk fields already used by WR-025
- Excluded as historical predictors: current team, current status, current position, PFF identifiers/fields, or any current-state field that would create hindsight semantics

### nflverse Draft Picks
- Repository: `nflverse/nflverse-data`
- Release family/tag: `draft_picks`
- Rights: CC BY 4.0 as already verified in WR-021 / WR-025
- Permitted fields: draft-time position, overall pick, round, team, deterministic GSIS identity
- Excluded: hindsight career-result fields

## Exact provenance policy

WR-027 must reuse the historical assets recorded by WR-025 in:

`.ai/research/generated/HISTORICAL_RANKING_ASSET_MANIFEST.json`

For nflverse assets used by WR-027, the runner must independently SHA-256 the downloaded bytes and fail closed if the digest differs from the WR-025 recorded digest. This prevents a silent historical-data revision from changing the WR-027 benchmark.

No SafeLeagues/MFL draft-cost data is needed for WR-027 because the WR-025 benchmark admission gate failed. WR-027 does not reopen or relax that gate.

## Explicitly excluded

- all 2026 regular-season outcomes, including any 2026 `stats_player` asset;
- FantasyPros historical/API rankings absent separately approved exact rights;
- PFF or PFF-derived data;
- systematic NFL Next Gen Stats / NFL Pro data absent explicit rights;
- scraped/private/paid unclear-rights data;
- target-season Week 1+ information used as a predictor;
- retrospective injury/depth/team-status fields masquerading as preseason context;
- WR-021 frozen 2026 snapshot as a training or scoring target;
- any rewrite or replacement of the WR-023 prospective protocol/gate.

## Frozen prospective identities that must remain unchanged

WR-021 snapshot:
- path: `.ai/research/generated/CONTEXT_SHADOW_2026_SNAPSHOT.csv`
- SHA-256: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`

WR-023 protocol:
- path: `.ai/research/WR023_2026_PROSPECTIVE_EVALUATION_PROTOCOL.md`
- SHA-256: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`

The execution workflow must verify both identities before and after WR-027 scoring.

## Historical cohort / leakage boundary

WR-027 inherits the WR-025 returner cohort and feature construction unchanged:
- target seasons assembled from completed historical data only;
- scored seasons 2018–2025;
- for target season Y, features use Y-1/Y-2 completed seasons plus immutable/preseason-known context;
- target Y outcomes enter only labels/scoring;
- zero-game returners remain in availability analysis;
- PPR/game analysis includes only players with at least one recorded target-season game because PPR/game is undefined at zero games;
- rookies remain separate and are not mixed into the returner risk calibration.

2018–2025 are chronological retrospective folds, not pristine project-level holdouts.

## Rights conclusion

The admitted WR-027 dataset is rights-clean under the same verified nflverse CC BY 4.0 basis already accepted for WR-025. No ambiguous-rights source is admitted and no 2026 outcome source is permitted.