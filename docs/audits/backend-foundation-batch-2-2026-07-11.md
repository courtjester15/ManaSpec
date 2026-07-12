# Backend Foundation Batch 2 Report

Date: 2026-07-11

Scope: centralized persistence boundaries, runtime read normalization, compatibility-safe serialization, and reconciliation policy. Transactions remain non-authoritative.

## Outcome

Batch 2 is complete without a stored-data migration or visible workflow redesign.

- `specs`, `radar`, and `transactions` load through pure normalizers.
- `specs`, `radar`, `transactions`, and `cash` use centralized normal save boundaries.
- Opening/loading the app does not write normalized data back to storage.
- Unchanged normalized records retain byte-equivalent stored JSON.
- Real edits preserve unknown fields and do not add missing language, tracked keys, nested Plan objects, or other future/default fields.
- Backup/export/import compatibility and the emergency pre-import backup remain intact.
- The read-only projector does not drive the UI.

## Persistence Boundaries

Central loaders:

- `loadSpecs()` -> `loadCoreRecordArray("specs", "normalizeSpec")`.
- `loadRadar()` -> `loadCoreRecordArray("radar", "normalizeRadarItem")`.
- `loadTransactions()` -> `loadCoreRecordArray("transactions", "normalizeTransaction")`.
- `loadCash()` -> scalar cash loader.

Central savers:

- `saveSpecsState()`.
- `saveRadarState()`.
- `saveTransactionsState()`.
- `saveCashState()`.
- `saveState()` composes the Position and cash savers for existing workflows.

Compatibility serialization keeps a non-enumerable raw baseline on normalized runtime records. Unchanged fields serialize from that baseline. Fields changed by a real workflow action are merged over it. New records without compatibility metadata serialize normally.

## Direct Writers

Rerouted:

- Startup zero-quantity Position migration saves for Radar and Positions.
- Startup Transaction backfill and metadata enrichment.
- Position target/hold editing.
- Signal target editing.
- Reset Cash.
- Existing Radar, buy/sell, Card Detail, and pricing flows already using shared save helpers now pass through compatibility serialization.

Intentional exceptions:

- Confirmed full backup restore writes the allowlisted backup keys directly.
- Emergency rollback writes those same keys directly if restore fails.

Remaining localStorage calls belong to out-of-scope owners: UI preferences, Card Detail expansion state, price snapshots, refresh status, Notes, legacy Signals/Thesis, and Market Observations. There are no remaining feature-module direct writers for `specs`, `radar`, `transactions`, or `cash`.

## Focused Verification

The controlled storage-boundary harness verified:

- Load-only operation performed zero writes.
- Unchanged `specs`, `radar`, and `transactions` serialized byte-for-byte equivalently.
- Missing language remained absent from stored JSON.
- Runtime-only tracked-printing and nested Plan fields remained absent unless already stored or deliberately supported later.
- Unknown Position and Transaction fields survived loading, a real edit, backup creation, parsing, and restore.
- Startup backfill identification survived normalization and serialization.
- Cash used the centralized scalar saver.
- Emergency pre-import backup creation remained active.

The Batch 1 harness still passes all focused projection cases.

## Projector Comparison

Before and after Batch 2 results are unchanged:

| Result | Before | After |
| --- | ---: | ---: |
| Current Positions | 40 | 40 |
| Matched Positions | 40 | 40 |
| Quantity/cost mismatches | 0 | 0 |
| Closed-history-only lifecycles | 5 | 5 |
| Open projection without Position | 1 | 1 |
| Invalid Transactions | 0 | 0 |
| Unsafe projected lifecycles | 0 | 0 |
| Backfills lacking explicit estimate provenance | 38 | 38 |

## Browser Verification

A disposable localhost origin and synthetic fixture were used; Jason's normal browser data was not touched.

Verified successfully:

- Existing fixture data loaded without console errors.
- A load-only session left `specs`, `radar`, `transactions`, and `cash` byte-for-byte unchanged.
- Radar add, edit, and remove.
- Radar-to-Position purchase while remaining watched.
- Additional Position purchase.
- Partial sale.
- Full sale and Position closure.
- Card Detail plan editing and persistence.
- Cash changes and Reset Cash.
- Backup shape, parse, restore, unknown-field preservation, and emergency backup through the controlled storage harness.

The Admin export action remained present. The browser harness did not expose the programmatic download event, so backup contents and restore behavior were verified directly through the same production backup helpers instead.

## Simulacrum Synthesizer Reconciliation

Evidence remains unchanged:

- One valid BUY Transaction.
- Exact tracked identity: `d55b6a43-8961-4bbb-bd4a-c6c7d29f7234|nonfoil`.
- Quantity 1 at $29.52.
- Date: 2026-06-04T02:18:38.208Z.
- No matching current Position in the audited backup.
- No SELL or correction event explains the absence.

No automatic action is safe. Jason must confirm whether the copy is still owned:

- If still owned, restore the missing Position through a future approved reconciliation action.
- If no longer owned, record the actual historical disposition/correction when that workflow exists.
- If it was test or invalid history, explicitly identify it as such rather than silently excluding it.

## Remaining Risks And Batch 3 Recommendation

- Startup backfill and enrichment still intentionally mutate storage when they discover legacy gaps; they now use centralized save boundaries but are not schema migrations.
- Compatibility serialization is shallow by design because current workflows replace scalar fields and whole metadata values; future nested editing needs focused tests.
- `specs` remains authoritative for current UI ownership while Transactions remain audit history.
- The Simulacrum discrepancy and 38 unmarked backfills remain unresolved.

Recommended Batch 3 scope is migration readiness, not migration execution:

1. Define explicit reconciliation/correction event semantics.
2. Add schema-version and migration fixture policy.
3. Add a read-only reconciliation command/report suitable for repeated use.
4. Decide how legacy startup backfills receive estimate provenance without rewriting them automatically.

Do not make Transactions authoritative or begin Batch 3 without approval.
