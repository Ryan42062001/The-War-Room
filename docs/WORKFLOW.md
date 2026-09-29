# Speed Workflow V2.1

## Operating model

Ryan is Product Owner. ChatGPT is Manager/Architect/Planner. One Primary Codex Builder owns each phase by default. GitHub Actions provides mechanical validation. Independent audit is applied at the phase boundary according to risk.

The phase is the unit of product work and governance. Permanent AI departments, task-per-branch governance, per-task freezes, and per-task audits are retired. Historical workflow material is evidence, not active authority.

The canonical product plan is `docs/product/ROADMAP.md`. The reusable phase contract is `docs/workflow/PHASE_TEMPLATE.md`.

## Lifecycle

`PLANNED → BUILDING → PREVIEW_READY → PUNCH_LIST → FREEZE_READY → AUDITING → REMEDIATING → CLOSED`

`REMEDIATING` may return to `FREEZE_READY`. `CLOSED` is post-merge only.

Normal evidence flow:

`Build → FAST → Preview → Punch list → Owner approval → Phase Sync → FULL → Freeze → Audit/skip → Remediation/re-audit if needed → Owner merge authorization → Merge → post-merge FAST → Closure Sync → closure FAST → CLOSED`

## Phase contract

Before BUILDING, `.ai/CURRENT_PHASE.md` defines objective, scope, non-goals, ordered objectives, acceptance criteria, risk, automated validation, human preview, owner-only verification, exit criteria, and stop conditions.

Owner-only verification is not a new workflow state. Use it only for behavior automation cannot fully prove; otherwise write `None required.`

## Building and failure budget

Use one phase branch and one phase PR. Meaningful checkpoint commits are implementation checkpoints, not governance gates.

The three-attempt budget applies only to the same material implementation/security/data blocker. Documentation typos, CI wiring mistakes, stale evidence wording, or bookkeeping defects do not consume the implementation budget.

## Credit-saving execution order

For external/admin work:
1. Manager connector.
2. `OWNER ACTION REQUIRED` for a short safe manual step.
3. Codex browser/computer-use only when materially justified.

Codex effort is primarily for code, tests, builds, and reasoning-heavy debugging. Do not use Codex to operate the owner's ESPN account.

## Risk and audit policy

- **LOW:** ordinary styling/content/docs/simple low-impact work. Independent audit may be skipped only with recorded rationale and no material boundary.
- **MEDIUM:** calculations, state transformations, important business logic, or meaningful integration logic. One fresh independent phase audit is required.
- **HIGH:** auth/permissions/private external-account boundaries, production infrastructure, destructive operations, or other high-impact controls. One fresh independent phase audit plus focused boundary verification is required.

Findings are `BLOCKER / HIGH / MEDIUM / LOW / NIT`. BLOCKER/HIGH must be fixed. MEDIUM normally must be fixed unless explicitly deferred. LOW may be backlogged.

## CI

FAST CI runs on pushes and is not duplicated by ordinary PR open/synchronize events.

FULL PHASE CI is deliberate:
- apply the `full-phase-ci` PR label to trigger one labeled-event FULL run; or
- manually dispatch `ci.yml` in `full` mode.

FULL CI validates the exact PR head SHA.

## Preview, Phase Sync, freeze, and audit

Ryan reviews the whole phase and provides one consolidated punch list where practical. Complete owner-only verification before freeze.

After preview approval, Phase Sync updates only authoritative docs made stale by implementation. After Phase Sync, transient evidence belongs in PR comments rather than evidence-only commits.

Run FULL on the intended exact candidate, declare that SHA immutable after success, then perform the required risk-based audit. Remediation creates a new candidate and targeted re-audit.

## Merge and Closure Sync

No auto-merge. Ryan explicitly authorizes merge of the exact approved target.

After merge, verify post-merge FAST, record merge/audit evidence, mark the phase CLOSED, update stale roadmap/docs, record the next phase/metrics, and run closure FAST.

Normal product/workflow/infrastructure changes are PR-only. A direct-to-`main` Closure Sync is the sole docs-only bookkeeping exception.

Production deployment is separate and requires explicit Product Owner authorization.

## CLOSED contract

A CLOSED phase preserves phase/risk, final audited target or LOW-risk skip target, merge SHA, post-merge FAST, closure FAST, audit disposition/skip rationale, next phase, closure evidence, metrics, and persistent safety boundaries.
