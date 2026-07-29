# Baseline test report — Engineering ML Studio

This report records the tooling, environment, and results for the **initial reproducible test
baseline**. It captures the state at the point the automated test foundation was established, before
any UX redesign or code refactoring.

## Scope and intent

- Establish a **reproducible way to run the current application locally** and **automated tests**
  that pin down its present behaviour.
- **No** change to user-facing functionality, application source, deployment, datasets, or the
  licence. The `package.json` and Playwright tooling are **development/test only** and are not part
  of the shipped browser application.

## Environment (as run)

| Component | Version | Role |
| --- | --- | --- |
| OS | Linux | Development host |
| Python | 3.12.3 | Static file server (`python3 -m http.server`) |
| Node.js | 18.19.1 | Test tooling runtime |
| npm | 9.2.0 | Dev dependency install |
| `@playwright/test` | 1.49.1 (pinned) | Browser test runner |
| Playwright CLI | 1.49.1 | Matches the pinned package |
| Chromium (Playwright build) | 1148 | Headless browser under test |

> **Node/Playwright pinning.** `@playwright/test` is pinned to **exactly `1.49.1`**. Later releases
> (1.55+) require Node ≥ 20; this environment runs Node 18, so the version is fixed to keep the
> baseline reproducible on Node 18. When the project moves to Node 20+, the pin can be lifted.

## How to reproduce

```bash
npm install
npx playwright install chromium
npm test
```

The Playwright config starts the Python static server automatically and drives the app in Chromium.
See [`DEVELOPMENT.md`](DEVELOPMENT.md) for details.

## Test suites

| File | Type | Count | What it covers |
| --- | --- | --- | --- |
| `tests/smoke.spec.js` | End-to-end (browser) | 9 | Page load, UI shell, dataset load, stage progression, training, metrics display, offline (no-backend) check, export control safety |
| `tests/unit.spec.js` | Unit (in-browser `MLCore`) | 8 | Deterministic PRNG, metrics, numeric parsing, summary stats, deterministic split, preprocessing, linear fit |

All unit tests run **inside the browser** via `page.evaluate`, because the runtime modules bind to
the global `window` and are not importable in Node. This avoids any refactoring of the inherited
source.

## Result

- **17 tests, all passing** (9 smoke + 8 unit), run under `?localOnly=1` (bundled libraries, no CDN).
- **No non-local network requests** were observed during the load-and-train workflow (asserted by
  the offline smoke test).
- The current heading text remains **"Local Regression Studio"** — unchanged, as required at this
  stage.

```
17 passed
```

## Known issues and notes

- **`npm audit` reports 2 high-severity advisories** in the Playwright dev dependency
  (browser-download SSL-verification advisory, `GHSA-7mvr-c777-76hp`). These are **development/test
  tooling only** and are **not shipped** in the browser application.
  - The suggested `npm audit fix --force` upgrades `@playwright/test` to `1.62.0`, which requires
    Node ≥ 20 and would break the Node 18 baseline. It is therefore **deliberately not applied**.
    Revisit when the project adopts Node 20+.
- **Coverage is intentionally limited to current behaviour** and focuses on the core path
  (load → select → train → metrics) plus `MLCore` numerics. The **predict** and **monitor** stages
  and the full **validation/approval/export** flow are **not yet covered**; see
  [`BASELINE_BEHAVIOUR.md`](BASELINE_BEHAVIOUR.md) for the confirmed/inferred/untested breakdown.

## Continuous integration

A GitHub Actions workflow (`.github/workflows/test.yml`) runs these tests on pushes to development
branches and on pull requests. It installs the dev dependencies and a pinned Chromium, then runs
`npm test`. It performs **no** deployment, uses **no** secrets, and contacts **no** external cloud
or AI services.
