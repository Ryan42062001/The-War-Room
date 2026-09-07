(function(root) {
  'use strict';

  var presentationApi = root.WarRoomEspnSyncPresentation;
  var CHANNEL = 'the-war-room:espn-sync:v1';
  var lastStatus = null;
  var lastPresentation = null;
  var observer = null;
  var refreshTimer = null;

  function ensureStyles() {
    if (!root.document || root.document.getElementById('espn-sync-trust-styles')) return;
    var style = root.document.createElement('style');
    style.id = 'espn-sync-trust-styles';
    style.textContent =
      '#espn-sync-status[data-sync-state="caughtUp"]{opacity:.84}' +
      '#espn-sync-status[data-sync-state="unavailable"]{opacity:.72}' +
      '#espn-sync-status[data-sync-state="catchingUp"],#espn-sync-status[data-sync-state="finalizing"]{opacity:.92}' +
      '#espn-sync-status .espn-sync-label-compact{display:none}' +
      '@media(max-width:600px){#espn-sync-status .espn-sync-label-full{display:none}#espn-sync-status .espn-sync-label-compact{display:inline}}';
    root.document.head.appendChild(style);
  }

  function badgeElement() {
    return root.document && root.document.getElementById('espn-sync-status');
  }

  function fullLabel(presentation) {
    return presentation.label.replace(/^ESPN Live Sync/, 'ESPN Sync');
  }

  function setBadgeText(badge, presentation) {
    badge.textContent = '';
    var full = root.document.createElement('span');
    full.className = 'espn-sync-label-full';
    full.textContent = fullLabel(presentation);
    var compact = root.document.createElement('span');
    compact.className = 'espn-sync-label-compact';
    compact.textContent = presentation.compactLabel;
    badge.appendChild(full);
    badge.appendChild(compact);
  }

  function badgeMatchesPresentation(badge, presentation) {
    var shouldHide = !presentation.visible || presentation.key === 'complete';
    if (badge.hidden !== shouldHide) return false;
    if (shouldHide) return true;
    var full = badge.querySelector('.espn-sync-label-full');
    var compact = badge.querySelector('.espn-sync-label-compact');
    return Boolean(
      full && compact &&
      full.textContent === fullLabel(presentation) &&
      compact.textContent === presentation.compactLabel
    );
  }

  function renderPresentation(presentation) {
    if (!presentation) return null;
    ensureStyles();
    var badge = badgeElement();
    if (!badge) return presentation;
    lastPresentation = presentation;

    if (!presentation.visible || presentation.key === 'complete') {
      badge.hidden = true;
      badge.setAttribute('data-sync-state', presentation.key);
      return presentation;
    }

    badge.hidden = false;
    badge.className = 'espn-sync-status';
    if (presentation.tone === 'progress') badge.classList.add('espn-sync-status-syncing');
    if (presentation.tone === 'attention') badge.classList.add('espn-sync-status-error');
    badge.setAttribute('data-sync-state', presentation.key);
    badge.setAttribute('title', presentation.detail || presentation.label);
    badge.setAttribute('aria-label', presentation.label + (presentation.detail ? '. ' + presentation.detail : ''));
    setBadgeText(badge, presentation);
    return presentation;
  }

  function renderStatus(status, options) {
    if (!presentationApi || typeof presentationApi.derive !== 'function') return null;
    lastStatus = status || {};
    return renderPresentation(presentationApi.derive(lastStatus, options || {}));
  }

  function scheduleRefresh(delay) {
    if (!root.chrome || !root.chrome.runtime || typeof root.chrome.runtime.sendMessage !== 'function') return;
    if (refreshTimer) root.clearTimeout(refreshTimer);
    refreshTimer = root.setTimeout(function() {
      refreshTimer = null;
      root.chrome.runtime.sendMessage({type:'GET_STATUS'}).then(function(status) {
        renderStatus(status || {});
      }).catch(function() {});
    }, Math.max(0, Number(delay) || 0));
  }

  function observeBadge() {
    var badge = badgeElement();
    if (!badge || observer || typeof root.MutationObserver !== 'function') return;
    observer = new root.MutationObserver(function() {
      if (!lastPresentation) return;
      if (!badgeMatchesPresentation(badge, lastPresentation)) {
        renderPresentation(lastPresentation);
      }
    });
    observer.observe(badge, {childList:true, subtree:true, attributes:true, attributeFilter:['class','hidden']});
  }

  function installRuntimeHooks() {
    if (!root.chrome || !root.chrome.runtime || !root.chrome.runtime.onMessage) return;
    root.chrome.runtime.onMessage.addListener(function(message) {
      if (!message || typeof message !== 'object') return;
      if (message.type === 'WAR_ROOM_SNAPSHOT') {
        if (lastStatus && presentationApi) {
          renderPresentation(presentationApi.derive(lastStatus, {forceUpdating:true}));
        }
        scheduleRefresh(0);
      } else if (message.type === 'WAR_ROOM_STATUS') {
        scheduleRefresh(0);
      }
    });
  }

  function installPageAckHook() {
    if (!root.addEventListener) return;
    root.addEventListener('message', function(event) {
      if (event.source !== root || !event.data || event.data.channel !== CHANNEL) return;
      if (event.data.type === 'SYNC_ACK') scheduleRefresh(0);
    });
    root.addEventListener('online', function() { scheduleRefresh(0); });
    root.addEventListener('offline', function() { scheduleRefresh(0); });
    root.addEventListener('resize', function() {
      if (lastPresentation) renderPresentation(lastPresentation);
    });
  }

  function init() {
    ensureStyles();
    observeBadge();
    installRuntimeHooks();
    installPageAckHook();
    scheduleRefresh(0);
    root.setTimeout(observeBadge, 250);
  }

  root.WarRoomEspnSyncTrustUi = {
    renderStatus:renderStatus,
    renderPresentation:renderPresentation,
    refresh:function() { scheduleRefresh(0); },
    getLastPresentation:function() { return lastPresentation; }
  };

  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', init, {once:true});
    else init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
