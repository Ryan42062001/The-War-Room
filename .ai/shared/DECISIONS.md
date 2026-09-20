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


---

## DECISION WR-D016

DATE: 2026-09-19
TASK: WR-101 / WR-102 — Returning-Player v2.1 final protected-result disposition
STATUS: ACTIVE — RESULT ACCEPTED / BASELINE-ONLY EVIDENCE
DECISION:
- Accept WR-102 independent `PASS` with no CRITICAL/HIGH/MEDIUM/LOW findings only for exact WR-101 SHA `a1cfda0b7ec0decbe5ece96283900a35d875abaf`.
- Accept the protected WR-101 result as a valid protocol result: validation 2022–2023 PASS; confirmation 2024–2025 FAIL; terminal `CONFIRMATION_FAILED`; decision `BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE`.
- Record the blocking frozen confirmation criterion as RB position-MAE regression `0.107573057046809`, exceeding the frozen `0.05` cap.
- Accept Auditor evidence head `a13df5e9edd6b350e9d4fca81c3db3ec243761ed`, audit PR #304, audit CI `35452642020` SUCCESS, and audit-evidence merge `2ea5dbe0eba4819e685bab77140233df593758ad`.
- Integrate only exact audited WR-101 target `a1cfda0b7ec0decbe5ece96283900a35d875abaf`, producing canonical merge `c9c4cfe1b2b40b43ffe94a11d5f223acd72114db`.
- Accept required canonical-main War Room CI `35452844314` SUCCESS after exact result integration.
- Close WR-101 and WR-102 as completed baseline-only research evidence.
- Do not authorize another scoring run, new scoring authority, tuning/remediation, threshold/gate changes, source/cohort/protocol substitution, production promotion, season-total composition, or Phase 6 from this result.
- Any future Returning-Player model attempt requires a separate prospective Manager/R&D protocol decision and fresh applicable audit gates.
RATIONALE: The protected workflow executed successfully under consumed one-time R3 authority, validation passed, confirmation lawfully opened, and the frozen confirmation gate then failed on the RB position-MAE regression criterion. WR-102 independently reproduced the execution/publication/chronology/hash/gate evidence and found no audit defects. Preserving the failed confirmation verdict prevents post-result tuning or gate weakening while retaining the result as valid research evidence.
EVIDENCE: WR-101 exact target `a1cfda0b7ec0decbe5ece96283900a35d875abaf`; protected publication `41c1601ce2a7ae26fcb13a370ae2960db9427a80`; protected run `35447590872`; WR-102 Auditor head `a13df5e9edd6b350e9d4fca81c3db3ec243761ed`; audit PR #304; audit CI `35452642020`; audit evidence merge `2ea5dbe0eba4819e685bab77140233df593758ad`; exact result integration `c9c4cfe1b2b40b43ffe94a11d5f223acd72114db`; canonical validation `35452844314` SUCCESS.
ALTERNATIVES REJECTED: rerun until confirmation passes; tune against exposed 2024–2025 outcomes; weaken the 0.05 position cap; treat workflow SUCCESS as model PASS; promote the model despite confirmation failure; carry R3 authority into a future attempt.
REVISIT CONDITION: a wholly new prospectively specified Returning-Player research task is authorized with fresh protocol/evidence/audit boundaries; WR-101/WR-102 themselves are not reopened to obtain a different result.


---

## DECISION WR-D017

DATE: 2026-09-19
TASK: WR-074 / WR-075 — Self-Hosted Heavy-CI Runner Pilot Final Disposition
STATUS: ACTIVE — AUDITED PILOT ACCEPTED
DECISION:
- Accept WR-075 independent `PASS` with no CRITICAL/HIGH/MEDIUM/LOW findings only for exact WR-074 SHA `75fcd3756956b2943f18aff03115f9783a16d0aa`.
- Accept Auditor evidence head `0968f3e84aa852d6fa528e3ca9a9ca3383cc6362`, Auditor PR #310, and Auditor exact-head CI `35463331283` SUCCESS.
- Accept audit-evidence canonical merge `2d860ab27fd0fe02e3614311a6f202d7a91439df` and post-audit-evidence canonical CI `35475324576` SUCCESS.
- Integrate only exact audited WR-074 target `75fcd3756956b2943f18aff03115f9783a16d0aa`, producing canonical merge `3656d355351113bb4692759e4410e607b60967ea`.
- Accept required canonical-main FULL War Room CI `35475382820` SUCCESS after integration, including full test job `105983665291` SUCCESS.
- Close WR-074 and WR-075.
- Accept the dedicated Linux/WSL2 `[self-hosted, war-room-heavy-ci]` path as a bounded heavy-CI pilot with functional/security viability and hosted parity/fallback evidence.
- Preserve exact push-only trusted branch gating, GitHub-hosted Governance/custody/protected separation, least-privilege permissions, non-persistent checkout credentials, provider/custody secret isolation, and bounded persistent-workspace cleanup.
- Do not claim performance superiority; the audited benchmark showed self-hosted slower than hosted in the observed runs.
- Do not authorize generic self-hosted routing, arbitrary PR execution, `pull_request_target` execution of untrusted code, credential-bearing/custody/protected workloads on self-hosted, or unrelated CI migration from this decision.
RATIONALE: WR-075 independently reproduced the exact frozen target scope, trusted routing, secret/custody boundaries, repeated clean self-hosted runs, hosted-reference parity, benchmark math, release validation, and final-target evidence with no findings. Exact audited integration was followed by required canonical-main full CI success.
EVIDENCE: WR-074 target `75fcd3756956b2943f18aff03115f9783a16d0aa`; implementation `c2e511da5d3767cbc0688de7e95236135a6975b2`; parity runs `35460866285`, `35461197805`, final pilot `35461615030`; WR-075 Auditor head `0968f3e84aa852d6fa528e3ca9a9ca3383cc6362`; PR #310; audit CI `35463331283`; audit evidence merge `2d860ab27fd0fe02e3614311a6f202d7a91439df`; exact target integration `3656d355351113bb4692759e4410e607b60967ea`; canonical full CI `35475382820`.
ALTERNATIVES REJECTED: broaden routing to generic self-hosted; run fork PR code on the host; migrate custody/protected credentialed workflows; treat self-hosted as faster despite measured regressions; skip canonical full-CI validation.
REVISIT CONDITION: any change to runner trust model, trigger surface, labels/routing, credential scope, host operating model, or migration of additional workloads requires a separate Manager task and applicable fresh audit.


---

## DECISION WR-D018

DATE: 2026-09-19
TASK: Manager disposition — user-provided external ESPN Direct feasibility investigation, following closed WR-109
STATUS: ACTIVE — FALLBACK-FIRST RELIABILITY CLAIM / STRUCTURED OBSERVATION OPPORTUNISTIC

DECISION:
- Describe The War Room's production ESPN synchronization as **Board/Pick History fallback-first for demonstrated reliability, with opportunistic passive structured-source acceleration**. "Fallback-first" defines the supported reliability claim and planning priority; it does **not** reorder existing WR-D003 per-pick source confidence, suppress a genuinely ledger-eligible structured observation, or authorize a code change.
- Preserve WR-D003's layered, monotonic numbered-pick ledger: accept attributable structured picks when truly eligible, use conditional accepted REST recovery and live-proven DOM Board/Pick History when structured sources lag or are empty, and require War Room application/ACK for end-to-end success. Do not claim independent structured Direct coverage from a live/network status lamp, decoded candidates, or a DOM-repaired final ledger.
- Record the investigation disposition `DIRECT_NOT_SUPPORTED_BY_AVAILABLE_EVIDENCE`; independent full-draft structured Direct remains `LIVE_DIRECT_UNVERIFIED`. This is **not** a proof of universal or permanent infeasibility.
- Stop open-ended speculative Direct engineering, repeated mock hunting, unverified endpoint adaptation and permission expansion. Preserve current passive observers and functioning fallback. If a new concrete, attributable structured source emerges, or a user explicitly requests one bounded consent-safe disposable-mock observation, Manager may scope a **separate** limited R&D experiment; no automatic retry or authentication authorization follows from this decision.
- Keep the active WR-110 custom-projection research independent and unchanged. No Builder, R&D, Draft Strategy or Auditor downstream task is activated by this disposition. Existing FantasyPros ECR player-value authority and WR-D016 baseline-only model result remain unchanged.
- Investigate reported source-label/provenance ambiguity only if separately verified and prioritized; do not describe the investigator's source-attribution hypothesis as an independently reproduced production defect.

EVIDENCE:
- Accepted canonical WR-109 reports `.ai/research/WR109_DRAFT_READINESS_GAP_ASSESSMENT.md` and `.ai/research/WR109_ESPN_DIRECT_LIVE_VALIDATION_PLAN.md`, merged through PR #314 at `feb6e35898608a1fc656a3d6712d984a43b8ae59`, and WR-D003's existing layered-source contract.
- Existing `extensions/espn-companion/LIVE_VALIDATION.md`: 2026-08-24 Board/Pick History 192/192 and 16 Mine in a real mock using Companion v0.8.7; 2026-09-06 224 captured / 223 applied duplicate issue in v0.9.13, followed by v0.9.14 deterministic repair **not re-proven in a later real mock**; 2026-09-07 288/288 DOM numbered slots with zero observed structured WebSocket/worker candidates, empty REST then 404 and an off-board application case. These format- and version-specific observations do not establish independently completed structured Direct sync.
- The user's separately supplied Work-mode feasibility report (2026-09-19) examined documented APIs, REST/mock identity, frame/worker/React hooks and provenance; reported `DIRECT_NOT_SUPPORTED_BY_AVAILABLE_EVIDENCE`, 110 focused credential-free tests passed, no live authenticated mock, and a broad test suite **stopped before completion**. The report was supplied through chat and is not a versioned repository audit artifact; individual novel technical hypotheses and reported local tests were **not independently reproduced in this Manager documentation review**. Do not promote them to canonical runtime proof.
- Repository's accepted WR-109 and WR-D003 evidence supports this narrower production reliability posture without changing software behavior.

ALTERNATIVES REJECTED: market Direct as independently live-validated; declare all possible ESPN structured integrations impossible; disable safe passive observers or replace WR-D003 with DOM-only source authority; authorize broad new browser permissions or account capture; assign speculative Builder work or block WR-110 on this question.

REVISIT CONDITION: a new documented/supported ESPN completed-pick API contract, a reproducible attributable source emitting a correctly numbered and identity-resolved real pick, or a new explicit Manager-approved consent-safe disposable-mock protocol with sufficient source-before-DOM per-pick evidence. Any new production source adapter, telemetry correction, source-priority change, extension permission change or other implementation requires its own bounded task and applicable independent audit before deployment.


---

## DECISION WR-D019

DATE: 2026-09-19
TASK: WR-111 acceptance / WR-112 prospective feasibility authorization
STATUS: ACTIVE — PROSPECTIVE EVIDENCE CLAIM / NO EXECUTABLE PROTOCOL
DECISION:
- For the intended **independently confirmed cross-season custom returning-player projection** claim, plan a fully predeclared 2027 full-season prospective validation followed by a distinct 2028 prospective temporal confirmation, conditional on actual future rights, point-in-time forecast locks, per-position sample/power and independent protocol/result audits. These years are target-calendar candidates, not presently authorized or acquired holdouts.
- A single prospective season can support only a narrower one-season performance claim under a separately predeclared adequate test; it must not be labeled validation-plus-distinct-season confirmation or automatically promote the model. A 2029 regular season is not intrinsically required; additional years are demanded only by an independently justified and pre-frozen statistical/generalizability contract.
- Before 2027 outcome exposure, any later executable protocol must freeze the candidate/training-update rule, source/feature/cohort and prediction cutoffs, full-PPR per-recorded-game target, baselines, positional/effective-cluster minimums, thresholds/multiplicity, uncertainty, stopping/failure treatment, retention/custody, and independent audit. If 2027 validation fails, original 2028 confirmation does not unlock. After 2027 outcome exposure, no retuning/model or gate alteration preserves original 2028 confirmation identity.
- Accept WR-111 research-only PR #321 exact head `31413aa9b2708dc02c4e3bebe23dab98953072d2`, exact-head CI `35481092223` SUCCESS, canonical merge `a4dcbbaca52915898cc2da437506fd0f4ebdd975`. Close WR-111; retain `INSUFFICIENT_NEW_CONFIRMATION_DATA` and WR-D001/WR-D016.
- Authorize only distinct WR-112 public-documentation/synthetic-paper **source-rights and prospective protocol-feasibility gate**. No actual vendor entitlement is presumed. No source/provider dataset/API download, signup, paid or authenticated account interaction, acceptance of terms, request/handling credentials, source/cohort admission, historical/protected/2026 outcome inspection, model fit/scoring, runnable protocol, prediction lock, Draft Strategy/Builder activation, production ranking, season-total composition, Phase 6 or protected execution is authorized.
RATIONALE: WR-111 separates a possible early one-year test from the stronger cross-season confirmation claim. The prior v2.1 2022–2023 validation PASS and 2024–2025 confirmation FAIL demonstrate why the claims must not be conflated. Available public provider documentation does not prove next-season data rights, timely source instances, retention/auditor permission or sample adequacy. A narrower subsequent paper gate can expose infeasibility before any source intake or implementation.
EVIDENCE: `.ai/research/WR111_FUTURE_SOURCE_RIGHTS_FEASIBILITY.md`; `.ai/research/WR111_INDEPENDENT_EVALUATION_WINDOW_ASSESSMENT.md`; `.ai/research/HANDOFF.md`; WR-D001/009/010/016; PR #321 and exact-head CI `35481092223`.
ALTERNATIVES NOT SELECTED FOR CROSS-SEASON CLAIM: one-year-only proof as cross-season confirmation; automatic three-season 2027–2029 requirement; historical randomized or provider-republished 2018–2025 pseudo-independent results; retroactive full-season 2026 preseason lock; immediate data intake/scoring.
REVISIT CONDITION: documented future source rights/timeline, point-in-time pre-2027 feasibility or preregistered position/power assessment disproves a defensible two-season design. Manager must explicitly change the prospective plan before first target exposure, never after viewing a result to select the more favorable evidence standard.


---

## DECISION WR-D020

DATE: 2026-09-19
TASK: WR-112 acceptance / WR-113 no-acquisition rights-clarification and pre-2027 readiness
STATUS: ACTIVE — RESEARCH-ONLY / NO SOURCE ADMISSION
DECISION:
- Accept only the WR-112 paper reports in PR #323 exact head `b635d8005e7a1fc3c5422f5ea8786da56eae04d6`, exact-head CI `35483333620` SUCCESS, canonical merge `7129608c5ea86044552dcfba4f5c6792730be563`. Close WR-112; preserve `INSUFFICIENT_NEW_CONFIRMATION_DATA`, WR-D001, WR-D016, and WR-D019's conditional 2027 validation -> separate 2028 confirmation evidence standard.
- Name **Ryan, War Room project owner acting through Manager / Architect**, the accountable RIGHTS AND CUSTODY DECISION OWNER for future source use, lawful raw/derived retention and independent Auditor access. R&D prepares documentation only; any operational custodian, user-approved private/public/commercial use, vendor contract/entitlement, security controls and actual auditor access remain to be explicitly established. Naming the owner does not grant a license, data access, or storage authority.
- Authorize only distinct WR-113: no-data-acquisition, no-provider-contact public-documentation rights clarification and prospective pre-2027 protocol/power-readiness analysis. Prepare an unsent owner/provider permission-question matrix; future per-instance provenance and custody approval checklist; first-game-relative deadline/stop dependencies and purely symbolic or wholly fabricated QB/RB/WR/TE position effective-cluster, pooled and simultaneous-uncertainty readiness criteria. No actual future asset, real cohort count, numerical power, executable threshold or holdout is established.
- No source or provider data/API acquisition, external vendor contact, account/credential/terms interaction, new source/cohort admission, raw historical/protected/2026 outcomes, operational custody/storage deployment, model selection/fitting/scoring, executable protocol/freeze, prediction lock, independent audit activation, Strategy/Builder/Work Helper downstream work, production rankings, season totals or Phase 6. Source intake, executable protocol, independent source/protocol/result audits and real scoring require **separate later explicit Manager tasks and authorization**, never automatic transition after WR-113.
RATIONALE: WR-112 identifies documentation-level options and material legal, temporal, custody and statistical uncertainties; a narrower owner-named clarification/readiness packet can make them decision-ready without acquiring data or prejudging the independent two-season evidence standard.
EVIDENCE: WR-112 accepted two research reports and handoff; PR #323, exact-head CI `35483333620`; WR-D009/010/016/019.
REVISIT CONDITION: documented asset-specific use rights, permitted reproducible custody/auditor access, an actual pre-2027 availability window and an independently reviewable all-position adequacy basis permit the Manager to decide whether further separately scoped source and prospective protocol work is warranted. A missed pregame lock cannot be repaired retrospectively.


---

## DECISION WR-D021

DATE: 2026-09-19
TASK: WR-113 research acceptance / WR-114 owner-declaration-first rights adjudication
STATUS: ACTIVE — BLOCKED RESEARCH-ONLY GATE / NO SOURCE ADMISSION
DECISION:
- Accept only paper-only WR-113 PR #325 exact head `af35bf0b59f733c7c31473a6a24006467e445834`, changed research rights/readiness reports and R&D handoff, exact-head CI `35483971036` SUCCESS, canonical merge `d352a92f254bb7247892be7a32b939781792af50`. WR-113 CLOSED. `RIGHTS_UNVERIFIED / INSUFFICIENT_NEW_CONFIRMATION_DATA`; no actual future rights, cohort, custodian, model, executable protocol or real power are admitted. WR-D001/D016/D019/D020 remain unchanged.
- Authorize a distinct **WR-114 rights-evidence adjudication and pre-2027 readiness-scoping task** in `BLOCKED / USER_ACTION` state. It has **no worker branch or authority to execute** until Ryan (War Room project owner, accountable rights/custody decision owner) personally documents an owner declaration specifying intended private/personal vs publicly accessible vs potential commercial research/product use; intended distribution of aggregates, individual forecasts, raw/source-derived outputs; permitted/required raw and derived storage purpose, retention horizon and deletion/termination constraints; and the identity/recipient/access requirements of a truly independent Auditor. Unknown choices remain explicitly UNKNOWN; neither a public GitHub repository nor prior research implies the user's intentions or consent.
- After Ryan supplies that information, Manager must explicitly review and record the owner declaration in canonical state, reconcile a new `ASSIGNED` WR-114 task/registry transition, and create its dedicated R&D branch from the then-current verified post-unblock canonical main. No independent source-rights adjudication work begins before that transition. When activated, WR-114 may map those owner-approved uses against the **existing** WR-111/112/113 official-public-documentation rights evidence and prepare an evidence-specific per-use adjudication/unknown matrix and symbolic pre-2027 feasibility stop/go scope without obtaining data. Do not repeat generic provider survey or represent a paper conclusion as a legal opinion.
- **No operational custodian is appointed**, and no provider contact/clarification is authorized by WR-114. Any later provider outreach, account/terms/license or payment decision, storage/operator appointment, real source/cohort intake, model selection, executable protocol/power lock, independent source/protocol/result audit, fitting, protected scoring, production ranking or Phase 6 requires a distinct explicit owner/Manager task, with independent review wherever required.
RATIONALE: WR-113 defines the questions, but the rights implications cannot be adjudicated meaningfully without the actual intended project use, reproducibility horizon and independent auditor access requirements. Owner-first blocking prevents a fourth circular abstract provider-research task and avoids treating ownership as provider permission. All temporal confirmations remain conditional, with 2027 preseason prediction lock strictly before first included target-year game; no retrospective 2026 or known 2018–2025 outcome relabeling.
EVIDENCE: WR-113 research reports and handoff in PR #325; exact-head CI `35483971036`; WR-D009/010/016/019/020. No separate user owner declaration has been supplied or accepted in this transition.
REVISIT CONDITION: Ryan explicitly supplies the owner declaration above and Manager integrates and verifies its authoritative scope. If it remains unavailable, WR-114 stays blocked; no provider/account/data/model/scoring work follows.


---

## DECISION WR-D022

DATE: 2026-09-19
TASK: Ryan's WR-114 owner declaration / rights-adjudication worker unblock
STATUS: ACTIVE — OWNER USE DECLARED; RETENTION/AUDITOR ACCESS NOT YET CHOSEN
OWNER DECLARATION (Ryan, War Room project owner / accountable rights-custody decision owner; explicit in current Manager conversation):
- Intended use: **private/personal research and fantasy-draft use**. Any future validated custom projection is intended only to rank players **inside Ryan's private War Room**. This expresses a future intended purpose, NOT authorization for new source/model, production ranking, recommendation policy or distribution. WR-D001 FantasyPros ECR remains current production value authority.
- Published outputs: **nothing will be published**; do not plan public raw records, player-level forecasts, aggregate results, source-derived datasets or public model/other-user distribution. Do not confuse the existence of repository documentation or a fantasy-draft application with permission to publish data/model results.
- Raw and derived, prediction, target and audit-evidence retention: **UNDECIDED**. Ryan requests a paper assessment of legally permitted retention options, deletion obligations, and reproducibility/security tradeoffs **before approving a duration, storage implementation or operator**.
- Independent Auditor access: **UNDECIDED**. Ryan requests assessment of the **minimum lawful independent-auditor reference/evidence access and reproducibility requirements before approving a recipient, scope or actual access**.
- Additional constraints: **none specified**. No provider contact, source acquisition, operational custodian appointment, contract acceptance, executable protocol, independent audit or scoring is authorized by the declaration.
MANAGER DECISION:
- Accept this declaration as authoritative **only for WR-114 documentary rights adjudication and readiness scoping**. Private use/no publication is sufficiently specified to prevent repeated generic provider-survey work. The explicitly undecided retention and independent Auditor access are the subject of WR-114's options assessment, not reasons to keep R&D blocked or approvals to access data.
- Unblock sole task WR-114 from `BLOCKED / USER_ACTION` to `ASSIGNED / NONE` using a distinct exact-main Manager control-plane transition and bootstrap branch `wr-114-rights-evidence-adjudication-pre2027-readiness` only from its verified post-merge canonical-main SHA. No other worker or workflow authority is activated. R&D reports supported versus unknown legal source-use rights, minimally required legal retention/auditor options, and purely symbolic 2027/2028 readiness. No model/source actual execution.
- Ryan / Manager retains all **future** decisions regarding a concrete lawful retention period, auditor recipient and controls, operational custodian and provider outreach. Unresolved project-specific asset/upstream ownership, ML, derivative, retained evidence and auditor access stays `RIGHTS_UNVERIFIED`; `INSUFFICIENT_NEW_CONFIRMATION_DATA` and WR-D016 historical failed confirmation remain.
EVIDENCE: Ryan's explicit WR-114 owner-declaration message in current Manager conversation; accepted WR-111/112/113 research reports; WR-D001/016/019/020/021; exact canonical WR-114 blocked registry at `e10328c18da8237b592c7d1ebf6bbadaa7bb64da`.
FUTURE GATES: Explicit separate Ryan/Manager approval for any provider clarification, source/data intake, operational custodian/storage, independently audited executable protocol, independent source/protocol/result audits, scoring and possible future private ranking change. WR-114 confers none.


---

## DECISION WR-D023

DATE: 2026-09-19
TASK: WR-114 documentary research acceptance / prospective rights-and-audit owner-choice gate
STATUS: ACTIVE — OWNER CHOICES PENDING; NO NEW WORKER ASSIGNED
DECISION:
- Accept **paper-only** WR-114 PR #328 exact three-file head `a21282f3a5f22be81a632a95b3d1d5c4d6677cda`, exact-head War Room CI `35485154312` SUCCESS (classify `106010045066`, Governance `106010057907`, docs-only product skipped), integrated as canonical research merge `28a22ba03d3e7e6500802becfaf349ec861b8b2a`. WR-114 CLOSED, remove from active-only task registry. The reports distinguish conditional CC BY scope from unverified specific future release/upstream owner/access licenses and establish only symbolic pre-2027 readiness. No data, numerical power, source admission, protocol, audit or ranking evidence was accepted; retain `RIGHTS_UNVERIFIED / INSUFFICIENT_NEW_CONFIRMATION_DATA`, WR-D001 and terminal WR-D016.
- Ryan's WR-D022 **private/personal research and internal War Room fantasy draft ranking purpose and NOTHING published remain accepted and must NOT be re-collected**. This private intended future use does not itself authorize changing current FantasyPros ECR production ranking or appoint an operator, reviewer or licensor.
- **The next Manager/owner gate is NOT another generic provider survey.** Before authorization of any distinct, no-data-acquisition source-instance-specific rights clearance, Ryan chooses a **provisional** rights-compatible retention/reproducibility **approach** and the **minimum independent-auditor access model** that the clearance should test. The choices are hypothetical requirements for documentary verification, **not** a commitment to store, acquire, redistribute, or grant access, and not a claim that any provider license permits them.
- The paper alternatives are: (A) event-limited restricted original/immutable reference custody through 2027 validation, 2028 confirmation and the subsequently specified independent audit/review endpoint; (B) permitted short raw retention with independently witnessed raw→complete minimized extract and a narrower later derived-layer claim; (C) no local raw retention only if an approved independent reviewer can lawfully re-fetch identical immutable, versioned reference bytes; (D) hash/aggregate-only is inadequate for full independent reference/source-to-result reproducibility and therefore cannot satisfy the intended independent cross-season claim without a changed future evidence standard. Ryan may state a conditional preference, choose a fixed/event-based stopping rule, and request a reported rights-permitted option before setting a final duration.
- The minimum auditor-access choice must define the intended level of independent reference verification: lawfully authorized restricted read-only source/equivalent + keyed derived/prediction/target evidence for independent reproduction (without public distribution), versus source-to-extract attestation by a lawful independent reference reviewer then independently auditable minimized derived evidence (narrower later claim), versus exact lawful auditor re-fetch. Independent receipt of author-generated hashes or aggregate metrics alone is insufficient. A specific auditor recipient, license-seat permissions, exact retention duration, storage location and operational custodian remain unapproved until after a separate evidence and security gate.
- Once Ryan makes the provisional choices, Manager may **separately authorize** a truly source-specific documentary licensing and custody feasibility task restricted to F27/T27/F28/T28 future `stats_player` roles, private internal ML/derived rankings and chosen audit/retention conditions. Use available official release-specific provenance and valid applicable public licensing evidence first; do not assume an individual paid provider grant is universally required. Provider contact/clarification requires another **explicit** approval if an exact unresolved licensor/component/access question genuinely calls for it.
- No present provider outreach, account/data/API/credential or terms acceptance, future source intake, operational custodian or Auditor appointment, source/cohort admission, real 2026/player outcome inspection or empirical power, executable protocol/prediction lock, protected fitting/scoring, new production/policy ranking, Strategy/Builder/Work Helper or Phase 6. Source intake, custody implementation, protocol, each independent source/protocol/result audit, scoring and private ranking remain distinct future Manager/user decisions.
RATIONALE: WR-114 adjudicated the existing paper evidence sufficiently for Ryan to select the intended reproducibility/retention and lawful audit requirement to be evaluated; a fourth generic source survey or re-asking the already defined private purpose would add no decision-ready information. Owner-defined recipient and retention requirements are prerequisites to source-specific rights clearance, not a substitute for rights evidence.
EVIDENCE: `.ai/research/WR114_RIGHTS_EVIDENCE_ADJUDICATION.md`, `.ai/research/WR114_PRE2027_READINESS_SCOPE.md`, `.ai/research/HANDOFF.md`; WR-D001/016/019/020/021/022; PR #328 and exact-head CI above.
REVISIT CONDITION: Ryan records a provisional reproduction/retention and independent-auditor access preference; Manager may then scope a new source-specific, no-acquisition legal/provenance evidence task. If source terms contradict the chosen approach, return for a bounded owner choice rather than silently changing the evidence claim or gaining data access.


---

## DECISION WR-D024

DATE: 2026-09-19
TASK: Ryan's WR-D023 owner selection / WR-115 narrow source-specific no-acquisition feasibility
STATUS: ACTIVE — PROVISIONAL OWNER REQUIREMENTS / PAPER RESEARCH ONLY
OWNER DECLARATION AND SELECTION (explicit in current Manager conversation):
- Keep WR-D022 fixed: **private/personal** War Room fantasy draft research and intended future private in-app player ranking only, with **nothing published**. This is not authorization to replace today's FantasyPros ECR ranking (WR-D001). Do not re-ask intended use.
- Ryan provisionally selects **retention/reproducibility option C** as the requirement for a future rights feasibility assessment: **no local raw-source retention**, conditioned on a legally entitled future independent Auditor being able to re-fetch **exactly the same immutable, versioned source bytes**. If exact identity, availability or lawful independent retrieval cannot be established, **fail closed**. No fallback to original raw custody or witnessed early deletion without a new owner decision.
- Ryan provisionally selects **full reference-level independent reproduction**: a future genuinely independent, legally entitled reviewer must have restricted/read-only access to exact source/reference bytes or a verified hash-identical lawful copy PLUS necessary keyed derived, sealed forecast, target, protocol and evaluation evidence. No recipient is now appointed or permitted access; no legal entitlement or future source stability is deemed proven.
- No final raw/derived/prediction retention period, disposal date, storage system, owner-appointed operational custodian, reviewer identity, data access channel, provider grant or publication right is selected. Future minimal **derived/prediction evidence custody** is distinct from “no local raw copy” and itself requires later rights, security and owner approval.
MANAGER DECISION:
- Treat the choices as enough to authorize only **WR-115: Source-Specific Immutable Re-Fetch Rights and Independent-Audit Feasibility**, a separately numbered, public-documentation/metadata-only, no-data-acquisition R&D task. Limit it to minimum future `stats_player` regular-season F27/T27/F28/T28 *source roles*, existing official terms/ownership/provenance, exact immutable-version persistence and legally independent reviewer retrieval and necessary minimal derived-evidence retention. Distinguish present public documentation from **future asset-specific rights, legal recipient and immutable re-fetch still UNVERIFIED**. Do not repeat WR-111–114 generic provider surveys, assert a valid CC license is always insufficient, or inspect player data/files.
- Open a dedicated R&D branch only from verified canonical post-activation main, read canonical task/charter/workflow, write exactly two WR115 paper reports plus R&D handoff and open a research-only PR with exact-head Governance CI. No automatic follow-on task.
- No provider contact/clarification, account/API/credentials/terms acceptance, source/release-archive/statistics access, actual 2026 or protected historical data, data/source admission, operational custodian/storage or actual Auditor appointment/access, executable protocol, player-cohort/power computation, model fitting/scoring, ranking, Strategy/Builder/Work Helper, or Phase 6. A specific documentary rights/provider gap can warrant a **later separately authorized** narrow contact only. If option C cannot be supported, return to Ryan for a new explicit retention/reproduction choice rather than implicitly using alternatives A/B.
RATIONALE: The owner has now fixed private purpose, non-publication, a specific no-local-raw immutable re-fetch requirement and full independent read-only reference-level audit objective. A narrowly scoped official public documentation check can identify precise future source/version/legal-entitlement and persistence blockers without obtaining football data or presuming a license.
EVIDENCE: Ryan's WR-D023 follow-up message; WR-D022/023, accepted WR-114 paper reports (PR #328, final head `a21282f3a5f22be81a632a95b3d1d5c4d6677cda`, CI `35485154312`, merge `28a22ba03d3e7e6500802becfaf349ec861b8b2a`); WR-114 closure Manager PR #329 merge `c86464cb0b085130ce2ce126b43c318013aa1bcf`.
REVISIT CONDITION: WR-115 delivers exact-source/public-rights/immutability/re-fetch documentary evidence; Manager accepts/rejects it and separately decides whether any remaining precise provider clarification or alternative owner choice is warranted. No player data, model or inference result is newly established; `RIGHTS_UNVERIFIED / INSUFFICIENT_NEW_CONFIRMATION_DATA` and terminal WR-D016 remain.


---

## DECISION WR-D025

DATE: 2026-09-19
TASK: WR-115 acceptance / WR-116 one-pass no-contact source release-policy and licensor closure
STATUS: ACTIVE — RESEARCH-ONLY / SOURCE ADMISSION BLOCKED
DECISION:
- Accept only the WR-115 documentary research in PR #331 exact final head `9d17a91700f12c3002b64aa63aaf961aa8539d0e`, exactly two authorized WR115 research reports plus R&D handoff, exact-head War Room CI `35485938939` SUCCESS (classify `106012203354`, Governance `106012220340`; product and bootstrap-reuse skipped). Canonical research merge `71a3fb88cc890d7b521fa5674edf4f45a51da045`. WR-115 CLOSED. This acceptance does NOT establish future-source rights, immutable asset identity or long-term persistence, independent lawful re-fetch, real statistical power or confirmation; status `RIGHTS_UNVERIFIED / INSUFFICIENT_NEW_CONFIRMATION_DATA`; option C `UNPROVEN / FAIL CLOSED FOR SOURCE ADMISSION`. WR-D001 FantasyPros ECR current production ranking, WR-D016 historical v2.1 confirmation failure and WR-D019 conditional prospective 2027→2028 chronology remain unchanged.
- Ryan's WR-D022 private/personal War Room use and no-publication declaration stands and must NOT be requested again. WR-D024 provisionally requires **option C: no local raw retention**, conditional on a future legal independently entitled Auditor re-fetching identical immutable, versioned source bytes, and **full independent reference-level reproduction** via legally restricted read-only exact reference plus necessary derived/forecast/target/protocol/evaluation evidence. No automatic fallback to local raw custody A, early-deletion/derived-only B, another provider or weakened claim.
- Authorize **one distinct WR-116 paper-only no-data/no-contact documentary closure** restricted to TWO specific unresolved WR-115 gaps: (1) source-family-specific publisher policy/guarantee for exact immutable version identity, correction/as-of and retained byte availability through the separate future 2027 and 2028 audit windows, beyond generic GitHub capabilities; (2) actual upstream licensor/component provenance and applicable legal rights for Ryan's private internal ML/derived reference custody and an independent Auditor's own lawful exact-byte re-fetch/temporary restricted use, beyond repository CC BY/MIT loader labels. Only narrowly relevant additional official human-readable public policy/legal/attribution documentation; **no source-release or asset listings, release API, real data or additional generic provider survey**. If a gap remains undocumented, R&D must say so and STOP with the precise UNSENT question, not imply future availability or schedule another open-ended public-documentation task.
- A future independently documented, valid applicable public license might suffice without individual contract; no provider contact is presumed necessary. If an exact relevant gap remains after the one-pass WR-116 check, Manager may present Ryan with a **new explicit optional approval for narrowly scoped provider/publisher contact** addressing only that gap, or retain block; WR-116 does NOT authorize outreach, provider account/credentials/terms, source/data download, operational custodian/Auditor appointment, approved derived storage, executable protocol/prediction lock, source/cohort admission, model fitting/scoring, downstream Strategy/Builder/Work Helper, new rankings or Phase 6.
RATIONALE: WR-115 conclusively separated public generic GitHub/licensing affordances from actually proven per-publisher rights and durable byte retrieval. One bounded additional check of actual official publisher/rights-holder **policy text**, without expanding to football data/assets or duplicate surveys, can either close the documentary question or identify the precise information that only a separately authorized provider communication could supply. Future F27/T27/F28/T28 actual release identity, correction closure and lawful auditor access remain future-specific and cannot be presupposed by a paper report.
EVIDENCE: WR-115 reports and final handoff in PR #331, exact-head CI `35485938939`, WR-D022/023/024, prior WR-111–114 accepted paper evidence.
REVISIT CONDITION: Manager independently accepts/rejects WR-116's exact-head two-gap documentary evidence, then separately decides whether any specific unsent publisher/rights-holder clarification should be **put to Ryan for explicit outreach approval**. If exact immutable lawful independent re-fetch is ultimately unavailable, return to Ryan for an explicit new reproduction/retention choice; no implicit A/B.


---

## DECISION WR-D026

DATE: 2026-09-19
TASK: WR-116 documentary findings acceptance / optional two-question external clarification owner approval gate
STATUS: ACTIVE — NO EXTERNAL CONTACT, SOURCE INTAKE OR EMPLOYEE ASSIGNMENT
DECISION:
- Independently accept **only** the narrow source-specific WR-116 documentary research in PR #333 exact head `ce8e3a4fda9cf4aa5bc22d90b518b072f57b5540`, exactly two authorized WR116 reports plus R&D handoff, exact-head War Room CI run `35486552178` SUCCESS (classify `106013892015`, Governance `106013906831`; bootstrap-reuse/product test skipped), canonical research merge `2150a4e7737e5886543a47c35e13ebc42d764227`. WR-116 CLOSED and removed from active-only registry. No actual asset, license grant, model or audit-ready source is accepted.
- **Gap 1: UNRESOLVED / EXTERNAL_CLARIFICATION_REQUIRED.** Publisher-specific public documentation supports quarterly RDS archive redundancy and player-stat release/update/rebuild workflows, not a per-revision immutable original-serialization archive/correction ledger or guaranteed lawful byte-identical independent re-fetch across both future 2027/2028 result-audit/review windows. Neither absence of such a published policy nor quarterly archives proves that persistent exact copies cannot exist. Actual F27/T27/F28/T28 source identities, corrected/as-of versions and availability are FUTURE_ASSET_UNKNOWN.
- **Gap 2: UNRESOLVED / EXTERNAL_CLARIFICATION_REQUIRED.** Publisher-specific pipeline/field provenance and broad dated majority CC BY guidance do not settle version/component-specific upstream licensor authority, Ryan's private internal ML and potentially raw-equivalent keyed derived/forecast/target custody, or a genuinely independent recipient's own lawful temporary exact-source retrieval/reference reproduction and associated retention/disposal restrictions. Valid applicable public licensing might suffice without individual paid agreement, but neither licensed scope nor independent access is presently demonstrated.
- Preserve Ryan's WR-D022 private/personal draft research, eventual private in-War-Room player ranking intent, NOTHING published; do not re-ask purpose. Preserve provisional WR-D024 **option C no local raw-source retention** with **full independent reference-level lawful hash-identical immutable re-fetch plus necessary legally retained keyed derived, sealed prediction, target, protocol/evaluation evidence**. No A/B substitution, altered source, altered evidence claim or inferred license. Keep `RIGHTS_UNVERIFIED / INSUFFICIENT_NEW_CONFIRMATION_DATA`, `OPTION_C_UNPROVEN / NO_SOURCE_ADMISSION`, WR-D001 FantasyPros ECR current ranking authority, WR-D016 historical v2.1 terminal confirmation failure, WR-D019 conditional prospective 2027→2028 standard.
- **Manager next decision: ask Ryan for NEW EXPLICIT OPTIONAL APPROVAL whether to send ONLY the two precise existing UNSENT documentation-only questions recorded in `.ai/research/WR116_PUBLISHER_RELEASE_POLICY_EVIDENCE.md` and `.ai/research/WR116_UPSTREAM_RIGHTS_AUDITOR_DECISION.md` to the appropriate nflverse-data/nflverse-pbp publication-policy steward and actual identified rightsholder/licensor, respectively.** A YES to the questions in this Manager conversation must be evaluated and bounded in a separate Manager action/assignment before any message is sent; a NO/no response means no contact, keep the source/intake gate BLOCKED. Never interpret research acceptance, publishing this decision or opening a communications task as permission to contact a provider.
- **No new executable task while that optional owner approval is outstanding**; do not direct R&D to repeat the generic/public no-contact surveys. Provider contact or account/email/issue submission, acquisition/listing of provider release assets/data/API, credential/terms/payment, source admission, operational custodian or Auditor appointment/access, storage of raw/derived source evidence, executable protocol/prediction lock, model fitting/scoring, any subsequent independent audit and production/ranking changes all require distinct explicit authorization and relevant independent review. A reply/no-reply from a provider is evidence to be separately assessed, not automatic clearance or source intake.
RATIONALE: WR-116 completed the approved one-pass additional official public document check and identified two narrowly unresolved, actionable outside-party evidence questions. External communication is an optional owner decision rather than another internally executable research task. Future as-of snapshots and corrected targets cannot be presumed available or legally persistent.
EVIDENCE: WR-116 source-specific reports and R&D handoff, PR #333 exact-head CI `35486552178`, WR-D022/023/024/025; official public documentation linked by the WR-116 reports.
REVISIT CONDITION: Ryan expressly approves or declines the two bounded documentation-only questions. If permission is granted, Manager separately scopes channel/recipient/text/custody of response, verifies lawful access and creates a task; no provider message or data access is authorized by this decision. If option C ultimately fails, return to Ryan for a new explicit reproducibility/retention choice.


---

## DECISION WR-D027

DATE: 2026-09-19
TASK: Two-track product roadmap upgrade and draft-day baseline/simulator inventory activation
STATUS: ACTIVE — PRODUCT ROADMAP DECISION; NO BULK IMPLEMENTATION AUTHORITY
DECISION:
- Ryan explicitly approved adding the proposed roadmap upgrades. Split the live DRAFT assistant roadmap into **Track A: usable draft-day product** and **Track B: conditional custom player-projection/ranking research**. Track A is independent of the unresolved Track B rights/reproducibility gates; do not delay ordinary existing-product improvements because of custom model research. Track A sequence is reliability + synthetic draft simulation/recovery; independently scoped ECR-based recommendation strategy and explanations; decision-focused desktop/mobile command center; reviewed next-draft-cycle data freshness and league-context compatibility; then optional personalized features and an end-to-end draft-ready release gate. A cross-cutting deterministic synthetic scenario/regression library and provenance/uncertainty transparency are part of those milestones, not an invented second ranking source.
- **Avoid duplicating existing functionality.** README and package scripts already describe a recommendation engine with scarcity/timing, position tiers, saved sessions, post-draft report, ESPN companion, browser/phone/ESPN test coverage, draft invariants, persistence/recovery, failure fixtures and live-mock fixtures. Roadmap milestones are gap-driven upgrades, not assertions that these are absent. First authorize only WR-117 **Builder read-only repo/test scenario coverage inventory**, with two documentary write paths, no implementation or live ESPN. Manager then determines the smallest missing synthetic-fixture implementation or Strategy-owned recommendation contract; later Builder product writes require separate task and fresh independent Auditor.
- Recommendation intelligence MUST preserve WR-D001: FantasyPros expert PPR ECR establishes value; ESPN board/ADP is market timing only. Any proposed VORP/tier/survival/roster-need behavior is reviewed by Draft Strategy before Builder implementation. Explanation and uncertainty are evidence/provenance and stale-input warnings, **not fabricated calibrated statistical confidence**. Existing accepted capabilities are not to be replaced without regression proof.
- Add a dedicated private, synthetic draft-scenario library covering tier cliffs, QB/WR/RB runs, fallers, missing/stale market, manual correction, duplicate/partial/reordered ESPN picks, reconnect and saved session/terminal recovery, phone/desktop visibility. Later draft-ready go/no-go must check authoritative state, manual fallback, appropriate league/ranking input, full relevant regression, accessibility/UX, deployment/rollback and user-controlled live/real-room boundaries; green Governance alone is not live readiness.
- A next-cycle bundled-ranking refresh is distinct from the custom model: must separately check actual source rights/provenance/freshness, identity compatibility and approved dataset import/baseline hash/count before **any** new source or ranking data is admitted. The existing 2026 bundle remains current authority until separate approval. No automatic new season data pull or source substitution.
- **Track B remains PAUSED/FAIL-CLOSED:** WR-116 PR #333 accepted; WR-D026 `RIGHTS_UNVERIFIED / INSUFFICIENT_NEW_CONFIRMATION_DATA`, `OPTION_C_UNPROVEN / NO_SOURCE_ADMISSION`; WR-D016 v2.1 historical confirmation failure final; conditional WR-D019 prospective 2027 validation and separate 2028 confirmation not automatically scheduled or approved. Even after independently audited statistical PASS, a distinct *offline draft-decision utility* comparison versus ECR and Draft Strategy/product policy gate would be needed before any production rank influence.
- **Explicit user no-contact decision supersedes WR-D026's previous optional outreach request for current routing:** Ryan instructed **'No don't send an email'**, and no provider contact via email, GitHub issue, form or other channel is authorized. Previous broad statement was not permission to override this later specific direction. Do not search for recipient/email for outreach, create drafts, send messages or activate provider-contact tasks. Source rights/re-fetch gaps remain unresolved; a *new* explicit owner decision is required to revisit contact. No A/B fallback or weakened audit without Ryan's independent choice.
- Manager's roadmap approval is NOT blanket authorization to implement all proposed features, call provider APIs, query user ESPN account, fetch protected/2026 player statistics, run custom scoring or promote new rankings. Future Strategy contracts, Builder implementation, independent audit, season-data admission and deployment each need bounded tasks, exact-head CI and Manager gates.
RATIONALE: The live repository already includes parts of the proposed reliability, recommendation and UX concepts, and a stalled custom-model rights task should not block safe product improvement. A read-only coverage inventory makes later work exact and efficient while preserving independent role separation and legal/source safeguards.
EVIDENCE: Ryan's current 'make all these changes' request after the proposed roadmap, immediate prior no-contact direction, README and package.json named test scripts, accepted WR-109 draft-cycle readiness paper and WR-D001/D016/D018/D019/D022/D024/D026.
NEXT GATE: WR-117 read-only Builder inventory of current synthetic scenario and recovery coverage, followed by Manager assessment and a **separate** narrowly scoped Strategy or Builder implementation task as the evidence warrants. No other employee or external provider work is authorized by this decision.


---

## DECISION WR-D028

DATE: 2026-09-19
TASK: WR-117 Manager acceptance / WR-118 bounded synthetic mechanical replay-reconnect regression
STATUS: ACTIVE — TEST-ONLY BUILD / FRESH INDEPENDENT AUDIT REQUIRED
DECISION:
- Accept WR-117's **static test/source coverage inventory only**: PR #336 exact final Builder head `f5cb69949e607cac26a3d98581476622b4f388a1`, exactly `.ai/builder/WR117_DRAFT_DAY_RELIABILITY_SIMULATOR_INVENTORY.md` plus `.ai/builder/HANDOFF.md`, exact-head PR War Room CI `35487841723` SUCCESS (classify `106017372184`, Governance `106017395879`; product skipped). Canonical research/inventory merge `44ac8b88c4949465fcbcd7124e4b7119124e36e4`; main push War Room CI `35487910154` SUCCESS (classify/Governance, product skipped). WR-117 CLOSED. The inventory's VERIFIED_BY_TEST classification means checked-in assertions exist, **not** that WR-117 executed them, proved present-head runtime PASS or verified live ESPN/physical-device operation.
- WR-117 documented substantial existing full-draft invariant, stale/duplicate/correction, off-board, browser/recovery/backup, separate-session, companion-parser and phone fixtures. Do **not** build a second simulator app or reimplement existing features. The bounded gap is a *single compositional app-side deterministic replay/reconnect regression* spanning accepted numbered synthetic slice, duplicate/permutation and stale/partial message sequence, rule-consistent correction, two saved sessions, controlled reload/synthetic reconnect, terminal completion/reload. Absence of this integrated test is NOT proof of a production defect or a provider-side reliability guarantee.
- Approve **WR-118** as the sole next **Builder test-only** task with exact allowed scripts `scripts/test-wr-118-espn-replay-reconnect.mjs`, `package.json` test registration, Builder evidence report and Builder handoff. Reuse accepted fixture interfaces and current production behavior, record all real test outcomes and deterministic diffs; no production `js/` or companion `extensions/` patch, workflow/runner/UI change, real ESPN, source acquisition, 2026 outcomes, ranking data or ranking-policy change. Fail closed to Manager with fixture evidence if an existing invariant actually fails or the permitted harness cannot support the scenario; do NOT self-authorize a production fix.
- Require exact Builder candidate head, scoped full suite and applicable CI, **new fresh Independent Auditor task/branch/PR** before Manager merge of test-harness code, followed by exact canonical-main full CI canary. Builder may not self-audit or merge. A CI green run is not a substitute for independent scenario oracle and state-ownership review.
- **No separate Draft Strategy task is needed to assert existing mechanical draft-state invariants in WR-118.** A distinct Draft Strategy contract IS REQUIRED before any new expected recommendation winner, changed threshold/weight or QB/WR/RB positional-run, high-ECR faller, value-vs-need, scarcity-vs-survival policy oracle is implemented. Strategy work is staged as separate later Track A2, not a blocker to mechanical WR-118. Test may preserve baseline ECR-vs-market split, roster/available eligibility and observed current behavior without defining new normative outcomes.
- Preserve WR-D001 FantasyPros PPR ECR player-value authority; ESPN market/ADP timing signal only, WR-D018 Board/Pick History fallback-first and `LIVE_DIRECT_UNVERIFIED`; WR-D027 two-track roadmap; custom-model `RIGHTS_UNVERIFIED / INSUFFICIENT_NEW_CONFIRMATION_DATA`, `OPTION_C_UNPROVEN / NO_SOURCE_ADMISSION`, WR-D016 terminal v2.1 failed confirmation and WR-D019 conditional 2027→2028. Ryan explicitly rejected provider email/contact; **no email, draft, GitHub issue, webform or alternate outreach**, source/asset API or data access is authorized. No implicit A/B or auditor/source admission.
RATIONALE: Static inventory supports a single small regression proving interaction of already implemented reliability surfaces; separating mechanics from recommendation policy avoids needless Strategy serialization, product overbuild and unreviewed scoring changes.
EVIDENCE: WR-117 inventory/handoff, PR #336 exact **two-file** diff and CI `35487841723`, canonical merge `44ac8b88c4949465fcbcd7124e4b7119124e36e4`, main push CI `35487910154`, WR-D001/018/027 and `package.json` existing suites.
NEXT GATE: WR-118 Builder test-only PR with exact four-file diff and full applicable test evidence; Manager freezes candidate and separately assigns fresh independent Auditor. Recommendation-policy scenarios go to Draft Strategy only in a distinct later task. No other employee activated now.


---

## DECISION WR-D029

DATE: 2026-09-20
TASK: WR-118 frozen exact test target / WR-119 fresh independent QA activation
STATUS: ACTIVE — AUDIT OF IMMUTABLE UNMERGED TEST-ONLY TARGET; NO PRODUCTION OR MERGE AUTHORITY
DECISION:
- Independently verify canonical main `5dc8906d5285d1c51b51ef0068bd0a98753610ba` and existing OPEN/UNMERGED WR-118 Builder PR #338, branch `wr-118-synthetic-espn-replay-reconnect-regression`, historical base `5dc8906d5285d1c51b51ef0068bd0a98753610ba` and **freeze exactly `39491e672b6177834aa029b7a716c612c7cc892d`**. Live GitHub PR diff contains precisely `scripts/test-wr-118-espn-replay-reconnect.mjs`, `package.json` test-command registration, `.ai/builder/WR118_SYNTHETIC_REPLAY_RECONNECT_EVIDENCE.md` and `.ai/builder/HANDOFF.md`; no production app, Companion, source data, rankings, workflow or runner code changed.
- Exact-head PR War Room CI `35488672532` completed SUCCESS: classify job `106019608130`, Governance `106019627767`, full test `106019654656`; bootstrap reuse SKIPPED. Full test log establishes `npm test` and existing extension/off-board/draft-invariant/persistence-recovery/recovery-failure suites, plus `node --check` and two fixed-seed WR-118 app-side browser iterations with equal actual source, saved A and isolated B ledger SHA-256 digests and zero reported browser page errors. This establishes **audit readiness**, not independent correctness, live ESPN/Companion connectivity or draft-ready release. No local-terminal run was represented as having occurred.
- Preserve **PR #338 OPEN/UNMERGED** at that immutable Builder head and set WR-118 to `AUDIT_READY`; Builder must not advance it while an independent audit is pending. Any subsequent target movement, defect or proposed remediation must stop current gate and require new Manager exact-head freeze and fresh review; do not silently follow current branch tip.
- Authorize ONE distinct **WR-119 Independent Auditor / QA** task on a separate branch from verified post-activation main, `wr-119-synthetic-replay-reconnect-independent-audit`, to challenge this exact Builder test/fixture, oracle and authority rather than accept green CI or Builder claims. Auditor independently verifies PR/diff and exact-head CI, tests whether the synthetic fixture actually detects stale/partial/permuted/duplicate input, correction, A/B session isolation and terminal status; checks source/ownership/ECR integrity, deterministic source/ledger hashes and truthful app-only scope. Auditor's scope is two report/handoff paths under `.ai/auditor/`, plus one OPEN/UNMERGED evidence-only PR and exact-head Governance CI; no Builder target, app/Companion, dataset or ranking edits.
- Only after WR-119 publishes a fresh independent PASS-family verdict and Manager checks the exact audited Builder SHA may Manager separately integrate audit evidence and PR #338, then require exact canonical-main **FULL** CI canary before WR-118 closure. A FAIL requires independently reviewed bounded remediation and fresh exact-head re-audit. No other employee is activated; no production behavior, release/deployment, real ESPN Direct, provider email/contact, source intake, custom model or ranking-policy change is authorized.
RATIONALE: WR-117 isolated the missing combined mechanical fixture; WR-118's four-path test-only candidate is self-validated through exact-head full CI. Independent adversarial test-oracle review remains mandatory and must not be replaced by Manager reading results or trusting identical hashes.
EVIDENCE: PR #338 exact head/diff, Builder evidence and handoff, exact-head CI `35488672532` with full test job `106019654656`; WR-D001/018/027/028; accepted canonical Workflow V3.5.
NEXT GATE: WR-119 Auditor publishes evidence-only two-file PR, exact audit head, actual CI and one PASS-family or FAIL verdict for Builder target `39491e672b6177834aa029b7a716c612c7cc892d`. Manager acts on that separately. Builder PR #338 remains open pending the review.


---

## DECISION WR-D030

DATE: 2026-09-20
TASK: Accept WR-119 independent FAIL and authorize bounded in-place WR-118 test-oracle remediation
STATUS: ACTIVE — TEST-ONLY REMEDIATION; WR-119 HISTORICAL FAIL; NEW FRESH RE-AUDIT REQUIRED
DECISION:
- Independently review the published WR-119 audit PR #340 and exact Auditor head `4e1432e306ade195816d685c5b3065e8a4be99c8`, two Auditor-only files, exact-head War Room CI `35489592441` SUCCESS (classify `106022114430`, Governance `106022130974`; full product test skipped). Audit report independently inspected the frozen Builder PR #338 historical SHA `39491e672b6177834aa029b7a716c612c7cc892d`; Builder's own full CI `35488672532` SUCCESS is not an independent oracle verdict. PR #338 and PR #340 remain OPEN/UNMERGED. Accept the independent **FAIL — REMEDIATION REQUIRED** for the historical frozen Builder SHA. CLOSE WR-119 in the active registry while preserving its unmerged published audit PR as historical evidence; no audit merge or historical-verdict conversion is implied.
- **WR-119-F01 — MEDIUM / BLOCKING — ACCEPT.** Manager independently verified that fixture `inspect()` computes `debug.scored.slice(0,12)` or `[]` and retains only `invalidCandidates`, while `assertState()` merely checks `invalidCandidates === 0`; an active draft with no candidates passes vacuously. It reads `state.myNextPick` but does not assert independent expected next lawful user pick or on-clock at nonterminal stale/partial/reconnect/session stages; only terminal null is checked. Existing app test output thus cannot prove these *claimed integrated mechanical eligibility and next-turn properties*. This is a test-oracle deficiency, not evidence that production code is defective.
- **WR-119-F02 — LOW / NON-BLOCKING ALONE — ACCEPT and bundle narrowly.** Fixture `apply()` passes `null, []` to `check()` for false app result/reconciliation-counter mismatch, yielding null session and equal empty expected/actual hashes even if actual in-app ledger differs. The original stated failure-evidence contract demands meaningful actual/expected state, safe session/stage/pick/order and first mismatch; repair in same test-only touch. No basis to claim actual application or sensitive-data leakage.
- **REAUTHORIZE WR-118 Builder remediation on its ORIGINAL branch and OPEN PR #338, from historically failed SHA `39491e672b6177834aa029b7a716c612c7cc892d`, with no replacement Builder task/PR.** Make WR-118 `ASSIGNED` again, retaining original four-file cumulative PR scope, but restrict new changes to `scripts/test-wr-118-espn-replay-reconnect.mjs`, `.ai/builder/WR118_SYNTHETIC_REPLAY_RECONNECT_EVIDENCE.md`, `.ai/builder/HANDOFF.md`; **DO NOT MODIFY `package.json`** (already correctly registered). No changes to production `js/`, Companion `extensions/`, datasets/ECR/ADP, model/scoring/recommendation weights or policy, ESPN API/live room, provider outreach, workflow/runner/deployment.
- **F01 closure:** assert non-vacuous genuinely available roster-eligible actual recommendation/decision candidates in selected *legitimately active* stages using the existing app; do not require such candidates for complete/finished rosters. Compute expected next lawful user snake pick and on-clock independently from fixed league config and accepted numbered ledger, and test active A/B stale/partial/reload/reconnect/correction stages and meaningful full-roster/provisional/terminal cases, respecting already accepted current-turn semantics. Add actually executed bounded ephemeral negative controls showing that empty candidates or invalid nonterminal next-pick/on-clock cause fixture failure. Do not invent a player winner, manual-vs-ESPN precedence, calibration, score or ranking authority.
- **F02 closure:** upon false app response or reconciliation-counter mismatch, inspect actual app snapshot safely if available, use the actual synthetic session/stage/pick/input order and intended fixture-ledger as expected model, and emit distinct real expected/actual digests/first mismatch and limited safe source/ownership evidence. If the actual observation itself fails, log explicit observation failure rather than fabricated equal empty digests. Avoid logging player-source rows, user identifiers, cookies, credentials or ESPN URLs. Demonstrate the negative diagnostic path if feasible.
- **Next gate:** Builder publishes a genuinely NEW immutable repaired head on existing PR #338 and actual syntax, named repeated regression, relevant existing suites and **exact-new-head FULL War Room CI**. Builder cannot self-audit/merge. Manager independently inspects repaired exact diff and CI, then freezes the new SHA and separately authorizes **fresh WR-120 Independent Auditor / QA** on a distinct branch/task/report/PR. WR-119's earlier FAIL remains bound only to old SHA; WR-119 Auditor does not automatically become WR-120. Even a repaired green CI and new PASS verdict are not automatic merge or deployment; later Manager must separately decide audit-evidence and Builder integration plus canonical-main full CI canary.
- **No other employee activation** during this remediation gate. Ryan's later specific no-provider-contact decision supersedes earlier broad consent: no email, drafts, GitHub issue, form or alternate outreach. WR-D001 FantasyPros PPR ECR value/ESPN market timing, WR-D018 fallback-first and `LIVE_DIRECT_UNVERIFIED`, paused Track B `RIGHTS_UNVERIFIED / OPTION_C_UNPROVEN / NO_SOURCE_ADMISSION`, WR-D016 historical v2.1 failed confirmation and WR-D019 conditional future 2027→2028 are unchanged.
RATIONALE: Correct a demonstrable test oracle and low-severity diagnostic flaw without assuming a production bug or widening scope. The new repaired head must receive a truly independent re-audit, rather than grandfathering a historical FAIL because CI remains green.
EVIDENCE: Auditor PR #340 exact two-file report/handoff, `35489592441` exact-head Governance CI, WR-118 frozen PR #338 source lines 91–205 and active/terminal assertions, Builder exact-head FULL CI `35488672532`, WR-D028/029 and Workflow V3.5.
NEXT GATE: existing WR-118 Builder returns the narrowly repaired test-only PR #338 with new immutable SHA, actual tests, cumulative four-file diff and new full CI; Manager then independently freezes repaired head and creates distinct WR-120 fresh QA assignment. Preserve both PRs open/unmerged.


---

## DECISION WR-D031

DATE: 2026-09-20
TASK: WR-118 repaired exact-head Builder freeze / distinct WR-120 fresh Independent Re-Audit activation
STATUS: ACTIVE — TEST-ONLY REPAIRED TARGET AUDIT-READY; NO BUILDER MERGE OR PRODUCTION AUTHORITY
DECISION:
- Manager independently reviewed the existing Builder PR #338, OPEN/UNMERGED, at its **new exact repaired head `c80aaa8807ed9ef94619b1117988e64d9b773234`**, existing branch `wr-118-synthetic-espn-replay-reconnect-regression`, original Builder creation/PR base `5dc8906d5285d1c51b51ef0068bd0a98753610ba`, versus canonical main `4188657af731fe7f2e32c8bbdbb0f348b7b5e053`. Do NOT rewrite the historical creation baseline or interpret current main as the original Builder base. Freeze precisely `c80aaa8807ed9ef94619b1117988e64d9b773234`; prevent Builder head movement during WR-120. Original failed WR-119 target `39491e672b6177834aa029b7a716c612c7cc892d` remains historical FAIL with Auditor PR #340 OPEN/UNMERGED; do not transfer the old negative verdict or its Auditor role to a changed head.
- Exact cumulative PR #338 diff contains ONLY `scripts/test-wr-118-espn-replay-reconnect.mjs`, `package.json` (original named test registration), `.ai/builder/WR118_SYNTHETIC_REPLAY_RECONNECT_EVIDENCE.md` and `.ai/builder/HANDOFF.md`. Independently compared old failed head → new repaired head: ONLY the synthetic test and two Builder report/handoff paths changed; **package.json did not move in remediation**. No production JS/Companion, source data/IDs, ranking policy/weights, model, workflow/runner, UI or deployment edits.
- New **exact-final-repaired-head War Room CI `35491052010` completed SUCCESS**: classify `106025927564`, Governance `106025949438`, full product test `106025970045`, bootstrap-reuse skipped. Independently read full-job logs: `npm test` with existing extension, off-board, draft-invariant, persistence/recovery/recovery-failure suites, syntax-checked `test:wr118-espn-replay-reconnect`, and two fixed-seed fresh-browser scenario runs with matching source/A/B ledger digests and no browser page errors. Four **actually executed test-only negative controls per iteration (8/8)** detect empty active recommendation-candidate set, wrong nonterminal user next pick, wrong on-clock and mismatched reconciliation counters. F02 control logs a real synthetic session, distinct expected 11-pick / actual 12-pick ledger digests and first differing #12 pick, with observationError null. Prior intermediate failed CI runs `35490108994` and `35490407352` were reported as corrected test-harness errors; do not conceal them or mistake successful later test for proof of independent correctness.
- Accept a **Manager audit-readiness freeze only**, NOT independently established F01/F02 closure or a performance/release verdict. The new oracle visibly asserts non-vacuous existing actual candidates and decision/board eligibility at active stages, independently derives expected snake next-pick/on-clock from accepted count and tests through A/B/stale/partial/reload/provisional/terminal checkpoints, and carries observed-state failure diagnostics. A fresh Auditor must challenge whether formulas match existing accepted app semantics, whether non-vacuous decision path and negative controls are independent/effective, whether the real app can still misbehave without detection, and whether F02 failure diagnostics are truly sound.
- Set WR-118 `AUDIT_READY` at repaired `c80aaa8807ed9ef94619b1117988e64d9b773234`; assign **WR-120 — Fresh Independent Re-Audit of Repaired WR-118 Synthetic Replay + Reconnect Regression** as sole actionable worker on independent branch `wr-120-repaired-synthetic-replay-reconnect-reaudit`, created ONLY at exact verified canonical main after this Manager control-plane PR merges and its post-merge main CI passes. Registry pins `audit_target_task=WR-118`, `audit_target_pr=338`, `audit_target_branch=wr-118-synthetic-espn-replay-reconnect-regression`, `audit_target_sha=c80aaa8807ed9ef94619b1117988e64d9b773234`. Auditor writes exactly two `.ai/auditor/` evidence/handoff files, one separate OPEN/UNMERGED Auditor-only PR, applicable exact-head Governance CI and exactly one PASS-family/FAIL verdict. Do not re-use WR-119's old audit branch, report or PR as the repaired-head audit.
- Preserve **both Builder PR #338 and historical Auditor PR #340 OPEN/UNMERGED**. Do not merge either as part of this freeze/activation. Only after published fresh independent WR-120 PASS-family and separate Manager verification of the exact audited target may Manager consider audit evidence integration and Builder PR merge, then mandatory exact canonical-main **FULL** CI canary before WR-118 closure. A fresh FAIL/Builder movement returns to bounded Manager remediation and another fresh audit; no automatic progression.
- The scope is **synthetic app-side numbered ESPN-like snapshot ingress and controlled local browser reload/replay only**, not Companion-to-app E2E, a real network reconnect, live ESPN Board/Pick History/structured Direct or physical phone/release proof. WR-D001 FantasyPros PPR ECR player-value vs ESPN market timing; WR-D018 fallback-first and `LIVE_DIRECT_UNVERIFIED`; WR-D027 no email/GitHub issue/webform/provider contact; custom model `RIGHTS_UNVERIFIED / INSUFFICIENT_NEW_CONFIRMATION_DATA`, `OPTION_C_UNPROVEN / NO_SOURCE_ADMISSION`, historical WR-D016 failed v2.1 confirmation and conditional WR-D019 2027→2028 standard are unchanged. No data/source intake, user account, actual football outcomes, protected model/scoring/ranking, production change, deployment, Strategy/R&D/Work Helper activation is authorized.
RATIONALE: WR-D030 authorized exact in-place test-only closure of WR-119-F01/F02, and the new head has a scoped self-validated implementation and full CI. Independent audit of the NEW exact head is still mandatory before any integration.
EVIDENCE: PR #338 repaired `c80aaa8807ed9ef94619b1117988e64d9b773234` cumulative/repaired-only diffs; full exact-head CI `35491052010`, test job `106025970045` observed named scenarios and negative controls; WR-119 historical report PR #340 `4e1432e306ade195816d685c5b3065e8a4be99c8`; WR-D028–030.
NEXT GATE: WR-120 independent Auditor publishes a distinct exact repaired-head verdict, two-file Auditor-only PR and exact-head CI. Manager independently reviews that evidence and exact live Builder head before any separately authorized merge. No other employee assigned.


---

## DECISION WR-D032

DATE: 2026-09-20
TASK: Accept WR-120 independent PASS, integrate exact WR-118 test-only target, verify mandatory canonical-main FULL CI, close WR-118/WR-120
STATUS: ACCEPTED / INTEGRATED / CLOSED — SYNTHETIC APP-SIDE COVERAGE ONLY
DECISION:
- Manager independently reviewed fresh WR-120 PASS (no findings) on repaired Builder SHA `c80aaa8807ed9ef94619b1117988e64d9b773234`, Auditor PR #343 immutable head `c9629ed0a07d599e5a587ad231a5795ffae653c3`, exact two Auditor-only files and exact-head CI `35510720079` SUCCESS (Governance passed, product skipped for documentation). Historical WR-119 FAIL stays bound to old Builder SHA `39491e672b6177834aa029b7a716c612c7cc892d`; historical Auditor PR #340 remains OPEN/UNMERGED as negative historical evidence.
- Manager merged Auditor evidence PR #343 FIRST at `34d852e5fea021548c76d0ff803113097eabeff4` and verified canonical-main push CI `35510971264` SUCCESS. Then merged ONLY the unchanged independently audited repaired Builder PR #338 target `c80aaa8807ed9ef94619b1117988e64d9b773234` at canonical merge `396462a0649a6bb6f1e0b212f7bfda700759ba6c`. Cumulative Builder PR changes: one synthetic app-side test, package.json test registration and two Builder evidence/handoff docs. No production JS, Companion, dataset, player ranking, model, recommendation policy, workflow/runner, UI or deployment changes.
- Mandatory post-Builder-merge canonical-main FULL War Room CI canary `35511010222` COMPLETED SUCCESS on exact `396462a0649a6bb6f1e0b212f7bfda700759ba6c`: classify `106078806709`, Governance `106078821853`, FULL test `106078842642` SUCCESS; bootstrap reuse skipped. Independently read full npm-test log: the new named WR-118 fixture and existing suites ran; two fixed-seed synthetic browser scenarios had identical source/A/B ledger digests, zero reported page errors and eight correctly rejected negative controls. Dynamic CI `35511009710` SUCCESS was additional evidence and not substituted for the required FULL push canary.
- CLOSE WR-118 and WR-120 and remove them from the active-only registry. Their completion proves bounded SYNTHETIC APP-SIDE ESPN-like snapshot ingress, local reload/replay regression coverage only—not live ESPN connectivity, real network reconnect, Companion-to-app E2E, independently verified structured Direct, physical-phone readiness or a draft-ready release. Preserve WR-D001 FantasyPros ECR value/ESPN market timing, WR-D018 fallback-first/LIVE_DIRECT_UNVERIFIED, WR-D027 user no-provider-contact direction, and paused custom-ranking `RIGHTS_UNVERIFIED / OPTION_C_UNPROVEN / NO_SOURCE_ADMISSION`. No new worker activation, source, model scoring, rank policy change or deployment is authorized.
EVIDENCE: Auditor PR #343 head `c9629ed0a07d599e5a587ad231a5795ffae653c3` and CI `35510720079`; accepted audit merge `34d852e5fea021548c76d0ff803113097eabeff4`, push CI `35510971264`; Builder PR #338 repaired head `c80aaa8807ed9ef94619b1117988e64d9b773234`, canonical merge `396462a0649a6bb6f1e0b212f7bfda700759ba6c`, FULL main canary `35511010222` and test job `106078842642`.
NEXT GATE: Manager scopes a distinct next Track A assignment only after reviewing live roadmap/gaps; no employees assigned by this closure. Track B remains blocked without source admission or provider contact.
