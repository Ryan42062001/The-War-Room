# WR-046 Credential-Scope Attestation

Task: WR-046 — Source-Custody Capability Recovery  
Finding remediated: WR-047-AUD-01  
Starting canonical main: `77a685907d02c42df87bccedd305d79abf762a24`  
Prior audited WR-046 head: `64ba4aff697c1f45472045b52f374b01ee9e1695`  
Attested implementation head: `344127c5d822b2f8009627054bfd8a1f7e75abef`  
Provider run: `34704284392`  
Attestation job: `103581427069`  
Run event: `push`  
Run/job conclusion: `SUCCESS`

## Disposition

The exact configured credentials satisfy the approved least-privilege contract. No credential was changed. The prior live-provider fixture proof was not rerun.

## Backblaze B2 provider-issued evidence

The exact configured application key successfully authenticated to Backblaze's v4 `b2_authorize_account` endpoint. The privacy-safe provider response established:

- exactly one allowed bucket: `War-Room-Custody-Primary`;
- provider bucket ID: `ca47a42fe60b9e24a40f0e16`;
- exact `namePrefix`: `custody/`;
- capabilities exactly:
  - `listAllBucketNames`;
  - `readFiles`;
  - `writeFiles`;
  - `readFileRetentions`;
  - `writeFileRetentions`;
  - `readFileLegalHolds`;
  - `writeFileLegalHolds`.
- `deleteFiles`, governance bypass, bucket administration, account administration, and master-key authority were absent.

The report binds the authenticated configured key without disclosing it using SHA-256:
`b744e565dc21cc4ec402f3ec7a24026bf4f9ce9711e659992f2be21a27ccac5a`.

All fail-closed checks returned `true`: one bucket only, exact bucket, exact prefix, exact/required capabilities, forbidden capabilities absent, and configured-key authentication.

## Cloudflare R2 object credential

Provider-console evidence records the exact active account API token as:

- applied only to `war-room-custody-backup`;
- permission `Object Read & Write`;
- active;
- no R2 Bucket Lock/configuration write permission shown;
- no broader account-administration permission shown.

The workflow binds the exact configured access-key identifier without disclosing it using SHA-256:
`17e95438e19777a414ee85d57c32d44466199a973c51e5b6f57e42a5384585bd`.

Privacy-safe evidence:
- `.ai/work_helper/evidence/wr046/cloudflare-r2-object-token-scope.png.b64`;
- decoded-image SHA-256 `2a0e6ec0313ca422da01290456e2adaae18cde6bf060ff89daa9b89e4456b9f8`.

## Cloudflare Bucket-Lock read token

Provider token verification returned:

- token ID `207e45b2deb2a0fd1d8bd3c57354a0dc`;
- status `active`;
- no expiration;
- verification endpoint `https://api.cloudflare.com/client/v4/user/tokens/verify`.

Provider-console policy evidence records one account resource with permission `Workers R2 Storage:Read`. No write/admin permission capable of changing or removing Bucket Lock is present.

Privacy-safe redacted evidence:
- `.ai/work_helper/evidence/wr046/cloudflare-r2-config-token-scope-redacted.png.b64`;
- decoded-image SHA-256 `bb19b68af239802c778786e20f01b29e15149aa50a3dbd528ab0c439842c3126`.

## Secret and scope controls

- GitHub masked every configured secret in the job log.
- The generated report states `secret_values_present: false`.
- The runner-local report was removed.
- No bearer token, application-key secret, secret access key, password, or reusable credential was committed or printed.
- The live B2/R2 proof job was `SKIPPED`, as credentials were unchanged.
- No source admission/parsing, 2026 outcome inspection, model work, ranking work, production change, or `.ai/research/**` change occurred.

## Historical clarification

The first attestation attempt failed because the checker assumed the pre-v4 Backblaze singleton bucket fields. Backblaze v4 returns `allowed.buckets` as an array. The correction parses the provider's current schema and retains exact fail-closed bucket, prefix, capability, and forbidden-authority checks. This is parser remediation, not a credential relaxation.
