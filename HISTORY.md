# ManaSpec History

This document reconstructs the project story behind ManaSpec: what the app was trying to become, which milestones changed its direction, and why the current workflow looks the way it does.

It is intentionally different from `CHANGELOG.md`. The changelog records meaningful changes by release or work batch. This history records the larger evolution of the product.

Dates before the Git history are reconstructed from archived notes and release snapshots. Some early dates are estimated.

## Project Origin

### Early May 2026, estimated: from spreadsheet replacement to speculation terminal

ManaSpec started as a local MTG finance tool for replacing scattered speculation spreadsheets with a structured workflow. The earliest surviving product language described a system for finding opportunities, tracking entry and exit plans, recording trades, monitoring price movement, and reviewing outcomes.

The original vision was already narrower than a collection tracker. ManaSpec was meant to support speculative decisions: what to watch, what to buy, what to sell, and what to learn later. The user would own thesis and strategy; the app would organize data and surface context.

The first implementation was a vanilla HTML/CSS/JavaScript app using Scryfall for card and price data and browser localStorage for persistence. Early notes mention Tabulator for the portfolio table, but the app later moved to ManaSpec-native table rendering.

### 2026-05-06: core alpha loop existed

By the 2026-05-06 archived alpha notes, ManaSpec already had the first working core loop:

- Scryfall fuzzy search and printing selection.
- A single `specs` array for tracked cards.
- Buy, sell, delete, average cost, current price, and P/L.
- Cash, invested value, portfolio value, total equity, and summary calculations.
- localStorage persistence for `specs` and `cash`.

The first data model used `qty = 0` as an implicit watchlist. That was practical for getting a working app quickly, but it also became the source of later workflow confusion. The earliest roadmap already called out the need to separate watched ideas from owned positions.

### 2026-05-07: architecture reset

The next major turning point was an architecture reset. Archived notes say the early SPA/routing attempt was too soon and created DOM timing and initialization problems.

The project adopted a more conservative model:

- `index.html` as a static shell.
- `app.js` as lightweight bootstrap and view coordination.
- Modules as workflow components rather than routed pages.
- Summary as global app state, not portfolio-specific UI.
- Search and printings as part of the active trading workflow.

This was the first durable architecture shape that still defines ManaSpec today: a single local terminal with workflow zones instead of a routed web app.

## Early Development

### 2026-05-08 to 2026-05-11: modular foundation

By the 2026-05-11 post-refactor notes, ManaSpec had moved from a large single-file prototype into a modular frontend:

- `storage.js` for localStorage persistence.
- `state.js` for shared runtime state.
- `trading.js` for buy, sell, delete, cash, and position mutation.
- `portfolio.js` for the holdings table.
- `search.js` and `printings.js` for Scryfall discovery and printing selection.
- `summary.js` for account totals.
- `pricing.js` for price refresh.
- `app.js` for orchestration.

This period established the core render loop pattern: state changes, views re-render, and the UI stays explicit rather than hidden behind a framework.

### Mid-May 2026, estimated: broad workflow scaffold

Archived specs from mid-May describe the larger workflow map that ManaSpec was growing toward:

- Dashboard for awareness.
- Portfolio or Positions for owned holdings.
- Watchlists or Radar for ideas before purchase.
- Signals and Targets for decision triggers.
- Thesis for user reasoning.
- History for learning from past actions.
- Card or Position Detail for printing-specific work.

The names changed, but the workflow ideas survived. Watchlists became Radar. Portfolio became Positions in the product language, although some code paths still keep historical `portfolio` names. Thesis was later retired from active navigation, while Notes and Card Detail absorbed the daily reasoning workflow.

### 2026-05-16, estimated: Dashboard and Signals thinking emerged

The 2026-05-16 dashboard notes framed Dashboard as a fast-scanning grid of movers, Radar signals, target hits, approaching targets, and time-based events. The most important idea was that Dashboard should be derived from the same underlying positions, radar, alert, and target data instead of growing its own separate state.

That idea later matured into Dashboard and Signals as attention surfaces over existing workflow data.

## Major Design Shifts

### Collection tracker to speculation terminal

From the earliest notes onward, ManaSpec deliberately rejected the general collection tracker path. That decision became more explicit over time:

- Scryfall provides read-only card, printing, and pricing reference data.
- ManaSpec owns user state: watched ideas, positions, targets, transactions, notes, and market observations.
- Bulk import and collection-like backfill are deferred or framed as owned-spec backfill, not inventory completion.

This kept the app focused on decision support rather than catalog completeness.

### Implicit watchlist to Radar/Positions ownership

The first alpha treated zero-quantity rows as watched ideas. That was simple but ambiguous. By the June beta workflow work, the model had changed:

- Radar owns discovery, exact printing selection, watched ideas, entry planning, and planned quantity.
- Positions owns committed capital, quantity, current value, exit planning, hold tracking, buy more, sell, and delete/correction behavior.
- Buying from Radar creates or updates a Position but keeps the Radar item watched for continued scaling or monitoring.

This ownership split became one of the central product rules.

### Card Detail became the command center

Card Detail was initially closer to a card information/detail surface. During the June workflow reviews it became the canonical planning workspace for one exact tracked printing.

The important shift was ownership: Card Detail does not own a separate plan. It edits the canonical Radar item or Position that opened it. This made Card Detail the place to work on Plan, Market Check, Market Evaluation, Notes, Actions, and reference data without duplicating state.

### Thesis gave way to append-first shared Notes

Early product plans had a Thesis module for conviction, catalysts, and reasoning. Later testing showed that daily workflow revolved more around plan, market check, evaluation, and attention signals than a separate thesis page.

Thesis was retired from active navigation but preserved in code/data for deliberate future handling. Shared Notes became the active memory model:

- Notes are user-authored.
- Notes are keyed to exact tracked printing identity.
- Notes survive buying, selling all copies, and re-buying the same printing.
- Radar, Positions, History, Signals, Transactions, and Card Detail read notes through the same identity model.

### Signals became computed attention

Signals started as a broader alert/target idea and could have become another planning database. The June beta notes clarified the stronger direction: Signals should answer what needs attention, why, and where to go next.

The active Signals workflow became computed and read-only:

- Entry hits from Radar plans.
- Exit hits from Positions plans.
- Approaching targets.
- Missing plans, with Radar and Positions using different missing-plan rules.
- Stale or missing market-check context.
- Navigation/filtering back to exact Radar or Position source rows.

This aligned Signals with the "300 spec problem": the app should reduce a large tracked universe into a manageable set of cards worth reviewing.

### Search split by domain

Early search was primarily Scryfall card discovery. Beta notes exposed that different search boxes should not secretly do different jobs.

ManaSpec now treats search domains separately:

- Card Search for Scryfall discovery and printing selection.
- Local Search for Radar and Positions filtering.
- Transaction Search for ledger/history filtering.
- Future Global Search for routing across workflows.

Radar card search also evolved toward a smarter, paper-only discovery flow that supports exact set-number input.

### Dashboard evolved from summary to daily work queue

Dashboard began as a portfolio awareness concept with movers and charts. Late June work refocused it into a compact daily triage view: what should be inspected first today?

Its current action tiles summarize Exit Hits, Entry Hits, near targets, market checks, hold reviews, missing plans, and recent notes. Dashboard shares attention queue language with Signals, but Dashboard is the starting scan surface while Signals is the deeper computed attention table.

### Complexity was repeatedly deferred

Several attractive features were deliberately postponed:

- Full ledger-source-of-truth migration.
- IndexedDB, database, backend, or desktop wrapper.
- ES modules and formal routing.
- Heavy charting.
- Sealed product tracking.
- Large import workflows.
- Raw EDHREC deck counts and automated external market scraping.

The recurring reasoning was that workflow clarity and user data safety should come before infrastructure complexity.

## Workflow Evolution

### 2026-06-09: Git checkpoint workflow began

Formal Git history begins on 2026-06-09 with the initial ManaSpec project checkpoint and a documented Git checkpoint workflow. Before that, the project relied on notes, snapshots, and local file history. After this point, commits became part of project memory.

### 2026-06-10 to 2026-06-11: beta workflow testing started

The first beta notes captured important product friction:

- Radar buy needed planned quantity.
- Radar should keep watched items after purchase.
- Entry, exit, and hold ownership was unclear.
- Signals needed to explain why items appeared.
- Signals should route to exact source rows.
- Save feedback should not move the layout.

The 2026-06-11 beta direction review reframed the project: the question was no longer whether ManaSpec could track a spec, but how it could help a user manage many specs without missing opportunities.

### Mid-June 2026: documentation became first-class

As workflow ownership sharpened, documentation became part of implementation rather than an afterthought. Active docs under `docs/` became the current source of truth, while `dev notes/` became project memory and brainstorming.

Important process pieces appeared:

- `docs/ROADMAP.md` for phase and beta gates.
- `docs/DECISIONS.md` for durable rationale.
- `docs/WORKFLOW.md` for contribution and AI collaboration rules.
- `CHANGELOG.md` for meaningful human-readable change history.
- Later, `PRODUCT_PRINCIPLES.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, and `STYLE_GUIDE.md` split durable product, architecture, entity, and UI knowledge out of the main docs.

This was especially important because ManaSpec was being developed with AI assistance. The repo needed enough memory that future sessions could orient from files instead of relying on chat history.

### 2026-06-21: architecture audit

The architecture audit concluded that ManaSpec was stable enough for beta workflow refinement, but highlighted pressure points:

- Card Detail was valuable but dense.
- Search mixed active Radar discovery with generic Scryfall and future backfill concerns.
- Table workflows shared a renderer but repeated local glue.
- Formatting and parsing helpers were scattered.
- The ledger migration needed a written plan before data ownership changed.

The audit recommended surgical cleanup after workflow stability rather than a broad rewrite.

### Late June 2026: browser QA, table contracts, and repo snapshots

Late June work added guardrails around how the project is tested and maintained:

- Browser QA should use localhost rather than `file://`.
- Dense table changes must be verified across Radar, Positions, Signals, Transactions, and History.
- Repeated UI issues should trigger root-cause diagnosis instead of endless small adjustments.
- A repository snapshot generator was added and then enriched to help Codex/GPT orient quickly.
- A Codex friction log captured recurring tool and workflow snags.

These changes made the project easier for future contributors and future AI sessions to pick up safely.

## Beta Readiness

ManaSpec gradually moved from early prototype to alpha friend-preview through a set of maturity milestones:

- Exact printing search and selection through Scryfall.
- Separate Radar and Positions lifecycle states.
- Planned quantity and entry target before purchase.
- Exit target and hold-time tracking after purchase.
- Buy/sell transaction logging and early ledger views.
- History preserving trades, Radar additions, notes, and outcomes.
- Shared Notes keyed by printing identity.
- Card Detail command center for plan, market check, evaluation, notes, and reference data.
- Signals as computed attention with source navigation.
- Dashboard as a daily triage queue.
- Admin JSON backup and restore for localStorage data safety.
- Contextual Help.
- Shared table rendering, module context bands, toast notices, app-styled confirmations, and laptop-first density improvements.
- Active documentation, decisions, audits, changelog, and workflow rules.

By the end of June 2026, the project was labeled `v0.9.0-alpha.1` friend preview rather than formal beta. The distinction mattered: ManaSpec was stable enough for a trusted handoff, while smoke testing, Signals source validation, Card Detail entry validation, and a ledger migration plan remained visible gates.

Jason later completed enough repeated hands-on testing of the normal singles workflow to close the solo core-loop validation phase. Radar search and exact-printing selection, Radar idea management, buying into Positions, additional buys, partial and full sells, plan/target/quantity/hold editing, Card Detail use, and Dashboard/Signals/Transactions/History behavior all moved from "needs another solo pass" into validated friend-preview territory.

## July 2026: React modernization became an implementation

The React modernization work began as an isolated evidence-gathering spike. The team first audited the copied GalleyFlow package archive, kept `/lib/` as an ignored offline cache, selected React 19, React DOM, Vite 8, and React Router as the foundation, and documented portable and Pages-subpath constraints before treating any package as adopted.

The implementation strategy deliberately established a full recognizable React baseline before replacing several subsystems with libraries. That made it possible to distinguish migration defects from table, search, chart, or date-library integration defects. The result reconstructed all seven primary routes, the shared shell, compatible browser state, workflows, normal and Pages outputs, and a directly openable portable build.

The first broad UI pass made the React app recognizably ManaSpec. A subsequent parity correction restored the established dense-table rhythm, separated card identity columns, made row bodies open Card Detail without allowing controls to trigger the row, and returned Card Detail to a compact working-panel shape. Jason's directional review placed the interface at roughly 80-90% of the familiar vanilla experience. That number is a practical review signal, not a formal parity score.

React therefore moved from a merely proposed experiment into active implementation and stabilization, and it is the likely path forward. The next phase closes remaining workflow, UI, responsive, accessibility, data cross-write, and deployment-source gaps, then evaluates the table system, Fuse.js, Chart.js, and Day.js against the working application rather than a toy shell.

On 2026-07-18, the table evaluation produced the first adopted feature-library foundation. Tabulator 6.5.2 was placed behind a ManaSpec-owned React wrapper and Radar became the only Phase 1 pilot. The implementation registered only the grid modules ManaSpec uses, preserved React ownership of cell content and state callbacks, restored vanilla-aligned Radar fields and compact interactions, and left Positions, Signals, Transactions, and History intentionally unchanged for a later configuration-led Phase 2 migration.

On 2026-07-27, the Radar pilot was reviewed side-by-side against vanilla and the shared boundary was affirmed. Grid lifecycle, pagination, sort accessibility, compact geometry, indicators, and action presentation belong in the wrapper; route-specific filters, columns, editors, and business workflows remain outside it. The same pass aligned the React shell navigation and global Search treatment, restored Radar's complete local filter contract, and removed React-only decoration that weakened parity. Positions became the next deliberate consumer of the approved foundation.

On 2026-07-29, PR #9 merged the canonical Positions migration and shared table/app-shell parity work into the React integration branch. Positions became the first completed Phase 2 consumer without reopening its business logic, and Radar and Positions now share the vanilla-verified compact grid foundation. A final accessibility check confirmed that moving sort focus between columns leaves `aria-sort` active on exactly one header, so the wrapper required no compensating state cleanup. Issues #8 and #10 closed with this milestone; Signals, Transactions, and History remain separately bounded future migrations.

On 2026-08-02, Issue #11 completed that table adoption arc. Signals, Transactions, and History moved to the same shared wrapper in separate route commits, then a final acceptance correction restored their compact route-owned controls and aligned all five table routes on one desktop context rhythm. Signals retained its three-preview attention tiles inside a controlled band, and the interim React table implementation was removed after losing its final consumer. React now has one real table system across the application rather than a pilot living beside temporary production-route tables.

This milestone did not promote React to production. Vanilla remains the behavioral oracle, current production/beta frontend, rollback path, and compatibility reference until a separate evidence-based promotion decision. The tracked `react-spike/` artifact exists, but the actual GitHub Pages publishing source must be confirmed before treating every new branch artifact as publicly deployed.

## 2026-08-07: Issue #15 expanded React into an alpha candidate

Issue #15 deliberately combined product work, dependency decisions, responsive hierarchy, parity correction, and release evidence. The React Dashboard gained an honest eight-metric Portfolio Summary; Price History moved to a focused Chart.js integration with sparse-date semantics and plan references; and the app shell gained categorized saved-data search without adopting Fuse.js. A final UI pass removed artificial Signals clipping, corrected Help focus behavior, and made exact-printing actions accessible across event routes.

The desktop hierarchy also changed deliberately. The 1920 x 1080 canvas became the primary product target and uses a 1760px work surface for complete metrics and dense workflows. The 1366 x 768 layout remains a required compatibility target that compresses rather than merely scaling the larger layout down.

This work changed the React description from speculative spike to controlled-alpha candidate, not to canonical frontend. Public Pages publishing ownership, representative React-written record reads in vanilla, and an approved cutover/rollback decision remain explicit promotion gates.

## 2026-08-18: Issue #16 made sealed a real React workflow

Jason deliberately overrode the roadmap's sealed deferral to mix forward product work into the React foundation phase and support a prospective sealed-focused tester. The implementation resisted the tempting fake-card shortcut: MTGJSON UUID became the exact product identity, sealed state received additive Radar/Positions/Transaction stores, and the existing route chain now carries booster boxes, packs, bundles, decks, and Secret Lair products through research, ownership, partial/full exits, and review.

The pricing investigation shaped the product. MTGJSON's official daily price artifact covered card UUIDs but not the representative sealed UUIDs checked for the issue, while its TCGplayer identifiers and links resolved exact products. ManaSpec therefore ships honest manual sealed valuation: a product begins unpriced, cost basis is never presented as market value, and marked value/P&L appear only after a timestamped user check. Existing singles storage and vanilla behavior remain unchanged.

## Current State (2026-08-18)

ManaSpec is a local-first MTG speculation workflow and positions terminal with an authoritative vanilla frontend and a forward React candidate. Scryfall remains the singles identity/price source; React additionally bundles MTGJSON sealed product identity and uses localStorage for additive user-owned state.

ManaSpec now has two intentionally distinguished implementations. The vanilla root is the authoritative production/beta app with Dashboard, Radar, Positions, Signals, Transactions, History, Admin, Card Detail, shared Notes, contextual Help, and JSON backup/restore. The React workspace reproduces that full application shape, includes the Issue #15 product-expansion work and Issue #16 sealed vertical slice, and is ready for controlled alpha use as the likely forward frontend.

The product center of gravity remains unchanged: ManaSpec organizes speculation workflow and attention while the user owns strategy and decisions. React must preserve that product contract and the vanilla data model while earning promotion through parity, compatibility, delivery, and maintainability evidence.

The main remaining priorities before broader beta are:

- Capture friend-preview and real-user feedback as focused bugs, polish, or feature candidates.
- Exercise the new sealed workflow with the interested tester and capture product/data feedback without weakening singles compatibility.
- Write the ledger migration plan before making Transactions the ownership source of truth.
- Continue tightening labels, empty states, table scan behavior, confirmations, and Help.
- Keep data safety and backup/restore stable through every model change.

The project has not finished its data-model migration, and it should not pretend otherwise. But it has crossed the important product threshold: it is no longer just a tracker prototype, and the solo core-loop testing phase should not be reopened for every future bug. It is a coherent speculation workflow system moving carefully toward beta through friend feedback and focused user-facing improvements.
