# WR-018 Shadow Ranking Source Manifest

Task: WR-018 — Open-Data Shadow Ranking Model Experiment
Classification: EXPERIMENTAL / NON-PRODUCTION
Prepared before model execution: 2026-09-09

## Rights rule
Only sources with documented permission for this research use may enter the experiment. Technical accessibility is not treated as permission.

## Permitted source used in the first experiment

### nflverse player summary statistics
- Producer/workflow repository: `nflverse/nflverse-pbp`
- Canonical data repository/release family: `nflverse/nflverse-data`, release tag `stats_player` / “Player Summary Stats”
- Canonical release URL family: `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_regpost_<SEASON>.csv`
- Producer documentation states that `nflverse/nflverse-pbp` updates play-by-play, player stats, and kicking summaries and that the data is automatically pushed to `nflverse/nflverse-data` GitHub releases.
- License evidence: `nflverse/nflverse-pbp/LICENSE.md` is Creative Commons Attribution 4.0 International (CC BY 4.0). The license grants reproduction/adaptation rights subject to attribution and related conditions.
- Intended use here: non-production research/model experimentation using regular-season QB/RB/WR/TE summary statistics only.
- Attribution: nflverse / nflverse-pbp / nflverse-data, CC BY 4.0.
- Redistribution policy for WR-018: do not commit large raw source datasets. Commit only source/version references, code, compact aggregate metrics, and compact model predictions.

## Asset verification policy
The experiment runner must:
1. query the official `nflverse/nflverse-data` `stats_player` GitHub release;
2. resolve each requested `stats_player_regpost_<SEASON>.csv` asset from that official release;
3. record asset id, size, updated timestamp, browser download URL, and GitHub-provided SHA-256 digest when present;
4. download only from the official release URL;
5. fail closed if the asset is missing, expected schema is missing, or the source URL is not the official nflverse GitHub release family.

## Experiment seasons
Planned historical input window: 2012–2025 where schema consistency permits.
Planned rolling held-out target seasons: 2022, 2023, 2024, 2025.
Planned 2026 frozen shadow prediction inputs: completed data through 2025 only.

## Features permitted in first experiment
Derived only from prior completed nflverse regular-season player-stat rows:
- prior PPR production;
- attempts/completions/passing yards/passing TD/interceptions;
- carries/rushing yards/rushing TD;
- targets/receptions/receiving yards/receiving TD;
- passing/rushing/receiving EPA when present;
- target share, air-yards share, WOPR when present;
- recency/multi-season aggregates derived from the above.

No target-season Week 1+ data may enter target-season features.

## Explicit exclusions
The WR-018 experiment will not use:
- PFF data, grades, screenshots, exports, Derived Data, APIs, or manual transcription;
- NFL Next Gen Stats / NFL Pro systematically retrieved data;
- FantasyPros API or historical ranking data for training or benchmarking;
- paid/private data with unclear rights;
- target-season results as features;
- reconstructed preseason injury/depth context from season-final hindsight.

## Availability / rookie limitation
The first experiment does not claim a defensible open-data preseason injury/availability model. It therefore treats availability as a missing stage and evaluates a returning-veteran performance cohort. Rookies and players without prior-season NFL statistical history are not assigned fabricated features.

## 2026 freeze condition
A prospectively clean 2026 shadow snapshot is allowed only if generated before the first 2026 regular-season game. NFL’s published Week 1 schedule lists Patriots at Seahawks for September 9, 2026 at 8:20 PM ET. Any snapshot generated after kickoff must be marked contaminated/ineligible rather than reconstructed retrospectively.

## Rights confidence
HIGH for the nflverse CC BY 4.0 source family used here, with attribution retained.
No legal conclusion is made about unrelated upstream or third-party data families.
