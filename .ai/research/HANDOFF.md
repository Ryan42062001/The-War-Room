# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-021
Role: Research & Development (R&D)
Status: ASSIGNED / ACTIVE

## Previous task closure
WR-018 — Open-Data Shadow Ranking Model Experiment is COMPLETE.

- research PR #115 head: `0c2f7e9e307ff30293ff96ab66fb0b1a72c8b051`
- exact-head War Room CI #858 / `34367526671`: SUCCESS
- PR #115 merged as `9c7aa3b8b7b2600c50dac0f050f6da97b4aed08b`
- Manager WR-020 accepted the result as `MORE EVIDENCE NEEDED`
- production ranking authority changed: NO
- WR-D001 remains ACTIVE

WR-018 established that richer prior-season summary-only models did not reliably beat the previous-season PPR/game naive baseline. It also produced a clean research-only 2026 returning-player shadow snapshot.

## Current assignment
WR-021 — Context-Enriched Preseason Shadow Model Validation
Manager task spec: `.ai/manager/WR-021.md`
Production implementation authorization: NONE

Refresh current canonical `main` before branching and record the exact starting SHA.

## Objective
Test whether genuinely preseason, rights-cleared context can materially improve the War Room-owned shadow model beyond WR-018, while remaining completely disconnected from production rankings.

## Required methodological corrections
- Define the historical evaluation cohort from preseason information only. Do not use target-season games/results to decide inclusion.
- Include rookies/no-prior-history players when defensible preseason records exist and use a transparent rookie baseline.
- Treat zero/low target-season participation as an availability outcome rather than silently excluding those players.
- Verify rights and point-in-time semantics before using age/experience, draft capital, team movement, roster/depth/injury context.
- Use earlier seasons for model/feature selection; 2022–2025 are confirmatory because their outcomes were already observed in WR-018.
- Use repeated-player-aware uncertainty rather than treating every player-season row as independent.
- Apply the predeclared material-lift gate in WR-021 exactly as written.

## Source guardrails
Do NOT use:
- PFF/PFF-derived data
- systematic NFL Next Gen Stats / NFL Pro without explicit modeling rights
- FantasyPros historical/API data for training or historical benchmarking without explicit rights
- unclear-rights paid/private/scraped data
- hindsight-reconstructed role/depth/injury information

Technical accessibility is not permission.

## 2026 time-sensitive opportunity
If execution begins before the first 2026 regular-season kickoff, freeze a new context-enriched research-only 2026 snapshot before kickoff. Record timestamp, source versions/hashes, coverage, and limitations. If the clean window has passed, do not reconstruct it retrospectively; preserve the WR-018 snapshot as the clean prospective artifact.

## Required outputs
Produce:
- `.ai/research/CONTEXT_SHADOW_SOURCE_MANIFEST.md`
- `.ai/research/CONTEXT_SHADOW_EXPERIMENT.md`
- reproducible research code/config
- compact generated metrics/provenance artifacts
- enriched 2026 snapshot if prospectively valid
- updated `.ai/research/HANDOFF.md`

Do not modify production files or `.ai/shared/*`.
Do not merge your own research PR.

## Final classification
Return exactly one:
- `PROMISING — CONTINUE VALIDATION`
- `MORE EVIDENCE NEEDED`
- `DO NOT PURSUE`

Even `PROMISING` does not authorize production.

## Exact next action
Execute WR-021 exactly as specified in `.ai/manager/WR-021.md`. Start from refreshed canonical main, create a dedicated research branch, freeze the experiment design before confirmatory scoring, and preserve all production ranking behavior unchanged.
