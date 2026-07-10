# 2026-07-05 Friend Test Notes 01

Source: attached pasted beta polish batch.

Goal: tighten first friend-test polish without expanding scope.

Implemented focus:

- Radar Add dialog wording and alignment: use `Qty Wanted`, show Entry Target as a money field, and keep Hold Duration visually tied to planning.
- Radar planned quantity controls: improve `+/-` hit area while preserving dense row height.
- Buy from Radar: make the dialog execution-only with quantity purchased, buy price, and optional note. Planning remains in Radar, Positions, or Card Detail.
- Market Check parsing: handle finish-specific or single-available TCGplayer values for foil-only/nonfoil-only printings without guessing when data is ambiguous.
- Positions table: surface latest manual TCGplayer Market Check in the Scryfall price tooltip instead of adding a wide column.
- App shell and toast polish: balance toolbar tab sizing and align toast dismiss actions.

Deferred or watch:

- Re-evaluate visible Positions market-check columns only if hover/title access is not enough in beta usage.
- Continue validating table width and row rhythm at laptop width during smoke testing.
