/**
 * The War Room production bootstrap.
 * Production logic lives in ordered classic scripts under js/.
 */

var WAR_ROOM_BOOTSTRAP_VERSION = '20260907-2';

function reportWarRoomEnhancementFailure(label) {
  try {
    document.body.setAttribute('data-war-room-degraded', 'true');
    var badges = document.querySelector('.header-badges');
    if (!badges) return;
    var badge = document.getElementById('war-room-degraded-status');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'war-room-degraded-status';
      badge.className = 'espn-sync-status espn-sync-status-error';
      badge.setAttribute('aria-live', 'polite');
      badges.appendChild(badge);
    }
    badge.hidden = false;
    badge.textContent = 'Draft UI degraded · ' + label + ' unavailable';
  } catch (error) {}
}

function loadOptionalScript(options) {
  options = options || {};
  var marker = options.marker;
  var next = typeof options.next === 'function' ? options.next : function() {};
  if (marker && document.querySelector('script[' + marker + ']')) {
    next();
    return;
  }

  var script = document.createElement('script');
  script.src = options.src;
  if (marker) script.setAttribute(marker, 'true');
  script.onload = function() {
    if (typeof options.onLoad === 'function') {
      try { options.onLoad(); } catch (error) {
        console.warn('War Room enhancement initialization failed:', options.label, error);
        reportWarRoomEnhancementFailure(options.label || 'enhancement');
      }
    }
    next();
  };
  script.onerror = function() {
    console.warn('War Room enhancement failed to load:', options.src);
    reportWarRoomEnhancementFailure(options.label || options.src || 'enhancement');
    next();
  };
  document.head.appendChild(script);
}

function loadDraftPolishStyles() {
  if (document.getElementById('war-room-draft-polish-styles')) return;
  var link = document.createElement('link');
  link.id = 'war-room-draft-polish-styles';
  link.rel = 'stylesheet';
  link.href = 'draft-polish.css?v=20260907-1';
  link.onerror = function() {
    console.warn('War Room draft polish styles failed to load.');
    reportWarRoomEnhancementFailure('draft polish');
  };
  document.head.appendChild(link);
}

function loadAwarenessLiveSync() {
  loadOptionalScript({
    src: 'js/war-room-awareness-live-sync.js?v=20260907-1',
    marker: 'data-war-room-awareness-live-sync',
    label: 'live awareness',
    next: loadDraftPolishStyles
  });
}

function loadDraftAwareness() {
  loadOptionalScript({
    src: 'js/war-room-draft-awareness.js?v=20260906-1',
    marker: 'data-war-room-draft-awareness',
    label: 'draft awareness',
    next: loadAwarenessLiveSync
  });
}

function loadDraftCommandFixes() {
  loadOptionalScript({
    src: 'js/war-room-command-bar-fixes.js?v=20260906-1',
    marker: 'data-war-room-command-fixes',
    label: 'command fixes',
    next: loadDraftAwareness
  });
}

function loadDraftCommandPresentation() {
  loadOptionalScript({
    src: 'js/war-room-command-bar.js?v=20260906-1',
    marker: 'data-war-room-command-bar',
    label: 'command bar',
    onLoad: function() {
      if (typeof window.initDraftCommandBar === 'function') window.initDraftCommandBar();
    },
    next: loadDraftCommandFixes
  });
}

function loadWarRoomHardening() {
  loadOptionalScript({
    src: 'js/war-room-hardening.js?v=' + WAR_ROOM_BOOTSTRAP_VERSION,
    marker: 'data-war-room-hardening',
    label: 'hardening layer',
    next: loadDraftCommandPresentation
  });
}

function bootWarRoom() {
  runAppInitialization();
  loadWarRoomHardening();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootWarRoom, { once: true });
} else {
  bootWarRoom();
}
