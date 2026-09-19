import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
const ZERO = /^0{40}$/;

export function classifyScope({ event, force = false, base = '', head = '', changed = [], priorSuccessfulRun = null, diffFailed = null }) {
  if (event === 'push' && ZERO.test(base || '') && head) {
    if (priorSuccessfulRun && priorSuccessfulRun.head_sha === head && priorSuccessfulRun.conclusion === 'success') {
      return { event, base, head, changed: [], force_full_ci: force, scope: 'BOOTSTRAP_REUSE',
        reason: 'branch-bootstrap-reuses-successful-governance', full_ci: false, skip_governance: true,
        reused_run_id: String(priorSuccessfulRun.id) };
    }
    return { event, base, head, changed: [], force_full_ci: force, scope: 'FULL',
      reason: diffFailed ? `bootstrap-lookup-failed:${diffFailed}` : 'branch-bootstrap-no-reusable-governance',
      full_ci: true, skip_governance: false, reused_run_id: '' };
  }
  if (!base || !head) return { event, base, head, changed: [], force_full_ci: force, scope: 'FULL', reason: 'missing-or-zero-base', full_ci: true, skip_governance: false, reused_run_id: '' };
  if (diffFailed) return { event, base, head, changed: [], force_full_ci: force, scope: 'FULL', reason: `diff-failed:${diffFailed}`, full_ci: true, skip_governance: false, reused_run_id: '' };
  const governanceOnly = changed.length > 0 && changed.every(file => file.startsWith('.ai/'));
  const full = force || !governanceOnly;
  return { event, base, head, changed, force_full_ci: force, scope: full ? 'FULL' : 'GOVERNANCE_ONLY',
    reason: force ? 'force-full-ci' : governanceOnly ? 'ai-only-governance' : 'non-ai-change',
    full_ci: full, skip_governance: false, reused_run_id: '' };
}

async function findPriorSuccessfulRun(repository, head, currentRunId, token) {
  if (!repository || !head) return null;
  const url = new URL(`https://api.github.com/repos/${repository}/actions/runs`);
  url.searchParams.set('head_sha', head); url.searchParams.set('status', 'completed'); url.searchParams.set('per_page', '50');
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`GitHub Actions lookup HTTP ${response.status}`);
  const payload = await response.json();
  return (payload.workflow_runs || []).find(run => String(run.id) !== String(currentRunId || '') &&
    run.name === 'War Room CI' && run.head_sha === head && run.conclusion === 'success') || null;
}

async function main() {
  const event = process.env.EVENT_NAME || '';
  const force = String(process.env.FORCE_FULL_CI || '').toLowerCase() === 'true';
  let base = '', head = '';
  if (event === 'pull_request') { base = process.env.PR_BASE_SHA || ''; head = process.env.PR_HEAD_SHA || ''; }
  else if (event === 'push') { base = process.env.PUSH_BEFORE || ''; head = process.env.PUSH_HEAD || ''; }
  let changed = [], diffFailed = null, priorSuccessfulRun = null;
  if (event === 'push' && ZERO.test(base || '') && head) {
    try { priorSuccessfulRun = await findPriorSuccessfulRun(process.env.REPOSITORY || '', head, process.env.CURRENT_RUN_ID || '', process.env.GITHUB_TOKEN || ''); }
    catch (error) { diffFailed = error.message; }
  } else if (base && head && !ZERO.test(base)) {
    try { changed = git(['diff', '--name-only', base, head]).split(/\r?\n/).map(v => v.trim()).filter(Boolean); }
    catch (error) { diffFailed = error.message; }
  }
  const decision = classifyScope({ event, force, base, head, changed, priorSuccessfulRun, diffFailed });
  console.log(JSON.stringify(decision, null, 2));
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `full_ci=${decision.full_ci ? 'true' : 'false'}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `scope=${decision.scope}\nreason=${decision.reason}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `skip_governance=${decision.skip_governance ? 'true' : 'false'}\nreused_run_id=${decision.reused_run_id || ''}\n`);
  }
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch(error => { console.error(error.stack || error.message); process.exitCode = 2; });
