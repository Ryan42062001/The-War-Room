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
const page = await browser.newPage({viewport:{width:820,height:900}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

async function nextPaint() {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

try {
  await page.goto(appUrl, {waitUntil:'load'});
  await page.waitForSelector('.position-player-card');
  await page.waitForSelector('#draft-manage');
  await page.waitForSelector('.draft-command-setup-disclosure');
  await page.waitForFunction(() => typeof WarRoomLayoutEfficiency === 'object' && typeof WarRoomCommandBarFixes === 'object');
  await nextPaint();

  const hierarchy = await page.evaluate(() => ({
    shellChildren: [...document.querySelectorAll('#draft-control-shell > *')].map(element => element.id || element.className),
    manageActions: [...document.querySelectorAll('#draft-manage-actions button')].map(button => button.textContent.replace(/\s+/g, ' ').trim()),
    sessionImmediate: Boolean(document.querySelector('.statusbar > .draft-session-control #draftSessionSelect')),
    markModeImmediate: Boolean(document.querySelector('.statusbar > .mark-mode-control')),
    headerPosition: getComputedStyle(document.querySelector('header')).position,
    shellPosition: getComputedStyle(document.getElementById('draft-control-shell')).position
  }));
  assert.equal(hierarchy.headerPosition, 'static');
  assert.equal(hierarchy.shellPosition, 'static', 'coordinated shell must not permanently cover board actions');
  assert.equal(hierarchy.sessionImmediate, true, 'saved-session selection must remain immediate');
  assert.equal(hierarchy.markModeImmediate, true, 'Taken/Mine marking must remain immediate');
  for (const label of ['New Draft', 'Delete Draft', 'Autosave', 'Mock Audit', 'Update Rankings', 'Customize Board', 'Restore FP Order', 'Reset all']) {
    assert.ok(hierarchy.manageActions.some(text => text.includes(label)), `${label} must live behind Manage`);
  }

  const manageSummary = page.locator('#draft-manage > summary');
  await manageSummary.focus();
  await manageSummary.press('Enter');
  assert.equal(await page.locator('#draft-manage').evaluate(element => element.open), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('#draft-manage-actions'))), true, 'Tab from open Manage must reach its actions');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#draft-manage').evaluate(element => element.open), false);
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('#draft-manage > summary')), true, 'Escape must return focus to Manage');

  // Existing destructive behavior must remain guarded after disclosure restructuring.
  const sessionCountBefore = await page.locator('#draftSessionSelect option').count();
  await manageSummary.click();
  await page.getByRole('button', {name:'New Draft'}).click();
  assert.equal(await page.locator('#draftSessionSelect option').count(), sessionCountBefore + 1);
  const draftToDelete = await page.locator('#draftSessionSelect').inputValue();
  await page.getByRole('button', {name:'Delete selected draft'}).click();
  assert.equal(await page.getByRole('button', {name:/Confirm deletion of/}).innerText(), 'Confirm Delete');
  assert.equal(await page.locator('#draftSessionSelect option').count(), sessionCountBefore + 1, 'first delete click must not delete immediately');
  await page.getByRole('button', {name:/Confirm deletion of/}).click();
  assert.equal(await page.locator('#draftSessionSelect option').count(), sessionCountBefore);
  assert.notEqual(await page.locator('#draftSessionSelect').inputValue(), draftToDelete);

  // Draft Setup is expanded before progress and its saved values survive reload.
  const setup = page.locator('.draft-command-setup-disclosure');
  assert.equal(await setup.evaluate(element => element.open), true, 'Draft Setup must be expanded before meaningful progress');
  const setupSaved = await page.evaluate(() => {
    clearDraftStateFromBoard();
    WarRoomCommandBarFixes.applySettings({teams:12, slot:7, rounds:18}, false);
    if (typeof _saveTimer !== 'undefined' && _saveTimer) {
      clearTimeout(_saveTimer);
      _saveTimer = null;
    }
    const saved = typeof saveState === 'function' ? saveState() : false;
    WarRoomLayoutEfficiency.refresh();
    return saved;
  });
  assert.equal(setupSaved, true, 'Draft Setup settings must save through the canonical persistence checkpoint');
  await page.waitForFunction(() => document.querySelector('.draft-command-setup-summary-value')?.textContent === '12 teams · Pick 7 · 18 rounds');
  await page.reload({waitUntil:'load'});
  await page.waitForSelector('.draft-command-setup-disclosure');
  await page.waitForFunction(() => document.querySelector('.draft-command-setup-summary-value')?.textContent === '12 teams · Pick 7 · 18 rounds');
  assert.equal(await page.locator('.draft-command-setup-disclosure').evaluate(element => element.open), true);

  // My Draft stays one action away and both primary views remain reachable.
  await page.getByRole('button', {name:'My Draft'}).click();
  assert.equal(await page.locator('#myteam-panel').evaluate(element => element.classList.contains('open')), true);
  await page.getByRole('tab', {name:'Lineup'}).click();
  assert.equal(await page.getByRole('tab', {name:'Lineup'}).getAttribute('aria-selected'), 'true');
  await page.getByRole('tab', {name:'Summary'}).click();
  assert.equal(await page.getByRole('tab', {name:'Summary'}).getAttribute('aria-selected'), 'true');
  await page.getByRole('button', {name:'My Draft'}).click();
  assert.equal(await page.locator('#myteam-panel').evaluate(element => element.classList.contains('open')), false);

  // Waiting -> Near -> On-the-Clock remains semantically distinct in the stressed tablet band.
  await page.evaluate(() => {
    clearDraftStateFromBoard();
    WarRoomCommandBarFixes.applySettings({teams:10, slot:5, rounds:16}, false);
    triggerAllBoardUpdates({deferIntelligence:true});
  });
  await page.waitForFunction(() => document.body.getAttribute('data-draft-command-mode') === 'waiting' && !document.getElementById('draft-command-bar').classList.contains('is-near'));
  const waitingHeight = await page.locator('#draft-command-bar').evaluate(element => element.getBoundingClientRect().height);

  await page.evaluate(() => {
    [...document.querySelectorAll('tr.draftrow')].slice(0, 2).forEach((row, index) => {
      row.classList.remove('drafted-mine', 'drafted-other');
      row.classList.add('drafted-other');
      row.setAttribute('data-pick', String(index + 1));
      row.setAttribute('data-team-slot', String(index + 1));
    });
    triggerAllBoardUpdates({deferIntelligence:true});
  });
  await page.waitForFunction(() => document.body.getAttribute('data-draft-command-mode') === 'waiting' && document.getElementById('draft-command-bar').classList.contains('is-near'));
  const nearHeight = await page.locator('#draft-command-bar').evaluate(element => element.getBoundingClientRect().height);
  assert.ok(nearHeight >= waitingHeight, `Near state must not visually collapse below Waiting (${nearHeight} < ${waitingHeight})`);

  await page.waitForFunction(() => !document.querySelector('.draft-command-setup-disclosure').open);
  assert.equal(await page.locator('.draft-command-setup-summary-value').innerText(), '10 teams · Pick 5 · 16 rounds');
  const setupSummary = page.locator('.draft-command-setup-summary');
  await setupSummary.click();
  assert.equal(await page.locator('.draft-command-setup-disclosure').evaluate(element => element.open), true);
  const setupInput = page.locator('.draft-command-setup-fields input').first();
  await setupInput.focus();
  await setupInput.press('Escape');
  assert.equal(await page.locator('.draft-command-setup-disclosure').evaluate(element => element.open), false);
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.draft-command-setup-summary')), true, 'Escape must close Draft Setup and return focus to Edit summary');

  // Put the command surface off-screen before the urgent transition. The
  // presentation layer must reveal On-the-Clock without relying on a board-
  // obscuring sticky overlay.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(() => document.getElementById('draft-command-bar').getBoundingClientRect().bottom < 0);
  await page.evaluate(() => {
    [...document.querySelectorAll('tr.draftrow')].slice(2, 4).forEach((row, offset) => {
      const pick = offset + 3;
      row.classList.remove('drafted-mine', 'drafted-other');
      row.classList.add('drafted-other');
      row.setAttribute('data-pick', String(pick));
      row.setAttribute('data-team-slot', String(pick));
    });
    triggerAllBoardUpdates({deferIntelligence:true});
  });
  await page.waitForFunction(() => document.body.getAttribute('data-draft-command-mode') === 'on-clock');
  await page.waitForFunction(() => {
    const rect = document.getElementById('draft-command-bar').getBoundingClientRect();
    return rect.top >= -1 && rect.bottom <= innerHeight + 1;
  });
  const onClock = await page.evaluate(() => ({
    height: document.getElementById('draft-command-bar').getBoundingClientRect().height,
    label: document.querySelector('.draft-command-status .draft-command-mode')?.textContent.trim() || '',
    recommendation: document.querySelector('.draft-command-recommendation > .draft-command-eyebrow')?.textContent.trim() || ''
  }));
  assert.match(onClock.label, /ON THE CLOCK/);
  assert.equal(onClock.recommendation, 'MAKE THE PICK');
  assert.ok(onClock.height >= nearHeight, `On-the-Clock must remain at least as prominent as Near (${onClock.height} < ${nearHeight})`);

  assert.deepEqual(errors, [], `Browser errors: ${JSON.stringify(errors)}`);
  console.log('WR-016 layout behavior valid: coordinated normal-flow hierarchy, Manage keyboard/destructive guards, saved Draft Setup disclosure, My Draft reachability, and Waiting/Near/On-the-Clock urgent reveal passed at 820x900.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}