# WR-103 — Synthetic pre-remediation reproduction

Task: WR-103. All inputs in this reproduction are fabricated local bytes, not retained Player Summary Stats, target outcomes, or provider data.

## Exact failed-run boundary

Workflow run `35424042233`, scoring job `105846904830`: validated authority, exact checkout/consumer identity, retained retrieval, and second live remote-head check all passed. The first `target-ingest` sandbox invocation failed closed. Publication, push, and receipt verification did not run; cleanup succeeded and artifact count was zero.

The outer log deliberately suppresses the consumer's internal error and does not itself identify the failing check.

## Reproduction before behavior change

The accepted bridge's `publication_entries()` returns and hashes four fields for each file: `path`, `sha256`, `byte_size`, `family`. The consumer's `_lock_publication_tree()` validates the same file digest/size but constructs its lock digest using only `path`, `sha256`, and `byte_size`.

A local, single-file synthetic prediction-lock manifest with correct file digest/size reproduces:

- file identity check: PASS
- bridge-generated prediction-lock SHA-256: `ce387cee06ea349358e59611c11ff75ae5e610b921a46a13b0d634bcf6e63952`
- unmodified consumer-reconstructed SHA-256: `788698784ab97d656df513aef33afc77f89aef137f47cb00c24a9564303877e8`
- exact lock equality: FAIL

The reproduction uses a synthetic file under `.ai/research/generated/RETURNING_PLAYER_V21_PREDICTIONS_PRE_OUTCOME_SYNTHETIC.json` and explicitly named synthetic `family`. No retained bytes are needed.

This mismatch is deterministic for any legitimate bridge-created prediction publication. The consumer calls `_verify_prediction_lock()` at the start of `_target_ingest()`, before `_verify_visible_sources()` and any target CSV read. The first 2022 prediction has no earlier prediction lock to validate; target-ingest is the first phase that requires verification of the newly generated prediction lock.

## Bounded fix under investigation

Align the consumer lock's canonical entry schema to the bridge's exact four-field schema while retaining file digest/size verification, allowed publication-family/path checks, immutable lock equality, and all prior chronology rules. Add a regression that fails against the original three-field consumer reconstruction and a synthetic target-ingest happy path using an immutable bridge-equivalent prediction lock.

The runner's suppressed internal exception prevents direct confirmation of its exact exception string. The deterministic pre-exposure mismatch is independently reproduced and is sufficient to explain the first target-ingest failure; no real-data rerun is authorized or needed.
