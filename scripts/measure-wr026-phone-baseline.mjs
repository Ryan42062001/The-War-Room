import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const outDir = path.join(root, 'artifacts');
const outFile = path.join(outDir, 'wr-026-phone-baseline.json');
const viewports = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 }
];

const server = http.createServer((request, response) => {
  const relative = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\//, '');
  fs.readFile(path.join(root, relative), (error, data) => {
    response.statusCode = error ? 404 : 200;
    response.end(error ? 'not found' : data);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const appUrl = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
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
    await page.evaluate(() => {
      setBoardView('position', { persist: false });
      window.scrollTo(0, 0);
    });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    const measurement = await page.evaluate(() => {
      function visible(element) {
        if (!element) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
      }
      function rect(element) {
        if (!visible(element)) return null;
        const r = element.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      }
      function target(selector) {
        const element = [...document.querySelectorAll(selector)].find(visible);
        if (!element) return null;
        const r = element.getBoundingClientRect();
        return { width: r.width, height: r.height };
      }

      const choices = [...document.querySelectorAll('.position-player-card')].filter(visible);
      const choiceRects = choices.map(card => card.getBoundingClientRect()).sort((a, b) => a.top - b.top);
      const columns = [...document.querySelectorAll('#position-tier-grid > .position-column')]
        .filter(visible)
        .map(column => {
          const r = column.getBoundingClientRect();
          return {
            position: column.getAttribute('data-position'),
            top: r.top,
            bottom: r.bottom,
            height: r.height,
            inViewport: r.top < innerHeight && r.bottom > 0,
            fullyInViewport: r.top >= 0 && r.bottom <= innerHeight
          };
        })
        .sort((a, b) => a.top - b.top);
      const viewportWidth = document.documentElement.clientWidth;
      const overflow = Math.max(0, document.documentElement.scrollWidth - viewportWidth, document.body.scrollWidth - viewportWidth);
      const first = columns[0] || null;
      const second = columns[1] || null;

      return {
        firstChoiceY: choiceRects.length ? choiceRects[0].top : null,
        choicesAboveFold: choices.filter(card => {
          const r = card.getBoundingClientRect();
          return r.top < innerHeight && r.bottom > 0;
        }).length,
        firstToNextPositionDistance: first && second ? second.top - first.top : null,
        horizontalOverflow: overflow,
        fullPositionSectionsExposed: columns.length,
        positionSectionsInViewport: columns.filter(column => column.inViewport).length,
        fullPositionSectionsInViewport: columns.filter(column => column.fullyInViewport).length,
        columns,
        recommendation: rect(document.getElementById('recommended-pick-box')),
        pressure: rect(document.getElementById('board-pressure-widget')),
        myDraft: rect(document.querySelector('.myteam-toggle')),
        targetSizes: {
          boardView: target('.board-view-btn'),
          search: target('#searchBox'),
          positionFilter: target('.filterbtn[data-pos="WR"]'),
          myDraft: target('.myteam-toggle'),
          markMode: target('.mark-mode-btn[data-mark-mode="mine"]'),
          targetStar: target('.draft-target-star')
        }
      };
    });

    results.push({
      width: viewport.width,
      height: viewport.height,
      firstChoiceY: round(measurement.firstChoiceY),
      choicesAboveFold: measurement.choicesAboveFold,
      firstToNextPositionDistance: round(measurement.firstToNextPositionDistance),
      horizontalOverflow: round(measurement.horizontalOverflow),
      fullPositionSectionsExposed: measurement.fullPositionSectionsExposed,
      positionSectionsInViewport: measurement.positionSectionsInViewport,
      fullPositionSectionsInViewport: measurement.fullPositionSectionsInViewport,
      recommendationTop: measurement.recommendation ? round(measurement.recommendation.top) : null,
      pressureTop: measurement.pressure ? round(measurement.pressure.top) : null,
      myDraftTop: measurement.myDraft ? round(measurement.myDraft.top) : null,
      columns: measurement.columns.map(column => ({
        position: column.position,
        top: round(column.top),
        bottom: round(column.bottom),
        height: round(column.height),
        inViewport: column.inViewport,
        fullyInViewport: column.fullyInViewport
      })),
      targetSizes: Object.fromEntries(Object.entries(measurement.targetSizes).map(([key, value]) => [key, value ? { width: round(value.width), height: round(value.height) } : null]))
    });
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ capturedAt: new Date().toISOString(), results }, null, 2) + '\n');
  console.log(`WR026_BASELINE_FILE ${outFile}`);
  results.forEach(result => console.log(`WR026_BASELINE ${JSON.stringify(result)}`));
} finally {
  await browser.close();
  server.close();
}
