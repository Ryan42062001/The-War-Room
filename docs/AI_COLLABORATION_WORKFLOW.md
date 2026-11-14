# The War Room — Claude Code / ChatGPT Work collaboration

**Proposed Owner role update, 2026-11-13.** This is not active until Ryan reviews and merges this governance change. First read `AGENTS.md`, `docs/WORKFLOW.md`, `docs/PROGRESS_FIRST_POLICY.md`, `.ai/CURRENT_PHASE.md` and project-specific workflow decisions. Existing safety, CI, provider evidence, freeze and release conditions remain binding. This changes **roles**, not the approval gates.

## Assignments

| Role | Tool | Responsibility |
| --- | --- | --- |
| Product Owner | Ryan | Scope, approved FantasyPros/ESPN evidence and provider access, exact-SHA merge and deployment permission |
| Primary Builder | **Claude Code** | Sole source owner of one active phase branch; implement, test, run CI, create/update phase PR; no unapproved ESPN interaction |
| Fallback Builder | **ChatGPT Codex**, separate coding session | Only if Claude credits unavailable and branch/task ownership is explicitly transferred; verify Git head, do not work concurrently on the same branch |
| Browser QA | **ChatGPT Work with Cloud Browser** | Run authorized mocked/synthetic War Room UI and draft-state replay in a reachable, approved Preview; file `qa-finding` issues; no code or provider access |
| Independent Reviewer | **Fresh non-builder session**, ChatGPT especially for HIGH-risk provider/privacy/recommendation changes | Exact-SHA changed-scope review with real test evidence; must never self-review Builder implementation |
| Project Manager | ChatGPT regular Chat | PR/CI dashboard, issue triage, audit findings, release readiness; Ryan authorizes all protected merges/releases |

Prior "regular Chat is Primary Builder" and "Work only as Super Builder" policy is superseded **only as a role default after approved merge**. A coding/computer-use Work escalation still requires separate Ryan authorization. The Builder remains sole branch writer.

## Delivery handoff

1. Claude reads active phase and owner instructions; builds on its phase branch; runs required FAST and deliberate FULL/exact-head checks.
2. If an authorized **synthetic/mock browser Preview** with a verified target commit exists, Work independently tests the relevant `docs/workflow/QA_CHECKLIST.md` cases. Cloud Browser does not automatically access private localhost or logged-in ESPN tabs.
3. Work records each case PASS / FAIL / NOT RUN, with target SHA and safe evidence. File each reproducible failure as a `qa-finding` issue (or supply a complete report if GitHub posting unavailable). Claude repairs and Work retests changed behavior at its new SHA.
4. A fresh independent reviewer audits the exact frozen phase head; BLOCKER/CRITICAL/HIGH holds affected merge, requires tests and targeted re-review; track MEDIUM/LOW/NIT per progress-first.
5. Owner reviews usability; Ryan explicitly authorizes merge, ESPN provider actions, private session use and any deployment. Whole-product frozen audit remains for final release per existing workflow.

## War Room safety

- **ESPN access is read-only and NOT authorized for Work by this policy.** Never connect Work's Cloud Browser to Ryan's private ESPN account, browser session, cookies, league data or extension credentials. Use **only synthetic/replay fixtures** and sanctioned non-production preview; do not use `@Chrome` or `@Computer` in routine QA.
- No mock picks or projections may be reported as live ESPN observations. Preserve evidence distinctions: accepted board/pick-history, structured/API observations, draft ownership, next-pick survival and provenance.
- Never click live ESPN draft controls, submit picks, write provider state or automate ESPN against user accounts. Owner-operated live ESPN field tests stay owner-operated unless explicitly, separately approved.
- Respect source priority for FantasyPros ECR and ESPN draft-room data. Do not manufacture ADP, picks, tiers, players or experimental result counts.
- No authorized reachable Preview => **NOT RUN**, not assumed PASS. Protect provider credentials and private league info in GitHub artifacts.

**Work activation:** `docs/workflow/WORK_MODE_PROMPT.md`; **QA cases:** `docs/workflow/QA_CHECKLIST.md`.
