// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 UK Research and Innovation (UKRI)
//
// WORKPLAN C1: real-data import hardening. Each deliberately awkward CSV in
// tests/fixtures/awkward must produce a specific, actionable message at upload, and
// the bundled example datasets must produce none (no false alarms). Several of these
// files previously loaded silently and wrongly — decimal commas were read as
// thousands separators, so "4,9" became 49.

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const FIXTURES = path.join(__dirname, 'fixtures', 'awkward');

// fixture -> [severity, title fragment, column or null]
const EXPECTED = {
  'decimal_comma.csv': ['critical', 'decimal comma', 'pressure_drop_kpa'],
  'semicolon_decimal_comma.csv': ['critical', 'decimal comma', 'length_m'],
  'units_in_cells.csv': ['critical', 'Units written inside the values', 'pressure_drop'],
  'mostly_text_numbers.csv': ['critical', 'Mostly numbers, read as text', 'pressure_drop_kpa'],
  'no_header.csv': ['critical', 'first row looks like data', null],
  'mixed_text_in_numbers.csv': ['warning', 'Text in a numeric column', 'pressure_drop_kpa'],
  'missing_codes.csv': ['warning', 'missing” code', 'length_m'],
  'dates.csv': ['warning', 'Dates or times', 'test_date'],
  'thousands_separators.csv': ['info', 'Thousands separators', 'reynolds_number']
};

async function openProject(page) {
  await page.goto('/?localOnly=1');
  await page.waitForFunction(() => !!(window.LocalRegressionApp && window.LocalRegressionApp.version && window.EMSFileCheck));
  await page.locator('.top-nav [data-nav="project"]').click();
  await page.waitForFunction(() => !!window.EMSProjectShell);
}

test.describe('File check after upload (WORKPLAN C1)', () => {
  test('each awkward file gets a specific message with what was found, its effect and the fix', async ({ page }) => {
    await openProject(page);
    for (const [file, [severity, title, column]] of Object.entries(EXPECTED)) {
      await page.setInputFiles('#csvFile', path.join(FIXTURES, file));
      const check = page.locator('#fileCheck');
      await expect(check, file).toBeVisible();
      let item = check.locator(`.file-check-item[data-severity="${severity}"]`).filter({ hasText: title });
      if (column) item = item.filter({ hasText: `column “${column}”` });
      item = item.first();
      await expect(item, file).toBeVisible();
      for (const part of ['Found:', 'Effect:', 'How to fix:']) await expect(item, file).toContainText(part);
    }
  });

  test('decimal commas show what each value was wrongly read as', async ({ page }) => {
    await openProject(page);
    await page.setInputFiles('#csvFile', path.join(FIXTURES, 'decimal_comma.csv'));
    const item = page.locator('#fileCheck .file-check-item[data-severity="critical"]', { hasText: 'length_m' });
    await expect(item).toContainText('→ read as');
    // The parser itself is unchanged (saved models depend on it): "4,9" is still read as 49.
    expect(await page.evaluate(() => window.MLCore.toNumber('4,9'))).toBe(49);
  });

  test('clean files, including every bundled dataset, raise no layout problems', async ({ page }) => {
    await openProject(page);
    const files = fs.readdirSync(path.join(ROOT, 'examples')).filter(f => f.endsWith('.csv'))
      .map(f => path.join(ROOT, 'examples', f)).concat([path.join(FIXTURES, 'blank_rows.csv')]);
    for (const file of files) {
      await page.setInputFiles('#csvFile', file);
      await expect(page.locator('#fileCheck'), path.basename(file)).toBeVisible();
      // No layout problem in any bundled file. Size notes (info) are allowed: the full
      // 24,579-row CHF dataset rightly gets the Gaussian-process subset note.
      await expect(page.locator('#fileCheck .file-check-item:not([data-severity="info"])'), path.basename(file)).toHaveCount(0);
      if (path.basename(file) === 'chf_full.csv') {
        await expect(page.locator('#fileCheck .file-check-item[data-severity="info"]', { hasText: 'subset option' })).toBeVisible();
      }
    }
  });

  test('a failed upload explains how to fix it, and no stale check is left on screen', async ({ page }) => {
    await openProject(page);
    await page.setInputFiles('#csvFile', path.join(FIXTURES, 'decimal_comma.csv'));
    await expect(page.locator('#fileCheck')).toBeVisible();
    await page.setInputFiles('#csvFile', path.join(FIXTURES, 'duplicate_columns.csv'));
    await expect(page.locator('#alertRegion')).toContainText('rename one of each duplicated pair');
    await expect(page.locator('#fileCheck')).toBeHidden();
  });

  test('large files are warned about model limits at upload, not at training', async ({ page }) => {
    await openProject(page);
    const lines = ['a,b,y'];
    // The limits apply to training rows (60% by default): 2,500 rows is about 1,500 training rows,
    // within exact GP's 2,000, so no finding; 4,000 rows is about 2,400, so the subset option is named.
    for (let i = 0; i < 2500; i++) lines.push(`${i % 13},${(i * 7) % 11},${i % 17}`);
    await page.setInputFiles('#csvFile', { name: 'rows2500.csv', mimeType: 'text/csv', buffer: Buffer.from(lines.join('\n')) });
    await expect(page.locator('#fileCheck .file-check-ok')).toBeVisible();
    for (let i = 2500; i < 4000; i++) lines.push(`${i % 13},${(i * 7) % 11},${i % 17}`);
    await page.setInputFiles('#csvFile', { name: 'rows4000.csv', mimeType: 'text/csv', buffer: Buffer.from(lines.join('\n')) });
    const item = page.locator('#fileCheck .file-check-item', { hasText: 'subset option' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('about 2,400 training rows');
    await expect(item).toContainText('representative subset');
  });
});
