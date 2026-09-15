# WR-059 Returning-Player v2 Source Snapshot Evidence

Status: `COMPLETE — MANAGER FREEZE / WR-060 AUDIT REQUIRED`

Source snapshot ID: `wr-returning-player-v2-source-snapshot/1.1.0-wr059`  
Canonical SHA-256: `f6ee530c7733b1aa9d984a3e874015ca9a3dd7cebda5ffc558df4cb159c591b9`

## Scope

This checkpoint remediates `WR-043-AUD-01` only. It does not redo custody, reacquire provider bytes, authorize model work, or change the accepted WR-039/WR-D008 source contract.

The authoritative byte custody remains WR-042:

- evidence head: `614445a20c2c15fbc3d8c107644a5244ddb52076`
- executed manifest commit: `cc9005ae4bd9065cf80f1c184f31974904165c54`
- custody manifest SHA-256: `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`
- protected run/job: `34871882486 / 104069521779`

WR-069/WR-070 supply the accepted deterministic privacy-safe parser evidence:

- audited WR-069 head: `5d4fc5fce3567a9894ddf3c08243f0ce6c087543`
- derived artifact: `.ai/work_helper/WR069_RETAINED_DERIVED_EVIDENCE.json`
- artifact SHA-256: `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`
- WR-070: `PASS — no findings`

## Snapshot contents

The machine artifact contains all **15** admitted exact retained source instances: 14 annual `NFLVERSE_PLAYER_SUMMARY_STATS` assets for 2012–2025 plus the exact retained `players.csv` metadata asset.

For each admitted source it records:

- content-addressed `source_instance_id`;
- provider/repository/acquisition identity;
- protected acquisition-batch UTC authority;
- release/tag/release ID/asset ID/filename/provider-update identity;
- exact SHA-256 and byte size;
- UTF-8 CSV / uncompressed media state;
- complete ordered raw columns;
- complete ordered `(column,type,nullable)` schema;
- WR-067 canonical schema hash;
- physical row count;
- approved columns;
- cutoff and availability semantics;
- provider mutability and retained-as-of evidence;
- CC BY 4.0 attribution and upstream-rights caveats;
- retained content-addressed object key/digest;
- acquisition-code identity and command/path;
- explicit `ADMITTED` status/reason.

The stats assets bind release tag `stats_player` / release ID `236670328`. Exact provider-update timestamps are preserved from accepted repository provenance. The replacement `players.csv` preserves the exact accepted asset ID/hash/size and WR-043's verified provider-update **date** (`2026-09-14`). The accepted repository evidence did not persist a sub-day provider-update timestamp, so the machine artifact records day precision explicitly rather than inventing a time.

That precision limitation does not weaken byte identity: exact asset ID, SHA-256, byte size, retained object key, dual-provider custody equality, and WR-069 full-file parser evidence remain authoritative.

## Admission and exclusion

- admitted retained source instances: **15**
- failed-closed retained source instances: **0**
- policy-excluded source classes: **1**
- `draft_picks.csv`: **EXCLUDED** under WR-057

`draft_picks.csv` was not acquired, downloaded, parsed, custodied, used, or replaced in WR-059.

The retained `players.csv` is admitted as an exact metadata snapshot, but it is explicitly **not used to rewrite historical cohort membership**.

## Canonicalization

Machine path:

`.ai/research/generated/WR059_RETURNING_PLAYER_V2_SOURCE_SNAPSHOT.json`

The canonical file is UTF-8 JSON with sorted object keys, compact separators, `ensure_ascii=false`, and one final LF. SHA-256 is computed over those exact bytes including the final LF. The adjacent sidecar records the exact digest.

## Boundaries

No provider access or provider mutation occurred during this remediation. No retained raw bytes were retrieved. No upstream source was reacquired or substituted. No 2026 regular-season outcome table, target/outcome join, fitting, scoring, tuning, model comparison, evaluation, prediction, ranking change, production change, or Phase-6 work occurred.
