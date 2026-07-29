# Governance

> **Provisional.** This describes how Engineering ML Studio is intended to be run during early
> redevelopment. It will be revised as the project and its maintainer group mature.

## Independence

Engineering ML Studio is an independently maintained derivative of Local Regression Studio (see
[`NOTICE.md`](NOTICE.md)). Its **roadmap, release process, and technical direction are controlled
independently** by the Engineering ML Studio maintainers.

Yu Duan is credited as the **original developer** of Local Regression Studio. Future changes to
Engineering ML Studio **do not require Yu Duan's approval**, and Yu Duan is not responsible for
work done after the fork point.

## Maintainers

- **Current project lead and maintainer:** Wei Wang at the Science and Technology Facilities Council
  (STFC). This is a statement of current leadership and maintenance responsibility, not a claim of
  ownership over the original code (see [`NOTICE.md`](NOTICE.md)).
- Maintainers control **pull requests, releases, and technical direction**.
- Maintainers are responsible for upholding the licence and attribution obligations in every
  release (see [`NOTICE.md`](NOTICE.md) and [`LICENSES.txt`](LICENSES.txt)).
- **Target:** at least **two maintainers** should eventually hold administrative access, to avoid a
  single point of control and to allow review continuity. *(Not yet satisfied at Phase 0 — Wei Wang
  is currently the sole maintainer.)*

## Change process

- Changes are proposed and reviewed through **pull requests**.
- A change should be reviewed by at least one maintainer other than the author once a second
  maintainer is in place.
- **Major architectural decisions must be documented** (e.g. as a short decision record under
  `docs/`) so that the reasoning is preserved.

## Releases

- Releases are cut by maintainers according to the [`ROADMAP.md`](ROADMAP.md).
- Every release must retain the original copyright, the MIT licence, third-party notices, and the
  attribution to Yu Duan and Local Regression Studio.

## Non-negotiable obligations

Regardless of how governance evolves, the project must **always**:

1. Retain Yu Duan's credit as original developer.
2. Retain the original MIT licence and copyright notices unchanged.
3. Retain third-party licences and notices.
4. State clearly that Engineering ML Studio is an independent derivative.
