# Project mode — six-stage shell ↔ eight-panel mapping

This note records the **presentation-only** mapping introduced by
`feature/project-mode-six-stage-shell`. Increment 1 relabelled and grouped the
inherited panels; **increment 2** re-presents Project mode as a compact
engineering **application shell**: an application top bar, a compact left
workflow navigator (~220 px), and a dominant workspace that shows **one stage at
a time**. The inherited Project mode has **eight internal panels**; the user now
sees **six stages**. The eight panels, their DOM IDs, the training pipeline, the
artifact/export contract and the governance records are **unchanged** — only
labels, grouping, layout, navigation, disclosure and per-stage visibility
change.

## Architecture (as inherited, then re-presented)

Project mode lives inside `#view-project` (`index.html`). As inherited it was a
single-page scrolling layout: a sidebar navigation plus eight stacked
`<section id="step-…" class="panel">` blocks. Downstream panels carry `.locked`
+ `aria-disabled="true"` and are unlocked programmatically by
`unlockPanel(id)` / `unlockWorkflow()` in `js/app.js`. `js/app.js` references
panels **only by their stable IDs** and never reads the sidebar structure or the
`.step-kicker` text, so the sidebar, headings and layout can be re-presented
without touching application logic.

Increment 2 wraps the same eight panels in an application shell:

- `<header class="app-topbar">` — product name, a `Project` mode chip, a live
  project status (`#projectStatusText`), and utility actions (Home, Save
  project, Open project, Privacy, Help), the relocated language selector and the
  `#runtimeMode` pill, plus a `Local processing` `<details>` disclosure.
- `<main class="app-shell">` — a two-column grid: a compact
  `<aside class="sidebar">` workflow navigator and a `<section class="workspace">`
  holding the eight panels.
- `<footer class="app-footer">` — the relocated System (Runtime and integrity,
  Recovery), Help documentation links, Contact link, the governance **scope**
  boundaries (`.app-footer-scope`) and the legacy-engine credit
  (`.app-footer-credit`).

**Single-stage workspace.** `#view-project .panel:not(.is-active-panel)` is
`display:none`; `js/project-shell.js` adds `.is-active-panel` to exactly one
panel at a time via `showStage(id)`. The workspace therefore reads as one
application screen, not a long report. Because app.js draws Plotly charts while a
panel may still be hidden, `showStage` calls `Plotly.Plots.resize` on the
revealed panel's `.plot` elements.

**Cache-busting.** Both stylesheet links carry a version query
(`./css/app.css?v=1.0.11`, `./css/explore.css?v=1.0.11`) so stylesheet edits are
never masked by a stale browser cache.

## Six user-facing stages → eight internal panels

| User stage | Full stage heading | Internal panel ID(s) | Substage |
| --- | --- | --- | --- |
| 1. Load data | Load data | `step-upload` | — |
| 2. Inputs and target | Choose inputs and quantity to predict | `step-features` | — |
| 3. Prepare data | Prepare data | `step-preprocess` | — |
| 4. Choose and train | Choose models / Configure validation and train | `step-model`, `step-split` | `step-model` (Choose models) · `step-split` (Configure validation and train) |
| 5. Evaluate results | Evaluate results | `step-diagnostics` | — |
| 6. Predict and monitor | Predict and export / Monitor and revalidate | `step-predict`, `step-monitor` | `step-predict` (Predict and export) · `step-monitor` (Monitor and revalidate) |

The concise rail labels are: 1 Load data · 2 Inputs and target · 3 Prepare data ·
4 Choose and train · 5 Evaluate results · 6 Predict and monitor. The full panel
headings (column 2 above) may be longer; the navigation labels stay short and
wrap over at most two lines. Substages are shown with **plain labels** ("Choose
models", "Configure validation and train", "Predict and export", "Monitor and
revalidate"); the `4A/4B/6A/6B` tag spans used in increment 1 have been
**removed**.

## Navigator layout, responsiveness and accessibility

The navigation is a **single semantic structure** restyled responsively — there
is no second, hidden nav tree for small screens.

- **Structure.** `<nav class="stage-rail" aria-label="Project workflow — six
  stages">` → `<ul class="stage-list">`. Each top-level stage is a `.stage-item`.
  Single stages contain an `<a class="stage-row">` with a `.stage-num` badge and a
  `.stage-label`. Grouped stages (4 and 6) use an `<a class="stage-row
  stage-parent">` heading (linking to the group's first panel) followed by a
  `<ul class="substage-list">` of `<a class="substage-row">` links, each holding a
  single plain `.substage-label` (no `4A/4B` tag span). Both lists are
  **unordered** (`list-style:none`), so the browser never renders stray
  `1.`/`2.` markers, and `.stage-row` sets `text-decoration:none` so rows are not
  underlined blue links.
- **Not `.step-list`.** The list intentionally does **not** carry the inherited
  `.step-list` class, so the legacy horizontal-stepper rules (the
  `repeat(7/8,…)` grids, the `.step-list span{border-radius:50%}` circle that
  previously crushed each text label into a 28 px disc, and the `font-size:0`
  label-hiding at narrow widths) no longer apply. The six-stage navigation is
  styled from scratch under `.stage-list` / `.stage-row` / `.substage-row`.
- **Substages shown only when their parent is current.** `.substage-list` is
  `display:none` by default; `js/project-shell.js` adds `.substages-open` to the
  grouped `.stage-item` that owns the shown panel (via `setCurrent`), revealing
  its substages. The other group's substages stay collapsed, keeping the rail
  compact.
- **Desktop (≥ 901 px).** `#view-project .app-shell` is a two-column grid,
  `220px minmax(0, 1fr)`; the sidebar is a sticky, compact left column and the
  workspace uses `minmax(0, 1fr)` so it dominates and never forces horizontal
  overflow. Each stage row is a two-column grid (marker | wrapping text); long
  labels wrap over at most two lines rather than one word per line.
- **Narrow (≤ 900 px).** The grid collapses to a single column; because the
  sidebar is the first child of `.app-shell`, the compact navigator moves
  **above** the workspace in normal document order. No horizontal scrollbar
  appears at 1440 / 1280 / 1024 / 768 / 390 px.
- **Accessibility.** The nav has an accessible name; the **shown** stage (there
  is exactly one) carries `aria-current="step"` on its row — current stage =
  shown stage, so no scroll-spy is needed. Locked stages expose
  `aria-disabled="true"` on their row link (mirrored from each panel's `.locked`
  class by `syncSidebar`) rather than relying on colour alone (see the four-state
  model below); rows remain keyboard-focusable with a visible focus ring;
  `showStage` moves focus to the revealed `<section>` (with `preventScroll`).
  These are presentation and navigation aids only — they set no application state
  and never unlock a panel.

## Existing internal order (preserved exactly)

`upload → features → preprocess → model → split → diagnostics → predict → monitor`

The six-stage shell never reorders these; substages 4A/4B and 6A/6B are shown in
this same order.

## Navigation behaviour (single-stage)

- **Rail clicks switch the shown panel.** `onSidebarClick` intercepts
  `a[href^="#step-"]`, prevents the default hash jump, and calls
  `goToPanel(id)`, which reveals the target **only if it is reachable** (not
  `.locked` and not hidden by the current mode). A click on a locked stage is
  refused — it cannot enter an invalid internal state.
- **Back / Continue.** Increment 1's additive `.stage-continue[data-target]`
  buttons are retained; `js/project-shell.js` also injects a `.stage-back` button
  into every panel after the first (reusing a non-governance `.stage-nav` when
  present, otherwise creating a plain one). Continue/Back walk the fixed panel
  order, skipping panels that are locked or hidden by the current mode
  (`nextReachable` / `previousReachable`). Continue is disabled while its target
  is locked.
- **Auto-advance mirrors app.js without editing it.** app.js calls
  `element.scrollIntoView(...)` at key transitions (after train →
  `step-diagnostics`; after loading an approved package → `step-predict`).
  `patchAutoAdvance` wraps each panel element's own `scrollIntoView` so it first
  calls `showStage(id)`, then the original — the correct stage is revealed on
  every existing transition with **zero app.js changes**. (Note: app.js does
  **not** `scrollIntoView` to `step-features` after load; it only unlocks it, so
  the user reaches stage 2 via the rail or the Load-data Continue button.)
- **Top-bar utilities delegate to existing controls.** Home → the top-nav Home
  link; Save project → `#downloadProjectBtn.click()`; Open project →
  `#projectFile.click()`; Privacy (`#privacyInfoBtn`) and Help (anchor) keep
  their inherited wiring. No wired node is moved.

## Workflow navigation state model (four states)

Each rail row is rendered by `syncSidebar` in **exactly one** of four states,
derived only from (a) which panel is currently shown and (b) the inherited lock
cascade. The state class lives on the **row** (`.stage-row` / `.substage-row`),
so the CSS selectors are `.stage-row.is-active`, `.stage-row.is-complete`,
`.stage-row.is-available`, `.stage-row.is-locked`:

| State | Meaning | Rendering | ARIA |
| --- | --- | --- | --- |
| **Active** | its panel is the one currently shown (exactly one) | accent row fill, bold text, primary-dark ringed marker | `aria-current="step"` on the shown panel's row |
| **Completed** | a genuine artifact for the stage exists **and** the cursor has moved past it | green (`--success`) marker + a `✓` after the label; not the accent fill | no `aria-current` |
| **Available** | reachable now (unlocked, not mode-hidden) but not active/completed | neutral grey (`--line`) marker, normal weight | `aria-disabled="false"` |
| **Locked** | not reachable (entry panel locked or mode-hidden) | reduced opacity, `not-allowed` cursor | `aria-disabled="true"` |

The model **never** equates *unlocked* / *visible* / *last-stage* / *visited*
with completed. Completion is tied to real lock-cascade milestones:

| Stage | Completed when (`artifactExists`) |
| --- | --- |
| 1 Load data | `step-features` unlocked (a dataset is loaded) |
| 2 Inputs and target | `step-model` unlocked (target + ≥1 feature) |
| 3 Prepare data | `step-model` unlocked (valid preprocessing config is a train prerequisite) |
| 4 Choose and train | `step-diagnostics` unlocked (a model has been trained) |
| 5 Evaluate results | `step-diagnostics` unlocked (evaluation exists) |
| 6 Predict and monitor | never auto-completed (terminal stage) |

A stage is only marked *complete* when its artifact exists **and** the active
stage is strictly later, so a downstream stage can never show completed ahead of
the cursor. For a **grouped** stage (4, 6) the parent row is active-styled while
either substage is shown, but `aria-current` sits on the current **substage**
row — so there is always exactly one `aria-current="step"`.

**Why Stage 6 previously mis-rendered.** `step-monitor` is *always present* (it
has no `.locked` class; it is gated by the `governance-only` mode class instead).
The former two-state `syncSidebar` marked a stage "available" if *any* mapped
panel was unlocked, so Stage 6 (`step-predict step-monitor`) counted `step-monitor`
as available on a fresh project and the old `.is-available` marker used the same
primary-dark fill as the active marker — making an empty Stage 6 read as
active/completed. The four-state model derives Stage 6's availability from its
**entry panel** (`step-predict`, the parent row's `href`), which is locked until a
model is fitted, so a fresh Stage 6 is correctly **Locked**.

**Consistency guard.** `checkConsistency()` (exposed on `window.EMSProjectShell`
and run at the end of every `syncAll`) asserts the top-bar status agrees with the
rail: exactly one `aria-current`; when no dataset is loaded there are zero
completed stages and Stage 6 is neither active nor complete; when no model is
trained Stage 5 is not complete. It only warns (never throws or mutates) and is
asserted directly by the tests.

**Saved-state restoration.** The nav is a pure function of lock state, so a
restored project renders correctly with no extra logic: `restoreProjectState` /
`loadProjectFile` (`js/app.js`) call `unlockPanel` / `unlockWorkflow`, whose class
changes the `MutationObserver` picks up → `syncAll`. A project restored **without**
its CSV unlocks `step-predict`/`step-diagnostics` while the raw-data stages stay
locked; because completion is milestone-based (not "visited"), those early stages
are shown *Available/Locked*, never falsely *Completed*. The app offers no "New
Project"/reset control; the only reset is a fresh session, which opens on Stage 1
as the sole active stage. The saved-project schema is unchanged.

## State dependencies / entry conditions per panel

Driven by `unlockWorkflow()` (`js/app.js`):

| Panel | Unlocked when |
| --- | --- |
| `step-upload` | always available |
| `step-features` | a dataset is loaded (`state.rows.length`) |
| `step-preprocess` | a target is chosen (`state.target`) |
| `step-model`, `step-split` | target **and** ≥1 feature selected (`state.selectedFeatures.size`) |
| `step-diagnostics` | a model has been trained/loaded with evaluation (post-train) |
| `step-predict` | a fitted artifact exists (`state.artifact`) |
| `step-monitor` | always present; hidden in prediction-only mode (`governance-only`) |

Mode classes `training-only` / `governance-only` (toggled via body classes in
`app.js`) continue to hide the correct stages/substages in prediction-only mode.
The six-stage sidebar keeps these classes on the corresponding items.
`js/project-shell.js` treats such panels as unreachable while `prediction-only`
is active (`isModeHidden`), so Back/Continue skip them and, if the current mode
change hides the shown panel, it falls back to the nearest reachable stage
(`onStateChange`).

## Stage guidance (collapsible)

Each panel's inherited What / Why / Look-for note is now a collapsed
`<details class="stage-guidance"><summary>Stage guidance</summary>…</details>`
disclosure below the stage title, so the explanatory text no longer permanently
dominates the workspace. The content is retained verbatim; it is simply
collapsed by default and expandable on demand (native, keyboard-accessible).

## Functions / contracts that MUST remain unchanged

- Ordered training pipeline `trainAndEvaluate` (`js/app.js`): split →
  preprocess fit → transform → target transform → tune → adapter `.fit` →
  smearing → intervals/inverse-transform → metrics. **Not reordered.**
- Layered model dispatch load order (`js/bootstrap.js`): `ml-core.js` →
  `advanced-core.js` → `modelling-core.js` → `platform-core.js` → … . **Unchanged.**
- Panel unlock functions `unlockPanel` / `unlockWorkflow` and every
  `getElementById('step-…')`/`$()` reference — all DOM IDs preserved.
- Model radio `name="modelType"` values (`linear, ridge, elasticnet, robust,
  tree, forest, gboost, knn, quantile, gp, ann`) — **unchanged**; default
  remains `linear`.
- ANN controls (`annHidden1/2/3`, activation, optimiser, learning rate, batch,
  epochs, dropout, L2, early-stopping patience/min-delta, uncertainty) rendered
  into `#modelParams` by `app.js` — preserved; only relocated under an
  accessible disclosure.
- Artifact/export/governance contract (`app.js` artifact object,
  `recordApprovalDecision`, `downloadApprovedPackage`) and saved-project format
  — **unchanged**.

## Limitations of this increment

- Presentation, layout and navigation only: no controls move between DOM panels,
  no calculation, adapter, default, schema, governance or export change. All
  gating is **read** from the classes `js/app.js` already sets; the shell never
  unlocks a panel.
- Preprocessing defaults are unchanged; a "recommended starting point" note is
  added but no automatic preprocessing decision is introduced.
- A dedicated ANN random seed is **not** added (recorded as future work; ANN
  still uses the shared split seed `#randomSeed`).
- Single-stage display sets `display:none` on inactive panels; `showStage` calls
  `Plotly.Plots.resize` on the revealed panel so charts drawn while hidden are
  sized correctly. Elements and event bindings are otherwise untouched.

*Engineering ML Studio is a redevelopment of **Local Regression Studio** by
**Yu Duan** (MIT licence). New contributions are © UKRI under the same MIT terms
and do not alter the original work's copyright or attribution.*
