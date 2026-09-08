# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-010
Role: Research & Development (R&D)
Status: COMPLETE — R&D ONLY / MORE EVIDENCE NEEDED

## Question investigated

Can the War Room identify a materially better preseason ranking source than its current FantasyPros Top-20 PPR ECR baseline and safely automate ranking ingestion without weakening ranking authority, provenance, reliability, access compliance, or the mature production baseline?

## Verified starting state

- WR-010 starting SHA: `2cab85f981e06f5f19bd4a7631a28adf2f7ff351`
- project mode: MAINTENANCE / STABLE
- production ranking/value authority: FantasyPros 2026 PPR ECR
- ESPN rank/ADP: timing/market signal only
- production implementation authorization: NONE
- Builder: IDLE
- Auditor: IDLE

## Latest repository state verified

- latest observed canonical `main`: `c365a3e2701d618c2776d8daf1293b81224e854b`
- R&D branch: `wr-010-research-ranking-ingestion`
- Research PR: #111 — `WR-010 Ranking accuracy and ingestion R&D findings`
- PR is research-only; do not treat it as production ranking/API implementation

## Work completed

- traced the current checked-in CSV -> generated 717-player dataset -> SHA-256 baseline acceptance pipeline
- reviewed the existing validated local Top-20 CSV override and prior fail-closed FantasyPros API retirement
- reviewed current FantasyPros Draft Accuracy methodology, 2023/2024/2025 results, and recent rolling multi-year leaderboards
- compared single expert, top-3, top-5, top-10, broad ECR, recency-weighted and accuracy-weighted strategies
- reviewed current FantasyPros API ranking/expert/player capabilities
- reviewed current API access/pricing/support and published API Terms
- proposed a non-production fail-closed importer architecture
- documented full evidence and URLs in `.ai/research/RANKING_INGESTION_DISCOVERY.md`

## Historical accuracy findings

VERIFIED FACT:
- FantasyPros Draft Accuracy is Half-PPR, not Full PPR
- current 2023–2025 multi-year top 10: Jody Smith, Sean Koerner, Joey Wright, Jeff Ratcliffe, Dave Kluge, Nick Mariano, Jared Smola, Jeff Bell, Kev Wheeler, Chris Raybon
- 2025 single-year #1 Seth Miller is #28 over 2023–2025, while Jody Smith is #9 in 2025 but #1 over 2023–2025
- Sean Koerner, Chris Raybon, Jared Smola, Jody Smith and Jeff Ratcliffe appear in the top 10 of all three rolling windows reviewed: 2021–2023, 2022–2024, 2023–2025

STRONG EVIDENCE:
- a rolling multi-year cohort is a more stable expert-quality prior than a single-season winner
- consensus reduces reliance on one analyst
- top-10 has better contributor/stability resilience than top-3/top-5

UNKNOWN:
- no modern held-out/prospective evidence reviewed proves rolling top-10 materially outperforms the War Room's existing accuracy-selected Top-20 PPR baseline

## Source strategy result

Best future hypothesis:
**rolling three-year Top-10 Draft Accuracy cohort + current PPR equal-vote FantasyPros consensus / Rank Points**.

Runner-up:
**rolling three-year Top-5 cohort**.

Current production recommendation:
**retain the existing Top-20 FantasyPros PPR ECR baseline** until material lift is demonstrated.

Do not use a single #1 expert as sole authority. Do not introduce custom accuracy/recency weighting from ordinal accuracy ranks without a real backtest.

## PPR qualification

Historical FantasyPros Draft Accuracy is Half-PPR. R&D therefore treats it as an expert-selection prior, not proof of PPR-specific accuracy. If the cohort is ever used, the ranking payload should be the selected experts' current **PPR** rankings.

## Automated-ingestion finding

VERIFIED FACT:
Current FantasyPros API documentation supports:
- PPR consensus rankings
- expert-ID filtering
- rankings/per-expert data
- Ranking Experts endpoint
- canonical player IDs/metadata
- expert-count/ranking-spread/freshness metadata

Technical feasibility: **YES**.

UNKNOWN:
R&D did not verify from the current published schema that the rolling multi-year Draft Accuracy leaderboard itself is exposed as a supported machine-readable field. Do not make recurring ranking-page scraping a core production dependency.

Recommended cohort lifecycle if later approved:
- once-per-offseason Manager-reviewed cohort manifest from the official finalized rolling leaderboard
- resolve members to official FantasyPros expert IDs
- use those IDs for filtered current PPR ranking refreshes

## Access / licensing finding

VERIFIED FACT:
- free API tier is non-production/prototyping
- paid HOF includes personal/non-commercial production API access
- redistribution/commercial use has separate requirements
- API key must remain confidential
- published support/terms prohibit using API data to build a product/service that competes with FantasyPros

UNRESOLVED:
The War Room is a draft assistant and FantasyPros offers draft-assistant products. R&D cannot responsibly declare this specific use compatible without provider clarification. R&D also does not assume API-derived ranking payloads may be redistributed through this public repository under a personal-production license.

This is an operational compatibility finding, not legal advice.

## Recommended ingestion architecture if later approved

Do not put an API key in the static browser app or Companion source.

Preferred flow:

`FantasyPros API -> credential-safe local/maintainer fetch -> staged candidate -> fail-closed validation/reconciliation -> explicit promote -> War Room`

Required design properties:
- reviewed cohort/provenance manifest
- season/PPR/preseason checks
- provider freshness gate
- expected expert identities/minimum healthy cohort gate
- player-count/position completeness checks
- duplicate ID/canonical-name checks
- FantasyPros player-ID-first reconciliation
- quarantine/report source-only unknowns rather than silently expanding canonical authority
- preserve broader-ECR and ADP-only depth policy
- atomic candidate generation; no partial overwrite
- current dataset/baseline/board/recommendation/invariant validation as appropriate
- rank-movement/missing-player review report
- last-known-good fallback
- explicit promotion initially
- audit log
- ESPN market-timing role unchanged

Exact minimum-expert/player thresholds must be derived from live intended-access responses and independently validated; R&D did not invent production constants.

## Experiments performed

None.

Reason:
A synthetic parser does not resolve the important unknowns: intended-tier API completeness, current expert-ID availability, machine-readable accuracy metadata, provider compatibility, or material accuracy lift. No API key was requested, exposed, or committed.

## Evidence gates before any production task

1. Provider clarification for the intended personal/non-commercial War Room use and storage/display/redistribution model.
2. Credential-safe non-production live API completeness test with a user-owned key outside chat/repository.
3. Independent historical/held-out comparison of current Top-20 vs rolling top-5/top-10/broad-ECR/single-expert alternatives if lawful data is obtainable.
4. Only if favorable: new Manager-approved production task plus independent audit because ranking authority affects scoring/recommendations.

## Outcome

**R&D ONLY / MORE EVIDENCE NEEDED**

Do not modify production rankings.
Do not integrate an API.
Do not replace the current validated CSV/local-override path.

## Confidence

- rolling multi-year cohort over single expert: HIGH
- current API technical feasibility: HIGH
- rolling top-10 materially better than current Top-20: LOW / UNPROVEN
- War Room API-use compatibility: LOW / PROVIDER CLARIFICATION REQUIRED
- fail-closed maintainer-side architecture: HIGH

## Files updated

- `.ai/research/RANKING_INGESTION_DISCOVERY.md`
- `.ai/research/HANDOFF.md`

Production files changed: NO
Production rankings changed: NO
API integrated: NO
Canonical `.ai/shared/*` changed by R&D: NO

## Blocking issues

None for WR-010 R&D completion.
Production promotion is blocked on the evidence gates above.

## Recommended next role

Manager / Architect

## Exact next action

Manager reviews PR #111 and `.ai/research/RANKING_INGESTION_DISCOVERY.md`, then chooses whether to:
1. remain in MAINTENANCE / STABLE with the current ranking path;
2. authorize a narrow follow-up R&D task for provider clarification plus a credential-safe API completeness experiment; or
3. stop further API work if the unresolved benefit/usage questions do not justify more effort.

Do not assign Builder production integration until permission/completeness and material-value evidence are sufficient.

## Checkpoint / SHA

- starting SHA: `2cab85f981e06f5f19bd4a7631a28adf2f7ff351`
- latest observed canonical `main`: `c365a3e2701d618c2776d8daf1293b81224e854b`
- R&D branch: `wr-010-research-ranking-ingestion`
- full evidence commit: `129be16ffe8a5ad59c1fa6e25912395d9189e043`
- PR: #111
