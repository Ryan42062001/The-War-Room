(function(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root || !root.addEventListener) return;
  if (api.install(root, root.WarRoomEspnLiveCapture)) root.__warRoomEspnWorkerObserverActiveVersion = api.runtimeVersion;
})(typeof globalThis !== 'undefined' ? globalThis : null, function() {
  'use strict';

  var RUNTIME_VERSION = '1';

  function emptyTrace() {
    return {
      workers:0,
      workerMessages:0,
      workerCandidateMessages:0,
      workerCandidates:0,
      sharedWorkers:0,
      sharedWorkerMessages:0,
      sharedWorkerCandidateMessages:0,
      sharedWorkerCandidates:0,
      latestPick:0
    };
  }

  function getTrace(root) {
    if (!root.__warRoomEspnWorkerObservabilityV1 ||
        typeof root.__warRoomEspnWorkerObservabilityV1 !== 'object') {
      root.__warRoomEspnWorkerObservabilityV1 = emptyTrace();
    }
    return root.__warRoomEspnWorkerObservabilityV1;
  }

  function parseCandidateCount(capture, data, source) {
    if (!capture || typeof capture.extractPickCandidates !== 'function') return {count:0, latestPick:0};
    var payload = data;
    if (typeof data === 'string' && typeof capture.parsePayload === 'function') payload = capture.parsePayload(data);
    if (!payload || typeof payload !== 'object') return {count:0, latestPick:0};
    var candidates = capture.extractPickCandidates(payload, {
      source:source,
      sourceDetail:'worker-boundary',
      maxObjects:1200,
      maxCandidates:120
    });
    var latestPick = (Array.isArray(candidates) ? candidates : []).reduce(function(maximum, candidate) {
      return Math.max(maximum, Number(candidate && candidate.overallPick) || 0);
    }, 0);
    return {count:Array.isArray(candidates) ? candidates.length : 0, latestPick:latestPick};
  }

  function observeEmitter(root, emitter, source, capture) {
    if (!emitter || typeof emitter.addEventListener !== 'function') return;
    emitter.addEventListener('message', function(event) {
      var trace = getTrace(root);
      var shared = source === 'sharedworker';
      if (shared) trace.sharedWorkerMessages++;
      else trace.workerMessages++;
      var result = parseCandidateCount(capture, event && event.data, source);
      if (result.count > 0) {
        if (shared) {
          trace.sharedWorkerCandidateMessages++;
          trace.sharedWorkerCandidates += result.count;
        } else {
          trace.workerCandidateMessages++;
          trace.workerCandidates += result.count;
        }
        trace.latestPick = Math.max(Number(trace.latestPick) || 0, result.latestPick);
      }
    });
  }

  function wrapWorker(root, capture) {
    var NativeWorker = root.Worker;
    if (typeof NativeWorker !== 'function' || typeof Proxy !== 'function') return false;
    root.Worker = new Proxy(NativeWorker, {
      construct:function(Target, args, NewTarget) {
        var worker = Reflect.construct(Target, args, NewTarget);
        getTrace(root).workers++;
        observeEmitter(root, worker, 'worker', capture);
        return worker;
      }
    });
    return true;
  }

  function wrapSharedWorker(root, capture) {
    var NativeSharedWorker = root.SharedWorker;
    if (typeof NativeSharedWorker !== 'function' || typeof Proxy !== 'function') return false;
    root.SharedWorker = new Proxy(NativeSharedWorker, {
      construct:function(Target, args, NewTarget) {
        var worker = Reflect.construct(Target, args, NewTarget);
        getTrace(root).sharedWorkers++;
        // Do not call port.start(). The page remains responsible for starting
        // its own MessagePort; this observer only listens once ESPN does so.
        observeEmitter(root, worker && worker.port, 'sharedworker', capture);
        return worker;
      }
    });
    return true;
  }

  function install(root, capture) {
    if (!root || root.__warRoomEspnWorkerObserverInstalledV1) return false;
    root.__warRoomEspnWorkerObserverInstalledV1 = true;
    getTrace(root);
    wrapWorker(root, capture);
    wrapSharedWorker(root, capture);
    return true;
  }

  return {
    runtimeVersion:RUNTIME_VERSION,
    emptyTrace:emptyTrace,
    parseCandidateCount:parseCandidateCount,
    observeEmitter:observeEmitter,
    wrapWorker:wrapWorker,
    wrapSharedWorker:wrapSharedWorker,
    install:install
  };
});
