# WR-091 — Workflow V3.5 Candidate Architecture

Status: CANDIDATE — SELF-VALIDATION REQUIRED, THEN FRESH INDEPENDENT AUDIT

The candidate implements all six Manager-approved upgrades: schema-aware Auditor pinning, deterministic result-freeze verification, exact-SHA bootstrap CI reuse, canonical-authority-driven protected dispatch, machine-readable terminal-result semantics, and one-time authority-consumption receipt/checking.

Safety invariants: V3.4 remains canonical until fresh audit and post-merge canary; WR-082 and frozen WR-081 target are untouched; no Auditor/R&D/product/model semantics are changed; provider credentials remain absent from the consumer process; retained raw bytes remain runner-temporary and publication-blocked; exact branch/head/consumer checks remain fail closed; and all packets/receipts are evidence only, never Auditor verdicts or merge authority.

Fresh audit must specifically probe ambiguous target pinning, stale freeze evidence, branch-bootstrap lookup failure, absent/malformed canonical authority, manual identity substitution, terminal-summary ambiguity, multi-commit publication advancement, and attempted authority reuse.
