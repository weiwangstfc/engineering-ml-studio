# Privacy

Local Regression Studio processes CSV data, preprocessing, training, diagnostics, monitoring, and predictions in the user’s browser. It has no analytics, account service, cloud storage, remote model execution, or data-upload endpoint.

The Full Studio may load pinned Plotly and CSV parser assets from jsDelivr when deliberately started in hybrid mode. Those requests are for application libraries, not user CSV data. The local launchers default to bundled libraries. Strict-offline and Prediction-only editions force bundled assets and use a CSP that disallows remote script and connection sources.

The original CSV is not embedded in saved projects, models, experiment records, approved prediction packages, governance reports, or recovery snapshots. Derived artifacts can nevertheless reveal sensitive information through feature names, ranges, categories, coefficients, stored rows, predictions, residuals, approval notes, and monitoring outcomes. Treat downloads as potentially sensitive.

Local browser storage is used only for an optional recovery snapshot and user interface state. The recovery snapshot excludes the original CSV. Users can discard it from the recovery panel or clear site storage through the browser.
