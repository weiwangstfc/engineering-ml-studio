(function (global) {
  'use strict';

  const ML = global.MLCore;
  if (!ML) throw new Error('MLCore must be loaded before advanced-core.js.');
  const EPS = 1e-12;
  const original = {
    trainModel: ML.trainModel,
    predict: ML.predict,
    predictWithIntervals: ML.predictWithIntervals,
    featureImportance: ML.featureImportance,
    candidateParams: ML.candidateParams,
    tuneModel: ML.tuneModel,
    crossValidateRaw: ML.crossValidateRaw
  };

  function delay() { return new Promise(resolve => setTimeout(resolve, 0)); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function sqDistance(a, b) { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return s; }
  function cloneJson(v) { return JSON.parse(JSON.stringify(v)); }

  // ---------- Gaussian process ----------
  function kernelValue(a, b, p) {
    const type = p.kernel || 'rbf';
    const signal2 = Math.max(EPS, Number(p.signalVariance) || 1);
    const length = Math.max(1e-6, Number(p.lengthScale) || 1);
    let r2 = 0, dot = 0;
    for (let i = 0; i < a.length; i++) {
      const d = (a[i] - b[i]) / length;
      r2 += d * d;
      dot += a[i] * b[i];
    }
    if (type === 'linear') return signal2 * (dot + (Number(p.linearOffset) || 0));
    if (type === 'matern32') {
      const r = Math.sqrt(Math.max(0, r2)), q = Math.sqrt(3) * r;
      return signal2 * (1 + q) * Math.exp(-q);
    }
    if (type === 'matern52') {
      const r = Math.sqrt(Math.max(0, r2)), q = Math.sqrt(5) * r;
      return signal2 * (1 + q + 5 * r2 / 3) * Math.exp(-q);
    }
    if (type === 'rq') {
      const alpha = Math.max(1e-4, Number(p.rqAlpha) || 1);
      return signal2 * Math.pow(1 + r2 / (2 * alpha), -alpha);
    }
    return signal2 * Math.exp(-0.5 * r2);
  }

  function cholesky(A, n) {
    const L = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = A[i * n + j];
        for (let k = 0; k < j; k++) sum -= L[i * n + k] * L[j * n + k];
        if (i === j) {
          if (!(sum > 0) || !Number.isFinite(sum)) throw new Error('Covariance matrix is not positive definite. Increase GP jitter or observation noise.');
          L[i * n + j] = Math.sqrt(sum);
        } else L[i * n + j] = sum / L[j * n + j];
      }
    }
    return L;
  }

  function solveCholesky(L, b, n) {
    const y = new Float64Array(n), x = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let sum = b[i];
      for (let k = 0; k < i; k++) sum -= L[i * n + k] * y[k];
      y[i] = sum / L[i * n + i];
    }
    for (let i = n - 1; i >= 0; i--) {
      let sum = y[i];
      for (let k = i + 1; k < n; k++) sum -= L[k * n + i] * x[k];
      x[i] = sum / L[i * n + i];
    }
    return x;
  }

  function chooseSubsetIndices(X, size, method, seed) {
    const n = X.length, m = Math.max(2, Math.min(n, Math.round(size || n)));
    if (m >= n) return Array.from({ length: n }, (_, i) => i);
    const rng = ML.mulberry32(seed || 42);
    if (method === 'random') return ML.shuffle(Array.from({ length: n }, (_, i) => i), rng).slice(0, m);
    const selected = [Math.floor(rng() * n)], minDist = new Float64Array(n);
    for (let i = 0; i < n; i++) minDist[i] = sqDistance(X[i], X[selected[0]]);
    while (selected.length < m) {
      let next = -1;
      if (method === 'kmeanspp') {
        let total = 0; for (let i = 0; i < n; i++) total += minDist[i];
        let target = rng() * Math.max(EPS, total), acc = 0;
        for (let i = 0; i < n; i++) { acc += minDist[i]; if (acc >= target) { next = i; break; } }
      } else {
        let best = -1; for (let i = 0; i < n; i++) if (minDist[i] > best) { best = minDist[i]; next = i; }
      }
      if (next < 0 || selected.includes(next)) next = Array.from({ length: n }, (_, i) => i).find(i => !selected.includes(i));
      selected.push(next);
      for (let i = 0; i < n; i++) minDist[i] = Math.min(minDist[i], sqDistance(X[i], X[next]));
    }
    return selected;
  }

  function fitGPState(X, y, params) {
    const n = X.length;
    if (!n) throw new Error('No GP training rows remain after preprocessing.');
    const hardLimit = Math.max(50, Number(params.gpHardLimit) || 2000);
    if (n > hardLimit) throw new Error(`Exact/subset GP state contains ${n} rows; the configured hard limit is ${hardLimit}. Use a smaller representative subset.`);
    const yMean = ML.mean(y), centered = Float64Array.from(y.map(v => v - yMean));
    const K = new Float64Array(n * n);
    const noise2 = Math.max(1e-12, Math.pow(Number(params.noiseStd) || 0.1, 2));
    const baseJitter = Math.max(1e-12, Number(params.jitter) || 1e-8);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        const value = kernelValue(X[i], X[j], params);
        K[i * n + j] = value; K[j * n + i] = value;
      }
    }
    let L = null, jitterUsed = baseJitter, lastError;
    for (let attempt = 0; attempt < 8; attempt++) {
      const A = K.slice();
      for (let i = 0; i < n; i++) A[i * n + i] += noise2 + jitterUsed;
      try { L = cholesky(A, n); break; }
      catch (error) { lastError = error; jitterUsed *= 10; }
    }
    if (!L) throw lastError || new Error('GP covariance factorisation failed.');
    const alpha = solveCholesky(L, centered, n);
    let quadratic = 0, logDet = 0;
    for (let i = 0; i < n; i++) { quadratic += centered[i] * alpha[i]; logDet += Math.log(L[i * n + i]); }
    const nll = 0.5 * quadratic + logDet + 0.5 * n * Math.log(2 * Math.PI);
    return { X, y, yMean, L: Array.from(L), alpha: Array.from(alpha), n, nll, jitterUsed, noise2 };
  }

  async function trainGP(X, y, params, seed, progress, cancelCheck) {
    const mode = params.gpMode || 'exact';
    let subsetSize = mode === 'exact' ? X.length : Math.max(10, Math.min(X.length, Number(params.subsetSize) || 500));
    const subsetIndices = chooseSubsetIndices(X, subsetSize, params.subsetMethod || 'farthest', seed + 19);
    const Xs = subsetIndices.map(i => X[i]), ys = subsetIndices.map(i => y[i]);
    const iterations = Math.max(0, Math.min(30, Number(params.optimizeIterations) || 0));
    const rng = ML.mulberry32(seed + 793);
    let currentParams = { ...params }, bestState = fitGPState(Xs, ys, currentParams);
    const history = [{ iteration: 0, negativeLogMarginalLikelihood: bestState.nll, lengthScale: Number(currentParams.lengthScale)||1, signalVariance:Number(currentParams.signalVariance)||1, noiseStd:Number(currentParams.noiseStd)||0.1, rqAlpha:Number(currentParams.rqAlpha)||1 }];
    for (let iteration = 1; iteration <= iterations; iteration++) {
      if (cancelCheck && cancelCheck()) throw new Error('Training cancelled.');
      const scale = Math.max(0.05, 0.6 * (1 - iteration / (iterations + 1)));
      const proposal = { ...currentParams };
      const optimisedNames = ['signalVariance','noiseStd'];
      if ((currentParams.kernel || 'rbf') !== 'linear') optimisedNames.unshift('lengthScale');
      if ((currentParams.kernel || 'rbf') === 'rq') optimisedNames.push('rqAlpha');
      for (const name of optimisedNames) {
        const base = Math.max(1e-8, Number(currentParams[name]) || (name === 'noiseStd' ? 0.1 : 1));
        proposal[name] = base * Math.exp((rng() * 2 - 1) * scale);
      }
      try {
        const state = fitGPState(Xs, ys, proposal);
        if (state.nll < bestState.nll) { bestState = state; currentParams = proposal; }
      } catch (_) { /* rejected proposal */ }
      history.push({ iteration, negativeLogMarginalLikelihood: bestState.nll, lengthScale:Number(currentParams.lengthScale), signalVariance:Number(currentParams.signalVariance), noiseStd:Number(currentParams.noiseStd), rqAlpha:Number(currentParams.rqAlpha)||1 });
      if (progress) progress(iteration / Math.max(1, iterations), `GP kernel optimisation ${iteration} of ${iterations}`);
      await delay();
    }
    return {
      kind: 'gp', params: { ...currentParams, gpMode: mode, subsetSize: subsetIndices.length },
      Xtrain: bestState.X, yMean: bestState.yMean, L: bestState.L, alpha: bestState.alpha,
      noise2: bestState.noise2, jitterUsed: bestState.jitterUsed, nll: bestState.nll,
      subsetIndices, trainingHistory: history,
      trainingRowsUsed: subsetIndices.length, originalTrainingRows: X.length
    };
  }

  function gpPredictDistribution(model, X, includeNoise) {
    const n = model.Xtrain.length, L = Float64Array.from(model.L), alpha = model.alpha;
    const mean = [], variance = [];
    for (const row of X) {
      const k = new Float64Array(n);
      for (let i = 0; i < n; i++) k[i] = kernelValue(model.Xtrain[i], row, model.params);
      let mu = model.yMean; for (let i = 0; i < n; i++) mu += k[i] * alpha[i];
      const v = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        let sum = k[i]; for (let j = 0; j < i; j++) sum -= L[i * n + j] * v[j];
        v[i] = sum / L[i * n + i];
      }
      let vv = kernelValue(row, row, model.params); for (let i = 0; i < n; i++) vv -= v[i] * v[i];
      if (includeNoise) vv += model.noise2;
      mean.push(mu); variance.push(Math.max(0, vv));
    }
    return { mean, variance };
  }

  // ---------- Dense neural network ----------
  function activation(name, z) {
    if (name === 'tanh') return Math.tanh(z);
    if (name === 'sigmoid') return 1 / (1 + Math.exp(-clamp(z, -40, 40)));
    if (name === 'leakyRelu') return z >= 0 ? z : 0.01 * z;
    return Math.max(0, z);
  }
  function activationDerivative(name, z) {
    if (name === 'tanh') { const t = Math.tanh(z); return 1 - t * t; }
    if (name === 'sigmoid') { const s = 1 / (1 + Math.exp(-clamp(z, -40, 40))); return s * (1 - s); }
    if (name === 'leakyRelu') return z >= 0 ? 1 : 0.01;
    return z > 0 ? 1 : 0;
  }

  function sanitizeAnnParams(params) {
    const clean = { ...params };
    clean.hidden1 = Math.max(1, Math.round(Number(params.hidden1) || 32));
    clean.hidden2 = Math.max(0, Math.round(Number(params.hidden2) || 0));
    clean.hidden3 = clean.hidden2 > 0 ? Math.max(0, Math.round(Number(params.hidden3) || 0)) : 0;
    return clean;
  }

  function parseHiddenLayers(params) {
    const clean = sanitizeAnnParams(params);
    const values = [clean.hidden1, clean.hidden2, clean.hidden3].filter(v => v > 0);
    return values.length ? values : [32, 16];
  }

  function annParameterCount(inputSize, hidden) {
    const sizes = [inputSize].concat(hidden, [1]); let total = 0;
    for (let i = 0; i < sizes.length - 1; i++) total += sizes[i] * sizes[i + 1] + sizes[i + 1];
    return total;
  }

  function initNetwork(inputSize, hidden, params, seed) {
    const rng = ML.mulberry32(seed), sizes = [inputSize].concat(hidden, [1]), layers = [];
    for (let l = 0; l < sizes.length - 1; l++) {
      const fanIn = sizes[l], fanOut = sizes[l + 1], isOutput = l === sizes.length - 2;
      const scale = Math.sqrt((isOutput || params.activation === 'tanh' || params.activation === 'sigmoid') ? 1 / fanIn : 2 / fanIn);
      const w = new Array(fanIn * fanOut), b = new Array(fanOut).fill(0);
      for (let i = 0; i < w.length; i++) w[i] = (rng() * 2 - 1) * Math.sqrt(3) * scale;
      layers.push({ in: fanIn, out: fanOut, w, b });
    }
    return layers;
  }

  function forwardNetwork(layers, input, params, stochastic, rng) {
    const activations = [input.slice()], zs = [], masks = [];
    let a = input.slice();
    for (let l = 0; l < layers.length; l++) {
      const layer = layers[l], z = new Array(layer.out).fill(0), out = new Array(layer.out);
      for (let o = 0; o < layer.out; o++) {
        let sum = layer.b[o], offset = o * layer.in;
        for (let i = 0; i < layer.in; i++) sum += layer.w[offset + i] * a[i];
        z[o] = sum;
      }
      const outputLayer = l === layers.length - 1;
      if (outputLayer) { out[0] = z[0]; masks.push([1]); }
      else {
        const rate = clamp(Number(params.dropout) || 0, 0, 0.8), keep = 1 - rate, mask = new Array(layer.out);
        for (let o = 0; o < layer.out; o++) {
          const m = stochastic && rate > 0 ? (rng() < keep ? 1 / keep : 0) : 1;
          mask[o] = m; out[o] = activation(params.activation || 'relu', z[o]) * m;
        }
        masks.push(mask);
      }
      zs.push(z); activations.push(out); a = out;
    }
    return { output: a[0], activations, zs, masks };
  }

  function copyLayers(layers) { return layers.map(layer => ({ in:layer.in, out:layer.out, w:layer.w.slice(), b:layer.b.slice() })); }
  function mseForNetwork(layers, X, y, params) {
    if (!X || !X.length) return NaN; let s = 0; const rng = ML.mulberry32(1);
    for (let i = 0; i < X.length; i++) { const e = forwardNetwork(layers, X[i], params, false, rng).output - y[i]; s += e * e; }
    return s / X.length;
  }

  async function trainSingleANN(X, y, params, seed, progress, cancelCheck) {
    if (!X.length) throw new Error('No ANN training rows remain after preprocessing.');
    const hidden = parseHiddenLayers(params), parameterCount = annParameterCount(X[0].length, hidden);
    const hardLimit = Math.max(1000, Number(params.annHardLimit) || 1000000);
    if (parameterCount > hardLimit) throw new Error(`The ANN has ${parameterCount.toLocaleString()} trainable parameters, above the configured limit of ${hardLimit.toLocaleString()}. Reduce layer sizes.`);
    const epochs = Math.max(1, Math.min(1000, Math.round(Number(params.epochs) || 150)));
    const batchSize = Math.max(1, Math.min(X.length, Math.round(Number(params.batchSize) || 32)));
    const lr = Math.max(1e-6, Number(params.learningRate) || 0.001), l2 = Math.max(0, Number(params.l2) || 0);
    const patience = Math.max(1, Math.round(Number(params.patience) || 20)), minDelta = Math.max(0, Number(params.minDelta) || 1e-5);
    const validationX = params._validationX || [], validationY = params._validationY || [];
    let layers = initNetwork(X[0].length, hidden, params, seed), bestLayers = copyLayers(layers), bestLoss = Infinity, bestEpoch = 0, stale = 0;
    const rng = ML.mulberry32(seed + 31), history = [];
    const states = layers.map(layer => ({ mw:new Float64Array(layer.w.length), vw:new Float64Array(layer.w.length), mb:new Float64Array(layer.b.length), vb:new Float64Array(layer.b.length) }));
    let step = 0;
    for (let epoch = 1; epoch <= epochs; epoch++) {
      if (cancelCheck && cancelCheck()) throw new Error('Training cancelled.');
      const order = ML.shuffle(Array.from({ length:X.length }, (_,i)=>i), rng);
      for (let start = 0; start < order.length; start += batchSize) {
        const batch = order.slice(start, start + batchSize), grads = layers.map(layer => ({ w:new Float64Array(layer.w.length), b:new Float64Array(layer.b.length) }));
        for (const index of batch) {
          const pass = forwardNetwork(layers, X[index], params, true, rng);
          let delta = [2 * (pass.output - y[index])];
          for (let l = layers.length - 1; l >= 0; l--) {
            const layer = layers[l], aPrev = pass.activations[l], grad = grads[l];
            for (let o = 0; o < layer.out; o++) {
              grad.b[o] += delta[o]; const offset = o * layer.in;
              for (let i = 0; i < layer.in; i++) grad.w[offset + i] += delta[o] * aPrev[i];
            }
            if (l > 0) {
              const prevDelta = new Array(layer.in).fill(0);
              for (let i = 0; i < layer.in; i++) {
                let sum = 0; for (let o = 0; o < layer.out; o++) sum += layer.w[o * layer.in + i] * delta[o];
                prevDelta[i] = sum * activationDerivative(params.activation || 'relu', pass.zs[l - 1][i]) * pass.masks[l - 1][i];
              }
              delta = prevDelta;
            }
          }
        }
        step++;
        for (let l = 0; l < layers.length; l++) {
          const layer = layers[l], grad = grads[l], st = states[l], denom = batch.length;
          for (let i = 0; i < layer.w.length; i++) {
            let g = grad.w[i] / denom + l2 * layer.w[i];
            if ((params.optimizer || 'adam') === 'sgd') layer.w[i] -= lr * g;
            else {
              st.mw[i] = 0.9 * st.mw[i] + 0.1 * g; st.vw[i] = 0.999 * st.vw[i] + 0.001 * g * g;
              const mh = st.mw[i] / (1 - Math.pow(0.9, step)), vh = st.vw[i] / (1 - Math.pow(0.999, step));
              layer.w[i] -= lr * mh / (Math.sqrt(vh) + 1e-8);
            }
          }
          for (let i = 0; i < layer.b.length; i++) {
            const g = grad.b[i] / denom;
            if ((params.optimizer || 'adam') === 'sgd') layer.b[i] -= lr * g;
            else {
              st.mb[i] = 0.9 * st.mb[i] + 0.1 * g; st.vb[i] = 0.999 * st.vb[i] + 0.001 * g * g;
              const mh = st.mb[i] / (1 - Math.pow(0.9, step)), vh = st.vb[i] / (1 - Math.pow(0.999, step));
              layer.b[i] -= lr * mh / (Math.sqrt(vh) + 1e-8);
            }
          }
        }
      }
      const trainLoss = mseForNetwork(layers, X, y, params), validationLoss = validationX.length ? mseForNetwork(layers, validationX, validationY, params) : trainLoss;
      history.push({ epoch, trainLoss, validationLoss });
      if (validationLoss + minDelta < bestLoss) { bestLoss = validationLoss; bestEpoch = epoch; bestLayers = copyLayers(layers); stale = 0; }
      else stale++;
      if (progress) progress(epoch / epochs, `ANN epoch ${epoch} of ${epochs} · validation loss ${validationLoss.toPrecision(5)}`);
      if (epoch % 2 === 0) await delay();
      if (params.earlyStopping !== false && stale >= patience) break;
    }
    layers = bestLayers;
    const residuals = X.map((row,i)=>y[i]-forwardNetwork(layers,row,params,false,ML.mulberry32(1)).output);
    return { kind:'ann', layers, params:{ ...params, _validationX:undefined, _validationY:undefined, hiddenLayers:hidden }, parameterCount, trainingHistory:history, bestEpoch, bestValidationLoss:bestLoss, residualSd:Math.sqrt(ML.variance(residuals,true)) || 0 };
  }

  async function trainANN(X, y, params, seed, progress, cancelCheck) {
    const yMean=ML.mean(y), ySd=Math.sqrt(ML.variance(y))||1, yScaled=y.map(v=>(v-yMean)/ySd);
    const validationY=(params._validationY||[]).map(v=>(v-yMean)/ySd);
    const scaledParams={...params,_validationY:validationY};
    const attachScale=model=>{model.yMean=yMean;model.ySd=ySd;model.residualSd=(model.residualSd||0)*ySd;return model;};
    const ensembleSize = Math.max(1, Math.min(7, Math.round(Number(params.ensembleSize) || 1)));
    if (ensembleSize === 1) return attachScale(await trainSingleANN(X, yScaled, scaledParams, seed, progress, cancelCheck));
    const models = [];
    for (let i = 0; i < ensembleSize; i++) {
      const model = attachScale(await trainSingleANN(X, yScaled, { ...scaledParams, ensembleSize:1 }, seed + i * 1009,
        progress ? (fraction, message) => progress((i + fraction) / ensembleSize, `Ensemble ${i + 1}/${ensembleSize}: ${message}`) : null, cancelCheck));
      models.push(model); await delay();
    }
    return { kind:'ann-ensemble', models, params:{ ...params, ensembleSize }, parameterCount:models[0].parameterCount * ensembleSize,
      trainingHistory:models[0].trainingHistory, ensembleHistories:models.map(m=>m.trainingHistory), bestEpoch:models[0].bestEpoch,
      residualSd:ML.mean(models.map(m=>m.residualSd)), yMean, ySd };
  }

  function predictANNModel(model, X, stochastic, seed) {
    const rng = ML.mulberry32(seed || 1), mean=Number(model.yMean)||0, sd=Number(model.ySd)||1;
    return X.map(row => mean + sd * forwardNetwork(model.layers, row, model.params, Boolean(stochastic), rng).output);
  }

  // ---------- Public dispatch ----------
  ML.trainModel = async function (modelType, X, y, params, seed, progress, cancelCheck) {
    params = params || {};
    if (modelType === 'gp') return trainGP(X, y, params, seed || 42, progress, cancelCheck);
    if (modelType === 'ann') return trainANN(X, y, params, seed || 42, progress, cancelCheck);
    const validationX = params._validationX || [], validationY = params._validationY || [];
    const cleanParams = { ...params }; delete cleanParams._validationX; delete cleanParams._validationY;
    const model = await original.trainModel(modelType, X, y, cleanParams, seed, progress, cancelCheck);
    if (modelType === 'forest') {
      const trainSum = new Float64Array(X.length), valSum = new Float64Array(validationX.length), history = [];
      for (let t = 0; t < model.trees.length; t++) {
        const trainPred = original.predict(model.trees[t], X); for (let i=0;i<X.length;i++) trainSum[i]+=trainPred[i];
        if (validationX.length) { const valPred=original.predict(model.trees[t],validationX); for(let i=0;i<validationX.length;i++)valSum[i]+=valPred[i]; }
        const count=t+1;
        if (count<=10 || count===model.trees.length || count%Math.max(1,Math.round(model.trees.length/20))===0) {
          const tp=Array.from(trainSum,v=>v/count), vp=validationX.length?Array.from(valSum,v=>v/count):[];
          history.push({ trees:count, trainLoss:ML.metrics(y,tp).mse, validationLoss:validationX.length?ML.metrics(validationY,vp).mse:NaN });
        }
      }
      model.trainingHistory=history;
    } else if (modelType === 'tree' && validationX.length && params.recordHistory !== false) {
      const maxDepth=Math.max(1,Number(params.maxDepth)||8), depths=Array.from(new Set(Array.from({length:Math.min(12,maxDepth)},(_,i)=>1+Math.round(i*(maxDepth-1)/Math.max(1,Math.min(12,maxDepth)-1)))));
      const history=[];
      for (const depth of depths) {
        const candidate=await original.trainModel('tree',X,y,{...cleanParams,maxDepth:depth,recordHistory:false},(seed||42)+depth*17,null,cancelCheck);
        history.push({ depth, trainLoss:ML.metrics(y,original.predict(candidate,X)).mse, validationLoss:ML.metrics(validationY,original.predict(candidate,validationX)).mse });
        await delay();
      }
      model.trainingHistory=history;
    }
    return model;
  };

  ML.predict = function (model, X) {
    if (model.kind === 'gp') return gpPredictDistribution(model, X, false).mean;
    if (model.kind === 'ann') return predictANNModel(model, X, false, 1);
    if (model.kind === 'ann-ensemble') {
      const members = model.models.map((m,i)=>predictANNModel(m,X,false,100+i));
      return X.map((_,i)=>ML.mean(members.map(p=>p[i])));
    }
    return original.predict(model, X);
  };

  ML.predictWithIntervals = function (model, X, level, enabled) {
    if (enabled === false) return { prediction:ML.predict(model,X), lower:null, upper:null, level:Number(level||0.95), method:'Disabled', note:'' };
    const alpha = 1 - Number(level || 0.95), loQ = alpha/2, hiQ = 1-alpha/2, z = ML.inverseNormal(1-alpha/2);
    if (model.kind === 'gp') {
      const d = gpPredictDistribution(model, X, true), lower=d.mean.map((m,i)=>m-z*Math.sqrt(d.variance[i])), upper=d.mean.map((m,i)=>m+z*Math.sqrt(d.variance[i]));
      return { prediction:d.mean, lower, upper, standardDeviation:d.variance.map(Math.sqrt), level:Number(level||0.95), method:'Native Gaussian-process predictive interval', note:`Kernel ${model.params.kernel}; ${model.trainingRowsUsed} representative training rows` };
    }
    if (model.kind === 'ann-ensemble') {
      const distributions = model.models.map((m,i)=>predictANNModel(m,X,false,1000+i)), margin=z*(model.residualSd||0), lower=[], upper=[];
      for(let i=0;i<X.length;i++){const vals=distributions.map(v=>v[i]);lower.push(ML.quantile(vals,loQ)-margin);upper.push(ML.quantile(vals,hiQ)+margin);}
      return {prediction:ML.predict(model,X),lower,upper,level:Number(level||0.95),method:'Approximate neural-network ensemble interval',note:`${model.models.length} independently initialised networks plus residual variation`};
    }
    if (model.kind === 'ann') {
      const passes=Math.max(10,Math.min(300,Math.round(Number(model.params.mcPasses)||50))), distributions=[];
      for(let p=0;p<passes;p++)distributions.push(predictANNModel(model,X,true,5000+p));
      const prediction=ML.predict(model,X),margin=z*(model.residualSd||0),lower=[],upper=[];
      for(let i=0;i<X.length;i++){const vals=distributions.map(v=>v[i]);lower.push(ML.quantile(vals,loQ)-margin);upper.push(ML.quantile(vals,hiQ)+margin);}
      return {prediction,lower,upper,level:Number(level||0.95),method:'Approximate Monte Carlo dropout interval',note:`${passes} stochastic passes plus residual variation`};
    }
    return original.predictWithIntervals(model, X, level, enabled);
  };

  ML.featureImportance = function (model, featureNames) {
    if (model.kind === 'gp') {
      const value = 1 / Math.max(1e-9, Number(model.params.lengthScale) || 1);
      return featureNames.map(name=>({name,value}));
    }
    const ann = model.kind === 'ann-ensemble' ? model.models[0] : model.kind === 'ann' ? model : null;
    if (ann) {
      const first=ann.layers[0], values=new Array(first.in).fill(0);
      for(let o=0;o<first.out;o++)for(let i=0;i<first.in;i++)values[i]+=Math.abs(first.w[o*first.in+i]);
      const total=values.reduce((a,b)=>a+b,0)||1;
      return featureNames.map((name,i)=>({name,value:values[i]/total})).sort((a,b)=>b.value-a.value);
    }
    return original.featureImportance(model, featureNames);
  };

  ML.annParameterCount = annParameterCount;

  ML.candidateParams = function (modelType, tuningMode, manual, tuning, seed) {
    let candidates = original.candidateParams(modelType, tuningMode, manual, tuning, seed);
    if (modelType === 'gp' && manual.gpMode === 'auto') {
      const min=Math.max(20,Number(manual.autoSubsetMin)||100),max=Math.max(min,Number(manual.autoSubsetMax)||1000),count=Math.max(2,Math.min(8,Number(manual.autoSubsetCount)||5));
      const sizes=[];for(let i=0;i<count;i++)sizes.push(Math.round(min+i*(max-min)/(count-1)));
      const base=candidates.length?candidates:[manual];candidates=[];
      for(const b of base)for(const subsetSize of sizes)candidates.push({...b,gpMode:'subset',subsetSize});
      if(candidates.length>64)candidates=candidates.filter((_,i)=>i%Math.ceil(candidates.length/64)===0).slice(0,64);
    }
    if (modelType === 'ann') {
      const seen = new Set();
      candidates = candidates.map(sanitizeAnnParams).filter(candidate => {
        const key = JSON.stringify([candidate.hidden1,candidate.hidden2,candidate.hidden3,candidate.learningRate,candidate.dropout,candidate.l2]);
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
    }
    return candidates;
  };

  ML.tuneModel = async function (modelType, Xtrain, ytrain, Xvalidation, yvalidation, tuningMode, manual, tuning, seed, progress, cancelCheck) {
    if (modelType !== 'gp' && modelType !== 'ann') return original.tuneModel(modelType,Xtrain,ytrain,Xvalidation,yvalidation,tuningMode,manual,tuning,seed,progress,cancelCheck);
    const candidates=ML.candidateParams(modelType,tuningMode,manual,tuning,seed);
    if(candidates.length===1 && manual.gpMode!=='auto')return{bestParams:candidates[0],trials:[],candidateCount:1};
    const trials=[];
    for(let i=0;i<candidates.length;i++){
      if(cancelCheck&&cancelCheck())throw new Error('Training cancelled.');
      const candidate={...candidates[i],ensembleSize:1,optimizeIterations:modelType==='gp'?0:candidates[i].optimizeIterations,_validationX:modelType==='ann'?Xvalidation:undefined,_validationY:modelType==='ann'?yvalidation:undefined};
      const model=await ML.trainModel(modelType,Xtrain,ytrain,candidate,seed+i*101,null,cancelCheck);
      const score=ML.metrics(yvalidation,ML.predict(model,Xvalidation)).rmse;
      trials.push({params:{...candidates[i]},validationRmse:score,trainingHistory:model.trainingHistory||null});
      if(progress)progress((i+1)/candidates.length,`Tuning candidate ${i+1} of ${candidates.length}`);
      await delay();
    }
    let bestScore=Math.min(...trials.map(t=>t.validationRmse)), bestTrial=trials.find(t=>t.validationRmse===bestScore);
    if(modelType==='gp'&&manual.gpMode==='auto'){
      const tolerance=Math.max(0,Number(manual.subsetTolerance)||0.01),eligible=trials.filter(t=>t.validationRmse<=bestScore*(1+tolerance)).sort((a,b)=>(a.params.subsetSize||Infinity)-(b.params.subsetSize||Infinity));
      if(eligible.length)bestTrial=eligible[0];
    }
    const bestParams={...bestTrial.params}; if(modelType==='gp')bestParams.optimizeIterations=manual.optimizeIterations;
    return{bestParams,bestValidationRmse:bestTrial.validationRmse,trials,candidateCount:candidates.length};
  };

  ML.crossValidateRaw = async function(rawRows,target,features,preprocessConfig,profiles,targetTransformType,modelType,params,folds,seed,progress,cancelCheck){
    if(modelType!=='gp'&&modelType!=='ann')return original.crossValidateRaw(rawRows,target,features,preprocessConfig,profiles,targetTransformType,modelType,params,folds,seed,progress,cancelCheck);
    const usable=rawRows.filter(r=>Number.isFinite(ML.toNumber(r[target]))),k=Math.max(3,Math.min(10,Number(folds)||5));
    if(usable.length<k*2)throw new Error('Not enough training rows for the requested number of folds.');
    const indices=ML.shuffle(Array.from({length:usable.length},(_,i)=>i),ML.mulberry32(seed+313)),foldMetrics=[];
    for(let fold=0;fold<k;fold++){
      if(cancelCheck&&cancelCheck())throw new Error('Training cancelled.');
      const testIdx=indices.filter((_,i)=>i%k===fold),trainIdx=indices.filter((_,i)=>i%k!==fold),trainRows=ML.subset(usable,trainIdx),testRows=ML.subset(usable,testIdx);
      const pre=ML.fitPreprocessor(trainRows,features,preprocessConfig,profiles),tr=ML.transformRows(trainRows,pre,target,true),te=ML.transformRows(testRows,pre,target,true);
      const transform=ML.fitTargetTransform(tr.y,targetTransformType),ytr=ML.applyTargetTransform(tr.y,transform);
      const model=await ML.trainModel(modelType,tr.X,ytr,{...params,ensembleSize:1,_validationX:modelType==='ann'?te.X:undefined,_validationY:modelType==='ann'?ML.applyTargetTransform(te.y,transform):undefined,optimizeIterations:modelType==='gp'?0:params.optimizeIterations},seed+fold*1009,null,cancelCheck);
      ML.fitSmearing(transform,ytr,ML.predict(model,tr.X));
      const predOriginal=ML.inverseTargetTransform(ML.predict(model,te.X),transform,true);foldMetrics.push(ML.metrics(te.y,predOriginal));
      if(progress)progress((fold+1)/k,`Cross-validation fold ${fold+1} of ${k}`);await delay();
    }
    const average={};for(const key of ['r2','rmse','mae','mse'])average[key]=ML.mean(foldMetrics.map(m=>m[key]));
    return{folds:k,foldMetrics,average};
  };

  global.AdvancedML = { version:'1.0.11', kernelValue, annParameterCount, sanitizeAnnParams };
})(window);
