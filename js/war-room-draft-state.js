/* =========================================================
   DRAFT ASSISTANT — STAGE 1 DATA LAYER
   ========================================================= */

function getDraftAssistantState() {
  var teams = parseInt(document.getElementById('pcTeams')?.value) || 10;
  var rounds = parseInt(document.getElementById('pcRounds')?.value) || 16;
  var draftSlot = parseInt(document.getElementById('pcSlot')?.value) || 1;

  var totalPicks = teams * rounds;

  /*
   * Find the current overall pick from the existing draft counter.
   * If the existing function/state is available, use it.
   */
  var completedPicks = getCompletedDraftPickCount();

var currentPick = Math.min(
  completedPicks + 1,
  totalPicks
);

  /*
   * Determine the user's picks using snake-draft logic.
   */
  var myPicks = [];

  for (var round = 1; round <= rounds; round++) {
    var pickInRound;

    if (round % 2 === 1) {
      pickInRound = draftSlot;
    } else {
      pickInRound = teams - draftSlot + 1;
    }

    myPicks.push((round - 1) * teams + pickInRound);
  }

  var myNextPick = null;

  for (var i = 0; i < myPicks.length; i++) {
    if (myPicks[i] >= currentPick) {
      myNextPick = myPicks[i];
      break;
    }
  }

  var picksUntilMyTurn =
    myNextPick === null ? null : myNextPick - currentPick;

  return {
    teams: teams,
    rounds: rounds,
    draftSlot: draftSlot,
    totalPicks: totalPicks,
    currentPick: currentPick,
    myNextPick: myNextPick,
    picksUntilMyTurn: picksUntilMyTurn,
    onClock: picksUntilMyTurn === 0,
    myPicks: myPicks
  };
}

function getDraftPhase(
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
      round: 0,
      phase: 'UNKNOWN'
    };

  }


  /*
   * -------------------------------------------------------
   * CURRENT ROUND
   * -------------------------------------------------------
   */

  var round =
    Math.ceil(
      currentPick / teams
    );


  /*
   * -------------------------------------------------------
   * DRAFT PHASE
   * -------------------------------------------------------
   *
   * FOUNDATION
   *   Rounds 1–3
   *
   * STARTER BUILD
   *   Rounds 4–7
   *
   * VALUE / DEPTH
   *   Rounds 8–11
   *
   * UPSIDE / ENDGAME
   *   Round 12+
   */

  var phase;

  if (round <= 3) {

    phase =
      'FOUNDATION';

  } else if (round <= 7) {

    phase =
      'STARTER BUILD';

  } else if (round <= 11) {

    phase =
      'VALUE / DEPTH';

  } else {

    phase =
      'UPSIDE / ENDGAME';

  }


  return {
    round:
      round,

    phase:
      phase
  };
}

function getDraftPhaseWeights(
  phase
) {

  phase =
    phase || 'UNKNOWN';


  /*
   * All values are multipliers.
   *
   * 1.00 = neutral
   * >1.00 = emphasize
   * <1.00 = de-emphasize
   */

  var weights = {
    vorp:
      1,

    scarcity:
      1,

    rosterNeed:
      1,

    rosterConstruction:
      1,

    futureDepth:
      1,

    tierCliff:
      1,

    draftAwareVorp:
      1,

    multiPick:
      1
  };


  if (phase === 'FOUNDATION') {

    weights.vorp =
      1.10;

    weights.scarcity =
      1.05;

    weights.rosterNeed =
      0.85;

    weights.rosterConstruction =
      0.90;

    weights.futureDepth =
      1.05;

    weights.tierCliff =
      1.10;


  } else if (phase === 'STARTER BUILD') {

    weights.vorp =
      1.00;

    weights.scarcity =
      1.00;

    weights.rosterNeed =
      1.15;

    weights.rosterConstruction =
      1.20;

    weights.futureDepth =
      1.10;

    weights.tierCliff =
      1.05;


  } else if (phase === 'VALUE / DEPTH') {

    weights.vorp =
      1.10;

    weights.scarcity =
      1.10;

    weights.rosterNeed =
      1.10;

    weights.rosterConstruction =
      1.00;

    weights.futureDepth =
      1.10;

    weights.draftAwareVorp =
      1.10;


  } else if (phase === 'UPSIDE / ENDGAME') {

    weights.vorp =
      1.15;

    weights.scarcity =
      1.05;

    weights.rosterNeed =
      0.95;

    weights.rosterConstruction =
      0.90;

    weights.futureDepth =
      0.90;

    weights.multiPick =
      0.75;

  }


  return weights;
}

function getMyRemainingDraftPicks(
  currentPick,
  teams,
  rounds,
  draftSlot
) {

  currentPick =
    Number(currentPick) || 0;

  teams =
    Number(teams) || 10;

  rounds =
    Number(rounds) || 16;

  draftSlot =
    Number(draftSlot) || 1;

  var totalPicks =
    teams * rounds;

  var picks = [];

  for (
    var pick = currentPick;
    pick <= totalPicks;
    pick++
  ) {

    var mapping =
      getSnakeDraftTeamForPick(
        pick,
        teams
      );

    if (
      mapping &&
      Number(mapping.teamSlot) ===
        draftSlot
    ) {

      picks.push(
        pick
      );

    }

  }

  return picks;
}

function getMandatoryEndgamePositions(
  context
) {

  context =
    context || {};


  /*
   * Cache this during one scoring pass.
   */

  if (
    Array.isArray(
      context._mandatoryEndgamePositions
    )
  ) {

    return context._mandatoryEndgamePositions;

  }


  var state =
    context.draftState ||
    getDraftAssistantState();

  var currentPick =
    Number(context.currentPick) ||
    Number(state.currentPick) ||
    0;

  var teams =
    Number(context.teams) ||
    Number(state.teams) ||
    10;

  var rounds =
    Number(context.rounds) ||
    Number(state.rounds) ||
    16;

  var draftSlot =
    Number(context.draftSlot) ||
    Number(state.draftSlot) ||
    1;


  if (
    currentPick <= 0
  ) {

    context._mandatoryEndgamePositions = [];

    return [];
  }


  /*
   * -------------------------------------------------------
   * WHICH REQUIRED POSITIONS ARE MISSING?
   * -------------------------------------------------------
   */

  var counts = context.rosterCounts || getDraftAssistantRosterState().counts;


  var missing = [];

  if (counts.K <= 0) {
    missing.push('K');
  }

  if (counts.DST <= 0) {
    missing.push('DST');
  }


  if (!missing.length) {

    context._mandatoryEndgamePositions = [];

    return [];

  }


  /*
   * -------------------------------------------------------
   * OUR REMAINING PICKS
   * -------------------------------------------------------
   */

  var remainingPicks =
    getMyRemainingDraftPicks(
      currentPick,
      teams,
      rounds,
      draftSlot
    );


  if (!remainingPicks.length) {

    context._mandatoryEndgamePositions = [];

    return [];

  }


  /*
   * Future opportunities AFTER the current selection.
   */

  var futurePicks =
    remainingPicks.slice(1);


  /*
   * -------------------------------------------------------
   * POSITION AVAILABILITY DEADLINES
   * -------------------------------------------------------
   *
   * Because simulator opponents draft roughly by rank,
   * use the latest-ranked remaining K/DST as the last
   * reasonable point where that position can survive.
   */

  var players =
    context.players ||
    getDraftAssistantPlayers();


  var deadlines =
    missing
      .map(function(position) {

        var available =
          players
            .filter(function(player) {

              return (
                player &&
                player.available !== false &&
                player.position === position &&
                Number(player.rank) > 0
              );

            });


        if (!available.length) {

          return {
            position:
              position,

            deadline:
              currentPick
          };

        }


        var latestRank =
          Math.max.apply(
            null,
            available.map(function(player) {

              return (
                Number(player.rank) || 0
              );

            })
          );


        return {
          position:
            position,

          deadline:
            Math.max(
              currentPick,
              latestRank
            )
        };

      })
      .sort(function(a, b) {

        return (
          Number(a.deadline) -
          Number(b.deadline)
        );

      });


  /*
   * -------------------------------------------------------
   * CAN ALL MISSING POSITIONS WAIT?
   * -------------------------------------------------------
   *
   * Try assigning each missing required position to
   * one of our FUTURE picks before its availability
   * deadline.
   *
   * If that schedule cannot work, the current pick
   * must be reserved.
   */

  var futureIndex = 0;

  var futureSchedulePossible =
    true;


  for (
    var i = 0;
    i < deadlines.length;
    i++
  ) {

    var requirement =
      deadlines[i];


    if (
      futureIndex >=
      futurePicks.length
    ) {

      futureSchedulePossible =
        false;

      break;
    }


    if (
      Number(
        futurePicks[futureIndex]
      ) <=
      Number(
        requirement.deadline
      )
    ) {

      futureIndex++;

    } else {

      futureSchedulePossible =
        false;

      break;

    }

  }


  if (futureSchedulePossible) {

    context._mandatoryEndgamePositions = [];

    return [];

  }


  /*
   * -------------------------------------------------------
   * CURRENT PICK MUST BE RESERVED
   * -------------------------------------------------------
   *
   * Choose the position(s) with the earliest deadline.
   */

  var earliestDeadline =
    Number(
      deadlines[0].deadline
    );


  var mandatory =
    deadlines
      .filter(function(item) {

        return (
          Number(item.deadline) ===
          earliestDeadline
        );

      })
      .map(function(item) {

        return item.position;

      });


  context._mandatoryEndgamePositions =
    mandatory;


  return mandatory;
}

function calculateMandatoryEndgameAdjustment(
  player,
  context
) {

  if (!player) {
    return 0;
  }


  var mandatory =
    getMandatoryEndgamePositions(
      context
    );


  if (!mandatory.length) {
    return 0;
  }


  var position =
    player.position ||
    player.pos;


  /*
   * This is intentionally decisive.
   *
   * Once we've reached the last safe opportunity,
   * roster completion is no longer optional.
   */

  if (
    mandatory.indexOf(
      position
    ) !== -1
  ) {

    return 100;

  }


  return -100;
}

function calculatePhaseCoreAdjustment(
  vorpScore,
  scarcityScore,
  rosterNeedScore,
  phaseWeights
) {

  phaseWeights =
    phaseWeights || {};

  vorpScore =
    Number(vorpScore) || 0;

  scarcityScore =
    Number(scarcityScore) || 0;

  rosterNeedScore =
    Number(rosterNeedScore) || 0;


  /*
   * -------------------------------------------------------
   * PHASE CORE ADJUSTMENT
   * -------------------------------------------------------
   *
   * Important:
   *
   * Do NOT directly multiply the full score.
   *
   * Instead, only apply the amount that differs
   * from a neutral 1.00 multiplier.
   *
   * This keeps draft phase as a nudge rather than
   * allowing it to overwhelm the core engine.
   */


  var vorpAdjustment =
    vorpScore *
    (
      (Number(phaseWeights.vorp) || 1) -
      1
    ) *
    0.20;


  var scarcityAdjustment =
    scarcityScore *
    (
      (Number(phaseWeights.scarcity) || 1) -
      1
    ) *
    0.20;


  /*
   * Roster need is usually already a smaller score,
   * so give it slightly more sensitivity.
   */

  var rosterNeedAdjustment =
    rosterNeedScore *
    (
      (Number(phaseWeights.rosterNeed) || 1) -
      1
    ) *
    0.50;


  var totalAdjustment =
    vorpAdjustment +
    scarcityAdjustment +
    rosterNeedAdjustment;


  /*
   * -------------------------------------------------------
   * SAFETY CLAMP
   * -------------------------------------------------------
   */

  totalAdjustment =
    Math.max(
      -3,
      Math.min(
        3,
        totalAdjustment
      )
    );


  return {
    total:
      Number(
        totalAdjustment.toFixed(2)
      ),

    vorp:
      Number(
        vorpAdjustment.toFixed(2)
      ),

    scarcity:
      Number(
        scarcityAdjustment.toFixed(2)
      ),

    rosterNeed:
      Number(
        rosterNeedAdjustment.toFixed(2)
      )
  };
}


/* ---------------------------------------------------------
   ROSTER STATE
   --------------------------------------------------------- */

function getDraftAssistantRosterState() {
  var starterLimits = getConfiguredStarterLimits();
  var counts = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0
  };
  var byeCounts = {};

  document.querySelectorAll(
    'tr.draftrow.drafted-mine'
  ).forEach(function(row) {

    var pos = row.getAttribute('data-pos');

    if (counts[pos] !== undefined) {
      counts[pos]++;
    }
    var bye = String(row.getAttribute('data-bye') || '').trim();
    if (bye && bye !== '--' && bye !== '-' && bye !== '0') {
      byeCounts[bye] = (byeCounts[bye] || 0) + 1;
    }
  });

  var required = getConfiguredDedicatedStarterLimits();

  var needs = {};

  Object.keys(required).forEach(function(pos) {
    needs[pos] = counts[pos] < required[pos];
  });

  /*
   * FLEX logic:
   *
   * FLEX requires ONE additional RB/WR/TE beyond
   * the normal 2 RB / 2 WR / 1 TE starting requirements.
   *
   * Therefore:
   *
   * 2 RB + 2 WR + 1 TE = FLEX filled
   *
   * 2 RB + 1 WR + 1 TE = FLEX still open
   */
  var flexEligiblePlayers =
    counts.RB + counts.WR + counts.TE;

  var requiredFlexEligiblePlayers = getConfiguredFlexEligibleThreshold();

  needs.FLEX =
    flexEligiblePlayers < requiredFlexEligiblePlayers;

  return {
    counts: counts,
    required: required,
    needs: needs,
    flexEligiblePlayers: flexEligiblePlayers,
    requiredFlexEligiblePlayers: requiredFlexEligiblePlayers,
    byeCounts: byeCounts
  };
}


/* ---------------------------------------------------------
   AVAILABLE PLAYERS
   --------------------------------------------------------- */

function getDraftRowNumber(row, attributeName) {
  var rawValue = row.getAttribute(attributeName);

  if (rawValue == null || rawValue === '') {
    return null;
  }

  var value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

function getDraftAssistantPlayers() {
  var players = [];
  var starterLimits = {
    QB: getConfiguredStarterSlots('QB'),
    RB: getConfiguredStarterSlots('RB'),
    WR: getConfiguredStarterSlots('WR'),
    TE: getConfiguredStarterSlots('TE'),
    FLEX: getConfiguredStarterSlots('FLEX'),
    K: getConfiguredStarterSlots('K'),
    DST: getConfiguredStarterSlots('DST')
  };

  getCachedDraftRows().forEach(function(row) {

    var status = 'available';

    if (row.classList.contains('drafted-mine')) {
  status = 'mine';
} else if (row.classList.contains('drafted-other')) {
  status = 'taken';
}

    /*
     * Get player name and position from the existing row.
     */
    var name =
      getDraftRowDisplayName(row) ||
      row.getAttribute('data-name') ||
      'Unknown Player';

    var position =
      row.getAttribute('data-pos') ||
      '';

    /*
     * Rank is taken from the existing row rather than
     * creating a second ranking database.
     */
    var rankText = row.getAttribute('data-rank') || '';

if (!rankText) {
  var rankCell = row.children[0];

  if (rankCell) {
    var rankClone = rankCell.cloneNode(true);

    // Remove the round marker that our existing code adds.
    var roundTag = rankClone.querySelector('.round-tag');

    if (roundTag) {
      roundTag.remove();
    }

    rankText = rankClone.textContent || '';
  }
}

var rankMatch = String(rankText).match(/\d+/);
var boardRank = rankMatch ? parseInt(rankMatch[0], 10) : null;
var ecr = getDraftRowNumber(row, 'data-ecr');
var adp = getDraftRowNumber(row, 'data-adp');
var adpRank = getDraftRowNumber(row, 'data-adp-rank');
var realTimeAdp = getDraftRowNumber(row, 'data-realtime-adp');
var espnAdp = getDraftRowNumber(row, 'data-espn-adp');
var espnRank = getDraftRowNumber(row, 'data-espn-rank');
var rank = ecr != null ? ecr : boardRank;

    /*
     * Tier comes from the existing tier class when available.
     */
    var tier = '';

    row.classList.forEach(function(className) {
      if (className.indexOf('tier-') === 0) {
        tier = className.replace('tier-', '');
      }
    });

    players.push({
      row: row,
      name: name,
      position: position,
      rank: isNaN(rank) ? null : rank,
      boardRank: boardRank,
      ecr: ecr,
      adp: adp,
      adpRank: adpRank,
      realTimeAdp: realTimeAdp,
      espnAdp: espnAdp,
      espnRank: espnRank,
      bye: String(row.getAttribute('data-bye') || '').trim(),
      fantasyProsTier: getDraftRowNumber(row, 'data-fantasypros-tier'),
      semanticTier: row.getAttribute('data-semantic-tier') ||
        row.getAttribute('data-consensus-tier') ||
        '',
      source: row.getAttribute('data-player-source') || '',
      posRank: getDraftRowNumber(row, 'data-pos-rank'),
      tier: tier,
      status: status,
      available: status === 'available'
    });
  });

  return players;
}


/* ---------------------------------------------------------
   PHONE-FRIENDLY DEBUG PANEL
   --------------------------------------------------------- */

function debugDraftAssistant() {
  var draft = getDraftAssistantState();
  var roster = getDraftAssistantRosterState();
  var players = getDraftAssistantPlayers();

  var availablePlayers = players.filter(function(player) {
    return player.available;
  });

  var panel = document.getElementById(
    'draft-assistant-debug-panel'
  );

  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'draft-assistant-debug-panel';

    panel.style.cssText =
      'position:fixed;' +
      'left:10px;' +
      'right:10px;' +
      'bottom:10px;' +
      'z-index:99999;' +
      'background:#111;' +
      'color:#fff;' +
      'padding:16px;' +
      'border-radius:12px;' +
      'font-family:Arial,sans-serif;' +
      'font-size:14px;' +
      'line-height:1.5;' +
      'box-shadow:0 4px 20px rgba(0,0,0,.4);' +
      'max-height:80vh;' +
      'overflow:auto;';

    document.body.appendChild(panel);
  }

  var flexStatus =
    roster.needs.FLEX
      ? 'OPEN'
      : 'FILLED';

  var clockStatus =
    draft.onClock
      ? 'YES'
      : 'NO';

  panel.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<strong style="font-size:18px;">🧪 Draft Assistant Debug</strong>' +
      '<button onclick="document.getElementById(\'draft-assistant-debug-panel\').remove()" ' +
      'style="background:none;border:0;color:white;font-size:24px;">&times;</button>' +
    '</div>' +

    '<hr>' +

    '<strong>Draft State</strong><br>' +
    'Teams: ' + draft.teams + '<br>' +
    'Rounds: ' + draft.rounds + '<br>' +
    'Draft Slot: ' + draft.draftSlot + '<br>' +
    'Total Picks: ' + draft.totalPicks + '<br>' +
    'Current Pick: ' + draft.currentPick + '<br>' +
    'My Next Pick: ' + (draft.myNextPick ?? 'None') + '<br>' +
    'Picks Until My Turn: ' +
      (draft.picksUntilMyTurn ?? 'None') + '<br>' +
    'On Clock: <strong>' + clockStatus + '</strong>' +

    '<hr>' +

    '<strong>Roster</strong><br>' +
    'QB: ' + roster.counts.QB + '/1<br>' +
    'RB: ' + roster.counts.RB + '/2<br>' +
    'WR: ' + roster.counts.WR + '/2<br>' +
    'TE: ' + roster.counts.TE + '/1<br>' +
    'FLEX: <strong>' + flexStatus + '</strong><br>' +
    'K: ' + roster.counts.K + '/1<br>' +
    'DST: ' + roster.counts.DST + '/1' +

    '<hr>' +

    '<strong>Players</strong><br>' +
    'Total Player Rows: ' + players.length + '<br>' +
    'Available: ' + availablePlayers.length + '<br>' +
    'Mine: ' +
      players.filter(function(p) {
        return p.status === 'mine';
      }).length + '<br>' +
    'Taken: ' +
      players.filter(function(p) {
        return p.status === 'taken';
      }).length;
}
