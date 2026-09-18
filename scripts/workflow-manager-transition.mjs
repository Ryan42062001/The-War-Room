import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { validateTaskSpecContract } from './workflow-task-contract.mjs';

const STATUS = new Set(['PLANNED','BLOCKED','ASSIGNED','IN_PROGRESS','MANAGER_REVIEW_READY','AUDIT_READY','MERGE_READY','REWORK_REQUIRED','MERGED']);
const DEPENDENCY = new Set(['INDEPENDENT','SOFT','HARD']);
const BLOCKER = new Set(['NONE','USER_ACTION','UPSTREAM_TASK','EXTERNAL_SERVICE','TECHNICAL','AUDIT']);
const EXECUTION_MODE = new Set(['STANDARD_CHAT_HIGH','WORK_MODE']);
const REFRESH_MODE = new Set(['FAST_REFRESH','FULL_REFRESH']);

function parseArgs(raw = process.argv.slice(2)) {
  const out = { plan: null, write: false, json: false, root: null };
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] === '--plan') out.plan = raw[++i];
    else if (raw[i] === '--write') out.write = true;
    else if (raw[i] === '--json') out.json = true;
    else if (raw[i] === '--root') out.root = raw[++i];
  }
  if (!out.plan) throw new Error('Usage: node scripts/workflow-manager-transition.mjs --plan plan.json [--write] [--json]');
  return out;
}
function headerValue(key, value) {
  if (key === 'TARGET BRANCH') return value == null ? 'NONE' : `\`${value}\``;
  return String(value);
}
function replaceHeader(text, label, value) {
  const re = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*.*$`, 'm');
  if (!re.test(text)) throw new Error(`task spec missing header ${label}`);
  return text.replace(re, `${label}: ${headerValue(label, value)}`);
}
export function syncTaskSpecHeaders(text, task) {
  let next = text;
  next = replaceHeader(next, 'TASK ID', task.task_id);
  next = replaceHeader(next, 'STATUS', task.status);
  next = replaceHeader(next, 'DEPENDENCY', task.dependency);
  next = replaceHeader(next, 'EXECUTION MODE', task.execution_mode);
  next = replaceHeader(next, 'REFRESH MODE', task.refresh_mode);
  next = replaceHeader(next, 'TARGET BRANCH', task.branch ?? null);
  return next;
}
export function validateTaskShape(task) {
  const errors = [];
  if (!/^WR-\d{3}$/.test(task.task_id || '')) errors.push('task_id must match WR-###');
  if (!STATUS.has(task.status)) errors.push(`invalid status ${task.status}`);
  if (!DEPENDENCY.has(task.dependency)) errors.push(`invalid dependency ${task.dependency}`);
  if (!BLOCKER.has(task.blocker_type)) errors.push(`invalid blocker_type ${task.blocker_type}`);
  if (!EXECUTION_MODE.has(task.execution_mode)) errors.push(`invalid execution_mode ${task.execution_mode}`);
  if (!REFRESH_MODE.has(task.refresh_mode)) errors.push(`invalid refresh_mode ${task.refresh_mode}`);
  if (task.refresh_mode === 'FULL_REFRESH' && (typeof task.refresh_reason !== 'string' || !task.refresh_reason.trim())) errors.push('FULL_REFRESH requires non-empty refresh_reason');
  if (['BLOCKED','REWORK_REQUIRED'].includes(task.status) && task.blocker_type === 'NONE') errors.push(`${task.status} requires non-NONE blocker_type`);
  if (!['BLOCKED','REWORK_REQUIRED'].includes(task.status) && task.blocker_type !== 'NONE') errors.push(`${task.status} requires blocker_type NONE`);
  if (!Array.isArray(task.blocked_on_tasks)) errors.push('blocked_on_tasks must be array');
  if (!Array.isArray(task.blocked_on)) errors.push('blocked_on must be array');
  return errors;
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
const ACTIVE_AUDITOR_STATUS = new Set(['ASSIGNED','IN_PROGRESS','MANAGER_REVIEW_READY','AUDIT_READY','MERGE_READY']);
const SHA40 = /^[0-9a-f]{40}$/;
const SHA64 = /^[0-9a-f]{64}$/;

export function autoPopulateAuditorPins(tasks, previousTasks, changes = []) {
  const errors = [];
  const byId = new Map(tasks.map(task => [task.task_id, task]));
  const previousById = new Map(previousTasks.map(task => [task.task_id, task]));
  for (const task of tasks) {
    if (task.owner !== 'Auditor' || !ACTIVE_AUDITOR_STATUS.has(task.status)) continue;
    const previous = previousById.get(task.task_id);
    const candidates = [...new Set([
      task.audit_target_task,
      previous?.audit_target_task,
      ...(previous?.blocked_on_tasks || []),
      ...(task.blocked_on_tasks || [])
    ].filter(Boolean))];
    if (!task.audit_target_task) {
      if (candidates.length !== 1) {
        errors.push(`${task.task_id}: cannot auto-pin Auditor target; expected one unambiguous upstream task, got ${candidates.length}`);
        continue;
      }
      task.audit_target_task = candidates[0];
    }
    const target = byId.get(task.audit_target_task);
    if (!target) {
      errors.push(`${task.task_id}: audit target ${task.audit_target_task} is not active`);
      continue;
    }
    if (!['AUDIT_READY','MERGE_READY'].includes(target.status)) {
      errors.push(`${task.task_id}: audit target ${target.task_id} is not frozen/audit-ready (${target.status})`);
      continue;
    }
    const authoritative = {
      audit_target_task: target.task_id,
      audit_target_pr: target.pr,
      audit_target_branch: target.branch,
      audit_target_sha: target.worker_checkpoint_sha
    };
    if (!Number.isInteger(authoritative.audit_target_pr) || authoritative.audit_target_pr <= 0 ||
        typeof authoritative.audit_target_branch !== 'string' || !authoritative.audit_target_branch ||
        !SHA40.test(authoritative.audit_target_sha || '')) {
      errors.push(`${task.task_id}: frozen upstream target lacks PR/branch/SHA needed for Auditor activation`);
      continue;
    }
    const populated = [];
    for (const [field, value] of Object.entries(authoritative)) {
      if (task[field] == null || task[field] === '') {
        task[field] = value;
        populated.push(field);
      } else if (task[field] !== value) {
        errors.push(`${task.task_id}: explicit ${field} contradicts frozen ${target.task_id} target`);
      }
    }
    if (populated.length) changes.push({ action: 'auto-pin-auditor', task_id: task.task_id, fields: populated });
  }
  return errors;
}

export function applyAuthorityConsumptionReceipts(previousTasks, nextTasks, plan, changes = []) {
  const errors = [];
  const receipts = new Map();
  for (const receipt of plan.authority_consumption_receipts || []) {
    if (!receipt || typeof receipt.task_id !== 'string' || receipts.has(receipt.task_id)) {
      errors.push('authority_consumption_receipts must contain one unique task_id per receipt');
      continue;
    }
    receipts.set(receipt.task_id, receipt);
  }
  const nextById = new Map(nextTasks.map(task => [task.task_id, task]));
  for (const previous of previousTasks) {
    const oldAuthority = previous.future_execution_authority;
    if (!oldAuthority || typeof oldAuthority !== 'object') continue;
    const next = nextById.get(previous.task_id);
    if (!next) continue;
    const receipt = receipts.get(previous.task_id);
    const nextAuthority = next.future_execution_authority;
    const oldJson = JSON.stringify(oldAuthority);
    const nextJson = nextAuthority == null ? null : JSON.stringify(nextAuthority);
    if (nextJson && nextJson !== oldJson) {
      errors.push(`${previous.task_id}: cannot replace an unconsumed future_execution_authority`);
      continue;
    }
    const advanced = SHA40.test(next.worker_checkpoint_sha || '') && next.worker_checkpoint_sha !== oldAuthority.head_sha;
    if (!advanced && !receipt) continue;
    if (!receipt) {
      errors.push(`${previous.task_id}: authorized branch advanced; authority consumption receipt is required before further transition`);
      continue;
    }
    if (receipt.authorized_head !== oldAuthority.head_sha ||
        receipt.publication_head !== next.worker_checkpoint_sha ||
        receipt.single_publication_commit !== true ||
        receipt.publication_parent_verified !== true ||
        !SHA64.test(receipt.authority_sha256 || '') ||
        !SHA64.test(receipt.receipt_sha256 || '')) {
      errors.push(`${previous.task_id}: authority consumption receipt does not bind the authorized head to the frozen publication head`);
      continue;
    }
    delete next.future_execution_authority;
    next.authority_consumption_receipt = structuredClone(receipt);
    changes.push({ action: 'consume-authority', task_id: previous.task_id, fields: ['future_execution_authority','authority_consumption_receipt'] });
  }
  return errors;
}

function validateRegistryRelations(tasks) {
  const errors = [];
  const seen = { branch: new Map(), worker_slot: new Map(), pr: new Map() };
  for (const task of tasks) {
    for (const field of Object.keys(seen)) {
      const value = task[field];
      if (value == null || value === '') continue;
      if (seen[field].has(value)) errors.push(`${task.task_id}: ${field} duplicates ${seen[field].get(value)} (${value})`);
      else seen[field].set(value, task.task_id);
    }
    if (task.owner === 'Auditor' && ['ASSIGNED','IN_PROGRESS','MANAGER_REVIEW_READY','AUDIT_READY','MERGE_READY'].includes(task.status)) {
      if (!/^WR-\d{3}$/.test(task.audit_target_task || '')) errors.push(`${task.task_id}: active Auditor assignment requires audit_target_task`);
      if (!Number.isInteger(task.audit_target_pr) || task.audit_target_pr <= 0) errors.push(`${task.task_id}: active Auditor assignment requires positive audit_target_pr`);
      if (typeof task.audit_target_branch !== 'string' || !task.audit_target_branch) errors.push(`${task.task_id}: active Auditor assignment requires audit_target_branch`);
    }
  }
  const ids = new Set(tasks.map(task => task.task_id));
  const graph = new Map(tasks.map(task => [task.task_id, task.blocked_on_tasks || []]));
  const visiting = new Set();
  const visited = new Set();
  function visit(id, trail = []) {
    if (visiting.has(id)) { errors.push(`dependency cycle detected: ${[...trail,id].join(' -> ')}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of graph.get(id) || []) {
      if (!ids.has(dep)) errors.push(`${id}: blocked_on_tasks references non-active ${dep}`);
      else visit(dep, [...trail,id]);
    }
    visiting.delete(id); visited.add(id);
  }
  for (const id of graph.keys()) visit(id);
  const runnable = new Set(['ASSIGNED','IN_PROGRESS','MANAGER_REVIEW_READY','AUDIT_READY','MERGE_READY','REWORK_REQUIRED']);
  for (let i=0;i<tasks.length;i+=1) for (let j=i+1;j<tasks.length;j+=1) {
    const a=tasks[i], b=tasks[j];
    if (!runnable.has(a.status) || !runnable.has(b.status) || explicitlySerializedHardPair(a,b)) continue;
    const overlap=effectiveWriteOverlap(a,b);
    if (overlap) errors.push(`${a.task_id}/${b.task_id}: unsafe parallel write-prefix overlap at ${overlap}`);
  }
  return errors;
}

export function applyTransitionPlan({ registry, plan, taskSpecReader }) {
  if (plan.schema_version !== 1) throw new Error(`plan schema_version must be 1, got ${plan.schema_version}`);
  const next = structuredClone(registry);
  const changes = [];
  const removed = new Set(plan.remove_tasks || []);
  next.tasks = next.tasks.filter(task => !removed.has(task.task_id));
  for (const id of removed) changes.push({ action: 'remove', task_id: id });
  for (const addition of plan.add_tasks || []) {
    if (next.tasks.some(task => task.task_id === addition.task_id)) throw new Error(`cannot add existing task ${addition.task_id}`);
    next.tasks.push(structuredClone(addition));
    changes.push({ action: 'add', task_id: addition.task_id });
  }
  for (const update of plan.update_tasks || []) {
    const task = next.tasks.find(item => item.task_id === update.task_id);
    if (!task) throw new Error(`cannot update missing task ${update.task_id}`);
    Object.assign(task, structuredClone(update.set || {}));
    for (const field of update.unset || []) delete task[field];
    changes.push({ action: 'update', task_id: update.task_id, fields: [...Object.keys(update.set || {}), ...(update.unset || []).map(field => `unset:${field}`)] });
  }
  if (plan.updated_at_utc) next.updated_at_utc = plan.updated_at_utc;
  const transitionErrors = [
    ...applyAuthorityConsumptionReceipts(registry.tasks || [], next.tasks, plan, changes),
    ...autoPopulateAuditorPins(next.tasks, registry.tasks || [], changes)
  ];
  const ids = new Set();
  const errors = [...transitionErrors];
  const taskSpecs = new Map();
  for (const task of next.tasks) {
    if (ids.has(task.task_id)) errors.push(`${task.task_id}: duplicate task_id`);
    ids.add(task.task_id);
    errors.push(...validateTaskShape(task).map(error => `${task.task_id}: ${error}`));
    if (typeof task.task_file !== 'string') errors.push(`${task.task_id}: task_file missing`);
    else {
      const original = taskSpecReader(task.task_file);
      if (original == null) errors.push(`${task.task_id}: task_file missing: ${task.task_file}`);
      else {
        const synced = syncTaskSpecHeaders(original, task);
        const contractErrors = validateTaskSpecContract(task, synced).errors;
        errors.push(...contractErrors);
        taskSpecs.set(task.task_file, synced);
      }
    }
  }
  for (const task of next.tasks) {
    for (const dep of task.blocked_on_tasks || []) if (!ids.has(dep)) errors.push(`${task.task_id}: blocked_on_tasks references non-active ${dep}`);
  }
  errors.push(...validateRegistryRelations(next.tasks));
  return { registry: next, taskSpecs, changes, errors: [...new Set(errors)] };
}

async function main() {
  const options = parseArgs();
  const root = path.resolve(options.root || process.cwd());
  const registryPath = path.join(root, '.ai/shared/ACTIVE_TASKS.json');
  const planPath = path.resolve(root, options.plan);
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const result = applyTransitionPlan({
    registry,
    plan,
    taskSpecReader: rel => {
      const full = path.join(root, rel);
      return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
    }
  });
  if (result.errors.length) {
    const output = { ok: false, dry_run: !options.write, changes: result.changes, errors: result.errors };
    console.log(options.json ? JSON.stringify(output, null, 2) : `REJECTED\n${result.errors.map(e => `- ${e}`).join('\n')}`);
    process.exitCode = 2;
    return;
  }
  if (options.write) {
    const backups = new Map();
    const remember = file => { if (!backups.has(file)) backups.set(file, fs.readFileSync(file)); };
    try {
      remember(registryPath);
      for (const [rel] of result.taskSpecs) remember(path.join(root, rel));
      fs.writeFileSync(registryPath, `${JSON.stringify(result.registry, null, 2)}\n`);
      for (const [rel, text] of result.taskSpecs) fs.writeFileSync(path.join(root, rel), text);
      const stateChecker = path.join(root, 'scripts/workflow-state-check.mjs');
      if (!fs.existsSync(stateChecker)) throw new Error('scripts/workflow-state-check.mjs is required for --write');
      execFileSync(process.execPath, [stateChecker], { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
    } catch (error) {
      for (const [file, bytes] of backups) fs.writeFileSync(file, bytes);
      throw new Error(`transition rejected and rolled back: ${error.stderr?.toString().trim() || error.message}`);
    }
  }
  const output = {
    ok: true,
    dry_run: !options.write,
    changes: result.changes,
    active_task_count: result.registry.tasks.length,
    touched_task_specs: [...result.taskSpecs.keys()],
    note: options.write
      ? 'Registry/task-spec machine headers were synchronized. Manager must still review the diff, run canonical state/live gates, update narrative state as needed, and commit atomically.'
      : 'Dry run only. Re-run with --write after Manager review; no repository file was changed.'
  };
  if (options.json) console.log(JSON.stringify(output, null, 2));
  else {
    console.log(`WORKFLOW MANAGER TRANSITION — ${output.dry_run ? 'DRY RUN' : 'WRITE'}`);
    for (const change of output.changes) console.log(`${change.action.toUpperCase()} ${change.task_id}`);
    console.log(`task specs synchronized: ${output.touched_task_specs.length}`);
    console.log(output.note);
  }
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) main().catch(error => { console.error(error.message); process.exitCode = 2; });
