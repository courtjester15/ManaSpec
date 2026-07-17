# React Local Package Archive Audit

Date: 2026-07-15

Status: completed local manifest and dependency-closure review

Authority: diagnostic evidence. Active dependency status and policy live in [Libraries](../LIBRARIES.md).

## Audit Question

Does the `/lib` archive copied from GalleyFlow contain the reviewed React/library candidates and the dependencies required to use them as a Windows x64 offline starting point for the ManaSpec React spike?

## Method

- Enumerated every `.tgz` file under `/lib`.
- Extracted `package/package.json` from every archive without installing it.
- Recorded package name, exact version, license, Node engine, direct dependencies, peer dependencies, optional dependencies, and peer optionality where relevant.
- Matched every required dependency to an archived package/version.
- Separated direct feature candidates from transitive build/runtime closure.
- Compared the candidates to current ManaSpec parity needs and the React architecture rules.

This was a local archive review. It did not install packages, run their code, verify current upstream release/security status, or prove portable-build compatibility. Those checks occur when a candidate is selected.

## Result

The archive is internally coherent for the reviewed Windows x64 baseline:

- All 50 package tarballs yielded readable manifests.
- React 19.2.7 and React DOM 19.2.7 have their required Scheduler dependency.
- React Router DOM 7.18.1 has React Router, cookie parsing, and peer requirements represented.
- Vite 8.1.3 and the React plugin have the required JavaScript dependencies plus Windows x64 Rolldown and Lightning CSS bindings.
- Chart.js, Tippy.js, and XLSX have their required dependency closures.
- Standalone reviewed utilities declare no missing runtime dependency.
- Omitted Vite peers are marked optional by Vite.
- Omitted React compiler/Babel peers are marked optional by the React plugin.
- Omitted native packages are for other operating systems/architectures or optional toolchains.

The archive should not be described as cross-platform complete. It is deliberately Windows x64 oriented.

## Direct Packages And Disposition

| Package | Versions present | Disposition |
| --- | --- | --- |
| React | 19.2.7 | Foundation |
| React DOM | 19.2.7 | Foundation |
| Vite | 8.1.3 | Foundation |
| Vite React plugin | 6.0.3 | Foundation |
| React Router DOM | 7.18.1 | Proposed for hash routing |
| Chart.js | 4.4.9, 4.5.1 | Use 4.5.1 direction; current vanilla dependency |
| Tabulator | 6.3.1, 6.5.2 | Evaluate 6.5.2 against current and React-first tables |
| Day.js | 1.11.13, 1.11.21 | Evaluate 1.11.21 only if date helpers earn it |
| Fuse.js | 7.1.0, 7.4.2 | Defer 7.4.2 until fuzzy search scope |
| Papa Parse | 5.5.3, 5.5.4 | Defer 5.5.4 until CSV/backfill scope |
| XLSX | 0.18.5 | Defer; review carefully before spreadsheet support |
| FileSaver.js | 2.0.5 | Defer; test native download path first |
| Tippy.js | 6.3.7 | Evaluate narrowly; no React wrapper archived |
| SortableJS | 1.15.6, 1.15.7 | Defer; imperative and no parity need |
| UUID | 13.0.0, 14.0.1 | Defer; prefer existing identities/`crypto.randomUUID()` |
| Lodash | 4.17.21, 4.18.1 | Do not adopt wholesale |
| MicroModal | 0.4.10, 0.7.0 | Do not adopt for React ownership |
| Slim Select | 2.12.1 | Do not adopt for React ownership |
| Anime.js | 3.2.2 | Do not adopt for parity |

## Dependency Closure

### React

- `react-dom@19.2.7` -> `scheduler@^0.27.0`; archive contains `0.27.0`.
- React DOM peers on `react@^19.2.7`; archive contains `19.2.7`.

### React Router

- `react-router-dom@7.18.1` -> `react-router@7.18.1`; present.
- `react-router@7.18.1` -> `cookie@^1.0.1`; archive contains `1.1.1`.
- `react-router@7.18.1` -> `set-cookie-parser@^2.6.0`; archive contains `2.7.2`.
- React and React DOM peer ranges are satisfied by 19.2.7.

### Vite And React Plugin

- `vite@8.1.3` -> Lightning CSS, Picomatch, PostCSS, Rolldown, Tinyglobby; all present.
- PostCSS -> Nano ID, Picocolors, Source Map JS; all present.
- Tinyglobby -> Fdir and Picomatch; present. Fdir's Picomatch peer is optional and Picomatch is already present.
- Rolldown -> OXC project types and Rolldown plugin utilities; present.
- Windows x64 native bindings for Rolldown and Lightning CSS are present.
- `@vitejs/plugin-react@6.0.3` -> Rolldown plugin utilities and peers on Vite 8; present.
- Vite optional peers for preprocessors, minification, devtools, TypeScript helpers, and other formats are intentionally absent.
- React compiler and Rolldown Babel plugin peers are optional and intentionally absent.

The strictest engine requirement in the foundation is Node `^20.19.0 || >=22.12.0`.

### Feature Libraries

- `chart.js@4.5.1` -> `@kurkle/color@^0.3.0`; archive contains `0.3.4`.
- `tippy.js@6.3.7` -> `@popperjs/core@^2.9.0`; archive contains `2.11.8`.
- `xlsx@0.18.5` -> Adler-32, CFB, Codepage, CRC-32, SSF, WMF, Word; compatible archives are present.
- CFB -> Adler-32 and CRC-32; present.
- SSF -> Frac; present.

## License Snapshot

Manifest-declared licenses are permissive for the reviewed candidates and closure: primarily MIT, Apache-2.0, ISC, and BSD-3-Clause. Lightning CSS and its native binding declare MPL-2.0.

This snapshot is not a substitute for release packaging review. When dependencies are adopted, preserve required license notices and generate/review a production third-party notice inventory.

## Risks And Caveats

- Local presence does not prove upstream currency, security, or maintenance health.
- The archive includes old/new duplicate versions; installing by wildcard or directory is unsafe.
- The cache is Windows x64 specific for native build packages.
- `xlsx@0.18.5` brings a comparatively broad legacy-format dependency group and should not enter parity work without a live spreadsheet requirement.
- Tabulator, MicroModal, Slim Select, SortableJS, Tippy.js, and Anime.js are framework-neutral/imperative. React integration can create split DOM ownership unless wrapped carefully.
- No React-specific Tippy wrapper is archived.
- Professional lint/test/format dependencies are not included.
- An install generated directly from local file paths can produce a non-portable lockfile. Normalize the tracked manifest/lockfile to ordinary package resolution.

## Repository Decision

Keep `/lib` physically unchanged and ignored by Git. Categorization belongs in [Libraries](../LIBRARIES.md), not in subfolder moves. The React workspace will commit its package manifest, lockfile, source, licenses/notices, and required portable output. It will not commit the entire offline tarball cache or extracted dependency trees.
