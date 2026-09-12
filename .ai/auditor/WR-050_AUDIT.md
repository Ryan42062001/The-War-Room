# WR-050 — Independent Re-Audit of Custody Credential-Scope Attestation

Task: `WR-050`  
Role: Independent Auditor / QA  
Audit mode: Fast Refresh, expanded only for provider evidence, historical live-proof lineage, CI separation, and WR-D008 preservation  
Canonical main / audit baseline: `41358f892a1abac76cd81561f8d88dbaf6305920`  
Audit branch: `wr-050-custody-credential-scope-reaudit`  
Audited PR: #135  
Immutable remediated WR-046 head: `81fbc857625a810522460661c7b63591c20714d7`  
Prior failed-audit head: `64ba4aff697c1f45472045b52f374b01ee9e1695`  
Prior successful live-provider lineage head: `4cade5204631f5f2875d664f862dcb4fa0a85200`

## Final verdict

`FAIL — REMEDIATION REQUIRED`

WR-047-AUD-01 is substantially remediated for the **current** credential-scope envelopes, but the evidence does not independently establish the required credential continuity between the previously accepted live-provider proof and the newly attested current credentials. Because the remediation intentionally skipped a new live B2/R2 proof on the premise that credentials were unchanged, that premise must itself be independently provable before the prior live proof can be inherited.

## Refresh / immutable-target verification

- Canonical `main` independently resolves to `41358f892a1abac76cd81561f8d88dbaf6305920`.
- The audit branch was independently verified at the same baseline before Auditor writes.
- PR #135 is open, unmerged, mergeable, and resolves to exact immutable head `81fbc857625a810522460661c7b63591c20714d7`.
- The complete remediation delta from `64ba4aff697c1f45472045b52f374b01ee9e1695` to `81fbc857625a810522460661c7b63591c20714d7` is 10 commits and exactly six changed surfaces:
  1. `.ai/work_helper/HANDOFF.md`
  2. `.ai/work_helper/WR-046_CREDENTIAL_SCOPE_ATTESTATION.md`
  3. `.ai/work_helper/evidence/wr046/cloudflare-r2-config-token-scope-redacted.png.b64`
  4. `.ai/work_helper/evidence/wr046/cloudflare-r2-object-token-scope.png.b64`
  5. `.github/workflows/wr046-custody-fixture.yml`
  6. `scripts/custody/attest_credential_scopes.py`
- No production/browser implementation, `.ai/research/**`, source payload, model/scoring/ranking artifact, or accepted WR039/WR-D008 contract surface changed in that remediation delta.

## Historical WR-047 evidence preservation

PASS.

`.ai/auditor/WR-047_AUDIT.md` remains preserved as the historical `FAIL — REMEDIATION REQUIRED` audit of head `64ba4aff697c1f45472045b52f374b01ee9e1695`. Its sole HIGH finding, `WR-047-AUD-01`, remains explicit rather than being rewritten as though the original audit had passed.

The prior audit's accepted findings remain historical evidence only: exact fixture bytes, content-addressed identity, B2 COMPLIANCE retention and Legal Hold, R2 independent backup and Indefinite Bucket Lock, exact retrieval/digest equality, secret masking, no-master runtime boundary, contract preservation, no source/model/production activity, browser-CI separation, and the live-proof implementation lineage at `4cade5204631f5f2875d664f862dcb4fa0a85200`.

## Backblaze B2 current-scope audit

Verdict: PASS for the current configured B2 credential.

Provider-scope run `34704284392`, job `103581427069`, independently shows the workflow passing the exact configured `WR_CUSTODY_B2_KEY_ID` and `WR_CUSTODY_B2_APPLICATION_KEY` to `scripts/custody/attest_credential_scopes.py`; both values remain GitHub-masked in logs.

The script authenticates those exact values against Backblaze v4 `b2_authorize_account` and fails closed unless the provider response contains:

- exactly one allowed bucket;
- exact bucket `War-Room-Custody-Primary`;
- exact `namePrefix` `custody/`;
- capabilities exactly the seven approved capabilities:
  - `listAllBucketNames`
  - `readFiles`
  - `writeFiles`
  - `readFileRetentions`
  - `writeFileRetentions`
  - `readFileLegalHolds`
  - `writeFileLegalHolds`;
- no additional capability.

The live provider response in job `103581427069` satisfies every check and identifies provider bucket ID `ca47a42fe60b9e24a40f0e16`. Because `capabilities_exact` requires set equality, forbidden authority is not merely checked by an incomplete denylist: *any* extra capability would fail. In particular `deleteFiles`, `bypassGovernance`, bucket administration, key/account administration, and master-key authority are absent.

The job emits only SHA-256 of the configured application-key ID, `b744e565dc21cc4ec402f3ec7a24026bf4f9ce9711e659992f2be21a27ccac5a`, not the reusable key secret.

Backblaze's current v4 documentation independently confirms that `b2_authorize_account.allowed` is the provider authority for bucket restrictions, `capabilities`, and `namePrefix`.

## Cloudflare R2 object credential current-scope audit

Verdict: PASS for the claimed current scope envelope; historical-live credential continuity is handled separately below.

The remediation freezes provider-console scope evidence for the active R2 S3 credential and records:

- bucket: `war-room-custody-backup` only;
- permission: `Object Read & Write`;
- no Admin Read & Write / bucket-configuration authority;
- no broader account administration.

The scope workflow binds the configured `WR_CUSTODY_R2_ACCESS_KEY_ID` without printing it by SHA-256 `17e95438e19777a414ee85d57c32d44466199a973c51e5b6f57e42a5384585bd`.

Cloudflare's current R2 authentication documentation independently establishes the relevant authority semantics: `Object Read & Write` can be scoped to specific buckets and permits object read/write/list only; `Admin Read & Write` is the permission that can create/delete buckets and edit bucket configuration. Cloudflare also documents that, for R2 S3 credentials generated from an API token, the Access Key ID is the API-token ID and the Secret Access Key is derived separately. This supports use of the non-secret access-key identifier as the credential identity anchor.

The repository evidence is intentionally provider-console evidence because the R2 S3 object credential cannot introspect its own access policy through the S3 object-only surface.

## Cloudflare Bucket-Lock configuration-read token current-scope audit

Verdict: PASS for the current token's active identity and claimed read-only scope; historical-live credential continuity is handled separately below.

`attest_credential_scopes.py` authenticates the exact configured `WR_CUSTODY_R2_CONFIG_READ_TOKEN` to Cloudflare `GET /user/tokens/verify`. Provider run `34704284392` returned:

- token ID `207e45b2deb2a0fd1d8bd3c57354a0dc`;
- status `active`;
- no expiration.

Cloudflare's current Verify Token API documentation independently confirms that this endpoint returns the authenticated token's identifier and active/disabled/expired status. The provider-console evidence freezes the policy for that token as one required account resource with `Workers R2 Storage:Read`, with no R2 write/admin permission.

Cloudflare's current permission documentation classifies `Workers R2 Storage Read` as read access and separately defines R2 write/edit authority. Therefore the attested policy contains no permission capable of changing or removing Bucket Lock.

## Secret/privacy audit

Verdict: PASS for repository text, workflow logs, and generated provider reports; no reusable credential was observed.

- B2 key ID and application-key secret are GitHub-masked in provider/live job logs.
- R2 access-key ID, secret access key, and configuration bearer token are GitHub-masked in historical live-proof logs.
- The scope job exposes only non-reusable hashes/IDs needed for evidence binding.
- The runner-local scope report is removed in an `if: always()` cleanup step.
- No Actions artifact is used as durable custody.
- The two committed Cloudflare policy captures are stored as PNG base64 evidence rather than reusable credential text; the configuration-token capture is explicitly redacted.
- Cloudflare documentation confirms an R2 Secret Access Key cannot be retrieved again after the token-creation confirmation step.

No bearer value, B2 application-key secret, R2 Secret Access Key, password, or master/root credential appears in the audited textual repository delta or inspected logs.

## Credential-change / live-proof lineage audit

Verdict: FAIL — continuity is not independently established.

Work Helper states that no credential was changed or re-scoped. Repository and provider evidence prove the **current** credential identities/scopes, but the prior successful live-provider job did not emit equivalent privacy-safe credential identity anchors.

Historical live proof:

- run `34665473257`;
- live job `103476377218`;
- exact checkout `4cade5204631f5f2875d664f862dcb4fa0a85200`;
- all five credential values appear only as `***` in the job log;
- the normalized live report records provider/bucket/object/retention/lock/digest evidence, but no B2 application-key-ID hash, no R2 Access Key ID/token ID/hash, and no Cloudflare configuration-token ID.

Current scope proof:

- run `34704284392`;
- preflight `103581403628`: SUCCESS;
- credential-scope job `103581427069`: SUCCESS;
- current B2 key-ID hash `b744e565...`;
- current R2 access-key-ID hash `17e95438...`;
- current Cloudflare configuration-token ID `207e45b2...`;
- live-custody job intentionally SKIPPED.

No repository commit can prove whether GitHub Actions secret values were replaced between those executions because secret values are intentionally outside Git history, and the available historical live log contains no privacy-safe identifiers to compare to the new identifiers.

Therefore the independent audit cannot distinguish these two histories from the frozen evidence:

1. credentials truly stayed unchanged, as Work Helper reports; or
2. one or more secrets were replaced after the accepted live proof, and the new current credentials were scope-attested but never exercised by the accepted live proof.

That ambiguity matters because Manager's WR-046/WR-050 contract explicitly requires a repeated live B2/R2 proof if a credential was replaced/re-scoped. The prior proof may be inherited only when credential continuity is established.

### Required remediation for continuity

Manager may choose either evidence path:

A. Freeze provider/GitHub privacy-safe audit metadata that independently proves the relevant credential identifiers were unchanged across the historical live-proof time and the current scope-attestation time; **or**

B. Run the existing live B2/R2 custody proof once with the current scope-attested credentials, without changing the audited custody mechanics. A rerun would no longer be "solely for documentation"; it would establish the missing current-credential-to-live-capability binding.

Any live rerun must preserve secret masking and the existing exact fixture/digest/retention/lock requirements.

## Final-head custody workflow run

Run `34706149657`: workflow conclusion SUCCESS.

Independent job inspection shows:

- contract-preflight `103586441996`: SUCCESS;
- credential-scope job `103586470732`: SKIPPED;
- live B2/R2 proof `103586470942`: SKIPPED.

Thus this final-head run is valid syntax/preflight evidence for target head `81fbc857625a810522460661c7b63591c20714d7`, but it is not a new provider live proof and does not close the credential-continuity finding.

This is consistent with the Work Helper's stated intent not to rerun live custody when credentials were believed unchanged; the audit failure is the missing independent proof of that belief, not the fact that the job was skipped by itself.

## Ordinary War Room CI failure classification

Verdict: outside the WR-046 remediation surface; does not mask credential/custody evidence.

Run `34706149641` checked out the PR merge of exact target `81fbc857625a810522460661c7b63591c20714d7`. The extension engine completed `164/164` tests with `0` failures and `0` skipped. `npm test` later failed in browser persistence/sanitization validation at:

`assert.ok(normalizedPersistence.diag.includes('<img src=x onerror=alert(1)>'))`

The complete WR-046 remediation delta changes no `scripts/test-browser.mjs`, browser persistence implementation, sanitizer production code, extension engine code, or other browser lifecycle code. The failing assertion is therefore a real repository CI defect, but it is causally outside the six-file credential-scope remediation and occurs after the provider-scope evidence was produced in a separate dedicated workflow.

The ordinary CI RED does not make the provider evidence green, does not suppress a custody assertion, and does not provide authority to waive this audit's separate credential-lineage finding. It remains a separate Manager/browser-CI concern.

## WR039 / WR-D008 preservation

Verdict: PASS.

Current `WR-D008` still accepts `wr-returning-player-v2-evidence-contract/1.0.0` at exact audited WR-039 head `00a9e787e716d6697e6cd0d9252982a672abbbe0`, machine-lock SHA-256 `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`.

The controlling chronology remains:

exact source custody -> independent custody audit -> Manager-authorized model-protocol freeze -> later scoring/evaluation -> independent model-result audit -> later composition/audit.

WR-D008 still forbids model fitting/scoring/tuning/comparison/evaluation/ranking, target/outcome joins, production changes, 2026 regular-season outcome inspection, and Phase 6 at this stage. The WR-046 remediation delta changes none of `.ai/shared/DECISIONS.md`, `.ai/research/**`, WR039 contract files, admitted source classes/columns, or machine-lock semantics.

No source was admitted or parsed during this remediation. The only downloaded fixture remains the previously accepted lawful `jqlang/jq` release attestation fixture used to validate custody mechanics.

## Scope/boundary verdicts

- Source admission/parsing: NO.
- 2026 regular-season outcome inspection: NO.
- Model fitting/scoring/tuning/evaluation: NO.
- Ranking work: NO.
- Production/user-facing change: NO.
- `.ai/research/**` semantic change: NO.
- WR039 / WR-D008 semantic weakening: NO.
- Custody workflow/mechanics rewritten beyond credential-attestation support: NO.
- Unnecessary live fixture rerun: NO — both post-remediation runs skipped live custody. The problem is that unchanged-credential continuity is not independently frozen.

## Findings by severity

### CRITICAL

None.

### HIGH

#### WR-050-AUD-01 — Prior live-provider proof cannot be independently bound to the newly scope-attested current credentials

**Requirement**  
If credentials were unchanged, independent evidence must support carrying forward the prior live-provider proof. If any credential was replaced/re-scoped, the live proof must be repeated with the replacement credential.

**Evidence**  
Historical live job `103476377218` masks all credential values and publishes no privacy-safe credential identifier/hash/token ID. Current scope job `103581427069` publishes new privacy-safe current identifiers but intentionally skips live proof. Git-secret value history is not represented in repository history.

**Failure**  
The frozen audit evidence cannot independently compare the credential identities used at the historical live proof to the credential identities scope-attested now. The statement "No credential was changed" exists only in Work Helper-owned narrative, not independently checkable lineage evidence.

**Impact**  
The audit cannot prove that the credentials shown to be least-privileged are the credentials that successfully exercised the accepted B2/R2 custody lifecycle. A replaced-but-unexercised current credential is observationally indistinguishable from an unchanged one in the frozen record.

**Remediation**  
Either freeze authoritative privacy-safe credential-history/provider-audit metadata that closes the identity continuity interval, or run one live custody proof with the current scope-attested credentials under the unchanged custody mechanics.

**Validation needed**  
Fresh independent audit must compare privacy-safe credential identity across scope and live proof, then re-verify exact fixture digest/size, B2 COMPLIANCE/Legal Hold, R2 Indefinite Bucket Lock, retrieval equality, and secret masking if a live proof is used.

**Confidence**  
HIGH.

### MEDIUM

None.

### LOW

None.

## Manager authorization

Because the verdict is `FAIL — REMEDIATION REQUIRED`, Manager is **not** authorized to reactivate WR-042 exact-source custody and must not activate WR-043.

Manager may authorize only a bounded WR-046 lineage remediation for `WR-050-AUD-01`: either independently attest unchanged credential identity across the accepted historical live proof and current scope proof, or run one live custody proof using the current scope-attested credentials without changing custody semantics. Then route the resulting immutable evidence to a fresh independent re-audit.

No source admission, model fitting/scoring, 2026 outcome use, ranking change, production change, Phase 6 work, or direct WR-043 activation is authorized.
