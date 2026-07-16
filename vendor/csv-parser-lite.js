(function (global) {
  'use strict';

  function parseCSV(text, options) {
    options = options || {};
    const delimiter = options.delimiter || detectDelimiter(text);
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') {
          field += '"'; i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        row.push(field); field = '';
      } else if (ch === '\n') {
        row.push(field.replace(/\r$/, '')); field = '';
        if (!options.skipEmptyLines || row.some(v => String(v).trim() !== '')) rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
    if (field.length || row.length) {
      row.push(field.replace(/\r$/, ''));
      if (!options.skipEmptyLines || row.some(v => String(v).trim() !== '')) rows.push(row);
    }

    if (!rows.length) return { data: [], errors: [], meta: { delimiter } };
    if (options.header) {
      const headers = rows.shift().map((h, i) => String(h || `column_${i + 1}`).trim());
      const data = rows.map(values => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] == null ? '' : values[i]; });
        return obj;
      });
      return { data, errors: [], meta: { delimiter, fields: headers } };
    }
    return { data: rows, errors: [], meta: { delimiter } };
  }

  function detectDelimiter(text) {
    const sample = text.split(/\r?\n/).slice(0, 8).join('\n');
    const candidates = [',', '\t', ';', '|'];
    let best = ',', bestScore = -1;
    for (const d of candidates) {
      let score = 0, inQuotes = false;
      for (let i = 0; i < sample.length; i++) {
        if (sample[i] === '"') inQuotes = !inQuotes;
        else if (!inQuotes && sample[i] === d) score++;
      }
      if (score > bestScore) { best = d; bestScore = score; }
    }
    return best;
  }

  function escapeField(value, delimiter) {
    const s = value == null ? '' : String(value);
    if (s.includes('"') || s.includes('\n') || s.includes('\r') || s.includes(delimiter)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function unparse(data, options) {
    options = options || {};
    const delimiter = options.delimiter || ',';
    if (!Array.isArray(data) || data.length === 0) return '';
    if (Array.isArray(data[0])) return data.map(r => r.map(v => escapeField(v, delimiter)).join(delimiter)).join('\r\n');
    const fields = options.columns || Object.keys(data[0]);
    const lines = [fields.map(v => escapeField(v, delimiter)).join(delimiter)];
    for (const row of data) lines.push(fields.map(f => escapeField(row[f], delimiter)).join(delimiter));
    return lines.join('\r\n');
  }

  global.CSVLite = { parse: parseCSV, unparse };
})(window);
