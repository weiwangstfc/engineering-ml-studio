# Project Status — Engineering ML Studio

Concise, factual snapshot at the end of **Phase 0**. For detail see
[`ARCHITECTURE_AUDIT.md`](ARCHITECTURE_AUDIT.md), [`ROADMAP.md`](../ROADMAP.md), and
[`UX_REDESIGN_PLAN.md`](UX_REDESIGN_PLAN.md).

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

- Any UX redesign or code refactoring (e.g. new landing page, beginner Explore mode).
- Test coverage for the predict and monitor stages and the full validation/approval/export flow
  (the current baseline covers load → train → metrics; see
  [`BASELINE_BEHAVIOUR.md`](BASELINE_BEHAVIOUR.md)).
