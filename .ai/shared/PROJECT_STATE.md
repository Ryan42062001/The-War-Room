# War Room Project State

Status: ACTIVE DEVELOPMENT — WORKFLOW V3.3 CANONICAL / WR-081 HISTORICAL MODEL SCORING + WR-074 RUNNER PILOT IN PARALLEL
Last verified: 2026-09-17
Owner: Manager / Architect
Workflow: V3.3 CANONICAL

## Workflow foundation

Workflow V3.3 remains canonical. Exact-head freezes, independent audit, Manager merge authority, live-state verification, custody/source controls, fail-closed behavior, post-merge canaries, and lane/write-scope collision safety remain mandatory.

## Returning-Player v2

Accepted source/cohort authority remains unchanged: source snapshot `wr-returning-player-v2-source-snapshot/1.2.0-wr059` / `6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea`; cohort `returning-player-v2-cohort/1.2.0-wr059` / `f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4`; 5,176 unique keys; zero duplicates; 14 admitted stats sources; zero admitted Players metadata; one metadata source failed closed; `draft_picks.csv` excluded; exactly 28 stats-only predictors.

WR-077 independently audited exact WR-072 remediation head `a228d0002545a701aea8c7bead5de0bf36994764` and returned `PASS` with no findings. Auditor PR #225 / immutable head `45ba066743d25ec43ede049d93c42d8d04dddbfa` changed only `.ai/auditor/**`; exact audit-head War Room CI `35169095669` was SUCCESS. Audit evidence merged at `7064237704018d7a842090c2ac0e1d3da9ca64cd` with canonical-main CI `35169235188` SUCCESS.

Manager then integrated only the exact audited WR-072 target through PR #207 as canonical-main merge `124ebddff321608935d94af51006846eada7a304`. Canonical-main War Room CI `35169273680` completed SUCCESS. WR-072 and WR-077 are CLOSED historical accepted lanes.

Accepted pre-score authority is therefore:
- protocol `returning-player-v2-model-protocol/1.2.0-wr072`;
- result gates `returning-player-v2-result-gates/1.2.0-wr072`;
- machine-lock SHA-256 `aed044e6b7df9684153181a7a97a47a86c50ce9049db063ecdd8a973b1a832b6`;
- bootstrap fixture `returning-player-v2-bootstrap-conformance-fixture/1.0.0-wr072` / SHA-256 `3fb3c2088e17f42ad588a94f018abbcbd42cefeb46422a0bcb1da50b31cba3f7`.

WR-081 is now the separately authorized historical model scoring/evaluation lane. It may execute only the frozen WR-072 protocol against the accepted retained historical source/cohort evidence, including the protocol-defined historical target joins and staged development/validation/confirmation evaluation. It may not use 2026 regular-season outcomes, reacquire/refresh/substitute sources, mutate providers, change feature/model/gate semantics, change production rankings, perform season-total composition, or begin Phase 6.

WR-082 remains BLOCKED until Manager freezes one immutable WR-081 result target, then independently audits the model-result evidence.

## Self-hosted CI lane

WR-074 remains `IN_PROGRESS` and independent at observed checkpoint `7b4641499c50541abf523267eb4c0255813e8b6d`. WR-075 remains `BLOCKED` pending one evidence-complete Manager-frozen WR-074 target.

## Next gates

1. WR-081 executes the accepted WR-072 historical protocol exactly and publishes one immutable result/evidence target.
2. WR-074 continues independently toward one immutable evidence-complete runner-pilot target.
3. Manager independently verifies whichever lane finishes next before any audit activation or merge.
