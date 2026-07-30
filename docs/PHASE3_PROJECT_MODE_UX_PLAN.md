# Phase 3 plan — Project-mode UX improvements

> **Status update — increment 1 implemented (prototype).** The "recommended
> first implementation increment" in §5 is now built on
> `feature/project-mode-six-stage-shell`: Project mode presents **six
> user-facing stages** over the unchanged eight internal panels, with
> engineering language, per-stage guidance, model grouping (Recommended vs
> Other), and progressive disclosure for advanced modelling and governance
> controls. It is a **thin presentation and navigation layer only** — no
> calculation, adapter, default, pipeline order, governance rule or export
> format was changed. New/changed files: `js/project-shell.js`, `css/app.css`,
> `index.html`, `js/bootstrap.js`, `tests/project.spec.js`,
> `tests/smoke.spec.js`. The concrete stage↔panel mapping and the preserved
> contracts are recorded in
> [`PROJECT_MODE_STAGE_MAPPING.md`](PROJECT_MODE_STAGE_MAPPING.md). Deferred, as
> planned: a dedicated ANN random seed, IA re-grouping beyond labels/disclosure,
> and any change to model dispatch or the artifact contract. The audit and
> proposals below are retained as the plan of record.
>
> **Layout correction (follow-up to increment 1).** A responsive defect in the
> six-stage sidebar was fixed: the navigation list no longer inherits the legacy
> `.step-list` horizontal-stepper CSS (which had forced each text label into a
> 28 px circle, hidden labels at narrow widths, and hidden the privacy card
> below 1100 px). The navigation is now a self-contained, single semantic
> structure — `<nav class="stage-rail">` → an unordered `<ul class="stage-list">`
> with two-column stage rows and indented `4A/4B`, `6A/6B` substages (no stray
> `1.`/`2.` numbering). Desktop uses a `minmax(260px, 290px)` left column;
> at ≤ 900 px the grid collapses and the nav sits full-width above the content
> with the privacy/help cards beneath. Accessibility was added (`aria-current`
> scroll-spy, `aria-disabled` on locked stages, substage `aria-label`s, visible
> focus). Verified overflow-free at 1440/1024/768/600/390/~350 px and covered by
> new responsive/accessibility tests in `tests/project.spec.js`. Still
> presentation and navigation only. Details in
> [`PROJECT_MODE_STAGE_MAPPING.md`](PROJECT_MODE_STAGE_MAPPING.md).
>
> **Status update — increment 2 implemented (prototype): professional
> application shell.** Because the earlier render still read as an unstyled
> report outline, Project mode was re-presented as a compact engineering
> **application**. The root cause of "edits don't show" was a **stale cached
> stylesheet** — the stylesheet links now carry a `?v=` cache-busting query.
> The shell adds a sticky **application top bar** (product name + *Project* chip +
> live status + utility actions Home/Save/Open/Privacy/Help + language + runtime
> pill + *Local processing* disclosure), a **compact left workflow navigator**
> (~220 px), a **dominant single-stage workspace** (`showStage` reveals exactly
> one panel; `#view-project .panel:not(.is-active-panel){display:none}`), an
> **application footer** (System / Help / Contact / scope boundaries / legacy
> credit), and **collapsible stage guidance** (`<details class="stage-guidance">`).
> Substages now use **plain labels** (the `4A/4B/6A/6B` tags were removed) and
> show only while their parent stage is current; **privacy / system / help were
> relocated out of the workflow rail**. `js/project-shell.js` was rewritten as
> the single-stage controller; **`js/app.js` is unedited** (its own
> `scrollIntoView` transitions are mirrored by wrapping each panel's
> `scrollIntoView`). Still presentation, layout and navigation only — no
> calculation, adapter, default, pipeline order, governance rule, export or
> saved-project format changed. New/changed: `js/project-shell.js`, `css/app.css`,
> `index.html`, `tests/project.spec.js`, `tests/smoke.spec.js`,
> `docs/PROJECT_MODE_STAGE_MAPPING.md`. Full suite (project + smoke + explore +
> unit) green. Details in
> [`PROJECT_MODE_STAGE_MAPPING.md`](PROJECT_MODE_STAGE_MAPPING.md).
>
> **Correction — workflow navigation state model.** A follow-up manual review
> found that on a fresh project both Stage 1 **and** Stage 6 looked active/
> completed: the old two-state `syncSidebar` marked Stage 6 "available" because
> `step-monitor` is always present (no `.locked` class — it is gated by the
> `governance-only` mode), and the old `.is-available` marker reused the
> primary-dark active fill. The rail was reworked to a **four-state model**
> (**Active / Completed / Available / Locked**, classes on the row:
> `.stage-row.is-active|is-complete|is-available|is-locked`) derived only from the
> shown panel plus the inherited lock cascade. Completion is tied to genuine lock
> milestones (never *unlocked* / *visible* / *last* / *visited*); stage
> availability is derived from a stage's **entry panel** (`step-predict` for Stage
> 6), so a fresh Stage 6 is correctly **Locked**. States use more than colour
> (ring+bold, a `✓` glyph, reduced opacity) and a `checkConsistency()` guard keeps
> the top-bar status, active stage and completed set in agreement. `js/app.js`
> stays unedited and the saved-project schema is unchanged. Tests: a dedicated
> **workflow navigation state** block in `tests/project.spec.js` asserts the states
> from computed styles (fresh state, transitions, restoration, consistency);
> stylesheet cache-buster bumped to `?v=1.0.12`. Full Playwright suite **117
> passed**. A small **global-header refinement** followed: the application top-bar
> `h1` is now the compact **"Engineering project workspace"** (was "Engineering ML
> Studio"), so the full product name is shown once (in the global brand) instead of
> twice; the global `.top-nav`, router and accessibility are untouched. The
> remaining **two-header duplication** (global `.top-nav` + application top bar both
> showing *Home*) stays a **deferred** later refinement (full nav consolidation is
> not trivially isolated — the global nav is shared by all views). See
> [`PROJECT_MODE_STAGE_MAPPING.md`](PROJECT_MODE_STAGE_MAPPING.md) §"Workflow
> navigation state model".

**Original status:** planning only. This document proposes changes; **no
Project-mode JavaScript, HTML or CSS is modified in this phase.** The goal is to
make the inherited, technically complete Project mode approachable for
mechanical, thermal and computational engineers **without removing any advanced
modelling, validation or governance capability**.

Scope guardrails for Phase 3 implementation (when it happens):

- Do **not** redesign or rewrite the modelling engine.
- Do **not** delete advanced capability — only reorganise its visibility.
- Do **not** add server-side, cloud, external-AI, or new browser runtime
  dependencies. The app stays static and client-side.
- Preserve Yu Duan's original licence and attribution.

---

## 1. Audit of the inherited Project mode (evidence-based)

Project mode is the single-page workflow rendered in `#view-project`
(`index.html:369-837`), shown as one router view by `js/modes.js`. All model
scripts load via `js/bootstrap.js:90-101`, so every model listed below is live.
Findings below cite `file:line`.

### 1.1 Current stages (order the user sees them)

Sidebar nav `index.html:394-403`; panels `index.html:431-834`. **Eight** steps:

| # | Panel id | Purpose | Evidence |
|---|----------|---------|----------|
| 1 | `step-upload` | Load CSV / open project / load fitted model / load approved package; prediction-only + offline toggles | `index.html:431-450` |
| 2 | `step-features` | Choose target, target transform, select features; data-quality assistant | `index.html:452-485` |
| 3 | `step-preprocess` | Missing-value handling, scaling, categorical encoding, max categories, drop-reference | `index.html:487-506` |
| 4 | `step-model` | Pick model + tuning method + hyperparameters | `index.html:508-534` |
| 5 | `step-split` | Split strategy, seed, k-fold CV, uncertainty, comparison builder, **Train** | `index.html:536-615` |
| 6 | `step-diagnostics` | Metrics, comparison workspace, 9 plots, validation/acceptance, approval, final reports & exports | `index.html:617-773` |
| 7 | `step-predict` | Predict unknown CSV with fitted/approved model | `index.html:774-794` |
| 8 | `step-monitor` | Operational monitoring, revalidation triggers, model-change assessment | `index.html:796-834` |

### 1.2 Control tiers

- **Essential (beginner):** CSV upload (`index.html:433-438`); target column
  (`458`); feature select-all/clear (`472-476`); model radio cards (`510-522`);
  Train and evaluate (`610`); Predict CSV upload (`778`). Preprocessing (step 3)
  ships working defaults and is optional in practice.
- **Advanced modelling:** tuning method manual/grid/random/LHS (`526`) + sample
  count (`528`); per-model hyperparameters `#modelParams` (`530`, rendered
  `app.js:899-916`); split strategy (`539-541`); seed (`542`); k-fold CV
  (`543-544`); uncertainty method/level/bootstrap (`548-555`); comparison
  builder (`558-605`).
- **Validation / governance:** acceptance-criteria grid (`669-677`); approval
  identity/status/dates (`703-713`), intended/prohibited/limitations/conditions
  (`714-720`), operational schema (`721-723`), record approval (`725`); final
  reports & exports (`731-772`); monitoring + revalidation triggers +
  model-change (`815-833`). Backed by `validation-core.js`, `approval-core.js`,
  `governance-core.js`.

### 1.3 Models available (11)

UI radio list `index.html:510-521`; canonical frozen registry
`platform-core.js:11-55` (`MODEL_DEFINITIONS`):

`linear` Linear regression · `ridge` Ridge regression · `elasticnet` Elastic net ·
`robust` Huber robust regression · `tree` Decision tree · `forest` Random forest ·
`gboost` Gradient-boosted trees · `knn` k-nearest neighbours ·
`quantile` Linear quantile regression · `gp` Gaussian process ·
`ann` Artificial neural network.

Dispatch is layered (order-sensitive monkey-patching): base
`linear/ridge/tree/forest` in `ml-core.js:460-466`;
`elasticnet/robust/gboost/knn/quantile` in `modelling-core.js:314-322`;
`gp/ann` in `advanced-core.js:364-367`.

### 1.4 Neural-network support — already present and **FUNCTIONAL**

- **Label:** "Artificial neural network" radio, value `ann`
  (`index.html:521`); registry label "Artificial neural-network regression"
  (`platform-core.js:33`).
- **Implementation:** dense feed-forward trainer `advanced-core.js:266-338`,
  ensemble wrapper `340-356`, dispatch `364-367`, predict `396-404`, intervals
  `406-426`, importance `428-441`. Reached through the normal platform adapter
  (`app.js:1212-1222`).
- **Config controls exposed** (rendered `app.js:899-916`, collected
  `app.js:976-985`): hidden layers/neurons `annHidden1/2/3`; activation
  (ReLU / Leaky ReLU / Tanh / Sigmoid); optimiser (Adam / SGD); learning rate;
  batch size; max epochs; dropout; L2 regularisation; early-stopping patience +
  min-delta (`earlyStopping` hard-set true, `app.js:982`); MC-dropout vs deep
  ensemble uncertainty; live parameter-count estimator (`app.js:1009-1024`);
  hard block above 1,000,000 parameters (`advanced-core.js:269-270`).
- **Gap:** no ANN-specific random seed field — it shares the global split seed
  (`index.html:542`).
- **Verdict:** **FUNCTIONAL, not hidden, not incomplete.** Phase 3 should
  **surface and simplify** it (a safe recommended preset + progressive
  disclosure), **not build** it.

### 1.5 Confusing / jargon-heavy strings shown to users

`file:line` and actual text:

- "L2 coefficient shrinkage with bootstrap uncertainty" (`index.html:512`)
- "Combined L1 and L2 shrinkage for sparse, correlated linear models" (`513`)
- "Downweights large residuals" (`514`)
- "approximate leaf-based intervals" / "approximate between-tree intervals" (`515-516`)
- Target transforms "Box–Cox", "Yeo–Johnson" (`465-466`)
- "Latin hypercube sampling" (`526`)
- "Metadata/source-grouped split", "Regime-aware split" (`540`)
- "Huber threshold = 1.345, IRLS limit = 80" (`575`); "coordinate-descent limit = 500" (`574`)
- "Monte Carlo dropout" / "Small deep ensemble" (`app.js:913`); "Minimum validation improvement" (`app.js:912`)
- "Interval score", "Mean interval width" (`index.html:625`)
- Exported history fields "residualSd", "pinball loss", "negativeLogMarginalLikelihood" (`modelling-core.js:279`, `advanced-core.js:140`)

### 1.6 Overloaded sections, premature panels, dependencies

- **Overloaded:** `step-diagnostics` (`index.html:617-773`) holds metrics +
  comparison + 9 plots + validation + approval (17 fields, `703-720`) + final
  exports in one panel. `step-split` (`536-615`) bundles split + CV +
  uncertainty + a full comparison sub-builder + Train.
- **Premature/placeholder panels** rendered before data/results exist:
  acceptance summary "Train or load a model…" (`683`); approval summary
  (`701,727`); prediction summary (`791`); monitoring (`813`); revalidation
  (`825`); model-change (`832`); empty feature selectors (`645`, `779`).
- **Locking cascade:** panels start `.locked` + `aria-disabled`
  (`index.html:452,487,508,536,617,774`; `css/app.css .panel.locked`); unlocked
  by `unlockWorkflow`/`unlockPanel` (`app.js:2198-2204`), diagnostics/predict
  post-train (`app.js:1315,1424,1461`).
- **Mode classes:** `.training-only` / `.governance-only` hidden in
  prediction-only mode (`css/app.css:130`; body classes `app.js:173-174`).

### 1.7 Technical paths that MUST NOT break

- **Ordered train/eval pipeline** `trainAndEvaluate` (`app.js:1156-1315+`):
  `splitRows` → `fitPreprocessor` → `transformRows` → target-transform →
  `tuneModel` → adapter `.fit` → `fitSmearing` → bootstrap uncertainty (ridge) →
  `predictWithIntervals` + `inverseTargetTransform` per split → metrics. Do not
  reorder — train/validation/test isolation depends on it.
- **Layered model dispatch** (order-sensitive): `ml-core.js:460-472` ←
  `modelling-core.js:314-355` ← `advanced-core.js:364-441`. `bootstrap.js:90-92`
  load order must be preserved.
- **Platform adapter indirection:** `getModelAdapter`/`getModelDefinition` +
  frozen `MODEL_DEFINITIONS` (`platform-core.js:11-55,212-222`).
- **Prediction path:** `predictUnknownCsv` (`app.js:1956`) + applicability/schema
  checks.
- **Artifact/export/governance contract:** schema-versioned artifact
  (`app.js:1271-1285`); `recordApprovalDecision` (`app.js:462`),
  `downloadApprovedPackage` (`app.js:506`, integrity-checked).
- **Cross-validation:** `crossValidateRaw` (`app.js:1256`) with per-fold
  preprocessing re-fit (`modelling-core.js:397-421`, `advanced-core.js:488-505`).
- **Concurrency/cancel:** worker client + job manager + `isCancelled`
  (`app.js:28,1165`), `lockTraining` (`app.js:2205`).
- **Dataset fingerprint** (`app.js:1175`) gates comparison comparability.

---

## 2. Proposed information architecture

Present a **simplified, six-step visible workflow**. The current eight panels
collapse and re-group into six; nothing is deleted — advanced controls move
behind progressive disclosure.

| New visible step | Absorbs current panel(s) | Notes |
|---|---|---|
| 1. **Load data** | `step-upload` | Keep example datasets, project/model load, prediction-only + offline toggles |
| 2. **Choose inputs and quantity to predict** | `step-features` | Target = "quantity to predict"; features = "input variables" |
| 3. **Prepare data** | `step-preprocess` | Default to recommended preprocessing; advanced options collapsed |
| 4. **Choose and train models** | `step-model` + `step-split` train action | Model choice + Train together; split/CV/uncertainty/comparison move to disclosure |
| 5. **Evaluate results** | `step-diagnostics` (metrics + plots + comparison only) | Split out validation/approval/export (below) |
| 6. **Predict and export** | `step-predict` + export subset of `step-diagnostics` | Prediction + result/model export |

**Advanced modelling options** — available via progressive disclosure ("Advanced
model settings"), never removed:

- custom preprocessing (encoding, max categories, drop-reference, target transform);
- split strategy + seed + **cross-validation**;
- **hyperparameter tuning** (manual/grid/random/LHS + sample count);
- **uncertainty** (method/level/bootstrap, MC-dropout/ensemble);
- extra diagnostics (the full 9-plot set, interval metrics);
- **neural-network architecture and training controls** (see §3).

**Advanced validation and governance** — kept as a **separate** governance area
(not deleted, not forced on beginners): acceptance criteria; intended &
prohibited use; approval; operational release; monitoring; revalidation
triggers; model-change assessment. This directly de-crowds today's overloaded
`step-diagnostics` (§1.6).

Constraint: this is a **presentation re-grouping only**. The underlying
`trainAndEvaluate` pipeline, artifact contract, and governance modules (§1.7)
are reused unchanged behind the new layout.

---

## 3. Neural-network placement in Project mode

Project mode already exposes full ANN configuration (§1.4). Phase 3 should
eventually present it as:

- a **safe recommended neural-network preset** (sensible defaults mirroring the
  Explore safe defaults: single/two hidden layers, ReLU, Adam, modest learning
  rate, early stopping on);
- **automatic input scaling by default** (the network already standardises the
  target internally);
- detailed controls under a clearly labelled **"Advanced model settings"**
  disclosure:
  - hidden layers;
  - neurons per layer;
  - activation;
  - learning rate;
  - maximum iterations (epochs);
  - regularisation (L2, dropout);
  - early stopping (patience, min-delta);
  - random seed (add a dedicated ANN seed field — see §1.4 gap).

**Do not implement these in Phase 3.** They are already functional; the work is
to add the recommended preset + disclosure wrapper in a later increment, reusing
the existing `advanced-core.js` trainer and the `app.js:899-916` control renderer.

---

## 4. Engineering-language terminology table

Rename user-facing labels to engineering language; keep the formal ML term in
secondary help text where it aids the expert.

| Current term | Proposed term |
|---|---|
| Feature | Input variable |
| Target | Quantity to predict |
| Estimator | Model |
| Hyperparameter | Model setting |
| Split and train | Train and validate |
| Diagnostics | Evaluate results |
| Applicability envelope | Valid input range |
| Operational schema | Required prediction inputs |
| Approval candidate | Model submitted for review |
| Revalidation trigger | Condition requiring review |

Additional jargon from §1.5 (Box–Cox, Yeo–Johnson, Latin hypercube, IRLS,
coordinate-descent, pinball loss, negative log marginal likelihood) should be
demoted to secondary/expandable help text rather than shown as primary labels.

---

## 5. Recommended first implementation increment

Deliberately limited — no rewrite, no engine change:

- rename the Project heading to **"Engineering ML Studio — Project mode"**;
- add a concise explanation of what Project mode is for;
- rename stage labels to the six-step workflow (§2) and the terminology in §4;
- introduce **progressive disclosure** for advanced modelling controls;
- **default to recommended preprocessing**;
- **hide result panels until results exist** (remove premature placeholders, §1.6);
- add contextual, engineering-friendly help text;
- **preserve all calculations and state logic** (§1.7 pipeline untouched);
- **preserve governance capability** (validation/approval/monitoring intact);
- **preserve access to expert controls** (everything reachable via disclosure).

Explicitly **not** in the first increment: neural-network preset UI, IA panel
re-grouping beyond labels/disclosure, any change to model dispatch or the
artifact contract.

---

## 6. Future tests and user-testing criteria

### 6.1 Automated coverage (Playwright + unit + Python, all local)

- CSV upload; example-dataset loading;
- input-variable and quantity-to-predict selection;
- preprocessing (defaults + advanced);
- Linear Regression; tree models (decision tree, random forest);
- Gradient Boosting; neural network;
- metrics and plots;
- prediction on unknown CSV;
- export (results + model + approved package);
- validation and governance flow;
- browser-local privacy (no non-local network requests, mirroring the Explore
  `?localOnly=1` assertions);
- keyboard navigation;
- narrow-viewport layout.

### 6.2 User testing

Involve approximately **5–10 mechanical, thermal or computational engineers**.
Measure:

- time to first trained model;
- ability to complete a project without help;
- terminology comprehension (does §4 language land?);
- discoverability of advanced controls (can experts still find tuning/CV/
  uncertainty/governance?);
- confirmation that expert capability is preserved (no regression for advanced
  users).

---

*Engineering ML Studio is a redevelopment of **Local Regression Studio** by
**Yu Duan** (MIT licence). New contributions are © UKRI under the same MIT terms
and do not alter the original work's copyright or attribution.*
