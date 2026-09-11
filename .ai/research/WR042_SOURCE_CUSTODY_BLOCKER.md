# WR-042 — Returning-Player v2 Exact Source-Custody Freeze — Fail-Closed Blocker

Task: `WR-042`  
Role: Research & Development (R&D)  
Status: `BLOCKED — STALLED / ESCALATION REQUIRED`  
Execution: normal-chat fallback under Full Refresh  
Assignment main: `142a9580fb408cd78ddae1026a67dd82f7d7b144`  
Branch: `wr-042-v2-source-custody`  
Governing audited WR-039 head: `00a9e787e716d6697e6cd0d9252982a672abbbe0`  
Governing machine-lock SHA-256: `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`  
Production authorization: **NONE**

## Disposition

WR-042 **cannot honestly freeze an admitted Returning-Player v2 source snapshot in the currently available execution environment**.

The task therefore fails closed. No source object is marked `ADMITTED`; no source bytes were parsed; no cohort rows were constructed; no model fitting, scoring, comparison, evaluation, ranking, or target/outcome join occurred.

This is a custody-capability blocker, not evidence that the accepted WR-039 contract itself is invalid.

## Evidence classification

### VERIFIED FACT

- The Manager-created branch remained pinned to the exact assignment baseline before R&D writes.
- WR-D008 accepts the WR-039 prospective evidence contract and requires WR-042 exact source custody before any v2 scoring.
- The audited contract requires exact downloaded-byte identity, schema, row count, rights disposition, project-controlled immutable custody, and an independently retrievable second project-controlled copy where raw retention is allowed.
- Official nflverse release metadata identifies the provider objects recorded in `generated/WR042_SOURCE_SNAPSHOT_MANIFEST.json`.
- The provider currently reports `players.csv` as release ID `119143917`, asset ID `557244591`, SHA-256 `6f896e11cf4d85a6d5851d4f1de36781a08c365c56ce20d795288cedc6cdde44`, 7,289,388 bytes.
- The provider reports `draft_picks.csv` as release ID `111390246`, asset ID `465848369`, SHA-256 `e6a0d49a8a1bdd1c19bf672e42db48f22ffcf8ef918b06190c2f5a86790174e3`, 525,634 bytes.
- The current `stats_player` release metadata identifies the 2012–2025 regular/postseason CSV object names, provider-reported SHA-256 values, and sizes recorded in the machine manifest.
- The execution container cannot make the required direct external download; the GitHub connector exposes release metadata but not a raw release-asset byte stream suitable for custody; and the repository contains no preapproved access-controlled two-copy custody workflow/storage endpoint within WR-042's allowed research paths.
- WR-042 is forbidden from adding out-of-scope workflow/production infrastructure or weakening the audited contract.

### STRONG EVIDENCE

- The nflverse release tags are mutable pointers rather than sufficient immutable custody authority. Therefore even a correct provider-reported digest cannot replace a project-controlled retained copy and independent recomputation of the downloaded-byte digest.
- Committing restricted raw Players/Draft assets directly to this public repository would conflict with the accepted conservative rights/custody policy and would not satisfy the required independent access-controlled-copy design.

### UNKNOWN / NOT VERIFIED

Because raw bytes were not admitted:
- exact downloaded-byte digests were not recomputed;
- ordered schemas and schema hashes were not frozen;
- row counts were not frozen;
- parser-level approved-column existence was not verified;
- no complete no-outcome cohort/source-eligibility row set can be constructed without violating the required custody-before-parsing chronology.

## Three materially different acquisition approaches

1. **Direct container/network download** — failed because the execution container has no usable outbound DNS/network path for the release assets.
2. **Browser/web release-asset retrieval** — provider pages/redirect metadata were observable, but the raw release bytes were not delivered into an auditable local file/custody path.
3. **GitHub connector / repository-native workflow route** — release metadata were accessible, but the connector did not expose binary release-asset download. Existing repository CI does not provide an approved source-custody downloader/object-store path, and WR-042's scope does not authorize inventing `.github/**` or external-storage infrastructure.

Under the R&D anti-loop rule, further retries without a new capability would only repeat the same failure mode.

## Frozen blocker artifacts

- Machine source snapshot: `.ai/research/generated/WR042_SOURCE_SNAPSHOT_MANIFEST.json`
- Exact file hash: `98b9734a389d8fbd7f80c6ed0372e55efcd4ce4c82525c0fd0701b96dfcc7009`
- No-outcome cohort/source-eligibility manifest: `.ai/research/generated/WR042_COHORT_SOURCE_ELIGIBILITY_MANIFEST.json`
- Exact file hash: `8e438d1ac8a5e6d5382c9fe6b0b0053dad6cf4fa041f152bc2389d2cfe2b3188`
- Rights/custody matrix: `.ai/research/WR042_SOURCE_RIGHTS_CUSTODY_MATRIX.md`

The cohort manifest intentionally has zero rows and status `NOT_CONSTRUCTED_FAIL_CLOSED`. Inventing cohort rows from unretained mutable sources would violate the accepted chronology.

## Resolution needed

The Manager must provide or authorize, without weakening WR-D008/WR-039:

1. a download-capable execution path that can retrieve exact nflverse release-asset bytes;
2. an access-controlled project-controlled content-addressed immutable primary store;
3. a second independently retrievable project-controlled backup;
4. credentials/connector/tooling that allow R&D and later Auditor verification of both copies and their digests;
5. for Draft/Players, the required per-instance rights acceptance consistent with the accepted conservative matrix.

With those capabilities, WR-042 can be rerun from a clean Manager-approved checkpoint and can then freeze exact bytes, schemas, row counts, admissible columns, and the complete no-outcome cohort/source-eligibility manifest.

## Contract-version stop condition

Current disposition: **contract version bump not yet required**. The audited contract remains viable if the missing custody capabilities are supplied.

If the proposed remediation instead changes the accepted source classes/fields or weakens the custody/rights/independent-audit requirements, stop with:

`SOURCE CONTRACT VERSION BUMP REQUIRED`

and return to Manager before any source use.

## Integrity statement

2026 regular-season outcomes inspected: **NO**  
Model fitting performed: **NO**  
Model scoring performed: **NO**  
Model evaluation performed: **NO**  
Outcome/target join performed: **NO**  
Production code/rankings changed: **NO**  
WR-021 / WR-023 changed: **NO**  
WR-033 / WR-034 history rewritten: **NO**  
Phase-6 replacement/FLEX/MSV/value work performed: **NO**
