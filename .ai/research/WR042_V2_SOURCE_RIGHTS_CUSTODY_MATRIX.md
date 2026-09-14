# WR-042 Returning-Player v2 Source Rights and Custody Matrix

| Source family | Instances | Rights disposition | Retention disposition | Custody result | Permitted next use |
|---|---:|---|---|---|---|
| nflverse player summary statistics, 2012–2025 | 14 exact annual CSV assets | `RAW_CUSTODY_ALLOWED_WITH_ATTRIBUTION` | Exact raw bytes retained in B2 and R2 under accepted immutable controls | PASS for all 14 | Independent source-custody audit only; later use remains subject to the frozen prospective contract |
| nflverse players metadata | 1 exact `players.csv` asset (`563580371`) | `RAW_CUSTODY_ALLOWED_WITH_ATTRIBUTION_AND_MINIMIZATION` | Exact raw bytes retained in B2 and R2; downstream derived retention must remain minimized | PASS | Independent source-custody audit; no feature/model admission yet |
| nflverse/PFR-derived `draft_picks.csv` | 0 | `RAW_CUSTODY_NOT_ESTABLISHED — EXCLUDE_SOURCE` under accepted WR-057 | Prohibited | NOT ACQUIRED | None; later Manager-controlled contract/schema gate required |

## Common source authority

- Provider/repository: `nflverse/nflverse-data` GitHub release assets.
- License/rights evidence: frozen WR-039 contract and rights matrix, plus accepted WR-057 disposition for the excluded draft source.
- Attribution obligation remains in force.
- Provider URLs and releases are mutable discovery surfaces, not custody authority.
- Exact asset ID, SHA-256, byte size, manifest SHA-256, and two-provider immutable custody form the evidence identity.

## Point-in-time and maintenance limits

- This snapshot proves the exact bytes acquired on 2026-09-14; it does not claim a mutable provider URL will continue serving them.
- The players release was replaced between manifest freezes. The successful metadata asset is explicitly versioned as a new instance and is not represented as either deleted predecessor.
- A future refresh must create a new manifest/source version and must never overwrite this snapshot identity.
- Custody admission does not establish predictive value, model eligibility, feature semantics, or historical point-in-time suitability; those require later frozen protocols and independent audit.
