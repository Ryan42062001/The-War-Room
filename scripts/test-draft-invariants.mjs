import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const {chromium} = createRequire(import.meta.url)('playwright');

const PLAYER_UNIVERSE = 717;
const SEED_10X16 = 0x54201016;
const SEED_14X16 = 0x54201416;
const SEED_ESPN = 0x5420e5a1;
const SEED_2X5 = 0x54200205;
const SEED_20X30 = 0x54202030;

function hash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const server = process.env.WAR_ROOM_URL ? null : http.createServer((request, response) => {
  const relative = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\//, '');
  fs.readFile(path.join(root, relative), (error, data) => {
    response.statusCode = error ? 404 : 200;
    response.end(error ? 'not found' : data);
  });
});
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const appUrl = process.env.WAR_ROOM_URL || `http://127.0.0.1:${server.address().port}/`;

function mulberry32(seed) {
  let value = seed >>> 0;
  return function next() {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(values, seed) {
  const result = values.slice();
  const random = mulberry32(seed);
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function snakeTeamForPick(pick, teams) {
  const round = Math.ceil(pick / teams);
  const index = (pick - 1) % teams;
  return round % 2 === 1 ? index + 1 : teams - index;
}

function operationType(index, random) {
  if (index === 0) return 'POSITION_TIER_CARD';
  if (index === 1) return 'DIRECT_AUTHORITATIVE';
  if (index === 2) return 'ROW_TOGGLE';
  const value = random();
  if (value < 0.16) return 'POSITION_TIER_CARD';
  if (value < 0.33) return 'DIRECT_AUTHORITATIVE';
  return 'ROW_TOGGLE';
}

function failInvariant({seed, operation, operationType: type, player, pick, violation, state}) {
  const error = new Error([
    'Deterministic draft invariant failure',
    `seed=${seed}`,
    `operation=${operation}`,
    `operationType=${type}`,
    `player=${player || 'n/a'}`,
    `pick=${pick == null ? 'n/a' : pick}`,
    `invariant=${violation}`,
    `state=${JSON.stringify(state)}`
  ].join('\n'));
  error.name = 'DraftInvariantFailure';
  throw error;
}

async function createDraftPage(browser, teams, rounds, draftSlot, {localOnly=false} = {}) {
  const context = await browser.newContext();
  const unexpectedRequests = [];
  if (localOnly) {
    const allowed = new URL(appUrl);
    assert.equal(allowed.protocol, 'http:', 'WR-135 boundary scenarios require a local HTTP server');
    assert.ok(['127.0.0.1', 'localhost'].includes(allowed.hostname),
      'WR-135 boundary scenarios cannot use a remote test page');
    await context.route('**/*', async route => {
      const requestUrl = route.request().url();
      let authorized = false;
      try { authorized = new URL(requestUrl).origin === allowed.origin; } catch {}
      if (!authorized) {
        let label = 'invalid-url';
        try {
          const parsed = new URL(requestUrl);
          label = parsed.protocol + '//' + parsed.hostname;
        } catch {}
        unexpectedRequests.push(label);
        await route.abort();
        return;
      }
      await route.continue();
    });
  }
  const page = await context.newPage({viewport:{width:1280,height:900}});
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(appUrl, {waitUntil:'load'});
  await page.waitForSelector('tr.draftrow', {state:'attached'});
  await page.waitForSelector('.position-player-card', {state:'attached'});
  await page.waitForSelector('.recommendation-card', {state:'attached'});

  await page.evaluate(({teams, rounds, draftSlot}) => {
    document.querySelectorAll('tr.draftrow').forEach(row => {
      row.classList.remove('drafted-mine', 'drafted-other');
      row.removeAttribute('data-pick');
      row.removeAttribute('data-team-slot');
      row.removeAttribute('data-team-id');
      row.removeAttribute('data-sync-method');
      row.removeAttribute('data-sync-source');
      row.removeAttribute('data-espn-player-id');
    });
    const teamsField = document.getElementById('pcTeams');
    const roundsField = document.getElementById('pcRounds');
    const slotField = document.getElementById('pcSlot');
    if (teamsField) teamsField.value = String(teams);
    if (roundsField) roundsField.value = String(rounds);
    if (slotField) {
      slotField.max = String(teams);
      slotField.value = String(draftSlot);
    }
    LEAGUE_SIZE = teams;
    TOTAL_ROUNDS = rounds;
    MY_DRAFT_SLOT = draftSlot;
    if (typeof triggerAllBoardUpdates === 'function') triggerAllBoardUpdates({deferIntelligence:true});
    if (typeof updatePositionTierBoard === 'function') updatePositionTierBoard();
  }, {teams, rounds, draftSlot});

  return {context, page, errors, unexpectedRequests};
}

async function getPlayerNames(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('tr.draftrow')).map(row => row.getAttribute('data-name')));
}

async function captureAuthoritativeState(page) {
  return page.evaluate(() => ({
    settings: {
      teams:Number(document.getElementById('pcTeams')?.value || 0),
      rounds:Number(document.getElementById('pcRounds')?.value || 0),
      slot:Number(document.getElementById('pcSlot')?.value || 0)
    },
    completed:typeof getCompletedDraftPickCount === 'function' ? getCompletedDraftPickCount() : -1,
    rows:Array.from(document.querySelectorAll('tr.draftrow')).map(row => ({
      name:row.getAttribute('data-name'),
      status:row.classList.contains('drafted-mine') ? 'mine' : row.classList.contains('drafted-other') ? 'taken' : 'available',
      pick:row.getAttribute('data-pick'),
      teamSlot:row.getAttribute('data-team-slot'),
      source:row.getAttribute('data-sync-source'),
      espnPlayerId:row.getAttribute('data-espn-player-id')
    })).sort((left, right) => String(left.name).localeCompare(String(right.name)))
  }));
}

async function applyOperation(page, {player, pick, teamSlot, draftSlot, type}) {
  return page.evaluate(({player, pick, teamSlot, draftSlot, type}) => {
    const row = findDraftRowByExpertName(player);
    if (!row) return {ok:false, violation:'operation player row missing', state:{player, pick}};
    const mine = Number(teamSlot) === Number(draftSlot);
    const desired = mine ? 'mine' : 'taken';

    if (type === 'POSITION_TIER_CARD') {
      setBoardView('position', {persist:false});
      setDraftMarkMode(desired);
      const entry = positionBoardCardByKey.get(getPositionBoardRowKey(row));
      if (!entry || !entry.card) return {ok:false, violation:'position-tier proxy card missing', state:{player, pick}};
      entry.card.click();
    } else if (type === 'DIRECT_AUTHORITATIVE') {
      row.classList.remove('drafted-mine', 'drafted-other');
      row.classList.add(mine ? 'drafted-mine' : 'drafted-other');
      assignManualDraftMetadata(row, mine);
      if (typeof updateDraftRowAccessibility === 'function') updateDraftRowAccessibility(row);
      if (typeof triggerAllBoardUpdates === 'function') triggerAllBoardUpdates({deferIntelligence:true});
      if (typeof scheduleSave === 'function') scheduleSave();
    } else {
      setDraftMarkMode(desired);
      toggleDraft(row);
    }

    const status = getDraftRowStatus(row);
    const actualPick = Number(row.getAttribute('data-pick'));
    if (status !== desired) return {ok:false, violation:'operation produced wrong row status', state:{player, desired, status, actualPick}};
    if (actualPick !== pick) return {ok:false, violation:'operation assigned wrong pick number', state:{player, expectedPick:pick, actualPick, status}};
    return {ok:true};
  }, {player, pick, teamSlot, draftSlot, type});
}

async function assertInvariants(page, {seed, operation, type, player, pick, previousCompleted, expensive}) {
  const result = await page.evaluate(({previousCompleted, expensive}) => {
    const rows = Array.from(document.querySelectorAll('tr.draftrow'));
    const rowStatus = row => row.classList.contains('drafted-mine') ? 'mine' : row.classList.contains('drafted-other') ? 'taken' : 'available';
    const drafted = rows.filter(row => rowStatus(row) !== 'available');
    const available = rows.length - drafted.length;
    const completed = getCompletedDraftPickCount();
    const draftState = getDraftAssistantState();
    const minimal = () => ({
      rows:rows.length,
      available,
      drafted:drafted.length,
      completed,
      currentPick:draftState.currentPick,
      mine:drafted.filter(row => rowStatus(row) === 'mine').length,
      taken:drafted.filter(row => rowStatus(row) === 'taken').length,
      boardView:document.body.getAttribute('data-board-view'),
      recent:drafted.slice(-5).map(row => ({name:row.getAttribute('data-name'), status:rowStatus(row), pick:row.getAttribute('data-pick')}))
    });
    const violation = (name, detail) => ({ok:false, violation:name, state:Object.assign(minimal(), detail || {})});

    if (rows.length !== 717) return violation('player universe row count changed');
    if (available + drafted.length !== 717) return violation('available + drafted != 717');

    const both = rows.find(row => row.classList.contains('drafted-mine') && row.classList.contains('drafted-other'));
    if (both) return violation('Mine/Taken mutual exclusivity', {offender:both.getAttribute('data-name')});

    const names = new Set();
    const picks = new Set();
    for (const row of drafted) {
      const canonical = typeof canonicalExpertPlayerName === 'function'
        ? canonicalExpertPlayerName(row.getAttribute('data-name'))
        : String(row.getAttribute('data-name') || '').toLowerCase();
      const pickValue = row.getAttribute('data-pick');
      if (names.has(canonical)) return violation('drafted player uniqueness', {duplicatePlayer:canonical});
      names.add(canonical);
      if (!pickValue) return violation('drafted row missing pick metadata', {offender:row.getAttribute('data-name')});
      if (picks.has(pickValue)) return violation('draft pick uniqueness', {duplicatePick:pickValue});
      picks.add(pickValue);
    }

    if (completed < previousCompleted) return violation('draft progress moved backward', {previousCompleted});
    if (completed !== drafted.length) return violation('completed-pick count disagrees with drafted rows');
    if (completed > 0 && draftState.currentPick < Math.min(completed, draftState.totalPicks)) {
      return violation('current-pick state moved backward', {totalPicks:draftState.totalPicks});
    }

    if (typeof updatePositionTierBoard === 'function') updatePositionTierBoard();
    if (!positionBoardCardByKey || positionBoardCardByKey.size !== rows.length) {
      return violation('Position Tiers card universe mismatch', {cards:positionBoardCardByKey && positionBoardCardByKey.size});
    }
    for (const row of rows) {
      const entry = positionBoardCardByKey.get(getPositionBoardRowKey(row));
      const expected = rowStatus(row);
      const actual = entry && entry.card && entry.card.getAttribute('data-status');
      if (actual !== expected) return violation('Position Tiers status disagrees with authoritative row', {offender:row.getAttribute('data-name'), expected, actual});
    }

    for (const block of document.querySelectorAll('.position-tier-block')) {
      const cards = Array.from(block.querySelectorAll('.position-player-card'));
      const actualAvailable = cards.filter(card => card.getAttribute('data-status') === 'available').length;
      const reportedAvailable = Number(block.getAttribute('data-available'));
      if (reportedAvailable !== actualAvailable) {
        return violation('tier availability count disagrees with live cards', {
          position:block.closest('.position-column')?.getAttribute('data-position'),
          reportedAvailable,
          actualAvailable
        });
      }
    }

    if (expensive) {
      const debugState = buildLiveDraftDebugState();
      const candidates = Array.isArray(debugState && debugState.scored) ? debugState.scored.slice(0, 12) : [];
      if (!candidates.length && completed < draftState.totalPicks) return violation('recommendation candidates unexpectedly empty');
      for (const candidate of candidates) {
        const candidateRow = findDraftRowByExpertName(candidate.name);
        if (!candidateRow || rowStatus(candidateRow) !== 'available' || candidate.available === false) {
          return violation('recommended candidate is not currently available', {candidate:candidate.name, candidateStatus:candidateRow && rowStatus(candidateRow)});
        }
        const scoreEntries = Object.entries(candidate).filter(([key, value]) => /score$/i.test(key) && value != null);
        if (!scoreEntries.length) return violation('recommendation candidate exposes no score fields', {candidate:candidate.name});
        const invalidScore = scoreEntries.find(([, value]) => !Number.isFinite(Number(value)));
        if (invalidScore) return violation('recommendation candidate has non-finite score', {candidate:candidate.name, score:invalidScore[0], value:invalidScore[1]});
        if (!Number.isFinite(Number(candidate.finalScore))) return violation('recommendation candidate finalScore is non-finite', {candidate:candidate.name, finalScore:candidate.finalScore});
      }
    }

    return {ok:true, completed, currentPick:draftState.currentPick};
  }, {previousCompleted, expensive});

  if (!result.ok) failInvariant({seed, operation, operationType:type, player, pick, violation:result.violation, state:result.state});
  return result;
}

async function assertViewIndependence(page, meta) {
  const before = await captureAuthoritativeState(page);
  await page.evaluate(() => {
    setBoardView('position', {persist:false});
    setBoardView('overall', {persist:false});
    setPosFilter('WR', document.querySelector('.filterbtn[data-pos="WR"]'));
    setBoardView('position', {persist:false});
    setPosFilter('ALL', document.querySelector('.filterbtn[data-pos="ALL"]'));
  });
  const after = await captureAuthoritativeState(page);
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    failInvariant({...meta, violation:'view changes mutated authoritative draft state', state:{before, after}});
  }
}

async function assertPersistenceEquivalent(page, meta) {
  const saved = await page.evaluate(() => saveState());
  if (!saved) failInvariant({...meta, violation:'persistence checkpoint could not save state', state:{}});
  const before = await captureAuthoritativeState(page);
  await page.reload({waitUntil:'load'});
  await page.waitForSelector('tr.draftrow', {state:'attached'});
  await page.waitForSelector('.position-player-card', {state:'attached'});
  const after = await captureAuthoritativeState(page);
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    failInvariant({...meta, violation:'persistence reload changed meaningful draft state', state:{before, after}});
  }
}

// WR-135: independent, per-pick boundary oracle over the REAL app's rendered
// numbered rows and draft-state/completion interfaces. This is not another
// draft engine or a synthetic replacement for the application's pick logic.
async function assertBoundaryLedger(page, {label, seed, teams, rounds, draftSlot, plan, pick, phase}) {
  const total = teams * rounds;
  const observed = await page.evaluate(() => {
    const state = getDraftAssistantState();
    const completion = getDraftCompletionStatus(state);
    const rows = Array.from(document.querySelectorAll('tr.draftrow'));
    const drafted = rows.filter(row =>
      row.classList.contains('drafted-mine') || row.classList.contains('drafted-other')
    ).map(row => ({
      pick:Number(row.getAttribute('data-pick')),
      name:String(row.getAttribute('data-name') || ''),
      slot:Number(row.getAttribute('data-team-slot')),
      status:row.classList.contains('drafted-mine') ? 'mine' : 'taken'
    })).sort((left,right) => left.pick - right.pick);
    return {
      rows:drafted,
      boardRows:rows.length,
      available:rows.length - drafted.length,
      completed:getCompletedDraftPickCount(),
      settings:{
        teams:state.teams, rounds:state.rounds, draftSlot:state.draftSlot,
        totalPicks:state.totalPicks
      },
      controls:{
        teams:Number(document.getElementById('pcTeams')?.value),
        rounds:Number(document.getElementById('pcRounds')?.value),
        draftSlot:Number(document.getElementById('pcSlot')?.value)
      },
      currentPick:state.currentPick,
      nextPick:state.myNextPick,
      picksUntilMyTurn:state.picksUntilMyTurn,
      onClock:state.onClock,
      completion:{
        complete:Boolean(completion.complete),
        authoritative:Boolean(completion.authoritative),
        provisional:Boolean(completion.provisional),
        myRosterCount:Number(completion.myRosterCount)
      },
      externalCount:window.WarRoomEspnExternalPicks
        ? window.WarRoomEspnExternalPicks.getAll().length : 0
    };
  });
  const expected = plan.slice(0, pick).map((name, index) => {
    const numberedPick = index + 1;
    const slot = snakeTeamForPick(numberedPick, teams);
    return {pick:numberedPick, name, slot, status:slot === draftSlot ? 'mine' : 'taken'};
  });
  const meta = {
    seed, operation:pick, operationType:'BOUNDARY_' + phase, player:plan[pick - 1] || null, pick
  };
  const validate = (condition, violation, detail={}) => {
    if (!condition) failInvariant({
      ...meta, violation, state:{
        label, phase, teams, rounds, draftSlot, expectedCount:pick,
        expectedLedgerDigest:hash(expected), observedLedgerDigest:hash(observed.rows),
        observedCompleted:observed.completed, observedSettings:observed.settings,
        observedCompletion:observed.completion, ...detail
      }
    });
  };
  validate(observed.boardRows === PLAYER_UNIVERSE, 'boundary board row universe changed', {rows:observed.boardRows});
  validate(observed.available === PLAYER_UNIVERSE - pick,
    'boundary available-player count incorrect', {available:observed.available});
  validate(observed.completed === pick && observed.rows.length === pick,
    'boundary monotonic progress/count incorrect', {actualCount:observed.rows.length});
  validate(JSON.stringify(observed.settings) === JSON.stringify({
    teams, rounds, draftSlot, totalPicks:total
  }), 'boundary real draft-state settings incorrect');
  validate(JSON.stringify(observed.controls) === JSON.stringify({teams, rounds, draftSlot}),
    'boundary visible control settings incorrect', {controls:observed.controls});
  validate(observed.externalCount === 0,
    'boundary manual draft must not acquire synthetic external-pick entries',
    {externalCount:observed.externalCount});
  const seenNames = new Set(observed.rows.map(item => item.name));
  const seenNumbers = new Set(observed.rows.map(item => item.pick));
  validate(seenNames.size === pick && seenNumbers.size === pick,
    'boundary player identities or pick numbers duplicated',
    {names:seenNames.size, numbers:seenNumbers.size});
  const mismatch = expected.findIndex((item, index) =>
    JSON.stringify(item) !== JSON.stringify(observed.rows[index])
  );
  validate(mismatch < 0,
    'boundary numbered ledger/independent snake team/Mine-Taken ownership mismatch',
    {firstMismatchPick:mismatch + 1, expected:expected[mismatch] || null,
      actual:observed.rows[mismatch] || null});
  const mine = expected.filter(item => item.status === 'mine').length;
  const nextCurrent = Math.min(pick + 1, total);
  const nextOwnPick = pick === total ? null : Array.from({length:rounds}, (_, index) => {
    const round = index + 1;
    return index * teams + (round % 2 === 1 ? draftSlot : teams - draftSlot + 1);
  }).find(number => number >= nextCurrent) ?? null;
  validate(observed.completion.myRosterCount === mine,
    'boundary actual owned roster count incorrect', {expectedMine:mine});
  validate(observed.currentPick === nextCurrent,
    'boundary current pick incorrect', {expectedCurrent:nextCurrent, actual:observed.currentPick});
  validate(observed.nextPick === nextOwnPick,
    'boundary next-turn state incorrect, including no-next-pick at terminal',
    {expectedNextPick:nextOwnPick, actualNextPick:observed.nextPick});
  validate(observed.picksUntilMyTurn === (nextOwnPick === null ? null : nextOwnPick - nextCurrent),
    'boundary picks-until-own-turn incorrect', {nextOwnPick,
      actualPicksUntil:observed.picksUntilMyTurn});
  validate(observed.onClock === (nextOwnPick !== null && nextOwnPick === nextCurrent),
    'boundary on-clock state incorrect', {actualOnClock:observed.onClock});
  validate(observed.completion.authoritative === (pick === total) &&
    observed.completion.complete === (pick === total) &&
    !observed.completion.provisional,
    'boundary N-1/terminal completion truth incorrect',
    {terminal:pick === total});
  validate(observed.rows.every(item => item.pick <= total),
    'boundary beyond-N row present');
  return {
    label, phase, seed, teams, rounds, draftSlot, totalPicks:total, count:pick,
    mine, taken:pick - mine, available:observed.available,
    fixtureDigest:hash(plan.slice(0,pick).map((name,index)=>[index+1,name])),
    expectedLedgerDigest:hash(expected), actualLedgerDigest:hash(observed.rows),
    ownershipDigest:hash(observed.rows.map(item=>[item.pick,item.slot,item.status])),
    currentPick:observed.currentPick, nextPick:observed.nextPick,
    authoritative:observed.completion.authoritative
  };
}

async function runFullDraftScenario(browser, {label, teams, rounds, draftSlot, seed, expensiveEvery, persistencePicks, viewPicks, boundary=false}) {
  const scenarioStartedAt = performance.now();
  const {context, page, errors, unexpectedRequests} =
    await createDraftPage(browser, teams, rounds, draftSlot, {localOnly:boundary});
  if (boundary) {
    const actual = await page.evaluate(({teams, rounds, draftSlot}) =>
      WarRoomCommandBarFixes.applySettings({teams, rounds, slot:draftSlot}, false),
      {teams, rounds, draftSlot}
    );
    assert.deepEqual(actual, {teams, rounds, slot:draftSlot},
      label + ': real canonical settings must accept exact supported boundary');
  }
  const names = await getPlayerNames(page);
  assert.equal(names.length, PLAYER_UNIVERSE, `${label}: player universe`);
  const plan = shuffled(names, seed).slice(0, teams * rounds);
  if (boundary) {
    assert.equal(plan.length, teams * rounds, label + ': complete boundary plan length');
    assert.equal(new Set(plan).size, teams * rounds,
      label + ': every planned player must be a different committed local board row');
  }
  const random = mulberry32(seed ^ 0xa5a5a5a5);
  const checkpoints = [];
  const significantPicks = new Set(boundary
    ? [persistencePicks[0], teams * rounds - 1, teams * rounds]
    : []);
  let previousCompleted = 0;
  const operationCounts = {ROW_TOGGLE:0, POSITION_TIER_CARD:0, DIRECT_AUTHORITATIVE:0};

  for (let index = 0; index < plan.length; index++) {
    const pick = index + 1;
    const player = plan[index];
    const teamSlot = snakeTeamForPick(pick, teams);
    const type = operationType(index, random);
    operationCounts[type]++;
    const meta = {seed, operation:pick, operationType:type, type, player, pick};

    const applied = await applyOperation(page, {player, pick, teamSlot, draftSlot, type});
    if (!applied.ok) failInvariant({...meta, violation:applied.violation, state:applied.state});

    const invariant = await assertInvariants(page, {
      seed,
      operation:pick,
      type,
      player,
      pick,
      previousCompleted,
      expensive:expensiveEvery === 1 || pick % expensiveEvery === 0 || pick === plan.length
    });
    previousCompleted = invariant.completed;
    if (boundary) {
      const observed = await assertBoundaryLedger(page, {
        label, seed, teams, rounds, draftSlot, plan, pick, phase:'live'
      });
      if (significantPicks.has(pick)) {
        checkpoints.push(observed);
        console.log('WR135_BOUNDARY_CHECKPOINT ' + JSON.stringify(observed));
      }
    }

    if (viewPicks.includes(pick)) await assertViewIndependence(page, meta);
    if (persistencePicks.includes(pick)) {
      await assertPersistenceEquivalent(page, meta);
      const afterReload = await assertInvariants(page, {
        seed,
        operation:pick,
        type:'PERSISTENCE_RELOAD',
        player,
        pick,
        previousCompleted,
        expensive:true
      });
      previousCompleted = afterReload.completed;
      if (boundary) {
        const restored = await assertBoundaryLedger(page, {
          label, seed, teams, rounds, draftSlot, plan, pick, phase:'intermediate-reload'
        });
        checkpoints.push(restored);
        console.log('WR135_BOUNDARY_CHECKPOINT ' + JSON.stringify(restored));
      }
    }
  }

  if (boundary) {
    await assertPersistenceEquivalent(page, {
      seed, operation:teams*rounds, operationType:'TERMINAL_PERSISTENCE_RELOAD',
      player:plan.at(-1), pick:teams*rounds
    });
    const terminalReload = await assertBoundaryLedger(page, {
      label, seed, teams, rounds, draftSlot, plan,
      pick:teams*rounds, phase:'terminal-reload'
    });
    checkpoints.push(terminalReload);
    console.log('WR135_BOUNDARY_CHECKPOINT ' + JSON.stringify(terminalReload));
    assert.deepEqual(unexpectedRequests, [], label + ': unexpected external network requests');
  }

  const final = await captureAuthoritativeState(page);
  assert.equal(final.completed, teams * rounds, `${label}: full draft must complete`);
  assert.deepEqual(errors, [], `${label}: browser errors\n${errors.join('\n')}`);
  await context.close();
  return {
    label, seed, teams, rounds, draftSlot, picks:teams * rounds, operationCounts,
    ...(boundary ? {
      expectedMine:rounds, expectedTaken:teams*rounds-rounds,
      plannedUniquePlayers:new Set(plan).size,
      unexpectedExternalRequests:unexpectedRequests.length,
      checkpoints,
      runtimeMs:Number((performance.now()-scenarioStartedAt).toFixed(1))
    } : {})
  };
}

async function assertEspnSegment(browser, playerNames) {
  const {context, page, errors} = await createDraftPage(browser, 10, 16, 7);
  const pool = shuffled(playerNames, SEED_ESPN);
  const first40 = pool.slice(0, 40);
  const replacement = pool[45];
  const buildPicks = names => names.map((playerName, index) => ({
    overallPick:index + 1,
    playerName,
    position:null,
    teamSlot:snakeTeamForPick(index + 1, 10),
    isMine:snakeTeamForPick(index + 1, 10) === 7,
    method:'test',
    espnPlayerId:`invariant-${index + 1}`
  }));
  const initial = {
    config:{teams:10, rounds:16, draftSlot:7},
    expectedCompleted:40,
    picks:buildPicks(first40)
  };

  const apply = snapshot => page.evaluate(snapshot => applyEspnDraftSnapshot(snapshot), snapshot);
  await apply(initial);
  const afterFirst = await captureAuthoritativeState(page);
  await assertInvariants(page, {seed:SEED_ESPN, operation:1, type:'ESPN_INITIAL', player:null, pick:40, previousCompleted:0, expensive:true});

  await apply(initial);
  const afterDuplicate = await captureAuthoritativeState(page);
  if (JSON.stringify(afterFirst) !== JSON.stringify(afterDuplicate)) {
    failInvariant({seed:SEED_ESPN, operation:2, operationType:'ESPN_DUPLICATE', player:null, pick:40, violation:'same ESPN snapshot was not idempotent', state:{afterFirst, afterDuplicate}});
  }

  const stale = {
    config:{teams:10, rounds:16, draftSlot:7},
    expectedCompleted:35,
    picks:buildPicks(first40.slice(0, 35))
  };
  await apply(stale);
  const afterStale = await captureAuthoritativeState(page);
  if (JSON.stringify(afterFirst) !== JSON.stringify(afterStale)) {
    failInvariant({seed:SEED_ESPN, operation:3, operationType:'ESPN_STALE', player:null, pick:35, violation:'smaller ESPN snapshot regressed authoritative progress', state:{beforeCompleted:afterFirst.completed, afterCompleted:afterStale.completed}});
  }

  const correctedNames = first40.slice();
  const oldPick10 = correctedNames[9];
  correctedNames[9] = replacement;
  const corrected = {
    config:{teams:10, rounds:16, draftSlot:7},
    expectedCompleted:40,
    picks:buildPicks(correctedNames)
  };
  await apply(corrected);
  const correctionState = await page.evaluate(({oldPick10, replacement}) => {
    const oldRow = findDraftRowByExpertName(oldPick10);
    const newRow = findDraftRowByExpertName(replacement);
    return {
      completed:getCompletedDraftPickCount(),
      oldStatus:getDraftRowStatus(oldRow),
      oldPick:oldRow.getAttribute('data-pick'),
      newStatus:getDraftRowStatus(newRow),
      newPick:newRow.getAttribute('data-pick'),
      pick10Rows:Array.from(document.querySelectorAll('tr.draftrow[data-pick="10"]')).map(row => row.getAttribute('data-name'))
    };
  }, {oldPick10, replacement});
  if (correctionState.completed !== 40 || correctionState.oldStatus !== 'available' || correctionState.oldPick !== null || correctionState.newStatus === 'available' || correctionState.newPick !== '10' || correctionState.pick10Rows.length !== 1) {
    failInvariant({seed:SEED_ESPN, operation:4, operationType:'ESPN_CORRECTION', player:replacement, pick:10, violation:'corrected ESPN snapshot did not converge to one valid assignment', state:correctionState});
  }
  await assertInvariants(page, {seed:SEED_ESPN, operation:4, type:'ESPN_CORRECTION', player:replacement, pick:10, previousCompleted:40, expensive:true});

  assert.deepEqual(errors, [], `ESPN segment browser errors\n${errors.join('\n')}`);
  await context.close();
  return {seed:SEED_ESPN, picks:40, oldPick10, replacement};
}

const startedAt = performance.now();
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH});
try {
  const scenarioA = await runFullDraftScenario(browser, {
    label:'10x16', teams:10, rounds:16, draftSlot:7, seed:SEED_10X16,
    expensiveEvery:1,
    persistencePicks:[53, 121],
    viewPicks:[1, 80, 159]
  });
  const scenarioB = await runFullDraftScenario(browser, {
    label:'14x16', teams:14, rounds:16, draftSlot:11, seed:SEED_14X16,
    expensiveEvery:8,
    persistencePicks:[112],
    viewPicks:[1, 113, 223]
  });

  const boundaryMin = await runFullDraftScenario(browser, {
    label:'2x5-slot2', teams:2, rounds:5, draftSlot:2, seed:SEED_2X5,
    expensiveEvery:1,
    persistencePicks:[5],
    viewPicks:[1, 5, 9],
    boundary:true
  });
  const boundaryMax = await runFullDraftScenario(browser, {
    label:'20x30-slot20', teams:20, rounds:30, draftSlot:20, seed:SEED_20X30,
    expensiveEvery:50,
    persistencePicks:[300],
    viewPicks:[1, 300, 599],
    boundary:true
  });

  const referenceContext = await browser.newContext();
  const referencePage = await referenceContext.newPage();
  await referencePage.goto(appUrl, {waitUntil:'load'});
  await referencePage.waitForSelector('tr.draftrow', {state:'attached'});
  const playerNames = await getPlayerNames(referencePage);
  await referenceContext.close();
  const espn = await assertEspnSegment(browser, playerNames);

  const runtimeMs = performance.now() - startedAt;
  console.log('Draft invariant torture harness passed.');
  console.log(JSON.stringify({scenarioA, scenarioB, boundaryMin, boundaryMax, espn,
    runtimeMs:Number(runtimeMs.toFixed(1))}, null, 2));
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
