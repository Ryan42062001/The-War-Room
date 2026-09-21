/**
 * FANTASY DRAFT CHEAT SHEET 2026
 * Real-time draft companion with live recommendations, autosave, and position tracking
 */

// ==== CONFIGURATION ====
var AUTOSAVE_KEY = 'draft-state-v1';
var AUTOSAVE_ENABLED_KEY = 'draft-autosave-enabled-v1';
var FINAL_SUMMARY_SHOWN_KEY = 'draft-final-summary-shown-v1';
var DRAFT_SESSION_REGISTRY_KEY = 'war-room-draft-sessions-v1';
var ACTIVE_DRAFT_SESSION_KEY = 'war-room-active-draft-session-v1';
var activeDraftSessionId = 'legacy';
var DEBUG_DRAFT_SCORING = false;
var TEAM_COLORS = {
  ARI:'#97233F', ATL:'#A71930', BAL:'#241773', BUF:'#00338D', CAR:'#0085CA',
  CHI:'#0B162A', CIN:'#FB4F14', CLE:'#FF3C00', DAL:'#003594', DEN:'#FB4F14',
  DET:'#0076B6', GB:'#203731', HOU:'#03202F', IND:'#002C5F', JAX:'#101820',
  KC:'#E31837', LAC:'#0080C6', LAR:'#003594', LV:'#A5ACAF', MIA:'#008E97',
  MIN:'#4F2683', NE:'#002244', NO:'#D3BC8D', NYG:'#0B2265', NYJ:'#125740',
  PHI:'#004C54', PIT:'#FFB612', SEA:'#69BE28', SF:'#AA0000', TB:'#D50A0A',
  TEN:'#4B92DB', WAS:'#5A1414'
};

// ==== INTERNAL STATE ====
var currentPosFilter = 'ALL';
var resetArmed = false;
var resetArmTimer = null;
var deleteDraftArmed = false;
var deleteDraftArmTimer = null;
var _saveTimer = null;
var _finalSummaryTimer = null;
var draftMarkMode = 'taken';
var lastFocusedElementBeforeModal = null;
var customBoardEnabled = false;
var recommendationAudit = [];
var searchMatches = [];
var currentSearchIndex = -1;
var developerToolsPromise = null;
var _draftRowsCache = null;
var _draftRowsByCanonicalNameCache = null;
window.ORIGINAL_ORDER = [];

function invalidateDraftRowCaches() {
  _draftRowsCache = null;
  _draftRowsByCanonicalNameCache = null;
}

function getCachedDraftRows() {
  if (!_draftRowsCache) {
    _draftRowsCache = Array.prototype.slice.call(
      document.querySelectorAll('tr.draftrow')
    );
  }
  return _draftRowsCache;
}

function isDraftEngineDebugEnabled() {
  return DEBUG_DRAFT_SCORING || Boolean(
    typeof DRAFT_DEBUG !== 'undefined' && DRAFT_DEBUG
  );
}

function draftScoringLog() {
  if (!isDraftEngineDebugEnabled()) return;
  console.log.apply(console, arguments);
}

function loadDeveloperTools() {
  if (typeof window.runDraftEngineTests === 'function') {
    return Promise.resolve();
  }

  if (!developerToolsPromise) {
    developerToolsPromise = new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = 'developer-tools.js?v=20260822-8';
      script.onload = resolve;
      script.onerror = function() {
        developerToolsPromise = null;
        reject(new Error('Developer tools failed to load.'));
      };
      document.head.appendChild(script);
    });
  }

  return developerToolsPromise;
}

function runDeveloperTool(functionName, args) {
  return loadDeveloperTools()
    .then(function() {
      var tool = window[functionName];
      if (typeof tool !== 'function') {
        throw new Error('Developer tool is unavailable: ' + functionName);
      }
      return tool.apply(window, Array.isArray(args) ? args : []);
    })
    .catch(function(error) {
      var output = document.getElementById('developer-test-results');
      if (output) output.textContent = error.message;
      console.error(error);
      return null;
    });
}

// ==== SAFE UTILITY CALLERS ====
function safeCall(fnName) {
  if (typeof window[fnName] === 'function') {
    try { window[fnName](); } catch(e) { console.warn('SafeCall failed for ' + fnName, e); }
  }
}

// ==== CORE DASHBOARD & RECOMMENDER UPDATES ====
function updateMyTeam() {
  var starterLimits = getConfiguredStarterLimits();
  var myTeamContainer = document.getElementById('roster-list');
  var needsContainer = document.getElementById('needs-row');
  var starterCountElement = document.getElementById('myteam-starter-count');

  if (!myTeamContainer) return;

  var counts = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0
  };
  var byeCounts = {};

  var players = [];

  document.querySelectorAll('tr.draftrow.drafted-mine').forEach(function(row) {
    var name = row.getAttribute('data-name') || 'Unknown Player';
    var pos = row.getAttribute('data-pos') || 'N/A';

    if (counts[pos] !== undefined) {
      counts[pos]++;
    }
    var bye = String(row.getAttribute('data-bye') || '').trim();
    if (bye && bye !== '--' && bye !== '-' && bye !== '0') {
      byeCounts[bye] = (byeCounts[bye] || 0) + 1;
    }

    players.push({
      name: name,
      pos: pos,
      row: row
    });
  });

  /* ---- Assign players to starting slots ---- */

  var starters = {
    QB: [],
    RB: [],
    WR: [],
    TE: [],
    FLEX: [],
    K: [],
    DST: []
  };

  /*
   * Fill the dedicated starting positions first.
   */
  players.forEach(function(player) {

    if (player.pos === 'QB' && starters.QB.length < starterLimits.QB) {
      starters.QB.push(player);
    }

    else if (player.pos === 'RB' && starters.RB.length < starterLimits.RB) {
      starters.RB.push(player);
    }

    else if (player.pos === 'WR' && starters.WR.length < starterLimits.WR) {
      starters.WR.push(player);
    }

    else if (player.pos === 'TE' && starters.TE.length < starterLimits.TE) {
      starters.TE.push(player);
    }

    else if (player.pos === 'K' && starters.K.length < starterLimits.K) {
      starters.K.push(player);
    }

    else if (player.pos === 'DST' && starters.DST.length < starterLimits.DST) {
      starters.DST.push(player);
    }
  });

  /*
   * Any extra RB/WR/TE goes into FLEX.
   */
  players.forEach(function(player) {

    var isDedicatedStarter =
      starters.QB.includes(player) ||
      starters.RB.includes(player) ||
      starters.WR.includes(player) ||
      starters.TE.includes(player) ||
      starters.K.includes(player) ||
      starters.DST.includes(player);

    if (
      !isDedicatedStarter &&
      starters.FLEX.length < starterLimits.FLEX &&
      ['RB', 'WR', 'TE'].includes(player.pos)
    ) {
      starters.FLEX.push(player);
    }
  });

  /* ---- Calculate total starters ---- */

  var totalStarters =
    starters.QB.length +
    starters.RB.length +
    starters.WR.length +
    starters.TE.length +
    starters.FLEX.length +
    starters.K.length +
    starters.DST.length;

  /* ---- Update starter counter ---- */

  if (starterCountElement) {
    starterCountElement.textContent =
      totalStarters + ' / ' + getConfiguredStarterTotal() + ' starters';
  }

  /* ---- Update My Team button ---- */

  var myTeamButton = document.querySelector('.myteam-toggle');

  if (myTeamButton) {
    var panel = document.getElementById('myteam-panel');
    var isOpen = panel && panel.classList.contains('open');

    myTeamButton.innerText =
      (isOpen ? 'Hide My Draft' : 'My Draft') +
      ' · ' +
      players.length;
  }

  var lineupPanel = document.getElementById('lineup-panel');
  var shouldRenderLineup = Boolean(
    document.getElementById('myteam-panel')?.classList.contains('open') &&
    lineupPanel?.classList.contains('active')
  );

  if (!shouldRenderLineup) return;

  /* ---- Roster needs ---- */

  if (needsContainer) {
    var needs = [];

    if (counts.QB < 1) {
      needs.push(
        '<span class="roster-need roster-need-open">QB ' +
        counts.QB + '/1</span>'
      );
    } else {
      needs.push(
        '<span class="roster-need roster-need-filled">QB ✓</span>'
      );
    }

    if (counts.RB < 2) {
      needs.push(
        '<span class="roster-need roster-need-open">RB ' +
        counts.RB + '/2</span>'
      );
    } else {
      needs.push(
        '<span class="roster-need roster-need-filled">RB ✓</span>'
      );
    }

    if (counts.WR < 2) {
      needs.push(
        '<span class="roster-need roster-need-open">WR ' +
        counts.WR + '/2</span>'
      );
    } else {
      needs.push(
        '<span class="roster-need roster-need-filled">WR ✓</span>'
      );
    }

    if (counts.TE < 1) {
      needs.push(
        '<span class="roster-need roster-need-open">TE ' +
        counts.TE + '/1</span>'
      );
    } else {
      needs.push(
        '<span class="roster-need roster-need-filled">TE ✓</span>'
      );
    }

    if (starters.FLEX.length < 1) {
      needs.push(
        '<span class="roster-need roster-need-open">FLEX 0/1</span>'
      );
    } else {
      needs.push(
        '<span class="roster-need roster-need-filled">FLEX ✓</span>'
      );
    }

    if (counts.K < 1) {
      needs.push(
        '<span class="roster-need roster-need-open">K ' +
        counts.K + '/1</span>'
      );
    } else {
      needs.push(
        '<span class="roster-need roster-need-filled">K ✓</span>'
      );
    }

    if (counts.DST < 1) {
      needs.push(
        '<span class="roster-need roster-need-open">DST ' +
        counts.DST + '/1</span>'
      );
    } else {
      needs.push(
        '<span class="roster-need roster-need-filled">DST ✓</span>'
      );
    }

    needsContainer.innerHTML = needs.join('');
  }

  /* ---- Build starting lineup display ---- */

  function slotHTML(label, player, positionClass) {

    if (player) {
      return (
        '<div class="starter-slot filled">' +
          '<span class="starter-position ' + positionClass + '">' +
            label +
          '</span>' +
          '<span class="starter-player">' +
            player.name +
          '</span>' +
          '<span class="starter-check">✓</span>' +
        '</div>'
      );
    }

    return (
      '<div class="starter-slot empty">' +
        '<span class="starter-position ' + positionClass + '">' +
          label +
        '</span>' +
        '<span class="starter-player empty-player">' +
          '—' +
        '</span>' +
        '<span class="starter-missing">OPEN</span>' +
      '</div>'
    );
  }

  var lineupHTML =
    '<div class="starting-lineup">' +
      '<div class="starting-lineup-title">STARTERS</div>' +

      slotHTML('QB', starters.QB[0], 'pos-QB') +

      slotHTML('RB', starters.RB[0], 'pos-RB') +
      slotHTML('RB', starters.RB[1], 'pos-RB') +

      slotHTML('WR', starters.WR[0], 'pos-WR') +
      slotHTML('WR', starters.WR[1], 'pos-WR') +

      slotHTML('TE', starters.TE[0], 'pos-TE') +

      slotHTML('FLEX', starters.FLEX[0], 'pos-FLEX') +

      slotHTML('K', starters.K[0], 'pos-K') +

      slotHTML('DST', starters.DST[0], 'pos-DST') +

    '</div>';

  /*
   * Add the starting lineup above the existing roster list.
   */
  var existingRosterHTML = '';

  players.forEach(function(player) {
    existingRosterHTML +=
      '<div class="team-player-card">' +
        '<span class="pos-pill pos-' + player.pos + '">' +
          player.pos +
        '</span>' +
        '<span class="team-player-name">' +
          player.name +
        '</span>' +
      '</div>';
  });

  myTeamContainer.innerHTML =
    lineupHTML +
    '<div class="roster-divider">ALL DRAFTED PLAYERS</div>' +
    (existingRosterHTML ||
      '<div class="empty-roster">No players drafted yet.</div>');
}

function toggleMyTeam() {
  var panel = document.getElementById('myteam-panel');
  var button = document.querySelector('.myteam-toggle');

  if (!panel) return;

  var isOpen = panel.classList.toggle('open');
  panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

  if (isOpen) {
    updateMyTeam();
    updateDraftSummary();
    var closeButton = panel.querySelector('.close-btn');
    if (closeButton) closeButton.focus();
  }

  if (button) {
    var draftedCount = document.querySelectorAll('tr.draftrow.drafted-mine').length;
    button.classList.toggle('active', isOpen);
    button.innerText = (isOpen ? 'Hide My Draft' : 'My Draft') + ' · ' + draftedCount;
  }
}

function setDraftHubView(view) {
  var selectedView = view === 'lineup' ? 'lineup' : 'summary';

  document.querySelectorAll('.draft-hub-view').forEach(function(panel) {
    var isActive = panel.id === selectedView + '-panel';
    panel.classList.toggle('active', isActive);
    panel.hidden = !isActive;
  });

  document.querySelectorAll('.draft-hub-tab').forEach(function(tab) {
    var isSelected = tab.id === 'draft-' + selectedView + '-tab';
    tab.classList.toggle('active', isSelected);
    tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    tab.setAttribute('tabindex', isSelected ? '0' : '-1');
  });

  if (selectedView === 'summary') updateDraftSummary();
  if (selectedView === 'lineup') updateMyTeam();
}

function escapeSummaryHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getDraftRowDisplayName(row) {
  var cachedName = row && row.getAttribute('data-display-name');
  if (cachedName) return cachedName;
  var playerCell = row && row.querySelector('.pname');
  if (!playerCell) return row ? row.getAttribute('data-name') || 'Unknown player' : 'Unknown player';

  var clone = playerCell.cloneNode(true);
  clone.querySelectorAll('.posrk, .mobile-handcuff, .rank-controls').forEach(function(element) {
    element.remove();
  });

  var displayName = (clone.textContent || '').replace(/\s+/g, ' ').trim() || 'Unknown player';
  if (row && displayName !== 'Unknown player') row.setAttribute('data-display-name', displayName);
  return displayName;
}

function getDraftSummaryGrade(averageEcrValue) {
  if (averageEcrValue == null || !Number.isFinite(averageEcrValue)) return '—';
  if (averageEcrValue >= 10) return 'A+';
  if (averageEcrValue >= 5) return 'A';
  if (averageEcrValue >= 0) return 'B';
  if (averageEcrValue >= -5) return 'C';
  if (averageEcrValue >= -10) return 'D';
  return 'F';
}

function formatDraftSummaryDelta(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  return (value > 0 ? '+' : '') + value.toFixed(1);
}

function getCompletedDraftPickCount() {
  return document.querySelectorAll(
    'tr.draftrow.drafted-mine[data-pick], tr.draftrow.drafted-other[data-pick]'
  ).length;
}

function getDraftCompletionStatus(state) {
  state = state || getDraftAssistantState();
  var numberedPicks = getCompletedDraftPickCount();
  var myRosterCount = document.querySelectorAll('tr.draftrow.drafted-mine').length;
  var authoritative = state.totalPicks > 0 && numberedPicks >= state.totalPicks;
  var externalComplete = Boolean(window.latestEspnSyncMeta && window.latestEspnSyncMeta.draftComplete);
  var provisional = !authoritative && externalComplete && myRosterCount >= state.rounds;
  return {
    complete: authoritative || provisional,
    authoritative: authoritative,
    provisional: provisional,
    externalComplete: externalComplete,
    numberedPicks: numberedPicks,
    myRosterCount: myRosterCount
  };
}

function isDraftComplete(state) {
  return getDraftCompletionStatus(state).complete;
}

function getRosterByeCounts(rows) {
  var counts = {};
  (rows || []).forEach(function(row) {
    var bye = String(row && row.getAttribute ? row.getAttribute('data-bye') || '' : row && row.bye || '').trim();
    if (bye && bye !== '--' && bye !== '-' && bye !== '0') counts[bye] = (counts[bye] || 0) + 1;
  });
  return counts;
}

function buildTimedRosterGuidance(state, positionCounts, flexFilled, myRows) {
  var round = Math.min(state.rounds, Math.max(1, Math.ceil(state.currentPick / state.teams)));
  var phase = getDraftPhase(state.currentPick, state.teams).phase;
  var remainingSelections = state.myPicks.filter(function(pick) {
    return pick >= state.currentPick;
  }).length;
  var openCore = [];
  if (positionCounts.QB < 1) openCore.push('QB');
  if (positionCounts.RB < 2) openCore.push('RB' + (positionCounts.RB === 0 ? ' ×2' : ''));
  if (positionCounts.WR < 2) openCore.push('WR' + (positionCounts.WR === 0 ? ' ×2' : ''));
  if (positionCounts.TE < 1) openCore.push('TE');
  if (!flexFilled) openCore.push('FLEX');

  var primary = '';
  var secondary = '';
  var tone = 'steady';

  if (isDraftComplete(state)) {
    primary = 'Your draft is complete. Review the final report and save the best undrafted ECR values to your waiver watch.';
    secondary = 'The live recommendation and pressure tools are now retired for this draft.';
  } else if (round <= 3) {
    primary = positionCounts.RB + positionCounts.WR < 2
      ? 'Build the RB/WR foundation with your next selection unless an elite value falls.'
      : 'Your foundation is taking shape; keep following the strongest ECR value.';
    secondary = 'QB and TE can wait when their current tiers remain healthy. Save K and DST for the final two rounds.';
  } else if (round <= 7) {
    if (positionCounts.WR >= 3 && positionCounts.RB < 2) {
      primary = 'Excellent WR advantage; RB workload stability is now the priority when values are close.';
      tone = 'watch';
    } else if (openCore.length) {
      primary = 'Starter-build window: address ' + openCore.slice(0, 3).join(', ') + ' within your next two selections.';
      tone = 'watch';
    } else {
      primary = 'Your offensive starters are covered; add RB/WR value and upside.';
    }
    secondary = 'Continue saving K and DST for the final two rounds.';
  } else if (round <= 11) {
    if (openCore.length) {
      primary = 'Do not let the starter window close: prioritize ' + openCore.join(', ') + ' now.';
      tone = 'urgent';
    } else {
      primary = 'Starter structure is secure. Build RB/WR depth and high-upside bench value.';
    }
    secondary = 'Reserve the endgame for K/DST unless a required starter is still open.';
  } else {
    var endgameNeeds = [];
    if (positionCounts.K < 1) endgameNeeds.push('K');
    if (positionCounts.DST < 1) endgameNeeds.push('DST');
    if (openCore.length) {
      primary = 'Immediate roster warning: fill ' + openCore.join(', ') + ' before the draft ends.';
      tone = 'urgent';
    } else if (endgameNeeds.length && remainingSelections <= endgameNeeds.length) {
      primary = 'Use your remaining ' + remainingSelections + ' selection' + (remainingSelections === 1 ? '' : 's') + ' on ' + endgameNeeds.join(' and ') + '.';
      tone = 'urgent';
    } else if (endgameNeeds.length) {
      primary = 'Endgame plan: reserve your final ' + endgameNeeds.length + ' pick' + (endgameNeeds.length === 1 ? '' : 's') + ' for ' + endgameNeeds.join(' and ') + '.';
      tone = 'watch';
    } else {
      primary = 'Required starters are covered. Finish with upside and injury-away RB/WR depth.';
    }
    secondary = 'Avoid low-upside bench duplicates when a clearer path to opportunity is available.';
  }

  var byeCounts = getRosterByeCounts(myRows);
  var crowdedByes = Object.keys(byeCounts).filter(function(bye) {
    return byeCounts[bye] >= 3;
  }).sort(function(a, b) {
    return byeCounts[b] - byeCounts[a];
  });
  if (crowdedByes.length) {
    secondary = 'Bye-week watch: ' + crowdedByes.slice(0, 2).map(function(bye) {
      return byeCounts[bye] + ' players in Week ' + bye;
    }).join(' · ') + '. ' + secondary;
    var maxByeCount = byeCounts[crowdedByes[0]];
    tone = maxByeCount >= 5 ? 'urgent' : tone === 'urgent' ? tone : 'watch';
  }

  return (
    '<div class="roster-guidance roster-guidance-' + tone + '">' +
      '<div class="roster-guidance-heading"><span>ROSTER PLAN</span><b>Round ' + round + ' · ' + escapeSummaryHtml(phase) + '</b></div>' +
      '<strong>' + escapeSummaryHtml(primary) + '</strong>' +
      '<small>' + escapeSummaryHtml(secondary) + '</small>' +
    '</div>'
  );
}

function updateDataFreshnessIndicator() {
  var element = document.getElementById('data-freshness');
  if (!element) return;
  var meta = typeof FANTASYPROS_2026_DATASET_META !== 'undefined'
    ? FANTASYPROS_2026_DATASET_META
    : null;
  var snapshotDate = meta && meta.sourceSnapshotDate ? new Date(meta.sourceSnapshotDate + 'T00:00:00') : null;

  if (!snapshotDate || Number.isNaN(snapshotDate.getTime())) {
    element.className = 'data-freshness data-freshness-unknown';
    element.textContent = 'FantasyPros snapshot date unavailable';
    return;
  }

  var ageDays = Math.max(0, Math.floor((Date.now() - snapshotDate.getTime()) / 86400000));
  var status = ageDays <= 7 ? 'Fresh' : ageDays <= 21 ? 'Review soon' : 'Update recommended';
  var tone = ageDays <= 7 ? 'fresh' : ageDays <= 21 ? 'review' : 'stale';
  element.className = 'data-freshness data-freshness-' + tone;
  element.textContent = (meta && meta.localOverride ? 'FantasyPros local update · ' : 'FantasyPros PPR · ') + snapshotDate.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  }) + ' · ' + status;
}

function updateDraftSummary() {
  var content = document.getElementById('summary-content');
  var countBadge = document.getElementById('summary-pick-count');
  if (!content) return;

  var state = getDraftAssistantState();
  var allDraftedCount = getCompletedDraftPickCount();
  var summaryPanel = document.getElementById('summary-panel');
  var shouldRenderSummary = Boolean(
    document.getElementById('myteam-panel')?.classList.contains('open') &&
    summaryPanel?.classList.contains('active')
  );

  if (!shouldRenderSummary && allDraftedCount < state.totalPicks) return;

  var myRows = Array.prototype.slice.call(
    document.querySelectorAll('tr.draftrow.drafted-mine')
  );
  var positionCounts = {QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0};

  var picks = myRows.map(function(row, index) {
    var position = row.getAttribute('data-pos') || '';
    if (positionCounts[position] !== undefined) positionCounts[position]++;

    var pick = Number(row.getAttribute('data-pick')) || null;
    var ecr = getDraftRowNumber(row, 'data-ecr');
    var adp = getDraftRowNumber(row, 'data-adp');

    return {
      name: getDraftRowDisplayName(row),
      position: position,
      bye: String(row.getAttribute('data-bye') || '').trim(),
      pick: pick,
      ecr: ecr,
      adp: adp,
      ecrValue: pick != null && ecr != null ? pick - ecr : null,
      marketValue: pick != null && adp != null ? pick - adp : null,
      originalIndex: index
    };
  });

  picks.sort(function(a, b) {
    if (a.pick == null && b.pick == null) return a.originalIndex - b.originalIndex;
    if (a.pick == null) return 1;
    if (b.pick == null) return -1;
    return a.pick - b.pick;
  });

  var starterLimits = getConfiguredStarterLimits();
  var flexFilled = Math.min(starterLimits.FLEX,
    Math.max(0, positionCounts.RB - starterLimits.RB) +
    Math.max(0, positionCounts.WR - starterLimits.WR) +
    Math.max(0, positionCounts.TE - starterLimits.TE)
  );
  var startersFilled =
    Math.min(positionCounts.QB, starterLimits.QB) +
    Math.min(positionCounts.RB, starterLimits.RB) +
    Math.min(positionCounts.WR, starterLimits.WR) +
    Math.min(positionCounts.TE, starterLimits.TE) +
    flexFilled +
    Math.min(positionCounts.K, starterLimits.K) +
    Math.min(positionCounts.DST, starterLimits.DST);

  var knownEcrValues = picks.filter(function(player) {
    return player.ecrValue != null;
  });
  var averageEcrValue = knownEcrValues.length
    ? knownEcrValues.reduce(function(total, player) { return total + player.ecrValue; }, 0) / knownEcrValues.length
    : null;
  var grade = getDraftSummaryGrade(averageEcrValue);
  var progress = state.totalPicks
    ? Math.min(100, Math.round((allDraftedCount / state.totalPicks) * 100))
    : 0;
  var currentRound = Math.min(
    state.rounds,
    Math.max(1, Math.ceil(state.currentPick / state.teams))
  );

  if (countBadge) countBadge.textContent = picks.length + (picks.length === 1 ? ' pick' : ' picks');

  var completion = getDraftCompletionStatus(state);
  var progressCopy = completion.externalComplete && !completion.authoritative
    ? 'Draft appears complete · ' + completion.numberedPicks + ' of ' + state.totalPicks + ' numbered picks synced'
    : allDraftedCount + ' of ' + state.totalPicks + ' overall picks complete';

  var html =
    '<div class="summary-progress-row">' +
      '<div><strong>Round ' + currentRound + ' of ' + state.rounds + '</strong>' +
        '<span>' + progressCopy + '</span></div>' +
      '<span>' + progress + '%</span>' +
    '</div>' +
    '<div class="summary-progress-track"><span style="width:' + progress + '%"></span></div>' +
    '<div class="summary-stat-grid">' +
      '<div class="summary-stat"><span>My roster</span><strong>' + picks.length + ' / ' + state.rounds + '</strong><small>players drafted</small></div>' +
      '<div class="summary-stat"><span>Starting lineup</span><strong>' + startersFilled + ' / ' + getConfiguredStarterTotal() + '</strong><small>slots filled</small></div>' +
      '<div class="summary-stat summary-grade"><span>ECR value grade</span><strong>' + grade + '</strong><small>' +
        (averageEcrValue == null ? 'record pick numbers to grade' : formatDraftSummaryDelta(averageEcrValue) + ' picks vs ECR on average') +
      '</small></div>' +
    '</div>';

  html += buildTimedRosterGuidance(state, positionCounts, flexFilled, myRows);

  if (!picks.length) {
    html +=
      '<div class="summary-empty">' +
        '<div class="summary-empty-icon">&#127944;</div>' +
        '<strong>Your draft story starts with your first pick.</strong>' +
        '<span>Mark a drafted player as <b>Mine</b> and this report will build automatically.</span>' +
      '</div>';
    content.innerHTML = html;
    return;
  }

  var positionTargets = getConfiguredDedicatedStarterLimits();
  html += '<div class="summary-section"><h3>Roster construction</h3><div class="summary-position-grid">';
  ['QB', 'RB', 'WR', 'TE', 'K', 'DST'].forEach(function(position) {
    var count = positionCounts[position];
    var target = positionTargets[position];
    var statusClass = count >= target ? 'filled' : 'open';
    html +=
      '<div class="summary-position ' + statusClass + '">' +
        '<span class="pos-pill pos-' + position + '">' + position + '</span>' +
        '<strong>' + count + '</strong><small>starter target ' + target + '</small>' +
      '</div>';
  });
  html +=
    '<div class="summary-position ' + (flexFilled ? 'filled' : 'open') + '">' +
      '<span class="pos-pill pos-FLEX">FLEX</span>' +
      '<strong>' + flexFilled + '</strong><small>starter target 1</small>' +
    '</div>';
  html += '</div></div>';

  var bestValue = knownEcrValues.filter(function(player) { return player.ecrValue > 0; })
    .sort(function(a, b) { return b.ecrValue - a.ecrValue; })[0] || null;
  var biggestReach = knownEcrValues.filter(function(player) { return player.ecrValue < 0; })
    .sort(function(a, b) { return a.ecrValue - b.ecrValue; })[0] || null;
  var knownMarketValues = picks.filter(function(player) { return player.marketValue != null; });
  var marketWins = knownMarketValues.filter(function(player) { return player.marketValue > 0; }).length;
  var openStarterLabels = [];
  Object.keys(positionTargets).forEach(function(position) {
    var missing = Math.max(0, positionTargets[position] - positionCounts[position]);
    if (missing) openStarterLabels.push(position + (missing > 1 ? ' ×' + missing : ''));
  });
  if (!flexFilled) openStarterLabels.push('FLEX');

  html +=
    '<div class="summary-section"><h3>Draft insights</h3><div class="summary-insights">' +
      '<div><span>Best consensus value</span><strong>' +
        (bestValue ? escapeSummaryHtml(bestValue.name) + ' (' + formatDraftSummaryDelta(bestValue.ecrValue) + ')' : 'No value picks yet') +
      '</strong></div>' +
      '<div><span>Largest reach vs ECR</span><strong>' +
        (biggestReach ? escapeSummaryHtml(biggestReach.name) + ' (' + formatDraftSummaryDelta(biggestReach.ecrValue) + ')' : 'No reaches yet') +
      '</strong></div>' +
      '<div><span>Picked after market ADP</span><strong>' + marketWins + ' of ' + knownMarketValues.length + '</strong></div>' +
      '<div><span>Open starter slots</span><strong>' +
        (openStarterLabels.length ? openStarterLabels.join(', ') : 'Starting lineup complete') +
      '</strong></div>' +
    '</div></div>';

  html +=
    '<div class="summary-section"><div class="summary-section-heading"><h3>My picks</h3>' +
      '<span>Positive value means you drafted the player later than consensus.</span></div>' +
      '<div class="summary-picks-table-wrap"><table class="summary-picks-table"><thead><tr>' +
        '<th>Pick</th><th>Player</th><th>Pos</th><th>ECR</th><th>ADP</th><th>Value</th>' +
      '</tr></thead><tbody>';

  picks.forEach(function(player) {
    var valueClass = player.ecrValue == null ? 'neutral' : player.ecrValue >= 0 ? 'positive' : 'negative';
    html +=
      '<tr><td>' + (player.pick == null ? '—' : '#' + player.pick) + '</td>' +
      '<td><strong>' + escapeSummaryHtml(player.name) + '</strong></td>' +
      '<td><span class="pos-pill pos-' + escapeSummaryHtml(player.position) + '">' + escapeSummaryHtml(player.position) + '</span></td>' +
      '<td>' + (player.ecr == null ? '—' : player.ecr.toFixed(0)) + '</td>' +
      '<td>' + (player.adp == null ? '—' : player.adp.toFixed(1)) + '</td>' +
      '<td class="summary-value ' + valueClass + '">' + formatDraftSummaryDelta(player.ecrValue) + '</td></tr>';
  });
  html += '</tbody></table></div></div>';

  var finalSummaryData = {
    picks: picks,
    positionCounts: positionCounts,
    startersFilled: startersFilled,
    averageEcrValue: averageEcrValue,
    grade: grade
  };
  window.latestFinalDraftSummaryData = finalSummaryData;

  if (completion.complete) {
    html += '<button class="summary-final-report-btn" onclick="showFinalDraftSummary()">View final draft report</button>';
  }

  content.innerHTML = html;
  maybeShowFinalDraftSummary(
    state,
    picks,
    positionCounts,
    startersFilled,
    averageEcrValue,
    grade
  );
}

function toggleSummary() {
  var hub = document.getElementById('myteam-panel');
  if (!hub) return;

  if (!hub.classList.contains('open')) hub.classList.add('open');
  setDraftHubView('summary');
  updateMyTeam();
  hub.scrollIntoView({behavior: 'smooth', block: 'start'});
}

function getFinalDraftAlternative(player) {
  if (!player || player.pick == null || player.ecr == null) return null;

  return getDraftAssistantPlayers()
    .filter(function(candidate) {
      if (!candidate || !candidate.row || candidate.ecr == null) return false;
      var candidatePick = Number(candidate.row.getAttribute('data-pick')) || null;
      return candidatePick != null &&
        candidatePick > player.pick &&
        candidate.ecr < player.ecr &&
        candidate.name !== player.name;
    })
    .sort(function(a, b) { return a.ecr - b.ecr; })[0] || null;
}

function getFinalWaiverWatch(limit) {
  var pool = getDraftAssistantPlayers()
    .filter(function(player) {
      return player && player.available && player.ecr != null &&
        ['QB', 'RB', 'WR', 'TE'].indexOf(player.position) >= 0;
    })
    .sort(function(a, b) {
      return Number(a.ecr) - Number(b.ecr);
    });
  var rosterCounts = {QB:0, RB:0, WR:0, TE:0};
  var lockedQuarterback = false;
  getCachedDraftRows().filter(function(row) {
    return row.classList.contains('drafted-mine');
  }).forEach(function(row) {
    var position = String(row.getAttribute('data-pos') || '').toUpperCase();
    if (rosterCounts[position] != null) rosterCounts[position]++;
    if (position === 'QB') {
      var ecr = getDraftRowNumber(row, 'data-ecr');
      if (ecr != null && ecr <= 36) lockedQuarterback = true;
    }
  });
  var target = Math.max(1, Number(limit) || 6);
  var quotas = {
    RB: rosterCounts.RB < 4 ? 3 : 2,
    WR: rosterCounts.WR < 5 ? 3 : 2,
    TE: 1,
    QB: lockedQuarterback ? 0 : 1
  };
  var selected = [];
  ['RB', 'WR', 'TE', 'QB'].forEach(function(position) {
    pool.filter(function(player) { return player.position === position; })
      .slice(0, quotas[position])
      .forEach(function(player) {
        if (selected.length < target) selected.push(player);
      });
  });
  if (selected.length < target) {
    pool.forEach(function(player) {
      if (selected.length >= target || selected.indexOf(player) >= 0) return;
      if (player.position === 'QB' && lockedQuarterback) return;
      selected.push(player);
    });
  }
  return selected.sort(function(a, b) { return Number(a.ecr) - Number(b.ecr); }).slice(0, target);
}

function getWaiverWatchRole(player) {
  if (!player) return '';
  if (player.position === 'RB') return 'RB depth';
  if (player.position === 'WR') return 'WR upside';
  if (player.position === 'TE') return 'TE contingency';
  if (player.position === 'QB') return 'Streaming QB';
  return '';
}

function buildWaiverWatchHtml(players, compact) {
  if (!players || !players.length) {
    return '<div class="waiver-watch-empty">No undrafted ECR-ranked skill players remain.</div>';
  }

  return '<div class="waiver-watch-list ' + (compact ? 'compact' : '') + '">' + players.map(function(player) {
    var name = player.row ? getDraftRowDisplayName(player.row) : player.name;
    return (
      '<div class="waiver-watch-player">' +
        '<span class="pos-pill pos-' + escapeSummaryHtml(player.position) + '">' + escapeSummaryHtml(player.position) + '</span>' +
        '<strong>' + escapeSummaryHtml(name) + '</strong>' +
        '<small>' + escapeSummaryHtml(getWaiverWatchRole(player)) + ' · ECR ' + Number(player.ecr).toFixed(0) + (player.adp != null ? ' · ADP ' + Number(player.adp).toFixed(1) : '') + '</small>' +
      '</div>'
    );
  }).join('') + '</div>';
}

function buildFinalDraftSummaryHtml(picks, positionCounts, startersFilled, averageEcrValue, grade) {
  var knownValues = picks.filter(function(player) { return player.ecrValue != null; });
  var knownMarket = picks.filter(function(player) { return player.marketValue != null; });
  var averageMarketValue = knownMarket.length
    ? knownMarket.reduce(function(total, player) { return total + player.marketValue; }, 0) / knownMarket.length
    : null;
  var bestValue = knownValues.slice().sort(function(a, b) { return b.ecrValue - a.ecrValue; })[0] || null;
  var materialReaches = knownValues.filter(function(player) {
    return player.ecrValue <= -5 && player.position !== 'K' && player.position !== 'DST';
  })
    .sort(function(a, b) { return a.ecrValue - b.ecrValue; });
  var strengths = [];
  var improvements = [];
  var waiverWatch = getFinalWaiverWatch(6);
  var completion = getDraftCompletionStatus();
  var byeCounts = getRosterByeCounts(picks);
  var crowdedByes = Object.keys(byeCounts).filter(function(bye) {
    return byeCounts[bye] >= 3;
  }).sort(function(a, b) { return byeCounts[b] - byeCounts[a]; });
  var openingPicks = picks.slice().sort(function(a, b) {
    return Number(a.pick || 9999) - Number(b.pick || 9999);
  }).slice(0, 4);
  var openingWrCount = openingPicks.filter(function(player) { return player.position === 'WR'; }).length;
  var firstRb = picks.filter(function(player) { return player.position === 'RB' && player.pick != null; })
    .sort(function(a, b) { return a.pick - b.pick; })[0] || null;

  if (bestValue && bestValue.ecrValue > 0) {
    strengths.push(
      '<b>' + escapeSummaryHtml(bestValue.name) + '</b> was your best value at ' +
      formatDraftSummaryDelta(bestValue.ecrValue) + ' picks versus ECR.'
    );
  }

  if (averageEcrValue != null && averageEcrValue >= 0) {
    strengths.push('Your roster beat FantasyPros ECR by <b>' + formatDraftSummaryDelta(averageEcrValue) + ' picks per selection</b> on average.');
  }

  if (averageMarketValue != null && averageMarketValue >= 0) {
    strengths.push('You generally waited for market value, drafting players <b>' + formatDraftSummaryDelta(averageMarketValue) + ' picks after ADP</b> on average.');
  }

  if (startersFilled === getConfiguredStarterTotal()) {
    strengths.push('You completed every starting-lineup slot.');
  }

  if (positionCounts.RB >= 3 && positionCounts.WR >= 3) {
    strengths.push('You built usable depth at both RB and WR.');
  }

  if (openingWrCount >= 3) {
    strengths.push('Your opening created an elite <b>WR foundation</b> with three receivers in the first four selections.');
  }

  if (firstRb && Math.ceil(firstRb.pick / Math.max(1, LEAGUE_SIZE)) >= 5) {
    improvements.push('The WR-heavy opening pushed your first RB to <b>Round ' +
      Math.ceil(firstRb.pick / Math.max(1, LEAGUE_SIZE)) +
      '</b>. The depth is useful, but the room depends more on uncertain workloads than an early anchor RB would.');
  }

  if (crowdedByes.length) {
    var severeByes = crowdedByes.filter(function(bye) { return byeCounts[bye] >= 5; });
    improvements.push('Bye-week concentration: <b>' + crowdedByes.slice(0, 3).map(function(bye) {
      return byeCounts[bye] + ' players in Week ' + bye;
    }).join(' and ') + '</b>.' + (severeByes.length
      ? ' Five-player clusters can remove several starters at once.'
      : ' Monitor lineup coverage before adding another player from those weeks.'));
  }

  materialReaches.slice(0, 3).forEach(function(player) {
    var alternative = getFinalDraftAlternative(player);
    var advice =
      '<b>' + escapeSummaryHtml(player.name) + ' at #' + player.pick + '</b> was ' +
      Math.abs(player.ecrValue).toFixed(0) + ' picks ahead of ECR.';

    if (alternative) {
      advice += ' <b>' + escapeSummaryHtml(alternative.name) + '</b> (ECR #' + alternative.ecr.toFixed(0) +
        ') was still available and would have followed consensus value more closely.';
    } else {
      advice += ' Waiting longer or taking a higher-ECR option would have reduced the reach.';
    }

    improvements.push(advice);
  });

  var starterLimits = getConfiguredStarterLimits();
  var requiredCounts = getConfiguredDedicatedStarterLimits();
  var missing = [];
  Object.keys(requiredCounts).forEach(function(position) {
    var shortfall = Math.max(0, requiredCounts[position] - positionCounts[position]);
    if (shortfall) missing.push(position + (shortfall > 1 ? ' ×' + shortfall : ''));
  });
  if (startersFilled < getConfiguredStarterTotal()) {
    var flexMissing = Math.max(0,
      starterLimits.FLEX - Math.min(starterLimits.FLEX,
        Math.max(0, positionCounts.RB - starterLimits.RB) +
        Math.max(0, positionCounts.WR - starterLimits.WR) +
        Math.max(0, positionCounts.TE - starterLimits.TE)
      )
    );
    if (flexMissing) missing.push('FLEX');
  }
  if (missing.length) {
    improvements.push('Your starting lineup finished with open needs at <b>' + missing.join(', ') + '</b>.');
  }

  ['K', 'DST'].forEach(function(position) {
    var selection = picks.find(function(player) {
      return player.position === position && player.pick != null;
    });
    var selectedRound = selection
      ? Math.ceil(selection.pick / Math.max(1, LEAGUE_SIZE))
      : null;
    if (selection && selectedRound < Math.max(1, TOTAL_ROUNDS - 1)) {
      improvements.push('<b>' + position + ' was selected in Round ' +
        selectedRound +
        '.</b> Waiting until the final two rounds usually preserves more upside at RB/WR.');
    } else if (selection) {
      strengths.push('You reserved <b>' + position + ' for Round ' + selectedRound +
        '</b>, preserving earlier selections for skill-position value.');
    }
  });

  if (!strengths.length) {
    strengths.push('You completed the draft and created a full record that can guide your next one.');
  }
  if (!improvements.length) {
    improvements.push('No major ECR reaches or starter-construction issues were detected. Your next edge is monitoring news and working waivers.');
  }

  var headline = grade === 'A+' || grade === 'A'
    ? 'Excellent value draft'
    : grade === 'B'
      ? 'Strong, disciplined draft'
      : grade === 'C'
        ? 'Solid roster with value left on the table'
        : grade === '—'
          ? 'Draft complete'
          : 'A few reaches held this draft back';

  return (
    '<div class="final-summary-kicker">' + (completion.provisional ? 'PROVISIONAL FINAL REPORT' : 'DRAFT COMPLETE') + '</div>' +
    '<div class="final-summary-title-row">' +
      '<div><h2 id="final-summary-title">&#127942; ' + headline + '</h2>' +
        '<p>Measured against FantasyPros 2026 PPR ECR for value and ESPN PPR ADP for timing when connected, with FantasyPros ADP fallback.</p></div>' +
      '<div class="final-grade"><span>VALUE<br>GRADE</span><strong>' + grade + '</strong></div>' +
    '</div>' +
    '<div class="final-summary-stats">' +
      '<div><span>Roster</span><strong>' + picks.length + ' picks</strong></div>' +
      '<div><span>Starters</span><strong>' + startersFilled + ' / ' + getConfiguredStarterTotal() + '</strong></div>' +
      '<div><span>Avg. vs ECR</span><strong>' + formatDraftSummaryDelta(averageEcrValue) + '</strong></div>' +
      '<div><span>Avg. vs ADP</span><strong>' + formatDraftSummaryDelta(averageMarketValue) + '</strong></div>' +
    '</div>' +
    '<div class="final-feedback-grid">' +
      '<section><h3>&#10003; What went well</h3><ul>' + strengths.map(function(item) { return '<li>' + item + '</li>'; }).join('') + '</ul></section>' +
      '<section class="improve"><h3>&#8593; What to improve</h3><ul>' + improvements.map(function(item) { return '<li>' + item + '</li>'; }).join('') + '</ul></section>' +
    '</div>' +
    '<section class="final-waiver-watch"><div><h3>Waiver watch</h3><p>Best undrafted skill-position players by FantasyPros PPR ECR.</p></div>' +
      buildWaiverWatchHtml(waiverWatch, false) + '</section>' +
    '<div class="final-summary-note">' + (completion.provisional
      ? 'ESPN reports the draft complete and your full roster is known, but some opponent pick numbers are still syncing. '
      : '') + 'This is a process review, not a season prediction. Injuries, roles, and waiver moves will change the final outcome.</div>' +
    '<button class="final-summary-done" onclick="closeFinalDraftSummary()">Back to my draft</button>'
  );
}

function openFinalDraftSummary(picks, positionCounts, startersFilled, averageEcrValue, grade) {
  var modal = document.getElementById('final-summary-modal');
  var content = document.getElementById('final-summary-content');
  if (!modal || !content) return;

  content.innerHTML = buildFinalDraftSummaryHtml(
    picks,
    positionCounts,
    startersFilled,
    averageEcrValue,
    grade
  );
  lastFocusedElementBeforeModal = document.activeElement;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('final-summary-open');
  var dialog = modal.querySelector('.final-summary-dialog');
  if (dialog) dialog.focus();
}

function closeFinalDraftSummary() {
  var modal = document.getElementById('final-summary-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('final-summary-open');
  if (lastFocusedElementBeforeModal && document.contains(lastFocusedElementBeforeModal)) {
    lastFocusedElementBeforeModal.focus();
  }
  lastFocusedElementBeforeModal = null;
}

function showFinalDraftSummary() {
  var data = window.latestFinalDraftSummaryData;
  if (!data) return;
  openFinalDraftSummary(
    data.picks,
    data.positionCounts,
    data.startersFilled,
    data.averageEcrValue,
    data.grade
  );
}

function updateDraftCompletionMode(state) {
  state = state || getDraftAssistantState();
  var complete = isDraftComplete(state);
  document.body.classList.toggle('draft-complete-mode', complete);
  return complete;
}

function renderDraftCompleteRecommendation(element) {
  var waiverWatch = getFinalWaiverWatch(5);
  window.latestDraftRecommendation = null;
  window.latestDraftExplanation = null;
  element.innerHTML =
    '<div class="draft-complete-card">' +
      '<div class="draft-complete-kicker">DRAFT COMPLETE</div>' +
      '<div class="draft-complete-heading"><div><strong>Your board is final.</strong><span>Live pick advice is closed so you can focus on the roster you built.</span></div>' +
        '<button onclick="showFinalDraftSummary()">View final report</button></div>' +
      '<div class="draft-complete-waivers"><b>Waiver watch</b><small>Best undrafted players by PPR ECR</small>' +
        buildWaiverWatchHtml(waiverWatch, true) + '</div>' +
    '</div>';
}

function maybeShowFinalDraftSummary(state, picks, positionCounts, startersFilled, averageEcrValue, grade) {
  var completion = getDraftCompletionStatus(state);
  var isComplete = completion.complete;
  var lastPickRow = document.querySelector(
    'tr.draftrow.drafted-other[data-pick="' + state.totalPicks + '"]'
  );
  var lastPickStillNeedsMineStatus = Boolean(
    lastPickRow &&
    Number(lastPickRow.getAttribute('data-team-slot')) === Number(state.draftSlot)
  );

  if (!isComplete || lastPickStillNeedsMineStatus) {
    if (_finalSummaryTimer) {
      clearTimeout(_finalSummaryTimer);
      _finalSummaryTimer = null;
    }
    closeFinalDraftSummary();
    try { localStorage.removeItem(getDraftSessionFinalKey()); } catch (error) {}
    return;
  }

  var alreadyShown = false;
  try { alreadyShown = localStorage.getItem(getDraftSessionFinalKey()) === '1'; } catch (error) {}
  if (alreadyShown) return;

  if (_finalSummaryTimer) clearTimeout(_finalSummaryTimer);
  _finalSummaryTimer = setTimeout(function() {
    _finalSummaryTimer = null;
    var latest = window.latestFinalDraftSummaryData;
    if (!latest) return;

    try { localStorage.setItem(getDraftSessionFinalKey(), '1'); } catch (error) {}
    openFinalDraftSummary(
      latest.picks,
      latest.positionCounts,
      latest.startersFilled,
      latest.averageEcrValue,
      latest.grade
    );
  }, 900);
}

function updateBestAvailable() {
  var container = document.getElementById('best-available-list');
  if (container) container.innerHTML = '';
}

function calculateMyNextDraftPick(currentPick, teams) {

  currentPick =
    Number(currentPick) || 0;

  teams =
    Number(teams) || 10;

  if (!currentPick || !teams) {
    return {
      nextPick: 0,
      picksBetween: 0
    };
  }

  var currentRound =
    Math.ceil(
      currentPick / teams
    );

  var pickInRound =
    ((currentPick - 1) % teams) + 1;

  var draftSlot;

  /*
   * Convert the current pick back into the user's
   * original draft slot.
   *
   * Odd rounds:
   * slot 1 picks first, slot 10 picks last.
   *
   * Even rounds:
   * slot 10 picks first, slot 1 picks last.
   */
  if (currentRound % 2 === 1) {

    draftSlot =
      pickInRound;

  } else {

    draftSlot =
      teams - pickInRound + 1;

  }


  /*
   * Calculate that same draft slot's pick
   * in the next round.
   */

  var nextRound =
    currentRound + 1;

  var nextPickInRound;

  if (nextRound % 2 === 1) {

    nextPickInRound =
      draftSlot;

  } else {

    nextPickInRound =
      teams - draftSlot + 1;

  }

  var nextPick =
    ((nextRound - 1) * teams) +
    nextPickInRound;


  var picksBetween =
    Math.max(
      0,
      nextPick - currentPick - 1
    );


  return {
    nextPick: nextPick,
    picksBetween: picksBetween
  };
}

function calculateMyNextTwoDraftPicks(
  currentPick,
  teams
) {

  currentPick =
    Number(currentPick) || 0;

  teams =
    Number(teams) || 10;

  if (
    currentPick <= 0 ||
    teams <= 0
  ) {

    return {
      firstNextPick: 0,
      secondNextPick: 0,
      picksBetweenFirst: 0,
      picksBetweenSecond: 0
    };

  }


  /*
   * -------------------------------------------------------
   * FIRST FUTURE PICK
   * -------------------------------------------------------
   */

  var firstWindow =
    calculateMyNextDraftPick(
      currentPick,
      teams
    );

  var firstNextPick =
    Number(
      firstWindow.nextPick
    ) || 0;


  /*
   * -------------------------------------------------------
   * SECOND FUTURE PICK
   * -------------------------------------------------------
   *
   * Treat our first future selection as the new
   * current pick, then calculate again.
   */

  var secondWindow =
    firstNextPick
      ? calculateMyNextDraftPick(
          firstNextPick,
          teams
        )
      : {
          nextPick: 0,
          picksBetween: 0
        };


  var secondNextPick =
    Number(
      secondWindow.nextPick
    ) || 0;


  return {

    firstNextPick:
      firstNextPick,

    secondNextPick:
      secondNextPick,

    picksBetweenFirst:
      Number(
        firstWindow.picksBetween
      ) || 0,

    picksBetweenSecond:
      Number(
        secondWindow.picksBetween
      ) || 0

  };
}

function calculateMultiPickPositionPath(
  player,
  context
) {

  if (!player) {
    return null;
  }

  context =
    context || {};

  var position =
    player.position ||
    player.pos ||
    null;

  if (
    !position ||
    !['QB', 'RB', 'WR', 'TE'].includes(position)
  ) {
    return null;
  }

  var currentPick =
    Number(context.currentPick) || 0;

  var teams =
    Number(context.teams) || 10;

  var futurePicks =
    calculateMyNextTwoDraftPicks(
      currentPick,
      teams
    );

  var needs =
    Object.assign(
      {},
      context.rosterNeeds ||
      calculateDecisionRosterNeeds()
    );


  /*
   * -------------------------------------------------------
   * SIMULATE TAKING CURRENT PLAYER
   * -------------------------------------------------------
   */

  if (
    Number(needs[position]) > 0
  ) {

    needs[position] =
      Math.max(
        0,
        Number(needs[position]) - 1
      );

  } else if (
    (
      position === 'RB' ||
      position === 'WR' ||
      position === 'TE'
    ) &&
    Number(needs.FLEX) > 0
  ) {

    needs.FLEX =
      Math.max(
        0,
        Number(needs.FLEX) - 1
      );

  }


  /*
   * -------------------------------------------------------
   * SCORE FUTURE POSITION PRIORITIES
   * -------------------------------------------------------
   */

var positions =
  ['QB', 'RB', 'WR', 'TE'];


/*
 * -------------------------------------------------------
 * CACHE FUTURE POSITION DEPTH
 * -------------------------------------------------------
 *
 * Positional depth does not change between the first
 * and second future-pick priority calculations.
 * Calculate it once per position and reuse it.
 */

var futureDepthByPosition = {};


positions.forEach(function(pos) {

  futureDepthByPosition[pos] =
    calculateFuturePositionDepth(
      {
        position:
          pos,

        rank:
          Number(player.rank) || 999,

        name:
          '__PATH_' + pos
      },
      context
    );

});


var priorities =
  positions.map(function(pos) {

      var need =
        Number(needs[pos]) || 0;

      var flexNeed =
        Number(needs.FLEX) || 0;

      var priority = 0;


      /*
       * Dedicated starter need.
       */

      priority +=
        need * 3;


      /*
       * FLEX need.
       */

      if (
        flexNeed > 0 &&
        (
          pos === 'RB' ||
          pos === 'WR' ||
          pos === 'TE'
        )
      ) {

        priority += 1;

      }


      /*
       * Future depth.
       *
       * Thin positions deserve more priority.
       */

var depth =
  Number(
    futureDepthByPosition[pos]
  ) || 0;

      var depthUrgency =
        Math.max(
          0,
          100 - depth
        ) / 25;

      priority +=
        depthUrgency;


      return {
        position:
          pos,

        need:
          need,

        flexNeed:
          flexNeed,

        futureDepth:
          depth,

        priority:
          priority
      };

    });


  priorities.sort(function(a, b) {

    return (
      Number(b.priority) -
      Number(a.priority)
    );

  });


 /*
 * -------------------------------------------------------
 * FIRST FUTURE POSITION
 * -------------------------------------------------------
 */

var firstFuturePosition =
  priorities[0]
    ? priorities[0].position
    : null;


/*
 * -------------------------------------------------------
 * SIMULATE FIRST FUTURE PICK
 * -------------------------------------------------------
 *
 * After choosing the first future position, update
 * the remaining roster needs before deciding what
 * the SECOND future position should be.
 */

var secondNeeds =
  Object.assign(
    {},
    needs
  );

if (firstFuturePosition) {

  if (
    Number(
      secondNeeds[firstFuturePosition]
    ) > 0
  ) {

    secondNeeds[firstFuturePosition] =
      Math.max(
        0,
        Number(
          secondNeeds[firstFuturePosition]
        ) - 1
      );

  } else if (
    (
      firstFuturePosition === 'RB' ||
      firstFuturePosition === 'WR' ||
      firstFuturePosition === 'TE'
    ) &&
    Number(secondNeeds.FLEX) > 0
  ) {

    secondNeeds.FLEX =
      Math.max(
        0,
        Number(secondNeeds.FLEX) - 1
      );

  }

}


/*
 * -------------------------------------------------------
 * SECOND FUTURE PRIORITIES
 * -------------------------------------------------------
 */

var secondPriorities =
  positions.map(function(pos) {

    var need =
      Number(
        secondNeeds[pos]
      ) || 0;

    var flexNeed =
      Number(
        secondNeeds.FLEX
      ) || 0;

    var priority = 0;


    /*
     * Dedicated starter need.
     */

    priority +=
      need * 3;


    /*
     * FLEX need.
     */

    if (
      flexNeed > 0 &&
      (
        pos === 'RB' ||
        pos === 'WR' ||
        pos === 'TE'
      )
    ) {

      priority += 1;

    }


    /*
     * Future positional depth.
     */

var depth =
  Number(
    futureDepthByPosition[pos]
  ) || 0;


    var depthUrgency =
      Math.max(
        0,
        100 - depth
      ) / 25;


    priority +=
      depthUrgency;


    return {

      position:
        pos,

      need:
        need,

      flexNeed:
        flexNeed,

      futureDepth:
        depth,

      priority:
        priority

    };

  });


secondPriorities.sort(function(a, b) {

  return (
    Number(b.priority) -
    Number(a.priority)
  );

});


var secondFuturePosition =
  secondPriorities[0]
    ? secondPriorities[0].position
    : null;


/*
 * -------------------------------------------------------
 * RETURN PATH
 * -------------------------------------------------------
 */

return {

  currentPosition:
    position,

  firstNextPick:
    futurePicks.firstNextPick,

  secondNextPick:
    futurePicks.secondNextPick,

  firstFuturePosition:
    firstFuturePosition,

  secondFuturePosition:
    secondFuturePosition,

  firstPriorities:
    priorities,

  secondPriorities:
    secondPriorities,

  needsAfterCurrentPick:
    needs,

  needsAfterFirstFuturePick:
    secondNeeds

};

}

function getProjectedPlayersAtFuturePick(
  position,
  futurePick,
  context
) {

  context =
    context || {};

  position =
    position || null;

  futurePick =
    Number(futurePick) || 0;


  if (
    !position ||
    !['QB', 'RB', 'WR', 'TE'].includes(position) ||
    futurePick <= 0
  ) {

    return [];

  }


  /*
   * -------------------------------------------------------
   * PLAYER POOL
   * -------------------------------------------------------
   */

  var players =
    context.players ||
    context.availablePlayers ||
    [];

  if (!Array.isArray(players)) {
    return [];
  }


  /*
   * -------------------------------------------------------
   * CURRENT DRAFT STATE
   * -------------------------------------------------------
   */

  var currentPick =
    Number(context.currentPick) || 0;

  var currentRank =
    Number(context.currentRank) || 0;


  /*
   * -------------------------------------------------------
   * CANDIDATES AT POSITION
   * -------------------------------------------------------
   */

  var candidates =
    players
      .filter(function(player) {

        if (!player) {
          return false;
        }

        var playerPosition =
          player.position ||
          player.pos;

        return (
          player.available !== false &&
          playerPosition === position &&
          Number(player.rank) > 0
        );

      })
      .map(function(player) {

        /*
         * Reuse the survival engine.
         *
         * We temporarily tell it that the requested
         * futurePick is our next selection.
         */

        var survivalContext =
          Object.assign(
            {},
            context,
            {
              currentPick:
                currentPick,

              calculatedNextPick:
                futurePick,

              nextPick:
                futurePick,

              currentRank:
                currentRank
            }
          );


        var survival =
          calculateNextPickSurvival(
            player,
            survivalContext
          );


        /*
         * We may receive raw players or already-scored
         * players. Use the strongest available score.
         */

  var playerScore =
  Number(player.finalScore);


/*
 * -------------------------------------------------------
 * REUSE EXISTING ENGINE SCORE
 * -------------------------------------------------------
 */

if (
  !Number.isFinite(playerScore) &&
  context.scoredByName &&
  player.name
) {

  var cachedScoredPlayer =
    context.scoredByName[
      String(player.name).toLowerCase()
    ];

  if (cachedScoredPlayer) {

    playerScore =
      Number(
        cachedScoredPlayer.finalScore
      );

  }

}


/*
 * -------------------------------------------------------
 * LIGHTWEIGHT FALLBACK
 * -------------------------------------------------------
 *
 * Do NOT run the full decision engine here.
 *
 * If a scored version isn't available, use rank as a
 * cheap fallback. This prevents future projections from
 * recursively invoking large parts of the engine.
 */

if (!Number.isFinite(playerScore)) {

  var rank =
    Number(player.rank) || 999;

  playerScore =
    Math.max(
      0,
      100 - ((rank - 1) * 1.5)
    );

}

        /*
         * Survival-adjusted future value.
         */

        var projectedValue =
          playerScore *
          (
            Number(survival) || 0
          ) /
          100;


        return {

          name:
            player.name,

          position:
            position,

          rank:
            Number(player.rank) || 999,

          score:
            playerScore,

          survival:
            survival,

          projectedValue:
            projectedValue,

          player:
            player

        };

      });


  /*
   * -------------------------------------------------------
   * REALISTIC FUTURE OPTIONS
   * -------------------------------------------------------
   *
   * Extremely unlikely survivors should not be treated
   * as meaningful future options.
   */

  candidates =
    candidates.filter(function(candidate) {

      return (
        Number(candidate.survival) >= 20
      );

    });


  /*
   * -------------------------------------------------------
   * SORT BY PROJECTED FUTURE VALUE
   * -------------------------------------------------------
   */

  candidates.sort(function(a, b) {

    return (
      Number(b.projectedValue) -
      Number(a.projectedValue)
    );

  });


  /*
   * Keep the strongest few.
   */

  return candidates.slice(0, 5);
}

function getProjectedDraftPackageCached(
  player,
  context
) {

  if (!player) {
    return null;
  }

  context =
    context || {};

  /*
   * Store the cache on the context itself.
   *
   * A new live draft state creates a new context,
   * so the cache naturally resets whenever the
   * draft state is rebuilt.
   */

  if (!context.packageProjectionCache) {

    context.packageProjectionCache = {};

  }


  var key =
    String(
      player.name || ''
    ).toLowerCase();


  if (!key) {
    return null;
  }


  /*
   * Already calculated during this engine pass.
   */

  if (
    Object.prototype.hasOwnProperty.call(
      context.packageProjectionCache,
      key
    )
  ) {

    return context.packageProjectionCache[key];

  }


  /*
   * Calculate once.
   */

  var result =
    calculateProjectedDraftPackage(
      player,
      context
    );


  context.packageProjectionCache[key] =
    result;


  return result;
}

function calculateProjectedDraftPackage(
  player,
  context
) {

  if (!player) {
    return null;
  }

  context =
    context || {};

  var path =
    calculateMultiPickPositionPath(
      player,
      context
    );

  if (!path) {
    return null;
  }


  /*
   * -------------------------------------------------------
   * CURRENT PLAYER VALUE
   * -------------------------------------------------------
   */

 var currentScore =
  Number(player.finalScore);

if (!Number.isFinite(currentScore)) {

  /*
   * Real live player:
   * use the full decision engine.
   */

  if (
    player.row &&
    typeof player.row.closest === 'function'
  ) {

    var scoredCurrent =
      calculateDraftDecisionScore(
        player,
        context
      );

    currentScore =
      scoredCurrent
        ? Number(scoredCurrent.finalScore) || 0
        : 0;

  } else {

    /*
     * Synthetic/test player:
     * use a lightweight rank-based fallback.
     */

    var currentRank =
      Number(player.rank) || 999;

    currentScore =
      Math.max(
        0,
        100 - ((currentRank - 1) * 1.5)
      );

  }

}


  /*
   * -------------------------------------------------------
   * FIRST FUTURE PICK
   * -------------------------------------------------------
   */

  var firstOptions =
    getProjectedPlayersAtFuturePick(
      path.firstFuturePosition,
      path.firstNextPick,
      context
    ).filter(function(option) {
      return canonicalExpertPlayerName(option && option.name) !==
        canonicalExpertPlayerName(player.name);
    });

  var firstPlayer =
    firstOptions.length
      ? firstOptions[0]
      : null;


  /*
   * -------------------------------------------------------
   * SECOND FUTURE PICK
   * -------------------------------------------------------
   */

  var secondOptions =
    getProjectedPlayersAtFuturePick(
      path.secondFuturePosition,
      path.secondNextPick,
      context
    ).filter(function(option) {
      return canonicalExpertPlayerName(option && option.name) !==
        canonicalExpertPlayerName(player.name);
    });


  /*
   * The player selected at the first future pick
   * cannot also be selected at the second future pick.
   */

  if (firstPlayer) {

    secondOptions =
      secondOptions.filter(function(option) {

        return (
          option.name !==
          firstPlayer.name
        );

      });

  }


  var secondPlayer =
    secondOptions.length
      ? secondOptions[0]
      : null;


  /*
   * -------------------------------------------------------
   * PACKAGE VALUES
   * -------------------------------------------------------
   */

  var firstProjectedValue =
    firstPlayer
      ? Number(
          firstPlayer.projectedValue
        ) || 0
      : 0;

  var secondProjectedValue =
    secondPlayer
      ? Number(
          secondPlayer.projectedValue
        ) || 0
      : 0;


  var packageValue =
    currentScore +
    firstProjectedValue +
    secondProjectedValue;


  /*
   * -------------------------------------------------------
   * PACKAGE COMPLETENESS
   * -------------------------------------------------------
   *
   * Missing a realistic player at a future selection
   * should reduce our confidence in the path.
   */

  var completeFuturePicks = 0;

  if (firstPlayer) {
    completeFuturePicks++;
  }

  if (secondPlayer) {
    completeFuturePicks++;
  }


  return {

    currentPlayer:
      player.name,

    currentPosition:
      player.position ||
      player.pos,

    currentScore:
      currentScore,

    firstPick:
      path.firstNextPick,

    firstPosition:
      path.firstFuturePosition,

    firstPlayer:
      firstPlayer
        ? firstPlayer.name
        : null,

    firstPlayerScore:
      firstPlayer
        ? firstPlayer.score
        : 0,

    firstSurvival:
      firstPlayer
        ? firstPlayer.survival
        : 0,

    firstProjectedValue:
      firstProjectedValue,

    secondPick:
      path.secondNextPick,

    secondPosition:
      path.secondFuturePosition,

    secondPlayer:
      secondPlayer
        ? secondPlayer.name
        : null,

    secondPlayerScore:
      secondPlayer
        ? secondPlayer.score
        : 0,

    secondSurvival:
      secondPlayer
        ? secondPlayer.survival
        : 0,

    secondProjectedValue:
      secondProjectedValue,

    completeFuturePicks:
      completeFuturePicks,

    packageValue:
      packageValue,

    path:
      path

  };
}

/*
 * =======================================================
 * PHASE 11 — DRAFT PATH FORECAST
 * =======================================================
 *
 * Converts the existing projected-package machinery into
 * one standardized, UI-friendly draft path.
 *
 * This does NOT create new scoring logic.
 */
function buildDraftPathForecast(
  player,
  context
) {

  if (!player) {
    return null;
  }


  context =
    context || {};


  var projectedPackage =
    getProjectedDraftPackageCached(
      player,
      context
    );


  if (!projectedPackage) {
    return null;
  }


  /*
   * -------------------------------------------------------
   * CURRENT PICK
   * -------------------------------------------------------
   */

  var currentPick =
    Number(
      context.currentPick
    ) || 0;


  var currentPosition =
    player.position ||
    player.pos ||
    projectedPackage.currentPosition ||
    null;


  /*
   * -------------------------------------------------------
   * PATH CONFIDENCE
   * -------------------------------------------------------
   *
   * Confidence describes how believable the FUTURE path is.
   *
   * It is deliberately separate from recommendation
   * confidence.
   */

  var firstSurvival =
    Number(
      projectedPackage.firstSurvival
    ) || 0;


  var secondSurvival =
    Number(
      projectedPackage.secondSurvival
    ) || 0;


  var completeFuturePicks =
    Number(
      projectedPackage.completeFuturePicks
    ) || 0;


  var averageFutureSurvival =
    0;


  if (completeFuturePicks === 2) {

    averageFutureSurvival =
      (
        firstSurvival +
        secondSurvival
      ) / 2;

  } else if (
    completeFuturePicks === 1
  ) {

    averageFutureSurvival =
      firstSurvival ||
      secondSurvival;

  }


  var confidenceScore =
    averageFutureSurvival;


  /*
   * Missing projected selections should lower confidence.
   */

  if (completeFuturePicks === 1) {

    confidenceScore -= 20;

  } else if (
    completeFuturePicks === 0
  ) {

    confidenceScore = 0;

  }


  confidenceScore =
    Math.max(
      0,
      Math.min(
        100,
        confidenceScore
      )
    );


  var confidence =
    confidenceScore >= 75
      ? 'HIGH'
      : confidenceScore >= 50
        ? 'MODERATE'
        : 'LOW';


  /*
   * -------------------------------------------------------
   * PATH STEPS
   * -------------------------------------------------------
   */

  var steps = [
    {
      order:
        1,

      pick:
        currentPick,

      player:
        player.name || null,

      position:
        currentPosition,

      projected:
        false,

      score:
        Number(
          projectedPackage.currentScore
        ) || 0,

      survival:
        100
    }
  ];


  if (
    projectedPackage.firstPick
  ) {

    steps.push({
      order:
        2,

      pick:
        Number(
          projectedPackage.firstPick
        ) || 0,

      player:
        projectedPackage.firstPlayer ||
        null,

      position:
        projectedPackage.firstPosition ||
        null,

      projected:
        true,

      score:
        Number(
          projectedPackage.firstPlayerScore
        ) || 0,

      survival:
        firstSurvival,

      projectedValue:
        Number(
          projectedPackage.firstProjectedValue
        ) || 0
    });

  }


  if (
    projectedPackage.secondPick
  ) {

    steps.push({
      order:
        3,

      pick:
        Number(
          projectedPackage.secondPick
        ) || 0,

      player:
        projectedPackage.secondPlayer ||
        null,

      position:
        projectedPackage.secondPosition ||
        null,

      projected:
        true,

      score:
        Number(
          projectedPackage.secondPlayerScore
        ) || 0,

      survival:
        secondSurvival,

      projectedValue:
        Number(
          projectedPackage.secondProjectedValue
        ) || 0
    });

  }


  /*
   * -------------------------------------------------------
   * PATH LABEL
   * -------------------------------------------------------
   */

  var positionPath =
    steps
      .map(function(step) {

        return (
          step.position ||
          '?'
        );

      })
      .join(' → ');


  return {

    currentPlayer:
      player.name || null,

    currentPosition:
      currentPosition,

    currentPick:
      currentPick,

    positionPath:
      positionPath,

    steps:
      steps,

    packageValue:
      Number(
        projectedPackage.packageValue
      ) || 0,

    completeFuturePicks:
      completeFuturePicks,

    averageFutureSurvival:
      Number(
        averageFutureSurvival.toFixed(1)
      ),

    confidenceScore:
      Number(
        confidenceScore.toFixed(1)
      ),

    confidence:
      confidence,

    firstPick:
      projectedPackage.firstPick,

    firstPlayer:
      projectedPackage.firstPlayer,

    firstPosition:
      projectedPackage.firstPosition,

    firstSurvival:
      firstSurvival,

    secondPick:
      projectedPackage.secondPick,

    secondPlayer:
      projectedPackage.secondPlayer,

    secondPosition:
      projectedPackage.secondPosition,

    secondSurvival:
      secondSurvival,

    rawPackage:
      projectedPackage

  };

}

function debugDraftPathForecast() {

  var state =
    buildLiveDraftDebugState();


  if (
    !state ||
    !state.scored ||
    !state.scored.length
  ) {

    console.warn(
      'No live recommendation state available.'
    );

    return null;

  }


  var topPlayers =
    state.scored.slice(
      0,
      3
    );


  var forecasts =
    topPlayers
      .map(function(player) {

        return buildDraftPathForecast(
          player,
          state.context
        );

      })
      .filter(Boolean);


  console.table(
    forecasts.map(function(path) {

      return {

        current:
          path.currentPlayer,

        path:
          path.positionPath,

        nextPick:
          path.firstPick,

        nextPlayer:
          path.firstPlayer,

        nextSurvival:
          path.firstSurvival,

        secondPick:
          path.secondPick,

        secondPlayer:
          path.secondPlayer,

        secondSurvival:
          path.secondSurvival,

        packageValue:
          Number(
            path.packageValue
          ).toFixed(1),

        confidence:
          path.confidence
      };

    })
  );


  window.latestDraftPathForecasts =
    forecasts;


  return forecasts;

}

function compareDraftPathForecasts(
  scoredPlayers,
  context,
  limit
) {

  scoredPlayers =
    Array.isArray(scoredPlayers)
      ? scoredPlayers
      : [];

  context =
    context || {};

  limit =
    Number(limit) || 3;


  var candidates =
    scoredPlayers
      .filter(function(player) {

        return (
          player &&
          player.available !== false
        );

      })
      .slice(
        0,
        Math.max(
          limit,
          1
        )
      );


  var forecasts =
    candidates
      .map(function(player) {

        return buildDraftPathForecast(
          player,
          context
        );

      })
      .filter(Boolean);


  forecasts.sort(function(a, b) {

    return (
      Number(b.packageValue || 0) -
      Number(a.packageValue || 0)
    );

  });


  var bestPackageValue =
    forecasts.length
      ? Number(
          forecasts[0].packageValue
        ) || 0
      : 0;


  forecasts.forEach(
    function(path, index) {

      var nextPath =
        forecasts[index + 1] ||
        null;


      path.rank =
        index + 1;


      path.gapFromBest =
        Number(
          (
            bestPackageValue -
            Number(
              path.packageValue || 0
            )
          ).toFixed(2)
        );


      path.gapToNext =
        nextPath
          ? Number(
              (
                Number(
                  path.packageValue || 0
                ) -
                Number(
                  nextPath.packageValue || 0
                )
              ).toFixed(2)
            )
          : 0;


      path.isBestPath =
        index === 0;

    }
  );


  return {

    bestPath:
      forecasts.length
        ? forecasts[0]
        : null,

    forecasts:
      forecasts,

    count:
      forecasts.length

  };

}

function debugDraftPathComparison() {

  var state =
    buildLiveDraftDebugState();


  if (
    !state ||
    !state.scored ||
    !state.scored.length
  ) {

    console.warn(
      'No live scored players available.'
    );

    return null;

  }


  var comparison =
    compareDraftPathForecasts(
      state.scored,
      state.context,
      3
    );


  console.table(
    comparison.forecasts.map(
      function(path) {

        return {

          rank:
            path.rank,

          current:
            path.currentPlayer,

          path:
            path.positionPath,

          packageValue:
            Number(
              path.packageValue
            ).toFixed(1),

          gapFromBest:
            Number(
              path.gapFromBest
            ).toFixed(1),

          gapToNext:
            Number(
              path.gapToNext
            ).toFixed(1),

          confidence:
            path.confidence,

          avgFutureSurvival:
            Number(
              path.averageFutureSurvival
            ).toFixed(1)

        };

      }
    )
  );


  window.latestDraftPathComparison =
    comparison;


  return comparison;

}

function buildDynamicStrategyAudit(
  suppliedState
) {

  var state =
    suppliedState ||
    buildLiveDraftDebugState();


  if (
    !state ||
    !state.context
  ) {

    return null;

  }


  var context =
    state.context;


  var positions =
    ['QB', 'RB', 'WR', 'TE'];


  /*
   * -------------------------------------------------------
   * TIER / SCARCITY STATE
   * -------------------------------------------------------
   */

  var profiles =
    state.vorpResult &&
    Array.isArray(
      state.vorpResult.profiles
    )
      ? state.vorpResult.profiles
      : [];


  var scarcityState =
    buildLiveTierScarcityState(
      state.players || [],
      profiles
    );


  /*
   * -------------------------------------------------------
   * POSITION AUDIT
   * -------------------------------------------------------
   */

  var positionAudit =
    {};


  positions.forEach(
    function(position) {

      var scarcity =
        scarcityState &&
        scarcityState.positions
          ? scarcityState.positions[
              position
            ]
          : null;


      var rosterNeed =
        context.rosterNeeds
          ? Number(
              context.rosterNeeds[
                position
              ]
            ) || 0
          : 0;


      var run =
        context.draftRuns &&
        context.draftRuns.runs
          ? context.draftRuns.runs[
              position
            ]
          : null;


      positionAudit[position] = {

        position:
          position,

        rosterNeed:
          rosterNeed,

        scarcityStatus:
          scarcity
            ? scarcity.status
            : 'UNKNOWN',

        scarcity:
          scarcity
            ? Number(
                scarcity.scarcity || 0
              )
            : 0,

        cliffSeverity:
          scarcity
            ? scarcity.cliffSeverity ||
              'NONE'
            : 'NONE',

        playersBeforeCliff:
          scarcity
            ? Number(
                scarcity.playersBeforeCliff ||
                0
              )
            : 0,

        runStrength:
          run
            ? run.strength ||
              'NONE'
            : 'NONE',

        runCount:
          run
            ? Number(
                run.count || 0
              )
            : 0

      };

    }
  );


  /*
   * -------------------------------------------------------
   * CURRENT DRAFT INFORMATION
   * -------------------------------------------------------
   */

  var currentPick =
    Number(
      context.currentPick
    ) || 0;


  var teams =
    Number(
      context.teams
    ) || 10;


  var round =
    currentPick > 0
      ? Math.ceil(
          currentPick /
          teams
        )
      : 0;


  /*
   * -------------------------------------------------------
   * CURRENT BEST PATH
   * -------------------------------------------------------
   */

  var pathComparison =
    compareDraftPathForecasts(
      state.scored || [],
      context,
      3
    );


  var bestPath =
    pathComparison
      ? pathComparison.bestPath
      : null;


  /*
   * -------------------------------------------------------
   * RETURN READ-ONLY AUDIT
   * -------------------------------------------------------
   */

  return {

    currentPick:
      currentPick,

    round:
      round,

    draftPhase:
      state.scored &&
      state.scored[0]
        ? state.scored[0].draftPhase ||
          null
        : null,

    rosterNeeds:
      context.rosterNeeds || {},

    draftRun:
      context.draftRuns || null,

    positions:
      positionAudit,

    bestPath:
      bestPath
        ? {
            player:
              bestPath.currentPlayer,

            position:
              bestPath.currentPosition,

            path:
              bestPath.positionPath,

            packageValue:
              bestPath.packageValue,

            futureSurvival:
              bestPath.averageFutureSurvival,

            confidence:
              bestPath.confidence
          }
        : null

  };

}

function buildDynamicStrategyState(
  suppliedAudit
) {

  var audit =
    suppliedAudit ||
    buildDynamicStrategyAudit();


  if (!audit) {
    return null;
  }


  var positions =
    ['QB', 'RB', 'WR', 'TE'];


  var strategyState = {
    currentPick:
      audit.currentPick,

    round:
      audit.round,

    draftPhase:
      audit.draftPhase,

    positions: {},

    priorityPositions: [],

    waitPositions: [],

    monitorPositions: []
  };


  positions.forEach(
    function(position) {

      var item =
        audit.positions[
          position
        ];


      if (!item) {
        return;
      }


      var state =
        'NEUTRAL';


      var reasons = [];


      /*
       * -------------------------------------------------------
       * STRONG PRIORITY SIGNALS
       * -------------------------------------------------------
       */

      if (
        item.scarcityStatus ===
          'CRITICAL CLIFF' ||
        item.scarcityStatus ===
          'HIGH SCARCITY'
      ) {

        state =
          'PRIORITIZE';

        reasons.push(
          item.scarcityStatus
        );

      }


      if (
        item.runStrength ===
          'STRONG' &&
        item.rosterNeed > 0
      ) {

        state =
          'PRIORITIZE';

        reasons.push(
          'strong positional run'
        );

      }


      /*
       * -------------------------------------------------------
       * STARTER-BUILD NEED
       * -------------------------------------------------------
       */

      if (
        audit.draftPhase ===
          'STARTER BUILD' &&
        item.rosterNeed >= 2 &&
        state !== 'PRIORITIZE'
      ) {

        state =
          'PRIORITIZE';

        reasons.push(
          'multiple starter needs remain'
        );

      }


      /*
       * -------------------------------------------------------
       * BEST PATH SIGNAL
       * -------------------------------------------------------
       */

      if (
        audit.bestPath &&
        audit.bestPath.position ===
          position
      ) {

        if (
          state === 'NEUTRAL'
        ) {

          state =
            'PRIORITIZE';

        }

        reasons.push(
          'best projected draft path starts here'
        );

      }


      /*
       * -------------------------------------------------------
       * MONITOR
       * -------------------------------------------------------
       */

if (
  state === 'NEUTRAL' &&
  item.rosterNeed > 0 &&
  (
    item.scarcityStatus ===
      'TIER CLOSING' ||
    item.scarcity >= 75
  )
) {

  state =
    'MONITOR';

  reasons.push(
    'need remains with emerging pressure'
  );

}


      /*
       * -------------------------------------------------------
       * WAIT
       * -------------------------------------------------------
       */

      if (
        state === 'NEUTRAL' &&
        item.rosterNeed > 0 &&
        item.scarcityStatus ===
          'HEALTHY DEPTH'
      ) {

        state =
          'WAIT';

        reasons.push(
          'healthy positional depth'
        );

      }


      /*
       * -------------------------------------------------------
       * SATISFIED POSITION
       * -------------------------------------------------------
       */

      if (
        item.rosterNeed <= 0
      ) {

        state =
          'WAIT';

        reasons = [
          'starter need satisfied'
        ];

      }


      strategyState.positions[
        position
      ] = {

        position:
          position,

        state:
          state,

        reasons:
          reasons,

        rosterNeed:
          item.rosterNeed,

        scarcity:
          item.scarcity,

        scarcityStatus:
          item.scarcityStatus,

        cliffSeverity:
          item.cliffSeverity,

        runStrength:
          item.runStrength

      };


      if (
        state === 'PRIORITIZE'
      ) {

        strategyState
          .priorityPositions
          .push(position);

      } else if (
        state === 'MONITOR'
      ) {

        strategyState
          .monitorPositions
          .push(position);

      } else if (
        state === 'WAIT'
      ) {

        strategyState
          .waitPositions
          .push(position);

      }

    }
  );


  return strategyState;

}

function debugDynamicStrategyAudit() {

  var audit =
    buildDynamicStrategyAudit();


  if (!audit) {

    console.warn(
      'Dynamic strategy audit unavailable.'
    );

    return null;

  }


  console.log(
    'DYNAMIC STRATEGY AUDIT:',
    {
      currentPick:
        audit.currentPick,

      round:
        audit.round,

      draftPhase:
        audit.draftPhase,

      rosterNeeds:
        audit.rosterNeeds,

      bestPath:
        audit.bestPath
    }
  );


  console.table(
    Object.keys(
      audit.positions
    ).map(function(position) {

      var item =
        audit.positions[
          position
        ];


      return {

        position:
          position,

        need:
          item.rosterNeed,

        scarcityStatus:
          item.scarcityStatus,

        scarcity:
          Number(
            item.scarcity
          ).toFixed(1),

        cliff:
          item.cliffSeverity,

        beforeCliff:
          item.playersBeforeCliff,

        run:
          item.runStrength,

        runCount:
          item.runCount

      };

    })
  );


  window.latestDynamicStrategyAudit =
    audit;


  return audit;

}

function debugDynamicStrategyState() {

  var state =
    buildDynamicStrategyState();


  if (!state) {

    console.warn(
      'Dynamic strategy state unavailable.'
    );

    return null;

  }


  console.table(
    Object.keys(
      state.positions
    ).map(function(position) {

      var item =
        state.positions[
          position
        ];


      return {

        position:
          position,

        strategy:
          item.state,

        need:
          item.rosterNeed,

        scarcity:
          Number(
            item.scarcity
          ).toFixed(1),

        scarcityStatus:
          item.scarcityStatus,

        cliff:
          item.cliffSeverity,

        run:
          item.runStrength,

        reasons:
          item.reasons.join(
            '; '
          )

      };

    })
  );


  window.latestDynamicStrategyState =
    state;


  return state;

}

function calculatePackagePathAdvantage(
  player,
  scoredPlayers,
  context
) {

  if (!player) {
    return 0;
  }

  scoredPlayers =
    Array.isArray(scoredPlayers)
      ? scoredPlayers
      : [];

  context =
    context || {};


var currentPackage =
  getProjectedDraftPackageCached(
    player,
    context
  );

  if (!currentPackage) {
    return 0;
  }


  /*
   * Compare against the strongest realistic
   * alternative starting players.
   */

  var alternatives =
    scoredPlayers
      .filter(function(candidate) {

        return candidate &&
          candidate.name !== player.name &&
          candidate.available !== false;

      })
      .slice(0, 5);


  if (!alternatives.length) {
    return 0;
  }


  var alternativeValues =
    alternatives
      .map(function(candidate) {

var pkg =
  getProjectedDraftPackageCached(
    candidate,
    context
  );

        return pkg
          ? Number(pkg.packageValue) || 0
          : 0;

      })
      .filter(function(value) {
        return value > 0;
      });


  if (!alternativeValues.length) {
    return 0;
  }


  var bestAlternativePackage =
    Math.max.apply(
      null,
      alternativeValues
    );


  var packageGap =
    (
      Number(currentPackage.packageValue) || 0
    ) -
    bestAlternativePackage;


  /*
   * -------------------------------------------------------
   * NORMALIZE
   * -------------------------------------------------------
   *
   * Roughly:
   *
   * +10 package advantage → +2
   *  +5 package advantage → +1
   *   0                   →  0
   *  -5                   → -1
   * -10                   → -2
   */

  var score =
    packageGap / 5;


  score =
    Math.max(
      -2,
      Math.min(
        2,
        score
      )
    );


  return Number(
    score.toFixed(2)
  );
}

function applyPackagePathAdjustments(
  scoredPlayers,
  context,
  limit
) {

  scoredPlayers =
    Array.isArray(scoredPlayers)
      ? scoredPlayers
      : [];

  context =
    context || {};

  limit =
    Number(limit) || 8;


  /*
   * -------------------------------------------------------
   * ONLY DEEP-PLAN REALISTIC CURRENT PICKS
   * -------------------------------------------------------
   *
   * There is no reason to run expensive package planning
   * for every player on the board.
   */

  scoredPlayers.forEach(function(player, index) {

    /*
     * Default for players outside the planning window.
     */

    player.packagePathAdvantageScore =
      0;


    if (index >= limit) {
      return;
    }


    var advantage =
      calculatePackagePathAdvantage(
        player,
        scoredPlayers,
        context
      );


    player.packagePathAdvantageScore =
      advantage;


    /*
     * Small bounded adjustment.
     */

    player.finalScore +=
      advantage;

  });


  /*
   * Re-sort after package adjustments.
   */

  scoredPlayers.sort(function(a, b) {

    return (
      Number(b.finalScore || 0) -
      Number(a.finalScore || 0)
    );

  });


  return scoredPlayers;
}

function enforceAuthoritativePositionOrder(scoredPlayers) {
  scoredPlayers = Array.isArray(scoredPlayers) ? scoredPlayers : [];

  VORP_POSITIONS.forEach(function(position) {
    var positionPlayers = scoredPlayers
      .filter(function(player) {
        return player && player.position === position &&
          hasAuthoritativeEcr(player) && Number.isFinite(Number(player.finalScore));
      })
      .slice()
      .sort(function(a, b) { return Number(a.rank) - Number(b.rank); });

    var previousScore = null;
    positionPlayers.forEach(function(player) {
      var score = Number(player.finalScore);
      player.authorityOrderAdjustment = 0;

      if (previousScore != null && score >= previousScore) {
        var adjustedScore = previousScore - 0.01;
        player.authorityOrderAdjustment = Number((adjustedScore - score).toFixed(2));
        player.finalScore = adjustedScore;
        score = adjustedScore;
      }

      previousScore = score;
    });
  });

  scoredPlayers.sort(function(a, b) {
    return Number(b.finalScore || 0) - Number(a.finalScore || 0);
  });

  return scoredPlayers;
}

function applyMarketAwareRecommendationPriority(scoredPlayers, context) {
  scoredPlayers = Array.isArray(scoredPlayers) ? scoredPlayers : [];
  context = context || {};
  var corePositions = ['QB', 'RB', 'WR', 'TE'];
  var ecrPlayers = scoredPlayers.filter(function(player) {
    return player && corePositions.includes(player.position) && hasAuthoritativeEcr(player);
  }).slice().sort(function(a, b) {
    return Number(a.ecr || a.rank) - Number(b.ecr || b.rank);
  });
  var bestEcrPlayer = ecrPlayers[0] || null;
  var bestEcrRank = bestEcrPlayer ? Number(bestEcrPlayer.ecr || bestEcrPlayer.rank) : null;
  var bestEcrSurvival = bestEcrPlayer
    ? calculateNextPickSurvival(bestEcrPlayer, context)
    : 50;

  scoredPlayers.forEach(function(player) {
    var survival = calculateNextPickSurvival(player, context);
    var timingAdjustment = Math.max(-6, Math.min(6, (50 - survival) * 0.12));
    var round = Math.ceil(
      (Number(context.currentPick) || 1) /
      Math.max(1, Number(context.teams) || 10)
    );
    var zeroRbStarterBuild = round >= 4 &&
      Number(context.rosterCounts && context.rosterCounts.RB) === 0 &&
      Number(context.rosterCounts && context.rosterCounts.WR) >= 2;
    var rosterPriorityAdjustment = zeroRbStarterBuild
      ? player.position === 'RB' ? 3 : player.position === 'WR' ? -3 : 0
      : 0;
    player.recommendationSurvival = survival;
    player.marketPriorityAdjustment = Number(timingAdjustment.toFixed(2));
    player.rosterPriorityAdjustment = rosterPriorityAdjustment;
    player.recommendationPriorityScore = Number(player.finalScore || 0) +
      timingAdjustment + rosterPriorityAdjustment;
    player.marketEcrGuardrail = false;
  });

  if (bestEcrPlayer && bestEcrSurvival < 35) {
    var bestPriority = Number(bestEcrPlayer.recommendationPriorityScore) || 0;
    var currentPick = Number(context.currentPick) || 0;
    var protectionGap = bestEcrRank <= 12 && currentPick - bestEcrRank >= 4 ? 5 : 8;
    scoredPlayers.forEach(function(player) {
      if (!player || player === bestEcrPlayer || !corePositions.includes(player.position)) return;
      var ecrRank = Number(player.ecr || player.rank);
      if (!Number.isFinite(ecrRank) || ecrRank - bestEcrRank < protectionGap) return;
      var fillsOpenStarter = Number(context.rosterNeeds && context.rosterNeeds[player.position]) > 0 &&
        Number(context.rosterNeeds && context.rosterNeeds[bestEcrPlayer.position]) <= 0;
      var materiallyBetterForRoster = bestEcrRank > 12 && fillsOpenStarter &&
        Number(player.recommendationPriorityScore || 0) >=
          Number(bestEcrPlayer.recommendationPriorityScore || 0) + 2;
      if (materiallyBetterForRoster) return;
      // Positional value may break close ECR ties, but another urgent player
      // cannot use the same market signal to jump a materially better,
      // already-overdue ECR value.
      if (player.recommendationPriorityScore >= bestPriority) {
        player.recommendationPriorityScore = bestPriority - 0.01;
        player.marketEcrGuardrail = true;
      }
    });
  }

  corePositions.forEach(function(position) {
    var positionPlayers = scoredPlayers.filter(function(player) {
      return player && player.position === position && hasAuthoritativeEcr(player);
    }).slice().sort(function(a, b) {
      return Number(a.ecr || a.rank) - Number(b.ecr || b.rank);
    });
    var previousPriority = null;
    positionPlayers.forEach(function(player) {
      player.marketAuthorityOrderAdjustment = 0;
      if (previousPriority != null && player.recommendationPriorityScore >= previousPriority) {
        var adjustedPriority = previousPriority - 0.01;
        player.marketAuthorityOrderAdjustment = Number(
          (adjustedPriority - player.recommendationPriorityScore).toFixed(2)
        );
        player.recommendationPriorityScore = adjustedPriority;
      }
      previousPriority = player.recommendationPriorityScore;
    });
  });

  scoredPlayers.sort(function(a, b) {
    return Number(b.recommendationPriorityScore || 0) - Number(a.recommendationPriorityScore || 0) ||
      Number(b.finalScore || 0) - Number(a.finalScore || 0);
  });
  return scoredPlayers;
}

function alignRecommendationActionWithMarketTiming(decision, player, backToBackTurn) {
  if (!decision || !player) return decision;
  var survival = Number(player.recommendationSurvival);
  if (!Number.isFinite(survival)) return decision;
  var hasMandatoryGuardrail = Number(player.endgameRosterRequirementScore) > 0 ||
    Number(player.mandatoryEndgameAdjustment) > 0;

  if (survival <= 25 &&
      (decision.recommendation === 'WAIT' || decision.recommendation === 'PASS')) {
    decision.recommendation = 'CONSIDER';
    decision.summary = 'This player is unlikely to survive to your next selection.';
  }
  if (survival >= 70 && decision.recommendation === 'DRAFT' &&
      !backToBackTurn && !hasMandatoryGuardrail) {
    decision.recommendation = 'CONSIDER';
    decision.summary = 'Strong option, but the ADP market suggests this player may survive.';
  }
  return decision;
}

function calculateMultiPickPlanningScore(
  player,
  context
) {

  if (!player) {
    return 0;
  }

  var path =
    calculateMultiPickPositionPath(
      player,
      context
    );

  if (!path) {
    return 0;
  }

  var position =
    player.position ||
    player.pos ||
    null;

  if (!position) {
    return 0;
  }


  var score = 0;


  /*
   * -------------------------------------------------------
   * 1. PATH DIVERSITY
   * -------------------------------------------------------
   *
   * Keep this smaller than before.
   */

  if (
    path.firstFuturePosition &&
    path.firstFuturePosition !== position
  ) {
    score += 0.40;
  }

  if (
    path.secondFuturePosition &&
    path.secondFuturePosition !== position
  ) {
    score += 0.25;
  }

  if (
    path.firstFuturePosition &&
    path.secondFuturePosition &&
    path.firstFuturePosition !==
      path.secondFuturePosition
  ) {
    score += 0.25;
  }


  /*
   * -------------------------------------------------------
   * 2. FIRST FUTURE PICK QUALITY
   * -------------------------------------------------------
   *
   * A strong priority means there is a clear,
   * useful roster-building move available next.
   */

  var firstPriority =
    path.firstPriorities &&
    path.firstPriorities.length
      ? Number(
          path.firstPriorities[0].priority
        ) || 0
      : 0;

  score +=
    Math.min(
      0.50,
      firstPriority / 20
    );


  /*
   * -------------------------------------------------------
   * 3. SECOND FUTURE PICK QUALITY
   * -------------------------------------------------------
   */

  var secondPriority =
    path.secondPriorities &&
    path.secondPriorities.length
      ? Number(
          path.secondPriorities[0].priority
        ) || 0
      : 0;

  score +=
    Math.min(
      0.40,
      secondPriority / 20
    );


  /*
   * -------------------------------------------------------
   * 4. PATH BALANCE
   * -------------------------------------------------------
   *
   * Reward paths where there are multiple viable
   * options rather than one desperate position need.
   */

  if (
    path.firstPriorities &&
    path.firstPriorities.length >= 2
  ) {

    var firstGap =
      Number(
        path.firstPriorities[0].priority
      ) -
      Number(
        path.firstPriorities[1].priority
      );

    if (firstGap <= 1) {
      score += 0.20;
    }

  }


  if (
    path.secondPriorities &&
    path.secondPriorities.length >= 2
  ) {

    var secondGap =
      Number(
        path.secondPriorities[0].priority
      ) -
      Number(
        path.secondPriorities[1].priority
      );

    if (secondGap <= 1) {
      score += 0.20;
    }

  }


  /*
   * -------------------------------------------------------
   * 5. CONCENTRATION PENALTY
   * -------------------------------------------------------
   */

  if (
    path.firstFuturePosition === position &&
    path.secondFuturePosition === position
  ) {
    score -= 1;
  }


  /*
   * -------------------------------------------------------
   * CLAMP
   * -------------------------------------------------------
   */

  score =
    Math.max(
      -1,
      Math.min(
        2,
        score
      )
    );


  return Number(
    score.toFixed(2)
  );
}

function getSnakeDraftTeamForPick(
  pick,
  teams
) {

  pick =
    Number(pick) || 0;

  teams =
    Number(teams) || 10;

  if (
    pick <= 0 ||
    teams <= 0
  ) {

    return null;

  }


  /*
   * -------------------------------------------------------
   * ROUND
   * -------------------------------------------------------
   */

  var round =
    Math.ceil(
      pick / teams
    );


  /*
   * Pick position inside the round:
   *
   * 1 through teams
   */

  var pickInRound =
    ((pick - 1) % teams) + 1;


  /*
   * -------------------------------------------------------
   * SNAKE TEAM SLOT
   * -------------------------------------------------------
   *
   * Odd rounds:
   *
   * Pick 1  -> Team 1
   * Pick 2  -> Team 2
   * ...
   * Pick 10 -> Team 10
   *
   * Even rounds:
   *
   * Pick 11 -> Team 10
   * Pick 12 -> Team 9
   * ...
   * Pick 20 -> Team 1
   */

  var teamSlot;

  if (
    round % 2 === 1
  ) {

    teamSlot =
      pickInRound;

  } else {

    teamSlot =
      teams -
      pickInRound +
      1;

  }


  return {
    pick:
      pick,

    round:
      round,

    pickInRound:
      pickInRound,

    teamSlot:
      teamSlot
  };
}

function getTeamsPickingBeforeMyNextTurn(
  currentPick,
  nextPick,
  teams
) {

  currentPick =
    Number(currentPick) || 0;

  nextPick =
    Number(nextPick) || 0;

  teams =
    Number(teams) || 10;

  if (
    currentPick <= 0 ||
    nextPick <= currentPick ||
    teams <= 0
  ) {

    return {
      picks: [],
      teamPickCounts: {}
    };

  }

  var picks = [];

  var teamPickCounts = {};


  /*
   * -------------------------------------------------------
   * PICKS BETWEEN OUR CURRENT PICK AND NEXT PICK
   * -------------------------------------------------------
   */

  for (
    var pick = currentPick + 1;
    pick < nextPick;
    pick++
  ) {

    var mapping =
      getSnakeDraftTeamForPick(
        pick,
        teams
      );

    if (!mapping) {
      continue;
    }

    picks.push(mapping);

    var teamSlot =
      mapping.teamSlot;

    teamPickCounts[teamSlot] =
      (teamPickCounts[teamSlot] || 0) + 1;

  }


  return {
    picks:
      picks,

    teamPickCounts:
      teamPickCounts
  };
}

function calculateOpponentRosterNeeds(
  roster
) {

  roster =
    roster || {};

  var qbSlots =
    Number(ROSTER_SLOTS.QB) || 1;

  var rbSlots =
    Number(ROSTER_SLOTS.RB) || 2;

  var wrSlots =
    Number(ROSTER_SLOTS.WR) || 2;

  var teSlots =
    Number(ROSTER_SLOTS.TE) || 1;


  return {

    QB:
      Math.max(
        0,
        qbSlots -
        (Number(roster.QB) || 0)
      ),

    RB:
      Math.max(
        0,
        rbSlots -
        (Number(roster.RB) || 0)
      ),

    WR:
      Math.max(
        0,
        wrSlots -
        (Number(roster.WR) || 0)
      ),

    TE:
      Math.max(
        0,
        teSlots -
        (Number(roster.TE) || 0)
      )

  };
}

function calculateOpponentPositionDemand(
  roster,
  position
) {

  roster =
    roster || {};

  position =
    position || null;

  if (
    !position ||
    !['QB', 'RB', 'WR', 'TE'].includes(position)
  ) {
    return 0;
  }


  var qbSlots =
    Number(ROSTER_SLOTS.QB) || 1;

  var rbSlots =
    Number(ROSTER_SLOTS.RB) || 2;

  var wrSlots =
    Number(ROSTER_SLOTS.WR) || 2;

  var teSlots =
    Number(ROSTER_SLOTS.TE) || 1;

  var flexSlots =
    Number(ROSTER_SLOTS.FLEX) || 1;


  var counts = {
    QB:
      Number(roster.QB) || 0,

    RB:
      Number(roster.RB) || 0,

    WR:
      Number(roster.WR) || 0,

    TE:
      Number(roster.TE) || 0
  };


  /*
 * -------------------------------------------------------
 * QB
 * -------------------------------------------------------
 *
 * In a 1-QB league, an empty QB starter is a real need,
 * but it should not create the same draft pressure as
 * multiple open RB/WR starter spots.
 */

if (position === 'QB') {

  if (counts.QB < qbSlots) {
    return 1.5;
  }

  /*
   * Once the starting QB is filled, backup-QB demand
   * should be very low.
   */

  if (counts.QB === qbSlots) {
    return 0.25;
  }

  return 0;
}


  /*
   * -------------------------------------------------------
   * DEDICATED STARTER NEED
   * -------------------------------------------------------
   */

  var requiredSlots = {
    RB: rbSlots,
    WR: wrSlots,
    TE: teSlots
  };

  if (
    counts[position] <
    requiredSlots[position]
  ) {

    var missing =
      requiredSlots[position] -
      counts[position];

    /*
     * Missing multiple dedicated starters
     * = strongest demand.
     */

    if (position === 'TE') {

  if (missing >= 1) {
    return 1.5;
  }

}

if (missing >= 2) {
  return 3;
}

return 2;
  }


  /*
   * -------------------------------------------------------
   * FLEX / DEPTH DEMAND
   * -------------------------------------------------------
   *
   * Once dedicated starters are filled, RB/WR/TE
   * can still be attractive for FLEX.
   */

  var dedicatedRB =
    Math.min(
      counts.RB,
      rbSlots
    );

  var dedicatedWR =
    Math.min(
      counts.WR,
      wrSlots
    );

  var dedicatedTE =
    Math.min(
      counts.TE,
      teSlots
    );

  var dedicatedEligible =
    dedicatedRB +
    dedicatedWR +
    dedicatedTE;

  var totalEligible =
    counts.RB +
    counts.WR +
    counts.TE;

  var flexFilled =
    Math.max(
      0,
      totalEligible -
      dedicatedEligible
    );

  var flexNeed =
    Math.max(
      0,
      flexSlots -
      flexFilled
    );


  if (flexNeed > 0) {

    /*
     * RB and WR should get stronger FLEX demand
     * than TE because they are usually deeper
     * and more commonly used in FLEX.
     */

    if (
      position === 'RB' ||
      position === 'WR'
    ) {
      return 1;
    }

    if (position === 'TE') {
      return 0.5;
    }

  }


  /*
   * -------------------------------------------------------
   * BENCH / DEPTH DEMAND
   * -------------------------------------------------------
   *
   * Keep this low. This is only a soft threat.
   */

  if (
    position === 'RB' ||
    position === 'WR'
  ) {

    if (
      counts[position] <=
      requiredSlots[position] + 1
    ) {
      return 0.5;
    }

  }


  return 0;
}

function getDraftedRosterByTeam(
  teams
) {

  teams =
    Number(teams) || 10;

  var rosters = {};

  for (
    var team = 1;
    team <= teams;
    team++
  ) {

    rosters[team] = {
      QB: 0,
      RB: 0,
      WR: 0,
      TE: 0,
      K: 0,
      DST: 0
    };

  }


  /*
   * Look at every drafted player row.
   *
   * We need each row's draft pick number so we can
   * determine which team owned that selection.
   */

  document
    .querySelectorAll(
      'tr.draftrow.drafted-other, ' +
      'tr.draftrow.drafted-mine'
    )
    .forEach(function(row) {

      var position =
        row.getAttribute(
          'data-pos'
        );

      if (
        !position ||
        rosters[1][position] === undefined
      ) {
        return;
      }


      /*
       * Try to recover the draft pick from the row.
       *
       * We'll support a few likely attributes so the
       * helper is resilient to your existing markup.
       */

      var pick =
        Number(
          row.getAttribute('data-pick') ||
          row.getAttribute('data-draft-pick') ||
          row.dataset.pick ||
          row.dataset.draftPick
        ) || 0;


      /*
       * If the row doesn't store its actual draft pick,
       * skip it for now.
       */

      if (!pick) {
        return;
      }


      var recordedTeamSlot = Number(row.getAttribute('data-team-slot')) || 0;
      var mapping = recordedTeamSlot
        ? {teamSlot: recordedTeamSlot}
        : getSnakeDraftTeamForPick(
            pick,
            teams
          );

      if (
        !mapping ||
        !mapping.teamSlot ||
        !rosters[mapping.teamSlot]
      ) {
        return;
      }


      rosters[
        mapping.teamSlot
      ][position]++;

    });


  return rosters;
}

function getOpponentNeedsByTeam(
  teams
) {

  teams =
    Number(teams) || 10;

  var rosters =
    getDraftedRosterByTeam(
      teams
    );

  var needs = {};

  Object.keys(rosters)
    .forEach(function(teamSlot) {

      needs[teamSlot] =
        calculateOpponentRosterNeeds(
          rosters[teamSlot]
        );

    });

  return {
    rosters:
      rosters,

    needs:
      needs
  };
}

function calculateOpponentDraftThreat(
  player,
  context
) {

  if (!player) {
    return 0;
  }

  context =
    context || {};

  var position =
    player.position ||
    player.pos ||
    null;

  if (
    !position ||
    !['QB', 'RB', 'WR', 'TE'].includes(position)
  ) {
    return 0;
  }

  var teams =
    Number(context.teams) || 10;

  var currentPick =
    Number(context.currentPick) || 0;

  var nextPick =
    Number(
      context.calculatedNextPick ||
      context.nextPick
    ) || 0;

  if (
    currentPick <= 0 ||
    nextPick <= currentPick
  ) {
    return 0;
  }

  /*
 * -------------------------------------------------------
 * OPPONENT THREAT CACHE
 * -------------------------------------------------------
 *
 * Threat is identical for players at the same position
 * when the draft window is identical.
 */

if (!context.opponentThreatCache) {

  context.opponentThreatCache =
    {};

}


var threatCacheKey =
  [
    teams,
    currentPick,
    nextPick,
    position
  ].join('|');


if (
  context.opponentThreatCache[
    threatCacheKey
  ] !== undefined
) {

  return context.opponentThreatCache[
    threatCacheKey
  ];

}


  var window =
    getTeamsPickingBeforeMyNextTurn(
      currentPick,
      nextPick,
      teams
    );

  var opponentData =
    getOpponentNeedsByTeam(
      teams
    );


  var threatPoints = 0;
  var maxThreatPoints = 0;


  Object.keys(
    window.teamPickCounts
  ).forEach(function(teamSlot) {

    var pickCount =
      Number(
        window.teamPickCounts[teamSlot]
      ) || 0;

    var needs =
      opponentData.needs[teamSlot];

    if (!needs) {
      return;
    }

var roster =
  opponentData.rosters[teamSlot] || {};

var positionDemand =
  calculateOpponentPositionDemand(
    roster,
    position
  );


    /*
     * Each opportunity that opponent has to draft
     * before our next turn adds exposure.
     */

    maxThreatPoints +=
      pickCount * 3;


    /*
     * Dedicated need:
     *
     * Need 2 = strong threat
     * Need 1 = moderate threat
     * Need 0 = low direct threat
     */

threatPoints +=
  pickCount *
  positionDemand;

  });


  if (maxThreatPoints <= 0) {
    return 0;
  }


  /*
   * Convert to 0–100.
   */

  var threatScore =
    (
      threatPoints /
      maxThreatPoints
    ) * 100;


  threatScore =
    Math.max(
      0,
      Math.min(
        100,
        threatScore
      )
    );


var roundedThreatScore =
  Math.round(
    threatScore
  );


context.opponentThreatCache[
  threatCacheKey
] =
  roundedThreatScore;


return roundedThreatScore;
}

function getOpponentDraftThreatDetails(
  player,
  context
) {

  if (!player) {
    return {
      position: null,
      overallThreat: 0,
      teams: []
    };
  }

  context =
    context || {};

  var position =
    player.position ||
    player.pos ||
    null;

  var teams =
    Number(context.teams) || 10;

  var currentPick =
    Number(context.currentPick) || 0;

  var nextPick =
    Number(
      context.calculatedNextPick ||
      context.nextPick
    ) || 0;


  if (
    !position ||
    currentPick <= 0 ||
    nextPick <= currentPick
  ) {

    return {
      position: position,
      overallThreat: 0,
      teams: []
    };
  }


  var window =
    getTeamsPickingBeforeMyNextTurn(
      currentPick,
      nextPick,
      teams
    );

  var opponentData =
    getOpponentNeedsByTeam(
      teams
    );

  var rows = [];


  Object.keys(
    window.teamPickCounts
  ).forEach(function(teamSlot) {

    var roster =
      opponentData.rosters[teamSlot] || {};

    var pickCount =
      Number(
        window.teamPickCounts[teamSlot]
      ) || 0;

    var demand =
      calculateOpponentPositionDemand(
        roster,
        position
      );

    var threatContribution =
      pickCount * demand;


    rows.push({
      teamSlot:
        Number(teamSlot),

      picksBeforeNextTurn:
        pickCount,

      QB:
        Number(roster.QB) || 0,

      RB:
        Number(roster.RB) || 0,

      WR:
        Number(roster.WR) || 0,

      TE:
        Number(roster.TE) || 0,

      position:
        position,

      demand:
        demand,

      threatContribution:
        threatContribution
    });

  });


  rows.sort(function(a, b) {

    return (
      Number(b.threatContribution) -
      Number(a.threatContribution)
    );

  });


  var overallThreat =
    calculateOpponentDraftThreat(
      player,
      context
    );


  return {
    player:
      player.name || null,

    position:
      position,

    currentPick:
      currentPick,

    nextPick:
      nextPick,

    picksBetween:
      window.picks.length,

    overallThreat:
      overallThreat,

    teams:
      rows
  };
}

function summarizeOpponentDraftThreat(
  player,
  context
) {

  var details =
    getOpponentDraftThreatDetails(
      player,
      context
    );


  if (
    !details ||
    !Array.isArray(details.teams)
  ) {

    return {
      position: null,
      overallThreat: 0,
      threateningTeams: 0,
      strongThreatTeams: 0,
      picksAtRisk: 0,
      label: 'LOW',
      summary: ''
    };

  }


/*
 * -------------------------------------------------------
 * MEANINGFUL OPPONENT DEMAND
 * -------------------------------------------------------
 *
 * Very small demand values represent soft bench/depth
 * interest and should not be described as a team that
 * is likely to take the position.
 */

var threateningTeams =
  details.teams.filter(function(team) {

    return (
      Number(team.demand) >= 1
    );

  });


var strongThreatTeams =
  details.teams.filter(function(team) {

    return (
      Number(team.demand) >= 2
    );

  });


var softThreatTeams =
  details.teams.filter(function(team) {

    var demand =
      Number(team.demand) || 0;

    return (
      demand > 0 &&
      demand < 1
    );

  });


  var picksAtRisk =
    threateningTeams.reduce(
      function(total, team) {

        return (
          total +
          (
            Number(
              team.picksBeforeNextTurn
            ) || 0
          )
        );

      },
      0
    );


  var overallThreat =
    Number(
      details.overallThreat
    ) || 0;


  var label =
    overallThreat >= 65
      ? 'HIGH'
      : overallThreat >= 35
        ? 'MODERATE'
        : 'LOW';


  var position =
    details.position ||
    null;


  var summary = '';


  if (position) {

    if (label === 'HIGH') {

      summary =
  threateningTeams.length +
  ' teams picking before your next turn have meaningful ' +
  position +
  ' demand. Waiting is risky.';

    } else if (label === 'MODERATE') {

      summary =
  threateningTeams.length +
  ' teams picking before your next turn have meaningful ' +
  position +
  ' demand. Waiting is risky.';

    } else {

      summary =
        'Most teams before your next pick show limited ' +
        position +
        ' demand.';

    }

  }


  return {

    player:
      details.player || null,

    position:
      position,

    currentPick:
      details.currentPick || 0,

    nextPick:
      details.nextPick || 0,

    picksBetween:
      details.picksBetween || 0,

    overallThreat:
      overallThreat,

    threateningTeams:
      threateningTeams.length,

    softThreatTeams:
  softThreatTeams.length,

    strongThreatTeams:
      strongThreatTeams.length,

    picksAtRisk:
      picksAtRisk,

    label:
      label,

    summary:
      summary,

    teams:
      details.teams

  };

}

function debugOpponentDraftThreat(
  playerName,
  context
) {

  var players =
    getDraftAssistantPlayers();

  var player =
    players.find(function(candidate) {

      return candidate &&
        candidate.name &&
        candidate.name.toLowerCase() ===
          String(playerName).toLowerCase();

    });


  if (!player) {

    console.warn(
      'OPPONENT THREAT DEBUG: Player not found:',
      playerName
    );

    return null;

  }


  if (!context) {

    var state =
      buildLiveDraftDebugState();

    context =
      state.context;

  }


  var details =
    getOpponentDraftThreatDetails(
      player,
      context
    );


  console.group(
    'OPPONENT DRAFT THREAT — ' +
    player.name
  );


  console.log(
    'Window:',
    {
      currentPick:
        details.currentPick,

      nextPick:
        details.nextPick,

      picksBetween:
        details.picksBetween,

      position:
        details.position,

      overallThreat:
        details.overallThreat
    }
  );


  console.table(
    details.teams
  );


  console.groupEnd();


  return details;
}

function debugOpponentThreatAtPick(
  playerName,
  pick
) {

  pick =
    Number(pick) || 0;

  if (!playerName || pick <= 0) {

    console.warn(
      'OPPONENT THREAT AT PICK: Invalid player or pick.'
    );

    return null;
  }


  var originalGetDraftAssistantState =
    getDraftAssistantState;

  var realState =
    originalGetDraftAssistantState();

  var teams =
    Number(realState.teams) || 10;


  /*
   * Temporarily simulate the requested current pick.
   */

  getDraftAssistantState =
    function() {

      var simulatedState =
        Object.assign(
          {},
          realState
        );

      simulatedState.currentPick =
        pick;

      simulatedState.myNextPick =
        pick;

      simulatedState.onClock =
        true;

      simulatedState.picksUntilMyTurn =
        0;

      return simulatedState;

    };


  var result = null;


  try {

    result =
      draftEngineWithSimulatedPriorPicks(
        pick,
        function() {

          var state =
            buildLiveDraftDebugState();

          var player =
            state.players.find(function(candidate) {

              return candidate &&
                candidate.name &&
                candidate.name.toLowerCase() ===
                  String(playerName).toLowerCase();

            });


          if (!player) {

            console.warn(
              'OPPONENT THREAT AT PICK: Player not found:',
              playerName
            );

            return null;
          }


          var details =
            getOpponentDraftThreatDetails(
              player,
              state.context
            );


          console.group(
            'OPPONENT THREAT AT PICK ' +
            pick +
            ' — ' +
            player.name
          );


          console.log(
            'Window:',
            {
              currentPick:
                details.currentPick,

              nextPick:
                details.nextPick,

              picksBetween:
                details.picksBetween,

              position:
                details.position,

              overallThreat:
                details.overallThreat
            }
          );


          console.table(
            details.teams
          );


          console.groupEnd();


          return {
            state:
              state,

            player:
              player,

            details:
              details
          };

        }
      );

  } finally {

    getDraftAssistantState =
      originalGetDraftAssistantState;

  }


  return result;
}

function debugTurnDecisionScenario(
  teams,
  draftSlot,
  firstPick
) {

  teams =
    Number(teams) || 12;

  draftSlot =
    Number(draftSlot) || 1;

  firstPick =
    Number(firstPick) || 1;


  var myPicks =
    getMyRemainingDraftPicks(
      firstPick,
      teams,
      16,
      draftSlot
    );


  if (
    !myPicks ||
    myPicks.length < 2
  ) {

    console.warn(
      'TURN DEBUG: Could not find two picks.'
    );

    return null;

  }


  var pickA =
    myPicks[0];

  var pickB =
    myPicks[1];


  /*
   * -------------------------------------------------------
   * BUILD ONE SIMULATED PICK STATE
   * -------------------------------------------------------
   */

  function buildPickResult(
    pick,
    selectedBeforeThisPick
  ) {

    return draftEngineWithSimulatedPriorPicks(
      pick,
      function() {

        var selectedRow = null;
        var originalClass = null;


        if (
          selectedBeforeThisPick &&
          selectedBeforeThisPick.name
        ) {

          selectedRow =
            Array.prototype.slice.call(
              document.querySelectorAll(
                'tr.draftrow'
              )
            )
            .find(function(row) {

              return (
                row.getAttribute(
                  'data-name'
                ) ===
                selectedBeforeThisPick.name
              );

            });


          if (selectedRow) {

            originalClass =
              selectedRow.className;

            selectedRow.classList.remove(
              'drafted-other'
            );

            selectedRow.classList.add(
              'drafted-mine'
            );

            selectedRow.setAttribute(
              'data-pick',
              selectedBeforeThisPick.pick
            );

            selectedRow.setAttribute(
              'data-team-slot',
              draftSlot
            );

          }

        }


        var originalStateGetter =
          getDraftAssistantState;

        var baseState =
          originalStateGetter();


        getDraftAssistantState =
          function() {

            return Object.assign(
              {},
              baseState,
              {
                teams:
                  teams,

                draftSlot:
                  draftSlot,

                currentPick:
                  pick,

                rounds:
                  16
              }
            );

          };


        try {

          var state =
            buildLiveDraftDebugState();


          if (
            !state ||
            !state.scored ||
            !state.scored.length
          ) {

            return null;

          }


var primary =
  state.scored[0];

recommendation =
  attachLiveTurnPackage(
    recommendation,
    state.context
  );


          var nextPickInfo =
            calculateMyNextDraftPick(
              pick,
              teams
            );


          return {

            pick:
              pick,

            primary:
              primary,

            recommendation:
              recommendation,

            nextPick:
              nextPickInfo
                ? nextPickInfo.nextPick
                : null,

            picksBetween:
              nextPickInfo
                ? nextPickInfo.picksBetween
                : null

          };


        } finally {

          getDraftAssistantState =
            originalStateGetter;


          if (
            selectedRow &&
            originalClass !== null
          ) {

            selectedRow.className =
              originalClass;

          }

        }

      }
    );
  }


  /*
   * -------------------------------------------------------
   * FIRST PICK
   * -------------------------------------------------------
   */

  var first =
    buildPickResult(
      pickA,
      null
    );


  if (!first) {

    console.warn(
      'TURN DEBUG: Could not build first pick.'
    );

    return null;

  }


  /*
   * -------------------------------------------------------
   * SECOND PICK
   * -------------------------------------------------------
   */

  var second =
    buildPickResult(
      pickB,
      {
        name:
          first.primary.name,

        pick:
          pickA
      }
    );


  if (!second) {

    console.warn(
      'TURN DEBUG: Could not build second pick.'
    );

    return null;

  }


  /*
   * -------------------------------------------------------
   * OUTPUT
   * -------------------------------------------------------
   */

  var output = [
    {
      stage:
        'FIRST PICK',

      pick:
        first.pick,

      primary:
        first.primary.name,

      position:
        first.primary.position,

      score:
        Number(
          first.primary.finalScore
        ).toFixed(1),

      nextPick:
        first.nextPick,

      picksBetween:
        first.picksBetween,

      recommendation:
        first.recommendation
          ? first.recommendation.recommendation
          : null,

      confidence:
        first.recommendation
          ? first.recommendation.confidence
          : null
    },

    {
      stage:
        'SECOND PICK',

      pick:
        second.pick,

      primary:
        second.primary.name,

      position:
        second.primary.position,

      score:
        Number(
          second.primary.finalScore
        ).toFixed(1),

      nextPick:
        second.nextPick,

      picksBetween:
        second.picksBetween,

      recommendation:
        second.recommendation
          ? second.recommendation.recommendation
          : null,

      confidence:
        second.recommendation
          ? second.recommendation.confidence
          : null
    }
  ];


  console.group(
    'TURN DECISION DEBUG — ' +
    teams +
    ' TEAM — SLOT ' +
    draftSlot
  );


  console.table(
    output
  );


  console.log(
    'RAW FIRST:',
    first
  );

  console.log(
    'RAW SECOND:',
    second
  );


  console.groupEnd();


  return {
    teams:
      teams,

    draftSlot:
      draftSlot,

    firstPick:
      first,

    secondPick:
      second,

    table:
      output
  };
}

function debugTurnSequencingAdvice(
  teams,
  draftSlot,
  currentPick
) {

  teams =
    Number(teams) || 12;

  draftSlot =
    Number(draftSlot) || 1;

  currentPick =
    Number(currentPick) || 1;


  return draftEngineWithSimulatedPriorPicks(
    currentPick,
    function() {

      /*
       * -------------------------------------------------------
       * TEMPORARILY EXPOSE CORRECT DRAFT STATE
       * -------------------------------------------------------
       */

      var originalStateGetter =
        getDraftAssistantState;

      var baseState =
        originalStateGetter();


      getDraftAssistantState =
        function() {

          return Object.assign(
            {},
            baseState,
            {
              teams:
                teams,

              draftSlot:
                draftSlot,

              currentPick:
                currentPick,

              rounds:
                16
            }
          );

        };


      try {

        var state =
          buildLiveDraftDebugState();


        if (
          !state ||
          !state.scored ||
          !state.scored.length
        ) {

          console.warn(
            'TURN SEQUENCING: No scored players.'
          );

          return null;

        }


        var primary =
          state.scored[0];


        var recommendation =
          calculateDraftRecommendation(
            primary,
            state.scored,
            state.context
          );

        var nextPickInfo =
          calculateMyNextDraftPick(
            currentPick,
            teams
          );


        var nextPick =
          nextPickInfo
            ? Number(nextPickInfo.nextPick)
            : 0;


        /*
         * -------------------------------------------------------
         * TOP CURRENT OPTIONS
         * -------------------------------------------------------
         */

        var topCandidates =
          state.scored
            .slice(0, 10)
            .map(function(player) {

              var survival =
                nextPick
                  ? calculateNextPickSurvival(
                      player,
                      Object.assign(
                        {},
                        state.context,
                        {
                          calculatedNextPick:
                            nextPick,

                          nextPick:
                            nextPick
                        }
                      )
                    )
                  : 0;


              return {

                name:
                  player.name,

                position:
                  player.position,

                rank:
                  player.rank,

                score:
                  Number(
                    player.finalScore
                  ) || 0,

                survival:
                  Number(
                    survival
                  ) || 0,

                player:
                  player

              };

            });


        /*
         * -------------------------------------------------------
         * SAFE-TO-WAIT PLAYER
         * -------------------------------------------------------
         *
         * Start with the engine's primary recommendation.
         */

        var waitTarget =
          topCandidates[0];


        /*
         * -------------------------------------------------------
         * WHO SHOULD WE TAKE FIRST?
         * -------------------------------------------------------
         *
         * If the primary is likely to survive to the immediate
         * next pick, look for a strong alternative that is LESS
         * likely to survive.
         */

        var takeNowOptions =
          topCandidates
            .filter(function(candidate) {

              if (
                !candidate ||
                candidate.name ===
                  waitTarget.name
              ) {

                return false;

              }


              /*
               * Candidate should be reasonably close
               * in current value.
               */

              var scoreGap =
                waitTarget.score -
                candidate.score;


              return (
                scoreGap <= 8 &&
                candidate.survival <
                  waitTarget.survival
              );

            })
            .sort(function(a, b) {

              /*
               * Prefer players with strong current score
               * AND high danger of disappearing.
               */

              var aUrgency =
                a.score +
                (
                  (100 - a.survival) *
                  0.15
                );


              var bUrgency =
                b.score +
                (
                  (100 - b.survival) *
                  0.15
                );


              return (
                bUrgency -
                aUrgency
              );

            });


        var draftNow =
          takeNowOptions.length
            ? takeNowOptions[0]
            : waitTarget;


        /*
         * -------------------------------------------------------
         * OUTPUT
         * -------------------------------------------------------
         */

        console.group(
          'TURN SEQUENCING ADVICE — ' +
          teams +
          ' TEAM — SLOT ' +
          draftSlot +
          ' — PICK ' +
          currentPick
        );


        console.log(
          'Window:',
          {
            currentPick:
              currentPick,

            nextPick:
              nextPick,

            picksBetween:
              nextPickInfo
                ? nextPickInfo.picksBetween
                : null
          }
        );


        console.table(
          topCandidates.map(function(candidate) {

            return {

              name:
                candidate.name,

              position:
                candidate.position,

              rank:
                candidate.rank,

              score:
                candidate.score.toFixed(1),

              survival:
                candidate.survival.toFixed(1),

              scoreGap:
                (
                  waitTarget.score -
                  candidate.score
                ).toFixed(1)

            };

          })
        );


        console.log(
          'PRIMARY:',
          waitTarget.name
        );


        console.log(
          'ENGINE RECOMMENDATION:',
          recommendation
            ? recommendation.recommendation
            : null
        );


        console.log(
          'DRAFT NOW:',
          draftNow.name
        );


        console.log(
          'THEN TARGET:',
          draftNow.name !==
            waitTarget.name
              ? waitTarget.name
              : null
        );


        console.groupEnd();


        return {

          currentPick:
            currentPick,

          nextPick:
            nextPick,

          picksBetween:
            nextPickInfo
              ? nextPickInfo.picksBetween
              : null,

          primary:
            waitTarget,

          recommendation:
            recommendation,

          draftNow:
            draftNow,

          thenTarget:
            draftNow.name !==
              waitTarget.name
                ? waitTarget
                : null,

          candidates:
            topCandidates

        };


      } finally {

        getDraftAssistantState =
          originalStateGetter;

      }

    }
  );
}

function calculateTurnPackage(
  teams,
  draftSlot,
  currentPick,
  options
) {

  options =
    options || {};

  teams =
    Number(teams) || 12;

  draftSlot =
    Number(draftSlot) || 1;

  currentPick =
    Number(currentPick) || 1;


  /*
   * -------------------------------------------------------
   * 1. VERIFY THIS IS ACTUALLY A BACK-TO-BACK TURN
   * -------------------------------------------------------
   */

  var nextPickInfo =
    calculateMyNextDraftPick(
      currentPick,
      teams
    );


  if (
    !nextPickInfo ||
    Number(nextPickInfo.picksBetween) !== 0
  ) {

    console.warn(
      'TURN PACKAGE: Current pick is not part of a back-to-back turn.',
      {
        currentPick:
          currentPick,

        nextPick:
          nextPickInfo
            ? nextPickInfo.nextPick
            : null,

        picksBetween:
          nextPickInfo
            ? nextPickInfo.picksBetween
            : null
      }
    );

    return null;
  }


  var secondPick =
    Number(
      nextPickInfo.nextPick
    ) || 0;


  /*
   * -------------------------------------------------------
   * 2. BUILD FIRST-PICK STATE
   * -------------------------------------------------------
   */

  return draftEngineWithSimulatedPriorPicks(
    currentPick,
    function() {

      var originalStateGetter =
        getDraftAssistantState;

      var baseState =
        originalStateGetter();


      getDraftAssistantState =
        function() {

          return Object.assign(
            {},
            baseState,
            {
              teams:
                teams,

              draftSlot:
                draftSlot,

              currentPick:
                currentPick,

              rounds:
                16
            }
          );

        };


      try {

        var firstState =
          buildLiveDraftDebugState();


        if (
          !firstState ||
          !firstState.scored ||
          !firstState.scored.length
        ) {

          console.warn(
            'TURN PACKAGE: Could not build first-pick state.'
          );

          return null;
        }


        /*
         * -------------------------------------------------------
         * 3. ONLY TEST THE TOP FIRST-PICK CANDIDATES
         * -------------------------------------------------------
         *
         * We do not need to simulate the entire player pool.
         * The top 8 is enough for package comparison and keeps
         * this debug tool reasonably fast.
         */

        var firstCandidates =
          firstState.scored
            .slice(0, 8);


        var packages =
          [];


        /*
         * -------------------------------------------------------
         * 4. SIMULATE EACH POSSIBLE FIRST PLAYER
         * -------------------------------------------------------
         */

        firstCandidates.forEach(function(firstPlayer) {

          if (
            !firstPlayer ||
            !firstPlayer.name
          ) {

            return;
          }


          var selectedRow =
            firstPlayer.row || null;

          var originalClass =
            selectedRow
              ? selectedRow.className
              : null;

          var originalPick =
            selectedRow
              ? selectedRow.getAttribute(
                  'data-pick'
                )
              : null;

          var originalTeamSlot =
            selectedRow
              ? selectedRow.getAttribute(
                  'data-team-slot'
                )
              : null;


          /*
           * Temporarily mark first player as OUR pick.
           */

          if (selectedRow) {

            selectedRow.classList.remove(
              'drafted-other'
            );

            selectedRow.classList.add(
              'drafted-mine'
            );

            selectedRow.setAttribute(
              'data-pick',
              currentPick
            );

            selectedRow.setAttribute(
              'data-team-slot',
              draftSlot
            );

          }


          try {

            /*
             * ---------------------------------------------------
             * 5. BUILD SECOND-PICK STATE AFTER PLAYER A
             * ---------------------------------------------------
             */

            getDraftAssistantState =
              function() {

                return Object.assign(
                  {},
                  baseState,
                  {
                    teams:
                      teams,

                    draftSlot:
                      draftSlot,

                    currentPick:
                      secondPick,

                    rounds:
                      16
                  }
                );

              };


            var secondState =
              buildLiveDraftDebugState();


            if (
              !secondState ||
              !secondState.scored ||
              !secondState.scored.length
            ) {

              return;
            }


            /*
 * ---------------------------------------------------
 * 6. FIND TOP SECOND-PICK CANDIDATES
 * ---------------------------------------------------
 *
 * Evaluate several possible second selections instead
 * of assuming the highest-scoring player is always the
 * best turn partner.
 */

var secondCandidates =
  secondState.scored
    .filter(function(candidate) {

      return (
        candidate &&
        candidate.name &&
        candidate.name !==
          firstPlayer.name
      );

    })
    .slice(0, 4);


if (!secondCandidates.length) {

  return;

}


/*
 * ---------------------------------------------------
 * 7. BUILD EACH TWO-PLAYER PACKAGE
 * ---------------------------------------------------
 */

secondCandidates.forEach(function(secondPlayer) {

  var firstScore =
    Number(
      firstPlayer.finalScore
    ) || 0;


  var secondScore =
    Number(
      secondPlayer.finalScore
    ) || 0;


  /*
   * Small diversity bonus.
   *
   * Keep this intentionally small because roster
   * construction is already represented in the
   * second player's rescored finalScore.
   */

  var positionDiversityBonus =
    (
      firstPlayer.position !==
      secondPlayer.position
    )
      ? 1.5
      : 0;


  /*
   * Small structural bonus for premium singleton
   * positions. Again, keep this tiny to avoid
   * double-counting positional value.
   */

  var structuralBonus =
    0;


  if (
    firstPlayer.position === 'QB' ||
    secondPlayer.position === 'QB'
  ) {

    structuralBonus +=
      0.5;

  }


  if (
    firstPlayer.position === 'TE' ||
    secondPlayer.position === 'TE'
  ) {

    structuralBonus +=
      0.5;

  }


  /*
   * -------------------------------------------------
   * PACKAGE SCORE
   * -------------------------------------------------
   */

  var packageScore =
    firstScore +
    secondScore +
    positionDiversityBonus +
    structuralBonus;


  packages.push({

    firstPlayer:
      firstPlayer,

    secondPlayer:
      secondPlayer,

    firstName:
      firstPlayer.name,

    firstPosition:
      firstPlayer.position,

    firstScore:
      firstScore,

    secondName:
      secondPlayer.name,

    secondPosition:
      secondPlayer.position,

    secondScore:
      secondScore,

    positionDiversityBonus:
      positionDiversityBonus,

    structuralBonus:
      structuralBonus,

    packageScore:
      packageScore

  });

});


          } finally {

            /*
             * ---------------------------------------------------
             * RESTORE PLAYER ROW
             * ---------------------------------------------------
             */

            if (selectedRow) {

              selectedRow.className =
                originalClass;


              if (originalPick !== null) {

                selectedRow.setAttribute(
                  'data-pick',
                  originalPick
                );

              } else {

                selectedRow.removeAttribute(
                  'data-pick'
                );

              }


              if (
                originalTeamSlot !== null
              ) {

                selectedRow.setAttribute(
                  'data-team-slot',
                  originalTeamSlot
                );

              } else {

                selectedRow.removeAttribute(
                  'data-team-slot'
                );

              }

            }

          }

        });


        /*
         * -------------------------------------------------------
         * 9. SORT PACKAGES
         * -------------------------------------------------------
         */

        packages.sort(function(a, b) {

          return (
            Number(b.packageScore) -
            Number(a.packageScore)
          );

        });


        var bestPackage =
          packages.length
            ? packages[0]
            : null;

        var secondBestPackage =
  packages.length > 1
    ? packages[1]
    : null;


var packageAdvantage =
  (
    bestPackage &&
    secondBestPackage
  )
    ? (
        Number(bestPackage.packageScore) -
        Number(secondBestPackage.packageScore)
      )
    : 0;


var packageConfidence =
  'LOW';


if (packageAdvantage >= 6) {

  packageConfidence =
    'VERY HIGH';

} else if (packageAdvantage >= 4) {

  packageConfidence =
    'HIGH';

} else if (packageAdvantage >= 2) {

  packageConfidence =
    'MODERATE';

}


        /*
         * -------------------------------------------------------
         * 10. DEBUG OUTPUT
         * -------------------------------------------------------
         */
      if (!options.silent) {
        console.group(
          'TURN PACKAGE DEBUG — ' +
          teams +
          ' TEAM — SLOT ' +
          draftSlot +
          ' — PICKS ' +
          currentPick +
          '/' +
          secondPick
        );


        console.table(
          packages
            .slice(0, 10)
            .map(function(pkg) {

              return {

                pick1:
                  pkg.firstName,

                pos1:
                  pkg.firstPosition,

                score1:
                  pkg.firstScore.toFixed(1),

                pick2:
                  pkg.secondName,

                pos2:
                  pkg.secondPosition,

                score2:
                  pkg.secondScore.toFixed(1),

                diversity:
                  pkg.positionDiversityBonus.toFixed(1),

                structural:
                  pkg.structuralBonus.toFixed(1),

                packageScore:
                  pkg.packageScore.toFixed(1)

              };

            })
        );


if (bestPackage) {

  console.log(
    'BEST TURN PACKAGE:',
    {
      pick1:
        bestPackage.firstName,

      pick1Position:
        bestPackage.firstPosition,

      pick2:
        bestPackage.secondName,

      pick2Position:
        bestPackage.secondPosition,

      packageScore:
        Number(
          bestPackage.packageScore
        ).toFixed(1),

      packageAdvantage:
        Number(
          packageAdvantage
        ).toFixed(1),

      confidence:
        packageConfidence
    }
  );

}

console.groupEnd();

} // closes if (!options.silent)


return {

  teams:
    teams,

  draftSlot:
    draftSlot,

  firstPick:
    currentPick,

  secondPick:
    secondPick,

  bestPackage:
    bestPackage,

  secondBestPackage:
    secondBestPackage,

  packageAdvantage:
    packageAdvantage,

  packageConfidence:
    packageConfidence,

  packages:
    packages

};


} finally {

  getDraftAssistantState =
    originalStateGetter;

}

    }
  );
}

function attachLiveTurnPackage(
  recommendation,
  context
) {

  if (
    !recommendation ||
    !context
  ) {

    return recommendation;

  }


  var teams =
    Number(
      context.teams
    ) || 10;


  var draftSlot =
    Number(
      context.draftSlot
    ) || 1;


  var currentPick =
    Number(
      context.currentPick
    ) || 0;


  if (currentPick <= 0) {

    return recommendation;

  }


  /*
   * -------------------------------------------------------
   * CHECK WHETHER THIS IS A TRUE BACK-TO-BACK TURN
   * -------------------------------------------------------
   */

  var nextPickInfo =
    calculateMyNextDraftPick(
      currentPick,
      teams
    );


  if (
    !nextPickInfo ||
    Number(
      nextPickInfo.picksBetween
    ) !== 0
  ) {

    recommendation.turnPackage =
      null;

    recommendation.turnPackageActive =
      false;

    return recommendation;

  }


  /*
   * -------------------------------------------------------
   * BUILD TURN PACKAGE ONCE
   * -------------------------------------------------------
   */

  var turnPackage =
    calculateTurnPackage(
      teams,
      draftSlot,
      currentPick
    );


  if (
    !turnPackage ||
    !turnPackage.bestPackage
  ) {

    recommendation.turnPackage =
      null;

    recommendation.turnPackageActive =
      false;

    return recommendation;

  }


  var best =
    turnPackage.bestPackage;


  /*
   * -------------------------------------------------------
   * EXPOSE TURN INTELLIGENCE
   * -------------------------------------------------------
   */

  recommendation.turnPackageActive =
    true;


  recommendation.turnPackage =
    turnPackage;


  recommendation.turnPick1 =
    best.firstName;


  recommendation.turnPick1Position =
    best.firstPosition;


  recommendation.turnPick2 =
    best.secondName;


  recommendation.turnPick2Position =
    best.secondPosition;


  recommendation.turnPackageScore =
    Number(
      best.packageScore
    ) || 0;


  recommendation.turnPackageAdvantage =
    Number(
      turnPackage.packageAdvantage
    ) || 0;


  recommendation.turnPackageConfidence =
    turnPackage.packageConfidence ||
    'LOW';


  /*
   * The live recommendation should point toward
   * the optimal FIRST player of the turn.
   */

  recommendation.turnRecommendedNow =
    best.firstName;


  recommendation.turnTargetNext =
    best.secondName;


  return recommendation;
}

  /*
   * -------------------------------------------------------
   * BUILD A DEBUG STATE FOR EACH PICK
   * -------------------------------------------------------
   */

function updateRemaining() { safeCall('updateRemainingCustom'); }

// ==== REAL-TIME DRAFT POSITION & PICK COUNTER ====
function getMyPickNumbers() {
  var pcTeams = document.getElementById('pcTeams');
  var pcSlot = document.getElementById('pcSlot');
  var pcRounds = document.getElementById('pcRounds');

  var leagueSize = Math.max(1, parseInt(pcTeams ? pcTeams.value : LEAGUE_SIZE, 10) || 10);
  var mySlot = Math.max(1, parseInt(pcSlot ? pcSlot.value : MY_DRAFT_SLOT, 10) || 10);
  var totalRounds = Math.max(1, parseInt(pcRounds ? pcRounds.value : TOTAL_ROUNDS, 10) || 16);

  if (mySlot > leagueSize) mySlot = leagueSize;

  var myPicks = [];
  for (var round = 1; round <= totalRounds; round++) {
    var pickInRound = (round % 2 !== 0) ? mySlot : (leagueSize - mySlot + 1);
    var overallPick = (round - 1) * leagueSize + pickInRound;
    myPicks.push(overallPick);
  }
  return myPicks;
}

function updatePickCounter() {
  var pcTeams = document.getElementById('pcTeams');
  var pcRounds = document.getElementById('pcRounds');
  var counter = document.getElementById('pick-counter-text');

  if (!counter) return;

  var teams = Math.max(
    2,
    parseInt(pcTeams ? pcTeams.value : LEAGUE_SIZE, 10) || LEAGUE_SIZE
  );

  var rounds = Math.max(
    1,
    parseInt(pcRounds ? pcRounds.value : TOTAL_ROUNDS, 10) || TOTAL_ROUNDS
  );

  var totalPicks = teams * rounds;

  // Every player marked Taken or Mine counts as one completed pick.
  var completedPicks = getCompletedDraftPickCount();
  var completion = getDraftCompletionStatus({totalPicks: totalPicks, rounds: rounds});

  if (completion.authoritative) {
    counter.innerHTML =
      'Draft complete &middot; <b>' + totalPicks + ' picks</b>';
    return;
  }

  if (completion.externalComplete && !completion.authoritative) {
    counter.innerHTML =
      'Draft appears complete &middot; <b>' + completedPicks + ' of ' + totalPicks +
      ' numbered picks synced</b>' +
      (completion.myRosterCount >= rounds ? ' &middot; provisional report ready' : '');
    return;
  }

  var currentPick = Math.min(completedPicks + 1, totalPicks);

  var myPicks = getMyPickNumbers();

  // Find the next pick belonging to you.
  var nextMyPick = null;

  for (var i = 0; i < myPicks.length; i++) {
    if (myPicks[i] >= currentPick) {
      nextMyPick = myPicks[i];
      break;
    }
  }

  if (nextMyPick === currentPick) {
    counter.innerHTML =
      'Pick <b>' + currentPick + '</b> of ' + totalPicks +
      ' &middot; <span style="color:#8fd4a0;font-weight:900;">YOUR PICK!</span>';

  } else if (nextMyPick !== null) {
    var picksUntilNext = nextMyPick - currentPick;

    counter.innerHTML =
      'Pick <b>' + currentPick + '</b> of ' + totalPicks +
      ' &middot; your next pick: <b>#' + nextMyPick + '</b>' +
      ' <span style="color:#a9c2ab;">(' + picksUntilNext +
      ' pick' + (picksUntilNext === 1 ? '' : 's') + ' away)</span>';

  } else {
    counter.innerHTML =
      'Pick <b>' + currentPick + '</b> of ' + totalPicks +
      ' &middot; no more picks';
  }
}

function updateNextPickDisplay() {
  var totalDrafted = getCompletedDraftPickCount();
  var currentOverallPick = totalDrafted + 1;
  var myScheduledPicks = getMyPickNumbers();

  var nextPickOverall = myScheduledPicks.find(function(pick) {
    return pick >= currentOverallPick;
  });

  var nextPickElement = document.getElementById('next-pick-display') || document.getElementById('pick-counter');
  if (nextPickElement) {
    if (nextPickOverall) {
      var picksAway = nextPickOverall - currentOverallPick;
      nextPickElement.innerText = picksAway === 0 
        ? "ON THE CLOCK!" 
        : "Next Pick: #" + nextPickOverall + " (" + picksAway + " pick" + (picksAway > 1 ? "s" : "") + " away)";
    } else {
      nextPickElement.innerText = "Draft Complete";
    }
  }
}

function updateNextPickMarker() {
  var existingMarker = document.getElementById('next-pick-marker');
  if (existingMarker) existingMarker.remove();

  var takenCount = getCompletedDraftPickCount();
  var currentOverallPick = takenCount + 1;
  var myPicks = getMyPickNumbers();

  var nextUserPick = myPicks.find(function(pick) {
    return pick >= currentOverallPick;
  });

  if (!nextUserPick) return;

  var picksAway = nextUserPick - currentOverallPick;
  var rows = Array.from(document.querySelectorAll('tr.draftrow:not(.hidden-row)'));
  var targetRow = null;

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (row.classList.contains('drafted-mine') || row.classList.contains('drafted-other')) continue;
    
    var rk = Number(row.getAttribute('data-rank')) ||
      Number(row.getAttribute('data-board-rank')) || 0;
    
    if (rk >= nextUserPick) {
      targetRow = row;
      break;
    }
  }

  if (!targetRow) {
    targetRow = rows.find(function(r) {
      return !r.classList.contains('drafted-mine') && !r.classList.contains('drafted-other');
    });
  }

  if (!targetRow) return;

  var marker = document.createElement('tr');
  marker.id = 'next-pick-marker';
  
  var td = document.createElement('td');
  td.colSpan = targetRow.children.length || 6;
  
  var label = picksAway === 0 
    ? '🚨 YOUR PICK IS ON THE CLOCK (Pick #' + nextUserPick + ')' 
    : '🎯 ESTIMATED NEXT PICK: Pick #' + nextUserPick + ' (' + picksAway + ' pick' + (picksAway > 1 ? 's' : '') + ' away)';
    
  td.innerHTML = '<div class="next-pick-line"><span>' + label + '</span></div>';
  marker.appendChild(td);

  targetRow.parentNode.insertBefore(marker, targetRow);
}

function updateScarcityAlerts(liveState) {
  if (typeof updateScarcityAlertsCustom !== 'function') return;
  try {
    updateScarcityAlertsCustom(liveState);
  } catch (error) {
    console.warn('Scarcity alert update failed', error);
  }
}

function updateScarcityAlertsCustom(sharedLiveState) {

  var container =
    document.getElementById(
      'scarcity-alerts'
    );


  if (!container) {
    return;
  }


  /*
   * -------------------------------------------------------
   * BUILD CURRENT ENGINE STATE
   * -------------------------------------------------------
   */

  var liveState =
    sharedLiveState || buildLiveDraftDebugState();


  if (
    !liveState ||
    !liveState.players
  ) {

    container.innerHTML =
      '';

    return;
  }


  var profiles =
    liveState.vorpResult &&
    Array.isArray(
      liveState.vorpResult.profiles
    )
      ? liveState.vorpResult.profiles
      : [];


  var scarcityState =
    buildLiveTierScarcityState(
      liveState.players,
      profiles
    );


  if (!scarcityState) {

    container.innerHTML =
      '';

    return;
  }


  updateDraftDayDashboard(liveState, scarcityState);

  var activeAlerts = Array.isArray(scarcityState.alerts)
    ? scarcityState.alerts
    : [];


  /*
   * -------------------------------------------------------
   * ALERT HELPERS
   * -------------------------------------------------------
   */

  function getAlertSymbol(status) {

    if (
      status ===
      'CRITICAL CLIFF'
    ) {

      return '&#128680;';

    }


    if (
      status ===
      'TIER CLOSING'
    ) {

      return '&#9888;';

    }


    if (
      status ===
      'HIGH SCARCITY'
    ) {

      return '&#9888;';

    }


    return '&#9651;';

  }


  function buildAlertText(alert) {

    if (!alert) {
      return '';
    }


    var position =
      alert.position ||
      'N/A';


    /*
     * -------------------------------------------------------
     * CRITICAL CLIFF
     * -------------------------------------------------------
     */

    if (
      alert.status ===
      'CRITICAL CLIFF'
    ) {

      return (
        alert.playersBeforeCliff +
        ' ' +
        position +
        (
          alert.playersBeforeCliff === 1
            ? ''
            : 's'
        ) +
        ' remain before the ' +
        (
          alert.fromTier ||
          '?'
        ) +
        ' &rarr; ' +
        (
          alert.toTier ||
          '?'
        ) +
        ' tier drop'
      );

    }


    /*
     * -------------------------------------------------------
     * TIER CLOSING
     * -------------------------------------------------------
     */

    if (
      alert.status ===
      'TIER CLOSING'
    ) {

      return (
        alert.playersBeforeCliff +
        ' ' +
        position +
        (
          alert.playersBeforeCliff === 1
            ? ''
            : 's'
        ) +
        ' remain before the ' +
        (
          alert.fromTier ||
          '?'
        ) +
        ' &rarr; ' +
        (
          alert.toTier ||
          '?'
        ) +
        ' tier drop'
      );

    }


    /*
     * -------------------------------------------------------
     * HIGH SCARCITY
     * -------------------------------------------------------
     */

    if (
      alert.status ===
      'HIGH SCARCITY'
    ) {

      return (
        (
          alert.bestAvailableName ||
          'Best available player'
        ) +
        ' leads a thin ' +
        position +
        ' pool'
      );

    }


    /*
     * -------------------------------------------------------
     * LIMITED DEPTH
     * -------------------------------------------------------
     */

    return (
      position +
      ' depth is becoming limited'
    );

  }


  /*
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

var html =
  '<div class="board-alerts-header">' +
    '<span>LIVE TIER ALERTS</span>' +
    '<b>' + (activeAlerts.length ? activeAlerts.length + ' active' : 'Board stable') + '</b>' +
  '</div>' +
  '<div class="board-alerts-grid">';


  activeAlerts
    .slice(0, 4)
    .forEach(function(alert) {

      html +=
        '<div class="board-alert-card">' +

          '<div style="' +
            'font-size:0.71rem;' +
            'font-weight:900;' +
            'letter-spacing:0.03em;' +
            'color:#e0c98a;' +
          '">' +

            getAlertSymbol(
              alert.status
            ) +

            ' ' +

            alert.position +

            ' &middot; ' +

            alert.status +

          '</div>' +


          '<div style="' +
            'font-size:0.69rem;' +
            'line-height:1.35;' +
            'color:#a9c2ab;' +
            'margin-top:3px;' +
          '">' +

            buildAlertText(
              alert
            ) +

          '</div>' +

        '</div>';

    });

  if (!activeAlerts.length) {
    html +=
      '<div class="board-alert-card board-alert-calm">' +
        '<div><b>&#10003; No urgent tier cliffs right now</b></div>' +
        '<small>The board still has workable depth across the main positions.</small>' +
      '</div>';
  }

  /*
 * -------------------------------------------------------
 * HEALTHY DEPTH SIGNAL
 * -------------------------------------------------------
 *
 * Warnings tell us where we may need to act.
 *
 * This gives one useful counter-signal showing a
 * position where waiting remains reasonable.
 */

var healthyPositions =
  ['QB', 'RB', 'WR', 'TE']
    .map(function(position) {

      return (
        scarcityState.positions[
          position
        ] || null
      );

    })
    .filter(function(positionState) {

      return (
        positionState &&
        positionState.status ===
          'HEALTHY DEPTH'
      );

    });


/*
 * Prefer the position with the LOWEST scarcity.
 *
 * Lower scarcity means greater positional depth and
 * therefore the strongest "safe to wait" signal.
 */

healthyPositions.sort(
  function(a, b) {

    return (
      Number(a.scarcity || 0) -
      Number(b.scarcity || 0)
    );

  }
);


var healthiestPosition =
  healthyPositions[0] ||
  null;


if (healthiestPosition) {

  html +=
    '<div class="board-alert-card board-alert-calm">' +

      '<div style="' +
        'font-size:0.71rem;' +
        'font-weight:900;' +
        'letter-spacing:0.03em;' +
        'color:#a9c2ab;' +
      '">' +

        '&#10003; ' +
        healthiestPosition.position +
        ' &middot; DEPTH HEALTHY' +

      '</div>' +


      '<div style="' +
        'font-size:0.69rem;' +
        'line-height:1.35;' +
        'color:#8faa92;' +
        'margin-top:3px;' +
      '">' +

        'Waiting at ' +
        healthiestPosition.position +
        ' remains reasonable' +

      '</div>' +

    '</div>';

}

html += '</div>';

container.innerHTML =
  html;


  /*
   * Useful for console inspection.
   */

  window.latestTierScarcityState =
    scarcityState;

}
function addEditControls() { safeCall('addEditControlsCustom'); }

function updatePickSettings() {
  var pcTeams = document.getElementById('pcTeams');
  var pcSlot = document.getElementById('pcSlot');
  var pcRounds = document.getElementById('pcRounds');

  if (pcTeams && pcTeams.value) LEAGUE_SIZE = parseInt(pcTeams.value, 10) || 10;
  if (pcSlot && pcSlot.value) MY_DRAFT_SLOT = parseInt(pcSlot.value, 10) || 10;
  if (pcRounds && pcRounds.value) TOTAL_ROUNDS = parseInt(pcRounds.value, 10) || 16;

  renderAutoDraftTeamToggles();
  triggerAllBoardUpdates({deferIntelligence: true});
  scheduleSave();
  publishEspnSyncSettingsUpdate();
}

function jumpTo(id){
  var el = document.getElementById(id);
  if(el){
    var tierGroup = el.closest('tbody.tier-group');
    if(tierGroup) setTierSectionCollapsed(tierGroup, false);
    el.scrollIntoView({behavior:'smooth', block:'start'});
  }
}

function updateTierCollapseButton(tierGroup) {
  if (!tierGroup) return;

  var button = tierGroup.querySelector('.tier-collapse-btn');
  if (!button) return;

  var collapsed = tierGroup.classList.contains('is-collapsed');
  var playerCount = tierGroup.querySelectorAll('tr.draftrow').length;
  button.textContent = (collapsed ? 'Show ' : 'Hide ') + playerCount;
  button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

function setTierSectionCollapsed(tierGroup, collapsed) {
  if (!tierGroup) return;
  tierGroup.classList.toggle('is-collapsed', Boolean(collapsed));
  if (!collapsed) tierGroup.classList.remove('is-temporarily-expanded');
  updateTierCollapseButton(tierGroup);
  if (typeof refreshDraftRowAccessibility === 'function') refreshDraftRowAccessibility();
}

function toggleTierSection(tierGroup) {
  setTierSectionCollapsed(
    tierGroup,
    !tierGroup.classList.contains('is-collapsed')
  );
}

function initializeTierSectionOrganization() {
  document.querySelectorAll('tbody.tier-group').forEach(function(tierGroup) {
    var dividerInner = tierGroup.querySelector('.tier-divider-row .divider-inner');

    if (dividerInner && !dividerInner.querySelector('.tier-collapse-btn')) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'tier-collapse-btn';
      button.setAttribute('aria-label', 'Toggle ' + (tierGroup.getAttribute('data-tier-name') || 'tier') + ' players');
      button.onclick = function(event) {
        event.preventDefault();
        event.stopPropagation();
        toggleTierSection(tierGroup);
      };
      dividerInner.appendChild(button);
    }

    var tierId = tierGroup.id.replace('tbody-', '');
    var subtitle = tierGroup.querySelector('.divider-sub');
    var playerCount = tierGroup.querySelectorAll('tr.draftrow').length;
    if (subtitle && WAR_ROOM_CONFIG.tierFantasyProsRanges[tierId]) {
      subtitle.textContent = WAR_ROOM_CONFIG.tierFantasyProsRanges[tierId] + ' · ' + playerCount + ' players';
    }
    setTierSectionCollapsed(tierGroup, tierId === 'E' || tierId === 'F');
  });
}

function updateTierFilterExpansion(query) {
  var hasSearch = Boolean(query && query.length >= 2);
  var hasPositionFilter = Boolean(
    document.querySelector('tr.draftrow.hidden-row')
  );

  document.querySelectorAll('tbody.tier-group.is-collapsed').forEach(function(tierGroup) {
    var hasRelevantPlayer = Array.prototype.some.call(
      tierGroup.querySelectorAll('tr.draftrow'),
      function(row) {
        if (row.classList.contains('hidden-row')) return false;
        if (!hasSearch) return hasPositionFilter;
        var name = (row.getAttribute('data-name') || row.innerText || '').toLowerCase();
        return name.indexOf(query) !== -1;
      }
    );

    tierGroup.classList.toggle(
      'is-temporarily-expanded',
      (hasSearch || hasPositionFilter) && hasRelevantPlayer
    );
  });
}

function setPosFilter(pos, btn){
  currentPosFilter = pos;
  document.querySelectorAll('.filterbtn[data-pos]').forEach(function(b){ b.classList.remove('active'); });
  if(btn) btn.classList.add('active');
  applyFilters();
}

function updateDraftDayDashboard(liveState, scarcityState){
  var container = document.getElementById('draft-day-dashboard');
  if(!container) return;

  if (!liveState || !Array.isArray(liveState.players) || !scarcityState) {
    container.innerHTML = '<div class="board-pressure-loading">Measuring the live board…</div>';
    return;
  }

  var state = liveState.draftState || getDraftAssistantState();
  var context = liveState.context || {};
  var positions = scarcityState.positions || {};
  var draftableCutoff = state.totalPicks;
  
  var html =
    '<div class="board-pressure-section-label"><span>DECISION WINDOW</span><b>ECR top ' + draftableCutoff + ' remaining</b></div>' +
    '<div class="board-pressure-grid">';
  ['QB','RB','WR','TE','K','DST'].forEach(function(pos){
    var available = liveState.players.filter(function(player) {
      return player && player.available && player.position === pos;
    }).sort(function(a, b) {
      return (Number(a.ecr) || Number(a.rank) || 9999) - (Number(b.ecr) || Number(b.rank) || 9999);
    });
    var relevant = available.filter(function(player) {
      return player.ecr != null && (
        pos === 'K' || pos === 'DST' || Number(player.ecr) <= draftableCutoff
      );
    });
    var positionState = positions[pos] || null;
    var best = positionState && positionState.bestAvailable ? positionState.bestAvailable : available[0] || null;
    // WR-127: 50 is an internal neutral timing fallback when the market is
    // missing, never evidence of 50% survival. Preserve all engine internals.
    var marketRank = best ? getMarketTimingDetails(best, context).marketRank : null;
    var hasMarketTiming = marketRank != null && Number.isFinite(marketRank) && marketRank > 0;
    var survival = hasMarketTiming ? Math.round(calculateNextPickSurvival(best, context)) : null;
    var status = positionState ? positionState.status : 'ENDGAME';
    // An independently observed tier/cliff may still warrant attention.
    // Otherwise missing-market urgency is UNKNOWN, not derived from sentinel 50.
    var urgency = status === 'CRITICAL CLIFF'
      ? 'scarce'
      : status === 'TIER CLOSING' || status === 'HIGH SCARCITY'
        ? 'limited'
        : !hasMarketTiming ? 'unknown'
          : survival < 25 ? 'scarce'
            : survival < 50 ? 'limited'
              : survival < 75 ? 'fair' : 'plenty';
    var playerName = best && best.row ? getDraftRowDisplayName(best.row) : best && best.name ? best.name : 'None';
    var cliffText = positionState && positionState.playersBeforeCliff > 0
      ? positionState.playersBeforeCliff + ' before tier drop'
      : pos === 'K' || pos === 'DST' ? 'Endgame position' : 'No immediate cliff';
    html += '<div class="board-pressure-card pressure-'+urgency+'">';
    html += '<div><span class="pos-pill pos-'+pos+'">'+pos+'</span><b>'+relevant.length+(pos === 'K' || pos === 'DST' ? ' ranked' : ' relevant')+'</b></div>';
    html += '<strong class="pressure-best">'+escapeSummaryHtml(playerName)+'</strong>';
    if (hasMarketTiming) {
      // This 0–100 meter is an uncalibrated heuristic index, not a probability.
      html += '<div class="board-pressure-meter" aria-hidden="true"><span style="width:'+survival+'%"></span></div>';
      html += '<small>Timing index '+survival+'/100 (heuristic) · '+escapeSummaryHtml(cliffText)+'</small>';
    } else {
      // Omit the meter entirely: neither visible nor accessible UI may
      // expose the internal neutral 50 as an estimate for unknown timing.
      html += '<small>Market timing UNKNOWN — no survival estimate · '+escapeSummaryHtml(cliffText)+'</small>';
    }
    html += '</div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

var BOARD_VIEW_STORAGE_KEY = 'war-room-board-view-v1';
var POSITION_BOARD_PRIMARY_POSITIONS = ['WR', 'RB', 'QB', 'TE'];
var POSITION_BOARD_ENDGAME_POSITIONS = ['K', 'DST'];
var POSITION_BOARD_TIERS = ['ELITE', 'PREMIUM', 'CORE', 'VALUE', 'UPSIDE', 'DEPTH', 'LATE', 'DEEP'];
var boardViewMode = 'position';
var positionBoardReady = false;
var positionBoardCardByKey = new Map();

function setPositionBoardText(element, value) {
  if (!element) return;
  var next = value == null ? '' : String(value);
  if (element.textContent !== next) element.textContent = next;
}

function getPositionBoardRowKey(row) {
  if (!row) return '';
  return canonicalExpertPlayerName(
    row.getAttribute('data-display-name') || row.getAttribute('data-name') || ''
  );
}

function getPositionBoardTier(row) {
  if (!row) return 'DEEP';
  var group = row.closest && row.closest('tbody.tier-group');
  var tier = group && group.getAttribute('data-tier-name');
  return tier || row.getAttribute('data-semantic-tier') || row.getAttribute('data-consensus-tier') || 'DEEP';
}

function getPositionBoardTeam(row) {
  if (!row) return '';
  var stored = row.getAttribute('data-team');
  if (stored) return stored;
  var teamCell = row.children && row.children[3];
  return teamCell ? String(teamCell.textContent || '').trim().split(/\s+/)[0] : '';
}

function getPositionBoardRankValue(row) {
  var ecr = getDraftRowNumber(row, 'data-ecr');
  if (ecr != null) return ecr;
  var boardRank = getDraftRowNumber(row, 'data-board-rank');
  return boardRank == null ? 99999 : boardRank;
}

function isPositionBoardView() {
  return boardViewMode === 'position';
}

function readBoardViewPreference() {
  try {
    return localStorage.getItem(BOARD_VIEW_STORAGE_KEY) === 'overall' ? 'overall' : 'position';
  } catch (error) {
    return 'position';
  }
}

function persistBoardViewPreference(view) {
  try {
    localStorage.setItem(BOARD_VIEW_STORAGE_KEY, view);
  } catch (error) {}
}

function setBoardView(view, options) {
  options = options || {};
  boardViewMode = view === 'overall' ? 'overall' : 'position';
  document.body.setAttribute('data-board-view', boardViewMode);

  document.querySelectorAll('.board-view-btn').forEach(function(button) {
    var active = button.getAttribute('data-board-view') === boardViewMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  if (options.persist !== false) persistBoardViewPreference(boardViewMode);

  if (boardViewMode === 'position') {
    rebuildPositionTierBoard();
  } else if (typeof applyFilters === 'function') {
    applyFilters();
  }
}

function initializeBoardView() {
  setBoardView(readBoardViewPreference(), {persist: false});
}

function invalidatePositionTierBoard() {
  positionBoardReady = false;
}

function createPositionBoardPlayerCard(row) {
  var card = document.createElement('button');
  card.type = 'button';
  card.className = 'position-player-card';
  card.setAttribute('data-player-key', getPositionBoardRowKey(row));
  card.setAttribute('data-position', row.getAttribute('data-pos') || '');
  card.setAttribute('data-tier', getPositionBoardTier(row));
  card.setAttribute('data-search-text', [
    row.getAttribute('data-display-name') || row.getAttribute('data-name') || '',
    getPositionBoardTeam(row),
    row.getAttribute('data-pos') || ''
  ].join(' ').toLowerCase());

  var rank = document.createElement('span');
  rank.className = 'position-player-rank';
  var rankValue = document.createElement('strong');
  rankValue.setAttribute('data-role', 'rank');
  var rankLabel = document.createElement('small');
  rankLabel.setAttribute('data-role', 'rank-label');
  rank.appendChild(rankValue);
  rank.appendChild(rankLabel);

  var identity = document.createElement('span');
  identity.className = 'position-player-identity';
  var name = document.createElement('strong');
  name.setAttribute('data-role', 'name');
  name.textContent = getDraftRowDisplayName(row);
  var meta = document.createElement('small');
  meta.setAttribute('data-role', 'meta');
  identity.appendChild(name);
  identity.appendChild(meta);

  var trailing = document.createElement('span');
  trailing.className = 'position-player-trailing';
  var market = document.createElement('small');
  market.setAttribute('data-role', 'market');
  var value = document.createElement('b');
  value.setAttribute('data-role', 'value');
  var status = document.createElement('em');
  status.setAttribute('data-role', 'status');
  trailing.appendChild(market);
  trailing.appendChild(value);
  trailing.appendChild(status);

  card.appendChild(rank);
  card.appendChild(identity);
  card.appendChild(trailing);
  card.addEventListener('click', function() {
    if (typeof toggleDraft === 'function') toggleDraft(row);
  });

  return card;
}

function createPositionBoardColumn(position, rows, compact) {
  var column = document.createElement('section');
  column.className = 'position-column' + (compact ? ' position-column-compact' : '');
  column.setAttribute('data-position', position);

  var header = document.createElement('div');
  header.className = 'position-column-header';
  var title = document.createElement('div');
  title.className = 'position-column-title';
  var pill = document.createElement('span');
  pill.className = 'pos-pill pos-' + position;
  pill.textContent = position;
  var best = document.createElement('strong');
  best.setAttribute('data-role', 'position-best');
  title.appendChild(pill);
  title.appendChild(best);
  var count = document.createElement('span');
  count.className = 'position-column-count';
  count.setAttribute('data-role', 'column-count');
  header.appendChild(title);
  header.appendChild(count);
  column.appendChild(header);

  var groups = POSITION_BOARD_TIERS.map(function(tier) {
    return {
      tier: tier,
      rows: rows.filter(function(row) { return getPositionBoardTier(row) === tier; })
    };
  }).filter(function(group) { return group.rows.length > 0; });

  groups.forEach(function(group, index) {
    var details = document.createElement('details');
    details.className = 'position-tier-block';
    details.setAttribute('data-position', position);
    details.setAttribute('data-tier', group.tier);
    details.open = group.tier !== 'LATE' && group.tier !== 'DEEP';

    var summary = document.createElement('summary');
    var tierName = document.createElement('strong');
    tierName.textContent = group.tier;
    var tierCount = document.createElement('span');
    tierCount.setAttribute('data-role', 'tier-count');
    summary.appendChild(tierName);
    summary.appendChild(tierCount);
    details.appendChild(summary);

    var body = document.createElement('div');
    body.className = 'position-tier-players';
    group.rows.forEach(function(row) {
      var card = createPositionBoardPlayerCard(row);
      body.appendChild(card);
      positionBoardCardByKey.set(getPositionBoardRowKey(row), {card: card, row: row});
    });
    details.appendChild(body);

    if (index < groups.length - 1) {
      var cliff = document.createElement('div');
      cliff.className = 'position-tier-cliff';
      cliff.textContent = 'Tier cliff → ' + groups[index + 1].tier;
      details.appendChild(cliff);
    }

    column.appendChild(details);
  });

  return column;
}

function rebuildPositionTierBoard() {
  var primaryGrid = document.getElementById('position-tier-grid');
  var endgameGrid = document.getElementById('position-endgame-grid');
  if (!primaryGrid || !endgameGrid || typeof getCachedDraftRows !== 'function') return;

  var rows = getCachedDraftRows();
  positionBoardCardByKey = new Map();
  primaryGrid.replaceChildren();
  endgameGrid.replaceChildren();

  POSITION_BOARD_PRIMARY_POSITIONS.forEach(function(position) {
    var positionRows = rows.filter(function(row) {
      return row.getAttribute('data-pos') === position;
    });
    primaryGrid.appendChild(createPositionBoardColumn(position, positionRows, false));
  });

  POSITION_BOARD_ENDGAME_POSITIONS.forEach(function(position) {
    var positionRows = rows.filter(function(row) {
      return row.getAttribute('data-pos') === position;
    });
    endgameGrid.appendChild(createPositionBoardColumn(position, positionRows, true));
  });

  positionBoardReady = true;
  updatePositionTierBoard({skipStructureCheck: true});
}

function updatePositionPlayerCard(card, row) {
  if (!card || !row) return;
  var status = getDraftRowStatus(row);
  var ecr = getDraftRowNumber(row, 'data-ecr');
  var boardRank = getDraftRowNumber(row, 'data-board-rank');
  var espnRank = getDraftRowNumber(row, 'data-espn-rank');
  var espnAdp = getDraftRowNumber(row, 'data-espn-adp');
  var fantasyProsAdp = getDraftRowNumber(row, 'data-adp');
  var posRank = getDraftRowNumber(row, 'data-pos-rank');
  var team = getPositionBoardTeam(row) || 'FA';
  var position = row.getAttribute('data-pos') || '';
  var tier = getPositionBoardTier(row);

  card.classList.toggle('is-drafted', status !== 'available');
  card.classList.toggle('is-mine', status === 'mine');
  card.classList.toggle('is-taken', status === 'taken');
  card.setAttribute('data-status', status);

  var rankText = ecr != null ? '#' + Math.round(ecr) : boardRank != null ? '#' + Math.round(boardRank) : '—';
  setPositionBoardText(card.querySelector('[data-role="rank"]'), rankText);
  setPositionBoardText(card.querySelector('[data-role="rank-label"]'), ecr != null ? 'ECR' : 'BOARD');
  setPositionBoardText(
    card.querySelector('[data-role="meta"]'),
    team + (posRank != null ? ' · ' + position + Math.round(posRank) : ' · ' + position)
  );

  var marketText = 'Market —';
  if (espnRank != null && espnAdp != null) {
    marketText = 'ESPN #' + Math.round(espnRank) + ' · ' + espnAdp.toFixed(1);
  } else if (espnRank != null) {
    marketText = 'ESPN #' + Math.round(espnRank);
  } else if (espnAdp != null) {
    marketText = 'ESPN ' + espnAdp.toFixed(1);
  } else if (fantasyProsAdp != null) {
    marketText = 'ADP ' + fantasyProsAdp.toFixed(1);
  }
  setPositionBoardText(card.querySelector('[data-role="market"]'), marketText);

  var sourceValue = row.children && row.children[5] ? String(row.children[5].textContent || '').trim() : '';
  setPositionBoardText(card.querySelector('[data-role="value"]'), sourceValue && sourceValue !== '—' ? 'Value ' + sourceValue : '');
  setPositionBoardText(
    card.querySelector('[data-role="status"]'),
    status === 'mine' ? 'MINE' : status === 'taken' ? 'TAKEN' : ''
  );

  var action = status === draftMarkMode
    ? 'clear this status'
    : 'mark as ' + (draftMarkMode === 'mine' ? 'Mine' : 'Taken');
  card.setAttribute(
    'aria-label',
    [getDraftRowDisplayName(row), position, tier, status, 'Press Enter to ' + action].join('. ')
  );
}

function updatePositionTierBlock(block) {
  if (!block) return;
  var cards = Array.prototype.slice.call(block.querySelectorAll('.position-player-card'));
  var available = cards.filter(function(card) { return card.getAttribute('data-status') === 'available'; }).length;
  var drafted = cards.length - available;
  var previous = block.hasAttribute('data-available') ? Number(block.getAttribute('data-available')) : null;
  var tier = block.getAttribute('data-tier') || '';

  block.classList.toggle('is-exhausted', available === 0);
  block.classList.toggle('is-closing', available > 0 && available <= 2);
  setPositionBoardText(
    block.querySelector('[data-role="tier-count"]'),
    available === 0
      ? 'EXHAUSTED · ' + drafted + ' drafted'
      : available + ' left' + (drafted ? ' · ' + drafted + ' drafted' : '')
  );

  if (previous == null) {
    block.open = available > 0 && tier !== 'LATE' && tier !== 'DEEP';
  } else if (previous > 0 && available === 0) {
    block.open = false;
  } else if (previous === 0 && available > 0) {
    block.open = true;
  }
  block.setAttribute('data-available', String(available));
}

function updatePositionColumnState(column) {
  if (!column) return;
  var entries = Array.prototype.slice.call(column.querySelectorAll('.position-player-card')).map(function(card) {
    return positionBoardCardByKey.get(card.getAttribute('data-player-key')) || null;
  }).filter(Boolean);
  var availableEntries = entries.filter(function(entry) {
    return getDraftRowStatus(entry.row) === 'available';
  }).sort(function(left, right) {
    return getPositionBoardRankValue(left.row) - getPositionBoardRankValue(right.row);
  });

  setPositionBoardText(
    column.querySelector('[data-role="column-count"]'),
    availableEntries.length + ' available'
  );
  setPositionBoardText(
    column.querySelector('[data-role="position-best"]'),
    availableEntries.length ? 'Best · ' + getDraftRowDisplayName(availableEntries[0].row) : 'No players left'
  );

  var firstLiveBlock = Array.prototype.slice.call(column.querySelectorAll('.position-tier-block')).find(function(block) {
    return Number(block.getAttribute('data-available')) > 0;
  });
  if (firstLiveBlock && (firstLiveBlock.getAttribute('data-tier') === 'LATE' || firstLiveBlock.getAttribute('data-tier') === 'DEEP') &&
      firstLiveBlock.getAttribute('data-auto-opened') !== 'true') {
    firstLiveBlock.open = true;
    firstLiveBlock.setAttribute('data-auto-opened', 'true');
  }
}

function applyPositionBoardFilters() {
  var board = document.getElementById('position-board');
  if (!board) return;
  var searchInput = document.getElementById('searchBox');
  var query = searchInput ? String(searchInput.value || '').toLowerCase().trim() : '';
  var filter = typeof currentPosFilter === 'undefined' ? 'ALL' : currentPosFilter;
  board.setAttribute('data-position-filter', filter || 'ALL');

  document.querySelectorAll('.position-player-card').forEach(function(card) {
    var matchesSearch = query.length < 2 || String(card.getAttribute('data-search-text') || '').indexOf(query) >= 0;
    card.hidden = !matchesSearch;
  });

  document.querySelectorAll('.position-tier-block').forEach(function(block) {
    var hasVisibleCard = Array.prototype.some.call(
      block.querySelectorAll('.position-player-card'),
      function(card) { return !card.hidden; }
    );
    block.hidden = query.length >= 2 && !hasVisibleCard;
    if (query.length >= 2 && hasVisibleCard) block.open = true;
  });

  document.querySelectorAll('.position-column').forEach(function(column) {
    var position = column.getAttribute('data-position');
    var positionMatch = filter === 'ALL' || filter === position;
    var searchMatch = query.length < 2 || Array.prototype.some.call(
      column.querySelectorAll('.position-player-card'),
      function(card) { return !card.hidden; }
    );
    column.hidden = !positionMatch || !searchMatch;
  });

  var primaryGrid = document.getElementById('position-tier-grid');
  var endgameSection = document.getElementById('position-endgame-section');
  if (primaryGrid) primaryGrid.hidden = filter === 'K' || filter === 'DST';
  if (endgameSection) {
    endgameSection.hidden = !(filter === 'ALL' || filter === 'K' || filter === 'DST') ||
      !Array.prototype.some.call(endgameSection.querySelectorAll('.position-column'), function(column) { return !column.hidden; });
  }
}

function createPositionDecisionCard(label, row, availableRows) {
  var card = document.createElement(row ? 'button' : 'div');
  if (row) card.type = 'button';
  card.className = 'position-decision-card';
  var eyebrow = document.createElement('span');
  eyebrow.textContent = label;
  var name = document.createElement('strong');
  var detail = document.createElement('small');
  card.appendChild(eyebrow);
  card.appendChild(name);
  card.appendChild(detail);

  if (!row) {
    name.textContent = 'None';
    detail.textContent = 'No available player';
    return card;
  }

  var ecr = getDraftRowNumber(row, 'data-ecr');
  var boardRank = getDraftRowNumber(row, 'data-board-rank');
  var tier = getPositionBoardTier(row);
  var position = row.getAttribute('data-pos') || '';
  var tierRemaining = availableRows.filter(function(candidate) {
    return candidate.getAttribute('data-pos') === position && getPositionBoardTier(candidate) === tier;
  }).length;
  name.textContent = getDraftRowDisplayName(row);
  detail.textContent = (ecr != null ? 'ECR #' + Math.round(ecr) : 'Board #' + Math.round(boardRank || 0)) +
    ' · ' + tier + ' · ' + tierRemaining + ' left';
  card.addEventListener('click', function() { focusPositionBoardPlayer(row); });
  card.setAttribute('aria-label', label + ': ' + getDraftRowDisplayName(row) + '. Jump to player.');
  return card;
}

function updatePositionDecisionStrip() {
  var strip = document.getElementById('position-decision-strip');
  if (!strip || typeof getCachedDraftRows !== 'function') return;
  var availableRows = getCachedDraftRows().filter(function(row) {
    return getDraftRowStatus(row) === 'available';
  });
  var ranked = availableRows.slice().sort(function(left, right) {
    return getPositionBoardRankValue(left) - getPositionBoardRankValue(right);
  });

  strip.replaceChildren();
  strip.appendChild(createPositionDecisionCard('BEST OVERALL', ranked[0] || null, availableRows));
  POSITION_BOARD_PRIMARY_POSITIONS.forEach(function(position) {
    var best = ranked.find(function(row) { return row.getAttribute('data-pos') === position; }) || null;
    strip.appendChild(createPositionDecisionCard(position, best, availableRows));
  });

  var nextCard = document.createElement('div');
  nextCard.className = 'position-decision-card position-next-pick-card';
  var label = document.createElement('span');
  label.textContent = 'NEXT PICK';
  var value = document.createElement('strong');
  var detail = document.createElement('small');
  var currentPick = getCompletedDraftPickCount() + 1;
  var nextPick = getMyPickNumbers().find(function(pick) { return pick >= currentPick; });
  if (nextPick == null) {
    value.textContent = 'DONE';
    detail.textContent = 'No picks remaining';
  } else if (nextPick === currentPick) {
    value.textContent = 'ON THE CLOCK';
    detail.textContent = 'Pick #' + nextPick;
  } else {
    var away = nextPick - currentPick;
    value.textContent = '#' + nextPick;
    detail.textContent = away + ' pick' + (away === 1 ? '' : 's') + ' away';
  }
  nextCard.appendChild(label);
  nextCard.appendChild(value);
  nextCard.appendChild(detail);
  strip.appendChild(nextCard);
}

function updatePositionTierBoard(options) {
  options = options || {};
  if (!isPositionBoardView()) return;
  var board = document.getElementById('position-board');
  if (!board || typeof getCachedDraftRows !== 'function') return;
  var rows = getCachedDraftRows();

  if (!options.skipStructureCheck) {
    var first = rows[0];
    var firstEntry = first ? positionBoardCardByKey.get(getPositionBoardRowKey(first)) : null;
    if (!positionBoardReady || positionBoardCardByKey.size !== rows.length || (first && (!firstEntry || firstEntry.row !== first))) {
      rebuildPositionTierBoard();
      return;
    }
  }

  positionBoardCardByKey.forEach(function(entry) {
    updatePositionPlayerCard(entry.card, entry.row);
  });
  document.querySelectorAll('.position-tier-block').forEach(updatePositionTierBlock);
  document.querySelectorAll('.position-column').forEach(updatePositionColumnState);
  applyPositionBoardFilters();
  updatePositionDecisionStrip();
}

function focusPositionBoardPlayer(row) {
  if (!isPositionBoardView() || !row) return false;
  var position = row.getAttribute('data-pos') || '';
  if (typeof currentPosFilter !== 'undefined' && currentPosFilter !== 'ALL' && currentPosFilter !== position && typeof setPosFilter === 'function') {
    setPosFilter(position, document.querySelector('.filterbtn[data-pos="' + position + '"]'));
  }

  var entry = positionBoardCardByKey.get(getPositionBoardRowKey(row));
  if (!entry || !entry.card || !document.body.contains(entry.card)) return false;
  var card = entry.card;
  var block = card.closest('.position-tier-block');
  if (block) block.open = true;
  document.querySelectorAll('.position-player-card.search-highlight').forEach(function(candidate) {
    candidate.classList.remove('search-highlight');
  });
  card.hidden = false;
  card.classList.add('search-highlight');
  card.scrollIntoView({behavior: 'smooth', block: 'center'});
  card.focus({preventScroll: true});
  setTimeout(function() { card.classList.remove('search-highlight'); }, 2500);
  return true;
}


var _draftIntelligenceTimer = null;

function publishBoardUpdateTimings(timings) {
  window.latestBoardUpdateTimings = timings;
  document.documentElement.setAttribute(
    'data-last-board-update-timings',
    JSON.stringify(timings)
  );
}

function triggerAllBoardUpdates(options) {
  options = options || {};
  var timings = {};
  var totalStart = performance.now();

  function timedUpdate(name, update) {
    var startedAt = performance.now();
    update();
    timings[name] = Number((performance.now() - startedAt).toFixed(1));
  }

  timedUpdate('myTeam', updateMyTeam);
  timedUpdate('draftSummary', updateDraftSummary);
  timedUpdate('remaining', updateRemaining);
  timedUpdate('bestAvailable', updateBestAvailable);
  timedUpdate('pickCounter', updatePickCounter);
  timedUpdate('marketValues', refreshDynamicMarketValueCells);
  timedUpdate('positionBoard', updatePositionTierBoard);
  timedUpdate('nextPickDisplay', updateNextPickDisplay);
  timedUpdate('nextPickMarker', updateNextPickMarker);
  timedUpdate('roundMarkers', addRoundMarkers);
  var draftComplete = false;
  timedUpdate('completionMode', function() {
    draftComplete = updateDraftCompletionMode();
  });

  timings.interactive = Number((performance.now() - totalStart).toFixed(1));
  publishBoardUpdateTimings(timings);

  function updateDraftIntelligence() {
    var intelligenceStart = performance.now();
    var sharedLiveState = null;

    if (draftComplete) {
      timedUpdate('recommendation', updateRecommendedPick);
      timings.intelligence = Number((performance.now() - intelligenceStart).toFixed(1));
      timings.total = Number((performance.now() - totalStart).toFixed(1));
      publishBoardUpdateTimings(timings);
      document.body.classList.remove('draft-intelligence-updating');
      var completedRecommendationBox = document.getElementById('recommended-pick-box');
      if (completedRecommendationBox) completedRecommendationBox.removeAttribute('aria-busy');
      return;
    }

    timedUpdate('liveDraftState', function() {
      sharedLiveState = buildLiveDraftDebugState();
    });

    timedUpdate('scarcityAlerts', function() {
      updateScarcityAlerts(sharedLiveState);
    });
    timedUpdate('recommendation', function() {
      updateRecommendedPick(sharedLiveState);
    });

    timings.intelligence = Number((performance.now() - intelligenceStart).toFixed(1));
    timings.total = Number((performance.now() - totalStart).toFixed(1));
    publishBoardUpdateTimings(timings);
    document.body.classList.remove('draft-intelligence-updating');
    var recommendationBox = document.getElementById('recommended-pick-box');
    if (recommendationBox) recommendationBox.removeAttribute('aria-busy');
  }

  if (!options.deferIntelligence) {
    if (_draftIntelligenceTimer) {
      clearTimeout(_draftIntelligenceTimer);
      _draftIntelligenceTimer = null;
    }
    updateDraftIntelligence();
    return;
  }

  if (_draftIntelligenceTimer) clearTimeout(_draftIntelligenceTimer);
  document.body.classList.add('draft-intelligence-updating');
  var recommendationBox = document.getElementById('recommended-pick-box');
  if (recommendationBox) recommendationBox.setAttribute('aria-busy', 'true');

  /* Let the row state paint immediately and coalesce rapid Taken/Mine clicks. */
  _draftIntelligenceTimer = setTimeout(function() {
    _draftIntelligenceTimer = null;
    updateDraftIntelligence();
  }, 120);
}
