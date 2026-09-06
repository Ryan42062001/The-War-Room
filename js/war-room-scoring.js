/* =========================================================
   DRAFT ASSISTANT — STAGE 2
   FANTASY VORP + POSITIONAL SCARCITY
   ========================================================= */

/*
 * Positions that matter for the core VORP calculation.
 *
 * K and DST are intentionally excluded for now.
 * We'll give them separate late-round logic later.
 */
var VORP_POSITIONS = ['QB', 'RB', 'WR', 'TE'];

function hasAuthoritativeEcr(player) {
  if (!player) return false;

  var ecr = Number(player.ecr);
  if (Number.isFinite(ecr) && ecr > 0) return true;

  /* Unit-test fixtures predate source metadata; production ADP-only rows do not. */
  return player.source !== 'ADP_ONLY' && Number(player.rank) > 0;
}

function isRecommendationRosterEligible(player, rosterCounts) {
  if (!player) return false;
  var position = player.position || player.pos || '';
  var cap = Number(RECOMMENDATION_POSITION_CAPS[position]);
  if (!Number.isFinite(cap)) return true;
  return (Number(rosterCounts && rosterCounts[position]) || 0) < cap;
}


/*
 * Get current league settings.
 */
function getVorpLeagueSettings() {

  var teams =
    parseInt(document.getElementById('pcTeams')?.value) || 10;

  return {
    teams: teams,

    rounds:
      parseInt(document.getElementById('pcRounds')?.value) || 16,

    draftSlot:
      parseInt(document.getElementById('pcSlot')?.value) || 1,

    QB: teams * 1,
    RB: teams * 2,
    WR: teams * 2,
    TE: teams * 1,

    FLEX: teams * 1
  };
}


/*
 * Return only available QB/RB/WR/TE players.
 */
function getAvailableVorpPlayers(players) {

  return players
    .filter(function(player) {

      return player.available &&
        VORP_POSITIONS.includes(player.position) &&
        player.rank &&
        hasAuthoritativeEcr(player);
    })
    .sort(function(a, b) {

      return a.rank - b.rank;
    });
}


/*
 * Get available players at one position.
 */
function getAvailableAtPosition(players, position) {

  return players
    .filter(function(player) {

      return player.available &&
        player.position === position &&
        player.rank &&
        hasAuthoritativeEcr(player);
    })
    .sort(function(a, b) {

      return a.rank - b.rank;
    });
}


/*
 * Calculate the FLEX replacement pool.
 *
 * FLEX can be RB / WR / TE.
 *
 * IMPORTANT:
 * We don't simply call the 10th-best player
 * the FLEX replacement.
 *
 * We first account for the dedicated position
 * requirements and then look at the remaining
 * RB/WR/TE pool.
 */
function calculateFlexPool(players, settings) {

  var rb =
    getAvailableAtPosition(players, 'RB');

  var wr =
    getAvailableAtPosition(players, 'WR');

  var te =
    getAvailableAtPosition(players, 'TE');

  /*
   * Remove the players needed to fill dedicated
   * RB / WR / TE starting spots.
   */
  var remainingRB =
    rb.slice(settings.RB);

  var remainingWR =
    wr.slice(settings.WR);

  var remainingTE =
    te.slice(settings.TE);

  var flexPool =
    remainingRB
      .concat(remainingWR)
      .concat(remainingTE)
      .sort(function(a, b) {

        return a.rank - b.rank;
      });

  return flexPool;
}


/*
 * Calculate replacement players.
 */
function calculateReplacementLevels(players) {

  var settings =
    getVorpLeagueSettings();

  /*
   * -------------------------------------------------------
   * REPLACEMENT LEVEL MODEL
   * -------------------------------------------------------
   *
   * Replacement level represents the player we expect
   * to be available at the edge of the league's starting
   * demand.
   *
   * Example in a 10-team league:
   *
   * QB  = 10 starters
   * RB  = 20 starters
   * WR  = 20 starters
   * TE  = 10 starters
   *
   * FLEX is shared between RB / WR / TE and is handled
   * separately below.
   *
   * Waiting risk is modeled separately by
   * calculateDraftAwareVorpOpportunity().
   */

  /*
   * -------------------------------------------------------
   * BUILD POSITION POOLS
   * -------------------------------------------------------
   */

  var positionPools = {};

  ['QB', 'RB', 'WR', 'TE'].forEach(function(position) {

    positionPools[position] =
      players
        .filter(function(player) {

          return player &&
            player.available &&
            player.position === position &&
            hasAuthoritativeEcr(player) &&
            player.rank !== undefined &&
            player.rank !== null &&
            player.rank !== '';

        })
        .slice()
        .sort(function(a, b) {

          return Number(a.rank) -
                 Number(b.rank);

        });

  });


  /*
   * VORP is a current player-value measurement. Keep the
   * replacement pool anchored to currently available ECR
   * players; the separate draft-aware opportunity model is
   * responsible for projecting losses before the next pick.
   */
  var projectedPositionPools = {};

  ['QB', 'RB', 'WR', 'TE'].forEach(function(position) {
    projectedPositionPools[position] = (positionPools[position] || []).slice();
  });


  /*
   * -------------------------------------------------------
   * POSITION REPLACEMENT LEVELS
   * -------------------------------------------------------
   *
   * IMPORTANT:
   *
   * We do NOT use pool[0].
   *
   * The replacement index is based on league demand.
   *
   * settings.QB = 10
   * settings.RB = 20
   * settings.WR = 20
   * settings.TE = 10
   *
   * Since arrays are zero-indexed, the replacement player
   * is at index demand - 1.
   */

  var replacement = {};

  ['QB', 'RB', 'WR', 'TE'].forEach(function(position) {

    var pool =
      projectedPositionPools[position] || [];

    var demand =
      Number(settings[position]) || 0;

    var replacementIndex =
      Math.max(
        0,
        demand - 1
      );

    replacement[position] =
      pool[replacementIndex] ||
      pool[pool.length - 1] ||
      null;

  });


  /*
   * -------------------------------------------------------
   * FLEX REPLACEMENT
   * -------------------------------------------------------
   *
   * FLEX is shared by RB / WR / TE.
   *
   * We don't want the best RB/WR/TE.
   *
   * Instead, approximate the FLEX replacement by taking
   * the player around the combined starting-demand edge.
   */

  var flexPool = [];

  ['RB', 'WR', 'TE'].forEach(function(position) {

    flexPool =
      flexPool.concat(
        projectedPositionPools[position] || []
      );

  });

  flexPool.sort(function(a, b) {

    return Number(a.rank) -
           Number(b.rank);

  });


  /*
   * The base RB/WR/TE demand already represents the
   * dedicated starting positions.
   *
   * FLEX adds one additional eligible player per team.
   */

  var flexDemand =
    Number(settings.FLEX) || 0;

  var flexIndex =
    (
      Number(settings.RB) || 0
    ) +
    (
      Number(settings.WR) || 0
    ) +
    (
      Number(settings.TE) || 0
    ) +
    flexDemand -
    1;

  flexIndex =
    Math.max(
      0,
      flexIndex
    );


  replacement.FLEX =
    flexPool[flexIndex] ||
    flexPool[flexPool.length - 1] ||
    null;


  /*
   * -------------------------------------------------------
   * DEBUG
   * -------------------------------------------------------
   */

  draftScoringLog(
  'CURRENT REPLACEMENT LEVELS:',
  {
    settings:
      settings,

    replacements:
      {
        QB:
          replacement.QB &&
          replacement.QB.name,

        RB:
          replacement.RB &&
          replacement.RB.name,

        WR:
          replacement.WR &&
          replacement.WR.name,

        TE:
          replacement.TE &&
          replacement.TE.name,

        FLEX:
          replacement.FLEX &&
          replacement.FLEX.name
      }
  }
);


  return replacement;
}

/*
 * =========================================================
 * REFINED POSITION REPLACEMENT QUALITY
 * =========================================================
 *
 * Prevents extreme replacement gaps from creating
 * unrealistic VORP values.
 *
 * The goal is to identify the next realistic fantasy-
 * relevant player at the position rather than simply
 * using the first available player far down the board.
 */

function calculateRefinedReplacementRank(
  player,
  players,
  context
){

  if(!player || !Array.isArray(players)){
    return 999;
  }

  var position =
    player.position ||
    player.pos ||
    'N/A';

  var playerRank =
    Number(
      player.rank ||
      player.rk ||
      999
    );

  /*
   * -------------------------------------------------------
   * 1. GET AVAILABLE PLAYERS AT POSITION
   * -------------------------------------------------------
   */

  var positionPlayers =
    players
      .filter(function(p){

        if(!p) return false;

        var pPosition =
          p.position ||
          p.pos ||
          'N/A';

        if(pPosition !== position){
          return false;
        }

        /*
         * Ignore players already drafted.
         */
        if(p.available === false){
          return false;
        }

        var rank =
          Number(
            p.rank ||
            p.rk ||
            999
          );

        return rank > playerRank;

      })
      .sort(function(a,b){

        return (
          Number(a.rank || a.rk || 999) -
          Number(b.rank || b.rk || 999)
        );

      });

  if(!positionPlayers.length){
    return 999;
  }

  /*
   * -------------------------------------------------------
   * 2. POSITION-SPECIFIC REALISTIC WINDOW
   * -------------------------------------------------------
   *
   * We don't want a TE ranked #112 to become the
   * replacement for a TE ranked #15 simply because
   * there are no other available TEs nearby.
   *
   * Different positions have different replacement
   * behavior.
   */

  var maxGap = 40;

  if(position === 'QB'){
    maxGap = 50;
  }

  if(position === 'RB'){
    maxGap = 45;
  }

  if(position === 'WR'){
    maxGap = 50;
  }

  if(position === 'TE'){
    maxGap = 55;
  }

  /*
   * -------------------------------------------------------
   * 3. FIND REALISTIC REPLACEMENT
   * -------------------------------------------------------
   */

  var realisticReplacement =
    positionPlayers.find(function(p){

      var rank =
        Number(
          p.rank ||
          p.rk ||
          999
        );

      return (
        rank - playerRank <= maxGap
      );

    });

  /*
   * If there is no player inside the realistic
   * window, use a capped fallback rather than
   * allowing an enormous replacement gap.
   */

  if(realisticReplacement){

    return Number(
      realisticReplacement.rank ||
      realisticReplacement.rk ||
      999
    );

  }

  return playerRank + maxGap;
}

/*
 * Find the effective replacement player for
 * a RB / WR / TE.
 *
 * A RB/WR/TE can be replaced through either:
 *
 * 1. Their dedicated position
 * 2. FLEX
 */

function getEffectiveReplacement(
  player,
  replacements
) {

  if (!player || !replacements) {
    return null;
  }

  var position =
    player.position ||
    player.pos ||
    null;

  /*
   * -------------------------------------------------------
   * POSITION-SPECIFIC REPLACEMENT
   * -------------------------------------------------------
   *
   * VORP and positional scarcity should compare a player
   * against the replacement level at HIS position.
   *
   * FLEX is intentionally NOT used here.
   *
   * Example:
   *
   * Brock Bowers (TE)
   *      ↓
   * TE replacement
   *
   * NOT:
   *
   * Brock Bowers (TE)
   *      ↓
   * Rhamondre Stevenson (RB)
   *
   * FLEX value will be handled separately by the
   * Decision Engine.
   */

  if (
    position === 'QB' ||
    position === 'RB' ||
    position === 'WR' ||
    position === 'TE'
  ) {

    return (
      replacements[position] ||
      null
    );

  }

  return null;
}

function calculateTierCliffOpportunity(player, context){

  if(!player || !context || !context.tierCliffs){
    return 0;
  }

  var position =
    player.position ||
    player.pos ||
    'N/A';

  var cliff =
    context.tierCliffs[position];

  /*
   * No meaningful cliff at this position.
   */
  if(!cliff ||
     !cliff.beforePlayer ||
     !cliff.afterPlayer){

    return 0;
  }

  /*
   * Only meaningful cliffs should create
   * draft urgency.
   */
  if(cliff.severity !== 'HIGH' &&
     cliff.severity !== 'MODERATE'){

    return 0;
  }

  /*
   * Only reward the player who is actually
   * sitting immediately above the cliff.
   */
  var cliffPlayer =
    cliff.beforePlayer;

  if(!cliffPlayer ||
     player.name !== cliffPlayer.name){

    return 0;
  }

  /*
   * Stronger cliffs receive a larger bonus.
   *
   * HIGH     = +5
   * MODERATE = +3
   */
  if(cliff.severity === 'HIGH'){
    return 5;
  }

  if(cliff.severity === 'MODERATE'){
    return 3;
  }

  return 0;
}

/*
 * Calculate positional VORP.
 *
 * Lower rank = better player.
 *
 * VORP is based on the gap between the player's
 * rank and his effective replacement player.
 */
function calculateFantasyVorp(
  player,
  replacement
) {

  if (
    !player ||
    !player.rank ||
    !replacement ||
    !replacement.rank
  ) {
    return 0;
  }

  var playerRank =
    Number(player.rank);

  var replacementRank =
    Number(replacement.rank);

  if (
    playerRank <= 0 ||
    replacementRank <= 0 ||
    playerRank >= replacementRank
  ) {
    return 0;
  }


  /*
   * -------------------------------------------------------
   * RANK-BASED VORP
   * -------------------------------------------------------
   *
   * We do not have fantasy-point projections in the player
   * data, so use positional rank distance as a proxy.
   *
   * Larger distance above replacement =
   * greater value over replacement.
   */


  var rankGap =
    replacementRank -
    playerRank;


  /*
   * Maximum possible gap within this position.
   *
   * A rank-1 player receives the maximum VORP
   * available for that position.
   */

  var maximumGap =
    replacementRank - 1;


  if (maximumGap <= 0) {
    return 0;
  }


  /*
   * Normalize to 0-100.
   */

  var vorp =
    (
      rankGap /
      maximumGap
    ) * 100;


  /*
   * -------------------------------------------------------
   * ELITE SEPARATION
   * -------------------------------------------------------
   *
   * Give the very top players a small additional
   * distinction without allowing the number to explode.
   */

  if (playerRank <= 3) {

    vorp += 5;

  } else if (playerRank <= 5) {

    vorp += 3;

  } else if (playerRank <= 10) {

    vorp += 1;

  }


  /*
   * Clamp.
   */

  vorp =
    Math.max(
      0,
      Math.min(
        100,
        vorp
      )
    );


  draftScoringLog(
    'RANK-BASED VORP:',
    player.name,
    'position =',
    player.position,
    'playerRank =',
    playerRank,
    'replacementRank =',
    replacementRank,
    'rankGap =',
    rankGap,
    'vorp =',
    vorp
  );


  return vorp;
}
/*
 * Calculate tier/drop-off information.
 *
 * This uses the existing tier information from
 * the player's row whenever available.
 */
function calculateTierDrop(player, players, sharedContext) {
  if (!player || !player.rank) {
    return {score: 0, nextPlayer: null, rankGap: 0};
  }

  var cacheKey = String(player.name || '').toLowerCase();
  var nextPlayer;

  if (
    sharedContext &&
    sharedContext.tierDropNextByName &&
    Object.prototype.hasOwnProperty.call(sharedContext.tierDropNextByName, cacheKey)
  ) {
    nextPlayer = sharedContext.tierDropNextByName[cacheKey];
  } else {
    nextPlayer = players
      .filter(function(candidate) {
        return candidate.available &&
          candidate.position === player.position &&
          candidate.rank &&
          hasAuthoritativeEcr(candidate) &&
          candidate.rank > player.rank;
      })
      .sort(function(a, b) { return a.rank - b.rank; })[0] || null;
  }

  if (!nextPlayer) {
    return {score: 100, nextPlayer: null, rankGap: 0};
  }

  var rankGap = nextPlayer.rank - player.rank;
  return {
    score: Math.min(100, rankGap * 10),
    nextPlayer: nextPlayer,
    rankGap: rankGap
  };
}

function calculatePositionTierCliff(
  position,
  players,
  vorpProfiles
) {

  if (!position || !players) {
    return {
      position: position || 'N/A',
      severity: 'NONE',
      cliffScore: 0,
      beforePlayer: null,
      afterPlayer: null,
      fromTier: null,
      toTier: null,
      tierGap: 0,
      rankGap: 0,
      playersBeforeCliff: 0,
      playersAfterCliff: 0
    };
  }


  /*
   * -------------------------------------------------------
   * GET AVAILABLE PLAYERS AT THIS POSITION
   * -------------------------------------------------------
   */

  var positionPlayers =
    players
      .filter(function(player) {

        return player &&
          player.available &&
          player.position === position &&
          player.rank &&
          hasAuthoritativeEcr(player);

      })
      .sort(function(a, b) {

        return (
          Number(a.rank) || 9999
        ) -
        (
          Number(b.rank) || 9999
        );

      });


  /*
   * Only examine the top available players.
   *
   * This keeps distant late-round tier changes
   * from becoming the most important cliff.
   */

  var LOOKAHEAD = 12;

  positionPlayers =
    positionPlayers.slice(
      0,
      LOOKAHEAD
    );


  if (positionPlayers.length < 2) {

    return {
      position: position,
      severity: 'NONE',
      cliffScore: 0,
      beforePlayer: null,
      afterPlayer: null,
      fromTier: null,
      toTier: null,
      tierGap: 0,
      rankGap: 0,
      playersBeforeCliff: 0,
      playersAfterCliff: 0
    };

  }


  /*
   * -------------------------------------------------------
   * GET TIER VALUE
   * -------------------------------------------------------
   *
   * Use the same tier system already used by
   * the Decision Engine.
   */

  var tierRank = SEMANTIC_TIER_ORDER;


  function getTierId(player) {

    try {

      var tier =
        getPlayerTierValue(
          player
        );

      if (tier && tier.semanticTier) {

        return tier.semanticTier;

      }

    } catch (e) {}

    return (
      LEGACY_TO_SEMANTIC_TIER[player.tier] ||
      player.semanticTier ||
      null
    );

  }


  /*
   * -------------------------------------------------------
   * FIND TIER TRANSITIONS
   * -------------------------------------------------------
   *
   * A tier cliff only exists when the actual
   * player tier changes.
   */

  var cliffs = [];


  for (
    var i = 0;
    i < positionPlayers.length - 1;
    i++
  ) {

    var beforePlayer =
      positionPlayers[i];

    var afterPlayer =
      positionPlayers[i + 1];


    var fromTier =
      getTierId(
        beforePlayer
      );

    var toTier =
      getTierId(
        afterPlayer
      );


    /*
     * If we cannot determine either tier,
     * don't guess.
     */

    if (
      !fromTier ||
      !toTier
    ) {

      continue;

    }


    /*
     * Same tier = no cliff.
     */

    if (
      fromTier === toTier
    ) {

      continue;

    }


    var fromValue =
      tierRank[fromTier];

    var toValue =
      tierRank[toTier];


    /*
     * Ignore unknown tier IDs.
     */

    if (
      fromValue === undefined ||
      toValue === undefined
    ) {

      continue;

    }


    /*
     * We only care about a DROP in quality.
     *
     * Example:
     *
     * A → B = real cliff
     *
     * B → A = not a cliff
     */

    var tierGap =
      toValue - fromValue;


    if (tierGap <= 0) {

      continue;

    }


    var rankGap =
      (
        Number(afterPlayer.rank) || 0
      ) -
      (
        Number(beforePlayer.rank) || 0
      );


    cliffs.push({

      beforePlayer:
        beforePlayer,

      afterPlayer:
        afterPlayer,

      fromTier:
        fromTier,

      toTier:
        toTier,

      tierGap:
        tierGap,

      rankGap:
        rankGap,

      index:
        i

    });

  }


  /*
   * -------------------------------------------------------
   * NO TIER CLIFF
   * -------------------------------------------------------
   */

  if (!cliffs.length) {

    return {
      position: position,
      severity: 'NONE',
      cliffScore: 0,
      beforePlayer: null,
      afterPlayer: null,
      fromTier: null,
      toTier: null,
      tierGap: 0,
      rankGap: 0,
      playersBeforeCliff: 0,
      playersAfterCliff: 0
    };

  }


  /*
   * -------------------------------------------------------
   * SCORE EACH TIER CLIFF
   * -------------------------------------------------------
   *
   * We care about three things:
   *
   * 1. How many tiers did we fall?
   * 2. How large is the rank gap?
   * 3. How early is the cliff?
   *
   * The earlier cliff gets additional importance.
   */

  cliffs.forEach(function(cliff) {

    var tierScore =
      Math.min(
        60,
        cliff.tierGap * 30
      );


    var rankScore =
      Math.min(
        25,
        Math.max(
          0,
          cliff.rankGap * 2
        )
      );


    /*
     * Earlier cliffs matter more.
     *
     * The first available transition gets
     * the strongest opportunity multiplier.
     */

    var positionMultiplier =
      Math.max(
        0.5,
        1 -
        (
          cliff.index * 0.08
        )
      );


    cliff.cliffScore =
      Math.min(
        100,
        (
          tierScore +
          rankScore
        ) *
        positionMultiplier
      );

  });


  /*
   * -------------------------------------------------------
   * SELECT THE MOST IMPORTANT CLIFF
   * -------------------------------------------------------
   */

  cliffs.sort(function(a, b) {

    return (
      b.cliffScore -
      a.cliffScore
    );

  });


  var selectedCliff =
    cliffs[0];


  /*
   * -------------------------------------------------------
   * COUNT PLAYERS AROUND CLIFF
   * -------------------------------------------------------
   */

  var playersBeforeCliff =
    selectedCliff.index + 1;

  var playersAfterCliff =
    positionPlayers.length -
    playersBeforeCliff;


  /*
   * -------------------------------------------------------
   * SEVERITY
   * -------------------------------------------------------
   */

  var severity =
    'LOW';


  if (
    selectedCliff.cliffScore >= 70
  ) {

    severity =
      'HIGH';

  } else if (
    selectedCliff.cliffScore >= 40
  ) {

    severity =
      'MODERATE';

  }


  /*
   * -------------------------------------------------------
   * DEBUG
   * -------------------------------------------------------
   */

  draftScoringLog(
    'POSITION TIER CLIFF:',
    position,
    'before =',
    selectedCliff.beforePlayer.name,
    'tier =',
    selectedCliff.fromTier,
    'after =',
    selectedCliff.afterPlayer.name,
    'tier =',
    selectedCliff.toTier,
    'tierGap =',
    selectedCliff.tierGap,
    'rankGap =',
    selectedCliff.rankGap,
    'score =',
    selectedCliff.cliffScore,
    'severity =',
    severity
  );


  return {

    position:
      position,

    severity:
      severity,

    cliffScore:
      selectedCliff.cliffScore,

    beforePlayer:
      selectedCliff.beforePlayer,

    afterPlayer:
      selectedCliff.afterPlayer,

    fromTier:
      selectedCliff.fromTier,

    toTier:
      selectedCliff.toTier,

    tierGap:
      selectedCliff.tierGap,

    rankGap:
      selectedCliff.rankGap,

    playersBeforeCliff:
      playersBeforeCliff,

    playersAfterCliff:
      playersAfterCliff

  };

}

/*
 * =======================================================
 * PHASE 10 — LIVE TIER & SCARCITY STATE
 * =======================================================
 *
 * Builds a single standardized snapshot describing the
 * current health of QB, RB, WR, and TE.
 *
 * IMPORTANT:
 *
 * This function does NOT create new scoring logic.
 *
 * It consumes the tier-cliff and VORP/scarcity information
 * already produced by the Draft Decision Engine.
 *
 * The UI can later consume this object without needing to
 * understand how tier cliffs or scarcity are calculated.
 */
function buildLiveTierScarcityState(
  players,
  vorpProfiles
) {

  players =
    Array.isArray(players)
      ? players
      : [];

  vorpProfiles =
    Array.isArray(vorpProfiles)
      ? vorpProfiles
      : [];


  var positions = [
    'QB',
    'RB',
    'WR',
    'TE'
  ];


  var state = {
    positions: {},
    alerts: [],
    generatedAtPick: null
  };


  /*
   * -------------------------------------------------------
   * CURRENT PICK
   * -------------------------------------------------------
   */

  try {

    var draftState =
      getDraftAssistantState();

    state.generatedAtPick =
      draftState &&
      Number(
        draftState.currentPick
      )
        ? Number(
            draftState.currentPick
          )
        : null;

  } catch (e) {

    state.generatedAtPick =
      null;

  }


  /*
   * -------------------------------------------------------
   * BUILD EACH POSITION
   * -------------------------------------------------------
   */

  positions.forEach(function(position) {

    var availableAtPosition =
      players
        .filter(function(player) {

          return (
            player &&
            player.available !== false &&
            (
              player.position ||
              player.pos
            ) === position
          );

        })
        .slice()
        .sort(function(a, b) {

          return (
            (Number(a.rank) || 9999) -
            (Number(b.rank) || 9999)
          );

        });


    /*
     * -------------------------------------------------------
     * TIER CLIFF
     * -------------------------------------------------------
     */

    var cliff =
      calculatePositionTierCliff(
        position,
        players,
        vorpProfiles
      );


    /*
     * -------------------------------------------------------
     * BEST AVAILABLE PLAYER
     * -------------------------------------------------------
     */

    var bestAvailable =
      availableAtPosition[0] ||
      null;


    /*
     * -------------------------------------------------------
     * SCARCITY
     * -------------------------------------------------------
     *
     * Reuse the scarcity value already calculated by the
     * VORP engine for the best available player.
     */

    var scarcity =
      0;


    if (bestAvailable) {

      var bestProfile =
        vorpProfiles.find(
          function(profile) {

            if (
              !profile ||
              !profile.player
            ) {
              return false;
            }

            return (
              profile.player ===
                bestAvailable ||
              (
                profile.player.name &&
                bestAvailable.name &&
                profile.player.name ===
                  bestAvailable.name
              )
            );

          }
        );


      if (bestProfile) {

        scarcity =
          Number(
            bestProfile.scarcity
          ) || 0;

      } else {

        /*
         * Some callers may pass player objects that already
         * contain the calculated scarcity value.
         */

        scarcity =
          Number(
            bestAvailable.scarcity
          ) || 0;

      }

    }


    /*
     * -------------------------------------------------------
     * CLIFF INFORMATION
     * -------------------------------------------------------
     */

    var severity =
      cliff &&
      cliff.severity
        ? cliff.severity
        : 'NONE';


    var playersBeforeCliff =
      cliff &&
      Number.isFinite(
        Number(
          cliff.playersBeforeCliff
        )
      )
        ? Number(
            cliff.playersBeforeCliff
          )
        : 0;


    var beforePlayer =
      cliff &&
      cliff.beforePlayer
        ? cliff.beforePlayer
        : null;


    var afterPlayer =
      cliff &&
      cliff.afterPlayer
        ? cliff.afterPlayer
        : null;


    /*
     * -------------------------------------------------------
     * STATUS
     * -------------------------------------------------------
     *
     * This is intentionally descriptive rather than a new
     * draft-score adjustment.
     */

    var status =
  'HEALTHY DEPTH';


/*
 * -------------------------------------------------------
 * CRITICAL CLIFF
 * -------------------------------------------------------
 *
 * Reserve this for genuinely severe, immediate drops.
 */

if (
  severity === 'HIGH' &&
  playersBeforeCliff <= 2
) {

  status =
    'CRITICAL CLIFF';


/*
 * -------------------------------------------------------
 * HIGH-SEVERITY TIER CLOSING
 * -------------------------------------------------------
 */

} else if (
  severity === 'HIGH'
) {

  status =
    'TIER CLOSING';


/*
 * -------------------------------------------------------
 * MODERATE TIER CLOSING
 * -------------------------------------------------------
 *
 * A moderate tier transition should only become a
 * live alert when the position is ALSO meaningfully
 * scarce.
 *
 * This prevents healthy positions such as QB from
 * generating an alert just because the next player
 * happens to be in a lower tier.
 */

} else if (
  severity === 'MODERATE' &&
  playersBeforeCliff <= 3 &&
  scarcity >= 75
) {

  status =
    'TIER CLOSING';


/*
 * -------------------------------------------------------
 * PURE SCARCITY
 * -------------------------------------------------------
 */

} else if (
  scarcity >= 90
) {

  status =
    'HIGH SCARCITY';

} else if (
  scarcity >= 75
) {

  status =
    'LIMITED DEPTH';

}


    /*
     * -------------------------------------------------------
     * POSITION SNAPSHOT
     * -------------------------------------------------------
     */

    var positionState = {

      position:
        position,

      availableCount:
        availableAtPosition.length,

      bestAvailable:
        bestAvailable,

      bestAvailableName:
        bestAvailable &&
        bestAvailable.name
          ? bestAvailable.name
          : null,

      scarcity:
        Number(
          scarcity.toFixed(2)
        ),

      cliffSeverity:
        severity,

      cliffScore:
        cliff
          ? Number(
              cliff.cliffScore
            ) || 0
          : 0,

      playersBeforeCliff:
        playersBeforeCliff,

      playersAfterCliff:
        cliff
          ? Number(
              cliff.playersAfterCliff
            ) || 0
          : 0,

      fromTier:
        cliff
          ? cliff.fromTier
          : null,

      toTier:
        cliff
          ? cliff.toTier
          : null,

      beforePlayer:
        beforePlayer,

      beforePlayerName:
        beforePlayer &&
        beforePlayer.name
          ? beforePlayer.name
          : null,

      afterPlayer:
        afterPlayer,

      afterPlayerName:
        afterPlayer &&
        afterPlayer.name
          ? afterPlayer.name
          : null,

      status:
        status

    };


    state.positions[position] =
      positionState;


    /*
     * -------------------------------------------------------
     * ALERT COLLECTION
     * -------------------------------------------------------
     *
     * Only meaningful pressure states become alerts.
     *
     * HEALTHY DEPTH intentionally stays out of the alert
     * collection. We can display healthy positions
     * separately in Phase 10B.
     */

    if (
      status !==
      'HEALTHY DEPTH'
    ) {

      state.alerts.push(
        positionState
      );

    }

  });


  /*
   * -------------------------------------------------------
   * ALERT PRIORITY
   * -------------------------------------------------------
   */

  var statusPriority = {

    'CRITICAL CLIFF': 5,
    'TIER CLOSING': 4,
    'HIGH SCARCITY': 3,
    'LIMITED DEPTH': 2,
    'HEALTHY DEPTH': 1

  };


  state.alerts.sort(
    function(a, b) {

      var aPriority =
        statusPriority[
          a.status
        ] || 0;

      var bPriority =
        statusPriority[
          b.status
        ] || 0;


      if (
        aPriority !==
        bPriority
      ) {

        return (
          bPriority -
          aPriority
        );

      }


      /*
       * Same alert category:
       * prefer the stronger cliff/scarcity signal.
       */

      var aPressure =
        Math.max(
          Number(a.cliffScore) || 0,
          Number(a.scarcity) || 0
        );

      var bPressure =
        Math.max(
          Number(b.cliffScore) || 0,
          Number(b.scarcity) || 0
        );


      return (
        bPressure -
        aPressure
      );

    }
  );


  return state;

}

function debugTierScarcityState() {

  var liveState =
    buildLiveDraftDebugState();

  if (
    !liveState ||
    !liveState.players
  ) {

    console.warn(
      'Unable to build live draft state.'
    );

    return null;

  }


  var profiles =
    liveState.vorpResult &&
    Array.isArray(
      liveState.vorpResult.profiles
    )
      ? liveState.vorpResult.profiles
      : [];


  var tierScarcityState =
    buildLiveTierScarcityState(
      liveState.players,
      profiles
    );


  console.group(
    'PHASE 10 — TIER & SCARCITY'
  );


  console.log(
    'Generated at pick:',
    tierScarcityState.generatedAtPick
  );


  [
    'QB',
    'RB',
    'WR',
    'TE'
  ].forEach(function(position) {

    var result =
      tierScarcityState
        .positions[position];

    if (!result) {
      return;
    }


    console.log(
      position,
      {
        status:
          result.status,

        bestAvailable:
          result.bestAvailableName,

        scarcity:
          result.scarcity,

        cliffSeverity:
          result.cliffSeverity,

        cliffScore:
          result.cliffScore,

        playersBeforeCliff:
          result.playersBeforeCliff,

        tierTransition:
          (
            result.fromTier ||
            'N/A'
          ) +
          ' → ' +
          (
            result.toTier ||
            'N/A'
          ),

        beforePlayer:
          result.beforePlayerName,

        afterPlayer:
          result.afterPlayerName,

        available:
          result.availableCount
      }
    );

  });


  console.log(
    'ACTIVE ALERTS:',
    tierScarcityState.alerts
  );


  console.groupEnd();


  window.latestTierScarcityState =
    tierScarcityState;


  return tierScarcityState;

}

/*
 * Calculate positional scarcity.
 *
 * This looks at how many usable players remain
 * before the replacement level.
 */
function calculatePositionScarcity(
  player,
  players,
  replacements
) {

  if (!player || !player.rank || !hasAuthoritativeEcr(player) || !Array.isArray(players)) {
    return 0;
  }

  /*
   * -------------------------------------------------------
   * LOCAL ECR DEPTH
   * -------------------------------------------------------
   *
   * VORP already measures distance above replacement.
   * Scarcity should answer a different question: how large
   * is the ECR drop across the best few options currently
   * available at this position?
   *
   * Every candidate at a position receives the same pool-
   * pressure score. This prevents a lower-ECR player from
   * leapfrogging a better player at the same position merely
   * because the lower player happens to sit above a local gap.
   */

  var positionPlayers = players
    .filter(function(candidate) {
      return candidate && candidate.available !== false &&
        candidate.position === player.position &&
        candidate.rank &&
        hasAuthoritativeEcr(candidate);
    })
    .slice()
    .sort(function(a, b) {
      return Number(a.rank) - Number(b.rank);
    })
    .slice(0, 5);

  if (positionPlayers.length < 2) return 100;

  var gaps = [];
  for (var index = 1; index < positionPlayers.length; index++) {
    gaps.push(Math.max(0, Math.min(20,
      Number(positionPlayers[index].rank) - Number(positionPlayers[index - 1].rank)
    )));
  }

  var immediateGap = gaps[0] || 0;
  var averageGap = gaps.reduce(function(total, gap) { return total + gap; }, 0) / gaps.length;
  var scarcity = (immediateGap * 8) + (averageGap * 4);

  scarcity =
    Math.max(
      0,
      Math.min(
        100,
        scarcity
      )
    );

  draftScoringLog(
    'SCARCITY CALC:',
    player.name,
    'position =',
    player.position || player.pos,
    'bestAvailableEcrGap =',
    immediateGap,
    'averageNearbyEcrGap =',
    averageGap,
    'scarcity =',
    scarcity
  );

  return scarcity;
}


/*
 * Calculate late-round availability.
 *
 * This is the piece that helps us recognize:
 *
 * "There are still plenty of comparable QBs/TEs,
 * so don't draft one early."
 */
function getFantasyProsMarketRank(player, context) {
  return getMarketTimingDetails(player, context).marketRank;
}

function getMarketTimingDetails(player, context) {
  var espnRank = Number(player && player.espnRank);
  var espnAdp = Number(player && player.espnAdp);
  if (Number.isFinite(espnRank) && espnRank > 0) {
    if (Number.isFinite(espnAdp) && espnAdp > 0) {
      var currentPick = Number(context && context.currentPick) || 1;
      var boardWeight = currentPick <= 36 ? 0.75 : currentPick <= 96 ? 0.65 : 0.5;
      var nextPick = Number(context && (context.calculatedNextPick || context.nextPick)) || 0;
      var draftWindow = getTeamsPickingBeforeMyNextTurn(currentPick, nextPick, Number(context && context.teams) || LEAGUE_SIZE);
      var totalOpponentPicks = draftWindow.picks.length;
      var autoOpponentPicks = draftWindow.picks.filter(function(pick) {
        return autoDraftTeamSlots.indexOf(Number(pick.teamSlot)) >= 0;
      }).length;
      var autoPickShare = totalOpponentPicks ? autoOpponentPicks / totalOpponentPicks : 0;
      boardWeight = boardWeight + autoPickShare * (0.9 - boardWeight);
      return {
        marketRank: espnRank * boardWeight + espnAdp * (1 - boardWeight),
        source: 'ESPN board + ESPN ADP', espnRank: espnRank, espnAdp: espnAdp,
        boardWeight: boardWeight, adpWeight: 1 - boardWeight,
        autoOpponentPicks: autoOpponentPicks, totalOpponentPicks: totalOpponentPicks
      };
    }
    return {marketRank: espnRank, source: 'ESPN board', espnRank: espnRank, espnAdp: null, boardWeight: 1, adpWeight: 0};
  }
  var candidates = [
    player && player.espnAdp,
    player && player.adp,
    player && player.realTimeAdp,
    player && player.adpRank
  ];

  for (var index = 0; index < candidates.length; index++) {
    var value = Number(candidates[index]);

    if (Number.isFinite(value) && value > 0) {
      return {
        marketRank: value,
        source: index === 0 ? 'ESPN ADP' : 'FantasyPros ADP fallback',
        espnRank: null, espnAdp: index === 0 ? value : null,
        boardWeight: 0, adpWeight: 1
      };
    }
  }

  return {marketRank: null, source: 'Unknown market', espnRank: null, espnAdp: null, boardWeight: 0, adpWeight: 0};
}

function calculateLateAvailability(
  player,
  players,
  context
) {

  if (!player || !player.position) {
    return 0;
  }

  /*
   * -------------------------------------------------------
   * BASIC VALIDATION
   * -------------------------------------------------------
   */

  var playerRank =
    getFantasyProsMarketRank(player, context);

  /* Missing ADP is unknown timing, not permission to substitute ECR. */
  if (!Number.isFinite(playerRank)) {
    return 0;
  }

  var nextPick =
    Number(
      context &&
      context.nextPick
    ) || 0;

  var currentPick =
    Number(
      context &&
      context.currentPick
    ) || 0;

  var cache = context && context.lateAvailabilityCache;
  var cacheKey = String(player.name || '').toLowerCase() + '|' +
    player.position + '|' + playerRank + '|' + currentPick + '|' + nextPick;

  if (cache && Object.prototype.hasOwnProperty.call(cache, cacheKey)) {
    return cache[cacheKey];
  }


  /*
   * If we don't know the draft position,
   * don't make an availability prediction.
   */

  if (
    !nextPick ||
    !currentPick ||
    nextPick <= currentPick
  ) {
    return 0;
  }


  /*
   * -------------------------------------------------------
   * PICKS UNTIL WE PICK AGAIN
   * -------------------------------------------------------
   */

  var picksUntilNext =
    nextPick - currentPick;


  /*
   * -------------------------------------------------------
   * HIGHER-RANKED PLAYERS AT SAME POSITION
   * -------------------------------------------------------
   */

  var samePosition = context && context.marketPools && context.marketPools[player.position]
    ? context.marketPools[player.position]
    : players.filter(function(p) {

      return p &&
        p.available &&
        p.position === player.position &&
        Number.isFinite(getFantasyProsMarketRank(p, context));

    });


  var higherRanked =
    samePosition.filter(function(p) {

      return (
        getFantasyProsMarketRank(p, context) < playerRank
      );

    }).length;


  /*
   * -------------------------------------------------------
   * COMPARABLE PLAYERS
   * -------------------------------------------------------
   *
   * Players reasonably close to this player's
   * ranking.
   */

  var comparable =
  samePosition.filter(function(p) {

    var rank =
      getFantasyProsMarketRank(p, context);

    return (
      p !== player &&
      rank >= playerRank &&
      rank <= playerRank + 20
    );

  }).length;


  /*
   * -------------------------------------------------------
   * BASE AVAILABILITY RISK
   * -------------------------------------------------------
   *
   * More picks before our next selection means
   * greater risk.
   */

    /*
   * -------------------------------------------------------
   * AVAILABILITY RISK
   * -------------------------------------------------------
   *
   * Estimate whether this specific player is likely
   * to be drafted before our next selection.
   *
   * Overall player rank is the primary signal.
   */

  var risk =
    0;


  /*
   * -------------------------------------------------------
   * BASE RANK RISK
   * -------------------------------------------------------
   *
   * Elite players are naturally much more likely
   * to disappear before our next pick.
   */

  if (playerRank <= 12) {

  risk += 55;

} else if (playerRank <= 18) {

  risk += 50;

} else if (playerRank <= 24) {

  risk += 45;

} else if (playerRank <= 32) {

  risk += 38;

} else if (playerRank <= 40) {

  risk += 32;

} else if (playerRank <= 50) {

  risk += 25;

} else if (playerRank <= 65) {

  risk += 18;

} else if (playerRank <= 80) {

  risk += 12;

} else if (playerRank <= 110) {

  risk += 5;

} else {

  risk += 0;

}


  /*
   * -------------------------------------------------------
   * PICKS UNTIL NEXT SELECTION
   * -------------------------------------------------------
   */

  if (picksUntilNext >= 12) {

    risk += 20;

  } else if (picksUntilNext >= 8) {

    risk += 14;

  } else if (picksUntilNext >= 5) {

    risk += 8;

  } else if (picksUntilNext >= 3) {

    risk += 4;

  }


  /*
   * -------------------------------------------------------
   * COMPARABLE PLAYER DEPTH
   * -------------------------------------------------------
   *
   * If several similar players remain available,
   * the specific player is less likely to be selected.
   */

  if (comparable >= 8) {

    risk -= 20;

  } else if (comparable >= 5) {

    risk -= 12;

  } else if (comparable >= 3) {

    risk -= 6;

  }


  /*
   * -------------------------------------------------------
   * POSITIONAL PRESSURE
   * -------------------------------------------------------
   *
   * A player becomes more vulnerable when there
   * are few comparable alternatives.
   */

  if (comparable <= 1) {

  if (picksUntilNext >= 12) {

    risk += 10;

  } else if (picksUntilNext >= 8) {

    risk += 6;

  } else if (picksUntilNext >= 5) {

    risk += 2;

  }

} else if (comparable === 2) {

  if (picksUntilNext >= 8) {

    risk += 4;

  } else if (picksUntilNext >= 5) {

    risk += 2;

  }

}

    draftScoringLog(
    'AVAILABILITY RISK:',
    player.name,
    'position =',
    player.position,
    'rank =',
    player.rank,
    'picksUntilNext =',
    picksUntilNext,
    'higherRanked =',
    higherRanked,
    'comparable =',
    comparable,
    'risk =',
    risk
  );

  var result = Math.max(
    0,
    Math.min(
      100,
      risk
    )
  );

  if (cache) cache[cacheKey] = result;
  return result;

}

function detectDraftRuns(){

var rows =
  Array.from(
    document.querySelectorAll(
      'tr.draftrow.drafted-mine, tr.draftrow.drafted-other'
    )
  );


/*
 * -------------------------------------------------------
 * TRUE DRAFT ORDER
 * -------------------------------------------------------
 *
 * The board itself is sorted by player rank, not by
 * when players were drafted.
 *
 * Use each row's stored draft-pick number so positional
 * runs are based on the actual most recent selections.
 */

var draftedRows =
  rows
    .map(function(row) {

      var pick =
        Number(
          row.getAttribute('data-pick') ||
          row.getAttribute('data-draft-pick') ||
          row.dataset.pick ||
          row.dataset.draftPick
        ) || 0;


      return {
        row:
          row,

        pick:
          pick
      };

    })
    .filter(function(entry) {

      return (
        entry.row &&
        entry.pick > 0
      );

    })
    .sort(function(a, b) {

      return (
        Number(a.pick) -
        Number(b.pick)
      );

    });


var recentCount =
  8;


var recentRows =
  draftedRows
    .slice(-recentCount)
    .map(function(entry) {

      return entry.row;

    });


  /*
   * -------------------------------------------------------
   * 2. POSITION DATA
   * -------------------------------------------------------
   */

  var positions = [
    'QB',
    'RB',
    'WR',
    'TE'
  ];

  var runs = {};

  positions.forEach(function(position){

    runs[position] = {

      count: 0,

      strength: 'NONE',

      averageRank: null,

      qualityScore: 0,

      recencyScore: 0,

      runScore: 0

    };

  });


  /*
   * -------------------------------------------------------
   * 3. ANALYZE RECENT PICKS
   * -------------------------------------------------------
   */

  recentRows.forEach(function(row,index){

    var position =
      row.getAttribute('data-pos');

    if(
      !position ||
      !runs[position]
    ){
      return;
    }


    runs[position].count++;


    /*
     * Try to identify the player's overall rank.
     *
     * We intentionally support several possible
     * attributes because draft-board markup can vary.
     */

    var rank =
      Number(
        row.getAttribute('data-rank') ||
        row.getAttribute('data-overall') ||
        row.getAttribute('data-rk') ||
        999
      );


    /*
     * Store rank information temporarily.
     */

    if(!runs[position].ranks){

      runs[position].ranks = [];

    }

    if(rank < 999){

      runs[position].ranks.push(rank);

    }


    /*
     * -------------------------------------------------------
     * RECENCY
     * -------------------------------------------------------
     *
     * Newer picks receive more weight.
     *
     * index 0 = oldest pick in the window
     * higher index = more recent
     */

    var recencyWeight =
      (index + 1) /
      recentRows.length;

    runs[position].recencyScore +=
      recencyWeight;

  });


  /*
   * -------------------------------------------------------
   * 4. CALCULATE RUN STRENGTH
   * -------------------------------------------------------
   */

  positions.forEach(function(position){

    var run =
      runs[position];


    if(run.count >= 5){

      run.strength =
        'STRONG';

    } else if(run.count >= 4){

      run.strength =
        'MODERATE';

    } else if(run.count >= 3){

      run.strength =
        'LIGHT';

    } else {

      run.strength =
        'NONE';

    }


    /*
     * Average player rank involved in the run.
     */

    if(
      run.ranks &&
      run.ranks.length
    ){

      var rankTotal =
        run.ranks.reduce(
          function(total,rank){
            return total + rank;
          },
          0
        );

      run.averageRank =
        rankTotal /
        run.ranks.length;

    }


    /*
     * -------------------------------------------------------
     * 5. QUALITY SCORE
     * -------------------------------------------------------
     *
     * A run involving highly-ranked players is more
     * meaningful than a run involving late-round players.
     *
     * Lower average rank = stronger quality.
     */

    if(run.averageRank !== null){

      run.qualityScore =
        Math.max(
          0,
          Math.min(
            100,
            100 -
            ((run.averageRank - 1) * 1.5)
          )
        );

    }


    /*
     * -------------------------------------------------------
     * 6. RUN SCORE
     * -------------------------------------------------------
     *
     * Frequency is the primary signal.
     * Quality and recency provide secondary context.
     */

    var frequencyScore =
      Math.min(
        100,
        (run.count / recentRows.length) * 100
      );


    run.runScore =
  (
    frequencyScore * 0.50
  ) +
  (
    run.qualityScore * 0.35
  ) +
  (
    (
      recentRows.length > 0
        ? (run.recencyScore /
           recentRows.length) * 100
        : 0
    ) * 0.15
  );


    /*
     * Remove temporary rank array from the public
     * result to keep the object clean.
     */

    delete run.ranks;

  });


  /*
   * -------------------------------------------------------
   * 7. FIND PRIMARY RUN
   * -------------------------------------------------------
   *
   * Preserve the old behavior:
   * one primary run is returned for the existing
   * calculateDraftRunOpportunity() function.
   */

  var rankedPositions =
    positions
      .slice()
      .sort(function(a,b){

        return (
          runs[b].runScore -
          runs[a].runScore
        );

      });


  var topPosition =
    rankedPositions[0];

  var topRun =
    runs[topPosition];


  var isRun =
    topRun &&
    topRun.count >= 3;


  /*
   * -------------------------------------------------------
   * 8. RETURN
   * -------------------------------------------------------
   */

  return {

    /*
     * Existing compatibility fields.
     */

    isRun:
      isRun,

    position:
      isRun
        ? topPosition
        : null,

    count:
      isRun
        ? topRun.count
        : 0,

    strength:
      isRun
        ? topRun.strength
        : 'NONE',


    /*
     * New detailed run information.
     */

    runs:
      runs,

recentCount:
  recentRows.length,

recentStartPick:
  draftedRows.length
    ? draftedRows[
        Math.max(
          0,
          draftedRows.length -
          recentRows.length
        )
      ].pick
    : 0,

recentEndPick:
  draftedRows.length
    ? draftedRows[
        draftedRows.length - 1
      ].pick
    : 0,

    counts:
      positions.reduce(
        function(result,position){

          result[position] =
            runs[position].count;

          return result;

        },
        {
          QB: 0,
          RB: 0,
          WR: 0,
          TE: 0,
          K: 0,
          DST: 0
        }
      )

  };

}

function calculateDraftRunOpportunity(player, context){

  if(!player || !context || !context.draftRuns){
    return 0;
  }

  var position =
    player.position ||
    player.pos ||
    'N/A';

  var run = context.draftRuns;

  if(!run.isRun){
    return 0;
  }

  var runPosition = run.position;
  var strength = run.strength;

  if(strength !== 'STRONG' &&
     strength !== 'MODERATE'){
    return 0;
  }

  if(position === runPosition){
    return 0;
  }

  var need = 0;

  if(context.rosterNeeds &&
     context.rosterNeeds[position] !== undefined){

    need =
      Number(context.rosterNeeds[position]) || 0;
  }

  if(position === 'RB' ||
     position === 'WR' ||
     position === 'TE'){

    var flexNeed =
      Number(
        context.rosterNeeds.FLEX
      ) || 0;

    need = Math.max(
      need,
      flexNeed
    );
  }

  var opportunityScore = 0;

  if(strength === 'STRONG'){

    opportunityScore =
      need > 0 ? 3 : 2;

  } else {

    opportunityScore =
      need > 0 ? 2 : 1;

  }

  return opportunityScore;
}

function calculateDraftRunUrgency(
  player,
  context
) {

  if (
    !player ||
    !context ||
    !context.draftRuns
  ) {
    return 0;
  }


  var position =
    player.position ||
    player.pos ||
    null;


  if (
    !position ||
    !['QB', 'RB', 'WR', 'TE'].includes(
      position
    )
  ) {
    return 0;
  }


  var draftRuns =
    context.draftRuns;


  /*
   * -------------------------------------------------------
   * POSITION-SPECIFIC RUN
   * -------------------------------------------------------
   *
   * Unlike Run Opportunity, urgency cares about a run
   * AT THE PLAYER'S OWN POSITION.
   */

  var positionRun =
    draftRuns.runs &&
    draftRuns.runs[position]
      ? draftRuns.runs[position]
      : null;


  if (!positionRun) {
    return 0;
  }


  var strength =
    positionRun.strength ||
    'NONE';


  if (
    strength !== 'STRONG' &&
    strength !== 'MODERATE'
  ) {
    return 0;
  }


  /*
   * -------------------------------------------------------
   * ROSTER NEED
   * -------------------------------------------------------
   */

  var dedicatedNeed =
    context.rosterNeeds
      ? Number(
          context.rosterNeeds[position]
        ) || 0
      : 0;


  var flexNeed =
    context.rosterNeeds
      ? Number(
          context.rosterNeeds.FLEX
        ) || 0
      : 0;


  var effectiveNeed =
    dedicatedNeed;


  if (
    position === 'RB' ||
    position === 'WR' ||
    position === 'TE'
  ) {

    effectiveNeed =
      Math.max(
        dedicatedNeed,
        flexNeed
      );

  }


  /*
   * If our roster is already satisfied at the position,
   * don't chase a run just because everyone else is.
   */

  if (effectiveNeed <= 0) {
    return 0;
  }


  /*
   * -------------------------------------------------------
   * BASE RUN PRESSURE
   * -------------------------------------------------------
   */

  var urgencyScore =
    strength === 'STRONG'
      ? 2
      : 1;


  /*
   * -------------------------------------------------------
   * TIER-CLIFF PRESSURE
   * -------------------------------------------------------
   *
   * A run is much more important if the remaining tier
   * is also about to collapse.
   */

  var tierCliff =
    context.tierCliffs &&
    context.tierCliffs[position]
      ? context.tierCliffs[position]
      : null;


  if (tierCliff) {

    var severity =
      tierCliff.severity ||
      'NONE';


    if (severity === 'HIGH') {

      urgencyScore += 2;

    } else if (
      severity === 'MODERATE'
    ) {

      urgencyScore += 1;

    }

  }


  /*
   * -------------------------------------------------------
   * RUN SCORE CONFIRMATION
   * -------------------------------------------------------
   *
   * Particularly concentrated runs get a small extra
   * bump, but never enough to dominate player quality.
   */

  var runScore =
    Number(
      positionRun.runScore
    ) || 0;


  if (runScore >= 65) {
    urgencyScore += 0.5;
  }


  /*
   * -------------------------------------------------------
   * CLAMP
   * -------------------------------------------------------
   */

  urgencyScore =
    Math.max(
      0,
      Math.min(
        4,
        urgencyScore
      )
    );


  return Number(
    urgencyScore.toFixed(2)
  );

}
 

function calculateVorpProfile(
  player,
  players,
  replacements,
  draftState,
  draftAwareContext
) {

  var replacement =
    getEffectiveReplacement(
      player,
      replacements
    );

  var vorp =
    calculateFantasyVorp(
      player,
      replacement
    );

  var tierDrop =
    calculateTierDrop(
      player,
      players,
      draftAwareContext
    );

  var cachedScarcity = draftAwareContext &&
    draftAwareContext.positionScarcityScores &&
    draftAwareContext.positionScarcityScores[player.position];
  var scarcity = Number.isFinite(Number(cachedScarcity))
    ? Number(cachedScarcity)
    : calculatePositionScarcity(player, players, replacements);


/*
 * -------------------------------------------------------
 * DRAFT STATE
 * -------------------------------------------------------
 *
 * Prefer the shared draft-state snapshot supplied by the
 * caller. Only rebuild it when this function is used
 * independently.
 */

draftState =
  draftState ||
  getDraftAssistantState();


  /*
   * -------------------------------------------------------
   * LATE AVAILABILITY
   * -------------------------------------------------------
   */

  var lateAvailability = calculateLateAvailability(
    player,
    players,
    draftAwareContext || {
      currentPick: draftState.currentPick,
      nextPick: calculateMyNextDraftPick(
        Number(draftState.currentPick) || 0,
        Number(draftState.teams) || 10
      ).nextPick
    }
  );


  /*
   * -------------------------------------------------------
   * DRAFT-AWARE VORP OPPORTUNITY
   * -------------------------------------------------------
   *
   * Measures how much positional value could disappear
   * before our next pick.
   */

var draftAwareVorpOpportunity =
  calculateDraftAwareVorpOpportunity(
    player,
    draftAwareContext || {
      players:
        players,

      replacements:
        replacements,

      draftState:
        draftState
    }
  );


  /*
   * -------------------------------------------------------
   * RETURN PROFILE
   * -------------------------------------------------------
   */

  return {

    player:
      player,

    vorp:
      vorp,

    draftAware:
      draftAwareVorpOpportunity,

    tierDrop:
      tierDrop.score,

    tierDropRankGap:
      tierDrop.rankGap,

    scarcity:
      scarcity,

    lateAvailability:
      lateAvailability,

    replacement:
      replacement,

    nextPlayer:
      tierDrop.nextPlayer

  };

}

/*
 * Calculate Stage 2 for all available players.
 */
function calculateAllFantasyVorp(players, suppliedDraftState) {

  var available =
    getAvailableVorpPlayers(
      players
    );

  var replacements =
    calculateReplacementLevels(
      available
    );

  /*
 * -------------------------------------------------------
 * SHARED DRAFT STATE
 * -------------------------------------------------------
 *
 * Every VORP profile in this batch sees the same draft
 * state, so calculate it once instead of once per player.
 */

var draftState =
  suppliedDraftState ||
  getDraftAssistantState();


/*
 * -------------------------------------------------------
 * SHARED DRAFT-AWARE VORP DATA
 * -------------------------------------------------------
 *
 * Every profile in this batch uses the same available
 * player pool and draft window.
 *
 * Build the expensive sorted positional pools and
 * pressure sample once rather than once per player.
 */

var draftWindow =
  calculateMyNextDraftPick(
    Number(draftState.currentPick) || 0,
    Number(draftState.teams) || 10
  );


var draftAwarePositionPools = {};


['QB', 'RB', 'WR', 'TE'].forEach(
  function(position) {

    draftAwarePositionPools[position] =
      available
        .filter(function(candidate) {

          return (
            candidate &&
            candidate.available !== false &&
            (
              candidate.position ||
              candidate.pos
            ) === position &&
            candidate.rank
          );

        })
        .slice()
        .sort(function(a, b) {

          return (
            Number(a.rank) -
            Number(b.rank)
          );

        });

  }
);


var pressureSampleSize =
  Math.min(
    100,
    available.length
  );


var draftAwarePressureSample =
  available
    .filter(function(candidate) {

      return (
        candidate &&
        candidate.available !== false &&
        candidate.rank &&
        VORP_POSITIONS.includes(
          candidate.position
        )
      );

    })
    .slice()
    .sort(function(a, b) {

      return (
        Number(a.rank) -
        Number(b.rank)
      );

    })
    .slice(
      0,
      pressureSampleSize
    );


var draftAwarePositionShares = {};


['QB', 'RB', 'WR', 'TE'].forEach(
  function(position) {

    var positionCount =
      draftAwarePressureSample
        .filter(function(candidate) {

          return (
            candidate.position ===
            position
          );

        })
        .length;


    var positionShare =
      draftAwarePressureSample.length > 0
        ? positionCount /
          draftAwarePressureSample.length
        : 0;


    draftAwarePositionShares[position] =
      Math.max(
        0.05,
        Math.min(
          0.45,
          positionShare
        )
      );

  }
);

var tierDropNextByName = {};
var vorpMarketPools = {};

['QB', 'RB', 'WR', 'TE'].forEach(function(position) {
  var positionPool = draftAwarePositionPools[position] || [];

  positionPool.forEach(function(player, index) {
    tierDropNextByName[String(player.name || '').toLowerCase()] =
      positionPool[index + 1] || null;
  });

  vorpMarketPools[position] = positionPool.filter(function(player) {
    return Number.isFinite(getFantasyProsMarketRank(player));
  });
});

var decisionMarketPools = {};
['QB', 'RB', 'WR', 'TE', 'K', 'DST'].forEach(function(position) {
  decisionMarketPools[position] = players.filter(function(player) {
    return player &&
      player.available !== false &&
      player.position === position &&
      Number.isFinite(getFantasyProsMarketRank(player));
  });
});

var positionScarcityScores = {};

['QB', 'RB', 'WR', 'TE'].forEach(function(position) {
  var positionPool = draftAwarePositionPools[position] || [];
  positionScarcityScores[position] = positionPool.length
    ? calculatePositionScarcity(positionPool[0], available, replacements)
    : 0;
});


var sharedDraftAwareContext = {

  players:
    available,

  replacements:
    replacements,

  draftState:
    draftState,

  draftWindow:
    draftWindow,

  positionPools:
    draftAwarePositionPools,

  pressureSample:
    draftAwarePressureSample,

  positionShares:
    draftAwarePositionShares,

  tierDropNextByName:
    tierDropNextByName,

  marketPools:
    vorpMarketPools,

  lateAvailabilityCache:
    {},

  currentPick:
    Number(draftState.currentPick) || 0,

  nextPick:
    Number(draftWindow.nextPick) || 0,

  positionScarcityScores:
    positionScarcityScores

};


var profiles =
  available.map(function(player) {

    return calculateVorpProfile(
      player,
      available,
      replacements,
      draftState,
      sharedDraftAwareContext
    );

  });

  return {

    settings:
      getVorpLeagueSettings(),

    replacements:
      replacements,

    profiles:
      profiles,

    marketPools:
      decisionMarketPools,

    lateAvailabilityCache:
      sharedDraftAwareContext.lateAvailabilityCache

  };

}

function calculateDraftAwareVorpOpportunity(player, context){

  if(!player || !context){
    return 0;
  }

  /*
   * -------------------------------------------------------
   * PURPOSE
   * -------------------------------------------------------
   *
   * Measures how much positional value could disappear
   * between the current pick and the user's next pick.
   *
   * This is NOT the player's normal VORP.
   *
   * Normal VORP:
   *   "How much better is this player than replacement?"
   *
   * Draft-aware VORP:
   *   "How dangerous is it to wait until my next pick?"
   */


  var position =
    player.position ||
    player.pos ||
    'N/A';


  /*
   * We need draft-aware replacement levels.
   */
  if(!context.replacements){
    return 0;
  }


  var currentReplacement =
    context.replacements[position] || null;


  /*
   * No replacement information means we cannot
   * calculate a meaningful opportunity cost.
   */
  if(!currentReplacement ||
     !currentReplacement.rank){

    return 0;
  }


  /*
   * -------------------------------------------------------
   * NEXT-PICK REPLACEMENT
   * -------------------------------------------------------
   *
   * Calculate what the replacement level could look like
   * after the upcoming picks before our next selection.
   *
   * We use the existing player pool from context.
   */

  var players =
    context.players ||
    context.availablePlayers ||
    [];


  if(!players.length){
    return 0;
  }


var draftState =
  context.draftState ||
  getDraftAssistantState();


var currentPick =
  Number(
    draftState.currentPick
  ) || 0;


var teams =
  Number(
    draftState.teams
  ) || 10;


var draftWindow =
  context.draftWindow ||
  calculateMyNextDraftPick(
    currentPick,
    teams
  );


var nextPick =
  Number(
    draftWindow.nextPick
  ) || 0;


var picksUntilNext =
  Number(
    draftWindow.picksBetween
  ) || 0;

  /*
   * If we're already on the clock, there is no waiting
   * period to penalize.
   */
  if(picksUntilNext <= 0){
    return 0;
  }


  /*
   * -------------------------------------------------------
   * POSITIONAL POOL
   * -------------------------------------------------------
   */

var positionPool =
  context.positionPools &&
  context.positionPools[position]
    ? context.positionPools[position]
    : players
        .filter(function(candidate) {

          return (
            candidate &&
            candidate.available !== false &&
            (
              candidate.position ||
              candidate.pos
            ) === position &&
            candidate.rank
          );

        })
        .slice()
        .sort(function(a, b) {

          return (
            Number(a.rank) -
            Number(b.rank)
          );

        });


  if(!positionPool.length){
    return 0;
  }


  /*
   * Find the current replacement player inside
   * the available positional pool.
   */
  var replacementIndex =
    positionPool.findIndex(function(candidate){

      return (
        candidate.name ===
        currentReplacement.name
      );

    });


  if(replacementIndex < 0){
    return 0;
  }


  /*
   * -------------------------------------------------------
   * ESTIMATE DRAFT PRESSURE
   * -------------------------------------------------------
   *
   * We don't assume every pick before our turn is
   * this position.
   *
   * Instead, estimate how many players at this
   * position are likely to disappear.
   *
   * The player's current rank helps determine how
   * exposed the position is.
   */

  /*
   * -------------------------------------------------------
   * POSITION-SPECIFIC DRAFT PRESSURE
   * -------------------------------------------------------
   *
   * Not every pick between now and our next selection
   * will be this position.
   *
   * Estimate how many players at THIS position are
   * realistically likely to disappear.
   */


  var comparableCount =
    positionPool.filter(function(candidate){

      return Number(candidate.rank) <=
             Number(currentReplacement.rank);

    }).length;


  /*
   * Estimate the proportion of the upcoming draft
   * that this position represents.
   *
   * We look at the top available players and determine
   * how frequently this position occurs.
   */
 var positionShare;


if (
  context.positionShares &&
  Number.isFinite(
    Number(
      context.positionShares[position]
    )
  )
) {

  positionShare =
    Number(
      context.positionShares[position]
    );

} else {

  var pressureSampleSize =
    Math.min(
      100,
      players.length
    );


  var pressureSample =
    players
      .filter(function(candidate) {

        return (
          candidate &&
          candidate.available !== false &&
          candidate.rank &&
          VORP_POSITIONS.includes(
            candidate.position
          )
        );

      })
      .slice()
      .sort(function(a, b) {

        return (
          Number(a.rank) -
          Number(b.rank)
        );

      })
      .slice(
        0,
        pressureSampleSize
      );


  var positionCount =
    pressureSample
      .filter(function(candidate) {

        return (
          candidate.position ===
          position
        );

      })
      .length;


  positionShare =
    pressureSample.length > 0
      ? positionCount /
        pressureSample.length
      : 0;


  positionShare =
    Math.max(
      0.05,
      Math.min(
        0.45,
        positionShare
      )
    );

}


  /*
   * Expected number of players from this position
   * drafted before our next pick.
   */
  var expectedLoss =
    Math.min(
      comparableCount,
      Math.max(
        1,
        Math.round(
          picksUntilNext *
          positionShare
        )
      )
    );

  /*
   * -------------------------------------------------------
   * FUTURE REPLACEMENT
   * -------------------------------------------------------
   *
   * Move replacement level down by the estimated
   * number of players likely to disappear.
   */

  var futureReplacementIndex =
    Math.min(
      replacementIndex + expectedLoss,
      positionPool.length - 1
    );


  var futureReplacement =
    positionPool[
      futureReplacementIndex
    ];


  if(!futureReplacement ||
     !futureReplacement.rank){

    return 0;
  }


  /*
   * -------------------------------------------------------
   * VALUE DROP
   * -------------------------------------------------------
   *
   * Convert the replacement movement into a
   * draft-aware opportunity score.
   */

  var currentRank =
    Number(currentReplacement.rank);

  var futureRank =
    Number(futureReplacement.rank);


  var rankDrop =
    futureRank - currentRank;


  if(rankDrop <= 0){
    return 0;
  }


  /*
   * Scale the opportunity.
   *
   * 0-10 rank drop  = small opportunity
   * 11-20           = moderate
   * 21+             = strong
   */

  
  /*
   * -------------------------------------------------------
   * DRAFT-AWARE OPPORTUNITY SCORE
   * -------------------------------------------------------
   *
   * The replacement drop tells us how much positional
   * inventory may disappear.
   *
   * But we also need to know whether THIS PLAYER is
   * valuable enough to justify protecting that inventory.
   *
   * We therefore combine:
   *
   *   1. Replacement rank drop
   *   2. Player's position above replacement
   *   3. How much of that value is exposed by waiting
   *
   * Result: 0-5 bonus.
   */


  /*
   * How much positional value disappears?
   *
   * 71 ranks = extremely meaningful
   * 30 ranks = meaningful
   * 10 ranks = small
   */
  var replacementDropScore =
    Math.min(
      1,
      rankDrop / 50
    );


  /*
   * How far above the current replacement is
   * this specific player?
   *
   * Example:
   *
   * Player #1
   * Replacement #73
   * = 72 ranks above replacement
   *
   * Player #60
   * Replacement #73
   * = only 13 ranks above replacement
   *
   * This prevents every player above replacement
   * from automatically receiving the same bonus.
   */
  var playerAdvantage =
    Math.max(
      0,
      currentRank - Number(player.rank)
    );


  /*
   * Normalize the player's positional advantage.
   *
   * 50+ ranks above replacement = maximum exposure
   */
  var playerAdvantageScore =
    Math.min(
      1,
      playerAdvantage / 50
    );


  /*
   * Combine the two factors.
   */
  var opportunityStrength =
    replacementDropScore *
    playerAdvantageScore;


  /*
   * Convert to 0-5 scale.
   */
  var opportunityScore =
    opportunityStrength * 5;


  /*
   * Round to two decimals so the decision engine
   * gets useful differentiation.
   */
  opportunityScore =
    Math.round(
      opportunityScore * 100
    ) / 100;


  /*
   * Don't give meaningful opportunity credit to
   * players at or below replacement.
   */
  if (
    Number(player.rank) >= currentRank
  ) {

    opportunityScore = 0;

  }

  return opportunityScore;

}


/* =========================================================
   STAGE 2 DEBUG
   ========================================================= */

function debugVorp() {

  var players =
    getDraftAssistantPlayers();

  var result =
    calculateAllFantasyVorp(
      players
    );

  var panel =
    document.getElementById(
      'draft-assistant-vorp-panel'
    );

  if (!panel) {

    panel =
      document.createElement('div');

    panel.id =
      'draft-assistant-vorp-panel';

    panel.style.cssText =
      'position:fixed;' +
      'left:10px;' +
      'right:10px;' +
      'bottom:10px;' +
      'z-index:100000;' +
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


  var html =
    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<strong style="font-size:18px;">📊 VORP Debug</strong>' +

      '<button onclick="document.getElementById(\'draft-assistant-vorp-panel\').remove()" ' +
      'style="background:none;border:0;color:white;font-size:24px;">&times;</button>' +

    '</div>' +

    '<hr>' +

    '<strong>League Settings</strong><br>' +

    'Teams: ' +
      result.settings.teams +

    '<br>QB Starters: ' +
      result.settings.QB +

    '<br>RB Starters: ' +
      result.settings.RB +

    '<br>WR Starters: ' +
      result.settings.WR +

    '<br>TE Starters: ' +
      result.settings.TE +

    '<br>FLEX Starters: ' +
      result.settings.FLEX +

    '<hr>' +

    '<strong>Replacement Levels</strong><br>';


['QB', 'RB', 'WR', 'TE'].forEach(function(position) {

  var replacement =
    result.replacements[position];

  if (replacement) {

    var pool =
      result.profiles
        .filter(function(profile) {

          return profile.player.position === position &&
            profile.player.available &&
            profile.player.rank;
        })
        .sort(function(a, b) {

          return Number(a.player.rank) -
                 Number(b.player.rank);
        });

    var positionalRank =
      pool.findIndex(function(profile) {

        return profile.player.name ===
          replacement.name;
      }) + 1;

    html +=
      position +
      ': ' +
      replacement.name +
      ' — ' +
      position +
      ' #' +
      positionalRank +
      ' — Overall #' +
      replacement.rank +
      '<br>';

  } else {

    html +=
      position +
      ': None<br>';
  }

});


  var flexReplacement =
  result.replacements.FLEX;

if (flexReplacement) {

  var flexPool =
    result.profiles
      .filter(function(profile) {

        return (
          profile.player.position === 'RB' ||
          profile.player.position === 'WR' ||
          profile.player.position === 'TE'
        ) &&
        profile.player.available &&
        profile.player.rank;
      })
      .sort(function(a, b) {

        return Number(a.player.rank) -
               Number(b.player.rank);
      });

  var flexRank =
    flexPool.findIndex(function(profile) {

      return profile.player.name ===
        flexReplacement.name;
    }) + 1;

  html +=
    'FLEX: ' +
    flexReplacement.name +
    ' — FLEX #' +
    flexRank +
    ' — Overall #' +
    flexReplacement.rank +
    '<hr>' +

    '<strong>Top VORP Players</strong><br>';

} else {

  html +=
    'FLEX: None<hr>' +
    '<strong>Top VORP Players</strong><br>';
}

    '<hr>' +

    '<strong>Top VORP Players</strong><br>';


  var topProfiles =
    result.profiles
      .slice()
      .sort(function(a,b) {

        return b.vorp - a.vorp;
      })
      .slice(0,10);


  topProfiles.forEach(
    function(profile,index) {

      html +=

        (index + 1) +
        '. ' +

        profile.player.name +

        ' — ' +

        profile.player.position +

        ' #' +

        profile.player.rank +

        ' — VORP: ' +

        profile.vorp.toFixed(1) +

        '<br>' +

        '&nbsp;&nbsp;Scarcity: ' +

        profile.scarcity.toFixed(1) +

        ' | Tier Drop: ' +

        profile.tierDrop.toFixed(1) +

        '<br>' +

        '&nbsp;&nbsp;Late Availability: ' +

        profile.lateAvailability +

        '<br>';
    }
  );


  panel.innerHTML =
    html;
}

/* =========================================================
   DRAFT DECISION ENGINE — STAGE 1
   Calculates a contextual score for each available player.
   Does NOT change the recommendation widget yet.
   ========================================================= */

var LEGACY_TO_SEMANTIC_TIER = {
  'Sp': 'ELITE',
  'S': 'PREMIUM',
  'A': 'CORE',
  'B': 'VALUE',
  'C': 'UPSIDE',
  'D': 'DEPTH',
  'E': 'LATE',
  'F': 'DEEP'
};

var SEMANTIC_TO_LEGACY_TIER = {
  ELITE: 'Sp',
  PREMIUM: 'S',
  CORE: 'A',
  VALUE: 'B',
  UPSIDE: 'C',
  DEPTH: 'D',
  LATE: 'E',
  DEEP: 'F'
};

/*
 * Semantic scores are intentionally gradual across the 717-player
 * distribution. Legacy IDs remain an implementation detail for DOM,
 * edit-order, and persistence compatibility.
 */
var SEMANTIC_TIER_SCORES = {
  ELITE: 100,
  PREMIUM: 92,
  CORE: 82,
  VALUE: 70,
  UPSIDE: 56,
  DEPTH: 40,
  LATE: 24,
  DEEP: 8
};

var SEMANTIC_TIER_ORDER = {
  ELITE: 0,
  PREMIUM: 1,
  CORE: 2,
  VALUE: 3,
  UPSIDE: 4,
  DEPTH: 5,
  LATE: 6,
  DEEP: 7
};

function getPlayerTierValue(player){
  var row = player && (player.row || player);
  var tierId = '';
  var semanticTier = '';

  if (row && typeof row.getAttribute === 'function') {
    semanticTier = row.getAttribute('data-semantic-tier') ||
      row.getAttribute('data-consensus-tier') || '';
  }

  if (row && typeof row.closest === 'function') {
    var tbody = row.closest('tbody.tier-group');

    if (tbody) {
      tierId = tbody.id.replace('tbody-', '');
    }
  }

  if (!tierId && player && player.tier) {
    tierId = String(player.tier).replace('tier-', '');
  }

  if (!semanticTier && player) {
    semanticTier = player.semanticTier || player.consensusTier || '';
  }

  semanticTier = String(
    semanticTier || LEGACY_TO_SEMANTIC_TIER[tierId] || 'DEEP'
  ).toUpperCase();

  if (!SEMANTIC_TIER_SCORES.hasOwnProperty(semanticTier)) {
    semanticTier = LEGACY_TO_SEMANTIC_TIER[tierId] || 'DEEP';
  }

  tierId = tierId || SEMANTIC_TO_LEGACY_TIER[semanticTier] || 'F';

  return {
    id: tierId,
    semanticTier: semanticTier,
    score: SEMANTIC_TIER_SCORES[semanticTier]
  };
}

function calculateDraftNeed(player, context) {

  if(!player || !context){
    return 0;
  }

  var pos = player.position || player.pos;

  if(!pos){
    return 0;
  }

  var rosterNeeds =
    context.rosterNeeds || {};

  /*
   * Number of starting spots still needed
   * at this position.
   */
  var startersNeeded =
    Number(rosterNeeds[pos]) || 0;

  /*
   * Normalize need to a 0-100 scale.
   *
   * More unfilled starting spots = higher need.
   * This is intentionally capped so roster need
   * never overwhelms elite player value.
   */
  var needScore =
    Math.min(
      100,
      startersNeeded * 25
    );

  return needScore;
}

function calculateDraftScarcity(player, context){

  if(!player){
    return 0;
  }

  /*
   * The VORP engine already calculates
   * positional scarcity for each player.
   * Reuse that value instead of calculating
   * it a second time.
   */
  return Number(
    player.scarcity || 0
  );
}

function calculateDraftDecisionScore(player, context){

  if(!player) return null;

  context = context || {};

  var draftPhase = context.draftPhase ||
  getDraftPhase(
    Number(context.currentPick) || 0,
    Number(context.teams) || 10
  );

var phaseWeights = context.phaseWeights ||
  getDraftPhaseWeights(
    draftPhase.phase
  );

  /*
 * -------------------------------------------------------
 * PHASE 12 — DYNAMIC STRATEGY ADJUSTMENT
 * -------------------------------------------------------
 *
 * Read only the prebuilt strategy snapshot from context.
 *
 * Never build live draft state from inside the scoring
 * engine, which would create recursion.
 */

var dynamicStrategyAdjustment =
  calculateDynamicStrategyAdjustment(
    player,
    context.dynamicStrategyState ||
    null
  );

  var endgameRosterRequirementScore =
  calculateEndgameRosterRequirement(
    player,
    context
  );

var mandatoryEndgameAdjustment =
  calculateMandatoryEndgameAdjustment(
    player,
    context
  );

var rosterSaturationPenalty =
  calculateRosterSaturationPenalty(
    player,
    context
  );

  var position =
    player.position ||
    player.pos ||
    'N/A';

  var rank =
    Number(player.rank || player.rk || 9999);

  var vorp =
  Number(
    player.vorp ||
    context.vorp ||
    0
  );

  /*
   * -------------------------------------------------------
   * 1. CUSTOM RANK VALUE
   * -------------------------------------------------------
   *
   * Earlier overall rankings receive more value.
   */

  var rankDecay = Math.max(
    60,
    (Number(context.totalPicks) ||
      (Number(context.teams) * Number(context.rounds)) ||
      160) / 2
  );
  var rankScore = Math.max(
    0,
    Math.min(100, 100 * Math.exp(-Math.max(0, rank - 1) / rankDecay))
  );


  /*
   * -------------------------------------------------------
   * 2. TIER VALUE
   * -------------------------------------------------------
   */

  var tier =
    getPlayerTierValue(player);

  var tierScore =
    tier.score;


  /*
   * -------------------------------------------------------
   * 3. VORP VALUE
   * -------------------------------------------------------
   */

  var vorpMax =
  Number(context.vorpMax || 1);

var vorpScore =
  Math.max(
    0,
    Math.min(
      100,
      (vorp / vorpMax) * 100
    )
  );


  /*
   * -------------------------------------------------------
   * 4. POSITIONAL SCARCITY
   * -------------------------------------------------------
   */

  var scarcityScore =
  calculateDraftScarcity(
    player,
    context
  );

  /*
 * -------------------------------------------------------
 * 5. ROSTER NEED
 * -------------------------------------------------------
 */

var rosterNeedScore =
  calculateDraftNeed(
    player,
    context
  );

if(context.rosterNeeds &&
   context.rosterNeeds[position] !== undefined){

  var dedicatedNeed =
    Number(context.rosterNeeds[position]) || 0;

  var flexNeed =
    Number(context.rosterNeeds.FLEX) || 0;

  /*
   * RB / WR / TE can fill either their
   * dedicated position or FLEX.
   *
   * Do not add the two together because
   * one player can only fill one roster spot.
   */
  if(position === 'RB' ||
     position === 'WR' ||
     position === 'TE'){

    rosterNeedScore =
      Math.min(100, Math.max(dedicatedNeed, flexNeed) * 25);

  } else {

    rosterNeedScore =
      Math.min(100, dedicatedNeed * 25);

  }
}


  /*
   * -------------------------------------------------------
 * 6. DRAFT TIMING
   * -------------------------------------------------------
   */

var draftState =
  context.draftState ||
  getDraftAssistantState();

var lateAvailability = calculateLateAvailability(
  player,
  context.players || [],
  context
);

var timingScore =
  lateAvailability;

if (DEBUG_DRAFT_SCORING) {

  console.log(
    'TIMING SCORE:',
    player.name,
    'lateAvailability =',
    lateAvailability,
    'timingScore =',
    timingScore
  );

}


/*
 * -------------------------------------------------------
 * 6.5. STRATEGY ADJUSTMENT
 * -------------------------------------------------------
 */

var strategyScore = 0;

if (
  context.strategy &&
  context.strategy.targetPosition
) {

  var targetPosition =
    context.strategy.targetPosition;

  if (position === targetPosition) {

    strategyScore = 4;

  }

}


/*
 * -------------------------------------------------------
 * RUN OPPORTUNITY
 * -------------------------------------------------------
 */

var runOpportunityScore =
  calculateDraftRunOpportunity(
    player,
    context
  );

  var runUrgencyScore =
  calculateDraftRunUrgency(
    player,
    context
  );


if (DEBUG_DRAFT_SCORING) {
console.log(
  'RUN OPPORTUNITY SCORE:',
  player.name,
  'position =',
  position,
  'runOpportunityScore =',
  runOpportunityScore
);
}


/*
 * -------------------------------------------------------
 * TIER CLIFF OPPORTUNITY
 * -------------------------------------------------------
 */

var tierCliffOpportunityScore =
  calculateTierCliffOpportunity(
    player,
    context
  );

/*
 * -------------------------------------------------------
 * DRAFT-AWARE VORP OPPORTUNITY
 * -------------------------------------------------------
 */

  var phaseCoreAdjustment =
  calculatePhaseCoreAdjustment(
    vorpScore,
    scarcityScore,
    rosterNeedScore,
    phaseWeights
  );

var draftAwareVorpOpportunityScore =
  Number(
    player.draftAware
  );


if (
  !Number.isFinite(
    draftAwareVorpOpportunityScore
  )
) {

  draftAwareVorpOpportunityScore =
    calculateDraftAwareVorpOpportunity(
      player,
      context
    );

}

if (DEBUG_DRAFT_SCORING) {

  console.log(
    'DRAFT-AWARE VORP OPPORTUNITY:',
    player.name,
    'score =',
    draftAwareVorpOpportunityScore
  );

}


if (DEBUG_DRAFT_SCORING) {
console.log(
  'TIER CLIFF OPPORTUNITY:',
  player.name,
  'position =',
  position,
  'tierCliffOpportunityScore =',
  tierCliffOpportunityScore
);
}

  var rosterConstructionScore =
  calculateRosterConstructionValue(
    player,
    context
  );

var byeWeekCongestionAdjustment =
  calculateByeWeekCongestionAdjustment(
    player,
    context
  );

var futureDepthOpportunityScore =
  context.skipFutureDepth
    ? 0
    : calculateFutureDepthOpportunity(
        player,
        context
      );

var multiPickPlanningScore =
  context.skipMultiPickPlanning
    ? 0
    : calculateMultiPickPlanningScore(
        player,
        context
      );

  /*
 * -------------------------------------------------------
 * DRAFT-PHASE ADJUSTMENTS
 * -------------------------------------------------------
 *
 * Apply phase multipliers to supporting signals.
 * Keep the underlying raw scores intact for debugging.
 */

var phaseAdjustedRosterConstructionScore =
  rosterConstructionScore *
  phaseWeights.rosterConstruction;

var phaseAdjustedFutureDepthScore =
  futureDepthOpportunityScore *
  phaseWeights.futureDepth;

var phaseAdjustedMultiPickScore =
  multiPickPlanningScore *
  phaseWeights.multiPick;

var phaseAdjustedTierCliffScore =
  tierCliffOpportunityScore *
  phaseWeights.tierCliff;

var phaseAdjustedDraftAwareVorpScore =
  draftAwareVorpOpportunityScore *
  phaseWeights.draftAwareVorp;


/*
 * -------------------------------------------------------
 * 7. FINAL WEIGHTED SCORE
 * -------------------------------------------------------
 */

var baseScore =
    (tierScore * 0.35) +
    (rankScore * 0.25) +
    (vorpScore * 0.20) +
    (scarcityScore * 0.10) +
    (rosterNeedScore * 0.05) +
    (timingScore * 0.05);


/*
 * -------------------------------------------------------
 * STRATEGY ADJUSTMENTS
 * -------------------------------------------------------
 */

var rawStrategyAdjustment =
  strategyScore + dynamicStrategyAdjustment + phaseAdjustedTierCliffScore +
  phaseCoreAdjustment.total + runOpportunityScore + runUrgencyScore +
  phaseAdjustedDraftAwareVorpScore + phaseAdjustedRosterConstructionScore +
  phaseAdjustedFutureDepthScore + phaseAdjustedMultiPickScore +
  byeWeekCongestionAdjustment;
var adjustmentBudget = WAR_ROOM_CONFIG.strategyAdjustmentBudget || {min:-15, max:15};
var cappedStrategyAdjustment = Math.max(
  Number(adjustmentBudget.min) || -15,
  Math.min(Number(adjustmentBudget.max) || 15, rawStrategyAdjustment)
);
/* Hard roster guardrails remain outside the opportunity budget. They may
 * decisively promote required endgame positions or reject roster-breaking choices. */
var guardrailAdjustment = endgameRosterRequirementScore + mandatoryEndgameAdjustment + rosterSaturationPenalty;
var finalScore = baseScore + cappedStrategyAdjustment + guardrailAdjustment;

if (DEBUG_DRAFT_SCORING) {
  console.log(
  'STRATEGY SCORE DEBUG:',
  player.name,
  'position =', position,
  'targetPosition =',
  context.strategy &&
  context.strategy.targetPosition,
  'strategyScore =',
  strategyScore
);
}

  return {

    name:
      player.name || 'Unknown',

    position:
      position,

    rank:
      rank,

    ecr:
      player.ecr == null ? null : Number(player.ecr),

    adp:
      player.adp == null ? null : Number(player.adp),

    adpRank:
      player.adpRank == null ? null : Number(player.adpRank),

    realTimeAdp:
      player.realTimeAdp == null ? null : Number(player.realTimeAdp),

    espnRank:
      player.espnRank == null ? null : Number(player.espnRank),

    espnAdp:
      player.espnAdp == null ? null : Number(player.espnAdp),

    team:
      player.team || null,

    source:
      player.source || null,

    row:
      player.row || null,

    tier:
      tier.id,

    semanticTier:
      tier.semanticTier,

    tierScore:
      tierScore,

    rankScore:
      rankScore,

    vorpScore:
      vorpScore,

    phaseCoreAdjustment:
  phaseCoreAdjustment.total,

phaseCoreVorpAdjustment:
  phaseCoreAdjustment.vorp,

phaseCoreScarcityAdjustment:
  phaseCoreAdjustment.scarcity,

phaseCoreRosterNeedAdjustment:
  phaseCoreAdjustment.rosterNeed,

    rosterSaturationPenalty:
  rosterSaturationPenalty,

  endgameRosterRequirementScore:
  endgameRosterRequirementScore,

  mandatoryEndgameAdjustment:
  mandatoryEndgameAdjustment,

    scarcityScore:
      scarcityScore,

    rosterNeedScore:
      rosterNeedScore,

    draftPhase:
  draftPhase.phase,

draftRound:
  draftPhase.round,

phaseWeights:
  phaseWeights,

phaseAdjustedRosterConstructionScore:
  phaseAdjustedRosterConstructionScore,

phaseAdjustedFutureDepthScore:
  phaseAdjustedFutureDepthScore,

phaseAdjustedMultiPickScore:
  phaseAdjustedMultiPickScore,

phaseAdjustedTierCliffScore:
  phaseAdjustedTierCliffScore,

phaseAdjustedDraftAwareVorpScore:
  phaseAdjustedDraftAwareVorpScore,

    timingScore:
      timingScore,

baseScore:
  baseScore,

rawStrategyAdjustment:
  rawStrategyAdjustment,

cappedStrategyAdjustment:
  cappedStrategyAdjustment,

guardrailAdjustment:
  guardrailAdjustment,

strategyScore:
  strategyScore,

dynamicStrategyAdjustment:
  dynamicStrategyAdjustment,

runOpportunityScore:
  runOpportunityScore,

  runUrgencyScore:
  runUrgencyScore,

tierCliffOpportunityScore:
  tierCliffOpportunityScore,

draftAwareVorpOpportunityScore:
  draftAwareVorpOpportunityScore,

    multiPickPlanningScore:
  multiPickPlanningScore,

    futureDepthOpportunityScore:
  futureDepthOpportunityScore,

    rosterConstructionScore:
  rosterConstructionScore,

    byeWeekCongestionAdjustment:
  byeWeekCongestionAdjustment,

finalScore:
  finalScore

  };
}

function calculateRecommendationDecision(
  player,
  alternative,
  scoreGap,
  confidenceScore,
  context
) {

  if (!player) {
    return {
      recommendation: 'PASS',
      reason: 'No player provided.'
    };
  }

  context = context || {};

  var playerScore =
    Number(player.finalScore) || 0;

  var gap =
    Number(scoreGap) || 0;

  var confidence =
    Number(confidenceScore) || 0;


  /*
   * -------------------------------------------------------
   * PLAYER STRENGTH
   * -------------------------------------------------------
   */

  var vorp =
    Number(player.vorpScore) || 0;

  var tier =
    Number(player.tierScore) || 0;

  var timing =
    Number(player.timingScore) || 0;

  var cliff =
    Number(
      player.tierCliffOpportunityScore
    ) || 0;

  var run =
    Number(
      player.runOpportunityScore
    ) || 0;

  var draftAware =
    Number(
      player.draftAwareVorpOpportunityScore
    ) || 0;

  var strategy =
    Number(
      player.strategyScore
    ) || 0;


  /*
   * -------------------------------------------------------
   * ALTERNATIVE VALUE
   * -------------------------------------------------------
   */

  var alternativeRawScore =
    alternative
      ? Number(alternative.finalScore) || 0
      : 0;

  var alternativeSurvival =
    alternative
      ? Number(
          alternative.nextPickSurvivalScore
        ) || 0
      : 0;

  var alternativeAdjustedScore =
    alternative
      ? Number(
          alternative.survivalAdjustedScore
        ) || 0
      : 0;


  /*
   * -------------------------------------------------------
   * VALUE / URGENCY FLAGS
   * -------------------------------------------------------
   */

  var strongValue =
    (
      vorp >= 80 ||
      tier >= 90
    );

  var eliteValue =
    (
      vorp >= 90 &&
      tier >= 90
    );

  var urgent =
    (
      timing >= 70 ||
      cliff >= 5 ||
      run >= 3 ||
      draftAware >= 3
    );

  var strategicNeed =
    strategy >= 3;


  /*
   * -------------------------------------------------------
   * WAIT SAFETY
   * -------------------------------------------------------
   *
   * A strong surviving alternative makes waiting safer.
   */

  var safeToWait =
    (
      alternative &&
      alternativeSurvival >= 75 &&
      alternativeAdjustedScore >=
        (playerScore - 8)
    );


  /*
   * -------------------------------------------------------
   * DRAFT URGENCY
   * -------------------------------------------------------
   *
   * Waiting is dangerous when the alternative is weak
   * or unlikely to survive.
   */

  var dangerousToWait =
    (
      !alternative ||
      alternativeSurvival <= 40 ||
      alternativeAdjustedScore <=
        (playerScore - 15)
    );


  /*
   * -------------------------------------------------------
   * RECOMMENDATION
   * -------------------------------------------------------
   */

  var recommendation =
    'CONSIDER';


  /*
   * PASS
   *
   * Current player is clearly inferior.
   */

  if (
    gap <= -8
  ) {

    recommendation =
      'PASS';


  } else if (
    gap <= -4 &&
    confidence >= 40 &&
    !urgent
  ) {

    recommendation =
      'PASS';


  /*
   * DRAFT
   *
   * Strong advantage or dangerous to wait.
   */

  } else if (
    gap >= 8 &&
    confidence >= 65
  ) {

    recommendation =
      'DRAFT';


  } else if (
    gap >= 5 &&
    confidence >= 55 &&
    (
      strongValue ||
      urgent ||
      dangerousToWait
    )
  ) {

    recommendation =
      'DRAFT';


  } else if (
    eliteValue &&
    dangerousToWait &&
    confidence >= 50
  ) {

    recommendation =
      'DRAFT';


  } else if (
    strategicNeed &&
    gap >= 3 &&
    confidence >= 45
  ) {

    recommendation =
      'DRAFT';


  /*
   * WAIT
   *
   * Current player is fine, but the next-pick option is
   * good enough and likely enough to survive that forcing
   * the pick is unnecessary.
   */

  } else if (
    gap <= 3 &&
    safeToWait &&
    !urgent
  ) {

    recommendation =
      'WAIT';


  } else if (
    gap < 0 &&
    alternativeSurvival >= 65 &&
    !urgent
  ) {

    recommendation =
      'WAIT';


  /*
   * CONSIDER
   *
   * Close / ambiguous case.
   */

  } else {

    recommendation =
      'CONSIDER';

  }


  return {

    recommendation:
      recommendation,

    scoreGap:
      gap,

    confidenceScore:
      confidence,

    strongValue:
      strongValue,

    eliteValue:
      eliteValue,

    urgent:
      urgent,

    strategicNeed:
      strategicNeed,

    safeToWait:
      safeToWait,

    dangerousToWait:
      dangerousToWait,

    alternativeRawScore:
      alternativeRawScore,

    alternativeSurvival:
      alternativeSurvival,

    alternativeAdjustedScore:
      alternativeAdjustedScore

  };
}

function draftDebugSection(title, data) {

  if (!isDraftEngineDebugEnabled()) {
    return;
  }

  if (
    typeof DRAFT_DEBUG !== 'undefined' &&
    DRAFT_DEBUG &&
    typeof DRAFT_DEBUG.reset === 'function'
  ) {
    DRAFT_DEBUG.reset();
  }

  console.group('[DRAFT ENGINE] ' + title);

  if (Array.isArray(data)) {
    console.table(data);
  } else {
    console.log(data);
  }

  console.groupEnd();

}

function calculateNextPickAlternatives(
  player,
  scoredPlayers,
  context
) {

  if (!player) {
    return [];
  }

  scoredPlayers =
    Array.isArray(scoredPlayers)
      ? scoredPlayers
      : [];

  context =
    context || {};


  /*
   * -------------------------------------------------------
   * AVAILABLE ALTERNATIVES
   * -------------------------------------------------------
   */

  var availablePlayers =
    scoredPlayers.filter(function(candidate) {

      return candidate &&
        candidate.name !== player.name &&
        candidate.available !== false;

    });


  /*
   * -------------------------------------------------------
   * CURRENT DRAFT STATE
   * -------------------------------------------------------
   */

  var currentPick =
    Number(context.currentPick) || 0;

  var teams =
    Number(context.teams) || 10;


  /*
   * -------------------------------------------------------
   * CALCULATE ACTUAL NEXT PICK
   * -------------------------------------------------------
   *
   * Use the centralized, tested snake-draft helper.
   *
   * This avoids maintaining duplicate snake math
   * in multiple functions.
   */

  var draftWindow =
    calculateMyNextDraftPick(
      currentPick,
      teams
    );

  var calculatedNextPick =
    Number(draftWindow.nextPick) || 0;

  var calculatedPicksBetween =
    Number(draftWindow.picksBetween) || 0;


  /*
   * context.nextPick may already contain a valid
   * future pick.
   *
   * However, when we are currently on the clock,
   * context.nextPick may equal currentPick.
   *
   * In that case we must use the calculated
   * snake-draft next pick instead.
   */

  var suppliedNextPick =
    Number(context.nextPick) || 0;

  var nextPick =
    (
      suppliedNextPick &&
      suppliedNextPick !== currentPick
    )
      ? suppliedNextPick
      : calculatedNextPick;


  /*
   * -------------------------------------------------------
   * PICKS BETWEEN NOW AND NEXT TURN
   * -------------------------------------------------------
   */

  var picksBetween =
    nextPick === calculatedNextPick
      ? calculatedPicksBetween
      : Math.max(
          0,
          nextPick - currentPick - 1
        );


  /*
   * -------------------------------------------------------
   * RANK WINDOW
   * -------------------------------------------------------
   *
   * Look around the player's likely availability
   * at the next pick.
   */

  var rankWindow =
    Math.max(
      5,
      Math.ceil(
        Math.max(
          1,
          picksBetween
        ) * 0.35
      )
    );


  var currentRank =
    Number(player.rank) || 999;


  /*
   * -------------------------------------------------------
   * FIND REALISTIC ALTERNATIVES
   * -------------------------------------------------------
   */

  var alternatives =
    availablePlayers.filter(function(candidate) {

      var candidateRank =
        Number(candidate.rank) || 999;


      /*
       * Never consider someone ranked above or equal
       * to the player currently being evaluated.
       */

      if (
        candidateRank <= currentRank
      ) {

        return false;

      }


      /*
       * Look around the actual next-pick range.
       */

      var distanceFromNextPick =
        Math.abs(
          candidateRank -
          nextPick
        );

      return (
        distanceFromNextPick <=
        rankWindow
      );

    });


  /*
   * -------------------------------------------------------
   * INITIAL NEXT-PICK SURVIVAL ESTIMATE
   * -------------------------------------------------------
   *
   * This provides an initial estimate.
   *
   * calculateDraftRecommendation() later applies the
   * more complete calculateNextPickSurvival() model.
   */

  alternatives.forEach(function(candidate) {

    var candidateRank =
      Number(candidate.rank) || 999;

    var survivalScore =
      100;


    if (nextPick) {

      /*
       * Players ranked before our next pick become
       * increasingly unlikely to survive.
       */

      var distance =
        nextPick -
        candidateRank;

      if (distance > 0) {

        survivalScore -=
          distance * 8;

      }


      /*
       * Players ranked at or beyond our next pick
       * receive a small survival boost.
       */

      if (
        candidateRank >= nextPick
      ) {

        survivalScore += 15;

      }

    }


    candidate.nextPickSurvivalScore =
      Math.max(
        0,
        Math.min(
          100,
          survivalScore
        )
      );

  });


  /*
   * -------------------------------------------------------
   * SORT BY CURRENT DECISION SCORE
   * -------------------------------------------------------
   */

  alternatives.sort(function(a, b) {

    return (
      Number(b.finalScore || 0) -
      Number(a.finalScore || 0)
    );

  });


  /*
   * Keep only the strongest realistic alternatives.
   */

  alternatives =
    alternatives.slice(0, 8);


  /*
   * -------------------------------------------------------
   * HAND OFF NEXT-PICK WINDOW
   * -------------------------------------------------------
   *
   * calculateNextPickSurvival() uses these values.
   */

  context.calculatedNextPick =
    nextPick;

  context.calculatedPicksUntilNext =
    picksBetween;


  /*
   * -------------------------------------------------------
   * DEBUG
   * -------------------------------------------------------
   */

  if (
    typeof DRAFT_DEBUG !== 'undefined' &&
    DRAFT_DEBUG &&
    typeof DRAFT_DEBUG.add === 'function'
  ) {

    DRAFT_DEBUG.add(
      'NEXT PICK',
      {
        player:
          player.name,

        teams:
          teams,

        currentPick:
          currentPick,

        suppliedNextPick:
          suppliedNextPick,

        calculatedNextPick:
          calculatedNextPick,

        nextPick:
          nextPick,

        picksBetween:
          picksBetween,

        rankWindow:
          rankWindow
      }
    );

  }


  return alternatives;
}

function calculateFuturePositionDepth(
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
   * PLAYER POOL
   * -------------------------------------------------------
   */

  var players =
    context.players ||
    context.availablePlayers ||
    [];

  if (!players.length) {
    return 0;
  }


  /*
   * -------------------------------------------------------
   * NEXT PICK WINDOW
   * -------------------------------------------------------
   */

  var currentPick =
    Number(context.currentPick) || 0;

  var teams =
    Number(context.teams) || 10;

  var draftWindow =
    calculateMyNextDraftPick(
      currentPick,
      teams
    );

  var nextPick =
    Number(
      context.calculatedNextPick ||
      context.nextPick ||
      draftWindow.nextPick
    ) || 0;

  if (!nextPick) {
    return 0;
  }


  /*
   * -------------------------------------------------------
   * AVAILABLE PLAYERS AT THIS POSITION
   * -------------------------------------------------------
   */

 var currentPlayerRank =
  Number(player.rank) || 999;

var positionPool =
  players
    .filter(function(candidate) {

      if (
        !candidate ||
        candidate.available === false ||
        (
          candidate.position ||
          candidate.pos
        ) !== position ||
        candidate.name === player.name ||
        !candidate.rank ||
        !hasAuthoritativeEcr(candidate)
      ) {
        return false;
      }

      /*
       * Future alternatives must be ranked AFTER
       * the player we're considering now.
       *
       * A player ranked ahead of Burrow cannot be
       * treated as a future Burrow alternative.
       */
      return (
        Number(candidate.rank) >
        currentPlayerRank
      );

    })
    .slice()
    .sort(function(a, b) {

      return (
        Number(a.rank) -
        Number(b.rank)
      );

    });

  if (!positionPool.length) {
    return 0;
  }


  /*
   * -------------------------------------------------------
   * PROJECT LIKELY SURVIVORS
   * -------------------------------------------------------
   *
   * Run the existing survival model against players
   * from the same position.
   */

  var projected =
    positionPool.map(function(candidate) {

      var candidateForSurvival =
        Object.assign(
          {},
          candidate
        );

      var survival =
        calculateNextPickSurvival(
          candidateForSurvival,
          Object.assign(
            {},
            context,
            {
              calculatedNextPick:
                nextPick,

              currentRank:
                Number(player.rank) || 999
            }
          )
        );

      return {
        player:
          candidate,

        survival:
          survival
      };

    });


 /*
 * -------------------------------------------------------
 * QUALITY-WEIGHTED FUTURE DEPTH
 * -------------------------------------------------------
 *
 * Count alone is not enough.
 *
 * Five mediocre players surviving should not equal
 * five high-quality alternatives.
 */

var realisticOptions =
  projected
    .filter(function(item) {

      return (
        Number(item.survival) >= 35
      );

    })
    .map(function(item) {

      var candidateRank =
        Number(item.player.rank) || 999;

      var currentRank =
        Number(player.rank) || 999;


      /*
       * Rank quality relative to the player being
       * considered now.
       *
       * Small rank drop = strong future quality.
       */

      var rankDrop =
        Math.max(
          0,
          candidateRank - currentRank
        );


      var rankQuality =
        Math.max(
          0,
          100 - (rankDrop * 3)
        );


      /*
       * Combine player quality and probability
       * of actually surviving.
       */

      var futureValue =
        (
          rankQuality * 0.60
        ) +
        (
          Number(item.survival) * 0.40
        );


      return {
        player:
          item.player,

        survival:
          item.survival,

        rankDrop:
          rankDrop,

        rankQuality:
          rankQuality,

        futureValue:
          futureValue
      };

    })
    .sort(function(a, b) {

      return (
        Number(b.futureValue) -
        Number(a.futureValue)
      );

    });


if (!realisticOptions.length) {
  return 0;
}


/*
 * -------------------------------------------------------
 * USE THE BEST THREE FUTURE OPTIONS
 * -------------------------------------------------------
 *
 * We care much more about the quality of the first few
 * alternatives than whether 10 mediocre players survive.
 */

var topOptions =
  realisticOptions.slice(0, 3);

var totalFutureValue =
  topOptions.reduce(
    function(total, item) {

      return (
        total +
        Number(item.futureValue || 0)
      );

    },
    0
  );


var averageFutureValue =
  totalFutureValue /
  topOptions.length;


/*
 * Small bonus for having multiple realistic options.
 */

var depthBonus =
  Math.min(
    10,
    Math.max(
      0,
      realisticOptions.length - 1
    ) * 2
  );


var depthScore =
  averageFutureValue +
  depthBonus;


/*
 * Clamp 0–100.
 */

depthScore =
  Math.max(
    0,
    Math.min(
      100,
      depthScore
    )
  );


return Math.round(
  depthScore
);

}

function calculateFutureDepthOpportunity(
  player,
  context
) {

  var depth =
    calculateFuturePositionDepth(
      player,
      context
    );

  /*
   * -------------------------------------------------------
   * FUTURE DEPTH OPPORTUNITY
   * -------------------------------------------------------
   *
   * Low future depth:
   *   stronger reason to draft now.
   *
   * High future depth:
   *   safer to wait.
   *
   * Keep this intentionally small so it does not
   * overpower VORP, tiers, scarcity, or roster need.
   */

  var score = 0;


  if (depth <= 25) {

    score = 2.5;

  } else if (depth <= 40) {

    score = 1.75;

  } else if (depth <= 55) {

    score = 1;

  } else if (depth <= 70) {

    score = 0.25;

  } else if (depth <= 85) {

    score = -0.5;

  } else {

    score = -1;

  }


  return score;
}

function calculateNextPickSurvival(
  candidate,
  context
) {

  if (!candidate) {
    return 0;
  }

  context =
    context || {};

var currentPick =
  Number(context.currentPick) || 0;


var nextPick =
  Number(
    context.calculatedNextPick ||
    context.nextPick
  ) || 0;


/*
 * -------------------------------------------------------
 * REUSE PRECOMPUTED DRAFT WINDOW
 * -------------------------------------------------------
 *
 * The live draft context already knows how many picks
 * occur before our next selection. Do not rebuild the
 * draft state thousands of times during survival
 * projections.
 */

var picksUntilNext =
  Number(
    context.calculatedPicksUntilNext
  );


if (!Number.isFinite(picksUntilNext)) {

  var teams =
    Number(context.teams) || 10;


  var draftWindow =
    calculateMyNextDraftPick(
      currentPick,
      teams
    );


  picksUntilNext =
    draftWindow
      ? Number(
          draftWindow.picksBetween
        ) || 0
      : 0;

}

  /*
 * -------------------------------------------------------
 * BACK-TO-BACK PICK GUARANTEE
 * -------------------------------------------------------
 */

var picksBetween =
  Number(
    context.calculatedPicksUntilNext
  );


if (
  !Number.isFinite(picksBetween)
) {

  picksBetween =
    Math.max(
      0,
      nextPick -
      currentPick -
      1
    );

}


if (picksBetween <= 0) {

  return 100;

}

var rank =
  getFantasyProsMarketRank(candidate, context);

/* No ESPN or FantasyPros ADP means market survival is unknown. */
if (!Number.isFinite(rank)) {
  return 50;
}

  /*
 * -------------------------------------------------------
 * SURVIVAL RESULT CACHE
 * -------------------------------------------------------
 *
 * Survival is recalculated thousands of times with the
 * same player/window inputs during one engine refresh.
 * Cache those duplicate calculations on the current
 * draft context.
 *
 * Disable cache while DRAFT_DEBUG is active so debugging
 * still records every calculation.
 */

var survivalCacheEnabled =
  !(
    typeof DRAFT_DEBUG !== 'undefined' &&
    DRAFT_DEBUG &&
    typeof DRAFT_DEBUG.add === 'function'
  );


if (
  survivalCacheEnabled &&
  !context.nextPickSurvivalCache
) {

  context.nextPickSurvivalCache =
    {};

}


var position =
  candidate.position ||
  candidate.pos ||
  'N/A';


var survivalCacheKey =
  [
    position,
    rank,
    currentPick,
    nextPick,
    picksBetween
  ].join('|');


if (
  survivalCacheEnabled &&
  Object.prototype.hasOwnProperty.call(
    context.nextPickSurvivalCache,
    survivalCacheKey
  )
) {

  return context.nextPickSurvivalCache[
    survivalCacheKey
  ];

}
  
/*
 * ESPN ADP is the center of the market distribution when the companion has
 * supplied it; otherwise FantasyPros ADP is the player-level fallback.
 * A candidate with ADP equal to our next pick starts at 50%
 * survival; each ADP step later raises survival smoothly.
 */
var marketDistance = rank - nextPick;
var marketSpread = Math.max(5, Math.min(10, picksBetween * 0.5));
var marketSurvival = 100 / (1 + Math.exp(-marketDistance / marketSpread));

var opponentThreat = context.skipOpponentThreat
  ? 0
  : calculateOpponentDraftThreat(
      candidate,
      context
    );

var opponentThreatPenalty =
  -(opponentThreat * 0.15);

var survival =
  marketSurvival +
  opponentThreatPenalty;

/*
 * -------------------------------------------------------
 * CLAMP
 * -------------------------------------------------------
 */

survival =
  Math.max(
    0,
    Math.min(
      100,
      survival
    )
  );

  if (
  typeof DRAFT_DEBUG !== 'undefined' &&
  DRAFT_DEBUG &&
  typeof DRAFT_DEBUG.add === 'function'
) {

  DRAFT_DEBUG.add(
    'SURVIVAL',
    {
      player:
        candidate.name,

      currentPick:
        currentPick,

      nextPick:
        nextPick,

      picksUntilNext:
        picksUntilNext,

      candidateRank:
        rank,

      marketDistance:
        marketDistance,

      marketSpread:
        marketSpread,

      marketSurvival:
        marketSurvival,

      opponentThreat:
  opponentThreat,

opponentThreatPenalty:
  opponentThreatPenalty,

      finalSurvival:
        survival
    }
  );

}

  if (survivalCacheEnabled) {

  context.nextPickSurvivalCache[
    survivalCacheKey
  ] =
    survival;

}


return survival;
}

function calculateRecommendationConfidence(
  player,
  nextPlayer,
  context
) {

  if (!player) {
    return 0;
  }

  context = context || {};

  var confidence = 0;

  var score =
    Number(player.recommendationPriorityScore);

  if (!Number.isFinite(score)) {
    score = Number(player.finalScore) || 0;
  }

  var nextScore =
    nextPlayer
      ? Number(nextPlayer.finalScore) || 0
      : 0;

  var scoreGap =
    score - nextScore;


  /*
   * -------------------------------------------------------
   * 1. SCORE GAP
   * -------------------------------------------------------
   */

  if (scoreGap >= 10) {

    confidence += 30;

  } else if (scoreGap >= 7) {

    confidence += 25;

  } else if (scoreGap >= 5) {

    confidence += 20;

  } else if (scoreGap >= 3) {

    confidence += 15;

  } else if (scoreGap >= 1) {

    confidence += 8;

  }


  /*
   * -------------------------------------------------------
   * 2. VORP ADVANTAGE
   * -------------------------------------------------------
   */

  var playerVorp =
    Number(player.vorpScore) || 0;

  var nextVorp =
    nextPlayer
      ? Number(nextPlayer.vorpScore) || 0
      : 0;

  var vorpDifference =
    playerVorp - nextVorp;

  if (vorpDifference >= 20) {

    confidence += 20;

  } else if (vorpDifference >= 10) {

    confidence += 15;

  } else if (vorpDifference >= 5) {

    confidence += 10;

  } else if (vorpDifference >= 2) {

    confidence += 5;

  }


  /*
   * -------------------------------------------------------
   * 3. TIER ADVANTAGE
   * -------------------------------------------------------
   */

  var playerTier =
    Number(player.tierScore) || 0;

  var nextTier =
    nextPlayer
      ? Number(nextPlayer.tierScore) || 0
      : 0;

  var tierDifference =
    playerTier - nextTier;

  if (tierDifference >= 20) {

    confidence += 15;

  } else if (tierDifference >= 10) {

    confidence += 10;

  } else if (tierDifference >= 5) {

    confidence += 6;

  } else if (tierDifference >= 2) {

    confidence += 3;

  }


  /*
   * -------------------------------------------------------
   * 4. TIMING
   * -------------------------------------------------------
   */

  var timing =
    Number(player.timingScore) || 0;

  if (timing >= 80) {

    confidence += 10;

  } else if (timing >= 65) {

    confidence += 7;

  } else if (timing >= 50) {

    confidence += 4;

  }


  /*
   * -------------------------------------------------------
   * 5. SCARCITY
   * -------------------------------------------------------
   */

  var scarcity =
    Number(player.scarcityScore) || 0;

  if (scarcity >= 80) {

    confidence += 10;

  } else if (scarcity >= 60) {

    confidence += 7;

  } else if (scarcity >= 40) {

    confidence += 4;

  }


  /*
   * -------------------------------------------------------
   * 6. ROSTER NEED
   * -------------------------------------------------------
   */

  var need =
    Number(player.rosterNeedScore) || 0;

  if (need >= 3) {

    confidence += 5;

  } else if (need >= 2) {

    confidence += 3;

  }


  /*
   * -------------------------------------------------------
   * 7. DRAFT-AWARE VORP
   * -------------------------------------------------------
   */

  var draftAware =
    Number(
      player.draftAwareVorpOpportunityScore
    ) || 0;

  if (draftAware >= 8) {

    confidence += 10;

  } else if (draftAware >= 5) {

    confidence += 7;

  } else if (draftAware >= 3) {

    confidence += 4;

  }


  /*
   * -------------------------------------------------------
   * 8. TIER CLIFF
   * -------------------------------------------------------
   */

  var tierCliff =
    Number(
      player.tierCliffOpportunityScore
    ) || 0;

  if (tierCliff >= 8) {

    confidence += 10;

  } else if (tierCliff >= 5) {

    confidence += 7;

  } else if (tierCliff >= 3) {

    confidence += 4;

  }


  /*
   * -------------------------------------------------------
   * 9. NEXT-PICK SURVIVAL
   * -------------------------------------------------------
   */

  if (nextPlayer) {

    var survival =
      Number(
        nextPlayer.nextPickSurvivalScore
      ) || 0;

    if (survival >= 80) {

      confidence += 5;

    } else if (survival >= 60) {

      confidence += 3;

    }

  }


  /*
   * -------------------------------------------------------
   * CAP
   * -------------------------------------------------------
   */

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(confidence)
    )
  );

}
