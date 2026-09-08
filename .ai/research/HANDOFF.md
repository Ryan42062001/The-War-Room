# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-010
Role: Research & Development (R&D)
Status: COMPLETE — R&D ONLY / MORE EVIDENCE NEEDED

## Question investigated

Can the War Room identify a materially better evidence-backed preseason ranking source than its current FantasyPros Top-20 PPR ECR baseline and safely automate ranking ingestion without weakening ranking authority, provenance, reliability, access compliance, or the mature production baseline?

## Verified starting state

- Manager-assigned WR-010 starting SHA: `2cab85f981e06f5f19bd4a7631a28adf2f7ff351`
- project mode: MAINTENANCE / STABLE
- production ranking/value authority: FantasyPros 2026 PPR ECR
- ESPN rank/ADP: timing/market information only
- Builder: IDLE
- Auditor: IDLE
- production implementation authorization: NONE

## Latest repository state verified

- latest observed canonical `main`: `c365a3e2701d618c2776d8daf1293b81224e854b`
- WR-010 assignment advanced from its starting SHA through Manager/shared/research task-state commits only; no production ranking/scoring/API implementation was authorized by those assignment commits
- R&D branch: `wr-010-research-ranking-ingestion`

## Sources reviewed

Repository:
- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/shared/DECISIONS.md`
- `.ai/shared/WORKFLOW.md`
- `.ai/manager/HANDOFF.md`
- `.ai/manager/WR-010.md`
- prior `.ai/research/HANDOFF.md`
- `scripts/build-fantasypros-2026.mjs`
- `scripts/validate-fantasypros-baseline.mjs`
- `js/war-room-rankings.js`
- `data/FantasyPros_2026_Draft_Top20_Rankings.csv`
- `docs/FANTASYPROS_ESPN_INTEGRATION_DEEP_DIVE.md`

External authoritative evidence:
- FantasyPros Draft Accuracy methodology / FAQ
- FantasyPros 2023–2025 multi-year Draft Accuracy leaderboard
- 2023, 2024 and 2025 Draft Accuracy results / rolling-window analyses
- current FantasyPros ECR calculation documentation
- current FantasyPros API product/access page
- current FantasyPros API reference
- current API access support article
- published FantasyPros API Terms of Use

Full URLs and evidence classification are recorded in `.ai/research/RANKING_INGESTION_DISCOVERY.md`.

## Current pipeline finding

VERIFIED FACT:
- checked-in Top-20 PPR, broad PPR ECR and ADP CSVs build the canonical 717-player dataset
- the build asserts exact expected population/position counts, zero duplicate canonical names and contiguous ranks
- SHA-256 baseline validation fails closed until a changed source/runtime dataset is explicitly accepted
- the browser's local Top-20 CSV override is separately validated and does not silently rewrite the bundled production dataset
- a prior partial FantasyPros public API response was correctly rejected and that API integration was retired

The current ingestion design is therefore already conservative and provides useful safety primitives for any future importer.

## Historical accuracy findings

VERIFIED FACT:
- FantasyPros preseason Draft Accuracy is evaluated in **Half-PPR**, not Full PPR
- current 2023–2025 multi-year leaders are:
  1. Jody Smith
  2. Sean Koerner
  3. Joey Wright
  4. Jeff Ratcliffe
  5. Dave Kluge
  6. Nick Mariano
  7. Jared Smola
  8. Jeff Bell
  9. Kev Wheeler
  10. Chris Raybon
- 2025 single-season #1 Seth Miller is #28 on the 2023–2025 rolling leaderboard; Jody Smith is #9 in 2025 but #1 over the rolling window
- Sean Koerner, Chris Raybon, Jared Smola, Jody Smith and Jeff Ratcliffe appear in the top 10 of all three recent rolling windows reviewed: 2021–2023, 2022–2024, 2023–2025

STRONG EVIDENCE:
- multi-year selection is a more stable expert-quality prior than following one season's winner
- consensus is safer than one analyst as sole ranking authority
- a top-10 rolling window has better contributor/stability resilience than a top-3/top-5 cutoff

UNKNOWN:
- there is no modern prospective/held-out result proving a rolling top-10 PPR consensus materially outperforms the War Room's existing accuracy-selected Top-20 PPR baseline

## PPR vs Half-PPR limitation

The Half-PPR leaderboard may identify consistently strong forecasters, but it does not prove any expert/cohort is “the most accurate PPR ranker.”

R&D recommends treating rolling Half-PPR Draft Accuracy as an **expert-selection prior**, then retrieving the selected experts' **current Full-PPR rankings** for the War Room. The scoring-format mismatch must remain explicit in any future product language or decision record.

## Source-strategy comparison

Best future hypothesis:
**rolling three-year Top-10 Draft Accuracy cohort + current PPR equal-vote FantasyPros consensus / Rank Points**.

Runner-up:
**rolling three-year Top-5 cohort**.

Current production recommendation:
**retain the existing Top-20 FantasyPros PPR ECR baseline** until the future hypothesis demonstrates material lift.

Not recommended as sole authority:
- single #1 expert
- top-3 cohort
- custom accuracy weighting based only on ordinal accuracy ranks

Custom recency/accuracy weighting should not be introduced without a real backtest / score magnitudes because ordinal rank weights would be arbitrary and increase overfitting risk.

## Automated ingestion finding

VERIFIED FACT:
The current FantasyPros API advertises and documents:
- PPR consensus rankings
- expert filtering by IDs
- ranking/per-expert data
- Ranking Experts endpoint
- canonical player IDs/metadata
- response fields including expert count, ranking spread and `last_updated`

TECHNICAL FEASIBILITY:
**YES** — the documented API can represent an accuracy-selected PPR cohort and return machine-readable ranking/player data.

UNKNOWN:
R&D could verify the current Ranking Experts endpoint but could not verify from the current published schema that the rolling multi-year Draft Accuracy leaderboard itself is exposed as a supported machine-readable field. Do not make recurring accuracy-page scraping a core production dependency.

Recommended cohort lifecycle if later approved:
- Manager-reviewed annual cohort manifest from official finalized rolling multi-year results
- resolve selected analysts to official FantasyPros expert IDs
- use those IDs for filtered current PPR consensus refreshes during preseason

## API/license/access findings

VERIFIED FACT:
- free API access is non-production/prototyping
- active HOF includes personal/non-commercial production API access
- redistribution/commercial use requires separate treatment/agreement
- published support/terms prohibit using API data to build a product/service that competes with FantasyPros
- API key must remain confidential

UNRESOLVED / REQUIRES PROVIDER CLARIFICATION:
The War Room is a draft assistant and FantasyPros offers draft-assistant products. R&D therefore cannot conclude from the published personal-production language alone that this specific War Room use is permitted under the non-compete provision.

R&D also does not assume API-derived full rankings can be committed/redistributed in this public repository under a personal API license.

This is an operational compatibility finding, not legal advice.

## Recommended ingestion architecture if later approved

Do **not** fetch directly from the static browser app or ship the API key in page/extension JavaScript.

Preferred architecture:

`FantasyPros API -> local/maintainer fetch -> staged candidate snapshot -> validation/reconciliation -> explicit promote -> War Room`

Production-safe gates should include:
- source/provenance manifest
- season/scoring/ranking-type checks
- reviewed expert IDs/names and minimum healthy cohort count
- provider freshness threshold
- player-count/position coverage checks
- duplicate player-ID/canonical-name checks
- FantasyPros player-ID-first reconciliation
- source-only/unmatched player quarantine instead of silent canonical expansion
- preserve broad-ECR/ADP depth policy
- generate candidate atomically rather than partial overwrite
- run existing dataset/baseline/board/recommendation/invariant tests as appropriate
- rank-movement/missing-player review report
- last-known-good fallback
- explicit promotion initially
- audit log
- ESPN market-timing authority remains unchanged

Exact thresholds (including minimum expert count) must be validated against real intended-access API responses rather than guessed by R&D.

## Experiments performed

None.

Reason:
A synthetic API transformer would not resolve the important uncertainty. The repository already proves parsing/normalization/validation is feasible. The unresolved questions are:
- Premium/HOF payload completeness for the intended filtered cohort
- live expert-ID availability
- machine-readable accuracy metadata
- provider permission for this specific draft-assistant use
- material ranking-quality lift vs the current Top-20 baseline

No API key was requested, exposed, or committed.

## Evidence required before production promotion

1. **Provider clarification** for the intended personal/non-commercial War Room use, local storage/display and any redistribution/public-repository implications.
2. **Live non-production API completeness test** with a user-owned key outside chat/repository, confirming intended PPR ALL population, expert IDs/count and freshness.
3. **Accuracy lift evaluation** comparing current Top-20 policy against rolling top-5/top-10/broad-ECR/single-expert alternatives on independent historical or held-out evidence if obtainable.
4. If favorable, a new Manager-approved production task and mandatory independent audit because ranking authority affects scoring/recommendation behavior.

## Explicit recommendation outcome

**R&D ONLY / MORE EVIDENCE NEEDED**

Do not change production ranking authority yet.
Do not integrate the API yet.
Do not replace the current manual/validated refresh path yet.

## Confidence

- rolling multi-year cohort is preferable to single expert: HIGH
- official API technical feasibility: HIGH
- top-10 materially better than current Top-20 baseline: LOW / UNPROVEN
- specific API-license compatibility for the War Room: LOW / NEEDS PROVIDER CLARIFICATION
- fail-closed maintainer-side architecture direction: HIGH

## Files updated

- `.ai/research/RANKING_INGESTION_DISCOVERY.md`
- `.ai/research/HANDOFF.md`

Production files changed: NO
Production rankings changed: NO
API integrated: NO
Canonical `.ai/shared/*` changed by R&D: NO

## Blocking issues

None for completion of WR-010 research.

Production promotion remains blocked on the evidence gates above.

## Recommended next role

Manager / Architect

## Exact next action

Manager independently reviews `.ai/research/RANKING_INGESTION_DISCOVERY.md` and decides whether to:
1. keep the project in MAINTENANCE / STABLE with the current ranking path;
2. authorize a narrow follow-up R&D task for provider clarification + a credential-safe non-production API completeness experiment; or
3. reject further API work if the unresolved usage/benefit questions do not justify more effort.

Do not assign Builder production integration until permission/completeness and material-value evidence are sufficient.

## Checkpoint / SHA

- WR-010 starting SHA: `2cab85f981e06f5f19bd4a7631a28adf2f7ff351`
- latest observed canonical `main`: `c365a3e2701d618c2776d8daf1293b81224e854b`
- R&D branch: `wr-010-research-ranking-ingestion`
- full evidence commit before this handoff update: `129be16ffe8a5ad59c1fa6e25912395d9189e043`
