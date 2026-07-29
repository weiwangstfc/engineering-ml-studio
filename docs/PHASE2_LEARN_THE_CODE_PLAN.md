# Phase 2 plan — "Learn the Code" pathway (planning only)

> **Status: planning document only.** This describes the *first* Phase 2 increment. **No notebook,
> application code, or dependency is implemented by this document.** Implementation is gated on
> approval of this plan. Project-mode redesign remains **deferred** and is not part of Phase 2's first
> increment.

## First Phase 2 objective

> Allow a learner to complete the pressure-drop Explore activity in the browser and then reproduce the
> same workflow in Python through a guided Jupyter notebook.

The browser **Explore** mode (Phase 1) teaches the pressure-drop problem with no code. Phase 2's first
step is the natural next rung: a single, self-contained **teaching notebook** that reproduces the
*same* activity — same dataset, same inputs and target, same split principles, same three models, same
metrics, same actual-vs-predicted plot, and the same engineering interpretation — in plain Python, so
an engineer can see the code behind what they just did in the browser.

This keeps the project's guiding principle intact: **usability and guidance first**, not new
algorithms. It is a **learning and exploration** artefact for **small, non-critical** engineering work
— **not** a validated design or analysis tool.

---

## 1. Target learner

- A practising **engineer with limited Python or ML experience** (mechanical/thermal background
  assumed, consistent with the Explore example).
- Has already **completed the browser Explore pathway** and understands the pressure-drop problem
  conceptually.
- **Wants to understand and reproduce** the workflow in code — to read it, run it, tweak inputs, and
  build intuition — not to build production software.
- Can run and edit a Jupyter notebook but should **not** be assumed to know ML jargon, advanced
  statistics, or ML tooling. (This matches the teaching level used by the related summer-school
  material inspected in §5.)

---

## 2. First notebook scope

**One** notebook, mirroring the browser Explore activity one-to-one. It must use the same:

- **dataset** — `examples/pipe_pressure_drop_sample.csv` (the synthetic, physically-informed
  Darcy–Weisbach dataset already in this repository; a training demonstration, not validated data);
- **input variables** — `pipe_length_m`, `pipe_diameter_m`, `flow_velocity_m_s`,
  `fluid_density_kg_m3`, `dynamic_viscosity_pa_s`;
- **target** — `pressure_drop_kpa` (kPa);
- **train/test split principles** — a reproducible split with a **fixed random seed (42)** and the
  same proportions used in Explore;
- **three models** — Linear Regression, Random Forest, and (optional) Decision Tree;
- **metrics** — RMSE and R², reported in physical units (kPa);
- **actual-vs-predicted plot** — with a "perfect prediction" diagonal, axes labelled in kPa;
- **engineering interpretation** — trend checks (Δp up with velocity/length, down with diameter),
  a plausibility note, and an explicit **extrapolation / in-domain vs out-of-domain** warning.

### Required notebook structure (15 sections)

1. **Learning objectives** — what the reader will be able to do afterwards.
2. **Engineering-problem explanation** — pressure drop in a pipe, in plain engineering language;
   restate the expected physical trends and the synthetic-data disclaimer.
3. **Dataset loading** — read the bundled CSV with `pandas`; show shape and a few rows.
4. **Input and target selection** — name the five inputs and the target explicitly, with units.
5. **Data inspection** — summary statistics, ranges, a couple of simple plots (e.g. Δp vs velocity,
   Δp vs diameter) to *see* the trends before modelling.
6. **Reproducible train/test split** — `train_test_split(..., random_state=42)`; explain why a fixed
   seed matters for reproducibility and comparison.
7. **Linear Regression** — fit the "simple trend" first; show it captures the main trend.
8. **Random Forest** — fit the "more flexible relationship"; explain trees combined and averaged.
9. **Optional Decision Tree comparison** — a single deep tree, to *show* overfitting (low training
   error, worse test error).
10. **RMSE and R²** — compute for each model on the test set; tabulate; interpret in kPa.
11. **Actual-vs-predicted plot** — for the best model (and optionally all three), with the diagonal.
12. **Overfitting discussion** — compare training vs test error; connect to the Decision Tree result.
13. **Extrapolation warning** — state the demonstrated input ranges; caution against using the model
    outside them; introduce the in-domain vs out-of-domain idea.
14. **Short exercises** — e.g. change the random seed; drop a feature; change forest depth/size; add a
    new prediction row and check plausibility.
15. **Advanced extension suggestions** — cross-validation, feature importance, gradient boosting,
    prediction intervals, trying the reader's own (non-critical) data — clearly flagged as optional.

> **Added during the neural-network increment (Section 16).** A single **optional, advanced** section
> was appended at the end: a `scikit-learn` neural network (`MLPRegressor` in a `StandardScaler`
> pipeline, `(32, 16)`, ReLU, fixed seed, early stopping, L2 regularisation) with its loss curve and
> an actual-vs-predicted plot. It is deliberately last and framed honestly — a more complex model is
> not automatically more accurate, and here it does **not** beat the Random Forest. This matches the
> browser's new advanced neural-network option. No PyTorch/TensorFlow; `scikit-learn` stays a
> notebook-only dependency. See [`NEURAL_NETWORK_DEMO.md`](NEURAL_NETWORK_DEMO.md).

The notebook must **echo the browser wording** (problem-led, plain language, model names as secondary
detail) so the two experiences reinforce each other.

### 2a. Reconciliation with the Explore code (recorded during implementation Step 2)

Reading `js/explore.js`, `js/ml-core.js`, and `js/platform-core.js` confirmed the exact browser
workflow and surfaced a few points where the notebook deliberately, and honestly, differs. These are
recorded here so the plan and the code stay in step.

- **Features and target — identical.** Five numeric inputs (`pipe_length_m`, `pipe_diameter_m`,
  `flow_velocity_m_s`, `fluid_density_kg_m3`, `dynamic_viscosity_pa_s`) → `pressure_drop_kpa`. The
  dataset has **no categorical columns**, so preprocessing reduces to **numeric standardisation only**
  (no one-hot encoding path is exercised).
- **Split — same ratio, different partition.** Explore uses a fixed **70 / 15 / 15** split
  (350 / 75 / 75 rows for the 500-row dataset) seeded with **42**. The notebook reproduces the same
  ratio and seed via scikit-learn `train_test_split`, but the **partition of specific rows differs**
  because the browser uses its own `mulberry32` shuffle. The exact rows in each set therefore do not
  match — only the proportions and the reproducibility principle do.
- **Validation set is defined but unused by these models.** Explore carves a validation set but does
  **not** tune on it for Linear/Tree/Forest (no hyperparameter search runs). The notebook mirrors this:
  it trains on the training set and reports on the test set, and explains that the validation slice
  exists for tuning (an advanced extension), not for these three fixed models.
- **Preprocessing — standardisation, population std.** Explore standardises numeric features with the
  population standard deviation (matching scikit-learn `StandardScaler`'s default `ddof=0`). The
  notebook applies `StandardScaler` to the linear model; trees and forests are scale-invariant, so
  scaling is unnecessary for them (noted in the notebook).
- **Model hyperparameters — one deliberate, documented divergence.** Linear = ordinary least squares
  (Explore's `linear` with `lambda = 0`, mathematically the same fit). Decision Tree = `max_depth=8`,
  `min_samples_leaf=5` (matches Explore's tree defaults). **Random Forest uses scikit-learn's own
  defaults** (`n_estimators=100`, `max_features=1.0`, unrestricted depth) rather than Explore's exact
  forest (40 trees, `max_features='sqrt'`, depth 8). Reason: with only five features, `max_features='sqrt'`
  restricts each split to ~2 inputs and, under scikit-learn's implementation, the forest then
  **underperforms the single tree** — which would contradict the teaching order the learner just saw in
  the browser. The scikit-learn default forest restores the intended, honest ranking. This divergence is
  stated plainly in the notebook.
- **Metrics will not match to the digit — and the notebook says so.** Because the browser uses bespoke
  JavaScript model implementations and a different row partition (`mulberry32` shuffle vs
  `train_test_split`), exact figures differ from scikit-learn. The table below records the **actual
  measured test-set results** from both sides (browser: Explore "compare" mode; notebook: executed
  offline from the committed CSV). It is a factual, side-by-side comparison — the numbers are **not**
  forced to agree.

  | Model | Browser test R² | Browser test RMSE (kPa) | Notebook test R² | Notebook test RMSE (kPa) |
  | --- | --- | --- | --- | --- |
  | Linear Regression | 0.563 | 26.63 | 0.596 | 22.23 |
  | Decision Tree | 0.679 | 22.84 | 0.780 | 16.39 |
  | Random Forest | 0.832 | 16.54 | 0.846 | 13.72 |

  The **ranking is identical on both sides** — Linear < Decision Tree < Random Forest — so the teaching
  story carries across: the linear model under-fits, a single deep tree overfits (its browser/notebook
  train R² are 0.96/0.94 against much lower test R²), and the random forest is strongest and most
  stable. The **magnitudes differ**, most visibly in RMSE (different test rows) and for the decision
  tree, whose browser implementation subsamples split thresholds (`maxThresholds`) and so fits a little
  less tightly than scikit-learn's exhaustive splitter. The notebook presents this **honestly and does
  not force exact equality**; the in-app Learn page and the notebook both tell the learner to expect
  slightly different numbers (see the browser teaching figures in [`EXPLORE_MODE.md`](EXPLORE_MODE.md)).
  *(Figures captured during implementation Step 14; regenerate by training Explore in "compare" mode and
  executing the notebook — small run-to-run drift is possible but the ordering is stable.)*

---

## 3. Relationship to the browser mode

The browser and notebook are **complementary**, not automatically linked in the first increment.

**Proposed first implementation (minimal, honest):**

- Add a **"Continue in Python"** link/button on the Explore result page (Stage 4).
- It **links to the notebook in this same repository** (e.g. `notebooks/pipe_pressure_drop.ipynb`),
  and offers two ways to open it:
  - **Google Colab** (one click, nothing to install) — the recommended beginner path;
  - **local Jupyter** (for users who already have Python) — with short instructions.
- The learner's **browser selections are described in words**, not transferred programmatically. The
  notebook uses the **same defaults and the same fixed random seed (42)**, so following it reproduces
  broadly the same result the browser showed.
- **No automatic notebook generation and no automatic state transfer** are promised or implemented in
  this first step. (Both are possible future work, explicitly out of scope here.)

Constraints carried over from Phase 1: **no backend, no accounts, no external AI API, no new runtime
dependency in the browser app.** The "Continue in Python" control is a plain link; it adds no runtime
libraries to the static site.

---

## 4. Notebook source decision

**Decision: author a new, self-contained notebook around the pressure-drop dataset** rather than reuse
an external notebook. Rationale is in §5 (no suitable notebook is available in this repository, and the
related summer-school notebooks are not present and carry no confirmed licence or shareable dataset).

The new notebook will:

- use **only** the MIT/UKRI pressure-drop dataset already in this repo (self-contained, no hidden data
  dependency);
- borrow **pedagogy and terminology only** (not code or data) from the inspected summer-school
  programme — specifically the "**inspect first → simple model before complex → discuss limitations
  before interpreting**" workflow and the **in-domain vs out-of-domain** framing, which align well with
  Explore's extrapolation warning;
- keep dependencies minimal (see §6).

---

## 5. Inspection of existing notebook assets (report)

Searched the whole local workspace (`/home/weiwang/Work_RSDevelopment`) for `*.ipynb` and for
regression/ML teaching material.

**Notebooks found locally:**

| Path | Relevance |
| --- | --- |
| `1_CHAPSim/CHAPSim_legacy/chapsim_docs/code_validation.ipynb` | **Not relevant** — CFD (CHAPSim) code-validation notebook. |
| `1_CHAPSim/CHAPSim_legacy/chapsim_docs/Weis_all_note_preparing_CHAPSim2.ipynb` | **Not relevant** — CHAPSim2 preparation notes. |

- **No regression / scikit-learn teaching notebook exists** anywhere in this repository or the sibling
  repositories under `GIT-CODES/`.

**Summer-school material found:** `GIT-EVENTS/ai4nth-summer-school`
(remote `github.com:CCP-NTH/ai4nth-summer-school`).

- It is a **Jekyll website** (programme, lecturer guidance, layouts) — it contains **no `.ipynb`
  files** and **no `LICENSE` file**.
- Its `programme.md` / `lecturer_guidance.md` describe **prepared CHF (Critical Heat Flux) case-study
  notebooks** for a thermal-hydraulics ML course, co-developed by (among others) **Dr Yu Duan** — the
  original Local Regression Studio author. The described sequence closely matches Explore:
  Linear/Ridge baseline → Random Forest / Gradient Boosting → Gaussian Process → small neural network,
  with an explicit **train / prediction / unsafe domain** framing and a "simple before complex" ethos.

**Conclusion (honest):** the actual CHF notebooks are **not locally available**, and their **dataset
and licence are unconfirmed**. Per the plan's instruction not to invent their contents, they are
**not** relied upon. If, in future, we wish to reuse or adapt them, the required source is the
**`CCP-NTH/ai4nth-summer-school` notebook materials (or the lecturers' notebook repository)**, and we
would first need to confirm:

- **licence compatibility** (no LICENSE is currently present in the site repo);
- **dataset shareability** (the CHF data licence/redistribution terms are unknown);
- **terminology changes** (CHF domain → generic pressure-drop / pipe-flow language);
- **difficulty trimming** (GP and neural-network labs are beyond the first "Learn the Code" step);
- **dependencies** (their environment may assume more than we want for a first notebook).

Until those are confirmed, the first notebook is authored fresh on our own dataset.

---

## 6. Environment options

| Option | Pros | Cons | Fit |
| --- | --- | --- | --- |
| **Google Colab** | One click, zero install, free, `pandas`/`scikit-learn`/`matplotlib` preinstalled; ideal for beginners | Needs a Google account and internet; must fetch the CSV (from the repo raw URL or an upload cell) | **Recommended default for beginners** |
| **Local Jupyter** | Fully offline, no account, uses the repo checkout directly; matches the project's browser-local ethos | Requires a working Python + Jupyter install | **Recommended for advanced users** |
| **VS Code notebooks** | Familiar to developers, good debugging | Requires VS Code + Python extension setup | Secondary; document briefly, not the primary path |

**Recommended simplest first user path:** a **one-click Colab badge** as the primary route, with a
short **local Jupyter** section for advanced/offline users. Keep **dependencies minimal** — target
`pandas`, `scikit-learn`, `matplotlib` only (all standard in Colab). Provide an optional
`requirements.txt` (or a `pip install` cell) for local users. No GPU, no heavy or fragile
dependencies.

*Data access note:* to avoid a hidden external dependency, the notebook should load the CSV in a way
that works in both environments — e.g. try a local relative path first, and fall back to the raw
GitHub URL of the committed dataset in Colab (documented, single, versioned URL — not arbitrary
external data).

---

## 7. Success criteria (measurable)

- The notebook **runs top-to-bottom** without manual fixes in both Colab and local Jupyter.
- It uses the **same dataset and the same fixed seed (42)**.
- Results are **broadly consistent** with browser Explore (same qualitative ranking: Random Forest
  best, single deep tree overfits, linear under-fits; metrics in the same ballpark).
- **No hidden external data dependency** (only the committed pressure-drop CSV, via a single
  documented path/URL).
- Explanations are in **clear engineering language**, problem-led, matching the browser wording.
- Estimated completion time **≈ 30–45 minutes** for the target learner.
- **Tested by at least three engineering users** before release.

---

## 8. Non-goals (first notebook)

Explicitly excluded from the first increment:

- Automatic **browser-to-notebook state transfer**.
- Automatic **notebook generation** from browser selections.
- **Cloud model training**, GPU training, or large datasets.
- **User accounts**, grading systems, or certificates.
- **Multiple engineering domains** (only pressure drop for now).
- **Complete Project-mode reproduction** in code, and any **Project-mode redesign**.
- New cloud APIs, new runtime dependencies in the browser app, or licence changes.

---

## 9. Recommended Phase 2 implementation sequence

1. **Select and simplify one notebook** — author a fresh `pipe_pressure_drop.ipynb` on our dataset
   (no external notebook is available to reuse; see §5).
2. **Align dataset and model defaults** — match the Explore feature list, target, split proportions,
   fixed seed (42), and model defaults so results correspond.
3. **Add engineering explanations and exercises** — the 15-section structure in §2, in plain
   engineering language.
4. **Add notebook tests** — an automated top-to-bottom execution check (e.g. `nbconvert
   --execute` or `nbclient`/`pytest --nbmake`) run in CI; assert it completes and that key metrics
   land in expected ranges.
5. **Add the "Continue in Python" link** — a plain link/button on Explore Stage 4 to the notebook,
   with Colab and local-Jupyter options (no new browser runtime dependency).
6. **Test in Colab and locally** — confirm both environments run clean with minimal dependencies.
7. **Run user testing** — at least three engineering users; capture confusion points and timing.
8. **Revise and release** — fold in feedback; document; only then consider the next notebook.

### Expected files to be added or modified (at implementation time, not now)

**Added**
- `notebooks/pipe_pressure_drop.ipynb` — the guided teaching notebook.
- `notebooks/README.md` — how to open (Colab badge + local Jupyter), what it covers, disclaimer.
- `notebooks/requirements.txt` — minimal pinned deps for local users (`pandas`, `scikit-learn`,
  `matplotlib`).
- `tests/test_notebook.py` (or a CI step) — executes the notebook end-to-end.

**Modified**
- `index.html` — add a **"Continue in Python"** link on Explore Stage 4 (plain anchor; no new
  runtime dependency).
- `js/explore.js` / `css/explore.css` — minimal wiring/styling for that link, if needed.
- Docs: `README.md`, `ROADMAP.md`, `docs/PROJECT_STATUS.md`, and a new `docs/EXPLORE_MODE.md` note
  linking Explore to the notebook.

**Never touched:** `LICENSES.txt`, Project-mode ML/core modules, `app.js`, and the inherited example
datasets.

---

## 10. Risks and cautions

| Risk | Mitigation |
| --- | --- |
| Reusing summer-school CHF notebooks with unclear licence/data | Do **not** reuse them; author fresh on our MIT/UKRI dataset until licence and data terms are confirmed. |
| Colab data access relies on an external URL | Use a single, documented raw-GitHub URL of the committed CSV; try a local path first; no arbitrary external data. |
| Notebook drifts out of sync with Explore defaults | CI notebook-execution test + a shared statement of the defaults/seed in both places. |
| Dependency bloat / fragile installs | Restrict to `pandas`, `scikit-learn`, `matplotlib`; prefer Colab's preinstalled stack. |
| Overstating the tool | Repeat the synthetic-data and not-for-safety-critical-design disclaimers in the notebook. |

---

*This is a plan. The next action after approval is sequence step 1: author
`notebooks/pipe_pressure_drop.ipynb` on the existing pressure-drop dataset. Nothing in this document
implements a notebook or changes application code.*
