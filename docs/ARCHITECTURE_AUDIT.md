# Architecture Audit — Engineering ML Studio

Recorded at **Phase 0**, based on the source repository
`git@github.com:MartianonEarth/localregressorstudio.git` (HEAD `8405d0b`, 8 commits).

Findings are marked **[Confirmed]** (verified by inspecting the files) or **[Assumption]**
(inference not fully verified). No functional code was changed to produce this audit.

## Current architecture

- **[Confirmed]** Pure **client-side static web application**. No backend, no accounts, no
  data-upload endpoint.
- **[Confirmed]** **No build system**: no `package.json`, `node_modules`, bundler
  (webpack/vite/rollup), or TypeScript config. Plain browser JavaScript, HTML, CSS.
- **[Confirmed]** Single-page UI in `index.html` (~522 lines) styled by `css/app.css` (~352 lines).
  No SPA framework or client-side router.
- **[Confirmed]** **Module pattern:** IIFE + global namespaces (`window.X` / `global.X`). Only
  `build-config.js`, `i18n.js`, and `bootstrap.js` are `<script>`-tagged in `index.html`;
  `bootstrap.js` then sequentially loads the remaining modules via `loadScript(...)`.

## Main files and modules

| File | Global | Role |
|---|---|---|
| `js/app.js` (~2238 lines) | `LocalRegressionApp` | Orchestrator: DOM wiring, all 8 steps, exports. **Coupling hotspot.** |
| `js/ml-core.js` (~658) | `MLCore` | Preprocessing, linear/tree/forest, predict, intervals, metrics, cross-validation |
| `js/advanced-core.js` (~508) | `AdvancedML` | Gaussian process, feed-forward ANN (depends on `MLCore`) |
| `js/modelling-core.js` (~427) | `ExpandedModelling` | Elastic-net, robust/Huber, gradient boosting, kNN, quantile |
| `js/platform-core.js` (~425) | `LRSPlatform` | Platform/runtime services |
| `js/comparison-core.js` (~167) | `LRSComparison` | Model comparison batches |
| `js/validation-core.js` (~185) | `LRSValidation` | Validation / applicability metrics |
| `js/governance-core.js` (~186) | `LRSGovernance` | Lifecycle transitions, monitoring analysis, revalidation |
| `js/approval-core.js` (~312) | `LRSApproval` | Approved-package workflow |
| `js/security-core.js` (~143) | `LRSSecurity` | Signature/verification, sanitisation |
| `js/recovery-core.js` (~12) | `LRSRecovery` | Local recovery snapshots |
| `js/worker-client.js` (~79) + `js/lrs-worker.js` (~33) | `LRSWorkerClient` | Web-worker plumbing |
| `js/i18n.js` (~939) | — | Internationalisation strings |
| `js/build-config.js` (~9) | `LRS_BUILD_CONFIG` | Frozen build/runtime config |
| `vendor/plotly-3.3.1.min.js` (~3881) | `Plotly` | Charting (MIT, bundled) |
| `vendor/csv-parser-lite.js` (~88) | `CSVLite` | Local CSV parser/fallback |

- **[Confirmed]** **Eight-stage workflow** in `index.html`: (1) Load data, (2) Features & target
  transform, (3) Preprocessing, (4) Model & tuning, (5) Split & train, (6) Review/validate/approve/
  export, (7) Predict, (8) Monitor.
- **[Confirmed]** **11 regression model families** implemented across `ml-core`, `advanced-core`,
  and `modelling-core`.

## Build system

- **[Confirmed]** None. Files are served as-is. Dependencies are either **bundled** in `vendor/` or,
  in **hybrid** network mode, fetched from **pinned CDN URLs with local fallback** (see
  `bootstrap.js`, `build-config.js`).

## Browser-side ML implementation

- **[Confirmed]** All training and prediction run **in the browser**. Core algorithms live in
  `ml-core.js` (linear, tree, forest, metrics, CV, prediction intervals), `advanced-core.js`
  (Gaussian process, ANN), and `modelling-core.js` (elastic-net, Huber, gradient boosting, kNN,
  quantile).
- **[Confirmed]** Web-worker plumbing exists (`worker-client.js`, `lrs-worker.js`), but the source
  README states full model training still runs on the **main thread** in v1.0.

## Deployment

- **[Confirmed]** **GitHub Pages via branch serving**: `CNAME`
  (`localregressionstudio.optibayeslab.com`) and `.nojekyll` are present.
- **[Confirmed]** **No `.github/workflows`** — no CI/CD or Actions-based deploy.
- **[Confirmed]** The README references `editions/prediction-only`, `editions/strict-offline`, and OS
  launcher scripts that are **not present** in the tree (only the Full-Studio/Pages build; 40 tracked
  files). These are documented but absent here.

## Tests

- **[Confirmed]** **No tests and no test framework** are tracked. No CI.

## Reusable components

- **[Confirmed]** The compute cores (`ml-core`, `advanced-core`, `modelling-core`,
  `validation-core`, `governance-core`, `approval-core`, `security-core`) have narrow global
  namespaces and are the strongest reuse candidates for the redevelopment.
- **[Confirmed]** Example datasets, docs, and privacy/security/SBOM artefacts are reusable as-is.

## Tightly coupled areas

- **[Confirmed]** `app.js` (~2238 lines) directly references ~10 module globals and hard-wires all
  DOM and step logic — the principal obstacle to a UI redesign.
- **[Confirmed]** Module load order is **manual and sequential** in `bootstrap.js`; there is no
  dependency graph or module system.

## Technical debt

- **[Confirmed]** No tests, no CI → refactoring risk.
- **[Confirmed]** Monolithic orchestrator (`app.js`) mixes UI and control flow.
- **[Confirmed]** Global-namespace modules with implicit load-order dependencies.
- **[Confirmed]** Main-thread training can make low-powered devices unresponsive (per README).

## Security and privacy

- **[Confirmed]** Browser-local computation; no analytics, cloud training, remote storage, or
  CSV-upload endpoint. Hybrid mode makes pinned CDN requests only when deliberately enabled;
  strict-offline (documented, not in this tree) forbids them via CSP.
- **[Confirmed]** Supporting posture documented in `PRIVACY.md`, `SECURITY.md`, `THREAT_MODEL.md`,
  `SBOM.cdx.json`. `security-core.js` handles sanitisation and optional signature verification.

## Licence and provenance

- **[Confirmed]** Licence lives in **`LICENSES.txt`** — **not** a file named `LICENSE`, and **not
  verbatim MIT** (MIT-*style* wording: "subject to inclusion of this notice", abbreviated warranty
  disclaimer). Copyright "(c) 2026 Yu Duan"; maintained by OPTIBAYES LAB LTD (company no. 16391767).
- **[Confirmed]** Third-party: Plotly.js 3.3.1 (MIT, bundled, header retained), Papa Parse 5.5.4
  (MIT, CDN hybrid), CSV Lite (own). Mirrored in `THIRD_PARTY_NOTICES.md` and `SBOM.cdx.json`.
- **[Confirmed]** Git authorship: `MarLen <y.duan@imperial.ac.uk>` and
  `Yu-optibayeslab <yu@optibayeslab.com>` — both Yu Duan.
- **[Confirmed]** No fonts or images are bundled (CSS-only styling).
- **[Confirmed]** The three example CSVs (`examples/*.csv`) were introduced by Yu Duan
  (`MarLen <y.duan@imperial.ac.uk>`) in commit `11ae72e` ("app body"). Their provenance is now
  documented in [`examples/README.md`](../examples/README.md).
- **[Reasonable inference]** The example CSVs appear programmatically generated (e.g. `x1` is a clean
  linspace across [-3, 3]; house-price rows use sequential `P0001…` identifiers), but **no generator
  script or explicit statement is present**, so reuse status is unconfirmed. See `examples/README.md`.

## Unresolved questions

1. ~~Should a conventional, verbatim `LICENSE` file be added alongside `LICENSES.txt`?~~
   **Decided (Phase 0):** keep `LICENSES.txt` exactly as-is; do **not** add or rewrite a `LICENSE`.
2. ~~Provenance and licence of the bundled example datasets.~~ **Resolved.** Documented in
   `examples/README.md`; Yu Duan has confirmed the datasets are reusable under the **MIT licence**.
3. ~~Formal institutional IP wording.~~ **Resolved.** Copyright in new Engineering ML Studio
   contributions under this STFC project is held by **UKRI**, without altering the original work's
   copyright or attribution; the project is led and maintained by Wei Wang at STFC (see `NOTICE.md`).
4. ~~`editions/` and launcher scripts — decision deferred.~~ **Resolved.** The primary supported mode
   is the browser-based static web app; packaged `editions/` and OS launchers are **not** being
   recreated (see `../ROADMAP.md`). Remaining references exist only in inherited files (see below).
5. Historical commit message `9f2effa` references the `Yu-optibayeslab` repo; history is preserved
   unchanged, so this remains as a factual artefact of the source history.

### Note on `editions/` and launchers (confirmed)

- **[Confirmed]** No `editions/` directory or launcher script exists in this repository, and none is
  referenced by application JavaScript. The runtime notion of an "edition" is a single build-config
  value (`edition:'full-studio'` in `js/build-config.js`), not a directory.
- **[Confirmed]** Deployment is GitHub Pages branch serving (`CNAME`, `.nojekyll`); it does not use
  launchers. Therefore nothing functional depends on editions/launchers. (An automated **test
  foundation** was added later — Playwright smoke + ML-core unit tests, dev-only — see
  `DEVELOPMENT.md`; it does not depend on editions/launchers either.)
- **[Confirmed]** Remaining textual references are in inherited files only: `index.html` (UI text),
  and the original docs `PRIVACY.md`, `SECURITY.md`, `THREAT_MODEL.md`, `docs/html/*`. These are the
  original author's materials describing the original distribution and are left unmodified at Phase 0.
