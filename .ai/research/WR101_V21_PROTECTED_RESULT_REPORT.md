# WR-101 — Returning-Player v2.1 Protected Result Report

Status: **FINAL R&D PACKAGING — IMMUTABLE PROTECTED RESULT**

Task: `WR-101 — Returning-Player v2.1 One-Time Protected Validation Scoring`

This report packages the exact protected result already published by the accepted WR-097 bridge. It does not rerun scoring, reinterpret the frozen protocol, or alter generated protected evidence.

## Exact execution binding

- protected workflow: `WR-097 Returning-Player v2.1 Protected Scoring Bridge`
- workflow run: `35447590872` — **SUCCESS**
- canonical control-plane head at dispatch: `b9bedf49cb500524e766f9e233356c3e64d1843f`
- preflight job `105909100834` — SUCCESS
- trust-gate job `105909226178` — SUCCESS
- future-authorized-v21-scoring job `105909245699` — SUCCESS
- protected-no-scoring-readiness job `105909246395` — SKIPPED
- Actions artifacts: `0`
- cleanup: SUCCESS

Consumed R3 authority:

- branch: `wr-101-v21-validation-scoring-execution-r3`
- authorized pre-execution head: `3d2f0ee09aad47a3190e4be6e83cc765543da387`
- consumer: `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER.py`
- consumer SHA-256: `5fc302f54f554ba2db42606a204c94e1764599fc8c5687b7c7ef56d33423150a`
- authority SHA-256: `722a965cecb2c14baa9b5f3d4188d464c1f56e0bf56d648fa2f8e143f4677aff`

The one-time authority has been canonically consumed and removed. No active scoring authority exists.

## Exact publication binding

Protected publication head:

`41c1601ce2a7ae26fcb13a370ae2960db9427a80`

Authorized parent:

`3d2f0ee09aad47a3190e4be6e83cc765543da387`

The publication is exactly one commit over the authorized parent, with commit message:

`WR-097: publish authorized v2.1 protected result evidence`

Publication facts:

- protected generated files added: `34`
- all 34 paths are under `.ai/research/generated/**`
- publication tree SHA-1: `27fe1bbb7f91ea331e8bcc8f21f2f8d802a03c7a`
- publication payload SHA-256: `056140b09bdf63f96c58017335b79d399ec0a5004f0bdc2542a6bfeb83c4ee39`
- authority-consumption receipt SHA-256: `11231733032061e7fde5fbe02dae8f111d04bfa6248e951cff87d3f679156fd3`
- publication parent verified: true
- non-force publication verified: true
- single-publication-commit required: true

The authority-consumption receipt binds run `35447590872`, the authorized head, branch, consumer digest, publication payload, terminal result, and decision status.

## Accepted source / cohort / protocol identity

Source snapshot:

- ID: `wr-returning-player-v2-source-snapshot/1.2.0-wr059`
- SHA-256: `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`

Cohort:

- ID: `returning-player-v2-cohort/1.2.0-wr059`
- SHA-256: `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`

Source identity set SHA-256:

`8cbe874b3ceea141cbb9fedb2198ffa940ee218fe4556feace7afd8bbfb89351`

Protocol:

- ID: `returning-player-v2.1-model-protocol-candidate/1.0.0-wr095`
- gates ID: `returning-player-v2.1-result-gates-candidate/1.0.0-wr095`
- SHA-256: `5c86dacac044538422ca24fbeb13eaee3161050f917acc40f0dbdc1ca6547a39`

No source, cohort, protocol, model, feature, baseline, chronology, threshold, or gate semantic was changed during WR-101 packaging.

## Frozen chronology

The protected chronology proves target exposure followed immutable prediction locks and that confirmation was not opened until complete validation PASS.

### Validation

2022:
- prediction lock: `12d28c5a1a6c2f0ff77d91fcc7b392c10e1830678c98215e2a8062833a4d786d`
- target exposed only after that lock.

2023:
- prediction lock: `892dd11736519f8403616177ef989a13b9dadc93b35f3b969a72945f37cb1a8e`
- target exposed only after that lock.

Validation gate lock:

`0a3d84cba6ac0d86f1b2d99025658be95653038933a083e835ec7ccb7c19df5a`

Validation result:

- gate: **PASS**
- status: `STAGE_PASS`

Only after that validation gate PASS did the chronology proceed to confirmation.

### Confirmation

2024:
- prediction lock: `51697a0cb4f63919381382cfe19487de06518eb9ef0bd2b0b4bc68d91b2aaafd`
- target exposed only after that lock.

2025:
- prediction lock: `fa1cf3301ecb094f80374fac76c7b13ffa4e26e49c1e67f36df8a5df6eb6835e`
- target exposed only after that lock.

Confirmation gate lock:

`f333a7ad55cb434eec02fa342a0afcc613a82b4b9d672bbcc0a3b20f645a3bf3`

Confirmation result:

- gate: **FAIL**
- status: `BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE`

## Validation result — 2022–2023

Validation row count: `488`

Pooled:

- candidate MAE: `2.57249993274361`
- primary MAE: `2.8445607798026735`
- MAE lift: `0.095642479848131887` — PASS
- candidate RMSE: `3.3842492202090417`
- primary RMSE: `3.9715781012689586`
- RMSE regression: `-0.14788299917160372` — PASS

Position MAE regressions:

- QB: `-0.13471728962408877`
- RB: `-0.12502337433085634`
- TE: `-0.074696437489895129`
- WR: `-0.045666851167415437`

All four positions were non-worse.

Ordering:

- weighted Spearman delta: `0.039075362862189156` — PASS
- weighted rank-MAE regression: `-0.032290958531611229` — PASS

Season behavior:

- 2022 MAE regression: `-0.12862706833031365`
- 2023 MAE regression: `-0.058931041311954251`
- max season MAE regression: `-0.058931041311954251` — PASS

Fallbacks: `0`

Lineage failures: `0`

Validation passed completely and lawfully unlocked confirmation.

## Confirmation result — 2024–2025

Confirmation row count: `466`

Pooled:

- candidate MAE: `2.7935207814071985`
- primary MAE: `2.9784170503330438`
- MAE lift: `0.062078703486192571` — PASS
- candidate RMSE: `3.7055468578609267`
- primary RMSE: `4.3713047205357878`
- RMSE regression: `-0.15230186528686099` — PASS

Position MAE:

- QB regression: `-0.18963517364368701` — PASS
- RB regression: `0.10757305704680846` — **FAIL**
- TE regression: `-0.019818685972983113` — PASS
- WR regression: `-0.053894331692748036` — PASS

Frozen confirmation cap for an eligible position is `0.05`.

RB therefore exceeds the allowed cap by approximately `0.0575730570` absolute regression fraction. This is the blocking confirmation gate.

Positions non-worse on MAE: `3` — PASS.

Ordering:

- weighted Spearman delta: `0.031291874673246456` — PASS
- weighted rank-MAE regression: `-0.030113414157215468` — PASS

Season behavior:

- 2024 MAE regression: `-0.037908806991991569` — PASS
- 2025 MAE regression: `-0.08835096526745298` — PASS
- max season MAE regression: `-0.037908806991991569` — PASS
- mean season MAE delta: `-0.18548746486185785` — PASS

Bootstrap:

- clusters: `337`
- replicates: `5000`
- seed: `72073`
- q025: `-0.37444983821586758`
- q975: `-0.0015500547727702986`
- bootstrap gate: PASS

Secondary baselines:

- weighted_ppr_pg regression: `-0.035439402153446799` — PASS
- same-position earlier-observed-target-mean regression: `-0.36062958047605709` — PASS

Fallbacks: `0`

Lineage failures: `0`

The confirmation gate therefore fails on the RB position-MAE regression criterion. No other frozen confirmation criterion needs to be weakened or reinterpreted.

## Frozen terminal result

Execution status:

`SUCCESS`

Terminal:

`CONFIRMATION_FAILED`

Decision status:

`BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE`

This is a valid protected model-result failure, not a technical bridge failure.

It does not authorize:
- another scoring run;
- tuning or model remediation;
- gate/threshold changes;
- source or cohort changes;
- production promotion;
- season-total composition;
- Phase 6.

## Evidence hash binding

Packaging manifest:

`.ai/research/WR101_V21_RESULT_EVIDENCE_MANIFEST.json`

Packaging-manifest SHA-256 at creation:

`c9eaed975f8b5aa5507bbdf98bec01392ee003f71ed9ddf87f353d4838425129`

Critical protected files were independently re-hashed from their exact Git blobs:

- authority-consumption receipt: `11231733032061e7fde5fbe02dae8f111d04bfa6248e951cff87d3f679156fd3`
- execution chronology: `ce4cf74d6ce770711991ce367cef05da321725d91d0100253519fe5c2a25a8b6`
- protected result manifest: `6676d9f7f1f731d7717140666796bb509040bd6903d72648618d54fdd2c54304`
- validation stage gate: `e8c4302f80f485feffae095faf8f8e0b6fc0a276e0c6082b619b6f682b1d4a2c`
- confirmation stage gate: `d56861c93e649172d70902e860d882caf6cbe9b14a69312626eb9eca6dd830b9`
- terminal result: `b8d8dbfcb2885b8b3b5a8b4314515a4eb0660545217d4aced977bc6f28bf3665`

The packaging manifest lists every one of the 34 protected generated paths with its exact Git blob SHA-1 and byte size, all bound by the protected publication commit/tree and publication-payload SHA-256.

## Packaging boundary attestation

During this final R&D packaging phase:

- no scoring was rerun;
- no new scoring authority was requested or created;
- no model was fit, tuned, or changed;
- no gate or threshold was changed;
- no accepted source/cohort/protocol semantic changed;
- no retained data was reacquired or substituted;
- no 2026 regular-season outcome was inspected;
- no season-total composition occurred;
- no production ranking/recommendation logic changed;
- no Phase 6 work occurred;
- no protected generated evidence file was edited.

The only authorized post-publication writes are summary/report/manifest/handoff material under `.ai/research/**`.
