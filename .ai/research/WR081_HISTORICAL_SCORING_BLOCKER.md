# WR-081 — Historical Scoring Execution Blocker

Status: `BLOCKED — PROTECTED HISTORICAL SCORING PATH REQUIRED`

Task: `WR-081 — Returning-Player v2 Historical Model Scoring + Result Evidence`

Canonical assignment baseline: `69f1ec43c313ed89520e74b2853d69150d715d4d`

Assigned branch: `wr-081-v2-historical-model-scoring`

## Disposition

WR-081 stopped before source retrieval, feature construction, target inspection, fitting, prediction, scoring, or comparison.

The accepted WR-072 protocol requires the exact retained annual Player Summary Stats bytes to construct the 28-feature surface and historical targets. Those bytes are not present in the repository or this worker environment. The repository's only protected 15-object retrieval workflow is the accepted WR-069 safe-consumer path. That path is deliberately hard-bound to the reviewed WR-069 consumer, emits only privacy-safe schema/inventory summaries, deletes the runner-temporary raw bytes, and does not expose them to an R&D scoring process.

WR-081 is authorized to write only `.ai/research/**`. It is not authorized to modify the protected workflow or custody scripts. Reacquiring the same-named assets upstream, substituting current assets, or reusing older non-v2 derived tables would violate WR-081 and the accepted WR-072/source-custody contracts.

Therefore the historical protocol cannot be executed lawfully and exactly from the currently authorized lane.

## Verified authority and state

- Canonical main equals assignment SHA `69f1ec43c313ed89520e74b2853d69150d715d4d`.
- Assigned branch existed at that same SHA and was clean before this evidence-only blocker report.
- `node scripts/workflow-preflight.mjs --task WR-081` returned `PREFLIGHT: PASS`.
- Accepted protocol: `returning-player-v2-model-protocol/1.2.0-wr072`.
- Accepted result gates: `returning-player-v2-result-gates/1.2.0-wr072`.
- Machine-lock SHA-256: `aed044e6b7df9684153181a7a97a47a86c50ce9049db063ecdd8a973b1a832b6`.
- Accepted source snapshot: `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`.
- Accepted cohort: `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`.
- Exact cohort size remains 5,176 keys; the authorized model input is 14 retained annual stats objects and zero Players-metadata/draft-capital predictors.

## Execution-path evidence

### Repository inputs

No retained `stats_player_regpost_*.csv` object is committed in the repository. Accepted `.ai/work_helper/WR069_RETAINED_DERIVED_EVIDENCE.json` preserves source identities, schemas, row counts, and the 2014–2017 identity inventories, but not the row values needed to calculate the 28 predictors or the historical PPR/game targets.

Existing research tables do not satisfy the frozen input contract. For example, `WR034_EVENT_ROWS.csv` contains availability-model rows and predictions, not the required Player Summary Stats fields. Treating those artifacts as substitute v2 inputs would break exact source, feature, lineage, and full-row evidence requirements.

### Protected retrieval path

`.github/workflows/wr069-retained-safe-consumer-parser.yml`:

- provides provider credentials only to its trusted retrieval step;
- invokes `scripts/custody/wr069_retained_safe_consumer.py`;
- invokes the consumer with an empty provider environment;
- publishes only privacy-safe WR-069 derived evidence;
- removes all runner-temporary retained bytes and manifests;
- does not upload raw-byte Actions artifacts.

`scripts/custody/wr069_retained_safe_consumer.py` verifies the 15 retained objects but its consumer is fixed to schema/inventory derivation. It has no reviewed WR-081 feature/target/prediction mode and no interface that can hand exact verified bytes to an R&D scoring process after provider credentials are removed.

The workflow is also branch/implementation bound to WR-069. Advancing or repurposing that historical audited branch would be outside WR-081 authority and would destroy the separation the accepted custody path was designed to enforce.

## Smallest required remediation

A separately reviewed protected WR-081 execution bridge is required before scoring. The minimum safe design is:

1. retrieve only the 14 exact admitted annual stats objects by accepted immutable B2/R2 identities;
2. preserve the accepted dedicated read-only provider boundary and exact-key/version selection;
3. verify B2 and R2 SHA-256/size equality before consumption;
4. remove all provider credentials before the scoring consumer starts;
5. run only a reviewed, hash-bound WR-081 consumer implementing the accepted WR-072 protocol;
6. keep raw bytes runner-temporary, clean them on success and failure, and publish no raw-byte artifact/log;
7. enforce prediction-lock-before-target-exposure chronology inside the protected execution;
8. publish only the complete authorized `.ai/research/**` keyed evidence/results and privacy-safe execution report;
9. bind the result to the exact reviewed implementation SHA, protocol lock, source/cohort hashes, environment, commands, and output hashes.

This requires Manager-controlled expansion outside `.ai/research/**`—at minimum a protected workflow and a reviewed scoring consumer/test surface. Work Helper is the appropriate next implementation role because the blocker crosses custody, credential isolation, workflow runtime, chronology, and R&D evidence production.

## Protocol stages and terminal result

No stage was eligible to run.

| Stage | Seasons | Result |
|---|---|---|
| Development | 2018–2019 | `NOT_RUN — EXACT RETAINED INPUT PATH UNAVAILABLE` |
| Validation | 2020–2021 | `NOT_ELIGIBLE` |
| Confirmation | 2022–2025 | `NOT_ELIGIBLE` |

Terminal protocol outcome: `NOT_ESTABLISHED — EXECUTION BLOCKED BEFORE SCORING`.

No model-support or baseline-only conclusion is claimed because neither candidate nor baseline was executed on the frozen universe.

## Boundary attestation

- 2026 regular-season outcomes inspected: **NO**
- `draft_picks.csv` accessed or used: **NO**
- replacement/current Players metadata accessed or used: **NO**
- upstream source reacquisition/substitution: **NO**
- provider access or mutation: **NO**
- historical outcome inspection/join: **NO**
- feature construction: **NO**
- model fit/prediction/scoring/tuning/comparison: **NO**
- production/ranking/recommendation changes: **NO**
- season-total composition or Phase 6: **NO**

## Recommended Manager action

Do not activate WR-082 because no result target exists. Route a narrowly scoped Work Helper task to build and independently audit the protected WR-081 historical-scoring execution bridge. After that capability is accepted, reactivate WR-081 against the unchanged WR-072 protocol; do not silently broaden this R&D branch.
