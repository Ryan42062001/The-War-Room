# WR-092 — Independent Audit of Workflow V3.5 Automation Hardening

TASK ID: WR-092  
ROLE: Independent Auditor / QA  
WORKFLOW AUTHORITY DURING AUDIT: V3.4  
EXECUTION MODE: STANDARD_CHAT_HIGH  
REFRESH MODE: FAST_REFRESH  
AUDIT TARGET TASK: WR-091  
AUDIT TARGET PR: #257  
AUDIT TARGET BRANCH: `manager/wr-091-workflow-v35-automation`  
EXACT FROZEN TARGET: `def590788eb615d9322d5cc8ae3eef14e8c1bc25`  
IMPLEMENTATION BASE: `31a36e00d760f2533438878944754efbe3752d34`  
CANONICAL MAIN VERIFIED AT AUDIT START: `38132ffb858d1ba410bd39db66a1d9c67aa677ca`  
ASSIGNED AUDIT BRANCH START: `38cb9b8382fc5f96a34dadb53eb523675e225370`

## Final verdict

`FAIL — REMEDIATION REQUIRED`

Findings:

- CRITICAL: none.
- HIGH: 3.
- MEDIUM: none.
- LOW: none.

V3.5 remains candidate-only and must not become canonical from this target.

## 1. Exact-target and live-state pinning

Independent live verification established:

- canonical `main` exactly matched `38132ffb858d1ba410bd39db66a1d9c67aa677ca` at audit start;
- assigned Auditor branch exactly matched expected head `38cb9b8382fc5f96a34dadb53eb523675e225370`;
- WR-091 target branch exactly matched frozen target `def590788eb615d9322d5cc8ae3eef14e8c1bc25`;
- PR #257 was OPEN, unmerged, and still pointed to exact frozen target `def590788eb615d9322d5cc8ae3eef14e8c1bc25`;
- canonical `.ai/shared/ACTIVE_TASKS.json` bound WR-092 to task WR-091 / PR #257 / target branch / exact target SHA above;
- V3.4 remained canonical while V3.5 wording on the target branch explicitly remained candidate-only.

The audit did not follow later target movement.

## 2. Exact WR-091 target scope

Comparison from implementation base `31a36e00d760f2533438878944754efbe3752d34` to frozen target `def590788eb615d9322d5cc8ae3eef14e8c1bc25` is two commits ahead and exactly 13 files:

1. `.ai/manager/WR-091.md`
2. `.ai/manager/WR091_WORKFLOW_V3_5_CANDIDATE.md`
3. `.ai/shared/WORKFLOW.md`
4. `.github/workflows/ci.yml`
5. `.github/workflows/wr083-protected-historical-scoring-bridge.yml`
6. `scripts/custody/test_wr083_protected_historical_scoring.py`
7. `scripts/custody/wr083_protected_historical_scoring.py`
8. `scripts/test-workflow-ci-classify.mjs`
9. `scripts/test-workflow-manager-transition.mjs`
10. `scripts/test-workflow-result-freeze-check.mjs`
11. `scripts/workflow-ci-classify.mjs`
12. `scripts/workflow-manager-transition.mjs`
13. `scripts/workflow-result-freeze-check.mjs`

No target changes exist under:

- `.ai/auditor/**`;
- `.ai/research/**`;
- `.ai/work_helper/**`;
- `src/**`;
- `public/**`.

No model, ranking, recommendation, season-total composition, or production code changed.

The protected bridge Python comparison shows 39 pre-existing functions unchanged. Changes are limited to future-authority loading/validation, future execution orchestration, terminal/receipt generation, receipt validation, and CLI routing. No accepted custody/provider/publication primitive was removed.

## 3. WR-092-AUD-01 — HIGH — Explicit Auditor target can mask contradictory upstream target state

### Requirement

Upgrade 1 requires active Auditor activation to derive the exact audit target from exactly one unambiguous frozen upstream target. Malformed, incomplete, ambiguous, non-frozen, or contradictory target state must fail closed. Explicit caller-provided pins must not override contradictory authoritative state.

### Frozen implementation

`autoPopulateAuditorPins()` creates a candidate set from:

- current `audit_target_task`;
- prior `audit_target_task`;
- prior `blocked_on_tasks`;
- current `blocked_on_tasks`.

However, candidate-count validation is executed only when `task.audit_target_task` is absent:

```js
if (!task.audit_target_task) {
  if (candidates.length !== 1) {
    errors.push(...);
    continue;
  }
  task.audit_target_task = candidates[0];
}
```

If an explicit `audit_target_task` already exists, the function skips the ambiguity test and simply treats that selected task as authoritative.

### Independent adversarial reproduction

Constructed active state:

- `WR-901`: frozen `AUDIT_READY` target A;
- `WR-902`: frozen `AUDIT_READY` target B;
- Auditor `WR-903`: `audit_target_task="WR-901"` while `blocked_on_tasks=["WR-902"]`.

This produces two contradictory candidate upstreams: WR-901 and WR-902.

Exact frozen decision logic returned:

- errors: `[]`;
- selected target: WR-901;
- auto-populated PR/branch/SHA from WR-901.

The contradictory WR-902 upstream was silently ignored.

### Impact

A caller-provided target task can suppress an otherwise ambiguous or contradictory activation state. The helper can therefore produce a mechanically valid exact PR/branch/SHA tuple for the wrong upstream target rather than failing closed.

This violates the core Upgrade 1 safety requirement and exact audit-target integrity.

### Required remediation

At minimum:

1. always compute the complete candidate upstream set before accepting an explicit target;
2. require exactly one candidate for active Auditor activation;
3. if `audit_target_task` is explicitly supplied, require it to equal that unique candidate;
4. reject disagreement with prior target metadata or current/prior blocker-derived upstream state;
5. add negative regressions for:
   - explicit target + different current blocker target;
   - explicit target + different prior audit target;
   - multiple upstream blocker targets;
   - incomplete frozen target;
   - explicit PR/branch/SHA mismatch.

## 4. Upgrade 2 — Result-freeze verifier

Core freeze verification is materially sound:

- contract schema, task ID, exact target SHA, protected evidence SHA, PR and scope inputs are validated;
- live PR number/head/branch are checked;
- every changed PR path must be under the authorized prefix set;
- report SHA-256 is recomputed from exact target bytes;
- manifest SHA-256 is recomputed;
- manifest JSON is parsed;
- each protected evidence entry is loaded from the exact protected-evidence commit;
- Git blob SHA-1, SHA-256, and byte size are independently recomputed;
- protected workflow run ID/conclusion and optional name/event are checked;
- exact-head CI run ID/head SHA/conclusion and optional name are checked;
- freeze packet ordering is canonicalized before packet SHA-256;
- GitHub/API failure throws a distinct `LiveUnavailableError`, with CLI exit code 3 versus contradiction exit code 2;
- helper has no merge, commit, push, or Auditor-verdict authority.

Deterministic packet generation is directly regression-tested.

However, optional authority-consumption verification is not sufficient on its own and is part of WR-092-AUD-02 below.

## 5. Upgrade 3 — Branch-bootstrap CI deduplication

Independent code and live-run inspection support this upgrade.

`classifyScope()` permits `BOOTSTRAP_REUSE` only when:

- event is `push`;
- push-before matches the all-zero 40-character SHA;
- a head SHA exists;
- prior lookup returns a successful run;
- prior run head SHA exactly equals the current head;
- prior run conclusion is `success`.

`findPriorSuccessfulRun()` additionally filters to:

- run name exactly `War Room CI`;
- exact identical `head_sha`;
- conclusion exactly `success`;
- excludes the current run ID.

If lookup fails, `diffFailed` is set and classification becomes `FULL` with `skip_governance=false`.

If no reusable run exists, bootstrap creation becomes `FULL`.

Ordinary pushes and pull requests use the normal diff classifier. Non-`.ai/**` content is FULL. PR code/workflow changes therefore do not enter bootstrap reuse.

### Live canary

Run `35406347330` independently confirms:

- `PUSH_BEFORE=0000000000000000000000000000000000000000`;
- `PUSH_HEAD=def590788eb615d9322d5cc8ae3eef14e8c1bc25`;
- scope `BOOTSTRAP_REUSE`;
- reused run ID `35405857026`;
- bootstrap-reuse job `105796811247` SUCCESS;
- Governance `105796812368` SKIPPED;
- full test `105796812774` SKIPPED.

The reused SHA was exactly the already Full-CI-green WR-091 target.

Exact target Full CI run `35405857026` independently shows the ordinary push before-SHA `9700a96c94a0608f5ab15de6715c7e236902d24a`, head `def590...`, scope `FULL`, and no reuse.

No blocking finding was found in Upgrade 3.

## 6. Upgrade 4 — Authority-driven protected dispatch

The protected workflow's `workflow_dispatch` now exposes only:

- `mode`: no-scoring or authorized-wr081-scoring.

Manual workflow inputs for execution branch, expected head, consumer path, and consumer SHA-256 are absent.

For authorized scoring:

1. trust gate requires repository `Ryan42062001/The-War-Room`;
2. actor must be the repository owner;
3. ref must be `refs/heads/main`;
4. `future-authority` loads canonical `.ai/shared/ACTIVE_TASKS.json`;
5. branch/head/path/digest are read from Manager-owned `future_execution_authority`;
6. shell performs shape checks;
7. `future-authorization` independently reloads canonical authority and requires exact equality.

`load_future_authorization()` fail-closes on:

- non-Manager-owned/non-main active registry;
- non-unique WR-081 task;
- WR-081 not ASSIGNED/IN_PROGRESS;
- non-NONE blocker or blocked task;
- missing authority;
- main/non-WR-081 branch;
- authority branch not equal task branch;
- malformed exact SHA;
- absolute/out-of-scope/traversing consumer path;
- malformed consumer digest.

Existing pre-exposure protections remain:

- live branch head check before retained retrieval;
- checked-out exact head;
- reviewed consumer path/digest check;
- live branch head recheck immediately before consumer exposure;
- remote head check before publication commit;
- remote head check immediately before non-force push.

No blocking finding was found in Upgrade 4.

## 7. Upgrade 5 — Machine-readable terminal result

The protected wrapper now requires every stage-gate bridge result to contain a non-empty string `status_label`. Missing status fails closed.

After stage execution it emits `WR081_TERMINAL_RESULT.json` with:

- `execution_status`;
- `result_terminal`;
- `decision_status`;
- authority digest;
- authorized head;
- consumer digest;
- prediction-lock count;
- gate-lock count.

The summary contains no retained raw bytes, target rows, predictions, errors, or historical target values.

Technical protected-execution success is represented separately from a model terminal such as `VALIDATION_FAILED`, so workflow success cannot be mechanically interpreted as gate success.

No blocking finding was found in Upgrade 5.

## 8. WR-092-AUD-02 — HIGH — Manager transition accepts unverified/fabricated authority-consumption receipt claims

### Requirement

Upgrade 6 requires valid one-time authority-consumption evidence. Malformed receipt, stale receipt, wrong parent, multi-commit advancement, wrong authority digest, wrong publication head, and reuse must fail closed.

### Protected post-publication checker

The protected bridge's immediate `validate_authority_consumption()` is substantially stronger:

- reloads canonical future authority;
- requires checked-out `publication_head`;
- resolves publication parent;
- requires parent exactly equals authorized head;
- loads committed receipt;
- requires receipt authority digest, branch, authorized head, consumer path, and consumer digest to equal canonical authority;
- requires the one-publication-commit flag.

Thus an actual protected run with a wrong authority digest would fail its post-publication step.

### Manager-transition weakness

The later Manager transition accepts `plan.authority_consumption_receipts` as caller-provided objects.

It only checks:

- `authorized_head` equals old authority head;
- `publication_head` equals next worker checkpoint;
- two booleans are true;
- `authority_sha256` is syntactically 64 hex;
- `receipt_sha256` is syntactically 64 hex.

It does **not**:

- recompute `authority_sha256` from the prior canonical `future_execution_authority`;
- load the committed receipt from `publication_head`;
- recompute `receipt_sha256`;
- verify receipt schema/task/branch/consumer path/consumer digest;
- verify publication parent from Git;
- verify workflow-run identity;
- verify execution/result/decision fields;
- verify publication payload identity;
- bind the input receipt to output from `workflow-result-freeze-check` or `validate_authority_consumption()`.

### Independent adversarial reproduction

Prior canonical authority:

```
branch = wr-081-exec
head_sha = ccccc... (40)
consumer_path = .ai/research/consumer.py
consumer_sha256 = ddddd... (64)
```

Next checkpoint was advanced to `eeee... (40)`.

Caller-supplied receipt used:

- arbitrary `authority_sha256 = ffff...ffff`;
- arbitrary `receipt_sha256 = 0000...0000`;
- authorized head = prior head;
- publication head = next checkpoint;
- both booleans = true.

Exact frozen transition logic returned:

- errors: `[]`;
- old `future_execution_authority` removed;
- fabricated receipt stored as `authority_consumption_receipt`.

This is a direct fail-open against the required wrong-authority-digest/malformed-receipt boundary.

### Freeze-verifier related weakness

The optional receipt branch in `workflow-result-freeze-check.mjs` independently checks only:

- `single_publication_commit_required === true`;
- receipt `authorized_head` equals the protected-evidence parent.

It then copies `authority_sha256` from the receipt without verifying it and does not cross-check receipt workflow run, execution status, terminal, decision status, consumer identity, or publication-payload identity.

Although a real protected workflow SUCCESS gives additional assurance because the immediate post-publication step ran, the freeze packet itself is not a self-sufficient verified consumption proof, and the Manager transition does not cryptographically tie its caller-provided receipt back to that successful run.

### Required remediation

Manager transition must consume independently verified evidence, not syntactic claims.

At minimum:

1. recompute canonical authority SHA-256 from the previous `future_execution_authority`;
2. require exact equality to receipt authority digest;
3. load the receipt from the exact publication commit or consume a deterministic freeze packet whose packet digest and receipt digest are independently revalidated;
4. independently verify publication parent/head and one-commit advancement;
5. recompute committed receipt SHA-256;
6. verify branch, consumer path/digest, workflow-run ID, execution status, result terminal, decision status, and publication-payload identity;
7. reject any mismatch before deleting canonical authority;
8. add regressions for arbitrary-but-well-formed digests and malformed/missing receipt fields.

## 9. WR-092-AUD-03 — HIGH — Previously consumed authority can be re-added and reused

### Requirement

Upgrade 6 is explicitly one-time. Attempted authority reuse must fail closed.

### Frozen implementation

`applyAuthorityConsumptionReceipts()` begins each previous task with:

```js
const oldAuthority = previous.future_execution_authority;
if (!oldAuthority || typeof oldAuthority !== 'object') continue;
```

After a successful consumption, the helper deletes `future_execution_authority` and stores `authority_consumption_receipt`.

On a later transition, because `previous.future_execution_authority` is absent, the function immediately skips that task. It never compares a newly added authority against the already consumed authority/receipt.

### Independent adversarial reproduction

Previous state:

- no `future_execution_authority`;
- valid-looking prior `authority_consumption_receipt` records a consumed authority.

Next transition:

- re-adds the same branch/head/consumer `future_execution_authority`.

Exact frozen authority-consumption logic returned:

- errors: `[]`;
- re-added authority accepted.

No consumed-authority replay check exists elsewhere in the Manager transition helper.

### Impact

The receipt is not one-time in the control plane. A previously consumed identity can be authorized again without a new distinct head/consumer authority, contrary to the explicit attempted-reuse fail-closed requirement.

### Required remediation

Persist and enforce replay protection from the prior consumption receipt. At minimum:

- when previous state has `authority_consumption_receipt`, compute the identity of any newly introduced `future_execution_authority`;
- reject exact reuse of the consumed authority digest/head/branch/consumer tuple;
- require a genuinely new Manager authorization identity for any later execution;
- add direct regressions for same-authority replay and stale receipt replay.

## 10. Upgrade 6 — portions that do pass

The protected scoring wrapper itself correctly creates a deterministic receipt containing:

- canonical authority SHA-256;
- authorized branch;
- authorized pre-execution head;
- consumer path/digest;
- workflow run ID;
- execution status;
- result terminal;
- decision status;
- publication payload SHA-256;
- one-publication-commit requirement.

The workflow:

- pushes without force;
- computes the committed publication head;
- verifies local rev-list count from authorized head to publication head equals one;
- runs a post-publication receipt checker;
- verifies direct parent equals authorized head.

These are useful controls, but the downstream Manager-transition defects in AUD-02/AUD-03 prevent Upgrade 6 from satisfying the complete one-time-consumption contract.

## 11. Preservation audit

### Exact-head / live-state / race controls

Preserved.

The existing protected remote-head checks remain before retained retrieval, immediately before consumer exposure, before commit, and before push. Future checkout still validates exact checked-out SHA and reviewed consumer digest.

### Lane identity / audit independence / Manager merge authority

Preserved in unchanged canonical V3.4 controls. WR-091 gives no Auditor verdict or merge authority to helpers. Result-freeze helper is read-only. Manager transition remains dry-run by default and has no commit/push/merge authority.

AUD-01 is an exact-target derivation defect, not removal of the surrounding lane-identity framework.

### Custody/provider read-only boundary

Preserved.

Provider/custody functions are among the unchanged protected-bridge functions. Candidate PR preflight and WR-069/WR-046 regressions are green.

### Provider credential isolation

Preserved.

Future consumer still executes under `env -i`; provider credentials are not passed to the sandbox consumer.

### Runner-temporary raw bytes

Preserved.

Retained raw data remains under RUNNER_TEMP and cleanup remains mandatory.

### Retained-source publication rejection

Preserved.

`publication_entries()`, retained digest/size rejection, exact-byte comparison, publication manifest validation, frozen path collision checks, and staging checks are unchanged.

### Prediction-lock-before-target exposure

Preserved.

The stage loop still locks prediction publication before target-ingest and checks accepted prediction lock.

### Release guards

Preserved.

Protected preflight `npm run test:release` completed successfully. No new workflow bypass was introduced outside the existing allowlist.

### Post-merge canary

Preserved as a mandatory task requirement. V3.5 candidate text explicitly remains non-canonical until fresh audit and post-merge canary.

## 12. Validation evidence

### Exact target Full War Room CI

Push run `35405857026`: SUCCESS.

- classify `105795362443`: SUCCESS;
- governance `105795391450`: SUCCESS;
- bootstrap-reuse `105795392415`: SKIPPED;
- full test `105795446166`: SUCCESS.

Classifier log independently shows:

- ordinary non-zero base push;
- target head `def590788eb615d9322d5cc8ae3eef14e8c1bc25`;
- scope `FULL`;
- `skip_governance=false`.

### PR-event War Room CI

Run `35405938490`: SUCCESS.

- classify `105795588389`: SUCCESS;
- governance `105795628362`: SUCCESS;
- bootstrap-reuse `105795629863`: SKIPPED;
- full test `105795663908`: SUCCESS.

### Protected bridge candidate regression

Run `35405938497`: SUCCESS.

- preflight `105795588539`: SUCCESS;
- trust gate: SKIPPED on PR context;
- future authorized scoring: SKIPPED;
- no-scoring proof: SKIPPED.

### Boundary regressions

- WR-069 run `35405938515`: SUCCESS;
- WR-046 run `35405938518`: SUCCESS.

### Live bootstrap canary

Run `35406347330`:

- classify `105796787223`: SUCCESS;
- bootstrap-reuse `105796811247`: SUCCESS;
- governance `105796812368`: SKIPPED;
- full test `105796812774`: SKIPPED.

The canary log explicitly records reuse of `35405857026` for exact identical SHA `def590788eb615d9322d5cc8ae3eef14e8c1bc25`.

Green CI does not override the independently reproduced fail-closed defects because the shipped regression suites do not exercise the adversarial states described in AUD-01/AUD-02/AUD-03.

## 13. Current-main advancement

At audit time, frozen target and current main have diverged from implementation base `31a36e00...`.

Current-main advancement consists of WR-082 Auditor evidence and Manager/shared WR-092 freeze/activation state. It includes later Manager edits to `.ai/manager/WR-091.md`; PR #257 currently reports non-mergeable against live main.

This is not treated as a WR-091 implementation finding because WR-092 is required to audit the exact frozen target and not later target movement. Manager must reconcile current control-plane advancement during any future remediation/integration without carrying this failed verdict to a changed target.

## 14. Auditor boundary

The Auditor:

- did not modify PR #257 or WR-091 target files;
- did not merge PR #257;
- did not make V3.5 canonical;
- did not change workflows/scripts/Manager/shared state;
- did not modify research/model evidence;
- did not modify provider state;
- wrote only `.ai/auditor/**`.

## 15. Required Manager disposition

Do not merge exact WR-091 target `def590788eb615d9322d5cc8ae3eef14e8c1bc25`.

Route bounded WR-091 remediation for the three HIGH findings:

1. enforce unique upstream target even when Auditor target is explicitly supplied;
2. cryptographically and repository-bind authority-consumption evidence before Manager transition removes authority;
3. reject replay/reuse of an already consumed authority.

After remediation:

- run updated Manager-transition/result-freeze/CI/protected-bridge regressions;
- include explicit adversarial tests matching all three findings;
- obtain exact-head Full War Room CI;
- freeze one new immutable WR-091 target;
- route a fresh independent re-audit.

V3.4 remains canonical.

Final verdict: `FAIL — REMEDIATION REQUIRED`.
