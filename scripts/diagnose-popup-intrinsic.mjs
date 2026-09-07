import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const {chromium} = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const extensionPath = path.join(root, 'extensions', 'espn-companion');
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'war-room-popup-'));

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`
  ]
});

try {
  let workers = context.serviceWorkers();
  if (!workers.length) {
    try { await context.waitForEvent('serviceworker', {timeout: 10000}); } catch {}
    workers = context.serviceWorkers();
  }
  console.log('[diagnostic] service-workers', workers.map(worker => worker.url()));
  const worker = workers.find(item => item.url().startsWith('chrome-extension://'));
  if (!worker) throw new Error('Extension service worker did not load');
  const extensionId = new URL(worker.url()).host;
  console.log('[diagnostic] extension-id', extensionId);

  const browser = context.browser();
  const browserSession = await browser.newBrowserCDPSession();
  const targetEvents = [];
  browserSession.on('Target.targetCreated', event => {
    if (event.targetInfo?.url?.includes(extensionId) || event.targetInfo?.url?.includes('popup.html')) {
      targetEvents.push({event:'created', info:event.targetInfo});
      console.log('[diagnostic] target-created', JSON.stringify(event.targetInfo));
    }
  });
  browserSession.on('Target.targetInfoChanged', event => {
    if (event.targetInfo?.url?.includes(extensionId) || event.targetInfo?.url?.includes('popup.html')) {
      targetEvents.push({event:'changed', info:event.targetInfo});
      console.log('[diagnostic] target-changed', JSON.stringify(event.targetInfo));
    }
  });
  await browserSession.send('Target.setDiscoverTargets', {discover:true});

  const openResult = await worker.evaluate(async () => {
    try {
      await chrome.action.openPopup();
      return {ok:true};
    } catch (error) {
      return {ok:false, message:String(error && error.message || error)};
    }
  });
  console.log('[diagnostic] openPopup', openResult);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const targets = await browserSession.send('Target.getTargets');
    const extensionTargets = targets.targetInfos.filter(info => info.url.includes(extensionId) || info.url.includes('popup.html'));
    if (extensionTargets.length) console.log('[diagnostic] targets', attempt, JSON.stringify(extensionTargets));
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log('[diagnostic] target-events-count', targetEvents.length);
  console.log('[diagnostic] pages', context.pages().map(page => page.url()));

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`, {waitUntil:'load'});
  const metrics = await page.evaluate(() => ({
    viewport:window.innerWidth,
    bodyWidth:document.body.getBoundingClientRect().width,
    bodyCssWidth:getComputedStyle(document.body).width,
    htmlMaxWidth:getComputedStyle(document.documentElement).maxWidth,
    bodyMaxWidth:getComputedStyle(document.body).maxWidth,
    headerText:document.querySelector('h1')?.textContent || ''
  }));
  console.log('[diagnostic] direct-popup-page-metrics', JSON.stringify(metrics));
} finally {
  await context.close();
  fs.rmSync(userDataDir, {recursive:true, force:true});
}
