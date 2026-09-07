const test = require('node:test');
const assert = require('node:assert/strict');
const observer = require('../espn-worker-observer.js');

class FakeEmitter {
  constructor() {
    this.listeners = new Map();
    this.sent = [];
  }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  emit(type, data) {
    for (const listener of this.listeners.get(type) || []) listener({data});
  }
  postMessage(value) {
    this.sent.push(value);
  }
}

class FakeWorker extends FakeEmitter {
  constructor(url, options) {
    super();
    this.url = url;
    this.options = options;
  }
}

class FakeSharedWorker {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.port = new FakeEmitter();
    this.startCalled = false;
    this.port.start = () => { this.startCalled = true; };
  }
}

const capture = {
  parsePayload(value) {
    try { return JSON.parse(value); } catch { return null; }
  },
  extractPickCandidates(payload) {
    const picks = payload && payload.picks;
    if (!Array.isArray(picks)) return [];
    return picks.filter(pick => Number(pick.overallPick) > 0).map(pick => ({overallPick:Number(pick.overallPick)}));
  }
};

function makeRoot() {
  return {
    addEventListener() {},
    Worker: FakeWorker,
    SharedWorker: FakeSharedWorker
  };
}

test('worker wrapper preserves constructor semantics and observes only inbound message boundaries', () => {
  const root = makeRoot();
  assert.equal(observer.install(root, capture), true);
  const worker = new root.Worker('/draft-worker.js', {type:'module'});
  assert.equal(worker instanceof FakeWorker, true);
  assert.equal(worker.url, '/draft-worker.js');
  assert.deepEqual(worker.options, {type:'module'});

  worker.postMessage({command:'start'});
  assert.deepEqual(worker.sent, [{command:'start'}]);
  assert.equal(root.__warRoomEspnWorkerObservabilityV1.workerMessages, 0);

  worker.emit('message', {heartbeat:true});
  worker.emit('message', {picks:[{overallPick:17},{overallPick:18}]});
  assert.equal(root.__warRoomEspnWorkerObservabilityV1.workers, 1);
  assert.equal(root.__warRoomEspnWorkerObservabilityV1.workerMessages, 2);
  assert.equal(root.__warRoomEspnWorkerObservabilityV1.workerCandidateMessages, 1);
  assert.equal(root.__warRoomEspnWorkerObservabilityV1.workerCandidates, 2);
  assert.equal(root.__warRoomEspnWorkerObservabilityV1.latestPick, 18);
});

test('shared-worker observer never starts ESPN MessagePorts itself', () => {
  const root = makeRoot();
  observer.install(root, capture);
  const shared = new root.SharedWorker('/shared-draft.js', {name:'draft'});
  assert.equal(shared instanceof FakeSharedWorker, true);
  assert.equal(shared.startCalled, false);
  shared.port.emit('message', JSON.stringify({picks:[{overallPick:21}]}));
  assert.equal(shared.startCalled, false);
  assert.equal(root.__warRoomEspnWorkerObservabilityV1.sharedWorkers, 1);
  assert.equal(root.__warRoomEspnWorkerObservabilityV1.sharedWorkerMessages, 1);
  assert.equal(root.__warRoomEspnWorkerObservabilityV1.sharedWorkerCandidateMessages, 1);
  assert.equal(root.__warRoomEspnWorkerObservabilityV1.sharedWorkerCandidates, 1);
  assert.equal(root.__warRoomEspnWorkerObservabilityV1.latestPick, 21);
});

test('worker observer is diagnostic-only: it never emits extension messages or calls debugger-style APIs', () => {
  const source = require('node:fs').readFileSync(require('node:path').resolve(__dirname, '..', 'espn-worker-observer.js'), 'utf8');
  assert.doesNotMatch(source, /chrome\.runtime|postMessage\([^)]*WAR_ROOM|chrome\.debugger|fetch\(|XMLHttpRequest|WebSocket/);
  assert.match(source, /Do not call port\.start/);
  assert.equal(observer.runtimeVersion, '1');
});

test('manifest loads safe observability before worker and existing live observers with no new permissions', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'manifest.json'), 'utf8'));
  const main = manifest.content_scripts.find(entry => entry.world === 'MAIN');
  assert.ok(main);
  assert.ok(main.js.indexOf('espn-live-capture.js') < main.js.indexOf('espn-observability.js'));
  assert.ok(main.js.indexOf('espn-observability.js') < main.js.indexOf('espn-worker-observer.js'));
  assert.ok(main.js.indexOf('espn-worker-observer.js') < main.js.indexOf('espn-live-observer.js'));
  assert.deepEqual(manifest.permissions, ['storage','scripting']);
  assert.equal(manifest.permissions.includes('debugger'), false);
  assert.equal(manifest.permissions.includes('cookies'), false);
});
