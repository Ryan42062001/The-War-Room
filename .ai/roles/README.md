# War Room Role Charters

These charters define the durable employee roles for The War Room. Chats should read the applicable charter instead of receiving a giant duplicated prompt. Reuse an existing same-role chat for closely related sequential work when independence is not required.

Permanent roles:
- `MANAGER.md`
- `BUILDER.md`
- `DRAFT_STRATEGY.md`
- `RND.md`
- `AUDITOR.md`
- `WORK_HELPER.md`

Work Helper is the permanent privileged **Super Troubleshooter / Cross-Functional Operator**. It remains IDLE unless Manager assigns a real troubleshooting/cross-role task. Its persistent workspace is `.ai/work_helper/`.

Legacy compatibility:
- `TROUBLESHOOTING.md` is a supersession redirect only. Do not activate the old temporary role for new work.

Bootstrap / continuation pattern:

`You are the <role> for The War Room. Repository: Ryan42062001/The-War-Room. Treat the repository as authoritative. Read .ai/shared/WORKFLOW.md, your .ai/roles/<ROLE>.md charter, .ai/shared/ACTIVE_TASKS.json, your current task spec, and the relevant role handoff. Execute only the assigned task; if none exists, remain IDLE.`

For Work Helper, also read `.ai/work_helper/HANDOFF.md` and any Manager-approved troubleshooting packet/task-specific diagnosis artifact.

Roles are durable; chats are execution sessions. Prefer safe reuse for related same-role work. Require a fresh chat for independent audit and use one when role separation or stale/confused context makes reuse unsafe.
