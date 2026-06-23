# ManaSpec

ManaSpec is an MTG speculation workflow and positions terminal.

It is built with vanilla HTML, CSS, JavaScript, Scryfall API data, and localStorage persistence. The app is intended for tracking speculative ideas, Radar candidates, owned positions, prices, targets, shared card notes, and trading outcomes without turning into a general collection tracker.

## Current Status

ManaSpec is in alpha. The app has a modular terminal shell with navigation buttons for Dashboard, Radar, Positions, Signals, Transactions, History, and Admin. Radar and Positions are the active singles workflow: Scryfall search and exact printing selection feed Radar, Radar can capture plan fields and optional initial notes, Radar can buy planned quantities into Positions, and Positions supports owned holdings, buy/sell actions, price refresh, target/hold tracking, shared notes, and summary totals. Card Detail plan edits save on Enter or click-away, Signals rows explain why they need attention, Transactions show balance and SELL realized P/L context, and Admin cash reset requires confirmation.

The active project docs now live in [docs/README.md](docs/README.md). Raw daily notes live in `dev notes/inbox/`, and older historical notes live in `dev notes/archive/`.

## Working Rule

Before changing code, read the relevant active spec in `docs/`. The `dev notes/` folder is project memory and brainstorming, not the current truth.
