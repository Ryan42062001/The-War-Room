# Manager / Architect Handoff

HANDOFF

Workflow: V3.2 CANONICAL

## Accepted audit result

WR-043 is CLOSED with final verdict `FAIL — REMEDIATION REQUIRED`. Audit PR #172 exact head `d3f1c5fba872528e06f49d0a7f92b6a3a9e3f1a2` was merged as canonical evidence at `60628ac9ea671ad1ecdb0c26f8ad200e8afed19c`; canonical-main CI `34876585824` is `SUCCESS`.

Historical audited WR-042 target:

- PR #168 — CLOSED UNMERGED;
- exact head `614445a20c2c15fbc3d8c107644a5244ddb52076`;
- executed manifest commit `cc9005ae4bd9065cf80f1c184f31974904165c54`;
- manifest SHA-256 `d2196293ff34543b063e737efb175f579967bf37f5dc91b41c08dd45dfe44d26`;
- custody run/job `34871882486` / `104069521779`.

Positive custody evidence for the 15 exact byte identities remains valid and should be reused where possible. The failure is limited to missing WR-039 source-snapshot and cohort/source-eligibility evidence.

## Active lanes

- WR-042 — BLOCKED on WR-059 remediation. Do not advance historical PR #168.
- WR-059 — ASSIGNED to R&D on `wr-059-v2-source-snapshot-cohort-remediation`.
- WR-060 — BLOCKED on WR-059; future independent re-audit branch `wr-060-v2-source-snapshot-cohort-reaudit`.

## WR-059 required outcome

Preserve the exact 15 retained/reference identities and produce:

1. one complete WR-039-compliant source-snapshot artifact with versioned `source_snapshot_id`, canonical hash, exact per-source schema/row/approved-column/cutoff/lineage/rights/retained-object/acquisition-code evidence; and
2. one deterministic no-scoring cohort/source-eligibility artifact under a versioned `cohort_version`, canonical ordered stable keys, explicit eligibility/availability reasons, duplicate-key rejection, and canonical digest bound to the source snapshot.

Do not silently reacquire or substitute a mutable upstream object. If exact retained/reference bytes cannot support the required evidence, fail closed for that source and return control to Manager.

## WR-059 retained-object read authorization

Manager explicitly authorizes WR-059 to use the existing protected custody environment for **read-only evidence reconstruction** from exactly four already-custodied player-summary identities: seasons 2013, 2014, 2015, and 2016, pinned in `.ai/manager/WR-059.md` by asset ID, SHA-256, byte size, and content-addressed custody key.

This authorization permits read-only B2/R2 retrieval and ephemeral parsing only after exact digest/size verification. It does not permit upstream source-byte refresh, asset substitution, recustody, provider-object mutation, custody-policy/retention/lock changes, raw-byte commits, or Actions artifacts. Provider metadata lookup is lineage-only. If existing protected tooling cannot perform the retrieval without workflow/runtime or credential-policy changes, R&D must fail closed and return that execution-path blocker to Manager rather than expanding scope.

## Boundaries

`draft_picks.csv` remains excluded under WR-057. No 2026 regular-season outcome inspection, targets, model fitting/scoring/tuning/comparison/evaluation, rankings, production changes, or Phase-6 work.

## Manager transaction rule

Coordinated control-plane transitions must use one atomic Git tree/commit whenever supported.
