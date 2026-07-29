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

// The neural network is the inherited browser implementation (js/advanced-core.js),
// reached through the same MLCore.trainModel/predict interface as every other model.
// Explore only ever calls it with the presets defined in js/explore.js; these tests
// pin down the deterministic, finite, well-shaped behaviour those presets rely on.
test.describe('Browser neural network — determinism and sanity', () => {
  // A small, standardised synthetic regression problem (as Explore always scales its inputs).
  const setup = () => {
    const N = 80;
    const rng = window.MLCore.mulberry32(1);
    const raw = Array.from({ length: N }, () => { const a = rng() * 4 - 2, b = rng() * 4 - 2; return [a, b]; });
    // A smooth nonlinear target the network can learn.
    const y = raw.map(([a, b]) => 2 * a + a * b - b + 0.5);
    // Standardise both inputs (mean 0, sd 1), matching Explore's preprocessing.
    const cols = [0, 1].map(j => {
      const v = raw.map(r => r[j]); const m = window.MLCore.mean(v);
      const sd = Math.sqrt(window.MLCore.variance(v, false)) || 1; return { m, sd };
    });
    const X = raw.map(r => r.map((val, j) => (val - cols[j].m) / cols[j].sd));
    return { X, y };
  };
  const SMALL = { hidden1: 16, hidden2: 0, hidden3: 0, epochs: 150, learningRate: 0.01,
    activation: 'relu', optimizer: 'adam', batchSize: 32, l2: 0.0005, dropout: 0,
    patience: 25, minDelta: 1e-5, earlyStopping: true, ensembleSize: 1 };

  test('training is deterministic for a fixed seed', async ({ page }) => {
    await withMLCore(page);
    const { a, b } = await page.evaluate(async ([params, mk]) => {
      const gen = new Function('return (' + mk + ')')();
      const { X, y } = gen();
      const run = async () => {
        const model = await window.MLCore.trainModel('ann', X, y, params, 42, null, null);
        return window.MLCore.predict(model, X);
      };
      return { a: await run(), b: await run() };
    }, [SMALL, setup.toString()]);
    expect(a).toEqual(b); // identical seed + inputs -> identical predictions
  });

  test('predictions are finite and correctly shaped', async ({ page }) => {
    await withMLCore(page);
    const out = await page.evaluate(async ([params, mk]) => {
      const gen = new Function('return (' + mk + ')')();
      const { X, y } = gen();
      const model = await window.MLCore.trainModel('ann', X, y, params, 42, null, null);
      const preds = window.MLCore.predict(model, X);
      return {
        len: preds.length, inputLen: X.length,
        allFinite: preds.every(Number.isFinite),
        kind: model.kind,
        historyFinite: (model.trainingHistory || []).every(h => Number.isFinite(h.trainLoss)),
        historyLen: (model.trainingHistory || []).length,
      };
    }, [SMALL, setup.toString()]);
    expect(out.kind).toBe('ann');
    expect(out.len).toBe(out.inputLen);
    expect(out.allFinite).toBe(true);
    expect(out.historyLen).toBeGreaterThan(0);
    expect(out.historyFinite).toBe(true);
  });

  test('the small preset learns a smooth nonlinear relationship', async ({ page }) => {
    await withMLCore(page);
    const r2 = await page.evaluate(async ([params, mk]) => {
      const gen = new Function('return (' + mk + ')')();
      const { X, y } = gen();
      const model = await window.MLCore.trainModel('ann', X, y, params, 42, null, null);
      return window.MLCore.metrics(y, window.MLCore.predict(model, X)).r2;
    }, [SMALL, setup.toString()]);
    // A modest bar: the network should clearly beat predicting the mean (r2 well above 0).
    expect(r2).toBeGreaterThan(0.6);
  });

  test('the medium preset also trains to finite, well-shaped output', async ({ page }) => {
    await withMLCore(page);
    const out = await page.evaluate(async ([params, mk]) => {
      const gen = new Function('return (' + mk + ')')();
      const { X, y } = gen();
      const medium = Object.assign({}, params, { hidden1: 32, hidden2: 16 });
      const model = await window.MLCore.trainModel('ann', X, y, medium, 42, null, null);
      const preds = window.MLCore.predict(model, X);
      return { len: preds.length, allFinite: preds.every(Number.isFinite), params: model.parameterCount };
    }, [SMALL, setup.toString()]);
    expect(out.len).toBe(80);
    expect(out.allFinite).toBe(true);
    expect(out.params).toBeGreaterThan(0);
  });

  test('early stopping can halt before the epoch cap when a validation set is supplied', async ({ page }) => {
    await withMLCore(page);
    const out = await page.evaluate(async ([params, mk]) => {
      const gen = new Function('return (' + mk + ')')();
      const { X, y } = gen();
      // Hand the network an explicit validation split, as Explore does for the ANN.
      const cut = Math.floor(X.length * 0.8);
      const p = Object.assign({}, params, { epochs: 600, _validationX: X.slice(cut), _validationY: y.slice(cut) });
      const model = await window.MLCore.trainModel('ann', X.slice(0, cut), y.slice(0, cut), p, 42, null, null);
      const ran = model.trainingHistory[model.trainingHistory.length - 1].epoch;
      return { ran, cap: 600, bestEpoch: model.bestEpoch };
    }, [SMALL, setup.toString()]);
    // It may or may not stop early, but it must never exceed the configured cap.
    expect(out.ran).toBeLessThanOrEqual(out.cap);
    expect(out.bestEpoch).toBeGreaterThan(0);
  });

  test('the size presets map to the correct architectures', async ({ page }) => {
    await withMLCore(page);
    const out = await page.evaluate(async ([params, mk]) => {
      const gen = new Function('return (' + mk + ')')();
      const { X, y } = gen();
      const small = await window.MLCore.trainModel('ann', X, y, params, 42, null, null);
      const medium = await window.MLCore.trainModel('ann', X, y,
        Object.assign({}, params, { hidden1: 32, hidden2: 16 }), 42, null, null);
      return {
        smallHidden: small.params.hiddenLayers, smallLayers: small.layers.map(l => l.out),
        mediumHidden: medium.params.hiddenLayers, mediumLayers: medium.layers.map(l => l.out),
        inputSize: X[0].length,
      };
    }, [SMALL, setup.toString()]);
    // Small = one hidden layer of 16; Medium = two hidden layers 32 -> 16. Output layer is 1.
    expect(out.smallHidden).toEqual([16]);
    expect(out.smallLayers).toEqual([16, 1]);
    expect(out.mediumHidden).toEqual([32, 16]);
    expect(out.mediumLayers).toEqual([32, 16, 1]);
  });

  test('the network standardises the target internally and predicts back in the original units', async ({ page }) => {
    await withMLCore(page);
    const out = await page.evaluate(async ([params, mk]) => {
      const gen = new Function('return (' + mk + ')')();
      const { X, y } = gen();
      // Shift the target far from zero: if predictions came back standardised (mean ~0)
      // rather than inverse-transformed, this assertion would fail.
      const OFFSET = 1000;
      const yShift = y.map(v => v + OFFSET);
      const model = await window.MLCore.trainModel('ann', X, yShift, params, 42, null, null);
      const preds = window.MLCore.predict(model, X);
      const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
      return { predMean: mean(preds), yMean: mean(yShift), yMeanStat: model.yMean };
    }, [SMALL, setup.toString()]);
    // Predictions live in the target's units (mean near the shifted target mean ~1000), not near 0.
    expect(out.predMean).toBeGreaterThan(900);
    expect(Math.abs(out.predMean - out.yMean)).toBeLessThan(50);
    expect(out.yMeanStat).toBeGreaterThan(900); // yMean captured from the (shifted) training target
  });

  test('training does not mutate the caller\'s input arrays', async ({ page }) => {
    await withMLCore(page);
    const unchanged = await page.evaluate(async ([params, mk]) => {
      const gen = new Function('return (' + mk + ')')();
      const { X, y } = gen();
      const beforeX = JSON.stringify(X), beforeY = JSON.stringify(y);
      await window.MLCore.trainModel('ann', X, y, params, 42, null, null);
      return { xOk: JSON.stringify(X) === beforeX, yOk: JSON.stringify(y) === beforeY };
    }, [SMALL, setup.toString()]);
    expect(unchanged.xOk).toBe(true);
    expect(unchanged.yOk).toBe(true);
  });
});

// Leakage guards for the Explore pipeline: these pin the split/preprocessing
// invariants that keep the neural-network (and every other model's) test score
// honest — no row appears in more than one split, and the input scaler is fitted
// on the TRAINING rows only. They exercise the real MLCore functions that
// js/explore.js runPipeline() composes.
test.describe('Explore pipeline — split & preprocessing leakage guards', () => {
  // A small synthetic dataset: five numeric features plus a numeric target.
  const makeData = () => {
    const N = 200, rng = window.MLCore.mulberry32(3);
    const FEATURES = ['f1', 'f2', 'f3', 'f4', 'f5'], TARGET = 't';
    const headers = FEATURES.concat([TARGET]);
    const rows = Array.from({ length: N }, () => {
      const r = {}; FEATURES.forEach(f => { r[f] = rng() * 100; });
      r[TARGET] = r.f1 * 2 - r.f2 + r.f3 * r.f4 * 0.01 + 5; return r;
    });
    return { rows, headers, FEATURES, TARGET };
  };
  const SPLIT = { seed: 42, percentages: { training: 70, validation: 15, test: 15 } };
  const PREPROCESS = { numericScaling: 'standard', numericMissing: 'mean' };

  test('train / validation / test splits are disjoint and cover every row exactly once', async ({ page }) => {
    await withMLCore(page);
    const out = await page.evaluate(async ([mk, split]) => {
      const gen = new Function('return (' + mk + ')')();
      const { rows, TARGET } = gen();
      const s = window.MLCore.splitRows(rows, TARGET, split);
      const idx = grp => grp.map(e => e.index);
      const tr = idx(s.training), va = idx(s.validation || []), te = idx(s.test);
      const inter = (a, b) => a.filter(i => new Set(b).has(i)).length;
      const union = new Set([...tr, ...va, ...te]);
      return {
        counts: { tr: tr.length, va: va.length, te: te.length }, total: rows.length,
        uniqueTr: new Set(tr).size, uniqueVa: new Set(va).size, uniqueTe: new Set(te).size,
        overlapTrVa: inter(tr, va), overlapTrTe: inter(tr, te), overlapVaTe: inter(va, te),
        unionSize: union.size,
      };
    }, [makeData.toString(), SPLIT]);
    // No index repeated within a split.
    expect(out.uniqueTr).toBe(out.counts.tr);
    expect(out.uniqueVa).toBe(out.counts.va);
    expect(out.uniqueTe).toBe(out.counts.te);
    // No index shared across splits.
    expect(out.overlapTrVa).toBe(0);
    expect(out.overlapTrTe).toBe(0);
    expect(out.overlapVaTe).toBe(0);
    // Every row is used exactly once.
    expect(out.counts.tr + out.counts.va + out.counts.te).toBe(out.total);
    expect(out.unionSize).toBe(out.total);
    // Proportions are ~70/15/15.
    expect(out.counts.tr).toBe(140);
    expect(out.counts.va).toBe(30);
    expect(out.counts.te).toBe(30);
  });

  test('the input scaler is fitted on the training rows only (no test/val leakage)', async ({ page }) => {
    await withMLCore(page);
    const out = await page.evaluate(async ([mk, split, pre]) => {
      const gen = new Function('return (' + mk + ')')();
      const { rows, headers, FEATURES, TARGET } = gen();
      const profiles = window.MLCore.inferColumns(rows, headers);
      const s = window.MLCore.splitRows(rows, TARGET, split);
      const rawTrain = s.training.map(e => e.row);
      const p = window.MLCore.fitPreprocessor(rawTrain, FEATURES, pre, profiles);
      const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
      const f = 'f1';
      const trainMean = mean(rawTrain.map(r => Number(r[f])));
      const fullMean = mean(rows.map(r => Number(r[f])));
      const feat = p.features.find(ff => ff.name === f || ff.source === f);
      return { fitted: feat ? feat.mean : null, trainMean, fullMean,
        targetInOutputs: p.outputNames.indexOf(TARGET) !== -1 };
    }, [makeData.toString(), SPLIT, PREPROCESS]);
    // The scaler statistic equals the TRAINING mean, and differs from the full-dataset mean.
    expect(out.fitted).toBeCloseTo(out.trainMean, 6);
    expect(Math.abs(out.fitted - out.fullMean)).toBeGreaterThan(1e-6);
    // The target column is never emitted as a model input.
    expect(out.targetInOutputs).toBe(false);
  });
});
