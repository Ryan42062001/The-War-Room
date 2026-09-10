# WR-029 — Advanced Context Feature Enrichment / Source Feasibility

Status: COMPLETE — MANAGER REVIEW REQUIRED  
Role: Research & Development (R&D)  
Starting canonical main: `b89919121cfcc00fc9a02be5d82c1a892036e70b`  
Production authorization: NONE

## Executive result

WR-029 does **not** support adding any tested enrichment family to the accepted returning-player ordering model.

The correct Phase-2 research recommendation is therefore conservative:

- keep the accepted WR-025 position-specific `StandardScaler -> Ridge(alpha=100)` mean projection unchanged as returning-player ordering;
- keep the accepted WR-027 QB/RB/WR/TE risk architecture warning/explanation-only;
- do not replace Ridge with Huber;
- keep rookies separate;
- admit no WR-029 enrichment family into the ordering model;
- admit no WR-029 enrichment family into the warning layer;
- retain the locked Ridge model as deterministic source-failure fallback.

This is a negative enrichment result, not a failure of the accepted Ridge benchmark. Several families contain plausible football information, but none cleared the predeclared chronological development gate and none produced sufficient independent warning evidence. The closest family, `AGE_DRAFT_INTERACTIONS`, produced only small sub-threshold improvements and did not establish non-zero incremental value with clustered uncertainty.

## Prospective isolation / production boundary

- 2026 regular-season outcomes inspected: **NO**.
- Maximum statistical/PBP outcome season requested by WR-029: **2025**.
- WR-021 frozen snapshot modified: **NO**.
- WR-023 protocol/manifest/gate modified: **NO**.
- Production rankings/scoring/recommendations/UI/ESPN behavior modified: **NO**.
- `.ai/shared/*` modified: **NO**.

Frozen identities verified before and after successful scoring:

- WR-021 snapshot SHA-256: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`
- WR-023 protocol SHA-256: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`

## Benchmark / protocol lock

The human-readable pre-scoring contract is:

- `.ai/research/ADV_CONTEXT_BENCHMARK_LOCK.md`

The committed machine lock is:

- `.ai/research/generated/ADV_CONTEXT_BENCHMARK_LOCK.json`
- committed-byte SHA-256: `6498e7399d04cf62018859ec7647eaf14f96d3d4415b0ec3ceffaebbae1773e7`

The lock reproduced the accepted WR-025 benchmark exactly before enrichment scoring:

| Metric | Locked value |
|---|---:|
| active returning-player rows | 1,881 |
| unique returning players | 886 |
| previous-season baseline MAE | 3.0261717096 |
| Ridge MAE | 2.8261944403 |
| Ridge RMSE | 4.2363614825 |
| Ridge Spearman | 0.6775088312 |

Accepted architecture entering and leaving WR-029:

- Ridge expected PPR/game remains the ordering signal;
- WR-027 risk probabilities are warning/explanation-only for every position;
- no direct risk rank modifier;
- no Huber replacement;
- rookies remain separate.

### Locked evaluation structure

- historical source seasons: 2012–2025 only;
- historical OOS scored seasons: 2018–2025;
- WR-029 development/screening folds: 2018–2021;
- within-task confirmation folds: 2022–2025;
- every target-season fit remains rolling-origin and trains only on earlier target seasons;
- primary target: Full-PPR points per recorded game among active target-season returners;
- Ridge alpha fixed at 100 for every family;
- family bootstrap: 5,000 paired player-cluster replicates, seed `29029`;
- target preseason cutoff: September 1 12:00 UTC of target season;
- enrichment uses completed Y-1 regular-season events or immutable/draft metadata only.

The 2022–2025 confirmation seasons are not pristine project-level holdouts because earlier War Room research had already observed those outcomes, but WR-029 did not use them to select feature families.

## Pre-scoring provenance corrections

Two fail-closed issues were resolved before a family metric existed.

### Machine-lock sidecar normalization

The initial lock workflow wrote the correct JSON but its SHA sidecar captured pre-commit working-tree bytes rather than the bytes subsequently stored by Git. Guarded scoring attempts stopped before enrichment scoring. The lock JSON itself was not regenerated or altered. The sidecar and guard were normalized to the actual committed JSON SHA-256:

`6498e7399d04cf62018859ec7647eaf14f96d3d4415b0ec3ceffaebbae1773e7`

### Prior-team locator

The first attempt that cleared the lock/frozen-artifact guards stopped before PBP aggregation/model fitting because locked Player Summary Stats has no historical `team` column.

The correction was frozen in `.ai/research/ADV_CONTEXT_PRE_SCORING_SOURCE_CORRECTION.md` before any enrichment family model fit:

- derive dominant Y-1 team from the already locked Y-1 PBP only;
- count QB dropbacks + targets + non-kneel carries by player/team;
- choose the largest involvement count; lexical normalized team code breaks exact ties;
- team-denominator opportunity features use the player's dominant-team events;
- player efficiency remains season-wide;
- target-Y team/current roster/depth/status is never inferred.

No family list, Ridge parameter, fold, threshold, warning gate, bootstrap, cutoff or frozen prospective identity changed.

## Source / rights / PIT disposition

The detailed independent source review is frozen in `.ai/research/ADV_CONTEXT_SOURCE_MANIFEST.md`. Raw asset IDs, timestamps, SHA-256 digests and schema hashes are recorded in the machine lock and `.ai/research/generated/ADV_CONTEXT_SOURCE_EXECUTION_AUDIT.json`.

### Admitted for scored research

**nflverse Player Summary Stats / Players approved immutable subset / Draft Picks**  
Reused exact WR-025 assets. No current mutable player/team/status field was admitted.

**nflverse Play-by-Play**  
Rights-clean nflverse-data/nflverse-pbp source, used only for completed Y-1 regular-season events. PBP assets for 2012–2025 were locked byte-for-byte. Required schemas were inspected before scoring. It provides the long-history opportunity, efficiency, team and offensive-environment inputs.

**FTN Data via nflverse charting**  
CC-BY-SA family admitted only as a short-history lagged team-scheme challenger for 2022–2025 source seasons / 2023–2025 target seasons. Exact assets and schema were locked; attribution remains `FTN Data via nflverse`.

### Audit-only / not admitted to model

**Participation**  
The documented source transitions from NFL NGS through 2022 to FTN from 2023. It was not used as a core feature dependency. On-field participation was not relabeled as routes.

### Excluded

- historical depth charts: `EXCLUDED — POINT-IN-TIME / SOURCE-PROVENANCE`; <=2024 data is week-level without the explicit timestamp semantics added after the source/schema transition for 2025+;
- weekly rosters for target-preseason role reconstruction: `EXCLUDED — POINT-IN-TIME`;
- PFR snap counts: `EXCLUDED — RIGHTS` pending intended-use clearance;
- PFR advanced stats / PFR-linked combine enrichment: `EXCLUDED — RIGHTS` pending intended-use clearance;
- systematic NFL Next Gen Stats / NFL Pro feature family: `EXCLUDED — RIGHTS` under current project standard;
- injury feed as a core dependency: `EXCLUDED — COVERAGE / MAINTAINABILITY`;
- staff / HC / OC / actual-play-caller corpus: `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE`; no complete dated rights-clean play-caller corpus was admitted and OC identity was never treated as play-caller identity;
- FantasyPros historical/API model training: excluded by project rights/policy boundary;
- ESPN ADP/rank: excluded from intrinsic custom value by WR-D001;
- 2026 outcomes: excluded as prospective-test contamination.

## Route / YPRR guard

No true route denominator was admitted.

WR-029 did **not** calculate or fabricate:

- routes run;
- targets per route;
- route participation;
- YPRR.

Offensive snaps, on-field participation and pass-play participation were not substituted for routes.

## Family definitions tested

The exact pre-scoring feature lists are in `.ai/research/ADV_CONTEXT_FEATURE_SPEC.md`, subject only to the pre-scoring prior-team-source correction above.

Test order was preserved:

1. `OPPORTUNITY_ROLE`
2. `EFFICIENCY_REGRESSION`
3. `QB_TEAM_ENVIRONMENT`
4. `OL_ENVIRONMENT`
5. `AGE_DRAFT_INTERACTIONS`
6. `PIT_DEPTH_ROSTER` audit
7. `SHORT_HISTORY_SCHEME`
8. `STAFF_CONTINUITY` audit
9. combined confirmation from development-passing families only

## Primary family ablation results

No long-history family passed the frozen 2018–2021 development gate, so **zero enrichment families were selected before confirmation was inspected**.

| Family | Development MAE lift vs Ridge | Dev Spearman Δ | Dev mean rank-MAE change | Confirmation MAE lift | Confirmation Spearman Δ | Confirmation mean rank-MAE change | Final disposition |
|---|---:|---:|---:|---:|---:|---:|---|
| OPPORTUNITY_ROLE | -0.498% | +0.0003 | +0.40% worse | +0.047% | -0.0085 | +1.11% worse | `INSUFFICIENT EVIDENCE` |
| EFFICIENCY_REGRESSION | -0.928% | -0.0113 | +1.75% worse | -0.715% | -0.0087 | +1.20% worse | `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE` (coverage reason) |
| QB_TEAM_ENVIRONMENT | -0.837% | -0.0029 | 0.14% better | +0.131% | -0.0096 | +2.54% worse | `INSUFFICIENT EVIDENCE` |
| OL_ENVIRONMENT | -1.113% | -0.0041 | +0.95% worse | -0.376% | -0.0034 | +0.53% worse | `INSUFFICIENT EVIDENCE` |
| AGE_DRAFT_INTERACTIONS | +0.133% | +0.0000 | +0.10% worse | +0.210% | +0.0011 | 0.51% better | `INSUFFICIENT EVIDENCE` |

Positive MAE lift means lower error than locked Ridge. None reaches the predeclared 1.0% development threshold.

### Position-level confirmation MAE direction

The confirmation position regressions further show why no family should be rescued post hoc:

| Family | QB | RB | WR | TE |
|---|---:|---:|---:|---:|
| OPPORTUNITY_ROLE | 0.05% worse | 0.82% better | 0.13% better | 1.14% worse |
| EFFICIENCY_REGRESSION | 0.94% worse | 2.11% worse | 0.22% worse | 0.79% better |
| QB_TEAM_ENVIRONMENT | 1.65% worse | 0.97% better | 0.15% better | 1.98% better |
| OL_ENVIRONMENT | 0.87% worse | 0.06% better | 0.64% worse | 0.40% better |
| AGE_DRAFT_INTERACTIONS | 0.20% better | 0.14% worse | 0.33% better | 0.51% better |

No family demonstrates a stable, material, position-safe direct-ordering advantage.

## Repeated-player-aware uncertainty

Because no family passed development, confirmation intervals are descriptive and cannot promote a family.

Selected examples:

- `OPPORTUNITY_ROLE`: enriched-minus-Ridge MAE point delta `-0.00126`; player-cluster 95% CI `[-0.03201, +0.02993]`;
- `EFFICIENCY_REGRESSION`: point delta `+0.01915`; 95% CI `[-0.00867, +0.04658]`;
- `QB_TEAM_ENVIRONMENT`: point delta `-0.00352`; 95% CI `[-0.03809, +0.03087]`;
- `AGE_DRAFT_INTERACTIONS`: point delta `-0.00562`; 95% CI `[-0.01491, +0.00304]`.

The near-zero intervals for the plausible positive families cross zero. WR-029 therefore does not interpret their small point estimates as established incremental signal.

## Warning / explanation results

Every scored direct family was also tested against the separate frozen WR-027 downside-warning architecture.

A warning-only promotion required, on confirmation folds, either >=2% relative Brier improvement or >=0.02 ROC-AUC improvement in at least two positions, with no >5% Brier degradation anywhere.

**No family passed this warning gate.**

Examples:

- opportunity/role produced only small RB/WR/TE Brier/AUC movements and worsened QB/TE discrimination in places;
- efficiency/regression worsened Brier at every position and exceeded the no->5%-Brier-regression guard at QB;
- QB/team environment worsened QB Brier by about 10% relative;
- age/draft interactions produced only negligible calibration/discrimination changes.

WR-027 warning architecture therefore remains unchanged. WR-029 contributes no additional supported warning feature family.

## Coverage / missingness / confidence

Generated reports:

- `.ai/research/generated/ADV_CONTEXT_COVERAGE_BY_POSITION_SEASON.csv`
- `.ai/research/generated/ADV_CONTEXT_PLAYER_FAMILY_COVERAGE.csv`

Long-history PBP families use explicit source availability and training-only position-median imputation plus missing indicators. Unknown source rows are not silently converted into observed zero activity.

### Coverage summary

- `OPPORTUNITY_ROLE`: minimum >=70%-feature row-coverage rate was ~92.2% in development and ~90.4% in confirmation; source coverage passed.
- `QB_TEAM_ENVIRONMENT`: minimum row coverage ~92.2% development / ~90.4% confirmation; passed source-coverage screening but failed predictive development gate.
- `OL_ENVIRONMENT`: same high PBP/team-locator coverage; failed predictive development gate.
- `AGE_DRAFT_INTERACTIONS`: 100% feature coverage by construction from admitted baseline fields; failed material-lift gate.
- `EFFICIENCY_REGRESSION`: minimum row-coverage fell to ~59.5% in development and ~52.3% in confirmation because position/event denominator eligibility leaves many player-feature cells genuinely undefined. This failed the predeclared coverage standard and is excluded for **coverage**, not because PBP rights/PIT failed.
- `SHORT_HISTORY_SCHEME`: minimum row coverage ~90.4% on its available diagnostic target seasons.

Per-player coverage rows include family, target season, position, feature-coverage fraction, prior-team availability and provenance quality. Long-history PBP rows are labeled `HIGH_LOCKED_LAGGED_PBP` when sourced from the locked lagged PBP path.

## Short-history scheme challenger

FTN charting source integrity was good but history was insufficient and model performance was negative.

Exact locked FTN/PBP play-match rates:

- 2022: 95.44%
- 2023: 91.37%
- 2024: 91.30%
- 2025: 90.97%

Lagged scheme features therefore covered target seasons 2023–2025 only. Across 696 paired active rows:

- locked Ridge MAE: `2.73590`
- scheme-enriched MAE: `2.77667` — about **1.49% worse**;
- Spearman: `0.69604 -> 0.68032`;
- mean position rank MAE: `10.0549 -> 10.3274` — about **2.71% worse**.

Position MAE improved only at RB; QB/WR/TE worsened. With no 2018–2021 development history and negative three-season diagnostics, disposition is `INSUFFICIENT EVIDENCE`.

## Depth/roster and staff challengers

`PIT_DEPTH_ROSTER` was not scored. Historical <=2024 depth data could not prove the fixed Sep-1 target-preseason snapshot contract, while the explicitly timestamped structure begins only after the source transition for 2025+. Hindsight Week-1+ reconstruction was prohibited.

Disposition: `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE` for this historical study.

`STAFF_CONTINUITY` was not scored because no independently verified, rights-clean, dated team-season corpus with actual play-caller identity met the PIT/coverage standard. OC identity was not substituted for actual play caller.

Disposition: `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE`.

## Combined confirmation

Development selected families before confirmation: **none**.

Therefore the selected combined model is not a new model. It is exactly the locked Ridge fallback.

2022–2025 confirmation metrics remain:

- n = 954;
- MAE = `2.6801823057`;
- RMSE = `3.5699801547`;
- Spearman = `0.6954278827`;
- mean position rank MAE = `10.4536789767`.

Combined gate: **FAIL / NOT APPLICABLE AS ENRICHED MODEL**, because zero direct families passed development.

No kitchen-sink rescue model was fit after seeing confirmation results.

## Source omission / perturbation sensitivity

`.ai/research/generated/ADV_CONTEXT_SENSITIVITY.json` records:

- selected enrichment families: `[]`;
- deterministic fallback: `LOCKED_RIDGE`;
- source-omission tests: vacuous because the selected combined model contains no enrichment source;
- ±0.5 SD feature perturbation: vacuous for the same reason.

This is the correct predeclared result: no selected enrichment feature exists to perturb or omit. WR-029 does not invent sensitivity movement for a model identical to the benchmark.

## Phase-2 returning-player recommendation

Recommended specification for Manager consideration:

### Ordering

Keep the accepted WR-025 position-specific Ridge mean model **unchanged**. Do not append a WR-029 family.

### Warning / explanation

Keep WR-027 warning-only risk architecture unchanged by position. Do not use WR-029 family features as promoted warning inputs based on this study.

### Optional research metadata

The WR-029 source/provenance and coverage machinery is still useful engineering research even though no feature was adopted:

- immutable asset/schema identities;
- explicit as-of/cutoff semantics;
- per-player family coverage;
- training-only missing-data handling;
- deterministic fallback to the locked Ridge model;
- explicit source-rights/PIT exclusion reasons.

These governance mechanisms may inform the later Phase-2 implementation specification if Manager approves them; this report does not itself authorize implementation.

### Rookies

Remain separate under the transparent prior architecture. WR-029 did not fit or promote a rookie model.

## Reproducibility

Successful guarded research execution:

- workflow run: `34430397953`
- head used for scoring: `1e14be7d481b21b81f0f0f7ca3ed69d0250cf013`
- result commit created by workflow: `16074f133e7e122a13c955f287df28f0019af9cc`

Workflow evidence passed:

1. dependency installation;
2. static Python syntax check;
3. benchmark-lock + WR-021 + WR-023 hash verification before scoring;
4. predeclared enrichment experiment;
5. numeric sensitivity step;
6. frozen-hash verification after scoring;
7. exact generated-output commit;
8. artifact upload.

Artifact:

- name: `wr029-advanced-context-results`
- ID: `10134274500`
- SHA-256: `efc58c76cb87b1994626355764719d8c1374a0a578b3538fe61ab4c3f6951c5b`

The execution-only workflow was removed after successful output freeze and is not intended to appear in the final research PR.

## Files constituting evidence

Human-readable:

- `.ai/research/ADV_CONTEXT_BENCHMARK_LOCK.md`
- `.ai/research/ADV_CONTEXT_FEATURE_SPEC.md`
- `.ai/research/ADV_CONTEXT_PRE_SCORING_SOURCE_CORRECTION.md`
- `.ai/research/ADV_CONTEXT_SOURCE_MANIFEST.md`
- `.ai/research/ADV_CONTEXT_ENRICHMENT.md`

Reproducible code/runtime:

- `.ai/research/wr029_benchmark_lock.py`
- `.ai/research/wr029_advanced_context_enrichment.py`
- `.ai/research/wr029_run_experiment.py`
- `.ai/research/wr029_sensitivity_addendum.py`
- `.ai/research/wr029_requirements.txt`

Generated:

- `.ai/research/generated/ADV_CONTEXT_BENCHMARK_LOCK.json`
- `.ai/research/generated/ADV_CONTEXT_BENCHMARK_LOCK.sha256`
- `.ai/research/generated/ADV_CONTEXT_RESULTS.json`
- `.ai/research/generated/ADV_CONTEXT_FAMILY_ABLATIONS.csv`
- `.ai/research/generated/ADV_CONTEXT_COVERAGE_BY_POSITION_SEASON.csv`
- `.ai/research/generated/ADV_CONTEXT_PLAYER_FAMILY_COVERAGE.csv`
- `.ai/research/generated/ADV_CONTEXT_SENSITIVITY.json`
- `.ai/research/generated/ADV_CONTEXT_SOURCE_EXECUTION_AUDIT.json`

## Known limitations

- WR-029 confirmation seasons are chronologically isolated within this task but are not pristine project-level holdouts.
- PBP-derived team/offensive-environment features are lagged blended context, not causal OL/player grades.
- dominant prior team is a deterministic Y-1 context locator and does not model target-preseason trades/signings.
- route/YPRR features remain unavailable under the rights/denominator standard.
- short-history FTN scheme evidence has only three target seasons without using 2026.
- target-season role/depth/staff information remains unresolved because PIT-safe historical sources were not established.
- a negative family-level Ridge append test does not prove every possible future transformation of these concepts is useless; it does show the predeclared versions did not earn inclusion.

## Required disposition summary

- `OPPORTUNITY_ROLE` — **INSUFFICIENT EVIDENCE**
- `EFFICIENCY_REGRESSION` — **EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE** (coverage failure; rights/PIT for admitted PBP itself passed)
- `QB_TEAM_ENVIRONMENT` — **INSUFFICIENT EVIDENCE**
- `OL_ENVIRONMENT` — **INSUFFICIENT EVIDENCE**
- `AGE_DRAFT_INTERACTIONS` — **INSUFFICIENT EVIDENCE**
- `PIT_DEPTH_ROSTER` — **EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE**
- `SHORT_HISTORY_SCHEME` — **INSUFFICIENT EVIDENCE**
- `STAFF_CONTINUITY` — **EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE**

`CORE MODEL SUPPORTED`: **none**.  
`WARNING / EXPLANATION ONLY`: **none newly supported by WR-029**.

## Manager decision requested

Review and accept/reject the WR-029 family dispositions and Phase-2 recommendation. If accepted, the evidence supports freezing the returning-player Phase-2 model around the already accepted WR-025 Ridge ordering + WR-027 warning-only architecture, while carrying forward WR-029's provenance/coverage/fallback governance rather than its tested enrichment features.
