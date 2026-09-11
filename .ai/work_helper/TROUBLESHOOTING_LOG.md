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
- Durable pattern: for intentionally replaced DOM, settle/re-resolve/commit synchronously within one browser task. Before storage-destructive scenarios, drain both requestAnimationFrame and application-owned debounce queues; assert cleanup after the drain.
- Avoid: larger action timeouts, generic Playwright retries, immediate post-delete assertions, or assuming a locator's earlier visibility applies to a replacement node.
- Evidence: `.ai/work_helper/WR-044_DIAGNOSIS.md`; PR #132.
