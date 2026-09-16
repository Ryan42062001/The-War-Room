# WR-079 — Independent Audit of Workflow V3.3 Efficiency Upgrade

Task: WR-079
Role: Independent Auditor / QA
Workflow: V3.2 canonical
Execution mode: STANDARD_CHAT
Audit target: WR-078 / PR #217
Frozen target branch: `manager/wr-078-workflow-v33-efficiency`
Frozen target SHA: `0b25767ce56c44505e9364adc9c536d57c46a1e5`
Starting WR-078 canonical SHA: `ca6362e1b7128f334a6ae584c67101244a4d8db8`
Auditor branch: `wr-079-workflow-v33-efficiency-audit`

## Final verdict

`FAIL — REMEDIATION REQUIRED`

## Findings by severity

- CRITICAL: none.
- HIGH: none.
- MEDIUM: `WR-079-AUD-01`, `WR-079-AUD-02`.
- LOW: none.

## Independent target verification

Before substantive review, live GitHub PR #217 was independently verified still open and unmerged at exact head `0b25767ce56c44505e9364adc9c536d57c46a1e5` on `manager/wr-078-workflow-v33-efficiency`. The PR reports exactly one implementation commit and five changed files.

Independent compare from `ca6362e1b7128f334a6ae584c67101244a4d8db8` to the frozen target is exactly 1 commit ahead / 0 behind and changes only:

- `.github/workflows/ci.yml`
- `scripts/test-workflow-audit-readiness.mjs`
- `scripts/test-workflow-manager-transition.mjs`
- `scripts/workflow-audit-readiness.mjs`
- `scripts/workflow-manager-transition.mjs`

Current canonical main at audit start was independently verified as `75f58a0422cae0ecb0c79138d5f8be067aa39c4a`; the prepared Auditor branch pointed to the same SHA. Advancement from WR-078 starting canonical `ca6362e...` to current main is control-plane-only under `.ai/shared/**` and `.ai/manager/**`; it does not overlap the five implementation files and does not change the frozen target.

## Exact target CI and hash evidence

Live War Room CI run `35100255711` is completed `SUCCESS`, associated with PR #217 head `0b25767ce56c44505e9364adc9c536d57c46a1e5`.

Jobs independently verified:

- classify `104807577031` — SUCCESS
- governance `104807636859` — SUCCESS
- test `104807695995` — SUCCESS

The live Governance log shows the readiness step checked out exact PR head `0b25767...`, emitted the readiness packet from that head, then restored synthetic merge checkout `5ea00c4444fa4e39ed089a7e5cec7635cdc30c0f` before source-custody, retained-version, and WR-069 safe-consumer regressions.

The same live log emitted the following SHA-256 values from the exact target; they match the frozen Manager inventory:

- `.github/workflows/ci.yml` — `4b7d30f406cc22b68aea26f8b6de9940a53a37442cb5d9d515ef77b0bfe06092`
- `scripts/test-workflow-audit-readiness.mjs` — `7ddb2cd539d0af10467845d90d72ba9fd0c679c2aa8bf1e187ce07fd9b6c852f`
- `scripts/test-workflow-manager-transition.mjs` — `b5d064c35ad1d0872c709dcd3ef47200e8e7c917f13935c3f7194613c83fd094`
- `scripts/workflow-audit-readiness.mjs` — `7233eff50be1c68c456849484457a5dba5c6381ce3b62c70aa67cbc4f4c5e4a2`
- `scripts/workflow-manager-transition.mjs` — `17b29cee0ce47d5230b9a61da85ae670370782973d06adb23266bf9abe80f155`

The machine packet's `ready_for_manager_freeze: true` was treated only as mechanical evidence, never as an audit verdict.

## Public-repository CI security review

PASS for the frozen run's effective privilege and secret posture:

- GitHub-hosted Ubuntu runner was used.
- Governance job reported `GITHUB_TOKEN` permissions: Contents read, Metadata read, Packages read.
- No write permission was present in the exact frozen run.
- Workflow trigger is `push` / `pull_request`; no `pull_request_target` path exists.
- No workflow step injects repository/provider secrets into the readiness command.
- `actions/checkout` persisted credentials, but the exact run's token was read-only, so the checkout/readiness path could not push repository changes.
- Exact-head checkout was restored before remaining integration/custody checks.

This prevents the frozen run from mutating repository state and preserves the existing custody regressions. Finding `WR-079-AUD-01` below is an identity/scoping defect, not a write-token or secret-exposure finding.

## Requirement-by-requirement disposition

1. PASS — V3.2 remains explicitly canonical. V3.3 remains candidate-only until PASS-family audit, integration, mandatory canonical-main full-CI canary, and Manager disposition.
2. PASS — readiness output is mechanical evidence only; no helper emits or synthesizes an Auditor verdict.
3. FAIL — readiness is not uniformly fail-closed for malformed comparison authority; see `WR-079-AUD-02`.
4. FAIL — automatic CI mode does not bind source repository identity and can claim an unrelated fork PR that reuses an active branch name; see `WR-079-AUD-01`.
5. PASS — readiness packet head is actual exact checked-out PR head, not the synthetic pull-request merge commit.
6. PASS with scoped finding elsewhere — frozen run is hosted/read-only/no-secret/no-`pull_request_target`, restores integration checkout, and has no repository mutation privilege. Fork identity attribution still needs remediation under `WR-079-AUD-01`.
7. PASS — forbidden and outside-allowlist changed-file checks fail readiness.
8. PASS for sidecar/hash primitives inspected: correct hash passes; wrong/malformed/missing artifact or sidecar fails/throws closed. Version comparison authority is separately defective under `WR-079-AUD-02`.
9. FAIL — a malformed `version_bump.relative_to` can silently weaken a Manager-owned readiness contract by being treated as a new artifact; see `WR-079-AUD-02`.
10. FAIL only for `version_bump` malformed comparison authority. `file_exists`, explicit sidecar binding, JSON pointer existence/equality, and file-SHA pointer logic are deterministic/fail-closed by inspection; fixture hashing is exact byte SHA-256. Existing regression tests exercise positive sidecar/fixture binding and negative JSON equality, but do not cover the failing `version_bump` case.
11. PASS — Manager transition helper is dry-run by default.
12. PASS — filesystem writes occur only inside `if (options.write)`.
13. PASS — `--write` writes registry plus synchronized active task-spec machine headers; no specialist evidence, commit, push, or merge command exists. The helper intentionally computes synchronized headers for all resulting active task specs.
14. PASS — originals are captured before writes and restored if write/state-check execution fails.
15. PASS — transition logic validates task IDs, branch/worker-slot/PR uniqueness, active dependencies, dependency cycles, effective write-scope collisions, active Auditor target metadata, task-file existence, and task/spec machine-header synchronization; canonical state checker runs after writes.
16. PASS — transition helper contains no commit/push/merge/Auditor-verdict/acceptance primitive and cannot bypass Manager review by itself.
17. PASS — Bounded Remediation Refresh is limited to same-task explicitly bounded remediation and escalates to Full Refresh for new tasks, workflow/architecture, milestone/merge disposition, contradiction/staleness, or scope uncertainty.
18. PASS — WR-074 authority is narrowed to exact `.github/workflows/wr074-self-hosted-heavy-ci-pilot.yml`; canonical collision validation remained green with WR-078's exact `ci.yml` ownership.
19. PASS — exact target Governance ran workflow state collision, lane identity, trusted custody, WR-063 retained-version, and WR-069 safe-consumer regressions successfully.
20. PASS — `.github/workflows/**` and `scripts/**` changes classify as FULL; exact target test job ran successfully. Governance log reports `CI scope FULL — non-ai-change`.
21. PASS — exact target is one implementation commit ahead of `ca6362e1b7128f334a6ae584c67101244a4d8db8` and zero behind.
22. PASS — no production code, research artifact, model/ranking semantics, custody implementation, source data, or unrelated application file changed in the exact five-file implementation delta.

## MEDIUM WR-079-AUD-01 — auto readiness can misattribute an unrelated public-fork PR by branch-name collision

Requirement:

Automatic CI mode must operate only for the correct active audit-required task/branch and safely skip unrelated branches; public-repository exact-head execution must not create ambiguous task attribution.

Evidence:

`.github/workflows/ci.yml` passes `HEAD_BRANCH: ${{ github.head_ref || github.ref_name }}` to the readiness helper. `workflow-audit-readiness.mjs --auto` selects the task only with `registry.tasks.find(item => item.branch === detectedBranch)`. There is no source-repository identity or PR-number binding in the helper or packet.

For a `pull_request` event, `github.head_ref` is the source branch name. Public forks have their own independent branch namespace, so a fork can create the same branch name as an active repository task. The live security posture keeps that run read-only/no-secret, but the readiness helper can still claim the fork PR as the active task instead of safely skipping it.

Failure:

Branch-name equality is treated as sufficient task identity in auto mode even though it is not globally unique across public forks.

Impact:

An unrelated fork PR can be labeled mechanically as the active task and can produce misleading readiness output for that task. This does not grant merge/Auditor authority and current fork runs remain read-only, but it violates the candidate's branch-scoping acceptance criterion and weakens audit-readiness evidence quality.

Required remediation:

Bind auto-mode pull-request readiness to repository identity and, when an owned task PR is recorded, PR identity. At minimum pass the pull request head repository full name plus canonical repository full name and refuse/skip task attribution when they differ. Prefer also binding the packet to event PR number/head repo so the evidence cannot be confused with the owned PR. Add a regression for same branch name from a different head repository.

Validation required:

- same-repository active branch: readiness runs normally;
- unrelated same-repository branch: skip;
- non-audit-required branch: skip;
- public-fork PR with an active branch-name collision: skip/fail without claiming the task;
- packet records sufficient repository/PR identity for Manager review.

Confidence: high.

## MEDIUM WR-079-AUD-02 — `version_bump` fails open when comparison ref resolution fails

Requirement:

Task-specific readiness contracts and version-bump primitives must fail closed for malformed, missing, mismatched, unauthorized, or ambiguous comparison inputs; they must not silently weaken task authority.

Evidence:

`workflow-audit-readiness.mjs` implements `gitShow()` as a `git show <ref>:<path>` call that catches every error and returns an empty string. The `version_bump` check then treats any falsey `oldText` as a successful new-artifact case:

`if (!oldText) { push(check.type, true, ... 'absent at comparison target; new artifact' ...) }`

Therefore a genuinely absent path at a valid comparison ref and an invalid/nonexistent/malformed `relative_to` ref are indistinguishable.

Failure:

A malformed `relative_to` value can make the version-bump contract PASS instead of creating a blocker.

Impact:

A Manager-owned contract intended to require version movement on changed protected bytes can be silently bypassed by a comparison-ref typo or resolution failure. Independent audit remains mandatory, so this is not an Auditor-authority bypass, but it violates the core fail-closed promise of V3.3 readiness automation.

Required remediation:

Distinguish ref-resolution failure from valid-ref/path-absent state. Validate the comparison ref first; fail the check on invalid/ambiguous ref or unexpected `git show` errors. Only treat the artifact as new when the ref is valid and the path is provably absent at that ref.

Add focused regression cases for:

- valid ref + artifact absent => PASS as new artifact;
- invalid `relative_to` ref => FAIL/blocker;
- bytes changed + same version => FAIL/blocker;
- bytes changed + version changed => PASS;
- bytes unchanged + same version => PASS;
- malformed comparison JSON => FAIL/blocker.

Validation required:

Exact remediated-head Governance CI must show these regressions passing and the readiness helper must return nonzero/blocker for invalid comparison authority.

Confidence: high.

## Manager-transition review details

The new transition helper is dry-run by default and has no Git mutation commands. In write mode it snapshots the active registry and all resulting active task specs before writing, updates the registry and machine headers, executes the canonical static state checker, and restores all captured bytes on failure. Relation checks cover duplicate task IDs, branches, worker slots and PRs; dependency existence/cycles; parallel write-prefix collisions; and active Auditor target task/PR/branch metadata. Task-spec contract validation binds TASK ID, STATUS, DEPENDENCY, EXECUTION MODE, and TARGET BRANCH.

No code path issues commit, push, merge, audit verdict, or Manager acceptance. Manager remains responsible for narrative canonical state, live GitHub verification, diff review, and the atomic Git transaction.

## Readiness primitive review details

By code inspection:

- `file_exists`: missing path => failed check.
- `sha256_sidecar`: missing artifact/sidecar, malformed 64-hex digest, or mismatched bytes => failed check.
- changed `.sha256` generic check: malformed/missing/mismatched artifact => failed check or nonzero exception.
- `json_pointer_exists`: absent pointer => failed check; malformed JSON/pointer => failed check through exception capture.
- `json_pointer_equals`: strict deterministic JSON serialization equality.
- `json_pointer_file_sha256`: missing file or mismatched pointer/hash => failed check.
- fixture hashing: SHA-256 over exact file bytes.
- `version_bump`: bytes-changed/same-pointer value correctly blocks when comparison succeeds, but invalid comparison authority fails open as described in `WR-079-AUD-02`.
- unsupported contract check type => failed check.
- missing contract file or malformed top-level contract JSON => nonzero failure.

## Recommended Manager disposition

Do not merge WR-078 / PR #217 as the V3.3 integration target.

Keep Workflow V3.2 canonical. Return WR-078 for bounded same-task remediation of exactly `WR-079-AUD-01` and `WR-079-AUD-02`, add focused regressions, run exact-head Full War Room CI, then Manager must freeze one new immutable PR head and route a fresh independent audit of that new target. Preserve this failed audited head as historical evidence; do not rewrite this verdict onto a later WR-078 head.

Auditor modified or merged PR #217: NO.
Auditor modified non-`.ai/auditor/**` surfaces: NO.
