# WR-029 Pre-Scoring Source Correction — Prior-Team Locator

Status: FROZEN BEFORE ANY ENRICHMENT FAMILY MODEL FIT  
Task: WR-029  
Reason: source-schema validation failure during first guarded scoring attempt

## What failed

The first guarded scoring run passed syntax and all benchmark / WR-021 / WR-023 integrity checks, then stopped while reloading the locked WR-025 Player Summary Stats source because the implementation expected a historical `team` column in `stats_player_regpost_2012.csv`.

That column is not present in the locked Player Summary Stats schema.

The run terminated before:
- loading or aggregating the locked PBP family for model use;
- fitting any enriched Ridge model;
- calculating any family development metric;
- selecting any family for confirmation;
- inspecting any 2022–2025 WR-029 confirmation result.

Therefore this correction is a source/schema correction made before enrichment evidence exists, not a post-result model adjustment.

## Correction

The sentence in `ADV_CONTEXT_FEATURE_SPEC.md` that identified Player Summary Stats as the source of the player's dominant prior team is superseded by this addendum only.

For target season `Y`, derive the player's dominant prior team exclusively from the already locked, rights-clean **Y-1 regular-season nflverse PBP**:

1. Count player offensive-involvement events by `posteam` in Y-1:
   - QB dropback with matching `passer_player_id`;
   - pass target with matching `receiver_player_id`;
   - non-kneel rush with matching `rusher_player_id`.
2. Sum those event counts within `(player_id, team)`.
3. Choose the team with the greatest count.
4. Resolve an exact count tie by lexical normalized team code.
5. If no qualifying Y-1 PBP involvement exists, the prior team is missing; team-dependent features remain missing and are handled by the frozen coverage/imputation rules.

Team-code normalization is deterministic only for historical franchise aliases already needed for cross-season continuity (`LA/STL -> LAR`, `SD -> LAC`, `OAK -> LV`, `JAC -> JAX`).

## Feature semantics after correction

The change is intentionally narrow:

- **Player efficiency/regression features** remain calculated over all of the player's locked Y-1 regular-season PBP events, regardless of team. This preserves season-level player efficiency semantics.
- **Player opportunity/share features with team denominators** use only the player's Y-1 events while on the selected dominant prior team, so numerator and denominator refer to the same team context.
- **Team environment / offensive-line proxy / concentration features** use the selected dominant Y-1 team.
- **Target-Y team, roster, depth chart, transaction, current-team or status fields are not used.**
- A traded player's target-Y team is not inferred or reconstructed.

## Why this passes the existing provenance contract

The replacement locator uses no new source family. It uses the same exact PBP assets already byte/schema locked before scoring, and only completed Y-1 REG events whose event time predates the target-season Sep-1 cutoff.

Rights basis remains nflverse/nflverse-data CC BY 4.0.

The fixed family feature definitions, development/confirmation split, Ridge alpha, family order, adoption gates, warning gate, coverage rules, bootstrap seed, and frozen prospective hashes are unchanged.

## No route/YPRR change

This correction does not introduce participation, snaps, routes, route inference, target-per-route or YPRR.

## Outcome / production boundary

- 2026 outcomes inspected: NO
- WR-021 snapshot modified: NO
- WR-023 protocol/manifest modified: NO
- production rankings modified: NO
