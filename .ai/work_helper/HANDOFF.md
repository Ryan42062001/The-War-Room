# Work Helper / Super Troubleshooter Handoff

STATUS: COMPLETE — MANAGER FREEZE REQUIRED; WR-075 REMAINS BLOCKED  
TASK: WR-074 — Self-Hosted Heavy-CI Runner Pilot + Hardening  
WORKFLOW: V3.5  
BRANCH: `wr-074-self-hosted-heavy-ci-runner-pilot`  
CANONICAL BASE: `cb544da20c7b82ded5552d425d69b8a47c880f30`  
IMMUTABLE IMPLEMENTATION SHA: `c2e511da5d3767cbc0688de7e95236135a6975b2`

RESULT: The dedicated self-hosted heavy-CI route is functionally viable and hardened on Linux/WSL2 with exact labels `self-hosted`, `Linux`, `X64`, `war-room-heavy-ci`. Two complete repeated self-hosted runs passed the same heavy sequence as matched GitHub-hosted reference runs, including stale-workspace preflight, browser stress, WR-026, canonical npm aggregate, resilience, and cleanup.

SECURITY: Push-only exact WR-074 branch; GitHub-hosted trust gate; exact repo/ref/actor checks; `contents: read`; non-persistent checkout credentials; no PR/`pull_request_target` route; no workflow secret references; provider/custody authority denied on self-hosted; Linux fail-closed; exact `[self-hosted, war-room-heavy-ci]` routing retained.

HOSTED REFERENCE / RELEASE: War Room CI `35460498373` SUCCESS: classify `105943366474`, governance `105943388469`, test `105943414952`. Release validator reported 522 tracked files with permissions/identity clean.

REPEATED SELF-HOSTED EVIDENCE:
- run `35460866285`: self `105944382151` SUCCESS; hosted `105944382105` SUCCESS; trust `105944368659` SUCCESS.
- run `35461197805`: self `105945274820` SUCCESS; hosted `105945274919` SUCCESS; trust `105945263537` SUCCESS.
- both self-hosted preflights found no node_modules/artifacts/sentinel residue, Git clean, provider authority absent.
- both self-hosted cleanups PASS.

BENCHMARK: self-hosted stress was ~14.2% slower than hosted in run 1 and ~32.5% slower in run 2; two-run mean ~22.6% slower. Resilience was ~8.7% and ~29.3% slower; mean ~18.5% slower. Functional parity passed; no speed advantage was demonstrated.

MACHINE PREREQUISITE: Ubuntu 24.04 / WSL2 systemd runner. Playwright Linux OS dependencies were installed once interactively; recurring CI has no sudo authority. Windows heavy runner should remain offline or without `war-room-heavy-ci`.

EVIDENCE:
- `.ai/work_helper/WR074_LINUX_RUNNER_ACTIVATION.md`
- `.ai/work_helper/WR074_SELF_HOSTED_HEAVY_CI_REPORT.md`
- this handoff

BOUNDARIES: No retained-provider access; no credential-bearing workflow moved self-hosted; no canonical CI/custody/protected/production modifications; no merge; no WR-075 activation; no self-audit.

NEXT: Manager freezes the final PR head, retaining `c2e511da5d3767cbc0688de7e95236135a6975b2` as the immutable implementation SHA, reviews the benchmark/operational tradeoffs, and only then determines WR-075 disposition.
