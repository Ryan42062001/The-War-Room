# Independent Auditor / QA Handoff

HANDOFF

Task ID: WR-003
Role: Independent Auditor / QA
Status: ACTIVE ASSIGNMENT

OBJECTIVE:
Independently audit PR #108 — ESPN Completion-State Consistency — against `.ai/manager/WR-003.md` and return PASS / PASS WITH NON-BLOCKING FINDINGS / FAIL.

VERIFIED MANAGER STATE:
- canonical production behavior checkpoint before WR-001 docs: `a6506d5815e6ec9027f71da759fbe607a40b5020`
- WR-001 merged as documentation-only PR #109; no production files changed
- PR #108 remains open and unmerged
- PR #108 head: `d9b537ddac665207ab61aed7527d7da986cc4815`
- PR #108 changed files are limited to:
  - `extensions/espn-companion/background-entry.js`
  - `extensions/espn-companion/manifest.json`
  - `extensions/espn-companion/test/completion-state.test.cjs`
  - `extensions/espn-companion/test/manifest.test.cjs`
- there is no direct file overlap with WR-001 `.ai/` documentation changes

AUDIT REQUIREMENTS:
1. Read `.ai/shared/PROJECT_STATE.md`, `.ai/shared/ROADMAP.md`, `.ai/shared/DECISIONS.md`, `.ai/shared/WORKFLOW.md`.
2. Read `.ai/manager/WR-003.md`.
3. Verify current main and PR #108 head/base relationship.
4. Review the actual PR diff, not just its description.
5. Verify the claimed deterministic RED-before-fix regression is real and targeted.
6. Verify complete numbered ledger is terminal completion authority without breaking incomplete/UI-only behavior or explicit reset/session semantics.
7. Verify service-worker entry / manifest loading is required and safe.
8. Verify no new permissions, no click-provenance changes, no ranking/scoring/recommendation/UI scope creep.
9. Independently verify the relevant automated tests and determine achieved validation levels.
10. Decide whether Level 4 is materially required for WR-003 after Levels 1–3.

STALE-BRANCH RULE:
Current main advanced after PR #108 through WR-001 Manager-owned `.ai/` documentation only. Do not require a mechanical rebase solely for non-overlapping docs; do require rebase/update if your comparison reveals any meaningful integration conflict or if main advances again in overlapping production code.

VERDICT AUTHORITY:
The Auditor owns PASS/FAIL. CRITICAL/HIGH blocking findings must be resolved before Manager merge.

EXPECTED HANDOFF:
- Task ID: WR-003
- audited current main SHA
- PR head SHA
- actual files/diff reviewed
- tests independently verified
- validation levels achieved
- findings with severity
- stale-branch/integration assessment
- PASS / PASS WITH NON-BLOCKING FINDINGS / FAIL
- explicit merge recommendation

Separate pending task:
WR-002 is the Level-4 live synthetic-navigation attribution task. Do not combine WR-002 evidence or verdict with WR-003.
