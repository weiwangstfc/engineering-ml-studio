// Focused unit tests for the inherited ML core.
//
// The runtime modules bind to `window` (e.g. `window.MLCore`) and are loaded by
// the browser bootstrap; they are not importable in Node. Rather than refactor
// the source (out of scope for the baseline), we load the real page and evaluate
// the genuine `window.MLCore` functions inside the browser via `page.evaluate`.
//
// These tests pin down deterministic, seed-driven behaviour so future changes
// can be checked against the current numerical baseline.

const { test, expect } = require('@playwright/test');

// Shared fixture: load the app once per test and expose MLCore readiness.
async function withMLCore(page) {
  await page.goto('/?localOnly=1');
  await page.waitForFunction(() => !!(window.MLCore && window.LocalRegressionApp));
}

test.describe('MLCore — deterministic numerical baseline', () => {
  test('mulberry32 is a deterministic seeded PRNG', async ({ page }) => {
    await withMLCore(page);
    const { a, b, c } = await page.evaluate(() => {
      const draw = seed => { const r = window.MLCore.mulberry32(seed); return [r(), r(), r()]; };
      return { a: draw(42), b: draw(42), c: draw(7) };
    });
    expect(a).toEqual(b);              // same seed -> identical sequence
    expect(a).not.toEqual(c);         // different seed -> different sequence
    a.forEach(v => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); });
  });

  test('metrics: perfect prediction yields r2=1 and zero error', async ({ page }) => {
    await withMLCore(page);
    const m = await page.evaluate(() => {
      const y = [1, 2, 3, 4, 5];
      return window.MLCore.metrics(y, y.slice());
    });
    expect(m.r2).toBeCloseTo(1, 12);
    expect(m.rmse).toBeCloseTo(0, 12);
    expect(m.mae).toBeCloseTo(0, 12);
    expect(m.n).toBe(5);
  });

  test('metrics: known imperfect case matches hand computation', async ({ page }) => {
    await withMLCore(page);
    const m = await page.evaluate(() => {
      // actual [10,20,30,40], predicted off by +2,-2,+2,-2 -> errors all magnitude 2
      return window.MLCore.metrics([10, 20, 30, 40], [12, 18, 32, 38]);
    });
    expect(m.mae).toBeCloseTo(2, 12);
    expect(m.rmse).toBeCloseTo(2, 12);   // all |error| = 2
    expect(m.mse).toBeCloseTo(4, 12);
    // sst = variance*n around mean 25 = (225+25+25+225)=500; sse=16 -> r2=1-16/500
    expect(m.r2).toBeCloseTo(1 - 16 / 500, 12);
  });

  test('metrics: mismatched lengths return NaN guardrail', async ({ page }) => {
    await withMLCore(page);
    const m = await page.evaluate(() => window.MLCore.metrics([1, 2, 3], [1, 2]));
    expect(Number.isNaN(m.r2)).toBe(true);
    expect(m.n).toBe(0);
  });

  test('toNumber: numeric validation and coercion', async ({ page }) => {
    await withMLCore(page);
    const out = await page.evaluate(() => {
      const f = window.MLCore.toNumber;
      return {
        plain: f('42'),
        decimal: f('3.14'),
        thousands: f('1,234.5'),
        parens: f('(5)'),          // accounting negative
        blank: f('   '),
        text: f('abc'),
      };
    });
    expect(out.plain).toBe(42);
    expect(out.decimal).toBeCloseTo(3.14, 12);
    expect(out.thousands).toBeCloseTo(1234.5, 12);
    expect(out.parens).toBe(-5);
    expect(Number.isNaN(out.blank)).toBe(true);
    expect(Number.isNaN(out.text)).toBe(true);
  });

  test('summary statistics helpers (mean/median/variance)', async ({ page }) => {
    await withMLCore(page);
    const s = await page.evaluate(() => {
      const M = window.MLCore;
      return {
        mean: M.mean([2, 4, 6]),
        median: M.median([3, 1, 2]),
        varPop: M.variance([2, 4, 6], false),   // population variance = 8/3
      };
    });
    expect(s.mean).toBeCloseTo(4, 12);
    expect(s.median).toBeCloseTo(2, 12);
    expect(s.varPop).toBeCloseTo(8 / 3, 12);
  });

  test('splitRows: deterministic partition for a fixed seed', async ({ page }) => {
    await withMLCore(page);
    const { first, repeat, sizes } = await page.evaluate(() => {
      const rows = Array.from({ length: 100 }, (_, i) => ({ y: i + 1 }));
      const cfg = { seed: 123, percentages: { training: 60, validation: 20, test: 20 } };
      const toIdx = r => r.map(e => e.index);
      const s1 = window.MLCore.splitRows(rows, 'y', cfg);
      const s2 = window.MLCore.splitRows(rows, 'y', cfg);
      return {
        first: { tr: toIdx(s1.training), va: toIdx(s1.validation), te: toIdx(s1.test) },
        repeat: { tr: toIdx(s2.training), va: toIdx(s2.validation), te: toIdx(s2.test) },
        sizes: { tr: s1.training.length, va: s1.validation.length, te: s1.test.length },
      };
    });
    // Same seed -> identical partition.
    expect(first).toEqual(repeat);
    // Partition is exhaustive and non-overlapping.
    expect(sizes.tr + sizes.va + sizes.te).toBe(100);
    const all = [...first.tr, ...first.va, ...first.te].sort((a, b) => a - b);
    expect(all).toEqual(Array.from({ length: 100 }, (_, i) => i));
    // Roughly the requested proportions.
    expect(sizes.tr).toBeGreaterThan(40);
  });

  test('fitPreprocessor + transformRows: numeric + categorical shape', async ({ page }) => {
    await withMLCore(page);
    const out = await page.evaluate(() => {
      const rows = [
        { size: '10', kind: 'a', target: '1' },
        { size: '20', kind: 'b', target: '2' },
        { size: '30', kind: 'a', target: '3' },
        { size: '40', kind: 'b', target: '4' },
      ];
      const cfg = {
        numericScaling: 'standard', numericMissing: 'mean',
        categoricalEncoding: 'onehot', categoricalMissing: 'mode',
        dropFirstCategory: false, maxCategories: 50,
      };
      const pre = window.MLCore.fitPreprocessor(rows, ['size', 'kind'], cfg, null);
      const t = window.MLCore.transformRows(rows, pre, 'target', true);
      return { rowCount: t.X.length, width: t.X[0].length, y: t.y, dropped: t.dropped.length };
    });
    expect(out.rowCount).toBe(4);
    expect(out.width).toBeGreaterThanOrEqual(2); // one numeric + one-or-more categorical columns
    expect(out.y).toEqual([1, 2, 3, 4]);
    expect(out.dropped).toBe(0);
  });

  test('linear model recovers a clean linear relationship', async ({ page }) => {
    await withMLCore(page);
    const r2 = await page.evaluate(async () => {
      // y = 3*x + 2, exactly linear -> a linear model should fit near-perfectly.
      const X = Array.from({ length: 30 }, (_, i) => [i]);
      const y = X.map(([x]) => 3 * x + 2);
      const model = await window.MLCore.trainModel('linear', X, y, {}, 42, null, null);
      const preds = window.MLCore.predict(model, X);
      return window.MLCore.metrics(y, preds).r2;
    });
    expect(r2).toBeGreaterThan(0.99);
  });
});
