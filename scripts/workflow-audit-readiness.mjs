import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { branchIdentityError } from './workflow-task-contract.mjs';

function parseArgs(raw = process.argv.slice(2)) {
  const out = { task: null, target: null, json: false, root: null, auto: false, branch: null, eventName: null, repository: null, headRepository: null, prNumber: null };
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] === '--task') out.task = raw[++i];
    else if (raw[i] === '--target') out.target = raw[++i];
    else if (raw[i] === '--json') out.json = true;
    else if (raw[i] === '--root') out.root = raw[++i];
    else if (raw[i] === '--auto') out.auto = true;
    else if (raw[i] === '--branch') out.branch = raw[++i];
    else if (raw[i] === '--event-name') out.eventName = raw[++i];
    else if (raw[i] === '--repository') out.repository = raw[++i];
    else if (raw[i] === '--head-repository') out.headRepository = raw[++i];
    else if (raw[i] === '--pr-number') out.prNumber = Number(raw[++i]);
    else if (!raw[i].startsWith('-') && !out.task) out.task = raw[i];
  }
  if (!out.task && !out.auto) throw new Error('Usage: node scripts/workflow-audit-readiness.mjs (--task WR-### | --auto) [--branch name] [--target origin/main] [--json]');
  return out;
}

function git(cwd, args, allowFailure = false) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    if (allowFailure) return '';
    throw new Error(`git ${args.join(' ')} failed: ${error.stderr?.toString().trim() || error.message}`);
  }
}
function lines(value) { return value ? value.split(/\r?\n/).map(v => v.trim()).filter(Boolean) : []; }
function sha256Bytes(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function readBytes(root, rel) { return fs.readFileSync(path.join(root, rel)); }
function readJson(root, rel) { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); }
function resolveTarget(root, requested, canonicalBranch) {
  if (requested) return requested;
  const remote = `origin/${canonicalBranch}`;
  return git(root, ['rev-parse', '--verify', remote], true) ? remote : canonicalBranch;
}
function decodePointerToken(token) { return token.replace(/~1/g, '/').replace(/~0/g, '~'); }
export function jsonPointerGet(document, pointer) {
  if (pointer === '' || pointer === '/') return pointer === '' ? document : document?.[''];
  if (!pointer.startsWith('/')) throw new Error(`JSON pointer must start with /: ${pointer}`);
  let value = document;
  for (const token of pointer.slice(1).split('/').map(decodePointerToken)) {
    if (value == null || !Object.prototype.hasOwnProperty.call(value, token)) return undefined;
    value = value[token];
  }
  return value;
}
function stableEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function sidecarExpected(sidecarText) {
  const first = sidecarText.trim().split(/\s+/)[0] || '';
  return /^[0-9a-f]{64}$/.test(first) ? first : null;
}

function gitFileAtRef(root, ref, rel) {
  const resolved = git(root, ['rev-parse', '--verify', `${ref}^{commit}`], true);
  if (!resolved) return { refValid: false, pathExists: false, text: null };
  const names = lines(git(root, ['ls-tree', '-r', '--name-only', resolved, '--', rel]));
  if (!names.includes(rel)) return { refValid: true, pathExists: false, text: null };
  const text = execFileSync('git', ['show', `${resolved}:${rel}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return { refValid: true, pathExists: true, text };
}

export function selectAutoTask({ tasks, branch, eventName, repository, headRepository, prNumber }) {
  const task = tasks.find(item => item.branch === branch) || null;
  if (!task) return { task: null, reason: 'no active task claims this branch' };
  if (eventName === 'pull_request') {
    if (!repository || !headRepository) return { task: null, reason: 'pull request repository identity is unavailable' };
    if (headRepository !== repository) return { task: null, reason: `pull request head repository ${headRepository} does not match canonical repository ${repository}` };
    if (Number.isInteger(task.pr) && task.pr > 0) {
      if (!Number.isInteger(prNumber) || prNumber !== task.pr) return { task: null, reason: `pull request identity ${Number.isInteger(prNumber) ? prNumber : '<missing>'} does not match active task PR ${task.pr}` };
    }
  }
  return { task, reason: null };
}

export function evaluateContract({ root, contract, target }) {
  const checks = [];
  const blockers = [];
  const push = (type, ok, detail, check) => {
    checks.push({ type, ok, detail, check });
    if (!ok) blockers.push(`${type}: ${detail}`);
  };
  for (const check of contract.checks || []) {
    try {
      if (check.type === 'file_exists') {
        const ok = typeof check.path === 'string' && fs.existsSync(path.join(root, check.path));
        push(check.type, ok, ok ? check.path : `missing ${check.path}`, check);
      } else if (check.type === 'sha256_sidecar') {
        const artifact = check.artifact;
        const sidecar = check.sidecar || `${artifact.replace(/\.[^.]+$/, '')}.sha256`;
        const exists = fs.existsSync(path.join(root, artifact)) && fs.existsSync(path.join(root, sidecar));
        if (!exists) push(check.type, false, `missing artifact/sidecar ${artifact} / ${sidecar}`, check);
        else {
          const actual = sha256Bytes(readBytes(root, artifact));
          const expected = sidecarExpected(fs.readFileSync(path.join(root, sidecar), 'utf8'));
          push(check.type, expected === actual, `expected=${expected ?? '<invalid>'} actual=${actual}`, check);
        }
      } else if (check.type === 'json_pointer_exists') {
        const value = jsonPointerGet(readJson(root, check.path), check.pointer);
        push(check.type, value !== undefined, `${check.path}${check.pointer}`, check);
      } else if (check.type === 'json_pointer_equals') {
        const value = jsonPointerGet(readJson(root, check.path), check.pointer);
        push(check.type, stableEqual(value, check.value), `${check.path}${check.pointer} expected=${JSON.stringify(check.value)} actual=${JSON.stringify(value)}`, check);
      } else if (check.type === 'json_pointer_file_sha256') {
        const value = jsonPointerGet(readJson(root, check.path), check.pointer);
        const actual = fs.existsSync(path.join(root, check.file)) ? sha256Bytes(readBytes(root, check.file)) : null;
        push(check.type, value === actual && actual !== null, `${check.path}${check.pointer} expected file ${check.file} sha256=${actual ?? '<missing>'} actual=${JSON.stringify(value)}`, check);
      } else if (check.type === 'version_bump') {
        const current = readJson(root, check.path);
        const currentValue = jsonPointerGet(current, check.pointer);
        const comparisonRef = check.relative_to || target;
        const prior = gitFileAtRef(root, comparisonRef, check.path);
        if (!prior.refValid) {
          push(check.type, false, `comparison ref is invalid or unresolved: ${comparisonRef}`, check);
        } else if (!prior.pathExists) {
          push(check.type, true, `${check.path} absent at valid comparison target ${comparisonRef}; new artifact`, check);
        } else {
          const old = JSON.parse(prior.text);
          const oldValue = jsonPointerGet(old, check.pointer);
          const oldHash = sha256Bytes(Buffer.from(prior.text));
          const newHash = sha256Bytes(readBytes(root, check.path));
          const bytesChanged = oldHash !== newHash;
          push(check.type, !bytesChanged || currentValue !== oldValue, `${check.path}${check.pointer} old=${JSON.stringify(oldValue)} current=${JSON.stringify(currentValue)} bytes_changed=${bytesChanged}`, check);
        }
      } else {
        push(check.type || '<missing>', false, 'unsupported audit-readiness check type', check);
      }
    } catch (error) {
      push(check.type || '<missing>', false, error.message, check);
    }
  }
  return { checks, blockers };
}

export function genericSidecarChecks(root, changedFiles) {
  const checks = [];
  const blockers = [];
  for (const sidecar of changedFiles.filter(file => file.endsWith('.sha256'))) {
    const text = fs.readFileSync(path.join(root, sidecar), 'utf8');
    const expected = sidecarExpected(text);
    const filename = text.trim().split(/\s+/).slice(1).join(' ').trim();
    const artifact = filename ? path.posix.join(path.posix.dirname(sidecar), path.posix.basename(filename)) : sidecar.replace(/\.sha256$/, '.json');
    const artifactPath = path.join(root, artifact);
    const actual = fs.existsSync(artifactPath) ? sha256Bytes(fs.readFileSync(artifactPath)) : null;
    const ok = expected !== null && actual !== null && expected === actual;
    const detail = `${sidecar} -> ${artifact} expected=${expected ?? '<invalid>'} actual=${actual ?? '<missing>'}`;
    checks.push({ type: 'changed_sidecar', ok, detail });
    if (!ok) blockers.push(`changed_sidecar: ${detail}`);
  }
  return { checks, blockers };
}

export function buildAuditReadinessPacket({ root, taskId, target, branch, head, changedFiles, task, contract }) {
  const blockers = [];
  const laneError = branchIdentityError(task, branch);
  if (laneError) blockers.push(`lane_identity: ${laneError}`);
  if (!task.audit_required) blockers.push('task is not marked audit_required');
  const exact = new Set(task.forbidden_exact_paths || []);
  const prefixes = task.forbidden_path_prefixes || [];
  const allowed = task.allowed_path_prefixes || [];
  const forbidden = changedFiles.filter(file => exact.has(file) || prefixes.some(prefix => file.startsWith(prefix)));
  const outside = allowed.length ? changedFiles.filter(file => !allowed.some(prefix => file.startsWith(prefix))) : [];
  if (!changedFiles.length) blockers.push('no task-branch changes detected');
  if (forbidden.length) blockers.push(`forbidden paths changed: ${forbidden.join(', ')}`);
  if (outside.length) blockers.push(`files outside allowlist: ${outside.join(', ')}`);
  const sidecars = genericSidecarChecks(root, changedFiles);
  blockers.push(...sidecars.blockers);
  let contractResult = { checks: [], blockers: [] };
  if (contract) {
    if (contract.schema_version !== 1) blockers.push(`audit readiness contract schema_version must be 1, got ${contract.schema_version}`);
    if (contract.task_id !== taskId) blockers.push(`audit readiness contract task_id ${contract.task_id} != ${taskId}`);
    contractResult = evaluateContract({ root, contract, target });
    blockers.push(...contractResult.blockers);
  }
  const fileHashes = Object.fromEntries(changedFiles.filter(file => fs.existsSync(path.join(root, file))).map(file => [file, sha256Bytes(readBytes(root, file))]));
  return {
    schema_version: 1,
    task_id: taskId,
    head,
    target,
    assigned_branch: task.branch ?? null,
    branch,
    audit_required: Boolean(task.audit_required),
    audit_readiness_contract: task.audit_readiness_contract ?? null,
    changed_files: changedFiles,
    changed_file_sha256: fileHashes,
    forbidden_files: forbidden,
    outside_allowlist_files: outside,
    checks: [...sidecars.checks, ...contractResult.checks],
    blockers,
    ready_for_manager_freeze: blockers.length === 0,
    note: 'Audit readiness is a mechanical preflight only. Manager exact-head verification and fresh independent Auditor review remain mandatory.'
  };
}

async function main() {
  const options = parseArgs();
  const root = options.root ? path.resolve(options.root) : git(process.cwd(), ['rev-parse', '--show-toplevel']);
  const registry = JSON.parse(fs.readFileSync(path.join(root, '.ai/shared/ACTIVE_TASKS.json'), 'utf8'));
  const detectedBranch = options.branch || git(root, ['branch', '--show-current'], true) || '(detached)';
  let task = null;
  if (options.auto) {
    const selection = selectAutoTask({
      tasks: registry.tasks,
      branch: detectedBranch,
      eventName: options.eventName,
      repository: options.repository,
      headRepository: options.headRepository,
      prNumber: options.prNumber
    });
    task = selection.task;
    if (!task) {
      const output = { schema_version: 1, skipped: true, branch: detectedBranch, reason: selection.reason };
      console.log(options.json ? JSON.stringify(output, null, 2) : `WORKFLOW AUDIT READINESS — SKIP (${output.reason})`);
      return;
    }
  } else {
    task = registry.tasks.find(item => item.task_id === options.task);
  }
  if (!task) throw new Error(`${options.task} is not present in active-only .ai/shared/ACTIVE_TASKS.json`);
  if (!task.audit_required && options.auto) {
    const output = { schema_version: 1, skipped: true, task_id: task.task_id, branch: detectedBranch, reason: 'active task is not audit_required' };
    console.log(options.json ? JSON.stringify(output, null, 2) : `WORKFLOW AUDIT READINESS — SKIP ${task.task_id} (${output.reason})`);
    return;
  }
  if (['BLOCKED', 'PLANNED'].includes(task.status)) {
    if (options.auto) {
      const output = { schema_version: 1, skipped: true, task_id: task.task_id, branch: detectedBranch, reason: `task status ${task.status} is not runnable` };
      console.log(options.json ? JSON.stringify(output, null, 2) : `WORKFLOW AUDIT READINESS — SKIP ${task.task_id} (${output.reason})`);
      return;
    }
    throw new Error(`${task.task_id} is ${task.status} and is not audit-readiness eligible`);
  }
  const target = resolveTarget(root, options.target, registry.canonical_branch || 'main');
  const head = git(root, ['rev-parse', 'HEAD']);
  const branch = detectedBranch;
  const changedFiles = lines(git(root, ['diff', '--name-only', `${target}...HEAD`], true));
  let contract = null;
  if (task.audit_readiness_contract) {
    const contractPath = path.join(root, task.audit_readiness_contract);
    if (!fs.existsSync(contractPath)) throw new Error(`audit readiness contract missing: ${task.audit_readiness_contract}`);
    contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  }
  const packet = buildAuditReadinessPacket({ root, taskId: task.task_id, target, branch, head, changedFiles, task, contract });
  if (options.json) console.log(JSON.stringify(packet, null, 2));
  else {
    console.log(`WORKFLOW AUDIT READINESS — ${packet.task_id}`);
    console.log(`head: ${packet.head}`);
    console.log(`target: ${packet.target}`);
    console.log(`branch: ${packet.branch}`);
    console.log(`changed files: ${packet.changed_files.length}`);
    for (const check of packet.checks) console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.type}: ${check.detail}`);
    for (const blocker of packet.blockers) console.log(`BLOCKER: ${blocker}`);
    console.log(`ready for Manager freeze: ${packet.ready_for_manager_freeze ? 'YES' : 'NO'}`);
    console.log(packet.note);
  }
  process.exitCode = packet.ready_for_manager_freeze ? 0 : 2;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) main().catch(error => { console.error(error.message); process.exitCode = 2; });
