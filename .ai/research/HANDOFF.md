# R&D Handoff

STATUS: READY FOR MANAGER — WR-095 PROSPECTIVE PROTOCOL CANDIDATE
TASK: WR-095 — Returning-Player v2.1 Failure Analysis + Prospective Model-Protocol Design
ROLE: Research & Development (R&D)
BRANCH: `wr-095-returning-player-v21-failure-analysis-protocol`
BASE: canonical main `1511ebc509f7e28426e3e27a351cb33acb9368f9`
PR: #270
HEAD: freeze the live PR #270 head containing this final handoff; no further R&D writes are authorized after this commit.
PROTOCOL DISPOSITION: `PROTOCOL_READY_FOR_MANAGER_FREEZE`
SOURCE / CUSTODY DISPOSITION: `EXISTING_ACCEPTED_SOURCE_SUFFICIENT`

## DONE

Used only accepted/audited WR-081 evidence from exact frozen target `b5fc0974e0766c24974034557a62044b4752716a` plus accepted WR-059/WR-072 contracts.

2018–2021 are explicitly DESIGN-EXPOSED for v2.1.

2022–2025 outcomes remained unopened.

### Failure-analysis conclusion

The WR-081 validation failure is strongly tail-concentrated rather than broad.

One 2021 WR row:
- candidate `-105.44209159462447`;
- target `3.5036363636363634`;
- baseline `-2.78`;
- candidate absolute error `108.94572795826083`;
- contributes `65.27%` of all validation candidate SSE;
- contributes `85.22%` of WR candidate SSE.

That row has extreme within-WR standardized sparse passing features:
- interceptions/game `+474.93σ`;
- attempts/game `+299.29σ`;
- passing EPA/game `-236.94σ`.

The top three linear contributions sum to about `-107.1` PPR/game.

Diagnostic-only exclusion of that one row makes the remaining validation candidate SSE lower than baseline and the remaining WR candidate MAE/RMSE lower than baseline. No row exclusion is proposed for future scoring.

### Recommended v2.1 architecture

`PER_POSITION_BOUNDED_RESIDUAL_RIDGE`

- retain the accepted 28 stats-only features;
- retain per-position StandardScaler;
- clip standardized feature inputs to `[-6,+6]` before model fit/predict;
- retain Ridge alpha=100;
- model residual target `target - prev1_ppr_pg`;
- compute training residual median and MAD;
- robust sigma = `1.4826 * MAD`;
- clamp residual prediction to median +/- `3 * robust_sigma`;
- final candidate = primary persistence baseline + bounded residual correction;
- no hyperparameter search;
- no player-specific or WR-only special case.

### Future chronology

Validation:
- 2022
- 2023

Only if validation PASS:

Confirmation:
- 2024
- 2025

Prediction/model/preprocessing state for Y must be immutable before target-Y exposure. After Y is locked/exposed, Y may enter Y+1 rolling training.

All WR-072 validation/confirmation performance thresholds are numerically preserved.

## CHANGED / ARTIFACTS

- `.ai/research/WR095_V21_FAILURE_ANALYSIS.md`
- `.ai/research/WR095_V21_PROTOCOL_PROPOSAL.md`
- `.ai/research/generated/WR095_RETURNING_PLAYER_V21_PROTOCOL_CANDIDATE.json`
- `.ai/research/generated/WR095_RETURNING_PLAYER_V21_PROTOCOL_CANDIDATE.json.sha256`
- `.ai/research/HANDOFF.md`

Machine protocol candidate:
- ID: `returning-player-v2.1-model-protocol-candidate/1.0.0-wr095`
- version: `1.0.0-wr095`
- SHA-256: `5c86dacac044538422ca24fbeb13eaee3161050f917acc40f0dbdc1ca6547a39`

## TESTS / EVIDENCE CHECKS

- live main verified exactly `1511ebc509f7e28426e3e27a351cb33acb9368f9`;
- initial branch verified exactly `9ac05c75b6e6fe31042d2b38f86f6eca79575975`;
- WR-082 PASS consumed as historical audit authority;
- row-level WR-081 2018–2021 evaluation evidence decomposed;
- catastrophic-row linear prediction reconstructed exactly from frozen preprocessing/model state;
- machine candidate canonicalized as sorted-key compact UTF-8 JSON + LF;
- adjacent SHA-256 sidecar published.

## DECISIONS CONSUMED

- WR-D001 production ranking authority unchanged.
- WR-D008 evidence-contract architecture remains binding.
- WR-D009 accepted WR-059 source/cohort authority remains binding.
- WR-072 is predecessor protocol evidence, not a validation set for v2.1.
- WR-081/WR-082 frozen result remains immutable historical evidence.

## BLOCKERS / RISKS

No blocker to protocol freeze.

Unresolved prospective risks:
- the protocol has not been fit or scored;
- z=6 and 3-MAD-sigma controls are fixed design choices, not proven optimal;
- 2022–2023 may fail untouched validation;
- current protected publication allowlist is WR-081-specific and likely needs a bounded audited update before any v2.1 scoring authority.

## SCOPE ATTESTATION

No:
- WR-081 rerun;
- model fit or score;
- hyperparameter search;
- retained raw source access;
- source reacquisition/substitution;
- 2022–2025 target exposure;
- 2026 outcome inspection;
- season-total composition;
- production/ranking/recommendation modification;
- Phase-6 work;
- PR merge;
- self-audit.

## NEXT ACTION

Manager / Architect:
1. verify exact WR-095 branch head, changed files, machine-candidate SHA, and exact-head CI;
2. freeze the exact R&D target if acceptable;
3. activate a **fresh Independent Auditor protocol audit**;
4. create no scoring authority until that audit is accepted.

R&D does not merge and does not activate the Auditor.
