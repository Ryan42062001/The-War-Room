# Current Phase

State: BUILDING

## Identity

- Phase: WR-P02 — Draft-Day UX & Command Center
- Product owner: Ryan
- Phase branch: `phase/wr-p02-draft-day-ux-command-center`
- Activation baseline: `38d9584273526c7d084e7552f7ebf1841ae74b1a`
- Risk: MEDIUM
- Production deployment: NOT AUTHORIZED
- ESPN write access: NOT AUTHORIZED
- Structured Direct validation: OUT OF SCOPE
- Private ESPN account/session data: PROHIBITED from repository, CI, and shared evidence

## Objective

Make the supported draft-day experience faster and easier to understand under a live pick clock by turning the existing recommendation, turn context, roster need, tier pressure, and ESPN sync/trust signals into one coherent command-center experience without changing ranking authority or recommendation policy.

The phase succeeds when Ryan can understand the current recommendation and its existing tradeoffs in under five seconds on laptop and phone, while degraded/stale/sync states remain truthful and correction/reopen workflows remain safe.

## Scope

- Audit the exact-current draft-day information hierarchy and reuse existing proven command-bar, recommendation, Board Pressure, session, persistence, responsive, and ESPN trust/status behavior rather than rebuilding working systems.
- Reorganize the primary on-the-clock decision surface around:
  - current/next-pick context;
  - recommended player from the existing engine;
  - the engine's existing explanation/timing signals;
  - current roster need;
  - relevant tier/board pressure;
  - ESPN connection/source/progress trust state.
- Make the top actionable decision information immediately legible with progressive disclosure for secondary detail.
- Clarify Board/Pick History fallback, structured/unknown source state, reconnect/lag/stale/degraded status using only evidence the product already has.
- Resolve WR-P01-L01 by labeling `unresolvedPlayerIds` as unresolved structured-observation telemetry and separating it semantically from accepted-ledger conflict/unmatched state while preserving the real count.
- Make Taken/Mine/correction controls and current marking mode obvious and low-friction without changing ownership semantics.
- Preserve and harden user-visible continuity across normal refresh/reopen of the current browser-local saved session.
- Improve truthful error/degraded-state UX directly affecting draft-day decisions.
- Tighten laptop and phone layouts, keyboard behavior, focus/ARIA behavior, and overflow around the command-center experience.
- Add or strengthen focused automated coverage for any changed presentation/state behavior.

## Non-goals

- Recommendation Engine V2, recommendation-weight changes, new scoring factors, new confidence/probability models, or policy retuning.
- League/roster personalization beyond the already supported configuration.
- Pre-draft strategy planning.
- New ranking providers, ranking refresh policy changes, dataset replacement, projections, or player-value authority changes.
- Draft simulator/regression-lab construction beyond focused tests needed for this phase.
- Structured Direct validation or promotion.
- ESPN parsing/transport/ledger-authority redesign.
- New extension permissions, debugger access, ESPN writes, automated drafting, lineup mutation, waiver/trade actions, or account operations.
- Season-long fantasy features.
- Production deployment.
- Reopening WR-P01 or repeating its live ESPN mock merely for UI evidence.

## Ordered implementation objectives

1. Inventory the exact-current laptop and phone command-center behavior and identify only the concrete interaction/clarity gaps that prevent the five-second north-star outcome.
2. Define the smallest coherent command-center information hierarchy using existing engine outputs and existing source/trust signals.
3. Implement the primary decision surface so recommendation, pick/turn context, roster need, and material board/tier pressure are understandable without opening multiple secondary panels.
4. Make ESPN sync/source/trust presentation truthful and concise, including Board/Pick History fallback, lag/reconnect/degraded states, and explicit separation of structured-observation telemetry from accepted-ledger health.
5. Make Taken/Mine/correction state and recovery/reopen continuity clear without changing canonical pick ownership, persistence, or reconciliation semantics.
6. Harden responsive laptop/phone layout, keyboard interactions, focus order, ARIA/live-region behavior, and overflow for the changed command-center surfaces.
7. Add or strengthen focused regressions for every changed behavior and run the relevant existing draft UX, persistence, ESPN sync, and responsive suites.
8. Reach PREVIEW_READY with a concise before/after summary, exact changed-path scope, known limitations, and a whole-phase laptop/phone preview checklist for Ryan.

## Acceptance criteria

- In an active-draft state, the primary command-center surface presents the current pick/next-turn context, existing-engine recommendation, concise existing-engine rationale/timing context, roster need, and material board/tier pressure as one coherent decision experience.
- No UI wording or visual treatment implies that ESPN market timing is player-value authority or that Structured Direct has been validated.
- Board/Pick History fallback is identifiable when it is the active supported source; unknown/degraded/stale/reconnecting states do not masquerade as current/healthy.
- WR-P01-L01 is resolved in presentation: `unresolvedPlayerIds` is labeled as unresolved structured observations (or equally explicit wording), visually/semantically separated from accepted-ledger conflict/unmatched health, and its actual count is preserved.
- Accepted-ledger health, unmatched/conflict state, captured/applied/acknowledged progress, and source mode are not conflated.
- Taken/Mine/current marking mode and correction behavior remain understandable and preserve existing ownership semantics.
- Normal refresh/reopen of a saved local draft preserves canonical draft state and restores a truthful command-center presentation without silently presenting stale sync as fresh.
- Draft-complete mode remains truthful and retires active pressure/recommendation UI in favor of the existing completed-draft experience.
- At representative laptop and phone viewports, the changed primary surfaces have no material horizontal overflow, clipped critical controls, overlapping text/actions, or inaccessible required interaction.
- Existing keyboard behavior, including the safe `M` Taken/Mine shortcut, remains functional unless an explicitly better equivalent is implemented and tested.
- FantasyPros ECR remains player-value authority. ESPN board/ADP remain market-timing inputs only.
- No recommendation weights, ranking dataset, ESPN provider permissions, provider write paths, or Structured Direct authority change.
- Existing board, recommendation, persistence/recovery, ESPN reconciliation, Companion, and responsive regressions remain green.
- Ryan approves the whole-phase laptop/phone preview.
- Exact-head FULL PHASE CI passes.
- Fresh independent MEDIUM-risk phase audit passes before merge.

## Required automated validation

- FAST CI on each pushed phase checkpoint.
- Focused validation must cover the changed surfaces plus relevant existing suites, including as applicable:
  - `npm run test:command-bar`
  - `npm run test:draft-awareness`
  - `npm run test:awareness-live-sync`
  - `npm run test:draft-polish`
  - `npm run test:espn-sync-ux`
  - `npm run test:espn-popup-intrinsic`
  - `npm run test:responsive-overflow`
  - `npm run test:layout-efficiency`
  - `npm run test:layout-efficiency-behavior`
  - `npm run test:phone-decision-view`
  - `npm run test:persistence-recovery`
  - `npm run test:recovery-failures`
  - `npm run test:wr133-companion-war-room-e2e`
- Any changed state/trust behavior requires a deterministic synthetic regression; screenshots alone are not acceptance evidence.
- FULL PHASE CI: exact-head complete `npm test` / browser suite, bounded determinism repeats required by V2.1, and dependency audit.

## Human preview requirements

Ryan reviews the complete phase, preferably against deterministic/local fixture states rather than a new live ESPN mock:

- laptop command-center view during an active draft;
- phone command-center view during an active draft;
- recommendation/turn/need/tier-pressure readability;
- Taken/Mine and correction discoverability;
- Board/Pick History fallback/source wording;
- degraded/stale/reconnecting presentation;
- completed-draft transition;
- refresh/reopen continuity;
- no misleading Direct-mode or probability claims.

The preview should answer the phase decision question: can Ryan understand the current recommendation and its tradeoffs in under five seconds?

## Owner-only verification

None required by default.

WR-P02 does not require a new ESPN mock or private-provider interaction. The phase should use local/synthetic/fixture states and the already accepted WR-P01 fallback boundary evidence.

If implementation appears to require changes to ESPN parsing/transport/ledger authority, extension permissions, or a new provider-side live validation, STOP and return to Manager before proceeding. That would exceed the activated MEDIUM-risk contract and may require a separate HIGH-risk phase/reclassification.

## Exit criteria

- Builder reaches PREVIEW_READY with exact scope and evidence.
- Ryan approves the whole-phase laptop/phone preview and any consolidated punch list is resolved or explicitly accepted.
- Phase Sync completes after preview approval.
- Exact candidate FULL PHASE CI passes.
- Exact candidate is frozen.
- Fresh independent MEDIUM-risk phase audit passes, with remediation/re-audit if required.
- Ryan explicitly authorizes merge of the exact approved target.
- Post-merge FAST passes.
- Closure Sync + closure FAST complete.
- Production remains undeployed unless Ryan separately authorizes deployment.

## Stop conditions

Stop and return to Manager/Product Owner if any proposed work would:

- change FantasyPros/ESPN source authority or ranking datasets;
- materially retune recommendation policy, scoring weights, caps, thresholds, or decision semantics;
- add or validate Structured Direct;
- change ESPN parser/transport/ledger authority rather than presentation of existing truth;
- add extension permissions or any ESPN write/account operation;
- require private ESPN credentials, cookies, tokens, league/draft IDs, account/team names, raw traces, or unredacted diagnostics in repository/shared evidence;
- broaden into WR-P03 recommendation-engine work, WR-P04 personalization, WR-P05 planning, WR-P06 data refresh, or WR-P07 simulator work;
- require a new live ESPN mock merely to prove presentation;
- weaken fail-closed handling of missing/ambiguous identities, malformed picks, conflicts, or stale state;
- require production deployment;
- hit the same material implementation/security/data blocker after three total attempts.
