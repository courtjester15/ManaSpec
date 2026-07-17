# ManaSpec Library Audit And Usage Guide

This document owns dependency inventory, evaluation, adoption rationale, and runtime-delivery policy for the vanilla app and React spike.

Availability is not adoption. A library is used only when it solves a present problem, reduces meaningful custom code, and fits the offline-first architecture without overlapping another adopted tool.

The detailed manifest and dependency-closure review is recorded in [Local React Package Archive Audit](audits/react-local-package-archive-audit-2026-07-15.md).

## Status Vocabulary

- `Adopted`: used by the current implementation.
- `Foundation`: expected to create/build the React spike; final use is confirmed by the workspace lockfile and successful builds.
- `Proposed`: preferred direction but not yet implemented and verified.
- `Evaluate`: credible candidate requiring a focused comparison.
- `Deferred`: potentially useful after parity or after a prerequisite is stable.
- `Do not adopt`: poor fit for this React spike unless new evidence reverses the decision.
- `Transitive`: required by another package; never add directly without its own use case.
- `Archived duplicate`: retained only in the ignored offline cache.

## Local Archive Policy

The copied `/lib` folder is a local offline package cache inherited from GalleyFlow. It contains npm `.tgz` archives and a local README; it is not application source, a browser vendor directory, or the canonical dependency declaration.

- `/lib/` is ignored by Git.
- Do not move or extract archives into application source merely because they are available.
- Commit `react-app/package.json` and its lockfile when the workspace exists.
- Use normal package names and exact/ranged versions in the manifest; do not commit a lockfile whose canonical resolutions depend on another developer having `../lib/*.tgz` paths.
- The local archive may bootstrap an offline install, but the manifest and lockfile remain authoritative.
- Commit required license/notice output and the bundled portable artifact, not the original package archives.
- If the archive must be shared later, use a documented artifact/cache location rather than quietly committing it to the application repository.

No physical reorganization is needed now. The filenames are sortable, manifests are readable, dependency packages are present, and moving them into `used/`, `tested/`, or `deferred/` would make one dependency closure harder to reason about. Status belongs in this document.

## Current Vanilla Dependency

| Library | Version | Location | Status | Current use | React treatment |
| --- | --- | --- | --- | --- | --- |
| Chart.js | 4.5.1 | `assets/vendor/chart.js/` | Adopted | Price History line chart | Use the npm package directly unless a wrapper demonstrates a real benefit; bundle locally. |

The vendored Chart.js runtime under `assets/vendor/` is application source and remains tracked. It is separate from the ignored Chart.js package archives under `/lib`.

## React Foundation Set

The archive contains a complete Windows x64 foundation set for the reviewed React/Vite versions:

| Direct package | Archived version | Status | Purpose and notes |
| --- | --- | --- | --- |
| `react` | 19.2.7 | Foundation | Component/runtime foundation. |
| `react-dom` | 19.2.7 | Foundation | Browser renderer; archived `scheduler@0.27.0` satisfies its runtime dependency. |
| `vite` | 8.1.3 | Foundation | Development and build pipeline. Requires Node `^20.19.0 || >=22.12.0`. |
| `@vitejs/plugin-react` | 6.0.3 | Foundation | React integration for Vite 8. Optional compiler/Babel peers are intentionally absent and not required for the baseline. |
| `react-router-dom` | 7.18.1 | Proposed | Hash-safe routing for portable and Pages-subpath navigation. Requires Node `>=20` for tooling and React/React DOM `>18`. |

Use a Node version that satisfies the strictest archived engine range. Record the exact selected Node/npm versions when the workspace is created.

The archive's Vite/Rolldown and Lightning CSS native bindings cover Windows x64 only. On macOS, Linux, Windows ARM, or another optional toolchain, use normal package installation to obtain platform-specific dependencies.

## Reviewed Feature Candidates

| Package | Preferred archived version | Status | ManaSpec assessment |
| --- | --- | --- | --- |
| `chart.js` | 4.5.1 | Proposed | Preserve current Price History behavior. Direct React lifecycle integration is small enough to try before adding a wrapper. |
| `tabulator-tables` | 6.5.2 | Evaluate | Strong dense-grid candidate, but it is framework-neutral/imperative. Compare against the current ManaSpec contract and a React-first headless table using real Radar/Positions data. |
| `dayjs` | 1.11.21 | Evaluate | Small, dependency-free date helper. Adopt only if hold windows, parsing, stale checks, and sorting remain meaningfully clearer than pure helpers plus `Intl`. |
| `fuse.js` | 7.4.2 | Deferred | Good dependency-free fuzzy search option when cross-workflow local search is in active scope; not needed for initial shell/persistence parity. |
| `papaparse` | 5.5.4 | Deferred | Appropriate for future CSV/owned-spec backfill. Current backup JSON does not justify it. |
| `xlsx` | 0.18.5 | Deferred | Large spreadsheet-format capability and seven-package closure. Do not adopt until spreadsheet import is approved and the exact file-format/security/maintenance need is reviewed. CSV should remain the smaller first option. |
| `file-saver` | 2.0.5 | Deferred | Current Blob/object-URL download behavior may be sufficient. Adopt only if browser compatibility testing proves a gap. |
| `tippy.js` | 6.3.7 | Evaluate | Mature tooltip engine with Popper dependency, but no React wrapper is present in the archive. Use only for interactions that native titles/CSS cannot serve accessibly. |
| `sortablejs` | 1.15.7 | Deferred | Imperative drag/drop engine. No current parity requirement justifies it; a React-first accessible alternative may fit better if reorder UX is approved. |
| `uuid` | 14.0.1 | Deferred | Prefer existing stable printing identity and browser `crypto.randomUUID()` for new local IDs when supported. Add only for demonstrated fallback/format needs. |
| `lodash` | 4.18.1 | Do not adopt | The full utility package overlaps native JavaScript and small domain helpers. Reconsider only for a measured recurring need and import narrowly. |
| `micromodal` | 0.7.0 | Do not adopt | Imperative DOM modal control conflicts with React ownership. Prefer an accessible React primitive or a carefully tested native-dialog/shared component. |
| `slim-select` | 2.12.1 | Do not adopt | Imperative select enhancement lacks an archived React integration and risks split ownership of form state/DOM. |
| `animejs` | 3.2.2 | Do not adopt for parity | Animation is not a parity requirement; CSS should cover corrective transitions. Reassess only for a specific future interaction. |

`Do not adopt` is scoped to the React modernization spike, not a claim that a package is generally poor.

## Archived Version Duplicates

The archive contains older/newer pairs from prior review passes. Keep them in the ignored cache for provenance, but install only one chosen version per package:

| Package | Older archive | Preferred archive |
| --- | --- | --- |
| Chart.js | 4.4.9 | 4.5.1 |
| Day.js | 1.11.13 | 1.11.21 |
| Fuse.js | 7.1.0 | 7.4.2 |
| Lodash | 4.17.21 | 4.18.1, though current decision is not to adopt |
| MicroModal | 0.4.10 | 0.7.0, though current decision is not to adopt |
| Papa Parse | 5.5.3 | 5.5.4 |
| SortableJS | 1.15.6 | 1.15.7 |
| Tabulator | 6.3.1 | 6.5.2 |
| UUID | 13.0.0 | 14.0.1 |

Do not delete the older local tarballs merely to make the ignored cache look tidy. They cost no runtime bytes and may help reproduce GalleyFlow experiments. They should never both appear in the React dependency graph.

## Transitive Dependency Groups

These archives support direct packages and should not be evaluated as independent ManaSpec features:

| Owner | Archived closure |
| --- | --- |
| React DOM | `scheduler@0.27.0` |
| React Router | `react-router@7.18.1`, `cookie@1.1.1`, `set-cookie-parser@2.7.2` |
| Chart.js | `@kurkle/color@0.3.4` |
| Tippy.js | `@popperjs/core@2.11.8` |
| Vite | `lightningcss@1.32.0`, Windows x64 binding, `picomatch@4.0.5`, `postcss@8.5.16`, `rolldown@1.1.5`, Windows x64 binding, `tinyglobby@0.2.17`, and their archived subdependencies |
| Vite React plugin | `@rolldown/pluginutils@1.0.1` |
| XLSX | `adler-32@1.3.1`, `cfb@1.2.2`, `codepage@1.15.0`, `crc-32@1.2.2`, `ssf@0.11.2`, `frac@1.1.2`, `wmf@1.0.2`, `word@0.3.0` |

Vite's optional preprocessors, minifier, devtools, React compiler extras, macOS `fsevents`, and non-Windows native bindings are intentionally absent. They are not closure defects unless the spike selects those optional capabilities or runs on another platform.

## Important Gaps

The archive is not a complete professional-tooling set. It does not currently include the proposed linting, formatting, or test stack such as ESLint, Prettier, Vitest, Testing Library, or browser-test dependencies. It also does not include a React-first accessibility primitive library or state manager.

That is acceptable. Do not fill those gaps speculatively. Select the smallest tooling set when the React workspace is created, document it here, and obtain its complete dependency graph through the normal lockfile workflow or a deliberately refreshed offline archive.

## Adoption Record

For every adopted React dependency, add a record with:

```text
Library and version:
Status:
Purpose:
Used in:
Why selected:
Alternatives considered:
Current benefit:
Likely future benefit:
Bundle cost:
Maintenance/update cost:
Offline/portable impact:
Decision or ADR link:
```

Do not mark a library `Adopted` until it exists in the tracked lockfile, is used by the application, and has been exercised in the relevant normal and portable builds.

## Selection Rules

1. Start from this audited archive, but verify the selected version before implementation if network access is available.
2. Define the present problem and acceptance criteria.
3. Check project health, license, release cadence, React compatibility, accessibility, bundle form, and maintenance burden.
4. Compare the simplest native/React solution and at least one credible library when the choice is material.
5. Avoid overlapping libraries in state, styling, tables, dates, dialogs, notifications, icons, and animation.
6. Confirm the package bundles locally with no runtime CDN or remote font requirement.
7. Exercise both the normal Pages build and portable build.
8. Record the result here and durable architecture rationale in [DECISIONS](DECISIONS.md).

## Table Decision Worksheet

The table choice deserves a focused spike because tables carry ManaSpec's core workflow. Compare candidates using representative Radar and Positions data, not a toy table.

Score or document:

- sorting and filtering parity;
- column sizing and non-wrapping density at 1366 x 768;
- editable cells and validation;
- row actions and keyboard access;
- priority columns and expandable details at tablet/phone widths;
- virtualization behavior;
- semantic markup and screen-reader behavior;
- theming against ManaSpec tokens;
- bundle size and portable-build compatibility;
- wrapper maturity and escape hatches;
- maintenance activity and licensing.

## Local Bundling Versus CDN

The final React implementation bundles production dependencies locally. CDN delivery remains a comparison point, not the selected runtime model.

### Application Perspective

| Concern | Locally bundled | CDN-hosted |
| --- | --- | --- |
| Reliability/offline | Works with the committed artifact; no third-party runtime outage | Fails or degrades when the CDN/network is unavailable |
| Caching/performance | App controls filenames, chunking, and cache invalidation | May benefit from edge delivery, but runtime availability remains external |
| Version control | Lockfile and artifact identify the exact code | URL discipline is required; floating versions are unsafe |
| Security/privacy | Smaller runtime trust surface; dependencies still require supply-chain review | Adds third-party runtime trust, request metadata, CSP, and availability concerns |
| Deployment size | Larger project artifact | Smaller repository artifact but network transfer still occurs |
| Reproducibility | Build can be reproduced from lockfile and source | Depends on remote retention and URL stability |

### Developer Perspective

| Concern | Locally bundled | CDN-hosted |
| --- | --- | --- |
| Setup | Requires package install for development | Can be quick for prototypes |
| Dependency management | Package manager and lockfile make versions/audits explicit | Dependencies may be scattered across HTML and documentation |
| Debugging | Source maps and bundler integration are consistent | Source format and maps depend on provider |
| Updates | Controlled package update and review | URL replacement is easy to perform without complete testing |
| Build complexity | Requires a build pipeline | May avoid bundling for a small app but does not satisfy the portable/offline requirement |
| Beginner use | Committed portable output needs no npm | Requires network at runtime and is not self-contained |

## Current Decision

Production and portable React outputs will not use runtime CDNs. npm may manage and build dependencies, but delivered JavaScript, CSS, icons, fonts, and library assets must be local to the output. The ignored `/lib` archive is an offline development aid only; it is not deployed or committed.
