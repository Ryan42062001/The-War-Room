# War Room Decisions

Owner: Manager / Architect

Only durable architectural/product decisions belong here. Workflow mechanics belong in `.ai/shared/WORKFLOW.md`.

---

## DECISION WR-D001

DATE: 2026-09-07
TASK: Historical / ranking-system foundation
STATUS: ACTIVE
DECISION: FantasyPros 2026 PPR ECR is the player-value and ranking authority. ESPN rank/ADP is a timing/market signal, not the value authority.
RATIONALE: Separating consensus player value from ESPN room timing avoids letting platform market order override ranking quality while still preserving next-pick survival information.
EVIDENCE: Current repository ranking policy in `AGENTS.md`, current generated FantasyPros dataset, and established regression baseline.
ALTERNATIVES REJECTED: ESPN board rank as primary player-value authority; legacy custom expert dataset.
REVISIT CONDITION: New authoritative source data or a formally approved ranking-policy change materially changes the required value/timing split.

---

## DECISION WR-D002

DATE: 2026-09-07
TASK: Historical / ESPN off-board pick correctness
STATUS: ACTIVE
DECISION: A numbered pick from an authoritative Companion snapshot may be accepted as an external/off-board pick when the player is absent from the canonical 717-player universe. The pick counts toward draft progress and roster truth when applicable, but the player is not fabricated as a canonical board row and is never inserted into recommendations.
RATIONALE: ESPN draft completion must remain truthful even when ESPN drafts a player outside the local ranking universe. Manual addition would corrupt ranking authority; rejecting the pick would corrupt draft progress.
EVIDENCE: Merged off-board pick handling and deterministic Kene Nwangwu #280 regression established before this operating-contract bootstrap.
ALTERNATIVES REJECTED: Manually add unknown ESPN players to the canonical dataset; leave accepted ESPN picks as generic unresolved/unmatched errors; ignore the numbered pick.
REVISIT CONDITION: Canonical dataset ingestion becomes dynamic and can preserve source authority without fabricating ranking metadata, or ESPN snapshot authority changes materially.

---

## DECISION WR-D003

DATE: 2026-09-07
TASK: Historical / ESPN Live Sync architecture
STATUS: ACTIVE
DECISION: Use a layered live-sync source strategy: prefer passive structured observations when they yield ledger-eligible numbered picks; use authenticated REST conditionally for recovery; use live-proven Pick History / Draft Board DOM fallback when structured sources are behind or empty; reconcile all accepted observations into a monotonic numbered-pick ledger.
RATIONALE: Live disposable ESPN mocks repeatedly showed Pick History DOM producing complete numbered-pick coverage while WebSocket/React/Worker/REST did not provide usable numbered picks in those formats. Structured sources remain valuable when actually usable, but must not be assumed authoritative solely because they are machine-readable.
EVIDENCE: Existing Companion architecture, live validation documentation, merged observability/provenance work, and repeated disposable mock results.
ALTERNATIVES REJECTED: Structured-source-only sync; DOM-only architecture that discards safer passive sources; allowing stale smaller snapshots to regress the ledger.
REVISIT CONDITION: A stable structured ESPN draft feed is live-proven across target draft formats with equal or better completeness/recovery behavior than the current layered strategy.

---

## DECISION WR-D004

DATE: 2026-09-07
TASK: WR-003 — ESPN Completion-State Consistency
STATUS: ACTIVE
DECISION: A complete unique configured numbered-pick ledger is terminal draft-completion authority. Once all configured numbered slots are present, later false UI-derived completion heartbeats may not demote `draftComplete` or regress completion counters below the configured total. Explicit reset/session changes remain authoritative for clearing terminal state.
RATIONALE: The numbered ledger is the reconciled source of draft progress. A transient or missing ESPN terminal UI marker after Rescan is weaker evidence than a complete 1..N ledger and must not create contradictory completion state.
EVIDENCE: PR #108 audited head `d9b537ddac665207ab61aed7527d7da986cc4815`; Independent Auditor PASS in `.ai/auditor/AUDIT.md`; deterministic RED-before-fix CI #624 and GREEN exact-head CI #636; merged as `c5648122710d0720a59d8a8a79944b7ddf5b1d5a`.
ALTERNATIVES REJECTED: Allow any later UI heartbeat to overwrite completion regardless of ledger state; make UI markers the sole completion authority; prevent explicit reset/session changes from clearing completion.
REVISIT CONDITION: The numbered-ledger model or configured draft-slot semantics materially change, or new evidence shows the ledger can be complete without representing terminal draft progress.

---

## DECISION WR-D005

DATE: 2026-09-10
TASK: WR-033 — Returning-Player v1 Specification Freeze
STATUS: ACTIVE — RESEARCH / DEVELOPMENT ARCHITECTURE ONLY
DECISION:
- Returning-player expected PPR/game ordering uses the exact WR-025 feature matrix/preprocessing and separate-by-position `StandardScaler -> Ridge(alpha=100)`.
- WR-027 QB/RB/WR/TE risk outputs remain warning/explanation-only using its fixed position-specific logistic, prior-only recalibration, and warning-tier contract; risk does not directly modify rank.
- Huber is not adopted as a Ridge replacement.
- No WR-029 enrichment family is promoted.
- WR-029 point-in-time, provenance, source-version, coverage, missing-data, and fallback governance is adopted for later engine work. Historical research/evaluation retains the fixed September 1 12:00 UTC target-season cutoff; runtime refresh cadence remains a later implementation decision.
- Deterministic source/model fallback remains `LOCKED_RIDGE`.
- Rookies remain separate from the returning-player model.
- WR-D001 remains unchanged. This decision does not authorize custom rankings in production.
RATIONALE: WR-029 reproduced the accepted WR-025 Ridge benchmark exactly, then no tested enrichment family cleared the predeclared development gate or warning-enrichment gate. WR-027 separately established informative position-specific warnings while every direct rank-modifier candidate failed its prior-evidence guard.
EVIDENCE: `.ai/research/HISTORICAL_RANKING_SIGNAL_MANIFEST.md`; `.ai/research/POSITION_RISK_CALIBRATION.md`; WR-029 research merged through PR #121 after successful exact-head CI.
ALTERNATIVES REJECTED: Promote sub-threshold age/draft interactions; adopt a kitchen-sink context model; apply direct risk penalties to rank; replace Ridge with Huber; admit depth/staff/route or other fields that failed rights, point-in-time, or coverage gates.
REVISIT CONDITION: New rights-clean, cutoff-safe, predeclared evidence clears the applicable adoption gates or a later approved engine milestone formally revises the returning-player specification without contaminating WR-023.

---

## DECISION WR-D006

DATE: 2026-09-10
TASK: WR-034 — Availability / Expected-Games Model Research
STATUS: ACTIVE — RESEARCH / DEVELOPMENT ARCHITECTURE ONLY
DECISION:
- For returning QB/RB/WR/TE, the accepted expected-games research layer is the WR-034 stats-only position-specific `RIDGE_FULL` candidate using completed prior-season/prior-two-season Player Summary Stats inputs under the frozen cutoff/provenance contract.
- The output represents recorded-game availability/continuation expectation, not medical injury probability or causal injury prediction.
- WR-034 empirical uncertainty remains explicit; the accepted 80% residual interval is broad and must not be presented as precise schedule forecasting.
- WR-034 `LOGIT_FULL` probabilities for `<=8` and `>=14` recorded games are warning/explanation-only and do not directly modify WR-033 expected-PPR/game ordering.
- Deterministic expected-games fallback is `PREV_RATE`, then training-position mean with an explicit fallback flag when prior-game history is unavailable.
- WR-033 expected-performance ordering, rookies-separate boundary, WR-021/WR-023 frozen prospective contract, and WR-D001 production ranking authority remain unchanged.
RATIONALE: Under the preregistered development/confirmation protocol, `RIDGE_FULL` materially improved expected-games MAE versus both the schedule-adjusted prior-games baseline and training-position mean on 2022–2025 confirmation; the repeated-player bootstrap difference versus PREV_RATE excluded zero and all four positions improved. Warning models separately cleared their frozen Brier/reliability gates. Applicability among high-value players is positive but weaker, particularly versus PREV_RATE for WR, so the result supports a separate continuation layer rather than a precision or ranking claim.
EVIDENCE: WR-034 research merged through PR #123 at `346dd6ac862f20f320e55fde509e5c677d9a0ec7`; `.ai/research/AVAILABILITY_EXPECTED_GAMES.md`; `.ai/research/AVAILABILITY_EXPECTED_GAMES_PROTOCOL.md`; `.ai/research/HANDOFF.md`; exact final-head CI `34553207324`.
ALTERNATIVES REJECTED: Treat prior games alone as the primary expectation; interpret the target as injury-only; silently refresh mutable player metadata after checksum failure; use the warning probabilities as automatic rank penalties; change WR-033 expected PPR/game based on availability results.
REVISIT CONDITION: WR-035 season-total composition shows the accepted expected-games layer produces unstable or inferior downstream calibration, new rights-clean cutoff-safe evidence materially improves continuation modeling, or a later approved prospective gate revises the research architecture without contaminating WR-023.

---

## DECISION WR-D007

DATE: 2026-09-11
TASK: WR-037 blocker disposition / Returning-Player v2 evidence reset
STATUS: ACTIVE — RESEARCH / DEVELOPMENT ARCHITECTURE ONLY
DECISION:
- Close the WR-035 / WR-037 v1 Phase-5 composition path as `INSUFFICIENT EVIDENCE — UPSTREAM IDENTITY NOT PROVABLE` under the frozen WR-033 provenance contract.
- PR #124 must not be merged as an accepted Phase-5 result. Preserve it only as historical research/blocker evidence and close it unmerged.
- Do not weaken or retroactively redefine frozen-WR-033 replay equivalence. The substituted-input WR-035 experiment may remain informative research evidence but is not certified as exact frozen-WR-033 composition.
- Authorize a new explicitly versioned Returning-Player v2 research path beginning with WR-039, which must freeze a prospective source/provenance/retention/reproducibility contract before any new model scoring.
- Require full-row keyed feature/preprocessing/prediction evidence for every scored row in future v2 research, including zero-game rows. Aggregate metric equality is never sufficient evidence of exact input/prediction identity.
- Future evidence retention may not depend on an expiring CI artifact or mutable external URL as the sole authority. Exact source bytes should be retained under project-controlled immutable storage when rights permit; when raw retention is not permitted, a rights-compatible derived evidence package must still allow independent exact input/output verification.
- WR-040 must independently audit the frozen WR-039 evidence contract before Manager may authorize any new v2 scoring/evaluation task.
- WR-033 / WR-D005 and WR-034 / WR-D006 remain historical research decisions and are not rewritten. Any reuse by v2 must be explicitly versioned and must not claim identity with unavailable v1 upstream inputs unless independently provable.
- Phase 6 remains blocked until a later v2 season-total path is independently accepted. WR-D001 production ranking authority remains unchanged throughout.
RATIONALE: WR-037 exhaustively attempted recovery of the deleted frozen nflverse Players asset and trustworthy full-cohort keyed WR-033 evidence but could not prove exact identity for all 3,508 season-total rows, especially 1,627 zero-game rows. Preserving the original audit standard avoids moving the evidentiary goalposts, while a prospectively frozen v2 contract allows the custom projection research program to continue with stronger evidence custody.
EVIDENCE: PR #124 final blocker head `701bd4924a8595f2e17d946b39b1189ac2ef7eea`; `.ai/research/WR037_UPSTREAM_IDENTITY_BLOCKER.md`; WR-037 R&D handoff; exact-head War Room CI run `34587084283` SUCCESS; WR-036 audit evidence merged via PR #125.
ALTERNATIVES REJECTED: Treat active-row aggregate metric equality as proof of full-cohort WR-033 identity; continue remediating WR-036 findings 2–5 on an uncertifiable v1 base; represent newly sourced metadata as the deleted frozen asset; abandon all custom projection research solely because the historical upstream payload is unavailable.
REVISIT CONDITION: A trustworthy exact copy of the deleted WR-033 upstream asset or a pre-existing complete keyed reference is recovered, or the v2 evidence-contract audit demonstrates that the authorized prospective architecture is itself not viable.

---

## DECISION WR-D008

DATE: 2026-09-11
TASK: WR-039 / WR-040 — Returning-Player v2 evidence-contract acceptance
STATUS: ACTIVE — RESEARCH / DEVELOPMENT ARCHITECTURE ONLY
DECISION:
- Accept `wr-returning-player-v2-evidence-contract/1.0.0` at exact audited WR-039 head `00a9e787e716d6697e6cd0d9252982a672abbbe0` with machine-lock SHA-256 `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a` as the governing evidence/provenance/rights/retention/reproducibility architecture for the Returning-Player v2 research path.
- Accept WR-040 final verdict `PASS WITH NON-BLOCKING FINDINGS`. No CRITICAL/HIGH/MEDIUM contract findings remain. LOW finding `WR-040-AUD-01` concerns repository browser-CI nondeterminism outside the audited research surface and is tracked separately under WR-044/WR-045.
- The next authorized v2 research action is only a no-scoring exact source-custody checkpoint (WR-042) followed by independent source-custody audit (WR-043).
- No model fitting, scoring, tuning, comparison, evaluation, ranking, target/outcome join, production change, 2026 regular-season outcome inspection, or Phase-6 work is authorized by this decision.
- Before future scoring, the accepted chronology is: exact source custody -> independent custody audit -> Manager-authorized model-protocol freeze -> later scoring/evaluation with pre-outcome keyed prediction evidence -> independent model-result audit -> later season-total composition -> independent composition audit.
- Exact source instances must be content-addressed and independently auditable. Mutable URLs or expiring CI artifacts cannot be sole authority. Raw bytes must be retained under project-controlled immutable custody where rights permit; rights-limited sources require a lawful independently verifiable evidence path or must fail closed.
- Any semantic expansion of source classes, admitted columns, evidence requirements, or versioned contract meaning requires a new contract version plus Manager disposition and independent audit before affected scoring.
- WR-D001 remains production ranking authority; WR-021/WR-023 remain frozen; WR-033/WR-034 remain historical v1 research components and are not rewritten.
RATIONALE: WR-040 independently verified that the v2 contract directly addresses the provenance/custody failure that blocked WR-037, including exact source identity, full-row keyed evidence, durable custody, rights controls, deterministic locks, and prospective chronology. Accepting the contract while retaining separate source-custody/model-protocol/result audits preserves rigor without abandoning the custom projection research program.
EVIDENCE: WR-039 PR #127 immutable head `00a9e787e716d6697e6cd0d9252982a672abbbe0`; machine lock `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`; WR-040 audit head `c68ef98b27f81e8e1fb26a36a1d2f8d5739b8824`; audit PR #130 merged at `24c375775d58a0d8a4c178576efde5df64a3eedd`; research PR #127 merged preserving the audited commit as a parent at `a0f090e5c8bbbf513e34c24a3fead7df2c094d44`; PR #130 unchanged-head CI retry run `34621843706` attempt 2 SUCCESS.
ALTERNATIVES REJECTED: authorize scoring immediately after contract audit; skip independent exact-source custody; allow mutable-source reconstruction after results; treat rights uncertainty as non-blocking; reopen/relabel the uncertifiable WR-033 v1 replay chain.
REVISIT CONDITION: WR-043 finds the accepted custody architecture cannot be satisfied in practice; a required new source/field demands a contract version bump; or later independently audited evidence justifies a new explicit architecture decision.

---

## DECISION WR-D009

DATE: 2026-09-15
TASK: WR-059 / WR-071 — Returning-Player v2 source-snapshot + cohort acceptance
STATUS: ACTIVE — RESEARCH / DEVELOPMENT ARCHITECTURE ONLY
DECISION:
- Accept WR-059 exact remediated head `db8b21a65f2decf900902481f110758cc33f0aa6` after WR-071 independent `PASS` with no findings.
- Accept source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` with SHA-256 `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea` as the current Returning-Player v2 source-instance authority.
- Accept cohort `returning-player-v2-cohort/1.2.0-wr059` with SHA-256 `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4` as the current v2 historical cohort authority: 5,176 unique keys, zero duplicates, unchanged historical membership/order/lineage.
- Preserve all 15 WR-042 retained historical custody identities, but admit only the 14 Player Summary Stats instances. Historical `players.csv` asset `563580371` remains retained yet failed closed for v2 metadata use because exact release ID/full provider-update timestamp are not independently reproducible.
- Preserve WR-057 exclusion of `draft_picks.csv`; no replacement draft-capital authority is admitted.
- Close WR-042 as historical custody authority superseded by the complete accepted WR-059/071 checkpoint; PR #168 remains closed unmerged and immutable.
- Authorize next only WR-072, a no-scoring pre-score model-protocol + ordered feature-schema freeze, followed by fresh independent WR-073 audit.
- Because admitted metadata count is zero and draft capital remains excluded, WR-072 may not include metadata/draft-derived predictor semantics unless a future separately versioned source-contract/custody/audit gate explicitly authorizes them.
- No model fitting, scoring, tuning, comparison, prediction, evaluation, target/outcome join, 2026 regular-season outcome inspection, ranking/production change, season-total composition, or Phase-6 work is authorized by this decision.
- WR-D001 production ranking authority remains unchanged. WR-D005/WR-D006 remain historical v1 research architecture and may inform candidate ideas only through new v2 identities.
RATIONALE: WR-071 independently reproduced the source/cohort hashes, verified Path-B fail-closed semantics, exact custody/source counts, unchanged 5,176-key cohort and lineage, authority bindings, exclusions, and no-reacquisition/no-model boundaries. This satisfies the WR-D008 source-custody/cohort gate while preserving fail-closed treatment of provenance that cannot be independently reproduced.
EVIDENCE: WR-059 PR #196 accepted head `db8b21a65f2decf900902481f110758cc33f0aa6`; exact-head CI `34998074580`; WR-071 PR #202 audit head `96a712ba2cf6a016ddbfdc0ea14cabba282bee04`; WR-071 exact-head CI `35009298684`; audit evidence merge `0eb20f940fcfe455da3129a54525a73e39c966c6`; WR-059 integration merge `2777ec44ca5b5f2fef77c07d17e4fa75b6013262`; post-integration CI `35009576671` classify/Governance SUCCESS.
ALTERNATIVES REJECTED: infer missing historical metadata provenance; substitute current `players.csv`; reacquire sources; reintroduce excluded draft capital; proceed directly to model scoring; preserve WR-042 as an indefinitely blocked active task after its evidence has been incorporated and independently accepted.
REVISIT CONDITION: a future audited source-contract version admits new metadata/draft semantics, WR-073 finds the pre-score protocol cannot satisfy the accepted contract, or later independently audited evidence requires a new explicit source/cohort version.


---

## DECISION WR-D010

DATE: 2026-09-18
TASK: WR-095 / WR-096 — Returning-Player v2.1 protocol acceptance
STATUS: ACTIVE — RESEARCH / PROTECTED-EXECUTION ARCHITECTURE ONLY
DECISION:
- Accept exact WR-095 frozen target `738296ad38282fc91738203e7e1ced888ba862ed` after WR-096 independent `PASS` with no findings.
- Accept machine protocol candidate `returning-player-v2.1-model-protocol-candidate/1.0.0-wr095` with SHA-256 `5c86dacac044538422ca24fbeb13eaee3161050f917acc40f0dbdc1ca6547a39` as the governing prospective v2.1 model protocol for the next protected-execution implementation gate.
- Accept `EXISTING_ACCEPTED_SOURCE_SUFFICIENT`: retain WR-059 source/cohort authority, exactly 14 Player Summary Stats sources, zero Players metadata and zero draft-capital predictors.
- Treat 2018–2021 permanently as design-exposed for v2.1.
- Freeze future untouched chronology as validation 2022–2023, then confirmation 2024–2025 only after complete validation PASS.
- Accept the bounded residual Ridge architecture exactly as audited: per-position StandardScaler, z clamp [-6,+6], Ridge alpha=100 on residual target versus persistence, MAD robust sigma 1.4826*MAD, residual bound center +/- 3*robust_sigma, final prediction persistence + bounded adjustment, and fail-closed fallback semantics.
- Preserve accepted WR-072 performance thresholds numerically.
- Authorize only WR-097 protected consumer/bridge implementation and NO-SCORING readiness evidence, followed by fresh independent audit.
- No model scoring, 2022–2025 outcome exposure, production/ranking change, season-total composition or Phase 6 is authorized by this decision.
RATIONALE: WR-096 independently reproduced the WR-081 failure decomposition, verified the catastrophic tail/covariate-extrapolation mechanism, validated the prospective contamination controls, protocol determinism, unchanged gates, source sufficiency and exact machine digest, and returned PASS with no findings.
EVIDENCE: WR-095 frozen head `738296ad38282fc91738203e7e1ced888ba862ed`; protocol SHA-256 `5c86dacac044538422ca24fbeb13eaee3161050f917acc40f0dbdc1ca6547a39`; WR-096 Auditor head `3a779f6997c3bc57ec63f4fa4fa8084a609d5441`; audit PR #272; audit CI `35415672844` SUCCESS; audit evidence merge `94ec9656495fd56433c4c3dd413b9e0a0c1c1534`; exact audited research blobs integrated via PR #273 as `daa5e686cbc4fe2ca379baf696bf0335d05ad19d`.
ALTERNATIVES REJECTED: rerun WR-081; tune against 2020–2021 while calling them validation; inspect 2022–2025 before protocol freeze; weaken gates; admit new sources without need; proceed directly to scoring without a separately reviewed protected consumer/bridge.
REVISIT CONDITION: WR-098 finds the protected implementation does not faithfully encode the accepted protocol/custody chronology, a required source field is unavailable from accepted custody, or future untouched validation fails under the accepted protocol.


---

## DECISION WR-D011

DATE: 2026-09-19
TASK: WR-099 / WR-100 / WR-101 — Returning-Player v2.1 one-time protected validation authorization
STATUS: ACTIVE — ONE-TIME PROTECTED VALIDATION EXECUTION
DECISION:
- Accept WR-100 fresh independent PASS with no findings on exact WR-099 target `33d8d6037b1922841a134b9aba01eb3ea11ad97b`.
- Accept canonical WR-099 integration merge `6d49fa07b86ecdb5c92fcf127f83dd12d841c4c9` only after exact-head audit binding.
- Accept canonical post-integration Full War Room CI `35423356815` SUCCESS.
- Accept second canonical-main WR-097 NO-SCORING canary `35423633965` SUCCESS: 14/14 retained identities, 14/14 consumer re-hash/re-size, zero provider mutations, no consumer provider credentials, zero Actions artifacts, no real scoring, no 2022–2025 target exposure, no 2026 outcome inspection, cleanup PASS.
- Conclude the protected-execution and V3.5 workflow-identity gates are satisfied for one fresh v2.1 result execution.
- Authorize WR-101 exactly once through canonical Manager `future_execution_authority`: branch `wr-101-v21-validation-scoring-execution`, head `6d49fa07b86ecdb5c92fcf127f83dd12d841c4c9`, consumer `.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER.py`, consumer SHA-256 `f6e5eee35c0e769abc9cbc899c0eecc3e311ff3cd22973ebf2c7351ddd58c6f8`.
- Validation authority covers 2022–2023 only under the frozen WR-095 chronology; 2024–2025 confirmation may become visible only if the complete validation gate passes and the accepted protocol itself unlocks confirmation.
- Require one-time authority consumption receipt, one publication commit, exact terminal/result/decision cross-binding, bounded R&D packaging, Manager exact freeze, and fresh WR-102 result audit.
- Do not authorize rerun, tuning, alternate thresholds/features/sources, source reacquisition/substitution, 2026 outcomes, production/ranking changes, season-total composition, or Phase 6.
- A technical or model-result failure does not create automatic rerun authority.
RATIONALE: WR-097/098 established the protected v2.1 execution boundary; WR-099/100 independently established canonical V3.5 identity/run/receipt binding for that workflow; canonical Full CI and the second credentialed no-scoring canary prove the integrated path remains fail-closed and custody-safe. The previously blocked prerequisite chain is therefore complete, while one-time authority and fresh result audit preserve separation between execution permission and result acceptance.
EVIDENCE: WR-100 audit PR #286 / head `453ce58c4ead8f3d734a8eea5568dfb22d4dfca6` / CI `35423220027`; WR-099 exact target `33d8d6037b1922841a134b9aba01eb3ea11ad97b`; canonical integration `6d49fa07b86ecdb5c92fcf127f83dd12d841c4c9`; Full CI `35423356815`; second no-scoring canary `35423633965`; readiness job `105845796842`.
ALTERNATIVES REJECTED: keep scoring blocked after all audited gates pass; reuse WR-097 branch as a result lane; issue open-ended scoring authority; permit caller-supplied execution identity; skip result audit; pre-authorize reruns; expose confirmation regardless of validation.
REVISIT CONDITION: WR-101 protected execution fails technically, the authority/receipt cannot be consumed exactly, WR-102 finds a material result/evidence defect, or the frozen validation result requires a new explicit Manager decision.


---

## DECISION WR-D012

DATE: 2026-09-19
TASK: WR-101 / WR-103 / WR-104 — first v2.1 protected execution failure disposition
STATUS: ACTIVE — TECHNICAL REMEDIATION REQUIRED
DECISION:
- Treat WR-097 workflow run `35424042233` as a technical fail-closed execution, not a model result.
- Preserve evidence that canonical authority, live branch/head, exact checkout, reviewed consumer digest, retained-source retrieval and pre-consumer head recheck passed.
- Record failure at sandboxed consumer `target-ingest`.
- Record that staging/publication/push/authority-receipt verification were skipped; execution branch did not advance; cleanup passed; Actions artifacts are zero.
- Revoke/remove the WR-101 future execution authority immediately.
- Do not authorize a rerun from the same authority, despite the absence of a consumption receipt.
- Assign WR-103 for deterministic retained-data-free reproduction and the smallest bounded protected-execution remediation.
- Require fresh WR-104 independent audit before any remediation integration.
- Require a separate future Manager decision before any NEW one-time scoring authority can be issued.
- Keep confirmation/production/composition/Phase 6 blocked.
RATIONALE: the first real protected attempt discovered an execution-path defect not exposed by existing synthetic target-ingest coverage. Fail-closed behavior worked as intended, but repeating the run without root-cause remediation and fresh audit would violate the one-time authorization policy and risk repeated target exposure.
EVIDENCE: workflow run `35424042233`; protected job `105846904830`; failure message `WR-097 FAIL CLOSED: sandboxed consumer failed closed in target-ingest`; unchanged execution branch head `6d49fa07b86ecdb5c92fcf127f83dd12d841c4c9`; zero workflow artifacts.
ALTERNATIVES REJECTED: rerun immediately; treat the failure as validation FAIL; broaden source/protocol/model semantics; inspect retained targets manually; leave the live authority in canonical state.
REVISIT CONDITION: WR-103 produces an exact bounded remediation, WR-104 returns PASS-family, Manager integrates only the audited target, and all required canonical/no-scoring validation gates succeed.


---

## DECISION WR-D015

DATE: 2026-09-19
TASK: WR-101 / WR-106 / WR-107 — R2 stage-gate bridge contract failure
STATUS: ACTIVE — TECHNICAL FAIL-CLOSED / REMEDIATION REQUIRED
DECISION:
- Treat WR-101 R2 run `35444278227` as a technical fail-closed event, not a model-result verdict.
- Revoke/remove the R2 one-time authority immediately because no publication/receipt consumed it.
- Do not rerun under the same authority.
- Preserve the protected wrapper requirement for a non-empty stage-gate bridge `status_label`; the wrapper is behaving correctly.
- Route WR-106 to Work Helper for deterministic synthetic reproduction and the smallest consumer-side bridge-result fix.
- Restrict WR-106 implementation to the WR-097 consumer and focused tests/evidence; do not modify the protected wrapper or workflow.
- Require WR-107 fresh independent audit before integration.
- No future scoring authority may be considered until exact audited remediation integration and required canonical readiness proof complete.
RATIONALE: live execution reached the stage-gate boundary only after exact authority/head/consumer/retrieval checks passed. The consumer computes a stage-gate decision label and writes it into the artifact but fails to expose it in the bridge payload required by the wrapper. Fail-closing here preserves machine-readable terminal/result semantics.
EVIDENCE: run `35444278227`; scoring job `105900552923`; exact error `stage gate decision status missing`; authority SHA-256 `2ef299a0de94fabda98095676208f9c50a34076d52ed14e53a322b963b411c0f`; execution branch unchanged; artifacts 0; cleanup PASS.
ALTERNATIVES REJECTED: weaken/remove wrapper status requirement; infer status from gate_pass in the wrapper; rerun immediately; expose raw retained data to debug; modify frozen gate semantics.
REVISIT CONDITION: WR-107 returns PASS-family on one exact WR-106 remediation target and Manager integrates it with canonical validation/readiness proof.
