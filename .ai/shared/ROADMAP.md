# War Room Roadmap

Status: ACTIVE DEVELOPMENT
Last updated: 2026-09-17
Owner: Manager / Architect

## Workflow foundation

- V3.3 — CANONICAL / ACCEPTED.
- V3.4 — CANDIDATE / REMEDIATED, pending fresh re-audit.
- WR-085 — AUDIT_READY pending final exact-head CI/freeze.
- WR-086 — COMPLETE / FAIL — REMEDIATION REQUIRED; immutable failed audit PR #232.
- WR-087 — ASSIGNED / fresh independent re-audit; execution waits for non-overlapping exact freeze evidence.
- All V3.3 exact-head, independent-audit, custody, fail-closed, collision, Manager-merge, CI and post-merge-canary controls remain mandatory.

Sequence: `final WR-085 full CI -> non-overlapping freeze -> WR-087 fresh audit -> PASS-family only: exact integration + full canonical-main canary -> V3.4 canonical disposition`

## Phase 5B — Returning-Player v2 evidence reset — ACTIVE

- WR-081 — BLOCKED before scoring.
- WR-083 — ASSIGNED / protected historical-scoring execution bridge.
- WR-084 — BLOCKED / independent bridge audit after exact freeze.
- WR-082 — BLOCKED / model-result audit after future WR-081 result target.

Critical path remains `WR-083 -> WR-084 -> bridge integration/canary -> WR-081 -> WR-082 -> composition -> composition audit -> Phase 6`.

## Infrastructure

- WR-074 — temporarily BLOCKED at `7b4641499c50541abf523267eb4c0255813e8b6d`.
- WR-075 — BLOCKED behind WR-074.
