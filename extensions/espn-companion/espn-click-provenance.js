(function(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root || !root.document || !api.install) return;
  if (api.install(root)) root.__warRoomEspnClickProvenanceActiveVersion = api.runtimeVersion;
})(typeof globalThis !== 'undefined' ? globalThis : null, function() {
  'use strict';

  var RUNTIME_VERSION = '3';
  var DEFAULT_LIMIT = 48;
  var MECHANISMS = ['HTMLElement.click', 'dispatchEvent(click)', 'other-programmatic', 'trusted-user'];
  var CALLER_CLASSES = ['espn-script', 'extension-script', 'other-web-script', 'page-bundle', 'inline-page', 'user-input', 'unknown'];
  var VIEWS = ['players', 'pick-history', 'board', 'roster', 'unknown'];

  function stableHash(value) {
    var text = String(value || '');
    var hash = 2166136261;
    for (var index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function safeToken(value, maximum, fallback) {
    var token = String(value || '').replace(/[^A-Za-z0-9_$<>.-]+/g, '').slice(0, maximum || 64);
    return token || fallback || '';
  }

  function stripCoordinates(value) {
    return String(value || '').replace(/:\d+:\d+$/, '').replace(/:\d+$/, '');
  }

  function basename(value) {
    var clean = stripCoordinates(String(value || '').split(/[?#]/)[0]);
    var parts = clean.split('/');
    return safeToken(parts[parts.length - 1], 72, '');
  }

  function parseStackLine(line) {
    var text = String(line || '').trim().replace(/^at\s+/, '');
    if (!text || /^Error\b/.test(text)) return null;
    var functionName = '';
    var location = text;
    var match = text.match(/^(.+?)\s+\((.+)\)$/);
    if (match) {
      functionName = match[1];
      location = match[2];
    } else {
      var atIndex = text.lastIndexOf('@');
      if (atIndex > 0) {
        functionName = text.slice(0, atIndex);
        location = text.slice(atIndex + 1);
      }
    }
    return {
      functionName:safeToken(functionName, 64, ''),
      location:stripCoordinates(location)
    };
  }

  function classifyLocation(location) {
    var raw = String(location || '');
    var extracted = raw.match(/(?:chrome-extension|moz-extension|https?|webpack|blob):[^\s),]+/i);
    if (extracted) raw = extracted[0];
    raw = stripCoordinates(raw);
    if (/^(?:chrome|moz)-extension:\/\//i.test(raw)) {
      return {className:'extension-script', script:basename(raw)};
    }
    if (/^https?:\/\//i.test(raw)) {
      try {
        var parsed = new URL(raw);
        var host = String(parsed.hostname || '').toLowerCase();
        return {
          className:/(^|\.)espn\.com$/.test(host) ? 'espn-script' : 'other-web-script',
          script:basename(parsed.pathname)
        };
      } catch (error) {
        return {className:'other-web-script', script:basename(raw)};
      }
    }
    if (/^(?:webpack|blob):/i.test(raw)) return {className:'page-bundle', script:basename(raw)};
    if (/<anonymous>|\beval\b/i.test(raw)) return {className:'inline-page', script:''};
    return {className:'unknown', script:basename(raw)};
  }

  function sanitizeCaller(value) {
    value = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    var className = CALLER_CLASSES.indexOf(String(value.className || '')) >= 0 ? String(value.className) : 'unknown';
    var output = {
      className:className,
      hash:/^[a-z0-9]{1,20}$/i.test(String(value.hash || '')) ? String(value.hash) : stableHash(className)
    };
    var script = safeToken(value.script, 72, '');
    var functionName = safeToken(value.functionName, 64, '');
    if (script) output.script = script;
    if (functionName) output.functionName = functionName;
    return output;
  }

  function callerFingerprint(stack) {
    var frames = String(stack || '').split(/\r?\n/).map(parseStackLine).filter(Boolean);
    var sanitized = [];
    for (var index = 0; index < frames.length && sanitized.length < 4; index++) {
      var frame = frames[index];
      var location = classifyLocation(frame.location);
      if (location.script === 'espn-click-provenance.js') continue;
      var functionName = safeToken(frame.functionName, 64, '');
      if (/^(?:callerFingerprint|captureCaller|wrapPrototypeMethod)$/i.test(functionName)) continue;
      sanitized.push({className:location.className, script:location.script, functionName:functionName});
    }
    if (!sanitized.length) return sanitizeCaller({className:'unknown', hash:stableHash('unknown')});
    var representative = sanitized[0];
    for (var representativeIndex = 0; representativeIndex < sanitized.length; representativeIndex++) {
      if (sanitized[representativeIndex].className !== 'unknown') {
        representative = sanitized[representativeIndex];
        break;
      }
    }
    var signature = sanitized.map(function(frame) {
      return [frame.className, frame.script || '', frame.functionName || ''].join(':');
    }).join('|');
    return sanitizeCaller({
      className:representative.className,
      script:representative.script,
      functionName:representative.functionName,
      hash:stableHash(signature)
    });
  }

  function captureCaller() {
    var stack = '';
    try { stack = new Error().stack || ''; } catch (error) {}
    return callerFingerprint(stack);
  }

  function classifyViewText(value) {
    var text = String(value || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 320);
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
          if (value) values.push(String(value).slice(0, 120));
        });
      }
      if (typeof node.id === 'string') values.push(node.id.slice(0, 80));
      if (typeof node.className === 'string') values.push(node.className.slice(0, 120));
      values.push(String(node.textContent || '').slice(0, 160));
    } catch (error) {}
    return classifyViewText(values.join(' '));
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

  function isRelevantNavigationNode(node) {
    var target = navigationTarget(node);
    if (!target) return false;
    return classifyViewNode(target) !== 'unknown' || looksLikeNavigationControl(target);
  }

  function sanitizeEvent(value) {
    value = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    var click = value.click === 'trusted' ? 'trusted' : 'untrusted';
    var mechanism = MECHANISMS.indexOf(String(value.mechanism || '')) >= 0 ? String(value.mechanism) : 'other-programmatic';
    var view = VIEWS.indexOf(String(value.view || '')) >= 0 ? String(value.view) : 'unknown';
    var frame = value.frame === 'top' ? 'top' : 'child';
    var at = Number(value.at);
    if (!Number.isFinite(at) || at < 0) at = Date.now();
    var ms = Number(value.ms);
    if (!Number.isFinite(ms) || ms < 0) ms = 0;
    return {
      at:Math.trunc(at),
      ms:Math.min(3600000, Math.trunc(ms)),
      click:click,
      mechanism:mechanism,
      view:view,
      frame:frame,
      caller:sanitizeCaller(value.caller)
    };
  }

  function appendBounded(events, event, limit) {
    limit = Math.max(1, Math.min(64, Number(limit) || DEFAULT_LIMIT));
    var next = (Array.isArray(events) ? events : []).map(sanitizeEvent);
    next.push(sanitizeEvent(event));
    return next.length > limit ? next.slice(next.length - limit) : next;
  }

  function usablePendingProvenance(pending, now) {
    now = Number(now) || Date.now();
    if (!pending || !Number.isFinite(Number(pending.at)) || Math.max(0, now - Number(pending.at)) > 500) return false;
    return pending.mechanism === 'HTMLElement.click' || pending.mechanism === 'dispatchEvent(click)';
  }

  function classifyClickEvent(event, pending, now, observedCaller) {
    now = Number(now) || Date.now();
    if (event && event.isTrusted === true) {
      return {
        click:'trusted',
        mechanism:'trusted-user',
        caller:sanitizeCaller({className:'user-input', hash:stableHash('user-input')})
      };
    }
    if (usablePendingProvenance(pending, now)) {
      return {
        click:'untrusted',
        mechanism:String(pending.mechanism),
        caller:sanitizeCaller(pending.caller)
      };
    }
    return {
      click:'untrusted',
      mechanism:'other-programmatic',
      caller:observedCaller ? sanitizeCaller(observedCaller) :
        sanitizeCaller({className:'unknown', hash:stableHash('unknown-programmatic')})
    };
  }

  function wrapPrototypeMethod(prototype, name, before) {
    if (!prototype || typeof prototype[name] !== 'function') return null;
    var nativeMethod = prototype[name];
    var wrapped;
    if (typeof Proxy === 'function' && typeof Reflect !== 'undefined' && Reflect.apply) {
      wrapped = new Proxy(nativeMethod, {
        apply:function(Target, thisArg, args) {
          try { before(thisArg, args || []); } catch (error) {}
          return Reflect.apply(Target, thisArg, args || []);
        }
      });
    } else {
      wrapped = function() {
        try { before(this, Array.prototype.slice.call(arguments)); } catch (error) {}
        return nativeMethod.apply(this, arguments);
      };
    }
    try { prototype[name] = wrapped; } catch (error) { return null; }
    return {native:nativeMethod, wrapped:wrapped};
  }

  function install(root) {
    if (!root || !root.document || root.__warRoomEspnClickProvenanceInstalledV1 || root.__warRoomEspnClickProvenanceInstalledV2 || root.__warRoomEspnClickProvenanceInstalledV3) return false;
    root.__warRoomEspnClickProvenanceInstalledV3 = true;

    var startedAt = Date.now();
    var events = [];
    var pendingByTarget = typeof WeakMap === 'function' ? new WeakMap() : null;
    var frame = (function() {
      try { return root.top === root ? 'top' : 'child'; } catch (error) { return 'child'; }
    })();

    function remember(target, mechanism) {
      if (!pendingByTarget || !target || !isRelevantNavigationNode(target)) return;
      pendingByTarget.set(target, {at:Date.now(), mechanism:mechanism, caller:captureCaller()});
    }

    if (root.HTMLElement && root.HTMLElement.prototype) {
      wrapPrototypeMethod(root.HTMLElement.prototype, 'click', function(target) {
        remember(target, 'HTMLElement.click');
      });
    }
    if (root.EventTarget && root.EventTarget.prototype) {
      wrapPrototypeMethod(root.EventTarget.prototype, 'dispatchEvent', function(target, args) {
        var event = args && args[0];
        if (event && String(event.type || '').toLowerCase() === 'click') remember(target, 'dispatchEvent(click)');
      });
    }

    root.document.addEventListener('click', function(event) {
      var target = navigationTarget(event && event.target);
      if (!target) return;
      var view = classifyViewNode(target);
      if (view === 'unknown' && !looksLikeNavigationControl(target)) return;
      var pending = null;
      if (pendingByTarget) {
        try {
          pending = pendingByTarget.get(event.target) || pendingByTarget.get(target) || null;
          if (event.target) pendingByTarget.delete(event.target);
          pendingByTarget.delete(target);
        } catch (error) {}
      }
      var now = Date.now();
      var observedCaller = null;
      if (event && event.isTrusted !== true && !usablePendingProvenance(pending, now)) {
        observedCaller = captureCaller();
      }
      var classified = classifyClickEvent(event, pending, now, observedCaller);
      events = appendBounded(events, {
        at:now,
        ms:Math.max(0, now - startedAt),
        click:classified.click,
        mechanism:classified.mechanism,
        view:view,
        frame:frame,
        caller:classified.caller
      }, DEFAULT_LIMIT);
    }, true);

    root.__warRoomEspnClickProvenanceSnapshot = function() {
      return {version:3, startedAt:startedAt, events:events.slice()};
    };
    root.__warRoomEspnClickProvenanceReset = function() {
      startedAt = Date.now();
      events = [];
      pendingByTarget = typeof WeakMap === 'function' ? new WeakMap() : null;
      return true;
    };
    return true;
  }

  return {
    runtimeVersion:RUNTIME_VERSION,
    stableHash:stableHash,
    safeToken:safeToken,
    callerFingerprint:callerFingerprint,
    sanitizeCaller:sanitizeCaller,
    classifyViewText:classifyViewText,
    classifyViewNode:classifyViewNode,
    navigationTarget:navigationTarget,
    looksLikeNavigationControl:looksLikeNavigationControl,
    isRelevantNavigationNode:isRelevantNavigationNode,
    sanitizeEvent:sanitizeEvent,
    appendBounded:appendBounded,
    usablePendingProvenance:usablePendingProvenance,
    classifyClickEvent:classifyClickEvent,
    wrapPrototypeMethod:wrapPrototypeMethod,
    install:install
  };
});
