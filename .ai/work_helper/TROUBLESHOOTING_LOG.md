# Work Helper Troubleshooting Log

Purpose: durable, high-value institutional troubleshooting memory for The War Room.

Do not use this file as a command transcript or chat log.

Record only incidents/findings likely to prevent future wasted work, such as:
- significant symptoms and root causes;
- failed approaches worth avoiding;
- successful remediation patterns;
- CI/infrastructure quirks;
- cross-role dependency failures;
- evidence/provenance pitfalls;
- reusable diagnostic techniques.

For each durable entry prefer:
- Task / date;
- symptom;
- root cause or bounded conclusion;
- decisive evidence;
- approaches ruled out;
- remediation/pattern;
- future prevention/reuse note;
- checkpoint/artifact reference.

## Entries

### WR-046 / 2026-09-11 — exact-byte transport is not durable custody

- Symptom: WR-042 could identify release objects and provider digests but had no execution/storage path satisfying exact-byte acquisition plus project-controlled immutable primary and independently retrievable backup custody.
- Bounded conclusion: separate transport from custody. GitHub Actions can reproducibly acquire/hash exact bytes, but runner storage is transport only. Durable custody requires explicitly authorized stores plus independently auditable retention controls.
- Durable pattern: pin an immutable provider asset identifier plus expected digest/size; compute downloaded-byte identity before parse/use; use the same content-addressed key in two independently retrievable protected stores; retrieve both and recompute identity; verify retention/lock controls separately from object existence.
- Least-privilege lesson: object-data and storage-configuration APIs may require different authorization planes. R2 object transfer uses bucket-scoped Object Read & Write while Bucket Lock verification uses separate read-only configuration authority; B2 retention/Legal Hold needs explicit per-file capabilities. Do not add delete, governance bypass, configuration-write/admin, or broad listing merely for diagnostics.
- Evidence: PR #135; live proof run `34665473257` / job `103476377218`; current-credential live proof run `34723578709` / job `103633709551`.

### WR-046 / 2026-09-11 — nonexistent S3 HEAD can be ambiguous under tight credentials

- Symptom: an initial B2 `HeadObject` returned HTTP `403` for a content-addressed object not yet placed, despite the same tightly scoped credential later performing the exact immutable write successfully.
- Bounded conclusion: under least-privilege S3-compatible credentials, a missing-object probe can be represented as forbidden rather than clean not-found.
- Remediation pattern: for a deterministic content-addressed key whose bytes are already independently verified, allow an initial 403/404 existence probe to fall through to exact placement; then fail closed unless subsequent metadata/retention/Legal-Hold/readback/digest checks all succeed.
- Avoid: expanding privilege just to turn an ambiguous first-write HEAD into a listing-capable existence probe.
- Evidence: WR-046 capability recovery evidence and final successful B2/R2 proof.

### WR-046 / 2026-09-11 — copied credential whitespace can corrupt SigV4

- Symptom: R2 SigV4 failed even though credential policy was valid; sanitized diagnostics indicated hidden surrounding whitespace in the access-key ID.
- Root cause: copy/paste into protected secret storage preserved newline whitespace.
- Remediation pattern: normalize only surrounding whitespace for a fixed set of token-like credential/config environment variables inside the child-process environment; never print values, only privacy-safe field names/identity anchors.
- Future prevention: treat provider-dashboard copy controls and secret-entry forms as capable of preserving CR/LF whitespace.
- Evidence: successful WR-046 live proofs with secrets masked and `secrets_logged: false`.

### WR-046 / 2026-09-11 — branch-only Actions workflows need an explicit pre-merge trigger

- Symptom: `workflow_dispatch` existed but the WR-046 workflow was not visible in the Actions sidebar because the workflow file existed only on an unmerged task branch.
- Bounded conclusion: do not merge unaudited work merely to expose a manual dispatch button.
- Remediation pattern: use a tightly bounded branch/commit-marker trigger for protected live validation while ordinary branch/PR executions remain non-mutating/preflight-only.
- Future prevention: design pre-merge live-validation trigger semantics when the task is created instead of assuming default-branch workflow visibility.
- Evidence: marked live-proof executions on `wr-046-custody-capability-recovery`.

### WR-046 / 2026-09-12 — scope proof and live proof need a common privacy-safe credential identity

- Symptom: WR-050 independently accepted current least-privilege provider scopes but could not inherit the older live proof because the historical live job had masked credentials without emitting privacy-safe identity anchors.
- Root cause: current authorization scope and historical live capability were each proven, but no independently comparable credential identity joined the two evidence sets.
- Remediation pattern: in the same live provider job, first derive/verify non-reusable credential identity anchors, then perform the live capability proof with that same job environment. Preserve hashes/non-secret token IDs only; keep reusable secrets masked.
- Result: run `34723578709`, job `103633709551` bound the accepted B2 key-ID hash, R2 access-key-ID hash, and Cloudflare config-token ID to the successful B2/R2 proof. WR-053 independently returned PASS and closed WR-050-AUD-01.
- Future prevention: when later audits may need to establish credential continuity, freeze privacy-safe identity anchors during the first live proof rather than relying on statements that secrets were unchanged.

### WR-044 / 2026-09-11 — browser lifecycle and persistence isolation

- Symptom: unchanged documentation-only heads failed at different browser steps, including command settings detaching during `fill()` and a deleted/cleared storage key unexpectedly containing a valid autosave payload.
- Root causes: browser tests spanned intentional command-bar render generations; a long-lived stateful page lacked a boundary around the application's 400 ms debounced autosave queue.
- Durable pattern: for intentionally replaced DOM, settle/re-resolve/commit or focus/dispatch synchronously within one browser task across every test of that component. Before storage-destructive scenarios, drain both requestAnimationFrame and application-owned debounce queues; assert cleanup after the drain.
- Avoid: larger action timeouts, generic retries, immediate post-delete assumptions, or assuming a locator's earlier visibility applies to a replacement node.
- Evidence: `.ai/work_helper/WR-044_DIAGNOSIS.md`; PR #132.

### WR-048 / 2026-09-12 — assert lifecycle invariants at their linearization point

- Symptom: corrupt-storage recovery intermittently expected an active key to remain `null` but observed a newly generated valid version-2 payload.
- Root cause: corrupt recovery removed the old value correctly; later normal recommendation auditing scheduled the 400 ms autosave to the same logical key. Runner speed decided whether the assertion observed the recovery boundary or the legitimate successor.
- Durable pattern: distinguish object/value identity from key identity. Assert deletion/quarantine synchronously at the recovery linearization point; separately validate permitted future successor state after queues settle.
- Avoid: treating a reusable application key as permanently absent or adding more waiting to an assertion whose truth window ends when legitimate work completes.
- Evidence: `.ai/work_helper/WR-048_DIAGNOSIS.md`.
