from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error

import wr025_historical_ranking_signals as wr025
import wr034_availability_expected_games as wr034

OUT = Path(".ai/research/generated")
PRED_PATH = OUT / "WR034_EXPECTED_GAMES_ROWS.csv"
DEV = [2018, 2019, 2020, 2021]
CONF = [2022, 2023, 2024, 2025]


def metrics(g: pd.DataFrame) -> dict:
    out = {
        "n": int(len(g)),
        "zero_game_fraction": float((g.target_games == 0).mean()),
        "mean_target_games": float(g.target_games.mean()),
    }
    for model in ["PREV_RATE", "POSITION_MEAN", "RIDGE_FULL"]:
        out[f"{model}_mae"] = float(mean_absolute_error(g.target_games, g[model]))
    out["ridge_lift_vs_prev_rate"] = (
        out["PREV_RATE_mae"] - out["RIDGE_FULL_mae"]
    ) / out["PREV_RATE_mae"]
    out["ridge_lift_vs_position_mean"] = (
        out["POSITION_MEAN_mae"] - out["RIDGE_FULL_mae"]
    ) / out["POSITION_MEAN_mae"]
    return out


def main():
    before = wr034.frozen_integrity_snapshot()
    by_season, _ = wr034.load_locked_stats()
    returners = wr025.build_returners(by_season, {}, {})
    ppr_idx = wr025.FEATURES.index("prev1_ppr_pg")
    prev = pd.DataFrame([
        {
            "player_id": str(r["player_id"]),
            "target_season": int(r["target_season"]),
            "prev1_ppr_pg": float(np.asarray(r["x"], float)[ppr_idx]),
        }
        for r in returners
    ])
    pred = pd.read_csv(PRED_PATH, dtype={"player_id": str})
    frame = pred.merge(prev, on=["player_id", "target_season"], how="left", validate="one_to_one")
    if frame.prev1_ppr_pg.isna().any():
        raise RuntimeError("tier diagnostic join missing prior PPR/game")
    frame["prior_performance_tier"] = ""
    for _, idx in frame.groupby(["target_season", "position"]).groups.items():
        ranks = frame.loc[idx, "prev1_ppr_pg"].rank(method="first")
        tiers = pd.qcut(ranks, q=4, labels=["Q1", "Q2", "Q3", "Q4"])
        frame.loc[idx, "prior_performance_tier"] = tiers.astype(str).to_numpy()

    records = []
    summary = {"development": {}, "confirmation": {}, "confirmation_q4_by_position": {}}
    for split, seasons in [("development", DEV), ("confirmation", CONF)]:
        s = frame[frame.target_season.isin(seasons)]
        for tier in ["Q1", "Q2", "Q3", "Q4"]:
            g = s[s.prior_performance_tier == tier]
            m = metrics(g)
            summary[split][tier] = m
            records.append({"split": split, "tier": tier, "position": "ALL", **m})
    q4 = frame[frame.target_season.isin(CONF) & (frame.prior_performance_tier == "Q4")]
    for pos in wr034.POSITIONS:
        g = q4[q4.position == pos]
        m = metrics(g)
        summary["confirmation_q4_by_position"][pos] = m
        records.append({"split": "confirmation", "tier": "Q4", "position": pos, **m})

    after = wr034.frozen_integrity_snapshot()
    if before != after:
        raise RuntimeError("frozen artifacts changed during tier diagnostic")

    summary["task_id"] = "WR-034"
    summary["descriptive_post_selection_only"] = True
    summary["outcomes_2026_inspected"] = False
    summary["frozen_artifacts_unchanged"] = True
    summary["interpretation_trigger"] = (
        "Q4 applicability concern"
        if summary["confirmation"]["Q4"]["ridge_lift_vs_position_mean"] <= 0
        else "Q4 lift remains positive versus position-mean baseline"
    )

    pd.DataFrame(records).to_csv(OUT / "WR034_PERFORMANCE_TIER_DIAGNOSTIC.csv", index=False)
    (OUT / "WR034_PERFORMANCE_TIER_DIAGNOSTIC.json").write_text(
        json.dumps(summary, indent=2) + "\n"
    )
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
