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

## Phase 1 — User-friendly regression prototype

Make the existing regression capability genuinely approachable. Priorities:

- New **landing page**.
- Beginner **Explore mode**.
- Configurable **Project mode**.
- **Progressive disclosure** of advanced options.
- Built-in **engineering datasets**.
- **Simpler engineering language** throughout the interface.
- **Improved navigation**.
- **Clearer diagnostics**.
- **Responsive interface**.
- **Connection to Jupyter notebooks**.

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

## Under consideration (not current functionality)

- **Offline distribution model (`editions/` + OS launchers).** The original Local Regression Studio
  documentation describes strict-offline and prediction-only *editions* and per-OS launcher scripts
  for a packaged offline distribution. **These are inherited/historical and are not part of this
  repository or the current GitHub Pages deployment.** Whether Engineering ML Studio adopts, drops,
  or replaces this distribution model is an open future decision, not a present feature.
