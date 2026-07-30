# Phase 4 plan — engineering project templates and printable model reports

**Status: planning only.** This document proposes the next phase. It adds **no**
datasets, manifests, generators, report code or application changes. Nothing here
is implemented on this branch; it exists to be reviewed and approved before any
Phase 4 code is written.

The same guardrails that governed Phases 1–3 continue to apply:

- The application stays **static and client-side**. No server, no cloud, no
  external AI service, no accounts, no telemetry, no new browser runtime
  dependency.
- **No change** to the ML algorithms, model IDs, training pipeline order,
  saved-project schema, export schema, or governance data structures.
- Yu Duan's original licence and attribution are preserved.
- Any new dependency for *tests* or *dataset generation* is a developer-only,
  Python, offline dependency (as with the existing notebook stack) — never a
  browser runtime dependency.

See also: [`PROJECT_STATUS.md`](PROJECT_STATUS.md),
[`PROJECT_MODE_STAGE_MAPPING.md`](PROJECT_MODE_STAGE_MAPPING.md),
[`ROADMAP.md`](../ROADMAP.md), [`EXPLORE_MODE.md`](EXPLORE_MODE.md),
[`PHASE2_LEARN_THE_CODE_PLAN.md`](PHASE2_LEARN_THE_CODE_PLAN.md).

---

## 1. Phase 4 objective (§11)

> **Introduce a reusable engineering-project template format, add one additional
> reviewed engineering example, and design a downloadable engineering model
> report.**

Phase 4 strengthens the product along both of its intended axes without blurring
them.

### As a learning tool

- More **documented engineering examples**, each with a clear physical basis.
- Explicit **units and physical trends** attached to every input and target.
- Support for **model comparison** (already present) framed against expected
  physical behaviour.
- Clear treatment of **interpolation vs extrapolation** — where a fitted model
  can be trusted and where it cannot.
- **Physical-plausibility** checks: does the model reproduce the expected
  monotonic/curved trends of the underlying physics?
- **Responsible interpretation**: synthetic-vs-experimental status, prohibited
  uses, and the "not a design tool" caution carried through to the report.

### As an engineering tool

- **Start a Project from a documented template** — a reviewed, provenance-tagged
  starting point instead of a blank CSV upload.
- **Retain full user control** — the template only *pre-fills suggestions*; the
  engineer still chooses inputs, target, preprocessing, model and validation, and
  still triggers training manually.
- **Produce a reproducible model summary** — a self-contained, printable report
  capturing data, workflow, results, interpretation and governance.
- Continue to support the inherited **engineering validation and governance**
  (acceptance criteria, approval, monitoring).

Non-goals for Phase 4: no automatic model selection, no automatic training, no
"one-click answer", no safety-critical design guidance, no second notebook is
*required* per template (see §15).

---

## 2. Engineering-template schema (§12)

**Format decision (recommended): a transparent static pair per template —**

- a **JSON manifest** (`manifest.json`) — machine-readable metadata the app loads
  locally; and
- a **Markdown companion** (`README.md`) — human-readable documentation of the
  physics, provenance and limitations.

Rationale: JSON is already how the app handles saved projects and models, needs
no new parser or runtime dependency, and is trivially diffable/reviewable in git.
Markdown keeps the engineering narrative reviewable by domain experts without
reading JSON. The **dataset stays a plain committed CSV** (as the pressure-drop
example already is), so nothing about how CSVs are parsed changes.

### 2.1 Proposed on-disk layout (planning only)

```
examples/templates/
  <template-id>/
    manifest.json         # metadata (schema below)
    README.md             # physics, provenance, limitations, attribution
    data/<dataset>.csv    # the committed dataset (plain CSV, unchanged loader)
```

The existing `examples/*.csv` files are **not moved** by the schema itself; the
first increment (§6) converts the pressure-drop example into this layout
additively (the original CSV path may be retained or symlinked to avoid breaking
anything that references it — to be decided at implementation time, not now).

### 2.2 Manifest fields

Each template manifest defines (all fields planned, none implemented yet):

| Field | Purpose |
|-------|---------|
| `templateId` | Stable kebab-case identifier (e.g. `pipe-pressure-drop`). |
| `title` | Human-readable title. |
| `engineeringDomain` | e.g. "Fluid mechanics", "Heat transfer". |
| `problemStatement` | One-paragraph plain-language description of the task. |
| `datasetPath` | Relative path to the committed CSV. |
| `provenance` | Where the data came from (correlation name, citation, or experimental source). |
| `dataStatus` | `synthetic` or `experimental`. |
| `generatorPath` | If synthetic, the committed generator script that reproduces it. |
| `dataDictionary` | Per-column: description, physical meaning. |
| `inputColumns` | Recommended input feature columns. |
| `targetColumn` | Recommended target column. |
| `units` | Per-column SI units (also encoded in column names, as today). |
| `expectedTrends` | Per-input expected qualitative effect on the target (↑/↓/curved), for plausibility checks. |
| `validRanges` | Per-input valid min/max (the correlation's / data's domain of validity). |
| `recommendedModels` | Ordered list of suggested starting models (by existing model ID). |
| `preprocessingGuidance` | Notes on scaling/encoding/missing values for this dataset. |
| `knownLimitations` | Physical and modelling caveats. |
| `prohibitedUses` | Explicit "do not use for…" statements (e.g. safety-critical design). |
| `licence` | Licence of the dataset/manifest. |
| `attribution` | Author/owner and any inherited attribution. |
| `expectedMetricRanges` | **Broad** RMSE/R² ranges for regression testing (tolerances, not exact scores). |

All model references use the existing **frozen model IDs**
(`platform-core.js` `MODEL_DEFINITIONS`) — the template never introduces a new
algorithm.

### 2.3 How Project mode would load a template (planned behaviour)

1. The user picks a template from a **Start from template** control in Stage 1
   (Load data). The list is built from the committed manifests — **read locally**,
   no network request.
2. The app `fetch`es the manifest and the CSV from the **same origin** (bundled
   files), exactly as `?localOnly=1` already requires; nothing leaves the device.
3. The CSV is parsed by the **existing** loader (no change to parsing).
4. The manifest metadata **pre-fills suggestions only**: it proposes the target
   column, the input columns, and highlights the recommended starting models and
   valid ranges. It does **not** select-and-train.
5. The engineer confirms or overrides every choice and triggers training
   manually, exactly as with an uploaded CSV.

This is additive: the blank-CSV-upload path is unchanged and remains the default.

---

## 3. Next engineering example (§13)

### 3.1 Candidate comparison

| Candidate | Continuous target? | Meaningful inputs/units | Reproducible data | Useful nonlinearity | Understandable trend | Browser-suitable | Distinct from pressure drop | Misuse risk |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Convective heat transfer** | ✔ Nu / h / q″ | ✔ Re, Pr, properties | ✔ documented correlation | ✔ power-law | ✔ strong, monotonic | ✔ small synthetic CSV | ✔ heat, not flow-friction | **Low** (teaching, clearly synthetic) |
| Pump performance | ✔ head/efficiency | ✔ flow, speed | ~ needs vendor curves | ✔ curved | ✔ | ✔ | ✔ | Medium (could be read as selection advice) |
| Fan performance | ✔ pressure/efficiency | ✔ flow, speed | ~ vendor curves | ✔ | ✔ | ✔ | ~ similar to pump | Medium |
| Material strength | ✔ strength | ✔ composition/temper | ~ licensing of real data | ✔ | ~ multi-factor | ✔ | ✔ | **High** (safety-critical design temptation) |
| Thermal-system efficiency | ✔ efficiency | ✔ several | ~ system-specific | ✔ | ~ can be opaque | ✔ | ~ overlaps heat transfer | Medium |

### 3.2 Recommendation

> **Synthetic convective heat-transfer prediction using a documented
> correlation.**

It scores best across the criteria: a clean continuous target, physically
meaningful dimensionless inputs, fully reproducible synthetic data from a
published correlation, a strong and *understandable* power-law nonlinearity, clear
distinct learning value from the pressure-drop (Darcy–Weisbach) example (heat
transfer vs flow friction), and the **lowest misuse risk** — it is unambiguously a
teaching demonstration, not a design tool. Material strength is explicitly
**not** recommended for Phase 4 because of safety-critical-design misuse risk.

### 3.3 Clearest target: recommendation

Decision: **Nusselt number (Nu)** as the **primary** target.

- Nu is the **direct output** of the standard correlations, giving the cleanest,
  most defensible synthetic dataset and the clearest teaching of dimensionless
  groups and power-law behaviour.
- The **heat-transfer coefficient** `h = Nu · k / D` can be offered as an
  optional **derived** secondary target for a units-tangible variant (W·m⁻²·K⁻¹),
  and **wall heat flux** `q″ = h · (T_wall − T_fluid)` as a further derived
  quantity. These are documented as *optional extensions*, not the primary target,
  to keep the first template simple and the inputs minimal.

### 3.4 Recommended variables, ranges and basis (planning level only)

- **Correlation basis:** **Dittus–Boelter**, `Nu = 0.023 · Re^0.8 · Pr^n`
  (n = 0.4 for heating, 0.3 for cooling), for fully-developed turbulent flow in
  smooth circular pipes. Optionally note **Gnielinski** as a wider-range
  alternative for a later, more advanced variant.
- **Inputs (primary, dimensionless):** Reynolds number `Re`, Prandtl number `Pr`
  (and the heating/cooling flag if both n values are used).
- **Optional primitive-variable inputs (alternative framing):** velocity,
  hydraulic diameter, and fluid properties (ρ, μ, k, cₚ), from which Re and Pr are
  derived — useful for a more "engineering-tangible" variant; to be decided at
  implementation.
- **Parameter ranges (validity of Dittus–Boelter):** `Re ≈ 4,000–120,000`
  (turbulent), `Pr ≈ 0.7–120` (gases through water to light oils),
  `L/D ≳ 10` (fully developed). These become `validRanges` and drive the
  extrapolation warning.
- **Limitations:** smooth-pipe, fully-developed, moderate temperature-difference
  assumptions; ±~10–25% accuracy even against experiment; **synthetic** — not for
  design. These become `knownLimitations` / `prohibitedUses`.

**No dataset is generated in this phase.** The generator, ranges and validation
are specified for a domain expert to review first (see §18).

---

## 4. Printable engineering model report (§14)

Design a **self-contained, printable HTML report generated entirely in the
browser** from the current Project state. No PDF library initially; the user
prints or "saves as PDF" from the browser. Recommended: a single self-contained
HTML document (inline CSS, embedded chart images as data URIs) so it is portable
and archivable offline.

Proposed content:

### Project information
- Title; creation/export date; software version; dataset name and provenance;
  synthetic/experimental status.

### Data definition
- Row count; inputs; target; units; missing-data summary; train/test split; valid
  input ranges.

### Modelling workflow
- Preprocessing; selected models; model settings; random seed; validation method.

### Results
- Training and test RMSE; test R²; comparison table; actual-vs-predicted plot;
  residual summary; feature importance where applicable.

### Engineering interpretation
- Expected physical trends; plausibility checks; interpolation range;
  extrapolation warning; intended use; prohibited use; limitations.

### Governance
- Acceptance criteria; approval status; monitoring; revalidation information where
  available.

Constraints: the report **reads** existing in-memory Project state and existing
rendered charts; it does **not** recompute metrics or change any schema. It is an
export *presentation* of data the app already holds. A **print stylesheet**
(`@media print`) ensures clean pagination.

---

## 5. Relationship among Explore, Learn and Project (§15)

### Explore
- Curated, interactive engineering examples; limited controls; conceptual
  comparison; no project complexity. Instructional pathway.

### Learn
- Selected matching Python notebooks; code-level explanation; optional advanced
  extensions. Instructional pathway.

### Project
- User-uploaded data **or** optional engineering templates; full model
  configuration; printable engineering model report; governance tools.
  Productivity-focused.

**A template does not require both an Explore pathway and a notebook.** Coverage
is deliberately uneven: some templates may have an Explore activity, some a
notebook, some only a Project template. The three pathways are complementary, not
a matrix that must be filled.

---

## 6. First Phase 4 implementation increment (§16)

A single contained sequence, to be executed **after this plan is approved**:

1. Create the template **manifest/schema** (JSON + Markdown companion; a documented
   schema, e.g. a JSON Schema or a documented shape + validator).
2. **Convert the existing pressure-drop example** into the template format
   (additive; do not break existing references).
3. Add **one new heat-transfer template** (Nusselt number, Dittus–Boelter) — data
   generated only after domain-expert review of §3.4.
4. Add a **Start from template** control in Project mode (Stage 1).
5. **Load metadata and data locally** (same-origin fetch; no network under
   `?localOnly=1`).
6. **Pre-fill suggested inputs and target** from the manifest.
7. **Do not train automatically.**
8. Add **template validation tests** (§17).
9. Define the **report-export data structure** (what state the report reads).
10. Implement a **basic printable HTML model report**.

User control is preserved at every step over: inputs; target; preprocessing;
model choice; validation method; training.

---

## 7. Testing requirements (§17)

Plan tests (developer-only, offline) for:

- Manifest validity (schema conformance).
- File paths resolve (dataset, generator, companion docs exist).
- Dataset–column agreement (manifest columns match the CSV header).
- Units and metadata completeness (no required field missing).
- Generator reproducibility (regenerates the committed CSV byte-for-byte / within
  documented tolerance, as the pressure-drop generator test already does).
- Physically invalid values absent (e.g. no non-finite/negative where impossible).
- Trend sanity checks (target responds to inputs in the expected direction).
- Local template loading (no non-local requests).
- Suggested inputs/target are pre-filled from the manifest.
- No automatic training occurs on template load.
- No non-local requests during the template workflow.
- Saved-project compatibility (a project started from a template saves/loads under
  the **unchanged** schema).
- Report generation runs without error.
- Report content (required sections present).
- Print layout (`@media print`) is applied.
- Accessibility (report and new controls are keyboard/AT accessible).
- Narrow-viewport behaviour (no horizontal overflow).
- The unchanged **CSV-upload workflow** still works (regression guard).

Use **broad metric tolerances**, never exact scores.

---

## 8. Apprentice work-package mapping (§18)

For a three-month computing-engineering apprentice, with engineering oversight.

**Suitable apprentice implementation work** (software, testing, docs):
- Template schema and loader.
- Metadata validation.
- Dataset generator tests.
- End-to-end Project tests.
- Printable HTML report.
- Print CSS.
- Accessibility tests.
- Developer setup documentation.
- Release documentation.
- User-testing scripts.

**Requires engineering (domain-expert) oversight — not delegated to the
apprentice alone:**
- The physical correlation and its validity.
- Variable ranges.
- Modelling assumptions.
- Expected physical trends.
- Interpretation of results.
- Safety limitations and prohibited uses.

**The apprentice is not given sole responsibility for physical validation.** Every
physics-bearing artefact (correlation, ranges, trends, limitations) is signed off
by a domain expert before the corresponding dataset or template is committed.

---

## 9. Explicit non-goals for this planning branch

This branch adds **only** this document. It does **not**: add the second dataset;
implement template loading; implement report export; change ML algorithms; change
the saved-project schema; add cloud/server processing; add external AI services;
change the licence; or push to `upstream-yu`. Implementation begins only after
review and approval of this plan.
