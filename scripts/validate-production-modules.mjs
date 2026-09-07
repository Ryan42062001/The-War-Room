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
const requiredBootstrapModules = ["js/war-room-external-picks.js"];
const bootstrap = 'script.js';
const index = fs.readFileSync('index.html', 'utf8');

for (const file of ordered.concat(requiredBootstrapModules)) {
  if (!fs.existsSync(file)) throw new Error('Missing production module: ' + file);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
  if (lines > 9000) throw new Error(file + ' has regrown to ' + lines + ' lines; split it before adding more logic.');
}

const bootstrapSource = fs.readFileSync(bootstrap, 'utf8');
const bootstrapLines = bootstrapSource.split(/\r?\n/).length;
if (bootstrapLines > 130) throw new Error('script.js must remain a small bootstrap; found ' + bootstrapLines + ' lines.');

const expected = [...ordered, bootstrap];
let cursor = -1;
for (const file of expected) {
  const at = index.indexOf('src="' + file + '?');
  if (at < 0) throw new Error('index.html does not load ' + file);
  if (at <= cursor) throw new Error('Production scripts are not loaded in dependency order at ' + file);
  cursor = at;
}

for (const file of requiredBootstrapModules) {
  if (!bootstrapSource.includes(file)) {
    throw new Error('Required bootstrap production dependency is not loaded: ' + file);
  }
}
if (!bootstrapSource.includes('core initialization blocked')) {
  throw new Error('Required bootstrap dependency failures must fail closed.');
}

const moduleSource = ordered.concat(requiredBootstrapModules).map(file => fs.readFileSync(file, 'utf8')).join('\n');
if (/document\.addEventListener\(\s*['"]DOMContentLoaded['"]\s*,\s*runAppInitialization/.test(moduleSource)) {
  throw new Error('Startup trigger leaked back into a production module; keep it in script.js.');
}
if (!bootstrapSource.includes('runAppInitialization')) {
  throw new Error('Bootstrap no longer invokes runAppInitialization.');
}

console.log('Production module architecture valid:', ordered.length + requiredBootstrapModules.length, 'required modules + bootstrap.');
