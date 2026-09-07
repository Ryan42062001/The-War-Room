(function(root) {
  'use strict';

  var presentationApi = root.WarRoomEspnSyncPresentation;
  var originalRender = typeof root.render === 'function' ? root.render : null;

  function versionIsOutdated(status) {
    status = status || {};
    if (typeof root.compareVersions !== 'function') return false;
    var installed = status.extensionVersion || (root.chrome && root.chrome.runtime && root.chrome.runtime.getManifest
      ? root.chrome.runtime.getManifest().version
      : '');
    var required = root.requiredVersion || root.PACKAGED_WEBSITE_REQUIREMENT || '';
    return Boolean(required && root.compareVersions(installed, required) < 0);
  }

  function renderConnection(id, online, connectedText, offlineText) {
    var element = root.document && root.document.getElementById(id);
    if (!element) return;
    element.textContent = online ? connectedText : offlineText;
  }

  function renderTrustStatus(status) {
    if (!presentationApi || !root.document) return null;
    status = status || {};
    var espn = status.espn || {};
    var warRoom = status.warRoom || {};
    var options = {
      expectedSession:true,
      versionOutdated:versionIsOutdated(status)
    };
    if (typeof root.WarRoomEspnPopupActionableIssueResolver === 'function') {
      options.resolveActionableIssueCount = root.WarRoomEspnPopupActionableIssueResolver;
    }
    var presentation = presentationApi.derive(status, options);
    var health = root.document.getElementById('sync-health');
    var title = root.document.getElementById('sync-health-title');
    var note = root.document.getElementById('sync-recovery-note');
    var conflicts = root.document.getElementById('conflict-status');
    var liveCapture = espn.liveCapture || {};

    renderConnection(
      'espn-status',
      Boolean(espn.connected && espn.draftPage),
      'Draft connected',
      espn.connected ? 'ESPN open' : 'Not connected'
    );
    renderConnection(
      'war-room-status',
      Boolean(warRoom.connected),
      'Connected',
      warRoom.deliveryError ? 'Connection issue' : 'Not connected'
    );

    if (health) {
      health.className = 'sync-health is-' + presentation.tone;
      health.setAttribute('data-sync-state', presentation.key);
    }
    if (title) title.textContent = presentation.label;
    if (note) {
      note.hidden = !presentation.recoveryNote;
      note.textContent = presentation.recoveryNote || '';
    }
    if (conflicts) conflicts.textContent = String(Number(liveCapture.conflicts) || 0);

    var message = root.document.getElementById('message');
    if (message) {
      message.textContent = presentation.detail;
      message.classList.toggle('needs-action', presentation.actionRequired);
    }

    return presentation;
  }

  if (originalRender) {
    root.render = function(status) {
      originalRender(status);
      return renderTrustStatus(status);
    };
  }

  root.WarRoomEspnPopupTrustUx = {
    renderStatus:renderTrustStatus
  };

  if (root.latestStatus) {
    renderTrustStatus(root.latestStatus);
  } else if (typeof root.send === 'function') {
    root.send({type:'GET_STATUS'}).then(function(status) {
      renderTrustStatus(status || {});
    }).catch(function() {});
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
