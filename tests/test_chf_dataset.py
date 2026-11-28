# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 UK Research and Innovation (UKRI)
"""Tests for the bundled critical heat flux (CHF) datasets — the first real, measured data.

The source files live outside this repository (AI4NTH Summer School), so these tests check the
committed files directly: expected columns and units, physically sensible ranges, no missing or
non-finite values, and that the 2,500-row sample is reproducible from the committed full file
with the documented seed.

Run:
    python3 -m unittest tests.test_chf_dataset
"""

import csv
import math
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, ROOT)

from scripts import prepare_chf_datasets as prep  # noqa: E402

EXAMPLES = os.path.join(ROOT, "examples")


def load(name):
    with open(os.path.join(EXAMPLES, name), newline="", encoding="utf-8") as fh:
        reader = csv.reader(fh)
        header = next(reader)
        return header, list(reader)


# Physically plausible bounds for upward water flow in heated round tubes.
RANGES = {
    "tube_diameter_m": (0.001, 0.05),
    "heated_length_m": (0.01, 25.0),
    "pressure_kpa": (50.0, 22064.0),        # below the critical pressure of water
    "mass_flux_kg_m2_s": (0.0, 10000.0),
    "outlet_quality": (-1.0, 1.0),
    "chf_kw_m2": (1.0, 25000.0),
}


class ChfDatasetTests(unittest.TestCase):

    def test_columns_and_row_counts(self):
        header, rows = load("chf_full.csv")
        self.assertEqual(header, prep.FULL_COLUMNS)
        self.assertEqual(len(rows), 24579)
        header, rows = load("chf_sample.csv")
        self.assertEqual(header, prep.SAMPLE_COLUMNS)
        self.assertEqual(len(rows), prep.SAMPLE_ROWS)
        for name in prep.OOD.values():
            header, rows = load(name)
            self.assertEqual(header, prep.FULL_COLUMNS, name)
            self.assertGreater(len(rows), 100, name)

    def test_values_are_finite_and_physically_sensible(self):
        for name in ["chf_full.csv", "chf_sample.csv"] + list(prep.OOD.values()):
            header, rows = load(name)
            for column, (lo, hi) in RANGES.items():
                j = header.index(column)
                for line, row in enumerate(rows, start=2):
                    value = float(row[j])
                    self.assertTrue(math.isfinite(value), f"{name}:{line} {column}")
                    self.assertTrue(lo <= value <= hi, f"{name}:{line} {column}={value}")
            source = header.index("source")
            self.assertTrue(all(row[source].strip() for row in rows), f"{name}: every row names its source")

    def test_sample_is_reproducible_from_the_full_file(self):
        header, full_rows = load("chf_full.csv")
        full = [dict(zip(header, row)) for row in full_rows]
        expected = [[r[c] for c in prep.SAMPLE_COLUMNS] for r in prep.sample(full)]
        _, sample_rows = load("chf_sample.csv")
        self.assertEqual(sample_rows, expected)

    def test_sample_spans_many_sources(self):
        header, rows = load("chf_sample.csv")
        sources = {row[header.index("source")] for row in rows}
        self.assertGreaterEqual(len(sources), 40, "the sample should represent many laboratories")


if __name__ == "__main__":
    unittest.main()
