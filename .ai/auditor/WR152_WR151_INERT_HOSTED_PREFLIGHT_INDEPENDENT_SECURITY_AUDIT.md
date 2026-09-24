# WR-152 — Fresh Independent Pre-Execution Security / Workflow Audit of WR-151

**Date:** 2026-09-23 (America/New_York) / 2026-09-24 UTC  
**Role:** Independent Auditor / QA, fresh separate lane  
**Workflow / mode:** V3.5 canonical; STANDARD_CHAT_HIGH / FAST_REFRESH  
**VERDICT: FAIL — REMEDIATION REQUIRED**  
**Boundary:** STATIC source and real CI/log review only. No pilot, sudo, namespace, browser, service worker or network probes were executed by WR-152. No isolation, runner qualification, recovery A → B → A, Pages, A6, release or production claim.

## Exact immutable custody, independently checked

- Repository: `Ryan42062001/The-War-Room`; canonical `main` and initial Auditor branch `wr-152-wr151-inert-preflight-independent-security-audit` both `a79d245b3368821c2f5d80404361bd319e86ea9b`, compared identical (0 ahead / 0 behind).
- Frozen Builder PR [#422](https://github.com/Ryan42062001/The-War-Room/pull/422): DRAFT / OPEN / UNMERGED, head `fc6bbbf292462224dd108ebb8909daea149df44c`, base `55e3de8068c974870cd245811302741d322ba4ae`, 10 ahead / 0 behind. Live label list empty; `wr151-inert-preflight-reviewed` absent. Manager [freeze comment #5806008717](https://github.com/Ryan42062001/The-War-Room/pull/422#issuecomment-5806008717) checked; frozen head rechecked unchanged immediately before publication.
- Exact cumulative five files independently compared / read at the frozen head:
  1. `.github/workflows/ci.yml` (blob `140e95e999515fdf0a211b623eb34bf9ddc06e59`)
  2. `scripts/wr150-loopback-netns.sh` (blob `ff3876ce2f5411a913e0ff4662b9a283ab2238c4`)
  3. `scripts/wr150-loopback-preflight.mjs` (blob `c582b68f6364f13315d016ba2dd62c50ef83be7f`)
  4. `.ai/builder/WR151_INERT_HOSTED_RUNNER_PREFLIGHT_IMPLEMENTATION.md` (blob `ab2e9b5b8e55ef51e4326cf3b92538c5c6257096`)
  5. `.ai/builder/HANDOFF.md` (blob `00501097e312c83d7e2b28ae0c2d5b9196b538a5`).
- Read canonical `.ai/shared/WORKFLOW.md`, `.ai/shared/ACTIVE_TASKS.json` with WR-152 exact `audit_target_sha`, `.ai/roles/AUDITOR.md`, `.ai/manager/WR-151.md`, `.ai/manager/WR-152.md`, `.ai/auditor/HANDOFF.md`, and `.ai/work_helper/WR150_HOSTED_RUNNER_ISOLATION_QUALIFICATION.md`. WR-150 is scoped diagnosis, not isolation PASS.
- [Final target CI #35943519728](https://github.com/Ryan42062001/The-War-Room/actions/runs/35943519728) is a genuine `pull_request` run at exact `fc6bbbf292462224dd108ebb8909daea149df44c`, SUCCESS. Jobs independently inspected: classify `107456373576` SUCCESS and `full_ci=true`; Governance `107456399595` SUCCESS, state errors `[]`, regressions PASS and `AUDIT_HEAD_SHA=fc6bbbf292462224dd108ebb8909daea149df44c`; actual FULL product `107456432505` SUCCESS with Chromium installation, browser/product/npm tests and `WR136_TERMINAL_TURN_REPAIR_PASS`; dedicated `107456374579` SKIPPED; bootstrap `107456400259` SKIPPED. Read actual classify, Governance and product logs, not merely PR badges. This full CI neither executed nor qualified the dedicated pilot.
- [Initial opened-run #35943280524](https://github.com/Ryan42062001/The-War-Room/actions/runs/35943280524) SUCCESS at historical head `aa8aa29fd24b939b5081c054a32919e84f820e86`, classify `107455663223` SUCCESS, Governance `107455689693` SUCCESS, product `107455735145` SUCCESS, dedicated `107455664008` SKIPPED. Historical head is not transferred as audit target.
- WR-D078 activation canonical-main [push run #35944843152](https://github.com/Ryan42062001/The-War-Room/actions/runs/35944843152) completed SUCCESS at `a79d245b3368821c2f5d80404361bd319e86ea9b`, Governance job `107460439958` SUCCESS.
- This report is a fresh independent examination of actual source. Builder statements, Manager source-readiness summary and green normal CI are not substitutes for independent security acceptance.

## Blocking findings

### WR152-H01 — HIGH / BLOCKING — Event-head custody is self-referential and cannot enforce reviewed-head-only privileged execution

**Requirement:** WR-151/WR-152 require first privileged trigger only after independent exact-head acceptance and a further separate Manager decision on the SAME unchanged frozen Builder head; a label is not trusted audit authority. An unreviewed PR head must not be able to run the privileged job.

**Evidence:** `.github/workflows/ci.yml` job `wr151-inert-hosted-loopback-preflight.if` checks `pull_request:labeled`, `event.label.name`, draft/open/main, same repo and named Builder branch, but does NOT compare `github.event.pull_request.head.sha` to frozen `fc6bbbf292462224dd108ebb8909daea149df44c` or an independently trusted reviewed-head authorization. Checkout uses `ref: github.event.pull_request.head.sha`; the later shell asserts `git rev-parse HEAD == EXPECTED_HEAD`, where `EXPECTED_HEAD` comes from that same event. Its base/package comparison is also event-relative. Such self-consistency does not prove the head was independently reviewed. No actor-specific Manager authority, consumed one-time approval receipt or other trusted gate is enforced.

**Failure / impact:** After a same-repo branch head changes, a new labeled action by anyone with label permission could run the privileged hosted job against the new, unreviewed head. Relabeling and head-change/approval races are not technically prevented by the current job condition. The untrusted PR's own workflow file can also change before such an event; a constant embedded only in a mutable PR workflow is not a complete trusted authorization mechanism. This is a *prospective trigger vulnerability*, not evidence of an already executed pilot; current label is absent.

**Required remediation:** Manager and Builder must design a trusted, fail-closed, exact immutable source and one-time approval gate that is outside unreviewed PR control and verifies actual run event/head at execution; prevent labelers, relabel/reopen and synchronize races from granting unreviewed code a privileged run. Preserve no `pull_request_target`, no self-hosted runner and the scope restrictions, or report that a safely enforceable first trigger is unavailable. An operational instruction to check the head manually without executable enforcement cannot alone close this finding. Explicitly negative-test a nonfrozen head with the purpose label, relabel, event race and workflow-head movement before approving any pilot.

**Confidence:** HIGH — direct executable YAML/event-derived custody analysis. **Status:** OPEN / BLOCKING.

### WR152-H02 — HIGH / BLOCKING — Host network-capable IPC access is not comprehensively excluded

**Requirement:** The complete unprivileged Node→Chromium/SW tree must have no accessible host network relay, inherited broker/Unix socket or FD path; absence must be demonstrated rather than inferred from a partial path scan.

**Evidence:** `scripts/wr150-loopback-netns.sh` mounts tmpfs on `/run`, `/tmp`, `/var/tmp`, `/dev/shm`, then runs `find /home/runner/work /home/runner/.cache -type s -print -quit`. It does not independently isolate the PID namespace or remount/restrict `/proc` from host-process inspection; neither all other reachable directories nor process-root, cwd, mapped paths and host process FDs are closed by the selected two-root scan. `verifyNoInheritedBrokerSocket()` only inspects own FDs above 2 at fixture entry; descendants are checked for netns/UID/effective capabilities, not all network-capable host IPC endpoints. The mount/scan design may fail closed when a scanned socket exists, but a clear scan cannot certify *all* reachable host IPC is absent.

**Failure / impact:** A process confined to a loopback-only network namespace can still potentially relay via an accessible host-namespace Unix socket or host-process filesystem endpoint. A later `WR151_PREFLIGHT_INERT_PASS` (without the invisible character) could misleadingly claim confinement while such an egress-capable broker remains reachable. No actual exploit or runtime escape has been claimed; the source has not proven exclusion as required.

**Required remediation:** Establish an explicit allowlist/deny-all host IPC boundary (including exposed filesystem roots, `/proc`/host PID and inherited-descriptor access) for all launched descendants, or provide an independently justified and verifiable equivalent. Test attempted host-broker access and demonstrate denial with independent process/IPC observations; do not accept a scan of two directories as global proof. If safely complete exclusion cannot be provided for this hosted runner, fail `NO_QUALIFIED_RUNNER` rather than use WSL, a host proxy, or relax isolation.

**Confidence:** HIGH for documented coverage gap; runtime exploitability unverified. **Status:** OPEN / BLOCKING.

### WR152-M01 — MEDIUM / BLOCKING — Cleanup suppresses namespace PID-enumeration errors and can issue unproven success

**Requirement:** Teardown must positively establish no residual Node/Chromium/SW/fixture processes, then namespace/profile removal, and emit success only on verified cleanup.

**Evidence:** In `scripts/wr150-loopback-netns.sh` `cleanup()`, both loop and final `remaining="$(sudo -n ip netns pids "$namespace" 2>/dev/null || true)"` transform an enumeration error into the same empty string as an actual no-process result. The function can then delete the namespace name, remove workdir and emit `WR151_CLEANUP_PASS ... descendants_gone=true` without an affirmative successful PID-enumeration receipt. Deleting a namespace name does not force-terminate processes still referencing the namespace.

**Failure / impact:** An enumeration error or inaccessible process could be misclassified as a clean teardown and create a false-positive security receipt.

**Required remediation:** Make every process-enumeration error distinguishable from empty successful enumeration; retain initial/final PID sets and verify process exit and namespace inode/liveness across teardown, including error injection. A failure to prove absence MUST set nonzero/UNVERIFIED, never `CLEANUP_PASS`.

**Confidence:** HIGH, direct shell error-handling analysis. **Status:** OPEN / BLOCKING.

### WR152-M02 — MEDIUM / BLOCKING — Chromium worker OS PID attribution is not tied to the controlling CDP worker identity

**Requirement:** Independently identify the *controlling* page's service-worker OS process and demonstrate complete browser/worker descendant custody throughout the negative probes.

**Evidence:** `scripts/wr150-loopback-preflight.mjs` independently confirms a unique CDP `service_worker` target with the desired script URL and separately searches all observed Chromium descendants for kernel thread names matching `/service.?worker/i`. `workerCandidates.length===1` proves a unique name match, not that the matching OS PID hosts the observed controlling target. `inspectBrowserTree()` uses two point-in-time `/proc` parent scans and catches disappearing processes, without a definitive target↔renderer process identifier or proof covering detached/transient browser descendants.

**Failure / impact:** A matching unrelated worker thread or unobserved transient/reparented process could be attributed to the fixture's controller; `allDescendantsSameNetns` and `serviceWorkerPid` receipts may overstate what was independently observed. Positive controller/local fetch and per-origin Playwright requestfailed receipts do not themselves make an unrelated kernel name a verified target-to-PID association.

**Required remediation:** Bind the exact CDP worker target/session to a defensible OS process identity and track/reconcile all relevant browser/renderer/SW descendants and their namespace/UID/caps across the probes and teardown, including multi-worker, detached-process and missing-PID negative controls. If the runtime lacks a credible mapping, fail UNVERIFIED, never substitute a generic kernel thread name.

**Confidence:** HIGH for missing identity proof; actual browser layout unexecuted/unknown. **Status:** OPEN / BLOCKING.

## Additional source observations, not additional verdicts

- **Dormancy / workflow preservation verified within supplied events:** GitHub's job-level `pull_request:labeled` action/label predicate is false for ordinary `push`, `opened`, `reopened` and `synchronize`; current genuine initial and exact-head runs showed dedicated SKIPPED and existing FULL product/ Governance SUCCESS. `on.push` and the three ordinary PR actions remain. Scope exactly five files; no product, lockfile, public Pages or external provider assets were changed in the target diff.
- **Hosted-only intended job:** fixed `runs-on: ubuntu-24.04`, `permissions: contents: read`, explicit event-head checkout with `persist-credentials:false`, no job deployment environment, no `pull_request_target` or `workflow_dispatch` in this dedicated path. These features do not cure H01. Code executes its provisioning on the hosted VM *before* netns isolation; exact reviewed dependency/executable-input custody remains necessary.
- **Inert fixture design:** literal local HTML, `/sw.js`, `/ok` on `127.0.0.1`; documentation-reserved literal IPv4 `198.51.100.1` and IPv6 `2001:db8::1` negative probes, without War Room assets or provider URLs. Code explicitly sets `HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY` then removes them *before* Chromium launch; the second scenario instead checks an explicit Chromium proxy at the reserved IPv4 address. A future receipt must describe that distinction honestly; temporary env assignment is not proof that Chromium handled inherited proxy env.
- **Runtime status:** no namespace route/IPv4/IPv6, Chromium, SW, proxy, host IPC or cleanup receipt exists yet. Browser `ERR_*` strings and direct Node socket ENETUNREACH/EHOSTUNREACH are complementary observations, not substitutes for proven browser/SW process confinement. A browser error such as `ERR_PROXY_CONNECTION_FAILED` alone does not prove OS-level egress denial. Historical hosted Chromium availability is not a future environment capability guarantee.
- Findings above are independently blocking BEFORE pilot; no executing the pilot as a debugging shortcut and no weakening first-trigger constraints.

## Exact next Manager action

Manager must independently review this **FAIL — REMEDIATION REQUIRED**, verify Builder PR #422 remains unchanged at `fc6bbbf292462224dd108ebb8909daea149df44c` and its label absent, and keep it DRAFT / UNMERGED / UNLABELED with NO pilot. If accepted, authorize bounded SAME-TASK WR-151 Builder remediation specifically for H01, H02, M01 and M02 (and corresponding negative controls) on the existing unmerged Builder PR, with no extra file path without explicit separately reviewed scope authority. After Builder publishes a new immutable head, obtain applicable exact-head FULL CI/Governance/product and pilot SKIPPED, have Manager freeze that NEW head, and appoint a **fresh, separate** independent security/workflow Auditor for re-audit. This WR-152 FAIL and prior exact-head CI do not transfer to a modified target. If no safely enforceable trigger and host IPC boundary can be achieved, report `NO_QUALIFIED_RUNNER` and defer the local surrogate; production/recovery/A6/release state remains unchanged.

**Auditor publication:** Exactly two Auditor-only files on separate dedicated branch/one DRAFT PR. The final Git commit SHA and future actual Governance run/job IDs cannot truthfully be embedded in the already frozen commit; verify and record them in the resulting draft Auditor PR description or Manager intake, with no third path/target write. Do not merge own Auditor PR or Builder PR, label, dispatch or execute pilot.
