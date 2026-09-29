const FIELD_LABELS = {
  task_id: 'TASK ID',
  status: 'STATUS',
  dependency: 'DEPENDENCY',
  execution_mode: 'EXECUTION MODE',
  refresh_mode: 'REFRESH MODE',
  target_branch: 'TARGET BRANCH'
};

function lineValue(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`^${escaped}:\\s*(.+?)\\s*$`, 'm'));
  return match ? match[1].trim() : null;
}

function stripTicks(value) {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith('`') && trimmed.endsWith('`') && trimmed.length >= 2) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function firstMachineToken(value) {
  const normalized = stripTicks(value);
  if (!normalized) return null;
  const match = normalized.match(/^([A-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function normalizeBranch(value) {
  const normalized = stripTicks(value);
  if (!normalized) return null;
  if (/^(TO BE\b|NONE$|N\/A$|UNASSIGNED$)/i.test(normalized)) return null;
  return normalized;
}

export function parseTaskSpecContract(text) {
  return {
    task_id: firstMachineToken(lineValue(text, FIELD_LABELS.task_id)),
    status: firstMachineToken(lineValue(text, FIELD_LABELS.status)),
    dependency: firstMachineToken(lineValue(text, FIELD_LABELS.dependency)),
    execution_mode: firstMachineToken(lineValue(text, FIELD_LABELS.execution_mode)),
    refresh_mode: firstMachineToken(lineValue(text, FIELD_LABELS.refresh_mode)),
    target_branch: normalizeBranch(lineValue(text, FIELD_LABELS.target_branch))
  };
}

export function validateTaskSpecContract(task, text) {
  const parsed = parseTaskSpecContract(text);
  const errors = [];
  const required = [
    ['task_id', task.task_id],
    ['status', task.status],
    ['dependency', task.dependency],
    ['execution_mode', task.execution_mode],
    ['refresh_mode', task.refresh_mode],
    ['target_branch', task.branch ?? null]
  ];

  for (const [field, expected] of required) {
    const actual = parsed[field];
    if (actual !== expected) {
      errors.push(`${task.task_id}: task_file ${field} ${actual ?? '<missing/null>'} != registry ${expected ?? '<null>'}`);
    }
  }
  return { parsed, errors };
}

export function branchIdentityError(task, currentBranch) {
  const expected = task.branch ?? null;
  if (!expected) return `${task.task_id}: active runnable task has no assigned registry branch`;
  if (!currentBranch || currentBranch === '(detached)') {
    return `${task.task_id}: detached HEAD is not allowed; expected assigned branch ${expected}`;
  }
  if (currentBranch !== expected) {
    return `${task.task_id}: checked-out branch ${currentBranch} != assigned branch ${expected}`;
  }
  return null;
}
