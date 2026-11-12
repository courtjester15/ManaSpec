# React market / exit / workflow sprint — 2026-11-11

Contracts: [#36](https://github.com/courtjester15/ManaSpec/issues/36), [#43](https://github.com/courtjester15/ManaSpec/issues/43), [#30](https://github.com/courtjester15/ManaSpec/issues/30), in that implementation order. Base is PR #38 head `e72e814c5f20e3bb82f0cd3649da9ef9e827d7c1`; its full ancestry is retained. One integrated dependent PR is appropriate because exact-asset detail, research storage and trade handoff are shared. Separate commits retain coherent review checkpoints. No merge, deployment, promotion, owner-origin writes or storage migration.

## Implemented workflows

- **Market evidence:** exact printing + finish or sealed product; manual Market and relevant NM listing; explicit unknowns, source URL, observed time, confidence, optional observed seller/listing counts and notes. Shows stale checks, conflicting reference warning, listing-minus-market spread, discrete observed ranges, thesis/reprint assessment, release-review date, hold age and available Scryfall EDHREC rank (never deck counts). Evidence history is cached locally and explicitly not continuous price history or executable proceeds.
- **Premium comparison:** same-card recent Scryfall printings retain exact finish and source links, release dates, reference prices and comparability caveats. Expand a printing to save its own dated Market/listing evidence. No foil/nonfoil multiplier ranking. Comparison research is preserved even if the printing is not watched yet. Existing Price History remains available.
- **Signals:** existing target/stale-plan queues remain. Evidence Review adds significant observed change (10% threshold), due release review and unusually large observed listing/Market spread (25%), with exact plan/detail navigation. Exit offers cannot refresh a market check or become marked prices.
- **Compare exits:** from a Position row or owned asset detail, compare up to three routes at a partial/full quantity. Each route carries asking price versus known offer, condition, validity quantity, source/time/expiry, confidence, cash versus credit, optional percentage fee and batch-level itemized costs. Shared #28 cent allocation/calculator supplies gross, net, per-copy net, basis, profit/return and cent-rounded break-even. Blank costs remain explicitly unconfirmed/excluded, not verified free shipping.
- **Research to sale:** save comparison assumptions without changing holdings, cash or transactions; reopen against current owned basis. Selected cash terms prefill #28 sale confirmation and its receipt. Store credit is a face-value comparison, never automatically booked as cash. Quotes are never listings, bids or automated recommendations.
- **Beginner/pro:** optional thesis note and direct “Watch & record buy” during exact-printing selection; recoverable watch form on save failure; guided empty states; 9-column Essentials defaults for Radar and Positions, optional Plan / Research or Performance / All Columns views. Existing filters, pagination, in-cell plan edits, full detail and all columns remain available. Positions has direct Compare exits; low-frequency Delete is in All Columns. Detail resolves live canonical rows after edits/trades.

## Benchmarks and provider boundary

Reviewed official public screens/documentation, not private account screens or screenshot replicas:

- [MTGStocks Interests](https://www.mtgstocks.com/interests): distinct regular/foil/Market variants plus release/format filters. Applied the distinction between listing and Market and the need for release/finish context. Its public dynamic results did not load in text extraction; no live-price claims derive from them.
- [EchoMTG plans](https://www.echomtg.com/plans/) and [FAQ](https://www.echomtg.com/help/faqs/): inventory, price intelligence, condition and collection workflow. Applied research beside exact owned/watched assets, rather than a separate recommendation feed. Dashboard text extraction was unavailable.
- [Portfolio Performance buy/sell](https://help.portfolio-performance.info/en/reference/transaction/buy-sell/) and [trades](https://help.portfolio-performance.info/en/reference/view/reports/performance/trades/): explicit fees/taxes, net transaction value and allocated partial-trade costs. Applied visible gross/net/basis separation using ManaSpec's existing weighted-basis policy, not a new accounting method.
- [TCGplayer getting started](https://docs.tcgplayer.com/docs/getting-started) still states no new API access. No scraper, unofficial proxy/feed, credentials, paid integration or purported live buylist was added. Manual timestamped evidence is the complete first slice.

## Observed validation

- `npm test`: **119 passed**, including inherited storage, finish-policy, Signals, quote and #28 trade/reversal coverage.
- Added market, exit and sprint workflow suites: exact foil/nonfoil/etched separation; genuine zero versus missing; very stale manual quote, unavailable NM, new bonus-sheet metadata, unpriced sealed; 24-copy buylist; expiry/quantity limits; fee rounding and unknown basis; backup/reload/restore; failure paths and existing atomic rollback tests.
- $10 case: buy $10 + $1 postage + $0.80 tax = **$11.80 basis**. Exit $12 − $2 postage − $1.80 fees = **$8.20 net**, **−$3.60 realized**. Sale, backup restore and linked reversal retain exact basis and watched item.
- $500 case: 100-position synthetic portfolio; selected foil has 3 copies/$1,500 basis. Sell 1 at $620 − 12.5% fee − $10 postage − $1.50 supplies = **$531 net**, **$31 profit**, **2 copies/$1,000 residual basis**. Export/import retains portfolio summary and 100 derived signal rows.
- `node tools/check-sprint-render.mjs`: actual React static rendering passes for all seven populated route shells, empty Radar/Positions, unavailable evidence, exit form and prefilled $531 receipt. This is render/error evidence, not interactive browser evidence.
- Vanilla storage-boundary, position-valuation and finish-correction scripts plus rollback-guard syntax passed; the emitted 503 messages are intentional failed-fetch fixtures.
- Source/format checks and normal, Pages, portable, canonical builds passed. Pages manifest verifies all **17 files**. Generated artifacts are regenerated by scripts, never hand-edited. Generated vendor whitespace is left untouched; source/docs diff checks are clean. Existing large-bundle and portable IIFE `import.meta`/inline-dynamic-import warnings remain; direct-file runtime acceptance is not claimed.
- Rollback guard now refuses typed market/exit research as well as true-cost/sealed data; synthetic no-write guard tests pass. Existing research-free legacy market checks still permit guarded vanilla startup.

## Browser blocker and explicit unverified surfaces

The Codex in-app browser repeatedly timed out creating a tab (`js execution timed out; kernel reset`). A Vite preview was moved out of the network sandbox to `http://127.0.0.1:5175/`; a host `curl --noproxy '*' -I` returned **HTTP 200**. One clean new in-app tab against that healthy host preview also timed out. No desktop, native automation or external-browser fallback was used. Earlier sandbox-loopback requests were inaccessible, so they do not certify the host preview.

**Not passed:** interactive fresh-account search/finish/note/buy flow; mouse and keyboard Enter/Escape/Tab/focus return; destructive cancel focus; mobile layout; 1366×768 and 1920×1080 screenshots/overflow/row geometry; live Tabulator editing/actions across Radar, Positions, Signals, Transactions and History; browser console/network; direct portable file opening; hosted portable/Pages route navigation. Responsive CSS and static rendering are implementation evidence only. No screenshots were available to inspect or claim. #27/#38 proof and review gates remain open.

## Remaining work / acceptance

Keep all three Issues open pending the interactive acceptance above. #36 can later expand beyond same-card comparables only with an explicit user-authored demand rationale; no format-demand inference or provider integration ships here. No CSV intake, licensed feed, live buylist, measured sell-through, automatic rank or investment advice. Historical ranges remain sparse saved checks.

#43 uses user-entered route assumptions; no guaranteed marketplace presets. Percentage fees apply to item gross, with fixed adjustments for route-specific shipping/tax rules. Costs are allocated once per selected batch; they must be reviewed again when batch quantity changes. Actual store-credit transactions require separate cash/credit accounting scope; cash-only confirmation remains intentionally enforced.

#30 table views are per mounted session, not persisted preferences/saved filters. Essentials reduces visible columns from **17 Radar / 20 Positions** to **9 / 9**. After choosing a printing, the direct-buy path removes the separate trip back to a Radar row's Buy button; note/target entry stays in the same dialog. These are source-level task-path comparisons, not measured user timings. Full browser/self-visual acceptance remains outstanding.

## Exact review entry points

From this checkout: `cd react-app`, `npm ci`, `npm run dev -- --port 5175 --strictPort`. Open `http://127.0.0.1:5175/#/radar` in the in-app browser using an empty or synthetic origin. Existing running preview uses this isolated sprint checkout, not the user's dirty #38 checkout.

1. **Radar → search → exact printing/finish:** optional note/target, Watch or Watch & record buy. Inspect actual all-in cost in confirmation.
2. **Any Radar/Position row → detail → Market evidence → Add observation.** Comparable Printings → expand exact finish → save that printing's evidence. Signals → Evidence Review → View returns to its exact plan/detail.
3. **Positions → Compare exits** (or owned detail → Compare exits). Enter quantity and routes; expand Fees and Source details. Save research, close/reopen, choose Record actual cash sale, inspect the prefilled confirmation, then the Transactions receipt.
4. **Table view** above Radar/Positions switches Essentials / Plan / Research or Performance / All Columns. Inspect keyboard, both desktop resolutions, phone and sibling tables before accepting UI.

For the generated Pages build, run `npm run preview -- --mode pages --port 4175 --strictPort` in `react-app/`, then open `http://127.0.0.1:4175/ManaSpec/react-spike/#/radar`. This preserves the actual Pages asset base. Portable entry: `react-app/dist-portable/index.html` (direct-file browser proof still required). No public deployed preview of this branch is implied.
