# WR-133 — Current Synthetic Companion→War Room E2E Evidence

**Task:** WR-133 — Synthetic Companion→War Room End-to-End Regression  
**Role:** Implementation Engineer / Builder; Workflow V3.5; STANDARD_CHAT_HIGH / FAST_REFRESH  
**Decision:** WR-D049. **Audit required.**  
**Verified creation base:** `3a0c5a9ad8f4e3641ef3953b89d807a550941df9` (assigned branch initially identical; 0 ahead/0 behind).  
**Branch / existing PR:** `wr-133-companion-war-room-synthetic-e2e-regression` / #374, OPEN and UNMERGED.  
**Scope:** Four paths only: this document, Builder handoff, `package.json` (named registration only), and `scripts/test-wr-133-companion-war-room-e2e.mjs`.  
**Freeze rule:** Report the final post-document SHA and its exact-head FULL CI from the final handoff to Manager; do not rewrite this document after final-head CI merely to embed later run IDs.

## Executive finding and historical failed attempt

The historical Builder head `acbaacb30b0f97b25e6779f6a5164a0f7b0ad27c`, run #35655679877, classify #106518604149 SUCCESS, Governance #106518698907 SUCCESS, FULL test #106518775430 FAILURE, reached A–F and G Session B, including all three required negative controls. It failed after ten seconds at `G session A restored after B app ledger count` (`waitForConvergence` near line 592). **This failure remains historical FAIL; do not relabel it.**

The actual current `js/war-room-command-bar-fixes.js:shouldProtectEspnSessionSwitch()` and its installed `selectEspnDraftSession()` guard refuse a **passive snapshot-based switch** to another *existing* ESPN session while the current saved draft has unfinished progress. The real `index.html#draftSessionSelect` on-change handler instead calls `switchDraftSession(this.value)` for an intentional user selection. The historical WR-133 fixture had saved B's five picks, then delivered A's 13-pick snapshot and expected the protected app to switch automatically. That expectation was inconsistent with the accepted, unchanged product contract.

### Same-task test-only correction

At test-only intermediate commit `e27c24b1e35a4992a8c39be1f76278f89a9cdda1`, the harness now:
1. Sends the real Companion A snapshot while B is active and records that the real session guard is true, the page remains on B with its exact five-pick ledger, and the Companion correctly holds 13 A picks.
2. Uses Playwright `page.selectOption('#draftSessionSelect', sessionA)` to exercise the actual Draft menu/on-change path, **not** a mock or production-code bypass.
3. Verifies that the saved A ledger is already identical to the previously accepted corrected A ledger, with the same digest, **before any replay**.
4. Invokes the **real** `background.js:broadcastWarRoom(true)` to resend the current Companion A ledger through the real Chrome-message contract, real content bridge, actual War Room page listener and real `applyEspnDraftSnapshot()` / ACK path.
5. Re-runs the original full `checkpoint()` assertions for 13 accepted picks, session identity, numbered ledger equality, independently derived snake ownership, Mine/Taken and ACK/counters. Nothing is skipped or weakened.

Intermediate same-task full PR CI #35669937164 / classify #106563913769 SUCCESS / Governance #106563952208 SUCCESS / FULL test #106564011466 SUCCESS established all checkpoints. It proves this specific G failure was a harness expectation defect. It is **not** an independent audit verdict and cannot substitute for a new exact-final-post-document-head FULL CI.

## Executed architecture (no duplicate production algorithms)

`scripts/test-wr-133-companion-war-room-e2e.mjs` executes:
- Current unmodified `extensions/espn-companion/espn-live-capture.js`, `espn-observability.js` and `background.js` inside bounded Node VM with synthetic Chrome runtime, tab, storage, messaging, badge and scripting adapters.
- Current unmodified `extensions/espn-companion/war-room-content.js` injected into the **actual local** `127.0.0.1:8765` War Room Chromium page. Its trusted-page marker and version/channel rules run unchanged.
- The actual committed 717-row local application board and current `js/war-room-espn-sync.js`, session/persistence, external-pick, draft-state, scoring and recommendation source, loaded by the real local page.
- Real background `ESPN_PICKS_FOUND`, `ESPN_STRUCTURED_PICKS`, `ESPN_LIVE_OBSERVATIONS`, `ESPN_HEARTBEAT`, `broadcastWarRoom()`, `WAR_ROOM_SNAPSHOT`, content bridge `PICKS_SNAPSHOT`, real page `applyEspnDraftSnapshot()`, `SYNC_ACK`, content `WAR_ROOM_ACK` and background ACK state.

Mocks are limited to deterministic Chrome/browser/storage APIs and transport glue. The harness independently compares production-observed ledgers with fixture/order and simple ownership assertions; it does not copy Companion reconciliation, application sync, snake-draft or recommendation engines. Browser requests are allowed only to its exact local origin and unexpected external requests are aborted and counted; background `fetch` is fail-closed. Fixture has **Full PPR, redraft, snake, 10 teams, 16 rounds, slot 7, 160 picks**, with committed local board rows and synthetic player IDs; synthetic draft identities are not real ESPN account resources. No cookies, credentials, tokens or provider URLs are logged.

## Accepted checkpoints from intermediate successful FULL CI #35669937164

Every logged `WR133_CHECKPOINT` below included a deterministic synthetic fixture digest, companion/app numbered ledger digests, ownership digest, captured/applied/unmatched/ACK counters, active session ID and completion state. At stable checkpoints **Companion ledger digest == app ledger digest**. Checkpoints below preserve the actual immutable log digests, not computed assertions reported as execution.

| Checkpoint | Count / result | Companion and app ledger SHA-256 (same at stable checkpoint) | Ownership SHA-256 |
|---|---:|---|---|
| A — setup | 10 teams / 16 rounds / slot 7; current channel `the-war-room:espn-sync:v1`, extension v0.9.14 | Setup fixture digest `aea8c4c86bf9d66830fa237eb660399738e2b00a45e16b0bb0de96d167ec616f` | N/A |
| B — initial progression | 12/12 captured/applied/ACK, unmatched 0 | `192ff3201fcefd437a3e482410bbd557b090d7bd70ffee92bc14cbec77e9e180` | `fcefb19108906482902a13f36806d2dac7ac2b6712ba26925e9df830f6701d76` |
| C — duplicate/reordered | 12/12 stable; no duplicates/inflation | `192ff3201fcefd437a3e482410bbd557b090d7bd70ffee92bc14cbec77e9e180` | `fcefb19108906482902a13f36806d2dac7ac2b6712ba26925e9df830f6701d76` |
| D — stale shorter | 12/12 retained despite nine-pick stale input | `192ff3201fcefd437a3e482410bbd557b090d7bd70ffee92bc14cbec77e9e180` | `fcefb19108906482902a13f36806d2dac7ac2b6712ba26925e9df830f6701d76` |
| E — unresolved #13 | 12 accepted, unresolved [13], no wrong fabricated pick | `192ff3201fcefd437a3e482410bbd557b090d7bd70ffee92bc14cbec77e9e180` | `fcefb19108906482902a13f36806d2dac7ac2b6712ba26925e9df830f6701d76` |
| F — authoritative correction | 13/13, wrong pick 5 displaced, unresolved empty | `043ebe3af0f8103fbaed4a403b22c9eb9d93e72faefbf7dbd07635b56d701856` | `b3c82e849909ffbf1b72c1d9fef6356367d329e7b0c14d8d15d0a5c50a67957d` |
| G — isolated B | 5/5, distinct app session, A saved | `c061887037dd8370e9e638da0ed7608a00be2344b6185b3e4c213f410a2ff5ae` | `c10b4cf0284e1446f1caea9bc8204f10904e63969147ce6d4dc0f51843f3ecf8` |
| G — explicit A return | 13/13; saved A intact pre-replay, then bridge replay + ACK | `043ebe3af0f8103fbaed4a403b22c9eb9d93e72faefbf7dbd07635b56d701856` | `b3c82e849909ffbf1b72c1d9fef6356367d329e7b0c14d8d15d0a5c50a67957d` |
| H — pre-reload and reconnect | 20/20; unchanged after app reload, bridge reinstall and WAR_ROOM_READY | `f6f4a6c98f9f0a0ca69a175a7efb382bae605890576fd8f8e44ddd97653e54a0` | `78e30e14c3f0cbd7b3cd1f8bba0f50188a609b9dd5c4a9612bda2c6a160ffe4d` |
| I — 159/160 | 159/159 captured/applied/ACK; not authoritative terminal; no fabricated #160 | `9948342620951b3b9fcd819087bff70f8753a5dfec160cc8f0f9641038f79270` | `551b89977a90564e292040cc47cb93f30cb058bc106625f6c1100e71e5afb5ca` |
| I — 160/160 + terminal reload | 160/160 captured/applied/ACK; authoritative completion; `nextPick === null`, same digest after terminal reload | `69cdef2609a43a2f7fda02341dd296015b89a79e444e9ca5eaf8158fc90dbc0b` | `796a038b373f4ea9e38b103746312620380b2e29cc4823edce6faebb7d15d9a7` |

**Important G transient, explicitly NOT a stable convergence checkpoint:** `WR133_SESSION_GUARD` logged `passiveSwitchBlocked:true`; Companion A count 13/digest `043ebe3af0f8103fbaed4a403b22c9eb9d93e72faefbf7dbd07635b56d701856` while the protected app correctly still displayed B's 5 picks/digest `c061887037dd8370e9e638da0ed7608a00be2344b6185b3e4c213f410a2ff5ae`. This temporary different-session ledger difference is intentional and disappears after explicit Draft-menu A selection and real Companion bridge replay. It must not be misreported as accepted same-session divergence.

**Synthetic fixture/order digests:** B `27a72cacefcef489e4d8965ba9741e77c701913049ffaaed84db33b2e5d89dc2`; C `9314911220c2ebc79f15aebf516610cc21274ca18db8a075482d786821122ff2`; D `444f4a39589d578df225235dc889906663f696db1e0c41e0604c5c043883b68f`; E `ad7d1760503b33b69ff286c214976a8b9bb48ade901678b5a5a06f14b4287728`; F/G-A `c3409079ac9efbf129a899f747723b01a834befa9bb487099f8fd044703c2018`; G-B `d1866374772bc7bc96eeb6a59f413dc8341c2e7e1b1e916281437575b5cbab55`; H `8219ebb5a50096c297b5db95fb015d55fc6c9482b282a08f10f8b1a834214ff8`; I-159 `163524c3de6c57ddf91c29776165b74f998606a5b8e6f7c5937e28ad4cd5b57a`; I-160 `ff82320729974b6157ed4410a13b0eb662bb0032849c0c82a619dae8b6375dd9`.

## Three executed negative controls

The actual successful CI job logged three `WR133_NEGATIVE_CONTROL` detections:
1. **Lost accepted pick:** a copied app ledger without one accepted pick caused `WR133SyntheticInvariantFailure`.
2. **Wrong team / Mine-Taken ownership:** a copied ledger with deliberately wrong owner caused `WR133SyntheticInvariantFailure`.
3. **Bridge/channel drift:** a copied channel-proof object with mismatched version caused `AssertionError`.

All are test-only copies; none changed real source, real app state, real Companion ledger or release data. The oracle's original full-checkpoint comparisons remain active.

## Commands and results actually observed — successful intermediate candidate

War Room CI #35669937164 exact **intermediate** head `e27c24b1e35a4992a8c39be1f76278f89a9cdda1`:
- classify #106563913769 **SUCCESS**
- Governance #106563952208 **SUCCESS**
- FULL product test #106564011466 **SUCCESS**
- bootstrap-reuse #106563953663 **SKIPPED**

The full job's actual `npm test` step **SUCCESS** and logs explicitly show:
- `npm run test:extension` → `npm --prefix extensions/espn-companion test`: **167/167 PASS, 0 fail**. Contains existing real Companion background/content/bridge tests.
- `npm run test:wr118-espn-replay-reconnect`: `WR118_APP_SIDE_SYNTHETIC_PASS` (2 iterations, matching final ledger hashes).
- `npm run test:wr133-companion-war-room-e2e` explicitly executes `node --check scripts/test-wr-133-companion-war-room-e2e.mjs && node scripts/test-wr-133-companion-war-room-e2e.mjs`: `WR133_COMPANION_WAR_ROOM_E2E_PASS` with A–I evidence, negative controls=3, browser errors=0, external requests=0 and Companion fetches=0.
- The existing syntax, browser, scoring, draft-invariant, persistence/recovery, recovery-failure, responsive/phone, determinism, resilience syntax and backup/offline reload steps all passed.

There is **no independent chat-local terminal run** claimed: command execution evidence is the actual GitHub FULL-CI job and its logs. After these two required documentary writes, Manager must inspect the **new exact-final-head** CI run; previous intermediate #35669937164 does not prove final-head pass.

## Boundaries / conclusions

- No observed production or Companion defect in this bounded synthetic test. The historical G failure is explained by a wrong harness expectation that contradicted intentional saved-session protection, and the repaired test proves the protection and explicit selection path.
- This is source-free **synthetic local** evidence; it does not establish real ESPN end-to-end, exact-current live fallback, structured Direct live behavior, 2-team/5-round or 20-team/30-round full-draft envelope, physical-device certification, deployment/rollback readiness, release/draft-ready status or 2027 source freshness.
- WR-D001 PPR ECR remains VALUE, ESPN remains TIMING; WR-D018 fallback-first/`LIVE_DIRECT_UNVERIFIED`; WR-D027 NO PROVIDER CONTACT; WR-D038 truthfulness; WR-D043 Command Center closure; WR-D047 5–30 round closure; WR-118 accepted app-side evidence; A4 season gate; Track B `RIGHTS_UNVERIFIED / OPTION_C_UNPROVEN / NO_SOURCE_ADMISSION / PAUSED` are preserved.
- No provider contact/account interaction, network source fetch, ranking/scoring/recommendation-policy change, production/Companion/fixture/workflow/runner/dataset edit, deployment, rollback or release occurred.

**Next gate:** One exact-final-head FULL CI after publication, then Manager independently freezes exact four-file Builder target and activates a FRESH Independent Auditor. Builder does not self-audit or merge.
