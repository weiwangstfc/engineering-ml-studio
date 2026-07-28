# Contributing to Engineering ML Studio

> Early redevelopment stage. Processes here are provisional and will tighten as the project matures.

Thank you for your interest. Engineering ML Studio is an independently maintained derivative of
Local Regression Studio (see [`NOTICE.md`](NOTICE.md)). Please read [`GOVERNANCE.md`](GOVERNANCE.md)
for how decisions are made.

## Before you start

- The current focus is the **Phase 1** goals in [`ROADMAP.md`](ROADMAP.md): usability and workflow,
  **not** adding many new algorithms.
- For anything beyond a small fix, please open an issue to discuss it first, so effort aligns with
  the roadmap.

## Ground rules

1. **Preserve attribution and licence.** Do not remove or alter the original copyright, the MIT
   licence ([`LICENSES.txt`](LICENSES.txt)), third-party notices, or the credit to Yu Duan and
   Local Regression Studio. New files that carry a licence header must remain compatible.
2. **Keep it browser-first and privacy-conscious.** No backend, no analytics, no data-upload
   endpoints, no accounts. Data stays on the user's machine.
3. **Document major architectural decisions** (see [`GOVERNANCE.md`](GOVERNANCE.md)).
4. **Be honest about status.** Distinguish confirmed behaviour from proposals in docs and PRs.

## Workflow

1. Create a topic branch off the current working branch.
2. Make focused changes with clear commit messages.
3. Open a pull request describing **what** changed and **why**, and which roadmap item it serves.
4. A maintainer reviews. Once a second maintainer is in place, review by someone other than the
   author is expected.

## What not to change without discussion

- The licence or attribution files.
- The privacy/security posture (browser-local, no telemetry).
- Deployment configuration.
- Dependency versions.

## Reporting issues

- Use the issue tracker for bugs, usability problems, and proposals.
- For anything with security or privacy implications, see [`SECURITY.md`](SECURITY.md).
