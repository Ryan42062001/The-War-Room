# Draft Strategy & Decision Intelligence — compact handoff

STATUS: MANAGER_REVIEW_READY CANDIDATE / DOCUMENTATION ONLY / NO POLICY OR PRODUCT CHANGE
TASK: WR-121 — ECR-Based Recommendation & Explanation Strategy Contract
ROLE: Draft Strategy & Decision Intelligence Analyst
REPOSITORY: Ryan42062001/The-War-Room (LIVE DRAFT assistant)
WORKFLOW: V3.5
MODE / REFRESH: STANDARD_CHAT_HIGH / FAST_REFRESH
BASE: 15b6ecb4ff38bda3b62fed0fab97625c6b054c47; canonical main and assigned branch were equal at activation.
BRANCH: wr-121-ecr-draft-recommendation-explanation-contract
PR: #346 — https://github.com/Ryan42062001/The-War-Room/pull/346 — OPEN / UNMERGED; final exact HEAD is the commit publishing this handoff and must be taken from the immutable PR head (cannot self-embed its own SHA).
DONE: Source-aware existing-state and gaps matrix; accepted decision precedence; 18 distinct synthetic scenarios with explicit assumptions, wrong outcomes and future assertions; explanation/provenance/uncalibrated-confidence contract; one smallest proposed downstream task.
CHANGED: Exactly .ai/strategy/WR121_ECR_RECOMMENDATION_EXPLANATION_CONTRACT.md and .ai/strategy/HANDOFF.md. No js/, tests, datasets, workflow, deployment, ESPN account or provider contact.
ALREADY PRESENT: FantasyPros PPR ECR value vs ESPN market timing/fallback; eligible/taken/mine candidate pool; roster/FLEX; rank-distance VORP/replacement, local scarcity, tiers/cliff, position runs, phase and QB/TE context, snake-next-pick and adjacent-turn packages, actions, expanded explanations, heuristic labels and draft-complete UI.
EVIDENCE-BACKED GAP: Compact js/war-room-rankings.js displays heuristic confidenceScore as N% and unknown-market neutral survival=50 as 50% survival; source/freshness caveats are weaker than existing expanded market provenance and separate refresh metadata. No statistical calibration is established by read-only inspection.
DECISIONS CONSUMED: WR-D001 ECR remains value authority and ESPN board/ADP timing only; WR-D018 fallback-first with structured Direct LIVE_DIRECT_UNVERIFIED; WR-D027 gap-driven Track A/no provider contact; WR-D032 synthetic app-side regression only; WR-D033 WR-121 docs-only. Track B remains PAUSED / RIGHTS_UNVERIFIED / OPTION_C_UNPROVEN / NO_SOURCE_ADMISSION.
PROPOSALS NOT APPROVED / NOT IMPLEMENTED: Present heuristic decision strength categorically rather than as percentage; for missing market show UNKNOWN not 50% chance; distinguish valid adjacent no-opponent turn from opponent-window market heuristics; carry honest source/freshness caveats using already present metadata. Do not alter rankings, weights, player winners, score/actions or syncing. Changes to stale-market player selection, unresolved-pick action gating, unsupported league behavior or tie-winner require separate Manager policy decision.
TESTS: Newly run by Strategy — NONE; reviewed relevant committed code/test assertions only (DOCUMENTED_OR_ASSERTED_NOT_RUNTIME_VERIFIED). Historic WR-D032 full CI does not establish this contract's future synthetic player winners or live ESPN/Companion E2E.
CI: Exact-final-head Governance CI to be verified after this handoff commit; authoritative final SHA, workflow run ID/conclusion and two-file diff will be recorded in PR #346 metadata and the Manager-facing completion reply. Product test should be skipped for documentation-only changes.
BLOCKERS: None to Manager review of the paper contract. Future policy implementation, player winner, statistical calibration, provider/source intake, real ESPN E2E and release remain unauthorized/unverified.
NEXT ACTION: Manager independently reviews the exact two-file PR and decides whether to commission ONE bounded Builder recommendation-presentation truthfulness correction (likely js/war-room-rankings.js and focused existing browser/explanation tests, js/war-room-recommendations.js wording only if strictly needed). Fresh independent QA and canonical-main FULL CI canary are later gates if product code is authorized; Strategy does not activate them.
FILES / ARTIFACTS THAT MATTER: .ai/strategy/WR121_ECR_RECOMMENDATION_EXPLANATION_CONTRACT.md (all detail and 18 cases); .ai/shared/DECISIONS.md WR-D001/018/027/032/033; PR #346.
DO NOT REPEAT: Do not rebuild existing ECR engine, claim calibrated percentages, silently overwrite ESPN/FantasyPros authority, send provider messages, merge this PR or self-activate downstream work.
