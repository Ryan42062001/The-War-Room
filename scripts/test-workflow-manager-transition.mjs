import assert from 'node:assert/strict';
import { applyTransitionPlan, syncTaskSpecHeaders, validateTaskShape } from './workflow-manager-transition.mjs';

function spec(task) {
  return `# Test task\n\nTASK ID: ${task.task_id}\nROLE: Test\nSTATUS: ${task.status}\nDEPENDENCY: ${task.dependency}\nEXECUTION MODE: ${task.execution_mode}\nTARGET BRANCH: \`${task.branch}\`\n`;
}
function task(id, overrides = {}) {
  return {
    task_id: id,
    owner: 'Manager',
    worker_slot: `slot-${id}`,
    status: 'ASSIGNED',
    task_file: `.ai/manager/${id}.md`,
    role_handoff: '.ai/manager/HANDOFF.md',
    assignment_main_sha: null,
    worker_checkpoint_sha: null,
    branch: `branch-${id}`,
    pr: null,
    dependency: 'INDEPENDENT',
    execution_mode: 'STANDARD_CHAT',
    audit_required: true,
    blocker_type: 'NONE',
    user_action_required: false,
    blocked_on_tasks: [],
    blocked_on: [],
    external_authority_evidence_required: false,
    post_merge_canary_required: false,
    allowed_path_prefixes: ['scripts/'],
    forbidden_path_prefixes: ['src/'],
    forbidden_exact_paths: [],
    next_gate: 'test',
    ...overrides
  };
}

const a = task('WR-901');
const b = task('WR-902', {
  owner: 'Auditor',
  status: 'BLOCKED',
  dependency: 'HARD',
  blocker_type: 'UPSTREAM_TASK',
  blocked_on_tasks: ['WR-901'],
  blocked_on: ['WR-901'],
  branch: 'branch-WR-902',
  allowed_path_prefixes: ['.ai/auditor/']
});
const registry = {
  schema_version: 3,
  updated_at_utc: '2026-09-16T00:00:00Z',
  canonical_branch: 'main',
  manager_owned: true,
  active_only: true,
  tasks: [a, b]
};
const specs = new Map([[a.task_file, spec(a)], [b.task_file, spec(b)]]);
const reader = rel => specs.get(rel) ?? null;

const plan = {
  schema_version: 1,
  updated_at_utc: '2026-09-16T01:00:00Z',
  update_tasks: [
    { task_id: 'WR-901', set: { status: 'AUDIT_READY', worker_checkpoint_sha: 'a'.repeat(40) } },
    { task_id: 'WR-902', set: {
      status: 'ASSIGNED', blocker_type: 'NONE', blocked_on_tasks: [], blocked_on: [],
      audit_target_task: 'WR-901', audit_target_pr: 123,
      audit_target_branch: 'branch-WR-901', audit_target_sha: 'a'.repeat(40)
    } }
  ]
};
const applied = applyTransitionPlan({ registry, plan, taskSpecReader: reader });
assert.deepEqual(applied.errors, []);
assert.equal(applied.registry.updated_at_utc, '2026-09-16T01:00:00Z');
assert.equal(applied.registry.tasks.find(t => t.task_id === 'WR-901').status, 'AUDIT_READY');
assert.equal(applied.registry.tasks.find(t => t.task_id === 'WR-902').status, 'ASSIGNED');
assert.match(applied.taskSpecs.get(a.task_file), /^STATUS: AUDIT_READY$/m);
assert.match(applied.taskSpecs.get(b.task_file), /^STATUS: ASSIGNED$/m);

const collision = applyTransitionPlan({
  registry,
  plan: { schema_version: 1, update_tasks: [{ task_id: 'WR-902', set: {
    status: 'ASSIGNED', blocker_type: 'NONE', blocked_on_tasks: [], blocked_on: [],
    dependency: 'INDEPENDENT', allowed_path_prefixes: ['scripts/'],
    audit_target_task: 'WR-901', audit_target_pr: 123,
    audit_target_branch: 'branch-WR-901', audit_target_sha: 'a'.repeat(40)
  } }] },
  taskSpecReader: reader
});
assert.ok(collision.errors.some(error => error.includes('unsafe parallel write-prefix overlap')));

const badStatus = validateTaskShape(task('WR-903', { status: 'BLOCKED', blocker_type: 'NONE' }));
assert.ok(badStatus.some(error => error.includes('requires non-NONE')));

const synced = syncTaskSpecHeaders(spec(a), { ...a, status: 'MERGE_READY', dependency: 'SOFT', execution_mode: 'WORK_MODE_PREFERRED', branch: 'new-branch' });
assert.match(synced, /^STATUS: MERGE_READY$/m);
assert.match(synced, /^DEPENDENCY: SOFT$/m);
assert.match(synced, /^EXECUTION MODE: WORK_MODE_PREFERRED$/m);
assert.match(synced, /^TARGET BRANCH: `new-branch`$/m);

console.log('workflow Manager-transition regression: PASS');
