# WR-104 — Independent Audit of v2.1 target-ingest Remediation

TASK ID: WR-104  
ROLE: Independent Auditor / QA  
CANONICAL WORKFLOW: V3.5  
EXECUTION MODE: STANDARD_CHAT_HIGH  
REFRESH MODE: FAST_REFRESH  
AUDIT TARGET: WR-103 — v2.1 Protected target-ingest Failure Analysis + Bounded Remediation  
TARGET PR: #289  
TARGET BRANCH: `wr-103-v21-target-ingest-failure-remediation`  
EXACT FROZEN TARGET: `1a572baac9e4393582db37ad43cbe8609628d8c3`  
IMPLEMENTATION SHA: `b81be550a45e12032814a67dea6a8b146597250a`  
CANONICAL MAIN VERIFIED: `6efa765859c714cebe209fd8e033d5b073d9a08a`  
AUDIT BRANCH: `wr-104-v21-target-ingest-remediation-audit`

## Final verdict

`PASS`

Findings:
- CRITICAL: none
- HIGH: none
- MEDIUM: none
- LOW: none

This verdict applies only to exact WR-103 frozen target `1a572baac9e4393582db37ad43cbe8609628d8c3`. Any target movement invalidates this audit.

No retained provider data was accessed by the Auditor. No real scoring was dispatched. No 2022–2025 target outcomes or 2026 outcomes were inspected. No scoring authority was created or consumed.

## 1. Exact target / scope / freeze verification

Live GitHub state was independently verified:

- canonical `main` exactly `6efa765859c714cebe209fd8e033d5b073d9a08a`;
- assigned WR-104 branch initially exactly that Manager checkpoint;
- PR #289 is OPEN and unmerged;
- PR #289 head exactly `1a572baac9e4393582db37ad43cbe8609628d8c3`;
- target branch exactly `wr-103-v21-target-ingest-failure-remediation`;
- PR #289 changes exactly seven files:
  1. `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER.py`
  2. `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER_TEST.py`
  3. `.ai/work_helper/HANDOFF.md`
  4. `.ai/work_helper/WR103_REMEDIATION_REPORT.md`
  5. `.ai/work_helper/WR103_TARGET_INGEST_REPRODUCTION.md`
  6. `scripts/custody/test_wr097_v21_protected_scoring.py`
  7. `scripts/custody/wr097_v21_protected_scoring.py`.

Comparison from implementation SHA `b81be550a45e12032814a67dea6a8b146597250a` to frozen SHA `1a572baac9e4393582db37ad43cbe8609628d8c3` is exactly one commit changing only:

- `.ai/work_helper/HANDOFF.md`;
- `.ai/work_helper/WR103_REMEDIATION_REPORT.md`.

No executable or test byte changed after the implementation SHA.

## 2. Original failed protected run independently verified

Original protected workflow run `35424042233`:

- preflight `105846793972` — SUCCESS;
- trust gate `105846886899` — SUCCESS;
- future-authorized-v21-scoring `105846904830` — FAILURE;
- protected-no-scoring-readiness `105846905315` — SKIPPED.

The failed protected job independently shows:

1. canonical dispatch checkout at `bab6b8134e3be5837eec7a586353a8d185190857`;
2. live Manager-authorized branch-head verification succeeded;
3. exact authorized scoring head `6d49fa07b86ecdb5c92fcf127f83dd12d841c4c9` was checked out;
4. reviewed consumer digest `f6e5eee35c0e769abc9cbc899c0eecc3e311ff3cd22973ebf2c7351ddd58c6f8` verified;
5. retained-input retrieval completed successfully;
6. live branch head was rechecked immediately before consumer exposure;
7. protected chronology execution then failed with:
   `WR-097 FAIL CLOSED: sandboxed consumer failed closed in target-ingest`.

After the failure:

- publication staging was SKIPPED;
- publication commit/push was SKIPPED;
- authority-receipt verification was SKIPPED;
- Actions artifacts for the failed run were exactly zero;
- workflow cleanup step completed successfully.

The execution branch still resolves to exactly `6d49fa07b86ecdb5c92fcf127f83dd12d841c4c9`; no publication commit advanced it.

The current canonical registry contains no `future_execution_authority` and no authority-consumption receipt. The prior scoring authority was revoked, not consumed.

## 3. Independent root-cause reconstruction

### Bridge lock schema

The bridge's `publication_entries()` returns canonical publication entries containing:

- `path`;
- `sha256`;
- `byte_size`;
- derived `family`.

`publication_tree_sha256()` hashes canonical JSON bytes of that exact four-field entry set.

`lock_phase_output()` returns that digest as the immutable prediction-lock identity.

### Pre-remediation consumer defect

At the pre-remediation base, consumer `_lock_publication_tree()` read the same locked publication manifest but reconstructed each entry as only:

- `path`;
- `sha256`;
- `byte_size`.

It omitted `family` before canonical hashing.

Because canonical JSON bytes differ when the `family` key/value is omitted, the SHA-256 necessarily differs for a legitimate non-empty prediction publication tree. This is a deterministic schema mismatch, not a data/model failure.

A synthetic example with identical path/digest/size but with versus without `family` produces distinct canonical SHA-256 values. No retained or real target data is needed to reproduce the defect.

## 4. Failure occurs before target parsing/exposure

The bridge chronology remains:

1. prediction consumer runs;
2. prediction output is locked by `lock_phase_output()`;
3. lock digest is saved;
4. only then is the target-season source copied into the target-ingest visible directory;
5. target-ingest consumer runs.

Inside consumer `_target_ingest()`, the order remains:

1. read expected prediction-lock digest;
2. `_verify_prediction_lock()`;
3. verify lock map and prior locks;
4. verify prediction-state digest and locked prediction artifact;
5. only then call `_verify_visible_sources(..., "target-ingest")`;
6. only then parse/aggregate target CSV bytes.

Therefore the old schema mismatch necessarily fails before target-source parsing. The existing synthetic regression with a deliberately missing target file and absent prediction lock also demonstrates the consumer fails on lock evidence before attempting source read.

## 5. Remediation correctness

The remediated consumer `_lock_publication_tree()` now reconstructs the exact intended four-field bridge schema:

- `path`;
- `sha256`;
- `byte_size`;
- `family`.

Before hashing, it additionally fails closed unless:

- path begins with `.ai/research/generated/`;
- path is relative;
- no `..` traversal component exists;
- suffix is `.json`;
- path stem matches exactly one allowed publication family;
- manifest `family` equals the family implied by the path.

It then re-hashes the immutable file and requires exact digest + byte size before including the entry in the lock hash.

This fixes the schema mismatch while strengthening, not weakening, lock-family validation.

## 6. Publication and immutable-evidence boundaries

Consumer publication behavior remains bounded by the unchanged `PUBLICATION_FAMILIES` and mode-specific `CONSUMER_MODE_FAMILIES`.

`_publication()` still rejects unknown families.

`_finish()` still rejects any family not authorized for the consumer mode.

Bridge `publication_entries()` remains unchanged and still:

- derives family from the allowlisted publication path;
- rejects duplicate path/digest boundary violations;
- verifies exact staged file digest/size;
- rejects exact retained-raw source identity;
- rejects byte-identical retained raw source publication;
- requires JSON;
- rejects credential-bearing keys.

`merge_publication()` still rejects mutation of any already-frozen evidence path.

No publication allowlist was widened.

## 7. Synthetic target-ingest happy path and tamper behavior

The new consumer fixture fabricates only local/synthetic data:

- one synthetic prediction state;
- the six legitimate prediction publication families;
- a canonical lock digest including `family`;
- one synthetic target CSV row.

No provider data or real player outcome is used.

The direct synthetic target-ingest happy path requires the valid prediction lock and then verifies:

- accepted lock digest equals bridge digest;
- one synthetic row is observed;
- target value is computed only after lock acceptance;
- evaluation row binds the prediction lock;
- bridge result is PASS;
- publication family is exactly `RETURNING_PLAYER_V21_EVALUATIONS`;
- no validation gate lock is created merely by one target-ingest.

The bridge-level regression replaces the fixture lock with an actual `lock_phase_output()` 0444/0555 immutable lock and executes the real sandbox wrapper. That sandbox happy path succeeds with the same canonical digest.

Tampering a locked prediction publication file causes `immutable lock publication mismatch` and fails before:

- evaluation state creation;
- publication-manifest creation.

The actual sandbox-level tamper path also fails closed.

## 8. Prediction / validation / confirmation chronology preserved

No chronology implementation was changed by WR-103.

`run_future_consumer()` still creates the prediction lock before target-season exposure for each year.

Validation remains exactly 2022–2023.

Confirmation remains exactly 2024–2025.

Prediction mode still requires:

- all prior future-season prediction locks;
- all prior future-season lawful evaluation states;
- no current target lock;
- validation gate lock before confirmation prediction.

Stage-gate mode still requires all stage prediction locks.

Confirmation stage-gate still requires exactly the validation gate lock and requires its `gate_pass` to be true.

A failed validation gate still terminates before confirmation.

The remediation did not change gate thresholds, bootstrap rules, fallback requirements, baseline definitions, result labels, stage ordering, or unlock semantics.

## 9. Secondary 0555 cleanup correction

`lock_phase_output()` intentionally makes locked files 0444 and directories 0555.

The pre-remediation cleanup used `shutil.rmtree(..., ignore_errors=True)`, meaning deletion failure inside a non-writable immutable lock tree could be silently suppressed, leaving runner-temporary protected state behind.

The remediation is necessary and bounded:

- only directory permissions are restored to 0700 during teardown;
- immutable evidence files are not chmodded or rewritten;
- `shutil.rmtree()` no longer ignores errors;
- any cleanup OSError raises `runner-temporary cleanup failed`;
- post-cleanup existence/symlink check raises `runner-temporary cleanup incomplete`.

On successful protected execution, the sandbox root is cleaned in `finally`.

On failure, publication-package/sandbox cleanup is attempted, and the `finally` path again ensures sandbox-root cleanup.

The new regression creates a synthetic 0444 file under nested 0555 directories and requires full removal.

This correction does not alter immutable evidence during active protected execution; permission restoration occurs only during teardown of runner-temporary directories.

## 10. Sandbox/provider isolation unchanged

The WR-103 diff does not modify sandbox construction.

`run_sandboxed_consumer()` still:

- requires all paths under runner temp;
- read-only binds the consumer;
- read-only binds visible input;
- bind-mounts state writable;
- read-only binds locks;
- bind-mounts output writable;
- clears the environment;
- uses frozen environment settings;
- rejects any consumer stdout/stderr;
- validates bridge result and publication entries after execution.

The protected sandbox conformance at the frozen target reports:

- repository visibility false;
- master raw visibility false;
- network unshared;
- target seasons visible only in target-ingest;
- prediction folds receive only allowed prior seasons.

Provider logic is unchanged by WR-103.

## 11. V3.5 authority / run / receipt / replay protections unchanged

WR-103 does not change:

- Manager authority normalization;
- canonical authority digest;
- exact branch/head/consumer identity;
- live remote-head verification;
- exact execution checkout;
- one-time authority rules;
- receipt construction/verification;
- one-publication-parent rule;
- replay history;
- Manager workflow identity integration.

The bridge regression suite still runs the V3.5 race/replay, exactly-one-authority, receipt and one-publication-parent tests.

No new authority was created or consumed by WR-103.

## 12. Model/protocol/source semantics unchanged

The executable consumer diff is limited to immutable lock-tree reconstruction/validation.

No changes occur to:

- WR-095 protocol SHA;
- source snapshot/cohort bindings;
- 28-feature schema/order;
- QB/RB/WR/TE fold structure;
- StandardScaler then ±6 z clipping;
- Ridge alpha=100 / SVD;
- persistence baseline;
- bounded-residual target;
- median/MAD robust scale;
- ±3 robust-sigma bound;
- fallback rules;
- validation/confirmation gates;
- thresholds;
- bootstrap;
- baselines;
- target definition.

Bridge executable changes are limited to cleanup behavior.

## 13. WR-103 did not perform retained-data scoring

The frozen-target WR-097 PR-triggered run `35425624521` completed SUCCESS with:

- preflight `105850935333` — SUCCESS;
- trust gate `105851045430` — SKIPPED;
- protected no-scoring readiness `105851045472` — SKIPPED;
- authorized-v21-scoring `105851045616` — SKIPPED.

Its preflight runs synthetic conformance, sandbox conformance, consumer tests and bridge regressions without protected credentials.

No real scoring run is attached to the WR-103 frozen target.

No scoring authority exists in current canonical active state.

## 14. Frozen-target validation

Final frozen target Full War Room CI:

- run `35425624460` — SUCCESS;
- classify `105850935014` — SUCCESS;
- governance `105850951181` — SUCCESS;
- full test `105850977418` — SUCCESS;
- bootstrap reuse `105850951954` — SKIPPED.

WR-097 PR-triggered run:

- `35425624521` — SUCCESS;
- preflight `105850935333` — SUCCESS;
- trust gate SKIPPED;
- protected no-scoring readiness SKIPPED;
- authorized-v21-scoring SKIPPED;
- Actions artifacts: zero.

The WR-097 preflight independently ran:

- exact authority/static checks;
- synthetic chronology conformance;
- sandbox conformance;
- `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER_TEST.py`;
- `scripts/custody/test_wr097_v21_protected_scoring.py`;
- WR-063/069/083 regression tests;
- release-candidate guard.

The bridge regression suite reported:
`WR-097 protected v2.1 bridge regressions: PASS`.

Supporting frozen-head workflow runs:

- WR-046 `35425624488` — SUCCESS; contract preflight `105850935065` SUCCESS; credentialed custody jobs SKIPPED.
- WR-063 `35425624491` — SUCCESS; contract preflight `105850935184` SUCCESS; protected retained read SKIPPED.
- WR-069 `35425624463` — SUCCESS; contract preflight `105850935180` SUCCESS; protected safe-consumer job SKIPPED.
- WR-083 `35425624493` — SUCCESS; preflight `105850935460` SUCCESS; protected/trust/scoring jobs SKIPPED.

Canonical post-activation War Room CI `35442264319` is SUCCESS.

Passing CI is corroborating evidence only; this verdict is based on independent code-path, chronology, failure-sequence, and test-quality inspection.

## 15. Audit boundary

The Auditor did not:

- modify WR-103 implementation;
- modify `.ai/shared/**`;
- modify `.ai/manager/**`;
- modify `.ai/work_helper/**`;
- modify `.ai/research/**`;
- modify `.github/**`;
- modify `scripts/**`;
- modify `src/**` or `public/**`;
- dispatch WR-097;
- access retained provider data;
- inspect real 2022–2025 or 2026 target outcomes;
- create or consume scoring authority;
- authorize a rerun;
- merge PR #289.

Only `.ai/auditor/**` evidence is published from this lane.

## 16. Exact Manager action authorized next

Manager may consume this PASS only for exact WR-103 frozen target:

`1a572baac9e4393582db37ad43cbe8609628d8c3`.

If Manager accepts the audit, Manager may integrate only that exact audited target under the normal V3.5 merge/canonical-main validation process.

This audit does **not** authorize a WR-097 rerun or create scoring authority. Any future real v2.1 validation-scoring attempt requires a separate explicit Manager decision and new one-time authority after exact audited integration and required canonical-main validation.

Final verdict: `PASS`.
