# Product Vision — Engineering ML Studio

> Provisional vision for early redevelopment. Proposals below are direction, not committed features.

## Vision statement

A browser-first, privacy-conscious machine-learning environment that lets engineers go from a CSV
to a trustworthy, well-understood regression model — and, when they are ready, from no-code use to
writing their own Python — without installing anything or sending data anywhere.

## Target users

- **Engineers who are new to ML.** Domain experts (mechanical, civil, process, materials, etc.) who
  understand their data but not machine learning.
- **Engineers running small ML projects.** People who need a repeatable, documented workflow for
  non-critical modelling tasks.
- **Learners and educators.** Those who want to understand both the concepts and, later, the code.
- **Advanced users** who want validation, governance, and an escape hatch to Python/notebooks.

## User needs

- Get a useful model without ML jargon or setup.
- Understand *why* a model behaves as it does (clear diagnostics in engineering language).
- Trust results enough for non-critical decisions, and know the limits.
- Keep sensitive data local.
- Grow from guided clicks toward real code.

## Proposed modes and pathways

### Explore mode (beginner)

Minimal choices, sensible defaults, built-in engineering datasets, and heavy guidance. The goal is
a correct first result fast, with plain-language explanation.

### Project mode (configurable)

The fuller workflow (data prep → features → preprocessing → model & tuning → train → validate →
predict → monitor) with progressive disclosure of advanced options for a real small project.

### Learn the Code pathway

Reveals the equivalent Python/notebook for what the user did in the UI, so no-code use becomes a
bridge to coding rather than a dead end.

### Advanced Validation and Governance pathway

The inherited validation, approval, monitoring, and governance capabilities, surfaced for users who
need documented, reviewable workflows — kept out of the way of beginners.

## Design principles

- **Browser-first and privacy-conscious.** Local computation, no telemetry, no uploads.
- **Progressive disclosure.** Complexity appears only when asked for.
- **Engineering-focused.** Language, examples, and datasets speak to engineers.
- **A path to code.** Deliberate transition from no-code to Python.

## Engineering-focused datasets

Bundle a small set of representative engineering datasets so users can learn and evaluate without
supplying their own data. *(Provenance and reuse status of any bundled dataset must be documented and
confirmed before it is promoted as an official training resource — see
[`../examples/README.md`](../examples/README.md).)*

## Key differentiators

- Runs entirely in the browser with no install and no data leaving the machine.
- Built for engineers new to ML, not for ML specialists.
- Explicit no-code → code learning path.
- Inherited, mature validation/governance capability aimed at responsible non-critical use.

## First-release success criteria (proposed)

- A new user can load a built-in dataset and get an explained regression result in minutes without
  reading a manual.
- Advanced options are reachable but not in the way of beginners.
- Diagnostics are understandable to a non-specialist engineer.
- At least one clear "here is the equivalent Python" moment exists.
- Attribution, licence, and privacy posture are intact and visible.

## Out of scope for the first release

- Adding many new algorithms (the inherited regression families are enough).
- Classification, time-series, or other non-regression modules.
- Any backend, cloud storage, accounts, or telemetry.
- Safety-critical / regulatory qualification.
- Large-scale or distributed training.
