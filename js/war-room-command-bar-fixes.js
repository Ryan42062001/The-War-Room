/* =========================================================
   COMMAND BAR UX + SESSION SAFETY HARDENING
   Keeps draft setup visible, makes On-the-Clock unmistakable,
   and prevents silent ESPN session takeovers mid-draft.
   ========================================================= */

(function() {
  'use strict';

  var SETTING_IDS = ['pcTeams', 'pcSlot', 'pcRounds'];
  var setupObserver = null;
  var settingsCaptureReady = false;
  var sessionGuardReady = false;
  var originalSelectEspnDraftSession = null;

  function clampInt(value, min, max, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = Number(fallback);
    if (!Number.isFinite(number)) number = min;
    return Math.max(min, Math.min(max, Math.trunc(number)));
  }

  function installFixStyles() {
    if (document.getElementById('war-room-command-bar-fix-styles')) return;
    var link = document.createElement('link');
    link.id = 'war-room-command-bar-fix-styles';
    link.rel = 'stylesheet';
    link.href = 'command-bar-fixes.css?v=20260906-1';
    document.head.appendChild(link);
  }

  function canonicalSettings(values) {
    values = values || {};
    var teams = clampInt(values.teams, 2, 20, window.LEAGUE_SIZE || 10);
    var slot = clampInt(values.slot, 1, teams, window.MY_DRAFT_SLOT || 1);
    var rounds = clampInt(values.rounds, 1, 30, window.TOTAL_ROUNDS || 16);
    return {teams:teams, slot:slot, rounds:rounds};
  }

  function readPrimarySettings() {
    return canonicalSettings({
      teams: document.getElementById('pcTeams')?.value,
      slot: document.getElementById('pcSlot')?.value,
      rounds: document.getElementById('pcRounds')?.value
    });
  }

  function syncVisibleSetupControls(values) {
    var setup = document.querySelector('#draft-command-bar .draft-command-setup');
    if (!setup) return;
    var teams = setup.querySelector('[data-command-setting="teams"]');
    var slot = setup.querySelector('[data-command-setting="slot"]');
    var rounds = setup.querySelector('[data-command-setting="rounds"]');
    if (teams) teams.value = String(values.teams);
    if (slot) {
      slot.max = String(values.teams);
      slot.value = String(values.slot);
    }
    if (rounds) rounds.value = String(values.rounds);
  }

  function applyDraftSettings(values, publish) {
    var next = canonicalSettings(values);
    var pcTeams = document.getElementById('pcTeams');
    var pcSlot = document.getElementById('pcSlot');
    var pcRounds = document.getElementById('pcRounds');

    if (pcTeams) pcTeams.value = String(next.teams);
    if (pcSlot) {
      pcSlot.max = String(next.teams);
      pcSlot.value = String(next.slot);
    }
    if (pcRounds) pcRounds.value = String(next.rounds);

    window.LEAGUE_SIZE = next.teams;
    window.MY_DRAFT_SLOT = next.slot;
    window.TOTAL_ROUNDS = next.rounds;
    syncVisibleSetupControls(next);

    if (typeof window.renderAutoDraftTeamToggles === 'function') window.renderAutoDraftTeamToggles();
    if (typeof window.triggerAllBoardUpdates === 'function') window.triggerAllBoardUpdates({deferIntelligence:true});
    if (typeof window.scheduleSave === 'function') window.scheduleSave();
    if (publish !== false && typeof window.publishEspnSyncSettingsUpdate === 'function') {
      window.publishEspnSyncSettingsUpdate();
    }
    if (typeof window.refreshDraftCommandBar === 'function') window.refreshDraftCommandBar();
    return next;
  }

  function readCommandSettings(setup) {
    return canonicalSettings({
      teams: setup.querySelector('[data-command-setting="teams"]')?.value,
      slot: setup.querySelector('[data-command-setting="slot"]')?.value,
      rounds: setup.querySelector('[data-command-setting="rounds"]')?.value
    });
  }

  function createSetupControls() {
    var values = readPrimarySettings();
    var setup = document.createElement('div');
    setup.className = 'draft-command-setup';
    setup.innerHTML =
      '<span class="draft-command-eyebrow">DRAFT SETUP</span>' +
      '<div class="draft-command-setup-fields">' +
        '<label>Teams<input data-command-setting="teams" type="number" min="2" max="20" inputmode="numeric" aria-label="League teams" value="' + values.teams + '"></label>' +
        '<label>Pick<input data-command-setting="slot" type="number" min="1" max="' + values.teams + '" inputmode="numeric" aria-label="Your draft slot" value="' + values.slot + '"></label>' +
        '<label>Rounds<input data-command-setting="rounds" type="number" min="1" max="30" inputmode="numeric" aria-label="Draft rounds" value="' + values.rounds + '"></label>' +
      '</div>';

    setup.querySelectorAll('input').forEach(function(input) {
      input.addEventListener('change', function() {
        applyDraftSettings(readCommandSettings(setup), true);
      });
    });
    return setup;
  }

  function ensureSetupControls() {
    var bar = document.getElementById('draft-command-bar');
    if (!bar || bar.querySelector('.draft-command-setup')) return;
    var actions = bar.querySelector('.draft-command-actions');
    var setup = createSetupControls();
    if (actions) bar.insertBefore(setup, actions);
    else bar.appendChild(setup);
  }

  function observeCommandBar() {
    var bar = document.getElementById('draft-command-bar');
    if (!bar) return;
    if (setupObserver) setupObserver.disconnect();
    setupObserver = new MutationObserver(function() { ensureSetupControls(); });
    setupObserver.observe(bar, {childList:true});
    ensureSetupControls();
  }

  function installSafeSettingsEvents() {
    if (settingsCaptureReady) return;
    settingsCaptureReady = true;

    // The legacy controls recalculated and published on every keystroke.
    // Typing is now inert; change/blur commits one complete setting update.
    document.addEventListener('input', function(event) {
      if (!event.target || SETTING_IDS.indexOf(event.target.id) < 0) return;
      event.stopImmediatePropagation();
    }, true);

    document.addEventListener('change', function(event) {
      if (!event.target || SETTING_IDS.indexOf(event.target.id) < 0) return;
      event.stopImmediatePropagation();
      applyDraftSettings(readPrimarySettings(), true);
    }, true);

    // Direct callers, including the companion bridge/tests, use the same path.
    window.updatePickSettings = function() {
      return applyDraftSettings(readPrimarySettings(), true);
    };
  }

  function currentDraftHasProgress() {
    if (typeof window.getCompletedDraftPickCount === 'function') {
      try { return Number(window.getCompletedDraftPickCount()) > 0; } catch (error) {}
    }
    return Boolean(document.querySelector('tr.draftrow.drafted-mine, tr.draftrow.drafted-other'));
  }

  function currentDraftIsComplete() {
    if (typeof window.isDraftComplete !== 'function') return false;
    try { return Boolean(window.isDraftComplete()); } catch (error) { return false; }
  }

  function shouldProtectEspnSessionSwitch(draftKey) {
    if (!draftKey || typeof window.readDraftSessionRegistry !== 'function') return false;
    var safeKey = typeof window.normalizeDraftKey === 'function'
      ? window.normalizeDraftKey(draftKey)
      : String(draftKey || '');
    var sessions = window.readDraftSessionRegistry();
    var active = sessions.find(function(session) { return session.id === window.activeDraftSessionId; });
    var incoming = sessions.find(function(session) { return session.draftKey === safeKey; });
    if (!active || !incoming || incoming.id === active.id) return false;
    return currentDraftHasProgress() && !currentDraftIsComplete();
  }

  function installSessionGuard() {
    if (sessionGuardReady || typeof window.selectEspnDraftSession !== 'function') return;
    sessionGuardReady = true;
    originalSelectEspnDraftSession = window.selectEspnDraftSession;

    window.selectEspnDraftSession = function(draftKey) {
      if (!shouldProtectEspnSessionSwitch(draftKey)) {
        return originalSelectEspnDraftSession.call(window, draftKey);
      }

      var message = 'ESPN Sync paused · another saved ESPN draft is active. Use the Draft menu to switch intentionally.';
      if (typeof window.updateEspnSyncStatus === 'function') window.updateEspnSyncStatus('error', message);
      var announcer = document.getElementById('draft-action-announcer');
      if (announcer) announcer.textContent = message;
      setTimeout(function() {
        if (typeof window.updateEspnSyncStatus === 'function') window.updateEspnSyncStatus('error', message);
      }, 0);
      return false;
    };
  }

  function init() {
    installFixStyles();
    installSafeSettingsEvents();
    installSessionGuard();
    observeCommandBar();
  }

  window.WarRoomCommandBarFixes = {
    applySettings: applyDraftSettings,
    shouldProtectEspnSessionSwitch: shouldProtectEspnSessionSwitch,
    ensureSetupControls: ensureSetupControls
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
