(function (global) {
  'use strict';

  const EPS = 1e-12;

  function mulberry32(seed) {
    let a = (Number(seed) || 0) >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function shuffle(values, rng) {
    const out = values.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function toNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (value == null) return NaN;
    const s = String(value).trim();
    if (!s) return NaN;
    const cleaned = s.replace(/,/g, '').replace(/^\((.*)\)$/, '-$1');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function isMissing(value) {
    return value == null || String(value).trim() === '' || /^(na|n\/a|null|none|nan)$/i.test(String(value).trim());
  }

  function mean(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }
  function median(values) {
    if (!values.length) return 0;
    const a = values.slice().sort((x, y) => x - y);
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }
  function mode(values) {
    const counts = new Map(); let best = '', bestCount = -1;
    for (const value of values) {
      const key = String(value), count = (counts.get(key) || 0) + 1;
      counts.set(key, count);
      if (count > bestCount) { best = key; bestCount = count; }
    }
    return best;
  }
  function variance(values, sample) {
    if (values.length < (sample ? 2 : 1)) return 0;
    const m = mean(values), denom = sample ? values.length - 1 : values.length;
    return values.reduce((s, v) => s + (v - m) ** 2, 0) / denom;
  }
  function quantile(values, q) {
    if (!values.length) return NaN;
    const a = values.slice().sort((x, y) => x - y);
    const pos = Math.max(0, Math.min(1, q)) * (a.length - 1);
    const lo = Math.floor(pos), hi = Math.ceil(pos), f = pos - lo;
    return a[lo] * (1 - f) + a[hi] * f;
  }

  function inverseNormal(p) {
    if (p <= 0 || p >= 1) return p === 0 ? -Infinity : p === 1 ? Infinity : NaN;
    const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
    const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
    const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
    const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
    const plow = 0.02425, phigh = 1 - plow;
    let q, r;
    if (p < plow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p > phigh) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  function inferColumns(rows, headers) {
    const sample = rows.slice(0, Math.min(rows.length, 5000));
    const profiles = {};
    for (const h of headers) {
      let nonMissing = 0, numeric = 0; const unique = new Set();
      for (const row of sample) {
        const v = row[h]; if (isMissing(v)) continue;
        nonMissing++; if (Number.isFinite(toNumber(v))) numeric++;
        if (unique.size <= 1000) unique.add(String(v));
      }
      const numericRatio = nonMissing ? numeric / nonMissing : 0;
      const uniqueRatio = nonMissing ? unique.size / nonMissing : 0;
      profiles[h] = {
        type: numericRatio >= 0.9 ? 'numeric' : 'categorical', nonMissing,
        missing: sample.length - nonMissing, unique: unique.size, uniqueRatio, numericRatio,
        idLike: /(^|_)(id|index|key|uuid)($|_)/i.test(h) || (uniqueRatio > 0.97 && nonMissing > 20)
      };
    }
    return profiles;
  }

  function autoSelectFeatures(headers, target, profiles) {
    return headers.filter(h => h !== target && !(profiles[h] && profiles[h].idLike));
  }

  function fitPreprocessor(rows, featureColumns, config, profiles) {
    const features = [], outputNames = [], maxCategories = Math.max(2, Number(config.maxCategories) || 50);
    for (const name of featureColumns) {
      const inferred = profiles && profiles[name] ? profiles[name].type : inferColumns(rows, [name])[name].type;
      if (inferred === 'categorical' && config.categoricalEncoding === 'exclude') continue;
      if (inferred === 'numeric') {
        const values = rows.map(r => toNumber(r[name])).filter(Number.isFinite);
        const fill = config.numericMissing === 'median' ? median(values) : config.numericMissing === 'zero' ? 0 : mean(values);
        const min = values.length ? Math.min(...values) : 0, max = values.length ? Math.max(...values) : 0;
        const mu = mean(values), sd = Math.sqrt(variance(values)) || 1;
        features.push({ name, type: 'numeric', fill, min, max, mean: mu, sd, scaling: config.numericScaling, missing: config.numericMissing });
        outputNames.push(name);
      } else {
        const present = rows.map(r => isMissing(r[name]) ? null : String(r[name])).filter(v => v != null);
        const fill = config.categoricalMissing === 'mode' ? mode(present) : '__MISSING__';
        const counts = new Map(); for (const v of present) counts.set(v, (counts.get(v) || 0) + 1);
        let categories = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(x => x[0]);
        const hasOther = categories.length > maxCategories; categories = categories.slice(0, maxCategories);
        if (hasOther) categories.push('__OTHER__');
        if (!categories.includes(fill) && fill === '__MISSING__') categories.push(fill);
        if (!categories.length) categories = [fill || '__MISSING__'];
        const encoding = config.categoricalEncoding;
        const baseline = encoding === 'onehot' && config.dropFirstCategory ? categories[0] : null;
        features.push({ name, type: 'categorical', fill, categories, encoding, baseline, missing: config.categoricalMissing });
        if (encoding === 'ordinal') outputNames.push(name);
        else for (const cat of categories) if (cat !== baseline) outputNames.push(`${name}=${cat}`);
      }
    }
    return { schemaVersion: 2, config: { ...config }, inputFeatures: featureColumns.slice(), features, outputNames };
  }

  function transformRows(rows, preprocessor, targetColumn, requireTarget) {
    const X = [], y = [], rowIndices = [], dropped = [], warnings = [];
    const unseen = new Map();
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]; let target = NaN;
      if (targetColumn) {
        target = toNumber(row[targetColumn]);
        if (requireTarget && !Number.isFinite(target)) { dropped.push(index); continue; }
      }
      const vector = []; let invalid = false;
      for (const f of preprocessor.features) {
        if (f.type === 'numeric') {
          let value = toNumber(row[f.name]);
          if (!Number.isFinite(value)) {
            if (f.missing === 'drop') { invalid = true; break; }
            value = f.fill;
          }
          if (f.scaling === 'standard') value = (value - f.mean) / f.sd;
          else if (f.scaling === 'minmax') value = Math.abs(f.max - f.min) < EPS ? 0 : (value - f.min) / (f.max - f.min);
          vector.push(value);
        } else {
          let value = isMissing(row[f.name]) ? null : String(row[f.name]);
          if (value == null) {
            if (f.missing === 'drop') { invalid = true; break; }
            value = f.fill;
          }
          if (!f.categories.includes(value)) {
            unseen.set(f.name, (unseen.get(f.name) || 0) + 1);
            value = f.categories.includes('__OTHER__') ? '__OTHER__' : '__UNSEEN__';
          }
          if (f.encoding === 'ordinal') {
            const idx = f.categories.indexOf(value); vector.push(idx < 0 ? -1 : idx);
          } else {
            for (const cat of f.categories) if (cat !== f.baseline) vector.push(value === cat ? 1 : 0);
          }
        }
      }
      if (invalid || vector.some(v => !Number.isFinite(v))) { dropped.push(index); continue; }
      X.push(vector); if (targetColumn && Number.isFinite(target)) y.push(target); rowIndices.push(index);
    }
    for (const [name, count] of unseen.entries()) warnings.push(`${count} rows contained unseen categories in ${name}.`);
    return { X, y, rowIndices, dropped, warnings };
  }

  function targetForwardOne(x, spec) {
    const l = Number(spec.lambda);
    if (spec.type === 'none') return x;
    if (spec.type === 'log') return Math.log(x);
    if (spec.type === 'log10') return Math.log10(x);
    if (spec.type === 'sqrt') return Math.sqrt(x);
    if (spec.type === 'boxcox') return Math.abs(l) < 1e-8 ? Math.log(x) : (Math.pow(x, l) - 1) / l;
    if (spec.type === 'yeojohnson') {
      if (x >= 0) return Math.abs(l) < 1e-8 ? Math.log1p(x) : (Math.pow(x + 1, l) - 1) / l;
      return Math.abs(l - 2) < 1e-8 ? -Math.log1p(-x) : -(Math.pow(1 - x, 2 - l) - 1) / (2 - l);
    }
    return x;
  }

  function targetInverseOne(z, spec) {
    const l = Number(spec.lambda); let value;
    if (spec.type === 'none') value = z;
    else if (spec.type === 'log') value = Math.exp(z);
    else if (spec.type === 'log10') value = Math.pow(10, z);
    else if (spec.type === 'sqrt') value = Math.max(0, z) ** 2;
    else if (spec.type === 'boxcox') value = Math.abs(l) < 1e-8 ? Math.exp(z) : Math.pow(Math.max(EPS, l * z + 1), 1 / l);
    else if (spec.type === 'yeojohnson') {
      if (z >= 0) value = Math.abs(l) < 1e-8 ? Math.expm1(z) : Math.pow(Math.max(EPS, l * z + 1), 1 / l) - 1;
      else value = Math.abs(l - 2) < 1e-8 ? 1 - Math.exp(-z) : 1 - Math.pow(Math.max(EPS, 1 - (2 - l) * z), 1 / (2 - l));
    } else value = z;
    return value;
  }

  function transformationLogLikelihood(values, type, lambda) {
    const spec = { type, lambda }, transformed = values.map(v => targetForwardOne(v, spec));
    const v = variance(transformed); if (!(v > 0) || !Number.isFinite(v)) return -Infinity;
    let jacobian = 0;
    if (type === 'boxcox') jacobian = (lambda - 1) * values.reduce((s, x) => s + Math.log(x), 0);
    if (type === 'yeojohnson') {
      for (const x of values) jacobian += x >= 0 ? (lambda - 1) * Math.log1p(x) : (1 - lambda) * Math.log1p(-x);
    }
    return -0.5 * values.length * Math.log(v) + jacobian;
  }

  function estimateLambda(values, type) {
    let best = { lambda: 1, score: -Infinity };
    for (let l = -2; l <= 2.0001; l += 0.1) {
      const score = transformationLogLikelihood(values, type, l);
      if (score > best.score) best = { lambda: Number(l.toFixed(4)), score };
    }
    const start = best.lambda - 0.12, end = best.lambda + 0.12;
    for (let l = start; l <= end + 1e-9; l += 0.01) {
      const score = transformationLogLikelihood(values, type, l);
      if (score > best.score) best = { lambda: Number(l.toFixed(4)), score };
    }
    return best.lambda;
  }

  function fitTargetTransform(values, type) {
    const clean = values.map(Number).filter(Number.isFinite);
    if (!clean.length) throw new Error('No valid target values are available.');
    if ((type === 'log' || type === 'log10' || type === 'boxcox') && clean.some(v => v <= 0)) throw new Error(`${type === 'boxcox' ? 'Box–Cox' : 'Logarithmic'} target transformation requires all training target values to be greater than zero.`);
    if (type === 'sqrt' && clean.some(v => v < 0)) throw new Error('Square-root target transformation requires all training target values to be zero or greater.');
    const lambda = type === 'boxcox' || type === 'yeojohnson' ? estimateLambda(clean, type) : null;
    return { type, lambda, smearingFactor: 1, fittedOn: clean.length };
  }

  function applyTargetTransform(values, spec) { return values.map(v => targetForwardOne(v, spec)); }
  function inverseTargetTransform(values, spec, applySmearing) {
    return values.map(v => {
      let x = targetInverseOne(v, spec);
      if (applySmearing && (spec.type === 'log' || spec.type === 'log10')) x *= Number(spec.smearingFactor) || 1;
      return x;
    });
  }
  function fitSmearing(spec, actualTransformed, predictedTransformed) {
    if (spec.type === 'log') spec.smearingFactor = mean(actualTransformed.map((v, i) => Math.exp(v - predictedTransformed[i])));
    else if (spec.type === 'log10') spec.smearingFactor = mean(actualTransformed.map((v, i) => Math.pow(10, v - predictedTransformed[i])));
    else spec.smearingFactor = 1;
    if (!Number.isFinite(spec.smearingFactor) || spec.smearingFactor <= 0) spec.smearingFactor = 1;
    return spec;
  }

  function allocateCounts(n, trainPct, validationPct, testPct) {
    if (n < 3) throw new Error('At least three usable rows are required for training, validation and test sets.');
    const total = Number(trainPct) + Number(validationPct) + Number(testPct);
    if (Math.abs(total - 100) > 0.01) throw new Error('Training, validation and test percentages must sum to 100%.');
    let validation = Math.max(1, Math.round(n * validationPct / 100));
    let test = Math.max(1, Math.round(n * testPct / 100));
    let training = n - validation - test;
    while (training < 1 && (validation > 1 || test > 1)) {
      if (validation >= test && validation > 1) validation--; else if (test > 1) test--;
      training = n - validation - test;
    }
    if (training < 1) throw new Error('The selected split leaves no training rows.');
    return { training, validation, test };
  }

  function splitShuffled(entries, percentages, rng) {
    const a = shuffle(entries, rng), c = allocateCounts(a.length, percentages.training, percentages.validation, percentages.test);
    return { training: a.slice(0, c.training), validation: a.slice(c.training, c.training + c.validation), test: a.slice(c.training + c.validation) };
  }

  function splitRows(rows, targetColumn, config) {
    const entries = rows.map((row, index) => ({ row, index })).filter(e => Number.isFinite(toNumber(e.row[targetColumn])));
    if (entries.length < 3) throw new Error('At least three rows with numeric target values are required.');
    const seed = Number(config.seed) || 42, rng = mulberry32(seed);
    const percentages = config.percentages || { training: 60, validation: 20, test: 20 };
    let result;
    if (config.strategy === 'source') {
      const column = config.sourceColumn; if (!column) throw new Error('Choose a source column.');
      const valSet = new Set((config.validationValues || []).map(String)), testSet = new Set((config.testValues || []).map(String));
      for (const value of valSet) if (testSet.has(value)) throw new Error(`Source “${value}” cannot be assigned to both validation and test.`);
      result = { training: [], validation: [], test: [] };
      for (const e of entries) {
        const value = String(e.row[column]);
        if (valSet.has(value)) result.validation.push(e); else if (testSet.has(value)) result.test.push(e); else result.training.push(e);
      }
    } else if (config.strategy === 'regime') {
      const column = config.regimeColumn; if (!column) throw new Error('Choose a regime column.');
      if (config.regimeMode === 'heldout') {
        const valSet = new Set((config.validationValues || []).map(String)), testSet = new Set((config.testValues || []).map(String));
        for (const value of valSet) if (testSet.has(value)) throw new Error(`Regime “${value}” cannot be assigned to both validation and test.`);
        result = { training: [], validation: [], test: [] };
        for (const e of entries) {
          const value = String(e.row[column]);
          if (valSet.has(value)) result.validation.push(e); else if (testSet.has(value)) result.test.push(e); else result.training.push(e);
        }
      } else {
        result = { training: [], validation: [], test: [] };
        const groups = new Map();
        for (const e of entries) { const k = String(e.row[column]); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); }
        let offset = 0;
        for (const group of groups.values()) {
          if (group.length < 3) { result.training.push(...group); continue; }
          const s = splitShuffled(group, percentages, mulberry32(seed + offset * 101));
          result.training.push(...s.training); result.validation.push(...s.validation); result.test.push(...s.test); offset++;
        }
        result.training = shuffle(result.training, rng); result.validation = shuffle(result.validation, rng); result.test = shuffle(result.test, rng);
      }
    } else if (config.strategy === 'time') {
      const column = config.timeColumn; if (!column) throw new Error('Choose a time or sequence column.');
      const direction = config.timeDirection === 'descending' ? -1 : 1;
      const sorted = entries.slice().sort((a, b) => {
        const avRaw = a.row[column], bvRaw = b.row[column];
        const an = toNumber(avRaw), bn = toNumber(bvRaw);
        const av = Number.isFinite(an) ? an : Date.parse(avRaw), bv = Number.isFinite(bn) ? bn : Date.parse(bvRaw);
        if (!Number.isFinite(av) || !Number.isFinite(bv)) return String(avRaw).localeCompare(String(bvRaw)) * direction;
        return (av - bv) * direction;
      });
      const c = allocateCounts(sorted.length, percentages.training, percentages.validation, percentages.test);
      result = { training: sorted.slice(0, c.training), validation: sorted.slice(c.training, c.training + c.validation), test: sorted.slice(c.training + c.validation) };
    } else {
      result = splitShuffled(entries, percentages, rng);
    }
    if (!result.training.length || !result.validation.length || !result.test.length) throw new Error('Each split must contain at least one row. Adjust the percentages or group assignments.');
    return result;
  }

  function subset(array, indices) { return indices.map(i => array[i]); }

  function solveLinearSystem(A, b) {
    const n = A.length, M = A.map((row, i) => row.slice().concat(b[i]));
    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let row = col + 1; row < n; row++) if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
      if (Math.abs(M[pivot][col]) < 1e-10) M[pivot][col] += 1e-8;
      [M[col], M[pivot]] = [M[pivot], M[col]];
      const div = M[col][col] || 1e-10;
      for (let j = col; j <= n; j++) M[col][j] /= div;
      for (let row = 0; row < n; row++) {
        if (row === col) continue; const factor = M[row][col]; if (Math.abs(factor) < EPS) continue;
        for (let j = col; j <= n; j++) M[row][j] -= factor * M[col][j];
      }
    }
    return M.map(row => row[n]);
  }

  function invertMatrix(A) {
    const n = A.length, M = A.map((row, i) => row.slice().concat(Array.from({ length: n }, (_, j) => i === j ? 1 : 0)));
    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let row = col + 1; row < n; row++) if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
      if (Math.abs(M[pivot][col]) < 1e-10) M[pivot][col] += 1e-8;
      [M[col], M[pivot]] = [M[pivot], M[col]];
      const div = M[col][col] || 1e-10;
      for (let j = 0; j < 2 * n; j++) M[col][j] /= div;
      for (let row = 0; row < n; row++) {
        if (row === col) continue; const factor = M[row][col];
        for (let j = 0; j < 2 * n; j++) M[row][j] -= factor * M[col][j];
      }
    }
    return M.map(row => row.slice(n));
  }

  function trainLinear(X, y, lambda) {
    if (!X.length) throw new Error('No training rows remain after preprocessing.');
    const p = X[0].length + 1;
    if (p > 301) throw new Error(`Processed feature count is ${p - 1}; this version supports at most 300.`);
    const xtxRaw = Array.from({ length: p }, () => Array(p).fill(0)), xty = Array(p).fill(0);
    for (let i = 0; i < X.length; i++) {
      const row = [1].concat(X[i]);
      for (let a = 0; a < p; a++) {
        xty[a] += row[a] * y[i];
        for (let b = a; b < p; b++) xtxRaw[a][b] += row[a] * row[b];
      }
    }
    for (let a = 0; a < p; a++) for (let b = 0; b < a; b++) xtxRaw[a][b] = xtxRaw[b][a];
    const xtx = xtxRaw.map(row => row.slice());
    for (let a = 0; a < p; a++) xtx[a][a] += a > 0 ? lambda : 1e-10;
    const coefficients = solveLinearSystem(xtx, xty), model = { kind: lambda > 0 ? 'ridge' : 'linear', lambda, intercept: coefficients[0], coefficients: coefficients.slice(1) };
    const predictions = predictLinear(model, X), sse = y.reduce((s, v, i) => s + (v - predictions[i]) ** 2, 0);
    model.residualVariance = sse / Math.max(1, X.length - p);
    model.degreesOfFreedom = Math.max(1, X.length - p);
    model.xtxInverse = invertMatrix(xtx);
    return model;
  }

  function predictLinear(model, X) { return X.map(row => model.intercept + row.reduce((s, v, i) => s + v * model.coefficients[i], 0)); }
  function sseFromStats(n, sum, sumSq) { return n <= 0 ? 0 : Math.max(0, sumSq - (sum * sum) / n); }

  function trainTree(X, y, params, rng, bootstrapIndices) {
    const nFeatures = X[0].length, gains = Array(nFeatures).fill(0);
    const maxDepth = Math.max(1, Number(params.maxDepth) || 8), minLeaf = Math.max(2, Number(params.minLeaf) || 5), maxThresholds = Math.max(4, Number(params.maxThresholds) || 24);
    const maxFeatures = params.maxFeatures === 'sqrt' ? Math.max(1, Math.floor(Math.sqrt(nFeatures))) : params.maxFeatures === 'log2' ? Math.max(1, Math.floor(Math.log2(nFeatures) + 1)) : Math.max(1, Math.min(nFeatures, Number(params.maxFeatures) || nFeatures));
    const indices = bootstrapIndices || Array.from({ length: X.length }, (_, i) => i);
    function leaf(nodeIndices, sum, sumSq) {
      const value = sum / nodeIndices.length, sd = Math.sqrt(sseFromStats(nodeIndices.length, sum, sumSq) / Math.max(1, nodeIndices.length - 1));
      return { leaf: true, value, n: nodeIndices.length, sd: Number.isFinite(sd) ? sd : 0 };
    }
    function build(nodeIndices, depth) {
      let sum = 0, sumSq = 0; for (const i of nodeIndices) { sum += y[i]; sumSq += y[i] * y[i]; }
      const parentSSE = sseFromStats(nodeIndices.length, sum, sumSq);
      if (depth >= maxDepth || nodeIndices.length < minLeaf * 2 || parentSSE < 1e-10) return leaf(nodeIndices, sum, sumSq);
      const allFeatures = shuffle(Array.from({ length: nFeatures }, (_, i) => i), rng).slice(0, maxFeatures); let best = null;
      for (const f of allFeatures) {
        const pairs = nodeIndices.map(i => [X[i][f], y[i], i]).sort((a, b) => a[0] - b[0]);
        let leftN = 0, leftSum = 0, leftSq = 0; const totalN = pairs.length, totalSum = sum, totalSq = sumSq, stride = Math.max(1, Math.floor(totalN / maxThresholds));
        for (let j = 0; j < pairs.length - 1; j++) {
          const yy = pairs[j][1]; leftN++; leftSum += yy; leftSq += yy * yy; const rightN = totalN - leftN;
          if (leftN < minLeaf || rightN < minLeaf || pairs[j][0] === pairs[j + 1][0]) continue;
          if (j % stride !== 0 && j !== pairs.length - minLeaf - 1) continue;
          const rightSum = totalSum - leftSum, rightSq = totalSq - leftSq;
          const gain = parentSSE - (sseFromStats(leftN, leftSum, leftSq) + sseFromStats(rightN, rightSum, rightSq));
          if (!best || gain > best.gain) best = { f, threshold: (pairs[j][0] + pairs[j + 1][0]) / 2, gain };
        }
      }
      if (!best || best.gain <= 1e-10) return leaf(nodeIndices, sum, sumSq);
      const left = [], right = []; for (const i of nodeIndices) (X[i][best.f] <= best.threshold ? left : right).push(i);
      if (left.length < minLeaf || right.length < minLeaf) return leaf(nodeIndices, sum, sumSq);
      gains[best.f] += best.gain;
      return { leaf: false, value: sum / nodeIndices.length, n: nodeIndices.length, feature: best.f, threshold: best.threshold, gain: best.gain, left: build(left, depth + 1), right: build(right, depth + 1) };
    }
    return { kind: 'tree', root: build(indices, 0), params: { maxDepth, minLeaf, maxThresholds, maxFeatures }, gains };
  }

  function predictTreeLeaf(node, row) { while (!node.leaf) node = row[node.feature] <= node.threshold ? node.left : node.right; return node; }
  function predictTree(model, X) { return X.map(row => predictTreeLeaf(model.root, row).value); }

  async function trainForest(X, y, params, seed, progress, cancelCheck) {
    const rng = mulberry32(seed), nTrees = Math.max(5, Math.min(160, Number(params.nTrees) || 30)), sampleRate = Math.max(.3, Math.min(1, Number(params.sampleRate) || .8)), maxRowsPerTree = Math.max(1000, Number(params.maxRowsPerTree) || 20000);
    const trees = [], gains = Array(X[0].length).fill(0), sampleN = Math.min(maxRowsPerTree, Math.max(10, Math.round(X.length * sampleRate)));
    for (let t = 0; t < nTrees; t++) {
      if (cancelCheck && cancelCheck()) throw new Error('Training cancelled.');
      const indices = Array.from({ length: sampleN }, () => Math.floor(rng() * X.length));
      const tree = trainTree(X, y, { ...params, maxFeatures: params.maxFeatures || 'all' }, rng, indices);
      trees.push(tree); tree.gains.forEach((g, i) => { gains[i] += g; });
      if (progress) progress((t + 1) / nTrees, `Training forest tree ${t + 1} of ${nTrees}`);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return { kind: 'forest', trees, params: { ...params, nTrees, sampleRate, maxRowsPerTree }, gains };
  }
  function predictForest(model, X) { return X.map(row => model.trees.reduce((s, tree) => s + predictTreeLeaf(tree.root, row).value, 0) / model.trees.length); }

  async function trainModel(modelType, X, y, params, seed, progress, cancelCheck) {
    if (!X.length || !X[0].length) throw new Error('No usable features remain after preprocessing.');
    if (modelType === 'linear') return trainLinear(X, y, 0);
    if (modelType === 'ridge') return trainLinear(X, y, Math.max(0, Number(params.lambda) || 1));
    if (modelType === 'tree') return trainTree(X, y, params, mulberry32(seed));
    if (modelType === 'forest') return trainForest(X, y, params, seed, progress, cancelCheck);
    throw new Error(`Unsupported model type: ${modelType}`);
  }
  function predict(model, X) {
    if (model.kind === 'linear' || model.kind === 'ridge') return predictLinear(model, X);
    if (model.kind === 'tree') return predictTree(model, X);
    if (model.kind === 'forest') return predictForest(model, X);
    throw new Error(`Unsupported fitted model kind: ${model.kind}`);
  }

  async function attachBootstrapUncertainty(model, X, y, samples, seed, progress, cancelCheck) {
    if (model.kind !== 'ridge') return model;
    const rng = mulberry32(seed + 4501), count = Math.max(10, Math.min(100, Number(samples) || 30)), models = [];
    for (let b = 0; b < count; b++) {
      if (cancelCheck && cancelCheck()) throw new Error('Training cancelled.');
      const idx = Array.from({ length: X.length }, () => Math.floor(rng() * X.length));
      models.push(trainLinear(subset(X, idx), subset(y, idx), model.lambda));
      if (progress) progress((b + 1) / count, `Bootstrap uncertainty model ${b + 1} of ${count}`);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    model.bootstrapModels = models.map(m => ({ kind: 'ridge', lambda: m.lambda, intercept: m.intercept, coefficients: m.coefficients }));
    return model;
  }

  function rowQuadratic(row, matrix) {
    let s = 0; for (let i = 0; i < row.length; i++) for (let j = 0; j < row.length; j++) s += row[i] * matrix[i][j] * row[j]; return s;
  }

  function predictWithIntervals(model, X, level) {
    const prediction = predict(model, X), alpha = 1 - Number(level || .95), lowerQ = alpha / 2, upperQ = 1 - alpha / 2, z = inverseNormal(upperQ);
    let lower = null, upper = null, method = 'Unavailable', note = '';
    if (model.kind === 'linear' && model.xtxInverse && Number.isFinite(model.residualVariance)) {
      lower = []; upper = [];
      for (let i = 0; i < X.length; i++) {
        const aug = [1].concat(X[i]), se = Math.sqrt(Math.max(0, model.residualVariance * (1 + rowQuadratic(aug, model.xtxInverse))));
        lower.push(prediction[i] - z * se); upper.push(prediction[i] + z * se);
      }
      method = 'Analytical linear-regression prediction interval';
    } else if (model.kind === 'ridge' && model.bootstrapModels && model.bootstrapModels.length) {
      lower = []; upper = [];
      const residualMargin = z * Math.sqrt(Math.max(0, Number(model.residualVariance) || 0));
      for (let i = 0; i < X.length; i++) {
        const values = model.bootstrapModels.map(m => predictLinear(m, [X[i]])[0]);
        lower.push(quantile(values, lowerQ) - residualMargin); upper.push(quantile(values, upperQ) + residualMargin);
      }
      method = 'Approximate residual-bootstrap prediction interval'; note = `${model.bootstrapModels.length} bootstrap models plus training residual variation`;
    } else if (model.kind === 'forest' && model.trees && model.trees.length) {
      lower = []; upper = [];
      for (let i = 0; i < X.length; i++) {
        const values = model.trees.map(tree => predictTreeLeaf(tree.root, X[i]).value); lower.push(quantile(values, lowerQ)); upper.push(quantile(values, upperQ));
      }
      method = 'Approximate between-tree ensemble interval'; note = `${model.trees.length} trees`;
    } else if (model.kind === 'tree') {
      lower = []; upper = [];
      for (let i = 0; i < X.length; i++) {
        const leaf = predictTreeLeaf(model.root, X[i]), width = z * (leaf.sd || 0); lower.push(prediction[i] - width); upper.push(prediction[i] + width);
      }
      method = 'Approximate terminal-leaf interval'; note = 'Based on training-target variation within each leaf';
    }
    return { prediction, lower, upper, level: Number(level || .95), method, note };
  }

  function metrics(actual, predicted) {
    if (!actual.length || actual.length !== predicted.length) return { r2: NaN, rmse: NaN, mae: NaN, mse: NaN, n: 0 };
    const avg = mean(actual); let sse = 0, sae = 0, sst = 0;
    for (let i = 0; i < actual.length; i++) { const e = actual[i] - predicted[i]; sse += e * e; sae += Math.abs(e); sst += (actual[i] - avg) ** 2; }
    return { r2: sst < EPS ? (sse < EPS ? 1 : 0) : 1 - sse / sst, rmse: Math.sqrt(sse / actual.length), mae: sae / actual.length, mse: sse / actual.length, n: actual.length };
  }

  function intervalMetrics(actual, lower, upper, level) {
    if (!actual.length || !lower || !upper || actual.length !== lower.length || lower.length !== upper.length) return null;
    const alpha = 1 - Number(level || .95), widths = [], scores = []; let covered = 0;
    for (let i = 0; i < actual.length; i++) {
      const lo = Math.min(lower[i], upper[i]), hi = Math.max(lower[i], upper[i]), width = hi - lo; widths.push(width);
      if (actual[i] >= lo && actual[i] <= hi) covered++;
      let score = width; if (actual[i] < lo) score += (2 / alpha) * (lo - actual[i]); else if (actual[i] > hi) score += (2 / alpha) * (actual[i] - hi); scores.push(score);
    }
    const coverage = covered / actual.length, range = Math.max(...actual) - Math.min(...actual);
    return { coverage, meanWidth: mean(widths), normalizedWidth: range > EPS ? mean(widths) / range : NaN, coverageError: coverage - Number(level || .95), intervalScore: mean(scores), covered, n: actual.length };
  }

  function featureImportance(model, featureNames) {
    if (model.kind === 'linear' || model.kind === 'ridge') {
      const values = model.coefficients.map(Math.abs), total = values.reduce((a, b) => a + b, 0) || 1;
      return featureNames.map((name, i) => ({ name, value: values[i] / total })).sort((a, b) => b.value - a.value);
    }
    const total = model.gains.reduce((a, b) => a + b, 0) || 1;
    return featureNames.map((name, i) => ({ name, value: model.gains[i] / total })).sort((a, b) => b.value - a.value);
  }

  function axisValues(spec) {
    let min = Number(spec.min), max = Number(spec.max), count = Math.max(2, Math.min(20, Number(spec.count) || 3));
    if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error('Search ranges require numeric minimum and maximum values.');
    if (max < min) [min, max] = [max, min];
    const values = [];
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1); let v;
      if (spec.spacing === 'log') {
        if (min <= 0 || max <= 0) throw new Error('Logarithmic search ranges require positive minimum and maximum values.');
        v = Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min)));
      } else v = min + t * (max - min);
      if (spec.type === 'integer') v = Math.round(v); values.push(v);
    }
    return Array.from(new Set(values));
  }

  function sampleAxis(spec, u) {
    let min = Number(spec.min), max = Number(spec.max); if (max < min) [min, max] = [max, min];
    let v;
    if (spec.spacing === 'log') {
      if (min <= 0 || max <= 0) throw new Error('Logarithmic search ranges require positive values.');
      v = Math.exp(Math.log(min) + u * (Math.log(max) - Math.log(min)));
    } else v = min + u * (max - min);
    return spec.type === 'integer' ? Math.round(v) : v;
  }

  function candidateParams(modelType, tuningMode, manual, tuning, seed) {
    if (tuningMode === 'manual' || modelType === 'linear') return [manual];
    const ranges = tuning.ranges || {}, names = Object.keys(ranges), limit = 64;
    if (!names.length) return [manual];
    let candidates = [];
    if (tuningMode === 'grid') {
      const axes = names.map(name => axisValues(ranges[name]));
      const total = axes.reduce((product, axis) => product * axis.length, 1);
      const count = Math.min(limit, total);
      const flatIndices = Array.from({ length: count }, (_, i) => count === 1 ? 0 : Math.round(i * (total - 1) / (count - 1)));
      for (const flatIndex of Array.from(new Set(flatIndices))) {
        let remainder = flatIndex; const params = { ...manual };
        for (let dimension = axes.length - 1; dimension >= 0; dimension--) {
          const axis = axes[dimension], position = remainder % axis.length; remainder = Math.floor(remainder / axis.length);
          params[names[dimension]] = axis[position];
        }
        candidates.push(params);
      }
      return candidates;
    }
    const trials = Math.max(2, Math.min(limit, Number(tuning.trials) || 12)), rng = mulberry32(seed + 991);
    if (tuningMode === 'lhs') {
      const columns = names.map(() => shuffle(Array.from({ length: trials }, (_, i) => (i + rng()) / trials), rng));
      for (let i = 0; i < trials; i++) {
        const p = { ...manual }; names.forEach((name, j) => { p[name] = sampleAxis(ranges[name], columns[j][i]); }); candidates.push(p);
      }
    } else {
      for (let i = 0; i < trials; i++) { const p = { ...manual }; names.forEach(name => { p[name] = sampleAxis(ranges[name], rng()); }); candidates.push(p); }
    }
    const seen = new Set();
    return candidates.filter(c => { const k = JSON.stringify(names.map(n => c[n])); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  async function tuneModel(modelType, Xtrain, ytrain, Xvalidation, yvalidation, tuningMode, manual, tuning, seed, progress, cancelCheck) {
    const candidates = candidateParams(modelType, tuningMode, manual, tuning, seed);
    if (candidates.length === 1) return { bestParams: candidates[0], trials: [], candidateCount: 1 };
    let best = null; const trials = [];
    for (let i = 0; i < candidates.length; i++) {
      if (cancelCheck && cancelCheck()) throw new Error('Training cancelled.');
      const model = await trainModel(modelType, Xtrain, ytrain, candidates[i], seed + i * 101, null, cancelCheck);
      const score = metrics(yvalidation, predict(model, Xvalidation)).rmse;
      trials.push({ params: candidates[i], validationRmse: score });
      if (!best || score < best.rmse) best = { params: candidates[i], rmse: score };
      if (progress) progress((i + 1) / candidates.length, `Tuning candidate ${i + 1} of ${candidates.length}`);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return { bestParams: best.params, bestValidationRmse: best.rmse, trials, candidateCount: candidates.length };
  }

  async function crossValidateRaw(rawRows, target, features, preprocessConfig, profiles, targetTransformType, modelType, params, folds, seed, progress, cancelCheck) {
    const usable = rawRows.filter(r => Number.isFinite(toNumber(r[target]))), k = Math.max(3, Math.min(10, Number(folds) || 5));
    if (usable.length < k * 2) throw new Error('Not enough training rows for the requested number of folds.');
    const indices = shuffle(Array.from({ length: usable.length }, (_, i) => i), mulberry32(seed + 313)), foldMetrics = [];
    for (let fold = 0; fold < k; fold++) {
      if (cancelCheck && cancelCheck()) throw new Error('Training cancelled.');
      const testIdx = indices.filter((_, i) => i % k === fold), trainIdx = indices.filter((_, i) => i % k !== fold);
      const trainRows = subset(usable, trainIdx), testRows = subset(usable, testIdx), pre = fitPreprocessor(trainRows, features, preprocessConfig, profiles);
      const tr = transformRows(trainRows, pre, target, true), te = transformRows(testRows, pre, target, true);
      const transform = fitTargetTransform(tr.y, targetTransformType), ytr = applyTargetTransform(tr.y, transform);
      const model = await trainModel(modelType, tr.X, ytr, params, seed + fold * 1009, null, cancelCheck);
      fitSmearing(transform, ytr, predict(model, tr.X));
      const predOriginal = inverseTargetTransform(predict(model, te.X), transform, true);
      foldMetrics.push(metrics(te.y, predOriginal));
      if (progress) progress((fold + 1) / k, `Cross-validation fold ${fold + 1} of ${k}`);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    const average = {}; for (const key of ['r2', 'rmse', 'mae', 'mse']) average[key] = mean(foldMetrics.map(m => m[key]));
    return { folds: k, foldMetrics, average };
  }

  global.MLCore = {
    EPS, mulberry32, shuffle, toNumber, isMissing, mean, median, mode, variance, quantile, inverseNormal,
    inferColumns, autoSelectFeatures, fitPreprocessor, transformRows,
    fitTargetTransform, applyTargetTransform, inverseTargetTransform, fitSmearing,
    splitRows, subset, trainModel, predict, attachBootstrapUncertainty, predictWithIntervals,
    metrics, intervalMetrics, featureImportance, axisValues, candidateParams, tuneModel, crossValidateRaw
  };
})(window);
