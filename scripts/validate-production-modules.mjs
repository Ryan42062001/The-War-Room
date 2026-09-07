import fs from 'node:fs';

const ordered = [
  "js/war-room-ui.js",
  "js/war-room-espn-sync.js",
  "js/war-room-rankings.js",
  "js/war-room-draft-state.js",
  "js/war-room-scoring.js",
  "js/war-room-scoring-canonical.js",
  "js/war-room-recommendations.js",
  "js/war-room-recommendations-canonical.js"
];
const bootstrap = 'script.js';
const index = fs.readFileSync('index.html', 'utf8');

for (const file of ordered) {
  if (!fs.existsSync(file)) throw new Error('Missing production module: ' + file);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
  if (lines > 9000) throw new Error(file + ' has regrown to ' + lines + ' lines; split it before adding more logic.');
}

const bootstrapLines = fs.readFileSync(bootstrap, 'utf8').split(/\r?\n/).length;
if (bootstrapLines > 80) throw new Error('script.js must remain a small bootstrap; found ' + bootstrapLines + ' lines.');

const expected = [...ordered, bootstrap];
let cursor = -1;
for (const file of expected) {
  const at = index.indexOf('src="' + file + '?');
  if (at < 0) throw new Error('index.html does not load ' + file);
  if (at <= cursor) throw new Error('Production scripts are not loaded in dependency order at ' + file);
  cursor = at;
}

const moduleSource = ordered.map(file => fs.readFileSync(file, 'utf8')).join('\n');
if (/document\.addEventListener\(\s*['"]DOMContentLoaded['"]\s*,\s*runAppInitialization/.test(moduleSource)) {
  throw new Error('Startup trigger leaked back into a production module; keep it in script.js.');
}
if (!fs.readFileSync(bootstrap, 'utf8').includes('runAppInitialization')) {
  throw new Error('Bootstrap no longer invokes runAppInitialization.');
}

console.log('Production module architecture valid:', ordered.length, 'modules + bootstrap.');
