import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, '.ai/shared/ACTIVE_TASKS.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const errors = [];
const warnings = [];

const ACTIVE = new Set([
  'PLANNED', 'BLOCKED', 'ASSIGNED', 'IN_PROGRESS', 'MANAGER_REVIEW_READY',
  'AUDIT_READY', 'MERGE_READY', 'REWORK_REQUIRED', 'MERGED'
]);
const BLOCKER_TYPES = new Set(['NONE', 'USER_ACTION', 'UPSTREAM_TASK', 'EXTERNAL_SERVICE', 'TECHNICAL', 'AUDIT']);
const SHA = /^[0-9a-f]{40}$/;

if (registry.schema_version !== 2) errors.push(`schema_version must be 2, got ${registry.schema_version}`);
if (registry.active_only !== true) errors.push('active_only must be true');
if (!Array.isArray(registry.tasks)) errors.push('tasks must be an array');

const tasks = Array.isArray(registry.tasks) ? registry.tasks : [];
const ids = new Set();
for (const task of tasks) {
  const label = task.task_id || '<missing task_id>';
  if (!/^WR-\d{3}$/.test(label)) errors.push(`${label}: task_id must match WR-###`);
  if (ids.has(label)) errors.push(`${label}: duplicate task_id`);
  ids.add(label);

  if (!ACTIVE.has(task.status)) {
    errors.push(`${label}: active-only registry cannot contain status ${task.status}`);
  }
  if (!BLOCKER_TYPES.has(task.blocker_type)) errors.push(`${label}: invalid blocker_type ${task.blocker_type}`);
  if (typeof task.user_action_required !== 'boolean') errors.push(`${label}: user_action_required must be boolean`);
  if (!Array.isArray(task.blocked_on_tasks)) errors.push(`${label}: blocked_on_tasks must be array`);
  if (!Array.isArray(task.blocked_on)) errors.push(`${label}: blocked_on must be array`);
  if (typeof task.external_authority_evidence_required !== 'boolean') errors.push(`${label}: external_authority_evidence_required must be boolean`);
  if (typeof task.post_merge_canary_required !== 'boolean') errors.push(`${label}: post_merge_canary_required must be boolean`);

  if (['BLOCKED', 'REWORK_REQUIRED'].includes(task.status) && task.blocker_type === 'NONE') {
    errors.push(`${label}: ${task.status} requires non-NONE blocker_type`);
  }
  if (!['BLOCKED', 'REWORK_REQUIRED'].includes(task.status) && task.blocker_type !== 'NONE') {
    errors.push(`${label}: blocker_type must be NONE when status is ${task.status}`);
  }
  if (task.user_action_required && !['USER_ACTION', 'EXTERNAL_SERVICE'].includes(task.blocker_type)) {
    errors.push(`${label}: user_action_required needs USER_ACTION or EXTERNAL_SERVICE blocker_type`);
  }

  for (const key of ['assignment_main_sha', 'worker_checkpoint_sha']) {
    if (task[key] != null && !SHA.test(task[key])) errors.push(`${label}: ${key} must be null or 40-char lowercase SHA`);
  }
  if (task.pr != null && (!Number.isInteger(task.pr) || task.pr <= 0)) errors.push(`${label}: pr must be null or positive integer`);
  if (task.branch != null && typeof task.branch !== 'string') errors.push(`${label}: branch must be null or string`);
  if (task.worker_slot != null && typeof task.worker_slot !== 'string') errors.push(`${label}: worker_slot must be null or string`);

  if (typeof task.task_file !== 'string' || !fs.existsSync(path.join(root, task.task_file))) {
    errors.push(`${label}: task_file missing: ${task.task_file}`);
  } else {
    const text = fs.readFileSync(path.join(root, task.task_file), 'utf8');
    if (!text.includes(`TASK ID: ${label}`)) errors.push(`${label}: task_file does not declare matching TASK ID`);
    const match = text.match(/^STATUS:\s*([A-Z_]+)/m);
    if (!match) warnings.push(`${label}: task_file has no machine-readable STATUS line`);
    else if (match[1] !== task.status) errors.push(`${label}: registry status ${task.status} != task_file status ${match[1]}`);
  }

  if (typeof task.role_handoff === 'string' && !fs.existsSync(path.join(root, task.role_handoff))) {
    errors.push(`${label}: role_handoff path missing: ${task.role_handoff}`);
  }
}

for (const task of tasks) {
  for (const dependency of task.blocked_on_tasks || []) {
    if (dependency === task.task_id) errors.push(`${task.task_id}: cannot block on itself`);
    if (!ids.has(dependency)) errors.push(`${task.task_id}: blocked_on_tasks references non-active ${dependency}`);
  }
}

const result = {
  schema_version: registry.schema_version,
  active_task_count: tasks.length,
  errors,
  warnings,
  ok: errors.length === 0
};

console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 2;
