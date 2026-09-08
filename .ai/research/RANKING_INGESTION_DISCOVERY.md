# WR-010 — Ranking Accuracy & Automated Ingestion Feasibility

Status: R&D COMPLETE / MORE EVIDENCE NEEDED
Role: Research & Development (R&D)
Date: 2026-09-08
Starting SHA: `2cab85f981e06f5f19bd4a7631a28adf2f7ff351`
Latest `main` verified during research: `c365a3e2701d618c2776d8daf1293b81224e854b`
Production implementation authorized: NO

## Executive conclusion

**Recommendation outcome: R&D ONLY / MORE EVIDENCE NEEDED.**

The current War Room ranking authority should **not** be replaced yet, and the FantasyPros API should **not** be integrated into production yet.

The investigation found two separate conclusions:

1. **Ranking-source direction:** the strongest future accuracy hypothesis is not a single expert. It is a current **PPR consensus drawn from a rolling multi-year preseason-accuracy cohort**, with a top-10 rolling three-year cohort the best current balance of expert-quality selection, resilience to one-year variance, and contributor availability. The present War Room already uses an accuracy-selected Top-20 PPR consensus, so this would be an incremental refinement rather than a correction of a weak baseline.
2. **Automation direction:** the current official FantasyPros API is technically capable of supplying filtered PPR consensus rankings and canonical player metadata. If production access is ever approved, the safest War Room architecture is a **maintainer-side/local importer that stages and validates a candidate snapshot**, not a browser-direct API call. It should preserve the existing explicit validation, last-known-good and human-review gates.

Two blockers prevent promotion today:

- **Material ranking lift is unproven.** No current prospective or retrospective evidence shows that a rolling top-10 cohort materially outperforms the War Room's existing accuracy-selected Top-20 PPR ECR in actual War Room draft decisions.
- **Usage compatibility is unresolved.** FantasyPros advertises personal/non-commercial production API access with HOF, but its published API terms also prohibit using the API data to create a product/service that competes with FantasyPros. The War Room is a draft assistant, while FantasyPros offers draft-assistant products. R&D cannot responsibly declare this use compatible without provider clarification. Public redistribution of API-derived data has separate restrictions as well.

Therefore the correct next step is targeted evidence gathering, not implementation.

---

## Evidence classification

This report uses:

- **VERIFIED FACT** — directly established by current repository state, official FantasyPros documentation, or official FantasyPros accuracy results.
- **STRONG EVIDENCE** — multiple relevant observations support the claim, but it is not direct proof of a War Room production outcome.
- **INFERENCE** — reasoned design/product conclusion from verified evidence.
- **UNKNOWN** — material uncertainty that remains unresolved.

---

## 1. Current War Room ranking pipeline

### VERIFIED FACT — production ranking authority

Canonical decision WR-D001 states:

- FantasyPros 2026 PPR ECR is the player-value/ranking authority.
- ESPN board rank/ADP is market timing, not player value.

Repository: `.ai/shared/DECISIONS.md`.

### VERIFIED FACT — source files and generated dataset

`scripts/build-fantasypros-2026.mjs` currently consumes:

- `data/FantasyPros_2026_Draft_Top20_Rankings.csv`
- `data/FantasyPros_2026_Draft_ALL_Rankings.csv`
- `data/FantasyPros_2026_Overall_ADP_Rankings.csv`

The primary ECR ordering is the Top-20 Experts PPR export. Players missing from that export are appended from broader FantasyPros ECR; ADP-only players are appended as searchable depth without fabricated ECR.

The build asserts the established baseline:

- 380 Top-20 ECR players
- 140 broader-ECR fallback players
- 520 ECR-ranked players total
- 197 ADP-only players
- 717 players total
- QB 102 / RB 170 / WR 242 / TE 115 / K 56 / DST 32
- zero duplicate canonical player names
- contiguous board ranks

Source: `scripts/build-fantasypros-2026.mjs`.

### VERIFIED FACT — hash-protected baseline

`scripts/validate-fantasypros-baseline.mjs` hashes the three ranking source files and generated runtime dataset using SHA-256. Any change fails validation until an operator explicitly accepts a new baseline with `baseline:accept`.

This means the current production pipeline is intentionally **fail closed**: a data change cannot silently become the accepted bundled ranking baseline.

### VERIFIED FACT — local refresh path

The browser supports a local validated FantasyPros Top-20 PPR CSV override. The override:

- must contain a plausible ranked population (100–600 rows)
- reconciles to the embedded canonical dataset
- preserves the same total player population
- rejects invalid persisted override shape / duplicate canonical identity
- records import source filename/date metadata
- lives in local storage rather than silently rewriting the bundled dataset

Source: `js/war-room-rankings.js`.

### VERIFIED FACT — historical API attempt was correctly retired

`docs/FANTASYPROS_ESPN_INTEGRATION_DEEP_DIVE.md` records that an earlier FantasyPros public/free API path was removed after the live account returned only 10 consensus players with no documented paging. The guard rejected the partial response before changing the authoritative overlay.

That historical result does **not** prove the current 2026 HOF/Premium product has the same limitation. It does prove an important War Room lesson: successful authentication is not evidence of a complete authoritative ranking payload.

---

## 2. What “most accurate” should mean for this War Room

### VERIFIED FACT — FantasyPros preseason accuracy is Half-PPR

FantasyPros' current Draft Accuracy methodology evaluates experts using **Half-PPR**, not Full PPR. Rankings are snapshotted immediately before the season, evaluated against actual fantasy output using a rank-value / Accuracy Gap approach, and weighted toward draft-relevant players. Overall accuracy combines QB/RB/WR/TE; K and DST are excluded from the overall score.

Official sources:
- https://www.fantasypros.com/about/faq/football-draft-accuracy-methodology/
- https://support.fantasypros.com/hc/en-us/articles/115002307688-How-do-you-measure-the-draft-accuracy-of-fantasy-football-experts

### VERIFIED FACT — FantasyPros itself cautions against over-weighting preseason accuracy

FantasyPros notes that preseason accuracy has far fewer observations than weekly/in-season accuracy and cautions against putting too much weight on a single preseason result.

Source:
- https://www.fantasypros.com/accuracy/

### R&D definition

For the War Room, “most accurate” should not mean “the expert who finished #1 last year.” A defensible preseason ranking source should satisfy all of these:

1. **Multi-year preseason predictive quality** — prefer a rolling history over one-season placement.
2. **Current PPR applicability** — fetch the selected experts' present Full-PPR rankings even though historical selection is based on Half-PPR accuracy.
3. **Freshness** — rankings must be recent enough for the draft date.
4. **Completeness** — enough currently publishing experts and ranked players must be present.
5. **Consensus robustness** — reduce exposure to one expert's injury take, projection error or idiosyncratic ranking.
6. **Reproducible provenance** — season, scoring, expert cohort and timestamps must be recorded.
7. **Operational safety** — a partial/stale source must never demote the last-known-good ranking authority.

### INFERENCE — historical Half-PPR accuracy is useful but not a PPR accuracy proof

RB/WR/TE valuation can move under reception scoring. Therefore FantasyPros' Half-PPR leaderboard is best treated as an **expert-quality prior**. The intended production ranking, if ever used, should still be the selected cohort's actual **PPR** consensus.

This allows historical accuracy to answer “which experts have been consistently good forecasters?” while PPR ranking data answers “what are those experts recommending for this league format now?”

It does **not** justify labeling any expert or cohort “the most accurate PPR rankings” without a PPR-specific backtest.

---

## 3. Historical accuracy findings

### VERIFIED FACT — current rolling 2023–2025 leaderboard

FantasyPros currently ranks the top 10 multi-year draft experts for 2023–2025 as:

1. Jody Smith — Draft Sharks
2. Sean Koerner — The Action Network
3. Joey Wright — Footballguys
4. Jeff Ratcliffe — FTN
5. Dave Kluge — Footballguys
6. Nick Mariano — RotoBaller
7. Jared Smola — Draft Sharks
8. Jeff Bell — Footballguys
9. Kev Wheeler — Wheel Route FF
10. Chris Raybon — The Action Network

Official source:
- https://www.fantasypros.com/nfl/accuracy/multi-year-draft.php

### VERIFIED FACT — single-year winner differs materially from rolling leader

2025 single-year draft accuracy:

1. Seth Miller
2. Guilherme Gianni
3. Michael Bobal
4. Jason Willan
5. Marc Shannep
6. Joey Wright
7. Ryan Weisse
8. Kevin Steele
9. Jody Smith
10. Tim Heaney

Seth Miller is #28 on the current 2023–2025 multi-year leaderboard, while Jody Smith is #9 in the 2025 single year but #1 over 2023–2025.

Official sources:
- https://www.fantasypros.com/nfl/accuracy/draft
- https://www.fantasypros.com/nfl/accuracy/multi-year-draft.php

### VERIFIED FACT — rolling cohorts show recurring high performers

The official 2021–2023 rolling top 10 included Sean Koerner, Chris Raybon, Jared Smola, Jody Smith and Jeff Ratcliffe.

The official 2022–2024 rolling top 10 again included Sean Koerner, Chris Raybon, Jared Smola, Jody Smith and Jeff Ratcliffe.

All five remain in the 2023–2025 rolling top 10.

Sources:
- 2021–2023 list: https://www.fantasypros.com/2024/07/most-accurate-fantasy-football-draft-rankings-2023/amp/
- 2022–2024 list: https://www.fantasypros.com/2025/07/2024s-most-accurate-fantasy-football-draft-rankings/
- 2023–2025 list: https://www.fantasypros.com/nfl/accuracy/multi-year-draft.php

This recurring core is stronger evidence of persistent expert quality than any one season's winner.

### STRONG EVIDENCE — top-10 is a more stable selection boundary than top-5

Across the three rolling windows above, only a small subset remains inside the top five every time, while five experts persist inside the top ten across all three windows.

That argues against selecting only the current top 3 or top 5 if the goal is a stable maintainable cohort. A top-10 boundary provides more room for durable contributors while still excluding the large majority of the field.

### STRONG EVIDENCE — consensus reduces single-expert outlier risk

FantasyPros has long documented that its consensus is based on Rank Points rather than a naive average. Its historical accuracy work also found strong results from all-expert and prior-accuracy-selected top-five consensus cuts. The study is old and should not be treated as modern proof, but it supports the general ensemble principle.

Sources:
- current ECR calculation: https://support.fantasypros.com/hc/en-us/articles/115001219327-What-is-ECR-Expert-Consensus-Rankings-and-how-do-you-calculate-it
- historical consensus study: https://www.fantasypros.com/2011/01/expert-consensus-rankings-accuracy/

### IMPORTANT limitation

R&D did **not** find a modern prospective study showing that:

- top-10 rolling multi-year preseason experts,
- using their current PPR ranks,

outperform the War Room's existing prior-accuracy-selected Top-20 PPR export in draft outcomes.

That missing comparison is decisive for the “material improvement” question.

---

## 4. Candidate source strategies

### A. Current War Room Top-20 accurate-expert PPR consensus

**Expected quality:** HIGH

**Strengths:**
- already accuracy-selected
- PPR-native current rankings
- 380-player primary ECR population plus broader fallback
- broader cohort reduces contributor absence risk
- production/test/persistence architecture already validated

**Weakness:**
- the policy is based primarily on the prior accuracy cohort rather than a rolling multi-year cohort; constituent provenance is not preserved in the current CSV itself.

**R&D position:** production baseline to retain until an alternative is proven materially better.

### B. Single best multi-year expert

Current candidate: Jody Smith (#1, 2023–2025).

**Expected quality:** potentially high but high variance.

**Problems:**
- one analyst becomes a single point of opinion and publication failure
- the historical leaderboard is Half-PPR
- no single expert is guaranteed to remain #1 in future windows
- a single stale or incomplete ranking could move the entire board

**R&D position:** NOT RECOMMENDED as sole authority.

### C. Top-3 rolling multi-year consensus

Current three: Jody Smith, Sean Koerner, Joey Wright.

**Pros:** maximum accuracy concentration.

**Cons:** contributor availability/freshness risk is high; one missing expert changes one-third of the voting population.

**R&D position:** too concentrated for production authority.

### D. Top-5 rolling multi-year consensus

Current five add Jeff Ratcliffe and Dave Kluge.

**Pros:** stronger diversification while keeping a tight accuracy screen.

**Cons:** top-five membership is more volatile between rolling windows, and one or two unavailable publishers can materially change the cohort.

**R&D position:** credible runner-up strategy.

### E. Top-10 rolling multi-year consensus

Current ten are listed above.

**Pros:**
- still strongly accuracy-selected
- rolling window reduces one-season winner noise
- enough diversity to survive one or more non-publishing/stale experts
- five experts persisted in the top 10 across all three recent rolling windows reviewed
- API expert filtering can theoretically reproduce the cohort exactly

**Cons:**
- Half-PPR historical selection vs PPR target remains a qualification
- current availability of every intended expert must be checked each refresh
- material lift over the existing Top-20 baseline has not been proven

**R&D position:** **BEST FUTURE SOURCE HYPOTHESIS**, not yet a production replacement.

### F. Recency-weighted multi-year cohort

Example concept: rolling multi-year accuracy establishes eligibility, then recent seasons get extra weight.

**Concern:** without raw comparable Accuracy Gap magnitudes, weighting ordinal leaderboard rank can create arbitrary model behavior. Current ranking freshness should be used as an eligibility gate, not automatically confused with historical-quality weighting.

**R&D position:** do not add weighting without a backtest.

### G. Accuracy-weighted aggregation

Example concept: weight every expert by historical accuracy rank/gap.

**Concern:** current public leaderboards primarily expose ordinal ranks. Weighting rank 1 twice as much as rank 2 has no demonstrated statistical meaning. Raw errors would be preferable, as would a prospective backtest.

**R&D position:** defer; higher overfitting risk than equal-vote consensus.

### Strategy ranking

1. **Top-10 rolling three-year accuracy-selected PPR consensus** — strongest future hypothesis.
2. **Current Top-20 accuracy-selected PPR ECR** — strongest proven War Room production baseline; keep it now.
3. **Top-5 rolling three-year cohort** — higher concentration, less availability resilience.
4. **Broad/default ECR** — robust fallback, weaker accuracy selection.
5. **Single multi-year #1 expert** — avoid as sole authority.
6. **Custom recency/accuracy weighting** — not justified without a real backtest and score magnitudes.

This ranking separates **future hypothesis** from **currently justified production authority**. Today, #2 remains the correct production choice because #1 has not established material lift.

---

## 5. Official FantasyPros API feasibility

### VERIFIED FACT — current official API offering

FantasyPros currently advertises one JSON API across its sports products and documents:

- consensus rankings
- rankings / per-expert data
- ranking-expert profiles
- players and metadata
- news/injuries/projections

The API uses an `x-api-key` header.

Official product page:
- https://www.fantasypros.com/api-data/

### VERIFIED FACT — consensus endpoint can represent the proposed cohort

The current API reference documents:

`GET /v2/json/nfl/{season}/consensus-rankings`

Relevant parameters include:

- `position=ALL`
- `scoring=PPR`
- `filters=<colon-delimited expert IDs>`
- `experts=show`
- preseason/week controls

The response schema includes fields such as:

- player ID/name/team/position
- `rank_ecr`
- rank minimum/maximum/average/std-dev
- `total_experts`
- `last_updated`
- scoring/type/year metadata

Reference:
- https://api.fantasypros.com/v2/docs

### VERIFIED FACT — current API product page lists ranking-expert endpoint

FantasyPros currently advertises:

`GET /{sport}/{season}/rankings/experts`

for expert profiles / ranking details.

### UNKNOWN — supported machine-readable multi-year accuracy field

The historical War Room deep dive records that an older expert response exposed `accuracy_draft_season` and nested `accuracy_draft` fields.

However, in the current publicly indexed API reference reviewed for WR-010, R&D could verify the current Ranking Experts endpoint but **could not verify a current supported field/schema that directly exposes the rolling multi-year Draft Accuracy leaderboard**.

Therefore a production design must not assume that expert cohort selection can be automatically derived from an API field until this is live-proven/documented.

### R&D recommendation for cohort identity

Until a supported accuracy feed is verified:

- select the accuracy cohort **once per offseason** from the official finalized rolling multi-year leaderboard
- resolve each selected analyst to the official FantasyPros API expert ID
- record a reviewed cohort manifest: expert ID, name, affiliation, accuracy window and source URL/date
- use that manifest for in-season/preseason filtered PPR ranking refreshes

This avoids making recurring HTML scraping a production dependency.

---

## 6. API access and usage constraints

This section is an operational compatibility review, **not legal advice**.

### VERIFIED FACT — free tier is non-production

FantasyPros says the free API tier is for building/testing/prototyping and is non-production.

### VERIFIED FACT — Premium/HOF provides personal production access

FantasyPros says an active paid HOF subscription includes production API access for personal, non-commercial applications, with higher rate limits.

Sources:
- https://www.fantasypros.com/api-data/
- https://support.fantasypros.com/hc/en-us/articles/49749297704475-How-do-I-request-access-to-the-FantasyPros-API

### VERIFIED FACT — commercial plan is required for redistribution/commercial/high-volume use

The current API product/support pages explicitly direct data redistribution and commercial use to a commercial agreement.

### VERIFIED FACT — published non-compete restriction

FantasyPros' API support article states that API data may not be used to build a product or service that directly competes with FantasyPros. The published API Terms go further and state that API materials/data may not be used to compete directly or indirectly or to develop/provide a product/service that competes with a FantasyPros product/service.

Sources:
- https://support.fantasypros.com/hc/en-us/articles/49749297704475-How-do-I-request-access-to-the-FantasyPros-API
- https://api.fantasypros.com/public/v2/terms-of-use

### UNKNOWN / NEEDS PROVIDER CLARIFICATION — War Room compatibility

The War Room is a fantasy draft assistant, and FantasyPros itself offers draft-assistant/draft-wizard products. The presence of a “personal app” API tier does not by itself resolve the non-compete wording for this specific use case.

R&D therefore classifies intended War Room API use as:

- **Technically feasible:** YES
- **Free non-production prototype:** supported by available documentation
- **Personal production access exists:** YES, with paid HOF
- **Specific War Room draft-assistant use clearly permitted:** **NOT VERIFIED**
- **Public redistribution of API-derived full ranking data:** requires appropriate rights/commercial treatment; not supported by the personal-production evidence alone
- **Recommended action before production:** obtain direct written provider clarification describing the private/personal War Room use and intended data-storage/display model

### Security implication

The War Room is a static browser app. Shipping an API key in page JavaScript or extension source would expose it and conflict with the API terms' confidentiality requirement.

Therefore **direct browser-side API ingestion should not be the production architecture**.

---

## 7. Recommended ingestion mechanism if later approved

### INFERENCE — local/maintainer-side ingestion is the safest architecture

If provider permission and data completeness are established, the preferred architecture is:

`API -> local/maintainer fetch -> staging snapshot -> validation/reconciliation -> candidate dataset/override -> explicit promote -> War Room`

not:

`browser -> API -> mutate current board live`

### Why

- API key remains in an environment variable/local secret store, never JavaScript, localStorage or the repository.
- the draft app has no runtime dependency on FantasyPros availability.
- existing source/baseline tests remain useful.
- a failed refresh leaves the previous ranking authority untouched.
- candidate diffs can be reviewed before promotion.
- provenance is reproducible.

### Public-repository caution

Do not assume an API-derived full ranking snapshot can be committed to this public repository. If production use is permitted only for personal/non-commercial access but redistribution is not, the safer implementation may need to keep the fetched source/candidate local and use the existing validated local-override mechanism. Provider clarification should explicitly cover this.

---

## 8. Fail-closed importer design

No code was implemented. The following is a production-safety proposal only.

### Stage 1 — explicit cohort manifest

Record:

- provider = FantasyPros
- season
- scoring = PPR
- ranking type = preseason/redraft
- accuracy window (for example `2023-2025`)
- intended cohort size
- each expert ID/name/affiliation
- official accuracy leaderboard URL
- manifest reviewed date

Cohort selection should change annually after finalized prior-season accuracy results, not on every ranking refresh.

### Stage 2 — credential-safe fetch

- key only from environment/local secret mechanism
- never print or persist the key
- bounded request timeout/retry
- no automatic polling loop
- on-demand or at-most-daily preseason refresh is sufficient

### Stage 3 — API response provenance

Record alongside candidate data:

- endpoint/version
- request season/scoring/type/position
- requested expert IDs
- returned expert count/names
- provider `last_updated`
- fetch timestamp
- response/canonical-data hash

### Stage 4 — response validity gates

Fail before changing anything if any required invariant is false:

- expected season
- PPR scoring
- preseason/redraft type
- provider freshness under an approved maximum age
- returned expert identities are a subset of the reviewed cohort
- minimum healthy expert count is met
- player payload exceeds a reviewed completeness threshold
- no duplicate FantasyPros player IDs
- no duplicate canonical player identities
- each ranking row has valid rank/name/position
- supported position coverage is plausible

The exact minimum expert/player thresholds should be determined during implementation/audit from real Premium responses, not guessed by R&D. A design might require a strong majority of the intended top-10 cohort (for example 7/10), but that number is currently an **example requiring validation**, not a verified production constant.

### Stage 5 — player reconciliation

Preferred identity:

1. FantasyPros player ID
2. existing canonical normalized name + position/team fallback where needed

Do not silently create a new canonical player merely because the API returns an unknown row.

For the existing 717-player architecture:

- known canonical players may receive candidate ECR metadata
- source-only/unmatched players should be reported/quarantined
- expanding or replacing the canonical universe requires a separate explicit seasonal-data policy/task

### Stage 6 — preserve depth policy

If the accuracy-selected cohort does not rank every current ECR player:

- retain broader FantasyPros PPR ECR as a controlled fallback for deeper ECR-ranked players
- retain ADP-only depth without fabricating ECR
- preserve ESPN as market-timing authority only

### Stage 7 — candidate dataset validation

Generate a **candidate**, never an in-place partial overwrite.

Run at least:

- player count / position-count checks
- duplicate checks
- rank validity checks
- source/provenance checks
- current dataset/baseline suite
- board construction test
- scoring/recommendation/invariant tests if the ranking order would change

Also emit a review report:

- missing/new source players
- top-100 movement distribution
- largest rank moves
- changed tiers
- stale/unranked important players
- expert count/freshness

### Stage 8 — atomic promotion

A failed fetch or failed validation causes:

- no current ranking changes
- no local override replacement
- no baseline acceptance

A successful candidate should initially require explicit human promotion/review.

### Stage 9 — last-known-good / rollback

Retain:

- bundled committed baseline
- most recent accepted local candidate where licensing permits
- source/provenance metadata

If API access expires, data is partial, or provider behavior changes, the War Room continues on the last-known-good accepted authority.

### Stage 10 — audit log

Record non-secret information:

- refresh requested time
- provider metadata
- cohort
- counts
- validation pass/fail reason
- candidate hash
- promotion/rollback action

---

## 9. API vs scraping vs current CSV

| Path | Technical reliability | Automation | Credential risk | Terms clarity | R&D verdict |
|---|---|---:|---:|---:|---|
| Official FantasyPros API | High if Premium payload is complete | High | Manageable only outside browser | War Room compatibility unresolved | Preferred technical route after clarification |
| Official manually downloaded CSV | High / already proven | Low | None | Existing workflow | Keep as current safe path |
| Public ranking-page HTML scraping | Lower; markup/IDs can change | Medium | None | Public visibility does not prove permission | Do not use as primary production dependency |
| Browser-direct API | Technically possible | High | **Unacceptable key exposure** | Same license uncertainty | Reject architecture |

---

## 10. Seasonality / refresh cadence

### Proposed cadence if eventually approved

**Expert cohort:** once per offseason after finalized prior-season results update the rolling three-year leaderboard.

**Ranking data:** explicit on-demand refresh or at most daily during the active preseason/draft window. There is no draft-value reason to poll continuously.

**Player metadata:** cache independently; player IDs/team/position are more stable than ranking order.

**During a live draft:** ranking refresh should not silently occur. Draft-day state stability is more important than background freshness. A pre-draft/manual refresh is safer.

---

## 11. Material-value determination

### VERIFIED FACT

The current War Room is not using a generic weak ranking source. It already uses FantasyPros PPR ECR from an accuracy-selected Top-20 expert export as primary value authority, with broad-ECR fallback and strong validation.

### STRONG EVIDENCE

A rolling three-year accuracy-selected cohort is more stable as an expert-selection principle than following a single-season #1 expert.

### UNKNOWN

No evidence reviewed in WR-010 proves that switching from the current Top-20 cohort to rolling Top-10 would materially improve:

- player-value accuracy in Full PPR
- War Room recommendation quality
- end-of-draft roster quality
- next-turn decisions

### Conclusion

The evidence supports **researching and automating freshness**, but does not yet support changing ranking authority.

If API use is eventually approved, the first production-safe goal should be **reliable refresh of an explicitly approved cohort**, not experimental accuracy weighting.

---

## 12. Why no prototype was run

No API key was requested from or exposed by the user.

A mock JSON transformer would not resolve the important unknowns:

- Premium/HOF response completeness for an ALL/PPR filtered cohort
- actual current expert-ID availability for all intended top-10 experts
- whether current expert endpoint exposes machine-readable multi-year accuracy
- provider permission for this draft-assistant use
- retrospective performance lift vs current Top-20 baseline

The repository already demonstrates that parsing/reconciliation/validation is technically feasible. Another synthetic parser would add little evidence.

Therefore no experimental code was created.

---

## 13. Required evidence before Manager should consider production

### Gate A — provider compatibility

Obtain written/provider-supported clarification covering:

- personal non-commercial War Room draft-assistant use
- whether local display/storage of filtered consensus is allowed
- whether any generated/derived ranking artifact may be stored in a public repo or must remain private/local
- attribution expectations

### Gate B — live API completeness test

Using a user-owned free/prototype or HOF key **outside chat/repository**:

- call current ranking-expert endpoint
- resolve intended cohort to official IDs
- call PPR ALL consensus filtered to cohort
- record population, expert count, freshness and metadata
- verify the partial-10-player historical free-tier problem is not present under the intended access level

This can be a later R&D-only experiment if Manager approves it.

### Gate C — accuracy lift evaluation

Before changing ranking authority, compare candidate strategies against independent historical preseason outcomes if data can be obtained lawfully:

- current policy approximation: prior-year top-20 accurate experts
- rolling top-5
- rolling top-10
- broad ECR
- single top multi-year expert

Prefer a prospective or held-out design. Avoid using same-season final accuracy to choose the experts for that same season because that leaks future information.

Metrics should include:

- FantasyPros-style draft Accuracy Gap if raw inputs are available
- rank correlation / weighted error in PPR if appropriate data exists
- War Room-specific downstream recommendation deltas only after ranking-quality evidence

### Gate D — implementation/audit plan

If A–C are favorable, Manager may define a production task. Because ranking authority affects scoring/recommendations, independent Auditor validation should be mandatory.

---

## 14. Final recommendation

### Outcome

**R&D ONLY / MORE EVIDENCE NEEDED**

### Recommended expert/source strategy

**Keep the current Top-20 FantasyPros PPR ECR production baseline now.**

For further R&D, use a **rolling three-year Top-10 Draft Accuracy cohort** as the strongest candidate, with equal-vote FantasyPros consensus / Rank Points and current PPR rankings. Do not use a single expert as sole authority and do not add custom accuracy weights without a backtest.

### Recommended ingestion mechanism

If later permitted and proven complete:

- official FantasyPros API
- maintainer/local ingestion outside the browser
- reviewed annual expert manifest
- on-demand/daily preseason PPR refresh
- staging + provenance + completeness/freshness/duplicate gates
- atomic promote only after validation
- last-known-good fallback
- no key in repo/client
- no HTML scraping as normal production source

### Production readiness

**NEEDS MORE RESEARCH**

### Confidence

- Historical multi-year cohort conclusion: **HIGH**
- Technical API feasibility: **HIGH**
- Top-10 superiority over current Top-20 baseline: **LOW / UNPROVEN**
- License compatibility for the War Room: **LOW / REQUIRES PROVIDER CLARIFICATION**
- Fail-closed architecture direction: **HIGH**

---

## 15. What would falsify or change this recommendation

R&D would upgrade toward **READY FOR MANAGER MILESTONE CONSIDERATION** if:

1. FantasyPros confirms the intended War Room personal draft-assistant usage is permitted under the relevant API access tier;
2. a live supported API test proves complete fresh PPR filtered-consensus data for the intended cohort;
3. a retrospective/held-out comparison shows rolling top-10 materially and repeatably outperforms the current Top-20 policy, or the user decides freshness automation alone is sufficient value while retaining the existing cohort policy.

R&D would downgrade toward **DO NOT PURSUE** if:

- provider says this use is incompatible with the API terms;
- the intended access tier cannot return a complete authoritative ranking population;
- filtered cohort availability is too inconsistent to meet safe minimum-expert coverage;
- a meaningful backtest shows no gain or worse results than the current baseline and manual refresh remains operationally sufficient.

---

## Sources reviewed

### Repository

- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/shared/DECISIONS.md`
- `.ai/shared/WORKFLOW.md`
- `.ai/manager/HANDOFF.md`
- `.ai/manager/WR-010.md`
- `.ai/research/HANDOFF.md`
- `scripts/build-fantasypros-2026.mjs`
- `scripts/validate-fantasypros-baseline.mjs`
- `js/war-room-rankings.js`
- `data/FantasyPros_2026_Draft_Top20_Rankings.csv`
- `docs/FANTASYPROS_ESPN_INTEGRATION_DEEP_DIVE.md`

### External authoritative sources, accessed 2026-09-08

- FantasyPros Draft Accuracy Methodology: https://www.fantasypros.com/about/faq/football-draft-accuracy-methodology/
- FantasyPros Accuracy FAQ: https://www.fantasypros.com/accuracy/
- 2023–2025 Multi-Year Draft Accuracy: https://www.fantasypros.com/nfl/accuracy/multi-year-draft.php
- 2025 Draft Accuracy: https://www.fantasypros.com/nfl/accuracy/draft
- 2023 Draft Accuracy analysis / rolling 2021–2023: https://www.fantasypros.com/2024/07/most-accurate-fantasy-football-draft-rankings-2023/amp/
- 2024 Draft Accuracy analysis / rolling 2022–2024: https://www.fantasypros.com/2025/07/2024s-most-accurate-fantasy-football-draft-rankings/
- Current ECR calculation: https://support.fantasypros.com/hc/en-us/articles/115001219327-What-is-ECR-Expert-Consensus-Rankings-and-how-do-you-calculate-it
- Historical consensus accuracy study: https://www.fantasypros.com/2011/01/expert-consensus-rankings-accuracy/
- FantasyPros API product/access page: https://www.fantasypros.com/api-data/
- FantasyPros API reference: https://api.fantasypros.com/v2/docs
- FantasyPros API access support: https://support.fantasypros.com/hc/en-us/articles/49749297704475-How-do-I-request-access-to-the-FantasyPros-API
- FantasyPros API Terms: https://api.fantasypros.com/public/v2/terms-of-use
