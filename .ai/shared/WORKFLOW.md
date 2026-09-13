# War Room Team Workflow

Status: ACTIVE — WORKFLOW V3.1.1
Last updated: 2026-09-12
Owner: Manager / Architect

This is the canonical workflow for **The War Room**, the live fantasy-football **DRAFT** assistant. Repository state overrides stale chat memory. If older workflow guidance conflicts with this file, this file wins unless Manager records a newer approved workflow change.

## Project identity boundary
- **The War Room** = live fantasy-football draft assistant.
- **The Chip Winner** = separate in-season fantasy helper.
- **Family Finance Hub** = separate personal-finance application.
- **ECOG** = separate church website.

Do not mix repositories, roadmaps, decisions, tasks, evidence, or employee roles across these projects without an explicit cross-project task.

## Core operating model
**ROLE = DURABLE**  
**CHAT = DISPOSABLE EXECUTION SESSION**  
**TASK = UNIT OF WORK**  
**REPOSITORY = DURABLE MEMORY**  
**MANAGER = ROUTER / INTEGRATOR / CANONICAL-STATE AUTHORITY**

Permanent roles remain intentionally small: Manager, Builder, Draft Strategy, R&D, Independent Auditor, and Work Helper. Scale throughput with task-scoped chats rather than creating permanent roles merely for parallelism.

## Canonical sources and refresh
`.ai/shared/ACTIVE_TASKS.json` is the Manager-owned active-only machine index. CLOSED history lives in task specs, PRs, reports, handoffs, decisions, commits, and Git history.

Human-readable canonical sources are `.ai/shared/PROJECT_STATE.md`, `.ai/shared/ROADMAP.md`, `.ai/shared/DECISIONS.md`, this workflow, Manager handoff, active task specs, role charters, and relevant specialist evidence.

Use Fast Refresh for routine status/resumption. Use Full Refresh before meaningful task creation/activation, workflow/architecture/roadmap changes, important merges/releases, milestone dispositions, contradiction resolution, or materially stale checkpoints.

## Task lifecycle
Meaningful work uses `WR-###`. Lifecycle values are `PLANNED`, `BLOCKED`, `ASSIGNED`, `IN_PROGRESS`, `MANAGER_REVIEW_READY`, `AUDIT_READY`, `MERGE_READY`, `REWORK_REQUIRED`, `MERGED`, and `CLOSED`. Workers report readiness; Manager owns registry transitions. CLOSED tasks are removed from the active-only registry after reconciliation.

## Blocker typing
Every active task carries `blocker_type`, `user_action_required`, `blocked_on_tasks`, and human-readable `blocked_on` data. Valid blocker types are `NONE`, `USER_ACTION`, `UPSTREAM_TASK`, `EXTERNAL_SERVICE`, `TECHNICAL`, and `AUDIT`.

`BLOCKED` and `REWORK_REQUIRED` require a non-NONE blocker. `user_action_required: true` means the user's action is genuinely the next gate, not merely that a worker has not tried the available technical path. The generated view `node scripts/workflow-user-actions.mjs` is the user-action queue; do not maintain a second manual queue.

## Same-role concurrency and collision safety
A durable role is not a single-worker lock. Manager may run multiple task-scoped chats for the same role when tasks are independent or safely soft-dependent, branches are dedicated, write surfaces/integration order are controlled, no worker audits its own material changes, and no workers independently mutate Manager-owned canonical state.

`workflow-state-check.mjs` fails closed on duplicate active branch claims, duplicate worker slots, duplicate owned PRs, dependency cycles, and unsafe write-prefix overlap between simultaneously runnable non-HARD tasks. Forbidden subpaths are respected when evaluating overlap. If overlap is intentional, serialize it with an explicit HARD dependency or narrow the authorized write scopes rather than bypassing the check.

## Work mode and routing
Manager classifies meaningful tasks `STANDARD_CHAT`, `WORK_MODE_PREFERRED`, or `WORK_MODE_HIGH_VALUE`; Work mode is an accelerator, not a dependency when normal-chat capabilities exist.

Routing authority:
- Draft Strategy: recommendation policy and why.
- R&D: external data/APIs/source rights/models/experiments/technical uncertainty.
- Builder: approved production implementation and routine debugging.
- Auditor: independent validation and PASS/FAIL gates.
- Work Helper: cross-layer blockers, contradictory repository/PR/CI evidence, infrastructure/workflow problems, hidden dependencies, difficult remediation.

Manager retains roadmap, task routing, canonical state, durable decisions, acceptance, and merge authority.

## Work Helper and anti-loop
Work Helper is a privileged technical operator, not a second Manager. Activation defines task, blocker, target, read/write scope, execution mode, required evidence, governance boundaries, and handoff. Default writes are `.ai/work_helper/**` plus specifically authorized diagnostic/test surfaces.

Normal roles stop speculative iteration after roughly three materially different failed approaches without meaningful new evidence and persist what is known/tried/missing before escalation. Work Helper may continue materially distinct evidence-driven attempts without a fixed numerical ceiling.

## Evidence hierarchy
Prefer repository contents; runtime/test output; verified branch/commit/PR state; authoritative external/provider metadata; approved decisions; specialist reports/handoffs; chat summaries; assumptions. Never present an assumption as verified fact.

## External authority evidence
When external provider state materially affects acceptance, set `external_authority_evidence_required: true`. Preserve privacy-safe provider-issued evidence for resource identity, actual permission/token/key scope, resource restrictions, retention/lock/security configuration, exact resource/credential binding, secret-redaction requirements, and what must be re-proved after credential/policy changes. Intended least privilege is not proof of actual least privilege. Never commit reusable secrets.

## Parallel dependency classes
- `INDEPENDENT`: may run simultaneously.
- `SOFT`: may run simultaneously with controlled integration.
- `HARD`: sequential gate.

Parallel workers use dedicated branches, minimize overlap, preserve starting/checkpoint state, do not independently edit `.ai/shared/*`, and check target advancement before readiness/merge.

## Audit-target metadata and exact-head pinning — V3.1.1
Active Auditor assignments identify `audit_target_task`, `audit_target_pr`, and `audit_target_branch`. `audit_target_sha` may remain null while the Auditor is merely ASSIGNED because an implementation commit cannot reliably contain a self-reference to its own final commit SHA.

Immediately before substantive audit execution, Manager must run `node scripts/workflow-live-state-check.mjs --task WR-###` or equivalent direct GitHub verification, freeze the returned target PR-head SHA in the activation/evidence, and instruct Auditor to audit exactly that immutable SHA. If the target later moves, apply target-advancement rules; never silently carry a verdict onto a materially changed target.

## Live GitHub state gate — V3.1.1
`workflow-live-state-check.mjs` is a read-only Manager gate. It cross-checks recorded task branches, owned PRs, worker checkpoints, and Auditor target PR/branch/SHA against live GitHub state. Contradictions fail the gate.

External GitHub/API unavailability is reported separately from a contradiction and exits distinctly. Because network availability is not repository correctness, this live check is syntax-checked by Governance CI but is not an always-on network-dependent CI step. Manager must retry or use equivalent direct GitHub verification before a readiness/merge decision that requires live truth.

## Target advancement
Classify target movement as `CURRENT`, `CONTROL_PLANE_ONLY`, `NON_OVERLAPPING`, or `OVERLAPPING_RISK`. Control-plane-only advancement does not force expensive product revalidation. Non-overlapping advancement gets bounded integration/smoke validation. Overlapping risk must reconcile before audit/merge and rerun materially affected evidence.

## Workflow helper scripts
Read-only helpers:
- `node scripts/workflow-state-check.mjs`
- `node scripts/workflow-live-state-check.mjs [--task WR-###] [--repo owner/name]`
- `node scripts/workflow-user-actions.mjs [--json]`
- `node scripts/workflow-preflight.mjs --task WR-###`
- `node scripts/workflow-finish-check.mjs --task WR-###`

`workflow-state-check` validates active registry schema/version, task/spec lifecycle consistency, blocker/dependency metadata, task/role files, SHA formats, uniqueness/collision safety, dependency cycles, Auditor target metadata, and active-only discipline. Static state-check failure is a Governance CI failure.

`workflow-live-state-check` verifies live GitHub truth at Manager gates. `workflow-user-actions` is a generated view only. Preflight/finish helpers remain task-scoped and do not prove CI/test execution or audit publication.

## Path-aware CI
Every push/PR runs Governance CI: checkout, Node setup, syntax checks for all workflow helpers, and the static state checker. The expensive Full War Room CI runs when any changed path is outside `.ai/**`, including production, datasets, extensions, `scripts/**`, `.github/workflows/**`, package files, or test harnesses. A `force-full-ci` PR label also forces the full matrix. Classifier uncertainty/missing base/diff failure fails upward to Full CI.

`.ai/**`-only evidence/control-plane PRs therefore skip the expensive product/browser matrix by default, while tool/workflow/product changes cannot silently receive governance-only treatment.

## Validation levels
Level 1 static correctness; Level 2 automated tests/integration/CI; Level 3 controlled draft simulations; Level 4 real/mock draft validation. A lower level does not prove a higher one.

## Auditor publication contract
An audit is not COMPLETE merely because a verdict was reached in chat or committed locally. Before COMPLETE, Auditor publishes: task-specific report under `.ai/auditor/**`; concise Auditor handoff; immutable audit branch/head; and an audit PR containing only Auditor-authorized evidence unless explicitly broadened.

The audit PR identifies audited target PR/head, audit branch/head, verdict, findings, evidence/CI verified, and exact Manager action authorized. If the environment cannot create the PR, return `BLOCKED — AUDIT PUBLICATION REQUIRED`; do not ask Manager to package the audit.

## Pull request and merge protocol
Worker PRs record TASK ID, ROLE, OBJECTIVE, STARTING SHA, FINAL SHA, FILES CHANGED, REQUIREMENTS IMPLEMENTED, TESTS ACTUALLY RUN, RESULTS, UNVERIFIED ITEMS, KNOWN RISKS, DEPENDENCIES, and RECOMMENDED NEXT ROLE. Provider-dependent work also records EXTERNAL AUTHORITY EVIDENCE.

Before merging, Manager verifies approved task/target, exact head, live PR/branch state where material, target advancement, scope, required tests/CI, unresolved findings, audit requirement, handoffs/evidence, and integration implications. No unresolved CRITICAL/HIGH finding may be ignored. Audit-required work needs independent `PASS` or `PASS WITH NON-BLOCKING FINDINGS`.

## Post-merge canary
Audited CI/browser/test-harness/persistence/shared-infrastructure/build/release changes enter transient `MERGED`, not CLOSED. Relevant canonical-main push/full CI must pass before Manager closes. Failure preserves the historical exact-head audit verdict and creates/reroutes residual remediation instead of rewriting history or retrying until green.

## Atomic Manager reconciliation
One logical Manager transition should land as one logical Git transaction whenever tooling supports it. Prefer one tree/commit or one squash/merge transaction for coordinated active registry, project state, roadmap, Manager handoff, and task-spec changes. If tooling cannot make it atomic, disclose the limitation, minimize the inconsistency window, and reconcile immediately before routing more work.

## Canonical-document scope
- `ACTIVE_TASKS.json`: active machine control-plane index.
- `PROJECT_STATE.md`: current baseline/blockers/next gates.
- `ROADMAP.md`: milestones/material dispositions.
- `DECISIONS.md`: durable product/architecture decisions only.
- specialist task/research/strategy/audit/work-helper reports: detailed evidence.
- handoffs: concise pointers and next action.

Do not duplicate full evidence tables across canonical files.

## Manager activation output and worker bootstrap
When next work is determined, end with `ACTIVATE NOW` covering Manager, Builder, Draft Strategy, R&D, Auditor, and Work Helper. Multiple entries for one durable role are allowed when concurrency rules pass. Include CHAT, TASK, EXECUTION MODE, activation message, and fallback where relevant.

Fresh worker chats should bootstrap from repository pointers rather than copied transcript history: read this workflow, active registry, role charter, assigned task spec, relevant handoff, and execute only the assigned task.

## Workflow principle
Use the smallest permanent team that preserves meaningful separation. Scale throughput with task-scoped concurrency plus machine collision checks, not extra permanent roles. Preserve independent audit and Manager integration authority. Spend expensive validation where changed surfaces justify it while keeping governance checks always on.
