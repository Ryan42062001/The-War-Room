'use strict';

const playwright = require('playwright');
const ciFontCss = 'body,button,input,select,textarea{font-family:Arial,"Liberation Sans",sans-serif!important;}';

function patchPage(page) {
  if (!page || page.__wr074FontNormalized) return page;
  Object.defineProperty(page, '__wr074FontNormalized', {value:true});

  if (typeof page.goto === 'function') {
    const originalGoto = page.goto.bind(page);
    page.goto = async function wr074Goto(...args) {
      const response = await originalGoto(...args);
      await page.addStyleTag({content:ciFontCss});
      return response;
    };
  }

  if (typeof page.setContent === 'function') {
    const originalSetContent = page.setContent.bind(page);
    page.setContent = async function wr074SetContent(...args) {
      const response = await originalSetContent(...args);
      await page.addStyleTag({content:ciFontCss});
      return response;
    };
  }

  return page;
}

function patchContext(context) {
  if (!context || context.__wr074FontNormalized) return context;
  Object.defineProperty(context, '__wr074FontNormalized', {value:true});

  if (typeof context.newPage === 'function') {
    const originalNewPage = context.newPage.bind(context);
    context.newPage = async function wr074ContextNewPage(...args) {
      return patchPage(await originalNewPage(...args));
    };
  }

  for (const page of typeof context.pages === 'function' ? context.pages() : []) patchPage(page);
  return context;
}

function patchBrowser(browser) {
  if (!browser || browser.__wr074FontNormalized) return browser;
  Object.defineProperty(browser, '__wr074FontNormalized', {value:true});

  if (typeof browser.newPage === 'function') {
    const originalNewPage = browser.newPage.bind(browser);
    browser.newPage = async function wr074BrowserNewPage(...args) {
      return patchPage(await originalNewPage(...args));
    };
  }

  if (typeof browser.newContext === 'function') {
    const originalNewContext = browser.newContext.bind(browser);
    browser.newContext = async function wr074BrowserNewContext(...args) {
      return patchContext(await originalNewContext(...args));
    };
  }

  return browser;
}

for (const browserType of [playwright.chromium]) {
  const originalLaunch = browserType.launch.bind(browserType);
  browserType.launch = async function wr074Launch(...args) {
    return patchBrowser(await originalLaunch(...args));
  };

  const originalPersistent = browserType.launchPersistentContext.bind(browserType);
  browserType.launchPersistentContext = async function wr074LaunchPersistentContext(...args) {
    return patchContext(await originalPersistent(...args));
  };
}
