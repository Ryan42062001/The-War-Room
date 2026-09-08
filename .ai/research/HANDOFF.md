# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-010
Role: Research & Development (R&D)
Status: ASSIGNED — NOT YET COMPLETED

## Current assignment

Task: Ranking Accuracy & Automated Ingestion Feasibility
Manager task spec: `.ai/manager/WR-010.md`
Starting SHA: `2cab85f981e06f5f19bd4a7631a28adf2f7ff351`
Project mode: MAINTENANCE / STABLE
Production implementation authorization: NONE

## Trigger

The user asked whether the War Room can identify the most accurate publicly available preseason rankings and automatically ingest them. Manager classified this as a legitimate maintenance trigger: materially valuable opportunity / potential seasonal-data-refresh improvement.

## Objective

Determine whether there is a materially better, evidence-backed ranking source/cohort than the current production baseline and whether a supported automatic ingestion path can be used safely and permissibly.

Key questions include:
- who/what is most accurate over multiple preseason draft seasons
- whether a single expert or an accurate-expert consensus is better suited to the War Room
- how to account for FantasyPros' Half-PPR accuracy methodology while the War Room uses PPR
- whether the official FantasyPros API can provide the required PPR rankings/expert filters/player metadata
- whether access/license terms permit the intended private/personal use
- how an importer would fail closed and preserve last-known-good ranking authority

## Manager preliminary evidence to verify independently

- FantasyPros publishes current preseason Draft Accuracy and a 2023–2025 multi-year leaderboard.
- Current public multi-year results put Jody Smith first, with Sean Koerner and Joey Wright immediately behind; 2025 single-year #1 was Seth Miller.
- FantasyPros Draft Accuracy is based on Half-PPR, not PPR.
- FantasyPros now advertises an official JSON API with PPR consensus rankings, per-expert rankings, expert metadata/filtering, tiers, and player metadata.
- API free access is for prototyping; personal production API access is associated with HOF, and published usage restrictions must be reviewed before any production recommendation.

Treat these as starting evidence, not accepted conclusions.

## Required outputs

Prefer:
- `.ai/research/RANKING_INGESTION_DISCOVERY.md`
- updated `.ai/research/HANDOFF.md`
- optional isolated non-production experiment artifacts under `.ai/research/`

Return one of:
- READY FOR MANAGER MILESTONE CONSIDERATION
- R&D ONLY / MORE EVIDENCE NEEDED
- DO NOT PURSUE

## Authority limits

- do not modify production ranking data
- do not modify scoring/recommendations
- do not integrate an API into production
- do not store API keys/tokens in the repository
- do not modify canonical `.ai/shared/*`
- do not open a production PR
- do not assume public visibility equals scraping permission
- do not assume an API license is compatible without evidence
- final roadmap/architecture/implementation authority remains Manager

## Exact next action

Refresh canonical repository state and execute WR-010 exactly as specified in `.ai/manager/WR-010.md`. Produce an evidence-backed ranking-source and automated-ingestion recommendation, then return control to Manager / Architect. Do not implement production changes.
