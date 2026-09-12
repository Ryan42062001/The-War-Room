# Manager / Architect Handoff

HANDOFF

Current workflow task: WR-051 — Workflow V3.1 Efficiency & State-Integrity Upgrade
Current audit task: WR-052 — Independent Audit of Workflow V3.1 Upgrade
Canonical starting main for WR-051: `41358f892a1abac76cd81561f8d88dbaf6305920`

## WR-051 candidate
Manager implemented V3.1 as one atomic workflow/control-plane candidate. Scope is limited to `.ai/**`, `.github/workflows/ci.yml`, and `scripts/workflow-*.mjs`.

V3.1 changes:
- same-role concurrent task chats allowed when independent/safely integrated;
- blocker type + `user_action_required` + machine dependency fields;
- Auditor must self-publish audit PR before COMPLETE;
- active-only `ACTIVE_TASKS.json`;
- `workflow-state-check.mjs` governance integrity gate;
- path-aware CI: governance always, full matrix for any non-`.ai/**` change or `force-full-ci`;
- provider/external authority evidence contract;
- canonical-main post-merge canary for audited cross-cutting infrastructure/test changes;
- stronger atomic Manager reconciliation rule.

WR-051 changes workflow mechanics only. Production ranking authority, WR-D008/WR-039 evidence semantics, custody data/secrets, model scoring prohibition, and 2026 outcome restrictions are unchanged.

## WR-052
Independent Auditor must audit exact immutable WR-051 PR/head after CI. Under the new rule the audit is not COMPLETE until Auditor publishes its own audit PR.

PASS-family permits Manager merge of the exact WR-051 head. WR-051 then remains MERGED until the canonical-main push/full-CI canary passes; only then reconcile CLOSED.

## Custody lane remains independent
WR-046 remains REWORK_REQUIRED for provider-issued credential-scope attestation. It can proceed in a separate Work Helper chat while WR-052 audits V3.1; role concurrency no longer forces serialization. WR-050 remains blocked on WR-046. WR-042/043 remain blocked behind custody gates. No model scoring is authorized.

## Accidental direct-write incident
Before the WR-051 branch was created, one Manager task-file creation call accidentally defaulted to `main`. It was immediately deleted in the next commit. Main tree returned to the exact pre-incident tree before any V3.1 branch work; no production, research, custody, model, or user-facing file was touched. Preserve this disclosure as workflow evidence.

## Next action
1. Open WR-051 PR on exact atomic implementation head.
2. Require exact-head full CI because WR-051 changes workflow/scripts.
3. Activate WR-052 against that exact PR/head.
4. Do not merge WR-051 without PASS-family.
5. After merge, require canonical-main full canary before CLOSED.
