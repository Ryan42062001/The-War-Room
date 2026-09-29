# WR-046 Current-Credential Live Custody Proof

Task: WR-046 — Source-Custody Capability Recovery  
Remediation path: WR-050 Manager-selected path B  
Finding addressed: `WR-050-AUD-01 — HIGH`  
Prior audited head: `81fbc857625a810522460661c7b63591c20714d7`  
Live implementation/remediation head: `2739f4240600c726f880870051d6874cfa1e408b`  
Workflow run: `34723578709` — `SUCCESS`  
Preflight job: `103633687229` — `SUCCESS`  
Live-provider job: `103633709551` — `SUCCESS`  
Scope-only job: `SKIPPED`  
Execution count authorized/performed: exactly one fresh live proof.

## Current credential identity binding

The live-provider job first executed the same privacy-safe scope-attestation implementation used by the accepted current-scope evidence, in the same job and checkout as the live custody proof.

| Credential | Accepted scope anchor | Fresh live-job anchor | Match |
|---|---|---|---|
| Backblaze B2 application key ID SHA-256 | `b744e565dc21cc4ec402f3ec7a24026bf4f9ce9711e659992f2be21a27ccac5a` | same | YES |
| Cloudflare R2 access key ID SHA-256 | `17e95438e19777a414ee85d57c32d44466199a973c51e5b6f57e42a5384585bd` | same | YES |
| Cloudflare configuration token ID | `207e45b2deb2a0fd1d8bd3c57354a0dc` | same | YES |

The same live-job attestation also reconfirmed B2 exact bucket/prefix/capabilities and forbidden-authority absence, plus Cloudflare config-token status `active`. It recorded `secret_values_present: false`.

## Lawful fixture identity

- repository/release fixture: `jqlang/jq jq-attestation.json`;
- immutable asset ID: `453012755`;
- expected and observed SHA-256: `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`;
- expected and observed byte size: `14380`;
- acquisition result: `verified: true`;
- content-addressed object key: `custody/sha256/01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed/raw`.

## Backblaze B2 primary proof

- bucket: `War-Room-Custody-Primary`;
- region: `us-east-005`;
- object status during seed step: `existing-object`;
- retention mode: `COMPLIANCE`;
- retain-until: `2034-11-29T22:45:28Z`;
- Legal Hold: `ON`;
- direct retrieved byte size: `14380`;
- direct retrieved SHA-256: `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`;
- version ID: `4_zca47a42fe60b9e24a40f0e16_f108b22f70849c551_d20260912_m013803_c005_v0501045_t0008_u01789177083311`.

## Cloudflare R2 independent backup proof

- bucket: `war-room-custody-backup`;
- jurisdiction: `default`;
- Bucket Lock rule ID: `my-rule`;
- lock condition: `Indefinite`;
- lock prefix: empty, therefore bucket-wide;
- direct retrieved byte size: `14380`;
- direct retrieved SHA-256: `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`.

## Cross-provider and privacy results

- `all_three_sha256_equal: true`;
- `all_three_byte_sizes_equal: true`;
- result: `PASS`;
- `secrets_logged: false`;
- `secrets_in_report: false`;
- all five secret environment values were masked as `***`;
- runner-local fixture, custody report, and credential-binding report were deleted;
- no Actions artifact was used as custody authority;
- no reusable credential appears in repository evidence or logs.

## Boundaries

- credentials replaced/re-scoped: **NO**;
- custody mechanics weakened/changed: **NO**;
- Returning-Player source admitted or parsed: **NO**;
- 2026 regular-season outcomes inspected: **NO**;
- model/scoring/ranking work: **NO**;
- production/user-facing change: **NO**;
- WR039 / WR-D008 semantic change: **NO**.

The only workflow change was a non-mutating identity-attestation step before the unchanged live custody operations and cleanup of its temporary privacy-safe report.
