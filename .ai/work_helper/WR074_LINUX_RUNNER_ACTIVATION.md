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
