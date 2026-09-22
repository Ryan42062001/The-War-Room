# WR-135 — Supported-Envelope Full-Draft Synthetic Boundary Evidence

**STATUS: BLOCKED / PRODUCTION DRAFT-STATE DEFECT REPRODUCED. NOT AUDIT READY.**
Task: WR-135 — Supported-Envelope Full-Draft Synthetic Boundary Regression.
Role: Implementation Engineer / Builder; Workflow V3.5; STANDARD_CHAT_HIGH / FAST_REFRESH.
Decision: WR-D052. Audit required, but NOT ACTIVATED.
Canonical main and assigned branch initially identical at `413be06069e395a87a2e0a0849b2f893d0b81451`, 0 ahead / 0 behind.
Existing Builder PR: #379 — OPEN / UNMERGED.
First reproducible test candidate: `69b3e6d9e568292dc1f005f9639323bea3c28b09`.
The task's mandated STOP-on-production-defect gate applies. No production source change is authorized under WR-135.

## Exact observed failed validation

**War Room CI #35675133071**, triggered by PR #379 on candidate `69b3e6d9e568292dc1f005f9639323bea3c28b09`:
- classify job #106579931144 — SUCCESS.
- Governance job #106579959818 — SUCCESS.
- bootstrap-reuse job #106579960342 — SKIPPED.
- FULL product job #106579993743 — **FAILURE**, during the actual `npm test` step when its registered `test:draft-invariants` named script executed.
- `npm test` was not successful; required later aggregate commands (including unchanged WR-133) were NOT reached. Do not claim final FULL success or a WR-133 execution in this run.
- Earlier `test:syntax` step in the SAME actual `npm test` included and passed the literal `node --check scripts/test-draft-invariants.mjs`; the named `npm run test:draft-invariants` step actually began (`> node scripts/test-draft-invariants.mjs`).
- No separate standalone local command execution is claimed.
- The pre-existing 10×16 and 14×16 scenarios executed first without throwing; their historical assertion intent/source is preserved. Synthetic ESPN segment is registered after the new boundary scenarios and was NOT reached in this failing run.
- The minimum 2×5 boundary failed before the maximum 20×30 scenario could begin. **Do not claim ANY 600-pick execution, timing, count, or full-envelope success.**

### Reproducer, exact first failing oracle, observed source state

In `scripts/test-draft-invariants.mjs`, the original `runFullDraftScenario` executes the real local Chromium War Room application. The WR-135 extension uses actual `WarRoomCommandBarFixes.applySettings`, real draft-row interaction and metadata, real `getDraftAssistantState` and `getDraftCompletionStatus`, real session save/reload and the unchanged existing `assertInvariants` on EVERY numbered pick. It adds an independent per-pick expected numbered snake/Mine-Taken ledger oracle, real DOM identity/slot/status/progress comparisons, and fail-closed localhost-only request handling. No fixture player or draft/Companion algorithm is invented or replaced.

Run `npm run test:draft-invariants` against the current WR-135 candidate:
- Boundary fixture: `2x5-slot2`; decimal seed `1411383813` (literal `0x54200205`); 2 teams × 5 rounds × slot 2 = 10 numbered picks; actual committed 717-player local board.
- Pick 5: actual and independent expected ledger both digest `57f1131b4da23eb69c199097b760fb3a0970dd775fecb23811b5d67c259773ad`; 2 Mine, 3 Taken, available 712; real draft state currentPick 6 and nextPick 6; authoritative completion false. The same ledger digest and ownership persisted through actual intermediate save/reload.
- Pick 9 (N−1): matching actual and expected ledger digest `033fa11b83b725a10608fbaebb14c85b4515aa5f9bf6741d26f397642ff1d5c5`; 4 Mine, 5 Taken, available 708; currentPick 10, nextPick 10, authoritative false. No pick 10 was fabricated at N−1.
- Pick 10 (N): first failing check is `boundary next-turn state incorrect, including no-next-pick at terminal`, raised by the actual test oracle at `assertBoundaryLedger`. Actual state from GitHub FULL test #106579993743 (UTC 2026-09-22 01:21:25):
  - observed completed numbered picks **10**; teams **2**, rounds **5**, draftSlot **2**, totalPicks **10**;
  - **actual numbered ledger digest = expected digest** `adcc692a890218e8c77a17d688f1b868943469b62c7667f99737ecb297bb4ddb`;
  - actual `getDraftCompletionStatus`: `complete:true`, `authoritative:true`, `provisional:false`, `myRosterCount:5`;
  - independently expected `myNextPick:null`, because no numbered draft pick exists after full 10/10 completion;
  - **actual `getDraftAssistantState().myNextPick:10`**, falsely identifying already-completed final own pick #10 as a future turn.
- Actual stack: `failInvariant` near test line 70 → `assertBoundaryLedger` around lines 380/424 → `runFullDraftScenario` around 500 → boundary scenario around 651. Exact failure string: `DraftInvariantFailure: Deterministic draft invariant failure ... seed=1411383813 ... operation=10 ... invariant=boundary next-turn state incorrect, including no-next-pick at terminal`.

This is not a test-only simulated app state. The ledger/controls/completion/nextPick above were read from the **unchanged real application** in the real browser. The actual application knows completion is authoritative, yet its turn helper exposes the already-completed last pick as `myNextPick`.

### Narrow causal code inspection (read-only)

Current unchanged `js/war-room-draft-state.js:getDraftAssistantState()` sets `currentPick = Math.min(completedPicks + 1, totalPicks)`, constructs the user's snake-owned picks, then selects the first own pick `>= currentPick`. With completedPicks = totalPicks = 10 and final own pick = 10 (2×5 slot 2), the capped `currentPick` remains 10 and the next-pick search yields 10 rather than null. This is consistent with the observed browser failure. The independent oracle MUST NOT be relaxed to treat an already-used final pick as a valid next turn.

The evidence demonstrates an **app draft-state terminal-turn contract defect for an owned final overall selection**, not a proven live ESPN, Companion, ranking, scoring or deployment defect. No wider behavioral diagnosis or app UI rendering claim is made.

## Expected versus actual validation scope

| Required condition | Observation |
|---|---|
| Verified clean branch/main checkpoint | PASS at `413be06069e395a87a2e0a0849b2f893d0b81451` |
| 2×5 actual app setup; distinct local picks | Reached 10/10; expected and actual numbered ledger SHA-256 matched |
| 2×5 intermediate save/reload | PASS at 5/10 |
| 2×5 N−1 nonterminal | PASS at 9/10 |
| 2×5 valid terminal no-next-pick | **FAIL at 10/10**: expected null, actual 10 |
| 2×5 terminal save/reload | NOT EXECUTED: fail-fast at terminal |
| 20×30, all 600 picks / reload | NOT EXECUTED: earlier production defect caused STOP |
| Unchanged synthetic ESPN segment | NOT REACHED by failed named draft test |
| Unchanged WR-133 named regression | NOT REACHED by short-circuited `npm test` |
| Final exact-head FULL CI SUCCESS | NOT ACHIEVED; required defect gate blocks readiness |
| Provider requests | No provider-contact instruction/action was initiated by Builder; the new browser guard blocks non-local origin requests. The failed run did not reach the terminal zero-request assertion, so **zero network violations is NOT claimed as an observed final outcome**. |

## Manager remediation boundary

**STOP Builder execution and preserve PR #379 OPEN / UNMERGED as a deterministic blocked reproducer; do NOT merge or activate formal independent audit on a failing candidate.**

The smallest separately authorizable production remedy to consider is the terminal turn state returned by `js/war-room-draft-state.js:getDraftAssistantState()` when all numbered picks are complete and the user owns the final overall pick. Preserve the previously established current-pick/snake semantics outside terminal state, while ensuring completion never exposes an already-consumed pick as a future own turn. Require focused app/browser tests at a completed final-own-pick boundary, intermediate/terminal reload checks and regressions of ordinary nonterminal turns; keep WR-135 original strict oracle unchanged. This recommendation is **not** authorization to edit that production file in this Builder lane.

After a separately authorized production remediation and independent integration/canonical-main validation, Manager can decide whether to return WR-135 to a new permitted base or a separately scoped same-task test lane and execute the COMPLETE 2×5 and 20×30 scenarios. No 20×30 result, supported-envelope certification, WR-135 acceptance or draft-readiness declaration can be inferred from this failure.

## Preserved decisions / forbidden actions

WR-D001 (PPR ECR value authority / ESPN market timing), WR-D018 fallback-first / `LIVE_DIRECT_UNVERIFIED`, WR-D027 NO PROVIDER CONTACT, WR-D038 recommendation truthfulness, WR-D043 Command Center, WR-D047 rounds 5–30, WR-D049 WR-133 accepted evidence, WR-D052 and paused A4 / Track B rights gates remain unchanged.

No production/Companion source, ranking/scoring/recommendation policy, dataset, package.json, workflow/runner, permissions/credentials, provider, deployment or release file was changed by WR-135 Builder. No self-audit or merge performed. This remains local **app-side synthetic** evidence only and does not close Companion→app supported extremes, live ESPN fallback/Direct, physical-device, A4/2027, deployment/rollback or draft-readiness gates.
