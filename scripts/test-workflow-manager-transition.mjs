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
  validateTaskShape,
  verifyAuthorityWorkflowRuns,
  verifyProtectedWorkflowRun
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

const CANONICAL_REPOSITORY='Ryan42062001/The-War-Room';
const CONTROL_PLANE_HEAD='c'.repeat(40);
const LEGACY_CONSUMER='.ai/research/WR081_PROTECTED_SCORING_CONSUMER.py';
const V21_CONSUMER='.ai/research/WR097_V21_PROTECTED_SCORING_CONSUMER.py';
const LEGACY_WORKFLOW='WR-083 Protected Historical Scoring Bridge';
const V21_WORKFLOW='WR-097 Returning-Player v2.1 Protected Scoring Bridge';

function workflowForAuthority(authority) {
  if (authority.consumer_path === LEGACY_CONSUMER) return LEGACY_WORKFLOW;
  if (authority.consumer_path === V21_CONSUMER) return V21_WORKFLOW;
  return 'UNKNOWN';
}
function rawRunFor(authority, overrides={}) {
  return {
    id:12345,name:workflowForAuthority(authority),event:'workflow_dispatch',
    head_branch:'main',head_sha:CONTROL_PLANE_HEAD,status:'completed',conclusion:'success',
    repository:{full_name:CANONICAL_REPOSITORY},...overrides
  };
}
function verifiedRunFor(fx, overrides={}) {
  const raw=rawRunFor(fx.authority,overrides);
  return {
    id:raw.id,name:raw.name,expected_workflow_name:workflowForAuthority(fx.authority),
    event:raw.event,head_branch:raw.head_branch,head_sha:raw.head_sha,status:raw.status,
    conclusion:raw.conclusion,repository_full_name:raw.repository?.full_name || raw.repository_full_name,
    control_plane_head:CONTROL_PLANE_HEAD,authority_sha256:fx.authoritySha,
    consumer_path:fx.authority.consumer_path,consumer_sha256:fx.authority.consumer_sha256,
    ...overrides
  };
}

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

function buildPublicationRepo({consumerPath=LEGACY_CONSUMER, receiptOverrides={}, terminalOverrides={}}={}) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'wr-authority-'));
  git(root,['init','-q']); git(root,['config','user.email','test@example.com']); git(root,['config','user.name','Test']);
  const consumerFull=path.join(root,consumerPath);
  fs.mkdirSync(path.dirname(consumerFull),{recursive:true});
  fs.writeFileSync(consumerFull,'print("ok")\n');
  git(root,['add','.']); git(root,['commit','-qm','authorized']);
  const authorizedHead=git(root,['rev-parse','HEAD']);
  const consumerBytes=fs.readFileSync(consumerFull);
  const authority={branch:'wr-906-execution',head_sha:authorizedHead,consumer_path:consumerPath,consumer_sha256:sha256(consumerBytes)};
  const authoritySha=authorityIdentitySha256(authority);
  const terminalPath='.ai/research/generated/WR906_TERMINAL_RESULT.json';
  const resultPath='.ai/research/generated/WR906_RESULT.json';
  const receiptPath='.ai/research/generated/WR906_AUTHORITY_CONSUMPTION_RECEIPT.json';
  fs.mkdirSync(path.join(root,'.ai/research/generated'),{recursive:true});
  const terminal={
    schema_version:'wr081-terminal-result-summary-v1',task_id:'WR-906',execution_status:'SUCCESS',
    result_terminal:'VALIDATION_FAILED',decision_status:'BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE',
    authority_sha256:authoritySha,authorized_head:authorizedHead,consumer_sha256:authority.consumer_sha256,
    prediction_lock_count:4,gate_lock_count:2,...terminalOverrides
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
    publication_payload_sha256:payloadSha,single_publication_commit_required:true,...receiptOverrides
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
    authorityEvidenceReader:createGitAuthorityEvidenceReader(fx.root),
    authorityVerifiedRuns:new Map([['WR-906',verifiedRunFor(fx)]])
  });
  assert.ok(fabricated.errors.some(e=>e.includes('committed receipt SHA-256 mismatch')),'AUD-02 fabricated digest must fail');

  const unverifiedRun=applyTransitionPlan({
    registry,
    plan:{schema_version:1,authority_consumption_receipts:[{
      task_id:'WR-906',publication_head:fx.publicationHead,receipt_path:fx.receiptPath,terminal_path:fx.terminalPath,
      workflow_run_id:'12345',receipt_sha256:fx.receiptSha
    }],update_tasks:[{task_id:'WR-906',set:{worker_checkpoint_sha:fx.publicationHead}}]},
    taskSpecReader:reader,
    authorityEvidenceReader:createGitAuthorityEvidenceReader(fx.root),
    authorityVerifiedRuns:new Map([['WR-906',verifiedRunFor(fx,{conclusion:'failure'})]])
  });
  assert.ok(unverifiedRun.errors.some(e=>e.includes('not independently verified')),'AUD-02 failed workflow run must not authorize consumption');

  const consumed=applyTransitionPlan({
    registry,
    plan:{schema_version:1,authority_consumption_receipts:[{
      task_id:'WR-906',publication_head:fx.publicationHead,receipt_path:fx.receiptPath,terminal_path:fx.terminalPath,
      workflow_run_id:'12345',receipt_sha256:fx.receiptSha
    }],update_tasks:[{task_id:'WR-906',set:{worker_checkpoint_sha:fx.publicationHead}}]},
    taskSpecReader:reader,
    authorityEvidenceReader:createGitAuthorityEvidenceReader(fx.root),
    authorityVerifiedRuns:new Map([['WR-906',verifiedRunFor(fx)]])
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

  const injectedAddTask=task('WR-907',{authority_consumption_receipt:{authority_sha256:fx.authoritySha}});
  const injectedAdd=applyTransitionPlan({
    registry:consumed.registry,
    plan:{schema_version:1,add_tasks:[injectedAddTask]},
    taskSpecReader:rel=>rel===injectedAddTask.task_file?spec(injectedAddTask):(replaySpecs.get(rel)??null)
  });
  assert.ok(injectedAdd.errors.some(e=>e.includes('machine-owned')&&e.includes('add_tasks')),'WR-093 protected-field injection through add_tasks must fail');

  const replacementTask=task('WR-906',{status:'ASSIGNED',branch:'branch-WR-906-reopened'});
  const replacementSpecs=new Map([[replacementTask.task_file,spec(replacementTask)]]);
  const replaceLifecycle=applyTransitionPlan({
    registry:consumed.registry,
    plan:{schema_version:1,remove_tasks:['WR-906'],add_tasks:[replacementTask]},
    taskSpecReader:rel=>replacementSpecs.get(rel)??null
  });
  assert.deepEqual(replaceLifecycle.errors,[],'WR-093 legitimate same-id lifecycle replacement without protected-field injection should remain allowed');
  assert.ok(replaceLifecycle.registry.authority_consumption_history.includes(fx.authoritySha),'WR-093 remove+re-add must preserve global consumed-authority history');

  const replayAfterReplacement=applyTransitionPlan({
    registry:replaceLifecycle.registry,
    plan:{schema_version:1,update_tasks:[{task_id:'WR-906',set:{future_execution_authority:fx.authority}}]},
    taskSpecReader:rel=>replacementSpecs.get(rel)??null
  });
  assert.ok(replayAfterReplacement.errors.some(e=>e.includes('previously consumed future_execution_authority cannot be reused')),'WR-093 replay after remove+re-add history preservation must fail');

  const directReAddReplayTask=task('WR-908',{future_execution_authority:fx.authority});
  const directReAdd=applyTransitionPlan({
    registry:replaceLifecycle.registry,
    plan:{schema_version:1,add_tasks:[directReAddReplayTask]},
    taskSpecReader:rel=>rel===directReAddReplayTask.task_file?spec(directReAddReplayTask):(replacementSpecs.get(rel)??null)
  });
  assert.ok(directReAdd.errors.some(e=>e.includes('previously consumed future_execution_authority cannot be reused')),'WR-093 add_tasks must reject a globally consumed authority');

  const removeOnly=applyTransitionPlan({
    registry:consumed.registry,
    plan:{schema_version:1,remove_tasks:['WR-906']},
    taskSpecReader:()=>null
  });
  assert.deepEqual(removeOnly.errors,[],'WR-093 legitimate task removal/closure must remain allowed');
  assert.equal(removeOnly.registry.tasks.length,0);
  assert.ok(removeOnly.registry.authority_consumption_history.includes(fx.authoritySha),'WR-093 legitimate removal must retain global replay history');

  const differentAuthority={...fx.authority,head_sha:'f'.repeat(40)};
  const differentTask=task('WR-909',{future_execution_authority:differentAuthority});
  const differentAdd=applyTransitionPlan({
    registry:removeOnly.registry,
    plan:{schema_version:1,add_tasks:[differentTask]},
    taskSpecReader:rel=>rel===differentTask.task_file?spec(differentTask):null
  });
  assert.deepEqual(differentAdd.errors,[],'WR-093 unrelated future authority must not be overblocked');

  fs.writeFileSync(path.join(fx.root,'second.txt'),'second\n');git(fx.root,['add','second.txt']);git(fx.root,['commit','-qm','second publication']);
  const second=git(fx.root,['rev-parse','HEAD']);
  const multi=applyTransitionPlan({
    registry,
    plan:{schema_version:1,authority_consumption_receipts:[{
      task_id:'WR-906',publication_head:second,receipt_path:fx.receiptPath,terminal_path:fx.terminalPath,workflow_run_id:'12345'
    }],update_tasks:[{task_id:'WR-906',set:{worker_checkpoint_sha:second}}]},
    taskSpecReader:reader,
    authorityEvidenceReader:createGitAuthorityEvidenceReader(fx.root),
    authorityVerifiedRuns:new Map([['WR-906',verifiedRunFor(fx)]])
  });
  assert.ok(multi.errors.some(e=>e.includes('publication parent does not equal authorized head')),'multi-commit advancement must fail');
}

function testProtectedWorkflowIdentityBinding() {
  const legacy=buildPublicationRepo();
  const v21=buildPublicationRepo({consumerPath:V21_CONSUMER});
  const context={workflowRunId:'12345',repositoryFullName:CANONICAL_REPOSITORY,controlPlaneHead:CONTROL_PLANE_HEAD};

  assert.equal(verifyProtectedWorkflowRun(legacy.authority,rawRunFor(legacy.authority),context).name,LEGACY_WORKFLOW);
  assert.equal(verifyProtectedWorkflowRun(v21.authority,rawRunFor(v21.authority),context).name,V21_WORKFLOW);

  const badCases=[
    [legacy.authority,rawRunFor(legacy.authority,{name:'wrong workflow'}),'wrong workflow name'],
    [legacy.authority,rawRunFor(legacy.authority,{name:V21_WORKFLOW}),'WR-083 authority paired with WR-097 workflow'],
    [v21.authority,rawRunFor(v21.authority,{name:LEGACY_WORKFLOW}),'WR-097 authority paired with WR-083 workflow'],
    [legacy.authority,rawRunFor(legacy.authority,{repository:{full_name:'fork/repo'}}),'wrong repository'],
    [legacy.authority,rawRunFor(legacy.authority,{head_branch:'feature'}),'wrong branch'],
    [legacy.authority,rawRunFor(legacy.authority,{head_sha:'d'.repeat(40)}),'wrong control-plane head'],
    [legacy.authority,rawRunFor(legacy.authority,{id:99999}),'wrong workflow run ID'],
    [legacy.authority,rawRunFor(legacy.authority,{conclusion:'failure'}),'failed workflow run'],
    [legacy.authority,rawRunFor(legacy.authority,{conclusion:'cancelled'}),'cancelled workflow run'],
    [legacy.authority,rawRunFor(legacy.authority,{status:'in_progress',conclusion:null}),'in-progress workflow run']
  ];
  for (const [authority,run,label] of badCases) assert.throws(()=>verifyProtectedWorkflowRun(authority,run,context),undefined,label);
  assert.throws(()=>verifyProtectedWorkflowRun({...legacy.authority,consumer_path:'.ai/research/UNKNOWN.py'},rawRunFor(legacy.authority),context),/unsupported protected consumer identity/,'unknown consumer/workflow family must fail closed');

  const v21Task=task('WR-906',{status:'IN_PROGRESS',branch:v21.authority.branch,worker_checkpoint_sha:v21.authorizedHead,future_execution_authority:v21.authority});
  const v21Registry={schema_version:3,updated_at_utc:'2026-09-19T00:00:00Z',canonical_branch:'main',manager_owned:true,active_only:true,tasks:[v21Task]};
  const v21Specs=new Map([[v21Task.task_file,spec(v21Task)]]);
  const v21Consumed=applyTransitionPlan({
    registry:v21Registry,
    plan:{schema_version:1,authority_consumption_receipts:[{task_id:'WR-906',publication_head:v21.publicationHead,receipt_path:v21.receiptPath,terminal_path:v21.terminalPath,workflow_run_id:'12345',receipt_sha256:v21.receiptSha}],update_tasks:[{task_id:'WR-906',set:{worker_checkpoint_sha:v21.publicationHead}}]},
    taskSpecReader:rel=>v21Specs.get(rel)??null,
    authorityEvidenceReader:createGitAuthorityEvidenceReader(v21.root),
    authorityVerifiedRuns:new Map([['WR-906',verifiedRunFor(v21)]])
  });
  assert.deepEqual(v21Consumed.errors,[],'legitimate WR-097 v2.1 authority path must be valid');

  const badReceipt=buildPublicationRepo({receiptOverrides:{consumer_sha256:'0'.repeat(64)}});
  const badReceiptTask=task('WR-906',{status:'IN_PROGRESS',branch:badReceipt.authority.branch,worker_checkpoint_sha:badReceipt.authorizedHead,future_execution_authority:badReceipt.authority});
  const badReceiptRegistry={schema_version:3,updated_at_utc:'2026-09-19T00:00:00Z',canonical_branch:'main',manager_owned:true,active_only:true,tasks:[badReceiptTask]};
  const badReceiptSpecs=new Map([[badReceiptTask.task_file,spec(badReceiptTask)]]);
  const badDigest=applyTransitionPlan({
    registry:badReceiptRegistry,
    plan:{schema_version:1,authority_consumption_receipts:[{task_id:'WR-906',publication_head:badReceipt.publicationHead,receipt_path:badReceipt.receiptPath,terminal_path:badReceipt.terminalPath,workflow_run_id:'12345',receipt_sha256:badReceipt.receiptSha}],update_tasks:[{task_id:'WR-906',set:{worker_checkpoint_sha:badReceipt.publicationHead}}]},
    taskSpecReader:rel=>badReceiptSpecs.get(rel)??null,
    authorityEvidenceReader:createGitAuthorityEvidenceReader(badReceipt.root),
    authorityVerifiedRuns:new Map([['WR-906',verifiedRunFor(badReceipt)]])
  });
  assert.ok(badDigest.errors.some(e=>e.includes('committed receipt consumer_sha256 mismatch')),'wrong consumer digest must fail closed');

  const crossBound=buildPublicationRepo({terminalOverrides:{authority_sha256:'0'.repeat(64)}});
  const crossTask=task('WR-906',{status:'IN_PROGRESS',branch:crossBound.authority.branch,worker_checkpoint_sha:crossBound.authorizedHead,future_execution_authority:crossBound.authority});
  const crossRegistry={schema_version:3,updated_at_utc:'2026-09-19T00:00:00Z',canonical_branch:'main',manager_owned:true,active_only:true,tasks:[crossTask]};
  const crossSpecs=new Map([[crossTask.task_file,spec(crossTask)]]);
  const cross=applyTransitionPlan({
    registry:crossRegistry,
    plan:{schema_version:1,authority_consumption_receipts:[{task_id:'WR-906',publication_head:crossBound.publicationHead,receipt_path:crossBound.receiptPath,terminal_path:crossBound.terminalPath,workflow_run_id:'12345',receipt_sha256:crossBound.receiptSha}],update_tasks:[{task_id:'WR-906',set:{worker_checkpoint_sha:crossBound.publicationHead}}]},
    taskSpecReader:rel=>crossSpecs.get(rel)??null,
    authorityEvidenceReader:createGitAuthorityEvidenceReader(crossBound.root),
    authorityVerifiedRuns:new Map([['WR-906',verifiedRunFor(crossBound)]])
  });
  assert.ok(cross.errors.some(e=>e.includes('terminal summary authority_sha256 mismatch')),'authority/result cross-binding mismatch must fail closed');
}

async function testLiveWorkflowVerificationFailures() {
  const fx=buildPublicationRepo({consumerPath:V21_CONSUMER});
  const authorityTask=task('WR-906',{status:'IN_PROGRESS',branch:fx.authority.branch,worker_checkpoint_sha:fx.authorizedHead,future_execution_authority:fx.authority});
  const registry={schema_version:3,updated_at_utc:'2026-09-19T00:00:00Z',canonical_branch:'main',manager_owned:true,active_only:true,tasks:[authorityTask]};
  const plan={schema_version:1,repository:CANONICAL_REPOSITORY,authority_consumption_receipts:[{task_id:'WR-906',workflow_run_id:'12345'}]};
  const options={repositoryFullName:CANONICAL_REPOSITORY,controlPlaneHead:CONTROL_PLANE_HEAD};
  const okFetch=async()=>({ok:true,status:200,json:async()=>rawRunFor(fx.authority)});
  const verified=await verifyAuthorityWorkflowRuns(plan,registry,{...options,fetchImpl:okFetch});
  assert.equal(verified.get('WR-906').name,V21_WORKFLOW);
  await assert.rejects(()=>verifyAuthorityWorkflowRuns(plan,registry,{...options,fetchImpl:async()=>{throw new Error('network down');}}),/live verification unavailable/,'canonical run unavailable must fail closed');
  await assert.rejects(()=>verifyAuthorityWorkflowRuns(plan,registry,{...options,fetchImpl:async()=>({ok:false,status:503,json:async()=>({})})}),/HTTP 503/,'GitHub API non-success must fail closed');
  await assert.rejects(()=>verifyAuthorityWorkflowRuns(plan,registry,{...options,fetchImpl:async()=>({ok:true,status:200,json:async()=>rawRunFor(fx.authority,{name:LEGACY_WORKFLOW})})}),/workflow identity mismatch/,'workflow identity substitution must fail');
  await assert.rejects(()=>verifyAuthorityWorkflowRuns({...plan,repository:'fork/repo'},registry,{...options,fetchImpl:okFetch}),/does not match canonical repository/,'caller repository substitution must fail');
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
testProtectedWorkflowIdentityBinding();
await testLiveWorkflowVerificationFailures();
testExistingShapeAndHeaderContracts();
console.log('workflow Manager-transition regression: PASS');
