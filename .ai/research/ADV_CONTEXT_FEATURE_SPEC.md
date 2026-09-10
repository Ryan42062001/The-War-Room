# WR-029 Advanced Context — Frozen Feature Family Specification

Status: FROZEN BEFORE ENRICHMENT SCORING  
Task: WR-029

All features below are calculated from target season `Y-1` regular-season play-by-play or immutable metadata unless explicitly stated. No target-season Week 1+ input is allowed.

## Shared derivation rules

- `dropback`: nflfastR `qb_dropback == 1`.
- `team_rush`: `rush_attempt == 1` and `qb_kneel != 1`.
- `target`: passing play with non-null `receiver_player_id`; receiver-target denominators use those target rows.
- `player carry`: non-kneel rush with matching `rusher_player_id`.
- red zone: `yardline_100 <= 20`.
- inside 10: `yardline_100 <= 10`.
- inside 5: `yardline_100 <= 5`.
- explosive rush: non-kneel rush with `yards_gained >= 10`.
- stuff: non-kneel rush with `yards_gained <= 0`.
- deep pass: pass attempt with `air_yards >= 15`.
- neutral situation: `abs(score_differential) <= 7`, excluding fourth down; this is a descriptive fixed filter, not a learned PROE model.
- short yardage: down in `{3,4}` with `ydstogo <= 2`.
- top-two concentration: sum of two largest observed player shares within a team/season; absent second player contributes zero.
- HHI: sum of squared player shares within team/season.
- dominant prior team for a player: Y-1 Player Summary Stats team row with greatest recorded games, ties by greater PPR then lexical team. This is lagged team context, **not** the player's target-Y team. If unavailable, team-family fields are missing and handled by explicit missing indicators + training-only imputation.

## OPPORTUNITY_ROLE

Player-level:
- `opp_target_share_pbp = player_targets / team_targets`
- `opp_targets_per_dropback = player_targets / team_dropbacks`
- `opp_carry_share = player_non_kneel_carries / team_non_kneel_carries`
- `opp_air_yards_share = player_air_yards / team_air_yards` when team air-yards denominator magnitude >= 20; otherwise missing
- `opp_adot = player_air_yards / player_targets` when targets > 0; otherwise missing
- `opp_rz_target_share`
- `opp_rz_carry_share`
- `opp_i10_target_share`
- `opp_i10_carry_share`
- `opp_i5_target_share`
- `opp_i5_carry_share`
- `opp_third_down_target_share`
- `opp_two_min_target_share` (`half_seconds_remaining <= 120`)
- `opp_qb_rz_rush_share` for QBs via player rush rows; zero/structurally irrelevant for non-QB position-specific models

Team concentration inherited from dominant prior team:
- `opp_team_target_hhi`
- `opp_team_target_top2_share`
- `opp_team_carry_hhi`
- `opp_team_carry_top2_share`

No snap, participation or route denominator enters this family.

## EFFICIENCY_REGRESSION

Player receiving:
- `eff_rec_epa_per_target`
- `eff_rec_success_rate`
- `eff_yards_per_target`
- `eff_catch_rate`
- `eff_yac_per_target`
- `eff_rec_td_per_target`
- `eff_rz_rec_td_per_rz_target`

Player rushing:
- `eff_rush_epa_per_carry`
- `eff_rush_success_rate`
- `eff_explosive_run_rate`
- `eff_stuff_rate`
- `eff_rush_td_per_carry`
- `eff_rz_rush_td_per_rz_carry`

QB:
- `eff_qb_epa_per_dropback` using `qb_epa` where available, otherwise play `epa`
- `eff_qb_success_rate`
- `eff_qb_cpoe` mean on pass attempts where CPOE is present
- `eff_qb_adot`
- `eff_qb_deep_attempt_rate`
- `eff_qb_scramble_rate`
- `eff_qb_designed_rush_rate` = non-kneel QB rushes not marked `qb_scramble`, divided by dropbacks + those designed rushes

Shrinkage:
- rate/mean features with player denominator `< 5` are missing rather than treated as zero;
- for denominator >=5, numeric value is used directly; Ridge regularization remains the only model shrinkage.
- each feature receives a paired `_missing` indicator in the model matrix when it has any missing values; numeric missing values are imputed by the training-fold position median only.

## QB_TEAM_ENVIRONMENT

Lagged dominant-team Y-1 features:
- `team_plays_per_game` = qualifying dropbacks + non-kneel rushes per distinct REG game
- `team_pass_rate` = dropbacks / (dropbacks + non-kneel rushes)
- `team_neutral_pass_rate` under the fixed neutral filter
- `team_epa_per_play`
- `team_success_rate`
- `team_rz_plays_per_game`
- `team_qb_dropback_hhi` across QBs
- `team_top_qb_dropback_share`

QB-only decomposition appended in this family:
- `qb_scramble_share_of_dropbacks`
- `qb_designed_rush_share_of_qb_opportunities`
- `qb_rz_rush_share_team`
- `qb_i5_rush_share_team`

No target-Y team-change flag is created because no admitted historical Sep-1 roster source exists in WR-029.

## OL_ENVIRONMENT

Lagged dominant-team Y-1 PBP proxies. They are explicitly called offensive-environment proxies, **not OL grades**:
- `ol_sack_rate = sacks / dropbacks`
- `ol_non_kneel_rush_epa_per_carry`
- `ol_non_kneel_rush_success_rate`
- `ol_stuff_rate`
- `ol_explosive_run_rate`
- `ol_short_yardage_success_rate`
- `ol_goal_to_go_success_rate`

No PFR snap, lineup, pressure, pass-block grade or proprietary personnel grade is used.

## AGE_DRAFT_INTERACTIONS

Derived only from already-admitted baseline fields, position-specific Ridge models:
- `ctx_age_sq = age_sep1^2`
- `ctx_experience_sq = experience_years^2`
- `ctx_age_x_weighted_ppr = age_sep1 * weighted_ppr_pg`
- `ctx_age_x_ppr_delta = age_sep1 * ppr_delta`
- `ctx_experience_x_ppr_delta = experience_years * ppr_delta`
- `ctx_draft_decay = drafted * log_draft_pick / (1 + experience_years)`
- `ctx_draft_x_weighted_ppr = drafted * log_draft_pick * weighted_ppr_pg`

Rookies remain excluded from this returning-player family.

## PIT_DEPTH_ROSTER

No model features are created unless a pre-scoring audit passes historical target-preseason rights/PIT/coverage. The source review already identifies a hard issue: <=2024 depth data lacks the 2025+ explicit timestamp semantics and the source changes from NFL Data Exchange to ESPN. Weekly roster/depth records observed at Week 1 are later than the fixed Sep-1 cutoff.

Expected disposition absent stronger evidence: `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE`.

## SHORT_HISTORY_SCHEME

FTN Data via nflverse, lagged dominant prior team, descriptive target seasons 2023–2025 only:
- `scheme_motion_rate`
- `scheme_play_action_rate`
- `scheme_rpo_rate`
- `scheme_no_huddle_rate`
- `scheme_shotgun_rate` (`qb_location == 'S'`)
- `scheme_pistol_rate` (`qb_location == 'P'`)
- `scheme_screen_rate`
- `scheme_mean_defenders_box`

These are team-level lagged scheme context. No route counts/YPRR are generated.

Because this family cannot supply the frozen 2018–2021 development window and has at most three scored target seasons without 2026 outcomes, it is ineligible for `CORE MODEL SUPPORTED` in WR-029. It may be reported as warning/explanation-only or insufficient evidence based on descriptive challenger results.

## STAFF_CONTINUITY

No features unless a rights-clean corpus distinguishes HC, OC and actual play caller with dated target-preseason coverage. OC name is never treated as synonymous with play caller.

Expected disposition absent such corpus: `EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE`.

## Imputation and coverage

For every appended family feature:
- retain raw missing flag;
- within each rolling fold/position, numeric missing values are filled using the **training-only position median**;
- if the training feature is entirely missing, fill zero and mark coverage failure;
- missing source rows are never silently interpreted as zero activity unless zero is semantically proven (e.g. a counted event with a known player/team denominator).

## Selection discipline

The exact feature lists above are frozen. No field is added/removed after development results except by an explicit failure of source/schema/PIT validation, which must be reported as an exclusion rather than replaced by a new opportunistic feature.
