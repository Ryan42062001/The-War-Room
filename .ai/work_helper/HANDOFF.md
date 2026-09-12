# Work Helper / Super Troubleshooter Handoff

HANDOFF

Task ID: WR-046  
Role: Work Helper / Super Troubleshooter / Cross-Functional Operator  
Assignment mode: CROSS-ROLE RECOVERY  
Status: BLOCKED — CREDENTIALS REQUIRED — ADD GITHUB ACTIONS SECRETS  
Original starting main SHA: `2ec3ecb1e387f5bfdd52efe712cf575a9d5d9f85`  
Continuation canonical main: `ad32bf945ee799fe953614a810d032894e68cb47`  
WR-042 blocker head reviewed: `1c3c6d768d58aa636194226f16b9822eebc8c19f`  
Branch: `wr-046-custody-capability-recovery`  
PR: `#135`

## Reconciliation

Manager PR #136 authorized the B2 + R2 backend. The existing WR-046 history and current Manager main were merged without rewriting either line at checkpoint:

`0d6555e143b9aa8baf5333ef5add10fb3e31764f`

The earlier exact-byte acquisition proof remains intact at `61e31f6d9ce92fef6d56c5cabd08faa0217ca7f2`.

## Chosen custody architecture

- Primary: private Backblaze B2 bucket, content-addressed SHA-256 object key, COMPLIANCE retention plus Legal Hold.
- Independent backup: private Cloudflare R2 bucket, same content-addressed key, covered by an indefinite Bucket Lock.
- GitHub Actions: transport/execution only; no Actions artifact is custody authority.
- Both stored copies must be directly retrieved and independently SHA-256/byte-size verified.

## Credential contract

### Backblaze B2 bucket-scoped application key

Required capabilities only:
- `writeFiles`
- `readFiles`
- `writeFileRetentions`
- `readFileRetentions`
- `writeFileLegalHolds`
- `readFileLegalHolds`

Prefer an additional filename-prefix restriction to `custody/` when creating the key.

Do not grant delete, governance bypass, bucket-write, bucket-retention-write, master-key, list-files, or account-wide bucket enumeration permissions. This implementation does not need them.

### Cloudflare R2 object credential

R2 S3 **Object Read & Write**, scoped only to the dedicated War Room bucket.

### Cloudflare R2 lock-verification token

Separate Cloudflare API token:
- `Account > Workers R2 Storage > Read`;
- scoped only to the account owning the War Room R2 bucket;
- no edit/write permissions and no zone permissions.

Cloudflare does not expose Bucket Lock configuration through the bucket-scoped S3 Object credential, so this separate read-only account-resource token is required only to verify the live lock rule.

## Exact GitHub Actions secrets

Add values directly in GitHub. Never paste values into chat.

- `WR_CUSTODY_B2_KEY_ID`
- `WR_CUSTODY_B2_APPLICATION_KEY`
- `WR_CUSTODY_R2_ACCESS_KEY_ID`
- `WR_CUSTODY_R2_SECRET_ACCESS_KEY`
- `WR_CUSTODY_R2_CONFIG_READ_TOKEN`

## Exact non-secret GitHub Actions variables

- `WR_CUSTODY_B2_BUCKET`
- `WR_CUSTODY_B2_ENDPOINT`
- `WR_CUSTODY_R2_BUCKET`
- `WR_CUSTODY_R2_ENDPOINT`
- `WR_CUSTODY_R2_ACCOUNT_ID`
- `WR_CUSTODY_R2_JURISDICTION`

Bucket/account/endpoint/jurisdiction identifiers do not authenticate and are intentionally variables rather than secrets.

## Lawful fixture

`jqlang/jq` `jq-attestation.json`  
Asset ID: `453012755`  
SHA-256: `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`  
Byte size: `14380`

Previously proven acquisition evidence remains valid:
- commit `61e31f6d9ce92fef6d56c5cabd08faa0217ca7f2`;
- Actions run `34642610497`;
- job `103405723000`;
- result `SUCCESS`.

## Implemented workflow contract

Workflow path: `.github/workflows/wr046-custody-fixture.yml`  
UI name: `WR-046 Custody Fixture Proof`

Normal push/PR:
- syntax/self-test only;
- repeats exact acquisition verification;
- does not consume external credentials.

Manual `workflow_dispatch` on `wr-046-custody-capability-recovery`:
1. acquire and verify fixture;
2. upload/verify B2 content-addressed object;
3. apply/verify B2 COMPLIANCE retention and Legal Hold;
4. verify R2 indefinite Bucket Lock;
5. upload/verify identical R2 object;
6. retrieve both copies independently;
7. recompute SHA-256 and byte size;
8. emit only privacy-safe evidence;
9. delete runner-local copies/report.

## Proof status

Primary B2 proof: NOT YET EXECUTED — protected GitHub configuration not yet confirmed populated.  
B2 retention / Legal Hold proof: NOT YET EXECUTED.  
Independent R2 proof: NOT YET EXECUTED.  
R2 Bucket Lock proof: NOT YET EXECUTED.  
Dual retrieval/digest proof: NOT YET EXECUTED.

## Integrity

Secrets/raw protected bytes exposed publicly: **NO**  
Returning-Player v2 source admitted/parsed: **NO**  
2026 outcomes inspected: **NO**  
Model work performed: **NO**  
Production behavior changed: **NO**  
`.ai/research/**` written: **NO**  
WR-D008 / WR-039 weakened: **NO**  
`SOURCE CONTRACT VERSION BUMP REQUIRED`: **NO**

## Current blocker / next action

The external buckets exist. The remaining blocker is only protected GitHub Actions credentials plus non-secret repository variables.

User action: populate the five secrets and six variables directly in GitHub, then resume **this same WR-046 task**. Do not provide any credential value to chat.

After configuration, Work Helper should dispatch `WR-046 Custody Fixture Proof` on `wr-046-custody-capability-recovery`, verify the complete live proof, update this handoff/report, freeze one immutable completed PR #135 head, and return to Manager for WR-047 activation.

Recommended next role right now: Manager / Architect only for awareness; **do not activate WR-047 yet**.

Checkpoint / SHA: current exact branch head after the credential-contract implementation commit is authoritative in PR #135 metadata.
