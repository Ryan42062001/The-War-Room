import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const scriptPath = path.join(root, 'script.js');
const source = fs.readFileSync(scriptPath, 'utf8');

if (source.split(/\r?\n/).length < 20000) {
  throw new Error('Refusing to split script.js: expected the pre-refactor monolith.');
}

const markers = {
  espn: "var ESPN_SYNC_CHANNEL = 'the-war-room:espn-sync:v1';",
  rankings: "var FANTASYPROS_LOCAL_OVERRIDE_KEY = 'warRoomFantasyProsTop20OverrideV1';",
  draftState: 'function getDraftAssistantState() {',
  scoring: "var VORP_POSITIONS = ['QB', 'RB', 'WR', 'TE'];",
  recommendations: 'function calculateDraftRecommendation('
};

function markerIndex(marker, label) {
  const first = source.indexOf(marker);
  if (first < 0) throw new Error(`Missing ${label} split marker: ${marker}`);
  if (source.indexOf(marker, first + marker.length) >= 0) {
    throw new Error(`Split marker is not unique for ${label}: ${marker}`);
  }
  return first;
}

function sectionStart(marker, label) {
  const index = markerIndex(marker, label);
  const banner = source.lastIndexOf('/* =========================================================', index);
  if (banner < 0 || index - banner > 1200) return index;
  return banner;
}

const espnStart = sectionStart(markers.espn, 'ESPN sync');
const rankingsStart = sectionStart(markers.rankings, 'FantasyPros rankings');
const draftStateStart = sectionStart(markers.draftState, 'draft state');
const scoringStart = sectionStart(markers.scoring, 'scoring');
const recommendationsStart = markerIndex(markers.recommendations, 'recommendations');

const boundaries = [espnStart, rankingsStart, draftStateStart, scoringStart, recommendationsStart];
for (let i = 1; i < boundaries.length; i += 1) {
  if (boundaries[i] <= boundaries[i - 1]) {
    throw new Error(`Unsafe module ordering at boundary ${i}: ${boundaries.join(', ')}`);
  }
}

const startupAnchor = 'function runAppInitialization() {';
const startupFunctionIndex = markerIndex(startupAnchor, 'startup function');
const startupStart = source.indexOf("if (document.readyState === 'loading') {", startupFunctionIndex);
if (startupStart < 0 || startupStart >= draftStateStart) {
  throw new Error('Could not locate the deferred startup trigger before the draft-state section.');
}
const startupEnd = source.indexOf('/* =========================================================', startupStart);
if (startupEnd < 0 || startupEnd > draftStateStart + 100) {
  throw new Error('Could not locate the end of the startup trigger safely.');
}
const startupBlock = source.slice(startupStart, startupEnd).trimEnd();
if (!startupBlock.includes('DOMContentLoaded') || !startupBlock.includes('runAppInitialization')) {
  throw new Error('Startup trigger did not match the expected initialization contract.');
}

const deferredNote = '// Startup trigger intentionally deferred to script.js after all production modules load.\n\n';
const withoutStartup = source.slice(0, startupStart) + deferredNote + source.slice(startupEnd);
const removedLength = startupEnd - startupStart - deferredNote.length;

function adjusted(index) {
  return index > startupStart ? index - removedLength : index;
}

const adjustedBoundaries = boundaries.map(adjusted);
const [aEspn, aRankings, aDraftState, aScoring, aRecommendations] = adjustedBoundaries;

const modules = [
  ['js/war-room-ui.js', withoutStartup.slice(0, aEspn)],
  ['js/war-room-espn-sync.js', withoutStartup.slice(aEspn, aRankings)],
  ['js/war-room-rankings.js', withoutStartup.slice(aRankings, aDraftState)],
  ['js/war-room-draft-state.js', withoutStartup.slice(aDraftState, aScoring)],
  ['js/war-room-scoring.js', withoutStartup.slice(aScoring, aRecommendations)],
  ['js/war-room-recommendations.js', withoutStartup.slice(aRecommendations)]
];

const reconstructed = modules.map(([, content]) => content).join('');
if (reconstructed !== withoutStartup) {
  throw new Error('Module reconstruction differs from the source after startup deferral.');
}

for (const [file, content] of modules) {
  if (!content.trim()) throw new Error(`Generated empty module: ${file}`);
  const lineCount = content.split(/\r?\n/).length;
  if (lineCount > 9000) throw new Error(`Generated module is still too large (${lineCount} lines): ${file}`);
  const fullPath = path.join(root, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.replace(/\s+$/, '') + '\n');
}

const bootstrap = `/**\n * The War Room production bootstrap.\n *\n * Production logic lives in ordered classic scripts under js/. Keeping this\n * final trigger separate ensures all function declarations are available before\n * initialization, preserving the original monolith's hoisting behavior.\n */\n\n${startupBlock}\n`;
fs.writeFileSync(scriptPath, bootstrap);

const indexPath = path.join(root, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
const oldScriptTag = /<script src="script\.js\?v=[^"]+"><\/script>/;
if (!oldScriptTag.test(indexHtml)) throw new Error('Could not find the production script tag in index.html.');
const version = '20260906-1';
const moduleTags = [
  'js/war-room-ui.js',
  'js/war-room-espn-sync.js',
  'js/war-room-rankings.js',
  'js/war-room-draft-state.js',
  'js/war-room-scoring.js',
  'js/war-room-recommendations.js',
  'script.js'
].map(file => `<script src="${file}?v=${version}"></script>`).join('\n');
indexHtml = indexHtml.replace(oldScriptTag, moduleTags);
fs.writeFileSync(indexPath, indexHtml);

const packagePath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const syntaxFiles = [
  'script.js',
  'js/war-room-ui.js',
  'js/war-room-espn-sync.js',
  'js/war-room-rankings.js',
  'js/war-room-draft-state.js',
  'js/war-room-scoring.js',
  'js/war-room-recommendations.js',
  'developer-tools.js',
  'fantasypros-2026-data.js',
  'war-room-config.js'
];
pkg.scripts['test:modules'] = 'node scripts/validate-production-modules.mjs';
pkg.scripts['test:syntax'] = syntaxFiles.map(file => `node --check ${file}`).join(' && ');
pkg.scripts.test = 'npm run test:modules && npm run test:syntax && npm run test:dataset && npm run test:extension && npm run test:browser && npm run test:live-mock-fixtures';
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');

const validator = `import fs from 'node:fs';\n\nconst ordered = ${JSON.stringify(modules.map(([file]) => file), null, 2)};\nconst bootstrap = 'script.js';\nconst index = fs.readFileSync('index.html', 'utf8');\n\nfor (const file of ordered) {\n  if (!fs.existsSync(file)) throw new Error('Missing production module: ' + file);\n  const lines = fs.readFileSync(file, 'utf8').split(/\\r?\\n/).length;\n  if (lines > 9000) throw new Error(file + ' has regrown to ' + lines + ' lines; split it before adding more logic.');\n}\n\nconst bootstrapLines = fs.readFileSync(bootstrap, 'utf8').split(/\\r?\\n/).length;\nif (bootstrapLines > 80) throw new Error('script.js must remain a small bootstrap; found ' + bootstrapLines + ' lines.');\n\nconst expected = [...ordered, bootstrap];\nlet cursor = -1;\nfor (const file of expected) {\n  const at = index.indexOf('src="' + file + '?');\n  if (at < 0) throw new Error('index.html does not load ' + file);\n  if (at <= cursor) throw new Error('Production scripts are not loaded in dependency order at ' + file);\n  cursor = at;\n}\n\nconst moduleSource = ordered.map(file => fs.readFileSync(file, 'utf8')).join('\\n');\nif (/document\\.addEventListener\\(\\s*['\"]DOMContentLoaded['\"]\\s*,\\s*runAppInitialization/.test(moduleSource)) {\n  throw new Error('Startup trigger leaked back into a production module; keep it in script.js.');\n}\nif (!fs.readFileSync(bootstrap, 'utf8').includes('runAppInitialization')) {\n  throw new Error('Bootstrap no longer invokes runAppInitialization.');\n}\n\nconsole.log('Production module architecture valid:', ordered.length, 'modules + bootstrap.');\n`;
fs.writeFileSync(path.join(root, 'scripts/validate-production-modules.mjs'), validator);

const readmePath = path.join(root, 'README.md');
let readme = fs.readFileSync(readmePath, 'utf8');
readme = readme.replace(
  'script.js                         Board, state, scoring, and recommendation logic',
  'js/                               Production UI, sync, ranking, state, scoring, and recommendation modules\nscript.js                         Small production bootstrap loaded after js/ modules'
);
fs.writeFileSync(readmePath, readme);

const agentsPath = path.join(root, 'AGENTS.md');
let agents = fs.readFileSync(agentsPath, 'utf8');
agents = agents.replace(
  '- `index.html` contains the UI and eight tier containers, but no static player rows; `script.js` constructs the authoritative board before `loadState()`.\n- `script.js` contains production board, persistence, recommendation, and live-state logic.\n- `developer-tools.js` contains regression tests and draft simulations and is loaded on demand from the console; developer controls are intentionally hidden from the draft-day UI.',
  '- `index.html` contains the UI and eight tier containers, but no static player rows; ordered classic scripts under `js/` construct the authoritative board before `loadState()`.\n- `js/war-room-ui.js`, `js/war-room-espn-sync.js`, `js/war-room-rankings.js`, `js/war-room-draft-state.js`, `js/war-room-scoring.js`, and `js/war-room-recommendations.js` contain production logic in dependency order.\n- `script.js` is intentionally a tiny final bootstrap so initialization runs only after every production module has loaded.\n- `scripts/validate-production-modules.mjs` protects module order, module-size limits, and the bootstrap boundary in CI.\n- `developer-tools.js` contains regression tests and draft simulations and is loaded on demand from the console; developer controls are intentionally hidden from the draft-day UI.'
);
fs.writeFileSync(agentsPath, agents);

const ciPath = path.join(root, '.github/workflows/ci.yml');
let ci = fs.readFileSync(ciPath, 'utf8');
ci = ci.replace('- run: npm install', '- run: npm ci');
fs.writeFileSync(ciPath, ci);

console.log('Split script.js into ordered production modules:');
for (const [file, content] of modules) {
  console.log(`- ${file}: ${content.split(/\r?\n/).length} lines`);
}
console.log(`- script.js: ${bootstrap.split(/\r?\n/).length} lines (bootstrap)`);
