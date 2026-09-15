# Manager / Architect Handoff

HANDOFF

Workflow: V3.2 CANONICAL

## Returning-Player v2 lane

WR-059 / WR-071 source-snapshot + cohort evidence is accepted.

Accepted evidence:

- WR-059 audited head `db8b21a65f2decf900902481f110758cc33f0aa6`;
- source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`;
- cohort `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`;
- WR-071 audit PR #202 / head `96a712ba2cf6a016ddbfdc0ea14cabba282bee04` / `PASS`, no findings;
- audit evidence merge `0eb20f940fcfe455da3129a54525a73e39c966c6`;
- WR-059 integration merge `2777ec44ca5b5f2fef77c07d17e4fa75b6013262`;
- post-integration CI `35009576671` classify/Governance SUCCESS.

WR-072 remains assigned to R&D on branch `wr-072-v2-model-protocol-feature-schema` in `STANDARD_CHAT` as the mandatory no-scoring protocol/feature-schema freeze. WR-073 remains blocked pending one immutable Manager-frozen WR-072 target.

No model fitting, scoring, tuning, prediction, evaluation, target/outcome join, production-ranking change, season-total composition, or Phase-6 authorization exists yet.

## Parallel infrastructure assignment — WR-074

Next infrastructure role: Work Helper / Super Troubleshooter / Cross-Functional Operator.

Task:

`WR-074 — Self-Hosted Heavy-CI Runner Pilot + Hardening`

Execution mode:

`STANDARD_CHAT`

Assignment mode:

`WORKFLOW / CI TROUBLESHOOTING — DIAGNOSIS + REMEDIATION`

Assigned branch:

`wr-074-self-hosted-heavy-ci-runner-pilot`

WR-074 is non-blocking and independent of WR-072/073.

Purpose: evaluate the user's local self-hosted GitHub Actions runner for the heavyweight War Room browser/test workload without making it canonical before audit.

Security boundary:

- The War Room repository is public.
- Arbitrary fork PR code must never execute on the self-hosted runner.
- Do not use `pull_request_target` to execute untrusted PR-head code.
- Use a dedicated runner label, preferred `war-room-heavy-ci`, plus `self-hosted`.
- Keep `classify` and `governance` GitHub-hosted.
- Keep custody/protected-proof/credential-bearing workflows GitHub-hosted.
- Do not inject B2/R2/provider secrets or retained raw source bytes.
- Use least-privilege workflow permissions and clean-workspace controls.
- Preserve GitHub-hosted heavy CI as fallback/reference during the pilot.

Work Helper may write only:

- `.ai/work_helper/**`;
- bounded `.github/workflows/**` for the runner pilot;
- `scripts/ci/**` only if a dedicated helper is necessary.

Do not modify Manager/shared, Auditor, Research, product code, ranking/model/data logic, or custody scripts.

Required return evidence includes exact runner labels, trusted trigger boundary, workflow permissions, clean-workspace/preflight behavior, exact pilot run IDs/head/result, parity with the canonical heavy test commands, comparable GitHub-hosted benchmark, repeated-run evidence, fallback/reference evidence, changed files, and unresolved operational risk.

If the dedicated label is missing or the runner is offline/incompatible, fail closed and return the exact user action required rather than weakening routing security.

Work Helper opens its own PR and does not merge it or activate WR-075.

## WR-075

WR-075 is pre-created and BLOCKED on branch:

`wr-075-self-hosted-heavy-ci-runner-audit`

Manager activates it only after independently freezing one immutable WR-074 target with exact run/security evidence.

PASS-family WR-075 plus Manager disposition is required before the self-hosted configuration becomes canonical CI infrastructure.
