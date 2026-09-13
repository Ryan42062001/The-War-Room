# WR-057 — draft_picks.csv Rights / Retention Disposition

Task: `WR-057`  
Role: Research & Development (R&D)  
Date: 2026-09-13  
Source class: `NFLVERSE_DRAFT_CAPITAL_MINIMAL`  
Candidate asset: nflverse `draft_picks` release / `draft_picks.csv`  
Governance basis: WR-D008 and accepted WR-039 source-rights/evidence contract

## Recommendation

**`RAW_CUSTODY_NOT_ESTABLISHED — EXCLUDE_SOURCE`**

This is a research-governance recommendation, not legal advice and not a declaration that historical NFL draft facts are legally unusable. The current authoritative evidence does not establish the chain of rights required for War Room to retain the PFR-derived `draft_picks.csv` bytes as an independently auditable source for later predictive-model work.

The source must therefore remain excluded from source admission. WR-042 must not custody or parse `draft_picks.csv` on the strength of nflverse's repository license alone. If draft-capital features are later reconsidered, the schema/evidence contract must be versioned and independently reviewed rather than silently weakening WR-039.

## Question answered

WR-057 investigated whether War Room may, for the bounded Returning-Player v2 research purpose:

1. acquire one exact immutable nflverse `draft_picks` release asset;
2. retain its exact bytes in access-controlled project custody;
3. preserve attribution/license/provenance notices;
4. permit independent Auditor access to the retained reference bytes;
5. avoid public raw-data redistribution by default; and
6. derive and retain the already-approved minimal-column evidence for later predictive research.

**Disposition:** the currently available rights evidence does not establish all six permissions as one defensible chain for the intended downstream predictive-model purpose.

## Authoritative evidence

### VERIFIED FACT — nflverse repository license

Source: `https://github.com/nflverse/nflverse-data/blob/main/LICENSE.md`

The `nflverse-data` repository publishes a Creative Commons Attribution 4.0 International license. CC BY 4.0 grants reproduction, sharing, and adaptation rights over material to which the licensor can grant those rights, subject to attribution and related conditions.

Materially, the license also states that the licensor grants only rights it has authority to grant and that use can still be restricted because others hold copyright or other rights. The license instructs licensors to secure necessary rights and distinguish third-party material.

**Implication:** nflverse's CC BY 4.0 notice is strong evidence for nflverse-controlled rights, but it is not itself proof that every upstream PFR-derived right needed by War Room was sublicensed or otherwise cleared.

### VERIFIED FACT — nflverse itself preserves upstream-owner terms

Source: `https://github.com/nflverse/nflreadr`

The current nflreadr Terms of Use says its R code is MIT-licensed while NFL data accessed by the package belong to their respective owners and are governed by those owners' terms of use.

**Implication:** nflverse does not present the loader's open-source license as a blanket override of upstream data rights. WR-039's conservative upstream-rights caveat remains justified.

### VERIFIED FACT — draft_picks is identified as PFR-derived

Sources:

- `https://github.com/nflverse/nflreadr/blob/main/R/load_draft_picks.R`
- `https://github.com/nflverse/nflverse-data/releases/tag/draft_picks`

The loader documents the dataset as draft picks from / provided by Pro Football Reference. The current nflverse release says the draft-pick data are "courtesy of Pro Football Reference."

Current release identity observed during WR-057:

- release tag: `draft_picks`
- release id: `66254658`
- `draft_picks.csv` asset id: `552425724`
- provider digest: `sha256:6ec4a9b69ab16c6da5219554b8954f114b59e47bafb1cb6c476f672a5f25d02a`
- provider byte size: `1657482`
- asset updated: `2026-09-09T09:22:54Z`

These values are provider identity evidence only. WR-057 did not download, parse, admit, or custody the asset.

### VERIFIED FACT — Sports Reference permits some reuse but imposes express restrictions

Sources:

- `https://www.sports-reference.com/termsofuse.html`
- `https://www.sports-reference.com/data_use.html`

Sports Reference's current Site Terms say that sharing/reuse of data on individual pages is generally welcomed with attribution, but that use remains subject to the express restrictions in Section 5.

Section 5 expressly restricts use of Site material/content, including statistics and data, for training or instructing AI technologies and for supporting machine-learning methods used to predict, classify, label, or score inputs. The Data Use page separately states that users should not use Sports Reference data to train generative AI without permission and notes that some underlying data licenses can preclude redistribution.

Sports Reference also acknowledges on its Data Use page that facts are not copyrightable and may be reused in accordance with copyright law.

**Implication:** public factual status alone does not establish the contractual/provenance permission needed by this project's governance standard. The intended Returning-Player v2 use is predictive-model research, which materially overlaps the upstream restriction's machine-learning language.

## Evidence classification

| Classification | Finding |
|---|---|
| **VERIFIED FACT** | nflverse publishes `nflverse-data` under CC BY 4.0. |
| **VERIFIED FACT** | CC BY 4.0 grants only rights the licensor has authority to grant and does not extinguish third-party rights. |
| **VERIFIED FACT** | nflreadr says accessed NFL data belong to respective owners and remain governed by their terms. |
| **VERIFIED FACT** | nflverse labels `draft_picks` as PFR-provided / courtesy of Pro Football Reference. |
| **VERIFIED FACT** | Sports Reference's current Terms expressly restrict use of Site data for AI/ML prediction/classification/labeling/scoring. |
| **VERIFIED FACT** | Sports Reference says factual information may be reused in accordance with copyright law. |
| **STRONG EVIDENCE** | nflverse's CC BY grant and PFR provenance are insufficient, by themselves, to prove that War Room has the required upstream permission for the planned retained-byte + predictive-model chain. |
| **INFERENCE** | Keeping raw bytes private and access-controlled lowers redistribution risk but does not cure the intended downstream ML-use restriction. |
| **UNKNOWN** | Whether nflverse has separate written permission from Sports Reference covering downstream redistribution, private archival retention, auditor access, and predictive ML use. |
| **UNKNOWN** | Whether Sports Reference's site contract would bind a downstream recipient who acquires the data only from nflverse rather than accessing PFR directly. |
| **UNKNOWN** | Whether a legal exception concerning factual data would override or avoid any applicable contractual restriction in this exact downstream context. |

## Required-use matrix

| Proposed War Room act | WR-057 finding |
|---|---|
| Acquire exact nflverse release bytes | Public technical availability is verified; rights for the full intended use chain are **not established**. |
| Retain exact bytes in restricted project custody | **Not established** for this PFR-derived source under the current evidence. |
| Preserve attribution / license / provenance | Feasible and required, but attribution alone does not cure the upstream-rights gap. |
| Independent Auditor access to retained bytes | **Not established** as an upstream-permitted transfer/access right for this source. |
| No public raw redistribution | Required risk boundary, but insufficient by itself to establish permission for later ML use. |
| Derive approved minimal columns for predictive research | **Not established** because the intended predictive-model use materially intersects Sports Reference's express ML restriction. |

## Why this is EXCLUDE_SOURCE rather than RAW_CUSTODY_ALLOWED_WITH_CONDITIONS

`RAW_CUSTODY_ALLOWED_WITH_CONDITIONS` would require affirmative evidence sufficient to support the full bounded custody/auditor/derivation chain. That evidence is absent. The CC BY grant cannot safely be treated as proof of upstream rights because both the CC license itself and nflverse's own Terms preserve third-party rights limitations.

The upstream authority also contains an express restriction directly relevant to the intended later predictive use. Therefore R&D cannot responsibly recommend raw custody merely by adding attribution and a private-storage condition.

## Why this is EXCLUDE_SOURCE rather than UNRESOLVED — FAIL CLOSED

There are still legal unknowns, but the project does not need to resolve them to make a conservative research-governance decision. Under the accepted WR-039 fallback, failure to establish rights-compatible independently auditable retention is sufficient to exclude the draft-capital source class.

The recommendation does **not** assert that use is unlawful. It asserts that War Room has not established the permission required by its own frozen evidence standard, so the source should be excluded rather than held open indefinitely.

## Conditions for any future re-review

A future task may reconsider this source only with materially new authority, such as:

- written permission or license from Sports Reference / the applicable rightsholder expressly covering the relevant downstream dataset and predictive-model use;
- authoritative evidence that the nflverse `draft_picks` release is distributed under upstream rights that expressly include private raw retention, independent audit access, derived minimal-column retention, and predictive ML use; or
- a Manager-authorized alternative draft-data source with independently established rights, followed by the required source-contract/schema version bump and independent review.

A mutable provider URL, package availability, a repository-level open-source license, or the factual nature of individual draft facts is not enough by itself under WR-D008 / WR-039.

## Attribution obligations if a future source is ever admitted

Any later rights-compatible source instance should preserve, at minimum:

- nflverse as distributor/provider;
- exact release/tag/asset identity and canonical URL;
- applicable CC BY 4.0 notice where valid;
- Pro Football Reference / Sports Reference provenance where applicable;
- modification/minimization notice for derived extracts;
- acquisition/update timestamps and content digest;
- any additional upstream-required attribution or license text.

This section does not authorize admission now.

## WR-042 consequence

Manager may accept this WR-057 disposition as the rights decision for `draft_picks.csv`.

After acceptance:

- WR-042 must **not** acquire, custody, parse, or use `draft_picks.csv` under the existing source class;
- draft-capital features remain excluded;
- no silent replacement provider is allowed;
- any later schema/evidence contract that includes draft-capital features requires a new version and the normal independent governance gates;
- the accepted WR-056 custody runtime may be used only for source instances that otherwise satisfy their rights contract.

## Integrity / boundaries

- Returning-Player source downloaded during WR-057: **NO**
- Returning-Player source admitted/custodied during WR-057: **NO**
- `draft_picks.csv` parsed: **NO**
- 2026 regular-season outcomes inspected: **NO**
- Model fitting/scoring/tuning/comparison/evaluation: **NO**
- Outcome/target join: **NO**
- Rankings/recommendations/production changes: **NO**
- WR-039 / WR-D008 semantics modified: **NO**
- Phase-6 work: **NO**

## Recommended next gate

**Manager / Architect review and acceptance of `RAW_CUSTODY_NOT_ESTABLISHED — EXCLUDE_SOURCE`.**

WR-042 remains blocked until Manager accepts the disposition and routes the next custody attempt. WR-057 does not self-activate WR-042 or WR-043.
