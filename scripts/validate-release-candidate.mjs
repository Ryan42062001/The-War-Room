import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const tracked = execFileSync('git', ['ls-files'], {cwd:root, encoding:'utf8'})
  .split(/\r?\n/).filter(Boolean);
const activeTracked = tracked.filter(file => !file.startsWith('.history/'));

assert.equal(tracked.includes('README.txt'), false, 'Obsolete README.txt scaffold must not be tracked.');
assert.equal(tracked.some(file => file === 'node_modules' || file.startsWith('node_modules/')), false, 'node_modules must never be tracked.');
const workflows = activeTracked.filter(file => file.startsWith('.github/workflows/')).sort();
const approvedWorkflows = [
  '.github/workflows/ci.yml',
  '.github/workflows/deploy-pages.yml',
].sort();
assert.deepEqual(
  workflows,
  approvedWorkflows,
  'Only the canonical Speed Workflow V2.1 CI and explicit production deployment workflows should be tracked.',
);

const productionWorkflowPath = path.join(root, '.github/workflows/deploy-pages.yml');
const productionWorkflow = fs.readFileSync(productionWorkflowPath, 'utf8').replace(/\r\n/g, '\n');
const workflowDispatch = productionWorkflow.match(/^on:\n([\s\S]*?)(?=^[a-z])/m)?.[1] ?? '';
assert.match(workflowDispatch, /^  workflow_dispatch:\s*$/m, 'Production deployment must retain workflow_dispatch.');
assert.deepEqual(
  [...workflowDispatch.matchAll(/^  ([a-z][a-z0-9_-]*):/gm)].map(match => match[1]),
  ['workflow_dispatch'],
  'Production deployment must expose only the manual workflow_dispatch trigger.',
);
assert.doesNotMatch(
  workflowDispatch,
  /^  (push|pull_request|schedule|workflow_run|repository_dispatch|release|deployment|page_build):/m,
  'Production deployment must remain manual-only without an automatic publication trigger.',
);
assert.match(workflowDispatch, /^      confirm:\s*$/m, 'Production deployment must retain the explicit confirmation input.');
assert.match(workflowDispatch, /^        required: true\s*$/m, 'Production deployment confirmation must remain required.');

const jobsSection = productionWorkflow.slice(productionWorkflow.indexOf('\njobs:\n') + '\njobs:\n'.length);
const jobEntries = [...jobsSection.matchAll(/^  ([a-z][a-z0-9-]*):\n/gm)];
const jobNames = jobEntries.map(match => match[1]);
const jobBlock = name => {
  const start = jobsSection.search(new RegExp(`^  ${name}:\\n`, 'm'));
  assert.notEqual(start, -1, `Production workflow must retain the ${name} job.`);
  const remainder = jobsSection.slice(start + 1);
  const next = remainder.search(/^  [a-z][a-z0-9-]*:\n/m);
  return jobsSection.slice(start, next === -1 ? undefined : start + 1 + next);
};
const validateJob = jobBlock('validate');
const deployJob = jobBlock('deploy');
const verifyJob = jobBlock('verify-production');

const topLevelPermissions = productionWorkflow.match(/^permissions:\n([\s\S]*?)(?=^[a-z])/m)?.[1] ?? '';
assert.match(topLevelPermissions, /^  contents: read\s*$/m, 'Production workflow default permissions must be read-only.');
assert.doesNotMatch(topLevelPermissions, /:\s*write\s*$/m, 'Production workflow must not grant top-level write permissions.');
const jobPermissions = block => (block.match(/^    permissions:\n((?:^      [a-z-]+: (?:read|write)\s*$\n?)+)/m)?.[1] ?? '')
  .trim().split('\n').map(line => line.trim()).filter(Boolean);
assert.deepEqual(jobPermissions(deployJob), ['contents: read', 'pages: write', 'id-token: write'], 'Only deploy may receive Pages and OIDC write permissions.');
for (const name of jobNames.filter(name => name !== 'deploy')) {
  const block = jobBlock(name);
  assert.doesNotMatch(block, /^      [a-z-]+: write\s*$/m, `${name} must remain read-only.`);
}
assert.deepEqual(jobPermissions(validateJob), ['contents: read'], 'Validation must explicitly remain read-only.');
assert.deepEqual(jobPermissions(verifyJob), ['contents: read'], 'Production verification must explicitly remain read-only.');

for (const name of jobNames) {
  assert.match(jobBlock(name), /^    if: inputs\.confirm == 'DEPLOY'\s*$/m, `${name} must require exact DEPLOY confirmation.`);
}
assert.match(validateJob, /^          ref: main\s*$/m, 'Validation must check out canonical main.');
assert.match(validateJob, /echo "value=\$\(git rev-parse HEAD\)" >> "\$GITHUB_OUTPUT"/, 'Validation must record the exact canonical main SHA.');
assert.match(deployJob, /^    needs: validate\s*$/m, 'Deployment must depend on successful canonical-main validation.');
assert.match(verifyJob, /^    needs: \[validate, deploy\]\s*$/m, 'Production verification must depend on validation and deployment.');
for (const [name, block] of [['deploy', deployJob], ['verify-production', verifyJob]]) {
  assert.match(block, /^          ref: \$\{\{ needs\.validate\.outputs\.main_sha \}\}\s*$/m, `${name} must use the recorded validated main SHA.`);
}

const expectedActions = new Map([
  ['actions/checkout', '3d3c42e5aac5ba805825da76410c181273ba90b1'],
  ['actions/setup-node', '820762786026740c76f36085b0efc47a31fe5020'],
  ['actions/configure-pages', '45bfe0192ca1faeb007ade9deae92b16b8254a0d'],
  ['actions/upload-pages-artifact', 'fc324d3547104276b827a68afc52ff2a11cc49c9'],
  ['actions/deploy-pages', '368f82528645a54fb793d4d04e342629a3f51346'],
]);
const actionReferences = [...productionWorkflow.matchAll(/^\s+(?:- )?uses:\s+([^\s#]+)/gm)].map(match => match[1]);
assert.ok(actionReferences.length > 0, 'Production workflow must retain action references.');
for (const reference of actionReferences) {
  assert.match(reference, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@[a-f0-9]{40}$/, `Action reference must use an immutable full commit SHA: ${reference}`);
  const [action, sha] = reference.split('@');
  assert.equal(sha, expectedActions.get(action), `Unexpected production action pin for ${action}.`);
}
for (const [action, sha] of expectedActions) {
  assert.ok(actionReferences.includes(`${action}@${sha}`), `Required pinned action is missing: ${action}@${sha}`);
}

const checkoutSteps = [...productionWorkflow.matchAll(/^      - uses: actions\/checkout@[a-f0-9]{40}[^\n]*\n([\s\S]*?)(?=^      - |^  [a-z]|\Z)/gm)];
assert.equal(checkoutSteps.length, 3, 'Production workflow must retain exactly three hardened checkout steps.');
for (const checkout of checkoutSteps) {
  assert.match(checkout[1], /^          persist-credentials: false\s*$/m, 'Production checkout credentials must not persist.');
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const packageLock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
assert.equal(packageJson.name, 'the-war-room');
assert.equal(packageLock.name, 'the-war-room');
assert.equal(packageLock.packages?.['']?.name, 'the-war-room');

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extensions/espn-companion/manifest.json'), 'utf8'));
assert.deepEqual([...manifest.permissions].sort(), ['scripting', 'storage']);
assert.deepEqual([...manifest.host_permissions].sort(), [
  'http://127.0.0.1/*',
  'http://localhost/*',
  'https://fantasy.espn.com/*',
  'https://lm-api-reads.fantasy.espn.com/*',
  'https://ryan42062001.github.io/The-War-Room/*',
  'https://www.espn.com/fantasy/*'
].sort());

const websiteSync = fs.readFileSync(path.join(root, 'js/war-room-espn-sync.js'), 'utf8');
const minVersion = websiteSync.match(/ESPN_COMPANION_MIN_VERSION\s*=\s*'([^']+)'/i)?.[1];
assert.equal(minVersion, manifest.version, 'Website and packaged companion versions must match.');

const forbiddenSlugs = ['Fantasy-Draft-' + 'Cheat-Sheet-2026', 'fantasy-draft-' + 'cheat-sheet-2026'];
const textExtensions = new Set(['.js','.mjs','.cjs','.json','.md','.html','.css','.yml','.yaml','.txt']);
for (const relative of activeTracked) {
  if (!textExtensions.has(path.extname(relative).toLowerCase())) continue;
  const absolute = path.join(root, relative);
  const contents = fs.readFileSync(absolute, 'utf8');
  for (const slug of forbiddenSlugs) {
    assert.equal(contents.includes(slug), false, `Stale repository identity remains in ${relative}.`);
  }
}

console.log(`Release-candidate repository guard valid: ${activeTracked.length} active tracked files (${tracked.length - activeTracked.length} archived history files excluded), permissions and identity clean.`);
