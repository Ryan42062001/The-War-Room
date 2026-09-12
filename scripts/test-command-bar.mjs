import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {commitDisclosureControl} from './browser-test-helpers.mjs';

const {chromium} = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
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
const page = await browser.newPage({viewport:{width:1280,height:900}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

try {
  await page.goto(appUrl, {waitUntil:'load'});
  await page.waitForSelector('tr.draftrow', {state:'attached'});
  await page.waitForSelector('[data-command-setting="teams"]');
  await page.waitForFunction(() => typeof WarRoomCommandBarFixes === 'object');

  await page.evaluate(() => {
    clearDraftStateFromBoard();
    WarRoomCommandBarFixes.applySettings({teams:10, slot:5, rounds:16}, false);
  });
  await page.waitForFunction(() => document.body.getAttribute('data-draft-command-mode') === 'waiting');

  const initial = await page.evaluate(() => ({
    active: activeDraftSessionId,
    mode: document.body.getAttribute('data-draft-command-mode'),
    teams: Number(document.querySelector('[data-command-setting="teams"]').value),
    slot: Number(document.querySelector('[data-command-setting="slot"]').value),
    rounds: Number(document.querySelector('[data-command-setting="rounds"]').value),
    height: document.getElementById('draft-command-bar').getBoundingClientRect().height
  }));
  assert.equal(initial.mode, 'waiting');
  assert.deepEqual([initial.teams, initial.slot, initial.rounds], [10,5,16]);

  const draftedNames = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tr.draftrow')].slice(0, 4);
    rows.forEach((row, index) => {
      row.classList.remove('drafted-mine', 'drafted-other');
      row.classList.add('drafted-other');
      row.setAttribute('data-pick', String(index + 1));
      row.setAttribute('data-team-slot', String(index + 1));
    });
    triggerAllBoardUpdates({deferIntelligence:true});
    return rows.map(row => row.getAttribute('data-name'));
  });

  await page.waitForFunction(() => document.body.getAttribute('data-draft-command-mode') === 'on-clock');
  await page.waitForSelector('.draft-command-alternatives');
  const onClock = await page.evaluate(() => ({
    mode: document.body.getAttribute('data-draft-command-mode'),
    label: document.querySelector('.draft-command-status .draft-command-mode')?.textContent.trim(),
    eyebrow: document.querySelector('.draft-command-recommendation > .draft-command-eyebrow')?.textContent.trim(),
    alternatives: document.querySelectorAll('.draft-command-alternatives b').length,
    height: document.getElementById('draft-command-bar').getBoundingClientRect().height,
    drafted: [...document.querySelectorAll('tr.draftrow.drafted-mine, tr.draftrow.drafted-other')]
      .map(row => row.getAttribute('data-name'))
  }));
  assert.equal(onClock.mode, 'on-clock');
  assert.match(onClock.label, /ON THE CLOCK/);
  assert.equal(onClock.eyebrow, 'MAKE THE PICK');
  assert.ok(onClock.alternatives >= 1);
  assert.ok(onClock.height >= initial.height + 20, `expected clock bar ${onClock.height}px to be visibly taller than waiting ${initial.height}px`);
  assert.deepEqual(onClock.drafted.sort(), draftedNames.slice().sort());

  // The command bar intentionally replaces its children on scheduled renders.
  // Settle, resolve, and commit against one render generation.
  await commitDisclosureControl(
    page,
    '.draft-command-setup-disclosure',
    '[data-command-setting="slot"]',
    6
  );
  await page.waitForFunction(() => document.body.getAttribute('data-draft-command-mode') === 'waiting');
  await page.waitForFunction(() => Number(document.getElementById('pcSlot').value) === 6);

  const afterCommandSetting = await page.evaluate(() => ({
    active: activeDraftSessionId,
    slot: Number(document.getElementById('pcSlot').value),
    drafted: [...document.querySelectorAll('tr.draftrow.drafted-mine, tr.draftrow.drafted-other')]
      .map(row => row.getAttribute('data-name'))
  }));
  assert.equal(afterCommandSetting.active, initial.active);
  assert.equal(afterCommandSetting.slot, 6);
  assert.deepEqual(afterCommandSetting.drafted.sort(), draftedNames.slice().sort());

  await page.evaluate(() => {
    const field = document.getElementById('pcSlot');
    field.value = '7';
    field.dispatchEvent(new Event('change', {bubbles:true}));
  });
  await page.waitForFunction(() => Number(document.querySelector('[data-command-setting="slot"]').value) === 7);

  const afterLegacySetting = await page.evaluate(() => ({
    active: activeDraftSessionId,
    slot: Number(document.querySelector('[data-command-setting="slot"]').value),
    draftedCount: document.querySelectorAll('tr.draftrow.drafted-mine, tr.draftrow.drafted-other').length
  }));
  assert.equal(afterLegacySetting.active, initial.active);
  assert.equal(afterLegacySetting.slot, 7);
  assert.equal(afterLegacySetting.draftedCount, 4);

  const guardResult = await page.evaluate(() => {
    const sessions = readDraftSessionRegistry();
    sessions.push({
      id:'old-espn-draft',
      name:'Old Finished ESPN Draft',
      createdAt:'2026-09-01T00:00:00.000Z',
      draftKey:'espn-old-room'
    });
    writeDraftSessionRegistry(sessions);
    const before = activeDraftSessionId;
    const protectedSwitch = WarRoomCommandBarFixes.shouldProtectEspnSessionSwitch('espn-old-room');
    const switched = selectEspnDraftSession('espn-old-room');
    const snapshot = applyEspnDraftSnapshot({
      draftKey:'espn-old-room',
      config:{teams:10, rounds:16, draftSlot:7},
      picks:[]
    });
    return {
      before,
      after:activeDraftSessionId,
      protectedSwitch,
      switched,
      snapshot,
      draftedCount:document.querySelectorAll('tr.draftrow.drafted-mine, tr.draftrow.drafted-other').length
    };
  });
  assert.equal(guardResult.protectedSwitch, true);
  assert.equal(guardResult.switched, false);
  assert.equal(guardResult.snapshot, null);
  assert.equal(guardResult.after, guardResult.before);
  assert.equal(guardResult.draftedCount, 4);

  const pressureSetup = await page.evaluate(() => {
    clearDraftStateFromBoard();
    triggerAllBoardUpdates({deferIntelligence:true});

    const positions = ['RB','WR','QB','TE'];
    for (const position of positions) {
      const column = document.querySelector(`.position-column[data-position="${position}"]`);
      if (!column) continue;
      const blocks = [...column.querySelectorAll('.position-tier-block')];
      const active = blocks.find(block =>
        [...block.querySelectorAll('.position-player-card')]
          .filter(card => card.getAttribute('data-status') === 'available').length > 0
      );
      if (!active) continue;
      const availableCards = [...active.querySelectorAll('.position-player-card')]
        .filter(card => card.getAttribute('data-status') === 'available');
      if (availableCards.length < 2) continue;

      availableCards.slice(2).forEach(card => card.setAttribute('data-status', 'taken'));
      active.setAttribute('data-available', '4');
      active.classList.remove('is-exhausted');
      refreshDraftCommandBar();
      return {position, tier:active.getAttribute('data-tier') || ''};
    }
    return null;
  });

  assert.ok(pressureSetup, 'expected at least one active tier with two live players');
  await page.waitForFunction(position => {
    const button = document.querySelector(`.draft-command-pressure[data-command-position="${position}"]`);
    return button?.querySelector('span')?.textContent.trim() === '2 · CLOSING';
  }, pressureSetup.position);

  const pressureState = await page.evaluate(position => {
    const button = document.querySelector(`.draft-command-pressure[data-command-position="${position}"]`);
    return {
      text: button?.querySelector('span')?.textContent.trim() || '',
      className: button?.className || ''
    };
  }, pressureSetup.position);
  assert.equal(pressureState.text, '2 · CLOSING', 'Board Pressure must count live available cards instead of stale cached tier totals');
  assert.match(pressureState.className, /is-closing/);

  assert.deepEqual(errors, []);
  console.log('Command bar regression valid: progressive settings remain reachable, Waiting/On-the-Clock distinct, draft state preserved, ESPN session takeover blocked, and pressure counts live tier cards instead of stale cached totals.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
