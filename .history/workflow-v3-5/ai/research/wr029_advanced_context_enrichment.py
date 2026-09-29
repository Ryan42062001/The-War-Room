from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from scipy.stats import spearmanr
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import brier_score_loss, mean_absolute_error, mean_squared_error, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[2]
RESEARCH = ROOT / ".ai" / "research"
OUT = RESEARCH / "generated"
OUT.mkdir(parents=True, exist_ok=True)

STARTING_MAIN = "b89919121cfcc00fc9a02be5d82c1a892036e70b"
LOCK_SHA256 = "a93c1ce6d04c10e262d245858a7b5dfd07bb6eb98e5d1a0cb38cf877c846261e"
MAX_OUTCOME_SEASON = 2025
DEV_SEASONS = [2018, 2019, 2020, 2021]
CONFIRM_SEASONS = [2022, 2023, 2024, 2025]
ALL_SCORE_SEASONS = DEV_SEASONS + CONFIRM_SEASONS
POSITIONS = ["QB", "RB", "WR", "TE"]
TOP_N = {"QB": 12, "RB": 24, "WR": 36, "TE": 12}
CATASTROPHIC = {"QB": 12, "RB": 24, "WR": 24, "TE": 12}
RIDGE_ALPHA = 100.0
BOOT_REPS = 5000
BOOT_SEED = 29029
LOGIT_SEED = 29030
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "war-room-wr029-enrichment", "Accept": "application/vnd.github+json"})

FROZEN = {
    RESEARCH / "generated" / "CONTEXT_SHADOW_2026_SNAPSHOT.csv": "9e100543d90ce20286a102618e0f244a90090785b456fb9493791cbba5dd0a6d",
    RESEARCH / "WR023_2026_PROSPECTIVE_EVALUATION_PROTOCOL.md": "f6ef7484c28bafce45f0e841fc1cee0b67860c7741d0c8d4038248957e43a32c",
}

TEAM_ALIAS = {"LA": "LAR", "STL": "LAR", "SD": "LAC", "OAK": "LV", "JAC": "JAX"}

OPP_COMMON_REC = [
    "opp_target_share_pbp", "opp_targets_per_dropback", "opp_air_yards_share", "opp_adot",
    "opp_rz_target_share", "opp_i10_target_share", "opp_i5_target_share",
    "opp_third_down_target_share", "opp_two_min_target_share",
    "opp_team_target_hhi", "opp_team_target_top2_share",
]
OPP_RB_EXTRA = [
    "opp_carry_share", "opp_rz_carry_share", "opp_i10_carry_share", "opp_i5_carry_share",
    "opp_team_carry_hhi", "opp_team_carry_top2_share",
]
OPP_QB = [
    "opp_qb_rz_rush_share", "opp_i10_carry_share", "opp_i5_carry_share",
    "opp_team_target_hhi", "opp_team_target_top2_share", "opp_team_carry_hhi", "opp_team_carry_top2_share",
]

EFF_REC = [
    "eff_rec_epa_per_target", "eff_rec_success_rate", "eff_yards_per_target", "eff_catch_rate",
    "eff_yac_per_target", "eff_rec_td_per_target", "eff_rz_rec_td_per_rz_target",
]
EFF_RUSH = [
    "eff_rush_epa_per_carry", "eff_rush_success_rate", "eff_explosive_run_rate", "eff_stuff_rate",
    "eff_rush_td_per_carry", "eff_rz_rush_td_per_rz_carry",
]
EFF_QB = [
    "eff_qb_epa_per_dropback", "eff_qb_success_rate", "eff_qb_cpoe", "eff_qb_adot",
    "eff_qb_deep_attempt_rate", "eff_qb_scramble_rate", "eff_qb_designed_rush_rate",
] + EFF_RUSH

TEAM_COMMON = [
    "team_plays_per_game", "team_pass_rate", "team_neutral_pass_rate", "team_epa_per_play",
    "team_success_rate", "team_rz_plays_per_game", "team_qb_dropback_hhi", "team_top_qb_dropback_share",
]
TEAM_QB_EXTRA = [
    "qb_scramble_share_of_dropbacks", "qb_designed_rush_share_of_qb_opportunities",
    "qb_rz_rush_share_team", "qb_i5_rush_share_team",
]

OL_FEATURES = [
    "ol_sack_rate", "ol_non_kneel_rush_epa_per_carry", "ol_non_kneel_rush_success_rate",
    "ol_stuff_rate", "ol_explosive_run_rate", "ol_short_yardage_success_rate", "ol_goal_to_go_success_rate",
]
AGE_FEATURES = [
    "ctx_age_sq", "ctx_experience_sq", "ctx_age_x_weighted_ppr", "ctx_age_x_ppr_delta",
    "ctx_experience_x_ppr_delta", "ctx_draft_decay", "ctx_draft_x_weighted_ppr",
]
SCHEME_FEATURES = [
    "scheme_motion_rate", "scheme_play_action_rate", "scheme_rpo_rate", "scheme_no_huddle_rate",
    "scheme_shotgun_rate", "scheme_pistol_rate", "scheme_screen_rate", "scheme_mean_defenders_box",
]

FAMILY_ORDER = [
    "OPPORTUNITY_ROLE", "EFFICIENCY_REGRESSION", "QB_TEAM_ENVIRONMENT", "OL_ENVIRONMENT",
    "AGE_DRAFT_INTERACTIONS", "PIT_DEPTH_ROSTER", "SHORT_HISTORY_SCHEME", "STAFF_CONTINUITY",
]
DIRECT_LONG_HISTORY = FAMILY_ORDER[:5]
SOURCE_EXCLUDED = {
    "PIT_DEPTH_ROSTER": "EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE",
    "STAFF_CONTINUITY": "EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE",
}


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def norm_team(v):
    if v is None or pd.isna(v):
        return None
    s = str(v).strip().upper()
    return TEAM_ALIAS.get(s, s) if s else None


def norm_id(v):
    if v is None or pd.isna(v):
        return None
    s = str(v).strip()
    return s if s and s.lower() != "nan" else None


def num_series(df, name, default=0.0):
    if name not in df.columns:
        return pd.Series(default, index=df.index, dtype=float)
    return pd.to_numeric(df[name], errors="coerce").fillna(default)


def bool_series(df, name):
    return num_series(df, name, 0.0).eq(1.0)


def safe_div(a, b):
    if b is None or not np.isfinite(b) or abs(float(b)) < 1e-12:
        return np.nan
    return float(a) / float(b)


def hhi_top2(counts: dict[str, int]):
    total = float(sum(counts.values()))
    if total <= 0:
        return np.nan, np.nan
    shares = sorted((v / total for v in counts.values()), reverse=True)
    return float(sum(x * x for x in shares)), float(sum(shares[:2]))


def import_wr025():
    path = RESEARCH / "wr025_historical_ranking_signals.py"
    spec = importlib.util.spec_from_file_location("wr025", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot import WR-025")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def verify_integrity():
    lock_path = OUT / "ADV_CONTEXT_BENCHMARK_LOCK.json"
    if sha256_file(lock_path) != LOCK_SHA256:
        raise RuntimeError("benchmark/source lock hash changed")
    for path, expected in FROZEN.items():
        actual = sha256_file(path)
        if actual != expected:
            raise RuntimeError((str(path), actual, expected))
    return json.loads(lock_path.read_text())


def download_locked_asset(asset: dict) -> bytes:
    name = asset["asset_name"]
    if "2026" in name and ("play_by_play" in name or "stats_player" in name or "ftn_charting" in name):
        raise RuntimeError(f"forbidden 2026 asset path: {name}")
    r = SESSION.get(asset["browser_download_url"], timeout=240)
    r.raise_for_status()
    payload = r.content
    sha = sha256_bytes(payload)
    if sha != asset["sha256"]:
        raise RuntimeError(f"locked asset drift {name}: {sha} != {asset['sha256']}")
    return payload


def load_benchmark_data(wr025, lock):
    expected = {r["asset_name"]: r for r in lock["benchmark_source_verification"]}
    stats_rel, stats_assets = wr025.release_assets(wr025.STATS_TAG)
    players_rel, players_assets = wr025.release_assets(wr025.PLAYERS_TAG)
    draft_rel, draft_assets = wr025.release_assets(wr025.DRAFT_TAG)
    by_season = {}
    dominant_team = defaultdict(dict)
    source_check = []

    for season in wr025.STAT_SEASONS:
        if season > MAX_OUTCOME_SEASON:
            raise RuntimeError("stats outcome season >2025")
        name = f"stats_player_regpost_{season}.csv"
        asset = stats_assets[name]
        payload, sha = wr025.download_asset(asset)
        if sha != expected[name]["sha256"]:
            raise RuntimeError(f"benchmark source drift: {name}")
        rows, _, _ = wr025.aggregate_stats(season, payload)
        by_season[season] = rows
        raw = pd.read_csv(io.BytesIO(payload), low_memory=False)
        if "team" not in raw.columns:
            raise RuntimeError(f"stats asset {name} lacks team column")
        use = raw[(raw["season_type"].astype(str).str.upper() == "REG") & raw["position"].astype(str).str.upper().isin(POSITIONS)].copy()
        use["games_num"] = pd.to_numeric(use["games"], errors="coerce").fillna(0)
        use["ppr_num"] = pd.to_numeric(use["fantasy_points_ppr"], errors="coerce").fillna(0)
        use["team_norm"] = use["team"].map(norm_team)
        use = use[use["player_id"].notna() & use["team_norm"].notna()]
        for pid, g in use.groupby("player_id"):
            g = g.sort_values(["games_num", "ppr_num", "team_norm"], ascending=[False, False, True], kind="mergesort")
            dominant_team[season][str(pid)] = str(g.iloc[0]["team_norm"])
        source_check.append({"season": season, "asset_name": name, "sha256": sha})

    p_asset = players_assets["players.csv"]
    p_payload, p_sha = wr025.download_asset(p_asset)
    d_asset = draft_assets["draft_picks.csv"]
    d_payload, d_sha = wr025.download_asset(d_asset)
    if p_sha != expected["players.csv"]["sha256"] or d_sha != expected["draft_picks.csv"]["sha256"]:
        raise RuntimeError("players/draft benchmark source drift")
    players, _, _, _ = wr025.load_players(p_payload)
    drafts_by_season, draft_by_player, _, _ = wr025.load_draft_picks(d_payload)
    return by_season, players, drafts_by_season, draft_by_player, dict(dominant_team), source_check


def aggregate_pbp_season(season: int, payload: bytes):
    cols = [
        "game_id", "play_id", "season", "season_type", "week", "posteam", "yardline_100", "half_seconds_remaining",
        "down", "goal_to_go", "ydstogo", "score_differential", "yards_gained", "air_yards", "yards_after_catch",
        "qb_dropback", "qb_kneel", "qb_scramble", "rush_attempt", "pass_attempt", "sack", "complete_pass",
        "touchdown", "pass_touchdown", "rush_touchdown", "passer_player_id", "receiver_player_id", "rusher_player_id",
        "receiving_yards", "epa", "qb_epa", "success", "cpoe",
    ]
    available = set(pd.read_parquet(io.BytesIO(payload), engine="pyarrow", columns=None).columns)
    missing_required = [x for x in ["game_id", "play_id", "season_type", "posteam", "qb_dropback", "rush_attempt", "qb_kneel", "receiver_player_id", "rusher_player_id", "epa", "success"] if x not in available]
    if missing_required:
        raise RuntimeError((season, "PBP required columns absent", missing_required))
    use_cols = [c for c in cols if c in available]
    df = pd.read_parquet(io.BytesIO(payload), columns=use_cols)
    df = df[df["season_type"].astype(str).str.upper().eq("REG")].copy()
    df["posteam_norm"] = df["posteam"].map(norm_team)
    df = df[df["posteam_norm"].notna()].copy()

    for c in ["yardline_100", "half_seconds_remaining", "down", "goal_to_go", "ydstogo", "score_differential", "yards_gained", "air_yards", "yards_after_catch", "receiving_yards", "epa", "qb_epa", "success", "cpoe"]:
        if c not in df.columns:
            df[c] = np.nan
        else:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    drop = bool_series(df, "qb_dropback")
    kneel = bool_series(df, "qb_kneel")
    rush = bool_series(df, "rush_attempt") & ~kneel
    pass_attempt = bool_series(df, "pass_attempt")
    target = pass_attempt & df.get("receiver_player_id", pd.Series(index=df.index, dtype=object)).notna()
    base_play = drop | rush
    rz = df["yardline_100"].le(20)
    i10 = df["yardline_100"].le(10)
    i5 = df["yardline_100"].le(5)
    third = df["down"].eq(3)
    two_min = df["half_seconds_remaining"].le(120)
    neutral = df["score_differential"].abs().le(7) & ~df["down"].eq(4)
    short = rush & df["down"].isin([3, 4]) & df["ydstogo"].le(2)
    goal = rush & df["goal_to_go"].eq(1)
    explosive = rush & df["yards_gained"].ge(10)
    stuff = rush & df["yards_gained"].le(0)

    df["_drop"] = drop.astype(int)
    df["_rush"] = rush.astype(int)
    df["_target"] = target.astype(int)
    df["_base"] = base_play.astype(int)
    df["_rz"] = rz.astype(int)
    df["_i10"] = i10.astype(int)
    df["_i5"] = i5.astype(int)
    df["_third"] = third.astype(int)
    df["_two_min"] = two_min.astype(int)
    df["_neutral"] = neutral.astype(int)
    df["_short"] = short.astype(int)
    df["_goal"] = goal.astype(int)
    df["_explosive"] = explosive.astype(int)
    df["_stuff"] = stuff.astype(int)

    team = {}
    for tm, g in df.groupby("posteam_norm", sort=True):
        gm = int(g["game_id"].nunique())
        gd = g[g["_drop"].eq(1)]
        gr = g[g["_rush"].eq(1)]
        gt = g[g["_target"].eq(1)]
        gb = g[g["_base"].eq(1)]
        target_counts = {str(k): int(v) for k, v in gt["receiver_player_id"].dropna().astype(str).value_counts().items()}
        carry_counts = {str(k): int(v) for k, v in gr["rusher_player_id"].dropna().astype(str).value_counts().items()}
        qb_counts = {str(k): int(v) for k, v in gd["passer_player_id"].dropna().astype(str).value_counts().items()}
        target_hhi, target_top2 = hhi_top2(target_counts)
        carry_hhi, carry_top2 = hhi_top2(carry_counts)
        qb_hhi, qb_top = hhi_top2(qb_counts)
        neutral_g = g[g["_neutral"].eq(1)]
        neutral_drop = int(neutral_g["_drop"].sum())
        neutral_rush = int(neutral_g["_rush"].sum())
        rz_plays = int((g["_base"].eq(1) & g["_rz"].eq(1)).sum())
        short_g = g[g["_short"].eq(1)]
        goal_g = g[g["_goal"].eq(1)]
        team[str(tm)] = {
            "games": gm,
            "dropbacks": int(g["_drop"].sum()),
            "rushes": int(g["_rush"].sum()),
            "targets": int(g["_target"].sum()),
            "air_yards": float(gt["air_yards"].fillna(0).sum()),
            "rz_targets": int((g["_target"].eq(1) & g["_rz"].eq(1)).sum()),
            "i10_targets": int((g["_target"].eq(1) & g["_i10"].eq(1)).sum()),
            "i5_targets": int((g["_target"].eq(1) & g["_i5"].eq(1)).sum()),
            "rz_carries": int((g["_rush"].eq(1) & g["_rz"].eq(1)).sum()),
            "i10_carries": int((g["_rush"].eq(1) & g["_i10"].eq(1)).sum()),
            "i5_carries": int((g["_rush"].eq(1) & g["_i5"].eq(1)).sum()),
            "third_targets": int((g["_target"].eq(1) & g["_third"].eq(1)).sum()),
            "two_min_targets": int((g["_target"].eq(1) & g["_two_min"].eq(1)).sum()),
            "target_hhi": target_hhi,
            "target_top2": target_top2,
            "carry_hhi": carry_hhi,
            "carry_top2": carry_top2,
            "plays": int(g["_base"].sum()),
            "neutral_pass_rate": safe_div(neutral_drop, neutral_drop + neutral_rush),
            "epa_per_play": float(gb["epa"].dropna().mean()) if gb["epa"].notna().any() else np.nan,
            "success_rate": float(gb["success"].dropna().mean()) if gb["success"].notna().any() else np.nan,
            "rz_plays": rz_plays,
            "qb_hhi": qb_hhi,
            "top_qb_share": qb_top,
            "sacks": int(bool_series(gd, "sack").sum()) if not gd.empty else 0,
            "rush_epa": float(gr["epa"].dropna().mean()) if gr["epa"].notna().any() else np.nan,
            "rush_success": float(gr["success"].dropna().mean()) if gr["success"].notna().any() else np.nan,
            "stuff_rate": safe_div(int(gr["_stuff"].sum()), len(gr)),
            "explosive_rate": safe_div(int(gr["_explosive"].sum()), len(gr)),
            "short_success": float(short_g["success"].dropna().mean()) if short_g["success"].notna().any() else np.nan,
            "goal_success": float(goal_g["success"].dropna().mean()) if goal_g["success"].notna().any() else np.nan,
        }

    rec = {}
    gt = df[df["_target"].eq(1)].copy()
    for pid, g in gt.groupby("receiver_player_id"):
        pid = str(pid)
        rec[pid] = {
            "targets": int(len(g)),
            "air_yards": float(g["air_yards"].fillna(0).sum()),
            "rz_targets": int(g["_rz"].sum()),
            "i10_targets": int(g["_i10"].sum()),
            "i5_targets": int(g["_i5"].sum()),
            "third_targets": int(g["_third"].sum()),
            "two_min_targets": int(g["_two_min"].sum()),
            "epa_mean": float(g["epa"].dropna().mean()) if g["epa"].notna().any() else np.nan,
            "success_mean": float(g["success"].dropna().mean()) if g["success"].notna().any() else np.nan,
            "rec_yards": float(g["receiving_yards"].fillna(g["yards_gained"]).fillna(0).sum()),
            "complete": int(bool_series(g, "complete_pass").sum()),
            "yac": float(g["yards_after_catch"].fillna(0).sum()),
            "td": int(bool_series(g, "pass_touchdown").sum()),
            "rz_td": int((bool_series(g, "pass_touchdown") & g["_rz"].eq(1)).sum()),
        }

    rushers = {}
    gr = df[df["_rush"].eq(1)].copy()
    for pid, g in gr.groupby("rusher_player_id"):
        pid = str(pid)
        rushers[pid] = {
            "carries": int(len(g)),
            "rz_carries": int(g["_rz"].sum()),
            "i10_carries": int(g["_i10"].sum()),
            "i5_carries": int(g["_i5"].sum()),
            "epa_mean": float(g["epa"].dropna().mean()) if g["epa"].notna().any() else np.nan,
            "success_mean": float(g["success"].dropna().mean()) if g["success"].notna().any() else np.nan,
            "explosive": int(g["_explosive"].sum()),
            "stuff": int(g["_stuff"].sum()),
            "td": int(bool_series(g, "rush_touchdown").sum()),
            "rz_td": int((bool_series(g, "rush_touchdown") & g["_rz"].eq(1)).sum()),
            "scrambles": int(bool_series(g, "qb_scramble").sum()),
            "designed": int((~bool_series(g, "qb_scramble")).sum()),
        }

    qbs = {}
    gd = df[df["_drop"].eq(1)].copy()
    for pid, g in gd.groupby("passer_player_id"):
        pid = str(pid)
        pa = g[bool_series(g, "pass_attempt")]
        qbs[pid] = {
            "dropbacks": int(len(g)),
            "epa_mean": float(g["qb_epa"].dropna().mean()) if g["qb_epa"].notna().any() else (float(g["epa"].dropna().mean()) if g["epa"].notna().any() else np.nan),
            "success_mean": float(g["success"].dropna().mean()) if g["success"].notna().any() else np.nan,
            "cpoe": float(pa["cpoe"].dropna().mean()) if pa["cpoe"].notna().any() else np.nan,
            "adot": float(pa["air_yards"].dropna().mean()) if pa["air_yards"].notna().any() else np.nan,
            "deep_rate": safe_div(int(pa["air_yards"].ge(15).sum()), int(len(pa))),
            "scrambles": int(bool_series(g, "qb_scramble").sum()),
        }

    play_team = {(str(r.game_id), int(r.play_id)): str(r.posteam_norm) for r in df[["game_id", "play_id", "posteam_norm"]].itertuples(index=False) if pd.notna(r.game_id) and pd.notna(r.play_id)}
    return {"team": team, "rec": rec, "rush": rushers, "qb": qbs}, play_team


def build_pbp_context(lock):
    contexts = {}
    play_maps = {}
    audit = []
    for asset in lock["new_source_locks"]["pbp"]["assets"]:
        season = int(asset["season"])
        if season > MAX_OUTCOME_SEASON:
            raise RuntimeError("PBP >2025 forbidden")
        payload = download_locked_asset(asset)
        ctx, pmap = aggregate_pbp_season(season, payload)
        contexts[season] = ctx
        if season >= 2022:
            play_maps[season] = pmap
        audit.append({
            "source": "pbp", "season": season, "asset_name": asset["asset_name"], "sha256": asset["sha256"],
            "rows_locked": asset["rows"], "schema_sha256": asset["schema_sha256"],
            "teams": len(ctx["team"]), "receivers": len(ctx["rec"]), "rushers": len(ctx["rush"]), "qbs": len(ctx["qb"]),
        })
    return contexts, play_maps, audit


def build_scheme_context(lock, play_maps):
    out = {}
    audit = []
    for asset in lock["new_source_locks"]["ftn_charting"]["assets"]:
        season = int(asset["season"])
        if season > MAX_OUTCOME_SEASON:
            raise RuntimeError("FTN >2025 forbidden")
        payload = download_locked_asset(asset)
        df = pd.read_parquet(io.BytesIO(payload))
        req = ["nflverse_game_id", "nflverse_play_id", "qb_location", "n_defense_box", "is_no_huddle", "is_motion", "is_play_action", "is_screen_pass", "is_rpo", "date_pulled"]
        missing = [c for c in req if c not in df.columns]
        if missing:
            audit.append({"source": "ftn_charting", "season": season, "status": "SCHEMA_FAIL", "missing": missing})
            continue
        pmap = play_maps.get(season, {})
        teams = []
        for r in df.itertuples(index=False):
            try:
                key = (str(getattr(r, "nflverse_game_id")), int(getattr(r, "nflverse_play_id")))
            except Exception:
                teams.append(None)
                continue
            teams.append(pmap.get(key))
        df["posteam_norm"] = teams
        matched = df[df["posteam_norm"].notna()].copy()
        team_rows = {}
        for tm, g in matched.groupby("posteam_norm"):
            def rate(col):
                v = pd.to_numeric(g[col], errors="coerce")
                return float(v.dropna().mean()) if v.notna().any() else np.nan
            loc = g["qb_location"].astype(str).str.upper()
            box = pd.to_numeric(g["n_defense_box"], errors="coerce")
            team_rows[str(tm)] = {
                "scheme_motion_rate": rate("is_motion"),
                "scheme_play_action_rate": rate("is_play_action"),
                "scheme_rpo_rate": rate("is_rpo"),
                "scheme_no_huddle_rate": rate("is_no_huddle"),
                "scheme_shotgun_rate": float(loc.eq("S").mean()),
                "scheme_pistol_rate": float(loc.eq("P").mean()),
                "scheme_screen_rate": rate("is_screen_pass"),
                "scheme_mean_defenders_box": float(box.dropna().mean()) if box.notna().any() else np.nan,
            }
        out[season] = team_rows
        audit.append({
            "source": "ftn_charting", "season": season, "status": "OK", "asset_name": asset["asset_name"],
            "sha256": asset["sha256"], "rows": int(len(df)), "matched_pbp_rows": int(len(matched)),
            "match_rate": float(len(matched) / len(df)) if len(df) else 0.0, "teams": len(team_rows),
            "schema_sha256": asset["schema_sha256"],
        })
    return out, audit


def family_names(family: str, pos: str):
    if family == "OPPORTUNITY_ROLE":
        if pos == "QB":
            return list(OPP_QB)
        if pos == "RB":
            return list(OPP_COMMON_REC + OPP_RB_EXTRA)
        return list(OPP_COMMON_REC)
    if family == "EFFICIENCY_REGRESSION":
        if pos == "QB":
            return list(EFF_QB)
        if pos == "RB":
            return list(EFF_REC + EFF_RUSH)
        return list(EFF_REC)
    if family == "QB_TEAM_ENVIRONMENT":
        return list(TEAM_COMMON + (TEAM_QB_EXTRA if pos == "QB" else []))
    if family == "OL_ENVIRONMENT":
        return list(OL_FEATURES)
    if family == "AGE_DRAFT_INTERACTIONS":
        return list(AGE_FEATURES)
    if family == "SHORT_HISTORY_SCHEME":
        return list(SCHEME_FEATURES)
    return []


def row_feature_map(row, pbp, dominant_team, scheme, baseline_names):
    season = int(row["target_season"])
    prev_season = season - 1
    pid = str(row["player_id"])
    pos = row["position"]
    team = dominant_team.get(prev_season, {}).get(pid)
    ctx = pbp.get(prev_season, {})
    t = ctx.get("team", {}).get(team, {}) if team else {}
    rec = ctx.get("rec", {}).get(pid, {})
    rush = ctx.get("rush", {}).get(pid, {})
    qb = ctx.get("qb", {}).get(pid, {})
    f = {}

    known_team = bool(team and t)
    def team_share(num, den_key):
        if not known_team:
            return np.nan
        den = t.get(den_key, 0)
        if den is None or den <= 0:
            return np.nan
        return float(num) / float(den)

    # Opportunity / role
    f["opp_target_share_pbp"] = team_share(rec.get("targets", 0), "targets")
    f["opp_targets_per_dropback"] = team_share(rec.get("targets", 0), "dropbacks")
    f["opp_carry_share"] = team_share(rush.get("carries", 0), "rushes")
    if known_team and abs(float(t.get("air_yards", 0))) >= 20:
        f["opp_air_yards_share"] = safe_div(rec.get("air_yards", 0), t.get("air_yards"))
    else:
        f["opp_air_yards_share"] = np.nan
    f["opp_adot"] = safe_div(rec.get("air_yards", 0), rec.get("targets", 0))
    for prefix, pk, tk in [
        ("rz", "rz_targets", "rz_targets"), ("i10", "i10_targets", "i10_targets"), ("i5", "i5_targets", "i5_targets")
    ]:
        f[f"opp_{prefix}_target_share"] = team_share(rec.get(pk, 0), tk)
    for prefix, pk, tk in [
        ("rz", "rz_carries", "rz_carries"), ("i10", "i10_carries", "i10_carries"), ("i5", "i5_carries", "i5_carries")
    ]:
        f[f"opp_{prefix}_carry_share"] = team_share(rush.get(pk, 0), tk)
    f["opp_third_down_target_share"] = team_share(rec.get("third_targets", 0), "third_targets")
    f["opp_two_min_target_share"] = team_share(rec.get("two_min_targets", 0), "two_min_targets")
    f["opp_qb_rz_rush_share"] = team_share(rush.get("rz_carries", 0), "rz_carries")
    f["opp_team_target_hhi"] = t.get("target_hhi", np.nan) if known_team else np.nan
    f["opp_team_target_top2_share"] = t.get("target_top2", np.nan) if known_team else np.nan
    f["opp_team_carry_hhi"] = t.get("carry_hhi", np.nan) if known_team else np.nan
    f["opp_team_carry_top2_share"] = t.get("carry_top2", np.nan) if known_team else np.nan

    # Efficiency, denominator >=5 for player rate families.
    nt = int(rec.get("targets", 0))
    nr = int(rush.get("carries", 0))
    nrz_t = int(rec.get("rz_targets", 0))
    nrz_r = int(rush.get("rz_carries", 0))
    nd = int(qb.get("dropbacks", 0))
    if nt >= 5:
        f["eff_rec_epa_per_target"] = rec.get("epa_mean", np.nan)
        f["eff_rec_success_rate"] = rec.get("success_mean", np.nan)
        f["eff_yards_per_target"] = safe_div(rec.get("rec_yards", 0), nt)
        f["eff_catch_rate"] = safe_div(rec.get("complete", 0), nt)
        f["eff_yac_per_target"] = safe_div(rec.get("yac", 0), nt)
        f["eff_rec_td_per_target"] = safe_div(rec.get("td", 0), nt)
    else:
        for name in EFF_REC[:-1]:
            f[name] = np.nan
    f["eff_rz_rec_td_per_rz_target"] = safe_div(rec.get("rz_td", 0), nrz_t) if nrz_t >= 5 else np.nan
    if nr >= 5:
        f["eff_rush_epa_per_carry"] = rush.get("epa_mean", np.nan)
        f["eff_rush_success_rate"] = rush.get("success_mean", np.nan)
        f["eff_explosive_run_rate"] = safe_div(rush.get("explosive", 0), nr)
        f["eff_stuff_rate"] = safe_div(rush.get("stuff", 0), nr)
        f["eff_rush_td_per_carry"] = safe_div(rush.get("td", 0), nr)
    else:
        for name in EFF_RUSH[:-1]:
            f[name] = np.nan
    f["eff_rz_rush_td_per_rz_carry"] = safe_div(rush.get("rz_td", 0), nrz_r) if nrz_r >= 5 else np.nan
    if nd >= 5:
        f["eff_qb_epa_per_dropback"] = qb.get("epa_mean", np.nan)
        f["eff_qb_success_rate"] = qb.get("success_mean", np.nan)
        f["eff_qb_cpoe"] = qb.get("cpoe", np.nan)
        f["eff_qb_adot"] = qb.get("adot", np.nan)
        f["eff_qb_deep_attempt_rate"] = qb.get("deep_rate", np.nan)
        f["eff_qb_scramble_rate"] = safe_div(qb.get("scrambles", 0), nd)
        designed = int(rush.get("designed", 0))
        f["eff_qb_designed_rush_rate"] = safe_div(designed, nd + designed)
    else:
        for name in EFF_QB[:7]:
            f[name] = np.nan

    # Team environment.
    games = t.get("games", 0) if known_team else 0
    total_plays = (t.get("dropbacks", 0) + t.get("rushes", 0)) if known_team else 0
    f["team_plays_per_game"] = safe_div(total_plays, games) if known_team else np.nan
    f["team_pass_rate"] = safe_div(t.get("dropbacks", 0), total_plays) if known_team else np.nan
    f["team_neutral_pass_rate"] = t.get("neutral_pass_rate", np.nan) if known_team else np.nan
    f["team_epa_per_play"] = t.get("epa_per_play", np.nan) if known_team else np.nan
    f["team_success_rate"] = t.get("success_rate", np.nan) if known_team else np.nan
    f["team_rz_plays_per_game"] = safe_div(t.get("rz_plays", 0), games) if known_team else np.nan
    f["team_qb_dropback_hhi"] = t.get("qb_hhi", np.nan) if known_team else np.nan
    f["team_top_qb_dropback_share"] = t.get("top_qb_share", np.nan) if known_team else np.nan
    f["qb_scramble_share_of_dropbacks"] = safe_div(qb.get("scrambles", 0), nd) if nd > 0 else np.nan
    designed = int(rush.get("designed", 0))
    f["qb_designed_rush_share_of_qb_opportunities"] = safe_div(designed, nd + designed) if (nd + designed) > 0 else np.nan
    f["qb_rz_rush_share_team"] = team_share(rush.get("rz_carries", 0), "rz_carries")
    f["qb_i5_rush_share_team"] = team_share(rush.get("i5_carries", 0), "i5_carries")

    # Offensive-environment (not causal OL) proxies.
    f["ol_sack_rate"] = safe_div(t.get("sacks", 0), t.get("dropbacks", 0)) if known_team else np.nan
    f["ol_non_kneel_rush_epa_per_carry"] = t.get("rush_epa", np.nan) if known_team else np.nan
    f["ol_non_kneel_rush_success_rate"] = t.get("rush_success", np.nan) if known_team else np.nan
    f["ol_stuff_rate"] = t.get("stuff_rate", np.nan) if known_team else np.nan
    f["ol_explosive_run_rate"] = t.get("explosive_rate", np.nan) if known_team else np.nan
    f["ol_short_yardage_success_rate"] = t.get("short_success", np.nan) if known_team else np.nan
    f["ol_goal_to_go_success_rate"] = t.get("goal_success", np.nan) if known_team else np.nan

    # Already-admitted age/draft interactions from baseline matrix.
    bx = {name: float(row["x"][i]) for i, name in enumerate(baseline_names)}
    age = bx["age_sep1"]
    exp = bx["experience_years"]
    log_pick = bx["log_draft_pick"]
    drafted = bx["drafted"]
    wppr = bx["weighted_ppr_pg"]
    delta = bx["ppr_delta"]
    f["ctx_age_sq"] = age * age
    f["ctx_experience_sq"] = exp * exp
    f["ctx_age_x_weighted_ppr"] = age * wppr
    f["ctx_age_x_ppr_delta"] = age * delta
    f["ctx_experience_x_ppr_delta"] = exp * delta
    f["ctx_draft_decay"] = drafted * log_pick / (1.0 + exp)
    f["ctx_draft_x_weighted_ppr"] = drafted * log_pick * wppr

    # Short-history FTN scheme lagged by prior team.
    sm = scheme.get(prev_season, {}).get(team, {}) if team else {}
    for name in SCHEME_FEATURES:
        f[name] = sm.get(name, np.nan)

    return f, team


def augment_rows(returners, pbp, dominant_team, scheme, baseline_names):
    for r in returners:
        fmap, team = row_feature_map(r, pbp, dominant_team, scheme, baseline_names)
        r["adv"] = fmap
        r["prior_team"] = team
    return returners


def family_matrix(rows, family_list, pos):
    names = []
    for family in family_list:
        names.extend([f"{family}:{n}" for n in family_names(family, pos)])
    raw = []
    for r in rows:
        vals = []
        for family in family_list:
            vals.extend([r["adv"].get(n, np.nan) for n in family_names(family, pos)])
        raw.append(vals)
    return names, np.asarray(raw, dtype=float) if names else np.empty((len(rows), 0), dtype=float)


def make_fold_matrices(train, test, families, pos):
    Xb_train = np.asarray([r["x"] for r in train], dtype=float)
    Xb_test = np.asarray([r["x"] for r in test], dtype=float)
    names, tr_raw = family_matrix(train, families, pos)
    _, te_raw = family_matrix(test, families, pos)
    if tr_raw.shape[1] == 0:
        return Xb_train, Xb_test, {"feature_names": [], "medians": [], "stds": []}, []
    miss_tr = ~np.isfinite(tr_raw)
    miss_te = ~np.isfinite(te_raw)
    med = np.zeros(tr_raw.shape[1], dtype=float)
    std = np.zeros(tr_raw.shape[1], dtype=float)
    tr_imp = tr_raw.copy()
    te_imp = te_raw.copy()
    for j in range(tr_raw.shape[1]):
        valid = tr_raw[np.isfinite(tr_raw[:, j]), j]
        med[j] = float(np.median(valid)) if len(valid) else 0.0
        std[j] = float(np.std(valid)) if len(valid) else 0.0
        tr_imp[miss_tr[:, j], j] = med[j]
        te_imp[miss_te[:, j], j] = med[j]
    Xtr = np.concatenate([Xb_train, tr_imp, miss_tr.astype(float)], axis=1)
    Xte = np.concatenate([Xb_test, te_imp, miss_te.astype(float)], axis=1)
    meta = {"feature_names": names, "medians": med.tolist(), "stds": std.tolist()}
    return Xtr, Xte, meta, [(tr_raw, te_raw), (tr_imp, te_imp), (miss_tr, miss_te)]


def active_rows(rows):
    return [r for r in rows if r["target_games"] > 0 and r["target_ppr_pg"] is not None]


def score_projection(returners, families, seasons):
    records = []
    fold_meta = []
    for season in seasons:
        for pos in POSITIONS:
            train = active_rows([r for r in returners if r["target_season"] < season and r["position"] == pos])
            test = active_rows([r for r in returners if r["target_season"] == season and r["position"] == pos])
            if len(train) < 25 or len(test) < 3:
                continue
            Xtr, Xte, meta, _ = make_fold_matrices(train, test, families, pos)
            model = make_pipeline(StandardScaler(), Ridge(alpha=RIDGE_ALPHA)).fit(Xtr, np.asarray([r["target_ppr_pg"] for r in train], float))
            pred = model.predict(Xte)
            for r, p in zip(test, pred):
                records.append({
                    "player_id": r["player_id"], "player_name": r["player_name"], "position": pos, "season": season,
                    "y": float(r["target_ppr_pg"]), "pred": float(p), "families": "+".join(families) if families else "LOCKED_RIDGE",
                })
            fold_meta.append({"season": season, "position": pos, "families": list(families), "train_n": len(train), "test_n": len(test), "appended_features": len(meta["feature_names"])})
    return pd.DataFrame(records), fold_meta


def spearman_safe(a, b):
    if len(a) < 3 or len(set(np.asarray(a, float))) < 2 or len(set(np.asarray(b, float))) < 2:
        return None
    return float(spearmanr(a, b).statistic)


def projection_metrics(df):
    if df.empty:
        return {"n": 0, "mae": None, "rmse": None, "spearman": None, "abs_error_p90": None, "abs_error_p95": None}
    err = np.abs(df["y"].to_numpy(float) - df["pred"].to_numpy(float))
    return {
        "n": int(len(df)), "mae": float(err.mean()), "rmse": float(math.sqrt(mean_squared_error(df["y"], df["pred"]))),
        "spearman": spearman_safe(df["pred"], df["y"]), "abs_error_p90": float(np.quantile(err, 0.90)), "abs_error_p95": float(np.quantile(err, 0.95)),
    }


def season_rank_metrics(df):
    rows = []
    if df.empty:
        return pd.DataFrame(rows)
    for (season, pos), g in df.groupby(["season", "position"]):
        actual = g.sort_values(["y", "player_id"], ascending=[False, True])
        pred = g.sort_values(["pred", "player_id"], ascending=[False, True])
        ar = {pid: i + 1 for i, pid in enumerate(actual.player_id)}
        pr = {pid: i + 1 for i, pid in enumerate(pred.player_id)}
        rank_mae = float(np.mean([abs(ar[p] - pr[p]) for p in ar]))
        n = min(TOP_N[pos], len(g))
        overlap = len(set(actual.player_id.iloc[:n]).intersection(set(pred.player_id.iloc[:n]))) / n if n else np.nan
        threshold = CATASTROPHIC[pos]
        cat = float(np.mean([(ar[p] - pr[p]) >= threshold for p in ar]))
        rows.append({"season": int(season), "position": pos, "rank_mae": rank_mae, "top_n_overlap": float(overlap), "catastrophic_overrank_rate": cat})
    return pd.DataFrame(rows)


def summarize_projection(df):
    out = {"pooled": projection_metrics(df), "by_position": {}, "rank": {}}
    ranks = season_rank_metrics(df)
    for pos in POSITIONS:
        g = df[df.position == pos]
        out["by_position"][pos] = projection_metrics(g)
        rg = ranks[ranks.position == pos]
        out["rank"][pos] = {
            "seasons": int(len(rg)),
            "mean_rank_mae": float(rg.rank_mae.mean()) if len(rg) else None,
            "mean_top_n_overlap": float(rg.top_n_overlap.mean()) if len(rg) else None,
            "mean_catastrophic_overrank_rate": float(rg.catastrophic_overrank_rate.mean()) if len(rg) else None,
        }
    out["mean_position_rank_mae"] = float(np.mean([v["mean_rank_mae"] for v in out["rank"].values() if v["mean_rank_mae"] is not None]))
    return out


def merge_pair(base, enriched):
    keys = ["player_id", "position", "season", "y"]
    return base[keys + ["pred"]].rename(columns={"pred": "base_pred"}).merge(enriched[keys + ["pred"]].rename(columns={"pred": "enriched_pred"}), on=keys, how="inner", validate="one_to_one")


def coverage_table(returners, family, seasons):
    rows = []
    player_rows = []
    for season in seasons:
        for pos in POSITIONS:
            use = active_rows([r for r in returners if r["target_season"] == season and r["position"] == pos])
            names = family_names(family, pos)
            if not names:
                continue
            for r in use:
                vals = np.asarray([r["adv"].get(n, np.nan) for n in names], float)
                frac = float(np.isfinite(vals).mean()) if len(vals) else 0.0
                player_rows.append({
                    "player_id": r["player_id"], "season": season, "position": pos, "family": family,
                    "feature_coverage_fraction": frac, "row_70pct_covered": int(frac >= 0.70),
                    "prior_team_available": int(r.get("prior_team") is not None),
                    "provenance_quality": "HIGH_LOCKED_LAGGED_PBP" if family != "SHORT_HISTORY_SCHEME" else "HIGH_LOCKED_LAGGED_FTN_SHORT_HISTORY",
                })
            f = pd.DataFrame(player_rows)
            fg = f[(f.season == season) & (f.position == pos) & (f.family == family)]
            rows.append({
                "season": season, "position": pos, "family": family, "n": int(len(fg)),
                "mean_feature_coverage": float(fg.feature_coverage_fraction.mean()) if len(fg) else None,
                "row_70pct_coverage_rate": float(fg.row_70pct_covered.mean()) if len(fg) else None,
                "prior_team_available_rate": float(fg.prior_team_available.mean()) if len(fg) else None,
            })
    return pd.DataFrame(rows), pd.DataFrame(player_rows)


def dev_gate(base_df, enriched_df, coverage_df):
    pair = merge_pair(base_df, enriched_df)
    b = summarize_projection(base_df)
    e = summarize_projection(enriched_df)
    mae_lift = (b["pooled"]["mae"] - e["pooled"]["mae"]) / b["pooled"]["mae"]
    spearman_delta = e["pooled"]["spearman"] - b["pooled"]["spearman"]
    rank_nonworse = e["mean_position_rank_mae"] <= b["mean_position_rank_mae"] + 1e-12
    pos_reg = {}
    pos_ok = True
    for pos in POSITIONS:
        bm = b["by_position"][pos]["mae"]
        em = e["by_position"][pos]["mae"]
        reg = (em - bm) / bm if bm else 0.0
        pos_reg[pos] = reg
        if reg > 0.02:
            pos_ok = False
    severe = 0
    by_season = []
    for season in DEV_SEASONS:
        gb = base_df[base_df.season == season]
        ge = enriched_df[enriched_df.season == season]
        if gb.empty or ge.empty:
            continue
        bm = projection_metrics(gb)["mae"]
        em = projection_metrics(ge)["mae"]
        reg = (em - bm) / bm if bm else 0.0
        severe += int(reg > 0.05)
        by_season.append({"season": season, "baseline_mae": bm, "enriched_mae": em, "regression_fraction": reg})
    min_cov = float(coverage_df.row_70pct_coverage_rate.min()) if len(coverage_df) else 0.0
    coverage_ok = min_cov >= 0.90
    passed = bool(mae_lift >= 0.01 and spearman_delta >= -0.01 and rank_nonworse and pos_ok and severe <= 1 and coverage_ok)
    return {
        "passed": passed, "pooled_mae_lift_fraction": float(mae_lift), "pooled_spearman_delta": float(spearman_delta),
        "mean_position_rank_mae_baseline": b["mean_position_rank_mae"], "mean_position_rank_mae_enriched": e["mean_position_rank_mae"],
        "rank_nonworse": rank_nonworse, "position_mae_regressions": pos_reg, "position_guard_pass": pos_ok,
        "severe_dev_seasons_gt5pct": severe, "by_season": by_season, "min_row70_coverage_rate": min_cov,
        "coverage_gate_pass": coverage_ok,
    }


def clustered_bootstrap(pair):
    if pair.empty:
        return None
    g = pair.assign(diff=np.abs(pair.y - pair.enriched_pred) - np.abs(pair.y - pair.base_pred)).groupby("player_id").agg(diff_sum=("diff", "sum"), n=("diff", "size"))
    rng = np.random.default_rng(BOOT_SEED)
    vals = []
    ds = g.diff_sum.to_numpy(float)
    ns = g.n.to_numpy(float)
    k = len(g)
    for _ in range(BOOT_REPS):
        idx = rng.integers(0, k, size=k)
        vals.append(float(ds[idx].sum() / ns[idx].sum()))
    arr = np.asarray(vals)
    point = float((np.abs(pair.y - pair.enriched_pred) - np.abs(pair.y - pair.base_pred)).mean())
    return {
        "clusters": int(k), "replicates": BOOT_REPS, "seed": BOOT_SEED,
        "point_delta_mae_enriched_minus_ridge": point,
        "bootstrap_mean": float(arr.mean()), "ci95_low": float(np.quantile(arr, .025)), "ci95_high": float(np.quantile(arr, .975)),
    }


def confirmation_gate(base_df, enriched_df, coverage_df):
    b = summarize_projection(base_df)
    e = summarize_projection(enriched_df)
    pair = merge_pair(base_df, enriched_df)
    boot = clustered_bootstrap(pair)
    mae_lift = (b["pooled"]["mae"] - e["pooled"]["mae"]) / b["pooled"]["mae"]
    spearman_delta = e["pooled"]["spearman"] - b["pooled"]["spearman"]
    pos_reg = {}
    pos_ok = True
    for pos in POSITIONS:
        bm = b["by_position"][pos]["mae"]
        em = e["by_position"][pos]["mae"]
        reg = (em - bm) / bm if bm else 0.0
        pos_reg[pos] = reg
        if reg > .02:
            pos_ok = False
    recurring = 0
    severe_by_season = []
    for season in CONFIRM_SEASONS:
        bm = projection_metrics(base_df[base_df.season == season])["mae"]
        em = projection_metrics(enriched_df[enriched_df.season == season])["mae"]
        reg = (em - bm) / bm if bm else 0.0
        recurring += int(reg > .05)
        severe_by_season.append({"season": season, "baseline_mae": bm, "enriched_mae": em, "regression_fraction": reg})
    min_cov = float(coverage_df.row_70pct_coverage_rate.min()) if len(coverage_df) else 0.0
    passed = bool(
        mae_lift >= .01 and boot is not None and boot["ci95_high"] < 0 and spearman_delta >= -.01
        and e["mean_position_rank_mae"] <= b["mean_position_rank_mae"] + 1e-12 and pos_ok and recurring < 2 and min_cov >= .90
    )
    return {
        "passed": passed, "pooled_mae_lift_fraction": float(mae_lift), "pooled_spearman_delta": float(spearman_delta),
        "mean_position_rank_mae_baseline": b["mean_position_rank_mae"], "mean_position_rank_mae_enriched": e["mean_position_rank_mae"],
        "position_mae_regressions": pos_reg, "position_guard_pass": pos_ok, "severe_confirmation_seasons_gt5pct": recurring,
        "by_season": severe_by_season, "min_row70_coverage_rate": min_cov, "bootstrap": boot,
    }


def score_downside(returners, families, seasons):
    records = []
    for season in seasons:
        for pos in POSITIONS:
            train = [r for r in returners if r["target_season"] < season and r["position"] == pos and r["target_games"] > 0 and r["downside"] is not None]
            test = [r for r in returners if r["target_season"] == season and r["position"] == pos and r["target_games"] > 0 and r["downside"] is not None]
            if len(train) < 30 or len(test) < 3:
                continue
            ytr = np.asarray([int(r["downside"]) for r in train], int)
            if len(np.unique(ytr)) < 2:
                continue
            Xtr, Xte, _, _ = make_fold_matrices(train, test, families, pos)
            model = make_pipeline(StandardScaler(), LogisticRegression(C=.25, class_weight="balanced", solver="liblinear", max_iter=2000, random_state=LOGIT_SEED)).fit(Xtr, ytr)
            prob = model.predict_proba(Xte)[:, 1]
            for r, p in zip(test, prob):
                records.append({"player_id": r["player_id"], "season": season, "position": pos, "y": int(r["downside"]), "prob": float(p)})
    return pd.DataFrame(records)


def warning_summary(df):
    out = {}
    for pos in POSITIONS:
        g = df[df.position == pos]
        if g.empty:
            out[pos] = {"n": 0, "brier": None, "roc_auc": None, "prevalence": None}
            continue
        y = g.y.to_numpy(int)
        p = g.prob.to_numpy(float)
        out[pos] = {
            "n": int(len(g)), "prevalence": float(y.mean()), "brier": float(brier_score_loss(y, p)),
            "roc_auc": float(roc_auc_score(y, p)) if len(np.unique(y)) > 1 else None,
        }
    return out


def warning_gate(base_df, enriched_df):
    b = warning_summary(base_df)
    e = warning_summary(enriched_df)
    improved_positions = []
    brier_regression_ok = True
    detail = {}
    for pos in POSITIONS:
        if b[pos]["n"] == 0 or e[pos]["n"] == 0:
            detail[pos] = {"eligible": False}
            continue
        bb, eb = b[pos]["brier"], e[pos]["brier"]
        ba, ea = b[pos]["roc_auc"], e[pos]["roc_auc"]
        rel_brier = (bb - eb) / bb if bb else 0.0
        auc_delta = (ea - ba) if ba is not None and ea is not None else 0.0
        if rel_brier >= .02 or auc_delta >= .02:
            improved_positions.append(pos)
        if bb and (eb - bb) / bb > .05:
            brier_regression_ok = False
        detail[pos] = {
            "eligible": True, "baseline_brier": bb, "enriched_brier": eb, "relative_brier_improvement": rel_brier,
            "baseline_roc_auc": ba, "enriched_roc_auc": ea, "roc_auc_delta": auc_delta,
        }
    passed = len(improved_positions) >= 2 and brier_regression_ok
    return {"passed": passed, "improved_positions": improved_positions, "no_position_brier_regression_gt5pct": brier_regression_ok, "by_position": detail}


def family_disposition(dev, conf, warn):
    if dev["passed"] and conf["passed"]:
        return "CORE MODEL SUPPORTED"
    if warn["passed"]:
        return "WARNING / EXPLANATION ONLY"
    return "INSUFFICIENT EVIDENCE"


def score_scheme_diagnostic(returners):
    base, _ = score_projection(returners, [], [2023, 2024, 2025])
    enriched, _ = score_projection(returners, ["SHORT_HISTORY_SCHEME"], [2023, 2024, 2025])
    cov, players = coverage_table(returners, "SHORT_HISTORY_SCHEME", [2023, 2024, 2025])
    pair = merge_pair(base, enriched)
    return {
        "scored_seasons": [2023, 2024, 2025],
        "note": "No 2018-2021 development window exists for lagged FTN 2022+ features; core admission is precluded by design.",
        "baseline": summarize_projection(base),
        "enriched": summarize_projection(enriched),
        "paired_rows": int(len(pair)),
        "coverage_min_row70": float(cov.row_70pct_coverage_rate.min()) if len(cov) else 0.0,
    }, cov, players


def sensitivity_combined(returners, selected, baseline_confirm, full_confirm):
    if not selected:
        return {"selected_families": [], "fallback_contract": "LOCKED_RIDGE", "source_omission": [], "perturbation": [], "note": "No development-passing direct family; combined model equals locked Ridge."}
    full_ranks = season_rank_metrics(full_confirm)
    omission = []
    for family in selected:
        keep = [f for f in selected if f != family]
        omit_df, _ = score_projection(returners, keep, CONFIRM_SEASONS)
        pair = merge_pair(full_confirm, omit_df)
        diffs = []
        for (season, pos), g in pair.groupby(["season", "position"]):
            a = g.sort_values(["enriched_pred", "player_id"], ascending=[False, True])
            b = g.sort_values(["base_pred", "player_id"], ascending=[False, True])
            ra = {p: i + 1 for i, p in enumerate(a.player_id)}
            rb = {p: i + 1 for i, p in enumerate(b.player_id)}
            diffs.extend(abs(ra[p] - rb[p]) for p in ra)
        omission.append({"omitted_family": family, "remaining": keep, "mean_absolute_rank_shift_vs_full": float(np.mean(diffs)) if diffs else 0.0})
    fallback_pair = merge_pair(full_confirm, baseline_confirm)
    fallback_diffs = []
    for (season, pos), g in fallback_pair.groupby(["season", "position"]):
        a = g.sort_values(["enriched_pred", "player_id"], ascending=[False, True])
        b = g.sort_values(["base_pred", "player_id"], ascending=[False, True])
        ra = {p: i + 1 for i, p in enumerate(a.player_id)}
        rb = {p: i + 1 for i, p in enumerate(b.player_id)}
        fallback_diffs.extend(abs(ra[p] - rb[p]) for p in ra)
    return {
        "selected_families": selected,
        "fallback_contract": "If any required selected-family source is unavailable or fails hash/schema/PIT validation, deterministically use locked Ridge mean projection; warnings remain separate.",
        "source_omission": omission,
        "all_selected_sources_missing_fallback_mean_absolute_rank_shift_vs_full": float(np.mean(fallback_diffs)) if fallback_diffs else 0.0,
        "perturbation": "Numeric +0.5 SD feature perturbation is represented conservatively by family omission/fallback sensitivity in this run; no stochastic perturbation was used.",
    }


def main():
    lock = verify_integrity()
    if lock["outcomes_2026_inspected"] is not False or lock["max_outcome_season"] != 2025:
        raise RuntimeError("lock violates 2026 boundary")
    wr025 = import_wr025()
    by_season, players, _, draft_by_player, dominant_team, benchmark_audit = load_benchmark_data(wr025, lock)
    returners = wr025.build_returners(by_season, players, draft_by_player)

    pbp, play_maps, pbp_audit = build_pbp_context(lock)
    scheme, ftn_audit = build_scheme_context(lock, play_maps)
    returners = augment_rows(returners, pbp, dominant_team, scheme, wr025.FEATURES)

    # Exact benchmark re-verification on scoring head.
    baseline_all, baseline_meta = score_projection(returners, [], ALL_SCORE_SEASONS)
    baseline_summary = summarize_projection(baseline_all)
    expected = lock["benchmark_reference"]["reproduced"]
    if len(baseline_all) != expected["active_rows"] or baseline_all.player_id.nunique() != expected["unique_players"]:
        raise RuntimeError("scoring benchmark cohort drift")
    if abs(baseline_summary["pooled"]["mae"] - expected["ridge_mae"]) > 1e-10 or abs(baseline_summary["pooled"]["spearman"] - expected["ridge_spearman"]) > 1e-10:
        raise RuntimeError("scoring benchmark metric drift")

    baseline_dev = baseline_all[baseline_all.season.isin(DEV_SEASONS)].copy()
    baseline_confirm = baseline_all[baseline_all.season.isin(CONFIRM_SEASONS)].copy()
    baseline_downside_confirm = score_downside(returners, [], CONFIRM_SEASONS)

    results = {}
    ablation_rows = []
    coverage_parts = []
    player_coverage_parts = []
    selected_from_dev = []

    # Predeclared order: development screening first, without confirmation metrics.
    dev_predictions = {}
    for family in DIRECT_LONG_HISTORY:
        cov_dev, pc_dev = coverage_table(returners, family, DEV_SEASONS)
        fam_dev, _ = score_projection(returners, [family], DEV_SEASONS)
        gate = dev_gate(baseline_dev, fam_dev, cov_dev)
        dev_predictions[family] = fam_dev
        if gate["passed"]:
            selected_from_dev.append(family)
        results[family] = {"development_gate": gate, "selected_for_confirmation": gate["passed"]}
        coverage_parts.append(cov_dev.assign(split="development"))
        player_coverage_parts.append(pc_dev.assign(split="development"))
        ablation_rows.append({
            "family": family, "split": "development", "disposition_stage": "SCREEN",
            "baseline_mae": summarize_projection(baseline_dev)["pooled"]["mae"],
            "enriched_mae": summarize_projection(fam_dev)["pooled"]["mae"],
            "mae_lift_fraction": gate["pooled_mae_lift_fraction"],
            "baseline_spearman": summarize_projection(baseline_dev)["pooled"]["spearman"],
            "enriched_spearman": summarize_projection(fam_dev)["pooled"]["spearman"],
            "mean_rank_mae_baseline": gate["mean_position_rank_mae_baseline"],
            "mean_rank_mae_enriched": gate["mean_position_rank_mae_enriched"],
            "gate_pass": gate["passed"],
        })

    # Confirmation is evaluated only after development selection is frozen in memory.
    confirmation_predictions = {}
    for family in DIRECT_LONG_HISTORY:
        cov_conf, pc_conf = coverage_table(returners, family, CONFIRM_SEASONS)
        fam_conf, _ = score_projection(returners, [family], CONFIRM_SEASONS)
        confirmation_predictions[family] = fam_conf
        conf_gate = confirmation_gate(baseline_confirm, fam_conf, cov_conf)
        family_down = score_downside(returners, [family], CONFIRM_SEASONS)
        warn_gate = warning_gate(baseline_downside_confirm, family_down)
        disposition = family_disposition(results[family]["development_gate"], conf_gate, warn_gate)
        results[family].update({
            "confirmation_gate": conf_gate, "warning_gate": warn_gate, "disposition": disposition,
            "development_metrics": summarize_projection(dev_predictions[family]),
            "confirmation_metrics": summarize_projection(fam_conf),
        })
        coverage_parts.append(cov_conf.assign(split="confirmation"))
        player_coverage_parts.append(pc_conf.assign(split="confirmation"))
        ablation_rows.append({
            "family": family, "split": "confirmation", "disposition_stage": disposition,
            "baseline_mae": summarize_projection(baseline_confirm)["pooled"]["mae"],
            "enriched_mae": summarize_projection(fam_conf)["pooled"]["mae"],
            "mae_lift_fraction": conf_gate["pooled_mae_lift_fraction"],
            "baseline_spearman": summarize_projection(baseline_confirm)["pooled"]["spearman"],
            "enriched_spearman": summarize_projection(fam_conf)["pooled"]["spearman"],
            "mean_rank_mae_baseline": conf_gate["mean_position_rank_mae_baseline"],
            "mean_rank_mae_enriched": conf_gate["mean_position_rank_mae_enriched"],
            "gate_pass": conf_gate["passed"],
        })

    # PIT audit families in predeclared order.
    results["PIT_DEPTH_ROSTER"] = {
        "disposition": SOURCE_EXCLUDED["PIT_DEPTH_ROSTER"],
        "reason": "Historical <=2024 depth source lacks 2025+ explicit timestamp semantics and changes upstream provider; weekly roster/depth states do not prove Sep-1 target-preseason availability. No hindsight reconstruction performed.",
        "scored": False,
    }

    scheme_diag, scheme_cov, scheme_players = score_scheme_diagnostic(returners)
    results["SHORT_HISTORY_SCHEME"] = {
        "disposition": "INSUFFICIENT EVIDENCE",
        "reason": "Rights/PIT pass for lagged FTN charting, but 2022+ history cannot provide the frozen 2018-2021 development window; only 2023-2025 target diagnostics are possible without 2026 outcomes.",
        "diagnostic": scheme_diag,
    }
    coverage_parts.append(scheme_cov.assign(split="short_history_diagnostic"))
    player_coverage_parts.append(scheme_players.assign(split="short_history_diagnostic"))

    results["STAFF_CONTINUITY"] = {
        "disposition": SOURCE_EXCLUDED["STAFF_CONTINUITY"],
        "reason": "No independently verified rights-clean dated corpus with complete HC/OC/actual play-caller PIT semantics was admitted; OC identity is not treated as play-caller identity.",
        "scored": False,
    }

    combined_confirm, _ = score_projection(returners, selected_from_dev, CONFIRM_SEASONS)
    combined_cov_parts = []
    for family in selected_from_dev:
        c, _ = coverage_table(returners, family, CONFIRM_SEASONS)
        combined_cov_parts.append(c)
    if combined_cov_parts:
        tmp = pd.concat(combined_cov_parts, ignore_index=True)
        combined_cov = tmp.groupby(["season", "position"], as_index=False).agg(row_70pct_coverage_rate=("row_70pct_coverage_rate", "min"))
        combined_gate = confirmation_gate(baseline_confirm, combined_confirm, combined_cov)
    else:
        combined_gate = {
            "passed": False, "reason": "No direct family passed the development gate; combined confirmation defaults to locked Ridge and is not a new model.",
            "pooled_mae_lift_fraction": 0.0, "bootstrap": None,
        }
    sensitivity = sensitivity_combined(returners, selected_from_dev, baseline_confirm, combined_confirm)

    coverage_df = pd.concat(coverage_parts, ignore_index=True) if coverage_parts else pd.DataFrame()
    player_cov_df = pd.concat(player_coverage_parts, ignore_index=True) if player_coverage_parts else pd.DataFrame()
    ablation_df = pd.DataFrame(ablation_rows)

    recommended_core = [f for f in DIRECT_LONG_HISTORY if results[f]["disposition"] == "CORE MODEL SUPPORTED"]
    warning_only = [f for f in DIRECT_LONG_HISTORY if results[f]["disposition"] == "WARNING / EXPLANATION ONLY"]
    insufficient = [f for f in DIRECT_LONG_HISTORY if results[f]["disposition"] == "INSUFFICIENT EVIDENCE"] + ["SHORT_HISTORY_SCHEME"]
    excluded = ["PIT_DEPTH_ROSTER", "STAFF_CONTINUITY"]

    final = {
        "task_id": "WR-029",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "starting_main": STARTING_MAIN,
        "benchmark_lock_sha256": LOCK_SHA256,
        "historical_only": True,
        "max_outcome_season_loaded": MAX_OUTCOME_SEASON,
        "outcomes_2026_inspected": False,
        "wr021_snapshot_modified": False,
        "wr023_protocol_modified": False,
        "accepted_architecture_preserved": {
            "ridge_mean_ordering": True, "risk_warning_only": POSITIONS, "huber_replacement": False, "rookies_separate": True,
        },
        "benchmark_reproduced": baseline_summary,
        "family_order": FAMILY_ORDER,
        "development_selected_families_before_confirmation": selected_from_dev,
        "families": results,
        "combined_confirmation": {
            "families_selected_from_development": selected_from_dev,
            "metrics": summarize_projection(combined_confirm), "gate": combined_gate,
        },
        "sensitivity": sensitivity,
        "recommended_phase2": {
            "core_model_families": recommended_core,
            "warning_explanation_only_families": warning_only,
            "insufficient_evidence_families": insufficient,
            "excluded_families": excluded,
            "ordering_model": "Locked WR-025 Ridge plus only Manager-accepted CORE MODEL SUPPORTED families; do not apply WR-027 risk probabilities as rank penalties.",
            "source_failure_fallback": "Locked WR-025 Ridge mean projection; warnings remain separate.",
            "rookie_policy": "Separate transparent prior remains benchmark; WR-029 does not promote a rookie model.",
        },
        "source_execution_audit": {"benchmark": benchmark_audit, "pbp": pbp_audit, "ftn_charting": ftn_audit},
        "routes_yprr": {"routes_used": False, "yprr_used": False, "participation_used_as_routes": False},
    }

    (OUT / "ADV_CONTEXT_RESULTS.json").write_text(json.dumps(final, indent=2) + "\n")
    ablation_df.to_csv(OUT / "ADV_CONTEXT_FAMILY_ABLATIONS.csv", index=False)
    coverage_df.to_csv(OUT / "ADV_CONTEXT_COVERAGE_BY_POSITION_SEASON.csv", index=False)
    player_cov_df.to_csv(OUT / "ADV_CONTEXT_PLAYER_FAMILY_COVERAGE.csv", index=False)
    (OUT / "ADV_CONTEXT_SENSITIVITY.json").write_text(json.dumps(sensitivity, indent=2) + "\n")
    (OUT / "ADV_CONTEXT_SOURCE_EXECUTION_AUDIT.json").write_text(json.dumps(final["source_execution_audit"], indent=2) + "\n")

    # Final fail-closed check after all scoring.
    verify_integrity()
    print(json.dumps({
        "development_selected": selected_from_dev,
        "dispositions": {f: results[f]["disposition"] for f in FAMILY_ORDER},
        "combined_gate": combined_gate,
        "recommended_core": recommended_core,
        "warning_only": warning_only,
    }, indent=2))


if __name__ == "__main__":
    main()
