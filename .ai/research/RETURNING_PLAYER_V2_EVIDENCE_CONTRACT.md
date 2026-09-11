# Returning-Player v2 Prospective Evidence Contract

Contract ID: `wr-returning-player-v2-evidence-contract`
Contract version: `1.0.0`
Status: `FROZEN_PRE_SCORING — PENDING INDEPENDENT AUDIT`
Task: `WR-039`

## 1. Purpose and authority

This contract governs evidence custody for future Returning-Player v2 expected-performance research. It is frozen before any v2 model is fitted, scored, tuned, compared, ranked, or evaluated.

It does not adopt a model, authorize production, reopen WR-033 or WR-034, repair WR-035, or authorize Phase-6 value work. FantasyPros remains production ranking authority under WR-D001.

The machine-readable authority is `.ai/research/generated/RETURNING_PLAYER_V2_EVIDENCE_CONTRACT.json`; its exact SHA-256 is stored in the adjacent `.sha256` sidecar. The human contract and rights matrix are normative inputs whose hashes are embedded in that machine lock.

## 2. v1/v2 identity boundary

- `returning_player_v1_wr033` means the historical WR-033 / WR-D005 research specification and provenance lineage.
- `returning_player_v2` is a new prospective lineage. It must use new source-snapshot, feature-schema, preprocessing, model, prediction, and run identifiers.
- No v2 source, feature row, preprocessing state, model, or prediction may be labeled identical to WR-033 unless a future independent audit proves exact identity from retained evidence.
- Reusing the mathematical form `StandardScaler -> Ridge(alpha=100)` as a predeclared candidate does not reuse WR-033 inputs, fitted state, predictions, or evidence identity. It must be named and versioned as a v2 candidate.
- The closed WR-035/WR-037 result is historical evidence only and cannot seed v2 acceptance thresholds, supply missing keyed predictions, or serve as a v2 source snapshot.

## 3. Frozen source classes

The only initially admissible upstream classes are:

1. `NFLVERSE_PLAYER_SUMMARY_STATS`: regular-season historical player summary statistics, one versioned asset per season, with target-season Week 1+ predictors prohibited for that target season.
2. `NFLVERSE_PLAYERS_METADATA_MINIMAL`: only stable identity and the explicitly approved metadata fields needed by the frozen feature schema. Current team/status, proprietary grades, and unused third-party IDs are excluded.
3. `NFLVERSE_DRAFT_CAPITAL_MINIMAL`: only the approved draft-season, round, overall-pick, position-at-draft, and stable identity fields needed by the feature schema.

No source is admitted merely because an open-source package can scrape it. New sources or columns require a new contract version and independent audit before scoring.

The source-rights and retention disposition is in `.ai/research/RETURNING_PLAYER_V2_SOURCE_RIGHTS_RETENTION.md`.

## 4. Source-instance inventory contract

WR-039 freezes source classes and required evidence fields; it intentionally does not freeze a mutable URL as a usable scoring snapshot. After WR-040 and before model scoring, a separate no-scoring source-custody checkpoint must acquire and retain exact source instances and populate one record per asset with all fields below:

- `source_instance_id`: content-addressed ID `src-sha256-<64 lowercase hex>`;
- `source_class` and provider/repository;
- exact acquisition method and canonical URL/API endpoint;
- UTC acquisition timestamp;
- release/tag/version identifier, release ID, asset ID, asset name, and provider update timestamp when supplied;
- SHA-256 of exact downloaded bytes and byte size;
- media/compression type;
- raw schema as ordered `(column, type, nullable)` tuples plus schema SHA-256;
- row count and exact approved-column list;
- target-season cutoff and availability semantics;
- mutability classification;
- license identifier, license URL, attribution text, upstream caveat, and retention/redistribution disposition;
- project-controlled retained-object URI and retained-object digest, or a documented rights-limited derived-evidence package;
- acquisition code SHA and command;
- status: `ADMITTED`, `REJECTED`, or `UNAVAILABLE` with reason.

Every exact source-instance record and retained object must be frozen in a source-snapshot manifest. The source-snapshot manifest itself receives a SHA-256 and immutable checkpoint. An independent source-custody audit must pass before any process can read target outcomes or fit a v2 model.

### Cutoff semantics

For fake-preseason target season `Y`:

- predictors may use only information with a defined availability timestamp strictly before the frozen cutoff for `Y`;
- no target-season regular-season outcome, Week-1+ statistic, hindsight status, or current metadata field whose historical point-in-time meaning is undefined may enter features;
- historical assets generated later are admissible only when their used columns reconstruct facts that were fixed and knowable by the cutoff, and the contract explicitly documents that reasoning;
- metadata whose historical value could change must come from an as-of snapshot or be excluded.

For any real future-season run, the UTC cutoff is fixed and committed before acquisition. A source updated after cutoff is not automatically invalid, but each used field must be proven cutoff-safe; otherwise the source instance is rejected.

### Source failure and fallback

- Missing bytes, digest mismatch, changed asset identity, incomplete schema, ambiguous cutoff, or unapproved rights status causes `FAIL_CLOSED_SOURCE`.
- A newer asset at the same URL is never a fallback for a missing locked asset.
- A fallback source is allowed only if it is named in the audited source-snapshot contract, supplies the same frozen semantic fields, has its own rights/cutoff evidence, and produces a separately versioned feature/evidence lineage.
- No scoring may silently continue with missing values, refreshed metadata, or aggregate-metric equivalence.

## 5. Durable retention and authority

### Rights-permitted raw sources

Exact downloaded bytes must be copied before parsing to project-controlled, content-addressed immutable storage. Required properties:

- object path contains the SHA-256;
- object-lock/version-retention or append-only repository policy prevents silent overwrite;
- project-owned manifest maps the object to provider attribution and license;
- retention is indefinite for the life of any model/result that depends on it and at least seven years after that model is retired;
- two independently retrievable copies exist: the primary immutable store and a second project-controlled backup;
- quarterly automated existence/digest verification and verification immediately before every audit or rerun;
- expiring CI artifacts and third-party URLs are transport/cache only, never authority.

The authoritative object is the content whose bytes match the source-instance digest, not its filename or URL.

### Rights-limited sources

If raw custody or redistribution is not authorized, the source is admitted only when the approved derived package can be legally retained and independently proves the complete model input surface. The package must contain:

- every scored/excluded stable row key;
- exact approved source values used to derive features when those values may lawfully be retained, otherwise deterministic per-field salted hashes plus the auditor-access procedure for the raw reference;
- exact feature values or canonical per-row feature hashes;
- ordered feature schema and canonical serialization rules;
- preprocessing identity and parameters;
- exact predictions and inclusion/exclusion reasons;
- source/provider/version/digest receipts and rights decision;
- an independent verification path that does not regenerate both sides from the same mutable source.

If an independent auditor cannot obtain or verify the reference under the rights arrangement, the source is `EXCLUDED_RIGHTS` and scoring fails closed. Hashes without an independently available reference are not sufficient.

## 6. Full-row evidence package

### Stable key

The canonical row key is the ordered tuple:

`(target_season:int, player_id_namespace:utf8, player_id:utf8, position:enum[QB,RB,WR,TE], cohort_version:utf8)`

Canonical string form is UTF-8 JSON array with no whitespace. Duplicate canonical keys are fatal. Player names are descriptive and never part of identity.

### Required rows

The evidence package contains one row for every player-season evaluated or considered by cohort construction, including:

- active target-season rows;
- zero-game target-season rows;
- rows excluded before fitting or evaluation;
- fallback rows;
- rows lacking a target or required feature.

Every row records `cohort_status` (`SCORED`, `TRAIN_ONLY`, `EXCLUDED`, `TARGET_UNAVAILABLE`, or `FALLBACK`) and one enumerated `inclusion_exclusion_reason`. Summary metrics may filter rows, but evidence retention may not.

### Feature evidence

For every row retain:

- exact ordered pre-transform feature values in lossless canonical representation;
- per-field missingness flags;
- source-instance IDs and source-row/field lineage;
- feature-schema version;
- transform code SHA;
- canonical row-feature SHA-256.

Canonical feature serialization is RFC 8785 JSON where supported; otherwise the implementation must use the contract's typed-array encoding: ordered field records containing name, logical type, explicit null marker, and value encoded as decimal string or UTF-8 string. IEEE-754 values may not be serialized with display rounding. The serializer version is mandatory.

### Preprocessing and fitted-state evidence

For every fold/position retain:

- training-key set digest and complete ordered training-key file;
- fitted preprocessing class, library/version, ordered inputs, learned parameters, and serialized-state digest;
- model family/version, exact hyperparameters, coefficients/tree/state as applicable, fitted-object digest, and prediction-code SHA;
- split/fold ID, target definition, seed, and cutoff;
- environment lock digest and deterministic command.

### Prediction evidence

For every canonical row key retain:

- model/fold/position identity;
- exact prediction in lossless canonical representation;
- prediction status and fallback identity;
- canonical feature hash, preprocessing-state digest, model-state digest, and prediction-row digest;
- target value only in a separately access-controlled outcome/evaluation table joined after the pre-score evidence lock.

Zero-game rows must receive the same prediction evidence as active rows whenever the model predicts them. Aggregate MAE, RMSE, rank correlation, row count, or output-file digest never substitutes for keyed evidence.

### Fail-closed validation

Before scoring, deterministic validators must reject:

- missing, duplicate, extra, or differently ordered keys relative to the cohort manifest;
- source, schema, feature, preprocessing, model, environment, or code digest mismatch;
- non-finite values not explicitly permitted by schema;
- missing inclusion/exclusion reason;
- a prediction without feature/preprocessing/model lineage;
- an evaluation row without a matching pre-score prediction row;
- any target-season information appearing in the predictor lineage.

## 7. Reproducibility lock

The future source-custody and model-protocol locks must bind:

- this evidence-contract ID/version/hash;
- source-snapshot manifest hash and retained-object verification report;
- ordered cohort rules and cohort manifest hash;
- ordered feature schema, definitions, transforms, and serializer version;
- target definition;
- preprocessing family and parameter-export format;
- model candidates/hyperparameters and selection gates;
- development/validation/confirmation split logic;
- all random seeds and deterministic-compute settings;
- dependency lock, OS/runtime architecture, locale, timezone, and numeric-library versions;
- repository code SHA and clean-tree assertion;
- exact commands and expected output paths;
- frozen WR-021/WR-023 sentinel hashes;
- prohibition on 2026 regular-season outcomes until separately authorized;
- hash inventory for every generated evidence artifact.

No machine lock may contain an unverifiable placeholder at scoring time. Any change to a bound field creates a new semantic contract/source/model version and requires Manager disposition plus independent audit before affected results are treated as comparable.

## 8. Prospective chronology

The mandatory order is:

1. **WR-039:** freeze this normative evidence/source/retention contract without model scoring.
2. **WR-040:** independent audit of the exact WR-039 PR head.
3. **Source-custody checkpoint:** acquire exact sources, retain bytes/derived evidence, freeze the complete source-instance/cohort manifest, and perform no model scoring.
4. **Independent source-custody audit:** verify rights, bytes, hashes, schemas, cutoffs, retention, and full cohort-key coverage.
5. **Model-protocol checkpoint:** predeclare v2 target/features/candidates/splits/gates and bind it to the audited source snapshot; freeze before fitting/scoring.
6. **Later model scoring/evaluation:** execute only the audited source snapshot and frozen model protocol; persist full-row feature/preprocessing/prediction evidence before joining outcomes.
7. **Independent model-result audit:** verify chronology, keyed identity, reproducibility, and claims.
8. **Later season-total composition:** only after accepted expected-performance and availability inputs are explicitly versioned.
9. **Independent composition audit:** required before any Phase-6 use.

Steps may be combined into one Manager task only if commit chronology still proves each pre-score lock existed before the next stage and the required independent audit boundaries are preserved. No model-result inspection may influence an earlier contract.

## 9. Reuse and re-versioning disposition

| Prior component | v2 disposition | Permitted reuse | Prohibited claim |
|---|---|---|---|
| WR-033 / WR-D005 | Re-version | Ridge/StandardScaler structure and documented feature ideas may be predeclared as a v2 candidate | Same frozen inputs, fitted model, prediction surface, or exact replay |
| WR-034 / WR-D006 | Reuse only as explicitly named historical dependency | Accepted stats-only expected-games logic and keyed WR-034 evidence may remain a separate `availability_v1_wr034` input if its exact artifacts/hashes are bound and independently available | That WR-034 becomes v2 expected performance, or that later refits inherit acceptance |
| WR-029 | Governance reuse; data/model outputs not inherited | chronological folds, source hashing, cutoff discipline, family-level ablation concepts, frozen-sentinel checks | That WR-029 source assets establish current v2 source identity or that rejected features are adopted |
| WR-025 | Research lineage only | feature definitions and Ridge candidate rationale may inform a new pre-score protocol | Full-cohort keyed identity, because it was never retained |
| WR-035/WR-037 | Historical warning only | failure modes and audit requirements | Accepted Phase-5 composition or v2 input authority |

Required v2 identifiers include at minimum:

- `source_snapshot_id`;
- `cohort_version`;
- `feature_schema_version`;
- `preprocessing_spec_version`;
- `model_protocol_version`;
- `model_fit_id`;
- `prediction_surface_id`;
- `evaluation_run_id`;
- `evidence_package_id`.

## 10. Audit acceptance checklist

WR-040 should return FAIL unless it can verify:

- this contract was committed before any v2 model result;
- human and machine artifacts agree and hashes reproduce;
- source classes, rights states, retention rules, and no-fallback behavior are complete;
- an actual source snapshot cannot be scored before separate custody/audit gates;
- every future cohort row, including zero-game/excluded rows, is represented;
- keyed features, preprocessing, model state, and predictions are independently verifiable;
- mutable URLs and CI artifacts cannot become sole authority;
- v1/v2 non-equivalence is unambiguous;
- all frozen and production boundaries remain intact.

Passing WR-040 authorizes only the next Manager decision. It does not authorize source acquisition, model scoring, production changes, or Phase-6 work by itself.
