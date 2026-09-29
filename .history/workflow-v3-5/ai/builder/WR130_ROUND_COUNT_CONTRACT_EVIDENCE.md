# WR-130 — Round-Count 5–30 Contract Evidence

Status: BUILDER IMPLEMENTATION CANDIDATE — EXACT-HEAD FULL CI REQUIRED BEFORE FREEZE
Task: WR-130 — Round-Count 5–30 Contract Unification
Role: Implementation Engineer / Builder
Workflow: V3.5
Execution mode: STANDARD_CHAT_HIGH
Refresh mode: FAST_REFRESH
Verified canonical base: `333601ee04457b3fb90895f0d6d99e8c2d31d6f0`
Assigned branch: `wr-130-round-count-contract-unification`
Manager decision consumed: WR-D045
Audit required: YES

## Objective

Unify every currently authorized app/persistence/external-pick/ESPN Companion round-count setting path on the already established **5–30 inclusive** product contract. This task does not add a new league format or personalization feature.

Required semantics preserved:
- rounds 5 is valid;
- rounds 30 is valid;
- rounds 1–4 cannot remain active;
- rounds >30 cannot remain active;
- existing fallback/default 16 remains unchanged wherever it already applies;
- existing team range 2–20 and draft slot 1..teams remain unchanged;
- existing integer/fallback behavior is unchanged except the lower valid rounds bound moves from 1 to 5.

## Production / Companion implementation

### `js/war-room-command-bar-fixes.js`
- `canonicalSettings()`: rounds clamp changed from 1–30 to **5–30**.
- dynamically rendered command-bar rounds input: `min="5"`, `max="30"`.
- no team/slot/event/publication logic changed.

### `js/war-room-espn-sync.js`
- `applyEspnSyncSettings()`: rounds normalization lower bound changed to **5**.
- `normalizeSavedDraftPayload()`: persisted/legacy rounds normalization lower bound changed to **5**.
- default/fallback remains the existing current/default value including 16.
- no session migration, registry, pick, market, recommendation or ranking behavior changed.

### `js/war-room-external-picks.js`
- `readEspnExternalDraftState()`: restored rounds clamp is **5–30**.
- missing/disabled/corrupt-state fallback round value is itself clamped to **5–30**, still defaulting to 16 when no finite configured value exists.
- `snapshotSettingsForExternalPicks()`: snapshot-derived round normalization is **5–30**.
- no pick numbering, ownership, ledger authority, external-player identity or canonical-board behavior changed.

### `extensions/espn-companion/popup.html`
- rounds input now advertises `min="5"` / `max="30"`.
- no permissions, controls, endpoints or auth changes.

### `extensions/espn-companion/war-room-content.js`
- `sanitizeSettings()` rejects round values outside **5–30**.
- unsupported 1–4 / >30 settings therefore are not forwarded as `WAR_ROOM_SETTINGS_UPDATE`.
- team and draft-slot validation remains unchanged.

### `extensions/espn-companion/background.js`
- `sanitizeStoredConfig()`: persisted Companion round values clamp to **5–30**, default 16 unchanged.
- `updateConfig()`: live Companion config round values clamp to **5–30**, existing fallback semantics unchanged.
- no capture architecture, provider route, permissions, credentials, ledger or ownership change.

## Focused regression evidence added

### `scripts/test-browser.mjs`
The actual browser app now asserts:
- command-bar rounds input has min `5`, max `30`;
- canonical command-bar application maps 1/2/3/4→5, preserves 5 and 30, maps 31→30;
- `normalizeSavedDraftPayload()` maps 1/2/3/4→5, preserves 5/30, maps 31→30;
- `snapshotSettingsForExternalPicks()` maps 1/2/3/4→5, preserves 5/30, maps 31→30;
- `readEspnExternalDraftState()` does the same for restored external-pick storage.
The fixture restores the original draft settings afterward.

The pre-existing browser entry point also literally executes:
- `node --check js/war-room-rankings.js`
- `node --check scripts/test-browser.mjs`
before running browser assertions.

### `extensions/espn-companion/test/background.test.cjs`
New regression proves:
- stored rounds 1/2/3/4→5;
- stored 5 and 30 remain unchanged;
- stored 31→30;
- live `updateConfig()` 1/2/3/4→5;
- live 5/30 remain unchanged;
- live 31→30.
Existing corrupt-settings test still independently proves gross high input normalizes to 30 while team/slot sanitization remains intact.

### `extensions/espn-companion/test/manifest.test.cjs`
- popup markup must contain rounds min 5/max 30;
- a VM-backed execution of the real `war-room-content.js` bridge dispatches page `SETTINGS_UPDATE` messages;
- rounds 1/2/3/4/31 must produce no `WAR_ROOM_SETTINGS_UPDATE`;
- rounds 5 and 30 must be forwarded with correct `totalPicks`.

## Required existing invariant suites retained

No test registrations or package/workflow files were changed. Canonical `npm test` remains responsible for the complete existing chain, including:
- release/module/syntax validation;
- Companion test suite;
- browser suite containing WR-130 focused assertions;
- scoring/recommendation corrections;
- draft invariants;
- persistence/recovery and recovery-failure suites;
- external/off-board ESPN behavior;
- responsive/phone/layout/hardening/command-bar/draft-awareness suites;
- WR-118 replay/reconnect regression.

A passing exact-final-head FULL War Room CI is required before this Builder target can be frozen. Do not treat source inspection or this document as execution proof.

## Scope control

Before evidence/handoff publication, base→candidate comparison contained exactly the nine authorized implementation/test paths:
1. `js/war-room-command-bar-fixes.js`
2. `js/war-room-espn-sync.js`
3. `js/war-room-external-picks.js`
4. `extensions/espn-companion/popup.html`
5. `extensions/espn-companion/war-room-content.js`
6. `extensions/espn-companion/background.js`
7. `scripts/test-browser.mjs`
8. `extensions/espn-companion/test/background.test.cjs`
9. `extensions/espn-companion/test/manifest.test.cjs`

Final publication adds only:
10. `.ai/builder/WR130_ROUND_COUNT_CONTRACT_EVIDENCE.md`
11. `.ai/builder/HANDOFF.md`

No other path is authorized or intended.

## Preserved decisions and explicit non-actions

- WR-D001: FantasyPros PPR ECR remains player-value authority; ESPN remains market timing.
- WR-D018: fallback-first / `LIVE_DIRECT_UNVERIFIED` preserved.
- WR-D027: NO PROVIDER CONTACT preserved.
- WR-D038 recommendation-card repair preserved.
- WR-D043 A3 closure preserved.
- WR-D045 bounds this implementation.
- Track B source-rights/custom-ranking gates remain paused.
- A4 / 2027 ranking refresh remains season-gated and unassigned.
- No Half-PPR/Standard, custom roster slots, keepers, risk preferences or reusable league profiles were added.
- No ranking, scoring, recommendation, draft-state policy, dataset, CI/workflow/runner, deployment, permission, credential, auth or provider endpoint change occurred.
- No provider contact or live ESPN account action occurred.

## Execution limitation before exact-head CI

The chat execution sandbox could not independently clone GitHub because outbound DNS resolution was unavailable. No local-terminal test PASS is claimed. Repository-hosted exact-head War Room CI is therefore the execution authority for syntax, focused browser/Companion assertions and the full existing regression chain. Final handoff must report only CI results actually observed on the immutable final head.
