# React Migration Notes

These notes preserve the React migration idea without starting the migration.

ManaSpec is currently a working vanilla HTML/CSS/JavaScript app deployed through GitHub Pages. The beta priority remains workflow validation, tester feedback, and localStorage data safety. React should be treated as a possible future implementation upgrade, not the next default step.

## Current Position

ManaSpec has enough product shape to benefit from better structure later:

- App shell, navigation, summary, toast, confirmation, and Help are repeated app-level surfaces.
- Radar, Positions, Signals, Transactions, History, Admin, and Card Detail are clear workflow zones.
- Shared table rendering and dense controls are already acting like component contracts.
- Storage keys, backup/import, and user data safety are now product contracts.

The main risk is behavioral parity. The app's value is not just its screens; it is the exact workflow behavior around Radar, Positions, Card Detail, notes, market checks, transactions, backup/import, and localStorage compatibility.

## Why React Might Help Later

A React conversion could help if ManaSpec starts hitting these limits:

- View rendering and event binding become hard to reason about.
- Shared UI behavior is duplicated across modules.
- Card Detail becomes too large to maintain safely.
- Tables need stronger state handling, pagination, sorting, filtering, or editing contracts.
- Storage and derived state need clearer boundaries.
- More beta users expose workflow bugs caused by implicit global state.

React would not automatically improve the product. It would mainly make state, components, and data flow more explicit if the migration is done carefully.

## Why Not Yet

Do not start the React migration before beta feedback unless there is a specific blocker.

Reasons:

- The current app is deployed and usable.
- Beta testers can now produce real workflow feedback.
- React migration would compete with learning from the current product.
- Behavior parity is more expensive than component creation.
- localStorage compatibility must be preserved.
- The current vanilla app is still small enough to reason about.

The safer path is to validate the workflow first, then decide whether React solves real pain.

## Migration Shape

If ManaSpec migrates later, prefer a staged rewrite rather than a full replacement.

1. Create a React/Vite prototype in a branch or separate workspace.
2. Preserve the current localStorage keys and backup format.
3. Recreate the app shell first: header, navigation, summary, toast, confirmation, Help, and active view mount.
4. Convert Admin early because it validates storage, backup, import, and version behavior.
5. Convert one workflow at a time.
6. Keep Radar and Positions behavior stable before touching Signals and Dashboard.
7. Convert Card Detail late, after smaller shared pieces are extracted.
8. Compare against the vanilla app using a parity checklist before replacing the deployed app.

## Suggested Conversion Order

1. Project shell and deployment setup.
2. Storage service: load, save, backup, import, localStorage compatibility.
3. App shell: navigation, summary, toast, confirmation, Help.
4. Admin: backup/export/import and cash reset.
5. Shared primitives: money formatting, inputs, target editors, note indicators, market-check summary.
6. Radar: search, exact printing selection, add-to-Radar, planned quantity, entry target.
7. Positions: holdings table, buy/sell/delete, target/hold edits, P/L.
8. Transactions and History.
9. Signals and Dashboard.
10. Card Detail command center.

Card Detail should not be first. It touches too many product contracts.

## Data Compatibility Rules

The React version should initially read and write the same storage keys:

- `specs`
- `radar`
- `transactions`
- `cardNotes`
- `thesisNotes`
- `signals`
- `cash`
- `priceSnapshots`
- `priceRefreshStatus`
- `marketObservations`
- `cardDetailNotesExpanded`
- `manaspec_pre_import_backup`

Do not use the React migration as an excuse to rename keys, silently drop fields, or change backup shape. If a migration is needed, write it explicitly and test old backups.

## Component Candidates

Likely reusable components:

- App shell
- Header summary
- Navigation toolbar
- Toast stack
- Confirmation dialog
- Help drawer
- Context band
- Standard table
- Table pagination/page-size control
- Money input
- Quantity stepper
- Target editor
- Hold-time editor
- Intent modal
- Card art preview
- Card Detail sections
- Note indicator and note editor
- Market Check panel
- Backup preview

## Library Candidates

Possible future choices, to be decided only after beta needs are clearer:

- Vite for a light React build.
- React Router only if ManaSpec earns real URLs or deep links.
- Zustand or a small reducer/store if state coordination becomes painful.
- TanStack Table only if the current table contract becomes too costly to maintain.
- Dexie.js only when localStorage is no longer enough and the ledger shape is clear.
- Day.js for date/hold/stale-check behavior if native date handling becomes repetitive.
- Fuse.js for local fuzzy search across stored ManaSpec data.
- Papa Parse for CSV/backfill work after the owned-spec import shape is validated.

Avoid adding libraries simply because React exists. Every library should remove real complexity or protect data/workflow behavior.

## GalleyFlow Pattern Review

GalleyFlow was inspected at `D:\projects\galleyflow`.

Useful GalleyFlow patterns:

- Keep the vanilla app as the working reference while building React separately.
- Use `react-app/` as an npm-managed React + Vite workspace.
- Use JavaScript/JSX, not TypeScript, to keep migration friction low.
- Bind Vite dev and preview servers to `127.0.0.1`.
- Use `base: './'` so built assets are relative and portable.
- Keep runtime CDNs out of the React app.
- Start with a module/navigation shell before rebuilding heavy workflows.
- Store module metadata in one array and render navigation/page headers from it.
- Use small shell components such as `AppLayout`, `Header`, `Navigation`, `PageHeader`, `Toolbar`, `Panel`, `EmptyState`, `StatusBar`, and `Button`.
- Preserve a portable build option for non-developer testing.

GalleyFlow patterns to adapt carefully:

- GalleyFlow uses hash routing (`#/home`, `#/menus`, etc.). ManaSpec does not need routes today, but hash routes could become useful if testers need shareable workflow URLs or if React needs stable navigation state.
- GalleyFlow's current React app is mostly a shell with placeholders. It is useful for project setup and layout patterns, not for complex data workflows yet.
- GalleyFlow's portable build emits classic browser JavaScript for double-click `index.html` testing. ManaSpec is already hosted on GitHub Pages, so this is optional rather than core.
- GalleyFlow's docs emphasize offline-first package discipline. ManaSpec can reuse that mindset but should not copy the offline tarball archive process unless dependency management becomes a real need.
- GalleyFlow does not yet prove how to migrate complex localStorage/data workflows into React; ManaSpec would still need its own storage and parity plan.

Best-fit reuse for ManaSpec:

- React/Vite shell setup.
- `base: './'` relative asset configuration.
- Hash-routing approach only if ManaSpec wants deep links.
- Metadata-driven module list for navigation and page titles.
- Small component organization.
- Local-only dev server scripts.
- Docs discipline around vanilla reference versus React target.

Poor-fit or defer:

- Portable double-click build as a primary target.
- Routing before ManaSpec has a user-facing reason.
- Large dependency archive workflow.
- Generic placeholder page patterns beyond the earliest shell.
- Any migration that treats vanilla code as mechanical copy/paste instead of behavior reference.

## Parity Checklist

Before a React version can replace the vanilla app:

- Existing backups import successfully.
- Existing localStorage data loads without manual conversion.
- Radar search and exact printing selection work.
- Radar add/buy/remove behavior matches current app.
- Positions buy/sell/delete and P/L behavior match current app.
- Notes survive buy, sell, close, and rebuy flows.
- Card Detail edits the correct source item.
- Market Check parsing and saved observations still work.
- Signals, Dashboard, Transactions, and History show the same expected state.
- Admin export/import remains safe and understandable.
- GitHub Pages project-path deployment works.
- Dense table layout remains usable at laptop width.

## Recommendation

Do not start React migration as part of closed beta deployment.

Use beta feedback to decide whether the migration is worth it. If the app's pain is mostly workflow wording, table layout, or small localStorage safeguards, stay vanilla longer. If the pain becomes state coordination, duplicated UI behavior, or risky cross-module edits, React becomes more attractive.

The best near-term move is to keep these notes, run beta, then revisit GalleyFlow's shell/deploy patterns with real ManaSpec pain in hand.
