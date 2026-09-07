const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

globalThis.WarRoomEspnForensicCore = require('../espn-forensic-core.js');
delete require.cache[require.resolve('../espn-forensic-content.js')];
const forensic = require('../espn-forensic-content.js');

test('pipeline derivation records ledger, latest pick, REST, delivery, and acknowledgment in order', () => {
  const previous = {
    picksByNumber:{'1':{overallPick:1}},
    espn:{method:'dom', apiAvailable:false, apiRawCount:0},
    warRoom:{applied:1, acknowledgedCaptured:1, lastDeliveredAt:'2026-09-07T12:00:00.000Z', lastSeenAt:'2026-09-07T12:00:00.100Z'}
  };
  const current = {
    picksByNumber:{'1':{overallPick:1}, '2':{overallPick:2}},
    espn:{method:'network', apiAvailable:true, apiRawCount:2, apiResolved:2, apiHttpStatus:200},
    warRoom:{applied:2, acknowledgedCaptured:2, lastDeliveredAt:'2026-09-07T12:00:01.000Z', lastSeenAt:'2026-09-07T12:00:01.050Z'}
  };
  const before = structuredClone(previous);
  const after = structuredClone(current);
  const events = forensic.derivePipelineEvents(previous, current, Date.parse('2026-09-07T12:00:01.100Z'));
  assert.deepEqual(events.map(event => event.category), [
    'ledger-count','latest-pick','rest-state','snapshot-delivery','war-room-ack'
  ]);
  assert.equal(events[0].ledgerCount, 2);
  assert.equal(events[1].latestPick, 2);
  assert.equal(events[2].stateFrom, 'unavailable');
  assert.equal(events[2].stateTo, 'picks');
  assert.equal(events[3].at, Date.parse('2026-09-07T12:00:01.000Z'));
  assert.equal(events[4].at, Date.parse('2026-09-07T12:00:01.050Z'));
  assert.equal(events[4].applied, 2);
  assert.equal(events[4].acknowledged, 2);
  assert.deepEqual(previous, before);
  assert.deepEqual(current, after);
});

test('pipeline derivation is observational and does not invent changes for equivalent state', () => {
  const state = {
    picksByNumber:{'1':{overallPick:1}},
    espn:{method:'dom', apiAvailable:false},
    warRoom:{applied:1, acknowledgedCaptured:1, lastSeenAt:'2026-09-07T12:00:00Z'}
  };
  assert.deepEqual(forensic.derivePipelineEvents(state, structuredClone(state), 12345), []);
});

test('forensic content script cannot send sync commands or mutate the companion ledger', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'espn-forensic-content.js'), 'utf8');
  assert.doesNotMatch(source, /chrome\.runtime\.sendMessage|RESET_PICKS|UPDATE_CONFIG|WAR_ROOM_SNAPSHOT|ESPN_PICKS_FOUND|ESPN_LIVE_OBSERVATIONS|ESPN_STRUCTURED_PICKS/);
  assert.doesNotMatch(source, /picksByNumber\s*\[[^\]]+\]\s*=/);
  assert.match(source, /chromeObject\.storage\.onChanged\.addListener/);
  assert.match(source, /TRACE_PREFIX/);
});
