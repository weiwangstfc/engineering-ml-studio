# Local Regression Studio

Local Regression Studio is a private, local-first browser application for preparing CSV data, training and comparing regression models, validating results, recording governance decisions, operating approved prediction packages, and monitoring deployed performance.

## Included editions

- **Full Studio** — the package root. Supports data preparation, all eleven regression model families, tuning, comparison, validation, approval, prediction, and monitoring. The local launcher starts it with bundled libraries by default; `--hybrid` permits pinned CDN attempts with local fallback.
- **Prediction-only edition** — `editions/prediction-only/`. Forces approved-package operation and bundled local dependencies. This is an operational workflow guardrail, not an authentication boundary.
- **Strict-offline Studio** — `editions/strict-offline/`. Includes the complete Studio, forces bundled dependencies, and uses a Content Security Policy without remote script or connection sources.

## Start locally

Extract the ZIP and use one of the launchers:

| Edition | Windows | macOS | Linux |
|---|---|---|---|
| Full Studio | `start-windows.bat` | `start-macos.command` | `start-linux.sh` |
| Prediction only | `start-prediction-only-windows.bat` | `start-prediction-only-macos.command` | `start-prediction-only-linux.sh` |
| Strict offline | `start-strict-offline-windows.bat` | `start-strict-offline-macos.command` | `start-strict-offline-linux.sh` |

The Python launcher binds only to `127.0.0.1`. You may also deploy any edition with a static web server.

## Model families

1. Linear regression
2. Ridge regression
3. Elastic-net regression
4. Huber robust regression
5. Decision-tree regression
6. Random-forest regression
7. Gradient-boosted trees
8. k-nearest-neighbour regression
9. Linear quantile regression
10. Gaussian-process regression
11. Feed-forward artificial neural networks

## v1.0 governance and deployment additions

- Versioned model, project, experiment, approved-package, monitoring, and governance records
- Safe migration of supported earlier project and model schemas
- Explicit lifecycle states from Draft through Retired
- Developer, owner, reviewer, and approver records
- Post-deployment monitoring and revalidation triggers
- Old-versus-new model change assessments
- Local recovery snapshots that exclude the original CSV
- CSV and JSON import limits and structural validation
- Spreadsheet-formula protection in exported CSV files
- Runtime edition, network-policy, and dependency-source status
- Strict-offline and prediction-only distributions
- SBOM, threat model, security policy, build provenance, and release manifest
- Optional organizational signature verification using deployment-pinned public keys

## Privacy

Training data and predictions are processed in the browser. There is no analytics, cloud model-training, remote storage, or CSV-upload endpoint. The Full Studio hybrid build may request pinned public libraries during startup only when hybrid mode is deliberately enabled. The strict-offline and prediction-only editions prohibit those remote requests through build configuration and Content Security Policy.

Downloaded models, projects, monitoring records, reports, and predictions may contain sensitive derived information. Store and share them according to your organization’s requirements.

## Important boundaries

- Governance records are not identity authentication, regulatory certification, or a legal electronic signature.
- Organizational package-signature verification requires trusted public keys to be configured by the deployment administrator. The reference build ships with no trusted organizational keys.
- The prediction-only edition is not an access-control boundary; use authenticated hosting and operating-system controls when authorization is required.
- Complete model training remains on the main browser thread in v1.0. Long jobs can still make low-powered devices less responsive.
- Accessibility improvements are included, but the reference build has not received an independent WCAG conformance certification.

See `docs/` for role-specific, security, deployment, migration, governance, monitoring, privacy, and modelling documentation.


## v1.0.11 maintenance release

This release keeps the v1.0 governance scope and improves usability around System utilities, data-quality help, comparison batches, validation reports, diagnostics, and monitoring exports.
# localregressorstudio
# localregressorstudio
