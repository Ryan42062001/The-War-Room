# Manager / Architect Handoff

HANDOFF

Workflow: V3.2 CANONICAL

## Accepted upstream state

Historical WR-042 PR #168 remains closed unmerged after WR-043 `FAIL — REMEDIATION REQUIRED`. Positive custody evidence for the exact 15 retained byte identities remains valid. `draft_picks.csv` remains excluded under WR-057.

WR-063 and WR-064 are accepted and CLOSED. Exact audited WR-063 head `9db29b082cb61b5ef902b56bb5c745fc8ee739b2` was integrated at `8a75f4a712e17bf3b5e91527fa6047b6bb107eb5`; protected proof run/job `34906157295` / `104183220181` passed; WR-064 returned `PASS` with no findings; mandatory canonical-main canary `34908351788` passed Governance and the full test suite.

## Frozen WR-059 fail-closed evidence

R&D published PR #184 at exact head:

`3c02f5a9a3ea858235772e7f2d065604632e7ee7`

Exact-head War Room CI `34911364983` — SUCCESS.

Manager disposition:

`FROZEN FAIL-CLOSED CHECKPOINT — CLOSED UNMERGED / DO NOT ADVANCE`

Key evidence:

- source snapshot ID `wr-returning-player-v2-source-snapshot/1.0.0-wr059-fail-closed`;
- source snapshot SHA-256 `d062a30d92456e65f27aa82922011ab03b5dcb6fba9da736e9b98492e58ece3d`;
- cohort version `returning-player-v2-cohort/1.0.0-wr059-fail-closed`;
- cohort SHA-256 `ba40123b8a09d3d04b6124745ef289d6d13ce41e4e9cedb9c0ea0bc2717f1cc6`;
- accepted custody identities preserved: 15;
- snapshot admitted: 0;
- snapshot rejected: 15;
- expected historical cohort keys: 5,176;
- exact ordered keys preserved: 3,508;
- missing 2014–2017 TRAIN_ONLY ordered keys: 1,668;
- duplicate known keys: 0.

This checkpoint is not a passing WR-059 target and must not activate WR-060.

## Manager decision

Accept the R&D recommendation to create a new narrow post-WR-063 safe-consumer parser lane.

WR-065 is ASSIGNED to Work Helper in `STANDARD_CHAT` on branch:

`wr-065-retained-safe-consumer-parser`

WR-066 is pre-created but BLOCKED until Manager freezes one immutable WR-065 implementation/live-proof target.

WR-059 is BLOCKED on WR-066 acceptance plus exact WR-065 integration and mandatory canonical-main canary. Its historical PR #184 branch is frozen and will not be reused. Future R&D resumes on fresh branch:

`wr-059-v2-source-snapshot-cohort-remediation-2`

WR-060 remains BLOCKED until that future WR-059 branch publishes one complete immutable remediation target.

## WR-065 contract

Work Helper may create only the dedicated WR-065 workflow/scripts and Work Helper evidence authorized by the registry, plus the focused CI hook.

It must not modify accepted WR-063 workflow/script files or mutation-capable custody helpers.

The protected path must:

1. bind exactly the 15 historical WR-042 retained identities;
2. use non-mutating B2/R2 reads only;
3. verify exact authoritative SHA-256/size and B2/R2 equality for every input;
4. complete provider access before consumer execution;
5. prove provider credentials absent from the consumer;
6. let the consumer read only verified runner-temporary files and a local verified manifest;
7. re-hash/re-size every consumer input before parsing;
8. emit deterministic privacy-safe derived schema/row/key evidence only;
9. preserve raw bytes only in runner temp and upload zero raw-byte artifacts;
10. clean all raw bytes/reports on success and failure.

Any ambiguity in WR-039 typed-schema semantics must fail closed rather than create a new contract.

## Routing sequence

1. Work Helper executes WR-065 and publishes one immutable implementation/live-proof PR/head.
2. Manager freezes the exact target.
3. Auditor executes WR-066 independently.
4. PASS-family permits Manager to integrate only the exact audited WR-065 head.
5. Mandatory canonical-main canary must pass.
6. Manager then creates/fast-forwards the fresh WR-059 remediation branch and reassigns R&D.
7. Only a later complete immutable WR-059 target may activate WR-060.

## Boundaries

No upstream source-byte reacquisition, provider mutation, credential-value disclosure, `draft_picks.csv` use or replacement, 2026 regular-season outcome-table use, target joins, model fitting/scoring/tuning/comparison/evaluation, predictions, rankings, production changes, or Phase-6 work.

## Manager transaction rule

Coordinated control-plane transitions use one atomic Git tree/commit whenever supported.
