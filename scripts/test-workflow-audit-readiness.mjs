import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildAuditReadinessPacket, evaluateContract, jsonPointerGet } from './workflow-audit-readiness.mjs';

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

fs.rmSync(root, { recursive: true, force: true });
console.log('workflow audit-readiness regression: PASS');
