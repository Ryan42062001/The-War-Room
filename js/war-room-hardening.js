/* =========================================================
   WAR ROOM HARDENING LAYER
   Reliability and configuration compatibility only.
   This module must not change rankings, scoring, recommendations,
   or ESPN draft reconciliation.
   ========================================================= */

(function() {
  'use strict';

  if (window.WarRoomHardening && window.WarRoomHardening.installed) return;

  var POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST'];
  var FLEX_ELIGIBLE = ['RB', 'WR', 'TE'];
  var originalUpdateMyTeam = typeof window.updateMyTeam === 'function'
    ? window.updateMyTeam
    : null;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getDraftedPlayers() {
    return Array.prototype.slice.call(
      document.querySelectorAll('tr.draftrow.drafted-mine')
    ).map(function(row) {
      return {
        name: row.getAttribute('data-name') || 'Unknown Player',
        pos: row.getAttribute('data-pos') || 'N/A',
        row: row
      };
    });
  }

  function allocateConfiguredStarters(players, limits) {
    var starters = {QB:[], RB:[], WR:[], TE:[], FLEX:[], K:[], DST:[]};
    var assigned = new Set();

    ['QB', 'RB', 'WR', 'TE', 'K', 'DST'].forEach(function(position) {
      var limit = Math.max(0, Number(limits[position]) || 0);
      players.forEach(function(player) {
        if (starters[position].length >= limit) return;
        if (player.pos !== position || assigned.has(player)) return;
        starters[position].push(player);
        assigned.add(player);
      });
    });

    var flexLimit = Math.max(0, Number(limits.FLEX) || 0);
    players.forEach(function(player) {
      if (starters.FLEX.length >= flexLimit) return;
      if (assigned.has(player) || FLEX_ELIGIBLE.indexOf(player.pos) < 0) return;
      starters.FLEX.push(player);
      assigned.add(player);
    });

    return starters;
  }

  function starterCount(starters) {
    return POSITION_ORDER.reduce(function(total, position) {
      return total + (starters[position] ? starters[position].length : 0);
    }, 0);
  }

  function renderNeeds(target, players, starters, limits) {
    if (!target) return;
    var counts = {QB:0, RB:0, WR:0, TE:0, K:0, DST:0};
    players.forEach(function(player) {
      if (counts[player.pos] !== undefined) counts[player.pos]++;
    });

    var html = [];
    POSITION_ORDER.forEach(function(position) {
      var limit = Math.max(0, Number(limits[position]) || 0);
      if (!limit) return;
      var filled = position === 'FLEX'
        ? starters.FLEX.length
        : Math.min(limit, counts[position] || 0);
      if (filled >= limit) {
        html.push('<span class="roster-need roster-need-filled">' + position + ' ✓</span>');
      } else {
        html.push('<span class="roster-need roster-need-open">' + position + ' ' + filled + '/' + limit + '</span>');
      }
    });
    target.innerHTML = html.join('');
  }

  function slotHtml(label, player) {
    var className = 'pos-' + label;
    if (player) {
      return '<div class="starter-slot filled">' +
        '<span class="starter-position ' + className + '">' + escapeHtml(label) + '</span>' +
        '<span class="starter-player">' + escapeHtml(player.name) + '</span>' +
        '<span class="starter-check">✓</span>' +
      '</div>';
    }
    return '<div class="starter-slot empty">' +
      '<span class="starter-position ' + className + '">' + escapeHtml(label) + '</span>' +
      '<span class="starter-player empty-player">—</span>' +
      '<span class="starter-missing">OPEN</span>' +
    '</div>';
  }

  function renderLineup(target, players, starters, limits) {
    if (!target) return;
    var lineup = '<div class="starting-lineup"><div class="starting-lineup-title">STARTERS</div>';

    POSITION_ORDER.forEach(function(position) {
      var limit = Math.max(0, Number(limits[position]) || 0);
      for (var index = 0; index < limit; index++) {
        lineup += slotHtml(position, starters[position][index] || null);
      }
    });
    lineup += '</div>';

    var roster = players.map(function(player) {
      return '<div class="team-player-card">' +
        '<span class="pos-pill pos-' + escapeHtml(player.pos) + '">' + escapeHtml(player.pos) + '</span>' +
        '<span class="team-player-name">' + escapeHtml(player.name) + '</span>' +
      '</div>';
    }).join('');

    target.innerHTML = lineup +
      '<div class="roster-divider">ALL DRAFTED PLAYERS</div>' +
      (roster || '<div class="empty-roster">No players drafted yet.</div>');
  }

  function renderConfiguredRosterSurface() {
    if (typeof window.getConfiguredStarterLimits !== 'function') return;
    var limits = window.getConfiguredStarterLimits();
    var players = getDraftedPlayers();
    var starters = allocateConfiguredStarters(players, limits);
    var countElement = document.getElementById('myteam-starter-count');
    if (countElement && typeof window.getConfiguredStarterTotal === 'function') {
      countElement.textContent = starterCount(starters) + ' / ' +
        window.getConfiguredStarterTotal() + ' starters';
    }

    var panel = document.getElementById('myteam-panel');
    var lineupPanel = document.getElementById('lineup-panel');
    var shouldRenderLineup = Boolean(
      panel && panel.classList.contains('open') &&
      lineupPanel && lineupPanel.classList.contains('active')
    );
    if (!shouldRenderLineup) return;

    renderNeeds(document.getElementById('needs-row'), players, starters, limits);
    renderLineup(document.getElementById('roster-list'), players, starters, limits);
  }

  function installConfiguredRosterRenderer() {
    if (!originalUpdateMyTeam) return false;
    window.updateMyTeam = function() {
      var result = originalUpdateMyTeam.apply(this, arguments);
      renderConfiguredRosterSurface();
      return result;
    };
    renderConfiguredRosterSurface();
    return true;
  }

  window.WarRoomHardening = {
    installed: true,
    renderConfiguredRosterSurface: renderConfiguredRosterSurface,
    allocateConfiguredStarters: allocateConfiguredStarters,
    installConfiguredRosterRenderer: installConfiguredRosterRenderer
  };

  installConfiguredRosterRenderer();
})();
