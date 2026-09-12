# WR-047 — Independent Audit of Source-Custody Capability Recovery

Task ID: WR-047  
Role: Independent Auditor / QA  
Audit mode: Full Refresh  
Canonical main / audit baseline: `68969e1435c69b72f5e9ac1599d95bf6f3716d09`  
Audit branch: `wr-047-custody-capability-audit`  
Audited PR: #135  
Immutable audited WR-046 final head: `64ba4aff697c1f45472045b52f374b01ee9e1695`  
Live-provider implementation/proof lineage: `4cade5204631f5f2875d664f862dcb4fa0a85200`  
Final verdict: `FAIL — REMEDIATION REQUIRED`

## Audit objective

Independently determine whether WR-046 recovered the execution/storage capability that blocked WR-042 strongly enough that Manager may safely authorize a bounded Returning-Player v2 exact-source custody re-attempt under WR-D008 and the accepted WR-039 evidence contract.

This is a capability/provenance/security audit. It is not source admission, model-performance review, production authorization, or browser-CI remediation.

## Immutable target and lineage

PR #135 remained open and unmerged during audit and identified exact head `64ba4aff697c1f45472045b52f374b01ee9e1695`.

The successful live custody proof executed at lineage head `4cade5204631f5f2875d664f862dcb4fa0a85200`.

Independent compare from `4cade5204631f5f2875d664f862dcb4fa0a85200` to final audited head `64ba4aff697c1f45472045b52f374b01ee9e1695` shows only three `.ai/work_helper/**` evidence/handoff files changed after the live proof:

- `.ai/work_helper/HANDOFF.md`
- `.ai/work_helper/TROUBLESHOOTING_LOG.md`
- `.ai/work_helper/WR046_CUSTODY_CAPABILITY_RECOVERY.md`

No custody script, custody workflow, release guard, production source, browser test, research artifact, or frozen model artifact changed after the successful live-provider execution.

## Exact live workflow evidence

Workflow: `WR-046 Custody Fixture Proof`  
Run: `34665473257` — SUCCESS  
Run head: `4cade5204631f5f2875d664f862dcb4fa0a85200`  
Preflight job: `103476355038` — SUCCESS  
Live B2/R2 proof job: `103476377218` — SUCCESS

The preflight job independently checked out exact lineage head `4cade5204631f5f2875d664f862dcb4fa0a85200`, compiled/self-tested the custody tooling, acquired the fixture by GitHub release asset ID, recomputed its SHA-256 and byte size, shell-checked the same digest/size again, deleted the runner-local copy, and uploaded no Actions artifact.

The live provider job independently checked out the same exact lineage head, reacquired the exact fixture, used the project custody credentials, read/proved B2 retention and Legal Hold, read/proved R2 Bucket Lock configuration, independently downloaded both custody copies, recomputed their SHA-256 and size, compared all three identities, emitted only privacy-safe metadata, then removed the runner-local fixture/report.

Final audited head `64ba4aff697c1f45472045b52f374b01ee9e1695` also received exact-head `WR-046 Custody Fixture Proof` preflight success (`34665599875`; preflight `103476720468`). Its live provider job was intentionally skipped because the final documentation commit did not carry the explicit `[wr046-live-proof]` trigger. The 4cade-to-64ba comparison proves the live implementation/workflow remained unchanged.

## Fixture identity and exact acquisition

Expected fixture:

- provider/repository: `jqlang/jq`
- release asset: `jq-attestation.json`
- immutable asset ID: `453012755`
- expected SHA-256: `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`
- expected byte size: `14380`

Independent provider metadata from GitHub's release-asset API for asset ID `453012755` identifies `jq-attestation.json`, size `14380`, and digest `sha256:01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`.

`scripts/custody/acquire_github_release_asset.py` acquires from the immutable GitHub API asset endpoint keyed by repository plus numeric asset ID, streams exact response bytes before parsing, computes SHA-256 and byte count during acquisition, deletes the output on mismatch, and fails closed.

The workflow additionally performs independent `sha256sum` and `stat` equality checks in preflight.

**Exact-byte acquisition verdict: PASS.** The proof does not depend on a mutable browser-download URL or provider-reported digest alone.

## Content-addressed object identity

Both provider objects use:

`custody/sha256/01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed/raw`

The expected SHA is also persisted as provider object metadata and is checked before retrieval identity is accepted.

**Content-addressed identity verdict: PASS.** The object key is deterministically derived from the independently recomputed SHA-256.

## Backblaze B2 primary custody

Observed live proof metadata:

- provider: Backblaze B2
- bucket: `War-Room-Custody-Primary`
- S3 endpoint: `https://s3.us-east-005.backblazeb2.com`
- region: `us-east-005`
- object key: exact SHA-addressed custody key
- nonempty provider version ID
- retrieved size: `14380`
- retrieved SHA-256: exact expected digest

The proof implementation requires a Backblaze S3 endpoint, directly reads object metadata/retention/Legal Hold, directly downloads the object, and recomputes identity. It is not validating an Actions artifact or alias record.

**B2 primary custody verdict: PASS.** The live proof establishes a genuine project-controlled Backblaze object store as primary custody for the lawful fixture.

## B2 retention and Legal Hold

Live provider proof observed:

- retention mode: `COMPLIANCE`
- retain-until: `2034-11-29T01:38:02Z`
- Legal Hold: `ON`

The proof code reads these settings from B2's S3-compatible retention/Legal-Hold operations and fails unless COMPLIANCE is present, retention exceeds the required minimum proof horizon, and Legal Hold is ON.

Backblaze's official current documentation confirms that Compliance-mode retention cannot be shortened/removed by users and that B2 application keys expose distinct file-retention and file-Legal-Hold capabilities. It also confirms the S3-Compatible API requires application keys rather than the master application key.

**B2 retention/Legal Hold verdict: PASS.** The observed storage-layer controls are genuine provider state, not local metadata assertions.

## B2 retrieval/digest

The live proof downloaded the B2 object into a fresh temporary path and independently recomputed:

- byte size `14380`
- SHA-256 `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`

**B2 retrieval verdict: PASS.** The primary copy is independently retrievable and byte-identical to the acquired fixture.

## Cloudflare R2 independent backup

Observed live proof metadata:

- provider: Cloudflare R2
- bucket: `war-room-custody-backup`
- endpoint: `https://92072206f9390ec66202709c85fe27fd.r2.cloudflarestorage.com`
- jurisdiction: `default`
- object key: same SHA-addressed custody key
- retrieved size: `14380`
- retrieved SHA-256: exact expected digest

The proof uses a Cloudflare R2 S3 endpoint for object operations and a separate Cloudflare REST configuration endpoint to read bucket-lock rules.

**R2 independent-backup verdict: PASS.** R2 is a distinct storage provider and distinct authority from both GitHub release transport and Backblaze primary custody.

## R2 indefinite lock

The live proof read an enabled R2 Bucket Lock rule with:

- rule ID: `my-rule`
- condition: `Indefinite`
- prefix: empty string

The proof validates that the enabled rule prefix covers the exact custody key both before and after object handling. Cloudflare's official Bucket Lock documentation confirms that `Indefinite` prevents deletion/overwriting until the lock is explicitly removed, and a rule with no/empty prefix applies to all objects in the bucket.

**R2 indefinite-lock verdict: PASS.** The custody object is covered by a genuine bucket-wide indefinite R2 lock.

## R2 retrieval/digest

The live proof downloaded the R2 object independently and recomputed:

- byte size `14380`
- SHA-256 `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed`

**R2 retrieval verdict: PASS.** The backup copy is independently retrievable and byte-identical to the acquired fixture.

## Cross-provider identity

The privacy-safe live report states and the implementation independently enforces:

- `all_three_sha256_equal: true`
- `all_three_byte_sizes_equal: true`

The original was acquired from GitHub release asset ID `453012755`; primary retrieval came from Backblaze B2; backup retrieval came from Cloudflare R2. These are separate providers/endpoints and are not references to one mutable object authority.

**Original/B2/R2 identity verdict: PASS.** Exact-byte equality is proven across three independently addressed authorities.

## GitHub Actions artifact / mutable URL authority

The custody workflow contains no `upload-artifact` step for the fixture or proof report. Run `34665473257` has no workflow artifacts. The runner-local fixture/report is explicitly deleted after use.

The source URL is transport only; the source object is pinned by numeric release asset ID plus digest/size and durable authority is B2/R2.

**Durable-authority verdict: PASS.** GitHub Actions artifacts and mutable provider URLs are not treated as custody authority.

## Secret/privacy review

The live job exposes five credential environment variables only through GitHub Actions secrets:

- `WR_CUSTODY_B2_KEY_ID`
- `WR_CUSTODY_B2_APPLICATION_KEY`
- `WR_CUSTODY_R2_ACCESS_KEY_ID`
- `WR_CUSTODY_R2_SECRET_ACCESS_KEY`
- `WR_CUSTODY_R2_CONFIG_READ_TOKEN`

Raw job logs display all five values as `***`. The normalization wrapper reports only the environment-variable name whose surrounding whitespace was stripped; it does not print credential values. The proof script sanitizes secret values from command errors and excludes credentials from its JSON report.

PR #135 changed-file review found no committed secret value and no protected Returning-Player raw source bytes.

**Secret/privacy verdict: PASS.** No credential/token value or protected source payload was observed in repository content or audited live logs.

## Credential architecture and master/root boundary

The implementation uses only:

- Backblaze application-key ID/application-key pair for S3-compatible object/retention operations;
- Cloudflare R2 S3 access-key/secret pair for object transfer;
- a separate Cloudflare Bearer token only for reading Bucket Lock configuration.

No master/root credential interface appears in the workflow or scripts. Backblaze's current official documentation states that the master application key is not supported by its S3-Compatible API, while the audited live B2 operations succeeded through that API.

**No-master/root verdict: PASS.** The proof did not require a Backblaze master key, Cloudflare global key/root credential, GitHub elevated token, or provider-account administration action at runtime.

However, the audit cannot independently establish the *complete current provider-side permission envelope* attached to the actual stored B2 and R2 secrets. The workflow proves the permissions it exercised, while Work Helper/Manager evidence asserts the intended permission set, but no provider-issued privacy-safe authorization metadata is frozen for the exact secrets.

Specifically absent from the audited evidence are:

- Backblaze authorization metadata showing the actual application's current allowed bucket(s), exact capability set, and `namePrefix` for `WR_CUSTODY_B2_KEY_ID`; and
- Cloudflare current token-policy metadata showing the actual R2 object token's resource scope / permission group and the separate Bucket Lock token's resource scope / read-only permission group.

Backblaze's official documentation states that `b2_authorize_account` returns an `allowed` structure containing bucket restrictions, capabilities, and name prefix. Cloudflare's official token model stores token policies as permission groups plus resources, and R2 documentation distinguishes bucket-scoped Object Read & Write from account-level configuration permissions.

Because successful narrow operations do not prove absence of additional permissions, the exact least-privilege claim remains unverified.

**Credential-scope verdict: FAIL — REMEDIATION REQUIRED.** Runtime credential *use* is narrow, but actual provider-side scope is not independently evidenced strongly enough for this gate.

## WR-039 / WR-D008 preservation

PR #135 changed exactly nine files, confined to Work Helper evidence, the WR-046 custody workflow, custody scripts, and the release-candidate workflow allowlist. It does not modify `.ai/research/**`, the accepted WR-039 contract, WR-D008, WR-021/WR-023, football-model frozen artifacts, ranking/model production code, or source-class semantics.

The capability workflow uses only the lawful `jqlang/jq` fixture and explicitly marks `returning_player_v2_source_used: false`.

**Contract-preservation verdict: PASS.** No source class was admitted, no contract version was silently expanded, and WR-D008 chronology remains intact.

## No-source / no-model / no-production boundary

Independent changed-file and workflow review found:

- actual Returning-Player v2 source admitted or parsed: NO
- 2026 regular-season outcomes inspected: NO
- model fitting: NO
- model scoring: NO
- model tuning/comparison/evaluation: NO
- ranking changes: NO
- production/user-facing behavior changed: NO
- Phase-6 work: NO

**Boundary verdict: PASS.** WR-046 remained capability-only.

## Browser-CI separation

PR #135 changes no browser-test script and no production/browser lifecycle code. Its only pre-existing release validator change adds the new custody workflow to the repository workflow allowlist.

Exact final target head has a RED War Room CI run `34665599880`. Independent raw-log review shows the failure is the separately tracked persistence/state-isolation symptom: `test:browser` found persisted draft state where the assertion required `null`, after release/module/syntax/dataset/extension checks passed. This is the WR-048 lane, not a custody-proof dependency.

The custody workflow's exact-head preflight is independently green, and the successful live proof is independent of Playwright/browser state.

**Browser separation verdict: PASS.** The unrelated WR-048 residual does not block WR-047 by itself and WR-046 did not alter browser-test behavior to manufacture separation.

## Findings

### WR-047-AUD-01 — HIGH — Actual least-privilege credential scopes are asserted but not independently attested

**Requirement**  
WR-047 must independently verify that custody credentials are least privilege. Passing provider operations is insufficient if the actual stored credentials could silently carry broader bucket, object, deletion, governance/configuration, or account authority than the documented contract.

**Evidence**  
The live workflow uses a narrow operation set and all secret values remain masked. Work Helper/Manager evidence documents the intended B2 capability set, `custody/` prefix, dedicated bucket, bucket-scoped R2 Object Read & Write token, and separate `Workers R2 Storage Read` configuration token. However, neither run `34665473257`, final-head preflight, repository evidence, nor provider-generated privacy-safe receipt records the actual current policy/capability envelope for the exact configured secrets. Successful reads/writes/retention calls prove required permissions are present; they do not prove forbidden/additional permissions are absent.

**Failure**  
The audit cannot independently prove that `WR_CUSTODY_B2_KEY_ID` is actually restricted to the intended B2 bucket / `custody/` prefix / exact capability set, nor that the actual Cloudflare object/config tokens are restricted to the documented R2 bucket/read-only configuration policy without additional write/admin scope.

**Impact**  
A hidden broader B2 key would violate the least-privilege custody architecture. More importantly, a Cloudflare configuration token with write/admin authority could alter/remove the R2 Bucket Lock even though the proof script itself only performs GET, weakening the claimed independent immutable-backup control if that secret were compromised. Because a WR-047 PASS-family verdict would authorize a real source-custody re-attempt, this evidence gap must be resolved before protected source bytes are entrusted to the capability.

**Remediation**  
Produce privacy-safe provider-issued scope evidence for the exact configured credentials without exposing any secret value. At minimum:

1. B2: capture current authorization metadata for the exact application key showing allowed bucket identity, exact capabilities, and `namePrefix`; fail if broader than the approved custody contract. A provider API such as `b2_authorize_account` can expose the non-secret `allowed` structure.
2. Cloudflare R2 object credential: capture current token/access policy showing the exact custody bucket resource and Object Read & Write / bucket-item permission group, with no account configuration-write/admin policy.
3. Cloudflare Bucket Lock configuration token: capture current token policy showing only the approved read-only R2 configuration permission/resource envelope, with no R2 configuration write/admin permission.
4. Sanitize/freeze only non-secret identifiers, resources, permission-group names/IDs, active status, and scope-match booleans. Do not log or commit token values.
5. Re-run the bounded live proof only if credential replacement or policy changes are required; otherwise an immutable provider-scope attestation plus unchanged live-proof lineage is sufficient for re-audit.

**Validation needed**  
Independent auditor must compare provider-issued current scope metadata to the Manager-approved permission contract and verify no broader permission/resource is attached to the exact live credentials. If permissions are remediated/replaced, repeat B2/R2 live retrieval/lock proof with the new credentials.

**Confidence**  
HIGH.

## Findings by severity

- CRITICAL: none
- HIGH: `WR-047-AUD-01` — actual provider-side least-privilege scope is not independently evidenced
- MEDIUM: none
- LOW: none

## Final verdict

`FAIL — REMEDIATION REQUIRED`

The byte-custody implementation itself is substantially successful: exact provider bytes, deterministic digest/size, content-addressed identity, genuine Backblaze COMPLIANCE + Legal Hold primary retention, genuine Cloudflare indefinite bucket-wide backup lock, independent two-provider retrieval, cross-copy equality, secret masking, contract preservation, and capability-only scope all pass.

The remaining blocker is narrower but gate-critical: the exact live credential permission envelopes must be independently proven rather than accepted from self-report.

## Manager action authorized next

Manager must **not** authorize a Returning-Player v2 exact-source custody re-attempt yet and must not activate WR-043.

Manager may authorize only a bounded WR-046 credential-scope evidence remediation that:

- does not admit/parse an actual Returning-Player source;
- does not inspect 2026 regular-season outcomes;
- does not fit/score/tune/compare/evaluate/rank;
- does not change production behavior;
- does not weaken WR-039 / WR-D008;
- captures privacy-safe provider-issued current permission/resource evidence for the exact B2/R2 credentials;
- repeats the live provider proof only if credentials/policies are changed.

After that bounded remediation, Manager should issue a fresh independent re-audit target. A later PASS-family verdict may authorize only Manager to issue the bounded R&D exact-source custody re-attempt; it would still not admit a source, activate WR-043, or authorize model scoring/2026 outcomes/production ranking changes.

Auditor modified PR #135: NO  
Auditor merged PR #135: NO  
Auditor changed production files: NO  
Auditor changed canonical `.ai/shared/**`: NO  
Auditor changed `.ai/research/**`: NO
