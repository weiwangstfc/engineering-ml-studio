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
- **Connection to Jupyter notebooks**. — *not started; shown as "Learn with Python — Coming later".*

> The first Phase 1 increment (landing page + one guided Explore workflow) is a **prototype**. The
> remaining Phase 1 items above are still to come.

## Phase 2 — Guided learning pathway

- Step-by-step guidance that teaches regression concepts in engineering terms.
- "Learn the Code" pathway that reveals the equivalent Python for actions taken in the UI.
- In-context explanations of diagnostics and validation.

## Phase 3 — Small engineering project capability

- Robust support for realistic small engineering projects end-to-end.
- Reusable project templates and built-in engineering datasets expanded.
- Stronger validation, monitoring, and governance flows for real (non-critical) use.

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
