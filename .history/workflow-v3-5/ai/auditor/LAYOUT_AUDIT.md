# WR-013 — Current Layout Efficiency & Usability Baseline Audit

Task ID: WR-013
Role: Independent Auditor / QA
Parallel Work Wave: PW-001
Audit phase: INDEPENDENT FIRST PASS
Production changes authorized: NO

## Independence record

This first-pass baseline was completed before opening or reading the WR-012 R&D final recommendation artifact. Evidence came from the authoritative WR-013/PW-001 specifications, current production source, and current-main browser/CI evidence. R&D conclusions were intentionally excluded from the evidence-gathering and finding formation below.

## Verified environment / checkpoint

- Repository: `Ryan42062001/The-War-Room`
- PW-001 starting checkpoint: `8df161ba8c5413b0cc3c11f87041c4ad80046dc0`
- Current production/state checkpoint audited before this artifact write: `cc9380de5879db1d32530bad0d05e2b1a635e81f`
- Comparison from PW-001 start to audited current main contained `.ai/` workflow/task/handoff changes only; no production HTML/CSS/JS changed during the wave before this first pass.
- Current-main War Room CI #730 / run `34240349530`: SUCCESS on exact checkout `cc9380de5879db1d32530bad0d05e2b1a635e81f`.
- Current-main GitHub Pages build/deployment also completed successfully.
- No production files were modified by this audit.

## Method and evidence limits

Direct authenticated/local interactive rendering is not available in the Auditor chat environment. I therefore did not invent exact visual measurements that require a fresh browser session. The strongest current rendered evidence available is the repository's own Playwright suite executed in CI on the exact audited SHA, combined with static inspection of the production DOM/CSS/JS.

Evidence labels used below:

- **VERIFIED RUNTIME** — directly asserted by current-main Playwright/CI behavior.
- **VERIFIED STRUCTURE** — directly supported by current production source, but not newly measured visually in this session.
- **UNVERIFIED RENDERED METRIC** — exact pixel/visual result requires a live browser measurement not present in current checked-in test output.

## Current rendered-regression baseline

Current-main CI independently establishes the following:

- 717 canonical player rows render with 0 canonical duplicates.
- Position Tiers is the default view and renders all 717 player cards.
- Position/Overall switching works.
- Position filtering works.
- Player-card marking proxies correctly to authoritative Taken state.
- My Draft opens through its user-facing button in the browser suite.
- Browser startup suite reports `mobileOverflow: 0`.
- Dedicated responsive overflow suite passes **13 widths × 2 board views** with zero horizontal document overflow and no collected browser/page errors.
- Responsive widths verified by that suite: `320, 360, 375, 390, 412, 430, 600, 640, 720, 768, 820, 900, 1280` at 900px viewport height, in both Position and Overall views.
- A separate exact `390x844` browser path verifies no horizontal document overflow with My Draft already opened; draft-awareness coverage also verifies `390x844` has zero page overflow and no browser/page errors.
- Command-bar regression verifies distinct Waiting and On-the-Clock states and requires On-the-Clock to render at least 20px taller than Waiting.

These tests establish strong **containment and functional reachability**, but they do not measure layout efficiency, scan time, actual above-fold choices, or exact sticky-stack height.

## Required viewport matrix

| Viewport | Evidence available in this audit | Horizontal document overflow | Browser/page errors | Exact sticky height / first player Y / choices above fold |
|---|---|---|---|---|
| 320x700 | Runtime width 320 tested at 320x900 in Position + Overall; mobile CSS structure inspected | VERIFIED at width 320: 0 | VERIFIED for 320x900 responsive run | UNVERIFIED at exact 320x700 |
| 375x812 | Runtime width 375 tested at 375x900 in Position + Overall | VERIFIED at width 375: 0 | VERIFIED for 375x900 responsive run | UNVERIFIED at exact 375x812 |
| 390x844 | Exact viewport appears in browser/draft-awareness tests | VERIFIED: 0 | VERIFIED in draft-awareness path | UNVERIFIED for sticky height / first player Y / above-fold count |
| 430x932 | Runtime width 430 tested at 430x900 in Position + Overall | VERIFIED at width 430: 0 | VERIFIED for 430x900 responsive run | UNVERIFIED at exact 430x932 |
| 768x1024 | Runtime width 768 tested at 768x900 in Position + Overall | VERIFIED at width 768: 0 | VERIFIED for 768x900 responsive run | UNVERIFIED at exact 768x1024 |
| 900x900 | Exact viewport in responsive suite | VERIFIED: 0 | VERIFIED | Sticky/first-Y/above-fold count UNVERIFIED |
| 1280x800 | Runtime width 1280 tested at 1280x900 in Position + Overall | VERIFIED at width 1280: 0 | VERIFIED for 1280x900 responsive run | UNVERIFIED at exact 1280x800 |
| 1440x900 | Production max-width/responsive structure inspected; current Pages deployment healthy | UNVERIFIED by current responsive test (1440 not in matrix) | UNVERIFIED for exact interactive flow | UNVERIFIED |

### Additional width coverage already present

The existing responsive suite also verifies zero document overflow at 360, 412, 600, 640, 720, and 820px widths in both board views.

## Persistent chrome and vertical-budget baseline

### Desktop / tablet > 600px

Production CSS uses four top-level sticky surfaces before main content:

1. Header: `min-height: 74px`, `position: sticky`, `top: 0`.
2. Toolbar: `position: sticky`, `top: 74px`.
3. Status bar: `position: sticky`, `top: 118px`.
4. Tier navigation: `position: sticky`, `top: 152px`.

Therefore **152px of vertical offset is structurally allocated before the tier-nav top**, before adding the tier-nav's own rendered height. This is a lower-bound/configured-offset fact, not an exact total sticky-stack measurement.

Configured pre-nav offset as a percentage of required viewport height:

- 1440x900: 152 / 900 = **16.9%** before nav itself.
- 1280x800: 152 / 800 = **19.0%** before nav itself.
- 900x900: **16.9%** before nav itself.
- 768x1024: 152 / 1024 = **14.8%** before nav itself.

Position view then adds the draft command bar inside main. On widths >=769 it is also sticky (`top: 7px`, high z-index). Waiting has a declared minimum height of 58px; Near 66px; On-the-Clock 98px. Current runtime tests also require On-the-Clock to be at least 20px taller than Waiting.

**UNVERIFIED:** exact simultaneous rendered sticky footprint, overlap behavior while scrolling, first player-card Y coordinate, and above-fold player count at each required desktop/tablet viewport. The current test suite does not print those measurements.

### Mobile <= 600px

Production CSS deliberately removes most persistent layers:

- header becomes static
- statusbar becomes static
- tier nav becomes static
- toolbar remains sticky at `top:0`
- mobile command bar is static

This is structurally efficient: after scrolling, the page does not permanently reserve the full desktop sticky stack on narrow phones.

## Core-flow interaction baseline

Interaction counts below describe the current UI path, not implementation recommendations.

### Board orientation

- Position Tiers is default: **0 actions** after load.
- Position -> Overall: **1 click/tap** on board-view toggle.
- Overall -> Position: **1 click/tap**.
- Jump to a named overall tier: **1 click/tap** on tier nav plus smooth scroll.

### Search / filtering

- Search player/team: **1 focus + typing**; search control is permanently in top toolbar.
- Position filter: **1 click/tap**; ALL/QB/RB/WR/TE/K/DST controls are permanently in toolbar.
- Runtime test verifies a WR filter correctly collapses Position Tiers to WR and hides endgame.

### Marking

- Taken/Mine mode switch: **1 click/tap** in statusbar; keyboard `M` is advertised as a shortcut.
- Mark a player after mode selection: **1 player-card/row action**.
- Position card click is runtime-verified to update the authoritative drafted state.

### My Draft

- Open: **1 click/tap** from toolbar.
- Summary is default: no extra action after opening.
- Lineup: **1 additional tab action**.
- Close: **1 action** on close control or toolbar toggle.
- Runtime suite verifies My Draft opens; exact scroll/context displacement and return-to-board distance were not measured in current CI output.

### Draft settings / sessions / maintenance

- In Position view, teams/slot/rounds are always exposed in the command bar as three compact inputs; no expansion is required.
- Legacy Draft Position settings remain in an expandable `<details>` surface and become relevant outside the simplified Position flow.
- Draft session selector, New Draft, Delete Draft, Autosave, Mock Audit, Update Rankings, Customize Board, Restore FP Order, and Reset all coexist in the statusbar.
- Delete/reset controls use guarded/armed behavior in product logic, reducing accidental destructive execution; their visual competition with primary draft controls is separately evaluated below.

### Recommendation / urgency

- Recommendation and four position-pressure actions are in the Position command bar without opening a secondary panel.
- Waiting / Near / On-the-Clock change visual composition; On-the-Clock enlarges the bar and recommendation rather than relying only on color.
- Existing tests verify Waiting/On-the-Clock distinction and live pressure counts.

## Horizontal scrollers and breakpoint behavior

### Verified no document overflow

The current regression matrix is strong: 13 widths, Position + Overall, zero horizontal document overflow.

### Intentional internal scrolling / compression

Production source intentionally uses internal horizontal scrolling in several places:

- tier navigation uses `overflow-x:auto`
- target chips use a horizontal scroller
- at <=900, What Changed can horizontally scroll
- at <=768, the Position decision strip becomes a horizontal snap/proximity scroller

At <=768 the Overall table reduces/hides lower-priority columns and uses fixed layout/name wrapping instead of forcing document overflow.

This is an **OBSERVATION**, not a defect: the current mobile strategy favors containment by selectively hiding/compressing columns and using bounded local scrollers.

## Touch/click target baseline

Several frequent controls are materially smaller than the project's own 44px action target used in ESPN trust-UX regression coverage:

- desktop toolbar filter buttons: padding 5px 10px around 0.7rem text; no minimum 44px height
- My Draft toolbar control: padding 6px 12px around 0.72rem text
- statusbar reset/destructive-style controls: padding 3px 10px around 0.65rem text
- tier nav buttons: padding 5px 11px around 0.72rem text
- command pressure actions: `min-height: 26px`
- command setup inputs: `height: 27px`, increasing only to 29px <=520px
- target-star affordance: 20x20px desktop, 22x22px <=520px
- mobile command actions are removed by draft-polish, but the remaining frequent targets above still apply

Position player cards are denser than conventional touch controls; the density pass keeps them compact for draft scanning. Exact rendered hit boxes for every player-card breakpoint are not newly measured here.

## Long text / clipping baseline

The layout uses deliberate truncation heavily:

- command status/recommendation player names and reasons use `text-overflow: ellipsis` / nowrap
- recommendation one-line explanation is ellipsized when command details are compact
- awareness headings/chips use ellipsis/nowrap
- position pressure labels can disappear at 769–1080px
- <=520px command recommendation reason is hidden
- <=768 Overall table hides lower-priority columns and permits player-name wrapping

This prevents overflow, but it also means zero-overflow does not equal full-information visibility. Exact frequency of meaningful truncation with real longest player names/labels is **UNVERIFIED** without a fresh rendered inspection.

## Findings

### MEDIUM — High-frequency draft controls contain multiple sub-30px interaction targets

**Evidence:** Current production CSS explicitly defines 20–22px target stars, 26px pressure buttons, and 27–29px command settings inputs; top toolbar/status/tier controls also have compact padding with no large minimum hit-area. Current tests prove containment and function, not target ergonomics.

**Draft-day impact:** Repeated selection under clock pressure is more error-prone on touch and less forgiving for motor precision, especially on phones/tablets. Keyboard shortcuts mitigate only some actions.

**Scope:** Ergonomic friction, not a functional blocker.

### MEDIUM — Persistent desktop/tablet control stack consumes a large fixed vertical budget before player choices

**Evidence:** Header/toolbar/status/nav sticky top offsets reserve 152px before nav top, equal to 14.8–19.0% of the required tablet/desktop viewport heights before nav height is counted. Position view additionally has a sticky 58/66/98px command surface depending on draft state.

**Draft-day impact:** The system prioritizes controls/context over immediate player density. That is defensible, but the baseline shows enough vertical competition to justify a measured implementation review if direct screenshots confirm reduced above-fold player choices.

**Limitation:** Exact total sticky height, first player Y, and above-fold choice count are UNVERIFIED; severity is based on configured persistent geometry and interaction hierarchy, not a guessed pixel total.

### MEDIUM — Low-frequency and destructive controls compete in the same status surface as live draft controls

**Evidence:** The sticky statusbar contains saved-session selection, New Draft, Delete Draft, Taken/Mine marking, Autosave, Mock Audit, Update Rankings, Customize Board, Restore FP Order, and Reset all. At <=900 the statusbar is explicitly allowed to wrap.

**Draft-day impact:** The surface asks the user to visually parse maintenance/session/destructive actions alongside high-frequency marking/status actions. This increases scan competition under time pressure even though destructive operations are behaviorally guarded.

**Limitation:** Exact visual dominance and wrap row count at 900px were not directly rendered in this session.

### MEDIUM — 769–900px is the most structurally stressed responsive band

**Evidence:** At <=900 the sticky statusbar can wrap. Between 769–900 the command bar simultaneously changes from a single-row multi-column desktop layout into a multi-row grid: pressure moves to a second row while setup/actions occupy dedicated grid positions. At <=768 the system instead switches to a simpler mobile/static composition.

**Draft-day impact:** Tablet/landscape widths immediately above the mobile breakpoint carry more simultaneous persistent information than the phone layout and are the most plausible zone for vertical crowding/scan friction.

**Limitation:** Existing overflow tests prove this band is horizontally contained (including 820 and 900 widths) but do not measure vertical overlap or visual scan cost. Any claim of actual overlap remains UNVERIFIED.

### LOW — Dense typography and ellipsis preserve containment at the cost of secondary-detail visibility

**Evidence:** Command/awareness surfaces use many ~0.4–0.7rem text sizes, nowrap/ellipsis, hidden pressure labels at narrower tablet widths, and hidden recommendation reason <=520px.

**Draft-day impact:** Primary names/state remain available, but explanation/secondary context can require inference or be absent at narrow widths. This is lower impact than target size and chrome hierarchy because the product intentionally prioritizes concise live-draft scanning.

### OBSERVATION — Mobile containment strategy is already strong and should be preserved

**Evidence:** Top-level desktop sticky layers are removed on narrow phones except toolbar; command bar becomes static; Position decision cards use a bounded local scroller; Overall removes lower-value columns; runtime tests verify zero document overflow at mobile widths, including an exact 390x844 path.

This is a current strength, not a redesign request.

### OBSERVATION — Position Tiers already reduces decision cost compared with the full Overall table

**Evidence:** It is the default view; primary columns are WR/RB/QB/TE with K/DST endgame; the command bar exposes recommendation and pressure without opening secondary Intel; one-click position filtering and one-click board switching are verified.

This decision-focused hierarchy should be treated as baseline value to preserve unless future evidence disproves it.

## Explicitly UNVERIFIED items

The following required items cannot be truthfully converted into exact live metrics from current evidence:

1. exact sticky chrome total height at every required viewport
2. exact first player-card/row Y coordinate at every required viewport
3. exact number of primary player choices visible above fold
4. exact scroll distance from recommendation to board and from board to My Draft roster needs
5. exact visible truncation/clipping for the longest real player names/labels at each required viewport
6. exact visual overlap (if any) between wrapped statusbar and fixed sticky nav offsets around 769–900px
7. exact 1440x900 horizontal-overflow/browser-error result; 1440 is not in the checked-in responsive suite
8. exact 1280x800, 430x932, 375x812, 320x700, and 768x1024 geometry; current responsive suite verifies those widths mostly at 900px height, not all requested heights
9. keyboard tab-order timing/number of Tab presses across the entire toolbar/status surface; focus styles exist, but a complete keyboard traversal was not captured
10. visual behavior of live ESPN sync attention/error states at every required viewport; sync UX has separate responsive regression coverage, but this audit did not reproduce authenticated live states
11. customization/edit-mode layout at the entire required viewport matrix
12. multiple-session statusbar wrapping in a newly rendered visual test

These are evidence gaps, not presumed defects.

## Areas already efficient / worth preserving

- Position Tiers as the default decision-focused view.
- One-action switch between Position and Overall.
- Search and position filters remain permanently discoverable.
- Taken/Mine mode is explicit and has keyboard shortcut support.
- Recommendation + positional pressure are consolidated into the command bar instead of requiring multiple Intel panels.
- Waiting/Near/On-the-Clock use composition/scale changes, not color alone.
- Mobile deliberately sheds sticky layers and avoids document-level horizontal overflow.
- Overall mobile view hides lower-priority columns rather than forcing the whole page sideways.
- My Draft has Summary/Lineup separation rather than presenting the full report at all times.
- Destructive draft/session actions have behavioral guards even though their visual placement is crowded.
- Current regression coverage is unusually strong for containment: 13 widths × 2 board views plus targeted 390x844 paths.

## First-pass conclusion

No CRITICAL or HIGH current layout defect is proven by the available evidence. The current product is functionally robust and horizontally contained across a broad matrix. The strongest independent evidence for future layout consideration is **efficiency/ergonomics rather than breakage**:

1. reduce risk from sub-30px high-frequency targets,
2. validate/reduce persistent desktop/tablet vertical competition,
3. improve hierarchy between live-draft actions and maintenance/destructive controls,
4. scrutinize the 769–900px responsive band with direct rendered measurements.

A bounded UI improvement milestone is justified for Manager consideration **only after** cross-validating these findings with independent R&D evidence and, ideally, collecting the currently UNVERIFIED exact viewport-height measurements. No broad redesign is justified by this audit alone.
