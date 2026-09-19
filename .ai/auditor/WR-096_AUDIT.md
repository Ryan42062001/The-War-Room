# WR-096 — Independent Audit of Returning-Player v2.1 Protocol Candidate

TASK ID: WR-096  
ROLE: Independent Auditor / QA  
CANONICAL WORKFLOW: V3.5  
EXECUTION MODE: STANDARD_CHAT_HIGH  
REFRESH MODE: FAST_REFRESH  
AUDIT TARGET TASK: WR-095  
TARGET PR: #270  
TARGET BRANCH: `wr-095-returning-player-v21-failure-analysis-protocol`  
EXACT FROZEN TARGET: `738296ad38282fc91738203e7e1ced888ba862ed`  
PROTOCOL CANDIDATE: `returning-player-v2.1-model-protocol-candidate/1.0.0-wr095`  
MACHINE SHA-256: `5c86dacac044538422ca24fbeb13eaee3161050f917acc40f0dbdc1ca6547a39`  
CANONICAL MAIN VERIFIED: `15f5a668e2cf5752e24335a653db7cbc652476b9`  
AUDIT BRANCH START: `add2aead393a3b5a1217d2408c5cc1b2693a7a7a`

## Final verdict

`PASS`

Findings:

- CRITICAL: none
- HIGH: none
- MEDIUM: none
- LOW: none

This is a protocol-candidate audit only. It does not authorize scoring, retained-source access, 2022–2025 outcome exposure, production/ranking changes, season-total composition, or Phase 6.

## 1. Exact-target / lane pinning

Live repository/GitHub verification established before substantive audit:

- canonical `main` exactly `15f5a668e2cf5752e24335a653db7cbc652476b9`;
- WR-096 assigned branch initially exactly `add2aead393a3b5a1217d2408c5cc1b2693a7a7a`;
- initial audit branch is one commit behind current main with zero file differences;
- WR-095 target branch exactly `738296ad38282fc91738203e7e1ced888ba862ed`;
- PR #270 OPEN and unmerged at exact head `738296ad38282fc91738203e7e1ced888ba862ed`;
- active registry binds WR-096 to WR-095 / PR #270 / exact branch / exact SHA;
- canonical `.ai/shared/WORKFLOW.md` says Workflow V3.5 is ACTIVE / CANONICAL.

The audit did not follow later movement of PR #270 or its branch.

## 2. Exact WR-095 scope

PR #270 changes exactly:

1. `.ai/research/HANDOFF.md`
2. `.ai/research/WR095_V21_FAILURE_ANALYSIS.md`
3. `.ai/research/WR095_V21_PROTOCOL_PROPOSAL.md`
4. `.ai/research/generated/WR095_RETURNING_PLAYER_V21_PROTOCOL_CANDIDATE.json`
5. `.ai/research/generated/WR095_RETURNING_PLAYER_V21_PROTOCOL_CANDIDATE.json.sha256`

No scripts, workflows, Manager/shared control plane, Auditor evidence, product code, ranking/recommendation code, public assets, custody/provider implementation, or composition surfaces changed.

The six WR-095 commits are protocol/prose/checksum/handoff commits only. No protected scoring workflow is associated with the WR-095 target.

## 3. Admissible historical authority

The failure analysis was independently reconstructed only from accepted/frozen historical evidence:

- WR-059 source snapshot:
  `wr-returning-player-v2-source-snapshot/1.2.0-wr059`
  / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`;
- WR-059 cohort:
  `returning-player-v2-cohort/1.2.0-wr059`
  / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`;
- WR-072 protocol:
  `returning-player-v2-model-protocol/1.2.0-wr072`;
- WR-072 machine lock:
  `aed044e6b7df9684153181a7a97a47a86c50ce9049db063ecdd8a973b1a832b6`;
- exact WR-081 frozen result:
  `b5fc0974e0766c24974034557a62044b4752716a`.

WR-059 independently confirms:

- exactly 14 admitted annual Player Summary Stats sources, seasons 2012–2025;
- zero admitted Players metadata sources;
- one failed-closed Players metadata source;
- draft-picks source excluded / unused;
- 5,176 cohort keys, 5,176 unique, duplicate count 0;
- target seasons 2014–2025;
- membership determined from prior-season REG QB/RB/WR/TE Player Summary Stats;
- no target-season participation criterion.

The accepted source schema contains all source fields needed by the 28 WR-072 features. No new source is required by the v2.1 transformations/model semantics.

## 4. WR-081 pooled validation reconstruction

From exact OBSERVED rows in immutable 2020 and 2021 WR-081 evaluation evidence:

- evaluable validation rows: 485;
- candidate MAE: `2.993134339333557`;
- primary baseline MAE: `3.0584650236799114`;
- candidate RMSE: `6.123281943142595`;
- primary baseline RMSE: `4.267772207357228`;
- candidate SSE: `18184.872151279833`;
- baseline SSE: `8833.73161273703`;
- candidate-minus-baseline SSE gap: `9351.140538542802`;
- candidate lower absolute error: 264 rows;
- baseline lower absolute error: 221 rows.

These reproduce the frozen validation gate to floating-point tolerance:

- MAE lift `0.02136061188881869` — PASS;
- RMSE regression `0.43477243995981046` — FAIL;
- weighted Spearman delta `+0.015385257730562873` — PASS;
- weighted rank-MAE regression `0.0054274084124830207` — PASS;
- max eligible position MAE regression `0.17330031196564874` (WR) — FAIL;
- max season MAE regression `0.034878242776191039` — PASS;
- fallbacks 0;
- lineage failures 0.

Therefore the evidence supports the narrower statement that ordinary pooled MAE and frozen ordering gates were not broadly failing, while squared-error magnitude risk and WR position MAE were failing.

## 5. Position-level validation reconstruction

Exact pooled 2020–2021 validation metrics:

| Position | n | Candidate MAE | Baseline MAE | Candidate RMSE | Baseline RMSE |
| --- | ---: | ---: | ---: | ---: | ---: |
| QB | 74 | 4.013084 | 4.560839 | 5.034799 | 6.214869 |
| RB | 127 | 2.890331 | 3.466813 | 3.679863 | 4.468703 |
| WR | 185 | 3.204402 | 2.731101 | 8.676673 | 3.813635 |
| TE | 99 | 1.967833 | 2.023378 | 2.585140 | 2.750215 |

QB, RB and TE improve on both MAE and RMSE. WR carries the failed position-MAE gate and the extreme RMSE deterioration.

## 6. Exact catastrophic 2021 WR row

Frozen row:

- target season: 2021;
- position: WR;
- player ID: `00-0035864`;
- candidate: `-105.44209159462447`;
- primary persistence baseline: `-2.7799999999999998`;
- target: `3.5036363636363634`;
- candidate residual: `-108.94572795826083`;
- baseline residual: `-6.283636363636363`;
- candidate squared error: `11869.171640355376`;
- baseline squared error: `39.48408595041322`.

Independent concentration:

- row = `65.26948081688899%` of all candidate validation SSE;
- row = `85.22012734440817%` of WR candidate validation SSE;
- row excess SSE = `11829.687554404964`;
- row excess SSE = `126.50529104600962%` of the entire candidate-minus-baseline validation SSE gap.

The >100% gap contribution is mathematically coherent because the remaining rows collectively outperform baseline on SSE.

## 7. Diagnostic exclusion — analysis only

Removing that one row diagnostically, with no claim that it should be excluded prospectively:

All other validation rows (n=484):

- candidate MAE `2.7742240219390797` vs baseline `3.051801446531241`;
- candidate RMSE `3.6123355322807185` vs baseline `4.2626204272236015`;
- candidate SSE `6315.700510924466` vs baseline `8794.247526786618`.

All other WR validation rows (n=184):

- candidate MAE `2.6297210548542136` vs baseline `2.711794186427738`;
- candidate RMSE `3.3447645395702317` vs baseline `3.795822349867736`;
- candidate SSE `2058.4907678306295` vs baseline `2651.1211853629975`.

2021 WR excluding the row (n=90):

- candidate MAE `2.7517350432450884` vs baseline `2.81793599844237`;
- candidate RMSE `3.5133140637267357` vs baseline `4.044832909281131`.

The proposed v2.1 protocol contains no player-specific exclusion and explicitly forbids row-specific exclusions.

## 8. Ordinary-error / tail concentration

Independent validation absolute-error quantiles:

| Quantile | Candidate | Baseline |
| --- | ---: | ---: |
| Median | 2.203670 | 2.100000 |
| P75 | 3.794490 | 4.313333 |
| P90 | 5.682014 | 6.781429 |
| P95 | 7.361045 | 9.102400 |
| P99 | 11.338322 | 12.517636 |

Candidate median is slightly worse, but P75/P90/P95/P99 are better.

Candidate SSE concentration:

- top 1 row: 65.2695%;
- top 3: 67.2260%;
- top 5: 68.7117%;
- top 10: 71.6718%;
- top 25: 77.6429%;
- top 49 (about 10%): 83.1273%.

Baseline:

- top 25: 41.5709%;
- top 49: 57.9615%.

Absolute error >=10:

- candidate: 8 rows, 70.6311% of candidate SSE;
- baseline: 16 rows, 32.3468% of baseline SSE.

This independently supports WR-095's statement that the principal squared-error problem is tail severity/concentration, not simply a greater frequency of ordinary large errors.

## 9. Development / validation season behavior

Independent season metrics:

- 2018: candidate improves MAE and RMSE;
- 2019: candidate improves MAE and RMSE;
- 2020: candidate improves MAE and RMSE;
- 2021: candidate MAE `3.084402` vs baseline `2.980450`, while RMSE jumps to `7.799537` vs `4.339792`.

The evidence does not show smooth broad deterioration. It shows good development behavior, improvement in 2020, then a highly concentrated 2021 magnitude failure.

## 10. Catastrophic-row extrapolation mechanism

The exact 2021 WR pre-outcome feature row, preprocessing state, and Ridge model state reconstruct the recorded prediction.

Largest standardized excursions:

- `prev1_int_pg`: `+474.9322502723491σ`;
- `prev1_attempts_pg`: `+299.2946397363479σ`;
- `prev1_pass_epa_pg`: `-236.94148511656445σ`;
- `prev1_pass_yards_pg`: `+22.93736140692763σ`.

Largest linear contributions:

- attempts/game: `-40.91635052202686`;
- passing EPA/game: `-38.8333492838271`;
- interceptions/game: `-27.32404215135834`.

Top-three contribution sum:

`-107.0737419572123`.

Using the exact WR intercept and all 28 coefficient contributions reconstructs:

`-105.4420915946245`

versus recorded:

`-105.44209159462447`.

Difference is only binary64 rounding noise.

Maximum absolute WR standardized feature excursions by target year independently reconstructed:

- 2018: 18.4866σ;
- 2019: 52.9084σ;
- 2020: 19.6624σ;
- 2021: 474.9323σ.

Conclusion:

- **VERIFIED FACT:** the catastrophic prediction is directly produced by extreme standardized sparse passing-feature values propagating through an unbounded linear level model;
- **STRONG EVIDENCE:** the universal stats schema plus per-position standardization creates a fragile extrapolation surface for structurally sparse cross-role features;
- **INFERENCE:** this is better characterized as a preprocessing/model-robustness problem than a broad ordering problem;
- **UNKNOWN:** whether the same mechanism recurs in untouched 2022–2025 outcomes.

Causal language beyond that is not warranted.

## 11. Evidence-label audit

WR-095's labels are appropriately calibrated.

### VERIFIED FACT

Claims labeled VERIFIED FACT are directly reproducible from frozen rows/gates/model states, including:

- pooled MAE/RMSE behavior;
- catastrophic-row SSE shares;
- remaining-row SSE comparison;
- position/season metrics;
- ranking-gate results;
- exact z-score/model reconstruction.

### STRONG EVIDENCE

Claims about the primary failure mechanism being tail/extrapolation concentrated and sparse per-position z-score fragility are strongly supported by the reconstructed evidence but are not stated as universal causal certainty.

### INFERENCE

Claims about residual formulation/model-specification implications are properly labeled as inference.

### SPECULATION

Alternative model-family superiority and position-specific feature deletion are explicitly speculative.

### UNKNOWN

Future 2022–2025 performance and recurrence of the mechanism are explicitly UNKNOWN.

No evidence-label inflation requiring a finding was identified.

## 12. Contamination / post-hoc audit

The protocol explicitly records:

- 2018–2021 = DESIGN-EXPOSED;
- none of 2018–2021 is called untouched validation or confirmation for v2.1;
- future validation = 2022–2023;
- future confirmation = 2024–2025 only after full validation PASS.

Repository evidence for WR-095 contains no 2022–2025 result/scoring artifacts. PR #270 contains only the five protocol/analysis/checksum/handoff files. No protected scoring workflow ran for WR-095.

The diagnostic catastrophic-row exclusion is analysis-only. The prospective protocol explicitly forbids row-specific exclusions.

No hyperparameter search evidence exists:

- one protocol candidate;
- candidate count 1;
- parameter search false;
- Ridge alpha remains 100;
- no z-threshold search;
- no residual-cap multiplier search;
- no feature-subset search;
- no alternate-family search.

No accepted WR-072 performance threshold was relaxed.

No evidence of 2026 regular-season outcome inspection was found. WR-095 attestations explicitly prohibit it, and the PR contains no 2026 result/scoring evidence.

## 13. Prospective architecture audit

Candidate:

`PER_POSITION_BOUNDED_RESIDUAL_RIDGE`

Exact semantics independently confirmed in human and machine contracts:

1. same accepted WR-059 cohort/source authority;
2. same 28 WR-072 stats-only feature formulas;
3. separate QB/RB/WR/TE models;
4. same per-position StandardScaler;
5. standardized input clamp `[-6,+6]`;
6. same clipping on training and prediction matrices;
7. Ridge alpha=100 with accepted deterministic SVD settings;
8. training target `target_ppr_pg - prev1_ppr_pg`;
9. residual center = median training residual;
10. MAD = median absolute deviation from that center;
11. robust sigma = `1.4826 * MAD`;
12. residual lower/upper = center ± `3 * robust_sigma`;
13. raw residual prediction is clamped to those bounds;
14. final candidate = persistence baseline + bounded residual adjustment;
15. no hyperparameter search;
16. no WR-specific/player-specific exception.

Human and machine semantics materially match.

## 14. Adversarial design review

### z=6

Acceptable prospective fixed engineering constant.

The choice is motivated by already design-exposed evidence, but it was not selected through a performance search. It is:

- row-generic;
- feature-generic;
- position-generic;
- fixed before future outcome exposure;
- far below the known hundreds-of-sigma failure while still allowing unusually wide standardized support.

It is not proven optimal. Untouched future validation remains necessary.

### 3 × robust sigma

Acceptable prospective robust-scale constant.

`1.4826 * MAD` is the declared robust scale and multiplier 3 is frozen before future exposure. There is no evidence of candidate-search optimization over exposed outcomes.

It is not proven optimal and may fail untouched validation.

### Invalid / zero MAD

Human §8 requires finite `robust_sigma > 0` and says zero/nonfinite scale fails closed rather than inventing a cap.

Human §9 and the machine contract classify invalid residual scale as explicit `PREV1_PPR_PG` fallback.

These provisions are coherent when read together:

- the learned fold does not silently continue with an invented scale/cap;
- it degrades explicitly to the declared baseline fallback;
- the fallback is recorded;
- prospective support requires `fallbacks=0`, so such a fold cannot promote the candidate.

No silent repair is authorized.

### Bound invariants

- clipping must be identical in fit/predict or execution fails closed;
- residual bound is explicit and deterministic;
- evidence must record raw residual, center, scale, lower/upper, bounded adjustment;
- final-adjustment-outside-bound is fatal;
- fallback status/reason is explicit.

### Target leakage

No accidental target double-use is introduced.

For target season Y:

- model features use completed Y-1/Y-2 source facts;
- baseline is Y-1 PPR/game;
- residual target is formed only from prior OBSERVED training outcomes;
- Y target cannot be exposed before immutable Y prediction/model/preprocessing state;
- no Y or future target may enter Y training.

The baseline appearing both as a predictor-derived feature context and as the residual anchor is not target leakage because both are prior-season information.

### Minimum support

Minimum 25 OBSERVED same-position training rows is inherited/coherent. Insufficient support produces explicit baseline fallback, and any prospective fallback blocks support.

## 15. Prospective chronology / leakage audit

Validation:

- 2022;
- 2023.

Exact required sequence:

1. fit 2022 from prior OBSERVED training only;
2. lock complete 2022 prediction/model/preprocessing state;
3. expose 2022 target;
4. only after that lock may 2022 OBSERVED outcomes enter 2023 training;
5. fit/lock 2023;
6. expose 2023 target;
7. evaluate the complete 2022–2023 validation gate.

This 2022→2023 rolling update is not leakage because 2022 is a prior season by the time the 2023 model is fit, and 2022's own prediction was immutable before 2022 outcome exposure.

Confirmation:

- 2024;
- 2025.

Confirmation requires the complete validation stage PASS. Passing 2022 individually is not sufficient; there is no 2022-only promotion gate.

If 2022–2023 validation fails, terminal is `VALIDATION_FAILED` and 2024–2025 outcomes remain unopened.

The chronology was committed while WR-095 still contained no 2022–2025 outcome exposure; therefore it precedes any future exposure.

## 16. Gate preservation / semantic coherence

WR-095 preserves WR-072 validation thresholds numerically:

- MAE lift >= 0.005;
- RMSE regression <= 0.01;
- weighted Spearman delta >= -0.01;
- weighted rank-MAE regression <= 0.02;
- max eligible position MAE regression <= 0.05;
- max season MAE regression <= 0.05;
- fallbacks = 0;
- lineage failures = 0.

WR-095 preserves WR-072 confirmation thresholds numerically:

- MAE lift >= 0.005;
- bootstrap 95% upper candidate-minus-primary MAE delta <= 0;
- max eligible position MAE regression <= 0.05;
- >=3 positions non-worse on MAE;
- mean season MAE delta <= 0;
- max season MAE regression <= 0.05;
- weighted Spearman delta >= -0.01;
- weighted rank-MAE regression <= 0.02;
- minimum evaluable rows each position >=30;
- fallbacks = 0;
- lineage failures = 0;
- MAE regression versus every secondary baseline <= 0.01.

Only the future stage years change.

The residual architecture does not make the inherited gates incoherent: final candidate predictions remain expected PPR/game on the same cohort and identical candidate/baseline row universes. MAE, RMSE, position/season comparisons, ordering metrics, and bootstrap deltas retain the same interpretation.

Mandatory tail diagnostics are explicitly evidence diagnostics, not hidden promotion gates. RMSE remains the predeclared tail-sensitive performance gate.

## 17. Machine contract

Exact machine artifact:

`.ai/research/generated/WR095_RETURNING_PLAYER_V21_PROTOCOL_CANDIDATE.json`

Independent byte checks:

- sorted-key compact JSON: exact;
- final LF: present;
- independently recomputed SHA-256:
  `5c86dacac044538422ca24fbeb13eaee3161050f917acc40f0dbdc1ca6547a39`;
- expected SHA: exact match;
- adjacent sidecar: exact match.

Human/machine cross-check materially matches for:

- candidate IDs/version encoded in IDs;
- source/cohort authority;
- exact ordered 28-feature schema;
- preprocessing/scaler;
- fit/predict z clipping;
- Ridge configuration;
- residual target;
- MAD/robust sigma/bounds;
- primary/secondary baselines;
- minimum support/fallback rules;
- rolling training window;
- 2022–2023 validation chronology;
- 2024–2025 confirmation chronology;
- result gates;
- confirmation bootstrap;
- metrics/tail diagnostics;
- environment;
- seeds;
- evidence contract;
- fail-closed rules;
- publication contract;
- source/custody disposition.

No material human/machine ambiguity requiring a finding was identified.

## 18. Source/custody disposition

`EXISTING_ACCEPTED_SOURCE_SUFFICIENT` is independently justified.

The v2.1 candidate:

- retains the exact 28 WR-072 features;
- requires only fields already admitted in the 14 WR-059 Player Summary Stats sources;
- adds only deterministic feature clipping, residual target transformation, Ridge residual fit, and robust residual bounding;
- requires no Players metadata;
- requires no draft capital;
- requires no market data;
- requires no external projection source;
- requires no new provider field.

No source reacquisition/substitution is necessary for the protocol.

## 19. WR-095 boundary verification

No evidence was found of:

- WR-081 rerun;
- model fitting;
- model scoring;
- hyperparameter search;
- retained raw source access;
- source reacquisition/substitution;
- 2022–2025 target exposure;
- 2026 regular-season outcome inspection;
- production/ranking/recommendation change;
- season-total composition;
- Phase 6 work.

Supporting repository facts:

- PR #270 contains only five protocol/analysis/handoff/checksum files;
- no scripts/workflows/product files changed;
- no protected scoring workflow run exists for WR-095 target;
- machine and human attestations declare all forbidden execution actions false;
- no future-result artifact is published.

This audit did not inspect or expose 2022–2025 outcomes.

## 20. Exact-head CI

WR-095 exact target `738296ad38282fc91738203e7e1ced888ba862ed` has War Room CI:

Run `35414874364` — SUCCESS

- classify `105821418559` — SUCCESS;
- governance `105821435920` — SUCCESS;
- bootstrap reuse `105821436550` — SKIPPED;
- product test `105821467634` — SKIPPED as research-only;
- Actions artifacts: 0.

CI is consistent with the exact research-only target and does not constitute scoring authority.

## 21. Safe future sequence

The protocol preserves the required sequencing:

1. WR-096 protocol audit;
2. Manager protocol acceptance;
3. separately authorized protected consumer/bridge implementation if needed;
4. independent audit of material protected-execution changes;
5. one-time Manager exact scoring authority;
6. locked 2022 then 2023 validation execution;
7. full validation gate;
8. only if validation PASS, locked 2024 then 2025 confirmation;
9. confirmation gate/bootstrap;
10. fresh independent result audit;
11. season-total composition;
12. independent composition audit;
13. Phase 6 only after accepted composition.

No audit step here authorizes any later step automatically.

## 22. Auditor boundary / disposition

The Auditor:

- did not modify PR #270;
- did not merge PR #270;
- did not create scoring authority;
- did not retrieve retained raw source bytes;
- did not expose 2022–2025 outcomes;
- did not inspect 2026 regular-season outcomes;
- did not fit or score the v2.1 model;
- did not change production/rankings/recommendations/composition;
- wrote only `.ai/auditor/**`.

Manager may consume this PASS only for exact WR-095 SHA:

`738296ad38282fc91738203e7e1ced888ba862ed`.

This PASS accepts the protocol candidate for Manager disposition. It does not establish model performance on 2022–2025 and does not grant scoring/production authority.

Final verdict: `PASS`.
