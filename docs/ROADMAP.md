# ManaSpec Roadmap

## North Star

ManaSpec is a decision terminal for MTG speculation: track positions, plan exits, watch market opportunities, and act with clarity.

It is not a collection tracker, inventory nostalgia tool, or prediction engine.

## Ownership

This roadmap represents committed future work. If an item is here, the project has decided it belongs in ManaSpec; the remaining questions are timing, order, and implementation shape.

Use [PARKING_LOT.md](PARKING_LOT.md) for promising ideas that still need validation, workflow testing, prioritization, or a product decision.

Status markers:

- `[x]` Done
- `[-]` Partially done
- `[ ]` Not done

## Workflow Lineup

- App Shell: stable frame, navigation, global summary, active view mount.
- Radar: card discovery, printing selection, watch ideas, and buy candidates.
- Positions: owned holdings, buy more, sell, delete, filters, and P/L.
- Search: split by domain so card discovery, local Positions/Radar filtering, transaction filtering, and future global routing stay distinct.
- Transactions: planned source of truth for buys and sells.
- Signals: target and price movement awareness.
- Notes: user-authored card memory attached to exact tracked printings.
- History: transaction and outcome review.

## Current Phase: Alpha Friend Preview

Goal: use `v0.9.0-alpha.1` with one or two trusted testers while moving from solo core-loop validation into friend feedback and additional user-facing features.

Current discipline: the repeated solo core singles workflow pass is complete. Do not reopen the whole core-loop testing phase for future findings; capture remaining issues from feature work or real-user use as individual bugs or polish.

### Done

- [x] Vanilla app shell with module navigation buttons.
- [x] Global summary bar for cash, invested value, portfolio value, equity, and P/L.
- [x] Radar workflow with Scryfall search and printing selection.
- [x] Positions workflow with ManaSpec-native holdings table.
- [x] Positions/Radar code separated into search, printings, trading, pricing, snapshots, and table modules under the existing `js/modules/portfolio/` path.
- [x] Basic buy/sell/delete actions.
- [x] Clear feedback after add, buy, sell, delete, and Radar remove actions.
- [x] Confirmation copy for sell, delete, and Radar remove actions.
- [x] Scryfall price refresh for current holdings.
- [x] Pagination and Positions count display.
- [x] Compact Positions table default for laptop-height scan workflows.
- [x] Filter reset controls for local Radar and Positions filters.
- [x] Optional entry target, exit target, and hold-time fields on tracked cards.
- [x] Radar entry target editing directly from the Radar table.
- [x] Radar and Positions target delta columns for faster target scanning.
- [x] Radar planned quantity editing directly from the Radar table.
- [x] Radar buy flow creates or updates a Position while keeping the Radar item watched.
- [x] Optional target and hold-time columns in the Positions scan table.
- [x] Inline target and hold-time editing from the Positions scan table.
- [x] Display-first click-to-edit treatment for Radar entry target and Positions target/hold fields.
- [x] Positions sell workflow supports a chosen quantity or all copies.
- [x] Plan-state filters for planned, unplanned, hit, and approaching cards.
- [x] Dashboard target panels backed by local target fields.
- [x] Signals target panels backed by local Radar and Positions target fields.
- [x] Signals summary tiles filter the attention table and include a visible reset back to all signals.
- [x] Signals rows show compact source, action context, and exact printing identity for beta workflow scanning.
- [x] Signals quick actions for opening card detail or jumping to Radar/Positions.
- [x] Signals is now a read-only attention layer for plan data; plan edits happen in Radar, Positions, or Card Detail.
- [x] Dashboard and Signals share compact attention queue row language for target hits, approaching states, missing plans, stale checks, and recent note context.
- [x] Signals attention tiles support bucket filtering from the tile/header and exact-card filtering from queue rows.
- [x] Signals Approaching previews fill quiet days with closest target-watch rows outside the true near-target threshold.
- [x] Signals No Plan ownership is explicit: Radar requires Entry Target, while Positions require Exit Target and Hold.
- [x] Hold-time planning accepts simple month ranges such as `6-12` and `12-18`.
- [x] Shared note indicators use compact notepad icons in table workflows.
- [x] Card Detail saves plan edits to the source that opened the printing instead of cross-writing Radar and Positions.
- [x] Transaction ledger filters for text and buy/sell type.
- [x] History filters for text and event type.
- [x] Radar set-number search for exact Scryfall printing lookup.
- [x] Radar search and printing results are paper-only in the active UI until Digital/MTGO pricing can be supported with matching price intelligence.
- [x] Admin JSON backup export/import for localStorage-backed user data.
- [x] Contextual right-side Help drawer with initial workflow topics.
- [x] App notices render through a toast stack instead of layout-shifting inline status.
- [x] Positions sell uses an app-styled confirmation flow with one-copy, custom quantity, and sell-all choices.
- [x] Shared card notes from Card Detail, keyed by exact printing identity.
- [x] Thesis retired from active navigation while preserving existing Thesis code and data.
- [x] Compact card-detail Market Evaluation from observable/local data only.
- [x] Scryfall EDHREC rank shown as a compact EDH presence signal in card detail.
- [x] Navigation zones wired for dashboard, radar, positions, signals, transactions, history, and admin.
- [x] Table layout restored after Radar Entry and Positions sell workflow changes.
- [x] Core-loop smoke testing across the normal singles workflow.
- [x] Radar search and exact-printing selection validated.
- [x] Adding and managing Radar ideas validated.
- [x] Buying from Radar into Positions validated.
- [x] Additional buys from Positions validated.
- [x] Partial and full sells validated.
- [x] Plan, target, quantity, and hold editing validated.
- [x] Card Detail use across the normal workflow validated.
- [x] Signals, Transactions, History, and Dashboard behavior validated during normal use.
- [x] General friend-preview workflow validation complete.

### Now

- [x] Keep `index.html` as a static shell.
- [x] Keep `app.js` as bootstrapping and view coordination.
- [x] Treat Radar and Positions as sibling singles workflows.
- [x] Keep card discovery in Radar and owned holdings in Positions.
- [x] Separate card discovery search from local position filtering.
- [ ] Document current behavior before refactoring the trading model.

### Next

1. Friend feedback and user-facing feature pass
   - [ ] Capture friend-preview feedback as focused bugs, polish, or feature candidates.
   - [ ] Prioritize additional user-facing features that strengthen the validated singles workflow.

2. Signals source workflow polish
   - [x] Exact View actions filter/focus the source Radar idea or Position during normal workflow use.
   - [ ] Prefer source context preservation over broad module navigation when adding new Signal paths.

3. Ledger migration plan
   - [x] Define migration-readiness contracts, schema policy, reconciliation semantics, and a repeatable read-only discrepancy report.
   - [ ] Draft and approve the transaction-authority migration path before changing the storage model.
   - [ ] Preserve existing localStorage data while defining computed Positions from transactions.

4. UX polish candidates from beta notes
   - [ ] Continue tightening labels, empty states, disabled states, confirmations, dense table scan behavior, and Help from beta notes.
   - [x] Keep Radar search unified and paper-only until Digital/MTGO results can ship with supported pricing.

### Near-Term Feature Candidates: 2026-07-11 Planning Pass

The core singles workflow is considered complete. The next likely user-facing builds are ordered provisionally as follows; this is planning direction, not a commitment to start implementation before the next product turn is understood.

Execution note: the Data Ownership and Storage Readiness Audit and its three approved foundation batches are complete. Compatibility boundaries, centralized persistence, schema/migration readiness, reconciliation reporting, and the unsafe Position-delete guard are in place. User-facing feature work may resume in this provisional order; the separate transaction-authority migration remains unapproved future work.

1. Comparable Printings
   - Safest and most likely first build because Oracle-based Scryfall printing lookup, exact-printing identity, finish handling, and Card Detail already exist.
   - Smallest useful scope: a compact Card Detail section for paper printings with set, collector number, finish, release date, supported Scryfall price, exact links, and a clear highlight for the currently tracked printing and finish.
   - No persistence or migration change should be required.

2. Price-History Chart
   - Use existing `priceSnapshots` for one exact owned printing in Card Detail.
   - Smallest useful scope: a compact native SVG line chart with current/previous price context, observed date range, and an honest insufficient-history state.
   - Do not combine manual market observations with the Scryfall series, invent missing dates, or imply continuous history.
   - Current snapshots are saved only for owned Positions when price refresh runs, so sparse history is expected.

3. Owned-Spec Backfill / Import
   - Keep this in Admin and frame it as historical owned-spec backfill, not collection management.
   - Smallest useful scope: paste cleaned CSV/TSV-style rows, match exact Scryfall printings, preview every result, correct ambiguous or unresolved rows, and confirm one safe batch.
   - Resolve transaction provenance, uncertain dates/prices, duplicate-position behavior, cash impact, acquisition methods, atomic rollback, and startup-backfill interaction before frontend implementation.
   - Default planning direction: imported history should not silently change current cash, uncertain history should remain explicitly marked, and name-only identity is never sufficient.

4. Portfolio Performance Dashboard
   - Start only with metrics supported honestly by current state: deployed cost basis, current value, unrealized P/L, recorded or derivable realized P/L, and cash versus deployed capital.
   - Defer total-return-over-time and equity charts until ManaSpec records enough portfolio, quantity, cash, and transaction history to reconstruct them without invention.
   - Present-tense metrics may be called Portfolio Summary; do not label them historical performance.

Library direction for these candidates:

- Keep a first compact price chart native rather than adding Chart.js for one series.
- Consider Papa Parse only when import scope expands beyond cleaned paste data into robust quoted CSV/file handling.
- Preserve existing localStorage keys and backup schema compatibility. Any new top-level key must be added deliberately to backup/export/import.
- Continue treating Scryfall printing UUID plus finish as the mandatory identity boundary.

## 1.0 Beta Track

Goal: turn the current alpha preview into a usable beta product, not a wider prototype.

### Beta Gates

1. Catalog pass
   - [x] Manually test the current workflow and capture first beta notes.
   - [x] Record what works, what breaks, what is confusing, and what feels missing.
   - [x] Classify first notes before deciding what belongs in beta.
   - [x] Repeat after current fixes and capture the next batch of notes.

2. Core loop fixes
   - [x] Define module ownership for Radar, Positions, Signals, Card Detail, and Transactions.
   - [x] Make Radar keep watched items after purchase.
   - [x] Make Radar entry target editable directly in Radar.
   - [x] Support planned quantity from Radar buy flow.
   - [x] Support chosen-quantity and sell-all exits from Positions.
   - [x] Remove Signals plan editing so Signals behaves as an attention layer.
   - [x] Make Card Detail plan saves source-specific.
   - [x] Filter/focus exact Radar/Position rows from Signals View actions.
   - [x] Validate Signals source highlighting, scrolling, and exact-card filtering during normal workflow use.
   - [x] Re-test Transactions, History, and Dashboard during a complete core-loop pass.
   - [x] Validate Radar search, exact-print selection, Radar management, Radar-to-Positions buying, additional buys, partial/full sells, plan/target/quantity/hold editing, Card Detail use, and normal Dashboard/Signals/Transactions/History behavior.

3. Card Detail command center
   - [x] Tighten card detail into a compact working panel.
   - [x] Keep Plan, Notes, Market Check, Market Evaluation, Card Data, and Actions visible but not crowded.
   - [x] Confirm opening from Radar, Positions, Signals, Transactions, and History during normal workflow use.
   - [x] Update help copy in the same pass.

4. Data safety
   - [x] Add JSON export/import from Admin.
   - [x] Make backup/restore understandable before deeper ledger or storage changes.
   - [x] Treat localStorage as user data that must be portable.

5. Ledger foundation
   - [x] Complete the data ownership/readiness audit and approved three-batch compatibility foundation.
   - [x] Define preservation, schema-version, migration-fixture, and reconciliation contracts for current stored data.
   - [ ] Write and approve the transaction-authority migration plan before changing ownership behavior.
   - [ ] Move toward transactions as the source of truth and Positions as a computed view.
   - [ ] Keep historical owned-spec backfill in view, but do not build it before export/import and transaction safety are clear.

6. Beta polish and freeze
   - [x] Restore table layout integrity after Radar/Positions column changes.
   - [x] Fix shared toast readability and layering.
   - [x] Replace native sell confirmation with an app-styled workflow.
   - [ ] Tighten labels, empty states, confirmations, disabled states, table scan behavior, and Help.
   - [x] Smoke test the complete core singles path.
   - [x] Mark friend-preview status as `v0.9.0-alpha.1`.
   - [ ] Version the app as `v1.0.0-beta` after remaining non-core beta gates are satisfied.

### Scope Lock Until Beta

Keep these areas deferred until friend feedback, user-facing feature priorities, and data-safety work justify them:

- Sealed product tracking.
- Large bulk import workflow.
- Owned-spec backfill workflow beyond a small admin/manual path.
- Backend or database work.
- Automated recommendations.
- Heavy charting.
- New market integrations beyond exact external links and saved manual observations.

### Library Candidates To Review

Keep ManaSpec vanilla-first unless a library clearly removes repeated infrastructure work.

- Data-grid library: possible future candidate if native table helpers stop being enough for Positions, Radar, Transactions, History, and Signals. Review only after beta needs prove it.
- Dexie.js: likely candidate when moving from localStorage to IndexedDB. Use only after the ledger shape is clear.
- Day.js: useful candidate for buy dates, added dates, hold windows, stale checks, sorting, and readable timestamps.
- Fuse.js: possible candidate for local fuzzy search across Radar, Positions, Transactions, Notes, and History.
- Papa Parse: future candidate for CSV/spreadsheet import and owned-spec backfill, but keep import tooling deferred until core singles workflow and data safety are stable.
- Chart.js: future candidate once transaction history and price snapshots have enough data to deserve charts.

Current rule: one tool at a time. Add a library only when it directly supports the beta path or removes a recurring source of bugs.

### Post-Beta Architecture Review

After the closed beta produces real workflow feedback, review whether ManaSpec should stay vanilla longer or begin a React/Vite migration.

This is not part of the current beta gate. Treat it as a future architecture decision informed by maintenance pain, state coordination issues, table complexity, Card Detail pressure, and what the project learns from GalleyFlow.

Use [React Migration Notes](REACT_MIGRATION_NOTES.md) and [React Migration And GalleyFlow Pattern Audit](audits/react-migration-galleyflow-audit.md) when this review begins.

Candidate direction if migration is approved:

- Keep the vanilla app as the working reference during migration.
- Use a separate `react-app/` workspace or branch.
- Preserve localStorage keys, backup/import behavior, and beta user data.
- Rebuild the shell and storage boundaries before heavy workflows.
- Port Admin, Radar, and Positions before Dashboard, Signals, and Card Detail.
- Require parity checks before replacing the deployed app.

### Validated Core Singles Workflow

Jason completed enough repeated hands-on testing of the normal singles workflow to close the solo core-loop validation phase.

Validated areas:

- Core-loop smoke testing.
- Radar search and exact-printing selection.
- Adding and managing Radar ideas.
- Buying from Radar into Positions.
- Additional buys from Positions.
- Partial and full sells.
- Plan, target, quantity, and hold editing.
- Card Detail use across the normal workflow.
- Signals, Transactions, History, and Dashboard behavior during normal use.
- General friend-preview workflow validation.

Do not continue treating more solo core-loop testing as a beta gate or recommended next step. Any remaining problems discovered during future feature development or real-user use should be captured and fixed individually as bugs or polish.

### Friend Feedback Review Plan

Use this as a starting point for friend-preview feedback, real-user observations, and focused feature/polish triage. This is no longer a required solo core-loop retest.

Capture notes in this format:

- Area: Dashboard, Radar, Positions, Card Detail, Signals, Transactions, History, Admin, Help, or Overall.
- Type: bug, confusing UX, missing beta feature, data concern, polish, or future idea.
- Severity: blocker, beta-critical, useful, or defer.
- Repro: what you did and what happened.
- Expected: what you thought should happen.
- Thought: any instinct, annoyance, or product idea.

1. Optional workflow reference
   - Search by name in Radar.
   - Search by set number, using examples like `FIN 123`, `FIN #123`, `FIN123`, and `MH3 123`.
   - Add an idea to Radar with planned quantity, hold time, entry target, and optional initial note.
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
   - Add a note from card detail.
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
   - Signals source workflow: View actions now filter/focus exact Radar or Position rows; capture any remaining edge cases as individual bugs or polish.
   - Signals hierarchy: improved with Dashboard-style attention queue rows; capture any remaining why/action clarity issues as focused feedback.
   - Global notifications: toast stack exists; continue minor styling only if beta notes expose issues.
   - Radar search UX: keep active search unified and paper-only until Digital/MTGO pricing is supported.
   - Positions sell confirmation: app-styled confirmation exists; capture quantity-selection friction as focused beta feedback if it appears.

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

- [x] Make Add Card clearly create a Radar idea.
- [x] Keep watched ideas out of Positions.
- [x] Clarify buy, sell, and delete actions.

## Phase 2: Ledger Foundation

Goal: move from direct position mutation toward transaction history.

- [-] Use `docs/README.md` as the implementation guide until the ledger becomes large enough to deserve its own spec.
- [x] Introduce a transaction record shape.
- [x] Add a transaction creation flow for buy/sell.
- [ ] Compute positions from transactions.
- [ ] Preserve current position data during migration.
- [x] Add history view backed by transaction events.

Important rule: long term, positions are computed views. Transactions are the source of truth.

## Phase 3: Radar And Targets

Goal: separate ideas from owned positions and add decision triggers.

- [x] Keep Radar as the explicit home for ideas without ownership.
- [x] Add optional entry targets.
- [x] Add optional exit targets.
- [-] Add target-zone states such as hit, near hit, and stop triggered.
- [x] Keep notes user-authored.

## Phase 4: Signals And Dashboard

Goal: turn tracked data into fast decision awareness.

- [ ] Position movers up/down.
- [ ] Radar movers.
- [x] Target hits and approaching targets.
- [ ] Basic radar signals for price movement and unusual activity when data supports it.
- [x] Dashboard remains a dense scan view, not a marketing page or decorative home screen.

## Phase 5: Persistence Upgrade

Goal: make data portable and safer.

- [x] JSON export/import.
- [x] Backup and restore flow.
- [ ] Optional desktop wrapper later if local file saves become important.

## Future Admin: Owned Spec Backfill

Goal: let users add older owned specs without turning ManaSpec into a collection manager.

- [ ] Build this only after the beta path, export/import, and ledger direction are stable enough to protect user data.
- [ ] Start with a small Admin workflow for manual paste or spreadsheet rows, not a broad collection importer.
- [ ] Import historical/opening transactions first, then create or update Positions from those transactions.
- [ ] Treat Positions as the current holdings view and Transactions as the source of truth.
- [ ] Support exact Scryfall printing matching from card name, set code or set name, collector number, and foil/nonfoil where possible.
- [ ] Preview all matches before saving and allow correction for unresolved or ambiguous printings.
- [ ] Accept practical spreadsheet-style headers such as card name, set code or set name, collector number, foil/nonfoil, quantity, buy date, entry price, acquisition method, notes or thesis, target hold time, and target price.
- [ ] Allow the user to paste cleaned parsed data from GPT or another tool as an early low-build path.
- [ ] Preserve estimates with flags such as `estimatedDate`, `estimatedPrice`, `confidence`, and `sourceNote` instead of pretending uncertain history is exact.
- [ ] Support non-buy acquisition methods over time, including `OPENED`, `TRADE_IN`, `PRIZE`, `PROMO`, `GIFT`, `STORE_CREDIT`, and `CORRECTION`.
- [ ] Keep the workflow scoped to cards with a speculation thesis, exit interest, or finance relevance.

## Future Admin: Lightweight Module Exports

Goal: provide small, focused exports for reporting, sharing, spreadsheet analysis, or personal record keeping.

This is separate from Full Backup. Full Backup is for safety and recovery; module exports are for reporting and portability.

Potential exports:

- [ ] Export Positions Snapshot.
- [ ] Export Radar Watchlist.

Possible future formats:

- JSON first.
- CSV later if useful.

Use cases:

- Review active positions outside ManaSpec.
- Share a watchlist.
- Analyze positions in Excel.
- Create a point-in-time archive of holdings.
- Compare watchlists over time.

Non-goals:

- No partial restore.
- No partial import.
- No merge logic.
- No synchronization.
- No cloud functionality.
- No replacement for Full Backup.

Priority: low. Do not work on this before beta workflow, Signals, Dashboard, Card Detail, or other higher-priority usability improvements.

## Deferred

- Sealed product tracking. Likely source: MTGJSON sealed product data for product identity and TCGplayer links, paired with manual/paste market observations. Keep this behind current friend-feedback and user-facing feature priorities.
- Large collection-style bulk import from spreadsheet or binder rows. A smaller owned-spec backfill path is a future Admin candidate, but it should stay out of core Radar and should create transactions before positions.
- Raw EDHREC deck-count tracking. Current alpha only uses Scryfall `edhrec_rank`; raw deck counts need a reliable external-signal fetch/storage path.
- Advanced prediction.
- Backend service.
- Multi-user sync.
- Automated trading advice.
- Heavy charting before history data exists.
