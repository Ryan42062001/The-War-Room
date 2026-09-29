# WR-129 — League Settings & Personalization Existing-State Inventory

Status: BUILDER READ-ONLY INVENTORY COMPLETE
Task: WR-129
Role: Implementation Engineer / Builder
Workflow: V3.5
Execution mode: STANDARD_CHAT_HIGH
Refresh mode: FAST_REFRESH
Canonical base verified: `911a74dcf790ac781a21dfe7d0b936ff5e65fccb`
Assigned branch: `wr-129-league-settings-personalization-inventory`

## Scope and method

This is the A5 prerequisite inventory only. No production code, tests, ranking/source data, ESPN runtime, Companion runtime, provider account, deployment or release surface was changed or exercised.

The inventory is grounded in current repository implementation and tests at the verified base. Documentation/UI wording is cited only when paired with implementation or when identifying a contract mismatch.

Classification meanings:
- `PRESENT_AND_EVIDENCED` — implemented and backed by scoped executable/static evidence.
- `PRESENT_WITH_GAP` — material implementation exists, but a demonstrated compatibility/contract gap or a precise coverage gap remains.
- `NOT_FOUND_IN_SCOPED_EVIDENCE` — no current implementation/test support found in the scoped application evidence.
- `NEEDS_MANAGER_DECISION` — the repository evidence alone cannot authorize the product/policy choice.

## Executive result

The application already has substantial league-state personalization: configurable team count/draft slot/round count, snake-turn ownership, config-driven current starter/FLEX need display, session-specific persistence and legacy migration, isolated saved drafts, settings-aware recommendation timing/endgame behavior, responsive settings surfaces, a post-draft report, and recommendation-audit exports.

The current product is explicitly a **redraft Full-PPR / snake** assistant. No Half-PPR, Standard, keeper, risk-preference or reusable planning-default feature was found in scoped product evidence.

The smallest demonstrated Builder-side defect/contract mismatch is round-count validation: the documented/legacy Draft Position contract is **5–30 rounds**, but the command-bar, app/Companion synchronization, persisted-state normalization, and Companion settings currently accept or clamp **1–30**.

## Existing-state capability matrix

| Capability | Classification | Exact implementation evidence | Exact test evidence / evidence gap |
|---|---|---|---|
| Team count, documented 2–20 | `PRESENT_WITH_GAP` | `index.html#pcTeams` declares min 2/max 20. `js/war-room-command-bar-fixes.js:canonicalSettings()` clamps 2–20. `js/war-room-espn-sync.js:applyEspnSyncSettings()` clamps 2–20. `normalizeSavedDraftPayload()` clamps persisted teams 2–20. Companion `war-room-content.js:sanitizeSettings()` and `background.js` also enforce 2–20. | `scripts/test-browser.mjs` proves malformed saved teams=999 normalizes to 20. `scripts/test-draft-invariants.mjs:runFullDraftScenario()` proves complete 10x16 and 14x16 drafts. **Gap:** no scoped full-draft boundary fixture directly exercises 2-team and 20-team configurations. This is a coverage gap, not evidence that those bounds are broken. |
| Round count, documented 5–30 | `PRESENT_WITH_GAP` | `index.html#pcRounds` declares min 5/max 30, and README states 5–30. However `js/war-room-command-bar-fixes.js:canonicalSettings()`, `js/war-room-espn-sync.js:applyEspnSyncSettings()`, `normalizeSavedDraftPayload()`, Companion `war-room-content.js:sanitizeSettings()`, `background.js`, and `popup.html` all use/permit **1–30**. | `scripts/test-browser.mjs` proves malformed saved rounds=99 clamps to 30. `scripts/test-layout-efficiency-behavior.mjs` saves/reloads 18 rounds. `scripts/test-draft-invariants.mjs` exercises 16-round full drafts. **Demonstrated contract gap:** 1–4 are accepted by programmatic/session/Companion paths despite the 5-round documented minimum. No direct 5/30 full-draft boundary test was found. |
| Snake order and user draft-slot handling | `PRESENT_AND_EVIDENCED` | `js/war-room-draft-state.js:getDraftAssistantState()` builds every user pick with odd-round forward slot / even-round reversed slot. `js/war-room-command-bar-fixes.js:canonicalSettings()` clamps slot to 1..teams. `js/war-room-rankings.js:getRecommendationDisplayTurnEvidence()` independently checks supplied turn evidence against snake ownership for truthful display. | `scripts/test-draft-invariants.mjs` has an independent `snakeTeamForPick()` oracle and completes 10x16 slot7 and 14x16 slot11 drafts. `developer-tools.js` explicitly checks pick 10/11 ownership for team10, pick20/21 ownership for team1, and slot1 turn behavior. `scripts/test-browser.mjs` contains valid/invalid/terminal snake-turn display controls. |
| Scoring-format assumption / current PPR-only behavior | `PRESENT_AND_EVIDENCED` | `war-room-config.js` declares `league.scoring: 'PPR'` and `draftType: 'SNAKE'`. `js/war-room-rankings.js` explicitly states PPR ECR value authority, ESPN PPR ADP timing and FantasyPros PPR ADP fallback; its dataset header says `League target: 10-team Full PPR`. `index.html` brands the app as a PPR draft command. | Current tests validate the PPR-ranked application and protected PPR dataset, but there is no alternate-scoring branch to test. Half-PPR/Standard support is separately classified below as not found. |
| Current starter/FLEX/roster-slot configuration and roster-need derivation | `PRESENT_WITH_GAP` | `war-room-config.js:rosterSlots` defines QB1/RB2/WR2/TE1/FLEX1/DST1/K1. Helpers `getConfiguredStarterSlots()`, `getConfiguredStarterTotal()`, `getConfiguredFlexEligibleThreshold()` and `getConfiguredStarterLimits()` feed `js/war-room-draft-state.js:getDraftAssistantRosterState()`. `js/war-room-recommendations.js:calculateDecisionRosterNeeds()` and `calculateRosterConstructionValue()` also consume `ROSTER_SLOTS`. | `scripts/test-hardening.mjs` temporarily changes `ROSTER_SLOTS` to QB1/RB1/WR3/TE1/FLEX2/K0/DST0 and proves starter count, rendered WR/FLEX slots and needs update. **Gap:** `js/war-room-scoring.js:getVorpLeagueSettings()` still hardcodes replacement demand as QB1/RB2/WR2/TE1/FLEX1 per team instead of deriving it from `ROSTER_SLOTS`. Thus internal custom roster display/need mechanics are not equivalent to end-to-end custom-roster recommendation/replacement support. |
| Saved draft sessions | `PRESENT_AND_EVIDENCED` | `index.html#draftSessionSelect` plus New Draft/Delete Draft controls. `js/war-room-espn-sync.js:initializeDraftSessions()`, `switchDraftSession()`, `createNewDraftSession()`, session-specific state/final keys, and guarded save-before-transition behavior. | `scripts/test-hardening.mjs` stress-seeds 25 saved drafts, switches them and creates a 26th. `scripts/test-persistence-recovery.mjs` creates and independently exercises two sessions through hard reload, ESPN-style updates, backup/restore, offline reload and final A/B return. |
| Settings persistence and legacy migration | `PRESENT_WITH_GAP` | `js/war-room-espn-sync.js:saveState()` writes version-2 session payloads containing teams/slot/rounds plus draft state; `loadState()` restores them. `initializeDraftSessions()` migrates a legacy `draft-state-v1` payload into a `legacy` saved session. `normalizeSavedDraftPayload()` sanitizes persisted state. | `scripts/test-browser.mjs` proves corrupt registry quarantine plus legacy-session import, malformed payload normalization, missing-session rejection and write-failure rollback. `scripts/test-layout-efficiency-behavior.mjs` proves 12 teams / slot7 / 18 rounds survive reload. **Gap:** persistence normalizes rounds to 1–30 rather than the documented 5–30 contract. |
| Isolation between saved sessions / cross-session leakage prevention | `PRESENT_AND_EVIDENCED` | `saveState()` writes `getDraftSessionStateKey(activeDraftSessionId)`; the legacy `AUTOSAVE_KEY` is compatibility-only and the source comment states session loading does not read it after migration. Session transitions save current state before switching and fail closed on save failure. | `scripts/test-persistence-recovery.mjs` explicitly switches A→B→A and asserts “session B contaminated session A” / “session A contaminated session B” do not occur, repeats isolation after backup restore/offline/reconnect, and verifies final A/B state. `scripts/test-browser.mjs` also verifies failed transitions are atomic. |
| Recommendation logic consumes league settings | `PRESENT_WITH_GAP` | `js/war-room-recommendations.js` consumes team count for draft phase/bye adjustments and consumes round count in `calculateEndgameRosterRequirement()`; it consumes roster needs/counts in `calculateRosterConstructionValue()`. `js/war-room-scoring.js` uses teams/rounds in scoring context, rank decay and draft-window calculations. | Broad recommendation/scoring suites exist (`test-scoring-corrections.mjs`, `test-draft-invariants.mjs`, browser tests). **Gap:** settings consumption is not a generic league-profile abstraction; scoring format is fixed PPR and replacement demand remains fixed to the default starter shape. |
| Replacement-value/VORP consumes league settings | `PRESENT_WITH_GAP` | `js/war-room-scoring.js:getVorpLeagueSettings()` reads current teams/rounds/draftSlot; `calculateReplacementLevels()`, `calculateFlexPool()`, `getEffectiveReplacement()`, and `calculateVorpProfile()` consume the resulting replacement pool. | Current VORP/recommendation tests cover the default league shape. **Demonstrated compatibility gap:** replacement starter demand is hardcoded per team and does not follow altered `ROSTER_SLOTS`. |
| Phone and desktop/tablet settings surfaces | `PRESENT_AND_EVIDENCED` | Legacy Draft Position lives in `index.html#draft-settings-details`. `js/war-room-command-bar-fixes.js:ensureSetupControls()`, `syncVisibleSetupControls()`, and `applyDraftSettings()` maintain the command-bar settings copy against the same primary controls/globals. | `scripts/test-phone-decision-view-final.mjs` proves phone Draft Setup defaults collapsed and exercises settings at phone size. `scripts/test-layout-efficiency-behavior.mjs` proves Draft Setup is open before progress at 820x900, saves 12/7/18, reloads and preserves the summary. `scripts/test-wr-026-audit-remediation.mjs` verifies desktop/tablet setup behavior above the phone breakpoint. These are synthetic browser viewport tests, not physical-device certification. |
| Post-draft report | `PRESENT_AND_EVIDENCED` | `js/war-room-ui.js:buildFinalDraftSummaryHtml()`, `openFinalDraftSummary()`, `showFinalDraftSummary()`, `maybeShowFinalDraftSummary()` and `renderDraftCompleteRecommendation()` provide completion report, lineup/value feedback and waiver watch. The report explicitly states FantasyPros 2026 PPR ECR value and ESPN PPR ADP timing/fallback. | Browser coverage exercises completion/waiver helper behavior, while draft invariant/persistence suites exercise completion state. **Coverage limitation:** no scoped test was found that independently snapshots every final-report sentence across multiple league profiles. Existing report presence is nevertheless source-evidenced. |
| Recommendation-audit export | `PRESENT_AND_EVIDENCED` | `js/war-room-rankings.js:buildRecommendationAuditExport()` aggregates saved draft evidence; `exportRecommendationAudit(format)` downloads JSON or CSV. `index.html` exposes Export JSON / Export CSV in Mock Audit. | `scripts/test-browser.mjs` verifies both export controls and inspects `buildRecommendationAuditExport()`, including no automatic weight adjustment. |
| League-settings import/export | `NOT_FOUND_IN_SCOPED_EVIDENCE` | No general import/export format for teams/slot/rounds/roster/scoring settings was found. The existing FantasyPros CSV import is ranking-source maintenance, not league-settings import. | No settings import/export test found. This is an absence of a feature, not a defect by itself. |

## Gap and safety matrix

| Area | Classification | Evidence and ownership |
|---|---|---|
| Half-PPR scoring | `NOT_FOUND_IN_SCOPED_EVIDENCE` | No scoring selector, alternate weighting branch or Half-PPR ranking/value authority found. Current ranking/value/timing surfaces are explicitly PPR. **Draft Strategy policy + ranking/source compatibility question** before any Builder implementation. Do not accept Half-PPR input and silently reuse Full-PPR assumptions. |
| Standard/non-PPR scoring | `NOT_FOUND_IN_SCOPED_EVIDENCE` | Same boundary as Half-PPR. Current ECR/ADP authority is PPR-specific. **Draft Strategy policy + ranking/source compatibility question** before implementation. |
| User-configurable custom roster slots | `NOT_FOUND_IN_SCOPED_EVIDENCE` | No UI/session schema for arbitrary starter-slot editing was found. Internal `ROSTER_SLOTS` is configurable and tested, but VORP replacement demand is still hardcoded to the default starter shape. **Draft Strategy policy question** for how custom slots alter replacement/need/endgame policy, then Builder mechanics. |
| Keepers | `NOT_FOUND_IN_SCOPED_EVIDENCE` | No keeper designation, keeper cost/round reservation, protected-player state or keeper-aware snake/recommendation test found. **Draft Strategy policy question** before any product mechanics. |
| Risk preference | `NOT_FOUND_IN_SCOPED_EVIDENCE` | README notes personal risk tolerance can matter, but no saved risk preference or recommendation input/control was found. **Draft Strategy policy question** before implementation; current recommendations must not be described as personalized to risk tolerance. |
| Saved planning defaults reused by future new drafts | `NOT_FOUND_IN_SCOPED_EVIDENCE` | Per-session teams/slot/rounds and state persist, but no separate reusable “new draft defaults/profile” object was found. This is distinct from saved draft sessions. Manager decides whether such a product feature is wanted. |
| Unsupported-input behavior | `PRESENT_WITH_GAP` | Session IDs/registry/payload shapes are sanitized; corrupt storage is quarantined; missing sessions fail closed; save failures block transitions. Numeric settings are generally **clamped**, not rejected. The exact documented round floor is inconsistent: UI 5 vs app/session/Companion 1. There is no alternate scoring input to reject today. |
| Cross-session leakage safeguards | `PRESENT_AND_EVIDENCED` | Session-specific keys plus explicit A/B isolation/recovery tests provide direct evidence against known draft-state/settings leakage between saved sessions. No claim is made about browser-profile/account synchronization outside local storage. |

## Separation of findings

### Builder mechanics

1. **Round lower-bound contract mismatch — demonstrated.** The visible/documented contract is 5–30, while app command-bar normalization, app ESPN-sync normalization, persisted-state normalization and Companion storage/content/popup surfaces accept 1–30.
2. **Custom roster propagation is partial.** Current roster rendering/needs can be config-driven, but VORP replacement demand is hardcoded to the default QB/RB/WR/TE/FLEX starter counts.
3. **Current session mechanics are mature.** Session-specific saves, legacy migration, corruption quarantine, rollback on storage failure and A/B isolation are implemented and tested.
4. **Boundary-test gaps are precise rather than assumed defects.** Full-draft invariant fixtures are 10x16 and 14x16; they do not directly prove 2-team, 20-team, 5-round or 30-round end-to-end boundaries.

### Draft Strategy policy questions

- Whether to add Half-PPR or Standard and how recommendation/value policy changes.
- Whether custom roster slots should change replacement levels, roster needs, phase/endgame policy and positional caps.
- Keeper semantics and keeper-cost/round effects.
- Whether a user risk preference should affect recommendation action/weights or only explanation.
- Whether reusable planning defaults are desirable beyond isolated saved draft sessions.

None of those policy questions is authorized for Builder invention in WR-129.

### Ranking/source compatibility constraints

- WR-D001 remains controlling: current player value is FantasyPros **PPR ECR** and ESPN is market timing. Existing fallback is also PPR-oriented.
- Half-PPR/Standard cannot be represented as “supported” merely by adding a selector while retaining Full-PPR source/value assumptions.
- The final draft report also labels its value/timing basis as PPR.
- A4 / 2027 source refresh is season-gated and **was not executed or evaluated** here.
- Paused Track B source-rights/custom-ranking gates remain untouched.

### Release/readiness concerns

- The round-floor inconsistency means current “5–30” compatibility is not a single enforced contract across all settings ingress paths.
- Synthetic browser coverage is strong for persistence/settings surfaces but does not equal physical-phone certification.
- No real ESPN/Companion E2E execution occurred; WR-D018 `LIVE_DIRECT_UNVERIFIED` remains unchanged.
- Full-draft invariant tests do not directly cover documented team/round boundary combinations.
- Missing tests above are recorded as coverage gaps, not automatically elevated to product defects.

## Coverage map

| Concern | Existing evidence | Exact gap |
|---|---|---|
| Numeric settings normalization | `test-browser.mjs` malformed saved 999/-3/99 → 20/1/30; command/app/Companion normalizers | No test enforcing/rejecting documented rounds 1–4 because current code accepts them. |
| Snake correctness | `test-draft-invariants.mjs` independent snake oracle/full drafts; `developer-tools.js` explicit reversal/turn cases | No full-draft 2-team or 20-team boundary scenario. |
| Settings persistence | `test-layout-efficiency-behavior.mjs` 12/7/18 save+reload; `test-browser.mjs` legacy migration/sanitization | Persisted round minimum is 1, conflicting with documented 5. |
| Session isolation | `test-persistence-recovery.mjs` A/B contamination checks before/after backup/offline/reconnect | No cross-browser-profile/cloud-sync claim; app is local-storage scoped. |
| Recommendation invariants | `test-scoring-corrections.mjs`, `test-draft-invariants.mjs`, browser suites | No alternate-scoring or arbitrary-roster-profile invariant suite because those product capabilities are not implemented. |
| Config-driven roster display/needs | `test-hardening.mjs` mutated roster-slot fixture | Replacement/VORP demand does not derive from the same config. |
| Phone/desktop settings | `test-phone-decision-view-final.mjs`, `test-layout-efficiency-behavior.mjs`, `test-wr-026-audit-remediation.mjs` | Synthetic viewport only; no physical-device certification. |
| Unsupported/corrupt state | `test-browser.mjs`, `test-persistence-recovery.mjs`, `test-recovery-failures.mjs` | Numeric clamping is not a visible unsupported-input rejection contract; scoring-format rejection is inapplicable because no scoring-format input exists. |
| Post-draft behavior | `war-room-ui.js` final report/waiver implementation plus completion/browser coverage | No exhaustive multi-profile final-report content oracle found. |
| Audit export | `test-browser.mjs` Mock Audit JSON/CSV controls and export object | This is recommendation evidence export, not league-settings export. |

## Exactly one smallest next Manager decision

**Recommend: one bounded Builder implementation/testing task** to make the existing documented round-count contract truthful and uniform: enforce **5–30 rounds** across every existing settings ingress/persistence/Companion path, with focused lower/upper-bound and malformed-input regression tests.

Proposed bounded production/test surface for Manager scoping:
- `js/war-room-command-bar-fixes.js` — `canonicalSettings()` round floor.
- `js/war-room-espn-sync.js` — `applyEspnSyncSettings()` and `normalizeSavedDraftPayload()` round floor.
- `extensions/espn-companion/popup.html` — rounds input minimum.
- `extensions/espn-companion/war-room-content.js` — `sanitizeSettings()`.
- `extensions/espn-companion/background.js` — persisted/config round clamping.
- existing focused app/Companion test files only as needed to prove rounds 1–4 cannot silently become active, 5 and 30 are accepted, and existing team/slot/session isolation is unchanged.

This recommendation does **not** add a scoring format, custom roster UI, keeper, risk preference, planning profile, ranking/source change or recommendation policy. Because it changes production settings ingestion/persistence and Companion compatibility behavior, a later Manager-scoped implementation should receive the normal independent audit gate before integration. WR-129 does not activate that task.

## Preserved decisions / non-actions

- WR-D001 — FantasyPros PPR ECR remains player-value authority; ESPN remains market timing.
- WR-D018 — fallback-first / `LIVE_DIRECT_UNVERIFIED` preserved.
- WR-D027 — NO PROVIDER CONTACT preserved.
- WR-D038 — accepted recommendation-card repair preserved.
- WR-D043 — accepted A3 closure preserved.
- Paused Track B source-rights/custom-ranking gates remain paused.
- A4 / 2027 ranking refresh was not fetched, imported, evaluated, replaced or discussed with any provider/source.
- No implementation, test, source, dataset, deployment or release change was made by this inventory.
