/* =========================================================
   ESPN EXTERNAL DRAFT PICKS

   ESPN can authoritatively draft a player who is outside the
   717-player FantasyPros ranking universe. Keep those numbered
   picks as draft state without manufacturing a ranked draftrow.
   ========================================================= */

var ESPN_EXTERNAL_PICK_STORAGE_PREFIX = 'war-room-espn-external-picks-v1:';
var espnExternalDraftPicksByNumber = new Map();

function getEspnExternalDraftStateKey(id) {
  return ESPN_EXTERNAL_PICK_STORAGE_PREFIX + String(id || activeDraftSessionId || 'legacy');
}

function cloneEspnExternalPick(pick) {
  return {
    overallPick: Number(pick.overallPick),
    playerName: String(pick.playerName || ''),
    position: String(pick.position || ''),
    teamSlot: pick.teamSlot == null ? null : Number(pick.teamSlot),
    teamId: pick.teamId == null ? null : String(pick.teamId),
    isMine: typeof pick.isMine === 'boolean' ? pick.isMine : null,
    method: String(pick.method || 'dom'),
    espnPlayerId: pick.espnPlayerId == null ? null : String(pick.espnPlayerId)
  };
}

function getEspnExternalDraftPicks() {
  return Array.from(espnExternalDraftPicksByNumber.values())
    .sort(function(left, right) { return Number(left.overallPick) - Number(right.overallPick); })
    .map(cloneEspnExternalPick);
}

function isEspnDraftPickMine(pick, draftSlot) {
  if (!pick) return false;
  if (typeof pick.isMine === 'boolean') return pick.isMine;
  return Number(pick.teamSlot) > 0 && Number(pick.teamSlot) === Number(draftSlot);
}

function replaceEspnExternalDraftPicks(picks, totalPicks) {
  var maximum = Math.max(1, Math.min(ESPN_SYNC_MAX_PICKS, Number(totalPicks) || ESPN_SYNC_MAX_PICKS));
  var next = new Map();
  (Array.isArray(picks) ? picks : []).forEach(function(rawPick) {
    var pick = sanitizeEspnDraftPick(rawPick, maximum);
    if (!pick || next.has(pick.overallPick)) return;
    next.set(pick.overallPick, pick);
  });
  espnExternalDraftPicksByNumber = next;
  window.espnExternalDraftPicksByNumber = espnExternalDraftPicksByNumber;
  return getEspnExternalDraftPicks();
}

function clearEspnExternalDraftPicks() {
  return replaceEspnExternalDraftPicks([], ESPN_SYNC_MAX_PICKS);
}

function readEspnExternalDraftState(id) {
  if (!isAutosaveEnabled()) {
    return {teams:LEAGUE_SIZE, rounds:TOTAL_ROUNDS, draftSlot:MY_DRAFT_SLOT, picks:[]};
  }
  try {
    var raw = localStorage.getItem(getEspnExternalDraftStateKey(id));
    if (!raw) return {teams:LEAGUE_SIZE, rounds:TOTAL_ROUNDS, draftSlot:MY_DRAFT_SLOT, picks:[]};
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('external pick state is not an object');
    }
    var teams = Math.max(2, Math.min(20, Math.trunc(Number(parsed.teams) || Number(LEAGUE_SIZE) || 10)));
    var rounds = Math.max(5, Math.min(30, Math.trunc(Number(parsed.rounds) || Number(TOTAL_ROUNDS) || 16)));
    var draftSlot = Math.max(1, Math.min(teams, Math.trunc(Number(parsed.draftSlot) || Number(MY_DRAFT_SLOT) || 1)));
    var totalPicks = teams * rounds;
    var picks = [];
    var seen = new Set();
    (Array.isArray(parsed.picks) ? parsed.picks : []).slice(0, totalPicks).forEach(function(rawPick) {
      var pick = sanitizeEspnDraftPick(rawPick, totalPicks);
      if (!pick || seen.has(pick.overallPick)) return;
      seen.add(pick.overallPick);
      picks.push(pick);
    });
    return {teams:teams, rounds:rounds, draftSlot:draftSlot, picks:picks};
  } catch (error) {
    console.warn('External ESPN pick state could not be restored safely:', error);
    return {teams:LEAGUE_SIZE, rounds:TOTAL_ROUNDS, draftSlot:MY_DRAFT_SLOT, picks:[]};
  }
}

function writeEspnExternalDraftState(id) {
  try {
    var settings = getEspnSyncSettings();
    localStorage.setItem(getEspnExternalDraftStateKey(id), JSON.stringify({
      version:1,
      savedAt:new Date().toISOString(),
      teams:settings.teams,
      rounds:settings.rounds,
      draftSlot:settings.draftSlot,
      picks:getEspnExternalDraftPicks()
    }));
    return true;
  } catch (error) {
    console.warn('External ESPN pick state could not be saved:', error);
    return false;
  }
}

function removeEspnExternalDraftState(id) {
  try {
    localStorage.removeItem(getEspnExternalDraftStateKey(id));
    return true;
  } catch (error) {
    console.warn('External ESPN pick state could not be removed:', error);
    return false;
  }
}

function getExternalAwareCompletedDraftPickCount() {
  var numbers = new Set();
  document.querySelectorAll(
    'tr.draftrow.drafted-mine[data-pick], tr.draftrow.drafted-other[data-pick]'
  ).forEach(function(row) {
    var pick = Number(row.getAttribute('data-pick'));
    if (Number.isInteger(pick) && pick > 0) numbers.add(pick);
  });
  getEspnExternalDraftPicks().forEach(function(pick) {
    if (Number.isInteger(Number(pick.overallPick)) && Number(pick.overallPick) > 0) {
      numbers.add(Number(pick.overallPick));
    }
  });
  return numbers.size;
}

function getAcceptedEspnPickNumbers() {
  var numbers = new Set();
  document.querySelectorAll('tr.draftrow[data-sync-source="espn"][data-pick]').forEach(function(row) {
    if (!row.classList.contains('drafted-mine') && !row.classList.contains('drafted-other')) return;
    var pick = Number(row.getAttribute('data-pick'));
    if (Number.isInteger(pick) && pick > 0) numbers.add(pick);
  });
  getEspnExternalDraftPicks().forEach(function(pick) {
    var number = Number(pick.overallPick);
    if (Number.isInteger(number) && number > 0) numbers.add(number);
  });
  return Array.from(numbers).sort(function(left, right) { return left - right; });
}

function getCanonicalEspnAppliedCount() {
  return document.querySelectorAll(
    'tr.draftrow.drafted-mine[data-sync-source="espn"][data-pick], ' +
    'tr.draftrow.drafted-other[data-sync-source="espn"][data-pick]'
  ).length;
}

function snapshotSettingsForExternalPicks(snapshot) {
  var current = getEspnSyncSettings();
  var config = snapshot && snapshot.config && typeof snapshot.config === 'object' ? snapshot.config : {};
  var teams = Math.max(2, Math.min(20, Math.trunc(Number(config.teams) || Number(current.teams) || 10)));
  var rounds = Math.max(5, Math.min(30, Math.trunc(Number(config.rounds) || Number(current.rounds) || 16)));
  var draftSlot = Math.max(1, Math.min(teams, Math.trunc(Number(config.draftSlot) || Number(current.draftSlot) || 1)));
  return {teams:teams, rounds:rounds, draftSlot:draftSlot, totalPicks:teams * rounds};
}

function resolveExternalPickCandidateRow(pick) {
  if (pick && pick.espnPlayerId) {
    var escapedId = typeof CSS !== 'undefined' && CSS.escape
      ? CSS.escape(String(pick.espnPlayerId))
      : String(pick.espnPlayerId).replace(/["\\]/g, '\\$&');
    var idRow = document.querySelector('tr.draftrow[data-espn-player-id="' + escapedId + '"]');
    if (idRow) return idRow;
  }
  return resolveEspnDraftRow(pick && pick.playerName, pick && pick.position);
}

function isCompanionAuthoritySnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return false;
  return Number(snapshot.version) === 1 &&
    typeof snapshot.extensionVersion === 'string' && snapshot.extensionVersion.trim().length > 0 &&
    typeof snapshot.draftKey === 'string' && snapshot.draftKey.trim().length > 0;
}

function classifyEspnSnapshotPicks(snapshot) {
  var settings = snapshotSettingsForExternalPicks(snapshot);
  var sanitized = sanitizeEspnDraftSnapshot(snapshot, settings);
  if (!sanitized) return null;
  var byNumber = new Map();
  var rejected = 0;
  sanitized.picks.forEach(function(rawPick) {
    var pick = sanitizeEspnDraftPick(rawPick, settings.totalPicks);
    if (!pick || byNumber.has(pick.overallPick)) {
      rejected++;
      return;
    }
    byNumber.set(pick.overallPick, pick);
  });
  var picks = Array.from(byNumber.values()).sort(function(left, right) {
    return left.overallPick - right.overallPick;
  });
  var usedRows = new Set();
  var canonical = [];
  var external = [];
  var unresolved = [];
  var companionAuthority = isCompanionAuthoritySnapshot(snapshot, sanitized);

  picks.forEach(function(pick) {
    var row = resolveExternalPickCandidateRow(pick);
    if (!row) {
      if (companionAuthority) external.push(pick);
      else unresolved.push({
        overallPick:pick.overallPick,
        playerName:pick.playerName,
        position:pick.position,
        reason:'unconfirmed-off-board'
      });
      return;
    }
    if (usedRows.has(row)) {
      unresolved.push({
        overallPick:pick.overallPick,
        playerName:pick.playerName,
        position:pick.position,
        reason:'duplicate-canonical-resolution'
      });
      return;
    }
    usedRows.add(row);
    canonical.push({pick:pick, row:row});
  });

  return {
    settings:settings,
    picks:picks,
    canonical:canonical,
    external:external,
    unresolved:unresolved,
    rejected:rejected,
    companionAuthority:companionAuthority
  };
}

function normalizedUnresolvedFromBase(classification, originalResult) {
  var externalNumbers = new Set(classification.external.map(function(pick) {
    return Number(pick.overallPick);
  }));
  var reasons = new Map(classification.unresolved.map(function(item) {
    return [Number(item.overallPick), item.reason || 'unresolved'];
  }));
  return (Array.isArray(originalResult && originalResult.unmatched) ? originalResult.unmatched : [])
    .filter(function(item) { return !externalNumbers.has(Number(item && item.overallPick)); })
    .map(function(item) {
      return {
        overallPick:Number(item && item.overallPick) || 0,
        playerName:String(item && item.playerName || ''),
        position:String(item && item.position || ''),
        reason:reasons.get(Number(item && item.overallPick)) || 'unresolved-canonical-resolution'
      };
    });
}

function buildExternalAwareSyncResult(classification, originalResult) {
  originalResult = originalResult || {};
  var canonicalApplied = Math.max(0, Number(originalResult.applied) || 0);
  var externalPicks = getEspnExternalDraftPicks();
  var externalAccepted = externalPicks.length;
  var numberedAccepted = canonicalApplied + externalAccepted;
  var unresolved = normalizedUnresolvedFromBase(classification, originalResult);
  var externalMine = externalPicks.filter(function(pick) {
    return isEspnDraftPickMine(pick, classification.settings.draftSlot);
  }).length;
  var mine = Math.max(0, Number(originalResult.mine) || 0) + externalMine;

  return {
    captured:classification.picks.length,
    applied:numberedAccepted,
    numberedAccepted:numberedAccepted,
    canonicalApplied:canonicalApplied,
    externalAccepted:externalAccepted,
    mine:mine,
    unmatched:unresolved.slice(),
    unresolved:unresolved.slice(),
    rejected:classification.rejected,
    externalPicks:externalPicks,
    unavailableApplied:Number(originalResult.unavailableApplied) || 0,
    latestPick:classification.picks.length
      ? Number(classification.picks[classification.picks.length - 1].overallPick) || 0
      : 0,
    syncedAt:originalResult.syncedAt || new Date().toISOString()
  };
}

function buildCurrentExternalAwareSyncResult() {
  var settings = getEspnSyncSettings();
  var numbers = getAcceptedEspnPickNumbers();
  var externalPicks = getEspnExternalDraftPicks();
  var canonicalApplied = getCanonicalEspnAppliedCount();
  var mine = document.querySelectorAll(
    'tr.draftrow.drafted-mine[data-sync-source="espn"][data-pick]'
  ).length + externalPicks.filter(function(pick) {
    return isEspnDraftPickMine(pick, settings.draftSlot);
  }).length;
  return {
    captured:numbers.length,
    applied:numbers.length,
    numberedAccepted:numbers.length,
    canonicalApplied:canonicalApplied,
    externalAccepted:externalPicks.length,
    mine:mine,
    unmatched:[],
    unresolved:[],
    rejected:0,
    externalPicks:externalPicks,
    unavailableApplied:latestEspnSyncResult ? Number(latestEspnSyncResult.unavailableApplied) || 0 : 0,
    latestPick:numbers.length ? numbers[numbers.length - 1] : 0,
    syncedAt:latestEspnSyncResult && latestEspnSyncResult.syncedAt
      ? latestEspnSyncResult.syncedAt
      : new Date().toISOString()
  };
}

(function installExternalEspnDraftPickState() {
  var baseCompletedCount = getCompletedDraftPickCount;
  getCompletedDraftPickCount = function() {
    return getExternalAwareCompletedDraftPickCount();
  };
  window.getCompletedDraftPickCount = getCompletedDraftPickCount;
  window.getBaseCompletedDraftPickCount = baseCompletedCount;

  var baseRosterState = getDraftAssistantRosterState;
  getDraftAssistantRosterState = function() {
    var state = baseRosterState();
    var draftSlot = Number(getEspnSyncSettings().draftSlot) || Number(MY_DRAFT_SLOT) || 1;
    var externalMine = getEspnExternalDraftPicks().filter(function(pick) {
      return isEspnDraftPickMine(pick, draftSlot);
    });
    externalMine.forEach(function(pick) {
      if (state.counts && Object.prototype.hasOwnProperty.call(state.counts, pick.position)) {
        state.counts[pick.position]++;
      }
    });
    if (state.required && state.counts) {
      Object.keys(state.required).forEach(function(position) {
        state.needs[position] = Number(state.counts[position]) < Number(state.required[position]);
      });
      state.flexEligiblePlayers = Number(state.counts.RB || 0) + Number(state.counts.WR || 0) + Number(state.counts.TE || 0);
      state.needs.FLEX = state.flexEligiblePlayers < Number(state.requiredFlexEligiblePlayers || 0);
    }
    state.externalMinePicks = externalMine;
    return state;
  };
  window.getDraftAssistantRosterState = getDraftAssistantRosterState;

  var baseSaveState = saveState;
  saveState = function() {
    var saved = baseSaveState.apply(this, arguments);
    if (!saved) return false;
    if (writeEspnExternalDraftState()) return true;
    if (typeof flashSaveIndicator === 'function') flashSaveIndicator('Autosave failed', '#e08a8a');
    return false;
  };
  window.saveState = saveState;

  var baseLoadState = loadState;
  loadState = function() {
    var stored = readEspnExternalDraftState();
    replaceEspnExternalDraftPicks(stored.picks, stored.teams * stored.rounds);
    return baseLoadState.apply(this, arguments);
  };
  window.loadState = loadState;

  var baseClearDraftStateFromBoard = clearDraftStateFromBoard;
  clearDraftStateFromBoard = function() {
    clearEspnExternalDraftPicks();
    return baseClearDraftStateFromBoard.apply(this, arguments);
  };
  window.clearDraftStateFromBoard = clearDraftStateFromBoard;

  var baseResetBoard = resetBoard;
  resetBoard = function() {
    if (Boolean(resetArmed)) clearEspnExternalDraftPicks();
    return baseResetBoard.apply(this, arguments);
  };
  window.resetBoard = resetBoard;

  var baseDeleteActiveDraftSession = deleteActiveDraftSession;
  deleteActiveDraftSession = function() {
    var deletedId = activeDraftSessionId;
    var result = baseDeleteActiveDraftSession.apply(this, arguments);
    if (result === true) removeEspnExternalDraftState(deletedId);
    return result;
  };
  window.deleteActiveDraftSession = deleteActiveDraftSession;

  var baseApplyEspnDraftSnapshot = applyEspnDraftSnapshot;
  applyEspnDraftSnapshot = function(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return baseApplyEspnDraftSnapshot.apply(this, arguments);
    }
    if (snapshot.draftKey && !selectEspnDraftSession(snapshot.draftKey)) {
      return baseApplyEspnDraftSnapshot.apply(this, arguments);
    }

    var classification = classifyEspnSnapshotPicks(snapshot);
    if (!classification) return baseApplyEspnDraftSnapshot.apply(this, arguments);

    var existingNumbers = getAcceptedEspnPickNumbers();
    var existingLatest = existingNumbers.length ? existingNumbers[existingNumbers.length - 1] : 0;
    var incomingLatest = classification.picks.length
      ? classification.picks[classification.picks.length - 1].overallPick
      : 0;
    var stale = !snapshot.force && existingNumbers.length > 0 && (
      classification.picks.length < existingNumbers.length || incomingLatest < existingLatest
    );
    if (stale) {
      var staleResult = latestEspnSyncResult || buildCurrentExternalAwareSyncResult();
      latestEspnSyncResult = staleResult;
      window.latestEspnSyncResult = staleResult;
      publishEspnSyncAck(staleResult);
      return staleResult;
    }

    var previousExternal = getEspnExternalDraftPicks();
    replaceEspnExternalDraftPicks(classification.external, classification.settings.totalPicks);

    var realPublishAck = publishEspnSyncAck;
    var realUpdateStatus = updateEspnSyncStatus;
    var originalResult = null;
    publishEspnSyncAck = function() {};
    updateEspnSyncStatus = function() {};
    try {
      originalResult = baseApplyEspnDraftSnapshot.apply(this, arguments);
    } catch (error) {
      replaceEspnExternalDraftPicks(previousExternal, classification.settings.totalPicks);
      throw error;
    } finally {
      publishEspnSyncAck = realPublishAck;
      updateEspnSyncStatus = realUpdateStatus;
    }

    if (!originalResult) {
      replaceEspnExternalDraftPicks(previousExternal, classification.settings.totalPicks);
      return originalResult;
    }

    var result = buildExternalAwareSyncResult(classification, originalResult);
    latestEspnSyncResult = result;
    window.latestEspnSyncResult = result;

    if (result.unmatched.length || result.rejected) {
      realUpdateStatus(
        'error',
        'ESPN Sync · ' + result.applied + ' accepted · ' +
          (result.unmatched.length + result.rejected) + ' unresolved'
      );
    } else {
      realUpdateStatus(
        'connected',
        'ESPN Sync · ' + result.applied + ' picks' +
          (result.unavailableApplied ? ' · ' + result.unavailableApplied + ' drafted labels' : '') +
          ' · Market 300/' + Number(latestEspnSyncMeta && latestEspnSyncMeta.marketAdpCount || 0)
      );
    }

    realPublishAck(result);
    return result;
  };
  window.applyEspnDraftSnapshot = applyEspnDraftSnapshot;
  if (window.WarRoomEspnSync) window.WarRoomEspnSync.applySnapshot = applyEspnDraftSnapshot;

  window.WarRoomEspnExternalPicks = {
    version:1,
    getAll:getEspnExternalDraftPicks,
    getAcceptedPickNumbers:getAcceptedEspnPickNumbers,
    isMine:isEspnDraftPickMine,
    classifySnapshot:classifyEspnSnapshotPicks,
    storageKey:getEspnExternalDraftStateKey
  };
})();