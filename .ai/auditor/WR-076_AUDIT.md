# WR-076 — Fresh Re-Audit of Remediated Returning-Player v2 Model Protocol

Date: 2026-09-16

Role: Independent Auditor / QA

Workflow: V3.2

Execution mode: STANDARD_CHAT

Audit branch: `wr-076-v2-model-protocol-feature-schema-reaudit`

Canonical main / prepared branch at audit start: `f04326ce01b1fc25fc5fc217ec3e2b6ac44eb8f4`

Audited target: WR-072 / PR #207

Frozen audited remediation head: `95b1fdfb36ffc7b865597bf7131fa1dd9f45ae73`

Historical failed-audit head: `d75e58052dd555cd5b3f952fc2b3556287d75f9a`

## Final verdict

FAIL — REMEDIATION REQUIRED

The bounded WR-073-AUD-01 remediation materially improves deterministic bootstrap and result-gate specification and preserves the previously accepted source/cohort/feature/target/outcome-isolation boundary. Two remaining pre-score defects prevent a PASS-family verdict: one HIGH gate-sign/operand-role ambiguity that can invert promotion decisions, and one MEDIUM conformance-evidence gap that makes the claimed synthetic bootstrap fingerprint independently unreproducible from the frozen target.

## Exact-target discipline

Before substantive work:

- canonical `main` resolved to `f04326ce01b1fc25fc5fc217ec3e2b6ac44eb8f4`;
- prepared audit branch `wr-076-v2-model-protocol-feature-schema-reaudit` resolved to the same exact Manager activation commit;
- active registry assigned WR-076 to audit WR-072 PR #207, branch `wr-072-v2-model-protocol-feature-schema`, exact SHA `95b1fdfb36ffc7b865597bf7131fa1dd9f45ae73`;
- live PR #207 was OPEN, unmerged, mergeable, and still pointed exactly to `95b1fdfb36ffc7b865597bf7131fa1dd9f45ae73` before substantive audit execution.

No target movement was observed. Auditor did not modify or merge PR #207.

## Finding WR-076-AUD-01 — HIGH — result-gate operand roles are internally inconsistent

### Requirement

WR-076 requires every relative gate statistic to have exact numerator, denominator, sign, weighting, eligibility, zero/undefined/non-finite and comparison semantics, with no remaining result-dependent interpretation. The accepted WR-039 evidence contract requires model-selection gates to be fully bound before scoring.

### Frozen remediation evidence

The human remediation says:

- `Improvement=(B-C)/B`; positive means better;
- `regression=(C-B)/B`; positive means worse;
- `B=0,C=0=>0`; `B=0,C>0=>fail closed`; `B<0 fatal`.

The machine lock repeats:

- `improve`: `(B-C)/B positive better ...`;
- `regress`: `(C-B)/B positive worse ...`.

However its derived-statistic definitions call those transforms with the **candidate first** and baseline second:

- `MAE_lift`: `improve(pooled candidate MAE,primary MAE)`;
- `RMSE_regression`: `regress(pooled candidate RMSE,primary RMSE)`;
- `position_MAE_regression_ge30`: `max regress(candidate position MAE,primary position MAE)`;
- `max_season_MAE_regression`: `max regress(candidate season MAE,primary season MAE)`;
- every-secondary comparison: `regress(candidate pooled MAE,that secondary MAE)`.

Neither the human protocol nor the machine lock normatively states a positional function signature such as `improve(candidate,baseline)` or `improve(baseline,candidate)`, nor does it explicitly bind `B` and `C` to named operands in those calls.

### Independent failure demonstration

For a baseline MAE of 10 and candidate MAE of 9:

- the stated intended sign convention, “positive means better,” requires `(10-9)/10 = +0.10`;
- naively applying the written `(B-C)/B` formula to the written argument order `improve(candidate,primary)` yields `(9-10)/9 = -0.111...`.

That is not a rounding detail; it reverses the sign and can reverse a stage decision. The same inversion exists for the regression calls.

An implementation can guess that `B` always means baseline and `C` always means candidate regardless of displayed argument order, or instead treat the displayed call arguments positionally. Both interpretations are plausible from the frozen bytes. This is exactly the post-outcome interpretation freedom the remediation was intended to eliminate.

### Impact

Blocking before any fitting/scoring/evaluation. A candidate near any MAE/RMSE/position/season/secondary threshold can receive opposite gate values depending on which interpretation is chosen. Result exposure before resolving this would permit result-dependent semantic selection.

### Required remediation

Before any model fit, prediction, target join, or result inspection:

- bind exact operand roles in machine-readable form, e.g. `improve(candidate,baseline)=(baseline-candidate)/baseline` and `regress(candidate,baseline)=(candidate-baseline)/baseline`, or reverse the call order everywhere so it matches explicit `B=baseline, C=candidate` semantics;
- update every derived statistic and secondary-baseline comparison to use one unambiguous signature;
- bind zero-denominator behavior to the named **baseline** operand, not anonymous `B`;
- preserve the existing thresholds unchanged unless Manager explicitly versions a threshold change;
- regenerate a new machine-lock hash/version and require fresh independent audit before scoring.

Confidence: HIGH.

## Finding WR-076-AUD-02 — MEDIUM — synthetic bootstrap conformance fingerprint lacks a frozen input fixture

### Requirement

WR-076 required independent reproduction of:

- replicate digest `6e3fa80c05f2c51d5369c9222c57cd5decbe31affb37e7d6e6b7a6d7c644c0c4`;
- Q.025 `-1.25`;
- Q.975 `0.5`;
- gate `false`.

A conformance fingerprint is independently reproducible only if the exact privacy-safe synthetic input surface and canonical ordering are frozen along with the algorithm.

### Evidence

The remediated human protocol, machine lock and R&D handoff publish only the expected digest/endpoints/gate. The exact remediation from historical failed head to frozen target changes only:

- `.ai/research/HANDOFF.md`;
- `.ai/research/WR072_RETURNING_PLAYER_V2_MODEL_PROTOCOL.md`;
- `.ai/research/generated/WR072_RETURNING_PLAYER_V2_MODEL_PROTOCOL.json`;
- `.ai/research/generated/WR072_RETURNING_PLAYER_V2_MODEL_PROTOCOL.sha256`.

No synthetic fixture file is added. Repository search of canonical Manager/research surfaces found the conformance digest only in Manager task descriptions and the same expected-output declarations; no synthetic cluster IDs, candidate errors, primary errors, target values, row ordering fixture, or executable reference vector is published.

The machine lock's `bootstrap.synthetic` field is only `[expected_digest, expected_q025, expected_q975, expected_gate]`; it contains no fixture.

### Failure

The deterministic bootstrap procedure itself is much more specific than 1.0.0, but the advertised conformance result cannot be independently regenerated from repository evidence because the input that produced it is absent. An auditor can verify the expected output was written down, but cannot prove those values arise from the specified RNG/draw/weight/statistic/quantile algorithm.

### Impact

This does not by itself prove the production bootstrap algorithm is nondeterministic. It does mean one explicitly required WR-076 verification artifact is not independently testable and therefore cannot serve as a trustworthy implementation-conformance sentinel.

### Required remediation

Publish a privacy-safe, versioned synthetic fixture before any scoring, either embedded directly in the machine lock or in a separately hashed `.ai/research/generated/**` fixture. It should freeze at minimum:

- ordered synthetic stable keys / `(namespace, player_id)` clusters;
- row-to-cluster membership;
- candidate and primary errors or sufficient target/prediction values to derive them;
- canonical row and cluster order;
- expected 5,000 serialized replicate deltas or sufficient deterministic reference code to generate them;
- expected replicate digest, Q.025, Q.975, final RNG-state digest, and gate.

Then rerun the conformance calculation from that fixture under NumPy 2.1.3 and bind the fixture/output hashes into the next protocol lock.

Confidence: HIGH.

## Independently verified positive evidence

### Historical failed identity preserved

The historical failed target remains addressable at exact head `d75e58052dd555cd5b3f952fc2b3556287d75f9a` with adjacent sidecar:

`d2fb326875c954446b23e2761df0feaad4b814aa49dd0465277979a3c9d9bd73  WR072_RETURNING_PLAYER_V2_MODEL_PROTOCOL.json`

The remediated 1.1.0 machine lock explicitly binds:

- predecessor protocol `returning-player-v2-model-protocol/1.0.0-wr072`;
- predecessor SHA-256 `d2fb326875c954446b23e2761df0feaad4b814aa49dd0465277979a3c9d9bd73`;
- historical failed head `d75e58052dd555cd5b3f952fc2b3556287d75f9a`;
- WR-073 audit head `1188d0eb8b37fe067e693d16b88ab73e0193c8b0`, PR #210, CI `35022367158`, finding `WR-073-AUD-01`.

PR #210 independently verifies as merged historical Auditor evidence at exact head `1188d0eb8b37fe067e693d16b88ab73e0193c8b0` and records the original FAIL verdict.

### New identity and exact machine-lock hash

Changed normative protocol/result-gate bytes use new identities:

- protocol `returning-player-v2-model-protocol/1.1.0-wr072`;
- gates `returning-player-v2-result-gates/1.1.0-wr072`.

Unchanged positively audited identities remain 1.0.0:

- feature schema `returning-player-v2-feature-schema/1.0.0-wr072`;
- preprocessing `returning-player-v2-preprocessing/1.0.0-wr072`;
- serializer `returning-player-v2-evidence-serializer/1.0.0-wr072`;
- target `returning-player-v2-expected-ppr-pg-target/1.0.0-wr072`;
- candidate `returning-player-v2-ridge-stats-only-a100/1.0.0-wr072`.

The exact committed Git blob content of the 1.1.0 JSON was independently reconstructed with its final LF and SHA-256 recalculated as:

`831aed6e8cad2d760a58a3c9f5bc298891e0ed11707ecc545c9254b29110c61d`

The adjacent sidecar contains the same digest.

### Remediation scope

Independent compare:

`d75e58052dd555cd5b3f952fc2b3556287d75f9a`
→
`95b1fdfb36ffc7b865597bf7131fa1dd9f45ae73`

is exactly:

- 1 commit ahead;
- 0 behind;
- only the same four authorized `.ai/research/**` files listed above.

No production, source-custody, acquisition, model implementation, outcome table, ranking, season-total composition, workflow or Phase-6 surface is changed.

### Bootstrap mechanics apart from conformance-fixture gap

The remediation now uniquely freezes the principal bootstrap mechanics:

- confirmation seasons 2022–2025;
- same pooled confirmation MAE row universe;
- cluster key `(namespace, player_id)` / human equivalent `(player_id_namespace, player_id)`;
- unique cluster ordering by UTF-8 bytes of compact JSON `[namespace,id]`;
- stable row order retained;
- K>=2;
- NumPy 2.1.3 `Generator(PCG64(72073))`, constructed once and never reseeded;
- exactly 5,000 calls to `rng.integers(0,K,size=K,dtype=numpy.int64,endpoint=False)`;
- replacement sampling;
- multiplicity via `np.bincount(..., minlength=K)`;
- each cluster multiplicity weights every row in that cluster;
- replicate statistic is candidate weighted MAE minus primary weighted MAE;
- `math.fsum` frozen accumulation order;
- finite/degenerate fail-closed behavior;
- `numpy.quantile(...,[0.025,0.975],method='linear')`;
- equivalent explicit interpolation formula;
- confirmation gate Q(.975) <= 0.0, inclusive and unrounded;
- evidence serialization for cluster universe, 5,000 `.17g` deltas, final bit-generator state and endpoints.

No remaining RNG/resampling/quantile ambiguity was found beyond the absent published conformance fixture.

### Aggregation / ordering mechanics apart from WR-076-AUD-01

The lock now explicitly freezes:

- MAE and RMSE formulas using finite binary64, CPython 3.12.7, `math.fsum` and `math.sqrt`;
- no decision rounding;
- evaluable-row requirements;
- pooled / QB-RB-WR-TE position / declared-season groups;
- n>=30 position relative-gate support;
- zero-support failure behavior;
- unweighted mean-season MAE delta;
- minimum position support;
- non-worse-position count;
- one identical finite pooled universe for every secondary-baseline comparison;
- ordering cells as season × position;
- n<8 preregistered ordering exclusion;
- ascending average-rank Spearman with explicit Pearson-on-ranks math;
- prediction/target descending rank MAE with namespace/player-id UTF-8 tie break;
- evaluable-row weighted aggregation in season-ascending then QB/RB/WR/TE order;
- inclusive `>=`/`<=`, equality passing, undefined/nonfinite failing.

Those mechanics are materially better specified than 1.0.0; the unresolved defect is specifically the operand-role mapping of the relative transforms.

### Previously positive WR-073 evidence remains hash-bound

The 1.1.0 lock explicitly incorporates the exact 1.0.0 lock for unchanged semantics. Its current binding summary preserves:

- source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`;
- cohort `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`;
- 5,176 cohort keys / zero duplicates;
- WR-042 custody manifest `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`;
- WR-069 evidence `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`;
- exactly 28 `NFLVERSE_PLAYER_SUMMARY_STATS` predictors;
- zero metadata predictors;
- zero draft-capital predictors.

The predecessor lock remains the normative authority for unchanged feature formulas/missingness/serialization, target, chronology/splits, preprocessing, candidate/hyperparameters, baselines, full-row evidence, outcome isolation, fail-closed rules, environment, publication families and no-result-work attestation.

No evidence was found that historical WR-029 code was promoted to v2 execution authority. It remains design/governance evidence only.

### Exact remediation-head CI

War Room CI run `35091913065` is associated with exact target commit `95b1fdfb36ffc7b865597bf7131fa1dd9f45ae73` and completed SUCCESS:

- classify `104779970612` — SUCCESS;
- governance `104780020913` — SUCCESS;
- product test `104780091489` — SKIPPED as expected for research/evidence-only scope.

Green governance CI is supporting evidence only; it does not semantically validate the gate formulas or synthetic bootstrap fingerprint, which is why the findings above remain.

### Premature execution and forbidden-scope review

The target remediation changes only protocol/handoff artifacts. The new machine lock attests false for fitting, scoring, tuning, comparison, prediction, outcome inspection/join, 2026 outcomes, source reacquisition/refresh/substitution, provider mutation, production and Phase-6 work.

Independent diff/scope review found no model implementation, result table, outcome join, source acquisition, provider mutation, ranking/production, season-total composition or Phase-6 change in the exact target.

## Findings by severity

- CRITICAL: none.
- HIGH: `WR-076-AUD-01` — relative gate transform operand roles remain internally inconsistent and can invert promotion decisions.
- MEDIUM: `WR-076-AUD-02` — claimed synthetic bootstrap conformance fingerprint has no frozen input fixture and cannot be independently reproduced from repository evidence.
- LOW: none.

## Manager action

Do not merge WR-072 as an accepted scoring protocol and do not authorize Returning-Player v2 fitting/scoring/evaluation from head `95b1fdfb36ffc7b865597bf7131fa1dd9f45ae73`.

Route one further bounded, pre-outcome WR-072 remediation that:

1. resolves `WR-076-AUD-01` by explicitly binding candidate/baseline operand roles and making every relative derived call consistent with the formula/sign convention; and
2. resolves `WR-076-AUD-02` by freezing the exact privacy-safe synthetic conformance fixture and binding its input/output hashes.

Preserve the already accepted source/cohort/28-feature/target/chronology/preprocessing/candidate/full-row evidence/outcome-isolation/environment semantics and preserve both historical failed heads/locks. No outcome inspection is needed or authorized for this remediation.

WR-074/075 remain separate infrastructure work and are not modified by this audit.
