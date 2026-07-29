# Project Status — Engineering ML Studio

Concise, factual snapshot during **Phase 1** (first prototype increment). For detail see
[`ARCHITECTURE_AUDIT.md`](ARCHITECTURE_AUDIT.md), [`ROADMAP.md`](../ROADMAP.md),
[`EXPLORE_MODE.md`](EXPLORE_MODE.md), and [`UX_REDESIGN_PLAN.md`](UX_REDESIGN_PLAN.md).

## Phase 1 prototype (this stage)

- **New landing page** with a global top navigation (Home · Explore · Project · About) and two
  primary routes: *Explore with an example* and *Build a project*. A third route, *Learn with
  Python*, is shown as **Coming later**.
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
- **Limited notebook integration:** no current path from the UI to Python/Jupyter.
- **Tightly coupled architecture (confirmed):** `js/app.js` (~2238 lines) mixes UI and control flow
  and depends on many global modules loaded in a fixed manual order.
- **No beginner learning pathway** yet.

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
  mode, additional built-in engineering datasets, and real Jupyter/Python integration (currently
  *Coming later*).
- Refactoring `js/app.js` or the Project-mode layout (deliberately avoided; Explore reuses the shared
  `MLCore`/`LRSPlatform` functions instead of the DOM-coupled `trainAndEvaluate`).
- Test coverage for the predict and monitor stages and the full validation/approval/export flow
  (the current baseline covers load → train → metrics; see
  [`BASELINE_BEHAVIOUR.md`](BASELINE_BEHAVIOUR.md)).
