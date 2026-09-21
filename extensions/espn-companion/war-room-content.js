(function() {
  'use strict';

  if (!globalThis.chrome || !chrome.runtime) return;
  var CHANNEL = 'the-war-room:espn-sync:v1';
  var EXTENSION_VERSION = chrome.runtime.getManifest().version;

  function isTrustedWarRoomPage() {
    try {
      var locationUrl = new URL(window.location.href);
      var localHost = locationUrl.hostname === '127.0.0.1' || locationUrl.hostname === 'localhost';
      var productionHost = locationUrl.protocol === 'https:' &&
        locationUrl.hostname === 'ryan42062001.github.io' &&
        (locationUrl.pathname === '/The-War-Room' || locationUrl.pathname.indexOf('/The-War-Room/') === 0);
      var localDev = locationUrl.protocol === 'http:' && localHost && locationUrl.port === '8765';
      var marker = document.body && document.body.getAttribute('data-war-room-app');
      return Boolean((productionHost || localDev) && marker === 'the-war-room');
    } catch (error) {
      return false;
    }
  }

  if (!isTrustedWarRoomPage()) return;

  function sendRuntime(message) {
    try {
      var response = chrome.runtime.sendMessage(message);
      if (response && typeof response.catch === 'function') response.catch(function() {});
    } catch (error) {}
  }

  function targetOrigin() {
    return window.location.origin && window.location.origin !== 'null'
      ? window.location.origin
      : '*';
  }

  function sanitizeSettings(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    var teams = Number(value.teams);
    var draftSlot = Number(value.draftSlot);
    var rounds = Number(value.rounds);
    if (!Number.isInteger(teams) || teams < 2 || teams > 20) return null;
    if (!Number.isInteger(draftSlot) || draftSlot < 1 || draftSlot > teams) return null;
    if (!Number.isInteger(rounds) || rounds < 5 || rounds > 30) return null;
    return {teams:teams, draftSlot:draftSlot, rounds:rounds, totalPicks:teams * rounds};
  }

  function sanitizeAckResult(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    var clampCount = function(input) {
      var number = Math.trunc(Number(input) || 0);
      return Math.max(0, Math.min(600, number));
    };
    var applied = clampCount(value.applied);
    var unmatched = Array.isArray(value.unmatched) ? value.unmatched.slice(0, 600).map(function() { return null; }) : [];
    var unresolvedCount = Array.isArray(value.unresolved)
      ? value.unresolved.length
      : clampCount(value.unresolved);
    return {
      captured: clampCount(value.captured),
      applied: applied,
      numberedAccepted: clampCount(value.numberedAccepted == null ? applied : value.numberedAccepted),
      canonicalApplied: clampCount(value.canonicalApplied == null ? applied : value.canonicalApplied),
      externalAccepted: clampCount(value.externalAccepted),
      unresolved: clampCount(unresolvedCount),
      rejected: clampCount(value.rejected),
      unmatched: unmatched,
      unavailableApplied: clampCount(value.unavailableApplied),
      latestPick: clampCount(value.latestPick)
    };
  }

  function postToWarRoom(message) {
    window.postMessage(Object.assign({channel: CHANNEL}, message), targetOrigin());
  }

  chrome.runtime.onMessage.addListener(function(message) {
    if (!message) return;
    if (message.type === 'WAR_ROOM_SNAPSHOT') {
      postToWarRoom({type: 'PICKS_SNAPSHOT', snapshot: message.snapshot});
    }
    if (message.type === 'WAR_ROOM_STATUS') {
      postToWarRoom({
        type: 'EXTENSION_STATUS',
        status: message.status,
        detail: message.detail,
        extensionVersion: message.extensionVersion || EXTENSION_VERSION
      });
    }
  });

  window.addEventListener('message', function(event) {
    var expectedOrigin = window.location.origin;
    if (
      event.source !== window ||
      (expectedOrigin !== 'null' && event.origin !== expectedOrigin) ||
      !event.data ||
      typeof event.data !== 'object' ||
      Array.isArray(event.data) ||
      event.data.channel !== CHANNEL
    ) return;
    if (event.data.type === 'SYNC_ACK') {
      sendRuntime({
        type: 'WAR_ROOM_ACK',
        result: sanitizeAckResult(event.data.result),
        settings: sanitizeSettings(event.data.settings),
        requiredExtensionVersion: String(event.data.requiredExtensionVersion || '').slice(0, 20),
        url: location.href
      });
    }
    if (event.data.type === 'SETTINGS_UPDATE') {
      var settings = sanitizeSettings(event.data.settings);
      if (!settings) return;
      sendRuntime({
        type: 'WAR_ROOM_SETTINGS_UPDATE',
        config: settings,
        requiredExtensionVersion: String(event.data.requiredExtensionVersion || '').slice(0, 20),
        url: location.href
      });
    }
    if (event.data.type === 'RANKINGS_REFRESH_REQUEST') {
      sendRuntime({type: 'WAR_ROOM_RANKINGS_REFRESH', url: location.href});
    }
  });

  postToWarRoom({
    type: 'EXTENSION_STATUS',
    status: 'connected',
    detail: 'ESPN companion connected',
    extensionVersion: EXTENSION_VERSION
  });
  sendRuntime({type: 'WAR_ROOM_READY', url: location.href});
})();
