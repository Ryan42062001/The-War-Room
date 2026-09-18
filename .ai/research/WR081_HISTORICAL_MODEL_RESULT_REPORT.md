# WR-081 — Returning-Player v2 Historical Model Result

Status: **FROZEN RESULT — READY FOR MANAGER FREEZE / WR-082 INDEPENDENT AUDIT**

Task: `WR-081 — Returning-Player v2 Historical Model Scoring + Result Evidence`

Branch: `wr-081-v2-historical-model-scoring-execution`  
PR: #251  
Protected-evidence head: `c586394bfe01d70b23c499c12902c712e591c627`  
Canonical protected workflow run: `35402528405`

## Terminal result

The protected execution completed successfully as an execution and terminated under the frozen WR-072 model protocol at the validation gate.

- Development gate: **PASS**
- Validation gate: **FAIL**
- Terminal: **`VALIDATION_FAILED`**
- Status: **`BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE`**
- Confirmation seasons 2022–2025: **NOT EXPOSED / NOT SCORED**
- Confirmation bootstrap: **NOT RUN**
- Rerun/tuning authorization: **NONE**

This is the exact frozen model result. It is not a technical bridge failure and it is not permission to tune, rerun, change thresholds, substitute data, or inspect confirmation outcomes.

## Frozen authority bindings

- Source snapshot: `wr-returning-player-v2-source-snapshot/1.2.0-wr059`
  - SHA-256: `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`
- Cohort: `returning-player-v2-cohort/1.2.0-wr059`
  - SHA-256: `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`
- Protocol: `returning-player-v2-model-protocol/1.2.0-wr072`
- Result gates: `returning-player-v2-result-gates/1.2.0-wr072`
- Protocol machine-lock SHA-256: `aed044e6b7df9684153181a7a97a47a86c50ce9049db063ecdd8a973b1a832b6`
- Source identity-set SHA-256: `8cbe874b3ceea141cbb9fedb2198ffa940ee218fe4556feace7afd8bbfb89351`
- Protected consumer: `.ai/research/WR081_PROTECTED_SCORING_CONSUMER.py`
- Consumer SHA-256: `54ccf15ebf542bff182927c946b4ce37fd0c294d4b95f4cf595c3428ec64b2c4`
- Manager authority SHA-256: `559376a52a8fb807bcb8934aae8eef15edcfb4cfbe3be93c5dd021cb6a7f5037`
- Authorized pre-execution head: `45d6b22104e4647d04dfc37d01ab69619caed0c1`

## Protected workflow evidence

Canonical protected workflow run `35402528405` / run #40:

- preflight job `105785318084` — **SUCCESS**
- trust-gate job `105785424103` — **SUCCESS**
- future-authorized-wr081-scoring job `105785451305` — **SUCCESS**
- protected-no-scoring-proof job `105785452773` — **SKIPPED**
- Actions artifacts: **0**

The protected workflow accepted the exact Manager-reviewed branch/head/path/digest identity, retrieved the exact retained source set under the accepted read-only boundary, executed the reviewed consumer, committed only consumer-declared `.ai/research/**` evidence, passed the pre-push remote-head checks, pushed non-force, and cleaned retained raw bytes after execution.

## Chronology

The committed chronology records exactly:

1. 2018 prediction locked.
2. 2018 target exposed only after that lock.
3. 2019 prediction locked.
4. 2019 target exposed only after that lock.
5. Development gate **PASS**.
6. 2020 prediction locked.
7. 2020 target exposed only after that lock.
8. 2021 prediction locked.
9. 2021 target exposed only after that lock.
10. Validation gate **FAIL**.
11. Terminal `VALIDATION_FAILED`.

There are no 2022, 2023, 2024, or 2025 prediction-lock, target-exposure, evaluation, or confirmation-gate events. No confirmation evidence files exist.

## Development gate — PASS

Frozen development metrics:

| Gate | Frozen value | Threshold | Result |
| --- | ---: | ---: | --- |
| MAE lift | `0.039183085603290639` | `>= 0.01` | PASS |
| RMSE regression | `-0.057195547234079262` | `<= 0.01` | PASS |
| Max eligible position MAE regression | `0.035116991102853899` | `<= 0.05` | PASS |
| Mean season MAE delta | `-0.1271118975086778` | `<= 0` | PASS |
| Fallbacks | `0` | `= 0` | PASS |
| Lineage failures | `0` | `= 0` | PASS |

Pooled development candidate MAE was `3.1145802908984912` versus primary-baseline MAE `3.2415960254551885`. Development evaluable row count was 442.

## Validation gate — FAIL

Frozen validation metrics and gate dispositions:

| Gate | Frozen value | Threshold | Result |
| --- | ---: | ---: | --- |
| MAE lift | `0.02136061188881869` | `>= 0.005` | PASS |
| RMSE regression | `0.43477243995981046` | `<= 0.01` | **FAIL** |
| Weighted Spearman delta | `0.015385257730562873` | `>= -0.01` | PASS |
| Weighted rank-MAE regression | `0.0054274084124830207` | `<= 0.02` | PASS |
| Max eligible position MAE regression | `0.17330031196564874` | `<= 0.05` | **FAIL** |
| Max season MAE regression | `0.034878242776191039` | `<= 0.05` | PASS |
| Fallbacks | `0` | `= 0` | PASS |

The max eligible position regression is the WR cell: candidate MAE `3.2044021732510055` versus primary-baseline MAE `2.7311014414396766`, regression `0.17330031196564874`.

Pooled validation candidate MAE was `2.9931343393335581` versus primary-baseline MAE `3.0584650236799114`, but pooled candidate RMSE was `6.1232819431425964` versus primary-baseline RMSE `4.2677722073572282`. Validation evaluable row count was 485.

The frozen validation artifact labels the result `BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE`. The failed gates are preserved exactly and are not reinterpreted.

## Per-season target evidence

- 2018: 419 cohort keys; 222 OBSERVED targets; 197 TARGET_UNAVAILABLE; 0 fallbacks.
- 2019: 444 cohort keys; 220 OBSERVED targets; 224 TARGET_UNAVAILABLE; 0 fallbacks.
- 2020: 437 cohort keys; 241 OBSERVED targets; 196 TARGET_UNAVAILABLE; 0 fallbacks.
- 2021: 435 cohort keys; 244 OBSERVED targets; 191 TARGET_UNAVAILABLE; 0 fallbacks.

## Evidence manifest

The exact generated protected files from head `c586394bfe01d70b23c499c12902c712e591c627` are hash-bound in:

`.ai/research/WR081_RESULT_EVIDENCE_MANIFEST.json`

That manifest is the deterministic inventory for WR-082 verification.

## Scope attestation

After the protected execution completed, R&D only packaged the already-committed frozen result.

No:
- protected scoring rerun;
- model tuning or hyperparameter search;
- alpha/feature/preprocessing/baseline/gate/threshold/chronology/bootstrap/ordering change;
- confirmation-data inspection;
- 2026-outcome inspection;
- source reacquisition, substitution, or refresh;
- provider credential access;
- season-total composition;
- production/ranking/recommendation modification;
- Phase-6 work;
- PR merge;
- WR-082 activation.

Manager owns exact-result freeze and WR-082 activation.
