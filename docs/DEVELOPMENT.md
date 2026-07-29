# Development and local-run guide — Engineering ML Studio

This guide describes how to run Engineering ML Studio locally and how to run the automated
baseline tests. It documents the **current** application exactly as inherited; it does **not**
introduce a build step, a framework, or any change to user-facing behaviour.

## What this application is (and is not)

- **A pure client-side static web application.** All HTML, CSS, and JavaScript are served as-is.
- **No build system, no bundler, no framework, no transpilation.** The browser loads the source
  files directly; there is nothing to "compile".
- **No runtime npm dependencies.** The `package.json` in this repository exists **only** for local
  development and automated testing (Playwright). The shipped application uses none of it.
- **No backend.** Data preparation, training, and prediction all run in the browser. No data is
  uploaded; there are no accounts or telemetry.

## Prerequisites

| Purpose | Requirement | Notes |
| --- | --- | --- |
| Run the app | A modern Chromium- or Firefox-based browser | The app uses Web Workers and dynamic script loading. |
| Serve the app | Python 3 (any 3.x) | Used only as a static file server. Verified with Python 3.12. |
| Run the tests (optional) | Node.js 18+ and npm | Verified with Node 18.19.1 / npm 9.2.0. Test tooling only. |

> **Why a server is required.** The app is loaded over `http://`, not `file://`. It creates a Web
> Worker (`new Worker('./js/lrs-worker.js')`) and loads its modules with dynamic `<script>`
> injection; browsers block both under the `file://` scheme. Opening `index.html` directly will not
> work — always serve it over HTTP.

## Run the application locally

From the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```
http://127.0.0.1:8000
```

To force fully offline mode (bundled libraries only, no CDN requests), append the query parameter:

```
http://127.0.0.1:8000/?localOnly=1
```

A shortcut is also provided:

```bash
npm run serve      # same as: python3 -m http.server 8000
```

**Stop the server** with `Ctrl+C` in the terminal running it.

Any static file server works (e.g. `npx http-server`, `php -S`); Python is used here only because
it is universally available and requires no installation.

## Local-only data handling (confirmed)

All processing happens in your browser. When the app is opened with `?localOnly=1`, it loads only
the libraries bundled under `vendor/` and makes no external network requests during the core
workflow. This is asserted directly by the automated tests (see below): a test fails if any
non-local request is observed while loading a dataset and training a model.

## Run the automated tests

The tests use [Playwright](https://playwright.dev/) to drive the real application in a headless
browser. They are the reproducible baseline for current behaviour.

First-time setup (installs the dev tooling and a pinned Chromium build):

```bash
npm install
npx playwright install chromium
```

Run all tests:

```bash
npm test
```

Useful variants:

```bash
npm run test:headed     # watch the browser drive the app
npm run test:report     # open the last HTML report (after a CI-style run)
```

The Playwright config (`playwright.config.js`) automatically starts the Python static server on
port 8000 before the tests and reuses an already-running one during local development. To use a
different port, set `EMS_TEST_PORT`.

Test layout:

- `tests/smoke.spec.js` — end-to-end smoke tests of the current workflow (load data → select
  target & features → train → view metrics), plus a check that no data leaves the browser.
- `tests/unit.spec.js` — focused unit tests of the inherited ML core (`window.MLCore`), run inside
  the browser via `page.evaluate` because the modules bind to the global `window` and are not
  importable in Node.

## Deployment (current)

The current deployment model is a **static website**. The repository is served via GitHub Pages
using branch serving (`CNAME` and `.nojekyll` are present). Deploying elsewhere only requires
serving the repository's static files from any web server or static host — there is no build
artifact to produce.

The **primary supported distribution is this browser-based static web app.** The original Local
Regression Studio documentation mentioned packaged "editions" and per-OS launcher scripts; those
are **not part of this repository** and are not a current feature (see
[`../ROADMAP.md`](../ROADMAP.md)).

## What not to change in this stage

Per the current project stage, this baseline work must **not**:

- redesign the interface or change user-facing functionality;
- add a frontend framework, bundler, or build step;
- add runtime dependencies or server-side compute;
- modify the example datasets or `LICENSES.txt`.

See [`BASELINE_BEHAVIOUR.md`](BASELINE_BEHAVIOUR.md) for the behaviour these tests protect.
