import assert from 'node:assert/strict';

/**
 * Commit a value to a control whose containing view may rerender on the same
 * animation frame. Resolving and dispatching in one browser task prevents a
 * test locator from spanning two different render generations.
 */
export async function commitRerenderingControl(page, selector, value) {
  const result = await page.locator(selector).evaluate((input, nextValue) => {
    const rect = input.getBoundingClientRect();
    const style = getComputedStyle(input);
    if (style.display === 'none' || style.visibility === 'hidden' || rect.width <= 0 || rect.height <= 0) {
      return {committed:false, reason:'not-visible'};
    }
    input.value = String(nextValue);
    input.dispatchEvent(new Event('input', {bubbles:true}));
    input.dispatchEvent(new Event('change', {bubbles:true}));
    return {committed:true, value:input.value};
  }, String(value));
  assert.deepEqual(result, {committed:true, value:String(value)});
}

/** Open the currently mounted disclosure and prove it survived scheduled UI renders. */
export async function openStableDisclosure(page, selector) {
  await page.waitForFunction(async detailsSelector => {
    let details = document.querySelector(detailsSelector);
    if (!details) return false;
    if (!details.open) details.querySelector(':scope > summary')?.click();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    details = document.querySelector(detailsSelector);
    return Boolean(details?.open);
  }, selector);
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
