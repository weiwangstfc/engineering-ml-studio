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

Engineering ML Studio is currently **led and maintained by Wei Wang at the Science and Technology
Facilities Council (STFC)**. This reflects current project leadership only; it does not transfer or
replace the copyright of the original authors. Future development, releases, and roadmap for
Engineering ML Studio are decided independently (see [`GOVERNANCE.md`](GOVERNANCE.md)).

## Status

**Phase 0 — independent project foundation.** No functional application code, dependencies,
deployment configuration, tests, datasets, or the licence have been changed at this stage; only
project-foundation documentation has been added. See [`ROADMAP.md`](ROADMAP.md).

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
- [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md) — product vision
- [`docs/ARCHITECTURE_AUDIT.md`](docs/ARCHITECTURE_AUDIT.md) — confirmed technical audit
- [`docs/UX_REDESIGN_PLAN.md`](docs/UX_REDESIGN_PLAN.md) — proposed UX redesign
