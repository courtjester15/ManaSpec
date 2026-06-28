# ManaSpec Data Model

This document describes the important ManaSpec entities and how they relate.

It is a conceptual model, not a storage schema. Current localStorage keys are mentioned only where they clarify ownership or migration risk.

## Model Principles

ManaSpec tracks speculation workflow, not general collection inventory.

Data model rules:

- Printing identity matters.
- Radar and Positions are separate lifecycle states.
- Notes belong to exact tracked printings, not only to one table row.
- Scryfall is read-only card/printing/price reference data.
- User-authored plan and notes are ManaSpec-owned data.
- Transactions should become the long-term ownership source of truth.
- Current Positions are transitional until the ledger migration is complete.

## Entity Map

Current and near-future entities:

- Card
- Printing
- Radar Item
- Position
- Transaction
- Signal
- Card Note
- Snapshot
- Market Observation
- Card Detail
- Future Ledger

## Card

A Card is the general Magic card identity.

Examples:

- Card name.
- Type line.
- Oracle text.
- Color identity.
- Scryfall oracle/card identity fields.

ManaSpec uses Cards for discovery and reference, but tracking decisions usually happen at the Printing level.

Relationship:

```text
Card
-> has many
Printings
```

## Printing

A Printing is a specific version of a Card.

Important identity fields include:

- Scryfall id.
- Name.
- Set code.
- Set name.
- Collector number.
- Finish, such as nonfoil or foil.
- Rarity.
- Type line.
- Image/art/reference links.

Most ManaSpec workflow entities point to an exact Printing, because price, demand, supply, and user plan can differ across versions.

Relationship:

```text
Printing
-> can be watched as
Radar Item

Printing
-> can be owned as
Position

Printing
-> owns shared memory through
Card Notes
```

## Radar Item

A Radar Item is a watched idea before purchase, or a watched card still being monitored for possible scaling.

Current backing store: `radar`.

Radar Item owns:

- Exact printing identity.
- Added date.
- Current/reference price.
- Entry target.
- Planned quantity.
- Market observation summary fields.
- Pre-purchase planning context.

Radar Item does not own active position management after purchase.

Relationship:

```text
Radar Item
-> can become or update
Position

Radar Item
-> can create
Transaction

Radar Item
-> is reviewed by
Signals

Radar Item
-> opens
Card Detail
```

Buying from Radar currently creates or updates a Position and may log a Transaction. The Radar Item remains watched.

## Position

A Position is an owned holding after money has been committed.

Current backing store: `specs`.

Position currently owns:

- Exact printing identity.
- Quantity.
- Average entry/buy price.
- Buy date or added date.
- Current price.
- Current value.
- Profit/loss.
- Exit target.
- Hold target.
- Active management actions.

Position does not own pre-purchase discovery. That belongs to Radar.

Current relationship:

```text
Position
-> is directly updated by
Buy/Sell/Delete actions

Position
-> creates or is backfilled into
Transactions

Position
-> opens
Card Detail
```

Future relationship:

```text
Position
<- computed from ->
Transactions
```

Long term, Positions should become computed current holdings from ledger events.

## Transaction

A Transaction is an event describing something that happened to ownership or cash.

Current backing store: `transactions`.

Current transaction types include:

- `BUY`
- `SELL`
- Backfilled opening buys from existing Positions.

Future transaction/acquisition methods may include:

- `OPENED`
- `TRADE_IN`
- `TRADE_OUT`
- `PRIZE`
- `PROMO`
- `GIFT`
- `STORE_CREDIT`
- `CORRECTION`

Transaction fields may include:

- Card/printing identity.
- Type.
- Quantity.
- Price.
- Fees.
- Date.
- Notes.
- Balance after.
- Realized P/L.
- Backfill metadata.

Relationship:

```text
Transaction
-> belongs to
Printing

Transaction
-> contributes to
Future Ledger

Transaction
-> appears in
Transactions and History

Transaction
-> should eventually compute
Position
```

## Signal

A Signal is an attention item.

Current backing store: partly computed from local Radar/Position plan data and partly saved in `signals`.

Signals can represent:

- Entry target hits.
- Exit target hits.
- Approaching target states.
- Missing plans.
- Manual reminders or saved signal records.
- Market check needs.

Signal ownership rules:

- Signals are read-only attention, not source data.
- Signals deep-link back to Radar or Positions.
- Any edit shortcut must update canonical Radar or Position plan data.

Relationship:

```text
Signal
<- computed from ->
Radar Item
Position
Market Observation
Plan fields

Signal
-> opens source in
Radar, Positions, or Card Detail
```

## Card Note

A Card Note is user-authored memory for an exact tracked printing.

Current backing store: `cardNotes`.

Card Notes may include:

- Text.
- Timestamp.
- Printing key.
- Source/context.
- Conviction or review fields when available.

Notes are not owned only by Radar rows or Position rows. They must survive:

- Buying from Radar.
- Selling all owned copies.
- Re-buying the same exact printing.
- Viewing the same printing from Signals, Transactions, History, or Card Detail.

Relationship:

```text
Card Note
-> belongs to
Printing identity

Radar Item
Position
Signal
Transaction
History
Card Detail
-> read notes through
Printing identity
```

## Snapshot

A Snapshot is a dated stored price observation from app-controlled refresh behavior.

Current backing store: `priceSnapshots`.

Snapshots currently support:

- Owned Position price history.
- Current/reference price context.
- Future trend or review surfaces.

Relationship:

```text
Snapshot
-> belongs to
Printing or Position identity

Snapshot
-> informs
Signals
History
Market Evaluation
```

Snapshots are not a full pricing database. They are lightweight local history.

## Market Observation

A Market Observation is a saved user market check.

Current backing store: `marketObservations`.

Market Observations may include:

- Pasted TCGplayer Price Points text.
- Parsed supply/price fields when available.
- Saved timestamp.
- Source printing identity.
- Market check summary.

Relationship:

```text
Market Observation
-> belongs to
Printing identity

Market Observation
-> informs
Card Detail Market Evaluation
Signals
History context
```

Market Observations are local evidence, not recommendations.

## Card Detail

Card Detail is not a separate data entity. It is a workflow surface over one exact tracked printing.

Card Detail:

- Reads source Radar Item or Position.
- Edits canonical plan fields.
- Adds Card Notes.
- Saves Market Observations.
- Shows Scryfall reference data.
- Shows observable market evaluation.

Relationship:

```text
Card Detail
-> edits ->
canonical plan on Radar Item or Position

Card Detail
-> writes ->
Card Notes
Market Observations

Card Detail
-> reads ->
Printing
Snapshots
Transactions
Signals context
```

## Future Ledger

The Future Ledger is the intended durable ownership model.

It should eventually own:

- All buy/sell/acquisition/disposition events.
- Corrections.
- Fees.
- Partial exits.
- Realized P/L.
- Running cash impact.
- Historical backfill.

Relationship:

```text
Future Ledger
<- made of ->
Transactions

Positions
<- computed from ->
Future Ledger

History
<- reviewed from ->
Future Ledger
Notes
Market Observations
Snapshots
```

Ledger migration must preserve current local user data and backup/import compatibility.

## Current Lifecycle

Current primary lifecycle:

```text
Card search
-> Printing selection
-> Radar Item
-> Buy
-> Position
-> Transaction
-> History review
```

Supporting lifecycle:

```text
Radar Item or Position
-> Card Detail
-> Plan edits
-> Market Check
-> Notes
-> Signals and History context
```

Future lifecycle:

```text
Transaction events
-> Future Ledger
-> computed Positions
-> Signals, History, and review surfaces
```

## Migration Notes

Known transitional facts:

- `specs` currently stores owned Positions directly.
- `portfolio` remains in some file/function names for historical reasons.
- `transactions` exists but is not yet the full ownership source of truth.
- Startup backfill creates transaction rows from current Positions when needed.
- Notes already use a stronger exact-printing ownership model than older row-bound data.
- Backup/import must remain stable during model changes.

Do not make broad data model changes without updating this document, `ARCHITECTURE.md`, and backup/import expectations.
