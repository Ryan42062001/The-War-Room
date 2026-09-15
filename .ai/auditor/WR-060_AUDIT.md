# WR-060 — Independent Re-Audit of v2 Source Snapshot + Cohort Evidence

Date: 2026-09-15

Role: Independent Auditor / QA

Workflow: V3.2

Assignment baseline: `2052aefea1b6c8871bc6a25be22c033b921d07a6`

Audited target: WR-059 / PR #196

Frozen audited head: `e871c861f8ba3c339af5b7a022892522b45b844f`

Target base: `8ded5ed8e32e3a0688e53b544048fcf7ffd3b4dd`

## Final verdict

FAIL — REMEDIATION REQUIRED

WR-059 fully closes the deterministic cohort gap described by `WR-043-AUD-02`, and it preserves the accepted 15-object custody identities. It does not fully close `WR-043-AUD-01`: the admitted replacement `players.csv` source instance lacks independently reproducible exact release identity and provider-update timestamp evidence required by the accepted WR-039 machine contract.

## Audit method and target discipline

The audit used a clean branch at exact canonical main and a separate detached worktree at the frozen WR-059 target. It inspected immutable Git objects, expanded the compact source and cohort representations independently, recalculated all hashes and key inventories, and verified live PR/CI evidence. It did not retrieve retained raw bytes, access provider credentials, or modify WR-059.

PR #196 remained open at exact head `e871c861f8ba3c339af5b7a022892522b45b844f`. The exact base-to-head diff contains one commit and exactly eight files, all under `.ai/research/**`. No target advancement was observed.

## Finding WR-060-AUD-01 — HIGH — replacement metadata provenance does not satisfy the frozen source-instance contract

**Requirement.** The accepted WR-039 machine contract enumerates `release_id` and `provider_updated_at` among the required fields for every admitted source instance. The human contract requires the release/tag/version identity, release ID, asset ID/name, and provider update timestamp when supplied. WR-040 independently confirmed that exact requirement. WR-060's fail-closed rule requires a blocking finding when a required source-snapshot field is missing or non-reproducible.

**Evidence.** The replacement metadata entry is admitted as `NFLVERSE_PLAYERS_METADATA_MINIMAL`, asset ID `563580371`, exact SHA-256 `03a823a0e2344aff9a4ef67bdd62005d3e1d7ab62a98c790ce19a8a557d1c221`, and byte size `7260242`. Its `release_id` value is not an identifier; it is the narrative string `accepted WR-042 release identity; numeric release ID not persisted as required byte authority`. Its `provider_updated_at` value contains only `{date: 2026-09-14, precision: day}` and explicitly says the sub-day timestamp was not persisted. The accepted repository evidence therefore cannot reproduce the exact provider-supplied release ID or provider-update timestamp for this admitted source instance.

A fresh read-only request to GitHub's authoritative release-asset API for exact asset ID `563580371` returned `404 Not Found` during this audit. Current provider state therefore cannot independently restore the missing historical fields, and the audit does not treat a replacement/current asset as equivalent.

**Failure.** Day-only precision is truthful and must not be upgraded by inference, but it is not sufficient to satisfy a contract that explicitly requires a provider-update timestamp when supplied. Likewise, a statement that a numeric release ID was not persisted is not the required release ID. Exact asset ID, byte digest, size, acquisition-batch UTC, and immutable custody prove byte identity; they do not replace the separately required release provenance fields.

**Impact.** The snapshot labels all 15 sources `ADMITTED` and reports zero failed-closed sources even though one admitted record cannot satisfy the complete frozen source-instance provenance contract. Accepting it would silently weaken WR-039/WR-D008 at the exact provenance boundary created after the v1 identity failure.

**Required remediation.** Preserve all accepted asset/digest/custody/schema/cohort evidence. On a fresh Manager-authorized remediation head, either (a) populate the exact provider-issued release ID and full provider-update timestamp from authoritative evidence that can be independently bound to asset `563580371`, or (b) mark the metadata source failed closed/unavailable and consistently revise the snapshot admission totals and any downstream availability implications. Do not infer a time from the date, substitute another asset/provider, reacquire raw bytes, or weaken the required-field contract.

**Validation required.** Fresh independent audit must reproduce the corrected provenance against authoritative, privacy-safe provider/repository evidence and verify the canonical snapshot/cohort hashes after any affected regeneration.

**Confidence:** HIGH.

## Independently reproduced positive evidence

### Frozen artifact hashes

- Exact committed source-snapshot bytes are canonical sorted-key compact UTF-8 JSON with one final LF and hash to `f6ee530c7733b1aa9d984a3e874015ca9a3dd7cebda5ffc558df4cb159c591b9`.
- Exact committed cohort bytes use the same canonicalization and hash to `d6927509968ac3a371591a69fd665861e9546a0868f1e7b1c5db6c31cc887354`.
- Both sidecars match their exact artifacts.
- Accepted WR-069 evidence independently hashes to `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`.

### Source identities and custody preservation

- Historical manifest bytes at commit `cc9005ae4bd9065cf80f1c184f31974904165c54` independently hash to `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`.
- Expanding WR-059's shared stats contract and per-asset records yields exactly 15 unique content-addressed source instances. Source ID/class, asset ID/name, season, SHA-256, and byte size match the authoritative WR-042 manifest exactly with no missing or extra identity.
- All 15 identities also match the accepted WR-069 source evidence on content address, asset, digest, size, physical row count, schema hash, and approved-column checks. The three schema bindings resolve exactly to the accepted ordered raw columns and typed/nullability schemas.
- Retained keys remain `custody/sha256/<authoritative digest>/raw`; the historical WR-042 run/job remains `34871882486` / `104069521779`. WR-059 performs no provider or raw-byte operation and neither replaces nor weakens historical B2/R2 evidence.

### Other source-snapshot semantics

Apart from the finding, deterministic expansion supplies the required provider/repository/acquisition method and endpoint, acquisition-batch UTC, stats release and update identities, media/compression, ordered schema, schema hash, row count, approved columns, cutoff/availability, mutability/as-of treatment, rights/license/attribution/retention, retained-object identity, acquisition-code identity, and admission reason.

The compact shared-contract/per-record representation is deterministic and independently resolvable to one record per asset. Hash-bound schema selectors resolve against the exact accepted WR-069 artifact rather than a mutable external source.

`draft_picks.csv` remains explicitly `EXCLUDED` under WR-057 with acquired/custodied/parsed/used all false and no replacement provider.

### Cohort reconstruction

- Cohort version is exactly `returning-player-v2-cohort/1.1.0-wr059`.
- Stable key semantics are exactly `(target_season, player_id_namespace, player_id, position, cohort_version)`, with `player_id_namespace = gsis_id` and compact UTF-8 JSON-array encoding.
- Independent expansion produced 5,176 keys, 5,176 unique keys, zero duplicates, and exact global order by target season, position, then player ID.
- Accepted WR-069 inventories reproduce 2014 = 410, 2015 = 412, 2016 = 423, 2017 = 423, totaling 1,668.
- The immutable `WR034_EVENT_ROWS.csv` Git blob is exactly `c1e013a2f9054eee1a36a70aaee80dedd46b9957`. Reading only `target_season`, `player_id`, and `position` reproduces 2018–2025 counts 419/444/437/435/475/446/421/431, totaling 3,508, with zero duplicates.
- The historical transform digest independently reproduces `9d45c1d9b14bc2df5948f19949d784194b68a3608d95b83c0455fd9e569d8e0e`.
- `1,668 + 3,508 = 5,176`. Every segment count, ordering, and source lineage matches its exact admitted prior-season Player Summary Stats `source_instance_id`.
- The cohort binds exactly to snapshot ID `wr-returning-player-v2-source-snapshot/1.1.0-wr059` and snapshot digest `f6ee530c...`.
- Current retained `players.csv` is explicitly unnecessary for membership and was not used to rewrite historical cohorts.

### Boundary and CI evidence

The exact diff contains no workflow, script, provider, production, model, ranking, shared, Manager, Work Helper, or Auditor change. It contains no raw bytes. Repository evidence supports no upstream reacquisition, refresh/substitution, provider mutation, draft-picks use, 2026 regular-season outcome-table inspection, target/outcome join, fitting, scoring, tuning, comparison/evaluation, prediction, ranking/production change, or Phase-6 work.

Exact-head War Room CI run `34988624368` is bound to `e871c861...` and completed successfully for classify and Governance. The product job was correctly skipped by evidence-only classification. Local workflow preflight and state checks passed on the audit assignment.

## Findings by severity

- CRITICAL: none.
- HIGH: `WR-060-AUD-01` — admitted replacement metadata provenance lacks reproducible exact release ID and provider-update timestamp.
- MEDIUM: none.
- LOW: none.

## Manager action

Do not merge PR #196 and do not begin model/scoring or Phase-6 work. Preserve the independently verified cohort and custody evidence, route only the bounded metadata-provenance remediation above, freeze a new immutable WR-059 target, and require fresh independent audit.
