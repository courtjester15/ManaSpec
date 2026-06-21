# 2026-06-20 Workflow Pass Architect Review

Source: user notes session. Context only; no implementation requested.

## General Theme

ManaSpec is moving from feature-building toward beta refinement. Most notes are now about workflow clarity, information hierarchy, dashboard usefulness, signals usefulness, table scan efficiency, and terminology consistency rather than core bugs.

## Main Themes

- Dashboard purpose still needs definition: decide whether it is a command center, attention center, or portfolio summary.
- Dashboard rows and panels should explain why specific Radar ideas or Signals appear.
- Signals should communicate both why attention is needed and what workflow is likely next: buy, sell, review, market check, or add plan.
- Signals summary tiles filtering the table is the preferred direction; actual buy/sell actions should remain in Radar, Positions, or Card Detail.
- Target-distance metrics are becoming important for both Radar and Positions, preferably as red/green values rather than wording such as "away."
- Current price and manual Market Check price need clearer source/timestamp explanation.
- Positions context tiles need future review; Notes as a Positions tile may not be useful enough.
- Editable fields may eventually need a static-display-first, click-to-edit spreadsheet-style treatment.
- Notes indicator preference is a notepad icon with dim/bright states and optional count badge.
- Hold-time inputs should preserve simple ranges such as `6-12` and `12-18`.
- Tables may need vertical alignment review and density cleanup, including centered quantity values and narrower age columns.
- Use "summary tiles" for small metric boxes and "panels" for larger containers to avoid confusion with Magic cards.
- Snapshots are a system capability, not a module, and may become important for beta decision support.
- Sealed product remains interesting, but should stay separate from singles and not force a singles workflow redesign later.

## Not In Scope From These Notes

- No implementation requested.
- Do not treat these notes as active requirements until they are promoted into `docs/README.md`, `docs/ROADMAP.md`, or a specific implementation batch.
