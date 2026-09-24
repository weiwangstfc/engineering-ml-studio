# Work Plan — Engineering ML Studio

> **Audience:** the engineer picking up development of this platform.
> **Status of this document:** proposed plan, written 2026-09-24 against `main` @ `8889274`.
> Priorities are Wei Wang's to confirm; effort figures are estimates, not commitments.

---

## 1. What this platform is for

Engineering ML Studio is a browser-only machine-learning platform for engineers, aimed at
**mechanics, heat transfer and fluids**. It has two distinct aims, and nearly every decision below
traces back to one of them:

1. **A self-learning platform.** An engineer with no ML background should be able to arrive, pick an
   engineering problem they recognise, train a model, and understand the result — in minutes,
   without reading a manual.
2. **A platform for doing real work.** The same engineer should then be able to bring their own
   data and run a small engineering ML project end to end: prepare → train → validate → predict →
   monitor.

A third driver has since been added: the platform will underpin **training courses** — free to
students, paid for industry. That does not change the software's licence (Apache-2.0, see §4), but
it does raise the bar on classroom reliability and shareable, reproducible activities (Workstream E).

Read [`PRODUCT_VISION.md`](PRODUCT_VISION.md) and [`../ROADMAP.md`](../ROADMAP.md) before starting.

---

## 2. Where it is today (honest status)

Live at <https://weiwangstfc.github.io/engineering-ml-studio/>, deployed from `main` by
`.github/workflows/pages.yml`. Apache-2.0. 119 Playwright tests + 33 Python tests, green in CI.

**What works well**

- Five modes — Home, Explore, Project, Learn, About — routed by `js/modes.js`.
- **Explore**: a four-stage, problem-led guided flow (understand → choose approach → train and
  compare → interpret), with plain-language result explanations.
- **Project**: six user-facing stages presented over the eight inherited panels by
  `js/project-shell.js`, a thin presentation layer. Progressive disclosure for advanced controls.
- **Learn**: one guided Jupyter notebook reproducing the Explore pressure-drop workflow in Python.
- Inherited and mature: eleven regression models, diagnostics, prediction intervals, model
  comparison, validation, an approval workflow, monitoring/revalidation records.
- Everything runs client-side. No backend, no accounts, no telemetry, no data upload.
- `?localOnly=1` forces bundled libraries — genuinely offline, asserted by tests.

**The honest gaps** — these are what the plan addresses

| Gap | Evidence |
|---|---|
| **Only one engineering example exists.** `EXAMPLES` in `js/explore.js` has two entries: pipe pressure drop, and a generic "nonlinear signal" that is not an engineering problem at all. A platform for "mechanics, heat transfer and fluids" currently demonstrates fluids only. | `js/explore.js:35,73` |
| Inherited sample data is not engineering data — `house_prices_sample.csv`, two synthetic `nonlinear_*` files. | `examples/` |
| **One notebook**, covering the same single dataset as Explore. | `notebooks/` |
| **Aim 2 is the least developed.** Project mode presents the inherited workflow well, but offers nothing to help someone start *their own* project: no templates, no worked end-to-end example, thin guidance on bringing messy real data. | `ROADMAP.md` Phase 3 |
| Training runs on the **main thread** despite worker plumbing existing; large CSVs will freeze the tab. (**D3, approved**.) | `docs/ARCHITECTURE_AUDIT.md`, "Deployment" section |
| The CSV accept limit (200,000 rows) is ~10× what any model can train on and 100× the Gaussian process limit, so oversized data fails late and cryptically instead of at load. (**C1**.) | `js/security-core.js:5` vs `js/advanced-core.js:105` |
| Tests run **chromium only**. | `playwright.config.js` |
| The app still reports the inherited version **v1.0.11**; the project has no version of its own. | `index.html` footer, `js/approval-core.js` |
| No accessibility audit has been done. | — |

---

## 3. Non-negotiable guardrails

These are long-standing project rules. Breaking one is a bigger problem than any feature is worth.
Confirm with Wei Wang before going near them.

1. **Do not change the ML algorithms, the frozen model IDs, the training pipeline order, the
   saved-project schema, the export schema, or the governance data structures.** Saved projects and
   approved packages in the wild must keep working.
   *One agreed exception:* **D3** moves training onto the existing web worker. That changes *where*
   the pipeline runs, never *what* it computes, and it ships only against a bit-identical-results
   gate. Approved by Wei Wang on 2026-09-24 — see D3a/D3b. Nothing else in this rule is negotiable.
2. **No new browser runtime dependency.** The shipped app has zero runtime npm packages. Plotly and
   Papa Parse are already bundled/pinned; adding a third library needs a decision, not a commit.
3. **No build step.** The repository root *is* the deployed site. Plain HTML/CSS/JS, loaded directly.
4. **No server, cloud, account, telemetry or AI service.** Local-only processing is the core promise
   and is asserted by tests that fail on any non-local request.
5. **Preserve attribution.** Yu Duan's original notice (`LICENSES.txt`) and `NOTICE` must survive
   every change. Do not add SPDX headers to inherited files (the 39 files in commit `11ae72e`).
6. **Keep it relative.** The site is served from the `/engineering-ml-studio/` sub-path; a
   root-absolute `/css/...` will 404 in production but work locally.

---

## 4. Licence and naming, in one paragraph

The platform is **Apache-2.0** (`LICENSE`). Contributions are inbound-equals-outbound under §5 — no
agreement to sign. Add an SPDX header to **new** files only:

```js
// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 UK Research and Innovation (UKRI)
```

The **name and logo are not licensed** (Apache-2.0 §6 grants no trademark rights) — they identify
the official training and certification. **Course materials live in a separate repository** and are
not covered by this licence; do not commit curriculum, exercises, solutions or assessment here.

---

## 5. Day one

```bash
git clone git@github.com:weiwangstfc/engineering-ml-studio.git
cd engineering-ml-studio
npm install && npx playwright install chromium
npm run serve          # http://127.0.0.1:8000
npm test               # 119 Playwright tests, ~5 min
python3 -m unittest discover -s tests -p "test_*.py" -v
```

Then read, in this order: [`DEVELOPMENT.md`](DEVELOPMENT.md) →
[`PRODUCT_VISION.md`](PRODUCT_VISION.md) → [`PROJECT_MODE_STAGE_MAPPING.md`](PROJECT_MODE_STAGE_MAPPING.md)
→ [`EXPLORE_MODE.md`](EXPLORE_MODE.md) → [`../CONTRIBUTING.md`](../CONTRIBUTING.md).

Useful orientation facts:

- `js/bootstrap.js` loads 14 scripts sequentially after Plotly. Nothing is a module; everything
  binds to `window`. Tests therefore run assertions *inside* the browser via `page.evaluate`.
- Modes are `#hash`-routed and toggle `.is-hidden` on `#view-*` sections.
- `js/project-shell.js` is presentation only — `showStage`, `goToPanel`, `syncAll`,
  `checkConsistency`. It must never compute anything.
- The Explore → Project handoff in `js/explore.js` (`continueInProject`) is the reference pattern
  for "drive the inherited app through its own controls and change events, never write its state
  directly." Reuse it; several tasks below depend on it.

**Definition of done, for every task**

- Automated test covering the change: Playwright for anything in the browser, Python `unittest` for
  datasets and notebooks. New behaviour without a test is not done.
- Prove the test isn't vacuous — break the implementation, watch the test fail, restore.
- `npm test` and the Python suite both green locally before pushing.
- Topic branch → PR → CI green. Commits explain **why**, not what.
- Docs updated in the same PR when behaviour or deployment changes.

---

## 6. Workstreams

Priority key: **P1** = do first, directly serves a stated aim. **P2** = important, follows.
**P3** = worthwhile, not urgent.

### Workstream A — Engineering content library (P1)

*The single biggest gap. The platform claims mechanics, heat transfer and fluids, and ships one
fluids example. Everything else in the product is ready for more content — Explore renders its
example picker from the `EXAMPLES` array (`js/explore.js:248`), so adding an entry scales the UI for
free. This is also the best first task: it exercises the generator → test → wiring → copy pipeline
end to end and teaches the codebase.*

**Follow the existing pattern exactly:** `scripts/generate_pipe_pressure_drop.py` +
`tests/test_pipe_dataset.py` + a committed CSV + an `examples/README.md` entry.

| ID | Task | Est. |
|---|---|---|
| **A1** | **Heat-transfer dataset: convective cooling / fin heat dissipation.** Generator script driven by a documented correlation, fixed seed, SI units in every column name (`h_w_m2k`, `area_m2`, `delta_t_k`, …). Committed CSV ~500 rows. Python tests mirroring `test_pipe_dataset.py`: determinism for a fixed seed, expected columns and units, physically sensible ranges, no non-finite or negative values, and reproducibility of the committed CSV from documented defaults. | 3–4 d |
| **A2** | **Mechanics dataset: cantilever beam deflection** (or fatigue life — Wei Wang to choose). Same pattern. Should exhibit a different modelling character from A1 so the two teach different lessons. | 3–4 d |
| **A3** | **Second fluids dataset** distinct from pressure drop — e.g. orifice/venturi flow or drag on a bluff body. Same pattern. | 3 d |
| **A4** | **Wire A1–A3 into Explore.** Add `EXAMPLES` entries with the full narrative: problem statement, why an engineer cares, input/output descriptions with units, the expected physical trend, and the synthetic-data disclaimer. Match the depth of the existing `pipe` entry — the narrative *is* the teaching. | 2 d per dataset |
| **A5** | **Keep the `nonlinear` Explore example, and frame it as a deliberate lesson** (decided by Wei Wang, 2026-09-24 — it stays). It is the only non-engineering example, so its narrative copy should earn its place: present it as "what a hard, noisy problem looks like", the contrast case against the clean physics of A1–A3. Copy only — no data or behaviour change. Do this as part of the A4 copy pass. | 0.5 d |
| **A6** | **Dataset catalogue.** A short page (Learn mode or `examples/README.md` expanded) listing every dataset: the physics it comes from, the governing equation, ranges, seed, and an explicit "synthetic, for training only — not for design" statement. Provenance must be documented before any dataset is used in a paid course. | 1 d |

> **Constraint on all datasets:** synthetic and generated from a documented equation with a fixed
> seed, unless Wei Wang has cleared the provenance and reuse rights of real data. Never imply a
> synthetic dataset is experimental.

### Workstream B — Depth of the learning pathway (P1)

*Aim 1. Explore gets a learner to a trained model; it does less to leave them with transferable
understanding.*

| ID | Task | Est. |
|---|---|---|
| **B1** | **In-context concept explainers.** Short, dismissible "what does this mean?" disclosures next to R², RMSE/MAE, train-vs-test gap, and prediction intervals — in engineering language, with a worked number from the user's own result rather than a generic definition. Presentation layer only; no metric is recomputed. | 4–5 d |
| **B2** | **Overfitting made visible.** A deliberate teaching moment in Explore: show the same data fitted by a too-flexible model, side by side with the sensible fit, and explain the train/test gap. Uses existing models and the existing compare path — no new algorithm. | 3 d |
| **B3** | **Second notebook**, for whichever A-dataset teaches most (likely A2, for contrast with the fluids one). Mirror `notebooks/pipe_pressure_drop.ipynb` structure and its test coverage (`test_notebook_structure.py`, `test_notebook_execution.py`). | 4 d |
| **B4** | **Glossary**, reachable from every mode, linked from the explainers in B1. Engineering-first definitions. | 2 d |
| **B5** | **"Why this model?" guidance** at the Project stage-4 model chooser: when to prefer linear over a tree ensemble, in terms of data size, noise and the need to explain results to a colleague. Static copy, not a recommender. | 2 d |

### Workstream C — Making real projects possible (P1/P2)

*Aim 2, and the least developed part of the platform. The user arrives with a CSV that is messier
than any bundled example.*

| ID | Task | Est. |
|---|---|---|
| **C1** | **Real-data import hardening.** Systematically walk a set of deliberately awkward CSVs — European decimal commas, units embedded in headers, blank rows, mixed types, duplicate columns, thousands separators, dates. For each: a clear, specific, actionable message at the point of failure. Today several fail silently or generically. Write the awkward CSVs as fixtures and test each message. **Do not change the parser's success path** without discussion.<br><br>**Includes a latent bug worth fixing here** (found 2026-09-24): the CSV accept limit is 200,000 rows, roughly 10× what any model can train on and **100× the Gaussian process limit of 2,000**. So a 200k-row CSV loads cleanly, produces a dataset summary, and lets the user pick a target and features — then fails several steps later with `Exact/subset GP state contains 200000 rows; the configured hard limit is 2000`. The error arrives long after the cause and names an internal concept. Warn at **load** time, against the limits of the models the user is likely to reach. See the limit table under Workstream D. | 5–7 d |
| **C2** | **Project templates.** "Start from a template" that preconfigures a project for a common shape of engineering problem. **Implement as a presentation-layer handoff**, exactly like `continueInProject` in `js/explore.js`: drive Project mode's own controls and change events, write no state directly, unlock no panel, and train nothing automatically. This keeps the saved-project schema untouched. | 6–8 d |
| **C3** | **A worked end-to-end project**, documented: bring a dataset, prepare it, train, validate, approve, predict, record monitoring. Written as the reference an engineer follows for their own work. Doubles as course material scaffolding — keep the *platform-facing* version here, curriculum in the separate repo. | 3 d |
| **C4** | **Save / resume UX.** Saving and reopening projects exists but is undersold and easy to miss. Make the round trip obvious and reassuring. **Schema unchanged** — presentation only. | 3 d |
| **C5** | **Data-quality assistant follow-through.** The identifier/quality warnings exist; make them actionable ("this column looks like an ID — exclude it?") with a one-click response. Note the auto-detect heuristic was recently fixed (`js/ml-core.js`, `ID_NAME_PATTERN` / `continuousMeasurement`); re-read it before touching. | 3 d |

### Workstream D — Platform quality (P2)

| ID | Task | Est. |
|---|---|---|
| **D1** | **Accessibility audit and fixes**, targeting WCAG 2.2 AA. Keyboard-only path through Explore and all six Project stages, focus order and visible focus, form labelling, colour contrast, screen-reader pass on the stage navigation. 47 `aria-` attributes exist but nothing has been audited. Add automated checks where practical. | 5–7 d |
| **D2** | **Responsive pass over Project mode.** The recent fixes (single header, unclipped status readout) were spot repairs. Do the whole six-stage flow at 390 px properly — tables, plots, the advanced disclosures. | 4 d |
| **D3a** | **Spike: move training off the main thread** — *approved 2026-09-24, implementation to follow*. **Time-box strictly to 3 days; produce a written proposal, not code.** Read the four findings below first — they are already established, so do not re-derive them. Settle the three genuinely open questions: (i) **cooperative cancellation** — the worker only checks `cancelled.has(requestId)` between awaits, so a synchronous training loop cannot be interrupted; decide whether loops yield periodically, and how invasive that is in inherited code; (ii) **progress reporting** — `worker-client.js` already handles `PROGRESS` messages but nothing ever sends one, so decide where a progress hook can go in each trainer without restructuring it; (iii) **payload cost** — what crosses the boundary per train, whether it is structured-cloneable, and whether copying a large matrix undoes the benefit. **Start by measuring, not estimating:** train all eleven models on the current main-thread path at 1k / 10k / 50k rows × 30 columns and record wall-clock for each. That shows which models actually need the worker (expect Gaussian process, neural network and gradient boosting to dominate; linear will not), and the same harness becomes the baseline the D3b bit-identical test compares against — so it is not throwaway spike code. **Deliverable: `docs/WORKER_TRAINING_PROPOSAL.md` with the timing table, a go/no-go per model, and a firm estimate for D3b.** | 3 d |
| **D3b** | **Implement worker-based training**, per the D3a proposal. Non-negotiable gate: a test that trains every model on a fixed seed both ways and asserts **bit-identical** metrics and predictions — write that test *first*, against the current main-thread path, so it is proven meaningful before anything moves. Migrate model by model, each behind its own commit, so any regression bisects cleanly. **Watch the timeout:** `WorkerClient.request()` defaults to 15 s and rejects with "Worker operation timed out"; training must pass a much larger value or opt out, or large jobs will fail spuriously. Keep the existing graceful degradation — if the worker is unavailable, `failureReason` is set and training must still work on the main thread. No algorithm, model ID or schema changes. | 5–8 d, **confirm from D3a** |
| **D4** | **Cross-browser testing.** `playwright.config.js` runs chromium only. Add Firefox and WebKit, fix what falls out. Engineers at large firms are often on locked-down browsers. | 2–3 d |
| **D5** | **Empty and error states.** Every mode should say something useful when it has nothing to show, and every failure should say what to do next. Overlaps D3b, which introduces a training progress state — sequence them together. | 2 d |

**D3 groundwork already established** (verified 2026-09-24 — this is why the estimate is 5–8 d, not the
two-to-three weeks a "move training to a worker" task usually implies):

1. **The message plumbing is done.** `js/worker-client.js` is a complete generic client — request/
   response correlation, `PROGRESS` callbacks, `CANCEL`, timeouts, and graceful degradation when
   `Worker` is unavailable. None of it needs designing.
2. **The worker is nearly empty.** `js/lrs-worker.js` is 33 lines and imports only
   `platform-core.js`, handling `PING`, `FINGERPRINT_TEXT` and `MODEL_CAPABILITIES`. The change is
   additive: `importScripts` the three core modules and add a `TRAIN` message type.
3. **The `window` shim already exists.** `self.window = self` at the top of the worker is what lets
   modules that bind to `window` load there. `ml-core.js`, `advanced-core.js` and
   `modelling-core.js` should therefore load **unmodified** — confirm in the spike.
4. **Determinism is in far better shape than assumed.** Every trainer already seeds through
   `ML.mulberry32(seed)`. The only `Math.random` in `js/` is `platform-core.js:63`, generating an
   ID, not training. The bit-identical gate should be achievable rather than aspirational.

Related: the worker reports `workerVersion: '1.0.11'` and `LRSWorkerClient.version` is the same
inherited string — fold both into **F1**.

#### Target dataset size — *proposed, confirm before week 5*

D3a needs a size to design against. The platform already enforces limits, and **they disagree with
each other by two orders of magnitude**:

| Layer | Limit | Where |
|---|---|---|
| CSV accept (denial-of-service guard) | 50 MB, **200,000 rows**, 500 columns | `js/security-core.js:5` |
| k-nearest neighbours | 25,000 rows | `js/modelling-core.js:237` |
| Random forest | 20,000 rows per tree (subsamples above this) | `js/ml-core.js:465` |
| **Gaussian process** | **2,000 rows, hard failure** | `js/advanced-core.js:105` |
| Neural network | 1,000,000 trainable parameters | `js/advanced-core.js:269` |

The inherited engine's real design point is **~20–25k rows**; the 200k figure is a DoS guard, not a
capability claim.

**Proposed target: 10,000 rows × 30 columns. Interactive ceiling: 50,000 × 100.**

- The generated teaching datasets are ~500 rows. A learner's own data — a test-rig log, a simulation
  sweep, a sensor export — is realistically hundreds to low thousands of rows. 10k × 30 covers
  essentially all of it with headroom.
- 10k × 30 is 300,000 doubles, about **2.4 MB**. Memory is a non-issue at that scale; wall-clock
  time is the only real question.
- It sits below every inherited per-model guard, so D3 need not change any of them.

> **A worker does not raise the size limit.** It turns a frozen tab into a responsive one with a
> progress bar and a working cancel. Complexity is unchanged — a Gaussian process is O(n³) time and
> O(n²) memory on a worker thread exactly as on the main thread. D3 is about **responsiveness, not
> scale**. Handling genuinely large data would be a different project (subsampling, algorithmic
> caps, streaming) and is not obviously worth doing: no engineering teaching dataset needs it.

*This target is inferred from the code and the bundled datasets, not from knowledge of who actually
attends the courses. Wei Wang to confirm or replace it — see §8.*

### Workstream E — Course enablement (P2)

*Only what the **platform** needs. Curriculum lives elsewhere.*

| ID | Task | Est. |
|---|---|---|
| **E1** | **Shareable deep links.** `#explore/pipe` or equivalent, so an instructor can send students straight to one activity. Extends the existing hash routing in `js/modes.js`; keep unknown routes falling back to Home as they do now. | 2–3 d |
| **E2** | **Classroom offline mode.** `?localOnly=1` already forces bundled libraries — verify it end to end on a genuinely offline machine, document it as the recommended classroom setting, and test that no CDN request escapes. Teaching rooms have bad wifi. | 2 d |
| **E3** | **Reproducibility surfaced in the UI.** Seeds and split settings should be visible and stated in exports, so thirty students can be expected to get the same numbers. Read-only surfacing — do not change defaults. | 2 d |
| **E4** | **Instructor-facing boundary note.** A short `COURSE_MATERIALS.md` stating what belongs in this repo versus the private course repo, so the line does not blur as the platform grows. | 0.5 d |

### Workstream F — Engineering hygiene (P2/P3)

| ID | Task | Est. |
|---|---|---|
| **F1** | **Give the project its own version.** The app still reports the inherited **v1.0.11** in the footer and in generated validation reports. Define a scheme, put it in one place, surface it consistently, and document the release process. Note `tests/project.spec.js` asserts the current footer string — update together. | 2 d |
| **F2** | **Consolidate `docs/`.** Fifteen markdown files plus the `html/` help set, several of them point-in-time phase snapshots. Separate living documents from historical records so a newcomer knows what is current. (`ARCHITECTURE_AUDIT.md` is explicitly a Phase 0 snapshot — leave it as a record.) | 2 d |
| **F3** | **Dependency and SBOM refresh.** Confirm `SBOM.cdx.json` and `THIRD_PARTY_NOTICES.md` match what actually ships; add a checklist step to the release process. | 1 d |
| **F4** | **Repo presentation.** Description, topics, social preview. Draft description and 20 topics were prepared on 2026-09-24 and may already be applied. | 0.5 d |

---

## 7. Suggested sequence

A single engineer, roughly one quarter. Adjust once A1 reveals the real pace.

| Weeks | Focus | Why this order |
|---|---|---|
| 1 | Onboarding, then **A1** | A1 is self-contained, ships something visible, and forces a tour of generator → tests → Explore → docs. |
| 2–4 | **A2, A3, A4, A5, A6** | Closes the headline gap: three engineering domains instead of one. Everything after this teaches better. |
| 5 | **D3a** spike (3 d), then start **B1** | The spike is cheap and now on the critical path — its proposal has to exist early enough to schedule D3b and to answer the classroom dataset-size question. It blocks nothing, so it sits in a gap rather than displacing P1 work. |
| 6–7 | **B1, B2** | Depth on the datasets now available. |
| 8 | **E1, E2, E4** | Cheap, and makes the platform usable in a classroom. Do before the first course. |
| 9–11 | **C1, C2** | The hard, high-value work on aim 2. C1 first — templates are worth little if real data won't load. |
| 12 | **D1, D2** | Accessibility and mobile, before wider promotion. |
| 13–14 | **D3b** with **D5**, then **F1** | The identical-results test is written first. D5's progress/error states land with the worker change rather than after it. Versioning last, so the release records the worker migration. |
| 14 | **B3** | Second notebook. First thing to drop if the quarter has to end at 13. |

> **This is ~14 weeks, not 12.** Approving D3 added the spike plus implementation. It is less than it
> first looked — reading the worker showed the plumbing is already built and the RNG already seeded
> (see the D3 groundwork note under Workstream D), so D3b is estimated at 5–8 days rather than the
> 8–12 assumed before. If 12 weeks is fixed, **defer B3 and D4**: that lands it at 13 and costs only
> the second notebook and cross-browser coverage, neither of which blocks a first course. Confirm the
> real D3b number from the D3a proposal in week 5 rather than trusting this estimate.

**If only three things get done: A1–A4** (engineering breadth), **C1** (real data actually loads),
**B1** (learners understand what they see). Those three move both stated aims furthest.

---

## 8. Decisions needed from Wei Wang

### Still open

1. **A2** — beam deflection, fatigue life, or something else? Which mechanics problem will the
   course actually teach?
2. **A1/A3** — synthetic only, or is there real, clearance-checked experimental data available? Real
   data would be a significant differentiator and a significant IP conversation.
3. **D3a input — confirm the target dataset size.** A proposal is now on the table (**10,000 rows ×
   30 columns**, ceiling 50,000 × 100) with the reasoning under Workstream D. It is inferred from
   the code's own limits and the bundled datasets, not from knowing who attends the courses — so it
   needs a yes, or a replacement, **before week 5**. If real course data will be much larger than
   this, say so early: it changes D3 from a responsiveness task into a scale task, which is a
   different and considerably larger piece of work.
4. **Sequencing** — 15 weeks, or defer B3/D4 to land at 13? See the note under §7.
5. **F1** — version scheme, and whether to cut a `v1.0.0` of Engineering ML Studio proper.

### Decided

- **2026-09-24 — D3 approved.** Training moves off the main thread: spike (D3a) then implementation
  (D3b), against a bit-identical-results gate. Recorded as the one agreed exception to guardrail 1.
- **2026-09-24 — A5: keep the `nonlinear` example.** It stays; its narrative copy is reframed as the
  deliberate "hard, noisy problem" contrast to the physics-based datasets.

### Deferred

- Deferred by Wei Wang on 2026-09-24, tracked here so they are not lost: **trademark filing**
  (UK IPO Class 41) and **STFC IP review** of the `LICENSE` / `NOTICE` / `LICENSES.txt` set.
