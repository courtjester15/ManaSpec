# React Shared Table and App-Shell Visual Parity

## Metadata

- **Status:** Ready
- **Date:** 2026-07-27
- **Brief Size:** Standard
- **Related Documents / Issues:** [Issue #10](https://github.com/courtjester15/ManaSpec/issues/10), `docs/REACT_MIGRATION_NOTES.md`, `docs/REACT_SPIKE_ARCHITECTURE.md`, `docs/STYLE_GUIDE.md`, `docs/WORKFLOW.md`
- **Author:** Codex
- **Approver:** Project owner approval supplied in the Issue #10 implementation request

This brief is an implementation plan, not an implementation log. Record completed work, deviations, validation results, and evidence in the project's designated completion record.

## 1. Objective

Bring the React shared Tabulator foundation, Radar table/filter surface, and app-shell controls into visual and interaction parity with the current vanilla ManaSpec implementation. Success means Radar is the reusable reference configuration, shared improvements flow to Positions without Position business-logic changes, and vanilla remains the parity oracle.

## 2. Background

Radar is the Phase 1 consumer of the shared React `TabulatorTable`; Positions is paused in PR #9 as the first Phase 2 consumer. Side-by-side review at 1366 x 768 shows that React still displays inactive sort arrows, uses looser or differently aligned shared controls, includes an unapproved OWNED badge, duplicates the Radar search submit button, reduces Radar filtering to a generic search panel, and diverges from vanilla shell button styling. These are recurring foundation rules rather than Radar-only mechanics.

## 3. Scope

### In Scope

- Establish shared Tabulator header, row, cell, editor, Card, indicator, and action density/alignment from vanilla.
- Show a sort indicator only on the active sorted column and reserve label space so the indicator cannot obscure text.
- Preserve one flexible Card column and fixed compact utility columns.
- Remove the React-only OWNED badge.
- Restore the vanilla-aligned blue global Search button and navigation geometry.
- Remove the local Radar search submit button while preserving keyboard submission and Scryfall discovery behavior.
- Restore the compact Radar filter heading/control layout and functional vanilla-aligned filters.
- Align Radar labels, widths, icons, and compact Buy/Remove actions with vanilla.
- Regenerate tracked Pages and portable artifacts and record validation evidence.
- After the Issue #10 implementation is ready, update PR #9 so Positions inherits shared changes without reopening Position domain logic.

### Out of Scope

- Migrating Signals, Transactions, or History to Tabulator.
- Changing Radar or Position storage, trading, identity, calculation, or reconciliation semantics.
- Redesigning the vanilla application.
- Adding general-purpose wrapper APIs without a demonstrated parity need.
- React promotion or production cutover.

## 4. Existing Architecture

`react-app/src/features/shared/TabulatorTable.jsx` owns Tabulator lifecycle, column adaptation, React cell rendering, sorting, editing, row activation, and responsive fallback. `react-app/src/styles/tabulator.css` owns its visual contract. Radar supplies domain rows and a declarative column definition in `Views.jsx`. Shared shell markup is in `AppShell.jsx`, while legacy style imports provide the vanilla baseline and `react.css` contains React-specific overrides.

## 5. Existing Research / Decisions

- Issue #10 explicitly makes vanilla the visual and interaction source of truth.
- `docs/REACT_MIGRATION_NOTES.md` keeps Radar as the Phase 1 reference and Positions as the first Phase 2 consumer.
- `docs/WORKFLOW.md` requires reuse-first UI work, library-native behavior, 1366 x 768 table checks, and side-by-side browser validation.
- Existing paired Radar screenshots and a fresh local vanilla inspection identify the concrete geometry and control differences.

## 6. Assumptions

- The current vanilla Radar implementation is authoritative for filter semantics, table labels, and compact desktop geometry.
- Native Tabulator sorting remains library-owned; CSS may theme the active indicator without replacing sorting mechanics.
- Radar filter state may remain view-local because it is UI state and does not alter persisted records.

## 7. Dependencies

- Existing `tabulator-tables` 6.5.2 dependency and shared wrapper.
- Current React integration baseline (`codex/react-modernization-integration`).
- PR #9 branch (`codex/react-positions-tabulator`) for the inheritance update after the foundation commit.

## 8. Risks

- **Risk:** Shared CSS could regress Positions or future consumers.
  - **Mitigation:** Keep rules on shared semantic classes, then validate Radar and PR #9 Positions at 1366 x 768.
- **Risk:** Recreating library mechanics could destabilize sorting or sizing.
  - **Mitigation:** Preserve Tabulator sorting/layout ownership and avoid wrapper lifecycle workarounds.
- **Risk:** A visual filter replica could silently diverge functionally.
  - **Mitigation:** Port vanilla filter predicates and verify representative controls against fixture-backed rows.
- **Risk:** Generated artifacts could become stale.
  - **Mitigation:** Run all prescribed builds and refresh both tracked delivery outputs.

## 9. Constraints

- Preserve local-first data compatibility and Radar workflows.
- Match compact desktop behavior at 1366 x 768 before smaller viewport review.
- Maintain keyboard-accessible labels, submission, sorting, editing, and actions.
- Do not touch Position business logic while updating PR #9.
- Keep vanilla root unchanged and operational.

## 10. Likely Files to Review

- `js/modules/radar/radar.js`
- `js/modules/card-filters/card-filters.js`
- `js/ui/table.js`
- `css/forms.css`
- `css/tables.css`
- `react-app/src/features/shared/TabulatorTable.jsx`
- `react-app/src/features/shared/ui.jsx`
- `react-app/src/features/views/Views.jsx`
- `react-app/src/layouts/AppShell.jsx`
- `react-app/src/styles/react.css`
- `react-app/src/styles/tabulator.css`

## 11. Likely Files to Modify

- `react-app/src/features/views/Views.jsx`
- `react-app/src/layouts/AppShell.jsx`
- `react-app/src/styles/react.css`
- `react-app/src/styles/tabulator.css`
- Focused React tests if pure filter behavior is extracted
- React progress/parity/architecture and project history/changelog documents
- Generated `react-spike/` and `react-app/dist-portable/` artifacts

## 12. Implementation Expectations

- Keep the existing shared wrapper; solve visual rules with shared CSS and declarative column configuration.
- Use view-local Radar filtering patterned on vanilla rather than changing persisted data.
- Prefer native form submission and native Tabulator sorting/editing.
- Keep module-specific values limited to labels, widths, and domain rendering.
- Make no unrelated cleanup.

## 13. Acceptance Criteria

- [ ] Shared Tabulator headers, rows, cells, editors, indicators, and actions match vanilla density and alignment.
- [ ] Only the active sort column shows an indicator, and labels remain unobscured.
- [ ] Card is the sole flexible descriptive column; compact columns keep intentional widths.
- [ ] The OWNED badge is absent.
- [ ] Global Search is blue and navigation geometry/centering matches vanilla.
- [ ] Radar has no duplicate local Search button; Enter still submits discovery.
- [ ] Radar exposes the compact vanilla-aligned Filter Radar controls with working filters and reset behavior.
- [ ] Radar columns, icons, and compact actions visually match vanilla without workflow or data changes.
- [ ] PR #9 Positions inherits the shared improvements without Position domain changes.

## 14. Validation Plan

### Functional

- Run `npm test`, `npm run lint`, and `npm run format:check` in `react-app/`.
- Verify Radar search submits with Enter, filters combine/reset, sorting changes active indicator, Entry remains editable, quantity stepper works, and row/detail/Buy/Remove actions remain isolated.

### Visual / Responsive

- Serve vanilla from the repository root with `python -m http.server 8000`.
- Run the React development or preview workflow documented by the project.
- Compare vanilla and React Radar side-by-side at 1366 x 768 throughout implementation.
- Confirm header/row geometry, label visibility, one flexible Card column, no horizontal overflow, compact toolbar/filter/action alignment, and app-shell parity.
- Smoke tablet and phone responsive fallback after desktop parity.

### Regression / Compatibility

- Run normal, Pages, and portable builds; refresh tracked artifacts.
- Confirm vanilla root still loads.
- Apply the shared foundation commit to PR #9 and validate Positions without modifying Position business logic.

### Quality and Edge Cases

- Check empty Radar state, long card/header labels, inactive/active sort headers, zero/missing plan values, filter combinations, and keyboard focus/accessibility names.
- Review browser console errors and warnings.

Record actual results and evidence in the project's designated completion record; do not treat this plan as proof that validation occurred.

## 15. Documentation Updates

Update the React architecture/progress/parity records, Roadmap/Decisions where status or rationale changes, Changelog, and History milestone record. Keep this brief as the approved plan rather than a completion log.

## 16. Deliverables

- [ ] Requested shared foundation, shell, and Radar parity implementation completed
- [ ] Existing behavior preserved except for the approved visual/interaction corrections
- [ ] PR #9 updated to inherit the shared improvements
- [ ] Applicable documentation and tracked artifacts updated
- [ ] Validation completed and results recorded

## 17. Suggested Commit

`fix(react): align shared tables and shell with vanilla`

## 18. Recommended Next Task

Continue separately approved table migrations only after Radar and Positions demonstrate that the shared foundation is stable.
