# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-039
Role: R&D
Status: COMPLETE — AUDIT REQUIRED
Starting main SHA: `6bc66fa6c779e558940ca6cc3f267441def62595`
Final PR/head: recorded on the task PR after publication; audit the immutable head named there
Execution mode used: Work Mode, Full Refresh
Human-readable contract path: `.ai/research/RETURNING_PLAYER_V2_EVIDENCE_CONTRACT.md`
Machine-readable lock path/hash: `.ai/research/generated/RETURNING_PLAYER_V2_EVIDENCE_CONTRACT.json`; SHA-256 `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`
Source inventory complete: YES — three admissible source classes are specified; exact per-asset instances must be acquired and frozen only in a later no-scoring custody checkpoint after WR-040
Rights/retention matrix: `.ai/research/RETURNING_PLAYER_V2_SOURCE_RIGHTS_RETENTION.md`; SHA-256 `41b5193565ab94a271be729598c7060bbca2788030a7f5271bf97232cc464ac5`
Raw-byte retention policy: project-controlled content-addressed immutable primary plus independent backup where rights permit; at least model life plus seven years; mutable URLs and expiring CI artifacts are never authority
Full-row keyed feature/prediction retention policy: mandatory for every considered row, including zero-game, excluded, target-unavailable, and fallback rows; aggregate metric equality is insufficient
Stable key: canonical no-whitespace UTF-8 JSON array `(target_season, player_id_namespace, player_id, position, cohort_version)`; duplicates fail closed
Environment/code/version lock: future audited locks must bind source/cohort/feature/target/preprocessing/model/split/seed/environment/code/command/sentinel/artifact identities before scoring
Prospective chronology frozen: WR-039 contract -> WR-040 audit -> no-scoring exact source custody -> custody audit -> model-protocol freeze -> later scoring -> result audit -> later composition -> composition audit before Phase 6
WR-033 reuse/re-version disposition: documented candidate structure and feature ideas may be re-versioned; v1 inputs, fitted state, predictions, and replay identity may not be claimed
WR-034 reuse/re-version disposition: may remain a separately named `availability_v1_wr034` dependency only when its accepted exact artifacts/hashes are bound and independently available; any refit is new
2026 outcomes inspected: NO
Model scoring performed: NO
Production changed: NO
WR-021/WR-023 changed: NO
Phase-6 work performed: NO
Blocking issues: none for contract audit; no source class is score-ready until a later exact custody checkpoint passes independent audit
Recommended next role: Independent Auditor / QA
Exact next action: execute WR-040 against the exact immutable task-PR head; a PASS authorizes only a Manager decision on the no-scoring source-custody checkpoint
Checkpoint / SHA: exact final branch SHA and exact-head CI disposition are recorded in the PR because recording them in this committed file would move the audited head

## Evidence summary

- Human contract SHA-256: `0606d11bf227b36412e7fd14f2c0272a6aac119895187870675a9df023efb5b7`.
- Machine lock sidecar: `.ai/research/generated/RETURNING_PLAYER_V2_EVIDENCE_CONTRACT.sha256`.
- Frozen sentinel identities were verified without modification:
  - WR-021 snapshot: `9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d`;
  - WR-023 protocol: `f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c`;
  - WR-023 manifest: `98db25bab2d65ce2a8573e3fdd595c2fd21a13c71cca354467f012030a0481fa`.
- Rights evidence was reviewed from the official nflverse-data license/description, nflverse Players producer documentation, and nflreadr's upstream-rights caveat. The classifications are deliberately conservative and require per-instance acceptance before use.
- WR-D007 remains controlling: WR-035/WR-037 are historical evidence only and Returning-Player v2 is explicitly non-equivalent to v1.
