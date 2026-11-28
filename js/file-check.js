// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 UK Research and Innovation (UKRI)
// Engineering ML Studio — file check after upload (WORKPLAN C1).
//
// Real measurement and simulation files are messier than the bundled examples, and
// several layout problems used to load silently and wrongly. This module inspects the
// raw values of a freshly loaded CSV and explains each problem in plain language: what
// was found (with examples), what it does to the model, and how to fix the file.
//
// It is read-only. It never changes how the file is parsed, the rows, the column
// types or any setting: the parser's success path is unchanged by design, because
// saved models and approved packages depend on it. It only reads app state.

(function (global) {
  'use strict';

  var GP_ROW_LIMIT = 2000, KNN_ROW_LIMIT = 25000, SLOW_ROWS = 10000;
  var MISSING_CODES = ['-999', '-9999', '-99999', '9999', '99999', '-99'];

  var THOUSANDS = /^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/;
  var COMMA_NUMBER = /^[+-]?\d+,\d+$/;
  var UNIT_VALUE = /^[+-]?\d+(?:[.,]\d+)?(?:[eE][+-]?\d+)?\s*([A-Za-zµ°%][A-Za-zµ°%/²³^0-9·.\-]*)$/;
  var DATE_VALUE = /^(\d{4}-\d{1,2}-\d{1,2}([ T]\d{1,2}:\d{2}(:\d{2})?)?|\d{1,2}[/.]\d{1,2}[/.]\d{2,4})$/;

  function toNumber(value) {
    return global.MLCore && global.MLCore.toNumber ? global.MLCore.toNumber(value) : Number(value);
  }
  function isMissing(value) {
    return global.MLCore && global.MLCore.isMissing ? global.MLCore.isMissing(value) : (value == null || String(value).trim() === '');
  }
  function present(rows, header) {
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var v = rows[i][header];
      if (!isMissing(v)) out.push(String(v).trim());
    }
    return out;
  }
  function distinct(values, limit) {
    var seen = [], set = {};
    for (var i = 0; i < values.length && seen.length < limit; i++) {
      if (!set[values[i]]) { set[values[i]] = true; seen.push(values[i]); }
    }
    return seen;
  }
  function quote(v) { return '“' + v + '”'; }
  function fmt(n) { return Number(n.toPrecision(6)).toLocaleString('en'); }

  // Returns a list of findings: { severity: 'critical'|'warning'|'info', column, title, found, effect, fix }.
  function analyse(headers, rows, profiles) {
    var findings = [];
    headers = headers || []; rows = rows || []; profiles = profiles || {};
    if (!rows.length) return findings;

    // A header row that is really data: most "names" are numbers.
    var numericHeaders = headers.filter(function (h) { return isFinite(toNumber(h)); });
    if (headers.length && numericHeaders.length >= Math.ceil(headers.length / 2)) {
      findings.push({ severity: 'critical', column: null,
        title: 'The first row looks like data, not column names',
        found: 'The column names are ' + headers.slice(0, 4).map(quote).join(', ') + (headers.length > 4 ? ' …' : '') + '.',
        effect: 'That first row of measurements has been used as the names, so it is missing from the data, and the columns have meaningless names.',
        fix: 'Add a header row with one name per column (units in the name, e.g. pressure_drop_kpa), then load the file again.' });
    }

    headers.forEach(function (h) {
      var p = profiles[h] || {};
      var values = present(rows, h);
      if (!values.length) return;

      // Decimal commas: "4,9" is read as 49, silently.
      var commaValues = values.filter(function (v) { return COMMA_NUMBER.test(v); });
      var decimalComma = commaValues.filter(function (v) { return !THOUSANDS.test(v) || /^[+-]?0,/.test(v); });
      if (decimalComma.length >= Math.max(2, Math.ceil(values.length * 0.1))) {
        var examples = distinct(decimalComma, 3).map(function (v) { return quote(v) + ' → read as ' + fmt(toNumber(v)); });
        findings.push({ severity: 'critical', column: h,
          title: 'Numbers written with a decimal comma',
          found: decimalComma.length + ' values such as ' + examples.join('; ') + '.',
          effect: 'The comma is read as a thousands separator, so these values are wrong by factors of 10 to 1,000. A model trained on them will be meaningless, without any other error.',
          fix: 'Export the CSV with a decimal point (in Excel, set the decimal separator to “.” before saving as CSV), or replace the commas with points in a copy of the file.' });
        return;
      }
      var thousands = commaValues.length ? values.filter(function (v) { return THOUSANDS.test(v); }) : [];
      if (thousands.length >= Math.max(2, Math.ceil(values.length * 0.1))) {
        findings.push({ severity: 'info', column: h,
          title: 'Thousands separators',
          found: 'Values such as ' + distinct(thousands, 2).map(function (v) { return quote(v) + ' → read as ' + fmt(toNumber(v)); }).join('; ') + '.',
          effect: 'These are read correctly, as long as the comma really is a thousands separator.',
          fix: 'If the comma was meant as a decimal point, re-export the file with a decimal point.' });
      }

      if (p.type !== 'numeric') {
        // Units inside the cells: "23.86 m".
        var withUnit = values.filter(function (v) { return UNIT_VALUE.test(v); });
        if (withUnit.length >= Math.ceil(values.length * 0.6)) {
          var unit = (UNIT_VALUE.exec(withUnit[0]) || [])[1] || '';
          findings.push({ severity: 'critical', column: h,
            title: 'Units written inside the values',
            found: 'Values such as ' + distinct(withUnit, 3).map(quote).join(', ') + '.',
            effect: 'The column is read as text, not as numbers, so it cannot be used as a numeric input or as the quantity to predict.',
            fix: 'Keep only the number in each cell and put the unit in the column name, for example ' + quote(h.toLowerCase() + (unit ? '_' + unit.toLowerCase().replace(/[^a-z0-9]+/g, '') : '_unit')) + '.' });
          return;
        }
        // Dates.
        var dates = values.filter(function (v) { return DATE_VALUE.test(v); });
        if (dates.length >= Math.ceil(values.length * 0.8)) {
          findings.push({ severity: 'warning', column: h,
            title: 'Dates or times',
            found: 'Values such as ' + distinct(dates, 2).map(quote).join(', ') + '.',
            effect: 'Dates are treated as text labels — almost every date is a category of its own — so this column is left out of the inputs.',
            fix: 'If time matters, add a numeric column such as elapsed days or hours, and use a time-based split in stage 4.' });
          return;
        }
        // Mostly numbers, but too much text to be read as numbers.
        if (isFinite(p.numericRatio) && p.numericRatio >= 0.5 && p.numericRatio < 0.9) {
          var text = distinct(values.filter(function (v) { return !isFinite(toNumber(v)); }), 4);
          findings.push({ severity: 'critical', column: h,
            title: 'Mostly numbers, read as text',
            found: Math.round(p.numericRatio * 100) + '% of the values are numbers; the rest are text such as ' + text.map(quote).join(', ') + '.',
            effect: 'The whole column is treated as text categories, so it cannot be used as a numeric input or as the quantity to predict.',
            fix: 'Leave cells blank where there is no value, and correct any entries that are not numbers; then load the file again.' });
        }
        return;
      }

      // Numeric column with a few text entries: they become missing, quietly.
      var notNumbers = values.filter(function (v) { return !isFinite(toNumber(v)); });
      if (notNumbers.length) {
        findings.push({ severity: 'warning', column: h,
          title: 'Text in a numeric column',
          found: notNumbers.length + ' entr' + (notNumbers.length === 1 ? 'y is' : 'ies are') + ' not numbers: ' + distinct(notNumbers, 4).map(quote).join(', ') + '.',
          effect: 'They are treated as missing values and filled in by the stage 3 setting. Entries such as “<0.1” (below a detection limit) carry information that is lost.',
          fix: 'Leave genuinely missing cells blank, and replace censored values such as “<0.1” with a number you can justify.' });
      }

      // Placeholder codes for missing values.
      var codes = values.filter(function (v) { return MISSING_CODES.indexOf(String(toNumber(v))) !== -1; });
      if (codes.length >= 2) {
        findings.push({ severity: 'warning', column: h,
          title: 'A value that looks like a “missing” code',
          found: quote(String(toNumber(codes[0]))) + ' appears ' + codes.length + ' times.',
          effect: 'If it means “not measured”, the model takes it as a real, extreme measurement, which distorts the fit badly.',
          fix: 'If it is a missing-value code, blank those cells and load the file again.' });
      }
    });

    // Size against the models' limits (the latent bug recorded in WORKPLAN C1).
    var n = rows.length;
    if (n > KNN_ROW_LIMIT) {
      findings.push({ severity: 'warning', column: null, title: 'Large dataset: some models will not be available',
        found: n.toLocaleString('en') + ' rows.',
        effect: 'Gaussian process (up to ' + GP_ROW_LIMIT.toLocaleString('en') + ' rows) and k-nearest neighbours (up to ' + KNN_ROW_LIMIT.toLocaleString('en') + ') will refuse to train, and the other models will be slow in the browser.',
        fix: 'Use a representative sample of the rows, or train outside the browser (see “Beyond this tool” in Learn).' });
    } else if (n > GP_ROW_LIMIT) {
      findings.push({ severity: 'info', column: null, title: 'Gaussian process not available for this many rows',
        found: n.toLocaleString('en') + ' rows.',
        effect: 'Gaussian process is limited to ' + GP_ROW_LIMIT.toLocaleString('en') + ' rows' + (n > SLOW_ROWS ? ', and training other models may take from seconds to over a minute in the browser.' : '.'),
        fix: 'Use the other models, or a representative sample of up to ' + GP_ROW_LIMIT.toLocaleString('en') + ' rows for a Gaussian process.' });
    }
    return findings;
  }

  var SEVERITY_LABEL = { critical: 'Fix before modelling', warning: 'Check', info: 'Note' };

  function render(findings) {
    var host = document.getElementById('fileCheck');
    if (!host) return;
    host.textContent = '';
    var heading = document.createElement('h3');
    heading.textContent = 'File check';
    host.appendChild(heading);
    if (!findings.length) {
      var ok = document.createElement('p');
      ok.className = 'file-check-ok';
      ok.textContent = 'No layout problems found: numbers, column names and values look consistent.';
      host.appendChild(ok);
    } else {
      var list = document.createElement('ul');
      list.className = 'file-check-list';
      var order = { critical: 0, warning: 1, info: 2 };
      findings.slice().sort(function (a, b) { return order[a.severity] - order[b.severity]; }).forEach(function (f) {
        var li = document.createElement('li');
        li.className = 'file-check-item file-check-' + f.severity;
        li.setAttribute('data-severity', f.severity);
        var head = document.createElement('p');
        head.className = 'file-check-title';
        var chip = document.createElement('span');
        chip.className = 'file-check-chip';
        chip.textContent = SEVERITY_LABEL[f.severity];
        head.appendChild(chip);
        head.appendChild(document.createTextNode(' ' + f.title + (f.column ? ' — column ' + quote(f.column) : '')));
        li.appendChild(head);
        [['Found', f.found], ['Effect', f.effect], ['How to fix', f.fix]].forEach(function (part) {
          var p = document.createElement('p');
          var b = document.createElement('strong');
          b.textContent = part[0] + ': ';
          p.appendChild(b);
          p.appendChild(document.createTextNode(part[1]));
          li.appendChild(p);
        });
        list.appendChild(li);
      });
      host.appendChild(list);
    }
    host.hidden = false;
  }

  function runForCurrentFile() {
    var app = global.LocalRegressionApp, state = app && app.state;
    if (!state || !Array.isArray(state.rows) || !state.rows.length) return;
    render(analyse(state.headers, state.rows, state.profiles));
  }

  function init() {
    // Hide the previous file's findings as soon as a new file is chosen; if the new file
    // fails to load, its own error message stands alone.
    var input = document.getElementById('csvFile');
    if (input) input.addEventListener('change', function () { var host = document.getElementById('fileCheck'); if (host) host.hidden = true; });
    // The app re-renders the dataset summary after every successful load.
    var summary = document.getElementById('datasetSummary');
    if (summary && global.MutationObserver) {
      new MutationObserver(runForCurrentFile).observe(summary, { childList: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  global.EMSFileCheck = Object.freeze({ analyse: analyse, run: runForCurrentFile });
})(window);
