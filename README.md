# Engineering ML Studio

> **Provisional name.** Early redevelopment stage — expect significant change.

Engineering ML Studio is a **browser-first machine-learning platform for engineers**. It runs
entirely in the browser, keeps data on the user's own machine, and aims to make training,
exploring, and building small engineering ML projects approachable for people who are not
machine-learning specialists.

## Purpose

To give engineers a private, no-installation environment where they can load data, train and
compare models, understand the results, and — when they are ready — grow from no-code use
toward writing their own Python. The current focus is **regression**.

## Intended uses

- Learning and **exploration** of regression on engineering data.
- **Small engineering ML projects** (data preparation → training → validation → prediction → monitoring).
- Teaching the underlying concepts and, later, the underlying code.

## Current technical model (confirmed from the source project)

- **Browser-local calculation.** All model training and prediction run client-side in the browser;
  there is no backend, no account, and no data upload endpoint.
- **Static web application.** Plain HTML/CSS/JavaScript, no build step, deployed as static files.
- **Regression-only** at present, across the model families inherited from Local Regression Studio.

See [`docs/ARCHITECTURE_AUDIT.md`](docs/ARCHITECTURE_AUDIT.md) for the confirmed technical audit.

## Attribution and origin

Engineering ML Studio is an **independently maintained derivative**. It was **initially derived from
Local Regression Studio**, developed by **Yu Duan**.

- Original project: **Local Regression Studio**
- Original developer: **Yu Duan**
- Original source repository: <https://github.com/MartianonEarth/localregressorstudio>
- Original licence: **MIT** (see [`LICENSES.txt`](LICENSES.txt))

Yu Duan and any previous contributors retain full credit for the original work. The original
copyright and licence notices are preserved unchanged. See [`NOTICE.md`](NOTICE.md) for the full
attribution statement.

Engineering ML Studio is **led and maintained by Wei Wang at the Science and Technology Facilities
Council (STFC)**. Copyright in **new contributions** developed for Engineering ML Studio under this
STFC project is held by **UK Research and Innovation (UKRI)**, unless otherwise stated. This does
**not** transfer or replace the copyright of the original authors. Future development, releases, and
roadmap for Engineering ML Studio are decided independently (see [`GOVERNANCE.md`](GOVERNANCE.md)).

## Running locally

This is a static site and must be served over HTTP (not opened as a `file://`). From the repository
root:

```bash
python3 -m http.server 8000
# then open http://127.0.0.1:8000
```

Full instructions, browser requirements, and how to run the automated tests are in
[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## Status

**Independent project foundation, with a reproducible baseline.** The inherited application is
unchanged in behaviour; this stage added a documented local-run procedure and an automated **test
foundation** (dev-only) that pins down current behaviour before any UX redesign. No user-facing
functionality, deployment configuration, datasets, or the licence have been changed. See
[`ROADMAP.md`](ROADMAP.md), [`docs/BASELINE_BEHAVIOUR.md`](docs/BASELINE_BEHAVIOUR.md), and
[`docs/BASELINE_TEST_REPORT.md`](docs/BASELINE_TEST_REPORT.md).

## ⚠️ Important safety notice

Engineering ML Studio is **not a validated safety-critical engineering tool**. It has not been
qualified, certified, or independently verified for use in safety-critical, regulatory, or
life-affecting engineering decisions. Results are for exploration, learning, and non-critical work.
Always independently verify any output before relying on it.

## Documentation

- [`NOTICE.md`](NOTICE.md) — attribution and origin
- [`GOVERNANCE.md`](GOVERNANCE.md) — how the project is run
- [`ROADMAP.md`](ROADMAP.md) — planned phases
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to contribute
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — local run and test instructions
- [`docs/BASELINE_BEHAVIOUR.md`](docs/BASELINE_BEHAVIOUR.md) — current behaviour the tests protect
- [`docs/BASELINE_TEST_REPORT.md`](docs/BASELINE_TEST_REPORT.md) — baseline test run and tooling
- [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md) — product vision
- [`docs/ARCHITECTURE_AUDIT.md`](docs/ARCHITECTURE_AUDIT.md) — confirmed technical audit
- [`docs/UX_REDESIGN_PLAN.md`](docs/UX_REDESIGN_PLAN.md) — proposed UX redesign
