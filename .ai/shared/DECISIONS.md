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
