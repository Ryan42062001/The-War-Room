import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const mode = process.argv[2] || '';
const root = process.cwd();
const marker = path.join(root, '.wr074-run-sentinel');

function fail(message) {
  console.error(`WR-074 FAIL CLOSED: ${message}`);
  process.exit(2);
}

function run(command, args = [], options = {}) {
  const windowsCommandScript = process.platform === 'win32' && (command === 'npm' || command === 'npx');
  const executable = windowsCommandScript ? (process.env.ComSpec || 'cmd.exe') : command;
  const commandArgs = windowsCommandScript
    ? ['/d', '/s', '/c', [`${command}.cmd`, ...args].join(' ')]
    : args;
  const result = spawnSync(executable, commandArgs, {
    cwd: root,
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf8',
    env: process.env,
  });
  if (result.error) fail(`${command} could not start`);
  if (result.status !== 0) fail(`${command} exited ${result.status}`);
  return options.capture ? String(result.stdout || '').trim() : '';
}

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function forbiddenProviderAuthority() {
  const exact = new Set([
    'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN',
    'B2_APPLICATION_KEY_ID', 'B2_APPLICATION_KEY',
  ]);
  return Object.keys(process.env).filter((key) => key.startsWith('WR_CUSTODY_') || exact.has(key));
}

function assertAuthorityAbsent() {
  const found = forbiddenProviderAuthority();
  if (found.length) fail(`provider/custody authority environment present (${found.length} blocked variable name(s))`);
}

function cleanWorkspace() {
  git(['reset', '--hard', 'HEAD']);
  git(['checkout-index', '--all', '--force']);
  git(['clean', '-ffdx']);
  const status = git(['status', '--porcelain']);
  if (status) fail('workspace is not clean after reset/checkout-index/clean');
}

function writeSummary(title, value) {
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (!summary) return;
  fs.appendFileSync(summary, `### ${title}\n\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n`);
}

function timed(label, fn) {
  const started = process.hrtime.bigint();
  fn();
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  return [label, Math.round(elapsedMs)];
}

if (mode === 'preflight') {
  assertAuthorityAbsent();
  const workspaceEnv = process.env.GITHUB_WORKSPACE;
  if (workspaceEnv && path.resolve(workspaceEnv) !== path.resolve(root)) fail('current directory is not the assigned GitHub workspace');
  git(['config', 'core.autocrlf', 'false']);
  git(['config', 'core.eol', 'lf']);
  cleanWorkspace();
  const browserTestSource = fs.readFileSync(path.join(root, 'scripts', 'test-browser.mjs'), 'utf8');
  const residue = {
    node_modules_present_after_clean: fs.existsSync(path.join(root, 'node_modules')),
    artifacts_present_after_clean: fs.existsSync(path.join(root, 'artifacts')),
    sentinel_present_after_clean: fs.existsSync(marker),
    git_status_clean: git(['status', '--porcelain']) === '',
    browser_test_crlf_present: browserTestSource.includes('\r\n'),
    core_autocrlf: git(['config', '--get', 'core.autocrlf']),
    core_eol: git(['config', '--get', 'core.eol']),
    provider_authority_present: false,
  };
  console.log(JSON.stringify({ wr074_workspace_preflight_evidence: residue }));
  if (residue.node_modules_present_after_clean || residue.artifacts_present_after_clean || residue.sentinel_present_after_clean || !residue.git_status_clean || residue.browser_test_crlf_present) {
    fail('persistent workspace residue or non-canonical line endings survived bounded cleanup');
  }
  fs.writeFileSync(marker, 'WR-074 ephemeral workspace sentinel\n', 'utf8');
  console.log(JSON.stringify({ wr074_workspace_preflight: 'PASS', ...residue }));
  writeSummary('WR-074 workspace preflight', { result: 'PASS', ...residue });
} else if (mode === 'environment') {
  assertAuthorityAbsent();
  const runnerName = String(process.env.RUNNER_NAME || '');
  const evidence = {
    runner_os: process.env.RUNNER_OS || os.platform(),
    runner_arch: process.env.RUNNER_ARCH || os.arch(),
    os_platform: os.platform(),
    os_release: os.release(),
    architecture: os.arch(),
    runner_name_sha256: runnerName ? crypto.createHash('sha256').update(runnerName).digest('hex') : null,
    git_version: run('git', ['--version'], { capture: true }),
    node_version: process.version,
    npm_version: run('npm', ['--version'], { capture: true }),
    playwright_version: run('npx', ['playwright', '--version'], { capture: true }),
    provider_authority_present: false,
    precise_workspace_path_published: false,
  };
  console.log(JSON.stringify({ wr074_environment: evidence }));
  writeSummary('WR-074 sanitized environment', evidence);
} else if (mode === 'stress') {
  assertAuthorityAbsent();
  const timings = [];
  timings.push(timed('browser_10x_ms', () => {
    for (let i = 1; i <= 10; i += 1) {
      console.log(`Persistence recovery iteration ${i}/10`);
      run('npm', ['run', 'test:browser']);
    }
  }));
  timings.push(timed('determinism_5x_ms', () => {
    for (let i = 1; i <= 5; i += 1) {
      console.log(`Determinism iteration ${i}/5: persistence lifecycle`);
      run('npm', ['run', 'test:browser']);
      console.log(`Determinism iteration ${i}/5: command-bar lifecycle`);
      run('npm', ['run', 'test:command-bar']);
      run('npm', ['run', 'test:layout-efficiency-behavior']);
      run('npm', ['run', 'test:wr026-audit-remediation']);
    }
  }));
  const evidence = Object.fromEntries(timings);
  evidence.total_stress_ms = evidence.browser_10x_ms + evidence.determinism_5x_ms;
  console.log(JSON.stringify({ wr074_stress_benchmark: evidence }));
  writeSummary('WR-074 heavy stress benchmark', evidence);
} else if (mode === 'resilience') {
  assertAuthorityAbsent();
  const [, elapsed] = timed('resilience_3x_ms', () => {
    for (let i = 1; i <= 3; i += 1) {
      console.log(`Resilience lifecycle iteration ${i}/3`);
      run('node', ['scripts/test-resilience.mjs']);
    }
  });
  console.log(JSON.stringify({ wr074_resilience_benchmark: { resilience_3x_ms: elapsed } }));
  writeSummary('WR-074 resilience benchmark', { resilience_3x_ms: elapsed });
} else if (mode === 'cleanup') {
  assertAuthorityAbsent();
  cleanWorkspace();
  const evidence = {
    result: 'PASS',
    git_status_clean: git(['status', '--porcelain']) === '',
    node_modules_removed: !fs.existsSync(path.join(root, 'node_modules')),
    artifacts_removed: !fs.existsSync(path.join(root, 'artifacts')),
    sentinel_removed: !fs.existsSync(marker),
    provider_authority_present: false,
  };
  if (!evidence.git_status_clean || !evidence.node_modules_removed || !evidence.artifacts_removed || !evidence.sentinel_removed) {
    fail('post-run cleanup left bounded workspace residue');
  }
  console.log(JSON.stringify({ wr074_cleanup: evidence }));
  writeSummary('WR-074 post-run cleanup', evidence);
} else {
  fail('unknown mode');
}
