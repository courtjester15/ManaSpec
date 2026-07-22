# Radar Tabulator Layout Correction

## Metadata

- **Status:** Completed
- **Date:** 2026-07-19
- **Brief Size:** Small
- **Related Documents / Issues:** `docs/REACT_MIGRATION_NOTES.md`, `docs/REACT_SPIKE_PROGRESS.md`, `docs/STYLE_GUIDE.md`
- **Approver:** Project owner

This brief is an implementation plan, not an implementation log. Record completed work, deviations, validation results, and evidence in the project's designated completion record.

## 1. Objective

Complete the Radar Tabulator full-width correction by retaining Card as the single flexible scan column, keeping genuinely compact utility columns fixed, and returning redraw ownership to Tabulator. Success means the column definitions—not CSS or manual redraw timing—produce the intended layout.

## 2. Background

The Radar pilot initially left unused horizontal space because all columns were fixed-width. Tabulator's `fitColumns` mode distributes remaining width only among columns without an explicit `width`. The current working tree already removes Card's explicit width and assigns `minWidth` plus `widthGrow`; this pass preserves that correction and removes the subsequently added manual `tableBuilt` redraw workaround.

## 3. Scope

The follow-up live-instance audit refined the implementation cause: Radar's width values survive wrapper input and `table.getColumnDefinitions()`, but the wrapper emits `minWidth: undefined` for compact columns. Tabulator treats that present-but-undefined property as an override of its native default, producing `NaN` during runtime width calculation. The approved correction is therefore to omit undefined library options at the shared boundary.

### In Scope

- Preserve Card as Radar's only flexible column.
- Preserve compact fixed widths where warranted.
- Remove the shared wrapper's manual post-build redraw workaround.
- Preserve Tabulator defaults by omitting optional wrapper properties that ManaSpec has not intentionally defined.
- Validate source, tests, builds, and generated artifacts.

### Out of Scope

- Migrating another module.
- Adding or removing compensating table CSS.
- Redesigning Radar, changing data behavior, or performing the broader customization audit.

## 4. Existing Architecture

Radar uses the shared React `TabulatorTable` wrapper with Tabulator's native `fitColumns`, sorting, editing, resize, and data-replacement behavior. ManaSpec supplies data, column definitions, formatters, actions, and theme CSS. Vanilla Radar uses one flexible CSS-grid Card track with fixed compact tracks and remains the visual reference.

## 5. Existing Research / Decisions

- `docs/REACT_MIGRATION_NOTES.md`
- `docs/REACT_SPIKE_PROGRESS.md`
- Root-cause review: `fitColumns` requires at least one non-fixed column to absorb remaining width.

## 6. Assumptions

- Radar is mounted visibly when Tabulator initializes.
- Tabulator's registered resize and layout modules own normal construction and container-resize calculations.

## 7. Dependencies

- Imported QA data on `http://127.0.0.1:5173/` for final visual verification.
- A functioning browser-control bridge or project-owner visual confirmation.

## 8. Risks

- **Risk:** Removing manual redraw timing could expose an undiscovered hidden-container initialization case.
  - **Mitigation:** Keep native `ResizeTableModule`, `fitColumns`, and `layoutColumnsOnNewData`; validate the visible Radar route and retain the small diff for easy rollback.
- **Risk:** Fixed utility widths plus Card's minimum can overflow at narrower viewports.
  - **Mitigation:** Do not change responsive behavior in this brief; verify the standard 1366 x 768 target and leave the existing mobile policy unchanged.

## 9. Constraints

- Tabulator owns sizing, redraws, sorting, editing, row mechanics, and responsive behavior.
- ManaSpec provides only column intent, domain renderers/actions, and theming.
- Do not add another CSS or timing workaround.
- Do not alter existing compensating CSS during this pass.

## 10. Likely Files to Review

- `react-app/src/features/shared/TabulatorTable.jsx`
- `react-app/src/features/views/Views.jsx`
- `react-app/src/styles/tabulator.css`
- `css/tables.css`

## 11. Likely Files to Modify

- `react-app/src/features/shared/TabulatorTable.jsx`
- `docs/REACT_SPIKE_PROGRESS.md`
- Generated React deployment artifacts after validation

## 12. Implementation Expectations

- Keep the implementation centralized in the shared wrapper and Radar column definitions.
- Prefer native Tabulator configuration over DOM/CSS intervention.
- Treat the wrapper as an adapter: pass deliberate application intent and leave omitted library behavior to Tabulator.
- Avoid unrelated cleanup and leave non-Radar tables unchanged.

## 13. Acceptance Criteria

- [x] Card has `minWidth` and `widthGrow` with no explicit `width`.
- [x] Compact utility columns retain intentional fixed widths.
- [x] Undefined wrapper options no longer override Tabulator defaults.
- [x] No manual `tableBuilt` redraw or animation-frame redraw remains.
- [x] No table CSS is added or removed.
- [x] Radar remains the only Tabulator-migrated module.
- [x] Radar visually fills the standard 1366 x 768 container with compact density.

## 14. Validation Plan

### Functional

- Run lint, format checks, focused tests, and production builds.
- Verify sorting, Entry editing, quantity controls, indicators, Buy, and Remove remain wired.

### Visual / Responsive

- Compare React Radar with vanilla at 1366 x 768 using imported representative data.
- Confirm Card absorbs remaining width and compact columns remain tight.

### Regression / Compatibility

- Confirm Positions, Signals, Transactions, and History remain on the interim shared table.
- Regenerate and syntax-check Pages and portable artifacts.

### Quality and Edge Cases

- Confirm the source contains no new CSS sizing or redraw workaround.
- Record any browser-tooling limitation rather than claiming unobserved visual evidence.

## 15. Documentation Updates

- Record actual completion and validation status in `docs/REACT_SPIKE_PROGRESS.md`.

## 16. Deliverables

- [ ] Native Tabulator sizing contract retained
- [ ] Manual redraw workaround removed
- [ ] Existing behavior preserved
- [ ] Documentation and generated artifacts updated as applicable
- [ ] Validation completed and results recorded

## 17. Suggested Commit

`fix(react): let Tabulator own Radar column layout`

## 18. Recommended Next Task

After visual approval, classify shared table customizations as native configuration, ManaSpec theming, or justified compatibility/workaround code. This audit is outside the current brief.
