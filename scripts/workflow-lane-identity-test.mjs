import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { branchIdentityError, validateTaskSpecContract } from './workflow-task-contract.mjs';

const sampleTask = {
  task_id: 'WR-900',
  status: 'ASSIGNED',
  branch: 'wr-900-lane',
  execution_mode: 'STANDARD_CHAT',
  dependency: 'INDEPENDENT'
};

const goodSpec = `TASK ID: WR-900
STATUS: ASSIGNED
DEPENDENCY: INDEPENDENT — descriptive suffix is allowed
EXECUTION MODE: STANDARD_CHAT
TARGET BRANCH: \`wr-900-lane\`
`;

assert.equal(branchIdentityError(sampleTask, 'wr-900-lane'), null);
assert.match(branchIdentityError(sampleTask, 'other-lane'), /checked-out branch other-lane != assigned branch wr-900-lane/);
assert.match(branchIdentityError(sampleTask, '(detached)'), /detached HEAD is not allowed/);
assert.deepEqual(validateTaskSpecContract(sampleTask, goodSpec).errors, []);

assert.match(
  validateTaskSpecContract(sampleTask, goodSpec.replace('wr-900-lane', 'stale-lane')).errors.join('\n'),
  /target_branch stale-lane != registry wr-900-lane/
);
assert.match(
  validateTaskSpecContract(sampleTask, goodSpec.replace('STANDARD_CHAT', 'WORK_MODE_PREFERRED')).errors.join('\n'),
  /execution_mode WORK_MODE_PREFERRED != registry STANDARD_CHAT/
);
assert.match(
  validateTaskSpecContract(sampleTask, goodSpec.replace('INDEPENDENT — descriptive suffix is allowed', 'HARD — descriptive suffix is allowed')).errors.join('\n'),
  /dependency HARD != registry INDEPENDENT/
);

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, '.ai/shared/ACTIVE_TASKS.json'), 'utf8'));
for (const task of registry.tasks || []) {
  const taskFile = path.join(root, task.task_file);
  if (!fs.existsSync(taskFile)) continue;
  const errors = validateTaskSpecContract(task, fs.readFileSync(taskFile, 'utf8')).errors;
  assert.deepEqual(errors, [], `${task.task_id} current task spec must match registry lane identity`);
}

console.log('workflow lane-identity regression: PASS');
