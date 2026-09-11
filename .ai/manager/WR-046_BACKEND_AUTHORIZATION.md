# WR-046 Backend Authorization — Backblaze B2 + Cloudflare R2

Status: APPROVED BY MANAGER — USER PROVISIONING REQUIRED
Date: 2026-09-11
Governing task: WR-046
Governing evidence contract: WR-D008 / audited WR-039 contract v1.0.0

## Approved architecture

### Primary — Backblaze B2
- Dedicated private B2 bucket for The War Room.
- Object Lock enabled on the bucket.
- Real retained objects use content-addressed object keys containing their SHA-256.
- Use Compliance-mode Object Lock for a fixed retention window and **Legal Hold** for the indefinite/unknown model-lifetime portion. Backblaze currently supports compliance retention for up to 3,000 days and allows retention dates to be extended; Legal Hold has no predetermined expiration.
- The custody automation must verify both object retention state and Legal Hold state after upload and during periodic verification.
- Do not grant the automation any bypass-governance capability.

### Independent backup — Cloudflare R2
- Dedicated private R2 Standard bucket for The War Room.
- Apply an **indefinite Bucket Lock** to the custody prefix or entire bucket before the real R&D custody run.
- Use the same content-addressed SHA-256 object keys as primary custody.
- Verify the live bucket-lock rule and direct object retrieval during the capability proof and later custody checks.

## Authentication
Use only least-privilege, bucket-scoped credentials.

Backblaze:
- bucket-scoped application key;
- only capabilities needed for upload, read/list/metadata, retention/legal-hold verification and setting the required retention/legal hold;
- no master key and no bypass-governance capability.

Cloudflare:
- R2 Object Read & Write credential scoped only to the selected R2 bucket;
- no account-wide administrative token for routine custody transfers.

Secrets must live only in protected GitHub Actions secrets or equivalent protected secret storage. Never commit them and never paste them into repository evidence or public CI logs.

## Contract fit
This provider change does **not** weaken or version-bump the accepted WR-039 contract.

The contract requires:
- project-controlled content-addressed immutable primary storage;
- a second independently retrievable project-controlled backup;
- overwrite/version-retention protection;
- later deterministic retrieval and digest verification;
- indefinite retention for the life of any dependent model/result plus at least seven years after retirement;
- quarterly existence/digest verification and pre-audit/rerun verification.

B2 Compliance Object Lock + Legal Hold and R2 indefinite Bucket Lock are authorized as the implementation mechanism, subject to WR-047 independent audit.

## Free-tier rationale
The current WR-042 source set is only on the order of megabytes. Current provider terms expose 10 GB free storage at Backblaze B2 and 10 GB-month of Standard R2 storage at Cloudflare, so the current workload is expected to remain within the free storage allowances. This is an economic preference, not a semantic dependency. If pricing changes, custody must remain intact.

## Required user provisioning
1. Create the dedicated private B2 bucket and enable Object Lock.
2. Configure Compliance-mode default retention (use the provider-supported maximum practical window for the real custody run) and ensure the WR-046 automation can apply/verify Legal Hold on retained objects.
3. Create a bucket-scoped B2 application key with the minimum required permissions.
4. Create the dedicated private R2 Standard bucket.
5. Add an indefinite Bucket Lock rule covering the custody objects.
6. Create a bucket-scoped R2 Object Read & Write credential.
7. Add credentials directly to GitHub repository Actions secrets; add bucket names/endpoints/account metadata as repository Actions variables where practical.

## Suggested GitHub configuration names
Secrets:
- `WR_CUSTODY_B2_KEY_ID`
- `WR_CUSTODY_B2_APPLICATION_KEY`
- `WR_CUSTODY_R2_ACCESS_KEY_ID`
- `WR_CUSTODY_R2_SECRET_ACCESS_KEY`

Variables:
- `WR_CUSTODY_B2_BUCKET`
- `WR_CUSTODY_B2_ENDPOINT`
- `WR_CUSTODY_R2_BUCKET`
- `WR_CUSTODY_R2_ENDPOINT`

The user should enter secret values directly in GitHub. Secret values must not be returned to Manager, Work Helper, chat, PR text, artifacts, or logs.

## Resume gate
After provisioning, resume WR-046 on existing branch / draft PR #135. The Work Helper must replace the superseded AWS proposal with this approved B2 + R2 design, complete a lawful fixture proof end-to-end, and publish one immutable completed head for WR-047.

WR-047 remains blocked until the live proof demonstrates:
- primary upload and retention/legal-hold state;
- independent backup upload and lock state;
- direct later retrieval from each provider;
- byte size and SHA-256 equality with acquisition bytes;
- no secret leakage;
- no actual v2 source admission, model work, 2026 outcomes, or production changes.
