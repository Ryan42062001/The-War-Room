const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../espn-forensic-core.js');

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function loadPopupForensics(initialStore) {
  const store = clone(initialStore);
  const local = {
    get(key) {
      if (key == null) return Promise.resolve(clone(store));
      if (typeof key === 'string') return Promise.resolve({[key]:clone(store[key])});
      return Promise.resolve({});
    },
    set(value) {
      Object.assign(store, clone(value));
      return Promise.resolve();
    },
    remove(keys) {
      for (const key of Array.isArray(keys) ? keys : [keys]) delete store[key];
      return Promise.resolve();
    }
  };
  const context = {
    WarRoomEspnForensicCore:core,
    chrome:{storage:{local}},
    document:{getElementById() { return null; }},
    Promise,
    Date,
    Math,
    setTimeout,
    clearTimeout
  };
  context.globalThis = context;
  vm.createContext(context);
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'popup-forensics.js'), 'utf8');
  vm.runInContext(source, context, {filename:'popup-forensics.js'});
  return {context, store};
}

test('trace reset deletes only forensic namespace and preserves all draft state', async () => {
  const mainState = {
    config:{teams:10,draftSlot:4,rounds:16},
    draftKey:'2026:private-league',
    picksByNumber:{'1':{overallPick:1,playerName:'Player One'}},
    warRoom:{applied:1,acknowledgedCaptured:1},
    espn:{captured:1}
  };
  const savedDraft = {id:'saved-draft', picks:[1,2,3]};
  const {context, store} = loadPopupForensics({
    warRoomEspnCompanionStateV2:mainState,
    'warRoomEspnForensicFrameV1:abc':{events:[{at:1000,category:'baseline',source:'page'}]},
    warRoomEspnForensicPopupV1:{events:[{at:1000,category:'baseline',source:'popup'}]},
    unrelatedSavedDraft:savedDraft,
    warRoomEspnObservabilityBaselineV1:{ledgerCount:1}
  });
  await context.__warRoomEspnForensicPopup.resetTraceOnly();
  assert.deepEqual(store.warRoomEspnCompanionStateV2, mainState);
  assert.deepEqual(store.unrelatedSavedDraft, savedDraft);
  assert.deepEqual(store.warRoomEspnObservabilityBaselineV1, {ledgerCount:1});
  assert.equal(Object.hasOwn(store, 'warRoomEspnForensicFrameV1:abc'), false);
  assert.ok(Array.isArray(store.warRoomEspnForensicPopupV1.events));
  assert.equal(store.warRoomEspnForensicPopupV1.events.length, 1);
  assert.equal(store.warRoomEspnForensicPopupV1.events[0].category, 'baseline');
});

test('popup forensic helper never invokes destructive or synchronization commands', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'popup-forensics.js'), 'utf8');
  assert.doesNotMatch(source, /RESET_PICKS|UPDATE_CONFIG|WAR_ROOM_SETTINGS_UPDATE|WAR_ROOM_SNAPSHOT|ESPN_PICKS_FOUND|ESPN_STRUCTURED_PICKS/);
  assert.doesNotMatch(source, /chrome\.runtime\.sendMessage/);
  assert.match(source, /key\.indexOf\(TRACE_PREFIX\) === 0/);
  assert.match(source, /__warRoomEspnForensicReset/);
});

test('manifest adds forensic observers with no new browser permission', () => {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'manifest.json'), 'utf8'));
  assert.deepEqual(manifest.permissions, ['storage','scripting']);
  assert.equal(manifest.permissions.includes('debugger'), false);
  assert.equal(manifest.permissions.includes('cookies'), false);
  const main = manifest.content_scripts.find(entry => entry.world === 'MAIN');
  assert.ok(main.js.indexOf('espn-forensic-core.js') < main.js.indexOf('espn-forensic-observer.js'));
  assert.ok(main.js.indexOf('espn-forensic-observer.js') < main.js.indexOf('espn-worker-observer.js'));
  assert.ok(main.js.indexOf('espn-worker-observer.js') < main.js.indexOf('espn-live-observer.js'));
  const forensicIsolated = manifest.content_scripts.find(entry =>
    entry.run_at === 'document_start' && !entry.world && entry.js.includes('espn-forensic-content.js'));
  assert.ok(forensicIsolated);
});
