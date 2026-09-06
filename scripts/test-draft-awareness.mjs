import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

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
  await page.waitForSelector('.position-player-card', {state:'attached'});
  await page.waitForFunction(() => typeof WarRoomDraftAwareness === 'object');
  await page.waitForSelector('#draft-awareness-strip');

  await page.evaluate(() => {
    clearDraftStateFromBoard();
    WarRoomCommandBarFixes.applySettings({teams:10, slot:5, rounds:16}, false);
    WarRoomDraftAwareness.clearTargets();
    WarRoomDraftAwareness.clearAlerts();
    WarRoomDraftAwareness.resetBaseline();
  });

  const targetNames = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tr.draftrow')]
      .filter(row => ['RB','WR','QB','TE'].includes(row.getAttribute('data-pos')))
      .slice(10, 12);
    rows.forEach(row => WarRoomDraftAwareness.toggleTarget(row));
    return rows.map(row => row.getAttribute('data-display-name') || row.getAttribute('data-name'));
  });

  await page.waitForFunction(() => WarRoomDraftAwareness.getTargets().length === 2);
  await page.waitForFunction(() => document.querySelectorAll('.draft-target-chip').length === 2);

  const targetState = await page.evaluate(() => ({
    drafted: document.querySelectorAll('tr.draftrow.drafted-mine, tr.draftrow.drafted-other').length,
    targetCount: WarRoomDraftAwareness.getTargets().length,
    starredCards: document.querySelectorAll('.position-player-card.is-targeted').length,
    stored: JSON.parse(localStorage.getItem('war-room-targets-v1:' + activeDraftSessionId) || '[]').length
  }));
  assert.equal(targetState.drafted, 0, 'targeting must not mark players drafted');
  assert.equal(targetState.targetCount, 2);
  assert.ok(targetState.starredCards >= 2);
  assert.equal(targetState.stored, 2);

  const firstTargetKey = await page.evaluate(name => {
    const row = findDraftRowByExpertName(name);
    return getPositionBoardRowKey(row);
  }, targetNames[0]);
  const firstTargetCard = page.locator(`.position-player-card[data-player-key="${firstTargetKey}"]`);
  const firstTargetStar = firstTargetCard.locator('.draft-target-star');
  await firstTargetStar.click();
  await page.waitForFunction(() => WarRoomDraftAwareness.getTargets().length === 1);

  const afterStarRemoval = await page.evaluate(name => ({
    status: getDraftRowStatus(findDraftRowByExpertName(name)),
    drafted: document.querySelectorAll('tr.draftrow.drafted-mine, tr.draftrow.drafted-other').length
  }), targetNames[0]);
  assert.equal(afterStarRemoval.status, 'available');
  assert.equal(afterStarRemoval.drafted, 0, 'clicking the target star must not trigger the parent draft button');

  await firstTargetCard.focus();
  await page.keyboard.press('t');
  await page.waitForFunction(() => WarRoomDraftAwareness.getTargets().length === 2);

  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tr.draftrow')].slice(0, 5);
    rows.forEach((row, index) => {
      row.classList.remove('drafted-mine', 'drafted-other');
      row.classList.add(index === 4 ? 'drafted-mine' : 'drafted-other');
      row.setAttribute('data-pick', String(index + 1));
      row.setAttribute('data-team-slot', String(index === 4 ? 5 : index + 1));
    });
    triggerAllBoardUpdates({deferIntelligence:true});
  });
  await page.waitForFunction(() => document.querySelectorAll('tr.draftrow.drafted-mine').length === 1);
  await page.waitForTimeout(50);
  await page.evaluate(() => WarRoomDraftAwareness.resetBaseline());

  await page.evaluate(name => {
    const row = findDraftRowByExpertName(name);
    row.classList.remove('drafted-mine');
    row.classList.add('drafted-other');
    row.setAttribute('data-pick', '6');
    row.setAttribute('data-team-slot', '6');
    triggerAllBoardUpdates({deferIntelligence:true});
  }, targetNames[0]);

  await page.waitForFunction(name => {
    return WarRoomDraftAwareness.getAlerts().some(alert => alert.text.includes(name) && /taken/i.test(alert.text));
  }, targetNames[0]);

  const feedState = await page.evaluate(() => ({
    alerts: WarRoomDraftAwareness.getAlerts(),
    feedText: document.querySelector('#draft-awareness-strip .draft-awareness-changes')?.textContent || '',
    chipClasses: [...document.querySelectorAll('.draft-target-chip')].map(chip => chip.className)
  }));
  assert.ok(feedState.alerts.some(alert => /was taken/i.test(alert.text)));
  assert.match(feedState.feedText, /was taken/i);
  assert.ok(feedState.chipClasses.some(value => value.includes('is-taken')));

  const pressureResult = await page.evaluate(() => {
    const before = WarRoomDraftAwareness.capturePressure();
    const position = ['RB','WR','QB','TE'].find(pos => Number(before[pos]?.available) >= 5);
    if (!position) return {skipped:true};
    const column = document.querySelector(`.position-column[data-position="${position}"]`);
    const block = [...column.querySelectorAll('.position-tier-block')].find(candidate => {
      const available = Number(candidate.getAttribute('data-available'));
      return !candidate.classList.contains('is-exhausted') && Number.isFinite(available) && available > 0;
    });
    if (!block) return {skipped:true};
    block.setAttribute('data-available', '2');
    const after = WarRoomDraftAwareness.capturePressure();
    return {skipped:false, position, before:before[position], after:after[position]};
  });
  if (!pressureResult.skipped) {
    assert.ok(Number(pressureResult.before.available) >= 5);
    assert.equal(pressureResult.after.available, 2);
    assert.equal(pressureResult.after.level, 'closing');
    assert.equal(pressureResult.after.severity, 2);
  }

  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(50);
  const mobileOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
  assert.equal(mobileOverflow, 0, 'draft awareness must not create mobile page overflow');

  assert.deepEqual(errors, []);
  console.log('Draft awareness regression valid: target queue is session-scoped/non-destructive, star and T controls work, target losses surface in What Changed, pressure thresholds classify correctly, and mobile stays contained.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
