/* =========================================================
   ESPN COMPANION SYNC CONTRACT — VERSION 1

   The browser extension posts validated draft snapshots into
   this page. ESPN remains the draft-history authority while
   FantasyPros remains the ranking/value authority.
   ========================================================= */

var ESPN_SYNC_CHANNEL = 'the-war-room:espn-sync:v1';
var ESPN_COMPANION_MIN_VERSION = '0.9.14';
var ESPN_SYNC_MAX_PICKS = 600;
var ESPN_SYNC_MAX_BOARD_PLAYERS = 1000;
var espnSyncLastSignature = null;
var latestEspnSyncResult = null;
var espnSettingsEditedAt = 0;
var latestEspnSyncMeta = {draftComplete: false, expectedCompleted: 0, numberedPicks: 0, marketAdpCount: 0, marketRankCount: 0, marketUpdatedAt: null};
window.latestEspnSyncMeta = latestEspnSyncMeta;

function normalizeEspnSyncPosition(position) {
  var value = String(position || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (value === 'DEF' || value === 'D' || value === 'DST') return 'DST';
  return ['QB', 'RB', 'WR', 'TE', 'K'].indexOf(value) >= 0 ? value : '';
}

function normalizeEspnSyncName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\bd\s*\/\s*st\b|\bdst\b|\bdefense\b|\bdef\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveEspnDraftRow(playerName, position) {
  var direct = findDraftRowByExpertName(playerName);
  if (direct) return direct;

  var normalizedName = normalizeEspnSyncName(playerName);
  var normalizedPosition = normalizeEspnSyncPosition(position);
  if (!normalizedName) return null;

  var candidates = Array.prototype.slice.call(
    document.querySelectorAll('tr.draftrow')
  ).filter(function(row) {
    return !normalizedPosition || row.getAttribute('data-pos') === normalizedPosition;
  });

  var exact = candidates.find(function(row) {
    return normalizeEspnSyncName(row.getAttribute('data-name')) === normalizedName;
  });
  if (exact) return exact;

  if (normalizedPosition !== 'DST') return null;

  var inputTokens = normalizedName.split(' ').filter(function(token) {
    return token.length >= 4;
  });
  var dstMatches = candidates.filter(function(row) {
    var rowTokens = normalizeEspnSyncName(row.getAttribute('data-name')).split(' ');
    return inputTokens.some(function(token) { return rowTokens.indexOf(token) >= 0; });
  });

  return dstMatches.length === 1 ? dstMatches[0] : null;
}

function sanitizeEspnDraftPick(rawPick, totalPicks) {
  rawPick = rawPick || {};
  var overallPick = Number(rawPick.overallPick || rawPick.pick);
  var playerName = String(rawPick.playerName || rawPick.name || '').trim();
  var teamSlot = Number(rawPick.teamSlot);

  if (!Number.isInteger(overallPick) || overallPick < 1 || overallPick > totalPicks) return null;
  if (!playerName || playerName.length > 100) return null;

  return {
    overallPick: overallPick,
    playerName: playerName,
    position: normalizeEspnSyncPosition(rawPick.position),
    teamSlot: Number.isInteger(teamSlot) && teamSlot > 0 ? teamSlot : null,
    teamId: rawPick.teamId == null ? null : String(rawPick.teamId).slice(0, 40),
    isMine: typeof rawPick.isMine === 'boolean' ? rawPick.isMine : null,
    method: String(rawPick.method || 'dom').slice(0, 12),
    espnPlayerId: rawPick.espnPlayerId == null
      ? null
      : String(rawPick.espnPlayerId).slice(0, 40)
  };
}

function updateEspnSyncStatus(status, detail) {
  var badge = document.getElementById('espn-sync-status');
  if (!badge) return;

  badge.hidden = false;
  badge.className = 'espn-sync-status';
  if (status === 'syncing') badge.classList.add('espn-sync-status-syncing');
  if (status === 'error') badge.classList.add('espn-sync-status-error');
  badge.textContent = detail || 'ESPN companion connected';
}

function getEspnSyncSettings() {
  var state = getDraftAssistantState();
  return {
    teams: state.teams,
    rounds: state.rounds,
    draftSlot: state.draftSlot,
    totalPicks: state.totalPicks
  };
}

function publishEspnSyncSettingsUpdate() {
  var targetOrigin = window.location.origin === 'null' ? '*' : window.location.origin;
  espnSettingsEditedAt = Date.now();
  window.postMessage({
    channel: ESPN_SYNC_CHANNEL,
    type: 'SETTINGS_UPDATE',
    settings: getEspnSyncSettings(),
    requiredExtensionVersion: ESPN_COMPANION_MIN_VERSION
  }, targetOrigin);
}

var autoDraftTeamSlots = [];

function sanitizeAutoDraftTeamSlots(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map(Number).filter(function(slot) {
    return Number.isInteger(slot) && slot >= 1 && slot <= LEAGUE_SIZE && slot !== MY_DRAFT_SLOT;
  }))).sort(function(a, b) { return a - b; });
}

function renderAutoDraftTeamToggles() {
  var target = document.getElementById('auto-draft-team-toggles');
  if (!target) return;
  autoDraftTeamSlots = sanitizeAutoDraftTeamSlots(autoDraftTeamSlots);
  var markup = [];
  for (var slot = 1; slot <= LEAGUE_SIZE; slot++) {
    if (slot === MY_DRAFT_SLOT) continue;
    var active = autoDraftTeamSlots.indexOf(slot) >= 0;
    markup.push('<button type="button" class="auto-draft-team-toggle" data-team-slot="' + slot +
      '" aria-pressed="' + active + '" onclick="toggleAutoDraftTeam(' + slot + ')">Team ' + slot + (active ? ' · Auto' : '') + '</button>');
  }
  target.innerHTML = markup.join('');
}

function toggleAutoDraftTeam(slot) {
  slot = Number(slot);
  var index = autoDraftTeamSlots.indexOf(slot);
  if (index >= 0) autoDraftTeamSlots.splice(index, 1);
  else autoDraftTeamSlots.push(slot);
  autoDraftTeamSlots = sanitizeAutoDraftTeamSlots(autoDraftTeamSlots);
  renderAutoDraftTeamToggles();
  triggerAllBoardUpdates({deferIntelligence: true});
  scheduleSave();
}

window.toggleAutoDraftTeam = toggleAutoDraftTeam;

function applyEspnSyncSettings(config) {
  config = config || {};
  // A snapshot already in flight can arrive just after the user edits the page.
  // Hold the local values briefly while the companion persists and rebroadcasts them.
  if (espnSettingsEditedAt && Date.now() - espnSettingsEditedAt < 1500) {
    return getEspnSyncSettings();
  }
  var teams = Math.max(2, Math.min(20, Number(config.teams) || LEAGUE_SIZE));
  var rounds = Math.max(1, Math.min(30, Number(config.rounds) || TOTAL_ROUNDS));
  var draftSlot = Math.max(1, Math.min(teams, Number(config.draftSlot) || MY_DRAFT_SLOT));
  var pcTeams = document.getElementById('pcTeams');
  var pcSlot = document.getElementById('pcSlot');
  var pcRounds = document.getElementById('pcRounds');
  var changed = Number(pcTeams && pcTeams.value) !== teams ||
    Number(pcSlot && pcSlot.value) !== draftSlot ||
    Number(pcRounds && pcRounds.value) !== rounds;

  if (pcTeams) pcTeams.value = String(teams);
  if (pcSlot) {
    pcSlot.max = String(teams);
    pcSlot.value = String(draftSlot);
  }
  if (pcRounds) pcRounds.value = String(rounds);

  LEAGUE_SIZE = teams;
  MY_DRAFT_SLOT = draftSlot;
  TOTAL_ROUNDS = rounds;

  if (changed) {
    triggerAllBoardUpdates({deferIntelligence: true});
    scheduleSave();
  }

  return getEspnSyncSettings();
}

function publishEspnSyncAck(result) {
  var targetOrigin = window.location.origin === 'null' ? '*' : window.location.origin;
  window.postMessage({
    channel: ESPN_SYNC_CHANNEL,
    type: 'SYNC_ACK',
    result: result || latestEspnSyncResult,
    settings: getEspnSyncSettings(),
    requiredExtensionVersion: ESPN_COMPANION_MIN_VERSION
  }, targetOrigin);
}

function sanitizeEspnDraftSnapshot(snapshot, settings) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  settings = settings || getEspnSyncSettings();
  var totalPicks = Math.max(1, Math.min(
    ESPN_SYNC_MAX_PICKS,
    Math.trunc(Number(settings.totalPicks) || 1)
  ));
  var expectedCompleted = Math.trunc(Number(snapshot.expectedCompleted) || 0);
  expectedCompleted = Math.max(0, Math.min(totalPicks, expectedCompleted));
  return {
    picks: Array.isArray(snapshot.picks) ? snapshot.picks.slice(0, totalPicks) : [],
    unavailablePlayers: Array.isArray(snapshot.unavailablePlayers)
      ? snapshot.unavailablePlayers.slice(0, ESPN_SYNC_MAX_BOARD_PLAYERS)
      : [],
    marketAdp: Array.isArray(snapshot.marketAdp)
      ? snapshot.marketAdp.slice(0, ESPN_SYNC_MAX_BOARD_PLAYERS)
      : [],
    expectedCompleted: expectedCompleted,
    marketUpdatedAt: snapshot.marketUpdatedAt == null
      ? null
      : String(snapshot.marketUpdatedAt).slice(0, 80)
  };
}

function applyEspnDraftSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  if (snapshot.draftKey && !selectEspnDraftSession(snapshot.draftKey)) {
    updateEspnSyncStatus('error', 'ESPN sync paused · current draft could not be saved before switching draft sessions');
    return null;
  }
  if (snapshot.config) applyEspnSyncSettings(snapshot.config);
  var settings = getEspnSyncSettings();
  var sanitizedSnapshot = sanitizeEspnDraftSnapshot(snapshot, settings);
  if (!sanitizedSnapshot) return null;
  var incoming = sanitizedSnapshot.picks;
  var incomingUnavailable = sanitizedSnapshot.unavailablePlayers;
  var incomingMarketAdp = sanitizedSnapshot.marketAdp;
  incomingMarketAdp.forEach(function(player) {
    var row = findDraftRowByExpertName(player && player.playerName);
    var espnAdp = Number(player && player.adp);
    var espnRank = Number(player && player.rank);
    if (!row) return;
    if (Number.isFinite(espnAdp) && espnAdp > 0) row.setAttribute('data-espn-adp', String(espnAdp));
    if (Number.isFinite(espnRank) && espnRank > 0) row.setAttribute('data-espn-rank', String(espnRank));
    updateDraftRowMarketCell(row);
    updateDraftRowNoteCell(row);
    updateDraftRowValueCell(row);
  });
  var picksByNumber = new Map();

  incoming.forEach(function(rawPick) {
    var pick = sanitizeEspnDraftPick(rawPick, settings.totalPicks);
    if (pick && !picksByNumber.has(pick.overallPick)) {
      picksByNumber.set(pick.overallPick, pick);
    }
  });

  var picks = Array.from(picksByNumber.values()).sort(function(a, b) {
    return a.overallPick - b.overallPick;
  });
  latestEspnSyncMeta = {
    draftComplete: Boolean(snapshot.draftComplete),
    expectedCompleted: sanitizedSnapshot.expectedCompleted,
    numberedPicks: picks.length,
    marketAdpCount: incomingMarketAdp.filter(function(player) {
      return Boolean(findDraftRowByExpertName(player && player.playerName)) && Number(player && player.adp) > 0;
    }).length,
    marketRankCount: incomingMarketAdp.filter(function(player) {
      return Boolean(findDraftRowByExpertName(player && player.playerName)) && Number(player && player.rank) > 0;
    }).length,
    marketUpdatedAt: sanitizedSnapshot.marketUpdatedAt
  };
  window.latestEspnSyncMeta = latestEspnSyncMeta;
  var signature = JSON.stringify({
    draftSlot: settings.draftSlot,
    teams: settings.teams,
    draftComplete: latestEspnSyncMeta.draftComplete,
    expectedCompleted: latestEspnSyncMeta.expectedCompleted,
    picks: picks.map(function(pick) {
      return [pick.overallPick, pick.espnPlayerId, pick.playerName, pick.position, pick.teamSlot, pick.teamId, pick.isMine];
    }),
    unavailablePlayers: incomingUnavailable.map(function(player) {
      return [String(player.playerName || ''), normalizeEspnSyncPosition(player.position)];
    }),
    marketAdp: incomingMarketAdp.map(function(player) {
      return [String(player.playerName || ''), Number(player.rank) || null, Number(player.adp) || null];
    })
  });

  if (signature === espnSyncLastSignature && !snapshot.force) {
    publishEspnSyncAck(latestEspnSyncResult);
    return latestEspnSyncResult;
  }

  document.querySelectorAll('tr.draftrow[data-sync-source="espn"]').forEach(function(row) {
    row.classList.remove('drafted-mine', 'drafted-other');
    row.removeAttribute('data-pick');
    row.removeAttribute('data-team-slot');
    row.removeAttribute('data-team-id');
    row.removeAttribute('data-sync-method');
    row.removeAttribute('data-sync-source');
    row.removeAttribute('data-espn-player-id');
  });

  var applied = 0;
  var mine = 0;
  var unmatched = [];
  var usedRows = new Set();

  function resolveSnapshotRow(pick) {
    if (pick && pick.espnPlayerId) {
      var escapedId = typeof CSS !== 'undefined' && CSS.escape
        ? CSS.escape(String(pick.espnPlayerId))
        : String(pick.espnPlayerId).replace(/["\\]/g, '\\$&');
      var idRow = document.querySelector('tr.draftrow[data-espn-player-id="' + escapedId + '"]');
      if (idRow) return idRow;
    }
    return resolveEspnDraftRow(pick && pick.playerName, pick && pick.position);
  }

  picks.forEach(function(pick) {
    var row = resolveSnapshotRow(pick);
    if (!row || usedRows.has(row)) {
      unmatched.push({
        overallPick: pick.overallPick,
        playerName: pick.playerName,
        position: pick.position
      });
      return;
    }

    usedRows.add(row);
    row.classList.remove('drafted-mine', 'drafted-other');
    var isMine = typeof pick.isMine === 'boolean'
      ? pick.isMine
      : Number(pick.teamSlot) === Number(settings.draftSlot);
    row.classList.add(isMine ? 'drafted-mine' : 'drafted-other');
    row.setAttribute('data-pick', String(pick.overallPick));
    if (pick.teamSlot) row.setAttribute('data-team-slot', String(pick.teamSlot));
    if (pick.teamId) row.setAttribute('data-team-id', pick.teamId);
    row.setAttribute('data-sync-method', pick.method);
    row.setAttribute('data-sync-source', 'espn');
    if (pick.espnPlayerId) row.setAttribute('data-espn-player-id', pick.espnPlayerId);
    applied++;
    if (isMine) mine++;
  });

  var unavailableApplied = 0;
  incomingUnavailable.forEach(function(player) {
    var playerName = String(player && player.playerName || '').trim();
    var position = normalizeEspnSyncPosition(player && player.position);
    if (!playerName || !position) return;
    var row = resolveEspnDraftRow(playerName, position);
    if (!row || usedRows.has(row) || row.classList.contains('drafted-mine')) return;
    usedRows.add(row);
    row.classList.remove('drafted-mine');
    row.classList.add('drafted-other');
    row.setAttribute('data-sync-source', 'espn');
    row.setAttribute('data-sync-method', 'drafted-label');
    if (player.espnPlayerId) {
      row.setAttribute('data-espn-player-id', String(player.espnPlayerId).slice(0, 40));
    }
    unavailableApplied++;
  });

  espnSyncLastSignature = signature;
  latestEspnSyncResult = {
    captured: picks.length,
    applied: applied,
    mine: mine,
    unmatched: unmatched,
    unavailableApplied: unavailableApplied,
    latestPick: picks.length ? picks[picks.length - 1].overallPick : 0,
    syncedAt: new Date().toISOString()
  };
  window.latestEspnSyncResult = latestEspnSyncResult;

  if (unmatched.length) {
    updateEspnSyncStatus(
      'error',
      'ESPN Sync · ' + applied + ' applied · ' + unmatched.length + ' unmatched'
    );
  } else {
    updateEspnSyncStatus(
      'connected',
      'ESPN Sync · ' + applied + ' picks' +
        (unavailableApplied ? ' · ' + unavailableApplied + ' drafted labels' : '') +
        ' · Market 300/' + latestEspnSyncMeta.marketAdpCount
    );
  }

  triggerAllBoardUpdates({deferIntelligence: true});
  scheduleSave();
  renderRankingsRefreshStatus();
  publishEspnSyncAck(latestEspnSyncResult);
  return latestEspnSyncResult;
}

window.addEventListener('message', function(event) {
  var expectedOrigin = window.location.origin;
  if (
    event.source !== window ||
    (expectedOrigin !== 'null' && event.origin !== expectedOrigin) ||
    !event.data ||
    typeof event.data !== 'object' ||
    Array.isArray(event.data) ||
    event.data.channel !== ESPN_SYNC_CHANNEL
  ) return;

  if (event.data.type === 'EXTENSION_STATUS') {
    var installedVersion = String(event.data.extensionVersion || '').trim();
    var versionParts = function(value) {
      return String(value || '').split('.').map(function(part) { return parseInt(part, 10) || 0; });
    };
    var installedParts = versionParts(installedVersion);
    var requiredParts = versionParts(ESPN_COMPANION_MIN_VERSION);
    var outdated = false;
    for (var versionIndex = 0; versionIndex < Math.max(installedParts.length, requiredParts.length); versionIndex++) {
      if ((installedParts[versionIndex] || 0) === (requiredParts[versionIndex] || 0)) continue;
      outdated = (installedParts[versionIndex] || 0) < (requiredParts[versionIndex] || 0);
      break;
    }
    updateEspnSyncStatus(
      outdated ? 'error' : event.data.status === 'scanning' ? 'syncing' : 'connected',
      outdated
        ? 'ESPN Companion ' + (installedVersion || 'unknown') + ' is outdated · reload version ' + ESPN_COMPANION_MIN_VERSION
        : (event.data.detail || 'ESPN companion connected') + (installedVersion ? ' · v' + installedVersion : '')
    );
    publishEspnSyncAck(latestEspnSyncResult);
  }

  if (
    event.data.type === 'PICKS_SNAPSHOT' &&
    event.data.snapshot &&
    typeof event.data.snapshot === 'object' &&
    !Array.isArray(event.data.snapshot)
  ) {
    applyEspnDraftSnapshot(event.data.snapshot);
  }
});

window.WarRoomEspnSync = {
  version: 1,
  applySnapshot: applyEspnDraftSnapshot,
  applySettings: applyEspnSyncSettings,
  sanitizeSnapshot: function(snapshot) { return sanitizeEspnDraftSnapshot(snapshot, getEspnSyncSettings()); },
  resolvePlayer: resolveEspnDraftRow,
  settings: getEspnSyncSettings
};

function setDraftMarkMode(mode) {
  draftMarkMode = mode === 'mine' ? 'mine' : 'taken';
  document.querySelectorAll('.mark-mode-btn').forEach(function(button) {
    var active = button.getAttribute('data-mark-mode') === draftMarkMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  refreshDraftRowAccessibility();
}

function shouldIgnoreDraftMarkShortcut(event) {
  var target = event && event.target;
  if (!target) return false;
  return Boolean(
    event.ctrlKey || event.metaKey || event.altKey ||
    target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]') ||
    document.body.classList.contains('edit-mode')
  );
}

function setupDraftMarkModeShortcut() {
  if (document.body.getAttribute('data-mark-shortcut-ready') === 'true') return;
  document.body.setAttribute('data-mark-shortcut-ready', 'true');
  document.addEventListener('keydown', function(event) {
    if (String(event.key || '').toLowerCase() !== 'm' || event.repeat || shouldIgnoreDraftMarkShortcut(event)) return;
    event.preventDefault();
    setDraftMarkMode(draftMarkMode === 'mine' ? 'taken' : 'mine');
    var announcer = document.getElementById('draft-action-announcer');
    if (announcer) announcer.textContent = 'Player marking mode changed to ' + draftMarkMode + '.';
  });
}

function clearDraftRowMetadata(row) {
  ['data-pick', 'data-team-slot', 'data-sync-source', 'data-espn-player-id',
    'data-team-id', 'data-sync-method'].forEach(function(attribute) {
    row.removeAttribute(attribute);
  });
}

function assignManualDraftMetadata(row, isMine) {
  var draftState = getDraftAssistantState();
  var currentPick = Number(row.getAttribute('data-pick')) || Number(draftState.currentPick) || 0;
  var teams = Number(draftState.teams) || LEAGUE_SIZE || 10;
  var mapping = getSnakeDraftTeamForPick(currentPick, teams);

  row.removeAttribute('data-sync-source');
  row.removeAttribute('data-espn-player-id');
  row.removeAttribute('data-team-id');
  row.removeAttribute('data-sync-method');

  if (currentPick > 0) row.setAttribute('data-pick', String(currentPick));
  if (isMine) {
    row.setAttribute('data-team-slot', String(Number(draftState.draftSlot) || MY_DRAFT_SLOT || 1));
  } else if (mapping && mapping.teamSlot) {
    row.setAttribute('data-team-slot', String(mapping.teamSlot));
  }
}

function getDraftRowStatus(row) {
  if (row.classList.contains('drafted-mine')) return 'mine';
  if (row.classList.contains('drafted-other')) return 'taken';
  return 'available';
}

function updateDraftRowAccessibility(row) {
  if (!row) return;
  var name = getDraftRowDisplayName(row);
  var position = row.getAttribute('data-pos') || '';
  var status = getDraftRowStatus(row);
  var action = status === draftMarkMode
    ? 'clear this status'
    : 'mark as ' + (draftMarkMode === 'mine' ? 'Mine' : 'Taken');
  row.setAttribute('aria-label', [name, position, status, 'Press Enter to ' + action].filter(Boolean).join('. '));
}

function isDraftRowKeyboardVisible(row) {
  if (!row || row.classList.contains('hidden-row')) return false;
  var tier = row.closest('tbody.tier-group');
  return !tier || !tier.classList.contains('is-collapsed') || tier.classList.contains('is-temporarily-expanded');
}

function refreshDraftRowAccessibility(preferredRow) {
  var rows = getCachedDraftRows();
  var visibleRows = rows.filter(isDraftRowKeyboardVisible);
  var focusRow = preferredRow && visibleRows.indexOf(preferredRow) >= 0
    ? preferredRow
    : visibleRows[0] || null;

  rows.forEach(function(row) {
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', row === focusRow ? '0' : '-1');
    updateDraftRowAccessibility(row);
  });
}

function announceDraftAction(row) {
  var announcer = document.getElementById('draft-action-announcer');
  if (!announcer || !row) return;
  var status = getDraftRowStatus(row);
  announcer.textContent = getDraftRowDisplayName(row) + ' marked ' + status + '.';
}

function setupDraftBoardInteractions() {
  var table = document.getElementById('big-table');
  if (!table || table.getAttribute('data-interactions-ready') === 'true') return;
  table.setAttribute('data-interactions-ready', 'true');

  table.addEventListener('click', function(event) {
    if (event.target.closest('button, select, input, a')) return;
    var row = event.target.closest('tr.draftrow');
    if (row) toggleDraft(row);
  });

  table.addEventListener('keydown', function(event) {
    var row = event.target.closest('tr.draftrow');
    if (!row) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleDraft(row);
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    var visibleRows = getCachedDraftRows().filter(isDraftRowKeyboardVisible);
    var index = visibleRows.indexOf(row);
    var direction = event.key === 'ArrowDown' ? 1 : -1;
    var next = visibleRows[Math.max(0, Math.min(visibleRows.length - 1, index + direction))];
    if (next) {
      refreshDraftRowAccessibility(next);
      next.focus();
    }
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      var auditModal = document.getElementById('mock-audit-modal');
      if (auditModal && auditModal.classList.contains('open')) {
        event.preventDefault();
        closeMockAudit();
        return;
      }
      var modal = document.getElementById('final-summary-modal');
      if (modal && modal.classList.contains('open')) {
        event.preventDefault();
        closeFinalDraftSummary();
      }
    }
  });
}

function toggleDraft(row) {
  if (!row || document.body.classList.contains('edit-mode')) return;

  var currentStatus = getDraftRowStatus(row);
  var desiredStatus = draftMarkMode;

  row.classList.remove('drafted-mine', 'drafted-other');
  if (currentStatus === desiredStatus) {
    clearDraftRowMetadata(row);
  } else {
    row.classList.add(desiredStatus === 'mine' ? 'drafted-mine' : 'drafted-other');
    assignManualDraftMetadata(row, desiredStatus === 'mine');
  }

  updateDraftRowAccessibility(row);
  announceDraftAction(row);
  if (desiredStatus === 'mine') setDraftMarkMode('taken');
  triggerAllBoardUpdates({deferIntelligence: true});
  scheduleSave();
}
function resetBoard(){
  var btn = document.getElementById('resetBtn');
  if(!resetArmed){
    resetArmed = true;
    if(btn) {
      btn.innerText = 'Tap again to confirm';
      btn.classList.add('armed');
    }
    resetArmTimer = setTimeout(function(){
      resetArmed = false;
      if(btn) {
        btn.innerText = 'Reset all';
        btn.classList.remove('armed');
      }
    }, 3000);
    return;
  }
  clearTimeout(resetArmTimer);
  resetArmed = false;
  document.querySelectorAll('tr.draftrow').forEach(function(row){
    row.classList.remove('drafted-mine','drafted-other');
    row.removeAttribute('data-pick');
    row.removeAttribute('data-team-slot');
    row.removeAttribute('data-sync-source');
    row.removeAttribute('data-espn-player-id');
    row.removeAttribute('data-team-id');
    row.removeAttribute('data-sync-method');
  });
  try { localStorage.removeItem(getDraftSessionFinalKey()); } catch(e) {}
  closeFinalDraftSummary();
  triggerAllBoardUpdates();
  if(btn) {
    btn.innerText = 'Reset all';
    btn.classList.remove('armed');
  }
  scheduleSave();
}

function getDraftSessionStateKey(id) { return AUTOSAVE_KEY + ':' + String(id || activeDraftSessionId); }
function getDraftSessionFinalKey(id) { return FINAL_SUMMARY_SHOWN_KEY + ':' + String(id || activeDraftSessionId); }

function readDraftStorageValue(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('War Room storage read failed for ' + key + ':', error);
    return null;
  }
}

function writeDraftStorageValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('War Room storage write failed for ' + key + ':', error);
    return false;
  }
}

function removeDraftStorageValue(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('War Room storage removal failed for ' + key + ':', error);
    return false;
  }
}

function isDraftStorageObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeDraftSessionId(value) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 120);
}

function normalizeDraftSessionName(value, fallback) {
  var name = String(value == null ? '' : value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  return name || fallback || 'Draft';
}

function normalizeDraftKey(value) {
  var key = String(value == null ? '' : value)
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 120);
  return key || null;
}

function normalizeDraftSessionRegistry(value) {
  if (!Array.isArray(value)) return [];
  var seen = new Set();
  var normalized = [];
  value.slice(0, 100).forEach(function(session, index) {
    if (!isDraftStorageObject(session)) return;
    var id = normalizeDraftSessionId(session.id);
    if (!id || seen.has(id)) return;
    seen.add(id);
    normalized.push({
      id: id,
      name: normalizeDraftSessionName(session.name, 'Draft ' + (normalized.length + 1)),
      createdAt: String(session.createdAt || '').slice(0, 40) || new Date().toISOString(),
      draftKey: normalizeDraftKey(session.draftKey)
    });
  });
  return normalized;
}

function quarantineCorruptStorageValue(key, raw) {
  if (raw == null) return null;
  var backupKey = key + ':corrupt-backup:' + Date.now().toString(36);
  try {
    localStorage.setItem(backupKey, String(raw));
    localStorage.removeItem(key);
    console.warn('Corrupt War Room storage was isolated at ' + backupKey + '.');
    return backupKey;
  } catch (error) {
    console.warn('Corrupt War Room storage could not be isolated safely:', error);
    return null;
  }
}

function clampDraftStorageInteger(value, minimum, maximum, fallback) {
  var number = Number(value);
  if (!Number.isFinite(number)) number = Number(fallback);
  if (!Number.isFinite(number)) number = minimum;
  return Math.max(minimum, Math.min(maximum, Math.trunc(number)));
}

function normalizeSavedDraftPayload(payload) {
  if (!isDraftStorageObject(payload)) return null;

  var teams = clampDraftStorageInteger(payload.teams, 2, 20, LEAGUE_SIZE || 10);
  var slot = clampDraftStorageInteger(payload.slot, 1, teams, Math.min(MY_DRAFT_SLOT || 1, teams));
  var rounds = clampDraftStorageInteger(payload.rounds, 1, 30, TOTAL_ROUNDS || 16);
  var totalPicks = teams * rounds;
  var state = {};
  var draftMeta = {};

  if (isDraftStorageObject(payload.state)) {
    Object.keys(payload.state).slice(0, 2000).forEach(function(rawName) {
      var name = String(rawName || '').trim().slice(0, 120);
      var status = payload.state[rawName];
      if (name && (status === 'mine' || status === 'taken')) state[name] = status;
    });
  }

  if (isDraftStorageObject(payload.draftMeta)) {
    Object.keys(payload.draftMeta).slice(0, 2000).forEach(function(rawName) {
      var name = String(rawName || '').trim().slice(0, 120);
      var metadata = payload.draftMeta[rawName];
      if (!name || !state[name] || !isDraftStorageObject(metadata)) return;
      var pick = Number(metadata.pick);
      var teamSlot = Number(metadata.teamSlot);
      var source = metadata.source === 'espn' ? 'espn' : null;
      var espnPlayerId = metadata.espnPlayerId == null ? null : String(metadata.espnPlayerId).slice(0, 40);
      pick = Number.isInteger(pick) && pick >= 1 && pick <= totalPicks ? pick : null;
      teamSlot = Number.isInteger(teamSlot) && teamSlot >= 1 && teamSlot <= teams ? teamSlot : null;
      if (pick || teamSlot || source || espnPlayerId) {
        draftMeta[name] = {pick:pick, teamSlot:teamSlot, source:source, espnPlayerId:espnPlayerId};
      }
    });
  }

  var allowedTiers = new Set(['Sp', 'S', 'A', 'B', 'C', 'D', 'E', 'F']);
  var order = Array.isArray(payload.order)
    ? payload.order.slice(0, 2000).map(function(item) {
        if (!isDraftStorageObject(item)) return null;
        var name = String(item.n || '').trim().slice(0, 120);
        var tier = String(item.t || '').trim();
        return name && allowedTiers.has(tier) ? {n:name, t:tier} : null;
      }).filter(Boolean)
    : [];

  return {
    version: 2,
    savedAt: typeof payload.savedAt === 'string' ? payload.savedAt.slice(0, 80) : '',
    datasetSnapshotDate: typeof payload.datasetSnapshotDate === 'string' ? payload.datasetSnapshotDate.slice(0, 40) : null,
    customBoard: Boolean(payload.customBoard),
    teams: teams,
    slot: slot,
    rounds: rounds,
    recommendationAudit: Array.isArray(payload.recommendationAudit)
      ? payload.recommendationAudit.filter(isDraftStorageObject).slice(-200)
      : [],
    autoDraftTeamSlots: Array.isArray(payload.autoDraftTeamSlots) ? payload.autoDraftTeamSlots.slice(0, 20) : [],
    state: state,
    draftMeta: draftMeta,
    order: order
  };
}

function readDraftSessionPayload(id) {
  var key = getDraftSessionStateKey(id);
  var raw = null;
  try {
    raw = localStorage.getItem(key);
  } catch (error) {
    console.warn('War Room saved draft storage is unavailable:', error);
    return {status:'storage-error', payload:null, backupKey:null};
  }
  if (!raw) return {status:'missing', payload:null, backupKey:null};

  var parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {status:'corrupt', payload:null, backupKey:quarantineCorruptStorageValue(key, raw)};
  }

  var payload = normalizeSavedDraftPayload(parsed);
  if (!payload) {
    return {status:'corrupt', payload:null, backupKey:quarantineCorruptStorageValue(key, raw)};
  }
  return {status:'ok', payload:payload, backupKey:null};
}

function removeDraftSessionRecoveryBackups(id) {
  var prefix = getDraftSessionStateKey(id) + ':corrupt-backup:';
  try {
    for (var index = localStorage.length - 1; index >= 0; index--) {
      var key = localStorage.key(index);
      if (key && key.indexOf(prefix) === 0) localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('Draft recovery backups could not be cleaned up:', error);
  }
}

function readDraftSessionRegistry() {
  var raw = null;
  try {
    raw = localStorage.getItem(DRAFT_SESSION_REGISTRY_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      quarantineCorruptStorageValue(DRAFT_SESSION_REGISTRY_KEY, raw);
      return [];
    }
    var normalized = normalizeDraftSessionRegistry(parsed);
    if (JSON.stringify(normalized) !== JSON.stringify(parsed)) writeDraftSessionRegistry(normalized);
    return normalized;
  } catch (error) {
    if (raw != null) quarantineCorruptStorageValue(DRAFT_SESSION_REGISTRY_KEY, raw);
    return [];
  }
}

function writeDraftSessionRegistry(sessions) {
  var normalized = normalizeDraftSessionRegistry(sessions);
  try {
    localStorage.setItem(DRAFT_SESSION_REGISTRY_KEY, JSON.stringify(normalized));
    return true;
  } catch (error) {
    console.warn('Draft session registry save failed', error);
    return false;
  }
}

function initializeDraftSessions() {
  var sessions = readDraftSessionRegistry();
  if (!sessions.length) {
    var legacyState = readDraftStorageValue(AUTOSAVE_KEY);
    activeDraftSessionId = 'legacy';
    sessions = [{id:'legacy', name:legacyState ? 'Imported Draft' : 'Draft 1', createdAt:new Date().toISOString()}];
    if (legacyState) writeDraftStorageValue(getDraftSessionStateKey('legacy'), legacyState);
    if (readDraftStorageValue(FINAL_SUMMARY_SHOWN_KEY) === '1') {
      writeDraftStorageValue(getDraftSessionFinalKey('legacy'), '1');
    }
    writeDraftSessionRegistry(sessions);
  } else {
    activeDraftSessionId = normalizeDraftSessionId(readDraftStorageValue(ACTIVE_DRAFT_SESSION_KEY)) || sessions[0].id;
    if (!sessions.some(function(session) { return session.id === activeDraftSessionId; })) activeDraftSessionId = sessions[0].id;
  }
  writeDraftStorageValue(ACTIVE_DRAFT_SESSION_KEY, activeDraftSessionId);
  renderDraftSessionSelector(sessions);
}

function renderDraftSessionSelector(sessionsOverride) {
  var select = document.getElementById('draftSessionSelect');
  if (!select) return;
  select.innerHTML = '';
  var sessions = Array.isArray(sessionsOverride)
    ? normalizeDraftSessionRegistry(sessionsOverride)
    : readDraftSessionRegistry();
  sessions.forEach(function(session) {
    var option = document.createElement('option');
    option.value = session.id;
    option.textContent = session.name;
    option.selected = session.id === activeDraftSessionId;
    select.appendChild(option);
  });
}

function clearDraftStateFromBoard() {
  getCachedDraftRows().forEach(function(row) {
    row.classList.remove('drafted-mine', 'drafted-other');
    clearDraftRowMetadata(row);
  });
  customBoardEnabled = false;
  recommendationAudit = [];
}

function announceDraftSessionTransitionFailure(message) {
  var announcer = document.getElementById('draft-action-announcer');
  if (announcer) announcer.textContent = message;
}

function switchDraftSession(id) {
  var safeId = normalizeDraftSessionId(id);
  var sessions = readDraftSessionRegistry();
  if (!safeId || !sessions.some(function(session) { return session.id === safeId; })) return false;
  if (safeId === activeDraftSessionId) return true;
  resetDeleteDraftButton();

  if (!saveState()) {
    announceDraftSessionTransitionFailure('Draft switch blocked because the current draft could not be saved.');
    renderDraftSessionSelector(sessions);
    return false;
  }
  if (!writeDraftStorageValue(ACTIVE_DRAFT_SESSION_KEY, safeId)) {
    announceDraftSessionTransitionFailure('Draft switch blocked because browser storage could not activate the selected draft.');
    renderDraftSessionSelector(sessions);
    return false;
  }

  activeDraftSessionId = safeId;
  clearDraftStateFromBoard();
  loadState();
  renderDraftSessionSelector(sessions);
  return true;
}

function createUniqueDraftSessionId(baseId, sessions) {
  var safeBase = normalizeDraftSessionId(baseId) || ('draft-' + Date.now().toString(36));
  var existingIds = new Set((sessions || []).map(function(session) { return session.id; }));
  if (!existingIds.has(safeBase)) return safeBase;
  var suffix = 2;
  var candidate = safeBase;
  do {
    candidate = normalizeDraftSessionId(safeBase.slice(0, 110) + '-' + suffix);
    suffix++;
  } while (existingIds.has(candidate));
  return candidate;
}

function createNewDraftSession(options) {
  options = options || {};
  resetDeleteDraftButton();

  if (!saveState()) {
    announceDraftSessionTransitionFailure('New draft blocked because the current draft could not be saved.');
    return null;
  }

  var sessions = readDraftSessionRegistry();
  var originalSessions = sessions.slice();
  var previousActiveId = activeDraftSessionId;
  var requestedId = normalizeDraftSessionId(options.id);
  var safeDraftKey = normalizeDraftKey(options.draftKey);
  if (requestedId && safeDraftKey) {
    var existingExact = sessions.find(function(session) {
      return session.id === requestedId && session.draftKey === safeDraftKey;
    });
    if (existingExact) {
      if (existingExact.id === activeDraftSessionId) return existingExact.id;
      return switchDraftSession(existingExact.id) ? existingExact.id : null;
    }
  }

  var id = createUniqueDraftSessionId(requestedId || ('draft-' + Date.now().toString(36)), sessions);
  sessions.push({
    id:id,
    name:normalizeDraftSessionName(options.name, 'Draft ' + (sessions.length + 1)),
    createdAt:new Date().toISOString(),
    draftKey:safeDraftKey
  });
  if (!writeDraftSessionRegistry(sessions)) {
    announceDraftSessionTransitionFailure('New draft could not be created because browser storage is unavailable.');
    return null;
  }
  if (!writeDraftStorageValue(ACTIVE_DRAFT_SESSION_KEY, id)) {
    writeDraftSessionRegistry(originalSessions);
    announceDraftSessionTransitionFailure('New draft could not be activated because browser storage is unavailable.');
    return null;
  }

  activeDraftSessionId = id;
  clearDraftStateFromBoard();
  renderDraftSessionSelector(sessions);
  triggerAllBoardUpdates();

  if (!saveState()) {
    activeDraftSessionId = previousActiveId;
    writeDraftStorageValue(ACTIVE_DRAFT_SESSION_KEY, previousActiveId);
    writeDraftSessionRegistry(originalSessions);
    removeDraftStorageValue(getDraftSessionStateKey(id));
    removeDraftStorageValue(getDraftSessionFinalKey(id));
    clearDraftStateFromBoard();
    loadState();
    renderDraftSessionSelector(originalSessions);
    announceDraftSessionTransitionFailure('New draft was rolled back because its initial state could not be saved.');
    return null;
  }

  return id;
}

function resetDeleteDraftButton() {
  deleteDraftArmed = false;
  if (deleteDraftArmTimer) clearTimeout(deleteDraftArmTimer);
  deleteDraftArmTimer = null;
  var button = document.getElementById('deleteDraftBtn');
  if (button) {
    button.textContent = 'Delete Draft';
    button.classList.remove('armed');
    button.setAttribute('aria-label', 'Delete selected draft');
  }
}

function deleteActiveDraftSession() {
  var sessions = readDraftSessionRegistry();
  var activeSession = sessions.find(function(session) { return session.id === activeDraftSessionId; });
  if (!activeSession) return;

  var button = document.getElementById('deleteDraftBtn');
  if (!deleteDraftArmed) {
    deleteDraftArmed = true;
    if (button) {
      button.textContent = 'Confirm Delete';
      button.classList.add('armed');
      button.setAttribute('aria-label', 'Confirm deletion of ' + activeSession.name);
    }
    deleteDraftArmTimer = setTimeout(resetDeleteDraftButton, 3000);
    return;
  }

  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
  var deletedId = activeSession.id;
  var remainingSessions = sessions.filter(function(session) { return session.id !== deletedId; });

  if (!remainingSessions.length) {
    var replacementId = 'draft-' + Date.now().toString(36);
    remainingSessions.push({id:replacementId, name:'Draft 1', createdAt:new Date().toISOString()});
  }

  /* Commit the registry first. If browser storage rejects the write, abort
   * without deleting the draft payload so a quota/privacy failure cannot
   * strand a listed session with its data already removed. */
  if (!writeDraftSessionRegistry(remainingSessions)) {
    resetDeleteDraftButton();
    var failedAnnouncer = document.getElementById('draft-action-announcer');
    if (failedAnnouncer) failedAnnouncer.textContent = activeSession.name + ' could not be deleted because browser storage is unavailable.';
    return false;
  }

  removeDraftStorageValue(getDraftSessionStateKey(deletedId));
  removeDraftStorageValue(getDraftSessionFinalKey(deletedId));
  removeDraftSessionRecoveryBackups(deletedId);

  activeDraftSessionId = remainingSessions[0].id;
  writeDraftStorageValue(ACTIVE_DRAFT_SESSION_KEY, activeDraftSessionId);

  var replacementState = readDraftStorageValue(getDraftSessionStateKey(activeDraftSessionId));
  if (replacementState) writeDraftStorageValue(AUTOSAVE_KEY, replacementState);
  else removeDraftStorageValue(AUTOSAVE_KEY);

  resetDeleteDraftButton();
  closeFinalDraftSummary();
  clearDraftStateFromBoard();
  loadState();
  renderDraftSessionSelector(remainingSessions);
  var announcer = document.getElementById('draft-action-announcer');
  if (announcer) announcer.textContent = activeSession.name + ' deleted. ' + remainingSessions[0].name + ' is now active.';
  return true;
}

function selectEspnDraftSession(draftKey) {
  var safeKey = normalizeDraftKey(draftKey);
  if (!safeKey) return false;
  var sessions = readDraftSessionRegistry();
  var match = sessions.find(function(session) { return session.draftKey === safeKey; });
  if (match) {
    return match.id === activeDraftSessionId ? true : switchDraftSession(match.id);
  }
  var id = createNewDraftSession({
    id:'espn-' + canonicalExpertPlayerName(safeKey),
    name:'ESPN Draft',
    draftKey:safeKey
  });
  return Boolean(id && id === activeDraftSessionId);
}

function saveState(){
  try{
    var state = {};
    var draftMeta = {};
    getCachedDraftRows().forEach(function(row){
      var name = row.getAttribute('data-name');
      if(name) {
        if(row.classList.contains('drafted-mine')) state[name] = 'mine';
        else if(row.classList.contains('drafted-other')) state[name] = 'taken';

        if(state[name]) {
          var pick = Number(row.getAttribute('data-pick')) || null;
          var teamSlot = Number(row.getAttribute('data-team-slot')) || null;
          var source = row.getAttribute('data-sync-source') || null;
          var espnPlayerId = row.getAttribute('data-espn-player-id') || null;
          if(pick || teamSlot || source || espnPlayerId) {
            draftMeta[name] = {
              pick: pick,
              teamSlot: teamSlot,
              source: source,
              espnPlayerId: espnPlayerId
            };
          }
        }
      }
    });
    var hasAuthoritativeBoard =
      typeof EXPERT_RANKINGS_2026 !== 'undefined' &&
      Array.isArray(EXPERT_RANKINGS_2026) &&
      EXPERT_RANKINGS_2026.length > 0;
    var order = [];

    /* Persist authoritative-board ordering only when the user explicitly
     * enables Custom Board mode. The snapshot date prevents stale overrides
     * from silently replacing a future FantasyPros refresh. */
    if (customBoardEnabled || !hasAuthoritativeBoard) {
      document.querySelectorAll('tbody.tier-group').forEach(function(tbody){
        var tid = tbody.id.replace('tbody-','');
        tbody.querySelectorAll('tr.draftrow').forEach(function(row){
          var name = row.getAttribute('data-name');
          if(name) order.push({n: name, t: tid});
        });
      });
    }
    var payload = {
      version: 2,
      savedAt: new Date().toISOString(),
      datasetSnapshotDate: typeof FANTASYPROS_2026_DATASET_META !== 'undefined'
        ? FANTASYPROS_2026_DATASET_META.sourceSnapshotDate || null
        : null,
      customBoard: customBoardEnabled,
      teams: LEAGUE_SIZE,
      slot: MY_DRAFT_SLOT,
      rounds: TOTAL_ROUNDS,
      recommendationAudit: recommendationAudit,
      autoDraftTeamSlots: autoDraftTeamSlots.slice(),
      state: state,
      draftMeta: draftMeta,
      order: order
    };
    var serializedPayload = JSON.stringify(payload);
    localStorage.setItem(getDraftSessionStateKey(), serializedPayload);
    /* Compatibility mirror for older companion/tests. Session loading never
     * reads this key after migration, so drafts remain isolated. */
    localStorage.setItem(AUTOSAVE_KEY, serializedPayload);
    flashSaveIndicator('Saved', '#8fd4a0');
    var diagEl = document.getElementById('storage-diag'); if(diagEl) diagEl.innerHTML = 'Autosave: On (last saved '+ new Date().toLocaleTimeString()+')';
    return true;
  } catch(e){
    console.error('Autosave failed', e);
    flashSaveIndicator('Autosave failed', '#e08a8a');
    var diagEl = document.getElementById('storage-diag'); if(diagEl) diagEl.innerHTML = '<b>Autosave failed.</b>';
    return false;
  }
}

function scheduleSave(){
  if(!isAutosaveEnabled()) return;
  if(_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(function(){ saveState(); _saveTimer = null; }, 400);
}

function isAutosaveEnabled(){
  try{
    var val = localStorage.getItem(AUTOSAVE_ENABLED_KEY);
    if(val === null) return true;
    return val === '1';
  }catch(e){ return false; }
}

function setAutosaveEnabled(enabled){
  try{ localStorage.setItem(AUTOSAVE_ENABLED_KEY, enabled ? '1' : '0'); }catch(e){}
  var btn = document.getElementById('autosaveToggle'); if(btn){ btn.classList.toggle('active', enabled); btn.innerText = enabled ? 'Autosave On' : 'Autosave Off'; }
  var diagEl = document.getElementById('storage-diag'); if(diagEl){ diagEl.innerHTML = enabled ? 'Autosave: On' : 'Autosave: Off'; }
}

function toggleAutosave(){
  setAutosaveEnabled(!isAutosaveEnabled());
  var btn = document.getElementById('autosaveToggle');
  if(btn){
    var enabled = isAutosaveEnabled();
    btn.innerText = enabled ? 'Autosave On' : 'Autosave Off';
    btn.style.background = enabled ? 'rgba(95,168,124,0.25)' : 'rgba(193,85,75,0.25)';
    btn.style.borderColor = enabled ? '#5fa87c' : '#c1554b';
  }
}

function loadState(){
  applyTeamColors();
  window.ORIGINAL_ORDER = [];
  document.querySelectorAll('tbody.tier-group').forEach(function(tbody){
    var tid = tbody.id.replace('tbody-','');
    tbody.querySelectorAll('tr.draftrow').forEach(function(row){
      var name = row.getAttribute('data-name');
      if(name) window.ORIGINAL_ORDER.push({n: name, t: tid});
    });
  });

  var enabled = isAutosaveEnabled();
  setAutosaveEnabled(enabled);
  var diagEl = document.getElementById('storage-diag');
  
  try{
    if(enabled){
      var storedDraft = readDraftSessionPayload();
      if(storedDraft.status === 'ok'){
        var payload = storedDraft.payload;
        var pcTeams = document.getElementById('pcTeams'); if(payload.teams && pcTeams) pcTeams.value = payload.teams;
        var pcSlot = document.getElementById('pcSlot'); if(payload.slot && pcSlot) pcSlot.value = payload.slot;
        var pcRounds = document.getElementById('pcRounds'); if(payload.rounds && pcRounds) pcRounds.value = payload.rounds;
        
        if (pcTeams && pcTeams.value) LEAGUE_SIZE = parseInt(pcTeams.value, 10) || 10;
        if (pcSlot && pcSlot.value) MY_DRAFT_SLOT = parseInt(pcSlot.value, 10) || 10;
        if (pcRounds && pcRounds.value) TOTAL_ROUNDS = parseInt(pcRounds.value, 10) || 16;
        recommendationAudit = Array.isArray(payload.recommendationAudit)
          ? payload.recommendationAudit.slice(-200)
          : [];
        autoDraftTeamSlots = sanitizeAutoDraftTeamSlots(payload.autoDraftTeamSlots);

        var datasetSnapshotDate = typeof FANTASYPROS_2026_DATASET_META !== 'undefined'
          ? FANTASYPROS_2026_DATASET_META.sourceSnapshotDate || null
          : null;
        var hasExpertBoard = typeof EXPERT_RANKINGS_2026 !== 'undefined' &&
          Array.isArray(EXPERT_RANKINGS_2026) && EXPERT_RANKINGS_2026.length > 0;
        var customSnapshotMatches = Boolean(
          payload.customBoard &&
          payload.datasetSnapshotDate &&
          payload.datasetSnapshotDate === datasetSnapshotDate
        );

        customBoardEnabled = customSnapshotMatches;
        if (payload.order && payload.order.length && (customSnapshotMatches || !hasExpertBoard)) {
          applyCustomOrder(payload.order, true);
        }
        
        if(payload.state) {
          document.querySelectorAll('tr.draftrow').forEach(function(row){
            var name = row.getAttribute('data-name');
            row.classList.remove('drafted-mine','drafted-other');
            row.removeAttribute('data-pick');
            row.removeAttribute('data-team-slot');
            row.removeAttribute('data-sync-source');
            row.removeAttribute('data-espn-player-id');
            if(name && payload.state[name] === 'mine') row.classList.add('drafted-mine');
            else if(name && payload.state[name] === 'taken') row.classList.add('drafted-other');

            var metadata = name && payload.draftMeta ? payload.draftMeta[name] : null;
            if(metadata && Number(metadata.pick) > 0) row.setAttribute('data-pick', String(metadata.pick));
            if(metadata && Number(metadata.teamSlot) > 0) row.setAttribute('data-team-slot', String(metadata.teamSlot));
            if(metadata && metadata.source === 'espn') row.setAttribute('data-sync-source', 'espn');
            if(metadata && metadata.espnPlayerId) row.setAttribute('data-espn-player-id', String(metadata.espnPlayerId));
          });
        }
        if(diagEl) diagEl.textContent = 'Autosave: restored backup from ' + (payload.savedAt || 'previous session');
      } else if (storedDraft.status === 'corrupt') {
        if(diagEl) diagEl.textContent = storedDraft.backupKey
          ? 'Autosave: corrupt draft ignored; recovery copy preserved.'
          : 'Autosave: corrupt draft ignored; recovery copy could not be written.';
      } else if (storedDraft.status === 'storage-error') {
        if(diagEl) diagEl.textContent = 'Autosave storage is unavailable.';
      } else {
        if(diagEl) diagEl.textContent = 'Autosave: No prior backup found.';
      }
    } else {
      if(diagEl) diagEl.innerHTML = 'Autosave is disabled.';
    }
  } catch(e){
    console.error('Restore from autosave failed', e);
    if(diagEl) diagEl.innerHTML = '<b>Autosave restore failed.</b>';
  }
  
  updateCustomBoardUi();
  refreshDraftRowAccessibility();
  triggerAllBoardUpdates();
}

function flashSaveIndicator(text, color){
  var el = document.getElementById('save-indicator');
  if(!el) return;
  el.style.color = color;
  el.innerText = text;
  setTimeout(function(){ el.innerText=''; }, 2000);
}

function syncEditControls(){
  document.querySelectorAll('tr.draftrow').forEach(function(row){
    var select = row.querySelector('.rank-controls select');
    if(!select) return;
    var currentTbody = row.closest('tbody.tier-group');
    if(currentTbody){
      select.value = currentTbody.id.replace('tbody-','');
    }
  });
}

function syncRankData(){

  var overallRank = 1;

  var positionRanks = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0
  };

  document.querySelectorAll('tbody.tier-group').forEach(function(tbody){

    tbody.querySelectorAll('tr.draftrow').forEach(function(row){

      var position =
        row.getAttribute('data-pos');

      /*
       * Update overall rank.
       */
      row.setAttribute(
        'data-rank',
        String(overallRank)
      );

      /*
       * Update visible overall rank.
       */
      var rankCell = row.children[0];

      if(rankCell){

        var roundTag =
          rankCell.querySelector('.round-tag');

        rankCell.textContent =
          String(overallRank);

        if(roundTag){
          rankCell.appendChild(roundTag);
        }
      }

      /*
       * Update positional rank.
       */
      if(positionRanks[position] !== undefined){

        positionRanks[position]++;

        var posRank =
          positionRanks[position];

        var posRankLabel =
          row.querySelector('.posrk');

        if(posRankLabel){

  posRankLabel.textContent =
  position + posRank;
}
      }

      overallRank++;

    });

  });
}
