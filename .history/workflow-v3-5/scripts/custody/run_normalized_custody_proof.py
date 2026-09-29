#!/usr/bin/env python3
"""Run the WR-046 custody proof with normalized GitHub Actions values.

GitHub secret/variable values can accidentally acquire surrounding CR/LF or spaces
when copied from provider dashboards. Provider credentials and identifiers used by
this proof are token-like values for which surrounding whitespace is never valid.
This wrapper strips only surrounding whitespace in the child-process environment;
it never prints credential values.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ENV_NAMES = (
    "WR_CUSTODY_B2_KEY_ID",
    "WR_CUSTODY_B2_APPLICATION_KEY",
    "WR_CUSTODY_R2_ACCESS_KEY_ID",
    "WR_CUSTODY_R2_SECRET_ACCESS_KEY",
    "WR_CUSTODY_R2_CONFIG_READ_TOKEN",
    "WR_CUSTODY_B2_BUCKET",
    "WR_CUSTODY_B2_ENDPOINT",
    "WR_CUSTODY_R2_BUCKET",
    "WR_CUSTODY_R2_ENDPOINT",
    "WR_CUSTODY_R2_ACCOUNT_ID",
    "WR_CUSTODY_R2_JURISDICTION",
)


def main() -> int:
    env = os.environ.copy()
    missing: list[str] = []
    normalized: list[str] = []

    for name in ENV_NAMES:
        raw = os.environ.get(name)
        if raw is None or not raw.strip():
            missing.append(name)
            continue
        clean = raw.strip()
        env[name] = clean
        if clean != raw:
            normalized.append(name)

    if missing:
        print(
            "WR-046 normalized proof runner missing required environment names: "
            + ", ".join(sorted(missing)),
            file=sys.stderr,
        )
        return 2

    # Report names only, never values. This is useful audit evidence that a copied
    # credential/config value required harmless transport normalization.
    if normalized:
        print("Normalized surrounding whitespace for environment names: " + ", ".join(sorted(normalized)))

    proof = Path(__file__).with_name("prove_b2_r2_custody.py")
    result = subprocess.run([sys.executable, str(proof), *sys.argv[1:]], env=env, check=False)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
