function calculateDraftRecommendation(
  player,
  scoredPlayers,
  context
) {

  if (!player) {
    return null;
  }

  scoredPlayers =
    Array.isArray(scoredPlayers)
      ? scoredPlayers
      : [];

  context =
    context || {};


  /*
   * -------------------------------------------------------
   * 1. CURRENT PLAYER
   * -------------------------------------------------------
   */

  var score =
    Number(player.finalScore) || 0;


  /*
   * -------------------------------------------------------
   * 2. NEXT BEST PLAYER
   * -------------------------------------------------------
   *
   * scoredPlayers should already be sorted with
   * the highest-scoring player first.
   */

  var nextPickAlternatives =
  calculateNextPickAlternatives(
    player,
    scoredPlayers,
    context
  );

  nextPickAlternatives.forEach(function(candidate) {

  candidate.nextPickSurvivalScore =
    calculateNextPickSurvival(
      candidate,
      context
    );

  candidate.survivalAdjustedScore =
    (
      Number(candidate.finalScore) || 0
    ) *
    (
      Number(candidate.nextPickSurvivalScore) || 0
    ) / 100;

});

  draftScoringLog(
  'NEXT PICK OPPORTUNITY:',
  player.name,
  nextPickAlternatives.map(function(candidate) {

    return {
      name: candidate.name,
      rank: candidate.rank,
      finalScore:
        Number(candidate.finalScore) || 0,
      survival:
        Number(candidate.nextPickSurvivalScore) || 0,
      survivalAdjustedScore:
        Number(
          candidate.survivalAdjustedScore
        ) || 0
    };

  })
);

var nextPlayer =
  nextPickAlternatives.length
    ? nextPickAlternatives
        .slice()
        .sort(function(a, b) {

          return (
            Number(b.survivalAdjustedScore || 0) -
            Number(a.survivalAdjustedScore || 0)
          );

        })[0]
    : null;

  draftDebugSection(
  'NEXT PICK WINNER',
  [{
    currentPlayer:
      player.name,

    nextPlayer:
      nextPlayer
        ? nextPlayer.name
        : null,

    rawScore:
      nextPlayer
        ? Number(nextPlayer.finalScore) || 0
        : 0,

    survival:
      nextPlayer
        ? Number(nextPlayer.nextPickSurvivalScore) || 0
        : 0,

    survivalAdjustedScore:
      nextPlayer
        ? Number(nextPlayer.survivalAdjustedScore) || 0
        : 0
  }]
);

var nextPickFallback =
  nextPlayer;

var nextScore =
  nextPlayer
    ? Number.isFinite(Number(nextPlayer.recommendationPriorityScore))
      ? Number(nextPlayer.recommendationPriorityScore)
      : Number(nextPlayer.finalScore) || 0
    : 0;

var rawScoreGap =
  score - nextScore;

var scoreGap =
  rawScoreGap;


  /*
   * -------------------------------------------------------
   * 5. CONFIDENCE SCORE
   * -------------------------------------------------------
   */

  var confidenceScore =
    calculateRecommendationConfidence(
      player,
      nextPlayer,
      context
    );


  /*
   * -------------------------------------------------------
   * 6. CONFIDENCE LEVEL
   * -------------------------------------------------------
   */

  var confidence =
    'LOW';

  if (confidenceScore >= 80) {

    confidence =
      'VERY HIGH';

  } else if (confidenceScore >= 65) {

    confidence =
      'HIGH';

  } else if (confidenceScore >= 45) {

    confidence =
      'MODERATE';
  }


 /*
 * -------------------------------------------------------
 * 7. DECISION LAYER
 * -------------------------------------------------------
 */

var picksBetween =
  Number(
    context.calculatedPicksUntilNext
  );


if (!Number.isFinite(picksBetween)) {

  picksBetween =
    Number(
      context.picksBetween
    );

}


if (!Number.isFinite(picksBetween)) {

  var currentPick =
    Number(
      context.currentPick
    ) || 0;

  var nextPick =
    Number(
      context.calculatedNextPick ||
      context.nextPick
    ) || 0;


  if (
    currentPick > 0 &&
    nextPick > 0
  ) {

    picksBetween =
      Math.max(
        0,
        nextPick -
        currentPick -
        1
      );

  }

}


var backToBackTurn =
  (
    Number.isFinite(picksBetween) &&
    picksBetween === 0
  );


var decision =
  calculateRecommendationDecision(
    player,
    nextPlayer,
    scoreGap,
    confidenceScore,
    context
  );

var urgentEcrLeader =
  Number(player.recommendationSurvival) < 35 &&
  scoredPlayers.some(function(candidate) {
    return candidate && candidate.marketEcrGuardrail;
  });

if (
  urgentEcrLeader &&
  decision &&
  (decision.recommendation === 'WAIT' || decision.recommendation === 'PASS')
) {
  decision.recommendation = 'CONSIDER';
  decision.summary = 'This stronger ECR value is unlikely to survive while the positional alternative can wait.';
}

alignRecommendationActionWithMarketTiming(decision, player, backToBackTurn);

if (
  decision &&
  decision.recommendation === 'DRAFT' &&
  scoreGap < 0 &&
  !backToBackTurn
) {
  decision.recommendation = 'CONSIDER';
  decision.summary = 'Board pressure is high, but a stronger available option still leads the recommendation.';
}


/*
 * -------------------------------------------------------
 * BACK-TO-BACK TURN OVERRIDE
 * -------------------------------------------------------
 */

if (
  backToBackTurn &&
  decision &&
  decision.recommendation !== 'PASS'
) {

  decision.recommendation =
    'DRAFT';

  decision.summary =
    'Back-to-back pick: treat this as a two-pick turn package rather than a wait decision.';

}


  /*
   * -------------------------------------------------------
   * 8. PRIMARY REASON
   * -------------------------------------------------------
   */

  var reason =
    'Best overall draft value';


  if (
    Number(player.tierScore) >= 90 &&
    Number(player.vorpScore) >= 80
  ) {

    reason =
      'Elite tier and VORP value';

  } else if (
    Number(player.vorpScore) >= 80
  ) {

    reason =
      'Elite value over replacement';

  } else if (
    Number(player.tierScore) >= 90
  ) {

    reason =
      'Elite player tier';

  } else if (
    Number(player.tierCliffOpportunityScore) >= 5
  ) {

    reason =
      'Major tier cliff opportunity';

  } else if (
    Number(player.timingScore) >= 70
  ) {

    reason =
      'High availability risk';

  } else if (
    Number(player.scarcityScore) >= 90
  ) {

    reason =
      'Strong positional scarcity';

  } else if (
    Number(player.rosterNeedScore) >= 2
  ) {

    reason =
      'Fills an important roster need';
  }


  /*
   * -------------------------------------------------------
   * 9. CLOSE ALTERNATIVE
   * -------------------------------------------------------
   */

  var closeAlternative =
    null;

  if (
    nextPlayer &&
    Math.abs(scoreGap) < 2
  ) {

    closeAlternative =
      nextPlayer.name;
  }


  /*
   * -------------------------------------------------------
   * 10. DEBUG
   * -------------------------------------------------------
   */

  draftDebugSection(
  'PLAYER SCORE: ' + player.name,
  [{
    player:
      player.name,

    position:
      player.position,

    rank:
      Number(player.rank) || 999,

    finalScore:
      Number(player.finalScore) || 0,

    tierScore:
      Number(player.tierScore) || 0,

    vorpScore:
      Number(player.vorpScore) || 0,

    timingScore:
      Number(player.timingScore) || 0,

    scarcityScore:
      Number(player.scarcityScore) || 0,

    rosterNeedScore:
      Number(player.rosterNeedScore) || 0,

    draftAwareVorp:
      Number(
        player.draftAwareVorpOpportunityScore
      ) || 0,

    tierCliff:
      Number(
        player.tierCliffOpportunityScore
      ) || 0
  }]
);
  
  draftDebugSection(
  'DECISION: ' + player.name,
  [{
    player:
      player.name,

    position:
      player.position,

    playerScore:
      score,

    nextPlayer:
      nextPlayer
        ? nextPlayer.name
        : null,

    nextPlayerRawScore:
      nextScore,

    nextPlayerSurvival:
      nextPlayer
        ? Number(
            nextPlayer.nextPickSurvivalScore
          ) || 0
        : 0,

    nextPlayerAdjustedScore:
      nextPlayer
        ? Number(
            nextPlayer.survivalAdjustedScore
          ) || 0
        : 0,

    scoreGap:
      scoreGap,

    confidenceScore:
      confidenceScore,

    confidence:
      confidence,

backToBackTurn:
  backToBackTurn,

    recommendation:
      decision.recommendation,

    reason:
      reason
  }]
);


  /*
   * -------------------------------------------------------
   * 11. RETURN
   * -------------------------------------------------------
   */

  return {

    player:
      player.name,

    position:
      player.position,

    score:
      score,

    nextBest:
      nextPlayer
        ? nextPlayer.name
        : null,

    nextBestScore:
      nextScore,

    scoreGap:
      scoreGap,

    confidence:
      confidence,

    confidenceScore:
      confidenceScore,

    recommendation:
      decision.recommendation,

    backToBackTurn:
  backToBackTurn,

    reason:
      reason,

    urgencyBonus:
      decision.urgencyBonus || 0,

    summary:
      decision.summary,

    closeAlternative:
      closeAlternative
  };
}

function buildRecommendationExplanation(
  recommendation,
  playerResult,
  comparisonResult
) {

  if (!recommendation) {

    return null;

  }


  var action =
    recommendation.recommendation ||
    'CONSIDER';


  var confidence =
    recommendation.confidence ||
    'LOW';


  var player =
    recommendation.player ||
    'Best available player';


var reasons = [];


function addReason(
  text,
  priority
) {

  if (!text) {

    return;

  }


  reasons.push({

    text:
      text,

    priority:
      Number(priority) || 0

  });

}


  /*
   * -------------------------------------------------------
   * TURN-PACKAGE EXPLANATION
   * -------------------------------------------------------
   */

  if (
    recommendation.turnPackageActive &&
    recommendation.turnRecommendedNow &&
    recommendation.turnTargetNext
  ) {

    var turnNow =
      recommendation.turnRecommendedNow;


    var turnNext =
      recommendation.turnTargetNext;


    var advantage =
      Number(
        recommendation.turnPackageAdvantage
      ) || 0;


    addReason(
  turnNow +
  ' + ' +
  turnNext +
  ' is the strongest two-pick turn package.',
  100
);


addReason(
  turnNext +
  ' is guaranteed to remain available at your next pick because no opponent selects between the two picks.',
  95
);


if (advantage > 0) {

  addReason(
    'This package leads the next-best turn option by ' +
    advantage.toFixed(1) +
    ' points.',
    90
  );

}


    return {

      type:
        'TURN_PACKAGE',

      action:
        'DRAFT',

      headline:
        'Draft ' +
        turnNow,

      player:
        turnNow,

      confidence:
        recommendation.turnPackageConfidence ||
        confidence,

      reasons:
  reasons
    .slice()
    .sort(function(a, b) {

      return (
        Number(b.priority) -
        Number(a.priority)
      );

    })
    .slice(0, 4)
    .map(function(reason) {

      return reason.text;

    }),

      nextAction:
        'Target ' +
        turnNext +
        ' with your next pick.',

      nextTarget:
        turnNext

    };

  }


  /*
   * -------------------------------------------------------
   * NORMAL SINGLE-PICK EXPLANATION
   * -------------------------------------------------------
   */

/*
 * -------------------------------------------------------
 * DEEP ENGINE EXPLANATION
 * -------------------------------------------------------
 */

var deepExplanation =
  playerResult
    ? generateDecisionExplanation(
        playerResult,
        comparisonResult || null
      )
    : null;


if (
  deepExplanation &&
  deepExplanation.primaryReason
) {

addReason(
  'Primary edge: ' +
  deepExplanation.primaryReason +
  '.',
  80
);

} else if (recommendation.reason) {

  addReason(
    recommendation.reason + '.',
    80
  );

}

/*
 * -------------------------------------------------------
 * DRAFT PHASE CONTEXT
 * -------------------------------------------------------
 */

if (
  playerResult &&
  playerResult.draftPhase
) {

  if (
    playerResult.draftPhase ===
    'FOUNDATION'
  ) {

    addReason(
      'Foundation phase favors elite talent and value over forcing positional need.',
      55
    );

  } else if (
    playerResult.draftPhase ===
    'STARTER BUILD'
  ) {

    addReason(
      'Starter-build phase increases the importance of filling strong lineup needs.',
      55
    );

  } else if (
    playerResult.draftPhase ===
    'VALUE / DEPTH'
  ) {

    addReason(
      'Value/depth phase puts more weight on scarcity and remaining positional value.',
      50
    );

  } else if (
    playerResult.draftPhase ===
    'UPSIDE / ENDGAME'
  ) {

    addReason(
      'Endgame phase prioritizes upside, roster completion, and remaining positional requirements.',
      60
    );

  }

}

/*
 * -------------------------------------------------------
 * SPECIAL STRATEGIC SIGNALS
 * -------------------------------------------------------
 */

if (playerResult) {

  if (
    Number(
      playerResult.tierCliffOpportunityScore
    ) >= 5
  ) {

    addReason(
  'A significant tier cliff makes this player more valuable to take now.',
  95
);

  }


  if (
    Number(
      playerResult.scarcityScore
    ) >= 90
  ) {

    addReason(
  'This position currently has elite scarcity value.',
  70
);

  }


  if (
    Number(
      playerResult.rosterSaturationPenalty
    ) < 0
  ) {

    addReason(
  'Roster saturation reduces the value of adding another player at this position.',
  85
);

  }


  if (
    Number(
      playerResult.timingScore
    ) >= 70
  ) {

    addReason(
  'There is high risk this player will be gone before your next selection.',
  90
);

  }

}

 var scoreGap =
  Number(
    recommendation.scoreGap
  );


if (
  Number.isFinite(scoreGap) &&
  recommendation.nextBest
) {

  if (scoreGap >= 8) {

    addReason(
      player +
      ' leads ' +
      recommendation.nextBest +
      ' by ' +
      scoreGap.toFixed(1) +
      ' points.',
      88
    );

  } else if (scoreGap >= 3) {

    addReason(
      player +
      ' holds a meaningful advantage over ' +
      recommendation.nextBest +
      '.',
      72
    );

  } else if (Math.abs(scoreGap) < 3) {

    addReason(
      recommendation.nextBest +
      ' is a close alternative.',
      50
    );

  }

}

 /*
 * -------------------------------------------------------
 * DECISION-SPECIFIC EXPLANATION
 * -------------------------------------------------------
 */

if (action === 'DRAFT') {

  if (
    recommendation.confidence ===
      'VERY HIGH' ||
    recommendation.confidence ===
      'HIGH'
  ) {

    addReason(
      'The current value is strong enough that waiting is not recommended.',
      75
    );

  }

} else if (action === 'WAIT') {

  if (recommendation.nextBest) {

    addReason(
      'Comparable value should still be available at your next selection.',
      82
    );

  }

} else if (action === 'PASS') {

  addReason(
    'The current player does not provide enough value relative to the alternatives.',
    95
  );

} else if (action === 'CONSIDER') {

  addReason(
    'The decision is close enough that roster construction and draft strategy should break the tie.',
    65
  );

}


  /*
   * -------------------------------------------------------
   * NEXT ACTION
   * -------------------------------------------------------
   */

  var nextAction = '';


  if (action === 'DRAFT') {

    nextAction =
      'Take ' +
      player +
      ' now.';

  } else if (action === 'WAIT') {

    nextAction =
      'Wait and reassess at your next pick.';

  } else if (action === 'PASS') {

    nextAction =
      'Pass and move to the next-best option.';

  } else {

    nextAction =
      'Compare the close alternatives before making the pick.';

  }


  return {

    type:
      'SINGLE_PICK',

    action:
      action,

    headline:
      action.charAt(0) +
      action.slice(1).toLowerCase() +
      ' ' +
      player,

    player:
      player,

    confidence:
      confidence,

   reasons:
  reasons
    .slice()
    .sort(function(a, b) {

      return (
        Number(b.priority) -
        Number(a.priority)
      );

    })
    .slice(0, 4)
    .map(function(reason) {

      return reason.text;

    }),

    nextAction:
      nextAction,

    nextTarget:
      recommendation.nextBest ||
      null

  };

}

function generateDecisionExplanation(result, comparisonResult) {

  if (!result) {
    return null;
  }

  var reasons = [];
  var positives = [];
  var concerns = [];

  /*
   * -------------------------------------------------------
   * 1. TIER
   * -------------------------------------------------------
   */

  if (result.tierScore >= 90) {

    positives.push(
      'Elite tier value'
    );

  } else if (result.tierScore >= 75) {

    positives.push(
      'Strong tier value'
    );

  } else if (result.tierScore < 50) {

    concerns.push(
      'Lower player tier'
);
}







  /*
   * -------------------------------------------------------
   * 2. OVERALL RANK
   * -------------------------------------------------------
   */

  if (result.rank <= 10) {

    positives.push(
      'Top-10 overall player'
    );

  } else if (result.rank <= 20) {

    positives.push(
      'Strong overall ranking'
    );

  } else if (result.rank >= 40) {

    concerns.push(
      'Lower overall ranking'
    );
  }


  /*
   * -------------------------------------------------------
   * 3. VORP
   * -------------------------------------------------------
   */

  if (result.vorpScore >= 90) {

    positives.push(
      'Elite VORP'
    );

  } else if (result.vorpScore >= 75) {

    positives.push(
      'Strong VORP'
    );

  } else if (result.vorpScore < 40) {

    concerns.push(
      'Limited VORP'
    );
  }


  /*
   * -------------------------------------------------------
   * 4. SCARCITY
   * -------------------------------------------------------
   */

  if (result.scarcityScore >= 90) {

    positives.push(
      'Position is highly scarce'
    );

  } else if (result.scarcityScore >= 75) {

    positives.push(
      'Good positional scarcity'
    );

  } else if (result.scarcityScore < 40) {

    concerns.push(
      'Position has relatively low scarcity'
    );
  }


  /*
   * -------------------------------------------------------
   * 5. ROSTER NEED
   * -------------------------------------------------------
   */

  if (result.rosterNeedScore >= 50) {

    positives.push(
      'Strong roster need'
    );

  } else if (result.rosterNeedScore >= 25) {

    positives.push(
      'Fills an open roster need'
    );

  } else {

    concerns.push(
      'Does not fill an immediate roster need'
    );
  }


  /*
 * -------------------------------------------------------
 * 6. TIMING
 * -------------------------------------------------------
 */

if (result.timingScore >= 70) {

  positives.push(
    'Very high chance of being gone before the next pick'
  );

} else if (result.timingScore >= 50) {

  positives.push(
    'High chance of being gone before the next pick'
  );

} else if (result.timingScore >= 30) {

  positives.push(
    'Moderate draft-timing pressure'
  );

}


  /*
   * -------------------------------------------------------
   * 7. COMPARISON
   * -------------------------------------------------------
   */

  if (comparisonResult) {

    var scoreDifference =
      Number(result.finalScore || 0) -
      Number(comparisonResult.finalScore || 0);

    if (scoreDifference > 5) {

      reasons.push(
        'Clear advantage over ' +
        comparisonResult.name
      );

    } else if (scoreDifference > 2) {

      reasons.push(
        'Moderate advantage over ' +
        comparisonResult.name
      );

    } else if (scoreDifference > 0) {

      reasons.push(
        'Slight advantage over ' +
        comparisonResult.name
      );

    } else {

      reasons.push(
        'Very close decision'
      );
    }
  }


  /*
   * -------------------------------------------------------
   * 8. PRIMARY REASON
   * -------------------------------------------------------
   */

  var primaryReason =
    'Best overall combination of draft value';

  var strongestValue = -1;

  var factors = [
    {
      name: 'tier',
      value: result.tierScore,
      text: 'elite tier value'
    },
    {
      name: 'rank',
      value: result.rankScore,
      text: 'strong overall ranking'
    },
    {
      name: 'VORP',
      value: result.vorpScore,
      text: 'excellent value over replacement'
    },
    {
      name: 'scarcity',
      value: result.scarcityScore,
      text: 'strong positional scarcity'
    },
    {
      name: 'need',
      value: result.rosterNeedScore,
      text: 'roster need'
    },
    {
      name: 'timing',
      value: result.timingScore,
      text: 'draft timing'
    }
  ];

  factors.forEach(function(factor) {

    if (factor.value > strongestValue) {

      strongestValue =
        factor.value;

      primaryReason =
        factor.text;
    }

  });


  return {

  primaryReason:
    primaryReason,

  reasons:
    reasons,

  positives:
    positives,

  concerns:
    concerns

};
}

function calculateDecisionRosterNeeds(suppliedCounts){

  var counts = suppliedCounts || {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0
  };

  if (!suppliedCounts) document
    .querySelectorAll(
      'tr.draftrow.drafted-mine'
    )
    .forEach(function(row){

      var pos =
        row.getAttribute('data-pos');

      if(pos && counts[pos] !== undefined){
        counts[pos]++;
      }

    });

  var needs = {};

  /*
   * Dedicated starting-position needs.
   */
  ['QB','RB','WR','TE','K','DST']
    .forEach(function(pos){

      var starters =
        Number(ROSTER_SLOTS[pos]) || 0;

      var filled =
        counts[pos] || 0;

      needs[pos] =
        Math.max(
          0,
          starters - filled
        );

    });


  /*
   * FLEX need.
   *
   * FLEX can be RB / WR / TE.
   */

  var dedicatedRB =
    Math.min(
      counts.RB,
      Number(ROSTER_SLOTS.RB) || 0
    );

  var dedicatedWR =
    Math.min(
      counts.WR,
      Number(ROSTER_SLOTS.WR) || 0
    );

  var dedicatedTE =
    Math.min(
      counts.TE,
      Number(ROSTER_SLOTS.TE) || 0
    );


  /*
   * Number of RB/WR/TE players currently
   * occupying dedicated starting slots.
   */
  var dedicatedEligible =
    dedicatedRB +
    dedicatedWR +
    dedicatedTE;


  /*
   * Total RB/WR/TE players on roster.
   */
  var totalEligible =
    counts.RB +
    counts.WR +
    counts.TE;


  /*
   * RB/WR/TE players available beyond
   * the dedicated starting requirements.
   */
  var flexFilled =
    Math.max(
      0,
      totalEligible -
      dedicatedEligible
    );


  var flexSlots =
    Number(ROSTER_SLOTS.FLEX) || 0;


  needs.FLEX =
    Math.max(
      0,
      flexSlots - flexFilled
    );

  draftScoringLog('ROSTER NEEDS:', needs);

  return needs;
}

function calculateRosterConstructionValue(
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


  /*
   * -------------------------------------------------------
   * CURRENT ROSTER NEEDS
   * -------------------------------------------------------
   */

  var needs =
    context.rosterNeeds ||
    calculateDecisionRosterNeeds();


  var dedicatedNeed =
    Number(needs[position]) || 0;

  var flexNeed =
    Number(needs.FLEX) || 0;


  /*
   * -------------------------------------------------------
   * BASE ROSTER-CONSTRUCTION VALUE
   * -------------------------------------------------------
   *
   * This score is intentionally small.
   *
   * It should influence the decision,
   * not overpower tier / VORP / ranking.
   */

  var value = 0;


  /*
   * Dedicated starting slot still open.
   */

  if (dedicatedNeed > 0) {

    value += 3;

  }


  /*
   * FLEX still open.
   *
   * Only RB / WR / TE qualify.
   */

  if (
    flexNeed > 0 &&
    (
      position === 'RB' ||
      position === 'WR' ||
      position === 'TE'
    )
  ) {

    value += 1;

  }


  /*
   * -------------------------------------------------------
   * STARTER PRIORITY
   * -------------------------------------------------------
   *
   * Filling a true starter vacancy should matter more
   * than simply adding FLEX/depth.
   */

  if (
    dedicatedNeed > 0 &&
    position === 'QB'
  ) {

    value += 1;

  }


  /*
   * -------------------------------------------------------
   * OVERSTOCK PROTECTION
   * -------------------------------------------------------
   *
   * If the dedicated position is already filled and
   * FLEX is also covered, reduce the value of adding
   * another player at that position.
   */

  if (
    dedicatedNeed <= 0 &&
    (
      position === 'QB' ||
      flexNeed <= 0
    )
  ) {

    value -= 2;

  }

  /* Once the starter-build phase begins, a zero-RB roster with an already
   * filled WR requirement needs a modest tie-breaker. This remains bounded
   * support: it cannot erase a meaningful ECR/value gap by itself. */
  var counts = context.rosterCounts || {};
  var round = Math.ceil(
    (Number(context.currentPick) || 1) /
    Math.max(1, Number(context.teams) || 10)
  );
  if (round >= 4 && Number(counts.RB) === 0 && Number(counts.WR) >= 2) {
    if (position === 'RB') value += 2;
    if (position === 'WR') value -= 2;
  }


  /*
   * -------------------------------------------------------
   * CLAMP
   * -------------------------------------------------------
   *
   * Keep roster construction as a supporting signal.
   */

  value =
    Math.max(
      -2,
      Math.min(
        5,
        value
      )
    );


  return value;
}

function calculateByeWeekCongestionAdjustment(player, context) {
  player = player || {};
  context = context || {};
  var bye = String(player.bye || (player.row && player.row.getAttribute('data-bye')) || '').trim();
  if (!bye || bye === '--' || bye === '-' || bye === '0') return 0;

  var byeCounts = context.rosterByeCounts ||
    (getDraftAssistantRosterState().byeCounts || {});
  var existing = Number(byeCounts[bye]) || 0;
  if (existing < 3) return 0;

  var adjustment = existing === 3 ? -2 : existing === 4 ? -9 : -12;
  var round = Math.ceil((Number(context.currentPick) || 1) / Math.max(1, Number(context.teams) || 10));
  if (round <= 4) adjustment *= 0.5;
  else if (round <= 7) adjustment *= 0.75;

  var position = player.position || player.pos;
  if (existing >= 4 && (position === 'QB' || position === 'TE')) adjustment -= 1;
  return Math.max(-12, Number(adjustment.toFixed(2)));
}

function calculateRosterSaturationPenalty(
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


  /*
   * -------------------------------------------------------
   * CURRENT ROSTER COUNTS
   * -------------------------------------------------------
   */

  var counts = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0
  };


  document
    .querySelectorAll(
      'tr.draftrow.drafted-mine'
    )
    .forEach(function(row) {

      var pos =
        row.getAttribute(
          'data-pos'
        );

      if (
        pos &&
        counts[pos] !== undefined
      ) {

        counts[pos]++;

      }

    });


  var currentCount =
    Number(
      counts[position]
    ) || 0;


  /*
   * -------------------------------------------------------
   * POSITION SATURATION
   * -------------------------------------------------------
   *
   * Negative numbers are penalties.
   *
   * These are intentionally soft until the roster
   * becomes clearly overstocked.
   */

  var penalty = 0;


if (position === 'RB') {

  /*
   * RB1-RB4:
   * normal roster construction.
   *
   * RB5:
   * mild depth penalty.
   *
   * RB6:
   * meaningful saturation.
   *
   * RB7+:
   * must be exceptional value.
   */

  if (currentCount >= 7) {

    penalty = -16;

  } else if (currentCount === 6) {

    penalty = -12;

  } else if (currentCount === 5) {

    penalty = -6;

  } else if (currentCount === 4) {

    penalty = -2;

  }

} else if (position === 'WR') {

    if (currentCount >= 7) {

      penalty = -10;

    } else if (currentCount === 6) {

      penalty = -6;

    } else if (currentCount === 5) {

      penalty = -3;

    }


  } else if (position === 'QB') {

    if (currentCount >= 2) {

      penalty = -10;

    } else if (currentCount === 1) {

      penalty = -4;

    }


  } else if (position === 'TE') {

    if (currentCount >= 3) {

      penalty = -10;

    } else if (currentCount === 2) {

      penalty = -6;

    } else if (currentCount === 1) {

      penalty = -2;

    }

  }


  /*
   * -------------------------------------------------------
   * BENCH BALANCE
   * -------------------------------------------------------
   *
   * If one position is heavily stocked while the other
   * main FLEX position is thin, increase the penalty.
   */

if (
  position === 'RB'
) {

  /*
   * If RB depth is substantially ahead of WR depth,
   * discourage further concentration.
   */

  var rbWrDifference =
    counts.RB - counts.WR;


  if (
    counts.RB >= 5 &&
    rbWrDifference >= 3
  ) {

    penalty -= 4;

  } else if (
    counts.RB >= 5 &&
    rbWrDifference >= 2
  ) {

    penalty -= 2;

  }

}


  if (
    position === 'WR' &&
    counts.WR >= 5 &&
    counts.RB <= 2
  ) {

    penalty -= 3;

  }


  return penalty;
}

function calculateEndgameRosterRequirement(
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

  var currentPick =
    Number(context.currentPick) || 0;

  var teams =
    Number(context.teams) || 10;

  var rounds =
    Number(context.rounds) ||
    Number(
      context.draftState && context.draftState.rounds
    ) ||
    Number(getDraftAssistantState().rounds) ||
    16;


  if (
    !position ||
    currentPick <= 0 ||
    teams <= 0 ||
    rounds <= 0
  ) {
    return 0;
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
   * CURRENT ROSTER COUNTS
   * -------------------------------------------------------
   */

  var counts = context.rosterCounts || getDraftAssistantRosterState().counts;


  var kNeeded =
    counts.K <= 0;

  var dstNeeded =
    counts.DST <= 0;


  /*
   * -------------------------------------------------------
   * ENDGAME TIMING
   * -------------------------------------------------------
   *
   * We want K/DST late, not early.
   */

  var finalRound =
    rounds;

  var secondLastRound =
    Math.max(
      1,
      rounds - 1
    );

  var thirdLastRound =
    Math.max(
      1,
      rounds - 2
    );


  var adjustment = 0;


  /*
   * -------------------------------------------------------
   * TOO EARLY
   * -------------------------------------------------------
   *
   * Strongly discourage K/DST before the final
   * few rounds.
   */

  if (
    round < thirdLastRound
  ) {

    if (
      position === 'K' ||
      position === 'DST'
    ) {

      adjustment -= 15;

    }

    return adjustment;
  }


  /*
   * -------------------------------------------------------
   * THIRD-LAST ROUND
   * -------------------------------------------------------
   *
   * They may begin entering consideration, but should
   * not dominate yet.
   */

  if (
    round === thirdLastRound
  ) {

    if (
      position === 'K' &&
      kNeeded
    ) {
      adjustment += 2;
    }

    if (
      position === 'DST' &&
      dstNeeded
    ) {
      adjustment += 2;
    }

  }


  /*
   * -------------------------------------------------------
   * SECOND-LAST ROUND
   * -------------------------------------------------------
   *
   * Missing K/DST now becomes important.
   */

  if (
    round === secondLastRound
  ) {

    if (
      position === 'K' &&
      kNeeded
    ) {
      adjustment += 12;
    }

    if (
      position === 'DST' &&
      dstNeeded
    ) {
      adjustment += 12;
    }


    /*
     * Discourage another bench skill player while
     * both required endgame positions are still empty.
     */

    if (
      kNeeded &&
      dstNeeded &&
      position !== 'K' &&
      position !== 'DST'
    ) {

      adjustment -= 8;

    }

  }


  /*
   * -------------------------------------------------------
   * FINAL ROUND
   * -------------------------------------------------------
   */

  if (
    round >= finalRound
  ) {

    if (
      kNeeded &&
      position === 'K'
    ) {

      adjustment += 25;

    }

    if (
      dstNeeded &&
      position === 'DST'
    ) {

      adjustment += 25;

    }


    /*
     * If one required position remains unfilled,
     * heavily penalize unrelated selections.
     */

    if (
      (kNeeded || dstNeeded) &&
      position !== 'K' &&
      position !== 'DST'
    ) {

      adjustment -= 20;

    }


    /*
     * Do not reward duplicate K/DST.
     */

    if (
      position === 'K' &&
      !kNeeded
    ) {

      adjustment -= 20;

    }

    if (
      position === 'DST' &&
      !dstNeeded
    ) {

      adjustment -= 20;

    }

  }


  return adjustment;
}

function calculateDraftStrategy(suppliedCounts) {

  var counts = suppliedCounts || {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0
  };

  if (!suppliedCounts) document
    .querySelectorAll(
      'tr.draftrow.drafted-mine'
    )
    .forEach(function(row){

      var pos =
        row.getAttribute('data-pos');

      if(pos && counts[pos] !== undefined){
        counts[pos]++;
      }

    });


  var rbSlots =
    Number(ROSTER_SLOTS.RB) || 2;

  var wrSlots =
    Number(ROSTER_SLOTS.WR) || 2;

  var teSlots =
    Number(ROSTER_SLOTS.TE) || 1;

  var flexSlots =
    Number(ROSTER_SLOTS.FLEX) || 1;

  var qbSlots =
    Number(ROSTER_SLOTS.QB) || 1;


  /*
   * -------------------------------------------------------
   * STARTER REQUIREMENTS
   * -------------------------------------------------------
   */

  var rbNeed =
    Math.max(
      0,
      rbSlots - counts.RB
    );

  var wrNeed =
    Math.max(
      0,
      wrSlots - counts.WR
    );

  var teNeed =
    Math.max(
      0,
      teSlots - counts.TE
    );

  var qbNeed =
    Math.max(
      0,
      qbSlots - counts.QB
    );


  /*
   * -------------------------------------------------------
   * FLEX STATUS
   * -------------------------------------------------------
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
      flexSlots - flexFilled
    );


  /*
   * -------------------------------------------------------
   * POSITIONAL BALANCE
   * -------------------------------------------------------
   *
   * Positive = position still needs attention.
   * Negative = position is already well stocked.
   */

  var rbPressure =
    rbNeed;

  var wrPressure =
    wrNeed;

  var tePressure =
    teNeed;

  var qbPressure =
    qbNeed;


  /*
   * FLEX creates additional value for RB/WR/TE.
   */

  if(flexNeed > 0){

    rbPressure += flexNeed;
    wrPressure += flexNeed;
    tePressure += flexNeed;

  }


  /*
   * -------------------------------------------------------
   * DETERMINE GENERAL TARGET
   * -------------------------------------------------------
   */

  /*
 * -------------------------------------------------------
 * DETERMINE GENERAL TARGET
 * -------------------------------------------------------
 *
 * Prefer true dedicated starter needs over pressure that
 * exists only because the FLEX spot is still open.
 */

var targetPosition = null;
var targetPressure = -1;
var targetDedicatedNeed = -1;

[
  {
    position: 'RB',
    pressure: rbPressure,
    dedicatedNeed: rbNeed
  },
  {
    position: 'WR',
    pressure: wrPressure,
    dedicatedNeed: wrNeed
  },
  {
    position: 'TE',
    pressure: tePressure,
    dedicatedNeed: teNeed
  },
  {
    position: 'QB',
    pressure: qbPressure,
    dedicatedNeed: qbNeed
  }
].forEach(function(item) {

  /*
   * Higher pressure always wins.
   */
  if (item.pressure > targetPressure) {

    targetPressure =
      item.pressure;

    targetDedicatedNeed =
      item.dedicatedNeed;

    targetPosition =
      item.position;

    return;
  }

  /*
   * If pressure is tied, prefer the position that still
   * has an actual dedicated starter vacancy.
   *
   * Example:
   *
   * RB pressure = 1 only because FLEX is open
   * QB pressure = 1 because QB starter is empty
   *
   * QB should win.
   */
  if (
    item.pressure === targetPressure &&
    item.dedicatedNeed > targetDedicatedNeed
  ) {

    targetDedicatedNeed =
      item.dedicatedNeed;

    targetPosition =
      item.position;

  }

});


  /*
   * -------------------------------------------------------
   * STRATEGY TYPE
   * -------------------------------------------------------
   */

  var strategy =
    'BEST VALUE';

  if(targetPressure >= 2){

    strategy =
      'FILL NEED';

  } else if(targetPressure === 1){

    strategy =
      'LEAN ' +
      targetPosition;

  }


  /*
   * -------------------------------------------------------
   * FLEX STATUS DESCRIPTION
   * -------------------------------------------------------
   */

  var flexStatus;

  if(flexNeed > 0){

    flexStatus =
      'FLEX spot still open';

  } else {

    flexStatus =
      'FLEX currently covered';

  }


  return {

    counts:
      counts,

    needs: {

      QB: qbNeed,
      RB: rbNeed,
      WR: wrNeed,
      TE: teNeed,
      FLEX: flexNeed

    },

    pressure: {

      QB: qbPressure,
      RB: rbPressure,
      WR: wrPressure,
      TE: tePressure

    },

    targetPosition:
      targetPosition,

    targetPressure:
      targetPressure,

    strategy:
      strategy,

    flexStatus:
      flexStatus

  };

}

function calculateDynamicStrategyAdjustment(
  player,
  strategyState
) {

  if (
    !player ||
    !strategyState ||
    !strategyState.positions
  ) {

    return 0;

  }


  var position =
    player.position ||
    player.pos ||
    null;


  if (!position) {
    return 0;
  }


  var positionState =
    strategyState.positions[
      position
    ];


  if (!positionState) {
    return 0;
  }


  var state =
    positionState.state ||
    'NEUTRAL';


  var adjustment = 0;


  if (
    state === 'PRIORITIZE'
  ) {

    adjustment =
      1.25;

  } else if (
    state === 'MONITOR'
  ) {

    adjustment =
      0.50;

  } else if (
    state === 'WAIT'
  ) {

    adjustment =
      -0.75;

  }


  /*
   * Keep Phase 12 intentionally bounded.
   */

  adjustment =
    Math.max(
      -1,
      Math.min(
        1.5,
        adjustment
      )
    );


  return adjustment;

}

function generateDraftStrategyExplanation(strategy) {

  if(!strategy){
    return null;
  }

  var counts =
    strategy.counts || {};

  var needs =
    strategy.needs || {};

  var target =
    strategy.targetPosition;

  var explanation = '';

  var priority = [];

  /*
   * -------------------------------------------------------
   * ROSTER STATUS
   * -------------------------------------------------------
   */

  if(needs.QB > 0){

    priority.push(
      'QB'
    );

  }

  if(needs.RB > 0){

    priority.push(
      'RB'
    );

  }

  if(needs.WR > 0){

    priority.push(
      'WR'
    );

  }

  if(needs.TE > 0){

    priority.push(
      'TE'
    );

  }

  if(needs.FLEX > 0){

    priority.push(
      'FLEX'
    );

  }


  /*
   * -------------------------------------------------------
   * STRATEGY EXPLANATION
   * -------------------------------------------------------
   */

  if(strategy.strategy === 'FILL NEED'){

    explanation =
      'Your roster has an open starting spot at ' +
      target +
      '. Prioritize this position unless a significantly better value falls.';

  } else if(strategy.strategy === 'LEAN QB'){

    explanation =
      'Your RB/WR/TE starting spots are covered. ' +
      'QB is your only immediate starting-position need, ' +
      'so lean QB without forcing the pick.';

  } else if(
    strategy.strategy.indexOf('LEAN ') === 0
  ){

    explanation =
      'Your roster is mostly balanced. ' +
      'Lean toward ' +
      target +
      ', but continue taking the best value available.';

  } else {

    explanation =
      'Your starting roster is balanced. ' +
      'Prioritize the best player value rather than forcing a position.';

  }


  /*
   * -------------------------------------------------------
   * FLEX
   * -------------------------------------------------------
   */

  if(needs.FLEX > 0){

    explanation +=
      ' You still need another RB/WR/TE for FLEX coverage.';

  } else {

    explanation +=
      ' Your FLEX is already covered.';

  }


  /*
   * -------------------------------------------------------
   * PRIORITY POSITIONS
   * -------------------------------------------------------
   */

  var priorityText =
    priority.length
      ? priority.join(', ')
      : 'None';


  return {

    text:
      explanation,

    priority:
      priority,

    priorityText:
      priorityText

  };

}

/* =========================================================
   LIVE DRAFT STATE AND SAFE SCENARIO STATE HELPERS
   ========================================================= */

function buildLiveDraftDebugState() {

  var players =
    getDraftAssistantPlayers();


  var available =
    players.filter(function(player) {
      return player && player.available;
    });

  var rosterState = getDraftAssistantRosterState();
  var rosterCounts = rosterState.counts;


  var draftState =
    getDraftAssistantState();

  var vorpResult =
    calculateAllFantasyVorp(players, draftState);

  var teams =
    Number(draftState.teams) || 10;

  var draftWindow =
    calculateMyNextDraftPick(
      draftState.currentPick,
      teams
    );

  var draftRuns =
    detectDraftRuns();

  var draftStrategy =
    calculateDraftStrategy(rosterCounts);

  var tierCliffs = {};

  ['QB', 'RB', 'WR', 'TE'].forEach(
    function(position) {

      tierCliffs[position] =
        calculatePositionTierCliff(
          position,
          players,
          vorpResult.profiles
        );

    }
  );

  var vorpMax =
    Math.max.apply(
      null,
      vorpResult.profiles.map(function(profile) {
        return Number(profile.vorp) || 0;
      })
    );

  var rosterNeeds =
  calculateDecisionRosterNeeds(rosterCounts);

  var draftPhase =
    getDraftPhase(draftState.currentPick, teams);

  var context = {

    players:
      players,

    availablePlayers:
      available,

    teams:
      teams,

    rounds:
      Number(draftState.rounds) || 16,

    totalPicks:
      Number(draftState.totalPicks) || (teams * 16),

    currentPick:
      draftState.currentPick,

    draftSlot:
      Number(draftState.draftSlot) || 1,

    draftState:
      draftState,

    skipMultiPickPlanning:
      true,

    skipFutureDepth:
      true,

    draftPhase:
      draftPhase,

    phaseWeights:
      getDraftPhaseWeights(draftPhase.phase),

    marketPools:
      vorpResult.marketPools || {},

    lateAvailabilityCache:
      vorpResult.lateAvailabilityCache || {},

    nextPickSurvivalCache:
  {},

opponentThreatCache:
  {},

    nextPick:
      draftWindow.nextPick,

    calculatedNextPick:
      draftWindow.nextPick,

    calculatedPicksUntilNext:
      draftWindow.picksBetween,

    picksUntilMyTurn:
      draftWindow.picksBetween,

    replacements:
      vorpResult.replacements,

    rosterNeeds:
  rosterNeeds,

    rosterCounts:
      rosterCounts,

    rosterByeCounts:
      rosterState.byeCounts || {},

    strategy:
      draftStrategy,

    draftRuns:
      draftRuns,

    tierCliffs:
      tierCliffs,

    vorpMax:
      vorpMax,

    vorpProfiles:
      vorpResult.profiles

  };

  var scored =
    vorpResult.profiles
      .filter(function(profile) {

        return profile &&
          profile.player &&
          profile.player.available &&
          isRecommendationRosterEligible(profile.player, rosterCounts);

      })
      .map(function(profile) {

        var player =
          Object.assign(
            {},
            profile.player,
            {
              vorp:
                profile.vorp,

              scarcity:
                profile.scarcity,

              draftAware:
                profile.draftAware
            }
          );

        return calculateDraftDecisionScore(
          player,
          context
        );

      });
  
  /*
 * -------------------------------------------------------
 * ADD K / DST TO DECISION POOL
 * -------------------------------------------------------
 *
 * K and DST are not part of the VORP profile system,
 * but they still need to enter the decision engine so
 * late-round roster requirements can select them.
 */

players
  .filter(function(player) {

    return (
      player &&
      player.available &&
      hasAuthoritativeEcr(player) &&
      (
        player.position === 'K' ||
        player.position === 'DST'
      )
    );

  })
  .forEach(function(player) {

    /*
     * Give special-teams players neutral fantasy-value
     * inputs. Their timing and endgame requirement logic
     * will determine when they become viable.
     */

    var specialTeamsPlayer =
      Object.assign(
        {},
        player,
        {
          vorp:
            0,

          scarcity:
            0,

          draftAware:
            0
        }
      );


    var scoredSpecialTeams =
      calculateDraftDecisionScore(
        specialTeamsPlayer,
        context
      );


    if (scoredSpecialTeams) {

      scored.push(
        scoredSpecialTeams
      );

    }

  });

scored.sort(function(a, b) {

  return (
    Number(b.finalScore || 0) -
    Number(a.finalScore || 0)
  );

});

/*
 * -------------------------------------------------------
 * PHASE 12 — DYNAMIC STRATEGY SNAPSHOT
 * -------------------------------------------------------
 *
 * Build strategy only after the initial scoring pass.
 *
 * This avoids recursion because the supplied state is
 * reused instead of building a new live draft state.
 */

var dynamicStrategyAudit =
  buildDynamicStrategyAudit({
    players:
      players,

    available:
      available,

    vorpResult:
      vorpResult,

    draftState:
      draftState,

    draftWindow:
      draftWindow,

    context:
      context,

    scored:
      scored
  });


var dynamicStrategyState =
  buildDynamicStrategyState(
    dynamicStrategyAudit
  );


context.dynamicStrategyState =
  dynamicStrategyState;

/*
 * -------------------------------------------------------
 * EXPENSIVE MULTI-PICK SECOND PASS
 * -------------------------------------------------------
 *
 * Only the strongest first-pass candidates need the
 * expensive multi-pick planning calculation.
 */

context.skipMultiPickPlanning =
  false;

context.skipFutureDepth =
  false;


var multiPickShortlist =
  scored.slice(0, 20);


multiPickShortlist.forEach(
  function(scoredPlayer) {

    if (
      !scoredPlayer ||
      !scoredPlayer.name
    ) {

      return;

    }


    var playerName =
      String(
        scoredPlayer.name
      ).toLowerCase();


    var profile =
      vorpResult.profiles.find(
        function(candidateProfile) {

          return (
            candidateProfile &&
            candidateProfile.player &&
            candidateProfile.player.name &&
            String(
              candidateProfile.player.name
            ).toLowerCase() ===
              playerName
          );

        }
      );


    if (!profile) {

      return;

    }


    var sourcePlayer =
      Object.assign(
        {},
        profile.player,
        {
          vorp:
            profile.vorp,

          scarcity:
            profile.scarcity,

          draftAware:
            profile.draftAware
        }
      );


    var rescoredPlayer =
      calculateDraftDecisionScore(
        sourcePlayer,
        context
      );


    if (!rescoredPlayer) {

      return;

    }


    var existingIndex =
      scored.findIndex(
        function(candidate) {

          return (
            candidate &&
            candidate.name &&
            String(
              candidate.name
            ).toLowerCase() ===
              playerName
          );

        }
      );


    if (existingIndex >= 0) {

      scored[existingIndex] =
        rescoredPlayer;

    }

  }
);


/*
 * The expensive adjustment can change the order,
 * so rank the pool again.
 */

scored.sort(function(a, b) {

  return (
    Number(b.finalScore || 0) -
    Number(a.finalScore || 0)
  );

});

/*
 * Cache base scored players for projection lookup.
 */

context.scoredPlayers =
  scored;

context.scoredByName = {};

scored.forEach(function(player) {

  if (
    !player ||
    !player.name
  ) {
    return;
  }

  context.scoredByName[
    String(player.name).toLowerCase()
  ] = player;

});


/*
 * -------------------------------------------------------
 * MULTI-PICK PACKAGE SECOND PASS
 * -------------------------------------------------------
 */

applyPackagePathAdjustments(
  scored,
  context,
  8
);

/* A worse ECR option cannot dominate a better available player
 * at the same position solely because of derived strategy nudges. */
enforceAuthoritativePositionOrder(scored);

/* ECR remains the value authority while ADP determines whether that value
 * is urgent now or is likely to remain available at the next selection. */
applyMarketAwareRecommendationPriority(scored, context);

  return {
    players:
      players,

    available:
      available,

    vorpResult:
      vorpResult,

    draftState:
      draftState,

    draftWindow:
      draftWindow,

    context:
      context,

    scored:
      scored
  };
}


function draftEngineWithSimulatedPriorPicks(
  pick,
  fn
) {

  pick =
    Number(pick) || 0;

  if (pick <= 0) {
    return fn();
  }

  var rows =
    Array.prototype.slice.call(
      document.querySelectorAll('tr.draftrow')
    );

  var originalClasses =
    rows.map(function(row) {
      return row.className;
    });

  var originalPickAttributes =
  rows.map(function(row) {

    return {
      pick:
        row.getAttribute('data-pick'),

      teamSlot:
        row.getAttribute('data-team-slot')
    };

  });


  /*
   * -------------------------------------------------------
   * RESET TEMPORARY DRAFT MARKERS
   * -------------------------------------------------------
   */

  rows.forEach(function(row) {

    row.classList.remove(
      'drafted-mine',
      'drafted-other'
    );

  });


  /*
   * -------------------------------------------------------
   * BUILD RANKED PLAYER LIST
   * -------------------------------------------------------
   */

  var players =
    getDraftAssistantPlayers()
      .filter(function(player) {

        return player &&
          player.row &&
          player.rank;

      })
      .slice()
      .sort(function(a, b) {

        return (
          Number(a.rank) -
          Number(b.rank)
        );

      });


  /*
   * -------------------------------------------------------
   * SIMULATE PICKS BEFORE CURRENT PICK
   * -------------------------------------------------------
   *
   * Pick 11 means picks 1–10 have already happened.
   */

 var playersToRemove =
  Math.max(
    0,
    pick - 1
  );

var teams =
  Number(
    getDraftAssistantState().teams
  ) || 10;

players
  .slice(0, playersToRemove)
  .forEach(function(player, index) {

    if (!player.row) {
      return;
    }

    var simulatedPick =
      index + 1;

    var mapping =
      getSnakeDraftTeamForPick(
        simulatedPick,
        teams
      );

    player.row.classList.add(
      'drafted-other'
    );

    player.row.setAttribute(
      'data-pick',
      simulatedPick
    );

    if (
      mapping &&
      mapping.teamSlot
    ) {

      player.row.setAttribute(
        'data-team-slot',
        mapping.teamSlot
      );

    }

  });


  try {

    return fn();

  } finally {

    /*
     * -------------------------------------------------------
     * ALWAYS RESTORE REAL BOARD
     * -------------------------------------------------------
     */

    rows.forEach(function(row, index) {

      row.className =
        originalClasses[index];

      var original =
  originalPickAttributes[index];

if (original.pick !== null) {

  row.setAttribute(
    'data-pick',
    original.pick
  );

} else {

  row.removeAttribute(
    'data-pick'
  );

}

if (original.teamSlot !== null) {

  row.setAttribute(
    'data-team-slot',
    original.teamSlot
  );

} else {

  row.removeAttribute(
    'data-team-slot'
  );

}

    });

  }
}
