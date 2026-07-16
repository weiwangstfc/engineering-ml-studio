# Security Policy

## Supported release

The supported reference release is Local Regression Studio v1.0.11. Security corrections should be distributed as a new signed or checksum-verifiable release rather than by replacing files silently.

## Reporting a vulnerability

Report suspected vulnerabilities privately to the application owner or deployment administrator. Include the application version, edition, browser, steps to reproduce, affected artifact type, and whether raw user data are required. Do not attach sensitive datasets unless an approved secure channel is available.

## Security properties

- Browser-local model development and prediction
- No analytics, remote training, cloud-storage, or CSV-upload endpoint
- Strict-offline editions with no permitted remote script or connection sources
- SHA-256 artifact integrity for approved prediction packages
- Optional ECDSA P-256 organizational signature verification against administrator-pinned public keys
- Import file-size and structural-complexity limits
- CSV row/column limits and duplicate-header rejection
- Spreadsheet-formula injection protection in generated CSV files
- HTML escaping of user-controlled labels and governance text
- Bounded model and tuning workloads

## Organizational signatures

The app does not create organizational signatures or store private keys. A deployment may configure trusted public JWK values in `js/build-config.js` under `trustedSigningKeys`. Signed packages are accepted only when the declared `keyId` exists in that trusted map and the ECDSA signature verifies over the package SHA-256 digest.

An embedded public key is not treated as organizational trust. Key distribution, rotation, revocation, custody, and signer identity are deployment responsibilities.

## Known security boundaries

- Prediction-only mode is a workflow restriction, not authentication or authorization.
- Governance names and roles are recorded metadata, not verified identities.
- A malicious user with permission to replace application files can also replace configuration and trusted keys; protect the deployment directory with ordinary hosting and operating-system controls.
- Browser memory exhaustion cannot be eliminated completely. The app validates documented limits and refuses oversized structures, but administrators should set web-server upload limits as an additional control.
- The Full Studio hybrid edition permits pinned jsDelivr sources through its CSP when hybrid mode is enabled. Use Strict-offline for controlled environments.

## Security update process

1. Reproduce and classify the issue.
2. Correct it on a new maintenance branch.
3. Add a regression test.
4. Run numerical, migration, security, and browser checks.
5. Publish a new version, checksum, manifest, SBOM, test report, and release notes.
6. Inform operators whether approved model packages need reissue or revalidation.
