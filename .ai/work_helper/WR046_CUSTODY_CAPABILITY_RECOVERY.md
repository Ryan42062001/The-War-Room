# WR-046 — Source-Custody Capability Recovery

Task: `WR-046`  
Role: Work Helper / Super Troubleshooter / Cross-Functional Operator  
Assignment mode: `CROSS-ROLE RECOVERY`  
Status: `BLOCKED — CREDENTIALS REQUIRED — ADD GITHUB ACTIONS SECRETS`  
Original WR-046 starting main: `2ec3ecb1e387f5bfdd52efe712cf575a9d5d9f85`  
Continuation canonical main: `ad32bf945ee799fe953614a810d032894e68cb47`  
WR-042 blocker head reviewed: `1c3c6d768d58aa636194226f16b9822eebc8c19f`  
Branch: `wr-046-custody-capability-recovery`  
PR: `#135`  
Governing WR-039 contract head: `00a9e787e716d6697e6cd0d9252982a672abbbe0`  
Governing machine-lock SHA-256: `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`

## Continuation reconciliation

Manager PR #136 advanced canonical `main` to `ad32bf945ee799fe953614a810d032894e68cb47` and authorized the Backblaze B2 + Cloudflare R2 architecture. The existing WR-046 branch had diverged only because it already contained the earlier acquisition proof and Work Helper evidence.

The histories were reconciled without rewriting or discarding WR-046 evidence. Merge checkpoint:

`0d6555e143b9aa8baf5333ef5add10fb3e31764f`

Parents:
- prior WR-046 blocker/evidence head `c3233b82106c6018daa13654db04297f74498aa8`;
- Manager-authorized main `ad32bf945ee799fe953614a810d032894e68cb47`.

The proven acquisition commit `61e31f6d9ce92fef6d56c5cabd08faa0217ca7f2` therefore remains in branch history.

## Proven exact-byte acquisition evidence retained

Lawful fixture: public `jqlang/jq` release object `jq-attestation.json`.

Frozen identity:
- GitHub release asset ID: `453012755`;
- SHA-256: `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`;
- byte size: `14380`.

Previously observed exact-head proof:
- commit `61e31f6d9ce92fef6d56c5cabd08faa0217ca7f2`;
- workflow run `34642610497`;
- job `103405723000`;
- conclusion: `SUCCESS`;
- scripted download-byte verification plus independent `sha256sum` / `stat` verification passed;
- fixture was removed after verification;
- no Actions artifact was used as custody.

This evidence is transport/acquisition proof only and is deliberately preserved.

## Manager-approved custody architecture

### Primary — Backblaze B2

Private War Room-dedicated B2 bucket with Object Lock enabled.

Object key:

`custody/sha256/<sha256>/raw`

For the WR-046 fixture the exact key is:

`custody/sha256/01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed/raw`

The workflow applies and verifies:
- COMPLIANCE Object Lock retention;
- 3,000-day retention target for the capability fixture;
- Legal Hold `ON` for indefinite preservation;
- exact object metadata SHA-256;
- fresh retrieval and downloaded-byte SHA-256 / byte-size equality.

Legal Hold and compliance retention are separate controls. Legal Hold supplies the indefinite/unknown-lifetime preservation component; compliance retention supplies a fixed non-shortenable retention window.

### Independent backup — Cloudflare R2

Private War Room-dedicated R2 bucket with an already-configured indefinite Bucket Lock covering the custody key.

The workflow:
- verifies the live Bucket Lock configuration **before upload**;
- requires an enabled `Indefinite` rule whose prefix covers the content-addressed key;
- uploads the identical fixture under the same content-addressed key;
- retrieves it independently and recomputes SHA-256 / byte size;
- verifies the indefinite lock rule again after upload.

B2 and R2 are separate providers and are directly retrieved independently. GitHub Actions remains only the acquisition/execution layer.

## Least-privilege credential contract

### Backblaze B2 application key

Create/use a **standard application key restricted to only the War Room B2 bucket**. If Backblaze offers a file-name-prefix restriction for the key, additionally restrict it to `custody/`.

Required capabilities, and only these capabilities for the implemented workflow:

1. `writeFiles` — upload the content-addressed object.
2. `readFiles` — `HeadObject` and `GetObject` metadata/content verification.
3. `writeFileRetentions` — apply/extend COMPLIANCE retention on the exact object version.
4. `readFileRetentions` — read back and verify retention mode/date.
5. `writeFileLegalHolds` — set Legal Hold `ON`.
6. `readFileLegalHolds` — read back and verify Legal Hold state.

Not required by this workflow:
- `deleteFiles`;
- `bypassGovernance`;
- `writeBuckets`;
- `writeBucketRetentions`;
- `readBucketRetentions`;
- `listFiles`;
- `listAllBucketNames`;
- master application key.

The workflow intentionally issues direct object calls and does not list buckets/files or change bucket-level Object Lock configuration. Successful per-version retention/legal-hold writes and reads are the live object-level lock proof.

### Cloudflare R2 object credential

Create/use an R2 S3 credential with:

**Object Read & Write**, scoped to **only the War Room R2 bucket**.

This corresponds to bucket-resource object read/write/list access. It is used only for `PutObject`, `HeadObject`, and `GetObject`. No account-wide R2 write/admin credential is needed.

### Cloudflare R2 lock-configuration read token

Cloudflare's bucket-scoped Object Read & Write credentials are supported by the S3-compatible API, not the Cloudflare REST configuration API. Automated verification of Bucket Lock therefore requires a **separate read-only Cloudflare API token**.

Minimum token:
- permission: `Account > Workers R2 Storage > Read`;
- resource: only the Cloudflare account that owns the War Room R2 bucket;
- no edit/write permissions;
- no zone permissions.

This permission is account-resource scoped by Cloudflare and cannot be reduced to a single-bucket configuration-read token. It is used only for:

`GET /accounts/{account_id}/r2/buckets/{bucket_name}/lock`

Routine object transfer remains bucket-scoped through the separate S3 credential.

## Exact GitHub Actions configuration

### Protected secrets

Add these directly in the GitHub repository's Actions secrets. Do not paste their values into chat, PR comments, repository files, logs, or artifacts.

- `WR_CUSTODY_B2_KEY_ID`
- `WR_CUSTODY_B2_APPLICATION_KEY`
- `WR_CUSTODY_R2_ACCESS_KEY_ID`
- `WR_CUSTODY_R2_SECRET_ACCESS_KEY`
- `WR_CUSTODY_R2_CONFIG_READ_TOKEN`

All five are treated as credentials/secrets by WR-046.

### Non-secret repository Actions variables

- `WR_CUSTODY_B2_BUCKET`
- `WR_CUSTODY_B2_ENDPOINT`
- `WR_CUSTODY_R2_BUCKET`
- `WR_CUSTODY_R2_ENDPOINT`
- `WR_CUSTODY_R2_ACCOUNT_ID`
- `WR_CUSTODY_R2_JURISDICTION`

Expected formats:
- B2 endpoint: `https://s3.<region>.backblazeb2.com`.
- R2 endpoint: the exact provider endpoint for the bucket jurisdiction, normally `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
- R2 jurisdiction: `default`, `eu`, `us`, `fedramp`, or the provider-supported jurisdiction applicable to the bucket.

These values identify storage resources/endpoints but do not authenticate to them. They are appropriate as repository variables, not secrets.

## Implemented proof tooling

### `.github/workflows/wr046-custody-fixture.yml`

The workflow now has two layers:

1. `contract-preflight` — runs on normal branch/PR changes with no external secrets. It syntax-checks custody scripts, runs deterministic self-tests, confirms AWS CLI availability, and repeats the already-proven exact fixture acquisition/hash/size check.
2. `live-b2-r2-custody-proof` — runs **only on `workflow_dispatch`**. It consumes the protected credentials and non-secret variables, acquires the lawful fixture, executes the B2/R2 lifecycle proof, emits only a privacy-safe JSON summary, and removes runner-local fixture/report bytes. No Actions artifact is uploaded.

### `scripts/custody/prove_b2_r2_custody.py`

The proof script:
- fail-closes on missing configuration;
- verifies the fixture before storage;
- derives the same SHA-256 content-addressed key for both providers;
- handles an existing matching object idempotently by verifying it before any lock extension;
- applies/verifies B2 COMPLIANCE retention + Legal Hold;
- verifies R2 indefinite Bucket Lock via the read-only REST token;
- retrieves B2 and R2 independently into fresh temporary paths;
- recomputes SHA-256 and byte size for both;
- emits no credential values and sanitizes provider errors against configured secrets;
- never uploads or parses a Returning-Player v2 source.

## Live proof status

Primary B2 fixture proof: **NOT YET EXECUTED — GitHub Actions credentials/configuration not yet confirmed populated.**

B2 retention / Legal Hold proof: **NOT YET EXECUTED.**

Independent R2 backup proof: **NOT YET EXECUTED.**

R2 Bucket Lock proof: **NOT YET EXECUTED.**

Independent retrieval/digest proof: **NOT YET EXECUTED.**

The repository implementation can be completed and preflight-tested before credentials exist. The live provider proof must not be fabricated.

## Exact workflow to run after GitHub configuration is populated

GitHub Actions workflow:

`.github/workflows/wr046-custody-fixture.yml`

UI name:

`WR-046 Custody Fixture Proof`

Run `workflow_dispatch` on branch:

`wr-046-custody-capability-recovery`

The live job must reach `SUCCESS` before WR-046 can be marked complete/audit-required.

## Integrity

- `.ai/research/**` written: **NO**.
- Actual Returning-Player v2 sources admitted or parsed: **NO**.
- Protected/raw Returning-Player bytes placed in GitHub: **NO**.
- Credential values committed or requested in chat: **NO**.
- 2026 regular-season outcomes inspected: **NO**.
- Model fitting/scoring/tuning/comparison/ranking/evaluation: **NO**.
- Production/user-facing behavior changed: **NO**.
- WR-D008 / WR-039 semantics weakened: **NO**.
- `SOURCE CONTRACT VERSION BUMP REQUIRED`: **NO**.

## Current gate

Repository-side implementation is ready for normal CI/preflight validation. Live proof is blocked only on the protected GitHub Actions configuration values.

Do not activate WR-047 yet. After the user adds the secrets/variables directly in GitHub, resume this same WR-046 task, dispatch the live workflow, capture privacy-safe live evidence, update the Work Helper reports, and publish one immutable completed head for WR-047.
