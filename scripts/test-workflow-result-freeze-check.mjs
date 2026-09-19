import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {verifyFreeze} from './workflow-result-freeze-check.mjs';

function git(root,args){return execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();}
function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function canonicalize(value){if(Array.isArray(value))return value.map(canonicalize);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonicalize(value[k])]));return value;}
function canonicalBytes(value){return Buffer.from(`${JSON.stringify(canonicalize(value))}\n`,'utf8');}
function blobEntry(root,commit,rel){
  const bytes=execFileSync('git',['show',`${commit}:${rel}`],{cwd:root,encoding:'buffer'});
  return {path:rel,sha256:sha256(bytes),byte_size:bytes.length,git_blob_sha1:git(root,['rev-parse',`${commit}:${rel}`])};
}

const root=fs.mkdtempSync(path.join(os.tmpdir(),'wr-freeze-'));
git(root,['init','-q']);git(root,['config','user.email','test@example.com']);git(root,['config','user.name','Test']);
fs.mkdirSync(path.join(root,'.ai/research'),{recursive:true});
const consumerPath='.ai/research/consumer.py';
fs.writeFileSync(path.join(root,consumerPath),'print("ok")\n');
git(root,['add','.']);git(root,['commit','-qm','authorized']);
const authorized=git(root,['rev-parse','HEAD']);
const consumerSha=sha256(fs.readFileSync(path.join(root,consumerPath)));
const authority={branch:'wr-999-execution',head_sha:authorized,consumer_path:consumerPath,consumer_sha256:consumerSha};
const authoritySha=sha256(canonicalBytes(authority));

const resultPath='.ai/research/generated/WR999_RESULT.json';
const terminalPath='.ai/research/generated/WR999_TERMINAL_RESULT.json';
const receiptPath='.ai/research/generated/WR999_AUTHORITY_CONSUMPTION_RECEIPT.json';
fs.mkdirSync(path.join(root,'.ai/research/generated'),{recursive:true});
const resultPayload={task_id:'WR-999',ok:true};
const terminalPayload={
  schema_version:'wr081-terminal-result-summary-v1',task_id:'WR-999',execution_status:'SUCCESS',
  result_terminal:'VALIDATION_FAILED',decision_status:'BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE',
  authority_sha256:authoritySha,authorized_head:authorized,consumer_sha256:consumerSha,
  prediction_lock_count:4,gate_lock_count:2
};
fs.writeFileSync(path.join(root,resultPath),canonicalBytes(resultPayload));
fs.writeFileSync(path.join(root,terminalPath),canonicalBytes(terminalPayload));
const preReceiptEntries=[resultPath,terminalPath].sort().map(rel=>{
  const bytes=fs.readFileSync(path.join(root,rel));
  return {path:rel,sha256:sha256(bytes),byte_size:bytes.length};
});
const publicationPayloadSha=sha256(canonicalBytes(preReceiptEntries));
const receiptPayload={
  schema_version:'wr081-authority-consumption-receipt-v1',task_id:'WR-999',authority_sha256:authoritySha,
  branch:authority.branch,authorized_head:authorized,consumer_path:consumerPath,consumer_sha256:consumerSha,
  workflow_run_id:'10',execution_status:'SUCCESS',result_terminal:'VALIDATION_FAILED',
  decision_status:'BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE',publication_payload_sha256:publicationPayloadSha,
  single_publication_commit_required:true
};
fs.writeFileSync(path.join(root,receiptPath),canonicalBytes(receiptPayload));
git(root,['add','.']);git(root,['commit','-qm','protected publication']);
const protectedHead=git(root,['rev-parse','HEAD']);

const reportPath='.ai/research/WR999_RESULT_REPORT.md';
const manifestPath='.ai/research/WR999_RESULT_EVIDENCE_MANIFEST.json';
const report=Buffer.from('# Result\n');
fs.writeFileSync(path.join(root,reportPath),report);
const evidence=[resultPath,terminalPath,receiptPath].map(rel=>blobEntry(root,protectedHead,rel)).sort((a,b)=>a.path.localeCompare(b.path));
const manifest={
  result:{terminal:'VALIDATION_FAILED',status:'BASELINE_ONLY_OR_INSUFFICIENT_EVIDENCE'},
  generated_protected_evidence:evidence
};
const manifestBytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(root,manifestPath),manifestBytes);
git(root,['add','.']);git(root,['commit','-qm','package']);
const target=git(root,['rev-parse','HEAD']);

const contract={
  schema_version:1,task_id:'WR-999',repository:'owner/repo',pr:77,branch:'wr-999-test',
  target_sha:target,protected_evidence_head:protectedHead,allowed_path_prefixes:['.ai/research/'],
  report:{path:reportPath,sha256:sha256(report)},
  manifest:{path:manifestPath,sha256:sha256(manifestBytes),evidence_key:'generated_protected_evidence'},
  protected_workflow:{run_id:10,name:'Protected',event:'workflow_dispatch'},
  exact_head_ci:{run_id:11,name:'War Room CI'},
  authority_consumption:{
    receipt_path:receiptPath,
    terminal_path:terminalPath,
    expected_authority:authority,
    expected_workflow_run_id:'10'
  }
};
const live={
  pr:{number:77,state:'open',head_sha:target,head_branch:'wr-999-test',changed_files:[resultPath,terminalPath,receiptPath,reportPath,manifestPath]},
  protected_run:{id:10,name:'Protected',event:'workflow_dispatch',head_sha:authorized,conclusion:'success'},
  ci_run:{id:11,name:'War Room CI',event:'pull_request',head_sha:target,conclusion:'success'}
};

const packet=verifyFreeze({root,contract,live});
assert.equal(packet.target_sha,target);
assert.equal(packet.manifest.evidence_count,3);
assert.equal(packet.authority_consumption.authority_sha256,authoritySha);
assert.equal(packet.authority_consumption.receipt_sha256,sha256(fs.readFileSync(path.join(root,receiptPath))));
assert.equal(packet.authority_consumption.publication_payload_sha256,publicationPayloadSha);
assert.equal(packet.authority_consumption.payload_verified,true);
assert.equal(packet.authority_consumption.terminal_verified,true);
assert.equal(packet.packet_sha256,verifyFreeze({root,contract,live}).packet_sha256);

assert.throws(()=>verifyFreeze({root,contract,live:{...live,pr:{...live.pr,changed_files:[...live.pr.changed_files,'src/bad.js']}}}),/outside frozen scope/);
assert.throws(()=>verifyFreeze({root,contract,live:{...live,ci_run:{...live.ci_run,head_sha:'0'.repeat(40)}}}),/exact-head CI/);

const badAuthority={...contract,authority_consumption:{...contract.authority_consumption,expected_authority:{...authority,consumer_sha256:'0'.repeat(64)}}};
assert.throws(()=>verifyFreeze({root,contract:badAuthority,live}),/authority receipt digest|consumer_sha256/);

const badRun={...live,protected_run:{...live.protected_run,id:999}};
assert.throws(()=>verifyFreeze({root,contract,live:badRun}),/workflow_run_id|protected workflow run id/);

const receiptOnly={...contract};
delete receiptOnly.authority_consumption;
receiptOnly.authority_receipt_path=receiptPath;
assert.throws(()=>verifyFreeze({root,contract:receiptOnly,live}),/requires full authority_consumption contract/);

console.log('workflow result-freeze regression: PASS');
