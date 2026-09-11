# WR-040 — Independent Audit of Returning-Player v2 Evidence Contract

Task: `WR-040`  
Role: Independent Auditor / QA  
Audited PR: #127  
Audited immutable head: `00a9e787e716d6697e6cd0d9252982a672abbbe0`  
Audited machine-lock SHA-256: `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`  
Canonical `main` at audit refresh: `5fc4fa92608c8da27cf23433e8117da7d92ea4c0`  
Audit branch: `wr-040-v2-evidence-contract-audit`

## Final verdict

`PASS WITH NON-BLOCKING FINDINGS`

This verdict applies only to the prospective v2 evidence/provenance architecture frozen at the exact audited head above. It is not a model-performance verdict and does not authorize fitting, scoring, tuning, evaluation, ranking, outcome joins, production changes, or Phase-6 work.

## Audit boundaries and validation level

This was a contract/provenance audit. No model scoring, fitting, tuning, evaluation, ranking, or 2026 regular-season outcome analysis was performed by the Auditor.

Validation was Level 1 static/provenance review plus inspection of existing Level 2 CI evidence required by the task. No model-result or draft-behavior validation was applicable.

## Exact target and scope integrity

PR #127 contains one commit, `00a9e787e716d6697e6cd0d9252982a672abbbe0`, whose parent is WR-039's recorded starting main `6bc66fa6c779e558940ca6cc3f267441def62595`. The commit message is `research: freeze returning-player v2 evidence contract`.

The PR changes exactly five files, all under `.ai/research/**`:

- `.ai/research/HANDOFF.md`
- `.ai/research/RETURNING_PLAYER_V2_EVIDENCE_CONTRACT.md`
- `.ai/research/RETURNING_PLAYER_V2_SOURCE_RIGHTS_RETENTION.md`
- `.ai/research/generated/RETURNING_PLAYER_V2_EVIDENCE_CONTRACT.json`
- `.ai/research/generated/RETURNING_PLAYER_V2_EVIDENCE_CONTRACT.sha256`

No production file, `.ai/shared/**`, `.ai/manager/**`, `.ai/auditor/**`, WR-021/WR-023 frozen artifact, scoring output, or Phase-6 artifact is changed by PR #127.

Current `main` advancement from `6bc66fa6c779e558940ca6cc3f267441def62595` to `5fc4fa92608c8da27cf23433e8117da7d92ea4c0` is independently classified `CONTROL_PLANE_ONLY`: the intervening changes are under `.ai/**` workflow/control-plane surfaces and do not overlap PR #127's five research files. No rebase is required solely for that advancement.

## Machine lock / pre-scoring freeze

The exact machine lock at the audited head declares:

- contract ID `wr-returning-player-v2-evidence-contract`;
- contract version `1.0.0`;
- status `FROZEN_PRE_SCORING_PENDING_INDEPENDENT_AUDIT`;
- `model_scoring_performed: false`;
- `model_fitting_performed: false`;
- `outcomes_2026_inspected: false`;
- `production_authority_changed: false`;
- `phase_6_work_performed: false`.

The adjacent sidecar records the pinned SHA-256 `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a` for `RETURNING_PLAYER_V2_EVIDENCE_CONTRACT.json`. The lock also binds hashes of the two normative human artifacts and the WR-021/WR-023 prospective sentinels.

PR history contains only the contract-freeze commit and no model-result/scoring commit. The five-file diff contains no executable scoring code or result data. I found no evidence that WR-039 inspected v2 scoring results before freezing the contract.

Verdict: **PASS**.

## V1 / v2 provenance boundary

WR-D007 and WR-037 establish the historical v1 failure: the exact WR-033 Players payload was deleted/replaced, the retained v1 evidence did not preserve full-cohort keyed WR-033 feature/prediction identity, and aggregate active-row metric equality could not prove identity for the 3,508-row season-total cohort, especially the 1,627 zero-game rows.

The v2 contract does not claim that deleted payload has been reconstructed. It explicitly defines a new `returning_player_v2` lineage with new source snapshot, cohort, feature-schema, preprocessing, model-fit, prediction-surface, evaluation-run, and evidence-package identifiers. Reuse of a model family or candidate idea does not imply v1 identity. WR-035/WR-037 are historical failure-mode evidence only, not accepted v2 authority.

WR-033 may contribute documented candidate ideas only under re-versioning; it may not contribute claimed identical inputs, fitted state, predictions, or replay identity. WR-034 may remain a separately named historical availability component only when its exact accepted artifacts/hashes are independently bound; any refit is new.

This cleanly prevents silent inheritance of the WR-037 provenance defect.

Verdict: **PASS**.

## Source identity, version, cutoff, digest, and schema

The contract initially admits only three source classes:

1. `NFLVERSE_PLAYER_SUMMARY_STATS`
2. `NFLVERSE_PLAYERS_METADATA_MINIMAL`
3. `NFLVERSE_DRAFT_CAPITAL_MINIMAL`

A later no-scoring source-custody checkpoint must record, per exact source instance, source/provider/repository, exact acquisition method and canonical endpoint, acquisition UTC time, release/tag/version/release ID/asset ID/name/provider-update time, SHA-256, byte size, media/compression type, ordered schema and schema hash, row count, approved columns, target-season cutoff and availability semantics, mutability classification, rights/license/attribution fields, retention disposition, retained-object or derived-package identity/digest, acquisition-code SHA/command, and admitted/rejected/unavailable status with reason.

The authoritative source identity is exact-byte SHA-256, not URL or filename. A same-name/newer object at a mutable URL is explicitly forbidden as a fallback. Missing bytes, changed identity, digest mismatch, incomplete/changed schema, ambiguous cutoff, or unapproved rights fail closed.

Historical fake-preseason predictors must be known before a frozen target-season cutoff. Target-season Week 1+ predictors are prohibited. Future runs require a UTC cutoff committed before acquisition. Mutable metadata requires an as-of snapshot or exclusion. Post-cutoff-generated assets can be used only for fields independently demonstrated fixed and cutoff-safe.

Verdict: **PASS**.

## Source rights, licensing, redistribution, and retention

I independently reviewed the source-rights premise rather than accepting the R&D summary.

The official `nflverse/nflverse-data` repository identifies its data license as CC BY 4.0, while the official `nflverse/nflreadr` terms separately warn that the package code license does not itself grant rights to all underlying NFL data and that data remain subject to their respective owners' terms. The Players producer also combines component sources, including basic GSIS data and draft information with upstream-source caveats.

The WR-039 rights matrix is appropriately conservative rather than treating the repository-level CC BY statement as blanket permission for every upstream field:

- player-summary statistics use `CONDITIONAL_RAW_CUSTODY`, access-controlled with attribution and without an automatic public raw mirror;
- Players metadata is minimized to approved fields and uses restricted/minimal custody, excluding current status/team and unused/proprietary fields;
- draft-capital evidence carries the upstream PFR courtesy/rights caveat and remains pending per-instance rights review;
- future external/proprietary sources are not admitted without a contract version bump and independent audit.

Every exact future source instance still requires a per-instance rights decision. If auditable custody cannot be established lawfully, the source/feature class must be excluded rather than silently substituted.

The matrix therefore does not overclaim redistribution rights and is conservative enough to prevent license uncertainty from silently becoming model input authority.

Verdict: **PASS**.

## Durable raw or independently auditable derived evidence

Where rights permit, exact raw bytes must be copied before parsing into project-controlled, content-addressed immutable storage. The contract requires:

- SHA-addressed object identity;
- append-only/object-lock style custody;
- attribution/license mapping;
- retention for model life plus at least seven years after retirement;
- two independently retrievable project-controlled copies;
- quarterly digest verification plus verification before audits/reruns.

Mutable third-party URLs, filenames without byte digests, and expiring CI/Actions artifacts are explicitly non-authoritative.

For rights-limited inputs, the contract permits a derived package only when it remains independently auditable. The package must cover every considered key, bind exact features and source lineage, preprocessing/model/prediction evidence, rights decisions, and provide a lawful independent reference path. Hashes without an independently accessible reference are explicitly insufficient; lack of such a reference fails closed as a rights exclusion.

This directly addresses the archival defect that blocked v1.

Verdict: **PASS**.

## Full-row keyed feature / preprocessing / prediction evidence

The canonical row key is a versioned typed tuple of:

`(target_season, player_id_namespace, player_id, position, cohort_version)`

with duplicate keys fatal. Player names are descriptive only.

The evidence surface covers every considered player-season, including active rows, zero-game rows, rows excluded before fitting/evaluation, fallback rows, target-unavailable rows, and feature-missing rows. Required cohort statuses include `SCORED`, `TRAIN_ONLY`, `EXCLUDED`, `TARGET_UNAVAILABLE`, and `FALLBACK`, with explicit inclusion/exclusion reason.

For each row, the contract requires exact ordered pre-transform feature values, field-level missingness, source-instance/row/field lineage, feature-schema version, transform-code SHA, and canonical feature-row SHA-256.

For preprocessing/model identity, it requires complete ordered training keys and digest, preprocessing class/library/version/input order/learned parameters/state digest, model family/version/hyperparameters/fitted-state digest, split/fold identity, target definition, seed/cutoff, environment lock, code SHA, and deterministic command.

Prediction evidence is keyed per canonical row and binds exact lossless prediction/prediction status, model/fold/position identity, fallback identity, feature hash, preprocessing-state digest, model-state digest, prediction-row digest, and inclusion/exclusion reason. Zero-game rows receive the same identity/evidence requirements when predicted. Evaluation cannot proceed for a row lacking a pre-score prediction record.

Aggregate metrics and file-level digests are explicitly prohibited as substitutes for keyed row-level identity.

This is materially sufficient to prevent recurrence of the exact WR-036/WR-037 full-cohort evidence gap.

Verdict: **PASS**.

## Fail-closed behavior

The machine lock requires failure on:

- missing, duplicate, extra, or reordered cohort keys;
- source/schema/feature/preprocessing/model/environment/code digest mismatch;
- unapproved non-finite values;
- missing inclusion/exclusion reason;
- prediction without complete feature/preprocessing/model lineage;
- evaluation row without a pre-score prediction row;
- target-season information in predictor lineage;
- missing retained bytes or independently auditable rights-compatible reference;
- new bytes substituted at a locked mutable URL.

The human contract additionally prohibits silent refreshes/defaults and requires separately versioned, audited fallback lineage.

Verdict: **PASS**.

## Reproducibility lock

Before future scoring, the reproducibility lock must bind:

- this contract ID/version/hash;
- audited source-snapshot manifest and retained-object verification;
- cohort rules, ordered keys, and manifest;
- feature schema/transforms/serializer;
- target definition;
- preprocessing specification/export;
- candidate models, hyperparameters, and selection gates;
- chronological split logic;
- all seeds and deterministic-compute settings;
- dependency/runtime/OS/architecture/locale/timezone/numeric-library environment;
- repository code SHA and clean-tree assertion;
- commands and output paths;
- frozen sentinel hashes;
- 2026-outcome prohibition;
- artifact hash inventory.

The serializer forbids display-rounded floats as identity and requires versioned canonical encoding. This is sufficient as an architecture contract for a later deterministic replay gate; future exact values must be populated before scoring rather than left as placeholders.

Verdict: **PASS**.

## Prospective chronology and outcome separation

The contract freezes the required order:

1. WR-039 evidence-contract freeze;
2. WR-040 independent audit;
3. no-scoring exact source-custody checkpoint;
4. independent source-custody audit;
5. model-protocol freeze before fitting/scoring;
6. later model scoring/evaluation, with full-row evidence persisted before outcome join;
7. independent model-result audit;
8. later season-total composition;
9. independent composition audit before Phase 6.

Targets live in a separate access-controlled table and cannot be joined until after the pre-score prediction surface is locked. This is adequate to prevent target leakage and post-result provenance reconstruction.

A WR-040 PASS-family result therefore does not authorize model scoring.

Verdict: **PASS**.

## Frozen-artifact / 2026 / production boundaries

The exact five-file PR diff does not alter the WR-021 snapshot, WR-023 prospective protocol/manifest, WR-033/WR-034 historical artifacts, production code/rankings, or Phase-6 surfaces. The machine lock binds the frozen sentinel hashes and declares `outcomes_2026_inspected: false`.

No scoring code, model output, target/outcome table, or 2026 regular-season evidence is introduced by the PR. I found no evidence that WR-039 inspected 2026 regular-season outcomes.

Verdict: **PASS**.

## CI run 34613965662 — independent disposition

Overall GitHub Actions run `34613965662` is **RED / FAILURE** after the single permitted unchanged-head retry. It must not be described as successful.

### Attempt 1

The raw job log shows:

- checkout of PR #127 merge evidence containing exact head `00a9e787e716d6697e6cd0d9252982a672abbbe0`;
- WR-026 phone validation passed;
- extension unit tests passed `164/164`;
- later `test-command-bar` failed because `[data-command-setting="slot"]` detached from the DOM and subsequently remained hidden while `locator.fill` retried until timeout.

That failure is in unchanged production browser/UI test code and matches the known command-bar detached/hidden browser failure mode. None of PR #127's five `.ai/research/**` files participates in that test path.

### Attempt 2

The raw retry job log independently confirms the same immutable PR merge ref/head. It shows:

- WR-026 phone validation passed;
- extension unit tests passed `164/164`;
- production release/module/syntax/dataset checks passed before the browser failure;
- `test:browser` then failed an assertion expecting persisted storage to equal `null`, while actual storage contained a valid production persistence object with recommendation-audit state.

This is a different production-browser/state-cleanup assertion from attempt 1. Again, PR #127 changes no executable browser, persistence, state, dataset, recommendation, or test file.

### CI classification

`NON-BLOCKING`

Reason: both failures occur in structurally non-overlapping, unchanged production-browser test surfaces; the two attempts fail at different browser assertions; contract scope contains only five inert research/evidence files; and the relevant exact-head phone/unit/static checks reached and passed before the failures. The RED run therefore cannot be counted as successful CI, but it is not evidence that the v2 evidence contract is incorrect or unreproducible.

The RED state is retained as a non-blocking repository-test reliability finding below. No further WR-039 rerun is justified from this audit.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

### LOW — WR-040-AUD-01 — repository browser CI is nondeterministic outside the audited research surface

**Requirement:** WR-040 must independently disposition run `34613965662`; repository validation evidence must not be misrepresented as green, and unrelated CI instability should be separated from contract correctness.

**Evidence:** Attempt 1 fails `test-command-bar` on DOM detach/hidden-slot fill after phone and 164/164 extension tests pass. The one permitted retry on the same immutable head passes those checks again but later fails `test:browser` because persisted production state exists when the test expects `null`. PR #127 changes only five `.ai/research/**` files and no code/test/persistence surface.

**Failure:** Repository-wide CI remains RED on two materially different unchanged production-browser assertions.

**Impact:** This does not invalidate the WR-039 evidence contract, but the run cannot be represented as a successful merge gate and it indicates independent production-test/state-isolation instability that may reduce confidence in future broad CI if left unresolved.

**Required remediation:** Do not consume another WR-039 retry. Manager should track the browser-test reliability issue separately and route it to Builder/Troubleshooting only when repository CI reliability or a production merge/release gate requires resolution.

**Validation needed:** Reproduce the failing browser assertions on an appropriate current-main/product test branch, isolate DOM/state setup/cleanup, and demonstrate deterministic targeted/browser-suite behavior. This validation is outside WR-040.

**Confidence:** HIGH.

## Authorization boundary after this verdict

The exact audited contract head eligible for Manager's next decision is:

`00a9e787e716d6697e6cd0d9252982a672abbbe0`

A PASS-family WR-040 verdict permits the **Manager**, not the Auditor, to decide whether to authorize only the next **no-scoring source-custody checkpoint** governed by this frozen contract. That checkpoint may acquire/version/hash/retain exact source instances, freeze the source-snapshot/cohort inventory, and prepare independently auditable custody evidence.

It does **not** authorize:

- model fitting;
- model scoring;
- tuning or candidate comparison;
- model-performance evaluation;
- ranking or recommendation changes;
- target/outcome joins before the required pre-score prediction lock;
- 2026 regular-season outcome inspection;
- production authority changes;
- Phase-6 replacement/FLEX/MSV/value work;
- claims of WR-033 input/fitted-state/prediction/replay identity;
- silent reuse of mutable URLs or deleted v1 assets;
- use of a source instance whose rights/cutoff/custody audit has not passed.

Before any scoring, the frozen chronology still requires a no-scoring exact source-custody checkpoint, independent source-custody audit, and separately frozen model protocol.

## Recommended Manager action

Accept WR-040 as `PASS WITH NON-BLOCKING FINDINGS` for the immutable PR #127 head `00a9e787e716d6697e6cd0d9252982a672abbbe0` and machine-lock SHA-256 `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`.

Manager may then decide whether to merge/reconcile the research-contract PR under the normal repository gate and, if accepted, create/authorize the next **no-scoring source-custody** task. Do not authorize v2 model scoring until that source custody is independently audited and a later model protocol is frozen under the accepted chronology.

The unrelated RED browser-CI reliability issue should remain separately visible; it is not a reason to alter the audited contract or spend another WR-039 unchanged-head retry.

Recommended next role: **Manager / Architect**.
