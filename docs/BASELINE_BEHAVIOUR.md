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
>
> **Phase 2 note.** The top navigation now also includes a **Learn** entry (Home · Explore · Project ·
> Learn · About), and a new `#view-learn` page links to the teaching notebook. This does not change
> Project-mode behaviour; the notebook is a separate, static Python artefact. See
> [`PHASE2_LEARN_THE_CODE_PLAN.md`](PHASE2_LEARN_THE_CODE_PLAN.md).
>
> Phase 2 also adds a **neural network** to **Explore** as an advanced, non-default option (and an
> optional notebook section). It reuses the **inherited** browser network (`js/advanced-core.js`)
> through the existing model adapter, so the inherited ML core and Project-mode behaviour documented
> below are **unchanged**. New Explore/NN behaviour is covered in
> [`EXPLORE_MODE.md`](EXPLORE_MODE.md) and [`NEURAL_NETWORK_DEMO.md`](NEURAL_NETWORK_DEMO.md), and
> tested in `tests/explore.spec.js` and `tests/unit.spec.js`.
>
> **Phase 3 note (increment 1).** Project mode is now **presented** as six user-facing stages over the
> same eight internal panels, with engineering language, per-stage guidance and progressive disclosure
> (`js/project-shell.js`, `tests/project.spec.js`). The six-stage sidebar is a responsive, accessible
> navigation (self-contained CSS, not the legacy `.step-list` stepper; two-column desktop layout that
> collapses to a full-width nav above the content at ≤ 900 px; `aria-current`/`aria-disabled` state).
> This is a **presentation and navigation layer only** —
> every workflow behaviour documented below (panel IDs, unlock cascade, training pipeline, model IDs and
> default, artifact/approval/export contract) is **unchanged**. The one baseline behaviour that changed
> by design is the Project heading text (see below). See
> [`PHASE3_PROJECT_MODE_UX_PLAN.md`](PHASE3_PROJECT_MODE_UX_PLAN.md) and
> [`PROJECT_MODE_STAGE_MAPPING.md`](PROJECT_MODE_STAGE_MAPPING.md).
>
> **Phase 3 note (increment 2).** Project mode is now re-presented as a compact engineering
> **application shell**: a sticky top bar (product name + *Project* chip + utility actions), a compact
> left workflow navigator, a **single-stage workspace** (exactly one panel is shown at a time;
> `#view-project .panel:not(.is-active-panel)` is `display:none`), collapsible stage guidance, and
> privacy / system / help relocated out of the workflow rail (top bar and footer). `js/project-shell.js`
> was rewritten as the single-stage controller and drives the same unlock cascade **read-only** —
> **`js/app.js` is unedited** and every workflow behaviour below is unchanged. Because a control in a
> stage that is not currently shown is `display:none`, the smoke and project suites reveal a stage via
> `window.EMSProjectShell.goToPanel(id)` before interacting with its controls; **all original
> assertions are preserved**. The Project heading is now the top-bar `h1` **"Engineering project
> workspace"** with a separate **"Project"** mode chip (see below). The rail renders each stage in one of four
> presentation states (**Active / Completed / Available / Locked**) read from the same lock cascade; a
> follow-up correction ensured a fresh project shows only Stage 1 as active and never renders an empty
> Stage 6 as active/completed. This is a **presentation-only** change — no unlock rule, panel or
> workflow behaviour below is affected. See
> [`PROJECT_MODE_STAGE_MAPPING.md`](PROJECT_MODE_STAGE_MAPPING.md).

## Application shell and startup

- **[Confirmed]** Loading `/?localOnly=1` over HTTP produces no fatal JavaScript errors; the app
  finishes bootstrapping (signalled by `window.LocalRegressionApp` being defined).
- **[Confirmed]** After entering **Project mode**, the principal container (`main.app-shell`) and the
  Project page heading (`#view-project h1`) are visible. As of **Phase 3 (increment 2)** the heading is
  the application top-bar `h1` **"Engineering project workspace"** with a separate **"Project"** mode chip.
  (The compact title replaces increment 2's "Engineering ML Studio" so the full product name is shown
  once, in the global brand; increment 1 used "Engineering ML Studio — Project mode"; the inherited text
  was "Local Regression Studio".) The inherited engine is still credited via the "Built on the Local Regression Studio
  engine." note, now in the application footer (`.app-footer-credit`). The smoke test assertion matches.
- **[Confirmed]** With `?localOnly=1`, only bundled libraries under `vendor/` are used; no external
  (non-local) network requests are made during the load-and-train workflow.
- **[Inferred]** Without `?localOnly=1` the app runs in "hybrid mode" and may load a pinned CDN
  copy of Papa Parse; the runtime mode indicator (`#runtimeMode`) reflects offline vs hybrid.

## Eight-stage workflow

The inherited interface is a single long page exposing eight sequential stages. (As of **Phase 3
increment 2** the Project-mode workspace **presents** these one stage at a time — a single panel is
shown while the rest are hidden — but the panels, their order and their unlock logic are unchanged.)
Stages downstream of data loading start **locked** and unlock as prerequisites are met.

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
