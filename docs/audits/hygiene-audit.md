# ManaSpec Hygiene Audit

Date: 2026-06-12

Scope: project-wide hygiene review of the active static ManaSpec app, with archived release snapshots treated as reference material rather than active code.

Priority lens: Search -> Radar -> Thesis -> Buy -> Positions -> Signals -> Dashboard -> History.

## Files Reviewed

- `index.html`
- `README.md`
- `docs/README.md`
- `docs/ROADMAP.md`
- `docs/WORKFLOW.md`
- `docs/DECISIONS.md`
- `css/style.css`
- `css/base.css`
- `css/layout.css`
- `css/forms.css`
- `css/components.css`
- `css/tables.css`
- `js/core/app.js`
- `js/core/state.js`
- `js/core/storage.js`
- `js/ui/table.js`
- `js/ui/summary.js`
- `js/ui/help.js`
- `js/modules/admin/admin.js`
- `js/modules/card-details/card-details.js`
- `js/modules/card-filters/card-filters.js`
- `js/modules/card-metadata/card-metadata.js`
- `js/modules/dashboard/dashboard.js`
- `js/modules/history/history.js`
- `js/modules/portfolio/portfolio.js`
- `js/modules/portfolio/pricing.js`
- `js/modules/portfolio/printings.js`
- `js/modules/portfolio/search.js`
- `js/modules/portfolio/snapshots.js`
- `js/modules/portfolio/trading.js`
- `js/modules/radar/radar.js`
- `js/modules/signals/signals.js`
- `js/modules/thesis/thesis.js`
- `js/modules/transactions/transactions.js`
- `archive/` and `releases/` folder structure, for active-vs-archived hygiene only

## Verification

- `git status --short` before work showed one untracked file: `dev notes/inbox/beta_action_review_2026-06-11.md`.
- Created checkpoint commit before audit changes: `ddcb692 chore: pre-hygiene-audit checkpoint`.
- Ran `node --check` across active `js/**/*.js`; all active JavaScript files passed syntax checks.
- No package-managed lint/test script exists because the project has no `package.json`.
- No behavior-changing cleanup was applied during this audit.

## Resolved Since Audit

- 2026-06-12, `551600c`: added safe JSON loading paths for localStorage-backed data, including `priceSnapshots`; added numeric guards across summary, dashboard, trading, and money formatting.
- 2026-06-12, `551600c`: added price refresh freshness gating and in-flight refresh protection.
- 2026-06-12, `551600c`: escaped user-authored and stored text in Dashboard, Thesis, Card Detail, and related detail displays.
- 2026-06-12, `7154e68`: refreshed active docs to remove stale Tabulator, Watchlists-as-current, legacy CSS, placeholder module, and `qty = 0` watch behavior references.
- 2026-06-12, `7154e68`: changed History so filtering/sorting happen before applying the display cap.
- 2026-06-15, `3c5403b`: refined History empty-state and filtered count behavior after the display-cap change.

## Fix Now

### Unprotected localStorage parsing can prevent app boot

- File: `js/core/storage.js`
- Issue: `loadSpecs`, `loadRadar`, `loadSignals`, `loadThesisNotes`, `loadTransactions`, `loadPriceRefreshStatus`, `loadMarketObservations`, and `loadPriceSnapshots` parse localStorage JSON without a recovery path.
- Why it matters: one malformed stored value can break app startup or a core view, which is high trust damage for a local-first beta.
- Suggested action: add small safe JSON loaders with fallback values, console warnings, and optional Admin repair/export guidance.
- Status: Fixed 2026-06-12 in `551600c`. Active loaders now use safe JSON helpers/fallbacks, and `priceSnapshots` is protected through `loadJsonArray()` with a local fallback.

### Price refresh runs automatically from multiple navigation paths

- File: `js/core/app.js`
- Issue: `refreshPrices()` runs on app boot and again when entering Radar or Positions.
- Why it matters: repeated Scryfall calls can make navigation feel slow, create noisy failure states, and refresh more often than the user expects.
- Suggested action: gate refreshes by last checked timestamp, add a manual refresh path, or skip automatic view refresh when prices were checked recently.
- Status: Fixed 2026-06-12 in `551600c`. Refresh now has a freshness gate and in-flight protection. A manual refresh path can still be considered later as UX polish.

### Search code references inactive price filter controls

- File: `js/modules/portfolio/search.js`
- Issue: `searchMinPrice` and `searchMaxPrice` are wired in search logic, but the active Radar search panel does not render those controls.
- Why it matters: it is harmless at runtime due optional checks, but it is dead UI contract drift and makes search behavior harder to reason about.
- Suggested action: either restore visible min/max search filters or remove the dormant references.

### Bulk set lookup helpers are unreachable from active UI

- File: `js/modules/portfolio/search.js`
- Issue: `initBulkSetLookup`, `runBulkSetLookup`, and related bulk set result helpers have no active UI mount.
- Why it matters: the code is nontrivial, styled in CSS, and looks operational, but cannot be reached from the current app.
- Suggested action: move to Admin later, archive deliberately, or document it as dormant owned-spec backfill scaffolding.

### Active README files describe outdated stack and module state

- Files: `README.md`, `docs/README.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`
- Issue: docs still mention Tabulator, Watchlists, placeholder Dashboard/Signals/Thesis/History, active `legacy.css`/`modules.css`, and `qty = 0` watch behavior as current.
- Why it matters: stale docs can steer future work toward old architecture and terminology.
- Suggested action: run a focused docs refresh after beta smoke testing; do not mix it into feature work.
- Status: Fixed 2026-06-12 in `7154e68`. Active docs now describe native tables, Radar/Positions ownership, Transactions/Admin navigation, current CSS files, and explicit Radar storage.

## Clean Soon

### Portfolio naming remains in code while product language says Positions

- Files: `js/modules/portfolio/*`, `js/core/app.js`, `docs/*`
- Issue: UI labels say Positions, while file names, function names, storage terms, and docs still use Portfolio.
- Why it matters: current behavior is understandable, but naming drift increases onboarding and refactor cost.
- Suggested action: leave file paths alone during beta; update user-facing docs and comments first, then consider code renames only when the ledger/Positions model stabilizes.

### Global script loading hides ownership and dependency order

- Files: `index.html`, `js/**/*.js`
- Issue: all modules are loaded as global scripts, so dependencies are implicit and order-sensitive.
- Why it matters: unused exports, circular dependencies, and ownership boundaries are hard to verify mechanically.
- Suggested action: keep this for beta stability, but add a lightweight dependency map in docs before any ES module migration.

### Duplicate formatting and escaping helpers are scattered

- Files: `js/core/app.js`, `js/ui/table.js`, `js/modules/portfolio/portfolio.js`, `js/modules/portfolio/search.js`, `js/modules/card-details/card-details.js`, `js/modules/transactions/transactions.js`
- Issue: money, percent, date, HTML escape, attribute escape, and sort helpers appear in several forms.
- Why it matters: small formatting changes can drift across Dashboard, Radar, Positions, Transactions, History, and Card Detail.
- Suggested action: consolidate only the obvious safe helpers into a shared utility once the current beta UI settles.

### Card Detail owns too many concerns

- File: `js/modules/card-details/card-details.js`
- Issue: one file handles live fetch, price sync, plan editing, thesis creation, market links, TCG parsing, market evaluation, target state, modal rendering, and formatting.
- Why it matters: Card Detail is becoming the command center, so regressions here can affect Radar, Positions, Signals, Transactions, History, and Thesis.
- Suggested action: report-only for now; later split pure market parsing/evaluation helpers from modal rendering.

### Storage and business logic are coupled to rendering

- Files: `js/core/state.js`, `js/modules/portfolio/trading.js`, `js/modules/radar/radar.js`, `js/modules/card-details/card-details.js`
- Issue: actions mutate global arrays, save localStorage, update totals, render views, and show notices in the same flows.
- Why it matters: this is working but makes ledger migration risky.
- Suggested action: write the ledger migration plan before changing behavior; introduce pure transaction helpers only when needed.

### CSS has unused or orphaned selectors

- Files: `css/layout.css`, `css/forms.css`, `css/components.css`, `css/tables.css`
- Issue: likely orphan selectors include `placeholder-view`, `add-card-panel`, `market-paste-top`, `plan-grid`, `evaluation-gaps`, `market-check-note`, `quick-plan-input`, `cash-reset-btn`, `signal-add-form`, `bulk-set-panel`, `bulk-set-results`, and `bulk-set-actions`.
- Why it matters: some belong to dormant bulk/Admin ideas, but active CSS is carrying old UI history.
- Suggested action: remove only after confirming no planned Admin/bulk workflow needs them; do this in a CSS-only cleanup pass.

### CSS uses a few one-off visual rules outside tokens

- Files: `css/layout.css`, `css/components.css`, `css/forms.css`, `css/tables.css`, `js/ui/summary.js`
- Issue: several raw rgba colors and summary P/L colors are outside design tokens; `updateTotals` writes `"green"`/`"red"` inline.
- Why it matters: small UI changes can make the dark terminal palette less consistent.
- Suggested action: add semantic CSS variables for positive/negative/warning surfaces and move inline color to classes.

### Table behavior is mostly shared, but sorting still varies

- Files: `js/ui/table.js`, `js/modules/portfolio/portfolio.js`, `js/modules/radar/radar.js`, `js/modules/transactions/transactions.js`, `js/modules/history/history.js`, `js/modules/signals/signals.js`
- Issue: Radar, Transactions, History, and Signals use shared `sortRowsByField`, while Positions keeps its own compare path.
- Why it matters: table fixes may need to be applied twice.
- Suggested action: consolidate Positions sorting only when table behavior is otherwise stable.

### Empty state and feedback copy is inconsistent

- Files: `js/modules/dashboard/dashboard.js`, `js/modules/radar/radar.js`, `js/modules/portfolio/portfolio.js`, `js/modules/signals/signals.js`, `js/modules/transactions/transactions.js`, `js/modules/history/history.js`, `js/modules/thesis/thesis.js`
- Issue: empty states alternate between task guidance, status, and scaffold wording.
- Why it matters: beta users need consistent confidence about whether something is empty, filtered out, loading, or unavailable.
- Suggested action: make a small copy pass by workflow priority: Search, Radar, Thesis, Buy, Positions, Signals, Dashboard, History.

### Error handling is present but quiet

- Files: `js/modules/portfolio/search.js`, `js/modules/portfolio/printings.js`, `js/modules/portfolio/pricing.js`, `js/modules/card-details/card-details.js`, `js/core/app.js`
- Issue: fetch failures often log to console and show generic text, but not all paths use toasts or persistent status.
- Why it matters: Scryfall/network failure is a normal condition for this app.
- Suggested action: standardize user-facing fetch failure messages and keep console detail for debugging.

### Price snapshots are only saved for owned Positions

- File: `js/modules/portfolio/snapshots.js`
- Issue: `saveDailyPriceSnapshots()` snapshots `specs` only, while Radar also refreshes prices.
- Why it matters: Radar movement and Signals may not have historical movement data unless the card is owned.
- Suggested action: decide whether Radar needs snapshots before expanding Signals; report-only for now.

### History caps events before filtering and pagination

- File: `js/modules/history/history.js`
- Issue: `buildHistoryEvents()` sorts all events and slices to 50 before filters and table page size are applied.
- Why it matters: older matching history can disappear even when filtered.
- Suggested action: filter first or raise/remove the cap once data volume requires it.
- Status: Fixed 2026-06-12 in `7154e68`, refined 2026-06-15 in `3c5403b`. History now filters/sorts before capping and reports capped/matching counts more clearly.

### Dashboard renders raw thesis text and signal fields directly

- File: `js/modules/dashboard/dashboard.js`
- Issue: Dashboard scan rows interpolate stored strings without the shared table escaping path.
- Why it matters: local user-authored thesis text can break markup if it contains HTML-like characters.
- Suggested action: escape scan row content or render with DOM nodes.
- Status: Fixed 2026-06-12 in `551600c`. Dashboard scan rows and metric labels/values now escape rendered strings.

### Card Detail and Thesis render user-authored text directly

- Files: `js/modules/card-details/card-details.js`, `js/modules/thesis/thesis.js`
- Issue: thesis notes and Oracle/detail content are interpolated into `innerHTML`.
- Why it matters: localStorage is local, but user-authored text should still not be able to damage the DOM.
- Suggested action: escape user-authored strings or use `textContent` when rendering note bodies.
- Status: Fixed 2026-06-12 in `551600c`. Card Detail and Thesis now escape note bodies, labels, links, Oracle/detail content, and related rendered values.

## Leave Alone For Now

### Do not rename `portfolio` paths yet

- Files: `js/modules/portfolio/*`, `data-view="portfolio"` references
- Reason: Positions is the product term, but path and key renames would touch many working flows during beta.
- Suggested action: defer until after ledger direction is documented.

### Do not convert the app to ES modules yet

- Files: `index.html`, `js/**/*.js`
- Reason: globals are messy but stable; a module migration would be a broad architecture change.
- Suggested action: document dependencies first.

### Do not introduce a database in this pass

- Files: storage and state modules
- Reason: localStorage is risky but currently simple; export/import should come before storage replacement.
- Suggested action: build Admin backup/export first.

### Do not restructure archives/releases during this audit

- Folders: `archive/`, `releases/`
- Reason: they are noisy in search results, but docs already say release-copy folders are legacy snapshots.
- Suggested action: remove or compress only in a deliberate history/archive cleanup.

### Do not abstract Card Detail aggressively

- File: `js/modules/card-details/card-details.js`
- Reason: the workflow is still moving; premature splitting could make beta iteration slower.
- Suggested action: extract pure helpers only when a second caller needs them.

## Health Score

- Structure: 7/10
- Maintainability: 7/10
- UI Consistency: 7/10
- Naming Consistency: 5/10
- Technical Debt: 6/10
- Beta Readiness: 8/10

Overall: stable enough for beta iteration. The main remaining risks are now data portability, global-script coupling, dormant search/import scaffolding, and Card Detail complexity.

## Top 5 Cleanup Tasks

1. Add Admin JSON export/import before deeper storage or ledger changes.
2. Remove or deliberately park unreachable bulk set lookup code and its CSS.
3. Decide whether dormant Radar search price-filter references should be restored or removed.
4. Write the ledger migration plan before changing storage/business logic behavior.
5. Tighten Card Detail as a command center before extracting helpers or expanding Signals.
