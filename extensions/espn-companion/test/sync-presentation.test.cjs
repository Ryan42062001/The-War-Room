const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sync-presentation.js'), 'utf8');
const context = {};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context);
const presentation = context.WarRoomEspnSyncPresentation;

function status(overrides = {}) {
  return {
    config:{teams:10, rounds:16},
    picks:[{overallPick:1},{overallPick:2},{overallPick:3}],
    espn:{connected:true, draftPage:true, expectedCompleted:3, method:'network'},
    warRoom:{connected:true, applied:3, unmatched:0},
    ...overrides,
    espn:{connected:true, draftPage:true, expectedCompleted:3, method:'network', ...(overrides.espn || {})},
    warRoom:{connected:true, applied:3, unmatched:0, ...(overrides.warRoom || {})}
  };
}

function fullDraftStatus() {
  const picks = Array.from({length:160}, (_, index) => ({overallPick:index + 1}));
  return status({
    picks,
    espn:{draftComplete:true, expectedCompleted:160},
    warRoom:{applied:160, numberedAccepted:160, canonicalApplied:160, externalAccepted:0, unresolved:0, rejected:0, unmatched:0}
  });
}

test('healthy sync is quiet and transport-agnostic', () => {
  const result = presentation.derive(status());
  assert.equal(result.key, 'caughtUp');
  assert.equal(result.label, 'ESPN Live Sync · Caught up');
  assert.equal(result.compactLabel, 'ESPN · Caught up');
  assert.doesNotMatch(result.label + ' ' + result.detail, /websocket|fetch|xhr|eventsource|react|rest/i);
});

test('active acknowledgement lag is Updating', () => {
  const result = presentation.derive(status({warRoom:{applied:2}}));
  assert.equal(result.key, 'updating');
  assert.equal(result.detail, 'Checking for the latest completed picks…');
});

test('visible Pick History recovery is Catching up without error tone', () => {
  const result = presentation.derive(status({
    picks:[{overallPick:1},{overallPick:2}],
    espn:{method:'dom', expectedCompleted:3, visibleCandidates:2},
    warRoom:{applied:2}
  }));
  assert.equal(result.key, 'catchingUp');
  assert.equal(result.tone, 'progress');
  assert.match(result.detail, /Checking ESPN Pick History for any missed picks/);
  assert.match(result.recoveryNote, /War Room draft stays saved/);
});

test('missing Pick History when behind becomes actionable', () => {
  const result = presentation.derive(status({
    picks:[{overallPick:1},{overallPick:2}],
    espn:{method:'dom', expectedCompleted:3, visibleCandidates:0},
    warRoom:{applied:2}
  }));
  assert.equal(result.key, 'needsAttention');
  assert.equal(result.detail, 'Open ESPN Pick History so Sync can catch up.');
});

test('legacy unmatched remains a backward-compatible attention fallback', () => {
  const result = presentation.derive(status({warRoom:{unmatched:1}}));
  assert.equal(result.key, 'needsAttention');
  assert.equal(result.detail, '1 ESPN pick needs manual matching.');
  assert.doesNotMatch(result.detail, /unmatched/i);
});

test('accepted external off-board pick remains Caught up under final Core contract', () => {
  const picks = Array.from({length:288}, (_, index) => ({
    overallPick:index + 1,
    playerName:index === 279 ? 'Kene Nwangwu' : `Player ${index + 1}`,
    position:index === 279 ? 'RB' : 'WR'
  }));
  const result = presentation.derive({
    config:{teams:18, rounds:16},
    picks,
    espn:{connected:true, draftPage:true, expectedCompleted:288, method:'network'},
    warRoom:{
      connected:true,
      captured:288,
      applied:288,
      numberedAccepted:288,
      canonicalApplied:287,
      externalAccepted:1,
      unresolved:0,
      rejected:0,
      unmatched:0
    }
  });
  assert.equal(result.key, 'caughtUp');
  assert.equal(result.label, 'ESPN Live Sync · Caught up');
  assert.equal(presentation.acceptedCount({warRoom:{applied:287, numberedAccepted:288}}), 288);
});

test('richer unresolved count produces Needs attention with outcome language', () => {
  const result = presentation.derive(status({
    warRoom:{
      applied:3,
      numberedAccepted:3,
      canonicalApplied:2,
      externalAccepted:0,
      unresolved:1,
      rejected:0,
      unmatched:0
    }
  }));
  assert.equal(result.key, 'needsAttention');
  assert.equal(result.detail, '1 ESPN pick needs manual matching.');
  assert.doesNotMatch(result.detail, /unmatched|rejected/i);
});

test('rich contract supersedes stale legacy unmatched and does not alarm on rejected diagnostics alone', () => {
  const result = presentation.derive(status({
    warRoom:{
      applied:3,
      numberedAccepted:3,
      canonicalApplied:2,
      externalAccepted:1,
      unresolved:0,
      rejected:2,
      unmatched:7
    }
  }));
  assert.equal(result.key, 'caughtUp');
  assert.equal(presentation.actionableIssueCount({warRoom:{unresolved:0,rejected:5,unmatched:9}}), 0);
});

test('expected connectivity absence is Unavailable while ordinary idle use stays hidden', () => {
  const idle = presentation.derive({config:{teams:10,rounds:16}, picks:[], espn:{}, warRoom:{connected:true}});
  assert.equal(idle.key, 'idle');
  assert.equal(idle.visible, false);

  const unavailable = presentation.derive(
    {config:{teams:10,rounds:16}, picks:[], espn:{}, warRoom:{connected:true}},
    {expectedSession:true}
  );
  assert.equal(unavailable.key, 'unavailable');
});

test('ESPN completion signal finalizes until the configured full draft is reconciled', () => {
  const premature = presentation.derive(status({espn:{draftComplete:true, expectedCompleted:3}}));
  assert.equal(premature.key, 'finalizing');

  const partial = presentation.derive(status({
    picks:[{overallPick:1},{overallPick:2}],
    espn:{draftComplete:true, expectedCompleted:3},
    warRoom:{applied:2}
  }));
  assert.equal(partial.key, 'finalizing');

  const complete = presentation.derive(fullDraftStatus());
  assert.equal(complete.key, 'complete');
  assert.equal(complete.label, 'Draft complete');
  assert.equal(complete.authoritativeComplete, true);
});

test('extension refresh requirement is Needs attention with preserved-draft reassurance', () => {
  const result = presentation.derive(status(), {refreshRequired:true});
  assert.equal(result.key, 'needsAttention');
  assert.match(result.detail, /Refresh the ESPN draft tab once/);
  assert.match(result.detail, /saved picks are preserved/i);
});
