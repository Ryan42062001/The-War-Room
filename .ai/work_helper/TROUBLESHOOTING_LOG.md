# Work Helper Troubleshooting Log

Purpose: durable, high-value institutional troubleshooting memory for The War Room.

Do not use this file as a command transcript or chat log.

Record only incidents/findings likely to prevent future wasted work, such as significant symptoms/root causes, failed approaches worth avoiding, successful remediation patterns, CI/infrastructure quirks, cross-role dependency failures, evidence/provenance pitfalls, and reusable diagnostic techniques.

## Entries

### WR-046 / 2026-09-11 — exact-byte transport is not durable custody

**Symptom:** WR-042 could identify release objects and provider digests but had no execution/storage path that satisfied exact-byte acquisition plus project-controlled immutable primary and independently retrievable backup custody.

**Bounded conclusion:** Separate transport from custody. GitHub-hosted Actions can reproducibly acquire/hash exact bytes, but the runner and temporary filesystem are transport only. Durable custody needs explicitly authorized storage plus independently auditable retention controls.

**Decisive evidence:** Exact acquisition proof commit `61e31f6d9ce92fef6d56c5cabd08faa0217ca7f2`, run `34642610497`, job `103405723000`, reproduced fixture SHA-256 `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed` and size `14380`, then removed the local fixture without an Actions artifact. Final two-provider proof run `34665473257`, live job `103476377218`, independently retrieved the same bytes from B2 and R2 and proved storage-layer locks.

**Approaches ruled out:**
- mutable provider URLs or provider-reported digests alone are not custody;
- GitHub Actions artifacts are not the durable primary/backup authority;
- rights-restricted raw data must not be placed in the Git repository;
- an ordinary object store is not immutable merely because application code promises not to overwrite it;
- another project's backend is not a substitute for project-isolated custody.

**Recovery pattern:** Pin an immutable provider asset identifier plus expected digest/size; compute exact downloaded-byte identity before parse/use; write the same content-addressed key to two independently retrievable protected stores; directly retrieve both copies and recompute identity; verify storage-layer retention/lock controls separately from object existence.

**Least-privilege lesson:** Object-data and storage-configuration APIs may use different authorization planes. Cloudflare R2 bucket-scoped Object Read & Write handles S3 object transfer, while Bucket Lock verification uses a separate read-only `Workers R2 Storage Read` configuration token. Backblaze object retention/Legal Hold uses explicit per-file capabilities. Do not grant delete, governance bypass, configuration write/admin, or file-listing rights merely to make diagnostics convenient.

**Checkpoint:** PR #135; Manager B2/R2 authorization reconciled at `0d6555e143b9aa8baf5333ef5add10fb3e31764f`; successful live-proof implementation head `4cade5204631f5f2875d664f862dcb4fa0a85200`; run `34665473257`, job `103476377218`.

### WR-046 / 2026-09-11 — nonexistent S3 HEAD can be ambiguous under tight credentials

**Symptom:** The first live B2 proof, run `34665273432`, failed at `HeadObject` with HTTP `403` before the content-addressed fixture had ever been placed, even though the same credential later successfully performed the exact `PutObject` with Object Lock controls.

**Root cause / bounded conclusion:** Under a tightly scoped S3-compatible credential, a missing-object probe can be represented as forbidden rather than a clean not-found response. Treating every `403` on an initial exact-key HEAD as proof that broader list permission is required can cause unnecessary privilege expansion.

**Successful remediation:** Preserve least privilege. For a deterministic, content-addressed exact key whose bytes have already been independently verified, allow the initial 403/404 probe to fall through to the exact immutable `PutObject`; then require the main proof to independently HEAD/read metadata, read retention, read Legal Hold, retrieve bytes, and verify SHA-256/size. WR-046 did not add `listFiles`.

**Future prevention/reuse:** When existence is not security authority and object identity is content-addressed, design first-write workflows to tolerate ambiguous missing-object HEAD responses while fail-closing on any mismatch after placement.

**Evidence:** B2 seed succeeded in run `34665380248`; final proof run `34665473257` subsequently observed the object as existing and independently proved COMPLIANCE retention, Legal Hold `ON`, retrieval, and digest/size equality.

### WR-046 / 2026-09-11 — copied credential whitespace can corrupt SigV4 without being visually obvious

**Symptom:** Run `34665380248` reached R2 after successful B2 placement, but AWS SigV4 failed with an invalid Authorization header. Sanitized evidence showed a newline between the masked Access Key ID and the credential-scope slash.

**Root cause:** `WR_CUSTODY_R2_ACCESS_KEY_ID` had surrounding newline whitespace from copy/paste into GitHub Actions. The credential itself was otherwise valid.

**Successful remediation:** Normalize only surrounding whitespace for the fixed set of token-like custody credential/configuration environment variables inside a child-process environment. Never print values; report only names whose surrounding whitespace was removed. The final successful run recorded only `WR_CUSTODY_R2_ACCESS_KEY_ID` as normalized.

**Future prevention/reuse:** Provider-dashboard copy controls and secret-entry forms can preserve CR/LF whitespace. For token-like credentials, normalize surrounding whitespace at the transport boundary and ensure error sanitization uses the normalized child environment. Do not expose credential values while diagnosing signature failures.

**Evidence:** Successful live proof run `34665473257`, job `103476377218`; all GitHub secret values remained masked, `secrets_logged: false`, and both providers independently returned the expected SHA-256 and byte size.

### WR-046 / 2026-09-11 — branch-only Actions workflows need an explicit non-default trigger path

**Symptom:** `workflow_dispatch` existed in `.github/workflows/wr046-custody-fixture.yml`, but the user could not see `WR-046 Custody Fixture Proof` in the Actions sidebar because the workflow file existed only on an unmerged task branch.

**Bounded conclusion:** Do not merge an unaudited task PR merely to expose a manual-dispatch button on the default branch.

**Successful remediation:** Add a tightly bounded alternate trigger: live provider execution is permitted on a push only when the ref is exactly `refs/heads/wr-046-custody-capability-recovery` and the head commit message contains `[wr046-live-proof]`. Ordinary push/PR executions remain preflight-only. This preserved the audit-before-merge gate while allowing live capability proof.

**Future prevention/reuse:** For pre-merge workflows that need protected live validation, design the explicit branch-only trigger at task creation rather than assuming `workflow_dispatch` will be visible before merge.

**Evidence:** Successful marked push run `34665473257` executed both preflight and live provider jobs without merging PR #135.
