# WR-045 — Independent Audit of Browser-CI Determinism Remediation

TASK ID: WR-045  
ROLE: Independent Auditor / QA  
STATUS: COMPLETE — PASS  
DATE: 2026-09-11  
AUDITED PR: #132  
AUDITED IMMUTABLE HEAD: `e750748d938ed6bb8284eeec1cfda9eea77997ac`  
CANONICAL MAIN / AUDIT BASELINE: `2ec3ecb1e387f5bfdd52efe712cf575a9d5d9f85`  
AUDIT BRANCH: `wr-045-browser-ci-audit`

## Final verdict

`PASS`

The WR-044 remediation is supported by the repository, original failure evidence, intermediate discriminating RED checkpoints, final implementation, and repeated exact-head validation. The fixes address concrete browser-test lifecycle races rather than weakening assertions or merely increasing the probability of green execution.

No CRITICAL, HIGH, MEDIUM, or LOW finding is open from this audit.

## Audit scope and independence

This audit used a Full Refresh under the canonical workflow because WR-044 changes repository-wide CI validation trust and therefore affects unrelated merge gates.

The audit independently inspected:

- canonical workflow, state, roadmap, Auditor role, WR-045 assignment, and Manager handoff;
- the prior Auditor WR-040 browser-CI finding that motivated WR-044;
- `.ai/work_helper/WR-044_DIAGNOSIS.md` and Work Helper handoff as claims to challenge, not authority;
- PR #132 metadata, exact changed-file list, and the relevant patches;
- unchanged production lifecycle code necessary to test the claimed root causes;
- original RED CI evidence from run `34613965662`;
- intermediate RED/GREEN WR-044 evidence, including stress run `34626002986`;
- final exact-head CI run `34632427369`, including all three successful executions on the immutable WR-044 head.

No model fitting, scoring, ranking, source-custody work, production implementation changes, or unrelated remediation was performed by the Auditor.

## Immutable target and target advancement

PR #132 was audited only at:

`e750748d938ed6bb8284eeec1cfda9eea77997ac`

The PR's original base was `142a9580fb408cd78ddae1026a67dd82f7d7b144`. Canonical `main` advanced to `2ec3ecb1e387f5bfdd52efe712cf575a9d5d9f85` only through three control-plane commits. Independent compare showed the advancement changes only:

- `.ai/manager/HANDOFF.md`;
- `.ai/manager/WR-045.md`;
- `.ai/shared/ACTIVE_TASKS.json`;
- `.ai/shared/PROJECT_STATE.md`;
- `.ai/shared/ROADMAP.md`.

There is no overlap with PR #132's browser-test implementation, production files, football-model research, frozen artifacts, or Returning-Player v2 source-custody surfaces. This is `CONTROL_PLANE_ONLY` target advancement and does not invalidate the audited implementation evidence.

## Exact PR #132 scope

PR #132 changes exactly 11 files:

1. `.ai/work_helper/HANDOFF.md`
2. `.ai/work_helper/TROUBLESHOOTING_LOG.md`
3. `.ai/work_helper/WR-044_DIAGNOSIS.md`
4. `.github/workflows/ci.yml`
5. `scripts/browser-test-helpers.mjs`
6. `scripts/run-test-browser.mjs`
7. `scripts/test-browser.mjs`
8. `scripts/test-command-bar.mjs`
9. `scripts/test-layout-efficiency-behavior.mjs`
10. `scripts/test-resilience.mjs`
11. `scripts/test-wr-026-audit-remediation.mjs`

No user-facing production module, stylesheet, HTML surface, extension production code, player data, ranking/scoring/recommendation implementation, `.ai/research/**`, WR-042/WR-046 source-custody artifact, or football-model frozen artifact is modified.

## Original failure class 1 — command-bar DOM replacement generation race

### Requirement

The browser test must interact with the current visible command-bar setting control even when the command bar intentionally replaces its descendants during state updates. Validation must not rely on a stale element generation surviving multiple Playwright actions.

### Independent evidence

WR-039 CI run `34613965662`, attempt 1, failed in unchanged `test-command-bar` after earlier checks passed. Playwright located `[data-command-setting="slot"]`, began `fill`, observed the element detach from the DOM, re-resolved a replacement element, and then waited on that replacement because it remained hidden until timeout.

Independent inspection of unchanged production code confirms this failure mode is structurally plausible: `renderDraftCommandBar()` replaces command-bar descendants, and scheduled command refresh work can run on animation frames. A locator sequence split across multiple asynchronous browser operations can therefore cross generations.

The WR-044 chronology also contains discriminating intermediate RED evidence. In particular, run `34626002986` failed immediately in the new determinism stress gate because an earlier helper still resolved a hidden replacement generation. Its `commitRerenderingControl` result was `{ committed: false, reason: 'not-visible' }` when the test expected the setting change to commit. This demonstrates that simply adding a helper or retrying the workflow was not sufficient; the interaction boundary itself still needed correction.

### Final remediation assessment

`scripts/browser-test-helpers.mjs` now provides `commitDisclosureControl()`, which runs the relevant edit in one browser task. Within that task it:

- opens/re-resolves the current disclosure generation;
- re-resolves the current control;
- requires the disclosure to be open;
- requires the control to be present and visibly rendered;
- sets the value and dispatches the expected input/change events without yielding between element generation and commit;
- fails after a bounded 20-frame search if no valid current generation appears.

`test-command-bar.mjs` and the WR-026 remediation test now use this generation-safe helper. Existing semantic postconditions remain: the command mode changes as expected, canonical draft settings reflect the requested value, and replacement controls remain reachable/focusable.

This is a cause-level fix. It removes the invalid assumption that a replaced DOM descendant remains the same object across multiple asynchronous locator operations. It does not hide a detached element, catch-and-ignore a Playwright error, lengthen the locator timeout, or retry the whole test until green.

**Verdict: PASS.**

## Original failure class 2 — pending autosave/render work crossing persistence assertions

### Requirement

Persistence deletion assertions must observe settled application state. A prior debounced save or render task from the deliberately long-lived browser page must not cross the create/delete scenario boundary and repopulate a key after deletion. The test must retain the exact absence assertion after quiescence.

### Independent evidence

WR-039 CI run `34613965662`, attempt 2, again passed phone validation and 164/164 extension tests before later failing unchanged `test:browser`. The failing assertion expected:

`localStorage.getItem('draft-state-v1:' + deletedSessionId) === null`

but observed a valid persisted War Room draft-state JSON object.

The failure signature is consistent with an in-flight save crossing a scenario boundary, not with an assertion typo or corrupt storage object. Independent inspection confirms the app maintains debounced save work through `_saveTimer`, while the original browser harness reused one page across many earlier state/render/recommendation scenarios and did not explicitly drain that lifecycle before and after session deletion.

### Final remediation assessment

`waitForWarRoomQuiescence(page)` now establishes an explicit lifecycle boundary by:

- yielding two animation frames;
- waiting until `_saveTimer` is null/undefined;
- yielding another two animation frames;
- checking the save timer is still drained.

`test-browser.mjs` calls this before entering the session-management scenario and again after deletion/confirmation before asserting persisted-key absence.

Critically, the exact `null` assertion remains. The helper does not cancel the save timer, clear storage to manufacture success, skip a save callback, or replace the assertion with eventual non-null tolerance. It waits for actual application work to drain and then checks the original invariant.

The Draft Management disclosure precondition that `run-test-browser.mjs` previously injected dynamically is now present directly in `test-browser.mjs`; `run-test-browser.mjs` merely removes the now-redundant source transformation. This is assertion relocation, not deletion.

**Verdict: PASS.**

## Adjacent lifecycle/readiness remediation

The WR-044 chronology exposed additional races only after earlier blockers were repaired. Independent patch review supports the final fixes:

### Layout Escape/focus generation boundary

`test-layout-efficiency-behavior.mjs` now uses a bounded same-browser-task key dispatch against the current disclosure/control generation. The production Escape handler was independently inspected: it depends on the Escape key and disclosure-open state, not on `event.isTrusted`. The test still verifies the disclosure closes and focus returns to the setup summary.

### WR-026 replacement-control focus

`test-wr-026-audit-remediation.mjs` re-resolves and focuses the current replacement control through `focusDisclosureControl()` and requires `document.activeElement` to be that current control. It retains a real `page.keyboard.press('Escape')` later in the scenario, preserving end-user keyboard-path coverage.

### Recovery control readiness and visibility

`test-resilience.mjs` no longer treats broad layout readiness as equivalent to the maintenance control being actionable. It repeatedly re-resolves the current Draft Management generation, opens it, re-resolves the maintenance button, checks actual CSS/geometry visibility, clicks the visible current control, strictly asserts success, and waits for the recovery dialog to be open.

### Off-screen layout readiness

The layout behavior test now proves the command bar is actually off-screen before testing urgent reveal rather than assuming a prior scroll operation has completed presentation work.

### Diagnostic XSS fixture lifecycle

The browser test now injects the malicious diagnostic fixture immediately before the diagnostic display assertion, preventing startup autosave from legitimately replacing the fixture before the assertion executes. The security assertion itself remains in force.

These changes make test preconditions explicit and generation-aware. They do not make the assertions less demanding.

**Verdict: PASS.**

## Test ordering, browser state, and shared-state boundaries

The remediation does not introduce process-wide state reuse between independent browser test invocations. Each test command continues to construct its own browser/context/page lifecycle. Within the intentionally long-lived `test:browser` scenario, WR-044 adds explicit quiescence boundaries where earlier asynchronous work could contaminate the next lifecycle assertion.

The new CI stress step executes the repaired failure classes repeatedly as separate npm test processes. Because GitHub Actions uses fail-fast shell execution, any failed iteration stops the step rather than being ignored.

No evidence was found of storage cleanup that simply erases the state under test. The key persistence invariant is verified after application work drains.

**Verdict: PASS.**

## Assertion and coverage integrity

Independent diff review found no meaningful removal, skip, softening, masking, or conversion of a strict assertion into a permissive result.

Specifically:

- the deleted-session storage assertion remains strict `=== null`;
- command-bar canonical setting/mode assertions remain;
- disclosure-close and focus-restoration assertions remain;
- recovery dialog/open and visibility requirements are stricter, not weaker;
- WR-026 focus semantics remain and a real keyboard Escape path remains;
- the Draft Management open assertion moved from runtime source injection into checked-in `test-browser.mjs`;
- the diagnostic XSS assertion remains, with fixture timing stabilized;
- normal `npm test` remains intact and is still run after the added stress gate.

No `.skip`, `test.skip`, ignored rejection, assertion deletion, `continue-on-error`, blanket catch-and-pass behavior, or equivalent masking mechanism was introduced in the audited patch.

**Assertions/coverage intact: YES.**

## Retry, timeout, and masking audit

No blanket application/test retry mechanism is used as the primary fix.

The CI workflow adds deterministic stress loops:

- 5 repetitions of `test:browser`, `test:command-bar`, `test:layout-efficiency-behavior`, and `test:wr026-audit-remediation`;
- 3 repetitions of `test-resilience.mjs` after normal validation.

These loops are coverage amplification, not retries: every iteration is required to pass and the shell exits on the first failure.

No `continue-on-error` was added. No material Playwright/global timeout increase was used to bury the original failures. The new helper loops are bounded to short animation-frame stabilization windows and fail if the required current/visible/focusable generation never appears.

**Verdict: PASS.**

## Exact-head CI verification

War Room CI run `34632427369` was independently inspected. All three workflow executions/attempts were on exact WR-044 head:

`e750748d938ed6bb8284eeec1cfda9eea77997ac`

### Attempt 1

Job `103372223763`: SUCCESS.

- determinism stress gate: SUCCESS;
- phone validation: SUCCESS;
- full `npm test`: SUCCESS;
- resilience syntax: SUCCESS;
- backup/offline recovery stress: SUCCESS.

### Attempt 2

Job `103373944649`: SUCCESS on the same immutable head, with the same major validation surfaces successful.

### Attempt 3

Job `103375617982`: SUCCESS on the same immutable head.

Raw logs confirm the determinism stress gate ran all five iterations. Every iteration passed:

- persistence/browser lifecycle;
- command-bar lifecycle;
- layout-efficiency behavior;
- WR-026 audit remediation.

The later normal `npm test` also remained active. Among the evidence independently observed:

- extension unit tests: 164 passed, 0 failed, 0 skipped;
- browser suite: all reported draft/turn/explanation/sanity/threshold/roadmap/ESPN checks passed;
- responsive/layout and phone checks passed;
- draft invariant torture harness passed;
- persistence/recovery integration torture harness passed;
- recovery failure-injection checks passed;
- resilience syntax passed;
- three consecutive backup/offline recovery lifecycle iterations passed.

The three green executions are supporting evidence, not the sole basis for this verdict. The implementation and assertion-integrity audit above independently establish that validation was not weakened to obtain them.

**Exact-head CI disposition: PASS.**

## Production and research/custody preservation

### Production/user-facing behavior

No production/user-facing implementation file is changed by PR #132. Broad exact-head regression tests also remained enabled and passed.

**Production behavior changed by audited work: NO.**

### Returning-Player v2 source custody

No WR-042/WR-046 source-custody artifact or `.ai/research/**` file is changed by PR #132.

**WR-042 / WR-046 source-custody work altered: NO.**

### Football-model research and frozen artifacts

No football-model research artifact, frozen research contract, source-custody manifest, ranking authority, scoring implementation, or player-data authority is changed by PR #132.

**Football-model research/frozen artifacts altered: NO.**

## Findings by severity

- CRITICAL — none.
- HIGH — none.
- MEDIUM — none.
- LOW — none.

The prior WR-040 non-blocking browser-CI instability finding is resolved for the audited failure classes at immutable head `e750748d938ed6bb8284eeec1cfda9eea77997ac`.

## Recommended Manager action

Manager / Architect may treat WR-045 as a PASS for the exact audited PR #132 implementation head `e750748d938ed6bb8284eeec1cfda9eea77997ac`.

Before merge/reconciliation, Manager should verify PR #132 still identifies that exact audited implementation. Current-main advancement to `2ec3ecb1e387f5bfdd52efe712cf575a9d5d9f85` is control-plane-only and does not overlap the audited implementation. If reconciliation changes the implementation head or browser-test content, Workflow V3 target-advancement rules apply and the changed target must receive the validation appropriate to that change.

Auditor does not merge PR #132.

After WR-044/WR-045 is reconciled under the normal Manager gate, Manager may resume the paused WR-046 source-custody work under its own independent requirements. WR-045 does not authorize or modify that research work.

## Audit integrity

Auditor modified PR #132: NO  
Auditor merged PR #132: NO  
Auditor changed production files: NO  
Auditor changed `.ai/shared/**`: NO  
Auditor changed `.ai/research/**`: NO  
Auditor writes for WR-045 are restricted to `.ai/auditor/**`.
