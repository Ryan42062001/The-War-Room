// WR-133: deterministic, source-free Companion -> War Room end-to-end regression.
// Executes the current Companion background ledger, current war-room-content.js bridge,
// and current War Room application unchanged. No ESPN/provider request is permitted.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const {chromium} = createRequire(import.meta.url)('playwright');

const TASK = 'WR-133';
const SEED = 0x5420133;
const PORT = 8765;
const TEAMS = 10;
const ROUNDS = 16;
const SLOT = 7;
const TOTAL = TEAMS * ROUNDS;
const WAR_ROOM_TAB_ID = 1337;
const ESPN_TAB_ID = 7331;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const companionRoot = path.join(root, 'extensions', 'espn-companion');
const manifest = JSON.parse(fs.readFileSync(path.join(companionRoot, 'manifest.json'), 'utf8'));
const bridgeSource = fs.readFileSync(path.join(companionRoot, 'war-room-content.js'), 'utf8');
const backgroundSource = fs.readFileSync(path.join(companionRoot, 'background.js'), 'utf8');
const liveCaptureSource = fs.readFileSync(path.join(companionRoot, 'espn-live-capture.js'), 'utf8');
const observabilitySource = fs.readFileSync(path.join(companionRoot, 'espn-observability.js'), 'utf8');
const APP_ORIGIN = 'http://127.0.0.1:' + PORT;
const APP_URL = APP_ORIGIN + '/';
const SYNTHETIC_DRAFT_A =
  'https://fantasy.espn.com/football/draft?leagueId=91001&seasonId=2026&draftId=wr133-a';
const SYNTHETIC_DRAFT_B =
  'https://fantasy.espn.com/football/draft?leagueId=91002&seasonId=2026&draftId=wr133-b';

function hash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function safeRequestLabel(raw) {
  try {
    const parsed = new URL(String(raw || ''));
    return parsed.protocol + '//' + parsed.hostname;
  } catch {
    return 'invalid-url';
  }
}

function snakeTeam(pick) {
  const round = Math.ceil(Number(pick) / TEAMS);
  const index = (Number(pick) - 1) % TEAMS;
  return round % 2 === 1 ? index + 1 : TEAMS - index;
}

function seededShuffle(input) {
  const result = input.slice();
  let seed = SEED >>> 0;
  const random = () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function asPick(player, overallPick, suffix) {
  return {
    overallPick,
    playerName:player.name,
    position:player.position,
    playerId:'wr133-' + String(suffix || overallPick).padStart(3, '0'),
    method:'dom',
    source:'dom'
  };
}

function essentialPick(pick) {
  const teamSlot = Number(pick.teamSlot);
  return {
    pick:Number(pick.overallPick),
    name:String(pick.playerName || ''),
    position:String(pick.position || ''),
    teamSlot,
    status:teamSlot === SLOT ? 'mine' : 'taken',
    id:String(pick.espnPlayerId || pick.playerId || '')
  };
}

function expectedOwnership(picks) {
  return picks.map(pick => {
    const teamSlot = snakeTeam(pick.overallPick);
    return {
      pick:Number(pick.overallPick),
      name:String(pick.playerName || ''),
      position:String(pick.position || ''),
      teamSlot,
      status:teamSlot === SLOT ? 'mine' : 'taken',
      id:String(pick.espnPlayerId || pick.playerId || '')
    };
  }).sort((a, b) => a.pick - b.pick);
}

function oracleFailure(label, detail) {
  const error = new Error(TASK + ' oracle failure: ' + label + '\n' + JSON.stringify(detail));
  error.name = 'WR133SyntheticInvariantFailure';
  throw error;
}

function assertEquivalent(label, companionLedger, appLedger) {
  if (JSON.stringify(companionLedger) !== JSON.stringify(appLedger)) {
    oracleFailure(label, {
      companionDigest:hash(companionLedger),
      appDigest:hash(appLedger),
      companionCount:companionLedger.length,
      appCount:appLedger.length,
      firstCompanion:companionLedger.find((item, index) =>
        JSON.stringify(item) !== JSON.stringify(appLedger[index])) || null,
      firstApp:appLedger.find((item, index) =>
        JSON.stringify(item) !== JSON.stringify(companionLedger[index])) || null
    });
  }
}

function expectOracleFailure(label, fn) {
  let detected = null;
  try {
    fn();
  } catch (error) {
    detected = error;
  }
  assert.ok(detected, label + ' must actually fail the WR-133 oracle');
  console.log('WR133_NEGATIVE_CONTROL ' + JSON.stringify({
    label,
    detected:true,
    errorName:String(detected.name || 'Error')
  }));
}

async function waitFor(predicate, label, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  if (lastError) throw lastError;
  throw new Error('Timed out waiting for ' + label);
}

const mimeByExtension = {
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.ico':'image/x-icon'
};

const server = http.createServer((request, response) => {
  const requestPath = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\/+/, '');
  const normalized = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(root, normalized);
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
    response.setHeader('Content-Type', mimeByExtension[path.extname(filePath)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.end(data);
  });
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(PORT, '127.0.0.1', resolve);
});

function createCompanionHarness() {
  const storage = {};
  const runtimeListeners = [];
  const installedListeners = [];
  const startupListeners = [];
  const removedListeners = [];
  const activatedListeners = [];
  const trace = {
    pageToBackground:[],
    backgroundToPage:[],
    forbiddenFetches:[]
  };
  let pageTransport = null;

  const chrome = {
    storage:{
      local:{
        get:async key => {
          if (Array.isArray(key)) {
            return Object.fromEntries(key.map(item => [item, storage[item]]));
          }
          if (key && typeof key === 'object') {
            const result = {};
            Object.keys(key).forEach(item => {
              result[item] = Object.prototype.hasOwnProperty.call(storage, item) ? storage[item] : key[item];
            });
            return result;
          }
          return {[key]:storage[key]};
        },
        set:async payload => { Object.assign(storage, payload || {}); },
        remove:async key => {
          (Array.isArray(key) ? key : [key]).forEach(item => { delete storage[item]; });
        }
      }
    },
    action:{
      setBadgeText:async () => {},
      setBadgeBackgroundColor:async () => {}
    },
    runtime:{
      getManifest:() => manifest,
      onMessage:{addListener:listener => runtimeListeners.push(listener)},
      onInstalled:{addListener:listener => installedListeners.push(listener)},
      onStartup:{addListener:listener => startupListeners.push(listener)}
    },
    tabs:{
      query:async query => {
        const patterns = Array.isArray(query && query.url) ? query.url : [query && query.url].filter(Boolean);
        const asksWarRoom = patterns.some(value =>
          String(value).includes('127.0.0.1') ||
          String(value).includes('localhost') ||
          String(value).includes('ryan42062001.github.io')
        );
        if (asksWarRoom && pageTransport) {
          return [{id:WAR_ROOM_TAB_ID, url:APP_URL, active:true, lastAccessed:1}];
        }
        return [];
      },
      sendMessage:async (tabId, message) => {
        if (Number(tabId) === WAR_ROOM_TAB_ID && pageTransport) {
          trace.backgroundToPage.push({
            type:String(message && message.type || ''),
            hasSnapshot:Boolean(message && message.snapshot)
          });
          const delivered = await pageTransport.deliver(message);
          if (!delivered) throw new Error('War Room content bridge receiver unavailable');
          return true;
        }
        return true;
      },
      onRemoved:{addListener:listener => removedListeners.push(listener)},
      onActivated:{addListener:listener => activatedListeners.push(listener)}
    },
    scripting:{
      executeScript:async details => {
        if (
          pageTransport &&
          details && Array.isArray(details.files) &&
          details.files.includes('war-room-content.js')
        ) {
          await pageTransport.installBridge();
          return [{result:true}];
        }
        return [];
      }
    }
  };

  const forbiddenFetch = async input => {
    trace.forbiddenFetches.push(safeRequestLabel(input && input.url ? input.url : input));
    throw new Error('Unexpected network request from Companion background');
  };

  const context = vm.createContext({
    chrome,
    console,
    Date,
    Promise,
    Object,
    Number,
    String,
    Boolean,
    Math,
    URL,
    Set,
    Map,
    WeakSet,
    ArrayBuffer,
    Uint8Array,
    TextDecoder,
    fetch:forbiddenFetch,
    setTimeout,
    clearTimeout,
    AbortController
  });
  vm.runInContext(liveCaptureSource, context, {filename:'espn-live-capture.js'});
  vm.runInContext(observabilitySource, context, {filename:'espn-observability.js'});
  vm.runInContext(backgroundSource, context, {filename:'background.js'});
  assert.equal(runtimeListeners.length, 1, 'real Companion background must register one runtime listener');

  async function settle() {
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    if (context.storageWriteChain && typeof context.storageWriteChain.then === 'function') {
      await context.storageWriteChain.catch(() => {});
    }
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  async function dispatch(message, sender) {
    await context.ready;
    let response;
    runtimeListeners[0](
      message,
      sender || {},
      value => { response = value; }
    );
    await settle();
    return response;
  }

  return {
    context,
    trace,
    setPageTransport(transport) { pageTransport = transport; },
    async fromWarRoom(message) {
      trace.pageToBackground.push({
        type:String(message && message.type || ''),
        captured:Number(message && message.result && message.result.captured) || 0
      });
      const result = await dispatch(message, {
        tab:{id:WAR_ROOM_TAB_ID, url:APP_URL},
        url:APP_URL,
        frameId:0
      });
      return result == null ? null : JSON.parse(JSON.stringify(result));
    },
    async fromEspn(message, url) {
      const result = await dispatch(
        Object.assign({url}, message),
        {tab:{id:ESPN_TAB_ID, url}, frameId:0}
      );
      return result == null ? null : JSON.parse(JSON.stringify(result));
    },
    settle,
    status() {
      return JSON.parse(JSON.stringify(context.statusSnapshot()));
    },
    picks() {
      return JSON.parse(JSON.stringify(context.getPicks()));
    }
  };
}

async function appObservation(page) {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr.draftrow'));
    const drafted = rows
      .filter(row => row.classList.contains('drafted-mine') || row.classList.contains('drafted-other'))
      .map(row => ({
        pick:Number(row.getAttribute('data-pick')),
        name:String(row.getAttribute('data-name') || ''),
        position:String(row.getAttribute('data-pos') || ''),
        teamSlot:Number(row.getAttribute('data-team-slot')),
        status:row.classList.contains('drafted-mine') ? 'mine' : 'taken',
        id:String(row.getAttribute('data-espn-player-id') || ''),
        source:String(row.getAttribute('data-sync-source') || '')
      }))
      .filter(row => Number.isInteger(row.pick) && row.pick > 0)
      .sort((left, right) => left.pick - right.pick);
    const draftState = getDraftAssistantState();
    const completion = getDraftCompletionStatus(draftState);
    return {
      settings:WarRoomEspnSync.settings(),
      channel:String(ESPN_SYNC_CHANNEL),
      requiredExtensionVersion:String(ESPN_COMPANION_MIN_VERSION),
      session:String(window.activeDraftSessionId || ''),
      rows:drafted,
      latest:window.latestEspnSyncResult ? JSON.parse(JSON.stringify(window.latestEspnSyncResult)) : null,
      meta:window.latestEspnSyncMeta ? JSON.parse(JSON.stringify(window.latestEspnSyncMeta)) : null,
      completion:{
        complete:Boolean(completion.complete),
        provisional:Boolean(completion.provisional),
        authoritative:Boolean(completion.authoritative),
        externalComplete:Boolean(completion.externalComplete),
        myRosterCount:Number(completion.myRosterCount)
      },
      currentPick:Number(draftState.currentPick),
      nextPick:draftState.myNextPick == null ? null : Number(draftState.myNextPick)
    };
  });
}

function canonicalAppLedger(observation) {
  return observation.rows.map(row => ({
    pick:row.pick,
    name:row.name,
    position:row.position,
    teamSlot:row.teamSlot,
    status:row.status,
    id:row.id
  }));
}

function canonicalCompanionLedger(companionPicks) {
  return companionPicks.map(essentialPick).sort((a, b) => a.pick - b.pick);
}

async function forceSave(page) {
  return page.evaluate(() => {
    if (typeof _saveTimer !== 'undefined' && _saveTimer) {
      clearTimeout(_saveTimer);
      _saveTimer = null;
    }
    return saveState();
  });
}

async function main() {
  const companion = createCompanionHarness();
  const networkViolations = [];
  const browser = await chromium.launch({
    headless:true,
    ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})
  });
  const browserContext = await browser.newContext({viewport:{width:1280, height:900}});

  await browserContext.route('**/*', async route => {
    const requestUrl = route.request().url();
    let allowed = false;
    try {
      const parsed = new URL(requestUrl);
      allowed = parsed.origin === APP_ORIGIN;
    } catch {}
    if (!allowed) {
      networkViolations.push(safeRequestLabel(requestUrl));
      await route.abort();
      return;
    }
    await route.continue();
  });

  let page = null;
  await browserContext.exposeBinding('__wr133SendRuntimeToBackground', async ({page:sourcePage}, message) => {
    assert.equal(sourcePage, page, 'runtime message must originate from the active trusted War Room page');
    return companion.fromWarRoom(message);
  });

  await browserContext.addInitScript(({extensionVersion}) => {
    const runtimeListeners = [];
    const existingChrome = globalThis.chrome && typeof globalThis.chrome === 'object'
      ? globalThis.chrome
      : {};
    existingChrome.runtime = {
      getManifest:() => ({version:extensionVersion}),
      sendMessage:message => globalThis.__wr133SendRuntimeToBackground(message),
      onMessage:{
        addListener:listener => runtimeListeners.push(listener)
      }
    };
    globalThis.chrome = existingChrome;
    globalThis.__wr133BridgeTrace = [];
    globalThis.__wr133RuntimeListenerCount = () => runtimeListeners.length;
    globalThis.__wr133DeliverRuntimeMessage = async message => {
      if (!runtimeListeners.length) return 0;
      for (const listener of runtimeListeners.slice()) {
        listener(message, {}, () => {});
      }
      return runtimeListeners.length;
    };
    globalThis.addEventListener('message', event => {
      const data = event && event.data;
      if (!data || typeof data !== 'object' || Array.isArray(data)) return;
      if (!data.channel && !data.type) return;
      globalThis.__wr133BridgeTrace.push({
        channel:data.channel == null ? null : String(data.channel),
        type:data.type == null ? null : String(data.type)
      });
      if (globalThis.__wr133BridgeTrace.length > 500) globalThis.__wr133BridgeTrace.shift();
    }, true);
  }, {extensionVersion:manifest.version});

  page = await browserContext.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error && error.message || error)));

  const transport = {
    async deliver(message) {
      return page.evaluate(async payload => {
        if (typeof window.__wr133DeliverRuntimeMessage !== 'function') return 0;
        return window.__wr133DeliverRuntimeMessage(payload);
      }, message);
    },
    async installBridge() {
      await page.addScriptTag({content:bridgeSource});
      await page.waitForFunction(() =>
        typeof window.__wr133RuntimeListenerCount === 'function' &&
        window.__wr133RuntimeListenerCount() > 0
      );
    }
  };
  companion.setPageTransport(transport);

  try {
    await page.goto(APP_URL, {waitUntil:'load'});
    await page.waitForFunction(() =>
      document.querySelectorAll('tr.draftrow').length === 717 &&
      Boolean(window.WarRoomEspnSync && window.WarRoomCommandBarFixes)
    );
    await transport.installBridge();

    await waitFor(
      () => companion.trace.pageToBackground.some(item => item.type === 'WAR_ROOM_READY'),
      'real bridge WAR_ROOM_READY handshake'
    );

    await page.evaluate(() => {
      WarRoomCommandBarFixes.applySettings({teams:10, slot:7, rounds:16}, true);
    });
    await waitFor(
      () => companion.status().config.teams === TEAMS &&
        companion.status().config.rounds === ROUNDS &&
        companion.status().config.draftSlot === SLOT,
      'Companion settings agreement'
    );
    await waitFor(async () => {
      const observed = await appObservation(page);
      return observed.settings.teams === TEAMS &&
        observed.settings.rounds === ROUNDS &&
        observed.settings.draftSlot === SLOT;
    }, 'War Room settings agreement');

    const handshake = await appObservation(page);
    assert.equal(handshake.channel, 'the-war-room:espn-sync:v1');
    assert.equal(handshake.requiredExtensionVersion, manifest.version);
    assert.deepEqual(
      [handshake.settings.teams, handshake.settings.rounds, handshake.settings.draftSlot],
      [TEAMS, ROUNDS, SLOT]
    );
    assert.deepEqual(
      [companion.status().config.teams, companion.status().config.rounds, companion.status().config.draftSlot],
      [TEAMS, ROUNDS, SLOT]
    );
    assert.ok(
      companion.trace.pageToBackground.some(item => item.type === 'WAR_ROOM_SETTINGS_UPDATE'),
      'real bridge must forward the app settings update to background'
    );

    const universe = await page.evaluate(() =>
      Array.from(document.querySelectorAll('tr.draftrow')).map(row => ({
        name:String(row.getAttribute('data-name') || ''),
        position:String(row.getAttribute('data-pos') || '')
      })).filter(player => player.name && player.position)
    );
    assert.equal(universe.length, 717, 'must use the committed 717-row War Room board');
    const plan = seededShuffle(universe);
    const complete = plan.slice(0, TOTAL).map((player, index) => asPick(player, index + 1));
    const initial12 = complete.slice(0, 12).map(pick => ({...pick}));
    initial12[4] = asPick(plan[170], 5, 'wrong-005');
    const corrected13 = complete.slice(0, 13).map(pick => ({...pick}));
    const first20 = complete.slice(0, 20).map(pick => ({...pick}));
    const first159 = complete.slice(0, 159).map(pick => ({...pick}));
    const bPicks = plan.slice(200, 205).map((player, index) =>
      asPick(player, index + 1, 'b-' + String(index + 1))
    );

    async function waitForConvergence(expectedCount, label) {
      await waitFor(() => companion.picks().length === expectedCount, label + ' Companion ledger count');
      await waitFor(async () => {
        const observed = await appObservation(page);
        return observed.rows.length === expectedCount &&
          observed.latest && Number(observed.latest.captured) === expectedCount;
      }, label + ' app ledger count');
      await waitFor(() => {
        const status = companion.status();
        return Number(status.warRoom.acknowledgedCaptured) >= expectedCount &&
          Number(status.warRoom.applied) === expectedCount &&
          Number(status.warRoom.unmatched) === 0;
      }, label + ' ACK convergence');
    }

    async function checkpoint(label, fixtureValue, expectedCount, options = {}) {
      await waitForConvergence(expectedCount, label);
      const status = companion.status();
      const companionLedger = canonicalCompanionLedger(status.picks);
      const app = await appObservation(page);
      const appLedger = canonicalAppLedger(app);
      assert.equal(new Set(companionLedger.map(item => item.pick)).size, companionLedger.length,
        label + ': Companion ledger pick numbers unique');
      assert.equal(new Set(appLedger.map(item => item.pick)).size, appLedger.length,
        label + ': app ledger pick numbers unique');
      companionLedger.forEach(item => {
        assert.equal(item.teamSlot, snakeTeam(item.pick), label + ': Companion snake ownership pick ' + item.pick);
        assert.equal(item.status, item.teamSlot === SLOT ? 'mine' : 'taken',
          label + ': Companion Mine/Taken ownership pick ' + item.pick);
      });
      appLedger.forEach(item => {
        assert.equal(item.teamSlot, snakeTeam(item.pick), label + ': app snake ownership pick ' + item.pick);
        assert.equal(item.status, item.teamSlot === SLOT ? 'mine' : 'taken',
          label + ': app Mine/Taken ownership pick ' + item.pick);
      });
      assertEquivalent(label + ': Companion/app numbered ledger equivalence', companionLedger, appLedger);
      if (options.expectedOwnership) {
        assert.deepEqual(companionLedger, expectedOwnership(options.expectedOwnership),
          label + ': accepted fixture ownership must match independent oracle');
      }
      const bridgeTrace = await page.evaluate(() => (window.__wr133BridgeTrace || []).slice());
      const evidence = {
        label,
        fixtureDigest:hash(fixtureValue),
        companionLedgerDigest:hash(companionLedger),
        appLedgerDigest:hash(appLedger),
        ownershipDigest:hash(appLedger.map(item => [item.pick, item.teamSlot, item.status])),
        count:appLedger.length,
        captured:Number(status.espn.captured) || 0,
        applied:Number(status.warRoom.applied) || 0,
        unmatched:Number(status.warRoom.unmatched) || 0,
        acknowledged:Number(status.warRoom.acknowledgedCaptured) || 0,
        unresolved:Array.isArray(status.espn.unresolvedPickNumbers)
          ? status.espn.unresolvedPickNumbers.slice()
          : [],
        appSession:app.session,
        completion:app.completion
      };
      assert.ok(
        bridgeTrace.some(item => item.channel === handshake.channel && item.type === 'PICKS_SNAPSHOT'),
        label + ': real content bridge must post PICKS_SNAPSHOT on the current channel'
      );
      assert.ok(
        bridgeTrace.some(item => item.channel === handshake.channel && item.type === 'SYNC_ACK'),
        label + ': real app ACK must use the current channel'
      );
      console.log('WR133_CHECKPOINT ' + JSON.stringify(evidence));
      return {status, companionLedger, app, appLedger, bridgeTrace, evidence};
    }

    // A — setup / handshake.
    console.log('WR133_CHECKPOINT ' + JSON.stringify({
      label:'A setup handshake',
      config:[TEAMS, ROUNDS, SLOT],
      channel:handshake.channel,
      extensionVersion:manifest.version,
      fixtureDigest:hash({config:[TEAMS, ROUNDS, SLOT], channel:handshake.channel})
    }));

    // B — initial numbered progression through real background -> bridge -> app.
    await companion.fromEspn({
      type:'ESPN_PICKS_FOUND',
      topFrame:true,
      picks:initial12,
      unavailablePlayers:[],
      captured:initial12.length
    }, SYNTHETIC_DRAFT_A);
    const opening = await checkpoint('B initial numbered progression', initial12, 12, {
      expectedOwnership:initial12
    });
    const sessionA = opening.app.session;
    assert.ok(sessionA, 'draft A must create/select an app session');

    // Required oracle negative controls operate on copies only.
    const lostCopy = opening.appLedger.slice(1);
    expectOracleFailure('lost accepted pick', () =>
      assertEquivalent('negative lost pick', opening.companionLedger, lostCopy)
    );
    const misownedCopy = opening.appLedger.map(item => ({...item}));
    misownedCopy[0].teamSlot = misownedCopy[0].teamSlot === TEAMS ? 1 : misownedCopy[0].teamSlot + 1;
    misownedCopy[0].status = misownedCopy[0].teamSlot === SLOT ? 'mine' : 'taken';
    expectOracleFailure('wrong team or Mine/Taken ownership', () =>
      assertEquivalent('negative misowned pick', opening.companionLedger, misownedCopy)
    );
    const bridgeEvidence = {
      channel:handshake.channel,
      hasSnapshot:opening.bridgeTrace.some(item => item.type === 'PICKS_SNAPSHOT'),
      hasAck:opening.bridgeTrace.some(item => item.type === 'SYNC_ACK')
    };
    expectOracleFailure('bridge contract/channel drift', () => {
      const drifted = {...bridgeEvidence, channel:'the-war-room:espn-sync:v999'};
      assert.deepEqual(drifted, bridgeEvidence);
    });

    // C — duplicate / reordered delivery.
    const duplicateReordered = initial12.slice().reverse().concat({...initial12[2]});
    await companion.fromEspn({
      type:'ESPN_PICKS_FOUND',
      topFrame:true,
      picks:duplicateReordered,
      unavailablePlayers:[],
      captured:duplicateReordered.length
    }, SYNTHETIC_DRAFT_A);
    const duplicate = await checkpoint('C duplicate reordered convergence', duplicateReordered, 12, {
      expectedOwnership:initial12
    });
    assert.equal(duplicate.evidence.acknowledged, 12, 'duplicate replay must not inflate acknowledged ledger count');

    // D — stale shorter replay must not erase accepted state.
    const staleShorter = initial12.slice(0, 9);
    await companion.fromEspn({
      type:'ESPN_PICKS_FOUND',
      topFrame:true,
      picks:staleShorter,
      unavailablePlayers:[],
      captured:staleShorter.length
    }, SYNTHETIC_DRAFT_A);
    await checkpoint('D stale shorter replay retained', staleShorter, 12, {
      expectedOwnership:initial12
    });

    // E — unresolved structured pick 13 is represented as unresolved, not invented.
    const raw13 = Array.from({length:13}, (_, index) => index + 1);
    await companion.fromEspn({
      type:'ESPN_STRUCTURED_PICKS',
      topFrame:true,
      picks:initial12,
      rawPickNumbers:raw13,
      unresolved:[{overallPick:13, teamId:'wr133-team-unresolved', isMine:false}],
      complete:false,
      rawCount:13,
      scheduledCount:13,
      openSlotCount:0,
      httpStatus:200
    }, SYNTHETIC_DRAFT_A);
    const unresolved = await checkpoint(
      'E unresolved pick not invented',
      {picks:initial12, rawPickNumbers:raw13, unresolved:[13]},
      12,
      {expectedOwnership:initial12}
    );
    assert.deepEqual(unresolved.evidence.unresolved, [13]);
    assert.equal(unresolved.appLedger.some(item => item.pick === 13), false,
      'unresolved pick 13 must not become a wrong application pick');

    // F — authoritative correction resolves pick 13 and replaces the earlier low-confidence wrong pick 5.
    await companion.fromEspn({
      type:'ESPN_LIVE_OBSERVATIONS',
      topFrame:true,
      source:'react',
      observations:[Object.assign({}, corrected13[4], {source:'react', method:'react'})],
      telemetry:{source:'react', candidateCount:1},
      counters:{}
    }, SYNTHETIC_DRAFT_A);
    await companion.fromEspn({
      type:'ESPN_STRUCTURED_PICKS',
      topFrame:true,
      picks:corrected13.map(pick => Object.assign({}, pick, {source:'rest', method:'rest'})),
      rawPickNumbers:raw13,
      unresolved:[],
      complete:false,
      rawCount:13,
      scheduledCount:13,
      openSlotCount:0,
      httpStatus:200
    }, SYNTHETIC_DRAFT_A);
    const corrected = await checkpoint('F authoritative correction', corrected13, 13, {
      expectedOwnership:corrected13
    });
    assert.equal(corrected.appLedger[4].name, corrected13[4].playerName);
    assert.equal(corrected.appLedger.some(item => item.name === initial12[4].playerName), false,
      'stale wrong pick-5 player must be displaced');
    assert.deepEqual(corrected.evidence.unresolved, []);
    assert.equal(await forceSave(page), true, 'draft A must save before session isolation');
    const a13Digest = corrected.evidence.appLedgerDigest;

    // G — session isolation with distinct synthetic draft identities A and B.
    await companion.fromEspn({
      type:'ESPN_PICKS_FOUND',
      topFrame:true,
      picks:bPicks,
      unavailablePlayers:[],
      captured:bPicks.length
    }, SYNTHETIC_DRAFT_B);
    const isolatedB = await checkpoint('G session B isolated', bPicks, 5, {
      expectedOwnership:bPicks
    });
    const sessionB = isolatedB.app.session;
    assert.ok(sessionB && sessionB !== sessionA, 'draft B must map to a distinct app session');
    assert.equal(await forceSave(page), true, 'draft B must save');

    await companion.fromEspn({
      type:'ESPN_STRUCTURED_PICKS',
      topFrame:true,
      picks:corrected13.map(pick => Object.assign({}, pick, {source:'rest', method:'rest'})),
      rawPickNumbers:raw13,
      unresolved:[],
      complete:false,
      rawCount:13,
      scheduledCount:13,
      openSlotCount:0,
      httpStatus:200
    }, SYNTHETIC_DRAFT_A);
    const restoredA = await checkpoint('G session A restored after B', corrected13, 13, {
      expectedOwnership:corrected13
    });
    assert.equal(restoredA.app.session, sessionA);
    assert.equal(restoredA.evidence.appLedgerDigest, a13Digest,
      'session A ledger must remain intact after visiting B');

    // H — reload and reconnect: WAR_ROOM_READY from the reinstalled real bridge drives current snapshot.
    await companion.fromEspn({
      type:'ESPN_STRUCTURED_PICKS',
      topFrame:true,
      picks:first20.map(pick => Object.assign({}, pick, {source:'rest', method:'rest'})),
      rawPickNumbers:Array.from({length:20}, (_, index) => index + 1),
      unresolved:[],
      complete:false,
      rawCount:20,
      scheduledCount:20,
      openSlotCount:0,
      httpStatus:200
    }, SYNTHETIC_DRAFT_A);
    const preReload20 = await checkpoint('H pre-reload 20', first20, 20, {
      expectedOwnership:first20
    });
    assert.equal(await forceSave(page), true, 'draft A 20-pick state must save before reload');
    const preReloadDigest = preReload20.evidence.appLedgerDigest;
    const readyCountBeforeReload = companion.trace.pageToBackground
      .filter(item => item.type === 'WAR_ROOM_READY').length;

    await page.reload({waitUntil:'load'});
    await page.waitForFunction(() =>
      document.querySelectorAll('tr.draftrow').length === 717 &&
      Boolean(window.WarRoomEspnSync && window.WarRoomCommandBarFixes)
    );
    await transport.installBridge();
    await waitFor(() =>
      companion.trace.pageToBackground.filter(item => item.type === 'WAR_ROOM_READY').length >
      readyCountBeforeReload,
      'reloaded real bridge WAR_ROOM_READY'
    );
    const reconnected20 = await checkpoint('H reconnect 20', first20, 20, {
      expectedOwnership:first20
    });
    assert.equal(reconnected20.evidence.appLedgerDigest, preReloadDigest,
      'reload/reconnect must preserve the accepted 20-pick ledger');

    // I — terminal 159/160 then 160/160 through background -> bridge -> app.
    await companion.fromEspn({
      type:'ESPN_HEARTBEAT',
      topFrame:true,
      draftPage:true,
      captured:159,
      currentPick:160,
      draftComplete:false,
      detectedRounds:16
    }, SYNTHETIC_DRAFT_A);
    await companion.fromEspn({
      type:'ESPN_STRUCTURED_PICKS',
      topFrame:true,
      picks:first159.map(pick => Object.assign({}, pick, {source:'rest', method:'rest'})),
      rawPickNumbers:Array.from({length:159}, (_, index) => index + 1),
      unresolved:[],
      complete:false,
      rawCount:159,
      scheduledCount:160,
      openSlotCount:1,
      httpStatus:200
    }, SYNTHETIC_DRAFT_A);
    const at159 = await checkpoint('I terminal 159 of 160', first159, 159, {
      expectedOwnership:first159
    });
    assert.equal(at159.appLedger.some(item => item.pick === 160), false);
    assert.equal(at159.app.completion.authoritative, false,
      '159/160 must not be authoritative terminal completion');

    await companion.fromEspn({
      type:'ESPN_HEARTBEAT',
      topFrame:true,
      draftPage:true,
      captured:160,
      currentPick:160,
      draftComplete:true,
      detectedRounds:16
    }, SYNTHETIC_DRAFT_A);
    await companion.fromEspn({
      type:'ESPN_STRUCTURED_PICKS',
      topFrame:true,
      picks:complete.map(pick => Object.assign({}, pick, {source:'rest', method:'rest'})),
      rawPickNumbers:Array.from({length:160}, (_, index) => index + 1),
      unresolved:[],
      complete:true,
      rawCount:160,
      scheduledCount:160,
      openSlotCount:0,
      httpStatus:200
    }, SYNTHETIC_DRAFT_A);
    const terminal = await checkpoint('I authoritative terminal 160', complete, 160, {
      expectedOwnership:complete
    });
    assert.equal(terminal.app.completion.authoritative, true,
      '160/160 must be authoritative terminal completion');
    assert.equal(terminal.app.completion.complete, true);
    assert.equal(terminal.app.nextPick, null, 'terminal state must not expose an invalid next turn');
    assert.equal(await forceSave(page), true, 'terminal state must save');
    const terminalDigest = terminal.evidence.appLedgerDigest;
    const terminalReadyCount = companion.trace.pageToBackground
      .filter(item => item.type === 'WAR_ROOM_READY').length;

    await page.reload({waitUntil:'load'});
    await page.waitForFunction(() =>
      document.querySelectorAll('tr.draftrow').length === 717 &&
      Boolean(window.WarRoomEspnSync && window.WarRoomCommandBarFixes)
    );
    await transport.installBridge();
    await waitFor(() =>
      companion.trace.pageToBackground.filter(item => item.type === 'WAR_ROOM_READY').length >
      terminalReadyCount,
      'terminal reload bridge handshake'
    );
    const terminalReload = await checkpoint('I terminal reload convergence', complete, 160, {
      expectedOwnership:complete
    });
    assert.equal(terminalReload.evidence.appLedgerDigest, terminalDigest);
    assert.equal(terminalReload.app.completion.authoritative, true);
    assert.equal(terminalReload.app.nextPick, null);

    assert.equal(pageErrors.length, 0, 'War Room page must have zero runtime errors');
    assert.deepEqual(networkViolations, [], 'browser must make zero unexpected external network requests');
    assert.deepEqual(companion.trace.forbiddenFetches, [],
      'Companion background must make zero provider/network fetches');

    const bridgeTrace = await page.evaluate(() => (window.__wr133BridgeTrace || []).slice());
    assert.ok(bridgeTrace.some(item =>
      item.channel === handshake.channel && item.type === 'PICKS_SNAPSHOT'
    ));
    assert.ok(bridgeTrace.some(item =>
      item.channel === handshake.channel && item.type === 'SYNC_ACK'
    ));
    assert.ok(companion.trace.pageToBackground.some(item => item.type === 'WAR_ROOM_ACK'));

    console.log('WR133_COMPANION_WAR_ROOM_E2E_PASS ' + JSON.stringify({
      seed:SEED,
      scenario:{teams:TEAMS, rounds:ROUNDS, slot:SLOT, totalPicks:TOTAL},
      channel:handshake.channel,
      extensionVersion:manifest.version,
      sessionA,
      sessionB,
      terminalLedgerDigest:terminalDigest,
      fixtureDigest:hash(complete),
      ownershipDigest:terminal.evidence.ownershipDigest,
      negativeControls:3,
      browserErrors:pageErrors.length,
      externalNetworkRequests:networkViolations.length,
      companionFetches:companion.trace.forbiddenFetches.length,
      boundary:'synthetic local Companion background -> real content bridge -> real War Room app only; no live ESPN/provider/source/deployment claim'
    }));
  } finally {
    await browserContext.close();
    await browser.close();
  }
}

try {
  await main();
} finally {
  await new Promise(resolve => server.close(resolve));
}
