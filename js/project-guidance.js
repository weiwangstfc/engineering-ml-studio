// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 UK Research and Innovation (UKRI)
// Engineering ML Studio — Project-mode guidance (presentation only).
//
// Explains the Project-mode settings in plain engineering language: what each
// setting does, what the currently selected choice means, and when to change
// it. This module reads control values and a few counts from the app's state
// (rows, selected inputs, column types) to describe them, and writes
// explanatory text. It never changes a setting or a model choice, and never
// computes a result; the inherited app (js/app.js) remains the owner of state.

(function (global) {
  'use strict';

  // --- Stage 3: data preparation ------------------------------------------------
  // `what` explains the setting; `choices` explains each value of its control.
  var PREP_HELP = {
    numericMissing: {
      what: 'Many models cannot use a row with a blank number, so each gap is either filled or the row is removed. ' +
        'Any fill value is learned from the training rows only.',
      choices: {
        mean: 'Fills a gap with the column’s training average. A good default when only a few values are missing and the column has no extreme outliers.',
        median: 'Fills a gap with the training median, the middle value. Safer than the mean when the column has outliers or a long tail.',
        zero: 'Fills a gap with 0. Only sensible when a blank genuinely means zero (for example “no additive used”); otherwise it distorts the data.',
        drop: 'Removes every row that has a missing number. Nothing is invented, but information is thrown away; best when only a handful of rows are affected.'
      }
    },
    numericScaling: {
      figure: function () { return SCALING_FIGURE; },
      what: 'Inputs measured in very different units (metres, pascals, kelvin) are put on comparable scales. ' +
        'The scaling is learned from the training rows only, then applied unchanged to all other data.',
      choices: {
        standard: 'Shifts each input to an average of 0 and a standard deviation of 1. The usual choice, and important for the neural network, k-nearest neighbours and the regularised linear models (ridge, elastic net).',
        minmax: 'Rescales each input to the 0–1 range seen in training. Useful when inputs have hard physical limits, but sensitive to outliers, and new values outside the training range fall outside 0–1.',
        none: 'Keeps inputs in their original units. Fine for tree-based models and plain linear regression, but distance- and gradient-based models will be dominated by whichever input has the largest numbers.'
      }
    },
    categoricalMissing: {
      what: 'What to do with blank entries in text columns, such as material, supplier or test rig.',
      choices: {
        missing: 'Treats a blank as its own category, “Missing”. Every row is kept, and the model can learn whether blanks behave differently.',
        mode: 'Replaces a blank with the most common category in the training rows. Simple, but it hides the fact that the value was unknown.',
        drop: 'Removes every row with a blank category. Use only when very few rows are affected.'
      }
    },
    categoricalEncoding: {
      figure: function () { return ENCODING_FIGURE; },
      what: 'Models work with numbers, so text categories (steel grade, supplier, rig) must be turned into numeric columns.',
      choices: {
        onehot: 'Creates one 0/1 column per category, so no order is implied between, say, “aluminium” and “steel”. The safe default.',
        ordinal: 'Replaces each category with an integer (0, 1, 2 …). Compact, but it implies an order and spacing that is usually not real; acceptable for tree models or genuinely ordered categories such as low / medium / high.',
        exclude: 'Ignores all text columns. Useful to check how much the model relies on them, or when they are identifiers in disguise.'
      }
    },
    maxCategories: {
      what: 'The most distinct categories one column may keep. The most frequent ones are kept and the rest are grouped as “Other”. ' +
        'This protects against columns with hundreds of unique values (often identifiers), which would otherwise create hundreds of one-hot columns.',
      choices: function (value) {
        var n = Math.round(Number(value));
        if (!isFinite(n)) return 'Enter a whole number between 2 and 200.';
        return 'Columns keep up to ' + n + ' categories. Lower it if a column has many rare categories; raise it only when each category has enough rows to learn from.';
      }
    },
    dropFirstCategory: {
      what: 'With one-hot encoding, the last category column of a feature can always be worked out from the others, because exactly one of them is 1. ' +
        'That redundancy makes straight-line models (linear, ridge) ill-defined, so one reference category is usually removed.',
      choices: {
        'true': 'On: one reference category per feature is removed. Recommended for linear and ridge regression; harmless for the other models.',
        'false': 'Off: every category keeps its own column. Tree-based models do not need the reference removed, but straight-line models can become unstable.'
      }
    }
  };

  // Small illustrations for the two least intuitive settings. Static, trusted markup.
  // Scaling: the same two inputs in original units, standardised, and min–max scaled.
  function scaleRow(y, label, from, to, ticks, color) {
    var x0 = 150, x1 = 450, out = '';
    out += '<text x="8" y="' + (y + 4) + '" font-size="11" fill="#16202a">' + label + '</text>';
    out += '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="#9bb4be" stroke-width="1"></line>';
    var a = x0 + (x1 - x0) * from, b = x0 + (x1 - x0) * to;
    out += '<line x1="' + a + '" y1="' + y + '" x2="' + b + '" y2="' + y + '" stroke="' + color + '" stroke-width="6" stroke-linecap="round"></line>';
    ticks.forEach(function (t) {
      var x = x0 + (x1 - x0) * t[0];
      var anchor = t[0] >= 0.99 ? 'end' : (t[0] <= 0.01 ? 'start' : 'middle');
      out += '<text x="' + x + '" y="' + (y + 16) + '" font-size="9" fill="#555" text-anchor="' + anchor + '">' + t[1] + '</text>';
    });
    return out;
  }
  var SCALING_FIGURE =
    '<figure class="prep-figure">' +
      '<svg viewBox="0 0 460 224" role="img" aria-label="Two inputs on very different scales: pipe length from 2 to 30 metres and pressure from 1,000 to 100,000 pascals. ' +
        'After standardising, both are centred on 0 and spread over roughly minus 2 to plus 2. After min-max scaling, both run from 0 to 1.">' +
        '<text x="8" y="14" font-size="11" font-weight="700" fill="#16202a">Original units</text>' +
        scaleRow(34, 'pipe length (m)', 0.0, 0.0003, [[0, '0'], [1, '100,000']], '#125f76') +
        scaleRow(62, 'pressure (Pa)', 0.01, 1, [[0.01, '1,000'], [0.5, '50,000'], [1, '100,000']], '#a52b2b') +
        '<text x="452" y="30" font-size="9" fill="#125f76" text-anchor="end">length: 2–30, invisible at this scale</text>' +
        '<text x="8" y="98" font-size="11" font-weight="700" fill="#16202a">Standardised</text>' +
        scaleRow(118, 'pipe length', 0.1, 0.9, [[0.1, '−2'], [0.5, '0'], [0.9, '+2']], '#125f76') +
        scaleRow(146, 'pressure', 0.12, 0.88, [[0.12, '−2'], [0.5, '0'], [0.88, '+2']], '#a52b2b') +
        '<text x="8" y="182" font-size="11" font-weight="700" fill="#16202a">Min–max</text>' +
        scaleRow(200, 'both inputs', 0.0, 1, [[0, '0'], [1, '1']], '#555') +
      '</svg>' +
      '<figcaption>Before scaling, a model that measures distances or sizes of coefficients treats pressure as thousands of times more important than length, purely because of its units.</figcaption>' +
    '</figure>';
  var ENCODING_FIGURE =
    '<figure class="prep-figure">' +
      '<div class="prep-figure-tables">' +
        '<table><caption>Original</caption><thead><tr><th>material</th></tr></thead>' +
          '<tbody><tr><td>steel</td></tr><tr><td>aluminium</td></tr><tr><td>copper</td></tr><tr><td>steel</td></tr></tbody></table>' +
        '<span class="prep-figure-arrow" aria-hidden="true">→</span>' +
        '<table><caption>One-hot</caption><thead><tr><th>material = aluminium</th><th>material = copper</th></tr></thead>' +
          '<tbody><tr><td>0</td><td>0</td></tr><tr><td>1</td><td>0</td></tr><tr><td>0</td><td>1</td></tr><tr><td>0</td><td>0</td></tr></tbody></table>' +
        '<span class="prep-figure-arrow">or</span>' +
        '<table><caption>Ordinal</caption><thead><tr><th>material</th></tr></thead>' +
          '<tbody><tr><td>2</td></tr><tr><td>0</td></tr><tr><td>1</td></tr><tr><td>2</td></tr></tbody></table>' +
      '</div>' +
      '<figcaption>One-hot: one 0/1 column per category; “steel” is the removed reference category, so a row of zeros means steel. ' +
        'Ordinal: one integer column, which tells the model that copper lies between aluminium and steel — usually not true.</figcaption>' +
    '</figure>';

  function el(id) { return document.getElementById(id); }

  function controlValue(key) {
    var control = el(key);
    if (!control) return null;
    return control.type === 'checkbox' ? String(control.checked) : control.value;
  }

  function choiceLabel(key) {
    var control = el(key);
    if (!control) return '';
    if (control.tagName === 'SELECT') return control.options[control.selectedIndex] ? control.options[control.selectedIndex].text : '';
    if (control.type === 'checkbox') return control.checked ? 'on' : 'off';
    return control.value;
  }

  function renderPrepHelp(key) {
    var help = el('prepHelp-' + key), spec = PREP_HELP[key];
    if (!help || !spec) return;
    var value = controlValue(key);
    var choiceText = typeof spec.choices === 'function' ? spec.choices(value) : spec.choices[value];
    help.textContent = '';
    var what = document.createElement('p');
    what.textContent = spec.what;
    help.appendChild(what);
    if (choiceText) {
      var choice = document.createElement('p');
      choice.className = 'prep-choice';
      var lead = document.createElement('strong');
      lead.textContent = 'Your choice — ' + choiceLabel(key) + ': ';
      choice.appendChild(lead);
      choice.appendChild(document.createTextNode(choiceText));
      help.appendChild(choice);
    }
    if (spec.figure) help.insertAdjacentHTML('beforeend', spec.figure());
  }

  function setOpen(row, open) {
    var help = row.querySelector('.prep-option-help');
    var toggle = row.querySelector('.prep-help-toggle');
    if (!help || !toggle) return;
    // Re-read the control when opening: a restored project sets values without change events.
    if (open) renderPrepHelp(row.getAttribute('data-prep-option'));
    help.hidden = !open;
    row.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Hide explanation' : 'What does this mean?';
  }

  function openOnly(row) {
    document.querySelectorAll('#step-preprocess .prep-option').forEach(function (other) {
      setOpen(other, other === row);
    });
  }

  function wirePrep() {
    var rows = document.querySelectorAll('#step-preprocess .prep-option');
    rows.forEach(function (row) {
      var key = row.getAttribute('data-prep-option');
      renderPrepHelp(key);
      var toggle = row.querySelector('.prep-help-toggle');
      if (toggle) {
        toggle.addEventListener('click', function () {
          setOpen(row, toggle.getAttribute('aria-expanded') !== 'true');
        });
      }
      var control = el(key);
      if (control) {
        // Clicking into a setting opens its explanation (and closes the others),
        // and the explanation follows the selected choice as it changes.
        control.addEventListener('focus', function () { openOnly(row); });
        control.addEventListener('change', function () { renderPrepHelp(key); });
        control.addEventListener('input', function () { renderPrepHelp(key); });
      }
    });
  }

  // --- Stage 5: Evaluate results -------------------------------------------------
  // The stage is grouped into collapsible sections. Plots drawn while a section was
  // closed have no size, so redraw them at full width when the section opens.
  function resizePlotsIn(root) {
    if (!global.Plotly || !global.Plotly.Plots || !root) return;
    root.querySelectorAll('.js-plotly-plot').forEach(function (plot) {
      try { global.Plotly.Plots.resize(plot); } catch (_) { /* a plot not yet drawn */ }
    });
  }

  // Say how many experiments there are, and open the comparison section the first
  // time there is something to compare. Reads the rendered table only.
  var compareAutoOpened = false;
  function updateCompareSection() {
    var section = el('evalCompare'), note = el('evalCompareCount'), table = el('comparisonTable');
    if (!section || !note || !table) return;
    // Saved experiments come from the app's own state; the table may list fewer,
    // because by default it shows only experiments comparable with the active one.
    var app = global.LocalRegressionApp;
    var count = app && app.state && Array.isArray(app.state.experiments) ? app.state.experiments.length : 0;
    var listed = table.querySelectorAll('tbody tr').length;
    if (count >= 2) {
      note.textContent = count + ' experiments saved' +
        (listed < count ? ' (' + listed + ' directly comparable with the active one)' : '') +
        '. Sort, chart and choose the model to carry forward.';
      if (!compareAutoOpened) { compareAutoOpened = true; section.open = true; }
    } else {
      note.textContent = 'Train another model, or use “Compare several baseline models” in stage 4, to compare.';
    }
  }

  function wireEvaluate() {
    document.querySelectorAll('#step-diagnostics details.eval-section').forEach(function (section) {
      section.addEventListener('toggle', function () { if (section.open) resizePlotsIn(section); });
    });
    var table = el('comparisonTable');
    if (table && global.MutationObserver) {
      new MutationObserver(updateCompareSection).observe(table, { childList: true, subtree: true });
    }
    updateCompareSection();
  }

  // --- Stage 4: a starting suggestion for model choice ----------------------------
  // Transparent rules of thumb from the data size, stated with their reasons. They
  // propose where to start; they never select a model, and they defer to comparing
  // models on validation error.
  var GP_ROW_LIMIT = 2000, KNN_ROW_LIMIT = 25000;

  function addItem(list, name, reason) {
    var li = document.createElement('li');
    var strong = document.createElement('strong');
    strong.textContent = name;
    li.appendChild(strong);
    li.appendChild(document.createTextNode(' — ' + reason));
    list.appendChild(li);
  }

  function updateModelSuggestion() {
    var box = el('modelSuggestion'), data = el('modelSuggestionData'), list = el('modelSuggestionList'), limits = el('modelSuggestionLimits');
    var app = global.LocalRegressionApp, state = app && app.state;
    if (!box || !state || !Array.isArray(state.rows) || !state.rows.length || !state.target || !state.selectedFeatures || !state.selectedFeatures.size) {
      if (box) box.classList.add('hidden');
      return;
    }
    var rows = state.rows.length, inputs = state.selectedFeatures.size, categorical = 0;
    // Model limits apply to training rows; estimate them from the split if it is set, else 60%.
    var trainPct = Number(el('randomTrainPct') ? el('randomTrainPct').value : 60);
    var trainingRows = Math.round(rows * (isFinite(trainPct) && trainPct > 0 ? trainPct : 60) / 100);
    state.selectedFeatures.forEach(function (name) {
      var profile = state.profiles && state.profiles[name];
      if (profile && profile.type !== 'numeric') categorical += 1;
    });
    data.textContent = 'Your data: ' + rows.toLocaleString('en') + ' rows and ' + inputs + ' input variable' + (inputs === 1 ? '' : 's') +
      (categorical ? ' (' + categorical + ' categorical)' : '') + '.';
    list.textContent = '';
    addItem(list, 'Linear regression', 'start here as the baseline: fast, easy to explain, and the yardstick every other model should beat.');
    if (rows < 300) addItem(list, 'Random forest', 'then a flexible model. With a few hundred rows, a forest is a safe choice: it copes well with small datasets and needs little tuning.');
    else addItem(list, 'Gradient-boosted trees or Random forest', 'then a flexible model. Tree ensembles are usually the strongest general-purpose choice on tabular engineering data.');
    var quadraticTerms = 2 * inputs + inputs * (inputs - 1) / 2;
    if (!categorical && inputs <= 8 && rows * 0.6 >= 2 * (quadraticTerms + 1)) {
      addItem(list, 'Polynomial response surface', 'worth comparing for a smooth relationship you want as an explainable equation (' + quadraticTerms + ' quadratic terms for your ' + inputs + ' inputs).');
    }
    if (trainingRows <= GP_ROW_LIMIT && inputs <= 20 && !categorical) {
      addItem(list, 'Gaussian process', 'also worth a try: with this few rows and all-numeric inputs it can fit smooth relationships and gives built-in uncertainty.');
    }
    var notes = [];
    if (trainingRows > GP_ROW_LIMIT) notes.push('About ' + trainingRows.toLocaleString('en') + ' training rows: exact Gaussian process is limited to ' + GP_ROW_LIMIT.toLocaleString('en') + ', so use its representative-subset option.');
    if (trainingRows > KNN_ROW_LIMIT) notes.push('k-nearest neighbours refuses more than ' + KNN_ROW_LIMIT.toLocaleString('en') + ' training rows by default.');
    if (rows >= 10000) notes.push('At this size, k-nearest neighbours and the neural network can take about a minute to train in the browser.');
    limits.textContent = notes.join(' ');
    limits.classList.toggle('hidden', !notes.length);
    box.classList.remove('hidden');
  }

  // Take the user to the existing baseline-comparison tool, opening it through its
  // own button so the app's behaviour is exactly what a click would do.
  function openBaselineComparison() {
    if (global.EMSProjectShell && global.EMSProjectShell.goToPanel) global.EMSProjectShell.goToPanel('step-split');
    var toggle = el('toggleComparisonToolsBtn');
    if (toggle && toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
    var panel = el('comparisonToolPanel');
    if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function wireModelChoice() {
    var stage = el('step-model');
    if (!stage) return;
    // Refresh whenever stage 4 is shown, so the counts match the current selection.
    if (global.MutationObserver) {
      new MutationObserver(function () {
        if (stage.classList.contains('is-active-panel')) updateModelSuggestion();
      }).observe(stage, { attributes: true, attributeFilter: ['class'] });
    }
    var button = el('openBaselineComparisonBtn');
    if (button) button.addEventListener('click', openBaselineComparison);
    updateModelSuggestion();
  }

  // --- Help opens at the part of the user guide for the current stage ---------------
  // The guide still uses the older step numbering, so the link's title names both.
  var HELP_TARGETS = {
    'step-upload': ['user-guide.html#step-1-start-and-load-data', 'Step 1 — Start and load data'],
    'step-features': ['user-guide.html#step-2-select-features-and-transform-the-target', 'Step 2 — Select features and transform the target'],
    'step-preprocess': ['user-guide.html#step-3-configure-preprocessing', 'Step 3 — Configure preprocessing'],
    'step-model': ['user-guide.html#step-4-select-a-model-and-tune-hyperparameters', 'Step 4 — Select a model and tune hyperparameters'],
    'step-split': ['user-guide.html#step-5-split-and-train', 'Step 5 — Split and train'],
    'step-diagnostics': ['user-guide.html#step-6-review-validate-and-approve', 'Step 6 — Review, validate and approve'],
    'step-predict': ['user-guide.html#step-7-predict-unknown-data', 'Step 7 — Predict unknown data'],
    'step-monitor': ['approval-and-operation.html#package-review-and-retirement', 'Package review and retirement']
  };

  function updateHelpLink() {
    var link = el('topbarHelpLink');
    if (!link) return;
    var active = document.querySelector('#view-project .panel.is-active-panel');
    var target = active && HELP_TARGETS[active.id];
    link.href = './docs/html/' + (target ? target[0] : 'user-guide.html');
    link.title = target ? 'Opens the user guide at “' + target[1] + '”' : 'Opens the user guide';
  }

  function wireHelpLink() {
    var workspace = document.querySelector('#view-project .workspace');
    if (workspace && global.MutationObserver) {
      new MutationObserver(updateHelpLink).observe(workspace, { attributes: true, attributeFilter: ['class'], subtree: true });
    }
    updateHelpLink();
  }

  // --- Stage 4B: what each validation setting means and what to enter ----------------
  // Shown under the group of settings being edited, following the current value.
  var FIELD_HELP = {
    splitStrategy: {
      what: 'How the rows are divided into training (fits the model), validation (chooses settings) and test (the final, untouched check). The test rows must resemble the data the model will be used on, or its score means little.',
      choices: {
        random: 'Rows are shuffled and divided at random. Right when every row is an independent measurement. Wrong when rows come in groups (same specimen, rig or simulation run) or in time order: near-duplicates land in both training and test, and the test score looks better than reality.',
        source: 'Keeps all rows from one group (rig, batch, supplier, simulation run) together, in either training or test. Use it when you will predict for groups the model has not seen: it is the honest test of whether the model transfers.',
        regime: 'Splits by operating regime, such as laminar and turbulent or low and high load: either holding whole regimes out, or splitting within each. Use it to test whether the model works across regimes, or to make sure every regime is represented.',
        time: 'Earlier rows train the model and later rows test it. Use it for logged or transient data, so that the future never leaks into training.'
      }
    },
    randomSeed: {
      what: 'Fixes the random shuffle, so the same seed always gives the same split and the same numbers — essential when comparing models, or when a class should get identical results.',
      choices: function (value) { return 'Seed ' + value + ': keep it fixed while you compare models; at the end, try one other seed to check the result does not depend on one lucky split.'; }
    },
    enableCV: {
      what: 'Re-splits the training rows several times and fits the model on each part, giving an average validation score and how much it varies. It does not change the final model or the test score.',
      choices: {
        'true': 'On: slower (one extra fit per fold), but shows whether the validation score is stable. Most useful for small datasets of a few hundred rows.',
        'false': 'Off: a single validation split. Fine for larger datasets.'
      }
    },
    cvFolds: {
      what: 'How many parts the training rows are divided into for cross-validation.',
      choices: function (value) { return value + ' folds: each fold holds out about 1/' + value + ' of the training rows. 5 is the usual choice; 10 suits small datasets if time allows.'; }
    },
    TrainPct: {
      what: 'The share of rows used to fit the model. The three percentages must add up to 100.',
      choices: function () { return '60 / 20 / 20 is a sound default. More training rows give a better model; more test rows give a more trustworthy score. With fewer than about 300 rows, keep at least 50–60 rows in test; with many thousands, 70 / 15 / 15 or 80 / 10 / 10 is fine.'; }
    },
    ValidationPct: {
      what: 'The share of rows used to choose model settings (for example during tuning). The three percentages must add up to 100.',
      choices: function () { return 'Validation rows are never used to fit the model, so the validation score is an honest guide when comparing settings and models.'; }
    },
    TestPct: {
      what: 'The share of rows kept aside for the final, independent check. The three percentages must add up to 100.',
      choices: function () { return 'Test rows are used once, at the end. Too few and the test score is mostly noise; aim for at least 50–60 rows.'; }
    },
    sourceColumn: { what: 'The column that says which group each row belongs to — for example rig, batch, specimen or simulation run. All rows of a group stay on the same side of the split.' },
    regimeColumn: { what: 'The column that defines the operating regime of each row, such as flow regime or load case.' },
    regimeMode: {
      what: 'How regimes are used in the split.',
      choices: {
        heldout: 'Whole regimes are held out for testing: a strict check that the model works in a regime it never saw.',
        proportional: 'Each regime is split in the same proportions, so every regime appears in training, validation and test.'
      }
    },
    timeColumn: { what: 'The column that gives the time or order of each row; earlier rows are used for training.' },
    timeDirection: {
      what: 'Which end of the time column counts as the past.',
      choices: { ascending: 'Earliest or lowest values are the past and train the model.', descending: 'Latest or highest values are treated as the past; use only if the column counts backwards.' }
    },
    enableUncertainty: {
      what: 'Adds a range around each prediction, not just a single value. The method depends on the model and is named in the results.',
      choices: { 'true': 'On: predictions come with intervals, and Evaluate results shows how often they contained the true value.', 'false': 'Off: point predictions only. Training is faster.' }
    },
    intervalLevel: {
      what: 'How often each interval is meant to contain the true value. In Evaluate results, check that the achieved coverage on the Test row is close to this value.',
      choices: {
        '0.8': '80%: narrow ranges, wrong about 1 time in 5 — for rough screening.',
        '0.9': '90%: a common engineering compromise between width and reliability.',
        '0.95': '95%: the usual default; wrong about 1 time in 20.',
        '0.99': '99%: very wide ranges, and they need plenty of data to be reliable.'
      }
    },
    bootstrapSamples: {
      what: 'Ridge regression only: how many refits are used to estimate its prediction intervals.',
      choices: function (value) { return value + ' refits: more give smoother intervals but take longer. 30 is enough while exploring; 100 for a final model.'; }
    }
  };

  function fieldKey(control) {
    var id = control && control.id;
    if (!id) return null;
    if (FIELD_HELP[id]) return id;
    var match = /(TrainPct|ValidationPct|TestPct)$/.exec(id);
    return match ? match[1] : null;
  }

  function showFieldHelp(control) {
    var key = fieldKey(control);
    if (!key) return;
    var spec = FIELD_HELP[key];
    var group = control.closest('.form-grid') || control.closest('label');
    if (!group) return;
    var slot = group.nextElementSibling && group.nextElementSibling.classList.contains('field-help') ? group.nextElementSibling : null;
    if (!slot) {
      slot = document.createElement('div');
      slot.className = 'field-help';
      slot.setAttribute('aria-live', 'polite');
      group.insertAdjacentElement('afterend', slot);
    }
    document.querySelectorAll('#step-split .field-help').forEach(function (other) { if (other !== slot) other.hidden = true; });
    var value = control.type === 'checkbox' ? String(control.checked) : control.value;
    var choice = typeof spec.choices === 'function' ? spec.choices(value) : (spec.choices ? spec.choices[value] : null);
    var label = control.tagName === 'SELECT' && control.options[control.selectedIndex] ? control.options[control.selectedIndex].text
      : control.type === 'checkbox' ? (control.checked ? 'on' : 'off') : value;
    slot.textContent = '';
    var what = document.createElement('p');
    what.textContent = spec.what;
    slot.appendChild(what);
    if (choice) {
      var p = document.createElement('p');
      p.className = 'prep-choice';
      var lead = document.createElement('strong');
      lead.textContent = 'Your choice — ' + label + ': ';
      p.appendChild(lead);
      p.appendChild(document.createTextNode(choice));
      slot.appendChild(p);
    }
    slot.hidden = false;
  }

  function wireFieldHelp() {
    var stage = el('step-split');
    if (!stage) return;
    // Delegated, so it also covers the split controls the app re-renders per strategy.
    stage.addEventListener('focusin', function (event) { showFieldHelp(event.target); });
    stage.addEventListener('change', function (event) { showFieldHelp(event.target); });
    stage.addEventListener('input', function (event) { if (event.target.type === 'number') showFieldHelp(event.target); });
    var intro = document.createElement('p');
    intro.className = 'fine-print field-help-intro';
    intro.textContent = 'Click any setting to see what it means and what to enter.';
    var firstGrid = stage.querySelector('.form-grid');
    if (firstGrid) firstGrid.insertAdjacentElement('beforebegin', intro);
  }

  // --- Research support: small datasets ------------------------------------------
  // With few rows, a single test split is mostly noise. Say so where the split is
  // chosen, offer cross-validation (through its own checkbox), and remind the user
  // in Evaluate results when the test set is small.
  var SMALL_DATA_ROWS = 300, SMALL_TEST_ROWS = 50;

  function appState() { var app = global.LocalRegressionApp; return app && app.state; }

  function updateSmallDataAdvice() {
    var box = el('smallDataAdvice'), text = el('smallDataAdviceText'), cvButton = el('smallDataEnableCvBtn');
    var state = appState();
    if (!box || !text || !state || !Array.isArray(state.rows) || !state.rows.length) { if (box) box.classList.add('hidden'); return; }
    var n = state.rows.length;
    var strategy = el('splitStrategy') ? el('splitStrategy').value : 'random';
    var pctField = el(strategy + 'TestPct');
    var pct = pctField ? Number(pctField.value) : NaN;
    var testRows = isFinite(pct) ? Math.round(n * pct / 100) : null;
    if (n >= SMALL_DATA_ROWS && (testRows === null || testRows >= SMALL_TEST_ROWS)) { box.classList.add('hidden'); return; }
    var message = 'Small dataset: ' + n.toLocaleString('en') + ' rows' +
      (testRows !== null ? ', so the test set will hold about ' + testRows + ' rows' : '') + '. ' +
      'With this few, scores change noticeably when the split changes, and differences of a few percent between models may be just noise. ' +
      'Turn on k-fold cross-validation: every training row takes a turn in validation, which gives a steadier comparison. ' +
      'Compare models mainly on the cross-validation average, and keep the test set as the final check.';
    if (n < 30) message += ' With fewer than 30 rows, a simple model such as linear regression is usually the safest choice.';
    text.textContent = message;
    var cv = el('enableCV');
    if (cvButton) cvButton.hidden = !cv || cv.checked;
    box.classList.remove('hidden');
  }

  function updateSmallTestNote() {
    var note = el('evalSmallTestNote'), state = appState();
    var a = state && state.artifact;
    var n = a && a.evaluation && a.evaluation.test && a.evaluation.test.pointMetrics ? a.evaluation.test.pointMetrics.n : null;
    if (!note) return;
    if (!n || n >= SMALL_TEST_ROWS) { note.classList.add('hidden'); return; }
    note.textContent = 'Only ' + n + ' rows are in the test set, so treat small differences between models as noise' +
      (a.evaluation.crossValidation ? ' and lean on the cross-validation result.' : '. Cross-validation (stage 4) gives a steadier comparison.');
    note.classList.remove('hidden');
  }

  // --- Research support: methods and reproducibility summary ----------------------
  var SPLIT_NAMES = { random: 'random', source: 'source-grouped', regime: 'regime-aware', time: 'time-based' };
  var TRANSFORM_NAMES = { log: 'natural-logarithm', log10: 'base-10 logarithm', sqrt: 'square-root', boxcox: 'Box–Cox', yeojohnson: 'Yeo–Johnson' };
  var PREP_PHRASES = {
    numericMissing: { mean: 'missing numeric values were replaced with the training mean', median: 'missing numeric values were replaced with the training median', zero: 'missing numeric values were replaced with zero', drop: 'rows with missing numeric values were removed' },
    numericScaling: { standard: 'numeric inputs were standardised', minmax: 'numeric inputs were min–max scaled', none: 'numeric inputs were not scaled' },
    categoricalEncoding: { onehot: 'categorical inputs were one-hot encoded', ordinal: 'categorical inputs were ordinal-encoded', exclude: 'categorical inputs were excluded' }
  };
  var TUNING_NAMES = { grid: 'grid search', random: 'random search', lhs: 'Latin hypercube sampling' };

  function sig(value) {
    if (!isFinite(value)) return 'n/a';
    var a = Math.abs(value);
    return a !== 0 && (a >= 1e6 || a < 1e-3) ? value.toExponential(3) : Number(value.toPrecision(4)).toLocaleString('en');
  }

  function methodsSummary(a) {
    var def = global.LRSPlatform && global.LRSPlatform.getModelDefinition ? global.LRSPlatform.getModelDefinition(a.modelType) : null;
    var model = def && def.label ? def.label : a.modelType;
    var d = a.dataset || {}, fp = d.fingerprint && d.fingerprint.value ? d.fingerprint.value.slice(0, 16) + '…' : 'not recorded';
    var features = Array.isArray(a.selectedFeatures) ? a.selectedFeatures : [];
    var tt = a.targetTransform && a.targetTransform.type && a.targetTransform.type !== 'none'
      ? ' (modelled on a ' + (TRANSFORM_NAMES[a.targetTransform.type] || a.targetTransform.type) + ' scale and converted back)' : '';
    var cfg = (a.preprocessor && a.preprocessor.config) || {};
    // Describe only the preparation steps that actually applied to these inputs: a methods
    // paragraph must not report encoding categories that did not exist, or filling gaps that
    // were not there. Missing-value counts come from the loaded data when it is available.
    var fitted = (a.preprocessor && Array.isArray(a.preprocessor.features)) ? a.preprocessor.features : [];
    var hasNumeric = fitted.some(function (f) { return f.type === 'numeric'; });
    var hasCategorical = fitted.some(function (f) { return f.type === 'categorical'; }) || cfg.categoricalEncoding === 'exclude';
    var state = appState(), profiles = state && state.profiles;
    var numericMissing = profiles ? features.filter(function (name) { var p = profiles[name]; return p && p.type === 'numeric' && p.missing > 0; }).length : null;
    var prep = [];
    if (hasNumeric && numericMissing !== 0 && PREP_PHRASES.numericMissing[cfg.numericMissing]) {
      prep.push((numericMissing === null ? 'any ' : '') + PREP_PHRASES.numericMissing[cfg.numericMissing]);
    }
    if (hasNumeric && PREP_PHRASES.numericScaling[cfg.numericScaling]) prep.push(PREP_PHRASES.numericScaling[cfg.numericScaling]);
    if (hasCategorical && PREP_PHRASES.categoricalEncoding[cfg.categoricalEncoding]) prep.push(PREP_PHRASES.categoricalEncoding[cfg.categoricalEncoding]);
    var split = a.splitConfig || {}, sizes = a.splitSummary || {};
    var params = a.modelParameters && typeof a.modelParameters === 'object'
      ? Object.keys(a.modelParameters).filter(function (k) { var v = a.modelParameters[k]; return k.charAt(0) !== '_' && (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean'); })
          .map(function (k) { return k + ' = ' + a.modelParameters[k]; }) : [];
    var tuning = a.tuning && a.tuning.mode && a.tuning.mode !== 'manual'
      ? ', with settings chosen by ' + (TUNING_NAMES[a.tuning.mode] || a.tuning.mode) + ' over ' + (a.tuning.candidateCount || (a.tuning.trials && a.tuning.trials.length) || 'several') + ' candidates compared on the validation rows' : '';
    var ev = a.evaluation || {}, test = ev.test || {}, pm = test.pointMetrics || {}, um = test.uncertaintyMetrics || {};
    var cv = ev.crossValidation;
    var u = a.uncertainty || {};
    var lines = [];
    lines.push('Modelling was carried out in Engineering ML Studio (application version ' + (a.appVersion || 'unknown') + '), which runs entirely in the web browser. ' +
      'The dataset (' + (d.fileName || 'unnamed file') + '; ' + (d.rowCount || '?') + ' rows, ' + (d.columnCount || '?') + ' columns; SHA-256 fingerprint ' + fp + ') ' +
      'was used to predict ' + a.target + tt + ' from ' + features.length + ' input variable' + (features.length === 1 ? '' : 's') + ': ' + features.join(', ') + '.');
    if (prep.length) lines.push('Preprocessing was fitted on the training rows only: ' + prep.join('; ') + '.');
    lines.push('The data were divided by a ' + (SPLIT_NAMES[split.strategy] || split.strategy || '') + ' split (random seed ' + split.seed + ') into ' +
      sizes.training + ' training, ' + sizes.validation + ' validation and ' + sizes.test + ' test rows' +
      (cv && cv.folds && cv.average ? '; ' + cv.folds + '-fold cross-validation on the training rows gave a mean RMSE of ' + sig(cv.average.rmse) + ' and a mean R² of ' + sig(cv.average.r2) : '') + '.');
    lines.push('A ' + model.charAt(0).toLowerCase() + model.slice(1) + ' model was trained' + (params.length ? ' (' + params.join(', ') + ')' : ' with the default settings') + tuning + '.');
    if (u.enabled) lines.push(Math.round((u.level || 0) * 100) + '% prediction intervals were estimated using: ' + (u.method || 'the model’s interval method') + '.');
    lines.push('On the held-out test rows, RMSE = ' + sig(pm.rmse) + ', MAE = ' + sig(pm.mae) + ' and R² = ' + sig(pm.r2) +
      (u.enabled && isFinite(um.coverage) ? '; the intervals contained ' + Math.round(um.coverage * 100) + '% of the test values against the ' + Math.round((u.level || 0) * 100) + '% requested' : '') + '.');
    lines.push('Experiment ' + (a.experimentId || 'unknown') + ', created ' + (a.createdAt ? a.createdAt.slice(0, 10) : 'unknown') + '.');
    return lines.join(' ');
  }

  var summarisedExperiment = null;
  function updateMethodsSummary() {
    var area = el('methodsSummaryText'), state = appState();
    var a = state && state.artifact;
    if (!area || !a || !a.evaluation) return;
    // Regenerate only for a new experiment, so the user's edits are not overwritten.
    if (a.experimentId && a.experimentId === summarisedExperiment) return;
    summarisedExperiment = a.experimentId || null;
    area.value = methodsSummary(a);
  }

  function copyMethodsSummary() {
    var area = el('methodsSummaryText'), status = el('copyMethodsStatus');
    if (!area) return;
    var done = function () { if (status) status.textContent = 'Copied.'; };
    if (global.navigator && global.navigator.clipboard && global.navigator.clipboard.writeText) {
      global.navigator.clipboard.writeText(area.value).then(done, function () { area.select(); document.execCommand('copy'); done(); });
    } else { area.select(); document.execCommand('copy'); done(); }
  }

  // --- Operational use: approval and governance only when asked for --------------
  var operationalUse = false;
  function updateOperationalGate() {
    var gate = el('operationalUseGate'), governance = el('evalGovernance'), state = appState();
    if (!gate || !governance) return;
    var a = state && state.artifact;
    var hasRecords = Boolean(a && a.approval && Array.isArray(a.approval.history) && a.approval.history.length) ||
      Boolean(state && state.approvedPackage) || document.body.classList.contains('prediction-only');
    if (hasRecords) operationalUse = true;
    gate.hidden = operationalUse;
    governance.classList.toggle('ops-hidden', !operationalUse);
  }

  function wireResearchSupport() {
    var split = el('step-split');
    if (split) {
      split.addEventListener('change', updateSmallDataAdvice);
      split.addEventListener('input', updateSmallDataAdvice);
      if (global.MutationObserver) new MutationObserver(function () {
        if (split.classList.contains('is-active-panel')) updateSmallDataAdvice();
      }).observe(split, { attributes: true, attributeFilter: ['class'] });
    }
    var cvButton = el('smallDataEnableCvBtn');
    if (cvButton) cvButton.addEventListener('click', function () {
      var cv = el('enableCV');
      if (cv && !cv.checked) cv.click();
      updateSmallDataAdvice();
    });
    var table = el('metricsTable');
    var refresh = function () { updateSmallTestNote(); updateMethodsSummary(); updateOperationalGate(); };
    if (table && global.MutationObserver) new MutationObserver(refresh).observe(table, { childList: true, subtree: true });
    var copy = el('copyMethodsSummaryBtn');
    if (copy) copy.addEventListener('click', copyMethodsSummary);
    var enable = el('enableOperationalUseBtn');
    if (enable) enable.addEventListener('click', function () {
      operationalUse = true;
      updateOperationalGate();
      var governance = el('evalGovernance');
      if (governance) { governance.open = true; governance.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    var diagnostics = el('step-diagnostics');
    if (diagnostics && global.MutationObserver) new MutationObserver(function () {
      if (diagnostics.classList.contains('is-active-panel')) refresh();
    }).observe(diagnostics, { attributes: true, attributeFilter: ['class'] });
    updateOperationalGate();
  }

  function init() {
    wireResearchSupport();
    wirePrep();
    wireEvaluate();
    wireModelChoice();
    wireFieldHelp();
    wireHelpLink();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  global.EMSProjectGuidance = Object.freeze({
    methodsSummary: methodsSummary,
    prepHelp: PREP_HELP,
    renderPrepHelp: renderPrepHelp,
    updateModelSuggestion: updateModelSuggestion
  });
})(window);
