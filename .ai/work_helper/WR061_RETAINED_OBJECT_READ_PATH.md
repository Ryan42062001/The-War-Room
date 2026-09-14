# WR-061 — GET-Only Retained-Object Read Path

Task: WR-061
Role: Work Helper / Super Troubleshooter
Assignment mode: DIAGNOSIS + REMEDIATION
Starting canonical SHA: `1ddf15b7e5f97e1857926bd9016a626e7fb3a702`
Branch: `wr-061-retained-object-read-path`
Audit required: WR-062

## Root cause

The accepted WR-042 and WR-046 protected jobs necessarily invoke code that can
create/overwrite objects and change retention or Legal Hold. Their credentials and
raw-custody conclusions remain accepted, but their execution surface cannot be used
for WR-059's reconstruction-only read authorization. No existing permanent workflow
provided a separately reviewable, non-mutating route from the four retained objects
to a no-provider-credentials consumer step.

## Remediation

WR-061 adds a separate path with these invariants:

1. The four 2013–2016 asset IDs, SHA-256 digests, byte sizes, buckets, and
   content-addressed keys are compiled into the reviewed retriever. There is no
   runtime object, URL, key, digest, size, prefix, bucket, or season input.
2. The retriever uses Backblaze v4 `b2_authorize_account` plus
   `b2_download_file_by_name`, and R2 `aws s3api get-object`, once per exact object.
   Every network request is GET-only. It neither imports nor invokes an existing
   custody helper.
3. Provider secrets exist only in the retrieval step environment. The AWS subprocess
   receives a minimal environment; stdout and provider stderr are not relayed.
4. Every B2 and R2 file is hashed and sized immediately after retrieval. A mismatch
   deletes all raw files and the report before exiting nonzero. B2/R2 byte equality
   is separately checked.
5. The following step proves all provider credential variables are absent and reads
   the verified runner-temporary inputs through the consumer boundary. This step
   performs no R&D parsing or source-evidence semantics.
6. An unconditional final step removes raw files and privacy-safe reports and proves
   their absence. The workflow has no artifact-upload action.

The existing mutation-capable workflows and scripts are unchanged.

## Exact allowlist

| Season | Asset ID | SHA-256 | Bytes |
|---|---:|---|---:|
| 2013 | 512983282 | `dbc7804c32c8dbf46120bfe4e724cdd926537509caa8a1bb96cd3b6e159b21f8` | 792070 |
| 2014 | 512985320 | `7046a0b75b845b3f70317a2c612eeaa3dad558895677525e64023cf49f867cd6` | 816553 |
| 2015 | 512984105 | `b977be3ec44102f766503b430fe1e158fed437e89c2d1857554aa85b0128e3eb` | 815021 |
| 2016 | 512985505 | `041473c2435ed408c4afab0661037dfcc9d2b830e922bd8fdb46fb3460c72424` | 819194 |

Every key is exactly `custody/sha256/<SHA-256>/raw`.

## Offline regression evidence

The focused suite proves mutated key/digest/size/asset and duplicate identities are
rejected; verification accepts only exact bytes; command construction is only
GET-only Backblaze requests and R2 `aws s3api get-object`; credentials are absent from command arguments; mutating
operations and old helpers are absent; provider failure cleans partial bytes; secrets
are step-scoped; no artifact upload exists; and cleanup is unconditional.

These all passed before publication:

```text
python3 scripts/custody/test_read_retained_objects.py
python3 scripts/custody/test_source_manifest_custody.py
python3 scripts/custody/prove_b2_r2_custody.py --self-test
npm run test:release
node scripts/workflow-state-check.mjs
```

The release guard accepted exactly four approved permanent workflows and rejected a
deliberately staged unapproved fifth workflow, which was then removed.

## First protected-path finding and remediation

Exact-head run `34889550688`, job `104128551088`, failed closed before any R2
request when the first implementation attempted B2 through its S3-compatibility
endpoint. Cleanup passed and no artifact was created. The credential is the accepted
Backblaze application key whose actual scope was established through Backblaze v4;
the transport was corrected to the provider-native GET-only sequence already proven
for that credential family: `b2_authorize_account` followed by
`b2_download_file_by_name`. No object identity, provider authority, custody semantic,
or R2 path changed. The failed run is preserved and is not rerun.

Native-v4 run `34889871310`, job `104129607200`, then failed closed after
authorization because the parser looked for the authorization token under
`apiInfo.storageApi`; Backblaze v4 places it at the response root. Cleanup passed and
no artifact or object download occurred. The field binding was corrected and locked
with a synthetic v4 response regression before another live attempt.

## Protected live-proof result

No successful four-object proof can be produced under the exact Manager-pinned
allowlist. Three materially distinct live attempts were fail-closed:

| Head | Run | Job | Result | Cleanup/artifact |
|---|---:|---:|---|---|
| `8c9bdcb95762ea0ee6ae18747f0ad7bde6fad18e` | 34889550688 | 104128551088 | B2 S3 compatibility GET failed | cleanup PASS; zero artifacts |
| `bfff2f5692f6d09ee6c63bb2a6674eecee7f5671` | 34889871310 | 104129607200 | native v4 token field binding failed before download | cleanup PASS; zero artifacts |
| `7ec951c1fcdfd93d34ff36c2e876477c35ead32b` | 34890179111 | 104130645764 | native B2 exact 2013 key returned HTTP 404 | cleanup PASS; zero artifacts |

The second failure was remediated and regression-locked. The third is provider-state
evidence, not a transient test failure, and was not retried.

## Canonical identity contradiction

The historical WR-042 accepted result at head
`614445a20c2c15fbc3d8c107644a5244ddb52076`, artifact
`.ai/research/generated/WR042_V2_SOURCE_CUSTODY_RESULT.json`, binds the actual
custodied keys below. WR-061 matches 2013 but pins different digests/keys for all
other required seasons:

| Season | WR-061 digest | WR-042 retained digest | Match |
|---|---|---|---|
| 2013 | `dbc7804c32c8dbf46120bfe4e724cdd926537509caa8a1bb96cd3b6e159b21f8` | same | YES, but B2 GET returned 404 |
| 2014 | `7046a0b75b845b3f70317a2c612eeaa3dad558895677525e64023cf49f867cd6` | `7046a0fd69b979d0649feb679a42f82f6e8e175d19587857d3e9371f09427cd6` | NO |
| 2015 | `b977be3ec44102f766503b430fe1e158fed437e89c2d1857554aa85b0128e3eb` | `b977be5bc8cad6b02dfb755e78974b4486a505fa272f683add499b968878e3eb` | NO |
| 2016 | `041473c2435ed408c4afab0661037dfcc9d2b830e922bd8fdb46fb3460c72424` | `041473e5860ca6cfcba7a29e98b2ddfc3f01db0df2469d5b44e44135603e2424` | NO |

Changing the compiled allowlist to the WR-042 identities would contradict the exact
WR-061 Manager authorization. Provider listing/version discovery and upstream
reacquisition are also outside the authorized GET/download-only contract. Therefore
the implementation cannot truthfully produce the required four-object proof without
a corrected Manager task/allowlist plus an explanation or remediation of the missing
2013 retained B2 name.

## Boundaries and remaining uncertainty

- No upstream GitHub/nflverse acquisition exists in this path.
- No Returning-Player data is committed or emitted.
- No raw byte is logged, committed, or uploaded as an Actions artifact.
- No credential, signed URL, authorization header, or provider error body is emitted.
- No 2026 outcome, model, scoring, ranking, production, or Phase-6 work occurred.
- WR-039 / WR-D008 and accepted WR-046 / WR-053 semantics are unchanged.

WR-059 remains blocked. WR-062 must not be activated against this failed live-proof
target. Manager must reconcile the exact four identities and retained B2 state first.

`SAFE PRE-AUDIT LIVE PROOF BLOCKED — CANONICAL IDENTITY / RETAINED-STATE RECONCILIATION REQUIRED`
