'use strict';

// Production service-worker entry. Keep background.js focused on capture and
// reconciliation while enforcing the terminal draft-state invariant at the
// state/persistence boundary used by every Companion path.
importScripts('background.js');

(function installCompletionStateConsistency() {
  var baseGetPicks = getPicks;
  var baseStorageSave = storageSave;

  function reconcileCompleteNumberedLedger(picks) {
    var totalPicks = Math.max(1, Number(state.config.teams) * Number(state.config.rounds));
    if (!Array.isArray(picks) || picks.length !== totalPicks) return false;

    state.espn.draftComplete = true;
    state.espn.currentPick = Math.max(Number(state.espn.currentPick) || 0, totalPicks);
    state.espn.expectedCompleted = Math.max(Number(state.espn.expectedCompleted) || 0, totalPicks);
    return true;
  }

  getPicks = function() {
    var picks = baseGetPicks.apply(this, arguments);
    reconcileCompleteNumberedLedger(picks);
    return picks;
  };

  storageSave = function() {
    // A top-frame Rescan heartbeat may lose ESPN's terminal UI marker after the
    // draft. Reconcile the authoritative numbered ledger before persisting the
    // heartbeat state so draftComplete cannot regress from a complete 1..N set.
    getPicks();
    return baseStorageSave.apply(this, arguments);
  };

  // Covers a complete ledger restored from storage before the first status or
  // War Room delivery request observes it.
  getPicks();
})();
