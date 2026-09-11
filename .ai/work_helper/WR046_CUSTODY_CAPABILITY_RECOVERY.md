# WR-046 — Source-Custody Capability Recovery

Task: `WR-046`  
Role: Work Helper / Super Troubleshooter / Cross-Functional Operator  
Assignment mode: `CROSS-ROLE RECOVERY`  
Status: `BLOCKED — CUSTODY BACKEND REQUIRED — USER AUTHORIZATION`  
Starting canonical main: `2ec3ecb1e387f5bfdd52efe712cf575a9d5d9f85`  
WR-042 blocker head reviewed: `1c3c6d768d58aa636194226f16b9822eebc8c19f`  
Branch: `wr-046-custody-capability-recovery`  
PR: `#135`  
Governing WR-039 contract head: `00a9e787e716d6697e6cd0d9252982a672abbbe0`  
Governing machine-lock SHA-256: `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`

## Disposition

WR-042's exact-release-byte acquisition blocker is recoverable in GitHub-hosted Actions. WR-046 proved that a runner can acquire a public GitHub release asset by immutable asset ID, compute the downloaded-byte SHA-256 and byte size, compare both to frozen expected metadata, independently re-check the file, and remove the transport copy without uploading an Actions artifact.

The remaining blocker is durable custody. No currently authorized War Room-specific backend available to this task provides both project-controlled access control and the contract-required immutable/version-retained primary plus independently retrievable second copy. WR-046 therefore stops at the explicit authorization gate rather than fabricating primary/backup evidence.

`SOURCE CONTRACT VERSION BUMP REQUIRED` is **not triggered**. The accepted WR-039 / WR-D008 semantics remain implementable with a suitable storage backend.

## Root capability gaps reconstructed from WR-042

| Capability | WR-042 state | WR-046 result |
|---|---|---|
| Exact provider release-byte acquisition | unavailable in R&D execution environment | **PROVEN with lawful fixture in GitHub-hosted Actions** |
| Downloaded-byte SHA-256 | unavailable | **PROVEN** |
| Downloaded-byte size | unavailable | **PROVEN** |
| Project-controlled access-controlled content-addressed primary | unavailable | **BLOCKED — backend authorization required** |
| Independently retrievable project-controlled backup | unavailable | **BLOCKED — backend authorization required** |
| Retrieval of both copies + digest equality | unavailable | **BLOCKED — depends on the two durable copies** |
| Overwrite/version-retention or equivalent immutability | unavailable | **ARCHITECTURE IDENTIFIED; proof requires backend** |
| Rights/license/attribution metadata preservation | contract specified | **CONFIGURATION SURFACE DEFINED; durable proof requires backend** |
| Secure secret/configuration path | unavailable | **OIDC architecture selected; no long-lived cloud keys required** |

## Exact acquisition fixture proof

Fixture: public `jqlang/jq` release object `jq-attestation.json`. This is a lawful non-sensitive test object and is not a Returning-Player v2 source.

Frozen fixture identity used by the workflow:
- repository: `jqlang/jq`;
- immutable GitHub release asset ID: `453012755`;
- expected SHA-256: `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`;
- expected byte size: `14380`.

Exact-head GitHub Actions evidence:
- branch commit: `61e31f6d9ce92fef6d56c5cabd08faa0217ca7f2`;
- workflow run: `34642610497`;
- job: `103405723000`;
- conclusion: `SUCCESS`;
- downloaded result: SHA-256 `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`, byte size `14380`, `verified=true`;
- independent runner-side `sha256sum` and `stat` checks also passed;
- fixture was removed after verification;
- no `upload-artifact` step exists in the fixture workflow and no fixture is treated as durable custody.

This proves the acquisition/hash/size transport layer only. It deliberately does not claim durable primary or backup custody.

## Storage options evaluated

### Public War Room GitHub repository — rejected

The repository is public. Raw Players/Draft assets may require restricted custody, and a public Git object is not the approved access-controlled raw-custody design. Using the repository would also mix code/evidence publication with protected raw custody.

### GitHub Actions artifacts — rejected as authority

The accepted contract explicitly permits CI artifacts only as transport/cache. They are not the durable primary or backup.

### Existing connected Supabase project — rejected

The only connected Supabase project is the user's Family Finance Hub backend, as shown by its finance-domain tables. Reusing it would violate project isolation. Separately, current Supabase Storage's S3 compatibility does not support S3 versioning or Object Lock, so treating an ordinary bucket as native WORM custody would require custom append-only controls and would be a weaker fit than a storage service with native retention enforcement.

### Other existing GitHub repositories — rejected

No dedicated private War Room custody repository exists in the connected GitHub account. The only private repository found is Family Finance Hub and is out of scope for the same project-isolation reason.

## Chosen custody architecture

The smallest strong architecture that directly matches the frozen semantics is:

1. **GitHub Actions acquisition / verifier runner**
   - acquire exact provider release asset by immutable provider asset identifier whenever the provider exposes one;
   - require an expected provider digest and byte size before custody;
   - compute downloaded-byte SHA-256 and size before any parse/use;
   - fail closed on mismatch;
   - never upload the raw object as a GitHub Actions artifact for authority.

2. **Primary: private AWS S3 bucket with Versioning + Object Lock**
   - project-dedicated bucket;
   - Block Public Access enabled;
   - Object Lock enabled with COMPLIANCE retention for retained versions;
   - content-addressed key, e.g. `objects/sha256/<sha256>/raw`;
   - exact source metadata stored as a separately content-addressed/locked JSON object;
   - metadata preserves provider/repository, canonical endpoint, release/tag/id/asset id, acquisition timestamp, exact SHA-256/size, license ID/URL, attribution, upstream caveat, retention disposition, acquisition code SHA, and command;
   - a rolling retention horizon must never fall below the contract's required model-life + seven-years-after-retirement obligation. Retention may be extended, never shortened.

3. **Backup: second private AWS S3 Object-Lock bucket in a different AWS region**
   - independently named and directly retrievable;
   - Versioning + Object Lock enabled;
   - same content-addressed object key and exact bytes;
   - explicit upload/verification makes the second copy independently testable rather than treating an asynchronous replication status or shared URL as evidence.

4. **Immediate post-write retrieval proof**
   - retrieve the primary object to a fresh temporary path and recompute SHA-256/size;
   - retrieve the backup object separately to another fresh path and recompute SHA-256/size;
   - require `acquired == primary_retrieved == backup_retrieved` SHA-256 and byte size;
   - query and record each object's version ID and Object Lock retention state;
   - delete local temporary copies after verification.

5. **Periodic verification**
   - scheduled quarterly workflow retrieves both copies independently and recomputes digests;
   - the same verification runs immediately before every audit or rerun;
   - verification fails closed if either copy is missing, digest-divergent, publicly accessible, or lacks required retention state.

6. **Secret/configuration handling**
   - GitHub Actions authenticates to AWS with GitHub OIDC and short-lived credentials;
   - no AWS access key or secret key is committed to GitHub or required as a long-lived Actions secret;
   - the AWS trust policy is restricted to `Ryan42062001/The-War-Room` and the approved workflow/environment/ref surface;
   - the assumed role receives only the bucket/object operations needed for upload, read-back verification, and retention inspection/extension; no retention-bypass permission is granted;
   - non-secret bucket names, regions, and role ARN may be carried as repository/environment variables once provisioned.

Official architecture references reviewed during WR-046:
- AWS S3 Object Lock: `https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html`
- GitHub Actions OIDC for AWS: `https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws`
- Supabase S3 compatibility: `https://supabase.com/docs/guides/storage/s3/compatibility`

## Primary-custody fixture proof

**NOT EXECUTED.** No dedicated authorized immutable War Room storage backend is available. Creating fake URIs, using this public repository, using Family Finance Hub infrastructure, or calling a transient Actions artifact the primary would violate the task.

## Independent-backup fixture proof

**NOT EXECUTED.** It depends on a second authorized project-controlled durable store. No such backend is currently connected/provisioned for War Room.

## Retrieval / byte-identical digest proof

Transport-side acquisition and local re-verification: **PASS** in run `34642610497`.

Durable primary + durable backup later retrieval: **NOT EXECUTED — BACKEND REQUIRED**.

## Immutability / version-retention proof

Architecture: **S3 Versioning + Object Lock COMPLIANCE** selected because it provides a native WORM control matching the accepted contract.

Live fixture evidence: **NOT EXECUTED — BACKEND REQUIRED**. No claim of immutability is made without observing bucket configuration, retained object versions, retention state, overwrite behavior, and independent retrieval.

## Minimum external authorization required

Authorize/provision a **War Room-dedicated AWS custody backend** consisting of:

- one private S3 primary bucket in one region with Versioning + Object Lock enabled;
- one private S3 backup bucket in a different region with Versioning + Object Lock enabled;
- one GitHub OIDC IAM role trusted only for the approved `Ryan42062001/The-War-Room` Actions identity and granted least-privilege access to those two buckets.

Do **not** provide AWS access keys or secrets in chat or GitHub. The only values WR-046 needs after provisioning are non-secret configuration identifiers: primary bucket name/region, backup bucket name/region, and OIDC role ARN. With those available, Work Helper can add the bounded dual-upload/retrieval/retention verifier and run the complete lawful fixture lifecycle.

## Scope / integrity confirmation

- `.ai/research/**` written: **NO**.
- Actual Returning-Player v2 sources admitted or parsed: **NO**.
- Protected/raw Returning-Player bytes placed in GitHub: **NO**.
- Credentials/tokens/cloud secrets committed: **NO**.
- 2026 regular-season outcomes inspected: **NO**.
- Model fitting/scoring/tuning/comparison/ranking/evaluation: **NO**.
- Production/user-facing behavior changed: **NO**.
- WR-D008 / WR-039 semantics weakened: **NO**.

## Files changed in WR-046 so far

- `.github/workflows/wr046-custody-fixture.yml`
- `scripts/custody/acquire_github_release_asset.py`
- `.ai/work_helper/WR046_CUSTODY_CAPABILITY_RECOVERY.md`
- `.ai/work_helper/HANDOFF.md`
- `.ai/work_helper/TROUBLESHOOTING_LOG.md`

## Next gate

WR-046 remains blocked on explicit backend authorization. Return control to **Manager / Architect**. Do not activate WR-047 yet. After the backend is authorized, resume WR-046, prove primary + backup + retrieval + retention with a lawful fixture, freeze one immutable WR-046 PR head, and only then send that exact target to independent WR-047 audit.
