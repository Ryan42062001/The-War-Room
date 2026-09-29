# Returning-Player v2 Source Rights and Retention Matrix

Status: `FROZEN_PRE_SCORING — PENDING INDEPENDENT AUDIT`
Contract: `wr-returning-player-v2-evidence-contract/1.0.0`

## Rights standard

This is a research governance classification, not legal advice. Source admission must use the most restrictive applicable provider statement. An open-source loader does not grant rights to upstream data.

Primary evidence reviewed:

- nflverse-data repository `DESCRIPTION`: `License: CC BY 4.0`;
- nflverse-data `LICENSE.md`: Creative Commons Attribution 4.0, including reproduction/share rights subject to attribution and other conditions;
- nflverse Players producer README: identifies the project as the builder/releaser of the Players dataset and documents component sources;
- nflreadr README: package code is MIT, while accessed NFL data belong to their respective owners and remain subject to applicable terms;
- existing War Room WR-025/WR-029 manifests: record nflverse release provenance, CC BY 4.0 treatment, permitted fields, and upstream attribution/caveats.

Official references:

- `https://github.com/nflverse/nflverse-data`
- `https://github.com/nflverse/nflverse-data/blob/main/LICENSE.md`
- `https://github.com/nflverse/nflverse-players`
- `https://github.com/nflverse/nflreadr`

## Matrix

| Source class | Provider / acquisition | Approved fields | Rights evidence and caveat | Raw custody | Derived evidence | Mutability / cutoff | Failure / fallback |
|---|---|---|---|---|---|---|---|
| `NFLVERSE_PLAYER_SUMMARY_STATS` | nflverse-data `stats_player` release; exact per-season release asset URL/API response | Only fields named by the future audited feature schema; regular-season rows only | nflverse-data publishes CC BY 4.0; retain attribution, license link, source version, and modification notice. nflreadr warns underlying NFL data may retain owner rights, so public redistribution beyond project evidence must be separately reviewed. | `CONDITIONAL_RAW_CUSTODY`: exact bytes may be retained in access-controlled project storage with attribution; do not publish a public raw-data mirror without Manager/rights review | Always retain approved-column extract, schema, complete row lineage, and feature/prediction evidence | Release URLs/assets are mutable/deletable; every asset must be copied and content-addressed before use. Target-year Week-1+ fields prohibited | No replacement by same-name newer asset. Missing locked bytes or rights uncertainty => fail closed or new audited snapshot/version |
| `NFLVERSE_PLAYERS_METADATA_MINIMAL` | nflverse-data `players` release produced by nflverse Players project | `gsis_id`, approved display name only if needed, `birth_date`, `rookie_season`; exclude current team/status, PFF/NGS/proprietary IDs, and all unused columns | nflverse-data CC BY 4.0 plus attribution; producer README documents multiple components. Because component provenance can include third parties, use/retain only the minimal audited columns and record component caveats | `MINIMAL_EXTRACT_CUSTODY`: preserve exact downloaded bytes in restricted immutable storage when approved; repository-facing evidence defaults to exact canonical minimal-column extract, source-byte digest, and attribution | Mandatory full keyed source-value/feature/prediction package; hashes alone are insufficient unless an auditor can access retained reference bytes | Mutable aggregate release; current status/team fields are not point-in-time and are excluded. Birth date/rookie season still require an exact source snapshot | Deleted/changed asset never accepted by aggregate equality. No compatible audited snapshot => fail closed |
| `NFLVERSE_DRAFT_CAPITAL_MINIMAL` | nflverse-data `draft_picks` release; exact release asset | `season`, `round`, `pick`, `team` only if required, `gsis_id`, draft-time `position`, source name for audit | nflverse-data CC BY 4.0; existing War Room provenance notes draft picks are courtesy of Pro Football Reference. Preserve both nflverse attribution and upstream courtesy/terms notice; do not assume the loader's MIT license covers data | `RESTRICTED_RAW_CUSTODY_PENDING_RIGHTS_REVIEW`: retain exact bytes only in access-controlled project evidence storage after Manager rights acceptance; no public redistribution by default | Canonical minimal-column extract and all feature lineage mandatory; if rights do not allow independently auditable retention, exclude this source class | Release asset can be replaced; draft facts are historically fixed but exact corrections/version must be pinned | No silent provider substitution. If retention/auditor access is not rights-compatible, exclude draft features and create a new audited schema version |
| Future external/proprietary source | Not admitted by v1.0.0 | None | Provider-specific written terms required; scraper/package availability is not permission | Prohibited unless expressly authorized | Only if terms permit and independent reference verification remains possible | Must prove point-in-time coverage | `EXCLUDED_UNAUDITED_SOURCE`; requires contract version bump and independent audit |

## Attribution record required per admitted nflverse object

Each retained object or extract must include:

- title/asset name;
- creator/provider: nflverse and identified component producer where applicable;
- canonical source URL;
- exact release/tag/asset/version identifiers;
- acquisition and provider-update timestamps;
- `Creative Commons Attribution 4.0 International (CC BY 4.0)` and license URL;
- whether fields were selected, normalized, or otherwise modified;
- upstream data-rights caveat from nflreadr;
- War Room source-instance ID and SHA-256.

## Retention disposition

No source class is score-ready merely because this matrix lists it. A later source-custody checkpoint must make a per-instance rights determination, preserve the permitted evidence, and pass independent audit. If exact independently auditable custody cannot be established, the source instance is rejected before feature construction or scoring.
