# War Room Team Workflow

Status: ACTIVE — WORKFLOW V3.3
Last updated: 2026-09-16
Owner: Manager / Architect

This is the canonical workflow for **The War Room**, the live fantasy-football **DRAFT** assistant. Repository state overrides stale chat memory. If older workflow guidance conflicts with this file, this file wins unless Manager records a newer approved workflow change.

## V3.4 — ChatGPT usage efficiency candidate (WR-085)

Status: **CANDIDATE**. V3.3 remains canonical until the currently assigned fresh independent audit returns PASS-family on one exact Manager-frozen WR-085 target, Manager integrates only that audited target, and the required canonical-main canary passes.

V3.4 changes resource-routing defaults, not safety authority. All V3.3 exact-head, branch, collision, custody/provider, fail-closed, independent-audit, CI, Manager-merge and post-merge-canary guarantees remain mandatory.

Desired operating sequence:

`Manager scopes narrowly -> FAST_REFRESH -> STANDARD_CHAT_HIGH by default -> consume accepted upstream decisions -> WORK_MODE only for substantial autonomous execution -> implementer self-validates -> Manager freezes exact target -> fresh independent audit in STANDARD_CHAT_HIGH -> compact handoff -> reuse chats when safe -> spawn only when value exceeds orientation cost.`

### Execution modes

There are exactly two execution modes:

- `STANDARD_CHAT_HIGH` — default for reasoning, planning, Manager/control-plane work, architecture, strategy, policy, research/R&D analysis, independent audit, code review, bounded implementation/remediation, test design, PR/CI inspection, repository/GitHub analysis, and diagnosis from available evidence.
- `WORK_MODE` — scarce autonomous-execution resource for tasks where hands-on computer/tool execution materially reduces user interaction or execution overhead: significant multi-file implementation, long edit-test-diagnose-fix loops, extensive terminal/browser/application interaction, repeated environment manipulation, complicated CI remediation, substantial hands-on debugging, large mechanical changes, or active experimentation across several hypotheses.

Routing test for every assignment:

> Does autonomous computer/tool execution materially reduce user interaction or execution overhead compared with STANDARD_CHAT_HIGH?

If NO, use `STANDARD_CHAT_HIGH`. If YES and the execution burden is substantial, use `WORK_MODE`. If marginal or uncertain, use `STANDARD_CHAT_HIGH`.

Importance, difficulty, code relevance, GitHub relevance, file count, priority, or strong reasoning needs alone do not justify `WORK_MODE`. Work is an accelerator, not a capability dependency when Standard Chat High can continue safely.

Whenever practical, Standard Chat roles resolve architecture/policy/research decisions first so a Work assignment receives exact scope, acceptance criteria, accepted upstream decisions, branch/base, tests, forbidden scope, blockers and completion criteria.

A Standard Chat worker may return `WORK_MODE_ESCALATION_RECOMMENDED` with task, branch, exact SHA, PR if applicable, work completed, remaining work, exact reason autonomous execution materially helps, files/components, tests already run, known failures, required validation and exact next action. The Work session continues from that state rather than restarting.

A Work worker returns `STANDARD_CHAT_HIGH_HANDOFF_RECOMMENDED` once remaining work is primarily reasoning, interpretation, audit, architecture, documentation or control-plane routing. Preserve established branch/SHA/PR/evidence.

Optimize for **maximum useful autonomous execution per Work session**, not merely minimum Work-session count.

### Refresh modes

`FAST_REFRESH` is the default. Minimum normal context is current main SHA, `.ai/shared/ACTIVE_TASKS.json`, role charter, assigned task spec, current role handoff, explicitly named accepted upstream artifacts, and exact branch/PR/test/CI evidence required by the task.

`FULL_REFRESH` is exceptional. Use it only when Fast Refresh cannot establish authoritative state, control-plane state is ambiguous/contradictory, a major workflow/control-plane reconciliation genuinely requires broad context, milestone/integration risk warrants it, or an independent audit explicitly needs broader verification. Every FULL_REFRESH assignment records `refresh_reason`. Importance alone is not a reason.

Bounded Remediation Refresh remains available for explicitly bounded same-task remediation after a published audit finding.

### Manager execution packet

Before routing implementation/remediation, Manager should provide whenever practical: task ID; exact role; execution mode; refresh mode; canonical base branch and exact base SHA when relevant; assigned branch; expected PR if known; approved scope; forbidden scope; accepted upstream decisions; exact artifacts to read; implementation requirements; acceptance criteria; required tests; CI expectations; known blockers; completion definition; and handoff destination.

Workers should not rediscover information Manager already knows.

### Decision-consumption rule

Accepted authoritative upstream artifacts are inputs, not invitations to re-litigate. Builder implements accepted Strategy/R&D/policy contracts; Auditor verifies them; Manager routes them. Downstream workers do not reopen accepted decisions unless contradictory evidence is discovered. Contradictory evidence fails closed and routes back to the owning role/Manager rather than silently redefining semantics.

### Audit readiness

Do not launch formal independent audit until implementation is reasonably complete and self-validated. Before Manager freeze, the implementer normally finishes approved scope, runs required tests/lint/build/typecheck as applicable, resolves expected failures, inspects its full diff, verifies no unrelated changes, updates implementation evidence and publishes one final candidate SHA.

The mechanical audit-readiness preflight remains a preflight, not a verdict. Independent audit remains mandatory wherever required.

### Chat reuse and worker-spawn cost

A new task ID does not itself require a fresh chat. Reuse a same-project/same-role chat for closely related sequential work when context remains directly relevant, state can be refreshed safely, and independence is not required.

Use a fresh chat when independent audit requires it, role separation matters, prior context may bias the task, or the chat is excessively stale/large/confused.

Before spawning any worker, Manager checks:
1. Has another role already answered this question?
2. Can the current chat safely complete it?
3. Is a new worker actually required?
4. Does independence require a fresh chat?
5. Is FULL_REFRESH really required?
6. Is WORK_MODE really required?
7. Can the context set be smaller?
8. Can tightly related low-risk follow-up be batched?
9. Is the execution packet precise enough to prevent rediscovery?
10. Is a separate worker lane worth its orientation cost?

Tightly related low-risk correction + test + documentation/handoff may be one remediation unit when role/separation rules permit. Never batch unrelated features, independent policy decisions, work owned by different roles, or work requiring separate audit ownership.

### Compact handoff standard

Use continuation-oriented headings when applicable:

`STATUS | TASK | ROLE | BRANCH | HEAD | BASE | PR | DONE | CHANGED | TESTS | CI | BLOCKERS | DECISIONS CONSUMED | NEXT ACTION | FILES / ARTIFACTS THAT MATTER | DO NOT REPEAT`

Detailed history belongs in task-specific reports/evidence and should be referenced, not copied into every handoff.

## V3.3 — audit-readiness + Manager transition efficiency

WR-078 implemented the bounded Workflow V3.3 efficiency upgrade. Historical WR-079 independently found two MEDIUM defects; WR-078 remediated both without broadening scope. WR-080 then independently audited exact remediated head `d952099946b51c5d4d8a88929ca83d1d4dce3521` and returned `PASS` with no findings. The exact audited implementation was integrated through PR #217 as canonical-main merge `534f79a4f560d03c1ddf6309f9c416e3373e48b5`, and mandatory canonical-main Full War Room CI `35143657933` completed `SUCCESS` across classify, Governance, browser/product tests, `npm test`, resilience syntax, and backup/offline reload validation. V3.3 is canonical.

V3.3 preserves all V3.2 lane-identity, collision, custody, exact-head, live-state, independent-audit, Manager-authority, fail-closed, and post-merge-canary guarantees. Its efficiency changes are additive:

- mechanical audit-readiness preflight for active audit-required lanes before Manager freeze;
- deterministic machine-readable readiness packets bound to the exact PR head;
- Manager-owned task-specific readiness contracts for known mechanical invariants;
- a dry-run-by-default Manager transition helper with rollback on static-state failure;
- **Bounded Remediation Refresh** for explicitly bounded same-task remediation after a published audit finding;
- no helper may issue an Auditor verdict, merge audited work, bypass live verification, or weaken source/custody controls.

Pull-request readiness attribution is bound to the canonical repository identity and, when recorded, the exact task PR identity; same-branch public-fork PRs are not attributed to the active task. `version_bump` comparison authority validates the comparison ref separately from path existence and fails closed on invalid/unresolved refs.

## V3.2 — inherited lane identity enforcement

WR-054 implemented Workflow V3.2, WR-055 independently returned `PASS`, and canonical-main post-merge canary `34872984380` completed `SUCCESS`. V3.3 inherits these accepted controls.

Task-scoped preflight and finish checks fail closed when the checked-out branch does not equal the branch assigned in `ACTIVE_TASKS.json`, including detached HEAD. Static workflow state validation binds each active task spec's `TASK ID`, `STATUS`, `TARGET BRANCH`, `EXECUTION MODE`, and dependency class to registry truth while permitting descriptive dependency suffix text after the machine token.

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

Use **FAST_REFRESH** by default for routine status, task startup, task creation/activation, continuation, most Manager routing, most merges, and assigned audits when the minimum authoritative context is sufficient.

Use **Bounded Remediation Refresh** only for same-task remediation after a published audit finding when Manager explicitly bounds the rework.

Use **FULL_REFRESH** only for a documented V3.4 exception. Record the reason. Importance alone is not sufficient.

## Task lifecycle
Meaningful work uses `WR-###`. Lifecycle values are `PLANNED`, `BLOCKED`, `ASSIGNED`, `IN_PROGRESS`, `MANAGER_REVIEW_READY`, `AUDIT_READY`, `MERGE_READY`, `REWORK_REQUIRED`, `MERGED`, and `CLOSED`. Workers report readiness; Manager owns registry transitions. CLOSED tasks are removed from the active-only registry after reconciliation.

## Blocker typing
Every active task carries `blocker_type`, `user_action_required`, `blocked_on_tasks`, and human-readable `blocked_on` data. Valid blocker types are `NONE`, `USER_ACTION`, `UPSTREAM_TASK`, `EXTERNAL_SERVICE`, `TECHNICAL`, and `AUDIT`.

`BLOCKED` and `REWORK_REQUIRED` require a non-NONE blocker. `user_action_required: true` means the user's action is genuinely the next gate, not merely that a worker has not tried the available technical path. The generated view `node scripts/workflow-user-actions.mjs` is the user-action queue; do not maintain a second manual queue.

## Same-role concurrency and collision safety
A durable role is not a single-worker lock. Manager may run multiple task-scoped chats for the same role when tasks are independent or safely soft-dependent, branches are dedicated, write surfaces/integration order are controlled, no worker audits its own material changes, and no workers independently mutate Manager-owned canonical state.

`workflow-state-check.mjs` fails closed on duplicate active branch claims, duplicate worker slots, duplicate owned PRs, dependency cycles, and unsafe write-prefix overlap between simultaneously runnable non-HARD tasks. Forbidden subpaths are respected when evaluating overlap. If overlap is intentional, serialize it with an explicit HARD dependency or narrow the authorized write scopes rather than bypassing the check.

## Work mode and routing
Manager classifies meaningful tasks using exactly `STANDARD_CHAT_HIGH` or `WORK_MODE` under the V3.4 routing test. Standard Chat High is the default; Work mode requires a concrete execution-heavy benefit and remains an accelerator rather than a dependency when Standard Chat can continue safely.

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

## Audit-target metadata and exact-head pinning
Active Auditor assignments identify `audit_target_task`, `audit_target_pr`, `audit_target_branch`, and the frozen target SHA when Manager has frozen it.

Immediately before substantive audit execution, Manager must run `node scripts/workflow-live-state-check.mjs --task WR-###` or equivalent direct GitHub verification, freeze the returned target PR-head SHA in activation/evidence, and instruct Auditor to audit exactly that immutable SHA. If the target later moves, apply target-advancement rules; never silently carry a verdict onto a materially changed target.

## Live GitHub state gate
`workflow-live-state-check.mjs` is a read-only Manager gate. It cross-checks recorded task branches, owned PRs, worker checkpoints, and Auditor target PR/branch/SHA against live GitHub state. Contradictions fail the gate.

External GitHub/API unavailability is reported separately from a contradiction and exits distinctly. Because network availability is not repository correctness, this live check is syntax-checked by Governance CI but is not an always-on network-dependent CI step. Manager must retry or use equivalent direct GitHub verification before a readiness/merge decision that requires live truth.

## Target advancement
Classify target movement as `CURRENT`, `CONTROL_PLANE_ONLY`, `NON_OVERLAPPING`, or `OVERLAPPING_RISK`. Control-plane-only advancement does not force expensive product revalidation. Non-overlapping advancement gets bounded integration/smoke validation. Overlapping risk must reconcile before audit/merge and rerun materially affected evidence.

## Workflow helper scripts
Read-only/advisory helpers:
- `node scripts/workflow-state-check.mjs`
- `node scripts/workflow-live-state-check.mjs [--task WR-###] [--repo owner/name]`
- `node scripts/workflow-user-actions.mjs [--json]`
- `node scripts/workflow-preflight.mjs --task WR-###`
- `node scripts/workflow-finish-check.mjs --task WR-###`
- `node scripts/workflow-audit-readiness.mjs [--auto] [--json]`

Manager-only state-preparation helper:
- `node scripts/workflow-manager-transition.mjs <plan> [--write]`

`workflow-state-check` validates active registry schema/version, task/spec lifecycle consistency, blocker/dependency metadata, task/role files, SHA formats, uniqueness/collision safety, dependency cycles, Auditor target metadata, and active-only discipline. Static state-check failure is a Governance CI failure.

`workflow-audit-readiness` is mechanical evidence only. It validates authorized scope and task-specific readiness contracts, can emit deterministic readiness JSON, and must not issue or imply an Auditor verdict. On pull-request CI, active-lane attribution requires canonical repository identity and recorded PR identity where applicable; exact PR-head readiness checkout is restored to GitHub's synthetic merge checkout before remaining integration/custody checks.

`workflow-manager-transition` is dry-run by default. `--write` may update only planned registry/task-spec machine state, runs the canonical static checker, rolls back touched files on failure, and has no commit/push/merge/Auditor-verdict authority. Manager still reviews the complete diff, performs live verification, updates narrative state, and creates the atomic Git transaction.

## Path-aware CI
Every push/PR runs Governance CI: checkout, Node setup, syntax checks for workflow helpers, workflow regression tests where applicable, and the static state checker. Active audit-required lanes may also receive the mechanical audit-readiness preflight.

The expensive Full War Room CI runs when any changed path is outside `.ai/**`, including production, datasets, extensions, `scripts/**`, `.github/workflows/**`, package files, or test harnesses. A `force-full-ci` PR label also forces the full matrix. Classifier uncertainty/missing base/diff failure fails upward to Full CI.

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

When using repository APIs, do not implement one logical Manager transition as sequential per-file commits if an atomic Git tree/commit path is available. Prepare all coordinated file contents against one verified canonical parent, create one tree and one commit, then move the Manager branch once. This prevents CI from evaluating transient half-applied registry/task-spec states.

## Canonical-document scope
- `ACTIVE_TASKS.json`: active machine control-plane index.
- `PROJECT_STATE.md`: current baseline/blockers/next gates.
- `ROADMAP.md`: milestones/material dispositions.
- `DECISIONS.md`: durable product/architecture decisions only; workflow mechanics belong here in `WORKFLOW.md`.
- specialist task/research/strategy/audit/work-helper reports: detailed evidence.
- handoffs: concise pointers and next action.

Do not duplicate full evidence tables across canonical files.

## Manager activation output and worker bootstrap
When next work is determined, end with `ACTIVATE NOW` covering Manager, Builder, Draft Strategy, R&D, Auditor, and Work Helper. Multiple entries for one durable role are allowed when concurrency rules pass. Include CHAT, TASK, EXECUTION MODE, REFRESH MODE, REFRESH REASON when FULL_REFRESH, activation message, and fallback where relevant.

Worker bootstrap/continuation should use repository pointers rather than copied transcript history: read this workflow, active registry, role charter, assigned task spec, relevant handoff, and execute only the assigned task. Reuse a safe same-role chat when V3.4 permits; independent audits remain fresh.

## Workflow principle
Use the smallest permanent team that preserves meaningful separation. Scale throughput with task-scoped concurrency plus machine collision checks, not extra permanent roles. Preserve independent audit and Manager integration authority. Spend expensive validation where changed surfaces justify it while keeping governance checks always on.
