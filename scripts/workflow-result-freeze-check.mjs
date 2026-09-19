import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
class ContradictionError extends Error {}
class LiveUnavailableError extends Error {}
function parseArgs(raw=process.argv.slice(2)){const o={contract:null,root:null,liveSnapshot:null,json:false,output:null};for(let i=0;i<raw.length;i++){if(raw[i]==='--contract')o.contract=raw[++i];else if(raw[i]==='--root')o.root=raw[++i];else if(raw[i]==='--live-snapshot')o.liveSnapshot=raw[++i];else if(raw[i]==='--output')o.output=raw[++i];else if(raw[i]==='--json')o.json=true;}if(!o.contract)throw new Error('Usage: node scripts/workflow-result-freeze-check.mjs --contract contract.json [--live-snapshot live.json] [--output packet.json] [--json]');return o;}
function git(root,args,encoding='utf8'){return execFileSync('git',args,{cwd:root,encoding,stdio:['ignore','pipe','pipe']});}
function show(root,sha,file){return git(root,['show',`${sha}:${file}`],null);}
function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function canonical(v){if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));return v;}
function expect(c,m){if(!c)throw new ContradictionError(m);}
function canonicalBytes(v){return Buffer.from(`${JSON.stringify(canonical(v))}\n`,'utf8');}
function normalizeAuthority(a){
  if(!a||typeof a!=='object')return null;
  const n={branch:String(a.branch||''),head_sha:String(a.head_sha||''),consumer_path:String(a.consumer_path||''),consumer_sha256:String(a.consumer_sha256||'')};
  if(!n.branch||n.branch==='main'||!/^[0-9a-f]{40}$/.test(n.head_sha)||!n.consumer_path.startsWith('.ai/research/')||n.consumer_path.split('/').includes('..')||!/^[0-9a-f]{64}$/.test(n.consumer_sha256))return null;
  return n;
}
function authorityDigest(a){const n=normalizeAuthority(a);return n?sha256(canonicalBytes(n)):null;}
function parseJson(bytes,label){try{return JSON.parse(Buffer.from(bytes).toString('utf8'));}catch{throw new ContradictionError(`${label} is not valid JSON`);}}
async function apiJson(url,token){const h={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};if(token)h.Authorization=`Bearer ${token}`;let r;try{r=await fetch(url,{headers:h});}catch(e){throw new LiveUnavailableError(e.message);}if(!r.ok)throw new LiveUnavailableError(`GitHub API HTTP ${r.status} for ${url}`);return r.json();}
async function fetchLive(c){const repo=c.repository,t=process.env.GITHUB_TOKEN||'';if(!repo)throw new ContradictionError('contract.repository is required');const pr=await apiJson(`https://api.github.com/repos/${repo}/pulls/${c.pr}`,t);if(pr.changed_files>100)throw new ContradictionError('freeze verifier refuses PRs with >100 changed files');const files=await apiJson(`https://api.github.com/repos/${repo}/pulls/${c.pr}/files?per_page=100`,t);const p=await apiJson(`https://api.github.com/repos/${repo}/actions/runs/${c.protected_workflow.run_id}`,t);const ci=await apiJson(`https://api.github.com/repos/${repo}/actions/runs/${c.exact_head_ci.run_id}`,t);return{pr:{number:pr.number,state:pr.state,head_sha:pr.head?.sha,head_branch:pr.head?.ref,changed_files:files.map(f=>f.filename)},protected_run:{id:p.id,name:p.name,event:p.event,head_sha:p.head_sha,conclusion:p.conclusion},ci_run:{id:ci.id,name:ci.name,event:ci.event,head_sha:ci.head_sha,conclusion:ci.conclusion}};}
export function verifyFreeze({root,contract:c,live}){
  expect(c.schema_version===1,'freeze contract schema_version must be 1');expect(/^WR-\d{3}$/.test(c.task_id||''),'task_id must be WR-###');expect(/^[0-9a-f]{40}$/.test(c.target_sha||''),'target_sha must be exact SHA');expect(/^[0-9a-f]{40}$/.test(c.protected_evidence_head||''),'protected_evidence_head must be exact SHA');expect(Number.isInteger(c.pr)&&c.pr>0,'positive PR is required');expect(Array.isArray(c.allowed_path_prefixes)&&c.allowed_path_prefixes.length,'allowed_path_prefixes required');
  expect(live.pr.number===c.pr,'live PR number mismatch');expect(live.pr.head_sha===c.target_sha,'live PR head does not equal frozen target');expect(live.pr.head_branch===c.branch,'live PR branch mismatch');for(const f of live.pr.changed_files||[])expect(c.allowed_path_prefixes.some(p=>f.startsWith(p)),`PR path outside frozen scope: ${f}`);
  const report=show(root,c.target_sha,c.report.path),manifestBytes=show(root,c.target_sha,c.manifest.path);expect(sha256(report)===c.report.sha256,'report SHA-256 mismatch');expect(sha256(manifestBytes)===c.manifest.sha256,'manifest SHA-256 mismatch');let m;try{m=JSON.parse(manifestBytes.toString('utf8'));}catch{throw new ContradictionError('manifest is not valid JSON');}const ev=m[c.manifest.evidence_key||'generated_protected_evidence'];expect(Array.isArray(ev)&&ev.length,'manifest evidence inventory missing');
  for(const e of ev){const bytes=show(root,c.protected_evidence_head,e.path);const blob=git(root,['rev-parse',`${c.protected_evidence_head}:${e.path}`]).trim();expect(blob===e.git_blob_sha1,`Git blob mismatch for ${e.path}`);expect(sha256(bytes)===e.sha256,`SHA-256 mismatch for ${e.path}`);expect(bytes.length===e.byte_size,`byte-size mismatch for ${e.path}`);}
  const p=live.protected_run,ci=live.ci_run;
  let authority_consumption=null;
  if(c.authority_receipt_path && !c.authority_consumption) throw new ContradictionError('authority_receipt_path requires full authority_consumption contract');
  if(c.authority_consumption){
    const ac=c.authority_consumption;
    const expected=normalizeAuthority(ac.expected_authority);
    expect(expected,'authority_consumption expected_authority is malformed');
    const authoritySha=authorityDigest(expected);
    const receiptPath=String(ac.receipt_path||'');
    const terminalPath=String(ac.terminal_path||'');
    expect(receiptPath.startsWith('.ai/research/generated/')&&!receiptPath.split('/').includes('..'),'authority receipt path is invalid');
    expect(terminalPath.startsWith('.ai/research/generated/')&&!terminalPath.split('/').includes('..'),'terminal summary path is invalid');
    const receiptEntry=ev.find(e=>e.path===receiptPath),terminalEntry=ev.find(e=>e.path===terminalPath);
    expect(receiptEntry,'authority receipt is not bound by manifest evidence inventory');
    expect(terminalEntry,'terminal summary is not bound by manifest evidence inventory');
    const receiptBytes=show(root,c.protected_evidence_head,receiptPath);
    const terminalBytes=show(root,c.protected_evidence_head,terminalPath);
    const receipt=parseJson(receiptBytes,'authority receipt');
    const terminal=parseJson(terminalBytes,'terminal result summary');
    const parent=git(root,['rev-parse',`${c.protected_evidence_head}^`]).trim();
    expect(parent===expected.head_sha,'protected evidence parent does not equal expected authorized head');
    expect(receipt.schema_version==='wr081-authority-consumption-receipt-v1','authority receipt schema mismatch');
    expect(receipt.task_id===c.task_id,'authority receipt task_id mismatch');
    expect(receipt.authority_sha256===authoritySha,'authority receipt digest does not match expected canonical authority');
    expect(receipt.branch===expected.branch,'authority receipt branch mismatch');
    expect(receipt.authorized_head===expected.head_sha,'authority receipt authorized_head mismatch');
    expect(receipt.consumer_path===expected.consumer_path,'authority receipt consumer_path mismatch');
    expect(receipt.consumer_sha256===expected.consumer_sha256,'authority receipt consumer_sha256 mismatch');
    expect(receipt.single_publication_commit_required===true,'authority receipt does not require one publication commit');
    expect(receipt.execution_status==='SUCCESS','authority receipt execution_status is not SUCCESS');
    expect(typeof receipt.workflow_run_id==='string'&&receipt.workflow_run_id,'authority receipt workflow_run_id missing');
    expect(String(p.id)===receipt.workflow_run_id,'authority receipt workflow_run_id does not match protected workflow run');
    if(ac.expected_workflow_run_id!=null)expect(String(ac.expected_workflow_run_id)===receipt.workflow_run_id,'authority receipt workflow_run_id does not match contract');
    expect(/^[0-9a-f]{64}$/.test(receipt.publication_payload_sha256||''),'authority receipt publication payload digest malformed');
    const terminalChecks={task_id:c.task_id,execution_status:receipt.execution_status,result_terminal:receipt.result_terminal,decision_status:receipt.decision_status,authority_sha256:authoritySha,authorized_head:expected.head_sha,consumer_sha256:expected.consumer_sha256};
    for(const [field,value] of Object.entries(terminalChecks))expect(terminal[field]===value,`terminal summary ${field} mismatch`);
    if(m.result?.terminal!=null)expect(receipt.result_terminal===m.result.terminal,'receipt terminal disagrees with result manifest');
    if(m.result?.status!=null)expect(receipt.decision_status===m.result.status,'receipt decision status disagrees with result manifest');
    const payloadEntries=ev.filter(e=>e.path!==receiptPath).map(e=>({path:e.path,sha256:e.sha256,byte_size:e.byte_size})).sort((a,b)=>a.path.localeCompare(b.path));
    const payloadSha=sha256(canonicalBytes(payloadEntries));
    expect(payloadSha===receipt.publication_payload_sha256,'authority receipt publication payload SHA-256 mismatch');
    authority_consumption={authority_sha256:authoritySha,authorized_head:expected.head_sha,publication_head:c.protected_evidence_head,receipt_path:receiptPath,receipt_sha256:sha256(receiptBytes),terminal_path:terminalPath,workflow_run_id:receipt.workflow_run_id,execution_status:receipt.execution_status,result_terminal:receipt.result_terminal,decision_status:receipt.decision_status,publication_payload_sha256:payloadSha,single_publication_commit:true,publication_parent_verified:true,payload_verified:true,terminal_verified:true};
  }expect(p.id===c.protected_workflow.run_id,'protected workflow run id mismatch');expect(p.conclusion==='success','protected workflow did not conclude success');if(c.protected_workflow.name)expect(p.name===c.protected_workflow.name,'protected workflow name mismatch');if(c.protected_workflow.event)expect(p.event===c.protected_workflow.event,'protected workflow event mismatch');expect(ci.id===c.exact_head_ci.run_id,'exact-head CI run id mismatch');expect(ci.head_sha===c.target_sha,'exact-head CI did not run on frozen target');expect(ci.conclusion==='success','exact-head CI did not conclude success');if(c.exact_head_ci.name)expect(ci.name===c.exact_head_ci.name,'exact-head CI name mismatch');
  const packet={schema_version:'workflow-result-freeze-packet-v1',task_id:c.task_id,repository:c.repository,pr:c.pr,branch:c.branch,target_sha:c.target_sha,protected_evidence_head:c.protected_evidence_head,allowed_path_prefixes:[...c.allowed_path_prefixes].sort(),report:{path:c.report.path,sha256:c.report.sha256},manifest:{path:c.manifest.path,sha256:c.manifest.sha256,evidence_count:ev.length},protected_workflow:{run_id:p.id,name:p.name,event:p.event,head_sha:p.head_sha,conclusion:p.conclusion},exact_head_ci:{run_id:ci.id,name:ci.name,event:ci.event,head_sha:ci.head_sha,conclusion:ci.conclusion},authority_consumption,result_terminal:m.result?.terminal??null,decision_status:m.result?.status??null};return{...packet,packet_sha256:sha256(Buffer.from(JSON.stringify(canonical(packet))))};
}
async function main(){const o=parseArgs(),root=path.resolve(o.root||process.cwd()),c=JSON.parse(fs.readFileSync(path.resolve(root,o.contract),'utf8')),live=o.liveSnapshot?JSON.parse(fs.readFileSync(path.resolve(root,o.liveSnapshot),'utf8')):await fetchLive(c),packet=verifyFreeze({root,contract:c,live}),rendered=JSON.stringify(packet,null,2)+'\n';if(o.output)fs.writeFileSync(path.resolve(root,o.output),rendered);console.log(o.json?rendered.trim():`WORKFLOW RESULT FREEZE: PASS ${packet.task_id} ${packet.target_sha} packet=${packet.packet_sha256}`);}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);if(invoked)main().catch(e=>{if(e instanceof LiveUnavailableError){console.error(`LIVE_UNAVAILABLE: ${e.message}`);process.exitCode=3;}else{console.error(`FREEZE_REJECTED: ${e.message}`);process.exitCode=2;}});
