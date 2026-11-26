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
    if (rows <= GP_ROW_LIMIT && inputs <= 20 && !categorical) {
      addItem(list, 'Gaussian process', 'also worth a try: with this few rows and all-numeric inputs it can fit smooth relationships and gives built-in uncertainty.');
    }
    var notes = [];
    if (rows > GP_ROW_LIMIT) notes.push('Gaussian process is not available for ' + rows.toLocaleString('en') + ' rows (limit ' + GP_ROW_LIMIT.toLocaleString('en') + ').');
    if (rows > KNN_ROW_LIMIT) notes.push('k-nearest neighbours is not available above ' + KNN_ROW_LIMIT.toLocaleString('en') + ' rows.');
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

  // --- Every stage: a compact strip of the steps in this stage ---------------------
  // Each step names the control it refers to; clicking it scrolls there (opening a
  // closed section first) and briefly highlights it. Navigation only.
  var STAGE_STEPS = {
    'step-upload': [
      ['Load a CSV file, or continue earlier work', '#dropZone'],
      ['Check the row and column summary', '#datasetSummary'],
      ['Continue to inputs and target', '#step-upload .stage-continue']
    ],
    'step-features': [
      ['Choose the quantity to predict', '#targetColumn'],
      ['Decide whether to transform it', '#targetTransform', true],
      ['Select the input variables', '#autoFeaturesBtn'],
      ['Review the data-quality findings', '#dataQualitySummary']
    ],
    'step-preprocess': [
      ['Start from the recommended defaults', '#step-preprocess .recommendation-note'],
      ['Change only the settings that apply to your data', '#prepGroupNumeric'],
      ['Check the estimated processed features', '#preprocessEstimate']
    ],
    'step-model': [
      ['Read the starting suggestion', '#modelSuggestion'],
      ['Pick a model — begin with linear regression', '#step-model .model-group'],
      ['Adjust advanced settings', '#step-model .advanced-settings', true]
    ],
    'step-split': [
      ['Choose how to split the data', '#splitStrategy'],
      ['Decide on prediction intervals', '#enableUncertainty'],
      ['Preview the split', '#previewSplitBtn', true],
      ['Train and evaluate — or compare several models', '#trainBtn']
    ],
    'step-diagnostics': [
      ['Judge the model on the Test row', '#evalSummary'],
      ['Check the errors for patterns', '#evalErrors'],
      ['Compare experiments, if you trained several', '#evalCompare', true],
      ['Save the project', '#evalSave']
    ],
    'step-predict': [
      ['Have a model ready: trained here or an approved package', '#approvedPackageSummary'],
      ['Upload a CSV of new input conditions', '#predictionFile'],
      ['Check how many rows are inside the training range', '#predictionSummary'],
      ['Download the predicted values', '#downloadUnknownPredictionsBtn']
    ],
    'step-monitor': [
      ['Upload results measured in service, with their predictions', '#monitoringFile'],
      ['Analyse monitoring data', '#analyseMonitoringBtn'],
      ['Set and evaluate revalidation triggers', '#monitorMaxRmse'],
      ['Decide whether the model needs revalidating', '#revalidationSummary']
    ]
  };

  function goToStepTarget(selector) {
    var target = document.querySelector(selector);
    if (!target) return;
    if (target.type === 'file' && target.closest('label')) target = target.closest('label');
    var section = target.closest('details');
    if (target.tagName === 'DETAILS') target.open = true;
    else if (section && !section.open && !section.classList.contains('stage-guidance')) section.open = true;
    if (!target.offsetParent) return; // not shown yet (e.g. appears after a later action)
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.remove('step-target-flash');
    void target.offsetWidth;
    target.classList.add('step-target-flash');
    if (typeof target.focus === 'function' && /^(SELECT|INPUT|BUTTON|TEXTAREA)$/.test(target.tagName)) target.focus({ preventScroll: true });
  }

  function buildStageSteps() {
    Object.keys(STAGE_STEPS).forEach(function (panelId) {
      var panel = el(panelId);
      if (!panel || panel.querySelector('.stage-steps')) return;
      var list = document.createElement('ol');
      list.className = 'stage-steps';
      list.setAttribute('aria-label', 'Steps in this stage');
      STAGE_STEPS[panelId].forEach(function (step, index) {
        var li = document.createElement('li');
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'stage-step';
        button.setAttribute('data-step-target', step[1]);
        var num = document.createElement('span');
        num.className = 'stage-step-num';
        num.textContent = String(index + 1);
        var text = document.createElement('span');
        text.className = 'stage-step-text';
        text.textContent = step[0];
        button.appendChild(num);
        button.appendChild(text);
        if (step[2]) {
          var optional = document.createElement('span');
          optional.className = 'stage-step-optional';
          optional.textContent = 'optional';
          button.appendChild(optional);
        }
        button.addEventListener('click', function () { goToStepTarget(step[1]); });
        li.appendChild(button);
        list.appendChild(li);
      });
      var anchor = panel.querySelector('.stage-guidance') || panel.querySelector('.panel-heading');
      if (anchor) anchor.insertAdjacentElement('afterend', list);
    });
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

  function init() {
    wirePrep();
    wireEvaluate();
    wireModelChoice();
    buildStageSteps();
    wireFieldHelp();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  global.EMSProjectGuidance = Object.freeze({
    prepHelp: PREP_HELP,
    renderPrepHelp: renderPrepHelp,
    updateModelSuggestion: updateModelSuggestion
  });
})(window);
