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
  await page.waitForSelector('#war-room-draft-polish-styles');
  await page.waitForFunction(() => typeof WarRoomDraftAwareness === 'object');

  await page.evaluate(() => clearDraftStateFromBoard());

  const keys = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tr.draftrow')]
      .filter(row => ['RB','WR','QB','TE'].includes(row.getAttribute('data-pos')))
      .slice(0, 2);
    const mine = rows[0];
    const taken = rows[1];

    mine.classList.remove('drafted-other');
    mine.classList.add('drafted-mine');
    mine.setAttribute('data-pick', '1');
    mine.setAttribute('data-team-slot', '1');

    taken.classList.remove('drafted-mine');
    taken.classList.add('drafted-other');
    taken.setAttribute('data-pick', '2');
    taken.setAttribute('data-team-slot', '2');

    triggerAllBoardUpdates({deferIntelligence:true});
    WarRoomDraftAwareness.evaluateNow();

    return {
      mine: getPositionBoardRowKey(mine),
      taken: getPositionBoardRowKey(taken)
    };
  });

  await page.waitForFunction(({mine, taken}) => {
    return document.querySelector(`.position-player-card[data-player-key="${mine}"].is-mine`) &&
      document.querySelector(`.position-player-card[data-player-key="${taken}"].is-drafted`);
  }, keys);

  const state = await page.evaluate(({mine, taken}) => {
    const mineCard = document.querySelector(`.position-player-card[data-player-key="${mine}"]`);
    const takenCard = document.querySelector(`.position-player-card[data-player-key="${taken}"]`);
    const mineStyle = getComputedStyle(mineCard);
    const takenStyle = getComputedStyle(takenCard);
    const heading = document.querySelector('.draft-awareness-changes .draft-awareness-heading > span');
    const actions = document.querySelector('.draft-command-actions');
    const recommendationBox = document.getElementById('recommended-pick-box');
    const recommendationStyle = recommendationBox ? getComputedStyle(recommendationBox) : null;
    const recommendationRect = recommendationBox ? recommendationBox.getBoundingClientRect() : null;
    return {
      mineOpacity: Number(mineStyle.opacity),
      takenOpacity: Number(takenStyle.opacity),
      mineBorder: mineStyle.borderLeftColor,
      headingText: heading?.textContent.trim() || '',
      headingSize: parseFloat(getComputedStyle(heading).fontSize),
      actionsDisplay: actions ? getComputedStyle(actions).display : 'none',
      recommendationOpacity: recommendationStyle ? Number(recommendationStyle.opacity) : 0,
      recommendationLeft: recommendationRect ? recommendationRect.left : -1,
      recommendationBottom: recommendationRect ? window.innerHeight - recommendationRect.bottom : -1,
      recommendationWidth: recommendationRect ? recommendationRect.width : 0,
      recommendationHeight: recommendationRect ? recommendationRect.height : 0
    };
  }, keys);

  assert.equal(state.mineOpacity, 1, 'Mine player should stay fully visible');
  assert.ok(state.takenOpacity <= 0.35, `taken player should remain muted, got ${state.takenOpacity}`);
  assert.match(state.mineBorder, /112, 213, 150/, 'Mine player should use the green status accent');
  assert.equal(state.headingText, 'SINCE YOUR PICK');
  assert.ok(state.headingSize >= 8.5, `Since Your Pick should be more readable, got ${state.headingSize}px`);
  assert.equal(state.actionsDisplay, 'none', 'Why/Intel action section should be hidden');
  assert.equal(state.recommendationOpacity, 0, 'legacy recommendation strip should not be visible');
  assert.ok(state.recommendationLeft >= 0 && state.recommendationLeft <= 3, 'legacy recommendation hook should stay at the viewport edge');
  assert.ok(state.recommendationBottom >= 0 && state.recommendationBottom <= 3, 'legacy recommendation hook should stay at the viewport bottom edge');
  assert.ok(state.recommendationWidth <= 2.1 && state.recommendationHeight <= 2.1, 'legacy recommendation hook should not occupy visible layout space');

  assert.deepEqual(errors, []);
  console.log('Draft polish regression valid: Mine is green/full-opacity, Taken stays muted, Since Your Pick is larger, and Why/Intel surfaces are removed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
