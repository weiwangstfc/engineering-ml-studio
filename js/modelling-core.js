(function (global) {
  'use strict';

  const ML = global.MLCore;
  if (!ML) throw new Error('MLCore must be loaded before modelling-core.js.');
  const EPS = 1e-12;
  const previous = {
    trainModel: ML.trainModel,
    predict: ML.predict,
    predictWithIntervals: ML.predictWithIntervals,
    featureImportance: ML.featureImportance,
    tuneModel: ML.tuneModel,
    crossValidateRaw: ML.crossValidateRaw
  };

  function delay() { return new Promise(resolve => setTimeout(resolve, 0)); }
  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
  function softThreshold(value, threshold) {
    if (value > threshold) return value - threshold;
    if (value < -threshold) return value + threshold;
    return 0;
  }
  function medianAbsoluteDeviation(values) {
    const center = ML.median(values);
    return 1.4826 * ML.median(values.map(value => Math.abs(value - center)));
  }
  function standardizeMatrix(X) {
    const p = X[0].length;
    const means = new Array(p).fill(0), scales = new Array(p).fill(1);
    for (let j = 0; j < p; j++) {
      const values = X.map(row => row[j]);
      means[j] = ML.mean(values);
      scales[j] = Math.sqrt(ML.variance(values)) || 1;
    }
    const Z = X.map(row => row.map((value, j) => (value - means[j]) / scales[j]));
    return { Z, means, scales };
  }
  function transformWithStandardizer(X, model) {
    return X.map(row => row.map((value, j) => (value - model.featureMeans[j]) / model.featureScales[j]));
  }
  function linearPredictions(intercept, coefficients, X) {
    return X.map(row => intercept + row.reduce((sum, value, j) => sum + value * coefficients[j], 0));
  }

  // ---------- Elastic net ----------
  async function trainElasticNet(X, y, params, seed, progress, cancelCheck) {
    if (!X.length || !X[0].length) throw new Error('Elastic net requires at least one training row and one feature.');
    const rawLambda = Number(params.lambda);
    const lambda = Math.max(0, Number.isFinite(rawLambda) ? rawLambda : 0.1);
    const l1Ratio = clamp(Number(params.l1Ratio), 0, 1);
    const maxIterations = Math.max(10, Math.min(5000, Math.round(Number(params.maxIterations) || 500)));
    const tolerance = Math.max(1e-10, Number(params.tolerance) || 1e-6);
    const { Z, means, scales } = standardizeMatrix(X);
    const yMean = ML.mean(y), yc = y.map(value => value - yMean), n = X.length, p = X[0].length;
    const coefficients = new Array(p).fill(0), predictions = new Array(n).fill(0), history = [];
    const columnNorms = new Array(p).fill(0);
    for (let j = 0; j < p; j++) for (let i = 0; i < n; i++) columnNorms[j] += Z[i][j] * Z[i][j];
    let converged = false;
    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      if (cancelCheck && cancelCheck()) throw new Error('Training cancelled.');
      let maxChange = 0;
      for (let j = 0; j < p; j++) {
        const old = coefficients[j];
        let correlation = 0;
        for (let i = 0; i < n; i++) correlation += Z[i][j] * (yc[i] - predictions[i] + Z[i][j] * old);
        const numerator = softThreshold(correlation / n, lambda * l1Ratio);
        const denominator = columnNorms[j] / n + lambda * (1 - l1Ratio) + EPS;
        const next = numerator / denominator;
        const change = next - old;
        if (change !== 0) for (let i = 0; i < n; i++) predictions[i] += Z[i][j] * change;
        coefficients[j] = next;
        maxChange = Math.max(maxChange, Math.abs(change));
      }
      if (iteration === 1 || iteration % 10 === 0 || maxChange < tolerance || iteration === maxIterations) {
        const mse = ML.metrics(yc, predictions).mse;
        history.push({ iteration, trainLoss:mse, maximumCoefficientChange:maxChange });
        if (progress) progress(iteration / maxIterations, `Elastic-net iteration ${iteration} of ${maxIterations}`);
        await delay();
      }
      if (maxChange < tolerance) { converged = true; break; }
    }
    const fitted = predictions.map(value => value + yMean);
    const residuals = y.map((value, i) => value - fitted[i]);
    return {
      kind:'elasticnet', params:{ lambda, l1Ratio, maxIterations, tolerance },
      intercept:yMean, coefficients, featureMeans:means, featureScales:scales,
      residualSd:Math.sqrt(ML.variance(residuals, true)) || 0,
      trainingHistory:history, converged, nonzeroCoefficients:coefficients.filter(value => Math.abs(value) > 1e-10).length
    };
  }
  function predictElasticNet(model, X) {
    return linearPredictions(model.intercept, model.coefficients, transformWithStandardizer(X, model));
  }

  // ---------- Huber robust linear regression ----------
  function solveWeightedLinear(X, y, weights, ridge) {
    const p = X[0].length + 1;
    const A = Array.from({length:p}, () => Array(p).fill(0)), b = Array(p).fill(0);
    for (let i = 0; i < X.length; i++) {
      const row = [1].concat(X[i]), w = weights[i];
      for (let a = 0; a < p; a++) {
        b[a] += w * row[a] * y[i];
        for (let c = a; c < p; c++) A[a][c] += w * row[a] * row[c];
      }
    }
    for (let a = 0; a < p; a++) {
      for (let c = 0; c < a; c++) A[a][c] = A[c][a];
      A[a][a] += a === 0 ? 1e-10 : ridge;
    }
    // Local Gaussian elimination to avoid relying on non-exported MLCore helpers.
    const M = A.map((row, i) => row.slice().concat(b[i]));
    for (let col = 0; col < p; col++) {
      let pivot = col;
      for (let row = col + 1; row < p; row++) if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
      if (Math.abs(M[pivot][col]) < 1e-12) M[pivot][col] += 1e-8;
      [M[col], M[pivot]] = [M[pivot], M[col]];
      const divisor = M[col][col] || 1e-12;
      for (let j = col; j <= p; j++) M[col][j] /= divisor;
      for (let row = 0; row < p; row++) {
        if (row === col) continue;
        const factor = M[row][col];
        for (let j = col; j <= p; j++) M[row][j] -= factor * M[col][j];
      }
    }
    return M.map(row => row[p]);
  }
  async function trainRobust(X, y, params, seed, progress, cancelCheck) {
    const delta = Math.max(0.2, Number(params.huberDelta) || 1.345);
    const maxIterations = Math.max(5, Math.min(500, Math.round(Number(params.maxIterations) || 80)));
    const tolerance = Math.max(1e-10, Number(params.tolerance) || 1e-6);
    const rawRidge = Number(params.ridge);
    const ridge = Math.max(0, Number.isFinite(rawRidge) ? rawRidge : 1e-8);
    const { Z, means, scales } = standardizeMatrix(X);
    let weights = new Array(X.length).fill(1), beta = solveWeightedLinear(Z, y, weights, ridge), history = [], converged = false;
    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      if (cancelCheck && cancelCheck()) throw new Error('Training cancelled.');
      const prediction = linearPredictions(beta[0], beta.slice(1), Z);
      const residuals = y.map((value, i) => value - prediction[i]);
      const scale = medianAbsoluteDeviation(residuals) || Math.sqrt(ML.variance(residuals, true)) || 1;
      const threshold = delta * scale;
      weights = residuals.map(value => Math.abs(value) <= threshold ? 1 : threshold / Math.max(EPS, Math.abs(value)));
      const next = solveWeightedLinear(Z, y, weights, ridge);
      const change = Math.max(...next.map((value, j) => Math.abs(value - beta[j])));
      beta = next;
      const loss = ML.mean(residuals.map(value => {
        const a = Math.abs(value);
        return a <= threshold ? 0.5 * value * value : threshold * (a - 0.5 * threshold);
      }));
      history.push({ iteration, trainLoss:loss, robustScale:scale, maximumCoefficientChange:change, downweightedRows:weights.filter(value => value < 0.999999).length });
      if (progress) progress(iteration / maxIterations, `Robust-regression iteration ${iteration} of ${maxIterations}`);
      if (iteration % 5 === 0) await delay();
      if (change < tolerance) { converged = true; break; }
    }
    const finalPrediction = linearPredictions(beta[0], beta.slice(1), Z);
    const finalResiduals = y.map((value, i) => value - finalPrediction[i]);
    return {
      kind:'robust', params:{ huberDelta:delta, maxIterations, tolerance, ridge },
      intercept:beta[0], coefficients:beta.slice(1), featureMeans:means, featureScales:scales,
      residualSd:Math.sqrt(ML.variance(finalResiduals, true)) || 0,
      robustScale:medianAbsoluteDeviation(finalResiduals) || 0,
      trainingHistory:history, converged, downweightedRows:weights.filter(value => value < 0.999999).length
    };
  }
  function predictRobust(model, X) {
    return linearPredictions(model.intercept, model.coefficients, transformWithStandardizer(X, model));
  }

  // ---------- Gradient-boosted regression trees ----------
  async function trainGradientBoosting(X, y, params, seed, progress, cancelCheck) {
    const nEstimators = Math.max(5, Math.min(300, Math.round(Number(params.nEstimators) || 80)));
    const learningRate = clamp(Number(params.learningRate) || 0.05, 0.001, 1);
    const maxDepth = Math.max(1, Math.min(8, Math.round(Number(params.maxDepth) || 3)));
    const minLeaf = Math.max(2, Math.round(Number(params.minLeaf) || 5));
    const maxThresholds = Math.max(4, Math.round(Number(params.maxThresholds) || 20));
    const sampleRate = clamp(Number(params.sampleRate) || 0.8, 0.3, 1);
    const validationX = params._validationX || [], validationY = params._validationY || [];
    const initial = ML.mean(y), trainPrediction = new Array(y.length).fill(initial), validationPrediction = new Array(validationX.length).fill(initial);
    const trees = [], gains = new Array(X[0].length).fill(0), history = [], rng = ML.mulberry32(seed || 42);
    for (let estimator = 0; estimator < nEstimators; estimator++) {
      if (cancelCheck && cancelCheck()) throw new Error('Training cancelled.');
      const residual = y.map((value, i) => value - trainPrediction[i]);
      let indices = Array.from({length:X.length}, (_, i) => i);
      if (sampleRate < 0.999999) indices = ML.shuffle(indices, rng).slice(0, Math.max(2 * minLeaf, Math.round(X.length * sampleRate)));
      const Xsample = indices.map(i => X[i]), rsample = indices.map(i => residual[i]);
      const tree = await previous.trainModel('tree', Xsample, rsample, { maxDepth, minLeaf, maxThresholds, maxFeatures:'all', recordHistory:false }, seed + estimator * 997, null, cancelCheck);
      trees.push(tree);
      const trainStep = previous.predict(tree, X);
      for (let i = 0; i < trainPrediction.length; i++) trainPrediction[i] += learningRate * trainStep[i];
      if (validationX.length) {
        const validationStep = previous.predict(tree, validationX);
        for (let i = 0; i < validationPrediction.length; i++) validationPrediction[i] += learningRate * validationStep[i];
      }
      if (Array.isArray(tree.gains)) tree.gains.forEach((value, j) => { gains[j] += value; });
      if (estimator < 10 || estimator === nEstimators - 1 || (estimator + 1) % Math.max(1, Math.round(nEstimators / 25)) === 0) {
        history.push({
          estimators:estimator + 1,
          trainLoss:ML.metrics(y, trainPrediction).mse,
          validationLoss:validationX.length ? ML.metrics(validationY, validationPrediction).mse : NaN
        });
      }
      if (progress) progress((estimator + 1) / nEstimators, `Training boosted tree ${estimator + 1} of ${nEstimators}`);
      if (estimator % 2 === 0) await delay();
    }
    const residuals = y.map((value, i) => value - trainPrediction[i]);
    return {
      kind:'gboost', initial, trees, gains,
      params:{ nEstimators, learningRate, maxDepth, minLeaf, maxThresholds, sampleRate },
      residualSd:Math.sqrt(ML.variance(residuals, true)) || 0,
      trainingHistory:history
    };
  }
  function predictGradientBoosting(model, X) {
    const output = new Array(X.length).fill(model.initial);
    for (const tree of model.trees) {
      const step = previous.predict(tree, X);
      for (let i = 0; i < output.length; i++) output[i] += model.params.learningRate * step[i];
    }
    return output;
  }

  // ---------- k-nearest-neighbour regression ----------
  function distance(a, b, power) {
    if (power === 1) {
      let total = 0; for (let j = 0; j < a.length; j++) total += Math.abs(a[j] - b[j]); return total;
    }
    let total = 0; for (let j = 0; j < a.length; j++) { const d = a[j] - b[j]; total += d * d; } return Math.sqrt(total);
  }
  function nearest(model, row) {
    const distances = model.Xtrain.map((trainRow, i) => ({ i, d:distance(trainRow, row, model.params.distancePower) }));
    distances.sort((a, b) => a.d - b.d);
    return distances.slice(0, Math.min(model.params.k, distances.length));
  }
  async function trainKnn(X, y, params) {
    const k = Math.max(1, Math.min(X.length, Math.round(Number(params.k) || 7)));
    const weighting = params.weighting === 'uniform' ? 'uniform' : 'distance';
    const distancePower = Number(params.distancePower) === 1 ? 1 : 2;
    const maxRows = Math.max(100, Math.min(100000, Math.round(Number(params.maxRows) || 25000)));
    if (X.length > maxRows) throw new Error(`k-nearest-neighbour training contains ${X.length} rows; the configured limit is ${maxRows}. Reduce the data or raise the limit cautiously.`);
    return { kind:'knn', Xtrain:X.map(row => row.slice()), ytrain:y.slice(), params:{ k, weighting, distancePower, maxRows } };
  }
  function predictKnn(model, X) {
    return X.map(row => {
      const neighbors = nearest(model, row);
      if (neighbors[0] && neighbors[0].d < EPS) {
        const tied = neighbors.filter(item => item.d < EPS).map(item => model.ytrain[item.i]);
        return ML.mean(tied);
      }
      if (model.params.weighting === 'uniform') return ML.mean(neighbors.map(item => model.ytrain[item.i]));
      let numerator = 0, denominator = 0;
      for (const item of neighbors) { const w = 1 / Math.max(EPS, item.d); numerator += w * model.ytrain[item.i]; denominator += w; }
      return numerator / Math.max(EPS, denominator);
    });
  }

  // ---------- Linear quantile regression ----------
  async function fitOneQuantile(Z, yScaled, q, params, progress, cancelCheck, progressOffset, progressScale) {
    const p = Z[0].length, n = Z.length;
    const iterations = Math.max(100, Math.min(10000, Math.round(Number(params.iterations) || 1500)));
    const learningRate = Math.max(1e-5, Number(params.learningRate) || 0.03);
    const rawL2 = Number(params.l2);
    const l2 = Math.max(0, Number.isFinite(rawL2) ? rawL2 : 0.0001);
    const coefficients = new Array(p).fill(0);
    let intercept = ML.quantile(yScaled, q), history = [];
    for (let iteration = 1; iteration <= iterations; iteration++) {
      if (cancelCheck && cancelCheck()) throw new Error('Training cancelled.');
      let gradIntercept = 0; const grad = new Array(p).fill(0), loss = [];
      for (let i = 0; i < n; i++) {
        let pred = intercept; for (let j = 0; j < p; j++) pred += coefficients[j] * Z[i][j];
        const residual = yScaled[i] - pred;
        const derivative = residual < 0 ? 1 - q : -q;
        gradIntercept += derivative;
        for (let j = 0; j < p; j++) grad[j] += derivative * Z[i][j];
        loss.push(residual >= 0 ? q * residual : (q - 1) * residual);
      }
      const step = learningRate / Math.sqrt(iteration);
      intercept -= step * gradIntercept / n;
      for (let j = 0; j < p; j++) coefficients[j] -= step * (grad[j] / n + l2 * coefficients[j]);
      if (iteration === 1 || iteration % 50 === 0 || iteration === iterations) {
        history.push({ iteration, pinballLoss:ML.mean(loss) });
        if (progress) progress(progressOffset + progressScale * iteration / iterations, `Quantile ${q.toFixed(3)} iteration ${iteration} of ${iterations}`);
        await delay();
      }
    }
    return { q, intercept, coefficients, history };
  }
  async function trainQuantile(X, y, params, seed, progress, cancelCheck) {
    const centralQuantile = clamp(Number(params.quantile) || 0.5, 0.01, 0.99);
    let lowerQuantile = clamp(Number(params.lowerQuantile) || 0.05, 0.001, 0.49);
    let upperQuantile = clamp(Number(params.upperQuantile) || 0.95, 0.51, 0.999);
    if (lowerQuantile >= centralQuantile) lowerQuantile = Math.max(0.001, centralQuantile / 2);
    if (upperQuantile <= centralQuantile) upperQuantile = Math.min(0.999, (1 + centralQuantile) / 2);
    const { Z, means, scales } = standardizeMatrix(X);
    const yMean = ML.mean(y), ySd = Math.sqrt(ML.variance(y)) || 1, ys = y.map(value => (value - yMean) / ySd);
    const lower = await fitOneQuantile(Z, ys, lowerQuantile, params, progress, cancelCheck, 0, 1/3);
    const center = await fitOneQuantile(Z, ys, centralQuantile, params, progress, cancelCheck, 1/3, 1/3);
    const upper = await fitOneQuantile(Z, ys, upperQuantile, params, progress, cancelCheck, 2/3, 1/3);
    return {
      kind:'quantile', params:{
        quantile:centralQuantile, lowerQuantile, upperQuantile,
        iterations:Math.max(100, Math.round(Number(params.iterations) || 1500)),
        learningRate:Math.max(1e-5, Number(params.learningRate) || 0.03), l2:Math.max(0, Number.isFinite(Number(params.l2)) ? Number(params.l2) : 0.0001)
      },
      featureMeans:means, featureScales:scales, yMean, ySd,
      lowerModel:lower, centerModel:center, upperModel:upper,
      trainingHistory:center.history.map(item => ({ iteration:item.iteration, trainLoss:item.pinballLoss }))
    };
  }
  function predictQuantilePart(model, X, part) {
    const Z = transformWithStandardizer(X, model), fit = model[part];
    return linearPredictions(fit.intercept, fit.coefficients, Z).map(value => model.yMean + model.ySd * value);
  }
  function predictQuantile(model, X) { return predictQuantilePart(model, X, 'centerModel'); }

  ML.trainModel = async function (modelType, X, y, params, seed, progress, cancelCheck) {
    params = params || {};
    if (modelType === 'elasticnet') return trainElasticNet(X, y, params, seed, progress, cancelCheck);
    if (modelType === 'robust') return trainRobust(X, y, params, seed, progress, cancelCheck);
    if (modelType === 'gboost') return trainGradientBoosting(X, y, params, seed, progress, cancelCheck);
    if (modelType === 'knn') return trainKnn(X, y, params, seed, progress, cancelCheck);
    if (modelType === 'quantile') return trainQuantile(X, y, params, seed, progress, cancelCheck);
    return previous.trainModel(modelType, X, y, params, seed, progress, cancelCheck);
  };

  ML.predict = function (model, X) {
    if (model.kind === 'elasticnet') return predictElasticNet(model, X);
    if (model.kind === 'robust') return predictRobust(model, X);
    if (model.kind === 'gboost') return predictGradientBoosting(model, X);
    if (model.kind === 'knn') return predictKnn(model, X);
    if (model.kind === 'quantile') return predictQuantile(model, X);
    return previous.predict(model, X);
  };

  ML.predictWithIntervals = function (model, X, level, enabled) {
    if (enabled === false) return { prediction:ML.predict(model, X), lower:null, upper:null, level:Number(level || 0.95), method:'Disabled', note:'' };
    const intervalLevel = Number(level || 0.95), z = ML.inverseNormal(0.5 + intervalLevel / 2);
    if (model.kind === 'elasticnet' || model.kind === 'robust' || model.kind === 'gboost') {
      const prediction = ML.predict(model, X), margin = z * Math.max(0, Number(model.residualSd) || 0);
      const label = model.kind === 'elasticnet' ? 'elastic-net' : model.kind === 'robust' ? 'Huber robust-regression' : 'gradient-boosting';
      return { prediction, lower:prediction.map(value => value - margin), upper:prediction.map(value => value + margin), level:intervalLevel, method:`Approximate residual-scale ${label} interval`, note:'Assumes a constant residual scale; verify coverage on the independent test set.' };
    }
    if (model.kind === 'knn') {
      const prediction = ML.predict(model, X), alpha = 1 - intervalLevel, lower = [], upper = [];
      for (const row of X) {
        const values = nearest(model, row).map(item => model.ytrain[item.i]);
        lower.push(ML.quantile(values, alpha / 2)); upper.push(ML.quantile(values, 1 - alpha / 2));
      }
      return { prediction, lower, upper, level:intervalLevel, method:'Approximate neighbour-target empirical interval', note:`Uses the fitted ${model.params.k} nearest neighbours; sparse regions may have unstable coverage.` };
    }
    if (model.kind === 'quantile') {
      const prediction = predictQuantile(model, X), a = predictQuantilePart(model, X, 'lowerModel'), b = predictQuantilePart(model, X, 'upperModel');
      const lower = a.map((value, i) => Math.min(value, b[i])), upper = b.map((value, i) => Math.max(value, a[i]));
      return { prediction, lower, upper, level:model.params.upperQuantile - model.params.lowerQuantile, requestedLevel:intervalLevel, method:'Conditional linear quantile interval', note:`Fitted quantiles ${model.params.lowerQuantile} and ${model.params.upperQuantile}; the displayed level follows those fitted quantiles rather than the global interval selector.` };
    }
    return previous.predictWithIntervals(model, X, level, enabled);
  };

  ML.featureImportance = function (model, featureNames) {
    if (model.kind === 'elasticnet' || model.kind === 'robust') {
      const values = model.coefficients.map(value => Math.abs(value));
      const total = values.reduce((a, b) => a + b, 0) || 1;
      return featureNames.map((name, i) => ({name, value:(values[i] || 0) / total})).sort((a, b) => b.value - a.value);
    }
    if (model.kind === 'quantile') {
      const values = model.centerModel.coefficients.map(value => Math.abs(value));
      const total = values.reduce((a, b) => a + b, 0) || 1;
      return featureNames.map((name, i) => ({name, value:(values[i] || 0) / total})).sort((a, b) => b.value - a.value);
    }
    if (model.kind === 'gboost') {
      const total = model.gains.reduce((a, b) => a + b, 0) || 1;
      return featureNames.map((name, i) => ({name, value:(model.gains[i] || 0) / total})).sort((a, b) => b.value - a.value);
    }
    if (model.kind === 'knn') return [];
    return previous.featureImportance(model, featureNames);
  };

  const EXPANDED_TYPES = new Set(['elasticnet','robust','gboost','knn','quantile']);

  ML.tuneModel = async function (modelType, Xtrain, ytrain, Xvalidation, yvalidation, tuningMode, manual, tuning, seed, progress, cancelCheck) {
    if (!EXPANDED_TYPES.has(modelType)) return previous.tuneModel(modelType, Xtrain, ytrain, Xvalidation, yvalidation, tuningMode, manual, tuning, seed, progress, cancelCheck);
    const candidates = ML.candidateParams(modelType, tuningMode, manual, tuning, seed);
    if (candidates.length === 1) return { bestParams:candidates[0], trials:[], candidateCount:1 };
    let best = null; const trials = [];
    for (let i = 0; i < candidates.length; i++) {
      if (cancelCheck && cancelCheck()) throw new Error('Training cancelled.');
      const params = { ...candidates[i] };
      if (modelType === 'gboost') { params._validationX = Xvalidation; params._validationY = yvalidation; }
      const model = await ML.trainModel(modelType, Xtrain, ytrain, params, seed + i * 101, null, cancelCheck);
      const rmse = ML.metrics(yvalidation, ML.predict(model, Xvalidation)).rmse;
      trials.push({ params:{...candidates[i]}, validationRmse:rmse, trainingHistory:model.trainingHistory || null });
      if (!best || rmse < best.rmse) best = { params:{...candidates[i]}, rmse };
      if (progress) progress((i + 1) / candidates.length, `Tuning candidate ${i + 1} of ${candidates.length}`);
      await delay();
    }
    return { bestParams:best.params, bestValidationRmse:best.rmse, trials, candidateCount:candidates.length };
  };

  ML.crossValidateRaw = async function (rawRows, target, features, preprocessConfig, profiles, targetTransformType, modelType, params, folds, seed, progress, cancelCheck) {
    if (!EXPANDED_TYPES.has(modelType)) return previous.crossValidateRaw(rawRows, target, features, preprocessConfig, profiles, targetTransformType, modelType, params, folds, seed, progress, cancelCheck);
    const usable = rawRows.filter(row => Number.isFinite(ML.toNumber(row[target])));
    const k = Math.max(3, Math.min(10, Number(folds) || 5));
    if (usable.length < k * 2) throw new Error('Not enough training rows for the requested number of folds.');
    const indices = ML.shuffle(Array.from({length:usable.length}, (_, i) => i), ML.mulberry32(seed + 313));
    const foldMetrics = [];
    for (let fold = 0; fold < k; fold++) {
      if (cancelCheck && cancelCheck()) throw new Error('Training cancelled.');
      const testIdx = indices.filter((_, i) => i % k === fold), trainIdx = indices.filter((_, i) => i % k !== fold);
      const trainRows = ML.subset(usable, trainIdx), testRows = ML.subset(usable, testIdx);
      const pre = ML.fitPreprocessor(trainRows, features, preprocessConfig, profiles);
      const tr = ML.transformRows(trainRows, pre, target, true), te = ML.transformRows(testRows, pre, target, true);
      const transform = ML.fitTargetTransform(tr.y, targetTransformType), ytr = ML.applyTargetTransform(tr.y, transform);
      const model = await ML.trainModel(modelType, tr.X, ytr, { ...params, _validationX:undefined, _validationY:undefined }, seed + fold * 1009, null, cancelCheck);
      ML.fitSmearing(transform, ytr, ML.predict(model, tr.X));
      const prediction = ML.inverseTargetTransform(ML.predict(model, te.X), transform, true);
      foldMetrics.push(ML.metrics(te.y, prediction));
      if (progress) progress((fold + 1) / k, `Cross-validation fold ${fold + 1} of ${k}`);
      await delay();
    }
    const average = {};
    for (const key of ['r2','rmse','mae','mse']) average[key] = ML.mean(foldMetrics.map(item => item[key]));
    return { folds:k, foldMetrics, average };
  };

  global.ExpandedModelling = Object.freeze({
    version:'1.0.11',
    supportedModels:Array.from(EXPANDED_TYPES)
  });
})(typeof window !== 'undefined' ? window : globalThis);
