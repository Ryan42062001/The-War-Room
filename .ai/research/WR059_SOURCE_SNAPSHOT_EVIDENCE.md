# WR-059 Returning-Player v2 Source Snapshot Evidence

Status: `REMEDIATED — MANAGER EXACT-TARGET FREEZE REQUIRED`

Source snapshot ID: `wr-returning-player-v2-source-snapshot/1.2.0-wr059`  
Canonical SHA-256: `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`

## Bounded remediation disposition

Remediation path: **PATH B — FAIL CLOSED**

This checkpoint resolves only `WR-060-AUD-01`. The historical audited `1.1.0-wr059` artifacts remain immutable failed-audit evidence and are not rewritten.

Affected retained metadata identity:

- source class: `NFLVERSE_PLAYERS_METADATA_MINIMAL`
- source ID: `nflverse-players-metadata-20260914`
- asset ID: `563580371`
- asset name: `players.csv`
- exact SHA-256: `03a823a0e2344aff9a4ef67bdd62005d3e1d7ab62a98c790ce19a8a557d1c221`
- exact byte size: `7260242`

The retained bytes and accepted WR-069 deterministic parser evidence remain preserved, but this metadata source is now **FAILED_CLOSED / UNAVAILABLE** because its exact provider-issued `release_id` and full `provider_updated_at` timestamp cannot be independently reproduced.

## Path A research — evidence classification

### VERIFIED FACT

1. A fresh read-only request to the exact historical GitHub release-asset endpoint:

   `https://api.github.com/repos/nflverse/nflverse-data/releases/assets/563580371`

   returned `404 Not Found`.

2. The current authoritative `players` release endpoint:

   `https://api.github.com/repos/nflverse/nflverse-data/releases/tags/players`

   currently identifies release ID `69785162`, but its `players.csv` is replacement asset `565719859`, SHA-256 `507f8cf03ffc8a82b841212582000163eb713ced15c9f83f851afb42da0af259`, byte size `7290797`, updated `2026-09-15T13:05:25Z`.

   That current asset is **not** historical asset `563580371` and is not accepted as equivalent.

3. Historical WR-042 commit `cc9005ae4bd9065cf80f1c184f31974904165c54` persists the replacement historical identity as asset ID `563580371`, exact SHA-256 `03a823a0e2344aff9a4ef67bdd62005d3e1d7ab62a98c790ce19a8a557d1c221`, and byte size `7260242`, but it does not persist an exact provider-issued release ID or full provider-update timestamp.

4. Accepted WR-042 run/job `34871882486 / 104069521779` succeeded for all 15 custody identities. Its log explicitly records that runner-local source bytes/reports were deleted and **no Actions artifact was created**.

5. WR-060 independently found the same provenance gap and returned HIGH finding `WR-060-AUD-01`.

### UNKNOWN

The exact provider-issued release ID and full provider-update timestamp for historical asset `563580371` remain unknown from independently reproducible authoritative evidence.

### Disposition

Current mutable provider state cannot prove those missing fields for the deleted historical asset. Inferring the timestamp from `2026-09-14`, borrowing the current release ID, or substituting asset `565719859` would violate the Manager remediation contract. Path B is therefore required.

## Preserved accepted authority

The authoritative byte custody remains WR-042:

- evidence head: `614445a20c2c15fbc3d8c107644a5244ddb52076`
- executed manifest commit: `cc9005ae4bd9065cf80f1c184f31974904165c54`
- custody manifest SHA-256: `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`
- protected run/job: `34871882486 / 104069521779`

Accepted deterministic privacy-safe parser evidence remains WR-069/070:

- audited WR-069 head: `5d4fc5fce3567a9894ddf3c08243f0ce6c087543`
- derived artifact: `.ai/work_helper/WR069_RETAINED_DERIVED_EVIDENCE.json`
- artifact SHA-256: `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`
- WR-070: `PASS — no findings`

All 15 historical custody identities remain unchanged. This remediation changes **admission**, not retained byte identity.

## Admission and failure totals

- exact retained custody identities preserved: **15**
- admitted source instances: **14**
- failed-closed retained source instances: **1**
- admitted player-summary sources: **14**
- admitted players-metadata sources: **0**
- failed-closed players-metadata sources: **1**
- policy-excluded source classes: **1**
- `draft_picks.csv`: **EXCLUDED** under WR-057

The failed-closed `players.csv` is unavailable for v2 metadata-feature use under this checkpoint and remains irrelevant to historical cohort membership.

## Canonical artifact

Machine path:

`.ai/research/generated/WR059_RETURNING_PLAYER_V2_SOURCE_SNAPSHOT.json`

Canonicalization is UTF-8 JSON, sorted object keys, compact separators, `ensure_ascii=false`, and one final LF. SHA-256 is over the exact bytes including that LF. The adjacent sidecar is exact.

## Boundaries

The remediation used read-only provider/repository metadata research only. No provider mutation, retained raw-byte access, raw custody redo, source refresh/reacquisition/substitution, `draft_picks.csv`, 2026 regular-season outcome-table inspection, target/outcome join, fitting, scoring, tuning, comparison, evaluation, prediction, ranking change, production change, or Phase-6 work occurred.
