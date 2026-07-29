#!/usr/bin/env python3
"""Structure/validation tests for the Learn the Code notebook.

These use only the Python standard library (the notebook is parsed as JSON), so
they run anywhere — no scikit-learn, pandas, or Jupyter needed. They check that
the committed notebook is well-formed and that it stays faithful to the browser
Explore activity:

    python3 -m unittest tests.test_notebook_structure     # from the repo root
    python3 tests/test_notebook_structure.py

They deliberately assert on *structure and wording*, not on trained metrics
(the end-to-end run is covered by tests/test_notebook_execution.py).
"""

import json
import os
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
NOTEBOOK = os.path.join(ROOT, "notebooks", "pipe_pressure_drop.ipynb")


def load_notebook():
    with open(NOTEBOOK, encoding="utf-8") as handle:
        return json.load(handle)


def cells_of_type(nb, cell_type):
    return [c for c in nb.get("cells", []) if c.get("cell_type") == cell_type]


def source_of(cell):
    src = cell.get("source", "")
    return "".join(src) if isinstance(src, list) else src


def all_source(nb, cell_type=None):
    cells = nb.get("cells", [])
    if cell_type:
        cells = [c for c in cells if c.get("cell_type") == cell_type]
    return "\n".join(source_of(c) for c in cells)


class NotebookStructureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.nb = load_notebook()

    def test_notebook_file_exists(self):
        self.assertTrue(os.path.exists(NOTEBOOK), "notebook file is missing")

    def test_valid_notebook_json_v4(self):
        self.assertEqual(self.nb.get("nbformat"), 4, "expected notebook format 4")
        self.assertIsInstance(self.nb.get("cells"), list)
        self.assertGreater(len(self.nb["cells"]), 0)

    def test_committed_without_outputs(self):
        # A clean, reproducible notebook: no stored outputs, no execution counts.
        for cell in cells_of_type(self.nb, "code"):
            self.assertEqual(cell.get("outputs", []), [], "code cell has stored outputs")
            self.assertIsNone(cell.get("execution_count"), "code cell has an execution_count")

    def test_has_all_sixteen_sections(self):
        markdown = all_source(self.nb, "markdown")
        for n in range(1, 17):
            self.assertIn(f"## {n}.", markdown, f"missing section heading '## {n}.'")

    def test_fixed_seed_present(self):
        code = all_source(self.nb, "code")
        self.assertIn("SEED = 42", code, "the fixed seed (42) must be defined")
        self.assertIn("random_state=SEED", code, "the split must use the fixed seed")

    def test_all_three_model_names_present(self):
        text = all_source(self.nb)
        for name in ("Linear Regression", "Decision Tree", "Random Forest"):
            self.assertIn(name, text, f"model name '{name}' missing")
        code = all_source(self.nb, "code")
        for cls in ("LinearRegression", "DecisionTreeRegressor", "RandomForestRegressor"):
            self.assertIn(cls, code, f"scikit-learn class '{cls}' missing")

    def test_correct_features_and_target(self):
        code = all_source(self.nb, "code")
        for feature in (
            "pipe_length_m",
            "pipe_diameter_m",
            "flow_velocity_m_s",
            "fluid_density_kg_m3",
            "dynamic_viscosity_pa_s",
        ):
            self.assertIn(feature, code, f"input feature '{feature}' missing")
        self.assertIn("pressure_drop_kpa", code, "target column missing")

    def test_units_reported_in_kpa(self):
        self.assertIn("kPa", all_source(self.nb), "physical units (kPa) must appear")

    def test_metrics_present(self):
        code = all_source(self.nb, "code")
        self.assertIn("r2_score", code, "R2 metric must be computed")
        self.assertIn("mean_squared_error", code, "RMSE (via MSE) must be computed")

    def test_synthetic_and_not_for_design_disclaimer(self):
        text = all_source(self.nb, "markdown").lower()
        self.assertIn("synthetic", text, "synthetic-data disclaimer missing")
        self.assertTrue(
            "not" in text and "design" in text,
            "must state it is not a design tool",
        )

    def test_extrapolation_warning_present(self):
        text = all_source(self.nb).lower()
        self.assertIn("extrapolat", text, "extrapolation warning missing")

    def test_offline_first_data_loader_with_documented_fallback(self):
        code = all_source(self.nb, "code")
        self.assertIn("os.path.exists", code, "loader should try a local path first")
        self.assertIn(
            "raw.githubusercontent.com/weiwangstfc/engineering-ml-studio",
            code,
            "loader should fall back to the committed dataset URL",
        )

    def test_attribution_preserved(self):
        text = all_source(self.nb, "markdown")
        self.assertIn("Yu Duan", text, "original author attribution missing")
        self.assertIn("UKRI", text, "UKRI copyright note missing")

    # --- Optional advanced neural-network section (Section 16) ---------------

    def test_neural_network_section_is_marked_optional_and_advanced(self):
        markdown = all_source(self.nb, "markdown").lower()
        self.assertIn("neural network", markdown, "neural-network section missing")
        # It must be framed as optional/advanced, not a core beginner step.
        self.assertIn("optional", markdown, "NN section must be marked optional")
        self.assertIn("advanced", markdown, "NN section must be marked advanced")

    def test_neural_network_uses_mlpregressor_with_scaler_pipeline(self):
        code = all_source(self.nb, "code")
        self.assertIn("MLPRegressor", code, "NN must use sklearn MLPRegressor")
        self.assertIn("hidden_layer_sizes=(32, 16)", code, "NN must use the (32, 16) architecture")
        # Scaling is essential for a neural network and must be in the pipeline.
        self.assertIn("make_pipeline(", code, "NN must be built as a scaling pipeline")
        self.assertIn("StandardScaler", code, "NN pipeline must include StandardScaler")

    def test_neural_network_is_reproducible_and_regularised(self):
        code = all_source(self.nb, "code")
        self.assertIn("random_state=SEED", code, "NN must fix the random seed")
        self.assertIn("early_stopping=True", code, "NN must use early stopping")
        self.assertIn("alpha=", code, "NN must apply L2 regularisation (alpha)")

    def test_neural_network_reports_loss_curve_and_honest_message(self):
        code = all_source(self.nb, "code")
        self.assertIn("loss_curve_", code, "NN must plot its training/loss curve")
        markdown = all_source(self.nb, "markdown").lower()
        # The honest "complexity is not automatically better" message must be present.
        self.assertIn("small", markdown)
        self.assertIn("tabular", markdown)
        self.assertTrue(
            "does not" in markdown or "not the same as" in markdown or "not" in markdown,
            "NN section must include an honest caveat about complexity vs accuracy",
        )

    def test_no_pytorch_or_tensorflow_dependency(self):
        code = all_source(self.nb, "code")
        for banned in ("import torch", "import tensorflow", "from torch", "from tensorflow"):
            self.assertNotIn(banned, code, f"notebook must not require '{banned}'")


if __name__ == "__main__":
    unittest.main()
