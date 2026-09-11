# WR-036 — Independent Audit of WR-035 Season-Total Composition Research

Task ID: WR-036  
Role: Independent Auditor / QA  
Audited PR: #124  
Audited immutable head: `9b4769899dd73f7c94679df6b6c67158e3ee39b6`  
Audit refresh `main`: `aa586cdc0b5b8bff8100fb7bed9bad867e20162f`  
Target advancement classification: `CONTROL_PLANE_ONLY`  
Validation achieved: Level 1 static correctness + Level 2 CI/evidence inspection. Level 3/4 draft validation is not applicable to this research-only, non-production milestone and was not used to elevate confidence.

## Final verdict

`FAIL — REMEDIATION REQUIRED`

The proposed Phase-5 central transform is numerically promising, the dependence-aware challenger is correctly rejected by the frozen development gate, the uncertainty artifacts are explicitly qualified for high-value players, and PR #124 remains research-only. However, WR-035 does not establish exact WR-033 replay identity for all season-total rows after substituting a mutable `players.csv` asset. Because 1,627 of 3,508 scored rows are zero-game outcomes and still consume WR-033 predictions inside the season-total composition, this is a blocking upstream-integrity gap. Two additional protocol-fidelity gaps should be repaired in the same rework cycle.

## A. Scope / chronology / integrity

### Scope

PASS for file scope. PR #124 changes 22 files, all under `.ai/research/**`. No production code, rankings, `.ai/shared/**`, `.ai/manager/**`, or `.ai/auditor/**` is changed by the audited PR. No Phase-6 replacement/FLEX/MSV/value implementation is present.

Current `main` advanced from the WR-035 Manager checkpoint only through Manager/shared control-plane state. No audited research or production surface overlaps that advancement.

### Pre-scoring chronology

The human protocol, candidate specification, source manifest, machine lock, and requirements were committed at `b9b353e712b297ffaa801141cb87954be622ebd3` before the result/report commit `89a7a17c9c896aaaebe00dddeedb5954495e82f3`. Later WR-035 commits did not silently alter the frozen gates.

The `players.csv` source-correction document appears in the result commit rather than as a separately time-anchored pre-scoring commit. The correction is permitted by WR-035 if made before affected scoring, but repository chronology alone cannot independently prove the stated pre-scoring timing. This is not the primary blocker; the substantive blocker is that the correction's acceptance test does not prove exact WR-033 identity for all rows used by the experiment.

### Frozen boundaries

No evidence was found that WR-021/WR-023 frozen artifacts, production behavior, WR-033 specification, or WR-034 specification were modified. WR035 integrity artifacts declare a maximum outcome season of 2025 and no 2026 outcomes inspected. The executable requests historical assets through 2025 only and the Phase-6 contract excludes ADP/ECR, drafted state, roster need, opponent demand, survival, position runs, replacement/FLEX/MSV, and live recommendation scores.

## B. Central composition / dependence result

The formulas implemented for the primary central candidates are consistent with the frozen specification:

- `INDEPENDENT_PRODUCT = wr033_expected_ppr_pg * wr034_expected_games`;
- `PAIRED_RESIDUAL_MEAN` is the mean of paired same-index performance/games residual draws;
- `WR033_X_PREV_RATE` uses the expected-PPR rate with the schedule-adjusted previous-games fallback;
- prior-total and position-mean baselines are explicit and transparent.

The development/confirmation split is respected: 2018–2021 development and 2022–2025 confirmation. Confirmation cannot rescue a development failure because `paired_confirm` is conditioned on the development gate.

The published development result is decisive rather than borderline: pooled independence MAE is about `36.6604` versus `39.1110` for the paired challenger, and the paired challenger has non-negative MAE improvement in 0/4 positions. Thus the predeclared development gate fails before confirmation.

The confirmation bootstrap sign convention is correct for the implemented MAE comparison: `abs(paired-actual) - abs(independence-actual)`. Positive values mean the challenger is worse. The 5,000 player-cluster resamples use stable player IDs, retain each sampled player's seasons, and seed `35036`. Reported mean challenger-minus-independence MAE delta is `+2.3011` with 95% CI `[+1.8060,+2.6800]`, reinforcing—not rescuing—the development rejection.

The confirmation independence central MAE is about `32.513`, materially better than both `WR033_X_PREV_RATE` (about `41.408`) and schedule-adjusted prior total (about `42.709`). These arithmetic results are internally coherent, but their approval is blocked by Finding WR-036-AUD-01 because the exact frozen WR-033 prediction identity feeding all scored rows is not established.

## C. Distribution / high-value behavior

The paired residual draws preserve an empirical historical relationship by sampling performance and games residuals from the same historical row. The independent comparator samples those residual indices independently. This is a defensible transparent dependence experiment; it is not a medical or injury model.

Confirmation paired-distribution 80% coverage is approximately `82.7%` pooled, with QB `77.9%`, RB `83.6%`, WR `84.3%`, and TE `81.8%`. Mean pooled interval width is about `90.51` fantasy points. These satisfy the frozen pooled/by-position nominal coverage gate.

High-value coverage is materially weaker: Q4 about `61.0%`, D10 `50.0%`, and WR Q4 about `64.0%`. Draw-derived rank intervals are also weak as calibrated rank claims (pooled empirical 80% rank coverage about `38.5%`). WR-035's reports and Phase-6 contract appropriately qualify these outputs rather than presenting them as guarantees. If the central research is successfully remediated, Phase 6 may use high-value quantiles only as warning/diagnostic uncertainty with explicit low-confidence/calibration flags unless later evidence improves calibration.

The high-value undercoverage is therefore a material limitation but not a separate blocking finding, because the proposed contract already narrows the claim and does not let these diagnostics override central selection.

## D. Phase-6 interface

Static review of `season_total_transform_v1` is directionally PASS. The contract keeps stable identity, WR-033 expected active-game PPR, WR-034 expected games, central season total, uncertainty fields, availability warnings, provenance/coverage/fallback state, upstream identifiers/hashes, cutoff/as-of metadata, and transform version distinct. It does not import live-draft recommendation or replacement/scarcity signals.

No Phase-6 consumption should be authorized from PR #124 while WR-036-AUD-01 remains unresolved. After successful remediation, the central estimate may be eligible for Phase-6 intrinsic-value research, while high-value interval/rank outputs must remain qualified as described above.

## E. Reproducibility / fallback

WR-034 replay verification is strong: it performs one-to-one keyed comparison for all 3,508 scored rows, checks fallback flags, and reports a maximum expected-games delta around `2.19e-13` against a `1e-10` tolerance.

WR-033 verification is materially weaker and is the primary blocking finding below. The deterministic second-run evidence is useful for reproducibility of the *current substituted-input experiment*, but byte-for-byte repeatability cannot substitute for proving that the experiment still uses the exact frozen upstream WR-033 predictions required by the task.

The executable's residual-distribution fallback order also differs from the frozen protocol, and the repeated-player comparison implementation omits two predeclared contrast families. Those are recorded as MEDIUM findings below.

## F. CI discrepancy

PR integration run `34556251098` attempt 1 failed in the existing command-bar UI test while PR #124 changes only `.ai/research/**`. Attempt 2 on the same immutable PR head completed successfully, including `npm test`, resilience syntax, and offline backup/reload checks. No audited change touches the implicated product/UI test surface. Under WR-036's explicit instruction, attempt 1 is classified as non-coupled/flaky CI evidence rather than a WR-035 research finding.

## Findings

### WR-036-AUD-01 — HIGH — Exact WR-033 replay is not established for all scored season-total rows

**Requirement**  
WR-035 requires exact replay of frozen WR-033 without retuning, and WR-036 specifically requires the Auditor to verify the claimed WR-033 identity and upstream replay tolerances. The frozen protocol states that WR-033 is the exact WR-025 position-specific `StandardScaler -> Ridge(alpha=100)` model/feature contract.

**Evidence**  
The historical locked `players.csv` asset (`asset_id 552739287`, SHA-256 beginning `a33998d3...`) became unavailable and WR-035 accepted replacement asset `554983670` (SHA-256 beginning `c2402e02...`). WR-025/WR-033 features include player-metadata-derived fields such as `age_sep1`, `age_missing`, and `experience_years`.

`verify_wr033_replay()` filters to scored rows with `target_games > 0` and a defined target active-game PPR, then checks only four aggregate values: row count, MAE, RMSE, and Spearman. It does not compare row keys or row-level WR-033 predictions. WR035 reports `1,881` active replay rows, but its season-total cohort contains `3,508` rows, including `1,627` zero-game rows. `upstream_predictions()` generates `wr033_expected_ppr_pg` for every returner, and `compose()` uses that prediction in `INDEPENDENT_PRODUCT`, `PAIRED_RESIDUAL_MEAN`, and `WR033_X_PREV_RATE` for every scored row—including the zero-game rows excluded from the WR-033 replay check.

**Failure**  
Matching active-row aggregate MAE/RMSE/Spearman is not row-level prediction identity and does not verify the 1,627 zero-game-row WR-033 predictions at all. The substituted metadata source therefore has not been proven equivalent to the frozen WR-033 input/prediction surface actually consumed by Phase 5.

**Impact**  
Nearly half of the season-total evaluation rows can influence central MAE/RMSE/bias and distribution residual behavior without an exact upstream-WR-033 identity check. The currently published Phase-5 disposition may be numerically identical to the intended frozen model, but the repository evidence does not prove it. That violates a core acceptance criterion and blocks Manager acceptance/merge as an evidence-backed frozen composition result.

**Required remediation**  
R&D must establish exact WR-033 identity for all 3,508 scored returner rows before re-scoring is accepted. Prefer one of:
1. reacquire/reconstruct the original locked player metadata from an immutable archival source and rerun against it; or
2. independently prove that the replacement metadata produces an identical WR-033 feature matrix and identical WR-033 prediction for every scored keyed row.

Persist a keyed replay artifact or deterministic keyed feature/prediction hash covering `(player_id, position, target_season)` for all scored rows, including zero-game outcomes. Compare row-for-row against a trustworthy frozen/independently reconstructed reference and fail closed on any difference. If exact upstream identity cannot be established, WR-035 must not claim exact replay; Manager should require a newly frozen, explicitly changed research contract/disposition rather than retroactively accepting the substitution.

**Validation needed**  
Level 1: inspect keyed full-cohort replay artifact and source provenance.  
Level 2: rerun WR-035 from the remediated frozen source/replay contract, reproduce substantive outputs deterministically, and re-observe exact-head CI. Recompute central, dependence, distribution, and high-value metrics if any prediction changes.

**Confidence**  
HIGH.

### WR-036-AUD-02 — MEDIUM — Residual-distribution fallback implementation skips the frozen first fallback

**Requirement**  
The frozen protocol specifies: when fewer than 25 same-position prior OOS residual pairs exist, first use same-position in-sample training residuals and flag `TRAINING_RESIDUAL_FALLBACK`; only if that is also insufficient may the implementation use pooled-position prior OOS residuals; otherwise distribution is unavailable.

**Evidence**  
`compose()` constructs same-position prior OOS residuals, but if the pool is under 25 it immediately replaces it with all-position prior OOS residuals and sets `PRIOR_OOS_POOLED_FALLBACK`. There is no same-position in-sample residual construction and no `TRAINING_RESIDUAL_FALLBACK` path in the executable.

**Failure**  
The executable does not implement the pre-scoring-locked fallback order.

**Impact**  
The current 2018–2025 primary result is not shown to depend on this small-pool path, so this finding alone would not invalidate the reported primary metrics. It does, however, make the frozen transform operationally inconsistent and would produce different uncertainty behavior if the small-pool condition were reached in later/restricted use.

**Required remediation**  
Implement the exact frozen fallback sequence or, if the original sequence is no longer defensible, create a new Manager-approved pre-scoring protocol before rescoring. Add an explicit fallback state for same-position in-sample training residuals.

**Validation needed**  
Level 1 code/spec comparison plus Level 2 deterministic targeted tests that force: same-position OOS >=25, same-position OOS <25 but in-sample >=25, pooled prior OOS fallback, and distribution unavailable. Re-run WR-035 deterministic equality checks.

**Confidence**  
HIGH.

### WR-036-AUD-03 — MEDIUM — Predeclared repeated-player comparison is only implemented for MAE

**Requirement**  
The frozen WR-035 protocol predeclares 5,000 deterministic player-cluster bootstrap replicates and states that the primary challenger-minus-independence contrast covers MAE, RMSE, and interval score. WR-035 also requires repeated-player-aware uncertainty for primary candidate differences.

**Evidence**  
`cluster_bootstrap()` computes only the player-clustered MAE-difference distribution and emits only the MAE delta/CI. It does not compute cluster-aware RMSE or interval-score contrasts.

**Failure**  
Two of the three predeclared repeated-player-aware comparison families are absent from the executable/generated evidence.

**Impact**  
The central winner is not close—the paired challenger already fails development decisively and has a positive confirmation MAE delta CI—so this omission does not plausibly rescue the challenger. But the distribution comparison's interval-score advantage is promoted without the predeclared repeated-player contrast, reducing methodological completeness and reproducibility of the uncertainty decision.

**Required remediation**  
Implement deterministic player-cluster bootstrap contrasts for RMSE and interval score under the frozen clustering rule/replicate count/seed, or explicitly supersede the protocol before any new scoring. Report their point contrasts and intervals with the existing MAE evidence.

**Validation needed**  
Level 1 code/artifact inspection and Level 2 deterministic rerun/byte comparison of the added bootstrap evidence.

**Confidence**  
HIGH.

## Findings by severity

- CRITICAL: none.
- HIGH: `WR-036-AUD-01` unresolved and blocking.
- MEDIUM: `WR-036-AUD-02`, `WR-036-AUD-03` unresolved; repair in the same WR-035 rework cycle.
- LOW: none.

## Safe/unsafe downstream statement

Until remediation is independently re-audited, no WR-035 Phase-5 output is approved as a frozen Phase-6 input contract.

If WR-036-AUD-01 is resolved without changing full-cohort predictions and the protocol-fidelity findings are repaired, the evidence supports reconsidering `INDEPENDENT_PRODUCT` as the central season-total transform. Even then, Q4/D10/WR-Q4 empirical intervals and draw-derived rank intervals must remain explicitly low-confidence diagnostic/warning outputs, not calibrated guarantees.

## Recommended Manager action

Do not merge PR #124. Move WR-035/WR-036 to rework/remediation, assign R&D a bounded correction on the same research branch/PR (or a Manager-approved replacement research branch if chronology requires a fresh lock), require full-cohort keyed WR-033 replay evidence plus the two protocol-fidelity fixes, rerun deterministic outputs/CI, and return the new immutable head for independent re-audit.

Auditor changed production files: NO.  
Auditor changed canonical `.ai/shared/**`: NO.  
Auditor modified PR #124: NO.  
Auditor merged PR #124: NO.
