(function (global) {
  'use strict';

  const VERSION = '1.0.11';
  const MODEL_ORDER = ['linear','ridge','elasticnet','robust','tree','forest','gboost','knn','quantile','gp','ann'];

  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === 'object') {
      return Object.keys(value).sort().reduce((out, key) => {
        if (typeof value[key] !== 'undefined') out[key] = stableValue(value[key]);
        return out;
      }, {});
    }
    return value;
  }

  function stableStringify(value) { return JSON.stringify(stableValue(value)); }

  function comparisonDescriptor(artifact) {
    const a = artifact || {};
    const record = a.experimentRecord || {};
    return stableValue({
      datasetFingerprint: a.dataset && a.dataset.fingerprint ? a.dataset.fingerprint.value || null : null,
      datasetRows: a.dataset ? a.dataset.rowCount || null : null,
      target: a.target || null,
      selectedFeatures: clone(a.selectedFeatures || []),
      targetTransform: a.targetTransform ? {
        type: a.targetTransform.type || 'none',
        lambda: Number.isFinite(Number(a.targetTransform.lambda)) ? Number(a.targetTransform.lambda) : null
      } : { type:'none', lambda:null },
      preprocessing: clone(a.preprocessor && a.preprocessor.config ? a.preprocessor.config : null),
      splitConfig: clone(a.splitConfig || null),
      splitMembership: clone(record.splitMembership || null),
      intervalLevel: a.uncertainty && a.uncertainty.enabled ? Number(a.uncertainty.level) || null : null
    });
  }

  async function comparisonKey(artifact, sha256Hex) {
    const descriptor = comparisonDescriptor(artifact);
    const hash = await sha256Hex(stableStringify(descriptor));
    return `comparison-${hash}`;
  }

  function areComparable(left, right) {
    if (!left || !right) return false;
    if (left.comparisonKey && right.comparisonKey) return left.comparisonKey === right.comparisonKey;
    return stableStringify(comparisonDescriptor(left)) === stableStringify(comparisonDescriptor(right));
  }

  function metric(artifact, dataset, family, name) {
    const branch = artifact && artifact.evaluation && artifact.evaluation[dataset];
    const group = branch && branch[family];
    const value = group && group[name];
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }

  function elapsedMs(artifact) {
    const execution = artifact && artifact.experimentRecord && artifact.experimentRecord.execution;
    if (!execution || !execution.startedAt || !execution.finishedAt) return null;
    const duration = Date.parse(execution.finishedAt) - Date.parse(execution.startedAt);
    return Number.isFinite(duration) && duration >= 0 ? duration : null;
  }

  function leaderboardRow(artifact, activeArtifact, preferredExperimentId) {
    const definition = global.LRSPlatform && artifact && artifact.modelType
      ? global.LRSPlatform.getModelDefinition(artifact.modelType) : null;
    return {
      experimentId: artifact && artifact.experimentId || null,
      modelType: artifact && artifact.modelType || null,
      modelLabel: definition ? definition.label : (artifact && artifact.modelType || 'Unknown model'),
      createdAt: artifact && artifact.createdAt || null,
      validationRmse: metric(artifact,'validation','pointMetrics','rmse'),
      testRmse: metric(artifact,'test','pointMetrics','rmse'),
      testMae: metric(artifact,'test','pointMetrics','mae'),
      testR2: metric(artifact,'test','pointMetrics','r2'),
      testCoverage: metric(artifact,'test','uncertaintyMetrics','coverage'),
      meanIntervalWidth: metric(artifact,'test','uncertaintyMetrics','meanWidth'),
      intervalScore: metric(artifact,'test','uncertaintyMetrics','intervalScore'),
      elapsedMs: elapsedMs(artifact),
      validationStatus: artifact && artifact.validation && artifact.validation.acceptance ? artifact.validation.acceptance.overall : 'not-evaluated',
      approvalStatus: artifact && artifact.approval ? artifact.approval.status || 'draft' : 'draft',
      comparable: activeArtifact ? areComparable(artifact, activeArtifact) : true,
      active: Boolean(activeArtifact && artifact && activeArtifact.experimentId === artifact.experimentId),
      preferred: Boolean(preferredExperimentId && artifact && preferredExperimentId === artifact.experimentId)
    };
  }

  function sortRows(rows, key) {
    const direction = key === 'testR2' ? -1 : 1;
    return rows.slice().sort((a,b) => {
      if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
      const av = a[key], bv = b[key];
      if (av == null && bv == null) return MODEL_ORDER.indexOf(a.modelType) - MODEL_ORDER.indexOf(b.modelType);
      if (av == null) return 1;
      if (bv == null) return -1;
      return direction * (av - bv);
    });
  }


  function describeDifferences(left, right) {
    const a = comparisonDescriptor(left), b = comparisonDescriptor(right);
    const differences = [];
    const add = (label, key) => { if (stableStringify(a[key]) !== stableStringify(b[key])) differences.push(label); };
    add('Dataset fingerprint or row count', 'datasetFingerprint');
    add('Target column', 'target');
    add('Selected features', 'selectedFeatures');
    add('Target transformation', 'targetTransform');
    add('Preprocessing configuration', 'preprocessing');
    add('Split configuration', 'splitConfig');
    add('Exact train/validation/test membership', 'splitMembership');
    add('Requested interval level', 'intervalLevel');
    return differences.length ? differences : ['No descriptor difference was detected; schema or metadata may be incomplete.'];
  }

  function baselineParameters(type, context) {
    const rows = Math.max(0, Number(context && context.trainingRows) || 0);
    const defaults = {
      linear: {},
      ridge: { lambda:1 },
      tree: { maxDepth:8, minLeaf:5, maxThresholds:24, maxFeatures:'all' },
      forest: { nTrees:40, maxDepth:8, minLeaf:5, sampleRate:0.8, maxThresholds:20, maxFeatures:'sqrt', maxRowsPerTree:20000 },
      gp: {
        gpMode: rows > 800 ? 'subset' : 'exact', kernel:'rbf', lengthScale:1, signalVariance:1,
        noiseStd:0.1, jitter:1e-8, optimizeIterations:8, rqAlpha:1,
        subsetSize:Math.max(20, Math.min(500, rows || 500)), subsetMethod:'farthest',
        autoSubsetMin:100, autoSubsetMax:Math.max(100, Math.min(1000, rows || 1000)),
        autoSubsetCount:5, subsetTolerance:0.01, gpHardLimit:2000
      },
      ann: {
        hidden1:64, hidden2:32, hidden3:0, activation:'relu', optimizer:'adam', learningRate:0.001,
        batchSize:32, epochs:120, dropout:0.1, l2:0.0001, patience:15, minDelta:1e-5,
        earlyStopping:true, uncertaintyMethod:'mc', mcPasses:40, ensembleSize:1, annHardLimit:1000000
      },
      elasticnet: { lambda:0.1, l1Ratio:0.5, maxIterations:500, tolerance:1e-6 },
      robust: { huberDelta:1.345, maxIterations:80, tolerance:1e-6, ridge:1e-8 },
      gboost: { nEstimators:80, learningRate:0.05, maxDepth:3, minLeaf:5, sampleRate:0.8, maxThresholds:20 },
      knn: { k:7, weighting:'distance', distancePower:2, maxRows:25000 },
      quantile: { quantile:0.5, lowerQuantile:0.05, upperQuantile:0.95, iterations:1500, learningRate:0.03, l2:0.0001 }
    };
    if (!Object.prototype.hasOwnProperty.call(defaults, type)) throw new Error(`Unsupported comparison model: ${type}`);
    return clone(defaults[type]);
  }

  function experimentLabel(artifact) {
    const type = artifact && artifact.modelType || 'model';
    const id = artifact && artifact.experimentId ? artifact.experimentId.split('-').pop().slice(0,8) : 'unknown';
    return `${type}-${id}`;
  }

  global.LRSComparison = Object.freeze({
    version: VERSION,
    modelOrder: MODEL_ORDER.slice(),
    stableStringify,
    comparisonDescriptor,
    comparisonKey,
    areComparable,
    describeDifferences,
    leaderboardRow,
    sortRows,
    baselineParameters,
    experimentLabel
  });
})(typeof window !== 'undefined' ? window : globalThis);
