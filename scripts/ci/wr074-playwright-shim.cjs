'use strict';

const playwright = require('playwright');

function installFontNormalization() {
  const id = 'wr074-ci-font-normalization';
  const css = 'body,button,input,select,textarea{font-family:Arial,"Liberation Sans",sans-serif!important;}';
  const apply = () => {
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  };
  if (document.head || document.documentElement) apply();
  if (!document.head) document.addEventListener('DOMContentLoaded', apply, {once:true});
}

async function patchPage(page) {
  if (!page || page.__wr074FontNormalized) return page;
  Object.defineProperty(page, '__wr074FontNormalized', {value:true});
  await page.addInitScript(installFontNormalization);
  return page;
}

async function patchContext(context) {
  if (!context || context.__wr074FontNormalized) return context;
  Object.defineProperty(context, '__wr074FontNormalized', {value:true});
  await context.addInitScript(installFontNormalization);

  if (typeof context.newPage === 'function') {
    const originalNewPage = context.newPage.bind(context);
    context.newPage = async function wr074ContextNewPage(...args) {
      return patchPage(await originalNewPage(...args));
    };
  }

  for (const page of typeof context.pages === 'function' ? context.pages() : []) await patchPage(page);
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

const browserType = playwright.chromium;
const originalLaunch = browserType.launch.bind(browserType);
browserType.launch = async function wr074Launch(...args) {
  return patchBrowser(await originalLaunch(...args));
};

const originalPersistent = browserType.launchPersistentContext.bind(browserType);
browserType.launchPersistentContext = async function wr074LaunchPersistentContext(...args) {
  return patchContext(await originalPersistent(...args));
};
