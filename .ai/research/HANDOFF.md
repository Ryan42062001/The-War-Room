# Research & Development (R&D) Handoff

HANDOFF

Task ID: WR-057
Role: R&D
Status: COMPLETE — MANAGER REVIEW REQUIRED
Canonical main at task refresh: `98d0ec3cc65840669aa06b93336132923cbdbddf`
Branch: `wr-057-draft-picks-rights-disposition`
Execution mode: `WORK_MODE_PREFERRED`; normal chat/web/repository fallback used
Primary artifact: `.ai/research/WR057_DRAFT_PICKS_RIGHTS_DISPOSITION.md`

## Disposition

**`RAW_CUSTODY_NOT_ESTABLISHED — EXCLUDE_SOURCE`**

The current authoritative evidence does not establish the full upstream rights chain required to retain the PFR-derived nflverse `draft_picks.csv` bytes as an independently auditable source for later predictive-model research.

Key evidence:
- nflverse-data is published under CC BY 4.0, but the license grants only rights the licensor has authority to grant and preserves third-party-rights limitations;
- nflreadr states accessed NFL data belong to their respective owners and are governed by those owners' terms;
- nflverse identifies `draft_picks` as provided by / courtesy of Pro Football Reference;
- Sports Reference's current Terms expressly restrict using Site data for AI/ML training and for machine-learning methods that predict/classify/label/score;
- no authoritative evidence was found of separate upstream permission covering War Room's required private raw retention, Auditor access, derived minimal-column retention, and intended predictive-model use.

This is a conservative research-governance finding, not legal advice and not a declaration that historical draft facts are legally unusable.

## Boundaries

Returning-Player source downloaded/admitted/custodied: NO
`draft_picks.csv` parsed: NO
2026 regular-season outcomes inspected: NO
Model fit/score/tune/compare/evaluate: NO
Outcome join: NO
Ranking/recommendation/production changes: NO
WR-039 / WR-D008 semantics changed: NO
Phase-6 work: NO

## Next action

Manager / Architect reviews and accepts or rejects the WR-057 disposition. Until Manager accepts it, WR-042 remains BLOCKED. If accepted, `draft_picks.csv` must remain excluded from custody/use; any future draft-capital source/schema requires the appropriate versioned contract and governance gates. WR-057 does not self-activate WR-042 or WR-043.

Exact immutable branch head and PR are recorded at publication and must not be inferred from this committed handoff because adding a self-reference would move the target.
