import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const artifactsDir = path.join(root, 'artifacts');
const phoneViewports = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 }
];
const desktopViewports = [
  { width: 768, height: 1024 },
  { width: 820, height: 900 },
  { width: 900, height: 900 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 }
];

const server = process.env.WAR_ROOM_URL ? null : http.createServer((request, response) => {
  const relative = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\//, '');
  fs.readFile(path.join(root, relative), (error, data) => {
    response.statusCode = error ? 404 : 200;
    response.end(error ? 'not found' : data);
  });
});
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const appUrl = process.env.WAR_ROOM_URL || `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const consoleErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => consoleErrors.push(error.message));

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

async function settle() {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function clearSearch() {
  await page.evaluate(() => {
    const input = document.getElementById('searchBox');
    if (!input) return;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await settle();
}

async function ensureCollapsed() {
  const expanded = await page.evaluate(() => Boolean(window.WarRoomPhoneDecisionView?.isExpanded?.()));
  if (expanded) {
    await page.locator('#phone-position-show-more').click();
    await settle();
  }
}

async function phoneMeasurement(viewport) {
  await page.setViewportSize(viewport);
  await page.evaluate(() => {
    setBoardView('position', { persist: false });
    window.WarRoomPhoneDecisionView.setActivePosition('WR');
    window.scrollTo(0, 0);
  });
  await clearSearch();
  await ensureCollapsed();
  await settle();

  return page.evaluate(() => {
    function visible(element) {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
    }
    function size(selector) {
      const element = [...document.querySelectorAll(selector)].find(visible);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }

    const columns = [...document.querySelectorAll('#position-tier-grid > .position-column')];
    const visibleColumns = columns.filter(visible);
    const active = document.querySelector('#position-tier-grid > .position-column.phone-position-active');
    const visibleCards = active ? [...active.querySelectorAll('.position-player-card')].filter(visible) : [];
    const firstCard = visibleCards[0] || null;
    const firstRect = firstCard ? firstCard.getBoundingClientRect() : null;
    const viewportWidth = document.documentElement.clientWidth;
    const overflow = Math.max(0, document.documentElement.scrollWidth - viewportWidth, document.body.scrollWidth - viewportWidth);
    const nav = document.getElementById('phone-position-decision-nav');
    const navRect = nav?.getBoundingClientRect();
    const more = document.getElementById('phone-position-show-more');
    const moreRect = more && visible(more) ? more.getBoundingClientRect() : null;

    let firstCardOccluded = false;
    if (firstRect) {
      const x = Math.max(0, Math.min(innerWidth - 1, firstRect.left + Math.min(firstRect.width / 2, 28)));
      const y = Math.max(0, Math.min(innerHeight - 1, firstRect.top + Math.min(firstRect.height / 2, 20)));
      const hit = document.elementFromPoint(x, y);
      firstCardOccluded = Boolean(hit && hit !== firstCard && !firstCard.contains(hit));
    }

    return {
      width: innerWidth,
      height: innerHeight,
      activePosition: window.WarRoomPhoneDecisionView.getActivePosition(),
      navVisible: visible(nav),
      visibleColumns: visibleColumns.map(column => column.getAttribute('data-position')),
      visibleCards: visibleCards.length,
      compactHiddenCards: active ? active.querySelectorAll('.phone-compact-hidden').length : 0,
      firstChoiceY: firstRect ? firstRect.top : null,
      choicesAboveFold: visibleCards.filter(card => {
        const rect = card.getBoundingClientRect();
        return rect.top < innerHeight && rect.bottom > 0;
      }).length,
      firstCardOccluded,
      overflow,
      navTop: navRect ? navRect.top : null,
      navBottom: navRect ? navRect.bottom : null,
      moreTop: moreRect ? moreRect.top : null,
      recommendationVisible: visible(document.querySelector('.draft-command-recommendation')),
      pressureVisible: visible(document.querySelector('.draft-command-pressure-wrap')),
      myDraftVisible: visible(document.querySelector('.myteam-toggle')),
      targetSizes: {
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

function assertPhoneTargetSizes(measurement) {
  for (const [name, size] of Object.entries(measurement.targetSizes)) {
    if (!size) continue;
    assert.ok(size.height >= 44, `${measurement.width}x${measurement.height} ${name} must be at least 44px tall; got ${JSON.stringify(size)}`);
    if (name === 'phoneTab' || name === 'positionFilter' || name === 'targetStar') {
      assert.ok(size.width >= 44, `${measurement.width}x${measurement.height} ${name} must be at least 44px wide; got ${JSON.stringify(size)}`);
    }
  }
}

try {
  fs.mkdirSync(artifactsDir, { recursive: true });
  await page.goto(appUrl, { waitUntil: 'load' });
  await page.waitForSelector('.position-player-card');
  await page.waitForSelector('#draft-command-bar');
  await page.waitForFunction(() => document.body.classList.contains('draft-layout-efficiency-ready'), null, { timeout: 10000 });
  await page.waitForFunction(() => window.WarRoomPhoneDecisionView && document.getElementById('phone-position-decision-nav'), null, { timeout: 10000 });
  await page.waitForFunction(() => document.getElementById('war-room-phone-decision-styles')?.sheet, null, { timeout: 10000 });
  await settle();

  const phoneResults = [];
  for (const viewport of phoneViewports) {
    const measurement = await phoneMeasurement(viewport);
    phoneResults.push(measurement);

    assert.equal(measurement.navVisible, true, `Phone navigator must be visible at ${viewport.width}x${viewport.height}`);
    assert.deepEqual(measurement.visibleColumns, ['WR'], `Phone view must expose one primary position at ${viewport.width}x${viewport.height}`);
    assert.ok(measurement.visibleCards > 0 && measurement.visibleCards <= 8, `Compact phone view must show 1-8 actionable WR choices at ${viewport.width}x${viewport.height}; got ${measurement.visibleCards}`);
    assert.ok(measurement.compactHiddenCards > 0, `Compact phone view must defer the long tail at ${viewport.width}x${viewport.height}`);
    assert.equal(measurement.overflow, 0, `Phone view must not overflow horizontally at ${viewport.width}x${viewport.height}`);
    assert.equal(measurement.firstCardOccluded, false, `First phone choice must not be occluded at ${viewport.width}x${viewport.height}`);
    assert.equal(measurement.recommendationVisible, true, `Recommendation must remain reachable at ${viewport.width}x${viewport.height}`);
    assert.equal(measurement.pressureVisible, true, `Board pressure must remain reachable at ${viewport.width}x${viewport.height}`);
    assert.equal(measurement.myDraftVisible, true, `My Draft must remain reachable at ${viewport.width}x${viewport.height}`);
    assertPhoneTargetSizes(measurement);

    if (viewport.width === 320 || viewport.width === 390 || viewport.width === 430) {
      await page.screenshot({ path: path.join(artifactsDir, `wr-026-phone-${viewport.width}x${viewport.height}.png`), fullPage: true });
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    setBoardView('position', { persist: false });
    window.WarRoomPhoneDecisionView.setActivePosition('WR');
    window.scrollTo(0, 0);
  });
  await clearSearch();
  await ensureCollapsed();

  await page.locator('[data-phone-position="RB"]').click();
  await settle();
  let context = await page.evaluate(() => ({
    active: window.WarRoomPhoneDecisionView.getActivePosition(),
    visible: [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').map(column => column.getAttribute('data-position')),
    selected: document.querySelector('[data-phone-position="RB"]')?.getAttribute('aria-pressed')
  }));
  assert.deepEqual(context, { active: 'RB', visible: ['RB'], selected: 'true' }, 'Position navigator must switch to one RB context');

  const compactCount = await page.locator('.position-column.phone-position-active .phone-compact-hidden').count();
  assert.ok(compactCount > 0, 'RB compact view should defer lower players');
  await page.locator('#phone-position-show-more').click();
  await settle();
  assert.equal(await page.locator('.position-column.phone-position-active .phone-compact-hidden').count(), 0, 'Show all must restore the full active position');
  assert.equal(await page.locator('#phone-position-show-more').getAttribute('aria-expanded'), 'true', 'Show all must expose expansion state');

  await page.locator('[data-phone-position="ENDGAME"]').click();
  await settle();
  context = await page.evaluate(() => ({
    active: window.WarRoomPhoneDecisionView.getActivePosition(),
    gridDisplay: getComputedStyle(document.getElementById('position-tier-grid')).display,
    endgameDisplay: getComputedStyle(document.getElementById('position-endgame-section')).display
  }));
  assert.equal(context.active, 'ENDGAME', 'K/DST must be a first-class phone context');
  assert.equal(context.gridDisplay, 'none', 'Primary stacked grid must leave the phone flow in K/DST context');
  assert.notEqual(context.endgameDisplay, 'none', 'K/DST endgame must remain reachable');

  await page.locator('[data-phone-position="WR"]').click();
  await clearSearch();
  await page.locator('#searchBox').fill('Josh');
  await page.locator('#searchBox').dispatchEvent('input');
  await settle();
  const searchState = await page.evaluate(() => ({
    searchMode: document.body.classList.contains('phone-decision-search-active'),
    visibleColumns: [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').length,
    hiddenCompact: document.querySelectorAll('.phone-compact-hidden').length,
    moreVisible: (() => {
      const element = document.getElementById('phone-position-show-more');
      return element && getComputedStyle(element).display !== 'none' && !element.hidden;
    })()
  }));
  assert.equal(searchState.searchMode, true, 'Search must enter full cross-position phone results mode');
  assert.equal(searchState.visibleColumns, 4, 'Search must not hide matching players in other primary positions');
  assert.equal(searchState.hiddenCompact, 0, 'Search results must not be compact-truncated');
  assert.equal(searchState.moreVisible, false, 'Show-all control is unnecessary while search is already full');
  await clearSearch();

  await page.locator('.filterbtn[data-pos="QB"]').click();
  await page.waitForTimeout(20);
  await settle();
  assert.equal(await page.evaluate(() => window.WarRoomPhoneDecisionView.getActivePosition()), 'QB', 'Existing QB filter must synchronize phone context without replacing filter semantics');

  await page.locator('.mark-mode-btn[data-mark-mode="mine"]').click();
  const activeCard = page.locator('.position-column.phone-position-active .position-player-card:not(.phone-compact-hidden)').first();
  const activeKey = await activeCard.getAttribute('data-player-key');
  await activeCard.click();
  await settle();
  const markedMine = await page.locator(`.position-player-card[data-player-key="${activeKey}"]`).first().evaluate(card => card.classList.contains('is-mine') || card.getAttribute('data-status') === 'mine');
  assert.equal(markedMine, true, 'Phone player action must still use existing Mine marking semantics');
  await activeCard.click();
  await settle();

  await page.locator('.myteam-toggle').click();
  await settle();
  assert.equal(await page.locator('#myteam-panel').getAttribute('aria-hidden'), 'false', 'My Draft must open from phone view');
  await page.locator('#myteam-panel .close-btn').click();
  await settle();

  await page.locator('#draft-manage > summary').click();
  assert.equal(await page.locator('#draft-manage').getAttribute('open'), '', 'Manage must remain reachable on phone');
  await page.locator('#draft-manage > summary').click();

  await page.evaluate(() => {
    window.WarRoomPhoneDecisionView.setActivePosition('TE');
  });
  await settle();
  if (!(await page.evaluate(() => window.WarRoomPhoneDecisionView.isExpanded()))) {
    await page.locator('#phone-position-show-more').click();
    await settle();
  }

  await page.setViewportSize({ width: 768, height: 1024 });
  await settle();
  let resizeState = await page.evaluate(() => ({
    active: window.WarRoomPhoneDecisionView.getActivePosition(),
    expanded: window.WarRoomPhoneDecisionView.isExpanded(),
    navDisplay: getComputedStyle(document.getElementById('phone-position-decision-nav')).display,
    visibleColumns: [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').map(column => column.getAttribute('data-position')),
    hiddenCompact: document.querySelectorAll('.phone-compact-hidden').length,
    ariaHiddenColumns: document.querySelectorAll('#position-tier-grid > .position-column[aria-hidden="true"]').length
  }));
  assert.equal(resizeState.active, 'TE', 'Phone position selection must survive resize');
  assert.equal(resizeState.expanded, true, 'Phone expansion mode must survive resize');
  assert.equal(resizeState.navDisplay, 'none', 'Phone navigator must be inert above 600px');
  assert.deepEqual(resizeState.visibleColumns, ['WR', 'RB', 'QB', 'TE'], 'Desktop/tablet must restore the normal four-column position board');
  assert.equal(resizeState.hiddenCompact, 0, 'Desktop/tablet must not retain phone compact hiding');
  assert.equal(resizeState.ariaHiddenColumns, 0, 'Desktop/tablet must not retain phone accessibility hiding');

  await page.setViewportSize({ width: 390, height: 844 });
  await settle();
  resizeState = await page.evaluate(() => ({
    active: window.WarRoomPhoneDecisionView.getActivePosition(),
    expanded: window.WarRoomPhoneDecisionView.isExpanded(),
    visibleColumns: [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').map(column => column.getAttribute('data-position'))
  }));
  assert.equal(resizeState.active, 'TE', 'Returning to phone width must restore selected position');
  assert.equal(resizeState.expanded, true, 'Returning to phone width must restore expansion mode');
  assert.deepEqual(resizeState.visibleColumns, ['TE'], 'Returning to phone width must restore one-position context');

  await page.evaluate(() => setBoardView('overall', { persist: false }));
  await settle();
  const overallState = await page.evaluate(() => ({
    navDisplay: getComputedStyle(document.getElementById('phone-position-decision-nav')).display,
    overallDisplay: getComputedStyle(document.getElementById('big-board-wrap')).display,
    positionDisplay: getComputedStyle(document.getElementById('position-board')).display
  }));
  assert.equal(overallState.navDisplay, 'none', 'Phone decision navigator must leave Overall view untouched');
  assert.notEqual(overallState.overallDisplay, 'none', 'Overall board must remain reachable on phone');
  assert.equal(overallState.positionDisplay, 'none', 'Position board must hide in Overall as before');

  await page.evaluate(() => setBoardView('position', { persist: false }));
  await clearSearch();
  await settle();

  const desktopResults = [];
  for (const viewport of desktopViewports) {
    await page.setViewportSize(viewport);
    await settle();
    const state = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      return {
        width: innerWidth,
        height: innerHeight,
        navDisplay: getComputedStyle(document.getElementById('phone-position-decision-nav')).display,
        visibleColumns: [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').map(column => column.getAttribute('data-position')),
        hiddenCompact: document.querySelectorAll('.phone-compact-hidden').length,
        phoneClasses: document.body.classList.contains('phone-decision-view-ready'),
        overflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth, document.body.scrollWidth - viewportWidth)
      };
    });
    desktopResults.push(state);
    assert.equal(state.navDisplay, 'none', `Phone controls must stay hidden at ${viewport.width}x${viewport.height}`);
    assert.deepEqual(state.visibleColumns, ['WR', 'RB', 'QB', 'TE'], `Desktop/tablet four-column board must be preserved at ${viewport.width}x${viewport.height}`);
    assert.equal(state.hiddenCompact, 0, `Phone truncation must be absent at ${viewport.width}x${viewport.height}`);
    assert.equal(state.phoneClasses, false, `Phone layout state must be inert at ${viewport.width}x${viewport.height}`);
    assert.equal(state.overflow, 0, `Desktop/tablet overflow must remain zero at ${viewport.width}x${viewport.height}`);
  }

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: path.join(artifactsDir, 'wr-026-desktop-768x1024.png'), fullPage: true });

  const report = { phone: phoneResults, desktop: desktopResults };
  fs.writeFileSync(path.join(artifactsDir, 'wr-026-phone-decision-report.json'), JSON.stringify(report, null, 2) + '\n');
  phoneResults.forEach(result => console.log(`WR026_PHONE_MEASURE ${JSON.stringify(Object.fromEntries(Object.entries(result).map(([key, value]) => [key, typeof value === 'number' ? round(value) : value])))}`));
  console.log(`WR-026 phone decision view valid: ${phoneViewports.length} phone viewports and ${desktopViewports.length} desktop/tablet guard viewports.`);

  assert.deepEqual(consoleErrors, [], `Unexpected browser console errors: ${JSON.stringify(consoleErrors)}`);
} finally {
  await browser.close();
  if (server) server.close();
}
