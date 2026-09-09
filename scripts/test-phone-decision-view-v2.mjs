import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const artifactsDir = path.join(root, 'artifacts');
const phones = [[320,700],[375,812],[390,844],[430,932]];
const desktops = [[768,1024],[820,900],[900,900],[1280,800],[1440,900]];

const server = process.env.WAR_ROOM_URL ? null : http.createServer((req, res) => {
  const relative = req.url === '/' ? 'index.html' : req.url.split('?')[0].replace(/^\//, '');
  fs.readFile(path.join(root, relative), (error, data) => {
    res.statusCode = error ? 404 : 200;
    res.end(error ? 'not found' : data);
  });
});
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const appUrl = process.env.WAR_ROOM_URL || `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const consoleErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => consoleErrors.push(error.message));

const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function resetPhone(position = 'WR') {
  await page.evaluate(next => {
    setBoardView('position', { persist: false });
    const input = document.getElementById('searchBox');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    window.WarRoomPhoneDecisionView.setActivePosition(next);
    window.scrollTo(0, 0);
  }, position);
  await settle();
  if (await page.evaluate(() => window.WarRoomPhoneDecisionView.isExpanded())) {
    await page.locator('#phone-position-show-more').click();
    await settle();
  }
}

async function measurePhone(width, height) {
  await page.setViewportSize({ width, height });
  await resetPhone('WR');
  return page.evaluate(() => {
    const visible = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const size = selector => {
      const element = [...document.querySelectorAll(selector)].find(visible);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    };
    const active = document.querySelector('#position-tier-grid > .position-column.phone-position-active');
    const cards = active ? [...active.querySelectorAll('.position-player-card')].filter(visible) : [];
    const inViewport = cards.filter(card => {
      const rect = card.getBoundingClientRect();
      return rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0;
    });
    const first = cards[0]?.getBoundingClientRect() || null;
    const hitCard = inViewport[0] || null;
    let occluded = false;
    if (hitCard) {
      const rect = hitCard.getBoundingClientRect();
      const x = Math.max(0, Math.min(innerWidth - 1, rect.left + Math.min(28, rect.width / 2)));
      const y = Math.max(0, Math.min(innerHeight - 1, rect.top + Math.min(20, rect.height / 2)));
      const hit = document.elementFromPoint(x, y);
      occluded = Boolean(hit && hit !== hitCard && !hitCard.contains(hit));
    }
    const vw = document.documentElement.clientWidth;
    return {
      width: innerWidth,
      height: innerHeight,
      visibleColumns: [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(visible).map(column => column.dataset.position),
      visibleCards: cards.length,
      compactHidden: active ? active.querySelectorAll('.phone-compact-hidden').length : 0,
      firstChoiceY: first ? first.top : null,
      choicesAboveFold: inViewport.length,
      occluded,
      overflow: Math.max(0, document.documentElement.scrollWidth - vw, document.body.scrollWidth - vw),
      recommendation: visible(document.querySelector('.draft-command-recommendation')),
      pressure: visible(document.querySelector('.draft-command-pressure-wrap')),
      myDraft: visible(document.querySelector('.myteam-toggle')),
      targets: {
        phoneTab: size('.phone-position-tab'),
        showMore: size('#phone-position-show-more'),
        boardView: size('.board-view-btn'),
        search: size('#searchBox'),
        positionFilter: size('.filterbtn[data-pos="WR"]'),
        myDraft: size('.myteam-toggle'),
        markMode: size('.mark-mode-btn[data-mark-mode="mine"]'),
        targetStar: size('.position-column.phone-position-active .draft-target-star')
      }
    };
  });
}

function assertTargets(result) {
  for (const [name, size] of Object.entries(result.targets)) {
    if (!size) continue;
    assert.ok(size.height >= 44, `${result.width}x${result.height} ${name} target height ${size.height}`);
    if (['phoneTab','positionFilter','targetStar'].includes(name)) {
      assert.ok(size.width >= 44, `${result.width}x${result.height} ${name} target width ${size.width}`);
    }
  }
}

try {
  fs.mkdirSync(artifactsDir, { recursive: true });
  await page.goto(appUrl, { waitUntil: 'load' });
  await page.waitForSelector('.position-player-card');
  await page.waitForFunction(() => document.body.classList.contains('draft-layout-efficiency-ready'));
  await page.waitForFunction(() => window.WarRoomPhoneDecisionView && document.getElementById('war-room-phone-decision-styles')?.sheet);
  await settle();

  const phoneResults = [];
  for (const [width, height] of phones) {
    const result = await measurePhone(width, height);
    phoneResults.push(result);
    if ([320,390,430].includes(width)) {
      await page.screenshot({ path: path.join(artifactsDir, `wr-026-phone-${width}x${height}.png`), fullPage: true });
    }
    assert.deepEqual(result.visibleColumns, ['WR'], `${width}x${height} must expose one primary position`);
    assert.ok(result.visibleCards >= 1 && result.visibleCards <= 8, `${width}x${height} compact set must contain 1-8 players`);
    assert.ok(result.compactHidden > 0, `${width}x${height} must defer lower players`);
    assert.ok(result.choicesAboveFold >= 1, `${width}x${height} must expose an actionable player in the opening viewport`);
    assert.equal(result.occluded, false, `${width}x${height} actionable player must not be occluded`);
    assert.equal(result.overflow, 0, `${width}x${height} horizontal overflow`);
    assert.equal(result.recommendation, true, `${width}x${height} recommendation must remain reachable`);
    assert.equal(result.pressure, true, `${width}x${height} pressure must remain reachable`);
    assert.equal(result.myDraft, true, `${width}x${height} My Draft must remain reachable`);
    assertTargets(result);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await resetPhone('WR');

  const setup = page.locator('.draft-command-setup-disclosure');
  assert.equal(await setup.getAttribute('open'), null, 'Phone Draft Setup defaults collapsed');
  await setup.locator('summary').click();
  await settle();
  assert.equal(await setup.getAttribute('open'), '', 'Draft Setup remains one tap away');
  await setup.locator('summary').click();
  await settle();

  await page.locator('[data-phone-position="RB"]').click();
  await settle();
  assert.deepEqual(await page.evaluate(() => ({
    active: WarRoomPhoneDecisionView.getActivePosition(),
    visible: [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').map(column => column.dataset.position)
  })), { active: 'RB', visible: ['RB'] });
  assert.ok(await page.locator('.position-column.phone-position-active .phone-compact-hidden').count() > 0, 'RB compact list defers lower players');
  await page.locator('#phone-position-show-more').click();
  await settle();
  assert.equal(await page.locator('.position-column.phone-position-active .phone-compact-hidden').count(), 0, 'Show more reveals full active position');

  await page.locator('[data-phone-position="ENDGAME"]').click();
  await settle();
  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('position-tier-grid')).display), 'none', 'K/DST removes primary stack from flow');
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.getElementById('position-endgame-section')).display), 'none', 'K/DST remains reachable');

  await page.locator('[data-phone-position="WR"]').click();
  await page.locator('#searchBox').fill('Josh');
  await page.locator('#searchBox').dispatchEvent('input');
  await settle();
  assert.equal(await page.evaluate(() => document.body.classList.contains('phone-decision-search-active')), true, 'Search enters full-results mode');
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').length), 4, 'Search spans all primary positions');
  assert.equal(await page.locator('.phone-compact-hidden').count(), 0, 'Search is never compact-truncated');
  await resetPhone('WR');

  await page.locator('.filterbtn[data-pos="QB"]').click();
  await page.waitForTimeout(30);
  await settle();
  assert.equal(await page.evaluate(() => WarRoomPhoneDecisionView.getActivePosition()), 'QB', 'Existing filter synchronizes phone context');
  await page.setViewportSize({ width: 768, height: 1024 });
  await settle();
  assert.equal(await page.evaluate(() => currentPosFilter), 'QB', 'Filter survives phone-to-tablet resize');
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').map(column => column.dataset.position)), ['QB'], 'Tablet preserves QB filter');
  assert.equal(await page.locator('.phone-compact-hidden').count(), 0, 'Phone truncation clears above 600px');

  await page.setViewportSize({ width: 390, height: 844 });
  await settle();
  await page.locator('.mark-mode-btn[data-mark-mode="mine"]').click();
  const card = page.locator('.position-column.phone-position-active .position-player-card:not(.phone-compact-hidden)').first();
  const key = await card.getAttribute('data-player-key');
  await card.click();
  await settle();
  assert.equal(await page.locator(`.position-player-card[data-player-key="${key}"]`).first().evaluate(element => element.classList.contains('is-mine') || element.dataset.status === 'mine'), true, 'Mine marking remains unchanged');
  await card.click();
  await settle();

  const star = page.locator('.position-column.phone-position-active .position-player-card:not(.phone-compact-hidden) .draft-target-star').first();
  if (await star.count()) {
    await star.click();
    await settle();
    assert.equal(await star.evaluate(element => element.closest('.position-player-card')?.classList.contains('is-targeted')), true, 'Target star remains usable');
    await star.click();
    await settle();
  }

  await page.locator('.myteam-toggle').click();
  await settle();
  assert.equal(await page.locator('#myteam-panel').getAttribute('aria-hidden'), 'false', 'My Draft opens on phone');
  await page.locator('#myteam-panel .close-btn').click();
  await page.locator('#draft-manage > summary').click();
  assert.equal(await page.locator('#draft-manage').getAttribute('open'), '', 'Manage opens on phone');
  await page.locator('#draft-manage > summary').click();

  await page.locator('.filterbtn[data-pos="ALL"]').click();
  await page.waitForTimeout(30);
  await settle();
  await page.evaluate(() => WarRoomPhoneDecisionView.setActivePosition('TE'));
  await settle();
  await page.setViewportSize({ width: 768, height: 1024 });
  await settle();
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').map(column => column.dataset.position)), ['WR','RB','QB','TE'], 'Normal tablet board restores four columns');
  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('phone-position-decision-nav')).display), 'none', 'Phone controls inert above 600px');

  await page.setViewportSize({ width: 390, height: 844 });
  await settle();
  assert.equal(await page.evaluate(() => WarRoomPhoneDecisionView.getActivePosition()), 'TE', 'Selected phone position survives breakpoint round trip');
  await page.evaluate(() => setBoardView('overall', { persist: false }));
  await settle();
  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('phone-position-decision-nav')).display), 'none', 'Overall remains untouched by phone navigator');
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.getElementById('big-board-wrap')).display), 'none', 'Overall remains reachable');
  await page.evaluate(() => setBoardView('position', { persist: false }));
  await settle();

  const desktopResults = [];
  for (const [width, height] of desktops) {
    await page.setViewportSize({ width, height });
    await settle();
    const state = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      return {
        width: innerWidth,
        height: innerHeight,
        nav: getComputedStyle(document.getElementById('phone-position-decision-nav')).display,
        visibleColumns: [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').map(column => column.dataset.position),
        compactHidden: document.querySelectorAll('.phone-compact-hidden').length,
        phoneReady: document.body.classList.contains('phone-decision-view-ready'),
        overflow: Math.max(0, document.documentElement.scrollWidth - vw, document.body.scrollWidth - vw)
      };
    });
    desktopResults.push(state);
    assert.equal(state.nav, 'none', `${width}x${height} phone nav hidden`);
    assert.deepEqual(state.visibleColumns, ['WR','RB','QB','TE'], `${width}x${height} four-column board preserved`);
    assert.equal(state.compactHidden, 0, `${width}x${height} no phone truncation`);
    assert.equal(state.phoneReady, false, `${width}x${height} no phone layout class`);
    assert.equal(state.overflow, 0, `${width}x${height} no horizontal overflow`);
  }

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: path.join(artifactsDir, 'wr-026-desktop-768x1024.png'), fullPage: true });
  fs.writeFileSync(path.join(artifactsDir, 'wr-026-phone-decision-report.json'), JSON.stringify({ phone: phoneResults, desktop: desktopResults }, null, 2) + '\n');
  phoneResults.forEach(result => console.log(`WR026_PHONE_MEASURE ${JSON.stringify(result)}`));
  assert.deepEqual(consoleErrors, [], `Unexpected browser console errors: ${JSON.stringify(consoleErrors)}`);
  console.log(`WR-026 phone decision view valid: ${phones.length} phone and ${desktops.length} desktop/tablet viewports.`);
} finally {
  await browser.close();
  if (server) server.close();
}
