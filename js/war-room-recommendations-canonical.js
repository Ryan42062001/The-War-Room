/**
 * Required recommendation correctness for the canonical draft engine.
 *
 * This file is loaded statically immediately after war-room-recommendations.js.
 * It owns the approved #91 take-now/future-value contract and package-path
 * budgeting. Startup fails closed if this required dependency is unavailable.
 */
'use strict';

var WAR_ROOM_CANONICAL_RECOMMENDATIONS_VERSION = '20260907-1';

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
   *
   * Current choice uses take-now recommendation priority.
   * Preserve raw player value separately for diagnostics.
   */

  var rawPlayerValue =
    Number(player.finalScore) || 0;

  var score =
    getRecommendationTakeNowScore(player);


  /*
   * -------------------------------------------------------
   * 2. NEXT BEST PLAYER
   * -------------------------------------------------------
   *
   * Future alternatives stay on raw player value. Survival
   * remains a separate timing/probability input.
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
    ? Number(nextPlayer.finalScore) || 0
    : 0;

var rawScoreGap =
  score - nextScore;

var scoreGap =
  rawScoreGap;


  /*
   * -------------------------------------------------------
   * 5. CONFIDENCE SCORE
   * -------------------------------------------------------
   *
   * The confidence helper consistently compares take-now
   * priority fields. For this future option, explicitly make
   * that field equal raw value so recommendation confidence
   * follows the approved current-priority vs future-value basis.
   */

  var confidenceNextPlayer =
    nextPlayer
      ? Object.assign({}, nextPlayer, {
          recommendationPriorityScore:
            Number(nextPlayer.finalScore) || 0
        })
      : null;

  var confidenceScore =
    calculateRecommendationConfidence(
      player,
      confidenceNextPlayer,
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


/* The decision helper historically reads player.finalScore. Supply the
 * approved take-now value without mutating the scored player object. */
var decisionPlayer =
  Object.assign({}, player, {
    finalScore: score
  });

var decision =
  calculateRecommendationDecision(
    decisionPlayer,
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
      score,

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

    rawPlayerValue:
      rawPlayerValue,

    takeNowPriority:
      score,

    scoreBasis:
      'TAKE_NOW_PRIORITY_VS_FUTURE_VALUE',

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

/*
 * Package-path advantage is a strategy signal and therefore remains inside
 * the configured strategyAdjustmentBudget (normally -15..+15). The retired
 * duplicate multi-pick signal is removed from the same budget before the
 * package-path advantage is applied.
 */
function applyPackagePathAdjustments(scoredPlayers, context, limit) {
  scoredPlayers = Array.isArray(scoredPlayers) ? scoredPlayers : [];
  context = context || {};
  limit = Math.max(0, Number(limit) || 8);

  var budget = WAR_ROOM_CONFIG.strategyAdjustmentBudget || {min:-15, max:15};
  var minBudget = Number.isFinite(Number(budget.min)) ? Number(budget.min) : -15;
  var maxBudget = Number.isFinite(Number(budget.max)) ? Number(budget.max) : 15;

  scoredPlayers.forEach(function(player) {
    if (player) player.packagePathAdvantageScore = 0;
  });

  var plans = scoredPlayers.slice(0, limit).map(function(player) {
    var advantage = Number(
      typeof calculatePackagePathAdvantage === 'function'
        ? calculatePackagePathAdvantage(player, scoredPlayers, context)
        : 0
    ) || 0;

    return {
      player: player,
      advantage: Math.max(-2, Math.min(2, advantage))
    };
  });

  plans.forEach(function(plan) {
    var player = plan.player;
    if (!player) return;

    var advantage = plan.advantage;
    player.packagePathAdvantageScore = advantage;

    var baseScore = Number(player.baseScore);
    var rawStrategy = Number(player.rawStrategyAdjustment);
    var guardrails = Number(player.guardrailAdjustment);
    var legacyMultiPick = Number(player.phaseAdjustedMultiPickScore) || 0;

    if (
      Number.isFinite(baseScore) &&
      Number.isFinite(rawStrategy) &&
      Number.isFinite(guardrails)
    ) {
      var correctedRaw = rawStrategy - legacyMultiPick + advantage;
      var capped = Math.max(minBudget, Math.min(maxBudget, correctedRaw));

      player.retiredMultiPickPlanningScore = legacyMultiPick;
      player.multiPickPlanningScore = 0;
      player.phaseAdjustedMultiPickScore = 0;
      player.rawStrategyAdjustment = Number(correctedRaw.toFixed(2));
      player.cappedStrategyAdjustment = Number(capped.toFixed(2));
      player.guardrailAdjustment = guardrails;
      player.finalScore = baseScore + player.cappedStrategyAdjustment + guardrails;
      player.packagePathBudgeted = true;
    } else {
      /* Synthetic/debug fixtures without score diagnostics retain finite behavior. */
      player.finalScore = (Number(player.finalScore) || 0) + advantage;
      player.packagePathBudgeted = false;
    }
  });

  scoredPlayers.sort(function(a, b) {
    return Number(b && b.finalScore || 0) - Number(a && a.finalScore || 0);
  });

  return scoredPlayers;
}

window.WarRoomCanonicalRecommendations = {
  version: WAR_ROOM_CANONICAL_RECOMMENDATIONS_VERSION,
  scoreBasis: 'TAKE_NOW_PRIORITY_VS_FUTURE_VALUE',
  packagePathUsesStrategyBudget: true
};
