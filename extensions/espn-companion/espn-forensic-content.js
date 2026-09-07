(function(root, factory) {
  'use strict';
  var api = factory(root && root.WarRoomEspnForensicCore);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root || !root.addEventListener || !root.chrome || !root.chrome.storage || !api.install) return;
  api.install(root, root.chrome);
})(typeof globalThis !== 'undefined' ? globalThis : null, function(core) {
  'use strict';

  var STORAGE_KEY = 'warRoomEspnCompanionStateV2';
  var TRACE_PREFIX = 'warRoomEspnForensicFrameV1:';
  var CHANNEL = 'WAR_ROOM_ESPN_FORENSIC';

  function latestPickFromState(stored) {
    var picks = stored && stored.picksByNumber && typeof stored.picksByNumber === 'object'
      ? Object.keys(stored.picksByNumber)
      : [];
    return picks.reduce(function(maximum, key) {
      var number = Number(key);
      return Number.isInteger(number) && number > maximum ? number : maximum;
    }, 0);
  }

  function ledgerCountFromState(stored) {
    var picks = stored && stored.picksByNumber && typeof stored.picksByNumber === 'object'
      ? stored.picksByNumber : {};
    return Object.keys(picks).filter(function(key) {
      return Number.isInteger(Number(key)) && Number(key) > 0;
    }).length;
  }

  function latestRestHttp(espn) {
    espn = espn || {};
    var attempted = Number(espn.lastApiAttemptHttpStatus) || 0;
    var current = Number(espn.apiHttpStatus) || 0;
    return attempted >= 400 ? attempted : current || attempted;
  }

  function restState(stored) {
    var espn = stored && stored.espn || {};
    var http = latestRestHttp(espn);
    var raw = Math.max(0, Number(espn.apiRawCount) || 0);
    if (http >= 400) return 'http-' + http;
    if (espn.apiAvailable && raw > 0) return 'picks';
    if (espn.apiAvailable && raw === 0) return 'empty-draft-detail';
    if (espn.apiBehind) return 'behind';
    return 'unavailable';
  }

  function sourceFromMethod(stored) {
    var method = String(stored && stored.espn && stored.espn.method || '');
    if (method === 'api') return 'rest';
    if (method === 'dom' || method === 'hybrid') return 'dom';
    if (method === 'structured') return 'react';
    if (method === 'network') return 'pipeline';
    return 'storage';
  }

  function safeTimestamp(value, fallback) {
    var parsed = Date.parse(String(value || ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function derivePipelineEvents(previous, current, now) {
    previous = previous && typeof previous === 'object' ? previous : {};
    current = current && typeof current === 'object' ? current : {};
    now = Number(now) || Date.now();
    var events = [];
    var previousCount = ledgerCountFromState(previous);
    var currentCount = ledgerCountFromState(current);
    var previousLatest = latestPickFromState(previous);
    var currentLatest = latestPickFromState(current);
    var source = sourceFromMethod(current);

    if (currentCount !== previousCount) {
      events.push({at:now, category:'ledger-count', source:source, ledgerCount:currentCount, latestPick:currentLatest});
    }
    if (currentLatest !== previousLatest) {
      events.push({at:now, category:'latest-pick', source:source, ledgerCount:currentCount, latestPick:currentLatest});
    }

    var previousRest = restState(previous);
    var currentRest = restState(current);
    if (currentRest !== previousRest) {
      var espn = current.espn || {};
      events.push({
        at:now,
        category:'rest-state',
        source:'rest',
        stateFrom:previousRest,
        stateTo:currentRest,
        http:latestRestHttp(espn),
        raw:Number(espn.apiRawCount) || 0,
        resolved:Number(espn.apiResolved) || 0,
        unresolved:Number(espn.apiUnresolved) || 0
      });
    }

    var previousWarRoom = previous.warRoom || {};
    var currentWarRoom = current.warRoom || {};
    if (String(currentWarRoom.lastDeliveredAt || '') &&
        String(currentWarRoom.lastDeliveredAt || '') !== String(previousWarRoom.lastDeliveredAt || '')) {
      events.push({
        at:safeTimestamp(currentWarRoom.lastDeliveredAt, now),
        category:'snapshot-delivery',
        source:'war-room',
        ledgerCount:currentCount,
        latestPick:currentLatest
      });
    }

    var previousApplied = Number(previousWarRoom.applied) || 0;
    var currentApplied = Number(currentWarRoom.applied) || 0;
    var previousAck = Number(previousWarRoom.acknowledgedCaptured) || 0;
    var currentAck = Number(currentWarRoom.acknowledgedCaptured) || 0;
    if (currentApplied !== previousApplied || currentAck !== previousAck ||
        String(currentWarRoom.lastSeenAt || '') !== String(previousWarRoom.lastSeenAt || '')) {
      events.push({
        at:safeTimestamp(currentWarRoom.lastSeenAt, now),
        category:'war-room-ack',
        source:'war-room',
        ledgerCount:currentCount,
        applied:currentApplied,
        acknowledged:currentAck
      });
    }
    return events;
  }

  function makeNonce(root) {
    try {
      if (root.crypto && root.crypto.getRandomValues) {
        var values = new Uint32Array(2);
        root.crypto.getRandomValues(values);
        return values[0].toString(36) + values[1].toString(36);
      }
    } catch (error) {}
    return Math.floor(Math.random() * 0xffffffff).toString(36) + Date.now().toString(36);
  }

  function install(root, chromeObject) {
    if (!root || !chromeObject || !core || root.__warRoomEspnForensicContentInstalledV1) return false;
    root.__warRoomEspnForensicContentInstalledV1 = true;
    var nonce = makeNonce(root).replace(/[^a-z0-9_-]/ig, '').slice(0, 32) || 'frame';
    var frameKey = TRACE_PREFIX + nonce;
    var sequence = 0;
    var timeline = [];
    var writeChain = Promise.resolve();
    var previousStored = null;
    var topFrame = false;
    try { topFrame = root.top === root; } catch (error) {}

    function persist() {
      var payload = {};
      payload[frameKey] = {version:1, updatedAt:Date.now(), events:timeline.slice()};
      writeChain = writeChain.catch(function() {}).then(function() {
        return chromeObject.storage.local.set(payload);
      }).catch(function() {});
      return writeChain;
    }

    function append(event) {
      var safe = core.sanitizeEvent(Object.assign({}, event || {}, {
        id:event && event.id || nonce + '-p' + (++sequence).toString(36)
      }));
      timeline = core.appendBounded(timeline, safe, core.DEFAULT_LIMIT);
      persist();
      return safe;
    }

    function resetLocal() {
      timeline = [];
      writeChain = writeChain.catch(function() {}).then(function() {
        return chromeObject.storage.local.remove(frameKey);
      }).catch(function() {});
    }

    root.addEventListener('message', function(event) {
      var message = event && event.data;
      if (event.source !== root || !message || message.channel !== CHANNEL) return;
      if (message.type === 'RESET') {
        resetLocal();
        return;
      }
      if (message.type !== 'EVENT') return;
      append(message.event);
    });

    if (topFrame && chromeObject.storage.onChanged && chromeObject.storage.onChanged.addListener) {
      chromeObject.storage.onChanged.addListener(function(changes, areaName) {
        if (areaName !== 'local' || !changes || !changes[STORAGE_KEY]) return;
        var change = changes[STORAGE_KEY];
        var oldValue = change.oldValue || previousStored || {};
        var newValue = change.newValue || {};
        derivePipelineEvents(oldValue, newValue, Date.now()).forEach(append);
        previousStored = newValue;
      });
      chromeObject.storage.local.get(STORAGE_KEY).then(function(result) {
        previousStored = result && result[STORAGE_KEY] || {};
      }).catch(function() { previousStored = {}; });
    }

    append({category:'frame-start', source:'storage', frame:topFrame ? 'top' : 'child', at:Date.now()});
    return true;
  }

  return {
    STORAGE_KEY:STORAGE_KEY,
    TRACE_PREFIX:TRACE_PREFIX,
    ledgerCountFromState:ledgerCountFromState,
    latestPickFromState:latestPickFromState,
    restState:restState,
    sourceFromMethod:sourceFromMethod,
    derivePipelineEvents:derivePipelineEvents,
    install:install
  };
});
