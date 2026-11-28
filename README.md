# Engineering ML Studio

**Machine learning for engineers, in your browser.** Learn how regression models work with guided
engineering examples, then apply them to your own data — with nothing to install, and without your data
ever leaving your computer.

**Try it: <https://weiwangstfc.github.io/engineering-ml-studio/>** · Version **2026.11.0** ·
[What's new](CHANGELOG.md)

## What you can do

- **Explore** — six guided lessons, from a first model to real measured data: pipe pressure drop, steel
  yield strength, convective cooling, orifice flow, a deliberately hard nonlinear problem, and critical heat
  flux measured in over fifty experiments. Each lesson explains the problem, trains and compares models, and
  interprets the result in engineering terms. No data or code needed.
- **Learn** — the same work in Python notebooks (Google Colab or local Jupyter), how to prepare your own
  data, and what to use for problems beyond this tool.
- **Project** — model your own CSV in six guided stages: load and check the data, choose inputs and the
  quantity to predict, prepare the data, choose and train models, evaluate the results, then predict and
  monitor. Twelve regression models, from linear regression and polynomial response surfaces to random
  forests, Gaussian processes and neural networks, with prediction intervals, model comparison, a methods
  summary for reports, and optional approval tools for operational use.

## Is it right for my problem?

It fits when you want to predict **one number** — a pressure drop, a strength, a temperature — from a
**table of measurements** (one row per test, specimen or simulation run), with roughly 30 to 25,000 rows.
It is not designed for predicting categories, forecasting over time, images or signals, or whole fields;
the in-app *Learn → Beyond this tool* page suggests what to use instead.

## Your data stays on your computer

All calculations run in your browser. There is no server, no account, no analytics and no upload. Add
`?localOnly=1` to the address to run without contacting any other site — useful in classrooms with
unreliable internet.

## Getting started

Open the [online version](https://weiwangstfc.github.io/engineering-ml-studio/), or run it locally. It is
a static site, so serve it over HTTP from the repository root:

```bash
python3 -m http.server 8000
# then open http://127.0.0.1:8000/?localOnly=1
```

The **Help** button in the app opens the [user guide](docs/html/user-guide.html) at the right place, and
**Glossary** explains the terms used.

## Important: not for safety-critical use

Engineering ML Studio is not a validated, certified or independently verified engineering tool. Use it for
learning, exploration and non-critical work, and always verify results independently before relying on
them.

## Documentation

**For users**
- [User guide](docs/html/user-guide.html) — also available from **Help** in the app
- [Example datasets](examples/README.md) — what each dataset is, where it comes from and how it was made
- [Python notebooks](notebooks/README.md)
- [Changelog](CHANGELOG.md)

**For contributors**
- [Work plan](docs/WORKPLAN.md) — current status, open decisions and the prioritised task list; start here
- [Development](docs/DEVELOPMENT.md) — running locally, tests, asset versions and releasing
- [Contributing](CONTRIBUTING.md) · [Governance](GOVERNANCE.md) · [Security](SECURITY.md) · [Roadmap](ROADMAP.md)
- [Course Materials and Repository Boundary](docs/COURSE_MATERIALS.md) — what belongs in this repository
- Design records: [Explore mode](docs/EXPLORE_MODE.md),
  [Project-mode stages and guidance](docs/PROJECT_MODE_STAGE_MAPPING.md),
  [worker-training proposal](docs/WORKER_TRAINING_PROPOSAL.md), and the earlier phase plans in [`docs/`](docs/)

Every push to `main` publishes the site to GitHub Pages ([`pages.yml`](.github/workflows/pages.yml)); there
is no build step.

## Licence

Engineering ML Studio is released under the **Apache License, Version 2.0** ([`LICENSE`](LICENSE)). You may
use, modify and redistribute it, including commercially, provided you keep the licence, the copyright
notices and the [`NOTICE`](NOTICE) file, and state what you changed.

The licence does not cover:

- **the name and logo** — "Engineering ML Studio" identifies the project and its official training and
  certification (Apache-2.0 section 6); forks are welcome under a different name;
- **training course materials** — curricula, exercises, solutions and assessments for courses run on this
  platform are held separately and are not part of this repository.

## Acknowledgements

Engineering ML Studio is led and maintained by Wei Wang at the Science and Technology Facilities Council
(STFC). Copyright in Engineering ML Studio's own contributions is held by UK Research and Innovation (UKRI).

Its modelling engine builds on Local Regression Studio by Yu Duan, used under the MIT licence; those
notices are kept in [`LICENSES.txt`](LICENSES.txt) and [`NOTICE.md`](NOTICE.md). The critical heat flux data
come from the U.S. Nuclear Regulatory Commission CHF database (CC0-1.0), as distributed with the AI4NTH
Summer School.
