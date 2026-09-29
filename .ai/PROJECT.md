# The War Room — Project Context

The War Room is a browser-first fantasy football draft companion for redraft PPR leagues. It combines a FantasyPros-authoritative player-value board with ESPN market timing and an optional read-only Chrome companion for live draft synchronization.

Current baseline:
- The mature draft-day foundation is implemented: board/tiers, roster state, recommendation logic, persistence/recovery, mobile layouts, post-draft reporting, and ESPN fallback synchronization.
- FantasyPros Top-20 PPR ECR remains the primary value/ranking authority. Broader FantasyPros ECR provides deeper fallback; ESPN board rank/ADP are market-timing signals, not value authority.
- The ESPN companion remains read-only. No ESPN lineup, waiver, trade, or draft write path is authorized.
- Historical Workflow V3.x/V3.5 roles, tasks, audits, research evidence, and control-plane machinery are preserved under `.history/workflow-v3-5/` and are not active governance.
- Historical WR-154 owner-operated fallback planning is translated into the next coherent V2.1 phase rather than continued as a task lane.

Active governance:
- Speed Workflow V2.1 is canonical.
- Ryan is Product Owner; ChatGPT is Manager/Architect/Planner; one Primary Codex Builder owns a phase by default.
- Product phase merge does not itself authorize production deployment.
- Private ESPN account/session information must never be committed to repository evidence.
