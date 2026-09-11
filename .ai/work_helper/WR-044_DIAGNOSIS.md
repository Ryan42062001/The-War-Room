# WR-044 — Browser-CI Determinism and State-Isolation Diagnosis

Task: `WR-044`  
Role: Work Helper / Super Troubleshooter  
Assignment mode: `WORKFLOW / CI TROUBLESHOOTING`  
Starting main: `142a9580fb408cd78ddae1026a67dd82f7d7b144`  
Branch: `wr-044-browser-ci-determinism`  
PR: #132

## Disposition

Two independent harness races were identified and remediated without changing production code or user-facing behavior.

1. The command-bar test allowed a locator operation to span render generations of a UI that intentionally replaces the command bar's children.
2. The long-lived browser test did not establish a persistence queue boundary before its draft create/delete scenario, so a prior 400 ms debounced autosave could race later storage assertions.

The failures share a broad lifecycle/isolation theme, but they do not have one common application defect.

## Original evidence reproduced

### Command-bar lifecycle

WR-039 CI run `34613965662`, attempt 1, passed phone validation and all 164 extension tests, then failed in `scripts/test-command-bar.mjs`:

- selector: `[data-command-setting="slot"]`;
- Playwright resolved the element for `fill("6")`;
- the element detached;
- the replacement was hidden until the 30-second action timeout.

The test performed `locator.fill('6')` followed by a separate `dispatchEvent('change')`. Production `renderDraftCommandBar()` assigns `bar.innerHTML`, replacing all descendants. Its source observer schedules that replacement with `requestAnimationFrame`. The layout layer then recreates and may collapse the setup disclosure based on draft progress. A visibility observation about one element generation therefore did not guarantee that a later locator action used the same visible generation.

The first WR-044 implementation at PR run `34625305829` made the hidden state deterministic rather than repairing it: the helper resolved the newly collapsed generation and returned `not-visible`. Stress run `34626002986` showed that even “open, settle, then edit” retained an inter-operation race. These discriminating failures ruled out inadequate timeout length and proved the required atomic boundary.

### Persistence lifecycle

WR-039 CI run `34613965662`, unchanged-head attempt 2, passed 164/164 extension tests and failed in `scripts/run-test-browser.mjs`/generated `test-browser` code. A state key expected to be `null` instead held a valid autosave payload.

`scripts/test-browser.mjs` deliberately runs many application and persistence scenarios in one page. Production `scheduleSave()` debounces `saveState()` by 400 ms. The later create/delete scenario previously began without proving that earlier animation-frame work and `_saveTimer` had drained. Thus storage cleanup and deletion assertions could race older scheduled work. The fact that identical unchanged product heads failed at different points and later passed on retry ruled out deterministic research/audit diffs.

The remediated test waits for two animation frames, `_saveTimer === null`, then two more frames and a second null check before starting the session lifecycle. After deletion it uses the same boundary before asserting that the deleted key remains absent. This strengthens the assertion: absence is verified after all resulting work drains, not merely at a favorable instant.

## Remediation

### `scripts/browser-test-helpers.mjs`

- `commitDisclosureControl()` opens and settles the currently mounted disclosure, re-resolves its current control, validates visibility, and dispatches `input` plus `change` synchronously in the same browser task. Rendering cannot replace the control between resolution and commit.
- `pressDisclosureControl()` applies the same current-generation boundary to focus plus keyboard dispatch used by the Escape/focus-restoration contract.
- `focusDisclosureControl()` verifies focusability against the current mounted replacement rather than focusing one generation and inspecting its successor.
- `waitForWarRoomQuiescence()` drains request-animation-frame work and the explicit 400 ms autosave queue boundary twice. It does not cancel work or alter production state.

### Existing tests

- `scripts/test-command-bar.mjs` uses the atomic disclosure/control commit but retains all state-preservation, settings, mode, ESPN-guard, and pressure assertions.
- `scripts/test-layout-efficiency-behavior.mjs` uses atomic current-generation Escape dispatch and retains its exact close/focus postconditions.
- `scripts/test-wr-026-audit-remediation.mjs` uses the shared atomic commit for teams, slot, and rounds and retains its replacement-control visibility, value, and focus assertions.
- `scripts/test-browser.mjs` preserves the deleted-state `null` assertion and moves it after the queue-drain boundary. It also directly contains the already-effective Draft Management disclosure assertion previously injected by its wrapper.
- `scripts/run-test-browser.mjs` removes only the now-redundant runtime injection of that same disclosure assertion. Other historical compatibility transformations remain unchanged.

### CI

`.github/workflows/ci.yml` now executes five targeted repetitions of the persistence test and all three command-bar lifecycle suites before the existing phone and full-suite gates. This is a deterministic stress gate, not an automatic failure retry: any iteration fails the job immediately and visibly.

## Competing hypotheses

| Hypothesis | Disposition | Evidence |
|---|---|---|
| Research/audit-only files caused the browser failures | Ruled out | Failures occurred on unchanged executable surfaces; identical heads produced different failures/pass outcomes. |
| One common browser-context leaked across npm scripts | Ruled out | Each npm browser script launches its own browser process/context; failure coupling was within individual long-lived pages. |
| Test parallelism caused shared storage | Ruled out | Package scripts are chained sequentially; browser contexts use isolated temporary profiles. |
| CI is simply too slow and needs larger timeouts | Ruled out | The atomic helper initially failed in about 1.5 seconds with a current hidden generation; more time would not make that generation user-editable. |
| Command bar has an unsupported production edit flow | Ruled out for WR-044 | Existing WR-026 behavioral suites validate settings edits; the failure arose from the test spanning intentional replacement generations. |
| Deleted drafts are deterministically resurrected by production | Not supported | The failure was intermittent, production deletion cancels `_saveTimer`, and post-remediation absence is asserted only after all queues drain. |
| Service workers or cross-test origin persistence caused the issue | Ruled out as primary | Every script uses a new ephemeral browser profile/process. The decisive races were observable in DOM generation and in-page autosave timing. |

## Validation evidence

### Static/local

Commands completed before browser validation:

```text
node --check scripts/browser-test-helpers.mjs
node --check scripts/test-command-bar.mjs
node --check scripts/test-browser.mjs
node --check scripts/run-test-browser.mjs
npm run test:release
npm run test:modules
npm run test:syntax
npm run test:dataset
git diff --check
```

The local runner could not download the pinned Chromium archive because the CDN request timed out/returned 502, so browser evidence was obtained from repository-native GitHub Actions rather than fabricated locally.

### Repository-native browser runs

| Run | Head/purpose | Result |
|---|---|---|
| `34625305829` | First atomic-control hypothesis | FAIL; current replacement correctly reported hidden, proving visibility was tied to a stale generation. |
| `34625637031` | Stable-disclosure checkpoint | PASS complete suite, but later stress exposed an inter-operation gap. |
| `34626002986` | First five-repeat stress gate | FAIL on command-bar iteration 1; proved “open then edit” was still non-atomic. |
| `34626238479` | Atomic single-browser-task remediation + five-repeat gate | PASS: 5/5 persistence, 5/5 command bar, phone, full `npm test`, syntax, and resilience. |
| `34626824379` | First documentation head | Five-repeat persistence/primary command-bar gate passed; full suite exposed the same replacement-generation race in layout Escape focus/press, proving the helper had to cover adjacent command-bar suites. |
| `34627286054`, attempt 3 | Expanded command lifecycle stress | Passed three complete targeted iterations, then exposed a focus/inspection generation gap in the WR-026 replacement-control assertion; setting commits themselves passed. |

Final immutable-head run IDs and repeated full-suite attempts are recorded in PR #132 so recording them does not mutate the audited head.

## Assertion and scope proof

- No `src/**`, `public/**`, production JavaScript, rankings, recommendation policy, data, or research custody file changed.
- No assertion was deleted from the effective CI suite.
- The Draft Management disclosure assertion moved from runtime source injection into the test source itself.
- The deleted-session storage assertion remains exact equality to `null` and now runs after quiescence.
- No timeout was increased, no test skipped, no `continue-on-error` added, and no blanket retry added.
- The five-iteration stress step increases executed coverage and fails on the first bad iteration.

## Remaining boundary

WR-045 must independently inspect the helpers, confirm the effective assertion set, reproduce the stress/full-suite evidence, and decide whether this non-production remediation is acceptable. Work Helper does not self-certify it.
