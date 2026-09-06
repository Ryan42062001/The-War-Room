/* =========================================================
   DRAFT AWARENESS — TARGETS + WHAT CHANGED
   Adds session-scoped personal targets and a compact feed of
   meaningful board movement without changing recommendation scores.
   ========================================================= */

(function() {
  'use strict';

  var TARGET_STORAGE_PREFIX = 'war-room-targets-v1:';
  var ALERT_STORAGE_PREFIX = 'war-room-change-feed-v1:';
  var PRESSURE_POSITIONS = ['RB', 'WR', 'QB', 'TE'];
  var MAX_TARGETS_RENDERED = 5;
  var MAX_ALERTS = 3;

  var currentSessionId = '';
  var targets = [];
  var alerts = [];
  var observer = null;
  var refreshFrame = 0;
  var baseline = null;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function canonicalName(value) {
    if (typeof window.canonicalExpertPlayerName === 'function') {
      return window.canonicalExpertPlayerName(value);
    }
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function getSessionId() {
    return String(window.activeDraftSessionId || 'legacy');
  }

  function storageRead(key) {
    try { return localStorage.getItem(key); } catch (error) { return null; }
  }

  function storageWrite(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function targetStorageKey() {
    return TARGET_STORAGE_PREFIX + getSessionId();
  }

  function alertStorageKey() {
    return ALERT_STORAGE_PREFIX + getSessionId();
  }

  function getRows() {
    if (typeof window.getCachedDraftRows === 'function') {
      try { return window.getCachedDraftRows(); } catch (error) {}
    }
    return Array.prototype.slice.call(document.querySelectorAll('tr.draftrow'));
  }

  function rowDisplayName(row) {
    if (!row) return '';
    if (typeof window.getDraftRowDisplayName === 'function') {
      try { return window.getDraftRowDisplayName(row); } catch (error) {}
    }
    return row.getAttribute('data-display-name') || row.getAttribute('data-name') || '';
  }

  function rowKey(row) {
    return canonicalName(rowDisplayName(row));
  }

  function rowForKey(key) {
    var safeKey = canonicalName(key);
    if (!safeKey) return null;
    return getRows().find(function(row) { return rowKey(row) === safeKey; }) || null;
  }

  function rowStatus(row) {
    if (!row) return 'missing';
    if (typeof window.getDraftRowStatus === 'function') {
      try { return window.getDraftRowStatus(row); } catch (error) {}
    }
    if (row.classList.contains('drafted-mine')) return 'mine';
    if (row.classList.contains('drafted-other')) return 'taken';
    return 'available';
  }

  function rowRank(row) {
    if (!row) return 9999;
    var rank = Number(row.getAttribute('data-ecr')) || Number(row.getAttribute('data-rank'));
    return Number.isFinite(rank) && rank > 0 ? rank : 9999;
  }

  function sanitizeTargets(value) {
    if (!Array.isArray(value)) return [];
    var seen = {};
    return value.slice(0, 50).map(function(item) {
      if (!item || typeof item !== 'object') return null;
      var name = String(item.name || '').trim().slice(0, 120);
      var key = canonicalName(item.key || name);
      if (!name || !key || seen[key]) return null;
      seen[key] = true;
      return {
        name: name,
        key: key,
        addedAt: Number(item.addedAt) || Date.now()
      };
    }).filter(Boolean);
  }

  function loadTargets() {
    var raw = storageRead(targetStorageKey());
    if (!raw) return [];
    try { return sanitizeTargets(JSON.parse(raw)); } catch (error) { return []; }
  }

  function saveTargets() {
    storageWrite(targetStorageKey(), JSON.stringify(targets));
  }

  function sanitizeAlerts(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, MAX_ALERTS).map(function(item) {
      if (!item || typeof item !== 'object') return null;
      var text = String(item.text || '').trim().slice(0, 220);
      if (!text) return null;
      return {
        type: ['critical', 'closing', 'watch', 'success', 'info'].indexOf(item.type) >= 0 ? item.type : 'info',
        text: text,
        key: String(item.key || text).slice(0, 180),
        at: Number(item.at) || Date.now()
      };
    }).filter(Boolean);
  }

  function loadAlerts() {
    var raw = storageRead(alertStorageKey());
    if (!raw) return [];
    try { return sanitizeAlerts(JSON.parse(raw)); } catch (error) { return []; }
  }

  function saveAlerts() {
    storageWrite(alertStorageKey(), JSON.stringify(alerts));
  }

  function announce(text) {
    var announcer = document.getElementById('draft-action-announcer');
    if (announcer) announcer.textContent = text;
  }

  function pushAlert(type, text, key) {
    key = String(key || text);
    alerts = alerts.filter(function(alert) { return alert.key !== key; });
    alerts.unshift({type:type || 'info', text:text, key:key, at:Date.now()});
    alerts = alerts.slice(0, MAX_ALERTS);
    saveAlerts();
  }

  function clearAlerts() {
    alerts = [];
    saveAlerts();
  }

  function isTargetKey(key) {
    var safeKey = canonicalName(key);
    return targets.some(function(target) { return target.key === safeKey; });
  }

  function toggleTarget(value) {
    var row = value && value.nodeType === 1 ? value.closest('tr.draftrow') : null;
    if (!row && typeof value === 'string') row = rowForKey(value);
    if (!row && value && value.getAttribute) {
      row = rowForKey(value.getAttribute('data-player-key') || value.getAttribute('data-name'));
    }
    if (!row) return false;

    var key = rowKey(row);
    var name = rowDisplayName(row);
    var index = targets.findIndex(function(target) { return target.key === key; });
    var added;

    if (index >= 0) {
      targets.splice(index, 1);
      added = false;
      announce(name + ' removed from Targets.');
    } else {
      targets.push({name:name, key:key, addedAt:Date.now()});
      added = true;
      announce(name + ' added to Targets.');
    }

    saveTargets();
    scheduleRefresh();
    return added;
  }

  function clearTargets() {
    targets = [];
    saveTargets();
    scheduleRefresh();
  }

  function targetEntries() {
    return targets.map(function(target) {
      var row = rowForKey(target.key);
      return {
        target: target,
        row: row,
        status: rowStatus(row),
        position: row ? (row.getAttribute('data-pos') || '') : '',
        rank: rowRank(row)
      };
    }).sort(function(left, right) {
      var statusOrder = {available:0, mine:1, taken:2, missing:3};
      var statusGap = (statusOrder[left.status] || 0) - (statusOrder[right.status] || 0);
      if (statusGap) return statusGap;
      if (left.rank !== right.rank) return left.rank - right.rank;
      return left.target.addedAt - right.target.addedAt;
    });
  }

  function bestAvailableTarget() {
    return targetEntries().find(function(entry) { return entry.status === 'available'; }) || null;
  }

  function ensureStyles() {
    if (document.getElementById('war-room-draft-awareness-styles')) return;
    var link = document.createElement('link');
    link.id = 'war-room-draft-awareness-styles';
    link.rel = 'stylesheet';
    link.href = 'draft-awareness.css?v=20260906-1';
    document.head.appendChild(link);
  }

  function ensureStrip() {
    var strip = document.getElementById('draft-awareness-strip');
    if (strip) return strip;
    var bar = document.getElementById('draft-command-bar');
    if (!bar || !bar.parentNode) return null;
    strip = document.createElement('section');
    strip.id = 'draft-awareness-strip';
    strip.className = 'draft-awareness-strip';
    strip.setAttribute('aria-label', 'Draft targets and board changes');
    bar.parentNode.insertBefore(strip, bar.nextSibling);
    return strip;
  }

  function ensureTargetStars() {
    document.querySelectorAll('.position-player-card').forEach(function(card) {
      var key = canonicalName(card.getAttribute('data-player-key'));
      if (!key) return;
      var star = card.querySelector('.draft-target-star');
      if (!star) {
        star = document.createElement('span');
        star.className = 'draft-target-star';
        star.setAttribute('aria-hidden', 'true');
        card.appendChild(star);
      }

      if (star.getAttribute('data-target-key') !== key) {
        star.setAttribute('data-target-key', key);
      }

      var targeted = isTargetKey(key);
      var nextText = targeted ? '★' : '☆';
      var nextTitle = targeted ? 'Remove from Targets' : 'Add to Targets';
      if (star.textContent !== nextText) star.textContent = nextText;
      if (star.title !== nextTitle) star.title = nextTitle;
      if (card.classList.contains('is-targeted') !== targeted) {
        card.classList.toggle('is-targeted', targeted);
      }
    });
  }

  function renderTargets(entries) {
    var availableCount = entries.filter(function(entry) { return entry.status === 'available'; }).length;
    var label = entries.length ? ('TARGETS · ' + availableCount + '/' + entries.length + ' LIVE') : 'TARGETS';
    var chips = entries.slice(0, MAX_TARGETS_RENDERED).map(function(entry) {
      var rank = entry.rank < 9999 ? '#' + entry.rank : '';
      var detail = entry.status === 'available'
        ? [entry.position, rank].filter(Boolean).join(' · ')
        : entry.status === 'mine' ? 'MINE' : entry.status === 'taken' ? 'TAKEN' : 'OFF BOARD';
      return '<button type="button" class="draft-target-chip is-' + entry.status + '" data-target-jump="' + escapeHtml(entry.target.key) + '" title="Jump to ' + escapeHtml(entry.target.name) + '">' +
        '<span aria-hidden="true">★</span><strong>' + escapeHtml(entry.target.name) + '</strong><small>' + escapeHtml(detail) + '</small>' +
      '</button>';
    }).join('');

    if (entries.length > MAX_TARGETS_RENDERED) {
      chips += '<span class="draft-target-more">+' + (entries.length - MAX_TARGETS_RENDERED) + '</span>';
    }

    return '<div class="draft-awareness-targets">' +
      '<div class="draft-awareness-heading"><span>' + label + '</span><small>' + (entries.length ? 'T toggles focused player' : 'Star players to build your queue') + '</small></div>' +
      '<div class="draft-target-list">' + (chips || '<span class="draft-awareness-empty">No targets yet</span>') + '</div>' +
    '</div>';
  }

  function renderAlerts() {
    var mineCount = document.querySelectorAll('tr.draftrow.drafted-mine').length;
    var heading = mineCount ? 'SINCE YOUR PICK' : 'WHAT CHANGED';
    var markup = alerts.map(function(alert) {
      return '<span class="draft-change-item is-' + alert.type + '"><i aria-hidden="true"></i>' + escapeHtml(alert.text) + '</span>';
    }).join('');
    return '<div class="draft-awareness-changes">' +
      '<div class="draft-awareness-heading"><span>' + heading + '</span><small>Only meaningful movement</small></div>' +
      '<div class="draft-change-list">' + (markup || '<span class="draft-awareness-empty">No major board movement</span>') + '</div>' +
    '</div>';
  }

  function renderStrip() {
    var strip = ensureStrip();
    if (!strip) return;
    strip.innerHTML = renderTargets(targetEntries()) + renderAlerts();
    strip.classList.toggle('has-alerts', alerts.length > 0);
    strip.classList.toggle('has-targets', targets.length > 0);

    strip.querySelectorAll('[data-target-jump]').forEach(function(button) {
      button.addEventListener('click', function() {
        jumpToTarget(button.getAttribute('data-target-jump'));
      });
    });
  }

  function jumpToTarget(key) {
    var card = Array.prototype.find.call(document.querySelectorAll('.position-player-card'), function(candidate) {
      return canonicalName(candidate.getAttribute('data-player-key')) === canonicalName(key);
    });
    if (card) {
      var block = card.closest('.position-tier-block');
      if (block) block.open = true;
      card.hidden = false;
      card.scrollIntoView({behavior:'smooth', block:'center'});
      card.focus({preventScroll:true});
      return true;
    }

    var row = rowForKey(key);
    if (row) {
      row.scrollIntoView({behavior:'smooth', block:'center'});
      if (typeof row.focus === 'function') row.focus({preventScroll:true});
      return true;
    }
    return false;
  }

  function pressureLevel(available) {
    available = Number(available);
    if (!Number.isFinite(available) || available > 4) return {name:'safe', severity:0};
    if (available <= 0) return {name:'critical', severity:4};
    if (available === 1) return {name:'critical', severity:3};
    if (available === 2) return {name:'closing', severity:2};
    return {name:'watch', severity:1};
  }

  function capturePressure() {
    var snapshot = {};
    PRESSURE_POSITIONS.forEach(function(position) {
      var column = document.querySelector('.position-column[data-position="' + position + '"]');
      if (!column) {
        snapshot[position] = {tier:'', available:null, level:'safe', severity:0};
        return;
      }
      var blocks = Array.prototype.slice.call(column.querySelectorAll('.position-tier-block'));
      var active = blocks.find(function(block) {
        var available = Number(block.getAttribute('data-available'));
        return !block.classList.contains('is-exhausted') && Number.isFinite(available) && available > 0;
      });
      if (!active) {
        snapshot[position] = {tier:'', available:0, level:'critical', severity:4};
        return;
      }
      var available = Number(active.getAttribute('data-available'));
      var pressure = pressureLevel(available);
      snapshot[position] = {
        tier: active.getAttribute('data-tier') || '',
        available: available,
        level: pressure.name,
        severity: pressure.severity
      };
    });
    return snapshot;
  }

  function captureTargetStatuses() {
    var result = {};
    targets.forEach(function(target) {
      result[target.key] = rowStatus(rowForKey(target.key));
    });
    return result;
  }

  function completedCount() {
    if (typeof window.getCompletedDraftPickCount === 'function') {
      try { return Number(window.getCompletedDraftPickCount()) || 0; } catch (error) {}
    }
    return document.querySelectorAll('tr.draftrow.drafted-mine, tr.draftrow.drafted-other').length;
  }

  function mineCount() {
    return document.querySelectorAll('tr.draftrow.drafted-mine').length;
  }

  function picksUntilMine() {
    if (typeof window.getDraftAssistantState !== 'function') return null;
    try {
      var state = window.getDraftAssistantState();
      var value = state && Number(state.picksUntilMyTurn);
      return Number.isFinite(value) ? value : null;
    } catch (error) {
      return null;
    }
  }

  function makeBaseline() {
    return {
      completed: completedCount(),
      mine: mineCount(),
      until: picksUntilMine(),
      pressure: capturePressure(),
      targets: captureTargetStatuses()
    };
  }

  function compareTargetChanges(previous, current) {
    targets.forEach(function(target) {
      var before = previous[target.key];
      var after = current[target.key];
      if (before === 'available' && after === 'taken') {
        pushAlert('critical', target.name + ' was taken.', 'target-taken-' + target.key);
      }
    });
  }

  function comparePressureChanges(previous, current) {
    PRESSURE_POSITIONS.forEach(function(position) {
      var before = previous[position];
      var after = current[position];
      if (!before || !after) return;

      if (before.tier && after.tier && before.tier !== after.tier) {
        var tierType = after.available <= 2 ? 'closing' : 'watch';
        pushAlert(tierType, position + ' moved into ' + after.tier + ' · ' + after.available + ' left.', 'tier-' + position + '-' + after.tier);
        return;
      }

      if (after.severity > before.severity) {
        var type = after.severity >= 3 ? 'critical' : after.severity === 2 ? 'closing' : 'watch';
        var label = after.level.toUpperCase();
        var tier = after.tier ? ' in ' + after.tier : '';
        pushAlert(type, position + ' ' + label + ' · ' + after.available + ' left' + tier + '.', 'pressure-' + position + '-' + label);
      }
    });
  }

  function evaluateChanges() {
    var session = getSessionId();
    if (session !== currentSessionId) {
      currentSessionId = session;
      targets = loadTargets();
      alerts = loadAlerts();
      baseline = makeBaseline();
      renderStrip();
      ensureTargetStars();
      return;
    }

    var next = makeBaseline();
    if (!baseline) {
      baseline = next;
      renderStrip();
      ensureTargetStars();
      return;
    }

    if (next.completed < baseline.completed || next.mine < baseline.mine) {
      clearAlerts();
      baseline = next;
      renderStrip();
      ensureTargetStars();
      return;
    }

    var ownPickAdded = next.mine > baseline.mine;
    if (ownPickAdded) {
      clearAlerts();
    } else if (next.completed > 0 || baseline.completed > 0) {
      compareTargetChanges(baseline.targets, next.targets);
      comparePressureChanges(baseline.pressure, next.pressure);
    }

    var bestTarget = bestAvailableTarget();
    if (!ownPickAdded && bestTarget && baseline.until !== null && next.until !== null) {
      if (baseline.until > 2 && next.until > 0 && next.until <= 2) {
        pushAlert('success', bestTarget.target.name + ' is still available with ' + next.until + (next.until === 1 ? ' pick' : ' picks') + ' before you.', 'target-near-' + bestTarget.target.key);
      } else if (baseline.until > 0 && next.until === 0) {
        pushAlert('success', bestTarget.target.name + ' survived to your pick.', 'target-survived-' + bestTarget.target.key);
      }
    }

    baseline = next;
    renderStrip();
    ensureTargetStars();
  }

  function scheduleRefresh() {
    if (refreshFrame) return;
    refreshFrame = requestAnimationFrame(function() {
      refreshFrame = 0;
      evaluateChanges();
    });
  }

  function resetBaseline() {
    baseline = makeBaseline();
  }

  function installInteractions() {
    document.addEventListener('click', function(event) {
      var star = event.target && event.target.closest ? event.target.closest('.draft-target-star') : null;
      if (!star) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      toggleTarget(star.getAttribute('data-target-key'));
    }, true);

    document.addEventListener('keydown', function(event) {
      if (String(event.key || '').toLowerCase() !== 't' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      var target = event.target;
      if (!target || target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      var card = target.closest('.position-player-card');
      var row = target.closest('tr.draftrow');
      if (!card && !row) return;
      event.preventDefault();
      toggleTarget(card ? card.getAttribute('data-player-key') : row);
    });
  }

  function observeSources() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(scheduleRefresh);

    var grid = document.getElementById('position-tier-grid');
    if (grid) observer.observe(grid, {
      subtree:true,
      attributes:true,
      attributeFilter:['data-available', 'data-status']
    });

    var table = document.getElementById('big-table');
    if (table) observer.observe(table, {
      subtree:true,
      attributes:true,
      attributeFilter:['class', 'data-pick']
    });

    observer.observe(document.body, {
      attributes:true,
      attributeFilter:['data-board-view', 'data-draft-command-mode']
    });
  }

  function init() {
    ensureStyles();
    currentSessionId = getSessionId();
    targets = loadTargets();
    alerts = loadAlerts();
    baseline = makeBaseline();
    installInteractions();
    observeSources();
    renderStrip();
    ensureTargetStars();
  }

  window.WarRoomDraftAwareness = {
    getTargets: function() { return targets.slice(); },
    getAlerts: function() { return alerts.slice(); },
    toggleTarget: toggleTarget,
    clearTargets: clearTargets,
    clearAlerts: clearAlerts,
    capturePressure: capturePressure,
    evaluateNow: evaluateChanges,
    resetBaseline: resetBaseline,
    jumpToTarget: jumpToTarget
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
