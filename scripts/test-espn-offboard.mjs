import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const {chromium} = createRequire(import.meta.url)('playwright');
const TEAMS = 18;
const ROUNDS = 16;
const TOTAL_PICKS = TEAMS * ROUNDS;
const DRAFT_SLOT = 7;
const EXTERNAL_NAME = 'Kene Nwangwu';
const EXTERNAL_POSITION = 'RB';
const EXTERNAL_PICK = 280;
const PLAYER_UNIVERSE = 717;

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

function snakeTeamForPick(pick, teams = TEAMS) {
  const round = Math.ceil(pick / teams);
  const index = (pick - 1) % teams;
  return round % 2 === 1 ? index + 1 : teams - index;
}

async function openPage(browser) {
  const context = await browser.newContext();
  const page = await context.newPage({viewport:{width:1280,height:900}});
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(appUrl, {waitUntil:'load'});
  await page.waitForFunction(() => document.querySelectorAll('tr.draftrow').length === 717);
  await page.waitForFunction(() => Boolean(window.WarRoomEspnExternalPicks && window.WarRoomEspnSync));
  return {context, page, errors};
}

async function buildFixture(page, externalMine = false) {
  return page.evaluate(({teams, rounds, totalPicks, draftSlot, externalName, externalPosition, externalPick, externalMine}) => {
    const snakeTeamForPick = pick => {
      const round = Math.ceil(pick / teams);
      const index = (pick - 1) % teams;
      return round % 2 === 1 ? index + 1 : teams - index;
    };
    const source = Array.from(document.querySelectorAll('tr.draftrow')).slice(0, totalPicks);
    if (source.length < totalPicks) throw new Error('not enough canonical players for off-board fixture');
    const canonical = source.map(row => ({
      playerName:row.getAttribute('data-name'),
      position:row.getAttribute('data-pos') || ''
    }));
    const reserveRow = Array.from(document.querySelectorAll('tr.draftrow'))[totalPicks];
    if (!reserveRow) throw new Error('missing canonical correction reserve');
    const reserve = {
      playerName:reserveRow.getAttribute('data-name'),
      position:reserveRow.getAttribute('data-pos') || ''
    };
    const picks = [];
    let canonicalIndex = 0;
    for (let overallPick = 1; overallPick <= totalPicks; overallPick++) {
      const teamSlot = snakeTeamForPick(overallPick);
      if (overallPick === externalPick) {
        picks.push({
          overallPick,
          playerName:externalName,
          position:externalPosition,
          teamSlot,
          teamId:'team-' + teamSlot,
          isMine:externalMine ? true : teamSlot === draftSlot,
          method:'structured',
          espnPlayerId:'external-kene-280'
        });
      } else {
        const player = canonical[canonicalIndex++];
        picks.push({
          overallPick,
          playerName:player.playerName,
          position:player.position,
          teamSlot,
          teamId:'team-' + teamSlot,
          isMine:teamSlot === draftSlot,
          method:'structured',
          espnPlayerId:'fixture-' + overallPick
        });
      }
    }
    return {picks, reserve};
  }, {teams:TEAMS, rounds:ROUNDS, totalPicks:TOTAL_PICKS, draftSlot:DRAFT_SLOT,
    externalName:EXTERNAL_NAME, externalPosition:EXTERNAL_POSITION, externalPick:EXTERNAL_PICK, externalMine});
}

async function configure(page) {
  await page.evaluate(({teams, rounds, draftSlot}) => {
    const teamsField = document.getElementById('pcTeams');
    const roundsField = document.getElementById('pcRounds');
    const slotField = document.getElementById('pcSlot');
    teamsField.value = String(teams);
    roundsField.value = String(rounds);
    slotField.max = String(teams);
    slotField.value = String(draftSlot);
    LEAGUE_SIZE = teams;
    TOTAL_ROUNDS = rounds;
    MY_DRAFT_SLOT = draftSlot;
    document.querySelectorAll('tr.draftrow').forEach(row => {
      row.classList.remove('drafted-mine','drafted-other');
      ['data-pick','data-team-slot','data-team-id','data-sync-method','data-sync-source','data-espn-player-id'].forEach(attribute => row.removeAttribute(attribute));
    });
    if (window.WarRoomEspnExternalPicks) replaceEspnExternalDraftPicks([], teams * rounds);
  }, {teams:TEAMS, rounds:ROUNDS, draftSlot:DRAFT_SLOT});
}

async function applyFullSnapshot(page, picks) {
  return page.evaluate(({picks, teams, rounds, draftSlot}) => window.WarRoomEspnSync.applySnapshot({
    version:1,
    draftComplete:true,
    expectedCompleted:teams * rounds,
    picks,
    unavailablePlayers:[],
    marketAdp:[],
    config:{teams, rounds, draftSlot}
  }), {picks, teams:TEAMS, rounds:ROUNDS, draftSlot:DRAFT_SLOT});
}

async function inspect(page) {
  return page.evaluate(({externalName, externalPick, playerUniverse}) => {
    const rows = Array.from(document.querySelectorAll('tr.draftrow'));
    const numberedRows = rows.filter(row => Number(row.getAttribute('data-pick')) > 0);
    const rowPicks = numberedRows.map(row => Number(row.getAttribute('data-pick')));
    const duplicates = rowPicks.filter((pick, index) => rowPicks.indexOf(pick) !== index);
    const external = window.WarRoomEspnExternalPicks.getAll();
    const acceptedNumbers = window.WarRoomEspnExternalPicks.getAcceptedPickNumbers();
    const players = typeof getDraftAssistantPlayers === 'function' ? getDraftAssistantPlayers() : [];
    const debug = typeof buildLiveDraftDebugState === 'function' ? buildLiveDraftDebugState() : null;
    return {
      rows:rows.length,
      dataset:typeof FANTASYPROS_2026_DATA !== 'undefined' && Array.isArray(FANTASYPROS_2026_DATA)
        ? FANTASYPROS_2026_DATA.length : playerUniverse,
      externalRow:Boolean(findDraftRowByExpertName(externalName)),
      completed:getCompletedDraftPickCount(),
      currentPick:getDraftAssistantState().currentPick,
      totalPicks:getDraftAssistantState().totalPicks,
      numberedRows:numberedRows.length,
      duplicateCanonicalPickNumbers:Array.from(new Set(duplicates)),
      external,
      acceptedNumbers,
      latestResult:window.latestEspnSyncResult,
      recommendationPoolHasExternal:players.some(player => String(player.name || '').toLowerCase() === externalName.toLowerCase()),
      scoredHasExternal:Boolean(debug && Array.isArray(debug.scored) && debug.scored.some(player => String(player.name || '').toLowerCase() === externalName.toLowerCase())),
      visibleRecommendationHasExternal:String(document.getElementById('recommended-pick-text')?.textContent || '').toLowerCase().includes(externalName.toLowerCase()),
      externalPickPresent:external.some(pick => Number(pick.overallPick) === externalPick && pick.playerName === externalName)
    };
  }, {externalName:EXTERNAL_NAME, externalPick:EXTERNAL_PICK, playerUniverse:PLAYER_UNIVERSE});
}

const browser = await chromium.launch({headless:true});
try {
  const opponentRun = await openPage(browser);
  await configure(opponentRun.page);
  const fixture = await buildFixture(opponentRun.page, false);
  const result = await applyFullSnapshot(opponentRun.page, fixture.picks);
  assert.equal(result.captured, 288);
  assert.equal(result.applied, 288, 'legacy applied count should mean accepted numbered picks');
  assert.equal(result.numberedAccepted, 288);
  assert.equal(result.canonicalApplied, 287);
  assert.equal(result.externalAccepted, 1);
  assert.equal(result.unmatched.length, 0, 'valid off-board pick must not be generic unmatched');
  assert.equal(result.unresolved.length, 0);
  assert.equal(result.externalPicks.length, 1);
  assert.deepEqual(
    {pick:result.externalPicks[0].overallPick, name:result.externalPicks[0].playerName, position:result.externalPicks[0].position,
      teamSlot:result.externalPicks[0].teamSlot, teamId:result.externalPicks[0].teamId, isMine:result.externalPicks[0].isMine},
    {pick:280, name:EXTERNAL_NAME, position:'RB', teamSlot:snakeTeamForPick(280), teamId:'team-' + snakeTeamForPick(280), isMine:false}
  );

  let state = await inspect(opponentRun.page);
  assert.equal(state.rows, 717);
  assert.equal(state.dataset, 717);
  assert.equal(state.externalRow, false, 'off-board pick must never create a canonical draft row');
  assert.equal(state.completed, 288);
  assert.equal(state.totalPicks, 288);
  assert.equal(state.numberedRows, 287);
  assert.deepEqual(state.duplicateCanonicalPickNumbers, []);
  assert.equal(state.acceptedNumbers.length, 288);
  assert.deepEqual(state.acceptedNumbers, Array.from({length:288}, (_, index) => index + 1));
  assert.equal(state.recommendationPoolHasExternal, false);
  assert.equal(state.scoredHasExternal, false);
  assert.equal(state.visibleRecommendationHasExternal, false);
  assert.equal(state.externalPickPresent, true);

  const opponentRoster = await opponentRun.page.evaluate(() => ({
    canonicalRb:document.querySelectorAll('tr.draftrow.drafted-mine[data-pos="RB"]').length,
    engine:getDraftAssistantRosterState()
  }));
  assert.equal(opponentRoster.engine.counts.RB, opponentRoster.canonicalRb, 'opponent off-board RB must not alter my roster');
  assert.equal(opponentRoster.engine.externalMinePicks.length, 0);

  assert.equal(await opponentRun.page.evaluate(() => saveState()), true);
  await opponentRun.page.reload({waitUntil:'load'});
  await opponentRun.page.waitForFunction(() => Boolean(window.WarRoomEspnExternalPicks && document.querySelectorAll('tr.draftrow').length === 717));
  state = await inspect(opponentRun.page);
  assert.equal(state.completed, 288, 'off-board numbered pick must survive reload');
  assert.equal(state.externalPickPresent, true);
  assert.equal(state.external[0].playerName, EXTERNAL_NAME);
  assert.equal(state.external[0].position, 'RB');
  assert.equal(state.external[0].teamSlot, snakeTeamForPick(280));

  const staleResult = await opponentRun.page.evaluate(({picks, teams, rounds, draftSlot}) => window.WarRoomEspnSync.applySnapshot({
    expectedCompleted:287,
    picks:picks.slice(0, 287),
    config:{teams, rounds, draftSlot}
  }), {picks:fixture.picks, teams:TEAMS, rounds:ROUNDS, draftSlot:DRAFT_SLOT});
  assert.equal(staleResult.applied, 288, 'stale smaller snapshot cannot lower accepted progress');
  state = await inspect(opponentRun.page);
  assert.equal(state.completed, 288);
  assert.equal(state.externalPickPresent, true);

  const corrected = fixture.picks.map(pick => ({...pick}));
  corrected[EXTERNAL_PICK - 1] = {
    overallPick:EXTERNAL_PICK,
    playerName:fixture.reserve.playerName,
    position:fixture.reserve.position,
    teamSlot:snakeTeamForPick(EXTERNAL_PICK),
    teamId:'team-' + snakeTeamForPick(EXTERNAL_PICK),
    isMine:false,
    method:'structured',
    espnPlayerId:'corrected-280'
  };
  const correctedResult = await applyFullSnapshot(opponentRun.page, corrected);
  assert.equal(correctedResult.applied, 288);
  assert.equal(correctedResult.numberedAccepted, 288);
  assert.equal(correctedResult.canonicalApplied, 288);
  assert.equal(correctedResult.externalAccepted, 0);
  assert.equal(correctedResult.unmatched.length, 0);
  state = await inspect(opponentRun.page);
  assert.equal(state.completed, 288);
  assert.equal(state.external.length, 0, 'authoritative correction should remove replaced external pick');
  assert.equal(state.numberedRows, 288);
  assert.deepEqual(state.duplicateCanonicalPickNumbers, []);
  const correctedOwner = await opponentRun.page.evaluate(({name, pick}) => {
    const row = findDraftRowByExpertName(name);
    return row ? Number(row.getAttribute('data-pick')) : null;
  }, {name:fixture.reserve.playerName, pick:EXTERNAL_PICK});
  assert.equal(correctedOwner, 280);
  assert.deepEqual(opponentRun.errors, []);
  await opponentRun.context.close();

  const mineRun = await openPage(browser);
  await configure(mineRun.page);
  const mineFixture = await buildFixture(mineRun.page, true);
  const mineResult = await applyFullSnapshot(mineRun.page, mineFixture.picks);
  assert.equal(mineResult.applied, 288);
  assert.equal(mineResult.externalAccepted, 1);
  assert.equal(mineResult.unmatched.length, 0);
  const mineRoster = await mineRun.page.evaluate(({externalName}) => {
    const canonicalRb = document.querySelectorAll('tr.draftrow.drafted-mine[data-pos="RB"]').length;
    const state = getDraftAssistantRosterState();
    return {
      canonicalRb,
      rb:state.counts.RB,
      needRb:state.needs.RB,
      externalMine:state.externalMinePicks.map(pick => ({name:pick.playerName, position:pick.position, pick:pick.overallPick}))
    };
  }, {externalName:EXTERNAL_NAME});
  assert.equal(mineRoster.rb, mineRoster.canonicalRb + 1, 'Mine off-board RB must count toward recommendation roster needs');
  assert.deepEqual(mineRoster.externalMine, [{name:EXTERNAL_NAME, position:'RB', pick:280}]);
  assert.equal(await mineRun.page.evaluate(() => getCompletedDraftPickCount()), 288);
  assert.deepEqual(mineRun.errors, []);
  await mineRun.context.close();

  console.log('ESPN off-board pick correctness valid: live Kene #280 reproduced, 288/288 accepted, external Mine roster semantics preserved, persistence/correction/stale-snapshot behavior passed.');
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
