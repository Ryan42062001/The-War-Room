# WR-082 — Independent Audit of Returning-Player v2 Historical Model Results

TASK ID: WR-082  
ROLE: Independent Auditor / QA  
WORKFLOW: V3.4  
EXECUTION MODE: STANDARD_CHAT_HIGH  
REFRESH MODE: FAST_REFRESH  
AUDIT TARGET TASK: WR-081  
AUDIT TARGET PR: #251  
EXACT FROZEN TARGET: `b5fc0974e0766c24974034557a62044b4752716a`  
PROTECTED EVIDENCE PARENT: `c586394bfe01d70b23c499c12902c712e591c627`  
CANONICAL MAIN VERIFIED: `16f766f1464656779d3e8e2fbab91998eca774f9`  
AUDIT BRANCH START: `86cf19e3e721b879a28a2a4c9997b7e7db1b2525`

## Final verdict

`PASS`

Findings by severity:

- CRITICAL: none.
- HIGH: none.
- MEDIUM: none.
- LOW: none.

The frozen WR-081 evidence validly supports the reported terminal result `VALIDATION_FAILED` and status `BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE`. The protected workflow's GitHub Actions conclusion `SUCCESS` is correctly interpreted as successful execution of the protected scoring/custody/publication mechanism, not as a model-gate PASS.

## 1. Exact-target and lane pinning

Live verification before substantive audit established:

- canonical `main` is exactly `16f766f1464656779d3e8e2fbab91998eca774f9`;
- WR-081 PR #251 is OPEN and unmerged;
- PR #251 exact head is the frozen target `b5fc0974e0766c24974034557a62044b4752716a`;
- WR-082's assigned branch was exactly the expected starting head `86cf19e3e721b879a28a2a4c9997b7e7db1b2525`;
- the assigned audit branch is one commit behind current main but the compare has zero file changes, so there is no target or Auditor write-surface overlap to import;
- `.ai/shared/ACTIVE_TASKS.json` binds WR-082 to audit target task WR-081 / PR #251 / branch `wr-081-v2-historical-model-scoring-execution` / exact SHA `b5fc0974e0766c24974034557a62044b4752716a`;
- Auditor write authority is only `.ai/auditor/**`.

The audit did not follow later branch movement.

## 2. Frozen packaging and protected-evidence identity

Comparison from protected evidence parent `c586394bfe01d70b23c499c12902c712e591c627` to frozen target `b5fc0974e0766c24974034557a62044b4752716a` is three commits ahead and changes exactly:

1. `.ai/research/HANDOFF.md`;
2. `.ai/research/WR081_HISTORICAL_MODEL_RESULT_REPORT.md`;
3. `.ai/research/WR081_RESULT_EVIDENCE_MANIFEST.json`.

Therefore all 11 generated protected evidence files are byte-identical to the protected execution parent.

Independent SHA-256 reproduction at the frozen target:

- source snapshot: `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`;
- cohort: `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`;
- WR-072 machine lock: `aed044e6b7df9684153181a7a97a47a86c50ce9049db063ecdd8a973b1a832b6`;
- protected consumer: `54ccf15ebf542bff182927c946b4ce37fd0c294d4b95f4cf595c3428ec64b2c4`;
- result report: `b3ad0e426661a53970b57f0dafc63001dc1ec64ea8ad2dc4f81a999803f13a4c`;
- result evidence manifest: `5e9a53fcdca24b7898cd0cb17efc71a337cdc9e9e6145c4d8b645acc9de765cf`.

The report is 6,400 bytes and the manifest is 8,415 bytes, matching the frozen package.

All 11 manifest-listed generated evidence blobs were fetched independently by their Git blob SHA-1. For every file, both the manifest SHA-256 and byte size reproduced exactly.

## 3. Accepted WR-059 source/cohort authority

The exact accepted source snapshot independently hashes to the frozen WR-059 identity above and records:

- 15 retained custody identities total;
- exactly 14 admitted Player Summary Stats sources;
- exactly one source per season 2012 through 2025;
- zero admitted Players metadata sources;
- the historical Players metadata source remains `FAILED_CLOSED`;
- `draft_picks.csv` is explicitly excluded with `acquired=false`, `custodied=false`, `parsed=false`, and `used=false`;
- no upstream reacquisition authority and no provider mutation authority.

The exact accepted cohort independently hashes to the frozen WR-059 cohort identity and records:

- 5,176 cohort keys;
- duplicate count 0;
- 1,668 train-only keys for 2014–2017;
- 3,508 historical keys for 2018–2025;
- membership based only on the completed prior-season REG QB/RB/WR/TE Player Summary Stats row;
- no Players metadata or draft-capital requirement for membership.

Every feature-lineage source reference in all four committed prediction files was checked against the accepted WR-059 season-to-SHA map:

- 2018 evidence: 641 lineage source references, 0 mismatches;
- 2019 evidence: 666 references, 0 mismatches;
- 2020 evidence: 657 references, 0 mismatches;
- 2021 evidence: 676 references, 0 mismatches.

Each evaluation file's target-source SHA also exactly matches the accepted WR-059 source identity for its target season.

## 4. Accepted WR-072 protocol and machine lock

The exact WR-072 1.2 machine-lock bytes reproduce SHA-256 `aed044e6b7df9684153181a7a97a47a86c50ce9049db063ecdd8a973b1a832b6`.

The 1.2 lock binds the accepted predecessor lock and preserves the frozen model semantics. Independent inspection verifies:

- exactly 28 predictors;
- every predictor derives only from prior-season Player Summary Stats;
- no age, experience, Players metadata, draft round, draft pick, or draft-capital predictor;
- preprocessing is per-position `StandardScaler(copy=True, with_mean=True, with_std=True)`;
- candidate is per-position `Ridge(alpha=100, fit_intercept=True, copy_X=True, max_iter=None, tol=0.0001, solver="svd", positive=False, random_state=None)`;
- no hyperparameter search;
- primary baseline is `prev1_ppr_pg`;
- secondary baselines are `weighted_ppr_pg` and same-position earlier-OBSERVED-target mean;
- development seasons are 2018–2019;
- validation seasons are 2020–2021;
- confirmation seasons are 2022–2025 and require both prior stage gates to pass;
- held-out target Y remains sealed until prediction/model state for Y is immutable.

The exact consumer code independently matches these frozen settings. All committed model states use alpha 100 and 28 input features; all preprocessing states contain the exact ordered 28-feature list and float64 state.

## 5. Full-row keyed prediction/evaluation evidence

The committed evidence is complete for every frozen development/validation cohort row:

| Season | Cohort / prediction rows | OBSERVED | TARGET_UNAVAILABLE | Fallbacks | Lineage failures |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2018 | 419 | 222 | 197 | 0 | 0 |
| 2019 | 444 | 220 | 224 | 0 | 0 |
| 2020 | 437 | 241 | 196 | 0 | 0 |
| 2021 | 435 | 244 | 191 | 0 | 0 |

For every season independently:

- feature-row count equals prediction count equals cohort-key count;
- evaluation-row count equals cohort-key count;
- all feature rows contain exactly the frozen 28 ordered features;
- all feature lineage is free of draft-capital and failed-closed metadata use;
- every prediction row digest recomputes from its canonical row payload;
- every evaluation row's stable key maps to exactly its immutable prediction row;
- candidate, primary, weighted-secondary, same-position-secondary, and prediction-row digest all match the locked prediction;
- every OBSERVED absolute-error field reproduces from prediction and target;
- every TARGET_UNAVAILABLE row has null target data and does not fabricate evaluation errors;
- every evaluation row carries the accepted prediction-lock digest;
- prediction artifacts report `target_values_accessed=false`.

This is sufficient full-row keyed evidence to reproduce the frozen gate calculations without trusting the packaged R&D summary.

## 6. Development gate — independent recomputation

Using the actual OBSERVED evaluation rows and the frozen binary64 formulas, the independent recomputation is:

- evaluable rows: 442;
- candidate MAE: `3.1145802908984912`;
- primary-baseline MAE: `3.2415960254551885`;
- MAE lift: `0.039183085603290639`;
- candidate RMSE: `4.128587296170827`;
- primary-baseline RMSE: `4.379049424362309`;
- RMSE regression: `-0.057195547234079262`;
- max eligible position MAE regression: `0.035116991102853899` (WR);
- mean season MAE delta: `-0.1271118975086778`;
- max season MAE regression: `-0.035439290008873886`;
- fallbacks: 0;
- lineage failures: 0.

Position support is QB 60, RB 113, WR 169, TE 100. Three of four positions are non-worse on MAE.

Against the frozen development thresholds:

- MAE lift >= 0.01: PASS;
- RMSE regression <= 0.01: PASS;
- max eligible position MAE regression <= 0.05: PASS;
- mean season MAE delta <= 0: PASS;
- fallbacks = 0: PASS;
- lineage failures = 0: PASS.

The development gate legitimately passes.

## 7. Validation gate — independent recomputation

Using the actual 2020–2021 OBSERVED rows:

- evaluable rows: 485;
- candidate MAE: `2.9931343393335581`;
- primary-baseline MAE: `3.0584650236799114`;
- MAE lift: `0.02136061188881869`;
- candidate RMSE: `6.1232819431425964`;
- primary-baseline RMSE: `4.2677722073572282`;
- RMSE regression: `0.43477243995981046`;
- max eligible position MAE regression: `0.17330031196564874` (WR);
- max season MAE regression: `0.034878242776191039`;
- fallbacks: 0.

Ordering metrics independently reproduce from all eight eligible season-position cells:

- candidate weighted Spearman: `0.64144805678776851`;
- primary weighted Spearman: `0.62606279905720563`;
- weighted Spearman delta: `0.015385257730562873`;
- candidate weighted rank MAE: `12.222680412371133`;
- primary weighted rank MAE: `12.156701030927834`;
- weighted rank-MAE regression: `0.0054274084124830207`.

Against the frozen validation thresholds:

- MAE lift >= 0.005: PASS;
- RMSE regression <= 0.01: **FAIL**;
- weighted Spearman delta >= -0.01: PASS;
- weighted rank-MAE regression <= 0.02: PASS;
- max eligible position MAE regression <= 0.05: **FAIL**;
- max season MAE regression <= 0.05: PASS;
- fallbacks = 0: PASS.

The reported validation failure is therefore mathematically required by the frozen protocol. It is not an R&D interpretation or a workflow failure.

## 8. Prediction-lock chronology and terminal stop

The committed chronology contains exactly ten events:

1. 2018 prediction locked;
2. 2018 target exposed after that exact lock;
3. 2019 prediction locked;
4. 2019 target exposed after that exact lock;
5. development stage gate PASS;
6. 2020 prediction locked;
7. 2020 target exposed after that exact lock;
8. 2021 prediction locked;
9. 2021 target exposed after that exact lock;
10. validation stage gate FAIL.

The chronology contains only four prediction locks (2018–2021) and two gate locks (development/validation). Terminal is exactly `VALIDATION_FAILED`.

The protected wrapper independently enforces the ordering:

- prediction mode receives only prior-season visible sources;
- target-ingest receives target-season visibility only after the prediction publication has been locked;
- stage-gate receives no retained input source;
- confirmation requires both the development and validation prior gate locks to exist and have `gate_pass=true`;
- after any stage returns `gate_pass=false`, the stage loop sets `<STAGE>_FAILED` and breaks immediately.

Because validation's immutable gate lock is false, confirmation is unreachable under the wrapper.

There are no 2022, 2023, 2024, or 2025 prediction, evaluation, target-exposure, confirmation-gate, or bootstrap artifacts. The manifest records no confirmation evidence file. Confirmation bootstrap therefore did not run.

## 9. Protected workflow / custody / provider verification

Protected workflow run `35402528405` was independently inspected:

- preflight `105785318084`: SUCCESS;
- trust gate `105785424103`: SUCCESS;
- future-authorized WR-081 scoring `105785451305`: SUCCESS;
- protected-no-scoring proof `105785452773`: SKIPPED;
- GitHub Actions artifacts: 0.

The successful protected scoring job verifies exact Manager authorization for branch/head/consumer before retained retrieval, checks out exact pre-execution head `45d6b22104e4647d04dfc37d01ab69619caed0c1`, removes checkout credentials, rechecks the live head, and then runs provider retrieval.

Provider implementation at the exact canonical control-plane SHA used by the run:

- loads only the accepted authority's 14 sources;
- retrieves the authoritative retained B2 object/version;
- reads the corresponding R2 object;
- independently verifies R2 SHA-256 and byte size;
- requires exact B2/R2 byte equality;
- records only B2 authorize/list/download and R2 HeadObject/GetObject operations;
- records provider mutation operations 0;
- records upstream-source access false;
- records draft-picks use false and Players-metadata use false;
- keeps raw bytes under RUNNER_TEMP;
- fails closed and cleans raw/manifest/report on any provider-phase exception.

The consumer executes under a stripped `env -i` environment after provider authority is removed. The wrapper re-hashes visible retained source copies before exposure.

The protected run publishes exactly 11 evidence files, reports four prediction locks, two gate locks, and terminal `VALIDATION_FAILED`, then performs the non-force push from `45d6b22...` to `c586394...` and deletes the raw directory, publication staging, execution checkout, verified manifest, and provider report.

Comparison from authorized pre-execution head `45d6b22104e4647d04dfc37d01ab69619caed0c1` to protected evidence parent `c586394bfe01d70b23c499c12902c712e591c627` is exactly one commit and exactly those 11 generated evidence files. The later frozen target only packages the result/report/handoff. There is no second generated scoring publication in the frozen target lineage.

## 10. No forbidden downstream or source work

PR #251 changed filenames are exclusively under `.ai/research/**`.

No frozen-target changes touch:

- production code;
- ranking/recommendation logic;
- season-total composition;
- workflows/scripts;
- Manager/shared control-plane state;
- provider state;
- Phase-6 surfaces.

The accepted source authority contains seasons 2012–2025 only; no 2026 regular-season source exists in the scoring set. The execution stops after validation 2021 and contains no 2026 target/prediction/evaluation event. No 2026 regular-season outcome use is evidenced.

The exact branch history contains one protected scoring publication commit. No hyperparameter search/tuning is present: the candidate remains the single frozen Ridge alpha=100 specification. No source substitution/reacquisition is present: all feature and target source identities resolve to the accepted retained WR-059 hashes.

## 11. Exact-head target CI

Frozen target `b5fc0974e0766c24974034557a62044b4752716a` is directly associated with PR-event War Room CI run `35403434472`, conclusion SUCCESS:

- classify `105788089428`: SUCCESS;
- governance `105788118328`: SUCCESS;
- product test `105788173140`: SKIPPED under research-only classification;
- Actions artifacts: 0.

This CI success is consistent with the research-only frozen target and does not override the independently reproduced validation gate failure.

## 12. Auditor boundary and disposition

The Auditor:

- did not modify WR-081 evidence;
- did not modify `.ai/research/**`;
- did not rerun historical scoring;
- did not inspect confirmation outcomes;
- did not merge PR #251;
- did not authorize season-total composition;
- did not modify production/ranking/recommendation code;
- wrote only `.ai/auditor/**`.

Manager may consume this audit only for exact WR-081 frozen SHA `b5fc0974e0766c24974034557a62044b4752716a`.

The correct audited interpretation is:

- development evidence: supported under the frozen gate;
- validation evidence: fails the frozen gate;
- terminal: `VALIDATION_FAILED`;
- status: `BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE`;
- confirmation: never exposed/scored;
- no downstream composition or production authority is granted.

Final verdict: `PASS`.
