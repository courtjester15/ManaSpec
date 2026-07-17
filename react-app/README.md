# ManaSpec React Modernization Spike

This workspace contains the experimental React reconstruction of ManaSpec. The vanilla application at the repository root remains the current production/beta source of truth.

## Open ManaSpec Locally Without npm

Open this committed file in a browser:

```text
react-app/dist-portable/index.html
```

The portable build contains its required React, routing, JavaScript, CSS, and ManaSpec assets. It does not require `npm install`, an npm command, a terminal, a development server, or a runtime CDN.

Scryfall search, card images, and price refresh still require internet access. Browser storage under `file://` is separate from the live GitHub Pages origin and may vary by browser. Use ManaSpec backup/export and restore/import to move data between origins.

## Developer Workflow

Requirements:

- Node `^20.19.0 || >=22.12.0`
- npm compatible with the committed lockfile

From `react-app/`:

```text
npm install
npm run dev
npm run build
npm run build:pages
npm run build:portable
npm run lint
npm run format:check
npm test
```

Build outputs:

- `dist/` is the ignored normal/Pages output.
- `dist-portable/` is the committed classic-script portable output.
- The Pages build uses `/ManaSpec/react-spike/` as its base path.

Do not edit `dist-portable/` manually. Regenerate and review it after meaningful source changes.

## Offline Package Archive

The ignored root `/lib` directory can bootstrap development when registry access is unavailable. It is not the canonical dependency declaration and must not appear as a `file:../lib/...` resolution in the tracked manifest or lockfile. See `docs/LIBRARIES.md` from the repository root.
