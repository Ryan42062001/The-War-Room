import assert from 'node:assert/strict';

function explicitlySerializedHardPair(a, b) {
  return (
    a.dependency === 'HARD' && (a.blocked_on_tasks || []).includes(b.task_id)
  ) || (
    b.dependency === 'HARD' && (b.blocked_on_tasks || []).includes(a.task_id)
  );
}

const unrelatedHard = { task_id: 'WR-901', dependency: 'HARD', blocked_on_tasks: [] };
const unrelatedPeer = { task_id: 'WR-902', dependency: 'INDEPENDENT', blocked_on_tasks: [] };
assert.equal(explicitlySerializedHardPair(unrelatedHard, unrelatedPeer), false);

const serializedHard = { task_id: 'WR-901', dependency: 'HARD', blocked_on_tasks: ['WR-902'] };
assert.equal(explicitlySerializedHardPair(serializedHard, unrelatedPeer), true);

console.log('Pairwise HARD dependency regression cases passed.');
