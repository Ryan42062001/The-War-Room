/* =========================================================
   FANTASYPROS 2026 AUTHORITATIVE BOARD

   PPR ECR supplies rank/value/tier inputs.
   ESPN PPR ADP supplies live market timing when available; FantasyPros PPR
   ADP remains the player-level fallback.
   ========================================================= */

/*
 * =========================================================
 * FANTASYPROS 2026 MASTER DATASET
 * Snapshot: 2026-08-21
 * League target: 10-team Full PPR
 *
 * EXPERT_RANKINGS_2026 remains as an internal compatibility
 * name while the generated FantasyPros dataset is authoritative.
 * =========================================================
 */

var FANTASYPROS_LOCAL_OVERRIDE_KEY = 'warRoomFantasyProsTop20OverrideV1';
var EMBEDDED_FANTASYPROS_2026_DATASET =
  typeof FANTASYPROS_2026_DATASET !== 'undefined' && Array.isArray(FANTASYPROS_2026_DATASET)
    ? FANTASYPROS_2026_DATASET.slice()
    : [];

function loadFantasyProsLocalOverride() {
  try {
    var raw = localStorage.getItem(FANTASYPROS_LOCAL_OVERRIDE_KEY);
    var parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.players)) return null;
    if (parsed.players.length !== EMBEDDED_FANTASYPROS_2026_DATASET.length) return null;
    var names = new Set(parsed.players.map(function(player) {
      return String(player && player.canonicalName || '').trim();
    }).filter(Boolean));
    if (names.size !== parsed.players.length) return null;
    return parsed;
  } catch (error) {
    console.warn('Stored FantasyPros update could not be loaded:', error);
    return null;
  }
}

var activeFantasyProsLocalOverride = loadFantasyProsLocalOverride();
if (activeFantasyProsLocalOverride && typeof FANTASYPROS_2026_DATASET_META !== 'undefined') {
  FANTASYPROS_2026_DATASET_META = Object.assign({}, FANTASYPROS_2026_DATASET_META, {
    sourceSnapshotDate: activeFantasyProsLocalOverride.sourceSnapshotDate,
    top20EcrPlayers: activeFantasyProsLocalOverride.top20Count,
    localOverride: true,
    localOverrideFile: activeFantasyProsLocalOverride.sourceFile,
    localOverrideImportedAt: activeFantasyProsLocalOverride.importedAt
  });
}

var EXPERT_RANKINGS_2026 = activeFantasyProsLocalOverride
  ? activeFantasyProsLocalOverride.players
  : EMBEDDED_FANTASYPROS_2026_DATASET;

function normalizeExpertPlayerName(name) {

  return String(name || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();

}


/*
 * ---------------------------------------------------------
 * EXPERT NAME ALIASES
 * ---------------------------------------------------------
 *
 * These are the same NFL player represented differently
 * between the old board and the professional consensus.
 */
var EXPERT_PLAYER_ALIASES_2026 = {

  "tre' harris": "tre harris",

  "brian robinson":
    "brian robinson jr",

  "chigoziem okonkwo":
    "chig okonkwo",

  "adonai mitchell":
    "ad mitchell",

  "isaac teslaa":
    "isaac tezlaw"

};


function canonicalExpertPlayerName(name) {

  var normalized =
    normalizeExpertPlayerName(name);

  return (
    EXPERT_PLAYER_ALIASES_2026[
      normalized
    ] ||
    normalized
  );

}


function findDraftRowByExpertName(name) {

  var canonical =
    canonicalExpertPlayerName(name);

  if (!_draftRowsByCanonicalNameCache) {
    _draftRowsByCanonicalNameCache = indexDraftRowsByExpertName();
  }

  return _draftRowsByCanonicalNameCache.get(canonical) || null;

}

function indexDraftRowsByExpertName() {
  var rowsByName = new Map();

  document.querySelectorAll('tr.draftrow').forEach(function(row) {
    var canonical = canonicalExpertPlayerName(
      row.getAttribute('data-name')
    );

    if (canonical && !rowsByName.has(canonical)) {
      rowsByName.set(canonical, row);
    }
  });

  return rowsByName;
}


/*
 * =========================================================
 * FANTASYPROS BOARD HELPERS
 * =========================================================
 */

function getFantasyProsValueVsAdp(player) {

  if (
    !player ||
    player.ecr == null ||
    player.adp == null
  ) {
    return null;
  }

  return Number(player.adp) - Number(player.ecr);

}

function updateDraftRowMarketCell(row) {
  if (!row || !row.children[4]) return;
  var cell = row.children[4];
  var espnRank = getDraftRowNumber(row, 'data-espn-rank');
  var espnAdp = getDraftRowNumber(row, 'data-espn-adp');
  var fantasyProsAdp = getDraftRowNumber(row, 'data-adp');

  if (espnRank != null && espnAdp != null) {
    cell.textContent = '#' + espnRank.toFixed(0) + ' / ' + espnAdp.toFixed(1);
    cell.title = 'ESPN default board rank / live ESPN PPR ADP';
  } else if (espnRank != null) {
    cell.textContent = '#' + espnRank.toFixed(0);
    cell.title = 'ESPN default PPR board rank; live ESPN ADP is not available';
  } else if (espnAdp != null) {
    cell.textContent = espnAdp.toFixed(1);
    cell.title = 'Live ESPN PPR ADP';
  } else {
    cell.textContent = fantasyProsAdp != null ? fantasyProsAdp.toFixed(1) : '--';
    cell.title = fantasyProsAdp != null
      ? 'FantasyPros PPR ADP fallback; ESPN market rank is unavailable'
      : 'No market rank available';
  }
}

function updateDraftRowNoteCell(row) {
  if (!row) return;
  var cell = row.querySelector('.notecell');
  if (!cell) return;
  var source = row.getAttribute('data-player-source') || '';
  var ecr = getDraftRowNumber(row, 'data-ecr');
  var espnRank = getDraftRowNumber(row, 'data-espn-rank');
  var espnAdp = getDraftRowNumber(row, 'data-espn-adp');
  var fantasyProsAdp = getDraftRowNumber(row, 'data-adp');
  var parts = [];

  if (ecr != null) parts.push('FantasyPros PPR ECR #' + ecr.toFixed(0));
  else if (source === 'ADP_ONLY') parts.push('FantasyPros ADP depth player; no current ECR');

  if (espnRank != null) parts.push('ESPN board #' + espnRank.toFixed(0));
  if (espnAdp != null) parts.push('live ESPN ADP ' + espnAdp.toFixed(1));
  else if (espnRank != null) parts.push('live ESPN ADP unavailable');
  else if (fantasyProsAdp != null) parts.push('FantasyPros ADP fallback ' + fantasyProsAdp.toFixed(1));

  cell.textContent = parts.length ? parts.join(' · ') : 'No current ranking or market data.';
}

function updateDraftRowValueCell(row) {
  if (!row || !row.children[5]) return;
  var cell = row.children[5];
  var ecr = getDraftRowNumber(row, 'data-ecr');
  var player = {
    espnRank: getDraftRowNumber(row, 'data-espn-rank'),
    espnAdp: getDraftRowNumber(row, 'data-espn-adp'),
    adp: getDraftRowNumber(row, 'data-adp'),
    realTimeAdp: getDraftRowNumber(row, 'data-realtime-adp'),
    adpRank: getDraftRowNumber(row, 'data-adp-rank')
  };
  var state = getDraftAssistantState();
  var market = getMarketTimingDetails(player, {
    currentPick: state.currentPick,
    nextPick: state.myNextPick,
    calculatedNextPick: state.myNextPick,
    teams: state.teams
  });
  var marketRank = Number(market.marketRank);
  var value = ecr != null && Number.isFinite(marketRank) ? marketRank - ecr : null;

  cell.textContent = value == null
    ? '—'
    : (value > 0 ? '+' : '') + value.toFixed(1);
  cell.className = value == null || value === 0
    ? 'valzero'
    : value > 0 ? 'valpos' : 'valneg';
  cell.setAttribute('data-sortval', value == null ? '0' : String(value));
  cell.title = value == null
    ? 'Value unavailable because ECR or market position is missing'
    : market.source + ' ' + marketRank.toFixed(1) + ' minus FantasyPros ECR ' +
      ecr.toFixed(0) + ' = ' + (value > 0 ? '+' : '') + value.toFixed(1);
}

function refreshDynamicMarketValueCells() {
  document.querySelectorAll('tr.draftrow[data-espn-adp]:not([data-espn-adp=""])')
    .forEach(updateDraftRowValueCell);
}


function createExpertPlayerRow(player) {

  var row =
    document.createElement('tr');

  row.className =
    'draftrow';

  row.setAttribute(
    'data-name',
    normalizeExpertPlayerName(
      player.name
    )
  );

  row.setAttribute(
    'data-display-name',
    String(player.name || '').trim()
  );

  updateFantasyProsRowDataAttributes(
    row,
    player
  );

  row.setAttribute('role', 'button');
  row.setAttribute('tabindex', '-1');


  var displayName =
    String(
      player.name || ''
    ).trim();


  var adpText =
    player.adp != null
      ? Number(player.adp).toFixed(1)
      : '--';


  var valueVsAdp =
    getFantasyProsValueVsAdp(player);


  var valueText =
    valueVsAdp == null
      ? '—'
      : (
          valueVsAdp > 0
            ? '+'
            : ''
        ) + valueVsAdp.toFixed(1);


  var valueClass =
    valueVsAdp == null || valueVsAdp === 0
      ? 'valzero'
      : valueVsAdp > 0
        ? 'valpos'
        : 'valneg';


  row.innerHTML =
    '<td>--</td>' +

    '<td class="pname">' +
      displayName +
      ' <span class="posrk">' +
        player.pos +
        (
          player.posRank != null
            ? player.posRank
            : '--'
        ) +
      '</span>' +
    '</td>' +

    '<td>' +
      '<span class="pos-pill pos-' +
        player.pos +
      '">' +
        player.pos +
      '</span>' +
    '</td>' +

    '<td>' +
      (player.team || 'FA') +
      ' <span class="sos sos-neu">-</span>' +
    '</td>' +

    '<td>' +
      adpText +
    '</td>' +

    '<td class="' + valueClass + '" data-sortval="' +
      (valueVsAdp == null ? 0 : valueVsAdp) + '">' +
      valueText +
    '</td>' +

    '<td>' +
      (player.bye || '--') +
    '</td>' +

    '<td class="hc">' +
      (player.handcuff || '—') +
    '</td>' +

    '<td class="notecell">' +
      '' +
    '</td>';

  updateDraftRowMarketCell(row);
  updateDraftRowNoteCell(row);
  updateDraftRowValueCell(row);


  return row;

}


function updateFantasyProsRowDataAttributes(
  row,
  player
) {

  if (!row || !player) {
    return;
  }


  row.setAttribute(
    'data-pos',
    player.pos || ''
  );

  row.setAttribute(
    'data-bye',
    player.bye || ''
  );

  row.setAttribute(
    'data-board-rank',
    player.boardRank != null
      ? String(player.boardRank)
      : String(player.rank || '')
  );

  row.setAttribute(
    'data-ecr',
    player.ecr != null
      ? String(player.ecr)
      : ''
  );

  row.setAttribute(
    'data-adp',
    player.adp != null
      ? String(player.adp)
      : ''
  );

  row.setAttribute(
    'data-adp-rank',
    player.adpRank != null
      ? String(player.adpRank)
      : ''
  );

  row.setAttribute(
    'data-realtime-adp',
    player.realTimeAdp != null
      ? String(player.realTimeAdp)
      : ''
  );

  var espnBoardPlayer = getEspnBoardPlayer(player.name, player.pos, player.team);
  row.setAttribute(
    'data-espn-rank',
    espnBoardPlayer ? String(espnBoardPlayer.rank) : ''
  );

  row.setAttribute(
    'data-fantasypros-tier',
    player.fantasyProsTier != null
      ? String(player.fantasyProsTier)
      : ''
  );

  row.setAttribute(
    'data-consensus-tier',
    player.consensusTier || 'DEEP'
  );

  row.setAttribute(
    'data-semantic-tier',
    player.semanticTier ||
      player.consensusTier ||
      'DEEP'
  );

  row.setAttribute(
    'data-player-source',
    player.source || 'ECR'
  );

  row.setAttribute(
    'data-pos-rank',
    player.posRank != null
      ? String(player.posRank)
      : ''
  );

  row.classList.toggle(
    'special-teams-row',
    player.pos === 'K' || player.pos === 'DST'
  );

}

var espnBoardByCanonicalName = null;
var espnBoardByPositionTeam = null;

function canonicalEspnBoardName(name) {
  return canonicalExpertPlayerName(name).replace(/\s+(?:jr|sr|ii|iii|iv)$/i, '');
}

function getEspnBoardPlayer(name, position, team) {
  if (!espnBoardByCanonicalName) {
    espnBoardByCanonicalName = {};
    espnBoardByPositionTeam = {};
    var board = window.ESPN_2026_PPR_BOARD;
    (board && Array.isArray(board.players) ? board.players : []).forEach(function(player) {
      espnBoardByCanonicalName[canonicalEspnBoardName(player.name)] = player;
      var positionTeamKey = String(player.position || '') + '|' + String(player.team || '');
      if (!espnBoardByPositionTeam[positionTeamKey]) espnBoardByPositionTeam[positionTeamKey] = [];
      espnBoardByPositionTeam[positionTeamKey].push(player);
    });
  }
  var named = espnBoardByCanonicalName[canonicalEspnBoardName(name)];
  if (named) return named;
  if (String(position || '') !== 'DST') return null;
  var matches = espnBoardByPositionTeam[String(position || '') + '|' + String(team || '')] || [];
  return matches.length === 1 ? matches[0] : null;
}


function updateExpertPlayerRowMetadata(
  row,
  player
) {

  if (!row || !player) {
    return;
  }


  updateFantasyProsRowDataAttributes(
    row,
    player
  );

  row.setAttribute(
    'data-name',
    normalizeExpertPlayerName(
      player.name
    )
  );

  row.setAttribute(
    'data-display-name',
    String(player.name || '').trim()
  );


  var playerCell =
    row.querySelector('.pname');

  if (playerCell) {

    var posRank =
      playerCell.querySelector('.posrk');

    var firstTextNode =
      Array.from(
        playerCell.childNodes
      ).find(function(node) {

        return node.nodeType ===
          Node.TEXT_NODE;

      });

    if (firstTextNode) {

      firstTextNode.textContent =
        String(player.name || '').trim() +
        ' ';

    }

    if (posRank) {

      posRank.textContent =
        player.pos +
        (
          player.posRank != null
            ? player.posRank
            : '--'
        );

    }

  }


  var posPill =
    row.querySelector('.pos-pill');

  if (posPill) {

    posPill.className =
      'pos-pill pos-' +
      player.pos;

    posPill.textContent =
      player.pos;

  }


  var teamCell =
    row.children[3];

  if (teamCell) {

    var sos =
      teamCell.querySelector('.sos');

    teamCell.textContent =
      player.team || 'FA';

    if (sos) {

      teamCell.appendChild(
        document.createTextNode(' ')
      );

      teamCell.appendChild(sos);

    }

  }


  updateDraftRowMarketCell(row);
  updateDraftRowNoteCell(row);
  updateDraftRowValueCell(row);


  var byeCell =
    row.children[6];

  if (byeCell) {

    byeCell.textContent =
      player.bye || '--';

  }


}

function ensureExpertPlayerExists(player, rowsByName) {

  var canonical = canonicalExpertPlayerName(player.name);
  var existing = rowsByName instanceof Map
    ? rowsByName.get(canonical) || null
    : findDraftRowByExpertName(player.name);

  if (existing) {

    updateExpertPlayerRowMetadata(
      existing,
      player
    );

    return {
      row: existing,
      added: false
    };

  }


  var newRow =
    createExpertPlayerRow(
      player
    );

  if (rowsByName instanceof Map) {
    rowsByName.set(canonical, newRow);
  }


  return {
    row: newRow,
    added: true
  };

}


function getExpertTierBody(tier) {

  return (
    document.getElementById(
      'tbody-' + tier
    ) ||
    document.getElementById(
      'tbody-F'
    )
  );

}


/*
 * =========================================================
 * REMOVE ANY PLAYER OUTSIDE FANTASYPROS MASTER DATASET
 * =========================================================
 *
 * FantasyPros is now authoritative for:
 *
 * QB / RB / WR / TE / K / DST
 */
function removePlayersOutsideExpertDataset() {

  var supportedPositions =
    ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];


  var expertNames =
    new Set(
      EXPERT_RANKINGS_2026.map(
        function(player) {

          return canonicalExpertPlayerName(
            player.name
          );

        }
      )
    );


  var removed = [];


  Array.from(
    document.querySelectorAll(
      'tr.draftrow'
    )
  ).forEach(function(row) {

    var position =
      row.getAttribute(
        'data-pos'
      );


    if (
      !supportedPositions.includes(
        position
      )
    ) {

      return;

    }


    var name =
      row.getAttribute(
        'data-name'
      );


    if (
      !expertNames.has(
        canonicalExpertPlayerName(
          name
        )
      )
    ) {

      removed.push(name);

      row.remove();

    }

  });


  return removed;

}


/*
 * =========================================================
 * BUILD AUTHORITATIVE FANTASYPROS 2026 BOARD
 * =========================================================
 */
function build2026ExpertBoardStructure() {

  if (
    !Array.isArray(EXPERT_RANKINGS_2026) ||
    !EXPERT_RANKINGS_2026.length
  ) {

    console.warn(
      'FantasyPros 2026 master dataset unavailable.'
    );

    return null;

  }


  invalidateDraftRowCaches();

  var removedPlayers =
    removePlayersOutsideExpertDataset();

  var rowsByName =
    indexDraftRowsByExpertName();

  var tierFragments = {};

  TIER_IDS.forEach(function(tierId) {
    tierFragments[tierId] = document.createDocumentFragment();
  });


  var reused = 0;
  var added = 0;
  var errors = [];


  EXPERT_RANKINGS_2026.forEach(
    function(player) {

      try {

        var result =
          ensureExpertPlayerExists(
            player,
            rowsByName
          );


        if (
          !result ||
          !result.row
        ) {

          errors.push(
            player.name
          );

          return;

        }


        var tbody =
          getExpertTierBody(
            player.tier
          );


        if (!tbody) {

          errors.push(
            player.name +
            ' — missing legacy tier ' +
            player.tier
          );

          return;

        }


        /*
         * Dataset is already rank ordered.
         * appendChild() gives us deterministic order.
         */
        var targetTier = tierFragments[player.tier]
          ? player.tier
          : 'F';

        tierFragments[targetTier].appendChild(
          result.row
        );


        if (result.added) {

          added++;

        } else {

          reused++;

        }

      } catch (err) {

        console.error(
          'FantasyPros board initialization failed:',
          player.name,
          err
        );


        errors.push(
          player.name
        );

      }

    }
  );

  TIER_IDS.forEach(function(tierId) {
    var tbody = getExpertTierBody(tierId);
    if (tbody) tbody.appendChild(tierFragments[tierId]);
  });

  invalidateDraftRowCaches();
  getCachedDraftRows();
  _draftRowsByCanonicalNameCache = indexDraftRowsByExpertName();


  if (
    typeof syncRankData ===
    'function'
  ) {

    syncRankData();

  }


  var ecrRows =
    EXPERT_RANKINGS_2026.filter(
      function(player) {

        return player.ecr != null;

      }
    ).length;


  var adpOnlyRows =
    EXPERT_RANKINGS_2026.length -
    ecrRows;


  var totalRows =
    document.querySelectorAll(
      'tr.draftrow'
    ).length;


  var result = {

    datasetPlayers:
      EXPERT_RANKINGS_2026.length,

    ecrPlayers:
      ecrRows,

    adpOnlyPlayers:
      adpOnlyRows,

    reused:
      reused,

    added:
      added,

    removed:
      removedPlayers,

    totalRows:
      totalRows,

    errors:
      errors

  };


  console.log(
    'FantasyPros 2026 board initialized:',
    result
  );


  return result;

}


/*
 * =========================================================
 * MANUAL RE-APPLY
 * =========================================================
 */
function apply2026ExpertRankings() {

  console.log(
    '===================================='
  );

  console.log(
    'APPLYING FANTASYPROS 2026 MASTER BOARD'
  );

  console.log(
    '===================================='
  );


  var result =
    build2026ExpertBoardStructure();


  if (!result) {
    return null;
  }


  if (
    typeof syncEditControls ===
    'function'
  ) {

    syncEditControls();

  }


  if (
    typeof triggerAllBoardUpdates ===
    'function'
  ) {

    triggerAllBoardUpdates();

  }


  if (
    typeof saveState ===
    'function'
  ) {

    try {

      saveState();

    } catch (err) {

      console.warn(
        'FantasyPros board applied, but saveState failed:',
        err
      );

    }

  }


  return result;

}

/*
 * =========================================================
 * FANTASYPROS 2026 MASTER BOARD AUDIT
 * =========================================================
 */
function auditFantasyPros2026Board() {

  var rows =
    Array.from(
      document.querySelectorAll(
        'tr.draftrow'
      )
    );


  var boardMap =
    new Map();


  rows.forEach(function(row) {

    var key =
      canonicalExpertPlayerName(
        row.getAttribute(
          'data-name'
        )
      );


    if (!boardMap.has(key)) {

      boardMap.set(
        key,
        []
      );

    }


    boardMap.get(key).push(row);

  });


  var expected =
    EXPERT_RANKINGS_2026.map(
      function(player) {

        return canonicalExpertPlayerName(
          player.name
        );

      }
    );


  var expectedSet =
    new Set(expected);


  var datasetMap =
    new Map();


  expected.forEach(function(name) {

    datasetMap.set(
      name,
      (datasetMap.get(name) || 0) + 1
    );

  });


  var datasetDuplicates =
    Array.from(
      datasetMap.entries()
    ).filter(function(entry) {

      return entry[1] > 1;

    }).map(function(entry) {

      return entry[0];

    });


  var missing =
    expected.filter(
      function(name) {

        return !boardMap.has(name);

      }
    );


  var unexpected =
    Array.from(
      boardMap.keys()
    ).filter(
      function(name) {

        return !expectedSet.has(name);

      }
    );


  var duplicates =
    Array.from(
      boardMap.entries()
    ).filter(
      function(entry) {

        return entry[1].length > 1;

      }
    ).map(
      function(entry) {

        return entry[0];

      }
    );


  var positionCounts = {};


  rows.forEach(function(row) {

    var pos =
      row.getAttribute(
        'data-pos'
      ) || 'UNKNOWN';


    positionCounts[pos] =
      (
        positionCounts[pos] || 0
      ) + 1;

  });


  var ecrCount =
    rows.filter(
      function(row) {

        return (
          row.getAttribute(
            'data-ecr'
          ) || ''
        ) !== '';

      }
    ).length;


  var adpOnlyCount =
    rows.filter(
      function(row) {

        return (
          row.getAttribute(
            'data-player-source'
          ) === 'ADP_ONLY'
        );

      }
    ).length;


  var expectedPositionCounts =
    typeof FANTASYPROS_2026_DATASET_META !== 'undefined' &&
    FANTASYPROS_2026_DATASET_META.positionCounts
      ? FANTASYPROS_2026_DATASET_META.positionCounts
      : {};


  var positionCountsMatch =
    Object.keys(
      expectedPositionCounts
    ).every(function(position) {

      return (
        positionCounts[position] || 0
      ) === expectedPositionCounts[position];

    });


  var result = {

    datasetPlayers:
      EXPERT_RANKINGS_2026.length,

    boardPlayers:
      rows.length,

    exactCount:
      rows.length ===
      EXPERT_RANKINGS_2026.length,

    ecrRows:
      ecrCount,

    adpOnlyRows:
      adpOnlyCount,

    missingCount:
      missing.length,

    unexpectedCount:
      unexpected.length,

    duplicateCount:
      duplicates.length,

    datasetDuplicateCount:
      datasetDuplicates.length,

    positionCountsMatch:
      positionCountsMatch,

    positionCounts:
      positionCounts,

    missing:
      missing,

    unexpected:
      unexpected,

    duplicates:
      duplicates,

    datasetDuplicates:
      datasetDuplicates

  };


  result.passed =
    result.exactCount &&
    result.missingCount === 0 &&
    result.unexpectedCount === 0 &&
    result.duplicateCount === 0 &&
    result.datasetDuplicateCount === 0 &&
    result.positionCountsMatch;


  console.log(
    '=== FANTASYPROS 2026 MASTER BOARD AUDIT ==='
  );

  console.log(result);

  return result;

}


function runFantasyProsMigrationVerification() {
  if (typeof window.runDraftEngineTests !== 'function') {
    return loadDeveloperTools().then(runFantasyProsMigrationVerification);
  }

  var boardAudit =
    auditFantasyPros2026Board();

  var draftEngine =
    runDraftEngineTests();

  var turnPackage =
    runTurnPackageTests();

  var recommendationExplanation =
    runRecommendationExplanationTests();

  var totalPassed =
    draftEngine.passed +
    turnPackage.passed +
    recommendationExplanation.passed;

  var totalFailed =
    draftEngine.failed +
    turnPackage.failed +
    recommendationExplanation.failed;

  var result = {
    boardAudit: boardAudit,
    draftEngine: draftEngine,
    turnPackage: turnPackage,
    recommendationExplanation:
      recommendationExplanation,
    totalPassed: totalPassed,
    totalFailed: totalFailed,
    totalTests: totalPassed + totalFailed,
    passed:
      boardAudit.passed &&
      totalFailed === 0
  };

  window.FANTASYPROS_2026_LAST_VERIFICATION =
    result;

  var target =
    document.getElementById(
      'developer-test-results'
    );

  if (target) {
    target.textContent = [
      'FANTASYPROS 2026 MIGRATION VERIFICATION',
      'Board: ' +
        boardAudit.boardPlayers +
        '/' +
        boardAudit.datasetPlayers +
        ' rows',
      'Missing: ' + boardAudit.missingCount,
      'Unexpected: ' + boardAudit.unexpectedCount,
      'Board duplicates: ' +
        boardAudit.duplicateCount,
      'Dataset duplicates: ' +
        boardAudit.datasetDuplicateCount,
      'Draft engine: ' +
        draftEngine.passed +
        '/' +
        draftEngine.total,
      'Turn package: ' +
        turnPackage.passed +
        '/' +
        turnPackage.total,
      'Recommendation explanations: ' +
        recommendationExplanation.passed +
        '/' +
        recommendationExplanation.total,
      'Total: ' +
        totalPassed +
        '/' +
        result.totalTests,
      'Result: ' +
        (result.passed ? 'PASS' : 'FAIL')
    ].join('\n');
  }

  console.info(
    '[FantasyPros 2026 Migration Verification]',
    result
  );

  return result;
}

// ==== EDIT RANKS ====

function updateCustomBoardUi() {
  var button = document.getElementById('editRanksBtn');
  if (!button || document.body.classList.contains('edit-mode')) return;
  button.innerHTML = customBoardEnabled
    ? '&#9998; Edit Custom Board'
    : '&#9998; Customize Board';
  button.classList.toggle('customized', customBoardEnabled);
}

function toggleEditMode(){
  var isEditing = document.body.classList.toggle('edit-mode');
  var btn = document.getElementById('editRanksBtn');

  if(btn){
    btn.innerHTML = isEditing
      ? '&#10003; Done Editing'
      : (customBoardEnabled ? '&#9998; Edit Custom Board' : '&#9998; Customize Board');

    btn.classList.toggle('editing', isEditing);
  }

  if(isEditing){
    customBoardEnabled = true;
    addEditControlsCustom();
  } else {
    document.querySelectorAll('.rank-controls').forEach(function(el){
      el.remove();
    });
    scheduleSave();
  }
  updateCustomBoardUi();
}

function addEditControlsCustom(){
  document.querySelectorAll('tr.draftrow').forEach(function(row){

    if(row.querySelector('.rank-controls')) return;

    var playerCell = row.querySelector('.pname');
    if(!playerCell) return;

    var controls = document.createElement('span');
    controls.className = 'rank-controls';

    var upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'rank-move-btn';
    upBtn.innerHTML = '&#9650;';
    upBtn.title = 'Move player up';
    upBtn.onclick = function(e){
      e.stopPropagation();
      moveRowUp(row);
    };

    var downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'rank-move-btn';
    downBtn.innerHTML = '&#9660;';
    downBtn.title = 'Move player down';
    downBtn.onclick = function(e){
      e.stopPropagation();
      moveRowDown(row);
    };

    var select = document.createElement('select');
    select.title = 'Move player to tier';

    TIER_IDS.forEach(function(tierId){
      var option = document.createElement('option');
      option.value = tierId;
      option.textContent = TIER_LABELS[tierId];
      select.appendChild(option);
    });

    var currentTbody = row.closest('tbody.tier-group');
    if(currentTbody){
      select.value = currentTbody.id.replace('tbody-', '');
    }

    select.onchange = function(e){
      e.stopPropagation();
      moveRowToTier(row, select.value);
    };

    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(select);

    playerCell.appendChild(controls);
  });
}

function moveRowUp(row){
  if(!row || !row.parentElement) return;

  var previous = row.previousElementSibling;

  while(previous && !previous.classList.contains('draftrow')){
    previous = previous.previousElementSibling;
  }

  if(previous){
  row.parentElement.insertBefore(row, previous);

  syncRankData();
  syncEditControls();

  triggerAllBoardUpdates();
  scheduleSave();
}
}

function moveRowDown(row){
  if(!row || !row.parentElement) return;

  var next = row.nextElementSibling;

  while(next && !next.classList.contains('draftrow')){
    next = next.nextElementSibling;
  }

  if(next){
  row.parentElement.insertBefore(next, row);

  syncRankData();
  syncEditControls();

  triggerAllBoardUpdates();
  scheduleSave();
}
}

function moveRowToTier(row, tierId){
  if(!row) return;

  var targetTbody = document.getElementById('tbody-' + tierId);
  if(!targetTbody) return;

  var currentTbody = row.closest('tbody.tier-group');

  if(currentTbody === targetTbody){
    syncEditControls();
    return;
  }

  // Insert immediately after the tier divider
  var divider = targetTbody.querySelector('.tier-divider-row');

  if(divider){
  divider.after(row);
} else {
  targetTbody.appendChild(row);
}

syncRankData();
syncEditControls();

triggerAllBoardUpdates();
scheduleSave();
}

function applyCustomOrder(orderArray, skipSave){
  if(!orderArray || !orderArray.length) return;
  var rowMap = {};
  document.querySelectorAll('tr.draftrow').forEach(function(row){
    var name = row.getAttribute('data-name');
    if(name) rowMap[name] = row;
  });
  orderArray.forEach(function(entry){
  var row = rowMap[entry.n];
  var targetTbody = document.getElementById('tbody-' + entry.t);

  if(row && targetTbody){
    targetTbody.appendChild(row);
  }
});

syncRankData();
if (document.body.classList.contains('edit-mode')) addEditControls();
syncEditControls();
  if(!skipSave) {
    triggerAllBoardUpdates();
    scheduleSave();
  }
}

function resetRanks(){

  if(!confirm(
    'Reset all custom player rankings?\n\n' +
    'This will undo ALL of your manual rank and tier adjustments.\n\n' +
    'Your player draft/taken status will not be affected.'
  )){
    return;
  }

  if(!window.ORIGINAL_ORDER || !window.ORIGINAL_ORDER.length){
    flashSaveIndicator('Nothing to reset', '#e08a8a');
    return;
  }

  applyCustomOrder(window.ORIGINAL_ORDER);

  customBoardEnabled = false;
  document.body.classList.remove('edit-mode');
  document.querySelectorAll('.rank-controls').forEach(function(element) {
    element.remove();
  });

  syncEditControls();
  updateCustomBoardUi();
  scheduleSave();

  flashSaveIndicator('Ranks reset', '#8fd4a0');
}

function applyTeamColors(){
  document.querySelectorAll('tr.draftrow').forEach(function(row){
    var teamCell = row.children[3];
    if(!teamCell || teamCell.querySelector('.team-dot')) return;
    var teamText = teamCell.childNodes[0] ? teamCell.childNodes[0].textContent.trim() : '';
    var color = TEAM_COLORS[teamText];
    if(color){
      var dot = document.createElement('span');
      dot.className = 'team-dot';
      dot.style.background = color;
      teamCell.insertBefore(dot, teamCell.firstChild);
    }
  });
}

function clampRecommendationFactor(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function getCompactRecommendationReason(explanation, survival) {
  var reasons = explanation && Array.isArray(explanation.reasons) ? explanation.reasons : [];
  if (reasons.length) return String(reasons[0]).replace(/<[^>]*>/g, '').slice(0, 105);
  if (survival < 30) return 'Strong value with a low chance of reaching your next pick';
  if (survival >= 70) return 'Good option, but the market suggests you may be able to wait';
  return 'Best available fit for value, roster construction, and timing';
}

function buildCompactFactorHtml(label, value) {
  var score = Math.round(clampRecommendationFactor(value));
  return '<div class="recommendation-factor"><span><b>' + escapeSummaryHtml(label) + '</b><em>' + score + '</em></span>' +
    '<div class="recommendation-factor-track" role="progressbar" aria-label="' + escapeSummaryHtml(label) +
    '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + score + '"><i style="width:' + score + '%"></i></div></div>';
}

function buildMarketTimingDetailsHtml(player, context) {
  var market = getMarketTimingDetails(player, context);
  var nextPick = Number(context && (context.calculatedNextPick || context.nextPick)) || 0;
  var currentPick = Number(context && context.currentPick) || 0;
  var parts = [];
  if (market.espnRank != null) parts.push('ESPN board <b>#' + market.espnRank.toFixed(0) + '</b>');
  if (market.espnAdp != null) parts.push('ESPN ADP <b>' + market.espnAdp.toFixed(1) + '</b>');
  if (market.source === 'FantasyPros ADP fallback' && market.marketRank != null) parts.push('FantasyPros ADP <b>' + market.marketRank.toFixed(1) + '</b>');
  if (market.espnRank != null && market.espnAdp != null) parts.push('weights <b>' + Math.round(market.boardWeight * 100) + '/' + Math.round(market.adpWeight * 100) + '</b>');
  if (market.autoOpponentPicks) parts.push('confirmed Auto picks before next turn <b>' + market.autoOpponentPicks + '/' + market.totalOpponentPicks + '</b>');
  if (market.marketRank != null) parts.push('estimated market pick <b>' + market.marketRank.toFixed(1) + '</b>');
  if (nextPick) parts.push('next pick <b>#' + nextPick + '</b> (' + Math.max(0, nextPick - currentPick) + ' away)');
  return '<details class="recommendation-score-details recommendation-market-details"><summary>Why this survival?</summary><div>' +
    (parts.length ? parts.join(' · ') : 'No ESPN or FantasyPros market data is available for this player.') +
    '</div><small>' + escapeSummaryHtml(market.source) + '</small></details>';
}

function renderCompactRecommendationCard(element, recommendation, explanation, primary, state) {
  var action = String(recommendation.recommendation || 'CONSIDER').toUpperCase();
  var actionClass = action.toLowerCase().replace(/[^a-z]+/g, '-');
  var confidenceScore = Math.round(clampRecommendationFactor(recommendation.confidenceScore));
  var confidenceLabel = explanation.confidence || recommendation.confidence || 'LOW';
  var survival = Math.round(clampRecommendationFactor(calculateNextPickSurvival(primary, state.context)));
  var reason = getCompactRecommendationReason(explanation, survival);
  var reasons = (Array.isArray(explanation.reasons) ? explanation.reasons : []).slice(0, 3);
  var alternative = state.scored[1] || null;
  var scoreGap = alternative ? Number(primary.finalScore || 0) - Number(alternative.finalScore || 0) : 0;
  var team = primary.team || (primary.row && primary.row.getAttribute('data-team')) || '';
  var isTurn = explanation.type === 'TURN_PACKAGE' && recommendation.turnPackageActive;
  var summaryTitle = isTurn
    ? escapeSummaryHtml(recommendation.turnRecommendedNow || primary.name) + ' + ' + escapeSummaryHtml(recommendation.turnTargetNext || 'Best available')
    : escapeSummaryHtml(primary.name);
  var summaryPositions = isTurn
    ? [recommendation.turnPick1Position, recommendation.turnPick2Position].filter(Boolean).join(' + ')
    : primary.position + (team ? ' · ' + team : '');
  var summaryReason = isTurn ? 'Best back-to-back package with no opponent pick between' : reason;

  var details = '<div class="recommendation-expanded">';
  if (isTurn) {
    details += '<div class="recommendation-turn-grid"><div><small>1 · DRAFT NOW</small><b>' +
      escapeSummaryHtml(recommendation.turnRecommendedNow || primary.name) + '</b><span>' + escapeSummaryHtml(recommendation.turnPick1Position || '') + '</span></div>' +
      '<div><small>2 · TARGET NEXT</small><b>' + escapeSummaryHtml(recommendation.turnTargetNext || 'Best available') + '</b><span>' +
      escapeSummaryHtml(recommendation.turnPick2Position || '') + '</span></div></div>';
  }
  if (reasons.length) {
    details += '<section class="recommendation-why"><h3>Why this pick</h3><ul>' + reasons.map(function(item) {
      return '<li>' + escapeSummaryHtml(String(item).replace(/<[^>]*>/g, '')) + '</li>';
    }).join('') + '</ul></section>';
  }
  details += '<section class="recommendation-factors"><h3>Decision factors</h3><div class="recommendation-factor-grid">' +
    buildCompactFactorHtml('ECR value', primary.rankScore) +
    buildCompactFactorHtml('Roster need', primary.rosterNeedScore) +
    buildCompactFactorHtml('Scarcity', primary.scarcityScore) +
    buildCompactFactorHtml('ADP timing', primary.timingScore) + '</div></section>';
  if (alternative && !isTurn) {
    details += '<div class="recommendation-alternative"><span>Best alternative</span><b>' + escapeSummaryHtml(alternative.name) +
      ' · ' + escapeSummaryHtml(alternative.position) + '</b><small>' + (scoreGap >= 0 ? '+' : '') + scoreGap.toFixed(1) + ' score gap</small></div>';
  }
  if (explanation.nextAction) details += '<div class="recommendation-next"><span>Next</span>' + escapeSummaryHtml(explanation.nextAction) + '</div>';
  details += buildMarketTimingDetailsHtml(primary, state.context);
  details += '<details class="recommendation-score-details"><summary>Scoring details</summary><div>Base value <b>' + Number(primary.baseScore || 0).toFixed(1) +
    '</b> · Strategy impact <b>' + (Number(primary.cappedStrategyAdjustment || 0) >= 0 ? '+' : '') + Number(primary.cappedStrategyAdjustment || 0).toFixed(1) +
    '</b> · Guardrails <b>' + (Number(primary.guardrailAdjustment || 0) >= 0 ? '+' : '') + Number(primary.guardrailAdjustment || 0).toFixed(1) +
    '</b> · Final <b>' + Number(primary.finalScore || 0).toFixed(1) + '</b> · Survival <b>' + survival + '%</b>' +
    (isTurn ? ' · Package advantage <b>+' + Number(recommendation.turnPackageAdvantage || 0).toFixed(1) + '</b>' : '') + '</div></details></div>';

  var markup = '<details class="recommendation-card" data-action="' + actionClass + '"><summary class="recommendation-card-summary">' +
    '<span class="recommendation-action">' + escapeSummaryHtml(isTurn ? 'TURN PLAN' : action) + '</span>' +
    '<span class="recommendation-player"><b>' + summaryTitle + '</b><small>' + escapeSummaryHtml(summaryPositions) + '</small></span>' +
    '<span class="recommendation-confidence"><b>' + confidenceScore + '%</b><small>' + escapeSummaryHtml(confidenceLabel) + '</small></span>' +
    '<span class="recommendation-chevron" aria-hidden="true">⌄</span>' +
    '<span class="recommendation-one-line">' + escapeSummaryHtml(summaryReason) + '<b>' + survival + '% survival</b></span>' +
    '</summary>' + details + '</details>';
  if (element._recommendationMarkup === markup) return;
  var wasOpen = Boolean(element.querySelector('.recommendation-card[open]'));
  element.innerHTML = markup;
  element._recommendationMarkup = markup;
  if (wasOpen) {
    var refreshedCard = element.querySelector('.recommendation-card');
    if (refreshedCard) refreshedCard.open = true;
  }
}

function classifyRecommendationAuditOutcome(entry, draftedAt, intervening) {
  intervening = Array.isArray(intervening) ? intervening : [];
  var expectedIntervening = Math.max(0, Number(entry.nextPick) - Number(entry.decisionPick) - 1);
  var coverage = expectedIntervening === 0 ? 1 : Math.min(1, intervening.length / expectedIntervening);
  var majorReaches = intervening.filter(function(item) {
    return item.ecr != null && item.ecr - item.pick >= 30;
  }).length;
  var reachRatio = intervening.length ? majorReaches / intervening.length : 0;
  var selectedNow = draftedAt === Number(entry.decisionPick);
  var incomplete = coverage < 0.8;
  var noisyDraft = !incomplete && intervening.length >= 3 && reachRatio >= 0.35;
  var survived = selectedNow || incomplete ? null : draftedAt == null || draftedAt >= Number(entry.nextPick);
  return {
    survived: survived,
    outcome: selectedNow ? 'SELECTED_NOW' : incomplete ? 'INCOMPLETE' : survived ? 'SURVIVED' : 'DRAFTED_BEFORE_NEXT',
    actualDraftPick: draftedAt,
    expectedInterveningPicks: expectedIntervening,
    interveningPicks: intervening.length,
    pickCoverage: Number(coverage.toFixed(3)),
    majorReachCount: majorReaches,
    noisyDraft: noisyDraft,
    incomplete: incomplete,
    censored: selectedNow,
    calibrationEligible: !selectedNow && !incomplete && !noisyDraft
  };
}

function updateRecommendationAudit(recommendation, primary, state) {
  if (!recommendation || !primary || !state || !state.context) return;
  var decisionPick = Number(state.context.currentPick) || 0;
  var nextPick = Number(state.context.calculatedNextPick || state.context.nextPick) || 0;
  if (decisionPick < 1 || nextPick <= decisionPick) return;

  var changed = false;
  var readyEntries = recommendationAudit.filter(function(entry) {
    return !entry.resolved && decisionPick >= entry.nextPick;
  });
  var draftedPickSnapshot = readyEntries.length ? getCachedDraftRows().map(function(candidateRow) {
    return {
      row: candidateRow,
      pick: Number(candidateRow.getAttribute('data-pick')) || null,
      ecr: getDraftRowNumber(candidateRow, 'data-ecr')
    };
  }) : [];

  readyEntries.forEach(function(entry) {
    var row = findDraftRowByExpertName(entry.player);
    var draftedAt = row ? Number(row.getAttribute('data-pick')) || null : null;
    var intervening = draftedPickSnapshot.filter(function(item) {
      return item.pick > entry.decisionPick && item.pick < entry.nextPick;
    });
    var classification = classifyRecommendationAuditOutcome(entry, draftedAt, intervening);
    entry.resolved = true;
    Object.keys(classification).forEach(function(key) { entry[key] = classification[key]; });
    entry.resolvedAt = new Date().toISOString();
    changed = true;
  });

  var key = decisionPick + '|' + canonicalExpertPlayerName(primary.name);
  var existingEntry = recommendationAudit.find(function(entry) { return entry.key === key; });
  if (existingEntry) {
    var latestValues = {
      action: recommendation.recommendation,
      scoreGap: Number(recommendation.scoreGap) || 0,
      confidence: Number(recommendation.confidenceScore) || 0,
      baseScore: Number(primary.baseScore) || 0,
      strategyAdjustment: Number(primary.cappedStrategyAdjustment) || 0,
      guardrailAdjustment: Number(primary.guardrailAdjustment) || 0
    };
    Object.keys(latestValues).forEach(function(field) {
      if (existingEntry[field] !== latestValues[field]) {
        existingEntry[field] = latestValues[field];
        changed = true;
      }
    });
    if (changed) existingEntry.updatedAt = new Date().toISOString();
  } else {
    var marketDetails = getMarketTimingDetails(primary, state.context);
    recommendationAudit.push({
      key: key,
      recordedAt: new Date().toISOString(),
      decisionPick: decisionPick,
      nextPick: nextPick,
      player: primary.name,
      position: primary.position,
      ecr: primary.ecr == null ? Number(primary.rank) || null : Number(primary.ecr),
      adp: primary.adp == null ? null : Number(primary.adp),
      espnBoardRank: marketDetails.espnRank,
      espnAdp: marketDetails.espnAdp,
      marketSource: marketDetails.source,
      marketEstimate: marketDetails.marketRank,
      boardWeight: marketDetails.boardWeight,
      draftPhase: decisionPick <= 36 ? 'EARLY' : decisionPick <= 96 ? 'MIDDLE' : 'LATE',
      predictedSurvival: Math.round(clampRecommendationFactor(calculateNextPickSurvival(primary, state.context))),
      action: recommendation.recommendation,
      scoreGap: Number(recommendation.scoreGap) || 0,
      confidence: Number(recommendation.confidenceScore) || 0,
      baseScore: Number(primary.baseScore) || 0,
      strategyAdjustment: Number(primary.cappedStrategyAdjustment) || 0,
      guardrailAdjustment: Number(primary.guardrailAdjustment) || 0,
      byeWeek: primary.bye || null,
      byeWeekAdjustment: Number(primary.byeWeekCongestionAdjustment) || 0,
      resolved: false
    });
    if (recommendationAudit.length > 200) recommendationAudit = recommendationAudit.slice(-200);
    changed = true;
  }
  if (changed) scheduleSave();
}

function getRecommendationAuditSummary() {
  var resolved = recommendationAudit.filter(function(entry) { return entry.resolved; });
  var eligible = resolved.filter(function(entry) { return entry.calibrationEligible; });
  return {
    total: recommendationAudit.length,
    resolved: resolved.length,
    calibrationEligible: eligible.length,
    noisyDraftDecisions: resolved.filter(function(entry) { return entry.noisyDraft; }).length,
    incompleteDecisions: resolved.filter(function(entry) { return entry.incomplete; }).length,
    censoredDecisions: resolved.filter(function(entry) { return entry.censored; }).length,
    observedSurvivalRate: eligible.length
      ? Math.round(eligible.filter(function(entry) { return entry.survived; }).length / eligible.length * 100)
      : null,
    minimumSampleReached: eligible.length >= 10,
    entries: recommendationAudit.slice()
  };
}

function getRecommendationAuditPortfolioSummary() {
  var drafts = readDraftSessionRegistry().map(function(session) {
    try {
      var storedDraft = readDraftSessionPayload(session.id);
      var payload = storedDraft.payload;
      if (!payload) return null;
      var totalPicks = Math.max(2, Number(payload.teams) || 10) * Math.max(1, Number(payload.rounds) || 16);
      var numberedPicks = Object.keys(payload.draftMeta || {}).filter(function(name) {
        return Number(payload.draftMeta[name] && payload.draftMeta[name].pick) > 0;
      }).length;
      var resolved = (Array.isArray(payload.recommendationAudit) ? payload.recommendationAudit : [])
        .filter(function(entry) { return entry && entry.resolved; });
      var eligible = resolved.filter(function(entry) { return entry.calibrationEligible; });
      var noisy = resolved.filter(function(entry) { return entry.noisyDraft; }).length;
      var noiseRate = resolved.length ? noisy / resolved.length : 0;
      var complete = numberedPicks >= totalPicks;
      var clean = complete && eligible.length > 0 && noiseRate < 0.35;
      var calibrationByPhase = {};
      ['EARLY', 'MIDDLE', 'LATE'].forEach(function(phase) {
        var phaseEntries = eligible.filter(function(entry) { return entry.draftPhase === phase; });
        calibrationByPhase[phase] = {
          decisions: phaseEntries.length,
          predicted: phaseEntries.length ? Math.round(phaseEntries.reduce(function(sum, entry) { return sum + Number(entry.predictedSurvival || 0); }, 0) / phaseEntries.length) : null,
          observed: phaseEntries.length ? Math.round(phaseEntries.filter(function(entry) { return entry.survived; }).length / phaseEntries.length * 100) : null
        };
      });
      return {
        id: session.id,
        name: session.name,
        complete: complete,
        clean: clean,
        numberedPicks: numberedPicks,
        totalPicks: totalPicks,
        eligibleDecisions: eligible.length,
        noisyDecisions: noisy,
        qbDecisions: eligible.filter(function(entry) { return entry.position === 'QB'; }).length,
        teDecisions: eligible.filter(function(entry) { return entry.position === 'TE'; }).length,
        byePenaltyDecisions: eligible.filter(function(entry) { return Number(entry.byeWeekAdjustment) < 0; }).length,
        calibrationByPhase: calibrationByPhase
      };
    } catch (error) { return null; }
  }).filter(Boolean);
  var cleanDrafts = drafts.filter(function(draft) { return draft.clean; });
  var phaseCalibration = {};
  ['EARLY', 'MIDDLE', 'LATE'].forEach(function(phase) {
    var rows = cleanDrafts.map(function(draft) { return draft.calibrationByPhase[phase]; }).filter(function(row) { return row && row.decisions; });
    var decisions = rows.reduce(function(sum, row) { return sum + row.decisions; }, 0);
    phaseCalibration[phase] = {
      decisions: decisions,
      predicted: decisions ? Math.round(rows.reduce(function(sum, row) { return sum + row.predicted * row.decisions; }, 0) / decisions) : null,
      observed: decisions ? Math.round(rows.reduce(function(sum, row) { return sum + row.observed * row.decisions; }, 0) / decisions) : null
    };
  });
  return {
    savedDrafts: drafts.length,
    completedDrafts: drafts.filter(function(draft) { return draft.complete; }).length,
    cleanCompletedMocks: cleanDrafts.length,
    reviewReady: cleanDrafts.length >= 10,
    strongReviewSample: cleanDrafts.length >= 20,
    remainingUntilReview: Math.max(0, 10 - cleanDrafts.length),
    qbDecisions: cleanDrafts.reduce(function(sum, draft) { return sum + draft.qbDecisions; }, 0),
    teDecisions: cleanDrafts.reduce(function(sum, draft) { return sum + draft.teDecisions; }, 0),
    byePenaltyDecisions: cleanDrafts.reduce(function(sum, draft) { return sum + draft.byePenaltyDecisions; }, 0),
    phaseCalibration: phaseCalibration,
    drafts: drafts
  };
}

window.getRecommendationAuditPortfolioSummary = getRecommendationAuditPortfolioSummary;

function buildRecommendationAuditExport() {
  var portfolio = getRecommendationAuditPortfolioSummary();
  var draftById = {};
  portfolio.drafts.forEach(function(draft) { draftById[draft.id] = draft; });
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    scoringAutoAdjusted: false,
    reviewThresholds: {minimumCleanMocks: 10, strongSampleCleanMocks: 20},
    summary: portfolio,
    drafts: readDraftSessionRegistry().map(function(session) {
      try {
        var storedDraft = readDraftSessionPayload(session.id);
        var payload = storedDraft.payload;
        if (!payload) return null;
        return {
          id: session.id,
          name: session.name,
          createdAt: session.createdAt || null,
          savedAt: payload.savedAt || null,
          auditStatus: draftById[session.id] || null,
          decisions: Array.isArray(payload.recommendationAudit) ? payload.recommendationAudit : []
        };
      } catch (error) { return null; }
    }).filter(Boolean)
  };
}

function escapeCsvCell(value) {
  var text = value == null ? '' : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function recommendationAuditCsv(report) {
  var headers = ['draft','clean','complete','decisionPick','nextPick','phase','player','position','ecr','fantasyProsAdp','espnBoardRank','espnAdp','marketSource','marketEstimate','boardWeight','predictedSurvival','survived','outcome','pickCoverage','noisy','byeWeek','byePenalty'];
  var rows = [headers.map(escapeCsvCell).join(',')];
  report.drafts.forEach(function(draft) {
    (draft.decisions || []).forEach(function(entry) {
      rows.push([
        draft.name, draft.auditStatus && draft.auditStatus.clean,
        draft.auditStatus && draft.auditStatus.complete, entry.decisionPick,
        entry.nextPick, entry.draftPhase, entry.player, entry.position, entry.ecr, entry.adp,
        entry.espnBoardRank, entry.espnAdp, entry.marketSource, entry.marketEstimate, entry.boardWeight,
        entry.predictedSurvival, entry.survived, entry.outcome, entry.pickCoverage,
        entry.noisyDraft, entry.byeWeek, entry.byeWeekAdjustment
      ].map(escapeCsvCell).join(','));
    });
  });
  return rows.join('\r\n');
}

function downloadAuditFile(filename, content, type) {
  var url = URL.createObjectURL(new Blob([content], {type: type}));
  var link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function() { URL.revokeObjectURL(url); }, 0);
}

function exportRecommendationAudit(format) {
  saveState();
  var report = buildRecommendationAuditExport();
  var stamp = new Date().toISOString().slice(0, 10);
  if (format === 'csv') {
    downloadAuditFile('war-room-mock-audit-' + stamp + '.csv', recommendationAuditCsv(report), 'text/csv;charset=utf-8');
  } else {
    downloadAuditFile('war-room-mock-audit-' + stamp + '.json', JSON.stringify(report, null, 2), 'application/json');
  }
}

function renderMockAudit() {
  var target = document.getElementById('mock-audit-content');
  if (!target) return;
  var summary = getRecommendationAuditPortfolioSummary();
  var progress = Math.min(100, summary.cleanCompletedMocks / 10 * 100);
  var draftRows = summary.drafts.length ? summary.drafts.map(function(draft) {
    return '<tr><td>' + escapeSummaryHtml(draft.name) + '</td><td>' +
      (draft.clean ? 'Clean' : draft.complete ? 'Complete · excluded' : 'Incomplete') + '</td><td>' +
      draft.numberedPicks + '/' + draft.totalPicks + '</td><td>' + draft.eligibleDecisions + '</td><td>' +
      draft.qbDecisions + '</td><td>' + draft.teDecisions + '</td><td>' + draft.byePenaltyDecisions + '</td></tr>';
  }).join('') : '<tr><td colspan="7">No saved mock evidence yet.</td></tr>';
  target.innerHTML =
    '<div class="mock-audit-grid">' +
      '<div class="mock-audit-card"><small>Clean mocks</small><b>' + summary.cleanCompletedMocks + ' / 10</b></div>' +
      '<div class="mock-audit-card"><small>Completed drafts</small><b>' + summary.completedDrafts + '</b></div>' +
      '<div class="mock-audit-card"><small>QB / TE decisions</small><b>' + summary.qbDecisions + ' / ' + summary.teDecisions + '</b></div>' +
      '<div class="mock-audit-card"><small>Bye penalties</small><b>' + summary.byePenaltyDecisions + '</b></div>' +
    '</div><div class="mock-audit-grid mock-audit-calibration">' + ['EARLY','MIDDLE','LATE'].map(function(phase) {
      var row = summary.phaseCalibration[phase];
      return '<div class="mock-audit-card"><small>' + phase + ' survival</small><b>' +
        (row.decisions ? row.predicted + '% predicted / ' + row.observed + '% observed' : 'No clean sample') +
        '</b><span>' + row.decisions + ' decisions</span></div>';
    }).join('') + '</div><div class="mock-audit-progress" aria-label="Mock review progress"><span style="width:' + progress + '%"></span></div>' +
    '<p class="mock-audit-status' + (summary.reviewReady ? ' ready' : '') + '">' +
      (summary.reviewReady
        ? (summary.strongReviewSample ? 'Strong 20-mock sample reached. Ready for a full scoring review.' : 'Ten clean mocks reached. Ready for an initial evidence review.')
        : summary.remainingUntilReview + ' more clean completed mock' + (summary.remainingUntilReview === 1 ? '' : 's') + ' needed before review.') +
      ' No weights are changed automatically.</p>' +
    '<div class="mock-audit-table-wrap"><table class="mock-audit-table"><thead><tr><th>Draft</th><th>Status</th><th>Picks</th><th>Eligible</th><th>QB</th><th>TE</th><th>Bye</th></tr></thead><tbody>' + draftRows + '</tbody></table></div>';
}

function openMockAudit() {
  saveState();
  renderMockAudit();
  var modal = document.getElementById('mock-audit-modal');
  if (!modal) return;
  lastFocusedElementBeforeModal = document.activeElement;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('final-summary-open');
  var dialog = modal.querySelector('.mock-audit-dialog');
  if (dialog) dialog.focus();
}

function closeMockAudit() {
  var modal = document.getElementById('mock-audit-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('final-summary-open');
  if (lastFocusedElementBeforeModal && document.contains(lastFocusedElementBeforeModal)) lastFocusedElementBeforeModal.focus();
}

window.buildRecommendationAuditExport = buildRecommendationAuditExport;

function parseFantasyProsCsvText(text) {
  var rows = [];
  var row = [];
  var field = '';
  var quoted = false;
  String(text || '').split('').forEach(function(char, index, chars) {
    if (quoted) {
      if (char === '"' && chars[index + 1] === '"') {
        field += '"';
        chars[index + 1] = '';
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  });
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  if (!rows.length) return [];
  var headers = rows.shift().map(function(header) { return header.replace(/^\uFEFF/, '').trim(); });
  return rows.filter(function(values) { return values.some(Boolean); }).map(function(values) {
    var result = {};
    headers.forEach(function(header, index) { result[header] = values[index] == null ? '' : values[index]; });
    return result;
  });
}

function fantasyProsCsvValue(row, names) {
  var keys = Object.keys(row || {});
  var wanted = names.map(function(name) { return String(name).toUpperCase().replace(/[^A-Z0-9]/g, ''); });
  var key = keys.find(function(candidate) {
    return wanted.indexOf(String(candidate).toUpperCase().replace(/[^A-Z0-9]/g, '')) >= 0;
  });
  return key ? String(row[key] || '').trim() : '';
}

function fantasyProsTierMapping(rawTier, fallback) {
  var tier = Number(rawTier);
  var mappings = [
    {min:1,max:2,legacy:'Sp',semantic:'ELITE'}, {min:3,max:4,legacy:'S',semantic:'PREMIUM'},
    {min:5,max:6,legacy:'A',semantic:'CORE'}, {min:7,max:8,legacy:'B',semantic:'VALUE'},
    {min:9,max:10,legacy:'C',semantic:'UPSIDE'}, {min:11,max:12,legacy:'D',semantic:'DEPTH'},
    {min:13,max:14,legacy:'E',semantic:'LATE'}, {min:15,max:16,legacy:'F',semantic:'DEEP'}
  ];
  return mappings.find(function(mapping) { return tier >= mapping.min && tier <= mapping.max; }) || {
    legacy: fallback.tier, semantic: fallback.semanticTier || fallback.consensusTier, min: tier, max: tier
  };
}

function buildFantasyProsTop20Override(rows, file) {
  var rankedRows = rows.map(function(row) {
    var rank = Number(fantasyProsCsvValue(row, ['RK', 'RANK']));
    var name = fantasyProsCsvValue(row, ['PLAYER NAME', 'PLAYER']);
    return {row: row, rank: rank, name: name};
  }).filter(function(item) { return Number.isInteger(item.rank) && item.rank > 0 && item.name; })
    .sort(function(a, b) { return a.rank - b.rank; });
  if (rankedRows.length < 100 || rankedRows.length > 600) {
    throw new Error('Expected a Top-20 experts export with 100–600 ranked players; found ' + rankedRows.length + '.');
  }

  var baseByName = new Map(EMBEDDED_FANTASYPROS_2026_DATASET.map(function(player) {
    return [canonicalExpertPlayerName(player.name), player];
  }));
  var seen = new Set();
  var imported = rankedRows.map(function(item) {
    var key = canonicalExpertPlayerName(item.name);
    if (seen.has(key)) throw new Error('Duplicate player in the FantasyPros export: ' + item.name);
    seen.add(key);
    var existing = baseByName.get(key);
    if (!existing || existing.ecr == null) throw new Error('Ranked player is not on the broader ECR board: ' + item.name);
    var rawPosition = fantasyProsCsvValue(item.row, ['POS', 'POSITION']).toUpperCase().replace('D/ST', 'DST');
    var positionMatch = rawPosition.match(/^([A-Z]+)(\d+)?$/);
    if (!positionMatch || positionMatch[1] !== existing.pos) {
      throw new Error('Position mismatch for ' + item.name + ': expected ' + existing.pos + ', received ' + (rawPosition || 'blank') + '.');
    }
    var rawTier = Number(fantasyProsCsvValue(item.row, ['TIERS', 'TIER']));
    var mapping = fantasyProsTierMapping(rawTier, existing);
    return Object.assign({}, existing, {
      name: item.name,
      team: fantasyProsCsvValue(item.row, ['TEAM']) || existing.team,
      bye: fantasyProsCsvValue(item.row, ['BYE WEEK', 'BYE']) || existing.bye,
      posRank: positionMatch[2] ? Number(positionMatch[2]) : existing.posRank,
      fantasyProsTier: Number.isFinite(rawTier) && rawTier > 0 ? rawTier : existing.fantasyProsTier,
      consensusTier: mapping.semantic,
      semanticTier: mapping.semantic,
      tier: mapping.legacy,
      ecrSource: 'TOP20_EXPERTS',
      sourceEcrRank: item.rank
    });
  });

  var broadFallback = EMBEDDED_FANTASYPROS_2026_DATASET.filter(function(player) {
    return player.ecr != null && !seen.has(canonicalExpertPlayerName(player.name));
  }).map(function(player) { return Object.assign({}, player, {ecrSource:'BROAD_ECR_FALLBACK'}); });
  var adpOnly = EMBEDDED_FANTASYPROS_2026_DATASET.filter(function(player) { return player.ecr == null; })
    .map(function(player) { return Object.assign({}, player); });
  var ecrPlayers = imported.concat(broadFallback);
  var players = ecrPlayers.concat(adpOnly).map(function(player, index) {
    var ranked = index < ecrPlayers.length;
    return Object.assign({}, player, {
      rank: index + 1,
      boardRank: index + 1,
      ecr: ranked ? index + 1 : null
    });
  });
  if (players.length !== EMBEDDED_FANTASYPROS_2026_DATASET.length) throw new Error('The merged board did not preserve all players.');

  var modified = new Date(file && file.lastModified || Date.now());
  var sourceSnapshotDate = [modified.getFullYear(), String(modified.getMonth() + 1).padStart(2, '0'), String(modified.getDate()).padStart(2, '0')].join('-');
  return {
    version: 1,
    importedAt: new Date().toISOString(),
    sourceSnapshotDate: sourceSnapshotDate,
    sourceFile: String(file && file.name || 'FantasyPros Top-20 PPR CSV').slice(0, 160),
    top20Count: imported.length,
    players: players
  };
}

function setRankingsRefreshMessage(message, tone) {
  var target = document.getElementById('rankings-refresh-message');
  if (!target) return;
  target.className = 'rankings-refresh-message' + (tone ? ' ' + tone : '');
  target.textContent = message || '';
}

function renderRankingsRefreshStatus() {
  var fantasyPros = document.getElementById('fantasypros-refresh-status');
  var espn = document.getElementById('espn-rankings-refresh-status');
  if (fantasyPros) {
    var meta = typeof FANTASYPROS_2026_DATASET_META !== 'undefined' ? FANTASYPROS_2026_DATASET_META : {};
    fantasyPros.textContent = meta.localOverride
      ? 'Local update active · ' + (meta.top20EcrPlayers || 0) + ' Top-20 ranked players · ' + (meta.sourceSnapshotDate || 'date unknown')
      : 'Embedded baseline · ' + (meta.top20EcrPlayers || 0) + ' Top-20 ranked players · ' + (meta.sourceSnapshotDate || 'date unknown');
  }
  if (espn) {
    var updated = latestEspnSyncMeta.marketUpdatedAt ? new Date(latestEspnSyncMeta.marketUpdatedAt).toLocaleString() : 'not refreshed this session';
    espn.textContent = 'ESPN board ' + (latestEspnSyncMeta.marketRankCount || 0) + ' players · ADP ' +
      (latestEspnSyncMeta.marketAdpCount || 0) + ' players · ' + updated;
  }
}

function openRankingsRefresh() {
  renderRankingsRefreshStatus();
  setRankingsRefreshMessage('', '');
  var modal = document.getElementById('rankings-refresh-modal');
  if (!modal) return;
  lastFocusedElementBeforeModal = document.activeElement;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('final-summary-open');
  var dialog = modal.querySelector('.rankings-refresh-dialog');
  if (dialog) dialog.focus();
}

function closeRankingsRefresh() {
  var modal = document.getElementById('rankings-refresh-modal');
  if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
  document.body.classList.remove('final-summary-open');
  if (lastFocusedElementBeforeModal && document.contains(lastFocusedElementBeforeModal)) lastFocusedElementBeforeModal.focus();
}

function importFantasyProsTop20File() {
  var input = document.getElementById('fantasyprosTop20File');
  var file = input && input.files && input.files[0];
  if (!file) { setRankingsRefreshMessage('Choose the official FantasyPros Top-20 PPR experts CSV first.', 'error'); return; }
  setRankingsRefreshMessage('Validating ' + file.name + '…', 'working');
  file.text().then(function(text) {
    var override = buildFantasyProsTop20Override(parseFantasyProsCsvText(text), file);
    saveState();
    localStorage.setItem(FANTASYPROS_LOCAL_OVERRIDE_KEY, JSON.stringify(override));
    setRankingsRefreshMessage('Validated ' + override.top20Count + ' Top-20 ECR players. Reloading the authoritative board…', 'success');
    setTimeout(function() { window.location.reload(); }, 500);
  }).catch(function(error) {
    setRankingsRefreshMessage(error && error.message ? error.message : String(error), 'error');
  });
}


function resetFantasyProsRankingOverride() {
  if (!activeFantasyProsLocalOverride) { setRankingsRefreshMessage('The embedded FantasyPros baseline is already active.', ''); return; }
  saveState();
  localStorage.removeItem(FANTASYPROS_LOCAL_OVERRIDE_KEY);
  setRankingsRefreshMessage('Restoring the checked-in FantasyPros baseline…', 'success');
  setTimeout(function() { window.location.reload(); }, 350);
}

function requestEspnRankingsRefresh() {
  var targetOrigin = window.location.origin === 'null' ? '*' : window.location.origin;
  window.postMessage({channel: ESPN_SYNC_CHANNEL, type: 'RANKINGS_REFRESH_REQUEST'}, targetOrigin);
  setRankingsRefreshMessage('Refresh requested. Keep the ESPN draft tab open while the companion reads board rank and PPR ADP.', 'working');
}

function updateRecommendedPick(sharedLiveState) {

  var el =
    document.getElementById(
      'recommended-pick-text'
    );


  if (!el) {

    return;

  }

  if (isDraftComplete()) {
    el._recommendationMarkup = null;
    renderDraftCompleteRecommendation(el);
    return;
  }


  /*
   * -------------------------------------------------------
   * BUILD LIVE DRAFT ENGINE STATE
   * -------------------------------------------------------
   */

  var state =
    sharedLiveState || buildLiveDraftDebugState();


  if (
    !state ||
    !state.scored ||
    !state.scored.length
  ) {

    el._recommendationMarkup = null;
    el.innerHTML =
      'No available players to recommend.';

    return;

  }


  /*
   * -------------------------------------------------------
   * PRIMARY ENGINE RECOMMENDATION
   * -------------------------------------------------------
   */

  var primary =
    state.scored[0];


  var recommendation =
    calculateDraftRecommendation(
      primary,
      state.scored,
      state.context
    );


  if (!recommendation) {

    el._recommendationMarkup = null;
    el.innerHTML =
      'Unable to build a recommendation.';

    return;

  }


  /*
   * -------------------------------------------------------
   * PHASE 6 — TURN PACKAGE INTELLIGENCE
   * -------------------------------------------------------
   */

recommendation =
  attachLiveTurnPackage(
    recommendation,
    state.context
  );


window.latestDraftRecommendation =
  recommendation;


var liveExplanation =
  buildRecommendationExplanation(
    recommendation,
    state.scored[0],
    state.scored[1] || null
  );


window.latestDraftExplanation =
  liveExplanation;

  /*
   * -------------------------------------------------------
   * PHASE 8 — ON-THE-CLOCK UI
   * -------------------------------------------------------
   */

  if (!liveExplanation) {

    el._recommendationMarkup = null;
    el.innerHTML =
      'Unable to build recommendation explanation.';

    return;

  }

  renderCompactRecommendationCard(el, recommendation, liveExplanation, primary, state);
  updateRecommendationAudit(recommendation, primary, state);
  return;


}

function buildPickContextHtml(
  state
) {

  if (
    !state ||
    !state.context
  ) {

    return '';

  }


  var teams =
    Number(
      state.context.teams
    ) ||
    Number(LEAGUE_SIZE) ||
    10;


  var currentPick =
    Number(
      state.context.currentPick
    ) || 0;


  var currentRound =
    currentPick > 0
      ? Math.ceil(
          currentPick / teams
        )
      : 0;


  var nextPick =
    Number(
      state.context.calculatedNextPick ||
      state.context.nextPick
    ) || 0;


  var picksBetween =
    Number(
      state.context.calculatedPicksUntilNext
    );


  /*
   * -------------------------------------------------------
   * FALLBACK TO SNAKE-PICK CALCULATION
   * -------------------------------------------------------
   */

  if (
    !nextPick ||
    !Number.isFinite(picksBetween)
  ) {

    var nextPickInfo =
      calculateMyNextDraftPick(
        currentPick,
        teams
      );


    if (nextPickInfo) {

      nextPick =
        Number(
          nextPickInfo.nextPick
        ) || nextPick;


      picksBetween =
        Number(
          nextPickInfo.picksBetween
        );

    }

  }


  if (!Number.isFinite(picksBetween)) {

    picksBetween =
      0;

  }


  var betweenLabel =
    picksBetween === 1
      ? '1 pick between'
      : picksBetween +
        ' picks between';


  /*
   * -------------------------------------------------------
   * BUILD UI
   * -------------------------------------------------------
   */

  var output =
    '<div style="' +
      'font-size:0.69rem;' +
      'color:#a9c2ab;' +
      'margin-bottom:9px;' +
      'line-height:1.35;' +
    '">';


  if (currentPick > 0) {

    output +=
      'Pick <b>#' +
      currentPick +
      '</b>';

  }


  if (currentRound > 0) {

    output +=
      ' &middot; Round <b>' +
      currentRound +
      '</b>';

  }


  if (nextPick > 0) {

    output +=
      ' &middot; Next <b>#' +
      nextPick +
      '</b>';

  }


  if (currentPick > 0) {

    output +=
      ' &middot; ' +
      betweenLabel;

  }


  output +=
    '</div>';


  return output;

}

function buildUrgencyIndicatorHtml(
  recommendation,
  primary,
  state
) {

  if (
    !recommendation ||
    !primary ||
    !state ||
    !state.context
  ) {

    return '';

  }

  if (
    recommendation.turnPackageActive
  ) {

    return (
      '<div style="' +
        'font-size:0.69rem;' +
        'font-weight:900;' +
        'margin-bottom:9px;' +
        'color:#a9c2ab;' +
      '">' +
        '&#10003; TURN SAFE &middot; no opponent picks between selections' +
      '</div>'
    );

  }

  var timingScore =
    Number(
      primary.timingScore
    ) || 0;

  var tierCliffScore =
    Number(
      primary.tierCliffOpportunityScore
    ) || 0;

  var scarcityScore =
    Number(
      primary.scarcityScore
    ) || 0;

  var picksBetween =
    Number(
      state.context.calculatedPicksUntilNext
    );

  if (!Number.isFinite(picksBetween)) {

    var teams =
      Number(
        state.context.teams
      ) || 10;

    var currentPick =
      Number(
        state.context.currentPick
      ) || 0;

    var nextPickInfo =
      calculateMyNextDraftPick(
        currentPick,
        teams
      );

    picksBetween =
      nextPickInfo
        ? Number(
            nextPickInfo.picksBetween
          )
        : 0;

  }

  var label =
    'LOW RISK TO WAIT';

  var symbol =
    '&#10003;';

  if (tierCliffScore >= 5) {

    label =
      'TIER CLIFF — ACT NOW';

    symbol =
      '&#9888;';

  } else if (timingScore >= 70) {

    label =
      'HIGH RISK TO WAIT';

    symbol =
      '&#9888;';

  } else if (
    timingScore >= 50 ||
    (
      scarcityScore >= 90 &&
      picksBetween >= 10
    )
  ) {

    label =
      'MODERATE RISK TO WAIT';

    symbol =
      '&#9888;';

  }

  return (
    '<div style="' +
      'font-size:0.69rem;' +
      'font-weight:900;' +
      'margin-bottom:9px;' +
      'color:#a9c2ab;' +
    '">' +
      symbol +
      ' ' +
      label +
    '</div>'
  );

}

function buildDraftIntelligenceHtml(
  primary,
  state
) {

  if (
    !primary ||
    !state ||
    !state.context
  ) {

    return '';

  }


  var context =
    state.context;


  var output =
    '';


  /*
   * -------------------------------------------------------
   * OPPONENT THREAT
   * -------------------------------------------------------
   *
   * Only show this when opponents actually pick before
   * our next selection.
   */

  var picksBetween =
    Number(
      context.calculatedPicksUntilNext
    );


  if (!Number.isFinite(picksBetween)) {

    var teams =
      Number(context.teams) || 10;

    var currentPick =
      Number(context.currentPick) || 0;

    var nextPickInfo =
      calculateMyNextDraftPick(
        currentPick,
        teams
      );


    picksBetween =
      nextPickInfo
        ? Number(
            nextPickInfo.picksBetween
          ) || 0
        : 0;

  }


  if (picksBetween > 0) {

    var threatSummary =
      summarizeOpponentDraftThreat(
        primary,
        context
      );


    if (
      threatSummary &&
      threatSummary.position
    ) {

      var threatLabel =
        threatSummary.label ||
        'LOW';


      var threatSymbol =
        threatLabel === 'HIGH'
          ? '&#9888;'
          : threatLabel === 'MODERATE'
            ? '&#9651;'
            : '&#10003;';


      output +=
        '<div style="' +
          'font-size:0.68rem;' +
          'line-height:1.35;' +
          'margin-bottom:5px;' +
          'color:#a9c2ab;' +
        '">' +

          threatSymbol +
          ' <b>OPPONENTS</b> &middot; ' +

          threatSummary.threateningTeams +
' team' +
(
  threatSummary.threateningTeams === 1
    ? ''
    : 's'
) +

' could target ' +
threatSummary.position +
' before your next pick' +

' &middot; ' +
threatLabel +
' DEMAND' +

        '</div>';

    }

  }


  /*
   * -------------------------------------------------------
   * LIVE POSITIONAL RUN
   * -------------------------------------------------------
   */

  var draftRuns =
    context.draftRuns;


  if (
    draftRuns &&
    draftRuns.isRun &&
    draftRuns.position
  ) {

    var runPosition =
      draftRuns.position;


    var runCount =
      Number(
        draftRuns.count
      ) || 0;


    var runStrength =
      draftRuns.strength ||
      'NONE';


    var startPick =
      Number(
        draftRuns.recentStartPick
      ) || 0;


    var endPick =
      Number(
        draftRuns.recentEndPick
      ) || 0;


    output +=
      '<div style="' +
        'font-size:0.68rem;' +
        'line-height:1.35;' +
        'margin-bottom:5px;' +
        'color:#a9c2ab;' +
      '">' +

        '&#9889; <b>' +
        runPosition +
        ' RUN</b> &middot; ' +

        runCount +
        ' ' +
        runPosition +
        (
          runCount === 1
            ? ''
            : 's'
        ) +
        ' taken' +

        (
          startPick > 0 &&
          endPick > 0
            ? ' in picks ' +
              startPick +
              '&ndash;' +
              endPick
            : ''
        ) +

        ' &middot; ' +
        runStrength +

      '</div>';

  }

  /*
 * -------------------------------------------------------
 * TIER & SCARCITY INTELLIGENCE
 * -------------------------------------------------------
 *
 * Only show information for the recommended player's
 * position.
 *
 * This keeps the On-the-Clock card focused instead of
 * reproducing the full Tier & Scarcity alert panel.
 */

var primaryPosition =
  primary.position ||
  primary.pos ||
  null;


if (
  primaryPosition &&
  ['QB', 'RB', 'WR', 'TE'].includes(
    primaryPosition
  )
) {

  var profiles =
    state.vorpResult &&
    Array.isArray(
      state.vorpResult.profiles
    )
      ? state.vorpResult.profiles
      : [];


  var playerPool =
    Array.isArray(
      state.players
    )
      ? state.players
      : [];


  var tierScarcityState =
    buildLiveTierScarcityState(
      playerPool,
      profiles
    );


  var positionState =
    tierScarcityState &&
    tierScarcityState.positions
      ? tierScarcityState.positions[
          primaryPosition
        ]
      : null;


  if (positionState) {

    /*
     * -------------------------------------------------------
     * CRITICAL CLIFF
     * -------------------------------------------------------
     */

    if (
      positionState.status ===
      'CRITICAL CLIFF'
    ) {

      output +=
        '<div style="' +
          'font-size:0.68rem;' +
          'line-height:1.35;' +
          'margin-bottom:5px;' +
          'color:#a9c2ab;' +
        '">' +

          '&#128680; <b>' +
          primaryPosition +
          ' CLIFF</b> &middot; ' +

          positionState.playersBeforeCliff +
          ' player' +
          (
            positionState.playersBeforeCliff === 1
              ? ''
              : 's'
          ) +
          ' remain before ' +

          (
            positionState.fromTier ||
            '?'
          ) +
          ' &rarr; ' +
          (
            positionState.toTier ||
            '?'
          ) +

          ' &middot; CRITICAL' +

        '</div>';


    /*
     * -------------------------------------------------------
     * TIER CLOSING
     * -------------------------------------------------------
     */

    } else if (
      positionState.status ===
      'TIER CLOSING'
    ) {

      output +=
        '<div style="' +
          'font-size:0.68rem;' +
          'line-height:1.35;' +
          'margin-bottom:5px;' +
          'color:#a9c2ab;' +
        '">' +

          '&#9888; <b>' +
          primaryPosition +
          ' TIER CLOSING</b> &middot; ' +

          positionState.playersBeforeCliff +
          ' player' +
          (
            positionState.playersBeforeCliff === 1
              ? ''
              : 's'
          ) +
          ' remain before the ' +

          (
            positionState.fromTier ||
            '?'
          ) +
          ' &rarr; ' +
          (
            positionState.toTier ||
            '?'
          ) +
          ' drop' +

        '</div>';


    /*
     * -------------------------------------------------------
     * HIGH SCARCITY
     * -------------------------------------------------------
     */

    } else if (
      positionState.status ===
      'HIGH SCARCITY'
    ) {

      output +=
        '<div style="' +
          'font-size:0.68rem;' +
          'line-height:1.35;' +
          'margin-bottom:5px;' +
          'color:#a9c2ab;' +
        '">' +

          '&#9888; <b>' +
          primaryPosition +
          ' SCARCITY</b> &middot; ' +

          'high-value ' +
          primaryPosition +
          ' depth is thin' +

        '</div>';


    /*
     * -------------------------------------------------------
     * LIMITED DEPTH
     * -------------------------------------------------------
     */

    } else if (
      positionState.status ===
      'LIMITED DEPTH'
    ) {

      output +=
        '<div style="' +
          'font-size:0.68rem;' +
          'line-height:1.35;' +
          'margin-bottom:5px;' +
          'color:#a9c2ab;' +
        '">' +

          '&#9651; <b>' +
          primaryPosition +
          ' DEPTH</b> &middot; ' +

          'remaining quality is becoming limited' +

        '</div>';


    /*
     * -------------------------------------------------------
     * HEALTHY DEPTH
     * -------------------------------------------------------
     */

    } else if (
      positionState.status ===
      'HEALTHY DEPTH'
    ) {

      output +=
        '<div style="' +
          'font-size:0.68rem;' +
          'line-height:1.35;' +
          'margin-bottom:5px;' +
          'color:#a9c2ab;' +
        '">' +

          '&#10003; <b>' +
          primaryPosition +
          ' DEPTH</b> &middot; ' +

          'waiting remains reasonable' +

        '</div>';

    }

  }

}

  if (!output) {

    return '';

  }


  return (
    '<div style="' +
      'margin-bottom:9px;' +
      'padding:7px 9px;' +
      'border-radius:8px;' +
      'background:rgba(255,255,255,0.025);' +
      'border:1px solid rgba(255,255,255,0.05);' +
    '">' +
      output +
    '</div>'
  );

}

var roundMarkerCache = {
  leagueSize: null,
  rowCount: 0,
  firstRow: null,
  lastRow: null
};


function addRoundMarkers(
  force
) {

  var rows =
    document.querySelectorAll(
      'tr.draftrow'
    );


  var firstRow =
    rows.length
      ? rows[0]
      : null;


  var lastRow =
    rows.length
      ? rows[
          rows.length - 1
        ]
      : null;


  /*
   * -------------------------------------------------------
   * FAST EXIT
   * -------------------------------------------------------
   *
   * Draft status changes do not affect player rounds.
   * If the rows and league size are unchanged, there is
   * nothing to recalculate.
   */

  if (
    !force &&
    roundMarkerCache.leagueSize ===
      LEAGUE_SIZE &&
    roundMarkerCache.rowCount ===
      rows.length &&
    roundMarkerCache.firstRow ===
      firstRow &&
    roundMarkerCache.lastRow ===
      lastRow
  ) {

    return;

  }


  roundMarkerCache.leagueSize =
    LEAGUE_SIZE;

  roundMarkerCache.rowCount =
    rows.length;

  roundMarkerCache.firstRow =
    firstRow;

  roundMarkerCache.lastRow =
    lastRow;


  rows.forEach(function(row) {

    var rkCell =
      row.children[0];


    if (!rkCell) {

      return;

    }


    /*
     * Use textContent instead of innerText.
     *
     * innerText can trigger expensive layout calculations.
     */

    var rawRank =
      rkCell.textContent ||
      '';


    var rk =
      parseInt(
        rawRank
          .replace(
            /Rd\d+/g,
            ''
          )
          .trim(),
        10
      );


    if (!rk) {

      return;

    }


    var round =
      Math.ceil(
        rk / LEAGUE_SIZE
      );

    /*
 * Players ranked beyond the league's actual
 * draft length are depth/watch-list players,
 * not a real draft round.
 */
if (round > TOTAL_ROUNDS) {

  var oldTag =
    rkCell.querySelector(
      '.round-tag'
    );

  if (oldTag) {
    oldTag.remove();
  }

  delete rkCell.dataset.roundMarker;

  return;
}

    /*
     * Store the current round on the cell so we avoid
     * rewriting the DOM if nothing changed.
     */

    if (
      Number(
        rkCell.dataset.roundMarker
      ) === round
    ) {

      return;

    }


    var existing =
      rkCell.querySelector(
        '.round-tag'
      );


    if (!existing) {

      existing =
        document.createElement(
          'div'
        );

      existing.className =
        'round-tag';


      rkCell.appendChild(
        existing
      );

    }


    existing.textContent =
      'Rd' + round;


    rkCell.dataset.roundMarker =
      String(round);

  });

}

function setupSearchUI() {
  var searchInput = document.getElementById('searchBox');
  if (!searchInput) return;

  var parent = searchInput.parentElement;
  var container;
  
  if (!parent.classList.contains('dynamic-search-wrapper')) {
    container = document.createElement('div');
    container.className = 'dynamic-search-wrapper';
    parent.insertBefore(container, searchInput);
    container.appendChild(searchInput);
  } else {
    container = parent;
  }

  if (!document.getElementById('searchMatchCount')) {
    var countSpan = document.createElement('span');
    countSpan.id = 'searchMatchCount';
    countSpan.innerText = '0/0';
    container.appendChild(countSpan);
  }

  if (!document.getElementById('searchPrevBtn')) {
    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.id = 'searchPrevBtn';
    prevBtn.className = 'dyn-navbtn';
    prevBtn.innerHTML = '&#9650;';
    prevBtn.disabled = true;
    prevBtn.onclick = function() { navigateSearch(-1); };
    container.appendChild(prevBtn);
  }

  if (!document.getElementById('searchNextBtn')) {
    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.id = 'searchNextBtn';
    nextBtn.className = 'dyn-navbtn';
    nextBtn.innerHTML = '&#9660;';
    nextBtn.disabled = true;
    nextBtn.onclick = function() { navigateSearch(1); };
    container.appendChild(nextBtn);
  }

  searchInput.oninput = applyFilters;
}

function applyFilters() {
  var searchInput = document.getElementById('searchBox');
  var countEl = document.getElementById('searchMatchCount');
  var prevBtn = document.getElementById('searchPrevBtn');
  var nextBtn = document.getElementById('searchNextBtn');

  document.querySelectorAll('tr.draftrow').forEach(function(row) {
    row.classList.remove('search-highlight');
    var pos = row.getAttribute('data-pos');
    var matchesPos = (typeof currentPosFilter === 'undefined' || currentPosFilter === 'ALL' || pos === currentPosFilter);
    if (matchesPos) {
      row.classList.remove('hidden-row');
    } else {
      row.classList.add('hidden-row');
    }
  });

  searchMatches = [];
  currentSearchIndex = -1;

  if (!searchInput) return;
  var q = searchInput.value.toLowerCase().trim();

  if (q.length < 2) {
    if (countEl) countEl.innerText = '0/0';
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    updateTierFilterExpansion('');
    updateNextPickMarker();
    refreshDraftRowAccessibility();
    return;
  }

  var rows = document.querySelectorAll('tr.draftrow:not(.hidden-row)');
  rows.forEach(function(row) {
    var name = (row.getAttribute('data-name') || row.innerText || '').toLowerCase();
    if (name.indexOf(q) !== -1) {
      searchMatches.push(row);
    }
  });

  if (searchMatches.length > 0) {
    currentSearchIndex = 0;
    if (countEl) countEl.innerText = '1/' + searchMatches.length;
    if (prevBtn) prevBtn.disabled = (searchMatches.length <= 1);
    if (nextBtn) nextBtn.disabled = (searchMatches.length <= 1);
    scrollToCurrentMatch();
  } else {
    if (countEl) countEl.innerText = '0/0';
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
  }

  updateTierFilterExpansion(q);
  updateNextPickMarker();
  refreshDraftRowAccessibility(searchMatches[0] || null);
}

function navigateSearch(direction) {
  if (searchMatches.length <= 1) return;

  currentSearchIndex = (currentSearchIndex + direction + searchMatches.length) % searchMatches.length;

  var countEl = document.getElementById('searchMatchCount');
  if (countEl) {
    countEl.innerText = (currentSearchIndex + 1) + '/' + searchMatches.length;
  }

  scrollToCurrentMatch();
}

function scrollToCurrentMatch() {
  if (currentSearchIndex < 0 || currentSearchIndex >= searchMatches.length) return;

  var targetRow = searchMatches[currentSearchIndex];
  if (!targetRow || !document.body.contains(targetRow)) {
    searchMatches.splice(currentSearchIndex, 1);
    if (searchMatches.length === 0) {
      currentSearchIndex = -1;
      return;
    }
    currentSearchIndex = currentSearchIndex % searchMatches.length;
    targetRow = searchMatches[currentSearchIndex];
  }

  if (!targetRow) return;

  searchMatches.forEach(function(row) {
    row.classList.remove('search-highlight');
  });

  var headerOffset = 130;
  var elementPosition = targetRow.getBoundingClientRect().top + window.pageYOffset;
  var offsetPosition = elementPosition - headerOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });

  targetRow.classList.add('search-highlight');
  setTimeout(function() {
    targetRow.classList.remove('search-highlight');
  }, 2500);
}

// ==== INITIALIZATION RUNNER ====
function initApp() {

  setupSearchUI();
  updateDataFreshnessIndicator();

  var draftSettingsDetails = document.getElementById('draft-settings-details');
  if (draftSettingsDetails) {
    draftSettingsDetails.open = !window.matchMedia('(max-width: 768px)').matches;
  }

  var boardPressureDetails = document.getElementById('board-pressure-details');
  if (boardPressureDetails) {
    boardPressureDetails.open = !window.matchMedia('(max-width: 768px)').matches;
  }

  ['pcTeams', 'pcSlot', 'pcRounds'].forEach(function(id) {
    var el = document.getElementById(id);

    if (el) {
      el.addEventListener('change', updatePickSettings);
      el.addEventListener('input', updatePickSettings);
    }
  });


  /*
   * Build the authoritative 2026 expert board
   * BEFORE restoring saved draft state.
   */
  build2026ExpertBoardStructure();

  initializeTierSectionOrganization();
  setupDraftBoardInteractions();
  setupDraftMarkModeShortcut();
  initializeDraftSessions();


  /*
   * Restore league settings and drafted/taken
   * state onto the rebuilt board.
   */
  loadState();
  renderAutoDraftTeamToggles();
  refreshDraftRowAccessibility();

}

function runAppInitialization() {

  try {
    initApp();
  } catch (err) {
    console.error(
      'Initialization failed inside initApp():',
      err
    );
  }

}


/*
 * Run initialization whether this script loads
 * before or after DOMContentLoaded.
 */
// Startup trigger intentionally deferred to script.js after all production modules load.
