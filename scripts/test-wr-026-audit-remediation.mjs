import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {commitDisclosureControl} from './browser-test-helpers.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
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
const browser = await chromium.launch({ headless:true, executablePath:process.env.CHROME_PATH });
const page = await browser.newPage({ viewport:{width:390,height:844} });
const browserErrors = [];
page.on('pageerror', error => browserErrors.push(error.message));
page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()); });

const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function positionState() {
  return page.evaluate(() => ({
    active: window.WarRoomPhoneDecisionView?.getActivePosition(),
    filter: window.currentPosFilter,
    activeLegacy: document.querySelector('.filterbtn[data-pos].active')?.getAttribute('data-pos') || null,
    boardFilter: document.getElementById('position-board')?.getAttribute('data-position-filter') || null,
    visible: [...document.querySelectorAll('#position-tier-grid > .position-column')]
      .filter(column => !column.hidden && getComputedStyle(column).display !== 'none')
      .map(column => column.dataset.position)
  }));
}

async function assertPrimaryState(expected, label) {
  const state = await positionState();
  assert.equal(state.active, expected, `${label}: phone context`);
  assert.equal(state.filter, expected, `${label}: legacy filter state`);
  assert.equal(state.activeLegacy, expected, `${label}: legacy active button`);
  assert.equal(state.boardFilter, expected, `${label}: board filter marker`);
  assert.deepEqual(state.visible, [expected], `${label}: exactly one intended primary column`);
}

async function clickLegacy(position) {
  await page.locator(`.filterbtn[data-pos="${position}"]`).click();
  await page.waitForTimeout(30);
  await settle();
}

async function clickPhone(position) {
  await page.locator(`[data-phone-position="${position}"]`).click();
  await page.waitForTimeout(30);
  await settle();
}

async function resetPhone() {
  await page.evaluate(() => {
    clearDraftStateFromBoard();
    setBoardView('position', { persist:false });
    const input = document.getElementById('searchBox');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles:true }));
    }
    setPosFilter('ALL', document.querySelector('.filterbtn[data-pos="ALL"]'));
    window.WarRoomPhoneDecisionView.setActivePosition('WR');
    window.scrollTo(0, 0);
  });
  await settle();
}

try {
  await page.goto(appUrl, { waitUntil:'load' });
  await page.waitForSelector('.position-player-card');
  await page.waitForSelector('#draft-command-bar');
  await page.waitForFunction(() => document.body.classList.contains('draft-layout-efficiency-ready'));
  await page.waitForFunction(() => window.WarRoomPhoneDecisionView?.version >= 2);
  await settle();
  await resetPhone();

  // WR-031-AUD-01: legacy filter -> different phone tab must remain coherent.
  await clickLegacy('QB');
  await assertPrimaryState('QB', 'QB legacy filter');
  await clickPhone('RB');
  await assertPrimaryState('RB', 'QB legacy -> RB phone tab');

  await clickLegacy('WR');
  await assertPrimaryState('WR', 'WR legacy filter');
  await clickPhone('TE');
  await assertPrimaryState('TE', 'WR legacy -> TE phone tab');

  // Pressure-position jumps must also replace a stale legacy filter.
  const pressure = page.locator('.draft-command-pressure[data-command-position]').first();
  assert.ok(await pressure.count(), 'expected at least one pressure-position jump control');
  const pressurePosition = await pressure.getAttribute('data-command-position');
  assert.ok(['WR','RB','QB','TE'].includes(pressurePosition), `unexpected pressure position ${pressurePosition}`);
  const staleFilter = pressurePosition === 'QB' ? 'WR' : 'QB';
  await clickLegacy(staleFilter);
  await pressure.click();
  await page.waitForTimeout(30);
  await settle();
  await assertPrimaryState(pressurePosition, `${staleFilter} legacy -> ${pressurePosition} pressure jump`);

  // Search deliberately expands across primary positions, clears the legacy
  // filter while active, and restores the selected phone context afterwards.
  await page.locator('#searchBox').fill('Josh');
  await settle();
  let searchState = await positionState();
  assert.equal(searchState.active, pressurePosition, 'search preserves selected phone context');
  assert.equal(searchState.filter, 'ALL', 'search clears legacy position restriction');
  assert.equal(searchState.activeLegacy, 'ALL', 'search marks legacy ALL active');
  assert.equal(searchState.boardFilter, 'ALL', 'search board filter is ALL');
  assert.deepEqual(searchState.visible, ['WR','RB','QB','TE'], 'search exposes all primary position result columns');
  assert.equal(await page.locator('.phone-compact-hidden').count(), 0, 'search does not compact matching results');

  await page.locator('#searchBox').fill('');
  await settle();
  await assertPrimaryState(pressurePosition, 'search clear restores selected context');

  // WR-031-AUD-02: explicit phone Draft Setup open intent must survive each
  // setting-triggered command-bar reconstruction, then Escape must close and
  // restore focus to the replacement summary.
  await page.evaluate(() => {
    clearDraftStateFromBoard();
    window.WarRoomCommandBarFixes.applySettings({teams:10, slot:5, rounds:16}, false);
    triggerAllBoardUpdates({deferIntelligence:true});
  });
  await page.waitForFunction(() => document.querySelector('.draft-command-setup-disclosure')?.open === false);
  const summary = page.locator('.draft-command-setup-disclosure > summary');
  await summary.click();
  await page.waitForFunction(() => document.querySelector('.draft-command-setup-disclosure')?.open === true);

  const settingCases = [
    ['teams', '12'],
    ['slot', '6'],
    ['rounds', '17']
  ];

  for (const [setting, value] of settingCases) {
    const selector = `.draft-command-setup [data-command-setting="${setting}"]`;
    await commitDisclosureControl(page, '.draft-command-setup-disclosure', selector, value);
    await page.waitForFunction(([name, expected]) => {
      const details = document.querySelector('.draft-command-setup-disclosure');
      const input = details?.querySelector(`[data-command-setting="${name}"]`);
      return details?.open === true && details?.dataset.phoneUserOpen === 'true' && input?.value === expected;
    }, [setting, value]);
    await page.locator(selector).focus();
    assert.equal(await page.evaluate(name => document.activeElement?.getAttribute('data-command-setting') === name, setting), true, `${setting}: replacement setup control remains focusable`);
  }

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('.draft-command-setup-disclosure')?.open === false);
  assert.equal(await page.evaluate(() => {
    const details = document.querySelector('.draft-command-setup-disclosure');
    return document.activeElement === details?.querySelector('summary');
  }), true, 'Escape restores focus to replacement Draft Setup summary');

  // >600px remains outside the phone-only state machine.
  await page.setViewportSize({ width:820, height:900 });
  await settle();
  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('phone-position-decision-nav')).display), 'none', 'phone navigator remains hidden above 600px');
  assert.equal(await page.evaluate(() => document.querySelector('.draft-command-setup-disclosure')?.open), true, 'desktop/tablet Draft Setup behavior remains open before progress');

  assert.deepEqual(browserErrors, [], `unexpected browser errors: ${browserErrors.join(' | ')}`);
  console.log('WR-026 audit remediation regression passed.');
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
