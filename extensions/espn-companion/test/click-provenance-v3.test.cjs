const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const extensionRoot = path.resolve(__dirname, '..');
delete require.cache[require.resolve('../espn-click-provenance.js')];
const provenance = require('../espn-click-provenance.js');

function stack(...frames) {
  return ['Error', ...frames.map(frame => '    at ' + frame)].join('\n');
}

test('unknown trampoline selects the first deeper ESPN frame as representative caller', () => {
  const caller = provenance.callerFingerprint(stack(
    'nativeTrampoline (native:11:2)',
    'openHistory (https://fantasy.espn.com/football/draft/draft.js?leagueId=99887766&teamId=42&token=SUPERSECRET:22:9)',
    'laterFrame (https://cdn.example.com/helper.js?account=PRIVATE:31:5)'
  ));

  assert.equal(caller.className, 'espn-script');
  assert.equal(caller.script, 'draft.js');
  assert.equal(caller.functionName, 'openHistory');
  assert.match(caller.hash, /^[a-z0-9]{1,20}$/i);
  assert.doesNotMatch(JSON.stringify(caller), /99887766|SUPERSECRET|PRIVATE|leagueId|teamId|token|account|https?:\/\//i);
});

test('unknown trampoline selects the first deeper extension frame as representative caller', () => {
  const caller = provenance.callerFingerprint(stack(
    'nativeTrampoline (native:11:2)',
    'openHistory (chrome-extension://abcdefghijklmnop/scripts/automation.js?account=PRIVATE:22:9)',
    'laterFrame (https://cdn.example.com/helper.js:31:5)'
  ));

  assert.equal(caller.className, 'extension-script');
  assert.equal(caller.script, 'automation.js');
  assert.equal(caller.functionName, 'openHistory');
  assert.doesNotMatch(JSON.stringify(caller), /abcdefghijklmnop|PRIVATE|account|chrome-extension:\/\//i);
});

test('unknown trampoline selects the first deeper other-web frame as representative caller', () => {
  const caller = provenance.callerFingerprint(stack(
    'nativeTrampoline (native:11:2)',
    'openHistory (https://cdn.example.com/assets/draft-controller.js?token=SUPERSECRET:22:9)',
    'laterFrame (native:31:5)'
  ));

  assert.equal(caller.className, 'other-web-script');
  assert.equal(caller.script, 'draft-controller.js');
  assert.equal(caller.functionName, 'openHistory');
  assert.doesNotMatch(JSON.stringify(caller), /SUPERSECRET|token|cdn\.example\.com|https?:\/\//i);
});

test('all unknown frames keep the first sanitized frame as representative caller', () => {
  const caller = provenance.callerFingerprint(stack(
    'nativeTrampoline (native:11:2)',
    'internalDispatch (node:internal/events:22:9)'
  ));

  assert.equal(caller.className, 'unknown');
  assert.equal(caller.script, 'native');
  assert.equal(caller.functionName, 'nativeTrampoline');
  assert.match(caller.hash, /^[a-z0-9]{1,20}$/i);
});

test('hash preserves original bounded sanitized frame order instead of hashing only representative frame', () => {
  const baseStack = stack(
    'nativeTrampoline (native:11:2)',
    'openHistory (https://fantasy.espn.com/football/draft/draft.js:22:9)',
    'helperFrame (https://cdn.example.com/helper.js:31:5)',
    'finalFrame (webpack://draft/runtime.js:41:7)'
  );
  const changedDeeperFrameStack = stack(
    'nativeTrampoline (native:11:2)',
    'openHistory (https://fantasy.espn.com/football/draft/draft.js:22:9)',
    'differentHelper (https://cdn.example.com/helper-2.js:31:5)',
    'finalFrame (webpack://draft/runtime.js:41:7)'
  );
  const fifthFrameOnlyStack = baseStack + '\n    at ignoredFifth (https://cdn.example.com/fifth.js:51:3)';

  const caller = provenance.callerFingerprint(baseStack);
  const changed = provenance.callerFingerprint(changedDeeperFrameStack);
  const fifthOnly = provenance.callerFingerprint(fifthFrameOnlyStack);
  const expectedSignature = [
    'unknown:native:nativeTrampoline',
    'espn-script:draft.js:openHistory',
    'other-web-script:helper.js:helperFrame',
    'page-bundle:runtime.js:finalFrame'
  ].join('|');

  assert.equal(caller.className, 'espn-script');
  assert.equal(caller.script, 'draft.js');
  assert.equal(caller.functionName, 'openHistory');
  assert.equal(caller.hash, provenance.stableHash(expectedSignature));
  assert.notEqual(changed.hash, caller.hash);
  assert.equal(fifthOnly.hash, caller.hash);
});

test('V3 runtime identity is explicit and Copy diagnostics keeps sanitized representative caller fields', () => {
  assert.equal(provenance.runtimeVersion, '3');

  const popupSource = fs.readFileSync(path.join(extensionRoot, 'popup-click-provenance.js'), 'utf8');
  assert.match(popupSource, /event\.caller\.className/);
  assert.match(popupSource, /event\.caller\.script/);
  assert.match(popupSource, /event\.caller\.functionName/);
  assert.match(popupSource, /event\.caller\.hash/);
  assert.match(popupSource, /caller \+= ' hash='/);

  const caller = provenance.callerFingerprint(stack(
    'nativeTrampoline (native:11:2)',
    'openHistory (https://fantasy.espn.com/football/draft/draft.js?leagueId=99887766&token=SUPERSECRET:22:9)'
  ));
  const diagnosticShape = {
    className:caller.className,
    script:caller.script,
    functionName:caller.functionName,
    hash:caller.hash
  };
  assert.deepEqual(Object.keys(diagnosticShape), ['className', 'script', 'functionName', 'hash']);
  assert.doesNotMatch(JSON.stringify(diagnosticShape), /99887766|SUPERSECRET|leagueId|token|https?:\/\//i);
});
