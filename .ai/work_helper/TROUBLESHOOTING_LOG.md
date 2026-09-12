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

**Symptom:** WR-042 could identify release objects and provider digests but had no execution/storage path that satisfied exact-byte acquisition plus project-controlled immutable primary and independently retrievable backup custody.

**Bounded conclusion:** Separate the problem into transport and custody layers. GitHub-hosted Actions can be a reproducible exact-byte acquisition/hash-verification runner even when the normal chat/container environment has no outbound network, but the runner and its temporary filesystem are transport only. Durable custody requires explicitly authorized access-controlled storage with independently auditable retention controls.

**Decisive evidence:** WR-046 fixture run `34642610497`, job `103405723000`, acquired public jq release asset ID `453012755`, reproduced SHA-256 `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed` and byte size `14380`, independently rechecked both, then removed the file without an Actions artifact.

**Approaches ruled out:**
- Do not treat a mutable provider URL or provider-reported digest alone as custody.
- Do not treat GitHub Actions artifacts as the durable primary or backup when the evidence contract forbids that authority role.
- Do not put rights-restricted raw data in The War Room's public Git repository.
- Do not reuse another project's private backend merely because it is technically accessible; project isolation is part of trustworthy custody.
- Do not call an ordinary object-store bucket immutable merely because the application promises not to overwrite it. Require native/equivalent retention evidence.

**Recovery pattern:** Pin an immutable provider asset identifier and expected digest/size, compute exact downloaded-byte identity before parse/use, then write the same content-addressed object to two independently retrievable protected stores. Immediately retrieve both copies and recompute identity. Verify storage-layer retention controls separately from object existence. Keep Actions/logs as execution evidence, never as sole custody.

**Least-privilege lesson:** Object-data and storage-configuration APIs may use different authorization planes. Cloudflare R2 bucket-scoped Object Read & Write credentials can handle S3 object transfer, but Bucket Lock configuration verification uses the Cloudflare REST API and therefore needs a separate account-resource **read-only** R2 configuration token. Split those credentials rather than broadening the routine object credential to administrative write access.

For Backblaze B2, verify object-level retention and Legal Hold using explicit per-file read/write retention capabilities. Do not grant delete or governance-bypass capabilities merely to make an integration convenient.

**Future prevention/reuse:** Provision and fixture-audit custody infrastructure before assigning source-admission work. Define exact secret names, non-secret resource metadata, retention verification calls, and provider permission scopes before source bytes are admitted.

**Checkpoint:** WR-046 draft PR `#135`; exact acquisition proof commit `61e31f6d9ce92fef6d56c5cabd08faa0217ca7f2`; Manager B2/R2 authorization integrated into WR-046 history at `0d6555e143b9aa8baf5333ef5add10fb3e31764f`. Live custody proof remains blocked only on protected GitHub Actions configuration.
