# WR-042 — Source Rights / Custody Matrix

Status: `FAIL_CLOSED — CUSTODY UNAVAILABLE`  
Task: `WR-042`  
Governing contract: `wr-returning-player-v2-evidence-contract/1.0.0`  
Audited contract head: `00a9e787e716d6697e6cd0d9252982a672abbbe0`  
Assignment main: `142a9580fb408cd78ddae1026a67dd82f7d7b144`

This matrix records the exact provider objects observed during WR-042 and their custody disposition. **No row below is admitted.** Provider-reported hashes and sizes are identity metadata only; they are not substitutes for recomputing the digest from acquired bytes and retaining those bytes under the audited custody policy.

## Player Summary Stats — `NFLVERSE_PLAYER_SUMMARY_STATS`

Provider release: `nflverse/nflverse-data`, tag `stats_player`, release ID `312902124`, provider release update `2026-09-11T16:30:11Z`.

| Asset | Provider-reported digest | Provider size | Admission | Primary custody | Second copy | Reason |
|---|---|---:|---|---|---|---|
| `stats_player_regpost_2012.csv` | `sha256:b6f6773352147859ee57389f849fb02e3ade9a0b1bad0a70d13fa4f794f39a02` | 45,080 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2013.csv` | `sha256:7eb39ce593c9830b27c3e45d36040c8798df67b8c32c22fe53557d7c7d0289d1` | 50,762 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2014.csv` | `sha256:c52644213380d705820400c92ad74de9fb6502f4e6285d9557372e29595f647d` | 59,901 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2015.csv` | `sha256:9343330c8d47d3e53ecebd8e19c272549cda40bbf3ca8fee5fda41eb5179688e` | 62,981 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2016.csv` | `sha256:d1dbc94c883eb4e2dedcf1a0e435484beb06448541cb291657f62700cf8bfae3` | 66,882 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2017.csv` | `sha256:04ec2243d9f09dc65b6832995971303539c34ccd1f0851ae17964e252d4d27b4` | 64,928 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2018.csv` | `sha256:b1746125eb95bf9dc4d02f8cc4761690cc3526244762739f642da64229636305` | 69,773 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2019.csv` | `sha256:874b7f5771c94581af7637b128f37e3ee886cbe74c33b9b9fdaf946d7eb79acf` | 73,486 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2020.csv` | `sha256:38f46b0fe038da6f0d9760b2021b6fad9bb07be34137817077f51934dc2a5ba8` | 86,023 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2021.csv` | `sha256:8148f0dd01ccc562dd4896a1dd48619def927b0732e35ee2fc23221db42a645d` | 111,863 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2022.csv` | `sha256:c07763ea50f4c3a70f4021f8862b22df8f27861792836cdf977635fe4e65da6f` | 112,864 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2023.csv` | `sha256:8bc529bc1dfb267a37dc0c750c22a9a77074ebafc73c420b256837ba79a37e75` | 117,565 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2024.csv` | `sha256:76325bd7a5e12baa76005fc1989a36bbfe0736d711afcc6991b8fd6d211bb48f` | 119,255 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |
| `stats_player_regpost_2025.csv` | `sha256:b32dea8415766f87b3ce45d21a2bfa40d4ae15636225902381ac7e079364f8e5` | 127,272 | UNAVAILABLE | Not established | Not established | Exact bytes not retrievable; schema/rows unverified |

Rights/custody rule: nflverse-data declares CC BY 4.0, with the nflreadr upstream-owner caveat preserved. The accepted contract allows conditional access-controlled raw custody with attribution, but exact bytes must be copied into project-controlled content-addressed storage before parsing/use, with an independent second copy. That requirement was not met.

## Players Metadata — `NFLVERSE_PLAYERS_METADATA_MINIMAL`

| Asset | Release / asset ID | Provider-reported digest | Provider size | Approved contract fields | Admission | Primary / backup |
|---|---|---|---:|---|---|---|
| `players.csv` | release `119143917`; asset `557244591` | `sha256:6f896e11cf4d85a6d5851d4f1de36781a08c365c56ce20d795288cedc6cdde44` | 7,289,388 | `gsis_id`, `birth_date`, `rookie_season` | **UNAVAILABLE** | not established / not established |

Provider release update: `2026-09-11T12:38:42Z`.

Rights/custody rule: minimal-field custody only, with exact source bytes restricted when approved and a canonical minimal extract for repository-facing evidence. Mutable current team/status and unused proprietary/third-party identifiers remain excluded. WR-042 could identify the provider object but could not obtain the exact bytes or place them into approved access-controlled two-copy custody.

## Draft Capital — `NFLVERSE_DRAFT_CAPITAL_MINIMAL`

| Asset | Release / asset ID | Provider-reported digest | Provider size | Approved contract fields | Admission | Primary / backup |
|---|---|---|---:|---|---|---|
| `draft_picks.csv` | release `111390246`; asset `465848369` | `sha256:e6a0d49a8a1bdd1c19bf672e42db48f22ffcf8ef918b06190c2f5a86790174e3` | 525,634 | `season`, `round`, `pick`, `gsis_id`, `position` | **UNAVAILABLE** | not established / not established |

Provider release update: `2026-05-16T16:24:24Z`. Provider release attribution states draft picks are courtesy of Pro Football Reference.

Rights/custody rule: restricted raw custody pending per-instance rights acceptance, with no public raw mirror by default. Because neither exact-byte acquisition nor approved access-controlled primary/backup storage was available, no raw or derived custody path was declared auditable.

## Custody result

- Admitted instances: **0**
- Rejected instances: **0**
- Unavailable instances: **16**
- Primary project-controlled immutable copies verified: **0**
- Independent project-controlled backup copies verified: **0**
- Rights-compatible derived packages admitted: **0**

`SOURCE CONTRACT VERSION BUMP REQUIRED` is **not** triggered merely by this capability blocker. It becomes required if remediation would weaken or expand the audited contract—for example, accepting a mutable URL or expiring CI artifact as authority, dropping independent backup custody, publicly mirroring restricted raw data, adding a source class/semantic field, or otherwise changing the audited custody semantics.
