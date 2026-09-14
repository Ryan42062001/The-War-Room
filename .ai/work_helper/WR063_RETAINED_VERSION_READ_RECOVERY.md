# WR-063 — Retained-Object Identity Reconciliation + Version-Aware Read Recovery

## Status

Implementation complete; protected provider proof pending.

## Root cause and remediation design

WR-061 combined two independent failures. Its 2014–2016 identities differed from
the authoritative executed WR-042 manifest/result, while its 2013 read addressed
only the current by-name view. Backblaze documents that a by-name download returns
the newest version and returns 404 when that version is hidden; a retained upload
version can instead be resolved with `b2_list_file_versions` and downloaded by its
immutable file ID.

WR-063 therefore hard-codes the four authoritative WR-042 identities, authorizes
the existing least-privilege B2 key, executes one exact-full-key-bounded version
query per identity, filters to exact file-name equality, and downloads only a
matching `upload` version by immutable file ID. R2 remains exact-key `HeadObject`
plus `GetObject`. Every download is hashed and sized before consumer access.

The protected proof fails closed unless provider-issued version metadata directly
reconciles the earlier 2013 by-name 404. No hide state is presumed.

## Security construction

- Fixed four-row identity set; no runtime bucket/key/URL selectors.
- B2 operations: authorize, exact-key version metadata read, immutable-version GET.
- R2 operations: exact-key HEAD and GET.
- No mutation-capable custody helper is imported or invoked.
- Credentials exist only on the trusted retrieval step.
- Raw bytes and privacy-safe report exist only below `RUNNER_TEMP` and are removed
  on success or failure.
- No artifact-upload action exists; raw artifact count is structurally zero.
- Mismatched downloads are deleted immediately.

## Offline regression evidence

- authoritative four-row identity equality: PASS;
- rejected WR-061 2014–2016 identities: PASS;
- exact-full-key version-query boundary: PASS;
- non-exact version-name rejection: PASS;
- hide record excluded as source bytes: PASS;
- immutable-version digest/size gate: PASS;
- R2 operation set limited to HEAD/GET: PASS;
- mutation helper/operation absence: PASS;
- consumer secret isolation: PASS;
- cleanup on failure: PASS;
- permanent-workflow release guard: PASS;
- staged unapproved workflow rejection: PASS.

## Live proof evidence

Pending exact-head protected execution. This section will be frozen with run/job
IDs and privacy-safe per-season version/digest/size results after execution.

## Boundaries

No Returning-Player upstream reacquisition, research parsing, 2026 outcomes,
targets, models, scoring, ranking, production behavior, or Phase-6 work occurred.
