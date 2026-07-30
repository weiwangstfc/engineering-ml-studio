# Roadmap

> **Provisional and subject to change.** This roadmap describes intended direction, not commitments.
> It separates the current foundation work from proposed future work.

## Guiding principle

The initial priority is **usability, guidance, and workflow for engineers** — not adding many new
algorithms. **Explicitly, adding many new algorithms is _not_ an initial priority.** The regression
model families inherited from Local Regression Studio are considered sufficient for the first
releases; effort goes into making them approachable and well-explained.

---

## Phase 0 — Independent project foundation (current)

- Establish the independent local repository with full preserved history.
- Add project-foundation documentation (this roadmap, README, NOTICE, GOVERNANCE, CONTRIBUTING,
  product vision, architecture audit, UX redesign plan).
- Confirm licence and attribution obligations.
- **No functional code, dependency, deployment, test, dataset, or licence changes.**

## Phase 1 — User-friendly regression prototype (in progress)

Make the existing regression capability genuinely approachable. Priorities:

- New **landing page**. — *first prototype delivered.*
- Beginner **Explore mode**. — *delivered as a **problem-led, engineering-focused** four-stage flow
  built around predicting pressure drop in a pipe (understand the problem → choose an approach → train
  and compare → interpret the engineering meaning); see [`docs/EXPLORE_MODE.md`](docs/EXPLORE_MODE.md).*
- Configurable **Project mode**. — *preserved unchanged and reachable from the landing page;
  configurability not yet started.*
- **Progressive disclosure** of advanced options. — *begun on the landing page ("Open saved work ·
  more options") and in Explore (only 1–2 beginner controls exposed).*
- Built-in **engineering datasets**. — *first synthetic, documented, physically-informed engineering
  dataset added (pipe pressure drop, from the Darcy–Weisbach equation) as the Explore-mode primary
  example; a training demonstration, not a design tool. More engineering datasets still to come.*
- **Simpler engineering language** throughout the interface. — *applied within the new landing/Explore
  views, now framed around an engineering problem rather than model names; Project-mode wording
  unchanged.*
- **Improved navigation**. — *global top nav (Home · Explore · Project · About) added.*
- **Clearer diagnostics**. — *plain-language, rule-based result explanations added in Explore.*
- **Responsive interface**. — *new views reflow to narrow/mobile widths.*
- **Connection to Jupyter notebooks**. — *first pathway delivered in Phase 2 (see below): a guided
  notebook reproducing the Explore pressure-drop workflow, reachable from a new in-app **Learn** page
  and a "Continue in Python" call to action in Explore.*

> The first Phase 1 increment (landing page + one guided Explore workflow) is a **prototype**. The
> remaining Phase 1 items above are still to come.

## Phase 2 — Guided learning pathway (in progress)

- Step-by-step guidance that teaches regression concepts in engineering terms.
- "Learn the Code" pathway that reveals the equivalent Python for actions taken in the UI. — *first
  pathway delivered as a **prototype**: a single high-quality Jupyter notebook
  (`notebooks/pipe_pressure_drop.ipynb`) reproducing the Explore pressure-drop activity in Python
  (`pandas` + `scikit-learn`), with a matching in-app **Learn** page and an Explore "Continue in
  Python" link. The connection is one-way and static — no browser-to-notebook state transfer, no
  Python in the browser, no accounts or cloud. Numbers differ slightly from the browser (different
  model implementations); the teaching narrative is preserved. See
  [`docs/PHASE2_LEARN_THE_CODE_PLAN.md`](docs/PHASE2_LEARN_THE_CODE_PLAN.md) and
  [`notebooks/README.md`](notebooks/README.md). Further notebooks and deeper UI↔code links still to come.*
- **Neural network as an advanced flexible model (not the beginner default).** — *delivered as part of
  Phase 2: Explore gains a fourth "try an advanced flexible model" approach and a four-way compare, the
  notebook gains an optional advanced section, and the honest framing (more complex ≠ more accurate;
  tree methods are often as good on small tabular data) is carried throughout. It reuses the
  **inherited** browser network with safe presets — no new algorithm and no new runtime dependency. See
  [`docs/NEURAL_NETWORK_DEMO.md`](docs/NEURAL_NETWORK_DEMO.md).*
- In-context explanations of diagnostics and validation.

## Phase 3 — Small engineering project capability (in progress)

- **Six-stage Project-mode presentation shell.** — *first increment delivered as a **prototype**:
  Project mode now presents six user-facing stages (Load data · Choose inputs and quantity to predict ·
  Prepare data · Choose and train models · Evaluate results · Predict, export and monitor) over the
  unchanged eight internal panels, with engineering language, per-stage guidance, model grouping
  (Recommended vs Other), and progressive disclosure for advanced modelling and governance controls.
  A **thin presentation and navigation layer only** — no calculation, adapter, default, pipeline order,
  governance rule or export format changed. See
  [`docs/PHASE3_PROJECT_MODE_UX_PLAN.md`](docs/PHASE3_PROJECT_MODE_UX_PLAN.md) and
  [`docs/PROJECT_MODE_STAGE_MAPPING.md`](docs/PROJECT_MODE_STAGE_MAPPING.md).*
- Robust support for realistic small engineering projects end-to-end.
- Reusable project templates and built-in engineering datasets expanded.
- Stronger validation, monitoring, and governance flows for real (non-critical) use.
- **Expose the neural network's full configuration in Project mode through clearly-labelled
  _Advanced_ settings** (layers, neurons, activation, learning rate, max iterations, regularisation,
  early stopping, seed). — *increment 1 surfaces the existing ANN controls under the **Advanced model
  settings** disclosure and marks the network as an advanced option; a dedicated ANN random seed is
  still deferred (the network shares the global split seed). Not a new algorithm.*

## Phase 4 — Additional Engineering ML modules

- Broaden beyond regression only where there is clear engineering demand (e.g. classification,
  time-series, or design-of-experiments modules) — **after** the guided regression experience is solid.
- New algorithms are added deliberately, not as a headline goal.

## Distribution and offline strategy (decided)

- **Primary supported mode:** a **browser-based web application**.
- **Primary deployment:** a **static website** (currently GitHub Pages via branch serving).
- **Local development:** a simple, documented local HTTP server (see
  [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)). No packaged editions or platform launchers.
- The application already runs fully in the browser with no backend, and can run offline with
  bundled libraries (`?localOnly=1`).

### Not adopted

- **Packaged `editions/` and OS launcher scripts.** The original Local Regression Studio
  documentation described strict-offline and prediction-only *editions* and per-OS launcher scripts
  for a packaged offline distribution. **These are inherited/historical, are not part of this
  repository, and are not being recreated.**

### Possible future extension (not part of the baseline)

- An optional **installable/offline download** (e.g. a Progressive Web App or a downloadable static
  bundle) *may* be considered later. It is **not** part of the current baseline and would be a
  deliberate future decision, not a present feature.
