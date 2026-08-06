# React Remaining Tabulator Migrations

## Metadata

- **Status:** Completed
- **Date:** 2026-07-29; completed 2026-08-02
- **Brief Size:** Standard
- **Related Documents / Issues:** [GitHub Issue #11](https://github.com/courtjester15/ManaSpec/issues/11), [Issue #11 acceptance correction](https://github.com/courtjester15/ManaSpec/issues/11#issuecomment-5138733389), [React Modernization Spike](REACT_MIGRATION_NOTES.md), [React Spike Architecture](REACT_SPIKE_ARCHITECTURE.md), [React Positions Tabulator Brief](REACT_POSITIONS_TABULATOR_BRIEF.md)
- **Author:** Codex
- **Approver:** Project owner through Issue #11

This brief is an implementation plan, not an implementation log. Record completed work, deviations, validation results, and evidence in the project's designated completion record.

## 1. Objective

Migrate the React Signals, Transactions, and History routes from the interim `DataTable` to the existing shared `TabulatorTable`. Success means all three routes preserve their current behavior and vanilla-aligned visual density, each route lands in its own independently reviewable commit, and no production route still consumes `DataTable`.

## 2. Background

Radar proved the shared Tabulator boundary as the Phase 1 pilot, and Positions proved it as the first Phase 2 migration. The wrapper now owns grid lifecycle, sorting mechanics and accessibility state, pagination behavior, compact geometry, row/action isolation, empty states, and responsive table behavior. Routes retain data derivation, filtering, columns, presentation formatters, editors, navigation, and business workflows.

Signals, Transactions, and History are the final production consumers of the interim `DataTable`. Issue #11 approves migrating all three sequentially as one adoption batch without redesigning their workflows or reopening their domain logic.

## 3. Scope

### In Scope

- Migrate Signals to `TabulatorTable`, preserving deterministic queue membership, filters, presentation, exact navigation, external Scryfall access, and row/action isolation.
- Migrate Transactions to `TabulatorTable`, preserving compatible ledger records, filters, ordering, values, labels, exact printing identity, and Card Detail navigation.
- Migrate History to `TabulatorTable`, preserving event derivation, filters, ordering, values, notes/details, exact identity, and Card Detail navigation.
- Add only route-scoped table configuration and styling required to preserve the established dense-table contract.
- In a final separate cleanup commit, restore the proper compact vanilla-aligned search/filter controls for Signals, Transactions, and History.
- Audit the five table routes' `view heading → module search/filter/action context → Tabulator header` chains, then establish one consistent desktop context rhythm and table-header starting position.
- Give the Signals action band a controlled vanilla-like height that contains the intended maximum of three preview rows through compact spacing, truncation, and overflow containment.
- Remove `DataTable` and its dead table-contract styling if it has no remaining production consumers after all three migrations.
- Regenerate the tracked Pages and portable artifacts after the final route.
- Record combined validation and current implementation state in the existing owning documentation.

### Out of Scope

- Redesigning Signals, Transactions, or History.
- Changing Signals derivation, thresholds, triage semantics, or Dashboard queue behavior.
- Changing transaction, history, persistence, backup, import, or domain models.
- Merging History and Transactions.
- Adding exports, grouping, movable columns, spreadsheet editing, or other new Tabulator capabilities.
- Broad responsive, app-shell, Card Detail, React promotion, or deployment-source changes.
- Reducing Signals tile previews below three or making other modules arbitrarily taller to compensate for Signals.

## 4. Existing Architecture

`react-app/src/features/shared/TabulatorTable.jsx` is the ManaSpec-owned adapter around modular Tabulator. It clones route-owned rows, maps route column configuration to Tabulator definitions, hosts React-rendered cell content, isolates interactive controls from row activation, synchronizes active sort accessibility state, and owns optional local pagination.

`react-app/src/features/views/Views.jsx` owns all three route selectors, filters, columns, formatters, navigation, and modal behavior. `react-app/src/styles/tabulator.css` owns shared compact grid styling plus narrowly scoped route variations. The compatibility-backed application state and related-record resolver remain unchanged.

## 5. Existing Research / Decisions

- [React Positions Tabulator Brief](REACT_POSITIONS_TABULATOR_BRIEF.md) defines the proven route/wrapper boundary.
- [Radar Tabulator Layout Brief](RADAR_TABULATOR_LAYOUT_BRIEF.md) records the shared layout and native-default findings.
- [React Spike Progress](REACT_SPIKE_PROGRESS.md) records the completed Radar and Positions migrations and verification.
- [Workflow Library Integration Rule](WORKFLOW.md#library-integration-rule) requires native library configuration before compatibility mechanics.
- GitHub Issue #11 is the approved scope and delivery contract for this batch.

## 6. Assumptions

- The existing `TabulatorTable` column API can express all three route requirements without expansion.
- Existing route-owned selectors and inline event derivation remain authoritative for this migration.
- The current integration branch is the correct base and PR target.
- The existing untracked `.tmp/` directory is unrelated user workspace state and must remain untouched and uncommitted.

## 7. Dependencies

- Existing `tabulator-tables` 6.5.2 dependency and shared wrapper.
- Existing React route, state, storage, and related-record boundaries.
- Existing focused Node tests and Vite build scripts.
- Codex in-app Browser for route and cross-table verification.

## 8. Risks

- **Risk:** Column widths that worked in the interim HTML table may overflow or truncate under Tabulator's fit calculations.
  - **Mitigation:** Use the proven fixed-utility/flexible-description configuration, keep native defaults intact, and verify every sortable header at 1366 x 768.
- **Risk:** Interactive cell controls could activate the row and open Card Detail.
  - **Mitigation:** Preserve the wrapper's interactive-selector boundary and explicitly exercise Signals actions and external links.
- **Risk:** Sorting formatted money, dates, or derived values could become lexical rather than semantic.
  - **Mitigation:** Supply route-owned `sortValue` functions for formatted or derived fields and test multiple columns.
- **Risk:** Removing `DataTable` could break an overlooked consumer or mobile styling.
  - **Mitigation:** Remove it only after repository-wide consumer search and complete combined desktop/narrow-width QA.
- **Risk:** Signals' three-row action tiles could make its context region taller than other table routes.
  - **Mitigation:** Measure the complete vertical chain on all five routes before changing CSS, then correct the Signals tile geometry and shared route-context rhythm at their actual owners.
- **Risk:** Generated artifacts could obscure the independently reviewable route commits.
  - **Mitigation:** Regenerate and commit artifacts once in an optional final cleanup/documentation commit.

## 9. Constraints

- Preserve vanilla behavior and visual rhythm as the comparison target.
- Preserve exact printing and finish identity and all compatible stored/imported records.
- Keep business logic, filters, navigation, and column definitions route-owned.
- Do not expand the wrapper API without a concrete requirement that existing configuration cannot express.
- Maintain 28 px headers, 27 px rows, single-line dense cells, active-only sort indicators, and no desktop document/table overflow.
- Preserve the maximum of three Signals preview rows while containing the action band at a compact vanilla-like height.
- Keep all business filtering route-owned and outside the Tabulator wrapper.
- Preserve a contained responsive presentation without new document-level overflow.
- Keep each route migration independently reviewable and revertible.

## 10. Likely Files to Review

These are implementation guidance only. Contributors should review additional files when required.

- `react-app/src/features/shared/TabulatorTable.jsx`
- `react-app/src/features/shared/ui.jsx`
- `react-app/src/features/views/Views.jsx`
- `react-app/src/styles/tabulator.css`
- `react-app/src/styles/react.css`
- `react-app/src/domain/signals.js`
- `react-app/src/domain/relatedRecords.js`
- `react-app/src/domain/trading.js`
- `react-app/src/test/signals.test.js`
- `react-app/src/test/relatedRecords.test.js`
- `react-app/src/test/trading.test.js`

## 11. Likely Files to Modify

These are implementation guidance only. Contributors should review and modify additional files when required.

- `react-app/src/features/views/Views.jsx`
- `react-app/src/features/shared/ui.jsx`
- `react-app/src/styles/tabulator.css`
- `react-app/src/styles/react.css`
- `react-app/dist-portable/`
- `react-spike/`
- `docs/REACT_SPIKE_PROGRESS.md`
- `docs/REACT_PARITY_LOG.md`
- `docs/REACT_MIGRATION_NOTES.md`
- `docs/REACT_SPIKE_ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `CHANGELOG.md`
- `HISTORY.md`

## 12. Implementation Expectations

- Implement Signals, Transactions, and History sequentially.
- Use route column configuration for widths, formatters, sort adapters, actions, and descriptive-cell flexibility.
- Run focused tests, source policy, formatting, and route browser verification before each route commit.
- Keep shared changes narrow and defer removal of `DataTable` until the final consumer is migrated.
- After all three route commits, review all five table surfaces together before final cleanup and artifact generation.
- Before final cleanup CSS, record the five-route vertical-chain measurements and use them to locate the correction.
- Keep the acceptance correction, dead-table cleanup, documentation, and generated artifacts in the final separate cleanup commit.
- Do not include unrelated cleanup or the existing `.tmp/` directory.

## 13. Acceptance Criteria

- [ ] Signals uses `TabulatorTable` and preserves queue membership, filtering/reset, presentation, exact navigation, Scryfall access, and row/action isolation.
- [ ] Transactions uses `TabulatorTable` and preserves filtering, identity, ordering, values, labels, and available Card Detail navigation.
- [ ] History uses `TabulatorTable` and preserves derivation, filtering, ordering, identity, presentation, and available Card Detail navigation.
- [ ] Each route migration is a separate clean commit on one branch.
- [ ] At 1366 x 768, all three routes have compact headers/rows, complete active-sort labels, correct `aria-sort`, working multi-column sorting, and no document/table horizontal overflow.
- [ ] All three routes have clear empty states, expected footer behavior, isolated interactive controls, and a clean console.
- [ ] A narrow-width smoke check shows no new document-level overflow or broken route shell.
- [ ] Radar and Positions do not regress under the shared-table review.
- [ ] Signals, Transactions, and History expose their proper compact vanilla-aligned route search/filter controls.
- [ ] Signals retains up to three preview rows per tile, and its zero-, one-, and three-row states remain contained within a controlled compact action-band height.
- [ ] Radar, Positions, Signals, Transactions, and History start their table headers at the same intended desktop vertical position.
- [ ] No production route consumes `DataTable`; dead interim table code and styling are removed.
- [ ] Focused tests, full tests, lint, format, all builds, and generated JavaScript syntax checks pass.

## 14. Validation Plan

### Functional

- After Signals: run Signals and related-record tests; verify bucket, exact-row, search, reset, Detail, View, Scryfall, row activation, and multi-column sorting.
- After Transactions: run trading and related-record tests; verify search/type filtering, numeric/date/type sorting, values, identity, and available Card Detail row activation.
- After History: run related-record and storage tests; verify search/type filtering, date/type/value/detail sorting, event presentation, identity, and available Card Detail row activation.
- Run full `npm test`, `npm run lint`, and `npm run format:check` before completion.

### Visual / Responsive

- Compare Signals, Transactions, and History against vanilla at 1366 x 768 with representative imported data.
- Measure and record `view heading → module search/filter/action context → Tabulator header` for Radar, Positions, Signals, Transactions, and History before final correction CSS.
- Compare Signals against vanilla with zero, one, and three preview rows and preserve the three-row maximum.
- Verify restored Signals, Transactions, and History route controls, active filters, counts, and reset behavior.
- Confirm no table or document horizontal overflow, 28 px headers, 27 px rows, single-line utility fields, flexible descriptive columns, and active sort labels.
- Smoke-test each route at a narrow representative viewport and confirm the route shell remains contained.

### Regression / Compatibility

- Review Radar and Positions after all three migrations.
- Confirm no storage, schema, backup, import, or data-model code changed.
- Generate normal, Pages, and portable builds; refresh tracked artifacts once after the final route.
- Run `node --check` against generated Pages and portable JavaScript.

### Quality and Edge Cases

- Verify empty states and single-page footer suppression.
- Verify rows lacking resolvable exact printing identity do not open the wrong Card Detail.
- Verify links, buttons, and controls never trigger row activation.
- Verify console output is free of React warnings and errors.

Record actual results and evidence in the project's completion records; do not treat this plan as proof that validation occurred.

## 15. Documentation Updates

Update the existing React progress, parity, architecture/charter status, roadmap, Changelog, and History only where the completed migration changes current project truth. Do not create a second completion log.

## 16. Deliverables

- [ ] Signals migration committed independently
- [ ] Transactions migration committed independently
- [ ] History migration committed independently
- [ ] Dead interim table removed after the final consumer
- [ ] Combined five-table review completed
- [ ] Tracked Pages and portable artifacts regenerated
- [ ] Existing behavior preserved
- [ ] Documentation updated and validation results recorded

## 17. Suggested Commit

Route commits:

- `feat(react): migrate Signals to shared Tabulator`
- `feat(react): migrate Transactions to shared Tabulator`
- `feat(react): migrate History to shared Tabulator`

Optional final checkpoint:

- `docs(react): complete remaining table migration batch`

## 18. Recommended Next Task

Review the completed React application against the remaining promotion gates and decide whether to formally make React the production frontend. That decision is outside Issue #11.
