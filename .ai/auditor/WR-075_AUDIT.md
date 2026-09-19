# WR-075 — Independent Audit of Self-Hosted Heavy-CI Runner Pilot

Status: **COMPLETE — PASS**

Task: `WR-075 — Independent Audit of Self-Hosted Heavy-CI Runner Pilot`

Role: Independent Auditor / QA

Workflow: canonical Workflow V3.5

Execution mode: `STANDARD_CHAT_HIGH`

Refresh mode: `FAST_REFRESH`

## Verdict

`PASS`

Findings:
- CRITICAL: none
- HIGH: none
- MEDIUM: none
- LOW: none

This verdict applies only to the exact Manager-frozen WR-074 target:

`75fcd3756956b2943f18aff03115f9783a16d0aa`

It must not be transferred to later PR-head movement, later branch movement, altered runner configuration, broadened triggers, changed labels, or any later workflow/helper implementation.

## 1. Exact audit identity

Repository:
`Ryan42062001/The-War-Room`

Canonical main independently verified:
`26060aa426ca9ec3bebdeb38735c1b5ae351b09c`

Assigned Auditor branch:
`wr-075-self-hosted-heavy-ci-runner-audit`

Initial Auditor branch head independently verified:
`26060aa426ca9ec3bebdeb38735c1b5ae351b09c`

Audit target:
- task: WR-074
- PR: #307
- target branch: `wr-074-self-hosted-heavy-ci-runner-pilot`
- exact frozen target: `75fcd3756956b2943f18aff03115f9783a16d0aa`
- immutable implementation SHA: `c2e511da5d3767cbc0688de7e95236135a6975b2`
- canonical implementation base: `cb544da20c7b82ded5552d425d69b8a47c880f30`
- Manager freeze checkpoint: `58eded3958d296d3392aac2cb1fdd92a0cd513c8`

At audit start PR #307 was independently verified:
- OPEN
- DRAFT
- unmerged
- live head exactly `75fcd3756956b2943f18aff03115f9783a16d0aa`
- base exactly `cb544da20c7b82ded5552d425d69b8a47c880f30`
- mergeable.

The audit follows the frozen SHA only.

## 2. Scope integrity

Independent compare of canonical implementation base:

`cb544da20c7b82ded5552d425d69b8a47c880f30`

to frozen target:

`75fcd3756956b2943f18aff03115f9783a16d0aa`

shows exactly six changed paths:

1. `.ai/work_helper/HANDOFF.md`
2. `.ai/work_helper/WR074_LINUX_RUNNER_ACTIVATION.md`
3. `.ai/work_helper/WR074_SELF_HOSTED_HEAVY_CI_REPORT.md`
4. `.github/workflows/wr074-self-hosted-heavy-ci-pilot.yml`
5. `scripts/ci/wr074-pilot.mjs`
6. `scripts/validate-release-candidate.mjs`

No product, ranking, recommendation, research/model/data, custody script, Manager/shared, Auditor, `src/**`, `public/**`, or unrelated workflow path changed.

Independent compare of canonical base to immutable implementation SHA:

`c2e511da5d3767cbc0688de7e95236135a6975b2`

contains only:
- `.ai/work_helper/WR074_LINUX_RUNNER_ACTIVATION.md`
- `.github/workflows/wr074-self-hosted-heavy-ci-pilot.yml`
- `scripts/ci/wr074-pilot.mjs`
- `scripts/validate-release-candidate.mjs`

This is the authorized implementation/helper/validator surface plus Work Helper activation evidence.

Independent compare from implementation SHA to final frozen target contains only:
- `.ai/work_helper/HANDOFF.md`
- `.ai/work_helper/WR074_LINUX_RUNNER_ACTIVATION.md`
- `.ai/work_helper/WR074_SELF_HOSTED_HEAVY_CI_REPORT.md`

Thus implementation-to-final movement is evidence/report/handoff only.

No temporary Windows diagnostic or shim path is present in the frozen PR diff.

## 3. Self-hosted routing security

Exact frozen workflow:

`.github/workflows/wr074-self-hosted-heavy-ci-pilot.yml`

independently inspected.

Trigger:
- `push` only;
- exact branch:
  `wr-074-self-hosted-heavy-ci-runner-pilot`.

The workflow contains no:
- `pull_request`;
- `pull_request_target`;
- generic branch wildcard;
- generic self-hosted fallback.

Self-hosted job routing is exactly:

`runs-on: [self-hosted, war-room-heavy-ci]`

The route is not weakened to generic `self-hosted`.

The trust gate runs independently on GitHub-hosted:

`ubuntu-latest`

and requires all of:
- event = `push`;
- repository = `Ryan42062001/The-War-Room`;
- ref = `refs/heads/wr-074-self-hosted-heavy-ci-runner-pilot`;
- actor = `Ryan42062001`.

The self-hosted and hosted heavy jobs require trust-gate output `approved == true`.

Final-target trust-gate job:
`105946380768`

independently logged:
- event `push`;
- exact repository;
- exact WR-074 ref;
- expected actor;
- trusted gate PASS.

Therefore arbitrary public fork PR code cannot directly route onto the self-hosted machine through this workflow. A fork PR has no workflow trigger here and cannot satisfy the exact same-repository branch-push gate.

## 4. Permissions / credentials

Top-level workflow permissions are exactly:

`contents: read`

Both heavy jobs use:

`actions/checkout@v7`

with:
- `persist-credentials: false`;
- `clean: true`;
- `fetch-depth: 1`.

The workflow contains no `secrets.*` reference.

No B2/R2/provider/custody secret is injected by WR-074.

The WR-074 helper independently checks environment variable names for:
- AWS credentials;
- B2 application credentials;
- Cloudflare API credentials;
- `WR_CUSTODY_*`;
- `B2_*`;
- `R2_*`;
- `CLOUDFLARE_R2_*`.

If present, the helper fails closed.

The helper performs this authority-absence check in:
- preflight;
- normalize;
- environment;
- stress;
- resilience;
- cleanup.

Successful self-hosted run evidence reports provider/custody authority absent during preflight, environment reporting, and cleanup.

The pilot workflow contains no retained-provider retrieval command and no custody script invocation.

Canonical `npm test` was independently inspected and is application/release/browser/test coverage; it does not invoke credential-bearing custody/provider workflows.

## 5. Hosted separation

Canonical:

`.github/workflows/ci.yml`

is Git-blob identical between canonical implementation base and frozen WR-074 target:

`b2ade5d9c26ba6b7968d05981e003f2b5578aa8e`

All canonical CI jobs remain:
`ubuntu-latest`

including classify and Governance.

The following custody/protected workflows are byte-identical between canonical base and frozen target and remain GitHub-hosted:

- `.github/workflows/wr042-source-custody.yml`
- `.github/workflows/wr046-custody-fixture.yml`
- `.github/workflows/wr063-retained-version-read.yml`
- `.github/workflows/wr069-retained-safe-consumer-parser.yml`
- `.github/workflows/wr083-protected-historical-scoring-bridge.yml`
- `.github/workflows/wr097-v21-protected-scoring-bridge.yml`

Their hosted routing remains either:
- `ubuntu-latest`, or
- `ubuntu-24.04`.

Credential-bearing custody/protected jobs were not moved onto self-hosted.

At the exact frozen target, same-target PR checks independently observed:
- WR-063 run `35461622724` — SUCCESS preflight; protected retained read SKIPPED;
- WR-069 run `35461622651` — SUCCESS preflight; protected retained consumer SKIPPED;
- WR-046 run `35461622653` — SUCCESS preflight; live custody / credential scope SKIPPED;
- WR-083 run `35461622656` — SUCCESS preflight; protected scoring lanes SKIPPED;
- WR-097 run `35461622611` — SUCCESS preflight; protected scoring lanes SKIPPED.

WR-074 did not alter their code, permissions, secrets, or execution routing.

Hosted heavy validation remains independently available in two forms:
1. unchanged canonical War Room CI;
2. `hosted-heavy-parity-reference` inside the WR-074 pilot workflow.

The hosted heavy-reference job depends only on the GitHub-hosted trust gate, not on self-hosted success.

## 6. Persistent-workspace safety

Helper:
`scripts/ci/wr074-pilot.mjs`

preflight:
1. rejects provider/custody authority;
2. rejects non-Linux `RUNNER_OS`;
3. verifies current directory matches assigned GitHub workspace when `GITHUB_WORKSPACE` is present;
4. runs bounded repository cleanup:
   - `git reset --hard HEAD`
   - `git clean -ffdx`;
5. requires clean Git status;
6. checks that after cleanup:
   - `node_modules` does not exist;
   - `artifacts` does not exist;
   - stale sentinel does not exist;
   - Git status is clean;
   - provider authority is absent;
7. fails closed if residue survives;
8. writes a sentinel for stale-workspace detection.

Cleanup:
1. rejects provider/custody authority;
2. performs the same bounded repository reset/clean;
3. requires:
   - Git clean;
   - `node_modules` removed;
   - `artifacts` removed;
   - sentinel removed;
   - provider/custody authority absent;
4. fails closed if residue remains.

Both self-hosted and hosted workflow cleanup steps use:
`if: always()`

so cleanup is intended to run after preceding test failures as well as success, subject to ordinary GitHub Actions cancellation/runner-loss semantics.

### Run 1 — self-hosted

Run:
`35460866285`

Self-hosted job:
`105944382151`

Preflight independently logged:
- `node_modules_present_after_clean=false`;
- `artifacts_present_after_clean=false`;
- `sentinel_present_after_clean=false`;
- `git_status_clean=true`;
- `provider_authority_present=false`.

Final cleanup independently logged:
- result PASS;
- Git clean;
- node_modules removed;
- artifacts removed;
- sentinel removed;
- provider authority absent.

### Run 2 — self-hosted

Run:
`35461197805`

Self-hosted job:
`105945274820`

Second preflight independently logged the same clean state:
- no node_modules;
- no artifacts;
- no sentinel;
- Git clean;
- provider authority absent.

Second cleanup independently logged PASS with all bounded residue removed.

Run 1 cleanup completed before Run 2 preflight, and the same helper runner-name SHA-256 was reported on both self-hosted runs. This is genuine repeated persistent-workspace evidence, not reuse of the first run's output.

## 7. Repeated self-hosted parity

### Pilot run 1

Run:
`35460866285`

Jobs:
- trust gate `105944368659` — SUCCESS
- self-hosted heavy parity `105944382151` — SUCCESS
- hosted heavy parity `105944382105` — SUCCESS

### Pilot run 2

Run:
`35461197805`

Jobs:
- trust gate `105945263537` — SUCCESS
- self-hosted heavy parity `105945274820` — SUCCESS
- hosted heavy parity `105945274919` — SUCCESS

Both self-hosted and hosted jobs executed the same meaningful heavy-test surface:
- workspace preflight;
- line-ending normalization used identically by both parity lanes;
- exact lockfile dependency installation;
- Playwright Chromium preparation;
- sanitized environment evidence;
- browser persistence stress 10x;
- deterministic browser / command-bar / layout / WR-026 remediation stress 5x;
- WR-026 phone decision view;
- bounded WR-026 screenshot/report artifact upload;
- canonical `npm test`;
- resilience syntax checks;
- backup/offline reload 3x;
- final cleanup.

The only expected setup distinction is that hosted uses Playwright `--with-deps` while self-hosted installs browser binaries only because Linux OS dependencies were installed on the persistent host as a one-time machine prerequisite. The actual test surface remains matched.

Logs independently show:
- persistence iteration 10/10 completed;
- deterministic iteration 5/5 completed;
- WR-026 view passed;
- release validation passed through canonical `npm test`;
- resilience completed;
- cleanup passed.

The two run IDs, job IDs, timestamps, benchmark values, and generated artifact names are distinct. Run 2 is not an Actions rerun/reuse of Run 1 result state.

## 8. Independent benchmark calculation

Expected raw values were independently recovered from Actions logs.

### Run 1

Self-hosted stress:
`183154 ms`

Hosted stress:
`160436 ms`

Percentage difference:

`(183154 - 160436) / 160436 * 100 = 14.1602%`

Self-hosted stress was approximately:
`14.16% slower`

Self-hosted resilience:
`17624 ms`

Hosted resilience:
`16211 ms`

Percentage difference:

`(17624 - 16211) / 16211 * 100 = 8.7163%`

Self-hosted resilience was approximately:
`8.72% slower`

### Run 2

Self-hosted stress:
`182270 ms`

Hosted stress:
`137516 ms`

Percentage difference:

`32.5446%`

Self-hosted stress was approximately:
`32.54% slower`

Self-hosted resilience:
`18956 ms`

Hosted resilience:
`14655 ms`

Percentage difference:

`29.3483%`

Self-hosted resilience was approximately:
`29.35% slower`

### Two-run means

Mean self-hosted stress:
`(183154 + 182270) / 2 = 182712 ms`

Mean hosted stress:
`(160436 + 137516) / 2 = 148976 ms`

Mean relative difference:
`22.6453%`

Self-hosted mean stress was approximately:
`22.65% slower`

Mean self-hosted resilience:
`(17624 + 18956) / 2 = 18290 ms`

Mean hosted resilience:
`(16211 + 14655) / 2 = 15433 ms`

Mean relative difference:
`18.5123%`

Self-hosted mean resilience was approximately:
`18.51% slower`

Conclusion:
WR-074 demonstrates functional/security viability and repeated parity. It does **not** demonstrate a speed advantage.

## 9. Final-target validation

Exact frozen head:
`75fcd3756956b2943f18aff03115f9783a16d0aa`

Final pilot run:
`35461615030` — SUCCESS

Jobs:
- trusted-ref-gate `105946380768` — SUCCESS
- hosted-heavy-parity-reference `105946392493` — SUCCESS
- self-hosted-heavy-parity `105946392540` — SUCCESS

The self-hosted checkout log initially shows cleanup/detachment from stale local workspace state `c2f44d1...`; this is not the tested head.

`actions/checkout` then independently:
- fetched exact SHA `75fcd3756956b2943f18aff03115f9783a16d0aa`;
- updated the remote WR-074 ref to that exact SHA;
- checked out the exact branch ref;
- final rev-parse resolved to `75fcd3756956b2943f18aff03115f9783a16d0aa`.

The hosted reference also fetched and verified the exact frozen SHA.

The final phone-review artifacts are named with the exact frozen SHA, confirming final-target artifact binding.

Final self-hosted environment evidence:
- runner OS: Linux;
- runner arch: X64;
- kernel: Microsoft WSL2;
- provider/custody authority absent.

Final preflight:
- no node_modules;
- no artifacts;
- no stale sentinel;
- Git clean;
- provider authority absent.

Final cleanup:
- PASS;
- Git clean;
- node_modules removed;
- artifacts removed;
- sentinel removed;
- provider authority absent.

Final exact-head War Room CI:

`35461622646` — SUCCESS

Jobs:
- classify `105946400743` — SUCCESS
- governance `105946432859` — SUCCESS
- bootstrap-reuse `105946433631` — SKIPPED
- test `105946457088` — SUCCESS

The final CI test job independently shows:
- browser persistence stress completion;
- deterministic coverage completion;
- WR-026 phone decision view PASS;
- release validator PASS.

Canonical post-freeze and post-activation Manager CIs were also independently verified successful:
- post-freeze `35462263434`;
- post-activation `35462363341`.

## 10. Linux runner claim

Repository and Actions evidence supports:
- dedicated route: `[self-hosted, war-room-heavy-ci]`;
- successful self-hosted execution on Linux;
- X64 architecture;
- WSL2 kernel;
- stable self-hosted runner-name hash across repeated runs.

The workflow does not route generic `self-hosted`.

The helper explicitly fails closed when:
- `RUNNER_OS` exists and is not `Linux`.

Therefore a non-Linux runner that somehow receives the custom route cannot successfully proceed through the heavy test surface.

The audit connector does not expose repository runner-inventory settings, so the Auditor does not independently claim the current label inventory of every offline runner. The stronger evidence relevant to WR-074 is:
- no label-route weakening occurred;
- every successful self-hosted target run executed on Linux/WSL2;
- non-Linux execution fails closed before the test surface.

This satisfies the frozen workflow's Linux safety contract without relying solely on Work Helper UI narrative.

## 11. Local-machine information boundary

The WR-074 helper:
- hashes `RUNNER_NAME` to SHA-256 before publishing helper environment evidence;
- does not deliberately print the configured runner name;
- records only a boolean stating precise workspace path is not published by the helper;
- does not print `GITHUB_WORKSPACE`;
- does not enumerate unrelated local directories/files;
- examines only bounded repository paths such as node_modules, artifacts, sentinel, known browser harness files, and Git status;
- does not print secret values;
- on provider-authority failure prints only the count of blocked variable names, not values.

GitHub's self-hosted runner bootstrap and standard actions independently expose routine runner/host/cache/workspace metadata in public Actions logs. That metadata is platform/action-generated, not deliberate WR-074 helper logging.

No credential value or unrelated local-file content was observed in audited WR-074 logs.

This is an operational privacy characteristic of public self-hosted Actions, not a WR-074 implementation finding.

## 12. Release-validator integrity

The exact PR patch to:

`scripts/validate-release-candidate.mjs`

contains one semantic addition:

`.github/workflows/wr074-self-hosted-heavy-ci-pilot.yml`

to the existing approved workflow allowlist.

All existing V3.5 workflow entries remain present:
- canonical CI;
- WR-042;
- WR-046;
- WR-063;
- WR-069;
- WR-083;
- WR-097.

No custody/protected workflow was removed from the allowlist.

Release validation ran successfully on:
- repeated pilot self-hosted and hosted lanes;
- final frozen self-hosted and hosted lanes;
- final exact-head canonical War Room CI.

Observed release-validator messages:
- repeated-run targets: 522 tracked files, valid;
- final frozen target: 523 tracked files, valid.

The count change is consistent with later Work Helper evidence/report material added before freeze; validation remained successful.

## 13. Scope / contamination conclusion

No evidence was found of WR-074:
- production code changes;
- draft-strategy changes;
- ranking/recommendation changes;
- Returning-Player model/data changes;
- retained-provider access;
- custody semantics changes;
- protected wrapper changes;
- Phase-6 work;
- Manager/shared changes by Work Helper;
- unrelated workflow changes;
- test assertion weakening;
- generic self-hosted routing;
- fork PR execution;
- `pull_request_target` execution;
- credential-bearing self-hosted custody/protected execution.

The exact frozen diff and byte-identical hosted/custody workflows independently support this conclusion.

## 14. Operational observations — not audit findings

The following are real operational constraints but do not violate the frozen WR-074 contract:

1. Performance:
   self-hosted was slower than hosted on both observed repeated benchmark pairs.

2. WSL2/service availability:
   the runner depends on the Ubuntu WSL2/systemd service being available.

3. Playwright OS dependencies:
   the persistent Linux host requires one-time OS dependency provisioning outside recurring CI.

4. Persistent-host residual risk:
   cleanup/preflight provide strong repository-workspace hygiene, but persistent hardware is not equivalent to a disposable GitHub-hosted VM.

5. Public Actions metadata:
   GitHub's standard self-hosted runner/actions logs expose routine host/runner/path metadata independently of WR-074's sanitized helper evidence.

These observations support treating WR-074 as a bounded infrastructure pilot, not as evidence of performance superiority or disposable-host equivalence.

## 15. Auditor boundary

This audit:
- did not modify WR-074;
- did not modify the pilot workflow;
- did not modify scripts;
- did not modify Work Helper evidence;
- did not modify Manager/shared state;
- did not modify research/product/custody code;
- did not change runner configuration;
- did not merge PR #307;
- did not remediate anything;
- writes only under `.ai/auditor/**`.

## Conclusion

Exact audited target:

`75fcd3756956b2943f18aff03115f9783a16d0aa`

independently satisfies the Manager-approved WR-074 pilot contract.

Security/routing conclusion:
- dedicated custom self-hosted route preserved;
- exact push-only trusted branch gate preserved;
- no fork-PR execution path;
- least-privilege repository token permissions;
- no provider/custody secrets or retained retrieval on self-hosted;
- hosted Governance/custody/protected execution remains separated.

Repeated-run conclusion:
- two distinct successful self-hosted runs plus matched hosted references;
- second self-hosted run independently starts from a clean bounded workspace;
- final frozen head also passes both self-hosted and hosted parity lanes.

Benchmark conclusion:
- self-hosted is slower in the observed benchmark;
- viability is functional/security parity, not performance improvement.

Cleanup conclusion:
- repeated and final preflight/cleanup evidence verifies bounded stale-workspace cleanup and no surviving node_modules/artifacts/sentinel.

Credential/custody conclusion:
- provider/custody authority absent from successful self-hosted evidence;
- custody/protected workflows remain unchanged and GitHub-hosted.

Scope conclusion:
- exact six authorized target paths only;
- no unrelated product/research/custody/Manager/shared contamination.

Final verdict:

`PASS`

## Manager action

Manager may consume this PASS only for exact WR-074 target:

`75fcd3756956b2943f18aff03115f9783a16d0aa`

If accepted, Manager may integrate only that exact audited target and perform the required canonical-main post-merge/full-CI canary before treating the pilot implementation as accepted infrastructure.

This PASS does not authorize:
- later WR-074 branch movement;
- broader self-hosted triggers;
- generic self-hosted routing;
- credential-bearing or custody workloads on self-hosted;
- arbitrary PR execution on self-hosted;
- a claim of performance superiority;
- unrelated infrastructure expansion without separate Manager scope.
