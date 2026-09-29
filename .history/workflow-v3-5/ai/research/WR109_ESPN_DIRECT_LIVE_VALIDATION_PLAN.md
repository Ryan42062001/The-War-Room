# WR-109 — Consent-Safe Disposable ESPN Direct Live Validation Plan

**Status:** PROPOSED ONLY — no live execution or user-account access authorized by WR-109.  
**Current verdict:** `LIVE_DIRECT_UNVERIFIED`.  
**Experiment category:** EXPERIMENTAL / NON-PRODUCTION.  
**Gate owner:** Manager / Architect must authorize a separate bounded live-validation task before any authenticated ESPN access or mock entry.  
**Current baseline for the plan:** 2026-09-19 repository `3a8fd9a9ddab71280d4b05df593baaf09b1cc2c3`, Companion 0.9.14; at execution time re-pin **live** accepted main/website/extension versions rather than assuming this document is a runtime lock.

## 0. Deferred gate and smallest required user action

No authorized disposable ESPN session or consent-safe Direct live capture was made available to WR-109. No browser, ESPN account, league, credential, recording, or mock is accessed here.

**Exact deferred validation gate:** Manager explicitly authorizes a distinct `DISPOSABLE_ESPN_DIRECT_LIVE_VALIDATION` run for the accepted current Companion and War Room build, with specified mock format, allowed diagnostic artifacts, stop conditions and data-retention boundary; the user voluntarily opens a disposable ESPN fantasy-football practice/public mock **in their own already-signed-in browser**, verifies that the mock (not their actual league draft) is accessible, and reports readiness. Only then may a separately authorized operator observe the mock under this plan.

**Smallest user action when the gate is ready:** “Open a disposable ESPN fantasy-football mock draft in your own browser, without sharing credentials, and tell the Manager it is ready for the separately authorized observation.” If no such mock is available, state `LIVE_DIRECT_UNVERIFIED / INCONCLUSIVE — NO ELIGIBLE LIVE MOCK`, leave this plan deferred, and do not simulate a PASS.

The user need not export cookies, reveal passwords, copy raw HAR, run console injection, or grant a remote agent account control. The mock may require routine ESPN account sign-in by the user; this document does **not** authorize R&D to initiate sign-in, log in as the user, or access that session.

## 1. Preflight (before the separate live-task clock)

1. Manager pins the current canonical `main` SHA, accepted War Room URL/build, Companion manifest/build SHA/version, test owner, date/UTC time, mock type, allowed draft configuration and which artifacts may be shared. Verify the extension currently loaded from the intended local repository folder, that installed and website-required versions match, and only one Companion is enabled. No unreviewed code/permission changes.
2. The user verifies that the target room is explicitly a **disposable mock/practice draft**, not an actual paid/private/keeper league. Record only pseudonymous test ID, season, teams, rounds, user's draft slot, PPR and snake/other draft-order mode; identify actual ESPN room/team IDs **locally** as needed for ownership checks, then pseudonymize in shared materials.
3. Confirm configured War Room/Companion teams, rounds, slot, scoring, draft key and expected terminal N = teams × rounds equal ESPN. Use a new isolated War Room draft session and clear old Companion picks **only before entering the new mock**. Never clear captured picks after the draft has started to make a failure disappear.
4. Sequence: accepted repo checkout/build verified → reload the one unpacked Companion → refresh the ESPN tab so MAIN-world `document_start` observers load → refresh War Room → open the popup and verify connected/required-version health. If ESPN page/extension was already loaded too late, restart in another authorized disposable mock; do not infer missing observer traffic means ESPN emitted no structured data.
5. Disable unrelated browser automations/userscripts/duplicate extensions affecting ESPN; do not enable debugger, broad permissions, raw packet capture, request mutation, bulk API polling or synthetic mock-input injection. Confirm the current accepted observer's passive scope. Existing conditional REST recovery must not be forced with credentials or new requests by this test.
6. Establish a local consent-safe observation baseline before pick 1: sanitized `Copy diagnostics`, visible ESPN current pick and roster/board state (manually verified), Companion capture method/source status, ledger/APPLIED/UNMATCHED, missing pick numbers, conflicts/unresolved IDs, REST resolved/raw/unresolved/HTTP state, draft identity and provenance. Apply the established diagnostic trace reset **only if separately authorized and shown to be trace-only**, never substitute `Clear captured picks`.
7. The real ESPN draft clock has priority over evidence capture. A 30-second mock timer/autopick can invalidate Mine ownership; make user-slot picks promptly, and if automatic selection occurs record/autoclassify it and stop ownership PASS claims until actual ESPN team ownership is reconciled. Do not leave an actual paid/real draft to debug a mock.

## 2. Observation protocol: direct source without hidden DOM credit

1. Begin passive capture **before** the first completed pick. At agreed low-interference checkpoints (before pick 1, first pick, around pick 10, first turn, midpoint, final user pick, completion), record sanitized Companion `Copy diagnostics` and a minimal local ground-truth ledger of `overall_pick → player ESPN ID if available / normalized name / position / exact ESPN owner team ID or team slot / pick completion time`.
2. For each candidate source (`react`, `websocket`, `fetch`, `xhr`, `eventsource`, conditional `REST`, `dom`), distinguish (a) active/observed transport, (b) a decoded completed-pick candidate with overall number and stable player identity, (c) accepted contribution to the unified ledger, (d) successful War Room application. Label the first contributing source per pick; a structured-active light, payload observation count, heartbeat, scheduled/future slot or empty REST reply is **not** a Direct pick.
3. Record independent structured progress **before** any user/automatic Pick History or Board mount if feasible; leave the normal ESPN player view undisturbed during the initial structured-only observation window. Do not hide/disable fallback hooks, patch source confidence, mutate ESPN page state or suppress a naturally occurring automatic view transition merely to manufacture isolated Direct evidence.
4. If a natural Pick History view transition happens, capture it as an observation and separately identify which missing picks were present **before** versus only **after** DOM candidate recognition. Correlate source/candidate timestamps, navigation click provenance, route/view change, ledger delta, delivery and War Room ACK; `event.isTrusted=false` alone never identifies the caller. A real switch followed by DOM repair is fallback/hybrid evidence, **not a full Direct PASS**.
5. Explicitly compare ESPN visible pick-by-pick ground truth with Companion/War Room at each checkpoint: pick numbers 1..completed, no gaps/duplicates/out-of-range/future slots, ESPN player IDs before name fallback where known, owner IDs/team slots, Mine/Taken roster, available-player suppression, latest pick, expectedCompleted, Captured, Applied, Unmatched, conflicts, missing numbers and ACK lag. Separately mark unknown external/off-board player IDs; accept their numbered progress/roster truth without inventing a canonical 717-player ECR or recommendation row.
6. At completion, compare exactly N unique ordered 1..N picks and every team/user pick to ESPN, `Captured=N`, `Applied=N`, `Unmatched=0`, no unresolved ID/duplicate/conflict capable of changing identity or ownership, no inaccurate available/roster entries, `Draft complete`, final report available, and terminal status survives one safe Rescan/reload/late smaller acknowledgement without regression. Distinguish ESPN “room closed” UI from a fully reconciled numbered ledger. If the mock ends prematurely or ESPN's room disappears before reliable ground truth is preserved, return INCONCLUSIVE rather than assuming the final result.
7. Preserve native pick chronology/ground-truth evidence **locally**; publish only minimized, scrubbed, deterministically ordered summaries, digests/counts and short example rows needed to reproduce a failure. Do not upload raw ESPN network responses or page storage.

## 3. Separate fallback observation (when legitimate)

- If the **same** disposable mock naturally has structured lag or no usable structured source, keep the normal fallback enabled and label all affected picks `BOARD_PICK_HISTORY_FALLBACK` or `HYBRID`. Observe whether visible history/Board mounts or opening it once while not on the clock and invoking `Rescan ESPN` closes numbered-pick gaps without regressing stronger earlier evidence. Do not force a code-level “Screen mode” or patch the transport.
- A second, separately approved disposable mock may be used for a controlled Board-fallback full-run comparison **only** if such a mock is readily available and Manager authorizes that independent run. It is not an automatic retry of the Direct test.
- Validate reordered/repeated picks from naturally observed frames and ACKs; do not deliberately manufacture duplicate real ESPN draft picks. Controlled deterministic fixtures already cover these internal edge cases and must remain labeled synthetic.
- If history remains behind, note provisional completion and individual missing pick numbers. A late, complete Board DOM ledger can validate fallback **only for the observed format/runtime**. Earlier live 0.9.13 224/223 and 0.9.14 post-fix deterministic repair are different evidence; do not claim the repair was live-revalidated unless this new mock actually demonstrates it.

## 4. Pass / fail / inconclusive criteria

### PASS — `LIVE_DIRECT_VERIFIED` (strict, scope-bound)

A single authorized real disposable full mock under the pinned current runtime must satisfy **all**:

1. Consent, version/draft/session/clock and privacy preflight passed, and the agreed sanitized evidence bundle has unambiguous runtime provenance.
2. Structured page/network (or unambiguously identified actual structured REST, reported as the specific source subtype) emits genuinely live, numbered completed picks with stable player IDs, exact available team-owner IDs, and source-to-ledger-to-War-Room causal/chronological linkage. No source may count solely because its transport is active.
3. Independently attributable structured candidates account for **every** completed pick 1..N before DOM candidate repair is needed for any of them. A passive automatic history transition may occur, but if DOM supplies an otherwise missing or incorrect pick, classify that execution as Hybrid/fallback, not a Direct PASS.
4. No duplicate/missing/out-of-range picks, unresolved ownership or identity collision, wrong Mine/Taken, false available row, off-board invented value, late-ACK regression, or mismatch versus ESPN ground truth. Captured=N, Applied=N, Unmatched=0; any transient lag resolves by the agreed checkpoint without DOM-derived pick repair.
5. Full terminal ledger and the War Room final report agree with ESPN, persist across an ordinary post-draft Rescan/late heartbeat, and every required diagnostic/ground-truth field was observed with secret-safe custody.

Result label must identify **the tested mock configuration and structured source(s)**, e.g. `LIVE_DIRECT_VERIFIED — one authorized 12-team PPR practice mock, 0.9.14, source=React`. It does not imply validation of other ESPN formats, all future frontend versions or an official/stable ESPN API contract.

### FAIL — observed real discrepancy with adequate evidence

Preflight is valid and there is a reproducible or unambiguous **observed** failure in eligible live evidence: a structured candidate accepted with wrong overall number, player ID/team ownership, future scheduled slot as completed, duplicate/incorrect ledger reconciliation, false availability/Mine, uncorrected missing pick despite a structurally eligible upstream source, false terminal completion, cross-draft contamination or leaked sensitive diagnostics. Stop, preserve minimized evidence, mark impact/severity and route to Manager for a **separate** bounded Builder/security task if indicated. Fallback may still complete that mock, but Direct has failed its full independent-sufficiency gate; do not erase the failure or claim Direct PASS.

A privacy breach, accidental real-league selection, credential exposure, mismatched build or uncontrolled automation invalidates the run; if it is a concrete product safety flaw, report FAIL and halt, otherwise classify the Direct outcome INCONCLUSIVE and correct the preflight only under new approval.

### INCONCLUSIVE — `LIVE_DIRECT_UNVERIFIED`

Examples: no eligible disposable mock/consent; inaccessible or prematurely ended room; version/routing mismatch; only synthetic fixtures; zero decoded structured candidates despite healthy passive hooks; ESPN sends only empty/rest 404 responses; only DOM yields full picks; merely observing an “active” structured panel; incomplete ground truth/redacted IDs needed for ownership; unknown automatic-history caller; or natural fallback supplied some missing picks without isolating whether Direct could have done so independently.

**Important:** A mock with healthy Board/Pick History fallback but no real structured picks is an observed fallback result, **not** proof of a product defect or a Direct PASS. Report `LIVE_DIRECT_UNVERIFIED`, record the observed source-mix and exact missing proof, and stop—do not automatically retry until a preferred result appears.

## 5. Deterministic evidence/custody record for the later separate task

The next authorized validation report should minimally bind:

- Manager-authorized task ID, approved operator, UTC start/end, accepted git/build/manifest SHA and Companion installed/required versions, one enabled extension, isolated draft/session pseudonym and setup.
- Consent confirmation; disposable room type, anonymized mock ID, format, teams, rounds, slot, exact expected N and authorized scope.
- Per-checkpoint sequence numbers/UTC timestamps, sanitized `Copy diagnostics` digests, observed source/status/candidate/ledger/ACK totals, missing/conflicting pick numbers, explicit fallback mount/navigation events, and manually verified ESPN truth counts.
- Per-pick **pseudonymized** normalized tuple `(overallPick, ESPN-player-ID digest or locally retained ID, source-before-DOM, owner-ID digest/slot, accepted ledger time, applied time, state)`; deterministic sorted order 1..N, explicit exclusions, collision/unknown-ID ledger, no raw requests.
- Reconciliation matrix `ESPN completed → source candidate → accepted ledger → War Room applied`; explicit per-pick Direct-vs-DOM provenance. Initial and terminal snapshot hashes; all deviations in separate finding records.
- Final verdict exactly one of `LIVE_DIRECT_VERIFIED`, `LIVE_DIRECT_UNVERIFIED` (inconclusive) or `LIVE_DIRECT_FAILED`; fallback result reported separately. Distinguish observed fact, inference and unknown.
- Screenshots/video only if separately consented and necessary; crop account names, email, personal league/team data, URL query strings, chat, other tabs and browser profiles. Strip passwords, cookies, `espn_s2`, SWID, authorization/session tokens, authorization headers, full HAR/network bodies, request parameters, raw account identifiers and private league content. Scrub **before** committing/sharing; credential-safe `Copy diagnostics` is not a blanket guarantee. Do not put secrets in issue comments, logs or Git.
- No new server upload/retention channel is authorized by this plan. Keep local transient artifacts only until the separately approved sanitized evidence is captured, then delete unneeded raw working copies according to the later task's explicit retention rule.

## 6. Deferred decision and routing

WR-109 publishes **the plan**, not a live verdict. Manager reviews this document and may later authorize one bounded R&D disposable-mock observation; if unavailable, keep `LIVE_DIRECT_UNVERIFIED`. Verified implementation defects route to Builder under a new authorized task and their own tests/audit. Draft Strategy owns any recommendation-policy changes; source-refresh intake is a separate Manager/R&D admission path. This plan does not grant credentials, source downloads, extension permission changes, new production ranking authority, model scoring, runner/workflow changes or Phase 6.
