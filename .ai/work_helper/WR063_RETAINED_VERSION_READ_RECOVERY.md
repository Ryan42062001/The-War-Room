# WR-063 — Retained-Object Identity Reconciliation + Version-Aware Read Recovery

## Status

`COMPLETE — INDEPENDENT AUDIT REQUIRED`

## Root cause and remediation

WR-061 combined incorrect Manager pins for 2014–2016 with a 2013 B2 by-name
HTTP 404. WR-063 uses the authoritative executed WR-042 identities and a dedicated
read-only B2 credential. It attests the provider boundary before any object
operation, issues one exact-full-key-bounded `b2_list_file_versions` call per
object, requires exact file-name equality, and downloads the upload by immutable
file ID. R2 remains exact-key `HeadObject` plus `GetObject`.

The historical 2013 response retained only HTTP 404, so its transport-level cause
cannot now be proven. Provider metadata proves the authoritative upload was the
sole and latest exact-name version, uploaded at `1789404431144` before the WR-061
failure at `2026-09-14T19:59:39.8902883Z`; immutable-ID retrieval reproduces its
authoritative bytes. The 404 is therefore reconciled as a false-negative for
retained-version existence. Missing upload, a current hide marker, and an
incorrect custody key are ruled out; no unobserved cause is asserted.

## Provider boundary

- Bucket `War-Room-Custody-Primary`: PASS.
- Prefix `custody/sha256/`: PASS.
- `listFiles` and `readFiles`: present.
- Mutation-capable capabilities: absent.
- Shared mutation-capable B2 credentials: absent.
- Dedicated key identity anchor SHA-256:
  `8d5e5657e1a3010c341318237ca91d86153d4ed4dd4161a6bd38677c578c14dc`.

Provider read-only metadata capabilities and `shareFiles` are also present; none
can mutate the governed state. The gate rejects every `write*`, `delete*`, and
`bypassGovernance` capability before listing or download.

## Protected proof

Implementation head: `b2c193cfc11811b32039d00480351ac4f5bc98a1`

Run `34906157295`; preflight job `104183183462`; protected job `104183220181`.
All completed successfully.

| Season | B2 immutable ID suffix | SHA-256 | Bytes | Versions | B2 | R2 | Equal |
|---|---|---|---:|---:|---|---|---|
| 2013 | `4_zca47a42fe60b9e24a40f0e16_f1073038c409e28f4_d20260914_m164711_c005_v0501047_t0010_u01789404431144` | `dbc7804c32c8dbf46120bfe4e724cdd926537509caa8a1bb96cd3b6e159b21f8` | 792070 | 1 upload | PASS | PASS | PASS |
| 2014 | `4_zca47a42fe60b9e24a40f0e16_f1197eb704ed62208_d20260914_m164723_c005_v0501015_t0046_u01789404443541` | `7046a0fd69b979d0649feb679a42f82f6e8e175d19587857d3e9371f09427cd6` | 816553 | 1 upload | PASS | PASS | PASS |
| 2015 | `4_zca47a42fe60b9e24a40f0e16_f104f9e9e97823443_d20260914_m164735_c005_v0501050_t0002_u01789404455665` | `b977be5bc8cad6b02dfb755e78974b4486a505fa272f683add499b968878e3eb` | 815021 | 1 upload | PASS | PASS | PASS |
| 2016 | `4_zca47a42fe60b9e24a40f0e16_f10725166a5a4cb1e_d20260914_m164747_c005_v0501050_t0022_u01789404467880` | `041473e5860ca6cfcba7a29e98b2ddfc3f01db0df2469d5b44e44135603e2424` | 819194 | 1 upload | PASS | PASS | PASS |

Provider operations were limited to B2 authorization, exact-key version listing,
immutable-ID GET, and R2 HEAD/GET. Mutation count: 0. Consumer credentials: absent.
Cleanup: PASS. Raw Actions artifacts: 0.

## Regression and boundaries

Focused fail-closed tests and the release guard pass. Coverage includes exact
identities and names, mutation/wrong-prefix/insufficient-capability rejection,
immutable selection, mismatch deletion, R2 HEAD/GET limitation, consumer
isolation, and cleanup. No upstream reacquisition, Returning-Player parsing, 2026
outcomes, targets, models, scoring, rankings, production behavior, or Phase-6
work occurred.

## Remaining uncertainty

Only the original transport-level reason for the historical by-name 404 is
unrecoverable from the preserved status-only evidence. It is not needed to prove
the retained bytes or version-aware recovery path and is not represented as a
provider hide event.
