# React Migration And GalleyFlow Pattern Audit

Status: planning audit, not implementation.

This audit captures what was found when comparing ManaSpec's possible React migration against the local GalleyFlow project at `D:\projects\galleyflow`.

This is still a planning audit, not a decision to migrate.

## Audit Question

Would a React/Vite setup, potentially informed by GalleyFlow, make ManaSpec safer and easier to evolve after beta?

## Current ManaSpec Baseline

ManaSpec currently has:

- A static `index.html` shell.
- Ordered global scripts.
- Global runtime arrays loaded from localStorage.
- Workflow modules for Dashboard, Radar, Positions, Signals, Transactions, History, Admin, Notes, and Card Detail.
- Shared UI helpers for tables, context bands, intent modals, summary, Help, toasts, and confirmations.
- GitHub Pages deployment from the repository root.
- localStorage backup/export/import.

This is acceptable for alpha and closed beta. The app is not blocked by the lack of React today.

## GalleyFlow Findings

GalleyFlow keeps two app surfaces:

- `app/`: the existing vanilla JavaScript app and working reference.
- `react-app/`: the React + Vite migration target.

Important inspected files:

- `react-app/package.json`
- `react-app/vite.config.js`
- `react-app/vite.portable.config.js`
- `react-app/src/App.jsx`
- `react-app/src/modules.js`
- `react-app/src/components/`
- `react-app/src/App.css`
- `react-app/src/index.css`
- `docs/react-run-deploy.md`
- `docs/LIBRARIES.md`
- `docs/ARCHITECTURE.md`

Current GalleyFlow React setup:

- React `19.2.7`.
- React DOM `19.2.7`.
- Vite `8.1.x`.
- JavaScript/JSX, not TypeScript.
- `npm run dev` uses Vite bound to `127.0.0.1`.
- `npm run build` creates the normal Vite build.
- `npm run build:portable` creates `react-app/dist-portable/`.
- Vite uses `base: './'`, which supports relative assets.
- The React app currently uses hash routes and a module metadata array.
- `react-app/src/modules.js` defines labels, paths, page copy, status text, tones, and actions.
- `App.jsx` reads the hash, selects the active module, and renders a shell.
- Components are small and shell-oriented: layout, header, navigation, page header, toolbar, panels, empty state, status bar, button.
- Styling uses global CSS variables plus component classes, not a large UI framework.
- GalleyFlow docs explicitly keep the vanilla app as a reference during React migration.
- GalleyFlow docs prohibit runtime CDNs and preserve offline-first dependency discipline.

GalleyFlow's React app is not yet a full data-workflow migration. It is a useful shell/deployment/reference pattern, not proof that complex module behavior has been ported.

## Potential Benefits Of React

React may help if these problems become common:

- View state is difficult to preserve across renders.
- Event binding becomes fragile.
- Shared components drift across modules.
- Dense table behavior becomes too hard to coordinate.
- Card Detail becomes unsafe to modify.
- Derived state across Dashboard, Signals, Positions, and Radar becomes difficult to reason about.
- More tester feedback requires faster iteration without breaking unrelated workflows.

## Potential Costs

React migration would create risk:

- Behavior parity could take longer than expected.
- The current deployed beta could stall while the rewrite catches up.
- localStorage compatibility could be accidentally broken.
- Dense CSS/table behavior could regress.
- Global workflow knowledge could be lost during conversion.
- The migration could become a framework project instead of a product improvement.

## GalleyFlow Patterns Worth Considering

Good candidates for ManaSpec:

- Separate `react-app/` migration workspace while keeping the vanilla app as production/reference.
- Vite + React JavaScript setup.
- `base: './'` for relative asset safety.
- Local dev server binding to `127.0.0.1`.
- Metadata-driven module list for navigation and page identity.
- Hash navigation if ManaSpec eventually wants deep links without server routing.
- Small component shells before complex workflow ports.
- Docs that clearly say the old app is the reference, not code to mechanically copy.
- Offline/no-runtime-CDN dependency rule.
- Library inventory discipline: available does not mean integrated.

Useful but not immediately necessary:

- Portable IIFE build for double-click alpha/beta testing.
- Root launcher script for React dev server.
- Offline package archive process in `lib/`.

Not proven by GalleyFlow yet:

- Complex local data migration into React.
- Dense table parity.
- localStorage backup/import parity.
- Transaction-like ledger behavior.
- Large command-center panels like ManaSpec Card Detail.

## Fit Questions For ManaSpec

Ask these before applying GalleyFlow patterns:

- Which patterns directly solve a ManaSpec pain?
- Which patterns are overbuilt for a local-first static app?
- Can ManaSpec preserve dense table rhythm inside the same component approach?
- Can the pattern preserve localStorage compatibility and backup/import behavior?
- Does the pattern keep exact printing identity easy to trace?
- Does the pattern make Card Detail easier to split without changing behavior?
- Does the deploy setup work cleanly under `https://courtjester15.github.io/ManaSpec/`?
- Does a portable build matter for ManaSpec, or is GitHub Pages enough?
- Does hash routing add value, or does it create noise before testers ask for deep links?

## Candidate Reuse Areas

Likely useful based on the inspected GalleyFlow setup:

- Vite build and Pages deployment pattern.
- App shell/layout organization.
- Metadata-driven navigation/page identity.
- Form/input primitives.
- Component folder conventions.
- Local-only dev server discipline.
- Offline/no-runtime-CDN library policy.

Use caution with:

- Routing, unless ManaSpec needs actual URLs.
- Heavy state libraries before the data model settles.
- Large design systems that reduce table density.
- Generic table libraries before ManaSpec's custom dense table contract is fully understood.
- Any persistence pattern that assumes server state, accounts, or sync.
- GalleyFlow's portable build if ManaSpec remains hosted-first.
- GalleyFlow's shell placeholders; ManaSpec needs behavior parity, not only page scaffolds.

## ManaSpec-Specific Migration Risks

High-risk parity areas:

- Radar search and exact printing selection.
- Radar remains watched after buy.
- Buy from Radar uses execution-only quantity/price/note.
- Positions P/L and cash math.
- Sell partial/all flows.
- Notes keyed to exact tracked printing identity.
- Card Detail source-specific plan edits.
- Market Check parsing and saved observations.
- Signals exact-card/source filtering.
- Dashboard attention queues.
- Backup/export/import.
- Existing localStorage data.

These should become migration tests before a React app replaces the vanilla app.

## Possible Migration Strategy

Recommended if the project chooses to proceed:

1. Keep vanilla app as the production beta.
2. Create a branch or separate `react-app/` workspace for React, following the GalleyFlow separation pattern.
3. Build the React app shell, metadata-driven navigation, and storage service first.
4. Import existing backups into the React prototype.
5. Port Admin before product workflows.
6. Port Radar and Positions before Dashboard/Signals.
7. Port Card Detail after shared components and data helpers exist.
8. Run parity checks against the vanilla app.
9. Only switch Pages deployment after the React version can import existing data and pass core workflow smoke tests.

## Recommendation

Do not start migration before closed beta feedback.

React is likely valuable later if ManaSpec keeps growing, but the first public deployment should teach us which pain is real.

If ManaSpec migrates, reuse GalleyFlow's separation strategy, Vite setup, relative asset config, metadata-driven shell, and local/offline dependency discipline. Do not treat GalleyFlow as a complete workflow migration template; its React app is currently a clean shell, while ManaSpec's hard part is preserving localStorage-backed workflow behavior.
