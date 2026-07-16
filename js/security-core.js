(function (global) {
  'use strict';

  const VERSION = '1.0.11';
  const LIMITS = Object.freeze({
    csvBytes: 50 * 1024 * 1024,
    csvRows: 200000,
    csvColumns: 500,
    jsonBytes: 50 * 1024 * 1024,
    maxArrayItems: 2000000,
    maxObjectNodes: 2500000,
    maxDepth: 80
  });

  function isPlainObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  function validateFileSize(file, limit, label) {
    if (!file) throw new Error(`${label || 'File'} is missing.`);
    const size = Number(file.size);
    if (Number.isFinite(size) && size > limit) {
      throw new Error(`${label || 'File'} is too large (${(size / 1048576).toFixed(1)} MB). The supported limit is ${(limit / 1048576).toFixed(0)} MB.`);
    }
    return true;
  }

  function validateCsvFile(file) {
    validateFileSize(file, LIMITS.csvBytes, 'CSV file');
    if (file.name && !/\.csv$/i.test(file.name)) throw new Error('Choose a CSV file.');
    return true;
  }

  function validateJsonFile(file) {
    validateFileSize(file, LIMITS.jsonBytes, 'JSON file');
    return true;
  }

  function validateCsvShape(rows, headers) {
    const issues = [];
    const rowCount = Array.isArray(rows) ? rows.length : 0;
    const columnCount = Array.isArray(headers) ? headers.length : 0;
    if (!rowCount || !columnCount) issues.push({ severity:'error', code:'empty_csv', message:'The CSV contains no usable rows or headers.' });
    if (rowCount > LIMITS.csvRows) issues.push({ severity:'error', code:'row_limit', message:`The CSV has ${rowCount.toLocaleString()} rows; the supported limit is ${LIMITS.csvRows.toLocaleString()}.` });
    if (columnCount > LIMITS.csvColumns) issues.push({ severity:'error', code:'column_limit', message:`The CSV has ${columnCount.toLocaleString()} columns; the supported limit is ${LIMITS.csvColumns.toLocaleString()}.` });
    const duplicateHeaders = [];
    const seen = new Set();
    (headers || []).forEach(header => {
      const key = String(header);
      if (seen.has(key)) duplicateHeaders.push(key); else seen.add(key);
    });
    if (duplicateHeaders.length) issues.push({ severity:'error', code:'duplicate_headers', message:`Duplicate CSV headers are not supported: ${duplicateHeaders.slice(0,10).join(', ')}.` });
    return { valid:!issues.some(issue => issue.severity === 'error'), rowCount, columnCount, issues };
  }

  function inspectStructure(value, options) {
    const o = options || {};
    const maxDepth = Number.isFinite(o.maxDepth) ? o.maxDepth : LIMITS.maxDepth;
    const maxArrayItems = Number.isFinite(o.maxArrayItems) ? o.maxArrayItems : LIMITS.maxArrayItems;
    const maxNodes = Number.isFinite(o.maxNodes) ? o.maxNodes : LIMITS.maxObjectNodes;
    let nodes = 0;
    const stack = [{ value, depth:0, path:'$' }];
    while (stack.length) {
      const current = stack.pop();
      nodes += 1;
      if (nodes > maxNodes) throw new Error(`Imported JSON is too complex; more than ${maxNodes.toLocaleString()} values were found.`);
      if (current.depth > maxDepth) throw new Error(`Imported JSON exceeds the supported nesting depth of ${maxDepth}.`);
      const item = current.value;
      if (typeof item === 'number' && !Number.isFinite(item)) throw new Error(`Imported JSON contains a non-finite number at ${current.path}.`);
      if (Array.isArray(item)) {
        if (item.length > maxArrayItems) throw new Error(`Imported JSON array at ${current.path} exceeds ${maxArrayItems.toLocaleString()} entries.`);
        for (let i = item.length - 1; i >= 0; i--) stack.push({ value:item[i], depth:current.depth + 1, path:`${current.path}[${i}]` });
      } else if (isPlainObject(item)) {
        const keys = Object.keys(item);
        for (let i = keys.length - 1; i >= 0; i--) stack.push({ value:item[keys[i]], depth:current.depth + 1, path:`${current.path}.${keys[i]}` });
      }
    }
    return { valid:true, nodes };
  }

  function validateArtifactEnvelope(input, allowedTypes) {
    inspectStructure(input);
    if (!isPlainObject(input)) throw new Error('Imported JSON must contain an object at its root.');
    const type = input.artifactType || input.fileType;
    const allowed = Array.isArray(allowedTypes) ? allowedTypes : [];
    if (!type) throw new Error('Imported JSON does not declare a recognised file type.');
    if (allowed.length && !allowed.includes(type)) throw new Error(`Unexpected file type: ${type}.`);
    if (input.schemaVersion != null && (!Number.isInteger(Number(input.schemaVersion)) || Number(input.schemaVersion) < 1)) throw new Error('Imported JSON has an invalid schema version.');
    return { valid:true, type, schemaVersion:Number(input.schemaVersion) || null };
  }

  function safeCsvCell(value) {
    if (value == null) return value;
    const text = String(value);
    // Protect spreadsheet users from formulas while preserving the visible value.
    return /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
  }

  function protectCsvRows(rows) {
    return (rows || []).map(row => {
      const safe = {};
      Object.keys(row || {}).forEach(key => { safe[key] = safeCsvCell(row[key]); });
      return safe;
    });
  }

  function sanitizeDownloadName(name, fallback) {
    const cleaned = String(name || '').replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, '-').replace(/\.{2,}/g,'.').replace(/^\.+|\.+$/g,'').trim();
    return (cleaned || fallback || 'download').slice(0, 180);
  }

  function runtimeIntegrity(dependencyStatus, buildConfig) {
    const status = dependencyStatus || { libraries:{} };
    const config = buildConfig || {};
    const libraries = Object.entries(status.libraries || {}).map(([name, detail]) => ({ name, source:detail.source || 'unknown', version:detail.version || detail.versionedUrl || null }));
    const remote = libraries.filter(item => item.source === 'cdn');
    return {
      applicationVersion: VERSION,
      edition: config.edition || 'full-studio',
      networkPolicy: config.networkPolicy || status.modeRequested || 'hybrid',
      libraries,
      undeclaredRemoteLibraries: remote,
      offlineClean: remote.length === 0
    };
  }

  global.LRSSecurity = Object.freeze({
    version:VERSION,
    limits:LIMITS,
    validateCsvFile,
    validateJsonFile,
    validateCsvShape,
    inspectStructure,
    validateArtifactEnvelope,
    safeCsvCell,
    protectCsvRows,
    sanitizeDownloadName,
    runtimeIntegrity,
    isPlainObject
  });
})(typeof window !== 'undefined' ? window : globalThis);
