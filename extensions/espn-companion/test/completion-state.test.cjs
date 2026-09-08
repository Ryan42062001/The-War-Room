const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function loadBackground() {
  const listeners = {message: [], installed: [], startup: [], removed: [], activated: []};
  const sent = [];
  const draftUrl = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026&draftId=completion-fixture';
  const warRoomUrl = 'https://ryan42062001.github.io/The-War-Room/';
  const chrome = {
    storage: {
      local: {
        get: async key => ({[key]: null}),
        set: async () => {},
        remove: async () => {}
      }
    },
    action: {
      setBadgeText: async () => {},
      setBadgeBackgroundColor: async () => {}
    },
    runtime: {
      getManifest: () => ({version: '0.9.14'}),
      onMessage: {addListener: listener => listeners.message.push(listener)},
      onInstalled: {addListener: listener => listeners.installed.push(listener)},
      onStartup: {addListener: listener => listeners.startup.push(listener)}
    },
    tabs: {
      query: async query => {
        const urls = Array.isArray(query && query.url) ? query.url : [];
        if (urls.some(url => String(url).includes('fantasy.espn.com'))) {
          return [{id: 11, url: draftUrl, active: true, lastAccessed: 100}];
        }
        if (urls.some(url => String(url).includes('github.io'))) {
          return [{id: 22, url: warRoomUrl}];
        }
        return [];
      },
      sendMessage: async (tabId, message) => { sent.push({tabId, message}); },
      onRemoved: {addListener: listener => listeners.removed.push(listener)},
      onActivated: {addListener: listener => listeners.activated.push(listener)}
    },
    scripting: {
      executeScript: async details => details && details.func
        ? [{result: {liveObserver: '3', pageBridge: '2', workerObserver: '1'}}]
        : []
    }
  };
  const context = vm.createContext({
    chrome, console, Date, Promise, Object, Number, String, Boolean, Math, URL,
    setTimeout, clearTimeout, AbortController
  });
  context.importScripts = (...files) => {
    for (const file of files) {
      vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename:file});
    }
  };
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  context.importScripts(manifest.background.service_worker);
  context.listeners = listeners;
  context.sent = sent;
  context.draftUrl = draftUrl;
  context.warRoomUrl = warRoomUrl;
  return context;
}

function flush() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

test('Rescan cannot demote completion when the authoritative numbered ledger is complete', async () => {
  const context = loadBackground();
  await context.ready;
  context.state.config = {teams: 10, draftSlot: 1, rounds: 16};
  context.state.draftKey = context.draftKeyFromUrl(context.draftUrl);
  context.state.ledgerTeams = 10;
  context.mergePicks(Array.from({length: 160}, (_, index) => ({
    overallPick: index + 1,
    playerName: 'Completion Player ' + (index + 1),
    position: 'WR',
    method: 'api'
  })));
  context.state.espn.draftPage = true;
  context.state.espn.draftComplete = true;
  context.state.espn.currentPick = 160;
  context.state.espn.expectedCompleted = 160;

  const listener = context.listeners.message[0];
  const rescanStatus = await new Promise(resolve => {
    listener({type: 'RESCAN'}, {}, resolve);
  });
  assert.equal(rescanStatus.picks.length, 160);
  assert.equal(rescanStatus.espn.draftComplete, true);
  assert.ok(context.sent.some(entry => entry.tabId === 11 && entry.message.type === 'RESCAN_ESPN'));

  // A post-draft Rescan can no longer see ESPN's terminal UI marker even
  // though the authoritative numbered ledger still contains every pick.
  listener({
    type: 'ESPN_HEARTBEAT',
    topFrame: true,
    draftPage: true,
    draftComplete: false,
    currentPick: 160,
    captured: 160,
    url: context.draftUrl
  }, {tab: {id: 11, url: context.draftUrl}, frameId: 0}, () => {});
  await flush();
  await flush();

  assert.equal(context.getPicks().length, 160);
  assert.deepEqual(
    Array.from(context.getPicks(), pick => Number(pick.overallPick)),
    Array.from({length: 160}, (_, index) => index + 1)
  );
  assert.equal(context.state.espn.draftComplete, true,
    'a false top-frame Rescan heartbeat must not override a complete authoritative numbered ledger');
  assert.equal(context.state.espn.expectedCompleted, 160);
  assert.equal(context.state.espn.currentPick, 160);

  await context.broadcastWarRoom(true);
  const snapshots = context.sent.filter(entry => entry.tabId === 22 && entry.message.type === 'WAR_ROOM_SNAPSHOT');
  const latestSnapshot = snapshots[snapshots.length - 1].message.snapshot;
  assert.equal(latestSnapshot.picks.length, 160);
  assert.equal(latestSnapshot.draftComplete, true);
  assert.equal(latestSnapshot.expectedCompleted, 160);

  listener({
    type: 'WAR_ROOM_ACK',
    result: {captured: 160, applied: 160, unmatched: []}
  }, {tab: {id: 22, url: context.warRoomUrl}}, () => {});
  await flush();
  await flush();
  assert.equal(context.state.warRoom.applied, 160);
  assert.equal(context.state.warRoom.acknowledgedCaptured, 160);
  assert.equal(context.state.espn.draftComplete, true,
    'a full War Room acknowledgment must leave Companion completion consistent with the complete ledger');
});
