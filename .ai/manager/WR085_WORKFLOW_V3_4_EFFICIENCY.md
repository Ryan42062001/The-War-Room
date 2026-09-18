# Workflow V3.4 — ChatGPT Usage + Work-Mode Efficiency Candidate

Status: CANDIDATE — NOT CANONICAL
Task: WR-085
Baseline: `47aee3da73ad05fb6c021a7b13a01e494dd30c31`

## Current efficiency weaknesses

V3.3 already provides Fast Refresh and audit-readiness machinery, but its operating text still triggers broad Full Refreshes for new tasks/important merges, uses three execution labels that can encourage importance-based Work escalation, prefers fresh worker chats per meaningful task, lacks a machine-bound refresh mode, and does not consolidate the worker-spawn cost check, decision-consumption rule, execution packet, compact handoff standard, or Work escalation/de-escalation contract in one canonical policy.

## Exact candidate changes

- exact execution modes become `STANDARD_CHAT_HIGH` and `WORK_MODE`;
- Standard Chat High is the default;
- Work requires a substantial autonomous-execution benefit under the explicit routing test;
- exact refresh modes become `FAST_REFRESH` and `FULL_REFRESH`;
- Fast Refresh is default; Full Refresh requires non-empty `refresh_reason`;
- task-contract/state/Manager-transition helpers machine-check execution + refresh mode drift;
- Manager execution packets reduce rediscovery;
- accepted upstream decisions are consumed rather than re-solved;
- implementers self-validate before formal audit freeze;
- related same-role chats may continue when independence is not required;
- independent Auditor chats remain fresh;
- handoffs use compact continuation fields;
- tightly related low-risk remediation may be batched where separation permits;
- Standard->Work escalation and Work->Standard de-escalation continue exact branch/SHA/PR state instead of restarting.

## Active task classification

| Task | Execution | Refresh | Decision |
|---|---|---|---|
| WR-074 | STANDARD_CHAT_HIGH | FAST_REFRESH | Keep Standard; escalate only if future runner execution becomes substantial. |
| WR-075 | STANDARD_CHAT_HIGH | FAST_REFRESH | Independent audit; no Work by default. |
| WR-081 | STANDARD_CHAT_HIGH | FAST_REFRESH | Reclassified from Work-preferred; consume accepted source/cohort/protocol/bridge authority. |
| WR-082 | STANDARD_CHAT_HIGH | FAST_REFRESH | Independent result audit. |
| WR-083 | WORK_MODE | FAST_REFRESH | Keep Work-routed: custody/workflow/provider proof is execution-heavy and iterative. Standard fallback remains valid while credits are unavailable. |
| WR-084 | STANDARD_CHAT_HIGH | FAST_REFRESH | Fresh independent bridge audit. |
| WR-085 | STANDARD_CHAT_HIGH | FULL_REFRESH | Explicit exception because canonical workflow/control-plane architecture is changing. |
| WR-086 | STANDARD_CHAT_HIGH | FAST_REFRESH | Fresh independent workflow audit. |

No active tasks are consolidated. The implementation/audit pairs require distinct ownership, and WR-081/082 remain distinct scoring/result-audit gates.

## Expected usage reduction

Directional targets only; no token/credit telemetry exists:
- routine startup context should materially shrink because Fast Refresh becomes the default;
- among the two active model lanes previously Work-preferred, Work routing falls from two to one, a 50% reduction in that currently relevant subset;
- fresh-chat orientation should decrease for related same-role sequential work;
- audit churn should decrease because implementer self-validation is required before freeze;
- handoff volume should decrease because narrative history is referenced instead of copied;
- immediate Work consumption can be zero while credits are unavailable because Work remains an accelerator, not a dependency.

## Risks

- Too-narrow Fast Refresh could omit authority: escalate to Full Refresh when Fast cannot establish state and record why.
- Chat reuse may preserve stale assumptions: refresh live canonical state on continuation; independent audit remains fresh.
- Standard-first routing may delay heavy execution: escalation packet moves exact branch/SHA/PR into Work without restart.
- Enum migration can create drift: registry/specs/helpers/tests migrate together and fail closed.
- Efficiency pressure could tempt skipped audit: audit, exact freeze, CI, custody and merge controls are explicitly unchanged.
