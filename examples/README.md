# Example datasets — provenance and reuse status

This directory holds the small example CSV files bundled with the application. This document records
what is **confirmed**, what is **reasonable inference**, and what is **unresolved** about their
provenance, so that reuse status is never overstated.

> ⚠️ **Provenance and reuse status require confirmation before any dataset here is promoted as an
> official training resource.** Nothing below establishes an open licence for these files.

## Summary of provenance (all three files)

- **[Confirmed]** All three CSVs were introduced in commit **`11ae72e`** ("app body").
- **[Confirmed]** Author of the introducing commit: **Yu Duan** — `MarLen <y.duan@imperial.ac.uk>`,
  dated **2026-07-16**.
- **[Confirmed]** They are covered by the repository's existing licence file
  [`../LICENSES.txt`](../LICENSES.txt) only insofar as they are part of the original work; there is
  **no separate dataset licence or attribution statement** in the repository.
- **[Reasonable inference]** The files appear **programmatically generated** for demonstration (see
  per-file evidence below).
- **[Unresolved]** No generator script, data dictionary, or source citation is present. Whether the
  data are fully synthetic, derived from real data, or transformed from an external source **cannot
  be confirmed** from the repository alone.

---

## `house_prices_sample.csv`

- **Location:** `examples/house_prices_sample.csv`
- **Rows:** 400 (plus header)
- **Columns:** `property_id`, `area_sq_m`, `bedrooms`, `age_years`, `neighbourhood`,
  `energy_rating`, `has_garden`, `price`
- **Categorical vocabularies:** `neighbourhood` ∈ {Central, East, North, South, West};
  `energy_rating` ∈ {A, B, C, D, E}; `has_garden` ∈ {yes, no}
- **Approximate purpose:** demonstration dataset for tabular regression with mixed
  numeric/categorical features predicting `price`.
- **Appears:** **generated (reasonable inference).**
- **Evidence:** sequential synthetic identifiers (`P0001`, `P0002`, …); small, tidy categorical
  vocabularies; filename contains `sample`; no missing values observed in spot checks.
- **Introducing commit / author:** `11ae72e` — Yu Duan (`MarLen <y.duan@imperial.ac.uk>`), 2026-07-16.
- **Licence / attribution:** none specific to the dataset; see `../LICENSES.txt`.
- **Unresolved concern:** cannot confirm whether values are purely synthetic or modelled on real
  market data.

## `nonlinear_regression_sample.csv`

- **Location:** `examples/nonlinear_regression_sample.csv`
- **Rows:** 360 (plus header)
- **Columns:** `time`, `x1`, `x2`, `source`, `regime`, `target`
- **Categorical vocabularies:** `source` ∈ {lab-A, lab-B, lab-C, lab-D}; `regime` ∈ {low, mid, high}
- **Approximate purpose:** demonstration dataset for nonlinear regression (training).
- **Appears:** **generated (reasonable inference).**
- **Evidence:** `x1` is a clean evenly-spaced sweep from `-3.0` to `3.0` (a linspace);
  `time` is a simple integer sequence; filename contains `sample`; tidy categorical vocabularies.
- **Introducing commit / author:** `11ae72e` — Yu Duan (`MarLen <y.duan@imperial.ac.uk>`), 2026-07-16.
- **Licence / attribution:** none specific to the dataset; see `../LICENSES.txt`.
- **Unresolved concern:** the exact generating function and any noise model are not documented.

## `nonlinear_prediction_sample.csv`

- **Location:** `examples/nonlinear_prediction_sample.csv`
- **Rows:** 180 (plus header)
- **Columns:** `time`, `x1`, `x2`, `source`, `regime`, `target`
- **Approximate purpose:** companion "unknown data" file for the prediction step of the nonlinear
  example (same schema as the regression sample).
- **Appears:** **generated (reasonable inference).**
- **Evidence:** same schema and structure as `nonlinear_regression_sample.csv`; evenly-spaced `x1`;
  filename contains `sample`.
- **Introducing commit / author:** `11ae72e` — Yu Duan (`MarLen <y.duan@imperial.ac.uk>`), 2026-07-16.
- **Licence / attribution:** none specific to the dataset; see `../LICENSES.txt`.
- **Unresolved concern:** relationship to the regression file (e.g. shared generator/seed) is not
  documented.

---

## Recommended follow-up (not done at Phase 0)

- Confirm with Yu Duan whether these datasets are fully synthetic and freely reusable.
- If confirmed synthetic, record the generator (or add one) and a clear reuse statement.
- If any dataset derives from real or external data, record the source and its licence before reuse.
