# UX Redesign Plan — Engineering ML Studio

> **Status update (Phase 1).** The **first increment of this plan is now prototyped**: a new landing
> page and a guided beginner **Explore mode**, with **Project mode** preserving the inherited workflow
> unchanged. Explore has since been revised to be **problem-led and engineering-focused** — it opens on
> a concrete mechanical/thermal problem (**predicting pressure drop in a pipe**) rather than asking the
> beginner to pick a dataset or a model by name. Its four stages are *understand the problem → choose
> an approach → train and compare predictions → interpret the engineering meaning*; the approach choice
> uses plain engineering language with algorithm names as secondary detail, and results are reported in
> physical units (kPa). This directly advances several proposals below — an engineering-framed entry
> point, a built-in engineering dataset, simpler language, and plain-language diagnostics. See
> [`EXPLORE_MODE.md`](EXPLORE_MODE.md) and
> [`PHASE1_IMPLEMENTATION_PLAN.md`](PHASE1_IMPLEMENTATION_PLAN.md). The remainder of this document
> stays a **proposal** for later increments (configurable Project mode, wider language pass,
> additional datasets, notebook integration). One deviation from the original proposal below: the
> landing page currently offers **two** primary routes (Explore, Project) with *Learn with Python*
> shown as **Coming later**, rather than three live entry points, because no real notebook
> integration exists yet.
>
> **Proposal note (later increments):** the sections below are not yet implemented beyond the first
> increment described above.
>
> **Source basis note:** No screenshots are stored in the repository. This plan is therefore based
> on the **confirmed application structure** (`index.html`, `css/app.css`, and the module map in
> [`ARCHITECTURE_AUDIT.md`](ARCHITECTURE_AUDIT.md)), not on visual screenshot review. Where a claim
> depends on visual appearance rather than markup, it is marked **[Assumption]**.

## Current usability problems (from structure)

- **[Confirmed]** The interface is a **single long page** with eight sequential steps
  (Load data → Features/target → Preprocessing → Model & tuning → Split & train →
  Review/validate/approve/export → Predict → Monitor). There is no mode selection or entry ramp.
- **[Confirmed]** **Everything is shown at once.** All steps and their advanced options are present
  in one document, with no progressive disclosure driven by user intent.
- **[Confirmed]** **Expert terminology** is used throughout (e.g. target transform, preprocessing
  configuration, hyperparameter tuning, quantile/GP/ANN options, approval packages, revalidation).
- **[Confirmed]** Step 6 bundles **review, validation, approval, and export** into a single dense
  stage — a lot for a beginner to absorb at once.
- **[Assumption]** Visual density and small controls make first-time orientation hard; to be
  validated with real users.

## Why the existing interface is difficult for beginners

- No guided starting point; the user must know the whole workflow before acting.
- No sensible-default "just show me a result" path.
- Governance/approval/monitoring machinery (advanced) sits inline with basic tasks.
- Language assumes ML familiarity rather than engineering familiarity.

## Proposed landing page

- Clear product statement and the safety notice (not a validated safety-critical tool).
- Three obvious entry points: **Explore**, **Start a Project**, and **Learn the Code**.
- A short "load a built-in engineering dataset" shortcut.
- Visible attribution to Yu Duan / Local Regression Studio and the privacy posture.

## Proposed Explore workflow (beginner)

- One built-in engineering dataset preselected; minimal choices.
- Auto-selected sensible target/features with the option to change.
- Defaults for preprocessing and model; a single **"Train and explain"** action.
- Results presented in plain language with a small set of essential diagnostics.
- Gentle prompts toward Project mode and the Learn the Code pathway.

## Proposed Project workflow (configurable)

- The full eight-stage flow, but presented as **discrete, navigable steps** rather than one page.
- **Progressive disclosure**: advanced options hidden behind clearly labelled "Advanced" toggles.
- Split the current Step 6 into distinct **Review**, **Validate**, and **Approve/Export** stages.
- Persistent progress/navigation so users can move between steps without losing context.

## Proposed Learn the Code pathway

- For key UI actions, show the **equivalent Python** (e.g. scikit-learn-style snippets).
- Offer export/"open in Jupyter" so users can continue in a notebook (Phase 1 roadmap item).
- Frame the no-code UI as a bridge to writing code, not a replacement.

## Advanced Validation and Governance pathway

- Keep the inherited validation, approval, monitoring, and governance features, but route them
  through a distinct **Advanced Validation and Governance** area, out of the beginner path.
- Preserve existing record formats and safeguards; change presentation, not behaviour.

## Progressive disclosure strategy

- **Tiered exposure:** Explore (minimal) → Project (full with advanced hidden) → Advanced Validation and Governance.
- Advanced controls collapsed by default; a single global "show advanced" preference.
- Contextual help/explanations available inline rather than in separate manuals.

## Navigation changes

- Replace the single scrolling page with **stepwise navigation** (wizard-style for Explore, a step
  rail for Project).
- Add a top-level mode switcher (Explore / Project / Learn the Code / Advanced Validation and Governance).
- Ensure the layout is **responsive** for smaller screens.

## Terminology changes

- Prefer engineering-friendly phrasing over ML jargon, with the technical term available on hover
  or in help.
- Examples (proposals): "target transform" → "adjust the output scale"; "hyperparameter tuning" →
  "let the tool find good settings"; "preprocessing configuration" → "prepare the data".

## Essential vs advanced diagnostics

- **Essential (always shown):** goodness-of-fit summary in plain terms, predicted-vs-actual,
  residual overview, and a clear statement of limits/uncertainty.
- **Advanced (on demand):** full metric tables, per-fold cross-validation detail, feature
  importance internals, quantile/GP/ANN-specific diagnostics, applicability checks.

## Initial usability-testing plan

1. Recruit a small number of **engineers new to ML** plus a few advanced users.
2. Task-based sessions: load a built-in dataset and reach an explained result in Explore mode;
   then complete a small end-to-end task in Project mode.
3. Measure time-to-first-result, points of confusion, and terminology that fails.
4. Capture whether the Learn the Code moment is understood.
5. Iterate on defaults, wording, and disclosure before widening the audience.

> None of the above is implemented at this stage. Implementation is gated on Phase 1 in
> [`ROADMAP.md`](../ROADMAP.md) and on decoupling `app.js` (see architecture audit).
