const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

function loadWarRoomBridge() {
  const runtimeMessages = [];
  let pageMessageListener = null;
  const location = {
    href: 'http://127.0.0.1:8765/',
    origin: 'http://127.0.0.1:8765'
  };
  const window = {
    location,
    addEventListener: (type, listener) => {
      if (type === 'message') pageMessageListener = listener;
    },
    postMessage: () => {}
  };
  const document = {
    body: {
      getAttribute: name => name === 'data-war-room-app' ? 'the-war-room' : null
    }
  };
  const chrome = {
    runtime: {
      getManifest: () => ({version: '0.9.14'}),
      sendMessage: message => {
        runtimeMessages.push(message);
        return Promise.resolve();
      },
      onMessage: {addListener: () => {}}
    }
  };
  const context = vm.createContext({window, location, document, chrome, URL, console, Promise});
  const source = fs.readFileSync(path.join(root, 'war-room-content.js'), 'utf8');
  vm.runInContext(source, context);

  return {
    runtimeMessages,
    dispatch(data) {
      assert.equal(typeof pageMessageListener, 'function');
      pageMessageListener({
        source: window,
        origin: location.origin,
        data
      });
    }
  };
}

test('uses Manifest V3 with a service worker', () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.background.service_worker, 'background-entry.js');
  assert.equal(manifest.version, '0.9.14');
});

test('popup prioritizes ESPN Live Sync trust while retaining technical diagnostics', () => {
  const html = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'popup.js'), 'utf8');
  const trust = fs.readFileSync(path.join(root, 'popup-trust-ux.js'), 'utf8');
  const presentation = fs.readFileSync(path.join(root, 'sync-presentation.js'), 'utf8');
  assert.match(html, /<h1>ESPN Live Sync<\/h1>/);
  assert.match(html, /id="sync-health"/);
  assert.match(html, /id="sync-health-title"/);
  assert.match(html, /<details class="technical-details">/);
  assert.match(html, /id="extension-version"/);
  assert.match(html, /id="version-warning"/);
  assert.match(html, /id="copy-diagnostics"/);
  assert.match(html, /id="reset-trace"/);
  assert.match(html, /id="conflict-status"/);
  assert.match(html, /src="sync-presentation\.js"/);
  assert.match(html, /src="popup-trust-ux\.js"/);
  assert.match(html, /src="popup-click-provenance\.js"/);
  assert.doesNotMatch(html, /fantasypros-key|FantasyPros rankings API/);
  assert.doesNotMatch(script, /SAVE_FANTASYPROS_KEY|REFRESH_FANTASYPROS_RANKINGS/);
  assert.match(presentation, /ESPN Live Sync · Caught up/);
  assert.match(presentation, /ESPN Live Sync · Catching up/);
  assert.match(presentation, /ESPN Live Sync · Needs attention/);
  assert.match(presentation, /hasRichAckContract/);
  assert.match(presentation, /numberedAccepted/);
  assert.match(presentation, /unresolved/);
  assert.match(trust, /Draft connected/);
  assert.doesNotMatch(trust, /WebSocket|EventSource|REST snapshot|Hybrid recovery|Board fallback/);
  assert.match(script, /Captured\/applied\/unmatched/);
  assert.match(script, /API available\/complete/);
  assert.match(script, /Missing numbered picks/);
  assert.match(script, /Screen frames/);
  assert.match(script, /page reported stale/);
  assert.match(script, /API last successful\/status/);
  assert.match(script, /Acknowledged snapshot size/);
  assert.match(script, /Live sources active/);
  assert.match(script, /Ledger confirmed\/conflicts\/unresolved IDs/);
  assert.match(script, /document\.execCommand\('copy'\)/);
});

test('Companion popup exposes the 5-30 round-count contract', () => {
  const html = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
  assert.match(html, /id="rounds" type="number" min="5" max="30"/);
});

test('War Room bridge rejects unsupported rounds and forwards 5/30 boundaries', () => {
  const bridge = loadWarRoomBridge();
  const channel = 'the-war-room:espn-sync:v1';
  const settingsMessages = () => bridge.runtimeMessages.filter(message => message.type === 'WAR_ROOM_SETTINGS_UPDATE');

  for (const rounds of [1, 2, 3, 4, 31]) {
    const before = settingsMessages().length;
    bridge.dispatch({
      channel,
      type: 'SETTINGS_UPDATE',
      settings: {teams: 10, draftSlot: 1, rounds},
      requiredExtensionVersion: '0.9.14'
    });
    assert.equal(settingsMessages().length, before, 'unsupported rounds ' + rounds + ' must not be forwarded');
  }

  for (const rounds of [5, 30]) {
    bridge.dispatch({
      channel,
      type: 'SETTINGS_UPDATE',
      settings: {teams: 10, draftSlot: 1, rounds},
      requiredExtensionVersion: '0.9.14'
    });
    const message = settingsMessages().at(-1);
    assert.deepEqual(
      JSON.parse(JSON.stringify(message.config)),
      {teams: 10, draftSlot: 1, rounds, totalPicks: 10 * rounds}
    );
  }
});

test('War Room bridge forwards explicit website draft-setting edits', () => {
  const script = fs.readFileSync(path.join(root, 'war-room-content.js'), 'utf8');
  assert.match(script, /SETTINGS_UPDATE/);
  assert.match(script, /WAR_ROOM_SETTINGS_UPDATE/);
});

test('War Room bridge uses same-origin delivery and validates bounded page messages', () => {
  const script = fs.readFileSync(path.join(root, 'war-room-content.js'), 'utf8');
  assert.match(script, /window.location.origin/);
  assert.match(script, /sanitizeSettings/);
  assert.match(script, /sanitizeAckResult/);
  assert.match(script, /numberedAccepted/);
  assert.match(script, /canonicalApplied/);
  assert.match(script, /externalAccepted/);
  assert.match(script, /unresolved/);
  assert.doesNotMatch(script, /postMessage(Object.assign({channel: CHANNEL}, message), '*')/);
});

test('War Room bridge requires the real app identity and local development port', () => {
  const script = fs.readFileSync(path.join(root, 'war-room-content.js'), 'utf8');
  const warRoomScript = manifest.content_scripts.find(entry => entry.js.includes('war-room-content.js'));
  assert.match(script, /data-war-room-app/);
  assert.match(script, /locationUrl\.port === '8765'/);
  assert.match(script, /marker === 'the-war-room'/);
  assert.deepEqual(warRoomScript.include_globs, [
    'http://127.0.0.1:8765/*',
    'http://localhost:8765/*',
    'https://ryan42062001.github.io/The-War-Room*'
  ]);
  assert.deepEqual(warRoomScript.js, [
    'war-room-content.js',
    'sync-presentation.js',
    'war-room-sync-trust-ui.js'
  ]);
});

test('War Room bridge forwards an explicit ESPN rankings refresh request', () => {
  const script = fs.readFileSync(path.join(root, 'war-room-content.js'), 'utf8');
  assert.match(script, /RANKINGS_REFRESH_REQUEST/);
  assert.match(script, /WAR_ROOM_RANKINGS_REFRESH/);
});

test('requests only storage and host-restricted reinjection permission', () => {
  assert.deepEqual(manifest.permissions, ['storage', 'scripting']);
  assert.equal(manifest.host_permissions.includes('<all_urls>'), false);
  assert.equal(manifest.permissions.includes('cookies'), false);
  assert.equal(manifest.host_permissions.includes('https://api.fantasypros.com/public/v2/json/*'), false);
});

test('ESPN reader reaches embedded draft-room frames', () => {
  const espnScript = manifest.content_scripts.find(script => script.js.includes('espn-content.js'));
  assert.equal(espnScript.all_frames, true);
  assert.equal(espnScript.match_about_blank, true);
});

test('authenticated ESPN bridge runs in the page main world before readers', () => {
  const bridge = manifest.content_scripts.find(script => script.js.includes('espn-page-bridge.js'));
  assert.equal(bridge.world, 'MAIN');
  assert.equal(bridge.run_at, 'document_start');
  assert.equal(bridge.all_frames, true);
});

test('retired FantasyPros API integration is absent from the extension', () => {
  const background = fs.readFileSync(path.join(root, 'background.js'), 'utf8');
  const bridge = fs.readFileSync(path.join(root, 'war-room-content.js'), 'utf8');
  assert.doesNotMatch(background, /x-api-key|consensus-rankings|rankings\/experts/);
  assert.doesNotMatch(bridge, /FANTASYPROS_REFRESH|FANTASYPROS_RANKINGS/);
  assert.match(background, /remove\(RETIRED_FANTASYPROS_KEY_STORAGE\)/);
});

test('read-only live observer runs in the page main world at document start', () => {
  const observer = manifest.content_scripts.find(script => script.js.includes('espn-live-observer.js'));
  assert.equal(observer.world, 'MAIN');
  assert.equal(observer.run_at, 'document_start');
  assert.equal(observer.js.indexOf('espn-live-capture.js') < observer.js.indexOf('espn-live-observer.js'), true);
  assert.equal(observer.js.indexOf('espn-click-provenance.js') < observer.js.indexOf('espn-live-observer.js'), true);
});

test('live observer decodes binary WebSocket frames and observes event streams', () => {
  const script = fs.readFileSync(path.join(root, 'espn-live-observer.js'), 'utf8');
  assert.match(script, /data instanceof root\.Blob/);
  assert.match(script, /root\.TextDecoder/);
  assert.match(script, /installEventSource/);
  assert.match(script, /eventSourceMessages/);
});

test('all declared extension files exist', () => {
  const files = new Set([
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...manifest.content_scripts.flatMap(script => script.js)
  ]);
  for (const file of files) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should exist`);
  }
});
