// Engineering ML Studio — Explore mode controller (Phase 1 prototype).
//
// A guided, beginner-friendly, four-stage regression workflow built around a
// concrete engineering problem — predicting the pressure drop of a fluid
// flowing through a pipe:
//
//   1. Understand the pressure-drop problem
//   2. Choose an approach (simple trend → flexible relationship → compare)
//   3. Train and compare predictions
//   4. Interpret the engineering meaning
//
// The journey starts from the engineering problem, not from model names. Model
// names (Linear Regression, Decision Tree, Random Forest) are kept visible but
// secondary, introduced gradually as "approaches".
//
// It reuses the SAME computation the full Project mode uses — CSV parsing
// (window.CSVEngine), column inference / splitting / preprocessing / metrics
// (window.MLCore), the model adapter (window.LRSPlatform.getModelAdapter) and
// plotting (window.Plotly). No machine-learning maths is duplicated here; this
// module only orchestrates those existing functions and renders a simple UI.
//
// All processing runs locally in the browser. The only network requests are
// same-origin fetches of the bundled example CSV files.
(function (global) {
  'use strict';

  // --- Bundled examples (provenance documented & confirmed MIT-reusable). -------
  // See examples/README.md. The primary, default example is the synthetic pipe
  // pressure-drop dataset (a documented engineering demonstration). A generic
  // nonlinear dataset is retained only as a secondary mathematical demonstration.
  var EXAMPLES = [
    {
      key: 'pipe',
      file: './examples/pipe_pressure_drop_sample.csv',
      engineering: true,
      title: 'Predict pressure drop in a pipe',
      short: 'Pressure drop in a pipe',
      target: 'pressure_drop_kpa',
      targetLabel: 'pressure drop',
      unit: 'kPa',
      intro: 'A fluid flowing through a pipe loses pressure to friction along the pipe wall. ' +
        'Mechanical and thermal engineers need to estimate this pressure drop to size pumps, ' +
        'choose pipe diameters and check whether a flow system will work. Here we predict the ' +
        'pressure drop from a few properties of the pipe and the fluid.',
      inputs: [
        { name: 'flow_velocity_m_s', label: 'Mean flow velocity', unit: 'm/s' },
        { name: 'pipe_length_m', label: 'Pipe length', unit: 'm' },
        { name: 'pipe_diameter_m', label: 'Internal pipe diameter', unit: 'm' },
        { name: 'fluid_density_kg_m3', label: 'Fluid density', unit: 'kg/m³' },
        { name: 'dynamic_viscosity_pa_s', label: 'Dynamic viscosity', unit: 'Pa·s' }
      ],
      features: ['pipe_length_m', 'pipe_diameter_m', 'flow_velocity_m_s', 'fluid_density_kg_m3', 'dynamic_viscosity_pa_s'],
      keyInputs: 'flow velocity, pipe length, diameter, fluid density, viscosity',
      trendText: 'Pressure drop generally increases when flow velocity or pipe length increases, ' +
        'and decreases when the pipe diameter increases.',
      // Structured trends used for the deterministic engineering checks in stage 4.
      trends: [
        { feature: 'flow_velocity_m_s', label: 'flow velocity', direction: 'increase' },
        { feature: 'pipe_length_m', label: 'pipe length', direction: 'increase' },
        { feature: 'pipe_diameter_m', label: 'pipe diameter', direction: 'decrease' }
      ],
      rangeText: 'The dataset has 500 rows. Pressure drop ranges from roughly 0.1 kPa to just over ' +
        '200 kPa across the sampled conditions, and every row is in turbulent flow.',
      disclaimer: 'This is a <strong>synthetic demonstration dataset</strong>, generated from a documented ' +
        'engineering equation (Darcy–Weisbach) with a fixed random seed and a small amount of added noise. ' +
        'It is not experimental, validated or safety-grade data, and must not be used for real design.',
      schematic: true,
      approxRows: 500
    },
    {
      key: 'nonlinear',
      file: './examples/nonlinear_regression_sample.csv',
      engineering: false,
      title: 'Explore a generic nonlinear relationship',
      short: 'Generic nonlinear signal',
      target: 'target',
      targetLabel: 'target',
      unit: '',
      intro: 'This is a purely mathematical dataset in which the target varies non-linearly with a ' +
        'few input variables. It is <strong>not an engineering dataset</strong>. It is included only to ' +
        'show clearly why a simple linear model struggles with curved relationships, and why a more ' +
        'flexible model can do better.',
      inputs: [
        { name: 'x1', label: 'Input x1', unit: '' },
        { name: 'x2', label: 'Input x2', unit: '' },
        { name: 'time', label: 'Time index', unit: '' },
        { name: 'source', label: 'Source group', unit: '' },
        { name: 'regime', label: 'Regime label', unit: '' }
      ],
      features: ['time', 'x1', 'x2', 'source', 'regime'],
      keyInputs: 'x1, x2, time, source, regime',
      trendText: '',
      trends: [],
      rangeText: 'A synthetic mathematical dataset of a few hundred rows spanning two continuous inputs.',
      disclaimer: 'This is a <strong>mathematical demonstration</strong>, not an engineering dataset. Use it to ' +
        'understand model behaviour, not to draw any engineering conclusion.',
      schematic: false,
      approxRows: 360
    }
  ];

  var MODEL_LABELS = { linear: 'Linear Regression', tree: 'Decision Tree', forest: 'Random Forest' };

  // Approaches are the beginner-facing choice; model names are the secondary detail.
  var APPROACHES = {
    simple:   { models: ['linear'] },
    flexible: { models: ['forest'] },
    compare:  { models: ['linear', 'tree', 'forest'] }
  };
  var COMPARE_ORDER = ['linear', 'tree', 'forest'];

  // Deterministic, sensible defaults shared with Project mode.
  var PREPROCESS = {
    numericScaling: 'standard', numericMissing: 'mean',
    categoricalEncoding: 'onehot', categoricalMissing: 'mode',
    dropFirstCategory: false, maxCategories: 50
  };
  var SEED = 42;
  var SPLIT = { seed: SEED, percentages: { training: 70, validation: 15, test: 15 } };

  var state = {
    wired: false,
    exampleKey: EXAMPLES[0].key,
    dataset: null,       // { key, rows, headers, profiles, target, features }
    approach: 'simple',
    focusModel: 'linear',// the model currently shown in the plot / interpretation
    stage: 1,
    results: {},         // modelType -> pipeline result
    busy: false
  };

  function el(id) { return document.getElementById(id); }

  function globalsReady() {
    return !!(global.MLCore && global.LRSPlatform && global.CSVEngine);
  }

  function fmt(x) {
    if (x == null || !isFinite(x)) return '—';
    var a = Math.abs(x);
    if (a >= 100) return x.toFixed(1);
    if (a >= 1) return x.toFixed(2);
    return x.toFixed(4);
  }
  function fmtR2(x) { return (x == null || !isFinite(x)) ? '—' : x.toFixed(3); }
  function pct(x) { return (x == null || !isFinite(x)) ? '—' : Math.round(x * 100) + '%'; }
  // Format a value with the current example's physical unit, when it has one.
  function fmtU(x) {
    var u = currentUnit();
    return u ? (fmt(x) + ' ' + u) : fmt(x);
  }
  function currentUnit() {
    var ex = exampleByKey(state.exampleKey);
    return ex && ex.unit ? ex.unit : '';
  }
  function escapeHtml(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function exampleByKey(key) {
    for (var i = 0; i < EXAMPLES.length; i++) if (EXAMPLES[i].key === key) return EXAMPLES[i];
    return EXAMPLES[0];
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // --- Stage 1: understand the problem ------------------------------------------
  // Lightweight inline SVG schematic — no external assets, no network.
  var PIPE_SCHEMATIC =
    '<svg class="explore-schematic" viewBox="0 0 320 96" role="img" ' +
        'aria-label="A fluid flowing left to right through a horizontal pipe of length L and diameter D, ' +
        'with higher pressure at the inlet than the outlet.">' +
      '<rect x="20" y="34" width="280" height="28" rx="3" fill="#e7f4f7" stroke="#125f76" stroke-width="2"></rect>' +
      '<line x1="20" y1="48" x2="292" y2="48" stroke="#125f76" stroke-width="2" stroke-dasharray="6 6"></line>' +
      '<polygon points="292,42 304,48 292,54" fill="#125f76"></polygon>' +
      '<text x="150" y="26" text-anchor="middle" font-size="12" fill="#16202a">flow velocity v &#8594;</text>' +
      '<text x="150" y="84" text-anchor="middle" font-size="12" fill="#16202a">length L</text>' +
      '<text x="9" y="52" text-anchor="middle" font-size="12" fill="#16202a">D</text>' +
      '<text x="40" y="52" font-size="11" fill="#a52b2b">high p</text>' +
      '<text x="252" y="52" font-size="11" fill="#a52b2b">low p</text>' +
    '</svg>';

  function renderProblem() {
    var host = el('exploreProblem');
    if (!host) return;
    var ex = exampleByKey(state.exampleKey);

    var inputRows = ex.inputs.map(function (inp) {
      return '<li><strong>' + escapeHtml(inp.label) + '</strong>' +
        (inp.unit ? ' <span class="explore-unit">(' + escapeHtml(inp.unit) + ')</span>' : '') + '</li>';
    }).join('');

    var trendBlock = ex.trendText
      ? '<div class="info-box compact-box"><strong>Expected trend:</strong> ' + escapeHtml(ex.trendText) + '</div>'
      : '';

    var schematic = ex.schematic ? '<div class="explore-schematic-wrap">' + PIPE_SCHEMATIC + '</div>' : '';

    host.innerHTML =
      '<p class="explore-problem-intro">' + ex.intro + '</p>' +
      schematic +
      '<div class="explore-problem-grid">' +
        '<div class="explore-problem-card">' +
          '<h3>Inputs</h3><ul class="explore-input-list">' + inputRows + '</ul>' +
        '</div>' +
        '<div class="explore-problem-card">' +
          '<h3>What we predict</h3>' +
          '<p class="explore-target">' + escapeHtml(cap(ex.targetLabel)) +
            (ex.unit ? ' <span class="explore-unit">(' + escapeHtml(ex.unit) + ')</span>' : '') + '</p>' +
          '<p class="fine-print">' + escapeHtml(ex.rangeText) + '</p>' +
        '</div>' +
      '</div>' +
      trendBlock +
      '<div class="warning-box explore-disclaimer">' + ex.disclaimer + '</div>';

    renderExampleSwitch();
  }

  // A clearly-secondary switch so the pipe problem stays the default focus.
  function renderExampleSwitch() {
    var host = el('exploreExampleSwitch');
    if (!host) return;
    host.innerHTML = EXAMPLES.map(function (ex) {
      var checked = ex.key === state.exampleKey ? ' checked' : '';
      var tag = ex.engineering ? 'Engineering example' : 'Maths demonstration';
      return '<label class="explore-switch-option">' +
        '<input type="radio" name="exploreExample" value="' + ex.key + '"' + checked + '>' +
        '<span><strong>' + escapeHtml(ex.short) + '</strong>' +
        '<small>' + tag + '</small></span></label>';
    }).join('');
    host.querySelectorAll('input[name="exploreExample"]').forEach(function (input) {
      input.addEventListener('change', function () { selectExample(input.value); });
    });
  }

  function selectExample(key) {
    if (state.exampleKey !== key) {
      state.exampleKey = key;
      state.dataset = null;
      resetResults();
      renderProblem();
    }
    // Preload in the background so training feels instant; ignore failures here.
    loadDataset(key).catch(function () {});
  }

  function loadDataset(key) {
    var ex = exampleByKey(key);
    if (state.dataset && state.dataset.key === key) return Promise.resolve(state.dataset);
    if (!globalsReady()) return Promise.reject(new Error('The application is still loading. Please try again in a moment.'));
    return fetch(ex.file).then(function (response) {
      if (!response.ok) throw new Error('Could not load the example dataset (' + response.status + ').');
      return response.text();
    }).then(function (text) {
      var parsed = global.CSVEngine.parse(text, { header: true, skipEmptyLines: true });
      var rows = (parsed.data || []).filter(function (row) {
        return row && Object.keys(row).some(function (k) { return String(row[k] == null ? '' : row[k]).trim() !== ''; });
      });
      var headers = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : (rows[0] ? Object.keys(rows[0]) : []);
      var features = ex.features.filter(function (f) { return headers.indexOf(f) !== -1; });
      var dataset = {
        key: key, rows: rows, headers: headers,
        profiles: global.MLCore.inferColumns(rows, headers),
        target: ex.target, features: features
      };
      state.dataset = dataset;
      return dataset;
    });
  }

  // --- Stage 2: choose an approach ----------------------------------------------
  function selectedApproach() {
    var checked = document.querySelector('input[name="exploreApproach"]:checked');
    return checked ? checked.value : 'simple';
  }

  function modelsForApproach(approach) {
    return (APPROACHES[approach] || APPROACHES.simple).models.slice();
  }

  function updateApproachControls() {
    state.approach = selectedApproach();
    // Tree/forest controls are only relevant when a flexible model is involved.
    var usesTrees = state.approach === 'flexible' || state.approach === 'compare';
    var depth = el('exploreDepthField');
    var trees = el('exploreTreesField');
    if (depth) depth.classList.toggle('is-hidden', !usesTrees);
    if (trees) trees.classList.toggle('is-hidden', !usesTrees);
    var controls = el('exploreControls');
    if (controls) controls.classList.toggle('is-hidden', !usesTrees);
  }

  function clampInt(value, min, max, fallback) {
    var n = Math.round(Number(value));
    if (!isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function paramsFor(modelType) {
    if (modelType === 'tree') {
      return { maxDepth: clampInt(el('exploreMaxDepth') && el('exploreMaxDepth').value, 2, 15, 8), minLeaf: 5, maxThresholds: 24, maxFeatures: 'all' };
    }
    if (modelType === 'forest') {
      return {
        nTrees: clampInt(el('exploreNTrees') && el('exploreNTrees').value, 10, 120, 40),
        maxDepth: clampInt(el('exploreMaxDepth') && el('exploreMaxDepth').value, 2, 15, 8),
        minLeaf: 5, sampleRate: 0.8, maxThresholds: 20, maxFeatures: 'sqrt', maxRowsPerTree: 20000
      };
    }
    return {}; // linear
  }

  // --- Stage 3: the shared training pipeline (reuses MLCore + LRSPlatform) --------
  function runPipeline(dataset, modelType, params) {
    var ML = global.MLCore;
    var split = ML.splitRows(dataset.rows, dataset.target, SPLIT);
    var rawTrain = split.training.map(function (e) { return e.row; });
    var rawTest = split.test.map(function (e) { return e.row; });
    var pre = ML.fitPreprocessor(rawTrain, dataset.features, PREPROCESS, dataset.profiles);
    if (!pre.outputNames.length) throw new Error('No usable features remain for this example.');
    var tTrain = ML.transformRows(rawTrain, pre, dataset.target, true);
    var tTest = ML.transformRows(rawTest, pre, dataset.target, true);
    var tt = ML.fitTargetTransform(tTrain.y, 'none');
    var yTrain = ML.applyTargetTransform(tTrain.y, tt);
    var adapter = global.LRSPlatform.getModelAdapter(modelType);
    return Promise.resolve(adapter.fit(tTrain.X, yTrain, params, SEED)).then(function (model) {
      ML.fitSmearing(tt, yTrain, adapter.predict(model, tTrain.X));
      var predTrain = ML.inverseTargetTransform(adapter.predict(model, tTrain.X), tt, true);
      var predTest = ML.inverseTargetTransform(adapter.predict(model, tTest.X), tt, true);
      return {
        trainMetrics: ML.metrics(tTrain.y, predTrain),
        testMetrics: ML.metrics(tTest.y, predTest),
        actual: tTest.y.slice(),
        predicted: predTest.slice(),
        params: params,
        counts: { training: tTrain.y.length, test: tTest.y.length },
        // Kept for the deterministic engineering checks in stage 4.
        model: model, adapter: adapter, pre: pre, tt: tt,
        rawTrain: rawTrain, features: dataset.features, target: dataset.target
      };
    });
  }

  function setBusy(busy, message) {
    state.busy = busy;
    var status = el('exploreTrainStatus');
    if (status) {
      status.classList.toggle('is-hidden', !busy && !message);
      status.textContent = message || '';
    }
    var b = el('exploreTrainBtn'); if (b) b.disabled = busy;
  }

  function bestModel(types) {
    var best = null, bestR2 = -Infinity;
    types.forEach(function (t) {
      var r = state.results[t];
      if (r && isFinite(r.testMetrics.r2) && r.testMetrics.r2 > bestR2) { bestR2 = r.testMetrics.r2; best = t; }
    });
    return best || types[0];
  }

  function train() {
    if (state.busy) return Promise.resolve();
    updateApproachControls();
    var types = modelsForApproach(state.approach);
    setBusy(true, 'Training locally…');
    return loadDataset(state.exampleKey).then(function (dataset) {
      state.results = {};
      // Sequential to keep the UI responsive and results deterministic.
      return types.reduce(function (chain, modelType) {
        return chain.then(function () {
          return runPipeline(dataset, modelType, paramsFor(modelType)).then(function (res) {
            state.results[modelType] = res;
          });
        });
      }, Promise.resolve());
    }).then(function () {
      setBusy(false, '');
      state.focusModel = bestModel(types);
      renderComparison();
      renderFocusSelector();
      renderPlot(state.focusModel);
      renderInterpretation(state.focusModel);
      renderEngineering(state.focusModel);
      var next = el('exploreToStage4');
      if (next) next.disabled = false;
    }).catch(function (error) {
      setBusy(false, '');
      var status = el('exploreTrainStatus');
      if (status) { status.classList.remove('is-hidden'); status.textContent = error.message || 'Training failed.'; }
    });
  }

  function trainedTypes() {
    return COMPARE_ORDER.filter(function (k) { return state.results[k]; });
  }

  function renderComparison() {
    var table = el('exploreComparison');
    var wrap = el('exploreComparisonWrap');
    if (!table) return;
    var trained = trainedTypes();
    if (!trained.length) { if (wrap) wrap.classList.add('is-hidden'); return; }
    var unitSuffix = currentUnit() ? ' (' + currentUnit() + ')' : '';
    var body = trained.map(function (k) {
      var r = state.results[k];
      var sel = k === state.focusModel ? ' class="is-selected"' : '';
      return '<tr' + sel + '><td>' + MODEL_LABELS[k] + '</td>' +
        '<td>' + fmt(r.testMetrics.rmse) + '</td>' +
        '<td>' + fmtR2(r.testMetrics.r2) + '</td>' +
        '<td>' + fmt(r.trainMetrics.rmse) + '</td></tr>';
    }).join('');
    table.innerHTML = '<thead><tr><th>Approach</th><th>Test RMSE' + unitSuffix + '</th>' +
      '<th>Test R²</th><th>Training RMSE' + unitSuffix + '</th></tr></thead><tbody>' + body + '</tbody>';
    if (wrap) wrap.classList.remove('is-hidden');
  }

  // When comparing, let the user pick which approach's plot/explanation to view.
  function renderFocusSelector() {
    var wrap = el('exploreFocusWrap');
    var sel = el('exploreFocusModel');
    if (!wrap || !sel) return;
    var trained = trainedTypes();
    if (trained.length < 2) { wrap.classList.add('is-hidden'); return; }
    sel.innerHTML = trained.map(function (k) {
      var s = k === state.focusModel ? ' selected' : '';
      return '<option value="' + k + '"' + s + '>' + MODEL_LABELS[k] + '</option>';
    }).join('');
    wrap.classList.remove('is-hidden');
  }

  function renderPlot(modelType) {
    var res = state.results[modelType];
    var card = el('explorePlotCard');
    if (!res || !global.Plotly) { if (card) card.classList.add('is-hidden'); return; }
    if (card) card.classList.remove('is-hidden');
    var ex = exampleByKey(state.exampleKey);
    var unit = currentUnit();
    var label = ex.targetLabel + (unit ? ' (' + unit + ')' : '');
    var all = res.actual.concat(res.predicted).filter(function (v) { return isFinite(v); });
    var min = Math.min.apply(null, all), max = Math.max.apply(null, all);
    if (!isFinite(min) || !isFinite(max) || min === max) { min = min - 1; max = max + 1; }
    var traces = [
      { x: res.actual, y: res.predicted, mode: 'markers', type: 'scatter', name: 'Test rows',
        marker: { color: '#125f76', size: 8, opacity: 0.75 },
        hovertemplate: 'Actual %{x}<br>Predicted %{y}<extra></extra>' },
      { x: [min, max], y: [min, max], mode: 'lines', type: 'scatter', name: 'Perfect prediction',
        line: { dash: 'dash', color: '#a52b2b' }, hoverinfo: 'skip' }
    ];
    var layout = {
      title: { text: MODEL_LABELS[modelType] + ': actual vs predicted (test data)', font: { size: 15 } },
      xaxis: { title: { text: 'Actual ' + label }, automargin: true },
      yaxis: { title: { text: 'Predicted ' + label }, automargin: true },
      margin: { l: 60, r: 20, t: 50, b: 55 }, legend: { orientation: 'h', y: -0.22 },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', hovermode: 'closest'
    };
    global.Plotly.react('explorePlot', traces, layout, { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d'] });
  }

  // --- Stage 4: deterministic, rule-based interpretation -------------------------
  function r2Quality(r2) {
    if (!isFinite(r2)) return 'could not be computed';
    if (r2 < 0) return 'worse than simply predicting the average';
    if (r2 < 0.25) return 'very weak';
    if (r2 < 0.5) return 'weak';
    if (r2 < 0.75) return 'moderate';
    if (r2 < 0.9) return 'good';
    return 'strong';
  }

  function overfitVerdict(trainRmse, testRmse) {
    if (!isFinite(trainRmse) || !isFinite(testRmse)) return null;
    if (trainRmse <= 1e-9) {
      return testRmse > 1e-6
        ? { level: 'high', text: 'The model is almost perfect on training data but has real error on test data. That is a classic sign of overfitting.' }
        : { level: 'low', text: 'Training and test errors are both essentially zero for this simple example.' };
    }
    var ratio = testRmse / trainRmse;
    if (ratio > 1.5) return { level: 'high', text: 'Test error is much larger than training error (about ' + ratio.toFixed(1) + '×). This suggests overfitting: the model has partly memorised the training data, so a low training error alone is not enough — the test error is what matters.' };
    if (ratio > 1.2) return { level: 'medium', text: 'Test error is somewhat larger than training error (about ' + ratio.toFixed(1) + '×). There may be mild overfitting, so judge the model by its test error, not its training error.' };
    return { level: 'low', text: 'Training and test errors are similar, which suggests the model generalises reasonably to unseen rows. Note that a low training error on its own is never enough — the test error is what shows real performance.' };
  }

  function renderInterpretation(modelType) {
    var host = el('exploreInterpretation');
    if (!host) return;
    var res = state.results[modelType];
    if (!res) { host.innerHTML = '<p class="fine-print">Train a model to see an explanation of the results.</p>'; return; }
    var ex = exampleByKey(state.exampleKey);
    var target = ex.targetLabel;
    var unit = currentUnit();
    var testR2 = res.testMetrics.r2, testRmse = res.testMetrics.rmse, trainRmse = res.trainMetrics.rmse;
    var of = overfitVerdict(trainRmse, testRmse);
    var cards = [];

    cards.push({
      title: 'Which approach is this? (' + MODEL_LABELS[modelType] + ')',
      body: modelExplanation(modelType)
    });

    cards.push({
      title: 'How good is the fit? (R² = ' + fmtR2(testR2) + ')',
      body: 'R² measures how much of the variation in ' + escapeHtml(target) + ' the model explains on test data. ' +
        (isFinite(testR2) && testR2 >= 0 ? ('Here it explains about ' + pct(testR2) + ', which is a ' + r2Quality(testR2) + ' fit.')
          : ('Here the fit is ' + r2Quality(testR2) + '.')) +
        ' A value of 1 is perfect; 0 means no better than predicting the average.'
    });

    cards.push({
      title: 'How large are the errors? (Test RMSE ≈ ' + fmtU(testRmse) + ')',
      body: 'RMSE is the typical size of the prediction error, in the units of ' + escapeHtml(target) +
        (unit ? ' (' + escapeHtml(unit) + ')' : '') + '. ' +
        'On average, predictions on the ' + res.counts.test + ' test rows are off by about ' + fmtU(testRmse) + '. ' +
        'For comparison, the training error was about ' + fmtU(trainRmse) + '.'
    });

    if (of) {
      cards.push({ title: 'Is it overfitting?', body: of.text, level: of.level });
    }

    cards.push({
      title: 'Reading the actual-vs-predicted plot',
      body: 'Each point is one test row. The horizontal axis is the true ' + escapeHtml(target) +
        (unit ? ' in ' + escapeHtml(unit) : '') + ' and the vertical axis is the model\'s prediction. ' +
        'Points on the dashed diagonal are perfect predictions; points far above or below the line are larger errors. ' +
        'A tight cloud along the diagonal means accurate predictions.'
    });

    host.innerHTML = cards.map(function (c) {
      var cls = 'explore-insight' + (c.level ? ' level-' + c.level : '');
      return '<div class="' + cls + '"><h3>' + c.title + '</h3><p>' + c.body + '</p></div>';
    }).join('');
  }

  // Beginner-friendly, deterministic model descriptions (see docs/EXPLORE_MODE.md).
  function modelExplanation(modelType) {
    if (modelType === 'linear') {
      return 'Linear Regression learns a weighted relationship: each input is multiplied by a number and the ' +
        'results are added up. It is easy to interpret, but because it combines the inputs in a straight-line ' +
        'way it can struggle when the true relationship is curved.';
    }
    if (modelType === 'tree') {
      return 'A Decision Tree divides the input conditions into regions with a series of yes/no questions and ' +
        'predicts a value for each region. It can capture nonlinear behaviour, but a deep tree may overfit by ' +
        'memorising the training rows.';
    }
    if (modelType === 'forest') {
      return 'A Random Forest combines many decision trees and averages them, which makes it more stable than a ' +
        'single tree. It handles nonlinear relationships well, but it is less transparent than a straight-line ' +
        'model and it may extrapolate poorly beyond the range of the training data.';
    }
    return '';
  }

  // Predict the target for a set of raw feature rows using an already-fitted result.
  function predictRaw(res, rows) {
    var ML = global.MLCore;
    var t = ML.transformRows(rows, res.pre, null, false);
    var pred = res.adapter.predict(res.model, t.X);
    return ML.inverseTargetTransform(pred, res.tt, true);
  }

  // Build a baseline row from the median of each feature in the training data.
  function baselineRow(res) {
    var ML = global.MLCore;
    var row = {};
    res.features.forEach(function (f) {
      var nums = res.rawTrain.map(function (r) { return ML.toNumber(r[f]); }).filter(function (v) { return isFinite(v); });
      if (nums.length) row[f] = ML.median(nums);
      else {
        // Categorical: use the most common raw value.
        var counts = {};
        res.rawTrain.forEach(function (r) { var v = r[f]; if (v != null && v !== '') counts[v] = (counts[v] || 0) + 1; });
        var bestVal = '', bestN = -1;
        Object.keys(counts).forEach(function (k) { if (counts[k] > bestN) { bestN = counts[k]; bestVal = k; } });
        row[f] = bestVal;
      }
    });
    return row;
  }

  function featureQuantiles(res, feature) {
    var ML = global.MLCore;
    var nums = res.rawTrain.map(function (r) { return ML.toNumber(r[feature]); }).filter(function (v) { return isFinite(v); });
    if (!nums.length) return null;
    return { low: ML.quantile(nums, 0.1), high: ML.quantile(nums, 0.9) };
  }

  // Deterministic engineering checks: does the model reproduce the expected trends,
  // are its predictions physically plausible, and is it being used inside its range?
  function renderEngineering(modelType) {
    var host = el('exploreEngineering');
    if (!host) return;
    var ex = exampleByKey(state.exampleKey);
    var res = state.results[modelType];
    if (!res) { host.innerHTML = ''; return; }

    if (!ex.engineering || !ex.trends.length) {
      host.innerHTML = '<h3 class="explore-engineering-title">Engineering interpretation</h3>' +
        '<div class="explore-insight"><h3>Not an engineering dataset</h3>' +
        '<p>This example is a mathematical demonstration, so there are no physical trend checks. ' +
        'Switch to the pressure-drop example to see engineering-specific interpretation.</p></div>';
      return;
    }

    var base = baselineRow(res);
    var cards = [];
    var trendItems = [];

    ex.trends.forEach(function (tr) {
      var q = featureQuantiles(res, tr.feature);
      if (!q) return;
      var lowRow = Object.assign({}, base); lowRow[tr.feature] = q.low;
      var highRow = Object.assign({}, base); highRow[tr.feature] = q.high;
      var preds = predictRaw(res, [lowRow, highRow]);
      var delta = preds[1] - preds[0];
      var observed = delta > 0 ? 'increase' : (delta < 0 ? 'decrease' : 'stay flat');
      var matches = observed === tr.direction;
      var verb = tr.direction === 'increase' ? 'increase' : 'decrease';
      trendItems.push('<li class="' + (matches ? 'trend-ok' : 'trend-warn') + '">' +
        'As <strong>' + escapeHtml(tr.label) + '</strong> increases, the predicted ' + escapeHtml(ex.targetLabel) +
        ' <strong>' + observed + 's</strong> (by about ' + fmtU(Math.abs(delta)) + '). ' +
        (matches
          ? 'This matches the expected physical trend (it should ' + verb + ').'
          : 'This does <strong>not</strong> match the expected physical trend (it should ' + verb + ') — a warning sign for this model.') +
        '</li>');
    });

    cards.push({
      title: 'Does the model follow the expected physical trends?',
      html: '<p>Holding the other inputs at typical (median) values and varying one input across its usual range:</p>' +
        '<ul class="explore-trend-list">' + trendItems.join('') + '</ul>' +
        '<p class="fine-print">These are simple one-at-a-time trend checks within the demonstrated data range. ' +
        'They indicate whether the model behaves sensibly, but they do not prove the model obeys the underlying physics.</p>'
    });

    var negatives = res.predicted.filter(function (v) { return v < 0; }).length;
    cards.push({
      title: 'Are the predictions physically plausible?',
      level: negatives === 0 ? null : 'high',
      html: '<p>Pressure drop cannot be negative. ' +
        (negatives === 0
          ? 'None of the ' + res.counts.test + ' test predictions are negative, which is physically sensible.'
          : '<strong>' + negatives + '</strong> of the ' + res.counts.test + ' test predictions are negative, which is not physically possible and is a warning sign.') +
        '</p>'
    });

    cards.push({
      title: 'What does the error mean in practice?',
      html: '<p>A typical prediction is off by about <strong>' + fmtU(res.testMetrics.rmse) + '</strong>. ' +
        'Whether that is acceptable depends entirely on the engineering use: it may be fine for a rough sizing ' +
        'estimate but far too large for a precise calculation.</p>'
    });

    cards.push({
      title: 'Is the model used inside its demonstrated range?',
      level: 'medium',
      html: '<p>Every prediction here is made within the range of the synthetic training data (500 rows, all in ' +
        'turbulent flow). Using the model outside that range — different fluids, geometries, laminar flow, or fittings ' +
        'and bends — is extrapolation and can be unreliable. Machine learning does not replace engineering judgement or ' +
        'the underlying physics; treat these results as a demonstration only.</p>'
    });

    host.innerHTML = '<h3 class="explore-engineering-title">Engineering interpretation</h3>' +
      cards.map(function (c) {
        var cls = 'explore-insight' + (c.level ? ' level-' + c.level : '');
        return '<div class="' + cls + '"><h3>' + c.title + '</h3>' + (c.html || ('<p>' + c.body + '</p>')) + '</div>';
      }).join('');
  }

  // --- Stage navigation ----------------------------------------------------------
  function goToStage(n) {
    n = Math.max(1, Math.min(4, n));
    state.stage = n;
    for (var i = 1; i <= 4; i++) {
      var sec = el('explore-stage-' + i);
      if (sec) sec.classList.toggle('is-hidden', i !== n);
    }
    var steps = el('exploreSteps');
    if (steps) {
      steps.querySelectorAll('li').forEach(function (li) {
        var stage = Number(li.getAttribute('data-stage'));
        li.classList.toggle('is-current', stage === n);
        li.classList.toggle('is-done', stage < n);
      });
    }
    var heading = el('exploreStage' + n + 'Heading');
    if (heading && typeof heading.focus === 'function') {
      heading.setAttribute('tabindex', '-1');
      try { heading.focus({ preventScroll: false }); } catch (_) { heading.focus(); }
    }
    if (n === 3) { loadDataset(state.exampleKey).catch(function () {}); }
  }

  function resetResults() {
    state.results = {};
    var wrap = el('exploreComparisonWrap'); if (wrap) wrap.classList.add('is-hidden');
    var focus = el('exploreFocusWrap'); if (focus) focus.classList.add('is-hidden');
    var card = el('explorePlotCard'); if (card) card.classList.add('is-hidden');
    var next = el('exploreToStage4'); if (next) next.disabled = true;
    var interp = el('exploreInterpretation'); if (interp) interp.innerHTML = '';
    var eng = el('exploreEngineering'); if (eng) eng.innerHTML = '';
  }

  function restart() {
    resetResults();
    state.exampleKey = EXAMPLES[0].key;
    state.dataset = null;
    state.approach = 'simple';
    var simple = document.querySelector('input[name="exploreApproach"][value="simple"]');
    if (simple) simple.checked = true;
    updateApproachControls();
    renderProblem();
    goToStage(1);
    selectExample(state.exampleKey);
  }

  // --- Wiring --------------------------------------------------------------------
  function wire() {
    if (state.wired) return;
    if (!el('view-explore')) return;
    state.wired = true;

    renderProblem();

    var toStage2 = el('exploreToStage2'); if (toStage2) toStage2.addEventListener('click', function () { goToStage(2); });
    var toStage3 = el('exploreToStage3'); if (toStage3) toStage3.addEventListener('click', function () { updateApproachControls(); goToStage(3); });
    var toStage4 = el('exploreToStage4'); if (toStage4) toStage4.addEventListener('click', function () { goToStage(4); });
    var back1 = el('exploreBackTo1'); if (back1) back1.addEventListener('click', function () { goToStage(1); });
    var back2 = el('exploreBackTo2'); if (back2) back2.addEventListener('click', function () { goToStage(2); });
    var back3 = el('exploreBackTo3'); if (back3) back3.addEventListener('click', function () { goToStage(3); });

    document.querySelectorAll('input[name="exploreApproach"]').forEach(function (input) {
      input.addEventListener('change', updateApproachControls);
    });

    var focus = el('exploreFocusModel');
    if (focus) focus.addEventListener('change', function () {
      state.focusModel = focus.value;
      renderComparison();
      renderPlot(state.focusModel);
      renderInterpretation(state.focusModel);
      renderEngineering(state.focusModel);
    });

    var trainBtn = el('exploreTrainBtn'); if (trainBtn) trainBtn.addEventListener('click', function () { train(); });
    var restartBtn = el('exploreRestart'); if (restartBtn) restartBtn.addEventListener('click', restart);

    updateApproachControls();
    goToStage(1);
    // Preload the default example so the first train is instant (best-effort).
    selectExample(state.exampleKey);
  }

  // Initialise once the DOM is ready; (re)ensure wiring when Explore is first shown.
  function init() {
    wire();
    document.addEventListener('ems:modechange', function (event) {
      if (event.detail && event.detail.mode === 'explore') wire();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.EMSExplore = Object.freeze({
    state: state,
    train: function () { return train(); },
    goToStage: goToStage,
    loadDataset: loadDataset,
    selectExample: selectExample
  });
})(window);
