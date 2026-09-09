# WR-018 Shadow Ranking Source Manifest

Task: WR-018 — Open-Data Shadow Ranking Model Experiment  
Role: Research & Development (R&D)  
Classification: EXPERIMENTAL / NON-PRODUCTION  
Manifest created before model execution: 2026-09-09  
Assignment-start main SHA: `8931b30d4f4f387504b17ac07d837aa87a166948`

## Rights rule
Only sources with documented permission for the intended research use enter this experiment. Technical accessibility is not treated as permission. This document records source provenance and license evidence before training/evaluation.

## Source admitted for WR-018

### nflverse player summary statistics
- Data repository: `nflverse/nflverse-data`
- Release family/tag: `stats_player` — “Player Summary Stats”
- Producer/workflow repository: `nflverse/nflverse-pbp`
- Intended assets: official `stats_player_regpost_<SEASON>.csv` release assets for 2012–2025.
- Intended use: non-production research/model experimentation using historical regular-season QB/RB/WR/TE summary statistics.
- Redistribution policy: do not commit large raw datasets. Commit only source/version metadata, compact aggregate metrics, reproducible research code, and compact research predictions.

## License / rights evidence
VERIFIED FACT:
- `nflverse/nflverse-data` identifies the repository as CC-BY-4.0 licensed.
- Its `LICENSE.md` contains the Creative Commons Attribution 4.0 International license and attribution requirements.
- The `nflverse-data` releases page identifies `stats_player` as Player Summary Stats created with `nflfastR::calculate_stats()`.
- `nflverse/nflverse-pbp` describes itself as the code/workflow that updates play-by-play and player stats and pushes those data to `nflverse/nflverse-data` releases; that repository is also labeled CC-BY-4.0.

Attribution retained for research artifacts: nflverse / nflverse-data / nflverse-pbp, CC BY 4.0.

Rights confidence: HIGH for this admitted nflverse source family for this research experiment. This is not a legal conclusion about unrelated upstream or third-party datasets.

## Asset verification policy
The experiment runner must:
1. query the official GitHub release for `nflverse/nflverse-data` tag `stats_player`;
2. resolve each requested `stats_player_regpost_<SEASON>.csv` asset from that release;
3. record asset ID, filename, byte size, update timestamp, browser download URL, and GitHub-provided digest when present;
4. download only from the official `github.com/nflverse/nflverse-data/releases/download/stats_player/` family;
5. compute SHA-256 locally and compare it with GitHub's digest when supplied;
6. fail closed if an asset or required schema field is missing.

## Historical experiment window
- Historical source seasons requested: 2012–2025, subject to schema consistency.
- Rolling held-out target seasons: 2022, 2023, 2024, 2025.
- For target season Y, features may use completed seasons Y-1 and Y-2 only.
- No target-season Week 1+ result may enter target-season features.

## Features permitted in first experiment
Derived only from admitted prior-season nflverse player summary data:
- prior Full-PPR production;
- attempts/completions/passing yards/passing TD/interceptions;
- carries/rushing yards/rushing TD;
- targets/receptions/receiving yards/receiving TD;
- passing/rushing/receiving EPA where present;
- target share, air-yards share, WOPR where present;
- recency and two-season aggregates derived from those fields.

## Explicitly excluded
WR-018 does not use:
- PFF data, grades, APIs, exports, screenshots, manual transcription, or PFF-derived data;
- systematic NFL Next Gen Stats / NFL Pro data;
- FantasyPros API or historical ranking data for training or historical benchmarking;
- paid/private datasets with unclear rights;
- reconstructed preseason injury/depth context from hindsight;
- target-season outcomes as features.

## Availability, rookie, and role limitations
The admitted source set does not establish a defensible point-in-time preseason injury/availability model. WR-018 therefore evaluates performance signal for returning players with prior NFL statistical history and does not fabricate injury, availability, rookie, or preseason depth-chart inputs. Availability/season-total modeling remains a missing stage unless separately supported by rights-cleared point-in-time data.

## 2026 frozen snapshot eligibility
VERIFIED FACT: the NFL's official 2026 Week 1 schedule lists Patriots at Seahawks on Wednesday, September 9, 2026 at 8:20 PM ET as the first regular-season game.

WR-018 may create a prospectively clean 2026 shadow snapshot only before that kickoff and only from information available before the freeze. The snapshot must use completed data through 2025, remain disconnected from production, and explicitly flag missing rookie/injury/depth context. If generated after kickoff, it is ineligible and must not be reconstructed retrospectively.

## Post-execution provenance verification
The manifest above existed on the research branch before the experiment was run. After execution, the following provenance was captured without expanding the admitted source set:

- official release ID: `236670328`;
- release name: `Player Summary Stats`;
- release tag: `stats_player`;
- release updated timestamp: `2026-08-26T07:35:58Z`;
- historical assets actually used: official `stats_player_regpost_2012.csv` through `stats_player_regpost_2025.csv`;
- every GitHub-provided SHA-256 digest matched the independently computed download SHA-256;
- exact per-season asset IDs, sizes, timestamps, URLs, digests, and verified hashes are frozen in `.ai/research/generated/SHADOW_RANKING_ASSET_MANIFEST.json`;
- persisted 2026 snapshot generation timestamp: `2026-09-09T14:53:48.967586+00:00` (10:53:48 AM ET), before the `2026-09-10T00:20:00+00:00` first-kickoff deadline;
- snapshot population: 343 returning QB/RB/WR/TE players;
- no 2026 regular-season outcomes were used.

No additional source family was admitted after this manifest was created.
