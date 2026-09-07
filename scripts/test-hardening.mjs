import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const {chromium} = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');

const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const bootstrapSource = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const hardeningSource = fs.readFileSync(path.join(root, 'js/war-room-hardening.js'), 'utf8');
const bridgeSource = fs.readFileSync(path.join(root, 'extensions/espn-companion/war-room-content.js'), 'utf8');

const bootstrapVersion = bootstrapSource.match(/WAR_ROOM_BOOTSTRAP_VERSION\s*=\s*'([^']+)'/)?.[1];
assert.ok(bootstrapVersion, 'bootstrap must declare WAR_ROOM_BOOTSTRAP_VERSION');
assert.ok(
  indexSource.includes(`script.js?v=${bootstrapVersion}`),
  'index.html must cache-bust script.js with the bootstrap version it declares'
);
assert.match(indexSource, /data-war-room-app="the-war-room"/);
assert.match(bootstrapSource, /script\.onerror\s*=\s*function/);
assert.match(bootstrapSource, /reportWarRoomEnhancementFailure/);
assert.match(bootstrapSource, /js\/war-room-hardening\.js\?v=/);
assert.match(hardeningSource, /getConfiguredStarterLimits/);
assert.match(hardeningSource, /POSITION_ORDER/);
assert.match(bridgeSource, /locationUrl\.port === '8765'/);
assert.match(bridgeSource, /marker === 'the-war-room'/);

const server = http.createServer((request, response) => {
  const relative = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\//, '');
  fs.readFile(path.join(root, relative), (error, data) => {
    response.statusCode = error ? 404 : 200;
    response.end(error ? 'not found' : data);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const appUrl = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH});
try {
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(appUrl, {waitUntil:'load'});
  await page.waitForSelector('tr.draftrow', {state:'attached'});
  await page.waitForFunction(() => window.WarRoomHardening && window.WarRoomHardening.installed === true);

  const configDrivenRoster = await page.evaluate(() => {
    const original = Object.assign({}, ROSTER_SLOTS);
    Object.assign(ROSTER_SLOTS, {QB:1, RB:1, WR:3, TE:1, FLEX:2, K:0, DST:0});

    document.querySelectorAll('tr.draftrow').forEach(row => row.classList.remove('drafted-mine', 'drafted-other'));
    const required = {QB:1, RB:2, WR:4, TE:2};
    Object.keys(required).forEach(position => {
      [...document.querySelectorAll(`tr.draftrow[data-pos="${position}"]`)]
        .slice(0, required[position])
        .forEach(row => row.classList.add('drafted-mine'));
    });

    const panel = document.getElementById('myteam-panel');
    const summary = document.getElementById('summary-panel');
    const lineup = document.getElementById('lineup-panel');
    panel.classList.add('open');
    summary.classList.remove('active');
    lineup.classList.add('active');
    lineup.hidden = false;
    updateMyTeam();

    const result = {
      total: getConfiguredStarterTotal(),
      starterCount: document.querySelectorAll('#roster-list .starter-slot').length,
      wrSlots: document.querySelectorAll('#roster-list .starter-position.pos-WR').length,
      flexSlots: document.querySelectorAll('#roster-list .starter-position.pos-FLEX').length,
      kSlots: document.querySelectorAll('#roster-list .starter-position.pos-K').length,
      dstSlots: document.querySelectorAll('#roster-list .starter-position.pos-DST').length,
      needs: document.getElementById('needs-row').textContent.replace(/\s+/g, ' ').trim(),
      countText: document.getElementById('myteam-starter-count').textContent
    };

    Object.keys(ROSTER_SLOTS).forEach(key => delete ROSTER_SLOTS[key]);
    Object.assign(ROSTER_SLOTS, original);
    document.querySelectorAll('tr.draftrow').forEach(row => row.classList.remove('drafted-mine', 'drafted-other'));
    panel.classList.remove('open');
    updateMyTeam();
    return result;
  });

  assert.equal(configDrivenRoster.total, 8);
  assert.equal(configDrivenRoster.starterCount, 8);
  assert.equal(configDrivenRoster.wrSlots, 3);
  assert.equal(configDrivenRoster.flexSlots, 2);
  assert.equal(configDrivenRoster.kSlots, 0);
  assert.equal(configDrivenRoster.dstSlots, 0);
  assert.doesNotMatch(configDrivenRoster.needs, /K|DST/);
  assert.match(configDrivenRoster.countText, /8 \/ 8 starters/);

  const degradedPage = await browser.newPage({viewport:{width:1280,height:900}});
  await degradedPage.route('**/js/war-room-command-bar.js*', route => route.abort());
  await degradedPage.goto(appUrl, {waitUntil:'load'});
  await degradedPage.waitForSelector('tr.draftrow', {state:'attached'});
  await degradedPage.waitForFunction(() => typeof window.WarRoomDraftAwareness === 'object');
  await degradedPage.waitForFunction(() => typeof window.WarRoomAwarenessLiveSync === 'object');
  const degradedState = await degradedPage.evaluate(() => ({
    degraded: document.body.getAttribute('data-war-room-degraded'),
    badge: document.getElementById('war-room-degraded-status')?.textContent || '',
    awareness: typeof WarRoomDraftAwareness,
    liveSync: typeof WarRoomAwarenessLiveSync
  }));
  assert.equal(degradedState.degraded, 'true');
  assert.match(degradedState.badge, /command bar unavailable/);
  assert.equal(degradedState.awareness, 'object');
  assert.equal(degradedState.liveSync, 'object');
  await degradedPage.close();

  const storagePage = await browser.newPage({viewport:{width:1280,height:900}});
  await storagePage.goto(appUrl, {waitUntil:'load'});
  await storagePage.waitForSelector('tr.draftrow', {state:'attached'});

  const seeded = await storagePage.evaluate(() => {
    localStorage.clear();
    const rows = [...document.querySelectorAll('tr.draftrow')];
    const order = rows.map(row => row.getAttribute('data-name'));
    const draftedRows = rows.slice(0, 160);
    const state = {};
    const draftMeta = {};
    draftedRows.forEach((row, index) => {
      const name = row.getAttribute('data-name');
      state[name] = index % 10 === 9 ? 'mine' : 'taken';
      draftMeta[name] = {
        pick:index + 1,
        teamSlot:(index % 10) + 1,
        teamId:String((index % 10) + 1),
        source:'stress-test',
        method:'dom'
      };
    });
    const recommendationAudit = Array.from({length:80}, (_, index) => ({
      key:`stress-${index}`,
      recordedAt:new Date(2026, 7, 1, 12, index % 60).toISOString(),
      decisionPick:(index % 160) + 1,
      nextPick:Math.min(160, (index % 160) + 10),
      player:order[index % order.length],
      position:['RB','WR','QB','TE'][index % 4],
      ecr:index + 1,
      adp:index + 2,
      espnBoardRank:index + 3,
      espnAdp:index + 4,
      marketSource:'espn',
      marketEstimate:index + 3,
      boardWeight:0.5,
      draftPhase:index < 24 ? 'EARLY' : index < 56 ? 'MIDDLE' : 'LATE',
      predictedSurvival:50,
      action:'DRAFT',
      scoreGap:4,
      confidence:72,
      baseScore:100,
      strategyAdjustment:2,
      guardrailAdjustment:0,
      byeWeek:9,
      byeWeekAdjustment:0,
      resolved:true,
      calibrationEligible:true,
      noisyDraft:false,
      survived:index % 2 === 0
    }));

    const sessions = [];
    let failedAt = null;
    for (let index = 1; index <= 25; index++) {
      const id = `stress-${String(index).padStart(2, '0')}`;
      sessions.push({id, name:`Stress Draft ${index}`, createdAt:new Date().toISOString(), draftKey:null});
      const payload = {
        version:2,
        savedAt:new Date().toISOString(),
        teams:10,
        slot:10,
        rounds:16,
        recommendationAudit,
        autoDraftTeamSlots:[2,3],
        state,
        draftMeta,
        order
      };
      try {
        localStorage.setItem(`${AUTOSAVE_KEY}:${id}`, JSON.stringify(payload));
      } catch (error) {
        failedAt = index;
        break;
      }
    }
    localStorage.setItem(DRAFT_SESSION_REGISTRY_KEY, JSON.stringify(sessions));
    localStorage.setItem(ACTIVE_DRAFT_SESSION_KEY, sessions[0].id);
    localStorage.setItem(AUTOSAVE_KEY, localStorage.getItem(`${AUTOSAVE_KEY}:${sessions[0].id}`));

    let bytes = 0;
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      const value = localStorage.getItem(key) || '';
      bytes += (key.length + value.length) * 2;
    }
    return {failedAt, bytes, sessions:sessions.length};
  });

  assert.equal(seeded.failedAt, null, `storage quota reached while seeding stress draft ${seeded.failedAt}`);
  assert.equal(seeded.sessions, 25);
  assert.ok(seeded.bytes < 4 * 1024 * 1024, `25-draft stress fixture uses ${seeded.bytes} bytes`);

  await storagePage.reload({waitUntil:'load'});
  await storagePage.waitForSelector('tr.draftrow', {state:'attached'});
  const storageResult = await storagePage.evaluate(() => {
    const sessions = readDraftSessionRegistry();
    const switched = sessions.map(session => switchDraftSession(session.id));
    const created = createNewDraftSession({id:'stress-26', name:'Stress Draft 26'});
    let bytes = 0;
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      const value = localStorage.getItem(key) || '';
      bytes += (key.length + value.length) * 2;
    }
    return {
      sessions:sessions.length,
      switchedAll:switched.every(Boolean),
      created,
      active:activeDraftSessionId,
      bytes
    };
  });

  assert.equal(storageResult.sessions, 25);
  assert.equal(storageResult.switchedAll, true);
  assert.equal(storageResult.created, 'stress-26');
  assert.equal(storageResult.active, 'stress-26');
  assert.ok(storageResult.bytes < 4 * 1024 * 1024, `post-switch stress state uses ${storageResult.bytes} bytes`);

  await storagePage.reload({waitUntil:'load'});
  await storagePage.waitForSelector('tr.draftrow', {state:'attached'});
  const restoredActive = await storagePage.evaluate(() => ({
    active:activeDraftSessionId,
    sessions:readDraftSessionRegistry().length
  }));
  assert.equal(restoredActive.active, 'stress-26');
  assert.equal(restoredActive.sessions, 26);
  await storagePage.close();
  await page.close();

  console.log(`War Room hardening valid: bootstrap ${bootstrapVersion}, fail-open enhancements, config-driven roster, 25-draft storage stress.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
