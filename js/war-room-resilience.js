/* =========================================================
   WAR ROOM RESILIENCE
   Offline registration, portable local backup/restore, and
   non-scoring system diagnostics. This layer must never alter
   player rankings, recommendation scores, or ESPN reconciliation.
   ========================================================= */
(function() {
  'use strict';

  var BACKUP_SCHEMA = 'the-war-room-backup';
  var BACKUP_VERSION = 1;
  var MAX_BACKUP_BYTES = 8 * 1024 * 1024;
  var RESTORE_NOTICE_KEY = 'war-room-recovery-notice-v1';
  var pendingRestore = null;
  var offlineState = {
    supported: 'serviceWorker' in navigator,
    registered: Boolean(navigator.serviceWorker && navigator.serviceWorker.controller),
    controlled: Boolean(navigator.serviceWorker && navigator.serviceWorker.controller),
    error: ''
  };

  function isWarRoomStorageKey(key) {
    key = String(key || '');
    return key.indexOf('draft-') === 0 ||
      key.indexOf('war-room-') === 0 ||
      key.indexOf('warRoom') === 0;
  }

  function collectStorageSnapshot() {
    var snapshot = {};
    var keys = [];
    for (var index = 0; index < localStorage.length; index++) {
      var key = localStorage.key(index);
      if (isWarRoomStorageKey(key)) keys.push(key);
    }
    keys.sort().forEach(function(key) {
      snapshot[key] = localStorage.getItem(key);
    });
    return snapshot;
  }

  function calculateStorageBytes(snapshot) {
    return Object.keys(snapshot || {}).reduce(function(total, key) {
      var value = snapshot[key] == null ? '' : String(snapshot[key]);
      return total + (String(key).length + value.length) * 2;
    }, 0);
  }

  function buildBackup() {
    var storage = collectStorageSnapshot();
    return {
      schema: BACKUP_SCHEMA,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: typeof WAR_ROOM_BOOTSTRAP_VERSION === 'string' ? WAR_ROOM_BOOTSTRAP_VERSION : null,
      origin: window.location.origin,
      storage: storage
    };
  }

  function validateBackup(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Backup file must contain a JSON object.');
    }
    if (payload.schema !== BACKUP_SCHEMA || payload.version !== BACKUP_VERSION) {
      throw new Error('This is not a supported War Room backup.');
    }
    if (!payload.storage || typeof payload.storage !== 'object' || Array.isArray(payload.storage)) {
      throw new Error('Backup storage payload is missing or invalid.');
    }

    var normalized = {};
    Object.keys(payload.storage).forEach(function(key) {
      if (!isWarRoomStorageKey(key)) throw new Error('Backup contains an unrelated storage key: ' + key);
      var value = payload.storage[key];
      if (typeof value !== 'string') throw new Error('Backup contains a non-string storage value: ' + key);
      normalized[key] = value;
    });
    if (calculateStorageBytes(normalized) > MAX_BACKUP_BYTES) {
      throw new Error('Backup exceeds the supported 8 MiB storage budget.');
    }
    return normalized;
  }

  function replaceWarRoomStorage(snapshot) {
    var current = collectStorageSnapshot();
    try {
      Object.keys(current).forEach(function(key) { localStorage.removeItem(key); });
      Object.keys(snapshot).forEach(function(key) { localStorage.setItem(key, snapshot[key]); });
    } catch (error) {
      try {
        var partial = collectStorageSnapshot();
        Object.keys(partial).forEach(function(key) { localStorage.removeItem(key); });
        Object.keys(current).forEach(function(key) { localStorage.setItem(key, current[key]); });
      } catch (rollbackError) {
        console.error('War Room backup rollback failed.', rollbackError);
      }
      throw error;
    }
    return {restoredKeys: Object.keys(snapshot).length, bytes: calculateStorageBytes(snapshot)};
  }

  function restoreBackupObject(payload) {
    return replaceWarRoomStorage(validateBackup(payload));
  }

  function formatBackupTime(value) {
    if (!value) return 'Unknown export time';
    var date = new Date(value);
    if (!Number.isFinite(date.getTime())) return 'Unknown export time';
    try {
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (error) {
      return date.toISOString();
    }
  }

  function getDraftSessionSummary() {
    var sessions = [];
    try {
      if (typeof window.readDraftSessionRegistry === 'function') sessions = window.readDraftSessionRegistry();
    } catch (error) {}
    sessions = Array.isArray(sessions) ? sessions : [];

    var activeId = typeof window.activeDraftSessionId === 'string' ? window.activeDraftSessionId : null;
    var active = sessions.find(function(session) { return session && session.id === activeId; }) || null;
    return {
      sessions: sessions,
      count: sessions.length,
      activeId: activeId,
      activeName: active && active.name ? String(active.name) : (activeId ? 'Current draft' : 'No active draft')
    };
  }

  function downloadBackup() {
    var backup = buildBackup();
    var stamp = backup.exportedAt.replace(/[:.]/g, '-');
    var blob = new Blob([JSON.stringify(backup, null, 2) + '\n'], {type: 'application/json'});
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'war-room-backup-' + stamp + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 0);
    setMaintenanceMessage(
      'Backup saved. Your current draft was not changed · ' + Object.keys(backup.storage).length + ' War Room keys included.',
      'success'
    );
    return backup;
  }

  function readBackupFile(file) {
    if (!file) return Promise.reject(new Error('No backup file selected.'));
    if (file.size > MAX_BACKUP_BYTES) return Promise.reject(new Error('Backup file is larger than 8 MiB.'));
    return file.text().then(function(text) {
      var payload;
      try { payload = JSON.parse(text); }
      catch (error) { throw new Error('Backup file is not valid JSON.'); }
      validateBackup(payload);
      return payload;
    });
  }

  function hideRestoreConfirmation() {
    pendingRestore = null;
    var panel = document.getElementById('war-room-restore-confirmation');
    if (panel) panel.hidden = true;
  }

  function showRestoreConfirmation(payload, fileName) {
    pendingRestore = {
      payload: payload,
      fileName: String(fileName || 'War Room backup')
    };

    var panel = document.getElementById('war-room-restore-confirmation');
    if (!panel) return;
    var file = panel.querySelector('[data-restore-file]');
    var details = panel.querySelector('[data-restore-details]');
    if (file) file.textContent = pendingRestore.fileName;
    if (details) {
      details.textContent = formatBackupTime(payload.exportedAt) + ' · ' +
        Object.keys(payload.storage || {}).length + ' War Room keys';
    }
    panel.hidden = false;
    setMaintenanceMessage(
      'Backup checked. Nothing has been changed yet. Review the restore warning below before continuing.',
      'info'
    );
    var cancelButton = document.getElementById('war-room-cancel-restore');
    if (cancelButton) cancelButton.focus();
  }

  function cancelRestore() {
    hideRestoreConfirmation();
    setMaintenanceMessage('Restore canceled. Your current draft was not changed.', 'success');
  }

  function confirmPendingRestore() {
    if (!pendingRestore || !pendingRestore.payload) return;
    var confirmButton = document.getElementById('war-room-confirm-restore');
    var cancelButton = document.getElementById('war-room-cancel-restore');
    if (confirmButton) confirmButton.disabled = true;
    if (cancelButton) cancelButton.disabled = true;
    setMaintenanceMessage('Restoring the selected backup…', 'info');

    try {
      var result = restoreBackupObject(pendingRestore.payload);
      try {
        sessionStorage.setItem(
          RESTORE_NOTICE_KEY,
          'Backup restored successfully · ' + result.restoredKeys + ' War Room keys loaded.'
        );
      } catch (noticeError) {}
      setMaintenanceMessage('Backup restored. Reloading War Room…', 'success');
      window.setTimeout(function() { window.location.reload(); }, 180);
    } catch (error) {
      if (confirmButton) confirmButton.disabled = false;
      if (cancelButton) cancelButton.disabled = false;
      setMaintenanceMessage(
        (error && error.message ? error.message : 'Backup restore failed.') + ' Your previous War Room data was kept when rollback was possible.',
        'error'
      );
    }
  }

  function chooseRestoreFile() {
    hideRestoreConfirmation();
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.hidden = true;
    input.setAttribute('aria-label', 'Choose War Room backup file');
    document.body.appendChild(input);
    input.addEventListener('change', function() {
      var file = input.files && input.files[0];
      readBackupFile(file).then(function(payload) {
        showRestoreConfirmation(payload, file && file.name);
      }).catch(function(error) {
        setMaintenanceMessage(error.message, 'error');
      }).finally(function() {
        input.remove();
      });
    }, {once: true});
    input.click();
  }

  function storageWritable() {
    var probe = 'war-room-resilience-probe';
    try {
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  }

  function getSystemCheck() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('tr.draftrow'));
    var names = rows.map(function(row) { return row.getAttribute('data-name') || ''; }).filter(Boolean);
    var uniqueNames = new Set(names).size;
    var datasetCount = Array.isArray(window.FANTASYPROS_2026_DATASET) ? window.FANTASYPROS_2026_DATASET.length : null;
    var sessionSummary = getDraftSessionSummary();
    var snapshot = collectStorageSnapshot();
    var degraded = document.body.getAttribute('data-war-room-degraded') === 'true';
    var hardeningLoaded = Boolean(window.WarRoomHardening && window.WarRoomHardening.installed);
    var offlineReady = offlineState.supported && offlineState.registered;
    var checks = [
      {label: 'Browser storage', ok: storageWritable(), detail: Math.round(calculateStorageBytes(snapshot) / 1024) + ' KiB used'},
      {label: 'Player board', ok: rows.length === 717 && uniqueNames === rows.length, detail: rows.length + ' rows · ' + uniqueNames + ' unique'},
      {label: 'FantasyPros dataset', ok: datasetCount === 717, detail: datasetCount == null ? 'not loaded' : datasetCount + ' players'},
      {label: 'Core safeguards', ok: hardeningLoaded && !degraded, detail: degraded ? 'degraded mode reported' : hardeningLoaded ? 'loaded' : 'unavailable'},
      {label: 'Draft awareness', ok: typeof window.WarRoomDraftAwareness === 'object', detail: typeof window.WarRoomDraftAwareness === 'object' ? 'loaded' : 'unavailable'},
      {label: 'Live awareness sync', ok: typeof window.WarRoomAwarenessLiveSync === 'object', detail: typeof window.WarRoomAwarenessLiveSync === 'object' ? 'loaded' : 'unavailable'},
      {label: 'Offline fallback', ok: offlineReady, detail: offlineState.error || (navigator.onLine === false && offlineState.controlled ? 'offline now · cached app active' : offlineState.controlled ? 'ready for offline reload' : offlineState.registered ? 'installed · reload once to activate' : 'not registered')},
      {label: 'Saved drafts', ok: Array.isArray(sessionSummary.sessions), detail: sessionSummary.count + ' session' + (sessionSummary.count === 1 ? '' : 's')}
    ];
    return {
      ok: checks.every(function(check) { return check.ok; }),
      checks: checks,
      storageBytes: calculateStorageBytes(snapshot),
      storageKeys: Object.keys(snapshot).length,
      activeDraftSessionId: sessionSummary.activeId,
      activeDraftSessionName: sessionSummary.activeName,
      savedDraftCount: sessionSummary.count,
      networkOnline: navigator.onLine !== false,
      degraded: degraded
    };
  }

  function ensureStyles() {
    if (document.getElementById('war-room-resilience-styles')) return;
    var style = document.createElement('style');
    style.id = 'war-room-resilience-styles';
    style.textContent = [
      '#war-room-maintenance-dialog{width:min(680px,calc(100vw - 28px));max-width:100%;max-height:calc(100dvh - 28px);overflow:hidden;border:1px solid #3a3d43;border-radius:12px;background:#15171a;color:#f3f4f6;padding:0;box-shadow:0 24px 70px rgba(0,0,0,.55)}',
      '#war-room-maintenance-dialog::backdrop{background:rgba(4,5,7,.76)}',
      '.wr-maintenance-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:18px 20px 12px;border-bottom:1px solid #2c3036}',
      '.wr-maintenance-head h2{margin:0;font-size:1.08rem}.wr-maintenance-head p{max-width:520px;margin:5px 0 0;color:#aeb4bf;font-size:.78rem;line-height:1.4}',
      '.wr-maintenance-close{display:grid;min-width:40px;min-height:40px;place-items:center;border:0;border-radius:8px;background:transparent;color:#c9ced6;font-size:1.45rem;cursor:pointer}',
      '.wr-maintenance-close:hover{background:rgba(255,255,255,.07)}',
      '.wr-maintenance-body{max-height:calc(100dvh - 92px);overflow:auto;padding:16px 20px 20px;overscroll-behavior:contain}',
      '.wr-recovery-summary{margin-bottom:16px;padding:13px 14px;border:1px solid #3b4149;border-left-width:4px;border-radius:9px;background:#1b1e22}',
      '.wr-recovery-summary[data-state="ready"]{border-left-color:#62b785}.wr-recovery-summary[data-state="offline"]{border-left-color:#69aee7}.wr-recovery-summary[data-state="attention"]{border-left-color:#d05b55}',
      '.wr-recovery-eyebrow{display:block;margin-bottom:3px;color:#969ca5;font-size:.58rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}',
      '.wr-recovery-summary strong{display:block;color:#f4f2ec;font-size:.92rem}.wr-recovery-summary p{margin:5px 0 0;color:#aeb4bf;font-size:.72rem;line-height:1.45}',
      '.wr-recovery-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.wr-recovery-chip{display:inline-flex;align-items:center;min-height:24px;padding:3px 8px;border:1px solid #3b4149;border-radius:999px;color:#c8cdd3;background:rgba(255,255,255,.035);font-size:.61rem;font-weight:800}',
      '.wr-maintenance-section-title{margin:0 0 8px;color:#e7e8ea;font-size:.68rem;font-weight:900;letter-spacing:.07em;text-transform:uppercase}',
      '.wr-maintenance-checks{display:grid;gap:7px;margin:0 0 16px;padding:0;list-style:none}',
      '.wr-maintenance-check{display:grid;grid-template-columns:20px minmax(0,1fr) minmax(120px,auto);gap:8px;align-items:center;min-width:0;padding:9px 10px;border-radius:8px;background:#1d2025;font-size:.8rem}',
      '.wr-maintenance-check strong{min-width:0;font-weight:750}.wr-maintenance-check span:last-child{min-width:0;color:#aeb4bf;font-size:.72rem;text-align:right;overflow-wrap:anywhere}',
      '.wr-maintenance-pass{color:#8fd4a0}.wr-maintenance-fail{color:#ff9b9b}',
      '.wr-maintenance-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
      '.wr-recovery-action{display:flex;min-width:0;flex-direction:column;gap:6px;padding:10px;border:1px solid #343941;border-radius:9px;background:rgba(255,255,255,.025)}',
      '.wr-recovery-action button{width:100%;min-height:38px;cursor:pointer}.wr-recovery-action small{color:#9298a0;font-size:.64rem;line-height:1.4}',
      '.wr-recovery-danger{border-color:rgba(208,91,85,.62)!important;background:rgba(208,91,85,.1)!important;color:#f3b2ad!important}',
      '.wr-restore-confirmation{margin-top:14px;padding:13px;border:1px solid rgba(208,91,85,.55);border-radius:9px;background:rgba(208,91,85,.075)}',
      '.wr-restore-confirmation[hidden]{display:none}.wr-restore-confirmation h3{margin:0;color:#ffd1cd;font-size:.84rem}.wr-restore-confirmation p{margin:6px 0;color:#d0d3d7;font-size:.7rem;line-height:1.45}',
      '.wr-restore-file{padding:8px 9px;border-radius:7px;background:rgba(0,0,0,.2)}.wr-restore-file strong{display:block;overflow-wrap:anywhere;color:#fff;font-size:.72rem}.wr-restore-file span{display:block;margin-top:2px;color:#aeb4bf;font-size:.62rem}',
      '.wr-restore-warning{margin:10px 0 0;padding-left:18px;color:#d9c3c1;font-size:.68rem;line-height:1.5}.wr-restore-warning li+li{margin-top:3px}',
      '.wr-restore-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.wr-restore-actions button{min-height:38px;cursor:pointer}',
      '#war-room-maintenance-message{min-height:1.2em;margin:12px 0 0;padding:9px 10px;border-radius:7px;color:#aeb4bf;background:rgba(255,255,255,.03);font-size:.72rem;line-height:1.4}',
      '#war-room-maintenance-message.is-error{color:#ffb9b3;background:rgba(208,91,85,.1)}#war-room-maintenance-message.is-success{color:#a9dfba;background:rgba(98,183,133,.09)}#war-room-maintenance-message.is-info{color:#b9ddf5;background:rgba(105,174,231,.08)}',
      '.wr-maintenance-footer{display:flex;justify-content:flex-end;margin-top:12px}.wr-maintenance-footer button{min-height:38px}',
      '#war-room-maintenance-btn[data-recovery-state="attention"]{border-color:rgba(208,91,85,.6);color:#f3b2ad}#war-room-maintenance-btn[data-recovery-state="offline"]{border-color:rgba(105,174,231,.55);color:#b9ddf5}',
      '.wr-recovery-notice{position:fixed;left:50%;bottom:18px;z-index:120;display:flex;width:min(620px,calc(100vw - 24px));max-width:100%;align-items:center;justify-content:space-between;gap:12px;padding:12px 13px;border:1px solid rgba(98,183,133,.55);border-radius:10px;background:#17231c;color:#d9f2e1;box-shadow:0 16px 48px rgba(0,0,0,.45);font-size:.72rem;line-height:1.4;transform:translateX(-50%)}',
      '.wr-recovery-notice button{flex:0 0 auto;min-height:36px;cursor:pointer}',
      '@media(max-width:768px){.statusbar{flex-wrap:wrap}}',
      '@media(max-width:560px){#war-room-maintenance-dialog{width:calc(100vw - 12px);max-height:calc(100dvh - 12px);border-radius:10px}.wr-maintenance-head{gap:10px;padding:14px 14px 10px}.wr-maintenance-close{min-width:44px;min-height:44px}.wr-maintenance-body{max-height:calc(100dvh - 80px);padding:12px 14px 16px}.wr-maintenance-check{grid-template-columns:20px minmax(0,1fr);align-items:start}.wr-maintenance-check span:last-child{grid-column:2;text-align:left}.wr-maintenance-actions{grid-template-columns:1fr}.wr-recovery-action{display:grid;grid-template-columns:minmax(120px,.8fr) minmax(0,1.2fr);align-items:center}.wr-recovery-action button{min-height:44px}.wr-restore-actions{display:grid;grid-template-columns:1fr}.wr-restore-actions button,.wr-maintenance-footer button{width:100%;min-height:44px}.wr-maintenance-footer{display:block}.wr-recovery-notice{bottom:8px;align-items:stretch;flex-direction:column}.wr-recovery-notice button{width:100%;min-height:44px}}',
      '@media(max-width:360px){.wr-recovery-action{grid-template-columns:1fr}.wr-recovery-meta{display:grid;grid-template-columns:1fr}.wr-recovery-chip{border-radius:7px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureDialog() {
    var dialog = document.getElementById('war-room-maintenance-dialog');
    if (dialog) return dialog;
    ensureStyles();
    dialog = document.createElement('dialog');
    dialog.id = 'war-room-maintenance-dialog';
    dialog.setAttribute('aria-labelledby', 'war-room-maintenance-title');

    var head = document.createElement('div');
    head.className = 'wr-maintenance-head';
    var copy = document.createElement('div');
    var title = document.createElement('h2');
    title.id = 'war-room-maintenance-title';
    title.textContent = 'Draft Recovery';
    var subtitle = document.createElement('p');
    subtitle.textContent = 'Check whether this browser is ready, save a portable backup, or recover from a problem without touching scoring.';
    copy.appendChild(title);
    copy.appendChild(subtitle);
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'wr-maintenance-close';
    close.setAttribute('aria-label', 'Close draft recovery');
    close.textContent = '×';
    close.addEventListener('click', function() {
      hideRestoreConfirmation();
      dialog.close();
    });
    head.appendChild(copy);
    head.appendChild(close);

    var body = document.createElement('div');
    body.className = 'wr-maintenance-body';

    var summary = document.createElement('section');
    summary.className = 'wr-recovery-summary';
    summary.id = 'war-room-recovery-summary';
    var eyebrow = document.createElement('span');
    eyebrow.className = 'wr-recovery-eyebrow';
    eyebrow.textContent = 'Draft safety';
    var summaryTitle = document.createElement('strong');
    summaryTitle.id = 'war-room-recovery-summary-title';
    var summaryDetail = document.createElement('p');
    summaryDetail.id = 'war-room-recovery-summary-detail';
    var meta = document.createElement('div');
    meta.className = 'wr-recovery-meta';
    var sessionChip = document.createElement('span');
    sessionChip.className = 'wr-recovery-chip';
    sessionChip.id = 'war-room-recovery-session-chip';
    var networkChip = document.createElement('span');
    networkChip.className = 'wr-recovery-chip';
    networkChip.id = 'war-room-recovery-network-chip';
    meta.appendChild(sessionChip);
    meta.appendChild(networkChip);
    summary.appendChild(eyebrow);
    summary.appendChild(summaryTitle);
    summary.appendChild(summaryDetail);
    summary.appendChild(meta);

    var checkTitle = document.createElement('h3');
    checkTitle.className = 'wr-maintenance-section-title';
    checkTitle.textContent = 'System check';
    var checks = document.createElement('ul');
    checks.id = 'war-room-maintenance-checks';
    checks.className = 'wr-maintenance-checks';

    var actionTitle = document.createElement('h3');
    actionTitle.className = 'wr-maintenance-section-title';
    actionTitle.textContent = 'Recovery actions';
    var actions = document.createElement('div');
    actions.className = 'wr-maintenance-actions';

    function actionCard(label, description, handler, className) {
      var card = document.createElement('div');
      card.className = 'wr-recovery-action';
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'filterbtn' + (className ? ' ' + className : '');
      button.textContent = label;
      button.addEventListener('click', handler);
      var detail = document.createElement('small');
      detail.textContent = description;
      card.appendChild(button);
      card.appendChild(detail);
      actions.appendChild(card);
      return button;
    }

    actionCard('Save Backup', 'Downloads a copy of War Room browser data. Your current draft stays unchanged.', downloadBackup);
    actionCard('Restore from Backup', 'Selects a backup for review. Nothing is replaced until you explicitly confirm.', chooseRestoreFile, 'wr-recovery-danger');
    actionCard('Run System Check', 'Rechecks storage, board integrity, saved drafts, and offline readiness.', renderSystemCheck);

    var restorePanel = document.createElement('section');
    restorePanel.id = 'war-room-restore-confirmation';
    restorePanel.className = 'wr-restore-confirmation';
    restorePanel.hidden = true;
    var restoreTitle = document.createElement('h3');
    restoreTitle.textContent = 'Ready to restore this backup?';
    var restoreIntro = document.createElement('p');
    restoreIntro.textContent = 'The file is valid, but War Room has not changed anything yet.';
    var restoreFile = document.createElement('div');
    restoreFile.className = 'wr-restore-file';
    var restoreFileName = document.createElement('strong');
    restoreFileName.setAttribute('data-restore-file', '');
    var restoreFileDetails = document.createElement('span');
    restoreFileDetails.setAttribute('data-restore-details', '');
    restoreFile.appendChild(restoreFileName);
    restoreFile.appendChild(restoreFileDetails);
    var warning = document.createElement('ul');
    warning.className = 'wr-restore-warning';
    [
      'Your current draft and saved War Room sessions in this browser will be replaced by the backup.',
      'Other websites and unrelated browser data are not touched.',
      'War Room reloads automatically after the restore so you can continue drafting.'
    ].forEach(function(text) {
      var item = document.createElement('li');
      item.textContent = text;
      warning.appendChild(item);
    });
    var restoreActions = document.createElement('div');
    restoreActions.className = 'wr-restore-actions';
    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.id = 'war-room-cancel-restore';
    cancel.className = 'filterbtn';
    cancel.textContent = 'Cancel — Keep Current Draft';
    cancel.addEventListener('click', cancelRestore);
    var confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.id = 'war-room-confirm-restore';
    confirm.className = 'filterbtn wr-recovery-danger';
    confirm.textContent = 'Replace War Room Data & Reload';
    confirm.addEventListener('click', confirmPendingRestore);
    restoreActions.appendChild(cancel);
    restoreActions.appendChild(confirm);
    restorePanel.appendChild(restoreTitle);
    restorePanel.appendChild(restoreIntro);
    restorePanel.appendChild(restoreFile);
    restorePanel.appendChild(warning);
    restorePanel.appendChild(restoreActions);

    var message = document.createElement('p');
    message.id = 'war-room-maintenance-message';
    message.setAttribute('aria-live', 'polite');
    message.setAttribute('aria-atomic', 'true');

    var footer = document.createElement('div');
    footer.className = 'wr-maintenance-footer';
    var done = document.createElement('button');
    done.type = 'button';
    done.className = 'filterbtn';
    done.textContent = 'Back to Draft';
    done.addEventListener('click', function() {
      hideRestoreConfirmation();
      dialog.close();
    });
    footer.appendChild(done);

    body.appendChild(summary);
    body.appendChild(checkTitle);
    body.appendChild(checks);
    body.appendChild(actionTitle);
    body.appendChild(actions);
    body.appendChild(restorePanel);
    body.appendChild(message);
    body.appendChild(footer);
    dialog.appendChild(head);
    dialog.appendChild(body);
    document.body.appendChild(dialog);
    return dialog;
  }

  function setMaintenanceMessage(message, kind) {
    var element = document.getElementById('war-room-maintenance-message');
    if (!element) return;
    element.textContent = message || '';
    element.classList.remove('is-error', 'is-success', 'is-info');
    if (kind === 'error') element.classList.add('is-error');
    else if (kind === 'success') element.classList.add('is-success');
    else if (kind === 'info') element.classList.add('is-info');
    element.setAttribute('aria-live', kind === 'error' ? 'assertive' : 'polite');
  }

  function getRecoveryState(result) {
    if (!result || !result.ok || result.degraded) return 'attention';
    if (!result.networkOnline) return 'offline';
    return 'ready';
  }

  function updateRecoveryButton(result) {
    var button = document.getElementById('war-room-maintenance-btn');
    if (!button) return;
    var state = getRecoveryState(result);
    button.setAttribute('data-recovery-state', state);
    button.textContent = state === 'attention' ? 'Recovery !' : 'Recovery';
    button.title = state === 'ready'
      ? 'Draft recovery ready'
      : state === 'offline'
        ? 'Offline mode active — recovery tools available'
        : 'Recovery check needs attention';
  }

  function renderRecoverySummary(result) {
    var summary = document.getElementById('war-room-recovery-summary');
    if (!summary) return;
    var state = getRecoveryState(result);
    summary.setAttribute('data-state', state);
    var title = document.getElementById('war-room-recovery-summary-title');
    var detail = document.getElementById('war-room-recovery-summary-detail');
    var sessionChip = document.getElementById('war-room-recovery-session-chip');
    var networkChip = document.getElementById('war-room-recovery-network-chip');

    if (title) {
      title.textContent = state === 'ready'
        ? 'Recovery is ready'
        : state === 'offline'
          ? 'Offline mode is active'
          : 'Recovery needs attention';
    }
    if (detail) {
      detail.textContent = state === 'ready'
        ? 'Browser storage, the player board, core safeguards, and offline fallback are available.'
        : state === 'offline'
          ? 'The cached War Room is running without a network connection. Keep this tab open and use a backup if you need to move devices.'
          : 'One or more checks below failed. Avoid destructive recovery actions until you understand the failed check.';
    }
    if (sessionChip) {
      sessionChip.textContent = result.savedDraftCount + ' saved draft' + (result.savedDraftCount === 1 ? '' : 's') + ' · ' + result.activeDraftSessionName;
    }
    if (networkChip) {
      networkChip.textContent = result.networkOnline ? 'Online' : 'Offline · cached app';
    }
  }

  function renderSystemCheck() {
    var result = getSystemCheck();
    updateRecoveryButton(result);
    renderRecoverySummary(result);
    var list = document.getElementById('war-room-maintenance-checks');
    if (!list) return result;
    list.textContent = '';
    result.checks.forEach(function(check) {
      var item = document.createElement('li');
      item.className = 'wr-maintenance-check';
      var status = document.createElement('span');
      status.className = check.ok ? 'wr-maintenance-pass' : 'wr-maintenance-fail';
      status.textContent = check.ok ? '✓' : '!';
      status.setAttribute('aria-label', check.ok ? 'Pass' : 'Needs attention');
      var label = document.createElement('strong');
      label.textContent = check.label;
      var detail = document.createElement('span');
      detail.textContent = check.detail;
      item.appendChild(status);
      item.appendChild(label);
      item.appendChild(detail);
      list.appendChild(item);
    });
    setMaintenanceMessage(
      result.ok
        ? (result.networkOnline ? 'System check passed. Your recovery tools are ready.' : 'System check passed while offline. Cached War Room remains available on this device.')
        : 'One or more checks need attention. Review the failed row before restoring a backup.',
      result.ok ? 'success' : 'error'
    );
    return result;
  }

  function openMaintenance() {
    var dialog = ensureDialog();
    hideRestoreConfirmation();
    renderSystemCheck();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function ensureMaintenanceButton() {
    if (document.getElementById('war-room-maintenance-btn')) return;
    var statusbar = document.querySelector('.statusbar');
    if (!statusbar) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'filterbtn';
    button.id = 'war-room-maintenance-btn';
    button.textContent = 'Recovery';
    button.setAttribute('aria-label', 'Open draft recovery and system check');
    button.addEventListener('click', openMaintenance);
    statusbar.appendChild(button);
    updateRecoveryButton(getSystemCheck());
  }

  function showRecoveryNotice(message) {
    if (!message) return;
    ensureStyles();
    var existing = document.getElementById('war-room-recovery-notice');
    if (existing) existing.remove();
    var notice = document.createElement('div');
    notice.id = 'war-room-recovery-notice';
    notice.className = 'wr-recovery-notice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    var text = document.createElement('span');
    text.textContent = message + ' Review the Draft selector if needed, then continue drafting.';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'filterbtn';
    button.textContent = 'Continue Drafting';
    button.addEventListener('click', function() {
      notice.remove();
      var firstRow = document.querySelector('tr.draftrow:not(.drafted-mine):not(.drafted-other)');
      if (firstRow && typeof firstRow.focus === 'function') firstRow.focus({preventScroll: true});
    });
    notice.appendChild(text);
    notice.appendChild(button);
    document.body.appendChild(notice);
  }

  function consumeRestoreNotice() {
    var message = '';
    try {
      message = sessionStorage.getItem(RESTORE_NOTICE_KEY) || '';
      if (message) sessionStorage.removeItem(RESTORE_NOTICE_KEY);
    } catch (error) {}
    if (message) showRecoveryNotice(message);
  }

  function registerOfflineSupport() {
    if (!offlineState.supported) {
      offlineState.error = 'service workers unsupported';
      renderSystemCheck();
      return Promise.resolve(offlineState);
    }
    return fetch('service-worker.js', {cache: 'no-store'}).then(function(response) {
      var contentType = response.headers.get('content-type') || '';
      if (!response.ok || !/(?:java|ecma)script/i.test(contentType)) {
        offlineState.error = 'worker script MIME type unavailable';
        renderSystemCheck();
        return null;
      }
      return navigator.serviceWorker.register('service-worker.js', {scope: './'});
    }).then(function(registration) {
      if (!registration) return offlineState;
      offlineState.registered = true;
      offlineState.controlled = Boolean(navigator.serviceWorker.controller);
      if (registration.waiting && navigator.serviceWorker.controller) registration.waiting.postMessage({type: 'SKIP_WAITING'});
      return navigator.serviceWorker.ready;
    }).then(function() {
      if (!offlineState.registered) return offlineState;
      offlineState.controlled = Boolean(navigator.serviceWorker.controller);
      renderSystemCheck();
      return offlineState;
    }).catch(function(error) {
      if (offlineState.controlled && navigator.onLine === false) {
        offlineState.registered = true;
        offlineState.error = '';
        renderSystemCheck();
        return offlineState;
      }
      offlineState.error = error && error.message ? error.message : 'registration failed';
      renderSystemCheck();
      return offlineState;
    });
  }

  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      offlineState.registered = true;
      offlineState.controlled = true;
      renderSystemCheck();
    });
  }
  window.addEventListener('online', renderSystemCheck);
  window.addEventListener('offline', renderSystemCheck);

  window.WarRoomResilience = {
    installed: true,
    backupSchema: BACKUP_SCHEMA,
    backupVersion: BACKUP_VERSION,
    isWarRoomStorageKey: isWarRoomStorageKey,
    collectStorageSnapshot: collectStorageSnapshot,
    buildBackup: buildBackup,
    validateBackup: validateBackup,
    restoreBackupObject: restoreBackupObject,
    runSystemCheck: getSystemCheck,
    openMaintenance: openMaintenance,
    registerOfflineSupport: registerOfflineSupport,
    offlineState: offlineState
  };

  ensureMaintenanceButton();
  registerOfflineSupport();
  consumeRestoreNotice();
})();