(function(root) {
  'use strict';

  function finiteCount(value) {
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0;
  }

  function hasOwn(record, name) {
    return Boolean(record && Object.prototype.hasOwnProperty.call(record, name));
  }

  function hasRichAckContract(status) {
    var warRoom = (status || {}).warRoom || {};
    return ['numberedAccepted','canonicalApplied','externalAccepted','unresolved','rejected']
      .some(function(name) { return hasOwn(warRoom, name); });
  }

  function legacyActionableIssueCount(status) {
    status = status || {};
    return finiteCount((status.warRoom || {}).unmatched);
  }

  function actionableIssueCount(status, options) {
    options = options || {};
    if (Number.isFinite(Number(options.actionableIssueCount))) {
      return Math.max(0, Math.trunc(Number(options.actionableIssueCount)));
    }
    if (typeof options.resolveActionableIssueCount === 'function') {
      var resolved = Number(options.resolveActionableIssueCount(status));
      if (Number.isFinite(resolved)) return Math.max(0, Math.trunc(resolved));
    }
    var warRoom = (status || {}).warRoom || {};
    if (hasRichAckContract(status)) {
      return finiteCount(warRoom.unresolved);
    }
    return legacyActionableIssueCount(status);
  }

  function acceptedCount(status) {
    var warRoom = (status || {}).warRoom || {};
    if (hasOwn(warRoom, 'numberedAccepted')) return finiteCount(warRoom.numberedAccepted);
    return finiteCount(warRoom.applied);
  }

  function stateRecord(key, detail, extra) {
    var labels = {
      idle:['ESPN Live Sync', 'ESPN'],
      caughtUp:['ESPN Live Sync · Caught up', 'ESPN · Caught up'],
      updating:['ESPN Live Sync · Updating', 'ESPN · Updating'],
      catchingUp:['ESPN Live Sync · Catching up', 'ESPN · Catching up'],
      needsAttention:['ESPN Live Sync · Needs attention', 'ESPN · Attention'],
      unavailable:['ESPN Live Sync · Unavailable', 'ESPN · Unavailable'],
      finalizing:['ESPN Live Sync · Finalizing picks', 'ESPN · Finalizing'],
      complete:['Draft complete', 'Draft complete']
    };
    var record = {
      key:key,
      label:labels[key][0],
      compactLabel:labels[key][1],
      detail:detail || '',
      visible:key !== 'idle',
      actionRequired:key === 'needsAttention',
      tone:key === 'needsAttention' ? 'attention' :
        key === 'updating' || key === 'catchingUp' || key === 'finalizing' ? 'progress' :
        key === 'caughtUp' || key === 'complete' ? 'healthy' : 'neutral'
    };
    if (extra) Object.keys(extra).forEach(function(name) { record[name] = extra[name]; });
    return record;
  }

  function derive(status, options) {
    status = status || {};
    options = options || {};
    var config = status.config || {};
    var espn = status.espn || {};
    var warRoom = status.warRoom || {};
    var picks = Array.isArray(status.picks) ? status.picks : [];
    var captured = Math.max(picks.length, finiteCount(warRoom.captured));
    var accepted = acceptedCount(status);
    var expectedCompleted = finiteCount(espn.expectedCompleted);
    var teams = finiteCount(config.teams);
    var rounds = finiteCount(config.rounds);
    var totalPicks = teams && rounds ? teams * rounds : 0;
    var issues = actionableIssueCount(status, options);
    var method = String(espn.method || '').toLowerCase();
    var pickHistoryRecovery = method === 'dom' || method === 'hybrid';
    var seenEspn = Boolean(
      espn.connected || espn.draftPage || espn.lastSeenAt || captured || expectedCompleted || espn.draftComplete
    );
    var expectedSession = options.expectedSession == null ? seenEspn : Boolean(options.expectedSession);
    var versionOutdated = Boolean(options.versionOutdated);
    var refreshRequired = Boolean(espn.mainWorldReloadRequired || options.refreshRequired);
    var deliveryIssue = Boolean(status.error || warRoom.deliveryError || espn.storageWriteError);
    var authoritativeComplete = options.authoritativeComplete === true || Boolean(
      espn.draftComplete && totalPicks > 0 && captured >= totalPicks && accepted >= totalPicks && issues === 0
    );

    if (!expectedSession) {
      return stateRecord('idle', 'Open an ESPN draft when you want Live Sync.');
    }

    if (espn.draftComplete) {
      if (authoritativeComplete) {
        return stateRecord('complete', 'All configured picks are reconciled.', {authoritativeComplete:true});
      }
      return stateRecord(
        'finalizing',
        'ESPN says the room is ending. Sync is reconciling the remaining numbered picks.'
      );
    }

    if (versionOutdated || refreshRequired) {
      return stateRecord(
        'needsAttention',
        'Refresh the ESPN draft tab once to finish the Companion update. Your saved picks are preserved.'
      );
    }

    if (issues > 0) {
      return stateRecord(
        'needsAttention',
        issues + ' ESPN ' + (issues === 1 ? 'pick needs' : 'picks need') + ' manual matching.',
        {actionableIssueCount:issues}
      );
    }

    if (deliveryIssue) {
      return stateRecord('needsAttention', 'The ESPN-to-War Room connection needs attention. Press Rescan ESPN.');
    }

    if (!espn.connected || !espn.draftPage || !warRoom.connected) {
      return stateRecord('unavailable', 'Open both the ESPN draft room and The War Room in this browser.');
    }

    var captureLag = Math.max(0, expectedCompleted - captured);
    var acknowledgementLag = Math.max(0, captured - accepted);
    var overallLag = Math.max(0, expectedCompleted - accepted);

    if (pickHistoryRecovery && captureLag > 0) {
      if (finiteCount(espn.visibleCandidates) > 0) {
        return stateRecord(
          'catchingUp',
          'Checking ESPN Pick History for any missed picks. You can keep drafting.',
          {recoveryNote:'ESPN may briefly refresh while Sync catches up. Your War Room draft stays saved.'}
        );
      }
      return stateRecord('needsAttention', 'Open ESPN Pick History so Sync can catch up.');
    }

    if (acknowledgementLag > 0 || overallLag > 0 || options.forceUpdating) {
      return stateRecord('updating', 'Checking for the latest completed picks…');
    }

    return stateRecord('caughtUp', 'Latest completed ESPN picks are reflected in The War Room.');
  }

  root.WarRoomEspnSyncPresentation = {
    derive:derive,
    actionableIssueCount:actionableIssueCount,
    acceptedCount:acceptedCount,
    hasRichAckContract:hasRichAckContract,
    legacyActionableIssueCount:legacyActionableIssueCount
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
