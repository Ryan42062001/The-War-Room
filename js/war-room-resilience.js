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
  var offlineState = {
    supported: 'serviceWorker' in navigator,
    registered: false,
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
    setMaintenanceMessage('Backup exported · ' + Object.keys(backup.storage).length + ' keys');
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

  function chooseRestoreFile() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.hidden = true;
    document.body.appendChild(input);
    input.addEventListener('change', function() {
      var file = input.files && input.files[0];
      readBackupFile(file).then(function(payload) {
        if (!window.confirm('Restore this War Room backup? Current War Room browser data will be replaced.')) return;
        var result = restoreBackupObject(payload);
        setMaintenanceMessage('Backup restored · ' + result.restoredKeys + ' keys. Reloading…');
        window.setTimeout(function() { window.location.reload(); }, 150);
      }).catch(function(error) {
        setMaintenanceMessage(error.message, true);
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
    var sessions = [];
    try {
      if (typeof window.readDraftSessionRegistry === 'function') sessions = window.readDraftSessionRegistry();
    } catch (error) {}
    var snapshot = collectStorageSnapshot();
    var checks = [
      {label: 'Browser storage', ok: storageWritable(), detail: Math.round(calculateStorageBytes(snapshot) / 1024) + ' KiB used'},
      {label: 'Player board', ok: rows.length === 717 && uniqueNames === rows.length, detail: rows.length + ' rows · ' + uniqueNames + ' unique'},
      {label: 'FantasyPros dataset', ok: datasetCount === 717, detail: datasetCount == null ? 'not loaded' : datasetCount + ' players'},
      {label: 'Hardening layer', ok: Boolean(window.WarRoomHardening && window.WarRoomHardening.installed), detail: document.body.getAttribute('data-war-room-degraded') === 'true' ? 'degraded UI reported' : 'loaded'},
      {label: 'Draft awareness', ok: typeof window.WarRoomDraftAwareness === 'object', detail: typeof window.WarRoomDraftAwareness === 'object' ? 'loaded' : 'unavailable'},
      {label: 'Live awareness sync', ok: typeof window.WarRoomAwarenessLiveSync === 'object', detail: typeof window.WarRoomAwarenessLiveSync === 'object' ? 'loaded' : 'unavailable'},
      {label: 'Offline reload', ok: offlineState.supported && offlineState.registered, detail: offlineState.error || (offlineState.controlled ? 'active' : offlineState.registered ? 'installed; activates on reload' : 'not registered')},
      {label: 'Saved drafts', ok: Array.isArray(sessions), detail: sessions.length + ' session' + (sessions.length === 1 ? '' : 's')}
    ];
    return {
      ok: checks.every(function(check) { return check.ok; }),
      checks: checks,
      storageBytes: calculateStorageBytes(snapshot),
      storageKeys: Object.keys(snapshot).length,
      activeDraftSessionId: typeof window.activeDraftSessionId === 'string' ? window.activeDraftSessionId : null
    };
  }

  function ensureStyles() {
    if (document.getElementById('war-room-resilience-styles')) return;
    var style = document.createElement('style');
    style.id = 'war-room-resilience-styles';
    style.textContent = [
      '#war-room-maintenance-dialog{width:min(620px,calc(100vw - 28px));border:1px solid #3a3d43;border-radius:12px;background:#15171a;color:#f3f4f6;padding:0;box-shadow:0 24px 70px rgba(0,0,0,.55)}',
      '#war-room-maintenance-dialog::backdrop{background:rgba(4,5,7,.72)}',
      '.wr-maintenance-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:18px 20px 12px;border-bottom:1px solid #2c3036}',
      '.wr-maintenance-head h2{margin:0;font-size:1.05rem}.wr-maintenance-head p{margin:5px 0 0;color:#aeb4bf;font-size:.78rem}',
      '.wr-maintenance-close{border:0;background:transparent;color:#c9ced6;font-size:1.45rem;cursor:pointer}',
      '.wr-maintenance-body{padding:16px 20px 20px}',
      '.wr-maintenance-checks{display:grid;gap:7px;margin:0 0 16px;padding:0;list-style:none}',
      '.wr-maintenance-check{display:grid;grid-template-columns:20px 1fr auto;gap:8px;align-items:center;padding:9px 10px;border-radius:8px;background:#1d2025;font-size:.8rem}',
      '.wr-maintenance-check strong{font-weight:700}.wr-maintenance-check span:last-child{color:#aeb4bf;font-size:.72rem;text-align:right}',
      '.wr-maintenance-pass{color:#8fd4a0}.wr-maintenance-fail{color:#ff9b9b}',
      '.wr-maintenance-actions{display:flex;flex-wrap:wrap;gap:8px}.wr-maintenance-actions button{cursor:pointer}',
      '#war-room-maintenance-message{min-height:1.1em;margin:12px 0 0;color:#aeb4bf;font-size:.75rem}',
      '#war-room-maintenance-message.is-error{color:#ff9b9b}'
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
    title.textContent = 'War Room Maintenance';
    var subtitle = document.createElement('p');
    subtitle.textContent = 'Offline readiness, browser-state backup, and system diagnostics.';
    copy.appendChild(title);
    copy.appendChild(subtitle);
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'wr-maintenance-close';
    close.setAttribute('aria-label', 'Close maintenance');
    close.textContent = '×';
    close.addEventListener('click', function() { dialog.close(); });
    head.appendChild(copy);
    head.appendChild(close);

    var body = document.createElement('div');
    body.className = 'wr-maintenance-body';
    var checks = document.createElement('ul');
    checks.id = 'war-room-maintenance-checks';
    checks.className = 'wr-maintenance-checks';
    var actions = document.createElement('div');
    actions.className = 'wr-maintenance-actions';

    function actionButton(label, handler) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'filterbtn';
      button.textContent = label;
      button.addEventListener('click', handler);
      actions.appendChild(button);
    }
    actionButton('Refresh Check', renderSystemCheck);
    actionButton('Export Backup', downloadBackup);
    actionButton('Restore Backup', chooseRestoreFile);

    var message = document.createElement('p');
    message.id = 'war-room-maintenance-message';
    message.setAttribute('aria-live', 'polite');
    body.appendChild(checks);
    body.appendChild(actions);
    body.appendChild(message);
    dialog.appendChild(head);
    dialog.appendChild(body);
    document.body.appendChild(dialog);
    return dialog;
  }

  function setMaintenanceMessage(message, isError) {
    var element = document.getElementById('war-room-maintenance-message');
    if (!element) return;
    element.textContent = message || '';
    element.classList.toggle('is-error', Boolean(isError));
  }

  function renderSystemCheck() {
    var result = getSystemCheck();
    var list = document.getElementById('war-room-maintenance-checks');
    if (!list) return result;
    list.textContent = '';
    result.checks.forEach(function(check) {
      var item = document.createElement('li');
      item.className = 'wr-maintenance-check';
      var status = document.createElement('span');
      status.className = check.ok ? 'wr-maintenance-pass' : 'wr-maintenance-fail';
      status.textContent = check.ok ? '✓' : '!';
      var label = document.createElement('strong');
      label.textContent = check.label;
      var detail = document.createElement('span');
      detail.textContent = check.detail;
      item.appendChild(status);
      item.appendChild(label);
      item.appendChild(detail);
      list.appendChild(item);
    });
    setMaintenanceMessage(result.ok ? 'All maintenance checks passed.' : 'One or more maintenance checks need attention.', !result.ok);
    return result;
  }

  function openMaintenance() {
    var dialog = ensureDialog();
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
    button.textContent = 'Maintenance';
    button.addEventListener('click', openMaintenance);
    statusbar.appendChild(button);
  }

  function registerOfflineSupport() {
    if (!offlineState.supported) {
      offlineState.error = 'service workers unsupported';
      return Promise.resolve(offlineState);
    }
    return navigator.serviceWorker.register('service-worker.js', {scope: './'}).then(function(registration) {
      offlineState.registered = true;
      offlineState.controlled = Boolean(navigator.serviceWorker.controller);
      if (registration.waiting && navigator.serviceWorker.controller) registration.waiting.postMessage({type: 'SKIP_WAITING'});
      return navigator.serviceWorker.ready;
    }).then(function() {
      offlineState.registered = true;
      offlineState.controlled = Boolean(navigator.serviceWorker.controller);
      renderSystemCheck();
      return offlineState;
    }).catch(function(error) {
      offlineState.error = error && error.message ? error.message : 'registration failed';
      renderSystemCheck();
      return offlineState;
    });
  }

  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('controllerchange', function() {
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
})();
