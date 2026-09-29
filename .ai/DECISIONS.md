# Current Decisions

- Speed Workflow V2.1 supersedes Workflow V3.x/V3.5 as active repository governance.
- The Speed Workflow V2.1 migration closed on canonical merge commit `5c4314902aaa38b9bddacfb35008fd5b93cefa8c` after targeted independent PASS of audited target `d9d85ef573af73ff47a33598db0541a898e1e0f3`.
- Historical workflow/control-plane/research evidence is preserved under `.history/workflow-v3-5/` and is not active authority.
- One coherent phase branch/PR and one Primary Builder are the default; task-per-branch manager/auditor/work-helper lanes are retired.
- FAST CI runs on pushes without duplicate ordinary PR FAST runs.
- FULL PHASE CI is deliberate through the `full-phase-ci` label event or manual full dispatch and validates the exact PR head.
- MEDIUM/HIGH phases receive one fresh independent phase audit. Eligible LOW phases may skip only with explicit rationale.
- External/admin order is Manager connector → OWNER ACTION REQUIRED → Codex browser/computer-use only when justified.
- The three-attempt budget applies to the same material implementation/security/data blocker, not bookkeeping or CI wiring.
- FantasyPros Top-20 PPR ECR remains authoritative for player value; broader FantasyPros ECR is fallback depth; ESPN board rank/ADP remain timing signals.
- The ESPN companion remains read-only. No provider write action is authorized.
- Historical WR-154 is not continued as a task lane; its useful exact-current fallback requirements are carried into WR-P01.
- Structured ESPN Direct mode remains unverified and is not required to establish a Board/Pick History fallback pass.
- GitHub Pages source was owner-confirmed as GitHub Actions before the V2.1 migration merge. Production publication now remains behind the manual `Deploy War Room Production` workflow and requires separate Product Owner authorization.
- Residual LOW backlog: release validation does not explicitly reject a hypothetical non-deployment job using YAML shorthand `permissions: write-all`; that shorthand is absent from the audited production workflow.
- WR-P01 — ESPN Board-Fallback Reliability Gate is the next planned phase and is not yet activated.
- No repository commit should exist solely to force an external redeploy or record transient evidence after Phase Sync.
