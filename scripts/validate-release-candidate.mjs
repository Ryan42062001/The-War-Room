import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const tracked = execFileSync('git', ['ls-files'], {cwd:root, encoding:'utf8'})
  .split(/\r?\n/).filter(Boolean);

assert.equal(tracked.includes('README.txt'), false, 'Obsolete README.txt scaffold must not be tracked.');
assert.equal(tracked.some(file => file === 'node_modules' || file.startsWith('node_modules/')), false, 'node_modules must never be tracked.');
const workflows = tracked.filter(file => file.startsWith('.github/workflows/')).sort();
const approvedWorkflows = [
  '.github/workflows/ci.yml',
  '.github/workflows/wr042-source-custody.yml',
  '.github/workflows/wr046-custody-fixture.yml',
].sort();
assert.deepEqual(
  workflows,
  approvedWorkflows,
  'Only permanent CI and Manager-approved custody workflows should be tracked.',
);

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
for (const relative of tracked) {
  if (!textExtensions.has(path.extname(relative).toLowerCase())) continue;
  const absolute = path.join(root, relative);
  const contents = fs.readFileSync(absolute, 'utf8');
  for (const slug of forbiddenSlugs) {
    assert.equal(contents.includes(slug), false, `Stale repository identity remains in ${relative}.`);
  }
}

console.log(`Release-candidate repository guard valid: ${tracked.length} tracked files, permissions and identity clean.`);
