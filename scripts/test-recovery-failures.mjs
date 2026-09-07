import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const {chromium} = createRequire(import.meta.url)('playwright');

const PLAYER_UNIVERSE = 717;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = process.env.WAR_ROOM_URL ? null : http.createServer((request, response) => {
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
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const appUrl = process.env.WAR_ROOM_URL || `http://127.0.0.1:${server.address().port}/`;

function diagnostics(page) {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  return {pageErrors, consoleErrors};
}

async function captureObservable(page) {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr.draftrow'));
    const drafted = rows.filter(row => row.classList.contains('drafted-mine') || row.classList.contains('drafted-other'));
    const available = rows.length - drafted.length;
    const seenPicks = new Set();
    let duplicatePick = null;
    let dualStatus = null;
    for (const row of drafted) {
      if (row.classList.contains('drafted-mine') && row.classList.contains('drafted-other')) {
        dualStatus = row.getAttribute('data-name');
        break;
      }
      const pick = row.getAttribute('data-pick');
      if (pick && seenPicks.has(pick)) {
        duplicatePick = pick;
        break;
      }
      if (pick) seenPicks.add(pick);
    }

    let recommendationError = null;
    let recommendations = [];
    if (typeof buildLiveDraftDebugState === 'function' && rows.length) {
      try {
        const debug = buildLiveDraftDebugState();
        recommendations = (Array.isArray(debug && debug.scored) ? debug.scored : []).slice(0, 12).map(candidate => {
          const row = typeof findDraftRowByExpertName === 'function' ? findDraftRowByExpertName(candidate && candidate.name) : null;
          return {
            name:candidate && candidate.name || null,
            available:candidate && candidate.available !== false,
            rowAvailable:Boolean(row && !row.classList.contains('drafted-mine') && !row.classList.contains('drafted-other')),
            finalScore:Number(candidate && candidate.finalScore),
            finiteFinalScore:Number.isFinite(Number(candidate && candidate.finalScore))
          };
        });
      } catch (error) {
        recommendationError = error && error.message || String(error);
      }
    }

    const draftedState = drafted.map(row => ({
      name:row.getAttribute('data-name'),
      status:row.classList.contains('drafted-mine') ? 'mine' : 'taken',
      pick:Number(row.getAttribute('data-pick')) || null,
      teamSlot:Number(row.getAttribute('data-team-slot')) || null,
      source:row.getAttribute('data-sync-source') || null
    })).sort((left, right) => (left.pick || 9999) - (right.pick || 9999) || String(left.name).localeCompare(String(right.name)));

    let positionMismatch = null;
    if (typeof positionBoardCardByKey !== 'undefined' && typeof getPositionBoardRowKey === 'function') {
      for (const row of drafted) {
        const entry = positionBoardCardByKey.get(getPositionBoardRowKey(row));
        const expected = row.classList.contains('drafted-mine') ? 'mine' : 'taken';
        const actual = entry && entry.card && entry.card.getAttribute('data-status');
        if (actual !== expected) {
          positionMismatch = {name:row.getAttribute('data-name'), expected, actual};
          break;
        }
      }
    }

    return {
      online:navigator.onLine,
      activeSession:typeof activeDraftSessionId === 'undefined' ? null : String(activeDraftSessionId),
      sessionSelect:document.getElementById('draftSessionSelect')?.value || null,
      rows:rows.length,
      drafted:drafted.length,
      available,
      completed:typeof getCompletedDraftPickCount === 'function' ? getCompletedDraftPickCount() : null,
      duplicatePick,
      dualStatus,
      draftedState,
      boardView:document.body.getAttribute('data-board-view'),
      positionCards:document.querySelectorAll('.position-player-card').length,
      positionMismatch,
      recommendationCards:document.querySelectorAll('.recommendation-card').length,
      recommendations,
      recommendationError,
      degraded:document.body.getAttribute('data-war-room-degraded') === 'true',
      degradedText:document.getElementById('war-room-degraded-status')?.textContent || '',
      canonicalScoring:Boolean(window.WarRoomCanonicalScoring),
      canonicalRecommendations:Boolean(window.WarRoomCanonicalRecommendations),
      resilience:Boolean(window.WarRoomResilience && window.WarRoomResilience.installed),
      serviceWorkerControlled:Boolean(navigator.serviceWorker && navigator.serviceWorker.controller)
    };
  });
}

async function failReliability(page, {scenario, checkpoint, invariant, extra, errors}) {
  let state = {};
  try { state = await captureObservable(page); } catch (error) { state = {captureError:error.message}; }
  const error = new Error([
    'Deterministic recovery failure-injection regression',
    `scenario=${scenario}`,
    `checkpoint=${checkpoint}`,
    `online=${state.online == null ? 'unknown' : state.online}`,
    `activeSession=${state.activeSession || 'n/a'}`,
    `completed=${state.completed == null ? 'n/a' : state.completed}`,
    `available=${state.available == null ? 'n/a' : state.available}`,
    `drafted=${state.drafted == null ? 'n/a' : state.drafted}`,
    `invariant=${invariant}`,
    `pageErrors=${JSON.stringify(errors && errors.pageErrors || [])}`,
    `consoleErrors=${JSON.stringify(errors && errors.consoleErrors || [])}`,
    `extra=${JSON.stringify(extra || {})}`,
    `state=${JSON.stringify(state)}`
  ].join('\n'));
  error.name = 'RecoveryFailureInjectionError';
  throw error;
}

async function requireInvariant(page, meta, condition, invariant, extra) {
  if (!condition) await failReliability(page, {...meta, invariant, extra});
}

async function waitForHealthyApp(page) {
  await page.waitForSelector('tr.draftrow', {state:'attached'});
  await page.waitForFunction(expected => document.querySelectorAll('tr.draftrow').length === expected, PLAYER_UNIVERSE);
  await page.waitForSelector('.position-player-card', {state:'attached'});
  await page.waitForSelector('.recommendation-card', {state:'attached'});
}

async function authoritativeDigest(page) {
  return page.evaluate(() => ({
    activeSession:String(activeDraftSessionId),
    sessionSelect:document.getElementById('draftSessionSelect')?.value || null,
    settings:{
      teams:Number(document.getElementById('pcTeams')?.value || 0),
      slot:Number(document.getElementById('pcSlot')?.value || 0),
      rounds:Number(document.getElementById('pcRounds')?.value || 0)
    },
    drafted:Array.from(document.querySelectorAll('tr.draftrow')).filter(row =>
      row.classList.contains('drafted-mine') || row.classList.contains('drafted-other')
    ).map(row => ({
      name:row.getAttribute('data-name'),
      status:row.classList.contains('drafted-mine') ? 'mine' : 'taken',
      pick:Number(row.getAttribute('data-pick')) || null,
      teamSlot:Number(row.getAttribute('data-team-slot')) || null,
      source:row.getAttribute('data-sync-source') || null
    })).sort((left, right) => (left.pick || 9999) - (right.pick || 9999) || String(left.name).localeCompare(String(right.name)))
  }));
}

async function assertHealthyState(page, meta, {expectedDigest = null, allowDegraded = false} = {}) {
  const state = await captureObservable(page);
  await requireInvariant(page, meta, state.rows === PLAYER_UNIVERSE, 'player universe changed', {rows:state.rows});
  await requireInvariant(page, meta, state.available + state.drafted === PLAYER_UNIVERSE, 'available + drafted != 717');
  await requireInvariant(page, meta, state.completed === state.drafted, 'completed pick count disagrees with drafted rows');
  await requireInvariant(page, meta, !state.duplicatePick, 'duplicate pick ownership detected', {duplicatePick:state.duplicatePick});
  await requireInvariant(page, meta, !state.dualStatus, 'row is both Mine and Taken', {player:state.dualStatus});
  await requireInvariant(page, meta, state.positionCards === PLAYER_UNIVERSE, 'Position Tiers player universe changed', {positionCards:state.positionCards});
  await requireInvariant(page, meta, !state.positionMismatch, 'Position Tiers status diverged from authoritative board', {positionMismatch:state.positionMismatch});
  await requireInvariant(page, meta, state.canonicalScoring && state.canonicalRecommendations, 'required canonical correctness marker missing');
  await requireInvariant(page, meta, state.recommendationError === null, 'recommendation check threw', {recommendationError:state.recommendationError});
  await requireInvariant(page, meta, state.recommendationCards > 0, 'recommendation UI missing');
  await requireInvariant(page, meta, state.recommendations.length > 0, 'recommendation candidates unexpectedly empty');
  const badRecommendation = state.recommendations.find(candidate => !candidate.name || !candidate.available || !candidate.rowAvailable || !candidate.finiteFinalScore);
  await requireInvariant(page, meta, !badRecommendation, 'recommendation contains drafted/unavailable/non-finite candidate', {badRecommendation});
  if (!allowDegraded) await requireInvariant(page, meta, !state.degraded, 'healthy app reported degraded state', {degradedText:state.degradedText});
  if (expectedDigest) {
    const actual = await authoritativeDigest(page);
    await requireInvariant(page, meta, JSON.stringify(actual) === JSON.stringify(expectedDigest), 'authoritative draft state changed across recovery boundary', {expected:expectedDigest, actual});
  }
  return state;
}

async function flushSave(page, meta) {
  const saved = await page.evaluate(() => {
    if (typeof _saveTimer !== 'undefined' && _saveTimer) {
      clearTimeout(_saveTimer);
      _saveTimer = null;
    }
    return saveState();
  });
  await requireInvariant(page, meta, saved === true, 'explicit save checkpoint failed');
}

async function addPicks(page, count, meta) {
  const names = await page.evaluate(limit => Array.from(document.querySelectorAll('tr.draftrow')).filter(row =>
    !row.classList.contains('drafted-mine') && !row.classList.contains('drafted-other')
  ).slice(0, limit).map(row => row.getAttribute('data-name')), count);
  await requireInvariant(page, meta, names.length === count, 'not enough available rows for deterministic pick injection', {count, names});

  for (let index = 0; index < names.length; index++) {
    const desired = ((await page.evaluate(() => getCompletedDraftPickCount())) + 1) % 4 === 0 ? 'mine' : 'taken';
    const result = await page.evaluate(({name, desired}) => {
      const row = findDraftRowByExpertName(name);
      if (!row) return {ok:false, reason:'row missing'};
      setDraftMarkMode(desired);
      toggleDraft(row);
      return {
        ok:getDraftRowStatus(row) === desired,
        name,
        status:getDraftRowStatus(row),
        pick:Number(row.getAttribute('data-pick')) || null
      };
    }, {name:names[index], desired});
    await requireInvariant(page, meta, result.ok && result.pick > 0, 'draft mutation did not produce authoritative pick metadata', {result});
  }
}

async function exerciseViews(page, meta) {
  const before = await authoritativeDigest(page);
  await page.evaluate(() => {
    setBoardView('overall', {persist:false});
    setPosFilter('WR', document.querySelector('.filterbtn[data-pos="WR"]'));
    setBoardView('position', {persist:false});
    setPosFilter('ALL', document.querySelector('.filterbtn[data-pos="ALL"]'));
  });
  const after = await authoritativeDigest(page);
  await requireInvariant(page, meta, JSON.stringify(before) === JSON.stringify(after), 'view/filter changes mutated authoritative draft state', {before, after});
}

async function runRequiredAssetFailure(browser, spec) {
  const context = await browser.newContext({serviceWorkers:'block'});
  let hits = 0;
  const handler = async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith(spec.path)) {
      hits++;
      await route.abort('failed');
      return;
    }
    await route.continue();
  };
  await context.route('**/*', handler);
  const page = await context.newPage({viewport:{width:1280,height:900}});
  const errors = diagnostics(page);
  const meta = {scenario:`required-asset:${spec.label}`, checkpoint:'startup-blocked', errors};
  try {
    await page.goto(appUrl, {waitUntil:'load'});
    await page.waitForFunction(() => document.body.getAttribute('data-war-room-degraded') === 'true');
    const state = await captureObservable(page);
    await requireInvariant(page, meta, hits === 1, 'required asset failure was not injected exactly once', {hits, path:spec.path});
    await requireInvariant(page, meta, state[spec.marker] === false, 'failed required asset unexpectedly installed canonical marker', {marker:spec.marker});
    await requireInvariant(page, meta, state.rows === 0 && state.positionCards === 0 && state.recommendationCards === 0, 'core draft partially initialized after required asset failure', {
      rows:state.rows,
      positionCards:state.positionCards,
      recommendationCards:state.recommendationCards
    });
    await requireInvariant(page, meta, state.degraded && /canonical scoring engine unavailable/i.test(state.degradedText), 'required failure was not observable as fail-closed degraded state', {degradedText:state.degradedText});
    await requireInvariant(page, meta, errors.consoleErrors.some(message => /core initialization blocked/i.test(message)), 'startup did not report the fail-closed core block', {consoleErrors:errors.consoleErrors});
    await requireInvariant(page, meta, errors.pageErrors.length === 0, 'required asset failure caused uncaught runtime error', {pageErrors:errors.pageErrors});
  } finally {
    await context.close();
  }
}

async function runOptionalEnhancementFailure(browser) {
  const context = await browser.newContext({serviceWorkers:'block'});
  const blocked = new Set(['/js/war-room-hardening.js', '/js/war-room-awareness-live-sync.js']);
  const hits = new Map();
  const handler = async route => {
    const pathname = new URL(route.request().url()).pathname;
    const blockedPath = Array.from(blocked).find(candidate => pathname.endsWith(candidate));
    if (blockedPath) {
      hits.set(blockedPath, (hits.get(blockedPath) || 0) + 1);
      await route.abort('failed');
      return;
    }
    await route.continue();
  };
  await context.route('**/*', handler);
  const page = await context.newPage({viewport:{width:1280,height:900}});
  const errors = diagnostics(page);
  const meta = {scenario:'optional-enhancement-failure', checkpoint:'degraded-but-usable', errors};
  try {
    await page.goto(appUrl, {waitUntil:'load'});
    await waitForHealthyApp(page);
    await page.waitForFunction(() => Boolean(document.querySelector('script[data-war-room-awareness-live-sync]')));
    await page.waitForFunction(() => document.body.getAttribute('data-war-room-degraded') === 'true');

    await requireInvariant(page, meta, (hits.get('/js/war-room-hardening.js') || 0) === 1, 'hardening failure injection was not exercised', {hits:Object.fromEntries(hits)});
    await requireInvariant(page, meta, (hits.get('/js/war-room-awareness-live-sync.js') || 0) === 1, 'live-awareness failure injection was not exercised', {hits:Object.fromEntries(hits)});
    await assertHealthyState(page, meta, {allowDegraded:true});
    await addPicks(page, 4, meta);
    await flushSave(page, meta);
    const expected = await authoritativeDigest(page);
    await assertHealthyState(page, meta, {expectedDigest:expected, allowDegraded:true});

    await context.unroute('**/*', handler);
    await page.reload({waitUntil:'load'});
    await waitForHealthyApp(page);
    await page.waitForFunction(() => Boolean(document.querySelector('script[data-war-room-awareness-live-sync]')));
    await page.waitForTimeout(100);
    const recoveryMeta = {scenario:'optional-enhancement-failure', checkpoint:'reload-after-enhancement-recovery', errors};
    await assertHealthyState(page, recoveryMeta, {expectedDigest:expected});
    await requireInvariant(page, recoveryMeta, errors.pageErrors.length === 0, 'optional enhancement failure caused uncaught runtime error', {pageErrors:errors.pageErrors});
  } finally {
    await context.close();
  }
}

async function runNetworkRecoveryStress(browser) {
  const context = await browser.newContext();
  const page = await context.newPage({viewport:{width:1280,height:900}});
  const errors = diagnostics(page);
  let expected = null;
  try {
    await page.goto(appUrl, {waitUntil:'load'});
    await waitForHealthyApp(page);
    await page.waitForFunction(() => Boolean(window.WarRoomResilience && window.WarRoomResilience.installed));
    await page.evaluate(() => navigator.serviceWorker.ready);

    const startMeta = {scenario:'network-reload-reconnect-stress', checkpoint:'online-initial-draft', errors};
    await addPicks(page, 3, startMeta);
    await flushSave(page, startMeta);
    expected = await authoritativeDigest(page);
    await assertHealthyState(page, startMeta, {expectedDigest:expected});

    // Reload once online so the installed service worker controls the document.
    await page.reload({waitUntil:'load'});
    await waitForHealthyApp(page);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    const onlineReloadMeta = {scenario:'network-reload-reconnect-stress', checkpoint:'online-controlled-reload', errors};
    await assertHealthyState(page, onlineReloadMeta, {expectedDigest:expected});

    await addPicks(page, 2, onlineReloadMeta);
    await flushSave(page, onlineReloadMeta);
    expected = await authoritativeDigest(page);
    await exerciseViews(page, onlineReloadMeta);
    await assertHealthyState(page, onlineReloadMeta, {expectedDigest:expected});

    await context.setOffline(true);
    await page.reload({waitUntil:'domcontentloaded'});
    await waitForHealthyApp(page);
    const offlineMeta = {scenario:'network-reload-reconnect-stress', checkpoint:'offline-reload', errors};
    const offlineState = await assertHealthyState(page, offlineMeta, {expectedDigest:expected});
    await requireInvariant(page, offlineMeta, offlineState.online === false, 'browser did not enter deterministic offline state');
    await requireInvariant(page, offlineMeta, offlineState.serviceWorkerControlled, 'offline reload was not served through the controlled shell');
    await exerciseViews(page, offlineMeta);

    // Continue the live draft while fully offline, then prove a second offline reload retains it.
    await addPicks(page, 2, offlineMeta);
    await flushSave(page, offlineMeta);
    expected = await authoritativeDigest(page);
    await page.reload({waitUntil:'domcontentloaded'});
    await waitForHealthyApp(page);
    const offlineContinueMeta = {scenario:'network-reload-reconnect-stress', checkpoint:'offline-continue-and-reload', errors};
    await assertHealthyState(page, offlineContinueMeta, {expectedDigest:expected});
    await exerciseViews(page, offlineContinueMeta);

    await context.setOffline(false);
    await page.reload({waitUntil:'load'});
    await waitForHealthyApp(page);
    const reconnectMeta = {scenario:'network-reload-reconnect-stress', checkpoint:'online-reconnect-reload', errors};
    const reconnectState = await assertHealthyState(page, reconnectMeta, {expectedDigest:expected});
    await requireInvariant(page, reconnectMeta, reconnectState.online === true, 'browser did not return online after reconnect');
    await exerciseViews(page, reconnectMeta);

    // A compact second flap catches init/order races without turning this into a full-draft torture test.
    await context.setOffline(true);
    await page.reload({waitUntil:'domcontentloaded'});
    await waitForHealthyApp(page);
    const rapidOfflineMeta = {scenario:'network-reload-reconnect-stress', checkpoint:'rapid-second-offline-reload', errors};
    await assertHealthyState(page, rapidOfflineMeta, {expectedDigest:expected});

    await context.setOffline(false);
    await page.reload({waitUntil:'load'});
    await waitForHealthyApp(page);
    const finalMeta = {scenario:'network-reload-reconnect-stress', checkpoint:'final-online-reload', errors};
    await assertHealthyState(page, finalMeta, {expectedDigest:expected});
    await exerciseViews(page, finalMeta);
    await requireInvariant(page, finalMeta, errors.pageErrors.length === 0, 'network/reload stress produced uncaught runtime errors', {pageErrors:errors.pageErrors});
    await requireInvariant(page, finalMeta, errors.consoleErrors.length === 0, 'network/reload stress produced unexpected console errors', {consoleErrors:errors.consoleErrors});
  } finally {
    try { await context.setOffline(false); } catch (error) {}
    await context.close();
  }
}

const startedAt = Date.now();
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH});
try {
  await runRequiredAssetFailure(browser, {
    label:'canonical-scoring',
    path:'/js/war-room-scoring-canonical.js',
    marker:'canonicalScoring'
  });
  await runRequiredAssetFailure(browser, {
    label:'canonical-recommendations',
    path:'/js/war-room-recommendations-canonical.js',
    marker:'canonicalRecommendations'
  });
  await runOptionalEnhancementFailure(browser);
  await runNetworkRecoveryStress(browser);

  const runtimeMs = Date.now() - startedAt;
  console.log(`War Room recovery failure-injection valid: required fail-closed assets, optional fail-open enhancements, and rapid offline/reconnect recovery passed in ${runtimeMs} ms.`);
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
