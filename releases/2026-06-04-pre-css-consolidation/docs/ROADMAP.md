# ManaSpec Roadmap

## North Star

ManaSpec is a decision terminal for MTG speculation: track positions, plan exits, watch market opportunities, and act with clarity.

It is not a collection tracker, inventory nostalgia tool, or prediction engine.

## Workflow Lineup

- App Shell: stable frame, navigation, global summary, active view mount.
- Radar: card discovery, printing selection, watch ideas, and buy candidates.
- Positions: owned holdings, buy more, sell, delete, filters, and P/L.
- Search: split by domain so card discovery, local portfolio filtering, transaction filtering, and future global routing stay distinct.
- Transactions: planned source of truth for buys and sells.
- Watchlists: planned explicit home for ideas without ownership.
- Signals: planned target and price movement awareness.
- Thesis: planned user-authored reasoning, catalysts, conviction, and exit logic.
- History: planned transaction and outcome review.

## Current Phase: Alpha Stabilization

Goal: make the current modular terminal shell reliable, understandable, and ready for the next data model step.

### Done

- Vanilla app shell with module navigation buttons.
- Global summary bar for cash, invested value, portfolio value, equity, and P/L.
- Radar workflow with Scryfall search and printing selection.
- Positions workflow with Tabulator holdings table.
- Portfolio code separated into search, printings, trading, pricing, snapshots, and table modules.
- Basic buy/sell/delete actions.
- Clear feedback after add, buy, sell, delete, and Radar remove actions.
- Confirmation copy for sell, delete, and Radar remove actions.
- Scryfall price refresh for current holdings.
- Pagination and portfolio count display.
- Compact Positions table default for laptop-height scan workflows.
- Filter reset controls for local Radar and Positions filters.
- Optional entry target, exit target, and hold-time fields on tracked cards.
- Optional target and hold-time columns in the Positions scan table.
- Inline target and hold-time editing from the Positions scan table.
- Plan-state filters for planned, unplanned, hit, and approaching cards.
- Dashboard target panels backed by local target fields.
- Signals target panels backed by local Radar and Positions target fields.
- Signals quick actions for opening card detail or jumping to Radar/Positions.
- Transaction ledger filters for text and buy/sell type.
- History filters for text and event type.
- Radar set-number search for exact Scryfall printing lookup.
- Contextual right-side Help drawer with initial workflow topics.
- Card-linked thesis notes from card detail.
- Thesis view support for linked and general notes.
- Compact card-detail Market Evaluation from observable/local data only.
- Scryfall EDHREC rank shown as a compact EDH presence signal in card detail.
- Navigation zones wired for dashboard, watchlists, signals, thesis, and history.

### Now

- Keep `index.html` as a static shell.
- Keep `app.js` as bootstrapping and view coordination.
- Treat Radar and Positions as sibling singles workflows.
- Keep card discovery in Radar and owned holdings in Positions.
- Separate card discovery search from local position filtering.
- Document current behavior before refactoring the trading model.

### Next

- Review the new flows after hands-on use: Radar search, set-number lookup, add to Radar, buy, inline target/hold edits, Signals, Transactions, and History.
- Clean up card detail as the emerging command center for Plan, Market Check, Card Data, and Actions.
- Draft the transaction migration path before changing the storage model.

### Next Session Review Plan

Use this as the starting point for the next working session after testing the app manually.

1. Workflow smoke test
   - Search by name in Radar.
   - Search by set number, using examples like `FIN 123`, `FIN #123`, `FIN123`, and `MH3 123`.
   - Add an idea to Radar.
   - Buy from Radar into Positions.
   - Edit `Target` and `Hold` inline in Positions.
   - Confirm Signals reflects entry/exit/approaching/no-plan states.
   - Confirm Transactions and History show useful audit trails.

2. Card detail cleanup
   - Treat card detail as the command center for a tracked printing.
   - Organize the panel into clear working areas: Plan, Market Check, Card Data, and Actions.
   - Keep it compact and scan-friendly; do not turn it into a decorative page.
   - Confirm the new EDH rank tile is useful without making the panel feel crowded.
   - Update the relevant help topic in the same pass.
   - Current experiment: narrower side-drawer width before deciding whether to collapse forms/sections by default.

3. Ledger migration sketch
   - Write the plan before changing storage.
   - Define how current `specs` become computed positions from transaction events.
   - Preserve current localStorage data while introducing any future ledger behavior.
   - Keep a future real database as a learning/storage upgrade, not the next immediate dependency.

4. Optional quality-of-life candidate
   - Sketch a separate import workflow for spreadsheet or binder input if bulk adding becomes important.
   - Watch for parser edge cases around promos, alternate collector numbers, and digit-bearing set codes.
   - Prototype same-Oracle comparable printing prices as a compact spread signal.

## Phase 1: UX Clarity

Goal: remove "what just happened?" moments from the current app.

- Make Add Card clearly create a Radar idea.
- Keep watched ideas out of Positions.
- Clarify buy, sell, and delete actions.

## Phase 2: Ledger Foundation

Goal: move from direct position mutation toward transaction history.

- Use `docs/README.md` as the implementation guide until the ledger becomes large enough to deserve its own spec.
- Introduce a transaction record shape.
- Add a transaction creation flow for buy/sell.
- Compute positions from transactions.
- Preserve current position data during migration.
- Add history view backed by transaction events.

Important rule: long term, positions are computed views. Transactions are the source of truth.

## Phase 3: Watchlists And Targets

Goal: separate ideas from owned positions and add decision triggers.

- Create explicit watchlist data and UI.
- Add optional entry targets.
- Add optional exit targets.
- Add target-zone states such as hit, near hit, and stop triggered.
- Keep thesis notes user-authored.

## Phase 4: Signals And Dashboard

Goal: turn tracked data into fast decision awareness.

- Portfolio movers up/down.
- Watchlist movers.
- Target hits and approaching targets.
- Basic radar signals for price movement and unusual activity when data supports it.
- Dashboard remains a dense scan view, not a marketing page or decorative home screen.

## Phase 5: Persistence Upgrade

Goal: make data portable and safer.

- JSON export/import.
- Backup and restore flow.
- Optional desktop wrapper later if local file saves become important.

## Deferred

- Sealed product tracking. Likely source: MTGJSON sealed product data for product identity and TCGplayer links, paired with manual/paste market observations. Keep this behind singles work until the core singles workflow is stable.
- Bulk import from spreadsheet or binder rows. Keep it out of core Radar until the workflow clearly supports importing positions or candidates without becoming collection tracking.
- Raw EDHREC deck-count tracking. Current alpha only uses Scryfall `edhrec_rank`; raw deck counts need a reliable external-signal fetch/storage path.
- Advanced prediction.
- Backend service.
- Multi-user sync.
- Automated trading advice.
- Heavy charting before history data exists.
