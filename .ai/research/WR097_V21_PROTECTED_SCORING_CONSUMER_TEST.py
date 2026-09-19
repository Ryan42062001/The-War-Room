#!/usr/bin/env python3
"""Synthetic/conformance tests for WR097_V21_PROTECTED_SCORING_CONSUMER.py.

No retained provider byte or real 2022-2025 target value is used by this suite.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CONSUMER_PATH = HERE / "WR097_V21_PROTECTED_SCORING_CONSUMER.py"
PROTOCOL_PATH = ROOT / ".ai/research/generated/WR095_RETURNING_PLAYER_V21_PROTOCOL_CANDIDATE.json"

spec = importlib.util.spec_from_file_location("wr097_v21_consumer", CONSUMER_PATH)
assert spec and spec.loader
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)

EXPECTED_FEATURES = (
    "prev1_ppr_pg", "prev1_games", "prev1_attempts_pg", "prev1_carries_pg",
    "prev1_targets_pg", "prev1_receptions_pg", "prev1_pass_yards_pg",
    "prev1_pass_tds_pg", "prev1_int_pg", "prev1_rush_yards_pg",
    "prev1_rush_tds_pg", "prev1_rec_yards_pg", "prev1_rec_tds_pg",
    "prev1_pass_epa_pg", "prev1_rush_epa_pg", "prev1_rec_epa_pg",
    "prev1_target_share", "prev1_air_yards_share", "prev1_wopr",
    "prev1_pass_ypa", "prev1_rush_ypc", "prev1_rec_ypt", "prev2_ppr_pg",
    "prev2_games", "ppr_delta", "weighted_ppr_pg", "games_delta", "has_prev2",
)

def must_fail(fn, phrase: str | None = None) -> None:
    try:
        fn()
    except c.ContractError as exc:
        if phrase is not None:
            assert phrase in str(exc), (phrase, str(exc))
        return
    raise AssertionError("expected ContractError")

def canonical_bytes(value) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode()

def write_evaluation(state_dir: Path, year: int, rows: list[dict], fallback_count: int = 0) -> None:
    evaluation = {
        "target_season": year, "rows": rows, "fallback_count": fallback_count,
        "lineage_failures": 0,
    }
    payload = {
        "schema_version": "wr097-v21-evaluation-state-v1",
        "evaluation": evaluation,
        "evaluation_sha256": c.sha256_bytes(c.canonical_bytes(evaluation)),
    }
    (state_dir / f"evaluation-{year}.json").write_bytes(c.canonical_bytes(payload))

def synthetic_gate_rows(year: int) -> list[dict]:
    rows = []
    for pidx, pos in enumerate(c.POSITIONS):
        for i in range(30):
            target = 10.0 + pidx + i * 0.05 + (year - 2022) * 0.1
            candidate = target
            baseline = target + (0.8 if i % 2 == 0 else -0.8)
            secondary = target + (0.5 if i % 3 else -0.5)
            rows.append({
                "target_season": year, "player_id_namespace": "synthetic",
                "player_id": f"{pos}_{i:02d}", "position": pos,
                "target_ppr_pg": c.fstr(target),
                "candidate_prediction": c.fstr(candidate),
                "primary_baseline_prediction": c.fstr(baseline),
                "weighted_baseline_prediction": c.fstr(secondary),
                "same_position_mean_baseline_prediction": c.fstr(secondary),
            })
    return rows

class WR097V21ConsumerTests(unittest.TestCase):
    def test_exact_protocol_sha_and_feature_schema(self):
        data = PROTOCOL_PATH.read_bytes()
        self.assertEqual(hashlib.sha256(data).hexdigest(), c.PROTOCOL_SHA256)
        protocol = json.loads(data)
        self.assertEqual(protocol["protocol"]["id"], c.PROTOCOL_ID)
        self.assertEqual(tuple(protocol["features"]["ordered_names"]), EXPECTED_FEATURES)
        self.assertEqual(c.FEATURE_NAMES, EXPECTED_FEATURES)
        self.assertEqual(len(c.FEATURE_NAMES), 28)
        self.assertEqual(c.STAGE_YEARS, {"validation": (2022, 2023), "confirmation": (2024, 2025)})

    def test_standardize_then_clip_identical_fit_predict_and_ridge_lock(self):
        n = 100
        X = np.zeros((n, 28), dtype=np.float64)
        for j in range(28):
            X[:, j] = np.linspace(-1.0, 1.0, n) + j * 0.001
        X[-1, 0] = 1000.0  # deterministic >6-sigma training outlier
        baseline = np.linspace(8.0, 12.0, n)
        residual = np.linspace(-2.5, 2.5, n) + np.sin(np.arange(n)) * 0.2
        observed = baseline + residual
        Xp = np.vstack([X[0], X[-1] * 2.0])
        bp = np.asarray([9.0, 11.0])
        fold = c._fit_v21_fold(X, observed, baseline, Xp, bp)
        self.assertFalse(fold["fallback"])
        self.assertTrue(np.any(np.abs(fold["z_raw_train"]) > 6.0))
        self.assertLessEqual(float(np.max(np.abs(fold["z_model_train"]))), 6.0)
        self.assertLessEqual(float(np.max(np.abs(fold["z_model_pred"]))), 6.0)
        np.testing.assert_allclose(
            fold["z_model_train"], np.clip(fold["z_raw_train"], -6.0, 6.0), rtol=0, atol=0
        )
        np.testing.assert_allclose(
            fold["z_model_pred"], np.clip(fold["z_raw_pred"], -6.0, 6.0), rtol=0, atol=0
        )
        params = fold["model"].get_params(deep=False)
        self.assertEqual(
            {k: params[k] for k in c.RIDGE_CONFIG},
            c.RIDGE_CONFIG,
        )

    def test_residual_target_median_mad_bound_and_final_arithmetic(self):
        rng = np.random.default_rng(97097)
        X = rng.normal(size=(60, 28))
        baseline = np.linspace(6.0, 14.0, 60)
        residual = np.asarray([-3, -2, -1, 0, 1, 2] * 10, dtype=np.float64)
        observed = baseline + residual
        Xp = rng.normal(size=(5, 28))
        bp = np.linspace(7.0, 11.0, 5)
        fold = c._fit_v21_fold(X, observed, baseline, Xp, bp)
        self.assertFalse(fold["fallback"])
        expected_center = float(np.median(residual))
        expected_mad = float(np.median(np.abs(residual - expected_center)))
        expected_sigma = 1.4826 * expected_mad
        self.assertEqual(fold["residual_center"], expected_center)
        self.assertEqual(fold["residual_mad"], expected_mad)
        self.assertEqual(fold["robust_sigma"], expected_sigma)
        self.assertEqual(fold["lower"], expected_center - 3.0 * expected_sigma)
        self.assertEqual(fold["upper"], expected_center + 3.0 * expected_sigma)
        np.testing.assert_allclose(fold["final_prediction"], bp + fold["bounded_adjustment"])
        self.assertTrue(np.all(fold["bounded_adjustment"] >= fold["lower"]))
        self.assertTrue(np.all(fold["bounded_adjustment"] <= fold["upper"]))

    def test_zero_residual_scale_falls_back(self):
        X = np.arange(40 * 28, dtype=np.float64).reshape(40, 28)
        baseline = np.linspace(8.0, 12.0, 40)
        observed = baseline + 1.25  # all residuals identical => MAD=0
        fold = c._fit_v21_fold(X, observed, baseline, X[:2], baseline[:2])
        self.assertTrue(fold["fallback"])
        self.assertEqual(fold["fallback_reason"], "INVALID_RESIDUAL_SCALE")
        self.assertEqual(fold["robust_sigma"], 0.0)

    def test_no_named_player_or_wr_only_special_case(self):
        source = CONSUMER_PATH.read_text(encoding="utf-8")
        self.assertNotIn("00-0035864", source)
        self.assertNotIn('position == "WR"', source)
        self.assertNotIn("hyperparameter search", source.lower())
        self.assertEqual(c.POSITIONS, ("QB", "RB", "WR", "TE"))

    def test_prior_outcome_roll_forward_requires_lawful_evaluation_state(self):
        with tempfile.TemporaryDirectory() as td:
            state = Path(td)
            must_fail(lambda: c._require_prior_future_outcomes(state, 2023), "prior future-season outcome")
            write_evaluation(state, 2022, [])
            c._require_prior_future_outcomes(state, 2023)
            must_fail(lambda: c._require_prior_future_outcomes(state, 2024), "prior future-season outcome")
            write_evaluation(state, 2023, [])
            c._require_prior_future_outcomes(state, 2024)

    def test_target_before_prediction_lock_fails_before_source_read(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td); state=root/"state"; locks=root/"locks"; out=root/"out"; inp=root/"input"
            for p in (state, locks, out, inp): p.mkdir()
            context = {
                "task_id": "WR-097", "mode": "target-ingest", "stage": "validation",
                "target_season": 2022, "bindings": c.EXPECTED_BINDINGS,
                "visible_sources": [{
                    "season": 2022, "source_id": "nflverse-player-summary-2022",
                    "sha256": "0"*64, "byte_size": 1, "path": str(inp/"missing.raw"),
                }],
                "prediction_lock_sha256": "0"*64, "prediction_locks": {"2022": "0"*64},
                "gate_locks": {}, "synthetic_fixture": True,
            }
            path=inp/"context.json"; path.write_text(json.dumps(context))
            must_fail(lambda: c._target_ingest(context,path,state,locks,out), "publication manifest")

    def test_validation_requires_complete_2022_2023_and_fallbacks_zero(self):
        with tempfile.TemporaryDirectory() as td:
            state=Path(td)
            write_evaluation(state, 2022, synthetic_gate_rows(2022), fallback_count=0)
            must_fail(lambda: c._gate_metrics(state, "validation"), "invalid JSON")
            write_evaluation(state, 2023, synthetic_gate_rows(2023), fallback_count=0)
            metrics, gate = c._gate_metrics(state, "validation")
            self.assertTrue(gate)
            self.assertEqual(metrics["fallbacks"], 0)
            self.assertIn("tail_diagnostics", metrics)
            write_evaluation(state, 2023, synthetic_gate_rows(2023), fallback_count=1)
            metrics, gate = c._gate_metrics(state, "validation")
            self.assertFalse(gate)
            self.assertEqual(metrics["fallbacks"], 1)

    def test_confirmation_gate_and_2022_alone_cannot_unlock(self):
        self.assertEqual(c.STAGE_YEARS["validation"], (2022, 2023))
        self.assertEqual(c.STAGE_YEARS["confirmation"], (2024, 2025))
        with tempfile.TemporaryDirectory() as td:
            state=Path(td)
            for year in (2024, 2025):
                write_evaluation(state, year, synthetic_gate_rows(year), fallback_count=0)
            metrics, gate = c._gate_metrics(state, "confirmation")
            self.assertTrue(gate)
            self.assertTrue(metrics["bootstrap"]["gate_pass"])
        # Confirmation has exactly one prerequisite gate: complete validation.
        source=CONSUMER_PATH.read_text()
        self.assertIn('expected_prior = [] if stage == "validation" else ["validation"]', source)

    def test_publication_allowlist_and_deterministic_serialization(self):
        with tempfile.TemporaryDirectory() as td:
            out=Path(td)
            allowed=c._publication(out,"RETURNING_PLAYER_V21_MODEL_STATES",{"b":2,"a":1},"2022")
            self.assertIn("RETURNING_PLAYER_V21_MODEL_STATES_2022.json",allowed["path"])
            must_fail(lambda: c._publication(out,"ARBITRARY_RAW_SOURCE",{"x":1}),"not allowed")
        one=c.sha256_bytes(c.canonical_bytes({"b":2,"a":1}))
        two=c.sha256_bytes(c.canonical_bytes({"a":1,"b":2}))
        self.assertEqual(one,two)

    def test_provider_credential_absence_is_fail_closed(self):
        c.assert_no_provider_authority({})
        must_fail(lambda: c.assert_no_provider_authority({"WR_CUSTODY_R2_ENDPOINT":"injected"}),"provider authority")

    def test_bootstrap_conformance_fixture_exact(self):
        fixture = [
            [2022, "synthetic", "SYN_A", "QB", 1, 2],
            [2022, "synthetic", "SYN_B", "RB", 4, 2],
            [2022, "synthetic", "SYN_C", "WR", 0.5, 1],
            [2023, "synthetic", "SYN_A", "QB", 2, 3],
            [2023, "synthetic", "SYN_C", "WR", 1, 1],
            [2024, "synthetic", "SYN_C", "WR", 1.5, 2],
            [2024, "synthetic", "SYN_D", "TE", 2, 2],
            [2025, "synthetic", "SYN_D", "TE", 4, 3],
        ]
        rows=[{
            "target_season":y,"player_id_namespace":ns,"player_id":pid,"position":pos,
            "target_ppr_pg":"0","candidate_prediction":str(cerr),"primary_baseline_prediction":str(berr)
        } for y,ns,pid,pos,cerr,berr in fixture]
        proof=c._bootstrap_confirmation(rows)
        self.assertEqual(proof["cluster_sha256"],"aa63baf5f7658212ec4f13bcefbd3c0087c6186d0afcfba7aec6d84ffc86a321")
        self.assertEqual(proof["replicate_sha256"],"b4edb70c67e8c678e00465e50e017b6401ecfff0d60ed3c608fda1c651e9de6d")
        self.assertEqual(proof["rng_state_sha256"],"b235708c403dd720543444365e54f2440817a03c09ceadfbe6c46106b22a3188")
        self.assertEqual((proof["q025"],proof["q975"]),("-0.625","1"))
        self.assertFalse(proof["gate_pass"])

if __name__ == "__main__":
    unittest.main()
