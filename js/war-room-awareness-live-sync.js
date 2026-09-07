/* =========================================================
   DRAFT AWARENESS — LIVE TIER SYNC
   Keeps count-bearing "Since Your Pick" alerts aligned with the
   player cards that are actually still available in the active tier.
   ========================================================= */

(function() {
  'use strict';

  var POSITIONS = ['RB', 'WR', 'QB', 'TE'];
  var refreshFrame = 0;
  var observer = null;

  function pressureLevel(available) {
    if (available <= 1) return {name:'critical', severity:3};
    if (available === 2) return {name:'closing', severity:2};
    if (available <= 4) return {name:'watch', severity:1};
    return {name:'safe', severity:0};
  }

  function liveAvailableInTier(block) {
    if (!block) return 0;
    return Array.prototype.slice.call(
      block.querySelectorAll('.position-player-card')
    ).filter(function(card) {
      return card.getAttribute('data-status') === 'available';
    }).length;
  }

  function getPositionPressure(position) {
    var column = document.querySelector('.position-column[data-position="' + position + '"]');
    if (!column) {
      return {position:position, tier:'', available:null, level:'safe', severity:0};
    }

    var blocks = Array.prototype.slice.call(column.querySelectorAll('.position-tier-block'));
    var active = null;
    var available = 0;

    blocks.some(function(block) {
      var count = liveAvailableInTier(block);
      if (count <= 0) return false;
      active = block;
      available = count;
      return true;
    });

    if (!active) {
      return {position:position, tier:'', available:0, level:'critical', severity:4};
    }

    var pressure = pressureLevel(available);
    return {
      position: position,
      tier: active.getAttribute('data-tier') || '',
      available: available,
      level: pressure.name,
      severity: pressure.severity
    };
  }

  function parsePositionAlert(item) {
    var text = String(item && item.textContent || '').replace(/\s+/g, ' ').trim();
    var pressure = text.match(/^(RB|WR|QB|TE)\s+(WATCH|CLOSING|CRITICAL)\s*·/i);
    if (pressure) {
      return {item:item, position:pressure[1].toUpperCase(), kind:'pressure', tier:''};
    }

    var tier = text.match(/^(RB|WR|QB|TE)\s+moved into\s+([A-Z]+)\s*·/i);
    if (tier) {
      return {
        item:item,
        position:tier[1].toUpperCase(),
        kind:'tier',
        tier:tier[2].toUpperCase()
      };
    }

    return null;
  }

  function alertTypeForPressure(state) {
    if (state.severity >= 3) return 'critical';
    if (state.severity === 2) return 'closing';
    if (state.severity === 1) return 'watch';
    return 'info';
  }

  function setAlert(item, type, text) {
    if (!item) return;
    ['is-success', 'is-watch', 'is-closing', 'is-critical', 'is-info'].forEach(function(name) {
      item.classList.remove(name);
    });
    item.classList.add('is-' + type);

    if (item.textContent.trim() === text) return;
    var dot = document.createElement('i');
    dot.setAttribute('aria-hidden', 'true');
    item.replaceChildren(dot, document.createTextNode(text));
  }

  function removeEntries(entries, keep) {
    entries.forEach(function(entry) {
      if (entry !== keep && entry.item && entry.item.parentNode) {
        entry.item.parentNode.removeChild(entry.item);
      }
    });
  }

  function reconcilePosition(position, entries, state) {
    if (!entries.length) return;

    var pressureEntries = entries.filter(function(entry) { return entry.kind === 'pressure'; });
    var tierEntries = entries.filter(function(entry) { return entry.kind === 'tier'; });

    if (state.severity > 0 && pressureEntries.length) {
      var pressureEntry = pressureEntries[0];
      var tierSuffix = state.tier ? ' in ' + state.tier : '';
      setAlert(
        pressureEntry.item,
        alertTypeForPressure(state),
        position + ' ' + state.level.toUpperCase() + ' · ' + state.available + ' left' + tierSuffix
      );
      removeEntries(entries, pressureEntry);
      return;
    }

    var currentTierEntry = tierEntries.find(function(entry) {
      return entry.tier === String(state.tier || '').toUpperCase();
    });

    if (currentTierEntry && state.tier) {
      setAlert(
        currentTierEntry.item,
        state.severity > 0 ? alertTypeForPressure(state) : 'watch',
        position + ' moved into ' + state.tier + ' · ' + state.available + ' left'
      );
      removeEntries(entries, currentTierEntry);
      return;
    }

    removeEntries(entries, null);
  }

  function ensureEmptyState(list) {
    if (!list || list.querySelector('.draft-change-item')) return;
    if (list.querySelector('.draft-awareness-empty')) return;
    var empty = document.createElement('span');
    empty.className = 'draft-awareness-empty';
    empty.textContent = 'No major board movement';
    list.appendChild(empty);
  }

  function reconcileNow() {
    refreshFrame = 0;
    var list = document.querySelector('#draft-awareness-strip .draft-change-list');
    if (!list) return;

    var entries = Array.prototype.slice.call(
      list.querySelectorAll('.draft-change-item')
    ).map(parsePositionAlert).filter(Boolean);

    POSITIONS.forEach(function(position) {
      var matches = entries.filter(function(entry) { return entry.position === position; });
      if (!matches.length) return;
      reconcilePosition(position, matches, getPositionPressure(position));
    });

    ensureEmptyState(list);
  }

  function scheduleReconcile() {
    if (refreshFrame) return;
    refreshFrame = requestAnimationFrame(reconcileNow);
  }

  function observeSources() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(scheduleReconcile);

    var grid = document.getElementById('position-tier-grid');
    if (grid) {
      observer.observe(grid, {
        subtree:true,
        attributes:true,
        attributeFilter:['data-status', 'data-available']
      });
    }

    var strip = document.getElementById('draft-awareness-strip');
    if (strip) {
      observer.observe(strip, {
        subtree:true,
        childList:true,
        characterData:true
      });
    }
  }

  function init() {
    observeSources();
    scheduleReconcile();
  }

  window.WarRoomAwarenessLiveSync = {
    getPositionPressure: getPositionPressure,
    reconcileNow: reconcileNow
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();
