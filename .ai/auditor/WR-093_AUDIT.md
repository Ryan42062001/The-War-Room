# WR-093 — Independent Re-Audit of Workflow V3.5 Remediation

TASK ID: WR-093  
ROLE: Independent Auditor / QA  
WORKFLOW AUTHORITY: canonical Workflow V3.4  
EXECUTION MODE: STANDARD_CHAT_HIGH  
REFRESH MODE: FAST_REFRESH  
AUDIT TARGET TASK: WR-091  
TARGET PR: #257  
TARGET BRANCH: `manager/wr-091-workflow-v35-automation`  
EXACT FROZEN TARGET: `638a8e2af25f1c806fe8883de0c959c5caaff35e`  
HISTORICAL FAILED TARGET: `def590788eb615d9322d5cc8ae3eef14e8c1bc25` — evidence only  
CANONICAL MAIN VERIFIED: `8710f7106b11166040ac4c0798f23ddba710d610`  
AUDIT BRANCH START: `c4d92e7dd0d557df17de211d83b274160a7799cf`

## Final verdict

`FAIL — REMEDIATION REQUIRED`

Findings:

- CRITICAL: none
- HIGH: 1
- MEDIUM: none
- LOW: none

The historical WR-092 FAIL was not carried forward automatically. WR-092-AUD-01 and WR-092-AUD-02 are independently closed on the new frozen target. WR-092-AUD-03 is materially improved for normal replay but is not fully closed because the new machine-owned replay history can still be erased or injected through ordinary remove/add task transitions.

Workflow V3.5 remains non-canonical.

## 1. Exact target / lane pinning

Live verification established:

- canonical `main` exactly `8710f7106b11166040ac4c0798f23ddba710d610`;
- assigned WR-093 branch initially exactly `c4d92e7dd0d557df17de211d83b274160a7799cf`;
- initial audit branch is one commit behind main with zero file differences;
- target branch exactly `638a8e2af25f1c806fe8883de0c959c5caaff35e`;
- PR #257 OPEN, unmerged, exact head `638a8e2af25f1c806fe8883de0c959c5caaff35e`;
- active registry binds WR-093 to WR-091 / PR #257 / exact branch / exact SHA;
- current main still says Workflow V3.4 is ACTIVE/CANONICAL.

The audit did not follow later target movement.

## 2. Exact PR #257 scope

PR #257 currently changes exactly 12 files:

- `.ai/manager/WR091_WORKFLOW_V3_5_CANDIDATE.md`
- `.ai/shared/WORKFLOW.md`
- `.github/workflows/ci.yml`
- `.github/workflows/wr083-protected-historical-scoring-bridge.yml`
- `scripts/custody/test_wr083_protected_historical_scoring.py`
- `scripts/custody/wr083_protected_historical_scoring.py`
- `scripts/test-workflow-ci-classify.mjs`
- `scripts/test-workflow-manager-transition.mjs`
- `scripts/test-workflow-result-freeze-check.mjs`
- `scripts/workflow-ci-classify.mjs`
- `scripts/workflow-manager-transition.mjs`
- `scripts/workflow-result-freeze-check.mjs`

No `.ai/auditor/**`, `.ai/research/**`, `.ai/work_helper/**`, `src/**`, or `public/**` paths are changed.

No product/model/ranking/recommendation semantics changed.

## 3. WR-092-AUD-01 — CLOSED

### Unique Auditor target derivation

The remediated `autoPopulateAuditorPins()` always computes the complete candidate set before accepting an explicit target.

It now rejects candidate counts other than exactly one and then validates the frozen target's exact PR/branch/checkpoint SHA.

Independent adversarial reproduction against the frozen logic:

| Case | Result |
| --- | --- |
| explicit target WR-910 + current blocker WR-911 | FAIL CLOSED — 2 candidates |
| explicit current WR-910 + prior recorded target WR-911 | FAIL CLOSED — 2 candidates |
| two blocked upstream targets | FAIL CLOSED — 2 candidates |
| frozen upstream missing PR | FAIL CLOSED — incomplete PR/branch/SHA |
| explicit PR mismatch | FAIL CLOSED |
| explicit branch mismatch | FAIL CLOSED |
| explicit SHA mismatch | FAIL CLOSED |
| one clean frozen upstream | PASS — task/PR/branch/SHA auto-populated exactly |

Clean auto-population independently produced:

- task `WR-910`
- PR `10`
- branch `a`
- SHA `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`

No blocking issue remains for AUD-01.

## 4. WR-092-AUD-02 — CLOSED

### Canonical authority binding

The Manager-transition verifier now normalizes the prior canonical `future_execution_authority` from the registry and recomputes its SHA-256 over exactly:

- branch
- head SHA
- consumer path
- consumer SHA-256

The caller no longer supplies the authoritative digest.

### Repository-bound receipt / terminal evidence

`verifyCommittedAuthorityConsumption()` now:

- requires a repository evidence reader;
- requires claimed publication head = next worker checkpoint;
- resolves the actual publication parent from Git;
- requires parent = authorized head;
- loads the receipt from the exact publication commit;
- recomputes committed receipt SHA-256;
- validates receipt task, authority digest, branch, head, consumer path/digest;
- requires receipt schema and one-publication-commit flag;
- requires execution status SUCCESS;
- requires nonempty workflow run ID, result terminal, decision status;
- requires a valid publication payload SHA-256;
- loads committed terminal-result summary from the same publication commit;
- cross-checks terminal execution/result/decision + authority/head/consumer identity;
- enumerates actual files changed by the publication commit;
- requires receipt and terminal evidence to be present;
- requires all publication paths under `.ai/research/**`;
- recomputes the publication payload SHA-256 from actual committed bytes.

### Live protected-workflow verification

Before transition evaluation, the CLI independently queries GitHub Actions for each consumption claim.

It requires:

- exact requested run ID;
- workflow name `WR-083 Protected Historical Scoring Bridge`;
- event `workflow_dispatch`;
- `head_branch=main`;
- conclusion `success`.

Network/API failure throws and aborts the transition rather than consuming authority.

### Required adversaries

The frozen logic now fails closed for:

- arbitrary receipt SHA;
- wrong canonical authority digest/content;
- missing receipt in publication commit;
- wrong receipt task/branch/head/consumer content;
- wrong publication parent;
- multi-commit advancement;
- missing/failed/noncanonical protected run verification;
- wrong branch/consumer identity;
- terminal execution/result/decision mismatch;
- malformed terminal evidence;
- publication payload mismatch.

The result-freeze verifier is also strengthened: optional authority-consumption verification requires a full authority contract, recomputes canonical authority digest, verifies receipt + terminal entries are manifest-bound, verifies publication parent, workflow run ID, terminal/result status, and publication payload digest.

No blocking issue remains for AUD-02 itself.

## 5. WR-092-AUD-03 — NOT FULLY CLOSED

### What is fixed

Normal replay with intact machine-owned history now fails closed.

After successful consumption, the helper records:

- `authority_consumption_receipt`
- `consumed_authority_sha256s`

The consumed authority digest is recomputed from the canonical four-field authority tuple.

When prior history is intact:

- re-adding the same authority digest fails;
- same branch/head/consumer tuple fails;
- the same authority digest after active authority deletion fails;
- a genuinely different future authority digest is allowed.

This closes the original one-step replay defect.

### Residual bypass: machine-owned history can be erased through remove/add

WR-093 explicitly requires machine-owned receipt/history fields to be non-insertable, non-overwritable, and non-removable through ordinary transition-plan fields.

The implementation protects these fields only in `update_tasks`:

- setting `authority_consumption_receipt` is rejected;
- setting `consumed_authority_sha256s` is rejected;
- unsetting either field is rejected.

But `add_tasks` has no equivalent protected-field check.

The transition ordering is:

1. apply `remove_tasks`;
2. apply `add_tasks`;
3. protect only `update_tasks`.

Therefore an ordinary plan can remove an existing task and re-add the same task ID without the machine-owned receipt/history fields. `validateTaskShape()` does not require or preserve those fields, and `workflow-state-check.mjs` contains no enforcement for them.

### Independent adversarial reproduction

Starting state:

- task contains a prior verified `authority_consumption_receipt`;
- `consumed_authority_sha256s` contains the consumed authority identity;
- no active `future_execution_authority`.

Transition A:

- `remove_tasks: ["WR-906"]`
- `add_tasks`: re-add valid WR-906 without receipt/history.

Result:

- no protected-field error applies to the add path;
- re-added task is shape-valid;
- machine-owned consumption history is gone.

Transition B:

- ordinary update re-adds the identical previously consumed `future_execution_authority`.

Result:

- previous state now has no receipt/history;
- consumed set is empty;
- replay check returns no error;
- previously consumed authority is accepted.

Direct insertion is also possible on a newly added task because `add_tasks` does not reject the machine-owned fields.

### Severity / impact

HIGH.

This is a durable replay-state integrity bypass. The normal replay check is correct only while history is preserved, but the same transition helper allows ordinary plan operations to erase the history that the replay check depends on.

This directly violates the WR-093 acceptance requirement:

> machine-owned receipt/history fields cannot be directly inserted, overwritten, or removed by ordinary transition-plan fields.

It also means AUD-03 cannot be considered closed.

### Required remediation

At minimum:

1. reject `authority_consumption_receipt` and `consumed_authority_sha256s` in every `add_tasks` entry;
2. prevent remove+re-add of the same task ID from silently discarding machine-owned history;
3. either:
   - disallow same-plan remove/re-add for any task with machine-owned authority history, or
   - carry verified machine-owned history forward automatically;
4. ensure ordinary task removal semantics cannot be used as a replay-history reset if the same task identity returns;
5. add adversarial regressions for:
   - direct protected-field injection through `add_tasks`;
   - remove+re-add same task without history;
   - replay in the subsequent transition after history erasure;
   - legitimate closure/removal behavior if task removal is intentionally supported.

## 6. Preservation — result-freeze core

Preserved and strengthened.

The result-freeze verifier still checks:

- live PR identity;
- exact PR head;
- target branch;
- authorized path scope;
- report SHA-256;
- evidence-manifest SHA-256;
- protected evidence Git blob identity;
- protected evidence SHA-256;
- byte size;
- protected workflow identity/conclusion;
- exact-head CI identity/conclusion;
- deterministic packet generation;
- distinct LIVE_UNAVAILABLE versus contradiction behavior.

Authority-consumption verification is stricter than the historical failed target.

## 7. Preservation — Upgrade 3 bootstrap CI reuse

Preserved byte-identically from the historical candidate:

- `scripts/workflow-ci-classify.mjs` blob unchanged;
- classifier tests unchanged;
- `.github/workflows/ci.yml` unchanged.

Reuse remains limited to:

- push event;
- all-zero branch-creation before SHA;
- exact identical head SHA;
- existing successful `War Room CI` run.

Lookup uncertainty/no proof falls upward to FULL CI.

No regression found.

## 8. Preservation — Upgrades 4 and 5 / protected bridge

Protected bridge workflow, implementation, and regression test blobs are byte-identical to the historical candidate that WR-092 found sound for these portions.

Preserved:

- no manual branch/head/consumer identity workflow-dispatch inputs;
- canonical Manager `future_execution_authority`;
- independent authority revalidation;
- live head checks before retained retrieval and before consumer exposure;
- exact checkout + consumer digest;
- provider credential isolation;
- `env -i` consumer execution;
- retained raw bytes under RUNNER_TEMP;
- retained-source digest/byte publication rejection;
- prediction-lock-before-target exposure;
- race protections before commit/push;
- terminal `execution_status` / `result_terminal` / `decision_status`;
- required stage-gate status label;
- authority receipt generation;
- release workflow guard.

No regression found.

## 9. Exact-head validation

All supplied runs are attached to exact target `638a8e2af25f1c806fe8883de0c959c5caaff35e`.

### Full War Room CI

Run `35408373771` — SUCCESS

- classify `105802762153` — SUCCESS
- governance `105802782895` — SUCCESS
- bootstrap reuse `105802784168` — SKIPPED
- full test `105802812745` — SUCCESS

Governance explicitly ran:

- workflow helper syntax;
- collision regression;
- lane identity regression;
- audit readiness regression;
- Manager-transition regression;
- result-freeze regression;
- CI classifier regression;
- canonical active-task state;
- custody / WR-063 / WR-069 boundaries.

### Protected / custody boundaries

- WR-083 run `35408373770` — SUCCESS
  - preflight `105802762435` — SUCCESS
  - protected execution lanes skipped on PR context
- WR-069 run `35408373783` — SUCCESS
  - contract preflight `105802764932` — SUCCESS
- WR-046 run `35408373793` — SUCCESS
  - contract preflight `105802762499` — SUCCESS

Green CI does not close the remove/add machine-history bypass because the frozen regression suite tests protected fields only through `update_tasks`, not `add_tasks` / remove+re-add.

## 10. V3.4 / governance preservation

Canonical main remains Workflow V3.4.

The candidate branch itself still labels V3.5 as candidate/not canonical until fresh independent audit + post-merge canary.

Preserved:

- exact-head controls;
- live-state verification;
- lane collision controls;
- independent audit;
- Manager merge authority;
- post-merge canary requirement.

No product/model/ranking/recommendation semantics changed.

## 11. Auditor boundary

The Auditor:

- did not modify or merge PR #257;
- did not make Workflow V3.5 canonical;
- did not modify workflows/scripts/Manager/shared/research/product/provider state;
- wrote only `.ai/auditor/**`.

## 12. Manager disposition

Do not merge exact target `638a8e2af25f1c806fe8883de0c959c5caaff35e`.

Route one bounded WR-091 remediation for the residual AUD-03 history-integrity bypass:

- protect machine-owned receipt/history fields across add/remove paths;
- preserve or fail closed on remove+re-add of a consumed task;
- add explicit two-transition replay regression;
- rerun exact-head Full War Room CI and required protected/boundary regressions;
- freeze a new immutable target;
- route a fresh independent re-audit.

Final verdict: `FAIL — REMEDIATION REQUIRED`.
