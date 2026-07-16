(function (global) {
  'use strict';

  const PACKAGE_SCHEMA_VERSION = 2;
  const APPROVAL_STATUSES = Object.freeze(['draft','under-review','validation-failed','approved','approved-with-conditions','suspended','expired','rejected','retired']);

  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function nowIso() { return new Date().toISOString(); }
  function todayIso() { return nowIso().slice(0,10); }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === 'object') {
      const output = {};
      Object.keys(value).sort().forEach(key => { output[key] = stableValue(value[key]); });
      return output;
    }
    return value;
  }

  function stableStringify(value) { return JSON.stringify(stableValue(value)); }

  function normalizeApproval(input) {
    const source = input || {};
    const status = APPROVAL_STATUSES.includes(source.status) ? source.status : 'draft';
    return {
      schemaVersion: 2,
      status,
      modelName: String(source.modelName || ''),
      developer: String(source.developer || ''),
      owner: String(source.owner || ''),
      reviewer: String(source.reviewer || ''),
      approver: String(source.approver || source.reviewer || ''),
      operator: String(source.operator || ''),
      administrator: String(source.administrator || ''),
      reviewerRole: String(source.reviewerRole || 'reviewer'),
      decisionDate: String(source.decisionDate || ''),
      reviewDate: String(source.reviewDate || ''),
      intendedUse: String(source.intendedUse || ''),
      prohibitedUses: String(source.prohibitedUses || ''),
      limitations: String(source.limitations || ''),
      conditions: String(source.conditions || ''),
      notes: String(source.notes || ''),
      featureUnits: clone(source.featureUnits || {}),
      featureDescriptions: clone(source.featureDescriptions || {}),
      monitoringRequirements: clone(source.monitoringRequirements || {}),
      history: Array.isArray(source.history) ? clone(source.history) : []
    };
  }

  function buildInputSchema(artifact, metadata) {
    const approval = normalizeApproval(metadata || (artifact && artifact.approval));
    const preprocessor = artifact && artifact.preprocessor;
    const features = preprocessor && Array.isArray(preprocessor.features) ? preprocessor.features : [];
    return {
      schemaVersion: 1,
      target: artifact && artifact.target || null,
      requiredColumns: features.map(feature => feature.name),
      features: features.map(feature => {
        const base = {
          name: feature.name,
          type: feature.type,
          required: true,
          missingRule: feature.missing || null,
          unit: approval.featureUnits[feature.name] || '',
          description: approval.featureDescriptions[feature.name] || ''
        };
        if (feature.type === 'numeric') {
          base.trainingMinimum = Number.isFinite(Number(feature.min)) ? Number(feature.min) : null;
          base.trainingMaximum = Number.isFinite(Number(feature.max)) ? Number(feature.max) : null;
          base.trainingMean = Number.isFinite(Number(feature.mean)) ? Number(feature.mean) : null;
          base.trainingStandardDeviation = Number.isFinite(Number(feature.sd)) ? Number(feature.sd) : null;
        } else {
          base.allowedCategories = Array.isArray(feature.categories) ? feature.categories.filter(value => !String(value).startsWith('__')) : [];
          base.supportsOtherCategory = Array.isArray(feature.categories) && feature.categories.includes('__OTHER__');
          base.encoding = feature.encoding || null;
        }
        return base;
      })
    };
  }

  function validateApproval(approvalInput, acceptance) {
    const approval = normalizeApproval(approvalInput);
    const errors = [], warnings = [];
    const lifecycleStatus = global.LRSGovernance ? global.LRSGovernance.lifecycleStatus(approval) : approval.status;
    const operational = lifecycleStatus === 'approved' || lifecycleStatus === 'approved-with-conditions';
    if (operational) {
      if (!approval.modelName.trim()) errors.push('Enter a model name before approval.');
      if (!approval.owner.trim()) errors.push('Enter the model owner.');
      if (!approval.reviewer.trim() && !approval.approver.trim()) errors.push('Enter the reviewer or approver name.');
      if (!approval.intendedUse.trim()) errors.push('Describe the intended use.');
      if (!approval.reviewDate) errors.push('Set a review date.');
      if (approval.reviewDate && approval.reviewDate < todayIso()) errors.push('The review date is already in the past.');
      if (lifecycleStatus === 'approved' && (!acceptance || acceptance.overall !== 'pass')) errors.push('Full approval requires the configured validation criteria to pass.');
      if (lifecycleStatus === 'approved-with-conditions' && !approval.conditions.trim()) errors.push('Describe the conditions attached to approval.');
      if (!approval.prohibitedUses.trim()) warnings.push('No prohibited or unsupported use has been documented.');
      if (!approval.limitations.trim()) warnings.push('No model limitation has been documented.');
    }
    if (approval.status === 'draft') warnings.push('The model remains in draft status.');
    if (approval.status === 'under-review') warnings.push('The model is under review and is not yet operational.');
    if (approval.status === 'validation-failed') warnings.push('The model failed validation and must not be used operationally.');
    if (approval.status === 'suspended') warnings.push('The model is suspended and must not be used for routine prediction.');
    if (approval.status === 'expired' || lifecycleStatus === 'expired') warnings.push('The model approval has expired.');
    if (approval.status === 'rejected') warnings.push('Rejected models must not be exported as approved prediction packages.');
    if (approval.status === 'retired') warnings.push('Retired models must not be used for routine prediction.');
    return { valid:errors.length === 0, operational:operational && errors.length === 0, errors, warnings, approval, lifecycleStatus };
  }

  function appendDecisionHistory(previousInput, nextInput) {
    const previous = normalizeApproval(previousInput);
    const next = normalizeApproval(nextInput);
    const changed = previous.status !== next.status || previous.reviewer !== next.reviewer || previous.notes !== next.notes || previous.reviewDate !== next.reviewDate;
    if (!changed) { next.history = clone(previous.history); return next; }
    if (global.LRSGovernance) return global.LRSGovernance.appendLifecycleEvent(previous, next, next.reviewerRole);
    next.history = Array.isArray(previous.history) ? clone(previous.history) : [];
    next.history.push({ fromStatus:previous.status, status:next.status, recordedAt:nowIso(), reviewer:next.reviewer || null, reviewDate:next.reviewDate || null, note:next.notes || next.conditions || null, applicationVersion:'1.0.11' });
    return next;
  }

  function isExpired(approvalInput, referenceDate) {
    const approval = normalizeApproval(approvalInput);
    const today = referenceDate || todayIso();
    return Boolean(approval.reviewDate && approval.reviewDate < today);
  }

  function predictionFromRaw(artifact, rawRow) {
    if (!global.MLCore) throw new Error('MLCore is unavailable.');
    const transformed = global.MLCore.transformRows([rawRow], artifact.preprocessor, null, false);
    if (!transformed.X.length) throw new Error('The test-vector row was dropped by preprocessing.');
    const rawPrediction = global.MLCore.predict(artifact.model, transformed.X);
    return global.MLCore.inverseTargetTransform(rawPrediction, artifact.targetTransform || {type:'none'}, true)[0];
  }

  function createTestVectors(artifact, maximum) {
    const diagnostic = artifact && artifact.diagnosticData && artifact.diagnosticData.training;
    if (!Array.isArray(diagnostic) || !diagnostic.length) return [];
    const count = Math.max(1, Math.min(Number(maximum) || 3, diagnostic.length));
    const positions = [];
    for (let i = 0; i < count; i++) positions.push(Math.floor(i * (diagnostic.length - 1) / Math.max(1, count - 1)));
    const seen = new Set();
    return positions.filter(index => !seen.has(index) && seen.add(index)).map(index => {
      const input = clone(diagnostic[index].features || {});
      const expectedPrediction = predictionFromRaw(artifact, input);
      return {
        input,
        expectedPrediction,
        absoluteTolerance: Math.max(1e-8, Math.abs(expectedPrediction) * 1e-8)
      };
    });
  }

  async function packageDigest(packageObject) {
    if (!global.LRSPlatform) throw new Error('LRSPlatform is unavailable.');
    const copy = clone(packageObject);
    delete copy.integrity;
    delete copy.organizationalSignature;
    return global.LRSPlatform.sha256Hex(stableStringify(copy));
  }

  async function createApprovedPackage(artifactInput, approvalInput) {
    if (!artifactInput || !artifactInput.model || !artifactInput.preprocessor) throw new Error('A fitted model is required.');
    const artifact = global.LRSPlatform.migrateModelArtifact(artifactInput);
    const approvalCheck = validateApproval(approvalInput || artifact.approval, artifact.validation && artifact.validation.acceptance);
    if (!approvalCheck.operational) throw new Error(approvalCheck.errors.join(' ') || 'The model is not approved for operational prediction.');
    artifact.approval = approvalCheck.approval;
    const compactArtifact = clone(artifact);
    delete compactArtifact.diagnosticData;
    if (compactArtifact.experimentRecord) compactArtifact.experimentRecord = global.LRSPlatform.compactExperimentRecord(compactArtifact.experimentRecord);
    compactArtifact.exportProfile = 'approved-prediction-model';
    const testVectors = createTestVectors(artifact, 3);
    if (!testVectors.length) throw new Error('Approved package export requires retained training diagnostics so embedded self-test vectors can be created. Load the full project or retrain the model.');
    const packageObject = {
      artifactType: 'local-regression-approved-package',
      schemaVersion: PACKAGE_SCHEMA_VERSION,
      applicationVersion: '1.0.11',
      packageId: global.LRSPlatform.randomId('approved-package'),
      createdAt: nowIso(),
      originalCsvIncluded: false,
      approval: clone(approvalCheck.approval),
      modelArtifact: compactArtifact,
      inputSchema: buildInputSchema(artifact, approvalCheck.approval),
      validationSummary: clone(artifact.validation || null),
      evaluationSummary: clone(artifact.evaluation || null),
      testVectors,
      releaseProfile: 'v1-governed-prediction-package',
      organizationalSignature: { status:'unsigned', algorithm:null, keyId:null, signer:null, signedAt:null, publicKeyJwk:null, value:null },
      integrity: null
    };
    packageObject.integrity = {
      algorithm: 'SHA-256',
      canonicalization: 'Stable JSON with recursively sorted object keys; integrity field excluded',
      value: await packageDigest(packageObject)
    };
    return packageObject;
  }

  function base64ToBytes(value) {
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(String(value || ''), 'base64'));
    const binary = atob(String(value || '')); const bytes = new Uint8Array(binary.length);
    for (let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i); return bytes;
  }

  async function verifyOrganizationalSignature(packageObject) {
    const signature = packageObject && packageObject.organizationalSignature;
    if (!signature || signature.status === 'unsigned' || !signature.value) return { present:false, verified:false, status:'not-present', signer:null, keyId:null };
    if (!global.crypto || !global.crypto.subtle) return { present:true, verified:false, status:'unavailable', signer:signature.signer||null, keyId:signature.keyId||null, error:'Web Crypto is unavailable.' };
    if (signature.algorithm !== 'ECDSA-P256-SHA256' || !signature.keyId) return { present:true, verified:false, status:'unsupported', signer:signature.signer||null, keyId:signature.keyId||null, error:'Unsupported organizational signature format.' };
    const trustedKeys=(global.LRS_BUILD_CONFIG&&global.LRS_BUILD_CONFIG.trustedSigningKeys)||{};
    const trustedKey=trustedKeys[signature.keyId];
    if (!trustedKey) return { present:true, verified:false, status:'untrusted-key', signer:signature.signer||null, keyId:signature.keyId||null, error:`Signing key ${signature.keyId} is not configured as trusted in this deployment.` };
    try {
      const key=await global.crypto.subtle.importKey('jwk',trustedKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
      const data=typeof TextEncoder!=='undefined'?new TextEncoder().encode(packageObject.integrity.value):global.LRSPlatform.utf8Bytes(packageObject.integrity.value);
      const verified=await global.crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,base64ToBytes(signature.value),data);
      return { present:true, verified, status:verified?'verified':'invalid', signer:signature.signer||null, keyId:signature.keyId||null };
    } catch(error) { return { present:true, verified:false, status:'invalid', signer:signature.signer||null, keyId:signature.keyId||null, error:error.message }; }
  }

  async function verifyApprovedPackage(input) {
    if (!input || input.artifactType !== 'local-regression-approved-package') throw new Error('This is not a recognised approved prediction package.');
    const incomingSchema = Number(input.schemaVersion);
    if (![1, PACKAGE_SCHEMA_VERSION].includes(incomingSchema)) throw new Error(`Unsupported approved-package schema ${input.schemaVersion}.`);
    if (!input.integrity || input.integrity.algorithm !== 'SHA-256' || !input.integrity.value) throw new Error('The package does not contain integrity metadata.');
    const digest = await packageDigest(input);
    if (digest !== input.integrity.value) throw new Error('Package integrity verification failed. The file may have been changed or damaged.');
    const artifact = global.LRSPlatform.migrateModelArtifact(input.modelArtifact);
    const approval = normalizeApproval(input.approval || artifact.approval);
    const approvalCheck = validateApproval(approval, artifact.validation && artifact.validation.acceptance);
    if (!approvalCheck.operational) throw new Error(approvalCheck.errors.join(' ') || 'This package is not approved for operational use.');
    if (isExpired(approval)) throw new Error(`The package review date (${approval.reviewDate}) has passed. Ask the model owner to review and reissue it.`);
    const vectorResults = runTestVectors({...input, modelArtifact:artifact});
    if (!vectorResults.passed) throw new Error('Package self-test failed. Do not use this package for prediction.');
    const signatureVerification = await verifyOrganizationalSignature(input);
    if (signatureVerification.present && !signatureVerification.verified) throw new Error(`Organizational signature verification failed${signatureVerification.error ? `: ${signatureVerification.error}` : '.'}`);
    return { package:clone(input), artifact, approval, integrityVerified:true, signatureVerification, testVectorResults:vectorResults };
  }

  function runTestVectors(packageObject) {
    const vectors = Array.isArray(packageObject && packageObject.testVectors) ? packageObject.testVectors : [];
    const artifact = packageObject && packageObject.modelArtifact;
    if (!vectors.length) return { passed:true, total:0, passedCount:0, note:'No embedded test vectors were available.' };
    const results = vectors.map(vector => {
      try {
        const actual = predictionFromRaw(artifact, vector.input || {});
        const tolerance = Math.max(0, Number(vector.absoluteTolerance) || 0);
        const difference = Math.abs(actual - Number(vector.expectedPrediction));
        return { passed:Number.isFinite(actual) && difference <= tolerance, actual, expected:Number(vector.expectedPrediction), difference, tolerance };
      } catch (error) {
        return { passed:false, error:error.message };
      }
    });
    return { passed:results.every(result => result.passed), total:results.length, passedCount:results.filter(result => result.passed).length, results };
  }

  function validateInputCsv(headers, rows, inputSchema) {
    const schema = inputSchema || {requiredColumns:[],features:[]};
    const headerSet = new Set(headers || []);
    const missingColumns = (schema.requiredColumns || []).filter(name => !headerSet.has(name));
    const unexpectedColumns = (headers || []).filter(name => !(schema.requiredColumns || []).includes(name));
    const issues = [];
    for (const feature of schema.features || []) {
      if (!headerSet.has(feature.name)) continue;
      if (feature.type === 'numeric') {
        let invalid = 0;
        for (const row of rows || []) {
          const raw = row[feature.name];
          if (raw == null || String(raw).trim() === '') continue;
          if (!Number.isFinite(Number(raw))) invalid++;
        }
        if (invalid) issues.push({severity:'error',column:feature.name,message:`${invalid} row(s) contain non-numeric values in a numeric feature.`});
      }
    }
    return { valid:missingColumns.length === 0 && !issues.some(issue => issue.severity === 'error'), missingColumns, unexpectedColumns, issues };
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function buildValidationReportHtml(artifact, approvalInput) {
    const approval = normalizeApproval(approvalInput || artifact.approval);
    const schema = buildInputSchema(artifact, approval);
    const acceptance = artifact.validation && artifact.validation.acceptance;
    const outcomes = acceptance && Array.isArray(acceptance.outcomes) ? acceptance.outcomes : [];
    const test = artifact.evaluation && artifact.evaluation.test || {};
    const pm = test.pointMetrics || {}, um = test.uncertaintyMetrics || {};
    const metric = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined,{maximumFractionDigits:6}) : 'Not available';
    const outcomeRows = outcomes.length ? outcomes.map(item => `<tr><td>${esc(item.status)}</td><td>${esc(item.label)}</td><td>${esc(item.actual == null ? '—' : item.actual)}</td><td>${esc(item.requirement || '—')}</td><td>${esc(item.note || '')}</td></tr>`).join('') : '<tr><td colspan="5">No acceptance criteria were evaluated.</td></tr>';
    const schemaRows = schema.features.map(feature => `<tr><td>${esc(feature.name)}</td><td>${esc(feature.type)}</td><td>${esc(feature.unit || '—')}</td><td>${esc(feature.description || '—')}</td><td>${feature.type === 'numeric' ? `${esc(feature.trainingMinimum)} to ${esc(feature.trainingMaximum)}` : esc((feature.allowedCategories || []).join(', ') || '—')}</td></tr>`).join('');
    const historyRows = approval.history.length ? approval.history.map(item => `<tr><td>${esc(item.recordedAt)}</td><td>${esc(item.status)}</td><td>${esc(item.reviewer || '—')}</td><td>${esc(item.reviewDate || '—')}</td><td>${esc(item.note || '—')}</td></tr>`).join('') : '<tr><td colspan="5">No approval decision has been recorded.</td></tr>';
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(approval.modelName || artifact.target || 'Model')} validation report</title><style>body{font:15px/1.5 Arial,sans-serif;color:#172033;max-width:1050px;margin:36px auto;padding:0 24px}h1,h2{color:#173b57}table{border-collapse:collapse;width:100%;margin:12px 0 24px}th,td{border:1px solid #ccd5dd;padding:8px;text-align:left;vertical-align:top}th{background:#eef4f7}.badge{display:inline-block;padding:4px 10px;border-radius:99px;background:#e8eef2;font-weight:700}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 24px}.note{background:#f4f7f9;padding:12px;border-left:4px solid #52788f}.footer{margin-top:32px;color:#667;font-size:12px}@media print{body{margin:0}.no-print{display:none}}</style></head><body>
    <button class="no-print" onclick="window.print()">Print or save as PDF</button>
    <h1>Model validation and approval report</h1>
    <p class="note">Generated locally by Local Regression Studio v1.0.11. This report supports human review; it does not create regulatory certification.</p>
    <h2>Identity and approval</h2><div class="meta"><div><strong>Model name</strong><br>${esc(approval.modelName || 'Not named')}</div><div><strong>Status</strong><br><span class="badge">${esc(approval.status)}</span></div><div><strong>Developer</strong><br>${esc(approval.developer || '—')}</div><div><strong>Owner</strong><br>${esc(approval.owner || '—')}</div><div><strong>Reviewer</strong><br>${esc(approval.reviewer || '—')}</div><div><strong>Approver</strong><br>${esc(approval.approver || '—')}</div><div><strong>Decision date</strong><br>${esc(approval.decisionDate || '—')}</div><div><strong>Review date</strong><br>${esc(approval.reviewDate || '—')}</div><div><strong>Experiment ID</strong><br>${esc(artifact.experimentId || '—')}</div><div><strong>Application version</strong><br>${esc(artifact.appVersion || '—')}</div></div>
    <h2>Intended and unsupported use</h2><p><strong>Intended use</strong><br>${esc(approval.intendedUse || 'Not documented')}</p><p><strong>Prohibited or unsupported uses</strong><br>${esc(approval.prohibitedUses || 'Not documented')}</p><p><strong>Limitations</strong><br>${esc(approval.limitations || 'Not documented')}</p><p><strong>Conditions</strong><br>${esc(approval.conditions || 'None documented')}</p>
    <h2>Dataset and model</h2><table><tbody><tr><th>Dataset</th><td>${esc(artifact.dataset && artifact.dataset.fileName || '—')}</td><th>Fingerprint</th><td>${esc(artifact.dataset && artifact.dataset.fingerprint && artifact.dataset.fingerprint.value || '—')}</td></tr><tr><th>Target</th><td>${esc(artifact.target || '—')}</td><th>Model</th><td>${esc(artifact.modelType || '—')}</td></tr><tr><th>Rows</th><td>${esc(artifact.dataset && artifact.dataset.rowCount || '—')}</td><th>Split</th><td>${esc(JSON.stringify(artifact.splitSummary || {}))}</td></tr></tbody></table>
    <h2>Independent test performance</h2><table><tbody><tr><th>RMSE</th><td>${metric(pm.rmse)}</td><th>MAE</th><td>${metric(pm.mae)}</td></tr><tr><th>R²</th><td>${metric(pm.r2)}</td><th>Bias</th><td>${metric(pm.bias)}</td></tr><tr><th>Interval coverage</th><td>${metric(um.coverage)}</td><th>Mean interval width</th><td>${metric(um.meanWidth)}</td></tr></tbody></table>
    <h2>Acceptance criteria</h2><p>Overall result: <strong>${esc(acceptance && acceptance.overall || 'not-evaluated')}</strong></p><table><thead><tr><th>Status</th><th>Requirement</th><th>Observed</th><th>Criterion</th><th>Note</th></tr></thead><tbody>${outcomeRows}</tbody></table>
    <h2>Operational input schema</h2><table><thead><tr><th>Feature</th><th>Type</th><th>Unit</th><th>Description</th><th>Training support</th></tr></thead><tbody>${schemaRows}</tbody></table>
    <h2>Approval history</h2><table><thead><tr><th>Recorded</th><th>Status</th><th>Reviewer</th><th>Review date</th><th>Note</th></tr></thead><tbody>${historyRows}</tbody></table>
    <p><strong>Additional notes</strong><br>${esc(approval.notes || 'None')}</p><p class="footer">Original CSV data are not embedded in this report or in Local Regression Studio project files.</p></body></html>`;
  }

  global.LRSApproval = Object.freeze({
    version:'1.0.11', packageSchemaVersion:PACKAGE_SCHEMA_VERSION, statuses:APPROVAL_STATUSES,
    stableStringify, normalizeApproval, buildInputSchema, validateApproval, appendDecisionHistory,
    isExpired, createTestVectors, createApprovedPackage, verifyApprovedPackage, verifyOrganizationalSignature, runTestVectors,
    validateInputCsv, buildValidationReportHtml
  });
})(typeof window !== 'undefined' ? window : globalThis);
