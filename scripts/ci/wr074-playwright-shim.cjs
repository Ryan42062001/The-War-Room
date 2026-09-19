'use strict';

if (process.platform === 'win32') {
  const playwright = require('playwright');
  const chromium = playwright.chromium;
  if (!chromium.__wr074FontHintingNormalized) {
    const originalLaunch = chromium.launch.bind(chromium);
    chromium.launch = function wr074Launch(options = {}) {
      const args = Array.isArray(options.args) ? [...options.args] : [];
      if (!args.includes('--font-render-hinting=none')) args.push('--font-render-hinting=none');
      return originalLaunch({...options, args});
    };
    Object.defineProperty(chromium, '__wr074FontHintingNormalized', {
      value: true,
      enumerable: false,
      configurable: false,
    });
  }
}
