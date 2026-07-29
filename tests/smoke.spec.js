// Baseline smoke tests for Engineering ML Studio.
//
// These tests exercise the *current* (inherited) browser application end to end.
// They intentionally assert only observable, pre-redesign behaviour so that the
// forthcoming UX work can be checked against a known-good baseline.
//
// The application is a pure client-side static site. All tests load it with
// `?localOnly=1`, which forces the bundled libraries (no CDN) so runs are
// deterministic, offline, and backend-free.
//
// Readiness signal: `js/app.js` calls `init()` on load and, inside init, assigns
// `window.LocalRegressionApp`. Its presence means every module loaded and all
// event handlers are bound.

const { test, expect } = require('@playwright/test');
const path = require('path');

const HOUSE_CSV = path.join(__dirname, '..', 'examples', 'house_prices_sample.csv');

// Hosts we consider "local" — anything else during a tested workflow would mean
// data or requests leaving the machine, which must not happen.
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

function isLocalUrl(url) {
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) return true;
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return true; // non-network scheme
  }
}

// Attach error/request collectors before navigation and return them for assertions.
function instrument(page) {
  const pageErrors = [];
  const externalRequests = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('request', req => {
    if (!isLocalUrl(req.url())) externalRequests.push(req.url());
  });
  return { pageErrors, externalRequests };
}

// Phase 1 note: a new landing page is now the default view and the inherited
// eight-stage application lives inside `#view-project`, hidden until the user
// chooses Project mode. These baseline tests therefore add ONE new step —
// entering Project mode — before driving the unchanged Project workflow. No
// original assertion is removed or weakened.
async function enterProjectMode(page) {
  await page.waitForFunction(() => !!window.EMSModes);
  await page.locator('.top-nav [data-nav="project"]').click();
  await expect(page.locator('#view-project')).toBeVisible();
}

// Drive the app from a blank page to a trained linear model on the house dataset.
// Returns the collectors so individual tests can make focused assertions.
async function loadDatasetAndTrain(page) {
  const collectors = instrument(page);

  await page.goto('/?localOnly=1');
  await page.waitForFunction(() => !!(window.LocalRegressionApp && window.LocalRegressionApp.version));
  await enterProjectMode(page); // Phase 1: reveal the inherited Project workflow.

  // (3) Load the bundled example dataset via the file input (hidden, set directly).
  await page.setInputFiles('#csvFile', HOUSE_CSV);

  // After a successful load the target dropdown is populated with numeric columns.
  await expect(page.locator('#targetColumn option', { hasText: 'price' })).toHaveCount(1);
  await expect(page.locator('#step-features')).not.toHaveClass(/locked/);

  // (4) Progress to feature & target selection.
  await page.selectOption('#targetColumn', 'price');
  await page.click('#autoFeaturesBtn');
  await expect(page.locator('#featureList input[type="checkbox"]:checked').first()).toBeVisible();

  // Selecting a target + features unlocks model and split stages.
  await expect(page.locator('#step-model')).not.toHaveClass(/locked/);
  await expect(page.locator('#step-split')).not.toHaveClass(/locked/);

  // (5) Train. 'linear' is the default model, so no model change is needed.
  await page.click('#trainBtn');

  // (6) Training completion is observable as populated metric rows.
  await expect(page.locator('#metricsTable tbody tr').first()).toBeVisible();

  return collectors;
}

test.describe('Engineering ML Studio — baseline browser application', () => {
  test('1. main page loads without fatal JavaScript errors', async ({ page }) => {
    const { pageErrors } = instrument(page);
    await page.goto('/?localOnly=1');
    await page.waitForFunction(() => !!(window.LocalRegressionApp && window.LocalRegressionApp.version));
    expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });

  test('2. principal UI container and title are visible', async ({ page }) => {
    await page.goto('/?localOnly=1');
    await page.waitForFunction(() => !!(window.LocalRegressionApp && window.LocalRegressionApp.version));
    await enterProjectMode(page); // Project mode hosts the inherited shell + header.
    await expect(page.locator('main.app-shell')).toBeVisible();
    // Scope to the Project view: the landing page also has an <h1>.
    await expect(page.locator('#view-project h1')).toBeVisible();
    // Baseline Project title is inherited and MUST NOT change in this stage.
    await expect(page.locator('#view-project h1')).toContainText('Local Regression Studio');
  });

  test('3. a bundled example dataset can be loaded', async ({ page }) => {
    await page.goto('/?localOnly=1');
    await page.waitForFunction(() => !!(window.LocalRegressionApp && window.LocalRegressionApp.version));
    await enterProjectMode(page);
    await page.setInputFiles('#csvFile', HOUSE_CSV);
    await expect(page.locator('#datasetSummary')).toContainText(/row|column/i);
    await expect(page.locator('#targetColumn option', { hasText: 'price' })).toHaveCount(1);
  });

  test('4. the workflow can progress to feature and target selection', async ({ page }) => {
    await page.goto('/?localOnly=1');
    await page.waitForFunction(() => !!(window.LocalRegressionApp && window.LocalRegressionApp.version));
    await enterProjectMode(page);
    await page.setInputFiles('#csvFile', HOUSE_CSV);
    await page.selectOption('#targetColumn', 'price');
    await page.click('#autoFeaturesBtn');
    await expect(page.locator('#featureList input[type="checkbox"]:checked').first()).toBeVisible();
    await expect(page.locator('#step-model')).not.toHaveClass(/locked/);
  });

  test('5 & 6. a simple regression model trains and displays result metrics', async ({ page }) => {
    await loadDatasetAndTrain(page);
    // Metric labels present in the baseline results table.
    await expect(page.locator('#metricsTable')).toContainText('R²');
    await expect(page.locator('#metricsTable')).toContainText('RMSE');
    await expect(page.locator('#metricsTable')).toContainText('MAE');
    // A numeric metric value is rendered (not blank / not NaN-only).
    const bodyText = await page.locator('#metricsTable tbody').innerText();
    expect(bodyText).toMatch(/-?\d/);
  });

  test('7. navigation between key workflow stages works (stages unlock in order)', async ({ page }) => {
    await page.goto('/?localOnly=1');
    await page.waitForFunction(() => !!(window.LocalRegressionApp && window.LocalRegressionApp.version));
    await enterProjectMode(page);

    // Downstream stages start locked.
    await expect(page.locator('#step-features')).toHaveClass(/locked/);

    await page.setInputFiles('#csvFile', HOUSE_CSV);
    await expect(page.locator('#step-features')).not.toHaveClass(/locked/);

    await page.selectOption('#targetColumn', 'price');
    await expect(page.locator('#step-preprocess')).not.toHaveClass(/locked/);

    await page.click('#autoFeaturesBtn');
    await expect(page.locator('#step-model')).not.toHaveClass(/locked/);
    await expect(page.locator('#step-split')).not.toHaveClass(/locked/);

    // The diagnostics stage unlocks only after training.
    await page.click('#trainBtn');
    await expect(page.locator('#step-diagnostics')).not.toHaveClass(/locked/);
    await expect(page.locator('#step-predict')).not.toHaveClass(/locked/);
  });

  test('8. no data is sent to an application backend during the workflow', async ({ page }) => {
    const { externalRequests } = await loadDatasetAndTrain(page);
    expect(
      externalRequests,
      `Unexpected non-local requests during the workflow:\n${externalRequests.join('\n')}`
    ).toEqual([]);
  });

  test('9. export controls do not crash the page', async ({ page }) => {
    const { pageErrors } = await loadDatasetAndTrain(page);
    // The download-model control should be present after a successful train.
    const downloadBtn = page.locator('#downloadModelBtn');
    await expect(downloadBtn).toBeVisible();
    // Ensure the workflow so far produced no fatal errors; interacting with the
    // page (a benign click on the results container) must not throw.
    await page.locator('#metricsTableWrap').click({ position: { x: 1, y: 1 } });
    expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
