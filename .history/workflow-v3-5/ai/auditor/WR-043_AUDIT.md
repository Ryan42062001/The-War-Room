# WR-043 — Independent Audit of Returning-Player v2 Exact Source Custody

Task: `WR-043`  
Role: Independent Auditor / QA  
Audit mode: Full Refresh  
Audit branch: `wr-043-v2-source-custody-audit`  
Assignment baseline: `f61a51e964149e4bf56b2404379e377de7cd5f1e`  
Audited task: `WR-042`  
Audited PR: #168  
Audited branch: `wr-042-v2-source-custody-retry-2`  
Frozen audited head: `614445a20c2c15fbc3d8c107644a5244ddb52076`  
Executed custody manifest commit: `cc9005ae4bd9065cf80f1c184f31974904165c54`  
Executed custody-manifest SHA-256: `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`  
Protected custody run/job: `34871882486` / `104069521779`

## Final verdict

`FAIL — REMEDIATION REQUIRED`

Findings by severity: CRITICAL — none. HIGH — two. MEDIUM — none. LOW — none.

The raw-byte custody portion of WR-042 is technically credible and independently bound to 15 exact pre-2026 source objects. However, WR-043 cannot approve the checkpoint because the frozen evidence does not satisfy the complete WR-039 / WR-D008 source-snapshot contract that WR-043 is explicitly required to gate. The committed custody manifest is the intentionally narrow WR-056 runtime-input schema, not the required v2 source-snapshot manifest, and no separate complete source-snapshot/cohort evidence artifact exists at the frozen target.

This verdict does not invalidate the successful B2/R2 custody already established for the 15 exact byte identities. Remediation should preserve and reuse those exact immutable identities where possible rather than silently reacquiring a mutable replacement.

## 1. Exact target and scope — PASS

Live GitHub state independently confirms PR #168 is OPEN / unmerged / mergeable at exact head `614445a20c2c15fbc3d8c107644a5244ddb52076` on `wr-042-v2-source-custody-retry-2`.

The WR-042 delta from its assignment base `7f1200388e2f6b7565b3d2aaf1ba407f006c9030` changes only five research-evidence paths:

- `.ai/research/HANDOFF.md`
- `.ai/research/WR042_V2_SOURCE_CUSTODY_SNAPSHOT.md`
- `.ai/research/WR042_V2_SOURCE_RIGHTS_CUSTODY_MATRIX.md`
- `.ai/research/generated/WR042_SOURCE_CUSTODY_MANIFEST.json`
- `.ai/research/generated/WR042_V2_SOURCE_CUSTODY_RESULT.json`

No production, ranking/model, custody-runtime/workflow, credential, Manager/shared, 2026-outcome, or Phase-6 surface is changed by PR #168.

The final evidence head is four research-evidence commits after executed manifest commit `cc9005ae...`; no custody runtime or source-input manifest change occurs after the successful protected run.

## 2. Executed manifest identity — PASS as custody-runtime input, not as complete source snapshot

The protected run checked out exact manifest commit `cc9005ae4bd9065cf80f1c184f31974904165c54`, fetched `.ai/research/generated/WR042_SOURCE_CUSTODY_MANIFEST.json`, and used caller-pinned SHA-256 `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`.

The audited bridge recomputes SHA-256 on the exact fetched manifest bytes before parsing and exits fail-closed on mismatch. Run `34871882486` completed successfully, therefore the exact fetched manifest bytes matched the pinned digest.

This establishes the canonical hash of the **custody execution input**. It does not cure Finding WR-043-AUD-01 below: the runtime manifest schema intentionally permits only the narrow custody fields and is not the complete WR-039 source-snapshot schema.

## 3. Fifteen exact admitted custody objects — PASS for immutable byte identity and provider transport

The executed manifest contains exactly 15 custody-eligible sources: 14 annual `NFLVERSE_PLAYER_SUMMARY_STATS` assets for 2012–2025 plus one `NFLVERSE_PLAYERS_METADATA_MINIMAL` `players.csv` asset.

| Source | GitHub asset ID | SHA-256 | Bytes |
|---|---:|---|---:|
| stats_player_regpost_2012.csv | 512980777 | `18d0d3cc347179752671235791b8c3be6d2f57a6fa62017cd8fe88cf4ad1fafc` | 801261 |
| stats_player_regpost_2013.csv | 512983282 | `dbc7804c32c8dbf46120bfe4e724cdd926537509caa8a1bb96cd3b6e159b21f8` | 792070 |
| stats_player_regpost_2014.csv | 512985320 | `7046a0b75b845b3f70317a2c612eeaa3dad558895677525e64023cf49f867cd6` | 816553 |
| stats_player_regpost_2015.csv | 512984105 | `b977be3ec44102f766503b430fe1e158fed437e89c2d1857554aa85b0128e3eb` | 815021 |
| stats_player_regpost_2016.csv | 512985505 | `041473c2435ed408c4afab0661037dfcc9d2b830e922bd8fdb46fb3460c72424` | 819194 |
| stats_player_regpost_2017.csv | 513235924 | `88b85b5dcb51008495a345809349d0726a06f7bbb588bd51e11b188be754811b` | 824571 |
| stats_player_regpost_2018.csv | 513236180 | `85b55ca19b5bf978ee09acdc5c98607e142c69fb16b43cd3c0ee3c5c302afc4c` | 833179 |
| stats_player_regpost_2019.csv | 513237022 | `a5b50a2c1103501608d5267555c8064d31d1d4073d609bca599a51174fa594f6` | 833756 |
| stats_player_regpost_2020.csv | 530454674 | `512eaf469550988ed77077e8a1cc4bd0f612bca6c3a62e2f8c945f556862633a` | 878088 |
| stats_player_regpost_2021.csv | 513240014 | `22aa2f417572414f6d968287637622809a204ab4eb8c2b10b7fe44c9105a1eff` | 917490 |
| stats_player_regpost_2022.csv | 513240325 | `6f566177a61a12cdaf6d4d87fcf734934642f7c5d8c30e578908cae06c14f5eb` | 882918 |
| stats_player_regpost_2023.csv | 513240669 | `b55110aad6b9c04fbdcc6292ddcb789cff7993b5b8449f021287cd775098b766` | 855110 |
| stats_player_regpost_2024.csv | 513241318 | `e12c0d3590f20f5f12e192452343e04863cba8e86595bda846b97501e35dccb3` | 877377 |
| stats_player_regpost_2025.csv | 513244170 | `a4cd28b5209608d87967c4e0db9720fc617c3f9aafe0a3a097461586ea90fd6d` | 888037 |
| players.csv | 563580371 | `03a823a0e2344aff9a4ef67bdd62005d3e1d7ab62a98c790ce19a8a557d1c221` | 7260242 |

Independent transport verification is not based solely on the R&D summary:

- `run_source_manifest_custody.py` permits only approved source classes/repositories, rejects season >2025, and invokes `acquire_github_release_asset.py` once per manifest row using exact repository + immutable release asset ID + expected SHA-256 + expected byte size.
- `acquire_github_release_asset.py` downloads through GitHub's release-asset-ID API and hashes/counts the bytes it actually receives; mismatch deletes the local output and returns failure.
- the successful protected run reports `source_count=15`, meaning all 15 immutable asset-ID acquisitions and local hash/size checks completed before provider proof.
- independent current GitHub release metadata spot-checks across the source range and class boundary (2012, 2013, 2020, 2025, and metadata `players.csv`) exactly match the frozen asset IDs, names, provider digests, and byte sizes. The metadata object is release asset `563580371`, not the earlier deleted/replaced metadata object.

No same-name/newer fallback path exists in the custody bridge: a manifest asset ID/hash/size mismatch fails closed.

## 4. B2 primary custody / R2 independent custody — PASS

The audited custody code and successful protected run establish the following for each exact downloaded object before aggregate PASS:

- content-addressed object key `custody/sha256/<downloaded-sha256>/raw`;
- Backblaze B2 primary object identity verified by direct retrieval;
- B2 retention mode must be `COMPLIANCE` and extend at least seven years;
- B2 Legal Hold must be `ON`;
- Cloudflare R2 must have an enabled `Indefinite` Bucket Lock rule covering the exact object key before and after placement;
- R2 object identity verified by separate direct retrieval;
- original downloaded bytes, B2 retrieval, and R2 retrieval must all equal the expected SHA-256 and byte size;
- final two-provider equality failure aborts the proof.

The committed WR-042 result records these controls as PASS for every one of the 15 source IDs. Run `34871882486`, trusted-custody job `104069521779`, completed all protected steps successfully. Protected credential values were masked; the job's cleanup step succeeded; the run has zero GitHub Actions artifacts.

Accordingly, WR-043 does **not** reject the checkpoint because of missing raw/reference custody or second-copy verification.

## 5. `draft_picks.csv` exclusion — PASS

Accepted WR-057 disposition is `RAW_CUSTODY_NOT_ESTABLISHED — EXCLUDE_SOURCE` for the PFR-derived nflverse `draft_picks.csv` source.

The executed WR-042 manifest contains no `NFLVERSE_DRAFT_CAPITAL_MINIMAL` row and no draft-picks asset. The accepted custody bridge's eligible class allowlist for this execution contains player-summary and players-metadata classes only; no substitute draft-data provider is present.

PR #168's frozen evidence explicitly records:

- `draft_picks.csv` acquired: NO;
- parsed: NO;
- custodied: NO;
- used: NO;
- replacement provider: NONE.

No silent draft-capital substitution is established.

## 6. No 2026 outcome/model/production boundary crossing — PASS

The executed manifest admits annual summary seasons only through 2025; the bridge rejects source season >2025 and post-2025 season names. `players.csv` is metadata, not a regular-season outcome table, and WR-042 performed custody rather than modeling parse/join work.

PR #168 changes only research evidence. No target/outcome table, feature matrix, fitted model, prediction surface, score/evaluation artifact, ranking/recommendation code, production code, or Phase-6 artifact is introduced.

No evidence establishes a target/outcome join, model fitting, scoring, tuning, comparison, evaluation, ranking change, production change, or Phase-6 work during WR-042.

## 7. Finding WR-043-AUD-01 — HIGH — frozen checkpoint lacks the complete required source-snapshot contract

**Requirement.** WR-039/WR-D008 and WR-043 require one independently auditable record for every exact source instance containing, among other fields: content-addressed `source_instance_id`; exact provider/repository/acquisition method/canonical endpoint; acquisition UTC; release tag/version/release ID/asset ID/name/provider-update time; SHA-256/byte size/media/compression; ordered raw schema + schema SHA-256; row count; exact approved columns; target-season cutoff + availability semantics; mutability classification; license/attribution/upstream-rights/retention disposition; retained-object URI/digest; acquisition-code SHA/command; and status/reason. The source snapshot itself must have a versioned `source_snapshot_id`, canonical SHA-256, and immutable checkpoint.

**Evidence.** Accepted machine contract `RETURNING_PLAYER_V2_EVIDENCE_CONTRACT.json` enumerates these fields explicitly in `required_source_instance_fields` and lists `source_snapshot_id` as a required v2 identifier. WR-040 independently confirmed that the later no-scoring custody checkpoint must populate those exact fields.

At frozen WR-042 head, the executed `WR042_SOURCE_CUSTODY_MANIFEST.json` contains only the narrow WR-056 custody-runtime fields: source ID/class, rights state, provider/repository, asset ID, filename, season, expected digest/size, and content type. The frozen tree contains no separate complete WR-042 source-snapshot manifest. `WR042_V2_SOURCE_CUSTODY_RESULT.json` contains no `row_count` or `schema_sha256` field and does not supply the missing ordered schema, approved-column, cutoff/availability, release/acquisition, rights-attribution, retained-object-URI, or acquisition-code identity surface.

The pinned digest `d2196293...` is therefore a valid hash of the minimal **custody execution manifest**, but it is not a canonical hash of the complete source-snapshot artifact mandated by WR-039.

This is especially material because the current `players.csv` asset was created/updated on 2026-09-14 after an earlier metadata asset disappeared upstream. WR-039 requires mutable metadata to be an as-of snapshot or excluded and allows post-cutoff-generated assets only for fields independently demonstrated fixed and cutoff-safe. The frozen WR-042 checkpoint does not preserve that per-source cutoff/availability proof.

**Failure.** Complete schema/cutoff/lineage cannot be independently verified from the frozen source-snapshot evidence because that evidence package was never produced.

**Impact.** Later model-protocol work would have no audited immutable source-snapshot identifier/hash binding the exact schema, permitted fields, cutoff safety, and complete lineage of the 15 already-custodied byte objects. That recreates the class of provenance ambiguity WR-039 was specifically designed to prevent.

**Required remediation.** On a fresh Manager-authorized R&D/remediation lane, preserve the 15 exact already-custodied SHA-256 identities and produce a complete WR-039-compliant source-snapshot manifest from the exact retained/reference bytes. Populate every required field, including ordered raw schema/schema hash, row count, approved columns, cutoff/availability proof, detailed release/acquisition identity, rights/attribution, retained-object URI/digest, acquisition-code identity, and canonical `source_snapshot_id` + hash. Do not silently refresh an upstream URL or replace an asset. If an exact retained/reference object cannot support the evidence, fail closed for that source.

**Validation required.** Fresh independent audit of the remediated immutable snapshot must recompute/bind its canonical hash and verify every field against exact retained/reference bytes and authoritative provider metadata.

**Confidence:** HIGH.

## 8. Finding WR-043-AUD-02 — HIGH — required deterministic cohort/source-eligibility evidence is absent

**Requirement.** WR-043 explicitly requires deterministic cohort/source-eligibility evidence, and the accepted WR-039 chronology requires the no-scoring source-custody checkpoint to freeze the source-instance/cohort evidence before model-protocol freeze. The contract's stable row key is `(target_season, player_id_namespace, player_id, position, cohort_version)`, duplicate keys are fatal, and the later reproducibility lock must bind cohort rules/manifest/ordered keys.

**Evidence.** PR #168 adds no cohort/source-eligibility manifest. The frozen WR-042 tree contains no WR-042 cohort artifact or ordered cohort-key inventory. The four substantive WR-042 custody artifacts enumerate source assets and provider custody; they do not establish which player-season keys are considered, the cohort version, source eligibility by key, inclusion/exclusion status/reason, or full cohort-key coverage.

**Failure.** WR-043 cannot verify the required cohort/source-eligibility surface or full cohort-key coverage from the frozen checkpoint.

**Impact.** A later feature/model protocol could silently define or omit player-season rows after source custody without an independently audited pre-scoring cohort boundary. This weakens the prospective chronology and full-row provenance guarantees that were added specifically after the v1 evidence failure.

**Required remediation.** Freeze a deterministic no-scoring cohort/source-eligibility artifact under a versioned `cohort_version`, with canonical ordered stable keys, explicit source eligibility/availability status and reason, duplicate-key rejection, and a canonical digest bound to the remediated source snapshot. No outcomes, targets, fitted model state, predictions, or scoring may be used to construct it.

**Validation required.** Fresh independent audit must verify deterministic regeneration from the exact audited source snapshot, full key coverage, duplicate absence, source eligibility/cutoff rules, and continued 2026-outcome separation.

**Confidence:** HIGH.

## 9. Preserved positive evidence

This FAIL is narrow. The following independently verified evidence should be preserved for remediation rather than repeated without cause:

- exact WR-042 target PR/head identity;
- successful immutable manifest execution at `cc9005ae...` / `d2196293...`;
- exact 15 asset-ID/hash/size custody identities;
- successful protected run `34871882486`, job `104069521779`;
- B2 COMPLIANCE + Legal Hold controls;
- R2 Indefinite lock coverage;
- direct B2/R2 retrieval and three-copy equality;
- protected credential masking and zero Actions artifacts;
- WR-057 `draft_picks.csv` exclusion;
- no model/scoring/outcome-join/production/Phase-6 boundary crossing.

Manager should determine whether remediation can truthfully bind the missing schema/cutoff/cohort evidence to these already-custodied exact objects without repeating raw custody. Auditor does not authorize that implementation or any later model/scoring stage.

## Authorization boundary after verdict

`FAIL — REMEDIATION REQUIRED` does not authorize merge/acceptance of WR-042 as the completed source-custody gate, does not authorize a model-protocol freeze, and does not authorize model fitting/scoring/tuning/comparison/evaluation, target/outcome joins, ranking changes, production changes, 2026 regular-season outcome inspection, or Phase-6 work.

Return control to Manager / Architect for a bounded remediation task. Any remediated source-snapshot/cohort package requires a fresh immutable target and fresh Independent Auditor / QA review.