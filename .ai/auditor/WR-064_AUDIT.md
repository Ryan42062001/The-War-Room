# WR-064 — Independent Audit of Retained-Version Read Recovery

Task: `WR-064`  
Role: Independent Auditor / QA  
Date: 2026-09-14  
Execution mode: `STANDARD_CHAT`  
Canonical workflow: `V3.2`

Audited task: `WR-063`  
Audited PR: `#178`  
Audited branch: `wr-063-retained-object-version-read-recovery`  
Exact frozen final target: `9db29b082cb61b5ef902b56bb5c745fc8ee739b2`  
Successful protected-proof implementation head: `b2c193cfc11811b32039d00480351ac4f5bc98a1`

Protected proof:

- run `34906157295`;
- preflight job `104183183462` — `PASS`;
- protected retained-version job `104183220181` — `PASS`.

Final-target validation:

- War Room CI `34906412868` — `SUCCESS`;
- WR-046 Custody Fixture Proof `34906412744` — `SUCCESS`.

## Final verdict

`PASS`

No CRITICAL, HIGH, MEDIUM, or LOW findings were identified.

This verdict is limited to the exact frozen WR-063 target above. It authorizes no merge by the Auditor and no downstream research/model/scoring work. Under the Manager task, a PASS-family verdict permits only Manager integration of exact audited head `9db29b082cb61b5ef902b56bb5c745fc8ee739b2`, followed by the mandatory canonical-main canary. WR-059 remains blocked until that canary is accepted.

## Full-refresh / target discipline

Canonical `main` was independently verified at `67b1347c715e207ea45f1de83effd7b69e59a2db`, with Workflow V3.2 canonical and WR-064 assigned to branch `wr-064-retained-object-version-read-audit` against PR #178 exact head `9db29b082cb61b5ef902b56bb5c745fc8ee739b2`.

Live PR #178 remained open and unmerged at the exact frozen head during the audit. The audit branch was untouched at the canonical assignment baseline before publication.

The protected proof ran on implementation head `b2c193cfc11811b32039d00480351ac4f5bc98a1`. I independently compared that head with final target `9db29b082cb61b5ef902b56bb5c745fc8ee739b2`: the final target is exactly one commit ahead, and that sole commit changes only:

- `.ai/work_helper/HANDOFF.md`;
- `.ai/work_helper/WR063_RETAINED_VERSION_READ_RECOVERY.md`.

No workflow, script, custody runtime, release validator, CI implementation, production, ranking, model, or research artifact changed after the successful protected proof.

## Authoritative four-object identity reconciliation

The executed WR-042 manifest at commit `cc9005ae4bd9065cf80f1c184f31974904165c54` is authoritative for the retained source identities. The four WR-063 hard-coded objects match it exactly:

| Season | Asset ID | Authoritative SHA-256 | Bytes | Exact custody key |
|---|---:|---|---:|---|
| 2013 | 512983282 | `dbc7804c32c8dbf46120bfe4e724cdd926537509caa8a1bb96cd3b6e159b21f8` | 792070 | `custody/sha256/dbc7804c32c8dbf46120bfe4e724cdd926537509caa8a1bb96cd3b6e159b21f8/raw` |
| 2014 | 512985320 | `7046a0fd69b979d0649feb679a42f82f6e8e175d19587857d3e9371f09427cd6` | 816553 | `custody/sha256/7046a0fd69b979d0649feb679a42f82f6e8e175d19587857d3e9371f09427cd6/raw` |
| 2015 | 512984105 | `b977be5bc8cad6b02dfb755e78974b4486a505fa272f683add499b968878e3eb` | 815021 | `custody/sha256/b977be5bc8cad6b02dfb755e78974b4486a505fa272f683add499b968878e3eb/raw` |
| 2016 | 512985505 | `041473e5860ca6cfcba7a29e98b2ddfc3f01db0df2469d5b44e44135603e2424` | 819194 | `custody/sha256/041473e5860ca6cfcba7a29e98b2ddfc3f01db0df2469d5b44e44135603e2424/raw` |

The historical incorrect WR-061 2014–2016 digests are explicitly placed in `REJECTED_WR061_DIGESTS` and the regression suite proves requests containing them are rejected:

- `7046a0b75b845b3f70317a2c612eeaa3dad558895677525e64023cf49f867cd6`;
- `b977be3ec44102f766503b430fe1e158fed437e89c2d1857554aa85b0128e3eb`;
- `041473c2435ed408c4afab0661037dfcc9d2b830e922bd8fdb46fb3460c72424`.

Verdict: **PASS**.

## Dedicated B2 credential / provider authority boundary

The protected job independently exposed privacy-safe provider-issued authorization metadata before retained-object access. It bound the dedicated credential to:

- bucket: `War-Room-Custody-Primary`;
- bucket ID: `ca47a42fe60b9e24a40f0e16`;
- exact name prefix: `custody/sha256/`;
- required capabilities: `listFiles`, `readFiles` — present;
- mutation-capable authority: absent.

The provider capability list contained read/list metadata capabilities and `shareFiles`, but no `write*`, `delete*`, or `bypassGovernance` capability. The implementation fails closed if any such mutation capability is returned. It also records only a SHA-256 identity anchor for the dedicated application-key ID, not the reusable key value.

The protected workflow uses `WR_CUSTODY_B2_READ_KEY_ID` and `WR_CUSTODY_B2_READ_APPLICATION_KEY`. It does not inject the shared mutation-capable `WR_CUSTODY_B2_KEY_ID` / `WR_CUSTODY_B2_APPLICATION_KEY`. The subsequent consumer-boundary step proves both dedicated and shared B2 credentials, along with the R2 provider credentials, are absent from consumer execution.

Verdict: **PASS**.

## Exact-key B2 version discovery and immutable retrieval

`b2_list_file_versions` is invoked once per object with both `prefix` and `startFileName` equal to the complete exact content-addressed custody key. The implementation rejects any returned record whose `fileName` differs from that exact key, rejects an absent retained version, and fails closed on an exact-key response that exceeds the bounded page condition it accepts.

Candidate selection considers only records with `action == "upload"`. The selected version must have an immutable `fileId`; size must match the authoritative byte size and, when provider metadata supplies a digest, that metadata digest must match the authoritative SHA-256. The downloaded bytes are then independently hashed and sized, so metadata absence cannot substitute for byte verification.

B2 source bytes are retrieved only with `b2_download_file_by_id` against the selected immutable file ID. No by-name B2 download is used as source authority.

Verdict: **PASS**.

## Four-object live-byte proof and B2/R2 equality

Protected job `104183220181` checked out exact proof head `b2c193cfc11811b32039d00480351ac4f5bc98a1` and returned one exact-name upload version for each authoritative object. The live privacy-safe evidence records:

| Season | Exact-name versions | Selected action | B2 immutable file-ID suffix | B2 identity | R2 identity | B2/R2 equal |
|---|---:|---|---|---|---|---|
| 2013 | 1 | upload | `...u01789404431144` | PASS | PASS | true |
| 2014 | 1 | upload | `...u01789404443541` | PASS | PASS | true |
| 2015 | 1 | upload | `...u01789404455665` | PASS | PASS | true |
| 2016 | 1 | upload | `...u01789404467880` | PASS | PASS | true |

For each season, B2 immutable-ID retrieval reproduced the authoritative SHA-256 and byte size. R2 `HeadObject` and exact-key `GetObject` reproduced the same authoritative SHA-256 and byte size. The implementation additionally compares the complete B2 and R2 byte payloads and fails closed on inequality.

No upstream provider is contacted by this read path; the hard-coded GitHub release `asset_id` values are identity metadata only. The executable provider path is retained B2 plus retained R2. No provider substitution or upstream source-byte reacquisition occurred.

Verdict: **PASS**.

## 2013 historical by-name HTTP 404 reconciliation

Historical WR-061 preserved only an HTTP 404 from a B2 by-name read. WR-063 does not invent the transport cause.

Provider-issued version metadata now proves that the exact authoritative 2013 custody key has one exact-name version, its latest action is `upload`, and its latest immutable file ID is the same version selected and successfully downloaded. Immutable-ID retrieval reproduces the authoritative 2013 SHA-256 and byte size.

This evidence legitimately rules out:

- retained upload absence;
- a current hide marker as the latest exact-name version;
- use of the wrong authoritative custody key.

The report correctly leaves the original transport cause as:

`UNDETERMINED_FROM_HISTORICAL_STATUS_ONLY`.

Verdict: **PASS**.

## Non-mutation boundary

Static inspection and the protected run agree on the reachable provider operation surface:

- B2: `b2_authorize_account`, `b2_list_file_versions`, `b2_download_file_by_id`;
- R2: `HeadObject`, `GetObject`.

Provider mutation operation count in the live report is `0`.

The implementation contains no upload/PUT/copy/delete/overwrite/tag/retention/Legal-Hold/Bucket-Lock mutation operation. Regression tests reject mutation-capable B2 authorization and statically reject relevant S3 mutation command strings. The WR-063 implementation/workflow neither modifies nor invokes the accepted mutation-capable custody helpers `prove_b2_r2_custody`, `ensure_b2_custody_object`, or `run_source_manifest_custody`.

PR #178 does not modify WR-042 or WR-046 custody workflows or the accepted custody helper implementations. Its CI change only adds the WR-063 fail-closed regression suite to Governance; its release-validator change only admits the new WR-063 workflow to the approved workflow list.

Verdict: **PASS**.

## Secrets, runner-temporary bytes, cleanup, and artifacts

The protected job masks the dedicated B2 and R2 secret values before execution; decoded logs show secret environment values as masked rather than reusable values. The consumer-boundary step verifies provider credentials are absent after the provider step.

Raw B2/R2 files are constrained to a child of `RUNNER_TEMP`. On verification mismatch, the relevant raw path is deleted. The main execution path removes the raw directory and report on exceptions; the workflow also has an `if: always()` cleanup step that removes raw bytes and privacy-safe reports on success or failure and asserts their absence.

Run `34906157295` has zero GitHub Actions artifacts. The WR-063 workflow contains no artifact-upload action. Live evidence reports `raw_output_published: false` and `raw_actions_artifacts: 0`.

Verdict: **PASS**.

## CI / regression evidence

Protected-run preflight job `104183183462` passed:

- Python compilation of WR-063 read path and regression suite;
- `WR-063 retained-version fail-closed regressions: PASS`;
- release-candidate repository guard;
- required AWS CLI presence.

Final frozen head `9db29b082cb61b5ef902b56bb5c745fc8ee739b2` is the exact head of War Room CI run `34906412868`, which completed `SUCCESS`. Its Governance job independently passed:

- workflow helper syntax/state/lane checks;
- accepted WR-056 trusted source-custody regressions;
- accepted B2/R2 custody proof self-test;
- WR-063 retained-version fail-closed regressions.

Its full test job also completed successfully.

WR-046 Custody Fixture Proof run `34906412744` is also bound to exact frozen head `9db29b...` and completed `SUCCESS`; its contract-preflight job passed while live provider jobs were intentionally skipped on the ordinary PR trigger. It is used only as final-target regression evidence, not as the WR-063 protected live-proof authority.

Verdict: **PASS**.

## Scope / outcome / production boundaries

The complete PR #178 delta from its starting base changes exactly seven authorized WR-063 files: two Work Helper evidence files, the WR-063 workflow, the WR-063 read implementation and regression suite, CI Governance wiring, and the release-candidate workflow allowlist.

It does not modify research datasets/evidence, production application code, ranking files, model/scoring code, target/outcome tables, or Phase-6 surfaces. The retained-object implementation itself performs no parsing/model operation and contacts no upstream source provider.

I found no evidence of:

- 2026 regular-season outcome inspection;
- target/outcome joins;
- model fitting, scoring, tuning, comparison, or evaluation;
- ranking/recommendation changes;
- production behavior changes;
- Phase-6 work.

Verdict: **PASS**.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

### LOW

None.

## Authorization boundary after this verdict

The only implementation target eligible for Manager action under this audit is exact WR-063 PR #178 head:

`9db29b082cb61b5ef902b56bb5c745fc8ee739b2`

Manager should re-verify that PR #178 still points to that exact audited head, integrate only that head if otherwise merge-ready, and then require the mandatory canonical-main post-merge canary. WR-059 remains blocked until Manager accepts that canary.

This PASS does not authorize the Auditor to merge PR #178, resume WR-059, activate WR-060 or other downstream work, inspect 2026 outcomes, perform model/scoring work, change rankings/production, or begin Phase 6.
