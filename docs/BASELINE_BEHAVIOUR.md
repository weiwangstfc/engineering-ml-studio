# Baseline behaviour — Engineering ML Studio

This document records the **observable behaviour of the current (inherited) application** so that
future UX and code changes can be checked against a known-good baseline. It describes behaviour as
it is **today**, before any redesign.

Each item is tagged:

- **[Confirmed]** — directly observed and/or asserted by an automated test in `tests/`.
- **[Inferred]** — read from the source but not exercised by a test.
- **[Untested]** — believed to work but neither exercised by a test nor verified here.

The automated tests that back the **[Confirmed]** items live in `tests/smoke.spec.js` and
`tests/unit.spec.js`. See [`DEVELOPMENT.md`](DEVELOPMENT.md) for how to run them.

> **Phase 1 entry-path change.** As of the Phase 1 prototype, the application opens on a new
> **landing page**, and the inherited eight-stage workflow is now reached by choosing **Project
> mode** (top nav → Project, or the landing-page route). The workflow's behaviour below is
> **unchanged**; only the entry path is new. The smoke tests reflect this with a single
> `enterProjectMode()` step and continue to assert every original behaviour. The new landing page and
> Explore mode have their own behaviour documented in [`EXPLORE_MODE.md`](EXPLORE_MODE.md) and tested
> in `tests/explore.spec.js`.

## Application shell and startup

- **[Confirmed]** Loading `/?localOnly=1` over HTTP produces no fatal JavaScript errors; the app
  finishes bootstrapping (signalled by `window.LocalRegressionApp` being defined).
- **[Confirmed]** After entering **Project mode**, the principal container (`main.app-shell`) and the
  Project page heading (`#view-project h1`) are visible. The Project heading text is
  **"Local Regression Studio"** — this is inherited and is intentionally unchanged at this stage.
  (The new landing page carries its own heading, **"Engineering ML Studio"**.)
- **[Confirmed]** With `?localOnly=1`, only bundled libraries under `vendor/` are used; no external
  (non-local) network requests are made during the load-and-train workflow.
- **[Inferred]** Without `?localOnly=1` the app runs in "hybrid mode" and may load a pinned CDN
  copy of Papa Parse; the runtime mode indicator (`#runtimeMode`) reflects offline vs hybrid.

## Eight-stage workflow

The interface is a single long page exposing eight sequential stages. Stages downstream of data
loading start **locked** and unlock as prerequisites are met.

1. **[Confirmed]** **Load data.** A CSV chosen via the file input (`#csvFile`) is parsed in the
   browser. On success the dataset summary (`#datasetSummary`) reports rows/columns and the target
   dropdown (`#targetColumn`) is populated with the numeric columns. The features stage
   (`#step-features`) unlocks.
2. **[Confirmed]** **Features & target.** Selecting a target column unlocks preprocessing
   (`#step-preprocess`). Auto-selecting features (`#autoFeaturesBtn`) checks a set of feature
   checkboxes and unlocks the model (`#step-model`) and split (`#step-split`) stages.
3. **[Inferred]** **Preprocessing.** Numeric scaling/missing-value strategy and categorical
   encoding/missing-value strategy are configurable; defaults produce a usable design matrix
   (unit-tested at the core level via `fitPreprocessor`/`transformRows`).
4. **[Confirmed]** **Model & tuning.** The default model is **linear** (`input[name="modelType"]`
   with `linear` checked). Training with defaults requires no model change.
5. **[Confirmed]** **Split & train.** Clicking Train (`#trainBtn`) runs an in-browser
   train/validate/test split and fits the model. The diagnostics (`#step-diagnostics`) and predict
   (`#step-predict`) stages unlock on success.
6. **[Confirmed]** **Review / validate / approve / export.** After training, the metrics table
   (`#metricsTable`) is populated with rows and includes the labels **R²**, **RMSE**, and **MAE**
   with numeric values. The model download control (`#downloadModelBtn`) becomes available.
   - **[Untested]** Validation, approval/approved-package, and export-file generation beyond the
     control being present are not exercised by the current tests.
7. **[Untested]** **Predict.** Prediction on a new (unknown) dataset via the predict stage.
8. **[Untested]** **Monitor.** Post-deployment monitoring and revalidation records.

## ML core numerical baseline (unit-tested)

These are **[Confirmed]** by `tests/unit.spec.js`, exercising the genuine `window.MLCore`:

- **Deterministic PRNG:** `mulberry32(seed)` yields an identical sequence for the same seed and a
  different sequence for a different seed; all draws lie in `[0, 1)`.
- **Metrics:** `metrics(actual, predicted)` returns `r2 = 1`, `rmse = 0`, `mae = 0` for a perfect
  prediction; a known imperfect case matches hand computation; mismatched-length inputs return the
  `NaN`/`n = 0` guardrail.
- **Numeric parsing:** `toNumber` handles plain integers, decimals, thousands separators, and
  accounting-style negatives `(5) → -5`; blank and non-numeric strings return `NaN`.
- **Summary statistics:** `mean`, `median`, and population `variance` match expected values.
- **Deterministic split:** `splitRows` produces an identical partition for a fixed seed, the
  partition is exhaustive and non-overlapping, and sizes follow the requested percentages.
- **Preprocessing:** `fitPreprocessor` + `transformRows` produce the expected row count, a
  non-degenerate feature width for mixed numeric/categorical inputs, and correctly extracted
  targets with no dropped rows on clean data.
- **Simple regression:** a linear model trained on an exactly linear relationship recovers it with
  R² > 0.99.

## Baseline regression checklist

Before merging any UX or refactoring change, confirm the following still hold (run `npm test`):

- [ ] The page loads with no fatal JavaScript errors.
- [ ] The principal container and heading are visible.
- [ ] A bundled example dataset loads and populates the target dropdown.
- [ ] Target and feature selection unlock the downstream stages in order.
- [ ] A default (linear) model trains on the house-prices example.
- [ ] The metrics table shows R², RMSE, and MAE with numeric values.
- [ ] No non-local network requests occur during load-and-train under `?localOnly=1`.
- [ ] Export/download controls are present after training and do not crash the page.
- [ ] All `MLCore` unit tests pass (deterministic PRNG, metrics, parsing, split, preprocessing,
      linear fit).

> **Scope note.** This checklist protects current behaviour; it is deliberately not exhaustive.
> Stages 7 (predict) and 8 (monitor), and the full validation/approval/export machinery, are
> **[Untested]** at this baseline and should have coverage added before they are relied upon in
> future changes.
