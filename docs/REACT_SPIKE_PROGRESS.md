# React Spike Progress And Validation Log

This document records implementation milestones and evidence for the React reconstruction and likely forward frontend candidate. It does not redefine current vanilla behavior or authorize production cutover.

The point-in-time [Vanilla vs React Workflow and CSS Audit](audits/vanilla-react-workflow-css-audit-2026-07-21.md) identifies the current critical and high-priority parity blockers. Earlier milestone evidence below records what was implemented and validated at that time; it is not a later declaration that workflow, data-semantic, or release parity is complete.

## 2026-07-16: Workspace And Build Foundation

Implemented:

- Dedicated `codex/react-modernization-spike` branch.
- Isolated `react-app/` React 19 + Vite 8 workspace.
- Hash-based workflow routes and a recognizable ManaSpec application shell.
- Copied ManaSpec design tokens and active CSS into the isolated workspace as the initial fidelity baseline.
- Removed the React runtime's dependency on the vanilla Pico CDN by adding local reset/control foundations.
- Normal relative-asset build and `/ManaSpec/react-spike/` Pages build mode.
- Classic-script, single-bundle portable build with committed `dist-portable/index.html`.
- Local package manifest/lockfile using normal package names rather than private `/lib` paths.
- Source-policy and basic format checks.

Validated:

- Normal Vite production build completes.
- `/ManaSpec/react-spike/` Pages-mode build completes with the configured project base path.
- Portable IIFE/classic-script build completes.
- Portable HTML contains a normal script rather than `type="module"`, uses relative local assets, and contains no runtime CDN reference.
- Source-policy and format checks pass.

Open validation:

- Direct `file://` browser launch remains pending manual/supported-browser validation. The Codex in-app browser policy blocks navigation to local file URLs, so build inspection alone is not recorded as proof.
- Direct local-server access was established in the later workflow milestone below.

## 2026-07-16: End-To-End React Workflow

Implemented:

- Compatibility-normalized state provider and localStorage adapter for current positions, Radar, transactions, notes, legacy signals, thesis notes, cash, snapshots, refresh status, and market observations.
- Replace-only backup preview/restore with future-schema rejection and an emergency pre-import backup.
- Shared native dialogs, notices, metric bands, filters, responsive tables, loading/empty states, and global error boundary.
- Complete Radar discovery flow using Scryfall exact-name or exact set/collector lookup, exact printing/finish selection, plan edits, removal, and buy promotion.
- Positions buy/add, partial/full sell, weighted average cost basis, cash updates, automatic position closure, and ledger writes.
- Transactions, unified trade/note History, computed Signals, Dashboard triage, and read-only ledger reconciliation.
- Exact-printing Card Detail with shared notes, compatible price history, comparable printings, Scryfall/TCGplayer links, and manual TCGplayer observations.
- Admin price refresh with daily compatible snapshots, cash reset, export/import, counts, storage guidance, and reconciliation status.
- Help drawer and intentional desktop/tablet/phone CSS behavior, including stacked mobile records rather than a squeezed desktop table.

Validated:

- Thirteen focused Node tests pass: backup compatibility/safety, unknown-field preservation, portfolio math, atomic Radar buy, weighted cost basis, partial/full sells, realized P/L, foil printing identity, card-name/set-number parsing, and portable HTML finalization.
- Source-policy and format checks pass.
- Normal, `/ManaSpec/react-spike/` Pages, and portable IIFE builds complete.
- Browser smoke tests render the existing stored ManaSpec data and pass all seven routes.
- Browser checks exercise Positions, the sell confirmation, Card Detail, legacy-record comparable fallback, Admin, and the error boundary.
- Desktop visual review confirms the ManaSpec shell, information density, financial formatting, tables, and dashboard remain recognizable.
- Live search testing exposed a plain-name query mismatch; the request now uses Scryfall's exact-name paper-printing grammar.

Open validation:

- Perform direct `file://` launch manually because the in-app browser policy rejects local-file navigation; the regenerated artifact has a classic script, relative CSS/assets, no CDN URL, no `import.meta`, and no source-map reference.
- A Pages publication workflow and live URL are intentionally not enabled by this spike branch.
- Representative tablet/phone rules are implemented, but a second manual device/browser pass remains appropriate before calling the spike production-ready.

## 2026-07-17: Portable Bootstrap Correction

- Corrected the portable HTML finalizer to add `defer` when converting Vite's module entry into a classic script. Without it, the head script executed before `<div id="root">` existed and produced a blank page.
- Added regression coverage for deferred execution and idempotent finalization.
- Regenerated `dist-portable/` and verified the entry now uses `<script defer src="./assets/manaspec.js"></script>`.

## 2026-07-17: Broad UI Reconstruction And Workflow Pass

Implemented:

- Reconstructed all seven React workflow routes with the recognizable ManaSpec shell, summary, navigation, context bands, filters, tables, dialogs, and route actions.
- Wired row-level Card Detail opening across applicable workflow tables while isolating inline action controls from accidental row activation.
- Restored Dashboard scan queues, Radar and Positions workflow actions, computed Signals, ledger/history review, Help, and Admin safety utilities through the shared React state and persistence boundaries.
- Kept vanilla behavior, terminology, exact-printing identity, storage keys, and backup shape as the parity oracle.

Validated:

- Thirteen focused tests, source-policy checks, format checks, normal build, Pages-mode build, and portable build pass.
- All routes and core buy/sell/detail interactions were exercised with fixture-backed browser data.
- Pages and portable artifacts were regenerated and committed with the React source.

## 2026-07-17: Tables And Card Detail Correction

- Corrected the shared React table contract to 27 px body rows, 20 px controls, compact padding, single-line card identity, stable printing columns, horizontal-only overflow, and no nested vertical table scroll.
- Rebuilt React Card Detail as a compact 760 px right-side command panel with no persistent card-art column and no internal overflow in the measured reference state.
- Kept Plan / Evaluation, Market Check, latest notes, and card context primary; moved Price History and Comparable Printings into verified secondary dialogs.
- Captured paired 1366 x 768 vanilla/React Radar, Positions, and Card Detail evidence in `docs/screenshots/react-parity-correction/` and recorded before/after geometry in `REACT_PARITY_LOG.md`.
- Regenerated the stable `react-app/dist-portable/index.html` deliverable and the committed `react-spike/` Pages artifact.

Current assessment:

- The React implementation is in active implementation/stabilization mode and is the likely forward project path.
- User review places the familiar UI experience at approximately 80-90%; this is directional feedback, not a claim of complete parity.
- Vanilla remains the behavioral and production/beta source of truth until an explicit promotion decision.
- The next engineering phase is to close remaining parity gaps and evaluate proven libraries against the working React app, beginning with the table system.

Open validation:

- Verify the repository branch or workflow that GitHub Pages actually publishes before claiming the latest spike-branch artifact is the live public version.
- Complete controlled React-write/vanilla-read validation with a backup available.
- Complete the second representative tablet/phone and accessibility pass.

## 2026-07-18: Shared Tabulator Foundation With Radar Pilot

Implemented:

- Added `tabulator-tables` 6.5.2 to the tracked React manifest and lockfile and bundled all runtime assets locally.
- Established a shared ManaSpec-owned `TabulatorTable` wrapper with modular Tabulator registration, cloned input rows, React cell rendering and cleanup, sort adapters, edit callbacks, row/action isolation, empty states, accessibility naming, and responsive card behavior.
- Migrated Radar only. Positions, Signals, Transactions, and History intentionally remain on the interim `DataTable` until Phase 2.
- Restored Radar's vanilla-aligned Added column, compact printing labels, editable Entry display, target-state color, planned-quantity stepper, latest market values, note/history indicators, ownership marker, and compact actions through shared configuration.

Validated:

- Thirteen focused Node tests, source policy, and formatting checks pass.
- Normal, `/ManaSpec/react-spike/` Pages, and portable IIFE builds complete; the Pages and portable artifacts were regenerated.
- Generated JavaScript passes `node --check`; the portable entry remains deferred with relative local assets and no runtime CDN.
- Modular registration reduced the normal JavaScript output from the initial full-Tabulator pilot build of 761.12 KB to 527.90 KB.

Open validation:

- The localhost vanilla and React artifact URLs both returned HTTP 200, but the Codex in-app browser runtime failed to initialize with `Cannot redefine property: process` after a clean retry. Fresh 1366 x 768 visual captures, console review, and mouse/keyboard interaction evidence remain required before claiming 95%+ visual parity.
- Direct portable-file browser launch remains subject to the existing manual/supported-browser validation requirement.
- Corrected the Radar pilot's initial intrinsic-width layout by making Card the sole flexible column and assigning compact fixed widths to financial/action columns. Fresh browser capture remains pending because the in-app browser initialization blocker persisted.

## 2026-07-19: Radar Native Layout Correction

Implemented:

- Preserved Radar Card as the single `fitColumns` flex column using `minWidth` and `widthGrow` without an explicit width; compact utility columns retain intentional fixed widths.
- Removed the shared wrapper's manual `tableBuilt` and animation-frame redraw calls. Native Tabulator layout, resize handling, and `layoutColumnsOnNewData` now own sizing and redraw mechanics.
- Left the existing Tabulator/ManaSpec CSS unchanged and kept all remaining modules on the interim shared table.

Validated:

- Source policy, formatting, and all thirteen focused Node tests pass.
- Normal, Pages, and portable builds complete; tracked Pages and portable artifacts were regenerated and generated JavaScript passes syntax checks.
- `http://127.0.0.1:5173/` returned HTTP 200 with the project owner's imported QA data origin available.

Open validation:

- A fresh 1366 x 768 visual and interaction check remains pending because the in-app browser bridge again failed during initialization with `Cannot redefine property: process`. No alternate browser mechanism or additional layout workaround was introduced.

## 2026-07-20: Radar Tabulator Default-Preservation Correction

Implemented:

- Corrected the shared wrapper boundary so optional Tabulator properties are emitted only when ManaSpec intentionally defines a value.
- Proved the root cause with a temporary live-instance diagnostic: Radar widths survived wrapper input and `table.getColumnDefinitions()`, while `minWidth: undefined` suppressed Tabulator's native 40px default and contaminated runtime width calculations with `NaN`.
- Removed the complete diagnostic hook after proving the cause. No table CSS, redraw calls, manual layout mechanics, or additional module migrations were introduced.
- Added a durable library-integration workflow rule: inspect native configuration, defaults, initialized instances, and generated output before adding compatibility workarounds or rebuilding library-owned mechanics.

Validated:

- At 1366 x 768, the Radar root measured 1300px and its holder measured 1298px; rendered columns totaled exactly 1298px with no internal blank strip.
- Card received the remaining 374px. Compact columns rendered at their configured widths, including 48px Set, 72px Scryfall, and 112px Actions, while Tabulator's native 40px minimum was restored.
- The live page produced no console warnings or errors. The available browser session had an empty Radar dataset, so the correction was verified through header/layout geometry rather than representative row interaction replay.
- All 13 focused tests, source policy checks, and formatting checks pass.
- Normal, Pages-subpath, and portable builds complete. The tracked `react-spike/` and `react-app/dist-portable/` artifacts were regenerated, and both generated JavaScript bundles pass `node --check`.

## 2026-07-22: React Parity Batch 1 - Data Trust And Exact Printing Identity

Implemented:

- Routed Position deletion through the vanilla-derived transaction projection guard. Open ledger-backed holdings are blocked before confirmation or persistence; safe deletion retains vanilla's explicit no-transaction warning.
- Added one compatibility-aware domain resolver for notes, price snapshots, market observations, transactions, History events, Dashboard note routing, Card Detail navigation, and related table indicators.
- Exact Scryfall printing UUID plus finish now wins everywhere. Foil and nonfoil are independent, and legacy base-ID, set/collector, or name fallback succeeds only when one tracked printing is possible.
- New market observations persist the exact printing key, Scryfall ID, finish, and printing context for future unambiguous reads.

Validated:

- All 21 focused Node tests pass, including eight Batch 1 cases for foil/nonfoil notes, same-name printings, exact price history, market observations, Transaction/History Card Detail routing, unambiguous legacy fallback, and safe/unsafe Position deletion.
- Source-policy and formatting checks pass.
- Normal, `/ManaSpec/react-spike/` Pages, and portable builds complete; the tracked Pages and portable artifacts were regenerated.
- Source review confirms that prior base-ID/name matching paths in the React view layer now route through the shared resolver.
- Fixture-backed browser QA confirmed that an open ledger-backed Position remains present and shows the vanilla-aligned warning, while a Position without open transaction projection can be confirmed and deleted. The development page and local `/ManaSpec/react-spike/` artifact reported no console warnings or errors.

Remaining for Batch 2:

- Port and fixture-compare vanilla Signals derivation, thresholds, reasons, priorities, filtering, and source navigation. Batch 1 changed only the identity used when Signals reads market observations; it did not change Signals attention behavior.

## 2026-07-23: React Parity Batch 2 - Signals Logic And Triage Workflow

Implemented:

- Moved React Signals derivation into a deterministic domain selector that matches vanilla's 5% target boundary, bucket/status/reason/action state, priority ordering, and market-check freshness behavior.
- Reused the Batch 1 exact-printing resolver for market observations so same-printing foil/nonfoil checks remain independent.
- Routed both Signals and Dashboard through the same derived rows and Dashboard queue selector, including target hits, near/watch fallbacks, stale checks, missing plans, and hold-plan ownership.
- Restored attention-tile bucket filters, exact-printing preview filters, visible Show all reset, and isolated row/action clicks.
- Restored primary `View` navigation to an exact Radar or Positions row and retained external access under the explicit `Scryfall` label.

Validated:

- All 28 Node tests pass. Six new fixture tests compare every derived row's bucket, status, reason, priority, source, and action state, plus the 5% boundary, fresh/stale checks, exact finish isolation, triage selectors, source navigation, and Dashboard queue membership.
- Source-policy and formatting checks pass.
- Normal, `/ManaSpec/react-spike/` Pages, and portable builds complete; tracked Pages and portable artifacts were regenerated.
- Imported-fixture browser QA confirmed bucket filtering, closest-target Approaching previews, exact foil-row filtering, Show all reset, separate `Scryfall`, and exact one-row Radar and Positions source navigation. The Pages-mode preview loaded the Signals route and generated assets with no console errors.
- The in-app browser's URL policy blocked direct `file://` navigation; the portable finalization tests and regenerated classic-script build passed. Development-only Radar transitions emitted the pre-existing Tabulator React-root unmount warning, with no observed workflow failure; the production Pages Signals smoke was clean.

Remaining after Batch 2:

- Do not begin another audit batch until its focused issue is created and approved. Existing Card Detail, dense-table, Help, accessibility, and responsive gaps remain governed by their own future batches.

## 2026-07-24: Position Data Trust

Implemented:

- Added a pure canonical Position row boundary derived only from vanilla-compatible `qty`, `buyPrice`, and `buyDate`, while retaining the normalized source record for existing compatible commands.
- Required exact printing identity, positive finite quantity, positive finite buy price, and valid buy date for an open Position. Missing, zero, and invalid required values remain visible as reconciliation-required records and cannot enter normal Buy, Sell, or detail workflows.
- Corrected Positions Age and Added to use `buyDate` exclusively; Radar `addedDate`, `addedAt`, and `createdAt` are not acquisition-date fallbacks.
- Excluded invalid Positions from invested capital, marked value, profit/loss, total-equity contribution, and open-position counts without rewriting stored data. Valid records with unavailable current price retain ownership/cost basis but are excluded from marked-value calculations.
- Kept Positions on the existing interim `DataTable`; no `TabulatorTable`, shared table API, or table architecture changes were made.

Validated:

- All 36 Node tests pass. New coverage includes canonical field mapping, `buyDate` precedence over Radar `addedDate`, every missing/zero/invalid required field, exact identity, unavailable current price, related counts, calculation exclusion, and compatible save/backup serialization without canonical-field pollution.
- Source-policy and formatting checks pass.
- Normal and `/ManaSpec/react-spike/` Pages builds pass; the tracked Pages artifact was regenerated and its JavaScript passes `node --check`.
- The portable Vite bundle built successfully. Its finalizer encountered one transient Windows file lock, then completed; the classic script is deferred, idempotence tests pass, and generated JavaScript passes `node --check`.
- A fixture-backed 1366 x 768 browser pass confirmed four reconciliation cases (missing quantity, zero buy price, missing buy date, and missing exact printing identity) remain visible with reason-specific `Reconcile` states, disabled detail/transaction actions, and exclusion from portfolio value, deployed capital, and open-position counts.
- The valid regression row displayed Age `10d` and Added `7/15/2026` from `buyDate` even though its stored Radar `addedDate` was `1/1/2025`. Card Detail, Buy, Sell, and table filtering retained the vanilla-aligned interaction flow.
- The Positions page, table, and holder each fit the 1366 x 768 viewport without horizontal or document overflow. The React page produced no console warnings or errors during the visual and interaction pass.

Follow-up:

- All remaining table migrations remain deferred until this focused batch is reviewed and merged.

## 2026-07-26: React Positions Tabulator Migration

Implemented:

- Replaced the interim Positions `DataTable` with the existing shared `TabulatorTable` using the approved 19-column configuration: Card, Set, collector number, Rarity, Color, Buy, Now, Qty, Age, Added, Value, P/L, P/L %, Target, delta, Hold, Notes, History, and Actions.
- Kept Card as the only flexible scan column and fixed the remaining compact columns, including the 32px Qty column, so the desktop grid fills its container without overflow.
- Kept the Issue #6 canonical Position-row boundary and reconciliation states. Filtering operates on canonical rows without reconstructing, repairing, or polluting persisted records.
- Preserved name sorting, exact focus and text filtering, inline Target/Hold editing, Card Detail, Buy/Sell, guarded deletion, and disabled normal actions for invalid records.
- Added only Positions-scoped header-density styling. The shared wrapper API is unchanged; its existing React formatter-root cleanup now defers unmounting to avoid a proven synchronous-render lifecycle race.

Validated:

- All 37 Node tests pass, including canonical-row filtering coverage that retains exact row references, `buyDate` acquisition semantics, reconciliation classifications, and the absence of canonical-field writes onto storage-shaped records.
- Source-policy, formatting, normal, Pages, and portable checks pass; tracked Pages and portable artifacts were regenerated and generated JavaScript passes `node --check`.
- Fixture-backed 1366 x 768 React verification confirmed five rendered rows, four clear reconciliation states, one valid open-position count, Age `11d` and Added `7/15/2026` from `buyDate`, and no document or table horizontal overflow.
- Sorting, text and exact-focus filtering/reset, Target/Hold editing, Card Detail, Buy/Sell, and guarded delete were exercised. A fresh post-fix interaction run produced no React console warnings or errors.
- Vanilla Positions was compared at the same viewport to confirm the compact 19-column scan pattern and established row workflows. Its only console warnings were expected failed live price-refresh requests in the restricted local QA environment.

Follow-up:

- Signals, Transactions, and History remain on the interim table. No later table migration or unrelated shared-table expansion is included in this batch.

## 2026-07-27: Shared Table And App-Shell Visual Parity

Implemented:

- Confirmed the ManaSpec-owned `TabulatorTable` remains the correct boundary: shared grid lifecycle, pagination, compact geometry, sort accessibility, indicators, and action presentation stay centralized, while Radar retains its filter semantics, column definitions, editors, and workflow callbacks.
- Matched the React shell to vanilla's navigation spacing and icon/text centering, and restored the blue global Search action.
- Rebuilt Radar's local filtering around the vanilla contract, removed the duplicate candidate Search button and OWNED badge, retained one flexible Card column, and assigned compact fixed widths to utility, financial, indicator, and action columns.
- Added vanilla-aligned card-filter selectors and focused regression coverage, local page-size handling, active-only sort-arrow/ARIA synchronization, 27px rows, compact icon indicators, and single-page footer suppression.

Validated:

- Side-by-side vanilla and React review at 1366 x 768 measured a 28px header, 27px rows, a 34px Radar filter band, matching shell navigation/Search geometry, and a 1219px table with no horizontal overflow in the representative fixture state.
- Fixture-backed interaction checks covered rarity filtering and reset, planned-quantity controls, notes/history indicators, isolated row actions, and switching the visible sort arrow to the active column. Production Pages-mode output initialized with Card sorted ascending and no inactive sort arrows.
- Tablet (768 x 1024) and phone (390 x 844) smoke checks showed no document-level horizontal overflow; the table remains contained by its responsive behavior.
- All 38 focused Node tests, source-policy checks, and formatting checks pass. Normal, Pages-subpath, and portable builds complete; tracked Pages and portable artifacts were regenerated.

Follow-up:

- Applied this shared foundation to the paused Positions Tabulator branch. Positions inherits the wrapper and shell improvements without changing Position business logic; Signals, Transactions, and History remain deferred.

## 2026-07-28: Shared Header Sort Spacing Correction

Implemented:

- Removed Tabulator's inactive 25px sort reservation from shared React headers and reserve only the compact active-arrow space.
- Kept Card as the flexible descriptive column and widened only the compact Radar and Positions columns whose full labels need the active sort arrow.

Validated:

- Checked every sortable Radar and Positions header with its arrow active; labels remain complete without table or document-level horizontal overflow at the desktop parity viewport.
