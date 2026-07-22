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

The archive supplied the reviewed Windows x64 foundation set now used by the React implementation:

| Direct package | Archived version | Status | Purpose and notes |
| --- | --- | --- | --- |
| `react` | 19.2.7 | Adopted | Component/runtime foundation. |
| `react-dom` | 19.2.7 | Adopted | Browser renderer; archived `scheduler@0.27.0` satisfies its runtime dependency. |
| `vite` | 8.1.3 | Adopted | Development and build pipeline. Requires Node `^20.19.0 || >=22.12.0`. |
| `@vitejs/plugin-react` | 6.0.3 | Adopted | React integration for Vite 8. Optional compiler/Babel peers are intentionally absent and not required for the baseline. |
| `react-router-dom` | 7.18.1 | Adopted | Hash-safe routing for portable and Pages-subpath navigation. Requires Node `>=20` for tooling and React/React DOM `>18`. |
| `tabulator-tables` | 6.5.2 | Adopted | Shared dense-grid engine behind the ManaSpec-owned `TabulatorTable` wrapper. Radar is the Phase 1 pilot; remaining table modules intentionally retain the interim React table until Phase 2. |

Use a Node version that satisfies the strictest engine range. The tracked manifest and lockfile, not the ignored archive, are authoritative for the implemented workspace.

The archive's Vite/Rolldown and Lightning CSS native bindings cover Windows x64 only. On macOS, Linux, Windows ARM, or another optional toolchain, use normal package installation to obtain platform-specific dependencies.

## Reviewed Feature Candidates

| Package | Preferred archived version | Status | ManaSpec assessment |
| --- | --- | --- | --- |
| `chart.js` | 4.5.1 | Evaluate next phase | The compact React Price History currently uses an accessible inline SVG. Compare Chart.js when richer tooltips, scales, multiple series, or longer history make the custom chart cost visible. |
| `dayjs` | 1.11.21 | Evaluate | Small, dependency-free date helper. Adopt only if hold windows, parsing, stale checks, and sorting remain meaningfully clearer than pure helpers plus `Intl`. |
| `fuse.js` | 7.4.2 | Evaluate next phase | Good dependency-free fuzzy search candidate now that full-workflow React parity exists. Compare it against exact/subsequence helpers on real cross-workflow card, set, note, and status searches. |
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

The archive is not a complete professional-tooling set. It does not include ESLint, Prettier, Vitest, Testing Library, browser-test dependencies, a React-first accessibility primitive library, or a state manager.

The implemented workspace currently uses lightweight Node tests plus source and formatting checks instead of those larger tool stacks. That is an intentional baseline, not a claim of equivalent coverage. Add tools only when a demonstrated testing, linting, accessibility, or maintenance gap justifies their dependency and workflow cost.

## Current React Library Phase

The first migration stage and the Phase 1 Tabulator foundation are implemented. Tabulator now sits behind a ManaSpec-owned wrapper and Radar is the only migrated pilot. The next stage is selective migration and library evaluation, not a bulk replacement of working code.

Evaluate in this order:

1. Table migration Phase 2: move Positions, Signals, Transactions, and History through the established `TabulatorTable` contract one module at a time after Radar visual/interaction approval.
2. Fuse.js: adopt only if real local search becomes materially better and simpler.
3. Chart.js: adopt in React when richer price-history requirements exceed the inline SVG baseline.
4. Day.js: adopt when date parsing, windows, scheduling, or timezone behavior becomes recurring domain complexity.
5. Papa Parse: defer until CSV import/export is an approved workflow.

Every comparison must preserve the ManaSpec-facing wrapper and verify normal, Pages-subpath, and portable builds. A library becoming the likely choice is not adoption until it is tracked, used, tested, and recorded here.

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

### Tabulator 6.5.2

- Library and version: `tabulator-tables` 6.5.2.
- Status: Adopted for the shared React table foundation; Radar is the Phase 1 pilot.
- Purpose: Dense sorting, cell editing, keyboard support, column layout, and reusable grid mechanics behind a product-owned React boundary.
- Used in: `TabulatorTable` and React Radar only. Positions, Signals, Transactions, and History remain intentionally unchanged for Phase 2.
- Why selected: It reproduces the compact financial-grid contract while removing hand-built sorting/layout mechanics from feature code and provides a scalable path for later table migrations.
- Alternatives considered: The interim native React table and a React-first headless table. The interim table was useful for parity but encoded table identity through column-label matching and would require continued custom grid behavior; a second headless implementation would retain most of that custom work.
- Current benefit: Shared column configuration, sorting, display/edit cells, row activation isolation, empty state, tooltip, keyboard, and responsive behavior are centralized without exposing vendor APIs to Radar.
- Likely future benefit: Remaining table migrations should primarily supply module column/action configuration instead of rebuilding mechanics.
- Bundle cost: Modular registration adds approximately 219 KB JavaScript and 34 KB CSS uncompressed to the tracked artifacts. The final normal Pages output is 527.90 KB JavaScript (148.43 KB gzip) and 125.13 KB CSS (19.97 KB gzip); the portable IIFE is 823.23 KB JavaScript and 125.14 KB CSS.
- Maintenance/update cost: Imperative lifecycle integration and per-cell React roots remain wrapper responsibilities. Tabulator upgrades require wrapper, keyboard, responsive, normal, Pages, and portable regression checks.
- Integration discovery: Wrapper definitions must omit optional properties when ManaSpec has no value. Passing `minWidth: undefined` overrode Tabulator's native column default and converted otherwise valid fixed widths to `NaN`; preserving omitted defaults restores native `fitColumns` ownership without CSS or redraw intervention.
- Offline/portable impact: JavaScript and CSS bundle locally with no runtime CDN. Normal, Pages-subpath, and portable builds complete; the portable entry remains a deferred classic script with relative assets.
- Decision or ADR link: [DECISIONS](DECISIONS.md#tabulator-is-the-shared-react-table-engine-behind-a-manaspec-wrapper).

## Selection Rules

1. Start from this audited archive, but verify the selected version before implementation if network access is available.
2. Define the present problem and acceptance criteria.
3. Check project health, license, release cadence, React compatibility, accessibility, bundle form, and maintenance burden.
4. Compare the simplest native/React solution and at least one credible library when the choice is material.
5. Avoid overlapping libraries in state, styling, tables, dates, dialogs, notifications, icons, and animation.
6. Before adding a workaround, inspect the library's initialized configuration and runtime output; wrappers must preserve omitted defaults rather than emitting undefined optional values.
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
