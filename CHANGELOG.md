# Changelog

Engineering ML Studio uses calendar versioning, `YYYY.MM.PATCH`: a release is named for the month it ships,
and fixes within the same month increase the last number. Saved-file schema versions are independent of the
release version, so files from earlier releases keep opening. Release process: `docs/DEVELOPMENT.md` → "Releasing".

## 2026.11.0 — first Engineering ML Studio release

The first release under the project's own version. Earlier builds reported the inherited Local Regression
Studio engine version, 1.0.11, which is kept as the engine version.

### Learning (Explore and Learn)
- Explore: a guided four-stage workflow over six lessons — pipe pressure drop, steel yield strength, convective
  cooling, orifice flow, a generic nonlinear signal, and **critical heat flux, the first real measured dataset**
  (U.S. NRC CHF database; CC0-1.0). A progress rail that stays in view; per-example diagrams; shareable links
  (`#explore/steel`); a learning path with a next lesson; an optional "predict before you train" prompt.
- Explanations where results first appear (R², RMSE, MAE, training versus test error), from one shared source; a
  deliberate overfitting demonstration (one decision tree at depths 1–15).
- Learn: two Python notebooks (pipe; steel), "Preparing your own data" with a CSV template, and "Beyond this tool".

### Applying it to your own data (Project)
- Six stages with in-context guidance: click any setting for what it means and what to enter; numbered steps;
  plain-language model cards grouped by family; a data-based starting suggestion; "Which model when?".
- **Polynomial response surface**, a twelfth model: an explainable curved equation with exact prediction intervals.
- **File check after upload**: decimal commas (previously read silently as thousands separators, so "4,9" became
  49), units in values, text in numeric columns, missing-value codes, missing header rows, dates, and model limits.
- Evaluate results grouped in seven sections, results first; a methods and reproducibility summary to copy into a
  report or paper; small-dataset advice; approval and governance tools shown only for operational use.
- A glossary reachable from every mode; Help opens the user guide at the current stage.

### Datasets
- Synthetic, documented, reproducible generators for steel yield strength (Hall–Petch), convective cooling and
  orifice flow, alongside pipe pressure drop; critical heat flux sample, full set and out-of-domain sources.

### Platform and documentation
- The user guide rewritten for the current layout, with a version line and a "Back to Home" button on every page.
- One version, defined in `js/build-config.js`; every first-party script and stylesheet is versioned so browsers
  do not run stale code after an update.
- D3a worker-training proposal, re-measured end to end (`docs/WORKER_TRAINING_PROPOSAL.md`).
- Notice when a non-English language is selected: the guided pages are English-only for now (WORKPLAN D6).

### Known limitations
- Training runs on the browser's main thread: on about 10,000 rows, k-nearest neighbours and the neural network
  can take about a minute with the page unresponsive (WORKPLAN D3b).
- Translation of the guided pages, an accessibility audit and cross-browser testing are planned (WORKPLAN D6, D1, D4).
