import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const {chromium} = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const server = http.createServer((request, response) => {
  const relative = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\//, '');
  fs.readFile(path.join(root, relative), (error, data) => {
    response.statusCode = error ? 404 : 200;
    response.end(error ? 'not found' : data);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const appUrl = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH});
const page = await browser.newPage({viewport:{width:1280,height:900}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

try {
  await page.goto(appUrl, {waitUntil:'load'});
  await page.waitForSelector('tr.draftrow', {state:'attached'});
  await page.waitForFunction(() =>
    typeof WarRoomCanonicalScoring === 'object' &&
    typeof WarRoomCanonicalRecommendations === 'object'
  );

  const state = await page.evaluate(() => {
    function basePlayer(overrides) {
      return Object.assign({
        name: 'Primary',
        position: 'WR',
        rank: 10,
        finalScore: 50,
        recommendationPriorityScore: 50,
        vorpScore: 0,
        tierScore: 0,
        timingScore: 0,
        scarcityScore: 0,
        rosterNeedScore: 0,
        draftAwareVorpOpportunityScore: 0,
        tierCliffOpportunityScore: 0
      }, overrides || {});
    }

    function baseNext(overrides) {
      return Object.assign({
        name: 'Alternative',
        position: 'WR',
        rank: 20,
        finalScore: 50,
        recommendationPriorityScore: 50,
        vorpScore: 0,
        tierScore: 0,
        nextPickSurvivalScore: 0
      }, overrides || {});
    }

    function confidence(overrides, nextOverrides) {
      return calculateRecommendationConfidence(
        basePlayer(overrides),
        baseNext(nextOverrides),
        {}
      );
    }

    const originalPackageAdvantage = window.calculatePackagePathAdvantage;

    window.calculatePackagePathAdvantage = () => 2;
    const positivePackage = [{
      name: 'Budget Positive',
      baseScore: 80,
      rawStrategyAdjustment: 14,
      cappedStrategyAdjustment: 14,
      guardrailAdjustment: 0,
      finalScore: 94,
      phaseAdjustedMultiPickScore: 0
    }];
    applyPackagePathAdjustments(positivePackage, {}, 1);

    window.calculatePackagePathAdvantage = () => -2;
    const negativePackage = [{
      name: 'Budget Negative',
      baseScore: 80,
      rawStrategyAdjustment: -14,
      cappedStrategyAdjustment: -14,
      guardrailAdjustment: 0,
      finalScore: 66,
      phaseAdjustedMultiPickScore: 0
    }];
    applyPackagePathAdjustments(negativePackage, {}, 1);

    window.calculatePackagePathAdvantage = originalPackageAdvantage;

    const originalAlternatives = window.calculateNextPickAlternatives;
    const originalSurvival = window.calculateNextPickSurvival;
    const originalDecision = window.calculateRecommendationDecision;
    const originalAlign = window.alignRecommendationActionWithMarketTiming;
    const primary = basePlayer({finalScore:50, recommendationPriorityScore:60});
    const future = baseNext({finalScore:55, recommendationPriorityScore:70});

    window.calculateNextPickAlternatives = () => [future];
    window.calculateNextPickSurvival = () => 50;
    window.calculateRecommendationDecision = () => ({
      recommendation:'CONSIDER',
      summary:'fixture',
      urgencyBonus:0
    });
    window.alignRecommendationActionWithMarketTiming = decision => decision;

    const basisRecommendation = calculateDraftRecommendation(
      primary,
      [primary, future],
      {currentPick:10, teams:10}
    );

    window.calculateNextPickAlternatives = originalAlternatives;
    window.calculateNextPickSurvival = originalSurvival;
    window.calculateRecommendationDecision = originalDecision;
    window.alignRecommendationActionWithMarketTiming = originalAlign;

    const ecrOrdered = [
      {name:'Better ECR', position:'WR', rank:10, ecr:10, finalScore:70},
      {name:'Worse ECR', position:'WR', rank:11, ecr:11, finalScore:80}
    ];
    enforceAuthoritativePositionOrder(ecrOrdered);
    const better = ecrOrdered.find(player => player.name === 'Better ECR');
    const worse = ecrOrdered.find(player => player.name === 'Worse ECR');

    const live = buildLiveDraftDebugState();
    const finiteScores = live.scored.every(player =>
      ['baseScore','rawStrategyAdjustment','cappedStrategyAdjustment','guardrailAdjustment','finalScore']
        .every(key => Number.isFinite(Number(player[key])))
    );

    return {
      scoringVersion: WarRoomCanonicalScoring.version,
      recommendationsVersion: WarRoomCanonicalRecommendations.version,
      oldPatchObject: typeof window.WarRoomScoringCorrections,
      oldPatchScript: Boolean(document.querySelector('script[data-war-room-scoring-corrections]')),
      oldPatchRequest: performance.getEntriesByType('resource')
        .some(entry => entry.name.includes('war-room-scoring-corrections.js')),
      canonicalScoringRequest: performance.getEntriesByType('resource')
        .some(entry => entry.name.includes('war-room-scoring-canonical.js')),
      canonicalRecommendationsRequest: performance.getEntriesByType('resource')
        .some(entry => entry.name.includes('war-room-recommendations-canonical.js')),
      rosterNeed25: confidence({rosterNeedScore:25}),
      rosterNeed50: confidence({rosterNeedScore:50}),
      draftAware15: confidence({draftAwareVorpOpportunityScore:1.5}),
      draftAware3: confidence({draftAwareVorpOpportunityScore:3}),
      draftAware5: confidence({draftAwareVorpOpportunityScore:5}),
      tierCliff3: confidence({tierCliffOpportunityScore:3}),
      tierCliff5: confidence({tierCliffOpportunityScore:5}),
      consistentPriorityGap: confidence(
        {finalScore:50, recommendationPriorityScore:60},
        {finalScore:55, recommendationPriorityScore:70}
      ),
      basisRecommendation,
      multiPickPlanning: calculateMultiPickPlanningScore({}, {}),
      positivePackage: positivePackage[0],
      negativePackage: negativePackage[0],
      samePositionProtected: Number(better.finalScore) > Number(worse.finalScore),
      finiteScores,
      degraded: document.body.getAttribute('data-war-room-degraded') || ''
    };
  });

  assert.equal(state.scoringVersion, '20260907-1');
  assert.equal(state.recommendationsVersion, '20260907-1');
  assert.equal(state.oldPatchObject, 'undefined', 'Old runtime correction object must be retired');
  assert.equal(state.oldPatchScript, false, 'Bootstrap must not inject the old correction script');
  assert.equal(state.oldPatchRequest, false, 'Production load must not request the old correction script');
  assert.equal(state.canonicalScoringRequest, true, 'Required canonical scoring correctness must load statically');
  assert.equal(state.canonicalRecommendationsRequest, true, 'Required canonical recommendation correctness must load statically');

  assert.equal(state.rosterNeed25, 3, 'A single 25-point roster need should receive partial confidence credit');
  assert.equal(state.rosterNeed50, 5, 'A 50-point roster need should receive maximum roster-need confidence credit');
  assert.equal(state.draftAware15, 4, 'Draft-aware VORP should use its real 0-5 scale');
  assert.equal(state.draftAware3, 7, 'Draft-aware VORP midpoint should be reachable');
  assert.equal(state.draftAware5, 10, 'Draft-aware VORP maximum should be reachable');
  assert.equal(state.tierCliff3, 6, 'Moderate tier cliff should use the real 3-point signal');
  assert.equal(state.tierCliff5, 10, 'High tier cliff should use the real 5-point signal');
  assert.equal(state.consistentPriorityGap, 0, 'Confidence should compare take-now priority on both sides');

  assert.equal(state.basisRecommendation.rawPlayerValue, 50);
  assert.equal(state.basisRecommendation.takeNowPriority, 60);
  assert.equal(state.basisRecommendation.score, 60);
  assert.equal(state.basisRecommendation.nextBestScore, 55);
  assert.equal(state.basisRecommendation.scoreGap, 5);
  assert.equal(state.basisRecommendation.scoreBasis, 'TAKE_NOW_PRIORITY_VS_FUTURE_VALUE');

  assert.equal(state.multiPickPlanning, 0, 'Legacy multi-pick planning nudge should be retired');

  assert.equal(state.positivePackage.packagePathAdvantageScore, 2);
  assert.equal(state.positivePackage.rawStrategyAdjustment, 16);
  assert.equal(state.positivePackage.cappedStrategyAdjustment, 15);
  assert.equal(state.positivePackage.finalScore, 95, 'Positive package path must stay inside the +15 strategy budget');
  assert.equal(state.positivePackage.packagePathBudgeted, true);

  assert.equal(state.negativePackage.packagePathAdvantageScore, -2);
  assert.equal(state.negativePackage.rawStrategyAdjustment, -16);
  assert.equal(state.negativePackage.cappedStrategyAdjustment, -15);
  assert.equal(state.negativePackage.finalScore, 65, 'Negative package path must stay inside the -15 strategy budget');
  assert.equal(state.negativePackage.packagePathBudgeted, true);

  assert.equal(state.samePositionProtected, true, 'Same-position FantasyPros ECR protection must remain authoritative');
  assert.equal(state.finiteScores, true, 'Live scoring diagnostics must remain finite');
  assert.equal(state.degraded, '', 'Required canonical scoring code should be present before draft initialization');
  assert.deepEqual(errors, []);

  const failClosedPage = await browser.newPage({viewport:{width:1280,height:900}});
  await failClosedPage.route('**/js/war-room-scoring-canonical.js*', route => route.abort());
  await failClosedPage.goto(appUrl, {waitUntil:'load'});
  await failClosedPage.waitForTimeout(100);
  const failClosed = await failClosedPage.evaluate(() => ({
    scoringMarker: typeof window.WarRoomCanonicalScoring,
    recommendationMarker: typeof window.WarRoomCanonicalRecommendations,
    initializedRows: document.querySelectorAll('tr.draftrow').length,
    degraded: document.body.getAttribute('data-war-room-degraded') || ''
  }));
  await failClosedPage.close();

  assert.equal(failClosed.scoringMarker, 'undefined');
  assert.equal(failClosed.recommendationMarker, 'object');
  assert.equal(failClosed.initializedRows, 0, 'Missing required correctness code must block core initialization');
  assert.equal(failClosed.degraded, 'true', 'Fail-closed startup should surface degraded status');

  console.log('Canonical scoring correctness valid: approved #91 behavior is required, old runtime patch is absent, and startup fails closed without correctness code.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
