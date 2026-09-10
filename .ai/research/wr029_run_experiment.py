from __future__ import annotations

import importlib.util
import io
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / ".ai" / "research" / "wr029_advanced_context_enrichment.py"
spec = importlib.util.spec_from_file_location("wr029_impl", PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot import WR-029 implementation")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

# Authoritative committed-byte lock. No enrichment family metric existed before
# this committed-byte value and the prior-team schema correction were bound.
mod.LOCK_SHA256 = "6498e7399d04cf62018859ec7647eaf14f96d3d4415b0ec3ceffaebbae1773e7"

# The frozen Player Summary Stats assets do not contain a historical team field.
# Per ADV_CONTEXT_PRE_SCORING_SOURCE_CORRECTION.md, dominant Y-1 team is derived
# only from the same locked Y-1 regular-season PBP used by the feature families.
_pbp_dominant_team: dict[int, dict[str, str]] = defaultdict(dict)
_original_aggregate = mod.aggregate_pbp_season
_original_build_pbp = mod.build_pbp_context
_original_row_feature_map = mod.row_feature_map


def corrected_load_benchmark_data(wr025, lock):
    expected = {r["asset_name"]: r for r in lock["benchmark_source_verification"]}
    stats_rel, stats_assets = wr025.release_assets(wr025.STATS_TAG)
    _, players_assets = wr025.release_assets(wr025.PLAYERS_TAG)
    _, draft_assets = wr025.release_assets(wr025.DRAFT_TAG)
    by_season = {}
    source_check = []
    for season in wr025.STAT_SEASONS:
        if season > mod.MAX_OUTCOME_SEASON:
            raise RuntimeError("stats outcome season >2025")
        name = f"stats_player_regpost_{season}.csv"
        payload, sha = wr025.download_asset(stats_assets[name])
        if sha != expected[name]["sha256"]:
            raise RuntimeError(f"benchmark source drift: {name}")
        rows, _, _ = wr025.aggregate_stats(season, payload)
        by_season[season] = rows
        source_check.append({"season": season, "asset_name": name, "sha256": sha})

    p_asset = players_assets["players.csv"]
    p_payload, p_sha = wr025.download_asset(p_asset)
    d_asset = draft_assets["draft_picks.csv"]
    d_payload, d_sha = wr025.download_asset(d_asset)
    if p_sha != expected["players.csv"]["sha256"] or d_sha != expected["draft_picks.csv"]["sha256"]:
        raise RuntimeError("players/draft benchmark source drift")
    players, _, _, _ = wr025.load_players(p_payload)
    drafts_by_season, draft_by_player, _, _ = wr025.load_draft_picks(d_payload)
    return by_season, players, drafts_by_season, draft_by_player, _pbp_dominant_team, source_check


def corrected_aggregate_pbp_season(season: int, payload: bytes):
    ctx, pmap = _original_aggregate(season, payload)
    cols = [
        "season_type", "posteam", "qb_dropback", "passer_player_id", "pass_attempt", "receiver_player_id",
        "rush_attempt", "qb_kneel", "rusher_player_id", "air_yards", "yardline_100", "down", "half_seconds_remaining",
    ]
    df = pd.read_parquet(io.BytesIO(payload), columns=cols)
    df = df[df["season_type"].astype(str).str.upper().eq("REG")].copy()
    df["posteam_norm"] = df["posteam"].map(mod.norm_team)
    df = df[df["posteam_norm"].notna()].copy()
    for c in ["qb_dropback", "pass_attempt", "rush_attempt", "qb_kneel", "air_yards", "yardline_100", "down", "half_seconds_remaining"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    drop = df["qb_dropback"].fillna(0).eq(1) & df["passer_player_id"].notna()
    target = df["pass_attempt"].fillna(0).eq(1) & df["receiver_player_id"].notna()
    rush = df["rush_attempt"].fillna(0).eq(1) & ~df["qb_kneel"].fillna(0).eq(1) & df["rusher_player_id"].notna()

    involvement: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    opp_by_team: dict[str, dict[str, dict]] = defaultdict(dict)

    for team, g in df[drop].groupby("posteam_norm"):
        counts = g["passer_player_id"].astype(str).value_counts()
        total = int(counts.sum())
        if str(team) in ctx["team"]:
            ctx["team"][str(team)]["top_qb_share"] = float(counts.iloc[0] / total) if total else np.nan
        for pid, count in counts.items():
            involvement[str(pid)][str(team)] += int(count)

    td = df[target].copy()
    td["_rz"] = td["yardline_100"].le(20)
    td["_i10"] = td["yardline_100"].le(10)
    td["_i5"] = td["yardline_100"].le(5)
    td["_third"] = td["down"].eq(3)
    td["_two_min"] = td["half_seconds_remaining"].le(120)
    for (team, pid), g in td.groupby(["posteam_norm", "receiver_player_id"]):
        pid, team = str(pid), str(team)
        n = int(len(g))
        involvement[pid][team] += n
        rec = opp_by_team[pid].setdefault(team, {})
        rec.update({
            "targets": n,
            "air_yards": float(g["air_yards"].fillna(0).sum()),
            "rz_targets": int(g["_rz"].sum()),
            "i10_targets": int(g["_i10"].sum()),
            "i5_targets": int(g["_i5"].sum()),
            "third_targets": int(g["_third"].sum()),
            "two_min_targets": int(g["_two_min"].sum()),
        })

    rd = df[rush].copy()
    rd["_rz"] = rd["yardline_100"].le(20)
    rd["_i10"] = rd["yardline_100"].le(10)
    rd["_i5"] = rd["yardline_100"].le(5)
    for (team, pid), g in rd.groupby(["posteam_norm", "rusher_player_id"]):
        pid, team = str(pid), str(team)
        n = int(len(g))
        involvement[pid][team] += n
        rec = opp_by_team[pid].setdefault(team, {})
        rec.update({
            "carries": n,
            "rz_carries": int(g["_rz"].sum()),
            "i10_carries": int(g["_i10"].sum()),
            "i5_carries": int(g["_i5"].sum()),
        })

    ctx["player_team_involvement"] = {pid: dict(v) for pid, v in involvement.items()}
    ctx["opp_by_team"] = {pid: dict(v) for pid, v in opp_by_team.items()}
    return ctx, pmap


def corrected_build_pbp_context(lock):
    contexts, play_maps, audit = _original_build_pbp(lock)
    _pbp_dominant_team.clear()
    for season, ctx in contexts.items():
        for pid, counts in ctx.get("player_team_involvement", {}).items():
            if not counts:
                continue
            best = sorted(counts.items(), key=lambda kv: (-int(kv[1]), str(kv[0])))[0][0]
            _pbp_dominant_team[int(season)][str(pid)] = str(best)
    for row in audit:
        season = int(row["season"])
        row["dominant_prior_team_players"] = len(_pbp_dominant_team.get(season, {}))
        row["prior_team_source"] = "locked lagged PBP offensive involvement"
    return contexts, play_maps, audit


def corrected_row_feature_map(row, pbp, dominant_team, scheme, baseline_names):
    features, team = _original_row_feature_map(row, pbp, dominant_team, scheme, baseline_names)
    prev_season = int(row["target_season"]) - 1
    pid = str(row["player_id"])
    if not team:
        return features, team
    ctx = pbp.get(prev_season, {})
    t = ctx.get("team", {}).get(team, {})
    opp = ctx.get("opp_by_team", {}).get(pid, {}).get(team, {})
    if not t:
        return features, team

    def share(numerator_key, denominator_key):
        den = t.get(denominator_key, 0)
        if den is None or not np.isfinite(float(den)) or float(den) <= 0:
            return np.nan
        return float(opp.get(numerator_key, 0)) / float(den)

    features["opp_target_share_pbp"] = share("targets", "targets")
    features["opp_targets_per_dropback"] = share("targets", "dropbacks")
    features["opp_carry_share"] = share("carries", "rushes")
    team_air = t.get("air_yards", 0)
    features["opp_air_yards_share"] = (float(opp.get("air_yards", 0)) / float(team_air)) if team_air is not None and np.isfinite(float(team_air)) and abs(float(team_air)) >= 20 else np.nan
    features["opp_rz_target_share"] = share("rz_targets", "rz_targets")
    features["opp_i10_target_share"] = share("i10_targets", "i10_targets")
    features["opp_i5_target_share"] = share("i5_targets", "i5_targets")
    features["opp_rz_carry_share"] = share("rz_carries", "rz_carries")
    features["opp_i10_carry_share"] = share("i10_carries", "i10_carries")
    features["opp_i5_carry_share"] = share("i5_carries", "i5_carries")
    features["opp_third_down_target_share"] = share("third_targets", "third_targets")
    features["opp_two_min_target_share"] = share("two_min_targets", "two_min_targets")
    features["opp_qb_rz_rush_share"] = share("rz_carries", "rz_carries")
    features["qb_rz_rush_share_team"] = share("rz_carries", "rz_carries")
    features["qb_i5_rush_share_team"] = share("i5_carries", "i5_carries")
    return features, team


mod.load_benchmark_data = corrected_load_benchmark_data
mod.aggregate_pbp_season = corrected_aggregate_pbp_season
mod.build_pbp_context = corrected_build_pbp_context
mod.row_feature_map = corrected_row_feature_map

# A warning/explanation family must retain minimally usable PIT-valid coverage.
def guarded_disposition(dev, conf, warn):
    if dev["passed"] and conf["passed"]:
        return "CORE MODEL SUPPORTED"
    if float(conf.get("min_row70_coverage_rate", 0.0) or 0.0) < 0.70:
        return "EXCLUDED — RIGHTS / POINT-IN-TIME / COVERAGE"
    if warn["passed"]:
        return "WARNING / EXPLANATION ONLY"
    return "INSUFFICIENT EVIDENCE"


mod.family_disposition = guarded_disposition

if __name__ == "__main__":
    mod.main()
