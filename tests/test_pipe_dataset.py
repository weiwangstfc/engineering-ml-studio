#!/usr/bin/env python3
"""Tests for the synthetic pipe pressure-drop dataset generator.

These use only the Python standard library plus numpy (already required by the
generator). Run with:

    python3 -m unittest tests.test_pipe_dataset      # from the repo root
    python3 tests/test_pipe_dataset.py

They check that the documented, deterministic generator behaves as promised:
fixed columns, requested row count, sensible physical ranges, strictly positive
pressure drops, and byte-for-byte reproducibility for a fixed seed. They also
confirm the bundled example CSV matches a fresh generation with the defaults.
"""

import csv
import io
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, os.path.join(ROOT, "scripts"))

import generate_pipe_pressure_drop as gen  # noqa: E402

BUNDLED_CSV = os.path.join(ROOT, "examples", "pipe_pressure_drop_sample.csv")


def rows_to_csv_text(header, rows):
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(header)
    writer.writerows(rows)
    return buf.getvalue()


class PipeDatasetGeneratorTests(unittest.TestCase):
    def test_expected_columns_and_units(self):
        header, rows, _ = gen.generate(rows=50, seed=42)
        self.assertEqual(header, [
            "pipe_length_m", "pipe_diameter_m", "flow_velocity_m_s",
            "fluid_density_kg_m3", "dynamic_viscosity_pa_s", "pressure_drop_kpa",
        ])
        # The target column carries its unit; it is the last column.
        self.assertEqual(header[-1], "pressure_drop_kpa")

    def test_requested_row_count(self):
        for n in (10, 100, 500):
            _, rows, diag = gen.generate(rows=n, seed=1)
            self.assertEqual(len(rows), n)
            self.assertEqual(diag["rows"], n)

    def test_no_negative_or_non_finite_pressure_drop(self):
        header, rows, _ = gen.generate(rows=500, seed=7)
        dp_index = header.index("pressure_drop_kpa")
        for r in rows:
            self.assertGreater(r[dp_index], 0.0)          # strictly positive
            for v in r:
                self.assertTrue(_is_finite(v))            # every value finite
                self.assertGreater(v, 0.0)                # every input positive

    def test_ranges_are_sensible(self):
        header, rows, diag = gen.generate(rows=500, seed=42)
        idx = {name: header.index(name) for name in header}
        for r in rows:
            self.assertGreaterEqual(r[idx["pipe_length_m"]], 2.0)
            self.assertLessEqual(r[idx["pipe_length_m"]], 30.0)
            self.assertGreaterEqual(r[idx["pipe_diameter_m"]], 0.02 - 1e-6)
            self.assertLessEqual(r[idx["pipe_diameter_m"]], 0.20 + 1e-6)
            self.assertGreaterEqual(r[idx["flow_velocity_m_s"]], 0.5 - 1e-6)
            self.assertLessEqual(r[idx["flow_velocity_m_s"]], 4.0 + 1e-6)
        # Pressure drop should span a wide but bounded, physically plausible range.
        self.assertGreater(diag["dp_min_kpa"], 0.0)
        self.assertLess(diag["dp_max_kpa"], 1000.0)

    def test_deterministic_for_fixed_seed(self):
        a = gen.generate(rows=200, seed=42)
        b = gen.generate(rows=200, seed=42)
        self.assertEqual(a[0], b[0])
        self.assertEqual(a[1], b[1])   # identical rows on a repeat run

    def test_different_seeds_differ(self):
        a = gen.generate(rows=200, seed=42)
        b = gen.generate(rows=200, seed=43)
        self.assertNotEqual(a[1], b[1])

    def test_validate_accepts_generated_data(self):
        header, rows, _ = gen.generate(rows=100, seed=3)
        gen.validate(header, rows)  # must not raise

    def test_bundled_csv_matches_default_generation(self):
        """The committed example CSV is reproducible from the documented defaults."""
        self.assertTrue(os.path.exists(BUNDLED_CSV), "bundled example CSV is missing")
        header, rows, _ = gen.generate(rows=500, seed=42, sigma=0.05)
        expected = rows_to_csv_text(header, rows).replace("\r\n", "\n")
        with open(BUNDLED_CSV, "r", newline="") as fh:
            actual = fh.read().replace("\r\n", "\n")
        self.assertEqual(actual, expected,
                         "examples/pipe_pressure_drop_sample.csv is out of date; "
                         "rerun scripts/generate_pipe_pressure_drop.py")


def _is_finite(x):
    return x == x and x not in (float("inf"), float("-inf"))


if __name__ == "__main__":
    unittest.main()
