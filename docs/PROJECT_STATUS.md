# Project Status — Engineering ML Studio

Concise, factual snapshot during **Phase 2** (first "Learn the Code" prototype increment), building
on the delivered Phase 1 Explore mode. For detail see
[`ARCHITECTURE_AUDIT.md`](ARCHITECTURE_AUDIT.md), [`ROADMAP.md`](../ROADMAP.md),
[`EXPLORE_MODE.md`](EXPLORE_MODE.md), [`PHASE2_LEARN_THE_CODE_PLAN.md`](PHASE2_LEARN_THE_CODE_PLAN.md),
and [`UX_REDESIGN_PLAN.md`](UX_REDESIGN_PLAN.md).

## Phase 2 prototype (this stage)

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
