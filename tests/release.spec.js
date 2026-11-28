// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 UK Research and Innovation (UKRI)
//
// WORKPLAN F1/F5: the release version is defined once (js/build-config.js) and every
// place that states it must agree; every help page links back to the application Home.
// This is the checklist in docs/DEVELOPMENT.md "Releasing", made executable.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const VERSION = /applicationVersion:'([^']+)'/.exec(read('js/build-config.js'))[1];
const HELP_PAGES = ['user-guide', 'step-4-model-options', 'validation-and-applicability', 'approval-and-operation', 'security-and-privacy', 'index'];

test.describe('Release consistency', () => {
  test('the version uses calendar versioning YYYY.MM.PATCH', () => {
    expect(VERSION).toMatch(/^20\d\d\.(0[1-9]|1[0-2])\.\d+$/);
  });

  test('every place that states the version agrees with js/build-config.js', () => {
    expect(JSON.parse(read('package.json')).version).toBe(VERSION);
    const lock = JSON.parse(read('package-lock.json'));
    expect(lock.version).toBe(VERSION);
    expect(lock.packages[''].version).toBe(VERSION);
    const assetVersions = [...read('index.html').matchAll(/\.(?:js|css)\?v=([^"]+)"/g)].map(m => m[1]);
    expect(assetVersions.length).toBeGreaterThan(4);
    expect(new Set(assetVersions)).toEqual(new Set([VERSION]));
    expect(read('index.html')).toContain(`<span data-app-version>${VERSION}</span>`);
    expect(JSON.parse(read('SBOM.cdx.json')).metadata.component.version).toBe(VERSION);
    expect(read('CHANGELOG.md')).toMatch(new RegExp(`^## ${VERSION.replace(/\./g, '\\.')}\\b`, 'm'));
    for (const page of HELP_PAGES) {
      expect(read(`docs/html/${page}.html`), page).toContain(`<span data-doc-version>${VERSION}</span>`);
    }
  });

  test('every help page links back to the application Home', () => {
    for (const page of HELP_PAGES) {
      expect(read(`docs/html/${page}.html`), page).toContain('href="../../index.html#home"');
    }
  });

  test('help pages and links carry the version, so browsers never mix old and new help', () => {
    for (const page of HELP_PAGES) {
      expect(read(`docs/html/${page}.html`), page).toContain(`href="./help.css?v=${VERSION}"`);
    }
    const links = [...read('index.html').matchAll(/href="\.\/docs\/html\/[^"]+"/g)].map(m => m[0]);
    expect(links.length).toBeGreaterThan(3);
    for (const link of links) expect(link, link).toContain(`?v=${VERSION}`);
    expect(read('docs/html/user-guide.html')).toContain(`Version <span data-doc-version>${VERSION}</span>`);
  });

  test('the app shows the version, and new saved files record it', async ({ page }) => {
    await page.goto('/?localOnly=1');
    await page.waitForFunction(() => !!(window.LocalRegressionApp && window.LRSPlatform && window.EMSProjectShell));
    expect(await page.evaluate(() => [window.LocalRegressionApp.version, window.LRSPlatform.version])).toEqual([VERSION, VERSION]);
    await page.locator('.top-nav [data-nav="project"]').click();
    await expect(page.locator('#view-project .app-footer-credit')).toContainText(`v${VERSION}`);
    await page.setInputFiles('#csvFile', path.join(ROOT, 'examples', 'pipe_pressure_drop_sample.csv'));
    await expect(page.locator('#targetColumn option', { hasText: 'pressure_drop_kpa' })).toHaveCount(1);
    await page.evaluate(() => window.EMSProjectShell.goToPanel('step-features'));
    await page.selectOption('#targetColumn', 'pressure_drop_kpa');
    await page.click('#autoFeaturesBtn');
    await page.evaluate(() => window.EMSProjectShell.goToPanel('step-split'));
    await page.click('#trainBtn');
    await expect(page.locator('#metricsTable tbody tr').first()).toBeVisible({ timeout: 60000 });
    expect(await page.evaluate(() => window.LocalRegressionApp.state.artifact.appVersion)).toBe(VERSION);
  });

  test('About shows the version and keeps a short credit for the original engine', async ({ page }) => {
    await page.goto('/?localOnly=1#about');
    await page.waitForFunction(() => !!window.EMSModes);
    const about = page.locator('#view-about');
    await expect(about).toContainText(`Version ${VERSION}`);
    // Attribution is kept brief, but must stay (MIT notice; WORKPLAN guardrail 5).
    await expect(about.locator('h2', { hasText: 'Acknowledgements' })).toBeVisible();
    await expect(about).toContainText('Local Regression Studio by Yu Duan');
    await expect(about).toContainText('MIT licence');
    expect(fs.existsSync(path.join(ROOT, 'LICENSES.txt')) && fs.existsSync(path.join(ROOT, 'NOTICE.md'))).toBe(true);
  });

  test('the top-bar Help link opens the guide at the section for the current mode', async ({ page, request }) => {
    await page.goto('/?localOnly=1');
    await page.waitForFunction(() => !!window.EMSModes);
    const guide = await (await request.get('/docs/html/user-guide.html')).text();
    for (const [mode, anchor] of [['explore', 'explore'], ['learn', 'learn'], ['about', 'about']]) {
      await page.locator(`.top-nav [data-nav="${mode}"]`).click();
      await expect(page.locator('#navHelpLink')).toHaveAttribute('href', `./docs/html/user-guide.html?v=${VERSION}#${anchor}`);
      expect(guide, anchor).toContain(`id="${anchor}"`);
    }
  });
});
