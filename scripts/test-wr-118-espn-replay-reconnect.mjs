// WR-118: deterministic, synthetic, APP-SIDE ESPN replay/reconnect regression.
// Uses only the existing local browser and WarRoomEspnSync/session interfaces.
// No ESPN request, Companion bridge, ranking-policy oracle or source-data write.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const {chromium} = createRequire(import.meta.url)('playwright');
const SEED = 0x5420118;
const TEAMS = 10;
const ROUNDS = 16;
const SLOT = 7;
const TOTAL = TEAMS * ROUNDS;
const ITERATIONS = 2;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = http.createServer((request, response) => {
  const relative = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\//, '');
  const filePath = path.join(root, relative);
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.statusCode = 404;
      response.end('not found');
      return;
    }
    response.setHeader('Content-Type', ({
      '.html':'text/html; charset=utf-8',
      '.js':'text/javascript; charset=utf-8',
      '.css':'text/css; charset=utf-8',
      '.json':'application/json; charset=utf-8'
    })[path.extname(filePath)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.end(data);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const appUrl = 'http://127.0.0.1:' + server.address().port + '/';

function hash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
// Independent accepted-ledger user-turn oracle; never use state.myNextPick as input.
function expectedUserTurn(acceptedCount) {
  const currentPick = Math.min(acceptedCount + 1, TOTAL);
  const userSlots = Array.from({length:ROUNDS}, (_, round) =>
    round * TEAMS + (round % 2 === 0 ? SLOT : TEAMS - SLOT + 1));
  const nextPick = userSlots.find(pick => pick >= currentPick) ?? null;
  return {
    currentPick, nextPick,
    onClock:nextPick !== null && nextPick === currentPick,
    picksUntilMyTurn:nextPick === null ? null : nextPick - currentPick
  };
}
const fixtureByPage = new WeakMap();

function snakeTeam(pick) {
  const round = Math.ceil(pick / TEAMS);
  const index = (pick - 1) % TEAMS;
  return round % 2 ? index + 1 : TEAMS - index;
}
function shuffle(input) {
  const result = input.slice();
  let seed = SEED >>> 0;
  const random = () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function asPick(player, pick, idSuffix) {
  const teamSlot = snakeTeam(pick);
  return {
    overallPick:pick, playerName:player.name, position:player.position,
    teamSlot, teamId:'team-' + teamSlot, isMine:teamSlot === SLOT,
    method:'dom', espnPlayerId:'wr118-' + String(idSuffix || pick).padStart(3, '0')
  };
}
function snapshot(picks, options = {}) {
  return {
    config:{teams:TEAMS, rounds:ROUNDS, draftSlot:SLOT},
    expectedCompleted:options.expectedCompleted == null ? picks.length : options.expectedCompleted,
    draftComplete:Boolean(options.draftComplete),
    unavailablePlayers:[], marketAdp:[], picks
  };
}
async function save(page) {
  return page.evaluate(() => {
    if (typeof _saveTimer !== 'undefined' && _saveTimer) {
      clearTimeout(_saveTimer);
      _saveTimer = null;
    }
    return saveState();
  });
}
async function inspect(page, indexes) {
  const raw = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr.draftrow'));
    const drafted = rows.filter(row =>
      row.classList.contains('drafted-mine') || row.classList.contains('drafted-other')
    ).map(row => ({
      name:row.getAttribute('data-name'),
      pick:Number(row.getAttribute('data-pick')) || null,
      teamSlot:Number(row.getAttribute('data-team-slot')) || null,
      status:row.classList.contains('drafted-mine') ? 'mine' : 'taken',
      source:row.getAttribute('data-sync-source'),
      espnPlayerId:row.getAttribute('data-espn-player-id')
    }));
    const state = getDraftAssistantState();
    const completion = getDraftCompletionStatus(state);
    const debug = completion.authoritative ? null : buildLiveDraftDebugState();
    const scored = debug && Array.isArray(debug.scored) ? debug.scored : [];
    const candidates = scored.slice(0, 12);
    const eligible = candidates.map(candidate => {
      const row = typeof findDraftRowByExpertName === 'function'
        ? findDraftRowByExpertName(candidate.name) : null;
      const available = Boolean(row && !row.classList.contains('drafted-mine') &&
        !row.classList.contains('drafted-other') && candidate.available !== false);
      const rosterEligible = typeof isRecommendationRosterEligible === 'function' &&
        Boolean(isRecommendationRosterEligible(candidate, debug.context.rosterCounts));
      return {name:candidate.name, available, rosterEligible};
    });
    const active = !completion.complete && !completion.authoritative &&
      completion.myRosterCount < ROUNDS && state.currentPick < state.totalPicks;
    const decision = active && candidates.length &&
      typeof calculateDraftRecommendation === 'function'
      ? calculateDraftRecommendation(candidates[0], scored, debug.context) : null;
    return {
      session:String(window.activeDraftSessionId || ''),
      rows:drafted, completed:getCompletedDraftPickCount(),
      currentPick:state.currentPick, nextPick:state.myNextPick,
      onClock:state.onClock, picksUntilMyTurn:state.picksUntilMyTurn,
      active, candidateCount:scored.length, inspectedCandidateCount:candidates.length,
      primaryName:candidates[0] ? candidates[0].name : null,
      decisionPlayer:decision && decision.player || null,
      decisionAction:decision && decision.recommendation || null,
      decisionAvailable:Boolean(decision && eligible[0] && eligible[0].available &&
        decision.player === eligible[0].name),
      completion:{
        complete:completion.complete, provisional:completion.provisional,
        authoritative:completion.authoritative, externalComplete:completion.externalComplete,
        myRosterCount:completion.myRosterCount
      },
      sourceRows:rows.map(row => [
        row.getAttribute('data-name'), row.getAttribute('data-ecr'),
        row.getAttribute('data-rank'), row.getAttribute('data-adp')
      ]),
      invalidCandidates:eligible.filter(item => !item.available || !item.rosterEligible).length,
      rowCount:rows.length,
      externalCount:window.WarRoomEspnExternalPicks
        ? window.WarRoomEspnExternalPicks.getAll().length : 0
    };
  });
  return {
    session:raw.session,
    rows:raw.rows.map(row => ({
      index:indexes.get(row.name) ?? -1, pick:row.pick,
      teamSlot:row.teamSlot, status:row.status, source:row.source,
      espnPlayerId:row.espnPlayerId
    })).sort((a, b) => a.pick - b.pick || a.index - b.index),
    completed:raw.completed, currentPick:raw.currentPick, nextPick:raw.nextPick,
    onClock:raw.onClock, picksUntilMyTurn:raw.picksUntilMyTurn,
    active:raw.active, candidateCount:raw.candidateCount,
    inspectedCandidateCount:raw.inspectedCandidateCount,
    primaryIndex:indexes.get(raw.primaryName) ?? null,
    decisionPlayerIndex:indexes.get(raw.decisionPlayer) ?? null,
    decisionAction:raw.decisionAction, decisionAvailable:raw.decisionAvailable,
    completion:raw.completion, sourceHash:hash(raw.sourceRows),
    invalidCandidates:raw.invalidCandidates, rowCount:raw.rowCount,
    externalCount:raw.externalCount
  };
}
function expectedRows(picks, indexes) {
  return picks.map(pick => ({
    index:indexes.get(pick.playerName) ?? -1,
    pick:pick.overallPick, teamSlot:pick.teamSlot,
    status:pick.isMine ? 'mine' : 'taken', source:'espn',
    espnPlayerId:pick.espnPlayerId
  })).sort((a, b) => a.pick - b.pick || a.index - b.index);
}
function check(condition, label, state, expected, extra = {}) {
  if (condition) return;
  const expectedRowsValue = expected || [];
  const actualRowsValue = state ? state.rows : null;
  const observationFailed = !state;
  let firstMismatch = null;
  if (!observationFailed) {
    for (let i = 0; i < Math.max(expectedRowsValue.length, actualRowsValue.length); i++) {
      if (JSON.stringify(expectedRowsValue[i]) !== JSON.stringify(actualRowsValue[i])) {
        firstMismatch = {expected:expectedRowsValue[i] || null,
          actual:actualRowsValue[i] || null};
        break;
      }
    }
  }
  const failure = {
    task:'WR-118', seed:SEED, stage:label,
    session:state && state.session || null, pick:extra.pick ?? null,
    expectedLedgerDigest:hash(expectedRowsValue),
    actualLedgerDigest:observationFailed ? null : hash(actualRowsValue),
    expectedCount:expectedRowsValue.length,
    actualCount:observationFailed ? null : actualRowsValue.length,
    firstMismatch, observationError:extra.observationError ||
      (observationFailed ? 'NO_OBSERVED_APP_STATE' : null),
    inputOrder:extra.inputOrder || null,
    observed:state ? {
      completed:state.completed, currentPick:state.currentPick, nextPick:state.nextPick,
      onClock:state.onClock, picksUntilMyTurn:state.picksUntilMyTurn,
      candidateCount:state.candidateCount, inspectedCandidateCount:state.inspectedCandidateCount,
      primaryIndex:state.primaryIndex, decisionPlayerIndex:state.decisionPlayerIndex,
      decisionAction:state.decisionAction, completion:state.completion,
      invalidCandidates:state.invalidCandidates, externalCount:state.externalCount,
      sourceHash:state.sourceHash
    } : null, detail:extra.detail || null
  };
  const error = new Error('Deterministic synthetic app-side invariant failure\n' + JSON.stringify(failure));
  error.name = 'WR118SyntheticInvariantFailure';
  throw error;
}
function assertUserTurn(label, state, expectedLedger) {
  const expected = expectedUserTurn(state.completed);
  check(state.currentPick === expected.currentPick &&
    state.nextPick === expected.nextPick &&
    state.onClock === expected.onClock &&
    state.picksUntilMyTurn === expected.picksUntilMyTurn,
  label + ': independently derived user turn/clock',
  state, expectedLedger, {pick:expected.nextPick, detail:{
    expectedTurn:expected, actualTurn:{
      currentPick:state.currentPick, nextPick:state.nextPick,
      onClock:state.onClock, picksUntilMyTurn:state.picksUntilMyTurn
    }
  }});
}
function assertActiveCandidates(label, state, expectedLedger) {
  const shouldBeActive = state.completed < TOTAL &&
    state.completion.myRosterCount < ROUNDS;
  check(state.active === shouldBeActive &&
    (!shouldBeActive || !state.completion.complete),
  label + ': independently active roster-eligible stage', state, expectedLedger,
  {detail:{shouldBeActive, actualActive:state.active,
    completed:state.completed, myRosterCount:state.completion.myRosterCount,
    completion:state.completion}});
  if (!shouldBeActive) return;
  check(state.candidateCount > 0 &&
    state.inspectedCandidateCount > 0 &&
    state.invalidCandidates === 0 && state.primaryIndex != null &&
    state.decisionPlayerIndex === state.primaryIndex &&
    state.decisionAvailable &&
    typeof state.decisionAction === 'string' && state.decisionAction.length > 0,
  label + ': non-vacuous actual eligible decision candidates',
  state, expectedLedger, {detail:{
    active:state.active, candidateCount:state.candidateCount,
    inspectedCandidateCount:state.inspectedCandidateCount,
    invalidCandidates:state.invalidCandidates,
    primaryIndex:state.primaryIndex, decisionPlayerIndex:state.decisionPlayerIndex,
    decisionAvailable:state.decisionAvailable, decisionAction:state.decisionAction
  }});
}
function assertState(label, state, picks, indexes, baselineSourceHash, extra = {}) {
  const expected = expectedRows(picks, indexes);
  const numbers = state.rows.map(row => row.pick);
  const players = state.rows.map(row => row.index);
  const validLedger = JSON.stringify(state.rows) === JSON.stringify(expected) &&
    state.completed === expected.length && state.rowCount === 717 &&
    state.externalCount === 0 && state.invalidCandidates === 0 &&
    numbers.every((number, i) => number === i + 1) &&
    new Set(numbers).size === numbers.length &&
    new Set(players).size === players.length &&
    players.every(index => index >= 0) &&
    state.currentPick === Math.min(state.completed + 1, TOTAL) &&
    state.sourceHash === baselineSourceHash;
  check(validLedger, label, state, expected, extra);
  assertUserTurn(label, state, expected);
  assertActiveCandidates(label, state, expected);
}
function expectOracleRejection(label, action, expectedMarker) {
  let failure = null;
  try {
    action();
  } catch (error) {
    if (error && error.name === 'WR118SyntheticInvariantFailure') {
      failure = JSON.parse(String(error.message).split('\n').slice(1).join('\n'));
    } else {
      throw error;
    }
  }
  assert.ok(failure && String(failure.stage).includes(expectedMarker),
    label + ': ephemeral bad state must be rejected by the intended oracle');
  console.log('WR118_NEGATIVE_CONTROL ' + JSON.stringify({
    label, rejected:true, stage:failure.stage,
    expectedLedgerDigest:failure.expectedLedgerDigest,
    actualLedgerDigest:failure.actualLedgerDigest,
    session:failure.session, pick:failure.pick,
    observationError:failure.observationError
  }));
  return failure;
}
async function apply(page, label, payload, options = {}) {
  const fixture = fixtureByPage.get(page);
  assert.ok(fixture, label + ': expected synthetic fixture context');
  const expected = expectedRows(options.expectedPicks || payload.picks, fixture.indexes);
  const inputOrder = (payload.picks || []).map(pick => Number(pick.overallPick) || null);
  let result = null;
  let applicationError = null;
  try {
    result = await page.evaluate(value => window.WarRoomEspnSync.applySnapshot(value), payload);
  } catch (error) {
    applicationError = 'APP_APPLY_FAILED: ' + String(error && error.name || 'Error');
  }
  const goodResult = Boolean(result) && !applicationError;
  const goodCounters = goodResult && (options.applied == null || (
    result.applied === options.applied &&
    (result.unmatched || []).length === (options.unmatched || 0) &&
    (options.rejected == null || (result.rejected || 0) === options.rejected)));
  if (!goodCounters) {
    let actual = null;
    let observationError = null;
    try {
      actual = await inspect(page, fixture.indexes);
    } catch (error) {
      observationError = 'APP_INSPECTION_FAILED: ' + String(error && error.name || 'Error');
    }
    check(false, label + (goodResult ? ': reconciliation counters' :
      ': snapshot rejected by app interface'), actual, expected, {
      pick:options.pick ?? (inputOrder.length ? inputOrder[inputOrder.length - 1] : null),
      inputOrder, observationError, detail:{
        applicationError,
        expectedCounters:{applied:options.applied ?? null,
          unmatched:options.unmatched || 0, rejected:options.rejected ?? null},
        actualCounters:goodResult ? {captured:result.captured, applied:result.applied,
          unmatched:(result.unmatched || []).map(item => ({
            pick:item.overallPick, reason:item.reason || 'unresolved'
          })), rejected:result.rejected || 0} : null
      }
    });
  }
  return result;
}
async function reload(page) {
  check(await save(page), 'save before app reload', null, []);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(() =>
    document.querySelectorAll('tr.draftrow').length === 717 &&
    Boolean(window.WarRoomEspnSync && window.WarRoomEspnSync.applySnapshot)
  );
}
async function runScenario(browser, iteration) {
  const context = await browser.newContext({viewport:{width:1280, height:900}});
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    await page.goto(appUrl, {waitUntil:'load'});
    await page.waitForFunction(() =>
      document.querySelectorAll('tr.draftrow').length === 717 &&
      Boolean(window.WarRoomEspnSync && window.WarRoomEspnSync.applySnapshot)
    );
    const setup = await page.evaluate(() => {
      const universe = Array.from(document.querySelectorAll('tr.draftrow')).map(row => ({
        name:row.getAttribute('data-name'), position:row.getAttribute('data-pos')
      }));
      document.getElementById('pcTeams').value = '10';
      document.getElementById('pcSlot').value = '7';
      document.getElementById('pcRounds').value = '16';
      LEAGUE_SIZE = 10; MY_DRAFT_SLOT = 7; TOTAL_ROUNDS = 16;
      triggerAllBoardUpdates({deferIntelligence:true});
      return {universe, session:String(window.activeDraftSessionId || ''), saved:saveState()};
    });
    check(setup.saved && setup.session && setup.universe.length === 717,
      'initial local setup', null, [], {detail:{saved:setup.saved, universe:setup.universe.length}});
    const plan = shuffle(setup.universe);
    const indexes = new Map(plan.map((player, index) => [player.name, index]));
    fixtureByPage.set(page, {indexes});
    const initialState = await inspect(page, indexes);
    const sourceHash = initialState.sourceHash;
    assertState('empty board', initialState, [], indexes, sourceHash);

    const complete = plan.slice(0, TOTAL).map((player, i) => asPick(player, i + 1));
    const first12 = complete.slice(0, 12).map(pick => ({...pick}));
    first12[4] = asPick(plan[170], 5, 'wrong-005');
    const aId = setup.session;
    await apply(page, 'A initial 12', snapshot(first12), {applied:12});
    let a = await inspect(page, indexes);
    assertState('A initial 12 ledger', a, first12, indexes, sourceHash);
    const firstHash = hash(a.rows);
    // F01 controls mutate only ephemeral inspected state, never app rows/storage.
    const openingExpected = expectedRows(first12, indexes);
    expectOracleRejection('active empty candidate list', () =>
      assertActiveCandidates('negative empty candidate', {
        ...a, candidateCount:0, inspectedCandidateCount:0, invalidCandidates:0,
        primaryIndex:null, decisionPlayerIndex:null, decisionAvailable:false
      }, openingExpected), 'non-vacuous actual eligible');
    expectOracleRejection('incorrect nonterminal user next pick', () =>
      assertUserTurn('negative wrong next pick', {...a, nextPick:a.nextPick + 1},
        openingExpected), 'independently derived user turn');
    expectOracleRejection('incorrect nonterminal on-clock', () =>
      assertUserTurn('negative wrong on clock', {...a, onClock:!a.onClock},
        openingExpected), 'independently derived user turn');
    // F02: force a counter failure while a real 12-pick app ledger is inspectable.
    // The deliberately wrong 11-pick model proves meaningful unequal digests.
    let diagnosticControl = null;
    try {
      await apply(page, 'negative diagnostic counter failure', snapshot(first12), {
        applied:11, expectedPicks:first12.slice(0,11), pick:12
      });
    } catch (error) {
      if (error && error.name === 'WR118SyntheticInvariantFailure') {
        diagnosticControl = JSON.parse(String(error.message).split('\n').slice(1).join('\n'));
      } else throw error;
    }
    assert.ok(diagnosticControl && diagnosticControl.session === aId &&
      diagnosticControl.inputOrder.length === 12 && diagnosticControl.pick === 12 &&
      diagnosticControl.expectedCount === 11 && diagnosticControl.actualCount === 12 &&
      diagnosticControl.firstMismatch &&
      diagnosticControl.expectedLedgerDigest !== diagnosticControl.actualLedgerDigest &&
      diagnosticControl.observationError === null,
      'F02 negative counter control must inspect real unequal ledgers and session/order');
    console.log('WR118_NEGATIVE_CONTROL ' + JSON.stringify({
      label:'counter failure diagnostics', rejected:true,
      stage:diagnosticControl.stage, session:diagnosticControl.session,
      pick:diagnosticControl.pick, inputOrder:diagnosticControl.inputOrder,
      expectedLedgerDigest:diagnosticControl.expectedLedgerDigest,
      actualLedgerDigest:diagnosticControl.actualLedgerDigest,
      firstMismatch:diagnosticControl.firstMismatch,
      observationError:diagnosticControl.observationError
    }));
    a = await inspect(page, indexes);
    assertState('A after ephemeral negative controls', a, first12, indexes, sourceHash);

    await apply(page, 'A duplicate identical', snapshot(first12), {applied:12});
    a = await inspect(page, indexes);
    assertState('A duplicate idempotence', a, first12, indexes, sourceHash);
    check(hash(a.rows) === firstHash, 'A duplicate stable digest', a, expectedRows(first12, indexes));

    const reordered = first12.slice().reverse().concat({...first12[2]});
    await apply(page, 'A reordered + duplicate number', snapshot(reordered, {expectedCompleted:12}),
      {applied:12, rejected:1, pick:3, expectedPicks:first12});
    a = await inspect(page, indexes);
    assertState('A permutation convergence', a, first12, indexes, sourceHash);
    check(hash(a.rows) === firstHash, 'A permutation stable digest', a, expectedRows(first12, indexes));

    await apply(page, 'A stale shorter 9', snapshot(first12.slice(0, 9)),
      {applied:12, pick:10, expectedPicks:first12});
    a = await inspect(page, indexes);
    assertState('A stale does not regress', a, first12, indexes, sourceHash);

    const missing = {...complete[12], playerName:'WR118 Unresolved Synthetic Placeholder',
      position:'WR', espnPlayerId:'wr118-unresolved-013'};
    await apply(page, 'A partial 13 with unresolved player',
      snapshot(first12.concat(missing), {expectedCompleted:13}),
      {applied:12, unmatched:1, pick:13, expectedPicks:first12});
    a = await inspect(page, indexes);
    assertState('A unresolved does not invent owner', a, first12, indexes, sourceHash);
    check(a.currentPick === 13, 'A partial next turn remains 13', a, expectedRows(first12, indexes), {pick:13});

    const corrected13 = complete.slice(0, 13);
    await apply(page, 'A full authoritative correction pick 5',
      snapshot(corrected13), {applied:13, pick:5});
    a = await inspect(page, indexes);
    assertState('A corrected 13 unique assignments', a, corrected13, indexes, sourceHash, {pick:5});
    check(!a.rows.some(row => row.index === 170) &&
      a.rows[4].index === 4 && a.rows[4].status === 'taken',
    'A wrong row cleared and replacement owns pick 5', a,
    expectedRows(corrected13, indexes), {pick:5});

    await apply(page, 'A corrected permutation replay',
      snapshot(corrected13.slice().reverse().concat({...corrected13[1]}),
        {expectedCompleted:13}), {applied:13, rejected:1, pick:2, expectedPicks:corrected13});
    a = await inspect(page, indexes);
    assertState('A corrected permutation convergence', a, corrected13, indexes, sourceHash);
    check(await save(page), 'A save before second session', a, expectedRows(corrected13, indexes));
    const a13Hash = hash(a.rows);

    const bId = await page.evaluate(() => createNewDraftSession({
      id:'wr118-isolated-b', name:'WR118 synthetic isolated B'
    }));
    check(Boolean(bId && bId !== aId), 'create independent session B',
      await inspect(page, indexes), [], {detail:{distinct:Boolean(bId !== aId)}});
    let b = await inspect(page, indexes);
    assertState('B empty independent board', b, [], indexes, sourceHash);
    const bPicks = plan.slice(200, 205).map((player, i) => asPick(player, i + 1, 'b-' + (i + 1)));
    await apply(page, 'B independent 5', snapshot(bPicks), {applied:5});
    b = await inspect(page, indexes);
    assertState('B independent 5 ledger', b, bPicks, indexes, sourceHash);
    check(await save(page), 'B independent save', b, expectedRows(bPicks, indexes));
    const b5Hash = hash(b.rows);

    check(await page.evaluate(id => switchDraftSession(id), aId),
      'switch B to A', b, expectedRows(bPicks, indexes));
    a = await inspect(page, indexes);
    assertState('A restored after B draft', a, corrected13, indexes, sourceHash);
    check(hash(a.rows) === a13Hash, 'A isolated from B', a, expectedRows(corrected13, indexes));

    const first20 = complete.slice(0, 20);
    await apply(page, 'A continue 20', snapshot(first20), {applied:20});
    a = await inspect(page, indexes);
    assertState('A 20 pre-reload', a, first20, indexes, sourceHash);
    check(await save(page), 'A 20 save', a, expectedRows(first20, indexes));
    await reload(page);
    a = await inspect(page, indexes);
    assertState('A 20 survives app reload', a, first20, indexes, sourceHash);
    check(a.session === aId, 'A active session survives reload', a, expectedRows(first20, indexes));

    // Synthetic reconnect = replay of the full numbered app snapshot after a
    // controlled app reload. No claim about actual network/Companion reconnection.
    await apply(page, 'A reconnect permuted 20',
      snapshot(first20.slice().reverse()), {applied:20});
    a = await inspect(page, indexes);
    assertState('A reconnect preserves the 20-pick ledger', a, first20, indexes, sourceHash);

    check(await page.evaluate(id => switchDraftSession(id), bId),
      'switch A to B after reconnect', a, expectedRows(first20, indexes));
    b = await inspect(page, indexes);
    assertState('B unchanged after A reload/reconnect', b, bPicks, indexes, sourceHash);
    check(hash(b.rows) === b5Hash, 'B independent digest unchanged', b, expectedRows(bPicks, indexes));
    check(await page.evaluate(id => switchDraftSession(id), aId),
      'switch B back to A', b, expectedRows(bPicks, indexes));

    // Pick 160 belongs to team 1 (not our slot 7). Picks 1..159 include
    // all 16 of our roster picks, so a premature completion signal is
    // demonstrably provisional until numbered pick 160 is reconciled.
    const first159 = complete.slice(0, 159);
    await apply(page, 'A provisional final signal with 159/160',
      snapshot(first159, {draftComplete:true, expectedCompleted:TOTAL}),
      {applied:159});
    a = await inspect(page, indexes);
    assertState('A numbered 159 no fabricated pick 160', a, first159, indexes, sourceHash);
    check(a.completion.provisional && a.completion.complete &&
      !a.completion.authoritative && a.completion.myRosterCount === ROUNDS,
    'A 159 signal must remain provisional', a, expectedRows(first159, indexes),
    {pick:160, detail:{completion:a.completion}});

    await apply(page, 'A authoritative final 160',
      snapshot(complete, {draftComplete:true, expectedCompleted:TOTAL}),
      {applied:TOTAL});
    a = await inspect(page, indexes);
    assertState('A authoritative 160', a, complete, indexes, sourceHash);
    check(a.completion.authoritative && a.completion.complete &&
      !a.completion.provisional && a.nextPick === null,
    'A authoritative terminal count and no next turn', a, expectedRows(complete, indexes),
    {pick:TOTAL, detail:{completion:a.completion, nextPick:a.nextPick}});
    const finalDigest = hash(a.rows);
    check(await save(page), 'A terminal save', a, expectedRows(complete, indexes));
    await reload(page);
    a = await inspect(page, indexes);
    assertState('A full draft survives terminal reload', a, complete, indexes, sourceHash);
    check(a.completion.authoritative && a.completion.complete &&
      a.nextPick === null && hash(a.rows) === finalDigest,
    'A terminal reload preserves full ledger and next-turn state',
    a, expectedRows(complete, indexes));

    check(await page.evaluate(id => switchDraftSession(id), bId),
      'terminal A switch to B', a, expectedRows(complete, indexes));
    b = await inspect(page, indexes);
    assertState('B still isolated after terminal reload', b, bPicks, indexes, sourceHash);
    check(hash(b.rows) === b5Hash, 'B final isolation digest', b, expectedRows(bPicks, indexes));
    check(await page.evaluate(id => switchDraftSession(id), aId),
      'terminal B switch to A', b, expectedRows(bPicks, indexes));
    a = await inspect(page, indexes);
    assertState('A still terminal after B switch', a, complete, indexes, sourceHash);
    check(hash(a.rows) === finalDigest, 'A final isolation digest', a, expectedRows(complete, indexes));

    check(pageErrors.length === 0, 'browser runtime errors', a, expectedRows(complete, indexes),
      {detail:{count:pageErrors.length, messages:pageErrors.slice(0, 3)}});
    const result = {
      iteration, seed:SEED, teams:TEAMS, rounds:ROUNDS, slot:SLOT,
      openingCount:12, correctionPick:5, unresolvedPick:13,
      replayCount:20, provisionalCount:159, terminalCount:160,
      sessionA:aId, sessionB:bId, sourceHash, finalLedgerDigest:finalDigest,
      isolatedSessionDigest:b5Hash, browserErrors:0
    };
    console.log('WR118_SCENARIO ' + JSON.stringify(result));
    // Return only reproducible state. Default IDs may vary by browser context.
    return {sourceHash, finalLedgerDigest:finalDigest, isolatedSessionDigest:b5Hash};
  } finally {
    await context.close();
  }
}

let browser;
try {
  browser = await chromium.launch({
    headless:true,
    ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})
  });
  const results = [];
  for (let iteration = 1; iteration <= ITERATIONS; iteration++) {
    results.push(await runScenario(browser, iteration));
  }
  assert.deepEqual(results[1], results[0],
    'Identical seed/fixture must produce identical terminal source, A and B digests');
  console.log('WR118_APP_SIDE_SYNTHETIC_PASS ' + JSON.stringify({
    iterations:ITERATIONS, seed:SEED, ...results[0],
    boundary:'app snapshot interface only; no Companion bridge, live ESPN or independent structured Direct'
  }));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
