/**
 * Scoring correctness corrections discovered in the 2026 audit.
 *
 * This layer loads before runAppInitialization(). It intentionally fixes
 * inconsistent scoring contracts without changing FantasyPros/ESPN source
 * authority or the core 35/25/20/10/5/5 base-value weights.
 */
(function() {
  'use strict';

  var VERSION = '20260907-1';

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function getTakeNowScore(player) {
    if (!player) return 0;
    var priority = Number(player.recommendationPriorityScore);
    return Number.isFinite(priority)
      ? priority
      : Number(player.finalScore) || 0;
  }

  /*
   * Roster need is a 0-100 factor. Draft-aware VORP is a 0-5 factor and
   * tier-cliff opportunity currently returns 0, 3, or 5. The old confidence
   * thresholds still reflected earlier scales, so several branches were
   * unreachable and a single 25-point roster need received the same maximum
   * confidence credit as a 100-point need.
   */
  window.calculateRecommendationConfidence = function(player, nextPlayer, context) {
    if (!player) return 0;
    context = context || {};

    var confidence = 0;
    var score = getTakeNowScore(player);
    var nextScore = nextPlayer ? getTakeNowScore(nextPlayer) : 0;
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

    return clamp(Math.round(confidence), 0, 100);
  };

  /*
   * The recommendation layer previously compared the primary player's raw
   * finalScore with the future alternative's take-now priority score, while
   * confidence used the opposite mix. Normalize that contract:
   *
   *   current pick  -> take-now priority
   *   future option -> raw player value, with survival handled separately
   *
   * The existing recommendation engine still owns all DRAFT/WAIT/PASS rules.
   */
  var legacyCalculateDraftRecommendation = window.calculateDraftRecommendation;
  if (typeof legacyCalculateDraftRecommendation === 'function') {
    window.calculateDraftRecommendation = function(player, scoredPlayers, context) {
      if (!player) return null;

      var originalPlayers = Array.isArray(scoredPlayers) ? scoredPlayers : [];
      var normalizedPlayers = originalPlayers.map(function(candidate) {
        var clone = Object.assign({}, candidate);
        clone.recommendationPriorityScore = Number(candidate.finalScore) || 0;
        return clone;
      });
      var normalizedPlayer = Object.assign({}, player, {
        finalScore: getTakeNowScore(player)
      });

      var result = legacyCalculateDraftRecommendation(
        normalizedPlayer,
        normalizedPlayers,
        context || {}
      );

      normalizedPlayers.forEach(function(candidate, index) {
        var original = originalPlayers[index];
        if (!original) return;
        if (Number.isFinite(Number(candidate.nextPickSurvivalScore))) {
          original.nextPickSurvivalScore = Number(candidate.nextPickSurvivalScore);
        }
        if (Number.isFinite(Number(candidate.survivalAdjustedScore))) {
          original.survivalAdjustedScore = Number(candidate.survivalAdjustedScore);
        }
      });

      if (result) {
        result.rawPlayerValue = Number(player.finalScore) || 0;
        result.takeNowPriority = getTakeNowScore(player);
        result.scoreBasis = 'TAKE_NOW_PRIORITY_VS_FUTURE_VALUE';
      }

      return result;
    };
  }

  /*
   * Retire the older positional multi-pick nudge. The newer package-path
   * calculation already evaluates the same planning question using projected
   * players and survival, so keeping both double-counts the concept.
   */
  window.calculateMultiPickPlanningScore = function() {
    return 0;
  };

  /*
   * Package-path advantage used to be added directly to finalScore after the
   * ±15 strategy cap. Keep the signal, but route it through that same budget.
   */
  window.applyPackagePathAdjustments = function(scoredPlayers, context, limit) {
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
      return {
        player: player,
        advantage: clamp(
          typeof window.calculatePackagePathAdvantage === 'function'
            ? window.calculatePackagePathAdvantage(player, scoredPlayers, context)
            : 0,
          -2,
          2
        )
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
        var capped = clamp(correctedRaw, minBudget, maxBudget);

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
  };

  window.WarRoomScoringCorrections = {
    version: VERSION,
    getTakeNowScore: getTakeNowScore,
    confidenceScales: {
      rosterNeed: '0-100',
      draftAwareVorp: '0-5',
      tierCliff: '0/3/5'
    },
    packagePathUsesStrategyBudget: true,
    legacyMultiPickPlanningRetired: true
  };
})();
