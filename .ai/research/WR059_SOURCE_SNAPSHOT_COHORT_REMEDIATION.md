# WR-059 — Returning-Player v2 Source-Snapshot + Cohort Evidence Remediation

Task: `WR-059`  
Role: Research & Development  
Execution mode: `STANDARD_CHAT`  
Canonical baseline: `0ce9fae7de60080d4a408a43b59ef9a68e1c8936`  
Disposition: **FAIL CLOSED — REMEDIATION INCOMPLETE / ESCALATION REQUIRED**

## 1. Scope and governing evidence

This remediation addresses only `WR-043-AUD-01` and `WR-043-AUD-02`.

It preserves the accepted WR-042 raw-custody proof for 15 exact source byte identities and does not redo custody. Historical custody authority remains:

- executed manifest commit `cc9005ae4bd9065cf80f1c184f31974904165c54`
- custody manifest SHA-256 `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`
- protected run/job `34871882486` / `104069521779`

Accepted WR-063/WR-064 retained-version infrastructure remains authoritative for read identity:

- audited WR-063 target `9db29b082cb61b5ef902b56bb5c745fc8ee739b2`
- implementation head `b2c193cfc11811b32039d00480351ac4f5bc98a1`
- protected run/job `34906157295` / `104183220181` — PASS
- WR-064 audit `3c25c4af7b582596d039f3798245e71b4b7a3fed` — PASS, no findings

No upstream source bytes were reacquired or refreshed in WR-059. No retained object was uploaded, overwritten, deleted, recopied, recustodied, or subjected to retention/Legal-Hold/Bucket-Lock mutation.

## 2. Source-snapshot result

Machine artifact:

`.ai/research/generated/WR059_RETURNING_PLAYER_V2_SOURCE_SNAPSHOT.json`

- `source_snapshot_id`: `wr-returning-player-v2-source-snapshot/1.0.0-wr059-fail-closed`
- canonical SHA-256: `d062a30d92456e65f27aa82922011ab03b5dcb6fba9da736e9b98492e58ece3d`
- retained WR-042 identities represented: **15**
- snapshot-admitted source instances: **0**
- snapshot-rejected source instances: **15**
- policy-excluded source classes: **1** (`draft_picks.csv` / `NFLVERSE_DRAFT_CAPITAL_MINIMAL` under WR-057)

The distinction is intentional: **raw custody remains PASS** for the 15 exact objects, but WR-039 source-snapshot admission fails closed because required evidence fields cannot all be independently reconstructed.

### Exact evidence that was recovered

For all fourteen `stats_player_regpost_2012.csv` through `stats_player_regpost_2025.csv` identities, exact-hash historical evidence preserves:

- repository/release/asset identity;
- provider update identity;
- exact SHA-256;
- WR-042 byte size and content-addressed retained key;
- exact historical acquisition timestamps from WR-034 for the same bytes;
- the 148-column ordered CSV header;
- a deterministic ordered-column hash;
- approved regular-season QB/RB/WR/TE view counts.

Those fields are retained in the machine snapshot as **legacy exact-hash parser evidence**. They are not relabeled as evidence the historical artifacts never retained.

### Source-snapshot blockers

WR-039 requires the raw schema as ordered `(column,type,nullable)` tuples plus canonical schema hash and the source-instance physical row count.

For the exact stats bytes, durable historical artifacts retained only ordered column names and the approved-view row count after `REG` + QB/RB/WR/TE filtering. They did **not** retain:

- raw field types/nullability;
- canonical typed-schema hash;
- physical full-file row count.

The accepted WR-063 workflow proves exact B2/R2 retained-version retrieval for 2013–2016, but the reviewed workflow publishes privacy-safe identity metadata only. Its safe post-secret consumer step does not invoke or expose a WR-059 parser, and raw files are deleted during cleanup. Standard-chat tooling cannot dispatch a modified consumer or access runner-local files without changing the accepted workflow/runtime.

The exact current retained `players.csv` identity (`03a823a0e2344aff9a4ef67bdd62005d3e1d7ab62a98c790ce19a8a557d1c221`, 7260242 bytes) also has no durable exact-byte parser evidence for ordered typed schema or physical row count. WR-059 therefore rejects it rather than borrowing schema or metadata from the older deleted/replaced Players asset.

## 3. Cohort/source-eligibility result

Machine artifact:

`.ai/research/generated/WR059_RETURNING_PLAYER_V2_COHORT_SOURCE_ELIGIBILITY.json`

- `cohort_version`: `returning-player-v2-cohort/1.0.0-wr059-fail-closed`
- canonical SHA-256: `ba40123b8a09d3d04b6124745ef289d6d13ce41e4e9cedb9c0ea0bc2717f1cc6`
- declared historical target seasons: **2014–2025**
- expected full returning cohort: **5,176 keys**
- exact ordered keys retained: **3,508**
- missing ordered TRAIN_ONLY keys: **1,668**
- duplicate count among retained keys: **0**
- retained-key digest: `9d45c1d9b14bc2df5948f19949d784194b68a3608d95b83c0455fd9e569d8e0e`

The cohort rule is the historical pre-score Returning-Player rule: for target season `Y`, include every QB/RB/WR/TE with a valid completed `Y-1` regular-season Player Summary Stats row; freeze position from `Y-1`; target-`Y` participation does not control membership.

The 3,508 retained keys cover target seasons 2018–2025 and are preserved in exact ordered form from `.ai/research/generated/WR034_EVENT_ROWS.csv`. Their per-season counts equal the exact-hash prior-season stats-view counts:

- 2018: 419
- 2019: 444
- 2020: 437
- 2021: 435
- 2022: 475
- 2023: 446
- 2024: 421
- 2025: 431

The missing TRAIN_ONLY inventories are exactly:

- target 2014 from retained 2013 stats: 410 keys
- target 2015 from retained 2014 stats: 412 keys
- target 2016 from retained 2015 stats: 423 keys
- target 2017 from retained 2016 stats: 423 keys

Total missing: **1,668**. These counts are independently bound to the exact retained SHA identities, but the historical durable artifacts do not contain the corresponding complete player-ID/position inventories. Aggregate counts cannot substitute for ordered stable keys under WR-039.

## 4. WR-057 boundary

`draft_picks.csv` remains excluded under accepted WR-057 disposition `RAW_CUSTODY_NOT_ESTABLISHED — EXCLUDE_SOURCE`.

WR-059 did not acquire, download, parse, custody, use, or replace `draft_picks.csv`, and no alternate draft provider was introduced.

## 5. Safety boundaries

- 2026 regular-season source bytes/outcome tables parsed or used: **NO**
- target/outcome join: **NO**
- model fitting: **NO**
- model scoring: **NO**
- tuning/model comparison/evaluation/predictions: **NO**
- ranking or production changes: **NO**
- Phase-6 work: **NO**
- WR-021 / WR-023 frozen artifact modification: **NO**
- raw source bytes committed or published as Actions artifacts: **NO**

Transparency note: an earlier WR-059 diagnostic web search incidentally rendered unrelated current-season snippets in chat. Those snippets were not downloaded as a source, parsed, retained, joined, or used in any WR-059 evidence or derivation. This package therefore does not make the stronger claim that no 2026 information was ever incidentally displayed.

## 6. Why this target is fail closed

Three independent recovery paths were exhausted without producing the missing contract evidence:

1. accepted WR-063 protected retained-version proof — exact reads PASS, but no reviewed WR-059 parser consumer exists in the workflow;
2. exact-hash committed WR-025/WR-034 evidence — preserves source identities, ordered headers, filtered counts and 2018–2025 keys, but not raw typed/nullability schema, physical row count, or 2014–2017 keys;
3. unexpired historical WR-025/WR-034 Actions evidence — same limitation; no hidden pre-2018 key inventory exists.

WR-059 therefore does not infer missing IDs, reinterpret filtered counts as physical row counts, reinterpret header-only hashes as typed-schema hashes, borrow a replaced metadata object, reacquire a mutable upstream source, or weaken the WR-039 contract.

## 7. Exact next Manager action

Do **not** authorize model protocol/scoring and do not treat this package as a passing source-custody remediation.

Recommended Manager action:

1. freeze this immutable WR-059 fail-closed target as evidence of the remaining gap;
2. authorize a narrowly reviewed post-WR-063 **safe-consumer parsing step** that runs after B2/R2 equality verification and after secret isolation, can read only the ephemeral verified files, emits only schema/row/key evidence, and performs no provider mutation or upstream access;
3. return WR-059 to R&D to regenerate the source snapshot and full 2014–2025 ordered cohort from that accepted evidence; and
4. only after a complete immutable WR-059 target exists, activate mandatory independent re-audit `WR-060`.

If the Manager instead chooses to close remediation as unresolvable, WR-060 may audit this fail-closed target as failure evidence, but it cannot produce a passing gate from incomplete source/cohort evidence.
