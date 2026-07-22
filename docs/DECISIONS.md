# ManaSpec Decisions

This is the short decision log for ManaSpec.

Add decisions here only when they affect product direction, architecture, data model, workflow, or documentation shape. Routine implementation details belong in code or the relevant section of [README](README.md).

## Product

### ManaSpec is a trading terminal

ManaSpec is focused on MTG speculation workflow, not collection management.

This keeps the app optimized for decisions, positions, targets, and outcomes instead of inventory completeness.

### User owns the notes

ManaSpec should not present trade recommendations as truth.

The system can surface prices, targets, and signals, but the user decides strategy.

### Scryfall is read-only market data

Scryfall provides card identity, printings, and pricing snapshots.

ManaSpec owns user state: watched cards, positions, future transactions, targets, notes, archived thesis data, and history.

### EDH signal starts with Scryfall rank

ManaSpec can surface Scryfall `edhrec_rank` as a compact EDH presence signal because it arrives with normal card metadata.

Raw EDHREC deck counts are deferred until the app has a reliable external-signal fetch path and a reason to store dated snapshots.

### Sealed product is deferred

Sealed product should not be forced into the single-card printing model.

When it becomes active, MTGJSON sealed product data is the likely identity source, with stored TCGplayer links and manual/paste market observations. Singles remain the current priority.

### Historical backfill is owned-spec backfill

ManaSpec may support backfilling older cards the user already owns, but the product framing is historical owned-spec backfill, not collection import.

Backfilled cards should enter through opening or historical transaction records before they appear in Positions. The workflow can accept pasted rows, cleaned GPT output, or spreadsheet-style data with fields such as card name, set, collector number, finish, quantity, date, price, acquisition method, notes, thesis, target price, and hold target.

Approximate dates and prices are allowed, but uncertainty should be explicit through fields such as `estimatedDate`, `estimatedPrice`, `confidence`, and `sourceNote`.

This feature belongs in a future Admin/Data Safety phase after export/import and transaction behavior are reliable.

### Storage upgrade follows workflow clarity

ManaSpec can explore a real database later, especially as a learning and durability project.

For now, storage work should not lead the product direction. The current priority is making Radar, Positions, Signals, Transactions, History, and Notes feel coherent enough that a future database has clear entities and workflows to support.

### JSON backup schema v1 protects local user data

Admin backup files use `manaspec-localstorage-backup` schema v1.

The v1 backup covers local user-owned ManaSpec state in `specs`, `radar`, `transactions`, `cardNotes`, archived `thesisNotes`, `signals`, `cash`, `priceSnapshots`, `priceRefreshStatus`, and `marketObservations`.

Import is replace-only with preview and explicit confirmation. It does not merge data, rename storage keys, migrate the ledger model, or introduce cloud sync.

## App Shell

### Modular shell before routing

ManaSpec should remain a modular terminal inside one static shell until the current flows are stable.

Routing can come later. The current priority is predictable behavior, clean module boundaries, and clear navigation between workflow zones.

### Summary is global

Cash, invested value, market value, total equity, and P/L belong to the app shell because they represent global state.

They should remain visible outside the portfolio workflow.

## Positions

### Radar and Positions are the active workflow

For alpha, Radar and Positions are the active singles workflow. Radar owns discovery and pre-purchase planning; Positions owns cards after money is committed.

### Positions are not the long-term source of truth

Current alpha mutates position state directly because it is simple and working.

Long term, buy and sell should create transaction events. Positions should show computed holdings.

### Radar stores watched ideas separately

Watched ideas belong in `radar`, not as zero-quantity rows in Positions. Buying from Radar can create or update an owned Position while keeping the Radar item available for continued watching or scaling.

### Printing-level identity matters

The same card can behave differently across printings, sets, foil states, and collector numbers.

Tracked entries should preserve printing identity.

### Notes are keyed by exact tracked printing

Radar and Positions currently store separate row objects. Because buying from Radar creates or updates a Position while leaving the Radar row watched, notes must not live only on either row.

Card notes are stored in shared `cardNotes` state keyed by stable exact printing identity, currently Scryfall card id plus finish. Radar, Positions, Card Detail, Signals, Transactions, and History should read/write notes through helpers that use that key.

Selling all copies should not delete notes. Re-buying the same exact printing should reconnect to prior notes.

### Thesis is retired, not deleted

Thesis is no longer an active navigation module. Existing Thesis code and `thesisNotes` data are preserved for now so the idea can be restored or migrated deliberately later.

## Search

### Split search by domain

Search should be context-specific:

- Card Search: Scryfall discovery and printing selection.
- Local Search: local Radar ideas and owned Positions only.
- Transaction Search: future ledger/history filtering.
- Global Search: future routing to the right workflow.

Card Search currently belongs inside Radar because adding a spec starts as a watched idea before purchase.

## Signals

### Signals are computed attention

Signals should be derived from current Radar, Positions, plan, price, hold, and market-check state instead of being treated as a separate planning database.

Legacy saved `signals` records may stay in localStorage backups for compatibility, but the active Signals workflow is computed, read-only attention. If manual reminders return later, they should be deliberately designed instead of silently reusing stale saved signal records.

## Transactions

### Ledger before real history

History, realized P/L, partial exits, and accurate reviews require a transaction ledger.

ManaSpec now has an early transaction ledger for BUY/SELL audit context, balances, and realized SELL P/L where possible. Until the ledger migration is complete, Positions remain directly mutated current state and Transactions are audit context, not the ownership source of truth.

### Buy/sell means event creation

Long term, buy and sell are not direct edits to portfolio rows.

They create events. Positions rows are the computed result of those events.

### Acquisition method is part of transaction history

Not every owned spec is acquired through a normal buy.

Future transaction history should be able to represent methods such as `BUY`, `OPENED`, `TRADE_IN`, `TRADE_OUT`, `PRIZE`, `PROMO`, `GIFT`, `STORE_CREDIT`, and `CORRECTION`, while still keeping Positions as a computed current-holdings view.

## React Modernization Spike

### React is the active implementation candidate, not a production cutover

ManaSpec has reconstructed the complete application shape in React on a dedicated branch and in an isolated `react-app/` workspace. The React version is now in active implementation and stabilization, and it is the likely long-term frontend if the remaining parity, compatibility, deployment, and promotion evidence is satisfactory.

The vanilla root remains functional, publicly available, and authoritative for current behavior and production/beta delivery. React implementation progress does not authorize replacing it; promotion requires a separate evidence-based decision.

### Parity comes before redesign and new features

The React version must preserve current workflows, terminology, data ownership, visual identity, dense desktop experience, and user mental models. Small alignment, consistency, focus, accessibility, and responsive corrections are allowed, but broad redesign and speculative features cannot delay parity.

### React shares ManaSpec's data compatibility contract

The spike initially reads and writes the existing localStorage keys and backup format through an explicit compatibility adapter. It does not create a silently incompatible second user-data model.

Storage keys, printing/finish identity, unknown-field preservation, schema versions, migration fixtures, and replace-only backup behavior remain contracts. React-written records must remain readable by vanilla unless a separately approved reversible migration explicitly changes that rule.

Because the vanilla root and `/ManaSpec/react-spike/` share an origin, they also share localStorage. Live spike testing therefore requires a backup and controlled cross-implementation read/write validation.

### Portable local opening is a required deliverable

The React spike must commit a prebuilt artifact with a documented `index.html` that opens without npm, terminal commands, a development server, or a runtime CDN. A normal Vite development or deployment build alone does not satisfy this requirement.

The portable output may use a separate build configuration to emit file-compatible scripts and relative assets. Browser `file://` storage limitations must be documented, and backup/export/import is the supported bridge to the Pages origin.

### React uses an isolated Pages subpath

The vanilla application remains at the existing GitHub Pages root. The React experiment is published separately under `/ManaSpec/react-spike/` using an artifact that preserves the vanilla root and adds the React build beneath `react-spike/`.

Hash-based routing is adopted because it supports the Pages subpath, refresh-safe navigation, and portable local opening without server rewrites. It has been validated in development, build, and portable output; the active GitHub Pages publishing source still requires confirmation.

### The React baseline uses local context and compatibility adapters

React 19, React DOM, Vite 8, React Router hash routing, local context/state, and an explicit persistence compatibility layer are the implemented foundation. A larger state framework is not justified while the current domain and persistence model remain understandable through this baseline.

The shared React table wrapper, native/shared dialogs, and inline SVG chart are deliberate parity-stage implementations. They establish one controllable baseline; they do not prevent focused replacement when a mature library proves a material benefit.

### Parity baseline precedes selective library adoption

The migration is intentionally staged. First, establish a recognizable end-to-end React implementation without changing several infrastructure variables at once. Second, compare the most useful candidate libraries against real ManaSpec workflows and adopt them only where they reduce custom code or improve capability without weakening the product contract.

The first focused comparison is the shared table system. Fuse.js, Chart.js, and Day.js follow when their real workflow triggers justify them. The decision order and evidence belong in [LIBRARIES](LIBRARIES.md).

### Tabulator is the shared React table engine behind a ManaSpec wrapper

ManaSpec adopts Tabulator 6.5.2 for the long-term React table foundation, beginning with Radar as the Phase 1 pilot. Product modules configure a ManaSpec-owned `TabulatorTable`; they do not instantiate Tabulator or depend on vendor components directly.

The wrapper owns imperative lifecycle cleanup, modular feature registration, cloned row data, React cell roots, sort-value adapters, edit callbacks, row/action isolation, empty states, accessibility naming, and shared responsive styling. Only the modules needed by ManaSpec are registered so unused spreadsheet, range, export, grouping, and other full-build features do not enter the bundle.

The wrapper is an adapter, not a replacement table engine. It passes only intentionally defined options so Tabulator defaults remain intact, and delegates sizing, sorting, editing, row rendering, responsive behavior, and redraw mechanics to Tabulator. ManaSpec-specific code is limited to data, column intent, formatters, indicators, actions, and minimal theming unless a documented compatibility exception is required.

Positions, Signals, Transactions, and History intentionally retain the interim native `DataTable` during Phase 1. Their later migration is configuration work through the established wrapper and must not introduce module-specific grid systems. Vanilla remains the behavior and visual oracle throughout that sequence.

### Production dependencies are bundled locally

React may use npm and normal build tooling during development, but delivered dependencies are bundled into the output. Runtime CDNs are not part of the production or portable architecture. This preserves reproducibility, offline opening, version control, and ManaSpec's user-controlled-data direction.

### Library choices require evidence

The local library collection must be inventoried before equivalent packages are downloaded. Availability does not require adoption. Each selected dependency must solve a current problem, avoid category overlap, work in normal and portable builds, and have its purpose, alternatives, current/future value, bundle cost, and maintenance cost recorded in [LIBRARIES](LIBRARIES.md).

The React foundation packages are adopted and the parity-stage UI primitives are implemented. Replacing the table, search, chart, date, dialog, form, styling, or state layers remains an evidence-based decision rather than an assumed modernization step.

### Desktop parity leads responsive work

The 1366 x 768 desktop experience is the parity baseline. Tablet and phone support must be intentional through responsive navigation, layouts, dialogs, column priorities, expandable details, and touch-friendly controls, but it cannot derail desktop parity.

## Docs

### Active docs beat dev notes

Raw notes in `dev notes/inbox/` and historical notes in `dev notes/archive/` are valuable project memory, but active docs under `docs/` define current behavior and priorities.

### Keep the docs lightweight

Use flat docs until the project is large enough to need per-module specs.

ManaSpec has earned focused ownership docs because README was carrying too much durable project truth:

- [PRODUCT_PRINCIPLES](PRODUCT_PRINCIPLES.md) owns stable product philosophy and decision mindset.
- [ARCHITECTURE](ARCHITECTURE.md) owns how the app is built.
- [DATA_MODEL](DATA_MODEL.md) owns entities and relationships.
- [STYLE_GUIDE](STYLE_GUIDE.md) owns UI language and visual conventions.
- [REACT_SPIKE_ARCHITECTURE](REACT_SPIKE_ARCHITECTURE.md) owns the implemented React architecture and remaining validation without redefining current vanilla truth.
- [LIBRARIES](LIBRARIES.md) owns dependency inventory, evaluation, and adoption records.
- [DEPLOYMENT](DEPLOYMENT.md) owns the dual vanilla/React delivery model and portable React usage.

These docs should absorb complexity from README without duplicating product behavior, roadmap priority, or decision rationale.
