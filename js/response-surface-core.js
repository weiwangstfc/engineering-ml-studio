// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 UK Research and Innovation (UKRI)
// Engineering ML Studio — polynomial response-surface regression.
//
// Added by decision of Wei Wang (2026-11-27; WORKPLAN §8 "Decided"): the classic
// engineering surrogate, a smooth curved surface written as an explicit equation.
//
//   y = b0 + Σ b_j x_j + Σ b_jj x_j² [+ Σ b_ij x_i x_j] [+ Σ b_jjj x_j³]
//
// Implementation: the (already preprocessed) inputs are expanded into polynomial terms
// and fitted with the existing ordinary-least-squares solver in ml-core. Because the
// model is linear in its coefficients, the existing analytical linear-regression
// prediction interval applies exactly to the expanded terms. Feature importance is
// mapped back onto the original inputs so it reads like every other model's.
//
// Follows the same extension pattern as modelling-core.js: it wraps trainModel,
// predict, predictWithIntervals and featureImportance, handles kind 'polynomial', and
// passes every other model through unchanged.

(function (global) {
  'use strict';

  const ML = global.MLCore;
  if (!ML) throw new Error('MLCore must be loaded before response-surface-core.js.');
  const previous = {
    trainModel: ML.trainModel,
    predict: ML.predict,
    predictWithIntervals: ML.predictWithIntervals,
    featureImportance: ML.featureImportance
  };

  // Each term is a list of input indices whose values are multiplied together:
  // [j] = x_j, [j, j] = x_j², [i, j] = x_i·x_j, [j, j, j] = x_j³.
  // binary[j] marks a 0/1 column (e.g. one-hot): its square and cube equal itself, so
  // power terms for it would duplicate the linear term exactly and are not created.
  function buildTerms(p, degree, interactions, binary) {
    binary = binary || [];
    const terms = [];
    for (let j = 0; j < p; j++) terms.push([j]);
    if (degree >= 2) {
      for (let j = 0; j < p; j++) if (!binary[j]) terms.push([j, j]);
      if (interactions) for (let i = 0; i < p; i++) for (let j = i + 1; j < p; j++) terms.push([i, j]);
    }
    if (degree >= 3) for (let j = 0; j < p; j++) if (!binary[j]) terms.push([j, j, j]);
    return terms;
  }

  function isBinaryColumn(X, j) {
    const seen = new Set();
    for (let i = 0; i < X.length; i++) { seen.add(X[i][j]); if (seen.size > 2) return false; }
    return true;
  }

  // Drop terms that are constant on the training rows — for example the product of two
  // one-hot columns from the same category, which is always zero.
  function dropConstantTerms(X, terms) {
    const Z = expand(X, terms), keep = [];
    terms.forEach((term, t) => {
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < Z.length; i++) { const v = Z[i][t]; if (v < lo) lo = v; if (v > hi) hi = v; }
      if (hi - lo > 1e-12) keep.push(term);
    });
    return keep;
  }

  function expand(X, terms) {
    return X.map(row => terms.map(term => term.reduce((value, index) => value * row[index], 1)));
  }

  function settings(params) {
    params = params || {};
    const degree = Number(params.degree) === 3 ? 3 : 2;
    const interactions = !(params.interactions === false || params.interactions === 'false' || params.interactions === 0);
    return { degree, interactions };
  }

  async function trainPolynomial(X, y, params) {
    const p = X[0].length, { degree, interactions } = settings(params);
    const binary = Array.from({ length: p }, (_, j) => isBinaryColumn(X, j));
    const terms = dropConstantTerms(X, buildTerms(p, degree, interactions, binary));
    // At least two rows per coefficient, so the fit and its intervals are not degenerate.
    const needed = 2 * (terms.length + 1);
    if (X.length < needed) {
      throw new Error(`A degree-${degree} response surface on ${p} input${p === 1 ? '' : 's'} has ${terms.length} terms` +
        `${interactions && degree >= 2 && p > 1 ? ' including interactions' : ''}, which needs at least ${needed} training rows; there are ${X.length}. ` +
        'Use fewer inputs, turn off interaction terms, or choose another model.');
    }
    const Z = expand(X, terms);
    let base = await previous.trainModel('linear', Z, y, {}, 0);
    let stabilised = false;
    if (!Number.isFinite(base.intercept) || !base.coefficients.every(Number.isFinite)) {
      // Exactly collinear terms (for example a constant input): fall back to a tiny ridge penalty.
      base = await previous.trainModel('ridge', Z, y, { lambda: 1e-6 }, 0);
      stabilised = true;
    }
    const fitted = previous.predict(base, Z);
    const residualSd = Math.sqrt(ML.variance(y.map((v, i) => v - fitted[i]), true)) || 0;
    return { kind: 'polynomial', degree, interactions, inputCount: p, terms, base, stabilised, residualSd };
  }

  function predictPolynomial(model, X) {
    return previous.predict(model.base, expand(X, model.terms));
  }

  ML.trainModel = async function (modelType, X, y, params, seed, progress, cancelCheck) {
    if (modelType === 'polynomial') {
      if (!X.length || !X[0].length) throw new Error('No usable features remain after preprocessing.');
      return trainPolynomial(X, y, params);
    }
    return previous.trainModel(modelType, X, y, params, seed, progress, cancelCheck);
  };

  ML.predict = function (model, X) {
    if (model.kind === 'polynomial') return predictPolynomial(model, X);
    return previous.predict(model, X);
  };

  ML.predictWithIntervals = function (model, X, level, enabled) {
    if (model.kind !== 'polynomial') return previous.predictWithIntervals(model, X, level, enabled);
    const intervalLevel = Number(level || 0.95);
    if (enabled === false) return { prediction: predictPolynomial(model, X), lower: null, upper: null, level: intervalLevel, method: 'Disabled', note: '' };
    const Z = expand(X, model.terms);
    if (model.base.kind === 'linear') {
      const result = previous.predictWithIntervals(model.base, Z, intervalLevel);
      return { ...result, method: 'Analytical polynomial-regression prediction interval',
        note: `${model.terms.length} terms; exact for a model that is linear in its coefficients` };
    }
    const prediction = previous.predict(model.base, Z), margin = ML.inverseNormal(0.5 + intervalLevel / 2) * model.residualSd;
    return { prediction, lower: prediction.map(v => v - margin), upper: prediction.map(v => v + margin), level: intervalLevel,
      method: 'Approximate residual-scale polynomial interval', note: 'Collinear terms required a small ridge penalty; assumes constant error variance' };
  };

  // Importance per original input: the absolute coefficients of the terms that contain
  // it, shared equally among the inputs of each term.
  ML.featureImportance = function (model, featureNames) {
    if (model.kind !== 'polynomial') return previous.featureImportance(model, featureNames);
    const totals = new Array(model.inputCount).fill(0);
    model.terms.forEach((term, t) => {
      const weight = Math.abs(model.base.coefficients[t] || 0), inputs = Array.from(new Set(term));
      inputs.forEach(index => { totals[index] += weight / inputs.length; });
    });
    const sum = totals.reduce((a, b) => a + b, 0) || 1;
    return featureNames.map((name, i) => ({ name, value: totals[i] / sum })).sort((a, b) => b.value - a.value);
  };

  global.ResponseSurface = Object.freeze({ buildTerms, expand });
})(window);
