# Project Status — Engineering ML Studio

Concise, factual snapshot during **Phase 3, increment 2** (Project-mode professional application
shell), building on increment 1's six-stage presentation shell and the delivered Phase 1 Explore mode
and Phase 2 "Learn the Code" pathway. For detail see
[`ARCHITECTURE_AUDIT.md`](ARCHITECTURE_AUDIT.md), [`ROADMAP.md`](../ROADMAP.md),
[`EXPLORE_MODE.md`](EXPLORE_MODE.md), [`PHASE2_LEARN_THE_CODE_PLAN.md`](PHASE2_LEARN_THE_CODE_PLAN.md),
[`PHASE3_PROJECT_MODE_UX_PLAN.md`](PHASE3_PROJECT_MODE_UX_PLAN.md),
[`PROJECT_MODE_STAGE_MAPPING.md`](PROJECT_MODE_STAGE_MAPPING.md), and
[`UX_REDESIGN_PLAN.md`](UX_REDESIGN_PLAN.md).

## Phase 3 prototype — Project-mode professional application shell (this stage)

Increment 2 re-presents Project mode as a compact engineering **application**, correcting the earlier
render that still read as an unstyled report outline. It builds on increment 1's six-stage mapping and
remains **presentation, layout and navigation only**.

- **Application shell.** Project mode now has a sticky **application top bar** (product name, a
  *Project* mode chip, a live project-status readout, and utility actions — Home, Save project, Open
  project, Privacy, Help — plus the language selector, runtime pill and a *Local processing*
  disclosure), a **compact left workflow navigator** (~220 px), a **dominant workspace**, and an
  **application footer** (System, Help documentation, Contact, the governance scope boundaries and the
  legacy-engine credit).
- **One stage at a time.** The workspace shows exactly one panel; `#view-project .panel:not(.is-active-panel)`
  is `display:none` and `js/project-shell.js` (`showStage`) reveals a single panel, so the workspace
  reads as an application screen rather than one long document. Charts drawn while a panel is hidden are
  resized on reveal (`Plotly.Plots.resize`).
- **Six user-facing stages over the unchanged eight internal panels.** The rail presents
  **1. Load data · 2. Inputs and target · 3. Prepare data · 4. Choose and train · 5. Evaluate results ·
  6. Predict and monitor**. Stage 4 groups *Choose models* (`step-model`) and *Configure validation and
  train* (`step-split`); stage 6 groups *Predict and export* (`step-predict`) and *Monitor and
  revalidate* (`step-monitor`). Substages use **plain labels** (the `4A/4B/6A/6B` tags are removed) and
  are shown **only while their parent stage is current**. The eight DOM panels, their IDs and order are
  unchanged — see [`PROJECT_MODE_STAGE_MAPPING.md`](PROJECT_MODE_STAGE_MAPPING.md).
- **Privacy / local-processing relocated out of the workflow rail.** The rail now holds only the six
  stages; privacy and the *Local processing* note live in the top bar, and System / Help / Contact /
  scope / attribution live in the footer.
- **Thin presentation and navigation layer only.** No calculation, model adapter, default, split
  behaviour, preprocessing behaviour, governance rule, export format, saved-project format, monitor
  state or training operation order was changed. `js/app.js` is **unedited**. The training pipeline
  (`trainAndEvaluate`), the layered model dispatch load order, the eleven model IDs (default `linear`),
  and the artifact/approval/export contract are all as inherited. All gating is **read** from the
  classes app.js already sets; the shell never unlocks a panel.
- **Engineering language, guidance and progressive disclosure.** User-facing labels use engineering
  terms (input variable, quantity to predict, model, model setting, valid input range) with the formal
  ML term kept in secondary help. Each stage's *What / Why / Look for* guidance is now a collapsed
  `<details class="stage-guidance">` disclosure below the stage title, so it no longer dominates the
  workspace. Models are grouped into **Recommended starting models** (Linear, Random Forest, Gradient
  Boosting) and a collapsed **Other modelling approaches** disclosure (the neural network marked
  *Advanced*). Tuning and model-specific settings sit under a collapsed **Advanced model settings**
  disclosure; validation, approval, operational release and reporting sit under an **Advanced
  validation and governance** disclosure. A *Recommended starting point* note is shown in Prepare data
  **without changing any preprocessing default**.
- **Back / Continue and rail navigation.** Rail clicks switch the shown panel via `goToPanel`, which
  refuses locked or mode-hidden targets — no unsafe stage jumping and no new application state.
  Additive *Continue to …* buttons (`.stage-continue`) and an injected *Back* button on every stage
  after the first walk the fixed panel order, skipping locked/mode-hidden panels. app.js's own
  `scrollIntoView` transitions are mirrored by wrapping each panel's `scrollIntoView` — no app.js edit.
  The panel-lock logic (`unlockPanel`/`unlockWorkflow`) remains the single source of truth for
  availability.
- **Responsive, accessible navigator.** The rail is a single semantic structure
  (`<nav class="stage-rail">` → `<ul class="stage-list">`) styled from scratch — not the inherited
  `.step-list`. On desktop it is a compact 220 px left column with two-column stage rows whose labels
  wrap sensibly; at ≤ 900 px the grid collapses and the navigator stacks above the workspace. Lists are
  unordered (no stray `1.`/`2.` markers) and rows are not underlined links; the **shown** stage carries
  `aria-current="step"` (current = shown; no scroll-spy), locked stages expose `aria-disabled`, and
  rows stay keyboard-focusable with a visible focus ring. Verified free of horizontal overflow at
  1440 / 1280 / 1024 / 768 / 390 px.
- **Four-state workflow navigation model.** Each rail row renders in exactly one of **Active /
  Completed / Available / Locked**, on the row itself (`.stage-row.is-active` / `.is-complete` /
  `.is-available` / `.is-locked`), derived only from the shown panel and the inherited lock cascade.
  Completion is tied to real lock milestones (dataset loaded, features chosen, model trained), never to
  *unlocked* / *visible* / *last-stage* / *visited*; a stage is *complete* only when its artifact exists
  **and** the cursor is strictly later, and Stage 6 is terminal (never auto-completed). This corrected a
  defect where a fresh project showed **Stage 6 with a dark active-looking marker**: the old two-state
  rule counted Stage 6 as "available" because `step-monitor` is always present (no `.locked` class; it
  is gated by the `governance-only` mode), and the old `.is-available` marker reused the primary-dark
  fill. Availability is now derived from a stage's **entry panel** (`step-predict` for Stage 6), which
  stays locked until a model is fitted. States are distinguished by more than colour (ring + bold for
  active, a `✓` glyph for complete, reduced opacity + `not-allowed` for locked). A `checkConsistency()`
  guard (on `window.EMSProjectShell`, run each `syncAll`) asserts the top-bar status agrees with the
  rail — exactly one `aria-current`, no completed stages without a dataset, Stage 6 never active/complete
  without one. See [`PROJECT_MODE_STAGE_MAPPING.md`](PROJECT_MODE_STAGE_MAPPING.md).
- **Cache-busting.** Both stylesheet links carry `?v=1.0.12` so stylesheet edits are never masked by a
  stale browser cache (the root cause of the earlier "edits don't show" render).
- **Global-header refinement (presentation-only, done).** The application top bar previously repeated the
  full product name (`h1` "Engineering ML Studio"), which also appears in the global brand — so the name
  showed twice in Project mode. The `h1` is now the compact, Project-specific title **"Engineering project
  workspace"** (the mode chip still reads *Project*), so the full product name is shown once, in the
  global brand. This is a text-only change to the Project top bar; the global `.top-nav`, the router and
  accessibility are untouched.
- **Known deferrals (recorded, not implemented).** No dedicated neural-network random seed is added
  (the ANN still shares the global split seed). Non-English translations fall back to English for the
  renamed labels until the `js/i18n.js` dictionary is extended. **Full navigation consolidation:** the
  global `.top-nav` (Home · Explore · Project · Learn · About, rendered above every view) and the
  Project application top bar both still present a *Home* affordance, so Project mode shows two navigation
  headers at once. Removing that second header is not trivially isolated (the global nav is shared by all
  views), so it remains **deferred**; a later refinement should hide or visually integrate the global
  `.top-nav` within Project mode so the application top bar is the single header — without disturbing the
  other views.
- **New/changed files (increment 2):** `js/project-shell.js` (rewritten as the single-stage
  controller), `css/app.css` (application-shell styles: top bar, footer, compact rail, single-stage,
  guidance disclosure), `index.html` (top bar, cleaned rail, footer, guidance `<details>`,
  cache-busting), `tests/project.spec.js` (application-shell, single-stage, navigation,
  responsive/accessibility tests, a dedicated **workflow navigation state** block asserting the four
  states from computed styles, plus regression guards), `tests/smoke.spec.js` (single-stage
  `goToStage` navigation helper), `docs/PROJECT_MODE_STAGE_MAPPING.md` and the Phase 3 documentation.
  `js/app.js` is unchanged. The full Playwright suite (project + smoke + explore + unit) is green —
  **117 passed** — and the stdlib Python notebook/dataset unit tests pass.

## Phase 2 prototype (delivered)

- **First "Learn the Code" pathway.** A single, high-quality guided Jupyter notebook,
  `notebooks/pipe_pressure_drop.ipynb`, reproduces the Explore pressure-drop activity in Python: the
  same dataset, the same five inputs and target, the same fixed seed (42), and the same three models
  (Linear Regression, Decision Tree, Random Forest) using `pandas`, `scikit-learn` and `matplotlib`.
  It is committed output-free and runs end-to-end offline from the committed CSV.
- **New in-app Learn page** (`#view-learn`, added to the router; nav is now Home · Explore · Project ·
  Learn · About). It explains the notebook, links to **Google Colab** and a **local Jupyter** run
  (text links, not an external badge image, to respect the CSP), states honestly that the numbers
  differ slightly from the browser, and repeats the synthetic-data caution.
- **"Continue in Python" call to action** at the end of the Explore workflow (Stage 4) linking to the
  Learn page; the landing "Learn with Python" card is now active.
- **Neural network added as an advanced flexible model (not the beginner default).** Explore gains a
  fourth approach ("try an advanced flexible model") and a four-way *Compare* (Linear, Decision Tree,
  Random Forest, Neural Network); the model names stay secondary and the simple trend remains the
  default. It **reuses the inherited browser network** (`js/advanced-core.js`) through the existing
  model adapter — **no new algorithm and no new runtime dependency** — with safe presets only (size
  Small `(16,)` default / Medium `(32, 16)`; training length Quick/Standard/Longer; learning rate
  under a collapsed "Advanced setting"), automatic input/target scaling with results in kPa, honest
  training feedback (convergence/early stopping, a collapsed loss-curve diagnostic), a deterministic
  Stage 4 interpretation, and an optional advanced Section 16 in the notebook (`scikit-learn`
  `MLPRegressor`). Framed honestly throughout: a more complex model is not automatically more
  accurate; on small tabular data tree methods are often as good or better (the browser and notebook
  deliberately disagree on whether the network wins). See
  [`NEURAL_NETWORK_DEMO.md`](NEURAL_NETWORK_DEMO.md).
- **`scikit-learn` is a notebook-only dependency.** It is *not* used by the browser runtime, which
  keeps its own in-browser model code. Because the two implementations differ, the exact figures are
  not identical by design — the teaching narrative (linear under-fits, a deep tree overfits, the
  forest is strongest) is what is preserved. One deliberate, documented divergence: the notebook's
  Random Forest uses scikit-learn defaults rather than Explore's `max_features='sqrt'`, because the
  latter would break the pedagogical ordering.
- **Architectural boundaries preserved.** No browser-to-notebook state transfer, no dynamic code
  generation, no Python-in-browser, no accounts or cloud, no Project-mode redesign, no second
  notebook, no new datasets, no new ML algorithm, no new runtime dependency, and no licence/attribution
  change. New/changed files: `notebooks/pipe_pressure_drop.ipynb`, `notebooks/README.md`,
  `notebooks/requirements.txt`, `tests/test_notebook_structure.py`, `tests/test_notebook_execution.py`,
  `.github/workflows/test.yml` (new `notebooks` job), `js/modes.js`, `index.html` (nav, landing card,
  Explore CTA, `#view-learn`), `css/explore.css`, and Phase 2 docs. The neural-network addition
  further touched `js/explore.js`, `index.html` (Explore Stage 2/3), `css/app.css`,
  `tests/explore.spec.js`, `tests/unit.spec.js`, `docs/NEURAL_NETWORK_DEMO.md`, and the notebook.
  Project-mode ML code, `js/advanced-core.js`, and `js/ml-core.js` are unchanged. All prior tests
  remain green alongside the new notebook, browser, and unit tests.

## Phase 1 prototype (delivered)

- **New landing page** with a global top navigation (Home · Explore · Project · About) and two
  primary routes: *Explore with an example* and *Build a project*. (A third route, *Learn with
  Python*, was shown as *Coming later* in Phase 1 and is now active — see the Phase 2 section above.)
- **New Explore mode (problem-led, engineering-focused):** one guided, four-stage workflow —
  *understand the pressure-drop problem → choose an approach → train and compare predictions →
  interpret the engineering meaning* — built around a concrete mechanical/thermal engineering example
  (predicting **pressure drop in a pipe**), not around model names. The approach choice is framed in
  plain engineering language (simple trend / more flexible relationship / compare) with algorithm
  names shown only as secondary detail; results and the **rule-based** interpretation are given in
  physical units (kPa) with an engineering-trend and extrapolation check. See
  [`EXPLORE_MODE.md`](EXPLORE_MODE.md).
- **New synthetic engineering dataset (a demonstration, not a design tool):**
  `examples/pipe_pressure_drop_sample.csv`, generated deterministically from the **Darcy–Weisbach**
  equation by the documented, committed script `scripts/generate_pipe_pressure_drop.py`. Clearly
  labelled synthetic; SI units embedded in the column names. See
  [`../examples/README.md`](../examples/README.md).
- **Project mode preserved unchanged:** the inherited eight-stage workflow now lives inside a
  `#view-project` container, reachable from the landing page; its layout, logic, and ML algorithms
  are untouched.
- **No new ML algorithms, licences, or deployment changes; no inherited datasets deleted.** The
  house-price example was removed only from the beginner Explore path (its CSV is retained for Project
  mode); the generic nonlinear example is kept as a clearly-labelled secondary maths demonstration.
  New/changed files: `js/explore.js`, `index.html` (Explore section), `css/explore.css`,
  `scripts/generate_pipe_pressure_drop.py`, `examples/pipe_pressure_drop_sample.csv`,
  `tests/explore.spec.js`, `tests/test_pipe_dataset.py`, and Phase 1 docs. All inherited baseline
  tests remain green, alongside the rewritten Explore Playwright suite and the new Python generator
  tests.

## Current working capability

- **Browser-based regression workflow** inherited from Local Regression Studio, running as a static
  web application with no backend.
- **Local / browser-side processing:** all data preparation, training, and prediction run in the
  browser; no data upload, accounts, or telemetry.
- **Model-development stages:** an eight-step flow — load data → select features & transform target
  → configure preprocessing → select model & tune → split & train → review/validate/approve/export →
  predict → monitor.
- **Diagnostics, prediction, governance:** metrics and diagnostic charts (via bundled Plotly),
  prediction on new data, prediction intervals, model comparison, validation, an approval/
  approved-package workflow, and post-deployment monitoring/revalidation records.
- **Deployment:** GitHub Pages via branch serving (`CNAME`, `.nojekyll`).
- **Reproducible baseline:** documented local-run procedure and an automated test foundation
  (Playwright smoke + ML-core unit tests) with a CI workflow; see
  [`DEVELOPMENT.md`](DEVELOPMENT.md), [`BASELINE_BEHAVIOUR.md`](BASELINE_BEHAVIOUR.md), and
  [`BASELINE_TEST_REPORT.md`](BASELINE_TEST_REPORT.md).

## Current limitations

- **Difficult beginner interface:** a single dense page exposing all steps and options at once.
- **Specialist terminology** throughout, aimed at ML-literate users rather than engineers.
- **Long workflow** with no guided or minimal entry path.
- **Early notebook integration:** one guided notebook (pressure drop) reachable from the UI via a
  Learn page and an Explore call to action; broader UI↔code coverage is still to come.
- **Tightly coupled architecture (confirmed):** `js/app.js` (~2238 lines) mixes UI and control flow
  and depends on many global modules loaded in a fixed manual order.
- **Single learning pathway:** only the pressure-drop notebook exists so far; other topics and a
  fuller step-by-step "Learn the Code" experience are not yet built.

## Phase 0 completion criteria

- [x] Independent local repository created (`engineering-ml-studio`).
- [x] Full Git history preserved (source remote retained as `upstream-yu`).
- [x] Attribution and licence retained; `LICENSES.txt` unchanged; Yu Duan credited.
- [x] Governance and roadmap documented.
- [x] Product vision documented.
- [x] Architecture and UX audits documented.
- [x] Dataset provenance status documented.
- [x] Current project leadership (Wei Wang at STFC) stated without overstating ownership.
- [x] No functional application behaviour changed.

## Resolved since Phase 0

- **Reproducible baseline build/run and automated test foundation** — done (this stage).
- **Copyright in new contributions** — resolved: new Engineering ML Studio contributions under this
  STFC project are copyright **UKRI**, without altering the original work's copyright or attribution
  (see [`../NOTICE.md`](../NOTICE.md)).
- **Dataset reuse status** — confirmed reusable under the **MIT licence** by Yu Duan (see
  [`../examples/README.md`](../examples/README.md)).
- **Distribution/offline strategy** — decided: browser-based static web app is the primary supported
  mode; packaged `editions/` and OS launchers are not being recreated (see
  [`../ROADMAP.md`](../ROADMAP.md)).

## Not yet done (deferred, needs approval)

- Remaining Phase 1 items: configurable Project mode, wider engineering-language pass across Project
  mode, and additional built-in engineering datasets.
- Remaining Phase 2 items: further "Learn the Code" notebooks beyond pressure drop, and deeper links
  between individual UI actions and their equivalent Python.
- Refactoring `js/app.js` or the Project-mode layout (deliberately avoided; Explore reuses the shared
  `MLCore`/`LRSPlatform` functions instead of the DOM-coupled `trainAndEvaluate`).
- Test coverage for the predict and monitor stages and the full validation/approval/export flow
  (the current baseline covers load → train → metrics; see
  [`BASELINE_BEHAVIOUR.md`](BASELINE_BEHAVIOUR.md)).
