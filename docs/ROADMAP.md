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

Current discipline: do not expand sideways until the core singles workflow has been smoke tested, cataloged, and prioritized for 1.0 beta.

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
- Radar entry target editing directly from the Radar table.
- Radar planned quantity editing directly from the Radar table.
- Radar buy flow creates or updates a Position while keeping the Radar item watched.
- Optional target and hold-time columns in the Positions scan table.
- Inline target and hold-time editing from the Positions scan table.
- Positions sell workflow supports a chosen quantity or all copies.
- Plan-state filters for planned, unplanned, hit, and approaching cards.
- Dashboard target panels backed by local target fields.
- Signals target panels backed by local Radar and Positions target fields.
- Signals quick actions for opening card detail or jumping to Radar/Positions.
- Signals is now a read-only attention layer for plan data; plan edits happen in Radar, Positions, or Card Detail.
- Card Detail saves plan edits to the source that opened the printing instead of cross-writing Radar and Positions.
- Transaction ledger filters for text and buy/sell type.
- History filters for text and event type.
- Radar set-number search for exact Scryfall printing lookup.
- Contextual right-side Help drawer with initial workflow topics.
- Card-linked thesis notes from card detail.
- Thesis view support for linked and general notes.
- Compact card-detail Market Evaluation from observable/local data only.
- Scryfall EDHREC rank shown as a compact EDH presence signal in card detail.
- Navigation zones wired for dashboard, watchlists, signals, thesis, and history.
- Table layout restored after Radar Entry and Positions Sell Qty columns.

### Now

- Keep `index.html` as a static shell.
- Keep `app.js` as bootstrapping and view coordination.
- Treat Radar and Positions as sibling singles workflows.
- Keep card discovery in Radar and owned holdings in Positions.
- Separate card discovery search from local position filtering.
- Document current behavior before refactoring the trading model.

### Next

1. Signals deep-linking
   - Jump to the exact Radar idea or Position from a signal.
   - Prefer highlight, temporary filter, or scroll-to-card over broad module navigation.

2. Card Detail command center pass
   - Re-test opening from Radar, Positions, Signals, Transactions, History, and Thesis.
   - Tighten Plan, Thesis, Market Check, Market Evaluation, Card Data, and Actions without expanding scope.
   - Update Help in the same pass.

3. Data safety
   - Add JSON export/import from Admin before relying more heavily on localStorage.
   - Make backup/restore understandable before deeper ledger work.

4. Ledger migration plan
   - Draft the transaction migration path before changing the storage model.
   - Preserve existing localStorage data while defining computed Positions from transactions.

5. UX polish candidates from beta notes
   - Replace layout-shifting app notices with toast notifications.
   - Replace browser-native sell confirmation with an app-styled workflow.
   - Simplify Radar search mode selection toward unified smart search.

## 1.0 Beta Track

Goal: turn the current alpha into a usable product, not a wider prototype.

### Beta Gates

1. Catalog pass
   - [x] Manually test the current workflow and capture first beta notes.
   - [x] Record what works, what breaks, what is confusing, and what feels missing.
   - [x] Classify first notes before deciding what belongs in beta.
   - [ ] Repeat after current fixes and capture the next batch of notes.

2. Core loop fixes
   - [x] Define module ownership for Radar, Positions, Signals, Card Detail, and Transactions.
   - [x] Make Radar keep watched items after purchase.
   - [x] Make Radar entry target editable directly in Radar.
   - [x] Support planned quantity from Radar buy flow.
   - [x] Support chosen-quantity and sell-all exits from Positions.
   - [x] Remove Signals plan editing so Signals behaves as an attention layer.
   - [x] Make Card Detail plan saves source-specific.
   - [ ] Deep-link Signals to exact Radar/Position rows.
   - [ ] Re-test Transactions, History, and Dashboard after another complete core-loop pass.

3. Card Detail command center
   - [ ] Tighten card detail into a compact working panel.
   - [ ] Keep Plan, Thesis, Market Check, Market Evaluation, Card Data, and Actions visible but not crowded.
   - [ ] Confirm opening from Radar, Positions, Signals, Transactions, History, and Thesis.
   - [ ] Update help copy in the same pass.

4. Data safety
   - [ ] Add JSON export/import from Admin.
   - [ ] Make backup/restore understandable before deeper ledger or storage changes.
   - [ ] Treat localStorage as user data that must be portable.

5. Ledger foundation
   - [ ] Write the migration plan before changing storage behavior.
   - [ ] Preserve current `specs`, `radar`, `transactions`, `thesisNotes`, market observations, cash, and price snapshots.
   - [ ] Move toward transactions as the source of truth and Positions as a computed view.
   - [ ] Keep historical owned-spec backfill in view, but do not build it before export/import and transaction safety are clear.

6. Beta polish and freeze
   - [x] Restore table layout integrity after Radar/Positions column changes.
   - [ ] Replace layout-shifting notices with toast notifications.
   - [ ] Replace native sell confirmation with an app-styled workflow.
   - [ ] Tighten labels, empty states, confirmations, disabled states, table scan behavior, and Help.
   - [ ] Smoke test the complete beta path.
   - [ ] Version the app as `v1.0.0-beta` only after the core loop is reliable.

### Scope Lock Until Beta

Do not expand these areas until the beta gates above are complete:

- Sealed product tracking.
- Large bulk import workflow.
- Owned-spec backfill workflow beyond a small admin/manual path.
- Backend or database work.
- Automated recommendations.
- Heavy charting.
- New market integrations beyond exact external links and saved manual observations.

### Library Candidates To Review

Keep ManaSpec vanilla-first unless a library clearly removes repeated infrastructure work.

- Tabulator: likely candidate for serious data grids such as Positions, Radar, Transactions, History, and Signals tables. Review after the catalog pass, or proof-test on one table if table polish keeps consuming time.
- Dexie.js: likely candidate when moving from localStorage to IndexedDB. Use only after the ledger shape is clear.
- Day.js: useful candidate for buy dates, added dates, hold windows, stale checks, sorting, and readable timestamps.
- Fuse.js: possible candidate for local fuzzy search across Radar, Positions, Transactions, Thesis, and History.
- Papa Parse: future candidate for CSV/spreadsheet import and owned-spec backfill, but keep import tooling deferred until core singles workflow and data safety are stable.
- Chart.js: future candidate once transaction history and price snapshots have enough data to deserve charts.

Current rule: one tool at a time. Add a library only when it directly supports the beta path or removes a recurring source of bugs.

### Next Session Review Plan

Use this as the starting point for the next working session. This pass is for cataloging, not fixing.

Capture notes in this format:

- Area: Dashboard, Radar, Positions, Card Detail, Signals, Transactions, History, Thesis, Admin, Help, or Overall.
- Type: bug, confusing UX, missing beta feature, data concern, polish, or future idea.
- Severity: blocker, beta-critical, useful, or defer.
- Repro: what you did and what happened.
- Expected: what you thought should happen.
- Thought: any instinct, annoyance, or product idea.

1. Workflow smoke test
   - Search by name in Radar.
   - Search by set number, using examples like `FIN 123`, `FIN #123`, `FIN123`, and `MH3 123`.
   - Add an idea to Radar.
   - Set entry target in Radar.
   - Set planned quantity in Radar.
   - Buy from Radar into Positions and confirm it remains watched in Radar.
   - Buy one more from Positions.
   - Sell one from Positions.
   - Sell a chosen quantity from Positions.
   - Sell all remaining copies from Positions when intentionally testing close behavior.
   - Delete only if testing destructive behavior intentionally.
   - Edit `Target` and `Hold` inline in Positions.
   - Open card detail from Radar, Positions, Signals, Transactions, and History when possible.
   - Save a plan from card detail.
   - Add a linked thesis note from card detail.
   - Paste a TCGplayer Price Points block if you have one handy.
   - Confirm Signals reflects entry/exit/approaching/no-plan states.
   - Confirm Transactions and History show useful audit trails.
   - Confirm Dashboard numbers and scan panels make sense after the actions.

2. Catalog prompts
   - Where did you hesitate?
   - Where did the app make you wonder whether something saved?
   - Which labels felt wrong or too vague?
   - Which actions felt risky?
   - Which table columns helped you make a decision?
   - Which table columns felt like noise?
   - What would you expect to do next after seeing a target hit?
   - What information did you reach for that was not available?
   - What would make this feel usable tomorrow without becoming a bigger app?

3. Card detail review
   - Treat card detail as the command center for a tracked printing.
   - Organize the panel into clear working areas: Plan, Market Check, Card Data, and Actions.
   - Keep it compact and scan-friendly; do not turn it into a decorative page.
   - Confirm the new EDH rank tile is useful without making the panel feel crowded.
   - Update the relevant help topic in the same pass.
   - Current experiment: narrower side-drawer width before deciding whether to collapse forms/sections by default.

4. Current open beta notes
   - Signals deep-linking: jump to the exact Radar idea or Position instead of only switching modules.
   - Signals hierarchy: make each signal communicate why it appears and what action is expected.
   - Global notifications: replace layout-shifting save notices with toast notifications.
   - Radar search UX: reduce search-mode confusion, likely by moving toward unified smart search.
   - Positions sell confirmation: replace browser-native confirm with an app-styled workflow.

5. Ledger migration sketch
   - Write the plan before changing storage.
   - Define how current `specs` become computed positions from transaction events.
   - Preserve current localStorage data while introducing any future ledger behavior.
   - Keep a future real database as a learning/storage upgrade, not the next immediate dependency.

6. Optional quality-of-life candidate
   - Sketch a separate import workflow for spreadsheet or binder input if bulk adding becomes important.
   - Keep this framed as owned-spec backfill, not collection import.
   - Assume the user may provide cleaned parsed rows from GPT or a spreadsheet before ManaSpec has a full parser.
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

## Future Admin: Owned Spec Backfill

Goal: let users add older owned specs without turning ManaSpec into a collection manager.

- Build this only after the beta path, export/import, and ledger direction are stable enough to protect user data.
- Start with a small Admin workflow for manual paste or spreadsheet rows, not a broad collection importer.
- Import historical/opening transactions first, then create or update Positions from those transactions.
- Treat Positions as the current holdings view and Transactions as the source of truth.
- Support exact Scryfall printing matching from card name, set code or set name, collector number, and foil/nonfoil where possible.
- Preview all matches before saving and allow correction for unresolved or ambiguous printings.
- Accept practical spreadsheet-style headers such as card name, set code or set name, collector number, foil/nonfoil, quantity, buy date, entry price, acquisition method, notes or thesis, target hold time, and target price.
- Allow the user to paste cleaned parsed data from GPT or another tool as an early low-build path.
- Preserve estimates with flags such as `estimatedDate`, `estimatedPrice`, `confidence`, and `sourceNote` instead of pretending uncertain history is exact.
- Support non-buy acquisition methods over time, including `OPENED`, `TRADE_IN`, `PRIZE`, `PROMO`, `GIFT`, `STORE_CREDIT`, and `CORRECTION`.
- Keep the workflow scoped to cards with a speculation thesis, exit interest, or finance relevance.

## Deferred

- Sealed product tracking. Likely source: MTGJSON sealed product data for product identity and TCGplayer links, paired with manual/paste market observations. Keep this behind singles work until the core singles workflow is stable.
- Large collection-style bulk import from spreadsheet or binder rows. A smaller owned-spec backfill path is a future Admin candidate, but it should stay out of core Radar and should create transactions before positions.
- Raw EDHREC deck-count tracking. Current alpha only uses Scryfall `edhrec_rank`; raw deck counts need a reliable external-signal fetch/storage path.
- Advanced prediction.
- Backend service.
- Multi-user sync.
- Automated trading advice.
- Heavy charting before history data exists.
