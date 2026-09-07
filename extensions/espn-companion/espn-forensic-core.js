(function(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.WarRoomEspnForensicCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  var DEFAULT_LIMIT = 80;
  var CATEGORY_VALUES = [
    'baseline','source-observation','candidate-recognized','ledger-count','latest-pick',
    'pick-history-dom','view-change','route-change','navigation-click','visibility-change',
    'rest-state','worker-message','snapshot-delivery','war-room-ack','rescan',
    'diagnostic-marker','frame-start'
  ];
  var SOURCE_VALUES = [
    'websocket','fetch','xhr','eventsource','react','dom','rest','worker','sharedworker',
    'page','history','click','popup','pipeline','storage','war-room','unknown'
  ];
  var VIEW_VALUES = ['players','pick-history','board','roster','unknown'];
  var DOM_VALUES = ['absent','mounted-hidden','mounted-visible','unavailable','unknown'];
  var CLICK_VALUES = ['trusted','untrusted','none'];
  var ACTION_VALUES = [
    'pushState','replaceState','popstate','hashchange','mutation','selection','storage',
    'click','copy','reset','rescan','visibility'
  ];
  var SENSITIVE_KEY = /(?:cookie|authorization|espn[_-]?s2|swid|password|passcode|secret|token|session(?:id|key)?|credential)/i;

  function stableHash(value) {
    var text = String(value || '');
    var hash = 2166136261;
    for (var index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function safeInteger(value, maximum) {
    var number = Number(value);
    if (!Number.isFinite(number)) return null;
    number = Math.max(0, Math.trunc(number));
    return maximum == null ? number : Math.min(maximum, number);
  }

  function redactPath(pathname) {
    return String(pathname || '')
      .split(/[?#]/)[0]
      .replace(/(\/leagues?\/)\d+/ig, '$1:league')
      .replace(/(\/league\/)(?:[A-Za-z0-9_-]{5,})/ig, '$1:league')
      .replace(/(leagueId[\/=])\d+/ig, '$1:league');
  }

  function safeRoute(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    var alreadySafe = raw.match(/^([A-Za-z0-9.-]+)(\/[^?#]*)?(?:[?#].*)?$/);
    if (alreadySafe && /(?:^|\.)espn\.com$/i.test(alreadySafe[1])) {
      return alreadySafe[1].slice(0, 100) + redactPath(alreadySafe[2] || '').slice(0, 240);
    }
    try {
      var parsed = new URL(raw, 'https://fantasy.espn.com');
      return String(parsed.hostname || '').slice(0, 100) + redactPath(parsed.pathname).slice(0, 240);
    } catch (error) {
      return '';
    }
  }

  function enumValue(value, allowed, fallback) {
    value = String(value || '');
    return allowed.indexOf(value) >= 0 ? value : fallback;
  }

  function safeState(value) {
    value = String(value || 'unknown').slice(0, 40);
    if (VIEW_VALUES.indexOf(value) >= 0 || DOM_VALUES.indexOf(value) >= 0) return value;
    if (['picks','empty-draft-detail','behind','unavailable','unknown'].indexOf(value) >= 0) return value;
    if (/^http-[1-5]\d\d$/.test(value)) return value;
    return 'unknown';
  }

  function safeSchemaKey(value) {
    var key = String(value || '').slice(0, 48);
    if (!key || SENSITIVE_KEY.test(key)) return null;
    return /^[A-Za-z_$][A-Za-z0-9_$.-]*$/.test(key) ? key : null;
  }

  function valueType(value) {
    if (value == null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) return 'arraybuffer';
    if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(value)) return 'typedarray';
    var type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean' || type === 'object') return type;
    return 'other';
  }

  function shallowSchema(value) {
    var target = value;
    if (typeof target === 'string' && target.length <= 2000000) {
      var trimmed = target.trim();
      if (trimmed && (trimmed[0] === '{' || trimmed[0] === '[')) {
        try { target = JSON.parse(trimmed); } catch (error) {}
      }
    }
    if (Array.isArray(target)) {
      target = target.find(function(item) { return item && typeof item === 'object' && !Array.isArray(item); }) || target[0];
    }
    if (!target || typeof target !== 'object' || Array.isArray(target)) return [];
    return Object.keys(target).slice(0, 24).map(function(key) {
      var safeKey = safeSchemaKey(key);
      if (!safeKey) return null;
      var type = 'unknown';
      try { type = valueType(target[key]); } catch (error) {}
      return safeKey + ':' + type;
    }).filter(Boolean).sort();
  }

  function approximateSize(value) {
    if (typeof value === 'string') return Math.min(2000000, value.length);
    if (value && typeof value.byteLength === 'number') return Math.min(2000000, Math.max(0, Number(value.byteLength) || 0));
    return null;
  }

  function structureFingerprint(value, options) {
    options = options || {};
    var schema = shallowSchema(value);
    var type = valueType(value);
    var size = approximateSize(value);
    var endpoint = safeRoute(options.endpoint || options.sourceDetail || '');
    var result = {
      type:type,
      schema:stableHash(type + '|' + schema.join('|')),
      keys:schema.map(function(item) { return item.split(':')[0]; }).slice(0, 12)
    };
    if (size != null) result.bytes = size;
    if (endpoint) result.endpoint = endpoint;
    return result;
  }

  function fingerprintFromFields(fields, endpoint, type) {
    var keys = (Array.isArray(fields) ? fields : []).map(safeSchemaKey).filter(Boolean).slice(0, 12).sort();
    var safeType = ['object','array','string','number','boolean','null','unknown'].indexOf(String(type || '')) >= 0
      ? String(type) : 'unknown';
    var result = {type:safeType, schema:stableHash(safeType + '|' + keys.join('|')), keys:keys};
    var route = safeRoute(endpoint || '');
    if (route) result.endpoint = route;
    return result;
  }

  function sanitizeFingerprint(value) {
    value = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    var type = String(value.type || 'unknown').slice(0, 20);
    if (!/^(?:object|array|string|number|boolean|null|arraybuffer|typedarray|other|unknown)$/.test(type)) type = 'unknown';
    var keys = (Array.isArray(value.keys) ? value.keys : []).map(safeSchemaKey).filter(Boolean).slice(0, 12);
    var output = {
      type:type,
      schema:/^[a-z0-9]{1,20}$/i.test(String(value.schema || '')) ? String(value.schema) : stableHash(type + '|' + keys.join('|')),
      keys:keys
    };
    var bytes = safeInteger(value.bytes, 2000000);
    if (bytes != null) output.bytes = bytes;
    var endpoint = safeRoute(value.endpoint || '');
    if (endpoint) output.endpoint = endpoint;
    return output;
  }

  function sanitizeEvent(event) {
    event = event && typeof event === 'object' && !Array.isArray(event) ? event : {};
    var output = {
      id:/^[A-Za-z0-9_-]{1,64}$/.test(String(event.id || '')) ? String(event.id) : null,
      at:safeInteger(event.at, 9999999999999) || Date.now(),
      category:enumValue(event.category, CATEGORY_VALUES, 'diagnostic-marker'),
      source:enumValue(event.source, SOURCE_VALUES, 'unknown')
    };
    var ms = safeInteger(event.ms, 3600000);
    if (ms != null) output.ms = ms;
    var action = enumValue(event.action, ACTION_VALUES, '');
    if (action) output.action = action;
    var view = enumValue(event.view, VIEW_VALUES, '');
    if (view) output.view = view;
    var click = enumValue(event.click, CLICK_VALUES, '');
    if (click) output.click = click;
    var frame = enumValue(event.frame, ['top','child'], '');
    if (frame) output.frame = frame;
    if (event.route != null) output.route = safeRoute(event.route);
    if (event.stateFrom != null) output.stateFrom = safeState(event.stateFrom);
    if (event.stateTo != null) output.stateTo = safeState(event.stateTo);
    ['count','candidates','latestPick','ledgerCount','applied','acknowledged','http','raw','resolved','unresolved'].forEach(function(name) {
      var number = safeInteger(event[name], 1000000);
      if (number != null) output[name] = number;
    });
    if (event.routeChanged != null) output.routeChanged = Boolean(event.routeChanged);
    if (event.fingerprint) output.fingerprint = sanitizeFingerprint(event.fingerprint);
    return output;
  }

  function appendBounded(events, event, limit) {
    limit = Math.max(1, Math.min(100, Number(limit) || DEFAULT_LIMIT));
    var next = (Array.isArray(events) ? events : []).map(sanitizeEvent);
    next.push(sanitizeEvent(event));
    if (next.length > limit) next = next.slice(next.length - limit);
    return next;
  }

  function mergeTimelines(groups, limit) {
    limit = Math.max(1, Math.min(100, Number(limit) || DEFAULT_LIMIT));
    var seen = {};
    var merged = [];
    (Array.isArray(groups) ? groups : []).forEach(function(group) {
      (Array.isArray(group) ? group : []).forEach(function(event) {
        var safe = sanitizeEvent(event);
        var key = safe.id || stableHash(JSON.stringify(safe));
        if (seen[key]) return;
        seen[key] = true;
        merged.push(safe);
      });
    });
    merged.sort(function(left, right) {
      if (left.at !== right.at) return left.at - right.at;
      return String(left.id || '').localeCompare(String(right.id || ''));
    });
    if (merged.length > limit) merged = merged.slice(merged.length - limit);
    var base = merged.length ? merged[0].at : 0;
    return merged.map(function(event) {
      var output = Object.assign({}, event);
      output.ms = Math.max(0, output.at - base);
      return output;
    });
  }

  function classifyViewText(value) {
    var text = String(value || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
    if (/pick\s*history|draft\s*history/.test(text)) return 'pick-history';
    if (/draft\s*board|\bboard\b/.test(text)) return 'board';
    if (/\broster\b|my\s*team/.test(text)) return 'roster';
    if (/available\s*players|\bplayers\b|player\s*pool/.test(text)) return 'players';
    return 'unknown';
  }

  function classifyViewNode(node) {
    if (!node) return 'unknown';
    var values = [];
    try {
      if (node.getAttribute) {
        ['aria-label','title','data-testid','data-tab','data-view'].forEach(function(name) {
          var value = node.getAttribute(name);
          if (value) values.push(value);
        });
      }
      if (typeof node.id === 'string') values.push(node.id);
      if (typeof node.className === 'string') values.push(node.className);
      values.push(String(node.textContent || '').slice(0, 160));
    } catch (error) {}
    return classifyViewText(values.join(' '));
  }

  function clickTrust(event) {
    return event && event.isTrusted === true ? 'trusted' : 'untrusted';
  }

  function recentClickProvenance(lastClick, view, now) {
    if (!lastClick || !Number.isFinite(Number(lastClick.at))) return 'none';
    if (Math.max(0, Number(now) - Number(lastClick.at)) > 1200) return 'none';
    if (lastClick.view && lastClick.view !== 'unknown' && view && view !== 'unknown' && lastClick.view !== view) return 'none';
    return enumValue(lastClick.click, CLICK_VALUES, 'none');
  }

  function formatForensicTimeline(events) {
    events = mergeTimelines([events], DEFAULT_LIMIT);
    var lines = ['Recent forensic timeline (' + events.length + ' event' + (events.length === 1 ? '' : 's') + '):'];
    if (!events.length) return lines.concat('  none');
    events.forEach(function(event) {
      var parts = ['+' + event.ms + 'ms', event.category];
      if (event.source && event.source !== 'unknown') parts.push(event.source);
      if (event.action) parts.push(event.action);
      if (event.view) parts.push('view=' + event.view);
      if (event.click) parts.push('click=' + event.click);
      if (event.stateFrom || event.stateTo) parts.push((event.stateFrom || 'unknown') + '→' + (event.stateTo || 'unknown'));
      if (event.route) parts.push('route=' + event.route);
      if (event.candidates != null) parts.push('c=' + event.candidates);
      if (event.ledgerCount != null) parts.push('ledger=' + event.ledgerCount);
      if (event.latestPick != null) parts.push('latest=' + event.latestPick);
      if (event.applied != null) parts.push('applied=' + event.applied);
      if (event.acknowledged != null) parts.push('ack=' + event.acknowledged);
      if (event.fingerprint) {
        parts.push('fp=' + event.fingerprint.type + ':' + event.fingerprint.schema +
          (event.fingerprint.bytes != null ? ':' + event.fingerprint.bytes + 'b' : ''));
      }
      lines.push('  ' + parts.join(' '));
    });
    return lines;
  }

  return {
    DEFAULT_LIMIT:DEFAULT_LIMIT,
    stableHash:stableHash,
    safeRoute:safeRoute,
    safeState:safeState,
    safeSchemaKey:safeSchemaKey,
    structureFingerprint:structureFingerprint,
    fingerprintFromFields:fingerprintFromFields,
    sanitizeFingerprint:sanitizeFingerprint,
    sanitizeEvent:sanitizeEvent,
    appendBounded:appendBounded,
    mergeTimelines:mergeTimelines,
    classifyViewText:classifyViewText,
    classifyViewNode:classifyViewNode,
    clickTrust:clickTrust,
    recentClickProvenance:recentClickProvenance,
    formatForensicTimeline:formatForensicTimeline
  };
});
