/* =========================================================
   DRAFT-DAY LAYOUT EFFICIENCY
   Presentation-only coordination for live controls, secondary
   maintenance disclosure, progressive Draft Setup disclosure,
   and the phone-only WR-026 decision view.
   Does not change draft state, scoring, recommendations, or sync.
   ========================================================= */

(function() {
  'use strict';

  var STYLE_ID = 'war-room-layout-efficiency-styles';
  var SHELL_ID = 'draft-control-shell';
  var MANAGE_ID = 'draft-manage';
  var MANAGE_ACTIONS_ID = 'draft-manage-actions';
  var SETUP_DISCLOSURE_CLASS = 'draft-command-setup-disclosure';
  var PHONE_DECISION_SCRIPT_ID = 'war-room-phone-decision-script';
  var observer = null;
  var setupEditing = false;
  var syncQueued = false;
  var lastCommandMode = '';
  var layoutReady = false;
  var layoutStarting = false;

  var MANAGE_SELECTORS = [
    '.draft-session-control > button',
    '#autosaveToggle',
    '#mockAuditBtn',
    '#rankingsRefreshBtn',
    '#editRanksBtn',
    '.fantasypros-order-btn',
    '#resetBtn',
    '#war-room-maintenance-btn'
  ];

  function reportStyleFailure() {
    if (typeof window.reportWarRoomEnhancementFailure === 'function') {
      window.reportWarRoomEnhancementFailure('layout efficiency styles');
    }
  }

  function loadStyles(onReady) {
    var existing = document.getElementById(STYLE_ID);
    if (existing) {
      if (existing.sheet) {
        onReady();
        return;
      }
      existing.addEventListener('load', onReady, {once:true});
      existing.addEventListener('error', reportStyleFailure, {once:true});
      return;
    }

    var link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = 'layout-efficiency.css?v=20260909-2';
    link.addEventListener('load', onReady, {once:true});
    link.addEventListener('error', reportStyleFailure, {once:true});
    document.head.appendChild(link);
  }

  function loadPhoneDecisionView() {
    if (window.WarRoomPhoneDecisionView) {
      if (typeof window.WarRoomPhoneDecisionView.refresh === 'function') {
        window.WarRoomPhoneDecisionView.refresh();
      }
      return;
    }
    if (document.getElementById(PHONE_DECISION_SCRIPT_ID)) return;

    var script = document.createElement('script');
    script.id = PHONE_DECISION_SCRIPT_ID;
    script.src = 'js/war-room-phone-decision-view.js?v=20260909-1';
    script.async = false;
    script.addEventListener('error', function() {
      if (typeof window.reportWarRoomEnhancementFailure === 'function') {
        window.reportWarRoomEnhancementFailure('phone decision view');
      }
    }, {once:true});
    document.head.appendChild(script);
  }

  function hasDraftProgress() {
    if (typeof window.getCompletedDraftPickCount === 'function') {
      try { return Number(window.getCompletedDraftPickCount()) > 0; } catch (error) {}
    }
    return Boolean(document.querySelector('tr.draftrow.drafted-mine, tr.draftrow.drafted-other'));
  }

  function readDraftSettings() {
    function read(id, fallback) {
      var input = document.getElementById(id);
      var value = Number(input && input.value);
      return Number.isFinite(value) ? Math.trunc(value) : fallback;
    }
    var teams = read('pcTeams', Number(window.LEAGUE_SIZE) || 10);
    var slot = read('pcSlot', Number(window.MY_DRAFT_SLOT) || 1);
    var rounds = read('pcRounds', Number(window.TOTAL_ROUNDS) || 16);
    return {teams:teams, slot:slot, rounds:rounds};
  }

  function createShell() {
    var toolbar = document.querySelector('.toolbar');
    if (!toolbar || !toolbar.parentNode) return null;
    var shell = document.getElementById(SHELL_ID);
    if (shell) return shell;
    shell = document.createElement('section');
    shell.id = SHELL_ID;
    shell.className = 'draft-control-shell';
    shell.setAttribute('aria-label', 'Draft controls and live decision status');
    toolbar.parentNode.insertBefore(shell, toolbar);
    return shell;
  }

  function ensureToolbarFilterGroup() {
    var toolbar = document.querySelector('.toolbar');
    if (!toolbar) return;
    var group = toolbar.querySelector('.position-filter-strip');
    if (!group) {
      group = document.createElement('div');
      group.className = 'position-filter-strip';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', 'Filter players by position');
      var first = toolbar.querySelector('.filterbtn[data-pos]');
      if (first) toolbar.insertBefore(group, first);
    }
    Array.prototype.slice.call(toolbar.querySelectorAll(':scope > .filterbtn[data-pos]')).forEach(function(button) {
      group.appendChild(button);
    });
  }

  function createManageDisclosure(statusbar) {
    var details = document.getElementById(MANAGE_ID);
    if (details) return details;

    details = document.createElement('details');
    details.id = MANAGE_ID;
    details.className = 'draft-manage';
    details.innerHTML =
      '<summary class="draft-manage-summary" aria-label="Manage draft and maintenance actions">Manage</summary>' +
      '<div class="draft-manage-actions" id="' + MANAGE_ACTIONS_ID + '"></div>';

    var announcer = document.getElementById('draft-action-announcer');
    if (announcer && announcer.parentNode === statusbar) statusbar.insertBefore(details, announcer);
    else statusbar.appendChild(details);

    details.addEventListener('keydown', function(event) {
      if (event.key !== 'Escape' || !details.open) return;
      event.preventDefault();
      details.open = false;
      var summary = details.querySelector('summary');
      if (summary) summary.focus();
    });

    details.addEventListener('toggle', function() {
      if (details.open) return;
      var active = document.activeElement;
      if (active && active !== details.querySelector('summary') && details.contains(active)) {
        details.querySelector('summary').focus();
      }
    });

    return details;
  }

  function moveManageActions() {
    var statusbar = document.querySelector('.statusbar');
    if (!statusbar) return;
    var details = createManageDisclosure(statusbar);
    var actions = details.querySelector('#' + MANAGE_ACTIONS_ID);
    if (!actions) return;

    MANAGE_SELECTORS.forEach(function(selector) {
      Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(function(control) {
        if (control.closest('#' + MANAGE_ACTIONS_ID) || control === details || control.contains(details)) return;
        actions.appendChild(control);
      });
    });
  }

  function ensureControlShell() {
    var shell = createShell();
    if (!shell) return;
    var toolbar = document.querySelector('.toolbar');
    var statusbar = document.querySelector('.statusbar');
    var commandBar = document.getElementById('draft-command-bar');
    var tierNav = document.getElementById('tier-nav');

    if (toolbar && toolbar.parentNode !== shell) shell.appendChild(toolbar);
    if (statusbar && statusbar.parentNode !== shell) shell.appendChild(statusbar);
    if (commandBar && commandBar.parentNode !== shell) shell.appendChild(commandBar);
    if (tierNav && tierNav.parentNode !== shell) shell.appendChild(tierNav);
  }

  function setupSummaryText() {
    var settings = readDraftSettings();
    return settings.teams + ' teams · Pick ' + settings.slot + ' · ' + settings.rounds + ' rounds';
  }

  function configureSetupDisclosure(details) {
    if (!details || details.dataset.layoutEfficiencyReady === 'true') return;
    details.dataset.layoutEfficiencyReady = 'true';
    details.addEventListener('keydown', function(event) {
      if (event.key !== 'Escape' || !details.open) return;
      event.preventDefault();
      setupEditing = false;
      details.open = false;
      var summary = details.querySelector('summary');
      if (summary) summary.focus();
    });
    details.addEventListener('toggle', function() {
      if (hasDraftProgress()) setupEditing = details.open;
      if (!details.open) {
        var active = document.activeElement;
        if (active && active !== details.querySelector('summary') && details.contains(active)) {
          details.querySelector('summary').focus();
        }
      }
    });
  }

  function ensureSetupDisclosure() {
    var bar = document.getElementById('draft-command-bar');
    if (!bar) return;
    var setup = bar.querySelector('.draft-command-setup');
    if (!setup) return;

    var details = setup.closest('.' + SETUP_DISCLOSURE_CLASS);
    if (!details) {
      details = document.createElement('details');
      details.className = SETUP_DISCLOSURE_CLASS;
      var summary = document.createElement('summary');
      summary.className = 'draft-command-setup-summary';
      summary.innerHTML = '<span class="draft-command-setup-summary-value"></span><span class="draft-command-setup-edit">Edit</span>';
      setup.parentNode.insertBefore(details, setup);
      details.appendChild(summary);
      details.appendChild(setup);
      configureSetupDisclosure(details);
    }

    var value = details.querySelector('.draft-command-setup-summary-value');
    var nextSummary = setupSummaryText();
    if (value && value.textContent !== nextSummary) value.textContent = nextSummary;

    var progressed = hasDraftProgress();
    if (!progressed) {
      setupEditing = false;
      details.open = true;
      details.dataset.progress = 'false';
    } else {
      if (details.dataset.progress !== 'true') details.open = Boolean(setupEditing);
      details.dataset.progress = 'true';
    }
  }

  function updateHeaderState() {
    document.body.classList.toggle('draft-layout-has-progress', hasDraftProgress());
  }

  function revealUrgentCommandState() {
    var mode = document.body.getAttribute('data-draft-command-mode') || '';
    if (mode === lastCommandMode) return;
    var previousMode = lastCommandMode;
    lastCommandMode = mode;
    if (mode !== 'on-clock' || previousMode === 'on-clock') return;

    var bar = document.getElementById('draft-command-bar');
    if (!bar || typeof bar.scrollIntoView !== 'function') return;
    var rect = bar.getBoundingClientRect();
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) return;

    var reduceMotion = false;
    try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (error) {}
    bar.scrollIntoView({behavior:reduceMotion ? 'auto' : 'smooth', block:'start'});
  }

  function synchronize() {
    syncQueued = false;
    ensureToolbarFilterGroup();
    ensureControlShell();
    moveManageActions();
    ensureSetupDisclosure();
    updateHeaderState();
    revealUrgentCommandState();
    loadPhoneDecisionView();
  }

  function scheduleSynchronize() {
    if (!layoutReady || syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(synchronize);
  }

  function observeLayout() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(scheduleSynchronize);
    observer.observe(document.body, {
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class','data-pick','data-board-view','data-draft-command-mode']
    });
  }

  function installSettingListeners() {
    document.addEventListener('change', function(event) {
      if (!event.target) return;
      if (event.target.id === 'pcTeams' || event.target.id === 'pcSlot' || event.target.id === 'pcRounds' || event.target.hasAttribute('data-command-setting')) {
        scheduleSynchronize();
      }
    }, true);
  }

  function startLayout() {
    if (layoutReady) return;
    layoutReady = true;
    synchronize();
    observeLayout();
    installSettingListeners();
    window.addEventListener('resize', scheduleSynchronize, {passive:true});
    document.body.classList.add('draft-layout-efficiency-ready');
  }

  function init() {
    if (layoutReady || layoutStarting) return;
    layoutStarting = true;
    loadStyles(function() {
      layoutStarting = false;
      startLayout();
    });
  }

  window.WarRoomLayoutEfficiency = {
    version: 1,
    refresh: scheduleSynchronize,
    hasDraftProgress: hasDraftProgress,
    readDraftSettings: readDraftSettings,
    isReady: function() { return layoutReady; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
