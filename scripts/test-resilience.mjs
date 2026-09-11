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
assert.match(indexSource, /js\/war-room-resilience\.js\?v=20260907-1/);
assert.doesNotMatch(bootstrapSource, /war-room-resilience/);
assert.match(resilienceSource, /the-war-room-backup/);
assert.match(resilienceSource, /replaceWarRoomStorage/);
assert.match(resilienceSource, /Draft Recovery/);
assert.match(resilienceSource, /Replace War Room Data & Reload/);
assert.match(resilienceSource, /Continue Drafting/);
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

async function chooseBackupFile(page, name, content) {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', {name:'Restore from Backup'}).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name,
    mimeType:'application/json',
    buffer:Buffer.from(content)
  });
}

async function getPageWidth(page) {
  return page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
}

async function openRecovery(page) {
  await page.waitForFunction(() => Boolean(document.getElementById('war-room-maintenance-btn')));
  const opened = await page.evaluate(() => {
    const manage = document.getElementById('draft-manage');
    const button = document.getElementById('war-room-maintenance-btn');
    if (!manage || !button) return false;
    manage.open = true;
    const style = window.getComputedStyle(button);
    const visible = style.display !== 'none' && style.visibility !== 'hidden' && button.getClientRects().length > 0;
    if (!visible) return false;
    button.click();
    return true;
  });
  assert.equal(opened, true, 'current recovery control must be visible and clickable after opening Draft Management');
  await page.waitForSelector('#war-room-maintenance-dialog[open]');
}

async function assertRecoveryContained(page, label, baselineDocumentWidth) {
  const metrics = await page.evaluate(() => {
    const dialog = document.getElementById('war-room-maintenance-dialog');
    const body = dialog?.querySelector('.wr-maintenance-body');
    const rect = dialog?.getBoundingClientRect();
    return {
      viewport:window.innerWidth,
      documentWidth:Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      dialog:rect ? {left:rect.left, right:rect.right, width:rect.width} : null,
      recoveryBody:body ? {clientWidth:body.clientWidth, scrollWidth:body.scrollWidth} : null
    };
  });
  const baseline = Math.max(Number(baselineDocumentWidth) || 0, metrics.viewport);
  assert.ok(metrics.documentWidth <= baseline + 1, `${label}: recovery UI added page overflow ${metrics.documentWidth} > ${baseline}`);
  assert.ok(metrics.dialog, `${label}: recovery dialog must be open`);
  assert.ok(metrics.dialog.left >= -1, `${label}: recovery dialog starts offscreen`);
  assert.ok(metrics.dialog.right <= metrics.viewport + 1, `${label}: recovery dialog ends offscreen`);
  assert.ok(metrics.recoveryBody.scrollWidth <= metrics.recoveryBody.clientWidth + 1, `${label}: recovery content overflows horizontally`);
}

const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH});
const context = await browser.newContext({viewport:{width:1280,height:900}, acceptDownloads:true});
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

  const desktopBaselineWidth = await getPageWidth(page);
  await openRecovery(page);
  await page.waitForSelector('#war-room-maintenance-dialog[open]');
  assert.equal(await page.getByRole('heading', {name:'Draft Recovery'}).count(), 1);
  assert.equal(await page.getByText('Recovery is ready', {exact:true}).count(), 1);
  assert.equal(await page.getByRole('button', {name:'Save Backup'}).count(), 1);
  assert.equal(await page.getByRole('button', {name:'Restore from Backup'}).count(), 1);
  assert.equal(await page.getByRole('button', {name:'Run System Check'}).count(), 1);
  assert.equal(await page.getByRole('button', {name:'Back to Draft'}).count(), 1);
  await assertRecoveryContained(page, 'desktop recovery', desktopBaselineWidth);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name:'Save Backup'}).click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /^war-room-backup-.*\.json$/);
  assert.match(await page.locator('#war-room-maintenance-message').innerText(), /current draft was not changed/i);
  assert.equal(await page.locator('#war-room-maintenance-message').evaluate(element => element.classList.contains('is-success')), true);

  await chooseBackupFile(page, 'broken-backup.json', '{not valid json');
  await page.waitForFunction(() => document.getElementById('war-room-maintenance-message')?.classList.contains('is-error'));
  assert.match(await page.locator('#war-room-maintenance-message').innerText(), /not valid JSON/i);

  const uiBackup = await page.evaluate(() => {
    localStorage.setItem('war-room-resilience-ui-restore', 'backup-value');
    return JSON.stringify(WarRoomResilience.buildBackup());
  });
  await page.evaluate(() => localStorage.setItem('war-room-resilience-ui-restore', 'current-value'));

  await chooseBackupFile(page, 'valid-war-room-backup.json', uiBackup);
  await page.waitForSelector('#war-room-restore-confirmation:not([hidden])');
  assert.equal(await page.evaluate(() => localStorage.getItem('war-room-resilience-ui-restore')), 'current-value', 'selecting a valid backup must not restore it');
  assert.match(await page.locator('#war-room-restore-confirmation').innerText(), /current draft and saved War Room sessions.*will be replaced/i);
  assert.equal(await page.getByRole('button', {name:'Cancel — Keep Current Draft'}).count(), 1);
  assert.equal(await page.getByRole('button', {name:'Replace War Room Data & Reload'}).count(), 1);
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'war-room-cancel-restore', 'safe cancel action should receive focus after file review');
  await page.getByRole('button', {name:'Cancel — Keep Current Draft'}).click();
  assert.equal(await page.locator('#war-room-restore-confirmation').isHidden(), true);
  assert.equal(await page.evaluate(() => localStorage.getItem('war-room-resilience-ui-restore')), 'current-value', 'canceling restore must preserve current draft data');

  await chooseBackupFile(page, 'valid-war-room-backup.json', uiBackup);
  await page.waitForSelector('#war-room-restore-confirmation:not([hidden])');
  await Promise.all([
    page.waitForNavigation({waitUntil:'load'}),
    page.getByRole('button', {name:'Replace War Room Data & Reload'}).click()
  ]);
  await page.waitForFunction(() => window.WarRoomResilience && window.WarRoomResilience.installed === true);
  assert.equal(await page.evaluate(() => localStorage.getItem('war-room-resilience-ui-restore')), 'backup-value');
  await page.waitForSelector('#war-room-recovery-notice');
  assert.match(await page.locator('#war-room-recovery-notice').innerText(), /Backup restored successfully/i);
  assert.match(await page.locator('#war-room-recovery-notice').innerText(), /continue drafting/i);
  await page.getByRole('button', {name:'Continue Drafting'}).click();
  assert.equal(await page.locator('#war-room-recovery-notice').count(), 0);

  const health = await page.evaluate(() => WarRoomResilience.runSystemCheck());
  const playerBoard = health.checks.find(check => check.label === 'Player board');
  const dataset = health.checks.find(check => check.label === 'FantasyPros dataset');
  const offline = health.checks.find(check => check.label === 'Offline fallback');
  assert.equal(playerBoard?.ok, true, playerBoard?.detail);
  assert.equal(dataset?.ok, true, dataset?.detail);
  assert.equal(offline?.ok, true, offline?.detail);

  const degradedCheck = await page.evaluate(() => {
    document.body.setAttribute('data-war-room-degraded', 'true');
    const result = WarRoomResilience.runSystemCheck();
    const safeguards = result.checks.find(check => check.label === 'Core safeguards');
    document.body.removeAttribute('data-war-room-degraded');
    return {ok:result.ok, safeguards};
  });
  assert.equal(degradedCheck.ok, false, 'degraded mode must not report recovery ready');
  assert.equal(degradedCheck.safeguards?.ok, false);

  const mobileWidths = [320, 360, 375, 390, 412, 430, 768];
  const preExistingOverflow = [];
  for (const width of mobileWidths) {
    await page.setViewportSize({width, height:900});
    const baselineWidth = await getPageWidth(page);
    if (baselineWidth > width + 1) preExistingOverflow.push({width, documentWidth:baselineWidth});
    await openRecovery(page);
    await page.waitForSelector('#war-room-maintenance-dialog[open]');
    await assertRecoveryContained(page, `${width}px recovery`, baselineWidth);
    if (width <= 560) {
      const tapTargets = await page.locator('.wr-maintenance-actions button').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().height));
      assert.ok(tapTargets.every(height => height >= 44), `${width}px: recovery action tap targets must be at least 44px`);
    }
    await page.getByRole('button', {name:'Back to Draft'}).click();
  }

  await page.setViewportSize({width:390,height:844});
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('tr.draftrow', {state:'attached'});
  await page.waitForFunction(() => window.WarRoomResilience && window.WarRoomResilience.installed === true);
  const offlineReload = await page.evaluate(() => ({
    rows:document.querySelectorAll('tr.draftrow').length,
    resilience:Boolean(window.WarRoomResilience && window.WarRoomResilience.installed),
    recoveryButton:Boolean(document.getElementById('war-room-maintenance-btn'))
  }));
  assert.equal(offlineReload.rows, 717);
  assert.equal(offlineReload.resilience, true);
  assert.equal(offlineReload.recoveryButton, true);
  const offlineBaselineWidth = await getPageWidth(page);
  await openRecovery(page);
  await page.waitForSelector('#war-room-maintenance-dialog[open]');
  await assertRecoveryContained(page, '390px offline recovery', offlineBaselineWidth);
  assert.equal(await page.getByText('Offline mode is active', {exact:true}).count(), 1);
  assert.match(await page.locator('#war-room-recovery-network-chip').innerText(), /Offline/i);
  await context.setOffline(false);

  console.log(`War Room recovery UX valid: guarded restore, post-reload success, ${mobileWidths.length} mobile widths, and full 717-player offline reload passed.`);
  if (preExistingOverflow.length) console.log('Pre-existing page overflow outside recovery UI:', JSON.stringify(preExistingOverflow));
} finally {
  await context.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
