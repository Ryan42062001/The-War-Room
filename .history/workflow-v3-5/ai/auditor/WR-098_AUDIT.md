# WR-098 — Independent Audit of Returning-Player v2.1 Protected Consumer + Execution Bridge

TASK ID: WR-098  
ROLE: Independent Auditor / QA  
CANONICAL WORKFLOW: V3.5  
EXECUTION MODE: STANDARD_CHAT_HIGH  
REFRESH MODE: FAST_REFRESH  
AUDIT TARGET TASK: WR-097  
TARGET PR: #275  
TARGET BRANCH: `wr-097-v21-protected-execution-bridge`  
EXACT FROZEN TARGET: `75c0fbcd518438a226a8c49e3e11951de3944638`  
NO-SCORING PROOF SHA: `123149f330338b02381fdabeb09f575b7a94c26c`  
CANONICAL MAIN VERIFIED: `78df85ddac4e4b9c80212bb12eecad4f7ed8b7cb`  
AUDIT BRANCH START: `d3d0b041d6212e5ee8c4c61840762d3d424a0681`

## Final verdict

`PASS`

Findings:

- CRITICAL: none
- HIGH: none
- MEDIUM: none
- LOW: none

This is a protected-implementation audit only. It grants no scoring authority, target-outcome authority, production authority, season-total composition authority, or Phase 6 authority.

A known external Manager integration restriction remains intentionally fail-closed: canonical `scripts/workflow-manager-transition.mjs` currently accepts successful protected workflow identity only when the workflow name is exactly `WR-083 Protected Historical Scoring Bridge`. A future WR-097 scoring run therefore cannot currently be consumed by canonical Manager transition tooling. That is a required post-audit integration gate, not an in-scope WR-097 defect.

## 1. Exact-target / lane pinning

Live repository/GitHub state was independently verified before substantive audit:

- canonical `main` exactly `78df85ddac4e4b9c80212bb12eecad4f7ed8b7cb`;
- WR-098 assigned branch initially exactly `d3d0b041d6212e5ee8c4c61840762d3d424a0681`;
- WR-097 target branch exactly `75c0fbcd518438a226a8c49e3e11951de3944638`;
- PR #275 OPEN and unmerged at exact target head;
- canonical active registry binds WR-098 to WR-097 / PR #275 / exact branch / exact frozen SHA;
- WR-097 is `AUDIT_READY`;
- WR-098 is `ASSIGNED`;
- no active task currently contains `future_execution_authority`;
- canonical workflow is V3.5.

The audit did not follow later movement of PR #275 or its branch.

PR #275 was created against an older main base SHA, but the audit object is the exact frozen WR-097 head and its exact diff, as required.

## 2. Exact WR-097 scope

PR #275 changes exactly nine files:

1. `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER.py`
2. `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER_TEST.py`
3. `.ai/work_helper/HANDOFF.md`
4. `.ai/work_helper/WR097_V21_PROTECTED_EXECUTION_BRIDGE.md`
5. `.ai/work_helper/WR097_V21_PROTECTED_READINESS_SUMMARY.json`
6. `.github/workflows/wr097-v21-protected-scoring-bridge.yml`
7. `scripts/custody/test_wr097_v21_protected_scoring.py`
8. `scripts/custody/wr097_v21_protected_scoring.py`
9. `scripts/validate-release-candidate.mjs`

No Manager/shared/Auditor/product/ranking/recommendation/composition files are modified.

The release-candidate validator change is one bounded allowlist addition recognizing the new WR-097 protected workflow; exact workflow-set equality remains enforced.

## 3. Proof SHA to final frozen SHA

Independent Git comparison:

`123149f330338b02381fdabeb09f575b7a94c26c`
→
`75c0fbcd518438a226a8c49e3e11951de3944638`

changes only:

- `.ai/work_helper/HANDOFF.md`;
- `.ai/work_helper/WR097_V21_PROTECTED_EXECUTION_BRIDGE.md`;
- `.ai/work_helper/WR097_V21_PROTECTED_READINESS_SUMMARY.json`.

Therefore the executable bytes proven by the successful credentialed NO-SCORING run are byte-identical to the final audited target:

- consumer SHA-256 `f6e5eee35c0e769abc9cbc899c0eecc3e311ff3cd22973ebf2c7351ddd58c6f8`;
- consumer test SHA-256 `ef7e7f3cadc8566faf059831bdc5fbad28ee39e2b713e446566c1fefb026a97a`;
- protected bridge script SHA-256 `439000b4b4f7967f0e8ed075e1c9bd164a1047ec58a3c39ab6ee47ee75e9ff3b`;
- bridge regression SHA-256 `3955b3c1deb3a628d32407e6971669597a289472955af59dfb6bdf5c5734ff8f`;
- protected workflow SHA-256 `377b86ce431e16cf967871e41eb62541d716c766c1dc1c92bbc934898e25403b`.

No executable reviewed byte changed after the live proof.

## 4. Accepted v2.1 authority

The frozen implementation independently hash-binds and validates:

- protocol ID `returning-player-v2.1-model-protocol-candidate/1.0.0-wr095`;
- protocol SHA-256 `5c86dacac044538422ca24fbeb13eaee3161050f917acc40f0dbdc1ca6547a39`;
- source snapshot ID `wr-returning-player-v2-source-snapshot/1.2.0-wr059`;
- source snapshot SHA-256 `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`;
- cohort ID `returning-player-v2-cohort/1.2.0-wr059`;
- cohort SHA-256 `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`;
- exactly 14 admitted Player Summary Stats source identities for seasons 2012–2025;
- zero admitted Players metadata;
- `draft_picks.csv` excluded from acquisition/custody/parsing/use.

No alternate data source is present.

## 5. Model semantic conformance

The consumer exactly implements the accepted WR-095 machine protocol.

### Feature / position contract

- ordered feature list matches the machine protocol exactly;
- feature count = 28;
- positions exactly QB/RB/WR/TE;
- per-position fits;
- same prior-season stats source surface;
- no feature pruning;
- no named-player literals/special cases;
- no WR-specific conditional;
- no hyperparameter search.

### Preprocessing / model

Exact frozen values:

- `StandardScaler(copy=True, with_mean=True, with_std=True)`;
- scaler is fit before clipping;
- elementwise z clamp `[-6,+6]`;
- identical clipping helper used for training and prediction matrices;
- Ridge alpha = 100;
- `fit_intercept=True`;
- `copy_X=True`;
- `max_iter=None`;
- `tol=0.0001`;
- `solver='svd'`;
- `positive=False`;
- `random_state=None`.

Synthetic consumer tests independently assert exact fit/predict clipping symmetry and Ridge `get_params` equality.

### Baseline / residual semantics

- primary baseline = `prev1_ppr_pg`;
- residual target = `observed_target - prev1_ppr_pg`;
- residual center = training median;
- MAD = median absolute deviation from center;
- robust sigma = `1.4826 * MAD`;
- lower/upper = center ± `3 * robust_sigma`;
- raw Ridge residual prediction is clipped to those bounds;
- final prediction = persistence baseline + bounded adjustment;
- final adjustment is rechecked against lower/upper bound.

Zero/nonfinite robust scale returns explicit `INVALID_RESIDUAL_SCALE` fold fallback. The candidate becomes explicit persistence fallback for affected rows. Prospective gates require `fallbacks=0`, so such fallback cannot support promotion.

No result threshold was changed.

## 6. Result-gate conformance

Validation gate implementation preserves:

- MAE lift >= 0.005;
- RMSE regression <= 0.01;
- weighted Spearman delta >= -0.01;
- weighted rank-MAE regression <= 0.02;
- max eligible position MAE regression <= 0.05;
- max season MAE regression <= 0.05;
- fallbacks = 0;
- lineage failures = 0.

Confirmation preserves:

- MAE lift >= 0.005;
- clustered bootstrap q0.975 <= 0;
- max eligible position MAE regression <= 0.05;
- >=3 positions non-worse MAE;
- mean season MAE delta <= 0;
- max season MAE regression <= 0.05;
- weighted Spearman delta >= -0.01;
- weighted rank-MAE regression <= 0.02;
- minimum evaluable rows per position >=30;
- fallbacks = 0;
- lineage failures = 0;
- regression versus every named secondary baseline <=0.01.

Confirmation bootstrap remains 5,000 replicates with `Generator(PCG64(72073))`, player-cluster resampling, deterministic cluster order, and linear quantiles.

Tail diagnostics are calculated as evidence, not hidden promotion gates.

## 7. Chronology / target isolation

The implementation technically enforces the accepted future chronology.

### 2022

Before any 2022 target source is consumer-visible:

1. only seasons 2012–2021 are mounted for prediction;
2. model/preprocessing/prediction evidence is produced;
3. consumer reports `target_values_accessed=False`;
4. the prediction output is immutably locked;
5. the exact prediction-state digest is bound to that lock.

Only then is the visible-source directory replaced with the 2022 source for target ingest.

Target ingest verifies the 2022 prediction lock and immutable prediction artifact before hashing/parsing the 2022 target source.

### 2023

Prediction mode requires:

- exact prior future prediction-lock history;
- a valid prior 2022 evaluation state;
- the prior evaluation digest to match its canonical bytes.

Only after those chronology checks does 2023 prediction receive seasons 2012–2022.

Thus 2022 may enter 2023 rolling training only after lawful 2022 lock/exposure/evaluation.

2023 itself is locked before 2023 target ingest.

### Complete validation gate

The validation gate is evaluated only after both 2022 and 2023 evaluations exist.

A 2022-only partial result cannot unlock confirmation.

### Validation failure

If the complete validation gate fails:

- terminal becomes `VALIDATION_FAILED`;
- execution breaks before confirmation;
- 2024 and 2025 sources are never mounted to the consumer.

### Confirmation

Confirmation prediction requires exactly one prior stage lock: validation.

The validation gate lock is revalidated and must have `gate_pass=True`.

Then 2024 and 2025 each repeat prediction-lock-before-target exposure.

The synthetic sandbox/future-plan evidence independently proves phase visibility:

- 2022 predict sees only 2012–2021; target ingest sees only 2022;
- 2023 predict sees only 2012–2022; target ingest sees only 2023;
- 2024 predict sees only 2012–2023; target ingest sees only 2024;
- 2025 predict sees only 2012–2024; target ingest sees only 2025.

Bubblewrap execution unshares network, mounts only phase-specific visible inputs, hides the master raw store, provides no repository view to the consumer, clears environment, and fails if consumer stdout/stderr is non-empty.

## 8. Custody / provider boundary

The provider phase independently derives the exact 14 accepted identities from the frozen source snapshot.

For every source:

### B2

- reads exact retained versions;
- filters to valid immutable upload candidates;
- downloads by file ID;
- requires local SHA-256 and byte size to equal the accepted source identity;
- if no exact candidate matches, fails closed.

### R2

- reads the same accepted object identity;
- requires local R2 SHA-256 and size exact;
- then compares B2 and R2 bytes for exact equality.

The live successful provider proof therefore establishes:

- B2 digest/size: 14/14;
- R2 digest/size: 14/14;
- B2/R2 equality: 14/14.

The bridge then independently re-hashes/re-sizes all 14 local retained inputs before accepting the no-scoring proof.

### Credential / mutation boundary

B2 accepted proof shows mutation capabilities absent.

The accepted R2 credential scope includes bucket-scoped Object Read & Write from predecessor authority, but WR-097 execution performs only:

- `HeadObject`;
- `GetObject`.

R2 execution mutation operations = 0.

Provider mutation operations overall = 0.

Thus no provider mutation is performed by WR-097.

Provider credentials/config are present only in the retrieval/provider step.

The consumer invocation uses a clean environment and separately rejects any provider authority variable. Deliberate injection of `WR_CUSTODY_R2_ENDPOINT` causes exit 2 and produces no accepted bridge result.

### Raw-byte custody

Raw retained bytes:

- are confined beneath `RUNNER_TEMP`;
- are never passed as repository paths;
- are never uploaded by an Actions artifact action;
- are not printed by the consumer;
- are unavailable in stage-gate mode;
- are cleaned on successful readiness proof;
- provider failure cleanup removes raw/manifests/reports;
- future execution has unconditional cleanup for raw/publication/execution staging.

Protected proof run contains zero Actions artifacts.

## 9. Live credentialed NO-SCORING proof

Proof implementation SHA:

`123149f330338b02381fdabeb09f575b7a94c26c`

Protected workflow run:

`35417205490` — SUCCESS

Jobs:

- preflight `105828043700` — SUCCESS;
- trust gate `105828139958` — SUCCESS;
- protected no-scoring readiness `105828156958` — SUCCESS;
- future authorized v2.1 scoring `105828157786` — SKIPPED.

Same-head War Room CI:

`35417205509` — SUCCESS.

Actions artifacts for protected run: 0.

The actual live logs, not merely the readiness summary, establish:

- exact proof SHA checkout;
- trusted branch/actor selected only `no-scoring`;
- exactly 14 retained identities;
- B2/R2 verification and equality completed;
- provider mutation operations 0;
- consumer provider credential presence false;
- consumer independent re-hash/re-size 14;
- actual v2.1 consumer ran only source-free `readiness` mode;
- retained rows parsed by consumer false;
- historical targets exposed false;
- 2022–2025 targets exposed false;
- real retained-data model fit false;
- real predictions emitted false;
- real baseline comparison false;
- real result-gate calculation false;
- deliberate provider credential/config injection failed closed;
- cleanup PASS;
- raw Actions artifacts 0.

No real scoring occurred.

## 10. V3.5 authority / replay boundary

### Dispatch identity

`workflow_dispatch` exposes only bounded `mode`:

- `no-scoring`;
- `authorized-v21-scoring`.

Callers cannot supply:

- execution branch;
- expected head;
- consumer path;
- consumer SHA-256.

For authorized scoring, those values come only from canonical Manager `future_execution_authority`.

### Authority identity

The bridge normalizes exactly:

- branch;
- head SHA;
- consumer path;
- consumer SHA-256.

It requires:

- non-main branch;
- 40-hex head;
- exact WR-097 consumer path;
- no traversal;
- 64-hex consumer digest.

Canonical authority SHA-256 is recomputed from canonical JSON.

Exactly one active, unblocked authority is required and task branch must equal authority branch.

### Replay history

Before execution, the bridge rejects an authority identity already present in:

- registry-level machine-owned `authority_consumption_history`;
- task-local `consumed_authority_sha256s`;
- prior machine-owned authority receipt.

Current canonical registry contains no future scoring authority, so real scoring cannot begin now.

### Substitution / race resistance

Exact tuple equality rejects branch/head/path/digest substitution.

The future workflow checks:

1. canonical authority;
2. live remote authorized branch head before retained retrieval;
3. exact checkout head;
4. exact reviewed consumer digest;
5. live remote head again before consumer exposure;
6. live remote head again before publication commit;
7. publication parent equals authorized head;
8. live remote head again before non-force push.

A branch race therefore fails closed.

### Untrusted code

- workflow is not `pull_request_target`;
- PR events run preflight only;
- credentialed jobs are gated behind trusted push proof or main `workflow_dispatch`;
- authorized scoring requires canonical main dispatch;
- arbitrary fork/PR code cannot receive provider credentials.

### Publication / consumption

Future execution publishes:

- distinct execution status;
- result terminal;
- decision status;
- terminal summary;
- authority-consumption receipt.

Result failure such as `VALIDATION_FAILED` remains distinct from execution failure.

If protected execution raises before staging/push, package/sandbox state is deleted and no receipt is published.

The publication commit:

- is exactly one commit whose parent is the authorized head;
- is pushed without force;
- contains only validated `.ai/research/generated/RETURNING_PLAYER_V21_*.json` evidence.

The receipt binds:

- task;
- canonical authority SHA;
- branch;
- authorized head;
- consumer path/SHA;
- workflow run ID;
- execution status;
- result terminal;
- decision status;
- payload SHA;
- one-publication requirement.

Canonical Workflow V3.5 Manager transition tooling later performs the stronger committed receipt/terminal/payload/live-run verification before recording consumption.

## 11. Known external integration blocker

Fresh inspection of canonical main `scripts/workflow-manager-transition.mjs` confirms two exact legacy workflow-name checks:

- committed-consumption verification requires `verifiedRun.name === 'WR-083 Protected Historical Scoring Bridge'`;
- live workflow-run verification requires `run.name === 'WR-083 Protected Historical Scoring Bridge'`.

The new workflow name is:

`WR-097 Returning-Player v2.1 Protected Scoring Bridge`.

Therefore:

1. **real WR-097/v2.1 authority consumption currently fails closed** in canonical Manager transition tooling;
2. **WR-097 correctly remained within scope** and did not modify Manager/shared transition authority;
3. **a separate Manager-controlled integration change is required** before real scoring;
4. **that Manager transition change is material to the protected execution boundary and must receive fresh independent audit before any real validation scoring authority is issued**.

This blocker is safety-positive in the current state: it makes real scoring/consumption impossible rather than weakening authority verification.

It is not a WR-097 audit finding because the task explicitly excluded Manager tooling and required the external mismatch to remain fail-closed until separately integrated/audited.

## 12. Publication contract

The combined consumer/bridge permits exactly these v2.1 families:

- `RETURNING_PLAYER_V21_KEY_MANIFEST`
- `RETURNING_PLAYER_V21_FEATURE_SURFACE`
- `RETURNING_PLAYER_V21_PREPROCESSING_STATES`
- `RETURNING_PLAYER_V21_MODEL_STATES`
- `RETURNING_PLAYER_V21_PREDICTIONS_PRE_OUTCOME`
- `RETURNING_PLAYER_V21_EVALUATIONS`
- `RETURNING_PLAYER_V21_STAGE_GATES`
- `RETURNING_PLAYER_V21_ENVIRONMENT_LOCK`
- `RETURNING_PLAYER_V21_EXECUTION_CHRONOLOGY`
- `RETURNING_PLAYER_V21_RESULT_MANIFEST`
- `RETURNING_PLAYER_V21_TERMINAL_RESULT`
- `RETURNING_PLAYER_V21_AUTHORITY_CONSUMPTION_RECEIPT`.

Consumer modes are further narrowed:

- readiness: no publication family;
- predict: key/feature/preprocessing/model/pre-outcome prediction/environment evidence only;
- target ingest: evaluations only;
- stage gate: stage-gate evidence only.

Bridge validation rejects:

- non-`.ai/research/generated/` paths;
- non-JSON output;
- traversal;
- arbitrary families;
- duplicate paths;
- digest/size mismatch;
- output matching retained raw source digest+size;
- exact-byte equality with any same-size retained raw source;
- credential-bearing JSON keys.

Previously frozen path identities cannot mutate during the execution package build.

Confirmation evidence cannot be generated before a complete PASS validation gate because confirmation prediction itself requires the locked PASS validation gate.

## 13. Predecessor / release preservation

WR-097 does not modify the accepted WR-083 workflow/script/tests.

Final frozen-head regression evidence:

- WR-046 run `35418107211` — SUCCESS; contract preflight `105830548366` SUCCESS;
- WR-063 run `35418107209` — SUCCESS; contract preflight `105830548620` SUCCESS;
- WR-069 run `35418107234` — SUCCESS; contract preflight `105830548550` SUCCESS;
- WR-083 run `35418107218` — SUCCESS; preflight `105830548753` SUCCESS.

Credentialed predecessor jobs are skipped on the ordinary final-head event, as intended.

WR-097 final-head preflight itself runs and passes the accepted retained-reader, WR-069, and WR-083 regression suites.

Release validation remains fail-closed through exact workflow allowlist equality; the only release-guard change is adding the Manager-approved WR-097 workflow name.

No weakening of WR-046/063/069/083 or canonical V3.5 authority/replay behavior was identified.

## 14. Exact final-head evidence

Frozen target:

`75c0fbcd518438a226a8c49e3e11951de3944638`

Full War Room CI:

`35418107240` — SUCCESS

Jobs:

- classify `105830548278` — SUCCESS;
- governance `105830573914` — SUCCESS;
- bootstrap reuse `105830574701` — SKIPPED;
- full test `105830601522` — SUCCESS.

The full test executes `npm test`, including release validation and the ordinary product/regression suite.

WR-097 protected workflow:

`35418107206` — SUCCESS

- preflight `105830548445` — SUCCESS;
- trust gate `105830670301` — SKIPPED;
- future-authorized scoring `105830670497` — SKIPPED;
- protected no-scoring readiness `105830670554` — SKIPPED.

Those skips are expected on the ordinary frozen-head event.

Final-head protected preflight independently passes:

- exact authority/source count 14;
- synthetic chronology;
- sandbox isolation;
- consumer conformance;
- bridge V3.5/security regressions;
- WR-063 boundary regressions;
- WR-069 boundary regressions;
- WR-083 bridge regressions;
- release guard.

## 15. Boundary verification

No evidence was found of WR-097 performing:

- real 2022–2023 validation scoring;
- real 2024–2025 confirmation scoring;
- 2022–2025 target exposure;
- 2026 regular-season outcome inspection;
- Ridge fitting on real retained data;
- real model prediction publication;
- real baseline/result comparison;
- real validation/confirmation gate evaluation;
- real `future_execution_authority` creation;
- real authority consumption;
- production/ranking/recommendation changes;
- season-total composition;
- Phase 6 work.

The credentialed readiness proof did retrieve and re-hash accepted retained source bytes, as explicitly authorized, but did not parse those rows through the v2.1 model consumer or expose target outcomes.

## 16. Disposition

WR-097 faithfully implements the accepted v2.1 model semantics and protected execution boundary.

The implementation is audit-ready and safe to integrate only under Manager authority, followed by the required canonical-main NO-SCORING canary.

Real validation scoring must remain blocked until:

1. Manager integrates only the exact audited WR-097 target;
2. canonical-main NO-SCORING canary succeeds;
3. Manager implements the separate workflow-name/transition integration;
4. that material Manager transition change receives a fresh independent audit;
5. Manager separately creates one-time exact validation scoring authority.

This PASS does not perform or authorize any of those later actions.

Final verdict: `PASS`.
