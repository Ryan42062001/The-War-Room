# WR-048 — Post-Integration Browser Persistence Determinism Residual

Task: `WR-048`  
Role: Work Helper / Super Troubleshooter  
Assignment mode: `WORKFLOW / CI TROUBLESHOOTING`  
Starting canonical main: `68969e1435c69b72f5e9ac1599d95bf6f3716d09`  
Branch: `wr-048-browser-persistence-residual`

## Disposition

The post-integration failure is a deterministic test-invariant error hidden by a 400 ms timing race. It is not post-merge executable drift and is not the later user-session deletion path described in the initial symptom.

The failing assertion belongs to corrupt-payload recovery for `draft-state-v1:good`. `readDraftSessionPayload('good')` correctly quarantines and removes the corrupt `[]` value. Normal post-load recommendation calculation then creates a recommendation-audit record and calls `scheduleSave()`. Its 400 ms callback writes a new valid version-2 state to the same active draft key. Depending on page/runner timing, the assertion sees either the atomic recovery boundary (`null`) or that legitimate successor payload.

## Trigger evidence

Two independent Manager/control-plane executions reproduced the same path before any other stress iteration:

| Run | Job | Head | Evidence |
|---|---:|---|---|
| `34666574060` | `103479540784` | `56ba186f97a14458117071f4106077aba757c441` | Iteration 1 `npm run test:browser`; expected `null`, observed version-2 payload saved at `02:03:40.904Z`; recommendation recorded at `02:03:40.501Z`. |
| `34666754287` | `103480078959` | `98a88050d1929121afc32a80420a4be815cc1617` | Same iteration/suite/assertion; payload saved at `02:07:34.506Z`; recommendation recorded at `02:07:34.046Z`. |

The approximately 403 ms and 460 ms record-to-save intervals align with the production `scheduleSave()` 400 ms debounce plus scheduling overhead. Both payloads contain an otherwise valid empty-board state and one Jahmyr Gibbs recommendation record, which identifies recommendation auditing as the writer.

Comparison from audited WR-044 head `e750748d938ed6bb8284eeec1cfda9eea77997ac` to starting main showed only `.ai/auditor/**`, `.ai/manager/**`, and `.ai/shared/**` changes. No workflow, test, persistence, or production executable changed. The residual was latent in the exact audited implementation; WR-045 remains historically valid for its exact target and evidence.

## Exact causal lifecycle

1. The harness stores invalid JSON-shape value `[]` at `draft-state-v1:good` and reloads.
2. Startup `loadState()` calls `readDraftSessionPayload()`.
3. `normalizeSavedDraftPayload([])` returns `null`; `quarantineCorruptStorageValue()` preserves a backup and removes the active corrupt key.
4. Board/recommendation rendering continues after recovery.
5. `updateRecommendationAudit()` adds the first recommendation record and calls `scheduleSave()`.
6. `scheduleSave()` assigns `_saveTimer` to a 400 ms timeout.
7. The callback calls `saveState()`, which writes a new valid version-2 payload to `getDraftSessionStateKey()`—the same `draft-state-v1:good` key—and then clears `_saveTimer`.
8. The old harness asserted current storage sometime after row attachment. Fast executions arrived before step 7 and saw `null`; slower executions arrived afterward and saw the valid successor.

The WR-044 quiescence helper cannot establish permanent absence here. It was not called on this `persistencePage` boundary; if added, it would deliberately wait for step 7 and make the key non-null. The invariant was therefore wrong: corrupt quarantine must be atomic, but an active draft key is allowed to receive later valid state.

## Remediation

`scripts/test-browser.mjs` now separates two contracts:

1. **Atomic quarantine:** in one browser task it writes `[]`, calls the actual production `readDraftSessionPayload('good')`, captures the result, and reads the key. It strictly requires status `corrupt`, a recovery-backup key, and `localStorage.getItem(...) === null`.
2. **Startup continuation:** it independently seeds `[]`, reloads, waits for application quiescence, verifies the corrupt raw value is gone, the backup exists, and the board remains clean. If normal application work creates a successor at the same key, that successor must parse as version 2 with an array-valued recommendation audit.

This does not clear storage to manufacture success. It puts the strict absence assertion at the only valid linearization point: immediately after the recovery operation returns and before unrelated future state mutation. It also retains full startup/reload integration coverage and verifies any later occupant is valid successor state rather than the corrupt value.

`.github/workflows/ci.yml` adds ten fail-fast `npm run test:browser` persistence-recovery iterations before the existing five complete determinism iterations. Every iteration is mandatory; this is stress coverage, not retry-on-failure.

## Competing hypotheses

| Hypothesis | Disposition | Evidence |
|---|---|---|
| A requestAnimationFrame schedules a save after the WR-044 helper returns | Partly related, not the direct path | Post-load recommendation work schedules the save, but the helper was never called around this separate persistence-page assertion. |
| `_saveTimer` is not represented by the helper predicate | Ruled out | The writer is the exact `_saveTimer` observed by the helper. Waiting for it would permit/await the successor write, not preserve `null`. |
| Browser storage callback or service worker repopulates the key | Ruled out | Payload timestamps and recommendation content identify `saveState()`; localStorage is page-owned, and service-worker code does not write it. |
| Later user-session deletion still has an uncancelled timer | Ruled out for these triggers | The stack line and key are the earlier corrupt-recovery scenario; the user-session deletion test occurs hundreds of source lines later and was never reached. |
| Integrated control-plane changes altered behavior | Ruled out | Exact compare from WR-044 target to baseline contains no executable changes. |
| The corrupt value was not removed | Ruled out | The later value is valid version 2 with a new `savedAt` and recommendation record, not the seeded `[]`; production quarantine precedes it. |
| CI needs more time/retries | Ruled out | More delay increases the probability of observing the valid successor and therefore cannot make the old invariant correct. |

## Assertion and scope proof

- The exact `assert.equal(corruptDraftRecovery.original, null)` assertion remains.
- No browser/global timeout changed.
- No retry, `continue-on-error`, skip, catch-and-pass, or storage-clearing workaround was added.
- Startup recovery, backup creation, clean board, and successor schema are asserted separately.
- No production/user-facing file, football model, ranking, outcome, or custody artifact changed.

## Validation evidence

Final exact-head evidence is recorded in the PR metadata after publication so the immutable target does not move. Required gates are:

- 10/10 targeted persistence-recovery executions;
- 5/5 complete browser-determinism boundary iterations;
- three consecutive complete War Room CI successes on one exact head;
- static syntax/diff/scope checks.

## Remaining boundary

WR-049 must independently verify the causal trace, strict-null linearization point, successor-state assertions, repeat evidence, effective assertion set, and zero production drift. Work Helper does not self-certify or merge this remediation.
