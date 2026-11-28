#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 UK Research and Innovation (UKRI)
r"""Prepare the critical heat flux (CHF) example datasets from the AI4NTH Summer School files.

This is the first **real, measured** dataset bundled with Engineering ML Studio. Unlike the
synthetic examples, it is not generated from an equation: it is a compilation of published
experiments on water flowing upwards through uniformly heated round tubes.

Source and licence
------------------
* Source: U.S. Nuclear Regulatory Commission (NRC) CHF database, the experimental basis of the
  2006 CHF look-up table (Groeneveld et al., 2006), as distributed with the AI4NTH Summer School
  (``datasets/`` folder; metadata in ``datasets/chf_case_study/metadata.yaml``).
* Licence: CC0-1.0 (public-domain dedication), as recorded in that metadata. Public release in
  this repository was confirmed by Wei Wang on 2026-11-28 (WORKPLAN §8, Decided).

What this script does
---------------------
It reads the summer-school CSVs and writes, into ``examples/``:

* ``chf_full.csv`` — every row of ``chf_ong.csv`` (24,579 rows from 60 experimental sources),
  with all physical variables;
* ``chf_sample.csv`` — a reproducible random sample of 2,500 rows from the full data (seed 42),
  small enough for Explore to train instantly, keeping the source laboratory as a column;
* ``chf_ood_kim2000.csv``, ``chf_ood_lee1966.csv``, ``chf_ood_peterlongo1966.csv`` — the three
  out-of-domain sources, for extrapolation exercises.

Columns are renamed to the project convention (snake_case, unit in the name); values are not
changed. The row counter and the numeric reference ID are dropped; the reference name is kept as
``source`` so that grouped (source-wise) splits can be taught.

Variables
---------
=====================  ===============================  =========
column                 meaning                          unit
=====================  ===============================  =========
tube_diameter_m        inside diameter of the tube      m
heated_length_m        heated length                    m
pressure_kpa           system pressure                  kPa
mass_flux_kg_m2_s      mass flux                        kg/(m²·s)
outlet_quality         thermodynamic quality at outlet  —
inlet_subcooling_kj_kg inlet subcooling (full only)     kJ/kg
inlet_temperature_c    inlet temperature (full only)    °C
chf_kw_m2              critical heat flux (target)      kW/m²
source                 publication the row comes from   text
=====================  ===============================  =========

Outlet quality, inlet subcooling and inlet temperature are thermodynamically linked: use only one
of them as an input (the summer-school guidance). The sample therefore keeps outlet quality only.

Limits of use
-------------
These are real measurements with real experimental scatter and source-to-source differences. They
are provided for teaching machine-learning practice. Nothing trained on them is a validated CHF
correlation: CHF prediction for design or safety analysis requires validated methods (such as the
look-up table itself) and the applicable regulatory processes.

Usage
-----
    python3 scripts/prepare_chf_datasets.py --source /path/to/ai4nth-summer-school/datasets
"""

from __future__ import annotations

import argparse
import csv
import os

import numpy as np

RENAME = {
    "Tube Diameter (m)": "tube_diameter_m",
    "Heated Length (m)": "heated_length_m",
    "Pressure (kPa)": "pressure_kpa",
    "Mass Flux (kg/m^2/s)": "mass_flux_kg_m2_s",
    "Outlet Quality": "outlet_quality",
    "Inlet Subcooling (kJ/kg)": "inlet_subcooling_kj_kg",
    "Inlet Temperature (degreeC )": "inlet_temperature_c",
    "CHF (kW/m^2)": "chf_kw_m2",
    "Reference name": "source",
}
FULL_COLUMNS = ["tube_diameter_m", "heated_length_m", "pressure_kpa", "mass_flux_kg_m2_s", "outlet_quality",
                "inlet_subcooling_kj_kg", "inlet_temperature_c", "chf_kw_m2", "source"]
SAMPLE_COLUMNS = ["tube_diameter_m", "heated_length_m", "pressure_kpa", "mass_flux_kg_m2_s", "outlet_quality",
                  "chf_kw_m2", "source"]
SAMPLE_ROWS = 2500
SEED = 42
OOD = {"chf_OOD_Kim2000.csv": "chf_ood_kim2000.csv",
       "chf_OOD_Lee1966.csv": "chf_ood_lee1966.csv",
       "chf_OOD_Peterlongo1966.csv": "chf_ood_peterlongo1966.csv"}


def read(path):
    with open(path, newline="", encoding="utf-8-sig") as fh:
        rows = list(csv.DictReader(fh))
    out = []
    for row in rows:
        renamed = {RENAME[k]: v.strip() for k, v in row.items() if k in RENAME}
        missing = [c for c in FULL_COLUMNS if c not in renamed]
        if missing:
            raise ValueError(f"{os.path.basename(path)}: missing columns {missing}")
        out.append(renamed)
    return out


def write(path, rows, columns):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(columns)
        for row in rows:
            writer.writerow([row[c] for c in columns])


def sample(rows, n=SAMPLE_ROWS, seed=SEED):
    idx = np.random.default_rng(seed).choice(len(rows), size=n, replace=False)
    return [rows[i] for i in sorted(idx)]


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--source", required=True, help="the summer school's datasets/ folder")
    parser.add_argument("--out", default=os.path.normpath(os.path.join(here, "..", "examples")))
    args = parser.parse_args()

    full = read(os.path.join(args.source, "chf_ong.csv"))
    write(os.path.join(args.out, "chf_full.csv"), full, FULL_COLUMNS)
    write(os.path.join(args.out, "chf_sample.csv"), sample(full), SAMPLE_COLUMNS)
    for src, dst in OOD.items():
        write(os.path.join(args.out, dst), read(os.path.join(args.source, src)), FULL_COLUMNS)
    print(f"Wrote chf_full.csv ({len(full)} rows), chf_sample.csv ({SAMPLE_ROWS} rows, seed {SEED}) "
          f"and {len(OOD)} out-of-domain files to {args.out}")


if __name__ == "__main__":
    main()
