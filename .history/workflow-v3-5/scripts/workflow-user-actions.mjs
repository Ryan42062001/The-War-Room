import fs from 'node:fs';

const registry = JSON.parse(fs.readFileSync('.ai/shared/ACTIVE_TASKS.json', 'utf8'));
const json = process.argv.includes('--json');
const items = (registry.tasks || []).filter(task => task.user_action_required === true);
const result = items.map(task => ({
  task_id: task.task_id,
  owner: task.owner,
  blocker_type: task.blocker_type,
  blocked_on: task.blocked_on || [],
  next_gate: task.next_gate || null
}));

if (json) {
  console.log(JSON.stringify({ count: result.length, user_actions: result }, null, 2));
} else if (result.length === 0) {
  console.log('USER ACTION QUEUE: CLEAR');
} else {
  console.log(`USER ACTION QUEUE: ${result.length}`);
  for (const item of result) {
    console.log(`- ${item.task_id} (${item.owner}) [${item.blocker_type}]`);
    for (const blocker of item.blocked_on) console.log(`  - ${blocker}`);
    if (item.next_gate) console.log(`  next: ${item.next_gate}`);
  }
}
