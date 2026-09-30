# The War Room — Project Context

The War Room is a browser-first fantasy football draft companion for redraft PPR leagues. It combines a FantasyPros-authoritative player-value board with ESPN market timing and an optional read-only Chrome companion for live draft synchronization.

Current baseline:
- The mature draft-day foundation is implemented: board/tiers, roster state, recommendation logic, persistence/recovery, mobile layouts, post-draft reporting, and ESPN fallback synchronization.
- WR-P01 is CLOSED and established the visible Board/Pick History fallback as the supported ESPN synchronization path for now within its exact tested envelope.
- FantasyPros Top-20 PPR ECR remains the primary value/ranking authority. Broader FantasyPros ECR provides deeper fallback; ESPN board rank/ADP are market-timing signals, not value authority.
- The ESPN companion remains read-only. No ESPN lineup, waiver, trade, or draft write path is authorized.
- Structured Direct remains unverified and is backlog only, not a roadmap dependency.
- Historical Workflow V3.x/V3.5 roles, tasks, audits, research evidence, and control-plane machinery are preserved under `.history/workflow-v3-5/` and are not active governance.

Product direction:
- The north star is to make the strongest available draft decision and the opportunity cost of waiting understandable in under five seconds while Ryan is on the clock.
- The next planned phase is WR-P02 — Draft-Day UX & Command Center.
- The forward roadmap then moves through Recommendation Engine V2, league/roster personalization, pre-draft planning, data freshness, a draft simulator/regression lab, and a production-season release baseline.
- Season-long fantasy features, unsupported draft formats, Structured Direct, and generic AI layers remain outside the critical-path roadmap unless separately justified.

Active governance:
- Speed Workflow V2.1 is canonical.
- Ryan is Product Owner; ChatGPT is Manager/Architect/Planner; one Primary Codex Builder owns a phase by default.
- Product phase merge does not itself authorize production deployment.
- Private ESPN account/session information must never be committed to repository evidence.
