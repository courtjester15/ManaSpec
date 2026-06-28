# ManaSpec Style Guide

This document defines ManaSpec's visual language, naming, terminology, and interface standards.

It is not a CSS reference. Use it to keep the app feeling like one product while the implementation evolves.

## Interface Philosophy

ManaSpec is a dense trading terminal, not a marketing site or collection gallery.

Design priorities:

- Workflow over aesthetics.
- Compact over decorative.
- Laptop-first over spacious desktop-only layouts.
- Scan surfaces over explanatory panels.
- Display-first editing over always-visible forms.
- Exact printing clarity over broad card nostalgia.
- User-authored judgment over app-generated recommendations.

The interface should feel focused, quiet, and operational. It should help the user notice what matters, move between workflows, and update plans without losing context.

## Terminology

Use these terms consistently in UI copy, docs, and future implementation names when practical.

- **Card**: a general MTG card identity.
- **Printing**: a specific version of a card, including set, collector number, finish, and Scryfall identity.
- **Position**: an owned holding after money has been committed.
- **Radar Item**: a watched idea before purchase, or a card still being monitored for scaling.
- **Signal**: an attention item derived from local plan, price, target, or saved signal data.
- **Market Check**: a user-saved review of current market data, usually pasted from TCGplayer Price Points.
- **Card Detail**: the command center for one exact tracked printing.
- **Module Context Band**: the compact summary/action band above workflow filters and tables.
- **Transaction**: a buy, sell, correction, backfill, or future acquisition/disposition event.
- **History**: a review trail, not a separate source of truth.
- **Tile**: a Dashboard, metric, info, action queue, or context summary block.

Avoid:

- Calling Positions "portfolio" in user-facing UI.
- Calling Radar Items "positions" before purchase.
- Using "card modal", "detail modal", and "card drawer" interchangeably in docs. Use Card Detail unless referring to implementation.
- Using "alert" when the item is really a Signal.
- Using "recommendation" for app output. ManaSpec surfaces data; the user decides.

## Naming Rules

User-facing labels should be short, concrete, and workflow-specific.

Preferred:

- Positions
- Radar
- Signals
- Transactions
- History
- Market Check
- Entry Target
- Exit Target
- Hold
- Planned Qty
- Current Price
- Target Delta

Avoid vague labels such as:

- Item
- Thing
- Object
- Data
- Info
- Details, when a more specific label fits.

Implementation may still contain older `portfolio` names where renaming would create risk. User-facing language should continue moving toward Positions.

## Typography

ManaSpec uses compact UI typography.

Rules:

- Keep dense table text small enough to scan but large enough to read on a laptop.
- Use stronger type weight for values that drive action.
- Use muted text for secondary context, not primary values.
- Avoid oversized headings inside compact modules.
- Do not use decorative type treatments.
- Monospace is appropriate for set codes, collector numbers, compact identities, and technical/debug-like values when it improves scanability.

Headings should orient the user without consuming excessive vertical space.

## Spacing

Spacing should preserve a compact terminal rhythm.

Rules:

- Prefer tight vertical spacing in workflow tables, filters, rows, and context bands.
- Preserve enough spacing that buttons, editable controls, and inputs are easy to target.
- Avoid large hero-like gaps inside app workflows.
- Avoid nesting cards inside cards.
- Use compact panels only when they frame a real tool, repeated item, modal, or focused summary.

The app should fit meaningful workflow information on a normal laptop viewport without feeling cramped.

## Dashboard Tiles

Dashboard is a daily work queue, not a duplicate Positions page or decorative home screen.

Rules:

- Keep the top Dashboard state tiles compact so action tiles have room on laptop screens.
- Prefer actionable workflow queues over passive database counts.
- Dashboard action tiles should make the reason and source clear before the user opens Detail or jumps to Radar or Positions.
- Do not use placeholder labels for unsupported concepts such as downside or stop tracking.
- Preserve a little left/right padding inside queue rows so dense text does not feel jammed against tile borders.

## Colors

Use tokens from `css/base.css` before adding raw colors.

Current color language:

- Dark background for the app shell.
- Slightly raised surfaces for panels and dense controls.
- Muted gray-blue text for secondary context.
- Light text for primary values.
- Cyan accent for active/focused/linked UI.
- Green for favorable values.
- Red for unfavorable or dangerous values.
- Yellow for warnings or review-needed states.

Rules:

- Do not introduce one-off colors unless a new semantic state earns one.
- Do not use color as the only signal for important meaning.
- Keep financial gain/loss colors consistent across modules.
- Warning and destructive actions should be visibly distinct.
- Avoid decorative gradients, glows, or ornamental color effects.

## Tables

Tables are ManaSpec's primary scan surface.

Table rules:

- Keep rows compact and stable.
- Keep headers aligned with data.
- Keep numeric and money values right-aligned or money-aligned.
- Keep actions visually grouped and aligned.
- Keep sortable headers short.
- Use shared table rendering unless the workflow truly needs a custom layout.
- Treat table CSS or renderer changes as app-wide changes.

Dense tables should be readable at approximately 1366px laptop width.

## Wrapping Rules

Dense scan surfaces should preserve single-line rhythm.

Do not wrap:

- Prices.
- Dates.
- Set codes.
- Collector numbers.
- Finish labels.
- Quantities.
- Percentages.
- Header labels.
- Row actions.
- Compact status pills.

Wrapping is allowed in:

- Help text.
- Notes.
- Modal body copy.
- Oracle text.
- Market explanations.
- Longer review/detail surfaces.

When dense content overflows, solve it in this order:

1. Widen the container.
2. Reallocate columns.
3. Shorten headers.
4. Reduce padding.
5. Slightly reduce font size.
6. Use ellipsis for long recoverable text only.

## Ellipsis Policy

Ellipsis is acceptable for:

- Long card names when the full value is available through title, detail, or Card Detail.
- Set names.
- Note previews.
- Long user-authored snippets in scan rows.

Ellipsis is not appropriate for:

- Prices.
- Dates.
- Set codes.
- Collector numbers.
- Finish labels.
- Quantities.
- Percentages.
- Actions.
- Headers.

Use ellipsis to protect scanning, not to hide essential decision data.

## Column Naming

Column names should be short and stable.

Preferred table labels:

- Card
- Set
- No.
- Finish
- Qty
- Price
- Entry
- Target
- Delta
- Hold
- Value
- P/L
- Notes
- Action
- Source
- Type
- Date
- Detail

Avoid verbose headers. If a concept needs explanation, use Help, title text, Card Detail, or surrounding context instead of a long header.

## Money Formatting

Money should be readable and compact.

Rules:

- Use `$` for USD values.
- Use two decimals where precision matters.
- Use whole-dollar table formatting where compact scan value matters and cents are not critical.
- Use signed money for gain/loss and cash-flow direction where appropriate.
- Do not show `NaN`, `undefined`, or blank numeric states.
- Use `-` only when absence is meaningful and expected.
- Keep money values single-line.

The app currently uses Scryfall USD pricing as a snapshot/reference, not a complete market price engine.

## Button Conventions

Buttons should communicate action clearly without creating visual noise.

Rules:

- Use compact text buttons for explicit commands.
- Reserve table row action buttons for state-changing or navigational actions.
- Use destructive styling only for destructive actions.
- Confirmation is required before destructive or data-replacing actions.
- Do not make entire dense rows perform destructive state changes.
- Card names may open preview/detail surfaces depending on the workflow contract; do not change established click behavior casually.

Common labels should stay short: `Buy`, `Sell`, `Delete`, `Remove`, `Add`, `Select`, `Reset`, `Export`, `Import`, `Help`, `Detail`.

## Modal Conventions

Modals should preserve context and complete focused work.

Rules:

- Card Detail is the main command-center modal.
- Confirmation dialogs should preview impact before data changes.
- Import/restore flows must require explicit confirmation.
- Modals should not become hidden navigation systems.
- Close behavior should return the user to the same workflow context.
- Modal body copy may wrap normally.

## Copy Style

ManaSpec copy should be direct and operational.

Use:

- Short labels.
- Concrete workflow nouns.
- Clear empty states.
- Friendly but concise warnings.
- Actionable status messages.

Avoid:

- Marketing copy.
- Long onboarding explanations inside the app.
- Claims that ManaSpec predicts outcomes.
- Buy/sell advice.
- Decorative phrasing that slows scanning.

Help can explain workflows. Primary app surfaces should let the workflow be used.
