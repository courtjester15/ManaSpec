# Table Row Contract Regression Note

## Context

During the Target / Hold display cleanup, Radar table rows began to look vertically clipped or bottom-heavy.

The regression came from changing display-mode editable cells to look like plain text while also removing sizing rules that were quietly preserving the shared table row rhythm.

## Key Lesson

Radar, Positions, Signals, Transactions, and History share the standard table renderer and table CSS.

Shared renderer does not automatically mean shared visual metrics. Each cell type still has its own DOM and CSS path:

- plain text cells
- link cells
- editable display cells
- editable input cells
- steppers
- note controls
- action buttons

All of them need to obey the same row-height contract.

## Fragile Area

`.ms-table__editable-display` should look like normal table data in display mode, but it still needs an invisible sizing box:

- stable height
- stable min-height
- horizontal padding
- transparent border or equivalent box sizing
- consistent line-height

Removing those rules can make the whole row feel vertically misaligned, because the dense table layout depends on row height, cell padding, inner control height, line-height, and overflow all lining up.

## Keep

These UX goals are still good:

- Target display should not ellipsize.
- Hold display should be compact, like `6 mo` or `12-18 mo`.
- Display mode should not look like a permanent input.
- Edit mode should activate intentionally on click.
- Larger money values can show without `.00` during table scanning.

## Guardrail

Before committing future table polish, verify at 1366px:

- Radar
- Positions
- Signals
- Transactions
- History

Check:

- row text is vertically centered
- no bottom clipping
- money columns remain right-aligned with readable right padding
- editable display mode still opens edit mode
- no horizontal overflow

