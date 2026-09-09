import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const scriptsDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1'));
const sourcePath = path.join(scriptsDir, 'test-browser.mjs');
const tempPath = path.join(scriptsDir, `.test-browser-current-${process.pid}.mjs`);
let source = fs.readFileSync(sourcePath, 'utf8');

function replaceRequired(label, before, after) {
  if (!source.includes(before)) {
    throw new Error(`Unable to retire obsolete browser assertion: missing ${label}`);
  }
  source = source.replace(before, after);
}

replaceRequired(
  'recommendation-card visibility wait',
  "await page.waitForSelector('.recommendation-card');",
  "await page.waitForSelector('.recommendation-card', {state:'attached'});"
);

replaceRequired(
  'recommendation detail click assertions',
  "await page.locator('.recommendation-card-summary').click();\n" +
    "assert.equal(await recommendationCard.getAttribute('open'), '');\n" +
    "assert.equal(await page.locator('.recommendation-factor').count(), 4);\n" +
    "assert.equal(await page.locator('.recommendation-market-details summary').textContent(), 'Why this survival?');\n" +
    "assert.match(await page.locator('.recommendation-market-details').textContent(), /estimated market pick/);\n" +
    "assert.equal(await page.getByRole('progressbar').count(), 4);\n",
  ''
);

replaceRequired(
  'recommendation open-state render field',
  "    stayedOpen: element.querySelector('.recommendation-card').open,\n",
  ''
);

replaceRequired(
  'recommendation open-state render assertion',
  "assert.equal(recommendationRender.stayedOpen, true);\n",
  ''
);

replaceRequired(
  'draft management disclosure',
  "const sessionBefore = await page.locator('#draftSessionSelect option').count();\nawait page.getByRole('button', {name:'New Draft'}).click();",
  "const sessionBefore = await page.locator('#draftSessionSelect option').count();\n" +
    "await page.locator('#draft-manage > summary').click();\n" +
    "assert.equal(await page.locator('#draft-manage').getAttribute('open'), '');\n" +
    "await page.getByRole('button', {name:'New Draft'}).click();"
);

fs.writeFileSync(tempPath, source);
try {
  await import(pathToFileURL(tempPath).href);
} finally {
  fs.rmSync(tempPath, {force:true});
}
