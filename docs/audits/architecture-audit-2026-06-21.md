# ManaSpec Architecture Audit

Date: 2026-06-21

Scope: recommendation-only architecture audit of the active static ManaSpec app, with archived release snapshots treated as reference material rather than active code.

Priority lens: ManaSpec is in CLW (Core Loop Workflow) refinement. Workflow stability and usability are higher priority than architecture cleanup. Recommendations favor practical maintenance over theoretical purity.

No code changes were made as part of this audit.

## Review Goals

- Identify modules/files that are becoming too large or are handling multiple responsibilities.
- Identify duplicated logic that could be shared.
- Identify areas where separation of concerns would improve maintainability.
- Identify opportunities to improve module ownership and boundaries.
- Identify dead code, legacy code, or low-value complexity.

Focus areas:

- JS module structure
- Shared helpers/utilities
- View rendering responsibilities
- Data ownership
- State management patterns
- Repeated table/filter/search logic

## Files Reviewed

- `index.html`
- `docs/ROADMAP.md`
- `docs/WORKFLOW.md`
- `docs/DECISIONS.md`
- `docs/audits/hygiene-audit.md`
- `js/core/app.js`
- `js/core/state.js`
- `js/core/storage.js`
- `js/ui/table.js`
- `js/modules/card-details/card-details.js`
- `js/modules/portfolio/search.js`
- `js/modules/portfolio/portfolio.js`
- `js/modules/radar/radar.js`
- `js/modules/signals/signals.js`
- `js/modules/history/history.js`
- `js/modules/transactions/transactions.js`
- Active `js/**/*.js` file size/function inventory

Archived release snapshots and inactive JS folders were noted but not treated as active app code.

## Executive Summary

### High Concern Areas

#### Card Detail owns too many responsibilities

File: `js/modules/card-details/card-details.js`

`card-details.js` is the largest active JS file and the clearest architecture pressure point. It handles modal rendering, Scryfall fetch, price sync, plan editing, note entry, TCG paste parsing, market evaluation, target state, market links, formatting, and persistence triggers.

This is not random sprawl. Card Detail is becoming the command center for exact tracked printings. That role is valuable, but the module now has many reasons to change and many ways to regress Radar, Positions, Signals, Transactions, and History.

Recommendation: do not split aggressively before beta. After the full beta workflow is satisfying, extract pure helpers first:

- target and plan parsing/state helpers
- market observation parsing/evaluation helpers
- shared formatting helpers

Keep modal orchestration and rendering in `card-details.js` until the workflow settles.

#### Data ownership is still transitional

Files: `js/core/state.js`, `js/core/storage.js`, `js/modules/portfolio/trading.js`, `js/modules/radar/radar.js`, `js/modules/card-details/card-details.js`

Current state is split across `specs`, `radar`, `transactions`, `cardNotes`, `thesisNotes`, `signals`, price snapshots, market observations, and cash. This is workable for CLW, but the ownership model is still transitional.

The app already documents the future direction: Transactions become source of truth, Positions become computed holdings, Radar remains watched ideas, and notes remain keyed by exact printing identity. Until that migration is planned, avoid structural changes that make the current direct-mutation model more elaborate.

Recommendation: write the ledger migration plan before changing storage behavior or introducing a heavier state layer.

#### Global script loading hides dependency boundaries

File: `index.html`

ManaSpec currently uses ordered global scripts rather than ES modules. This keeps beta work simple and stable, but it means dependencies are implicit. Module ownership is enforced by convention, not tooling.

Recommendation: keep global scripts through beta. Before any ES module migration, create a lightweight dependency map or module ownership note so the migration follows the app's actual workflow boundaries.

### Medium Concern Areas

#### Search combines several domains

File: `js/modules/portfolio/search.js`

Search currently handles Scryfall autocomplete, partial/fuzzy name search, exact set-number lookup, result rendering, card art preview, dormant bulk set lookup helpers, and add-to-Radar flow coordination.

This file is productive but busy. Some behavior belongs to active Radar discovery; some looks like future Admin/backfill support; some is generic Scryfall/card preview behavior.

Recommendation: after beta, split only along proven workflow lines:

- Radar discovery search
- Scryfall/card lookup helpers
- card art preview helper
- Admin/backfill bulk lookup, if it remains useful

#### Table workflows share renderer but repeat local loops

Files: `js/ui/table.js`, `js/modules/portfolio/portfolio.js`, `js/modules/radar/radar.js`, `js/modules/transactions/transactions.js`, `js/modules/history/history.js`, `js/modules/signals/signals.js`

`table.js` is a useful shared renderer. The repeated parts are now around each module's local loop: filter state, count text, sort state, pagination, row actions, and empty-state copy.

Recommendation: avoid introducing a data-grid library before beta. Later, consolidate small table workflow helpers where the repetition is mechanical and stable, especially count text, sort defaults, and shared row-opening helpers.

#### Formatting, parsing, and escaping helpers are scattered

Files: `js/core/app.js`, `js/ui/table.js`, `js/modules/portfolio/portfolio.js`, `js/modules/portfolio/search.js`, `js/modules/radar/radar.js`, `js/modules/card-details/card-details.js`, `js/modules/transactions/transactions.js`, `js/modules/dashboard/dashboard.js`

Money, signed money, percent, compact date, HTML escape, attribute escape, target parsing, and hold-time parsing appear in several local forms.

Recommendation: after beta workflow stabilizes, create a small shared utility file for the obvious pure helpers. Keep it boring and narrow. Do not turn it into a broad framework layer.

### Low Concern Areas

#### Vanilla global architecture is still acceptable for CLW

The architecture has visible seams, but it is still small enough to reason about. The most important current work is workflow reliability, not architectural purity.

Recommendation: continue with narrow, behavior-first work through beta.

#### File size growth mostly reflects real workflow depth

The largest files are large because the product has grown real responsibilities: Card Detail, Radar, Search, Signals, Positions, History, and Transactions. That is expected.

Recommendation: watch large files, but do not split by line count alone.

## Files Worth Watching

### `js/modules/card-details/card-details.js`

808 lines at audit time.

Watch because it is the command center and currently owns:

- live Scryfall fetch
- tracked-card lookup
- price sync
- card detail modal rendering
- plan editing
- notes entry
- market links
- TCGplayer paste parsing
- market observation persistence
- market evaluation
- target state logic
- hold-time parsing
- formatting helpers

Recommended future direction: extract pure plan/market/format helpers after beta workflow stabilizes.

### `js/modules/portfolio/search.js`

630 lines at audit time.

Watch because it mixes active Radar search, Scryfall query strategies, exact set-number lookup, dormant bulk lookup helpers, result rendering, card art preview, and add-to-Radar coordination.

Recommended future direction: separate active Radar discovery from generic Scryfall lookup and future Admin/backfill helpers.

### `js/modules/signals/signals.js`

399 lines at audit time.

Signals is healthy as a read-only attention layer, but it depends on target state and market observation helpers owned elsewhere.

Recommended future direction: keep Signals read-only. If target/market helpers are extracted from Card Detail, let Signals consume those shared pure helpers.

### `js/modules/radar/radar.js`

378 lines at audit time.

Radar owns rendering, sorting, filtering integration, inline entry target editing, planned quantity editing, buy promotion, market summary display, note controls, and persistence calls.

Recommended future direction: keep Radar as the owner of watched ideas. Avoid moving buy promotion logic until the ledger migration plan is written.

### `js/modules/portfolio/portfolio.js`

323 lines at audit time.

Positions owns owned-holdings rendering, local sorting, inline exit/hold editing, row actions, and position-specific formatting.

Recommended future direction: leave `portfolio` naming alone until after beta and ledger direction are stable.

### `js/core/storage.js`

236 lines at audit time.

Storage now includes safe localStorage loading plus backup/export/import behavior. It is reasonable today, but it will become a major boundary during ledger or persistence upgrades.

Recommended future direction: keep backup/import stable. Do not mix ledger migration into backup mechanics without a plan.

### `js/core/state.js`

131 lines at audit time.

State initialization also performs migration/backfill/enrichment work for Radar and Transactions.

Recommended future direction: keep current behavior stable. Later, move one-time migration/enrichment helpers out of boot state only if they grow.

## Recommended Future Refactors

### 1. Extract Card Detail pure helpers

Best timing: after full beta workflow is satisfying.

Candidate helpers:

- `parseWholeDollarInput`
- `parseHoldMonthsInput`
- `formatHoldTime`
- `getHoldMonths`
- `getPlanStartDate`
- `getTargetState`
- `parseTcgPricePoints`
- `getLatestMarketObservation`
- `buildMarketEvaluation`

Reason: these helpers are useful to Signals, Radar, Positions, and future ledger/backfill behavior, and they can be tested mentally or mechanically without DOM coupling.

Avoid: splitting the modal renderer before the Card Detail UX is stable.

### 2. Add a small shared formatting utility

Best timing: after beta copy/layout stabilizes.

Candidate helpers:

- money
- table money
- signed money
- percent
- compact date
- set/collector identity
- HTML escape
- attribute escape

Reason: small formatting drift already exists across modules.

Avoid: building a broad utility kitchen sink.

### 3. Normalize table workflow helpers

Best timing: after Signals deep-linking and Card Detail command-center pass.

Candidate helpers:

- count text builder
- default sort direction helper
- exact row focus/open helper
- shared empty/filter state messages

Reason: `table.js` owns rendering, but view modules still repeat the surrounding loop.

Avoid: replacing the shared native table with a data-grid library before beta proves it is needed.

### 4. Write the ledger migration plan before changing data flow

Best timing: before any transaction-as-source-of-truth implementation.

Plan should define:

- how current `specs` become computed Positions
- how existing `transactions` backfills are treated
- how Radar remains separate from ownership
- how card notes stay attached to exact printings
- how backup/import protects current localStorage data

Reason: data safety matters more than a cleaner abstraction.

### 5. Decide the fate of dormant bulk lookup/search scaffolding

Best timing: after beta, or during an Admin/backfill planning pass.

Options:

- move to Admin/backfill
- document as dormant future owned-spec backfill support
- remove/archive if it no longer matches the product direction

Reason: unreachable active code makes Search harder to reason about.

## Refactors That Should Wait Until After Beta

- ES module migration.
- Renaming `portfolio` paths/functions/storage-facing terms to `positions`.
- Replacing localStorage with IndexedDB, Dexie, SQLite, or a backend.
- Introducing a data-grid library.
- Full ledger-source-of-truth migration.
- Splitting every module into service/controller/view folders.
- Creating a formal router.
- Creating a formal global store/event bus.
- Large CSS/JS archive cleanup.
- Broad app-wide naming cleanup.

These are plausible later, but they touch too much workflow surface during CLW refinement.

## Refactors That Should Not Be Done Now

### Do not do a broad clean-architecture rewrite

ManaSpec is still finding the exact beta workflow shape. Over-structuring now would slow useful iteration.

### Do not abstract every table into a generic app framework

The shared table renderer is enough for now. Extract repeated table helpers only where repetition is stable and annoying.

### Do not create a formal event bus yet

Current direct calls are imperfect but understandable. A bus would hide flow at the exact moment data ownership needs to become clearer.

### Do not build a full Scryfall API client layer yet

A tiny lookup helper may become useful. A full client layer is probably ceremony until the app has more API surfaces or caching needs.

### Do not rename storage keys for aesthetics

Data safety and import/export compatibility matter more than naming purity.

### Do not split files by line count alone

Split only when responsibility boundaries are stable enough that the split improves day-to-day maintenance.

## Comparison Plan For Later Beta Audit

Run a similar architecture audit after the full beta workflow feels satisfying.

Compare against this baseline:

- Did Card Detail become more stable or more overloaded?
- Did Signals deep-linking add coupling or clarify ownership?
- Did repeated table/filter/count logic become more painful?
- Did Search stay Radar-owned, or did Admin/backfill needs emerge?
- Did the ledger migration plan clarify data ownership?
- Did any helper duplication produce real bugs or friction?
- Did workflow changes make ES modules or a shared utility layer worth the cost?

Recommended next audit output:

1. What changed since this audit.
2. Which concerns got better or worse.
3. Which refactors are now ready to execute.
4. Which refactors still wait.
5. A prioritized execution sequence for post-beta cleanup.

## Bottom Line

ManaSpec is architecture-stable enough for beta workflow refinement.

The app's main debt is not that it lacks architecture; it is that several valuable workflow modules have become dense because the product is becoming real. The highest-value future cleanup is surgical:

1. Extract pure helpers from Card Detail.
2. Add small shared formatting/parsing utilities.
3. Normalize repeated table workflow glue.
4. Write the ledger migration plan before changing data ownership.
5. Keep global-script and localStorage simplicity until beta workflow stability justifies a broader move.
