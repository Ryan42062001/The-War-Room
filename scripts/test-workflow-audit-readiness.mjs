import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildAuditReadinessPacket, evaluateContract, jsonPointerGet, selectAutoTask } from './workflow-audit-readiness.mjs';

function runGit(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wr-audit-readiness-'));
fs.mkdirSync(path.join(root, '.ai/research/generated'), { recursive: true });
const artifact = '.ai/research/generated/fixture.json';
const sidecar = '.ai/research/generated/fixture.sha256';
const fixture = '.ai/research/generated/input.json';
fs.writeFileSync(path.join(root, artifact), '{"contract":{"signature":"improve(candidate,baseline)"},"fixture_sha":null}\n');
fs.writeFileSync(path.join(root, fixture), '{"rows":[1,2,3]}\n');
const fixtureHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, fixture))).digest('hex');
const doc = JSON.parse(fs.readFileSync(path.join(root, artifact), 'utf8'));
doc.fixture_sha = fixtureHash;
fs.writeFileSync(path.join(root, artifact), `${JSON.stringify(doc)}\n`);
const artifactHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, artifact))).digest('hex');
fs.writeFileSync(path.join(root, sidecar), `${artifactHash}  fixture.json\n`);

assert.equal(jsonPointerGet(doc, '/contract/signature'), 'improve(candidate,baseline)');
const contract = {
  schema_version: 1,
  task_id: 'WR-900',
  checks: [
    { type: 'file_exists', path: fixture },
    { type: 'sha256_sidecar', artifact, sidecar },
    { type: 'json_pointer_equals', path: artifact, pointer: '/contract/signature', value: 'improve(candidate,baseline)' },
    { type: 'json_pointer_file_sha256', path: artifact, pointer: '/fixture_sha', file: fixture }
  ]
};
const result = evaluateContract({ root, contract, target: 'main' });
assert.deepEqual(result.blockers, []);

const task = {
  task_id: 'WR-900', audit_required: true, branch: 'wr-900', audit_readiness_contract: '.ai/manager/audit-readiness/WR-900.json',
  allowed_path_prefixes: ['.ai/research/'], forbidden_path_prefixes: ['src/'], forbidden_exact_paths: []
};
const packet = buildAuditReadinessPacket({ root, taskId: 'WR-900', target: 'main', branch: 'wr-900', head: 'a'.repeat(40), changedFiles: [artifact, sidecar, fixture], task, contract });
assert.equal(packet.ready_for_manager_freeze, true);
assert.equal(packet.blockers.length, 0);
assert.equal(packet.changed_file_sha256[fixture], fixtureHash);

const badDoc = JSON.parse(fs.readFileSync(path.join(root, artifact), 'utf8'));
badDoc.contract.signature = 'improve(baseline,candidate)';
fs.writeFileSync(path.join(root, artifact), `${JSON.stringify(badDoc)}\n`);
const bad = evaluateContract({ root, contract, target: 'main' });
assert.ok(bad.blockers.some(item => item.includes('json_pointer_equals')));

// WR-079-AUD-01: automatic task attribution must include repository identity and, when recorded, PR identity.
const autoTask = { task_id: 'WR-901', branch: 'shared-name', audit_required: true, pr: 42 };
let selection = selectAutoTask({ tasks: [autoTask], branch: 'shared-name', eventName: 'pull_request', repository: 'Ryan42062001/The-War-Room', headRepository: 'Ryan42062001/The-War-Room', prNumber: 42 });
assert.equal(selection.task?.task_id, 'WR-901');
assert.equal(selection.reason, null);
selection = selectAutoTask({ tasks: [autoTask], branch: 'shared-name', eventName: 'pull_request', repository: 'Ryan42062001/The-War-Room', headRepository: 'someone/fork', prNumber: 42 });
assert.equal(selection.task, null);
assert.match(selection.reason, /head repository/);
selection = selectAutoTask({ tasks: [autoTask], branch: 'shared-name', eventName: 'pull_request', repository: 'Ryan42062001/The-War-Room', headRepository: 'Ryan42062001/The-War-Room', prNumber: 99 });
assert.equal(selection.task, null);
assert.match(selection.reason, /pull request identity/);
selection = selectAutoTask({ tasks: [{ ...autoTask, pr: null }], branch: 'shared-name', eventName: 'pull_request', repository: 'Ryan42062001/The-War-Room', headRepository: 'Ryan42062001/The-War-Room', prNumber: 99 });
assert.equal(selection.task?.task_id, 'WR-901');

// WR-079-AUD-02: version_bump must distinguish invalid refs from valid refs with an absent path.
const versionRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wr-audit-version-'));
fs.mkdirSync(path.join(versionRoot, 'contracts'), { recursive: true });
runGit(versionRoot, ['init']);
runGit(versionRoot, ['config', 'user.name', 'War Room Test']);
runGit(versionRoot, ['config', 'user.email', 'war-room-test@example.invalid']);
const versionedPath = 'contracts/versioned.json';
fs.writeFileSync(path.join(versionRoot, versionedPath), '{"version":"1.0.0","value":"old"}\n');
runGit(versionRoot, ['add', versionedPath]);
runGit(versionRoot, ['commit', '-m', 'base']);
const baseRef = runGit(versionRoot, ['rev-parse', 'HEAD']);
fs.writeFileSync(path.join(versionRoot, versionedPath), '{"version":"1.1.0","value":"new"}\n');
let versionResult = evaluateContract({
  root: versionRoot,
  target: baseRef,
  contract: { checks: [{ type: 'version_bump', path: versionedPath, pointer: '/version', relative_to: baseRef }] }
});
assert.deepEqual(versionResult.blockers, []);
versionResult = evaluateContract({
  root: versionRoot,
  target: baseRef,
  contract: { checks: [{ type: 'version_bump', path: versionedPath, pointer: '/version', relative_to: 'definitely-not-a-valid-ref' }] }
});
assert.ok(versionResult.blockers.some(item => item.includes('comparison ref is invalid or unresolved')));
const newPath = 'contracts/new-artifact.json';
fs.writeFileSync(path.join(versionRoot, newPath), '{"version":"1.0.0"}\n');
versionResult = evaluateContract({
  root: versionRoot,
  target: baseRef,
  contract: { checks: [{ type: 'version_bump', path: newPath, pointer: '/version', relative_to: baseRef }] }
});
assert.deepEqual(versionResult.blockers, []);
assert.match(versionResult.checks[0].detail, /absent at valid comparison target/);

fs.rmSync(versionRoot, { recursive: true, force: true });
fs.rmSync(root, { recursive: true, force: true });
console.log('workflow audit-readiness regression: PASS');
