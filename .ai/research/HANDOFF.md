# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-027  
Role: Research & Development (R&D)  
Status: COMPLETE — MANAGER REVIEW REQUIRED

## Verified starting state

- refreshed canonical `main`: `9bb1f39013e4069dc59f14644fd383b5a4385ca8`
- WR-025: COMPLETE / ACCEPTED / MERGED research-only
- WR-027: ASSIGNED / ACTIVE at start
- WR-029: PLANNED / BLOCKED ON WR-027 MANAGER DISPOSITION
- production ranking authority: FantasyPros under WR-D001
- WR-021 snapshot / WR-023 protocol: accepted, frozen and immutable
- no existing WR-027 branch or PR at start

## Branch

`wr-027-position-risk-calibration`

## Starting SHA

`9bb1f39013e4069dc59f14644fd383b5a4385ca8`

## Objective completed

Calibrated WR-025 downside, breakout and low-availability signals separately by QB/RB/WR/TE under chronological rolling-origin evaluation, tested whether any position-specific risk penalty earned direct rank use, and tested a transparent Huber robust-regression challenger while preserving the WR-025 Ridge mean architecture exactly.

## Source / rights basis

WR-027 admitted no new outcome-data family.

Reused the exact WR-025 rights-clean nflverse historical sources:
- Player Summary Stats — CC BY 4.0 — statistical seasons 2012–2025 only;
- Players immutable/stable identity metadata — CC BY 4.0;
- Draft Picks — CC BY 4.0.

Every downloaded nflverse asset was independently SHA-256 checked against `.ai/research/generated/HISTORICAL_RANKING_ASSET_MANIFEST.json` from WR-025. A digest mismatch would fail closed.

SafeLeagues/MFL draft-cost data was not re-opened because WR-025's benchmark admission gate already failed.

Source addendum:
`.ai/research/POSITION_RISK_SOURCE_MANIFEST.md`

## Mean projection benchmark

WR-025 benchmark reproduced exactly before WR-027 conclusions were accepted:
- active rows: 1,881;
- unique returners: 886;
- previous-season PPR/game pooled MAE: `3.0261717096`;
- Ridge pooled MAE: `2.8261944403`;
- Ridge pooled Spearman: `0.6775088312`.

All exact values matched WR-025.

## Risk calibration design

Position-specific historical models:
- breakout: standardized L2 logistic, C=.25, balanced classes;
- downside: same;
- low availability: same, including zero-game cohort rows.

Chronological recalibration:
- raw position/label OOS probabilities generated season by season;
- later seasons use only earlier OOS probabilities for a one-dimensional Platt recalibrator when >=50 prior OOS observations with both classes exist;
- warning tiers use prior OOS position/label probability distributions;
- no target-season outcome calibrates its own probability.

Frozen labels:
- breakout: residual >= +3.0 PPR/game vs previous-season baseline;
- downside: residual <= -3.0;
- low availability: recorded games <=8, including zero.

## Pooled calibration results

### QB
Breakout:
- prevalence .239
- ROC AUC .772
- PR AUC .521
- Brier skill .159
- ECE .047
- `WARNING-INFORMATIVE`: YES

Downside:
- prevalence .320
- ROC AUC .747
- PR AUC .603
- Brier skill .176
- ECE .061
- `WARNING-INFORMATIVE`: YES

Low availability:
- prevalence .812
- ROC AUC .783
- PR AUC .936
- Brier skill .135
- ECE .050
- frozen tier-lift rule: NO

### RB
Breakout:
- ROC AUC .637
- `WARNING-INFORMATIVE`: NO

Downside:
- prevalence .261
- ROC AUC .800
- PR AUC .500
- Brier skill .167
- `WARNING-INFORMATIVE`: YES

Low availability:
- prevalence .719
- ROC AUC .725
- PR AUC .856
- Brier skill .099
- `WARNING-INFORMATIVE`: YES

### WR
Breakout:
- prevalence .150
- ROC AUC .664
- PR AUC .271
- Brier skill .036
- `WARNING-INFORMATIVE`: YES under frozen pooled rule, but VERY HIGH sample is small and this should remain secondary

Downside:
- prevalence .219
- ROC AUC .782
- PR AUC .435
- Brier skill .123
- `WARNING-INFORMATIVE`: YES

Low availability:
- prevalence .705
- ROC AUC .734
- PR AUC .852
- Brier skill .131
- `WARNING-INFORMATIVE`: YES

### TE
Breakout:
- ROC AUC .454
- Brier skill negative
- `WARNING-INFORMATIVE`: NO

Downside:
- prevalence .116
- ROC AUC .835
- PR AUC .471
- Brier skill .196
- ECE .011
- `WARNING-INFORMATIVE`: YES

Low availability:
- prevalence .707
- ROC AUC .730
- PR AUC .856
- Brier skill .119
- `WARNING-INFORMATIVE`: YES

## Warning-tier separation

Primary downside warning tiers separate materially:
- QB NORMAL 17.8% downside vs VERY HIGH 90.0% (VERY HIGH N=10);
- RB NORMAL 10.3% vs VERY HIGH 53.8% (N=26);
- WR NORMAL 8.5% vs VERY HIGH 62.1% (N=29);
- TE NORMAL 2.1% vs VERY HIGH 58.8% (N=17).

Low-availability tiers also separate at RB/WR/TE:
- RB NORMAL 55.9% vs VERY HIGH 91.0%;
- WR NORMAL 53.7% vs VERY HIGH 90.2%;
- TE NORMAL 54.7% vs VERY HIGH 94.8%.

These are historical predictive-warning strata, not injury diagnoses or causal effects.

## Position-specific rank modifier study

Frozen candidate family:

`risk_score = ridge_mu + U*p_breakout - D*p_downside - A*p_low_availability`

with fixed grid:
- U {0,.5,1,1.5}
- D {0,.5,1,1.5}
- A {0,.5,1}

For each target season/position, weights could be selected only from earlier OOS evidence and had to clear prior rank-MAE, PPR/game MAE, Spearman and severe-season-regression guards.

Result:
**no candidate passed the prior-only adoption guard for any position in any final scored season 2018–2025.**

All 32 season-position selections therefore correctly fell back to `U=D=A=0`.

This negative result was preserved. No post-hoc penalty was tuned.

## Position-level rank-use decision

QB: `WARNING-ONLY SUPPORTED`  
Reason: useful downside/breakout warning evidence; no rank modifier earned adoption.

RB: `WARNING-ONLY SUPPORTED`  
Reason: useful downside + low-availability warning evidence; no rank modifier earned adoption.

WR: `WARNING-ONLY SUPPORTED`  
Reason: useful downside + low-availability warning evidence; no rank modifier earned adoption.

TE: `WARNING-ONLY SUPPORTED`  
Reason: especially strong downside + useful low-availability warning evidence; no rank modifier earned adoption.

**No position is `RANK MODIFIER SUPPORTED` under WR-027.**

Architecture implication for Manager consideration: preserve expected-performance rank as the ordering signal and treat risk as a separate position-specific warning/explanation layer.

Production authorization remains NONE.

## Robust regression result

Fixed challenger:
`StandardScaler -> HuberRegressor(epsilon=1.35, alpha=.0001)`

### QB
- Ridge MAE 4.263 vs Huber 4.504
- Ridge RMSE 5.327 vs Huber 5.676
- rank MAE 7.771 vs 8.020
- clustered Huber-minus-Ridge MAE CI `[+0.072,+0.424]`
- conclusion: Huber clearly worse

### RB
- Ridge MAE 2.785 vs Huber 2.798
- rank MAE 10.456 vs 10.758
- clustered CI `[-0.071,+0.112]`
- conclusion: no improvement

### WR
- Ridge MAE 2.761 vs Huber 2.809
- Ridge RMSE 4.765 vs Huber 6.225
- rank MAE 14.564 vs 14.881
- clustered CI `[-0.066,+0.225]`
- conclusion: no improvement

### TE
- Ridge MAE 1.954 vs Huber 1.909
- Ridge RMSE 2.783 vs Huber 2.571
- rank MAE 9.702 vs 9.692
- clustered CI `[-0.129,+0.032]`
- Huber p95 error 5.366 vs Ridge 5.088 and Spearman slightly lower
- conclusion: modest local signal, not enough to replace Ridge

Overall robust-regression disposition:
**retain Ridge as mean benchmark; Huber not supported as replacement.**

## Rookie boundary

Rookies remained completely separate. No rookie model was fit in WR-027.

WR-025 transparent position + draft-capital prior remains the accepted research baseline. The richer rookie model remains unvalidated.

## Prospective isolation verification

Historical max statistical season loaded: 2025.

2026 regular-season outcomes inspected: **NO**.

Frozen identities verified both before and after scoring:
- WR-021 snapshot SHA-256 `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d` — PASS;
- WR-023 protocol SHA-256 `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c` — PASS.

WR-021 snapshot changed: **NO**  
WR-023 protocol/manifest changed: **NO**

## Reproducibility

Execution workflow run: `34426951155` — SUCCESS.

Artifact:
- ID `10133084430`
- SHA-256 `67df16e013395d9c6d1336cdec621544c4e0b4015788950769dbe09dabb2f699`

Temporary experiment workflow removed after successful output freeze and is not intended in the final research diff.

## Files changed / intended final WR-027 scope

- `.ai/research/POSITION_RISK_SOURCE_MANIFEST.md`
- `.ai/research/POSITION_RISK_CALIBRATION.md`
- `.ai/research/wr027_position_risk_calibration.py`
- `.ai/research/wr027_requirements.txt`
- `.ai/research/generated/POSITION_RISK_RESULTS.json`
- `.ai/research/generated/POSITION_RISK_ASSET_VERIFICATION.json`
- `.ai/research/generated/POSITION_RISK_RELIABILITY.csv`
- `.ai/research/generated/POSITION_RISK_WARNING_TIERS.csv`
- `.ai/research/generated/POSITION_RISK_CALIBRATION_BY_SEASON.csv`
- `.ai/research/generated/POSITION_RISK_WEIGHT_SELECTION.csv`
- `.ai/research/generated/POSITION_RISK_RANK_ROLLING.csv`
- `.ai/research/generated/POSITION_RISK_ROBUST_ROLLING.csv`
- `.ai/research/HANDOFF.md`

Production files changed: **NO**  
Canonical shared state changed: **NO**  
Production rankings changed: **NO**

## Known limitations

- 2018–2025 are chronological OOS folds but not pristine project-level holdouts;
- warning labels are expectation-relative observational outcomes, not causal effects;
- low-availability is recorded-games context, not an injury model;
- high-risk tier sample sizes are smaller, especially QB downside and breakout tails;
- breakout evidence remains substantially weaker/less consistent than downside evidence at RB/TE;
- no direct risk penalty earned adoption, so risk-to-rank interaction remains unsupported rather than merely untuned;
- Huber does not solve WR-025 outlier concerns generally;
- rookie engine remains unresolved;
- no broad lawful historical ADP benchmark exists from WR-025;
- no 2026 outcome evidence is part of WR-027.

## Blocking issues

None for WR-027 research completion.

WR-029 remains blocked until Manager reviews/disposes WR-027. Production ranking authority remains separately gated by WR-D001 and the frozen WR-023 prospective process.

## Recommended next role

Manager / Architect

## Exact next action

Review the WR-027 research PR and accept/reject the position policy. If accepted, unlock the already planned WR-029 advanced-context/source-feasibility phase with this provisional architecture assumption:

- Ridge expected performance remains the returning-player ordering benchmark;
- QB/RB/WR/TE risk remains warning/explanation-only;
- no Huber replacement;
- no rookie promotion;
- frozen WR-021/WR-023 prospective contract remains untouched.

## Checkpoint / SHA

Verify exact final research branch head and exact-head CI after this handoff commit.