# Progress-First Feature Delivery and Final Audit Policy

## Owner directive — 2026-11-07

**PROGRESS FIRST; AUDIT BEFORE RELEASE.** Complete as much of the planned *working functionality* as possible before one comprehensive, genuinely independent, system-wide audit, consolidated remediation, and a targeted independent re-audit ahead of the final release. Minimize repetitive phase-by-phase audit campaigns. This is a sequencing policy, NOT a security PASS or authority to bypass controls.

### Two independent status ledgers

1. **Feature delivery**: NOT_STARTED → BUILDING → FUNCTIONALLY_VALIDATED → OWNER_PREVIEW_ACCEPTED → FEATURE_ACCEPTED_PENDING_FINAL_AUDIT. Count progress from demonstrated user-visible behavior and functioning backend, not commit count, cosmetic UI, stalled audit threads, or a claimed percentage. Show real per-feature status and honest blockers.
2. **Security/release**: NOT_AUDITED / FINDINGS_OPEN / REMEDIATING / RE_AUDITED_PASS / RELEASE_AUTHORIZED. Carry every known finding with severity, impacted path, link/SHA, owner and final-release disposition. A deferred defect is still OPEN. Never mark an unmerged PR or a phase CLOSED/PASS without satisfying its actual closure/governance contract.

### Standard execution

- One Primary Builder per coherent feature/phase, one working branch and draft PR; default to regular Chat. Delegate to Work only with explicit Owner permission when the task needs its environment.
- Continue independent feature development even while an unrelated audit/architecture question is parked. Prefer real code, focused unit/integration regression tests, lint, typecheck, SAFE CI, synthetic previews and one consolidated Owner punch list. Never substitute simulated UI for verified persistence.
- Freeze and full independent audit occur once at the **final release candidate**, after the planned functionality is integrated. Run comprehensive product/security/privacy/authorization/data-integrity/reliability/dependency/UX audit, consolidate fixes by severity, then freeze and re-audit all changed high-risk paths. Additional independent audit only when a new distinct critical boundary or law/operational constraint *actually* requires an earlier gate.
- Critical known exploitable security, cross-owner access, unsafe financial/health data handling, irreversible destructive effects, exposed secrets, and live-production incidents may not be deferred to raise the completion percentage. Stop or isolate the impacted operation and fix before use. Unrelated safe features may continue.
- Existing automated branch protection, test/CI checks, explicit Owner PR merge permissions, exact-SHA custody, secrets bans, paid-cost permissions and production deployment decisions stay binding. No force merge, stale-proof PASS, hidden waiver, undocumented grant, direct production writes or unattended deployment.
- An audit-deferred feature can be labeled **FEATURE_ACCEPTED_PENDING_FINAL_AUDIT** after real tests and user preview; it is never automatically security-cleared or authorized to serve private production data.
- Before changing old CI/workflow validators that insist on independent audits per phase, update those contracts honestly in a separate reviewed governance change. This draft policy does NOT grant permission to disable validators or lie to them.

### Final independent audit and release

1. Freeze a complete integration candidate with exact SHA/manifest and working end-to-end feature tests.
2. Independent auditor reviews all planned capabilities and known audit debt, including authorization/RLS, cross-account isolation, secrets, dependencies, input validation, storage/backup, destructive operations, versioned data migration, correct calculations, and production configuration.
3. Batch remediation; re-run CI/owner checks; fresh independent **targeted re-audit** on the final fixed SHA.
4. Manager records evidence and residual risk; BLOCKER/HIGH findings must be fixed, not waived by a vague family/personal-site rationale. Explicit separate Product Owner approval remains required to merge/deploy/release under existing project policies.

### Project-specific application

**Product:** Fantasy football draft companion; ESPN draft-board acquisition and recommendations.

**Retained non-negotiable boundary:** Keep ESPN ownership/identity, source rankings, exact pick ledger, read-only/no-ESPN-write constraints, frozen exact-SHA evidence and no unauthorized production deployment. A draft-day correctness defect that could silently corrupt picks or ownership must stop the affected live path immediately.

**Practical next feature sequence:** WR-P02 Draft-Day UX & Command Center, followed by the remaining WR roadmap through release; do not revive archived WR task lanes or silently retarget immutable audit checkpoints.

**Final-release gate:** The next owner-authorized season/production launch; already-deployed functionality is subject to incident fixes now, not deferred to a future audit.

**Authority precedence:** This is the Owner's new sequencing choice. Once merged, it supersedes only conflicting *timing* language in the existing per-phase audit flow; all unrelated security, exact-SHA, release, provider and payment constraints remain effective. Earlier failed audit records remain immutable evidence. A draft PR alone does not change the protected default branch.
