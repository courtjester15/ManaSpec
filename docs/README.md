# ManaSpec Docs

This folder is the active source of truth for ManaSpec.

The `dev notes/` folder contains raw daily notes and historical planning memory. Use `dev notes/inbox/` for current brainstorming and beta observations, and `dev notes/archive/` for older reference notes. Do not treat dev notes as active instructions.

## Start Here

- [README](README.md): product shape, current implementation rules, module lineup, and data model.
- [Roadmap](ROADMAP.md): current phase, next work, and future phases.
- [Workflow](WORKFLOW.md): lightweight rules for working on the app.
- [Decisions](DECISIONS.md): short log of durable product, architecture, and data choices.

Most day-to-day work should only need this file and [ROADMAP.md](ROADMAP.md).

## Product Shape

ManaSpec is an MTG speculation tracking and decision-support terminal.

It replaces scattered spreadsheets with a structured workflow for:

- Finding speculative card opportunities.
- Watching ideas before purchase.
- Recording buys and sells.
- Tracking printing-level positions.
- Monitoring price movement and target states.
- Reviewing outcomes against the user's saved notes and plan.

ManaSpec does not make trading decisions. It provides visibility, structure, and discipline around user-driven speculation.

ManaSpec is not a collection tracker, inventory nostalgia tool, prediction engine, automated trading advisor, or multi-user finance platform.

## Current Stack

- Vanilla HTML/CSS/JavaScript.
- ManaSpec-native table rendering through `js/ui/table.js`.
- Scryfall API for card identity, printings, and pricing snapshots.
- localStorage for persistence.
- No backend.

ManaSpec is local-first for user state, but it is not offline-only. Scryfall-backed search, printing data, and price refresh require network access.

## CSS Structure

Active app styling is layered through `css/style.css`.

Current files:

- `base.css`: design tokens, colors, typography defaults, and app-wide primitives.
- `layout.css`: app shell, header, workbar, summary, and view headings.
- `forms.css`: inputs, selects, buttons, checkboxes, filters, and shared form controls.
- `components.css`: panels, rows, lists, metrics, notices, modals, and reusable UI pieces.
- `tables.css`: native table, row, pagination, and picker styling.

Rules:

- Prefer shared tokens from `base.css` over new raw colors.
- Put reusable styling in `forms.css`, `components.css`, or `tables.css` before adding module-specific overrides.
- Positions and Radar should share the same dark terminal visual language.
- Dense scan surfaces should preserve single-line rhythm. Table cells, search results, prices, set codes, collector numbers, dates, action buttons, numeric values, and compact indicators should not wrap unless a specific workflow needs it.
- In dense surfaces, solve overflow in this order: widen the container, reallocate columns, shorten headers, reduce padding, slightly reduce font size, then use ellipsis only for long recoverable text fields such as card name, set name, or note preview.
- Ellipsis is not appropriate for prices, dates, set codes, collector numbers, finish labels, actions, numeric values, or headers unless explicitly approved.
- Reading and detail surfaces, such as help text, notes, modal body copy, Oracle text, and market explanations, may wrap normally.

## App Shape

ManaSpec is a modular trading terminal running inside one static app shell. It has workflow zones exposed through module navigation, but it is not currently a routed SPA.

Terminology:

- Use cards or printings for MTG objects.
- Use tiles for Dashboard, metric, info, and module context UI summary blocks.

Primary zones:

- Dashboard: awareness and what matters now.
- Positions: owned holdings only. Radar handles card discovery and watch ideas before purchase.
- Radar: ideas without ownership, exact printing discovery, entry planning, and planned buy quantity.
- Signals: targets, price movement, and action triggers.
- Notes: user-authored card memory attached to exact tracked printings.
- Transactions: buy/sell ledger events and audit data.
- History: buys, sells, outcomes, and learning.

Current workflow direction:

- Radar is for discovery, watched ideas, entry planning, and planned quantity before money is committed.
- Positions is for owned holdings, exit planning, and active position management.
- Signals is a read-only attention layer for alerts, reminders, and deep-links back to Radar or Positions.
- Card Detail is the unified editor for a specific printing and edits canonical plan data.
- Transactions and History are for what happened and what can be audited later.
- Notes are for why the user cared and what changed over time.
- Admin includes Data Safety controls for JSON backup export/import of local user data.
- Radar, Positions, Signals, Transactions, and History use a shared module context band above filters and tables so workflow tables keep a consistent visual rhythm. Dashboard remains the broader overview surface.

Near-term product focus:

- First, polish the current workflow by testing it end to end.
- Then, clean up card detail as the working command center for a tracked printing.
- Then, draft the transaction migration path before changing storage.
- Database or storage upgrades can become a learning project later, after the workflow shape is clearer.

## Current Module Lineup

### App Shell

Purpose: provide the stable frame for ManaSpec.

Current implementation:

- `index.html` is a static shell.
- `js/core/app.js` bootstraps modules and switches workflow zones.
- `#summaryBar` is a compact global account widget in the app header.
- `#viewContainer` receives the active workflow view.
- `js/ui/help.js` provides a contextual help drawer.
- Dashboard, Radar, Positions, Signals, Transactions, History, and Admin have active navigation entries.
- Radar and Positions are the primary singles workflows.

Rules:

- Keep `index.html` mostly static.
- Do not put feature logic in `index.html`.
- Keep `app.js` focused on bootstrapping, navigation, and glue.
- Summary is global app UI, not Positions-specific UI.
- Global card search sits in the main workbar beside module navigation.
- Views are workflow zones, not full routed pages yet.

DOM conventions:

- Summary IDs: `cash`, `invested`, `value`, `totalEquity`, `totalPL`.
- Active view mount: `viewContainer`.
- Positions table mount: `portfolioTable`.
- Radar table/list mount: `radarList`.
- Radar card search: `searchBox`, `searchResults`, `printingsView`.
- Help drawer: `helpDrawer`.

### Current Script Order

ManaSpec currently uses ordered global scripts from `index.html`. Do not convert to ES modules until module dependencies are documented well enough to migrate safely.

Current order:

1. `js/core/storage.js`: localStorage load/save helpers.
2. `js/core/state.js`: global arrays, cash state, and startup migrations/backfills.
3. Metadata, Notes, filters, table, and Dashboard helpers.
4. Positions/Radar modules: trading, table rendering, printing search, Radar, Transactions, Signals, archived Thesis code, History, Admin, and Card Detail.
5. Global UI/status helpers: summary and help.
6. Price snapshots and pricing refresh.
7. `js/core/app.js`: navigation, universal search, boot, and initial render.

Dependency rules:

- `storage.js` must load before `state.js`.
- `state.js` must load before modules that read `specs`, `radar`, `signals`, `cardNotes`, `thesisNotes`, `transactions`, or `cash`.
- `js/ui/table.js` must load before modules that call shared table render, sort, or pagination helpers.
- Card Detail depends on tracked card state, shared notes helpers, market observation storage, target helpers, and price snapshots when available.
- `app.js` stays last because it calls `initApp()` immediately.

### Help

ManaSpec uses contextual help instead of a single large manual.

Current behavior:

- The app shell has a Help button that opens a right-side drawer.
- Help defaults to the currently active workflow.
- Users can switch between help topics inside the drawer.
- Current topics cover Dashboard, Radar, Positions, Signals, TCG Price Points, Transactions, History, and Admin.

Rules:

- Help should be updated in the same pass as workflow changes.
- Keep help task-based and concise.
- Screenshots or GIFs should wait until UI surfaces stabilize.
- Help should reveal confusing workflows, not excuse them.

### Admin

Admin owns local maintenance and data-safety tools.

Current behavior:

- Data Safety can export a timestamped JSON backup from browser localStorage.
- Reset Cash requires confirmation, previews current and reset cash, and changes only available cash.
- Backup schema is `manaspec-localstorage-backup` v1.
- Exports include `specs`, `radar`, `transactions`, `cardNotes`, archived `thesisNotes`, `signals`, `cash`, `priceSnapshots`, `priceRefreshStatus`, and `marketObservations`.
- Import uses a JSON file picker, validates the backup shape, and shows a preview before restore.
- Selecting a file does not change data.
- Restore requires explicit confirmation and replaces current local ManaSpec data in this browser.
- Before restore, ManaSpec stores an emergency pre-import backup under `manaspec_pre_import_backup`.

Rules:

- Do not rename storage keys during backup/import work.
- Reset Cash must not change Positions, Radar, notes, transactions, market checks, price history, or storage schema.
- Do not add cloud sync, accounts, merge logic, or database migration to this workflow.
- Unknown fields in backup files should not break import.
- Invalid backups should fail with a friendly message and no claimed success.

### Card Detail

Card detail is the command center for a tracked printing.

Ownership model:

- Card Detail is the unified editor for one specific printing.
- Card Detail may edit canonical plan data for that printing.
- Card Detail does not own separate planning state.
- When opened from Radar, plan edits apply to the watched idea.
- When opened from Positions, plan edits apply to the owned position.
- Card Detail should preserve context instead of forcing the user to re-find the card after an edit.

Current behavior:

- Card detail opens from Radar, Positions, and Signals.
- Positions card names and Radar rows open card detail.
- The panel is organized into Overview, Plan, Notes, Market Evaluation, Market Check, Oracle, and Card Data.
- Overview shows current price, movement, ownership state, buy price, value, and P/L.
- Plan edits entry target, exit target, and hold time.
- Plan fields save on Enter or click-away and update the visible plan status without requiring the user to close and reopen Card Detail.
- Hold time accepts simple month values and ranges such as `3`, `6-12`, and `12-18`.
- Notes adds and reviews append-first notes linked to the current exact printing key.
- Actions opens exact market/reference pages.
- Market Evaluation summarizes observable market mechanics from saved/local data: supply, velocity, price confidence, Scryfall EDH rank, target math, freshness, and data gaps.
- Market Check saves pasted TCGplayer Price Points text as a local observation and includes a compact explanation of what to copy.
- Card Data keeps printing metadata and Oracle text visible without crowding Positions.

Market evaluation rules:

- Use only observable market data, Scryfall metadata, local targets, local notes presence, and saved timestamps.
- Scryfall `edhrec_rank` can be shown as an EDH presence signal. It is a rank, not a raw EDHREC deck count.
- Do not evaluate format demand, reprint risk, hype, or speculative catalysts.
- Do not produce buy/sell recommendations.
- Strategy and notes stay user-authored.

### Positions

Purpose: show owned positions and support active holding management.

Ownership model:

- Positions owns cards after money is committed.
- Positions owns quantity, average entry, current value, P/L, exit planning, hold tracking, buy-more, sell, close, and correction/delete workflows.
- Positions does not own card discovery or pre-entry Radar planning.
- Entry planning may be visible for context, but pre-purchase entry intent belongs to Radar until a position exists.

The positions workflow supports:

- Buying and selling from the holdings table.
- Selling one, a chosen quantity, or all copies from an owned position.
- Viewing position value and P/L.
- Filtering owned positions by card metadata and price bands.
- Setting optional exit target and estimated hold time from card detail.
- Scanning optional exit target and estimated hold time directly in the Positions table.
- Editing optional exit target and hold time inline from the Positions table.
- Setting a planned buy quantity on Radar ideas before buying.

Radar owns card discovery, printing selection, watch ideas, entry planning, and planned quantity before ownership.

Current implementation files:

- `js/modules/portfolio/portfolio.js`
- `js/modules/portfolio/search.js`
- `js/modules/portfolio/printings.js`
- `js/modules/portfolio/trading.js`
- `js/modules/portfolio/pricing.js`
- `js/modules/portfolio/snapshots.js`

Current behavior:

- Current state is stored in `specs`.
- Buying increments quantity and updates average buy price.
- Buying gives immediate feedback after cash, quantity, and transaction state update.
- Selling decrements quantity and adds cash.
- Selling asks for confirmation before logging a `SELL` transaction and reducing quantity.
- If selling reduces quantity to zero, the spec is removed.
- Deleting removes the spec directly.
- Deleting asks for confirmation and warns that no transaction will be logged.
- Table pagination defaults to 15 rows to fit laptop-height scan workflows.
- The main Positions table shows compact trading fields plus optional target and hold-time columns; lower-priority identity fields such as set name and type line stay available through card detail or hover context instead of occupying primary table columns.
- Positions shows a compact target delta column beside exit target and uses display-first click-to-edit controls for target and hold fields.
- Positions table action buttons are reserved for state-changing actions such as buy, sell, and delete.
- Local Radar and Positions filters include reset actions and plan-state filters.
- Local Radar and Positions filters use visible labels so filter meaning is clear while scanning.
- Radar filter heading shows the current idea count and filtered count.
- Buying from Radar buys the planned quantity, defaults to 1, creates or updates the card in Positions, and keeps the Radar item watched.
- Radar entry target is editable directly from the Radar table.
- Existing owned positions are backfilled into opening `BUY` transactions when no ledger quantity already covers them.

Current limitations:

- Positions are directly mutated.
- There is no transaction ledger yet.
- Delete is destructive and not auditable.
- Fees are not modeled.
- Partial sale history is not preserved.

Near-term requirements:

- Keep Radar ideas visually and behaviorally distinct from owned Positions.
- Add local position filtering separate from Scryfall card search.
- Avoid changing the data model until a ledger migration plan exists.

Long-term rule: Positions should become a computed view from transaction events.

### Radar

Radar is the pre-purchase workspace.

Ownership model:

- Radar owns card discovery.
- Radar owns exact printing selection before purchase.
- Radar owns watched ideas before purchase.
- Radar owns entry planning before money is committed.
- Radar owns planned quantity before purchase.
- Radar does not own active position management after a purchase.
- Radar should support specs that are being watched, staged, or scaled into rather than only immediate buys.

Current behavior:

- Search finds card identities and exact printings through Scryfall.
- The search/add-candidate controls sit in Radar's module context band so discovery belongs to the workflow context instead of pushing the table layout down.
- Search and printing results collapse when focus moves outside the Radar search area, and opening Card Detail from Radar dismisses active search UI.
- Printing rows can add exact paper or foil versions to Radar.
- Radar items are stored separately from owned Positions.
- Radar rows show current price, added date, planned quantity, market observation summary fields, and actions.
- Radar rows show entry target, a compact target delta column, and display-first click-to-edit entry target controls as part of pre-purchase planning.
- Duplicate exact printings are blocked within Radar.
- Buying from Radar uses the planned quantity, defaults to 1, creates or updates an owned Position, logs a transaction when available, and keeps the Radar item watched.
- Removing from Radar only removes the watched idea and does not affect owned Positions.

Workflow rule:

- A Radar item can become a Position, but the app must make the Radar lifecycle clear.
- The intended long-term workflow should let the user understand whether a purchased card remains watched in Radar, moves fully to Positions, or stays in Radar for continued scaling/monitoring.
- Radar should not become a general collection import surface.

### Search

Search must be context-specific. Different search boxes should not secretly perform different domains of work.

Search domains:

- Card Search: Scryfall card discovery and printing selection.
- Local Search: local Radar ideas and owned Positions only.
- Transaction Search: future ledger/history filtering.
- Global Search: future app-level routing to the right workflow.

Rules:

- Card search is not local Positions/Radar filtering.
- Local table filtering is not Scryfall discovery.
- Transaction search is not card discovery.
- Global search routes; it should not become a deep filtering UI.

Radar name search:

- Exact set-number input is detected before name search.
- Normal name input is forgiving: autocomplete results are tried first, ordered abbreviation fragments such as `tef pro` are added, partial name-token matches are added, and a Scryfall fuzzy match is used as a final candidate.
- Search should help identify the card first; printing selection happens after the user chooses a card identity.
- Active search and printing result surfaces should collapse when the user clicks elsewhere or opens Card Detail.
- Search and printing results are paper-only in the active UI. Digital/MTGO search is archived until ManaSpec can also render MTGO tix pricing.
- Adding to Radar is explicit: printing rows use a compact Select action and exact set-number results use an Add button instead of whole-row click-to-add.
- Printing rows show available nonfoil and foil prices inline; finish choice happens in the add workflow only when multiple finishes exist.
- Card names in printing rows open an art preview so the user can confirm the version before adding.

Set-number search:

- Radar search supports exact Scryfall printing lookup by set code and collector number.
- Supported examples include `FIN 123`, `FIN #123`, `FIN-123`, `FIN:123`, `FIN123`, and `#123 FIN`.
- Compact input such as `FIN123` is supported for letter-only set codes of at least three letters.
- Short or digit-bearing set codes should use a separator, such as `MH3 123`, `M21 123`, or `2X2 123`, to avoid ambiguous parsing.

Deferred bulk import:

- Bulk set-number lookup is not part of the core Radar view.
- A future Admin workflow may support owned-spec backfill from pasted rows, cleaned GPT output, CSV, or spreadsheet-style data.
- Backfill should create opening or historical transactions first, then create or update Positions from those transactions.
- Practical import headers can include card name, set code or set name, collector number, foil/nonfoil, quantity, buy date, entry price, acquisition method, notes or thesis, target price, and target hold time.
- Estimated dates and prices should be preserved with explicit fields such as `estimatedDate`, `estimatedPrice`, `confidence`, and `sourceNote`.
- Bulk import should live outside the normal Radar search flow so ManaSpec does not drift toward general collection tracking.

### Signals

Signals surfaces target-state awareness from local Radar and Positions data.

Ownership model:

- Signals is a read-only attention layer.
- Signals owns alerts, reminders, target-state awareness, and navigation back to the source workflow.
- Signals does not own entry, exit, hold, quantity, notes, transaction, or position state.
- Signals should deep-link to the relevant Radar idea or Position whenever possible.
- Any quick edit shown in Signals is a shortcut to canonical Radar or Positions plan data, not Signals-owned data.

Current behavior:

- Signals uses the shared module context band for attention buckets.
- Signals summary tiles filter the attention table, and the table header includes a `Show all` reset when a bucket is active.
- Manual signal records can still be added.
- Target panels show exit hits, entry hits, approaching targets, and tracked cards with no plan.
- Target states are based on local `entryTarget`, `exitTarget`, month-based `holdTime`, ownership, elapsed hold time, and current price snapshots.
- Target signal rows show compact printing identity, source workflow, and action context such as buy, sell, review, watch, or market check.
- Target signal rows include a compact reason column so the user can see why the row exists before opening Detail.
- Target signal rows can open card detail or jump to Radar/Positions.
- No Plan signal rows show tracked cards without plan data and link back to the source workflow for edits.

Current limitations:

- Signals do not yet create transaction actions.
- Signals do not use external listing count or unusual-activity data.
- Signals navigation currently jumps to the module rather than always preserving exact card context.

Workflow rule:

- Signals should answer: what needs attention, why, and where should the user go next?
- Signals should not become a data-entry module except for narrow shortcuts that save back to the canonical source.

### Notes

Notes are user-authored card memory.

Current behavior:

- Notes are stored in `cardNotes`, separate from both Radar rows and Position rows.
- Notes are keyed by exact tracked printing identity, currently Scryfall card id plus finish.
- Card Detail can add append-first notes and show newest-to-oldest note history.
- Radar, Positions, and History use a compact notepad icon for note presence. Radar and Positions open Card Detail, expand/focus Notes, and let the user continue writing.
- Buying from Radar, buying more, partial selling, selling all, and re-buying the same exact printing should not delete or duplicate note history.

Rules:

- Notes belong to the tracked printing identity, not to Radar, Positions, Signals, Transactions, History, or Thesis.
- Notes remain user-authored; ManaSpec should not generate them.
- Do not attach new notes only to a module-specific Radar row or Position row.
- Thesis code and `thesisNotes` are archived for now, not destructively deleted.

### Transactions

Transactions are the planned source of truth for buy and sell activity. They answer: what actually happened?

Ownership model:

- Transactions own the durable record of buys, sells, openings, corrections, and future acquisition methods.
- Transactions should become append-first and auditable.
- Transactions do not own Radar intent or notes.
- Positions should eventually be computed from transaction history rather than manually maintained as independent truth.
- History presents transaction and activity records for review; it should not be the source of transaction truth.

Current state:

- Buy and sell actions still directly mutate records in `specs`.
- Buy and sell actions also log transaction records.
- Existing owned positions are backfilled into opening `BUY` records using current quantity, average buy price, and buy date when available.
- Transactions shows local ledger context above filters for buys, sells, net cash flow, and recent activity.
- Transactions can be filtered by text and transaction type.
- Transaction totals display as signed cash movement.
- Transactions display balance after each event and realized gain/loss on SELL rows when cost basis is available.

Future behavior:

- Buy creates a `BUY` transaction.
- Sell creates a `SELL` transaction.
- Historical owned-spec backfill creates opening or historical acquisition transactions instead of directly stuffing rows into Positions.
- Positions are computed from transactions.
- History is a view over transactions.
- Realized P/L is calculated from transaction history.
- Deletes should be avoided or replaced with explicit correction records once the ledger exists.

Migration requirements:

- Preserve existing `specs` data.
- Convert owned positions into opening buy transactions where possible.
- Preserve watched specs separately from owned positions.
- Do not remove current Positions behavior until derived positions are verified.

Rules:

- Transactions are append-first.
- Positions are computed views.
- History should not disappear when quantity reaches zero.
- Corrections should be explicit once the ledger exists.

### History

History is an audit-oriented activity feed across local app events.

Current behavior:

- History includes transactions, Radar additions, shared card notes, and archived thesis notes.
- History shows local review context above filters for events, trades, lessons/review, and notes.
- History can be filtered by text and event type.
- History transaction details include balance context and SELL realized gain/loss when available.
- Transaction history rows preserve buy/sell activity even when a current position reaches zero quantity.

## Current Data Concepts

### Card

Represents a specific Scryfall card or printing.

Relevant fields:

- `id`
- `name`
- `set_code`
- `set_name`
- `collector_number`
- `foil`
- `currentPrice`

### Radar Item

Radar items are stored separately from owned Positions in `radar`. They represent exact printings being watched or staged before purchase.

Radar and Positions tracked cards can also carry optional planning fields:

- `plannedQty`
- `entryTarget`
- `exitTarget`
- `holdTime`

### Position

Current implementation stores positions directly in `specs`.

Relevant fields:

- `qty`
- `buyPrice`
- `buyDate`
- `currentPrice`
- `pl`

Long-term model: positions should be computed from transaction history.

### Card Note

Append-first user note for an exact tracked printing.

Current fields:

- `id`
- `cardKey`
- `cardId`
- `scryfall_id`
- `finish`
- `cardName`
- `set_code`
- `set_name`
- `collector_number`
- `text`
- `createdAt`
- `updatedAt`

### Transaction

Planned source of truth for buys and sells.

Future fields:

- card or printing reference
- date
- type or acquisition method: `BUY`, `SELL`, `OPENED`, `TRADE_IN`, `TRADE_OUT`, `PRIZE`, `PROMO`, `GIFT`, `STORE_CREDIT`, or `CORRECTION`
- quantity
- price
- fees
- notes
- source metadata for backfills, estimates, and imported batches

## Current Position Shape

```js
{
  id,
  name,
  set_code,
  set_name,
  collector_number,
  foil,
  qty,
  buyPrice,
  currentPrice,
  pl,
  buyDate
}
```

## Future Transaction Shape

```js
{
  id,
  cardId,
  name,
  set_code,
  set_name,
  collector_number,
  foil,
  type, // BUY, SELL, OPENED, TRADE_IN, PRIZE, PROMO, GIFT, STORE_CREDIT, CORRECTION
  quantity,
  price,
  fees,
  date,
  notes,
  source,
  estimatedDate,
  estimatedPrice,
  confidence,
  sourceNote
}
```

## Pricing Philosophy

- Current price is a snapshot from Scryfall.
- Printing matters.
- USD is the current pricing currency.
- Price is a signal, not a recommendation.
- Listing count and liquidity context are useful later but not required for current alpha.
- Scryfall EDHREC rank is useful as a compact popularity signal, but raw EDHREC deck counts are deferred until there is a reliable external-signal fetch path.
- Comparable printing prices are a future spread signal. Start with same-Oracle Scryfall printings before attempting separate TCGplayer lookup IDs.

## Deferred Sealed Product Lane

Sealed product is valuable for speculation, but singles remain the priority until the core workflow is stable.

Likely sealed approach:

- Use MTGJSON sealed product data for canonical product identity.
- Preserve MTGJSON product identifiers and TCGplayer purchase URLs when available.
- Store sealed products separately from single-card printings.
- Reuse the market-check pattern: open exact market links, paste visible price/seller/quantity signals, and save timestamped observations.
- Avoid merging sealed into the card model. Sealed should become a sibling asset type later.

## Success Criteria For v1

- User can track specs without spreadsheets.
- User can clearly separate watched ideas from owned positions.
- User can record buys and sells cleanly.
- User can see Positions P/L and total equity.
- User can define and monitor entry/exit targets.
- User can review past trades and saved card notes.

## When To Split Docs Again

Keep the docs flat until the app earns more structure.

Split a module into its own spec only when it has:

- Independent state.
- Multiple files with non-obvious behavior.
- Its own workflow decisions.
- Enough implementation detail that this README becomes hard to scan.
