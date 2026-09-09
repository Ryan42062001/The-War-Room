/* =========================================================
   WR-026 PHONE-ONLY DECISION VIEW
   Presentation-only phone coordination for Position Tiers.
   Uses existing player cards, recommendation output, pressure state,
   draft markings, search, and filters without changing their semantics.
   ========================================================= */

(function() {
  'use strict';

  var PHONE_QUERY = '(max-width: 600px)';
  var PRIMARY_POSITIONS = ['WR', 'RB', 'QB', 'TE'];
  var COMPACT_AVAILABLE_LIMIT = 8;
  var NAV_ID = 'phone-position-decision-nav';
  var MORE_ID = 'phone-position-show-more';
  var activePosition = 'WR';
  var expanded = false;
  var syncQueued = false;
  var observer = null;
  var media = null;

  function isPhone() {
    try {
      if (!media) media = window.matchMedia(PHONE_QUERY);
      return media.matches;
    } catch (error) {
      return window.innerWidth <= 600;
    }
  }

  function isPositionView() {
    return document.body && document.body.getAttribute('data-board-view') === 'position';
  }

  function getBoard() {
    return document.getElementById('position-board');
  }

  function getGrid() {
    return document.getElementById('position-tier-grid');
  }

  function getEndgame() {
    return document.getElementById('position-endgame-section');
  }

  function getSearchValue() {
    var input = document.getElementById('searchBox');
    return String(input && input.value || '').trim();
  }

  function isSearchActive() {
    return getSearchValue().length > 0;
  }

  function ensureControls() {
    var board = getBoard();
    var grid = getGrid();
    if (!board || !grid) return null;

    var nav = document.getElementById(NAV_ID);
    if (!nav) {
      nav = document.createElement('section');
      nav.id = NAV_ID;
      nav.className = 'phone-decision-nav';
      nav.setAttribute('aria-label', 'Phone position decision view');
      nav.innerHTML =
        '<div class="phone-decision-heading">' +
          '<div><span class="phone-decision-eyebrow">DECISION VIEW</span>' +
          '<strong id="phone-position-context">Top available WR</strong></div>' +
          '<span id="phone-position-count" class="phone-position-count"></span>' +
        '</div>' +
        '<div class="phone-position-tabs" role="group" aria-label="Choose position">' +
          PRIMARY_POSITIONS.map(function(position) {
            return '<button type="button" class="phone-position-tab" data-phone-position="' + position + '" aria-pressed="false">' + position + '</button>';
          }).join('') +
          '<button type="button" class="phone-position-tab phone-position-tab-endgame" data-phone-position="ENDGAME" aria-pressed="false">K/DST</button>' +
        '</div>' +
        '<p class="phone-decision-help">Top available players first. Expand the active position when you need the full board.</p>';
      grid.parentNode.insertBefore(nav, grid);

      nav.addEventListener('click', function(event) {
        var button = event.target && event.target.closest ? event.target.closest('[data-phone-position]') : null;
        if (!button || !nav.contains(button)) return;
        var next = button.getAttribute('data-phone-position');
        if (next === 'ENDGAME') setActiveContext('ENDGAME', true);
        else if (PRIMARY_POSITIONS.indexOf(next) >= 0) setActiveContext(next, true);
      });
    }

    var more = document.getElementById(MORE_ID);
    if (!more) {
      more = document.createElement('button');
      more.id = MORE_ID;
      more.type = 'button';
      more.className = 'phone-position-show-more';
      more.setAttribute('aria-expanded', 'false');
      grid.parentNode.insertBefore(more, getEndgame() || grid.nextSibling);
      more.addEventListener('click', function() {
        expanded = !expanded;
        scheduleSync();
      });
    }

    return nav;
  }

  function restoreTierOpenState(block) {
    if (!block || !block.hasAttribute('data-phone-original-open')) return;
    block.open = block.getAttribute('data-phone-original-open') === 'true';
    block.removeAttribute('data-phone-original-open');
  }

  function restoreAllTierOpenStates() {
    document.querySelectorAll('.position-tier-block[data-phone-original-open]').forEach(restoreTierOpenState);
  }

  function clearCompactClasses() {
    document.querySelectorAll('.position-player-card.phone-compact-hidden').forEach(function(card) {
      card.classList.remove('phone-compact-hidden');
    });
    document.querySelectorAll('.position-tier-block.phone-tier-hidden').forEach(function(block) {
      block.classList.remove('phone-tier-hidden');
    });
  }

  function cleanupDesktop() {
    if (!document.body) return;
    document.body.classList.remove('phone-decision-view-ready', 'phone-decision-search-active', 'phone-decision-endgame-active');

    document.querySelectorAll('#position-tier-grid > .position-column').forEach(function(column) {
      column.classList.remove('phone-position-active');
      column.removeAttribute('aria-hidden');
    });

    var endgame = getEndgame();
    if (endgame) {
      endgame.classList.remove('phone-endgame-active');
      endgame.removeAttribute('aria-hidden');
    }

    clearCompactClasses();
    restoreAllTierOpenStates();
  }

  function getAvailableCards(column) {
    if (!column) return [];
    return Array.prototype.slice.call(column.querySelectorAll('.position-player-card')).filter(function(card) {
      return card.getAttribute('data-status') === 'available' ||
        (!card.classList.contains('is-drafted') && !card.classList.contains('drafted-mine') && !card.classList.contains('drafted-other'));
    });
  }

  function applyCompactCards(column, searchActive) {
    if (!column) return {available:0, shown:0, total:0};

    var allCards = Array.prototype.slice.call(column.querySelectorAll('.position-player-card'));
    var available = getAvailableCards(column);
    var compact = !expanded && !searchActive;
    var selected = new Set();

    if (!compact) {
      allCards.forEach(function(card) { selected.add(card); });
    } else {
      available.slice(0, COMPACT_AVAILABLE_LIMIT).forEach(function(card) { selected.add(card); });
      allCards.filter(function(card) { return card.classList.contains('is-targeted'); }).forEach(function(card) { selected.add(card); });
    }

    allCards.forEach(function(card) {
      card.classList.toggle('phone-compact-hidden', compact && !selected.has(card));
    });

    Array.prototype.slice.call(column.querySelectorAll('.position-tier-block')).forEach(function(block) {
      var hasVisibleCard = Array.prototype.slice.call(block.querySelectorAll('.position-player-card')).some(function(card) {
        return !card.classList.contains('phone-compact-hidden');
      });
      block.classList.toggle('phone-tier-hidden', compact && !hasVisibleCard);

      if (compact && hasVisibleCard) {
        if (!block.hasAttribute('data-phone-original-open')) {
          block.setAttribute('data-phone-original-open', block.open ? 'true' : 'false');
        }
        block.open = true;
      } else {
        restoreTierOpenState(block);
      }
    });

    return {
      available: available.length,
      shown: compact ? selected.size : allCards.length,
      total: allCards.length
    };
  }

  function setActiveContext(next, shouldReveal) {
    if (next === 'ENDGAME') activePosition = 'ENDGAME';
    else if (PRIMARY_POSITIONS.indexOf(next) >= 0) activePosition = next;
    else return;

    expanded = false;
    synchronize();

    if (!shouldReveal || !isPhone() || !isPositionView()) return;
    var nav = document.getElementById(NAV_ID);
    if (!nav || typeof nav.scrollIntoView !== 'function') return;
    var rect = nav.getBoundingClientRect();
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) return;
    nav.scrollIntoView({behavior:'auto', block:'start'});
  }

  function updateControlState(searchActive, stats) {
    var nav = document.getElementById(NAV_ID);
    var more = document.getElementById(MORE_ID);
    if (!nav || !more) return;

    nav.querySelectorAll('[data-phone-position]').forEach(function(button) {
      var selected = button.getAttribute('data-phone-position') === activePosition;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    var context = nav.querySelector('#phone-position-context');
    var count = nav.querySelector('#phone-position-count');
    var endgame = activePosition === 'ENDGAME';

    if (searchActive) {
      if (context) context.textContent = 'Search across all positions';
      if (count) count.textContent = 'Full results';
    } else if (endgame) {
      if (context) context.textContent = 'Kicker / Defense endgame';
      if (count) count.textContent = 'Full endgame';
    } else {
      if (context) context.textContent = (expanded ? 'Full ' : 'Top available ') + activePosition;
      if (count) count.textContent = stats.available + ' available';
    }

    var hideMore = searchActive || endgame || !stats.total;
    more.hidden = hideMore;
    if (!hideMore) {
      more.textContent = expanded
        ? 'Show top ' + activePosition + ' choices'
        : 'Show all ' + activePosition + ' players (' + stats.total + ')';
      more.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
  }

  function synchronize() {
    syncQueued = false;
    ensureControls();

    if (!isPhone()) {
      cleanupDesktop();
      return;
    }

    if (!document.body) return;
    document.body.classList.add('phone-decision-view-ready');

    var searchActive = isSearchActive();
    var positionView = isPositionView();
    document.body.classList.toggle('phone-decision-search-active', positionView && searchActive);
    document.body.classList.toggle('phone-decision-endgame-active', positionView && !searchActive && activePosition === 'ENDGAME');

    var activeColumn = null;
    document.querySelectorAll('#position-tier-grid > .position-column').forEach(function(column) {
      var position = column.getAttribute('data-position');
      var active = positionView && !searchActive && activePosition !== 'ENDGAME' && position === activePosition;
      column.classList.toggle('phone-position-active', active);
      if (positionView && !searchActive && !active) column.setAttribute('aria-hidden', 'true');
      else column.removeAttribute('aria-hidden');
      if (active) activeColumn = column;
    });

    var endgame = getEndgame();
    var endgameActive = positionView && !searchActive && activePosition === 'ENDGAME';
    if (endgame) {
      endgame.classList.toggle('phone-endgame-active', endgameActive);
      if (positionView && !searchActive && !endgameActive) endgame.setAttribute('aria-hidden', 'true');
      else endgame.removeAttribute('aria-hidden');
    }

    clearCompactClasses();
    restoreAllTierOpenStates();

    var stats = {available:0, shown:0, total:0};
    if (positionView && !searchActive && activeColumn) stats = applyCompactCards(activeColumn, false);
    updateControlState(searchActive, stats);
  }

  function scheduleSync() {
    if (syncQueued) return;
    syncQueued = true;
    window.requestAnimationFrame(synchronize);
  }

  function installInteractionListeners() {
    var search = document.getElementById('searchBox');
    if (search && search.dataset.phoneDecisionBound !== 'true') {
      search.dataset.phoneDecisionBound = 'true';
      search.addEventListener('input', function() {
        window.requestAnimationFrame(scheduleSync);
      });
    }

    document.addEventListener('click', function(event) {
      if (!isPhone() || !isPositionView()) return;
      var target = event.target && event.target.closest ? event.target.closest('[data-pos], [data-command-position]') : null;
      if (!target) return;
      var position = target.getAttribute('data-command-position') || target.getAttribute('data-pos');
      if (PRIMARY_POSITIONS.indexOf(position) >= 0) {
        window.setTimeout(function() { setActiveContext(position, true); }, 0);
      } else if (position === 'K' || position === 'DST') {
        window.setTimeout(function() { setActiveContext('ENDGAME', true); }, 0);
      }
    }, false);
  }

  function observeBoard() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(scheduleSync);

    var grid = getGrid();
    var endgame = getEndgame();
    if (grid) observer.observe(grid, {childList:true, subtree:true, attributes:true, attributeFilter:['data-status']});
    if (endgame) observer.observe(endgame, {childList:true, subtree:true, attributes:true, attributeFilter:['data-status']});
    if (document.body) observer.observe(document.body, {attributes:true, attributeFilter:['data-board-view']});
  }

  function init() {
    ensureControls();
    installInteractionListeners();
    observeBoard();

    try {
      media = window.matchMedia(PHONE_QUERY);
      if (typeof media.addEventListener === 'function') media.addEventListener('change', scheduleSync);
      else if (typeof media.addListener === 'function') media.addListener(scheduleSync);
    } catch (error) {}

    window.addEventListener('resize', scheduleSync, {passive:true});
    synchronize();
  }

  window.WarRoomPhoneDecisionView = {
    version: 1,
    refresh: scheduleSync,
    setActivePosition: function(position) { setActiveContext(position, false); },
    getActivePosition: function() { return activePosition; },
    isExpanded: function() { return expanded; },
    isPhone: isPhone
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
