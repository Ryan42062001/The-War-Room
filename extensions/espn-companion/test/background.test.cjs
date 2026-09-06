const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadBackground(storedState, overrides = {}) {
  const listeners = {message: [], installed: [], startup: [], removed: [], activated: []};
  const removedStorageKeys = [];
  const chrome = {
    storage: {
      local: {
        get: async key => ({[key]: storedState}),
        set: async () => {},
        remove: async key => { removedStorageKeys.push(key); }
      }
    },
    action: {
      setBadgeText: async () => {},
      setBadgeBackgroundColor: async () => {}
    },
    runtime: {
      getManifest: () => ({version: '0.9.12'}),
      onMessage: {addListener: listener => listeners.message.push(listener)},
      onInstalled: {addListener: listener => listeners.installed.push(listener)},
      onStartup: {addListener: listener => listeners.startup.push(listener)}
    },
    tabs: {
      query: async () => [],
      sendMessage: async () => {},
      onRemoved: {addListener: listener => listeners.removed.push(listener)},
      onActivated: {addListener: listener => listeners.activated.push(listener)}
    },
    scripting: {executeScript: async () => {}}
  };
  const context = vm.createContext({
    chrome, console, Date, Promise, Object, Number, String, Boolean, Math, URL,
    fetch: overrides.fetch,
    setTimeout, clearTimeout, AbortController
  });
  const captureSource = fs.readFileSync(path.resolve(__dirname, '..', 'espn-live-capture.js'), 'utf8');
  vm.runInContext(captureSource, context);
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'background.js'), 'utf8');
  vm.runInContext(source, context);
  context.listeners = listeners;
  context.removedStorageKeys = removedStorageKeys;
  return context;
}

test('startup deletes the retired FantasyPros API credential and cache', async () => {
  const context = loadBackground({
    fantasyProsDiagnostics: {status:'error'},
    fantasyProsTop20Preset: {experts:[{id:'1'}]}
  });
  await context.ready;
  assert.deepEqual(Array.from(context.removedStorageKeys), ['warRoomFantasyProsApiKeyV1']);
  assert.equal('fantasyProsDiagnostics' in context.state, false);
  assert.equal('fantasyProsTop20Preset' in context.state, false);
});


test('discards a legacy pick ledger whose league-size provenance is unknown', async () => {
  const context = loadBackground({
    config: {teams: 12, draftSlot: 11, rounds: 16},
    picksByNumber: {'10': {overallPick: 10, playerName: 'Justin Jefferson', position: 'WR'}},
    espn: {captured: 1}
  });
  await context.ready;
  assert.equal(context.getPicks().length, 0);
  assert.equal(context.state.ledgerTeams, 12);
});

test('startup sanitizes corrupt stored settings and discards incompatible ledger state', async () => {
  const context = loadBackground({
    config: {teams: 999, draftSlot: -40, rounds: 999},
    draftKey: '2026:111',
    ledgerTeams: 999,
    picksByNumber: {'1': {overallPick: 1, playerName: 'Should Not Restore', position: 'WR'}},
    conflictsByPick: ['bad'],
    unresolvedPlayerIdsByPick: 'bad',
    unavailablePlayersByKey: ['bad'],
    marketAdpByName: 'bad',
    espn: {captured: 1, visibleCaptured: 1}
  });
  await context.ready;
  assert.equal(context.state.config.teams, 20);
  assert.equal(context.state.config.draftSlot, 1);
  assert.equal(context.state.config.rounds, 30);
  assert.equal(context.state.ledgerTeams, 20);
  assert.equal(context.getPicks().length, 0);
  assert.equal(context.state.espn.captured, 0);
  assert.equal(context.state.espn.visibleCaptured, 0);
  assert.equal(Object.keys(context.state.marketAdpByName).length, 0);
});

test('startup rejects malformed stored map shapes without breaking a valid league config', async () => {
  const context = loadBackground({
    config: {teams: 12, draftSlot: 11, rounds: 16},
    draftKey: '2026:111',
    ledgerTeams: 12,
    picksByNumber: ['not', 'a', 'pick-map'],
    conflictsByPick: 'bad',
    unresolvedPlayerIdsByPick: ['bad'],
    unavailablePlayersByKey: 'bad',
    marketAdpByName: ['bad'],
    espn: 'bad',
    warRoom: ['bad']
  });
  await context.ready;
  assert.equal(context.state.config.teams, 12);
  assert.equal(context.state.config.draftSlot, 11);
  assert.equal(context.state.config.rounds, 16);
  assert.equal(context.getPicks().length, 0);
  assert.equal(Object.keys(context.state.unavailablePlayersByKey).length, 0);
  assert.equal(Object.keys(context.state.marketAdpByName).length, 0);
});

test('startup preserves and normalizes a valid stored companion ledger', async () => {
  const context = loadBackground({
    config: {teams: 12, draftSlot: 11, rounds: 16},
    draftKey: '2026:111',
    ledgerTeams: 12,
    picksByNumber: {
      '1': {overallPick: 1, playerName: 'Justin Jefferson', position: 'WR', playerId: '123', source: 'websocket'},
      '999': {overallPick: 999, playerName: 'Out Of Range', position: 'RB'}
    },
    unavailablePlayersByKey: {
      one: {playerName: 'Unavailable Player', position: 'RB', espnPlayerId: '44'},
      bad: {playerName: '', position: 'WR'}
    },
    marketAdpByName: {
      one: {playerName: 'Market Player', position: 'WR', adp: 12.5, rank: 14},
      bad: {playerName: 'Bad Market Player', position: 'WR', adp: -1, rank: -1}
    },
    espn: {captured: 1}
  });
  await context.ready;
  assert.equal(context.state.config.teams, 12);
  assert.equal(context.state.config.draftSlot, 11);
  assert.equal(context.state.config.rounds, 16);
  assert.equal(context.getPicks().length, 1);
  assert.equal(context.getPicks()[0].playerName, 'Justin Jefferson');
  assert.equal(context.getPicks()[0].teamSlot, 1);
  assert.equal(context.state.espn.captured, 1);
  assert.equal(context.getUnavailablePlayers().length, 1);
  assert.equal(Object.keys(context.state.marketAdpByName).length, 1);
  assert.equal(context.state.marketAdpByName['market player'].adp, 12.5);
});

test('storage writes retry transient failures and persist the captured snapshot', async () => {
  const context = loadBackground(null);
  await context.ready;
  let attempts = 0;
  let saved = null;
  context.chrome.storage.local.set = async payload => {
    attempts += 1;
    if (attempts < 3) throw new Error('transient storage failure');
    saved = payload.warRoomEspnCompanionStateV2;
  };
  context.state.picksByNumber = {
    '1': {overallPick: 1, playerName: 'Persisted Player', position: 'WR'}
  };

  await context.storageSave();
  assert.equal(attempts, 3);
  assert.equal(saved.picksByNumber['1'].playerName, 'Persisted Player');
  assert.equal(context.state.espn.storageWriteError, null);
  assert.equal(context.state.espn.storageWritePending, 0);
});

test('persistent storage failures are surfaced after bounded retries', async () => {
  const context = loadBackground(null);
  await context.ready;
  let attempts = 0;
  context.chrome.storage.local.set = async () => {
    attempts += 1;
    throw new Error('storage unavailable');
  };

  await assert.rejects(context.storageSave(), /storage unavailable/);
  assert.equal(attempts, 3);
  assert.match(context.state.espn.storageWriteError, /storage unavailable/);
  assert.equal(context.state.espn.storageWritePending, 0);
  assert.ok(context.state.espn.storageWriteFailedAt);
});

test('storage writes are serialized so later snapshots cannot overtake earlier writes', async () => {
  const context = loadBackground(null);
  await context.ready;
  const writes = [];
  let releaseFirst = null;
  context.chrome.storage.local.set = payload => new Promise(resolve => {
    writes.push(JSON.parse(JSON.stringify(payload.warRoomEspnCompanionStateV2)));
    if (writes.length === 1) releaseFirst = resolve;
    else resolve();
  });

  context.state.picksByNumber = {
    '1': {overallPick: 1, playerName: 'First Snapshot', position: 'WR'}
  };
  const first = context.storageSave();
  await new Promise(resolve => setTimeout(resolve, 0));

  context.state.picksByNumber['2'] = {overallPick: 2, playerName: 'Second Snapshot', position: 'RB'};
  const second = context.storageSave();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(writes.length, 1);

  releaseFirst();
  await Promise.all([first, second]);
  assert.equal(writes.length, 2);
  assert.equal(Object.keys(writes[0].picksByNumber).length, 1);
  assert.equal(Object.keys(writes[1].picksByNumber).length, 2);
  assert.equal(writes[1].picksByNumber['2'].playerName, 'Second Snapshot');
});

test('changing team count clears picks parsed with the prior draft math', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.config = {teams: 10, draftSlot: 10, rounds: 16};
  context.state.ledgerTeams = 10;
  context.state.picksByNumber = {'10': {overallPick: 10, playerName: 'Justin Jefferson', position: 'WR'}};
  const change = context.updateConfig({teams: 12, draftSlot: 11, rounds: 16});
  assert.equal(change.teamsChanged, true);
  assert.equal(context.getPicks().length, 0);
  assert.equal(context.state.ledgerTeams, 12);
});

test('changing only the user slot preserves correctly numbered captured picks', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.config = {teams: 12, draftSlot: 10, rounds: 16};
  context.state.ledgerTeams = 12;
  context.state.picksByNumber = {'11': {overallPick: 11, playerName: 'CeeDee Lamb', position: 'WR'}};
  const change = context.updateConfig({teams: 12, draftSlot: 11, rounds: 16});
  assert.equal(change.teamsChanged, false);
  assert.equal(context.getPicks().length, 1);
  assert.equal(context.state.config.draftSlot, 11);
});

test('opening a different ESPN draft clears the previous mock ledger', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.draftKey = '2026:111';
  context.state.picksByNumber = {'1': {overallPick: 1, playerName: 'Ja\'Marr Chase', position: 'WR'}};
  context.state.espn.draftComplete = true;
  context.state.espn.currentPick = 161;
  context.state.espn.expectedCompleted = 160;
  assert.equal(
    context.activateDraft('https://fantasy.espn.com/football/draft?leagueId=222&seasonId=2026&teamId=14'),
    true
  );
  assert.equal(context.state.draftKey, '2026:222');
  assert.equal(context.getPicks().length, 0);
  assert.equal(context.state.espn.draftComplete, false);
  assert.equal(context.state.espn.currentPick, null);
  assert.equal(context.state.espn.expectedCompleted, 0);
});

test('same league draft rooms have distinct keys while team selection stays in the same room', async () => {
  const context = loadBackground(null);
  await context.ready;
  const roomA = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026&draftId=room-a&teamId=1';
  const roomASameDraftOtherTeam = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026&draftId=room-a&teamId=9';
  const roomB = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026&draftId=room-b&teamId=1';

  assert.equal(context.draftKeyFromUrl(roomA), context.draftKeyFromUrl(roomASameDraftOtherTeam));
  assert.notEqual(context.draftKeyFromUrl(roomA), context.draftKeyFromUrl(roomB));
});

test('opening a different room for the same league clears the previous ledger', async () => {
  const context = loadBackground(null);
  await context.ready;
  const roomA = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026&draftId=room-a';
  const roomB = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026&draftId=room-b';
  context.state.draftKey = context.draftKeyFromUrl(roomA);
  context.state.picksByNumber = {'1': {overallPick: 1, playerName: 'Old Room Player', position: 'WR'}};

  assert.equal(context.activateDraft(roomB), true);
  assert.notEqual(context.state.draftKey, context.draftKeyFromUrl(roomA));
  assert.equal(context.getPicks().length, 0);
});

test('same tab stale messages are rejected across different rooms in the same league', async () => {
  const context = loadBackground(null);
  await context.ready;
  const listener = context.listeners.message[0];
  const roomA = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026&draftId=room-a';
  const roomB = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026&draftId=room-b';

  listener({
    type: 'ESPN_PICKS_FOUND', url: roomB, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Room B Player', position: 'RB'}], unavailablePlayers: []
  }, {tab: {id: 11, url: roomB}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.getPicks()[0].playerName, 'Room B Player');

  listener({
    type: 'ESPN_PICKS_FOUND', url: roomA, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Stale Room A Player', position: 'WR'}], unavailablePlayers: []
  }, {tab: {id: 11, url: roomB}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.getPicks()[0].playerName, 'Room B Player');
  assert.equal(context.state.espn.lastIgnoredDraftReason, 'route-mismatch');
});

test('public mock pages receive a stable draft key without a league id', async () => {
  const context = loadBackground(null);
  await context.ready;
  const url = 'https://fantasy.espn.com/football/mockdraft?draftId=public-room-42&seasonId=2026';
  const first = context.draftKeyFromUrl(url);
  const second = context.draftKeyFromUrl(url);
  assert.match(first, /^page:2026:/);
  assert.equal(first, second);
});

test('live observations reconcile through the background ledger and expose conflicts', async () => {
  const context = loadBackground(null);
  await context.ready;
  const listener = context.listeners.message[0];
  const url = 'https://fantasy.espn.com/football/mockdraft?draftId=fixture&seasonId=2026';
  listener({type:'ESPN_LIVE_OBSERVATIONS', source:'websocket', url, observations:[{
    overallPick:1, playerId:'10', espnPlayerId:'10', playerName:'Player One', position:'WR', source:'websocket'
  }], telemetry:{source:'websocket',sourceDetail:'fantasy.espn.com/ws',candidateCount:1}, counters:{sockets:1}}, {}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  listener({type:'ESPN_LIVE_OBSERVATIONS', source:'dom', url, observations:[{
    overallPick:1, playerId:'20', espnPlayerId:'20', playerName:'Wrong Player', position:'RB', source:'dom'
  }], telemetry:{source:'dom',candidateCount:1}}, {}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.getPicks().length, 1);
  assert.equal(context.getPicks()[0].espnPlayerId, '10');
  assert.equal(context.state.espn.liveCapture.conflicts, 1);
  assert.equal(context.state.conflictsByPick['1'].incomingPlayerId, '20');
});

test('an embedded ESPN frame cannot clear a completed-draft heartbeat', async () => {
  const context = loadBackground(null);
  await context.ready;
  const listener = context.listeners.message[0];

  listener({type: 'ESPN_HEARTBEAT', topFrame: true, draftPage: true, draftComplete: true}, {}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.espn.draftComplete, true);

  listener({type: 'ESPN_HEARTBEAT', topFrame: false, draftPage: true, draftComplete: false}, {}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.espn.draftComplete, true);
});

test('terminal heartbeat reconciles expected progress to the configured final pick', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.config = {teams: 12, draftSlot: 5, rounds: 16};
  context.listeners.message[0]({
    type: 'ESPN_HEARTBEAT', topFrame: true, draftPage: true,
    draftComplete: true, currentPick: 192
  }, {}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.espn.currentPick, 192);
  assert.equal(context.state.espn.expectedCompleted, 192);
});

test('screen reconciliation rejects a false pick beyond the configured draft total', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.config = {teams: 12, draftSlot: 5, rounds: 16};
  context.mergePicks([
    {overallPick: 192, playerName: 'Final Valid Player', position: 'DST', method: 'dom'},
    {overallPick: 193, playerName: 'False Terminal Candidate', position: 'WR', method: 'dom'}
  ]);
  assert.equal(context.getPicks().length, 1);
  assert.equal(context.getPicks()[0].overallPick, 192);
});

test('post-draft 404 retains the last successful structured API evidence', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.espn.draftComplete = true;
  context.state.espn.apiAvailable = true;
  context.state.espn.apiComplete = true;
  context.state.espn.apiHttpStatus = 200;
  context.state.espn.apiResolved = 192;
  context.state.espn.apiRawCount = 192;
  context.state.espn.lastSuccessfulApiAt = '2026-08-24T03:20:00.000Z';
  context.state.espn.lastSuccessfulApiResolved = 192;
  context.state.espn.lastSuccessfulApiRawCount = 192;
  context.state.espn.lastSuccessfulApiHttpStatus = 200;

  context.listeners.message[0]({
    type: 'ESPN_API_STATUS', available: false, complete: false,
    httpStatus: 404, error: 'ESPN draft feed returned HTTP 404'
  }, {}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(context.state.espn.apiAvailable, true);
  assert.equal(context.state.espn.apiComplete, true);
  assert.equal(context.state.espn.apiResolved, 192);
  assert.equal(context.state.espn.apiPostDraftUnavailable, true);
  assert.match(context.state.espn.apiError, /retained the last successful structured snapshot/);
  assert.equal(context.state.espn.lastApiAttemptHttpStatus, 404);
});

test('smaller frame heartbeats cannot lower shared pick progress', async () => {
  const context = loadBackground(null);
  await context.ready;
  const listener = context.listeners.message[0];
  listener({type: 'ESPN_HEARTBEAT', topFrame: true, draftPage: true, currentPick: 142, captured: 132, candidates: 150}, {frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  listener({type: 'ESPN_HEARTBEAT', topFrame: false, draftPage: true, currentPick: 66, captured: 65, candidates: 70}, {frameId: 3}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.espn.currentPick, 142);
  assert.equal(context.state.espn.expectedCompleted, 141);
  assert.equal(context.state.espn.visibleCaptured, 132);
  assert.equal(context.state.espn.visibleCandidates, 150);
  assert.equal(context.state.espn.screenFrames['0'].picks, 132);
  assert.equal(context.state.espn.screenFrames['3'].picks, 65);
});

test('clearing captured picks also clears completion progress', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.espn.draftComplete = true;
  context.state.espn.currentPick = 161;
  context.state.espn.expectedCompleted = 160;

  context.listeners.message[0]({type: 'RESET_PICKS'}, {}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(context.state.espn.draftComplete, false);
  assert.equal(context.state.espn.currentPick, null);
  assert.equal(context.state.espn.expectedCompleted, 0);
});

test('partial structured data preserves screen names only for unresolved pick slots', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.picksByNumber = {
    '1': {overallPick: 1, playerName: 'Wrong Screen Name', position: 'WR', method: 'dom'},
    '2': {overallPick: 2, playerName: 'Screen Resolved Name', position: 'RB', method: 'dom'},
    '3': {overallPick: 3, playerName: 'Stale Pick', position: 'WR', method: 'dom'}
  };
  context.reconcileStructuredPicks(
    [{overallPick: 1, playerName: 'Direct Name', position: 'WR', teamId: '7', isMine: false, method: 'api'}],
    [1, 2],
    [{overallPick: 2, playerId: '99', teamId: '14', isMine: true}],
    false
  );
  const picks = context.getPicks();
  assert.equal(context.state.espn.method, 'hybrid');
  assert.deepEqual(context.state.espn.unresolvedPickNumbers, [2]);
  assert.equal(context.state.espn.unresolvedPickMetadata['2'].teamId, '14');
  assert.equal(context.state.espn.unresolvedPickMetadata['2'].isMine, true);
  assert.equal(picks.length, 2);
  assert.equal(picks[0].playerName, 'Direct Name');
  assert.equal(picks[0].method, 'api');
  assert.equal(picks[1].playerName, 'Screen Resolved Name');
});

test('hybrid name supplementation retains ESPN team ownership', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.espn.unresolvedPickNumbers = [2];
  context.state.espn.unresolvedPickMetadata = {
    '2': {teamId: '14', isMine: true}
  };
  context.mergeUnresolvedScreenPicks([
    {overallPick: 1, playerName: 'Ignored Player', position: 'WR', isMine: false},
    {overallPick: 2, playerName: 'Resolved Player', position: 'RB', isMine: null}
  ]);
  const picks = context.getPicks();
  assert.equal(picks.length, 1);
  assert.equal(picks[0].playerName, 'Resolved Player');
  assert.equal(picks[0].teamId, '14');
  assert.equal(picks[0].isMine, true);
  assert.equal(picks[0].method, 'hybrid');
});

test('complete structured data replaces stale screen picks', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.picksByNumber = {
    '1': {overallPick: 1, playerName: 'Stale Pick', position: 'WR', method: 'dom'}
  };
  context.reconcileStructuredPicks([], [], [], true);
  assert.equal(context.state.espn.method, 'api');
  assert.equal(context.getPicks().length, 0);
});

test('accumulates explicitly drafted labels as a late-round availability safeguard', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.mergeUnavailablePlayers([
    {playerName: 'Jalen Coker', position: 'WR', espnPlayerId: '123'},
    {playerName: 'Jalen Coker', position: 'WR', espnPlayerId: '123'}
  ]);
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.getUnavailablePlayers())),
    [{playerName: 'Jalen Coker', position: 'WR', espnPlayerId: '123'}]
  );
});

test('reinjects a stale War Room bridge before delivering a snapshot', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.draftKey = '2026:222';
  context.state.picksByNumber = {
    '1': {overallPick: 1, playerName: 'Ja\'Marr Chase', position: 'WR'}
  };
  let sends = 0;
  let injections = 0;
  context.chrome.tabs.query = async () => [{id: 44}];
  context.chrome.tabs.sendMessage = async (tabId, message) => {
    sends += 1;
    if (sends === 1) throw new Error('Receiving end does not exist');
    assert.equal(tabId, 44);
    assert.equal(message.snapshot.draftKey, '2026:222');
  };
  context.chrome.scripting.executeScript = async details => {
    injections += 1;
    assert.equal(Array.from(details.files).join(','), 'war-room-content.js');
  };

  const deliveries = await context.broadcastWarRoom(true);
  assert.deepEqual(Array.from(deliveries), [true]);
  assert.equal(sends, 2);
  assert.equal(injections, 1);
  assert.equal(context.state.warRoom.connected, true);
  assert.equal(context.state.warRoom.deliveryError, null);
});

test('does not report a matching War Room tab as connected when delivery fails', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.chrome.tabs.query = async () => [{id: 45}];
  context.chrome.tabs.sendMessage = async () => { throw new Error('No receiver'); };
  context.chrome.scripting.executeScript = async () => { throw new Error('Injection blocked'); };

  const deliveries = await context.broadcastWarRoom(true);
  assert.deepEqual(Array.from(deliveries), [false]);
  assert.equal(context.state.warRoom.connected, false);
  assert.match(context.state.warRoom.deliveryError, /Refresh the War Room tab/);
});

test('tab removal rechecks bridge delivery instead of trusting a matching URL', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.warRoom.connected = true;
  context.chrome.tabs.query = async query => Array.from(query.url).some(url => url.includes('github.io'))
    ? [{id: 46}]
    : [];
  context.chrome.tabs.sendMessage = async () => { throw new Error('No receiver'); };
  context.chrome.scripting.executeScript = async () => { throw new Error('Injection blocked'); };
  context.listeners.removed[0]();
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.warRoom.connected, false);
  assert.match(context.state.warRoom.deliveryError, /Refresh the War Room tab/);
});

test('a passive War Room acknowledgment cannot clear captured picks or overwrite popup settings', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.config = {teams: 12, draftSlot: 11, rounds: 16};
  context.state.ledgerTeams = 12;
  context.state.picksByNumber = {
    '1': {overallPick: 1, playerName: 'Ja\'Marr Chase', position: 'WR', method: 'api'}
  };

  context.listeners.message[0]({
    type: 'WAR_ROOM_ACK',
    result: {captured: 1, applied: 1, unmatched: []},
    settings: {teams: 10, draftSlot: 1, rounds: 16},
    requiredExtensionVersion: '0.8.2'
  }, {tab: {id: 44, url: 'https://ryan42062001.github.io/Fantasy-Draft-Cheat-Sheet-2026/'}}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(context.state.config.teams, 12);
  assert.equal(context.state.config.draftSlot, 11);
  assert.equal(context.getPicks().length, 1);
  assert.equal(context.state.warRoom.reportedSettings.teams, 10);
  assert.equal(context.state.warRoom.requiredExtensionVersion, '0.8.2');
});

test('late acknowledgments cannot lower applied progress and a trailing snapshot is resent once', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.config = {teams: 12, draftSlot: 5, rounds: 16};
  context.state.ledgerTeams = 12;
  for (let pick = 1; pick <= 192; pick++) {
    context.state.picksByNumber[String(pick)] = {
      overallPick: pick, playerName: 'Player ' + pick, position: 'WR', method: 'dom'
    };
  }
  let deliveries = 0;
  context.chrome.tabs.query = async query => Array.from(query.url).some(url => url.includes('github.io'))
    ? [{id: 44}]
    : [];
  context.chrome.tabs.sendMessage = async () => { deliveries++; };
  const listener = context.listeners.message[0];

  listener({type: 'WAR_ROOM_ACK', result: {captured: 192, applied: 192, unmatched: []}}, {tab: {id: 44, url: 'https://ryan42062001.github.io/Fantasy-Draft-Cheat-Sheet-2026/'}}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.warRoom.applied, 192);
  assert.equal(context.state.warRoom.acknowledgedCaptured, 192);

  listener({type: 'WAR_ROOM_ACK', result: {captured: 133, applied: 133, unmatched: []}}, {tab: {id: 44, url: 'https://ryan42062001.github.io/Fantasy-Draft-Cheat-Sheet-2026/'}}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.warRoom.applied, 192);
  assert.equal(context.state.warRoom.acknowledgedCaptured, 192);
  assert.equal(deliveries, 0);

  context.state.warRoom.applied = 133;
  context.state.warRoom.acknowledgedCaptured = 133;
  listener({type: 'WAR_ROOM_ACK', result: {captured: 133, applied: 133, unmatched: []}}, {tab: {id: 44, url: 'https://ryan42062001.github.io/Fantasy-Draft-Cheat-Sheet-2026/'}}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(deliveries, 1);
  assert.equal(context.state.warRoom.lastRetryCaptured, 192);

  listener({type: 'WAR_ROOM_ACK', result: {captured: 133, applied: 133, unmatched: []}}, {tab: {id: 44, url: 'https://ryan42062001.github.io/Fantasy-Draft-Cheat-Sheet-2026/'}}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(deliveries, 1);
});

test('an explicit War Room settings update becomes authoritative and preserves same-size picks', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.config = {teams: 12, draftSlot: 10, rounds: 16};
  context.state.ledgerTeams = 12;
  context.state.picksByNumber = {
    '11': {overallPick: 11, playerName: 'CeeDee Lamb', position: 'WR', method: 'dom'}
  };

  context.listeners.message[0]({
    type: 'WAR_ROOM_SETTINGS_UPDATE',
    config: {teams: 12, draftSlot: 11, rounds: 18},
    requiredExtensionVersion: '0.8.8'
  }, {tab: {id: 44, url: 'https://ryan42062001.github.io/Fantasy-Draft-Cheat-Sheet-2026/'}}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(context.state.config.draftSlot, 11);
  assert.equal(context.state.config.rounds, 18);
  assert.equal(context.getPicks().length, 1);
  assert.equal(context.state.warRoom.requiredExtensionVersion, '0.8.8');
});


test('rejects WAR_ROOM runtime messages from non-War Room tabs', async () => {
  const context = loadBackground(null);
  await context.ready;
  const before = JSON.parse(JSON.stringify(context.state.config));
  context.listeners.message[0]({
    type: 'WAR_ROOM_SETTINGS_UPDATE',
    config: {teams: 20, draftSlot: 20, rounds: 30},
    url: 'https://example.com/not-war-room'
  }, {tab: {id: 999, url: 'https://example.com/not-war-room'}}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.config.teams, before.teams);
  assert.equal(context.state.config.draftSlot, before.draftSlot);
  assert.equal(context.state.config.rounds, before.rounds);
  assert.equal(context.state.warRoom.connected, false);
});


test('non-draft ESPN content ready cannot replace an active draft ledger', async () => {
  const context = loadBackground(null);
  await context.ready;
  context.state.draftKey = '2026:111';
  context.state.ledgerTeams = 10;
  context.state.picksByNumber = {
    '1': {overallPick: 1, playerName: 'Active Draft Player', position: 'WR'}
  };
  const nonDraftUrl = 'https://fantasy.espn.com/football/team?leagueId=999&seasonId=2026';
  context.listeners.message[0](
    {type: 'ESPN_CONTENT_READY', url: nonDraftUrl},
    {tab: {id: 99, url: nonDraftUrl}},
    () => {}
  );
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.draftKey, '2026:111');
  assert.equal(context.getPicks().length, 1);
  assert.equal(context.getPicks()[0].playerName, 'Active Draft Player');
});

test('a second ESPN draft tab cannot replace the active ledger until the user activates it', async () => {
  const context = loadBackground(null);
  await context.ready;
  const listener = context.listeners.message[0];
  const urlA = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026';
  const urlB = 'https://fantasy.espn.com/football/draft?leagueId=222&seasonId=2026';

  listener({
    type: 'ESPN_PICKS_FOUND', url: urlA, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Draft A Player', position: 'WR'}],
    unavailablePlayers: []
  }, {tab: {id: 11, url: urlA}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.draftKey, '2026:111');
  assert.equal(context.getPicks()[0].playerName, 'Draft A Player');
  assert.equal(context.activeEspnDraftTabId, 11);

  listener({
    type: 'ESPN_PICKS_FOUND', url: urlB, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Draft B Player', position: 'RB'}],
    unavailablePlayers: []
  }, {tab: {id: 22, url: urlB}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.draftKey, '2026:111');
  assert.equal(context.getPicks()[0].playerName, 'Draft A Player');
  assert.equal(context.state.espn.ignoredDraftTabMessages, 1);

  context.chrome.tabs.query = async () => [
    {id: 11, url: urlA, active: false, lastAccessed: 1},
    {id: 22, url: urlB, active: true, lastAccessed: 2}
  ];
  context.listeners.activated[0]({tabId: 22});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.activeEspnDraftTabId, 22);

  listener({
    type: 'ESPN_PICKS_FOUND', url: urlB, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Draft B Player', position: 'RB'}],
    unavailablePlayers: []
  }, {tab: {id: 22, url: urlB}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.draftKey, '2026:222');
  assert.equal(context.getPicks().length, 1);
  assert.equal(context.getPicks()[0].playerName, 'Draft B Player');
});

test('removing the active ESPN draft tab releases ownership for another draft tab', async () => {
  const context = loadBackground(null);
  await context.ready;
  const listener = context.listeners.message[0];
  const urlA = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026';
  const urlB = 'https://fantasy.espn.com/football/draft?leagueId=222&seasonId=2026';

  listener({
    type: 'ESPN_PICKS_FOUND', url: urlA, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Draft A Player', position: 'WR'}], unavailablePlayers: []
  }, {tab: {id: 11, url: urlA}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.activeEspnDraftTabId, 11);

  context.chrome.tabs.query = async () => [];
  context.listeners.removed[0](11);
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.activeEspnDraftTabId, null);

  listener({
    type: 'ESPN_PICKS_FOUND', url: urlB, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Draft B Player', position: 'RB'}], unavailablePlayers: []
  }, {tab: {id: 22, url: urlB}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.activeEspnDraftTabId, 22);
  assert.equal(context.state.draftKey, '2026:222');
  assert.equal(context.getPicks()[0].playerName, 'Draft B Player');
});


test('same ESPN tab cannot apply a stale message from its previous draft route', async () => {
  const context = loadBackground(null);
  await context.ready;
  const listener = context.listeners.message[0];
  const urlA = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026';
  const urlB = 'https://fantasy.espn.com/football/draft?leagueId=222&seasonId=2026';

  listener({
    type: 'ESPN_PICKS_FOUND', url: urlA, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Draft A Player', position: 'WR'}], unavailablePlayers: []
  }, {tab: {id: 11, url: urlA}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.draftKey, '2026:111');
  assert.equal(context.getPicks()[0].playerName, 'Draft A Player');

  listener({
    type: 'ESPN_PICKS_FOUND', url: urlA, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Stale Draft A Player', position: 'RB'}], unavailablePlayers: []
  }, {tab: {id: 11, url: urlB}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.draftKey, '2026:111');
  assert.equal(context.getPicks()[0].playerName, 'Draft A Player');
  assert.equal(context.state.espn.lastIgnoredDraftReason, 'route-mismatch');

  listener({
    type: 'ESPN_PICKS_FOUND', url: urlB, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Draft B Player', position: 'RB'}], unavailablePlayers: []
  }, {tab: {id: 11, url: urlB}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.draftKey, '2026:222');
  assert.equal(context.getPicks()[0].playerName, 'Draft B Player');
});

test('stale draft messages are rejected after the owner tab navigates to a non-draft ESPN page', async () => {
  const context = loadBackground(null);
  await context.ready;
  const listener = context.listeners.message[0];
  const draftUrl = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026';
  const teamUrl = 'https://fantasy.espn.com/football/team?leagueId=111&seasonId=2026';

  listener({
    type: 'ESPN_PICKS_FOUND', url: draftUrl, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Good Player', position: 'WR'}], unavailablePlayers: []
  }, {tab: {id: 11, url: draftUrl}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));

  listener({
    type: 'ESPN_API_STATUS', url: draftUrl, available: false, error: 'late request'
  }, {tab: {id: 11, url: teamUrl}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.draftKey, '2026:111');
  assert.equal(context.getPicks()[0].playerName, 'Good Player');
  assert.equal(context.state.espn.lastIgnoredDraftReason, 'route-mismatch');
});


test('draft-scoped ESPN messages with a missing message URL cannot mutate the active ledger', async () => {
  const context = loadBackground(null);
  await context.ready;
  const listener = context.listeners.message[0];
  const draftUrl = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026';

  listener({
    type: 'ESPN_PICKS_FOUND', url: draftUrl, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Good Player', position: 'WR'}], unavailablePlayers: []
  }, {tab: {id: 11, url: draftUrl}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.state.draftKey, '2026:111');
  assert.equal(context.getPicks()[0].playerName, 'Good Player');

  listener({
    type: 'ESPN_PICKS_FOUND', topFrame: true,
    picks: [{overallPick: 1, playerName: 'Bad Missing URL Player', position: 'RB'}], unavailablePlayers: []
  }, {tab: {id: 11, url: draftUrl}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(context.state.draftKey, '2026:111');
  assert.equal(context.getPicks()[0].playerName, 'Good Player');
  assert.equal(context.state.espn.lastIgnoredDraftReason, 'missing-draft-key');
});

test('draft-scoped ESPN messages with a malformed message URL cannot mutate the active ledger', async () => {
  const context = loadBackground(null);
  await context.ready;
  const listener = context.listeners.message[0];
  const draftUrl = 'https://fantasy.espn.com/football/draft?leagueId=111&seasonId=2026';

  listener({
    type: 'ESPN_PICKS_FOUND', url: draftUrl, topFrame: true,
    picks: [{overallPick: 1, playerName: 'Good Player', position: 'WR'}], unavailablePlayers: []
  }, {tab: {id: 11, url: draftUrl}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));

  listener({
    type: 'ESPN_LIVE_OBSERVATIONS', url: 'not a valid url', source: 'websocket',
    observations: [{overallPick: 1, playerId: '999', playerName: 'Bad Malformed URL Player', position: 'RB'}]
  }, {tab: {id: 11, url: draftUrl}, frameId: 0}, () => {});
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(context.state.draftKey, '2026:111');
  assert.equal(context.getPicks()[0].playerName, 'Good Player');
  assert.equal(context.state.espn.lastIgnoredDraftReason, 'missing-draft-key');
});

test('ESPN content reader scopes async requests and dedupe signatures to their initiating draft route', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'espn-content.js'), 'utf8');
  assert.ok(source.includes("function captureRouteKey(url)"));
  assert.ok(source.includes("function captureRouteIsCurrent(routeKey, generation)"));
  assert.match(source, /apiScanRouteKey === scanKey/);
  assert.match(source, /lastApiRouteKey === scanKey/);
  assert.ok(source.includes("var signature = scanKey + '|' + JSON.stringify"));
  assert.ok(source.includes("if (!captureRouteIsCurrent(scanKey, scanGeneration)) return false;"));
  const structured = source.slice(source.indexOf('function scanStructuredDraft'), source.indexOf('function scanVisibleDraft'));
  assert.doesNotMatch(structured, /url: location.href/);
  assert.match(structured, /url: scanUrl/);
});
