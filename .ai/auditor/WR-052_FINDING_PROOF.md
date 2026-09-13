# WR-052 Collision Proof

The audited `workflow-state-check.mjs` skips a runnable task pair whenever either participant has dependency class `HARD`.

Adversarial case:

- task A: runnable, `dependency: HARD`, no dependency relation to task B, allowed write prefix `src/`;
- task B: runnable, `dependency: INDEPENDENT`, no dependency relation to task A, allowed write prefix `src/`;
- neither participant forbids `src/`.

Effective write overlap is `src/`, but the current HARD shortcut skips the pair before overlap evaluation.

This is the independent proof for `WR-052-AUD-01` in `.ai/auditor/WR-052_AUDIT.md`.
