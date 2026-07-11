# ManaSpec Data Ownership And Storage Readiness Audit

Date: 2026-07-11

Mode: planning and read-only audit. No storage behavior, schema, dependency, or feature implementation was changed during the audit.

## Executive Assessment

ManaSpec is **partially ready for expansion**.

The completed MVP singles workflow is sound enough to preserve. The current foundation is not yet clear enough for owned-spec import, expanded finance metadata, or honest historical portfolio performance without increasing duplication and migration risk.

The recommended next move is a focused ownership-and-schema hardening pass while retaining localStorage. This is not a recommendation for a broad rewrite or an immediate Dexie migration.

## Primary Finding

Current ownership state is dual-written:

- `specs` is the practical source of current quantity, average cost, and ownership.
- `transactions` records BUY/SELL history and derives some review metrics, but it cannot yet reproduce all current application state reliably.
- `cash` is mutated separately from both.
- Radar and Positions duplicate printing metadata and can duplicate plan fields.
- Deleting a Position can remove current ownership without creating a transaction.
- Startup backfills create BUY records from current Positions, sometimes using fallback dates without explicitly marking them estimated.

This works for the current alpha workflow, but import and reporting would make the inconsistencies consequential.

## Current Storage And Entity Map

| Key | Current role | Loader/saver | Assessment |
| --- | --- | --- | --- |
| `specs` | Owned Positions, printing metadata, plan, quantity, average cost, current price | `loadSpecs()`, `saveState()`, plus direct writes | Transitional practical source of ownership |
| `radar` | Watched printing, plan, metadata, current price | `loadRadar()`, `saveRadarState()`, plus startup direct writes | Useful workflow concept but overlaps persistent tracked-spec identity |
| `transactions` | BUY/SELL events and generated Position backfills | `loadTransactions()`, `saveTransactionsState()`, plus startup direct writes | Early audit ledger, not authoritative |
| `cardNotes` | Timestamped printing-and-finish-keyed notes | `loadCardNotes()`, `saveCardNotesState()` | Generally sound |
| `priceSnapshots` | One daily Scryfall price per owned tracked ID when refresh runs | `loadPriceSnapshots()`, `savePriceSnapshots()` | Sound time series but potentially unbounded |
| `marketObservations` | Timestamped pasted TCGplayer evidence | `loadMarketObservations()`, `saveMarketObservations()` | Sound concept; identity fields are minimal |
| `cash` | Current balance | `loadCash()`, `saveState()`, direct writes | Insufficient for historical reporting |
| `priceRefreshStatus` | Latest refresh metadata | `loadPriceRefreshStatus()`, direct write | Cache/status only |
| `signals` | Legacy saved records | compatibility loader/saver | Preserve; do not expand |
| `thesisNotes` | Archived legacy notes | compatibility loader/saver | Preserve for compatibility |
| `manaspec_pre_import_backup` | Emergency pre-restore backup | direct read/write boundary | Useful rollback protection; not normal application state |
| table/detail preference keys | Page sizes and UI expansion state | direct UI writes | UI preferences, not user finance data |

The available backup fixture contains:

- 40 Positions.
- 16 Radar items.
- 65 Transactions.
- 8 Card Notes.
- 1,485 Price Snapshots.
- 33 Market Observations.
- Approximately 771 KB of JSON.

This indicates that localStorage capacity is not an immediate blocker, although snapshot and import growth need an explicit retention or future storage plan.

## Current Field Ownership Findings

| Field | Current owner or owners | Problem | Recommended future owner |
| --- | --- | --- | --- |
| Printing identity and metadata | Radar, Positions, Transactions, Notes, Snapshots | Repeated snapshots of partly different shapes | Printing reference attached to Tracked Spec; copied into historical records only where useful for durable display |
| Finish | Position/Radar `foil`, tracked-ID suffix, Notes `finish` | Multiple representations; currently only foil/nonfoil | Explicit `finish` plus normalized tracked-printing key |
| Quantity | `specs.qty` and net Transactions | Dual authority | Computed Position from Transactions |
| Buy price | `specs.buyPrice`, Transaction `price` | Average state and event fact coexist without a formal rule | Transaction owns event price; Position calculates average cost |
| Current price | Radar/Position `currentPrice`, Price Snapshots | Cached value and history coexist | Latest snapshot/cache, never a transaction fact |
| Buy/added date | Radar/Position and Transaction | Backfill fallbacks can look exact when they are not | Transaction date with estimated flags; Tracked Spec owns created date |
| Entry/exit/hold plan | Radar and Positions | Can diverge by source workflow | Nested Plan on one persistent Tracked Spec |
| Planned quantity | Radar and copied Position | Workflow data copied into ownership state | Plan on Tracked Spec |
| Notes | Separate Card Notes plus transaction `notes` | Scope is implicit | Notes with explicit printing/spec/transaction scope when needed |
| Market observations | Separate records keyed by current card ID | Good concept; weak long-term relationship | Market Observation linked to Tracked Spec and tracked-printing key |
| Price snapshots | Separate records keyed by current card ID | Good; no Oracle/language fields and unbounded growth | Snapshot linked to tracked-printing key |
| Cash | Scalar `cash`, Transaction `balanceAfter` where available | Cannot reconstruct deposits, corrections, withdrawals, or non-cash activity | Current balance derived from starting balance/account events and cash-affecting Transactions |
| Realized P/L | Sometimes stored on SELL, otherwise derived at render time | Not authoritative and dependent on incomplete prior history | Calculated from authoritative Transactions using approved cost-basis rules |
| Printing metadata on Transactions | Copied from Position | Useful for historical display but not consistently present | Reference snapshot, not identity authority |

## Identity Findings

### Current behavior

- Scryfall printing UUID is stored as `scryfall_id`.
- Nonfoil tracked records generally use the raw UUID as `id`.
- Foil tracked records use `scryfall-id|foil` as `id` while retaining the raw UUID in `scryfall_id`.
- `getTrackedPrintingKey()` normalizes both into `scryfall-id|foil` or `scryfall-id|nonfoil`.
- Notes use this normalized key.
- Transactions, snapshots, and observations generally use the current tracked `id`.
- `oracle_id` and `lang` are not currently stored in tracked records.

### Assessment

Scryfall UUID plus finish is adequate for the present English paper workflow. Scryfall gives each Card object its own ID and exposes `oracle_id` as the shared Oracle identity. Language is part of the Card object, so foreign-language holdings should retain the exact Scryfall object ID and store `lang` explicitly rather than relying on a hand-built set/collector identity.

Recommended rules:

- General card identity: `oracle_id`.
- Exact Scryfall object: `scryfall_id`.
- Finish-specific tracked printing: `scryfall_id|finish`.
- Tracked Spec: durable ManaSpec UUID referencing the tracked-printing key.
- Transaction, Note, Snapshot, and Market Observation: their own durable IDs plus `trackedSpecId` and/or tracked-printing key.
- Store `oracle_id`, `lang`, and `finish` explicitly even where they can be derived.

Condition is not printing identity. It belongs to an acquisition lot or Transaction. It should split valuation or displayed holdings only if a later workflow proves that necessary.

Reference: [Scryfall API types](https://github.com/scryfall/api-types).

## Recommended Target Model

Prefer the smallest model that supports real workflows.

### Tracked Spec

Purpose: persistent ManaSpec finance idea anchored to one exact printing and finish.

- Stable ID: ManaSpec UUID.
- References: `scryfall_id`, `oracle_id`, `lang`, `finish`, normalized tracked-printing key.
- Owns: tracking status, created date, strategy tags, user-authored finance metadata, and a nested Plan.
- Source of truth for user intent.
- Radar should become a status/view of Tracked Specs rather than a separate identity concept.

### Plan

Keep Plan as a named nested portion of Tracked Spec, not a separate localStorage key or table yet.

- Planned quantity.
- Entry target.
- Exit target.
- Hold duration.
- Thesis.
- Conviction.
- Catalyst.
- Review date.
- Risk/reprint concern.
- Exit criteria.

### Transaction

Purpose: authoritative quantity and value event.

- Stable ID: UUID.
- Relationship: `trackedSpecId` and tracked-printing key.
- Owns: event type, quantity, unit value, date, fees, shipping, cash effect, acquisition/sale source, condition, notes, estimated flags, and import provenance.
- Supported methods can grow beyond BUY/SELL without pretending every acquisition moved cash.

### Computed Position

Purpose: current holding view derived from Transactions.

- Not independently authored.
- Calculates quantity, average cost, invested capital, current value, realized P/L, unrealized P/L, and hold context.
- Weighted average cost is the recommended initial method because it matches current behavior and avoids premature lot-selection UI.

### Printing Reference

Purpose: stable Scryfall reference data.

- Can remain embedded/cached under localStorage for now.
- Does not require a separate persistent key before actual query or duplication pressure justifies one.
- Scryfall remains read-only external reference data.

### Note

Continue separate timestamped records. Keep current printing/spec notes. Add explicit transaction or review scopes only when those workflows exist.

### Price Snapshot And Market Observation

Continue separate timestamped records linked to normalized identity. Do not mix manual market evidence with the Scryfall snapshot series.

### Account Event

Add a lightweight account-event model before portfolio performance work:

- Starting balance.
- Deposit.
- Withdrawal.
- Correction.

BUY/SELL Transactions retain their own cash effects. OPENED, GIFT, PRIZE, and similar acquisitions can explicitly have zero cash effect. This is enough for honest bankroll history without turning ManaSpec into accounting software.

## Transaction And Position Readiness

Current Transactions can become authoritative without rewriting the entire UI, but only after a compatibility phase.

Missing or inconsistent Transaction information includes:

- Durable Tracked Spec relationship.
- Explicit acquisition method beyond BUY/SELL.
- Explicit cash effect.
- Fees, shipping, and selling costs.
- Acquisition or sale source.
- Condition and language context.
- Estimated date/price flags and confidence.
- Import provenance.
- Complete recorded balance history.
- Reliable history for deleted or pre-ledger Positions.

Recommended behavior:

- Multiple buys add quantity and cost, producing weighted average cost.
- Partial sells reduce quantity and realize P/L against current weighted average cost.
- Fees and inbound shipping increase acquisition cost basis.
- Selling fees and outbound costs reduce proceeds.
- Condition remains Transaction/lot data initially; do not automatically split the Position.
- Exact language object and finish remain identity boundaries.
- Selling all copies produces a zero-quantity computed Position but does not delete the Tracked Spec or history.
- Repurchase later reopens the computed Position while retaining the same Tracked Spec lifecycle; post-close cost basis starts from the new open quantity.

## Expanded Metadata Classification

| Field | Owner | Priority |
| --- | --- | --- |
| Language | Printing reference / tracked identity | Core before language support |
| Condition | Transaction/lot | Useful next for import |
| Acquisition method | Transaction | Core before backfill |
| Acquisition or sale source | Transaction | Useful next |
| Fees, shipping, extra costs | Transaction | Core before accurate performance |
| Storage location | Lot/holding annotation | Defer |
| Thesis | Tracked Spec Plan | Useful next |
| Conviction | Tracked Spec Plan | Defer until review workflow proves value |
| Catalyst | Tracked Spec Plan | Useful next |
| Review date | Tracked Spec Plan | Useful next |
| Risk/reprint concern | Tracked Spec Plan | Useful next |
| Strategy tags | Tracked Spec | Useful next |
| Estimated date/price | Transaction | Core before backfill |
| Import source/confidence | Transaction/import batch | Core before backfill |
| Sale venue | SELL Transaction | Useful next |
| Exit reason | SELL Transaction or review | Useful next |
| Outcome notes | Transaction or future review record | Useful next |

## Backup And Migration Findings

Backup schema v1 is a useful safety boundary but not yet a migration system.

- It exports `specs`, `radar`, `transactions`, `cardNotes`, `thesisNotes`, `signals`, `cash`, `priceSnapshots`, `priceRefreshStatus`, and `marketObservations`.
- Record-level unknown fields survive because individual records are not field-filtered.
- Unknown top-level `data` keys do not round-trip; normalization keeps only the allowlisted keys.
- Missing known array keys normalize to empty arrays during restore.
- `schemaVersion` is recorded but does not select or enforce migrations.
- Import is full replacement, not merge.
- A pre-import emergency backup is created before restore.
- Direct localStorage writers make it harder to guarantee normalization consistently.

Before entity changes:

1. Define an application data-schema version, distinct from the backup envelope version if practical.
2. Add pure normalizers and validators per entity.
3. Centralize persistent writes.
4. Create a pre-migration backup before any conversion.
5. Make migrations explicit, ordered, idempotent, and version-to-version.
6. Preserve old backup import support.
7. Test current, old, malformed, partially populated, and future-field fixtures.
8. Never silently convert uncertain historical values into confirmed values.

## localStorage Versus Dexie

### Keep the current structure unchanged

- Lowest immediate effort.
- Highest future ambiguity and feature risk.
- Not recommended for import or performance expansion.

### Normalize and centralize while retaining localStorage

- Moderate, controlled effort.
- Best migration transparency and debuggability for the next few months.
- Sufficient for current data volume and query needs.
- Preserves the existing backup and deployment model.
- Recommended now.

### Introduce Dexie/IndexedDB now

- Provides transactions, indexes, larger capacity, and better query scaling.
- Combines conceptual model migration with storage-technology migration.
- Increases rollback, backup, deployment, and debugging complexity before the target model is proven.
- Not recommended yet.

Reconsider Dexie after the normalized model is working and real snapshot, transaction, import, or query volume demonstrates the need.

## Controlled Implementation Sequence

| Stage | User-visible benefit | Risk | Scope | Independent commit? |
| --- | --- | --- | --- | --- |
| 1. Approve ownership and identity contract | Prevents future inconsistent features | Low | Small | Yes |
| 2. Document concrete stored schemas | Makes compatibility review possible | Low | Small | Yes |
| 3. Add pure normalizers, validators, and projection helpers | Detects malformed or divergent state safely | Low | Medium | Yes |
| 4. Centralize persistent writes | Makes future migrations predictable | Medium | Medium | Yes, in focused batches |
| 5. Strengthen Transaction records | Enables trustworthy import and calculations | Medium | Medium | Yes |
| 6. Add schema versioning and migration fixtures | Protects existing users | Medium | Medium | Yes |
| 7. Compare projected Positions against `specs` | Proves ledger readiness without changing UI ownership | Low | Medium | Yes |
| 8. Migrate to computed Positions | Establishes one ownership source | High | Large | Only after prior stages |
| 9. Add lightweight Account Events | Enables honest bankroll history | Medium | Medium | Yes after Transactions settle |
| 10. Add expanded metadata | Improves finance workflows | Low/medium | Incremental | Yes |
| 11. Build owned-spec backfill | Major user value | Medium/high | Large | After safety stages |
| 12. Build portfolio reporting | Honest performance visibility | Medium | Medium/large | After ledger/account history |
| 13. Reconsider Dexie | Capacity/query improvement if proven necessary | High | Large | Separate migration project |

Comparable Printings and a basic exact-printing price chart remain storage-neutral, but pausing them until the first foundation decisions are settled is reasonable and avoids divided attention.

## Smallest Safe First Implementation Step

Approve a written schema and ownership contract, then add read-only pure projection helpers that calculate Positions from existing Transactions and report discrepancies against `specs`.

Do not replace or mutate `specs` in that step. The goal is to prove whether the ledger can become authoritative against real backup fixtures before risking user data.

## Decisions Jason Must Make

Recommended defaults are included.

1. Should Radar become a status/view of one persistent Tracked Spec? **Yes.**
2. Should Plan remain nested within Tracked Spec instead of becoming a separate table? **Yes.**
3. Which cost-basis method should ManaSpec use initially? **Weighted average.**
4. Should historical imports change current cash? **No by default.**
5. Should fees and shipping affect acquisition cost and sale proceeds? **Yes.**
6. Should condition split Positions? **Not initially; preserve it per Transaction/lot.**
7. Should foreign-language cards use exact Scryfall language objects? **Yes.**
8. Should Account Events exist before performance reporting? **Yes.**
9. Should ManaSpec move to Dexie now? **No.**

## Final Recommendation

Pause data-heavy feature work long enough to complete the small foundation sequence: approve ownership, define schemas, centralize normalization, strengthen Transactions, and prove a read-only Position projection against existing data.

Preserve localStorage during this work. Once the ledger can reproduce Positions and bankroll behavior is explicit, ManaSpec will be ready to add owned-spec backfill and performance reporting without building on contradictory sources of truth.
