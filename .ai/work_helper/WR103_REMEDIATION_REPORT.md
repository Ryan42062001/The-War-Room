# WR-103 — v2.1 protected target-ingest bounded remediation

STATUS: IMPLEMENTATION COMPLETE — MANAGER FREEZE / WR-104 AUDIT REQUIRED  
ROLE: Work Helper / Super Troubleshooter  
WORKFLOW: V3.5  
BRANCH: `wr-103-v21-target-ingest-failure-remediation`  
PR: #289 (unmerged)  
CANONICAL BASE: `d9886095f77ae0e03699309670ddc670762d6a74`  
REMEDIATED IMPLEMENTATION HEAD: `b81be550a45e12032814a67dea6a8b146597250a`

## Failed execution and authority disposition

Failed protected workflow run `35424042233`, canonical dispatch head `bab6b8134e3be5837eec7a586353a8d185190857`, scoring job `105846904830` FAILURE. Preflight, Manager authority, live execution-branch head, exact checkout/consumer digest, read-only retrieval, and second live head check all passed. The first `target-ingest` failed closed. Staging, publication push, and receipt verification were skipped; cleanup succeeded; artifact count zero; execution branch remained `6d49fa07b86ecdb5c92fcf127f83dd12d841c4c9`.

Canonical Manager revoked the previously issued one-time `future_execution_authority`. WR-101 remains BLOCKED, WR-104 awaits a fresh audit, and WR-102 has no result target. This task did not reissue/consume authority or dispatch scoring.

## Root cause — deterministic pre-target lock schema mismatch

The bridge's `publication_tree_sha256()` hashes canonical entries with four fields: `path`, `sha256`, `byte_size`, and `family`. The old consumer's `_lock_publication_tree()` verified file bytes but omitted `family` when reconstructing the tree digest. The digests therefore differed for legitimate bridge-generated prediction locks. `_target_ingest()` invokes `_verify_prediction_lock()` before opening the visible target source, so the first 2022 `target-ingest` necessarily rejected the lock.

An isolated, fully fabricated local file reproduced this exact mismatch before changing behavior. The synthetic publication file digest/size passed. The bridge-style lock SHA-256 was `ce387cee06ea349358e59611c11ff75ae5e610b921a46a13b0d634bcf6e63952`, but the old three-field consumer reconstruction was `788698784ab97d656df513aef33afc77f89aef137f47cb00c24a9564303877e8`. See `.ai/work_helper/WR103_TARGET_INGEST_REPRODUCTION.md`. The new positive lock/target-ingest regression was committed at `ec129bb6d2ed128a38aa88f58cff6ca1643f6224`, before the consumer behavior fix `f593f95421d1bdb646c16f53a53d3d22bdb64f85`.

The original runner intentionally suppresses the consumer's internal exception and logs only the generic fail-closed status. The deterministic, pre-source-read hash disagreement and old/new synthetic regression identify the defect without asserting access to suppressed runner internals or inspecting retained data.

## Minimal remediation

- `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER.py`: reconstruct the exact bridge four-field entry digest; additionally require each family's manifest value to match the allowed publication name/path. Preserve per-file hash/size checks and immutable prediction-lock equality. No model, source/cohort, gate, chronology, or target definition changed.
- `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER_TEST.py`: build a fabricated 2022 six-family prediction publication, prediction-state digest, read-only prediction lock, and realistic synthetic target-season CSV. Verify the old three-field digest disagrees, the corrected lock passes, target-ingest publishes the synthetic OBSERVED evaluation only after lock, and tampering still fails before evaluation/publication.
- `scripts/custody/test_wr097_v21_protected_scoring.py`: run the actual protected consumer with the fabricated target source through the provider-free bubblewrap sandbox and bridge-created immutable lock. Verify a successful `target-ingest`, fail-closed tampering, zero output from the failed call, and cleanup.

## Secondary cleanup defect exposed by new regression

The first full synthetic bridge regression reached successful sandboxed `target-ingest` and failed only its cleanup assertion: immutable phase-lock directories are mode 0555, while the original `cleanup_paths()` used `shutil.rmtree(..., ignore_errors=True)`, allowing a nested read-only lock to survive silently. PR preflight run `35425071538`, job `105849481358` recorded this synthetic-only failure.

- `scripts/custody/wr097_v21_protected_scoring.py`: when cleaning runner-temporary directories, restore only directory write permission immediately before deletion; require full removal or raise a privacy-safe `ContractError`. Future-execution finalization now uses this fail-closed cleanup helper rather than a silent `rmtree`. The immutable lock's bytes and lock verification remain unchanged during execution.
- Bridge regression explicitly verifies cleanup of a nested 0555 synthetic lock after success and deliberate failure.

This is a bounded cleanup correction necessary to preserve the existing no-retained-byte persistence guarantee, not a change to source, scoring, publication, or authority policy.

## Verification — implementation head

Exact implementation head `b81be550a45e12032814a67dea6a8b146597250a`:

- Synthetic consumer suite: 15/15 PASS, including immutable-lock success, target-ingest happy path, and tamper rejection.
- Protected bridge/V3.5 regression suite: PASS, including actual synthetic sandbox/lock happy path, deliberate tamper failure, cleanup success/failure, authority/replay, and publication checks.
- WR-063 retained-read regressions: PASS.
- WR-069 safe-consumer regressions: PASS.
- WR-083 protected bridge regressions: PASS.
- Release-candidate fail-closed guard: PASS.
- Existing WR-097 PR-triggered preflight `35425202543`, job `105849874095`: SUCCESS. Trust gate, credentialed readiness, and real scoring jobs all SKIPPED.
- Full War Room CI `35425202540`: SUCCESS; classify `105849822616`, governance `105849839230`, full test `105849858385` all SUCCESS.
- Same-head WR-046 `35425202537`, WR-063 `35425202539`, WR-069 `35425202535`: SUCCESS.

No WR-103 task action dispatched the protected scoring workflow. Opening PR #289 caused GitHub's existing, noncredentialed PR preflight to run automatically; all credentialed and real-scoring jobs were skipped.

## Hard-boundary attestation

WR-103 ran only fabricated/local synthetic inputs. No retained provider bytes were retrieved or inspected. No real 2022–2025 target outcome was opened, parsed, inferred, compared, or evaluated. No 2026 outcomes were inspected. No real predictions, model fitting, model tuning, gate calculation, scoring dispatch, provider mutation, or production/composition/Phase-6 work occurred. No `future_execution_authority` was created, reinstated, or consumed.

No workflow YAML, shared/Manager/Auditor, accepted WR-095/096 protocol, source/cohort, WR-074, product, or ranking surface was modified.

## Remaining risk / next gate

The failed real job's internal exception is intentionally unavailable from logs; the deterministic lock incompatibility was independently reproduced with synthetic data and the corrected six-family end-to-end sandbox path passed. No real scoring rerun is authorized by this evidence.

Manager must freeze the exact final PR #289 head after checking final-head CI and changed-file scope, then activate WR-104 for a fresh independent audit. Only after PASS-family audit and exact audited integration may Manager separately consider a NEW one-time WR-101 execution authority.
