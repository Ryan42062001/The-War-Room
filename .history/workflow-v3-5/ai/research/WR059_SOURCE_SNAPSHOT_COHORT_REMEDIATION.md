# WR-059 Source-Snapshot + Cohort Evidence Remediation Report

Status: `BOUNDED WR-060 REMEDIATION COMPLETE — MANAGER REVIEW REQUIRED`

Task: `WR-059 — Returning-Player v2 Source-Snapshot + Cohort Evidence Remediation`

Current canonical main observed before publication: `397b1ebdb726522292de197658b7c527548853a6`  
Existing branch: `wr-059-v2-source-snapshot-cohort-remediation-2`  
Existing PR: `#196`  
Historical failed-audit WR-059 head: `e871c861f8ba3c339af5b7a022892522b45b844f`

The historical failed head and its `1.1.0-wr059` artifacts are preserved unchanged.

## WR-060 finding remediated

WR-060 returned:

`FAIL — REMEDIATION REQUIRED`

with one HIGH finding:

`WR-060-AUD-01`

The admitted replacement `players.csv` source record lacked an independently reproducible exact provider-issued release ID and full provider-update timestamp required by WR-039.

## Remediation path

**PATH B — FAIL CLOSED**

Path A was investigated with read-only provider/repository metadata only.

Evidence:

- exact historical GitHub asset endpoint for `563580371` -> `404 Not Found`;
- current `players` release endpoint -> release ID `69785162`, but current `players.csv` is different asset `565719859`, SHA-256 `507f8cf03ffc8a82b841212582000163eb713ced15c9f83f851afb42da0af259`, size `7290797`, updated `2026-09-15T13:05:25Z`;
- WR-042 replacement commit `cc9005ae4bd9065cf80f1c184f31974904165c54` preserves historical asset `563580371`, SHA-256 `03a823a0e2344aff9a4ef67bdd62005d3e1d7ab62a98c790ce19a8a557d1c221`, size `7260242`, but not the required exact release ID/full timestamp;
- WR-042 run/job `34871882486 / 104069521779` deleted runner-local reports/source bytes and created no Actions artifact;
- repository search and accepted WR-060 evidence expose no independently reproducible authoritative record supplying both missing historical fields.

Therefore the current release ID/time cannot be borrowed, a sub-day time cannot be inferred, and no replacement asset/provider may be treated as equivalent.

## New canonical source snapshot

- ID: `wr-returning-player-v2-source-snapshot/1.2.0-wr059`
- SHA-256: `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`
- retained historical custody identities: **15**
- admitted sources: **14**
- failed-closed retained sources: **1**
- failed-closed source: `NFLVERSE_PLAYERS_METADATA_MINIMAL` / asset `563580371`
- policy-excluded source class: `NFLVERSE_DRAFT_CAPITAL_MINIMAL` / `draft_picks.csv`

The exact retained `players.csv` identity remains preserved in custody evidence but is unavailable for v2 metadata-feature use under this checkpoint.

## New canonical cohort

- ID/version: `returning-player-v2-cohort/1.2.0-wr059`
- SHA-256: `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`
- bound source snapshot: `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`
- historical membership: **5,176 / 5,176**
- duplicates: **0**
- 2014–2017: **1,668**
- 2018–2025: **3,508**
- changed historical membership rows: **0**

The cohort version field changed only because the versioning rule requires a new cohort identity when canonical bytes/binding change. Player-season-position membership, order, counts, and exact prior-season stats lineage are unchanged.

## Preserved authority chain

1. WR-039 / WR-D008 frozen evidence contract.
2. WR-042 historical exact 15-source custody manifest SHA-256 `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`.
3. WR-057 `draft_picks.csv` exclusion.
4. WR-063/064 retained-version infrastructure and audit.
5. WR-067/068 deterministic CSV schema contract and audit.
6. WR-069/070 accepted privacy-safe retained-derived evidence SHA-256 `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`.
7. WR-060 accepted all custody/cohort evidence except `WR-060-AUD-01`.
8. This bounded checkpoint fails closed the one nonconforming admitted metadata source and rebinds the otherwise unchanged cohort.

## Deterministic validation

Local canonical-generation assertions:

```text
source_snapshot_id == wr-returning-player-v2-source-snapshot/1.2.0-wr059
source_snapshot_sha256 == 6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea
retained_custody_identity_count == 15
admitted_source_count == 14
failed_closed_source_count == 1
players_contract.status == FAILED_CLOSED
players_contract.release_id == null
players_contract.provider_updated_at.full_timestamp == null

cohort_version == returning-player-v2-cohort/1.2.0-wr059
cohort_sha256 == f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4
source_snapshot_binding.id == wr-returning-player-v2-source-snapshot/1.2.0-wr059
source_snapshot_binding.sha256 == 6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea
sum(segment.key_count) == 5176
2014-2017 == 1668
2018-2025 == 3508
duplicate_count == 0
changed_membership_rows == 0
```

Canonical JSON rules remain UTF-8, sorted keys, compact separators, `ensure_ascii=false`, and one final LF. Both adjacent SHA-256 sidecars are generated from exact artifact bytes.

Repository publication validation must additionally confirm:

- only the eight existing WR-059 `.ai/research/**` paths changed from historical failed head;
- historical `e871c861...` remains an ancestor, not rewritten;
- current-main advancement is control-plane/audit-only and non-overlapping;
- exact-head War Room CI governance passes.

## Boundaries

Read-only provider/repository metadata research was performed. No retained raw bytes were accessed or reacquired. No raw custody redo, source refresh/substitution, provider mutation, `draft_picks.csv`, 2026 regular-season outcome-table inspection, target/outcome join, model fitting/scoring/tuning/comparison/evaluation, prediction, ranking change, production change, or Phase-6 work occurred.

R&D does not activate WR-071. The next role is Manager / Architect for exact-target verification/freeze and then fresh independent WR-071 audit.
