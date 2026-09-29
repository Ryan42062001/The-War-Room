# Current Phase

State: PLANNED

## Identity

- Phase: WR-P01 — ESPN Board-Fallback Reliability Gate
- Product owner: Ryan
- Phase branch: `phase/wr-p01-board-fallback-reliability` (create after workflow migration closes)
- Activation baseline: canonical `main` after Speed Workflow V2.1 migration
- Historical source context: WR-153/WR-154 planning and accepted WR-143/WR-146 runtime evidence
- Risk: HIGH
- Production deployment: NOT AUTHORIZED by phase merge
- ESPN write access: NOT AUTHORIZED
- Private ESPN account/session data: PROHIBITED from repository/shared evidence

## Objective

Establish exact-current, privacy-safe evidence that the read-only ESPN Board/Pick History fallback and War Room synchronization remain reliable in one owner-operated disposable 10-team × 16-round Full-PPR snake mock at slot 5, repairing only bounded product defects if the field check exposes them.

## Scope

- Verify current War Room runtime identity, service-worker/cache state, and installed companion version before the field check.
- Use one new disposable ESPN mock only; owner operates ESPN manually.
- Require visible Board/Pick History fallback to be observed as the authoritative live source for this proof.
- Verify monotonic numbered pick synchronization, ownership, final completion truth, and saved-reload persistence.
- Permit bounded War Room/Companion repairs if the exact-current field check reveals a reproducible defect.
- Preserve sanitized numerical/digest evidence sufficient for a fresh independent phase audit.

## Non-goals

- Structured ESPN Direct-mode validation.
- Any ESPN write action, automated drafting, lineup mutation, waiver/trade submission, or account operation by Codex/ChatGPT.
- Real/private league testing.
- Recovery/rollback experiments unrelated to a defect actually exposed by this phase.
- New ranking providers, scoring models, or recommendation retuning.
- Production deployment.
- Reinstating historical V3/V3.5 task/control-plane machinery.

## Ordered implementation objectives

1. Activate a fresh V2.1 phase branch from exact canonical main.
2. Verify repository/runtime/companion version identity and privacy-safe owner receipts.
3. Complete owner-only preflight for a disposable 10×16 Full-PPR snake mock at slot 5.
4. Obtain explicit Manager GO for the one owner-operated mock.
5. Run the single field check with numbered milestone receipts and visible Board/Pick History fallback.
6. If a bounded product defect appears, reproduce it synthetically, repair it on the same phase branch, and repeat only affected owner verification.
7. Reach PREVIEW_READY and complete Ryan's whole-phase review.
8. Phase Sync, exact-head FULL CI, immutable freeze, and one fresh HIGH-risk independent audit.
9. Remediate/re-audit findings if required.
10. Merge only after Ryan explicitly authorizes the exact approved target; production publication remains separate.

## Acceptance criteria

- Exact-current War Room and companion runtime identities are known before the live check; stale/mixed cache state does not count as evidence.
- The owner uses one disposable 10-team, 16-round, Full-PPR snake mock at slot 5; no real league is involved.
- Visible ESPN Board/Pick History fallback is actually observed; Direct telemetry, if present, is supporting only.
- Terminal ESPN history contains contiguous numbered picks 1..160 with no unexplained missing/duplicate numbers.
- Companion terminal state is Captured = Applied = Acknowledged = 160, Unmatched = 0, with no unresolved identity/conflict state.
- War Room terminal state contains 160 numbered applied picks and exactly 16 Mine picks at slot-5 snake positions: 5, 16, 25, 36, 45, 56, 65, 76, 85, 96, 105, 116, 125, 136, 145, 156.
- Final completion/report state is truthful and survives same-session reload with unchanged numbered ledger/digest.
- Any reconnect/rescan/correction remains monotonic and evidence-backed.
- Shared evidence contains no private ESPN account/session information.
- Existing board, recommendation, persistence, companion, and responsive regression suites remain green.
- Ryan approves the complete phase preview/owner check before freeze.
- Exact-head FULL PHASE CI passes.
- Fresh independent HIGH-risk audit passes.

## Required automated validation

- FAST CI: V2.1 contract validation, dependency install, and release/module/syntax/dataset/extension checks that do not require a browser install.
- FULL PHASE CI: exact-head validation, full npm test suite with Chromium installed, bounded determinism repeats for critical browser/persistence paths, and dependency audit.
- Any field-discovered bug requires a synthetic regression before remediation is accepted.

## Human preview requirements

- War Room/Companion connection status and source mode remain understandable on laptop and phone.
- Live pick progress, Mine ownership, completion state, and mismatch/conflict state are truthful and legible.
- No UI claims Direct mode was validated when accepted proof is Board fallback.
- Existing draft-day board/recommendation flow remains usable after any remediation.

## Owner-only verification

Ryan alone operates ESPN in one new disposable 10×16 Full-PPR snake mock at slot 5. He may stop at any time. Do not share account/session identifiers or raw private diagnostics. The Manager supplies milestone/abort instructions and consumes only sanitized counts/digests/results.

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

Stop for wrong mock settings/slot, real-league interaction, stale/mixed runtime identity, privacy/account-data risk, non-monotonic unexplained pick state, wrong ownership, unresolved duplicate/conflict, source-mode ambiguity, owner stop, ESPN write-path implication, production implications without authorization, or the same material implementation blocker after three total attempts.
