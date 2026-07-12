# Backend Foundation Batch 1 Report

Date: 2026-07-11

Scope: schema/ownership contract, pure read-only normalizers, Transaction-to-Position projection, discrepancy comparison, and focused verification.

## Outcome

Batch 1 is complete. User-facing behavior and production persistence remain unchanged.

- No localStorage keys were added, renamed, migrated, or deleted.
- Normalizers and projection helpers are not loaded by `index.html` and are disconnected from application load/save paths.
- Missing language remains `null`; it is never assumed to be English.
- Compatible unknown record-level fields are preserved in normalized copies.
- Transactions remain non-authoritative.
- Current `specs` still drives the Positions UI.

## Added Foundation Helpers

`js/core/data-foundation.js` provides pure helpers for:

- Current `specs`, `radar`, and `transactions` compatibility normalization.
- Scryfall printing UUID, explicit finish, optional language, and tracked-printing-key normalization.
- Safe numeric, date, and boolean interpretation without rewriting source records.
- Transaction validation.
- Weighted-average Transaction-to-Position projection.
- Read-only comparison between projected Positions and current `specs`.

Projection behavior includes:

- Multiple buys.
- Acquisition costs in deployed basis.
- Partial and full sells.
- Selling costs deducted from proceeds.
- Closed history.
- Repurchase after closure with a fresh open basis and retained lifetime realized P/L.
- Startup backfill inclusion and identification.
- Oversell and malformed-event detection without clamping history.
- Ambiguous same-timestamp event-order reporting.
- Realized P/L calculated from event facts rather than trusted stored derived values.

## Focused Verification

The validation harness covers:

- Unknown field preservation.
- Missing language.
- Multiple buys and weighted-average cost.
- Partial sale.
- Full closure followed by repurchase.
- Oversell handling.
- Malformed quantity, price, and date values.

All focused assertions passed. Both new JavaScript files passed `node --check`.

## Real Backup Fixture Comparison

Fixture: `test-fixtures/manaspec-backup-2026-06-29-2223.json`.

| Result | Count |
| --- | ---: |
| Current Positions | 40 |
| Matched current Positions | 40 |
| Quantity/cost mismatches | 0 |
| Current Positions with no usable history | 0 |
| Invalid current identities | 0 |
| Invalid Transactions | 0 |
| Unsafe projected lifecycles | 0 |
| Closed-history-only projections | 5 |
| Open projection without current Position | 1 |
| Legacy backfills lacking explicit estimate flags | 38 |

The projector processed 65 Transactions into 46 lifecycles: 41 open and 5 closed.

All 38 startup backfill Transactions have usable dates and prices, but none explicitly records whether those historical values were estimated. They remain projectable and matched current Positions, while the comparison reports their missing provenance as informational follow-up rather than treating them as invalid.

### Unreconciled Open Projection

- Card: Simulacrum Synthesizer.
- Tracked identity: `d55b6a43-8961-4bbb-bd4a-c6c7d29f7234|nonfoil`.
- Transaction history: one BUY for quantity 1 at $29.52 on 2026-06-04.
- Projected state: open quantity 1, weighted-average cost $29.52.
- Current `specs`: no matching Position.

The source record is internally valid. The discrepancy is consistent with current behavior allowing a Position to be deleted without logging a reversing/correction Transaction. It cannot be reconciled automatically without deciding whether current Position state or historical ledger intent wins.

## Browser Verification

The local app loaded successfully at the normal development URL.

- Dashboard rendered.
- Dashboard, Radar, Positions, Signals, Transactions, History, and Admin navigation remained present.
- No browser console warnings or errors were observed.
- The Batch 1 foundation helper had no production script tag, confirming it remained isolated from runtime persistence and behavior.

Trade workflows were not mutated during browser verification because Batch 1 explicitly prohibits stored-data changes. Their calculation paths were instead exercised through focused pure fixtures.

## Remaining Direct Persistence Writers

Batch 1 intentionally did not change these boundaries. Remaining core direct writers include:

- Startup `specs`, `radar`, and `transactions` migration/enrichment writes in `js/core/state.js`.
- Position writes in `js/modules/portfolio/portfolio.js`.
- Signal target writes to `specs` in `js/modules/signals/signals.js`.
- Cash writes in `js/modules/portfolio/trading.js`.
- Price-refresh status and snapshot writes in their owning pricing modules.
- Central helpers in `js/core/storage.js` remain the normal but not exclusive persistence path.

## Batch 2 Recommendation

Do not make Transactions authoritative yet.

Before persistence rewiring, Jason must decide how explicit Position deletion should be represented in the future ledger. Recommended direction:

1. Preserve the historical BUY.
2. Replace destructive Position-only deletion with an explicit quantity correction/removal event once the new ledger model is approved.
3. Provide a one-time discrepancy-resolution policy for existing open-ledger/no-Position cases rather than silently recreating or discarding holdings.

After that decision, Batch 2 can safely focus on:

- Wiring normalizers into load boundaries first.
- Keeping save shapes compatible and reviewing any normalization-induced rewrite before enabling it.
- Centralizing `specs`, `radar`, and `transactions` persistence in focused steps.
- Adding migration/version fixtures before any stored-data conversion.

Batch 2 requires separate approval.
