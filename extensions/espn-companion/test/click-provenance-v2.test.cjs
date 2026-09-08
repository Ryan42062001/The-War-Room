const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const extensionRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(extensionRoot, '..', '..');
const provenance = require('../espn-click-provenance.js');
const {chromium} = require(path.join(repoRoot, 'node_modules', 'playwright'));

const UNKNOWN_PROGRAMMATIC_HASH = provenance.stableHash('unknown-programmatic');

function startHarnessServer() {
  const provenanceSource = fs.readFileSync(path.join(extensionRoot, 'espn-click-provenance.js'), 'utf8');
  const bundleSource = [
    "window.fireCachedDispatch = function cachedDispatchCaller() {",
    "  var target = document.getElementById('pick-history');",
    "  var event = new MouseEvent('click', {bubbles:true, cancelable:true});",
    "  return window.__cachedDispatch.call(target, event);",
    "};",
    "window.fireCachedClick = function cachedClickCaller() {",
    "  var target = document.getElementById('pick-history');",
    "  return window.__cachedClick.call(target);",
    "};",
    "window.fireWrappedDispatch = function wrappedDispatchCaller() {",
    "  var target = document.getElementById('pick-history');",
    "  return target.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));",
    "};",
    "window.fireWrappedClick = function wrappedClickCaller() {",
    "  return document.getElementById('pick-history').click();",
    "};"
  ].join('\n');

  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    if (requestUrl.pathname === '/espn-click-provenance.js') {
      response.writeHead(200, {'content-type':'application/javascript'});
      response.end(provenanceSource);
      return;
    }
    if (requestUrl.pathname === '/draft-bypass.js') {
      response.writeHead(200, {'content-type':'application/javascript'});
      response.end(bundleSource);
      return;
    }
    if (requestUrl.pathname === '/') {
      response.writeHead(200, {'content-type':'text/html'});
      response.end(`<!doctype html>
<html><head><meta charset="utf-8"><title>provenance bypass</title>
<script>
window.__cachedDispatch = EventTarget.prototype.dispatchEvent;
window.__cachedClick = HTMLElement.prototype.click;
</script>
<script src="/espn-click-provenance.js"></script>
<script src="/draft-bypass.js?leagueId=99887766&teamId=42&token=SUPERSECRET"></script>
</head><body>
<nav role="tablist" aria-label="Draft views">
  <button id="players" role="tab">Players</button>
  <button id="pick-history" role="tab">Pick History</button>
</nav>
</body></html>`);
      return;
    }
    response.writeHead(404);
    response.end('not found');
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({server, origin:`http://127.0.0.1:${address.port}`});
    });
  });
}

async function withHarness(callback) {
  const {server, origin} = await startHarnessServer();
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage();
    await page.goto(origin + '/', {waitUntil:'load'});
    return await callback(page, origin);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

function assertRecoveredCaller(event, functionName) {
  assert.equal(event.click, 'untrusted');
  assert.equal(event.mechanism, 'other-programmatic');
  assert.equal(event.view, 'pick-history');
  assert.equal(event.caller.className, 'other-web-script');
  assert.equal(event.caller.script, 'draft-bypass.js');
  assert.equal(event.caller.functionName, functionName);
  assert.match(event.caller.hash, /^[a-z0-9]{1,20}$/i);
  assert.notEqual(event.caller.hash, UNKNOWN_PROGRAMMATIC_HASH);
  const serialized = JSON.stringify(event);
  assert.doesNotMatch(serialized, /99887766|SUPERSECRET|leagueId|teamId|token|https?:\/\//i);
}

test('cached EventTarget.prototype.dispatchEvent bypass recovers observation-time caller provenance', async () => {
  await withHarness(async (page, origin) => {
    const result = await page.evaluate(() => {
      window.__warRoomEspnClickProvenanceReset();
      var target = document.getElementById('pick-history');
      var nativeCount = 0;
      target.addEventListener('click', function() { nativeCount++; });
      var nativeReturn = window.fireCachedDispatch();
      return {
        nativeReturn:nativeReturn,
        nativeCount:nativeCount,
        href:location.href,
        snapshot:window.__warRoomEspnClickProvenanceSnapshot()
      };
    });
    assert.equal(result.nativeReturn, true);
    assert.equal(result.nativeCount, 1);
    assert.equal(result.href, origin + '/');
    assert.equal(result.snapshot.version, 2);
    assert.equal(result.snapshot.events.length, 1);
    assertRecoveredCaller(result.snapshot.events[0], 'cachedDispatchCaller');
  });
});

test('cached HTMLElement.prototype.click bypass recovers observation-time caller provenance', async () => {
  await withHarness(async (page, origin) => {
    const result = await page.evaluate(() => {
      window.__warRoomEspnClickProvenanceReset();
      var target = document.getElementById('pick-history');
      var nativeCount = 0;
      target.addEventListener('click', function() { nativeCount++; });
      window.fireCachedClick();
      return {
        nativeCount:nativeCount,
        href:location.href,
        snapshot:window.__warRoomEspnClickProvenanceSnapshot()
      };
    });
    assert.equal(result.nativeCount, 1);
    assert.equal(result.href, origin + '/');
    assert.equal(result.snapshot.events.length, 1);
    assertRecoveredCaller(result.snapshot.events[0], 'cachedClickCaller');
  });
});

test('installed wrappers still identify direct click and dispatchEvent mechanisms', async () => {
  await withHarness(async (page) => {
    const result = await page.evaluate(() => {
      function run(name) {
        window.__warRoomEspnClickProvenanceReset();
        window[name]();
        return window.__warRoomEspnClickProvenanceSnapshot().events[0];
      }
      return {
        click:run('fireWrappedClick'),
        dispatch:run('fireWrappedDispatch')
      };
    });
    assert.equal(result.click.mechanism, 'HTMLElement.click');
    assert.equal(result.click.click, 'untrusted');
    assert.equal(result.dispatch.mechanism, 'dispatchEvent(click)');
    assert.equal(result.dispatch.click, 'untrusted');
  });
});

test('trusted browser input remains trusted-user and is never assigned programmatic caller provenance', async () => {
  await withHarness(async (page) => {
    await page.evaluate(() => window.__warRoomEspnClickProvenanceReset());
    await page.click('#pick-history');
    const event = await page.evaluate(() => window.__warRoomEspnClickProvenanceSnapshot().events[0]);
    assert.equal(event.click, 'trusted');
    assert.equal(event.mechanism, 'trusted-user');
    assert.equal(event.caller.className, 'user-input');
  });
});

test('classification uses sanitized observation-time caller only when wrapper provenance is unavailable', () => {
  const observed = {className:'espn-script', script:'draft.js', functionName:'fallbackCaller', hash:'abc123'};
  const fallback = provenance.classifyClickEvent({isTrusted:false}, null, 2000, observed);
  assert.equal(fallback.mechanism, 'other-programmatic');
  assert.deepEqual(fallback.caller, observed);

  const pending = {
    at:1900,
    mechanism:'HTMLElement.click',
    caller:{className:'espn-script', script:'wrapped.js', functionName:'wrappedCaller', hash:'def456'}
  };
  const wrapped = provenance.classifyClickEvent({isTrusted:false}, pending, 2000, observed);
  assert.equal(wrapped.mechanism, 'HTMLElement.click');
  assert.equal(wrapped.caller.script, 'wrapped.js');

  const trusted = provenance.classifyClickEvent({isTrusted:true}, null, 2000, observed);
  assert.equal(trusted.mechanism, 'trusted-user');
  assert.equal(trusted.caller.className, 'user-input');
});
