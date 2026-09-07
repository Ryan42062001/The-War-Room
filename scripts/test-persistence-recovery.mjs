import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const {chromium} = createRequire(import.meta.url)('playwright');

const PLAYER_UNIVERSE = 717;
const SEED = 0x5420b4c2;
const TEAMS = 10;
const ROUNDS = 16;
const DRAFT_SLOT = 7;

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};
const server = process.env.WAR_ROOM_URL ? null : http.createServer((request, response) => {
  const relative = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\//, '');
  const filePath = path.join(root, relative);
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.statusCode = 404;
      response.end('not found');
      return;
    }
    response.statusCode = 200;
    response.setHeader('Content-Type', mimeTypes[path.extname(filePath)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.end(data);
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

function diffDigest(expected, actual) {
  const left = JSON.stringify(expected);
  const right = JSON.stringify(actual);
  let index = 0;
  while (index < left.length && index < right.length && left[index] === right[index]) index++;
  const start = Math.max(0, index - 180);
  return {
    index,
    expected:left.slice(start, index + 700),
    actual:right.slice(start, index + 700)
  };
}

function failRecovery({phase, operation, operationType, player, pick, invariant, state}) {
  const error = new Error([
    'Deterministic persistence/recovery integration failure',
    `seed=${SEED}`,
    `phase=${phase}`,
    `operation=${operation}`,
    `operationType=${operationType || 'CHECKPOINT'}`,
    `player=${player || 'n/a'}`,
    `pick=${pick == null ? 'n/a' : pick}`,
    `invariant=${invariant}`,
    `state=${JSON.stringify(state || {})}`
  ].join('\n'));
  error.name = 'PersistenceRecoveryInvariantFailure';
  throw error;
}

async function waitForApp(page, {resilience = true} = {}) {
  await page.waitForSelector('tr.draftrow', {state:'attached'});
  await page.waitForFunction(() => document.querySelectorAll('tr.draftrow').length === 717);
  if (resilience) {
    await page.waitForFunction(() => Boolean(window.WarRoomResilience && window.WarRoomResilience.installed));
  }
}

async function flushSave(page, meta) {
  const result = await page.evaluate(() => {
    if (typeof _saveTimer !== 'undefined' && _saveTimer) {
      clearTimeout(_saveTimer);
      _saveTimer = null;
    }
    return saveState();
  });
  if (!result) failRecovery({...meta, invariant:'explicit save checkpoint failed', state:{}});
}

async function configureDraft(page) {
  const result = await page.evaluate(({teams, rounds, slot}) => {
    const teamsField = document.getElementById('pcTeams');
    const roundsField = document.getElementById('pcRounds');
    const slotField = document.getElementById('pcSlot');
    if (teamsField) teamsField.value = String(teams);
    if (roundsField) roundsField.value = String(rounds);
    if (slotField) {
      slotField.max = String(teams);
      slotField.value = String(slot);
    }
    LEAGUE_SIZE = teams;
    TOTAL_ROUNDS = rounds;
    MY_DRAFT_SLOT = slot;
    if (typeof triggerAllBoardUpdates === 'function') triggerAllBoardUpdates({deferIntelligence:true});
    return saveState();
  }, {teams:TEAMS, rounds:ROUNDS, slot:DRAFT_SLOT});
  assert.equal(result, true, 'initial draft configuration should save');
}

async function getPlayerUniverse(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('tr.draftrow')).map(row => ({
    name:row.getAttribute('data-name'),
    position:row.getAttribute('data-pos')
  })));
}

async function captureBoardSemantic(page) {
  return page.evaluate(() => {
    const drafted = Array.from(document.querySelectorAll('tr.draftrow')).filter(row =>
      row.classList.contains('drafted-mine') || row.classList.contains('drafted-other')
    ).map(row => ({
      name:row.getAttribute('data-name'),
      status:row.classList.contains('drafted-mine') ? 'mine' : 'taken',
      pick:Number(row.getAttribute('data-pick')) || null,
      teamSlot:Number(row.getAttribute('data-team-slot')) || null,
      source:row.getAttribute('data-sync-source') || null,
      espnPlayerId:row.getAttribute('data-espn-player-id') || null
    })).sort((left, right) => left.pick - right.pick || String(left.name).localeCompare(String(right.name)));
    return {
      activeDraftSessionId:String(window.activeDraftSessionId || ''),
      settings:{
        teams:Number(document.getElementById('pcTeams')?.value || 0),
        rounds:Number(document.getElementById('pcRounds')?.value || 0),
        slot:Number(document.getElementById('pcSlot')?.value || 0)
      },
      completed:typeof getCompletedDraftPickCount === 'function' ? getCompletedDraftPickCount() : -1,
      drafted
    };
  });
}

async function captureSessionSemantics(page) {
  return page.evaluate(() => {
    function orderedEntries(object, mapper) {
      return Object.keys(object || {}).sort().map(key => [key, mapper ? mapper(object[key]) : object[key]]);
    }
    const sessions = readDraftSessionRegistry().map(session => ({
      id:session.id,
      name:session.name,
      draftKey:session.draftKey || null
    }));
    const payloads = {};
    sessions.forEach(session => {
      const read = readDraftSessionPayload(session.id);
      const payload = read && read.payload;
      payloads[session.id] = payload ? {
        teams:payload.teams,
        rounds:payload.rounds,
        slot:payload.slot,
        customBoard:Boolean(payload.customBoard),
        autoDraftTeamSlots:(payload.autoDraftTeamSlots || []).slice(),
        state:orderedEntries(payload.state),
        draftMeta:orderedEntries(payload.draftMeta, metadata => ({
          pick:Number(metadata && metadata.pick) || null,
          teamSlot:Number(metadata && metadata.teamSlot) || null,
          source:metadata && metadata.source || null,
          espnPlayerId:metadata && metadata.espnPlayerId || null
        }))
      } : null;
    });
    return {
      activeDraftSessionId:String(window.activeDraftSessionId || ''),
      sessions,
      payloads
    };
  });
}

async function captureWarRoomStorage(page) {
  return page.evaluate(() => WarRoomResilience.collectStorageSnapshot());
}

async function assertDeepSemantic(actualPromise, expected, meta, invariant) {
  const actual = await actualPromise;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failRecovery({...meta, invariant, state:diffDigest(expected, actual)});
  }
  return actual;
}

async function assertActiveInvariants(page, meta, {recommendations = false} = {}) {
  const result = await page.evaluate(({recommendations}) => {
    const rows = Array.from(document.querySelectorAll('tr.draftrow'));
    const drafted = rows.filter(row => row.classList.contains('drafted-mine') || row.classList.contains('drafted-other'));
    const available = rows.length - drafted.length;
    const completed = getCompletedDraftPickCount();
    const minimal = extra => Object.assign({
      rows:rows.length,
      available,
      drafted:drafted.length,
      completed,
      activeDraftSessionId:String(window.activeDraftSessionId || ''),
      recent:drafted.slice(-5).map(row => ({
        name:row.getAttribute('data-name'),
        status:row.classList.contains('drafted-mine') ? 'mine' : 'taken',
        pick:row.getAttribute('data-pick'),
        source:row.getAttribute('data-sync-source')
      }))
    }, extra || {});
    const violation = (name, extra) => ({ok:false, invariant:name, state:minimal(extra)});

    if (rows.length !== 717) return violation('player universe row count changed');
    if (available + drafted.length !== 717) return violation('drafted + available != 717');
    if (completed !== drafted.length) return violation('completed count disagrees with drafted rows');

    const names = new Set();
    const picks = new Set();
    for (const row of drafted) {
      if (row.classList.contains('drafted-mine') && row.classList.contains('drafted-other')) {
        return violation('row is both Mine and Taken', {offender:row.getAttribute('data-name')});
      }
      const canonical = typeof canonicalExpertPlayerName === 'function'
        ? canonicalExpertPlayerName(row.getAttribute('data-name'))
        : String(row.getAttribute('data-name') || '').toLowerCase();
      if (names.has(canonical)) return violation('duplicate drafted player', {offender:canonical});
      names.add(canonical);
      const pick = Number(row.getAttribute('data-pick'));
      if (!Number.isInteger(pick) || pick < 1) return violation('drafted row missing valid pick metadata', {offender:row.getAttribute('data-name')});
      if (picks.has(pick)) return violation('duplicate pick ownership', {duplicatePick:pick});
      picks.add(pick);
      const teamSlot = Number(row.getAttribute('data-team-slot'));
      if (!Number.isInteger(teamSlot) || teamSlot < 1) return violation('drafted row missing team-slot metadata', {offender:row.getAttribute('data-name'), pick});
    }

    if (recommendations) {
      const debug = typeof buildLiveDraftDebugState === 'function' ? buildLiveDraftDebugState() : null;
      const candidates = Array.isArray(debug && debug.scored) ? debug.scored.slice(0, 12) : [];
      if (!candidates.length && completed < TEAMS * ROUNDS) return violation('recommendation candidate set unexpectedly empty');
      for (const candidate of candidates) {
        const row = findDraftRowByExpertName(candidate.name);
        if (!row || row.classList.contains('drafted-mine') || row.classList.contains('drafted-other') || candidate.available === false) {
          return violation('recommendation candidate is not available', {candidate:candidate.name});
        }
        if (!Number.isFinite(Number(candidate.finalScore))) {
          return violation('recommendation candidate final score is non-finite', {candidate:candidate.name, finalScore:candidate.finalScore});
        }
      }
    }
    return {ok:true, completed, available};
  }, {recommendations});

  if (!result.ok) failRecovery({...meta, invariant:result.invariant, state:result.state});
  return result;
}

async function draftPick(page, player, pick, meta) {
  const teamSlot = snakeTeamForPick(pick, TEAMS);
  const desired = teamSlot === DRAFT_SLOT ? 'mine' : 'taken';
  const result = await page.evaluate(({player, pick, desired}) => {
    const row = findDraftRowByExpertName(player);
    if (!row) return {ok:false, reason:'row missing'};
    const before = getCompletedDraftPickCount();
    if (before + 1 !== pick) return {ok:false, reason:'derived pick mismatch before mutation', before, expectedPick:pick};
    setDraftMarkMode(desired);
    toggleDraft(row);
    return {
      ok:getDraftRowStatus(row) === desired && Number(row.getAttribute('data-pick')) === pick,
      status:getDraftRowStatus(row),
      actualPick:Number(row.getAttribute('data-pick')),
      teamSlot:Number(row.getAttribute('data-team-slot'))
    };
  }, {player, pick, desired});
  if (!result.ok) {
    failRecovery({...meta, player, pick, invariant:'draft operation failed', state:result});
  }
  if (result.teamSlot !== teamSlot) {
    failRecovery({...meta, player, pick, invariant:'snake ownership metadata mismatch', state:{expectedTeamSlot:teamSlot, actualTeamSlot:result.teamSlot}});
  }
}

async function draftRange(page, plan, startPick, endPick, phase, operationRef) {
  for (let pick = startPick; pick <= endPick; pick++) {
    operationRef.value++;
    const player = plan[pick - 1].name;
    const meta = {phase, operation:operationRef.value, operationType:'DRAFT_PICK'};
    await draftPick(page, player, pick, meta);
    await assertActiveInvariants(page, {...meta, player, pick}, {recommendations:pick % 8 === 0});
  }
}

async function persistedCorrection(page, plan, operationRef) {
  const pick = 45;
  const wrongPlayer = plan[70].name;
  const correctPlayer = plan[pick - 1].name;
  operationRef.value++;
  let meta = {phase:'session-a-correction', operation:operationRef.value, operationType:'PERSIST_WRONG_PICK', player:wrongPlayer, pick};
  await draftPick(page, wrongPlayer, pick, meta);
  await flushSave(page, meta);
  const wrongPersisted = await captureBoardSemantic(page);
  await page.reload({waitUntil:'load'});
  await waitForApp(page);
  await assertDeepSemantic(captureBoardSemantic(page), wrongPersisted, meta, 'wrong pick persistence checkpoint changed on reload');

  operationRef.value++;
  meta = {phase:'session-a-correction', operation:operationRef.value, operationType:'UNDO_AND_CORRECT', player:correctPlayer, pick};
  const correction = await page.evaluate(({wrongPlayer, correctPlayer, pick}) => {
    const wrong = findDraftRowByExpertName(wrongPlayer);
    const correct = findDraftRowByExpertName(correctPlayer);
    if (!wrong || !correct) return {ok:false, reason:'correction row missing'};
    const wrongStatus = getDraftRowStatus(wrong);
    setDraftMarkMode(wrongStatus === 'mine' ? 'mine' : 'taken');
    toggleDraft(wrong);
    if (getDraftRowStatus(wrong) !== 'available' || getCompletedDraftPickCount() !== pick - 1) {
      return {ok:false, reason:'wrong pick did not clear', wrongStatus:getDraftRowStatus(wrong), completed:getCompletedDraftPickCount()};
    }
    const teamSlot = getSnakeDraftTeamForPick(pick, LEAGUE_SIZE).teamSlot;
    const desired = Number(teamSlot) === Number(MY_DRAFT_SLOT) ? 'mine' : 'taken';
    setDraftMarkMode(desired);
    toggleDraft(correct);
    return {
      ok:getDraftRowStatus(correct) === desired && Number(correct.getAttribute('data-pick')) === pick,
      wrongStatus:getDraftRowStatus(wrong),
      correctStatus:getDraftRowStatus(correct),
      completed:getCompletedDraftPickCount()
    };
  }, {wrongPlayer, correctPlayer, pick});
  if (!correction.ok) failRecovery({...meta, invariant:'supported correction failed', state:correction});
  await flushSave(page, meta);
  await assertActiveInvariants(page, meta, {recommendations:true});
}

function buildEspnSnapshot(plan, count) {
  return {
    config:{teams:TEAMS, rounds:ROUNDS, draftSlot:DRAFT_SLOT},
    expectedCompleted:count,
    draftComplete:false,
    picks:plan.slice(0, count).map((player, index) => {
      const pick = index + 1;
      const teamSlot = snakeTeamForPick(pick, TEAMS);
      return {
        overallPick:pick,
        playerName:player.name,
        position:player.position,
        teamSlot,
        teamId:`team-${teamSlot}`,
        isMine:teamSlot === DRAFT_SLOT,
        method:'api',
        espnPlayerId:`espn-${String(pick).padStart(3, '0')}`
      };
    })
  };
}

async function applyEspnCheckpoint(page, plan, count, meta) {
  const snapshot = buildEspnSnapshot(plan, count);
  const result = await page.evaluate(snapshot => WarRoomEspnSync.applySnapshot(snapshot), snapshot);
  if (!result || result.applied !== count || (result.unmatched && result.unmatched.length)) {
    failRecovery({...meta, invariant:'ESPN authoritative checkpoint did not apply cleanly', state:result});
  }
  await flushSave(page, meta);
  await assertActiveInvariants(page, meta, {recommendations:true});
  const metadata = await page.evaluate(count => {
    const row = Array.from(document.querySelectorAll('tr.draftrow')).find(candidate => Number(candidate.getAttribute('data-pick')) === count);
    return row ? {
      name:row.getAttribute('data-name'),
      pick:Number(row.getAttribute('data-pick')),
      teamSlot:Number(row.getAttribute('data-team-slot')),
      source:row.getAttribute('data-sync-source'),
      espnPlayerId:row.getAttribute('data-espn-player-id')
    } : null;
  }, count);
  if (!metadata || metadata.source !== 'espn' || metadata.espnPlayerId !== `espn-${String(count).padStart(3, '0')}`) {
    failRecovery({...meta, invariant:'ESPN-owned pick metadata missing before reload', state:{metadata}});
  }
  return metadata;
}

async function assertFailedSessionSwitchIsAtomic(page, targetSessionId, meta) {
  const before = await captureBoardSemantic(page);
  const result = await page.evaluate(targetSessionId => {
    const original = window.writeDraftStorageValue;
    let injected = false;
    window.writeDraftStorageValue = function(key, value) {
      if (!injected && key === ACTIVE_DRAFT_SESSION_KEY) {
        injected = true;
        return false;
      }
      return original(key, value);
    };
    let switched;
    try {
      switched = switchDraftSession(targetSessionId);
    } finally {
      window.writeDraftStorageValue = original;
    }
    return {switched, injected, activeDraftSessionId:String(window.activeDraftSessionId || '')};
  }, targetSessionId);
  if (result.switched !== false || result.injected !== true || result.activeDraftSessionId !== before.activeDraftSessionId) {
    failRecovery({...meta, invariant:'failed session switch did not abort cleanly', state:result});
  }
  await assertDeepSemantic(captureBoardSemantic(page), before, meta, 'failed session switch partially changed authoritative board state');
}

async function assertFailedBackupRestoreRollsBack(page, backup, meta) {
  await flushSave(page, meta);
  const beforeStorage = await captureWarRoomStorage(page);
  const beforeBoard = await captureBoardSemantic(page);
  const result = await page.evaluate(backup => {
    const keys = Object.keys(backup.storage).sort();
    const targetKey = keys[Math.min(2, Math.max(0, keys.length - 1))];
    const original = Storage.prototype.setItem;
    let injected = false;
    let message = '';
    Storage.prototype.setItem = function(key, value) {
      if (!injected && String(key) === targetKey) {
        injected = true;
        throw new DOMException('Injected deterministic restore failure', 'QuotaExceededError');
      }
      return original.call(this, key, value);
    };
    try {
      WarRoomResilience.restoreBackupObject(backup);
    } catch (error) {
      message = String(error && error.message || error);
    } finally {
      Storage.prototype.setItem = original;
    }
    return {injected, message, targetKey};
  }, backup);
  if (!result.injected || !result.message) {
    failRecovery({...meta, invariant:'backup restore failure injection did not fire', state:result});
  }
  await assertDeepSemantic(captureWarRoomStorage(page), beforeStorage, meta, 'failed backup restore did not roll storage back exactly');
  await assertDeepSemantic(captureBoardSemantic(page), beforeBoard, meta, 'failed backup restore changed live authoritative board state');
}

async function ensureServiceWorkerControl(page, expectedBoard, meta) {
  await page.waitForFunction(() => Boolean(window.WarRoomResilience && window.WarRoomResilience.offlineState.registered));
  await page.evaluate(() => navigator.serviceWorker.ready);
  let controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  if (!controlled) {
    await page.reload({waitUntil:'load'});
    await waitForApp(page);
    await assertDeepSemantic(captureBoardSemantic(page), expectedBoard, meta, 'service-worker activation reload changed saved draft state');
    controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  }
  if (!controlled) failRecovery({...meta, invariant:'service worker never controlled the draft page', state:{}});
}

const launchOptions = {headless:true};
if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;
const browser = await chromium.launch(launchOptions);
const context = await browser.newContext({viewport:{width:1280,height:900}});
const page = await context.newPage();
const browserErrors = [];
page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()); });
page.on('pageerror', error => browserErrors.push(error.message));
const startedAt = performance.now();
const operation = {value:0};

try {
  await page.goto(appUrl, {waitUntil:'load'});
  await waitForApp(page);
  await configureDraft(page);

  const universe = await getPlayerUniverse(page);
  assert.equal(universe.length, PLAYER_UNIVERSE, 'player universe must contain 717 rows');
  const plan = shuffled(universe, SEED);
  const sessionAPlan = plan.slice(0, 90);
  const sessionBPlan = plan.slice(180, 270);
  const sessionAId = await page.evaluate(() => String(window.activeDraftSessionId || ''));
  assert.ok(sessionAId, 'default session id should exist');

  await draftRange(page, sessionAPlan, 1, 24, 'session-a-before-reload', operation);
  let meta = {phase:'session-a-hard-reload', operation:++operation.value, operationType:'SAVE_RELOAD'};
  await flushSave(page, meta);
  const a24 = await captureBoardSemantic(page);
  await page.reload({waitUntil:'load'});
  await waitForApp(page);
  await assertDeepSemantic(captureBoardSemantic(page), a24, meta, 'hard reload changed session A at pick 24');
  await draftRange(page, sessionAPlan, 25, 44, 'session-a-after-reload', operation);
  await persistedCorrection(page, sessionAPlan, operation);
  const sessionABackupPoint = await captureBoardSemantic(page);
  assert.equal(sessionABackupPoint.completed, 45, 'session A backup-point pick count');

  meta = {phase:'create-session-b', operation:++operation.value, operationType:'CREATE_SESSION'};
  const sessionBId = await page.evaluate(() => createNewDraftSession({id:'recovery-b', name:'Recovery Draft B'}));
  if (!sessionBId || sessionBId === sessionAId) failRecovery({...meta, invariant:'second draft session was not created', state:{sessionAId, sessionBId}});
  await assertActiveInvariants(page, meta, {recommendations:true});
  await draftRange(page, sessionBPlan, 1, 20, 'session-b-manual', operation);

  meta = {phase:'session-b-espn-authority', operation:++operation.value, operationType:'ESPN_SNAPSHOT', pick:28};
  const espnPick28 = await applyEspnCheckpoint(page, sessionBPlan, 28, meta);
  const b28 = await captureBoardSemantic(page);
  await page.reload({waitUntil:'load'});
  await waitForApp(page);
  await assertDeepSemantic(captureBoardSemantic(page), b28, meta, 'non-default ESPN session changed on reload');
  const espnPick28AfterReload = await page.evaluate(pick => {
    const row = Array.from(document.querySelectorAll('tr.draftrow')).find(candidate => Number(candidate.getAttribute('data-pick')) === pick);
    return row ? {
      name:row.getAttribute('data-name'),
      pick:Number(row.getAttribute('data-pick')),
      teamSlot:Number(row.getAttribute('data-team-slot')),
      source:row.getAttribute('data-sync-source'),
      espnPlayerId:row.getAttribute('data-espn-player-id')
    } : null;
  }, 28);
  if (JSON.stringify(espnPick28AfterReload) !== JSON.stringify(espnPick28)) {
    failRecovery({...meta, invariant:'ESPN-owned pick metadata did not survive reload', state:diffDigest(espnPick28, espnPick28AfterReload)});
  }
  await draftRange(page, sessionBPlan, 29, 36, 'session-b-after-espn', operation);
  await flushSave(page, {phase:'session-b-save', operation:++operation.value, operationType:'SAVE'});
  const sessionBBackupPoint = await captureBoardSemantic(page);

  meta = {phase:'failed-session-switch', operation:++operation.value, operationType:'INJECT_ACTIVE_SESSION_WRITE_FAILURE'};
  await assertFailedSessionSwitchIsAtomic(page, sessionAId, meta);

  meta = {phase:'cross-session-a-check', operation:++operation.value, operationType:'SWITCH_SESSION'};
  const switchedA = await page.evaluate(sessionAId => switchDraftSession(sessionAId), sessionAId);
  if (!switchedA) failRecovery({...meta, invariant:'could not switch back to session A', state:{sessionAId}});
  await assertDeepSemantic(captureBoardSemantic(page), sessionABackupPoint, meta, 'session B contaminated session A');
  await assertActiveInvariants(page, meta, {recommendations:true});

  meta = {phase:'cross-session-b-check', operation:++operation.value, operationType:'SWITCH_SESSION'};
  const switchedB = await page.evaluate(sessionBId => switchDraftSession(sessionBId), sessionBId);
  if (!switchedB) failRecovery({...meta, invariant:'could not switch back to session B', state:{sessionBId}});
  await assertDeepSemantic(captureBoardSemantic(page), sessionBBackupPoint, meta, 'session A contaminated session B');

  meta = {phase:'backup-checkpoint', operation:++operation.value, operationType:'EXPORT_BACKUP'};
  await flushSave(page, meta);
  const backupSemantic = await captureSessionSemantics(page);
  const backup = await page.evaluate(() => WarRoomResilience.buildBackup());
  assert.equal(backup.schema, 'the-war-room-backup');
  assert.ok(Object.keys(backup.storage).length > 0, 'backup should contain War Room storage');

  await draftRange(page, sessionBPlan, 37, 42, 'post-backup-session-b-mutation', operation);
  await flushSave(page, {phase:'post-backup-session-b-save', operation:++operation.value, operationType:'SAVE'});
  meta = {phase:'post-backup-switch-a', operation:++operation.value, operationType:'SWITCH_SESSION'};
  const postBackupSwitchA = await page.evaluate(sessionAId => switchDraftSession(sessionAId), sessionAId);
  if (!postBackupSwitchA) failRecovery({...meta, invariant:'post-backup switch to session A failed', state:{sessionAId}});
  await draftRange(page, sessionAPlan, 46, 50, 'post-backup-session-a-mutation', operation);

  meta = {phase:'failed-backup-restore', operation:++operation.value, operationType:'INJECT_RESTORE_WRITE_FAILURE'};
  await assertFailedBackupRestoreRollsBack(page, backup, meta);
  await assertActiveInvariants(page, meta, {recommendations:true});

  meta = {phase:'successful-backup-restore', operation:++operation.value, operationType:'RESTORE_BACKUP'};
  if (typeof _saveTimer !== 'undefined') {
    await page.evaluate(() => {
      if (_saveTimer) {
        clearTimeout(_saveTimer);
        _saveTimer = null;
      }
    });
  }
  const restored = await page.evaluate(backup => WarRoomResilience.restoreBackupObject(backup), backup);
  if (!restored || restored.restoredKeys !== Object.keys(backup.storage).length) {
    failRecovery({...meta, invariant:'successful backup restore returned unexpected result', state:{restored, expectedKeys:Object.keys(backup.storage).length}});
  }
  await assertDeepSemantic(captureWarRoomStorage(page), backup.storage, meta, 'successful restore storage does not exactly equal exported backup');
  await page.reload({waitUntil:'load'});
  await waitForApp(page);
  await assertDeepSemantic(captureSessionSemantics(page), backupSemantic, meta, 'restored sessions are not semantically equivalent to the backup point');
  await assertDeepSemantic(captureBoardSemantic(page), sessionBBackupPoint, meta, 'restored active board does not equal session B backup point');
  await assertActiveInvariants(page, meta, {recommendations:true});

  await draftRange(page, sessionBPlan, 37, 41, 'continue-after-restore', operation);
  meta = {phase:'post-restore-save', operation:++operation.value, operationType:'SAVE'};
  await flushSave(page, meta);
  const beforeOffline = await captureBoardSemantic(page);
  await ensureServiceWorkerControl(page, beforeOffline, meta);

  meta = {phase:'offline-reload', operation:++operation.value, operationType:'OFFLINE_RELOAD'};
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await waitForApp(page);
  await assertDeepSemantic(captureBoardSemantic(page), beforeOffline, meta, 'offline reload changed saved draft state');
  await assertActiveInvariants(page, meta, {recommendations:true});

  meta = {phase:'reconnect-reload', operation:++operation.value, operationType:'RECONNECT_RELOAD'};
  await context.setOffline(false);
  await page.reload({waitUntil:'load'});
  await waitForApp(page);
  await assertDeepSemantic(captureBoardSemantic(page), beforeOffline, meta, 'normal reload after reconnect changed draft state');
  await draftRange(page, sessionBPlan, 42, 44, 'continue-after-reconnect', operation);
  await flushSave(page, {phase:'final-session-b-save', operation:++operation.value, operationType:'SAVE'});
  const finalB = await captureBoardSemantic(page);

  meta = {phase:'final-session-a-isolation', operation:++operation.value, operationType:'SWITCH_SESSION'};
  const finalSwitchA = await page.evaluate(sessionAId => switchDraftSession(sessionAId), sessionAId);
  if (!finalSwitchA) failRecovery({...meta, invariant:'final switch to session A failed', state:{sessionAId}});
  await assertDeepSemantic(captureBoardSemantic(page), sessionABackupPoint, meta, 'restored session A was contaminated by continued session B drafting');
  meta = {phase:'final-session-b-isolation', operation:++operation.value, operationType:'SWITCH_SESSION'};
  const finalSwitchB = await page.evaluate(sessionBId => switchDraftSession(sessionBId), sessionBId);
  if (!finalSwitchB) failRecovery({...meta, invariant:'final switch to session B failed', state:{sessionBId}});
  await assertDeepSemantic(captureBoardSemantic(page), finalB, meta, 'final switch back to session B changed its state');
  await assertActiveInvariants(page, meta, {recommendations:true});

  if (browserErrors.length) {
    failRecovery({phase:'browser-errors', operation:operation.value, operationType:'BROWSER_ERROR', invariant:'browser emitted console/page errors', state:{errors:browserErrors.slice(0, 8)}});
  }

  console.log('Persistence/recovery integration torture harness passed.');
  console.log(JSON.stringify({
    seed:SEED,
    sessions:{sessionA:sessionAId, sessionB:sessionBId},
    checkpoints:{
      sessionAHardReload:24,
      sessionACorrected:45,
      sessionBEspnReload:28,
      backup:{sessionA:45, sessionB:36},
      continuedAfterRestore:41,
      offlineReload:41,
      finalSessionB:44
    },
    recovery:{
      failedSessionSwitchRollback:true,
      failedBackupRestoreRollback:true,
      successfulBackupRestore:true,
      offlineReload:true,
      reconnectReload:true
    },
    operations:operation.value,
    runtimeMs:Number((performance.now() - startedAt).toFixed(1))
  }, null, 2));
} finally {
  await context.close();
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
