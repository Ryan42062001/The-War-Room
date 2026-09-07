/**
 * Required scoring correctness for the canonical draft engine.
 *
 * This file is loaded statically immediately after war-room-scoring.js and
 * before recommendations initialize. Startup fails closed if this required
 * dependency is unavailable, so approved #91 correctness cannot silently
 * fall back to the pre-fix scoring behavior.
 */
'use strict';

var WAR_ROOM_CANONICAL_SCORING_VERSION = '20260907-1';

function getRecommendationTakeNowScore(player) {
  if (!player) return 0;
  var priority = Number(player.recommendationPriorityScore);
  return Number.isFinite(priority)
    ? priority
    : Number(player.finalScore) || 0;
}

/*
 * Confidence factors use their actual engine scales:
 * roster need 0-100, draft-aware VORP 0-5, tier cliff 0/3/5.
 */
function calculateRecommendationConfidence(player, nextPlayer, context) {
  if (!player) return 0;
  context = context || {};

  var confidence = 0;
  var score = getRecommendationTakeNowScore(player);
  var nextScore = nextPlayer ? getRecommendationTakeNowScore(nextPlayer) : 0;
  var scoreGap = score - nextScore;

  if (scoreGap >= 10) confidence += 30;
  else if (scoreGap >= 7) confidence += 25;
  else if (scoreGap >= 5) confidence += 20;
  else if (scoreGap >= 3) confidence += 15;
  else if (scoreGap >= 1) confidence += 8;

  var playerVorp = Number(player.vorpScore) || 0;
  var nextVorp = nextPlayer ? Number(nextPlayer.vorpScore) || 0 : 0;
  var vorpDifference = playerVorp - nextVorp;
  if (vorpDifference >= 20) confidence += 20;
  else if (vorpDifference >= 10) confidence += 15;
  else if (vorpDifference >= 5) confidence += 10;
  else if (vorpDifference >= 2) confidence += 5;

  var playerTier = Number(player.tierScore) || 0;
  var nextTier = nextPlayer ? Number(nextPlayer.tierScore) || 0 : 0;
  var tierDifference = playerTier - nextTier;
  if (tierDifference >= 20) confidence += 15;
  else if (tierDifference >= 10) confidence += 10;
  else if (tierDifference >= 5) confidence += 6;
  else if (tierDifference >= 2) confidence += 3;

  var timing = Number(player.timingScore) || 0;
  if (timing >= 80) confidence += 10;
  else if (timing >= 65) confidence += 7;
  else if (timing >= 50) confidence += 4;

  var scarcity = Number(player.scarcityScore) || 0;
  if (scarcity >= 80) confidence += 10;
  else if (scarcity >= 60) confidence += 7;
  else if (scarcity >= 40) confidence += 4;

  var need = Number(player.rosterNeedScore) || 0;
  if (need >= 50) confidence += 5;
  else if (need >= 25) confidence += 3;

  var draftAware = Number(player.draftAwareVorpOpportunityScore) || 0;
  if (draftAware >= 5) confidence += 10;
  else if (draftAware >= 3) confidence += 7;
  else if (draftAware >= 1.5) confidence += 4;

  var tierCliff = Number(player.tierCliffOpportunityScore) || 0;
  if (tierCliff >= 5) confidence += 10;
  else if (tierCliff >= 3) confidence += 6;

  if (nextPlayer) {
    var survival = Number(nextPlayer.nextPickSurvivalScore) || 0;
    if (survival >= 80) confidence += 5;
    else if (survival >= 60) confidence += 3;
  }

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

/*
 * Package-path projection already evaluates the multi-pick planning concept.
 * Keep the older duplicate nudge retired at its scoring boundary.
 */
function calculateMultiPickPlanningScore() {
  return 0;
}

window.WarRoomCanonicalScoring = {
  version: WAR_ROOM_CANONICAL_SCORING_VERSION,
  confidenceScales: {
    rosterNeed: '0-100',
    draftAwareVorp: '0-5',
    tierCliff: '0/3/5'
  },
  legacyMultiPickPlanningRetired: true
};
