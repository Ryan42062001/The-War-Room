import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

function args() {
  const out = { task: null, target: null, json: false };
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] === '--task') out.task = raw[++i];
    else if (raw[i] === '--target') out.target = raw[++i];
    else if (raw[i] === '--json') out.json = true;
    else if (!raw[i].startsWith('-') && !out.task) out.task = raw[i];
  }
  if (!out.task) throw new Error('Usage: node scripts/workflow-preflight.mjs --task WR-### [--target origin/main] [--json]');
  return out;
}

function git(cwd, commandArgs, allowFailure = false) {
  try {
    return execFileSync('git', commandArgs, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    if (allowFailure) return '';
    throw new Error(`git ${commandArgs.join(' ')} failed: ${error.stderr?.toString().trim() || error.message}`);
  }
}

function lines(value) {
  return value ? value.split(/\r?\n/).map(v => v.trim()).filter(Boolean) : [];
}

function resolveTarget(cwd, requested, canonicalBranch) {
  if (requested) return requested;
  const remote = `origin/${canonicalBranch}`;
  if (git(cwd, ['rev-parse', '--verify', remote], true)) return remote;
  return canonicalBranch;
}

function isControlPlane(file) {
  return file.startsWith('.ai/') || /^scripts\/workflow-[^/]+\.mjs$/.test(file);
}

function violates(task, files) {
  const exact = new Set(task.forbidden_exact_paths || []);
  const prefixes = task.forbidden_path_prefixes || [];
  const allowed = task.allowed_path_prefixes || [];
  const forbidden = files.filter(file => exact.has(file) || prefixes.some(prefix => file.startsWith(prefix)));
  const outsideAllowlist = allowed.length
    ? files.filter(file => !allowed.some(prefix => file.startsWith(prefix)))
    : [];
  return { forbidden, outsideAllowlist };
}

function classifyAdvance(targetAdvanceFiles, branchFiles) {
  if (targetAdvanceFiles.length === 0) return 'CURRENT';
  if (targetAdvanceFiles.every(isControlPlane)) return 'CONTROL_PLANE_ONLY';
  const branchSet = new Set(branchFiles);
  if (!targetAdvanceFiles.some(file => branchSet.has(file))) return 'NON_OVERLAPPING';
  return 'OVERLAPPING_RISK';
}

const options = args();
const cwd = git(process.cwd(), ['rev-parse', '--show-toplevel']);
const registryPath = path.join(cwd, '.ai/shared/ACTIVE_TASKS.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const task = registry.tasks.find(item => item.task_id === options.task);
if (!task) throw new Error(`${options.task} is not present in .ai/shared/ACTIVE_TASKS.json`);
if (task.status === 'BLOCKED' || task.status === 'PLANNED') {
  throw new Error(`${task.task_id} is ${task.status}; blocked on: ${(task.blocked_on || []).join(', ') || 'Manager activation'}`);
}

const target = resolveTarget(cwd, options.target, registry.canonical_branch || 'main');
const head = git(cwd, ['rev-parse', 'HEAD']);
const branch = git(cwd, ['branch', '--show-current'], true) || '(detached)';
const branchFiles = lines(git(cwd, ['diff', '--name-only', `${target}...HEAD`], true));
let targetAdvanceFiles = [];
if (task.assignment_main_sha && git(cwd, ['rev-parse', '--verify', task.assignment_main_sha], true)) {
  targetAdvanceFiles = lines(git(cwd, ['diff', '--name-only', `${task.assignment_main_sha}..${target}`], true));
}
const advanceClass = classifyAdvance(targetAdvanceFiles, branchFiles);
const scope = violates(task, branchFiles);
const result = {
  task_id: task.task_id,
  owner: task.owner,
  registry_status: task.status,
  branch,
  head,
  target,
  assignment_main_sha: task.assignment_main_sha,
  target_advance_class: advanceClass,
  target_advance_files: targetAdvanceFiles,
  branch_changed_files: branchFiles,
  forbidden_files: scope.forbidden,
  outside_allowlist_files: scope.outsideAllowlist,
  audit_required: Boolean(task.audit_required),
  next_gate: task.next_gate,
  ok: scope.forbidden.length === 0 && scope.outsideAllowlist.length === 0
};

if (options.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`WORKFLOW PREFLIGHT — ${result.task_id}`);
  console.log(`status: ${result.registry_status}`);
  console.log(`branch: ${result.branch}`);
  console.log(`head: ${result.head}`);
  console.log(`target: ${result.target}`);
  console.log(`target advance: ${result.target_advance_class}`);
  console.log(`changed files: ${result.branch_changed_files.length}`);
  if (result.forbidden_files.length) console.log(`FORBIDDEN: ${result.forbidden_files.join(', ')}`);
  if (result.outside_allowlist_files.length) console.log(`OUTSIDE ALLOWLIST: ${result.outside_allowlist_files.join(', ')}`);
  console.log(`audit required: ${result.audit_required ? 'YES' : 'NO'}`);
  console.log(`next gate: ${result.next_gate}`);
  console.log(result.ok ? 'PREFLIGHT: PASS' : 'PREFLIGHT: FAIL');
}

process.exitCode = result.ok ? 0 : 2;
