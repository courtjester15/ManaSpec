# Historical Owned Spec Backfill / TCG Purchase Import Backlog

## Goal

Turn pasted TCGplayer order text, cleaned GPT output, or spreadsheet-style rows into clean ManaSpec data without hand-editing localStorage.

This is owned-spec backfill, not collection import. The workflow is for cards that have speculation relevance, an exit plan, or finance tracking value.

## First useful version

- Paste raw order text and choose purchase date.
- Or paste already-clean rows from GPT/Excel with practical headers.
- Parse rows into card name, set name, condition, foil status, buy price, and quantity.
- Resolve exact printings through Scryfall using name, set, collector number when present, finish, and version text such as Extended Art.
- Preview matches before import, especially when multiple printings share the same name and set.
- Create opening/historical transactions first, then create or update Positions from those transactions.
- Keep a pre-import backup and show a rollback option.
- Let the user decide whether historical imports should reduce current cash.

## Spreadsheet/header path

Early versions can avoid a complex file importer by telling users to paste rows with recognizable headers.

Useful headers:

- Card Name
- Set Code or Set Name
- Collector Number
- Foil/Nonfoil
- Quantity
- Buy Date or Approx Buy Date
- Entry Price or Estimated Buy Price
- Acquisition Method
- Notes or Thesis
- Target Price
- Target Hold Time

Minimum useful row:

- Card name
- Set code or set name
- Collector number
- Finish
- Quantity
- Date
- Price

If the user can provide those fields, ManaSpec can usually resolve the exact Scryfall printing and create the initial ledger record.

## Estimates and confidence

Older cards may not have exact purchase data.

Preserve uncertainty instead of hiding it:

- `estimatedDate`
- `estimatedPrice`
- `confidence`: low, medium, high
- `sourceNote`, such as "User estimate", "Backfilled from old TCGplayer purchase", or "Estimated from historical market range"

## Acquisition methods

Backfill should support more than normal buys over time:

- `BUY`
- `OPENED`
- `TRADE_IN`
- `TRADE_OUT`
- `PRIZE`
- `PROMO`
- `GIFT`
- `STORE_CREDIT`
- `CORRECTION`

Early versions can keep this simple as a transaction type or acquisition-method field.

## Data rules from the manual 2025-05-19 import

- Positions are edition-specific.
- Foil positions use the app id format `scryfall_id|foil`.
- Cost basis uses the pasted per-card purchase price.
- Current price uses Scryfall `usd_foil` for foil cards and `usd` for nonfoil cards.
- Duplicate imports should merge into an existing position with weighted average buy price.
- Transactions should be deterministic enough to avoid duplicate ledger rows if the same order is imported twice.
- Backfill batches should keep source notes so future History can explain where opening quantities came from.

## Future cleanup

- Store original order source text on the transaction batch.
- Add batch ids for easier rollback and filtering.
- Support fees, tax, shipping, store credit, and partial refunds.
- Add an unresolved queue for rows that need manual print selection.
- Add CSV/XLSX parsing only after paste-based import proves useful enough to justify it.
