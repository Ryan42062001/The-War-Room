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

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function evaluateTarget(browserSession, targetId, expression) {
  const {sessionId} = await browserSession.send('Target.attachToTarget', {targetId, flatten:false});
  try {
    const id = Math.floor(Math.random() * 1e9);
    const response = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Target evaluation timed out')), 5000);
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
      message: JSON.stringify({id, method:'Runtime.evaluate', params:{expression, returnByValue:true, awaitPromise:true}})
    });
    return await response;
  } finally {
    try { await browserSession.send('Target.detachFromTarget', {sessionId}); } catch {}
  }
}

const metricsExpression = `JSON.stringify((()=>{const body=document.body,header=document.querySelector('header'),main=document.querySelector('main');return{innerWidth:window.innerWidth,outerWidth:window.outerWidth,documentWidth:document.documentElement.scrollWidth,bodyWidth:body.getBoundingClientRect().width,headerWidth:header?.getBoundingClientRect().width||0,mainWidth:main?.getBoundingClientRect().width||0,bodyCssWidth:getComputedStyle(body).width,bodySpecifiedWidth:body.style.width||'',htmlMaxWidth:getComputedStyle(document.documentElement).maxWidth,bodyMaxWidth:getComputedStyle(body).maxWidth,headerText:document.querySelector('h1')?.textContent||'',healthText:document.getElementById('sync-health-title')?.textContent||''};})())`;

try {
  let workers = context.serviceWorkers();
  if (!workers.length) {
    try { await context.waitForEvent('serviceworker', {timeout: 10000}); } catch {}
    workers = context.serviceWorkers();
  }
  const worker = workers.find(item => item.url().startsWith('chrome-extension://'));
  if (!worker) throw new Error('Extension service worker did not load');
  const extensionId = new URL(worker.url()).host;
  console.log('[diagnostic] extension-id', extensionId);

  const browserSession = await context.browser().newBrowserCDPSession();
  await browserSession.send('Target.setDiscoverTargets', {discover:true});
  const openResult = await worker.evaluate(async () => {
    try { await chrome.action.openPopup(); return {ok:true}; }
    catch (error) { return {ok:false, message:String(error && error.message || error)}; }
  });
  console.log('[diagnostic] openPopup', openResult);

  let popupTarget;
  for (let attempt = 0; attempt < 20 && !popupTarget; attempt += 1) {
    const targets = await browserSession.send('Target.getTargets');
    popupTarget = targets.targetInfos.find(info => info.url === `chrome-extension://${extensionId}/popup.html` && info.attached === false);
    if (!popupTarget) await wait(50);
  }
  if (!popupTarget) throw new Error('Toolbar popup target not found');
  console.log('[diagnostic] popup-target', JSON.stringify(popupTarget));

  const baseline = JSON.parse(await evaluateTarget(browserSession, popupTarget.targetId, metricsExpression));
  console.log('[diagnostic] baseline', JSON.stringify(baseline));

  await evaluateTarget(browserSession, popupTarget.targetId, `(()=>{document.body.style.width='300px';return true})()`);
  await wait(100);
  const fixedWidth = JSON.parse(await evaluateTarget(browserSession, popupTarget.targetId, metricsExpression));
  console.log('[diagnostic] fixed-300', JSON.stringify(fixedWidth));

  await evaluateTarget(browserSession, popupTarget.targetId, `(()=>{document.body.style.width='min(300px, 100vw)';document.documentElement.style.maxWidth='none';document.body.style.maxWidth='none';return true})()`);
  await wait(100);
  const vwWithoutMax = JSON.parse(await evaluateTarget(browserSession, popupTarget.targetId, metricsExpression));
  console.log('[diagnostic] vw-without-max', JSON.stringify(vwWithoutMax));

  await evaluateTarget(browserSession, popupTarget.targetId, `(()=>{document.body.style.width='300px';document.documentElement.style.maxWidth='100%';document.body.style.maxWidth='100%';return true})()`);
  await wait(100);
  const fixedWithMax = JSON.parse(await evaluateTarget(browserSession, popupTarget.targetId, metricsExpression));
  console.log('[diagnostic] fixed-with-max', JSON.stringify(fixedWithMax));
} finally {
  await context.close();
  fs.rmSync(userDataDir, {recursive:true, force:true});
}
