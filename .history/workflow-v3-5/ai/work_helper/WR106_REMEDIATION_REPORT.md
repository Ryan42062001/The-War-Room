# WR-106 Remediation Report — v2.1 Stage-Gate Bridge Status Contract

Status: COMPLETE — MANAGER FREEZE / FRESH WR-107 INDEPENDENT AUDIT REQUIRED
Task: WR-106
Branch: `wr-106-v21-stage-gate-status-remediation`
PR: #295 — draft / open / unmerged
Canonical base: `6422caa5b8a782022d58816f30432128503b9754`
Immutable implementation SHA: `4b41ac8b12a4e9f029979eb29c92458e7b4cb640`
Pre-fix synthetic proof SHA: `78a0269e214581a1d7896edfd47a319f0ef02438`
Minimal consumer-fix commit: `b80e263ca0bbdb84b8442240a165039cb0173f5b`

## Root cause

The consumer's `_stage_gate()` already computed the canonical decision `status_label` and wrote that exact label into the stage-gate artifact/state. Its bridge result omitted the field when calling `_finish()`.

The accepted protected wrapper, unchanged by WR-106, requires a non-empty returned `status_label`. Therefore it correctly failed closed at the bridge contract with `stage gate decision status missing`.

The deterministic pre-fix proof is recorded in `.ai/work_helper/WR106_STAGE_GATE_STATUS_REPRODUCTION.md`.

## Remediation

The production behavior change is deliberately minimal. The consumer stage-gate bridge payload now exports:

`"status_label": status_label`

using the already-computed local variable. No label calculation, gate formula, threshold, model behavior, target/source/cohort semantics, chronology, or wrapper behavior was changed.

The direct synthetic regression proves bridge `status_label` exactly equals artifact `status_label` for both:

- validation PASS => `STAGE_PASS`;
- validation FAIL => `BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE`.

The custody regression invokes the actual provider-free bubblewrap wrapper path through `run_sandboxed_consumer(..., "stage-gate", ...)` with fabricated local state. It proves the corrected bridge is accepted and matches the emitted artifact. It also preserves fail-closed checks for missing/empty `status_label` and tampered prediction-lock evidence.

## Changed implementation/test scope

At implementation SHA `4b41ac8b12a4e9f029979eb29c92458e7b4cb640`, the base-to-head diff contains only:

1. `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER.py` — two additions / one deletion; only bridge export formatting + `status_label`.
2. `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER_TEST.py` — synthetic stage-gate fixture and PASS/FAIL bridge/artifact equality regression.
3. `scripts/custody/test_wr097_v21_protected_scoring.py` — actual sandboxed protected-wrapper stage-gate contract regression.

The protected wrapper `scripts/custody/wr097_v21_protected_scoring.py` is byte-identical between base and implementation (blob `a6c79b0c5c95b8f34a86f8843a852c7fe879be65`).

The WR-097 workflow is byte-identical (blob `e02feaa8e3c3389859cceeda8341fed6533519b8`).

The accepted WR-095 v2.1 protocol artifact and digest file are byte-identical (blobs `ab9f5a4bf475e5aa125ee21373d41cc04b692a24` and `5013eb70a3627c862507ad3de3bbc0366285c717`).

## Validation

Pre-fix proof:
- WR-097 PR preflight run `35445047344`, job `105902421401`: expected FAILURE at test-only SHA `78a0269e...`.
- `Ran 16 tests`; exactly two `KeyError: 'status_label'` errors, one for PASS and one for FAIL fixture.

Corrected focused/security proof at implementation SHA:
- WR-097 PR-triggered non-scoring preflight run `35445124879`, job `105902676394`: SUCCESS.
- Corrected consumer suite: `Ran 16 tests` / `OK`.
- WR-097 protected v2.1 bridge regressions: PASS.
- WR-063 retained-version fail-closed regressions: PASS.
- WR-069 safe-consumer fail-closed regressions: PASS.
- WR-083 protected historical scoring bridge regressions: PASS.
- Trust gate, future-authorized scoring, and protected no-scoring jobs were SKIPPED on this PR run; no protected scoring executed.

Custody proof:
- WR-046 run `35445124891`, contract-preflight job `105902630155`: SUCCESS.
- Live B2 R2 custody proof and credential-scope jobs were SKIPPED.

Full War Room CI at implementation SHA:
- run `35445124926`: SUCCESS by completed job set.
- classify `105902630272`: SUCCESS.
- governance `105902647478`: SUCCESS.
- full test `105902668200`: SUCCESS, including browser determinism, WR-026 phone decision view, `npm test`, resilience syntax, and backup/offline reload.

## Preserved contracts

The exact implementation diff and byte-identity checks independently establish that WR-106 did not alter validation/confirmation gate formulas or status-label semantics; prediction-lock-before-target exposure; validation-before-confirmation chronology; source/cohort bindings; target definition; model/preprocessing; publication-family allowlist; sandbox/provider isolation; authority/receipt/replay semantics; protected-wrapper behavior; workflow dispatch behavior; or cleanup behavior.

## Prohibited-action attestation

WR-106 did not access retained provider data, inspect real 2022–2025 target outcomes, inspect 2026 outcomes, perform real scoring, tune the model, rerun protected run `35444278227`, dispatch WR-097 via workflow_dispatch, create or consume scoring authority, modify the protected wrapper/workflow/shared/Manager/Auditor/production surfaces, merge PR #295, or audit its own remediation.

## Next gate

Manager should freeze the exact final WR-106 PR head while retaining `4b41ac8b12a4e9f029979eb29c92458e7b4cb640` as the immutable implementation SHA, then activate a fresh independent WR-107 audit. No new scoring authority is implied or authorized by WR-106.
