# WR-046 — Source-Custody Capability Recovery

Task: `WR-046`  
Role: Work Helper / Super Troubleshooter / Cross-Functional Operator  
Assignment mode: `CROSS-ROLE RECOVERY`  
Status: `COMPLETE — AUDIT REQUIRED`  
Continuation canonical main: `ad32bf945ee799fe953614a810d032894e68cb47`  
Branch: `wr-046-custody-capability-recovery`  
PR: `#135`  
Governing WR-039 contract head: `00a9e787e716d6697e6cd0d9252982a672abbbe0`  
Governing machine-lock SHA-256: `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`

## Result

WR-046 recovered a live, independently retrievable, storage-layer-locked two-provider custody capability without admitting any Returning-Player v2 source.

Successful implementation/live-proof head:

`4cade5204631f5f2875d664f862dcb4fa0a85200`

Successful GitHub Actions evidence:
- workflow: `WR-046 Custody Fixture Proof`;
- run: `34665473257`;
- preflight job: `103476355038` — `SUCCESS`;
- live provider job: `103476377218` — `SUCCESS`.

Lawful non-sensitive fixture:
- source object: public `jqlang/jq` release asset `jq-attestation.json`;
- immutable release asset ID: `453012755`;
- SHA-256: `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`;
- byte size: `14380`.

Content-addressed custody key used on both providers:

`custody/sha256/01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed/raw`

## Primary custody proof — Backblaze B2

Provider: Backblaze B2  
Bucket: `War-Room-Custody-Primary`  
Region: `us-east-005`

Observed live proof from run `34665473257`:
- exact content-addressed object existed and was directly readable;
- retention mode: `COMPLIANCE`;
- retain-until: `2034-11-29T01:38:02Z`;
- Legal Hold: `ON`;
- independently retrieved SHA-256: `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`;
- independently retrieved byte size: `14380`.

The successful run read the live per-object retention and Legal Hold state after placement; this is storage-layer evidence, not an application promise.

## Independent backup proof — Cloudflare R2

Provider: Cloudflare R2  
Bucket: `war-room-custody-backup`  
Jurisdiction: `default`

Observed live proof from run `34665473257`:
- Bucket Lock rule condition: `Indefinite`;
- observed lock rule ID: `my-rule`;
- observed prefix: empty, therefore bucket-wide coverage of the custody key;
- identical content-addressed object was independently retrieved;
- independently retrieved SHA-256: `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`;
- independently retrieved byte size: `14380`.

The workflow verified an enabled indefinite lock rule covering the object key before/after object handling and then directly retrieved the R2 copy.

## Cross-provider byte identity

Privacy-safe proof output recorded:
- `all_three_sha256_equal: true`;
- `all_three_byte_sizes_equal: true`;
- expected/original SHA-256 = B2 retrieval SHA-256 = R2 retrieval SHA-256;
- expected/original size = B2 retrieval size = R2 retrieval size = `14380`.

GitHub Actions is execution/transport only. No Actions artifact is custody authority, and runner-local fixture/report files were removed after proof.

## Credential architecture actually proven

### Backblaze B2

The application key is restricted to the dedicated B2 bucket and `custody/` filename prefix. Provisioned capabilities:
- `listAllBucketNames` — retained for Backblaze S3-compatible client interoperability on a bucket-restricted key;
- `readFiles`;
- `writeFiles`;
- `readFileRetentions`;
- `writeFileRetentions`;
- `readFileLegalHolds`;
- `writeFileLegalHolds`.

Not granted/required:
- `listFiles`;
- `deleteFiles`;
- `bypassGovernance`;
- bucket administration;
- master-key use by the workflow.

### Cloudflare R2

Object-plane credential:
- R2 S3 `Object Read & Write`;
- scoped only to the dedicated War Room R2 bucket.

Configuration-plane verifier:
- separate Cloudflare API token with `Account > Workers R2 Storage > Read` only;
- no R2 configuration edit/admin permission;
- used only to read the live Bucket Lock configuration.

### GitHub Actions configuration

Protected secret names:
- `WR_CUSTODY_B2_KEY_ID`;
- `WR_CUSTODY_B2_APPLICATION_KEY`;
- `WR_CUSTODY_R2_ACCESS_KEY_ID`;
- `WR_CUSTODY_R2_SECRET_ACCESS_KEY`;
- `WR_CUSTODY_R2_CONFIG_READ_TOKEN`.

Non-secret variable names:
- `WR_CUSTODY_B2_BUCKET`;
- `WR_CUSTODY_B2_ENDPOINT`;
- `WR_CUSTODY_R2_BUCKET`;
- `WR_CUSTODY_R2_ENDPOINT`;
- `WR_CUSTODY_R2_ACCOUNT_ID`;
- `WR_CUSTODY_R2_JURISDICTION`.

No credential value was committed or intentionally printed. GitHub logs masked all five credentials. The final successful run additionally reported `secrets_logged: false` / `secrets_in_report: false`.

## Troubleshooting performed during live recovery

Two bounded provider-integration issues were discovered and repaired before the successful run:

1. Run `34665273432`: Backblaze S3 `HeadObject` returned `403` for the not-yet-present content-addressed object under the tightly scoped key. Instead of broadening to `listFiles`, WR-046 added an exact-key seed/write path that attempts the immutable content-addressed `PutObject` on an ambiguous missing-object probe, then leaves the main proof responsible for independent metadata/retention/hold/retrieval verification.
2. Run `34665380248`: B2 placement succeeded, then AWS SigV4 rejected the R2 Access Key ID because the copied GitHub secret contained surrounding newline whitespace. WR-046 added a wrapper that strips only surrounding whitespace from the known token-like custody configuration values in the child-process environment and reports only the affected environment-variable name. The final run recorded that only `WR_CUSTODY_R2_ACCESS_KEY_ID` required normalization.

Successful retry: run `34665473257`, job `103476377218`.

## Workflow behavior

Workflow path: `.github/workflows/wr046-custody-fixture.yml`.

Because GitHub does not expose `workflow_dispatch` for a workflow that exists only on a non-default PR branch, WR-046 added an explicit branch-only live-proof trigger. The live provider job runs only when either:
- `workflow_dispatch` is available; or
- a push is to `wr-046-custody-capability-recovery` and its commit message contains the explicit marker `[wr046-live-proof]`.

Ordinary PR/push runs remain preflight-only and do not invoke the external custody providers.

Live lifecycle proven:
1. acquire the lawful fixture by immutable GitHub release asset ID;
2. verify expected SHA-256 and byte size;
3. ensure the B2 content-addressed object exists;
4. verify B2 COMPLIANCE retention and Legal Hold;
5. independently retrieve and hash B2;
6. verify R2 indefinite Bucket Lock through the read-only configuration token;
7. place/verify the same R2 content-addressed object;
8. independently retrieve and hash R2;
9. require cross-provider digest/size equality;
10. emit only privacy-safe evidence and delete runner-local copies.

## Preserved acquisition evidence

The earlier transport-only exact-byte proof remains preserved:
- commit `61e31f6d9ce92fef6d56c5cabd08faa0217ca7f2`;
- workflow run `34642610497`;
- job `103405723000`;
- result: `SUCCESS`.

Manager B2/R2 authorization was reconciled into WR-046 history at merge checkpoint `0d6555e143b9aa8baf5333ef5add10fb3e31764f` without rewriting prior evidence.

## Integrity / scope confirmation

- `.ai/research/**` written: **NO**.
- Actual Returning-Player v2 sources admitted or parsed: **NO**.
- Protected/raw Returning-Player bytes placed in GitHub: **NO**.
- 2026 regular-season outcomes inspected: **NO**.
- Model fitting/scoring/tuning/comparison/ranking/evaluation: **NO**.
- Production/user-facing behavior changed: **NO**.
- WR-D008 / audited WR-039 semantics weakened: **NO**.
- `SOURCE CONTRACT VERSION BUMP REQUIRED`: **NO**.

## Gate / handoff

WR-046 is `COMPLETE — AUDIT REQUIRED`.

Work Helper does **not** self-certify or self-activate WR-047. Manager / Architect should activate WR-047 for independent Auditor / QA review of PR #135 and the immutable live-run evidence above.
