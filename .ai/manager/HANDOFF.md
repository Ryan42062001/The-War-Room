# Manager / Architect Handoff

HANDOFF

STATUS: WR-074 REACTIVATED — SELF-HOSTED HEAVY-CI PILOT

CANONICAL WORKFLOW: V3.5
EXECUTION MODE: STANDARD_CHAT_HIGH
REFRESH MODE: FAST_REFRESH

Current canonical main at activation:
`94cb4826fc477d5bf592a37585f8cbea7574daea`

WR-074 is now ASSIGNED to the Work Helper / Super Troubleshooter.

Assigned branch:
`wr-074-self-hosted-heavy-ci-runner-pilot`

Preserved branch checkpoint:
`7b4641499c50541abf523267eb4c0255813e8b6d`

Live branch reconciliation fact:
- branch is 2 commits ahead / 348 commits behind current main;
- the only branch-unique changed paths are:
  - `.github/workflows/wr074-self-hosted-heavy-ci-pilot.yml`;
  - `scripts/ci/wr074-pilot.mjs`;
  - `scripts/validate-release-candidate.mjs`.

Work Helper must reconcile those exact task changes onto current canonical main before further substantive WR-074 work. Do not revive stale Manager/shared/research state from the old checkpoint.

Primary objective:
harden and validate the dedicated `[self-hosted, war-room-heavy-ci]` runner path without weakening hosted Governance, custody isolation, fork safety, permissions, cleanup, or release validation.

Execution mode remains `STANDARD_CHAT_HIGH`; no Work-mode credit is required.

If the dedicated self-hosted runner is unavailable, offline, or missing the `war-room-heavy-ci` label, fail closed and return the smallest exact user action. Do not weaken runner routing.

WR-075 remains BLOCKED for a later fresh independent audit after Manager freezes one immutable WR-074 target.
