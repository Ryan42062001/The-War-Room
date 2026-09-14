# WR-063 — Retained-Object Identity Reconciliation + Version-Aware Read Recovery

## Status

`FAIL CLOSED — EXISTING B2 CREDENTIAL LACKS VERSION-LIST CAPABILITY`

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

## Protected execution evidence

- PR: #178.
- Executed implementation head: `15a35b3626929090b374eff5fdf4da4d0dfd32ce`.
- Protected workflow run/job: `34901593729` / `104168617065`.
- Contract preflight job: `104168574295` — PASS.
- Existing B2 credential authentication: PASS.
- Provider-issued capability gate: FAIL CLOSED before version listing because
  `listFiles` is absent.
- Existing accepted credential capabilities remain exactly:
  `listAllBucketNames`, `readFiles`, `writeFiles`, `readFileRetentions`,
  `writeFileRetentions`, `readFileLegalHolds`, `writeFileLegalHolds`.
- B2 exact-key version queries issued: 0.
- B2/R2 object downloads: 0 / 0.
- Provider mutation operations: 0.
- Cleanup: PASS.
- Raw Actions artifacts: 0.

The failure is not an object-identity result. No retained-version metadata was
available, so the 2013 by-name 404 remains unreconciled and no claim is made about
whether a hide marker exists. The correct bounded next decision belongs to the
Manager: either authorize a separately governed credential-scope change that adds
the Backblaze `listFiles` capability, or close the reconstruction path as
unprovable. WR-063 itself is not authorized to change credentials.

## Boundaries

No Returning-Player upstream reacquisition, research parsing, 2026 outcomes,
targets, models, scoring, ranking, production behavior, or Phase-6 work occurred.
