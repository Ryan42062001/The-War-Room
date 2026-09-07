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

  let openResult;
  try {
    openResult = await worker.evaluate(async () => {
      try {
        await chrome.action.openPopup();
        return {ok:true};
      } catch (error) {
        return {ok:false, message:String(error && error.message || error)};
      }
    });
  } catch (error) {
    openResult = {ok:false, message:String(error && error.message || error)};
  }
  console.log('[diagnostic] openPopup', openResult);

  await new Promise(resolve => setTimeout(resolve, 1000));
  const pages = context.pages();
  console.log('[diagnostic] pages', pages.map(page => page.url()));
  const popup = pages.find(page => page.url() === `chrome-extension://${extensionId}/popup.html`);
  if (popup) {
    await popup.waitForLoadState('domcontentloaded');
    const metrics = await popup.evaluate(() => {
      const body = document.body;
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      return {
        innerWidth: window.innerWidth,
        outerWidth: window.outerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: body.getBoundingClientRect().width,
        headerWidth: header?.getBoundingClientRect().width || 0,
        mainWidth: main?.getBoundingClientRect().width || 0,
        bodyCssWidth: getComputedStyle(body).width,
        htmlMaxWidth: getComputedStyle(document.documentElement).maxWidth,
        bodyMaxWidth: getComputedStyle(body).maxWidth,
        headerText: document.querySelector('h1')?.textContent || ''
      };
    });
    console.log('[diagnostic] action-popup-metrics', JSON.stringify(metrics));
  } else {
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
  }
} finally {
  await context.close();
  fs.rmSync(userDataDir, {recursive:true, force:true});
}
