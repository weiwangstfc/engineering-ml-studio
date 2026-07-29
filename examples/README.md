# Example datasets — provenance and reuse status

This directory holds the small example CSV files bundled with the application. This document records
what is **confirmed** and what is **reasonable inference** about their provenance, so that their
status is never overstated.

> ✅ **Reuse status confirmed.** Yu Duan has confirmed that these bundled example datasets may be
> reused under the **MIT licence** (see [`../LICENSES.txt`](../LICENSES.txt)). They were introduced
> by Yu Duan as part of the original Local Regression Studio work.

## Summary of provenance (all three files)

- **[Confirmed]** All three CSVs were introduced in commit **`11ae72e`** ("app body").
- **[Confirmed]** Author of the introducing commit: **Yu Duan** — `MarLen <y.duan@imperial.ac.uk>`,
  dated **2026-07-16**.
- **[Confirmed]** **Reuse is permitted under the MIT licence**, as confirmed by Yu Duan. The files
  are covered by the repository's existing licence file [`../LICENSES.txt`](../LICENSES.txt) as part
  of the original work; there is no separate dataset licence file, and none is required.
- **[Reasonable inference]** The files appear **programmatically generated / synthetic** for
  demonstration (see per-file evidence below). No claim is made that they originate from physical
  experiments or real-world measurements.
- **[Not documented]** No generator script or data dictionary is included, so the exact generating
  functions are not recorded here.

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
- **Licence / attribution:** reusable under the MIT licence (confirmed by Yu Duan); see
  `../LICENSES.txt`.
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
- **Licence / attribution:** reusable under the MIT licence (confirmed by Yu Duan); see
  `../LICENSES.txt`.
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
- **Licence / attribution:** reusable under the MIT licence (confirmed by Yu Duan); see
  `../LICENSES.txt`.
- **Unresolved concern:** relationship to the regression file (e.g. shared generator/seed) is not
  documented.

---

## Recommended follow-up (optional)

- Reuse permission is **confirmed** (MIT, per Yu Duan); no further licensing action is required to
  use these files as examples.
- Optionally, record or add a generator script and a short data dictionary for each file, so the
  synthetic construction is reproducible and documented.
- Continue to avoid describing these datasets as derived from real physical or experimental data
  unless such an origin is ever positively established.
