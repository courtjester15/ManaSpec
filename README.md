# ManaSpec

ManaSpec is an MTG finance speculation workflow terminal.

## What Is ManaSpec?

ManaSpec is a local-first workflow simulator and decision-support tool for MTG finance.

It helps organize the process of researching, tracking, buying, managing, reviewing, and learning from MTG speculation ideas. The goal is to replace scattered spreadsheets with a structured workflow for watched cards, owned positions, targets, notes, market checks, transactions, and review history.

ManaSpec is intentionally workflow-focused rather than automation-focused. It helps users keep context, inspect exact printings, and make better-organized decisions. The user still owns every investment decision.

## Current Status

ManaSpec is currently `v0.9.0-alpha.1` in Friend Preview / Closed Beta preparation.

The React modernization implementation has completed Issue #15 expansion/parity checkpoints and Issue #16's sealed-product speculation vertical slice. It is ready for controlled alpha use with the full route shape, compatible singles data, additive sealed state, portable local use, and a separate Pages artifact. React is the likely forward project path, but the current vanilla app remains the canonical production/beta and behavioral source of truth until release controls and a separate promotion decision are complete.

The Data Ownership and Storage Readiness Audit and its three approved foundation batches are complete. The app now has compatibility-safe core persistence boundaries, explicit schema/migration readiness, read-only reconciliation reporting, and protection against Position deletion leaving open transaction history. Planned user-facing feature work can resume; making Transactions authoritative remains a separate future migration.

The authoritative beta app is built with vanilla HTML, CSS, and JavaScript. An implemented React 19 + Vite 8 reconstruction lives under `react-app/` and is delivered through normal, Pages-subpath, and portable builds. Both use Scryfall API data for single-card identity/pricing and compatible browser `localStorage` records. React additionally bundles a trimmed MTGJSON sealed catalog with exact TCGplayer product links.

The current app has a modular terminal shell with Dashboard, Radar, Positions, Signals, Transactions, History, and Admin views. Radar and Positions are the active singles workflow: Scryfall search and exact printing selection feed Radar, Radar captures planning fields and optional notes, Radar can buy planned quantities into Positions through an execution-only quantity/price/note dialog, and Positions supports owned holdings, buy/sell actions, price refresh, target/hold tracking, shared notes, and summary totals.

The React candidate also supports sealed products end to end across the same route chain. MTGJSON UUID is the exact identity; products begin unpriced and require timestamped manual market checks because the verified official MTGJSON price artifact did not cover sealed UUIDs. Buy price is never substituted for market value, and unpriced holdings are excluded from marked value and P/L.

Radar and Positions also expose local exact-printing price history. History begins when ManaSpec records successful Scryfall refreshes, keeps foil and nonfoil separate, and offers 7D, 30D, 90D, 6M, 1Y, and All views with plan reference lines. ManaSpec does not fetch earlier external history or invent missing daily observations.

Card Detail is a compact command center with primary plan editing, market check context, notes, and reference data. Signals explains why cards need attention, Transactions shows buy/sell context, and Admin includes local data-safety tools such as backup export/import and cash reset.

## Current Limitations

ManaSpec currently:

- Cannot purchase cards.
- Does not connect to marketplaces for buying or selling.
- Does not scrape TCGplayer.
- Uses Scryfall for card identity and pricing reference.
- Uses manual Market Checks for richer market observations.
- Stores data locally in the user's browser.
- Is moving from validated solo core-loop testing into friend feedback and additional user-facing features.

## Project Philosophy

ManaSpec values workflow over visual polish, correct workflow before more features, and small incremental improvements over large rewrites.

The app is local-first because user data ownership matters. ManaSpec can organize a decision loop, but it should not make investment decisions for the user.

## Who ManaSpec Is For

ManaSpec may be a good fit for:

- MTG finance users.
- Long-term speculators.
- Users managing dozens or hundreds of active specs.
- Users who currently rely on spreadsheets.

ManaSpec is not designed for:

- Collection management.
- Deck building.
- General inventory tracking.
- Marketplace automation.

## Open Source

Feedback and bug reports are welcome. Small, focused pull requests are preferred, especially for documentation, workflow polish, dense table fixes, and clear bug fixes.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Project Docs

The active project docs now live in [docs/README.md](docs/README.md). Meaningful project changes are summarized in [CHANGELOG.md](CHANGELOG.md), and the broader project story is reconstructed in [HISTORY.md](HISTORY.md). Raw daily notes live in `dev notes/inbox/`, and older historical notes live in `dev notes/archive/`.

Closed beta deployment instructions live in [docs/BETA_DEPLOYMENT.md](docs/BETA_DEPLOYMENT.md). The beta path keeps the current vanilla app on GitHub Pages and preserves localStorage-backed browser data.

The React implementation is governed by [docs/REACT_MIGRATION_NOTES.md](docs/REACT_MIGRATION_NOTES.md), with its implemented architecture in [docs/REACT_SPIKE_ARCHITECTURE.md](docs/REACT_SPIKE_ARCHITECTURE.md), dependency decisions in [docs/LIBRARIES.md](docs/LIBRARIES.md), progress evidence in [docs/REACT_SPIKE_PROGRESS.md](docs/REACT_SPIKE_PROGRESS.md), and dual-delivery model in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). It is an alpha-readiness candidate rather than the promoted canonical frontend.

## Working Rule

Before changing code, read the relevant active spec in `docs/`. The `dev notes/` folder is project memory and brainstorming, not the current truth.
