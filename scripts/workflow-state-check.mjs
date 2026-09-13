import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateTaskSpecContract } from './workflow-task-contract.mjs';

const root = process.cwd();
const registryPath = path.join(root, '.ai/shared/ACTIVE_TASKS.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const errors = [];
const warnings = [];

const ACTIVE = new Set([
  'PLANNED', 'BLOCKED', 'ASSIGNED', 'IN_PROGRESS', 'MANAGER_REVIEW_READY',
  'AUDIT_READY', 'MERGE_READY', 'REWORK_REQUIRED', 'MERGED'
]);
const RUNNABLE = new Set([
  'ASSIGNED', 'IN_PROGRESS', 'MANAGER_REVIEW_READY', 'AUDIT_READY',
  'MERGE_READY', 'REWORK_REQUIRED'
]);
const BLOCKER_TYPES = new Set(['NONE', 'USER_ACTION', 'UPSTREAM_TASK', 'EXTERNAL_SERVICE', 'TECHNICAL', 'AUDIT']);
const DEPENDENCIES = new Set(['INDEPENDENT', 'SOFT', 'HARD']);
const SHA = /^[0-9a-f]{40}$/;
const WR = /^WR-\d{3}$/;

if (registry.schema_version !== 3) errors.push(`schema_version must be 3, got ${registry.schema_version}`);
if (registry.active_only !== true) errors.push('active_only must be true');
if (!Array.isArray(registry.tasks)) errors.push('tasks must be an array');

const tasks = Array.isArray(registry.tasks) ? registry.tasks : [];
const ids = new Set();
const seenBranch = new Map();
const seenSlot = new Map();
const seenPr = new Map();

function claimUnique(map, value, label, field) {
  if (value == null || value === '') return;
  if (map.has(value)) errors.push(`${label}: ${field} duplicates ${map.get(value)} (${value})`);
  else map.set(value, label);
}
function prefixOverlap(a, b) {
  if (!a || !b) return null;
  if (a.startsWith(b)) return a;
  if (b.startsWith(a)) return b;
  return null;
}
function wholePrefixForbidden(task, prefix) {
  return (task.forbidden_path_prefixes || []).some(forbidden => prefix.startsWith(forbidden));
}
function effectiveWriteOverlap(a, b) {
  for (const left of a.allowed_path_prefixes || []) {
    for (const right of b.allowed_path_prefixes || []) {
      const overlap = prefixOverlap(left, right);
      if (!overlap) continue;
      if (wholePrefixForbidden(a, overlap) || wholePrefixForbidden(b, overlap)) continue;
      return overlap;
    }
  }
  return null;
}
function explicitlySerializedHardPair(a, b) {
  return (a.dependency === 'HARD' && (a.blocked_on_tasks || []).includes(b.task_id)) ||
    (b.dependency === 'HARD' && (b.blocked_on_tasks || []).includes(a.task_id));
}
function parallelWriteCollision(a, b) {
  if (!RUNNABLE.has(a.status) || !RUNNABLE.has(b.status)) return null;
  if (explicitlySerializedHardPair(a, b)) return null;
  return effectiveWriteOverlap(a, b);
}
function runCollisionRegressionChecks() {
  const task = (task_id, overrides = {}) => ({
    task_id,
    status: 'ASSIGNED',
    dependency: 'INDEPENDENT',
    blocked_on_tasks: [],
    allowed_path_prefixes: ['src/'],
    forbidden_path_prefixes: [],
    ...overrides
  });
  const unrelatedHard = task('WR-901', { dependency: 'HARD' });
  const unrelatedPeer = task('WR-902');
  assert.equal(parallelWriteCollision(unrelatedHard, unrelatedPeer), 'src/', 'unrelated HARD task must not suppress overlap');
  const explicitHard = task('WR-901', { dependency: 'HARD', blocked_on_tasks: ['WR-902'] });
  assert.equal(parallelWriteCollision(explicitHard, unrelatedPeer), null, 'explicit HARD-dependent pair must be serialized');
  const nonOverlap = task('WR-902', { allowed_path_prefixes: ['docs/'] });
  assert.equal(parallelWriteCollision(task('WR-901'), nonOverlap), null, 'unrelated non-overlapping tasks must remain allowed');
  const forbiddenOverlap = task('WR-901', { forbidden_path_prefixes: ['src/'] });
  assert.equal(parallelWriteCollision(forbiddenOverlap, unrelatedPeer), null, 'wholly forbidden overlap must remain allowed');
}
runCollisionRegressionChecks();

for (const task of tasks) {
  const label = task.task_id || '<missing task_id>';
  if (!WR.test(label)) errors.push(`${label}: task_id must match WR-###`);
  if (ids.has(label)) errors.push(`${label}: duplicate task_id`);
  ids.add(label);
  if (!ACTIVE.has(task.status)) errors.push(`${label}: active-only registry cannot contain status ${task.status}`);
  if (!BLOCKER_TYPES.has(task.blocker_type)) errors.push(`${label}: invalid blocker_type ${task.blocker_type}`);
  if (!DEPENDENCIES.has(task.dependency)) errors.push(`${label}: dependency must be INDEPENDENT, SOFT, or HARD`);
  if (typeof task.user_action_required !== 'boolean') errors.push(`${label}: user_action_required must be boolean`);
  if (!Array.isArray(task.blocked_on_tasks)) errors.push(`${label}: blocked_on_tasks must be array`);
  if (!Array.isArray(task.blocked_on)) errors.push(`${label}: blocked_on must be array`);
  if (typeof task.external_authority_evidence_required !== 'boolean') errors.push(`${label}: external_authority_evidence_required must be boolean`);
  if (typeof task.post_merge_canary_required !== 'boolean') errors.push(`${label}: post_merge_canary_required must be boolean`);
  if (['BLOCKED', 'REWORK_REQUIRED'].includes(task.status) && task.blocker_type === 'NONE') errors.push(`${label}: ${task.status} requires non-NONE blocker_type`);
  if (!['BLOCKED', 'REWORK_REQUIRED'].includes(task.status) && task.blocker_type !== 'NONE') errors.push(`${label}: blocker_type must be NONE when status is ${task.status}`);
  if (task.user_action_required && !['USER_ACTION', 'EXTERNAL_SERVICE'].includes(task.blocker_type)) errors.push(`${label}: user_action_required needs USER_ACTION or EXTERNAL_SERVICE blocker_type`);
  for (const key of ['assignment_main_sha', 'worker_checkpoint_sha', 'audit_target_sha']) {
    if (task[key] != null && !SHA.test(task[key])) errors.push(`${label}: ${key} must be null or 40-char lowercase SHA`);
  }
  if (task.pr != null && (!Number.isInteger(task.pr) || task.pr <= 0)) errors.push(`${label}: pr must be null or positive integer`);
  if (task.branch != null && typeof task.branch !== 'string') errors.push(`${label}: branch must be null or string`);
  if (task.worker_slot != null && typeof task.worker_slot !== 'string') errors.push(`${label}: worker_slot must be null or string`);
  claimUnique(seenBranch, task.branch, label, 'branch');
  claimUnique(seenSlot, task.worker_slot, label, 'worker_slot');
  claimUnique(seenPr, task.pr, label, 'pr');

  if (task.owner === 'Auditor' && ['ASSIGNED', 'IN_PROGRESS', 'MANAGER_REVIEW_READY', 'AUDIT_READY', 'MERGE_READY'].includes(task.status)) {
    if (!WR.test(task.audit_target_task || '')) errors.push(`${label}: active Auditor assignment requires audit_target_task`);
    if (!Number.isInteger(task.audit_target_pr) || task.audit_target_pr <= 0) errors.push(`${label}: active Auditor assignment requires positive audit_target_pr`);
    if (typeof task.audit_target_branch !== 'string' || !task.audit_target_branch) errors.push(`${label}: active Auditor assignment requires audit_target_branch`);
    if (task.audit_target_sha == null) warnings.push(`${label}: audit_target_sha is not frozen in registry; Manager must pin exact live PR head before audit execution`);
  }

  if (typeof task.task_file !== 'string' || !fs.existsSync(path.join(root, task.task_file))) {
    errors.push(`${label}: task_file missing: ${task.task_file}`);
  } else {
    const text = fs.readFileSync(path.join(root, task.task_file), 'utf8');
    errors.push(...validateTaskSpecContract(task, text).errors);
  }
  if (typeof task.role_handoff === 'string' && !fs.existsSync(path.join(root, task.role_handoff))) errors.push(`${label}: role_handoff path missing: ${task.role_handoff}`);
}

for (const task of tasks) {
  for (const dependency of task.blocked_on_tasks || []) {
    if (dependency === task.task_id) errors.push(`${task.task_id}: cannot block on itself`);
    if (!ids.has(dependency)) errors.push(`${task.task_id}: blocked_on_tasks references non-active ${dependency}`);
  }
}

const graph = new Map(tasks.map(task => [task.task_id, task.blocked_on_tasks || []]));
const visiting = new Set();
const visited = new Set();
function visit(id, trail = []) {
  if (visiting.has(id)) {
    errors.push(`dependency cycle detected: ${[...trail, id].join(' -> ')}`);
    return;
  }
  if (visited.has(id)) return;
  visiting.add(id);
  for (const dep of graph.get(id) || []) if (graph.has(dep)) visit(dep, [...trail, id]);
  visiting.delete(id);
  visited.add(id);
}
for (const id of graph.keys()) visit(id);

for (let i = 0; i < tasks.length; i += 1) {
  for (let j = i + 1; j < tasks.length; j += 1) {
    const a = tasks[i];
    const b = tasks[j];
    const overlap = parallelWriteCollision(a, b);
    if (overlap) errors.push(`${a.task_id}/${b.task_id}: unsafe parallel write-prefix overlap at ${overlap}; serialize or narrow scopes`);
  }
}

const result = { schema_version: registry.schema_version, active_task_count: tasks.length, errors, warnings, ok: errors.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 2;
