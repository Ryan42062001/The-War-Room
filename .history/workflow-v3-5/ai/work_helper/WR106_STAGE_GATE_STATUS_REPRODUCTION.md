# WR-106 Stage-Gate Bridge Status Reproduction

Status: COMPLETE — synthetic/local reproduction only
Task: WR-106 — v2.1 Stage-Gate Bridge Status Contract Remediation
Canonical base: `6422caa5b8a782022d58816f30432128503b9754`
Pre-fix reproduction commit: `78a0269e214581a1d7896edfd47a319f0ef02438`

## Live failure corroboration

The protected WR-097 R2 run `35444278227` failed in job `105900552923` with:

`WR-097 FAIL CLOSED: stage gate decision status missing`

Preflight `105900417742` and trust gate `105900534166` succeeded. Publication staging, publication push, authority-receipt verification, and the no-scoring job did not run. Cleanup succeeded and the run produced zero Actions artifacts.

This evidence was used only to identify the failing boundary. WR-106 did not rerun the failed protected execution and did not access retained provider data or real target outcomes.

## Independent code-path reproduction

The pre-fix consumer computes `status_label` in `_stage_gate()` and places that exact value in the stage-gate artifact/state. The pre-fix bridge payload passed to `_finish()` contained only `stage`, `gate_pass`, and `prediction_lock_set_sha256`.

The accepted protected wrapper is unchanged and requires a non-empty returned `status_label` after the stage-gate consumer returns. Missing/empty status therefore fails closed.

WR-106 added a synthetic fixture using fabricated validation evaluation state and fabricated immutable prediction locks. It exercises two deterministic gate outcomes without provider access:

- PASS fixture: artifact status `STAGE_PASS`.
- FAIL fixture: artifact status `BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE`.

The direct regression asserts that the bridge status equals the already-produced artifact status. Against the old behavior it fails because the bridge key is absent.

## Pre-fix failing proof

PR-triggered WR-097 preflight run `35445047344`, job `105902421401`, ran the synthetic consumer suite at test-only commit `78a0269e214581a1d7896edfd47a319f0ef02438`.

Result: `Ran 16 tests` and FAILED with exactly two errors in `test_stage_gate_bridge_exports_exact_artifact_status_label`:

- `KeyError: 'status_label'` for expected `STAGE_PASS`.
- `KeyError: 'status_label'` for expected `BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE`.

Thus the same pre-fix omission is reproduced for both gate outcomes, proving the bridge field is absent while the artifact label has already been calculated. The reproduction does not infer or hardcode a replacement decision.

## Privacy / authority boundary

No retained-provider connection, provider credential, real 2022–2025 target source, 2026 outcome, real scoring, tuning, WR-097 workflow dispatch, or scoring authority was used by this reproduction.
