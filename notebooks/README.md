# Learn the Code — teaching notebooks

This folder holds the **"Learn the Code"** notebooks for Engineering ML Studio. They are the next
rung after the browser **Explore** mode: you do the activity with no code in the browser, then
reproduce the *same* workflow in Python here.

> ⚠️ **Training demonstration, not a design tool.** These notebooks use a **synthetic**, documented
> dataset and are for **learning on small, non-critical problems**. They are **not** validated,
> safety-grade, or design-quality tools, and must not be used for real engineering design decisions.

## Notebooks

| Notebook | What it covers | Companion Explore activity |
| --- | --- | --- |
| [`pipe_pressure_drop.ipynb`](pipe_pressure_drop.ipynb) | Predicting **pressure drop in a pipe** from geometry and flow conditions, with Linear Regression, a Decision Tree and a Random Forest; metrics (RMSE, R²) in kPa; an actual-vs-predicted plot; an engineering interpretation (trend checks, plausibility, extrapolation); and an **optional advanced Section 16** adding a `scikit-learn` neural network (`MLPRegressor`). | Explore → *Predict pressure drop in a pipe* |

The notebook mirrors the browser activity one-to-one: the **same dataset**
(`../examples/pipe_pressure_drop_sample.csv`), the **same five inputs and target**, the **same fixed
random seed (42)**, and the **same three core models**. Exact numbers differ slightly from the browser
(different model implementations and a different random split) — the *story* is the same. See
[`../docs/PHASE2_LEARN_THE_CODE_PLAN.md`](../docs/PHASE2_LEARN_THE_CODE_PLAN.md) §2a for the honest
comparison.

The final **optional, advanced** section adds a neural network (`MLPRegressor` in a `StandardScaler`
pipeline, `(32, 16)`, fixed seed, early stopping). It is deliberately placed last and framed
honestly: a more complex model is **not** automatically more accurate, and here the network does
**not** beat the Random Forest. See
[`../docs/NEURAL_NETWORK_DEMO.md`](../docs/NEURAL_NETWORK_DEMO.md).

## How to open it

### Option A — Google Colab (recommended, nothing to install)

One click, no local setup; `pandas`, `scikit-learn` and `matplotlib` are already installed.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/weiwangstfc/engineering-ml-studio/blob/main/notebooks/pipe_pressure_drop.ipynb)

In Colab the notebook cannot see the repository's local files, so it automatically falls back to the
**committed copy of the dataset on GitHub** (a single, documented, versioned URL — no arbitrary
external data). You need a Google account and an internet connection.

### Option B — Local Jupyter (offline, uses this checkout)

```bash
# from the repository root
python -m pip install -r notebooks/requirements.txt
python -m pip install jupyterlab      # if you don't already have Jupyter
jupyter lab notebooks/pipe_pressure_drop.ipynb
```

Run the cells top to bottom. When run locally the notebook loads the dataset directly from
`../examples/pipe_pressure_drop_sample.csv`, so **no internet is needed**.

### Option C — VS Code

Open the `.ipynb` with the Python + Jupyter extensions installed, select a kernel with the packages
from `requirements.txt`, and run the cells. (Secondary path; A and B are the supported routes.)

## What you need

- Python 3.9+ and the packages in [`requirements.txt`](requirements.txt) (Colab already has them).
- No GPU, no accounts (except a Google account for Colab), no cloud services.

## Reproducibility and testing

- The notebook uses a **fixed seed (42)** throughout, so re-running gives the same split and results.
- It is **committed without stored outputs**, so the version history stays clean and every run is
  fresh.
- Automated tests execute it end-to-end and check its structure — see
  [`../tests/test_notebook_execution.py`](../tests/test_notebook_execution.py) and
  [`../tests/test_notebook_structure.py`](../tests/test_notebook_structure.py). These run in CI.

## Attribution and licence

Engineering ML Studio is a redevelopment of **Local Regression Studio** by **Yu Duan** (MIT
licence). New contributions in this project are copyright **UKRI**, released under the same MIT terms
(see [`../LICENSES.txt`](../LICENSES.txt)), without altering the original work's copyright or
attribution. The pressure-drop dataset used here is a synthetic teaching demonstration; see
[`../examples/README.md`](../examples/README.md).
