const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../espn-forensic-core.js');

test('forensic ring buffer is bounded and preserves chronological tail order', () => {
  let events = [];
  for (let index = 0; index < 125; index++) {
    events = core.appendBounded(events, {
      id:'event-' + index,
      at:1000 + index,
      category:'source-observation',
      source:'fetch',
      count:index
    }, 80);
  }
  assert.equal(events.length, 80);
  assert.equal(events[0].id, 'event-45');
  assert.equal(events.at(-1).id, 'event-124');
  assert.deepEqual(events.map(event => event.at), events.map(event => event.at).slice().sort((a, b) => a - b));
});

test('merged forensic timelines sort absolute timestamps and derive stable relative milliseconds', () => {
  const merged = core.mergeTimelines([
    [{id:'b', at:1813, category:'candidate-recognized', source:'fetch', candidates:2}],
    [{id:'a', at:1000, category:'baseline', source:'popup', action:'reset'}],
    [{id:'c', at:1857, category:'ledger-count', source:'storage', ledgerCount:18}]
  ], 80);
  assert.deepEqual(merged.map(event => event.id), ['a','b','c']);
  assert.deepEqual(merged.map(event => event.ms), [0,813,857]);
});

test('forensic sanitizer keeps only allowlisted metadata and redacts private routes', () => {
  const event = core.sanitizeEvent({
    id:'safe-1',
    at:1234,
    category:'source-observation',
    source:'fetch',
    route:'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/1840797277?espn_s2=secret',
    candidates:3,
    playerName:'Private Player',
    teamName:'Private Team',
    managerName:'Private Manager',
    Cookie:'cookie-secret',
    Authorization:'Bearer secret',
    payload:'raw private body'
  });
  const text = JSON.stringify(event);
  assert.match(text, /leagues\/:league/);
  assert.doesNotMatch(text, /1840797277|secret|Private Player|Private Team|Private Manager|raw private body/i);
  assert.equal(event.candidates, 3);
  assert.equal(Object.hasOwn(event, 'playerName'), false);
  assert.equal(Object.hasOwn(event, 'payload'), false);
});

test('structure fingerprint retains shape only and never payload values or credential keys', () => {
  const payload = {
    eventType:'draftUpdate',
    playerName:'Private Player',
    teamName:'Private Team',
    count:18,
    token:'never-store-me',
    Authorization:'Bearer never-store-me',
    nested:{managerName:'Private Manager', password:'nope'}
  };
  const fingerprint = core.structureFingerprint(payload, {
    endpoint:'https://fantasy.espn.com/football/league/1840797277/draft?SWID=secret'
  });
  const text = JSON.stringify(fingerprint);
  assert.equal(fingerprint.type, 'object');
  assert.match(fingerprint.schema, /^[a-z0-9]+$/);
  assert.match(fingerprint.endpoint, /league\/:league\/draft/);
  assert.doesNotMatch(text, /Private Player|Private Team|Private Manager|never-store-me|Bearer|secret|1840797277/i);
  assert.doesNotMatch(text, /"token"|Authorization|password/i);
  assert.ok(fingerprint.keys.includes('eventType'));
  assert.ok(fingerprint.keys.includes('playerName'));
});

test('view and click provenance collapse to safe categories', () => {
  assert.equal(core.classifyViewText('Available Players'), 'players');
  assert.equal(core.classifyViewText('Pick History'), 'pick-history');
  assert.equal(core.classifyViewText('Draft Board'), 'board');
  assert.equal(core.classifyViewText('My Team Roster'), 'roster');
  assert.equal(core.classifyViewText('Manager Ryan Secret Team'), 'unknown');
  assert.equal(core.clickTrust({isTrusted:true}), 'trusted');
  assert.equal(core.clickTrust({isTrusted:false}), 'untrusted');
  assert.equal(core.recentClickProvenance({at:1000, click:'trusted', view:'pick-history'}, 'pick-history', 1800), 'trusted');
  assert.equal(core.recentClickProvenance({at:1000, click:'trusted', view:'pick-history'}, 'pick-history', 2300), 'none');
  assert.equal(core.recentClickProvenance(null, 'players', 2300), 'none');
});
