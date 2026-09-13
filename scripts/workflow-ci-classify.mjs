import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

const event = process.env.EVENT_NAME || '';
const force = String(process.env.FORCE_FULL_CI || '').toLowerCase() === 'true';
let base = '';
let head = '';

if (event === 'pull_request') {
  base = process.env.PR_BASE_SHA || '';
  head = process.env.PR_HEAD_SHA || '';
} else if (event === 'push') {
  base = process.env.PUSH_BEFORE || '';
  head = process.env.PUSH_HEAD || '';
}

const zero = /^0{40}$/;
let changed = [];
let reason = '';
let full = true;

if (!base || !head || zero.test(base)) {
  reason = 'missing-or-zero-base';
  full = true;
} else {
  try {
    changed = git(['diff', '--name-only', base, head]).split(/\r?\n/).map(v => v.trim()).filter(Boolean);
    const governanceOnly = changed.length > 0 && changed.every(file => file.startsWith('.ai/'));
    full = force || !governanceOnly;
    reason = force ? 'force-full-ci' : governanceOnly ? 'ai-only-governance' : 'non-ai-change';
  } catch (error) {
    reason = `diff-failed:${error.message}`;
    full = true;
  }
}

const scope = full ? 'FULL' : 'GOVERNANCE_ONLY';
console.log(JSON.stringify({ event, base, head, changed, force_full_ci: force, scope, reason }, null, 2));

const output = process.env.GITHUB_OUTPUT;
if (output) {
  fs.appendFileSync(output, `full_ci=${full ? 'true' : 'false'}\n`);
  fs.appendFileSync(output, `scope=${scope}\n`);
  fs.appendFileSync(output, `reason=${reason}\n`);
}
