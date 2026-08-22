# ManaSpec Deployment

This document defines the implemented dual-delivery model for the current vanilla app and the React implementation spike. It supplements [BETA_DEPLOYMENT](BETA_DEPLOYMENT.md), which remains the detailed guide for the authoritative vanilla closed-beta deployment.

GitHub Pages currently publishes the repository root from `main`. The vanilla application is served at `/ManaSpec/`, and the committed React review artifact is served at `/ManaSpec/react-spike/`.

## Deployment Goals

- Keep the vanilla ManaSpec application available at the existing GitHub Pages project root.
- Publish the React experiment under `/ManaSpec/react-spike/`.
- Keep React source and build failures from altering the vanilla root.
- Bundle all production dependencies locally; no runtime CDN is required.
- Provide a committed portable React artifact that opens without npm or a development server.
- Make redeploy, rollback, and spike removal explicit.

## Delivery Matrix

| Surface | Intended URL or entry | Source | Status |
| --- | --- | --- | --- |
| Vanilla production/beta | Existing GitHub Pages root | Repository root on the current vanilla deployment source | Current path; see [BETA_DEPLOYMENT](BETA_DEPLOYMENT.md) |
| React spike | `https://courtjester15.github.io/ManaSpec/react-spike/` | Committed `react-spike/` artifact on `main`, generated from the dedicated integration branch/workspace | Branch-published review path |
| React portable | `react-app/dist-portable/index.html` | Committed portable build | Generated and statically verified; prior direct-open evidence remains recorded, while current in-app policy blocks new `file://` navigation |
| React development | Local Vite URL on `127.0.0.1` | `react-app/src/` | Developer-only |

## Isolation Model

React source lives under `react-app/` on a dedicated experimental branch. The vanilla root remains build-free and reviewable throughout the experiment.

The committed branch-based Pages artifact currently has this effective shape:

```text
pages-artifact/
|-- index.html                 # vanilla app
|-- css/, js/, assets/         # vanilla runtime files
|-- other vanilla root files
`-- react-spike/
    |-- index.html             # React deployment entry
    `-- assets/                # bundled React JS/CSS/assets
```

The current implementation generates `react-app/dist/` with the Pages base path and refreshes the tracked `react-spike/` subdirectory without replacing the vanilla root. A future GitHub Actions workflow may assemble the same topology, but changing the configured Pages source remains a separately documented deployment decision.

## Developer Workflow

The verified React workspace interface is:

```text
npm run dev              # local Vite development server
npm run build            # optimized normal build
npm run build:pages      # /ManaSpec/react-spike/ Pages-path build
npm run build:portable   # file-openable committed artifact
npm run preview          # preview normal production build
npm run lint
npm run format:check
npm test
npm run test:browser     # if browser automation is adopted
npm run analyze          # if bundle analysis is adopted
```

`build:pages` now refreshes the tracked `react-spike/` directory from the successful Pages-mode `dist/` output through `tools/sync-pages.mjs`; the sync script validates the exact target before replacement so stale hashed assets do not accumulate.

Run commands from `react-app/`. Dex uses the developer workflow; users opening the committed artifact do not.

## Open ManaSpec Locally Without npm

Open the stable portable entry:

```text
react-app/dist-portable/index.html
```

The portable directory must already contain its JavaScript, CSS, and other required assets. Opening this file must not require `npm install`, a terminal command, a local server, or a CDN.

Known constraints to document and test:

- Scryfall search and price refresh still require internet access.
- Sealed catalog search is bundled into normal/Pages output as a lazy product-catalog chunk and into the portable script. Exact TCGplayer product links still require internet access.
- Browser `file://` localStorage behavior is implementation-dependent and does not share the GitHub Pages origin.
- A local portable copy will not automatically see data stored at the live Pages URL. Use Admin backup/export and restore/import to move data between origins.
- Some browsers apply stricter local-file restrictions than others. The build should remove avoidable module/CORS issues, and the validated browser list should be recorded after testing.
- If a browser still blocks a required capability that cannot be safely bundled around, the fallback may be a clearly labeled one-click local launcher. That fallback does not replace the required direct-opening test.

The committed portable output is a release artifact. Regenerate it after meaningful React changes, review its diff and size, and keep its entry path stable.

## Asset And Routing Requirements

- The normal deployment build targets the `/ManaSpec/react-spike/` base path or uses verified relative asset paths.
- The portable build uses relative asset paths.
- Hash-based application routes avoid Pages rewrite requirements and local missing-file errors.
- No source assumes the site is hosted at `/`.
- No production dependency, font, icon, or stylesheet is loaded from a runtime CDN.
- Scryfall images and API requests remain network integrations and are not described as bundled application dependencies.

## GitHub Pages Workflow

The implementation should use one reliable Pages publication path. A GitHub Actions workflow is preferred when it can assemble vanilla root files and the React subdirectory without changing the existing source layout.

Before enabling it:

1. Record the repository's current Pages source and live root URL.
2. Capture a known-good vanilla deployment reference.
3. Build and test React locally with the Pages subpath.
4. Assemble the artifact and verify that root `index.html` is vanilla and `react-spike/index.html` is React.
5. Confirm the workflow does not publish `node_modules`, React source, tests, secrets, local fixtures, or development configuration.
6. Deploy from the dedicated spike path/workflow.
7. Smoke-test both URLs and record results.

Do not change Pages settings from the confirmed `main`/repository-root branch deployment to Actions, or vice versa, without documenting the current state and rollback first.

### Committed Artifact Integrity

`npm run build:pages` regenerates `react-spike/`, writes `react-spike/artifact-manifest.json`, and verifies it before returning success. Artifact-only deployment pull requests to `main` must include that updated manifest. The guard can also be run directly when auditing an existing artifact:

```text
node tools/check-react-spike-artifact.mjs
```

The `React spike artifact` GitHub check validates the complete committed file set, canonical hashes, entry-point references, and JavaScript syntax. This protects branch-published Pages from truncated or partially uploaded bundles without rebuilding against the intentionally older React source currently present on `main`.

After merge, also open the public React URL and confirm visible application-shell content and route navigation. Successful HTTP responses alone do not prove that the JavaScript application started.

## Storage Safety Across URLs

Paths under the same scheme, host, and port share a localStorage origin. Therefore the vanilla root and `/ManaSpec/react-spike/` are expected to see the same ManaSpec keys.

Before live React testing:

1. Export a full backup from vanilla.
2. Open React and confirm it reads the same records without a startup rewrite.
3. Make a controlled fixture-backed change in React.
4. Reopen vanilla and confirm the changed record is still readable and semantically correct.
5. Restore the backup if the test was destructive.

Do not solve compatibility by prefixing all React keys and silently creating a second user-data model. A temporary test namespace is acceptable only for automated fixtures and must never be presented as production compatibility.

## Generated And Committed Files

Expected policy after the workspace is created:

- Commit React source, package manifest, lockfile, configuration, documentation, deployment workflow, and `dist-portable/`.
- Ignore `node_modules/`, normal `dist/`, coverage, reports, caches, local environment overrides, and temporary Pages assembly directories.
- Ignore the root `/lib/` offline tarball cache. Do not make the tracked lockfile depend on local `../lib/*.tgz` paths; other developers and CI must be able to resolve the declared packages normally.
- Do not store secrets in client environment files. Public client configuration is not secret merely because it uses an environment variable.
- Review portable artifacts as generated release output; do not hand-edit them.

## Deployment Validation

For every React deployment milestone, verify:

- vanilla root loads and completes its core smoke test;
- React subpath loads with correct JS, CSS, images, and hash navigation;
- committed artifact integrity check passes and deployed asset sizes/hashes match the manifest;
- refresh and back/forward navigation do not produce missing-file errors;
- no runtime CDN requests are required;
- storage compatibility and backup/restore checks pass;
- direct portable `index.html` opening passes in the documented browser(s);
- primary desktop 1920 x 1080, compatibility desktop 1366 x 768, tablet, and phone layouts are usable;
- console and network panels show no unexplained deployment errors;
- the visible React application shell renders (a `200` response or static page title alone is not a passing smoke test).

Record the actual URLs, commit, date, browser, and results in the spike progress log once deployment exists.

## Redeploy

1. Start from the dedicated React spike branch.
2. Run lint, focused tests, normal build, and portable build.
3. Perform local subpath and direct-file checks.
4. Update the committed portable artifact if behavior changed.
5. Trigger the documented Pages workflow.
6. Validate both live surfaces.

## Rollback

1. Identify the last known-good Pages artifact/workflow run.
2. Restore or redeploy that artifact without changing storage keys.
3. Verify the vanilla root first, then the React path if it remains present.
4. If React wrote incompatible data, stop normal use and restore through the documented backup path; do not clear localStorage as a casual fix.
5. Record the failure and corrective decision.

## Remove The Spike

Removing the experiment should require only:

- disabling/removing the React build step;
- omitting `react-spike/` from the Pages artifact;
- optionally deleting the experimental branch/workspace after archival;
- leaving the vanilla root and compatible user data untouched.

Removal must not delete shared localStorage keys, because those keys belong to ManaSpec user data rather than to the React implementation.
