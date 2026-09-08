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
