// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 UK Research and Innovation (UKRI)
// Engineering ML Studio — Project-mode guidance (presentation only).
//
// Explains the Project-mode settings in plain engineering language: what each
// setting does, what the currently selected choice means, and when to change
// it. This module only reads control values and writes explanatory text. It
// never changes a setting, never reads the dataset, and never computes a
// result; the inherited app (js/app.js) remains the only owner of state.

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

  function init() {
    wirePrep();
    wireEvaluate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  global.EMSProjectGuidance = Object.freeze({
    prepHelp: PREP_HELP,
    renderPrepHelp: renderPrepHelp
  });
})(window);
