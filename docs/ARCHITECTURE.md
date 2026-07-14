# ManaSpec Architecture

This document explains how ManaSpec is built internally.

It is not a code walkthrough. It is the architectural map future contributors should read before changing implementation.

## Design Philosophy

ManaSpec is a local-first MTG speculation terminal built around workflow clarity.

The architecture should stay boring until the product earns more structure:

- Prefer narrow modules over a framework rewrite.
- Keep workflow ownership visible in the code.
- Keep user-owned data safe during every change.
- Keep dense scan surfaces fast to reason about.
- Reuse and extend ManaSpec's existing UI systems before creating new ones.
- Extract shared helpers only after repeated behavior is stable.
- Do not optimize architecture ahead of beta workflow clarity.

ManaSpec currently favors explicit global scripts, plain objects, localStorage, and shared UI helpers because those choices keep the app understandable while the product shape is still settling.

## App Shell

`index.html` provides one static shell for the whole app.

The shell owns:

- App header and logo.
- Global account summary.
- Main workflow navigation.
- Global card search surface.
- Toast stack and confirmation dialog mounts.
- `#viewContainer`, where active workflow views render.
- Ordered script loading.

The shell should remain mostly static. Feature logic belongs in JavaScript modules, not in `index.html`.

ManaSpec is not currently a routed SPA. It behaves like a modular terminal where the active view is swapped inside a stable shell.

## Boot Sequence

ManaSpec loads through ordered global scripts.

Current sequence:

1. `js/core/data-foundation.js` defines pure compatibility normalizers, serialization helpers, and the read-only Transaction projector/comparison tools.
2. `js/core/storage.js` defines centralized localStorage load/save boundaries, backup, import, and restore helpers.
3. `js/core/state.js` loads normalized global runtime state from storage and runs startup backfills/enrichment.
4. Metadata, notes, filters, shared table UI, context band UI, intent modal UI, and dashboard helpers load.
5. Workflow modules load: trading, Positions, printings, search, Radar, Transactions, Signals, Thesis, History, Admin, Comparable Printings, and Card Detail.
6. Global UI/status helpers, the price snapshot foundation, vendored Chart.js, the Price History modal, and pricing refresh helpers load.
7. `js/core/app.js` initializes navigation, universal search, help, status, and the first rendered view.

Dependency rules:

- `data-foundation.js` must load before `storage.js` so core records can use read-only normalization and compatibility serialization.
- `storage.js` must load before `state.js`.
- `state.js` must load before modules that read or mutate global arrays.
- `js/ui/table.js` must load before workflow tables.
- Comparable Printings must load immediately before Card Detail; Card Detail must load after tracked-card, note, market observation, and target helper dependencies are available.
- Price snapshots must load before Price History; the local Chart.js UMD build must load before the Price History modal; pricing refresh loads after both.
- `app.js` stays last because it calls `initApp()` immediately.

Chart.js 4.5.1 is vendored at `assets/vendor/chart.js/` for the reusable Price History line chart. It is loaded locally, works offline, and does not introduce a framework or CDN runtime dependency.

Do not convert to ES modules until dependency boundaries are documented and the beta workflow is stable.

## Runtime State

ManaSpec currently uses global runtime state loaded from browser localStorage:

- `specs`: owned Positions.
- `radar`: watched Radar ideas.
- `transactions`: early ledger events.
- `cardNotes`: notes keyed to exact tracked printing identity.
- `signals`: legacy saved signal records preserved for compatibility/backups; the active Signals view is computed from Radar, Positions, prices, plans, and market-check state.
- `thesisNotes`: archived/retired thesis data.
- `cash`: available cash.
- `priceSnapshots`: dated price snapshots.
- `priceRefreshStatus`: last refresh metadata.
- `marketObservations`: saved market checks.

This state model is transitional. It is acceptable for alpha because it keeps the app local and inspectable, but Positions should eventually become a computed view from transaction events.

## Module Ownership

Core modules own app-level mechanics:

- `js/core/storage.js`: localStorage safety, backup/export/import, and persistence helpers.
- `js/core/state.js`: startup state loading, current global arrays, startup migrations, and transaction enrichment/backfill.
- `js/core/app.js`: navigation, active view switching, universal search, confirmation/toast helpers, and app boot.

Shared UI modules own reusable surfaces:

- `js/ui/table.js`: shared financial table markup contract, sorting hooks, pagination controls, editable cells, row actions, and table escape helpers.
- `js/ui/context-band.js`: compact module context bands above workflow tables.
- `js/ui/intent-modal.js`: reusable intent/modal UI.
- `js/ui/summary.js`: global account summary.
- `js/ui/help.js`: contextual help drawer.

Workflow modules own user workflows:

- Dashboard: current awareness and next-action summary.
- Radar: discovery, exact printing selection, watched ideas, entry planning, and planned quantity.
- Positions: owned holdings, exit planning, active management, buy/sell/delete actions, and current value.
- Signals: computed read-only attention layer with bucket filters, exact-card filters, and source navigation back to Radar or Positions.
- Card Detail: command center for one exact tracked printing, canonical plan edits, and runtime-only same-Oracle printing research.
- Transactions: early ledger event surface.
- History: review trail across transactions, Radar, and notes.
- Admin: local data safety and maintenance tools.
- Notes: shared note helpers for exact tracked printings.

Archived or legacy modules may remain present, but active docs and active navigation define current product truth.

## Current Data Flow

The current flow is direct and local:

1. User action occurs in a workflow module.
2. The module updates global state or calls a storage helper.
3. localStorage is updated.
4. The affected view re-renders.
5. Shared summary, signals, history, or table views read the updated state when next rendered.

Important current flows:

- Radar search reads Scryfall, lets the user choose an exact printing, then stores a Radar item.
- Buying from Radar creates or updates an owned Position, logs a transaction when available, and keeps the Radar item watched.
- Buying or selling from Positions mutates current position state and logs transaction events.
- Card Detail edits canonical plan fields on the source Radar item or Position.
- Notes are stored outside Radar/Positions rows so they survive sell/rebuy workflows.
- Market Check saves pasted market observations locally for the tracked printing.
- Dashboard and Signals compute attention queues from local plan, price, hold, note, and market-check state; Dashboard rows open work destinations, while Signals rows filter the inspection table.

This model intentionally avoids hidden synchronization layers. If a future store, event bus, database, or module loader is introduced, it should make these flows clearer, not more opaque.

## Rendering Flow

Workflow views render into `#viewContainer`.

`setActiveView()` in `js/core/app.js` chooses the active workflow and calls the matching render function.

Most workflow modules follow this pattern:

- Build a module shell with heading, context band, filters, controls, and a mount point.
- Bind controls after injecting markup.
- Filter, sort, and paginate local rows.
- Render rows through `renderStandardTable()` or a workflow-specific compact layout.
- Re-render the affected list/table after state changes.

Shared tables use `js/ui/table.js` for markup and event binding. Modules still own their own columns, sort state, filter state, count text, and row actions.

## Storage Ownership

localStorage is the current persistence layer.

Storage ownership rules:

- Storage keys are compatibility boundaries.
- Do not rename storage keys for aesthetics.
- Backup/import behavior must protect current local user data.
- Unknown backup fields should not break import.
- Import is replace-only unless a future migration explicitly changes that rule.
- Ledger migration must be planned before storage behavior changes.

`js/core/storage.js` owns normal load/save boundaries for `specs`, `radar`, `transactions`, and `cash`, plus backup safety. Workflow modules route those core records through `loadSpecs()`, `loadRadar()`, `loadTransactions()`, `loadCash()`, `saveSpecsState()`, `saveRadarState()`, `saveTransactionsState()`, and `saveCashState()`.

Core load boundaries use `js/core/data-foundation.js` as a read adapter. Compatibility metadata is kept outside serialized record fields. Unchanged normalized records serialize to their original compatible shape; real workflow edits are merged over the original raw record so unknown fields survive and future/default fields are not added accidentally.

Full backup restore and emergency rollback intentionally write the allowlisted keys directly because restore is a confirmed replacement operation, not a normal workflow save. UI preferences, price snapshots, refresh status, notes, and market observations retain their existing owning boundaries and are outside the core centralization batch.

### Beta Storage Compatibility

Once ManaSpec has external GitHub Pages users, localStorage compatibility is part of the product contract.

Changing application code is easy; changing a user's stored browser data safely is not. Treat localStorage keys and data shapes as compatibility boundaries during every beta update.

Avoid:

- Renaming storage keys casually.
- Renaming important data fields without planning.
- Deleting fields without considering existing users.
- Breaking older saved data during normal application updates.

When a future change requires modifying stored data:

- Decide whether backward compatibility is needed.
- Prefer a small migration over silently breaking user data.
- Ensure JSON backup/export/import continues to work.
- Test existing saved data before release.

ManaSpec data schema version `1` is now explicit and distinct from backup-envelope schema version `1`. New backups record both versions. Unversioned backups remain accepted as legacy version-1 data; future unsupported versions are rejected before restore. Migration code must remain explicit, fixture-backed, and separate from normal load normalization.

Migration fixtures live under `test-fixtures/migrations/`. Every future data-schema change must retain an unmodified fixture for each supported source version, an expected migrated shape, idempotence coverage, backup round-trip coverage, and a future-version rejection case. Normal app startup must not claim a migration version or rewrite stored data unless that migration has been separately approved.

## Shared UI Systems

ManaSpec has a few shared UI systems that should be treated as app-level contracts:

- Standard tables.
- Module context bands.
- Dashboard/Signals attention queue rows.
- Global summary.
- Toast notices.
- Confirmation dialog.
- Help drawer.
- Card Detail modal.
- Card art preview.

Changing any shared UI system can affect multiple workflows. Table changes are especially broad because Radar, Positions, Signals, Transactions, and History all rely on the shared dense-table rhythm.

## UI Reuse-First Architecture

New features must begin with ManaSpec's existing visual and interaction language. Before writing new markup or CSS, inspect the application for an existing component, helper, class, or pattern that already solves most of the problem.

Use this order:

1. Reuse an existing ManaSpec component or pattern.
2. If it solves most of the need, add a scoped variation instead of duplicating it.
3. Use an existing project library when it meaningfully reduces infrastructure work.
4. Build a completely new UI implementation only when no shared component, reasonable extension, or existing library fits. Document why.

The reuse inventory includes, but is not limited to:

- Standard tables, context bands, modal layouts, and row actions.
- Buttons, action links, badges, icons, and status indicators.
- Loading, empty, confirmation, toast, pagination, and Show More patterns.
- Typography, spacing, colors, borders, hover states, and header hierarchy.
- Financial formatting and other shared display helpers.

An existing solution that covers roughly 80% of a feature's need should normally be extended. For example, prefer a scoped Comparable Printings variation of the standard table over a second table system.

This is an architectural maintainability rule, not an aesthetic preference. A smaller set of mature shared systems is preferable to many slightly different implementations. New features should strengthen those systems and feel as though they have always belonged beside Radar, Positions, Signals, Transactions, History, and Card Detail.

Every feature design review must record:

- Which existing components and visual patterns were reused.
- Which existing CSS classes or helpers were reused or extended.
- Whether an existing library simplified the implementation; if not, why not.
- What completely new UI was introduced and why extension was not reasonable.
- Whether the result matches the established workflows in color, typography, spacing, alignment, borders, density, financial formatting, controls, hover behavior, loading and empty states, modal rhythm, and header hierarchy.

## Table Architecture

`js/ui/table.js` owns the standard table markup contract.

Modules provide:

- Rows.
- Column definitions.
- Sort state.
- Sort handlers.
- Input handlers.
- Action handlers.
- Row click handlers.
- Empty-state copy.
- Table-specific classes.

The table renderer owns:

- Header and row markup.
- Sort button wiring.
- Editable-cell display/input switching.
- Stepper controls.
- Row action dispatch.
- Pagination page-size controls.
- Standard alignment classes.
- Standard sort helpers.

Tables are not a generic data-grid framework. They are a ManaSpec-native scan surface optimized for laptop-first financial workflows.

## Card Detail Ownership

Card Detail is the command center for one exact tracked printing.

It owns:

- Opening tracked printing context from Radar, Positions, or Signals.
- Rendering printing identity, current status, Plan, Market Check, Market Evaluation, Notes, Actions, and reference data.
- Editing canonical plan fields on the source Radar item or Position.
- Adding notes through shared exact-printing note helpers.
- Saving market observations for the current printing.
- Showing observable market evaluation without producing buy/sell recommendations.
- Loading and presenting finish-aware, paper-only comparable printings from Scryfall without persisting them.

Card Detail does not own separate planning state. If a field belongs to the card plan, it should update the canonical Radar item or Position.

Card Detail is a known pressure point. It should not be split by line count alone. After beta, extract pure helpers first: plan parsing, hold-time parsing, target state, market observation parsing, market evaluation, and shared formatting.

## Ledger Migration Overview

The current data model is transitional:

- Positions are stored directly in `specs`.
- Transactions are stored in `transactions`.
- Startup backfills create opening transaction rows for current owned Positions when needed.
- Buy/sell flows already log events, but Positions are still directly mutated.

Future direction:

- Transactions become the durable source of truth for ownership events.
- Positions become computed current holdings.
- History becomes a review surface over ledger events, notes, and outcomes.
- Radar remains separate watched/pre-purchase state.
- Notes remain keyed to exact printing identity.

Do not implement a full ledger-source-of-truth migration without a written migration plan and backup/import safety review.

## Future Architectural Direction

Likely future cleanup, after beta workflow stability:

- Extract pure Card Detail helpers.
- Add a small shared formatting/parsing utility.
- Normalize repeated table workflow glue where repetition is stable.
- Write and execute a ledger migration plan.
- Decide whether dormant bulk lookup belongs in Admin/backfill or should be removed.
- Revisit ES modules only after dependencies are mapped.
- Consider stronger storage only after the entity model is clear.

Architecture work should make ManaSpec easier to use, test, and reason about. It should not become a parallel project.
