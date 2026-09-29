# Current Phase

State: BUILDING

## Identity

- Phase: WR-P01 — ESPN Board-Fallback Reliability Gate
- Product owner: Ryan
- Phase branch: `phase/wr-p01-board-fallback-reliability`
- Activation baseline: `3a98e3109074c2296143d533e7407bde5f275de3`
- Historical source context: WR-153/WR-154 planning and accepted exact-current fallback-readiness evidence preserved under `.history/workflow-v3-5/`
- Risk: HIGH
- Production deployment: NOT AUTHORIZED
- ESPN write access: NOT AUTHORIZED
- Private ESPN account/session data: PROHIBITED from repository, CI, and shared evidence

## Objective

Establish exact-current, privacy-safe evidence that the read-only ESPN Board/Pick History fallback and War Room synchronization remain reliable in one owner-operated disposable 10-team × 16-round Full-PPR snake mock at slot 5, repairing only bounded product defects if the field check exposes them.

## Scope

- Verify current War Room runtime identity, service-worker/cache state, and installed companion version before the field check.
- Use one new disposable ESPN mock only; Ryan operates ESPN manually and may stop at any time.
- Require visible Board/Pick History fallback to be observed as the authoritative live source for this proof.
- Verify monotonic numbered pick synchronization, ownership, final completion truth, and saved-reload persistence.
- Permit bounded War Room/Companion repairs if the exact-current field check reveals a reproducible defect.
- Preserve sanitized numerical/digest evidence sufficient for a fresh independent phase audit.

## Non-goals

- Structured ESPN Direct-mode validation.
- Any ESPN write action, automated drafting, lineup mutation, waiver/trade submission, or account operation by ChatGPT/Builder.
- Real/private league testing.
- Recovery/rollback experiments unrelated to a defect actually exposed by this phase.
- New ranking providers, scoring models, or recommendation retuning.
- Production deployment.
- Reinstating historical V3/V3.5 task/control-plane machinery.

## Ordered implementation objectives

1. Verify the activated branch remains based on exact canonical baseline `3a98e3109074c2296143d533e7407bde5f275de3` and establish exact-current repository/runtime/companion identity.
2. Prepare privacy-safe owner-only preflight for one disposable 10×16 Full-PPR snake mock at slot 5 without entering or operating ESPN on Ryan's behalf.
3. Stop for explicit Manager GO after preflight before Ryan starts the single authorized mock.
4. Run the one owner-operated field check with visible Board/Pick History fallback and sanitized numbered milestone receipts.
5. If a bounded product defect appears, reproduce it synthetically, repair it on this same phase branch, and repeat only the affected verification.
6. Reach PREVIEW_READY and complete Ryan's whole-phase review.
7. Phase Sync, exact-head FULL PHASE CI, immutable freeze, and one fresh HIGH-risk independent phase audit.
8. Remediate and obtain targeted re-audit if required.
9. Merge only after Ryan explicitly authorizes the exact approved target; production publication remains separate.

## Acceptance criteria

- Exact-current War Room and companion runtime identities are known before the live check; stale, mixed, or ambiguous browser/cache state does not count as evidence.
- Ryan uses one disposable 10-team, 16-round, Full-PPR snake mock at slot 5; no real/private league is involved.
- Visible ESPN Board/Pick History fallback is actually observed; Direct telemetry, if present, is supporting only and is not claimed as validated.
- Terminal ESPN history contains contiguous numbered picks 1..160 with no unexplained missing or duplicate numbers.
- Companion terminal state is Captured = Applied = Acknowledged = 160, Unmatched = 0, with no unexplained unresolved identity/conflict state.
- War Room terminal state contains 160 numbered applied picks and exactly 16 Mine picks at slot-5 snake positions: 5, 16, 25, 36, 45, 56, 65, 76, 85, 96, 105, 116, 125, 136, 145, 156.
- Final completion/report state is truthful and survives same-session reload with unchanged numbered ledger/digest.
- Any naturally occurring reconnect, rescan, correction, reorder, partial state, or duplicate remains monotonic and evidence-backed; do not manufacture these conditions solely for evidence.
- Shared evidence contains no credentials, cookies, tokens, league/draft IDs, account/team names, private screenshots, raw network traces, local profile paths, or unredacted diagnostics.
- Existing board, recommendation, persistence, companion, and responsive regression suites remain green.
- Ryan approves the complete phase preview/owner check before freeze.
- Exact-head FULL PHASE CI passes.
- Fresh independent HIGH-risk phase audit passes.

## Required automated validation

- FAST CI: V2.1 contract validation plus release/module/syntax/dataset/extension checks that do not require the FULL browser suite.
- FULL PHASE CI: exact-head validation, complete application test suite with Chromium, bounded determinism repeats for critical browser/persistence paths, and dependency audit.
- Any field-discovered product defect requires a synthetic regression before remediation is accepted.

## Human preview requirements

- War Room/Companion connection status and source mode remain understandable on laptop and phone.
- Live pick progress, Mine ownership, completion state, and mismatch/conflict state are truthful and legible.
- No UI or evidence claims Direct mode was validated when the accepted proof is Board fallback.
- Existing draft-day board/recommendation flow remains usable after any remediation.

## Owner-only verification

Ryan alone operates ESPN in one new disposable 10×16 Full-PPR snake mock at slot 5. Before that mock begins, the Manager must accept the exact-current privacy-safe preflight and issue a one-time GO. Ryan may stop at any time. Do not share account/session identifiers or raw private diagnostics. The Manager consumes only sanitized counts, digests, state summaries, and results.

## Exit criteria

- Owner-only field verification and any affected repeat verification pass.
- Preview approved.
- Phase Sync complete.
- Exact candidate FULL PHASE CI passes.
- Fresh independent HIGH-risk phase audit/re-audit passes.
- Ryan separately authorizes merge.
- Post-merge FAST, Closure Sync, and closure FAST pass.
- Production remains undeployed unless Ryan separately authorizes manual Pages deployment.

## Stop conditions

Stop for wrong mock settings/slot, real/private league interaction, missing Manager GO, stale/mixed runtime identity, privacy/account-data risk, non-monotonic unexplained pick state, wrong ownership, unresolved duplicate/conflict, source-mode ambiguity, Ryan stop, ESPN write-path implication, production implications without authorization, or the same material implementation/security/data blocker after three total attempts.
