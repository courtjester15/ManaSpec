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

Radar Item does not own active position management after purchase. For plan ownership, Radar only needs Entry Target for Missing Plan/No Plan checks; Exit Target and Hold belong to owned Positions.

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

Position does not own pre-purchase discovery or Radar entry intent. That belongs to Radar. For plan ownership, Positions need Exit Target and Hold for Missing Plan/No Plan checks.

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

Current backing store: active Signals are computed from local Radar, Position, plan, price, hold-timing, and market-check state. Legacy saved `signals` records may remain in storage and backups for compatibility, but they are not the normal active Signals workflow.

Signals can represent:

- Entry target hits.
- Exit target hits.
- Approaching target states.
- Missing plans.
- Closest target-watch rows outside the near-target threshold when preview tiles need useful fallback rows.
- Market check needs.

Signal ownership rules:

- Signals are read-only attention, not source data.
- Signals filter or deep-link back to Radar or Positions.
- Radar No Plan ownership means missing Entry Target.
- Position No Plan ownership means missing Exit Target, missing Hold, or both.
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

Signal
-> can filter inspection table by
bucket or exact tracked printing
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

### Backend Foundation Contract (Batch 1)

This contract defines target ownership without changing current persistence. Batch 1 helpers are read-only adapters: they are not connected to application load/save paths, do not write normalized values to localStorage, and do not make Transactions authoritative.

Data categories:

- Persisted user-authored data: Tracked Spec status, nested Plan fields, Notes, and future user-authored metadata.
- Historical event facts: Transactions, including quantity, price/value, date, costs, source, method, and uncertainty/provenance flags.
- Cached external reference data: Scryfall printing metadata and current-price cache.
- Calculated fields: Position quantity, weighted-average cost, deployed basis, realized/unrealized P/L, and open/closed state.
- Compatibility fields: current `specs`, `radar`, legacy `signals`, archived `thesisNotes`, duplicated metadata, and transitional stored calculations.

Target ownership shapes do not imply new localStorage keys:

- Tracked Spec: ManaSpec UUID, normalized tracked-printing key, Scryfall/Oracle identity, explicit finish, explicit language or null, lifecycle status, created date, nested Plan, and optional strategy tags. Radar will eventually become a status/view of this entity.
- Nested Plan: planned quantity, entry/exit targets, hold time, thesis, conviction, catalyst, review date, risk note, and exit criteria.
- Transaction: UUID, future Tracked Spec relationship, tracked-printing key, event type, quantity, unit value, date, fees/shipping/costs, cash effect, condition, source, notes, uncertainty flags, and import provenance. Transactions own event facts; stored derived P/L or balance values are compatibility context only.
- Computed Position: identity relationship, quantity, weighted-average cost, deployed basis, realized/unrealized P/L, open/closed state, projection safety, and issues. It is calculated, not authored.
- Note: UUID, explicit scope and scoped entity, text, and timestamps. Current exact-printing Notes remain valid.
- Price Snapshot: normalized identity, observed date/time, price, source, and saved time. It is external reference history, not an acquisition fact.
- Market Observation: normalized identity, source, checked time, raw evidence, parsed values, and URL. It remains distinct from Scryfall snapshots.
- Future Account Event: starting balance, deposit, withdrawal, or correction with amount, date, notes, and provenance. Account Events are required before historical performance reporting but are not added in Batch 1.

Batch 1 rules:

- Use weighted-average cost.
- Acquisition costs increase deployed basis; selling costs reduce proceeds.
- Include startup backfill Transactions as opening acquisitions and identify them separately.
- Missing language normalizes to null/unknown, never assumed English.
- Invalid identity, quantity, price, or date makes a Transaction unsafe for projection.
- Report oversells and ambiguous ordering; do not clamp values and continue as if history were valid.
- Calculate realized P/L from event facts rather than trusting stored derived values.
- Treat zero-quantity projections as closed history, not automatic mismatches with current `specs`.
- Preserve compatible unknown record-level fields through normalization.
- Keep every Batch 1 normalizer and projector disconnected from production persistence.

### Backend Foundation Contract (Batch 2)

Runtime loading now uses the Batch 1 normalizers as compatibility adapters for `specs`, `radar`, and `transactions`. This does not make Transactions authoritative or migrate stored records.

- Normal loading never writes to localStorage.
- Runtime-only derived fields and missing future defaults are not serialized automatically.
- Each normalized record retains a non-serialized raw compatibility baseline.
- An unchanged record serializes to its prior compatible shape.
- A real workflow edit is merged over the raw record, preserving unknown fields and avoiding unrelated field additions.
- Startup backfills remain identifiable through `backfilledFromPositionId`.
- Normal core persistence for `specs`, `radar`, `transactions`, and `cash` is centralized in `js/core/storage.js`.
- Full confirmed backup restore and emergency rollback remain intentional direct-write exceptions.
- The projector remains a read-only proof and reconciliation tool; current `specs` still drives Positions.

Reconciliation policy:

- An open holding projected from Transactions but absent from `specs` is a warning, not an automatic repair.
- ManaSpec must not silently recreate the Position, remove the Transaction, fabricate a SELL, or alter cash.
- Valid future resolutions are restoring a still-owned Position, recording an approved historical disposition/correction, or explicitly identifying invalid/test history.
- Closed projected lifecycles remain valid historical results when no current Position exists.

Known transitional facts:

- `specs` currently stores owned Positions directly.
- `portfolio` remains in some file/function names for historical reasons.
- `transactions` exists but is not yet the full ownership source of truth.
- Startup backfill creates transaction rows from current Positions when needed.
- Notes already use a stronger exact-printing ownership model than older row-bound data.
- Backup/import must remain stable during model changes.

Do not make broad data model changes without updating this document, `ARCHITECTURE.md`, and backup/import expectations.

### Backend Foundation Contract (Batch 3)

Batch 3 completes migration readiness without making Transactions authoritative or rewriting existing stored records.

- Application data schema version `1` is distinct from backup-envelope schema version `1`.
- New backups declare `dataSchemaVersion: 1`; legacy unversioned backups are treated as version-1 inputs, while unsupported future versions are rejected before restore.
- Normalizers remain compatibility adapters, not migrations.
- The repeatable `tools/report-data-reconciliation.js` command reads a backup and reports discrepancies without writing the fixture or browser storage.
- Legacy startup backfills receive runtime-only provenance: source `legacy_startup_backfill`, source Position ID, and explicit `unknown`, `estimated`, or `confirmed` status for date and price. Existing records are not rewritten merely to add those labels.

Future reconciliation events use explicit, append-only semantics:

- `POSITION_QUANTITY_CORRECTION`: changes owned quantity without pretending a market sale occurred and never changes cash implicitly.
- `TRANSACTION_VOID`: excludes an identified invalid/test event without deleting it; any related cash correction must be explicit.
- `ACCOUNT_CORRECTION`: changes cash without changing card ownership.

Every reconciliation event requires a reason, occurrence time, and provenance. Corrections are reversed by another event, never by deleting history. These event types are contracts only in Batch 3; the current BUY/SELL projector does not execute them yet.

Current Position deletion is blocked when Transactions still project an open holding. A real exit must use Sell. A future approved reconciliation workflow will handle inventory corrections. Radar Remove remains independent because Radar is watched state, not ownership.
