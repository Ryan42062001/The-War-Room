from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import numpy as np
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[2]
RESEARCH = ROOT / ".ai" / "research"
OUT = RESEARCH / "generated"
RUNNER = RESEARCH / "wr029_run_experiment.py"
spec = importlib.util.spec_from_file_location("wr029_runner", RUNNER)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot import guarded WR-029 runner")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
mod = runner.mod


def rank_shift(player_ids, base_pred, perturbed_pred):
    base_order = sorted(zip(player_ids, base_pred), key=lambda x: (-float(x[1]), str(x[0])))
    pert_order = sorted(zip(player_ids, perturbed_pred), key=lambda x: (-float(x[1]), str(x[0])))
    rb = {p: i + 1 for i, (p, _) in enumerate(base_order)}
    rp = {p: i + 1 for i, (p, _) in enumerate(pert_order)}
    vals = [abs(rb[p] - rp[p]) for p in rb]
    return float(np.mean(vals)) if vals else 0.0, int(max(vals)) if vals else 0


def main():
    lock = mod.verify_integrity()
    results_path = OUT / "ADV_CONTEXT_RESULTS.json"
    results = json.loads(results_path.read_text())
    selected = list(results["development_selected_families_before_confirmation"])
    sensitivity = dict(results.get("sensitivity", {}))

    if not selected:
        sensitivity["perturbation"] = []
        sensitivity["perturbation_note"] = "No development-selected enrichment family; +/-0.5 SD sensitivity is vacuous because the combined model equals locked Ridge."
    else:
        wr025 = mod.import_wr025()
        by_season, players, _, draft_by_player, dominant_team, _ = mod.load_benchmark_data(wr025, lock)
        returners = wr025.build_returners(by_season, players, draft_by_player)
        pbp, play_maps, _ = mod.build_pbp_context(lock)
        scheme, _ = mod.build_scheme_context(lock, play_maps)
        returners = mod.augment_rows(returners, pbp, dominant_team, scheme, wr025.FEATURES)

        records = []
        for season in mod.CONFIRM_SEASONS:
            for pos in mod.POSITIONS:
                train = mod.active_rows([r for r in returners if r["target_season"] < season and r["position"] == pos])
                test = mod.active_rows([r for r in returners if r["target_season"] == season and r["position"] == pos])
                if len(train) < 25 or len(test) < 3:
                    continue
                Xtr, Xte, meta, aux = mod.make_fold_matrices(train, test, selected, pos)
                model = make_pipeline(StandardScaler(), Ridge(alpha=mod.RIDGE_ALPHA)).fit(
                    Xtr, np.asarray([r["target_ppr_pg"] for r in train], float)
                )
                base_pred = model.predict(Xte)
                miss_te = aux[2][1] if aux else np.empty((len(test), 0), dtype=bool)
                base_width = len(wr025.FEATURES)
                ids = [r["player_id"] for r in test]
                for family in selected:
                    idxs = [i for i, name in enumerate(meta["feature_names"]) if name.startswith(family + ":")]
                    for direction in [-1.0, 1.0]:
                        xp = Xte.copy()
                        for j in idxs:
                            delta = 0.5 * float(meta["stds"][j]) * direction
                            if delta == 0.0:
                                continue
                            observed = ~miss_te[:, j]
                            xp[observed, base_width + j] += delta
                        pert = model.predict(xp)
                        mean_shift, max_shift = rank_shift(ids, base_pred, pert)
                        records.append({
                            "season": season, "position": pos, "family": family,
                            "direction_sd": float(0.5 * direction),
                            "mean_absolute_rank_shift": mean_shift,
                            "max_absolute_rank_shift": max_shift,
                            "n": len(test),
                        })
        summary = []
        for family in selected:
            fam = [r for r in records if r["family"] == family]
            summary.append({
                "family": family,
                "fold_directions": len(fam),
                "mean_absolute_rank_shift": float(np.mean([r["mean_absolute_rank_shift"] for r in fam])) if fam else 0.0,
                "max_absolute_rank_shift": int(max([r["max_absolute_rank_shift"] for r in fam], default=0)),
                "worst_fold_mean_absolute_rank_shift": float(max([r["mean_absolute_rank_shift"] for r in fam], default=0.0)),
            })
        sensitivity["perturbation"] = summary
        sensitivity["perturbation_detail"] = records
        sensitivity["perturbation_note"] = "For each selected family, all observed numeric family fields were shifted together by +/-0.5 training-fold SD; missing values remained imputed and marked missing. Rank shifts are relative to the unperturbed combined model."

    (OUT / "ADV_CONTEXT_SENSITIVITY.json").write_text(json.dumps(sensitivity, indent=2) + "\n")
    results["sensitivity"] = sensitivity
    results_path.write_text(json.dumps(results, indent=2) + "\n")
    mod.verify_integrity()
    print(json.dumps({"selected": selected, "perturbation": sensitivity.get("perturbation", [])}, indent=2))


if __name__ == "__main__":
    main()
