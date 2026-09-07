(function(root, factory) {
  'use strict';
  var api = factory(root && root.WarRoomEspnForensicCore);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root || !root.addEventListener || !api.install) return;
  if (api.install(root)) root.__warRoomEspnForensicObserverActiveVersion = api.runtimeVersion;
})(typeof globalThis !== 'undefined' ? globalThis : null, function(core) {
  'use strict';

  var RUNTIME_VERSION = '1';
  var CHANNEL = 'WAR_ROOM_ESPN_FORENSIC';
  var LIVE_CHANNEL = 'WAR_ROOM_ESPN_LIVE_OBSERVATION';

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

  function selectedView(documentObject) {
    if (!core || !documentObject || !documentObject.querySelectorAll) return 'unknown';
    var selectors = [
      '[role="tab"][aria-selected="true"]',
      '[role="tab"][aria-current="page"]',
      'nav [aria-current="page"]',
      '[data-testid*="tab" i][aria-selected="true"]',
      '[class*="tab" i][class*="active" i]'
    ];
    var candidates = [];
    try { candidates = Array.prototype.slice.call(documentObject.querySelectorAll(selectors.join(','))).slice(0, 40); }
    catch (error) {}
    for (var index = 0; index < candidates.length; index++) {
      var view = core.classifyViewNode(candidates[index]);
      if (view !== 'unknown') return view;
    }
    return 'unknown';
  }

  function navigationTarget(node) {
    var cursor = node;
    var hops = 0;
    while (cursor && hops++ < 6) {
      var tag = String(cursor.tagName || '').toLowerCase();
      var role = cursor.getAttribute ? String(cursor.getAttribute('role') || '').toLowerCase() : '';
      if (tag === 'a' || tag === 'button' || role === 'tab' || role === 'button') return cursor;
      cursor = cursor.parentElement;
    }
    return null;
  }

  function looksLikeNavigationControl(node) {
    if (!node) return false;
    var role = node.getAttribute ? String(node.getAttribute('role') || '').toLowerCase() : '';
    if (role === 'tab') return true;
    var parent = node.parentElement;
    var hops = 0;
    while (parent && hops++ < 4) {
      var tag = String(parent.tagName || '').toLowerCase();
      var parentRole = parent.getAttribute ? String(parent.getAttribute('role') || '').toLowerCase() : '';
      var className = typeof parent.className === 'string' ? parent.className : '';
      if (tag === 'nav' || parentRole === 'tablist' || /(?:nav|tabs?)/i.test(className)) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  function wrapHistoryMethod(historyObject, name, after) {
    if (!historyObject || typeof historyObject[name] !== 'function') return false;
    var nativeMethod = historyObject[name];
    if (nativeMethod.__warRoomEspnForensicWrapped) return true;
    var wrapped;
    if (typeof Proxy === 'function' && typeof Reflect !== 'undefined' && Reflect.apply) {
      wrapped = new Proxy(nativeMethod, {
        apply:function(Target, thisArg, args) {
          var result = Reflect.apply(Target, thisArg, args);
          after(name);
          return result;
        }
      });
    } else {
      wrapped = function() {
        var result = nativeMethod.apply(this, arguments);
        after(name);
        return result;
      };
    }
    try { Object.defineProperty(wrapped, '__warRoomEspnForensicWrapped', {value:true}); } catch (error) {}
    historyObject[name] = wrapped;
    return true;
  }

  function candidateLatestPick(candidates) {
    return (Array.isArray(candidates) ? candidates : []).reduce(function(maximum, candidate) {
      return Math.max(maximum, Number(candidate && candidate.overallPick) || 0);
    }, 0);
  }

  function install(root) {
    if (!root || !core || root.__warRoomEspnForensicObserverInstalledV1) return false;
    root.__warRoomEspnForensicObserverInstalledV1 = true;

    var nonce = makeNonce(root).replace(/[^a-z0-9_-]/ig, '').slice(0, 32) || 'frame';
    var sequence = 0;
    var startedAt = Date.now();
    var timeline = [];
    var lastClick = null;
    var lastRoute = core.safeRoute(root.location && root.location.href);
    var lastDom = 'unknown';
    var lastView = 'unknown';
    var lastVisibility = String(root.document && root.document.visibilityState || 'unknown').slice(0, 20);
    var pendingProbe = null;
    var mutationObserver = null;

    function localRecord(category, source, data, publish) {
      var now = Date.now();
      var safe = core.sanitizeEvent(Object.assign({}, data || {}, {
        id:nonce + '-' + (++sequence).toString(36),
        at:now,
        ms:Math.max(0, now - startedAt),
        category:category,
        source:source
      }));
      timeline = core.appendBounded(timeline, safe, core.DEFAULT_LIMIT);
      root.__warRoomEspnForensicTimelineV1 = {startedAt:startedAt, events:timeline.slice()};
      if (publish !== false && root.postMessage) {
        root.postMessage({channel:CHANNEL, type:'EVENT', event:safe}, '*');
      }
      return safe;
    }

    root.__warRoomEspnForensicRecord = function(category, source, data) {
      return localRecord(category, source, data, true);
    };
    root.__warRoomEspnForensicReset = function() {
      startedAt = Date.now();
      sequence = 0;
      timeline = [];
      localRecord('baseline', 'page', {action:'reset'}, false);
      if (root.postMessage) root.postMessage({channel:CHANNEL, type:'RESET', at:startedAt}, '*');
      return true;
    };
    root.__warRoomEspnForensicSnapshot = function() {
      return {startedAt:startedAt, events:timeline.slice()};
    };

    function pickHistoryState() {
      var observability = root.WarRoomEspnObservability;
      if (!observability || typeof observability.inspectPickHistoryDom !== 'function') return 'unavailable';
      try { return observability.inspectPickHistoryDom(root.document, root).state || 'unknown'; }
      catch (error) { return 'unavailable'; }
    }

    function probe(reason, forceRouteEvent) {
      pendingProbe = null;
      var route = core.safeRoute(root.location && root.location.href);
      if (forceRouteEvent || route !== lastRoute) {
        localRecord('route-change', 'history', {
          action:reason,
          route:route,
          routeChanged:route !== lastRoute
        });
        lastRoute = route;
      }

      var dom = pickHistoryState();
      if (dom !== lastDom) {
        localRecord('pick-history-dom', 'page', {action:reason || 'mutation', stateFrom:lastDom, stateTo:dom});
        lastDom = dom;
      }

      var view = selectedView(root.document);
      if (view === 'unknown' && dom === 'mounted-visible') view = 'pick-history';
      if (view !== lastView) {
        localRecord('view-change', 'page', {
          action:reason || 'selection',
          stateFrom:lastView,
          stateTo:view,
          view:view,
          click:core.recentClickProvenance(lastClick, view, Date.now())
        });
        lastView = view;
      }

      var visibility = String(root.document && root.document.visibilityState || 'unknown').slice(0, 20);
      if (visibility !== lastVisibility) {
        localRecord('visibility-change', 'page', {action:'visibility'});
        lastVisibility = visibility;
      }
    }

    function scheduleProbe(reason, forceRouteEvent) {
      if (pendingProbe && root.clearTimeout) root.clearTimeout(pendingProbe);
      if (root.setTimeout) pendingProbe = root.setTimeout(function() { probe(reason, forceRouteEvent); }, 0);
      else probe(reason, forceRouteEvent);
    }

    wrapHistoryMethod(root.history, 'pushState', function(name) { scheduleProbe(name, true); });
    wrapHistoryMethod(root.history, 'replaceState', function(name) { scheduleProbe(name, true); });
    root.addEventListener('popstate', function() { scheduleProbe('popstate', true); });
    root.addEventListener('hashchange', function() { scheduleProbe('hashchange', true); });
    root.addEventListener('visibilitychange', function() { scheduleProbe('visibility', false); });

    if (root.document && root.document.addEventListener) {
      root.document.addEventListener('click', function(event) {
        var target = navigationTarget(event && event.target);
        if (!target) return;
        var view = core.classifyViewNode(target);
        if (view === 'unknown' && !looksLikeNavigationControl(target)) return;
        var trust = core.clickTrust(event);
        lastClick = {at:Date.now(), click:trust, view:view};
        localRecord('navigation-click', 'click', {action:'click', view:view, click:trust});
        scheduleProbe('selection', false);
      }, true);
    }

    root.addEventListener('message', function(event) {
      var message = event && event.data;
      if (event.source !== root || !message || message.channel !== LIVE_CHANNEL) return;
      if (message.type !== 'OBSERVATION' && message.type !== 'TELEMETRY') return;
      var telemetry = message.telemetry && typeof message.telemetry === 'object' ? message.telemetry : {};
      var source = String(message.source || telemetry.source || 'unknown').toLowerCase();
      var count = Math.max(0, Number(telemetry.candidateCount) || (Array.isArray(message.candidates) ? message.candidates.length : 0));
      var fingerprint = core.fingerprintFromFields(
        telemetry.fields,
        telemetry.sourceDetail,
        message.detail && message.detail.payloadType
      );
      localRecord('source-observation', source, {
        candidates:count,
        fingerprint:count > 0 ? null : fingerprint
      });
      if (count > 0) {
        localRecord('candidate-recognized', source, {
          candidates:count,
          latestPick:candidateLatestPick(message.candidates)
        });
      }
    });

    function startDomObservation() {
      probe('mutation', false);
      if (typeof root.MutationObserver === 'function' && root.document && root.document.documentElement) {
        mutationObserver = new root.MutationObserver(function() { scheduleProbe('mutation', false); });
        try { mutationObserver.observe(root.document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['class','aria-selected','aria-current','hidden','style']}); }
        catch (error) {}
      }
      if (root.setInterval) root.setInterval(function() { probe('selection', false); }, 750);
    }

    if (root.document && root.document.readyState === 'loading' && root.document.addEventListener) {
      root.document.addEventListener('DOMContentLoaded', startDomObservation, {once:true});
    } else startDomObservation();

    localRecord('frame-start', 'page', {frame:(function() {
      try { return root.top === root ? 'top' : 'child'; } catch (error) { return 'child'; }
    })()});
    return true;
  }

  return {
    runtimeVersion:RUNTIME_VERSION,
    selectedView:selectedView,
    navigationTarget:navigationTarget,
    looksLikeNavigationControl:looksLikeNavigationControl,
    wrapHistoryMethod:wrapHistoryMethod,
    candidateLatestPick:candidateLatestPick,
    install:install
  };
});
