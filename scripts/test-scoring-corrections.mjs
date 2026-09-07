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
  await page.waitForFunction(() => typeof WarRoomScoringCorrections === 'object');

  const state = await page.evaluate(() => {
    function basePlayer(overrides) {
      return Object.assign({
        name: 'Primary',
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

    return {
      version: WarRoomScoringCorrections.version,
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
      multiPickPlanning: calculateMultiPickPlanningScore({}, {}),
      positivePackage: positivePackage[0],
      negativePackage: negativePackage[0],
      degraded: document.body.getAttribute('data-war-room-degraded') || ''
    };
  });

  assert.equal(state.version, '20260907-1');
  assert.equal(state.rosterNeed25, 3, 'A single 25-point roster need should receive partial confidence credit');
  assert.equal(state.rosterNeed50, 5, 'A 50-point roster need should receive maximum roster-need confidence credit');
  assert.equal(state.draftAware15, 4, 'Draft-aware VORP should use its real 0-5 scale');
  assert.equal(state.draftAware3, 7, 'Draft-aware VORP midpoint should be reachable');
  assert.equal(state.draftAware5, 10, 'Draft-aware VORP maximum should be reachable');
  assert.equal(state.tierCliff3, 6, 'Moderate tier cliff should use the real 3-point signal');
  assert.equal(state.tierCliff5, 10, 'High tier cliff should use the real 5-point signal');
  assert.equal(state.consistentPriorityGap, 0, 'Confidence should compare take-now priority on both sides instead of mixing raw and priority scores');
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

  assert.equal(state.degraded, '', 'Scoring corrections should load before draft initialization');
  assert.deepEqual(errors, []);
  console.log('Scoring correctness regression valid: confidence scales match their real ranges, score-gap confidence uses one basis, and package-path planning stays inside the strategy budget.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
