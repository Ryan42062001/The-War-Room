const test = require('node:test');
const assert = require('node:assert/strict');
const observability = require('../espn-observability.js');

test('latest failing REST attempt wins over an older successful draft-detail status', () => {
  const espn = {
    apiAvailable: true,
    apiHttpStatus: 200,
    apiRawCount: 10,
    apiResolved: 10,
    lastApiAttemptAt: '2026-09-07T03:00:00Z',
    lastApiAttemptHttpStatus: 404,
    apiPostDraftUnavailable: true
  };
  assert.equal(observability.classifyRest(espn), 'http-404');
  const trace = observability.buildTraceSnapshot({
    extensionVersion: '0.9.14',
    picks: Array.from({length:10}, (_, index) => ({overallPick:index + 1})),
    espn
  }, {});
  assert.equal(trace.rest.state, 'http-404');
  assert.equal(trace.rest.http, 404);
  assert.equal(trace.rest.raw, 10);
});
