# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-014
Role: Research & Development (R&D)
Status: COMPLETE — R&D ONLY / MORE EVIDENCE NEEDED
Parallel Work Wave: PW-002

## Question investigated

Can The War Room build a legally usable, reproducible preseason player projection/value model from underlying football statistics that materially outperforms or complements the current FantasyPros Top-20 PPR ECR baseline?

## Verified starting state

- exact WR-014 assignment-start `main`: `041c40bc6250a2ba1cc1c6d3582c5a08254b3017`
- WR-D001 remains ACTIVE: FantasyPros PPR ECR is ranking/value authority; ESPN rank/ADP is market timing only
- WR-016 Builder layout work is independent under PW-002
- WR-014 production implementation authorization: NONE
- PFF use for model training/derivation is prohibited under this task unless separate explicit rights exist

## Work completed

Produced `.ai/research/ADVANCED_METRICS_RANKING_DISCOVERY.md` with:

- current production ranking/value integration-boundary trace;
- target-definition recommendation;
- source/licensing matrix;
- PFF and NFL/NGS rights analysis;
- nflverse/ffverse/FTN feasibility analysis;
- position-specific feature hypotheses;
- injury/role/rookie/team-context strategy;
- simple transparent vs boosted model comparison;
- open-only vs hybrid vs full-replacement architecture analysis;
- leakage-safe rolling-origin historical validation design;
- proposed material-lift gates against the current ECR baseline where lawful comparator data exists;
- data freshness / fail-closed architecture;
- explainability and downstream recommendation risks;
- bounded follow-up shadow-model experiment proposal.

## Core result

### VERIFIED FACT

The current ECR/rank is deeply embedded as player-value authority. It drives board rank/tier metadata, replacement pools, VORP/scarcity calculations, same-position ordering and recommendation explanations. A future internal model would therefore require an explicit ranking/value-authority boundary if promoted; it must not be smuggled in as a downstream strategy nudge.

### VERIFIED FACT

There is enough clearly open/licensable football data to justify a non-production shadow experiment without PFF:

- nflverse public PBP/player/team-stat infrastructure;
- `nflverse-pbp` repository license metadata: CC BY 4.0;
- ffverse `ffopportunity` expected-fantasy-points model/data: CC BY-SA 4.0 (code GPL v3);
- nflverse FTN charting subset: 2022+, explicitly CC BY-SA 4.0 with attribution.

### VERIFIED FACT

PFF's Terms updated 2026-09-04 expressly define rankings/projections/models created from PFF data as Derived Data and prohibit using PFF/API/Derived Data to train, evaluate, benchmark or otherwise develop statistical/predictive models. WR-014 used no PFF data.

### VERIFIED FACT

NFL Next Gen Stats is technically exposed through nflverse tooling, but NFL.com Terms restrict use to individual non-commercial informational purposes and prohibit systematic retrieval absent express consent. NGS is therefore excluded from the initial production-safe source set unless separate rights are established.

### VERIFIED FACT

nflverse documents a material availability gap: its injury-data source died after the 2024 season and there is no 2025 injury data / ETA. That prevents treating nflverse alone as a complete current preseason availability context.

## Target recommendation

Do not directly predict draft rank.

Recommended statistical target stack:

1. per-active-game Full-PPR production distribution;
2. opportunity/role estimates;
3. separate games-active / availability model;
4. combined season PPR distribution;
5. downstream league-specific replacement-adjusted value.

This separates football forecasting from league scarcity/roster economics and makes injury vs performance error auditable.

## Model recommendation

First experimental architecture:

- QB/RB/WR/TE position-specific models;
- transparent regularized/statistical baseline first;
- gradient-boosted challenger second;
- uncertainty/calibration required;
- model remains a shadow value source beside ECR;
- no K/DST authority change in first experiment;
- no full replacement until repeated held-out and prospective wins.

## Validation recommendation

Use strict point-in-time rolling-origin validation:

- features for target season Y must contain only information available before that season's documented draft cutoff;
- no target-season Week 1+ data;
- historical depth/roster state selected by timestamp, not season-final hindsight;
- separate per-game performance from availability error;
- evaluate Full-PPR point error, rank correlation/error, replacement-adjusted value error, top-N behavior, availability calibration and prediction-interval coverage;
- direct historical ECR comparison only if lawful contemporaneous data rights are established.

R&D proposed—not approved—material-lift guidance: roughly 5%+ pooled improvement in draft-relevant replacement-value error with paired/bootstrap uncertainty excluding zero, repeated across held-out seasons and without material position regressions.

## Why no predictive prototype was trained

A toy backtest would not resolve the key uncertainty because the required point-in-time corpus has not been assembled/audited, the current injury source has a post-2024 gap, and lawful historical contemporaneous ECR comparator access remains unresolved.

Training a convenient hindsight dataset would create leakage risk and false confidence. No PFF or restricted source was used.

## Outcome

**R&D ONLY / MORE EVIDENCE NEEDED**

The concept is feasible enough for a bounded **EXPERIMENTAL / NON-PRODUCTION open-data shadow-model task**, but no production ranking/model milestone is justified yet.

## Recommended next step

Manager may authorize a new R&D shadow experiment with:

- QB/RB/WR/TE only;
- clearly permitted/open sources only;
- no PFF;
- no NGS unless explicit rights are established;
- transparent baseline + boosted challenger;
- separate availability model;
- rolling-origin leakage-safe backtest;
- source/license manifest;
- frozen prospective preseason snapshot;
- explicit stop/continue/hybrid/replacement recommendation after results.

Builder must not receive production ranking/model work merely because this feasibility study is complete.

## Files updated

- `.ai/research/ADVANCED_METRICS_RANKING_DISCOVERY.md`
- `.ai/research/HANDOFF.md`

Production rankings changed: NO
Production scoring/recommendations changed: NO
Production dataset/API integration changed: NO
PFF data used to train/derive a model: NO
Canonical `.ai/shared/*` changed by R&D: NO
WR-016 files inspected/modified: NO

## Blocking issues

None for completion of WR-014 feasibility research.

Production model consideration remains blocked on empirical shadow-model evidence, lawful/complete source coverage, and Manager review.

## Recommended next role

Manager / Architect

## Exact next action

Manager reviews `.ai/research/ADVANCED_METRICS_RANKING_DISCOVERY.md` and decides whether the evidence justifies a separate non-production shadow-model experiment. WR-D001 remains unchanged unless a later independently validated task produces materially stronger evidence.

## Checkpoint / SHA

- WR-014 starting SHA: `041c40bc6250a2ba1cc1c6d3582c5a08254b3017`
- R&D branch: `wr-014-research-advanced-metrics`
- discovery evidence commit: `6289dd048fb7795041078032d80627b6a6cc0136`
