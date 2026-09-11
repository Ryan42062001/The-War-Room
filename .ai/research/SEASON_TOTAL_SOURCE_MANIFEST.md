# WR-035 Source and Upstream Manifest

Status: `FROZEN_PRE_SCORING_LOCK`

WR-035 uses only:

- nflverse `stats_player` regular-season player-stat CSV assets for 2012-2025, pinned and hash-verified by the WR-025/WR-034 loaders;
- nflverse `players` and `draft_picks` metadata assets used by the frozen WR-033 feature builder;
- committed WR-034 historical expected-games rows and source provenance for exact replay comparison;
- repository specifications and decisions for WR-033 (`WR-D005`) and WR-034 (`WR-D006`).

No 2026 regular-season asset is permitted. No ESPN, FantasyPros, live-draft, medical, injury-report, replacement-level, FLEX, or roster data is admitted. The executable provenance output must record exact release URLs, asset names, digests, downloaded SHA-256 values, repository head, dependency versions, and hashes of all frozen WR-035 and upstream artifacts.

