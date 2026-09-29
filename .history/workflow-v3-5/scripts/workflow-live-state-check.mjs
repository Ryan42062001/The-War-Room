import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const registry = JSON.parse(fs.readFileSync('.ai/shared/ACTIVE_TASKS.json', 'utf8'));
const raw = process.argv.slice(2);
let repo = process.env.GITHUB_REPOSITORY || '';
let onlyTask = null;
let json = false;
for (let i = 0; i < raw.length; i += 1) {
  if (raw[i] === '--repo') repo = raw[++i];
  else if (raw[i] === '--task') onlyTask = raw[++i];
  else if (raw[i] === '--json') json = true;
}
if (!repo) {
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
    const match = remote.match(/github\.com[/:]([^/]+\/[^/.]+)(?:\.git)?$/);
    if (match) repo = match[1];
  } catch {}
}
if (!/^[^/]+\/[^/]+$/.test(repo)) throw new Error('Unable to determine GitHub repository; pass --repo owner/name');

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const cache = new Map();
async function gh(path) {
  if (cache.has(path)) return cache.get(path);
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'war-room-workflow-live-state-check' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`https://api.github.com${path}`, { headers });
  } catch (error) {
    const value = { unavailable: true, message: error.message };
    cache.set(path, value);
    return value;
  }
  if (response.status === 404) {
    const value = { missing: true, status: 404 };
    cache.set(path, value);
    return value;
  }
  if (!response.ok) {
    const value = { unavailable: true, status: response.status, message: await response.text() };
    cache.set(path, value);
    return value;
  }
  const value = await response.json();
  cache.set(path, value);
  return value;
}

const errors = [];
const warnings = [];
const snapshots = [];
const tasks = (registry.tasks || []).filter(task => !onlyTask || task.task_id === onlyTask);
if (onlyTask && tasks.length === 0) throw new Error(`${onlyTask} is not active`);

for (const task of tasks) {
  const snapshot = { task_id: task.task_id, status: task.status };
  let branchData = null;
  if (task.branch) {
    branchData = await gh(`/repos/${repo}/branches/${encodeURIComponent(task.branch)}`);
    if (branchData.unavailable) warnings.push(`${task.task_id}: branch lookup unavailable (${branchData.status || branchData.message})`);
    else if (branchData.missing) errors.push(`${task.task_id}: recorded branch does not exist: ${task.branch}`);
    else {
      snapshot.branch = task.branch;
      snapshot.branch_sha = branchData.commit?.sha || null;
      if (task.worker_checkpoint_sha && snapshot.branch_sha !== task.worker_checkpoint_sha) {
        errors.push(`${task.task_id}: worker_checkpoint_sha ${task.worker_checkpoint_sha} != live branch ${snapshot.branch_sha}`);
      }
    }
  }

  if (task.pr != null) {
    const pr = await gh(`/repos/${repo}/pulls/${task.pr}`);
    if (pr.unavailable) warnings.push(`${task.task_id}: PR #${task.pr} lookup unavailable (${pr.status || pr.message})`);
    else if (pr.missing) errors.push(`${task.task_id}: recorded PR #${task.pr} does not exist`);
    else {
      snapshot.pr = task.pr;
      snapshot.pr_state = pr.state;
      snapshot.pr_merged = Boolean(pr.merged_at);
      snapshot.pr_head_sha = pr.head?.sha || null;
      snapshot.pr_head_ref = pr.head?.ref || null;
      if (task.status === 'MERGED' && !snapshot.pr_merged) errors.push(`${task.task_id}: status MERGED but PR #${task.pr} is not merged`);
      if (task.status !== 'MERGED' && pr.state !== 'open') errors.push(`${task.task_id}: active status ${task.status} points to non-open PR #${task.pr}`);
      if (task.branch && snapshot.pr_head_ref && snapshot.pr_head_ref !== task.branch) errors.push(`${task.task_id}: PR #${task.pr} head ${snapshot.pr_head_ref} != recorded branch ${task.branch}`);
      if (task.worker_checkpoint_sha && snapshot.pr_head_sha !== task.worker_checkpoint_sha) errors.push(`${task.task_id}: worker_checkpoint_sha ${task.worker_checkpoint_sha} != PR #${task.pr} head ${snapshot.pr_head_sha}`);
    }
  }

  if (task.owner === 'Auditor' && task.audit_target_pr) {
    const target = await gh(`/repos/${repo}/pulls/${task.audit_target_pr}`);
    if (target.unavailable) warnings.push(`${task.task_id}: audit target PR #${task.audit_target_pr} lookup unavailable (${target.status || target.message})`);
    else if (target.missing) errors.push(`${task.task_id}: audit target PR #${task.audit_target_pr} does not exist`);
    else {
      snapshot.audit_target_pr = task.audit_target_pr;
      snapshot.audit_target_live_sha = target.head?.sha || null;
      snapshot.audit_target_live_branch = target.head?.ref || null;
      if (task.audit_target_branch && snapshot.audit_target_live_branch !== task.audit_target_branch) {
        errors.push(`${task.task_id}: audit target branch ${task.audit_target_branch} != live PR head ${snapshot.audit_target_live_branch}`);
      }
      if (task.audit_target_sha && snapshot.audit_target_live_sha !== task.audit_target_sha) {
        errors.push(`${task.task_id}: audit_target_sha ${task.audit_target_sha} != live PR head ${snapshot.audit_target_live_sha}`);
      }
      if (!task.audit_target_sha) warnings.push(`${task.task_id}: pin exact audit target to live SHA ${snapshot.audit_target_live_sha} before audit execution`);
    }
  }
  snapshots.push(snapshot);
}

const unavailable = warnings.some(item => item.includes('lookup unavailable'));
const result = { repository: repo, tasks: snapshots, errors, warnings, ok: errors.length === 0 && !unavailable, unavailable };
if (json) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`WORKFLOW LIVE STATE — ${repo}`);
  for (const item of snapshots) console.log(`${item.task_id}: ${JSON.stringify(item)}`);
  errors.forEach(item => console.log(`ERROR: ${item}`));
  warnings.forEach(item => console.log(`WARNING: ${item}`));
  console.log(errors.length ? 'LIVE STATE: FAIL' : unavailable ? 'LIVE STATE: UNAVAILABLE' : 'LIVE STATE: PASS');
}
process.exitCode = errors.length ? 2 : unavailable ? 3 : 0;
