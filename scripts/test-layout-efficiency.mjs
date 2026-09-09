import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const viewports = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 820, height: 900 },
  { width: 900, height: 900 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 }
];
const views = ['position', 'overall'];

// Immutable pre-production-edit measurements captured on WR-016 head
// 6397eb4a7f6aecbc8d9259df9c02f599363d2645 in CI run 34301185819.
const BASELINE = {
  '320x700:position': { firstChoiceY: 871, choicesAboveFold: 0, persistentUnion: 151, occludedChoices: 0 },
  '320x700:overall': { firstChoiceY: 1674.2, choicesAboveFold: 0, persistentUnion: 151, occludedChoices: 0 },
  '375x812:position': { firstChoiceY: 783, choicesAboveFold: 1, persistentUnion: 121, occludedChoices: 0 },
  '375x812:overall': { firstChoiceY: 1512.5, choicesAboveFold: 0, persistentUnion: 121, occludedChoices: 0 },
  '390x844:position': { firstChoiceY: 783, choicesAboveFold: 2, persistentUnion: 121, occludedChoices: 0 },
  '390x844:overall': { firstChoiceY: 1512.5, choicesAboveFold: 0, persistentUnion: 129.5, occludedChoices: 0 },
  '430x932:position': { firstChoiceY: 769, choicesAboveFold: 4, persistentUnion: 121, occludedChoices: 0 },
  '430x932:overall': { firstChoiceY: 1445.5, choicesAboveFold: 0, persistentUnion: 155, occludedChoices: 0 },
  '768x1024:position': { firstChoiceY: 631, choicesAboveFold: 9, persistentUnion: 197, occludedChoices: 3 },
  '768x1024:overall': { firstChoiceY: 1212.5, choicesAboveFold: 0, persistentUnion: 220, occludedChoices: 0 },
  '820x900:position': { firstChoiceY: 638.3, choicesAboveFold: 13, persistentUnion: 197, occludedChoices: 6 },
  '820x900:overall': { firstChoiceY: 1049.6, choicesAboveFold: 0, persistentUnion: 231, occludedChoices: 0 },
  '900x900:position': { firstChoiceY: 608.3, choicesAboveFold: 14, persistentUnion: 197, occludedChoices: 8 },
  '900x900:overall': { firstChoiceY: 1019.6, choicesAboveFold: 0, persistentUnion: 231, occludedChoices: 0 },
  '1280x800:position': { firstChoiceY: 457, choicesAboveFold: 30, persistentUnion: 169, occludedChoices: 16 },
  '1280x800:overall': { firstChoiceY: 978.6, choicesAboveFold: 0, persistentUnion: 213, occludedChoices: 0 },
  '1440x900:position': { firstChoiceY: 457, choicesAboveFold: 39, persistentUnion: 169, occludedChoices: 16 },
  '1440x900:overall': { firstChoiceY: 978.6, choicesAboveFold: 0, persistentUnion: 213, occludedChoices: 0 }
};

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
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', error => errors.push(error.message));

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

function assertFrequentTargets(measurement) {
  for (const [name, size] of Object.entries(measurement.targetSizes)) {
    if (!size) continue;
    assert.ok(
      size.width >= 24 && size.height >= 24,
      `${measurement.width}x${measurement.height} ${measurement.view} ${name} must be at least 24x24; got ${JSON.stringify(size)}`
    );
  }
}

try {
  await page.goto(appUrl, { waitUntil: 'load' });
  await page.waitForSelector('.position-player-card');
  await page.waitForSelector('#draft-command-bar');
  await page.waitForFunction(() => document.body.classList.contains('command-bar-ready'), null, { timeout: 10000 });
  await page.waitForFunction(() => document.getElementById('draft-control-shell'));
  await page.waitForTimeout(150);

  const results = [];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const view of views) {
      await page.evaluate(selectedView => {
        setBoardView(selectedView, { persist: false });
        window.scrollTo(0, 0);
      }, view);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

      const top = await page.evaluate(() => {
        function visible(element) {
          if (!element) return false;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
        }
        function rectOf(element) {
          const rect = element.getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height };
        }
        function choiceElements() {
          if (document.body.dataset.boardView === 'overall') {
            return [...document.querySelectorAll('tr.draftrow')].filter(visible);
          }
          return [...document.querySelectorAll('.position-player-card')].filter(visible);
        }
        function target(selector) {
          const element = [...document.querySelectorAll(selector)].find(visible);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }

        const choices = choiceElements();
        const firstChoice = choices
          .map(element => element.getBoundingClientRect())
          .filter(rect => rect.bottom > 0)
          .sort((a, b) => a.top - b.top)[0] || null;
        const choicesAboveFold = choices.filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.top < innerHeight && rect.bottom > 0;
        }).length;
        const viewportWidth = document.documentElement.clientWidth;
        const overflow = Math.max(0, document.documentElement.scrollWidth - viewportWidth, document.body.scrollWidth - viewportWidth);

        return {
          firstChoiceY: firstChoice ? firstChoice.top : null,
          choicesAboveFold,
          overflow,
          targetSizes: {
            boardView: target('.board-view-btn'),
            search: target('#searchBox'),
            positionFilter: target('.filterbtn[data-pos="WR"]'),
            myDraft: target('.myteam-toggle'),
            markMode: target('.mark-mode-btn[data-mark-mode="mine"]'),
            commandPressure: target('#draft-command-bar .draft-command-pressure'),
            commandSetupInput: target('#draft-command-bar .draft-command-setup-fields input'),
            targetStar: target('.draft-target-star'),
            tierNav: target('#tier-nav button')
          },
          topRects: {
            header: visible(document.querySelector('header')) ? rectOf(document.querySelector('header')) : null,
            toolbar: visible(document.querySelector('.toolbar')) ? rectOf(document.querySelector('.toolbar')) : null,
            statusbar: visible(document.querySelector('.statusbar')) ? rectOf(document.querySelector('.statusbar')) : null,
            tierNav: visible(document.querySelector('#tier-nav')) ? rectOf(document.querySelector('#tier-nav')) : null,
            commandBar: visible(document.querySelector('#draft-command-bar')) ? rectOf(document.querySelector('#draft-command-bar')) : null
          }
        };
      });

      const scrollMeasurement = await page.evaluate(() => {
        function visible(element) {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
        }
        function label(element) {
          return element.id || (typeof element.className === 'string' && element.className.trim().split(/\s+/).slice(0, 2).join('.')) || element.tagName.toLowerCase();
        }
        function unionLength(intervals) {
          const ordered = intervals
            .map(([start, end]) => [Math.max(0, start), Math.min(innerHeight, end)])
            .filter(([start, end]) => end > start)
            .sort((a, b) => a[0] - b[0]);
          if (!ordered.length) return 0;
          let total = 0;
          let [start, end] = ordered[0];
          for (const [nextStart, nextEnd] of ordered.slice(1)) {
            if (nextStart <= end) end = Math.max(end, nextEnd);
            else {
              total += end - start;
              start = nextStart;
              end = nextEnd;
            }
          }
          return total + (end - start);
        }

        const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        window.scrollTo(0, Math.min(560, maxScroll));
        return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
          const persistent = [...document.querySelectorAll('body *')]
            .filter(element => {
              const position = getComputedStyle(element).position;
              return (position === 'sticky' || position === 'fixed') && visible(element);
            })
            .map(element => {
              const rect = element.getBoundingClientRect();
              return { label: label(element), top: rect.top, bottom: rect.bottom, height: rect.height };
            });

          const choices = document.body.dataset.boardView === 'overall'
            ? [...document.querySelectorAll('tr.draftrow')]
            : [...document.querySelectorAll('.position-player-card')];
          let occludedChoices = 0;
          for (const choice of choices.filter(visible)) {
            const rect = choice.getBoundingClientRect();
            const x = Math.max(0, Math.min(innerWidth - 1, rect.left + Math.min(rect.width / 2, 24)));
            const y = Math.max(0, Math.min(innerHeight - 1, rect.top + Math.min(rect.height / 2, 12)));
            const hit = document.elementFromPoint(x, y);
            if (hit && hit !== choice && !choice.contains(hit)) occludedChoices += 1;
          }

          resolve({
            scrollY: window.scrollY,
            persistentUnion: unionLength(persistent.map(item => [item.top, item.bottom])),
            persistent,
            occludedChoices
          });
        })));
      });

      const focusMeasurement = await page.evaluate(async () => {
        const selectors = [
          '#positionBoardViewBtn',
          '#searchBox',
          '.filterbtn[data-pos="WR"]',
          '.myteam-toggle',
          '.mark-mode-btn[data-mark-mode="mine"]',
          '#draft-command-bar .draft-command-pressure',
          '#draft-command-bar .draft-command-setup-fields input'
        ];
        const results = [];
        function visible(element) {
          if (!element) return false;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        }
        function nextFrame() {
          return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }
        for (const selector of selectors) {
          const element = [...document.querySelectorAll(selector)].find(visible);
          if (!element) continue;
          element.focus({ preventScroll: true });
          element.scrollIntoView({ block: 'center', inline: 'nearest' });
          await nextFrame();
          const rect = element.getBoundingClientRect();
          const x = Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2));
          const y = Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2));
          const hit = document.elementFromPoint(x, y);
          const obscured = rect.top < 0 || rect.bottom > innerHeight || (hit && hit !== element && !element.contains(hit));
          results.push({ selector, top: rect.top, bottom: rect.bottom, obscured: Boolean(obscured) });
        }
        return results;
      });

      await page.evaluate(() => window.scrollTo(0, 0));

      const measurement = {
        width: viewport.width,
        height: viewport.height,
        view,
        firstChoiceY: round(top.firstChoiceY),
        choicesAboveFold: top.choicesAboveFold,
        persistentUnion: round(scrollMeasurement.persistentUnion),
        scrollY: round(scrollMeasurement.scrollY),
        occludedChoices: scrollMeasurement.occludedChoices,
        overflow: round(top.overflow),
        targetSizes: Object.fromEntries(Object.entries(top.targetSizes).map(([key, value]) => [key, value ? { width: round(value.width), height: round(value.height) } : null])),
        topRects: Object.fromEntries(Object.entries(top.topRects).map(([key, value]) => [key, value ? { top: round(value.top), bottom: round(value.bottom), height: round(value.height) } : null])),
        persistent: scrollMeasurement.persistent.map(item => ({ label: item.label, top: round(item.top), bottom: round(item.bottom), height: round(item.height) })),
        focusObscured: focusMeasurement.filter(item => item.obscured).map(item => item.selector)
      };

      results.push(measurement);
      const key = `${viewport.width}x${viewport.height}:${view}`;
      const baseline = BASELINE[key];
      assert.ok(baseline, `Missing WR-016 pre-change baseline for ${key}`);
      assert.equal(measurement.overflow, 0, `Horizontal overflow at ${key}: ${JSON.stringify(measurement)}`);
      assert.equal(measurement.occludedChoices, 0, `Actionable choices occluded by persistent chrome at ${key}: ${JSON.stringify(measurement)}`);
      assert.deepEqual(measurement.focusObscured, [], `Focused controls obscured at ${key}: ${JSON.stringify(measurement.focusObscured)}`);
      assert.ok(measurement.firstChoiceY <= baseline.firstChoiceY + 2, `First actionable choice regressed at ${key}: before ${baseline.firstChoiceY}, after ${measurement.firstChoiceY}`);
      assert.ok(measurement.choicesAboveFold >= baseline.choicesAboveFold, `Above-fold choices regressed at ${key}: before ${baseline.choicesAboveFold}, after ${measurement.choicesAboveFold}`);
      assert.ok(measurement.persistentUnion <= baseline.persistentUnion + 2, `Persistent viewport budget regressed at ${key}: before ${baseline.persistentUnion}, after ${measurement.persistentUnion}`);
      assertFrequentTargets(measurement);
    }
  }

  for (const key of ['820x900:position', '900x900:position', '1280x800:position', '1440x900:position']) {
    const result = results.find(item => `${item.width}x${item.height}:${item.view}` === key);
    assert.ok(BASELINE[key].occludedChoices > 0, `${key} baseline must demonstrate the pre-change occlusion defect`);
    assert.equal(result.occludedChoices, 0, `${key} must eliminate the pre-change sticky occlusion defect`);
  }

  for (const key of ['820x900:overall', '900x900:overall', '1280x800:overall', '1440x900:overall']) {
    const result = results.find(item => `${item.width}x${item.height}:${item.view}` === key);
    const baseline = BASELINE[key];
    assert.ok(
      result.firstChoiceY <= baseline.firstChoiceY - 10 || result.choicesAboveFold > baseline.choicesAboveFold,
      `${key} must materially improve Overall board access: before y=${baseline.firstChoiceY}/choices=${baseline.choicesAboveFold}, after y=${result.firstChoiceY}/choices=${result.choicesAboveFold}`
    );
  }

  assert.deepEqual(errors, [], `Browser errors: ${JSON.stringify(errors)}`);
  console.log('WR-016 post-change layout matrix (pre-change baseline: 6397eb4 / CI 34301185819):');
  for (const result of results) console.log(`LAYOUT_MEASURE ${JSON.stringify(result)}`);
  console.log(`Layout efficiency valid: ${viewports.length} viewports × ${views.length} board views; no horizontal overflow, choice/focus occlusion, target-size regressions, or pre-change visibility regressions.`);
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
