# WR-100 — Independent Audit of V3.5 Protected Workflow Identity Integration

TASK ID: WR-100  
ROLE: Independent Auditor / QA  
CANONICAL WORKFLOW: V3.5  
EXECUTION MODE: STANDARD_CHAT_HIGH  
REFRESH MODE: FAST_REFRESH  
AUDIT TARGET: WR-099 — V3.5 Protected Workflow Identity Integration  
TARGET PR: #281  
TARGET BRANCH: `manager/wr-099-protected-workflow-identity-integration`  
EXACT FROZEN TARGET: `fd51d7ab40456182457fd19915baac8a88ae4468`  
CANONICAL MAIN VERIFIED: `1538f0c9af55c89f329c759d852647ff5c5bb2d4`  
AUDIT BRANCH START: `1538f0c9af55c89f329c759d852647ff5c5bb2d4`

## Final verdict

`FAIL — REMEDIATION REQUIRED`

Findings:

- CRITICAL: none
- HIGH: none
- MEDIUM: 1
- LOW: 1

No scoring authority was created or consumed. No protected scoring workflow was dispatched. No 2022–2025 target outcomes were inspected.

## 1. Exact target / scope / advancement

Live GitHub state was independently verified:

- canonical `main` exactly `1538f0c9af55c89f329c759d852647ff5c5bb2d4`;
- assigned WR-100 audit branch initially exactly that Manager checkpoint;
- PR #281 is OPEN and unmerged;
- PR #281 head exactly `fd51d7ab40456182457fd19915baac8a88ae4468`;
- target branch exactly `manager/wr-099-protected-workflow-identity-integration`;
- PR #281 changes exactly:
  - `scripts/workflow-manager-transition.mjs`;
  - `scripts/test-workflow-manager-transition.mjs`.

Current main advanced from the PR base only through Manager/shared control-plane files. It did not modify either WR-099 target script. The target therefore has no overlapping post-freeze executable movement.

## 2. Target CI independently verified

Exact frozen target Full War Room CI:

- run `35421600341` — SUCCESS;
- classify `105840218897` — SUCCESS;
- governance `105840233795` — SUCCESS;
- product/browser test `105840261827` — SUCCESS.

The governance log independently shows:

- syntax validation for both target scripts;
- `workflow Manager-transition regression: PASS`;
- canonical state/audit-readiness regressions PASS;
- retained-reader/custody regressions PASS.

The full test job ran `npm test` and completed successfully.

Canonical post-activation War Room CI:

- run `35422016391` — SUCCESS;
- classify `105841327610` — SUCCESS;
- governance `105841348134` — SUCCESS;
- bootstrap reuse skipped;
- product test skipped as expected for control-plane-only activation changes.

Passing CI was treated as evidence, not as proof of correctness.

## 3. Protected workflow identity derivation

The target introduces a closed mapping derived from normalized canonical `future_execution_authority.consumer_path`:

- `.ai/research/WR081_PROTECTED_SCORING_CONSUMER.py`
  -> `WR-083 Protected Historical Scoring Bridge`;
- `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER.py`
  -> `WR-097 Returning-Player v2.1 Protected Scoring Bridge`.

`expectedProtectedWorkflowName()` normalizes the authority first and throws for any consumer path outside that exact map.

This satisfies the required identity-family design. The plan/caller cannot directly supply an accepted workflow display name to choose the protected family.

## 4. Canonical repository / control-plane / run binding

The new live verifier independently derives repository identity from:

- `GITHUB_REPOSITORY` when present;
- the canonical local `origin` remote when available;
- and rejects disagreement when both are available.

A plan-level `repository` claim is accepted only when it exactly equals that canonical repository identity.

The control-plane head is derived locally from the commit that last wrote `.ai/shared/ACTIVE_TASKS.json`, rather than from a caller plan field.

For each authority-consumption claim, the live GitHub run is fetched from the canonical repository and checked for:

- exact workflow run ID;
- authority-derived protected workflow name;
- `workflow_dispatch`;
- head branch `main`;
- exact control-plane head;
- exact repository identity;
- completed state when a status value is present;
- conclusion `success`.

The verifier returns evidence rebound to:

- canonical authority SHA-256;
- canonical consumer path;
- canonical consumer SHA-256;
- canonical repository;
- canonical control-plane head.

Network failure, HTTP non-success, invalid JSON and unavailable/malformed authority context fail closed at the live-verification layer, except for the run-status defect in Finding M-01.

## 5. Receipt / terminal / publication / replay preservation

The WR-099 patch preserves the pre-existing authority-consumption controls and strengthens the verified-run cross-binding.

Independent code inspection confirms preservation of:

- canonical authority normalization and canonical JSON SHA-256 recomputation;
- publication head = next worker checkpoint;
- publication parent = exact authorized head;
- exact task / authority / branch / authorized head / consumer path / consumer digest receipt binding;
- exact receipt workflow run ID;
- receipt `execution_status === SUCCESS`;
- non-empty result terminal and decision status;
- publication payload SHA-256;
- terminal/result/decision cross-binding to the receipt;
- changed publication paths confined to `.ai/research/**`;
- one-publication-commit parent check;
- machine-owned task consumption receipt/history;
- global consumed-authority history;
- remove/re-add replay resistance;
- rejection of previously consumed authority;
- rejection of replacement of an existing unconsumed authority.

The legacy WR-083 path remains valid. The newly accepted WR-097 path is also structurally valid when all canonical evidence matches.

## 6. Adversarial test-quality review

The new tests materially exercise:

- wrong workflow name;
- WR-083 authority paired with WR-097 workflow;
- WR-097 authority paired with WR-083 workflow;
- unknown consumer family;
- wrong repository;
- caller repository substitution;
- wrong branch;
- wrong control-plane head;
- wrong run ID;
- failed run;
- cancelled run;
- in-progress run;
- wrong receipt consumer digest;
- fabricated receipt digest;
- authority/result cross-binding mismatch;
- workflow identity substitution through live fetch;
- live network failure;
- GitHub API non-success;
- legitimate WR-083 path;
- legitimate WR-097 path;
- replay after consumption;
- remove/re-add replay persistence;
- multi-commit publication-parent failure.

The suite is meaningful and is not merely a set of test names. However, it does not cover every required fail-closed edge; see Findings.

## 7. Findings

### MEDIUM M-01 — Missing/null workflow-run status is accepted as completed

**Requirement**

WR-100 requires the canonical live run to be bound to an exact completed/success state and requires malformed/unavailable run evidence to fail closed.

**Evidence**

In `verifyProtectedWorkflowRun()` at the frozen target:

```js
if (run.status != null && run.status !== 'completed') errors.push('workflow run is not completed');
if (run.conclusion !== 'success') errors.push('workflow run conclusion is not success');
...
status: run.status ?? 'completed',
```

This rejects explicit `queued` / `in_progress` states, but a run object with `status` omitted or null and `conclusion: 'success'` is accepted and then rewritten to `status: 'completed'`.

**Failure**

Malformed/incomplete live-run evidence is not strictly fail-closed. A missing required status field is upgraded into a positive completion assertion.

**Impact**

The production GitHub REST API normally supplies `status`, which limits practical exploitability. Nevertheless, this code is the protected authority-consumption gate, and the task explicitly requires malformed evidence and completion state to be proven rather than inferred. The implementation therefore does not fully satisfy the frozen WR-099 contract.

**Required remediation**

Require `run.status === 'completed'` exactly. Do not coerce null/undefined status to completed. Add direct regressions for:

- missing `status`;
- `status: null`;
- and retain the existing in-progress/cancelled/failure cases.

**Validation required**

Re-run the Manager-transition regression and Full War Room CI on a new immutable WR-099 remediation target, then route a fresh independent audit.

**Confidence:** high.

### LOW L-01 — Required adversarial regression coverage is incomplete

**Requirement**

WR-100 requires test quality review across the protected live-run and replay boundaries.

**Evidence**

The target test suite does not directly exercise several boundaries that the implementation does contain:

- wrong workflow event (for example `push` rather than `workflow_dispatch`);
- direct verified-run consumer-path mismatch;
- direct verified-run consumer-digest mismatch;
- replacement of an existing unconsumed authority.

The implementation contains explicit checks for these cases, and no bypass was identified by code inspection.

**Impact**

This is a regression-resilience gap rather than a demonstrated implementation bypass. It matters because these are protected control-plane invariants and future refactoring could weaken them without a focused test failing.

**Recommended remediation**

Add focused adversarial assertions for the four cases above while remediating M-01.

**Confidence:** high.

## 8. Required cases disposition

- wrong workflow name — PASS
- WR-083 authority + WR-097 workflow — PASS
- WR-097 authority + WR-083 workflow — PASS
- unknown consumer/workflow family — PASS
- wrong repository — PASS
- caller repository substitution — PASS
- wrong branch — PASS
- wrong workflow/control-plane head — PASS
- wrong workflow run ID — PASS
- failed workflow — PASS
- cancelled workflow — PASS
- in-progress workflow — PASS
- wrong consumer path — implementation PASS; focused regression coverage incomplete
- wrong consumer digest — implementation PASS; receipt path covered, direct verified-run mismatch not focused
- replayed authority — PASS
- fabricated receipt — PASS
- authority/result cross-binding mismatch — PASS
- workflow identity substitution — PASS
- canonical run unavailable — PASS
- GitHub API failure/non-success — PASS
- legitimate WR-083 path — PASS
- legitimate WR-097 path — PASS
- malformed live run missing/null status — FAIL (M-01)

## 9. Boundary verification

WR-100 audit performed no:

- modification of WR-099 implementation;
- modification of `.ai/shared/**`, `.ai/manager/**`, `.ai/research/**`, `.ai/work_helper/**`, `.github/**`, `scripts/**`, `src/**` or `public/**`;
- merge of PR #281;
- creation or consumption of scoring authority;
- protected scoring dispatch;
- inspection of 2022–2025 target outcomes.

Only Auditor-owned evidence is published from this lane.

## 10. Disposition / exact Manager action

WR-099 must not be merged at frozen SHA `fd51d7ab40456182457fd19915baac8a88ae4468`.

Manager should route a bounded WR-099 remediation that:

1. changes the live-run status check to require exact `status === 'completed'`;
2. removes the null-to-completed fallback;
3. adds the missing focused adversarial regressions described above;
4. runs direct Manager-transition/state regressions and Full War Room CI;
5. freezes a new immutable WR-099 remediation SHA;
6. reactivates a fresh WR-100 independent audit against that exact target.

No second canonical-main WR-097 NO-SCORING canary and no real scoring authority should be issued until the remediated integration receives a PASS-family independent verdict and is integrated exactly.

Final verdict: `FAIL — REMEDIATION REQUIRED`.
