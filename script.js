/**
 * The War Room production bootstrap.
 * Production logic lives in ordered classic scripts under js/.
 */
var WAR_ROOM_BOOTSTRAP_VERSION = '20260907-4';
var WAR_ROOM_EXTERNAL_PICK_MODULE = 'js/war-room-external-picks.js?v=20260907-1';

function reportWarRoomEnhancementFailure(label) {
  document.body.setAttribute('data-war-room-degraded', 'true');
  var badges = document.querySelector('.header-badges');
  if (!badges) return;
  var badge = document.getElementById('war-room-degraded-status') || document.createElement('div');
  badge.id = 'war-room-degraded-status';
  badge.className = 'espn-sync-status espn-sync-status-error';
  badge.setAttribute('aria-live', 'polite');
  badge.hidden = false;
  badge.textContent = 'Draft UI degraded · ' + label + ' unavailable';
  if (!badge.parentNode) badges.appendChild(badge);
}

function loadOptionalScript(src, marker, label, next, onLoad) {
  if (document.querySelector('script[' + marker + ']')) return next();
  var script = document.createElement('script');
  script.src = src;
  script.setAttribute(marker, 'true');
  script.onload = function() {
    try { if (onLoad) onLoad(); } catch (error) { reportWarRoomEnhancementFailure(label); }
    next();
  };
  script.onerror = function() {
    console.warn('War Room enhancement failed to load:', src);
    reportWarRoomEnhancementFailure(label);
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
  link.onerror = function() { reportWarRoomEnhancementFailure('draft polish'); };
  document.head.appendChild(link);
}

function loadAwarenessLiveSync() {
  loadOptionalScript('js/war-room-awareness-live-sync.js?v=20260907-1', 'data-war-room-awareness-live-sync', 'live awareness', loadDraftPolishStyles);
}
function loadDraftAwareness() {
  loadOptionalScript('js/war-room-draft-awareness.js?v=20260906-1', 'data-war-room-draft-awareness', 'draft awareness', loadAwarenessLiveSync);
}
function loadDraftCommandFixes() {
  loadOptionalScript('js/war-room-command-bar-fixes.js?v=20260906-1', 'data-war-room-command-fixes', 'command fixes', loadDraftAwareness);
}
function loadDraftCommandPresentation() {
  loadOptionalScript('js/war-room-command-bar.js?v=20260906-1', 'data-war-room-command-bar', 'command bar', loadDraftCommandFixes, function() {
    if (typeof window.initDraftCommandBar === 'function') window.initDraftCommandBar();
  });
}
function loadWarRoomHardening() {
  loadOptionalScript('js/war-room-hardening.js?v=' + WAR_ROOM_BOOTSTRAP_VERSION, 'data-war-room-hardening', 'hardening layer', loadDraftCommandPresentation);
}
function startWarRoomCore() { runAppInitialization(); loadWarRoomHardening(); }

function loadRequiredExternalPickState() {
  if (window.WarRoomEspnExternalPicks && window.WarRoomEspnExternalPicks.version === 1) {
    startWarRoomCore();
    return;
  }
  var script = document.createElement('script');
  script.src = WAR_ROOM_EXTERNAL_PICK_MODULE;
  script.setAttribute('data-war-room-external-picks', 'true');
  script.onload = function() {
    if (!window.WarRoomEspnExternalPicks || window.WarRoomEspnExternalPicks.version !== 1) {
      console.error('War Room external ESPN pick state loaded without its required runtime contract.');
      reportWarRoomEnhancementFailure('ESPN external-pick state');
      return;
    }
    startWarRoomCore();
  };
  script.onerror = function() {
    console.error('War Room external ESPN pick state failed to load; core initialization blocked.');
    reportWarRoomEnhancementFailure('ESPN external-pick state');
  };
  document.head.appendChild(script);
}

function bootWarRoom() {
  if (!window.WarRoomCanonicalScoring || !window.WarRoomCanonicalRecommendations) {
    console.error('War Room canonical scoring correctness failed to load; core initialization blocked.');
    reportWarRoomEnhancementFailure('canonical scoring engine');
    return;
  }
  loadRequiredExternalPickState();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootWarRoom, {once:true});
else bootWarRoom();
