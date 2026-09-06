'use strict';

if (typeof importScripts === 'function') importScripts('espn-live-capture.js');
var liveCapture = globalThis.WarRoomEspnLiveCapture;

var STORAGE_KEY = 'warRoomEspnCompanionStateV2';
var RETIRED_FANTASYPROS_KEY_STORAGE = 'warRoomFantasyProsApiKeyV1';
var WAR_ROOM_URLS = [
  'http://127.0.0.1/*',
  'http://localhost/*',
  'https://ryan42062001.github.io/Fantasy-Draft-Cheat-Sheet-2026/*'
];
var ESPN_URLS = [
  'https://fantasy.espn.com/*',
  'https://www.espn.com/fantasy/*'
];

function getExtensionVersion() {
  return chrome.runtime.getManifest().version;
}

var state = {
  config: {teams: 10, draftSlot: 1, rounds: 16},
  draftKey: null,
  picksByNumber: {},
  conflictsByPick: {},
  unresolvedPlayerIdsByPick: {},
  unavailablePlayersByKey: {},
  marketAdpByName: {},
  ledgerTeams: null,
  espn: {connected: false, draftPage: false, captured: 0, lastSeenAt: null},
  warRoom: {connected: false, applied: 0, unmatched: 0, lastSeenAt: null}
};

var activeEspnDraftTabId = null;
var storageWriteChain = Promise.resolve();
var storageWriteSerial = 0;
var STORAGE_WRITE_ATTEMPTS = 3;

function isStoredRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function clampStoredInteger(value, min, max, fallback) {
  var parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

function sanitizeStoredConfig(config) {
  config = isStoredRecord(config) ? config : {};
  var teams = clampStoredInteger(config.teams, 2, 20, 10);
  return {
    teams: teams,
    draftSlot: clampStoredInteger(config.draftSlot, 1, teams, 1),
    rounds: clampStoredInteger(config.rounds, 1, 30, 16)
  };
}

function sanitizeStoredDraftKey(value) {
  if (typeof value !== 'string') return null;
  var key = value.trim();
  return key && key.length <= 200 ? key : null;
}

function storedValues(value, limit) {
  if (!isStoredRecord(value)) return [];
  return Object.keys(value).slice(0, limit).map(function(key) { return value[key]; });
}

function sanitizeStoredConflictMap(value, totalPicks) {
  var source = isStoredRecord(value) ? value : {};
  var result = {};
  Object.keys(source).slice(0, totalPicks).forEach(function(key) {
    var pick = Number(key);
    if (!Number.isInteger(pick) || pick < 1 || pick > totalPicks) return;
    if (!isStoredRecord(source[key])) return;
    result[String(pick)] = source[key];
  });
  return result;
}

function sanitizeStoredUnresolvedMap(value, totalPicks) {
  var source = isStoredRecord(value) ? value : {};
  var result = {};
  Object.keys(source).slice(0, totalPicks).forEach(function(key) {
    var pick = Number(key);
    if (!Number.isInteger(pick) || pick < 1 || pick > totalPicks) return;
    var playerId = source[key] == null ? '' : String(source[key]).trim();
    if (!playerId) return;
    result[String(pick)] = playerId.slice(0, 40);
  });
  return result;
}

function restoreStoredMarketAdp(value) {
  state.marketAdpByName = {};
  storedValues(value, 2000).forEach(function(player) {
    if (!isStoredRecord(player)) return;
    var name = String(player.playerName || '').trim();
    var adp = Number(player.adp);
    var rank = Number(player.rank);
    if (!name || ((!Number.isFinite(adp) || adp <= 0) && (!Number.isFinite(rank) || rank <= 0))) return;
    state.marketAdpByName[name.toLowerCase()] = {
      playerName: name.slice(0, 100),
      position: String(player.position || '').slice(0, 4),
      adp: Number.isFinite(adp) && adp > 0 && adp <= 500 ? adp : null,
      rank: Number.isFinite(rank) && rank > 0 && rank <= 2000 ? rank : null
    };
  });
}

function storageGet() {
  return chrome.storage.local.get(STORAGE_KEY).then(function(result) {
    var stored = result && result[STORAGE_KEY];
    if (!isStoredRecord(stored)) return;

    state.config = sanitizeStoredConfig(stored.config);
    state.draftKey = sanitizeStoredDraftKey(stored.draftKey);
    var storedLedgerTeams = Number(stored.ledgerTeams);
    state.ledgerTeams = Number.isInteger(storedLedgerTeams) && storedLedgerTeams >= 2 && storedLedgerTeams <= 20
      ? storedLedgerTeams
      : null;
    state.espn = Object.assign({}, state.espn, isStoredRecord(stored.espn) ? stored.espn : {});
    state.warRoom = Object.assign({}, state.warRoom, isStoredRecord(stored.warRoom) ? stored.warRoom : {});
    state.picksByNumber = {};
    state.conflictsByPick = {};
    state.unresolvedPlayerIdsByPick = {};
    state.unavailablePlayersByKey = {};
    restoreStoredMarketAdp(stored.marketAdpByName);

    // Pick numbers parsed from R#/P# notation depend on league size. Older or
    // corrupt ledgers without matching provenance are discarded rather than
    // replayed with the wrong snake-draft math.
    if (!state.draftKey || state.ledgerTeams !== Number(state.config.teams)) {
      state.ledgerTeams = Number(state.config.teams);
      state.espn.captured = 0;
      state.espn.visibleCaptured = 0;
      return;
    }

    var totalPicks = state.config.teams * state.config.rounds;
    mergePicks(storedValues(stored.picksByNumber, totalPicks));
    mergeUnavailablePlayers(storedValues(stored.unavailablePlayersByKey, 2000));
    state.conflictsByPick = Object.assign(
      {},
      state.conflictsByPick,
      sanitizeStoredConflictMap(stored.conflictsByPick, totalPicks)
    );
    state.unresolvedPlayerIdsByPick = Object.assign(
      {},
      state.unresolvedPlayerIdsByPick,
      sanitizeStoredUnresolvedMap(stored.unresolvedPlayerIdsByPick, totalPicks)
    );
  });
}

function buildStorageSnapshot() {
  var snapshot = JSON.parse(JSON.stringify(state));
  if (snapshot.espn && typeof snapshot.espn === 'object') {
    delete snapshot.espn.storageWriteError;
    delete snapshot.espn.storageWriteFailedAt;
    delete snapshot.espn.storageWriteFailures;
    delete snapshot.espn.storageWritePending;
    delete snapshot.espn.lastStorageWriteAt;
    delete snapshot.espn.lastStorageWriteSerial;
  }
  return snapshot;
}

function waitForStorageRetry(attempt) {
  var delays = [0, 25, 100];
  var delay = delays[Math.min(attempt, delays.length - 1)];
  return new Promise(function(resolve) { setTimeout(resolve, delay); });
}

function writeStorageSnapshot(snapshot, attempt) {
  var payload = {};
  payload[STORAGE_KEY] = snapshot;
  return chrome.storage.local.set(payload).catch(function(error) {
    if (attempt + 1 >= STORAGE_WRITE_ATTEMPTS) throw error;
    return waitForStorageRetry(attempt).then(function() {
      return writeStorageSnapshot(snapshot, attempt + 1);
    });
  });
}

function updateStorageFailureBadge() {
  return Promise.all([
    chrome.action.setBadgeText({text: '!'}),
    chrome.action.setBadgeBackgroundColor({color: '#b3261e'})
  ]).catch(function() {});
}

function storageSave() {
  var snapshot = buildStorageSnapshot();
  var serial = ++storageWriteSerial;
  state.espn.storageWritePending = (Number(state.espn.storageWritePending) || 0) + 1;

  var operation = storageWriteChain
    .catch(function() {})
    .then(function() { return writeStorageSnapshot(snapshot, 0); })
    .then(function() {
      state.espn.storageWriteError = null;
      state.espn.storageWriteFailedAt = null;
      state.espn.lastStorageWriteAt = new Date().toISOString();
      state.espn.lastStorageWriteSerial = serial;
      return updateActionBadge();
    })
    .catch(function(error) {
      state.espn.storageWriteError = error && error.message ? error.message : String(error);
      state.espn.storageWriteFailedAt = new Date().toISOString();
      state.espn.storageWriteFailures = (Number(state.espn.storageWriteFailures) || 0) + 1;
      return updateStorageFailureBadge().then(function() { throw error; });
    })
    .finally(function() {
      state.espn.storageWritePending = Math.max(0, (Number(state.espn.storageWritePending) || 1) - 1);
    });

  storageWriteChain = operation.catch(function() {});
  return operation;
}

function updateActionBadge() {
  var count = getPicks().length;
  var text = count > 999 ? '999+' : count > 0 ? String(count) : '';
  return Promise.all([
    chrome.action.setBadgeText({text: text}),
    chrome.action.setBadgeBackgroundColor({color: '#2f7d4a'})
  ]).catch(function() {});
}

function retireFantasyProsApiState() {
  delete state.fantasyProsDiagnostics;
  delete state.fantasyProsTop20Preset;
  return chrome.storage.local.remove(RETIRED_FANTASYPROS_KEY_STORAGE)
    .then(storageSave)
    .catch(function() {});
}

var ready = storageGet().then(retireFantasyProsApiState).catch(function() {});
ready.then(updateActionBadge).catch(function() {});

function snakeTeamSlot(overallPick, teams) {
  overallPick = Number(overallPick);
  teams = Number(teams) || 10;
  if (!Number.isInteger(overallPick) || overallPick < 1) return null;
  var round = Math.ceil(overallPick / teams);
  var pickInRound = ((overallPick - 1) % teams) + 1;
  return round % 2 === 1 ? pickInRound : teams - pickInRound + 1;
}

function getPicks() {
  return Object.keys(state.picksByNumber)
    .map(function(key) { return state.picksByNumber[key]; })
    .filter(Boolean)
    .sort(function(a, b) { return Number(a.overallPick) - Number(b.overallPick); })
    .map(function(pick) {
      return Object.assign({}, pick, {
        teamSlot: snakeTeamSlot(pick.overallPick, state.config.teams)
      });
    });
}

function unavailablePlayerKey(player) {
  return String(player && player.playerName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim() + '|' + String(player && player.position || '').toUpperCase();
}

function mergeUnavailablePlayers(players) {
  (Array.isArray(players) ? players : []).forEach(function(player) {
    var playerName = String(player && player.playerName || '').trim();
    var position = String(player && player.position || '').toUpperCase();
    if (!playerName || ['QB', 'RB', 'WR', 'TE', 'K', 'DST'].indexOf(position) < 0) return;
    var normalized = {
      playerName: playerName.slice(0, 100),
      position: position,
      espnPlayerId: player.espnPlayerId == null ? null : String(player.espnPlayerId).slice(0, 40)
    };
    state.unavailablePlayersByKey[unavailablePlayerKey(normalized)] = normalized;
  });
}

function getUnavailablePlayers() {
  return Object.keys(state.unavailablePlayersByKey || {}).map(function(key) {
    return state.unavailablePlayersByKey[key];
  }).filter(Boolean);
}

function queryTabs(urls) {
  return chrome.tabs.query({url: urls}).catch(function() { return []; });
}

function sendTab(tabId, message) {
  return chrome.tabs.sendMessage(tabId, message);
}

function sendTabQuiet(tabId, message) {
  return sendTab(tabId, message).catch(function() {});
}

function injectWarRoomBridge(tab) {
  if (!tab || !tab.id) return Promise.resolve(false);
  return chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['war-room-content.js']
  }).then(function() {
    return true;
  }).catch(function() {
    return false;
  });
}

function deliverWarRoomSnapshot(tab, message) {
  if (!tab || !tab.id) return Promise.resolve(false);
  return sendTab(tab.id, message)
    .then(function() { return true; })
    .catch(function() {
      // Reloading or updating an unpacked extension invalidates the content
      // script in an already-open tab. Reinject the bridge before retrying so
      // a matching URL is not mistaken for a working connection.
      return injectWarRoomBridge(tab).then(function(injected) {
        if (!injected) return false;
        return sendTab(tab.id, message).then(function() { return true; }).catch(function() { return false; });
      });
    });
}

function injectEspnReader(tab) {
  if (!tab || !tab.id) return Promise.resolve();
  return chrome.scripting.executeScript({
    target: {tabId: tab.id, allFrames: true},
    files: ['espn-live-capture.js', 'espn-live-observer.js', 'espn-page-bridge.js'],
    world: 'MAIN',
    injectImmediately: true
  }).catch(function() {}).then(function() { return chrome.scripting.executeScript({
    target: {tabId: tab.id, allFrames: true},
    files: ['espn-live-capture.js', 'espn-api.js', 'espn-parser.js', 'espn-content.js']
  }); }).then(function() {
    return sendTabQuiet(tab.id, {type: 'COMPANION_CONFIG', config: state.config});
  }).catch(function() {});
}

function ensureEspnReader(tab, force) {
  if (!tab || !tab.id) return Promise.resolve();
  return sendTab(tab.id, {type: force ? 'RESCAN_ESPN' : 'COMPANION_CONFIG', config: state.config})
    .catch(function() { return injectEspnReader(tab); });
}

function ensureReadersInOpenEspnTabs(force) {
  return queryTabs(ESPN_URLS).then(function(tabs) {
    return Promise.all(tabs.map(function(tab) { return ensureEspnReader(tab, force); }));
  });
}

function broadcastWarRoom(force) {
  var picks = getPicks();
  return queryTabs(WAR_ROOM_URLS).then(function(tabs) {
    var message = {
        type: 'WAR_ROOM_SNAPSHOT',
        snapshot: {
          version: 1,
          extensionVersion: getExtensionVersion(),
          draftKey: state.draftKey,
          draftComplete: Boolean(state.espn.draftComplete),
          expectedCompleted: Number(state.espn.expectedCompleted) || 0,
          picks: picks,
          unavailablePlayers: getUnavailablePlayers(),
          marketAdp: Object.keys(state.marketAdpByName || {}).map(function(key) { return state.marketAdpByName[key]; }),
          marketUpdatedAt: state.espn.marketAdpAt || null,
          force: Boolean(force),
          config: Object.assign({}, state.config)
        }
      };
    return Promise.all(tabs.map(function(tab) {
      return deliverWarRoomSnapshot(tab, message);
    })).then(function(deliveries) {
      state.warRoom.connected = deliveries.some(Boolean);
      state.warRoom.deliveryError = tabs.length > 0 && !state.warRoom.connected
        ? 'War Room tab found, but the sync bridge could not be reached. Refresh the War Room tab.'
        : null;
      if (state.warRoom.connected) state.warRoom.lastDeliveredAt = new Date().toISOString();
      return deliveries;
    });
  });
}

function sendConfigToEspn() {
  return queryTabs(ESPN_URLS).then(function(tabs) {
    return Promise.all(tabs.map(function(tab) {
      return sendTabQuiet(tab.id, {type: 'COMPANION_CONFIG', config: state.config});
    }));
  });
}

function mergePicks(picks) {
  var totalPicks = Math.max(1, Number(state.config.teams) * Number(state.config.rounds));
  (Array.isArray(picks) ? picks : []).forEach(function(pick) {
    var overallPick = Number(pick && pick.overallPick);
    var playerName = String(pick && pick.playerName || '').trim();
    var playerId = pick && (pick.espnPlayerId || pick.playerId);
    if (!Number.isInteger(overallPick) || overallPick < 1 || overallPick > totalPicks) return;
    if (!playerName) {
      if (playerId != null) state.unresolvedPlayerIdsByPick[String(overallPick)] = String(playerId).slice(0, 40);
      return;
    }
    delete state.unresolvedPlayerIdsByPick[String(overallPick)];
    var source = String(pick.source || (pick.method === 'api' ? 'rest' : pick.method || 'dom')).slice(0, 20);
    var incoming = {
      overallPick: overallPick,
      playerName: playerName.slice(0, 100),
      position: String(pick.position || '').slice(0, 4),
      teamId: pick.teamId == null ? null : String(pick.teamId).slice(0, 40),
      isMine: typeof pick.isMine === 'boolean' ? pick.isMine : null,
      method: source.slice(0, 12),
      source: source,
      playerId: playerId == null ? null : String(playerId).slice(0, 40),
      espnPlayerId: playerId == null ? null : String(playerId).slice(0, 40),
      observedAt:pick.observedAt || new Date().toISOString()
    };
    var existing = state.picksByNumber[String(overallPick)] || null;
    var reconciled = liveCapture.reconcileObservation(existing, incoming);
    var entry = reconciled.entry;
    entry.espnPlayerId = entry.playerId || entry.espnPlayerId || null;
    entry.method = String(entry.source || entry.method || 'dom').slice(0, 12);
    state.picksByNumber[String(overallPick)] = entry;
    if (reconciled.conflict) state.conflictsByPick[String(overallPick)] = reconciled.conflict;
  });
  state.ledgerTeams = Number(state.config.teams);
  state.espn.captured = getPicks().length;
}

function draftKeyFromUrl(url) {
  try {
    var parsed = new URL(String(url || ''));
    var leagueId = parsed.searchParams.get('leagueId');
    var seasonId = parsed.searchParams.get('seasonId');
    var roomType = parsed.searchParams.get('draftId') ? 'draftId' :
      parsed.searchParams.get('mockDraftId') ? 'mockDraftId' :
      parsed.searchParams.get('roomId') ? 'roomId' : null;
    var roomId = roomType ? parsed.searchParams.get(roomType) : null;
    var leagueKey = /^\d+$/.test(String(leagueId || ''))
      ? String(seasonId || 'unknown') + ':' + String(leagueId)
      : null;
    if (leagueKey && !roomId) return leagueKey;

    var identity = roomId
      ? String(roomType) + '=' + String(roomId)
      : parsed.hostname + parsed.pathname;
    var hash = 2166136261;
    for (var index = 0; index < identity.length; index++) {
      hash ^= identity.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    var hashedIdentity = (hash >>> 0).toString(36);
    return leagueKey
      ? leagueKey + ':room:' + hashedIdentity
      : 'page:' + String(seasonId || 'unknown') + ':' + hashedIdentity;
  } catch (error) {
    return null;
  }
}

function resetEspnDraftProgress() {
  state.espn.captured = 0;
  state.espn.visibleCaptured = 0;
  state.espn.visibleCandidates = 0;
  state.espn.visibleRejected = 0;
  state.espn.currentPick = null;
  state.espn.expectedCompleted = 0;
  state.espn.draftComplete = false;
  state.espn.screenFrames = {};
  state.espn.apiPickFields = [];
  state.espn.liveCapture = {sources:{}, counters:{}, observations:0, candidates:0, latestPick:0};
  state.conflictsByPick = {};
  state.unresolvedPlayerIdsByPick = {};
}

function recordScreenFrame(sender, message) {
  var frameId = sender && Number.isInteger(sender.frameId) ? sender.frameId : -1;
  var key = String(frameId);
  if (!state.espn.screenFrames || typeof state.espn.screenFrames !== 'object') {
    state.espn.screenFrames = {};
  }
  var previous = state.espn.screenFrames[key] || {};
  state.espn.screenFrames[key] = {
    frameId: frameId,
    topFrame: Boolean(message.topFrame),
    picks: Math.max(Number(previous.picks) || 0, Number(message.captured) || Number(message.pickCount) || 0),
    candidates: Math.max(Number(previous.candidates) || 0, Number(message.candidates) || 0),
    rejected: Math.max(Number(previous.rejected) || 0, Number(message.rejected) || 0),
    parseFailureSamples: Array.isArray(message.parseFailureSamples)
      ? message.parseFailureSamples.slice(0, 8).map(function(value) { return String(value).slice(0, 180); })
      : previous.parseFailureSamples || [],
    currentPick: Math.max(Number(previous.currentPick) || 0, Number(message.currentPick) || 0),
    urlPath: String(message.url || '').replace(/^https?:\/\/[^/]+/i, '').slice(0, 160),
    lastSeenAt: new Date().toISOString()
  };
}

function espnSenderTabId(sender) {
  var tabId = sender && sender.tab ? Number(sender.tab.id) : NaN;
  return Number.isInteger(tabId) && tabId >= 0 ? tabId : null;
}

function looksLikeEspnDraftUrl(url) {
  try {
    var parsed = new URL(String(url || ''));
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname !== 'fantasy.espn.com' && parsed.hostname !== 'www.espn.com') return false;
    return /draft/i.test(parsed.pathname + parsed.search);
  } catch (error) {
    return false;
  }
}

function setActiveEspnDraftTab(tabId) {
  if (tabId == null || tabId === '') {
    activeEspnDraftTabId = null;
    return activeEspnDraftTabId;
  }
  var normalized = Number(tabId);
  activeEspnDraftTabId = Number.isInteger(normalized) && normalized >= 0 ? normalized : null;
  return activeEspnDraftTabId;
}

function syncActiveEspnDraftTabFromOpenTabs() {
  return queryTabs(ESPN_URLS).then(function(tabs) {
    var draftTabs = (Array.isArray(tabs) ? tabs : []).filter(function(tab) {
      return tab && Number.isInteger(Number(tab.id)) && looksLikeEspnDraftUrl(tab.url);
    });
    if (!draftTabs.length) return setActiveEspnDraftTab(null);
    var preferred = draftTabs.find(function(tab) { return Boolean(tab.active); });
    if (!preferred && state.draftKey) {
      preferred = draftTabs.find(function(tab) { return draftKeyFromUrl(tab.url) === state.draftKey; });
    }
    if (!preferred) {
      preferred = draftTabs.slice().sort(function(a, b) {
        return Number(b.lastAccessed) - Number(a.lastAccessed);
      })[0];
    }
    return setActiveEspnDraftTab(preferred && preferred.id);
  }).catch(function() {
    return activeEspnDraftTabId;
  });
}

function isDraftScopedEspnMessage(message) {
  var type = String(message && message.type || '');
  if (type === 'ESPN_HEARTBEAT') return Boolean(message && message.draftPage);
  return [
    'ESPN_PICKS_FOUND',
    'ESPN_LIVE_OBSERVATIONS',
    'ESPN_STRUCTURED_PICKS',
    'ESPN_API_STATUS',
    'ESPN_MARKET_ADP'
  ].indexOf(type) >= 0;
}

function rejectEspnDraftSender(tabId, nextKey, reason) {
  state.espn.ignoredDraftTabMessages = (Number(state.espn.ignoredDraftTabMessages) || 0) + 1;
  state.espn.lastIgnoredDraftTabId = tabId;
  state.espn.lastIgnoredDraftKey = nextKey;
  state.espn.lastIgnoredDraftReason = reason || 'inactive-tab';
  state.espn.lastIgnoredDraftAt = new Date().toISOString();
  return false;
}

function acceptEspnDraftSender(sender, message) {
  var tabId = espnSenderTabId(sender);
  var nextKey = draftKeyFromUrl(message && message.url);
  // Messages without a browser tab can only come from the extension itself.
  // Real ESPN content-script messages must identify the draft route they belong to
  // so malformed or stale payloads cannot mutate whichever ledger is currently active.
  if (tabId == null) return true;
  if (!nextKey) return rejectEspnDraftSender(tabId, null, 'missing-draft-key');
  var senderUrl = String(sender && sender.tab && sender.tab.url || '');
  if (senderUrl) {
    var senderKey = draftKeyFromUrl(senderUrl);
    if (!looksLikeEspnDraftUrl(senderUrl) || (senderKey && senderKey !== nextKey)) {
      return rejectEspnDraftSender(tabId, nextKey, 'route-mismatch');
    }
  }
  if (activeEspnDraftTabId == null) setActiveEspnDraftTab(tabId);
  if (tabId === activeEspnDraftTabId) return true;
  return rejectEspnDraftSender(tabId, nextKey, 'inactive-tab');
}

ready = ready.then(syncActiveEspnDraftTabFromOpenTabs).catch(function() {});

function activateDraft(url) {
  var nextKey = draftKeyFromUrl(url);
  if (!nextKey) return false;
  var changed = state.draftKey !== nextKey;
  if (changed) {
    state.draftKey = nextKey;
    state.picksByNumber = {};
    state.unavailablePlayersByKey = {};
    state.ledgerTeams = Number(state.config.teams);
    resetEspnDraftProgress();
    state.espn.structuredAt = null;
    state.espn.method = null;
    state.espn.apiAvailable = false;
    state.espn.apiComplete = false;
    state.espn.apiHttpStatus = null;
    state.espn.apiRole = null;
    state.espn.apiRawCount = 0;
    state.espn.apiResolved = 0;
    state.espn.apiUnresolved = 0;
    state.espn.apiError = null;
    state.espn.unresolvedPickNumbers = [];
    state.espn.unresolvedPickMetadata = {};
    state.warRoom.applied = 0;
    state.warRoom.unmatched = 0;
    state.warRoom.acknowledgedCaptured = 0;
    state.warRoom.lastRetryCaptured = null;
  }
  return changed;
}

function replacePicks(picks, method) {
  state.picksByNumber = {};
  mergePicks(picks);
  state.espn.method = method || 'api';
  state.espn.structuredAt = new Date().toISOString();
}

function reconcileStructuredPicks(picks, rawPickNumbers, unresolved, complete) {
  var previous = state.picksByNumber;
  var structured = {};
  (Array.isArray(picks) ? picks : []).forEach(function(pick) {
    structured[String(Number(pick.overallPick))] = pick;
  });
  var rawNumbers = (Array.isArray(rawPickNumbers) ? rawPickNumbers : [])
    .map(Number)
    .filter(function(number) {
      return Number.isInteger(number) && number > 0 &&
        number <= Number(state.config.teams) * Number(state.config.rounds);
    });
  var next = {};
  rawNumbers.forEach(function(number) {
    var key = String(number);
    if (structured[key]) next[key] = structured[key];
    else if (previous[key]) next[key] = previous[key];
  });
  state.picksByNumber = next;
  mergePicks(picks);
  state.espn.unresolvedPickNumbers = (Array.isArray(unresolved) ? unresolved : [])
    .map(function(item) { return Number(item && item.overallPick); })
    .filter(function(number) { return Number.isInteger(number) && number > 0; });
  state.espn.unresolvedPickMetadata = {};
  (Array.isArray(unresolved) ? unresolved : []).forEach(function(item) {
    var number = Number(item && item.overallPick);
    if (!Number.isInteger(number) || number < 1) return;
    state.espn.unresolvedPickMetadata[String(number)] = {
      teamId: item.teamId == null ? null : String(item.teamId),
      isMine: typeof item.isMine === 'boolean' ? item.isMine : null
    };
  });
  state.espn.method = complete ? 'api' : 'hybrid';
  state.espn.structuredAt = new Date().toISOString();
}

function mergeUnresolvedScreenPicks(picks) {
  var unresolvedNumbers = new Set(state.espn.unresolvedPickNumbers || []);
  var unresolvedMetadata = state.espn.unresolvedPickMetadata || {};
  mergePicks((Array.isArray(picks) ? picks : []).filter(function(pick) {
    return unresolvedNumbers.has(Number(pick && pick.overallPick));
  }).map(function(pick) {
    var metadata = unresolvedMetadata[String(Number(pick.overallPick))] || {};
    return Object.assign({}, pick, {
      teamId: metadata.teamId == null ? pick.teamId : metadata.teamId,
      isMine: typeof metadata.isMine === 'boolean' ? metadata.isMine : pick.isMine,
      method: 'hybrid'
    });
  }));
}

function structuredFeedIsFresh() {
  var timestamp = Date.parse(state.espn.structuredAt || '');
  return Number.isFinite(timestamp) && Date.now() - timestamp < 20000;
}

function liveCaptureIsFresh() {
  var timestamp = Date.parse(state.espn.liveStructuredAt || '');
  return Number.isFinite(timestamp) && Date.now() - timestamp < 20000;
}

function updateConfig(config) {
  config = config || {};
  var previousTeams = Number(state.config.teams);
  var teams = Math.max(2, Math.min(20, Number(config.teams) || previousTeams || 10));
  var next = {
    teams: teams,
    draftSlot: Math.max(1, Math.min(teams, Number(config.draftSlot) || state.config.draftSlot || 1)),
    rounds: Math.max(1, Math.min(30, Number(config.rounds) || state.config.rounds || 16))
  };
  var teamsChanged = previousTeams !== next.teams;

  state.config = next;
  if (teamsChanged) {
    state.picksByNumber = {};
    state.unavailablePlayersByKey = {};
    state.ledgerTeams = next.teams;
    resetEspnDraftProgress();
  }

  return {teamsChanged: teamsChanged};
}

function syncConfigAndReconcile(config, sendResponse) {
  var change = updateConfig(config);
  return storageSave()
    .then(sendConfigToEspn)
    .then(function() { return broadcastWarRoom(true); })
    .then(function() {
      return change.teamsChanged ? ensureReadersInOpenEspnTabs(true) : null;
    })
    .then(function() {
      if (typeof sendResponse === 'function') sendResponse(statusSnapshot());
    });
}

function statusSnapshot() {
  return {
    extensionVersion: getExtensionVersion(),
    config: state.config,
    picks: getPicks(),
    espn: state.espn,
    warRoom: state.warRoom
  };
}

function isTrustedWarRoomSender(sender, message) {
  var rawUrl = String(
    sender && sender.tab && sender.tab.url ||
    sender && sender.url ||
    message && message.url ||
    ''
  );
  if (!rawUrl) return false;
  try {
    var parsed = new URL(rawUrl);
    if (parsed.protocol === 'http:' && (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost')) {
      return true;
    }
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'ryan42062001.github.io') return false;
    return parsed.pathname === '/Fantasy-Draft-Cheat-Sheet-2026' ||
      parsed.pathname.indexOf('/Fantasy-Draft-Cheat-Sheet-2026/') === 0;
  } catch (error) {
    return false;
  }
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  ready.then(function() {
    if (!message || !message.type) return null;
    if (String(message.type).indexOf('WAR_ROOM_') === 0 && !isTrustedWarRoomSender(sender, message)) return null;

    var messageType = String(message.type);
    if (messageType.indexOf('ESPN_') === 0) {
      if (messageType === 'ESPN_HEARTBEAT' && message.topFrame && message.draftPage === false) {
        var leavingTabId = espnSenderTabId(sender);
        if (activeEspnDraftTabId != null && leavingTabId != null && leavingTabId !== activeEspnDraftTabId) return null;
        if (leavingTabId != null && leavingTabId === activeEspnDraftTabId) setActiveEspnDraftTab(null);
      } else if (isDraftScopedEspnMessage(message)) {
        if (!acceptEspnDraftSender(sender, message)) return storageSave();
        activateDraft(message.url);
      }
    }

    if (message.type === 'ESPN_CONTENT_READY') {
      state.espn.connected = true;
      state.espn.lastSeenAt = new Date().toISOString();
      state.espn.lastUrl = message.url || state.espn.lastUrl || null;
      if (sender.tab) sendTabQuiet(sender.tab.id, {type: 'COMPANION_CONFIG', config: state.config});
      return storageSave();
    }

    if (message.type === 'ESPN_HEARTBEAT') {
      recordScreenFrame(sender, message);
      state.espn.connected = true;
      if (message.draftPage || message.topFrame) {
        state.espn.draftPage = Boolean(message.draftPage);
      }
      state.espn.lastSeenAt = new Date().toISOString();
      state.espn.lastUrl = message.url || state.espn.lastUrl || null;
      if (Number.isFinite(Number(message.captured))) {
        state.espn.visibleCaptured = Math.max(Number(state.espn.visibleCaptured) || 0, Number(message.captured));
      }
      if (Number.isFinite(Number(message.candidates))) {
        state.espn.visibleCandidates = Math.max(Number(state.espn.visibleCandidates) || 0, Number(message.candidates));
      }
      if (Number.isFinite(Number(message.currentPick)) && Number(message.currentPick) > 0) {
        state.espn.currentPick = Math.max(Number(state.espn.currentPick) || 0, Number(message.currentPick));
        state.espn.expectedCompleted = Math.max(
          Number(state.espn.expectedCompleted) || 0,
          Number(message.currentPick) - 1
        );
      }
      // Readers run in every ESPN frame. A child frame may positively detect
      // completion, but it must not clear a completed state reported by the
      // top frame or another frame that can see the terminal board slot.
      if (message.topFrame || message.draftComplete) {
        state.espn.draftComplete = Boolean(message.draftComplete);
        if (message.draftComplete) {
          var terminalPickCount = Number(state.config.teams) * Number(state.config.rounds);
          state.espn.currentPick = Math.max(Number(state.espn.currentPick) || 0, terminalPickCount);
          state.espn.expectedCompleted = Math.max(Number(state.espn.expectedCompleted) || 0, terminalPickCount);
        }
      }
      var detectedRounds = Number(message.detectedRounds);
      var shouldUpdateRounds = Number.isInteger(detectedRounds) && detectedRounds >= 1 &&
        detectedRounds !== Number(state.config.rounds);
      if (shouldUpdateRounds) {
        updateConfig({
          teams: state.config.teams,
          draftSlot: state.config.draftSlot,
          rounds: detectedRounds
        });
        return storageSave()
          .then(sendConfigToEspn)
          .then(function() { return broadcastWarRoom(true); });
      }
      return storageSave();
    }

    if (message.type === 'ESPN_PICKS_FOUND') {
      recordScreenFrame(sender, message);
      mergeUnavailablePlayers(message.unavailablePlayers);
      if (liveCaptureIsFresh()) {
        mergePicks(message.picks);
        return storageSave().then(function() { return broadcastWarRoom(false); });
      }
      if (structuredFeedIsFresh() && state.espn.method === 'api') {
        return storageSave().then(function() { return broadcastWarRoom(false); });
      }
      if (structuredFeedIsFresh() && state.espn.method === 'hybrid') {
        mergeUnresolvedScreenPicks(message.picks);
      } else {
        mergePicks(message.picks);
        state.espn.method = 'dom';
      }
      state.espn.connected = true;
      state.espn.draftPage = true;
      state.espn.lastSeenAt = new Date().toISOString();
      state.espn.visibleRejected = Math.max(Number(state.espn.visibleRejected) || 0, Number(message.rejected) || 0);
      return storageSave().then(function() { return broadcastWarRoom(false); });
    }

    if (message.type === 'ESPN_LIVE_OBSERVATIONS') {
      var observations = Array.isArray(message.observations) ? message.observations.slice(0, 500) : [];
      mergePicks(observations);
      var source = String(message.source || 'network').slice(0, 20);
      var telemetry = liveCapture.sanitizeTelemetry(message.telemetry || {source:source});
      var live = state.espn.liveCapture && typeof state.espn.liveCapture === 'object'
        ? state.espn.liveCapture
        : {sources:{}, counters:{}, observations:0, candidates:0, latestPick:0};
      live.sources = Object.assign({}, live.sources || {});
      live.sources[source] = {
        active:true,
        lastSeenAt:new Date().toISOString(),
        sourceDetail:telemetry.sourceDetail,
        fields:telemetry.fields,
        candidateCount:Number(telemetry.candidateCount) || observations.length
      };
      live.counters = Object.assign({}, live.counters || {}, message.counters || {});
      live.observations = (Number(live.observations) || 0) + 1;
      live.candidates = (Number(live.candidates) || 0) + observations.length;
      observations.forEach(function(observation) {
        live.latestPick = Math.max(Number(live.latestPick) || 0, Number(observation.overallPick) || 0);
      });
      live.conflicts = Object.keys(state.conflictsByPick || {}).length;
      live.unresolvedPlayerIds = Object.keys(state.unresolvedPlayerIdsByPick || {}).length;
      state.espn.liveCapture = live;
      state.espn.liveStructuredAt = new Date().toISOString();
      state.espn.method = source === 'react' ? 'structured' : 'network';
      state.espn.connected = true;
      state.espn.draftPage = true;
      state.espn.lastSeenAt = new Date().toISOString();
      return storageSave().then(function() { return broadcastWarRoom(observations.length > 0); });
    }

    if (message.type === 'ESPN_STRUCTURED_PICKS') {
      reconcileStructuredPicks(
        message.picks,
        message.rawPickNumbers,
        message.unresolved,
        Boolean(message.complete)
      );
      state.espn.connected = true;
      state.espn.draftPage = true;
      state.espn.apiAvailable = true;
      state.espn.apiComplete = Boolean(message.complete);
      state.espn.apiRawCount = Number(message.rawCount) || getPicks().length;
      state.espn.apiScheduledCount = Number(message.scheduledCount) || state.espn.apiRawCount;
      state.espn.apiOpenSlots = Number(message.openSlotCount) || 0;
      state.espn.lastSuccessfulApiAt = new Date().toISOString();
      state.espn.lastSuccessfulApiResolved = getPicks().length;
      state.espn.lastSuccessfulApiRawCount = state.espn.apiRawCount;
      state.espn.lastSuccessfulApiHttpStatus = Number(message.httpStatus) || state.espn.apiHttpStatus || 200;
      state.espn.lastSeenAt = new Date().toISOString();
      return storageSave().then(function() { return broadcastWarRoom(true); });
    }

    if (message.type === 'ESPN_API_STATUS') {
      var terminalNotFound = !message.available && Number(message.httpStatus) === 404 &&
        Boolean(state.espn.draftComplete) && Boolean(state.espn.lastSuccessfulApiAt);
      state.espn.lastApiAttemptAt = new Date().toISOString();
      state.espn.lastApiAttemptHttpStatus = Number(message.httpStatus) || null;
      state.espn.lastApiAttemptError = message.error ? String(message.error).slice(0, 160) : null;
      if (terminalNotFound) {
        state.espn.apiPostDraftUnavailable = true;
        state.espn.apiError = 'ESPN closed the temporary draft feed after completion; retained the last successful structured snapshot.';
        return storageSave();
      }
      state.espn.apiPostDraftUnavailable = false;
      state.espn.apiAvailable = Boolean(message.available);
      state.espn.apiComplete = Boolean(message.complete);
      state.espn.apiHttpStatus = Number(message.httpStatus) || null;
      state.espn.apiRole = message.role ? String(message.role).slice(0, 40) : null;
      state.espn.apiTransport = message.transport ? String(message.transport).slice(0, 20) : null;
      state.espn.apiRawCount = Number(message.rawCount) || 0;
      state.espn.apiScheduledCount = Number(message.scheduledCount) || state.espn.apiRawCount;
      state.espn.apiOpenSlots = Number(message.openSlotCount) || 0;
      state.espn.apiResolved = Number(message.resolved) || 0;
      state.espn.apiUnresolved = Number(message.unresolved) || 0;
      state.espn.apiExpectedCompleted = Number(message.expectedCompleted) || 0;
      state.espn.expectedCompleted = Math.max(
        Number(state.espn.expectedCompleted) || 0,
        Number(message.expectedCompleted) || 0
      );
      if (Number(message.expectedCompleted) > 0) {
        state.espn.currentPick = Math.max(
          Number(state.espn.currentPick) || 0,
          Number(message.expectedCompleted) + 1
        );
      }
      state.espn.apiBehind = Boolean(message.behind);
      state.espn.apiPickFields = Array.isArray(message.pickFields)
        ? message.pickFields.slice(0, 20).map(String)
        : [];
      state.espn.apiError = message.error ? String(message.error).slice(0, 160) : null;
      if (message.available) {
        state.espn.lastSuccessfulApiAt = new Date().toISOString();
        state.espn.lastSuccessfulApiResolved = Number(message.resolved) || 0;
        state.espn.lastSuccessfulApiRawCount = Number(message.rawCount) || 0;
        state.espn.lastSuccessfulApiHttpStatus = Number(message.httpStatus) || 200;
      }
      if (message.behind) {
        state.espn.structuredAt = null;
        state.espn.method = 'dom';
      }
      if (!message.available && !structuredFeedIsFresh()) state.espn.method = 'dom';
      return storageSave();
    }

    if (message.type === 'ESPN_MARKET_ADP') {
      (Array.isArray(message.players) ? message.players : []).slice(0, 2000).forEach(function(player) {
        var name = String(player && player.playerName || '').trim();
        var adp = Number(player && player.adp);
        var rank = Number(player && player.rank);
        if (!name || ((!Number.isFinite(adp) || adp <= 0) && (!Number.isFinite(rank) || rank <= 0))) return;
        state.marketAdpByName[name.toLowerCase()] = {
          playerName: name.slice(0, 100),
          position: String(player.position || '').slice(0, 4),
          adp: Number.isFinite(adp) && adp > 0 && adp <= 500 ? adp : null,
          rank: Number.isFinite(rank) && rank > 0 && rank <= 2000 ? rank : null
        };
      });
      state.espn.marketAdpCount = Object.keys(state.marketAdpByName).length;
      state.espn.marketAdpAt = new Date().toISOString();
      return storageSave().then(function() { return broadcastWarRoom(true); });
    }

    if (message.type === 'WAR_ROOM_READY') {
      state.warRoom.connected = true;
      state.warRoom.lastSeenAt = new Date().toISOString();
      if (sender.tab) {
        sendTabQuiet(sender.tab.id, {
          type: 'WAR_ROOM_STATUS',
          status: state.espn.draftPage ? 'connected' : 'scanning',
          detail: state.espn.draftPage
            ? 'ESPN Sync · ' + getPicks().length + ' picks'
            : 'ESPN companion connected',
          extensionVersion: getExtensionVersion()
        });
        sendTabQuiet(sender.tab.id, {
          type: 'WAR_ROOM_SNAPSHOT',
          snapshot: {
            version: 1,
            extensionVersion: getExtensionVersion(),
            draftKey: state.draftKey,
            draftComplete: Boolean(state.espn.draftComplete),
            expectedCompleted: Number(state.espn.expectedCompleted) || 0,
            picks: getPicks(),
            unavailablePlayers: getUnavailablePlayers(),
            marketAdp: Object.keys(state.marketAdpByName || {}).map(function(key) { return state.marketAdpByName[key]; }),
            marketUpdatedAt: state.espn.marketAdpAt || null,
            config: Object.assign({}, state.config)
          }
        });
      }
      return storageSave();
    }

    if (message.type === 'WAR_ROOM_ACK') {
      var result = message.result || {};
      var acknowledgedCaptured = Number(result.captured) || 0;
      var previousAcknowledged = Number(state.warRoom.acknowledgedCaptured) || 0;
      var ledgerCaptured = getPicks().length;
      state.warRoom.connected = true;
      state.warRoom.lastSeenAt = new Date().toISOString();
      if (acknowledgedCaptured >= previousAcknowledged) {
        state.warRoom.acknowledgedCaptured = acknowledgedCaptured;
        state.warRoom.applied = Number(result.applied) || 0;
        state.warRoom.unmatched = Array.isArray(result.unmatched) ? result.unmatched.length : 0;
      }
      state.warRoom.requiredExtensionVersion = message.requiredExtensionVersion ||
        state.warRoom.requiredExtensionVersion || null;
      // The popup's saved settings are authoritative. A passive page ACK can
      // arrive before its persisted draft settings finish loading; accepting
      // those transient values here used to clear both Direct and Board picks.
      // Keep the page-reported values only as diagnostics.
      state.warRoom.reportedSettings = message.settings
        ? Object.assign({}, message.settings)
        : null;
      var effectiveAcknowledged = Math.max(previousAcknowledged, acknowledgedCaptured);
      var shouldRetry = effectiveAcknowledged < ledgerCaptured &&
        Number(state.warRoom.lastRetryCaptured) !== ledgerCaptured;
      if (shouldRetry) state.warRoom.lastRetryCaptured = ledgerCaptured;
      return storageSave().then(function() {
        return shouldRetry ? broadcastWarRoom(true) : null;
      });
    }

    if (message.type === 'WAR_ROOM_SETTINGS_UPDATE') {
      state.warRoom.connected = true;
      state.warRoom.lastSeenAt = new Date().toISOString();
      state.warRoom.requiredExtensionVersion = message.requiredExtensionVersion ||
        state.warRoom.requiredExtensionVersion || null;
      return syncConfigAndReconcile(message.config, sendResponse);
    }

    if (message.type === 'WAR_ROOM_RANKINGS_REFRESH') {
      return ensureReadersInOpenEspnTabs(true)
        .then(function() { return broadcastWarRoom(true); })
        .then(function() { if (typeof sendResponse === 'function') sendResponse(statusSnapshot()); });
    }

    if (message.type === 'GET_STATUS') {
      sendResponse(statusSnapshot());
      return null;
    }

    if (message.type === 'UPDATE_CONFIG') {
      return syncConfigAndReconcile(message.config, sendResponse);
    }

    if (message.type === 'RESCAN') {
      return ensureReadersInOpenEspnTabs(true)
        .then(function() { return broadcastWarRoom(true); })
        .then(function() { sendResponse(statusSnapshot()); });
    }

    if (message.type === 'RESET_PICKS') {
      state.picksByNumber = {};
      state.unavailablePlayersByKey = {};
      state.ledgerTeams = Number(state.config.teams);
      resetEspnDraftProgress();
      return storageSave()
        .then(function() { return broadcastWarRoom(true); })
        .then(function() { sendResponse(statusSnapshot()); });
    }

    return null;
  }).catch(function(error) {
    sendResponse({error: error && error.message ? error.message : String(error)});
  });

  return true;
});

chrome.runtime.onInstalled.addListener(function() {
  ready.then(function() {
    return Promise.all([ensureReadersInOpenEspnTabs(true), broadcastWarRoom(true)]);
  }).catch(function() {});
});

chrome.runtime.onStartup.addListener(function() {
  ready.then(function() {
    return Promise.all([ensureReadersInOpenEspnTabs(true), broadcastWarRoom(true)]);
  }).catch(function() {});
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  ready.then(function() {
    return queryTabs(ESPN_URLS);
  }).then(function(tabs) {
    var activated = (Array.isArray(tabs) ? tabs : []).find(function(tab) {
      return tab && Number(tab.id) === Number(activeInfo && activeInfo.tabId);
    });
    if (activated && looksLikeEspnDraftUrl(activated.url)) setActiveEspnDraftTab(activated.id);
  }).catch(function() {});
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  if (activeEspnDraftTabId != null && Number(tabId) === activeEspnDraftTabId) setActiveEspnDraftTab(null);
  ready.then(function() {
    return Promise.all([queryTabs(ESPN_URLS), queryTabs(WAR_ROOM_URLS)]);
  }).then(function(results) {
    state.espn.connected = results[0].length > 0;
    if (!results[1].length) {
      state.warRoom.connected = false;
      state.warRoom.deliveryError = null;
      return storageSave();
    }
    // A matching URL is not proof that the content bridge survived an
    // extension reload or tab lifecycle change. Verify actual delivery.
    return broadcastWarRoom(false).then(storageSave);
  }).catch(function() {});
});
