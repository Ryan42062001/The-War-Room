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
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH});
const page = await browser.newPage({viewport:{width:1280,height:800}});
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil:'load'});
  await page.waitForSelector('.position-player-card');
  await page.waitForFunction(() => document.getElementById('draft-control-shell'));
  await page.waitForTimeout(200);
  const geometry = await page.evaluate(() => {
    setBoardView('position', {persist:false});
    window.scrollTo(0, 0);
    const rect = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const r = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {top:r.top,bottom:r.bottom,height:r.height,display:style.display,position:style.position,marginTop:style.marginTop,marginBottom:style.marginBottom,paddingTop:style.paddingTop,paddingBottom:style.paddingBottom};
    };
    const first = [...document.querySelectorAll('.position-player-card')].find(element => getComputedStyle(element).display !== 'none');
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve({
      firstChoice:first ? first.getBoundingClientRect().top : null,
      header:rect('header'),
      headerInner:rect('.header-inner'),
      shell:rect('#draft-control-shell'),
      toolbar:rect('.toolbar'),
      statusbar:rect('.statusbar'),
      command:rect('#draft-command-bar'),
      setup:rect('.draft-command-setup-disclosure'),
      awareness:rect('#draft-awareness-strip'),
      recommendation:rect('#recommended-pick-box'),
      decisionStrip:rect('#position-decision-strip'),
      board:rect('#position-tier-board'),
      main:rect('main')
    }))));
  });
  console.log('WR016_1280_GEOMETRY ' + JSON.stringify(geometry));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
