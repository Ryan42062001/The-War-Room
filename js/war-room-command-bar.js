/* =========================================================
   DRAFT COMMAND BAR — PRESENTATION LAYER
   Repackages existing authoritative draft state, recommendation,
   and position-tier pressure into fast Waiting / On-the-Clock views.
   ========================================================= */

(function() {
  'use strict';

  var refreshFrame = 0;
  var commandObserver = null;
  var pressurePositions = ['RB', 'WR', 'QB', 'TE'];

  function escapeCommandHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function ensureCommandStyles() {
    if (document.getElementById('war-room-command-bar-styles')) return;
    var link = document.createElement('link');
    link.id = 'war-room-command-bar-styles';
    link.rel = 'stylesheet';
    link.href = 'command-bar.css?v=20260906-1';
    document.head.appendChild(link);
  }

  function ensureCommandBar() {
    var bar = document.getElementById('draft-command-bar');
    if (bar) return bar;

    var anchor = document.getElementById('pick-counter-box');
    if (!anchor || !anchor.parentNode) return null;

    bar = document.createElement('section');
    bar.id = 'draft-command-bar';
    bar.className = 'draft-command-bar';
    bar.setAttribute('aria-label', 'Live draft command bar');
    bar.setAttribute('aria-live', 'polite');
    anchor.parentNode.insertBefore(bar, anchor);
    document.body.classList.add('command-bar-ready');
    return bar;
  }

  function safeDraftState() {
    if (typeof window.getDraftAssistantState !== 'function') return null;
    try {
      return window.getDraftAssistantState();
    } catch (error) {
      console.warn('Draft command bar state unavailable.', error);
      return null;
    }
  }

  function formatRoundPick(overallPick, teams) {
    overallPick = Number(overallPick) || 0;
    teams = Number(teams) || 10;
    if (overallPick < 1 || teams < 1) return '--';
    var round = Math.ceil(overallPick / teams);
    var pickInRound = ((overallPick - 1) % teams) + 1;
    return round + '.' + String(pickInRound).padStart(2, '0');
  }

  function getRecommendationSummary() {
    var container = document.getElementById('recommended-pick-text');
    var card = container && container.querySelector('.recommendation-card');
    var player = card && card.querySelector('.recommendation-player b');
    var position = card && card.querySelector('.recommendation-player small');
    var action = card && card.querySelector('.recommendation-action');
    var confidence = card && card.querySelector('.recommendation-confidence');
    var reason = card && card.querySelector('.recommendation-one-line');

    if (!card || !player) {
      return {
        player: 'Building recommendation…',
        position: '',
        action: 'RECOMMENDED',
        confidence: '',
        reason: container ? container.textContent.trim() : 'Draft intelligence is loading.'
      };
    }

    return {
      player: player.textContent.trim(),
      position: position ? position.textContent.trim() : '',
      action: action ? action.textContent.trim() : 'RECOMMENDED',
      confidence: confidence ? confidence.textContent.replace(/\s+/g, ' ').trim() : '',
      reason: reason ? reason.textContent.replace(/\s+/g, ' ').trim() : ''
    };
  }

  function normalizeCommandName(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function getDecisionAlternatives(primaryName) {
    var primary = normalizeCommandName(primaryName);
    var seen = {};
    var alternatives = [];

    document.querySelectorAll('#position-decision-strip .position-decision-card').forEach(function(card) {
      if (alternatives.length >= 2) return;
      var labelNode = card.querySelector('span');
      var nameNode = card.querySelector('strong');
      if (!nameNode) return;
      var label = labelNode ? labelNode.textContent.trim() : '';
      var name = nameNode.textContent.trim();
      var key = normalizeCommandName(name);
      if (!name || !key || key === primary || seen[key] || /NEXT PICK/i.test(label)) return;
      seen[key] = true;
      alternatives.push({ label: label || 'ALT', name: name });
    });

    return alternatives;
  }

  function getLiveTierAvailable(block) {
    if (!block) return 0;
    var cards = Array.prototype.slice.call(block.querySelectorAll('.position-player-card'));
    if (cards.length) {
      return cards.filter(function(card) {
        return card.getAttribute('data-status') === 'available';
      }).length;
    }

    var cached = parseInt(block.getAttribute('data-available'), 10);
    return Number.isFinite(cached) ? cached : 0;
  }

  function getPositionPressure(position) {
    var column = document.querySelector('.position-column[data-position="' + position + '"]');
    if (!column) return { position: position, level: 'safe', label: 'SAFE', tier: '', available: null };

    var blocks = Array.prototype.slice.call(column.querySelectorAll('.position-tier-block'));
    var active = blocks.find(function(block) {
      return getLiveTierAvailable(block) > 0;
    });

    if (!active) return { position: position, level: 'critical', label: 'EMPTY', tier: '', available: 0 };

    var available = getLiveTierAvailable(active);
    var tier = active.getAttribute('data-tier') || '';
    var level = 'safe';
    var label = 'SAFE';

    if (available <= 1) {
      level = 'critical';
      label = 'CRITICAL';
    } else if (available === 2) {
      level = 'closing';
      label = 'CLOSING';
    } else if (available <= 4) {
      level = 'watch';
      label = 'WATCH';
    }

    return {
      position: position,
      level: level,
      label: label,
      tier: tier,
      available: available
    };
  }

  function buildPressureMarkup() {
    return pressurePositions.map(function(position) {
      var pressure = getPositionPressure(position);
      var detail = pressure.available === null ? pressure.label : pressure.available + ' · ' + pressure.label;
      return '<button type="button" class="draft-command-pressure is-' + pressure.level + '" data-command-position="' + position + '" title="' + escapeCommandHtml(position + ' ' + pressure.tier + ': ' + detail) + '">' +
        '<b>' + position + '</b><span>' + escapeCommandHtml(detail) + '</span>' +
      '</button>';
    }).join('');
  }

  function buildAlternativeMarkup(alternatives) {
    if (!alternatives.length) return '';
    return '<div class="draft-command-alternatives"><span>ALTS</span>' + alternatives.map(function(item) {
      return '<b><small>' + escapeCommandHtml(item.label) + '</small>' + escapeCommandHtml(item.name) + '</b>';
    }).join('') + '</div>';
  }

  function commandModeForState(state) {
    if (!state) return 'waiting';
    if (typeof window.getDraftCompletionStatus === 'function') {
      try {
        if (window.getDraftCompletionStatus(state).complete === true) return 'complete';
      } catch (error) {
        console.warn('Draft command bar completion unavailable.', error);
      }
    }
    return state.onClock ? 'on-clock' : 'waiting';
  }

  function renderDraftCommandBar() {
    refreshFrame = 0;
    var bar = ensureCommandBar();
    if (!bar) return;

    var state = safeDraftState();
    var mode = commandModeForState(state);
    var recommendation = getRecommendationSummary();
    // The recommendation panel may still carry terminal copy immediately after
    // undo. Do not mirror that stale claim into an incomplete command bar.
    if (mode !== 'complete' && recommendation.player === 'DRAFT COMPLETE') {
      recommendation = {
        player: 'Tracking draft position', position: '', action: 'RECOMMENDED',
        confidence: '', reason: 'Waiting for the next draft update.'
      };
    }
    var teams = state ? state.teams : 10;
    var current = state ? formatRoundPick(state.currentPick, teams) : '--';
    var next = state && state.myNextPick ? formatRoundPick(state.myNextPick, teams) : '--';
    var until = state && Number.isFinite(state.picksUntilMyTurn) ? state.picksUntilMyTurn : null;
    var near = mode === 'waiting' && until !== null && until <= 2;
    var alternatives = mode === 'on-clock' ? getDecisionAlternatives(recommendation.player) : [];
    var detailsOpen = document.body.classList.contains('command-details-open');

    document.body.setAttribute('data-draft-command-mode', mode);
    bar.className = 'draft-command-bar is-' + mode + (near ? ' is-near' : '');

    var modeLabel = mode === 'on-clock' ? 'ON THE CLOCK' : (mode === 'complete' ? 'DRAFT COMPLETE' : 'WAITING');
    var statusLine = mode === 'on-clock'
      ? 'Your pick · ' + current
      : (mode === 'complete'
        ? 'All configured rounds finished'
        : (until === null ? 'Tracking draft position' : until + (until === 1 ? ' pick until yours' : ' picks until yours')));
    var pickLine = mode === 'waiting' ? 'Current ' + current + ' · You ' + next : (mode === 'on-clock' ? 'Pick now' : 'Review your draft');

    bar.innerHTML =
      '<div class="draft-command-status">' +
        '<span class="draft-command-mode"><i aria-hidden="true"></i>' + escapeCommandHtml(modeLabel) + '</span>' +
        '<strong>' + escapeCommandHtml(statusLine) + '</strong>' +
        '<small>' + escapeCommandHtml(pickLine) + '</small>' +
      '</div>' +
      '<div class="draft-command-recommendation">' +
        '<span class="draft-command-eyebrow">' + escapeCommandHtml(mode === 'on-clock' ? 'MAKE THE PICK' : 'RECOMMENDED') + '</span>' +
        '<div class="draft-command-player-line"><strong>' + escapeCommandHtml(recommendation.player) + '</strong>' +
          (recommendation.position ? '<span>' + escapeCommandHtml(recommendation.position) + '</span>' : '') + '</div>' +
        '<small class="draft-command-reason">' + escapeCommandHtml(recommendation.reason || recommendation.confidence || recommendation.action) + '</small>' +
        buildAlternativeMarkup(alternatives) +
      '</div>' +
      '<div class="draft-command-pressure-wrap">' +
        '<span class="draft-command-eyebrow">BOARD PRESSURE</span>' +
        '<div class="draft-command-pressure-list">' + buildPressureMarkup() + '</div>' +
      '</div>' +
      '<div class="draft-command-actions">' +
        '<button type="button" class="draft-command-action" data-command-action="why">Why?</button>' +
        '<button type="button" class="draft-command-action" data-command-action="details" aria-expanded="' + String(detailsOpen) + '">' + (detailsOpen ? 'Hide Intel' : 'Intel') + '</button>' +
      '</div>';

    bar.querySelectorAll('[data-command-position]').forEach(function(button) {
      button.addEventListener('click', function() {
        var position = button.getAttribute('data-command-position');
        var column = document.querySelector('.position-column[data-position="' + position + '"]');
        if (column) column.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    var detailsButton = bar.querySelector('[data-command-action="details"]');
    if (detailsButton) detailsButton.addEventListener('click', function() {
      document.body.classList.toggle('command-details-open');
      scheduleDraftCommandRefresh();
    });

    var whyButton = bar.querySelector('[data-command-action="why"]');
    if (whyButton) whyButton.addEventListener('click', function() {
      document.body.classList.add('command-details-open');
      var recommendationCard = document.querySelector('#recommended-pick-text .recommendation-card');
      if (recommendationCard && recommendationCard.tagName === 'DETAILS') recommendationCard.open = true;
      scheduleDraftCommandRefresh();
    });
  }

  function scheduleDraftCommandRefresh() {
    if (refreshFrame) return;
    refreshFrame = window.requestAnimationFrame(renderDraftCommandBar);
  }

  function observeDraftCommandSources() {
    if (commandObserver) commandObserver.disconnect();
    commandObserver = new MutationObserver(scheduleDraftCommandRefresh);

    ['pick-counter-text', 'recommended-pick-text', 'position-tier-grid', 'position-decision-strip'].forEach(function(id) {
      var target = document.getElementById(id);
      if (target) commandObserver.observe(target, { childList: true, subtree: true, characterData: true, attributes: true });
    });

    commandObserver.observe(document.body, { attributes: true, attributeFilter: ['data-board-view'] });
  }

  function initDraftCommandBar() {
    ensureCommandStyles();
    ensureCommandBar();
    observeDraftCommandSources();

    document.addEventListener('change', function(event) {
      if (event.target && ['pcTeams', 'pcSlot', 'pcRounds'].includes(event.target.id)) {
        scheduleDraftCommandRefresh();
      }
    });

    scheduleDraftCommandRefresh();
  }

  window.initDraftCommandBar = initDraftCommandBar;
  window.refreshDraftCommandBar = scheduleDraftCommandRefresh;
})();
