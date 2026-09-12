# Work Helper Troubleshooting Log

Purpose: durable, high-value institutional troubleshooting memory for The War Room.

Do not use this file as a command transcript or chat log.

Record only incidents/findings likely to prevent future wasted work, such as:
- significant symptoms and root causes;
- failed approaches worth avoiding;
- successful remediation patterns;
- CI/infrastructure quirks;
- cross-role dependency failures;
- evidence/provenance pitfalls;
- reusable diagnostic techniques.

For each durable entry prefer:
- Task / date;
- symptom;
- root cause or bounded conclusion;
- decisive evidence;
- approaches ruled out;
- remediation/pattern;
- future prevention/reuse note;
- checkpoint/artifact reference.

## Entries

### WR-044 / 2026-09-11 — Browser lifecycle and persistence isolation

- Symptom: unchanged documentation-only heads failed at different browser steps, including a command setting detaching/becoming hidden during `fill()` and a deleted/cleared storage key unexpectedly containing a valid autosave payload.
- Root causes: browser tests spanned intentional command-bar render generations; a long-lived stateful page lacked a boundary around the application's 400 ms debounced autosave queue.
- Decisive technique: add a fail-fast repeated targeted CI gate. An initial “wait visible” fix deterministically selected the hidden replacement and a later “open then edit” fix failed under repetition, proving the edit had to be committed in the same browser task as current-generation resolution.
- Durable pattern: for intentionally replaced DOM, settle/re-resolve/commit or focus/dispatch synchronously within one browser task across every test of that component. Before storage-destructive scenarios, drain both requestAnimationFrame and application-owned debounce queues; assert cleanup after the drain.
- Avoid: larger action timeouts, generic Playwright retries, immediate post-delete assertions, or assuming a locator's earlier visibility applies to a replacement node.
- Evidence: `.ai/work_helper/WR-044_DIAGNOSIS.md`; PR #132.

### WR-048 / 2026-09-12 — Assert lifecycle invariants at their linearization point

- Symptom: a corrupt-storage recovery test intermittently expected an active key to remain `null` but observed a newly generated valid version-2 payload.
- Root cause: corrupt recovery removed the old value correctly; later normal recommendation auditing scheduled a 400 ms autosave to the same logical key. Runner speed decided whether the assertion observed the recovery boundary or the valid successor.
- Decisive evidence: the observed payload's recommendation `recordedAt` preceded `savedAt` by approximately the configured debounce, and its schema/content identified `saveState()` rather than storage resurrection. No executable changed between the audited and integrated heads.
- Durable pattern: distinguish object/value identity from key identity. Assert deletion/quarantine synchronously at the operation's linearization point; separately validate permitted future successor state after queues settle. A quiescence wait is wrong when the contract allows later work to reuse the key.
- Avoid: treating a key as permanently absent when the application owns it for continuing state, or adding more waiting to an assertion whose truth window ends when legitimate work completes.
- Evidence: `.ai/work_helper/WR-048_DIAGNOSIS.md`.
