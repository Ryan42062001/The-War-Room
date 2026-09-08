import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const widths = [320, 360, 375, 390, 412, 430, 600, 640, 720, 768, 820, 900, 1280];
const views = ['position', 'overall'];

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

try {
  await page.goto(appUrl, { waitUntil: 'load' });
  await page.waitForSelector('.position-player-card');
  await page.waitForSelector('#draft-command-bar');
  await page.waitForFunction(() => document.body.classList.contains('command-bar-ready'), null, { timeout: 10000 });

  const results = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of views) {
      await page.evaluate(selectedView => {
        setBoardView(selectedView, { persist: false });
        window.scrollTo(0, 0);
      }, view);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

      const measurement = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const overflow = Math.max(
          0,
          document.documentElement.scrollWidth - viewportWidth,
          document.body.scrollWidth - viewportWidth
        );
        const offenders = [...document.querySelectorAll('body *')]
          .filter(element => {
            const style = getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            const rect = element.getBoundingClientRect();
            if (!rect.width || !rect.height) return false;
            return rect.left < -1 || rect.right > viewportWidth + 1;
          })
          .map(element => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              tag: element.tagName,
              id: element.id,
              className: typeof element.className === 'string' ? element.className : '',
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              overflowX: style.overflowX,
              whiteSpace: style.whiteSpace
            };
          })
          .sort((a, b) => Math.max(Math.abs(b.left), b.right - viewportWidth) - Math.max(Math.abs(a.left), a.right - viewportWidth))
          .slice(0, 12);

        return {
          overflow,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          viewportWidth,
          offenders
        };
      });

      results.push({ width, view, ...measurement });
      assert.equal(
        measurement.overflow,
        0,
        `Horizontal overflow at ${width}px in ${view} view: ${JSON.stringify(measurement)}`
      );
    }
  }

  assert.deepEqual(errors, [], `Browser errors: ${JSON.stringify(errors)}`);
  console.log(`Responsive overflow valid: ${widths.length} widths × ${views.length} board views passed with zero horizontal document overflow.`);
  console.log(JSON.stringify(results.map(({ width, view, overflow }) => ({ width, view, overflow }))));
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
