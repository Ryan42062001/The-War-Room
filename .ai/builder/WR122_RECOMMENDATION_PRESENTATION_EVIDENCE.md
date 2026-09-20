# WR-122 — ECR Recommendation Presentation Truthfulness Evidence

TASK: WR-122 | ROLE: Builder | WORKFLOW: V3.5 | EXECUTION: STANDARD_CHAT_HIGH
INITIAL CANONICAL MAIN / BUILDER BRANCH: 836de1e7ed543d9dba48437eeda57922b2c4afa3 (independently verified equal).
ASSIGNED BRANCH: wr-122-ecr-recommendation-presentation-truthfulness
SOURCE AUTHORITY: Manager WR-D034 accepted WR-121 documentation-only Strategy contract; WR-D001 ECR VALUE authority; WR-D018 fallback-first ESPN reliability; WR-D027 no provider contact.
STATUS: Bounded display/copy candidate; full final-head CI and fresh independent audit required.

## Bounded changes

1. `js/war-room-rankings.js`: **compact recommendation presentation and coupled display-only helpers**. The same engine-selected candidate/action remain rendered, with categorical existing HIGH/MODERATE/LOW label shown as "Decision strength · heuristic", not numeric `confidenceScore + '%'`. Factor tracks remain 0–100 *heuristic scores*, explicitly labeled not probabilities. The underlying confidenceScore, scoring, player selection, ranking order, survival calculation, market resolver, recommendation action, audit history, package selection and source datasets are not edited.
2. The compact market line and expanded "Market timing basis" use the existing `getMarketTimingDetails` attribution. Known market shows concise visible labels (ESPN B+ADP, ESPN board, ESPN ADP, FP ADP fallback), full accessible labels with explicit source and "heuristic", and complete expanded provenance; no `N% survival`. Unknown market shows visible "Timing UNKNOWN", accessible "Market timing unknown — no survival estimate" and expanded "Source: Unknown market". Engine's internal unknown-market sentinel remains 50 with nonadjacent next-turn context; the display does **not** misrepresent it as an observed 50% chance. A per-player freshness caveat is printed, not a fabricated live/player-specific update time. FantasyPros ECR still supplies VALUE, separate from ESPN/FP fallback timing.
3. A conditional no-opponent explanation only appears when the supplied current and next picks are **consecutive legal own picks** for the same configured snake slot, positive integers inside total pick bounds. Absent/invalid next-pick context receives neither the deterministic guarantee nor a fabricated availability probability. Any second option remains conditional on eligibility; turn-package action/winner logic is untouched.
4. `scripts/test-browser.mjs`: focused deterministic real-browser rendered compact/expanded cases using synthetic candidate clones/context and actual recommendation/market interface functions, with no persistent player-row/source/session mutation. Tests cover ESPN, no-market neutral 50, FantasyPros fallback, verified adjacent own-turn and invalid/missing next pick; unchanged recommendation player/action/confidenceScore/final score/numeric survival/ranked order and original row/source attributes; accessible nested details using actual keyboard focus/Space, desktop/390px overflow, factor bars, prior card reuse/open-state coverage.

### Before → after matrix

| Condition | Historical display defect | New display / boundary |
| --- | --- | --- |
| Heuristic decision confidence | `confidenceScore%` looked probabilistic | Categorical existing decision strength + "heuristic"; numeric engine confidenceScore unchanged |
| ESPN board / ADP | `N% survival` with no established calibration or source caveat | Terse visible ESPN B+ADP / ESPN board / ESPN ADP compact source, full accessible heuristic label; expanded source, market rank inputs and per-player freshness-unverified caveat |
| Missing ESPN and FantasyPros ADP | Internal neutral 50 displayed as `50% survival`, suggesting evidence of 50% odds | Compact "Timing UNKNOWN" with full accessible "Market timing unknown — no survival estimate"; "Source: Unknown market" in expanded details; numeric internal 50 unchanged |
| FantasyPros ADP fallback | Timing could appear ESPN-derived | Compact "FP ADP fallback"; full accessible FantasyPros ADP fallback heuristic and expanded source; no invented ESPN timestamp |
| Verified adjacent own snake picks | Generic 100% survival/guarantee wording | Conditional factual "no intervening opponent selection"; second choice remains conditional on eligibility |
| Invalid/missing next-pick context | A zero-opponent fallback could imply a guarantee | No adjacent-turn claim unless both numbered picks verify as consecutive own picks |
| Expanded source/score | "Why this survival?" and "Survival N%" could imply calibrated outcome | Keyboard-accessible "Market timing basis", provenance / unknown explanation and factor-score caveat; no printed survival percentage |

## Explicit preservation and verification boundaries

All fixture examples use current committed canonical rows cloned **in page** plus synthetic market fields solely for display testing; no ESPN account/network, source download, extra ranking admission, real opponent model, manual-vs-ESPN precedence change, alternate player winner, new threshold, scoring calibration or data freshness policy is asserted. Display-only helpers consult the **existing** market resolver but never write to it. No changes to `package.json`, `js/war-room-scoring*.js`, `js/war-room-recommendations*.js`, `js/war-room-draft-state.js`, `index.html`, Companion, datasets, workflows, runners or deployment.

The prior WR-118 synthetic suite can validate only app-side replay/reconnect, not real Companion-to-app end-to-end or live ESPN. WR-122's focused browser fixtures cannot establish empirical calibration, per-player ESPN timestamp authenticity, specific player-winner strategy, phone hardware performance or a draft-ready release. A passing Builder CI is not an independent audit.

## Validation log

Record only actual executed checks and observed exact-code / exact-final-head CI outcomes here or in the final PR evidence comment. A current code change, expected test or Governance job alone is not a test pass. Required: `node --check` for both changed JS/MJS, `npm run test:browser`, `test:phone-decision-view`, `test:responsive-overflow`, `test:scoring-corrections`, `test:wr118-espn-replay-reconnect`, `npm test`, and exact-final-head **FULL** War Room CI, with any real failures, corrections and skips disclosed. Local terminal execution is not implied by hosted GitHub Actions CI.

Next: Builder publishes exactly one open, unmerged four-file PR and authentic head/CI evidence. Manager separately reviews and freezes its exact SHA, authorizes FRESH Independent Auditor/QA task/branch/PR, and after any later integration runs canonical-main FULL CI canary. Builder does not self-audit, self-merge, activate employees, deploy or contact providers.


### Pre-final validation observations and bounded corrections

Earlier intermediate CI runs were **not** accepted as passing: browser fixture initially used an invalid-turn context that the engine repopulated during calculation; the display fixture now explicitly removes next-pick context **after** scoring. The existing read-only `scripts/run-test-browser.mjs` runner requires an exact legacy recommendation-details assertion string in its input and retires that snippet before browser execution; that original source line is preserved as a compatibility marker only, while the new executable WR-122 assertions inspect `Market timing basis`. No runner edits. The initial keyboard fixture was mounted inside a hidden board panel; it now mounts visibly, verifies native summary keyboard focus/Space activation and checks 390px render.

[Intermediate full CI #35515858027](https://github.com/Ryan42062001/The-War-Room/actions/runs/35515858027) successfully passed its repeated browser-determinism step, but its full `npm test` failed a **real display layout regression**: `test-layout-efficiency` recorded the first actionable choice at Y=1536 instead of baseline Y=1512.5 at 375x812/overall, an extra line caused by verbose compact source wording. The UI-only fix abbreviates **only the visible one-line source** to `ESPN B+ADP` / `ESPN board` / `ESPN ADP` / `FP ADP fallback` / `Timing UNKNOWN`; each short label has a complete escaped `aria-label` with full heuristic/source/unknown meaning, and expanded details retain the full wording. No stylesheet, action, ranking or layout-test threshold was changed. Any final acceptance requires actual repeated browser + full layout CI at the new head; intermediate historical failures must not be reported as final PASS.
