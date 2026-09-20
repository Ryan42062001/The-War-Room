import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {waitForWarRoomQuiescence} from './browser-test-helpers.mjs';
const {chromium} = createRequire(import.meta.url)('playwright');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
// WR-123-F02: execute BOTH literal standalone syntax commands, not merely the
// implicit parse of this browser script. The full CI browser job retains logs.
for (const file of ['js/war-room-rankings.js', 'scripts/test-browser.mjs']) {
  console.log('WR-122 literal syntax command: node --check ' + file);
  execFileSync('node', ['--check', file], {cwd:root, stdio:'inherit'});
  console.log('WR-122 literal syntax PASS: node --check ' + file);
}

const server = process.env.WAR_ROOM_URL ? null : http.createServer((request, response) => {
  const relative = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\//, '');
  fs.readFile(path.join(root, relative), (error, data) => { response.statusCode = error ? 404 : 200; response.end(error ? 'not found' : data); });
});
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const appUrl = process.env.WAR_ROOM_URL || `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH});
const page = await browser.newPage({viewport:{width:1280,height:900}});
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', error => errors.push(error.message));
await page.goto(appUrl, {waitUntil:'load'});
await page.waitForSelector('tr.draftrow', {state:'attached'});
await page.waitForSelector('.recommendation-card');

const startup = await page.evaluate(() => ({
  dataset: FANTASYPROS_2026_DATASET.length,
  espnBoard: ESPN_2026_PPR_BOARD.players.length,
  espnRankedRows: document.querySelectorAll('tr.draftrow[data-espn-rank]:not([data-espn-rank=""])').length,
  rows: document.querySelectorAll('tr.draftrow').length,
  controls: document.querySelectorAll('.rank-controls').length,
  duplicates: FANTASYPROS_2026_DATASET.length - new Set(FANTASYPROS_2026_DATASET.map(p => canonicalExpertPlayerName(p.name))).size
}));
assert.deepEqual(startup, {dataset:717, espnBoard:300, espnRankedRows:300, rows:717, controls:0, duplicates:0});

await page.waitForSelector('.position-player-card');
const positionTierBoard = await page.evaluate(() => ({
  view: document.body.getAttribute('data-board-view'),
  primary: [...document.querySelectorAll('#position-tier-grid > .position-column')].map(column => column.getAttribute('data-position')),
  endgame: [...document.querySelectorAll('#position-endgame-grid > .position-column')].map(column => column.getAttribute('data-position')),
  cards: document.querySelectorAll('.position-player-card').length,
  decisions: document.querySelectorAll('#position-decision-strip .position-decision-card').length,
  positionDisplay: getComputedStyle(document.getElementById('position-board')).display,
  overallDisplay: getComputedStyle(document.getElementById('big-board-wrap')).display
}));
assert.deepEqual(positionTierBoard.primary, ['WR','RB','QB','TE']);
assert.deepEqual(positionTierBoard.endgame, ['K','DST']);
assert.equal(positionTierBoard.view, 'position');
assert.equal(positionTierBoard.cards, 717);
assert.equal(positionTierBoard.decisions, 6);
assert.notEqual(positionTierBoard.positionDisplay, 'none');
assert.equal(positionTierBoard.overallDisplay, 'none');

const positionTierProxy = await page.evaluate(() => {
  const row = findDraftRowByExpertName("Ja'Marr Chase");
  const card = positionBoardCardByKey.get(getPositionBoardRowKey(row)).card;
  card.click();
  const taken = {row:row.classList.contains('drafted-other'), card:card.getAttribute('data-status')};
  card.click();
  const cleared = {row:!row.classList.contains('drafted-other') && !row.classList.contains('drafted-mine'), card:card.getAttribute('data-status')};
  return {taken, cleared};
});
assert.deepEqual(positionTierProxy, {taken:{row:true,card:'taken'}, cleared:{row:true,card:'available'}});

const boardViewToggle = await page.evaluate(() => {
  setBoardView('overall', {persist:false});
  const overall = {
    view:document.body.getAttribute('data-board-view'),
    position:getComputedStyle(document.getElementById('position-board')).display,
    source:getComputedStyle(document.getElementById('big-board-wrap')).display
  };
  setBoardView('position', {persist:false});
  const position = {
    view:document.body.getAttribute('data-board-view'),
    position:getComputedStyle(document.getElementById('position-board')).display,
    source:getComputedStyle(document.getElementById('big-board-wrap')).display
  };
  return {overall, position};
});
assert.equal(boardViewToggle.overall.view, 'overall');
assert.equal(boardViewToggle.overall.position, 'none');
assert.notEqual(boardViewToggle.overall.source, 'none');
assert.equal(boardViewToggle.position.view, 'position');
assert.notEqual(boardViewToggle.position.position, 'none');
assert.equal(boardViewToggle.position.source, 'none');

const positionTierFilter = await page.evaluate(() => {
  setPosFilter('WR', document.querySelector('.filterbtn[data-pos="WR"]'));
  const visible = [...document.querySelectorAll('.position-column')].filter(column => !column.hidden).map(column => column.getAttribute('data-position'));
  const endgameHidden = document.getElementById('position-endgame-section').hidden;
  setPosFilter('ALL', document.querySelector('.filterbtn[data-pos="ALL"]'));
  return {visible, endgameHidden};
});
assert.deepEqual(positionTierFilter.visible, ['WR']);
assert.equal(positionTierFilter.endgameHidden, true);

const boundedSyncSnapshot = await page.evaluate(() => {
  const huge = Array.from({length:5000}, (_, index) => ({playerName:'Player ' + index}));
  const sanitized = WarRoomEspnSync.sanitizeSnapshot({
    picks: huge,
    unavailablePlayers: huge,
    marketAdp: huge,
    expectedCompleted: 99999,
    marketUpdatedAt: 'x'.repeat(200)
  });
  return {
    picks:sanitized.picks.length,
    unavailable:sanitized.unavailablePlayers.length,
    market:sanitized.marketAdp.length,
    expected:sanitized.expectedCompleted,
    updatedAtLength:sanitized.marketUpdatedAt.length,
    invalid:WarRoomEspnSync.applySnapshot([])
  };
});
assert.deepEqual(boundedSyncSnapshot, {
  picks:160,
  unavailable:1000,
  market:1000,
  expected:160,
  updatedAtLength:80,
  invalid:null
});

const persistenceContext = await browser.newContext();
const persistencePage = await persistenceContext.newPage({viewport:{width:1280,height:900}});
const persistenceErrors = [];
persistencePage.on('console', msg => { if (msg.type() === 'error') persistenceErrors.push(msg.text()); });
persistencePage.on('pageerror', error => persistenceErrors.push(error.message));
await persistencePage.goto(appUrl, {waitUntil:'load'});
await persistencePage.waitForSelector('tr.draftrow', {state:'attached'});

await persistencePage.evaluate(() => {
  localStorage.setItem('war-room-draft-sessions-v1', '{not-json');
  localStorage.setItem('draft-state-v1', JSON.stringify({
    version:2, savedAt:'legacy-test', teams:10, slot:1, rounds:16,
    recommendationAudit:[], autoDraftTeamSlots:[], state:{}, draftMeta:{}, order:[]
  }));
});
await persistencePage.reload({waitUntil:'load'});
await persistencePage.waitForSelector('tr.draftrow', {state:'attached'});
const corruptRegistryRecovery = await persistencePage.evaluate(() => ({
  sessions: JSON.parse(localStorage.getItem('war-room-draft-sessions-v1') || '[]'),
  active: localStorage.getItem('war-room-active-draft-session-v1'),
  backup: Array.from({length:localStorage.length}, (_, index) => localStorage.key(index))
    .find(key => key && key.startsWith('war-room-draft-sessions-v1:corrupt-backup:')) || null
}));
assert.equal(corruptRegistryRecovery.sessions.length, 1);
assert.equal(corruptRegistryRecovery.sessions[0].id, 'legacy');
assert.equal(corruptRegistryRecovery.active, 'legacy');
assert.ok(corruptRegistryRecovery.backup);

await persistencePage.evaluate(() => {
  const state = {
    version:2,
    savedAt:'<img src=x onerror=alert(1)>',
    teams:999,
    slot:-3,
    rounds:99,
    recommendationAudit:Array.from({length:250}, () => ({resolved:false})),
    autoDraftTeamSlots:[2, 999, '3'],
    state:{"ja'marr chase":'mine', 'puka nacua':'invalid'},
    draftMeta:{"ja'marr chase":{pick:9999, teamSlot:999, source:'invalid', espnPlayerId:'x'.repeat(100)}},
    order:'not-an-array'
  };
  localStorage.setItem('war-room-draft-sessions-v1', JSON.stringify([
    null,
    {},
    {id:'  good  ', name:'  Good   Draft  ', createdAt:'2026-09-06T00:00:00.000Z'},
    {id:'good', name:'Duplicate'}
  ]));
  localStorage.setItem('war-room-active-draft-session-v1', 'ghost');
  localStorage.setItem('draft-state-v1:good', JSON.stringify(state));
});
await persistencePage.reload({waitUntil:'load'});
await persistencePage.waitForSelector('tr.draftrow', {state:'attached'});
const normalizedPersistence = await persistencePage.evaluate(() => {
  const chase = findDraftRowByExpertName("Ja'Marr Chase");
  const registry = JSON.parse(localStorage.getItem('war-room-draft-sessions-v1') || '[]');
  const before = activeDraftSessionId;
  const phantomSwitch = switchDraftSession('missing-session');
  const diagnosticPayload = JSON.parse(localStorage.getItem('draft-state-v1:good'));
  diagnosticPayload.savedAt = '<img src=x onerror=alert(1)>';
  localStorage.setItem('draft-state-v1:good', JSON.stringify(diagnosticPayload));
  const diagElement = document.createElement('div');
  diagElement.id = 'storage-diag';
  document.body.appendChild(diagElement);
  loadState();
  const diagText = diagElement.textContent;
  const diagImages = diagElement.querySelectorAll('img').length;
  diagElement.remove();
  return {
    registry,
    active: activeDraftSessionId,
    activeBeforePhantom: before,
    phantomSwitch,
    teams:Number(document.getElementById('pcTeams').value),
    slot:Number(document.getElementById('pcSlot').value),
    rounds:Number(document.getElementById('pcRounds').value),
    mine:chase.classList.contains('drafted-mine'),
    pick:chase.getAttribute('data-pick'),
    teamSlot:chase.getAttribute('data-team-slot'),
    espnPlayerIdLength:(chase.getAttribute('data-espn-player-id') || '').length,
    auditLength:recommendationAudit.length,
    autoDraft:autoDraftTeamSlots.slice(),
    diag:diagText,
    diagImages:diagImages
  };
});
assert.deepEqual(normalizedPersistence.registry.map(session => [session.id, session.name]), [['good', 'Good Draft']]);
assert.equal(normalizedPersistence.active, 'good');
assert.equal(normalizedPersistence.activeBeforePhantom, 'good');
assert.equal(normalizedPersistence.phantomSwitch, false);
assert.equal(normalizedPersistence.teams, 20);
assert.equal(normalizedPersistence.slot, 1);
assert.equal(normalizedPersistence.rounds, 30);
assert.equal(normalizedPersistence.mine, true);
assert.equal(normalizedPersistence.pick, null);
assert.equal(normalizedPersistence.teamSlot, null);
assert.equal(normalizedPersistence.espnPlayerIdLength, 40);
assert.equal(normalizedPersistence.auditLength, 200);
assert.deepEqual(normalizedPersistence.autoDraft, [2,3]);
assert.ok(normalizedPersistence.diag.includes('<img src=x onerror=alert(1)>'));
assert.equal(normalizedPersistence.diagImages, 0);

const corruptDraftRecovery = await persistencePage.evaluate(() => {
  const key = 'draft-state-v1:good';
  localStorage.setItem(key, '[]');
  const recovery = readDraftSessionPayload('good');
  return {
    status:recovery.status,
    original:localStorage.getItem(key),
    backup:recovery.backupKey
  };
});
assert.equal(corruptDraftRecovery.status, 'corrupt');
assert.equal(corruptDraftRecovery.original, null);
assert.ok(corruptDraftRecovery.backup);
assert.ok(corruptDraftRecovery.backup.startsWith('draft-state-v1:good:corrupt-backup:'));

// Preserve the startup recovery path independently from the atomic quarantine
// invariant. Normal post-load recommendation work may legitimately autosave a
// new valid payload to the active key, so it must not be confused with the
// corrupt value that readDraftSessionPayload() removed.
await persistencePage.evaluate(() => localStorage.setItem('draft-state-v1:good', '[]'));
await persistencePage.reload({waitUntil:'load'});
await persistencePage.waitForSelector('tr.draftrow', {state:'attached'});
await waitForWarRoomQuiescence(persistencePage);
const corruptDraftStartup = await persistencePage.evaluate(() => {
  const raw = localStorage.getItem('draft-state-v1:good');
  let successor = null;
  if (raw !== null) {
    try { successor = JSON.parse(raw); } catch (error) { successor = null; }
  }
  return {
    raw,
    successor,
    backup:Array.from({length:localStorage.length}, (_, index) => localStorage.key(index))
      .find(key => key && key.startsWith('draft-state-v1:good:corrupt-backup:')) || null,
    drafted:document.querySelectorAll('tr.drafted-mine,tr.drafted-other').length
  };
});
assert.notEqual(corruptDraftStartup.raw, '[]');
assert.ok(corruptDraftStartup.backup);
assert.equal(corruptDraftStartup.drafted, 0);
if (corruptDraftStartup.raw !== null) {
  assert.equal(corruptDraftStartup.successor?.version, 2);
  assert.ok(Array.isArray(corruptDraftStartup.successor?.recommendationAudit));
}

const storageFailureStartup = await persistencePage.evaluate(() => {
  localStorage.clear();
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function() {
    throw new DOMException('Injected storage failure', 'QuotaExceededError');
  };
  let error = null;
  try {
    initializeDraftSessions();
  } catch (caught) {
    error = caught && caught.message;
  } finally {
    Storage.prototype.setItem = originalSetItem;
  }
  return {
    error,
    active:activeDraftSessionId,
    options:Array.from(document.querySelectorAll('#draftSessionSelect option')).map(option => option.value)
  };
});
assert.equal(storageFailureStartup.error, null);
assert.equal(storageFailureStartup.active, 'legacy');
assert.deepEqual(storageFailureStartup.options, ['legacy']);

const atomicDeleteFailure = await persistencePage.evaluate(() => {
  localStorage.clear();
  const sessions = [
    {id:'draft-a', name:'Draft A', createdAt:'2026-09-06T00:00:00.000Z'},
    {id:'draft-b', name:'Draft B', createdAt:'2026-09-06T00:00:01.000Z'}
  ];
  localStorage.setItem(DRAFT_SESSION_REGISTRY_KEY, JSON.stringify(sessions));
  localStorage.setItem(ACTIVE_DRAFT_SESSION_KEY, 'draft-a');
  localStorage.setItem(getDraftSessionStateKey('draft-a'), 'important-state');
  activeDraftSessionId = 'draft-a';
  renderDraftSessionSelector(sessions);
  deleteDraftArmed = true;

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    if (String(key) === DRAFT_SESSION_REGISTRY_KEY) {
      throw new DOMException('Injected registry failure', 'QuotaExceededError');
    }
    return originalSetItem.call(this, key, value);
  };
  let result = null;
  let error = null;
  try {
    result = deleteActiveDraftSession();
  } catch (caught) {
    error = caught && caught.message;
  } finally {
    Storage.prototype.setItem = originalSetItem;
  }

  return {
    error,
    result,
    state:localStorage.getItem(getDraftSessionStateKey('draft-a')),
    registry:JSON.parse(localStorage.getItem(DRAFT_SESSION_REGISTRY_KEY) || '[]').map(session => session.id),
    active:activeDraftSessionId
  };
});
assert.equal(atomicDeleteFailure.error, null);
assert.equal(atomicDeleteFailure.result, false);
assert.equal(atomicDeleteFailure.state, 'important-state');
assert.deepEqual(atomicDeleteFailure.registry, ['draft-a', 'draft-b']);
assert.equal(atomicDeleteFailure.active, 'draft-a');

const unsavedTransitionBlock = await persistencePage.evaluate(() => {
  localStorage.clear();
  const sessions = [
    {id:'draft-a', name:'Draft A', createdAt:'2026-09-06T00:00:00.000Z'},
    {id:'draft-b', name:'Draft B', createdAt:'2026-09-06T00:00:01.000Z', draftKey:'espn-room-b'}
  ];
  const stateA = {
    version:2, savedAt:'transition-test', teams:10, slot:1, rounds:16,
    recommendationAudit:[], autoDraftTeamSlots:[], state:{}, draftMeta:{}, order:[]
  };
  localStorage.setItem(DRAFT_SESSION_REGISTRY_KEY, JSON.stringify(sessions));
  localStorage.setItem(ACTIVE_DRAFT_SESSION_KEY, 'draft-a');
  localStorage.setItem(getDraftSessionStateKey('draft-a'), JSON.stringify(stateA));
  activeDraftSessionId = 'draft-a';
  clearDraftStateFromBoard();
  renderDraftSessionSelector(sessions);

  const beforeTeams = LEAGUE_SIZE;
  const beforeRounds = TOTAL_ROUNDS;
  const beforeSlot = MY_DRAFT_SLOT;
  const originalSaveState = saveState;
  saveState = function() { return false; };

  let switchResult;
  let createResult;
  let selectResult;
  let snapshotResult;
  try {
    switchResult = switchDraftSession('draft-b');
    createResult = createNewDraftSession({id:'draft-c', name:'Draft C'});
    selectResult = selectEspnDraftSession('espn-room-b');
    snapshotResult = applyEspnDraftSnapshot({
      draftKey:'espn-room-c',
      config:{teams:12, rounds:18, draftSlot:4},
      force:true,
      picks:[{overallPick:1, playerName:"Ja'Marr Chase", position:'WR', teamSlot:4}]
    });
  } finally {
    saveState = originalSaveState;
  }

  return {
    switchResult,
    createResult,
    selectResult,
    snapshotResult,
    active:activeDraftSessionId,
    activeStored:localStorage.getItem(ACTIVE_DRAFT_SESSION_KEY),
    registry:JSON.parse(localStorage.getItem(DRAFT_SESSION_REGISTRY_KEY) || '[]').map(session => session.id),
    teams:LEAGUE_SIZE,
    rounds:TOTAL_ROUNDS,
    slot:MY_DRAFT_SLOT,
    beforeTeams,
    beforeRounds,
    beforeSlot,
    espnDrafted:document.querySelectorAll('tr.draftrow[data-sync-source="espn"]').length,
    status:(document.getElementById('espn-sync-status') || {}).textContent || ''
  };
});
assert.equal(unsavedTransitionBlock.switchResult, false);
assert.equal(unsavedTransitionBlock.createResult, null);
assert.equal(unsavedTransitionBlock.selectResult, false);
assert.equal(unsavedTransitionBlock.snapshotResult, null);
assert.equal(unsavedTransitionBlock.active, 'draft-a');
assert.equal(unsavedTransitionBlock.activeStored, 'draft-a');
assert.deepEqual(unsavedTransitionBlock.registry, ['draft-a', 'draft-b']);
assert.equal(unsavedTransitionBlock.teams, unsavedTransitionBlock.beforeTeams);
assert.equal(unsavedTransitionBlock.rounds, unsavedTransitionBlock.beforeRounds);
assert.equal(unsavedTransitionBlock.slot, unsavedTransitionBlock.beforeSlot);
assert.equal(unsavedTransitionBlock.espnDrafted, 0);
assert.ok(unsavedTransitionBlock.status.includes('ESPN sync paused'));

const newSessionRollback = await persistencePage.evaluate(() => {
  localStorage.clear();
  const sessions = [{id:'draft-a', name:'Draft A', createdAt:'2026-09-06T00:00:00.000Z'}];
  const stateA = {
    version:2, savedAt:'rollback-test', teams:10, slot:1, rounds:16,
    recommendationAudit:[], autoDraftTeamSlots:[], state:{}, draftMeta:{}, order:[]
  };
  localStorage.setItem(DRAFT_SESSION_REGISTRY_KEY, JSON.stringify(sessions));
  localStorage.setItem(ACTIVE_DRAFT_SESSION_KEY, 'draft-a');
  localStorage.setItem(getDraftSessionStateKey('draft-a'), JSON.stringify(stateA));
  activeDraftSessionId = 'draft-a';
  clearDraftStateFromBoard();
  loadState();
  renderDraftSessionSelector(sessions);

  const originalSaveState = saveState;
  let calls = 0;
  saveState = function() {
    calls++;
    return calls === 1;
  };

  let result;
  try {
    result = createNewDraftSession({id:'draft-new', name:'Draft New'});
  } finally {
    saveState = originalSaveState;
  }

  return {
    result,
    calls,
    active:activeDraftSessionId,
    activeStored:localStorage.getItem(ACTIVE_DRAFT_SESSION_KEY),
    registry:JSON.parse(localStorage.getItem(DRAFT_SESSION_REGISTRY_KEY) || '[]').map(session => session.id),
    newState:localStorage.getItem(getDraftSessionStateKey('draft-new'))
  };
});
assert.equal(newSessionRollback.result, null);
assert.equal(newSessionRollback.calls, 2);
assert.equal(newSessionRollback.active, 'draft-a');
assert.equal(newSessionRollback.activeStored, 'draft-a');
assert.deepEqual(newSessionRollback.registry, ['draft-a']);
assert.equal(newSessionRollback.newState, null);

const activeSessionWriteFailure = await persistencePage.evaluate(() => {
  localStorage.clear();
  const sessions = [
    {id:'draft-a', name:'Draft A', createdAt:'2026-09-06T00:00:00.000Z'},
    {id:'draft-b', name:'Draft B', createdAt:'2026-09-06T00:00:01.000Z'}
  ];
  localStorage.setItem(DRAFT_SESSION_REGISTRY_KEY, JSON.stringify(sessions));
  localStorage.setItem(ACTIVE_DRAFT_SESSION_KEY, 'draft-a');
  activeDraftSessionId = 'draft-a';
  clearDraftStateFromBoard();
  renderDraftSessionSelector(sessions);

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    if (String(key) === ACTIVE_DRAFT_SESSION_KEY) {
      throw new DOMException('Injected active-session failure', 'QuotaExceededError');
    }
    return originalSetItem.call(this, key, value);
  };

  let result;
  try {
    result = switchDraftSession('draft-b');
  } finally {
    Storage.prototype.setItem = originalSetItem;
  }

  return {
    result,
    active:activeDraftSessionId,
    activeStored:localStorage.getItem(ACTIVE_DRAFT_SESSION_KEY)
  };
});
assert.equal(activeSessionWriteFailure.result, false);
assert.equal(activeSessionWriteFailure.active, 'draft-a');
assert.equal(activeSessionWriteFailure.activeStored, 'draft-a');

assert.deepEqual(persistenceErrors, []);
await persistenceContext.close();

const recommendationCard = page.locator('.recommendation-card');
assert.equal(await recommendationCard.getAttribute('open'), null);
assert.equal(await page.locator('.recommendation-card-summary .recommendation-player b').count(), 1);
assert.equal(await page.locator('.recommendation-one-line').count(), 1);

// WR-122: isolated synthetic compact/expanded rendering using actual app interfaces.
// No source rows, saved draft, engine policy, or ranking order are changed.
const wr122Presentation = await page.evaluate(() => {
  const live = buildLiveDraftDebugState();
  const primary = live.scored[0];
  const element = document.createElement('div');
  element.id = 'wr122-presentation-fixture';
  // The existing overall-board card may be hidden in Position view. Mount this
  // isolated fixture visibly so native summary keyboard focus is actually tested.
  element.style.width = '100%';
  element.style.maxWidth = '480px';
  element.style.boxSizing = 'border-box';
  document.body.appendChild(element);
  const originalRows = [...document.querySelectorAll('tr.draftrow')].map(row => [
    row.getAttribute('data-name'), row.getAttribute('data-ecr'),
    row.getAttribute('data-espn-rank'), row.getAttribute('data-espn-adp'),
    row.getAttribute('data-adp'), row.className
  ]);
  function currentEngine() {
    return {
      player:window.latestDraftRecommendation?.player,
      action:window.latestDraftRecommendation?.recommendation,
      confidenceScore:window.latestDraftRecommendation?.confidenceScore,
      numericSurvival:calculateNextPickSurvival(primary, live.context),
      finalScore:primary.finalScore, order:live.scored.map(player => player.name)
    };
  }
  const liveBefore = currentEngine();
  const standard = {...live.context};
  const nonadjacent = {...standard, currentPick:5, calculatedNextPick:7,
    nextPick:7, calculatedPicksUntilNext:1, teams:10, draftSlot:7,
    rounds:16, totalPicks:160};
  const adjacent = {...nonadjacent, currentPick:10, calculatedNextPick:11,
    nextPick:11, calculatedPicksUntilNext:0, draftSlot:10};
  const invalid = {...adjacent, calculatedNextPick:null, nextPick:null};
  const es = live.scored.find(player => getMarketTimingDetails(player, standard).source.startsWith('ESPN'));
  if (!es) throw new Error('No existing ESPN market candidate for WR-122');
  const unknown = {...es, espnRank:null, espnAdp:null, adp:null, realTimeAdp:null, adpRank:null};
  const fallback = {...unknown, adp:85};
  function render(label, player, context, turn, turnDisplayOverride) {
    // Snapshot the requested synthetic turn BEFORE scoring, which may calculate
    // and overwrite turn fields. Only the display receives test contradictions.
    const requestedTurn = {...context, ...(turnDisplayOverride || {})};
    const scored = [player].concat(live.scored.filter(item => item.name !== player.name));
    const recommendation = calculateDraftRecommendation(player, scored, context);
    if (!recommendation) throw new Error('Missing actual recommendation for ' + label);
    const explanation = buildRecommendationExplanation(recommendation, player, scored[1] || null);
    const displayedRecommendation = turn ? {...recommendation, turnPackageActive:true,
      turnRecommendedNow:player.name, turnTargetNext:scored[1]?.name || 'Best available'} : recommendation;
    const displayedExplanation = turn ? {...explanation, type:'TURN_PACKAGE',
      // This engine-style explanatory sentence is intentionally unqualified.
      // Only the display may correct it; player/action/score internals stay put.
      reasons:['Fixture target is guaranteed to remain available at your next pick because no opponent selects between the two picks.',
        ...explanation.reasons]} : explanation;
    const capture = () => ({
      player:recommendation.player, action:recommendation.recommendation,
      confidenceScore:recommendation.confidenceScore, score:player.finalScore,
      survival:calculateNextPickSurvival(player, context),
      order:scored.map(item => item.name), market:getMarketTimingDetails(player, context)
    });
    const before = capture();
    // Reapply the requested synthetic turn AFTER scoring; never modify the
    // recommendation engine or score fields to manufacture a passing guard.
    const displayContext = {...context, ...requestedTurn};
    const state = {...live, context:displayContext, scored};
    renderCompactRecommendationCard(element, displayedRecommendation, displayedExplanation, player, state);
    const card = element.querySelector('.recommendation-card');
    return {label, before, after:capture(),
      compact:card.querySelector('summary.recommendation-card-summary').textContent,
      expanded:card.querySelector('.recommendation-expanded').textContent,
      marketDetail:card.querySelector('.recommendation-market-details').textContent,
      marketSummary:card.querySelector('.recommendation-market-details summary').textContent,
      confidence:card.querySelector('.recommendation-confidence').textContent,
      compactTimingAccessible:card.querySelector('.recommendation-one-line b').getAttribute('aria-label'),
      factorCount:card.querySelectorAll('.recommendation-factor').length,
      scoreDetails:card.querySelector('.recommendation-score-details:not(.recommendation-market-details)').textContent,
      source:card.querySelector('.recommendation-market-details small').textContent};
  }
  const result = {
    regular:render('ESPN market', es, standard, false),
    unknown:render('unknown nonadjacent', unknown, nonadjacent, false),
    fallback:render('FantasyPros fallback', fallback, nonadjacent, false),
    adjacent:render('verified adjacent', es, adjacent, true),
    invalid:render('invalid next context', es, invalid, true),
    // WR-123-F01 concrete independent negative control: real rendered summary,
    // reasons, market basis and next-pick detail must ALL reject contradictory
    // context despite an individually legal 10/11 snake pair.
    contradictoryNext:render('auditor contradictory next', es, adjacent, true,
      {teams:10, draftSlot:10, currentPick:10, calculatedNextPick:11,
       nextPick:20, calculatedPicksUntilNext:9, rounds:16, totalPicks:160}),
    contradictoryCount:render('contradictory intervening count', es, adjacent, true,
      {calculatedNextPick:11, nextPick:11, calculatedPicksUntilNext:9}),
    oneCalculated:render('one calculated next source', es, adjacent, true, {nextPick:null}),
    oneSupplied:render('one supplied next source', es, adjacent, true, {calculatedNextPick:null}),
    missingBoth:render('both next sources absent', es, adjacent, true,
      {calculatedNextPick:null, nextPick:null, calculatedPicksUntilNext:null}),
    wrongOwner:render('wrong own-turn slot', es, adjacent, true, {draftSlot:9}),
    wrongNextOwner:render('wrong next-pick ownership', es, adjacent, true, {nextPick:12, calculatedNextPick:12, calculatedPicksUntilNext:1}),
    zeroNext:render('zero next pick', es, adjacent, true, {calculatedNextPick:0, nextPick:0}),
    pastNext:render('past next pick', es, adjacent, true, {calculatedNextPick:9, nextPick:9}),
    nonintegerNext:render('noninteger next pick', es, adjacent, true, {calculatedNextPick:11.5, nextPick:11.5}),
    outOfRangeNext:render('out-of-range next pick', es, adjacent, true, {calculatedNextPick:161, nextPick:161}),
    invalidCount:render('noninteger intervening count', es, adjacent, true, {calculatedPicksUntilNext:0.5}),
    inconsistentTotal:render('inconsistent team-round total', es, adjacent, true, {totalPicks:159}),
    invalidRounds:render('noninteger draft rounds', es, adjacent, true, {rounds:16.5}),
    invalidTeams:render('noninteger teams', es, adjacent, true, {teams:10.5}),
    invalidSlot:render('noninteger draft slot', es, adjacent, true, {draftSlot:10.5}),
    terminal:render('terminal draft boundary', es, adjacent, true,
      {currentPick:160, calculatedNextPick:161, nextPick:161, calculatedPicksUntilNext:0}),
    oneRoundTerminal:render('single-round terminal boundary', es, adjacent, true,
      {rounds:1, totalPicks:10, currentPick:10, calculatedNextPick:11, nextPick:11, calculatedPicksUntilNext:0}),
    lastRoundAdjacent:render('last-round valid 150/151 own pair', es, adjacent, true,
      {currentPick:150, calculatedNextPick:151, nextPick:151, calculatedPicksUntilNext:0}),
    liveBefore, liveAfter:currentEngine(),
    unchangedRows:JSON.stringify(originalRows) === JSON.stringify(
      [...document.querySelectorAll('tr.draftrow')].map(row => [
        row.getAttribute('data-name'), row.getAttribute('data-ecr'),
        row.getAttribute('data-espn-rank'), row.getAttribute('data-espn-adp'),
        row.getAttribute('data-adp'), row.className]))
  };
  render('verified adjacent', es, adjacent, true);
  return result;
});
for (const item of Object.values(wr122Presentation).filter(value => value && value.before && value.after)) {
  assert.deepEqual(item.after, item.before, 'WR-122 engine unchanged: ' + item.label);
  assert.match(item.confidence, /Decision strength · heuristic/);
  assert.doesNotMatch(item.confidence, /\d+%/);
  assert.equal(item.factorCount, 4);
  assert.equal(item.marketSummary, 'Market timing basis');
  assert.match(item.expanded, /heuristic scores, not probabilities/);
  assert.doesNotMatch(item.compact + item.scoreDetails, /\d+% (?:survival|confidence)|Survival \d+%/i);
  assert.match(item.source, /Per-player market freshness not verified/);
  assert.match(item.compactTimingAccessible, /Market timing/);
}
assert.deepEqual(wr122Presentation.liveAfter, wr122Presentation.liveBefore);
assert.equal(wr122Presentation.unchangedRows, true);
assert.match(wr122Presentation.regular.compact, /ESPN (?:B\+ADP|board|ADP)/);
assert.match(wr122Presentation.regular.marketDetail, /Source: ESPN/);
assert.match(wr122Presentation.regular.marketDetail, /not a calibrated probability/);
assert.equal(wr122Presentation.unknown.before.market.marketRank, null);
assert.equal(wr122Presentation.unknown.before.survival, 50);
assert.match(wr122Presentation.unknown.compact, /Timing UNKNOWN/);
assert.match(wr122Presentation.unknown.compactTimingAccessible, /Market timing unknown — no survival estimate/);
assert.match(wr122Presentation.unknown.expanded, /No ESPN or FantasyPros market input/);
assert.match(wr122Presentation.unknown.source, /Source: Unknown market/);
assert.doesNotMatch(wr122Presentation.unknown.compact + wr122Presentation.unknown.expanded,
  /50% survival|50% chance|low chance|you may be able to wait/i);
assert.equal(wr122Presentation.fallback.before.market.source, 'FantasyPros ADP fallback');
assert.match(wr122Presentation.fallback.compact, /FP ADP fallback/);
assert.match(wr122Presentation.fallback.compactTimingAccessible, /FantasyPros ADP fallback/);
assert.match(wr122Presentation.fallback.source, /Source: FantasyPros ADP fallback/);
assert.doesNotMatch(wr122Presentation.fallback.marketDetail, /Source: ESPN/);
assert.match(wr122Presentation.adjacent.compact, /Back-to-back own turns; second option remains conditional/);
assert.match(wr122Presentation.adjacent.marketDetail, /no intervening opponent selection/);
assert.match(wr122Presentation.adjacent.expanded, /No opponent selects between verified adjacent own picks/);
assert.match(wr122Presentation.adjacent.expanded, /next target must still be eligible/);
assert.doesNotMatch(wr122Presentation.adjacent.expanded, /guaranteed to remain available/);
assert.doesNotMatch(wr122Presentation.invalid.compact +
  wr122Presentation.invalid.marketDetail, /no intervening opponent selection|Back-to-back own turns/i);
assert.match(wr122Presentation.invalid.expanded, /Next-target availability is unverified/);
assert.doesNotMatch(wr122Presentation.invalid.expanded,
  /guaranteed to remain available|No opponent selects between verified adjacent own picks/i);
const wr122ForbiddenTurnClaims = /back-to-back own turns|no intervening opponent|no opponent selects between|guaranteed to remain available|verified adjacent own picks|next pick\s*#\s*\d+/i;
for (const key of ['contradictoryNext','contradictoryCount','missingBoth','wrongOwner',
  'wrongNextOwner','zeroNext','pastNext','nonintegerNext','outOfRangeNext',
  'invalidCount','inconsistentTotal','invalidRounds','invalidTeams','invalidSlot',
  'terminal','oneRoundTerminal']) {
  const shown = wr122Presentation[key];
  assert.doesNotMatch(shown.compact + ' ' + shown.expanded + ' ' + shown.marketDetail,
    wr122ForbiddenTurnClaims, 'WR-123-F01 fail-closed rendered turn: ' + key);
  assert.match(shown.compact, /Next-turn context unverified; second target conditional/i);
  assert.match(shown.expanded, /Next-target availability is unverified/);
  assert.match(shown.expanded, /CONDITIONAL TARGET \(NEXT TURN UNVERIFIED\)/);
  assert.match(shown.marketDetail, /next pick unverified — incomplete or conflicting turn context/i);
}
for (const key of ['adjacent','oneCalculated','oneSupplied','lastRoundAdjacent']) {
  const shown = wr122Presentation[key];
  assert.match(shown.compact, /Back-to-back own turns; second option remains conditional/);
  assert.match(shown.marketDetail, /Verified adjacent own snake picks: no intervening opponent selection/);
  assert.match(shown.expanded, /No opponent selects between verified adjacent own picks/);
  assert.match(shown.expanded, /next target must still be eligible after the first selection/);
  assert.match(shown.expanded, /TARGET NEXT \(ELIGIBILITY CONDITIONAL\)/);
  assert.doesNotMatch(shown.expanded, /guaranteed to remain available/i);
}
assert.match(wr122Presentation.contradictoryNext.before.market.source, /ESPN/);
assert.equal(await page.locator('#wr122-presentation-fixture .recommendation-card').getAttribute('open'), null);
const wr122CardSummary = page.locator('#wr122-presentation-fixture .recommendation-card-summary');
await wr122CardSummary.focus();
assert.equal(await wr122CardSummary.evaluate(el => document.activeElement === el), true);
await wr122CardSummary.press('Space');
assert.equal(await page.locator('#wr122-presentation-fixture .recommendation-card').getAttribute('open'), '');
const wr122MarketSummary = page.locator('#wr122-presentation-fixture .recommendation-market-details summary');
await wr122MarketSummary.focus();
assert.equal(await wr122MarketSummary.evaluate(el => document.activeElement === el), true);
await wr122MarketSummary.press('Space');
assert.equal(await page.locator('#wr122-presentation-fixture .recommendation-market-details').getAttribute('open'), '');
await page.setViewportSize({width:390,height:844});
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
assert.equal(await page.locator('#wr122-presentation-fixture .recommendation-card-summary').isVisible(), true);
assert.equal(await page.locator('#wr122-presentation-fixture .recommendation-market-details').isVisible(), true);
await page.setViewportSize({width:1280,height:900});
await page.evaluate(() => document.getElementById('wr122-presentation-fixture').remove());

const websiteSettingsSync = await page.evaluate(async () => {
  const fields = ['pcTeams', 'pcSlot', 'pcRounds'].map(id => document.getElementById(id));
  const original = fields.map(field => field.value);
  const message = new Promise(resolve => {
    const listener = event => {
      if (event.source !== window || event.data?.type !== 'SETTINGS_UPDATE') return;
      window.removeEventListener('message', listener);
      resolve(event.data);
    };
    window.addEventListener('message', listener);
  });
  fields[0].value = '12';
  fields[1].value = '11';
  fields[2].value = '18';
  updatePickSettings();
  const observed = await message;
  fields.forEach((field, index) => { field.value = original[index]; });
  updatePickSettings();
  return {
    type: observed.type,
    settings: observed.settings,
    minVersion: observed.requiredExtensionVersion
  };
});
assert.equal(websiteSettingsSync.type, 'SETTINGS_UPDATE');
assert.deepEqual(websiteSettingsSync.settings, {teams:12, rounds:18, draftSlot:11, totalPicks:216});
assert.equal(websiteSettingsSync.minVersion, '0.9.14');

const rankingRefreshCenter = await page.evaluate(() => {
  openRankingsRefresh();
  const topRows = EMBEDDED_FANTASYPROS_2026_DATASET.filter(player => player.ecr != null).slice(0, 100).map((player, index) => ({
    RK: String(index + 1),
    'PLAYER NAME': player.name,
    TEAM: player.team,
    POS: player.pos + (player.posRank || ''),
    'BYE WEEK': player.bye,
    TIERS: String(player.fantasyProsTier || 1)
  }));
  const override = buildFantasyProsTop20Override(topRows, {name:'FantasyPros_Test.csv', lastModified:Date.now()});
  const result = {
    modalOpen: document.getElementById('rankings-refresh-modal').classList.contains('open'),
    apiRefreshRemoved: !document.getElementById('copy-fantasypros-diagnostics') && !document.body.textContent.includes('Refresh from FantasyPros API'),
    players: override.players.length,
    top20: override.top20Count,
    first: override.players[0].name,
    ecrPlayers: override.players.filter(player => player.ecr != null).length,
    adpOnly: override.players.filter(player => player.ecr == null).length
  };
  closeRankingsRefresh();
  return result;
});
assert.deepEqual(rankingRefreshCenter, {
  modalOpen:true, apiRefreshRemoved:true, players:717, top20:100, first:"Ja'Marr Chase", ecrPlayers:520, adpOnly:197
});

const jeffersonTurnFixture = await page.evaluate(() => {
  const original = {teams:LEAGUE_SIZE, slot:MY_DRAFT_SLOT, rounds:TOTAL_ROUNDS};
  const picks = [
    'Bijan Robinson', "Ja'Marr Chase", 'Jahmyr Gibbs', 'Christian McCaffrey',
    'Puka Nacua', 'Jaxon Smith-Njigba', 'Jonathan Taylor', 'James Cook III',
    'Amon-Ra St. Brown', 'Ashton Jeanty', 'CeeDee Lamb', 'Drake London', 'Trey McBride'
  ];
  document.getElementById('pcTeams').value = '12';
  document.getElementById('pcSlot').value = '11';
  document.getElementById('pcRounds').value = '16';
  LEAGUE_SIZE = 12;
  MY_DRAFT_SLOT = 11;
  TOTAL_ROUNDS = 16;
  picks.forEach((name, index) => {
    const row = findDraftRowByExpertName(name);
    if (!row) throw new Error('Missing turn fixture player: ' + name);
    row.classList.add(index === 10 ? 'drafted-mine' : 'drafted-other');
    row.setAttribute('data-pick', String(index + 1));
  });
  const state = buildLiveDraftDebugState();
  const jefferson = state.scored.find(player => player.name === 'Justin Jefferson');
  const brown = state.scored.find(player => player.name === 'Chase Brown');
  const result = {
    leader: state.scored[0] && state.scored[0].name,
    jefferson: jefferson && {ecr:jefferson.ecr, final:jefferson.finalScore, priority:jefferson.recommendationPriorityScore, survival:jefferson.recommendationSurvival},
    brown: brown && {ecr:brown.ecr, final:brown.finalScore, priority:brown.recommendationPriorityScore, survival:brown.recommendationSurvival}
  };
  picks.forEach(name => {
    const row = findDraftRowByExpertName(name);
    row.classList.remove('drafted-mine', 'drafted-other');
    row.removeAttribute('data-pick');
  });
  document.getElementById('pcTeams').value = String(original.teams);
  document.getElementById('pcSlot').value = String(original.slot);
  document.getElementById('pcRounds').value = String(original.rounds);
  LEAGUE_SIZE = original.teams;
  MY_DRAFT_SLOT = original.slot;
  TOTAL_ROUNDS = original.rounds;
  return result;
});
assert.equal(jeffersonTurnFixture.leader, 'Justin Jefferson', JSON.stringify(jeffersonTurnFixture));
const waiverBalance = await page.evaluate(() => {
  const quarterback = findDraftRowByExpertName('Josh Allen');
  quarterback.classList.add('drafted-mine');
  quarterback.setAttribute('data-pick', '39');
  const watch = getFinalWaiverWatch(6);
  const positions = watch.map(player => player.position);
  const html = buildWaiverWatchHtml(watch, false);
  quarterback.classList.remove('drafted-mine');
  quarterback.removeAttribute('data-pick');
  return {positions, html};
});
assert.equal(waiverBalance.positions.includes('QB'), false, JSON.stringify(waiverBalance.positions));
assert.ok(waiverBalance.positions.filter(position => position === 'RB').length >= 2);
assert.ok(waiverBalance.positions.filter(position => position === 'WR').length >= 2);
assert.match(waiverBalance.html, /RB depth/);
assert.match(waiverBalance.html, /WR upside/);
const espnMarketTiming = await page.evaluate(() => {
  const row = findDraftRowByExpertName('Justin Jefferson');
  const originalRank = row.getAttribute('data-espn-rank');
  const originalAdp = row.getAttribute('data-espn-adp');
  applyEspnDraftSnapshot({force:true, marketAdp:[{playerName:'Justin Jefferson', position:'WR', rank:8, adp:10.7}], picks:[]});
  const player = getDraftAssistantPlayers().find(item => item.name === 'Justin Jefferson');
  const valueCell = row.children[5].textContent.trim();
  const valueTitle = row.children[5].title;
  toggleAutoDraftTeam(2);
  const autoWeighted = getMarketTimingDetails(player, {currentPick:1, nextPick:20, teams:10});
  const autoPressed = document.querySelector('.auto-draft-team-toggle[data-team-slot="2"]').getAttribute('aria-pressed');
  toggleAutoDraftTeam(2);
  const result = {
    attribute:row.getAttribute('data-espn-adp'), liveBoardRank:row.getAttribute('data-espn-rank'), boardRank:player.espnRank,
    early:getFantasyProsMarketRank(player, {currentPick:14}),
    middle:getFantasyProsMarketRank(player, {currentPick:60}),
    late:getFantasyProsMarketRank(player, {currentPick:120}),
    fantasyPros:player.adp,
    marketCell:row.children[4].textContent.trim(),
    valueCell,
    valueTitle,
    note:row.querySelector('.notecell').textContent,
    status:document.getElementById('espn-sync-status').textContent,
    autoWeighted:autoWeighted.boardWeight, autoPressed
  };
  if (originalAdp == null) row.removeAttribute('data-espn-adp');
  else row.setAttribute('data-espn-adp', originalAdp);
  if (originalRank == null) row.removeAttribute('data-espn-rank');
  else row.setAttribute('data-espn-rank', originalRank);
  updateDraftRowMarketCell(row);
  updateDraftRowNoteCell(row);
  updateDraftRowValueCell(row);
  return result;
});
assert.equal(espnMarketTiming.attribute, '10.7');
assert.equal(espnMarketTiming.liveBoardRank, '8');
assert.equal(espnMarketTiming.boardRank, 8);
assert.equal(espnMarketTiming.marketCell, '#8 / 10.7');
assert.equal(espnMarketTiming.valueCell, '+0.7');
assert.match(espnMarketTiming.valueTitle, /ESPN board \+ ESPN ADP 8\.7 minus FantasyPros ECR 8 = \+0\.7/);
assert.match(espnMarketTiming.note, /FantasyPros PPR ECR #8/);
assert.match(espnMarketTiming.note, /ESPN board #8/);
assert.match(espnMarketTiming.note, /live ESPN ADP 10\.7/);
assert.ok(Math.abs(espnMarketTiming.early - 8.675) < 0.001);
assert.ok(Math.abs(espnMarketTiming.middle - 8.945) < 0.001);
assert.ok(Math.abs(espnMarketTiming.late - 9.35) < 0.001);
assert.notEqual(espnMarketTiming.early, espnMarketTiming.fantasyPros);
assert.match(espnMarketTiming.status, /Market 300\/1/);
assert.equal(espnMarketTiming.autoPressed, 'true');
assert.ok(espnMarketTiming.autoWeighted > 0.75);
const opponentRosterOwnership = await page.evaluate(() => {
  const row = findDraftRowByExpertName('Justin Jefferson');
  row.classList.add('drafted-other');
  row.setAttribute('data-pick', '1');
  row.setAttribute('data-team-slot', '3');
  const rosters = getDraftedRosterByTeam(12);
  row.classList.remove('drafted-other');
  row.removeAttribute('data-pick');
  row.removeAttribute('data-team-slot');
  return {team1:rosters[1].WR, team3:rosters[3].WR};
});
assert.deepEqual(opponentRosterOwnership, {team1:0, team3:1});
await page.locator('.recommendation-card-summary').click();
assert.equal(await recommendationCard.getAttribute('open'), '');
assert.equal(await page.locator('.recommendation-factor').count(), 4);
assert.equal(await page.locator('.recommendation-market-details summary').textContent(), 'Why this survival?');
assert.match(await page.locator('.recommendation-market-details').textContent(), /estimated market pick/);
assert.equal(await page.getByRole('progressbar').count(), 4);
const recommendationRender = await page.evaluate(() => {
  const element = document.getElementById('recommended-pick-text');
  const card = element.querySelector('.recommendation-card');
  const shared = buildLiveDraftDebugState();
  const started = performance.now();
  for (let index = 0; index < 10; index++) updateRecommendedPick(shared);
  return {
    sameCard: card === element.querySelector('.recommendation-card'),
    stayedOpen: element.querySelector('.recommendation-card').open,
    totalMs: performance.now() - started
  };
});
assert.equal(recommendationRender.sameCard, true);
assert.equal(recommendationRender.stayedOpen, true);
assert.ok(recommendationRender.totalMs < 1000, `Recommendation render regression: ${recommendationRender.totalMs.toFixed(1)}ms`);

await page.evaluate(() => setBoardView('overall', {persist:false}));
const first = page.locator('tr.draftrow').first();
const t0 = performance.now();
await first.click();
const markingMs = performance.now() - t0;
assert.ok(markingMs < 2000, `Draft marking regression: ${markingMs.toFixed(1)}ms`);
assert.equal(await first.evaluate(row => row.classList.contains('drafted-other')), true);
await first.click();
assert.equal(await first.evaluate(row => row.classList.contains('drafted-other')), false);
await page.getByRole('button', {name:'Mine', exact:true}).click();
await first.press('Enter');
assert.equal(await first.evaluate(row => row.classList.contains('drafted-mine')), true);
assert.equal(await page.getByRole('button', {name:'Taken', exact:true}).getAttribute('aria-pressed'), 'true');
await page.locator('body').press('m');
assert.equal(await page.getByRole('button', {name:'Mine', exact:true}).getAttribute('aria-pressed'), 'true');
await page.locator('body').press('M');
assert.equal(await page.getByRole('button', {name:'Taken', exact:true}).getAttribute('aria-pressed'), 'true');
await page.getByPlaceholder('Search player or team...').fill('m');
assert.equal(await page.getByRole('button', {name:'Taken', exact:true}).getAttribute('aria-pressed'), 'true');
await page.getByPlaceholder('Search player or team...').fill('');
await page.evaluate(() => setBoardView('position', {persist:false}));

const sessionBefore = await page.locator('#draftSessionSelect option').count();
// Separate the session lifecycle scenario from debounced saves scheduled by
// earlier board/recommendation assertions on this deliberately long-lived page.
await waitForWarRoomQuiescence(page);
await page.locator('#draft-manage > summary').click();
assert.equal(await page.locator('#draft-manage').getAttribute('open'), '');
await page.getByRole('button', {name:'New Draft'}).click();
assert.equal(await page.locator('#draftSessionSelect option').count(), sessionBefore + 1);
assert.equal(await page.locator('tr.drafted-mine,tr.drafted-other').count(), 0);
const draftToDelete = await page.locator('#draftSessionSelect').inputValue();
await page.getByRole('button', {name:'Delete selected draft'}).click();
assert.equal(await page.getByRole('button', {name:/Confirm deletion of/}).innerText(), 'Confirm Delete');
await page.getByRole('button', {name:/Confirm deletion of/}).click();
// Prove the deleted key stays absent after all resulting render/save work has
// drained, rather than racing the assertion against a pending autosave.
await waitForWarRoomQuiescence(page);
assert.equal(await page.locator('#draftSessionSelect option').count(), sessionBefore);
assert.notEqual(await page.locator('#draftSessionSelect').inputValue(), draftToDelete);
assert.equal(await page.evaluate(id => localStorage.getItem('draft-state-v1:' + id), draftToDelete), null);
if (sessionBefore === 1) {
  const lastDraftId = await page.locator('#draftSessionSelect').inputValue();
  await page.getByRole('button', {name:'Delete selected draft'}).click();
  await page.getByRole('button', {name:/Confirm deletion of/}).click();
  assert.equal(await page.locator('#draftSessionSelect option').count(), 1);
  assert.equal(await page.locator('#draftSessionSelect option').innerText(), 'Draft 1');
  assert.notEqual(await page.locator('#draftSessionSelect').inputValue(), lastDraftId);
  assert.equal(await page.locator('tr.drafted-mine,tr.drafted-other').count(), 0);
}

const strategyPolish = await page.evaluate(() => {
  const originalSettings = {teams:LEAGUE_SIZE, slot:MY_DRAFT_SLOT, rounds:TOTAL_ROUNDS};
  document.getElementById('pcTeams').value = '12';
  document.getElementById('pcSlot').value = '11';
  document.getElementById('pcRounds').value = '16';
  LEAGUE_SIZE = 12;
  MY_DRAFT_SLOT = 11;
  TOTAL_ROUNDS = 16;
  const byeAdjustment = calculateByeWeekCongestionAdjustment(
    {position:'WR', bye:'10'},
    {currentPick:110, teams:12, rosterByeCounts:{'10':4}}
  );
  const rows = Array.from(document.querySelectorAll('tr.draftrow')).slice(0, 16);
  rows.forEach((row, index) => {
    row.classList.add('drafted-mine');
    if (index < 11) row.setAttribute('data-pick', String(index + 1));
  });
  latestEspnSyncMeta = {draftComplete:true, expectedCompleted:192, numberedPicks:11};
  window.latestEspnSyncMeta = latestEspnSyncMeta;
  const state = getDraftAssistantState();
  const completion = getDraftCompletionStatus(state);
  updatePickCounter();
  const counter = document.getElementById('pick-counter-text').textContent;
  const report = buildFinalDraftSummaryHtml([
    {name:'WR One',position:'WR',pick:11,ecr:6,adp:8,bye:'10',ecrValue:5,marketValue:3},
    {name:'WR Two',position:'WR',pick:14,ecr:10,adp:17,bye:'11',ecrValue:4,marketValue:-3},
    {name:'WR Three',position:'WR',pick:35,ecr:24,adp:35,bye:'10',ecrValue:11,marketValue:0},
    {name:'QB One',position:'QB',pick:38,ecr:28,adp:53,bye:'11',ecrValue:10,marketValue:15},
    {name:'RB One',position:'RB',pick:59,ecr:54,adp:55,bye:'10',ecrValue:5,marketValue:-4},
    {name:'RB Two',position:'RB',pick:62,ecr:60,adp:50,bye:'11',ecrValue:2,marketValue:-12},
    {name:'TE One',position:'TE',pick:83,ecr:72,adp:73,bye:'10',ecrValue:11,marketValue:-10},
    {name:'RB Three',position:'RB',pick:86,ecr:70,adp:73,bye:'11',ecrValue:16,marketValue:-13},
    {name:'WR Four',position:'WR',pick:110,ecr:73,adp:100,bye:'10',ecrValue:37,marketValue:-10},
    {name:'Late K',position:'K',pick:180,ecr:240,adp:210,bye:'8',ecrValue:-60,marketValue:-30},
    {name:'Late DST',position:'DST',pick:191,ecr:250,adp:220,bye:'9',ecrValue:-59,marketValue:-29}
  ], {QB:1,RB:3,WR:4,TE:1,K:1,DST:1}, 9, 11.2, 'A+');
  rows.forEach(row => {
    row.classList.remove('drafted-mine');
    row.removeAttribute('data-pick');
  });
  latestEspnSyncMeta = {draftComplete:false, expectedCompleted:0, numberedPicks:0};
  window.latestEspnSyncMeta = latestEspnSyncMeta;
  document.getElementById('pcTeams').value = String(originalSettings.teams);
  document.getElementById('pcSlot').value = String(originalSettings.slot);
  document.getElementById('pcRounds').value = String(originalSettings.rounds);
  LEAGUE_SIZE = originalSettings.teams;
  MY_DRAFT_SLOT = originalSettings.slot;
  TOTAL_ROUNDS = originalSettings.rounds;
  return {byeAdjustment, completion, counter, report};
});
assert.equal(strategyPolish.byeAdjustment, -9);
assert.equal(strategyPolish.completion.provisional, true);
assert.match(strategyPolish.counter, /Draft appears complete/);
assert.match(strategyPolish.counter, /11 of 192 numbered picks synced/);
assert.match(strategyPolish.report, /PROVISIONAL FINAL REPORT/);
assert.match(strategyPolish.report, /WR foundation/);
assert.match(strategyPolish.report, /Bye-week concentration/);
assert.match(strategyPolish.report, /first RB to <b>Round 5/);
assert.match(strategyPolish.report, /reserved <b>K for Round 15/);
assert.match(strategyPolish.report, /reserved <b>DST for Round 16/);
assert.doesNotMatch(strategyPolish.report, /Late K at #180/);
assert.doesNotMatch(strategyPolish.report, /Late DST at #191/);

const completedCounter = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('tr.draftrow')).slice(0, 160);
  rows.forEach((row, index) => {
    row.classList.add(index % 16 === 9 ? 'drafted-mine' : 'drafted-other');
    row.setAttribute('data-pick', String(index + 1));
  });
  updatePickCounter();
  const counter = document.getElementById('pick-counter-text').textContent;
  rows.forEach(row => {
    row.classList.remove('drafted-mine', 'drafted-other');
    row.removeAttribute('data-pick');
  });
  return counter;
});
assert.match(completedCounter, /Draft complete/);
assert.match(completedCounter, /160 picks/);
const auditPortfolio = await page.evaluate(() => getRecommendationAuditPortfolioSummary());
assert.equal(typeof auditPortfolio.reviewReady, 'boolean');
assert.equal(typeof auditPortfolio.strongReviewSample, 'boolean');
assert.equal(auditPortfolio.reviewReady, false);
await page.getByRole('button', {name:'Mock Audit'}).click();
assert.equal(await page.locator('#mock-audit-modal').getAttribute('aria-hidden'), 'false');
assert.match(await page.locator('#mock-audit-content').innerText(), /CLEAN MOCKS/);
assert.match(await page.locator('#mock-audit-content').innerText(), /No weights are changed automatically/);
assert.equal(await page.getByRole('button', {name:'Export JSON'}).count(), 1);
assert.equal(await page.getByRole('button', {name:'Export CSV'}).count(), 1);
const auditExport = await page.evaluate(() => buildRecommendationAuditExport());
assert.equal(auditExport.scoringAutoAdjusted, false);
assert.deepEqual(auditExport.reviewThresholds, {minimumCleanMocks:10, strongSampleCleanMocks:20});
await page.getByRole('button', {name:'Done'}).click();
assert.equal(await page.locator('#mock-audit-modal').getAttribute('aria-hidden'), 'true');

await page.getByRole('button', {name:/My Draft/}).click();
assert.equal(await page.locator('#myteam-panel').getAttribute('aria-hidden'), 'false');
assert.match(await page.locator('#myteam-starter-count').innerText(), /\/ 9 starters/);

await page.setViewportSize({width:390,height:844});
const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const overflowElements = await page.evaluate(() => [...document.querySelectorAll('body *')].map(el => ({tag:el.tagName, id:el.id, cls:el.className, right:Math.round(el.getBoundingClientRect().right), width:Math.round(el.getBoundingClientRect().width)})).filter(item => item.right > document.documentElement.clientWidth + 1).sort((a,b) => b.right-a.right).slice(0,10));
assert.equal(mobileOverflow, 0, JSON.stringify(overflowElements));

await page.addScriptTag({url:'developer-tools.js'});
const suites = await page.evaluate(async () => {
  const capture = async fn => await fn();
  return {
    draft: await capture(() => runDraftEngineTests({quiet:true})),
    turn: await capture(() => runTurnPackageTests()),
    explanation: await capture(() => runRecommendationExplanationTests()),
    sanity: await capture(() => runCalculationSanityTests()),
    thresholds: await capture(() => runRecommendationThresholdTests()),
    roadmap: await capture(() => runFantasyProsRoadmapSimulations()),
    espn: await capture(() => runEspnSyncContractTests())
  };
});
const auditSummary = await page.evaluate(() => {
  const original = recommendationAudit;
  recommendationAudit = [
    {resolved:true, calibrationEligible:true, survived:true},
    {resolved:true, calibrationEligible:true, survived:false},
    {resolved:true, calibrationEligible:false, noisyDraft:true, survived:false}
  ];
  const summary = getRecommendationAuditSummary();
  recommendationAudit = original;
  return summary;
});
assert.equal(auditSummary.calibrationEligible, 2);
assert.equal(auditSummary.noisyDraftDecisions, 1);
assert.equal(auditSummary.observedSurvivalRate, 50);
assert.equal(auditSummary.minimumSampleReached, false);
const auditClassification = await page.evaluate(() => {
  const entry = {decisionPick:1, nextPick:20};
  const normal = Array.from({length:18}, (_, index) => ({pick:index + 2, ecr:index + 2}));
  const noisy = normal.map((item, index) => ({pick:item.pick, ecr:index < 7 ? item.pick + 40 : item.ecr}));
  return {
    selected: classifyRecommendationAuditOutcome(entry, 1, normal),
    incomplete: classifyRecommendationAuditOutcome(entry, null, normal.slice(0, 2)),
    noisy: classifyRecommendationAuditOutcome(entry, null, noisy),
    drafted: classifyRecommendationAuditOutcome(entry, 10, normal)
  };
});
assert.equal(auditClassification.selected.censored, true);
assert.equal(auditClassification.selected.calibrationEligible, false);
assert.equal(auditClassification.incomplete.incomplete, true);
assert.equal(auditClassification.incomplete.calibrationEligible, false);
assert.equal(auditClassification.noisy.noisyDraft, true);
assert.equal(auditClassification.noisy.calibrationEligible, false);
assert.equal(auditClassification.drafted.survived, false);
assert.equal(auditClassification.drafted.calibrationEligible, true);
const auditDeduped = await page.evaluate(() => {
  const original = recommendationAudit;
  recommendationAudit = [];
  const state = buildLiveDraftDebugState();
  const primary = state.scored[0];
  const base = calculateDraftRecommendation(primary, state.scored, state.context);
  updateRecommendationAudit(Object.assign({}, base, {recommendation:'CONSIDER'}), primary, state);
  updateRecommendationAudit(Object.assign({}, base, {recommendation:'DRAFT'}), primary, state);
  const result = {length:recommendationAudit.length, action:recommendationAudit[0] && recommendationAudit[0].action};
  recommendationAudit = original;
  return result;
});
assert.equal(auditDeduped.length, 1);
assert.equal(auditDeduped.action, 'DRAFT');

await browser.close();
if (server) await new Promise(resolve => server.close(resolve));
if (errors.length) throw new Error('Browser console errors: ' + errors.join(' | '));
const suiteSummary = Object.fromEntries(Object.entries(suites).map(([name, result]) => [name, {passed:result.passed, failed:result.failed, total:result.total}]));
Object.entries(suites).forEach(([name, result]) => {
  assert.equal(result.failed || 0, 0, name + ': ' + JSON.stringify((result.results || []).filter(item => !item.passed)));
});
console.log(JSON.stringify({startup, markingMs:Number(markingMs.toFixed(1)), cachedRecommendationRenderMs:Number(recommendationRender.totalMs.toFixed(1)), mobileOverflow, suites:suiteSummary}, null, 2));
