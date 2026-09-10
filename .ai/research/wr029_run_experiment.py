from __future__ import annotations

import importlib.util
import io
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / ".ai" / "research" / "wr029_advanced_context_enrichment.py"
spec = importlib.util.spec_from_file_location("wr029_impl", PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot import WR-029 implementation")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

# Preserve the frozen feature definition exactly: top-QB share means the single
# largest QB dropback share, not top-two concentration. The base aggregation
# already computes every other family statistic; this wrapper independently
# corrects that one field from the same locked PBP bytes before any scoring.
_original_aggregate = mod.aggregate_pbp_season


def corrected_aggregate_pbp_season(season: int, payload: bytes):
    ctx, pmap = _original_aggregate(season, payload)
    df = pd.read_parquet(io.BytesIO(payload), columns=["season_type", "posteam", "qb_dropback", "passer_player_id"])
    df = df[df["season_type"].astype(str).str.upper().eq("REG")].copy()
    df["posteam_norm"] = df["posteam"].map(mod.norm_team)
    drop = pd.to_numeric(df["qb_dropback"], errors="coerce").fillna(0).eq(1)
    use = df[drop & df["posteam_norm"].notna() & df["passer_player_id"].notna()].copy()
    for team, g in use.groupby("posteam_norm"):
        counts = g["passer_player_id"].astype(str).value_counts()
        total = int(counts.sum())
        top = float(counts.iloc[0] / total) if total else float("nan")
        if str(team) in ctx["team"]:
            ctx["team"][str(team)]["top_qb_share"] = top
    return ctx, pmap


mod.aggregate_pbp_season = corrected_aggregate_pbp_season

# A warning/explanation family must retain minimally usable PIT-valid coverage.
# If fewer than 70% of rows have at least 70% of the family's position-relevant
# fields on the worst confirmation position-season, the Manager's coverage rule
# makes it a coverage exclusion rather than a warning model.
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
