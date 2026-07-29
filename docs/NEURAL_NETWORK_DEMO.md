# Neural network in Engineering ML Studio

This note documents how the **neural network** is offered across the platform: as an **advanced,
flexible option — never the beginner default**. It covers the browser implementation, the safe
Explore presets, scaling, training settings, reproducibility, performance, limitations, the optional
notebook section, and — honestly — how the browser and notebook results differ.

> **Framing.** A more complex model is **not** automatically more accurate or more suitable for
> engineering use. The neural network is presented as one flexible approach among several, with the
> same cautions (synthetic data, no extrapolation, physical validation required) that apply to every
> model in this tool.

## Where the neural network appears

| Surface | How it appears | Configurability |
| --- | --- | --- |
| **Explore** (beginner) | The 4th approach, *"Try an advanced flexible model"* (algorithm name shown as secondary detail). Not the default; the simple trend stays default. | Two size presets + a training-length choice; learning rate under an "Advanced setting". Everything else is a safe, documented default. |
| **Project** (configurable) | Already present as *"Artificial neural-network regression"* in the inherited model list. | Full configuration (layers, neurons, activation, optimiser, learning rate, regularisation, early stopping, seed). **Unchanged** by this work. |
| **Learn** (notebook) | Optional Section 16, *"Optional advanced extension — a neural network"*. | `scikit-learn` `MLPRegressor` in a scaling pipeline, `(32, 16)`, fixed seed. |

## Browser implementation (no new dependency)

The browser neural network is the **inherited** implementation in
[`../js/advanced-core.js`](../js/advanced-core.js) — a deterministic, dense feed-forward network
(Adam/SGD optimisers, ReLU/tanh/sigmoid activations, L2 and dropout regularisation, mini-batch
training, early stopping with best-validation-weight restore, seeded He/Xavier initialisation via
`mulberry32`). It is reached through the same **model adapter** every other Explore model uses
(`LRSPlatform.getModelAdapter('ann')` → `MLCore.trainModel('ann', …)` / `MLCore.predict(…)` in
[`../js/platform-core.js`](../js/platform-core.js)).

Consequences of reusing the inherited network:

- **No new runtime dependency.** No TensorFlow.js, no Pyodide, no `scikit-learn` in the browser, no
  server-side compute, no external inference API. The app stays a static, client-side site and all
  computation runs locally (asserted by the `?localOnly=1` tests).
- **No duplicated model code.** Explore adds only a thin preset/UI layer in
  [`../js/explore.js`](../js/explore.js) on top of the existing network.

## Explore presets (what a beginner can change)

Explore exposes **safe presets**, not free architecture editing. All values live as documented
constants in `js/explore.js`.

**Network size** (`ANN_ARCH_PRESETS`):

| Preset | Hidden layers | Conceptually | Default |
| --- | --- | --- | --- |
| Small network | one layer, 16 neurons | `(16,)` | ✅ default |
| Medium network | two layers, 32 → 16 neurons | `(32, 16)` | |

**Training length** (`ANN_TRAINING_PRESETS`) — maps to a documented maximum number of epochs (early
stopping may finish sooner):

| Choice | Max epochs |
| --- | --- |
| Quick | 150 |
| Standard (default) | 300 |
| Longer | 600 |

**Advanced setting (collapsed):** learning rate, default **0.01**, clamped to `0.0001 … 0.5`.

**Fixed safe defaults** (`ANN_SAFE_DEFAULTS`), not surfaced in Explore: `activation: relu`,
`optimizer: adam`, `batchSize: 32`, `l2: 0.0005`, `dropout: 0`, early stopping on
(`patience: 25`, `minDelta: 1e-5`), `ensembleSize: 1`, seed **42**.

> The learning rate default (0.01) is higher than Project mode's default (0.001) because Explore caps
> the number of epochs for responsiveness; a slightly larger step converges within that budget.

## Scaling (handled automatically)

Explore standardises inputs (`numericScaling: 'standard'`) before training and the network also
standardises the **target** internally (`yMean`/`ySd`), predicting back into the original units. So a
beginner never has to configure scaling: **errors and axes stay in kPa**. Explore shows a short
plain-language note explaining that scaling happens automatically. This mirrors the notebook, which
puts a `StandardScaler` in the same pipeline as the `MLPRegressor`.

Explore additionally feeds the network its **15 % validation split** (previously unused) so early
stopping is honest; other models ignore these fields, so it stays a contained, model-specific
addition.

## Training feedback

When a neural network is trained, Explore reports (from the model's recorded history, never
fabricated): whether training **converged / stopped early**, the epoch it settled at, and the
approximate **training time**. A collapsed **advanced diagnostic** shows the **training loss curve**
(training and validation loss per epoch). The **main** result is unchanged: train RMSE (kPa), test
RMSE (kPa), test R², and the actual-vs-predicted plot. Repeated training clicks are prevented while a
run is in progress.

## Reproducibility

Both surfaces are **deterministic** with the fixed seed (42): re-running produces the same numbers.
This is asserted by unit tests (identical predictions for identical seed + inputs) and by an Explore
integration test (same RMSE/R² on a fresh reload). Run-to-run variation is therefore **zero** by
construction.

## Performance (browser, measured)

Measured locally under `?localOnly=1` on the 500-row pipe dataset (Standard length, early stopping
active), seed 42:

| Preset | Max epochs | Ran epochs | Test R² | Test RMSE (kPa) | Approx. training time |
| --- | --- | --- | --- | --- | --- |
| Small `(16,)` | 300 | ≈224 | 0.986 | 4.78 | ≈1.0–1.4 s |
| Medium `(32, 16)` | 300 | ≈181 | 0.984 | 5.05 | ≈1.8–2.3 s |

Training yields to the UI thread periodically, so the interface stays responsive; no Web Worker was
required for this dataset size at these presets. These times are indicative and will vary by machine
and browser.

**Multi-seed stability** (seeds 1, 7, 21, 42, 84, replicating the exact Explore pipeline in-browser):

| Preset | Test R² mean | min | max | std |
| --- | --- | --- | --- | --- |
| Small `(16,)` | 0.989 | 0.986 | 0.990 | 0.002 |
| Medium `(32, 16)` | 0.965 | 0.930 | 0.990 | 0.028 |

The **Small** preset (the default) is the more stable choice: it trains close to the full epoch budget
and lands within a tight R² band. The **Medium** preset has more capacity but is more variable — on a
couple of seeds its early stopping halts sooner (≈80–100 epochs) and it underfits to R² ≈ 0.93. That
variability is itself a useful lesson about neural networks (more capacity is not automatically more
reliable), and it is why the smaller network is the default. See
[`NEURAL_NETWORK_VALIDATION_REPORT.md`](NEURAL_NETWORK_VALIDATION_REPORT.md) for the full run table.

## Honest comparison — browser vs notebook

Same problem, same seed (42), same 70/15/15 split *ratio* — but the browser uses its own JavaScript
model code and its own random partition of the rows, while the notebook uses `scikit-learn` and its
own partition. **The numbers are not identical, and are not meant to be.**

**Browser (Explore, `?localOnly=1`):**

| Model | Test R² | Test RMSE (kPa) |
| --- | --- | --- |
| Linear Regression | 0.563 | 26.63 |
| Decision Tree | 0.679 | 22.84 |
| Random Forest | 0.832 | 16.54 |
| Neural Network (Small, Standard) | 0.986 | 4.78 |
| Neural Network (Medium, Standard) | 0.984 | 5.05 |

**Notebook (`scikit-learn`):**

| Model | Test R² | Test RMSE (kPa) |
| --- | --- | --- |
| Linear Regression | 0.596 | 22.23 |
| Decision Tree | 0.780 | 16.39 |
| Random Forest | 0.846 | 13.72 |
| Neural Network `(32, 16)` | 0.788 | 16.10 |

**What this shows — read carefully.** The eye-catching number is the notebook network's **0.788**,
which sits well below the browser network's ~0.99. It would be easy — and wrong — to read this as
"the browser network is better" or "neural networks lose to Random Forests here." A careful audit
shows the gap is a **training-length / early-stopping artifact, not an implementation-quality or a
model-capability difference**:

- The notebook's `MLPRegressor` uses `early_stopping=True, n_iter_no_change=25`, which monitors a
  small internal validation slice with a *relative* tolerance and, on this data, halts after only
  **~53 iterations** — an underfit.
- Running the **same architecture, same split proportions, and same seed** with early stopping
  switched off (`max_iter=2000`) reaches **test R² ≈ 0.992** — essentially matching the browser and
  approaching the noise ceiling. The browser network's stricter absolute early-stopping criterion and
  larger external validation set let it train for ~200 epochs, so it converges without underfitting.

In other words, **both implementations reach ~0.99 when the network is trained to convergence.** We
have **not** over-tuned either network, and neither is presented as universally superior.

The genuine lessons are therefore two, and both are honest:

1. **This dataset is easy.** It is a smooth, low-noise (~5 % multiplicative) synthetic function, so
   the irreducible-noise R² ceiling is about **0.996** — a flexible model that fits it well
   legitimately lands near ~0.99. This says nothing about how any model would fare on noisier,
   smaller, or messier real engineering data, where trees are frequently as good as or better than a
   neural network and need far less care.
2. **Training length and early-stopping criteria matter.** The notebook's low score is a concrete
   demonstration that stopping too early underfits — a more useful teaching point than a spurious
   "model A beats model B" ranking. The notebook flags this explicitly.

Explore's Stage 4 interpretation states these cautions deterministically and adapts its wording to
the numbers actually observed; it never claims the neural network is best in general.

## Limitations

- Synthetic, single-dataset demonstration — **not** validated engineering data.
- Predictions outside the demonstrated input range are **extrapolation** and can be unreliable.
- Good test performance does **not** prove the physics or justify real design use.
- The browser network is a compact educational implementation, not a production DL framework; the
  notebook uses `scikit-learn`'s `MLPRegressor`, not PyTorch/TensorFlow.
- Physical validation and engineering judgement remain **required**.

## Deferred to Phase 3

Project mode already exposes the full neural-network configuration; a future phase should route it
through clearly-labelled **Advanced** settings (layers, neurons, activation, learning rate, max
iterations, regularisation, early stopping, seed) as part of the wider Project-mode redesign. See
[`ROADMAP.md`](../ROADMAP.md).

---

*Engineering ML Studio is a redevelopment of **Local Regression Studio** by **Yu Duan** (MIT
licence). New contributions are © UKRI under the same MIT terms and do not alter the original work's
copyright or attribution.*
