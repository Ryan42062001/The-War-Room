# WR-089 — Fresh Re-Audit of Remediated Protected Historical Scoring Bridge

Task: WR-089  
Role: Independent Auditor / QA  
Canonical workflow: V3.4  
Execution mode: STANDARD_CHAT_HIGH  
Refresh mode: FAST_REFRESH  
Audit target task: WR-083  
Audit target PR: #234  
Audit target branch: `wr-083-protected-historical-scoring-bridge`  
Exact frozen target SHA: `c9b13959f598b3633a78e2ff78d0862881982dd2`  
Manager freeze baseline / exact merge base: `ca7fda518386fc23f44344e78fc3b4169602c254`  
Canonical main verified at audit start: `19448b3f91fa2d89badaa9e42b28b1a5e5d830d1`

## Final verdict

`PASS`

Findings by severity:

- CRITICAL: none.
- HIGH: none.
- MEDIUM: none.
- LOW: none.

The two HIGH findings from WR-084 are independently closed on the exact frozen remediation target. The previously positive custody, source-binding, credential-isolation, no-scoring, chronology, cleanup, no-protected-artifact, and release-guard properties remain intact.

This verdict applies only to exact WR-083 target `c9b13959f598b3633a78e2ff78d0862881982dd2`. It does not authorize the Auditor to merge PR #234, reactivate WR-081, or execute real historical scoring.

## 1. Independence and live-state verification

This audit did not adopt the Work Helper remediation summary, Manager readiness conclusion, or WR-084 historical verdict as proof. Those materials were used only to identify claims and required checks; the implementation, workflow ordering, regression tests, GitHub branch/PR state, Actions jobs/logs/artifacts, target advancement, and accepted custody authority were independently inspected.

Live GitHub state at audit start:

- `main` exactly equals `19448b3f91fa2d89badaa9e42b28b1a5e5d830d1`;
- `wr-083-protected-historical-scoring-bridge` exactly equals frozen target `c9b13959f598b3633a78e2ff78d0862881982dd2`;
- audit branch `wr-089-protected-historical-scoring-bridge-reaudit` initially exactly equaled canonical main;
- PR #234 is OPEN and unmerged, targets `main`, and its live head branch is the frozen WR-083 branch;
- canonical `.ai/shared/ACTIVE_TASKS.json` assigns WR-089 to the Auditor and pins audit target task/PR/branch/SHA exactly;
- WR-081 remains BLOCKED on WR-089 and is not authorized for historical execution.

Target advancement was independently classified as non-overlapping. From Manager freeze baseline `ca7fda518386fc23f44344e78fc3b4169602c254` to current main, only these seven Manager/shared control-plane paths changed:

- `.ai/manager/HANDOFF.md`
- `.ai/manager/WR-083.md`
- `.ai/manager/WR-089.md`
- `.ai/manager/WR089_FREEZE.md`
- `.ai/shared/ACTIVE_TASKS.json`
- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`

The frozen WR-083 target changes exactly seven different authorized paths:

- `.ai/work_helper/HANDOFF.md`
- `.ai/work_helper/WR083_PROTECTED_HISTORICAL_SCORING_BRIDGE.md`
- `.ai/work_helper/WR083_PROTECTED_PROOF_SUMMARY.json`
- `.github/workflows/wr083-protected-historical-scoring-bridge.yml`
- `scripts/custody/test_wr083_protected_historical_scoring.py`
- `scripts/custody/wr083_protected_historical_scoring.py`
- `scripts/validate-release-candidate.mjs`

The two path sets do not overlap.

## 2. Frozen implementation identity

The credentialed remediated NO-SCORING proof executed at implementation/proof SHA:

`648ae9372bf2eb49e0fcebcf921d7bafd7d26d1b`

Independent Git comparison from that SHA to frozen target `c9b13959f598b3633a78e2ff78d0862881982dd2` shows only three Work Helper evidence files changed. The protected workflow, bridge script, and regression suite are byte-identical by Git blob identity at both SHAs:

- workflow blob: `00c3384d51a4717f993b93ef08f61d1963dba592`;
- bridge script blob: `19dc3bfb83b75e6ced9db111ca05bf446f67839e`;
- regression suite blob: `620fad20e0a3110b5e40b442f87fd6078b6aa5df`.

The credentialed proof itself independently hash-bound those reviewed files with SHA-256:

- bridge script: `b111a5566f64a3e334b946780c9bf6fb5579a995917615c33ce1d95e98733498`;
- regression suite: `a581a9a98b15af75e9eeacdade3fb66364dbb9900dec153aa91c0c89dd61ca34`;
- protected workflow: `cf83c12c213772012fcd4a2c5b430e8bff321f0ef229007ca3fa85eccc6cae38`.

Therefore the implementation exercised by the successful credentialed proof is the implementation audited at the frozen target.

## 3. WR-084-AUD-01 — Manager-bound future execution identity

### Requirement

Before any retained row or historical target can become consumer-visible, canonical Manager-controlled authority must bind the exact WR-081 execution branch, exact authorized branch-head SHA, exact consumer path, and exact Manager-reviewed consumer SHA-256. Caller-supplied workflow-dispatch values must not self-authorize. The remote branch head, checked-out commit, and reviewed consumer identity must be verified before retained retrieval/exposure, with race checks preserved through non-force publication.

### Independent code review

`validate_future_authorization(...)` in the frozen bridge:

- rejects `main` and requires an explicit `wr-081-*` execution branch;
- requires an exact 40-hex head SHA;
- confines the consumer to a non-traversing `.ai/research/**` path;
- requires an exact 64-hex consumer SHA-256;
- reads canonical `.ai/shared/ACTIVE_TASKS.json`;
- requires `manager_owned=true` and `canonical_branch=main`;
- requires exactly one active WR-081 record;
- requires WR-081 status `ASSIGNED` or `IN_PROGRESS`;
- requires `blocker_type=NONE` and no blocked-on task;
- requires Manager-owned `future_execution_authority`;
- validates the Manager authority itself;
- requires the active WR-081 task branch to equal the Manager-authorized branch;
- requires the complete caller tuple `branch/head_sha/consumer_path/consumer_sha256` to equal the Manager authority exactly.

A workflow-dispatch caller can supply values, but those values are only requests. They cannot grant authority because any mismatch with canonical Manager state fails closed.

`validate_live_remote_head(...)` rejects a live branch head that differs from the Manager-authorized SHA.

`validate_future_consumer(...)` independently requires the checked-out repository HEAD to equal the Manager-authorized SHA and requires the actual reviewed consumer file SHA-256 to equal the Manager-reviewed digest.

### Independent workflow-order review

The future authorized-scoring job orders the gates as follows:

1. start from canonical-main bridge/control-plane checkout;
2. validate Manager authority in the trust gate;
3. query the live remote WR-081 branch and require exact authorized-head equality;
4. check out the exact authorized WR-081 SHA without persisted credentials;
5. verify checked-out HEAD and the Manager-reviewed consumer path/digest;
6. only then retrieve retained objects;
7. re-query the live authorized branch immediately before consumer exposure;
8. execute the reviewed consumer in a provider-free sandbox;
9. validate and stage only approved evidence;
10. query the remote head before commit;
11. commit evidence;
12. query the remote head again immediately before push;
13. push without `--force`.

The retained retrieval step is downstream of Manager authority, remote-head, local-HEAD, consumer-path, and consumer-digest checks. Consumer exposure is downstream of an additional live remote-head recheck. No retained data or target reaches the consumer before those gates succeed.

### Negative-case verification

The frozen regression suite independently exercises fail-closed behavior for:

- an unreviewed workflow-dispatch head SHA;
- an unreviewed consumer path;
- an unreviewed consumer SHA-256;
- a same-repository checked-out commit that advanced away from the authorized SHA;
- a stale authorized branch head / live branch advancement;
- branch advancement between initial authorization and consumer exposure;
- blocked WR-081 authority;
- missing Manager `future_execution_authority`.

The implementation logic additionally fails malformed or absent Manager authority and requires exact tuple equality, so a different same-repository SHA cannot substitute for the Manager-authorized head.

### Verdict on WR-084-AUD-01

`CLOSED`

The prior HIGH finding is remediated. Future WR-081 execution identity is Manager-bound before retained retrieval/exposure, dispatcher values cannot self-authorize, and race protection remains through non-force push.

## 4. WR-084-AUD-02 — retained raw source publication exclusion

### Requirement

Future WR-081 publication must not durably commit retained raw source bytes even when a consumer places those bytes beneath an otherwise allowed research path. Publication validation must remain bound to independently verified retained-input identities through output validation, locking/merge, and final staging.

### Independent code review

`_retained_raw_sources(retained_manifest)`:

- requires a retained source set;
- obtains every retained source's expected SHA-256, byte size, and local raw path from the verified manifest;
- requires each raw path to remain under `RUNNER_TEMP`;
- independently re-hashes/re-sizes every raw source before it is accepted as publication-guard authority.

`publication_entries(output_dir, retained_manifest)`:

- requires a declared publication manifest;
- obtains the verified retained raw identity set before evaluating outputs;
- restricts paths to:
  - `.ai/research/WR081_*.json`
  - `.ai/research/WR081_*.md`
  - `.ai/research/generated/WR081_*.json`
  - `.ai/research/generated/WR081_*.md`;
- rejects absolute/traversing paths and duplicate publication paths;
- re-hashes/re-sizes each actual output and requires equality with its declaration;
- rejects any output whose digest+size equals a retained raw source identity;
- independently rejects exact-byte equality against any same-sized retained raw source.

Therefore an arbitrary `.ai/research/**` path is not enough to publish evidence, and matching raw bytes fail closed even under a syntactically allowed WR081 evidence path.

The retained-source guard is reapplied through the publication lifecycle:

- `run_sandboxed_consumer(...)` validates consumer output with `publication_entries`;
- `publication_tree_sha256(...)` revalidates before phase locking;
- `merge_publication(...)` revalidates before package merge and rejects mutation of an already frozen evidence path;
- `write_package_manifest(...)` binds the package to a deterministic retained-input identity-set digest;
- `stage_publication(...)` reloads the verified retained manifest and runs full publication validation again immediately before copying files into the WR-081 checkout for Git staging.

### Negative-case verification

The frozen regression suite proves:

- normal permitted WR081 JSON evidence can validate and stage;
- an arbitrary research filename outside the explicit WR081 pattern fails;
- exact retained raw bytes copied into allowed `.ai/research/generated/WR081_RAW_COPY.json` fail publication validation;
- the same retained-byte passthrough fails again at final staging;
- a previously frozen publication path cannot later be changed to different bytes.

### Verdict on WR-084-AUD-02

`CLOSED`

The prior HIGH finding is remediated. Retained raw bytes cannot pass merely because they are placed under an allowed research directory, and the raw-byte exclusion remains active at every publication boundary relevant to durable Git staging.

## 5. Source, custody, credential, and no-scoring re-verification

### Accepted immutable authority

The frozen bridge verifies exact SHA-256 before parsing the accepted source/cohort/protocol machine authority:

- WR-059 source snapshot:
  `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`;
- WR-059 cohort:
  `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`;
- WR-072 protocol/machine lock:
  `aed044e6b7df9684153181a7a97a47a86c50ce9049db063ecdd8a973b1a832b6`.

The authority loader requires exactly 14 Player Summary Stats source identities covering 2012 through 2025, zero Players metadata admission, and explicit exclusion of `draft_picks.csv` from acquisition/custody/parsing/use.

Credentialed proof run `35308823649` independently emitted the same accepted bindings and source identity-set SHA-256:

`8cbe874b3ceea141cbb9fedb2198ffa940ee218fe4556feace7afd8bbfb89351`

### Provider boundaries and retained-byte verification

Credentialed proof run `35308823649`, protected job `105486527602`, independently shows:

- exactly 14 verified retained inputs;
- B2 digest+size PASS for all 14;
- R2 digest+size PASS for all 14;
- B2/R2 byte equality true for all 14;
- provider mutation operations: 0;
- upstream source access: false;
- accepted B2 read-only boundary: PASS;
- R2 execution operations only `HeadObject` and `GetObject`;
- R2 execution mutation operations: 0;
- accepted R2 credential/scope anchor matched.

The accepted R2 access-key identity is SHA-256:

`17e95438e19777a414ee85d57c32d44466199a973c51e5b6f57e42a5384585bd`

WR-050 remains historical FAIL for its then-missing continuity proof, but its current R2 scope evidence independently establishes bucket `war-room-custody-backup`, `Object Read & Write` object permission, and absence of Admin Read & Write / bucket-configuration authority. WR-053 later independently returned PASS after binding the accepted current credential identities to a successful live B2/R2 custody proof in the same execution environment. The WR-083 proof requires the accepted R2 identity anchor and executes no provider mutation operation.

### Consumer isolation

The bridge's consumer boundary fails closed if any B2/R2 provider secret or configuration authority is present.

The credentialed proof reports:

- `consumer_provider_credential_presence=false`;
- consumer independent re-hash/re-size PASS count: 14.

The deliberate injection regression sets a provider variable in the consumer environment and the job fails the consumer invocation closed before accepting its report, then explicitly records the negative test as PASS.

### Runner-temporary raw custody and cleanup

Raw retained objects, the verified retained manifest, provider report, consumer report, sandbox proof, publication package, and execution checkout are confined to runner-temporary/workspace paths and removed by `if: always()` cleanup.

The credentialed proof log records cleanup PASS.

The protected workflow contains no `actions/upload-artifact` path. GitHub's artifact endpoint for credentialed protected run `35308823649` returns zero artifacts.

The ordinary Full War Room CI run does contain an unrelated WR-026 phone-review artifact; that is not a protected retained-data artifact and is not part of the WR-083 protected proof.

### No consumer/operator raw logging

The sandboxed consumer captures stdout/stderr and fails if either is non-empty. Provider secrets are not provided to the consumer. The synthetic sandbox conformance reports:

- network unshared: true;
- sealed target not mounted: true;
- operator output empty: true.

### Prediction-lock-before-target-exposure chronology

The frozen future execution plan exposes only seasons prior to a target season during prediction and only the target season during target-ingest.

For each fold:

1. prediction output is produced without target values;
2. output is retained-manifest-validated and immutably locked;
3. only then is target-season input mounted;
4. target ingest must bind the frozen prediction lock;
5. stage-gate output is similarly locked before progression.

Synthetic chronology conformance passes development, validation, and confirmation sequencing and proves fail-closed behavior for target exposure before prediction lock and invalid stage ordering.

### No-scoring boundary

Credentialed proof run `35308823649`:

- preflight `105486418552`: SUCCESS;
- trust gate `105486504930`: SUCCESS;
- protected NO-SCORING proof `105486527602`: SUCCESS;
- future authorized WR-081 scoring `105486528622`: SKIPPED;
- workflow artifacts: 0.

Its proof summary states:

- `real_scoring=false`;
- `historical_targets_exposed=false`;
- no real retained CSV was parsed by the no-scoring consumer;
- historical features were not constructed;
- no model was fit;
- no predictions were emitted;
- no baselines were compared;
- no result gates were calculated;
- development/validation/confirmation outcomes were not inspected;
- 2026 regular-season outcomes were not inspected.

This audit itself performed none of the prohibited historical-scoring activities.

## 6. Release validation and unrelated product scope

The release validator's workflow allowlist adds exactly the Manager-approved WR-083 protected workflow while continuing to compare the complete tracked workflow set using exact equality. The frozen WR-083 regression suite and final-head preflight both exercise the release guard.

No WR-083 target path is under `src/**` or `public/**`. The frozen target makes no production ranking/model/composition/Phase-6 product change.

## 7. Exact frozen-target CI and regression evidence

Exact frozen WR-083 head `c9b13959f598b3633a78e2ff78d0862881982dd2`:

Full War Room CI `35309111018` — SUCCESS:

- classify `105487272881` — SUCCESS;
- governance `105487309809` — SUCCESS;
- full test `105487359262` — SUCCESS.

Final-head protected/custody regressions:

- WR-083 protected bridge `35309111079` — preflight SUCCESS; privileged/no-scoring/future jobs correctly skipped for the ordinary PR event;
- WR-046 custody fixture proof `35309111050` — contract preflight SUCCESS;
- WR-063 version-aware retained-object read `35309111093` — contract preflight SUCCESS;
- WR-069 retained safe-consumer parser `35309111021` — contract preflight SUCCESS.

The live credentialed custody/no-scoring authority remains run `35308823649`, whose reviewed implementation blobs are independently identical to the frozen target.

## 8. Findings

No finding was identified.

The two WR-084 HIGH findings are closed without weakening previously accepted controls.

## 9. Manager action authorized

On this exact target only, Manager is authorized to consume WR-089 as a PASS-family audit and proceed with the next canonical Workflow V3.4 gate:

1. verify WR-083 PR #234 still identifies the exact audited target `c9b13959f598b3633a78e2ff78d0862881982dd2`;
2. integrate only that exact audited bridge under Manager authority;
3. run the required protected canonical-main post-merge canary;
4. only if that canary succeeds, perform the explicit Manager control-plane transition required before WR-081 can be reactivated.

This audit does not itself merge WR-083, reactivate WR-081, or authorize bypassing the post-merge canary.

## 10. Audit boundary attestation

Auditor modified or merged WR-083 / PR #234: NO.  
Auditor modified the frozen target: NO.  
Auditor performed real WR-081 historical scoring: NO.  
Auditor exposed historical targets: NO.  
Auditor inspected historical model outcomes: NO.  
Auditor inspected 2026 regular-season outcomes: NO.  
Auditor modified non-`.ai/auditor/**` surfaces: NO.

`real_scoring=false`  
`historical_targets_exposed=false`

Final verdict: `PASS`
