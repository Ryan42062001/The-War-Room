import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const selfPath = fileURLToPath(import.meta.url);

// Chromium extension action popups require a headed browser. Give Linux CI a
// virtual display without making callers remember to wrap this test manually.
if (process.platform === 'linux' && !process.env.DISPLAY && !process.argv.includes('--under-xvfb')) {
  const child = spawnSync('xvfb-run', ['-a', process.execPath, selfPath, '--under-xvfb'], {
    stdio:'inherit',
    env:process.env
  });
  if (child.error) throw child.error;
  process.exit(child.status ?? 1);
}

const {chromium} = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(selfPath), '..');
const extensionPath = path.join(root, 'extensions', 'espn-companion');
const popupCssPath = path.join(extensionPath, 'popup.css');
const popupCss = fs.readFileSync(popupCssPath, 'utf8');
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'war-room-popup-intrinsic-'));

const baseBodyRule = popupCss.match(/(?:^|\n)body\s*\{([^}]*)\}/i)?.[1] || '';
assert.match(baseBodyRule, /width\s*:\s*300px\s*;/i, 'action popup must keep a deterministic 300px intrinsic width');
assert.doesNotMatch(baseBodyRule, /\b(?:vw|dvw|svw|lvw)\b/i, 'action popup width must not depend on viewport units');
assert.match(popupCss, /@media\s*\(min-width:\s*600px\)[\s\S]*?body\s*\{[^}]*width\s*:\s*min\(520px\s*,\s*100%\)/i,
  'opened-in-tab layout must retain the wider 520px rule');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function evaluateTarget(browserSession, targetId, expression) {
  const {sessionId} = await browserSession.send('Target.attachToTarget', {targetId, flatten:false});
  try {
    const id = Math.floor(Math.random() * 1e9);
    const response = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        browserSession.off('Target.receivedMessageFromTarget', listener);
        reject(new Error('action popup evaluation timed out'));
      }, 5000);
      const listener = event => {
        if (event.sessionId !== sessionId) return;
        let message;
        try { message = JSON.parse(event.message); } catch { return; }
        if (message.id !== id) return;
        clearTimeout(timer);
        browserSession.off('Target.receivedMessageFromTarget', listener);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result?.result?.value);
      };
      browserSession.on('Target.receivedMessageFromTarget', listener);
    });
    await browserSession.send('Target.sendMessageToTarget', {
      sessionId,
      message:JSON.stringify({
        id,
        method:'Runtime.evaluate',
        params:{expression, returnByValue:true, awaitPromise:true}
      })
    });
    return await response;
  } finally {
    try { await browserSession.send('Target.detachFromTarget', {sessionId}); } catch {}
  }
}

const actionMetricsExpression = `JSON.stringify((()=>{
  const doc=document.documentElement;
  const body=document.body;
  const header=document.querySelector('header');
  const main=document.querySelector('main');
  const h1=document.querySelector('h1');
  const health=document.getElementById('sync-health');
  const healthTitle=document.getElementById('sync-health-title');
  const details=document.querySelector('.technical-details');
  const ids=['save-settings','rescan','reset','open-tab'];
  const buttons=ids.map(id=>{
    const element=document.getElementById(id);
    const rect=element?.getBoundingClientRect();
    const style=element?getComputedStyle(element):null;
    return {id,width:rect?.width||0,height:rect?.height||0,display:style?.display||'none',visibility:style?.visibility||'hidden'};
  });
  const headerRect=header?.getBoundingClientRect();
  const mainRect=main?.getBoundingClientRect();
  const healthRect=health?.getBoundingClientRect();
  return {
    ready:document.readyState,
    innerWidth:window.innerWidth,
    clientWidth:doc.clientWidth,
    scrollWidth:doc.scrollWidth,
    bodyWidth:body?.getBoundingClientRect().width||0,
    headerWidth:headerRect?.width||0,
    mainWidth:mainRect?.width||0,
    h1Text:h1?.textContent?.trim()||'',
    h1Width:h1?.getBoundingClientRect().width||0,
    healthText:healthTitle?.textContent?.trim()||'',
    healthWidth:healthRect?.width||0,
    healthTop:healthRect?.top??9999,
    detailsOpen:Boolean(details?.open),
    buttons
  };
})())`;

const launchOptions = {
  headless:false,
  args:[
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`
  ]
};
if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;

const context = await chromium.launchPersistentContext(userDataDir, launchOptions);
try {
  let workers = context.serviceWorkers();
  if (!workers.length) {
    try { await context.waitForEvent('serviceworker', {timeout:10000}); } catch {}
    workers = context.serviceWorkers();
  }
  const worker = workers.find(item => item.url().startsWith('chrome-extension://'));
  assert.ok(worker, 'unpacked Companion service worker must load');
  const extensionId = new URL(worker.url()).host;

  const browserSession = await context.browser().newBrowserCDPSession();
  await browserSession.send('Target.setDiscoverTargets', {discover:true});

  const openResult = await worker.evaluate(async () => {
    try {
      await chrome.action.openPopup();
      return {ok:true};
    } catch (error) {
      return {ok:false, message:String(error && error.message || error)};
    }
  });
  assert.deepEqual(openResult, {ok:true}, `chrome.action.openPopup failed: ${JSON.stringify(openResult)}`);

  let popupTarget = null;
  for (let attempt = 0; attempt < 40 && !popupTarget; attempt += 1) {
    const targets = await browserSession.send('Target.getTargets');
    popupTarget = targets.targetInfos.find(info =>
      info.url === `chrome-extension://${extensionId}/popup.html` && info.attached === false
    ) || null;
    if (!popupTarget) await sleep(50);
  }
  assert.ok(popupTarget, 'real toolbar action popup target must exist');

  let actionMetrics = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    actionMetrics = JSON.parse(await evaluateTarget(browserSession, popupTarget.targetId, actionMetricsExpression));
    if (actionMetrics.ready === 'complete' && actionMetrics.h1Text === 'ESPN Live Sync' && actionMetrics.healthText.includes('ESPN Live Sync')) break;
    await sleep(50);
  }

  assert.ok(actionMetrics.innerWidth >= 290 && actionMetrics.innerWidth <= 310,
    `action popup viewport collapsed: ${actionMetrics.innerWidth}px`);
  assert.ok(actionMetrics.bodyWidth >= 270, `action popup body collapsed: ${actionMetrics.bodyWidth}px`);
  assert.ok(actionMetrics.headerWidth >= 270, `action popup header collapsed: ${actionMetrics.headerWidth}px`);
  assert.ok(actionMetrics.mainWidth >= 270, `action popup main collapsed: ${actionMetrics.mainWidth}px`);
  assert.equal(actionMetrics.h1Text, 'ESPN Live Sync', 'action popup header text');
  assert.ok(actionMetrics.h1Width > 100, `action popup header is not visibly laid out: ${actionMetrics.h1Width}px`);
  assert.match(actionMetrics.healthText, /^ESPN Live Sync · /, 'sync status must be visible in the action popup');
  assert.ok(actionMetrics.healthWidth >= 240, `sync status collapsed: ${actionMetrics.healthWidth}px`);
  assert.ok(actionMetrics.healthTop >= 0 && actionMetrics.healthTop < 500, `sync status is outside the initial popup viewport: top ${actionMetrics.healthTop}`);
  assert.equal(actionMetrics.detailsOpen, false, 'Technical details remain collapsed by default');
  assert.ok(actionMetrics.scrollWidth <= actionMetrics.clientWidth + 1,
    `action popup horizontal overflow: ${actionMetrics.scrollWidth} > ${actionMetrics.clientWidth}`);
  for (const button of actionMetrics.buttons) {
    assert.notEqual(button.display, 'none', `${button.id} button must be displayed`);
    assert.notEqual(button.visibility, 'hidden', `${button.id} button must be visible`);
    assert.ok(button.width >= 120, `${button.id} button collapsed to ${button.width}px`);
    assert.ok(button.height >= 44, `${button.id} button is under 44px: ${button.height}px`);
  }

  // A normal tab has an established containing block, so the existing desktop
  // media rule should widen the same controls without affecting action-popup sizing.
  const tab = await context.newPage();
  await tab.setViewportSize({width:1280,height:900});
  await tab.goto(`chrome-extension://${extensionId}/popup.html`, {waitUntil:'load'});
  await tab.waitForFunction(() => document.querySelector('h1')?.textContent?.trim() === 'ESPN Live Sync');
  const tabMetrics = await tab.evaluate(() => {
    const bodyRect = document.body.getBoundingClientRect();
    const headerRect = document.querySelector('header')?.getBoundingClientRect();
    const mainRect = document.querySelector('main')?.getBoundingClientRect();
    const doc = document.documentElement;
    return {
      bodyWidth:bodyRect.width,
      bodyLeft:bodyRect.left,
      headerWidth:headerRect?.width || 0,
      mainWidth:mainRect?.width || 0,
      clientWidth:doc.clientWidth,
      scrollWidth:doc.scrollWidth,
      heading:document.querySelector('h1')?.textContent?.trim() || '',
      health:document.getElementById('sync-health-title')?.textContent?.trim() || '',
      detailsOpen:Boolean(document.querySelector('.technical-details')?.open),
      actionHeights:['save-settings','rescan','reset','open-tab'].map(id => document.getElementById(id)?.getBoundingClientRect().height || 0)
    };
  });
  assert.ok(tabMetrics.bodyWidth >= 515 && tabMetrics.bodyWidth <= 525, `opened-in-tab body width must stay ~520px: ${tabMetrics.bodyWidth}px`);
  assert.ok(tabMetrics.headerWidth >= 515 && tabMetrics.mainWidth >= 515, 'opened-in-tab content must use the wider layout');
  assert.ok(tabMetrics.bodyLeft > 100, `opened-in-tab layout should remain centered: left ${tabMetrics.bodyLeft}px`);
  assert.equal(tabMetrics.heading, 'ESPN Live Sync');
  assert.match(tabMetrics.health, /^ESPN Live Sync · /);
  assert.equal(tabMetrics.detailsOpen, false);
  assert.ok(tabMetrics.scrollWidth <= tabMetrics.clientWidth + 1,
    `opened-in-tab horizontal overflow: ${tabMetrics.scrollWidth} > ${tabMetrics.clientWidth}`);
  assert.ok(tabMetrics.actionHeights.every(height => height >= 44), `opened-in-tab action under 44px: ${tabMetrics.actionHeights}`);
  await tab.close();

  console.log(`Companion intrinsic popup valid: real action popup ${actionMetrics.innerWidth}px wide with visible Live Sync content; opened-in-tab layout ${tabMetrics.bodyWidth}px wide; no horizontal overflow.`);
} finally {
  await context.close();
  fs.rmSync(userDataDir, {recursive:true, force:true});
}
