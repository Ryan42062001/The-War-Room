import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { branchIdentityError } from './workflow-task-contract.mjs';

function parseArgs() {
  const out = { task: null, target: null, prBody: null, json: false };
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] === '--task') out.task = raw[++i];
    else if (raw[i] === '--target') out.target = raw[++i];
    else if (raw[i] === '--pr-body') out.prBody = raw[++i];
    else if (raw[i] === '--json') out.json = true;
    else if (!raw[i].startsWith('-') && !out.task) out.task = raw[i];
  }
  if (!out.task) throw new Error('Usage: node scripts/workflow-finish-check.mjs --task WR-### [--target origin/main] [--pr-body path] [--json]');
  return out;
}
function git(cwd, commandArgs, allowFailure = false) {
  try { return execFileSync('git', commandArgs, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch (error) { if (allowFailure) return ''; throw new Error(`git ${commandArgs.join(' ')} failed: ${error.stderr?.toString().trim() || error.message}`); }
}
function lines(value) { return value ? value.split(/\r?\n/).map(v => v.trim()).filter(Boolean) : []; }
function resolveTarget(cwd, requested, canonicalBranch) {
  if (requested) return requested;
  const remote = `origin/${canonicalBranch}`;
  return git(cwd, ['rev-parse', '--verify', remote], true) ? remote : canonicalBranch;
}
function isControlPlane(file) { return file.startsWith('.ai/') || /^scripts\/workflow-[^/]+\.mjs$/.test(file); }
function classify(targetAdvanceFiles, branchFiles) {
  if (!targetAdvanceFiles.length) return 'CURRENT';
  if (targetAdvanceFiles.every(isControlPlane)) return 'CONTROL_PLANE_ONLY';
  const branchSet = new Set(branchFiles);
  return targetAdvanceFiles.some(file => branchSet.has(file)) ? 'OVERLAPPING_RISK' : 'NON_OVERLAPPING';
}
function validatePrBody(filePath, externalRequired) {
  if (!filePath) return { provided: false, missing: [] };
  const body = fs.readFileSync(filePath, 'utf8').toUpperCase();
  const required = [
    'TASK ID', 'ROLE', 'OBJECTIVE', 'STARTING SHA', 'FINAL SHA', 'FILES CHANGED',
    'TESTS ACTUALLY RUN', 'RESULTS', 'UNVERIFIED ITEMS', 'KNOWN RISKS',
    'DEPENDENCIES', 'RECOMMENDED NEXT ROLE'
  ];
  if (externalRequired) required.push('EXTERNAL AUTHORITY EVIDENCE');
  return { provided: true, missing: required.filter(label => !body.includes(label)) };
}

const options = parseArgs();
const cwd = git(process.cwd(), ['rev-parse', '--show-toplevel']);
const registry = JSON.parse(fs.readFileSync(path.join(cwd, '.ai/shared/ACTIVE_TASKS.json'), 'utf8'));
const task = registry.tasks.find(item => item.task_id === options.task);
if (!task) throw new Error(`${options.task} is not present in active-only .ai/shared/ACTIVE_TASKS.json`);
if (['BLOCKED', 'PLANNED'].includes(task.status)) throw new Error(`${task.task_id} is ${task.status} and is not finish-check eligible`);
if (task.user_action_required) throw new Error(`${task.task_id} still requires user action and is not finish-check eligible`);

const target = resolveTarget(cwd, options.target, registry.canonical_branch || 'main');
const head = git(cwd, ['rev-parse', 'HEAD']);
const branch = git(cwd, ['branch', '--show-current'], true) || '(detached)';
const laneError = branchIdentityError(task, branch);
const branchFiles = lines(git(cwd, ['diff', '--name-only', `${target}...HEAD`], true));
let targetAdvanceFiles = [];
if (task.assignment_main_sha && git(cwd, ['rev-parse', '--verify', task.assignment_main_sha], true)) {
  targetAdvanceFiles = lines(git(cwd, ['diff', '--name-only', `${task.assignment_main_sha}..${target}`], true));
}
const advance = classify(targetAdvanceFiles, branchFiles);
const exact = new Set(task.forbidden_exact_paths || []);
const prefixes = task.forbidden_path_prefixes || [];
const allowed = task.allowed_path_prefixes || [];
const forbidden = branchFiles.filter(file => exact.has(file) || prefixes.some(prefix => file.startsWith(prefix)));
const outsideAllowlist = allowed.length ? branchFiles.filter(file => !allowed.some(prefix => file.startsWith(prefix))) : [];
const handoffExists = task.role_handoff ? fs.existsSync(path.join(cwd, task.role_handoff)) : true;
const prBody = validatePrBody(options.prBody, Boolean(task.external_authority_evidence_required));

let disposition = task.audit_required ? 'AUDIT_READY_CANDIDATE' : 'MANAGER_REVIEW_READY_CANDIDATE';
const blockers = [];
if (laneError) blockers.push(`Lane identity: ${laneError}`);
if (!branchFiles.length) blockers.push('No task-branch changes detected relative to target');
if (forbidden.length) blockers.push(`Forbidden paths changed: ${forbidden.join(', ')}`);
if (outsideAllowlist.length) blockers.push(`Files outside allowlist: ${outsideAllowlist.join(', ')}`);
if (!handoffExists) blockers.push(`Role handoff missing: ${task.role_handoff}`);
if (advance === 'OVERLAPPING_RISK') blockers.push('Target advanced on overlapping files; reconcile and rerun affected validation');
if (prBody.provided && prBody.missing.length) blockers.push(`PR body missing required fields: ${prBody.missing.join(', ')}`);
if (advance === 'NON_OVERLAPPING') disposition += '_RECONCILE_RECOMMENDED';
if (blockers.length) disposition = 'REWORK_REQUIRED';

const result = {
  task_id: task.task_id,
  head, target,
  assigned_branch: task.branch ?? null,
  branch,
  branch_identity_error: laneError,
  target_advance_class: advance,
  audit_required: Boolean(task.audit_required),
  external_authority_evidence_required: Boolean(task.external_authority_evidence_required),
  post_merge_canary_required: Boolean(task.post_merge_canary_required),
  handoff_exists: handoffExists,
  pr_body_checked: prBody.provided,
  pr_body_missing_fields: prBody.missing,
  changed_files: branchFiles,
  forbidden_files: forbidden,
  outside_allowlist_files: outsideAllowlist,
  blockers,
  disposition,
  note: 'This tool does not prove CI/test execution or audit publication. Exact-head evidence and Manager/Auditor gates remain authoritative.'
};

if (options.json) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`WORKFLOW FINISH CHECK — ${result.task_id}`);
  console.log(`assigned branch: ${result.assigned_branch || '<none>'}`);
  console.log(`branch: ${result.branch}`);
  console.log(`target advance: ${result.target_advance_class}`);
  console.log(`handoff: ${result.handoff_exists ? 'present' : 'missing'}`);
  console.log(`audit required: ${result.audit_required ? 'YES' : 'NO'}`);
  console.log(`external authority evidence: ${result.external_authority_evidence_required ? 'YES' : 'NO'}`);
  console.log(`post-merge canary: ${result.post_merge_canary_required ? 'YES' : 'NO'}`);
  result.blockers.forEach(item => console.log(`BLOCKER: ${item}`));
  console.log(`disposition: ${result.disposition}`);
  console.log(result.note);
}
process.exitCode = blockers.length ? 2 : 0;
