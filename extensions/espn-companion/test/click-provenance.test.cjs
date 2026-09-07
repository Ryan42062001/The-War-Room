const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
delete require.cache[require.resolve('../espn-click-provenance.js')];
const provenance = require('../espn-click-provenance.js');

test('HTMLElement click wrapper preserves native receiver, arguments, and return value', () => {
  const calls = [];
  const before = [];
  const prototype = {
    click(value) {
      calls.push({receiver:this.marker, value});
      return 'native-click-result';
    }
  };
  const wrapped = provenance.wrapPrototypeMethod(prototype, 'click', (receiver, args) => {
    before.push({receiver:receiver.marker, args:[...args]});
  });
  assert.ok(wrapped);
  const target = Object.create(prototype);
  target.marker = 'tab';
  assert.equal(target.click('opaque'), 'native-click-result');
  assert.deepEqual(calls, [{receiver:'tab', value:'opaque'}]);
  assert.deepEqual(before, [{receiver:'tab', args:['opaque']}]);
});

test('dispatchEvent wrapper preserves native behavior and only observes arguments', () => {
  const calls = [];
  const before = [];
  const prototype = {
    dispatchEvent(event) {
      calls.push({receiver:this.marker, event});
      return event.type === 'click';
    }
  };
  provenance.wrapPrototypeMethod(prototype, 'dispatchEvent', (receiver, args) => {
    before.push({receiver:receiver.marker, event:args[0]});
  });
  const target = Object.create(prototype);
  target.marker = 'tab';
  const event = {type:'click'};
  assert.equal(target.dispatchEvent(event), true);
  assert.deepEqual(calls, [{receiver:'tab', event}]);
  assert.deepEqual(before, [{receiver:'tab', event}]);
});

test('trusted user clicks override stale programmatic provenance', () => {
  const classified = provenance.classifyClickEvent(
    {isTrusted:true},
    {
      at:1000,
      mechanism:'HTMLElement.click',
      caller:{className:'espn-script', script:'draft.js', functionName:'autoOpen', hash:'abc123'}
    },
    1100
  );
  assert.equal(classified.click, 'trusted');
  assert.equal(classified.mechanism, 'trusted-user');
  assert.equal(classified.caller.className, 'user-input');
});

test('synthetic clicks retain wrapper mechanism while unknown paths stay explicitly unknown', () => {
  const caller = {className:'espn-script', script:'draft.js', functionName:'openHistory', hash:'abc123'};
  const nativeClick = provenance.classifyClickEvent(
    {isTrusted:false},
    {at:1000, mechanism:'HTMLElement.click', caller},
    1200
  );
  assert.equal(nativeClick.click, 'untrusted');
  assert.equal(nativeClick.mechanism, 'HTMLElement.click');
  assert.deepEqual(nativeClick.caller, caller);

  const dispatch = provenance.classifyClickEvent(
    {isTrusted:false},
    {at:1000, mechanism:'dispatchEvent(click)', caller},
    1200
  );
  assert.equal(dispatch.mechanism, 'dispatchEvent(click)');

  const unknown = provenance.classifyClickEvent({isTrusted:false}, null, 1200);
  assert.equal(unknown.click, 'untrusted');
  assert.equal(unknown.mechanism, 'other-programmatic');
  assert.equal(unknown.caller.className, 'unknown');
});

test('caller fingerprint keeps only bounded sanitized ESPN script provenance', () => {
  const stack = [
    'Error',
    '    at captureCaller (chrome-extension://abcdefghijklmnop/extensions/espn-companion/espn-click-provenance.js:101:4)',
    '    at Proxy.apply (chrome-extension://abcdefghijklmnop/extensions/espn-companion/espn-click-provenance.js:222:7)',
    '    at openHistory (https://fantasy.espn.com/football/draft/chunk-7AB.js?leagueId=99887766&token=SUPERSECRET:45:9)',
    '    at performUpdate (https://fantasy.espn.com/football/draft/runtime.js?swid=PRIVATE:10:2)'
  ].join('\n');
  const caller = provenance.callerFingerprint(stack);
  assert.equal(caller.className, 'espn-script');
  assert.equal(caller.script, 'chunk-7AB.js');
  assert.equal(caller.functionName, 'openHistory');
  assert.match(caller.hash, /^[a-z0-9]{1,20}$/i);
  const serialized = JSON.stringify(caller);
  assert.doesNotMatch(serialized, /99887766|SUPERSECRET|PRIVATE|leagueId|token|swid|https?:\/\//i);
});

test('caller fingerprint can identify an extension script without retaining extension id or path', () => {
  const stack = [
    'Error',
    '    at captureCaller (chrome-extension://selfid/espn-click-provenance.js:1:1)',
    '    at triggerTab (chrome-extension://otherextensionid/scripts/automation.js?account=private:22:3)'
  ].join('\n');
  const caller = provenance.callerFingerprint(stack);
  assert.equal(caller.className, 'extension-script');
  assert.equal(caller.script, 'automation.js');
  assert.equal(caller.functionName, 'triggerTab');
  assert.doesNotMatch(JSON.stringify(caller), /otherextensionid|account|private/i);
});

test('provenance ring is bounded and keeps chronological tail entries', () => {
  let events = [];
  for (let index = 0; index < 10; index++) {
    events = provenance.appendBounded(events, {
      at:1000 + index,
      ms:index,
      click:'untrusted',
      mechanism:'other-programmatic',
      view:'pick-history',
      frame:'top',
      caller:{className:'unknown', hash:'h' + index}
    }, 4);
  }
  assert.equal(events.length, 4);
  assert.deepEqual(events.map(event => event.at), [1006, 1007, 1008, 1009]);
});

test('diagnostic provenance code cannot navigate, synthesize clicks, or block native events', () => {
  const source = fs.readFileSync(path.join(root, 'espn-click-provenance.js'), 'utf8');
  assert.doesNotMatch(source, /preventDefault\s*\(/);
  assert.doesNotMatch(source, /stopPropagation\s*\(|stopImmediatePropagation\s*\(/);
  assert.doesNotMatch(source, /\.click\s*\(/);
  assert.doesNotMatch(source, /\.dispatchEvent\s*\(/);
  assert.doesNotMatch(source, /location\.(?:assign|replace)\s*\(|location\s*=/);
  assert.doesNotMatch(source, /history\.(?:pushState|replaceState)\s*\(/);
  assert.doesNotMatch(source, /new\s+(?:MouseEvent|PointerEvent|KeyboardEvent)\s*\(/);
});

test('caller provenance adds no permissions and is loaded before ESPN live observation', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  assert.deepEqual(manifest.permissions, ['storage', 'scripting']);
  const mainWorld = manifest.content_scripts.find(entry => entry.world === 'MAIN' && entry.js.includes('espn-forensic-observer.js'));
  assert.ok(mainWorld);
  assert.equal(mainWorld.run_at, 'document_start');
  assert.equal(mainWorld.js.includes('espn-click-provenance.js'), true);
  assert.equal(mainWorld.js.indexOf('espn-click-provenance.js') < mainWorld.js.indexOf('espn-live-observer.js'), true);
  const html = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
  assert.match(html, /popup-click-provenance\.js/);
  assert.equal(fs.existsSync(path.join(root, 'popup-click-provenance.js')), true);
});

test('popup provenance helper is diagnostics-only and never sends sync or destructive commands', () => {
  const source = fs.readFileSync(path.join(root, 'popup-click-provenance.js'), 'utf8');
  assert.doesNotMatch(source, /RESET_PICKS|RESCAN_ESPN|UPDATE_CONFIG|ESPN_PICKS_FOUND|ESPN_LIVE_OBSERVATIONS/);
  assert.doesNotMatch(source, /preventDefault\s*\(|stopPropagation\s*\(/);
  assert.doesNotMatch(source, /location\.(?:assign|replace)\s*\(|history\.(?:pushState|replaceState)\s*\(/);
  assert.match(source, /__warRoomEspnClickProvenanceSnapshot/);
  assert.match(source, /__warRoomEspnClickProvenanceReset/);
});
