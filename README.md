# ManaSpec

ManaSpec is an MTG speculation workflow and portfolio terminal.

It is built with vanilla HTML, CSS, JavaScript, Tabulator, Scryfall API data, and localStorage persistence. The app is intended for tracking speculative ideas, watched cards, positions, prices, targets, and trading outcomes without turning into a general collection tracker.

## Current Status

ManaSpec is in alpha. The app now has a modular terminal shell with navigation buttons for Dashboard, Portfolio, Watchlists, Signals, Thesis, and History. Portfolio is the active working module, with separated Scryfall search, printing selection, Tabulator holdings, basic buy/sell actions, price refresh, and summary totals.

The active project docs now live in [docs/README.md](docs/README.md). Raw daily notes live in `dev notes/inbox/`, and older historical notes live in `dev notes/archive/`.

## Working Rule

Before changing code, read the relevant active spec in `docs/`. The `dev notes/` folder is project memory and brainstorming, not the current truth.
