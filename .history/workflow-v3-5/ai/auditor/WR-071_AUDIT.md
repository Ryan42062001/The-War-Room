# WR-071 — Fresh Independent Re-Audit of Remediated v2 Source Snapshot + Cohort Evidence

Date: 2026-09-15

Role: Independent Auditor / QA

Workflow: V3.2

Execution mode: STANDARD_CHAT

Assignment baseline: `f082a659883c4d9acf23cdc89f758a03a59f75b7`

Audit branch: `wr-071-v2-source-snapshot-cohort-reaudit-2`

Audited target: WR-059 / PR #196

Frozen audited head: `db8b21a65f2decf900902481f110758cc33f0aa6`

Historical failed-audit head: `e871c861f8ba3c339af5b7a022892522b45b844f`

## Final verdict

`PASS`

Findings:

- CRITICAL: none
- HIGH: none
- MEDIUM: none
- LOW: none

This verdict is fresh and independent. WR-060 was read only as historical evidence identifying the defect to be remediated; its verdict was not adopted as WR-071's conclusion. WR-071 independently re-checked the exact remediated WR-059 target, canonical artifacts, authority bindings, source identities, cohort membership evidence, target diff, and CI.

## Audit method and target discipline

Canonical `main` was independently verified at exactly:

`f082a659883c4d9acf23cdc89f758a03a59f75b7`

The prepared audit branch was independently verified at that same canonical baseline before Auditor publication.

Live PR #196 was independently verified open and unmerged on branch `wr-059-v2-source-snapshot-cohort-remediation-2` at exact frozen head:

`db8b21a65f2decf900902481f110758cc33f0aa6`

The target did not move during substantive audit execution. No later PR movement was silently followed.

WR-071 did not retrieve retained B2/R2 raw source bytes, reacquire upstream source bytes, access provider credentials, mutate provider state, modify WR-059, or inspect prohibited outcome/model surfaces.

## 1. WR-060-AUD-01 remediation — PASS

The accepted WR-039 machine contract requires admitted source-instance evidence to include exact release identity and provider-update provenance, including `release_id` and `provider_updated_at` when supplied. Missing or independently unreproducible required provenance must fail closed rather than be inferred or substituted.

The remediated WR-059 target applies exactly that rule to historical metadata asset `563580371`:

- source class: `NFLVERSE_PLAYERS_METADATA_MINIMAL`
- source ID: `nflverse-players-metadata-20260914`
- asset name: `players.csv`
- exact retained SHA-256: `03a823a0e2344aff9a4ef67bdd62005d3e1d7ab62a98c790ce19a8a557d1c221`
- exact byte size: `7260242`
- `release_id`: `null`
- full historical provider-update timestamp: `null`
- provenance state: unresolved required provenance
- admission state: `FAILED_CLOSED`
- historical membership use: false

The source remains an exact retained custody identity but is unavailable for Returning-Player v2 metadata-feature use. This is stricter than the failed `1.1.0-wr059` admission and does not weaken WR-039.

The remediation does not manufacture a missing release ID, does not upgrade the known day `2026-09-14` into sub-day precision, and does not convert incomplete provenance into an admitted record.

Verdict: **PASS**.

## 2. Current/replacement players.csv substitution boundary — PASS

The remediated source evidence separately records current provider state as a non-authoritative replacement:

- current release ID: `69785162`
- current `players.csv` asset ID: `565719859`
- current SHA-256: `507f8cf03ffc8a82b841212582000163eb713ced15c9f83f851afb42da0af259`
- current byte size: `7290797`
- current provider update timestamp: `2026-09-15T13:05:25Z`

Those values are materially different from historical asset `563580371`, retained SHA `03a823a0...`, and byte size `7260242`. The target labels the current object `CURRENT_MUTABLE_REPLACEMENT_NOT_HISTORICAL_AUTHORITY` and does not use its release ID, timestamp, bytes, or identity to fill the historical gap.

No current/replacement provider object is treated as equivalent to historical asset `563580371`.

Verdict: **PASS**.

## 3. Source totals and admission semantics — PASS

The remediated source snapshot is internally consistent:

- retained historical custody identities: `15`
- admitted source instances: `14`
- failed-closed retained source instances: `1`
- admitted Player Summary Stats sources: `14`
- admitted Players metadata sources: `0`
- failed-closed Players metadata sources: `1`
- policy-excluded source classes: `1`

The only failed-closed retained source is historical `players.csv` asset `563580371`. The 14 admitted sources are the 2012–2025 Player Summary Stats assets used as prior-season authority for target seasons 2014–2025.

The metadata source is not admitted anywhere in the new canonical source-snapshot semantics.

Verdict: **PASS**.

## 4. Exact 15 historical custody identities — PASS

WR-071 independently reconciled the exact WR-059 source-instance inventory against the authoritative executed WR-042 manifest at commit:

`cc9005ae4bd9065cf80f1c184f31974904165c54`

For all 15 historical identities, the applicable source class, asset ID, asset name, season where applicable, SHA-256, and byte size match exactly. There are no missing or extra retained identities.

The 14 Player Summary Stats identities remain:

| Season | Asset ID | SHA-256 | Byte size |
|---:|---:|---|---:|
| 2012 | 512980777 | `18d0d3ccbac3ba5489098629b74d58074b5297c8cf2c5de4ec06f809f2dffafc` | 801261 |
| 2013 | 512983282 | `dbc7804c32c8dbf46120bfe4e724cdd926537509caa8a1bb96cd3b6e159b21f8` | 792070 |
| 2014 | 512985320 | `7046a0fd69b979d0649feb679a42f82f6e8e175d19587857d3e9371f09427cd6` | 816553 |
| 2015 | 512984105 | `b977be5bc8cad6b02dfb755e78974b4486a505fa272f683add499b968878e3eb` | 815021 |
| 2016 | 512985505 | `041473e5860ca6cfcba7a29e98b2ddfc3f01db0df2469d5b44e44135603e2424` | 819194 |
| 2017 | 513235924 | `88b85ba1a722f9a1cdc25612bdc96a82c8d81b8f2762713f253db4e787a2811b` | 824571 |
| 2018 | 513236180 | `85b55c0455d2afbd09fe7c8bcab31bc16ba2866fff45abec4fadc6b22c15fc4c` | 833179 |
| 2019 | 513237022 | `a5b50ae01b39c4233533a4934e6d0185c256eaa5e2154eab26fa6da3b71f94f6` | 833756 |
| 2020 | 530454674 | `512eaf469550988ed77077e8a1cc4bd0f612bca6c3a62e2f8c945f556862633a` | 878088 |
| 2021 | 513240014 | `22aa2fb78a3a0e977bbf1dd3613163a69c4298b1daf113ecf3e30cfd319f1eff` | 917490 |
| 2022 | 513240325 | `6f56613e8d3b8531ddf3d00963442c6a0577428b53bcc7688f63b5492beef5eb` | 882918 |
| 2023 | 513240669 | `b55110bdda4b1cb9c4f115991f5c5838824826cd76cfe4c60721af42ed4db766` | 855110 |
| 2024 | 513241318 | `e12c0dd3877e70bd18460f7b03afe83ae0e60aa6aba0c141e6fff9699de7ccb3` | 877377 |
| 2025 | 513244170 | `a4cd28b5209608d87967c4e0db9720fc617c3f9aafe0a3a097461586ea90fd6d` | 888037 |

The fifteenth retained identity is metadata asset `563580371`, `players.csv`, SHA `03a823a0...`, size `7260242`, now failed closed for admission while remaining unchanged in custody identity.

This remediation changes admission, not byte custody.

Verdict: **PASS**.

## 5. WR-042 and WR-069 authority bindings — PASS

The source snapshot binds the accepted WR-042 custody authority exactly:

- WR-042 evidence head: `614445a20c2c15fbc3d8c107644a5244ddb52076`
- executed manifest commit: `cc9005ae4bd9065cf80f1c184f31974904165c54`
- custody manifest SHA-256: `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`
- protected custody run/job: `34871882486` / `104069521779`

The historical manifest content independently matches all 15 identities used by WR-059. The accepted authority hash remains exact and unchanged.

The source/cohort evidence also binds accepted WR-069 privacy-safe retained-derived evidence exactly:

- audited WR-069 head: `5d4fc5fce3567a9894ddf3c08243f0ce6c087543`
- artifact: `.ai/work_helper/WR069_RETAINED_DERIVED_EVIDENCE.json`
- accepted SHA-256: `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`

WR-071 independently inspected that accepted artifact and confirmed the bound custody authority, schema-contract authority, four privacy-safe historical inventories, and no-provider/no-model boundary flags are consistent with the WR-059 references. No alternate WR-042 or WR-069 authority is introduced.

Verdict: **PASS**.

## 6. No raw-byte reacquisition or provider substitution — PASS

The remediation report and exact eight-file diff show only read-only provider/repository metadata research plus deterministic regeneration of `.ai/research/**` evidence. No workflow, custody script, retained-reader, provider credential, raw source, or runtime file changed.

The target records:

- provider mutation: none
- retained raw-byte access: none
- raw custody redo: none
- upstream source reacquisition: none
- upstream source refresh/substitution: none

No raw retained bytes were reacquired merely to remediate the provenance finding.

Verdict: **PASS**.

## 7. Source-snapshot canonical SHA-256 — PASS

Frozen source snapshot:

- ID: `wr-returning-player-v2-source-snapshot/1.2.0-wr059`
- path: `.ai/research/generated/WR059_RETURNING_PLAYER_V2_SOURCE_SNAPSHOT.json`

WR-071 independently recomputed SHA-256 from the exact committed Git blob bytes, using the artifact's frozen canonicalization including its final LF.

Reproduced SHA-256:

`6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`

This exactly matches the frozen expected digest and adjacent sidecar.

Verdict: **PASS**.

## 8. Cohort canonical SHA-256 and source-snapshot binding — PASS

Frozen cohort:

- ID/version: `returning-player-v2-cohort/1.2.0-wr059`
- path: `.ai/research/generated/WR059_RETURNING_PLAYER_V2_COHORT_SOURCE_ELIGIBILITY.json`

WR-071 independently recomputed SHA-256 from the exact committed Git blob bytes, including the canonical final LF.

Reproduced SHA-256:

`f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`

The cohort binds exactly to:

- source snapshot ID `wr-returning-player-v2-source-snapshot/1.2.0-wr059`
- source snapshot SHA `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`

No stale `1.1.0-wr059` snapshot binding remains in the canonical cohort.

Verdict: **PASS**.

## 9. Independent cohort membership reconciliation — PASS

WR-071 independently reconciled the cohort from its two accepted immutable historical membership authorities rather than adopting WR-060's verdict.

### 2014–2017

Accepted WR-069 privacy-safe inventories provide:

- 2014: `410`
- 2015: `412`
- 2016: `423`
- 2017: `423`
- total: `1,668`

The four accepted inventory digests are unchanged:

- `370dcbf39901dd825c2dff9c9436e7b28eb3037c0dc86e159eb1573b5bfff23c`
- `c03d8c59e48ca53073a948fe39b49475bc8aee6cb88ae7cde14a9d8fdb92a231`
- `507ef19969222b1f332bcdf22293883bc274df327b2081e450ecafd1bc0f0dd0`
- `e73bab983c6d5d5b11861c56acc9dea4b9d314db4b2fe3660a063debdd9520b0`

### 2018–2025

The cohort binds the frozen WR034 event-row identity surface:

- exact Git blob: `c1e013a2f9054eee1a36a70aaee80dedd46b9957`
- accepted identity digest: `9d45c1d9b14bc2df5948f19949d784194b68a3608d95b83c0455fd9e569d8e0e`

Fresh inspection of the immutable event-row file confirms header plus exactly 3,508 historical data records spanning 2018–2025. The frozen per-season counts are:

- 2018: `419`
- 2019: `444`
- 2020: `437`
- 2021: `435`
- 2022: `475`
- 2023: `446`
- 2024: `421`
- 2025: `431`
- total: `3,508`

The two target-season ranges are disjoint and target season is part of the stable identity. Therefore the accepted historical membership authorities reconcile to:

`1,668 + 3,508 = 5,176`

The remediated cohort declares exactly:

- expected rows: `5,176`
- represented rows: `5,176`
- unique rows: `5,176`
- duplicates: `0`

The segment totals, identity surfaces, and stable-key rules are consistent with 5,176 unique historical keys and zero duplicates.

Verdict: **PASS**.

## 10. Membership ordering and prior-season stats lineage — PASS

The canonical membership rule is unchanged: for target season Y, include every QB/RB/WR/TE with a valid completed Y-1 regular-season Player Summary Stats row; freeze position from Y-1; target-Y participation does not determine membership.

The machine cohort declares:

- changed historical membership rows: `0`
- membership ordering changed: `false`
- prior-season source lineage changed: `false`

WR-071 independently reconciled every target season to the exact admitted prior-season stats identity:

- 2014 -> 2013 stats `dbc7804c...`
- 2015 -> 2014 stats `7046a0fd...`
- 2016 -> 2015 stats `b977be5b...`
- 2017 -> 2016 stats `041473e5...`
- 2018 -> 2017 stats `88b85ba1...`
- 2019 -> 2018 stats `85b55c04...`
- 2020 -> 2019 stats `a5b50ae0...`
- 2021 -> 2020 stats `512eaf46...`
- 2022 -> 2021 stats `22aa2fb7...`
- 2023 -> 2022 stats `6f56613e...`
- 2024 -> 2023 stats `b55110bd...`
- 2025 -> 2024 stats `e12c0dd3...`

The cohort's underlying `(target_season, gsis_id, player_id, position)` membership/order remains historical-authority-derived. Only the required `cohort_version` and source-snapshot binding changed because the canonical evidence package was re-versioned.

Verdict: **PASS**.

## 11. players.csv is not a cohort-membership authority — PASS

The cohort explicitly records that Players metadata is not required for historical membership and that asset `563580371` is failed closed/unavailable. It also records that Players metadata was not used to rewrite historical membership.

The current replacement `players.csv` object is not used to alter the 2014–2025 key set, positions, counts, or order.

Verdict: **PASS**.

## 12. draft_picks.csv exclusion — PASS

`draft_picks.csv` remains excluded under accepted WR-057 authority.

The remediated source snapshot records:

- acquired: false
- custodied: false
- parsed: false
- used: false
- replacement provider: null
- disposition: `RAW_CUSTODY_NOT_ESTABLISHED — EXCLUDE_SOURCE`

The cohort also records draft capital as excluded by WR-057. No replacement draft-data source is introduced.

Verdict: **PASS**.

## 13. Exact remediation delta — PASS

Independent compare from historical failed head:

`e871c861f8ba3c339af5b7a022892522b45b844f`

to exact remediated target:

`db8b21a65f2decf900902481f110758cc33f0aa6`

shows:

- ahead: `1`
- behind: `0`
- total remediation commits: `1`
- historical failed head remains an ancestor and is not rewritten

The one remediation commit changes exactly the same eight WR-059 `.ai/research/**` paths:

1. `.ai/research/HANDOFF.md`
2. `.ai/research/WR059_COHORT_SOURCE_ELIGIBILITY_EVIDENCE.md`
3. `.ai/research/WR059_SOURCE_SNAPSHOT_COHORT_REMEDIATION.md`
4. `.ai/research/WR059_SOURCE_SNAPSHOT_EVIDENCE.md`
5. `.ai/research/generated/WR059_RETURNING_PLAYER_V2_COHORT_SOURCE_ELIGIBILITY.json`
6. `.ai/research/generated/WR059_RETURNING_PLAYER_V2_COHORT_SOURCE_ELIGIBILITY.sha256`
7. `.ai/research/generated/WR059_RETURNING_PLAYER_V2_SOURCE_SNAPSHOT.json`
8. `.ai/research/generated/WR059_RETURNING_PLAYER_V2_SOURCE_SNAPSHOT.sha256`

No workflow, script, shared, Manager, Work Helper, Auditor, production, model, ranking, credential, or provider-runtime file is part of the remediation delta.

Verdict: **PASS**.

## 14. Exact-target CI — PASS

War Room CI run:

`34998074580`

is bound to exact WR-059 frozen head:

`db8b21a65f2decf900902481f110758cc33f0aa6`

and PR #196.

Run conclusion: `SUCCESS`.

Jobs:

- `classify` — SUCCESS
- `governance` — SUCCESS
- product `test` — SKIPPED

The product-test skip is expected for this evidence-only `.ai/**` remediation. Governance also passed the accepted workflow state/lane regressions, WR-056 trusted custody regression, WR-063 retained-version boundary, and retained-safe-consumer regression.

Verdict: **PASS**.

## 15. Forbidden expansion / chronology boundary — PASS

The exact target contains no evidence of, and the exact remediation diff provides no mechanism for:

- retained raw-byte reacquisition;
- upstream source refresh or substitution;
- provider mutation;
- inferred historical provenance;
- `draft_picks.csv` use;
- 2026 regular-season outcome-table inspection;
- target/outcome joins;
- model fitting;
- scoring;
- tuning;
- model comparison/evaluation;
- predictions;
- ranking changes;
- production changes; or
- Phase-6 work.

The audit itself also did not perform any of those actions.

Verdict: **PASS**.

## Findings by severity

### CRITICAL

none

### HIGH

none

### MEDIUM

none

### LOW

none

## Authorization boundary

This PASS is an independent audit verdict for exact WR-059 PR #196 head:

`db8b21a65f2decf900902481f110758cc33f0aa6`

It returns control to Manager / Architect for final disposition.

It does not merge WR-059, does not independently change Manager/shared state, and does not activate model-protocol, scoring, ranking, production, or Phase-6 work. Any later target movement requires fresh Manager disposition under Workflow V3.2 exact-target rules.
