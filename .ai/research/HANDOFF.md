# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-012
Role: Research & Development (R&D)
Status: COMPLETE — READY FOR MANAGER SYNTHESIS
Parallel Work Wave: PW-001

## Verified starting state

- WR-012 starting SHA: `8df161ba8c5413b0cc3c11f87041c4ad80046dc0`
- project mode: MAINTENANCE / STABLE — bounded discovery active
- production implementation authorization: NONE
- WR-013 was assigned independently in parallel
- R&D first-pass findings were completed without reading WR-013's final audit

## Current milestone

PW-001 — Layout Efficiency Discovery.

Canonical `main` has since advanced to `86870ec0215ad0616d5dfd02d016a68c6f1b40a3`.

Canonical state now records:
- WR-013: COMPLETE
- WR-012: still ACTIVE until this R&D evidence is integrated/reconciled by Manager
- WR-014: QUEUED — NOT ACTIVE, with a hard R&D-resource dependency on WR-012 completion

R&D has not switched to WR-014.

## Work completed

Produced `.ai/research/LAYOUT_EFFICIENCY_DISCOVERY.md` with:
- current-layout inventory and evidence classification
- authoritative external UX/accessibility research
- first-1–3-second draft-task hierarchy
- desktop/tablet/mobile analysis
- static/nominal sticky-geometry analysis with runtime limitations explicitly labeled
- seven concrete improvement candidates scored by user value, draft-day speed, evidence, complexity, regression risk, and accessibility impact
- explicit top-three recommendations
- component-level before/after information hierarchy
- areas to preserve and changes to avoid
- validation plan for any future implementation

No production implementation or prototype was committed.

## Highest-confidence R&D findings

VERIFIED FACT:
- Position Tiers is already the correct default foundation and has a deliberate density pass.
- the command bar is already the primary Position-view decision surface.
- legacy duplicate Draft Position / Recommended Pick / Board Pressure cards are hidden once command presentation is ready.
- header, toolbar, and statusbar use independent sticky positioning; toolbar/status can wrap.
- statusbar mixes high-frequency Taken/Mine controls with low-frequency session, maintenance, ranking, customization, audit, restore, and destructive actions.
- Teams/Pick/Rounds remain permanently visible in the command bar.
- command bar is sticky above 768px but static at/below 768px.
- existing responsive coverage proves zero horizontal document overflow, not vertical sticky overlap/focus obscuration.

STRONG EVIDENCE:
- narrow-screen persistent priority is mismatched: utility/setup chrome can remain sticky while the live turn/recommendation surface scrolls away.
- fixed sticky offsets are structurally fragile when wrapping changes actual heights.
- low-frequency/destructive controls receive too much persistent peer prominence.
- a broad redesign is not justified; the best opportunities are bounded IA refinements.

UNVERIFIED / REQUIRES RUNTIME CONFIRMATION:
- exact overlap/occlusion pixels at the required viewports
- actual first-player y-coordinate / above-fold board count
- keyboard-focus obscuration under sticky surfaces

R&D attempted disposable exact-main runtime measurement, but this environment could not obtain a local current-tree checkout. No runtime geometry was fabricated.

## Decisions made by R&D

These are recommendations for Manager synthesis, not production decisions:

1. Coordinated persistent decision surface / sticky-stack repair — highest priority.
2. Progressive disclosure for maintenance/destructive controls into a clear secondary Manage/Tools surface.
3. Collapse Draft Setup after initialization/progress to a concise summary plus explicit Edit action.

Secondary candidates:
- effective touch-target hardening
- device-specific composition instead of simple wrapping
- clearer separation of command / decision / awareness jobs
- responsive toolbar/filter compaction

## Areas to preserve

- Position Tiers default and multi-column density
- Overall view
- Waiting / Near / On-the-Clock command-state model
- explicit Taken / Mine mode
- global search
- My Draft progressive disclosure
- compact K/DST endgame
- quiet healthy ESPN trust state and actionable attention state
- zero-horizontal-overflow regression
- presentation-only consumption of authoritative scoring/recommendation/state outputs

## Files updated

- `.ai/research/LAYOUT_EFFICIENCY_DISCOVERY.md`
- `.ai/research/HANDOFF.md`

Production files changed: NO
Production UI changed: NO
Scoring/rankings/recommendations changed: NO
ESPN sync/state semantics changed: NO
Canonical `.ai/shared/*` changed by R&D: NO

## Open findings

Runtime geometry should be measured before any Builder implementation is approved, especially at:
- 320x700
- 375x812
- 390x844
- 430x932
- 768x1024
- 900x900
- 1280x800
- 1440x900

Future validation should include sticky-union height, actionable overlap, focus-not-obscured, visible board height, command persistence, effective target sizing, long labels, My Draft, Overall/edit mode, command states, sync-attention state, and page/runtime errors.

## Blocking issues

None for WR-012 R&D completion.

Manager synthesis is now possible once this R&D evidence is available alongside the already-completed WR-013 audit.

## Recommended next role

Manager / Architect.

## Exact next action

Manager should review the WR-012 R&D evidence alongside WR-013, reconcile agreement/disagreement with runtime evidence, and decide whether PW-001 justifies a bounded production UI task. Builder remains unassigned until Manager explicitly authorizes one.

WR-014 remains queued and must not activate until Manager closes/reconciles WR-012 and explicitly activates WR-014.

## Checkpoint / SHA

- WR-012 starting SHA: `8df161ba8c5413b0cc3c11f87041c4ad80046dc0`
- R&D first-pass production/UI inspection checkpoint: `cc9380de5879db1d32530bad0d05e2b1a635e81f`
- latest verified canonical `main`: `86870ec0215ad0616d5dfd02d016a68c6f1b40a3`
- R&D branch: `wr-012-research-layout-efficiency`
