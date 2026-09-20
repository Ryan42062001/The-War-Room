# WR-119 — Independent QA of WR-118 synthetic replay/reconnect regression

STATUS: PUBLISHED — FAIL — REMEDIATION REQUIRED
TASK: WR-119
ROLE: Independent Auditor / QA
WORKFLOW: V3.5
EXECUTION: STANDARD_CHAT_HIGH
REFRESH: FAST_REFRESH
AUDIT SCOPE: Synthetic **app-side** snapshot-ingress regression only. No production/Companion/source/ranking/deployment writes or real ESPN access.

## 1. Immutable identity and scope

Canonical main at audit start: `01a77d1492db06018f45ad5f7eed7fa8ebf028db` (merged Manager PR #339 / WR-D029).
Assigned independent Auditor branch `wr-119-synthetic-replay-reconnect-independent-audit` independently compared **identical** to that main before audit writes (ahead 0, behind 0).
Source task: WR-118. Builder PR [#338](https://github.com/Ryan42062001/The-War-Room/pull/338), OPEN / UNMERGED, branch `wr-118-synthetic-espn-replay-reconnect-regression`.
**Frozen, audited, live PR head:** `39491e672b6177834aa029b7a716c612c7cc892d`.
Historical Builder base: `5dc8906d5285d1c51b51ef0068bd0a98753610ba`. GitHub compare shows eight commits, 0 behind and precisely these four file paths:
- `scripts/test-wr-118-espn-replay-reconnect.mjs` (+428);
- `package.json` (only named syntax-checked test command and inclusion in `npm test`);
- `.ai/builder/WR118_SYNTHETIC_REPLAY_RECONNECT_EVIDENCE.md`;
- `.ai/builder/HANDOFF.md`.

No modified production `js/**`, Companion `extensions/**`, ranking/source datasets, workflow, or runner. Reviewed live PR #338 discussion; its final Builder comment references the same frozen head, four-file scope and CI, without subsequent target movement at the initial verification. This report is **not** transferable to a later target SHA.

## 2. Independent review and actually observed tests

Independently read canonical Workflow V3.5, active registry, Auditor charter, WR-118/119 specs, Manager/Builder/Auditor handoffs, Builder evidence, WR-D001/D018/D027/D028/D029, exact PR patch, the entire 428-line fixture, `package.json`, existing `js/war-room-espn-sync.js`, `js/war-room-draft-state.js`, `js/war-room-recommendations.js`, `js/war-room-ui.js` completion/session logic and relevant draft-invariant/persistence/off-board tests.

Exact frozen target War Room CI [run 35488672532](https://github.com/Ryan42062001/The-War-Room/actions/runs/35488672532): **COMPLETED / SUCCESS**. Classify job `106019608130` SUCCESS, Governance `106019627767` SUCCESS, full test `106019654656` SUCCESS, bootstrap-reuse SKIPPED. Independently fetched actual full-job logs: `npm test` includes `test:extension`, `test:espn-offboard`, `test:draft-invariants`, `test:persistence-recovery`, `test:recovery-failures` and named `test:wr118-espn-replay-reconnect` with explicit `node --check`. The named test logged **two** separate browser-context iterations, zero reported browser page errors, seed `88211736` and matching actual-state digests:
- source `ef335d5bc79b36d46c32a19e1372db8405ff92956307e15b209d65fba632b070`;
- terminal A `8dcf7c772d03bdf1b2e91e614bdd8ce74cfcd19d9858e6d86cd9146de36d7340`;
- isolated B `92c057e6a4f58d73deb26b559a32505262401bc5a4afdc6aaa5b79b0ceb7ef85`.

No Auditor-run local/ephemeral browser test or executable mutation experiment occurred. Negative-control results below are **static, independently reasoned assertion-path analysis**, not claims of a run or CI result. Existing CI success verifies successful execution of the existing oracle, not adequacy of all of its assertions.

## 3. Oracle strengths verified

The fixture calls the preexisting `window.WarRoomEspnSync.applySnapshot(payload)` inside a real, locally served browser page, then independently reads actual `tr.draftrow` state and `getDraftAssistantState()`. It does not simply hash an expected fixture twice. `expectedRows()` maps fixture-selected player names to fixed-seed indices; `assertState()` demands row-by-row equality of *actual* numbered pick/player index, snake-team slot, Mine/Taken owner flag, `data-sync-source=espn`, and `data-espn-player-id`, plus 717 board rows, no external fabricated row, no repeated number/player, and exact count/overall-current-pick arithmetic.

It actually evaluates and asserts:
- opening picks 1–12, identical replay, reversed order plus repeated pick #3, stale shorter 1–9, and partial unmatched #13 without a fabricated canonical row;
- full-snapshot replacement of incorrect pick #5 (fixture index 170) by correct index 4 under *existing ESPN-source full-snapshot authority*, with explicit former-row clearance and replayed corrected permutation;
- two distinct saved session IDs, A13/B5 separate expected row ledgers and hashes, A20 save/reload/replayed full reversed 20, B unchanged after A reconnect;
- provisional 159/160 when the full 16-player user roster is already picked, authoritative 160/160 and no final next turn, terminal save/reload and A/B return;
- 717-row source-name/ECR/rank/ADP hash stable against the initial browser baseline and identical source/A/B result hashes in two fresh contexts.

Existing app code confirms numbered snapshot deduplication and order normalization, stale lower-progress rejection, full replacement of old ESPN-marked rows on accepted fresh snapshots, and unresolved pick exclusion. Existing completion rule in `js/war-room-ui.js` distinguishes provisional external-complete with full user roster from authoritative completed full numbered count. The test does **not** invent manual-vs-ESPN precedence, a policy winner, a new ECR value authority, or a fabricated external/off-board player. WR-D001 remains FantasyPros PPR ECR value and ESPN ADP timing; WR-D018 remains Board/Pick History fallback-first and `LIVE_DIRECT_UNVERIFIED`.

Static negative-control review: an incorrect pick/player, duplicate numbered row, duplicate canonical player, wrong expected Mine/Taken flag/teamSlot, removed old #5 row not cleared, or incorrect persisted pick/source/player-ID metadata would violate the row equality and/or uniqueness checks. This is a structural conclusion, not an executed mutation test.

## 4. Findings

### WR-119-F01 — MEDIUM / BLOCKING — Recommendation eligibility and nonterminal next-turn oracle can pass vacuously

**Requirement.** WR-118 / WR-119 require detection of stale recommendation eligibility and invalid user next turn across the composed stale/partial/reconnect/session sequence, not only correctness of the pick rows and null final turn.

**Precise evidence.** In `scripts/test-wr-118-espn-replay-reconnect.mjs` lines 98–126, `inspect()` computes `candidates = debug.scored.slice(0,12)` or `[]` and stores **only the number of invalid candidates**; lines 165–178 `assertState()` checks `invalidCandidates === 0` but never requires any eligible candidates to exist when the draft remains active or checks the actual recommendation/decision output. In `js/war-room-recommendations.js` lines 2839–2890, `buildLiveDraftDebugState()` prefilters available/roster-eligible candidates; an empty/missing/debug-selected list yields zero invalid candidates. `scripts/test-draft-invariants.mjs` lines 245–262 explicitly rejects an empty candidate list in its *separate* unfinished-draft scenarios, but the WR-118 integrated stale/partial/reconnect stages do not apply that requirement. In fixture lines 112–125 `inspect()` captures `state.myNextPick` as `nextPick`, yet `assertState()` never compares it to independently computed, already accepted snake-slot next-pick truth at nonterminal stages; `nextPick === null` is only checked at the authoritative terminal/reload stage (lines 357–374).

**Adversarial counterexample (static, not run).** If the integrated stale/partial/reconnect path returns zero debug candidates due to an erroneous recommendation calculation, or reports an invalid nonterminal `myNextPick` while the numbered rows and `currentPick` stay correct, every WR-118 stage-level `assertState()` can still pass. The terminal-null assertion cannot detect that earlier error. Thus the claimed combined eligibility/valid-next-turn coverage exceeds what the fixture's own oracle verifies. This does **not** establish an existing app production defect.

**Impact.** An explicit acceptance dimension of the integrated regression can regress unnoticed despite green test and matching final ledger digests.

**Smallest remediation.** On the *Builder's test-only scope* and under a separate Manager authorization, independently derive expected remaining user snake-pick/clock state from accepted teams/rounds/slot and completed numbered picks; compare `myNextPick`/on-clock against it at meaningful A stale/partial/20-replay, B session and 159/160 checkpoints. Require a nonempty candidate set in selected active, roster-eligible stages; verify candidate availability against actual rows and, where exposed, the actual recommendation/decision path rather than treating an empty debug list as success. Do not freeze a preferred player, change recommendation weights/policy, or demand a candidate after a legitimately finished roster. Add bounded negative controls for empty candidates and incorrect nonterminal next-pick if feasible.

**Required validation.** Demonstrate the controls fail for independent, ephemeral wrong-state/empty-candidate cases; rerun named syntax test, all applicable existing suites and **exact new-head full CI**, then obtain a new Manager freeze and fresh independent audit. **Confidence: HIGH** (unconditional read of fixture's missing assertions).

### WR-119-F02 — LOW / NON-BLOCKING IN ISOLATION — Reconciliation failure output lacks actual ledger and session identity

**Requirement.** WR-118's reproducible failure records should identify seed/order, session/key, pick, expected/actual authoritative ledger digests, and relevant safe ownership/source metadata.

**Precise evidence.** `apply()` at fixture lines 181–195 passes `state=null, expected=[]` into `check()` for both false/null app result and reconciliation-counter mismatch. `check()` lines 138–163 therefore serializes `session:null` and `hash([])` as both expected and actual ledger digests, even if the actual board differs; initial `A initial 12` call (line 245) does not supply a pick. The counter-specific result details include counts and unmatched pick/reason, so this is degraded diagnosis, not complete lack of a failure stage.

**Impact.** The very first malformed app response may report equal empty hashes and no session/pick identity, making a later failing fixture harder to reproduce from the required evidence contract. No secrets or source rows are deliberately logged.

**Smallest remediation.** On failed counter/app-result checks, obtain a read-only actual `inspect()` snapshot and the applicable expected fixture-ledger model, plus a safe session ID and stage/pick/order; attach their actual distinct digests and first mismatch to the existing safe structured diagnostic. Do not print source rows/cookies/URLs. **Confidence: HIGH** (direct helper call path).

## 5. Severity and verdict

CRITICAL: none.
HIGH: none.
MEDIUM: **WR-119-F01 (BLOCKING)**.
LOW: **WR-119-F02 (non-blocking by itself)**.

**Single independent verdict: FAIL — REMEDIATION REQUIRED.**

The ledger/replay/persistence portions are meaningful and actual CI passed, but a *materially required* combined recommendation/next-turn property can still pass without being verified by this fixture. Accepting the test as covering that invariant would overstate its proof. WR-119-F02 can be bundled with narrow test-only remediation but does not itself establish production malfunction.

## 6. Evidence boundary, independence and next gate

Evidence establishes only **synthetic app-side** snapshot ingress against the existing local board, controlled browser save/reload and replay. It does **not** establish real ESPN connectivity/account/room, real network reconnection, Companion-to-app end-to-end delivery, separately sourced structured Direct, physical-phone readiness, real provider rights/data access, ranking-policy utility or draft-ready release.

No target edit, production/Companion/dataset/workflow/runner write, real ESPN access, provider outreach, custom scoring, deployment, or merge was performed. Auditor-only writes are this report and `.ai/auditor/HANDOFF.md` on the dedicated WR-119 branch. No employee activation by Auditor.

**Manager next action:** review F01/F02 against exact frozen PR #338 SHA `39491e672b6177834aa029b7a716c612c7cc892d`; keep Builder PR and this audit PR open/unmerged. If accepting F01, authorize bounded **test-only** Builder remediation and new frozen SHA + exact-head FULL CI, followed by a **fresh independent re-audit**. Do not merge #338 on this FAIL; do not patch production or expand to provider/Companion/live work. The current negative verdict remains bound to the historical frozen SHA.
