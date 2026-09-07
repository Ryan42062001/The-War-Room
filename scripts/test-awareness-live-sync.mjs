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
  await page.waitForSelector('.position-tier-block');
  await page.waitForSelector('#draft-awareness-strip');
  await page.waitForFunction(() => typeof WarRoomAwarenessLiveSync === 'object');
  await page.waitForFunction(() => {
    const link = document.getElementById('war-room-draft-polish-styles');
    return Boolean(link && link.sheet);
  });

  const state = await page.evaluate(() => {
    const candidate = [...document.querySelectorAll('.position-column')]
      .map(column => ({
        column,
        block: column.querySelector('.position-tier-block')
      }))
      .find(entry => entry.block && entry.block.querySelectorAll('.position-player-card').length >= 3);

    if (!candidate) throw new Error('No tier with at least three cards available for live-count regression.');

    const position = candidate.column.getAttribute('data-position');
    const block = candidate.block;
    const tier = block.getAttribute('data-tier') || '';
    const cards = [...block.querySelectorAll('.position-player-card')];

    cards.forEach((card, index) => card.setAttribute('data-status', index < 2 ? 'available' : 'taken'));
    block.setAttribute('data-available', '4');

    const pressure = WarRoomAwarenessLiveSync.getPositionPressure(position);
    const list = document.querySelector('#draft-awareness-strip .draft-change-list');
    const staleTier = tier === 'ELITE' ? 'PREMIUM' : 'ELITE';
    list.innerHTML =
      `<span class="draft-change-item is-watch"><i aria-hidden="true"></i>${position} WATCH · 4 left in ${tier}</span>` +
      `<span class="draft-change-item is-critical"><i aria-hidden="true"></i>${position} moved into ${staleTier} · 10 left</span>`;

    WarRoomAwarenessLiveSync.reconcileNow();

    const items = [...list.querySelectorAll('.draft-change-item')];
    const text = items.map(item => item.textContent.trim());
    const fontSize = items[0] ? parseFloat(getComputedStyle(items[0]).fontSize) : 0;

    return {
      position,
      tier,
      pressure,
      text,
      count: items.length,
      className: items[0]?.className || '',
      fontSize
    };
  });

  assert.equal(state.pressure.available, 2, 'live pressure must count actual available cards instead of cached data-available');
  assert.equal(state.pressure.level, 'closing');
  assert.equal(state.count, 1, 'stale same-position tier alerts should be removed');
  assert.equal(state.text[0], `${state.position} CLOSING · 2 left in ${state.tier}`);
  assert.doesNotMatch(state.text[0], /4 left/, 'visible Since Your Pick count must not preserve the stale cached count');
  assert.match(state.className, /is-closing/);
  assert.ok(state.fontSize >= 10, `Since Your Pick alert text should be clearly readable, got ${state.fontSize}px`);

  assert.deepEqual(errors, []);
  console.log('Awareness live-sync regression valid: stale 4-left alerts reconcile to the two live cards, stale same-position tier alerts are removed, and the alert text is readable.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
