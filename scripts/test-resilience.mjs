import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const {chromium} = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const bootstrapSource = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const resilienceSource = fs.readFileSync(path.join(root, 'js/war-room-resilience.js'), 'utf8');
const serviceWorkerSource = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

const bootstrapVersion = bootstrapSource.match(/WAR_ROOM_BOOTSTRAP_VERSION\s*=\s*'([^']+)'/)?.[1];
assert.ok(bootstrapVersion, 'bootstrap version is required');
assert.ok(indexSource.includes(`script.js?v=${bootstrapVersion}`), 'index bootstrap query must match WAR_ROOM_BOOTSTRAP_VERSION');
assert.match(bootstrapSource, /js\/war-room-resilience\.js\?v=/);
assert.match(resilienceSource, /the-war-room-backup/);
assert.match(resilienceSource, /replaceWarRoomStorage/);
assert.match(resilienceSource, /navigator\.serviceWorker\.register\('service-worker\.js'/);
assert.match(serviceWorkerSource, /CACHE_PREFIX = 'war-room-shell-'/);
assert.match(serviceWorkerSource, /\.\/fantasypros-2026-data\.js/);
assert.match(serviceWorkerSource, /\.\/js\/war-room-scoring\.js/);
assert.match(serviceWorkerSource, /request\.mode === 'navigate'/);
assert.match(serviceWorkerSource, /ignoreSearch: true/);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};
const server = http.createServer((request, response) => {
  const relative = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\//, '');
  const filePath = path.join(root, relative);
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.statusCode = 404;
      response.end('not found');
      return;
    }
    response.statusCode = 200;
    response.setHeader('Content-Type', mimeTypes[path.extname(filePath)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.end(data);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const appUrl = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH});
const context = await browser.newContext({viewport:{width:1280,height:900}});
try {
  const page = await context.newPage();
  await page.goto(appUrl, {waitUntil:'load'});
  await page.waitForSelector('tr.draftrow', {state:'attached'});
  await page.waitForFunction(() => window.WarRoomResilience && window.WarRoomResilience.installed === true);
  await page.waitForFunction(() => document.getElementById('war-room-maintenance-btn'));
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => window.WarRoomResilience.offlineState.registered === true);

  const backupResult = await page.evaluate(() => {
    localStorage.setItem('war-room-resilience-fixture', 'before');
    localStorage.setItem('unrelated-resilience-fixture', 'keep');
    const backup = WarRoomResilience.buildBackup();
    localStorage.setItem('war-room-resilience-fixture', 'after');
    localStorage.setItem('war-room-resilience-extra', 'remove-me');
    const restored = WarRoomResilience.restoreBackupObject(backup);
    let rejectedUnrelated = false;
    try {
      WarRoomResilience.validateBackup({
        schema:'the-war-room-backup',
        version:1,
        storage:{'unrelated-key':'nope'}
      });
    } catch (error) {
      rejectedUnrelated = true;
    }
    return {
      schema:backup.schema,
      capturedFixture:backup.storage['war-room-resilience-fixture'],
      capturedUnrelated:Object.prototype.hasOwnProperty.call(backup.storage, 'unrelated-resilience-fixture'),
      restoredFixture:localStorage.getItem('war-room-resilience-fixture'),
      removedExtra:localStorage.getItem('war-room-resilience-extra') === null,
      keptUnrelated:localStorage.getItem('unrelated-resilience-fixture'),
      restoredKeys:restored.restoredKeys,
      rejectedUnrelated
    };
  });
  assert.equal(backupResult.schema, 'the-war-room-backup');
  assert.equal(backupResult.capturedFixture, 'before');
  assert.equal(backupResult.capturedUnrelated, false);
  assert.equal(backupResult.restoredFixture, 'before');
  assert.equal(backupResult.removedExtra, true);
  assert.equal(backupResult.keptUnrelated, 'keep');
  assert.ok(backupResult.restoredKeys > 0);
  assert.equal(backupResult.rejectedUnrelated, true);

  const health = await page.evaluate(() => WarRoomResilience.runSystemCheck());
  const playerBoard = health.checks.find(check => check.label === 'Player board');
  const dataset = health.checks.find(check => check.label === 'FantasyPros dataset');
  const offline = health.checks.find(check => check.label === 'Offline reload');
  assert.equal(playerBoard?.ok, true, playerBoard?.detail);
  assert.equal(dataset?.ok, true, dataset?.detail);
  assert.equal(offline?.ok, true, offline?.detail);

  await page.reload({waitUntil:'load'});
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('tr.draftrow', {state:'attached'});
  const offlineReload = await page.evaluate(() => ({
    rows:document.querySelectorAll('tr.draftrow').length,
    resilience:Boolean(window.WarRoomResilience && window.WarRoomResilience.installed),
    maintenanceButton:Boolean(document.getElementById('war-room-maintenance-btn'))
  }));
  assert.equal(offlineReload.rows, 717);
  assert.equal(offlineReload.resilience, true);
  assert.equal(offlineReload.maintenanceButton, true);
  await context.setOffline(false);

  console.log(`War Room resilience valid: ${backupResult.restoredKeys} backup keys restored and full 717-player offline reload passed.`);
} finally {
  await context.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
