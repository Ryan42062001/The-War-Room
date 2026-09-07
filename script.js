/**
 * The War Room production bootstrap.
 * Production logic lives in ordered classic scripts under js/.
 */

function loadDraftPolishStyles() {
  if (document.getElementById('war-room-draft-polish-styles')) return;
  var link = document.createElement('link');
  link.id = 'war-room-draft-polish-styles';
  link.rel = 'stylesheet';
  link.href = 'draft-polish.css?v=20260907-1';
  document.head.appendChild(link);
}

function loadAwarenessLiveSync() {
  if (document.querySelector('script[data-war-room-awareness-live-sync]')) {
    loadDraftPolishStyles();
    return;
  }
  var sync = document.createElement('script');
  sync.src = 'js/war-room-awareness-live-sync.js?v=20260907-1';
  sync.setAttribute('data-war-room-awareness-live-sync', 'true');
  sync.onload = loadDraftPolishStyles;
  document.head.appendChild(sync);
}

function loadDraftAwareness() {
  if (document.querySelector('script[data-war-room-draft-awareness]')) {
    loadAwarenessLiveSync();
    return;
  }
  var awareness = document.createElement('script');
  awareness.src = 'js/war-room-draft-awareness.js?v=20260906-1';
  awareness.setAttribute('data-war-room-draft-awareness', 'true');
  awareness.onload = loadAwarenessLiveSync;
  document.head.appendChild(awareness);
}

function loadDraftCommandFixes() {
  if (document.querySelector('script[data-war-room-command-fixes]')) {
    loadDraftAwareness();
    return;
  }
  var fixes = document.createElement('script');
  fixes.src = 'js/war-room-command-bar-fixes.js?v=20260906-1';
  fixes.setAttribute('data-war-room-command-fixes', 'true');
  fixes.onload = loadDraftAwareness;
  document.head.appendChild(fixes);
}

function loadDraftCommandPresentation() {
  if (document.querySelector('script[data-war-room-command-bar]')) return;
  var script = document.createElement('script');
  script.src = 'js/war-room-command-bar.js?v=20260906-1';
  script.setAttribute('data-war-room-command-bar', 'true');
  script.onload = function() {
    if (typeof window.initDraftCommandBar === 'function') window.initDraftCommandBar();
    loadDraftCommandFixes();
  };
  document.head.appendChild(script);
}

function bootWarRoom() {
  runAppInitialization();
  loadDraftCommandPresentation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootWarRoom, { once: true });
} else {
  bootWarRoom();
}
