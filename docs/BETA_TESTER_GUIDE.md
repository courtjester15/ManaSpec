# ManaSpec Beta Tester Guide

Thanks for helping test ManaSpec.

ManaSpec is a local-first MTG finance/speculation workflow simulator. It helps organize watched ideas, owned positions, targets, notes, market checks, transactions, and review history. It does not buy or sell cards, connect to marketplaces, scrape TCGplayer, or make investment decisions.

## Beta URL

Use the same GitHub Pages URL every time:

```text
https://courtjester15.github.io/ManaSpec/
```

Your ManaSpec data is stored in your own browser on your own device. It does not sync across browsers, profiles, computers, or phones.

## Before Testing

1. Open ManaSpec from the beta URL.
2. Go to Admin.
3. Use Data Safety -> Export Backup.
4. Keep the downloaded JSON somewhere safe.

Export another backup before testing a major update, importing data, or doing a long session.

## What To Test

Useful beta feedback includes:

- Search for a card.
- Add an exact printing to Radar.
- Set an entry target or planned quantity.
- Buy from Radar into Positions.
- Edit a plan from Card Detail.
- Add a note.
- Add a manual Market Check.
- Sell or adjust a test Position.
- Review Dashboard, Signals, Transactions, and History.
- Export and import a backup.

## What To Report

Please send:

- What you were trying to do.
- What happened.
- What you expected.
- The browser and device you used.
- Any visible error message.
- Screenshots if they help.

Reports are most useful when they include reproduction steps, even if they are short.

## Data Safety

ManaSpec stores data in browser `localStorage`.

Your data should survive normal app updates if you keep using the same beta URL and do not clear site data. Your data can be lost if you clear browser site data, use a different browser/profile/device, or switch to a different URL origin.

If something looks wrong after an update:

1. Stop testing.
2. Export the current state if possible.
3. Restore your last known-good backup from Admin -> Data Safety.

## Privacy And Access

The GitHub Pages beta URL is public static hosting. Treat the link as a trusted-tester handoff, not private access control.

ManaSpec is currently a local simulation tool. User-entered notes, positions, targets, and market checks stay in that browser's local storage unless you export or share a backup file.

## Known Limits

- ManaSpec cannot purchase cards.
- ManaSpec does not connect to marketplaces for buying or selling.
- ManaSpec does not scrape TCGplayer.
- Scryfall-backed search and price refresh require network access.
- Market Checks are manual observations pasted by the user.
- The solo core singles workflow has been validated; remaining feedback should be reported as focused bugs, polish, or feature requests.
