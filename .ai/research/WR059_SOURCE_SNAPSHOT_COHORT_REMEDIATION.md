# WR-059 Source-Snapshot + Cohort Evidence Remediation Report

Status: `COMPLETE — MANAGER REVIEW REQUIRED`

Task: `WR-059 — Returning-Player v2 Source-Snapshot + Cohort Evidence Remediation`

Starting canonical main / branch baseline: `8ded5ed8e32e3a0688e53b544048fcf7ffd3b4dd`  
Assigned branch: `wr-059-v2-source-snapshot-cohort-remediation-2`

## Findings remediated

### WR-043-AUD-01 — HIGH

**Remediated.** The new source snapshot supplies all WR-039 source-instance evidence for the 15 exact already-custodied sources, using accepted WR-042 custody identity plus WR-069 deterministic derived parser evidence.

Source snapshot:

- ID: `wr-returning-player-v2-source-snapshot/1.1.0-wr059`
- SHA-256: `f6ee530c7733b1aa9d984a3e874015ca9a3dd7cebda5ffc558df4cb159c591b9`

### WR-043-AUD-02 — HIGH

**Remediated.** The cohort artifact supplies a deterministic complete ordered inventory specification for all 5,176 historical keys across target seasons 2014–2025.

The exact 1,668 previously missing TRAIN_ONLY identities come from accepted WR-069 inventories. The existing 3,508 2018–2025 identities remain bound to the frozen WR034 repository artifact. Duplicate count is zero.

Cohort:

- version: `returning-player-v2-cohort/1.1.0-wr059`
- SHA-256: `d6927509968ac3a371591a69fd665861e9546a0868f1e7b1c5db6c31cc887354`

## Authority chain

1. WR-039 / WR-D008: frozen evidence contract and machine lock.
2. WR-040: independent contract audit.
3. WR-057: `draft_picks.csv` exclusion.
4. WR-042: exact 15-source immutable B2/R2 custody.
5. WR-043: identified the two missing evidence layers, while accepting custody credibility.
6. WR-067/068: deterministic CSV typed-schema inference contract and audit.
7. WR-063/064: retained-version read infrastructure and audit.
8. WR-069/070: privacy-safe deterministic retained-byte parser evidence and independent PASS.
9. WR-059 (this checkpoint): combines those accepted authorities into the complete immutable source-snapshot + cohort checkpoint.

## Validation actually run

Local deterministic generation/checks:

```text
python: serialize source snapshot using sorted keys, compact separators, ensure_ascii=false, LF final byte
python: SHA-256(exact source-snapshot bytes) == f6ee530c7733b1aa9d984a3e874015ca9a3dd7cebda5ffc558df4cb159c591b9
python: source_instances == 15
python: admitted_source_count == 15
python: exact retained SHA/size identities match accepted WR-042/WR-069 inputs

python: serialize cohort artifact using identical canonical JSON rules
python: SHA-256(exact cohort bytes) == d6927509968ac3a371591a69fd665861e9546a0868f1e7b1c5db6c31cc887354
python: sum ordered segment counts == 5176
python: 2014–2017 accepted inventory counts == 1668
python: 2018–2025 frozen inventory counts == 3508
python: duplicate_count == 0
python: full_declared_key_coverage == true
python: source_snapshot_id/hash binding matches exact generated source snapshot
```

Repository publication validation is completed after the immutable commit:
- compare base → head and require every changed path under `.ai/research/**`;
- exact-head War Room CI governance must pass;
- product tests may be skipped for research-only scope according to Workflow V3.2.

## Preserved boundaries

No raw custody was redone. No provider credentials or retained raw bytes were required by R&D. No upstream source bytes were reacquired. `draft_picks.csv` remains excluded. No 2026 regular-season outcome-table inspection, target/outcome join, fit, score, tune, comparison, evaluation, prediction, ranking change, production change, provider mutation, or Phase-6 work occurred.

A later separately versioned feature-schema/model-protocol governance gate remains mandatory before any model path.
