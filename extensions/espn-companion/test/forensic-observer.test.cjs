const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

globalThis.WarRoomEspnForensicCore = require('../espn-forensic-core.js');
delete require.cache[require.resolve('../espn-forensic-observer.js')];
const observer = require('../espn-forensic-observer.js');

test('history observer preserves push/replace return values, arguments, and receiver', () => {
  const calls = [];
  const after = [];
  const history = {
    marker:'native-receiver',
    pushState(state, title, url) {
      calls.push({method:'pushState', receiver:this.marker, args:[state,title,url]});
      return 'push-result';
    },
    replaceState(state, title, url) {
      calls.push({method:'replaceState', receiver:this.marker, args:[state,title,url]});
      return 'replace-result';
    }
  };
  assert.equal(observer.wrapHistoryMethod(history, 'pushState', name => after.push(name)), true);
  assert.equal(observer.wrapHistoryMethod(history, 'replaceState', name => after.push(name)), true);
  const state = {safe:'opaque-to-observer'};
  assert.equal(history.pushState(state, 'title', '/draft#history'), 'push-result');
  assert.equal(history.replaceState(state, 'title2', '/draft#players'), 'replace-result');
  assert.deepEqual(calls, [
    {method:'pushState', receiver:'native-receiver', args:[state,'title','/draft#history']},
    {method:'replaceState', receiver:'native-receiver', args:[state,'title2','/draft#players']}
  ]);
  assert.deepEqual(after, ['pushState','replaceState']);
});

test('navigation observer is passive: no preventDefault, propagation blocking, click triggering, or navigation calls', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'espn-forensic-observer.js'), 'utf8');
  assert.doesNotMatch(source, /preventDefault\s*\(/);
  assert.doesNotMatch(source, /stopPropagation\s*\(|stopImmediatePropagation\s*\(/);
  assert.doesNotMatch(source, /\.click\s*\(/);
  assert.doesNotMatch(source, /location\.(?:assign|replace)\s*\(|location\s*=/);
  assert.doesNotMatch(source, /history\.(?:pushState|replaceState)\s*\(/);
  assert.match(source, /addEventListener\('click',[\s\S]*?, true\)/);
});

test('selected view classifier never retains arbitrary control text', () => {
  const core = globalThis.WarRoomEspnForensicCore;
  const node = {
    id:'manager-secret-control',
    className:'draft-navigation tab active',
    textContent:'Pick History — Private Team Manager Name',
    getAttribute(name) {
      if (name === 'role') return 'tab';
      if (name === 'aria-label') return 'Pick History';
      return null;
    }
  };
  assert.equal(core.classifyViewNode(node), 'pick-history');
  const event = core.sanitizeEvent({at:1000, category:'navigation-click', source:'click', view:core.classifyViewNode(node), click:'trusted'});
  assert.deepEqual(event, {id:null, at:1000, category:'navigation-click', source:'click', view:'pick-history', click:'trusted'});
  assert.doesNotMatch(JSON.stringify(event), /Private Team|Manager Name|manager-secret-control/);
});
