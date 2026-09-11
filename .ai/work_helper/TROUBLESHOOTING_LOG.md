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

**Bounded conclusion:** Separate the problem into two layers. GitHub-hosted Actions can be a reproducible exact-byte acquisition/hash-verification runner even when the normal chat/container environment has no outbound network, but the runner and its temporary filesystem are transport only. Durable custody still requires an explicitly authorized access-controlled backend with retention/immutability semantics.

**Decisive evidence:** WR-046 fixture run `34642610497`, job `103405723000`, acquired public jq release asset ID `453012755`, reproduced SHA-256 `01e9619236573939473c0f2eb2c5c38dc0f066fbdc89a5357a6f3f2954e00eed` and byte size `14380`, independently rechecked both, then removed the file without an Actions artifact.

**Approaches ruled out:**
- Do not treat a mutable provider URL or provider-reported digest alone as custody.
- Do not treat GitHub Actions artifacts as the durable primary or backup when the evidence contract forbids that authority role.
- Do not put rights-restricted raw data in The War Room's public Git repository.
- Do not reuse another project's private backend/repository merely because it is technically accessible; project isolation is part of trustworthy custody.
- Do not call an ordinary object-store bucket immutable merely because the application promises not to overwrite it. Prefer native version-retention/Object-Lock controls when the contract requires independently auditable overwrite protection.

**Recovery pattern:** Use an acquisition runner that pins an immutable provider asset identifier and expected digest/size, computes downloaded-byte identity before parse/use, then writes content-addressed copies to two independently retrievable protected stores. Authenticate cloud storage with short-lived federated credentials (for example GitHub OIDC) rather than committed/static access keys. Immediately re-download both copies and recompute identity; schedule periodic and pre-audit verification.

**Future prevention/reuse:** Provision custody infrastructure before assigning a source-admission R&D task whose contract requires retained raw bytes. Verify the backend itself with a lawful fixture and independent audit first; only then allow R&D to admit research sources.

**Checkpoint:** WR-046 draft PR `#135`; fixture transport proof commit `61e31f6d9ce92fef6d56c5cabd08faa0217ca7f2`. Full custody remains blocked on explicit backend authorization.
