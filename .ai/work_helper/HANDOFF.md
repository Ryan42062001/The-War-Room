# Work Helper / Super Troubleshooter Handoff

**TASK / MODE:** WR-147 rollback/restore rehearsal qualification; diagnosis only; Workflow V3.5, STANDARD_CHAT_HIGH / FAST_REFRESH. Assigned branch `wr-147-rollback-restore-rehearsal-qualification` from `ecb433d1168ff16f7a092a611540214bfe66364c`, initially 0 ahead/behind.

**RESULT:** `REHEARSAL_NOT_SAFE`. No rollback, restore, deployment, Pages/main/product/test/workflow/provider mutation. Refreshed Pages deployment **6620801092**, status **18743499328 SUCCESS**, source SHA `ecb433d...`; dynamic Pages run **#35899104065**, build **#107310399055**, deploy **#107310548594**. All 29 checked served assets match current canonical bytes, manifest SHA-256 `d98e7b891cf673e8933744b9ee3ac35120bccf316450a08e4041b0f30b33a1e6`; accepted product origin is `45cab0c189c284b4a3011b78ce953b99dd857194`. Refresh again before any operational authorization.

**TARGET QUALIFICATION:** Genuine historical canonical product states `673c61c35c3302f914a1a4543ecd39ec09eda354`, `bea75625ce18b3839bec71f436390902cdf6fa14`, and `53e0c652a1d9043e6abce8f297b6fbff8128d8e8` are all **REJECTED**. The first two expose accepted LOW but user-misleading WR137-F01 false `DRAFT COMPLETE` at manual slot 1, 9/10, and conflict with current WR-143 browser regression. The third also predates WR-136 terminal repair. No observed public user fence makes transport-only exposure safe; a docs-only SHA cannot demonstrate material rollback. No historical target is nominated. See the task evidence for exact FULL CI/audit receipts, hashes, one prospective guarded two-PR inverse mechanism, four measurement checkpoints, browser/cache validation and abort conditions.

**ONE NEXT MANAGER RECOMMENDATION:** `DO_NOT_RUN_PRODUCTION_ROLLBACK_USE_NONPRODUCTION_EVIDENCE`. No live ESPN fallback, formal A6, release or draft-ready inference follows.

**PUBLICATION:** Exactly this handoff and `.ai/work_helper/WR147_ROLLBACK_RESTORE_REHEARSAL_QUALIFICATION.md`. Immutable final head, PR and exact-head Governance receipt appear in the Manager-facing return/PR metadata. Product must SKIP. Work Helper does not merge.
