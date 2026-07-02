# ManaSpec Repository Snapshot

## Source Of Truth Notice

Generated: This is a generated repository orientation snapshot.

It is intended to help humans and AI quickly understand project structure. It is not the source of truth.

Always open the real files before editing. Product, architecture, workflow, UI, and data truth live in `/docs`, especially:

- `README.md`
- `docs/README.md`
- `docs/PRODUCT_PRINCIPLES.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/STYLE_GUIDE.md`
- `docs/ROADMAP.md`
- `docs/WORKFLOW.md`
- `docs/DECISIONS.md`

## Repository Overview

- Detected project type: Local-first MTG speculation workflow terminal.
- Detected current version: 0.9.0-alpha.1.
- Detected app architecture: static HTML shell, vanilla JS global scripts, localStorage persistence, Scryfall API reads, no backend.
- Detected SPA structure: single `index.html` shell with workflow views rendered into `#viewContainer`.
- Detected build step: none found; files appear to run directly in the browser.
- Generated timestamp: 2026-07-02T02:47:40.291Z.
- Git branch: main.
- Git status:
```text
approximate: Node child_process could not run git in this environment
 M docs/PARKING_LOT.md
 M tools/generate-repo-snapshot.js
```
- Recent commits:
```text
a4e0a55 docs: reconcile documentation with current implementation
931264b Polish Signals tile filtering
f2c96e9 Align Signals attention queues
01d0b4d docs: add repeated issue diagnosis reminder
80a2478 dashboard: fix dashboard layout alignment and overflow
efb5c86 dashboard: final beta dashboard polish
d888c58 dashboard: finalize dashboard beta layout polish
aad9457 dashboard: refine dashboard layout and information density
```
- Primary active folders:
  - `js/core/`: storage, state, navigation, boot.
  - `js/modules/`: workflow modules.
  - `js/ui/`: shared UI surfaces.
  - `css/`: active styling split into imported CSS layers.
  - `docs/`: canonical project truth.
  - `dev notes/`: raw or historical project memory.
- Detected active JS files: 25.
- Detected active CSS files: 6.
- Detected localStorage keys: 12.

## Runtime Architecture

- Detected entry HTML: `index.html`.
- Detected boot file: `js/core/app.js` loaded last and calls app initialization.
- Detected script load order: storage, state, metadata/shared UI, workflow modules, summary/help/pricing, app boot.
- Detected view rendering: workflow render functions write into `#viewContainer` after navigation changes.
- Detected navigation: `.toolbar-tab` buttons with `data-view` attributes.
- Detected active CSS entry: `css/style.css`.
- Detected runtime state globals: `cardNotes`, `cash`, `currentPrintings`, `priceRefreshInFlight`, `radar`, `signals`, `specs`, `thesisNotes`, `transactions`.
- Detected runtime namespaces/window flags: `window.cardArtEscapeHandlerInstalled`, `window.cardDetailEscapeHandlerInstalled`, `window.radarSearchEscapeHandlerInstalled`, `window.radarSearchOutsideDismissHandlerInstalled`.
- Detected render functions: `renderActionsSection`, `renderAdminBackupPreview`, `renderAdminView`, `renderAttentionQueueRow`, `renderBulkSetResults`, `renderBulkSetRow`, `renderCardDataSection`, `renderCardDetail`, `renderCardDetailError`, `renderCardDetailHeader`, `renderCardDetailShell`, `renderCardFilterControls`, `renderCardNoteEntry`, `renderCardSearchResult`, `renderCashResetPreview`, `renderDashboardView`, `renderDetailMetric`, `renderEvaluationItem`, `renderHelpTopic`, `renderHistoryList`, ... capped 42 more.
- Shared UI systems referenced: standard tables, context bands, global summary, help drawer, toasts, confirmation dialog, Card Detail modal, card art preview.

## Screen Ownership Map

### Dashboard

- Owner: `js/modules/dashboard/dashboard.js`
- View: dashboard.
- Likely responsibility: Current awareness and next-action summary.
- Referenced support files: (none detected).
- Detected reads: `specs`, `radar`, `transactions`, `cardNotes`, `priceSnapshots`, `marketObservations`.
- Detected writes: (none detected).
- Likely uses: `shared attention rows`, `Signals helpers`, `Card Detail/navigation helpers`.

### Radar

- Owner: `js/modules/radar/radar.js`
- View: radar.
- Likely responsibility: Discovery, exact printing selection, watched ideas, entry planning, and planned quantity.
- Referenced support files: `js/modules/portfolio/search.js`, `js/modules/portfolio/printings.js`.
- Detected reads: `radar`, `cardNotes`, `marketObservations`, `Scryfall API`.
- Detected writes: `radar`, `specs`, `transactions`, `cardNotes`.
- Likely uses: `shared tables`, `printing selection`, `buy flow`, `Card Detail`.

### Positions

- Owner: `js/modules/portfolio/portfolio.js`
- View: portfolio.
- Likely responsibility: Owned holdings, exit planning, position management, price checks, and P/L.
- Referenced support files: `js/modules/portfolio/trading.js`, `js/modules/portfolio/pricing.js`, `js/modules/portfolio/snapshots.js`.
- Detected reads: `specs`, `radar`, `transactions`, `priceSnapshots`, `priceRefreshStatus`.
- Detected writes: `specs`, `cash`, `priceRefreshStatus`.
- Likely uses: `shared tables`, `transaction logging`, `price refresh`, `Card Detail`.

### Signals

- Owner: `js/modules/signals/signals.js`
- View: signals.
- Likely responsibility: Computed read-only attention layer for target, plan, hold, and market-check states.
- Referenced support files: (none detected).
- Detected reads: `specs`, `radar`, `cardNotes`, `marketObservations`, `priceRefreshStatus`.
- Detected writes: `specs`.
- Likely uses: `shared tables`, `Dashboard-style attention rows`, `source navigation`.

### Card Detail

- Owner: `js/modules/card-details/card-details.js`
- View: (modal).
- Likely responsibility: Command center for one exact tracked printing and canonical plan edits.
- Referenced support files: (none detected).
- Detected reads: `cardDetailNotesExpanded`.
- Detected writes: `cardDetailNotesExpanded`.
- Likely uses: `notes helpers`, `market observations`, `plan editing`, `price snapshots`.

### Transactions

- Owner: `js/modules/transactions/transactions.js`
- View: transactions.
- Likely responsibility: Early ledger event surface for buys, sells, backfills, corrections, and review context.
- Referenced support files: (none detected).
- Detected reads: `transactions`, `specs`, `cash`.
- Detected writes: `transactions`.
- Likely uses: `shared tables`, `position metadata`, `ledger review context`.

### History

- Owner: `js/modules/history/history.js`
- View: history.
- Likely responsibility: Review trail across transactions, Radar activity, card notes, and thesis notes.
- Referenced support files: (none detected).
- Detected reads: `transactions`, `radar`, `cardNotes`, `thesisNotes`.
- Detected writes: (none detected).
- Likely uses: `shared tables`, `notes helpers`, `transaction review helpers`.

### Notes

- Owner: `js/modules/notes/notes.js`
- View: (shared).
- Likely responsibility: Shared exact-printing note helpers used by tables, Dashboard, History, and Card Detail.
- Referenced support files: (none detected).
- Detected reads: `cardNotes`, `specs`, `radar`.
- Detected writes: `cardNotes`.
- Likely uses: `tracked printing identity helpers`.

### Admin

- Owner: `js/modules/admin/admin.js`
- View: admin.
- Likely responsibility: Local data safety, backup/import, cash reset, and maintenance workflows.
- Referenced support files: (none detected).
- Detected reads: `specs`, `radar`, `transactions`, `cardNotes`, `priceSnapshots`, `marketObservations`, `cash`.
- Detected writes: `specs`, `radar`, `transactions`, `cardNotes`, `priceSnapshots`, `marketObservations`, `cash`.
- Likely uses: `backup/import helpers`, `app confirmation`, `summary refresh`.

## Runtime Data Flow

Generated conceptual flow. This is intentionally a workflow map, not a complete call graph.

```text
Search
  -> Printings
  -> Radar
  -> Buy
  -> Positions
  -> Transactions
  -> History
  -> Dashboard
  -> Signals
  -> Card Detail
  -> Notes / Market Observations / Price Snapshots
```

- Detected persistence flow: workflow modules mutate runtime arrays, then write localStorage keys directly or through storage helpers.
- Likely read flow: Dashboard, Signals, History, and Card Detail aggregate data from multiple workflow-owned stores.
- Referenced external data flow: Search, Printings, and Pricing call Scryfall API endpoints.

## JavaScript Inventory

### js/core/storage.js

- Approximate line count: 284.
- Exported globals: `MANASPEC_BACKUP_APP_VERSION`, `MANASPEC_BACKUP_ARRAY_KEYS`, `MANASPEC_BACKUP_SCHEMA`, `MANASPEC_BACKUP_SCHEMA_VERSION`, `MANASPEC_PRE_IMPORT_BACKUP_KEY`, `buildManaSpecBackupCounts`, `createManaSpecBackup`, `loadCardNotes`, `loadCash`, `loadJsonArray`, `loadJsonValue`, `loadMarketObservations`, `loadPriceRefreshStatus`, `loadRadar`, `loadSignals`, `loadSpecs`, `loadThesisNotes`, `loadTransactions`, `normalizeManaSpecBackup`, `parseManaSpecBackupText`, ... capped 10 more.
- Top-level functions: `buildManaSpecBackupCounts`, `createManaSpecBackup`, `loadCardNotes`, `loadCash`, `loadJsonArray`, `loadJsonValue`, `loadMarketObservations`, `loadPriceRefreshStatus`, `loadRadar`, `loadSignals`, `loadSpecs`, `loadThesisNotes`, `loadTransactions`, `normalizeManaSpecBackup`, `parseManaSpecBackupText`, `readManaSpecBackupData`, `restoreManaSpecBackup`, `restoreManaSpecBackupData`, `saveCardNotesState`, `saveMarketObservations`, `saveRadarState`, `saveSignalsState`, `saveState`, `saveThesisState`, ... capped 1 more.
- Major constants: `MANASPEC_BACKUP_APP_VERSION`, `MANASPEC_BACKUP_ARRAY_KEYS`, `MANASPEC_BACKUP_SCHEMA`, `MANASPEC_BACKUP_SCHEMA_VERSION`, `MANASPEC_PRE_IMPORT_BACKUP_KEY`.
- Likely responsibility: Storage safety, backup/import, load/save helpers..
- Detected dependencies: `backup/import`, `localStorage`, `notes helpers`, `pricing/snapshots`, `transactions`.
- Detected runtime globals referenced: `cardNotes`, `cash`, `marketObservations`, `priceSnapshots`, `radar`, `signals`, `specs`, `startingCash`, `thesisNotes`, `transactions`.
- Referenced cross-file symbols: `cardNotes (js/core/state.js)`, `cash (js/core/state.js)`, `loadPriceSnapshots (js/modules/portfolio/snapshots.js)`, `radar (js/core/state.js)`, `renderRadarItems (js/modules/radar/radar.js)`, `signals (js/core/state.js)`, `specs (js/core/state.js)`, `thesisNotes (js/core/state.js)`, `transactions (js/core/state.js)`, `updateTotals (js/ui/summary.js)`.

### js/core/state.js

- Approximate line count: 159.
- Exported globals: `backfillTransactionsFromCurrentPositions`, `cardNotes`, `cash`, `enrichTransactionsFromCurrentPositions`, `getLedgerQuantityForPosition`, `mergeRadarItems`, `radar`, `signals`, `specToRadarItem`, `specs`, `thesisNotes`, `transactions`.
- Top-level functions: `backfillTransactionsFromCurrentPositions`, `enrichTransactionsFromCurrentPositions`, `getLedgerQuantityForPosition`, `mergeRadarItems`, `specToRadarItem`.
- Major constants: (none detected).
- Likely responsibility: Startup state loading, migrations, and backfills..
- Detected dependencies: `localStorage`, `notes helpers`, `transactions`.
- Detected runtime globals referenced: `cardNotes`, `cash`, `radar`, `signals`, `specs`, `startingCash`, `thesisNotes`, `transactions`.
- Referenced cross-file symbols: `getTransactionMetadata (js/modules/transactions/transactions.js)`, `loadCardNotes (js/core/storage.js)`, `loadCash (js/core/storage.js)`, `loadRadar (js/core/storage.js)`, `loadSignals (js/core/storage.js)`, `loadSpecs (js/core/storage.js)`, `loadThesisNotes (js/core/storage.js)`, `loadTransactions (js/core/storage.js)`.

### js/modules/card-metadata/card-metadata.js

- Approximate line count: 104.
- Exported globals: `buildTrackedCard`, `extractCardMetadata`, `getColorIdentityLabel`, `getColorLabel`, `getPrimaryType`, `getTrackedPrintingKey`, `syncCardMetadata`.
- Top-level functions: `buildTrackedCard`, `extractCardMetadata`, `getColorIdentityLabel`, `getColorLabel`, `getPrimaryType`, `getTrackedPrintingKey`, `syncCardMetadata`.
- Major constants: (none detected).
- Likely responsibility: Active runtime module; inspect source before editing..
- Detected dependencies: `Scryfall API`.
- Detected runtime globals referenced: (none detected).
- Referenced cross-file symbols: (none detected).

### js/modules/notes/notes.js

- Approximate line count: 95.
- Exported globals: `addCardNote`, `findTrackedCardByNote`, `getCardNotePreview`, `getCardNotesForItem`, `getCardNotesForKey`, `getMostRecentCardNote`, `getTrackedNoteCount`, `renderNotesTableControl`.
- Top-level functions: `addCardNote`, `findTrackedCardByNote`, `getCardNotePreview`, `getCardNotesForItem`, `getCardNotesForKey`, `getMostRecentCardNote`, `getTrackedNoteCount`, `renderNotesTableControl`.
- Major constants: (none detected).
- Likely responsibility: Shared exact-printing note helpers used by tables, Dashboard, History, and Card Detail..
- Detected dependencies: `Scryfall API`, `notes helpers`.
- Detected runtime globals referenced: `cardNotes`, `radar`, `specs`.
- Referenced cross-file symbols: `cardNotes (js/core/state.js)`, `getTrackedPrintingKey (js/modules/card-metadata/card-metadata.js)`, `msEscapeAttr (js/ui/table.js)`, `msEscapeHtml (js/ui/table.js)`, `radar (js/core/state.js)`, `saveCardNotesState (js/core/storage.js)`, `specs (js/core/state.js)`.

### js/modules/card-filters/card-filters.js

- Approximate line count: 222.
- Exported globals: `applyCardFilters`, `clearExactCardFilter`, `exactCardFilterByPrefix`, `getCardFilterState`, `initCardFilters`, `matchesColorFilter`, `matchesPlanFilter`, `renderCardFilterControls`, `resetCardFilters`, `setExactCardFilter`.
- Top-level functions: `applyCardFilters`, `clearExactCardFilter`, `getCardFilterState`, `initCardFilters`, `matchesColorFilter`, `matchesPlanFilter`, `renderCardFilterControls`, `resetCardFilters`, `setExactCardFilter`.
- Major constants: (none detected).
- Likely responsibility: View or component rendering..
- Detected dependencies: (none detected).
- Detected runtime globals referenced: (none detected).
- Referenced cross-file symbols: `getPrimaryType (js/modules/card-metadata/card-metadata.js)`, `getTargetState (js/modules/card-details/card-details.js)`, `initTablePageSizeControl (js/ui/table.js)`, `money (js/core/app.js)`, `renderTablePageSizeControl (js/ui/table.js)`.

### js/ui/table.js

- Approximate line count: 349.
- Exported globals: `bindStandardTableEvents`, `compareStandardSortValues`, `getStandardAlignClass`, `getStandardTablePageSize`, `getStandardTablePageSizeKey`, `getStandardTableShownCount`, `initTablePageSizeControl`, `msEscapeAttr`, `msEscapeHtml`, `paginateStandardRows`, `preserveViewportDuring`, `renderStandardTable`, `renderStandardTableCell`, `renderStandardTableHeader`, `renderStandardTableRow`, `renderTablePageSizeControl`, `sortRowsByField`, `updateStandardSort`.
- Top-level functions: `bindStandardTableEvents`, `compareStandardSortValues`, `getStandardAlignClass`, `getStandardTablePageSize`, `getStandardTablePageSizeKey`, `getStandardTableShownCount`, `initTablePageSizeControl`, `msEscapeAttr`, `msEscapeHtml`, `paginateStandardRows`, `preserveViewportDuring`, `renderStandardTable`, `renderStandardTableCell`, `renderStandardTableHeader`, `renderStandardTableRow`, `renderTablePageSizeControl`, `sortRowsByField`, `updateStandardSort`.
- Major constants: (none detected).
- Likely responsibility: Shared UI infrastructure..
- Detected dependencies: `localStorage`, `shared table renderer`.
- Detected runtime globals referenced: (none detected).
- Referenced cross-file symbols: `money (js/core/app.js)`.

### js/ui/context-band.js

- Approximate line count: 42.
- Exported globals: `renderModuleContextBand`, `renderModuleContextTile`.
- Top-level functions: `renderModuleContextBand`, `renderModuleContextTile`.
- Major constants: (none detected).
- Likely responsibility: Shared UI infrastructure..
- Detected dependencies: (none detected).
- Detected runtime globals referenced: (none detected).
- Referenced cross-file symbols: `msEscapeAttr (js/ui/table.js)`, `msEscapeHtml (js/ui/table.js)`.

### js/ui/intent-modal.js

- Approximate line count: 232.
- Exported globals: `bindIntentFinishChoice`, `bindIntentKeyboardSubmit`, `formatIntentModalCardLine`, `getIntentCardPrice`, `getIntentFinishOptions`, `getIntentSelectedFinish`, `renderIntentFinishChoice`, `requestCardIntentModal`, `requestRadarAddIntent`, `requestRadarBuyIntent`.
- Top-level functions: `bindIntentFinishChoice`, `bindIntentKeyboardSubmit`, `formatIntentModalCardLine`, `getIntentCardPrice`, `getIntentFinishOptions`, `getIntentSelectedFinish`, `renderIntentFinishChoice`, `requestCardIntentModal`, `requestRadarAddIntent`, `requestRadarBuyIntent`.
- Major constants: (none detected).
- Likely responsibility: Shared UI infrastructure..
- Detected dependencies: `app notices`.
- Detected runtime globals referenced: (none detected).
- Referenced cross-file symbols: `escapeAttribute (js/modules/portfolio/portfolio.js)`, `escapeHtml (js/modules/portfolio/portfolio.js)`, `formatHoldInputValue (js/modules/card-details/card-details.js)`, `formatHoldTime (js/modules/card-details/card-details.js)`, `getHoldMonths (js/modules/card-details/card-details.js)`, `money (js/core/app.js)`, `parseHoldMonthsInput (js/modules/card-details/card-details.js)`, `parseWholeDollarInput (js/modules/card-details/card-details.js)`, `requestAppConfirmation (js/core/app.js)`.

### js/modules/dashboard/dashboard.js

- Approximate line count: 523.
- Exported globals: `fillDashboardNearQueue`, `formatDashboardDate`, `formatDashboardMissingPlanReason`, `formatDashboardNotePreview`, `formatDashboardPriceContext`, `formatDashboardPrintingIdentity`, `formatDashboardQueueTitle`, `formatDashboardRadarDetail`, `formatDashboardSignalRow`, `formatPositionMove`, `formatSignedMoney`, `formatSignedPercent`, `formatTargetDetail`, `getDashboardAgeDays`, `getDashboardClosestTargetRows`, `getDashboardEntryDistance`, `getDashboardHoldRows`, `getDashboardMarketObservation`, `getDashboardMissingPlanRows`, `getDashboardNoteSource`, ... capped 22 more.
- Top-level functions: `fillDashboardNearQueue`, `formatDashboardDate`, `formatDashboardMissingPlanReason`, `formatDashboardNotePreview`, `formatDashboardPriceContext`, `formatDashboardPrintingIdentity`, `formatDashboardQueueTitle`, `formatDashboardRadarDetail`, `formatDashboardSignalRow`, `formatPositionMove`, `formatSignedMoney`, `formatSignedPercent`, `formatTargetDetail`, `getDashboardAgeDays`, `getDashboardClosestTargetRows`, `getDashboardEntryDistance`, `getDashboardHoldRows`, `getDashboardMarketObservation`, `getDashboardMissingPlanRows`, `getDashboardNoteSource`, `getDashboardNumber`, `getDashboardRadarRows`, `getDashboardRadarScore`, `getDashboardRecentNoteRows`, ... capped 18 more.
- Major constants: (none detected).
- Likely responsibility: Current awareness and next-action summary..
- Detected dependencies: `Card Detail`, `Dashboard/Signals attention`, `app navigation`, `notes helpers`.
- Detected runtime globals referenced: `cardNotes`, `cash`, `radar`, `signals`, `specs`.
- Referenced cross-file symbols: `cardNotes (js/core/state.js)`, `cash (js/core/state.js)`, `escapeAttribute (js/modules/portfolio/portfolio.js)`, `escapeHtml (js/modules/portfolio/portfolio.js)`, `findTrackedCardByNote (js/modules/notes/notes.js)`, `getCardNotePreview (js/modules/notes/notes.js)`, `getLatestMarketObservation (js/modules/card-details/card-details.js)`, `getSignalAttentionRows (js/modules/signals/signals.js)`, `getTargetState (js/modules/card-details/card-details.js)`, `getTrackedNoteCount (js/modules/notes/notes.js)`, `money (js/core/app.js)`, `openCardDetail (js/modules/card-details/card-details.js)`, `openTrackedSource (js/core/app.js)`, `radar (js/core/state.js)`, `setActiveView (js/core/app.js)`, `signals (js/core/state.js)`, `specs (js/core/state.js)`, `toFiniteNumber (js/ui/summary.js)`.

### js/modules/portfolio/trading.js

- Approximate line count: 167.
- Exported globals: `buySpec`, `deleteSpec`, `getTradeNumber`, `resetCash`, `sellSpec`.
- Top-level functions: `buySpec`, `deleteSpec`, `getTradeNumber`, `resetCash`, `sellSpec`.
- Major constants: (none detected).
- Likely responsibility: Owned holdings, exit planning, position management, price checks, and P/L..
- Detected dependencies: `app notices`, `localStorage`, `transactions`.
- Detected runtime globals referenced: `cash`, `specs`, `startingCash`.
- Referenced cross-file symbols: `cash (js/core/state.js)`, `getSpec (js/core/app.js)`, `logTransaction (js/modules/transactions/transactions.js)`, `money (js/core/app.js)`, `requestAppConfirmation (js/core/app.js)`, `save (js/core/app.js)`, `showAppNotice (js/core/app.js)`, `specs (js/core/state.js)`, `toFiniteNumber (js/ui/summary.js)`, `updatePL (js/ui/summary.js)`, `updateTotals (js/ui/summary.js)`.

### js/modules/portfolio/portfolio.js

- Approximate line count: 379.
- Exported globals: `comparePortfolioSortValue`, `escapeAttribute`, `escapeHtml`, `formatPercent`, `formatPlanInputValue`, `formatPortfolioSignedMoney`, `formatPositionAge`, `formatPositionExitDistance`, `formatPositionExitDistanceTitle`, `formatPositionScryfallPriceTitle`, `formatRarityLabel`, `formatTableDate`, `getGainLossClass`, `getHoldMonthsInputValue`, `getPortfolioContextCards`, `getPortfolioItem`, `getPortfolioRows`, `getPortfolioSortValue`, `getPortfolioTableColumns`, `getPositionExitDistanceClass`, ... capped 13 more.
- Top-level functions: `comparePortfolioSortValue`, `escapeAttribute`, `escapeHtml`, `formatPercent`, `formatPlanInputValue`, `formatPortfolioSignedMoney`, `formatPositionAge`, `formatPositionExitDistance`, `formatPositionExitDistanceTitle`, `formatPositionScryfallPriceTitle`, `formatRarityLabel`, `formatTableDate`, `getGainLossClass`, `getHoldMonthsInputValue`, `getPortfolioContextCards`, `getPortfolioItem`, `getPortfolioRows`, `getPortfolioSortValue`, `getPortfolioTableColumns`, `getPositionExitDistanceClass`, `getPositionExitDistanceSort`, `getPositionExitDistanceValue`, `getPositionPlPct`, `getPositionValue`, ... capped 8 more.
- Major constants: (none detected).
- Likely responsibility: Owned holdings, exit planning, position management, price checks, and P/L..
- Detected dependencies: `Card Detail`, `Scryfall API`, `app notices`, `localStorage`, `notes helpers`, `shared table renderer`.
- Detected runtime globals referenced: `specs`.
- Referenced cross-file symbols: `applyCardFilters (js/modules/card-filters/card-filters.js)`, `buySpec (js/modules/portfolio/trading.js)`, `deleteSpec (js/modules/portfolio/trading.js)`, `formatHoldTime (js/modules/card-details/card-details.js)`, `formatTargetDisplayValue (js/modules/card-details/card-details.js)`, `formatTargetInputNumber (js/modules/card-details/card-details.js)`, `getColorLabel (js/modules/card-metadata/card-metadata.js)`, `getHoldMonths (js/modules/card-details/card-details.js)`, `getStandardTableShownCount (js/ui/table.js)`, `getTrackedNoteCount (js/modules/notes/notes.js)`, `initCardFilters (js/modules/card-filters/card-filters.js)`, `money (js/core/app.js)`, `openCardArtPreview (js/modules/portfolio/search.js)`, `openCardDetail (js/modules/card-details/card-details.js)`, `paginateStandardRows (js/ui/table.js)`, `parseHoldMonthsInput (js/modules/card-details/card-details.js)`, `parseWholeDollarInput (js/modules/card-details/card-details.js)`, `renderCardFilterControls (js/modules/card-filters/card-filters.js)`, ... capped 10 more.

### js/modules/portfolio/printings.js

- Approximate line count: 264.
- Exported globals: `buildPrintingFinishCard`, `comparePrintingPrices`, `comparePrintingValues`, `currentPrintings`, `getPrintingPriceSortValue`, `getPrintingSortValue`, `getSortArrow`, `parseCollectorNumber`, `printSortState`, `renderPrintingPriceCell`, `renderPrintings`, `showPrintings`, `sortPrintings`.
- Top-level functions: `buildPrintingFinishCard`, `comparePrintingPrices`, `comparePrintingValues`, `getPrintingPriceSortValue`, `getPrintingSortValue`, `getSortArrow`, `parseCollectorNumber`, `renderPrintingPriceCell`, `renderPrintings`, `showPrintings`, `sortPrintings`.
- Major constants: (none detected).
- Likely responsibility: Discovery, exact printing selection, watched ideas, entry planning, and planned quantity..
- Detected dependencies: `Scryfall API`.
- Detected runtime globals referenced: `currentPrintings`, `specs`.
- Referenced cross-file symbols: `addSpec (js/core/app.js)`, `isCurrentSearchRequest (js/modules/portfolio/search.js)`, `money (js/core/app.js)`, `openCardArtPreview (js/modules/portfolio/search.js)`, `renderSearchStatus (js/modules/portfolio/search.js)`, `setSearchBusy (js/modules/portfolio/search.js)`, `specs (js/core/state.js)`, `withPaperSearchDefault (js/modules/portfolio/search.js)`.

### js/modules/portfolio/search.js

- Approximate line count: 844.
- Exported globals: `activeSearchRequestId`, `addAutocompleteCandidates`, `addFuzzyNameCandidate`, `addOrderedFragmentNameCandidates`, `addPartialNameCandidates`, `addSearchCandidate`, `buildAdvancedScryfallQuery`, `closeCardArtPreview`, `dismissRadarSearchSurface`, `ensureCardArtEscapeHandler`, `escapeRegexFragment`, `escapeSearchHtml`, `filterSearchCards`, `formatCardSearchIdentity`, `getBulkSetLines`, `getCardPreviewImage`, `getCardSearchPrice`, `getNameSearchTokens`, `getSearchColorLabel`, `getSearchPrimaryType`, ... capped 34 more.
- Top-level functions: `addAutocompleteCandidates`, `addFuzzyNameCandidate`, `addOrderedFragmentNameCandidates`, `addPartialNameCandidates`, `addSearchCandidate`, `buildAdvancedScryfallQuery`, `closeCardArtPreview`, `dismissRadarSearchSurface`, `ensureCardArtEscapeHandler`, `escapeRegexFragment`, `escapeSearchHtml`, `filterSearchCards`, `formatCardSearchIdentity`, `getBulkSetLines`, `getCardPreviewImage`, `getCardSearchPrice`, `getNameSearchTokens`, `getSearchColorLabel`, `getSearchPrimaryType`, `handleSearch`, `hasActiveRadarSearchSurface`, `hasSearchFilters`, `initBulkSetLookup`, `initSearch`, ... capped 28 more.
- Major constants: (none detected).
- Likely responsibility: Discovery, exact printing selection, watched ideas, entry planning, and planned quantity..
- Detected dependencies: `Card Detail`, `Scryfall API`.
- Detected runtime globals referenced: `currentPrintings`, `radar`.
- Referenced cross-file symbols: `addSpec (js/core/app.js)`, `currentPrintings (js/modules/portfolio/printings.js)`, `getColorLabel (js/modules/card-metadata/card-metadata.js)`, `getPrimaryType (js/modules/card-metadata/card-metadata.js)`, `money (js/core/app.js)`, `openCardDetail (js/modules/card-details/card-details.js)`, `radar (js/core/state.js)`, `showPrintings (js/modules/portfolio/printings.js)`.

### js/modules/radar/radar.js

- Approximate line count: 460.
- Exported globals: `addRadarItem`, `buyRadarItem`, `formatRadarAddedDate`, `formatRadarAddedTitle`, `formatRadarEntryDistance`, `formatRadarEntryDistanceTitle`, `formatRadarEntryTarget`, `formatRadarScryfallPriceTitle`, `formatRadarSignedMoney`, `formatRadarTcgCheckTitle`, `formatRadarTcgCheckValue`, `getRadarAddedTimestamp`, `getRadarContextCards`, `getRadarEntryDistanceClass`, `getRadarEntryDistanceSort`, `getRadarEntryDistanceValue`, `getRadarMarketObservation`, `getRadarMarketValue`, `getRadarPlannedQty`, `getRadarSortValue`, ... capped 13 more.
- Top-level functions: `addRadarItem`, `buyRadarItem`, `formatRadarAddedDate`, `formatRadarAddedTitle`, `formatRadarEntryDistance`, `formatRadarEntryDistanceTitle`, `formatRadarEntryTarget`, `formatRadarScryfallPriceTitle`, `formatRadarSignedMoney`, `formatRadarTcgCheckTitle`, `formatRadarTcgCheckValue`, `getRadarAddedTimestamp`, `getRadarContextCards`, `getRadarEntryDistanceClass`, `getRadarEntryDistanceSort`, `getRadarEntryDistanceValue`, `getRadarMarketObservation`, `getRadarMarketValue`, `getRadarPlannedQty`, `getRadarSortValue`, `getRadarTableColumns`, `getSortedRadarRows`, `openRadarArtPreview`, `openRadarCardDetail`, ... capped 8 more.
- Major constants: (none detected).
- Likely responsibility: Discovery, exact printing selection, watched ideas, entry planning, and planned quantity..
- Detected dependencies: `Card Detail`, `Scryfall API`, `app notices`, `notes helpers`, `shared table renderer`, `transactions`.
- Detected runtime globals referenced: `cash`, `radar`, `specs`.
- Referenced cross-file symbols: `addCardNote (js/modules/notes/notes.js)`, `applyCardFilters (js/modules/card-filters/card-filters.js)`, `buildTrackedCard (js/modules/card-metadata/card-metadata.js)`, `cash (js/core/state.js)`, `dismissRadarSearchSurface (js/modules/portfolio/search.js)`, `formatOptionalMoney (js/modules/card-details/card-details.js)`, `formatPercent (js/modules/portfolio/portfolio.js)`, `formatRarityLabel (js/modules/portfolio/portfolio.js)`, `formatTargetDisplayValue (js/modules/card-details/card-details.js)`, `formatTargetInputNumber (js/modules/card-details/card-details.js)`, `getColorLabel (js/modules/card-metadata/card-metadata.js)`, `getLatestMarketObservation (js/modules/card-details/card-details.js)`, `getStandardTableShownCount (js/ui/table.js)`, `getTrackedNoteCount (js/modules/notes/notes.js)`, `initCardFilters (js/modules/card-filters/card-filters.js)`, `initSearch (js/modules/portfolio/search.js)`, `logTransaction (js/modules/transactions/transactions.js)`, `money (js/core/app.js)`, ... capped 19 more.

### js/modules/transactions/transactions.js

- Approximate line count: 417.
- Exported globals: `compareTransactionsChronologically`, `formatTransactionBalanceAfter`, `formatTransactionDate`, `formatTransactionIdentity`, `formatTransactionRealizedPL`, `formatTransactionRealizedTitle`, `formatTransactionSignedTotal`, `formatTransactionVersion`, `getFilteredTransactions`, `getSortedTransactionRows`, `getTransactionCardSource`, `getTransactionContextCards`, `getTransactionCostBasisPerUnit`, `getTransactionGainLossClass`, `getTransactionMetadata`, `getTransactionRealizedPL`, `getTransactionSortValue`, `getTransactionTableColumns`, `getTransactionTotal`, `getTransactionsWithReviewContext`, ... capped 8 more.
- Top-level functions: `compareTransactionsChronologically`, `formatTransactionBalanceAfter`, `formatTransactionDate`, `formatTransactionIdentity`, `formatTransactionRealizedPL`, `formatTransactionRealizedTitle`, `formatTransactionSignedTotal`, `formatTransactionVersion`, `getFilteredTransactions`, `getSortedTransactionRows`, `getTransactionCardSource`, `getTransactionContextCards`, `getTransactionCostBasisPerUnit`, `getTransactionGainLossClass`, `getTransactionMetadata`, `getTransactionRealizedPL`, `getTransactionSortValue`, `getTransactionTableColumns`, `getTransactionTotal`, `getTransactionsWithReviewContext`, `hasFiniteTransactionValue`, `initTransactionFilters`, `logTransaction`, `renderTransactionsList`, ... capped 3 more.
- Major constants: (none detected).
- Likely responsibility: Early ledger event surface for buys, sells, backfills, corrections, and review context..
- Detected dependencies: `Card Detail`, `shared table renderer`, `transactions`.
- Detected runtime globals referenced: `cash`, `radar`, `specs`, `startingCash`, `transactions`.
- Referenced cross-file symbols: `cash (js/core/state.js)`, `formatRarityLabel (js/modules/portfolio/portfolio.js)`, `getColorLabel (js/modules/card-metadata/card-metadata.js)`, `getStandardTableShownCount (js/ui/table.js)`, `initTablePageSizeControl (js/ui/table.js)`, `money (js/core/app.js)`, `openCardArtPreview (js/modules/portfolio/search.js)`, `openCardDetail (js/modules/card-details/card-details.js)`, `paginateStandardRows (js/ui/table.js)`, `radar (js/core/state.js)`, `renderModuleContextBand (js/ui/context-band.js)`, `renderStandardTable (js/ui/table.js)`, `renderTablePageSizeControl (js/ui/table.js)`, `saveTransactionsState (js/core/storage.js)`, `sortRowsByField (js/ui/table.js)`, `specs (js/core/state.js)`, `transactions (js/core/state.js)`, `updateStandardSort (js/ui/table.js)`.

### js/modules/signals/signals.js

- Approximate line count: 721.
- Exported globals: `SIGNAL_BUCKETS`, `SIGNAL_TILE_ROW_LIMIT`, `activeSignalBucket`, `activeSignalCardId`, `buildSignalAttentionRow`, `compareSignalBucketPriority`, `compareSignalPriority`, `fillSignalApproachingRows`, `formatSignalDistance`, `formatSignalDistanceTitle`, `formatSignalMissingPlanReason`, `formatSignalPriceContext`, `formatSignalQueueReason`, `formatSignalQueueRow`, `formatSignalQueueTitle`, `formatSignalSignedMoney`, `formatSignalTargetDetail`, `formatSignalTargetInput`, `getActiveSignalRows`, `getAllSignalRows`, ... capped 39 more.
- Top-level functions: `buildSignalAttentionRow`, `compareSignalBucketPriority`, `compareSignalPriority`, `fillSignalApproachingRows`, `formatSignalDistance`, `formatSignalDistanceTitle`, `formatSignalMissingPlanReason`, `formatSignalPriceContext`, `formatSignalQueueReason`, `formatSignalQueueRow`, `formatSignalQueueTitle`, `formatSignalSignedMoney`, `formatSignalTargetDetail`, `formatSignalTargetInput`, `getActiveSignalRows`, `getAllSignalRows`, `getFilteredSignalRows`, `getRelevantSignalTarget`, `getRelevantSignalTargetSort`, `getRowsForSignalBucket`, `getSignalActionClass`, `getSignalActionLabel`, `getSignalAttentionRows`, `getSignalBucketPriority`, ... capped 30 more.
- Major constants: `SIGNAL_BUCKETS`, `SIGNAL_TILE_ROW_LIMIT`.
- Likely responsibility: Computed read-only attention layer for target, plan, hold, and market-check states..
- Detected dependencies: `Card Detail`, `Dashboard/Signals attention`, `app navigation`, `app notices`, `localStorage`, `shared table renderer`.
- Detected runtime globals referenced: `radar`, `signals`, `specs`.
- Referenced cross-file symbols: `compareStandardSortValues (js/ui/table.js)`, `escapeAttribute (js/modules/portfolio/portfolio.js)`, `escapeHtml (js/modules/portfolio/portfolio.js)`, `findTrackedCard (js/modules/card-details/card-details.js)`, `formatPercent (js/modules/portfolio/portfolio.js)`, `formatTargetDisplayValue (js/modules/card-details/card-details.js)`, `formatTargetInputNumber (js/modules/card-details/card-details.js)`, `getHoldMonths (js/modules/card-details/card-details.js)`, `getLatestMarketObservation (js/modules/card-details/card-details.js)`, `initTablePageSizeControl (js/ui/table.js)`, `money (js/core/app.js)`, `openCardArtPreview (js/modules/portfolio/search.js)`, `openCardDetail (js/modules/card-details/card-details.js)`, `openTrackedSource (js/core/app.js)`, `paginateStandardRows (js/ui/table.js)`, `parseWholeDollarInput (js/modules/card-details/card-details.js)`, `radar (js/core/state.js)`, `renderAttentionQueueRow (js/modules/dashboard/dashboard.js)`, ... capped 9 more.

### js/modules/thesis/thesis.js

- Approximate line count: 119.
- Exported globals: `addThesisFromForm`, `addThesisNote`, `formatThesisMeta`, `getThesisNotesForCard`, `renderThesisList`, `renderThesisView`.
- Top-level functions: `addThesisFromForm`, `addThesisNote`, `formatThesisMeta`, `getThesisNotesForCard`, `renderThesisList`, `renderThesisView`.
- Major constants: (none detected).
- Likely responsibility: View or component rendering..
- Detected dependencies: `Card Detail`, `app notices`.
- Detected runtime globals referenced: `radar`, `specs`, `thesisNotes`.
- Referenced cross-file symbols: `escapeAttribute (js/modules/portfolio/portfolio.js)`, `escapeHtml (js/modules/portfolio/portfolio.js)`, `findTrackedCard (js/modules/card-details/card-details.js)`, `openCardDetail (js/modules/card-details/card-details.js)`, `radar (js/core/state.js)`, `saveThesisState (js/core/storage.js)`, `showAppNotice (js/core/app.js)`, `specs (js/core/state.js)`, `thesisNotes (js/core/state.js)`.

### js/modules/history/history.js

- Approximate line count: 348.
- Exported globals: `HISTORY_EVENT_LIMIT`, `buildHistoryEvents`, `formatHistoryTransactionDetail`, `getFilteredHistoryEvents`, `getHistoryCardSource`, `getHistoryContextCards`, `getHistoryEventNotes`, `getHistoryFilterState`, `getHistorySortValue`, `getHistoryTableColumns`, `getSortedHistoryEvents`, `historySort`, `initHistoryFilters`, `renderHistoryList`, `renderHistoryNotesIndicator`, `renderHistoryView`, `setHistorySort`, `updateHistoryFilterCount`.
- Top-level functions: `buildHistoryEvents`, `formatHistoryTransactionDetail`, `getFilteredHistoryEvents`, `getHistoryCardSource`, `getHistoryContextCards`, `getHistoryEventNotes`, `getHistoryFilterState`, `getHistorySortValue`, `getHistoryTableColumns`, `getSortedHistoryEvents`, `initHistoryFilters`, `renderHistoryList`, `renderHistoryNotesIndicator`, `renderHistoryView`, `setHistorySort`, `updateHistoryFilterCount`.
- Major constants: `HISTORY_EVENT_LIMIT`.
- Likely responsibility: Review trail across transactions, Radar activity, card notes, and thesis notes..
- Detected dependencies: `Card Detail`, `notes helpers`, `shared table renderer`, `transactions`.
- Detected runtime globals referenced: `cardNotes`, `radar`, `specs`, `thesisNotes`, `transactions`.
- Referenced cross-file symbols: `cardNotes (js/core/state.js)`, `escapeAttribute (js/modules/portfolio/portfolio.js)`, `findTrackedCardByNote (js/modules/notes/notes.js)`, `formatRarityLabel (js/modules/portfolio/portfolio.js)`, `formatTransactionIdentity (js/modules/transactions/transactions.js)`, `formatTransactionRealizedPL (js/modules/transactions/transactions.js)`, `getCardNotePreview (js/modules/notes/notes.js)`, `getCardNotesForItem (js/modules/notes/notes.js)`, `getCardNotesForKey (js/modules/notes/notes.js)`, `getColorLabel (js/modules/card-metadata/card-metadata.js)`, `getStandardTableShownCount (js/ui/table.js)`, `getTransactionsWithReviewContext (js/modules/transactions/transactions.js)`, `initTablePageSizeControl (js/ui/table.js)`, `money (js/core/app.js)`, `openCardArtPreview (js/modules/portfolio/search.js)`, `openCardDetail (js/modules/card-details/card-details.js)`, `paginateStandardRows (js/ui/table.js)`, `radar (js/core/state.js)`, ... capped 8 more.

### js/modules/admin/admin.js

- Approximate line count: 224.
- Exported globals: `confirmAdminResetCash`, `exportAdminBackup`, `formatBackupFilenameDate`, `handleAdminBackupFileSelected`, `previewAdminBackupRestore`, `renderAdminBackupPreview`, `renderAdminView`, `renderCashResetPreview`, `showAdminBackupNotice`.
- Top-level functions: `confirmAdminResetCash`, `exportAdminBackup`, `formatBackupFilenameDate`, `handleAdminBackupFileSelected`, `previewAdminBackupRestore`, `renderAdminBackupPreview`, `renderAdminView`, `renderCashResetPreview`, `showAdminBackupNotice`.
- Major constants: (none detected).
- Likely responsibility: Local data safety, backup/import, cash reset, and maintenance workflows..
- Detected dependencies: `app notices`, `backup/import`, `notes helpers`, `pricing/snapshots`, `transactions`.
- Detected runtime globals referenced: `cardNotes`, `cash`, `marketObservations`, `priceSnapshots`, `radar`, `signals`, `startingCash`, `thesisNotes`, `transactions`.
- Referenced cross-file symbols: `cardNotes (js/core/state.js)`, `cash (js/core/state.js)`, `createManaSpecBackup (js/core/storage.js)`, `escapeHtml (js/modules/portfolio/portfolio.js)`, `money (js/core/app.js)`, `parseManaSpecBackupText (js/core/storage.js)`, `radar (js/core/state.js)`, `requestAppConfirmation (js/core/app.js)`, `resetCash (js/modules/portfolio/trading.js)`, `restoreManaSpecBackup (js/core/storage.js)`, `showAppNotice (js/core/app.js)`, `signals (js/core/state.js)`, `thesisNotes (js/core/state.js)`, `transactions (js/core/state.js)`.

### js/modules/card-details/card-details.js

- Approximate line count: 1008.
- Exported globals: `activeCardDetail`, `buildEvaluationItem`, `buildMarketEvaluation`, `closeCardDetail`, `ensureCardDetailEscapeHandler`, `ensureCardDetailModal`, `escapeDetailAttribute`, `evaluateEdhPresence`, `evaluateFreshness`, `evaluatePriceConfidence`, `evaluateSupply`, `evaluateTargetMath`, `evaluateVelocity`, `findTrackedCard`, `findTrackedCardSource`, `focusCardDetailNotes`, `formatAddedDate`, `formatCardNoteTimestamp`, `formatCompactPrintingIdentity`, `formatCompactStatus`, ... capped 50 more.
- Top-level functions: `buildEvaluationItem`, `buildMarketEvaluation`, `closeCardDetail`, `ensureCardDetailEscapeHandler`, `ensureCardDetailModal`, `escapeDetailAttribute`, `evaluateEdhPresence`, `evaluateFreshness`, `evaluatePriceConfidence`, `evaluateSupply`, `evaluateTargetMath`, `evaluateVelocity`, `findTrackedCard`, `findTrackedCardSource`, `focusCardDetailNotes`, `formatAddedDate`, `formatCardNoteTimestamp`, `formatCompactPrintingIdentity`, `formatCompactStatus`, `formatDetailMoney`, `formatDetailPrintingIdentity`, `formatFreshnessAgeLabel`, `formatHoldInputValue`, `formatHoldTime`, ... capped 45 more.
- Major constants: (none detected).
- Likely responsibility: Command center for one exact tracked printing and canonical plan edits..
- Detected dependencies: `Card Detail`, `Scryfall API`, `app notices`, `localStorage`, `notes helpers`, `pricing/snapshots`.
- Detected runtime globals referenced: `radar`, `signals`, `specs`.
- Referenced cross-file symbols: `addCardNote (js/modules/notes/notes.js)`, `escapeHtml (js/modules/portfolio/portfolio.js)`, `getCardNotesForItem (js/modules/notes/notes.js)`, `getColorLabel (js/modules/card-metadata/card-metadata.js)`, `getPrimaryType (js/modules/card-metadata/card-metadata.js)`, `getScryfallUsdPrice (js/modules/portfolio/pricing.js)`, `loadMarketObservations (js/core/storage.js)`, `loadPriceSnapshots (js/modules/portfolio/snapshots.js)`, `money (js/core/app.js)`, `radar (js/core/state.js)`, `save (js/core/app.js)`, `saveMarketObservations (js/core/storage.js)`, `saveRadarState (js/core/storage.js)`, `showAppNotice (js/core/app.js)`, `signals (js/core/state.js)`, `specs (js/core/state.js)`, `syncCardMetadata (js/modules/card-metadata/card-metadata.js)`, `tableMoney (js/core/app.js)`, ... capped 2 more.

### js/ui/summary.js

- Approximate line count: 78.
- Exported globals: `renderPriceRefreshStatus`, `toFiniteNumber`, `updatePL`, `updateTotals`.
- Top-level functions: `renderPriceRefreshStatus`, `toFiniteNumber`, `updatePL`, `updateTotals`.
- Major constants: (none detected).
- Likely responsibility: Shared UI infrastructure..
- Detected dependencies: `pricing/snapshots`.
- Detected runtime globals referenced: `cash`, `specs`.
- Referenced cross-file symbols: `cash (js/core/state.js)`, `loadPriceRefreshStatus (js/core/storage.js)`, `specs (js/core/state.js)`.

### js/ui/help.js

- Approximate line count: 189.
- Exported globals: `activeHelpTopic`, `closeHelpDrawer`, `ensureHelpDrawer`, `initHelp`, `openHelpDrawer`, `renderHelpTopic`, `setHelpContext`.
- Top-level functions: `closeHelpDrawer`, `ensureHelpDrawer`, `initHelp`, `openHelpDrawer`, `renderHelpTopic`, `setHelpContext`.
- Major constants: (none detected).
- Likely responsibility: Shared UI infrastructure..
- Detected dependencies: `Scryfall API`, `transactions`.
- Detected runtime globals referenced: `cash`, `radar`, `signals`, `transactions`.
- Referenced cross-file symbols: `cash (js/core/state.js)`, `radar (js/core/state.js)`, `save (js/core/app.js)`, `signals (js/core/state.js)`, `transactions (js/core/state.js)`.

### js/modules/portfolio/snapshots.js

- Approximate line count: 87.
- Exported globals: `PRICE_SNAPSHOT_KEY`, `PRICE_SNAPSHOT_SOURCE`, `createPriceSnapshot`, `getSnapshotDate`, `loadPriceSnapshots`, `saveDailyPriceSnapshots`, `savePriceSnapshots`.
- Top-level functions: `createPriceSnapshot`, `getSnapshotDate`, `loadPriceSnapshots`, `saveDailyPriceSnapshots`, `savePriceSnapshots`.
- Major constants: `PRICE_SNAPSHOT_KEY`, `PRICE_SNAPSHOT_SOURCE`.
- Likely responsibility: Owned holdings, exit planning, position management, price checks, and P/L..
- Detected dependencies: `Scryfall API`, `localStorage`, `pricing/snapshots`.
- Detected runtime globals referenced: `priceSnapshots`, `specs`.
- Referenced cross-file symbols: `loadJsonArray (js/core/storage.js)`, `specs (js/core/state.js)`.

### js/modules/portfolio/pricing.js

- Approximate line count: 142.
- Exported globals: `PRICE_REFRESH_FRESH_MS`, `getPricingScryfallId`, `getScryfallUsdPrice`, `isPriceRefreshFresh`, `priceRefreshInFlight`, `refreshPrices`, `runPriceRefresh`, `savePriceRefreshStatus`.
- Top-level functions: `getPricingScryfallId`, `getScryfallUsdPrice`, `isPriceRefreshFresh`, `refreshPrices`, `runPriceRefresh`, `savePriceRefreshStatus`.
- Major constants: `PRICE_REFRESH_FRESH_MS`.
- Likely responsibility: Owned holdings, exit planning, position management, price checks, and P/L..
- Detected dependencies: `Scryfall API`, `localStorage`, `pricing/snapshots`.
- Detected runtime globals referenced: `radar`, `specs`.
- Referenced cross-file symbols: `loadPriceRefreshStatus (js/core/storage.js)`, `radar (js/core/state.js)`, `renderPriceRefreshStatus (js/ui/summary.js)`, `save (js/core/app.js)`, `saveDailyPriceSnapshots (js/modules/portfolio/snapshots.js)`, `saveRadarState (js/core/storage.js)`, `specs (js/core/state.js)`, `syncCardMetadata (js/modules/card-metadata/card-metadata.js)`, `updatePL (js/ui/summary.js)`, `updateTotals (js/ui/summary.js)`.

### js/core/app.js

- Approximate line count: 369.
- Exported globals: `addSpec`, `focusTrackedRow`, `getSpec`, `hideUniversalSearchResults`, `initApp`, `initNavigation`, `initUniversalSearch`, `money`, `openTrackedSource`, `renderUniversalSearchResults`, `requestAppConfirmation`, `save`, `setActiveView`, `showAppNotice`, `tableMoney`, `updateUniversalSearchResults`.
- Top-level functions: `addSpec`, `focusTrackedRow`, `getSpec`, `hideUniversalSearchResults`, `initApp`, `initNavigation`, `initUniversalSearch`, `money`, `openTrackedSource`, `renderUniversalSearchResults`, `requestAppConfirmation`, `save`, `setActiveView`, `showAppNotice`, `tableMoney`, `updateUniversalSearchResults`.
- Major constants: (none detected).
- Likely responsibility: Navigation, global search, toasts, confirmations, and app boot..
- Detected dependencies: `Scryfall API`, `app navigation`, `app notices`, `pricing/snapshots`, `transactions`.
- Detected runtime globals referenced: `cash`, `radar`, `signals`, `specs`, `transactions`.
- Referenced cross-file symbols: `addRadarItem (js/modules/radar/radar.js)`, `buildPrintingFinishCard (js/modules/portfolio/printings.js)`, `cash (js/core/state.js)`, `dismissRadarSearchSurface (js/modules/portfolio/search.js)`, `escapeAttribute (js/modules/portfolio/portfolio.js)`, `escapeHtml (js/modules/portfolio/portfolio.js)`, `findTrackedCard (js/modules/card-details/card-details.js)`, `initHelp (js/ui/help.js)`, `radar (js/core/state.js)`, `refreshPortfolioTable (js/modules/portfolio/portfolio.js)`, `refreshPrices (js/modules/portfolio/pricing.js)`, `renderAdminView (js/modules/admin/admin.js)`, `renderDashboardView (js/modules/dashboard/dashboard.js)`, `renderHistoryView (js/modules/history/history.js)`, `renderPortfolioView (js/modules/portfolio/portfolio.js)`, `renderPriceRefreshStatus (js/ui/summary.js)`, `renderRadarItems (js/modules/radar/radar.js)`, `renderRadarView (js/modules/radar/radar.js)`, ... capped 12 more.

## Shared Component Inventory

### Shared tables

- Detected files: `js/ui/table.js`.
- Detected markers: `renderStandardTable`, `paginateStandardRows`.
- Referenced by: `js/modules/portfolio/portfolio.js`, `js/modules/radar/radar.js`, `js/modules/transactions/transactions.js`, `js/modules/signals/signals.js`, `js/modules/history/history.js`.

### Context bands

- Detected files: `js/ui/context-band.js`.
- Detected markers: (none detected).
- Referenced by: (none detected).

### Summary bar

- Detected files: `js/ui/summary.js`.
- Detected markers: `updateTotals`.
- Referenced by: `js/core/storage.js`, `js/modules/portfolio/trading.js`, `js/modules/card-details/card-details.js`, `js/modules/portfolio/pricing.js`, `js/core/app.js`.

### Help drawer

- Detected files: `js/ui/help.js`.
- Detected markers: `openHelpDrawer`, `help`.
- Referenced by: `js/ui/intent-modal.js`, `js/modules/card-details/card-details.js`, `js/core/app.js`.

### Toast system

- Detected files: `js/core/app.js`.
- Detected markers: `showAppNotice`, `toastStack`.
- Referenced by: `js/modules/portfolio/trading.js`, `js/modules/portfolio/portfolio.js`, `js/modules/radar/radar.js`, `js/modules/signals/signals.js`, `js/modules/thesis/thesis.js`, `js/modules/admin/admin.js`, `js/modules/card-details/card-details.js`.

### Confirmation dialog

- Detected files: `js/core/app.js`.
- Detected markers: `requestAppConfirmation`, `appConfirmDialog`.
- Referenced by: `js/ui/intent-modal.js`, `js/modules/portfolio/trading.js`, `js/modules/portfolio/search.js`, `js/modules/admin/admin.js`.

### Card Detail helpers

- Detected files: `js/modules/card-details/card-details.js`.
- Detected markers: `openCardDetail`, `cardDetail`.
- Referenced by: `js/modules/dashboard/dashboard.js`, `js/modules/portfolio/portfolio.js`, `js/modules/portfolio/search.js`, `js/modules/radar/radar.js`, `js/modules/transactions/transactions.js`, `js/modules/signals/signals.js`, `js/modules/thesis/thesis.js`, `js/modules/history/history.js`.

### Formatting helpers

- Detected files: `js/core/app.js`, `js/ui/table.js`.
- Detected markers: `money`, `tableMoney`, `escapeHtml`.
- Referenced by: `js/modules/card-filters/card-filters.js`, `js/ui/table.js`, `js/ui/intent-modal.js`, `js/modules/dashboard/dashboard.js`, `js/modules/portfolio/trading.js`, `js/modules/portfolio/portfolio.js`, `js/modules/portfolio/printings.js`, `js/modules/portfolio/search.js`, `js/modules/radar/radar.js`, `js/modules/transactions/transactions.js`, `js/modules/signals/signals.js`, `js/modules/thesis/thesis.js`, ... capped 3 more.

### Storage helpers

- Detected files: `js/core/storage.js`.
- Detected markers: `loadJsonValue`, `saveState`, `createManaSpecBackup`.
- Referenced by: `js/modules/admin/admin.js`, `js/core/app.js`.

### Tracked printing identity

- Detected files: `js/modules/card-metadata/card-metadata.js`, `js/modules/notes/notes.js`.
- Detected markers: `getTrackedPrintingKey`, `findTrackedCard`.
- Referenced by: `js/modules/notes/notes.js`, `js/modules/dashboard/dashboard.js`, `js/modules/signals/signals.js`, `js/modules/thesis/thesis.js`, `js/modules/history/history.js`, `js/modules/card-details/card-details.js`, `js/core/app.js`.

## localStorage Contract

Generated from string-literal storage calls and known backup helper arrays. Do not treat sample fields as exhaustive.

### cardDetailNotesExpanded

- Purpose: Card Detail UI expansion preference..
- Approximate structure: scalar.
- Sample fields: `boolean`.
- Modules that appear to read it: `js/modules/card-details/card-details.js`.
- Modules that appear to write it: `js/modules/card-details/card-details.js`.
- Detection: detected read, detected write, known key hint.

### cardNotes

- Purpose: Shared notes keyed to exact tracked printing identity..
- Approximate structure: array of objects.
- Sample fields: `id`, `cardKey`, `cardId`, `cardName`, `text`, `createdAt`, `source`.
- Modules that appear to read it: `js/core/storage.js`.
- Modules that appear to write it: `js/core/storage.js`.
- Detection: detected read, detected write, known key hint.

### cash

- Purpose: Available cash balance..
- Approximate structure: scalar.
- Sample fields: `number`.
- Modules that appear to read it: `js/core/storage.js`.
- Modules that appear to write it: `js/core/storage.js`, `js/modules/portfolio/trading.js`.
- Detection: detected read, detected write, known key hint.

### manaspec_pre_import_backup

- Purpose: Emergency backup captured before import restore..
- Approximate structure: object containing a full backup.
- Sample fields: `createdAt`, `reason`, `backup`.
- Modules that appear to read it: (none detected).
- Modules that appear to write it: (none detected).
- Detection: known key hint.

### marketObservations

- Purpose: Saved market-check observations for tracked printings..
- Approximate structure: array of objects.
- Sample fields: `id`, `cardKey`, `text`, `createdAt`, `source`, `evaluation`.
- Modules that appear to read it: `js/core/storage.js`.
- Modules that appear to write it: `js/core/storage.js`.
- Detection: detected read, detected write, known key hint.

### priceRefreshStatus

- Purpose: Metadata for the latest price refresh..
- Approximate structure: object.
- Sample fields: `checkedAt`, `updatedCount`.
- Modules that appear to read it: `js/core/storage.js`.
- Modules that appear to write it: `js/core/storage.js`, `js/modules/portfolio/pricing.js`.
- Detection: detected read, detected write, known key hint.

### priceSnapshots

- Purpose: Dated price snapshots for tracked cards..
- Approximate structure: array of objects.
- Sample fields: `id`, `cardId`, `date`, `price`, `source`, `foil`.
- Modules that appear to read it: `js/core/storage.js`.
- Modules that appear to write it: `js/core/storage.js`.
- Detection: detected read, detected write, known key hint.

### radar

- Purpose: Watched pre-purchase ideas and entry planning state..
- Approximate structure: array of objects.
- Sample fields: `id`, `name`, `set_code`, `collector_number`, `foil`, `currentPrice`, `entryTarget`, `plannedQty`, `status`, `addedDate`.
- Modules that appear to read it: `js/core/storage.js`.
- Modules that appear to write it: `js/core/state.js`, `js/core/storage.js`.
- Detection: detected read, detected write, known key hint.

### signals

- Purpose: Legacy saved signal records; active Signals rows are mostly computed..
- Approximate structure: array of objects.
- Sample fields: (none detected).
- Modules that appear to read it: `js/core/storage.js`.
- Modules that appear to write it: `js/core/storage.js`.
- Detection: detected read, detected write, known key hint.

### specs

- Purpose: Owned Positions and current position state..
- Approximate structure: array of objects.
- Sample fields: `id`, `name`, `qty`, `buyPrice`, `currentPrice`, `exitTarget`, `holdUntil`, `foil`, `buyDate`.
- Modules that appear to read it: `js/core/storage.js`.
- Modules that appear to write it: `js/core/state.js`, `js/core/storage.js`, `js/modules/portfolio/portfolio.js`, `js/modules/signals/signals.js`.
- Detection: detected read, detected write, known key hint.

### thesisNotes

- Purpose: Retired or archived thesis notes preserved for compatibility..
- Approximate structure: array of objects.
- Sample fields: `id`, `cardId`, `cardName`, `conviction`, `text`, `createdAt`.
- Modules that appear to read it: `js/core/storage.js`.
- Modules that appear to write it: `js/core/storage.js`.
- Detection: detected read, detected write, known key hint.

### transactions

- Purpose: Early ledger events for buys, sells, backfills, and review context..
- Approximate structure: array of objects.
- Sample fields: `id`, `cardId`, `type`, `quantity`, `price`, `date`, `notes`, `realizedPL`, `balanceAfter`.
- Modules that appear to read it: `js/core/storage.js`.
- Modules that appear to write it: `js/core/state.js`, `js/core/storage.js`.
- Detection: detected read, detected write, known key hint.

## Data Contract Summary

### Radar Item

- Owner: Radar / Card Detail.
- Sample fields: `id`, `name`, `set_code`, `collector_number`, `foil`, `currentPrice`, `entryTarget`, `plannedQty`, `status`, `addedDate`.
- Primary storage: radar (detected).
- Primary consumers: `Dashboard`, `Radar`, `Signals`, `Card Detail`, `History`, `Pricing`.

### Position

- Owner: Positions / Card Detail.
- Sample fields: `id`, `name`, `qty`, `buyPrice`, `currentPrice`, `exitTarget`, `holdUntil`, `foil`, `buyDate`.
- Primary storage: specs (detected).
- Primary consumers: `Dashboard`, `Positions`, `Signals`, `Transactions`, `Card Detail`, `Pricing`.

### Transaction

- Owner: Transactions / trading helpers.
- Sample fields: `id`, `cardId`, `type`, `quantity`, `price`, `date`, `notes`, `realizedPL`, `balanceAfter`.
- Primary storage: transactions (detected).
- Primary consumers: `Transactions`, `History`, `Dashboard`, `Admin backup`.

### Signal

- Owner: Signals.
- Sample fields: `id`, `source`, `status`, `bucket`, `reason`, `targetValue`, `currentPrice`.
- Primary storage: signals (legacy saved records); active rows are computed.
- Primary consumers: `Signals`, `Dashboard`.

### Card Note

- Owner: Notes / Card Detail.
- Sample fields: `id`, `cardKey`, `cardId`, `cardName`, `text`, `createdAt`, `source`.
- Primary storage: cardNotes (detected).
- Primary consumers: `Dashboard`, `History`, `Card Detail`, `Radar`, `Positions`.

### Market Observation

- Owner: Card Detail.
- Sample fields: `id`, `cardKey`, `text`, `createdAt`, `source`, `evaluation`.
- Primary storage: marketObservations (detected).
- Primary consumers: `Card Detail`, `Dashboard`, `Signals`.

### Price Snapshot

- Owner: Pricing / snapshots.
- Sample fields: `id`, `cardId`, `date`, `price`, `source`, `foil`.
- Primary storage: priceSnapshots (detected).
- Primary consumers: `Positions`, `Card Detail`, `Dashboard`, `Admin backup`.

## Dependency Map

Generated dependency hints. This is not a complete call graph.

### Dashboard

```text
Dashboard
  -> Card Detail
  -> Dashboard/Signals attention
  -> app navigation
  -> cardNotes
  -> cash
  -> notes helpers
  -> radar
  -> signals
  -> ... capped 1 more
```

### Radar

```text
Radar
  -> Card Detail
  -> Scryfall API
  -> app notices
  -> cash
  -> currentPrintings
  -> notes helpers
  -> radar
  -> shared table renderer
  -> ... capped 2 more
```

### Positions

```text
Positions
  -> Card Detail
  -> Scryfall API
  -> app notices
  -> cash
  -> localStorage
  -> notes helpers
  -> priceSnapshots
  -> pricing/snapshots
  -> ... capped 5 more
```

### Signals

```text
Signals
  -> Card Detail
  -> Dashboard/Signals attention
  -> app navigation
  -> app notices
  -> localStorage
  -> radar
  -> shared table renderer
  -> signals
  -> ... capped 1 more
```

### Card Detail

```text
Card Detail
  -> Card Detail
  -> Scryfall API
  -> app notices
  -> localStorage
  -> notes helpers
  -> pricing/snapshots
  -> radar
  -> signals
  -> ... capped 1 more
```

### Transactions

```text
Transactions
  -> Card Detail
  -> cash
  -> radar
  -> shared table renderer
  -> specs
  -> startingCash
  -> transactions
```

### History

```text
History
  -> Card Detail
  -> cardNotes
  -> notes helpers
  -> radar
  -> shared table renderer
  -> specs
  -> thesisNotes
  -> transactions
```

### Notes

```text
Notes
  -> Scryfall API
  -> cardNotes
  -> notes helpers
  -> radar
  -> specs
```

### Admin

```text
Admin
  -> app notices
  -> backup/import
  -> cardNotes
  -> cash
  -> marketObservations
  -> notes helpers
  -> priceSnapshots
  -> pricing/snapshots
  -> ... capped 5 more
```

## DOM Contract

Detected selectors used by active JS. Generated class names are heuristic and capped.

### js/core/storage.js

- IDs used: (none detected).
- Classes used: (none detected).
- Query selectors: (none detected).
- Generated class names: (none detected).

### js/core/state.js

- IDs used: (none detected).
- Classes used: (none detected).
- Query selectors: (none detected).
- Generated class names: (none detected).

### js/modules/card-metadata/card-metadata.js

- IDs used: (none detected).
- Classes used: (none detected).
- Query selectors: (none detected).
- Generated class names: (none detected).

### js/modules/notes/notes.js

- IDs used: (none detected).
- Classes used: `.note-control`, `.note-control__badge`, `.note-control__icon`.
- Query selectors: (none detected).
- Generated class names: `.note-control`, `.note-control__badge`, `.note-control__icon`.

### js/modules/card-filters/card-filters.js

- IDs used: `#${idPrefix}FilterColor`, `#${idPrefix}FilterMaxPrice`, `#${idPrefix}FilterMinPrice`, `#${idPrefix}FilterPlan`, `#${idPrefix}FilterRarity`, `#${idPrefix}FilterReprint`, `#${idPrefix}FilterReserved`, `#${idPrefix}FilterReset`, `#${idPrefix}FilterText`, `#${idPrefix}FilterType`.
- Classes used: `.card-filter-controls`, `.card-filter-panel`, `.compact-heading`, `.filter-control`, `.filter-meta`, `.filter-reset-btn`, `.inline-check`, `.money-input`, `.panel-heading`.
- Query selectors: `.filter-control input, .filter-control select, .inline-check input`, `[data-filter-prefix=`.
- Generated class names: `.card-filter-controls`, `.card-filter-panel`, `.compact-heading`, `.filter-control`, `.filter-meta`, `.filter-reset-btn`, `.inline-check`, `.money-input`, `.panel-heading`.

### js/ui/table.js

- IDs used: `#${idPrefix}TablePageSize`.
- Classes used: `.editing`, `.empty-state`, `.link-action`, `.ms-table__body`, `.ms-table__editable`, `.ms-table__editable-display`, `.ms-table__editable-input-wrap`, `.ms-table__header`, `.ms-table__input`, `.ms-table__input-wrap`, `.ms-table__row`, `.ms-table__sort`, `.ms-table__stepper`, `.ms-table__stepper-btn`, `.ms-table__stepper-input`, `.row-actions`, `.status-pill`, `.table-page-size-control`.
- Query selectors: `.ms-table__row`, `[data-ms-action]`, `[data-ms-edit]`, `[data-ms-input]`, `[data-ms-sort]`, `[data-ms-step]`.
- Generated class names: `.empty-state`, `.link-action`, `.ms-table__body`, `.ms-table__editable`, `.ms-table__editable-display`, `.ms-table__editable-input-wrap`, `.ms-table__header`, `.ms-table__input`, `.ms-table__input-wrap`, `.ms-table__row`, `.ms-table__sort`, `.ms-table__stepper`, `.ms-table__stepper-btn`, `.ms-table__stepper-input`, `.row-actions`, `.status-pill`, `.table-page-size-control`.

### js/ui/context-band.js

- IDs used: (none detected).
- Classes used: (none detected).
- Query selectors: (none detected).
- Generated class names: (none detected).

### js/ui/intent-modal.js

- IDs used: `#intentEntry`, `#intentHold`, `#intentNote`, `#intentQty`.
- Classes used: `.hold-time-helper`, `.intent-finish-choice`, `.intent-hold-field`, `.intent-modal-grid`, `.intent-modal-note`, `.intent-price-summary`.
- Query selectors: `#intentEntry`, `#intentHold`, `#intentNote`, `#intentQty`, `.intent-modal-grid input`, `[data-confirm-action=`, `input[name=`.
- Generated class names: `.hold-time-helper`, `.intent-finish-choice`, `.intent-hold-field`, `.intent-modal-grid`, `.intent-modal-note`, `.intent-price-summary`.

### js/modules/dashboard/dashboard.js

- IDs used: `#viewContainer`.
- Classes used: `.compact`, `.dashboard-state-grid`, `.dashboard-view`, `.dashboard-work-grid`, `.empty-state`, `.metric-grid`, `.scan-grid`, `.scan-panel`, `.view-heading`.
- Query selectors: `[data-dashboard-action]`, `[data-dashboard-state-action]`.
- Generated class names: `.compact`, `.dashboard-state-grid`, `.dashboard-view`, `.dashboard-work-grid`, `.empty-state`, `.metric-grid`, `.scan-grid`, `.scan-panel`, `.view-heading`.

### js/modules/portfolio/trading.js

- IDs used: `#sellConfirmQty`, `#sellConfirmTotal`.
- Classes used: `.sell-confirm-grid`, `.sell-confirm-options`, `.sell-confirm-total`.
- Query selectors: `#sellConfirmQty`, `#sellConfirmTotal`, `[data-sell-qty]`.
- Generated class names: `.sell-confirm-grid`, `.sell-confirm-options`, `.sell-confirm-total`.

### js/modules/portfolio/portfolio.js

- IDs used: `#portfolioCount`, `#portfolioTable`, `#viewContainer`.
- Classes used: `.ms-table`, `.ms-table--positions`, `.portfolio-workflow`, `.view-heading`.
- Query selectors: (none detected).
- Generated class names: `.ms-table`, `.ms-table--positions`, `.portfolio-workflow`, `.view-heading`.

### js/modules/portfolio/printings.js

- IDs used: `#printingsView`, `#searchResults`.
- Classes used: `.printing-picker-card`, `.printing-picker-header`, `.printing-picker-number`, `.printing-picker-price`, `.printing-picker-row`, `.printing-picker-set`, `.printing-picker-set-name`, `.search-row-action`.
- Query selectors: `.printing-picker-header [data-sort]`, `[data-action=`.
- Generated class names: `.printing-picker-card`, `.printing-picker-header`, `.printing-picker-number`, `.printing-picker-price`, `.printing-picker-set`, `.printing-picker-set-name`, `.search-row-action`.

### js/modules/portfolio/search.js

- IDs used: `#appConfirmDialog`, `#bulkSetClear`, `#bulkSetInput`, `#bulkSetLookup`, `#bulkSetResults`, `#bulkSetStatus`, `#cardArtPreview`, `#cardArtPreviewImage`, `#cardArtPreviewTitle`, `#printingsView`, `#searchBox`, `#searchResults`.
- Classes used: `.bulk-set-row`, `.card-art-backdrop`, `.card-art-panel`, `.card-art-preview`, `.failed`, `.is-loading`, `.link-action`, `.open`, `.search-card-name`, `.search-result-identity`, `.search-result-row`, `.search-result-row--action`, `.search-result-row--card`, `.search-result-row--clickable`, `.search-row-action`, `.search-status-row`, `.search-status-spinner`.
- Query selectors: `[data-action=`, `[data-art-close]`, `[data-bulk-add]`.
- Generated class names: `.bulk-set-row`, `.card-art-backdrop`, `.card-art-panel`, `.failed`, `.link-action`, `.search-card-name`, `.search-result-identity`, `.search-row-action`, `.search-status-row`, `.search-status-spinner`.

### js/modules/radar/radar.js

- IDs used: `#radarCount`, `#radarList`, `#viewContainer`.
- Classes used: `.add-card-results`, `.context-search-results`, `.ms-table`, `.ms-table--radar`, `.panel-list`, `.radar-search-controls`, `.radar-view`, `.view-heading`.
- Query selectors: (none detected).
- Generated class names: `.add-card-results`, `.context-search-results`, `.ms-table`, `.ms-table--radar`, `.panel-list`, `.radar-search-controls`, `.radar-view`, `.view-heading`.

### js/modules/transactions/transactions.js

- IDs used: `#transactionsList`, `#txFilterCount`, `#txFilterReset`, `#txFilterText`, `#txFilterType`, `#viewContainer`.
- Classes used: `.card-filter-panel`, `.compact-filter-controls`, `.compact-heading`, `.filter-control`, `.filter-meta`, `.filter-reset-btn`, `.ledger-filter-bar`, `.module-view`, `.panel-heading`, `.transaction-filter-panel`, `.transaction-view`, `.view-heading`.
- Query selectors: (none detected).
- Generated class names: `.card-filter-panel`, `.compact-filter-controls`, `.compact-heading`, `.filter-control`, `.filter-meta`, `.filter-reset-btn`, `.ledger-filter-bar`, `.module-view`, `.panel-heading`, `.transaction-filter-panel`, `.transaction-view`, `.view-heading`.

### js/modules/signals/signals.js

- IDs used: `#clearSignalFilter`, `#signalsTable`, `#viewContainer`.
- Classes used: `.filter-reset-btn`, `.module-view`, `.signals-action-band`, `.signals-action-filter`, `.signals-action-preview`, `.signals-action-tiles`, `.signals-action-title`, `.signals-action-utility`, `.view-heading`.
- Query selectors: `[data-signal-bucket-filter]`, `[data-signal-card-filter]`.
- Generated class names: `.filter-reset-btn`, `.module-view`, `.signals-action-band`, `.signals-action-filter`, `.signals-action-preview`, `.signals-action-tiles`, `.signals-action-title`, `.signals-action-utility`, `.view-heading`.

### js/modules/thesis/thesis.js

- IDs used: `#thesisCardName`, `#thesisConviction`, `#thesisForm`, `#thesisList`, `#thesisText`, `#viewContainer`.
- Classes used: `.empty-state`, `.module-form`, `.module-list`, `.module-view`, `.note-card`, `.note-link-btn`, `.thesis-form`, `.view-heading`.
- Query selectors: `[data-thesis-card]`.
- Generated class names: `.empty-state`, `.module-form`, `.module-list`, `.module-view`, `.note-card`, `.note-link-btn`, `.thesis-form`, `.view-heading`.

### js/modules/history/history.js

- IDs used: `#historyFilterCount`, `#historyFilterReset`, `#historyFilterText`, `#historyFilterType`, `#historyList`, `#viewContainer`.
- Classes used: `.card-filter-panel`, `.compact-filter-controls`, `.compact-heading`, `.filter-control`, `.filter-meta`, `.filter-reset-btn`, `.history-filter-panel`, `.ledger-filter-bar`, `.module-view`, `.note-control__badge`, `.note-control__icon`, `.panel-heading`, `.view-heading`.
- Query selectors: (none detected).
- Generated class names: `.card-filter-panel`, `.compact-filter-controls`, `.compact-heading`, `.filter-control`, `.filter-meta`, `.filter-reset-btn`, `.history-filter-panel`, `.ledger-filter-bar`, `.module-view`, `.note-control__badge`, `.note-control__icon`, `.panel-heading`, `.view-heading`.

### js/modules/admin/admin.js

- IDs used: `#adminExportBackup`, `#adminImportBackup`, `#adminImportBackupFile`, `#adminResetCash`, `#viewContainer`.
- Classes used: `.admin-action`, `.admin-action-row`, `.admin-grid`, `.admin-panel`, `.admin-view`, `.backup-preview-grid`, `.backup-warning`, `.danger-lite`, `.muted`, `.view-heading`.
- Query selectors: (none detected).
- Generated class names: `.admin-action`, `.admin-action-row`, `.admin-grid`, `.admin-panel`, `.admin-view`, `.backup-preview-grid`, `.backup-warning`, `.danger-lite`, `.muted`, `.view-heading`.

### js/modules/card-details/card-details.js

- IDs used: `#cardDetailBody`, `#cardDetailModal`, `#cardNoteText`, `#cardNotesForm`, `#cardNotesSection`, `#closeCardDetail`, `#entryTargetInput`, `#exitTargetInput`, `#holdTimeInput`, `#saveTcgObservation`, `#showNoteHistory`, `#targetPlanForm`, `#tcgObservationPreview`, `#tcgParseStatus`, `#tcgPricePaste`.
- Classes used: `.card-data-strip`, `.card-detail-backdrop`, `.card-detail-modal`, `.card-detail-panel`, `.card-note-entry`, `.card-note-history`, `.card-note-list`, `.card-note-meta`, `.card-note-preview`, `.card-notes-form`, `.card-notes-section`, `.compact`, `.detail-actions`, `.detail-close`, `.detail-command-section`, `.detail-copy`, `.detail-grid`, `.detail-header`, `.detail-loading`, `.detail-lower-grid`, `.detail-main-grid`, `.detail-main-stack`, `.detail-market-grid`, `.detail-metric`, ... capped 25 more.
- Query selectors: `[data-action=`, `input`.
- Generated class names: `.card-data-strip`, `.card-detail-backdrop`, `.card-detail-panel`, `.card-note-entry`, `.card-note-history`, `.card-note-list`, `.card-note-meta`, `.card-note-preview`, `.card-notes-form`, `.card-notes-section`, `.compact`, `.detail-actions`, `.detail-close`, `.detail-command-section`, `.detail-copy`, `.detail-grid`, `.detail-header`, `.detail-loading`, `.detail-lower-grid`, `.detail-main-grid`, `.detail-main-stack`, `.detail-market-grid`, `.detail-metric`, `.detail-overview-section`, ... capped 23 more.

### js/ui/summary.js

- IDs used: `#cash`, `#invested`, `#priceRefreshStatus`, `#totalEquity`, `#totalPL`, `#value`.
- Classes used: (none detected).
- Query selectors: (none detected).
- Generated class names: (none detected).

### js/ui/help.js

- IDs used: `#helpDrawer`, `#helpTopicBody`, `#helpTopicList`, `#openHelpDrawer`.
- Classes used: `.activeHelpTopic`, `.help-backdrop`, `.help-close-btn`, `.help-drawer`, `.help-header`, `.help-panel`, `.help-topic-body`, `.help-topic-list`, `.open`.
- Query selectors: `[data-help-close]`, `[data-help-topic]`.
- Generated class names: `.activeHelpTopic`, `.help-backdrop`, `.help-close-btn`, `.help-header`, `.help-panel`, `.help-topic-body`, `.help-topic-list`.

### js/modules/portfolio/snapshots.js

- IDs used: (none detected).
- Classes used: (none detected).
- Query selectors: (none detected).
- Generated class names: (none detected).

### js/modules/portfolio/pricing.js

- IDs used: (none detected).
- Classes used: (none detected).
- Query selectors: (none detected).
- Generated class names: (none detected).

### js/core/app.js

- IDs used: `#appConfirmDialog`, `#portfolioTable`, `#toastStack`, `#universalSearch`, `#universalSearchButton`.
- Classes used: `.active`, `.app-confirm-actions`, `.app-confirm-backdrop`, `.app-confirm-body`, `.app-confirm-dialog`, `.app-confirm-panel`, `.app-toast`, `.closing`, `.ms-table__row--focused`, `.open`, `.show`, `.toolbar-tab`, `.universal-search-results`.
- Query selectors: `.toolbar-tab`, `[data-confirm-action=`, `[data-confirm-action]`, `[data-row-id=`, `[data-universal-search]`, `button`.
- Generated class names: `.app-confirm-actions`, `.app-confirm-backdrop`, `.app-confirm-body`, `.app-confirm-panel`.

## CSS Structure

### css/style.css

- Approximate size: 146 B; approximate lines: 6.
- Major selector groups: (none detected).
- Detected layout selectors: (none detected).
- Detected table selectors: (none detected).
- Detected form selectors: (none detected).
- Detected component/modal selectors: (none detected).
- Detected workflow selectors: (none detected).
- Media queries: 0; print rules: 0.

### css/base.css

- Approximate size: 1.4 KB; approximate lines: 66.
- Major selector groups: `body`, `button`, `hr`, `input`, `main`, `select`, `textarea`.
- Detected layout selectors: `main.container`.
- Detected table selectors: (none detected).
- Detected form selectors: `button`, `input`, `select`.
- Detected component/modal selectors: (none detected).
- Detected workflow selectors: (none detected).
- Media queries: 0; print rules: 0.

### css/layout.css

- Approximate size: 5.9 KB; approximate lines: 337.
- Major selector groups: `admin-view`, `app-header`, `app-header-actions`, `app-logo`, `app-subtitle`, `app-toast`, `dashboard-view`, `global-search-bar`, `header`, `module-view`, `placeholder-view`, `portfolio-workflow`, `priceRefreshStatus`, `radar-view`, `summary`, `summaryBar`, `to`, `toast-stack`, `toolbar`, `toolbar-tab`, ... capped 5 more.
- Detected layout selectors: `.app-header h2`, `.app-header-actions`, `.toolbar`, `.toolbar-tab`, `.view-container`, `.workbar`, `header`, `workbar`.
- Detected table selectors: (none detected).
- Detected form selectors: `.app-toast button`, `.global-search-bar button`, `.global-search-bar input`, `.universal-search-results button`, `.universal-search-results button:hover`.
- Detected component/modal selectors: `#summaryBar`, `#summaryBar div`, `#summaryBar span`, `#summaryBar strong`, `.app-toast`, `.app-toast button`, `.app-toast span`, `.app-toast.closing`, `.app-toast.info`, `.app-toast.save`, `.app-toast.trade`, `.app-toast.warning`, `.toast-stack`, `@keyframes toast-enter`, `summary`.
- Detected workflow selectors: `.admin-view`, `.dashboard-view`, `.portfolio-workflow`, `.radar-view`.
- Media queries: 1; print rules: 0.

### css/forms.css

- Approximate size: 14.9 KB; approximate lines: 831.
- Major selector groups: `add-printing-plan-grid`, `add-printing-plan-note`, `admin-action`, `button`, `buttons`, `card-art-panel`, `card-filter-controls`, `card-filter-panel`, `card-notes-form`, `card-thesis-form`, `cash-reset-btn`, `compact-filter-controls`, `compact-heading`, `danger`, `danger-lite`, `detail-close`, `detail-plan-section`, `filter-control`, `filter-meta`, `filter-reset-btn`, ... capped 10 more.
- Detected layout selectors: `.add-printing-plan-grid`, `.add-printing-plan-grid label`, `.add-printing-plan-grid span`, `.intent-modal-grid`, `.intent-modal-grid input`, `.intent-modal-grid label`, `.intent-modal-grid span`, `.intent-modal-grid textarea`, `.toolbar-tab`, `.toolbar-tab.active`, `.toolbar-tab:hover`.
- Detected table selectors: `.ms-btn--table`, `.ms-table__input`, `.ms-table__input[type="number"]`, `.row-actions`, `.row-actions button`, `.row-actions button:hover`, `.search-row-action`, `.search-row-action:hover`, `.table-page-size-control`, `.table-page-size-control select`, `.table-page-size-control select option`, `.table-page-size-control span`.
- Detected form selectors: `#universalSearchButton`, `.card-art-panel button`, `.card-filter-controls`, `.card-filter-controls .filter-reset-btn`, `.card-filter-controls input`, `.card-filter-controls select`, `.card-filter-panel`, `.card-notes-form`, `.card-notes-form button`, `.card-notes-form input`, `.card-thesis-form`, `.card-thesis-form button`, `.card-thesis-form input`, `.card-thesis-form select`, `.card-thesis-form select option`, `.compact-filter-controls`, ... capped 4 more.
- Detected component/modal selectors: `.card-art-panel button`, `.card-filter-controls`, `.card-filter-controls .filter-reset-btn`, `.card-filter-controls input`, `.card-filter-controls select`, `.card-filter-panel`, `.card-notes-form`, `.card-notes-form button`, `.card-notes-form input`, `.card-thesis-form`, `.card-thesis-form button`, `.card-thesis-form input`, `.card-thesis-form select`, `.card-thesis-form select option`, `.intent-modal-grid`, `.intent-modal-grid input`, ... capped 4 more.
- Detected workflow selectors: `.admin-action`, `.module-context-card .radar-search-controls`, `.radar-search-controls`, `.radar-search-controls .inline-check`, `.radar-search-controls input`, `.radar-search-controls select`, `.radar-search-toggle-group`, `.radar-search-toggle-group .inline-check + .inline-check`, `.radar-search-toggle-group .inline-check:has(input:checked)`, `.signal-actions`, `.signal-actions button`, `.signal-add-form`, `.signal-add-form button`, `.signal-add-form input`.
- Media queries: 1; print rules: 0.

### css/components.css

- Approximate size: 36.6 KB; approximate lines: 2025.
- Major selector groups: `add-card-panel`, `add-card-results`, `admin-action-row`, `admin-grid`, `admin-panel`, `app-confirm-actions`, `app-confirm-backdrop`, `app-confirm-body`, `app-confirm-dialog`, `app-confirm-panel`, `attention-queue-row`, `backup-preview-grid`, `backup-warning`, `bulk-set-actions`, `bulk-set-panel`, `bulk-set-results`, `bulk-set-row`, `button`, `card-art-backdrop`, `card-art-panel`, ... capped 10 more.
- Detected layout selectors: `.admin-grid`, `.app-confirm-panel header`, `.app-confirm-panel:has(.intent-modal-grid)`, `.backup-preview-grid`, `.backup-preview-grid div`, `.backup-preview-grid span`, `.backup-preview-grid strong`, `.card-art-panel header`, `.card-note-entry header`, `.card-note-entry header span`, `.context-search-results .printing-picker-header > *`, `.dashboard-state-grid`, `.dashboard-state-grid .metric-card`, `.dashboard-state-grid .metric-card small`, `.dashboard-state-grid .metric-card span`, `.dashboard-state-grid .metric-card strong`, ... capped 4 more.
- Detected table selectors: `.admin-action-row`, `.admin-action-row button`, `.attention-queue-row strong`, `.bulk-set-row`, `.bulk-set-row small`, `.bulk-set-row span`, `.bulk-set-row strong`, `.bulk-set-row.failed`, `.bulk-set-row:hover`, `.context-search-results .printing-picker-row .printing-picker-set-name`, `.context-search-results .printing-picker-row .search-row-action`, `.context-search-results .printing-picker-row span`, `.context-search-results .search-result-row .search-result-identity`, `.context-search-results .search-result-row span`, `.dashboard-queue-row--static`, `.module-row`, ... capped 4 more.
- Detected form selectors: `.admin-action-row button`, `.app-confirm-actions button`, `.card-filter-panel`, `.dashboard-state-grid button.metric-card`, `.dashboard-state-grid button.metric-card:focus-visible`, `.dashboard-state-grid button.metric-card:hover`, `.help-topic-list button`, `.help-topic-list button.active`, `.market-paste-actions button`, `.module-context-card .radar-search-controls`, `.module-form`, `.sell-confirm-grid input`, `.sell-confirm-options button`, `.signals-action-filter`, `.signals-action-filter > small`, `.signals-action-filter:focus-visible`, ... capped 4 more.
- Detected component/modal selectors: `.add-card-panel`, `.add-card-results`, `.app-confirm-dialog`, `.app-confirm-dialog.open`, `.app-confirm-panel:has(.intent-modal-grid)`, `.backup-preview-grid`, `.backup-preview-grid div`, `.backup-preview-grid span`, `.backup-preview-grid strong`, `.card-art-backdrop`, `.card-art-panel`, `.card-art-panel header`, `.card-art-panel img`, `.card-art-preview`, `.card-art-preview.open`, `.card-data-strip`, ... capped 4 more.
- Detected workflow selectors: `.admin-action-row`, `.admin-action-row button`, `.admin-grid`, `.admin-panel`, `.admin-panel h4`, `.admin-panel p`, `.admin-panel.muted`, `.card-detail-backdrop`, `.card-detail-modal`, `.card-detail-modal.open`, `.card-detail-panel`, `.card-note-history summary`, `.card-note-history summary::marker`, `.dashboard-queue-row--static`, `.dashboard-state-grid`, `.dashboard-state-grid .metric-card`, `.dashboard-state-grid .metric-card small`, `.dashboard-state-grid .metric-card span`, ... capped 6 more.
- Media queries: 1; print rules: 0.

### css/tables.css

- Approximate size: 14.8 KB; approximate lines: 767.
- Major selector groups: `ms-table`, `ms-table--history`, `ms-table--ledger`, `ms-table--plan`, `ms-table--positions`, `ms-table--radar`, `ms-table--signals`, `ms-table__body`, `ms-table__cell--actions`, `ms-table__cell--center`, `ms-table__cell--money`, `ms-table__cell--number`, `ms-table__editable`, `ms-table__editable-display`, `ms-table__editable-input-wrap`, `ms-table__header`, `ms-table__input`, `ms-table__input-wrap`, `ms-table__row`, `ms-table__row--focused`, ... capped 10 more.
- Detected layout selectors: `.ms-table__header`, `.ms-table__header .ms-table__cell--actions`, `.ms-table__header .ms-table__cell--center`, `.ms-table__header .ms-table__cell--money`, `.ms-table__header .ms-table__cell--number`, `.ms-table__header .ms-table__head-cell`, `.ms-table__header .ms-table__sort`, `.ms-table__header > *`, `.ms-table__header > *:last-child`, `.printing-picker-header`, `.printing-picker-header > *`, `.printing-picker-header > *:first-child`, `.printing-picker-header [data-sort]`, `.printing-picker-header [data-sort]:hover`.
- Detected table selectors: `.ms-table`, `.ms-table .row-actions`, `.ms-table .row-actions button`, `.ms-table .status-pill`, `.ms-table [data-ms-tooltip]`, `.ms-table [data-ms-tooltip]:focus-visible::after`, `.ms-table [data-ms-tooltip]:hover::after`, `.ms-table button`, `.ms-table input`, `.ms-table select`, `.ms-table--history`, `.ms-table--ledger`, `.ms-table--plan`, `.ms-table--positions`, `.ms-table--radar`, `.ms-table--signals`, ... capped 4 more.
- Detected form selectors: `.ms-table .row-actions button`, `.ms-table button`, `.ms-table input`, `.ms-table select`, `.ms-table__editable-input-wrap`, `.ms-table__editable-input-wrap .ms-table__input`, `.ms-table__editable-input-wrap > span`, `.ms-table__editable.editing .ms-table__editable-input-wrap`, `.ms-table__input`, `.ms-table__input-wrap`, `.ms-table__input-wrap .ms-table__input`, `.ms-table__input-wrap span`, `.ms-table__input.ms-table__cell--center`, `.ms-table__input.ms-table__cell--money`, `.ms-table__input.ms-table__cell--number`, `.ms-table__input[type="number"]`, ... capped 4 more.
- Detected component/modal selectors: `.printing-picker-card`, `.printing-picker-card:hover`.
- Detected workflow selectors: `.ms-table--history`, `.ms-table--positions`, `.ms-table--radar`, `.ms-table--signals`.
- Media queries: 1; print rules: 0.

## HTML Load Order

### CSS

1. css/style.css

### JavaScript

1. js/core/storage.js
2. js/core/state.js
3. js/modules/card-metadata/card-metadata.js
4. js/modules/notes/notes.js
5. js/modules/card-filters/card-filters.js
6. js/ui/table.js
7. js/ui/context-band.js
8. js/ui/intent-modal.js
9. js/modules/dashboard/dashboard.js
10. js/modules/portfolio/trading.js
11. js/modules/portfolio/portfolio.js
12. js/modules/portfolio/printings.js
13. js/modules/portfolio/search.js
14. js/modules/radar/radar.js
15. js/modules/transactions/transactions.js
16. js/modules/signals/signals.js
17. js/modules/thesis/thesis.js
18. js/modules/history/history.js
19. js/modules/admin/admin.js
20. js/modules/card-details/card-details.js
21. js/ui/summary.js
22. js/ui/help.js
23. js/modules/portfolio/snapshots.js
24. js/modules/portfolio/pricing.js
25. js/core/app.js

### App Shell

- Navigation views: `dashboard`, `radar`, `portfolio`, `signals`, `transactions`, `history`, `admin`.
- Root containers and mounts: `#appConfirmDialog`, `#cash`, `#invested`, `#openHelpDrawer`, `#priceRefreshStatus`, `#summaryBar`, `#toastStack`, `#totalEquity`, `#totalPL`, `#universalSearch`, `#universalSearchButton`, `#value`, `#viewContainer`.
- Modal/shared UI mounts: `toastStack`, `appConfirmDialog`, Card Detail modal generated at runtime.

## Global Namespace Summary

- Detected runtime state globals: `cardNotes`, `cash`, `currentPrintings`, `priceRefreshInFlight`, `radar`, `signals`, `specs`, `thesisNotes`, `transactions`.
- Detected top-level state variables: `activeCardDetail`, `activeHelpTopic`, `activeSearchRequestId`, `activeSignalBucket`, `activeSignalCardId`, `cardNotes`, `cash`, `currentPrintings`, `exactCardFilterByPrefix`, `historySort`, `latestSearchCandidates`, `portfolioSort`, `priceRefreshInFlight`, `printSortState`, `radar`, `radarSort`, `signals`, `signalsSort`, `specs`, `thesisNotes`, `transactions`, `transactionsSort`.
- Detected window.* assignments/flags: `window.cardArtEscapeHandlerInstalled`, `window.cardDetailEscapeHandlerInstalled`, `window.radarSearchEscapeHandlerInstalled`, `window.radarSearchOutsideDismissHandlerInstalled`.
- Detected top-level function globals: `addAutocompleteCandidates`, `addCardNote`, `addFuzzyNameCandidate`, `addOrderedFragmentNameCandidates`, `addPartialNameCandidates`, `addRadarItem`, `addSearchCandidate`, `addSpec`, `addThesisFromForm`, `addThesisNote`, `applyCardFilters`, `backfillTransactionsFromCurrentPositions`, `bindIntentFinishChoice`, `bindIntentKeyboardSubmit`, `bindStandardTableEvents`, `buildAdvancedScryfallQuery`, `buildEvaluationItem`, `buildHistoryEvents`, `buildManaSpecBackupCounts`, `buildMarketEvaluation`, `buildPrintingFinishCard`, `buildSignalAttentionRow`, `buildTrackedCard`, `buyRadarItem`, `buySpec`, `clearExactCardFilter`, `closeCardArtPreview`, `closeCardDetail`, `closeHelpDrawer`, `comparePortfolioSortValue`, `comparePrintingPrices`, `comparePrintingValues`, `compareSignalBucketPriority`, `compareSignalPriority`, `compareStandardSortValues`, `compareTransactionsChronologically`, `confirmAdminResetCash`, `createManaSpecBackup`, `createPriceSnapshot`, `deleteSpec`, ... capped 436 more.

## Architecture Hotspots

Informational only. This section identifies central or larger files; it does not recommend refactoring.

### Largest JS Files

- js/modules/card-details/card-details.js: 1008 lines
- js/modules/portfolio/search.js: 844 lines
- js/modules/signals/signals.js: 721 lines
- js/modules/dashboard/dashboard.js: 523 lines
- js/modules/radar/radar.js: 460 lines
- js/modules/transactions/transactions.js: 417 lines
- js/modules/portfolio/portfolio.js: 379 lines
- js/core/app.js: 369 lines

### Largest CSS Files

- css/components.css: 2025 lines
- css/forms.css: 831 lines
- css/tables.css: 767 lines
- css/layout.css: 337 lines
- css/base.css: 66 lines
- css/style.css: 6 lines

### Largest Documentation Files

- docs/README.md: 686 lines
- docs/DATA_MODEL.md: 488 lines
- docs/ROADMAP.md: 365 lines
- docs/audits/architecture-audit-2026-06-21.md: 363 lines
- docs/WORKFLOW.md: 361 lines
- docs/STYLE_GUIDE.md: 324 lines
- docs/audits/documentation-drift-audit-2026-06-30.md: 262 lines
- docs/ARCHITECTURE.md: 257 lines

### High-Dependency Modules

- js/core/storage.js: 5 dependencies, 10 runtime globals referenced
- js/modules/admin/admin.js: 5 dependencies, 9 runtime globals referenced
- js/core/state.js: 3 dependencies, 8 runtime globals referenced
- js/core/app.js: 5 dependencies, 5 runtime globals referenced
- js/modules/dashboard/dashboard.js: 4 dependencies, 5 runtime globals referenced
- js/modules/radar/radar.js: 6 dependencies, 3 runtime globals referenced
- js/modules/signals/signals.js: 6 dependencies, 3 runtime globals referenced
- js/modules/history/history.js: 4 dependencies, 5 runtime globals referenced

### Shared Infrastructure Modules

- js/core/storage.js
- js/core/state.js
- js/core/app.js
- js/ui/table.js
- js/ui/context-band.js
- js/ui/summary.js
- js/modules/card-details/card-details.js

## Repository Metrics

- JS file count: 25.
- CSS file count: 6.
- Documentation count under docs/: 13.
- Script count in index.html: 25.
- Storage key count: 12.
- Workflow/module count: 9.
- Average active JS module size: 313 lines.
- Largest generated file set:
  - tools/generate-repo-snapshot.js: 47.3 KB
  - css/components.css: 36.6 KB
  - js/modules/card-details/card-details.js: 33.0 KB
  - docs/README.md: 32.3 KB
  - archive/retired-css-2026-06-05/legacy.css: 27.8 KB
  - js/modules/signals/signals.js: 24.8 KB
  - archive/retired-css-2026-06-05/system.css: 24.6 KB
  - js/modules/portfolio/search.js: 23.5 KB
  - docs/ROADMAP.md: 19.2 KB
  - js/modules/dashboard/dashboard.js: 17.8 KB
  - docs/WORKFLOW.md: 16.1 KB
  - docs/audits/hygiene-audit.md: 15.0 KB

## Documentation Map

Referenced from active docs when available.

- `README.md`: what ManaSpec is, current workflow behavior, module lineup, and where to start.
- `PRODUCT_PRINCIPLES.md`: stable product philosophy and decision mindset.
- `ARCHITECTURE.md`: how the app is built, boot flow, module ownership, rendering flow, storage ownership, and future architecture direction.
- `DATA_MODEL.md`: conceptual entities, relationships, ownership, lifecycle, and ledger migration context.
- `STYLE_GUIDE.md`: terminology, UI language, dense table rules, formatting conventions, and product feel.
- `ROADMAP.md`: active phase, next work, beta gates, and future phases.
- `WORKFLOW.md`: how humans, Codex, and GPT should work on the project.
- `DECISIONS.md`: durable choices and why they were made.
- `PARKING_LOT.md`: useful but uncommitted ideas.
- `CHANGELOG.md`: human-readable history of meaningful changes.
- `audits/`: dated reviews, audit plans, and diagnostic snapshots; not active authority unless findings are promoted into active docs.
- `dev notes/`: raw or historical project memory, not active authority.

## Repository Structure

Generated shallow tree. Release copies, backups, generated snapshot output, and dependency folders are excluded.

- .agents/
- archive/
  - inactive-js/
    - api.js
    - config.js
    - portfolio.js
    - README.txt
    - summary.js
  - retired-css-2026-06-05/
    - legacy.css
    - modules.css
    - system.css
- assets/
  - images/
    - manaspeclogo.png
- css/
  - base.css
  - components.css
  - forms.css
  - layout.css
  - style.css
  - tables.css
- dev notes/
  - archive/
    - app-core-architecture-2026-05-07.txt
    - app-folder-structure-2026-05-07.txt
    - app-north-star-statement.txt
    - app-roadmap-2025-05-13.txt
    - app-roadmap-2026-05-06.txt
    - app-roadmap-2026-05-08.txt
    - app-roadmap-2026-05-11.txt
    - app-roadmap-spa-architecture-2026-05-14.txt
    - app-spec.md
    - css-basics-update-notes-2026-05-16.txt
    - dashboard-2026-05-16.txt
    - imports-tcg-import-2025-05-19-fetchlands.js
    - imports-tcg-import-module-backlog.md
    - manaspec-the-app.md
    - portfolio-features-2026-05-16.txt
    - portfolio-split-modules-2026-05-16.txt
    - search-2026-05-14.txt
    - search-2026-05-16.txt
    - search-3way-splits-2026-05-16.txt
    - signals-v1-2026-05-16.txt
  - inbox/
    - 2026-05-29-ms-inbox.md
    - 2026-06-10-beta-test-01.md
    - 2026-06-11-session-notes.md
    - 2026-06-20-workflow-pass-architect-review.md
    - 2026-06-20-workflow-pass-batch-1.md
    - 2026-06-21-table-row-contract-regression-note.md
    - 2026-06-21-workflow-pass-batch-a-beta-critical-ux.md
    - 2026-06-22-workflow-pass-2-architect-summary.md
    - 2026-06-24-future-css-audit-pico-note.md
    - beta_action_review_2026-06-11.md
    - codex-friction-log.md
  - snapshots/
  - README.md
- docs/
  - audits/
    - architecture-audit-2026-06-21.md
    - audit-plan.md
    - documentation-drift-audit-2026-06-30.md
    - hygiene-audit.md
  - notes/
  - ARCHITECTURE.md
  - DATA_MODEL.md
  - DECISIONS.md
  - PARKING_LOT.md
  - PRODUCT_PRINCIPLES.md
  - README.md
  - ROADMAP.md
  - STYLE_GUIDE.md
  - WORKFLOW.md
- js/
  - core/
    - app.js
    - state.js
    - storage.js
  - modules/
    - admin/
    - card-details/
    - card-filters/
    - card-metadata/
    - dashboard/
    - history/
    - notes/
    - portfolio/
    - radar/
    - signals/
    - thesis/
    - transactions/
  - ui/
    - context-band.js
    - help.js
    - intent-modal.js
    - summary.js
    - table.js
- test-fixtures/
  - .gitkeep
- tools/
  - generate-repo-snapshot.js
- .gitignore
- AI Workflow.txt
- CHANGELOG.md
- index.html
- README.md
- static-server.mjs

## Snapshot Limits

- Generated: this file is produced by `tools/generate-repo-snapshot.js`.
- Lightweight: scanners use regexes and curated hints, not deep static analysis.
- Heuristic: ownership and dependencies are labeled as detected, likely, referenced, generated, or capped.
- Capped: long lists are truncated to keep the snapshot readable and diffs manageable.
- Orientation only: do not edit application code based only on this snapshot; open the real source and docs first.
- Excluded: full source code, full JSON data, CSS dumps, backup data, historical release copies, and generated mirrors of canonical docs.
