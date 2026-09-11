import assert from 'node:assert/strict';

/**
 * Open a disclosure and commit one control value in the same browser task.
 * The bounded render-frame loop re-resolves the current generation; once it
 * is open, input/change dispatch completes synchronously before rendering can
 * replace that generation.
 */
export async function commitDisclosureControl(page, disclosureSelector, controlSelector, value) {
  const result = await page.evaluate(async ({disclosureSelector, controlSelector, value}) => {
    for (let frame = 0; frame < 20; frame++) {
      let details = document.querySelector(disclosureSelector);
      if (details && !details.open) details.querySelector(':scope > summary')?.click();
      await new Promise(resolve => requestAnimationFrame(resolve));
      details = document.querySelector(disclosureSelector);
      const input = details?.querySelector(controlSelector);
      if (!details?.open || !input) continue;
      const rect = input.getBoundingClientRect();
      const style = getComputedStyle(input);
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width <= 0 || rect.height <= 0) continue;
      input.value = value;
      input.dispatchEvent(new Event('input', {bubbles:true}));
      input.dispatchEvent(new Event('change', {bubbles:true}));
      return {committed:true, value:input.value, renderFrames:frame + 1};
    }
    return {committed:false};
  }, {disclosureSelector, controlSelector, value:String(value)});
  assert.equal(result.committed, true, 'current disclosure generation never became editable');
  assert.equal(result.value, String(value));
  assert.ok(result.renderFrames >= 1 && result.renderFrames <= 20);
}

/**
 * Establish a persistence boundary between scenarios. War Room autosave is a
 * 400 ms debounce and command rendering is requestAnimationFrame-driven. The
 * boundary waits for both queues to drain; it does not cancel product work or
 * relax any postcondition.
 */
export async function waitForWarRoomQuiescence(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => typeof _saveTimer === 'undefined' || _saveTimer === null);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => typeof _saveTimer === 'undefined' || _saveTimer === null);
}
