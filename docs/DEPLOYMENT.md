# ManaSpec Deployment

This document defines the intended dual-delivery model for the current vanilla app and the experimental React spike. It supplements [BETA_DEPLOYMENT](BETA_DEPLOYMENT.md), which remains the detailed guide for today's vanilla closed-beta deployment.

The React deployment described here is a target until its workflow and live URLs are implemented and verified. Do not present planned deployment as already live.

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
| React spike | Existing root plus `react-spike/` | `react-app/dist/` generated from the dedicated spike branch/workspace | Planned; verify after implementation |
| React portable | `react-app/dist-portable/index.html` | Committed portable build | Planned; must be tested directly |
| React development | Local Vite URL on `127.0.0.1` | `react-app/src/` | Developer-only |

## Isolation Model

React source lives under `react-app/` on a dedicated experimental branch. The vanilla root remains build-free and reviewable throughout the experiment.

The Pages artifact should have this effective shape:

```text
pages-artifact/
|-- index.html                 # vanilla app
|-- css/, js/, assets/         # vanilla runtime files
|-- other vanilla root files
`-- react-spike/
    |-- index.html             # React deployment entry
    `-- assets/                # bundled React JS/CSS/assets
```

The deployment workflow should assemble that artifact in a temporary/generated location. It must not copy React output over the working-tree root or commit mixed Pages artifacts as application source.

## Developer Workflow

The exact npm scripts are added and verified with the React workspace. The intended interface is:

```text
npm run dev              # local Vite development server
npm run build            # optimized Pages-compatible build
npm run build:portable   # file-openable committed artifact
npm run preview          # preview normal production build
npm run lint
npm run format:check
npm run test
npm run test:browser     # if browser automation is adopted
npm run analyze          # if bundle analysis is adopted
```

Run commands from `react-app/`. Dex uses the developer workflow; users opening the committed artifact do not.

## Open ManaSpec Locally Without npm

After the portable artifact exists, open:

```text
react-app/dist-portable/index.html
```

The portable directory must already contain its JavaScript, CSS, and other required assets. Opening this file must not require `npm install`, a terminal command, a local server, or a CDN.

Known constraints to document and test:

- Scryfall search and price refresh still require internet access.
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

Do not change Pages settings from branch deployment to Actions, or vice versa, without documenting the current state and rollback first.

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
- refresh and back/forward navigation do not produce missing-file errors;
- no runtime CDN requests are required;
- storage compatibility and backup/restore checks pass;
- direct portable `index.html` opening passes in the documented browser(s);
- desktop 1366 x 768, tablet, and phone layouts are usable;
- console and network panels show no unexplained deployment errors.

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
