const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const observability = require('../espn-observability.js');

function fakeNode({hidden = false, display = 'block', visibility = 'visible', opacity = '1', rects = 1, rows = 0, header = ''} = {}) {
  const head = header ? {innerText: header, textContent: header} : null;
  return {
    hidden,
    getAttribute(name) {
      return name === 'aria-hidden' && hidden ? 'true' : null;
    },
    getClientRects() {
      return Array.from({length: rects}, () => ({}));
    },
    querySelector(selector) {
      return selector === 'thead' ? head : null;
    },
    querySelectorAll() {
      return Array.from({length: rows}, () => ({}));
    },
    __style: {display, visibility, opacity},
    innerText: header,
    textContent: header
  };
}

function fakeDocument(historyNodes = [], tables = []) {
  return {
    visibilityState: 'visible',
    querySelectorAll(selector) {
      if (selector === 'table,[role="table"],[role="grid"]') return tables;
      return historyNodes;
    }
  };
}

const fakeRoot = {
  getComputedStyle(node) {
    return node.__style || {display:'block', visibility:'visible', opacity:'1'};
  }
};

test('safe routes strip queries and redact private league IDs while preserving endpoint families', () => {
  assert.equal(
    observability.safeRoute('https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/1840797277?view=mDraftDetail&espn_s2=secret'),
    'lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/:league'
  );
  assert.equal(
    observability.safeRoute('https://fantasy.espn.com/football/draft?leagueId=1840797277&teamId=14&SWID=secret'),
    'fantasy.espn.com/football/draft'
  );
  assert.notEqual(observability.anonymizeIdentifier('2026:1840797277'), observability.anonymizeIdentifier('2026:999999'));
  assert.match(observability.anonymizeIdentifier('2026:1840797277'), /^anon-[a-z0-9]+$/);
});

test('diagnostic sanitizer removes credential names, values, query secrets, and numeric league IDs', () => {
  const input = [
    'Cookie=session-cookie',
    'Authorization=BearerSecret',
    'espn_s2=super-secret',
    'SWID={ABC-123}',
    'sessionToken=session-secret',
    'password=hunter2',
    'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/1840797277?espn_s2=secret'
  ].join(' | ');
  const output = observability.redactKnownSecrets(input);
  assert.doesNotMatch(output, /cookie|authorization|espn_s2|swid|sessiontoken|password/i);
  assert.doesNotMatch(output, /session-cookie|BearerSecret|super-secret|ABC-123|session-secret|hunter2|1840797277/);
  assert.match(output, /leagues\/:league/);
});

test('Pick History DOM probe distinguishes absent, mounted-hidden, and mounted-visible', () => {
  assert.deepEqual(
    observability.inspectPickHistoryDom(fakeDocument(), fakeRoot),
    {state:'absent', nodes:0, visibleNodes:0, rows:0}
  );

  const hidden = fakeNode({display:'none', rects:0, rows:3});
  assert.deepEqual(
    observability.inspectPickHistoryDom(fakeDocument([hidden]), fakeRoot),
    {state:'mounted-hidden', nodes:1, visibleNodes:0, rows:3}
  );

  const visible = fakeNode({rows:4});
  assert.deepEqual(
    observability.inspectPickHistoryDom(fakeDocument([visible]), fakeRoot),
    {state:'mounted-visible', nodes:1, visibleNodes:1, rows:4}
  );

  const table = fakeNode({rows:2, header:'Pick Player Team'});
  assert.deepEqual(
    observability.inspectPickHistoryDom(fakeDocument([], [table]), fakeRoot),
    {state:'mounted-visible', nodes:1, visibleNodes:1, rows:2}
  );
});

test('REST status explicitly distinguishes picks, empty draft detail, and HTTP failure', () => {
  assert.equal(observability.classifyRest({apiAvailable:true, apiRawCount:4, apiHttpStatus:200}), 'picks');
  assert.equal(observability.classifyRest({apiAvailable:true, apiRawCount:0, apiHttpStatus:200}), 'empty-draft-detail');
  assert.equal(observability.classifyRest({apiAvailable:false, apiRawCount:0, apiHttpStatus:404}), 'http-404');
  assert.equal(observability.classifyRest({apiAvailable:false, apiBehind:true}), 'behind');
});

test('trace snapshot exposes compact per-source counters, DOM state, REST state, ledger and worker boundary counts', () => {
  const status = {
    extensionVersion:'0.9.14',
    picks:[{overallPick:1}, {overallPick:2}],
    espn:{
      method:'dom',
      lastUrl:'https://fantasy.espn.com/football/draft?leagueId=1840797277',
      visibleCandidates:7,
      visibleCaptured:2,
      apiAvailable:true,
      apiHttpStatus:200,
      apiRawCount:0,
      apiResolved:0,
      apiUnresolved:0,
      lastApiAttemptAt:'2026-09-07T00:00:00Z',
      liveCapture:{
        conflicts:1,
        unresolvedPlayerIds:2,
        counters:{socketMessages:3, fetchResponses:4, xhrResponses:5, eventSourceMessages:6, reactScans:7},
        sources:{
          websocket:{candidateCount:1}, fetch:{candidateCount:2}, xhr:{candidateCount:3},
          eventsource:{candidateCount:4}, react:{candidateCount:5}
        }
      }
    }
  };
  const page = {
    route:'fantasy.espn.com/football/draft',
    visibility:'visible',
    pickHistory:{state:'mounted-hidden', nodes:1, visibleNodes:0, rows:10},
    worker:{workers:1, workerMessages:8, workerCandidateMessages:1, workerCandidates:2, sharedWorkers:1, sharedWorkerMessages:2, sharedWorkerCandidateMessages:0, sharedWorkerCandidates:0, latestPick:2}
  };
  const trace = observability.buildTraceSnapshot(status, page);
  assert.equal(trace.extensionVersion, '0.9.14');
  assert.equal(trace.captureMethod, 'dom');
  assert.equal(trace.ledgerCount, 2);
  assert.equal(trace.latestPick, 2);
  assert.equal(trace.conflicts, 1);
  assert.equal(trace.unresolved, 2);
  assert.equal(trace.dom.state, 'mounted-hidden');
  assert.equal(trace.sources.websocket.observations, 3);
  assert.equal(trace.sources.fetch.latestCandidates, 2);
  assert.equal(trace.sources.eventsource.observations, 6);
  assert.equal(trace.sources.react.observations, 7);
  assert.equal(trace.sources.dom.observations, 7);
  assert.equal(trace.rest.state, 'empty-draft-detail');
  assert.equal(trace.worker.workerMessages, 8);
  assert.doesNotMatch(JSON.stringify(trace), /1840797277/);
});

test('before-after trace highlights route, DOM, REST, ledger, network, React and worker changes', () => {
  const before = {
    route:'fantasy.espn.com/football/draft',
    ledgerCount:10,
    dom:{state:'absent'},
    rest:{state:'empty-draft-detail'},
    worker:{workerMessages:2, sharedWorkerMessages:0},
    sources:{
      websocket:{observations:1}, fetch:{observations:2}, xhr:{observations:3},
      eventsource:{observations:0}, react:{observations:4}, dom:{observations:5}, rest:{observations:1}
    }
  };
  const after = {
    route:'fantasy.espn.com/football/draft/history',
    ledgerCount:13,
    latestPick:13,
    confirmed:13,
    conflicts:0,
    unresolved:0,
    visibility:'visible',
    dom:{state:'mounted-visible', nodes:1, visibleNodes:1, rows:13},
    rest:{state:'picks', http:200, resolved:13, raw:13, unresolved:0},
    worker:{workers:1, workerMessages:4, workerCandidates:1, sharedWorkers:0, sharedWorkerMessages:0, sharedWorkerCandidates:0},
    sources:{
      websocket:{observations:1,latestCandidates:0}, fetch:{observations:3,latestCandidates:1}, xhr:{observations:3,latestCandidates:0},
      eventsource:{observations:0,latestCandidates:0}, react:{observations:5,latestCandidates:2}, dom:{observations:8,latestCandidates:13}, rest:{observations:1,latestCandidates:13}
    }
  };
  const delta = observability.diffTrace(before, after);
  assert.equal(delta.routeChanged, true);
  assert.equal(delta.domChanged, true);
  assert.equal(delta.restChanged, true);
  assert.equal(delta.ledgerDelta, 3);
  assert.equal(delta.sourceDeltas.fetch, 1);
  assert.equal(delta.sourceDeltas.react, 1);
  assert.equal(delta.sourceDeltas.dom, 3);
  assert.equal(delta.workerMessageDelta, 2);
  const text = observability.formatTraceLines(after, delta).join('\n');
  assert.match(text, /absent→mounted-visible/);
  assert.match(text, /empty-draft-detail→picks/);
  assert.match(text, /fetch \+1/);
  assert.match(text, /worker \+2/);
});

test('checked-in popup diagnostics omit raw parse-failure text and use the safe A/B trace helper', () => {
  const popup = fs.readFileSync(path.resolve(__dirname, '..', 'popup.js'), 'utf8');
  assert.match(popup, /OBSERVABILITY_BASELINE_KEY/);
  assert.match(popup, /probeEspnObservability/);
  assert.match(popup, /buildTraceSnapshot/);
  assert.match(popup, /diffTrace/);
  assert.match(popup, /redactKnownSecrets/);
  assert.doesNotMatch(popup, /Unparseable row samples/);
});

test('stored diagnostic scrubber redacts route identifiers and discards parse-failure text without changing draft identity code', () => {
  const background = fs.readFileSync(path.resolve(__dirname, '..', 'background.js'), 'utf8');
  assert.match(background, /scrubStoredDiagnosticValue/);
  assert.match(background, /key === 'parseFailureSamples'\) return \[\]/);
  assert.match(background, /observability\.safeRoute\(value\)/);
  assert.match(background, /observability\.anonymizeIdentifier\(value\)/);
  assert.match(background, /function draftKeyFromUrl/);
  assert.match(background, /state\.draftKey = nextKey/);
});
