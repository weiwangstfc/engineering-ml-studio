# Threat Model

## Protected assets

- Training and prediction CSV data
- Fitted model and preprocessing state
- Approved prediction packages
- Governance and monitoring records
- Trusted organizational public keys
- Release files and manifests

## Primary threats and controls

| Threat | Controls | Residual risk |
|---|---|---|
| Sensitive data sent externally | Local processing; no upload endpoint; strict-offline CSP | Browser extensions, compromised host, or custom modifications remain outside app control |
| Malicious/oversized CSV | File, row, and column limits; duplicate-header checks; bounded workloads | Complex but within-limit data can still consume substantial memory |
| Malformed/oversized JSON | File, depth, node, array, type, schema, and hash checks | Novel semantic corruption may require additional model-specific checks |
| Spreadsheet formula injection | Prefix dangerous exported cells with an apostrophe | Users can manually remove protection after download |
| HTML/script injection | Escaping and CSP | Deployment modifications can weaken CSP |
| Package tampering | SHA-256 integrity and embedded self-test vectors | Hash alone does not prove organizational origin |
| False signer identity | Administrator-pinned trusted keys | Key custody, rotation, and revocation are organizational responsibilities |
| Unauthorized Studio access | Separate prediction edition and deployment guidance | Static editions do not provide authentication |
| Model misuse outside scope | Intended/prohibited uses, applicability warnings, approval status | Human process can ignore warnings |
| Stale model | Review dates, monitoring, revalidation triggers, suspension/expiry | Monitoring data can be late or incomplete |
| Supply-chain compromise | Bundled libraries, version inventory, SBOM, manifest, strict-offline edition | Reference build is checksum-verifiable but not signed by a private release key |

## Trust boundaries

The browser, operating system, hosting environment, installed extensions, and organizational identity system are outside the JavaScript application’s control. The app assumes its own static files and configured trusted keys have not been replaced by an attacker with deployment access.
