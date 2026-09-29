# WR-007 — Roadmap Discovery: Next Milestone Candidate Evaluation

ROLE: Research & Development (R&D)

STATUS: COMPLETE — RECOMMEND MAINTENANCE / STABLE

PRODUCTION IMPLEMENTATION: NOT AUTHORIZED / NOT PERFORMED

## Research question

What should happen next for the War Room after completion of the ESPN Live Sync reliability / live-validation closeout, based on current product state, repository evidence, draft-day user value, reliability leverage, technical feasibility, validation burden, and project maturity?

Valid outcomes under WR-007 / WR-008 are either:

1. a sufficiently valuable bounded successor production milestone for Manager consideration; or
2. MAINTENANCE / STABLE if no candidate clears the active-development threshold.

## Verified checkpoints

- WR-007 Manager starting SHA: `3e5cffb86c3ab6c55803d4f0f6a8a07218b81e0f`
- Latest `main` observed before writing this report: `076c05fd09c056c3491a5e9f2c185350f7acf68f`
- Compare `3e5cffb8...` → `076c05fd...`: 12 commits, all changes confined to `.ai/` Manager/workflow/research artifacts; no production files changed during the discovery interval.
- Latest production milestone remains ESPN Live Sync reliability / live-validation closeout: COMPLETE.
- Latest production merge identified by canonical state: WR-003 / PR #108, merge SHA `c5648122710d0720a59d8a8a79944b7ddf5b1d5a`.

## Evidence reviewed

### Canonical repository evidence

- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/shared/DECISIONS.md`
- `.ai/shared/WORKFLOW.md`
- `.ai/manager/HANDOFF.md`
- `.ai/manager/WR-007.md`
- `.ai/research/HANDOFF.md`

### Product / architecture evidence

- `README.md`
- `AGENTS.md` for technical/history context only; canonical `.ai/shared/*` wins on project state/workflow
- `index.html`
- `war-room-config.js`
- `js/war-room-draft-state.js`
- `js/war-room-scoring.js`
- `js/war-room-recommendations.js` search evidence
- `js/war-room-external-picks.js` search evidence
- `js/war-room-espn-sync.js` search evidence
- `package.json`

### Current external evidence

Official/current ESPN documentation:

1. ESPN Fan Support — Scoring Formats, updated 2026-08-18
   - https://support.espn.com/hc/en-us/articles/360003914032-Scoring-Formats
   - Confirms ESPN public football leagues include PPR and Standard formats and League Manager leagues support customized scoring categories.
2. ESPN Fan Support — Roster Settings, updated 2026-08-18
   - https://support.espn.com/hc/en-us/articles/115003902651-Roster-Settings
   - Confirms League Manager leagues can customize roster positions, starter counts, and roster maxima.
3. ESPN Fan Support — Roster Slots (Offense), current 2026 support page
   - https://support.espn.com/hc/en-us/articles/115003939432-Roster-Slots-Offense
   - Confirms FLEX and Offensive Player Utility / superflex-style roster structures are supported.

Current FantasyPros product/data evidence:

4. FantasyPros 2026 rankings pages expose distinct Standard / PPR / Half-PPR ranking modes and current Superflex ranking pages.
   - PPR: https://www.fantasypros.com/nfl/fantasy-football-rankings/ppr-overall.php
   - Half PPR: https://www.fantasypros.com/nfl/fantasy-football-rankings/half-point-ppr-overall.php
   - PPR Superflex: https://www.fantasypros.com/nfl/fantasy-football-rankings/ppr-superflex.php
5. FantasyPros Draft Assistant / Draft Software pages currently advertise pick prediction, opponent needs, custom league settings, player news, keepers, salary-cap support, and multi-host live sync.
   - https://draftwizard.fantasypros.com/football/draft-assistant/
   - https://draftwizard.fantasypros.com/football/draft-software/
6. FantasyPros settings-verification guidance states incorrect league settings can degrade advice and exposes draft type, roster positions, scoring system, and league type as settings that need verification.
   - https://support.fantasypros.com/hc/en-us/articles/6519483092507-I-synced-my-league-in-Draft-Wizard-How-can-I-make-sure-my-league-settings-are-correct

External competitor capabilities are treated only as feasibility / market-context evidence. Their existence does **not** prove this War Room user needs them.

## Verified current product baseline

VERIFIED FACT:

- The War Room is a 2026 redraft PPR draft assistant whose ranking/value authority is FantasyPros PPR ECR and whose ESPN rank/ADP signals affect market timing rather than player value.
- The canonical dataset is 717 players with zero canonical duplicates in the established validation baseline.
- Teams, draft slot, and rounds are user-configurable in the draft settings UI, but `war-room-config.js` still defines one PPR/snake roster model: 1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX, 1 K, 1 DST, with a fixed bench profile.
- Current VORP replacement demand in `js/war-room-scoring.js` is derived from that fixed QB/RB/WR/TE/FLEX structure.
- Next-turn availability logic already uses ESPN board rank, ESPN ADP, picks until the next turn, comparable positional depth, recent positional runs, and the share of intervening teams explicitly marked as ESPN autodrafters.
- ESPN reconciliation records per-pick `teamSlot` / `teamId` metadata, so the repository already has a technical basis for reconstructing opponent roster composition if a future model needs it.
- `js/war-room-rankings.js` already records recommendation-audit outcomes such as `SURVIVED` vs `DRAFTED_BEFORE_NEXT` and phase-level calibration data.
- Ranking refresh is deliberately controlled: the bundled FantasyPros dataset is hash-protected, and current maintenance paths include importing current FantasyPros source data plus refreshing ESPN market data from the Companion.
- The repository has a broad production test chain covering release/module integrity, syntax, dataset integrity, Companion, ESPN Sync trust UX, intrinsic popup sizing, browser behavior, responsive overflow, off-board picks, hardening, command bar, draft awareness, scoring corrections, draft invariants, persistence/recovery, recovery failure injection, and live mock fixtures.
- Canonical state reports no blocking findings after ESPN Live Sync closeout.

## Gap / opportunity inventory

### User-facing draft-day capability gaps

1. **League-format scope is narrow.** The War Room is intentionally PPR/redraft/snake with one starter structure. Standard, Half-PPR, Superflex/OP, keeper, salary-cap, and arbitrary custom rosters are outside the current production model.
2. **Opponent-specific draft intent is not part of the current survival estimate.** Team-slot metadata exists, but current market timing is primarily market-rank / ADP / interval / positional-depth / run based.
3. **Draft configuration is manually controlled.** The War Room / Companion synchronize the app's teams, rounds, and draft slot, but no verified current mechanism was found that imports or independently validates the full ESPN league scoring/roster profile.

### Reliability / correctness gaps

VERIFIED FACT: No current blocking reliability/correctness gap was found in canonical state.

Non-blocking canonical observations remain:

- technical diagnostics can over-emphasize `Capture method: network` / candidate-shaped fetch counts when Pick History DOM is actually the ledger-eligible source;
- the exact actor behind synthetic ESPN navigation remains unknown at the established attribution ceiling;
- legacy `AGENTS.md` contains stale process wording.

None currently creates a verified draft-day failure.

### Data / recommendation opportunities

- Current recommendation and survival logic contains deterministic heuristics that could in principle be calibrated against completed mock/live draft outcome data.
- No repository evidence reviewed in WR-007 demonstrates a current systematic calibration failure large enough to justify changing scoring/recommendation behavior.
- Current README explicitly warns that injuries, depth-chart changes, league scoring, and personal risk tolerance matter but are not automatically modeled.

### ESPN / integration opportunities

- The current ESPN-specific Companion is now heavily hardened.
- Broader platform sync or deeper settings import is technically plausible, but would re-open a large integration surface with substantial live-validation burden.
- No current requirement or user feedback in canonical state asks for another platform.

### Workflow / maintenance opportunities

- Cleanup of legacy process wording and diagnostics phrasing is legitimate maintenance, but does not justify a production milestone.
- Seasonal ranking/data refresh is a normal maintenance trigger rather than evidence for continuous feature development.

---

# Candidate evaluation method

Each candidate is scored 1–5 on eight **positive-direction** criteria (5 = strongest / safest / easiest):

1. Draft-day user value
2. Reliability/correctness leverage
3. Demonstrated need / evidence strength
4. Technical feasibility
5. Architectural fit
6. Boundedness of deliverable
7. Delivery safety / integration risk
8. Validation tractability

Maximum comparative score: 40.

This score is a comparison aid, not a measured product metric.

### Active-development threshold

Under the WR-008 maturity rule, a candidate should not become an active production milestone merely because it is possible. For this discovery, a candidate must have:

- at least **moderate demonstrated need** (`>=3/5`) from a verified defect, real-world user feedback, a new product requirement, changed dependency, or directly demonstrated high-value opportunity; and
- a sufficiently bounded implementation/validation path to justify disturbing a mature green baseline.

A high hypothetical upside cannot substitute for demonstrated need.

## Ranked candidate matrix

| Rank | Proposal | User value | Reliability | Need evidence | Feasibility | Arch fit | Bounded | Safety | Validation | Total / 40 | Readiness |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | WR-007-P1 — ESPN Configuration Preflight / Settings Validation | 3 | 4 | 2 | 3 | 4 | 4 | 3 | 3 | 26 | NEEDS MORE RESEARCH |
| 2 | WR-007-P2 — Opponent-Aware Next-Turn Intelligence | 4 | 3 | 2 | 4 | 4 | 3 | 2 | 2 | 24 | NEEDS MORE RESEARCH |
| 3 | WR-007-P3 — League-Aware Draft Profiles | 4 | 3 | 2 | 4 | 2 | 2 | 2 | 2 | 21 | NOT READY |
| 4 | WR-007-P4 — Recommendation Calibration Program | 4 | 4 | 2 | 3 | 5 | 3 | 2 | 2 | 25 | NEEDS MORE RESEARCH |

No candidate reaches the demonstrated-need gate. Therefore none currently justifies an active production milestone.

---

# WR-007-P1 — ESPN Configuration Preflight / Settings Validation

PROPOSAL ID: WR-007-P1 (proposal only; not a new WR task)

## Opportunity

Reduce the chance that the War Room is using the wrong league/draft configuration when ESPN Live Sync begins.

## Current limitation

The production UI exposes teams, draft slot, and rounds. Those settings are synchronized between the War Room and Companion, but WR-007 found no verified production mechanism that independently imports/validates the complete ESPN league roster/scoring profile.

## Proposed capability

A bounded pre-draft health check that compares locally configured draft settings against trustworthy ESPN-observed evidence when available and clearly warns about mismatches before recommendation logic relies on them.

Automatic mutation of settings should **not** be assumed; a first milestone could be validation-only.

## Why it matters

Draft slot / team count / round mismatches can affect snake-pick ownership, completion counts, roster attribution, and next-turn timing. FantasyPros explicitly warns that incorrect synced league settings can reduce advice quality.

## User value

Potentially high when a configuration mismatch exists; otherwise invisible.

## Evidence

VERIFIED FACT:
- War Room currently depends on teams / draft slot / rounds.
- ESPN supports customized league scoring/roster settings in LM leagues.
- Incorrect league settings are acknowledged by another mature draft assistant as advice-quality risk.

UNKNOWN:
- Whether a stable, privacy-safe, live-proven ESPN source can provide all desired settings without relying on fragile undocumented behavior.
- Whether the War Room user has experienced an actual configuration mismatch.

## Technical approach

Potential future stages:
1. identify independent ESPN signals for team count / draft structure / roster/scoring profile;
2. classify each field by authority and confidence;
3. compare against War Room configuration;
4. warn on mismatch without silently changing state;
5. only after live proof consider opt-in import.

## Alternatives

- Keep manual configuration and improve the pre-draft checklist only.
- Import all ESPN settings automatically (higher risk, not currently justified).
- Do nothing until a mismatch is observed.

## Prototype / experiment results

No experiment run. The key uncertainty is live ESPN settings provenance; a synthetic fixture would not establish a reliable source.

## Risks

- reintroducing dependence on undocumented ESPN internals;
- false mismatch warnings;
- settings auto-import corrupting a valid manual setup;
- expanded Level-4 validation burden.

## Estimated relative effort

MEDIUM if validation-only; LARGE if full scoring/roster import is included.

## Confidence

MEDIUM that the problem is technically addressable; LOW that it deserves immediate development without an observed mismatch or stable source proof.

## Recommended next step

Do not implement now. Revisit if a real configuration mismatch occurs or R&D live observation identifies a stable independent settings source.

## Production readiness

NEEDS MORE RESEARCH

---

# WR-007-P2 — Opponent-Aware Next-Turn Intelligence

PROPOSAL ID: WR-007-P2 (proposal only; not a new WR task)

## Opportunity

Improve “draft now vs wait” decisions by considering which teams actually pick before the user's next turn and what those teams have already drafted.

## Current limitation

Current survival logic already uses ESPN board/ADP, picks until next turn, comparable positional depth, recent runs, and auto-draft share, but WR-007 found no evidence that actual opponent roster needs directly affect player-specific survival risk.

## Proposed capability

Build a per-team positional-demand snapshot from authoritative numbered picks / `teamSlot` metadata, then test whether adding opponent-demand features improves the calibration of next-turn survival predictions.

## Why it matters

The highest-value decision in many snake-draft turns is not simply “who is best?” but “who can safely wait until my next pick?” Opponent-specific demand could make that estimate more room-aware.

## User value

Potentially high if it produces meaningful calibration lift and changes real wait/draft decisions correctly.

## Evidence

VERIFIED FACT:
- existing picks contain `teamSlot` / `teamId` metadata;
- current scoring already computes which teams pick before the next user selection;
- existing recommendation audit records whether a candidate survived to the next turn;
- current survival model is heuristic rather than a learned opponent-demand model.

STRONG EXTERNAL EVIDENCE:
- FantasyPros currently markets opponent-needs alerts, Draft Intel, advanced opponent logic, and pick prediction, demonstrating that this is a recognized draft-assistant problem class.

NOT VERIFIED:
- that adding opponent needs improves the War Room's actual prediction accuracy;
- that enough real/mock outcome data exists to calibrate safely.

## Technical approach

Before any production change, run an R&D-only calibration study:
1. build a corpus of completed mock/live drafts with authoritative team-slot picks;
2. score the current baseline survival prediction;
3. derive simple opponent-position-demand features without changing production scoring;
4. compare held-out calibration / error against baseline;
5. only propose implementation if improvement is repeatable and decision-relevant.

## Alternatives

- retain current ESPN board + ADP model;
- use only recent positional runs (already present);
- add a visually descriptive opponent-needs panel without changing scoring (lower risk, but value still unproven).

## Prototype / experiment results

No experiment run because WR-007 did not find a suitable verified real/mock outcome corpus. Generating synthetic opponents from the same heuristics would create circular evidence.

## Risks

- overfitting small mock samples;
- false precision in survival percentages;
- recommendation regressions from noisy opponent models;
- high audit burden because scoring/recommendation behavior is high-risk.

## Estimated relative effort

MEDIUM for R&D/calibration; MEDIUM-to-LARGE for production if proven.

## Confidence

MEDIUM that it is technically feasible; LOW-to-MEDIUM that it creates enough real-world lift to justify implementation now.

## Recommended next step

Defer. Reactivate with a dedicated R&D experiment if real draft feedback reports wrong wait/draft decisions or a sufficiently rich mock corpus becomes available.

## Production readiness

NEEDS MORE RESEARCH

---

# WR-007-P3 — League-Aware Draft Profiles

PROPOSAL ID: WR-007-P3 (proposal only; not a new WR task)

## Opportunity

Allow the War Room's ranking/replacement/roster model to match leagues beyond its current PPR redraft starter structure.

## Current limitation

Production assumptions remain PPR + snake with a fixed roster composition. `war-room-config.js` and VORP replacement demand encode that model.

## Proposed capability

A constrained profile architecture, potentially beginning with explicitly supported modes such as:

- PPR default
- Half-PPR
- Standard
- Superflex/OP

with profile-specific authoritative ranking datasets and roster-slot semantics.

Arbitrary custom scoring should not be bundled into the first milestone.

## Why it matters

Official ESPN documentation confirms multiple scoring and roster configurations are legitimate; FantasyPros currently publishes distinct PPR / Half-PPR / Standard / Superflex ranking sets.

## User value

High only if the user actually drafts in those formats. It provides little value to the current proven PPR workflow otherwise.

## Evidence

VERIFIED FACT:
- the current War Room is deliberately PPR-specific;
- ESPN LM leagues support custom roster/scoring structures;
- current FantasyPros data provides separate format-specific ranking contexts.

UNKNOWN:
- whether the War Room user needs another format;
- whether FantasyPros export/licensing/source workflow for each desired mode is equivalent to the current PPR pipeline;
- how ESPN market-rank semantics should be handled across all formats.

## Technical approach

If a real requirement appears:
1. define a bounded set of supported league profiles;
2. separate league profile from current global constants;
3. introduce profile-specific authoritative ranking datasets;
4. make replacement levels / roster need / caps consume profile configuration;
5. migrate persistence with explicit profile identity;
6. validate every scoring/recommendation scenario independently per profile.

## Alternatives

- keep PPR-only and create separate static builds for other formats;
- support roster-slot customization without changing ranking authority;
- attempt arbitrary custom scoring immediately (rejected as too broad).

## Prototype / experiment results

No experiment run. Feasibility is already clear enough from repository architecture and current source availability; the missing input is product demand, not implementation possibility.

## Risks

- largest scoring/recommendation blast radius among candidates;
- ranking authority becomes profile-specific;
- persistence/session compatibility becomes more complex;
- superflex changes replacement-level economics substantially;
- high Level-2/3 validation and likely Level-4 draft validation per profile.

## Estimated relative effort

LARGE

## Confidence

HIGH that the capability can be built; LOW that it should be built now without a product requirement.

## Recommended next step

Do not implement. Reactivate immediately if the user adds a concrete Standard / Half-PPR / Superflex league requirement.

## Production readiness

NOT READY — REQUIREMENT MISSING

---

# WR-007-P4 — Recommendation Calibration Program

PROPOSAL ID: WR-007-P4 (proposal only; not a new WR task)

## Opportunity

Use completed draft outcome data to measure where the current recommendation/survival heuristics are systematically well- or poorly-calibrated before changing weights.

## Current limitation

The engine is deterministic and heavily regression-tested, but its rank-gap / scarcity / availability rules are designed heuristics. The repository includes audit outcomes and phase-level calibration structures, but WR-007 found no canonical result showing a current systematic recommendation defect.

## Proposed capability

A non-production-first calibration program that collects completed draft decisions and compares predicted survival / recommendation rationale against observed outcomes by phase, position, draft slot, and auto-draft exposure.

Only evidence-backed corrections would be promoted to production tasks.

## Why it matters

Recommendation quality is the product's central value. Measurement could find meaningful error without blindly retuning weights.

## User value

Potentially very high if a real bias is found; zero if existing decisions are already sufficiently calibrated.

## Evidence

VERIFIED FACT:
- the repository already emits recommendation-audit outcomes including `SURVIVED` / `DRAFTED_BEFORE_NEXT` and calibration-by-phase structures;
- production recommendations are not self-tuning by design;
- canonical roadmap reports the current scoring/recommendation correctness baseline complete.

UNKNOWN:
- whether enough independent draft outcomes exist to support statistically useful analysis;
- whether current heuristics show a material systematic error.

## Technical approach

Future R&D only:
1. collect/normalize completed mock/live decision records;
2. define calibration/error metrics before inspecting results;
3. split training/exploration from held-out evaluation;
4. identify repeatable error patterns;
5. recommend only bounded corrections with RED-before/GREEN-after evidence.

## Alternatives

- leave deterministic weights frozen until a real defect appears;
- retune from anecdotal draft outcomes (rejected);
- implement self-learning production weights (rejected as unsafe and contrary to current design intent).

## Prototype / experiment results

No experiment run. No sufficiently rich independent outcome dataset was verified in WR-007.

## Risks

- overfitting small sample sizes;
- confusing market randomness with model error;
- destabilizing a currently correct deterministic engine;
- substantial independent audit burden for any promoted scoring change.

## Estimated relative effort

MEDIUM R&D; variable production effort only if a defect is proven.

## Confidence

HIGH that this is the correct way to investigate future recommendation concerns; LOW that current evidence justifies doing it now.

## Recommended next step

Keep as a trigger-driven R&D tool, not a production milestone. Start only if real/mock draft evidence suggests systematic decision error.

## Production readiness

NEEDS MORE RESEARCH / NO CURRENT TRIGGER

---

# Rejected / deferred ideas

## Cross-platform live sync (Yahoo / Sleeper / others)

Deferred. Current product purpose and the recently completed reliability investment are ESPN-specific. Competitors prove multi-host sync is possible, but there is no current requirement and each host would create a new live integration / Level-4 validation surface.

## Keeper / salary-cap / dynasty support

Deferred. These are legitimate fantasy formats, but they would change core value semantics, draft order, roster economics, and recommendation behavior. No current requirement justifies this expansion.

## Live injury/news ingestion

Deferred. Current README correctly treats injuries/depth-chart changes as important external context, but a production news layer would introduce a new freshness/authentication/source-reliability problem. It should be reconsidered only when a trustworthy source and explicit product need exist.

## Diagnostics wording cleanup

Legitimate maintenance, not a milestone. It should be bundled with a future relevant Companion maintenance task or triggered by support/user confusion.

## Synthetic-navigation actor attribution beyond current ceiling

Do not pursue merely for curiosity. WR-002 established a safe attribution ceiling and no blocking sync defect remains. Reopen only if actor identity becomes necessary to solve a real defect.

## Legacy `AGENTS.md` process cleanup

Documentation maintenance only. Canonical precedence is already explicit.

---

# R&D outcome

## Recommendation: MAINTENANCE / STABLE

CONFIDENCE: HIGH

### Why

1. **No verified blocking defect remains.** Canonical state marks ESPN Live Sync closeout complete and reports no blocking findings.
2. **The current system is deeply regression-protected.** The root test chain covers the major ranking, recommendation, ESPN, persistence, recovery, responsive, and release surfaces.
3. **The strongest future ideas are conditional, not currently demanded.** Every serious candidate is missing the same hard-gate evidence: an observed current user problem, a new product requirement, or a demonstrated accuracy/reliability deficiency.
4. **The most tempting intelligence improvements touch high-risk scoring/recommendation behavior.** The upside is plausible, but the project should not exchange a mature deterministic baseline for speculative model complexity.
5. **The clearest capability expansion—additional league formats—is a product-scope decision.** It is valuable only when there is an actual need for those formats.
6. **The maturity rule explicitly prefers stable operation over feature creation for its own sake.** Current evidence fits that condition.

### What would change this conclusion?

Any of the following would invalidate or materially weaken the maintenance recommendation:

- a reproducible production defect in draft state, ESPN sync, persistence, responsive UI, rankings, or recommendation behavior;
- real-world user feedback identifying repeated friction or wrong decisions that current tests do not capture;
- a concrete new league requirement such as Half-PPR, Standard, Superflex, keeper, salary cap, or another platform;
- a changed ESPN/FantasyPros/Chrome dependency that breaks or threatens current behavior;
- a stable newly observed ESPN settings source that makes configuration validation materially safer and a real mismatch risk is demonstrated;
- a real/mock draft corpus showing repeatable, decision-relevant survival/recommendation miscalibration;
- a seasonal ranking/ADP update requiring source refresh;
- a previously non-blocking risk becoming a real user-visible reliability problem.

---

# Maintenance / Stable reactivation map

| Canonical trigger | Recommended response |
|---|---|
| Verified defect | Manager creates bounded defect/remediation task; Builder fixes; Auditor verifies at risk-appropriate level. |
| Real-world user feedback | Manager classifies severity/value; use R&D first when root cause or best solution is uncertain. |
| Changed external dependency | R&D investigates current ESPN/FantasyPros/Chrome behavior; Builder only after evidence and scope are settled. |
| New product requirement | R&D evaluates architecture/data implications if non-trivial; Manager selects scope; Builder implements; Auditor validates. |
| Materially valuable opportunity | Require evidence that it beats the stable baseline; use proposal-specific trigger criteria above. |
| Seasonal/data update | Refresh authoritative FantasyPros/ESPN source data through the existing controlled pipeline and rerun dataset/browser/recommendation validation. |
| Previously unresolved risk becomes actionable | Reopen only the relevant bounded investigation; do not restart unrelated roadmap work. |

---

# Closest future candidates and trigger to revisit

1. **ESPN Configuration Preflight / Settings Validation**
   - Revisit when: a real settings mismatch occurs, or a stable independent ESPN settings source is live-proven.
2. **Opponent-Aware Next-Turn Intelligence**
   - Revisit when: users report wrong wait/draft decisions, or a real/mock corpus supports a held-out calibration study.
3. **League-Aware Draft Profiles**
   - Revisit when: the user actually needs Standard, Half-PPR, Superflex, keeper, salary-cap, or another roster/scoring format.
4. **Recommendation Calibration Program**
   - Revisit when: enough independent completed draft outcomes exist or a repeatable recommendation error is observed.

---

# Recommended Manager decision

Based on the evidence, R&D recommends that the Manager place the War Room into **MAINTENANCE / STABLE** mode after independently reviewing this report.

No production milestone should be created solely from these candidate ideas now.

If Manager accepts maintenance/stable:

- Builder: IDLE until a trigger becomes an approved task.
- R&D: IDLE until a trigger requires investigation/discovery.
- Auditor: IDLE until a production change or milestone-validation task exists.
- No Parallel Work Wave is justified.

## Production readiness

MAINTENANCE / STABLE RECOMMENDATION: READY FOR MANAGER REVIEW

Candidate production work: NOT READY / NEEDS TRIGGER-SPECIFIC RESEARCH OR REQUIREMENT

## Experiments performed

None.

Reason: WR-007's decisive uncertainty is not technical feasibility. It is whether any capability produces enough current user/reliability value to justify development. A disposable synthetic prototype cannot establish that missing product evidence and would risk manufacturing justification for work.

## Files changed by R&D

Role-owned research artifacts only:

- `.ai/research/ROADMAP_DISCOVERY.md`
- `.ai/research/HANDOFF.md`

Production files changed: NO
Canonical `.ai/shared/*` files changed: NO
