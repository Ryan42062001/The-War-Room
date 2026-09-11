import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const artifactsDir = path.join(root, 'artifacts');
const phones = [[320,700],[375,812],[390,844],[430,932]];
const desktopGuards = [[768,1024],[820,900],[900,900],[1280,800],[1440,900]];

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

async function clearSearch() {
  await page.evaluate(() => {
    const input = document.getElementById('searchBox');
    if (!input) return;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles:true }));
  });
  await settle();
}

async function chooseAllFilter() {
  const all = page.locator('.filterbtn[data-pos="ALL"]');
  if (await all.count()) {
    await all.click();
    await page.waitForTimeout(25);
    await settle();
  }
}

async function resetPhone(position = 'WR') {
  await page.evaluate(next => {
    setBoardView('position', { persist:false });
    window.WarRoomPhoneDecisionView.setActivePosition(next);
    window.scrollTo(0, 0);
  }, position);
  await clearSearch();
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
      return { width:Math.round(rect.width * 10) / 10, height:Math.round(rect.height * 10) / 10 };
    };
    const active = document.querySelector('#position-tier-grid > .position-column.phone-position-active');
    const cards = active ? [...active.querySelectorAll('.position-player-card')].filter(visible) : [];
    const inViewport = cards.filter(card => {
      const rect = card.getBoundingClientRect();
      return rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0;
    });
    const firstRect = cards[0]?.getBoundingClientRect() || null;
    const hitCard = inViewport[0] || null;
    let occluded = false;
    if (hitCard) {
      const rect = hitCard.getBoundingClientRect();
      const x = Math.max(0, Math.min(innerWidth - 1, rect.left + Math.min(28, rect.width / 2)));
      const y = Math.max(0, Math.min(innerHeight - 1, rect.top + Math.min(20, rect.height / 2)));
      const hit = document.elementFromPoint(x, y);
      occluded = Boolean(hit && hit !== hitCard && !hitCard.contains(hit));
    }
    const viewportWidth = document.documentElement.clientWidth;
    return {
      width:innerWidth,
      height:innerHeight,
      visibleColumns:[...document.querySelectorAll('#position-tier-grid > .position-column')].filter(visible).map(column => column.dataset.position),
      visibleCards:cards.length,
      compactHidden:active ? active.querySelectorAll('.phone-compact-hidden').length : 0,
      firstChoiceY:firstRect ? Math.round(firstRect.top * 10) / 10 : null,
      choicesAboveFold:inViewport.length,
      occluded,
      overflow:Math.max(0, document.documentElement.scrollWidth - viewportWidth, document.body.scrollWidth - viewportWidth),
      recommendation:visible(document.querySelector('.draft-command-recommendation')),
      pressure:visible(document.querySelector('.draft-command-pressure-wrap')),
      myDraft:visible(document.querySelector('.myteam-toggle')),
      targets:{
        phoneTab:size('.phone-position-tab'),
        showMore:size('#phone-position-show-more'),
        boardView:size('.board-view-btn'),
        search:size('#searchBox'),
        positionFilter:size('.filterbtn[data-pos="WR"]'),
        myDraft:size('.myteam-toggle'),
        markMode:size('.mark-mode-btn[data-mark-mode="mine"]'),
        targetStar:size('.position-column.phone-position-active .draft-target-star')
      }
    };
  });
}

function assertTouchTargets(result) {
  for (const [name, size] of Object.entries(result.targets)) {
    if (!size) continue;
    assert.ok(size.height >= 44, `${result.width}x${result.height}: ${name} target must be >=44px high; got ${size.height}`);
    if (['phoneTab','positionFilter','targetStar'].includes(name)) {
      assert.ok(size.width >= 44, `${result.width}x${result.height}: ${name} target must be >=44px wide; got ${size.width}`);
    }
  }
}

try {
  fs.mkdirSync(artifactsDir, { recursive:true });
  await page.goto(appUrl, { waitUntil:'load' });
  await page.waitForSelector('.position-player-card');
  await page.waitForSelector('#draft-command-bar');
  await page.waitForFunction(() => document.body.classList.contains('draft-layout-efficiency-ready'));
  await page.waitForFunction(() => window.WarRoomPhoneDecisionView && document.getElementById('war-room-phone-decision-styles')?.sheet);
  await settle();

  const phoneResults = [];
  for (const [width, height] of phones) {
    const result = await measurePhone(width, height);
    phoneResults.push(result);
    assert.deepEqual(result.visibleColumns, ['WR'], `${width}x${height}: only one primary position should be exposed`);
    assert.ok(result.visibleCards >= 1 && result.visibleCards <= 8, `${width}x${height}: compact set must contain 1-8 actionable players`);
    assert.ok(result.compactHidden > 0, `${width}x${height}: lower players must be deferred`);
    assert.ok(result.choicesAboveFold >= 1, `${width}x${height}: opening viewport must contain an actionable player`);
    assert.equal(result.occluded, false, `${width}x${height}: actionable player must not be occluded`);
    assert.equal(result.overflow, 0, `${width}x${height}: no horizontal document overflow`);
    assert.equal(result.recommendation, true, `${width}x${height}: recommendation remains reachable`);
    assert.equal(result.pressure, true, `${width}x${height}: pressure remains reachable`);
    assert.equal(result.myDraft, true, `${width}x${height}: My Draft remains reachable`);
    assertTouchTargets(result);
    if ([320,390,430].includes(width)) {
      await page.screenshot({ path:path.join(artifactsDir, `wr-026-phone-${width}x${height}.png`), fullPage:true });
    }
  }

  await page.setViewportSize({ width:390, height:844 });
  await resetPhone('WR');

  assert.equal(await page.evaluate(() => document.querySelector('.draft-command-setup-disclosure')?.open), false, 'Phone Draft Setup defaults collapsed');
  await page.evaluate(() => document.querySelector('.draft-command-setup-disclosure > summary')?.click());
  await page.waitForFunction(() => document.querySelector('.draft-command-setup-disclosure')?.open === true);
  await page.evaluate(() => document.querySelector('.draft-command-setup-disclosure > summary')?.click());
  await page.waitForFunction(() => document.querySelector('.draft-command-setup-disclosure')?.open === false);

  await page.locator('[data-phone-position="RB"]').click();
  await settle();
  assert.deepEqual(await page.evaluate(() => ({
    active:WarRoomPhoneDecisionView.getActivePosition(),
    visible:[...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').map(column => column.dataset.position)
  })), {active:'RB', visible:['RB']}, 'one-tap position switch works');
  assert.ok(await page.locator('.position-column.phone-position-active .phone-compact-hidden').count() > 0, 'RB compact view defers lower players');
  await page.locator('#phone-position-show-more').click();
  await settle();
  assert.equal(await page.locator('.position-column.phone-position-active .phone-compact-hidden').count(), 0, 'Show all restores full active position');

  await page.locator('[data-phone-position="ENDGAME"]').click();
  await settle();
  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('position-tier-grid')).display), 'none', 'K/DST context removes primary stack from flow');
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.getElementById('position-endgame-section')).display), 'none', 'K/DST remains reachable');

  await page.locator('[data-phone-position="WR"]').click();
  await page.locator('#searchBox').fill('Josh');
  await page.locator('#searchBox').dispatchEvent('input');
  await settle();
  assert.equal(await page.evaluate(() => document.body.classList.contains('phone-decision-search-active')), true, 'search enters full-results mode');
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').length), 4, 'search spans all primary positions');
  assert.equal(await page.locator('.phone-compact-hidden').count(), 0, 'search results are not truncated');
  await clearSearch();

  await page.locator('.filterbtn[data-pos="QB"]').click();
  await page.waitForTimeout(30);
  await settle();
  assert.equal(await page.evaluate(() => WarRoomPhoneDecisionView.getActivePosition()), 'QB', 'existing QB filter synchronizes phone context');
  await page.setViewportSize({ width:768, height:1024 });
  await settle();
  assert.equal(await page.evaluate(() => currentPosFilter), 'QB', 'filter state survives phone-to-tablet resize');
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').map(column => column.dataset.position)), ['QB'], 'tablet correctly preserves active QB filter');
  assert.equal(await page.locator('.phone-compact-hidden').count(), 0, 'phone truncation is removed above 600px');

  await page.setViewportSize({ width:390, height:844 });
  await settle();
  await page.locator('.mark-mode-btn[data-mark-mode="mine"]').click();
  const card = page.locator('.position-column.phone-position-active .position-player-card:not(.phone-compact-hidden)').first();
  const key = await card.getAttribute('data-player-key');
  await card.click();
  await settle();
  assert.equal(await page.locator(`.position-player-card[data-player-key="${key}"]`).first().evaluate(element => element.classList.contains('is-mine') || element.dataset.status === 'mine'), true, 'Mine marking semantics remain unchanged');
  await card.click();
  await settle();

  const star = page.locator('.position-column.phone-position-active .position-player-card:not(.phone-compact-hidden) .draft-target-star').first();
  if (await star.count()) {
    await star.click();
    await settle();
    assert.equal(await star.evaluate(element => element.closest('.position-player-card')?.classList.contains('is-targeted')), true, 'target-star action remains usable');
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

  // Waiting -> Near -> On-the-Clock remain distinguishable at phone size.
  await page.evaluate(() => {
    clearDraftStateFromBoard();
    WarRoomCommandBarFixes.applySettings({teams:10, slot:5, rounds:16}, false);
    triggerAllBoardUpdates({deferIntelligence:true});
  });
  await page.waitForFunction(() => document.body.dataset.draftCommandMode === 'waiting' && !document.getElementById('draft-command-bar').classList.contains('is-near'));
  await page.evaluate(() => {
    [...document.querySelectorAll('tr.draftrow')].slice(0, 2).forEach((row, index) => {
      row.classList.remove('drafted-mine','drafted-other');
      row.classList.add('drafted-other');
      row.dataset.pick = String(index + 1);
      row.dataset.teamSlot = String(index + 1);
    });
    triggerAllBoardUpdates({deferIntelligence:true});
  });
  await page.waitForFunction(() => document.body.dataset.draftCommandMode === 'waiting' && document.getElementById('draft-command-bar').classList.contains('is-near'));
  await page.evaluate(() => {
    [...document.querySelectorAll('tr.draftrow')].slice(2, 4).forEach((row, offset) => {
      row.classList.remove('drafted-mine','drafted-other');
      row.classList.add('drafted-other');
      row.dataset.pick = String(offset + 3);
      row.dataset.teamSlot = String(offset + 3);
    });
    triggerAllBoardUpdates({deferIntelligence:true});
  });
  await page.waitForFunction(() => document.body.dataset.draftCommandMode === 'on-clock');
  assert.equal(await page.evaluate(() => {
    const rect = document.getElementById('draft-command-bar').getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight;
  }), true, 'On-the-Clock command surface remains visible/reachable on phone');
  await page.evaluate(() => clearDraftStateFromBoard());
  await chooseAllFilter();

  await page.evaluate(() => WarRoomPhoneDecisionView.setActivePosition('TE'));
  await settle();
  await page.setViewportSize({ width:768, height:1024 });
  await settle();
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').map(column => column.dataset.position)), ['WR','RB','QB','TE'], 'normal tablet board restores four columns after clearing filter');
  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('phone-position-decision-nav')).display), 'none', 'phone navigator is inert above 600px');

  await page.setViewportSize({ width:390, height:844 });
  await settle();
  assert.equal(await page.evaluate(() => WarRoomPhoneDecisionView.getActivePosition()), 'TE', 'phone position survives breakpoint round trip');
  await page.evaluate(() => setBoardView('overall', { persist:false }));
  await settle();
  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('phone-position-decision-nav')).display), 'none', 'Overall is not overlaid by phone navigator');
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.getElementById('big-board-wrap')).display), 'none', 'Overall remains reachable');
  await page.evaluate(() => setBoardView('position', { persist:false }));
  await settle();

  const desktopResults = [];
  for (const [width, height] of desktopGuards) {
    await page.setViewportSize({ width, height });
    await settle();
    const state = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      return {
        width:innerWidth,
        height:innerHeight,
        nav:getComputedStyle(document.getElementById('phone-position-decision-nav')).display,
        visibleColumns:[...document.querySelectorAll('#position-tier-grid > .position-column')].filter(column => getComputedStyle(column).display !== 'none').map(column => column.dataset.position),
        compactHidden:document.querySelectorAll('.phone-compact-hidden').length,
        phoneReady:document.body.classList.contains('phone-decision-view-ready'),
        overflow:Math.max(0, document.documentElement.scrollWidth - viewportWidth, document.body.scrollWidth - viewportWidth)
      };
    });
    desktopResults.push(state);
    assert.equal(state.nav, 'none', `${width}x${height}: phone nav hidden`);
    assert.deepEqual(state.visibleColumns, ['WR','RB','QB','TE'], `${width}x${height}: four-column desktop/tablet board preserved`);
    assert.equal(state.compactHidden, 0, `${width}x${height}: no phone truncation`);
    assert.equal(state.phoneReady, false, `${width}x${height}: no active phone presentation state`);
    assert.equal(state.overflow, 0, `${width}x${height}: no horizontal overflow`);
  }

  await page.setViewportSize({ width:768, height:1024 });
  await page.screenshot({ path:path.join(artifactsDir, 'wr-026-desktop-768x1024.png'), fullPage:true });
  const report = { phone:phoneResults, desktop:desktopResults };
  fs.writeFileSync(path.join(artifactsDir, 'wr-026-phone-decision-report.json'), JSON.stringify(report, null, 2) + '\n');
  phoneResults.forEach(result => console.log(`WR026_PHONE_MEASURE ${JSON.stringify(result)}`));
  assert.deepEqual(browserErrors, [], `Unexpected browser errors: ${JSON.stringify(browserErrors)}`);
  console.log(`WR-026 phone decision view valid: ${phones.length} phone viewports and ${desktopGuards.length} desktop/tablet guard viewports.`);
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
