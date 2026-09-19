# WR-074 Self-Hosted Heavy-CI Runner Pilot + Hardening — Final Work Helper Report

Status: COMPLETE — MANAGER FREEZE REQUIRED; WR-075 REMAINS BLOCKED  
Workflow: canonical V3.5  
Canonical base: `cb544da20c7b82ded5552d425d69b8a47c880f30`  
Branch: `wr-074-self-hosted-heavy-ci-runner-pilot`  
Immutable implementation SHA: `c2e511da5d3767cbc0688de7e95236135a6975b2`

## Reconciliation

The preserved WR-074 branch was intentionally stale. It was rebased by reconstruction onto exact current canonical main `cb544da20c7b82ded5552d425d69b8a47c880f30`, transplanting only the task-owned pilot workflow/helper intent and the current release-validator allowlist addition. No stale Manager/shared/research/custody state was imported.

The final implementation diff from canonical base contains:
- `.github/workflows/wr074-self-hosted-heavy-ci-pilot.yml`
- `scripts/ci/wr074-pilot.mjs`
- `scripts/validate-release-candidate.mjs` (+1 current-V3.5 allowlist entry for the pilot)
- Work Helper evidence under `.ai/work_helper/**`

Temporary Windows diagnostic/shim files were removed before the final implementation target.

## Security architecture

The final pilot preserves:
- trigger: push only to exact branch `wr-074-self-hosted-heavy-ci-runner-pilot`;
- trusted-ref gate on GitHub-hosted `ubuntu-latest`;
- exact repository, exact ref, and actor `Ryan42062001` gate;
- no `pull_request` or `pull_request_target` execution route;
- top-level `permissions: contents: read`;
- `actions/checkout@v7` with `persist-credentials: false`;
- exact dedicated route `[self-hosted, war-room-heavy-ci]`;
- helper fail-closed requirement that runner OS is Linux;
- provider/custody authority environment denial;
- no workflow `secrets.*` references;
- bounded `git reset --hard HEAD` + `git clean -ffdx` preflight/cleanup;
- no precise workspace-path publication by the WR-074 helper;
- runner-name evidence emitted only as SHA-256 by the helper.

Canonical `.github/workflows/ci.yml`, custody/protected workflows, protected wrapper code, research/model/data/application files, and production ranking logic are unchanged.

Arbitrary fork pull-request code cannot enter this pilot: the workflow has no PR trigger and the trust gate requires a same-repository trusted branch push by the expected actor.

## Runner activation / labels

Dedicated Linux runner labels verified in repository UI:
- `self-hosted`
- `Linux`
- `X64`
- `war-room-heavy-ci`

The prior Windows War Room runner was intentionally stopped/offline after native Windows Chromium demonstrated non-parity layout metrics. It was not made eligible by weakening labels.

The active dedicated runner uses Ubuntu 24.04 under WSL2 with systemd service operation. One-time Playwright Linux OS dependencies were installed interactively by the user. Recurring CI does not receive sudo authority; self-hosted workflow browser setup uses `npx playwright install chromium`.

## Historical troubleshooting evidence

Historical pilot run `35019774970` was refreshed rather than accepted as current proof.

Current remediation exposed and fixed/contained these environment-specific boundaries without weakening tests:
1. no dedicated runner registered;
2. Windows service PowerShell policy behavior;
3. native Windows Chromium command-bar geometry failed the unchanged canonical `+20px` layout assertion while hosted Linux passed;
4. Windows normalization experiments were rejected and removed;
5. Linux runner initially lacked the custom route label;
6. Linux service could not use interactive sudo for `--with-deps`;
7. initial Linux Chromium launch lacked `libnspr4.so`; one-time interactive Playwright OS dependency installation resolved it.

No canonical product/test assertion was weakened to claim parity.

## Clean hosted reference / release validation

Implementation-head War Room CI:
- run `35460498373` — SUCCESS
- classify `105943366474` — SUCCESS
- governance `105943388469` — SUCCESS
- test `105943414952` — SUCCESS
- bootstrap-reuse — SKIPPED by classifier

The test job passed browser stress, WR-026 phone decision view, canonical `npm test`, resilience syntax, and backup/offline reload.

Release validation inside canonical `npm test` reported:
`Release-candidate repository guard valid: 522 tracked files, permissions and identity clean.`

## Complete Linux parity run 1

Pilot run `35460866285`:
- trust gate `105944368659` — SUCCESS
- self-hosted heavy parity `105944382151` — SUCCESS
- hosted heavy parity `105944382105` — SUCCESS

Self-hosted preflight:
- no surviving `node_modules`, artifacts, or sentinel;
- Git clean;
- provider/custody authority absent.

Self-hosted environment:
- Linux / X64 / WSL2;
- Node 22.23.2;
- npm 10.9.8;
- Playwright 1.63.0;
- precise workspace path not published by helper.

Benchmark:
- self-hosted stress total: 183,154 ms
- hosted stress total: 160,436 ms
- self-hosted was ~14.2% slower for this stress benchmark
- self-hosted resilience 3x: 17,624 ms
- hosted resilience 3x: 16,211 ms
- self-hosted was ~8.7% slower for resilience

Both lanes passed the same heavy stress sequence, WR-026, canonical npm aggregate, resilience, and cleanup.

## Complete Linux parity run 2 / persistent-workspace proof

Pilot run `35461197805`:
- trust gate `105945263537` — SUCCESS
- self-hosted heavy parity `105945274820` — SUCCESS
- hosted heavy parity `105945274919` — SUCCESS

The second self-hosted preflight again found:
- no surviving `node_modules`;
- no artifacts;
- no sentinel;
- Git clean;
- provider/custody authority absent.

This second clean preflight followed a complete prior successful self-hosted run and cleanup, providing the repeated-run stale-workspace proof.

Benchmark:
- self-hosted stress total: 182,270 ms
- hosted stress total: 137,516 ms
- self-hosted was ~32.5% slower for this stress benchmark
- self-hosted resilience 3x: 18,956 ms
- hosted resilience 3x: 14,655 ms
- self-hosted was ~29.3% slower for resilience

Across the two successful runs:
- mean self-hosted stress: 182,712 ms
- mean hosted stress: 148,976 ms
- mean self-hosted stress was ~22.6% slower
- mean self-hosted resilience: 18,290 ms
- mean hosted resilience: 15,433 ms
- mean self-hosted resilience was ~18.5% slower

Functional heavy-test parity passed on both repeated runs; the pilot did not demonstrate a speed advantage over GitHub-hosted in these observations.

## Custody / secret / local-machine boundary

Self-hosted evidence reported `provider_authority_present: false` on every successful preflight/environment/cleanup path. The pilot has no B2/R2/provider secret references and does not retrieve retained raw-source bytes.

No credential-bearing custody/protected workflow was moved to self-hosted.

The WR-074 helper does not publish a precise workspace path or raw runner name. GitHub's standard self-hosted bootstrap logs still expose routine runner metadata (configured runner name and host metadata); no credentials or unrelated local-file contents were emitted by WR-074.

## Hosted fallback

Canonical War Room CI remains GitHub-hosted and unchanged. The pilot also carries a matched GitHub-hosted heavy-reference lane. Self-hosted unavailability therefore does not remove the canonical hosted validation path.

## Operational risks

- WSL2 Linux runner availability depends on the Ubuntu distro/systemd service being active. After a Windows reboot, WSL may require startup before the runner appears online.
- Playwright OS dependencies are machine state installed outside the repository. A fresh/rebuilt Linux runner needs that one-time prerequisite again.
- The self-hosted runner is persistent hardware controlled by the user; preflight/cleanup reduce workspace carryover but do not make the host disposable.
- GitHub standard runner bootstrap metadata is visible in Actions logs for a public repository.
- Observed self-hosted performance was slower than hosted in both successful benchmark runs; WR-074 establishes functional/security viability, not a performance gain.
- The Windows runner remains unsuitable for this heavy browser parity route under the unchanged current layout contract and should remain offline or without the custom heavy-CI label.

## Prohibited-action attestation

WR-074 did not:
- weaken routing to generic `self-hosted`;
- route the heavy job to GitHub-hosted merely to claim self-host success;
- add `pull_request_target`;
- expose provider/custody credentials;
- access retained provider data;
- modify canonical `ci.yml`;
- modify custody/protected workflows or scripts;
- modify production/ranking/model/data/application files;
- merge the task;
- activate WR-075;
- perform its own independent audit.

## Manager gate

Manager should freeze the final WR-074 branch/PR target and independently decide disposition. WR-075 remains BLOCKED until that freeze. This Work Helper result is execution evidence, not an independent audit verdict.
