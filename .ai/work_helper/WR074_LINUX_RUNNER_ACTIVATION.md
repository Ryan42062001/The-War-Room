# WR-074 Linux Runner Activation Evidence

Task: WR-074 — Self-Hosted Heavy-CI Runner Pilot + Hardening

Activation checkpoint:
- Canonical base: `cb544da20c7b82ded5552d425d69b8a47c880f30`
- Reconciled WR-074 branch before this evidence commit: `0ce30648e0ef7bcd9467efdbbb785e40d80357f0`
- Dedicated routing contract: `[self-hosted, war-room-heavy-ci]`

User-operated runner state observed during activation:
- Windows War Room runner service intentionally stopped before Linux activation.
- Ubuntu 24.04 / WSL2 runner service installed under systemd and reported active/running.
- Repository runner UI showed the Linux runner online with labels:
  - `self-hosted`
  - `Linux`
  - `X64`
  - `war-room-heavy-ci`
- Windows runner remained offline.

Security boundary preserved:
- No workflow routing was weakened.
- No generic `self-hosted` fallback was added.
- No provider/custody secret was introduced.
- No fork or `pull_request_target` path was added.
- The pilot helper fails closed when `RUNNER_OS` is not `Linux`.

This evidence commit exists to create a fresh post-label pilot run so GitHub schedules a new job after the dedicated Linux runner became eligible.


## Playwright Linux dependency activation

The first Linux self-hosted execution reached Chromium launch but failed before test execution because `libnspr4.so` was absent. The background runner service was intentionally not granted passwordless sudo.

The user then performed a one-time interactive Playwright 1.63.0 Chromium dependency installation inside Ubuntu using the runner's Node 22.23.2 toolchain. This preserves least privilege: recurring WR-074 self-hosted jobs install only browser binaries and do not receive sudo authority.

This evidence-only update creates a fresh post-dependency pilot run. No workflow routing, credentials, custody boundary, product code, or test assertion was changed by this commit.


## First complete Linux parity pass

Post-dependency pilot run `35460866285` completed with:
- trust gate `105944368659` — SUCCESS
- self-hosted heavy parity `105944382151` — SUCCESS
- hosted heavy parity reference `105944382105` — SUCCESS

Self-hosted Linux evidence:
- preflight PASS; no node_modules/artifacts/sentinel residue survived cleanup from earlier attempts;
- `RUNNER_OS=Linux`, `X64`, WSL2 kernel; Node 22.23.2; npm 10.9.8; Playwright 1.63.0;
- provider/custody authority absent;
- precise workspace path not published by WR-074 helper evidence;
- stress benchmark: browser 10x 97,443 ms; determinism 5x 85,711 ms; total 183,154 ms;
- resilience 3x: 17,624 ms;
- canonical npm aggregate PASS;
- post-run cleanup PASS.

Matched GitHub-hosted reference:
- stress total 160,436 ms;
- resilience 3x 16,211 ms;
- same heavy parity sequence PASS;
- post-run cleanup PASS.

The self-hosted stress benchmark was approximately 14.2% slower than the hosted reference; resilience was approximately 8.7% slower. Functional parity passed.

This evidence-only update intentionally triggers a second post-success pilot run so persistent-workspace cleanup/repeatability is independently exercised again.
