# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-029  
Role: Research & Development (R&D)  
Status: COMPLETE — MANAGER REVIEW REQUIRED

## Verified starting state

- refreshed canonical `main`: `b89919121cfcc00fc9a02be5d82c1a892036e70b`
- WR-027: COMPLETE / ACCEPTED / MERGED
- accepted architecture entering WR-029:
  - WR-025 Ridge mean projection remains returning-player ordering;
  - QB/RB/WR/TE risk remains warning/explanation-only;
  - Huber is not adopted;
  - rookies remain separate.
- WR-021 snapshot and WR-023 protocol remain frozen/immutable.
- production ranking authority remains FantasyPros under WR-D001.

## Branch

`wr-029-advanced-context-enrichment`

## Starting SHA

`b89919121cfcc00fc9a02be5d82c1a892036e70b`

## Benchmark lock / cutoff contract

Human pre-scoring lock:
`.ai/research/ADV_CONTEXT_BENCHMARK_LOCK.md`

Machine lock:
`.ai/research/generated/ADV_CONTEXT_BENCHMARK_LOCK.json`

Authoritative committed-byte SHA-256:
`6498e7399d04cf62018859ec7647eaf14f96d3d4415b0ec3ceffaebbae1773e7`

Exact WR-025 benchmark reproduction before enrichment:
- active returning rows: 1,881;
- unique returners: 886;
- previous-season baseline MAE: `3.0261717096`;
- Ridge MAE: `2.8261944403`;
- Ridge RMSE: `4.2363614825`;
- Ridge Spearman: `0.6775088312`.

Cutoff:
- every enrichment target Y uses completed Y-1 REG PBP or immutable/draft metadata only;
- fixed research cutoff September 1 12:00 UTC of target season;
- target Week 1+ data forbidden;
- 2026 statistical/PBP outcomes never requested.

WR-029 development folds: 2018–2021.  
Within-task confirmation folds: 2022–2025.  
Every target model remains rolling-origin.

## Pre-scoring integrity corrections

Two fail-closed corrections happened before an enrichment metric existed:

1. machine-lock sidecar normalized to the actual Git-committed JSON bytes; lock JSON/methodology unchanged;
2. locked Player Summary Stats was found to lack a historical team column. Before any family model fit, `.ai/research/ADV_CONTEXT_PRE_SCORING_SOURCE_CORRECTION.md` froze a replacement prior-team locator using only locked Y-1 PBP offensive involvement. No target-Y roster/current-team field was introduced.

No family, fold, threshold, Ridge alpha, warning gate, bootstrap or frozen prospective contract was changed after enrichment evidence appeared.

## Sources / rights / PIT reviewed

Detailed source review:
`.ai/research/ADV_CONTEXT_SOURCE_MANIFEST.md`

Admitted:
- exact WR-025 nflverse Player Summary Stats / approved immutable Players subset / draft-time Draft Picks fields;
- nflverse PBP 2012–2025, exact assets/schema locked, completed Y-1 REG events only;
- FTN Data via nflverse charting, CC-BY-SA, short-history scheme diagnostic only.

Audit-only / not model input:
- participation; provider transition NFL NGS -> FTN and no route denominator inference.

Excluded:
- historical depth/weekly roster target-preseason role reconstruction — PIT/source transition insufficient;
- PFR snap counts/advanced/combine enrichment — rights hold;
- systematic NFL NGS/NFL Pro feature family — rights hold;
- current injury feed — coverage/maintainability;
- staff/play-caller corpus — no rights-clean complete dated PIT corpus admitted;
- FantasyPros historical/API competing-model inputs — excluded;
- ESPN ADP/rank — market timing only under WR-D001;
- 2026 outcomes — frozen-test contamination.

True routes/YPRR: **NOT CALCULATED**. No snaps/participation substitute was relabeled as routes.

## Feature families tested in predeclared order

1. `OPPORTUNITY_ROLE`
2. `EFFICIENCY_REGRESSION`
3. `QB_TEAM_ENVIRONMENT`
4. `OL_ENVIRONMENT`
5. `AGE_DRAFT_INTERACTIONS`
6. `PIT_DEPTH_ROSTER` source/PIT audit
7. `SHORT_HISTORY_SCHEME`
8. `STAFF_CONTINUITY` source/PIT audit
9. combined confirmation using only development-passing families

Frozen exact definitions:
`.ai/research/ADV_CONTEXT_FEATURE_SPEC.md`

## Primary family results

No scored long-history family passed the predeclared 2018–2021 development gate.

| Family | Development MAE lift | Confirmation MAE lift | Final disposition |
|---|---:|---:|---|
| OPPORTUNITY_ROLE | -0.498% | +0.047% | `INSUFFICIENT EVIDENCE` |
| EFFICIENCY_REGRESSION | -0.928% | -0.715% | `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE` — coverage reason |
| QB_TEAM_ENVIRONMENT | -0.837% | +0.131% | `INSUFFICIENT EVIDENCE` |
| OL_ENVIRONMENT | -1.113% | -0.376% | `INSUFFICIENT EVIDENCE` |
| AGE_DRAFT_INTERACTIONS | +0.133% | +0.210% | `INSUFFICIENT EVIDENCE` |

Positive lift means lower MAE. Core development threshold was >=1.0%, so none selected.

`development_selected_families_before_confirmation = []`.

Confirmation metrics for non-selected families were computed only descriptively after development selection had already frozen; they were not used to rescue selection.

## Per-position confirmation direction

- OPPORTUNITY_ROLE: QB 0.05% worse / RB 0.82% better / WR 0.13% better / TE 1.14% worse.
- EFFICIENCY_REGRESSION: QB 0.94% worse / RB 2.11% worse / WR 0.22% worse / TE 0.79% better.
- QB_TEAM_ENVIRONMENT: QB 1.65% worse / RB 0.97% better / WR 0.15% better / TE 1.98% better.
- OL_ENVIRONMENT: QB 0.87% worse / RB 0.06% better / WR 0.64% worse / TE 0.40% better.
- AGE_DRAFT_INTERACTIONS: QB 0.20% better / RB 0.14% worse / WR 0.33% better / TE 0.51% better.

No family showed a stable, material position-safe direct-ordering advantage.

## Repeated-player-aware uncertainty

5,000 player-cluster bootstrap replicates, seed 29029.

Examples, enriched-minus-Ridge MAE:
- OPPORTUNITY_ROLE: point `-0.00126`, CI `[-0.03201,+0.02993]`;
- EFFICIENCY_REGRESSION: point `+0.01915`, CI `[-0.00867,+0.04658]`;
- QB_TEAM_ENVIRONMENT: point `-0.00352`, CI `[-0.03809,+0.03087]`;
- AGE_DRAFT_INTERACTIONS: point `-0.00562`, CI `[-0.01491,+0.00304]`.

No small positive confirmation result established non-zero incremental benefit.

## Coverage / missingness / confidence

Generated:
- `.ai/research/generated/ADV_CONTEXT_COVERAGE_BY_POSITION_SEASON.csv`
- `.ai/research/generated/ADV_CONTEXT_PLAYER_FAMILY_COVERAGE.csv`

Findings:
- opportunity/team/OL PBP families maintain >90% minimum confirmation row-coverage;
- age/draft interactions: 100% feature coverage;
- efficiency/regression: minimum >=70%-feature row coverage falls to ~59.5% development and ~52.3% confirmation; excluded for coverage despite admitted PBP rights/PIT;
- short-history scheme: minimum row coverage ~90.4% in available diagnostic seasons;
- missing numeric family values use training-only position medians plus explicit missing indicators;
- unknown source rows are never silently converted to observed zeros.

## Warning / explanation findings

The separate WR-027 downside-warning enrichment gate was applied.

Result: **no WR-029 family passed**.

No family achieved the predeclared >=2% Brier or >=0.02 AUC improvement in at least two positions while preserving the no->5%-Brier-regression guard.

WR-027 warning architecture therefore remains unchanged.

## Short-history scheme challenger

FTN Data via nflverse exact PBP-match rates:
- 2022: 95.44%
- 2023: 91.37%
- 2024: 91.30%
- 2025: 90.97%.

Only target seasons 2023–2025 are available without 2026 outcomes.

Across 696 paired active rows:
- Ridge MAE `2.73590`;
- scheme-enriched MAE `2.77667` (~1.49% worse);
- Spearman `0.69604 -> 0.68032`;
- mean position rank MAE `10.0549 -> 10.3274` (~2.71% worse).

Disposition: `INSUFFICIENT EVIDENCE`.

## Combined confirmation / sensitivity

Development-selected families: none.

Combined model therefore equals locked Ridge, not a new enriched model.

2022–2025 locked Ridge confirmation:
- n 954;
- MAE `2.6801823057`;
- RMSE `3.5699801547`;
- Spearman `0.6954278827`;
- mean position rank MAE `10.4536789767`.

Source-omission and +/-0.5 SD perturbation tests are correctly vacuous because no enrichment family was selected. Fallback remains deterministic `LOCKED_RIDGE`.

## Required final family dispositions

- OPPORTUNITY_ROLE — `INSUFFICIENT EVIDENCE`
- EFFICIENCY_REGRESSION — `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE` (coverage specifically)
- QB_TEAM_ENVIRONMENT — `INSUFFICIENT EVIDENCE`
- OL_ENVIRONMENT — `INSUFFICIENT EVIDENCE`
- AGE_DRAFT_INTERACTIONS — `INSUFFICIENT EVIDENCE`
- PIT_DEPTH_ROSTER — `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE`
- SHORT_HISTORY_SCHEME — `INSUFFICIENT EVIDENCE`
- STAFF_CONTINUITY — `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE`

`CORE MODEL SUPPORTED`: none.  
New `WARNING / EXPLANATION ONLY`: none.

## Recommended Phase-2 returning-player specification

For Manager consideration:

- ordering: accepted WR-025 Ridge unchanged;
- risk: accepted WR-027 warning-only architecture unchanged;
- Huber: no replacement;
- rookies: separate transparent prior remains benchmark;
- WR-029 enriched families: do not promote;
- fallback: locked Ridge;
- retain WR-029 provenance/cutoff/source-version/coverage/fallback governance concepts for later engine specification if Manager accepts them.

Detailed result:
`.ai/research/ADV_CONTEXT_ENRICHMENT.md`

## Reproducibility

Successful guarded execution:
- workflow run `34430397953` — SUCCESS;
- scoring head `1e14be7d481b21b81f0f0f7ca3ed69d0250cf013`;
- generated-result commit `16074f133e7e122a13c955f287df28f0019af9cc`.

Artifact:
- ID `10134274500`;
- SHA-256 `efc58c76cb87b1994626355764719d8c1374a0a578b3538fe61ab4c3f6951c5b`.

The execution-only workflow was removed after output freeze and must not appear in the final research PR.

## Integrity statements

2026 outcomes inspected: **NO**  
WR-021 snapshot changed: **NO**  
WR-023 protocol/manifest changed: **NO**  
Production files changed: **NO**  
Production rankings changed: **NO**  
Canonical `.ai/shared/*` changed: **NO**

## Blocking issues

None for WR-029 research completion.

No evidence from WR-029 authorizes a production ranking change. Final prospective promotion remains separately gated by WR-023 and WR-D001.

## Recommended next role

Manager / Architect

## Exact next action

Review the WR-029 research PR and accept/reject the family dispositions and proposed Phase-2 returning-player specification. If accepted, freeze Phase 2 around the existing WR-025 Ridge ordering + WR-027 warning-only architecture, while carrying forward the accepted provenance/coverage/fallback governance rather than these rejected enrichment families.

## Checkpoint / SHA

Verify exact final research branch head and exact-head CI after this handoff commit.
