# WR-073 — Independent Audit of Returning-Player v2 Model Protocol + Feature Schema

Date: 2026-09-15

Role: Independent Auditor / QA

Workflow: V3.2

Execution mode: STANDARD_CHAT

Assignment baseline: `d8f8a8d19050a1162dfed3763128e53925ee25de`

Audit branch: `wr-073-v2-model-protocol-feature-schema-audit`

Audited target: WR-072 / PR #207

Frozen audited head: `d75e58052dd555cd5b3f952fc2b3556287d75f9a`

Target assignment baseline: `408a10cf14d71d88d43193df3bdd830633c2cf6f`

## Final verdict

FAIL — REMEDIATION REQUIRED

WR-072 correctly freezes a fresh Returning-Player v2 feature/model lineage, binds it to the accepted source/cohort/custody authorities, removes unavailable metadata/draft predictors, preserves all 5,176 cohort keys, establishes strong pre-outcome evidence isolation, and does not perform model/result work. One blocking reproducibility defect remains: several promotion gates are expressed only as named relative statistics and the confirmation bootstrap is specified only at the seed/count/cluster/statistic/percentile-concept level. The exact formulas and deterministic bootstrap procedure required to turn those declarations into one reproducible gate decision are not frozen in the v2 protocol.

## Target discipline and refresh

Before substantive audit work:

- canonical `main` resolved exactly to `d8f8a8d19050a1162dfed3763128e53925ee25de`;
- assigned branch `wr-073-v2-model-protocol-feature-schema-audit` resolved to the same exact baseline;
- PR #207 remained OPEN and unmerged at exact frozen head `d75e58052dd555cd5b3f952fc2b3556287d75f9a`;
- PR #207 was rechecked immediately before publication and still pointed to that exact SHA.

No target movement occurred. The audit did not modify or merge WR-072.

## Finding WR-073-AUD-01 — HIGH — result-gate transforms and bootstrap procedure are not fully frozen

### Requirement

The accepted WR-039 evidence contract requires the model-protocol lock to bind model-selection gates, **all random seeds and deterministic-compute settings**, dependency/runtime state, and exact reproducibility evidence before scoring. WR-073 specifically requires an independent determination that the result gates are precise enough to execute without result-dependent interpretation and requires a blocking finding for result-dependent gates.

### Frozen WR-072 evidence

The human protocol freezes threshold statements such as:

- MAE improvement >=1.0% / >=0.5%;
- RMSE regression <=1.0%;
- position MAE regression <=5%;
- weighted rank-MAE regression <=2%;
- single-season MAE regression <=5%;
- MAE regression versus each secondary baseline <=1%;
- a player-clustered paired MAE bootstrap with 5,000 replicates, seed `72073`, statistic candidate MAE minus primary-baseline MAE, and a percentile 95% CI whose upper bound must be <=0.

The machine lock encodes corresponding symbolic expressions such as:

- `MAE_lift>=0.01`;
- `RMSE_regression<=0.01`;
- `position_MAE_regression_ge30<=0.05`;
- `weighted_rank_MAE_regression<=0.02`;
- `max_season_MAE_regression<=0.05`;
- `MAE_regression_vs_each_secondary<=0.01`;

and represents the bootstrap as:

`[5000, 72073, "player_id", "candidate MAE-primary MAE", "percentile95"]`.

### Independent failure analysis

The frozen v2 artifacts do **not** bind the exact mathematical transforms for the named relative statistics. In particular, they do not state the precise numerator/denominator/sign convention for every `*_lift` or `*_regression` value. Historical WR-029 implementation evidence demonstrates one historical MAE-lift convention, but WR-072 explicitly classifies WR-025/027/029/033/034 material as `HISTORICAL_DESIGN_EVIDENCE_ONLY`; that historical code is not bound as the v2 scoring implementation and cannot silently supply missing v2 execution semantics.

The bootstrap definition also does not freeze enough execution detail to guarantee byte-for-byte/re-run-equivalent decision behavior. The protocol does not specify, at minimum:

1. the exact RNG API / bit-generator used with seed `72073`;
2. the exact player-cluster sampling algorithm, including cluster universe/order, draw count, replacement semantics, and how duplicate sampled clusters contribute their rows/weights;
3. the exact percentile endpoints and quantile/interpolation method used to calculate the 95% interval;
4. the canonical handling of boundary/equality behavior beyond the final `<=0` gate.

Pinned NumPy/scikit-learn versions and a seed reduce variability but do not uniquely choose those algorithms. Two reasonable implementations could therefore obey the written lock yet produce different relative percentages or a different bootstrap CI near a threshold. That creates exactly the result-dependent interpretation opportunity this pre-score checkpoint is intended to remove.

### Impact

This is blocking before any v2 scoring/evaluation. If outcomes were exposed first, choosing one interpretation afterward could change whether a candidate advances or fails without changing the written threshold. That would violate the prospective chronology and weaken the accepted WR-039 reproducibility boundary.

### Required remediation

On a fresh Manager-authorized WR-072 remediation version/head, before any model fit, prediction, target join, or result inspection:

- freeze machine-readable formulas for every relative `lift`, `regression`, weighted ordering, season aggregation, position aggregation, and secondary-baseline comparison used by a gate, including numerator, denominator, sign convention, weighting, zero/undefined handling, and threshold comparison semantics;
- freeze the exact player-cluster bootstrap algorithm: ordered cluster universe, sampling unit/count/replacement semantics, RNG API/bit-generator construction from seed `72073`, replicate statistic computation, duplicate-cluster weighting behavior, percentile endpoints, exact quantile method/interpolation, and finite/degenerate-case handling;
- bind those definitions directly in the new v2 machine lock (or bind exact audited execution code by immutable digest with equivalent normative specificity);
- regenerate the machine-lock digest/sidecar and require fresh independent audit;
- do not inspect model outcomes while remediating this pre-score contract.

### Confidence

HIGH.

## Independently reproduced positive evidence

### Machine lock and identities

The exact committed bytes of `.ai/research/generated/WR072_RETURNING_PLAYER_V2_MODEL_PROTOCOL.json` were independently decoded from the immutable Git object and SHA-256 recalculated as:

`d2fb326875c954446b23e2761df0feaad4b814aa49dd0465277979a3c9d9bd73`

The adjacent sidecar contains the same digest.

The parsed machine bytes contain exactly the frozen fresh v2 identities:

- model protocol `returning-player-v2-model-protocol/1.0.0-wr072`;
- feature schema `returning-player-v2-feature-schema/1.0.0-wr072`;
- preprocessing `returning-player-v2-preprocessing/1.0.0-wr072`;
- serializer `returning-player-v2-evidence-serializer/1.0.0-wr072`;
- target `returning-player-v2-expected-ppr-pg-target/1.0.0-wr072`;
- primary candidate `returning-player-v2-ridge-stats-only-a100/1.0.0-wr072`.

Human and machine artifacts agree on those identities.

### Upstream authority bindings

The lock binds the accepted authorities exactly:

- WR-039 evidence contract `wr-returning-player-v2-evidence-contract/1.0.0` / `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`;
- WR-059 source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`;
- WR-059 cohort `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`;
- WR-042 custody manifest `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`;
- WR-069 privacy-safe evidence `448baab9b5b3109faee3e322432369f72dcef1569685a16b0605ce25bd855fbb`;
- accepted WR-071 audit head `96a712ba2cf6a016ddbfdc0ea14cabba282bee04` / PASS-no-findings disposition.

Current repository sidecars independently confirm the WR-039, WR-059 snapshot, and WR-059 cohort digests above. No alternate source/cohort authority is introduced.

### Feature schema and unavailable-source boundary

The machine artifact contains exactly 28 predictors in this order:

1. `prev1_ppr_pg`
2. `prev1_games`
3. `prev1_attempts_pg`
4. `prev1_carries_pg`
5. `prev1_targets_pg`
6. `prev1_receptions_pg`
7. `prev1_pass_yards_pg`
8. `prev1_pass_tds_pg`
9. `prev1_int_pg`
10. `prev1_rush_yards_pg`
11. `prev1_rush_tds_pg`
12. `prev1_rec_yards_pg`
13. `prev1_rec_tds_pg`
14. `prev1_pass_epa_pg`
15. `prev1_rush_epa_pg`
16. `prev1_rec_epa_pg`
17. `prev1_target_share`
18. `prev1_air_yards_share`
19. `prev1_wopr`
20. `prev1_pass_ypa`
21. `prev1_rush_ypc`
22. `prev1_rec_ypt`
23. `prev2_ppr_pg`
24. `prev2_games`
25. `ppr_delta`
26. `weighted_ppr_pg`
27. `games_delta`
28. `has_prev2`

Independent reconciliation with accepted WR-069 schema evidence confirms the required raw fields exist on admitted historical `NFLVERSE_PLAYER_SUMMARY_STATS` surfaces. Each feature uses only completed Y-1/Y-2 regular-season stats semantics.

No predictor depends on the failed-closed `players.csv`, age, birth date, rookie season, experience, current team/status, draft year/round/pick/capital, `draft_picks.csv`, or an intentional proxy reconstructing those unavailable/excluded semantics. Historical WR-033 had 34 features and included six age/draft fields; WR-072 explicitly removes those six and gives the remaining stats-only design a fresh v2 schema identity.

### Source disposition

Accepted WR-059 authority remains internally compatible with WR-072:

- 14 admitted `NFLVERSE_PLAYER_SUMMARY_STATS` sources;
- 0 admitted Players metadata sources;
- 1 historical Players metadata source retained but `FAILED_CLOSED`;
- `draft_picks.csv` excluded under WR-057 with acquired/custodied/parsed/used false and no replacement provider.

WR-072 does not weaken or bypass those dispositions.

### Target semantics

The frozen target is next-season Full-PPR points per recorded regular-season game:

- valid target-Y REG row and `games > 0` => `sum(fantasy_points_ppr) / max(games)`;
- `games = 0` => `TARGET_UNAVAILABLE`;
- no valid target-Y REG row => `TARGET_UNAVAILABLE`;
- target-unavailable PPR/game is not imputed to zero;
- all cohort keys remain represented in evidence;
- only `OBSERVED` target values may enter fitting/evaluation when authorized.

### Chronology and leakage controls

Chronology is explicitly frozen:

- warmup 2014–2017;
- development 2018–2019;
- validation 2020–2021;
- confirmation 2022–2025;
- rolling-origin training using same-position earlier `OBSERVED` targets only;
- September 1, 12:00 UTC target-year cutoff;
- target-Y Week-1+ predictor information prohibited;
- result-driven split changes require a new protocol version and fresh audit.

Confirmation cannot rescue a development/validation failure.

### Preprocessing and candidate

Preprocessing is separate for QB/RB/WR/TE and binds the exact 28-field input order. Float features use float64 semantics and `has_prev2` uses int8 serialized semantics; the matrix is scaled under the frozen numeric environment. Only named missingness rules are authorized; non-finite values fail closed; generic silent imputation is prohibited.

Scaler specification is exactly:

`StandardScaler(copy=True, with_mean=True, with_std=True)`

fitted only to authorized same-position observed training rows. Future evidence must preserve scaler learned state and digest.

The sole learned challenger is fresh v2:

`StandardScaler -> Ridge`

with exactly:

- `alpha=100.0`
- `fit_intercept=True`
- `copy_X=True`
- `max_iter=None`
- `tol=0.0001`
- `solver='svd'`
- `positive=False`
- `random_state=None`

No hyperparameter search is authorized. No WR-033/v1 fitted state or prediction identity is inherited. Historical WR-025/027/029/033/034 material is classified only as design evidence/reuse guidance.

### Full-row evidence and outcome isolation

All 5,176 accepted cohort keys remain required on the keyed evidence surface. The protocol requires exact stable key, ordered pre-transform features, missingness/denominator flags, source lineage, schema/serializer IDs, feature digest, preprocessing identity/state/digest, model identity/state/digest, prediction identity/row digest, and inclusion/exclusion/fallback reason as applicable.

Held-out outcomes are isolated in a separate access-controlled table. Before any target join, complete feature/preprocessing/model/prediction evidence and a pre-score manifest must be immutable and exact-target verified. After outcome exposure, changing features, preprocessing, candidates, hyperparameters, split logic, or gates requires a new protocol version and fresh independent audit.

This satisfies the prospective isolation requirement apart from the gate-definition reproducibility finding above.

### Fail-closed rules

The protocol rejects rather than silently continues on:

- missing, extra, duplicate, or differently ordered cohort keys;
- source/cohort/WR-042/WR-069 authority mismatch;
- feature schema/order/type mismatch;
- missing required source fields;
- failed-closed/excluded source lineage;
- unexpected nulls;
- NaN / +Inf / -Inf features or predictions;
- current/future-fold leakage;
- premature held-out target exposure;
- preprocessing/model/environment/code digest mismatch;
- unknown reason/status;
- predictions missing complete lineage;
- evaluation without immutable pre-score prediction.

### Reproducibility environment

The future execution environment freezes:

- CPython 3.12.7;
- Ubuntu 24.04 LTS x86_64;
- UTC;
- `C.UTF-8`;
- numpy 2.1.3;
- pandas 2.2.3;
- scikit-learn 1.5.2;
- scipy 1.14.1;
- `PYTHONHASHSEED=72072`;
- `OMP_NUM_THREADS=1`;
- `MKL_NUM_THREADS=1`;
- `OPENBLAS_NUM_THREADS=1`;
- `NUMEXPR_NUM_THREADS=1`;
- bootstrap seed `72073`;
- future repository SHA / clean tree, scoring-script digest, dependency lock + installed versions, runtime/kernel/arch/BLAS, exact commands/paths, authority hashes, and all output hashes.

Those controls are strong but do not cure the missing bootstrap/gate algorithm definitions identified in WR-073-AUD-01.

### Scope and repository verification

Independent compare:

`408a10cf14d71d88d43193df3bdd830633c2cf6f`
→
`d75e58052dd555cd5b3f952fc2b3556287d75f9a`

is exactly:

- 1 commit ahead;
- 0 behind;
- exactly four changed paths:
  - `.ai/research/HANDOFF.md`
  - `.ai/research/WR072_RETURNING_PLAYER_V2_MODEL_PROTOCOL.md`
  - `.ai/research/generated/WR072_RETURNING_PLAYER_V2_MODEL_PROTOCOL.json`
  - `.ai/research/generated/WR072_RETURNING_PLAYER_V2_MODEL_PROTOCOL.sha256`

The later advancement from the WR-072 assignment baseline to current canonical main changes only Manager/shared control-plane files associated with WR-072/073/074/075 state. It does not overlap the four WR-072 research paths and does not alter the audit target.

### Exact-target CI

War Room CI `35013128300` is bound to exact WR-072 head `d75e58052dd555cd5b3f952fc2b3556287d75f9a` / PR #207 and completed SUCCESS:

- classify `104529778523` — SUCCESS;
- governance `104529832127` — SUCCESS;
- product test `104529896735` — SKIPPED as expected for research/evidence-only scope.

Governance also passed current workflow-state, trusted-custody, retained-version, and WR-069 safe-consumer regressions. Green CI is treated as supporting evidence, not proof of protocol correctness; WR-073-AUD-01 was found by independent semantic review.

### Premature-execution and forbidden-scope review

The target diff contains only the four research protocol/evidence files above. No scoring implementation, result artifact, prediction surface, target table, source acquisition code, provider mutation, production/ranking file, season-total composition, or Phase-6 surface changed.

The machine lock also records all relevant execution/result/source/prod attestation flags false. Independent repository-scope review found no evidence in the frozen target of:

- model fitting;
- scoring;
- tuning;
- candidate outcome comparison;
- prediction generation;
- MAE/RMSE/Spearman result evaluation;
- target/outcome join;
- 2026 outcome inspection;
- source reacquisition/refresh/substitution;
- provider mutation;
- production/ranking change;
- season-total composition;
- Phase-6 work.

## Findings by severity

- CRITICAL: none.
- HIGH: `WR-073-AUD-01` — relative gate transforms and the clustered-bootstrap execution algorithm are not fully frozen, leaving a result-dependent interpretation path before candidate promotion can be considered reproducible.
- MEDIUM: none.
- LOW: none.

## Manager action

Do not merge WR-072 as an accepted scoring protocol and do not authorize Returning-Player v2 scoring/evaluation from this target. Preserve the independently verified source/cohort bindings, 28-feature stats-only schema, target, chronology, preprocessing, candidate, evidence/outcome-isolation contract, and environment lock. Route only a bounded pre-score protocol remediation that freezes exact gate formulas and bootstrap execution semantics, generate a new immutable machine lock/head without inspecting outcomes, then require fresh independent audit.

WR-074/075 are not modified by this audit.
