# ManaSpec Docs

This folder is the active source of truth for ManaSpec.

The older `dev notes/` folder contains dated planning history. Use it only when intentionally researching past reasoning. Do not treat old notes as active instructions.

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
- Reviewing outcomes against the original thesis.

ManaSpec does not make trading decisions. It provides visibility, structure, and discipline around user-driven speculation.

ManaSpec is not a collection tracker, inventory nostalgia tool, prediction engine, automated trading advisor, or multi-user finance platform.

## Current Stack

- Vanilla HTML/CSS/JavaScript.
- Tabulator for the holdings table.
- Scryfall API for card identity, printings, and pricing snapshots.
- localStorage for persistence.
- No backend.

ManaSpec is local-first for user state, but it is not offline-only. Scryfall-backed search, printing data, and price refresh require network access.

## App Shape

ManaSpec is a modular trading terminal running inside one static app shell. It has workflow zones exposed through module navigation, but it is not currently a routed SPA.

Primary zones:

- Dashboard: awareness and what matters now.
- Positions: owned holdings only. Radar handles card discovery and watch ideas before purchase.
- Watchlists: ideas without ownership.
- Signals: targets, price movement, and action triggers.
- Thesis: reasoning, catalysts, conviction, and exit logic.
- History: buys, sells, outcomes, and learning.

Current workflow direction:

- Radar is for ideas before money is committed.
- Positions is for owned money and compact trade management.
- Signals is for what needs attention now.
- Transactions and History are for what happened and what can be audited later.
- Thesis is for why the user cared and what would change the plan.

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
- Dashboard, Watchlists, Signals, Thesis, and History have navigation entries and placeholder views.
- Positions and Radar are the active singles workflows.

Rules:

- Keep `index.html` mostly static.
- Do not put feature logic in `index.html`.
- Keep `app.js` focused on bootstrapping, navigation, and glue.
- Summary is global app UI, not portfolio-specific UI.
- Global card search sits in the main workbar beside module navigation.
- Views are workflow zones, not full routed pages yet.

DOM conventions:

- Summary IDs: `cash`, `invested`, `value`, `totalEquity`, `totalPL`.
- Active view mount: `viewContainer`.
- Positions table mount: `table`.
- Radar card search: `searchBox`, `searchResults`, `printingsView`.
- Help drawer: `helpDrawer`.

### Help

ManaSpec uses contextual help instead of a single large manual.

Current behavior:

- The app shell has a Help button that opens a right-side drawer.
- Help defaults to the currently active workflow.
- Users can switch between help topics inside the drawer.
- Current topics cover Dashboard, Radar, Positions, Signals, TCG Price Points, Transactions, History, Thesis, and Admin.

Rules:

- Help should be updated in the same pass as workflow changes.
- Keep help task-based and concise.
- Screenshots or GIFs should wait until UI surfaces stabilize.
- Help should reveal confusing workflows, not excuse them.

### Card Detail

Card detail is the command center for a tracked printing.

Current behavior:

- Card detail opens from Radar, Positions, and Signals.
- Positions card names and Radar rows open card detail.
- The panel is organized into Overview, Plan, Thesis, Actions, Market Evaluation, Market Check, and Card Data.
- Overview shows current price, movement, ownership state, buy price, value, and P/L.
- Plan edits entry target, exit target, and hold time.
- Thesis adds and reviews notes linked to the current printing.
- Actions opens exact market/reference pages.
- Market Evaluation summarizes observable market mechanics from saved/local data: supply, velocity, price confidence, Scryfall EDH rank, target math, freshness, and data gaps.
- Market Check saves pasted TCGplayer Price Points text as a local observation and includes a compact explanation of what to copy.
- Card Data keeps printing metadata and Oracle text visible without crowding Positions.

Market evaluation rules:

- Use only observable market data, Scryfall metadata, local targets, local thesis presence, and saved timestamps.
- Scryfall `edhrec_rank` can be shown as an EDH presence signal. It is a rank, not a raw EDHREC deck count.
- Do not evaluate format demand, reprint risk, hype, or speculative catalysts.
- Do not produce buy/sell recommendations.
- Strategy and thesis stay user-authored.

### Positions

Purpose: show owned positions and support active holding management.

The positions workflow supports:

- Buying and selling from the holdings table.
- Viewing position value and P/L.
- Filtering owned positions by card metadata and price bands.
- Setting optional entry target, exit target, and estimated hold time from card detail.
- Scanning optional exit target and estimated hold time directly in the Positions table.
- Editing optional exit target and hold time inline from the Positions table.

Radar owns card discovery, printing selection, watch ideas, and buy candidates before ownership.

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
- Positions table action buttons are reserved for state-changing actions such as buy, sell, and delete.
- Local Radar and Positions filters include reset actions and plan-state filters.
- Local Radar and Positions filters use visible labels so filter meaning is clear while scanning.
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

### Search

Search must be context-specific. Different search boxes should not secretly perform different domains of work.

Search domains:

- Card Search: Scryfall card discovery and printing selection.
- Portfolio Search: local holdings and watched specs only.
- Transaction Search: future ledger/history filtering.
- Global Search: future app-level routing to the right workflow.

Rules:

- Card search is not portfolio filtering.
- Portfolio search is not Scryfall discovery.
- Transaction search is not card discovery.
- Global search routes; it should not become a deep filtering UI.

Radar name search:

- Exact set-number input is detected before name search.
- Normal name input is forgiving: autocomplete results are tried first, ordered abbreviation fragments such as `tef pro` are added, partial name-token matches are added, and a Scryfall fuzzy match is used as a final candidate.
- Search should help identify the card first; printing selection happens after the user chooses a card identity.
- Search and printing results default to paper cards. A Digital checkbox can include MTGO/Arena results when needed.
- Adding to Radar is explicit: printing rows and exact set-number results use an Add button instead of whole-row click-to-add.
- Printing rows show nonfoil and foil prices/actions inline when those finishes exist.
- Card names in printing rows open an art preview so the user can confirm the version before adding.

Set-number search:

- Radar search supports exact Scryfall printing lookup by set code and collector number.
- Supported examples include `FIN 123`, `FIN #123`, `FIN-123`, `FIN:123`, `FIN123`, and `#123 FIN`.
- Compact input such as `FIN123` is supported for letter-only set codes of at least three letters.
- Short or digit-bearing set codes should use a separator, such as `MH3 123`, `M21 123`, or `2X2 123`, to avoid ambiguous parsing.

Deferred bulk import:

- Bulk set-number lookup is not part of the core Radar view.
- A future import workflow may support users pasting spreadsheet or binder rows to bulk add positions or candidates.
- Bulk import should live outside the normal Radar search flow so ManaSpec does not drift toward general collection tracking.

### Signals

Signals surfaces target-state awareness from local Radar and Positions data.

Current behavior:

- Manual signal records can still be added.
- Target panels show exit hits, entry hits, approaching targets, and tracked cards with no plan.
- Target states are based on local `entryTarget`, `exitTarget`, month-based `holdTime`, ownership, elapsed hold time, and current price snapshots.
- Target signal rows can open card detail or jump to Radar/Positions.
- No Plan signal rows include quick entry target, exit target, and hold-month fields so missing plans can be filled in place.

Current limitations:

- Signals do not yet create transaction actions.
- Signals do not use external listing count or unusual-activity data.

### Thesis

Thesis is user-authored decision memory.

Current behavior:

- Thesis notes can be general or linked to a specific tracked printing.
- Card detail can add linked thesis notes and show recent linked notes.
- The Thesis view shows linked and general notes together.
- Linked thesis notes can reopen the tracked card detail when the card still exists in Radar or Positions.

Rules:

- Thesis remains user-authored; ManaSpec should not generate conviction.
- Linked thesis notes should preserve card id, name, set code, set name, and collector number when available.

### Transactions

Transactions are the planned source of truth for buy and sell activity. They answer: what actually happened?

Current state:

- Buy and sell actions still directly mutate records in `specs`.
- Buy and sell actions also log transaction records.
- Existing owned positions are backfilled into opening `BUY` records using current quantity, average buy price, and buy date when available.
- Transactions can be filtered by text and transaction type.
- Transaction totals display as signed cash movement.

Future behavior:

- Buy creates a `BUY` transaction.
- Sell creates a `SELL` transaction.
- Positions are computed from transactions.
- History is a view over transactions.
- Realized P/L is calculated from transaction history.
- Deletes should be avoided or replaced with explicit correction records once the ledger exists.

Migration requirements:

- Preserve existing `specs` data.
- Convert owned positions into opening buy transactions where possible.
- Preserve watched specs separately from owned positions.
- Do not remove current portfolio behavior until derived positions are verified.

Rules:

- Transactions are append-first.
- Positions are computed views.
- History should not disappear when quantity reaches zero.
- Corrections should be explicit once the ledger exists.

### History

History is an audit-oriented activity feed across local app events.

Current behavior:

- History includes transactions, Radar additions, and thesis notes.
- History can be filtered by text and event type.
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

### Watched Spec

Current implementation uses `qty = 0` to represent a watched spec. This is a temporary bridge until explicit watchlists exist.

Radar and Positions tracked cards can also carry optional planning fields:

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

### Transaction

Planned source of truth for buys and sells.

Future fields:

- card or printing reference
- date
- type: `BUY` or `SELL`
- quantity
- price
- fees
- notes

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
  type, // BUY or SELL
  quantity,
  price,
  fees,
  date,
  notes
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
- User can see portfolio P/L and total equity.
- User can define and monitor entry/exit targets.
- User can review past trades and thesis quality.

## When To Split Docs Again

Keep the docs flat until the app earns more structure.

Split a module into its own spec only when it has:

- Independent state.
- Multiple files with non-obvious behavior.
- Its own workflow decisions.
- Enough implementation detail that this README becomes hard to scan.
