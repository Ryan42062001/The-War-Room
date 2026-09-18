# WR-084 — Independent Audit of Protected Historical Scoring Bridge

Date: 2026-09-18

Role: Independent Auditor / QA

Canonical workflow: V3.4

Execution mode: STANDARD_CHAT_HIGH

Refresh mode: FAST_REFRESH

Audit branch: `wr-084-protected-historical-scoring-bridge-audit`

Audited target: WR-083 / PR #234 / branch `wr-083-protected-historical-scoring-bridge`

Exact frozen target: `4ac5fa2c6148960094fde81b217bd3af080e4213`

Freeze baseline / merge base: `8855e00e19d37c0cffca9d2c392262f34febe9cd`

Canonical main verified at audit start: `8e8711dc2a50a066ba4811cb17365a5549e97d1c`

## Final verdict

FAIL — REMEDIATION REQUIRED

The protected pre-audit NO-SCORING proof is independently supported: the exact 14 admitted retained Player Summary Stats identities are correctly frozen and re-verified; B2/R2 retrieval is non-mutating in this execution path; retained bytes agree by accepted SHA-256 and size before consumer use; provider credentials are absent from the consumer; raw bytes are runner-temporary and cleaned; no raw Actions artifact exists; the reviewed bridge implementation is byte-identical at the final frozen target; the no-scoring live proof exposed no historical targets and performed no model scoring.

However, the future authorized-scoring path does not satisfy two explicit fail-closed requirements of WR-083:

1. the dispatched WR-081 expected head / consumer identity is not bound to Manager-authorized canonical state before retained rows and historical targets can reach the consumer; and
2. the publication guard allows any consumer-declared file under `.ai/research/**`, including an exact copy of retained raw source bytes, to be staged, committed, and pushed.

Both defects are on the custody/trust boundary that WR-084 is required to certify before real WR-081 scoring is allowed. No real WR-081 scoring was performed during this audit.

## Exact target and live-state verification

PASS for exact-target identity and non-conflicting integration shape.

At audit start:

- canonical `main`: `8e8711dc2a50a066ba4811cb17365a5549e97d1c`;
- WR-084 audit branch: same canonical head;
- PR #234: OPEN and unmerged;
- PR #234 exact head: `4ac5fa2c6148960094fde81b217bd3af080e4213`.

Compare `8855e00e19d37c0cffca9d2c392262f34febe9cd...4ac5fa2c6148960094fde81b217bd3af080e4213` is ahead 25 / behind 0 with the exact freeze baseline as merge base and exactly the seven authorized WR-083 paths:

- `.ai/work_helper/HANDOFF.md`;
- `.ai/work_helper/WR083_PROTECTED_HISTORICAL_SCORING_BRIDGE.md`;
- `.ai/work_helper/WR083_PROTECTED_PROOF_SUMMARY.json`;
- `.github/workflows/wr083-protected-historical-scoring-bridge.yml`;
- `scripts/custody/test_wr083_protected_historical_scoring.py`;
- `scripts/custody/wr083_protected_historical_scoring.py`;
- `scripts/validate-release-candidate.mjs`.

Canonical advancement from the freeze baseline to current main changes only Manager/shared freeze-and-activation surfaces and does not overlap those seven target paths. GitHub reports PR #234 `mergeable: true` and `rebaseable: true`; its live `mergeable_state` was `unstable`, not `dirty`. No file conflict or unaudited conflict-resolution byte is required by the observed advancement.

The audit failure is therefore not an integrability failure.

## V3.4 reconciliation / reviewed implementation identity

PASS.

The final frozen target preserves the reviewed protected implementation bytes exactly. Independent SHA-256 over the final frozen target and reviewed proof target `cb854442b0acc18a75c4b04e6f477be75480404f` produced identical bytes and the expected digests:

- bridge script: `6218de40d9e65dceee64e77397f019572d1c49abd580d473051187f2f756e44e`;
- tests: `d046e556ecda1b94eb1966a26eadd0e676845aaade2bb6e5319e279a7625c07a`;
- workflow: `6a317eb1167e8881aabf3777bb877bd1901f59a14a4ecb374eb7b34bcfade779`.

Compare from Work Helper final head `be968a2b6439197a119069209dc42f5481267f4d` to the frozen target shows later V3.4/control-plane reconciliation without any WR-083 target-file delta. The bridge implementation itself was not rewritten by the V3.4 reconciliation.

## Accepted frozen authority

PASS.

Independent hashing of the target's accepted authority files reproduced:

- source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059`:
  `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`;
- cohort `returning-player-v2-cohort/1.2.0-wr059`:
  `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`;
- WR-072 protocol / machine lock:
  `aed044e6b7df9684153181a7a97a47a86c50ce9049db063ecdd8a973b1a832b6`;
- protocol ID `returning-player-v2-model-protocol/1.2.0-wr072`;
- gates ID `returning-player-v2-result-gates/1.2.0-wr072`.

The source snapshot independently expands to exactly 14 admitted annual stats records, one per season 2012 through 2025, zero admitted Players metadata, and one failed-closed metadata source.

Reconstructing the bridge's canonical source identity set from season, asset ID, SHA-256, byte size and content-addressed custody key independently reproduced:

`8cbe874b3ceea141cbb9fedb2198ffa940ee218fe4556feace7afd8bbfb89351`.

`draft_picks.csv` remains explicitly excluded with acquired/custodied/parsed/used all false and no replacement provider.

Accepted WR-042 / WR-059 / WR-063 / WR-069 / WR-072 authority remains consistent with these bindings.

## Provider read-only execution boundary

PASS for the execution path.

The bridge loads the accepted WR-063 retained-version reader and requires the dedicated B2 read credential. The reader independently fails closed unless the live B2 authorization is bound to:

- bucket `War-Room-Custody-Primary`;
- exact prefix `custody/sha256/`;
- required `listFiles` + `readFiles`;
- no write/delete/bypass-governance capability.

B2 execution operations are authorization, exact retained-version listing and immutable file-ID download.

R2 execution uses only:

- `HeadObject`;
- `GetObject`.

The accepted R2 credential identity is bound to the WR-053 anchor:

`17e95438e19777a414ee85d57c32d44466199a973c51e5b6f57e42a5384585bd`.

WR-050 established the accepted bucket-scoped Object Read & Write policy envelope with no bucket-configuration/admin authority; WR-053 independently bound the current credential identity to a successful live custody proof. WR-083 exercises only read operations from that credential.

No provider mutation call is present in the WR-083 execution path.

## B2/R2 identity equality before consumption

PASS.

For each of the exact 14 identities, provider phase:

1. resolves only retained B2 uploads matching accepted size and metadata digest;
2. downloads by immutable B2 file ID;
3. verifies B2 SHA-256 + byte size against frozen authority;
4. reads the exact R2 content-addressed key;
5. verifies R2 SHA-256 + byte size against frozen authority;
6. verifies B2 and R2 bytes are byte-for-byte equal;
7. only then publishes the runner-local verified manifest for consumer use.

The credentialed live proof run independently observed 14/14 B2 digest/size PASS, 14/14 R2 digest/size PASS and 14/14 equality PASS.

## Consumer credential isolation and independent re-hash

PASS.

The NO-SCORING consumer is launched through an explicit clean environment using `env -i` with only non-provider runtime variables.

The bridge independently rejects provider authority variables in the consumer environment. The live proof deliberately injected `WR_CUSTODY_R2_ENDPOINT`; the consumer failed closed exactly as required.

The consumer independently re-hashes and re-sizes every local retained input before accepting it. The live proof recorded 14/14 consumer re-hash/re-size PASS.

## Runner-temporary storage, cleanup, logs and artifacts

PASS for the protected retrieval/proof path.

Raw inputs, verified manifests and provider/consumer reports are required to be children of `RUNNER_TEMP`.

Provider-phase exceptions clean raw bytes/manifests/reports. Future-execution exceptions clean sandbox/publication staging, and the sandbox root is removed in `finally`.

Both protected workflow jobs use `if: always()` cleanup for their runner-temporary source/publication locations.

The credentialed NO-SCORING job recorded cleanup PASS.

The live proof workflow has no `actions/upload-artifact` step. GitHub's artifact API for proof run `35300775802` returned zero artifacts; reconciled-head WR-083 run `35305591290` also returned zero artifacts.

The exact-head full War Room CI did publish an unrelated WR-026 phone-review artifact; that artifact is not produced by the protected bridge and is not retained-custody material.

The sandboxed consumer is rejected if it writes to stdout or stderr, preventing consumer/operator log emission of retained rows.

## No replacement source / forbidden predictors

PASS.

The bridge has no upstream nflverse/GitHub source reacquisition path. It consumes only the accepted source snapshot and retained B2/R2 custody identities.

The accepted source snapshot and bridge authority checks require:

- 14 stats sources only;
- zero admitted Players metadata;
- `draft_picks.csv` unused;
- no replacement provider.

WR-072 / WR-077 authority independently preserves zero Players-metadata/draft-capital predictors.

## Prediction lock and stage chronology

PASS for the bridge chronology mechanism.

The chronology guard enforces development -> validation -> confirmation and fails closed when target access occurs before a prediction lock.

The future wrapper's real execution sequence per target season is:

1. mount only pre-target-season retained rows;
2. run `predict`;
3. hash-lock the prediction publication;
4. only then mount the target season;
5. run `target-ingest`;
6. require target ingest to acknowledge the exact prediction lock;
7. lock target-ingest publication;
8. evaluate the stage gate against locked prediction evidence.

A failed development/validation gate prevents progression.

The target's preflight independently ran synthetic chronology regression and reported PASS.

## Pre-audit NO-SCORING proof boundary

PASS.

Protected proof run `35300775802` is bound to reviewed implementation/proof SHA `cb854442b0acc18a75c4b04e6f477be75480404f` and completed SUCCESS:

- preflight `105462795952` — SUCCESS;
- trust-gate `105462928597` — SUCCESS;
- protected-no-scoring-proof `105462958770` — SUCCESS;
- future-authorized-wr081-scoring `105462959719` — SKIPPED.

The live trust gate proved the exact repository, actor and WR-083 branch and selected `no-scoring`.

The live proof reported:

- `real_scoring=false`;
- `historical_targets_exposed=false`;
- consumer provider credentials absent;
- 14 retained inputs independently re-hashed;
- provider mutation operations 0;
- sandbox network unshared;
- sealed target not mounted;
- operator output empty.

No target join, Ridge fit, prediction inspection, baseline comparison or result-gate evaluation occurred in this audit or in the reviewed pre-audit proof.

## Reconciled-head validation

PASS as regression evidence, not as a substitute for this audit.

At exact frozen target `4ac5fa2c6148960094fde81b217bd3af080e4213`:

- Full War Room CI `35305591247` — SUCCESS;
  - classify `105477013314` — SUCCESS;
  - governance `105477036724` — SUCCESS;
  - full test `105477068265` — SUCCESS;
- WR-083 protected bridge run `35305591290` — SUCCESS, preflight SUCCESS and credentialed jobs skipped as expected for PR execution;
- WR-046 `35305591251` — SUCCESS;
- WR-063 `35305591242` — SUCCESS;
- WR-069 `35305591273` — SUCCESS.

The exact-head WR-083 preflight reproduced the 14-source authority binding, synthetic chronology, sandbox conformance, WR-083 regression suite, accepted WR-063 reader regression and fail-closed release allowlist.

Passing CI does not cure the two future-execution boundary defects below because the regression suite does not test those missing invariants.

## Finding WR-084-AUD-01 — HIGH — future execution SHA/consumer identity is not Manager-bound before retained target exposure

### Requirement

WR-083 requires:

- reviewed consumer code hash-bound to the exact reviewed implementation;
- workflow/ref gates that prevent arbitrary PR/fork code, branch substitution and target-branch race;
- future scoring only after Manager authorization;
- output to the explicitly authorized WR-081 execution branch only while its expected head still matches.

### Evidence

The canonical active WR-081 record currently supplies a branch and blocked checkpoint, but no future authorized execution SHA, consumer path or consumer digest.

`validate_future_authorization(control_repo, execution_branch)` verifies only:

- branch name starts with `wr-081-` and is not `main`;
- exactly one active WR-081 task exists;
- registry branch equals the supplied branch;
- task status is ASSIGNED or IN_PROGRESS;
- no blocker remains.

It does not receive or verify `expected_head_sha`, `consumer_path`, or `consumer_sha256`.

For `workflow_dispatch`, those three values are caller-supplied inputs. The trust gate verifies their format and `.ai/research/**` prefix, but no canonical Manager artifact binds them.

`validate_future_consumer` verifies the checkout's local HEAD equals the caller-supplied expected SHA and the consumer bytes equal the caller-supplied digest. It does not prove that SHA is the current head of the Manager-authorized branch or that the digest is a Manager-reviewed digest.

The workflow first:

- retrieves retained provider data;
- checks out the caller-supplied expected SHA;
- executes the consumer against historical retained rows/targets;
- stages publication.

Only afterwards, immediately before commit/push, does the workflow call `git ls-remote` and compare the Manager-authorized branch's remote head to the supplied expected SHA.

The existing regression test verifies local wrong-SHA/path/digest rejection but does not test a same-repository commit that is not the authorized branch head or a stale authorized-branch head before target access.

### Failure

A trusted dispatch can supply a valid same-repository commit SHA not equal to the current authorized WR-081 branch head, along with a matching self-supplied consumer digest. That consumer can execute against retained historical data before the later remote-head check fails.

The late check prevents a stale result push, but it does not prevent branch-substituted or stale code from receiving retained rows and historical targets.

### Impact

This breaks the fail-closed execution trust boundary before real historical target exposure. The owner/actor gate reduces external attacker reach, but it does not satisfy the repository's requirement that future scoring execute only the exact Manager-authorized reviewed target.

### Required remediation

Before provider data is supplied to the scoring consumer:

1. bind exact WR-081 execution branch + exact head SHA + consumer path + consumer SHA-256 to Manager-controlled canonical authority, or otherwise derive and verify the exact authorized branch head from live GitHub state before execution;
2. verify the checked-out commit is exactly the authorized branch head before any retained row/target becomes consumer-visible;
3. verify the consumer digest/path against Manager-reviewed authority, not merely a digest supplied in the same dispatch;
4. retain the existing second remote-head race check immediately before non-force push;
5. add fail-closed tests for unrelated same-repository SHA, stale branch SHA, unreviewed consumer digest/path and branch advancement between authorization and execution.

### Validation required

One new immutable WR-083 target, exact-head full CI/protected preflight, and fresh independent audit demonstrating the pre-execution branch/SHA/consumer binding.

Confidence: HIGH.

## Finding WR-084-AUD-02 — HIGH — future publication guard can commit retained raw bytes under an allowed research path

### Requirement

WR-083 explicitly requires raw retained bytes to be never committed, uploaded as Actions artifacts, printed, or left after execution.

Future authorized output is restricted to complete authorized WR-081 evidence under `.ai/research/**`; that path authorization must not become a raw-byte exfiltration path.

### Evidence

`copy_visible_sources` copies exact retained raw source bytes into the consumer-visible sandbox input.

The consumer has a writable output directory.

`publication_entries` validates each consumer-declared output only for:

- path under `.ai/research/**`;
- no traversal;
- valid declared SHA-256;
- valid byte size;
- no duplicate path;
- actual output digest/size matches the consumer-declared values.

It does not compare publication bytes/digests to any retained input identity and has no raw-input exclusion rule.

`merge_publication` copies every validated consumer-declared file into the publication package.

`stage_publication` copies that package into the WR-081 execution checkout.

The workflow then executes:

`git -C wr081-execution add .ai/research`

and commits/pushes all staged `.ai/research/**` files.

The regression `test_publication_manifest_restricts_research_paths` tests path confinement, but does not test that a consumer cannot copy one of its visible retained raw input files to an allowed `.ai/research/**` output path.

### Failure

A future scoring consumer can copy an exact retained raw input into, for example, an allowed `.ai/research/generated/**` path, declare the copied file in its publication manifest, and the bridge will accept, stage, commit and push it.

The path guard therefore does not mechanically enforce WR-083's no-raw-commit requirement.

### Impact

A consumer defect could durably place retained source bytes into Git history despite the custody contract. This is a direct failure of the raw-byte containment boundary WR-084 must certify before real scoring is permitted.

No such leak occurred in the NO-SCORING proof; this finding concerns the future authorized scoring/publication path.

### Required remediation

Add a fail-closed publication-level raw-byte exclusion before staging or commit. At minimum:

1. bind the publication validator to the verified retained-input manifest;
2. reject publication whose digest/size or exact bytes equal any retained raw source object;
3. preserve an explicit allowlist/contract for authorized WR-081 evidence paths and evidence types sufficient to prevent source-file passthrough;
4. add synthetic tests where the consumer attempts to publish an exact retained input under `.ai/research/**` and prove the bridge rejects it;
5. keep the existing no-artifact/no-log/cleanup protections.

### Validation required

One new immutable WR-083 target with raw-publication negative tests green, exact-head CI, and fresh independent audit.

Confidence: HIGH.

## Release validation and unrelated behavior

PASS.

The release guard adds exactly the Manager-approved WR-083 workflow to the explicit workflow allowlist and still compares the entire tracked workflow set for exact equality.

The exact-head protected preflight ran `npm run test:release` successfully.

The frozen target changes no:

- `src/**`;
- `public/**`;
- ranking implementation;
- production recommendation behavior;
- season-total composition;
- Phase-6 product surface;
- source snapshot/cohort/protocol evidence;
- production provider state.

No unrelated product behavior change was found.

## Findings by severity

- CRITICAL: none.
- HIGH:
  - `WR-084-AUD-01` — future execution SHA/consumer identity is not Manager-bound before retained target exposure;
  - `WR-084-AUD-02` — publication guard can commit retained raw bytes under an allowed `.ai/research/**` path.
- MEDIUM: none.
- LOW: none.

## Manager action authorized

Do not merge WR-083 / PR #234 at `4ac5fa2c6148960094fde81b217bd3af080e4213`.

Do not reactivate real WR-081 historical scoring.

Return WR-083 for narrowly bounded remediation of WR-084-AUD-01 and WR-084-AUD-02 while preserving the independently verified positive custody/no-scoring behavior and all reviewed bridge bytes not required to fix those findings.

After remediation:

1. publish one new immutable WR-083 target;
2. run exact-head Full War Room CI and protected/custody regressions;
3. preserve the no-scoring boundary;
4. Manager freezes the new exact target;
5. route a fresh independent audit before any real WR-081 scoring.

Auditor modified or merged PR #234: NO.

Auditor performed real WR-081 historical scoring: NO.

Auditor modified non-`.ai/auditor/**` surfaces: NO.
