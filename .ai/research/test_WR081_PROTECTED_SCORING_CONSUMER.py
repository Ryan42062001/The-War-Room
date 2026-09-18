#!/usr/bin/env python3
"""Synthetic-only Stage-A conformance tests for WR081_PROTECTED_SCORING_CONSUMER.py."""
from __future__ import annotations

import csv
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
CONSUMER = HERE / "WR081_PROTECTED_SCORING_CONSUMER.py"

BINDINGS = {
    "source_snapshot": {
        "id": "wr-returning-player-v2-source-snapshot/1.2.0-wr059",
        "sha256": "6af88adaea478351a2b9c4884ca248dfed9527cb97f05e3648bd82c5fe0b3cea",
    },
    "cohort": {
        "id": "returning-player-v2-cohort/1.2.0-wr059",
        "sha256": "f62075ec3c13784dea4568fa69aae8a84d39ca70f074ca769132f1f143f2c3d4",
    },
    "protocol": {
        "id": "returning-player-v2-model-protocol/1.2.0-wr072",
        "sha256": "aed044e6b7df9684153181a7a97a47a86c50ce9049db063ecdd8a973b1a832b6",
        "gates_id": "returning-player-v2-result-gates/1.2.0-wr072",
    },
    "admitted_stats_source_count": 14,
    "players_metadata_admitted_count": 0,
    "draft_picks_csv_used": False,
    "source_identity_set_sha256": "8cbe874b3ceea141cbb9fedb2198ffa940ee218fe4556feace7afd8bbfb89351",
}

COLUMNS = [
    "player_id", "player_name", "player_display_name", "position", "season",
    "season_type", "games", "fantasy_points_ppr", "attempts", "carries",
    "targets", "receptions", "passing_yards", "passing_tds",
    "passing_interceptions", "rushing_yards", "rushing_tds",
    "receiving_yards", "receiving_tds", "passing_epa", "rushing_epa",
    "receiving_epa", "target_share", "air_yards_share", "wopr",
]

def canonical_bytes(value):
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")

def clean_env():
    env = os.environ.copy()
    # ChatGPT's local Python harness injects optional startup helpers; keep the
    # subprocess proof about the consumer itself. Normal GitHub runners do not
    # define these variables.
    for name in list(env):
        if name.startswith("CUA_DD_"):
            env[name] = "false"
    return env

def write_stats(directory: Path, season: int) -> dict:
    temporary = directory / f"tmp-{season}.csv"
    with temporary.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS)
        writer.writeheader()
        for p_index, position in enumerate(("QB", "RB", "WR", "TE")):
            for i in range(30):
                player_id = f"{position}{i:03d}"
                games = 16
                base = 10 + p_index * 2 + i * 0.15 + (season - 2012) * 0.9 + ((i % 3) - 1) * 0.2
                row = {column: "0" for column in COLUMNS}
                row.update({
                    "player_id": player_id,
                    "player_name": player_id,
                    "player_display_name": player_id,
                    "position": position,
                    "season": season,
                    "season_type": "REG",
                    "games": games,
                    "fantasy_points_ppr": base * games,
                    "attempts": (20 + i % 5) * games if position == "QB" else 0,
                    "carries": (10 + i % 7) * games if position in ("RB", "QB") else 0,
                    "targets": (7 + i % 5) * games if position in ("RB", "WR", "TE") else 0,
                    "receptions": (5 + i % 4) * games if position in ("RB", "WR", "TE") else 0,
                    "passing_yards": base * 15 * games if position == "QB" else 0,
                    "passing_tds": 2 * games if position == "QB" else 0,
                    "passing_interceptions": 0.5 * games if position == "QB" else 0,
                    "rushing_yards": base * 2 * games if position in ("RB", "QB") else 0,
                    "rushing_tds": 0.4 * games if position in ("RB", "QB") else 0,
                    "receiving_yards": base * 4 * games if position in ("RB", "WR", "TE") else 0,
                    "receiving_tds": 0.3 * games if position in ("RB", "WR", "TE") else 0,
                    "passing_epa": games if position == "QB" else 0,
                    "rushing_epa": 0.4 * games if position in ("RB", "QB") else 0,
                    "receiving_epa": 0.6 * games if position in ("RB", "WR", "TE") else 0,
                    "target_share": 0.1 + 0.001 * i,
                    "air_yards_share": 0.15 + 0.001 * i,
                    "wopr": 0.2 + 0.001 * i,
                })
                writer.writerow(row)
    data = temporary.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    final = directory / f"stats-{season}-{digest}.raw"
    temporary.rename(final)
    return {
        "season": season,
        "source_id": f"nflverse-player-summary-{season}",
        "sha256": digest,
        "byte_size": len(data),
        "path": str(final),
    }

def invoke(mode: str, context: dict, input_dir: Path, state: Path, locks: Path, output: Path):
    shutil.rmtree(output, ignore_errors=True)
    output.mkdir()
    context_path = input_dir / "context.json"
    context_path.write_text(json.dumps(context), encoding="utf-8")
    result = subprocess.run(
        [
            sys.executable, str(CONSUMER),
            "--wr083-mode", mode,
            "--wr083-context", str(context_path),
            "--wr083-state-dir", str(state),
            "--wr083-lock-dir", str(locks),
            "--wr083-output-dir", str(output),
        ],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        env=clean_env(),
    )
    return result

def lock_output(output: Path, locks: Path, label: str) -> str:
    manifest = json.loads((output / "publication-manifest.json").read_text(encoding="utf-8"))
    entries = sorted(
        [
            {"path": x["path"], "sha256": x["sha256"], "byte_size": x["byte_size"]}
            for x in manifest["files"]
        ],
        key=lambda x: x["path"],
    )
    digest = hashlib.sha256(canonical_bytes(entries)).hexdigest()
    shutil.copytree(output, locks / label)
    return digest

class WR081ConsumerTests(unittest.TestCase):
    def setUp(self):
        self.temp = Path(tempfile.mkdtemp(prefix="wr081-stage-a-"))
        self.state = self.temp / "state"
        self.locks = self.temp / "locks"
        self.output = self.temp / "output"
        self.state.mkdir()
        self.locks.mkdir()
        self.output.mkdir()

    def tearDown(self):
        shutil.rmtree(self.temp, ignore_errors=True)

    def test_bootstrap_conformance_fixture_exact(self):
        spec = importlib.util.spec_from_file_location("wr081_consumer_test_module", CONSUMER)
        module = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(module)
        fixture = [
            [2022, "synthetic", "SYN_A", "QB", 1, 2],
            [2022, "synthetic", "SYN_B", "RB", 4, 2],
