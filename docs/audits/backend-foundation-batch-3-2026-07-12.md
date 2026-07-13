# Backend Foundation Batch 3 Report

Date: 2026-07-12

Scope: reconciliation semantics, explicit data-schema readiness, migration-fixture policy, repeatable read-only reporting, legacy-backfill provenance, and the unsafe Position-delete path exposed by the Simulacrum Synthesizer discrepancy.

## Outcome

Batch 3 completes the approved migration-readiness foundation. It does not make Transactions authoritative, compute production Positions from Transactions, migrate localStorage, or repair user data automatically.

## Simulacrum Synthesizer Reconstruction

The audited backup contains two different nonfoil printings:

- Radar: regular `BIG` #36, Scryfall ID `28a11489-11c5-4018-aab8-c9d036638414`, added `2026-06-04T02:17:49.415Z`.
- Transaction: promo `PBIG` #6p, Scryfall ID `d55b6a43-8961-4bbb-bd4a-c6c7d29f7234`, BUY quantity 1 at $29.52 on `2026-06-04T02:18:38.208Z`.
- Price snapshot: the same PBIG promo at $27.82, saved `2026-06-04T02:18:42.852Z`.

The BUY occurred 49 seconds after the regular printing entered Radar, and the promo price snapshot followed four seconds after the BUY. No PBIG Position, SELL, or correction remains. The regular BIG Radar item remains and was later priced at $67.57.

The code audit explains the state precisely:

- Radar `Remove` deletes only the selected watched idea and explicitly does not affect Positions.
- Position `Del` removed only the `specs` row, logged no Transaction, and changed neither cash nor Radar.
- Full Sell logs a SELL, updates cash, and removes the Position only when quantity reaches zero.

The observed backup is therefore consistent with buying the PBIG promo and later using Position `Del`. The timestamps cannot prove the later click itself because deletion produced no event, but no other current module path creates this exact open-ledger/no-Position shape.

Batch 3 blocks Position deletion whenever Transactions still project an open holding. Sell remains the real-exit path; future explicit reconciliation handles corrections. The existing backup is intentionally not modified because ownership and cash intent still require a human decision.

## Reconciliation Contracts

Future append-only event semantics are defined for position quantity correction, transaction voiding, and account correction. Each requires reason, occurrence time, and provenance. Quantity corrections do not imply cash movement; account corrections do not imply ownership movement; invalid/test history is voided by reference rather than deleted.

## Schema And Migration Readiness

- Current application data schema: version 1.
- Current backup envelope schema: version 1.
- New backups declare both versions.
- Legacy unversioned backups remain accepted as version-1 data.
- Unsupported future data or envelope versions are rejected before restore.
- Synthetic tracked fixtures define legacy, current, and future-rejection cases.

## Backfill Provenance

The 38 legacy startup backfills remain byte-compatible and are not rewritten. The read-only report labels their source and treats absent estimate flags as `unknown`, rather than guessing confirmed or estimated.

## Repeatable Report

Run from the repository root:

```powershell
node tools/report-data-reconciliation.js [optional-backup.json]
```

Without an argument, the command uses the newest local JSON backup fixture. It performs no writes.
