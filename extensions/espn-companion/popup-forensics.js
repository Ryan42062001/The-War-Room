'use strict';

(function() {
  var core = globalThis.WarRoomEspnForensicCore;
  if (!core || !globalThis.chrome || !chrome.storage || !chrome.storage.local) return;

  var TRACE_PREFIX = 'warRoomEspnForensicFrameV1:';
  var POPUP_TRACE_KEY = 'warRoomEspnForensicPopupV1';
  var popupSequence = 0;
  var originalCopyText = typeof copyText === 'function' ? copyText : null;

  function popupEvent(category, action) {
    var at = Date.now();
    return {
      id:'popup-' + at.toString(36) + '-' + (++popupSequence).toString(36),
      at:at,
      category:category,
      source:'popup',
      action:action
    };
  }

  function appendPopupEvent(category, action) {
    return chrome.storage.local.get(POPUP_TRACE_KEY).then(function(result) {
      var stored = result && result[POPUP_TRACE_KEY];
      var events = stored && Array.isArray(stored.events) ? stored.events : [];
      var payload = {};
      payload[POPUP_TRACE_KEY] = {
        version:1,
        updatedAt:Date.now(),
        events:core.appendBounded(events, popupEvent(category, action), core.DEFAULT_LIMIT)
      };
      return chrome.storage.local.set(payload);
    }).catch(function() {});
  }

  function readStoredTimelines() {
    return chrome.storage.local.get(null).then(function(result) {
      return Object.keys(result || {}).filter(function(key) {
        return key === POPUP_TRACE_KEY || key.indexOf(TRACE_PREFIX) === 0;
      }).map(function(key) {
        var value = result[key];
        return value && Array.isArray(value.events) ? value.events : [];
      });
    }).catch(function() { return []; });
  }

  function probePageTimelines() {
    if (!chrome.scripting || typeof chrome.scripting.executeScript !== 'function' ||
        typeof pickDiagnosticEspnTab !== 'function') return Promise.resolve([]);
    return pickDiagnosticEspnTab().then(function(tab) {
      if (!tab || tab.id == null) return [];
      return chrome.scripting.executeScript({
        target:{tabId:tab.id, allFrames:true},
        world:'MAIN',
        func:function() {
          try {
            return typeof globalThis.__warRoomEspnForensicSnapshot === 'function'
              ? globalThis.__warRoomEspnForensicSnapshot()
              : null;
          } catch (error) { return null; }
        }
      }).then(function(results) {
        return (Array.isArray(results) ? results : []).map(function(result) {
          var value = result && result.result;
          return value && Array.isArray(value.events) ? value.events : [];
        });
      }).catch(function() { return []; });
    });
  }

  function currentStatusMarkers(status) {
    status = status || {};
    var warRoom = status.warRoom || {};
    var picks = Array.isArray(status.picks) ? status.picks : [];
    var latestPick = picks.reduce(function(maximum, pick) {
      return Math.max(maximum, Number(pick && pick.overallPick) || 0);
    }, 0);
    var events = [];
    var delivered = Date.parse(String(warRoom.lastDeliveredAt || ''));
    if (Number.isFinite(delivered)) {
      events.push({
        id:'status-delivery-' + core.stableHash(String(warRoom.lastDeliveredAt)),
        at:delivered,
        category:'snapshot-delivery',
        source:'war-room',
        ledgerCount:picks.length,
        latestPick:latestPick
      });
    }
    var acknowledged = Date.parse(String(warRoom.lastSeenAt || ''));
    if (Number.isFinite(acknowledged) && (Number(warRoom.applied) > 0 || Number(warRoom.acknowledgedCaptured) > 0)) {
      events.push({
        id:'status-ack-' + core.stableHash(String(warRoom.lastSeenAt) + '|' + Number(warRoom.applied) + '|' + Number(warRoom.acknowledgedCaptured)),
        at:acknowledged,
        category:'war-room-ack',
        source:'war-room',
        ledgerCount:picks.length,
        applied:Number(warRoom.applied) || 0,
        acknowledged:Number(warRoom.acknowledgedCaptured) || 0
      });
    }
    return events;
  }

  function collectTimeline() {
    return Promise.all([readStoredTimelines(), probePageTimelines()]).then(function(results) {
      var groups = [];
      groups = groups.concat(results[0] || []);
      groups = groups.concat(results[1] || []);
      groups.push(currentStatusMarkers(typeof latestStatus === 'object' ? latestStatus : {}));
      return core.mergeTimelines(groups, core.DEFAULT_LIMIT);
    });
  }

  function forensicStorageKeys() {
    return chrome.storage.local.get(null).then(function(result) {
      return Object.keys(result || {}).filter(function(key) {
        return key === POPUP_TRACE_KEY || key.indexOf(TRACE_PREFIX) === 0;
      });
    }).catch(function() { return []; });
  }

  function resetPageTimelines() {
    if (!chrome.scripting || typeof chrome.scripting.executeScript !== 'function' ||
        typeof pickDiagnosticEspnTab !== 'function') return Promise.resolve();
    return pickDiagnosticEspnTab().then(function(tab) {
      if (!tab || tab.id == null) return;
      return chrome.scripting.executeScript({
        target:{tabId:tab.id, allFrames:true},
        world:'MAIN',
        func:function() {
          try {
            return typeof globalThis.__warRoomEspnForensicReset === 'function'
              ? globalThis.__warRoomEspnForensicReset()
              : false;
          } catch (error) { return false; }
        }
      }).catch(function() {});
    });
  }

  function resetTraceOnly() {
    return Promise.all([forensicStorageKeys(), resetPageTimelines()]).then(function(results) {
      var keys = results[0] || [];
      return keys.length ? chrome.storage.local.remove(keys) : null;
    }).then(function() {
      return appendPopupEvent('baseline', 'reset');
    });
  }

  if (originalCopyText) {
    copyText = function(value) {
      return appendPopupEvent('diagnostic-marker', 'copy')
        .then(collectTimeline)
        .then(function(events) {
          var lines = core.formatForensicTimeline(events);
          var combined = String(value || '') + '\n' + lines.join('\n');
          if (globalThis.WarRoomEspnObservability &&
              typeof globalThis.WarRoomEspnObservability.redactKnownSecrets === 'function') {
            combined = globalThis.WarRoomEspnObservability.redactKnownSecrets(combined);
          }
          return originalCopyText(combined);
        });
    };
  }

  var rescan = document.getElementById('rescan');
  if (rescan) {
    rescan.addEventListener('click', function() {
      appendPopupEvent('rescan', 'rescan');
    }, true);
  }

  var resetTrace = document.getElementById('reset-trace');
  if (resetTrace) {
    resetTrace.addEventListener('click', function(event) {
      var button = event.currentTarget;
      button.disabled = true;
      button.textContent = 'Resetting trace…';
      resetTraceOnly().then(function() {
        button.textContent = 'Trace reset';
      }).catch(function() {
        button.textContent = 'Reset failed';
      }).finally(function() {
        setTimeout(function() {
          button.disabled = false;
          button.textContent = 'Reset trace';
        }, 1200);
      });
    });
  }

  globalThis.__warRoomEspnForensicPopup = {
    readStoredTimelines:readStoredTimelines,
    currentStatusMarkers:currentStatusMarkers,
    collectTimeline:collectTimeline,
    resetTraceOnly:resetTraceOnly
  };
})();
