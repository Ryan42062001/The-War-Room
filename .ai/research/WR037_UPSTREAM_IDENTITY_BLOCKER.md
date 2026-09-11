# WR-037 — Full-Cohort WR-033 Identity Blocker

Status: `REMEDIATION BLOCKED — UPSTREAM IDENTITY NOT PROVABLE`

## Scope and stop condition

WR-037 requires exact keyed frozen-WR-033 feature and prediction identity for all 3,508 season-total rows, including 1,627 zero-game rows, before any remediation addendum or affected rescoring. Aggregate metric equality is explicitly insufficient. The Manager task requires a fail-closed stop if that identity cannot be established.

No remediation addendum was frozen, no WR-035 candidate was rescored, and WR-036-AUD-02 through WR-036-AUD-05 were not modified because WR-036-AUD-01 could not be cleared.

## Verified repository and PR state

- canonical `main`: `cdccebf7e5d5a962a15c7b2036b95303db685de8`;
- PR #124: open, unmerged, head `9b4769899dd73f7c94679df6b6c67158e3ee39b6` before this blocker handoff;
- failed WR-036 audit evidence is integrated on `main`;
- PR #124 remains research-only under `.ai/research/**`;
- original frozen Players asset: release ID `69785162`, asset ID `552739287`, SHA-256 `a33998d3981bda4f49f40390c5c0fa30036112ee1ea5de19ed4609e2ad3be3e2`, 7,288,456 bytes / 24,826 rows;
- current replacement Players bytes have a different asset ID and SHA-256 `c2402e02d39c7ca1adbd9ca5c894bb11f693ab01da0721bff44db2a8bd1ea53d`.

## Identity requirement

The exact WR-033 feature vector includes metadata-derived `age_sep1`, `age_missing`, and `experience_years`. The immutable draft-picks asset supplies the draft features, but the deleted Players asset supplies `birth_date` and `rookie_season` used by those three features.

The existing WR-035 replay gate proves only the active-row count and aggregate MAE/RMSE/Spearman for 1,881 rows. It does not preserve or compare keyed feature vectors or predictions. The remaining 1,627 zero-game rows still receive WR-033 predictions and influence season-total scoring.

## Recovery approaches attempted

### 1. Repository history and retained generated evidence

Searched all repository branches/history for the original raw Players bytes, keyed full-cohort WR-033 feature matrices, keyed all-row WR-033 predictions, or a deterministic keyed reference hash.

Result: manifests retain the asset ID, digest, schema, and aggregate results. No artifact contains a trustworthy keyed reference covering all 3,508 rows. WR-029 likewise retained active benchmark rows/aggregates rather than full-cohort frozen features or predictions.

### 2. Original WR-025 GitHub Actions artifact

Inspected workflow run `34400961071`, artifact `10123492844` (`wr025-historical-ranking-results`, digest `sha256:2e945ae17850f9c4aac2731f5bf6901a9e4f10385fe0cbf496e379dd47be1187`). The ZIP contains only:

- `HISTORICAL_RANKING_ASSET_MANIFEST.json`;
- `HISTORICAL_RANKING_RESULTS.json`;
- `HISTORICAL_RANKING_PERMUTATION_IMPORTANCE.csv`;
- `HISTORICAL_RANKING_ROLLING_METRICS.csv`;
- `HISTORICAL_RANKING_SIGNAL_TABLE.csv`.

Result: no raw Players bytes, keyed feature matrix, or all-row prediction artifact.

### 3. Upstream nflverse release and repository history

- GitHub release-asset API for asset `552739287` returns HTTP 404.
- The current `players.csv` release asset is a different object/digest.
- The `nflverse/nflverse-data` `players` tag and repository history contain publishing/archive code, not the generated historical Players payload.

Result: the exact locked bytes cannot be reacquired from the authoritative upstream release or its git history.

### 4. Independent public capture search

Searched public GitHub content for the exact SHA-256, asset ID, byte count, and relevant Players schema. One independent repository records the same response digest/size and selected provider rows from the same date, but it explicitly retained only a small selected subset rather than the complete response.

Result: this corroborates source identity but cannot reconstruct or prove all 3,508 keyed feature/prediction rows.

## Why the replacement cannot be certified

The current substituted-input experiment is deterministic and reproduces the original active-row aggregate metrics exactly. That is strong evidence for the 1,881 active evaluation rows but is not exact identity evidence for every prediction. Without either the original metadata bytes or a frozen full-cohort keyed feature/prediction reference, there is no non-circular comparison for the 1,627 zero-game rows.

Recomputing the replacement run again, hashing its current rows, or deriving metadata from a different source would prove only a new reconstruction—not equality to the frozen WR-033 input surface. Treating aggregate equality as full identity would directly violate WR-037.

## Boundary verification

- 2026 regular-season outcomes inspected: **NO**
- WR-021 snapshot changed: **NO**
- WR-023 protocol/manifest changed: **NO**
- WR-033 specification retuned or changed: **NO**
- WR-034 specification retuned or changed: **NO**
- production code/rankings changed: **NO**
- Phase-6 replacement/FLEX/MSV/value work performed: **NO**
- WR-035 result history rewritten: **NO**

## Required Manager disposition

WR-037 cannot satisfy its mandatory first acceptance gate. Do not activate WR-038 against the blocked evidence as though remediation succeeded. The Manager must decide whether to:

1. close Phase 5 as insufficient evidence under the current frozen-WR-033 provenance contract; or
2. authorize a new prospectively frozen research contract that explicitly changes the upstream evidence basis and is not represented as exact replay of the deleted asset.

R&D does not make that roadmap decision.
