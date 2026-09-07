'use strict';

(function() {
  if (!globalThis.chrome || !chrome.scripting || !chrome.storage || typeof copyText !== 'function') return;

  var originalCopyText = copyText;
  var LIMIT = 48;
  var MECHANISMS = ['HTMLElement.click', 'dispatchEvent(click)', 'other-programmatic', 'trusted-user'];
  var CALLER_CLASSES = ['espn-script', 'extension-script', 'other-web-script', 'page-bundle', 'inline-page', 'user-input', 'unknown'];
  var VIEWS = ['players', 'pick-history', 'board', 'roster', 'unknown'];

  function safeToken(value, maximum, fallback) {
    var token = String(value || '').replace(/[^A-Za-z0-9_$<>.-]+/g, '').slice(0, maximum || 64);
    return token || fallback || '';
  }

  function sanitizeEvent(value) {
    value = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    var caller = value.caller && typeof value.caller === 'object' && !Array.isArray(value.caller) ? value.caller : {};
    var className = CALLER_CLASSES.indexOf(String(caller.className || '')) >= 0 ? String(caller.className) : 'unknown';
    var event = {
      at:Number.isFinite(Number(value.at)) ? Math.max(0, Math.trunc(Number(value.at))) : 0,
      click:value.click === 'trusted' ? 'trusted' : 'untrusted',
      mechanism:MECHANISMS.indexOf(String(value.mechanism || '')) >= 0 ? String(value.mechanism) : 'other-programmatic',
      view:VIEWS.indexOf(String(value.view || '')) >= 0 ? String(value.view) : 'unknown',
      frame:value.frame === 'top' ? 'top' : 'child',
      caller:{
        className:className,
        hash:/^[a-z0-9]{1,20}$/i.test(String(caller.hash || '')) ? String(caller.hash) : 'unknown'
      }
    };
    var script = safeToken(caller.script, 72, '');
    var functionName = safeToken(caller.functionName, 64, '');
    if (script) event.caller.script = script;
    if (functionName) event.caller.functionName = functionName;
    return event;
  }

  function mergeEvents(groups) {
    var seen = {};
    var merged = [];
    (Array.isArray(groups) ? groups : []).forEach(function(group) {
      (Array.isArray(group) ? group : []).forEach(function(value) {
        var event = sanitizeEvent(value);
        var key = [event.at, event.click, event.mechanism, event.view, event.frame, event.caller.className, event.caller.script || '', event.caller.functionName || '', event.caller.hash].join('|');
        if (seen[key]) return;
        seen[key] = true;
        merged.push(event);
      });
    });
    merged.sort(function(left, right) { return left.at - right.at; });
    return merged.length > LIMIT ? merged.slice(merged.length - LIMIT) : merged;
  }

  function formatEvents(events) {
    events = mergeEvents([events]);
    var lines = ['Recent synthetic navigation caller provenance (' + events.length + ' event' + (events.length === 1 ? '' : 's') + '):'];
    if (!events.length) return lines.concat('  none');
    var base = events[0].at;
    events.forEach(function(event) {
      var caller = event.caller.className;
      if (event.caller.script) caller += ':' + event.caller.script;
      if (event.caller.functionName) caller += ' fn=' + event.caller.functionName;
      caller += ' hash=' + event.caller.hash;
      lines.push('  +' + Math.max(0, event.at - base) + 'ms click=' + event.click +
        ' mechanism=' + event.mechanism + ' view=' + event.view + ' frame=' + event.frame + ' caller=' + caller);
    });
    return lines;
  }

  function pickEspnTab() {
    try {
      return typeof pickDiagnosticEspnTab === 'function' ? pickDiagnosticEspnTab() : Promise.resolve(null);
    } catch (error) {
      return Promise.resolve(null);
    }
  }

  function collectPageEvents() {
    return pickEspnTab().then(function(tab) {
      if (!tab || tab.id == null) return [];
      return chrome.scripting.executeScript({
        target:{tabId:tab.id, allFrames:true},
        world:'MAIN',
        func:function() {
          try {
            return typeof globalThis.__warRoomEspnClickProvenanceSnapshot === 'function'
              ? globalThis.__warRoomEspnClickProvenanceSnapshot()
              : null;
          } catch (error) { return null; }
        }
      }).then(function(results) {
        return mergeEvents((Array.isArray(results) ? results : []).map(function(result) {
          var snapshot = result && result.result;
          return snapshot && Array.isArray(snapshot.events) ? snapshot.events : [];
        }));
      }).catch(function() { return []; });
    });
  }

  function resetPageEvents() {
    return pickEspnTab().then(function(tab) {
      if (!tab || tab.id == null) return;
      return chrome.scripting.executeScript({
        target:{tabId:tab.id, allFrames:true},
        world:'MAIN',
        func:function() {
          try {
            return typeof globalThis.__warRoomEspnClickProvenanceReset === 'function'
              ? globalThis.__warRoomEspnClickProvenanceReset()
              : false;
          } catch (error) { return false; }
        }
      }).catch(function() {});
    });
  }

  copyText = function(value) {
    return collectPageEvents().catch(function() { return []; }).then(function(events) {
      var combined = String(value || '') + '\n' + formatEvents(events).join('\n');
      if (globalThis.WarRoomEspnObservability && typeof globalThis.WarRoomEspnObservability.redactKnownSecrets === 'function') {
        combined = globalThis.WarRoomEspnObservability.redactKnownSecrets(combined);
      }
      return originalCopyText(combined);
    });
  };

  var resetTrace = document.getElementById('reset-trace');
  if (resetTrace) {
    resetTrace.addEventListener('click', function() {
      resetPageEvents();
    }, true);
  }

  globalThis.__warRoomEspnClickProvenancePopup = {
    sanitizeEvent:sanitizeEvent,
    mergeEvents:mergeEvents,
    formatEvents:formatEvents,
    collectPageEvents:collectPageEvents,
    resetPageEvents:resetPageEvents
  };
})();
