(function(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.WarRoomEspnObservability = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  var HISTORY_SELECTORS = [
    '[class*="pickHistory" i]',
    '[class*="pick-history" i]',
    '[class*="draftHistory" i]',
    '[class*="draft-history" i]',
    '[data-testid*="pick-history" i]',
    '[data-testid*="draft-history" i]',
    '[aria-label*="pick history" i]'
  ];

  function stableHash(value) {
    var text = String(value || '');
    var hash = 2166136261;
    for (var index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function redactLeaguePath(pathname) {
    return String(pathname || '')
      .replace(/(\/leagues?\/)\d+/ig, '$1:league')
      .replace(/(\/league\/)(?:[A-Za-z0-9_-]{5,})/ig, '$1:league');
  }

  function safeRoute(value) {
    try {
      var parsed = new URL(String(value || ''), 'https://fantasy.espn.com');
      return parsed.hostname + redactLeaguePath(parsed.pathname).slice(0, 260);
    } catch (error) {
      return '';
    }
  }

  function anonymizeIdentifier(value) {
    var text = String(value || '').trim();
    return text ? 'anon-' + stableHash(text) : null;
  }

  function redactKnownSecrets(value) {
    var text = String(value == null ? '' : value);
    text = text.replace(/\b(espn_s2|swid|authorization|cookie|password|session(?:id|token)?|access[_-]?token|refresh[_-]?token)\b\s*[:=]\s*([^\s;&,]+)/ig,
      function(match, key) { return key + '=[redacted]'; });
    text = text.replace(/https?:\/\/[^\s)]+/ig, function(url) {
      var safe = safeRoute(url);
      return safe ? 'https://' + safe : '[redacted-url]';
    });
    text = text.replace(/(\/leagues?\/)\d+/ig, '$1:league');
    return text;
  }

  function nodeVisible(node, root) {
    if (!node) return false;
    if (node.hidden) return false;
    if (node.getAttribute && String(node.getAttribute('aria-hidden') || '').toLowerCase() === 'true') return false;
    var style = null;
    try {
      style = root && typeof root.getComputedStyle === 'function' ? root.getComputedStyle(node) : null;
    } catch (error) {}
    if (style) {
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
      if (String(style.opacity) === '0') return false;
    }
    if (typeof node.getClientRects === 'function') {
      try {
        if (!node.getClientRects().length) return false;
      } catch (error) {}
    }
    return true;
  }

  function tableLooksLikePickHistory(table) {
    if (!table) return false;
    var header = '';
    try {
      var head = table.querySelector && table.querySelector('thead');
      header = String((head || table).innerText || (head || table).textContent || '').slice(0, 500);
    } catch (error) {}
    return /\bPICK\b/i.test(header) && /\bPLAYER\b/i.test(header) && /\bTEAM\b/i.test(header);
  }

  function uniqueNodes(nodes) {
    var result = [];
    (Array.isArray(nodes) ? nodes : []).forEach(function(node) {
      if (node && result.indexOf(node) < 0) result.push(node);
    });
    return result;
  }

  function inspectPickHistoryDom(documentObject, root) {
    if (!documentObject || typeof documentObject.querySelectorAll !== 'function') {
      return {state:'unavailable', nodes:0, visibleNodes:0, rows:0};
    }
    var nodes = [];
    try {
      nodes = nodes.concat(Array.prototype.slice.call(documentObject.querySelectorAll(HISTORY_SELECTORS.join(','))));
      Array.prototype.slice.call(documentObject.querySelectorAll('table,[role="table"],[role="grid"]'))
        .slice(0, 100).forEach(function(table) {
          if (tableLooksLikePickHistory(table)) nodes.push(table);
        });
    } catch (error) {}
    nodes = uniqueNodes(nodes).slice(0, 100);
    var visibleNodes = nodes.filter(function(node) { return nodeVisible(node, root); });
    var rows = 0;
    nodes.forEach(function(node) {
      if (!node || typeof node.querySelectorAll !== 'function') return;
      try {
        rows += Math.min(600, node.querySelectorAll('tr,[role="row"],[data-testid*="pick" i]').length);
      } catch (error) {}
    });
    rows = Math.min(600, rows);
    return {
      state: !nodes.length ? 'absent' : visibleNodes.length ? 'mounted-visible' : 'mounted-hidden',
      nodes: nodes.length,
      visibleNodes: visibleNodes.length,
      rows: rows
    };
  }

  function copyWorkerTrace(value) {
    value = value && typeof value === 'object' ? value : {};
    return {
      workers: Math.max(0, Number(value.workers) || 0),
      workerMessages: Math.max(0, Number(value.workerMessages) || 0),
      workerCandidateMessages: Math.max(0, Number(value.workerCandidateMessages) || 0),
      workerCandidates: Math.max(0, Number(value.workerCandidates) || 0),
      sharedWorkers: Math.max(0, Number(value.sharedWorkers) || 0),
      sharedWorkerMessages: Math.max(0, Number(value.sharedWorkerMessages) || 0),
      sharedWorkerCandidateMessages: Math.max(0, Number(value.sharedWorkerCandidateMessages) || 0),
      sharedWorkerCandidates: Math.max(0, Number(value.sharedWorkerCandidates) || 0),
      latestPick: Math.max(0, Number(value.latestPick) || 0)
    };
  }

  function inspectPage(root) {
    root = root || (typeof window !== 'undefined' ? window : null);
    if (!root) return {route:'', visibility:'unknown', pickHistory:{state:'unavailable',nodes:0,visibleNodes:0,rows:0}, worker:copyWorkerTrace(null)};
    return {
      route: safeRoute(root.location && root.location.href),
      visibility: String(root.document && root.document.visibilityState || 'unknown').slice(0, 20),
      pickHistory: inspectPickHistoryDom(root.document, root),
      worker: copyWorkerTrace(root.__warRoomEspnWorkerObservabilityV1)
    };
  }

  function sourceLatestCandidates(sources, name) {
    var source = sources && sources[name] || {};
    return Math.max(0, Number(source.candidateCount) || 0);
  }

  function classifyRest(espn) {
    espn = espn || {};
    var http = Number(espn.apiHttpStatus || espn.lastApiAttemptHttpStatus) || 0;
    var raw = Math.max(0, Number(espn.apiRawCount) || 0);
    if (http >= 400) return 'http-' + http;
    if (espn.apiAvailable && raw > 0) return 'picks';
    if (espn.apiAvailable && raw === 0) return 'empty-draft-detail';
    if (espn.apiBehind) return 'behind';
    return 'unavailable';
  }

  function buildTraceSnapshot(status, pageProbe) {
    status = status || {};
    pageProbe = pageProbe || {};
    var espn = status.espn || {};
    var picks = Array.isArray(status.picks) ? status.picks : [];
    var live = espn.liveCapture || {};
    var counters = live.counters || {};
    var sources = live.sources || {};
    var latestPick = picks.reduce(function(maximum, pick) {
      return Math.max(maximum, Number(pick && pick.overallPick) || 0);
    }, 0);
    return {
      extensionVersion: String(status.extensionVersion || '').slice(0, 20),
      captureMethod: String(espn.method || 'none').slice(0, 20),
      ledgerCount: picks.length,
      latestPick: latestPick,
      confirmed: picks.length,
      conflicts: Math.max(0, Number(live.conflicts) || 0),
      unresolved: Math.max(0, Number(live.unresolvedPlayerIds) || 0),
      route: safeRoute(pageProbe.route || espn.lastUrl || ''),
      visibility: String(pageProbe.visibility || 'unknown').slice(0, 20),
      dom: pageProbe.pickHistory || {state:'unavailable',nodes:0,visibleNodes:0,rows:0},
      sources: {
        websocket: {observations:Math.max(0, Number(counters.socketMessages) || 0), latestCandidates:sourceLatestCandidates(sources, 'websocket')},
        fetch: {observations:Math.max(0, Number(counters.fetchResponses) || 0), latestCandidates:sourceLatestCandidates(sources, 'fetch')},
        xhr: {observations:Math.max(0, Number(counters.xhrResponses) || 0), latestCandidates:sourceLatestCandidates(sources, 'xhr')},
        eventsource: {observations:Math.max(0, Number(counters.eventSourceMessages) || 0), latestCandidates:sourceLatestCandidates(sources, 'eventsource')},
        react: {observations:Math.max(0, Number(counters.reactScans) || 0), latestCandidates:sourceLatestCandidates(sources, 'react')},
        dom: {observations:Math.max(0, Number(espn.visibleCandidates) || 0), latestCandidates:Math.max(0, Number(espn.visibleCaptured) || 0)},
        rest: {observations:Math.max(0, Number(espn.lastApiAttemptAt ? 1 : 0)), latestCandidates:Math.max(0, Number(espn.apiResolved) || 0)}
      },
      rest: {
        state: classifyRest(espn),
        http: Number(espn.apiHttpStatus || espn.lastApiAttemptHttpStatus) || 0,
        raw: Math.max(0, Number(espn.apiRawCount) || 0),
        resolved: Math.max(0, Number(espn.apiResolved) || 0),
        unresolved: Math.max(0, Number(espn.apiUnresolved) || 0)
      },
      worker: copyWorkerTrace(pageProbe.worker)
    };
  }

  function sourceDelta(previous, current, name) {
    var before = previous && previous.sources && previous.sources[name] || {};
    var after = current && current.sources && current.sources[name] || {};
    return (Number(after.observations) || 0) - (Number(before.observations) || 0);
  }

  function diffTrace(previous, current) {
    if (!previous) {
      return {baseline:false, routeChanged:false, domChanged:false, ledgerDelta:0, sourceDeltas:{}, workerMessageDelta:0, restChanged:false};
    }
    var sourceDeltas = {};
    ['websocket','fetch','xhr','eventsource','react','dom','rest'].forEach(function(name) {
      sourceDeltas[name] = sourceDelta(previous, current, name);
    });
    return {
      baseline:true,
      routeChanged:String(previous.route || '') !== String(current.route || ''),
      domChanged:String(previous.dom && previous.dom.state || '') !== String(current.dom && current.dom.state || ''),
      previousDom:String(previous.dom && previous.dom.state || 'unknown'),
      ledgerDelta:(Number(current.ledgerCount) || 0) - (Number(previous.ledgerCount) || 0),
      sourceDeltas:sourceDeltas,
      workerMessageDelta:(Number(current.worker && current.worker.workerMessages) || 0) +
        (Number(current.worker && current.worker.sharedWorkerMessages) || 0) -
        (Number(previous.worker && previous.worker.workerMessages) || 0) -
        (Number(previous.worker && previous.worker.sharedWorkerMessages) || 0),
      restChanged:String(previous.rest && previous.rest.state || '') !== String(current.rest && current.rest.state || ''),
      previousRest:String(previous.rest && previous.rest.state || 'unknown')
    };
  }

  function formatTraceLines(trace, delta) {
    trace = trace || buildTraceSnapshot({}, {});
    delta = delta || diffTrace(null, trace);
    var s = trace.sources || {};
    function pair(name) {
      var value = s[name] || {};
      return (Number(value.observations) || 0) + '/' + (Number(value.latestCandidates) || 0);
    }
    var worker = trace.worker || {};
    var lines = [
      'Trace route: ' + (trace.route || 'unknown') + ' · visibility ' + (trace.visibility || 'unknown'),
      'Pick History DOM: ' + (trace.dom && trace.dom.state || 'unknown') +
        ' · nodes ' + (Number(trace.dom && trace.dom.nodes) || 0) +
        ' · visible ' + (Number(trace.dom && trace.dom.visibleNodes) || 0) +
        ' · rows ' + (Number(trace.dom && trace.dom.rows) || 0),
      'Source observations/latest candidates: websocket ' + pair('websocket') +
        ' · fetch ' + pair('fetch') + ' · xhr ' + pair('xhr') +
        ' · eventsource ' + pair('eventsource') + ' · react ' + pair('react') +
        ' · dom ' + pair('dom'),
      'REST: ' + (trace.rest && trace.rest.state || 'unavailable') +
        ' · HTTP ' + (Number(trace.rest && trace.rest.http) || 'none') +
        ' · resolved/raw/unresolved ' + (Number(trace.rest && trace.rest.resolved) || 0) + '/' +
        (Number(trace.rest && trace.rest.raw) || 0) + '/' + (Number(trace.rest && trace.rest.unresolved) || 0),
      'Worker boundary: worker ' + (Number(worker.workers) || 0) + ' worker(s)/' +
        (Number(worker.workerMessages) || 0) + ' msg/' + (Number(worker.workerCandidates) || 0) + ' candidates · shared ' +
        (Number(worker.sharedWorkers) || 0) + '/' + (Number(worker.sharedWorkerMessages) || 0) + '/' +
        (Number(worker.sharedWorkerCandidates) || 0),
      'Ledger: ' + (Number(trace.ledgerCount) || 0) + ' pick(s) · latest #' +
        (Number(trace.latestPick) || 0) + ' · confirmed/conflicts/unresolved ' +
        (Number(trace.confirmed) || 0) + '/' + (Number(trace.conflicts) || 0) + '/' + (Number(trace.unresolved) || 0)
    ];
    if (!delta.baseline) {
      lines.push('Since previous copy: baseline created');
    } else {
      var d = delta.sourceDeltas || {};
      lines.push('Since previous copy: ledger ' + (delta.ledgerDelta >= 0 ? '+' : '') + delta.ledgerDelta +
        ' · ws ' + signed(d.websocket) + ' · fetch ' + signed(d.fetch) + ' · xhr ' + signed(d.xhr) +
        ' · sse ' + signed(d.eventsource) + ' · react ' + signed(d.react) + ' · dom ' + signed(d.dom) +
        ' · worker ' + signed(delta.workerMessageDelta) +
        ' · route ' + (delta.routeChanged ? 'changed' : 'same') +
        ' · DOM ' + (delta.domChanged ? delta.previousDom + '→' + (trace.dom && trace.dom.state || 'unknown') : 'same') +
        ' · REST ' + (delta.restChanged ? delta.previousRest + '→' + (trace.rest && trace.rest.state || 'unknown') : 'same'));
    }
    return lines;
  }

  function signed(value) {
    value = Number(value) || 0;
    return (value >= 0 ? '+' : '') + value;
  }

  function baselineFromTrace(trace) {
    return JSON.parse(JSON.stringify(trace || {}));
  }

  return {
    safeRoute:safeRoute,
    redactLeaguePath:redactLeaguePath,
    anonymizeIdentifier:anonymizeIdentifier,
    redactKnownSecrets:redactKnownSecrets,
    inspectPickHistoryDom:inspectPickHistoryDom,
    inspectPage:inspectPage,
    copyWorkerTrace:copyWorkerTrace,
    classifyRest:classifyRest,
    buildTraceSnapshot:buildTraceSnapshot,
    diffTrace:diffTrace,
    formatTraceLines:formatTraceLines,
    baselineFromTrace:baselineFromTrace,
    stableHash:stableHash
  };
});
