import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const {chromium} = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const mimeTypes = {
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.ico':'image/x-icon'
};

function bounded(label, promise, timeoutMs = 8000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]).finally(() => clearTimeout(timer));
}

const server = http.createServer((request, response) => {
  const relative = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\//, '');
  const filePath = path.join(root, relative);
  if (!filePath.startsWith(root)) {
    response.statusCode = 403;
    response.end('forbidden');
    return;
  }
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

function healthyStatus(overrides = {}) {
  return {
    extensionVersion:'0.9.14',
    config:{teams:10, draftSlot:4, rounds:16},
    picks:[{overallPick:1},{overallPick:2},{overallPick:3}],
    espn:{
      connected:true,
      draftPage:true,
      expectedCompleted:3,
      method:'network',
      visibleCandidates:0,
      apiHttpStatus:200,
      apiTransport:'page',
      apiRole:'member',
      apiAvailable:true,
      apiResolved:3,
      apiRawCount:3,
      liveCapture:{sources:{websocket:{active:true},react:{active:false}}, conflicts:0}
    },
    warRoom:{connected:true, applied:3, unmatched:0, requiredExtensionVersion:'0.9.14'},
    ...overrides,
    espn:{
      connected:true,
      draftPage:true,
      expectedCompleted:3,
      method:'network',
      visibleCandidates:0,
      apiHttpStatus:200,
      apiTransport:'page',
      apiRole:'member',
      apiAvailable:true,
      apiResolved:3,
      apiRawCount:3,
      liveCapture:{sources:{websocket:{active:true},react:{active:false}}, conflicts:0},
      ...(overrides.espn || {})
    },
    warRoom:{connected:true, applied:3, unmatched:0, requiredExtensionVersion:'0.9.14', ...(overrides.warRoom || {})}
  };
}

function richExternalStatus() {
  return {
    extensionVersion:'0.9.14',
    config:{teams:18, draftSlot:4, rounds:16},
    picks:Array.from({length:288}, (_, index) => ({
      overallPick:index + 1,
      playerName:index === 279 ? 'Kene Nwangwu' : `Player ${index + 1}`,
      position:index === 279 ? 'RB' : 'WR'
    })),
    espn:{
      connected:true,
      draftPage:true,
      expectedCompleted:288,
      method:'network',
      visibleCandidates:0,
      liveCapture:{sources:{websocket:{active:true},react:{active:false}}, conflicts:0}
    },
    warRoom:{
      connected:true,
      captured:288,
      applied:288,
      numberedAccepted:288,
      canonicalApplied:287,
      externalAccepted:1,
      unresolved:0,
      rejected:0,
      unmatched:0,
      requiredExtensionVersion:'0.9.14'
    }
  };
}

function richUnresolvedStatus() {
  return healthyStatus({
    warRoom:{
      applied:3,
      numberedAccepted:3,
      canonicalApplied:2,
      externalAccepted:0,
      unresolved:1,
      rejected:0,
      unmatched:0
    }
  });
}

function fullDraftStatus() {
  const picks = Array.from({length:160}, (_, index) => ({overallPick:index + 1}));
  return healthyStatus({
    picks,
    espn:{draftComplete:true, expectedCompleted:160, apiResolved:160, apiRawCount:160},
    warRoom:{applied:160, numberedAccepted:160, canonicalApplied:160, externalAccepted:0, unresolved:0, rejected:0, unmatched:0}
  });
}

const stateCases = [
  ['caughtUp', healthyStatus(), 'ESPN Sync · Caught up'],
  ['updating', healthyStatus({warRoom:{applied:2}}), 'ESPN Sync · Updating'],
  ['catchingUp', healthyStatus({
    picks:[{overallPick:1},{overallPick:2}],
    espn:{method:'dom', expectedCompleted:3, visibleCandidates:2},
    warRoom:{applied:2}
  }), 'ESPN Sync · Catching up'],
  ['needsAttention', richUnresolvedStatus(), 'ESPN Sync · Needs attention'],
  ['unavailable', healthyStatus({
    picks:[],
    espn:{connected:false, draftPage:false, lastSeenAt:'2026-09-07T12:00:00Z', expectedCompleted:0},
    warRoom:{connected:true, applied:0, unmatched:0}
  }), 'ESPN Sync · Unavailable'],
  ['finalizing', healthyStatus({
    picks:[{overallPick:1},{overallPick:2}],
    espn:{draftComplete:true, expectedCompleted:3},
    warRoom:{applied:2}
  }), 'ESPN Sync · Finalizing picks']
];

const launchOptions = {headless:true};
if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;
const browser = await chromium.launch(launchOptions);
try {
  // Real-app smoke: prove the actual modules can own the production badge without
  // transport language, runtime errors, or observer feedback loops.
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(appUrl, {waitUntil:'domcontentloaded'});
  await page.waitForSelector('#espn-sync-status', {state:'attached'});
  await page.addScriptTag({url:appUrl + 'extensions/espn-companion/sync-presentation.js'});
  await page.addScriptTag({url:appUrl + 'extensions/espn-companion/war-room-sync-trust-ui.js'});
  await page.waitForFunction(() => Boolean(window.WarRoomEspnSyncTrustUi));

  for (const [key, status, label] of stateCases) {
    const result = await bounded(`War Room ${key} render`, page.evaluate(status => {
      const presentation = window.WarRoomEspnSyncTrustUi.renderStatus(status);
      const badge = document.getElementById('espn-sync-status');
      return {
        key:presentation.key,
        hidden:badge.hidden,
        text:badge.innerText.trim(),
        aria:badge.getAttribute('aria-label') || ''
      };
    }, status));
    assert.equal(result.key, key, `${key}: presentation state`);
    assert.equal(result.hidden, false, `${key}: badge visible`);
    assert.equal(result.text, label, `${key}: desktop label`);
  }

  const healthyHeader = await bounded('War Room healthy header', page.evaluate(status => {
    window.WarRoomEspnSyncTrustUi.renderStatus(status);
    const badge = document.getElementById('espn-sync-status');
    return {text:badge.innerText, aria:badge.getAttribute('aria-label') || ''};
  }, healthyStatus()));
  assert.doesNotMatch(healthyHeader.text + ' ' + healthyHeader.aria, /websocket|fetch|xhr|eventsource|react|rest|structured|network|board fallback/i);

  const externalHeader = await bounded('War Room external pick header', page.evaluate(status => {
    const presentation = window.WarRoomEspnSyncTrustUi.renderStatus(status);
    const badge = document.getElementById('espn-sync-status');
    return {key:presentation.key, text:badge.innerText.trim(), aria:badge.getAttribute('aria-label') || ''};
  }, richExternalStatus()));
  assert.equal(externalHeader.key, 'caughtUp', 'accepted external pick must remain caught up');
  assert.equal(externalHeader.text, 'ESPN Sync · Caught up');
  assert.doesNotMatch(externalHeader.aria, /attention|manual matching/i);

  const unresolvedHeader = await bounded('War Room unresolved header', page.evaluate(status => {
    const presentation = window.WarRoomEspnSyncTrustUi.renderStatus(status);
    const badge = document.getElementById('espn-sync-status');
    return {key:presentation.key, text:badge.innerText.trim(), aria:badge.getAttribute('aria-label') || ''};
  }, richUnresolvedStatus()));
  assert.equal(unresolvedHeader.key, 'needsAttention');
  assert.equal(unresolvedHeader.text, 'ESPN Sync · Needs attention');
  assert.match(unresolvedHeader.aria, /1 ESPN pick needs manual matching/);

  const completed = await bounded('War Room completed header', page.evaluate(status => {
    const presentation = window.WarRoomEspnSyncTrustUi.renderStatus(status);
    return {key:presentation.key, hidden:document.getElementById('espn-sync-status').hidden};
  }, fullDraftStatus()));
  assert.equal(completed.key, 'complete');
  assert.equal(completed.hidden, true, 'authoritative completion defers to existing Draft complete UI');
  assert.deepEqual(pageErrors, [], `War Room trust UI page errors: ${JSON.stringify(pageErrors)}`);
  await page.close();

  // Responsive presentation fixture: mirror only the status-row contract so this
  // suite measures ESPN Sync containment, not unrelated production control rows.
  const responsive = await browser.newPage({viewport:{width:1280,height:900}});
  const responsiveErrors = [];
  responsive.on('pageerror', error => responsiveErrors.push(error.message));
  await responsive.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}html,body{margin:0;max-width:100%;overflow-x:hidden}.statusbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;width:100%;max-width:100%;padding:8px}.status-spacer{flex:1 1 auto;min-width:0}.espn-sync-status{display:inline-flex;align-items:center;max-width:100%;min-height:28px;padding:4px 8px;white-space:nowrap}
  </style></head><body><div class="statusbar"><div class="status-spacer"></div><div id="espn-sync-status" class="espn-sync-status" aria-live="polite" hidden></div></div></body></html>`);
  await responsive.addScriptTag({url:appUrl + 'extensions/espn-companion/sync-presentation.js'});
  await responsive.addScriptTag({url:appUrl + 'extensions/espn-companion/war-room-sync-trust-ui.js'});
  await responsive.waitForFunction(() => Boolean(window.WarRoomEspnSyncTrustUi));

  const compactCases = [
    [healthyStatus(), 'ESPN · Caught up'],
    [healthyStatus({warRoom:{applied:2}}), 'ESPN · Updating'],
    [healthyStatus({picks:[{overallPick:1},{overallPick:2}], espn:{method:'dom',expectedCompleted:3,visibleCandidates:2}, warRoom:{applied:2}}), 'ESPN · Catching up'],
    [richUnresolvedStatus(), 'ESPN · Attention'],
    [healthyStatus({picks:[],espn:{connected:false,draftPage:false,lastSeenAt:'2026-09-07T12:00:00Z',expectedCompleted:0},warRoom:{connected:true,applied:0,unmatched:0}}), 'ESPN · Unavailable'],
    [healthyStatus({picks:[{overallPick:1},{overallPick:2}],espn:{draftComplete:true,expectedCompleted:3},warRoom:{applied:2}}), 'ESPN · Finalizing']
  ];
  await responsive.setViewportSize({width:320,height:900});
  for (const [status, label] of compactCases) {
    const text = await bounded(`compact ${label}`, responsive.evaluate(status => {
      window.WarRoomEspnSyncTrustUi.renderStatus(status);
      return document.getElementById('espn-sync-status').innerText.trim();
    }, status));
    assert.equal(text, label);
  }

  for (const width of [320, 360, 375, 390, 412, 430, 768, 1280]) {
    await responsive.setViewportSize({width,height:900});
    const metrics = await bounded(`${width}px responsive render`, responsive.evaluate(status => {
      window.WarRoomEspnSyncTrustUi.renderStatus(status);
      const badge = document.getElementById('espn-sync-status');
      const rect = badge.getBoundingClientRect();
      return {
        text:badge.innerText.trim(),
        documentWidth:document.documentElement.scrollWidth,
        viewportWidth:window.innerWidth,
        left:rect.left,
        right:rect.right
      };
    }, healthyStatus()));
    assert.ok(metrics.documentWidth <= metrics.viewportWidth + 1, `${width}px: ESPN Sync fixture horizontal overflow`);
    assert.ok(metrics.left >= -1 && metrics.right <= width + 1, `${width}px: ESPN badge leaves viewport`);
    if (width <= 430) assert.equal(metrics.text, 'ESPN · Caught up', `${width}px: compact ESPN label`);
    else assert.equal(metrics.text, 'ESPN Sync · Caught up', `${width}px: full ESPN label`);
  }
  assert.deepEqual(responsiveErrors, [], `responsive trust UI page errors: ${JSON.stringify(responsiveErrors)}`);
  await responsive.close();

  const popupContext = await browser.newContext({viewport:{width:320,height:900}});
  await popupContext.addInitScript(initialStatus => {
    window.__warRoomPopupStatus = initialStatus;
    const onMessage = {addListener:function(){}};
    window.chrome = {
      runtime:{
        getManifest:function(){ return {version:'0.9.14'}; },
        getURL:function(value){ return value; },
        sendMessage:function(){ return Promise.resolve(window.__warRoomPopupStatus); },
        onMessage:onMessage
      },
      tabs:{query:function(){ return Promise.resolve([]); }, create:function(){ return Promise.resolve(); }},
      storage:{local:{get:function(){ return Promise.resolve({}); }, set:function(){ return Promise.resolve(); }, remove:function(){ return Promise.resolve(); }}},
      scripting:{executeScript:function(){ return Promise.resolve([]); }}
    };
  }, healthyStatus());

  const popup = await popupContext.newPage();
  const popupErrors = [];
  popup.on('pageerror', error => popupErrors.push(error.message));
  await popup.goto(appUrl + 'extensions/espn-companion/popup.html', {waitUntil:'load'});
  await popup.waitForFunction(() => document.getElementById('sync-health-title')?.textContent.includes('Caught up'));

  const popupHealthy = await popup.evaluate(() => ({
    heading:document.querySelector('h1')?.textContent || '',
    health:document.getElementById('sync-health-title')?.textContent || '',
    detailsOpen:document.querySelector('.technical-details')?.open,
    visibleText:document.body.innerText,
    documentWidth:document.documentElement.scrollWidth,
    viewportWidth:window.innerWidth,
    actionHeights:Array.from(document.querySelectorAll('button, .technical-details summary')).map(element => element.getBoundingClientRect().height),
    provenance:Boolean(window.__warRoomEspnClickProvenancePopup)
  }));
  assert.equal(popupHealthy.heading, 'ESPN Live Sync');
  assert.equal(popupHealthy.health, 'ESPN Live Sync · Caught up');
  assert.equal(popupHealthy.detailsOpen, false, 'technical diagnostics collapsed by default');
  assert.doesNotMatch(popupHealthy.visibleText, /REST snapshot|Hybrid recovery|Board fallback|Structured page state|Network observation|Unmatched/);
  assert.ok(popupHealthy.documentWidth <= popupHealthy.viewportWidth + 1, 'Companion popup horizontal overflow');
  assert.ok(popupHealthy.actionHeights.every(height => height >= 44), `Companion touch target under 44px: ${popupHealthy.actionHeights}`);
  assert.equal(popupHealthy.provenance, true, 'QA caller-provenance diagnostics remain loaded');

  const popupCases = [
    [healthyStatus({warRoom:{applied:2}}), 'ESPN Live Sync · Updating'],
    [healthyStatus({picks:[{overallPick:1},{overallPick:2}], espn:{method:'dom',expectedCompleted:3,visibleCandidates:2}, warRoom:{applied:2}}), 'ESPN Live Sync · Catching up'],
    [richUnresolvedStatus(), 'ESPN Live Sync · Needs attention'],
    [healthyStatus({picks:[],espn:{connected:false,draftPage:false,expectedCompleted:0},warRoom:{connected:true,applied:0,unmatched:0}}), 'ESPN Live Sync · Unavailable'],
    [healthyStatus({picks:[{overallPick:1},{overallPick:2}],espn:{draftComplete:true,expectedCompleted:3},warRoom:{applied:2}}), 'ESPN Live Sync · Finalizing picks'],
    [richExternalStatus(), 'ESPN Live Sync · Caught up'],
    [fullDraftStatus(), 'Draft complete']
  ];
  for (const [status, label] of popupCases) {
    const text = await bounded(`Companion ${label}`, popup.evaluate(status => window.WarRoomEspnPopupTrustUx.renderStatus(status).label, status));
    assert.equal(text, label, `Companion state ${label}`);
  }

  const unresolvedCopy = await popup.evaluate(status => {
    const presentation = window.WarRoomEspnPopupTrustUx.renderStatus(status);
    return {key:presentation.key, detail:document.getElementById('message')?.textContent || ''};
  }, richUnresolvedStatus());
  assert.equal(unresolvedCopy.key, 'needsAttention');
  assert.equal(unresolvedCopy.detail, '1 ESPN pick needs manual matching.');

  const recoveryCopy = await popup.evaluate(status => {
    const presentation = window.WarRoomEspnPopupTrustUx.renderStatus(status);
    return {
      detail:document.getElementById('message')?.textContent || '',
      note:document.getElementById('sync-recovery-note')?.textContent || '',
      tone:document.getElementById('sync-health')?.className || '',
      key:presentation.key
    };
  }, healthyStatus({
    picks:[{overallPick:1},{overallPick:2}],
    espn:{method:'dom', expectedCompleted:3, visibleCandidates:2},
    warRoom:{applied:2}
  }));
  assert.equal(recoveryCopy.key, 'catchingUp');
  assert.match(recoveryCopy.detail, /Checking ESPN Pick History for any missed picks\. You can keep drafting\./);
  assert.match(recoveryCopy.note, /ESPN may briefly refresh while Sync catches up\. Your War Room draft stays saved\./);
  assert.doesNotMatch(recoveryCopy.tone, /attention/);

  await popup.locator('.technical-details summary').click();
  const technicalText = await popup.locator('.technical-details').innerText();
  assert.match(technicalText, /Structured page state/);
  assert.match(technicalText, /Network observation/);
  assert.match(technicalText, /Board fallback/);
  assert.match(technicalText, /Conflicts/);
  assert.match(technicalText, /Copy diagnostics/);
  assert.match(technicalText, /Reset trace/);
  assert.deepEqual(popupErrors, [], `Companion popup page errors: ${JSON.stringify(popupErrors)}`);
  await popupContext.close();

  console.log('ESPN Live Sync trust UX valid: observer-safe real-app render, final Core contract, accepted external pick, unresolved attention, 7 states, authoritative completion, diagnostics/provenance retention, 8 responsive fixture widths, and 44px actions passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
