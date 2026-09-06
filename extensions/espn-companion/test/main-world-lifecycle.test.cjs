const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const observer = require('../espn-live-observer.js');
const bridge = require('../espn-page-bridge.js');

test('MAIN-world capture components expose explicit lifecycle versions', () => {
  assert.equal(observer.runtimeVersion, '3');
  assert.equal(bridge.runtimeVersion, '2');

  const observerSource = fs.readFileSync(path.resolve(__dirname, '..', 'espn-live-observer.js'), 'utf8');
  const bridgeSource = fs.readFileSync(path.resolve(__dirname, '..', 'espn-page-bridge.js'), 'utf8');
  assert.match(observerSource, /__warRoomEspnLiveObserverActiveVersion\s*=\s*observer\.runtimeVersion/);
  assert.match(bridgeSource, /__warRoomEspnPageBridgeActiveVersion\s*=\s*bridge\.runtimeVersion/);
});
