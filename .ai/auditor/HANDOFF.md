# Independent Auditor / QA Handoff

HANDOFF

STATUS: COMPLETE — PASS

TASK: WR-075 — Independent Audit of Self-Hosted Heavy-CI Runner Pilot

ROLE: Independent Auditor / QA

BRANCH: `wr-075-self-hosted-heavy-ci-runner-audit`

BASE: canonical main verified at `26060aa426ca9ec3bebdeb38735c1b5ae351b09c`.

AUDITED TARGET:
- WR-074
- PR #307
- branch `wr-074-self-hosted-heavy-ci-runner-pilot`
- exact frozen SHA `75fcd3756956b2943f18aff03115f9783a16d0aa`
- immutable implementation SHA `c2e511da5d3767cbc0688de7e95236135a6975b2`
- canonical implementation base `cb544da20c7b82ded5552d425d69b8a47c880f30`

VERDICT: `PASS`

FINDINGS:
- CRITICAL: none
- HIGH: none
- MEDIUM: none
- LOW: none

INDEPENDENTLY VERIFIED:
- PR #307 open, draft, unmerged at exact frozen target;
- exact six-path WR-074 scope;
- base-to-implementation contains only pilot workflow/helper/validator + Work Helper activation evidence;
- implementation-to-final contains only Work Helper report/activation/handoff evidence;
- no Windows diagnostic/shim files remain;
- exact push-only WR-074 branch trigger;
- exact dedicated `[self-hosted, war-room-heavy-ci]` route;
- no `pull_request` or `pull_request_target` route;
- GitHub-hosted exact repo/ref/actor trust gate;
- top-level `contents: read`;
- checkout `persist-credentials: false`;
- no WR-074 `secrets.*` references;
- provider/custody authority absent in successful self-hosted evidence;
- no retained-provider retrieval on self-hosted;
- canonical `ci.yml` byte-identical and fully GitHub-hosted;
- custody/protected workflows byte-identical and still GitHub-hosted;
- repeated self-hosted preflight + cleanup proves no node_modules/artifacts/sentinel residue, Git clean, provider authority absent;
- two distinct successful self-hosted parity runs plus matched hosted references;
- final frozen head was actually fetched/checked out at `75fcd3756956b2943f18aff03115f9783a16d0aa`;
- final target pilot and canonical War Room CI succeeded;
- Linux / X64 / WSL2 environment evidence;
- non-Linux helper path fails closed;
- helper hashes runner-name evidence, does not deliberately print precise workspace path, does not enumerate unrelated files, and does not expose credential values;
- standard GitHub self-hosted bootstrap metadata remains a platform-level operational privacy characteristic, not WR-074-authored logging;
- release validator changed by exactly one allowlist entry for WR-074 while preserving all existing V3.5 workflows;
- release validation succeeded on repeated parity runs and final frozen target;
- no production/ranking/strategy/research/model/custody/Phase-6/Manager/shared contamination.

REPEATED PARITY:
- run `35460866285`: trust `105944368659` SUCCESS; self `105944382151` SUCCESS; hosted `105944382105` SUCCESS.
- run `35461197805`: trust `105945263537` SUCCESS; self `105945274820` SUCCESS; hosted `105945274919` SUCCESS.

BENCHMARK:
- run 1 stress: self 183154 ms vs hosted 160436 ms = 14.16% slower;
- run 2 stress: self 182270 ms vs hosted 137516 ms = 32.54% slower;
- mean stress: self 182712 ms vs hosted 148976 ms = 22.65% slower;
- run 1 resilience: self 17624 ms vs hosted 16211 ms = 8.72% slower;
- run 2 resilience: self 18956 ms vs hosted 14655 ms = 29.35% slower;
- mean resilience: self 18290 ms vs hosted 15433 ms = 18.51% slower.
- conclusion: functional/security viability only; no speed advantage.

FINAL TARGET:
- pilot run `35461615030` — SUCCESS
  - trust `105946380768`
  - hosted `105946392493`
  - self-hosted `105946392540`
- War Room CI `35461622646` — SUCCESS
  - classify `105946400743`
  - governance `105946432859`
  - bootstrap-reuse `105946433631` SKIPPED
  - test `105946457088` SUCCESS

CANONICAL MANAGER EVIDENCE:
- Manager freeze checkpoint `58eded3958d296d3392aac2cb1fdd92a0cd513c8`
- post-freeze CI `35462263434` SUCCESS
- post-activation CI `35462363341` SUCCESS

BOUNDARY:
No WR-074 target/workflow/helper modification, runner reconfiguration, custody/provider access, product/research/Manager/shared write, remediation, or target merge occurred in this audit.

NEXT ACTION:
Manager may consume PASS only for exact WR-074 SHA `75fcd3756956b2943f18aff03115f9783a16d0aa`. If accepted, integrate only that exact audited target and run required canonical-main post-merge/full-CI validation before treating the pilot as accepted infrastructure. This PASS does not authorize broader triggers, generic self-hosted routing, credential-bearing self-hosted workloads, arbitrary PR execution, or a performance-superiority claim.

FILES / ARTIFACTS THAT MATTER:
- `.ai/auditor/WR-075_AUDIT.md`
- `.ai/auditor/HANDOFF.md`
- PR #307
- frozen target `75fcd3756956b2943f18aff03115f9783a16d0aa`
- pilot runs `35460866285`, `35461197805`, `35461615030`
- final War Room CI `35461622646`

DO NOT REPEAT:
Do not transfer this PASS to a changed WR-074 SHA. Do not merge PR #307 as Auditor. Do not broaden runner labels/triggers, change runner configuration, or route credential-bearing/custody work onto self-hosted from this lane.
