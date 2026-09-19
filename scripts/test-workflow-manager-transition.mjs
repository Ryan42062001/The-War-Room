import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  applyTransitionPlan,
  autoPopulateAuditorPins,
  authorityIdentitySha256,
  createGitAuthorityEvidenceReader,
  syncTaskSpecHeaders,
  validateTaskShape
} from './workflow-manager-transition.mjs';

function spec(task) {
  return `# Test task\n\nTASK ID: ${task.task_id}\nROLE: Test\nSTATUS: ${task.status}\nDEPENDENCY: ${task.dependency}\nEXECUTION MODE: ${task.execution_mode}\nREFRESH MODE: ${task.refresh_mode}\nTARGET BRANCH: \`${task.branch}\`\n`;
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
    execution_mode: 'STANDARD_CHAT_HIGH',
    refresh_mode: 'FAST_REFRESH',
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
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonicalize(value[k])]));
  return value;
}
function canonicalBytes(value) { return Buffer.from(`${JSON.stringify(canonicalize(value))}\n`); }
function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function git(root, args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); }

function testBasicTransitionAndAutoPin() {
  const a = task('WR-901', { status: 'AUDIT_READY', pr: 123, worker_checkpoint_sha: 'a'.repeat(40) });
  const b = task('WR-902', {
    owner: 'Auditor', status: 'BLOCKED', dependency: 'HARD', blocker_type: 'UPSTREAM_TASK',
    blocked_on_tasks: ['WR-901'], blocked_on: ['WR-901'], branch: 'branch-WR-902',
    allowed_path_prefixes: ['.ai/auditor/']
  });
  const registry = { schema_version: 3, updated_at_utc: '2026-09-16T00:00:00Z', canonical_branch: 'main', manager_owned: true, active_only: true, tasks: [a,b] };
  const specs = new Map([[a.task_file,spec(a)],[b.task_file,spec(b)]]);
  const applied = applyTransitionPlan({
    registry,
    plan: { schema_version:1, updated_at_utc:'2026-09-16T01:00:00Z', update_tasks:[
      {task_id:'WR-901',set:{status:'AUDIT_READY',worker_checkpoint_sha:'a'.repeat(40)}},
      {task_id:'WR-902',set:{status:'ASSIGNED',blocker_type:'NONE',blocked_on_tasks:[],blocked_on:[]}}
    ]},
    taskSpecReader: rel => specs.get(rel) ?? null
  });
  assert.deepEqual(applied.errors, []);
  const pinned=applied.registry.tasks.find(t=>t.task_id==='WR-902');
  assert.equal(pinned.audit_target_task,'WR-901');
  assert.equal(pinned.audit_target_pr,123);
  assert.equal(pinned.audit_target_branch,'branch-WR-901');
  assert.equal(pinned.audit_target_sha,'a'.repeat(40));
}

function testAuditorAmbiguityAdversaries() {
  const targetA=task('WR-910',{status:'AUDIT_READY',pr:10,worker_checkpoint_sha:'a'.repeat(40)});
  const targetB=task('WR-911',{status:'AUDIT_READY',pr:11,worker_checkpoint_sha:'b'.repeat(40)});
  const auditor=task('WR-912',{owner:'Auditor',status:'ASSIGNED',allowed_path_prefixes:['.ai/auditor/'],audit_target_task:'WR-910',blocked_on_tasks:['WR-911']});
  let tasks=[targetA,targetB,auditor].map(x=>structuredClone(x));
  let errors=autoPopulateAuditorPins(tasks,[]);
  assert.ok(errors.some(e=>e.includes('expected one unambiguous upstream task')),'AUD-01 explicit target + current blocker must fail');

  const prior=task('WR-912',{owner:'Auditor',status:'BLOCKED',blocker_type:'UPSTREAM_TASK',dependency:'HARD',allowed_path_prefixes:['.ai/auditor/'],audit_target_task:'WR-911',blocked_on_tasks:['WR-911']});
  tasks=[targetA,targetB,task('WR-912',{owner:'Auditor',status:'ASSIGNED',allowed_path_prefixes:['.ai/auditor/'],audit_target_task:'WR-910'})].map(x=>structuredClone(x));
  errors=autoPopulateAuditorPins(tasks,[prior]);
  assert.ok(errors.some(e=>e.includes('expected one unambiguous upstream task')),'AUD-01 explicit target + prior target disagreement must fail');

  tasks=[targetA,targetB,task('WR-912',{owner:'Auditor',status:'ASSIGNED',allowed_path_prefixes:['.ai/auditor/'],blocked_on_tasks:['WR-910','WR-911']})].map(x=>structuredClone(x));
  errors=autoPopulateAuditorPins(tasks,[]);
  assert.ok(errors.some(e=>e.includes('got 2')),'AUD-01 multiple blockers must fail');

  const incomplete=task('WR-913',{status:'AUDIT_READY',pr:null,worker_checkpoint_sha:'c'.repeat(40)});
  tasks=[incomplete,task('WR-914',{owner:'Auditor',status:'ASSIGNED',allowed_path_prefixes:['.ai/auditor/'],audit_target_task:'WR-913'})].map(x=>structuredClone(x));
  errors=autoPopulateAuditorPins(tasks,[]);
  assert.ok(errors.some(e=>e.includes('lacks PR/branch/SHA')),'incomplete frozen target must fail');

  tasks=[targetA,task('WR-915',{owner:'Auditor',status:'ASSIGNED',allowed_path_prefixes:['.ai/auditor/'],audit_target_task:'WR-910',audit_target_pr:999})].map(x=>structuredClone(x));
  errors=autoPopulateAuditorPins(tasks,[]);
  assert.ok(errors.some(e=>e.includes('explicit audit_target_pr contradicts')),'explicit PR mismatch must fail');
}

function buildPublicationRepo() {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'wr-authority-'));
  git(root,['init','-q']); git(root,['config','user.email','test@example.com']); git(root,['config','user.name','Test']);
  fs.mkdirSync(path.join(root,'.ai/research'),{recursive:true});
  fs.writeFileSync(path.join(root,'.ai/research/consumer.py'),'print("ok")\n');
  git(root,['add','.']); git(root,['commit','-qm','authorized']);
  const authorizedHead=git(root,['rev-parse','HEAD']);
  const consumerBytes=fs.readFileSync(path.join(root,'.ai/research/consumer.py'));
  const authority={branch:'wr-906-execution',head_sha:authorizedHead,consumer_path:'.ai/research/consumer.py',consumer_sha256:sha256(consumerBytes)};
  const authoritySha=authorityIdentitySha256(authority);
  const terminalPath='.ai/research/generated/WR906_TERMINAL_RESULT.json';
  const resultPath='.ai/research/generated/WR906_RESULT.json';
  const receiptPath='.ai/research/generated/WR906_AUTHORITY_CONSUMPTION_RECEIPT.json';
  fs.mkdirSync(path.join(root,'.ai/research/generated'),{recursive:true});
  const terminal={
    schema_version:'wr081-terminal-result-summary-v1',task_id:'WR-906',execution_status:'SUCCESS',
    result_terminal:'VALIDATION_FAILED',decision_status:'BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE',
    authority_sha256:authoritySha,authorized_head:authorizedHead,consumer_sha256:authority.consumer_sha256,
    prediction_lock_count:4,gate_lock_count:2
  };
  fs.writeFileSync(path.join(root,terminalPath),canonicalBytes(terminal));
  fs.writeFileSync(path.join(root,resultPath),canonicalBytes({task_id:'WR-906',ok:true}));
  const payloadPaths=[resultPath,terminalPath].sort();
  const payloadEntries=payloadPaths.map(rel=>{
    const bytes=fs.readFileSync(path.join(root,rel));
    return {path:rel,sha256:sha256(bytes),byte_size:bytes.length};
  });
  const payloadSha=sha256(canonicalBytes(payloadEntries));
  const receipt={
    schema_version:'wr081-authority-consumption-receipt-v1',task_id:'WR-906',authority_sha256:authoritySha,
    branch:authority.branch,authorized_head:authorizedHead,consumer_path:authority.consumer_path,
    consumer_sha256:authority.consumer_sha256,workflow_run_id:'12345',execution_status:'SUCCESS',
    result_terminal:terminal.result_terminal,decision_status:terminal.decision_status,
    publication_payload_sha256:payloadSha,single_publication_commit_required:true
  };
  fs.writeFileSync(path.join(root,receiptPath),canonicalBytes(receipt));
  git(root,['add','.']); git(root,['commit','-qm','protected publication']);
  const publicationHead=git(root,['rev-parse','HEAD']);
  return {root,authorizedHead,publicationHead,authority,authoritySha,receiptPath,terminalPath,receiptSha:sha256(fs.readFileSync(path.join(root,receiptPath)))};
}

function testAuthorityConsumptionAndReplay() {
  const fx=buildPublicationRepo();
  const authorityTask=task('WR-906',{status:'IN_PROGRESS',branch:fx.authority.branch,worker_checkpoint_sha:fx.authorizedHead,future_execution_authority:fx.authority});
  const registry={schema_version:3,updated_at_utc:'2026-09-16T00:00:00Z',canonical_branch:'main',manager_owned:true,active_only:true,tasks:[authorityTask]};
  const specs=new Map([[authorityTask.task_file,spec(authorityTask)]]);
  const reader=rel=>specs.get(rel)??null;

  const missing=applyTransitionPlan({
    registry,
    plan:{schema_version:1,update_tasks:[{task_id:'WR-906',set:{worker_checkpoint_sha:fx.publicationHead}}]},
    taskSpecReader:reader,
    authorityEvidenceReader:createGitAuthorityEvidenceReader(fx.root)
  });
  assert.ok(missing.errors.some(e=>e.includes('verified authority consumption evidence is required')));

  const fabricated=applyTransitionPlan({
    registry,
    plan:{schema_version:1,authority_consumption_receipts:[{
      task_id:'WR-906',publication_head:fx.publicationHead,receipt_path:fx.receiptPath,terminal_path:fx.terminalPath,
      workflow_run_id:'12345',receipt_sha256:'0'.repeat(64)
    }],update_tasks:[{task_id:'WR-906',set:{worker_checkpoint_sha:fx.publicationHead}}]},
    taskSpecReader:reader,
    authorityEvidenceReader:createGitAuthorityEvidenceReader(fx.root)
  });
  assert.ok(fabricated.errors.some(e=>e.includes('committed receipt SHA-256 mismatch')),'AUD-02 fabricated digest must fail');

  const consumed=applyTransitionPlan({
    registry,
    plan:{schema_version:1,authority_consumption_receipts:[{
      task_id:'WR-906',publication_head:fx.publicationHead,receipt_path:fx.receiptPath,terminal_path:fx.terminalPath,
      workflow_run_id:'12345',receipt_sha256:fx.receiptSha
    }],update_tasks:[{task_id:'WR-906',set:{worker_checkpoint_sha:fx.publicationHead}}]},
    taskSpecReader:reader,
    authorityEvidenceReader:createGitAuthorityEvidenceReader(fx.root)
  });
  assert.deepEqual(consumed.errors,[]);
  const done=consumed.registry.tasks[0];
  assert.equal(done.future_execution_authority,undefined);
  assert.equal(done.authority_consumption_receipt.authority_sha256,fx.authoritySha);
  assert.ok(done.consumed_authority_sha256s.includes(fx.authoritySha));

  const replaySpecs=new Map([[done.task_file,spec(done)]]);
  const replay=applyTransitionPlan({
    registry:{...registry,tasks:[done]},
    plan:{schema_version:1,update_tasks:[{task_id:'WR-906',set:{future_execution_authority:fx.authority}}]},
    taskSpecReader:rel=>replaySpecs.get(rel)??null,
    authorityEvidenceReader:createGitAuthorityEvidenceReader(fx.root)
  });
  assert.ok(replay.errors.some(e=>e.includes('previously consumed future_execution_authority cannot be reused')),'AUD-03 replay must fail');

  const reserved=applyTransitionPlan({
    registry:{...registry,tasks:[done]},
    plan:{schema_version:1,update_tasks:[{task_id:'WR-906',set:{authority_consumption_receipt:{fake:true}}}]},
    taskSpecReader:rel=>replaySpecs.get(rel)??null
  });
  assert.ok(reserved.errors.some(e=>e.includes('machine-owned')),'receipt/history fields must not be caller writable');

  fs.writeFileSync(path.join(fx.root,'second.txt'),'second\n');git(fx.root,['add','second.txt']);git(fx.root,['commit','-qm','second publication']);
  const second=git(fx.root,['rev-parse','HEAD']);
  const multi=applyTransitionPlan({
    registry,
    plan:{schema_version:1,authority_consumption_receipts:[{
      task_id:'WR-906',publication_head:second,receipt_path:fx.receiptPath,terminal_path:fx.terminalPath,workflow_run_id:'12345'
    }],update_tasks:[{task_id:'WR-906',set:{worker_checkpoint_sha:second}}]},
    taskSpecReader:reader,
    authorityEvidenceReader:createGitAuthorityEvidenceReader(fx.root)
  });
  assert.ok(multi.errors.some(e=>e.includes('publication parent does not equal authorized head')),'multi-commit advancement must fail');
}

function testExistingShapeAndHeaderContracts() {
  const a=task('WR-920');
  const badStatus=validateTaskShape(task('WR-921',{status:'BLOCKED',blocker_type:'NONE'}));
  assert.ok(badStatus.some(e=>e.includes('requires non-NONE')));
  const synced=syncTaskSpecHeaders(spec(a),{...a,status:'MERGE_READY',dependency:'SOFT',execution_mode:'WORK_MODE',refresh_mode:'FULL_REFRESH',refresh_reason:'test exception',branch:'new-branch'});
  assert.match(synced,/^STATUS: MERGE_READY$/m);assert.match(synced,/^TARGET BRANCH: `new-branch`$/m);
  assert.ok(validateTaskShape(task('WR-922',{execution_mode:'WORK_MODE_PREFERRED'})).some(e=>e.includes('invalid execution_mode')));
  assert.ok(validateTaskShape(task('WR-923',{refresh_mode:'FULL_REFRESH'})).some(e=>e.includes('FULL_REFRESH requires')));
}

testBasicTransitionAndAutoPin();
testAuditorAmbiguityAdversaries();
testAuthorityConsumptionAndReplay();
testExistingShapeAndHeaderContracts();
console.log('workflow Manager-transition regression: PASS');
