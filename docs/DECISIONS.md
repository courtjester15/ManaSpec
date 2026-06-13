# ManaSpec Decisions

This is the short decision log for ManaSpec.

Add decisions here only when they affect product direction, architecture, data model, workflow, or documentation shape. Routine implementation details belong in code or the relevant section of [README](README.md).

## Product

### ManaSpec is a trading terminal

ManaSpec is focused on MTG speculation workflow, not collection management.

This keeps the app optimized for decisions, positions, targets, and outcomes instead of inventory completeness.

### User owns the thesis

ManaSpec should not present trade recommendations as truth.

The system can surface prices, targets, and signals, but the user decides strategy.

### Scryfall is read-only market data

Scryfall provides card identity, printings, and pricing snapshots.

ManaSpec owns user state: watched cards, positions, future transactions, targets, thesis, and history.

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

For now, storage work should not lead the product direction. The current priority is making Radar, Positions, Signals, Transactions, History, and Thesis feel coherent enough that a future database has clear entities and workflows to support.

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

## Search

### Split search by domain

Search should be context-specific:

- Card Search: Scryfall discovery and printing selection.
- Local Search: local Radar ideas and owned Positions only.
- Transaction Search: future ledger/history filtering.
- Global Search: future routing to the right workflow.

Card Search currently belongs inside Radar because adding a spec starts as a watched idea before purchase.

## Transactions

### Ledger before real history

History, realized P/L, partial exits, and accurate reviews require a transaction ledger.

Until then, current portfolio state is useful but not auditable.

### Buy/sell means event creation

Long term, buy and sell are not direct edits to portfolio rows.

They create events. Positions rows are the computed result of those events.

### Acquisition method is part of transaction history

Not every owned spec is acquired through a normal buy.

Future transaction history should be able to represent methods such as `BUY`, `OPENED`, `TRADE_IN`, `TRADE_OUT`, `PRIZE`, `PROMO`, `GIFT`, `STORE_CREDIT`, and `CORRECTION`, while still keeping Positions as a computed current-holdings view.

## Docs

### Active docs beat dev notes

Raw notes in `dev notes/inbox/` and historical notes in `dev notes/archive/` are valuable project memory, but active docs under `docs/` define current behavior and priorities.

### Keep the docs lightweight

Use flat docs until the project is large enough to need per-module specs.

Active docs should stay centered around [README](README.md), [ROADMAP](ROADMAP.md), this decision log, and the lightweight [WORKFLOW](WORKFLOW.md).
