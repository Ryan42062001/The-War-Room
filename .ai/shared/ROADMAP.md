# War Room Roadmap

Status: ACTIVE DEVELOPMENT — CUSTODY CREDENTIAL-SCOPE REMEDIATION / WR-050 RE-AUDIT GATE
Last updated: 2026-09-12
Owner: Manager / Architect

## Production baseline
FantasyPros remains production ranking authority under WR-D001. ESPN rank/ADP remains downstream market timing only. WR-021 / WR-023 prospective artifacts remain frozen and untouched.

## Workflow governance
WR-041 established Work Helper / Super Troubleshooter as a permanent privileged role. Its no-fixed-attempt-limit exemption does not change Manager governance or independent-audit requirements.

## Ranking R&D history
- WR-018 — COMPLETE / MORE EVIDENCE NEEDED
- WR-021 — COMPLETE / PROMISING — CONTINUE VALIDATION / research only
- WR-023 — COMPLETE / prospective protocol frozen
- WR-025 — COMPLETE / ACCEPTED / returning-player Ridge mean projection promising
- WR-027 — COMPLETE / ACCEPTED / risk warning-only; Huber rejected
- WR-029 — COMPLETE / ACCEPTED / no advanced enrichment family promoted
- WR-033 — COMPLETE / CLOSED / Returning-Player v1 Specification Freeze
- WR-034 — COMPLETE / ACCEPTED / expected-games model supported
- WR-035 — CLOSED / INSUFFICIENT EVIDENCE FOR PHASE-5 ACCEPTANCE
- WR-036 — COMPLETE / FAIL — REMEDIATION REQUIRED
- WR-037 — CLOSED / REMEDIATION BLOCKED — UPSTREAM IDENTITY NOT PROVABLE
- WR-038 — CLOSED / NOT ACTIVATED / SUPERSEDED
- WR-039 — COMPLETE / ACCEPTED / MERGED — v2 prospective evidence contract
- WR-040 — COMPLETE / PASS WITH NON-BLOCKING FINDINGS / MERGED
- WR-041 — COMPLETE / permanent Work Helper role
- WR-042 — BLOCKED / fail-closed exact source custody; PR #133 blocker evidence
- WR-043 — BLOCKED / independent source-custody audit; no admitted target yet
- WR-044 — CLOSED / exact audited browser-CI remediation merged
- WR-045 — CLOSED / PASS on exact WR-044 target
- WR-046 — REWORK_REQUIRED / credential-scope attestation gap; now unblocked for Work Helper
- WR-047 — CLOSED / FAIL — REMEDIATION REQUIRED
- WR-048 — CLOSED / ACCEPTED / MERGED
- WR-049 — CLOSED / PASS
- WR-050 — BLOCKED / fresh audit of remediated WR-046 credential scopes

## Historical returning-player architecture
The historical v1 architecture remains documented under WR-D005 / WR-D006. WR-D007 does not rewrite it and does not claim newly sourced metadata reproduces the deleted WR-033 upstream asset.

## Roadmap phases
### Phase 0 — Evidence foundation — COMPLETE
WR-018 / WR-021 / WR-023 / WR-025.

### Phase 1 — Position-specific risk calibration — COMPLETE
WR-027 accepted.

### Phase 1.5 — Advanced context enrichment — COMPLETE
WR-029 accepted. No enrichment family promoted.

### Phase 2 — Returning-player v1 specification freeze — COMPLETE / HISTORICAL
WR-033 / WR-D005. Later exact Phase-5 composition certification is not provable for the complete scored cohort because the original upstream Players payload is unavailable.

### Phase 3 — Rookie engine v1 — PLANNED
Transparent position + draft-capital prior remains benchmark unless a lawful chronological challenger wins.

### Phase 4 — Availability / expected-games model — COMPLETE
WR-034 / WR-D006 accepted as historical stats-only availability/continuation evidence.

### Phase 5A — v1 season-total composition — CLOSED / INSUFFICIENT EVIDENCE
WR-035 / PR #124 remains closed unmerged. WR-037 returned `REMEDIATION BLOCKED — UPSTREAM IDENTITY NOT PROVABLE`. WR-038 was never activated.

### Phase 5B — Returning-Player v2 evidence reset — ACTIVE / CREDENTIAL-SCOPE REMEDIATION
WR-D007 authorized the v2 reset. WR-D008 accepts the independently audited prospective evidence contract.

#### WR-039 — Prospective evidence contract — COMPLETE / ACCEPTED / MERGED
Exact audited head: `00a9e787e716d6697e6cd0d9252982a672abbbe0`.
Machine-lock SHA-256: `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`.

#### WR-040 — Independent contract audit — COMPLETE
Final verdict: `PASS WITH NON-BLOCKING FINDINGS`.

#### WR-042 — Exact source-custody freeze — BLOCKED / FAIL CLOSED
R&D blocker target: PR #133 / `1c3c6d768d58aa636194226f16b9822eebc8c19f`. No source was admitted.

#### WR-043 — Independent source-custody audit — BLOCKED
Wait for a later R&D custody target that actually admits and freezes sources.

#### WR-046 — Source-custody capability recovery — REWORK_REQUIRED / UNBLOCKED
PR #135 exact audited head `64ba4aff697c1f45472045b52f374b01ee9e1695` passed custody mechanics but lacks independently attested provider-side least-privilege scope evidence for the exact configured credentials.

Remediation is bounded to provider-issued privacy-safe authorization metadata for B2 and both Cloudflare credentials. If a credential is broader than approved, re-scope/replace it and repeat live proof; otherwise preserve the existing live proof.

#### WR-047 — Independent capability audit — CLOSED / FAIL
Audit head `03309c9e6cf39b13742e278d787559d94813670f`; audit evidence merged at `2f6cbd64d845813307a67207045e1e852fdad774`.

Only blocking finding: HIGH `WR-047-AUD-01` — actual provider-side least-privilege credential scopes were asserted but not independently attested.

#### WR-050 — Fresh credential-scope re-audit — BLOCKED
Activate only after WR-046 publishes one immutable remediated head. PASS-family WR-050 is the next custody capability acceptance gate.

### Repository validation reliability lane — CLOSED / ACCEPTED
#### WR-044 — Exact-head remediation — CLOSED / MERGED
Exact audited remediation head `e750748d938ed6bb8284eeec1cfda9eea77997ac` received WR-045 PASS and was merged.

#### WR-045 — Exact-head audit — CLOSED / PASS
Historical exact-target verdict remains valid for the target reviewed.

#### WR-048 — Post-integration persistence determinism residual — CLOSED / ACCEPTED / MERGED
Exact remediation head: `f93f4b6b17ab158974763069d9882e5782a526dd`.

The residual was traced to an incorrect test invariant around corrupt-payload recovery versus a later valid version-2 autosave successor. The strict null assertion remains at the atomic recovery boundary, later successor-state coverage remains, and no retry/masking/timeout workaround was introduced.

Exact-head CI run `34668044160` passed three consecutive attempts with 10/10 targeted persistence runs and 5/5 complete determinism cycles per attempt plus full test and resilience gates.

Merged at canonical merge `62cbb22df817a156a8396bedfd0a7f4d7f399532`, preserving the exact audited implementation commit as a parent.

#### WR-049 — Independent residual audit — CLOSED / PASS
Audit head: `2f4e584c5b76647ee21846a83787ca9b2bfcce10`.

Final verdict: `PASS`; no findings at any severity.

Audit evidence merged at `98a4964e7f9d6392d97e2b7282de55eb6f477020` before WR-048 acceptance.

### Phase 6 — Replacement / cross-position draft value — BLOCKED ON ACCEPTED V2 SEASON-TOTAL PATH
Leading advisory candidate remains deterministic eligibility-constrained starter assignment / marginal starter value (MSV). Do not activate Phase 6 until the v2 evidence/source/model/season-total chain is independently accepted and Manager explicitly opens the gate.

### Phase 7 — Complete historical replay — PLANNED
### Phase 8 — 2026 custom development board — PLANNED
### Phase 9 — Shadow production integration — PLANNED
### Phase 10 — Independent engine QA — PLANNED
### Phase 11 — WR-023 2026 prospective validation — FROZEN / EVENT-DRIVEN
### Phase 12 — Production-ranking promotion decision — FUTURE / CONDITIONAL

## Current roles
- Manager: IDLE after reconciliation
- Builder: IDLE
- Draft Strategy: IDLE
- R&D: IDLE / WR-042 BLOCKED
- Auditor: IDLE / WR-050 BLOCKED
- Work Helper: AVAILABLE FOR WR-046 bounded credential-scope remediation
- WR-043: BLOCKED
