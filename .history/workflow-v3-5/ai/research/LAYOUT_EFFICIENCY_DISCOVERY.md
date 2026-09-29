# WR-012 — Layout Efficiency & Information Architecture R&D

Status: COMPLETE — READY FOR MANAGER SYNTHESIS
Role: Research & Development (R&D)
Parallel Work Wave: PW-001
Production implementation authorized: NO

## Executive conclusion

The current War Room is **not a candidate for a broad redesign**. Position Tiers, the compact command bar, the density pass, My Draft, responsive horizontal-overflow protection, and the separation of ranking value from market timing are already strong foundations.

R&D did identify a bounded information-architecture opportunity: the page gives too much persistent prominence to **configuration / session / maintenance controls** relative to the live decision loop, especially as width decreases. The strongest future direction is to make the current-pick/recommendation surface the primary persistent draft-day layer, progressively disclose maintenance/setup controls after initialization, and explicitly coordinate sticky geometry rather than stacking independently positioned bars.

Top three recommendations for Manager synthesis:

1. **Rebuild the persistence hierarchy around one coordinated live-draft surface** — turn state + recommendation + urgent pressure/sync attention should win persistent viewport priority; fixed sticky offsets should be replaced by a measured/coordinated stack.
2. **Move low-frequency maintenance/destructive controls behind one clear secondary “Manage / Tools” disclosure** while preserving Taken/Mine and session identity as easy draft-day controls.
3. **Collapse Draft Setup after initialization / first meaningful draft progress** to a concise summary with an explicit Edit action instead of permanently dedicating command-bar width/height to Teams/Pick/Rounds.

These recommendations are **READY FOR MANAGER SYNTHESIS**, not implementation. Manager must compare them with independent WR-013 runtime/audit evidence before authorizing any production UI work.

---

## 1. Scope and independence

### VERIFIED FACT

WR-012 is an R&D-only task under PW-001. Production HTML/CSS/JS changes are prohibited. WR-013 is an independent Auditor task, and Manager synthesis has a hard dependency on both streams.

### Independence statement

R&D did **not** read WR-013's final findings or use Auditor conclusions to shape this first-pass recommendation. Repository searches sometimes surfaced the existence/task framing of WR-013 because its task files are on `main`; no Auditor result artifact was used as evidence.

### Verified repository checkpoints

- WR-012 assigned starting SHA: `8df161ba8c5413b0cc3c11f87041c4ad80046dc0`
- latest observed canonical `main` during R&D: `cc9380de5879db1d32530bad0d05e2b1a635e81f`
- project mode: MAINTENANCE / STABLE — bounded discovery active
- no production UI implementation authorized

---

## 2. Evidence and method

### Repository evidence reviewed

- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/shared/DECISIONS.md`
- `.ai/shared/WORKFLOW.md`
- `.ai/manager/HANDOFF.md`
- `.ai/manager/PW-001.md`
- `.ai/manager/WR-012.md`
- `.ai/research/HANDOFF.md`
- `README.md`
- `index.html`
- `style.css`
- `style-base.css`
- `command-bar.css`
- `command-bar-fixes.css`
- `draft-awareness.css`
- `draft-polish.css`
- `js/war-room-command-bar.js`
- `js/war-room-command-bar-fixes.js`
- `js/war-room-draft-awareness.js`
- `js/war-room-ui.js`
- `script.js`
- `scripts/test-responsive-overflow.mjs`
- related UI/browser/test search evidence

### External evidence reviewed

Authoritative/accessibility and UX sources:

1. W3C / WAI, WCAG 2.2 — Focus Not Obscured and Target Size guidance  
   https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
2. Nielsen Norman Group, Progressive Disclosure  
   https://www.nngroup.com/articles/progressive-disclosure/
3. IBM Carbon Design System, Data Table usage / toolbar / density guidance  
   https://carbondesignsystem.com/components/data-table/usage/
4. IBM Carbon Design System v10, compact/small table-toolbar sizing context  
   https://v10.carbondesignsystem.com/components/data-table/style/

Current fantasy-draft product context — used only as market/feasibility evidence, **not** as usability proof:

5. FantasyPros Draft Assistant sync / streamlined Side Assistant  
   https://support.fantasypros.com/hc/en-us/articles/115001356148-What-is-the-difference-between-the-Manual-Draft-Assistant-and-Draft-Assistant-w-Sync  
   https://support.fantasypros.com/hc/en-us/articles/8280035814683-What-is-the-Browser-Extension-Side-Assistant-and-which-host-sites-support-it
6. RotoWire Draft Assistant / 2026 Draft Kit  
   https://www.rotowire.com/football/draft-assistant/  
   https://www.rotowire.com/football/draft-kit/ian/
7. Draft Sharks Draft War Room context  
   https://www.draftsharks.com/kb/fantasy-football-cheat-sheet

### Runtime-measurement limitation

R&D attempted to create a disposable local checkout of the exact current `main` for Playwright geometry measurement. The execution environment could not resolve `github.com`, so a current-tree clone could not be created. The browser/search tooling also could not provide a scriptable live DOM for the deployed GitHub Pages app.

Therefore:

- exact rendered pixel heights / screenshots were **not** obtained by R&D;
- no exact runtime overlap claim is presented as a verified fact;
- viewport percentages below are **static/nominal estimates from authored CSS**, clearly labeled as such;
- WR-013 and any future Builder task should perform real DOM geometry measurements before implementation decisions are finalized.

The existing repository Playwright test does verify **zero document horizontal overflow** at 13 widths in Position and Overall views, but it does not test vertical sticky overlap, focus obscuration, sticky occlusion height, or first-player position.

---

## 3. What the user needs in the first 1–3 seconds

### STRONG EVIDENCE / task-model conclusion

A live draft assistant is a time-pressure decision system. For the War Room's stated product purpose — “one screen for the board, my roster, the next turn, and the decisions that actually matter” — the first-glance hierarchy should be:

1. **Turn state** — Am I on the clock? If not, how many picks until me?
2. **Recommended action** — Who is the best pick now, and what is the short reason?
3. **Immediate alternatives / urgency** — Is a key tier closing? What are the best credible alternatives?
4. **Roster constraint** — What starter/structural need materially affects this decision?
5. **Sync trust only when consequential** — Is War Room caught up? If healthy, keep it quiet; if attention is needed, surface it.
6. **Interaction tools** — Search/filter, Taken/Mine marking, My Draft.
7. **Setup / maintenance / destructive controls** — available but secondary once the draft is underway.

This hierarchy is consistent with the repository's own command-bar design comment: “Waiting = situational awareness. On the Clock = decision first.” It is also consistent with progressive disclosure: frequent/high-value functions remain upfront; rare or advanced functions move to a secondary surface.

---

## 4. Current information architecture inventory

### 4.1 Global header

### VERIFIED FACT

The header contains:
- brand/edition identity;
- tagline;
- ESPN Sync status when present;
- ranking/data freshness.

It is sticky at `top:0`, with `min-height:74px`.

### R&D assessment

Brand identity is useful at entry but low-value after the draft is underway. Sync/data freshness are useful trust signals, but healthy states do not need the same persistent visual weight as turn/recommendation state.

### 4.2 Board toolbar

### VERIFIED FACT

The sticky toolbar contains:
- Position Tiers / Overall toggle;
- search;
- ALL/QB/RB/WR/TE/K/DST filters;
- My Draft.

It is `flex-wrap:wrap`, sticky at `top:74px`.

Position filters are not merely decorative: Position Board logic carries the current filter into `data-position-filter`, and CSS supports focused position layouts. Search and board switching are also core product paths.

### R&D assessment

This row contains mostly legitimate live-draft controls. The question is not whether to remove capability; it is whether seven permanently visible position buttons are the best phone/tablet expression of that capability.

### 4.3 Status / session / marking / maintenance row

### VERIFIED FACT

The sticky status bar contains all of the following in one surface:
- available-player / save status;
- saved Draft selector;
- New Draft;
- Delete Draft;
- Taken / Mine marking mode plus `M` shortcut;
- Autosave;
- Mock Audit;
- Update Rankings;
- Customize Board;
- Restore FP Order;
- Reset all.

It is sticky at `top:118px`, and `command-bar-fixes.css` permits it to wrap at `<=900px`.

### STRONG EVIDENCE

This is the clearest task-frequency mismatch in the current IA. It combines:
- very frequent/high-consequence marking mode;
- session identity / switching;
- initialization/preferences;
- maintenance/debugging;
- destructive operations.

Nielsen Norman Group's progressive-disclosure guidance specifically recommends showing the most important/frequent options first and deferring advanced/rare features, partly to reduce errors and scanning cost. The current row does the opposite for several low-frequency controls by making them persistently visible throughout the draft.

### 4.4 Tier navigation

### VERIFIED FACT

The global ELITE/PREMIUM/CORE/VALUE/UPSIDE/DEPTH/LATE/DEEP sticky nav is **hidden in default Position Tiers view** and shown for Overall/edit workflows.

### R&D assessment

This is good contextual behavior and should be preserved. It corrects an initial concern that there were four persistent rows in the default Position view. The nav is useful in Overall, where the long single table actually needs tier jumping.

### 4.5 Draft command bar

### VERIFIED FACT

The Position-view command bar repackages existing authoritative state into:
- Waiting / On the Clock / Draft Complete;
- picks until user's turn and current/next pick;
- recommended player and short reason;
- RB/WR/QB/TE pressure;
- alternatives on the clock;
- Teams / Pick / Rounds setup controls inserted by the command-bar-fixes layer.

`draft-polish.css` hides the old duplicate Draft Position / Recommended Pick / Board Pressure cards and hides Why/Intel command actions, leaving the command bar as the concise Position-view decision surface.

Desktop/tablet behavior above 768px:
- sticky;
- `top:7px`;
- `z-index:68`;
- waiting minimum height 58px;
- near-pick 66px;
- on-clock 98px.

At `<=768px` it becomes **static**.

### R&D assessment

The command bar is the strongest current IA component. It already embodies the correct “decision first” direction. Its main information-architecture weakness is that low-frequency draft setup permanently shares the same high-priority surface, and mobile removes persistence from the decision surface while leaving the utility/header layers sticky.

### 4.6 Draft awareness strip

### VERIFIED FACT

Position view inserts a second decision-support layer immediately below the command bar:
- Targets / queue (up to five visible);
- “What Changed” / “Since Your Pick” meaningful movement feed (up to three alerts).

At `<=900px` the two sections stack vertically.

### R&D assessment

Targets and meaningful-change awareness are useful, but the strip should earn its vertical space based on content. An empty “No targets yet / No major board movement” state has lower draft-day value than the player board. Progressive disclosure is appropriate here: keep meaningful alerts/active targets prominent; compress or collapse empty/quiet states.

### 4.7 Position decision strip

### VERIFIED FACT

The default Position Tiers board has another high-level decision layer containing six decision cards (best overall/best by main positions plus next-pick context). The command bar itself reads this strip to derive on-clock alternatives.

### R&D assessment

The strip is useful, particularly for cross-position comparison, but it overlaps conceptually with command-bar recommendation + alternatives + pressure. This is a **duplication candidate**, not an automatic deletion candidate. It may be more efficient for the command surface and decision strip to have explicitly different jobs:
- command surface = “what should I do now?”
- decision strip = “what credible alternatives exist?”

### 4.8 Position tier board

### VERIFIED FACT

The Position view already has a dedicated density pass:
- 1320px main width;
- four main position columns at large desktop;
- 3x2 decision layout at intermediate desktop/tablet;
- compact tier headers;
- player cards about 39px minimum desktop / 43px mobile;
- K/DST compact endgame;
- drafted-other rows compressed and muted;
- semantic position/tier/urgency color system.

### R&D assessment

**Preserve this foundation.** It is already optimized toward scan density and cross-position comparison. Broadly enlarging row heights or replacing Position Tiers with a generic card redesign would likely reduce information throughput.

### 4.9 My Draft

### VERIFIED FACT

My Draft is one click from the toolbar and contains Summary / Lineup views, starter count, needs, value/bye context and roster list.

### R&D assessment

The current access pattern is reasonable. Roster construction is decision-relevant, but permanently displaying the entire roster would compete with the board. A future implementation should consider surfacing **one compact roster-need cue** in the live decision surface while preserving full My Draft as progressive disclosure.

---

## 5. Sticky geometry and viewport analysis

### 5.1 Authored geometry

### VERIFIED FACT

Authored sticky offsets are independent constants:

- header: `top:0`, `min-height:74px`
- toolbar: `top:74px`, flex-wrap enabled
- status bar: `top:118px`, flex-wrap enabled at `<=900px`
- Overall tier nav: `top:152px`
- Position command bar when width `>=769px`: `top:7px`, `z-index:68`

The Position board hides the global tier nav. Overall shows it.

### STRONG EVIDENCE

The constants imply an authored budget of only **44px** between toolbar start (`74`) and status-bar start (`118`). The toolbar contains a view toggle, search, seven position filters and My Draft and is explicitly allowed to wrap.

The status bar's own one-line minimum is already roughly in the low-40px range because it includes a `min-height:29px` session select plus 14px vertical padding and border, before any wrap. Yet Overall's tier nav begins only 34px below the status-bar sticky top (`152 - 118`).

Therefore the sticky model has a **structural vertical-overlap risk** whenever actual toolbar/status height exceeds the fixed offset budget. This is especially plausible at narrow widths and for long session names / wrapped controls.

This is not classified as a verified runtime defect because R&D could not obtain exact rendered geometry in this environment. WR-013 or a future Playwright audit should confirm actual overlap/occlusion.

### 5.2 Command-bar stacking

### VERIFIED FACT

At widths above 768px, the command bar is sticky at `top:7px` with z-index 68, higher than the header/toolbar/status z-indices (20/19). It is therefore a separate overlay layer rather than a bar positioned below the top chrome.

### INFERENCE

This appears intended to keep the decision surface dominant as the user scrolls, which is directionally correct. But overlaying rather than coordinating sticky layers increases the need for focus-obscuration and visual-overlap testing.

At <=768px, the command bar becomes static while header/toolbar/status remain sticky. This removes persistent turn/recommendation context on the very devices where visible height is most constrained.

### 5.3 Required viewport static estimate

These numbers are **not runtime measurements**. They use a conservative nominal one-line Position-view sticky budget of approximately 162px:
- 74px header;
- 44px authored toolbar slot (`118 - 74`);
- ~44px minimum one-line status row.

Actual narrow-layout height may be greater because the toolbar/status can wrap. Position command/awareness/decision surfaces come **after** this chrome in document order and are not included in this 162px estimate.

| Viewport | Nominal top-chrome minimum | Nominal viewport share | Layout concern |
| --- | ---: | ---: | --- |
| 320x700 | ~162px | ~23.1% | toolbar/status wrapping highly plausible; command is static; browser chrome further reduces usable height |
| 375x812 | ~162px | ~20.0% | same priority inversion; command/awareness/decision layers precede players |
| 390x844 | ~162px | ~19.2% | same |
| 430x932 | ~162px | ~17.4% | same, slightly more vertical room |
| 768x1024 | ~162px | ~15.8% | breakpoint still uses static command bar; large content stack before tier players |
| 900x900 | ~162px minimum | ~18.0% | status is permitted to wrap; command is sticky overlay; tablet transition needs explicit geometry testing |
| 1280x800 | ~162px minimum | ~20.3% | horizontal density strong; command sticky overlay may be efficient if focus/occlusion is safe |
| 1440x900 | ~162px minimum | ~18.0% | best case for current multi-column design |

### Important interpretation

“Pixels before player cards” are not all waste. Command status, recommendation, pressure, targets and decision alternatives are themselves high-value draft content. The optimization target is to reduce **low-value persistent chrome and redundant summaries**, not maximize player rows at all costs.

---

## 6. Current strengths that should be preserved

1. **Position Tiers as default.** It matches the core draft question better than a long generic table: compare remaining value and scarcity across positions.
2. **Overall remains available.** It supports source-order inspection, editing and users who need a full-table mental model.
3. **Command bar state model.** Waiting / near / On the Clock / complete is a strong state-dependent hierarchy.
4. **Position density pass.** Compact rows and multi-column desktop layout are appropriate for a time-sensitive data surface.
5. **Search is globally accessible.** Direct player lookup remains a core emergency task.
6. **Taken/Mine explicit mode.** Marking correctness is more important than visual minimalism.
7. **My Draft progressive disclosure.** Full roster/report information is available without permanently obscuring the board.
8. **Healthy ESPN sync can stay quiet; attention can surface.** Existing trust UX should not be replaced by technical transport detail.
9. **Existing horizontal-overflow regression.** Zero document overflow across 320–1280 and both board views is a valuable guard that future layout work must retain.
10. **No second ranking/recommendation system in presentation.** Any layout change must preserve the existing data/decision authority boundaries.

---

## 7. External research principles applied

### 7.1 Progressive disclosure

### STRONG EVIDENCE

NN/g recommends presenting the most important/frequent options first and deferring advanced/rare functions. It specifically ties this to efficiency and error reduction.

War Room implication:
- Taken/Mine, search, turn state and recommendation are primary;
- ranking refresh, Mock Audit, Restore FP Order, Reset and most setup/session administration are secondary during an active draft.

### 7.2 Focus not obscured

### VERIFIED EXTERNAL STANDARD

WCAG 2.2 AA 2.4.11 requires a keyboard-focused component not be entirely hidden by author-created content. WAI explicitly discusses sticky content as a common scenario.

War Room implication:
- any multi-sticky redesign needs direct tests for focused player cards, filter buttons, table controls and My Draft controls after `scrollIntoView`/keyboard navigation;
- a shared CSS sticky-height variable / `scroll-padding-top` strategy is safer than several independent hard-coded offsets.

### 7.3 Target sizes

### VERIFIED EXTERNAL STANDARD

WCAG 2.2 AA 2.5.8 uses a 24x24 CSS-pixel minimum with spacing/equivalent-control exceptions. Larger targets remain easier for touch users; 44–48px effective targets are a practical goal for primary mobile actions when density permits.

War Room implication:
- do not blindly inflate every dense board control;
- ensure effective hit areas for high-frequency mobile actions (marking, filters, command pressure, target/queue affordances) are generous even when visual chrome remains compact.

### 7.4 Dense data-tool toolbars

### STRONG EVIDENCE

Carbon treats search/filter/table utilities as a toolbar concern, supports compact density, and recommends limiting visible toolbar actions, moving overflow actions to secondary menus.

War Room implication:
- the current board toolbar is conceptually the right home for search/filter/view controls;
- the maintenance/destructive status-row actions should not all compete as peer toolbar items.

### 7.5 Market context

### STRONG MARKET EVIDENCE, NOT USABILITY PROOF

Current FantasyPros/RotoWire/Draft Sharks draft products consistently emphasize:
- live pick tracking/sync;
- recommendation/value at the moment of choice;
- player availability / pick predictor / scarcity;
- roster/team need;
- queue/targets;
- keeping these in one live-draft interface.

This supports the War Room's existing product direction. It does **not** justify copying competitor layouts or prove a specific visual composition.

---

## 8. Candidate improvements

Scoring scale: 1–5. For Complexity and Regression Safety, **5 is better** (lower implementation burden / lower expected risk). Maximum 30.

| Rank | Candidate | User value | Draft speed | Evidence | Complexity safety | Regression safety | Accessibility | Total |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | Coordinated persistent decision surface / sticky-stack repair | 5 | 5 | 5 | 3 | 3 | 5 | **26** |
| 2 | Progressive disclosure for maintenance/destructive controls | 5 | 4 | 5 | 4 | 4 | 4 | **26** |
| 3 | Collapse Draft Setup after initialization/progress | 4 | 4 | 5 | 4 | 4 | 3 | **24** |
| 4 | Mobile touch-target/effective-hit-area hardening | 3 | 3 | 5 | 4 | 4 | 5 | **24** |
| 5 | Device-specific composition rather than simple wrapping | 5 | 5 | 4 | 2 | 2 | 5 | **23** |
| 6 | Clarify jobs of command bar / decision strip / awareness strip | 5 | 5 | 3 | 2 | 2 | 4 | **21** |
| 7 | Responsive toolbar/filter compaction | 4 | 4 | 3 | 3 | 3 | 4 | **21** |

The ranking deliberately favors bounded, low-blast-radius IA changes over a full responsive redesign.

### Candidate 1 — Coordinated persistent decision surface / sticky-stack repair

**Priority:** 1

**Opportunity:** Keep the information that determines the next pick persistent while reducing independent sticky geometry.

**Current limitation:** Fixed offsets assume heights that can change under wrapping; desktop command bar is a high-z overlay; <=768 command bar loses persistence while utility layers retain it.

**Proposed capability:**
- one coordinated sticky “Draft Pulse” / command surface during active Position-view drafting;
- content: turn state, recommended player/action, one-line reason, urgent pressure, sync only when attention is needed;
- board utility row may remain sticky only if geometry is coordinated and space permits;
- brand/status maintenance chrome may become non-sticky after entry or collapse as the user scrolls;
- use one measured sticky-height contract rather than independent magic numbers.

**Why it matters:** Highest direct reduction in “where do I look?” cost.

**Complexity:** MEDIUM

**Risk:** MEDIUM — sticky/focus interactions require careful responsive testing.

**Production readiness:** READY FOR MANAGER SYNTHESIS, pending WR-013 runtime confirmation.

### Candidate 2 — Progressive disclosure for maintenance/destructive controls

**Priority:** 2

**Opportunity:** Separate live drafting from administration.

**Current limitation:** Session creation/deletion, Autosave, Mock Audit, ranking refresh, Customize, Restore and Reset all remain persistent peers beside Taken/Mine.

**Proposed capability:**

Primary live controls:
- active draft/session identity;
- Taken / Mine;
- search/view/filter/My Draft.

Secondary `Manage Draft` / `Tools` disclosure:
- New Draft;
- Delete Draft;
- Autosave policy;
- Update Rankings;
- Customize Board;
- Restore FP Order;
- Mock Audit;
- Reset all;
- recovery/maintenance entry points as appropriate.

Destructive operations should remain clearly distinguished and confirmed; progressive disclosure must not weaken safety access.

**Why it matters:** Lowers scanning burden and accidental-action exposure without changing core behavior.

**Complexity:** SMALL–MEDIUM

**Risk:** LOW–MEDIUM

**Production readiness:** READY FOR MANAGER SYNTHESIS.

### Candidate 3 — Collapse Draft Setup after initialization / first progress

**Priority:** 3

**Opportunity:** Recover command-bar width and mobile vertical space without hiding settings.

**Current limitation:** Teams/Pick/Rounds are explicitly “always-visible” in the command bar, even though they normally stop changing after the draft is configured.

**Proposed state model:**

Pre-draft / zero progress:
- full `Teams | Pick | Rounds` setup visible.

Active draft:
- compact summary, e.g. `10 teams · Slot 10 · 16 rounds` with an explicit `Edit setup` control.

Correction/recovery:
- Edit reopens the same authoritative controls;
- no semantic or sync behavior changes;
- changing settings remains explicit and consequential.

**Why it matters:** Reclaims a full command column on desktop and a full setup row on mobile after setup has done its job.

**Complexity:** SMALL–MEDIUM

**Risk:** LOW–MEDIUM if underlying settings path is reused unchanged.

**Production readiness:** READY FOR MANAGER SYNTHESIS.

### Candidate 4 — Effective touch-target hardening

**Priority:** 4

### VERIFIED FACT

Several dense controls have authored dimensions around the mid-20px range: mark-mode buttons minimum 25px, command pressure controls minimum 26px, setup inputs 27–29px, and the target-star visual affordance 20–22px. Mobile player cards are approximately 43px minimum.

**Proposed capability:** Increase **effective hit area** for primary touch actions without necessarily increasing the visual chrome proportionally. Prefer spacing/padding/click-area solutions that preserve dense player comparison.

**Why it matters:** Error prevention under time pressure and on phones/tablets.

**Caution:** A sub-44px visual size is not automatically a WCAG 2.2 AA failure; WCAG's AA target minimum is 24px with exceptions. Actual target boxes and spacing require runtime measurement.

**Complexity:** SMALL–MEDIUM

**Risk:** LOW–MEDIUM

### Candidate 5 — Device-specific composition

**Priority:** 5

**Opportunity:** Treat desktop, tablet and phone as different drafting environments instead of wrapping the same information stack.

Potential component-level model:

Desktop >= ~1180:
- compact persistent Draft Pulse;
- multi-column Position board;
- optional compact roster/target rail only if Auditor evidence shows it helps rather than steals board width.

Tablet ~769–1179:
- one compact sticky decision row;
- simplified toolbar;
- board remains primary;
- maintenance in disclosure/drawer.

Phone <=768:
- one sticky decision capsule/row: turn + recommendation + urgent attention;
- one compact board utility row: search, position/view, My Draft, marking mode;
- setup/tools secondary;
- single-flow Position board.

**Complexity:** LARGE relative to other candidates.

**Risk:** MEDIUM–HIGH.

**Recommendation:** Do not start here. It is a later architecture option if smaller changes are insufficient.

### Candidate 6 — Clarify command / decision / awareness responsibilities

**Priority:** 6

**Current overlap:**
- command bar: recommendation + pressure + turn state;
- decision strip: best overall/by-position + next pick;
- awareness: targets + meaningful changes.

**Proposed jobs:**
- Command / Draft Pulse = `what should I do now?`
- Decision strip = `what are the credible alternatives?`
- Awareness = `what changed since I last acted / what targets remain?`

Quiet awareness should compress; active target/change information should expand.

**Complexity:** MEDIUM–LARGE because visual duplication may be entangled with existing tests and command-bar extraction.

**Risk:** MEDIUM–HIGH.

**Recommendation:** Use only after runtime task-flow evidence confirms meaningful redundancy.

### Candidate 7 — Responsive toolbar/filter compaction

**Priority:** 7

**Current toolbar:** view toggle + search + seven position filters + My Draft.

These are legitimate capabilities, and Position filtering changes actual board presentation. R&D does **not** recommend removing position filters.

Potential phone/tablet composition:
- search remains one-tap accessible;
- Position/Overall remains obvious;
- represent position filter as a compact segmented/overflow/select pattern appropriate to width;
- My Draft remains easy to reach.

**Complexity:** MEDIUM

**Risk:** MEDIUM

**Recommendation:** Secondary to the larger persistence/maintenance split.

---

## 9. Proposed before / after information hierarchy

### Current default Position hierarchy

1. Sticky brand + trust/freshness header
2. Sticky board toolbar
3. Sticky status/session/mark/maintenance row
4. Main command bar
5. Targets / What Changed awareness strip
6. Position board heading
7. Best-available / next-pick decision strip
8. Position tier columns
9. K/DST endgame
10. My Draft on demand

At <=768, item 4 becomes static while items 1–3 remain sticky.

### Proposed component-level hierarchy for future Manager consideration

#### Layer A — Draft Pulse: highest priority, persistent during active draft

- ON THE CLOCK / picks until turn
- recommended player + action
- one-line reason
- critical position/tier pressure only
- ESPN Sync only when not caught-up / attention is needed

#### Layer B — Board utility: high-frequency interaction

- search
- Position Tiers / Overall
- compact position focus/filter
- Taken / Mine
- My Draft
- active session identity if needed

#### Layer C — Contextual awareness

- active targets/queue
- meaningful changes since user's last pick
- compact roster-need cue
- empty/quiet state collapses instead of consuming a full row

#### Layer D — Primary board

- Position Tiers default
- existing dense cross-position presentation retained
- Overall remains one action away

#### Layer E — Secondary Manage / Tools disclosure

- Teams/Pick/Rounds full edit
- New/Delete Draft
- Autosave
- Update Rankings
- Customize / Restore
- Mock Audit
- Reset
- maintenance/recovery controls

This is an information-architecture proposal, **not** production design or code.

---

## 10. Desktop / tablet / mobile conclusions

### Desktop 1280x800 / 1440x900

**VERIFIED FACT:** Position board is designed for four main columns and command bar is persistent.

**R&D conclusion:** Current density is broadly appropriate. Highest-value desktop change is not “make everything smaller”; it is removing setup/maintenance competition from the decision hierarchy and formalizing sticky/focus geometry.

A permanent full My Draft side rail is not yet justified; it would reduce the board width that currently enables cross-position comparison. A compact roster-need cue is lower risk.

### Tablet 900x900 / 768x1024

**STRONG EVIDENCE:** This is the most fragile breakpoint range because:
- statusbar wrapping begins at <=900;
- command composition changes around 900 and 768;
- at 768 the command becomes static;
- Position decision layout also changes around 1080/768.

**R&D conclusion:** Any future UI milestone should treat 769–900 as a first-class design target rather than an interpolation between desktop and mobile.

### Phone 320x700 / 375x812 / 390x844 / 430x932

**STRONG EVIDENCE:** Current CSS intentionally preserves dense player cards, but the global toolbar and status row can wrap while remaining sticky, and the live command surface is static.

**R&D conclusion:** The phone should persist less total chrome, but what remains persistent should be the **decision state**, not maintenance/setup controls. Use effective hit areas and progressive disclosure rather than simply enlarging every control.

---

## 11. Interaction-count assessment from current code

These are structural interaction counts, not timed usability measurements.

| Core task | Current direct path | R&D assessment |
| --- | --- | --- |
| Know turn / next pick | command bar, 0 interaction while visible | excellent desktop; can scroll away <=768 |
| See recommendation | command bar, 0 interaction while visible | strong |
| Compare positions | decision strip / four position columns | strong |
| See pressure | command bar pressure + board tiers | strong but somewhat duplicated |
| Search player | focus search + type | appropriate |
| Mark typical opponent Taken | default Taken + click player | 1 player action after initial mode |
| Mark Mine | switch mode (`M` or button) + player | explicit safety cost is justified |
| View roster | My Draft | 1 action |
| Switch Position / Overall | toggle | 1 action |
| Update rankings / customize / reset | always-visible top row | access is easy but overly prominent for frequency/risk |

The objective is not to minimize every click. Explicit state changes and destructive actions should retain intentional friction.

---

## 12. Changes to avoid

1. **Do not replace Position Tiers with a generic dashboard/card redesign.** Current board density is a strength.
2. **Do not remove Overall.** It serves source-order/edit workflows and a different scanning need.
3. **Do not hide Taken/Mine deeply.** Marking correctness is a primary interaction and manual-sync fallback.
4. **Do not make healthy ESPN technical details persistent.** Attention states should surface; healthy sync should stay quiet.
5. **Do not put full My Draft permanently beside the board without evidence.** It may reduce cross-position comparison width.
6. **Do not enlarge every board row/control to 48px visually.** Preserve data density; enlarge effective hit areas where needed.
7. **Do not use more independent fixed sticky offsets.** One coordinated sticky contract is safer.
8. **Do not remove safety/recovery/destructive functions merely to reduce clutter.** Move them to an obvious secondary location and preserve confirmation semantics.
9. **Do not alter scoring/recommendation logic as part of layout work.** Presentation should consume the same authoritative outputs.
10. **Do not treat competitor layouts as validation.** They demonstrate common problem framing, not that their UI is optimal for this user.

---

## 13. Edge-case disposition

### Long player/team text
Retain truncation/ellipsis in compact decision surfaces; never allow long names to push key turn state offscreen. Full name remains available in board/details/tooltips where appropriate.

### ESPN Needs attention / Unavailable
Attention must outrank healthy freshness/branding and remain visible in the Draft Pulse. Do not collapse actionable sync recovery into a generic tools menu.

### On the clock vs waiting
On-clock should be visually stronger and may use more height than waiting. Waiting can compress to preserve board space.

### My Draft open
Opening My Draft should not leave underlying sticky layers creating confusing overlapping interactive regions. Future runtime tests should assert focus containment/visibility even though the panel is non-modal by semantics today.

### Draft settings expanded
Setup must remain accessible for corrections, but expansion should be explicit once progress exists. Long auto-draft team controls need their own measured layout tests.

### Multiple sessions / long names
Session identity should truncate safely; session creation/deletion belongs in Manage Draft. Long names are a key sticky-wrap test case.

### Custom board / edit mode
Edit mode appropriately forces Overall/tier navigation behavior. A new live-draft compact header must not hide the fact that editing is active.

### Search active
Search should remain directly available and must be able to reveal matching players in collapsed tiers, as current behavior already supports.

### 20-team / long-round configurations
Text lengths and setting values increase. This is another reason not to allocate fixed-width persistent setup fields without responsive tests.

### Keyboard / screen reader
Future sticky work must explicitly test focus not obscured, logical source/focus order, aria-live noise, and `scroll-padding-top`/scroll-margin behavior.

### Phone safe areas / browser chrome
The 320x700 case is the stress case: authored 100vh is not the same as comfortably visible page area after browser UI. Prefer content hierarchy that survives reduced height rather than relying on viewport assumptions.

---

## 14. Validation plan for any future implementation

No Builder task should be approved without a measurement-first acceptance plan.

### Level 1 — static / architecture

- no scoring/ranking/recommendation/state/sync semantic changes;
- source order and keyboard order remain logical;
- no duplicate visible controls unless they have intentionally distinct roles;
- one documented sticky-height/offset strategy rather than unrelated magic numbers.

### Level 2 — automated browser regression

Test at minimum:
- 320x700
- 375x812
- 390x844
- 430x932
- 768x1024
- 900x900
- 1280x800
- 1440x900

And retain existing 320/360/375/390/412/430/600/640/720/768/820/900/1280 horizontal-overflow matrix.

Add geometry assertions for:

1. **Sticky union height:** measure actual visible union of authored sticky/fixed rectangles after scrolling.
2. **No sticky overlap:** no two visible sticky control surfaces unintentionally cover the same actionable region.
3. **Focus not obscured:** tab/focus every primary control and representative player rows after scroll; focused element must remain visible.
4. **Board availability:** record first visible player-card y-coordinate and visible player-board height in cold, waiting, near and on-clock states.
5. **Command persistence:** active draft decision surface remains visible at representative scroll positions on intended devices.
6. **Touch targets:** measure actual bounding boxes and spacing for primary mobile controls.
7. **Long labels:** long session name, long player name, sync attention text, 20-team configuration.
8. **My Draft:** open/close at each target width with no document overflow and no hidden primary close/navigation controls.
9. **Overall/edit mode:** tier nav and table headers do not collide with sticky chrome.
10. **No browser/page errors.**

### Level 3 — simulated draft states

Exercise:
- cold/pre-draft setup;
- waiting many picks away;
- two picks away;
- on the clock;
- manual Taken/Mine workflow;
- search active;
- targets populated vs empty;
- multiple board-movement alerts;
- sync Caught up / Updating / Needs attention / Unavailable;
- long saved-session names;
- settings expanded;
- My Draft open;
- 20-team / long-round settings;
- draft complete.

Record task interaction counts and decision-surface visibility.

### Level 4 — live/mock draft validation

If Manager approves a production layout milestone, use at least one realistic ESPN mock because live sync messages, timing pressure and rapid board changes can expose spatial/attention problems synthetic static tests miss.

Recommended human checks:
- Can user answer “am I up / who should I take / why?” in 1–3 seconds?
- Is Taken/Mine mode unmistakable before a manual pick?
- Can a user recover from sync attention without losing the draft decision context?
- Can the user reach My Draft/search without hunting?
- Do maintenance/destructive actions remain discoverable but non-dominant?

### Screenshot/visual baseline

Capture the required viewport matrix for:
- waiting;
- on-clock;
- sync attention;
- My Draft open;
- Overall.

Use screenshots to supplement geometry, not replace assertions.

---

## 15. Recommendation outcome

**READY FOR MANAGER SYNTHESIS**

### Why

R&D found enough repository + external evidence to identify bounded, plausible improvements with favorable value/risk profiles. The evidence does **not** justify a full redesign, and it does not independently prove a production defect.

The strongest findings are narrow:
- persistent priority should favor the live decision loop;
- low-frequency maintenance/destructive functions should be progressively disclosed;
- Draft Setup should not permanently occupy the active decision surface after it has served its purpose;
- sticky geometry needs runtime validation and likely one coordinated contract.

### Required next gate

Manager must independently compare this report with WR-013. Specific implementation should be authorized only where the two evidence streams agree or where Manager can resolve disagreements with additional measurement.

---

## 16. Evidence classification summary

### VERIFIED FACT

- Position Tiers is default.
- Position view hides Overall tier nav and legacy recommendation/pressure cards when command presentation is ready.
- Header, toolbar and status bar are independently sticky with fixed offsets.
- Toolbar can wrap; statusbar wraps <=900.
- Overall tier nav is sticky at a fixed offset.
- command bar is sticky above 768 and static at/below 768.
- command bar contains turn status, recommendation, pressure and persistent Teams/Pick/Rounds setup.
- awareness strip contains targets + change feed and stacks <=900.
- Position Tiers has an explicit density pass and compact mobile player cards.
- existing responsive test validates horizontal document overflow, not vertical sticky geometry.
- maintenance/destructive controls are persistent peers in the statusbar.

### STRONG EVIDENCE

- current persistent priority is mismatched on phone/tablet because utility/setup surfaces retain persistence while the decision command becomes static;
- independent fixed sticky offsets are fragile when wrapped content changes actual height;
- maintenance controls are appropriate progressive-disclosure candidates;
- a rolling/quiet awareness state can be compressed without losing meaningful alerts;
- current Position board itself should largely be preserved.

### INFERENCE

- actual overlap/obscuration likely occurs in some wrapped sticky states, especially Overall and narrow/long-label scenarios; runtime proof is required;
- a compact roster-need cue near the recommendation would reduce scan distance without needing a permanent roster panel;
- separating the command/decision/awareness jobs would reduce redundant scanning if runtime task tests confirm duplication.

### OPINION / HYPOTHESIS

- the best future component name could be “Draft Pulse” or similar; naming is not part of the recommendation;
- desktop might benefit from a compact optional side rail in some states, but there is insufficient evidence to recommend it now.

---

## 17. R&D disposition

Production files changed: **NO**  
Production UI changed: **NO**  
Scoring/rankings/recommendations changed: **NO**  
ESPN sync/recovery semantics changed: **NO**  
Canonical `.ai/shared/*` changed by R&D: **NO**  
Experimental production code created: **NO**

Recommended next role: **Manager / Architect** after WR-013 also completes.
