(function (global) {
  'use strict';

  const APP_VERSION = '1.0.11';
  const MODEL_SCHEMA_VERSION = 10;
  const PROJECT_SCHEMA_VERSION = 10;
  const EXPERIMENT_SCHEMA_VERSION = 6;
  const APPROVED_PACKAGE_SCHEMA_VERSION = 2;
  const FINGERPRINT_CANONICALIZATION = 'UTF-8 text; BOM removed; CRLF and CR line endings normalized to LF';

  const MODEL_DEFINITIONS = Object.freeze({
    linear: Object.freeze({
      label: 'Linear regression',
      capabilities: Object.freeze({ nativeUncertainty:true, approximateUncertainty:false, trainingHistory:false, featureImportance:true, iterativeTraining:false })
    }),
    ridge: Object.freeze({
      label: 'Ridge regression',
      capabilities: Object.freeze({ nativeUncertainty:false, approximateUncertainty:true, trainingHistory:true, featureImportance:true, iterativeTraining:false })
    }),
    tree: Object.freeze({
      label: 'Decision-tree regression',
      capabilities: Object.freeze({ nativeUncertainty:false, approximateUncertainty:true, trainingHistory:true, featureImportance:true, iterativeTraining:true })
    }),
    forest: Object.freeze({
      label: 'Random-forest regression',
      capabilities: Object.freeze({ nativeUncertainty:false, approximateUncertainty:true, trainingHistory:true, featureImportance:true, iterativeTraining:true })
    }),
    gp: Object.freeze({
      label: 'Gaussian-process regression',
      capabilities: Object.freeze({ nativeUncertainty:true, approximateUncertainty:false, trainingHistory:true, featureImportance:true, iterativeTraining:true })
    }),
    ann: Object.freeze({
      label: 'Artificial neural-network regression',
      capabilities: Object.freeze({ nativeUncertainty:false, approximateUncertainty:true, trainingHistory:true, featureImportance:true, iterativeTraining:true })
    }),
    elasticnet: Object.freeze({
      label: 'Elastic-net regression',
      capabilities: Object.freeze({ nativeUncertainty:false, approximateUncertainty:true, trainingHistory:true, featureImportance:true, iterativeTraining:true })
    }),
    robust: Object.freeze({
      label: 'Huber robust regression',
      capabilities: Object.freeze({ nativeUncertainty:false, approximateUncertainty:true, trainingHistory:true, featureImportance:true, iterativeTraining:true })
    }),
    gboost: Object.freeze({
      label: 'Gradient-boosted trees',
      capabilities: Object.freeze({ nativeUncertainty:false, approximateUncertainty:true, trainingHistory:true, featureImportance:true, iterativeTraining:true })
    }),
    knn: Object.freeze({
      label: 'k-nearest-neighbour regression',
      capabilities: Object.freeze({ nativeUncertainty:false, approximateUncertainty:true, trainingHistory:false, featureImportance:false, iterativeTraining:false })
    }),
    quantile: Object.freeze({
      label: 'Linear quantile regression',
      capabilities: Object.freeze({ nativeUncertainty:true, approximateUncertainty:false, trainingHistory:true, featureImportance:true, iterativeTraining:true })
    })
  });

  function nowIso() { return new Date().toISOString(); }

  function randomId(prefix) {
    const p = prefix || 'id';
    if (global.crypto && typeof global.crypto.randomUUID === 'function') return `${p}-${global.crypto.randomUUID()}`;
    const random = Math.random().toString(36).slice(2, 12);
    return `${p}-${Date.now().toString(36)}-${random}`;
  }

  function cloneJson(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function normalizeTextForFingerprint(text) {
    return String(text == null ? '' : text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  }

  function utf8Bytes(text) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text);
    const encoded = unescape(encodeURIComponent(text));
    const output = new Uint8Array(encoded.length);
    for (let i = 0; i < encoded.length; i++) output[i] = encoded.charCodeAt(i);
    return output;
  }

  // Compact deterministic SHA-256 fallback for browser contexts without SubtleCrypto.
  function sha256Fallback(text) {
    const bytes = Array.from(utf8Bytes(text));
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    const high = Math.floor(bitLength / 0x100000000);
    const low = bitLength >>> 0;
    for (let shift = 24; shift >= 0; shift -= 8) bytes.push((high >>> shift) & 255);
    for (let shift = 24; shift >= 0; shift -= 8) bytes.push((low >>> shift) & 255);

    const k = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    const w = new Uint32Array(64);

    for (let offset = 0; offset < bytes.length; offset += 64) {
      for (let i = 0; i < 16; i++) {
        const j = offset + i * 4;
        w[i] = ((bytes[j] << 24) | (bytes[j+1] << 16) | (bytes[j+2] << 8) | bytes[j+3]) >>> 0;
      }
      for (let i = 16; i < 64; i++) {
        const s0 = (rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15] >>> 3)) >>> 0;
        const s1 = (rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2] >>> 10)) >>> 0;
        w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0;
      }
      let [a,b,c,d,e,f,g,hh] = h;
      for (let i = 0; i < 64; i++) {
        const s1 = (rotr(e,6) ^ rotr(e,11) ^ rotr(e,25)) >>> 0;
        const ch = ((e & f) ^ ((~e) & g)) >>> 0;
        const t1 = (hh + s1 + ch + k[i] + w[i]) >>> 0;
        const s0 = (rotr(a,2) ^ rotr(a,13) ^ rotr(a,22)) >>> 0;
        const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        const t2 = (s0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0]=(h[0]+a)>>>0; h[1]=(h[1]+b)>>>0; h[2]=(h[2]+c)>>>0; h[3]=(h[3]+d)>>>0;
      h[4]=(h[4]+e)>>>0; h[5]=(h[5]+f)>>>0; h[6]=(h[6]+g)>>>0; h[7]=(h[7]+hh)>>>0;
    }
    return h.map(value => value.toString(16).padStart(8,'0')).join('');
  }

  async function sha256Hex(text) {
    const normalized = normalizeTextForFingerprint(text);
    if (global.crypto && global.crypto.subtle && typeof global.crypto.subtle.digest === 'function') {
      try {
        const digest = await global.crypto.subtle.digest('SHA-256', utf8Bytes(normalized));
        return Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2,'0')).join('');
      } catch (_) { /* Use deterministic fallback. */ }
    }
    return sha256Fallback(normalized);
  }

  async function fingerprintText(text) {
    return {
      algorithm: 'SHA-256',
      canonicalization: FINGERPRINT_CANONICALIZATION,
      value: await sha256Hex(text)
    };
  }

  class JobManager {
    constructor() { this.jobs = new Map(); }

    start(type, metadata) {
      const record = {
        id: randomId('job'),
        type: String(type || 'job'),
        status: 'running',
        progress: 0,
        message: '',
        metadata: cloneJson(metadata || {}),
        startedAt: nowIso(),
        finishedAt: null,
        cancelRequested: false,
        error: null
      };
      const handle = {
        id: record.id,
        update(progress, message) {
          if (record.status !== 'running') return;
          if (Number.isFinite(Number(progress))) record.progress = Math.max(0, Math.min(1, Number(progress)));
          if (message != null) record.message = String(message);
        },
        requestCancel() { if (record.status === 'running') record.cancelRequested = true; },
        isCancellationRequested() { return record.cancelRequested; },
        complete(resultMetadata) {
          if (record.status !== 'running') return;
          record.status = 'completed';
          record.progress = 1;
          record.finishedAt = nowIso();
          if (resultMetadata) record.resultMetadata = cloneJson(resultMetadata);
        },
        cancel(message) {
          if (record.status !== 'running') return;
          record.status = 'cancelled';
          record.cancelRequested = true;
          record.message = message || record.message || 'Cancelled';
          record.finishedAt = nowIso();
        },
        fail(error) {
          if (record.status !== 'running') return;
          record.status = 'failed';
          record.error = error && error.message ? error.message : String(error || 'Unknown error');
          record.finishedAt = nowIso();
        },
        snapshot() { return cloneJson(record); }
      };
      this.jobs.set(record.id, { record, handle });
      return handle;
    }

    get(id) {
      const entry = this.jobs.get(id);
      return entry ? cloneJson(entry.record) : null;
    }

    list() { return Array.from(this.jobs.keys()).map(id => this.get(id)); }
  }

  function getModelDefinition(type) {
    const definition = MODEL_DEFINITIONS[type];
    if (!definition) throw new Error(`Unsupported model type: ${type}`);
    return definition;
  }

  function getModelAdapter(type) {
    const definition = getModelDefinition(type);
    return Object.freeze({
      type,
      label: definition.label,
      capabilities: definition.capabilities,
      fit(X, y, params, seed, progress, cancelCheck) {
        if (!global.MLCore) throw new Error('MLCore is unavailable.');
        return global.MLCore.trainModel(type, X, y, params, seed, progress, cancelCheck);
      },
      predict(model, X) {
        if (!global.MLCore) throw new Error('MLCore is unavailable.');
        return global.MLCore.predict(model, X);
      },
      predictWithIntervals(model, X, level) {
        if (!global.MLCore) throw new Error('MLCore is unavailable.');
        return global.MLCore.predictWithIntervals(model, X, level);
      },
      featureImportance(model, featureNames) {
        if (!global.MLCore) throw new Error('MLCore is unavailable.');
        return global.MLCore.featureImportance(model, featureNames);
      },
      serialize(model) { return cloneJson(model); },
      deserialize(model) { return cloneJson(model); }
    });
  }

  function normalizeDatasetMetadata(dataset) {
    const d = dataset || {};
    return {
      fileName: d.fileName || null,
      rowCount: Number.isFinite(Number(d.rowCount)) ? Number(d.rowCount) : null,
      columnCount: Number.isFinite(Number(d.columnCount)) ? Number(d.columnCount) : null,
      fingerprint: d.fingerprint ? cloneJson(d.fingerprint) : null,
      legacy: Boolean(d.legacy)
    };
  }

  function createExperimentRecord(options) {
    const o = options || {};
    const artifact = o.artifact || {};
    const record = {
      artifactType: 'local-regression-experiment',
      schemaVersion: EXPERIMENT_SCHEMA_VERSION,
      experimentId: o.experimentId || artifact.experimentId || randomId('experiment'),
      applicationVersion: APP_VERSION,
      createdAt: o.createdAt || artifact.createdAt || nowIso(),
      originalCsvIncluded: false,
      dataset: normalizeDatasetMetadata(o.dataset || artifact.dataset),
      configuration: {
        target: artifact.target || null,
        selectedFeatures: cloneJson(artifact.selectedFeatures || []),
        targetTransform: cloneJson(artifact.targetTransform || null),
        preprocessing: cloneJson(artifact.preprocessor && artifact.preprocessor.config ? artifact.preprocessor.config : null),
        split: cloneJson(artifact.splitConfig || null),
        randomSeed: artifact.splitConfig && artifact.splitConfig.seed != null ? artifact.splitConfig.seed : null,
        modelType: artifact.modelType || null,
        modelCapabilities: artifact.modelType && MODEL_DEFINITIONS[artifact.modelType]
          ? cloneJson(MODEL_DEFINITIONS[artifact.modelType].capabilities) : null,
        modelParameters: cloneJson(artifact.modelParameters || null),
        tuning: cloneJson(artifact.tuning || null),
        uncertainty: cloneJson(artifact.uncertainty || null)
      },
      splitSummary: cloneJson(artifact.splitSummary || null),
      splitMembership: cloneJson(o.splitMembership || null),
      comparisonKey: o.comparisonKey || artifact.comparisonKey || null,
      comparisonDescriptor: cloneJson(o.comparisonDescriptor || artifact.comparisonDescriptor || null),
      label: o.label || artifact.experimentLabel || null,
      evaluation: cloneJson(artifact.evaluation || null),
      validation: cloneJson(artifact.validation || null),
      approval: cloneJson(artifact.approval || { status:'draft', history:[] }),
      monitoring: cloneJson(artifact.monitoring || null),
      governance: cloneJson(artifact.governance || null),
      warnings: cloneJson(o.warnings || []),
      execution: cloneJson(o.job || null),
      status: o.status || 'completed'
    };
    return record;
  }

  function legacyExperimentFromArtifact(artifact) {
    return createExperimentRecord({
      artifact,
      experimentId: artifact.experimentId || randomId('legacy-experiment'),
      dataset: artifact.dataset || { fileName:null, rowCount:null, columnCount:null, fingerprint:null, legacy:true },
      warnings: ['Migrated from a pre-v0.2.2 artifact. Dataset fingerprint and exact split membership may be unavailable.'],
      status: 'migrated'
    });
  }

  function normalizeExperimentRecord(record, artifact) {
    if (!record || record.artifactType !== 'local-regression-experiment') return legacyExperimentFromArtifact(artifact || {});
    const copy = cloneJson(record);
    copy.schemaVersion = EXPERIMENT_SCHEMA_VERSION;
    copy.applicationVersion = copy.applicationVersion || APP_VERSION;
    copy.originalCsvIncluded = false;
    copy.dataset = normalizeDatasetMetadata(copy.dataset || (artifact && artifact.dataset));
    copy.warnings = Array.isArray(copy.warnings) ? copy.warnings : [];
    copy.status = copy.status || 'completed';
    copy.comparisonKey = copy.comparisonKey || (artifact && artifact.comparisonKey) || null;
    copy.comparisonDescriptor = cloneJson(copy.comparisonDescriptor || (artifact && artifact.comparisonDescriptor) || null);
    copy.label = copy.label || (artifact && artifact.experimentLabel) || null;
    copy.validation = cloneJson(copy.validation || (artifact && artifact.validation) || null);
    copy.approval = cloneJson(copy.approval || (artifact && artifact.approval) || { status:'draft', history:[] });
    copy.monitoring = cloneJson(copy.monitoring || (artifact && artifact.monitoring) || null);
    copy.governance = cloneJson(copy.governance || (artifact && artifact.governance) || null);
    return copy;
  }

  function migrateModelArtifact(input) {
    if (!input || input.artifactType !== 'local-regression-model') throw new Error('This is not a recognised Local Regression Studio model.');
    const artifact = cloneJson(input);
    const previousVersion = Number(artifact.schemaVersion) || 1;
    const sourceAppVersion = artifact.appVersion || '0.1.0';
    if (!artifact.targetTransform) artifact.targetTransform = { type:'none', lambda:null, smearingFactor:1 };
    if (!artifact.uncertainty) artifact.uncertainty = { enabled:false, level:.95, method:'Unavailable', note:'Loaded from an earlier release.' };
    artifact.dataset = normalizeDatasetMetadata(artifact.dataset || { legacy:true });
    artifact.comparisonKey = artifact.comparisonKey || null;
    artifact.comparisonDescriptor = cloneJson(artifact.comparisonDescriptor || null);
    artifact.experimentLabel = artifact.experimentLabel || null;
    artifact.validation = cloneJson(artifact.validation || { dataQuality:null, criteria:null, acceptance:null, groupColumn:null });
    artifact.approval = cloneJson(artifact.approval || { schemaVersion:2, status:'draft', modelName:'', developer:'', owner:'', reviewer:'', approver:'', operator:'', administrator:'', reviewerRole:'reviewer', decisionDate:'', reviewDate:'', intendedUse:'', prohibitedUses:'', limitations:'', conditions:'', notes:'', featureUnits:{}, featureDescriptions:{}, history:[] });
    artifact.approval.schemaVersion = 2;
    artifact.monitoring = cloneJson(artifact.monitoring || { records:[], latest:null, rules:null, revalidation:null });
    artifact.governance = cloneJson(artifact.governance || { lifecycleStatus:artifact.approval.status || 'draft', changeAssessments:[], revalidationTriggers:[] });
    artifact.experimentRecord = normalizeExperimentRecord(artifact.experimentRecord, artifact);
    artifact.experimentId = artifact.experimentRecord.experimentId;
    artifact.schemaVersion = MODEL_SCHEMA_VERSION;
    artifact.sourceAppVersion = artifact.sourceAppVersion || sourceAppVersion;
    artifact.appVersion = APP_VERSION;
    artifact.originalCsvIncluded = false;
    artifact.migration = previousVersion < MODEL_SCHEMA_VERSION ? {
      fromSchemaVersion: previousVersion,
      toSchemaVersion: MODEL_SCHEMA_VERSION,
      sourceAppVersion,
      migratedAt: nowIso()
    } : artifact.migration || null;
    return artifact;
  }

  function migrateProject(input) {
    if (!input || input.artifactType !== 'local-regression-project' || (!input.artifact && !Array.isArray(input.artifacts))) throw new Error('This is not a recognised project file.');
    const project = cloneJson(input);
    const previousVersion = Number(project.schemaVersion) || 1;
    const sourceArtifact = project.artifact || (Array.isArray(project.artifacts) ? project.artifacts[0] : null);
    const sourceAppVersion = project.appVersion || (sourceArtifact && sourceArtifact.appVersion) || '0.1.0';
    const incomingArtifacts = Array.isArray(project.artifacts) && project.artifacts.length ? project.artifacts : [sourceArtifact];
    project.artifacts = incomingArtifacts.filter(Boolean).map(migrateModelArtifact);
    if (!project.artifacts.length) throw new Error('The project contains no fitted model artifacts.');
    const requestedActive = project.activeExperimentId || (project.artifact && project.artifact.experimentId);
    project.artifact = project.artifacts.find(item => item.experimentId === requestedActive) || project.artifacts[0];
    project.activeExperimentId = project.artifact.experimentId;
    const recordMap = new Map();
    const records = Array.isArray(project.experiments) ? project.experiments : [];
    records.forEach(record => {
      const related = project.artifacts.find(item => item.experimentId === record.experimentId) || project.artifact;
      const normalized = normalizeExperimentRecord(record, related);
      recordMap.set(normalized.experimentId, normalized);
    });
    project.artifacts.forEach(item => {
      const record = normalizeExperimentRecord(item.experimentRecord, item);
      item.experimentRecord = record;
      if (!recordMap.has(record.experimentId)) recordMap.set(record.experimentId, record);
    });
    project.experiments = Array.from(recordMap.values());
    project.preferredExperimentId = project.preferredExperimentId || null;
    project.monitoringRecords = Array.isArray(project.monitoringRecords) ? project.monitoringRecords : project.artifacts.flatMap(item => item.monitoring && Array.isArray(item.monitoring.records) ? item.monitoring.records : []);
    project.governance = cloneJson(project.governance || { lifecycleEvents:[], changeAssessments:[] });
    project.schemaVersion = PROJECT_SCHEMA_VERSION;
    project.sourceAppVersion = project.sourceAppVersion || sourceAppVersion;
    project.appVersion = APP_VERSION;
    project.originalCsvIncluded = false;
    project.migration = previousVersion < PROJECT_SCHEMA_VERSION ? {
      fromSchemaVersion: previousVersion,
      toSchemaVersion: PROJECT_SCHEMA_VERSION,
      sourceAppVersion,
      migratedAt: nowIso()
    } : project.migration || null;
    return project;
  }

  function compactExperimentRecord(record) {
    const copy = cloneJson(record);
    if (!copy) return copy;
    delete copy.splitMembership;
    if (copy.comparisonDescriptor) delete copy.comparisonDescriptor.splitMembership;
    return copy;
  }

  global.LRSPlatform = Object.freeze({
    version: APP_VERSION,
    schemas: Object.freeze({ model:MODEL_SCHEMA_VERSION, project:PROJECT_SCHEMA_VERSION, experiment:EXPERIMENT_SCHEMA_VERSION, approvedPackage:APPROVED_PACKAGE_SCHEMA_VERSION }),
    modelDefinitions: MODEL_DEFINITIONS,
    getModelDefinition,
    getModelAdapter,
    JobManager,
    randomId,
    normalizeTextForFingerprint,
    sha256Hex,
    fingerprintText,
    createExperimentRecord,
    normalizeExperimentRecord,
    migrateModelArtifact,
    migrateProject,
    compactExperimentRecord,
    cloneJson
  });
})(typeof window !== 'undefined' ? window : globalThis);
